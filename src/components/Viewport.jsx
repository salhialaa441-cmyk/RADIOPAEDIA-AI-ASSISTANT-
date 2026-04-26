import { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import PanelToolbar from './PanelToolbar';
import EnhancementPanel from './EnhancementPanel';
import HistogramDisplay from './HistogramDisplay';
import { useImageEnhancement } from '../hooks/useImageEnhancement';
import { applyEnhancementPipeline, computeHistogram } from '../utils/imageEnhancements';
import './Viewport.css';

// Debounce hook for slider inputs
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function Viewport({
  panelId,
  protocol,
  images,
  currentImageIndex,
  tool,
  syncEnabled,
  isActive,
  onFocus,
  onSliceChange,
  onToolChange,
  onSyncToggle,
  onClose,
  isSynced,
}) {
  const [image, setImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 400, height: 300 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showEnhancementPanel, setShowEnhancementPanel] = useState(false);
  const [showHistogram, setShowHistogram] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Image enhancement hook (Window/Level + Gamma)
  const {
    windowCenter,
    windowWidth,
    gamma,
    setWindowLevel,
    setGamma,
    reset,
  } = useImageEnhancement();

  // CLAHE state
  const [claheEnabled, setClaheEnabled] = useState(false);
  const [claheStrength, setClaheStrength] = useState(2.0);
  const [claheTileSize, setClaheTileSize] = useState(64);
  const [autoClipEnabled, setAutoClipEnabled] = useState(false);

  // Unsharp Mask state
  const [unsharpEnabled, setUnsharpEnabled] = useState(false);
  const [unsharpAmount, setUnsharpAmount] = useState(0.5);
  const [unsharpRadius, setUnsharpRadius] = useState(2);

  // Wavelet Detail Enhancement state (NEW - Hybrid Pipeline)
  const [waveletEnabled, setWaveletEnabled] = useState(false);
  const [waveletFactor, setWaveletFactor] = useState(1.5);

  // Bilateral Filter state
  const [bilateralEnabled, setBilateralEnabled] = useState(false);
  const [bilateralSigmaSpace, setBilateralSigmaSpace] = useState(2.0);
  const [bilateralSigmaRange, setBilateralSigmaRange] = useState(0.1);

  // Non-Local Means state (optimized defaults: 3×3 patch, 7×7 search for performance)
  const [nlmEnabled, setNlmEnabled] = useState(false);
  const [nlmStrength, setNlmStrength] = useState(0.5);
  const [nlmPatchSize, setNlmPatchSize] = useState(3);
  const [nlmSearchSize, setNlmSearchSize] = useState(7);
  const [denoiseMode, setDenoiseMode] = useState('standard'); // 'standard' | 'adaptive' | 'multiscale'

  // Anisotropic Diffusion state (optimized defaults: 3 iterations for speed)
  const [anisotropicEnabled, setAnisotropicEnabled] = useState(false);
  const [anisotropicIterations, setAnisotropicIterations] = useState(3);
  const [anisotropicConductance, setAnisotropicConductance] = useState(50);

  // Debounced parameters to prevent worker flooding
  const debouncedIterations = useDebounce(anisotropicIterations, 150);
  const debouncedConductance = useDebounce(anisotropicConductance, 150);
  const debouncedClaheStrength = useDebounce(claheStrength, 150);
  const debouncedTileSize = useDebounce(claheTileSize, 150);
  const debouncedUnsharpAmount = useDebounce(unsharpAmount, 150);
  const debouncedUnsharpRadius = useDebounce(unsharpRadius, 150);
  const debouncedWaveletFactor = useDebounce(waveletFactor, 150);
  const debouncedBilateralSpace = useDebounce(bilateralSigmaSpace, 150);
  const debouncedBilateralRange = useDebounce(bilateralSigmaRange, 150);
  const debouncedNlmStrength = useDebounce(nlmStrength, 150);
  const debouncedNlmPatchSize = useDebounce(nlmPatchSize, 150);
  const debouncedNlmSearchSize = useDebounce(nlmSearchSize, 150);

  // Histogram state
  const [histogramData, setHistogramData] = useState(null);
  const [histogramStats, setHistogramStats] = useState(null);

  // Pipeline caching for smart stage skipping (Proposal 9)
  const prevPipelineParamsRef = useRef(null);
  const pipelineResultCache = useRef({ preWindowLevel: null });

  // Track the current protocol to detect protocol changes
  const currentProtocolRef = useRef(null);

  // Cine play state - OPTIMIZED for 60fps using requestAnimationFrame
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(5); // frames per second (1-60)
  const cineAnimationRef = useRef(null); // Store requestAnimationFrame ID
  const lastFrameTimeRef = useRef(0);
  // Refs to track state without triggering effect re-run (avoids stale closures in rAF)
  const currentIndexRef = useRef(currentImageIndex);
  currentIndexRef.current = currentImageIndex;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  // Preloaded images cache for cine playback
  const imageCacheRef = useRef(new Map());

  // Load image when index changes - OPTIMIZED with caching for cine playback
  useEffect(() => {
    if (!images[currentImageIndex]) {
      return;
    }

    const imageUrl = images[currentImageIndex];
    const cachedImage = imageCacheRef.current.get(imageUrl);

    // Use cached image if available (instant display for cine)
    if (cachedImage) {
      setImage(cachedImage);
      // Skip histogram update during cine for performance
      return;
    }

    // Load new image and cache it
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      setImage(img);
      imageCacheRef.current.set(imageUrl, img);

      // Limit cache size to prevent memory issues (keep last 50 images)
      if (imageCacheRef.current.size > 50) {
        const firstKey = imageCacheRef.current.keys().next().value;
        imageCacheRef.current.delete(firstKey);
      }

      // Compute histogram for the loaded image
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);

      // Compute histogram synchronously
      const result = computeHistogram(imageData.data, img.width, img.height);
      setHistogramData(result.histogram);
      setHistogramStats({
        mean: result.mean,
        median: result.median,
        entropy: result.entropy,
      });

      // Check if protocol changed (not just slice index)
      const protocolChanged = currentProtocolRef.current !== protocol?.protocol;

      if (protocolChanged) {
        // Only reset zoom/pan when protocol changes
        currentProtocolRef.current = protocol?.protocol;
        if (containerSize.width > 0 && containerSize.height > 0) {
          const scaleX = containerSize.width / img.width;
          const scaleY = containerSize.height / img.height;
          const newScale = Math.min(scaleX, scaleY, 1);
          setScale(newScale);
          setPosition({
            x: (containerSize.width - img.width * newScale) / 2,
            y: (containerSize.height - img.height * newScale) / 2,
          });
        }
      }
    };

    img.onerror = (e) => {
      console.error('[Viewport] Failed to load image:', imageUrl, e);
    };
  }, [images, currentImageIndex, protocol]);

  // Handle container resize - use ResizeObserver for accurate tracking
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

    // Use ResizeObserver to detect container size changes (not just window resize)
    const resizeObserver = new window.ResizeObserver(() => {
      updateSize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateSize);
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
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

  // Handle keyboard navigation - only for active panel
  useEffect(() => {
    function handleKeyDown(e) {
      // Only respond if this panel is active
      if (!isActive) return;

      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        if (currentImageIndex > 0) {
          onSliceChange(currentImageIndex - 1);
        }
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        if (currentImageIndex < images.length - 1) {
          onSliceChange(currentImageIndex + 1);
        }
      } else if (e.key === 'f' || e.key === 'F') {
        handleFit();
      } else if (e.key === 'h' || e.key === 'H') {
        // Toggle histogram display (when not panning)
        if (tool !== 'pan') {
          setShowHistogram(!showHistogram);
        } else {
          onToolChange('pan');
        }
      } else if (e.key === 'z' || e.key === 'Z') {
        onToolChange('zoom');
      } else if (e.key === 'e' || e.key === 'E') {
        // Toggle enhancement panel
        setShowEnhancementPanel(!showEnhancementPanel);
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        // Space bar toggles cine play
        e.preventDefault();
        toggleCinePlay();
      } else if (e.key === '+') {
        // Increase playback speed (up to 60 fps)
        setPlaybackSpeed((prev) => Math.min(60, prev + 1));
      } else if (e.key === '-') {
        // Decrease playback speed (down to 1 fps)
        setPlaybackSpeed((prev) => Math.max(1, prev - 1));
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentImageIndex, images.length, isActive, onSliceChange, onToolChange, toggleCinePlay, showHistogram, tool]);

  // Handle drag end
  function handleDragEnd(e) {
    if (tool !== 'pan') return;
    setPosition({
      x: e.target.x(),
      y: e.target.y(),
    });
  }

  // Cine play effect - OPTIMIZED: Uses requestAnimationFrame for precise timing
  useEffect(() => {
    // Cancel any existing animation
    if (cineAnimationRef.current) {
      cancelAnimationFrame(cineAnimationRef.current);
      cineAnimationRef.current = null;
    }

    if (!isPlaying || images.length <= 1) {
      return;
    }

    const frameInterval = 1000 / playbackSpeed; // ms per frame
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsCheck = performance.now();

    const animate = (currentTime) => {
      // Use ref for isPlaying check to avoid stale closure
      if (!isPlayingRef.current) {
        return;
      }

      const elapsed = currentTime - lastTime;

      if (elapsed >= frameInterval) {
        // Advance to next frame
        currentIndexRef.current = (currentIndexRef.current + 1) % images.length;
        onSliceChange(currentIndexRef.current);
        lastTime = currentTime;
        frameCount++;
      }

      cineAnimationRef.current = requestAnimationFrame(animate);
    };

    cineAnimationRef.current = requestAnimationFrame(animate);

    return () => {
      if (cineAnimationRef.current) {
        cancelAnimationFrame(cineAnimationRef.current);
        cineAnimationRef.current = null;
      }
    };
  }, [isPlaying, playbackSpeed, images.length, onSliceChange]);

  // Handle scrollbar change
  function handleScrollbarChange(e) {
    const newIndex = Number(e.target.value);
    onSliceChange(newIndex);
    if (isPlaying) {
      setIsPlaying(false);
    }
  }

  // Toggle cine play
  function toggleCinePlay() {
    setIsPlaying(!isPlaying);
  }

  // Handle speed change - restarts animation loop with new speed
  function handleSpeedChange(e) {
    const newSpeed = Number(e.target.value);
    setPlaybackSpeed(newSpeed);

    // If playing, restart the animation loop with new speed
    // The effect dependency on playbackSpeed will handle the restart
    if (isPlaying && cineAnimationRef.current) {
      cancelAnimationFrame(cineAnimationRef.current);
      cineAnimationRef.current = null;
    }
  }

  // Toggle minimize
  function toggleMinimize() {
    setIsMinimized(!isMinimized);
  }

  // Toggle maximize
  function toggleMaximize() {
    setIsMaximized(!isMaximized);
  }

  // Apply preset
  function handleApplyPreset(preset) {
    if (preset.windowWidth !== undefined && preset.windowCenter !== undefined) {
      setWindowLevel(preset.windowCenter, preset.windowWidth);
    }
    if (preset.gamma !== undefined) {
      setGamma(preset.gamma);
    }
  }

  // Reset all enhancements
  function handleResetAll() {
    // Reset Window/Level and Gamma
    setWindowLevel(128, 256);
    setGamma(1.0);
    // Reset CLAHE
    setClaheEnabled(false);
    setClaheStrength(2.0);
    setClaheTileSize(64);
    setAutoClipEnabled(false);
    // Reset Unsharp Mask
    setUnsharpEnabled(false);
    setUnsharpAmount(0.5);
    setUnsharpRadius(2);
    // Reset Wavelet Detail Enhancement
    setWaveletEnabled(false);
    setWaveletFactor(1.5);
    // Reset Bilateral Filter
    setBilateralEnabled(false);
    setBilateralSigmaSpace(2.0);
    setBilateralSigmaRange(0.1);
    // Reset NLM (optimized defaults)
    setNlmEnabled(false);
    setNlmStrength(0.5);
    setNlmPatchSize(3);
    setNlmSearchSize(7);
    // Reset Anisotropic Diffusion (optimized defaults)
    setAnisotropicEnabled(false);
    setAnisotropicIterations(3);
    setAnisotropicConductance(50);
  }

  // Full enhancement pipeline - processes all enabled features in sequence:
  // Denoise (NLM or Bilateral) → CLAHE → Wavelet → Unsharp → Window/Level + Gamma
  useEffect(() => {
    // Skip enhancement processing during cine playback for smooth animation
    if (isPlaying) {
      setProcessedImage(null); // Use raw image during cine
      return;
    }

    if (!image) {
      setProcessedImage(null);
      // Clear cache when image is unloaded
      prevPipelineParamsRef.current = null;
      pipelineResultCache.current = { preWindowLevel: null };
      return;
    }

    // Check if any enhancement is enabled (including wavelet and window/level/gamma)
    const hasEnhancements =
      claheEnabled ||
      unsharpEnabled ||
      waveletEnabled ||
      bilateralEnabled ||
      nlmEnabled ||
      anisotropicEnabled ||
      gamma !== 1.0;

    // Always process if we have enhancements OR if window/level is being adjusted
    // Window/Level always needs processing since it's the final display mapping
    if (!hasEnhancements && windowCenter === 128 && windowWidth === 255) {
      setProcessedImage(null);
      return;
    }

    // Create canvas to extract image data
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, image.width, image.height);

    setIsProcessing(true);

    // Determine denoising method (NLM takes priority over Bilateral)
    let denoiseType = null;
    let denoiseParams = null;

    if (nlmEnabled) {
      denoiseType = 'nlm';
      denoiseParams = {
        h: debouncedNlmStrength, // Use directly (range: 0.1-1.0)
        patchSize: debouncedNlmPatchSize,
        searchSize: debouncedNlmSearchSize,
      };
    } else if (bilateralEnabled) {
      denoiseType = 'bilateral';
      denoiseParams = {
        sigmaSpace: debouncedBilateralSpace,
        sigmaRange: debouncedBilateralRange,
      };
    }

    // Build pipeline parameters
    const pipelineParams = {
      denoiseType,
      denoiseParams,
      denoiseMode, // 'standard' | 'adaptive' | 'multiscale'
      anisotropicEnabled,
      anisotropicParams: anisotropicEnabled
        ? {
            iterations: debouncedIterations,
            conductance: debouncedConductance,
            timestep: 0.125,
          }
        : null,
      claheEnabled,
      claheParams: claheEnabled
        ? {
            clipLimit: debouncedClaheStrength,
            tileW: debouncedTileSize,
            tileH: debouncedTileSize,
            autoClip: autoClipEnabled,
          }
        : null,
      waveletEnabled,
      waveletFactor: debouncedWaveletFactor,
      unsharpEnabled,
      unsharpParams: unsharpEnabled
        ? {
            amount: debouncedUnsharpAmount,
            radius: debouncedUnsharpRadius,
          }
        : null,
      windowCenter,
      windowWidth,
      gamma,
    };

    // Apply enhancement pipeline synchronously with smart caching
    // Use setTimeout to allow UI to update processing indicator first
    setTimeout(() => {
      try {
        const processedImageData = applyEnhancementPipeline(
          imageData,
          image.width,
          image.height,
          pipelineParams,
          prevPipelineParamsRef.current,
          pipelineResultCache.current
        );

        // Create new image from processed data
        const processedCanvas = document.createElement('canvas');
        processedCanvas.width = image.width;
        processedCanvas.height = image.height;
        const processedCtx = processedCanvas.getContext('2d');
        processedCtx.putImageData(processedImageData, 0, 0);

        const processedImg = new window.Image();
        processedImg.onload = () => {
          setProcessedImage(processedImg);
          setIsProcessing(false);
        };
        processedImg.src = processedCanvas.toDataURL();
      } catch (err) {
        console.error('Enhancement pipeline failed:', err);
        setIsProcessing(false);
      }
    }, 10);
  }, [
    image,
    claheEnabled,
    debouncedClaheStrength,
    debouncedTileSize,
    autoClipEnabled,
    unsharpEnabled,
    debouncedUnsharpAmount,
    debouncedUnsharpRadius,
    waveletEnabled,
    debouncedWaveletFactor,
    bilateralEnabled,
    debouncedBilateralSpace,
    debouncedBilateralRange,
    nlmEnabled,
    debouncedNlmStrength,
    debouncedNlmPatchSize,
    debouncedNlmSearchSize,
    denoiseMode,
    anisotropicEnabled,
    debouncedIterations,
    debouncedConductance,
    windowCenter,
    windowWidth,
    gamma,
    isPlaying,
  ]);

  return (
    <div className={`viewport ${isMinimized ? 'minimized' : ''} ${isMaximized ? 'maximized' : ''}`} ref={containerRef} onClick={onFocus}>
      <PanelToolbar
        tool={tool}
        onToolChange={onToolChange}
        onFit={handleFit}
        zoom={scale}
        imageIndex={currentImageIndex}
        totalImages={images.length}
        onPrevious={() => currentImageIndex > 0 && onSliceChange(currentImageIndex - 1)}
        onNext={() => currentImageIndex < images.length - 1 && onSliceChange(currentImageIndex + 1)}
        syncEnabled={syncEnabled}
        onSyncToggle={onSyncToggle}
        isSynced={isSynced}
        onClose={onClose}
        protocolName={protocol?.protocol}
        isPlaying={isPlaying}
        onToggleCinePlay={toggleCinePlay}
        playbackSpeed={playbackSpeed}
        onSpeedChange={handleSpeedChange}
        isMinimized={isMinimized}
        isMaximized={isMaximized}
        onToggleMinimize={toggleMinimize}
        onToggleMaximize={toggleMaximize}
        showEnhancementPanel={showEnhancementPanel}
        onEnhancementToggle={() => setShowEnhancementPanel(!showEnhancementPanel)}
      />

      <div className="viewport-canvas">
        <Stage
          ref={stageRef}
          width={containerSize.width}
          height={containerSize.height}
          onWheel={handleWheel}
          style={{
            cursor: tool === 'pan' ? (isDragging ? 'grabbing' : 'grab') : tool === 'zoom' ? 'zoom-in' : 'default',
          }}
        >
          <Layer>
            {/* Image layer - use processed image if enhancements are enabled, otherwise use raw image */}
            {(processedImage || image) && (
              <KonvaImage
                image={processedImage || image}
                x={position.x}
                y={position.y}
                width={(processedImage || image).width * scale}
                height={(processedImage || image).height * scale}
                draggable={tool === 'pan'}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={(e) => {
                  handleDragEnd(e);
                  setIsDragging(false);
                }}
                filters={[]}
                listening={true}
              />
            )}
          </Layer>
        </Stage>

        {!image && images.length > 0 && (
          <div className="loading-image">Loading...</div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="processing-indicator">
            <div className="spinner" />
            <span>Processing...</span>
          </div>
        )}

        {/* Sync enabled indicator */}
        {syncEnabled && (
          <div className="sync-indicator" title="Scroll sync enabled">
            🔗
          </div>
        )}
      </div>

      {/* Scrollbar */}
      {images.length > 0 && (
        <div className="viewport-scrollbar">
          <input
            type="range"
            min="0"
            max={images.length - 1}
            value={currentImageIndex}
            onChange={handleScrollbarChange}
            className="scrollbar-slider"
          />
          <div className="scrollbar-labels">
            <span>1</span>
            <span>{currentImageIndex + 1}</span>
            <span>{images.length}</span>
          </div>
        </div>
      )}

      {/* Enhancement Panel */}
      {showEnhancementPanel && (
        <EnhancementPanel
          // Window/Level
          windowCenter={windowCenter}
          windowWidth={windowWidth}
          onWindowLevelChange={setWindowLevel}
          // Gamma
          gamma={gamma}
          onGammaChange={setGamma}
          // CLAHE
          claheEnabled={claheEnabled}
          claheStrength={debouncedClaheStrength}
          claheTileSize={debouncedTileSize}
          autoClipEnabled={autoClipEnabled}
          onClaheToggle={setClaheEnabled}
          onClaheStrengthChange={setClaheStrength}
          onClaheTileChange={setClaheTileSize}
          onAutoClipToggle={setAutoClipEnabled}
          // Unsharp Mask
          unsharpEnabled={unsharpEnabled}
          unsharpAmount={debouncedUnsharpAmount}
          unsharpRadius={debouncedUnsharpRadius}
          onUnsharpToggle={setUnsharpEnabled}
          onUnsharpAmountChange={setUnsharpAmount}
          onUnsharpRadiusChange={setUnsharpRadius}
          // Wavelet Detail Enhancement
          waveletEnabled={waveletEnabled}
          waveletFactor={debouncedWaveletFactor}
          onWaveletToggle={setWaveletEnabled}
          onWaveletFactorChange={setWaveletFactor}
          // Bilateral Filter
          bilateralEnabled={bilateralEnabled}
          bilateralSigmaSpace={debouncedBilateralSpace}
          bilateralSigmaRange={debouncedBilateralRange}
          onBilateralToggle={setBilateralEnabled}
          onBilateralSpaceChange={setBilateralSigmaSpace}
          onBilateralRangeChange={setBilateralSigmaRange}
          // NLM
          nlmEnabled={nlmEnabled}
          nlmStrength={debouncedNlmStrength}
          nlmPatchSize={nlmPatchSize}
          nlmSearchSize={nlmSearchSize}
          denoiseMode={denoiseMode}
          onDenoiseModeChange={setDenoiseMode}
          onNlmToggle={setNlmEnabled}
          onNlmStrengthChange={setNlmStrength}
          onNlmPatchChange={setNlmPatchSize}
          onNlmSearchChange={setNlmSearchSize}
          // Presets
          onApplyPreset={handleApplyPreset}
          // Reset all
          onReset={handleResetAll}
        />
      )}

      {/* Histogram Display */}
      {showHistogram && histogramData && (
        <HistogramDisplay
          histogramData={histogramData}
          windowCenter={windowCenter}
          windowWidth={windowWidth}
          onWindowLevelChange={setWindowLevel}
          statistics={histogramStats}
        />
      )}
    </div>
  );
}
