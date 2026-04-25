const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Case management
  scanCases: () => ipcRenderer.invoke('scan-cases'),
  openFolder: () => ipcRenderer.invoke('open-folder'),
  getCaseData: (caseFolder) => ipcRenderer.invoke('get-case-data', { caseFolder }),

  // Scraping
  startScrape: (url) => ipcRenderer.invoke('start-scrape', { url }),
  onScraperOutput: (callback) => {
    ipcRenderer.on('scraper-output', (event, output) => callback(output));
  },
  onScraperError: (callback) => {
    ipcRenderer.on('scraper-error', (event, error) => callback(error));
  },

  // Image server URL
  getImageServerUrl: () => 'http://127.0.0.1:3456/output',
});
