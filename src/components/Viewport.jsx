import { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import PanelToolbar from './PanelToolbar';
import EnhancementPanel from './EnhancementPanel';
import { useImageEnhancement } from '../hooks/useImageEnhancement';
import './Viewport.css';

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
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 400, height: 300 });
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showEnhancementPanel, setShowEnhancementPanel] = useState(false);

  // Image enhancement hook
  const {
    windowCenter,
    windowWidth,
    gamma,
    setWindowLevel,
    setGamma,
    reset,
  } = useImageEnhancement();

  // Track the current protocol to detect protocol changes
  const currentProtocolRef = useRef(null);

  // Cine play state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(5); // frames per second (1-60)
  const cineIntervalRef = useRef(null);

  // Load image when index changes
  useEffect(() => {
    if (!images[currentImageIndex]) {
      return;
    }

    const imageUrl = images[currentImageIndex];

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      setImage(img);

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
        onToolChange('pan');
        onToolSelect('pan');
      } else if (e.key === 'z' || e.key === 'Z') {
        onToolChange('zoom');
        onToolSelect('zoom');
      } else if (e.key === 'b' || e.key === 'B') {
        // Toggle brightness/contrast panel
        setBrightness((prev) => prev === 100 ? 100 : 100);
      } else if (e.key === 'e' || e.key === 'E') {
        // Toggle enhancement panel
        setShowEnhancementPanel(!showEnhancementPanel);
      } else if (e.key === '1') {
        onToolSelect('bbox');
        onToolChange('pan');
      } else if (e.key === '2') {
        onToolSelect('polygon');
        onToolChange('pan');
      } else if (e.key === '3') {
        onToolSelect('keypoint');
        onToolChange('pan');
      } else if (e.key === '4') {
        onToolSelect('brush');
        onToolChange('pan');
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
  }, [currentImageIndex, images.length, isActive, onSliceChange, onToolChange, onToolSelect, toggleCinePlay]);

  // Handle drag end
  function handleDragEnd(e) {
    if (tool !== 'pan') return;
    setPosition({
      x: e.target.x(),
      y: e.target.y(),
    });
  }

  // Cine play effect
  useEffect(() => {
    if (isPlaying) {
      cineIntervalRef.current = setInterval(() => {
        const nextIndex = currentImageIndex + 1;
        if (nextIndex >= images.length) {
          // Loop back to start
          onSliceChange(0);
        } else {
          onSliceChange(nextIndex);
        }
      }, 1000 / playbackSpeed);
    } else {
      if (cineIntervalRef.current) {
        clearInterval(cineIntervalRef.current);
        cineIntervalRef.current = null;
      }
    }

    return () => {
      if (cineIntervalRef.current) {
        clearInterval(cineIntervalRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, currentImageIndex, images.length, onSliceChange]);

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

  // Handle speed change
  function handleSpeedChange(e) {
    setPlaybackSpeed(Number(e.target.value));
  }

  // Toggle minimize
  function toggleMinimize() {
    setIsMinimized(!isMinimized);
  }

  // Toggle maximize
  function toggleMaximize() {
    setIsMaximized(!isMaximized);
  }

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
        brightness={brightness}
        contrast={contrast}
        onBrightnessChange={setBrightness}
        onContrastChange={setContrast}
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

      <div
        className="viewport-canvas"
        style={{
          filter: `brightness(${brightness}%) contrast(${contrast}%)`,
        }}
      >
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
            {/* Base image layer */}
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
                filters={[]}
                listening={true}
              />
            )}
          </Layer>
        </Stage>

        {!image && images.length > 0 && (
          <div className="loading-image">Loading...</div>
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
          windowCenter={windowCenter}
          windowWidth={windowWidth}
          gamma={gamma}
          onWindowLevelChange={setWindowLevel}
          onGammaChange={setGamma}
          onReset={reset}
        />
      )}
    </div>
  );
}
