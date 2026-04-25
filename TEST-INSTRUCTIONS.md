# Test Instructions - Radiopaedia Viewer

## What Was Fixed

1. **Image URL Generation Bug**: The `generateImageUrls` function in `PanelGrid.jsx` was generating incorrect URLs. It was missing the protocol folder name (e.g., `Axial_Carterial_phase`).

2. **Protocol Click Handler**: Added onClick handlers to protocol pills so they actually load images when clicked.

3. **Debug Info Panel**: Added a debug overlay (press 'D' to toggle) that shows:
   - Server connection status
   - Number of cases loaded
   - Selected case information
   - Modality and protocol counts
   - Protocol details with image counts

## How to Test

### Step 1: Start the Server

**Option A - Standalone Mode (Recommended):**
```bash
# Double-click this file:
start.bat

# Or run manually:
npm run standalone
```

The app will open automatically at http://localhost:3456

### Step 2: Verify Cases Load

1. You should see 2 cases in the left sidebar:
   - Castleman disease unicentric (FDG PET-CT)
   - Erdheim-Chester disease - orbital, dural, and retroperitoneal

2. Click on "Erdheim-Chester disease" case

### Step 3: Verify Modalities and Protocols

1. You should see modality tabs at the top (CT, MRI, etc.)
2. Below the modality tabs, you should see protocol pills:
   - Axial C+arterial phase
   - Axial C+delayed
   - Axial non-contrast
   - Axial renalcortical phase

### Step 4: Verify Images Load

1. Click on any protocol pill (e.g., "Axial C+arterial phase")
2. Images should appear in the viewer
3. Each protocol has ~409 images

### Step 5: Use Debug Panel

1. Press **'D'** on your keyboard
2. A debug info panel will appear in the bottom-right
3. It shows:
   - Server status (should be "connected")
   - Cases loaded count (should be 2)
   - Selected case name
   - Selected modality and protocol count
   - List of protocols with image counts

4. Press **'D'** again to close the debug panel

### Step 6: Test Navigation

1. Use **Arrow Up/Down** keys to scroll through images
2. Click on different protocol pills to switch protocols
3. Click on different modality tabs to switch modalities

## What to Report

Please provide feedback on:

1. **Do cases appear in the left sidebar?** Yes/No
2. **Do modalities appear when you click a case?** Yes/No
3. **Do protocols appear when you select a modality?** Yes/No
4. **Do images load when you click a protocol?** Yes/No
5. **Debug panel info**: Press 'D' and share what you see

### Screenshot Request

If possible, share screenshots of:
1. The main app showing cases
2. The viewer with images loaded
3. The debug panel (press 'D')

## Known Issues

- The first protocol should auto-load when you select a case
- If images don't load, check the browser console (F12) for errors
- If server is disconnected, run `start.bat` again

## Server Status

- **Standalone server**: Should be running at http://localhost:3456
- **Health check**: http://localhost:3456/api/health should return `{"status":"ok"}`

---

**Build Date:** 2026-04-25
**Version:** Post-fix v1.0.1
