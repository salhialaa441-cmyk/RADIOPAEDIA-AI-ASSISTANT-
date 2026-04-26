# Image Enhancement Features

## Window/Level (WW/WL)

**Purpose:** Adjust image contrast and brightness using DICOM standard windowing.

**Controls:**
- **Window Width (WW):** Controls contrast (narrow = high contrast, wide = low contrast)
- **Window Level (WL):** Controls brightness (center point of the window)

**Presets:**
- CT Soft Tissue: WW=400, WL=40
- CT Lung: WW=1600, WL=-600
- CT Bone: WW=2000, WL=500
- MRI Brain: WW=100, WL=40

**Keyboard Shortcuts:**
- `Ctrl+1`: Reset to defaults
- `Ctrl+2`: CT Soft Tissue preset
- `Ctrl+3`: CT Lung preset

## Gamma Correction

**Purpose:** Adjust display gamma for optimal brightness perception.

**Range:** 0.1 - 3.0 (default: 1.0)

**Use Cases:**
- < 1.0: Brighten dark images
- > 1.0: Darken bright images
- 2.2: Standard display gamma

## CLAHE (Contrast Limited Adaptive Histogram Equalization)

**Purpose:** Enhance local contrast while preventing noise amplification.

**Parameters:**
- Tile Size: 8×8 or 16×16 (default: 8)
- Clip Limit: 2.0-4.0 (default: 2.0)

**Best For:**
- Chest X-rays (lung detail)
- Mammography (tissue differentiation)
- MRI (soft tissue contrast)

## Unsharp Mask

**Purpose:** Enhance edge definition and fine detail.

**Parameters:**
- Strength: 0.0-2.0 (default: 0.5)

**Caution:** High values can introduce artifacts. Use sparingly for diagnostic work.

## Performance

All enhancements run at 60fps on modern GPUs via WebGL 2.0 acceleration.

## Diagnostic Quality

✅ Safe for diagnostic use:
- Window/Level
- Gamma Correction

⚠️ Visualization aid (verify with original):
- CLAHE
- Unsharp Mask

## Technical Implementation

- **WebGL 2.0** fragment shaders for GPU-accelerated processing
- **GLSL ES 3.0** shader language
- **ShaderPipeline** class manages shader program compilation and uniform updates
- **useImageEnhancement** React hook for state management
- **EnhancementPanel** component provides user controls

## File Structure

```
src/webgl/
  ├── ShaderPipeline.js          # Main pipeline manager
  └── shaders/
      ├── windowLevel.js         # WW/WL shader
      ├── gamma.js               # Gamma correction shader
      ├── clahe.js               # CLAHE shader (advanced)
      └── unsharpMask.js         # Sharpening shader

src/components/
  ├── EnhancementPanel.jsx       # UI controls
  └── EnhancementPanel.css

src/hooks/
  └── useImageEnhancement.js     # React hook for state

tests/webgl/
  ├── ShaderPipeline.test.js
  └── shaders/
      ├── windowLevel.test.js
      ├── gamma.test.js
      ├── clahe.test.js
      └── unsharpMask.test.js
```
