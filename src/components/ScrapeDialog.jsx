import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import './ScrapeDialog.css';

export default function ScrapeDialog({ onClose, onComplete }) {
  const [url, setUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    api.onScraperOutput((output) => {
      setProgress((prev) => prev + '\n' + output.trim());
    });
    api.onScraperError((err) => {
      setError(err);
    });
  }, []);

  async function handleStartScrape() {
    if (!url.trim()) return;

    try {
      setIsScraping(true);
      setError(null);
      setProgress('Starting scraper...');

      await api.startScrape(url);

      setIsScraping(false);
      setProgress('Scraping completed!');

      // Wait a moment for file system to update, then complete
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err) {
      setIsScraping(false);
      setError(err.message || 'Scraping failed');
    }
  }

  function handleCancel() {
    if (isScraping) {
      setError('Cancellation not yet implemented - scraping will complete in background');
    } else {
      onClose();
    }
  }

  return (
    <div className="scrape-dialog-overlay">
      <div className="scrape-dialog">
        <div className="scrape-dialog-header">
          <h2>Scrape Radiopaedia Case</h2>
          <button className="close-btn" onClick={handleCancel}>×</button>
        </div>

        <div className="scrape-dialog-body">
          <div className="input-group">
            <label htmlFor="url-input">Radiopaedia URL</label>
            <input
              id="url-input"
              type="url"
              placeholder="https://radiopaedia.org/cases/.../studies/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isScraping}
              autoFocus
            />
          </div>

          {isScraping && (
            <div className="progress-section">
              <div className="progress-bar">
                <div className="progress-indicator"></div>
              </div>
              <div className="progress-text">{progress}</div>
            </div>
          )}

          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        <div className="scrape-dialog-footer">
          <button className="btn btn-secondary" onClick={handleCancel}>
            {isScraping ? 'Cancel' : 'Close'}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleStartScrape}
            disabled={!url.trim() || isScraping}
          >
            {isScraping ? 'Scraping...' : 'Start Scraping'}
          </button>
        </div>
      </div>
    </div>
  );
}
