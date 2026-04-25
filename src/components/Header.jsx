import { useState } from 'react';
import ScrapeDialog from './ScrapeDialog';
import './Header.css';

export default function Header({ onScrape, onRefresh, serverStatus }) {
  const [showScrapeDialog, setShowScrapeDialog] = useState(false);

  async function handleScrapeClick() {
    setShowScrapeDialog(true);
  }

  function handleScrapeComplete() {
    setShowScrapeDialog(false);
    onRefresh();
  }

  return (
    <>
      <header className="header">
        <div className="header-left">
          <div className="app-title">
            <span className="icon">🔬</span>
            RADIOPAEDIA VIEWER
          </div>
          {serverStatus && (
            <div className={`server-status-badge ${serverStatus}`}>
              <span className="dot"></span>
              <span>{serverStatus === 'connected' ? 'Online' : 'Offline'}</span>
            </div>
          )}
        </div>

        <div className="header-right">
          <button className="btn btn-primary" onClick={handleScrapeClick}>
            <span className="icon">+</span> Scrape URL
          </button>
          <button className="btn btn-secondary" onClick={onRefresh} title="Refresh cases">
            <span className="icon">↻</span>
          </button>
          <button className="btn btn-icon" title="Settings">
            <span className="icon">⚙</span>
          </button>
        </div>
      </header>

      {showScrapeDialog && (
        <ScrapeDialog
          onClose={() => setShowScrapeDialog(false)}
          onComplete={handleScrapeComplete}
        />
      )}
    </>
  );
}
