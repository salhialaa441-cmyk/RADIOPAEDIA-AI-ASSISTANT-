# Standalone Mode - One-Click Debugging

## Overview

The Radiopaedia Viewer can now run in **standalone browser mode** without Electron. This enables faster debugging and development with a single command.

## Quick Start

### Option 1: Using npm script (Recommended)

```bash
npm run standalone
```

Then open: **http://localhost:3456**

### Option 2: Direct node command

```bash
node standalone-server.js
```

Then open: **http://localhost:3456**

## What It Provides

The standalone server runs on port 3456 and provides:

| Endpoint | Description |
|----------|-------------|
| `/` | React application (built Vite app) |
| `/api/health` | Health check endpoint |
| `/api/cases` | List all scraped cases |
| `/api/cases/:caseFolder` | Get specific case with modalities and protocols |
| `/api/scrape` | Start scraping a Radiopaedia URL |
| `/output/*` | Serve downloaded images |

## How It Works

### Environment Detection

The React app automatically detects whether it's running in Electron or browser mode:

```javascript
// src/utils/api.js
const IS_ELECTRON = window.electronAPI !== undefined;

export const api = IS_ELECTRON ? electronAPI : standaloneAPI;
```

### Standalone API Implementation

In browser mode, API calls fetch from the local Express server:

```javascript
// Standalone mode API
const standaloneAPI = {
  scanCases: async () => {
    const response = await fetch('http://localhost:3456/api/cases');
    return await response.json();
  },
  
  getCaseData: async (caseFolder) => {
    const response = await fetch(`http://localhost:3456/api/cases/${caseFolder}`);
    return await response.json();
  },
  
  startScrape: async (url) => {
    const response = await fetch('http://localhost:3456/api/scrape', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
    return await response.json();
  },
  
  getImageServerUrl: () => 'http://localhost:3456/output',
};
```

## Server Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  standalone-server.js                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Express Server (Port 3456)                       │   │
│  │                                                   │   │
│  │  API Routes:                                      │   │
│  │  - GET  /api/health                               │   │
│  │  - GET  /api/cases                                │   │
│  │  - GET  /api/cases/:caseFolder                    │   │
│  │  - POST /api/scrape                               │   │
│  │                                                   │   │
│  │  Static Files:                                    │   │
│  │  - / (dist/)         → React app                  │   │
│  │  - /output/*         → Downloaded images          │   │
│  └──────────────────────────────────────────────────┘   │
│                           │                              │
│  Child Process:           │                              │
│  - scraper.js             │                              │
└───────────────────────────┼──────────────────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │  output/        │
                   │  └── case1/     │
                   │       └── CT/   │
                   │           └── protocol/
                   │               └── series_*/
                   │                   └── images/*.jpg
                   └─────────────────┘
```

## Protocol Folder Structure

The server handles the nested folder structure:

```
output/
└── 231663_Radiology_Case_Radiopaediaorg/
    └── CT/
        ├── Axial_Carterial_phase/
        │   └── series_736757/
        │       ├── metadata.json
        │       └── images/
        │           ├── 0.jpg
        │           ├── 1.jpg
        │           └── ...
        ├── Axial_Cdelayed/
        │   └── series_736749/
        └── ...
```

## Features Available in Standalone Mode

| Feature | Status |
|---------|--------|
| Case browser | ✓ Working |
| Modality tabs | ✓ Working |
| Protocol pills | ✓ Working |
| Image viewer | ✓ Working |
| Multi-panel grid | ✓ Working |
| Scroll sync | ✓ Working |
| Zoom/pan | ✓ Working |
| Brightness/contrast | ✓ Working |
| Measurement tool | ✓ Working |
| Cine play | ✓ Working |
| Scraping UI | ✓ Working |
| Annotation tools | ✓ Working |

## Differences from Electron Mode

| Feature | Electron | Standalone |
|---------|----------|------------|
| Window management | Native OS windows | Browser tabs |
| Pop-out panels | ✓ Yes | ✗ No |
| File dialog (open folder) | ✓ Yes | ✗ No |
| System tray | ✓ Yes | ✗ No |
| Keyboard shortcuts | Full | Browser-limited |

## Troubleshooting

### Server won't start

**Error: Port 3456 is already in use**

```bash
# Kill existing node processes
taskkill /F /IM node

# Or use a different port
PORT=3457 node standalone-server.js
```

### Cases not loading

**Check if output folder exists:**

```bash
ls output/
```

**Check server health:**

```bash
curl http://localhost:3456/api/health
```

### Images not displaying

**Verify image server is running:**

```bash
curl -I http://localhost:3456/output/231663_Radiology_Case_Radiopaediaorg/CT/Axial_Carterial_phase/series_736757/images/0.jpg
```

Should return `HTTP/1.1 200 OK`

## Development Workflow

1. **Make changes to React components**
   ```bash
   npm run build  # Rebuild Vite app
   ```

2. **Restart standalone server**
   ```bash
   npm run standalone
   ```

3. **Test in browser**
   - Open http://localhost:3456
   - Use browser DevTools (F12) for debugging

4. **Debug scraper**
   - Paste Radiopaedia URL in Scrape dialog
   - Watch server console for progress
   - Check `output/` folder for downloaded images

## Benefits for Debugging

| Benefit | Description |
|---------|-------------|
| **Fast startup** | One command vs. Electron window + Vite |
| **Browser DevTools** | Full Chrome/Firefox dev tools |
| **Network inspection** | See all API calls in Network tab |
| **Console logging** | Server logs + browser console |
| **Easy refresh** | Ctrl+R to reload app |
| **No Electron overhead** | Pure web stack debugging |

## Files Modified

- `standalone-server.js` - Express server with API endpoints
- `src/utils/api.js` - Environment-aware API abstraction
- `package.json` - Added `standalone` npm script
- `src/App.jsx` - Added server status indicator
- `src/components/Header.jsx` - Server status badge
- `src/App.css` - Server status styles

## Next Steps

With standalone mode working, you can:

1. Debug UI issues in browser DevTools
2. Test new features quickly
3. Verify API endpoints with curl/Postman
4. Develop without Electron complexity
5. Switch to Electron mode when ready for native features

---

**Status:** ✓ Standalone mode fully operational
**Last verified:** 2026-04-25
**Server:** http://localhost:3456
