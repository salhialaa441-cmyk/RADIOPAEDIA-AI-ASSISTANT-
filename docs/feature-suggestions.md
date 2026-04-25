# Medical Imaging Viewer - Suggested Features

Based on analysis of medical imaging viewers (OsiriX, Horos, 3D Slicer, RadiAnt) and ML annotation tools (Labelbox, CVAT, V7), here are recommended features organized by priority.

## ✅ Implemented (Session 2026-04-25)

- [x] Scrollbar for smooth image navigation
- [x] Cine play with adjustable speed (1-60 fps)
- [x] Brightness/Contrast controls (fixed)
- [x] Keyboard shortcuts for cine (Space), speed (+/-)
- [x] Pan/Zoom preserved across slices

---

## 🔴 High Priority (Core Workflow)

### 1. Measurement Tools
**Purpose:** Clinical measurements for diagnosis and treatment planning

- **Distance measurement:** Line tool showing mm/cm distance
- **Angle measurement:** Goniometer for joint angles, Cobb angle
- **Area measurement:** Ellipse/rectangle ROI with area calculation
- **HU calibration:** Display Hounsfield units for CT (requires DICOM, not JPEG)

**Implementation:** Add to Konva canvas as overlay, store in annotations

### 2. Window/Level Presets
**Purpose:** Quick optimization for different tissue types

| Preset | Window | Level | Use Case |
|--------|--------|-------|----------|
| Brain | 80 | 40 | Neuro imaging |
| Abdomen | 400 | 40 | Soft tissue |
| Lung | 1500 | -600 | Pulmonary |
| Bone | 2000 | 500 | Skeletal |
| Liver | 150 | 30 | Hepatic |

**Implementation:** Dropdown in toolbar, maps to brightness/contrast values

### 3. Image Stacking / Thumbnail Strip
**Purpose:** See all slices at once, quick navigation

- Horizontal thumbnail strip below main viewport
- Current slice highlighted
- Click to jump to slice
- Shows pathology location at a glance

### 4. Hanging Protocols
**Purpose:** Save and restore viewport layouts

- Save current layout (which protocols in which panels)
- Named presets: "Neuro", "MSK", "Body", "Oncology Follow-up"
- One-click restore of multi-panel comparisons

---

## 🟡 Medium Priority (Advanced Features)

### 5. MPR (Multi-Planar Reformation)
**Purpose:** View orthogonal planes simultaneously

- Axial + Sagittal + Coronal in 3 panels
- Crosshairs show intersection point
- Sync navigation across planes
- **Requires:** DICOM with orientation metadata (not available in JPEG)

### 6. Annotation Tools (ML-Focused)
**Purpose:** Create training data for ML models

| Tool | Shape | Export Format |
|------|-------|---------------|
| Bounding Box | Rectangle | COCO bbox, YOLO |
| Polygon | Free-form polygon | COCO segmentation |
| Keypoint | Point landmark | COCO keypoints |
| Brush | Freehand mask | PNG mask, RLE |
| Circle | Ellipse | COCO bbox |

**Features needed:**
- Label hierarchy (anatomical taxonomy)
- Color coding by label
- Annotation list panel (edit, delete, filter)
- Export to COCO JSON, YOLO TXT

### 7. Comparison Modes
**Purpose:** Side-by-side analysis

- **Mirror flip:** Horizontal flip for left/right comparison
- **Link scroll:** Already implemented as sync
- **Subtraction mode:** Difference overlay (requires registration)
- **Blend mode:** Crossfade between protocols

### 8. Patient Study Browser
**Purpose:** Multi-case comparison

- Longitudinal studies (same patient, different dates)
- Timeline view
- Auto-match protocols across studies

---

## 🟢 Low Priority (Nice to Have)

### 9. Cine Features
- **Bidirectional play:** Forward/reverse toggle
- **Step-and-shoot:** Press-hold to advance, release stops
- **Speed ramping:** Slow at ends, fast in middle
- **Loop region:** Mark start/end, loop only that range

### 10. Display Calibration
- **DICOM GSDF:** Grayscale standard display function
- **Gamma correction:** Adjust for monitor characteristics
- **Ambient light sensor:** Auto-adjust for room lighting

### 11. Reporting Tools
- **Voice dictation:** Speech-to-text for reports
- **Template library:** Predefined report templates
- **Structured reporting:** Synoptic format
- **Export to PDF:** Printable report with key images

### 12. AI Integration
- **Auto-segmentation:** Pre-label organs/lesions
- **Abnormality detection:** Highlight suspicious regions
- **Prior studies match:** Find similar cases
- **Measurement automation:** Auto-detect landmarks

### 13. Advanced Navigation
- **Scroll wheel sensitivity:** Adjustable speed
- **Kinetic scrolling:** Inertia after flick
- **Touch gestures:** Pinch zoom, swipe navigate
- **Gamepad support:** Foot pedal for hands-free scrolling

### 14. Quality Assurance
- **Image quality flags:** Mark motion blur, artifacts
- **Protocol compliance:** Check if all series acquired
- **Dose tracking:** Record radiation dose (CT only)
- **Audit trail:** Track who viewed/annotated

---

## 📊 Feature Comparison Table

| Feature | OsiriX | Horos | RadiAnt | This App |
|---------|--------|-------|---------|----------|
| Multi-panel | ✅ | ✅ | ✅ | ✅ |
| Cine play | ✅ | ✅ | ✅ | ✅ |
| Scroll sync | ✅ | ✅ | ✅ | ✅ |
| Measurements | ✅ | ✅ | ✅ | ❌ |
| Window presets | ✅ | ✅ | ✅ | ❌ |
| MPR | ✅ | ✅ | ✅ | ❌ |
| 3D rendering | ✅ | ✅ | ❌ | ❌ |
| Annotation | ❌ | ❌ | ❌ | 🚧 |
| AI chatbot | ❌ | ❌ | ❌ | 🚧 |
| ML export | ❌ | ❌ | ❌ | 🚧 |

---

## 🎯 Recommended Implementation Order

1. **Measurement tools** (distance, angle, area) - Essential for clinical use
2. **Window/Level presets** - Quick win, high value
3. **Thumbnail strip** - Improves navigation significantly
4. **Annotation tools** (bbox, polygon) - Core for ML use case
5. **Export formats** (COCO, YOLO, PNG masks) - Required for ML workflow
6. **Hanging protocols** - Power user feature
7. **AI chatbot integration** - Differentiator

---

## 📐 Measurement Tool Specifications

### Distance Measurement
```javascript
{
  type: 'distance',
  points: [{x: 100, y: 150}, {x: 200, y: 180}],
  lengthMm: 45.2,  // Calculated from pixel spacing
  displayFormat: '{value} mm'
}
```

### Angle Measurement
```javascript
{
  type: 'angle',
  points: [
    {x: 100, y: 100},  // Vertex
    {x: 150, y: 50},   // Arm 1
    {x: 200, y: 150}   // Arm 2
  ],
  angleDeg: 67.5,
  displayFormat: '{value}°'
}
```

### Area Measurement (Ellipse ROI)
```javascript
{
  type: 'ellipse',
  center: {x: 200, y: 200},
  radii: {rx: 30, ry: 25},
  areaMm2: 235.6,
  meanHu: 45.2,  // If DICOM
  stdDevHu: 12.3
}
```

---

## 🖼️ Thumbnail Strip Design

```
┌─────────────────────────────────────────────────────────┐
│                    Main Viewport                        │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ [][ ][ ][ ][■][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ] │
│  1  5  10 15 20 25 30 35 40 45 50 55 60 65 70 75 80 85│
└─────────────────────────────────────────────────────────┘
```

- Each thumbnail: 40x40px
- Current slice: Highlighted border
- Hover: Preview overlay
- Scroll: Mouse wheel or drag

---

## Notes

- Many advanced features (MPR, HU values, 3D) require DICOM metadata
- Current JPEG export from scraper loses:
  - Pixel spacing (for measurements)
  - Window/Level values
  - Orientation metadata
  - Patient/study hierarchy
- Consider adding DICOM export option to scraper
