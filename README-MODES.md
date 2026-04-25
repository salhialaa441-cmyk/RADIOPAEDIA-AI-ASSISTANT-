# Radiopaedia Viewer - Running Modes

## Quick Start (Choose One)

### Option 1: Standalone Mode (Recommended for Debugging)
**Double-click:** `start.bat`

- Opens in your web browser
- Server runs at http://localhost:3456
- Best for: Quick testing, debugging with browser DevTools, annotation work

### Option 2: Electron Desktop App
**Double-click:** `start-electron.bat`

- Opens in a native desktop window
- Full Electron features (pop-out panels, file dialogs)
- Best for: Testing native features, multi-monitor workflows

---

## Understanding the Error: "window.electronAPI is undefined"

This error appears when:

1. You open `http://localhost:5173` directly in a **regular browser** (Chrome/Edge)
2. The Electron preload script is not loaded (because it's not running in Electron)
3. The standalone server on port 3456 is not running

### Solution

**If you want to use a browser:**
1. Close the current browser tab
2. Double-click `start.bat`
3. The app will open automatically at http://localhost:3456

**If you want the desktop app:**
1. Close the current browser tab
2. Double-click `start-electron.bat`
3. The Electron window will open

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Two Execution Modes                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐           ┌─────────────────────┐     │
│  │   STANDALONE MODE   │           │   ELECTRON MODE     │     │
│  │   (start.bat)       │           │   (start-electron)  │     │
│  │                     │           │                     │     │
│  │  Browser: Chrome/   │           │  Native Window:     │     │
│  │  Edge/Firefox       │           │  Electron           │     │
│  │                     │           │                     │     │
│  │  Server: Express    │           │  Server: Express    │     │
│  │  on port 3456       │           │  on port 3456       │     │
│  │                     │           │                     │     │
│  │  Vite: Not needed   │           │  Vite: HMR on 5173  │     │
│  │  (uses built dist/) │           │  (dev mode)         │     │
│  │                     │           │                     │     │
│  │  API: HTTP fetch    │           │  API: IPC +         │     │
│  │  to localhost:3456  │           │  contextBridge      │     │
│  │                     │           │                     │     │
│  │  Best for:          │           │  Best for:          │     │
│  │  - Browser DevTools │           │  - Pop-out panels   │     │
│  │  - Fast debugging   │           │  - File dialogs     │     │
│  │  - Annotation work  │           │  - Multi-monitor    │     │
│  └─────────────────────┘           └─────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Reference

| File | Purpose |
|------|---------|
| `start.bat` | One-click standalone mode |
| `start-electron.bat` | One-click Electron mode |
| `standalone-server.js` | Express server for standalone mode |
| `electron/main.js` | Electron main process |
| `electron/preload.js` | Exposes electronAPI to renderer |
| `src/utils/api.js` | API abstraction (auto-detects mode) |

---

## How Mode Detection Works

The app automatically detects which mode it's running in:

```javascript
// src/utils/api.js
const IS_ELECTRON = window.electronAPI !== undefined;

export const api = IS_ELECTRON ? electronAPI : standaloneAPI;
```

**In Electron:**
- `window.electronAPI` is defined by the preload script
- API calls use IPC to communicate with main process

**In Browser (Standalone):**
- `window.electronAPI` is undefined
- API calls fetch from `http://localhost:3456/api/*`

---

## Troubleshooting

### "Failed to load cases: can't access property 'scanCases', window.electronAPI is undefined"

**Cause:** Running in browser without standalone server

**Fix:**
1. Close the current browser tab
2. Double-click `start.bat`
3. Wait for server to start

### "Server not running" message in standalone mode

**Cause:** The Express server on port 3456 is not running

**Fix:**
1. Run `npm run standalone` or double-click `start.bat`
2. Check that port 3456 is not blocked by firewall
3. Verify Node.js is installed: `node --version`

### Electron window is blank or shows "Loading..."

**Cause:** Vite dev server not running or crashed

**Fix:**
1. Close Electron window
2. Run `npm run electron:dev` manually to see error output
3. Check that port 5173 is available

### Port already in use error

**Cause:** Previous server instance still running

**Fix (Windows):**
```cmd
# Kill all node processes
taskkill /F /IM node

# Or kill specific port
for /f "tokens=5" %a in ('netstat -aon ^| findstr ":3456" ^| findstr "LISTENING"') do taskkill /F /PID %a
```

---

## Development Workflow

### For UI/React Development

```bash
# Use standalone mode for fast iteration
npm run standalone

# Make changes to React components
# Rebuild:
npm run build

# Refresh browser (Ctrl+R)
```

### For Electron-Specific Features

```bash
# Use Electron mode for native features
npm run electron:dev

# Features only available in Electron:
# - Pop-out panels
# - File system dialogs
# - System tray
# - Native window management
```

### For Debugging

**Browser DevTools (Standalone Mode):**
1. Open http://localhost:3456
2. Press F12 or Ctrl+Shift+I
3. Full Chrome DevTools available
4. Network tab shows all API calls
5. Console shows server + client logs

**Electron DevTools:**
1. Run `npm run electron:dev`
2. DevTools open automatically
3. Limited to Electron window context

---

## Summary

| Need | Use Mode | Command |
|------|----------|---------|
| Quick testing | Standalone | `start.bat` |
| Browser DevTools | Standalone | `start.bat` |
| Annotation work | Standalone | `start.bat` |
| Pop-out panels | Electron | `start-electron.bat` |
| File dialogs | Electron | `start-electron.bat` |
| Multi-monitor | Electron | `start-electron.bat` |
| Production build | Either | `npm run build` then `start.bat` |

---

**Last updated:** 2026-04-25
**Status:** Both modes fully operational
