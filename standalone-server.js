/**
 * Standalone Server for Browser-Based Development
 *
 * Run with: node standalone-server.js
 * Then open: http://localhost:3456
 *
 * Provides:
 * - Static file serving (built Vite app or dev mode)
 * - API endpoints for case management
 * - Image serving from output/
 * - Scraper integration
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = 3456;
const OUTPUT_DIR = path.join(__dirname, 'output');

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (Vite dev server proxy or built files)
const VITE_PORT = 5173;

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all cases
app.get('/api/cases', async (req, res) => {
  try {
    if (!fs.existsSync(OUTPUT_DIR)) {
      return res.json([]);
    }

    const entries = fs.readdirSync(OUTPUT_DIR, { withFileTypes: true });
    const cases = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const metadataPath = path.join(OUTPUT_DIR, entry.name, 'metadata.json');
        if (fs.existsSync(metadataPath)) {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
          cases.push({
            folderName: entry.name,
            ...metadata,
          });
        }
      }
    }

    res.json(cases);
  } catch (error) {
    console.error('Error scanning cases:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific case data
app.get('/api/cases/:caseFolder', async (req, res) => {
  try {
    const { caseFolder } = req.params;
    const casePath = path.join(OUTPUT_DIR, caseFolder);

    if (!fs.existsSync(casePath)) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const metadataPath = path.join(casePath, 'metadata.json');
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
            const protocolName = protocolEntry.name;

            const seriesEntries = fs.readdirSync(protocolPath, { withFileTypes: true });
            let foundMetadata = false;

            for (const seriesEntry of seriesEntries) {
              if (foundMetadata) break;

              if (seriesEntry.isDirectory()) {
                const seriesPath = path.join(protocolPath, seriesEntry.name);
                const seriesMetadataPath = path.join(seriesPath, 'metadata.json');

                if (fs.existsSync(seriesMetadataPath)) {
                  const protocolMetadata = JSON.parse(
                    fs.readFileSync(seriesMetadataPath, 'utf-8')
                  );

                  // Count images in series folder
                  const imageDir = path.join(seriesPath, 'images');
                  let imageCount = 0;
                  if (fs.existsSync(imageDir)) {
                    imageCount = fs.readdirSync(imageDir).filter(f => f.endsWith('.jpg')).length;
                  }

                  protocols.push({
                    protocol: protocolName,
                    folderName: seriesEntry.name,
                    protocolPath: protocolPath,
                    seriesPath: seriesPath,
                    imageCount,
                    ...protocolMetadata,
                  });
                  foundMetadata = true;
                }
              }
            }
          }
        }

        if (protocols.length > 0) {
          modalities.push({
            name: modalityEntry.name,
            protocols,
          });
        }
      }
    }
    res.json({ metadata, modalities });
  } catch (error) {
    console.error('Error loading case:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start scraping
app.post('/api/scrape', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log('Starting scrape for URL:', url);

    // Spawn scraper as child process
    const scraperPath = path.join(__dirname, 'scraper.js');
    const scraper = spawn('node', [scraperPath, '--full', url]);

    let output = '';
    let errorOutput = '';

    scraper.stdout.on('data', (data) => {
      output += data.toString();
      console.log('[Scraper]', data.toString().trim());
    });

    scraper.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error('[Scraper Error]', data.toString().trim());
    });

    scraper.on('close', (code) => {
      if (code === 0) {
        console.log('Scraping completed successfully');
      } else {
        console.error(`Scraping exited with code ${code}`);
      }
    });

    res.json({
      success: true,
      message: 'Scraping started',
      pid: scraper.pid
    });
  } catch (error) {
    console.error('Error starting scrape:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve images from output directory
app.use('/output', express.static(OUTPUT_DIR));

// Serve built Vite app
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // SPA fallback - Express 5 syntax
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Proxy to Vite dev server - Express 5 syntax
  const { createProxyMiddleware } = require('http-proxy-middleware');

  app.use(/.*/, createProxyMiddleware({
    target: `http://localhost:${VITE_PORT}`,
    changeOrigin: true,
    ws: true,
    onError: (err, req, res) => {
      console.log('Proxy error:', err.message);
      res.status(502).send('Vite dev server not available');
    }
  }));
}

// Start server
app.listen(PORT, '127.0.0.1', () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║         Radiopaedia Viewer - Standalone Server           ║
╠══════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT}                ║
║  Image server at:   http://localhost:${PORT}/output          ║
║  API endpoints at:  http://localhost:${PORT}/api            ║
╠══════════════════════════════════════════════════════════╣
║  ${fs.existsSync(distPath) ? '✓ Serving built app (dist/)' : '→ Proxying to Vite dev server'}
╚══════════════════════════════════════════════════════════╝
  `);
});
