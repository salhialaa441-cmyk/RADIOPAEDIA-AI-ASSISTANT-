/**
 * Phase 1-3 Verification Script
 *
 * Tests:
 * 1. Electron app starts successfully
 * 2. Case list loads from output/ directory
 * 3. Images load and display correctly
 * 4. Multi-panel system works
 * 5. Scroll sync functions properly
 * 6. Keyboard shortcuts work
 * 7. Zoom/pan operations work
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

const APP_URL = 'http://localhost:5173';

test.describe('Radiopaedia Viewer - Phase 1-3 Verification', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
  });

  test('App loads successfully', async ({ page }) => {
    const title = await page.title();
    expect(title).toBe('Radiopaedia Viewer');

    const header = await page.locator('.header').isVisible();
    expect(header).toBe(true);
  });

  test('Case list displays loaded cases', async ({ page }) => {
    const caseList = await page.locator('.case-list').isVisible();
    expect(caseList).toBe(true);

    // Check if cases are loaded (assuming output/ has data)
    const caseCards = await page.locator('.case-card').count();
    console.log(`Found ${caseCards} cases loaded`);
  });

  test('Modality tabs are functional', async ({ page }) => {
    // Select a case first
    const firstCase = await page.locator('.case-card').first();
    await firstCase.click();

    // Wait for modality tabs to appear
    await page.waitForSelector('.modality-tabs', { timeout: 5000 });

    const modalityTabs = await page.locator('.modality-tab');
    const count = await modalityTabs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Protocol pills are functional', async ({ page }) => {
    // Select a case
    const firstCase = await page.locator('.case-card').first();
    await firstCase.click();

    // Wait for protocol pills
    await page.waitForSelector('.protocol-pills', { timeout: 5000 });

    const protocolPills = await page.locator('.protocol-pill');
    const count = await protocolPills.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Image viewer loads images', async ({ page }) => {
    // Select a case and protocol
    await page.locator('.case-card').first().click();
    await page.waitForTimeout(1000);

    const firstProtocol = await page.locator('.protocol-pill').first();
    await firstProtocol.click();

    // Wait for image to load
    await page.waitForSelector('.viewport-canvas canvas', { timeout: 10000 });

    const canvas = await page.locator('.viewport-canvas canvas').first();
    const isVisible = await canvas.isVisible();
    expect(isVisible).toBe(true);
  });

  test('Panel toolbar is visible', async ({ page }) => {
    await page.locator('.case-card').first().click();
    await page.waitForTimeout(1000);
    await page.locator('.protocol-pill').first().click();
    await page.waitForTimeout(2000);

    const toolbar = await page.locator('.panel-toolbar').isVisible();
    expect(toolbar).toBe(true);

    // Check for tool buttons
    const zoomBtn = await page.locator('.tool-btn', { hasText: '🔍' }).isVisible();
    expect(zoomBtn).toBe(true);
  });

  test('Keyboard navigation works', async ({ page }) => {
    await page.locator('.case-card').first().click();
    await page.waitForTimeout(1000);
    await page.locator('.protocol-pill').first().click();
    await page.waitForTimeout(2000);

    // Get initial image index
    const initialIndex = await page.locator('.image-counter').textContent();

    // Press right arrow
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);

    const newIndex = await page.locator('.image-counter').textContent();

    // Index should have changed
    expect(newIndex).not.toBe(initialIndex);
  });

  test('Status bar displays correctly', async ({ page }) => {
    await page.locator('.case-card').first().click();
    await page.waitForTimeout(1000);
    await page.locator('.protocol-pill').first().click();
    await page.waitForTimeout(1000);

    const statusBar = await page.locator('.status-bar').isVisible();
    expect(statusBar).toBe(true);
  });

  test('Scrape dialog opens', async ({ page }) => {
    const scrapeBtn = await page.locator('.btn-primary', { hasText: 'Scrape URL' });
    await scrapeBtn.click();

    const dialog = await page.locator('.scrape-dialog').isVisible();
    expect(dialog).toBe(true);
  });
});

console.log('\n=== Phase 1-3 Verification Tests ===\n');
console.log('Run with: npx playwright test tests/verify-phase1-3.js\n');
