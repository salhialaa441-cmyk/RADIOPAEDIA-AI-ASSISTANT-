const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const express = require('express');
const { spawn } = require('child_process');

let mainWindow;
let imageServer;
const SERVER_PORT = 3456;

// Create the main Electron window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'default',
    show: false,
  });

  // Load the app (dev mode or production)
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    // Detect Vite port from environment variable or find available port
    const vitePort = process.env.VITE_PORT || 5173;
    mainWindow.loadURL(`http://localhost:${vitePort}`);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Start embedded Express server for serving images
function startImageServer() {
  const server = express();
  const outputDir = path.join(__dirname, '../output');

  // Enable CORS for Electron renderer
  server.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });

  // Serve output folder as static files
  server.use('/output', express.static(outputDir));

  imageServer = server.listen(SERVER_PORT, '127.0.0.1', () => {
    // Server started silently
  });
}

// Stop the image server
function stopImageServer() {
  if (imageServer) {
    imageServer.close();
  }
}

// Handle case folder scanning
ipcMain.handle('scan-cases', async () => {
  const fs = require('fs');
  const outputDir = path.join(__dirname, '../output');

  try {
    if (!fs.existsSync(outputDir)) {
      return [];
    }

    const entries = fs.readdirSync(outputDir, { withFileTypes: true });
    const cases = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const metadataPath = path.join(outputDir, entry.name, 'metadata.json');
        if (fs.existsSync(metadataPath)) {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
          cases.push({
            folderName: entry.name,
            ...metadata,
          });
        }
      }
    }

    return cases;
  } catch (error) {
    return [];
  }
});

// Handle opening a folder dialog
ipcMain.handle('open-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select case folder',
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// Handle spawning scraper process
ipcMain.handle('start-scrape', async (event, { url }) => {
  return new Promise((resolve, reject) => {
    const scraperPath = path.join(__dirname, '../scraper.js');
    const scraper = spawn('node', [scraperPath, '--full', url]);

    scraper.stdout.on('data', (data) => {
      const output = data.toString();
      // Parse progress and send to renderer
      mainWindow.webContents.send('scraper-output', output);
    });

    scraper.stderr.on('data', (data) => {
      const error = data.toString();
      mainWindow.webContents.send('scraper-error', error);
    });

    scraper.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, message: 'Scraping completed' });
      } else {
        reject(new Error(`Scraper exited with code ${code}`));
      }
    });

    scraper.on('error', (error) => {
      reject(error);
    });
  });
});

// Handle getting case data
ipcMain.handle('get-case-data', async (event, { caseFolder }) => {
  const fs = require('fs');
  const outputDir = path.join(__dirname, '../output');
  const casePath = path.join(outputDir, caseFolder);

  try {
    const metadataPath = path.join(casePath, 'metadata.json');
    if (!fs.existsSync(metadataPath)) {
      throw new Error('Case metadata not found');
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

    // Scan modalities and protocols
    const modalities = [];
    const modalityEntries = fs.readdirSync(casePath, { withFileTypes: true });

    for (const modalityEntry of modalityEntries) {
      if (modalityEntry.isDirectory() && modalityEntry.name !== 'metadata.json') {
        const modalityPath = path.join(casePath, modalityEntry.name);
        const protocols = [];

        const protocolEntries = fs.readdirSync(modalityPath, { withFileTypes: true });
        for (const protocolEntry of protocolEntries) {
          if (protocolEntry.isDirectory()) {
            const protocolPath = path.join(modalityPath, protocolEntry.name);

            // Look for series folders inside protocol folder
            const seriesEntries = fs.readdirSync(protocolPath, { withFileTypes: true });
            for (const seriesEntry of seriesEntries) {
              if (seriesEntry.isDirectory()) {
                const seriesPath = path.join(protocolPath, seriesEntry.name);
                const seriesMetadataPath = path.join(seriesPath, 'metadata.json');

                if (fs.existsSync(seriesMetadataPath)) {
                  const seriesMetadata = JSON.parse(
                    fs.readFileSync(seriesMetadataPath, 'utf-8')
                  );
                  // Extract just the protocol folder name (e.g., "Axial_T1") for easier use
                  const protocolFolderName = path.basename(protocolPath);
                  protocols.push({
                    folderName: seriesEntry.name,
                    protocolPath: protocolPath, // Full path for reference
                    protocolFolderName: protocolFolderName, // Just the folder name for URL generation
                    ...seriesMetadata,
                  });
                }
              }
            }
          }
        }

        modalities.push({
          name: modalityEntry.name,
          protocols,
        });
      }
    }

    return { metadata, modalities };
  } catch (error) {
    throw error;
  }
});

// App lifecycle
app.whenReady().then(() => {
  startImageServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopImageServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  stopImageServer();
});
