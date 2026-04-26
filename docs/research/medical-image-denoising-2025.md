# Medical Image Denoising — State of the Art (2025)

## Executive Summary

Research conducted for RADIOPAEDIA-AI-ASSISTANT enhancement pipeline optimization.

### Key Findings

| Method | PSNR | SSIM | Runtime | Best For |
|--------|------|------|---------|----------|
| **BM3D** (traditional) | 35.7 dB | 0.48 | 1.2s | Low-moderate noise, fast CPU |
| **DnCNN** (CNN) | 31.3 dB | 0.39 | 2.0s | High noise adaptation |
| **DCMIEDNet** (CNN) | 32.9 dB | 0.82 | - | MRI brain, low noise |
| **MIND** (Transformer) | 33.7 dB | 0.91 | - | Best overall quality |
| **DeepTFormer** (Transformer) | 39.4 dB | 0.94 | - | Mammography |

---

## Algorithm Comparison

### Traditional Methods (No Training Required)

#### BM3D (Block-Matching 3D)
- **Strengths:** Gold standard, fast (1.2s), excellent at σ<0.3
- **Weaknesses:** Fails at extreme noise (σ>0.5), fixed transforms
- **Implementation status:** CUDA only, no WebGPU port available
- **References:**
  - [DawyD/bm3d-gpu](https://github.com/DawyD/bm3d-gpu) - CUDA implementation
  - [JeffOwOSun/gpu-bm3d](https://github.com/JeffOwOSun/gpu-bm3d) - 20% speedup, 8-14 fps video
  - [gfacciol/bm3d](https://github.com/gfacciol/bm3d) - CPU with FFTW

#### NLM (Non-Local Means)
- **Strengths:** Edge-preserving, exploits self-similarity
- **Weaknesses:** O(n²) complexity, slow for large images
- **Our implementation:** Fixed border handling, optimized Gaussian weights

### Deep Learning Methods

#### DnCNN
- **Architecture:** Residual learning CNN
- **Performance:** PSNR 31.3 dB, SSIM 0.39
- **Limitation:** Degrades at σ>0.5

#### DCMIEDNet (Dual-Path CNN)
- **Best for:** MRI brain denoising at low-moderate noise
- **Performance:** PSNR 32.9 dB, SSIM 0.82 at σ=10

#### CADTra
- **Best for:** High noise robustness
- **Performance:** PSNR 27.7 dB, SSIM 0.77 at σ=25

### Transformer-Based (State-of-the-Art)

#### MIND (Multi-Scale Transformer)
- **Performance:** PSNR 33.7 dB, SSIM 0.91, F1=0.86 (diagnostic accuracy)
- **Innovation:** Noise-adaptive attention, local-global fusion

#### DeepTFormer
- **Best for:** Mammography
- **Performance:** PSNR 39.4 dB, SSIM 0.94, FSIM 0.93

#### Pureformer (CVPR 2025 Workshop)
- **Test PSNR:** 29.65 dB, SSIM 0.86
- **Architecture:** Multi-Dconv Head Transposed Attention

---

## Recommendations for RADIOPAEDIA

### Immediate Improvements (CPU/JavaScript)

1. **Enhanced NLM with adaptive parameters**
   - Already fixed border handling
   - Add: noise estimation, adaptive h parameter

2. **Improved Bilateral Filter**
   - Add: local noise estimation
   - Add: frequency-based sigma adjustment

3. **Multi-scale approach (inspired by MIND)**
   - Process at multiple resolutions
   - Combine results with scale-adaptive weights

### Future Enhancements (WebGPU)

1. **BM3D WebGPU port**
   - Use [accel-gpu](https://github.com/Phantasm0009/accel-gpu) or [gpu-array-js](https://github.com/ymd-h/gpu-array-js) as foundation
   - Implement block-matching + 3D FFT in WGSL

2. **Transformer-based denoising**
   - Port MIND architecture to WebGPU compute shaders
   - Requires model inference engine (ONNX Runtime Web)

---

## Sources

1. [ArXiv 2508.17223 - CNN-DAE vs CADTra vs DCMIEDNet](https://arxiv.org/pdf/2508.17223v1.pdf)
2. [Scientific Reports - DeepTFormer for Mammograms](https://www.nature.com/articles/s41598-025-89451-w)
3. [Open Neuroimaging Journal - BM3D vs DnCNN benchmark](https://openneuroimagingjournal.com/contents/volumes/V18/e18744400404813/e18744400404813.pdf)
4. [CVPR 2025 - Pureformer](https://openaccess.thecvf.com/content/CVPR2025W/NTIRE/html/Gautam_Pureformer_Transformer-Based_Image_Denoising_CVPRW_2025_paper.html)
5. [GitHub - BM3D GPU implementations](https://github.com/DawyD/bm3d-gpu)
