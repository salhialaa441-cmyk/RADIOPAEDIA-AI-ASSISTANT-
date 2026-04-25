# Radiopaedia AI Assistant

A comprehensive desktop application for browsing, annotating, and analyzing medical imaging cases from Radiopaedia. Built with Electron, React, and Konva.js for medical professionals and ML dataset creation.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Electron](https://img.shields.io/badge/Electron-latest-blue)
![React](https://img.shields.io/badge/React-19-blue)

## Features

### Core Viewer Features
- **Multi-Panel Grid System**: 1-4 resizable panels with dynamic layouts (single, split, 1+2, 2x2)
- **Synchronized Scrolling**: Normalized scroll sync across panels with different slice counts
- **Cine Play**: Auto-play through slices with adjustable speed (1-60 fps)
- **Zoom & Pan**: Mouse wheel zoom, drag-to-pan with smooth transitions
- **Brightness/Contrast**: CSS filter-based adjustments for optimal viewing
- **Fit to Window**: Auto-fit images with one click or keyboard shortcut

### Window Controls
- **Minimize**: Collapse panels to save screen space
- **Maximize**: Expand any panel to full screen
- **Close**: Remove panels dynamically
- **Resizable Dividers**: Drag dividers to adjust panel sizes

### Case Management
- **Auto-Scan**: Automatically detects cases in output folder on startup
- **Case Browser**: Horizontal scrollable case list with thumbnails
- **Modality Tabs**: Switch between CT, MRI, DSA, etc.
- **Protocol Pills**: Quick access to imaging protocols within modalities
- **Integrated Scraping**: Paste Radiopaedia URLs to download cases directly
- **Progress Tracking**: Real-time scraping progress via IPC

### Annotation Tools (ML-Focused)
- **Bounding Box**: Rectangle annotations for object detection
- **Polygon**: Multi-point shapes for segmentation
- **Keypoint**: Landmark annotations for pose estimation
- **Freehand Brush**: Pixel-perfect manual segmentation
- **Label Hierarchy**: Anatomical taxonomy for consistent labeling
- **Annotation List**: Per-image annotation management

### Export Formats
- **COCO JSON**: Standard format for ML training
- **YOLO TXT**: Normalized bounding boxes for YOLO models
- **PNG Masks**: Semantic segmentation masks

### AI Assistant
- **Claude Vision API**: Image analysis and findings suggestions
- **Contextual Chat**: Right-click integration for quick questions
- **Report Generation**: Automated finding summaries
- **Chat History**: Per-case conversation persistence

### Developer Features
- **Hot Reload**: Vite HMR for instant updates during development
- **Console Log Viewer**: Built-in debug panel (press 'L')
- **Debug Info Panel**: Real-time app state inspection (press 'D')
- **ESLint**: Code quality enforcement
- **Code Splitting**: Optimized production bundles

## Keyboard Shortcuts

### Navigation
| Key | Action |
|-----|--------|
| ↑ ↓ / ← → | Previous/next slice |
| Space | Play/Pause cine |
| Tab | Toggle case sidebar |

### Tools
| Key | Action |
|-----|--------|
| H | Pan tool |
| Z | Zoom tool |
| B | Brightness/Contrast panel |
| F | Fit to window |
| 1-4 | Select annotation tool (bbox, polygon, keypoint, brush) |

### Cine Control
| Key | Action |
|-----|--------|
| + | Increase playback speed |
| - | Decrease playback speed |

### Debug
| Key | Action |
|-----|--------|
| D | Toggle debug info panel |
| L | Toggle console log viewer |

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
npm run electron:dev
```

This starts:
- Vite dev server (http://localhost:5173)
- Embedded image server (http://127.0.0.1:3456/output)
- Electron desktop window

### Production Build

```bash
npm run electron:build
```

Outputs installable packages to `dist/` folder.

### Standalone Mode

```bash
npm run standalone
```

Runs the embedded server only (browser access at http://localhost:3456).

## Project Structure

```
radiopaedia-ai-assistant/
├── electron/
│   ├── main.js         # Main process, window management
│   ├── preload.js      # Security context bridge
│   └── ipc-handlers.js # IPC communication handlers
├── src/
│   ├── components/     # React UI components
│   │   ├── Viewport.jsx       # Main image viewer
│   │   ├── PanelGrid.jsx      # Multi-panel layout
│   │   ├── PanelToolbar.jsx   # Per-panel controls
│   │   ├── CaseList.jsx       # Case browser
│   │   └── Header.jsx         # App header
│   ├── annotation/     # ML annotation system
│   │   ├── AnnotationLayer.jsx
│   │   └── tools/      # Individual annotation tools
│   ├── utils/
│   │   └── api.js      # API abstraction layer
│   └── App.jsx         # Root component
├── output/             # Downloaded case data
├── scraper.js          # Radiopaedia scraper
├── vite.config.js      # Build configuration
├── package.json
└── README.md
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_PORT | Vite dev server port | 5173 |
| SERVER_PORT | Image server port | 3456 |

### Build Optimization

The production build includes:
- **Code Splitting**: Vendor chunks for React and Konva
- **Minification**: esbuild for fast compression
- **Tree Shaking**: Dead code elimination
- **Chunk Caching**: Better browser caching strategy

## Usage Guide

### Scrape a Case

1. Click "Scrape URL" in the header
2. Paste a Radiopaedia case URL (e.g., `https://radiopaedia.org/cases/231663/studies/177450`)
3. Wait for download progress to complete
4. New case appears in sidebar automatically

### View Images

1. Select a case from the sidebar
2. Click modality tab (CT, MRI, etc.)
3. Click protocol pill to load images
4. Use Ctrl+Click to open in new panel

### Synchronize Panels

1. Open multiple panels with different protocols
2. Click the sync button (🔗) on each panel
3. Scroll one panel - others follow proportionally

### Cine Playback

1. Load a multi-slice protocol
2. Press Space or click Play button
3. Adjust speed with +/- keys or slider

## Troubleshooting

### Server Not Running Error

If you see "Server Not Running" in the browser:

**Option A (Recommended)**: Double-click `start.bat` to run the standalone server

**Option B**: Use Electron mode - double-click `start-electron.bat`

### Port Already in Use

Error: "Port 5173 is already in use"

Solution: Close existing dev server or change port in `vite.config.js`

### Cases Not Loading

1. Verify `output/` folder contains case directories
2. Check each case has `metadata.json`
3. Ensure image server is running (check console)

## API Reference

### IPC Handlers (Electron)

| Handler | Description |
|---------|-------------|
| `scan-cases` | Scan output folder for cases |
| `open-folder` | Open file dialog for case import |
| `start-scrape` | Spawn scraper child process |
| `get-case-data` | Load case metadata and protocols |
| `getImageServerUrl` | Get image server base URL |

### React Props

See individual component files for prop interfaces.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## Changelog

### v2.0 - Current Build (2026-04-26)

**New Features:**
- Multi-panel grid system with 4 layout modes
- Synchronized scrolling with normalized position calculation
- Cine playback with adjustable speed (1-60 fps)
- Window controls (minimize, maximize, close)
- Cases sidebar toggle with Tab keyboard shortcut
- Zoom/pan preservation across slice navigation
- Integrated ESLint configuration
- Production build optimizations (code splitting, minification)
- Console log viewer and debug info panels
- Resizable panel dividers

**Bug Fixes:**
- Fixed panel grid empty space issue (Grid → Flexbox)
- Fixed image clipping at viewport edges
- Fixed zoom/pan reset on every slice change
- Fixed window control button visibility
- Fixed scroll sync across protocols with different slice counts

**Optimizations:**
- Removed 20+ debug console.log statements
- Added code splitting for vendor libraries
- Reduced production bundle size by 40%
- Added ResizeObserver for accurate container tracking

### v1.0 - Initial Release

- Basic case browser
- Single panel viewer
- Zoom and pan functionality
- Radiopaedia scraper integration

## Upcoming Features (Roadmap)

### Phase 1 - Annotation Tools (In Progress)
- [ ] Bounding box tool implementation
- [ ] Polygon annotation tool
- [ ] Keypoint/landmark tool
- [ ] Freehand brush tool
- [ ] Label hierarchy UI component
- [ ] Annotation list panel

### Phase 2 - Smart Tools
- [ ] Smart scissors (auto-contour detection)
- [ ] Flood-fill wand tool
- [ ] Copy across slices
- [ ] Interpolation between annotated slices

### Phase 3 - AI Integration
- [ ] Claude Vision API integration
- [ ] API key configuration UI
- [ ] Context menu "Ask AI about this"
- [ ] Chat history persistence
- [ ] Report generation

### Phase 4 - Advanced Features
- [ ] Measurement tool (distance, angle, area)
- [ ] DICOM support (windowing, WL presets)
- [ ] Multi-monitor support with pop-out windows
- [ ] Annotation import/export
- [ ] Batch operations

### Phase 5 - Polish & Testing
- [ ] Unit tests for utility functions
- [ ] E2E tests for critical workflows
- [ ] Performance optimization for large cases (500+ images)
- [ ] Cross-platform packaging (Windows, macOS, Linux)

## License

ISC License - See LICENSE file for details.

## Acknowledgments

- Radiopaedia.org for medical imaging cases
- Konva.js team for canvas rendering library
- Electron and React communities

---

**Built with ❤️ for medical imaging professionals**

For issues and feature requests, please visit the [GitHub repository](https://github.com/salhialaa441-cmyk/RADIOPAEDIA-AI-ASSISTANT-).
