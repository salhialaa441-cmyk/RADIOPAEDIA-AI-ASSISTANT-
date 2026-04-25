import { useState } from 'react';
import './AnnotationList.css';

export default function AnnotationList({ annotations, selectedAnnotationId, onSelectAnnotation, onDeleteAnnotation, onToggleVisibility }) {
  const [filter, setFilter] = useState('');
  const [visibleOnly, setVisibleOnly] = useState(false);

  const filteredAnnotations = annotations.filter((ann) => {
    if (visibleOnly && ann.hidden) return false;
    if (filter && !ann.label?.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  function getAnnotationSummary(annotation) {
    switch (annotation.type) {
      case 'bbox':
        return `${Math.round(annotation.width)}×${Math.round(annotation.height)}`;
      case 'polygon':
        return `${annotation.points.length / 2} vertices`;
      case 'keypoint':
        return 'Single point';
      case 'brush':
        return `${annotation.points.length} points`;
      default:
        return '';
    }
  }

  return (
    <div className="annotation-list">
      <div className="annotation-list-header">
        <h3>Annotations</h3>
        <span className="annotation-count">{annotations.length}</span>
      </div>

      <div className="annotation-filters">
        <input
          type="text"
          placeholder="Filter by label..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={visibleOnly}
            onChange={(e) => setVisibleOnly(e.target.checked)}
          />
          Visible only
        </label>
      </div>

      <div className="annotation-list-content">
        {filteredAnnotations.length === 0 ? (
          <div className="empty-annotations">
            <p>No annotations</p>
            <p className="hint">Select a label and draw on the image</p>
          </div>
        ) : (
          filteredAnnotations.map((annotation) => (
            <div
              key={annotation.id}
              className={`annotation-item ${selectedAnnotationId === annotation.id ? 'selected' : ''}`}
              onClick={() => onSelectAnnotation(annotation.id)}
            >
              <div className="annotation-color-indicator" style={{ background: getLabelColor(annotation.label) }} />

              <div className="annotation-info">
                <div className="annotation-label">{annotation.label || 'Unlabeled'}</div>
                <div className="annotation-meta">
                  <span className="annotation-type">{annotation.type}</span>
                  <span className="annotation-summary">{getAnnotationSummary(annotation)}</span>
                </div>
              </div>

              <div className="annotation-actions">
                <button
                  className="action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(annotation.id);
                  }}
                  title={annotation.hidden ? 'Show' : 'Hide'}
                >
                  {annotation.hidden ? '👁' : '👁'}
                </button>
                <button
                  className="action-btn delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAnnotation(annotation.id);
                  }}
                  title="Delete"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {annotations.length > 0 && (
        <div className="annotation-bulk-actions">
          <button className="bulk-btn" onClick={() => annotations.forEach((a) => onToggleVisibility(a.id))}>
            {annotations.every((a) => a.hidden) ? 'Show All' : 'Hide All'}
          </button>
          <button className="bulk-btn delete" onClick={() => {
            if (window.confirm('Delete all annotations?')) {
              annotations.forEach((a) => onDeleteAnnotation(a.id));
            }
          }}>
            Delete All
          </button>
        </div>
      )}
    </div>
  );
}

function getLabelColor(label) {
  const labelColors = {
    'Vertebra': '#FF6B6B',
    'C1': '#FF6B6B',
    'C2': '#FF6B6B',
    'LV': '#4ECDC4',
    'Myocardium': '#45B7D1',
    'Psoas': '#96CEB4',
    'default': '#FFEAA7',
  };
  return labelColors[label] || labelColors['default'];
}
