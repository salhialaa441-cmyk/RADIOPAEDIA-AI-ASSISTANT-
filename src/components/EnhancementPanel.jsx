import { useState, useRef } from 'react';
import './EnhancementPanel.css';

// Section icons as SVG components
const PresetIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
  </svg>
);

const WindowLevelIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const GammaIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v10l4 4" />
    <circle cx="12" cy="12" r="9" />
  </svg>
);

const ClaheIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
  </svg>
);

const SharpenIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" />
  </svg>
);

const WaveletIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 12c2-4 4-6 6-6s4 4 6 4 4-2 6-2" />
    <path d="M2 16c2-3 4-5 6-5s4 3 6 3 4-1 6-1" />
    <path d="M2 8c2-2 4-4 6-4s4 2 6 2 4-1 6-1" />
  </svg>
);

const DenoiseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    <path d="M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83" />
  </svg>
);

const NLMIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <path d="M12 12l4 4" />
  </svg>
);

const ChevronIcon = ({ expanded }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={`chevron ${expanded ? 'expanded' : ''}`}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default function EnhancementPanel({
  // Window/Level
  windowCenter,
  windowWidth,
  onWindowLevelChange,
  // Gamma
  gamma,
  onGammaChange,
  // CLAHE
  claheEnabled,
  claheStrength,
  claheTileSize,
  autoClipEnabled,
  onClaheToggle,
  onClaheStrengthChange,
  onClaheTileChange,
  onAutoClipToggle,
  // Unsharp Mask
  unsharpEnabled,
  unsharpAmount,
  unsharpRadius,
  onUnsharpToggle,
  onUnsharpAmountChange,
  onUnsharpRadiusChange,
  // Wavelet Detail Enhancement
  waveletEnabled,
  waveletFactor,
  onWaveletToggle,
  onWaveletFactorChange,
  // Bilateral Filter
  bilateralEnabled,
  bilateralSigmaSpace,
  bilateralSigmaRange,
  onBilateralToggle,
  onBilateralSpaceChange,
  onBilateralRangeChange,
  // NLM
  nlmEnabled,
  nlmStrength,
  nlmPatchSize,
  nlmSearchSize,
  denoiseMode,
  onDenoiseModeChange,
  onNlmToggle,
  onNlmStrengthChange,
  onNlmPatchChange,
  onNlmSearchChange,
  // Presets
  onApplyPreset,
  // Reset all
  onReset,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    presets: true,
    windowLevel: true,
    gamma: true,
    clahe: true,
    wavelet: true,
    unsharp: true,
    bilateral: true,
    nlm: true,
  });

  const sectionRefs = useRef({
    presets: null,
    windowLevel: null,
    gamma: null,
    clahe: null,
    wavelet: null,
    unsharp: null,
    bilateral: null,
    nlm: null,
  });

  const toggleSection = (section) => {
    const willExpand = !expandedSections[section];
    setExpandedSections(prev => ({
      ...prev,
      [section]: willExpand
    }));

    // Scroll section into view when expanding
    if (willExpand && sectionRefs.current[section]) {
      setTimeout(() => {
        sectionRefs.current[section].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 50);
    }
  };

  return (
    <div className={`enhancement-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button
        className="enhancement-panel-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        title="Image Enhancement Tools"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l3 3" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      </button>

      {isExpanded && (
        <div className="enhancement-panel-content">
          {/* Presets Section */}
          <div className="enhancement-section" ref={el => sectionRefs.current.presets = el}>
            <div
              className="enhancement-header clickable"
              onClick={() => toggleSection('presets')}
            >
              <div className="header-left">
                <PresetIcon />
                <span>Presets</span>
              </div>
              <div className="header-right">
                <ChevronIcon expanded={expandedSections.presets} />
              </div>
            </div>

            {expandedSections.presets && (
              <div className="section-content">
                <div className="preset-row">
                  <button
                    className="preset-pill"
                    onClick={() => onApplyPreset({ windowWidth: 256, windowCenter: 128, gamma: 1.0 })}
                    title="Default: Full range display (WW:256, WL:128)"
                  >
                    Default
                    <span className="preset-tooltip">
                      <strong>Default:</strong> Full range display (WW:256, WL:128)
                    </span>
                  </button>
                  <button
                    className="preset-pill"
                    onClick={() => onApplyPreset({ windowWidth: 100, windowCenter: 140, gamma: 1.0 })}
                    title="Soft Tissue: WW:100, WL:140"
                  >
                    Soft Tissue
                    <span className="preset-tooltip">
                      <strong>Soft Tissue:</strong> WW:100, WL:140 — Optimized for mediastinum and muscle
                    </span>
                  </button>
                  <button
                    className="preset-pill"
                    onClick={() => onApplyPreset({ windowWidth: 200, windowCenter: 80, gamma: 1.0 })}
                    title="Lung: WW:200, WL:80"
                  >
                    Lung
                    <span className="preset-tooltip">
                      <strong>Lung:</strong> WW:200, WL:80 — Enhanced contrast for pulmonary parenchyma
                    </span>
                  </button>
                  <button
                    className="preset-pill"
                    onClick={() => onApplyPreset({ windowWidth: 80, windowCenter: 180, gamma: 1.0 })}
                    title="Bone: WW:80, WL:180"
                  >
                    Bone
                    <span className="preset-tooltip">
                      <strong>Bone:</strong> WW:80, WL:180 — High contrast for skeletal structures
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Window/Level Section */}
          <div className="enhancement-section" ref={el => sectionRefs.current.windowLevel = el}>
            <div
              className="enhancement-header clickable"
              onClick={() => toggleSection('windowLevel')}
            >
              <div className="header-left">
                <WindowLevelIcon />
                <span>Window/Level</span>
              </div>
              <div className="header-right">
                <button
                  className="reset-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onWindowLevelChange(128, 256);
                  }}
                  title="Reset Window/Level"
                >
                  ↺
                </button>
                <ChevronIcon expanded={expandedSections.windowLevel} />
              </div>
            </div>

            {expandedSections.windowLevel && (
              <div className="section-content">
                <div className="slider-row">
                  <div className="slider-header">
                    <span className="slider-label" data-tooltip="Range of grayscale values displayed. Narrower = higher contrast">Width</span>
                    <span className="slider-value">{windowWidth}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="255"
                    value={windowWidth}
                    onChange={(e) => onWindowLevelChange(windowCenter, Number(e.target.value))}
                  />
                  <div className="slider-tooltip">
                    <div className="tooltip-title">Window Width (Contrast)</div>
                    <div className="tooltip-description">
                      Controls the range of grayscale values displayed. Narrower width increases contrast by spreading fewer values across the display range.
                    </div>
                    <div className="tooltip-range">
                      <span><strong>10-30:</strong> High contrast, narrow range</span>
                      <span><strong>50-80:</strong> Soft tissue detail</span>
                      <span><strong>100-255:</strong> Full range, low contrast</span>
                    </div>
                  </div>
                </div>

                <div className="slider-row">
                  <div className="slider-header">
                    <span className="slider-label" data-tooltip="Center grayscale value. Controls brightness">Level</span>
                    <span className="slider-value">{windowCenter}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={windowCenter}
                    onChange={(e) => onWindowLevelChange(Number(e.target.value), windowWidth)}
                  />
                  <div className="slider-tooltip">
                    <div className="tooltip-title">Window Level (Brightness Center)</div>
                    <div className="tooltip-description">
                      Sets the center point of the display window. Values below appear darker; values above appear brighter.
                    </div>
                    <div className="tooltip-range">
                      <span><strong>0-40:</strong> Darker (air/low density)</span>
                      <span><strong>80-140:</strong> Mid-range (soft tissue)</span>
                      <span><strong>180-255:</strong> Brighter (bone/high density)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Gamma Section */}
          <div className="enhancement-section" ref={el => sectionRefs.current.gamma = el}>
            <div
              className="enhancement-header clickable"
              onClick={() => toggleSection('gamma')}
            >
              <div className="header-left">
                <GammaIcon />
                <span>Gamma</span>
              </div>
              <div className="header-right">
                <button
                  className="reset-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGammaChange(1.0);
                  }}
                  title="Reset Gamma"
                >
                  ↺
                </button>
                <ChevronIcon expanded={expandedSections.gamma} />
              </div>
            </div>

            {expandedSections.gamma && (
              <div className="section-content">
                <div className="slider-row">
                  <div className="slider-header">
                    <span className="slider-label" data-tooltip="Power-law brightness adjustment">Gamma</span>
                    <span className="slider-value">{gamma.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={gamma}
                    onChange={(e) => onGammaChange(Number(e.target.value))}
                  />
                  <div className="slider-tooltip">
                    <div className="tooltip-title">Gamma Correction (Midtone Adjustment)</div>
                    <div className="tooltip-description">
                      Applies power-law transformation: output = input^(1/γ). Adjusts midtones without affecting pure black or white.
                    </div>
                    <div className="tooltip-range">
                      <span><strong>0.1-0.8:</strong> Brighten shadows</span>
                      <span><strong>1.0:</strong> No change (linear)</span>
                      <span><strong>1.5-3.0:</strong> Darken, increase contrast</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CLAHE Section */}
          <div className="enhancement-section" ref={el => sectionRefs.current.clahe = el}>
            <div
              className="enhancement-header clickable"
              onClick={() => toggleSection('clahe')}
            >
              <div className="header-left">
                <ClaheIcon />
                <span>CLAHE</span>
              </div>
              <div className="header-right">
                <button
                  className="reset-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClaheToggle(false);
                    onAutoClipToggle(false);
                    onClaheStrengthChange(2.0);
                    onClaheTileChange(64);
                  }}
                  title="Reset CLAHE"
                >
                  ↺
                </button>
                <ChevronIcon expanded={expandedSections.clahe} />
              </div>
            </div>

            {expandedSections.clahe && (
              <div className="section-content">
                <div className="toggle-row">
                  <span className="toggle-label">CLAHE</span>
                  <div
                    className={`toggle-switch ${claheEnabled ? 'active' : ''}`}
                    onClick={() => onClaheToggle(!claheEnabled)}
                  >
                    <div className="toggle-knob" />
                  </div>
                  <div className="toggle-tooltip">
                    <div className="tooltip-title">CLAHE (Contrast Limited Adaptive Histogram Equalization)</div>
                    <div className="tooltip-description">
                      Developed by Pizer et al. (1987) and Zuiderveld (1994), CLAHE enhances local contrast by applying histogram equalization to small tiles with clipping to prevent noise amplification.
                    </div>
                    <div className="tooltip-range">
                      <span><strong>Off:</strong> Standard display</span>
                      <span><strong>On:</strong> Enhanced local contrast</span>
                    </div>
                  </div>
                </div>

                <div className="toggle-row spaced">
                  <span className="toggle-label">Auto Clip Limit (IA-CLAHE)</span>
                  <div
                    className={`toggle-switch ${autoClipEnabled ? 'active' : ''}`}
                    onClick={() => onAutoClipToggle(!autoClipEnabled)}
                  >
                    <div className="toggle-knob" />
                  </div>
                  <div className="toggle-tooltip">
                    <div className="tooltip-title">Adaptive Clip Limit (IA-CLAHE 2026)</div>
                    <div className="tooltip-description">
                      Combines classical CLAHE with 2026 IA-CLAHE research. Automatically estimates optimal clip limit based on local image entropy and contrast.
                    </div>
                    <div className="tooltip-range">
                      <span><strong>Off:</strong> Manual clip limit</span>
                      <span><strong>On:</strong> IA-CLAHE adaptive (2026)</span>
                    </div>
                  </div>
                </div>

                <div className="slider-row">
                  <div className="slider-header">
                    <span className="slider-label" data-tooltip="Histogram peak clipping factor">Strength</span>
                    <span className="slider-value">{claheStrength.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="4.0"
                    step="0.1"
                    value={claheStrength}
                    onChange={(e) => onClaheStrengthChange(Number(e.target.value))}
                  />
                  <div className="slider-tooltip">
                    <div className="tooltip-title">Contrast Limiting Factor (Clip Limit)</div>
                    <div className="tooltip-description">
                      Controls histogram peak clipping to prevent noise amplification. Excess pixels are redistributed before CDF computation.
                    </div>
                    <div className="tooltip-range">
                      <span><strong>1.0-2.0:</strong> Conservative (high-noise)</span>
                      <span><strong>2.0-3.0:</strong> Balanced (CT/MRI)</span>
                      <span><strong>3.0-4.0:</strong> Aggressive (low-contrast)</span>
                    </div>
                  </div>
                </div>

                <div className="slider-row">
                  <div className="slider-header">
                    <span className="slider-label" data-tooltip="Processing tile size in pixels">Tile Size</span>
                    <span className="slider-value">{claheTileSize}</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="256"
                    step="8"
                    value={claheTileSize}
                    onChange={(e) => onClaheTileChange(Number(e.target.value))}
                  />
                  <div className="slider-tooltip">
                    <div className="tooltip-title">Processing Grid Resolution</div>
                    <div className="tooltip-description">
                      Divides image into tiles for independent histogram equalization. Default 64×64 per Pizer et al. (1987).
                    </div>
                    <div className="tooltip-range">
                      <span><strong>8-16:</strong> Fine detail</span>
                      <span><strong>32-64:</strong> General (default)</span>
                      <span><strong>128-256:</strong> Near-global</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Wavelet Detail Enhancement Section (NEW - Hybrid Pipeline) */}
          <div className="enhancement-section" ref={el => sectionRefs.current.wavelet = el}>
            <div
              className="enhancement-header clickable"
              onClick={() => toggleSection('wavelet')}
            >
              <div className="header-left">
                <WaveletIcon />
                <span>Wavelet Detail Enhancement</span>
              </div>
              <div className="header-right">
                <button
                  className="reset-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onWaveletToggle(false);
                    onWaveletFactorChange(1.5);
                  }}
                  title="Reset Wavelet Enhancement"
                >
                  ↺
                </button>
                <ChevronIcon expanded={expandedSections.wavelet} />
              </div>
            </div>

            {expandedSections.wavelet && (
              <div className="section-content">
                <div className="toggle-row">
                  <span className="toggle-label">Wavelet Detail Enhancement</span>
                  <div
                    className={`toggle-switch ${waveletEnabled ? 'active' : ''}`}
                    onClick={() => onWaveletToggle(!waveletEnabled)}
                  >
                    <div className="toggle-knob" />
                  </div>
                  <div className="toggle-tooltip">
                    <div className="tooltip-title">Wavelet Detail Enhancement</div>
                    <div className="tooltip-description">
                      Uses Haar wavelet transform to enhance fine details and edges without amplifying noise.
                      Replaces traditional unsharp mask with frequency-based enhancement.
                    </div>
                    <div className="tooltip-range">
                      <span><strong>Off:</strong> No wavelet enhancement</span>
                      <span><strong>On:</strong> Detail enhancement active</span>
                    </div>
                  </div>
                </div>

                <div className="slider-row">
                  <div className="slider-header">
                    <span className="slider-label" data-tooltip="Detail enhancement intensity (1.0 = no enhancement)">Enhancement Factor</span>
                    <span className="slider-value">{waveletFactor.toFixed(1)}×</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="3.0"
                    step="0.1"
                    value={waveletFactor}
                    onChange={(e) => onWaveletFactorChange(Number(e.target.value))}
                  />
                  <div className="slider-tooltip">
                    <div className="tooltip-title">Detail Enhancement Intensity</div>
                    <div className="tooltip-description">
                      Multiplies wavelet detail coefficients. Higher values enhance edges and fine structures more aggressively.
                      Based on: J Med Phys (2025) - Hybrid Approach for Medical Image Enhancement.
                    </div>
                    <div className="tooltip-range">
                      <span><strong>1.0-1.5:</strong> Subtle (recommended)</span>
                      <span><strong>1.5-2.0:</strong> Moderate</span>
                      <span><strong>2.0-3.0:</strong> Strong</span>
                    </div>
                  </div>
                </div>

                <div className="info-note">
                  <strong>Note:</strong> Wavelet enhancement replaces unsharp mask in the hybrid pipeline.
                  When enabled, unsharp mask is automatically disabled to avoid double enhancement.
                </div>
              </div>
            )}
          </div>

          {/* Unsharp Mask Section */}
          <div className="enhancement-section" ref={el => sectionRefs.current.unsharp = el}>
            <div
              className="enhancement-header clickable"
              onClick={() => toggleSection('unsharp')}
            >
              <div className="header-left">
                <SharpenIcon />
                <span>Unsharp Mask</span>
              </div>
              <div className="header-right">
                <button
                  className="reset-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnsharpToggle(false);
                    onUnsharpAmountChange(0.5);
                    onUnsharpRadiusChange(2);
                  }}
                  title="Reset Unsharp Mask"
                >
                  ↺
                </button>
                <ChevronIcon expanded={expandedSections.unsharp} />
              </div>
            </div>

            {expandedSections.unsharp && (
              <div className="section-content">
                <div className="toggle-row">
                  <span className="toggle-label">Unsharp Mask</span>
                  <div
                    className={`toggle-switch ${unsharpEnabled ? 'active' : ''}`}
                    onClick={() => onUnsharpToggle(!unsharpEnabled)}
                  >
                    <div className="toggle-knob" />
                  </div>
                  <div className="toggle-tooltip">
                    <div className="tooltip-title">Unsharp Mask (Edge Enhancement)</div>
                    <div className="tooltip-description">
                      Subtracts blurred version from original: Enhanced = Original + Amount × (Original - Blurred). Enhances edges and fine details.
                    </div>
                    <div className="tooltip-range">
                      <span><strong>Off:</strong> No sharpening</span>
                      <span><strong>On:</strong> Edge enhancement active</span>
                    </div>
                  </div>
                </div>

                <div className="slider-row">
                  <div className="slider-header">
                    <span className="slider-label" data-tooltip="Edge enhancement intensity">Amount</span>
                    <span className="slider-value">{unsharpAmount.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.5"
                    step="0.1"
                    value={unsharpAmount}
                    onChange={(e) => onUnsharpAmountChange(Number(e.target.value))}
                  />
                  <div className="slider-tooltip">
                    <div className="tooltip-title">Edge Enhancement Intensity</div>
                    <div className="tooltip-description">
                      Blending factor for edge mask. Higher values create stronger edge contrast but may introduce halos.
                    </div>
                    <div className="tooltip-range">
                      <span><strong>0.1-0.4:</strong> Subtle</span>
                      <span><strong>0.5-0.8:</strong> Moderate (recommended)</span>
                      <span><strong>0.9-1.5:</strong> Strong (halos)</span>
                    </div>
                  </div>
                </div>

                <div className="slider-row">
                  <div className="slider-header">
                    <span className="slider-label" data-tooltip="Gaussian blur radius (σ)">Radius</span>
                    <span className="slider-value">{unsharpRadius}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={unsharpRadius}
                    onChange={(e) => onUnsharpRadiusChange(Number(e.target.value))}
                  />
                  <div className="slider-tooltip">
                    <div className="tooltip-title">Gaussian Blur Radius (σ)</div>
                    <div className="tooltip-description">
                      Controls blur kernel size. Smaller radius detects fine edges; larger enhances broader structures.
                    </div>
                    <div className="tooltip-range">
                      <span><strong>1-2:</strong> Fine edges</span>
                      <span><strong>2-3:</strong> General (recommended)</span>
                      <span><strong>4-5:</strong> Broad structures</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bilateral Filter Section */}
          <div className="enhancement-section" ref={el => sectionRefs.current.bilateral = el}>
            <div
              className="enhancement-header clickable"
              onClick={() => toggleSection('bilateral')}
            >
              <div className="header-left">
                <DenoiseIcon />
                <span>Bilateral Filter</span>
              </div>
              <div className="header-right">
                <button
                  className="reset-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBilateralToggle(false);
                    onBilateralSpaceChange(2.0);
                    onBilateralRangeChange(0.1);
                  }}
                  title="Reset Bilateral Filter"
                >
                  ↺
                </button>
                <ChevronIcon expanded={expandedSections.bilateral} />
              </div>
            </div>

            {expandedSections.bilateral && (
              <div className="section-content">
                <div className="toggle-row">
                  <span className="toggle-label">Bilateral Filter</span>
                  <div
                    className={`toggle-switch ${bilateralEnabled ? 'active' : ''}`}
                    onClick={() => onBilateralToggle(!bilateralEnabled)}
                  >
                    <div className="toggle-knob" />
                  </div>
                  <div className="toggle-tooltip">
                    <div className="tooltip-title">Bilateral Filter (Tomasi & Manduchi, 1998)</div>
                    <div className="tooltip-description">
                      Edge-preserving smoothing combining spatial and intensity-domain filtering. Unlike Gaussian blur, preserves sharp anatomical boundaries.
                    </div>
                    <div className="tooltip-range">
                      <span><strong>Off:</strong> No denoising</span>
                      <span><strong>On:</strong> Edge-preserving smoothing</span>
                    </div>
                  </div>
                </div>

                <div className="slider-row">
                  <div className="slider-header">
                    <span className="slider-label" data-tooltip="Spatial neighborhood size (σ_space)">Spatial Sigma</span>
                    <span className="slider-value">{bilateralSigmaSpace.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={bilateralSigmaSpace}
                    onChange={(e) => onBilateralSpaceChange(Number(e.target.value))}
                  />
                  <div className="slider-tooltip">
                    <div className="tooltip-title">Spatial Extent (σ_d)</div>
                    <div className="tooltip-description">
                      Controls spatial neighborhood size. Larger values consider more distant pixels for stronger smoothing.
                    </div>
                    <div className="tooltip-range">
                      <span><strong>0.5-1.5:</strong> Minimal, fine detail</span>
                      <span><strong>1.5-3.0:</strong> Balanced (CT/MRI)</span>
                      <span><strong>3.0-5.0:</strong> Strong smoothing</span>
                    </div>
                  </div>
                </div>

                <div className="slider-row">
                  <div className="slider-header">
                    <span className="slider-label" data-tooltip="Intensity sensitivity (σ_range)">Range Sigma</span>
                    <span className="slider-value">{bilateralSigmaRange.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.5"
                    step="0.01"
                    value={bilateralSigmaRange}
                    onChange={(e) => onBilateralRangeChange(Number(e.target.value))}
                  />
                  <div className="slider-tooltip">
                    <div className="tooltip-title">Intensity Sensitivity (σ_r)</div>
                    <div className="tooltip-description">
                      Controls edge preservation. Lower values preserve sharper edges by blending only similar intensities.
                    </div>
                    <div className="tooltip-range">
                      <span><strong>0.01-0.08:</strong> Sharp edges</span>
                      <span><strong>0.08-0.15:</strong> Balanced</span>
                      <span><strong>0.15-0.5:</strong> Near Gaussian</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Non-Local Means Section */}
          <div className="enhancement-section" ref={el => sectionRefs.current.nlm = el}>
            <div
              className="enhancement-header clickable"
              onClick={() => toggleSection('nlm')}
            >
              <div className="header-left">
                <NLMIcon />
                <span>Non-Local Means</span>
              </div>
              <div className="header-right">
                <button
                  className="reset-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNlmToggle(false);
                    onNlmStrengthChange(0.5);
                    onNlmPatchChange(3);
                    onNlmSearchChange(7);
                  }}
                  title="Reset NLM"
                >
                  ↺
                </button>
                <ChevronIcon expanded={expandedSections.nlm} />
              </div>
            </div>

            {expandedSections.nlm && (
              <div className="section-content">
                <div className="toggle-row">
                  <span className="toggle-label">Non-Local Means (NLM)</span>
                  <div
                    className={`toggle-switch ${nlmEnabled ? 'active' : ''}`}
                    onClick={() => onNlmToggle(!nlmEnabled)}
                  >
                    <div className="toggle-knob" />
                  </div>
                  <div className="toggle-tooltip">
                    <div className="tooltip-title">Non-Local Means (Buades et al., 2005)</div>
                    <div className="tooltip-description">
                      Advanced denoising exploiting global self-similarity. Averages similar patches anywhere in the image, preserving structure while removing noise.
                    </div>
                    <div className="tooltip-range">
                      <span><strong>Off:</strong> No NLM denoising</span>
                      <span><strong>On:</strong> Patch-based denoising</span>
                    </div>
                  </div>
                </div>

                {/* Denoise Mode Selection (2025 Research-Inspired) */}
                <div className="mode-row">
                  <span className="mode-label">Denoise Mode:</span>
                  <div className="mode-selector">
                    <button
                      className={`mode-btn ${denoiseMode === 'standard' ? 'active' : ''}`}
                      onClick={() => onDenoiseModeChange('standard')}
                      title="Standard NLM with fixed parameters"
                    >
                      Standard
                    </button>
                    <button
                      className={`mode-btn ${denoiseMode === 'adaptive' ? 'active' : ''}`}
                      onClick={() => onDenoiseModeChange('adaptive')}
                      title="Adaptive NLM with automatic noise estimation (2025)"
                    >
                      Adaptive
                    </button>
                    <button
                      className={`mode-btn ${denoiseMode === 'multiscale' ? 'active' : ''}`}
                      onClick={() => onDenoiseModeChange('multiscale')}
                      title="Multi-Scale Bilateral (MIND-inspired 2025)"
                    >
                      Multi-Scale
                    </button>
                  </div>
                </div>

                <div className="mode-description">
                  {denoiseMode === 'standard' && (
                    <span>Standard NLM with user-controlled parameters. Best for consistent noise levels.</span>
                  )}
                  {denoiseMode === 'adaptive' && (
                    <span>Automatically estimates noise level and adjusts denoising strength. Best for varying noise conditions.</span>
                  )}
                  {denoiseMode === 'multiscale' && (
                    <span>Processes at multiple scales and combines adaptively. Better edge preservation in homogeneous regions.</span>
                  )}
                </div>

                <div className="slider-row">
                  <div className="slider-header">
                    <span className="slider-label" data-tooltip="Denoising parameter (h)">Filter Strength</span>
                    <span className="slider-value">{nlmStrength.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={nlmStrength}
                    onChange={(e) => onNlmStrengthChange(Number(e.target.value))}
                  />
                  <div className="slider-tooltip">
                    <div className="tooltip-title">Denoising Parameter (h)</div>
                    <div className="tooltip-description">
                      Controls exponential weighting decay. Lower h preserves detail; higher h creates stronger smoothing.
                    </div>
                    <div className="tooltip-range">
                      <span><strong>0.1-0.3:</strong> Minimal, fine detail</span>
                      <span><strong>0.4-0.6:</strong> Balanced (CT/MRI)</span>
                      <span><strong>0.7-1.0:</strong> Strong denoising</span>
                    </div>
                  </div>
                </div>

                <div className="slider-row">
                  <div className="slider-header">
                    <span className="slider-label" data-tooltip="Patch comparison size">Patch Size</span>
                    <span className="slider-value">{nlmPatchSize}×{nlmPatchSize}</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="9"
                    step="2"
                    value={nlmPatchSize}
                    onChange={(e) => onNlmPatchChange(Number(e.target.value))}
                  />
                  <div className="slider-tooltip">
                    <div className="tooltip-title">Similarity Patch Dimension</div>
                    <div className="tooltip-description">
                      Size of square patch for similarity comparison. Larger patches capture more context but may blur fine details.
                    </div>
                    <div className="tooltip-range">
                      <span><strong>3×3:</strong> Fine detail (recommended)</span>
                      <span><strong>5×5:</strong> Balanced</span>
                      <span><strong>7-9:</strong> Structural context</span>
                    </div>
                  </div>
                </div>

                <div className="slider-row">
                  <div className="slider-header">
                    <span className="slider-label" data-tooltip="Search neighborhood size">Search Window</span>
                    <span className="slider-value">{nlmSearchSize}×{nlmSearchSize}</span>
                  </div>
                  <input
                    type="range"
                    min="7"
                    max="21"
                    step="2"
                    value={nlmSearchSize}
                    onChange={(e) => onNlmSearchChange(Number(e.target.value))}
                  />
                  <div className="slider-tooltip">
                    <div className="tooltip-title">Search Neighborhood Size</div>
                    <div className="tooltip-description">
                      Size of square region for patch search. Larger windows find more similar patches but increase computation.
                    </div>
                    <div className="tooltip-range">
                      <span><strong>7×7:</strong> Fast (recommended)</span>
                      <span><strong>11-15:</strong> Balanced</span>
                      <span><strong>17-21:</strong> Global, slower</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reset All Button */}
          <button className="reset-all-btn" onClick={onReset}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12" />
              <path d="M3 3v9h9" />
            </svg>
            Reset All
          </button>
        </div>
      )}
    </div>
  );
}
