import { useState } from 'react';
import './LabelHierarchy.css';

// Anatomical label taxonomy
const LABEL_TAXONOMY = {
  'Skeletal': {
    'Vertebra': ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'L1', 'L2', 'L3', 'L4', 'L5'],
    'Pelvis': ['Ilium', 'Ischium', 'Pubis', 'Sacrum', 'Coccyx'],
    'Ribs': ['Rib 1-12'],
  },
  'Cardiovascular': {
    'Heart': ['LV', 'RV', 'LA', 'RA', 'Myocardium', 'Pericardium'],
    'Vessels': ['Aorta', 'Pulmonary Artery', 'SVC', 'IVC'],
  },
  'Neurological': {
    'Brain': ['Frontal Lobe', 'Parietal Lobe', 'Temporal Lobe', 'Occipital Lobe', 'Cerebellum', 'Brainstem'],
    'Spine': ['Cervical', 'Thoracic', 'Lumbar', 'Sacral'],
  },
  'Abdominal': {
    'GI': ['Liver', 'Spleen', 'Pancreas', 'Stomach', 'Small Bowel', 'Colon'],
    'GU': ['Kidney', 'Bladder', 'Prostate', 'Uterus'],
    'Muscles': ['Psoas', 'Quadratus Lumborum', 'Paraspinal'],
  },
  'Thoracic': {
    'Lungs': ['RUL', 'RML', 'RLL', 'LUL', 'LLL'],
    'Mediastinum': ['Trachea', 'Esophagus', 'Lymph Nodes'],
  },
};

export default function LabelHierarchy({ selectedLabel, onSelectLabel, searchTerm, onSearchChange }) {
  const [expandedGroups, setExpandedGroups] = useState({});

  function toggleGroup(groupPath) {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupPath]: !prev[groupPath],
    }));
  }

  function renderTaxonomy() {
    return Object.entries(LABEL_TAXONOMY).map(([system, organs]) => (
      <div key={system} className="label-system">
        <div
          className="label-system-header"
          onClick={() => toggleGroup(system)}
        >
          <span className={`expand-icon ${expandedGroups[system] ? 'expanded' : ''}`}>▶</span>
          <span className="label-system-name">{system}</span>
        </div>

        {expandedGroups[system] && (
          <div className="label-organs">
            {Object.entries(organs).map(([organ, structures]) => (
              <div key={organ} className="label-organ">
                <div
                  className="label-organ-header"
                  onClick={() => toggleGroup(`${system}-${organ}`)}
                >
                  <span className={`expand-icon ${expandedGroups[`${system}-${organ}`] ? 'expanded' : ''}`}>▶</span>
                  <span className="label-organ-name">{organ}</span>
                </div>

                {expandedGroups[`${system}-${organ}`] && (
                  <div className="label-structures">
                    {structures.map((structure) => (
                      <button
                        key={structure}
                        className={`label-structure ${selectedLabel === structure ? 'selected' : ''}`}
                        onClick={() => onSelectLabel(structure)}
                      >
                        {structure}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    ));
  }

  return (
    <div className="label-hierarchy">
      <div className="label-search">
        <input
          type="text"
          placeholder="Search labels..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="label-tree">
        {renderTaxonomy()}
      </div>
    </div>
  );
}
