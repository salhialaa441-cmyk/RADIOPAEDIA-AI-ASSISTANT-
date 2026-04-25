/**
 * Test: Electron app starts correctly and image server is accessible
 */

const { _electron: electron } = require('electron');
const http = require('http');
const path = require('path');

describe('Electron App Startup', () => {
  let app;
  let mainWindow;

  beforeAll(async () => {
    // Launch Electron app
    app = await electron.launch({
      args: ['.'],
      env: { NODE_ENV: 'development' },
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  test('Electron window opens', async () => {
    mainWindow = await app.firstWindow();
    const title = await mainWindow.title();
    expect(title).toBe('Radiopaedia Viewer');
  }, 10000);

  test('Image server is running on port 3456', (done) => {
    http.get('http://127.0.0.1:3456/output/', (res) => {
      // Server should respond (200, 403, or 404 are all OK - means server is up)
      expect([200, 403, 404]).toContain(res.statusCode);
      done();
    }).on('error', (err) => {
      done(err);
    });
  }, 5000);

  test('Cases endpoint returns data via IPC', async () => {
    // Access Electron's IPC via the main window
    const cases = await mainWindow.evaluate(() => {
      return window.electronAPI?.scanCases();
    });
    expect(Array.isArray(cases)).toBe(true);
  }, 5000);
});
