import React, { useState, useEffect, useCallback, useRef } from 'react';
import Viewport from './Viewport';
import './PanelGrid.css';

export default function PanelGrid({ protocols, caseFolder, imageServerUrl }) {
  const [panels, setPanels] = useState([]);
  const [syncGroupIds, setSyncGroupIds] = useState([]); // Array instead of Set for React state
  const [layout, setLayout] = useState('single');
  const [activePanelId, setActivePanelId] = useState(null); // Track which panel receives keyboard input

  // Resizable panel state
  const [panelSizes, setPanelSizes] = useState({});
  const [resizingPanel, setResizingPanel] = useState(null);
  const containerRef = useRef(null);

  // Remove annotation-related panel state
  // panels no longer need: annotations, selectedAnnotationId, selectedTool, selectedLabel

  // Initialize with single panel when protocols change
  useEffect(() => {
    if (protocols && protocols.length > 0 && panels.length === 0) {
      addPanel(protocols[0]);
    }
  }, [protocols, caseFolder, imageServerUrl]);

  // Listen for protocol select events from App
  useEffect(() => {
    function handleProtocolSelect(event) {
      const { protocol, openInNewPanel } = event.detail;
      if (openInNewPanel) {
        addPanel(protocol);
      } else if (panels.length > 0) {
        const images = generateImageUrls(protocol, caseFolder, imageServerUrl);
        updatePanel(panels[0].id, { protocol, images, currentImageIndex: 0 });
      }
    }

    window.addEventListener('protocol-select', handleProtocolSelect);
    return () => window.removeEventListener('protocol-select', handleProtocolSelect);
  }, [panels, caseFolder, imageServerUrl]);

  // Regenerate image URLs when caseFolder or imageServerUrl changes
  useEffect(() => {
    if (panels.length > 0 && caseFolder && imageServerUrl) {
      setPanels(prev => prev.map(panel => ({
        ...panel,
        images: generateImageUrls(panel.protocol, caseFolder, imageServerUrl)
      })));
    }
  }, [caseFolder, imageServerUrl]);

  function addPanel(protocol) {
    const newPanel = {
      id: Date.now(),
      protocol,
      currentImageIndex: 0,
      images: generateImageUrls(protocol, caseFolder, imageServerUrl),
      tool: 'pan',
      syncEnabled: false,
    };

    setPanels((prev) => {
      const updated = [...prev, newPanel];
      updateLayout(updated.length);
      setActivePanelId(newPanel.id);
      return updated;
    });
  }

  function removePanel(panelId) {
    setPanels((prev) => {
      const updated = prev.filter((p) => p.id !== panelId);
      updateLayout(updated.length);
      if (activePanelId === panelId) {
        setActivePanelId(updated.length > 0 ? updated[updated.length - 1].id : null);
      }
      return updated;
    });
  }

  function updatePanel(panelId, updates) {
    setPanels((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, ...updates } : p))
    );
  }

  function updateLayout(panelCount) {
    if (panelCount === 1) setLayout('single');
    else if (panelCount === 2) setLayout('split');
    else if (panelCount === 3) setLayout('1-plus-2');
    else if (panelCount >= 4) setLayout('2x2');
  }

  function toggleSync(panelId) {
    setPanels((prev) => {
      const toggledPanel = prev.find(p => p.id === panelId);
      const newSyncEnabled = !toggledPanel.syncEnabled;

      // If enabling sync, add to sync group; if disabling, remove from sync group
      setSyncGroupIds((prevGroup) => {
        if (newSyncEnabled) {
          // Add to sync group when enabling
          return [...prevGroup, panelId];
        } else {
          // Remove from sync group when disabling
          return prevGroup.filter(id => id !== panelId);
        }
      });

      return prev.map((p) => {
        if (p.id === panelId) {
          return { ...p, syncEnabled: newSyncEnabled };
        }
        return p;
      });
    });
  }

  const handleSliceChange = useCallback((panelId, newIndex) => {
    const sourcePanel = panels.find((p) => p.id === panelId);
    if (!sourcePanel) {
      return;
    }

    updatePanel(panelId, { currentImageIndex: newIndex });

    if (sourcePanel.syncEnabled && syncGroupIds.includes(panelId)) {
      const maxSourceIndex = Math.max(1, sourcePanel.images.length - 1);
      const normalizedPosition = newIndex / maxSourceIndex;

      panels.forEach((targetPanel) => {
        if (
          targetPanel.id !== panelId &&
          targetPanel.syncEnabled &&
          syncGroupIds.includes(targetPanel.id)
        ) {
          const maxTargetIndex = Math.max(1, targetPanel.images.length - 1);
          const targetIndex = Math.round(normalizedPosition * maxTargetIndex);
          updatePanel(targetPanel.id, { currentImageIndex: targetIndex });
        }
      });
    }
  }, [panels, syncGroupIds]);

  function handleAddPanel(protocol) {
    addPanel(protocol);
  }

  function handlePanelFocus(panelId) {
    setActivePanelId(panelId);
  }

  // Removed handleAnnotationComplete - annotation tools removed

  // Handle divider drag for resizing
  function handleDividerMouseDown(panelId, direction) {
    setResizingPanel({ panelId, direction });
  }

  useEffect(() => {
    function handleMouseMove(e) {
      if (!resizingPanel || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      if (resizingPanel.direction === 'horizontal') {
        const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
        const clampedWidth = Math.max(20, Math.min(80, newWidth));
        setPanelSizes(prev => ({ ...prev, [resizingPanel.panelId]: clampedWidth }));
      } else if (resizingPanel.direction === 'vertical') {
        const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
        const clampedHeight = Math.max(20, Math.min(80, newHeight));
        setPanelSizes(prev => ({ ...prev, [resizingPanel.panelId]: clampedHeight }));
      }
    }

    function handleMouseUp() {
      setResizingPanel(null);
    }

    if (resizingPanel) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingPanel]);

  // Render panel with optional divider
  function renderPanel(panel, index) {
    // For layout-split (2 panels side-by-side): show divider after first panel
    const showDivider = layout === 'split' && index === 0;
    // For layout-1-plus-2: show vertical divider after first panel, horizontal after second
    const showVerticalDivider = layout === '1-plus-2' && index === 0;
    const showHorizontalDivider = layout === '1-plus-2' && index === 1;

    return (
      <React.Fragment key={panel.id}>
        <Viewport
          key={panel.id}
          panelId={panel.id}
          protocol={panel.protocol}
          images={panel.images}
          currentImageIndex={panel.currentImageIndex}
          tool={panel.tool}
          syncEnabled={panel.syncEnabled}
          isActive={activePanelId === panel.id}
          onFocus={() => handlePanelFocus(panel.id)}
          onSliceChange={(newIndex) => handleSliceChange(panel.id, newIndex)}
          onToolChange={(tool) => updatePanel(panel.id, { tool })}
          onSyncToggle={() => toggleSync(panel.id)}
          onClose={() => removePanel(panel.id)}
          isSynced={syncGroupIds.includes(panel.id)}
          style={panelSizes[panel.id] ? { flex: `0 0 ${panelSizes[panel.id]}%` } : {}}
        />
        {showHorizontalDivider && (
          <div
            className="panel-divider"
            onMouseDown={() => handleDividerMouseDown(panel.id, 'horizontal')}
          />
        )}
        {showVerticalDivider && (
          <div
            className="panel-divider"
            onMouseDown={() => handleDividerMouseDown(panel.id, 'vertical')}
          />
        )}
      </React.Fragment>
    );
  }

  return (
    <div className={`panel-grid layout-${layout}`} ref={containerRef}>
      {panels.map((panel, index) => renderPanel(panel, index))}
    </div>
  );
}

function generateImageUrls(protocol, caseFolder, imageServerUrl) {
  if (!protocol || !caseFolder || !imageServerUrl) {
    return [];
  }

  let protocolFolderName = protocol.protocolFolderName;

  if (!protocolFolderName && protocol.protocolPath) {
    const pathParts = protocol.protocolPath.replace(/\\/g, '/').split('/');
    protocolFolderName = pathParts[pathParts.length - 1];
  }

  if (!protocolFolderName) {
    protocolFolderName = protocol.folderName;
  }

  const baseUrl = `${imageServerUrl}/${caseFolder}/${protocol.modality}/${protocolFolderName}/${protocol.folderName}/images`;

  const urls = [];
  for (let i = 0; i < protocol.imagesDownloaded; i++) {
    urls.push(`${baseUrl}/img_${String(i + 1).padStart(4, '0')}.jpg`);
  }

  return urls;
}
