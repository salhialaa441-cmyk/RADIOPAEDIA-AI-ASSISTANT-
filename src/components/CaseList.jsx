import { useState } from 'react';
import './CaseList.css';

export default function CaseList({ cases, selectedCase, onSelectCase, onOpenFolder }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCases = cases.filter((c) =>
    c.caseTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.caseId?.toString().includes(searchTerm)
  );

  return (
    <div className="case-list">
      <div className="case-list-header">
        <h3>Cases</h3>
        <span className="case-count">{cases.length}</span>
      </div>

      <div className="case-search">
        <input
          type="text"
          placeholder="Search cases..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="case-list-content">
        {filteredCases.length === 0 ? (
          <div className="empty-state">
            <p>No cases found</p>
            <p className="hint">Scrape a Radiopaedia URL or open a case folder</p>
          </div>
        ) : (
          filteredCases.map((caseItem, index) => (
            <div
              key={index}
              className={`case-card ${selectedCase?.folderName === caseItem.folderName ? 'selected' : ''}`}
              onClick={() => onSelectCase(caseItem)}
            >
              <div className="case-card-header">
                <span className="case-id">#{caseItem.caseId}</span>
                <div className="case-modalities">
                  {caseItem.modalities?.map((m, i) => (
                    <span key={i} className="modality-badge">{m.modality}</span>
                  ))}
                </div>
              </div>
              <div className="case-card-title">
                {caseItem.caseTitle || 'Untitled Case'}
              </div>
              <div className="case-card-meta">
                <span className="scraped-date">
                  {caseItem.scrapedAt ? new Date(caseItem.scrapedAt).toLocaleDateString() : ''}
                </span>
                <span className="image-count">
                  {caseItem.downloadStatus?.totalImagesDownloaded || 0} images
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
