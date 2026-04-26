import { useState, useRef, useEffect } from 'react';
import './PanelToolbar.css';

export default function PanelToolbar({
  tool,
  onToolChange,
  onFit,
  zoom,
  imageIndex,
  totalImages,
  onPrevious,
  onNext,
  syncEnabled,
  onSyncToggle,
  isSynced,
  onClose,
  brightness,
  contrast,
  onBrightnessChange,
  onContrastChange,
  protocolName,
  showAnnotationPanel,
  onToggleAnnotationPanel,
  selectedTool,
  selectedLabel,
  onToolSelect,
  onLabelSelect,
  isPlaying,
  onToggleCinePlay,
  playbackSpeed,
  onSpeedChange,
  isMinimized,
  isMaximized,
  onToggleMinimize,
  onToggleMaximize,
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [showAnnotationTools, setShowAnnotationTools] = useState(false);
  const [showCinePopup, setShowCinePopup] = useState(false);
  const cineRef = useRef(null);

  // Close cine popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (cineRef.current && !cineRef.current.contains(event.target)) {
        setShowCinePopup(false);
      }
    }

    if (showCinePopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCinePopup]);

  return (
    <div className="panel-toolbar">
      <div className="toolbar-left">
        <div className="toolbar-tools">
          <button
            className={`tool-btn ${tool === 'pan' ? 'active' : ''}`}
            onClick={() => onToolChange('pan')}
            title="Pan (H)"
          >
            ✋
          </button>
          <button
            className={`tool-btn ${tool === 'zoom' ? 'active' : ''}`}
            onClick={() => onToolChange('zoom')}
            title="Zoom (Z)"
          >
            🔍
          </button>
          <button
            className={`tool-btn ${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
            title="Brightness/Contrast"
          >
            ☀
          </button>
          <button
            className="tool-btn"
            onClick={onFit}
            title="Fit to window (F)"
          >
            ⊞
          </button>
          <button
            className={`tool-btn ${showAnnotationTools ? 'active' : ''}`}
            onClick={() => setShowAnnotationTools(!showAnnotationTools)}
            title="Annotation tools"
          >
            📝
          </button>
        </div>

        {showSettings && (
          <div className="brightness-contrast-controls">
            <div className="slider-group">
              <label>Brightness</label>
              <input
                type="range"
                min="50"
                max="150"
                value={brightness}
                onChange={(e) => onBrightnessChange(Number(e.target.value))}
              />
              <span>{brightness}%</span>
            </div>
            <div className="slider-group">
              <label>Contrast</label>
              <input
                type="range"
                min="50"
                max="150"
                value={contrast}
                onChange={(e) => onContrastChange(Number(e.target.value))}
              />
              <span>{contrast}%</span>
            </div>
          </div>
        )}

        {showAnnotationTools && (
          <div className="annotation-tools-controls">
            <div className="tool-selector">
              <button
                className={`annotation-tool-btn ${selectedTool === 'bbox' ? 'active' : ''}`}
                onClick={() => onToolSelect(selectedTool === 'bbox' ? null : 'bbox')}
                title="Bounding Box (1)"
              >
                ⬜
              </button>
              <button
                className={`annotation-tool-btn ${selectedTool === 'polygon' ? 'active' : ''}`}
                onClick={() => onToolSelect(selectedTool === 'polygon' ? null : 'polygon')}
                title="Polygon (2)"
              >
                ⬠
              </button>
              <button
                className={`annotation-tool-btn ${selectedTool === 'keypoint' ? 'active' : ''}`}
                onClick={() => onToolSelect(selectedTool === 'keypoint' ? null : 'keypoint')}
                title="Keypoint (3)"
              >
                ⬤
              </button>
              <button
                className={`annotation-tool-btn ${selectedTool === 'brush' ? 'active' : ''}`}
                onClick={() => onToolSelect(selectedTool === 'brush' ? null : 'brush')}
                title="Brush (4)"
              >
                🖌
              </button>
            </div>

            {selectedLabel && (
              <div className="selected-label">
                <span className="label-dot" style={{ background: getLabelColor(selectedLabel) }} />
                <span>{selectedLabel}</span>
              </div>
            )}

            <button
              className="annotation-panel-btn"
              onClick={onToggleAnnotationPanel}
              title="Toggle annotation panel"
            >
              {showAnnotationPanel ? 'Hide Panel' : 'Show Panel'}
            </button>
          </div>
        )}
      </div>

      <div className="toolbar-center">
        {protocolName && (
          <span className="protocol-name">{protocolName}</span>
        )}
      </div>

      <div className="toolbar-right">
        <div className="cine-control-wrapper" ref={cineRef}>
          <button
            className={`tool-btn cine-btn ${isPlaying ? 'active' : ''}`}
            onClick={() => setShowCinePopup(!showCinePopup)}
            title={isPlaying ? 'Pause cine play' : 'Start cine play'}
            disabled={totalImages <= 1}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          {showCinePopup && (
            <div className="cine-popup">
              <button
                className={`cine-play-btn ${isPlaying ? 'active' : ''}`}
                onClick={onToggleCinePlay}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <div className="speed-control">
                <label>Speed:</label>
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={playbackSpeed}
                  onChange={onSpeedChange}
                  className="speed-slider"
                />
                <span>{playbackSpeed} fps</span>
              </div>
            </div>
          )}
        </div>

        <button
          className={`tool-btn sync-btn ${syncEnabled ? 'active' : ''} ${isSynced ? 'synced' : ''}`}
          onClick={onSyncToggle}
          title={syncEnabled ? 'Disable scroll sync' : 'Enable scroll sync'}
        >
          🔗
        </button>

        <span className="zoom-indicator">{Math.round(zoom * 100)}%</span>

        <span className="image-counter">
          {imageIndex + 1} / {totalImages}
        </span>

        <button className="nav-btn" onClick={onPrevious} disabled={imageIndex === 0}>
          ←
        </button>
        <button className="nav-btn" onClick={onNext} disabled={imageIndex === totalImages - 1}>
          →
        </button>

        <button
          className="tool-btn window-control-btn"
          onClick={onToggleMinimize}
          title={isMinimized ? 'Restore' : 'Minimize'}
        >
          {isMinimized ? '⤢' : '−'}
        </button>

        <button
          className="tool-btn window-control-btn"
          onClick={onToggleMaximize}
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? '❐' : '□'}
        </button>

        <button className="tool-btn close-btn" onClick={onClose} title="Close panel">
          ×
        </button>
      </div>
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
