import { useState, useRef } from 'react';
import './PanelToolbar.css';
import { useClickOutside } from '../hooks/useClickOutside';

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
  isPlaying,
  onToggleCinePlay,
  playbackSpeed,
  onSpeedChange,
  isMinimized,
  isMaximized,
  onToggleMinimize,
  onToggleMaximize,
}) {
  const [showToolsPopup, setShowToolsPopup] = useState(false);
  const [showCinePopup, setShowCinePopup] = useState(false);
  const toolsRef = useRef(null);
  const cineRef = useRef(null);

  useClickOutside(toolsRef, showToolsPopup, () => setShowToolsPopup(false));
  useClickOutside(cineRef, showCinePopup, () => setShowCinePopup(false));

  return (
    <div className="panel-toolbar">
      <div className="toolbar-left">
        <div className="toolbar-tools" ref={toolsRef}>
          <button
            className={`tool-btn ${showToolsPopup ? 'active' : ''}`}
            onClick={() => setShowToolsPopup(!showToolsPopup)}
            title="Tools"
          >
            🛠
          </button>

          {showToolsPopup && (
            <div className="tools-popup">
              <div className="tools-popup-section">
                <span className="tools-popup-label">View</span>
                <div className="tools-popup-grid">
                  <button
                    className={`tool-btn ${tool === 'pan' ? 'active' : ''}`}
                    onClick={() => { onToolChange('pan'); setShowToolsPopup(false); }}
                    title="Pan (H)"
                  >
                    ✋
                  </button>
                  <button
                    className={`tool-btn ${tool === 'zoom' ? 'active' : ''}`}
                    onClick={() => { onToolChange('zoom'); setShowToolsPopup(false); }}
                    title="Zoom (Z)"
                  >
                    🔍
                  </button>
                  <button
                    className="tool-btn"
                    onClick={() => { onFit(); setShowToolsPopup(false); }}
                    title="Fit to window (F)"
                  >
                    ⊞
                  </button>
                </div>
              </div>

              <div className="tools-popup-section">
                <span className="tools-popup-label">Adjust</span>
                <div className="tools-popup-sliders">
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
              </div>
            </div>
          )}
        </div>
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

