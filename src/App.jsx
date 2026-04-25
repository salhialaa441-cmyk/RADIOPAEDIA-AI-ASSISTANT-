import { useState, useEffect } from 'react';
import CaseList from './components/CaseList';
import PanelGrid from './components/PanelGrid';
import StatusBar from './components/StatusBar';
import Header from './components/Header';
import { api, checkServerStatus, isElectron } from './utils/api';
import './App.css';

function App() {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [selectedModality, setSelectedModality] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking');
  const [showModeHelp, setShowModeHelp] = useState(false);
  const [showCases, setShowCases] = useState(true);

  // Detect if running in wrong mode (browser without server)
  useEffect(() => {
    // If in browser mode (not Electron) and server is disconnected, show help
    if (!isElectron && serverStatus === 'disconnected') {
      setShowModeHelp(true);
    }
  }, [serverStatus]);

  // Check server status and load cases on mount
  useEffect(() => {
    checkServerStatus().then((isRunning) => {
      setServerStatus(isRunning ? 'connected' : 'disconnected');
      if (isRunning) {
        loadCases();
      }
    });
  }, []);

  async function loadCases() {
    try {
      setIsLoading(true);
      const scannedCases = await api.scanCases();
      setCases(scannedCases);
      setError(null);
    } catch (err) {
      setError('Failed to load cases: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSelectCase(caseItem) {
    try {
      setSelectedCase(caseItem);
      setIsLoading(true);
      const data = await api.getCaseData(caseItem.folderName);
      setCaseData(data);

      if (data.modalities && data.modalities.length > 0) {
        setSelectedModality(data.modalities[0]);
      }
      setError(null);
    } catch (err) {
      setError('Failed to load case: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelectModality(modality) {
    setSelectedModality(modality);
  }

  function toggleCases() {
    setShowCases(!showCases);
  }

  return (
    <div className="app">
      <Header
        onScrape={() => console.log('Scrape clicked')}
        onRefresh={loadCases}
        serverStatus={serverStatus}
      />

      <div className="main-content">
        {showCases && (
          <CaseList
            cases={cases}
            selectedCase={selectedCase}
            onSelectCase={handleSelectCase}
            onOpenFolder={loadCases}
          />
        )}

        <div className="viewer-section">
          {caseData && selectedModality ? (
            <>
              <div className="modality-protocol-bar">
                <div className="modality-tabs">
                  {caseData.modalities.map((modality, index) => (
                    <button
                      key={index}
                      className={`modality-tab ${selectedModality === modality ? 'active' : ''}`}
                      onClick={() => handleSelectModality(modality)}
                    >
                      {modality.name}
                    </button>
                  ))}
                </div>

                <div className="protocol-pills">
                  {selectedModality.protocols.map((protocol, index) => (
                    <button
                      key={index}
                      className={`protocol-pill ${index === 0 ? 'active' : ''}`}
                      onClick={(e) => {
                        // Dispatch custom event that PanelGrid listens for
                        const openInNewPanel = e.ctrlKey || e.metaKey;
                        window.dispatchEvent(new CustomEvent('protocol-select', {
                          detail: { protocol, openInNewPanel }
                        }));
                      }}
                      title="Click to load, Ctrl+Click to open in new panel"
                    >
                      {protocol.protocol}
                    </button>
                  ))}
                </div>
              </div>

              <PanelGrid
                protocols={selectedModality.protocols}
                caseFolder={selectedCase?.folderName}
                imageServerUrl={api.getImageServerUrl()}
              />
            </>
          ) : (
            <div className="empty-viewer">
              {selectedCase ? 'Select a modality and protocol to view images' : 'Select a case to get started'}
            </div>
          )}
        </div>
      </div>

      {caseData && (
        <StatusBar
          caseTitle={caseData?.metadata?.caseTitle || ''}
          modality={selectedModality?.name || ''}
          protocol=""
          imageIndex={0}
          totalImages={0}
        />
      )}

      {/* Toggle cases button */}
      <button
        className={`toggle-cases-btn ${showCases ? 'cases-shown' : 'cases-hidden'}`}
        onClick={toggleCases}
        title={showCases ? 'Hide cases sidebar (Tab)' : 'Show cases sidebar (Tab)'}
      >
        {showCases ? '◀' : '▶'}
      </button>

      {/* Keyboard shortcut handler */}
      <KeyboardHandler onToggleCases={toggleCases} />

      {isLoading && <div className="loading-overlay">Loading...</div>}
      {error && <div className="error-overlay">{error}</div>}

      {/* Mode help modal - shown when running in browser without server */}
      {showModeHelp && (
        <div className="loading-overlay" style={{ zIndex: 2000 }} onClick={() => setShowModeHelp(false)}>
          <div
            style={{
              background: '#1a1a2e',
              border: '2px solid #e74c5c',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: '#e74c5c', marginBottom: '16px' }}>Server Not Running</h2>
            <p style={{ marginBottom: '24px', lineHeight: '1.6' }}>
              The app is running in a web browser, but the standalone server is not running.
            </p>
            <div style={{ textAlign: 'left', background: '#0f0f23', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
              <strong style={{ color: '#3498db' }}>Choose one of these options:</strong>
              <br /><br />
              <strong style={{ color: '#2ecc71' }}>Option A (Recommended for debugging):</strong>
              <br />
              1. Close this browser tab
              <br />
              2. Double-click <code>start.bat</code>
              <br />
              3. The app will open automatically at http://localhost:3456
              <br /><br />
              <strong style={{ color: '#f39c12' }}>Option B (Desktop app):</strong>
              <br />
              1. Close this browser tab
              <br />
              2. Double-click <code>start-electron.bat</code>
              <br />
              3. The Electron desktop app will open
            </div>
            <button
              onClick={() => setShowModeHelp(false)}
              style={{
                background: '#e74c5c',
                color: 'white',
                border: 'none',
                padding: '12px 32px',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Debug info panel - press 'D' to toggle */}
      <DebugInfoPanel
        cases={cases}
        caseData={caseData}
        selectedModality={selectedModality}
        serverStatus={serverStatus}
      />

      {/* Console log viewer - press 'L' to toggle */}
      <ConsoleLogViewer />

      {/* Server status indicator */}
      <div className={`server-status ${serverStatus}`}>
        <span className="status-dot"></span>
        <span className="status-text">
          {serverStatus === 'connected' ? 'Server Connected' :
           serverStatus === 'disconnected' ? 'Server Disconnected' : 'Checking...'}
        </span>
      </div>
    </div>
  );
}

export default App;

// Debug Info Panel Component
function DebugInfoPanel({ cases, caseData, selectedModality, serverStatus }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'd' || e.key === 'D') {
        setVisible(v => !v);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '20px',
        background: '#0f0f23',
        border: '1px solid #3498db',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 3000,
        maxWidth: '400px',
        maxHeight: '300px',
        overflow: 'auto',
      }}
    >
      <h4 style={{ margin: '0 0 8px 0', color: '#3498db' }}>DEBUG INFO (Press 'D' to close)</h4>
      <div><strong>Server:</strong> {serverStatus}</div>
      <div><strong>Cases loaded:</strong> {cases.length}</div>
      <div><strong>Selected case:</strong> {caseData?.metadata?.caseTitle || 'None'}</div>
      <div><strong>Modalities:</strong> {caseData?.modalities?.length || 0}</div>
      {selectedModality && (
        <>
          <div><strong>Selected modality:</strong> {selectedModality.name}</div>
          <div><strong>Protocols:</strong> {selectedModality.protocols.length}</div>
          {selectedModality.protocols.length > 0 && (
            <div style={{ marginTop: '8px', paddingLeft: '8px', borderLeft: '2px solid #3498db' }}>
              {selectedModality.protocols.map((p, i) => (
                <div key={i} style={{ marginBottom: '4px' }}>
                  <span style={{ color: '#2ecc71' }}>{p.protocol}</span>
                  <span style={{ color: '#888' }}> ({p.imagesDownloaded} images)</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <div style={{ marginTop: '8px', fontSize: '10px', color: '#888' }}>
        Tip: Share this info when reporting issues
      </div>
    </div>
  );
}

// Keyboard Handler Component
function KeyboardHandler({ onToggleCases }) {
  useEffect(() => {
    function handleKeyDown(e) {
      // Tab key toggles cases sidebar
      if (e.key === 'Tab') {
        e.preventDefault();
        onToggleCases();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleCases]);

  return null;
}

// Console Log Viewer Component - press 'L' to toggle
function ConsoleLogViewer() {
  const [visible, setVisible] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Capture console.log calls
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args) => {
      setLogs(prev => [...prev.slice(-99), { type: 'log', message: args.join(' '), time: new Date().toLocaleTimeString() }]);
      originalLog.apply(console, args);
    };
    console.warn = (...args) => {
      setLogs(prev => [...prev.slice(-99), { type: 'warn', message: args.join(' '), time: new Date().toLocaleTimeString() }]);
      originalWarn.apply(console, args);
    };
    console.error = (...args) => {
      setLogs(prev => [...prev.slice(-99), { type: 'error', message: args.join(' '), time: new Date().toLocaleTimeString() }]);
      originalError.apply(console, args);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'l' || e.key === 'L') {
        setVisible(v => !v);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '20px',
        background: '#0f0f23',
        border: '1px solid #e74c5c',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '11px',
        fontFamily: 'monospace',
        zIndex: 3000,
        width: '500px',
        maxHeight: '400px',
        overflow: 'auto',
      }}
    >
      <h4 style={{ margin: '0 0 8px 0', color: '#e74c5c' }}>CONSOLE LOGS (Press 'L' to close)</h4>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <button onClick={() => setLogs([])} style={{ padding: '4px 8px', cursor: 'pointer' }}>Clear</button>
      </div>
      {logs.map((log, i) => (
        <div key={i} style={{
          padding: '2px 0',
          borderBottom: '1px solid #222',
          color: log.type === 'error' ? '#e74c5c' : log.type === 'warn' ? '#f39c12' : '#2ecc71'
        }}>
          <span style={{ color: '#666' }}>[{log.time}]</span> {log.message}
        </div>
      ))}
    </div>
  );
}
