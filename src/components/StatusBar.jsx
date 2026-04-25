import './StatusBar.css';

export default function StatusBar({ caseTitle, modality, protocol, imageIndex, totalImages }) {
  return (
    <footer className="status-bar">
      <div className="status-left">
        <span className="status-item case-info">
          <span className="label">Case:</span> {caseTitle}
        </span>
        <span className="separator">|</span>
        <span className="status-item">
          <span className="label">Modality:</span> {modality}
        </span>
        <span className="separator">|</span>
        <span className="status-item">
          <span className="label">Protocol:</span> {protocol}
        </span>
      </div>

      <div className="status-right">
        <span className="status-item image-info">
          <span className="label">Image:</span> {imageIndex + 1} / {totalImages}
        </span>
      </div>
    </footer>
  );
}
