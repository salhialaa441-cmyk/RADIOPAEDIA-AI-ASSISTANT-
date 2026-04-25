/**
 * API Abstraction Layer
 * Works in both Electron and standalone browser mode
 */

const IS_ELECTRON = window.electronAPI !== undefined;

// Electron API wrapper
const electronAPI = {
  scanCases: () => window.electronAPI.scanCases(),
  openFolder: () => window.electronAPI.openFolder(),
  getCaseData: (caseFolder) => window.electronAPI.getCaseData(caseFolder),
  startScrape: (url) => window.electronAPI.startScrape(url),
  getImageServerUrl: () => window.electronAPI.getImageServerUrl(),
  onScraperOutput: (callback) => window.electronAPI.onScraperOutput(callback),
  onScraperError: (callback) => window.electronAPI.onScraperError(callback),
};

// Standalone browser mode API (mock/fallback)
const standaloneAPI = {
  scanCases: async () => {
    try {
      const response = await fetch('http://localhost:3456/api/cases');
      if (!response.ok) throw new Error('Server not running');
      return await response.json();
    } catch (error) {
      console.warn('[Standalone] Could not fetch cases. Is the local server running?');
      // Throw a more helpful error
      throw new Error(
        'Could not connect to standalone server.\n\n' +
        'To fix this, either:\n' +
        '1. Run "npm run standalone" (or double-click start.bat) and then refresh this page\n' +
        '2. Or run "npm run electron:dev" (or double-click start-electron.bat) to use the desktop app\n\n' +
        'Original error: ' + error.message
      );
    }
  },

  openFolder: async () => {
    alert('Open folder is only available in Electron mode');
    return null;
  },

  getCaseData: async (caseFolder) => {
    try {
      const response = await fetch(`http://localhost:3456/api/cases/${encodeURIComponent(caseFolder)}`);
      if (!response.ok) throw new Error('Case not found');
      return await response.json();
    } catch (error) {
      console.error('[Standalone] Error loading case:', error);
      throw new Error(
        'Could not load case data. Is the standalone server running?\n\n' +
        'Run: npm run standalone\n' +
        'Original error: ' + error.message
      );
    }
  },

  startScrape: async (url) => {
    // In standalone mode, scrape runs on the local server
    try {
      const response = await fetch('http://localhost:3456/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Scraping failed');
      }

      return { success: true };
    } catch (error) {
      console.error('[Standalone] Scrape error:', error);
      throw new Error(
        'Could not start scraping. Is the standalone server running?\n\n' +
        'Run: npm run standalone\n' +
        'Original error: ' + error.message
      );
    }
  },

  getImageServerUrl: () => 'http://localhost:3456/output',

  onScraperOutput: (callback) => {
    // In standalone mode, listen for server-sent events or polling
    // For now, just a placeholder - real implementation would use WebSocket or SSE
  },

  onScraperError: (callback) => {
    // Placeholder for error handling
  },
};

// Export the appropriate API based on environment
export const api = IS_ELECTRON ? electronAPI : standaloneAPI;
export const isElectron = IS_ELECTRON;

// Helper to check if server is running
export async function checkServerStatus() {
  // In Electron mode, the image server serves static files (no /api/health endpoint)
  // Check if the image server is responding by fetching a known image path
  // Server returns 404 for directory listings, so we check for any response (even 404 means server is up)
  try {
    const response = await fetch('http://localhost:3456/output/', {
      method: 'HEAD',
      signal: AbortSignal.timeout(2000),
    });
    // Any response (200, 403, 404) means the server is running
    // Only network errors or timeouts should return false
    return true;
  } catch {
    return false;
  }
}
