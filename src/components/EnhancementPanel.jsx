import { useState } from 'react';
import './EnhancementPanel.css';

export default function EnhancementPanel({
  windowCenter,
  windowWidth,
  gamma,
  onWindowLevelChange,
  onGammaChange,
  onReset,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`enhancement-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button
        className="enhancement-panel-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        title="Image Enhancement"
      >
        🎨
      </button>

      {isExpanded && (
        <div className="enhancement-panel-content">
          <div className="enhancement-section">
            <div className="enhancement-header">
              <span>Window/Level</span>
              <button className="reset-btn" onClick={() => onWindowLevelChange(128, 256)}>
                ↺
              </button>
            </div>

            <div className="slider-group">
              <label>Window Width</label>
              <input
                type="range"
                min="1"
                max="4096"
                value={windowWidth}
                onChange={(e) => onWindowLevelChange(windowCenter, Number(e.target.value))}
              />
              <span>{windowWidth}</span>
            </div>

            <div className="slider-group">
              <label>Window Level</label>
              <input
                type="range"
                min="0"
                max="4095"
                value={windowCenter}
                onChange={(e) => onWindowLevelChange(Number(e.target.value), windowWidth)}
              />
              <span>{windowCenter}</span>
            </div>
          </div>

          <div className="enhancement-section">
            <div className="enhancement-header">
              <span>Gamma</span>
              <button className="reset-btn" onClick={() => onGammaChange(1.0)}>
                ↺
              </button>
            </div>

            <div className="slider-group">
              <label>Gamma</label>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                value={gamma}
                onChange={(e) => onGammaChange(Number(e.target.value))}
              />
              <span>{gamma.toFixed(1)}</span>
            </div>
          </div>

          <button className="reset-all-btn" onClick={onReset}>
            Reset All
          </button>
        </div>
      )}
    </div>
  );
}
