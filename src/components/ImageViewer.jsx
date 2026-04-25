import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import PanelToolbar from './PanelToolbar';
import './ImageViewer.css';

export default function ImageViewer({ imageUrl, imageIndex, totalImages, onPrevious, onNext }) {
  const [image, setImage] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [tool, setTool] = useState('pan'); // 'pan', 'zoom', 'brightness'
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  // Load image when URL changes
  useEffect(() => {
    if (!imageUrl) return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
      // Reset zoom and position on new image
      setScale(1);
      setPosition({ x: 0, y: 0 });
    };
  }, [imageUrl]);

  // Handle container resize
  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    }

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Fit image to window
  function handleFit() {
    if (!image || !stageRef.current) return;

    const scaleX = containerSize.width / image.width;
    const scaleY = containerSize.height / image.height;
    const newScale = Math.min(scaleX, scaleY, 1);

    setScale(newScale);
    setPosition({
      x: (containerSize.width - image.width * newScale) / 2,
      y: (containerSize.height - image.height * newScale) / 2,
    });
  }

  // Handle wheel zoom
  function handleWheel(e) {
    e.evt.preventDefault();

    if (tool !== 'zoom') return;

    const scaleBy = 1.05;
    const stage = stageRef.current;
    const oldScale = scale;
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));

    setScale(clampedScale);
    setPosition({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  }

  // Handle drag
  function handleDragEnd(e) {
    if (tool !== 'pan') return;
    setPosition({
      x: e.target.x(),
      y: e.target.y(),
    });
  }

  return (
    <div className="image-viewer" ref={containerRef}>
      <PanelToolbar
        tool={tool}
        onToolChange={setTool}
        onFit={handleFit}
        zoom={scale}
        imageIndex={imageIndex}
        totalImages={totalImages}
        onPrevious={onPrevious}
        onNext={onNext}
      />

      <div className="canvas-container">
        <Stage
          ref={stageRef}
          width={containerSize.width}
          height={containerSize.height}
          onWheel={handleWheel}
          style={{ cursor: tool === 'pan' ? (isDragging ? 'grabbing' : 'grab') : tool === 'zoom' ? 'zoom-in' : 'default' }}
        >
          <Layer>
            {image && (
              <KonvaImage
                image={image}
                x={position.x}
                y={position.y}
                width={image.width * scale}
                height={image.height * scale}
                draggable={tool === 'pan'}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={(e) => {
                  handleDragEnd(e);
                  setIsDragging(false);
                }}
              />
            )}
          </Layer>
        </Stage>

        {!image && (
          <div className="loading-image">Loading image...</div>
        )}
      </div>
    </div>
  );
}
