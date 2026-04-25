# Feature Inventory & Test Plan
**Date:** 2026-04-25
**Application:** Radiopaedia Viewer (Electron + React)

---

## Feature Categories

### A. Application Shell & Navigation
### B. Case Management
### C. Image Viewing & Navigation
### D. Multi-Panel System
### E. Annotation Tools
### F. Image Adjustment Tools
### G. Keyboard Shortcuts
### H. Developer Tools

---

## Feature Inventory with Test Status

Legend: ✅ Working | ❌ Broken | ⚠️ Partial | 🔄 Testing | ⏳ Not Tested

---

### A. Application Shell & Navigation

| ID | Feature | Status | Test Steps | Expected Result |
|----|---------|--------|------------|-----------------|
| A1 | Electron window launches | ⏳ | Run `start.bat` or `start-electron.bat` | Window opens at 1400x900 |
| A2 | Server status indicator | ⏳ | Check top-right corner | Shows "Server Connected" (green) |
| A3 | Header bar displays | ⏳ | Look at top of window | Shows app title, refresh button |
| A4 | Debug info panel (D key) | ⏳ | Press 'D' | Panel shows case/protocol info |
| A5 | Console log viewer (L key) | ⏳ | Press 'L' | Panel shows console logs |

---

### B. Case Management

| ID | Feature | Status | Test Steps | Expected Result |
|----|---------|--------|------------|-----------------|
| B1 | Case list displays | ⏳ | Check left sidebar | Shows all cases from output/ |
| B2 | Case search | ⏳ | Type in search box | Filters case list |
| B3 | Case selection | ⏳ | Click a case card | Case highlighted, modalities appear |
| B4 | Modality tabs | ⏳ | Click modality tab | Tab becomes active |
| B5 | Protocol pills | ⏳ | Click protocol pill | Pill becomes active |
| B6 | Ctrl+Click new panel | ⏳ | Ctrl+Click protocol | Opens in new panel |
| B7 | Open folder dialog | ⏳ | Click "+" button | File dialog opens |

---

### C. Image Viewing & Navigation

| ID | Feature | Status | Test Steps | Expected Result |
|----|---------|--------|------------|-----------------|
| C1 | Images display | ⏳ | Select protocol | Images appear in viewport |
| C2 | Scrollbar navigation | ⏳ | Drag scrollbar | Image index changes smoothly |
| C3 | Arrow key navigation | ⏳ | Press ↑/↓ or ←/→ | Previous/next image |
| C4 | Cine play (button) | ⏳ | Click ▶ button | Images auto-advance |
| C5 | Cine play (Space) | ⏳ | Press Space | Toggles play/pause |
| C6 | Speed slider (1-60 fps) | ⏳ | Drag speed slider | fps value changes, cine speed updates |
| C7 | Speed +/- keys | ⏳ | Press +/- | Speed increases/decreases |
| C8 | Zoom (mouse wheel) | ⏳ | Scroll wheel in zoom mode | Image zooms in/out |
| C9 | Pan (drag) | ⏳ | Drag image in pan mode | Image moves |
| C10 | Fit to window (F) | ⏳ | Press F | Image fits viewport |
| C11 | Zoom/Pan persists | ⏳ | Zoom/pan, then scroll | Zoom/pan preserved across slices |
| C12 | Brightness slider | ⏳ | Adjust brightness | Image gets lighter/darker |
| C13 | Contrast slider | ⏳ | Adjust contrast | Contrast changes |

---

### D. Multi-Panel System

| ID | Feature | Status | Test Steps | Expected Result |
|----|---------|--------|------------|-----------------|
| D1 | Panel close button | ⏳ | Click × on panel | Panel closes |
| D2 | Sync toggle | ⏳ | Click 🔗 button | Sync enabled/disabled |
| D3 | Scroll sync | ⏳ | Enable sync on 2 panels, scroll one | Both panels scroll together |
| D4 | Panel focus | ⏳ | Click different panels | Active panel highlighted |
| D5 | Layout changes | ⏳ | Open 2, 3, 4 panels | Layout adjusts (split, 1+2, 2x2) |

---

### E. Annotation Tools

| ID | Feature | Status | Test Steps | Expected Result |
|----|---------|--------|------------|-----------------|
| E1 | Annotation tool selector | ⏳ | Click 📝 button | Tool options appear |
| E2 | Bounding box (1 key) | ⏳ | Select bbox, drag on image | Rectangle drawn |
| E3 | Polygon (2 key) | ⏳ | Select polygon, click points, double-click | Polygon closes |
| E4 | Keypoint (3 key) | ⏳ | Select keypoint, click | Point marker appears |
| E5 | Brush (4 key) | ⏳ | Select brush, drag | Freehand stroke drawn |
| E6 | Label selection | ⏳ | Click label in hierarchy | Label assigned to annotation |
| E7 | Annotation color | ⏳ | Draw with different labels | Different colors per label |
| E8 | Annotation panel toggle | ⏳ | Click "Show Panel" | Annotation panel appears/disappears |

---

### F. Image Adjustment Tools

| ID | Feature | Status | Test Steps | Expected Result |
|----|---------|--------|------------|-----------------|
| F1 | Brightness/Contrast toggle | ⏳ | Click ☀ button | Sliders appear |
| F2 | Brightness adjustment | ⏳ | Move brightness slider | Image brightness changes |
| F3 | Contrast adjustment | ⏳ | Move contrast slider | Image contrast changes |
| F4 | Brightness reset | ⏳ | Set to 100% | Returns to normal |

---

### G. Keyboard Shortcuts

| ID | Feature | Status | Test Steps | Expected Result |
|----|---------|--------|------------|-----------------|
| G1 | H - Pan tool | ⏳ | Press H | Pan tool activates |
| G2 | Z - Zoom tool | ⏳ | Press Z | Zoom tool activates |
| G3 | F - Fit | ⏳ | Press F | Image fits viewport |
| G4 | Space - Cine toggle | ⏳ | Press Space | Cine play toggles |
| G5 | +/- - Speed | ⏳ | Press +/- | Cine speed changes |
| G6 | 1-4 - Annotation tools | ⏳ | Press 1,2,3,4 | Annotation tools select |
| G7 | Arrow keys - Navigate | ⏳ | Press arrow keys | Image navigation |

---

### H. Developer Tools

| ID | Feature | Status | Test Steps | Expected Result |
|----|---------|--------|------------|-----------------|
| H1 | Debug panel (D key) | ⏳ | Press D | Debug info shows |
| H2 | Console viewer (L key) | ⏳ | Press L | Console logs show |
| H3 | Console clear button | ⏳ | Click "Clear" | Logs clear |

---

## Test Execution Log

### Run 1: [Date/Time]

| Category | Pass | Fail | Notes |
|----------|------|------|-------|
| A. Shell | /5 | /5 | |
| B. Cases | /7 | /7 | |
| C. Viewing | /13 | /13 | |
| D. Panels | /5 | /5 | |
| E. Annotations | /8 | /8 | |
| F. Adjustments | /4 | /4 | |
| G. Shortcuts | /7 | /7 | |
| H. Dev Tools | /3 | /3 | |

**Total:** /52

---

## Known Issues to Investigate

1. (Add issues found during testing)

---

## Test Commands

```bash
# Launch Electron app
npm run electron:dev

# Or standalone mode
npm run standalone
```

---

## Notes

- Test in Electron mode (not browser standalone) for full functionality
- Ensure `output/` folder contains at least one scraped case
- Cine play at 60 fps may be limited by display refresh rate
- Annotation tools require label selection before drawing
