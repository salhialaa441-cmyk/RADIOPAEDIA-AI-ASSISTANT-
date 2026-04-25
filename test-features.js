/**
 * Feature Test Script for Radiopaedia Viewer
 * Run this in the browser console (DevTools) to test features
 */

console.log('=== RADIOPAEDIA VIEWER FEATURE TEST ===');
console.log('Press the keys below or run individual tests:\n');

// Test Results Tracker
const testResults = {
  pass: [],
  fail: [],
  skipped: []
};

function logTest(name, passed, message = '') {
  if (passed) {
    testResults.pass.push(name);
    console.log(`✅ ${name}`);
  } else {
    testResults.fail.push(name);
    console.log(`❌ ${name}: ${message}`);
  }
}

// A. Application Shell Tests
console.log('--- A. APPLICATION SHELL ---');
logTest('A1: Server status element exists', !!document.querySelector('.server-status'));
logTest('A2: Debug panel exists', !!document.querySelector('[style*="DEBUG INFO"]'));

// B. Case Management Tests
console.log('\n--- B. CASE MANAGEMENT ---');
logTest('B1: Case list exists', !!document.querySelector('.case-list'));
logTest('B2: Case search input exists', !!document.querySelector('.case-search input'));
logTest('B3: Modality tabs exist', !!document.querySelector('.modality-tabs'));
logTest('B4: Protocol pills exist', !!document.querySelector('.protocol-pills'));

// C. Image Viewing Tests
console.log('\n--- C. IMAGE VIEWING ---');
logTest('C1: Viewport exists', !!document.querySelector('.viewport'));
logTest('C2: Scrollbar exists', !!document.querySelector('.scrollbar-slider'));
logTest('C3: Canvas Stage exists', !!document.querySelector('canvas'));

const scrollbar = document.querySelector('.scrollbar-slider');
if (scrollbar) {
  logTest('C4: Scrollbar max value', parseInt(scrollbar.max) >= 0, `max=${scrollbar.max}`);
}

// D. Panel Toolbar Tests
console.log('\n--- D. PANEL TOOLBAR ---');
logTest('D1: Toolbar exists', !!document.querySelector('.panel-toolbar'));
logTest('D2: Pan button exists', !!document.querySelector('.tool-btn[title*="Pan"]'));
logTest('D3: Zoom button exists', !!document.querySelector('.tool-btn[title*="Zoom"]'));
logTest('D4: Brightness button exists', !!document.querySelector('.tool-btn[title*="Brightness"]'));
logTest('D5: Fit button exists', !!document.querySelector('.tool-btn[title*="Fit"]'));
logTest('D6: Cine button exists', !!document.querySelector('.cine-btn'));
logTest('D7: Sync button exists', !!document.querySelector('.sync-btn'));
logTest('D8: Speed slider exists', !!document.querySelector('.speed-slider'));

const speedSlider = document.querySelector('.speed-slider');
if (speedSlider) {
  logTest('C9: Speed slider max is 60', parseInt(speedSlider.max) === 60, `max=${speedSlider.max}`);
}

// E. Annotation Tests
console.log('\n--- E. ANNOTATION TOOLS ---');
logTest('E1: Annotation button exists', !!document.querySelector('.tool-btn[title*="Annotation"]'));
logTest('E2: Label hierarchy exists', !!document.querySelector('.label-hierarchy'));

// F. Keyboard Shortcuts Info
console.log('\n--- F. KEYBOARD SHORTCUTS ---');
console.log('Test these manually:');
console.log('  H - Pan tool');
console.log('  Z - Zoom tool');
console.log('  F - Fit to window');
console.log('  Space - Cine play toggle');
console.log('  +/- - Cine speed');
console.log('  1-4 - Annotation tools');
console.log('  Arrows - Navigate slices');
console.log('  D - Debug panel');
console.log('  L - Console viewer');

// Summary
setTimeout(() => {
  console.log('\n=== TEST SUMMARY ===');
  console.log(`✅ Passed: ${testResults.pass.length}`);
  console.log(`❌ Failed: ${testResults.fail.length}`);
  console.log(`⏭️  Skipped: ${testResults.skipped.length}`);

  if (testResults.fail.length > 0) {
    console.log('\nFailed tests:');
    testResults.fail.forEach(t => console.log(`  - ${t}`));
  }
}, 500);

// Auto-test brightness/contrast
console.log('\n--- G. BRIGHTNESS/CONTRAST ---');
const brightnessSlider = document.querySelector('input[type="range"][min="50"][max="150"]');
logTest('G1: Brightness slider exists', !!brightnessSlider);
if (brightnessSlider) {
  logTest('G2: Brightness slider range',
    brightnessSlider.min === '50' && brightnessSlider.max === '150',
    `min=${brightnessSlider.min}, max=${brightnessSlider.max}`);
}

console.log('\n=== TEST COMPLETE ===');
