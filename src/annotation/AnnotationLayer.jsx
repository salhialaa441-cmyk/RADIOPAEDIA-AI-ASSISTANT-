import { useState, useRef } from 'react';
import { Layer, Rect, Circle, Line } from 'react-konva';
import './AnnotationLayer.css';

export default function AnnotationLayer({
  annotations,
  selectedTool,
  selectedLabel,
  onAnnotationComplete,
  onAnnotationSelect,
  selectedAnnotationId,
  imageDimensions,
}) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState(null);
  const [points, setPoints] = useState([]);
  const layerRef = useRef(null);

  // Get stage coordinates accounting for scale
  function getStageCoordinates(stage) {
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return { x: 0, y: 0 };

    // stage.scaleX() and stage.scaleY() return the scale values
    const scaleX = stage.scaleX();
    const scaleY = stage.scaleY();

    return {
      x: pointerPos.x / scaleX,
      y: pointerPos.y / scaleY,
    };
  }

  // Handle mouse down for starting drawing
  function handleMouseDown(e) {
    if (!selectedTool || !selectedLabel) return;
    if (selectedTool === 'polygon') return; // Polygon uses onClick

    const stage = e.target.getStage();
    const { x, y } = getStageCoordinates(stage);

    if (selectedTool === 'bbox') {
      setIsDrawing(true);
      setCurrentShape({
        type: 'bbox',
        x,
        y,
        width: 0,
        height: 0,
        label: selectedLabel,
        id: Date.now(),
      });
    } else if (selectedTool === 'brush') {
      setIsDrawing(true);
      setPoints([{ x, y }]);
    } else if (selectedTool === 'keypoint') {
      const keypoint = {
        type: 'keypoint',
        x,
        y,
        label: selectedLabel,
        id: Date.now(),
      };
      onAnnotationComplete(keypoint);
    }
  }

  function handleMouseMove(e) {
    if (!isDrawing) return;

    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    const scale = stage.scale();
    const x = pointerPos.x / scale.x;
    const y = pointerPos.y / scale.y;

    if (selectedTool === 'bbox' && currentShape) {
      setCurrentShape({
        ...currentShape,
        width: x - currentShape.x,
        height: y - currentShape.y,
      });
    } else if (selectedTool === 'brush') {
      setPoints([...points, { x, y }]);
    }
  }

  function handleMouseUp(e) {
    if (!isDrawing) return;

    if (selectedTool === 'bbox' && currentShape) {
      // Normalize bbox (handle negative width/height)
      const normalizedShape = {
        ...currentShape,
        x: currentShape.width < 0 ? currentShape.x + currentShape.width : currentShape.x,
        y: currentShape.height < 0 ? currentShape.y + currentShape.height : currentShape.y,
        width: Math.abs(currentShape.width),
        height: Math.abs(currentShape.height),
      };

      if (normalizedShape.width > 5 && normalizedShape.height > 5) {
        onAnnotationComplete(normalizedShape);
      }
      setCurrentShape(null);
    } else if (selectedTool === 'brush' && points.length > 1) {
      const brushAnnotation = {
        type: 'brush',
        points,
        label: selectedLabel,
        id: Date.now(),
      };
      onAnnotationComplete(brushAnnotation);
      setPoints([]);
    }

    setIsDrawing(false);
  }

  function handlePolygonClick(e) {
    if (selectedTool !== 'polygon') return;

    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    const scale = stage.scale();
    const x = pointerPos.x / scale.x;
    const y = pointerPos.y / scale.y;

    setPoints([...points, { x, y }]);
  }

  function closePolygon() {
    if (points.length < 3) return;

    const polygon = {
      type: 'polygon',
      points: points.map((p) => [p.x, p.y]).flat(),
      label: selectedLabel,
      id: Date.now(),
    };
    onAnnotationComplete(polygon);
    setPoints([]);
  }

  return (
    <Layer
      ref={layerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handlePolygonClick}
      onDblClick={closePolygon}
      onTap={handleMouseDown}
    >
      {/* Render existing annotations */}
      {annotations.map((annotation) => (
        <AnnotationShape
          key={annotation.id}
          annotation={annotation}
          isSelected={selectedAnnotationId === annotation.id}
          onSelect={() => onAnnotationSelect(annotation.id)}
        />
      ))}

      {/* Render current shape being drawn */}
      {selectedTool === 'bbox' && isDrawing && currentShape && (
        <Rect
          x={currentShape.x}
          y={currentShape.y}
          width={currentShape.width}
          height={currentShape.height}
          stroke={getLabelColor(selectedLabel)}
          strokeWidth={2}
          dash={[5, 5]}
          listening={false}
        />
      )}

      {/* Render polygon points */}
      {selectedTool === 'polygon' && points.length > 0 && (
        <>
          <Line
            points={points.map((p) => [p.x, p.y]).flat()}
            stroke={getLabelColor(selectedLabel)}
            strokeWidth={2}
            closed={false}
            listening={false}
          />
          {points.map((point, i) => (
            <Circle
              key={i}
              x={point.x}
              y={point.y}
              radius={4}
              fill={getLabelColor(selectedLabel)}
              listening={false}
            />
          ))}
          {points.length >= 3 && (
            <Line
              points={[points[points.length - 1].x, points[points.length - 1].y, points[0].x, points[0].y]}
              stroke={getLabelColor(selectedLabel)}
              strokeWidth={2}
              dash={[5, 5]}
              listening={false}
            />
          )}
        </>
      )}

      {/* Render brush strokes */}
      {selectedTool === 'brush' && points.length > 0 && (
        <Line
          points={points.map((p) => [p.x, p.y]).flat()}
          stroke={getLabelColor(selectedLabel)}
          strokeWidth={3}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
      )}
    </Layer>
  );
}

function AnnotationShape({ annotation, isSelected, onSelect }) {
  const commonProps = {
    onClick: onSelect,
    onTap: onSelect,
    stroke: getLabelColor(annotation.label),
    strokeWidth: isSelected ? 3 : 2,
  };

  if (annotation.type === 'bbox') {
    return (
      <Rect
        x={annotation.x}
        y={annotation.y}
        width={annotation.width}
        height={annotation.height}
        {...commonProps}
      />
    );
  }

  if (annotation.type === 'keypoint') {
    return (
      <>
        <Circle
          x={annotation.x}
          y={annotation.y}
          radius={6}
          fill={getLabelColor(annotation.label)}
          {...commonProps}
        />
        {annotation.label && (
          <Circle
            x={annotation.x + 10}
            y={annotation.y - 10}
            radius={12}
            fill="rgba(0,0,0,0.7)"
            listening={false}
          />
        )}
      </>
    );
  }

  if (annotation.type === 'polygon') {
    return (
      <Line
        points={annotation.points}
        closed
        {...commonProps}
      />
    );
  }

  if (annotation.type === 'brush') {
    return (
      <Line
        points={annotation.points.map((p) => [p.x, p.y]).flat()}
        stroke={getLabelColor(annotation.label)}
        strokeWidth={3}
        lineCap="round"
        lineJoin="round"
        {...commonProps}
      />
    );
  }

  return null;
}

// Label color mapping
const labelColors = {
  'Vertebra': '#FF6B6B',
  'C1': '#FF6B6B',
  'C2': '#FF6B6B',
  'LV': '#4ECDC4',
  'Myocardium': '#45B7D1',
  'Psoas': '#96CEB4',
  'default': '#FFEAA7',
};

function getLabelColor(label) {
  return labelColors[label] || labelColors['default'];
}
