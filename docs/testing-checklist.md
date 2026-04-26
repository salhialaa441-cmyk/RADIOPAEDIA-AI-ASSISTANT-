# Medical Image Enhancement - Testing Checklist

## Test Session Date: 2026-04-26

### Prerequisites
- [ ] Dev server running at http://localhost:5173
- [ ] Test cases available in `output/` folder
- [ ] Browser open (Chrome/Edge recommended for WebGL support)

---

## Test 1: Enhancement Panel Toggle

**Steps:**
1. Open the app in browser
2. Load any case from the sidebar
3. Click a protocol to display images
4. Look for the enhancement button (🎨) in the panel toolbar
5. Click the enhancement button

**Expected Results:**
- [ ] Enhancement button (🎨) visible in toolbar
- [ ] Clicking button opens collapsible panel on right side
- [ ] Panel shows "Window/Level" and "Gamma" sections
- [ ] Each section has sliders and reset button (↺)
- [ ] "Reset All" button at bottom

**Keyboard Shortcut Test:**
- [ ] Press `E` key - panel should toggle open/closed

**Pass/Fail:** _____

**Notes:** ___________________________________________

---

## Test 2: Window Width Adjustment

**Steps:**
1. Open enhancement panel
2. Find "Window Width" slider (range: 1-4096)
3. Move slider fully left (minimum)
4. Move slider fully right (maximum)
5. Click reset button (↺) next to "Window/Level" header

**Expected Results:**
- [ ] Image contrast changes in real-time as slider moves
- [ ] Minimum width = very high contrast (black/white extremes)
- [ ] Maximum width = very low contrast (gray, washed out)
- [ ] Reset restores to default value (256)
- [ ] Value display updates smoothly (no lag)

**Performance Check:**
- [ ] Changes appear instant (no noticeable delay)
- [ ] No stuttering or frame drops while dragging

**Pass/Fail:** _____

**Notes:** ___________________________________________

---

## Test 3: Window Level Adjustment

**Steps:**
1. Open enhancement panel
2. Find "Window Level" slider (range: 0-4095)
3. Move slider fully left (minimum)
4. Move slider fully right (maximum)
5. Click reset button (↺)

**Expected Results:**
- [ ] Image brightness changes in real-time
- [ ] Minimum level = brighter image
- [ ] Maximum level = darker image
- [ ] Reset restores to default value (128)
- [ ] Value display updates smoothly

**Pass/Fail:** _____

**Notes:** ___________________________________________

---

## Test 4: Gamma Correction

**Steps:**
1. Open enhancement panel
2. Find "Gamma" slider (range: 0.1-3.0, step: 0.1)
3. Set gamma to 0.5 (brighten)
4. Set gamma to 2.2 (standard display gamma)
5. Set gamma to 3.0 (darken)
6. Click reset button (↺)

**Expected Results:**
- [ ] Gamma < 1.0 brightens dark areas
- [ ] Gamma > 1.0 darkens bright areas
- [ ] Value display shows one decimal place (e.g., "2.2")
- [ ] Reset restores to 1.0
- [ ] Changes are smooth, no banding artifacts

**Pass/Fail:** _____

**Notes:** ___________________________________________

---

## Test 5: Reset All Functionality

**Steps:**
1. Adjust Window Width to non-default value
2. Adjust Window Level to non-default value
3. Adjust Gamma to non-default value
4. Click "Reset All" button at bottom of panel

**Expected Results:**
- [ ] All three values restore to defaults simultaneously
- [ ] Window Width → 256
- [ ] Window Level → 128
- [ ] Gamma → 1.0
- [ ] Image appearance returns to original (unenhanced)

**Pass/Fail:** _____

**Notes:** ___________________________________________

---

## Test 6: Multi-Panel Sync with Enhancement

**Steps:**
1. Open two protocols in split view (2 panels)
2. Enable scroll sync on both panels (click 🔗)
3. Open enhancement panel on one viewport
4. Adjust Window/Level settings
5. Scroll through slices

**Expected Results:**
- [ ] Enhancement panel stays attached to correct viewport
- [ ] Scroll sync continues working with enhancement active
- [ ] Each panel can have independent enhancement settings
- [ ] Closing one panel doesn't crash enhancement on other

**Pass/Fail:** _____

**Notes:** ___________________________________________

---

## Test 7: Cine Play with Enhancement

**Steps:**
1. Load a multi-slice protocol (10+ images)
2. Open enhancement panel
3. Adjust Window/Level and Gamma settings
4. Click cine play button (▶) or press Space

**Expected Results:**
- [ ] Cine playback continues smoothly with enhancement active
- [ ] Enhancement settings persist across all slices
- [ ] No flickering or reset during playback
- [ ] Playback speed unaffected by enhancement

**Pass/Fail:** _____

**Notes:** ___________________________________________

---

## Test 8: Panel Minimize/Maximize with Enhancement

**Steps:**
1. Open enhancement panel
2. Click minimize button (−) on viewport
3. Click maximize button (□) on viewport
4. Click restore buttons

**Expected Results:**
- [ ] Enhancement panel minimizes with viewport
- [ ] Enhancement panel maximizes correctly
- [ ] Settings persist through minimize/maximize cycles
- [ ] No visual glitches or overlapping UI

**Pass/Fail:** _____

**Notes:** ___________________________________________

---

## Test 9: Performance Benchmark

**Steps:**
1. Open browser DevTools (F12)
2. Go to Performance tab
3. Start recording
4. Rapidly adjust all sliders for 10 seconds
5. Stop recording

**Expected Results:**
- [ ] Frame rate stays near 60fps during adjustments
- [ ] No memory leaks (heap stable)
- [ ] No WebGL context lost errors
- [ ] No console errors or warnings

**Pass/Fail:** _____

**Notes:** ___________________________________________

---

## Test 10: Cross-Browser Compatibility

**Test in multiple browsers:**

| Browser | Version | Enhancement Works? | Notes |
|---------|---------|-------------------|-------|
| Chrome  | _____   | [ ] Yes [ ] No    | _____ |
| Edge    | _____   | [ ] Yes [ ] No    | _____ |
| Firefox | _____   | [ ] Yes [ ] No    | _____ |

**Expected:** Works identically across all modern browsers with WebGL 2.0 support

---

## Test 11: Edge Cases

**Steps:**
1. Rapidly click reset buttons multiple times
2. Set sliders to extreme values simultaneously
3. Open/close enhancement panel rapidly (10+ times)
4. Resize browser window while adjusting sliders

**Expected Results:**
- [ ] No crashes or freezes
- [ ] UI remains responsive
- [ ] Values stay within valid ranges
- [ ] No visual corruption

**Pass/Fail:** _____

**Notes:** ___________________________________________

---

## Test 12: Keyboard Shortcuts

**Steps:**
1. Load a case
2. Press `E` - toggle enhancement panel
3. Press `E` again - panel should close
4. Press `H` - switch to pan tool
5. Press `Z` - switch to zoom tool
6. Press `F` - fit to window

**Expected Results:**
- [ ] `E` toggles panel reliably
- [ ] Other shortcuts still work
- [ ] No conflicts between shortcuts
- [ ] Active tool updates in UI

**Pass/Fail:** _____

**Notes:** ___________________________________________

---

## Overall Assessment

**Total Tests Passed:** _____ / 12

**Critical Issues Found:**
- [ ] None
- [ ] Enhancement panel doesn't open
- [ ] Sliders don't update image
- [ ] App crashes on adjustment
- [ ] WebGL errors in console

**Minor Issues Found:**
- [ ] Slight lag on slider drag
- [ ] UI flicker on toggle
- [ ] Value display out of sync
- [ ] Other: _________________

**User Satisfaction Rating:** (Circle one)

1 - Very Dissatisfied  
2 - Dissatisfied  
3 - Neutral  
4 - Satisfied  
5 - Very Satisfied

**Additional Feedback:**

___________________________________________
___________________________________________
___________________________________________

---

## Developer Action Items

Based on testing results:

- [ ] Issue #1: ____________________________
- [ ] Issue #2: ____________________________
- [ ] Issue #3: ____________________________

**Priority:** [ ] Critical  [ ] High  [ ] Medium  [ ] Low

**Follow-up Date:** _______________
