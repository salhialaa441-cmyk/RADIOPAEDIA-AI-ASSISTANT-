// Image Enhancement Algorithms
// Copied from prototype/enhancement-clean.html
// All algorithms run synchronously on the main thread

/**
 * Compute histogram and statistics
 */
export function computeHistogram(data, width, height) {
  const hist = new Array(256).fill(0);

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
    hist[gray]++;
  }

  const totalPixels = width * height;
  let mean = 0;
  for (let i = 0; i < 256; i++) {
    mean += i * hist[i];
  }
  mean /= totalPixels;

  let cumulative = 0;
  let median = 0;
  for (let i = 0; i < 256; i++) {
    cumulative += hist[i];
    if (cumulative >= totalPixels / 2) {
      median = i;
      break;
    }
  }

  let entropy = 0;
  for (let i = 0; i < 256; i++) {
    if (hist[i] > 0) {
      const p = hist[i] / totalPixels;
      entropy -= p * Math.log2(p);
    }
  }

  return {
    histogram: hist,
    mean,
    median,
    entropy,
  };
}

/**
 * CLAHE (Contrast Limited Adaptive Histogram Equalization)
 * Based on: Pizer et al. (1987) and Zuiderveld (1994)
 */
export function applyCLAHE(data, width, height, clipLimit, tileW, tileH, autoClip) {
  const tilesX = Math.ceil(width / tileW);
  const tilesY = Math.ceil(height / tileH);
  const lookupTables = [];

  // Compute adaptive clip limit if enabled
  // Based on: arXiv:2604.16010 (IA-CLAHE) + IEEE Contrast-Aware Network research
  // Enhancement: Frequency-based adaptive weighting for edge regions
  function computeAdaptiveClipLimit(startX, endX, startY, endY) {
    const totalPixels = (endX - startX) * (endY - startY);

    // Build local histogram and compute grayscale values in one pass
    const hist = new Array(256).fill(0);
    const grayValues = new Float32Array(totalPixels);
    let grayIdx = 0;

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const idx = (y * width + x) * 4;
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        grayValues[grayIdx++] = gray;
        hist[Math.round(gray)]++;
      }
    }

    // Compute histogram entropy (measure of texture complexity)
    let entropy = 0;
    for (let i = 0; i < 256; i++) {
      if (hist[i] > 0) {
        const p = hist[i] / totalPixels;
        entropy -= p * Math.log2(p);
      }
    }

    // Compute local contrast (standard deviation)
    let mean = 0;
    for (let i = 0; i < totalPixels; i++) {
      mean += grayValues[i];
    }
    mean /= totalPixels;

    let variance = 0;
    for (let i = 0; i < totalPixels; i++) {
      variance += (grayValues[i] - mean) * (grayValues[i] - mean);
    }
    const stdDev = Math.sqrt(variance / totalPixels);

    // NEW: Compute local frequency (edge density) via gradient magnitude
    // High frequency = edges present = boost enhancement
    // Low frequency = homogeneous = reduce enhancement to prevent noise
    let gradientMagnitude = 0;
    const tileWidth = endX - startX;

    for (let y = startY; y < endY - 1; y++) {
      for (let x = startX; x < endX - 1; x++) {
        const idx = (y * width + x) * 4;
        const idxRight = (y * width + (x + 1)) * 4;
        const idxDown = ((y + 1) * width + x) * 4;

        const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const right = (data[idxRight] + data[idxRight + 1] + data[idxRight + 2]) / 3;
        const down = (data[idxDown] + data[idxDown + 1] + data[idxDown + 2]) / 3;

        // Sobel-like gradient (simplified for speed)
        const gradX = Math.abs(right - current);
        const gradY = Math.abs(down - current);
        gradientMagnitude += Math.sqrt(gradX * gradX + gradY * gradY);
      }
    }

    // Normalize gradient magnitude to 0-1 range
    // Typical gradient magnitudes: 0-50 for medical images
    const normFreq = Math.min(1.0, gradientMagnitude / (totalPixels * 15));

    // IA-CLAHE formula with frequency-based weighting
    // Low entropy (homogeneous) → lower clip limit to prevent noise amplification
    // High entropy (textured) → higher clip limit for stronger enhancement
    // High frequency (edges) → additional boost for edge visibility
    const normalizedEntropy = entropy / 8; // Max entropy for 8-bit is 8
    const normalizedContrast = stdDev / 128; // Normalize to ~0-1 range

    // Use user-provided clipLimit as base, then apply adaptive weighting
    // This ensures the strength slider has effect even when autoClip is enabled
    const frequencyWeight = 0.8 + (normFreq * 0.4); // Range: 0.8 - 1.2
    const adaptiveAdjustment =
      (normalizedEntropy * 0.5 * frequencyWeight) +
      (normalizedContrast * 0.3 * frequencyWeight);

    // clipLimit ± adaptive adjustment (keeps user's intent while adapting to local content)
    const adaptiveClip = clipLimit + adaptiveAdjustment - 0.4; // -0.4 centers the adjustment around clipLimit

    return Math.max(1.0, Math.min(4.0, adaptiveClip));
  }

  // Build lookup tables for all tiles
  for (let ty = 0; ty < tilesY; ty++) {
    lookupTables[ty] = [];
    for (let tx = 0; tx < tilesX; tx++) {
      const startX = tx * tileW;
      const startY = ty * tileH;
      const endX = Math.min(startX + tileW, width);
      const endY = Math.min(startY + tileH, height);

      const hist = new Array(256).fill(0);
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * width + x) * 4;
          const gray = Math.round((data[idx] + data[idx + 1] + data[idx + 2]) / 3);
          hist[gray]++;
        }
      }

      const tilePixels = (endX - startX) * (endY - startY);
      const effectiveClipLimit = autoClip
        ? computeAdaptiveClipLimit(startX, endX, startY, endY)
        : clipLimit;
      const clipLimitValue = (tilePixels / 256) * effectiveClipLimit;

      let excess = 0;
      for (let i = 0; i < 256; i++) {
        if (hist[i] > clipLimitValue) {
          excess += hist[i] - clipLimitValue;
          hist[i] = clipLimitValue;
        }
      }
      const addPerBin = Math.floor(excess / 256);
      for (let i = 0; i < 256; i++) {
        hist[i] = Math.min(tilePixels, hist[i] + addPerBin);
      }

      const cdf = new Array(256).fill(0);
      cdf[0] = hist[0];
      for (let i = 1; i < 256; i++) {
        cdf[i] = cdf[i - 1] + hist[i];
      }

      const cdfMin = cdf.find(v => v > 0) || 0;
      const cdfMax = cdf[255];
      const cdfScale = cdfMax !== cdfMin ? 255 / (cdfMax - cdfMin) : 1;
      const lut = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        lut[i] = Math.round(Math.max(0, Math.min(255, (cdf[i] - cdfMin) * cdfScale)));
      }
      lookupTables[ty][tx] = lut;
    }
  }

  // Apply transformation with bilinear interpolation
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const gray = Math.round((data[idx] + data[idx + 1] + data[idx + 2]) / 3);

      const tileX = Math.floor(x / tileW);
      const tileY = Math.floor(y / tileH);
      const localX = x % tileW;
      const localY = y % tileH;
      const interpX = localX / tileW;
      const interpY = localY / tileH;

      const lutTL = lookupTables[tileY]?.[tileX] || lookupTables[Math.min(tileY, tilesY - 1)]?.[Math.min(tileX, tilesX - 1)];
      const lutTR = lookupTables[tileY]?.[tileX + 1] || lutTL;
      const lutBL = lookupTables[tileY + 1]?.[tileX] || lutTL;
      const lutBR = lookupTables[tileY + 1]?.[tileX + 1] || lutTL;

      if (!lutTL) continue;

      const vTL = lutTL[gray];
      const vTR = lutTR[gray];
      const vBL = lutBL[gray];
      const vBR = lutBR[gray];

      const vTop = vTL + (vTR - vTL) * interpX;
      const vBottom = vBL + (vBR - vBL) * interpX;
      const newGray = Math.round(vTop + (vBottom - vTop) * interpY);

      data[idx] = data[idx + 1] = data[idx + 2] = newGray;
    }
  }
}

/**
 * Unsharp Mask (Edge Enhancement)
 */
export function applyUnsharpMask(data, width, height, amount, radius) {
  const blurred = new Uint8ClampedArray(data);

  // Simple box blur
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          sum += data[idx];
          count++;
        }
      }
      const avg = Math.round(sum / count);
      const idx = (y * width + x) * 4;
      blurred[idx] = blurred[idx + 1] = blurred[idx + 2] = avg;
    }
  }

  // Apply unsharp mask
  for (let i = 0; i < data.length; i += 4) {
    const sharpened = Math.round(data[i] + amount * (data[i] - blurred[i]));
    data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, sharpened));
  }
}

/**
 * Bilateral Filter (Edge-Preserving Smoothing)
 * Based on: Tomasi & Manduchi (1998)
 *
 * Optimization: Precomputed exponential LUT for range weights
 */
export function applyBilateralFilter(data, width, height, sigmaSpace, sigmaRange) {
  const output = new Uint8ClampedArray(data);
  const kernelRadius = Math.min(8, Math.ceil(sigmaSpace * 2)); // Cap kernel size for performance

  // Precompute spatial Gaussian kernel
  const spatialKernel = [];
  for (let dy = -kernelRadius; dy <= kernelRadius; dy++) {
    spatialKernel[dy + kernelRadius] = [];
    for (let dx = -kernelRadius; dx <= kernelRadius; dx++) {
      const distSq = dx * dx + dy * dy;
      spatialKernel[dy + kernelRadius][dx + kernelRadius] = Math.exp(-distSq / (2 * sigmaSpace * sigmaSpace));
    }
  }

  // Precompute range weight LUT (avoids 256*256 exp() calls in inner loop)
  const rangeLUT = new Float32Array(256);
  const rangeScale = 2 * sigmaRange * sigmaRange * 255 * 255;
  for (let i = 0; i < 256; i++) {
    rangeLUT[i] = Math.exp(-(i * i) / rangeScale);
  }

  for (let y = kernelRadius; y < height - kernelRadius; y++) {
    for (let x = kernelRadius; x < width - kernelRadius; x++) {
      const idx = (y * width + x) * 4;
      const centerIntensity = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

      let weightedSum = 0;
      let weightTotal = 0;

      for (let dy = -kernelRadius; dy <= kernelRadius; dy++) {
        for (let dx = -kernelRadius; dx <= kernelRadius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          const nidx = (ny * width + nx) * 4;
          const neighborIntensity = (data[nidx] + data[nidx + 1] + data[nidx + 2]) / 3;

          const spatialWeight = spatialKernel[dy + kernelRadius][dx + kernelRadius];
          const intensityDiff = Math.abs(centerIntensity - neighborIntensity);
          const rangeWeight = rangeLUT[intensityDiff]; // LUT lookup instead of exp()

          const combinedWeight = spatialWeight * rangeWeight;
          weightedSum += data[nidx] * combinedWeight;
          weightTotal += combinedWeight;
        }
      }

      const filteredValue = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : 255;
      output[idx] = output[idx + 1] = output[idx + 2] = Math.max(0, Math.min(255, filteredValue));
    }
  }

  // Copy result back
  for (let i = 0; i < data.length; i += 4) {
    data[i] = output[i];
    data[i + 1] = output[i + 1];
    data[i + 2] = output[i + 2];
  }
}

/**
 * Multi-Scale Bilateral Filter (2025 Research-Inspired)
 * Based on: MIND framework noise-adaptive multi-scale approach
 *
 * Processes image at multiple scales and combines results with adaptive weights
 * Better noise suppression in homogeneous regions while preserving edges
 */
export function applyMultiScaleBilateral(data, width, height, baseSigmaSpace, baseSigmaRange, scales = 3) {
  const output = new Uint8ClampedArray(data);
  const gray = new Float32Array(width * height);

  // Precompute grayscale
  for (let i = 0; i < data.length; i += 4) {
    gray[i >> 2] = (data[i] + data[i + 1] + data[i + 2]) / 3;
  }

  // Compute local variance map for adaptive weighting
  const localVariance = new Float32Array(width * height);
  const varianceWindow = 5;
  const halfWin = Math.floor(varianceWindow / 2);

  for (let y = halfWin; y < height - halfWin; y++) {
    for (let x = halfWin; x < width - halfWin; x++) {
      const idx = y * width + x;
      let mean = 0;

      // Compute local mean
      for (let dy = -halfWin; dy <= halfWin; dy++) {
        for (let dx = -halfWin; dx <= halfWin; dx++) {
          mean += gray[idx + dy * width + dx];
        }
      }
      mean /= (varianceWindow * varianceWindow);

      // Compute local variance
      let variance = 0;
      for (let dy = -halfWin; dy <= halfWin; dy++) {
        for (let dx = -halfWin; dx <= halfWin; dx++) {
          const diff = gray[idx + dy * width + dx] - mean;
          variance += diff * diff;
        }
      }
      localVariance[idx] = variance / (varianceWindow * varianceWindow);
    }
  }

  // Process at multiple scales
  const results = [];
  for (let s = 0; s < scales; s++) {
    const scaleFactor = 1 + s * 0.5; // 1.0, 1.5, 2.0, ...
    const sigmaSpace = baseSigmaSpace * scaleFactor;
    const sigmaRange = baseSigmaRange * scaleFactor;

    results[s] = new Float32Array(width * height);
    const kernelRadius = Math.min(12, Math.ceil(sigmaSpace * 2));

    // Precompute spatial kernel for this scale
    const spatialKernel = [];
    for (let dy = -kernelRadius; dy <= kernelRadius; dy++) {
      spatialKernel[dy + kernelRadius] = [];
      for (let dx = -kernelRadius; dx <= kernelRadius; dx++) {
        const distSq = dx * dx + dy * dy;
        spatialKernel[dy + kernelRadius][dx + kernelRadius] = Math.exp(-distSq / (2 * sigmaSpace * sigmaSpace));
      }
    }

    // Precompute range LUT for this scale
    const rangeLUT = new Float32Array(256);
    const rangeScale = 2 * sigmaRange * sigmaRange * 255 * 255;
    for (let i = 0; i < 256; i++) {
      rangeLUT[i] = Math.exp(-(i * i) / rangeScale);
    }

    // Apply bilateral filter
    for (let y = kernelRadius; y < height - kernelRadius; y++) {
      for (let x = kernelRadius; x < width - kernelRadius; x++) {
        const idx = y * width + x;
        const centerIntensity = gray[idx];

        let weightedSum = 0;
        let weightTotal = 0;

        for (let dy = -kernelRadius; dy <= kernelRadius; dy++) {
          for (let dx = -kernelRadius; dx <= kernelRadius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            const nidx = ny * width + nx;
            const neighborIntensity = gray[nidx];

            const spatialWeight = spatialKernel[dy + kernelRadius][dx + kernelRadius];
            const intensityDiff = Math.abs(centerIntensity - neighborIntensity);
            const rangeWeight = rangeLUT[intensityDiff];

            const combinedWeight = spatialWeight * rangeWeight;
            weightedSum += gray[nidx] * combinedWeight;
            weightTotal += combinedWeight;
          }
        }

        results[s][idx] = weightTotal > 0 ? weightedSum / weightTotal : centerIntensity;
      }
    }
  }

  // Combine results with variance-adaptive weights
  // Low variance (homogeneous) → favor larger scales (more denoising)
  // High variance (edges) → favor smaller scales (preserve detail)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const variance = localVariance[idx] || 0;

      // Adaptive weights based on local variance
      const weights = [];
      let weightSum = 0;

      for (let s = 0; s < scales; s++) {
        // Lower scales get higher weight in high-variance regions (edges)
        // Higher scales get higher weight in low-variance regions (smooth)
        const scalePreference = Math.exp(-variance / (50 * (s + 1)));
        weights[s] = scalePreference;
        weightSum += scalePreference;
      }

      // Normalize and combine
      let finalValue = 0;
      for (let s = 0; s < scales; s++) {
        finalValue += results[s][idx] * (weights[s] / weightSum);
      }

      const outIdx = idx * 4;
      const val = Math.max(0, Math.min(255, Math.round(finalValue)));
      output[outIdx] = output[outIdx + 1] = output[outIdx + 2] = val;
    }
  }

  // Copy result back
  for (let i = 0; i < data.length; i += 4) {
    data[i] = output[i];
    data[i + 1] = output[i + 1];
    data[i + 2] = output[i + 2];
  }
}

/**
 * Non-Local Means Denoising
 * Based on: Buades et al. (2005)
 *
 * FIXED: Proper border handling - edge pixels now processed with reduced search window
 */
export function applyNLM(data, width, height, h, patchSize, searchSize) {
  const output = new Uint8ClampedArray(data);
  const patchRadius = Math.floor(patchSize / 2);
  const searchRadius = Math.floor(searchSize / 2);
  const h2 = h * h;

  // Precompute grayscale
  const gray = new Float32Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    gray[i >> 2] = (data[i] + data[i + 1] + data[i + 2]) / 3;
  }

  // Precompute Gaussian weights for patch
  const gaussianWeight = new Float32Array(patchSize * patchSize);
  let gaussianSum = 0;
  for (let py = -patchRadius; py <= patchRadius; py++) {
    for (let px = -patchRadius; px <= patchRadius; px++) {
      const distSq = px * px + py * py;
      const w = Math.exp(-distSq / (2 * (patchRadius / 2) ** 2));
      gaussianWeight[(py + patchRadius) * patchSize + (px + patchRadius)] = w;
      gaussianSum += w;
    }
  }
  for (let i = 0; i < gaussianWeight.length; i++) {
    gaussianWeight[i] /= gaussianSum;
  }

  const centerPatch = new Float32Array(patchSize * patchSize);
  const neighborPatch = new Float32Array(patchSize * patchSize);

  // Process ALL pixels, not just the valid region
  // For border pixels, we reduce the search window to stay within bounds
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const centerIntensity = gray[idx];

      // Extract center patch (handle borders by clamping)
      let patchIdx = 0;
      for (let py = -patchRadius; py <= patchRadius; py++) {
        const clampedY = Math.max(0, Math.min(height - 1, y + py));
        const rowOffset = clampedY * width;
        for (let px = -patchRadius; px <= patchRadius; px++) {
          const clampedX = Math.max(0, Math.min(width - 1, x + px));
          centerPatch[patchIdx] = gray[rowOffset + clampedX] * gaussianWeight[patchIdx];
          patchIdx++;
        }
      }

      let weightedSum = 0;
      let weightTotal = 0;

      // Adaptive search window - reduce at borders to stay within bounds
      const actualSearchY = Math.min(searchRadius, y, height - 1 - y);
      const actualSearchX = Math.min(searchRadius, x, width - 1 - x);

      for (let sy = -actualSearchY; sy <= actualSearchY; sy++) {
        const ny = y + sy;
        const nyOffset = ny * width;
        for (let sx = -actualSearchX; sx <= actualSearchX; sx++) {
          if (sx === 0 && sy === 0) continue;

          const nx = x + sx;
          const nidx = nyOffset + nx;

          // Extract neighbor patch (handle borders by clamping)
          patchIdx = 0;
          for (let py = -patchRadius; py <= patchRadius; py++) {
            const clampedNY = Math.max(0, Math.min(height - 1, ny + py));
            const nRowOffset = clampedNY * width;
            for (let px = -patchRadius; px <= patchRadius; px++) {
              const clampedNX = Math.max(0, Math.min(width - 1, nx + px));
              neighborPatch[patchIdx] = gray[nRowOffset + clampedNX] * gaussianWeight[patchIdx];
              patchIdx++;
            }
          }

          // Compute patch distance with early termination
          let patchDist = 0;
          let earlyTerminate = false;
          const threshold = h2 * 5;

          for (let i = 0; i < patchSize * patchSize; i++) {
            patchDist += (centerPatch[i] - neighborPatch[i]) ** 2;
            if (patchDist > threshold) {
              earlyTerminate = true;
              break;
            }
          }

          if (earlyTerminate) continue;

          const weight = Math.exp(-patchDist / h2);
          weightedSum += gray[nidx] * weight;
          weightTotal += weight;
        }
      }

      // Add center pixel contribution
      weightedSum += centerIntensity;
      weightTotal += 1.0;

      const filteredValue = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : 255;
      const outIdx = idx * 4;
      output[outIdx] = output[outIdx + 1] = output[outIdx + 2] = filteredValue;
    }
  }

  // Copy result back
  for (let i = 0; i < data.length; i += 4) {
    data[i] = output[i];
    data[i + 1] = output[i + 1];
    data[i + 2] = output[i + 2];
  }
}

/**
 * Improved NLM with Adaptive Noise Estimation (2025)
 * Based on: ArXiv 2508.17223 - noise-adaptive h parameter
 *
 * Automatically estimates noise level from image and adjusts denoising strength
 * Uses high-frequency residual for noise estimation (DnCNN-inspired)
 */
export function applyAdaptiveNLM(data, width, height, baseH = 0.5, patchSize = 3, searchSize = 7) {
  const output = new Uint8ClampedArray(data);
  const gray = new Float32Array(width * height);

  // Precompute grayscale
  for (let i = 0; i < data.length; i += 4) {
    gray[i >> 2] = (data[i] + data[i + 1] + data[i + 2]) / 3;
  }

  // Estimate noise level using high-frequency residual (homogeneous region analysis)
  // Based on: "Noise Level Estimation from Single Image via High-Frequency Residual"
  const patchSize2 = 7;
  const halfPatch = Math.floor(patchSize2 / 2);
  const noiseEstimates = [];

  // Find homogeneous regions using local variance
  for (let y = halfPatch; y < height - halfPatch; y += patchSize2) {
    for (let x = halfPatch; x < width - halfPatch; x += patchSize2) {
      const idx = y * width + x;
      let mean = 0;
      let variance = 0;

      // Compute local statistics
      for (let dy = -halfPatch; dy <= halfPatch; dy++) {
        for (let dx = -halfPatch; dx <= halfPatch; dx++) {
          const val = gray[idx + dy * width + dx];
          mean += val;
        }
      }
      mean /= (patchSize2 * patchSize2);

      for (let dy = -halfPatch; dy <= halfPatch; dy++) {
        for (let dx = -halfPatch; dx <= halfPatch; dx++) {
          const diff = gray[idx + dy * width + dx] - mean;
          variance += diff * diff;
        }
      }
      variance /= (patchSize2 * patchSize2);

      // Low variance regions are likely homogeneous (good for noise estimation)
      if (variance < 100) { // Threshold for homogeneous region
        // Use high-frequency residual as noise estimate
        let hfResidual = 0;
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const neighbor = gray[(y + dy) * width + (x + dx)];
            hfResidual += Math.abs(gray[idx] - neighbor);
            count++;
          }
        }
        if (count > 0) {
          noiseEstimates.push(hfResidual / count);
        }
      }
    }
  }

  // Robust noise estimation using median of homogeneous region estimates
  noiseEstimates.sort((a, b) => a - b);
  const estimatedNoise = noiseEstimates.length > 0
    ? noiseEstimates[Math.floor(noiseEstimates.length / 2)]
    : 15; // Default fallback

  // Adaptive h parameter based on estimated noise
  // Higher noise → higher h for stronger denoising
  // Scale: noise 0-50 → h from 0.3 to 1.0
  const adaptiveH = Math.max(0.3, Math.min(1.0, baseH * (1 + estimatedNoise / 30)));

  const patchRadius = Math.floor(patchSize / 2);
  const searchRadius = Math.floor(searchSize / 2);
  const h2 = adaptiveH * adaptiveH;

  // Precompute Gaussian weights for patch
  const gaussianWeight = new Float32Array(patchSize * patchSize);
  let gaussianSum = 0;
  for (let py = -patchRadius; py <= patchRadius; py++) {
    for (let px = -patchRadius; px <= patchRadius; px++) {
      const distSq = px * px + py * py;
      const w = Math.exp(-distSq / (2 * (patchRadius / 2) ** 2));
      gaussianWeight[(py + patchRadius) * patchSize + (px + patchRadius)] = w;
      gaussianSum += w;
    }
  }
  for (let i = 0; i < gaussianWeight.length; i++) {
    gaussianWeight[i] /= gaussianSum;
  }

  const centerPatch = new Float32Array(patchSize * patchSize);
  const neighborPatch = new Float32Array(patchSize * patchSize);

  // Process all pixels with adaptive h
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const centerIntensity = gray[idx];

      // Extract center patch (handle borders by clamping)
      let patchIdx = 0;
      for (let py = -patchRadius; py <= patchRadius; py++) {
        const clampedY = Math.max(0, Math.min(height - 1, y + py));
        const rowOffset = clampedY * width;
        for (let px = -patchRadius; px <= patchRadius; px++) {
          const clampedX = Math.max(0, Math.min(width - 1, x + px));
          centerPatch[patchIdx] = gray[rowOffset + clampedX] * gaussianWeight[patchIdx];
          patchIdx++;
        }
      }

      let weightedSum = 0;
      let weightTotal = 0;

      // Adaptive search window - reduce at borders to stay within bounds
      const actualSearchY = Math.min(searchRadius, y, height - 1 - y);
      const actualSearchX = Math.min(searchRadius, x, width - 1 - x);

      for (let sy = -actualSearchY; sy <= actualSearchY; sy++) {
        const ny = y + sy;
        const nyOffset = ny * width;
        for (let sx = -actualSearchX; sx <= actualSearchX; sx++) {
          if (sx === 0 && sy === 0) continue;

          const nx = x + sx;
          const nidx = nyOffset + nx;

          // Extract neighbor patch (handle borders by clamping)
          patchIdx = 0;
          for (let py = -patchRadius; py <= patchRadius; py++) {
            const clampedNY = Math.max(0, Math.min(height - 1, ny + py));
            const nRowOffset = clampedNY * width;
            for (let px = -patchRadius; px <= patchRadius; px++) {
              const clampedNX = Math.max(0, Math.min(width - 1, nx + px));
              neighborPatch[patchIdx] = gray[nRowOffset + clampedNX] * gaussianWeight[patchIdx];
              patchIdx++;
            }
          }

          // Compute patch distance with early termination
          let patchDist = 0;
          let earlyTerminate = false;
          const threshold = h2 * 5;

          for (let i = 0; i < patchSize * patchSize; i++) {
            patchDist += (centerPatch[i] - neighborPatch[i]) ** 2;
            if (patchDist > threshold) {
              earlyTerminate = true;
              break;
            }
          }

          if (earlyTerminate) continue;

          const weight = Math.exp(-patchDist / h2);
          weightedSum += gray[nidx] * weight;
          weightTotal += weight;
        }
      }

      // Add center pixel contribution
      weightedSum += centerIntensity;
      weightTotal += 1.0;

      const filteredValue = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : 255;
      const outIdx = idx * 4;
      output[outIdx] = output[outIdx + 1] = output[outIdx + 2] = filteredValue;
    }
  }

  // Copy result back
  for (let i = 0; i < data.length; i += 4) {
    data[i] = output[i];
    data[i + 1] = output[i + 1];
    data[i + 2] = output[i + 2];
  }

  return { estimatedNoise, adaptiveH };
}

/**
 * Haar Wavelet Transform for Detail Enhancement
 * Based on: J Med Phys (2025) - Hybrid Approach for Medical Image Enhancement
 *
 * Decomposes image into approximation (LL) and detail coefficients (LH, HL, HH)
 * Then enhances detail coefficients while preserving edges
 *
 * FIXED: Proper handling for odd-width/odd-height images
 */
export function applyWaveletDetailEnhancement(data, width, height, enhancementFactor = 1.5) {
  const gray = new Float32Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    gray[i >> 2] = (data[i] + data[i + 1] + data[i + 2]) / 3;
  }

  // Handle odd dimensions by processing even pairs and copying odd pixels
  const halfWidth = Math.floor(width / 2);
  const halfHeight = Math.floor(height / 2);
  const hasOddWidth = width % 2 === 1;
  const hasOddHeight = height % 2 === 1;

  // Process in 2x2 blocks (Haar wavelet decomposition)
  const ll = new Float32Array(halfWidth * halfHeight);
  const lh = new Float32Array(halfWidth * halfHeight);
  const hl = new Float32Array(halfWidth * halfHeight);
  const hh = new Float32Array(halfWidth * halfHeight);

  // Forward Haar transform - process 2x2 blocks
  for (let y = 0; y < halfHeight; y++) {
    for (let x = 0; x < halfWidth; x++) {
      const idx = y * width + x * 2;
      const p1 = gray[idx];
      const p2 = gray[idx + 1];
      const p3 = gray[idx + width];
      const p4 = gray[idx + width + 1];

      const blockIdx = y * halfWidth + x;
      ll[blockIdx] = (p1 + p2 + p3 + p4) / 4;      // Approximation (low-low)
      lh[blockIdx] = (p1 + p3 - p2 - p4) / 4;      // Horizontal detail (low-high)
      hl[blockIdx] = (p1 + p2 - p3 - p4) / 4;      // Vertical detail (high-low)
      hh[blockIdx] = (p1 - p2 - p3 + p4) / 4;      // Diagonal detail (high-high)
    }
  }

  // Enhance detail coefficients (multiply by enhancement factor)
  // This amplifies edges and fine details without amplifying noise
  for (let i = 0; i < lh.length; i++) {
    lh[i] *= enhancementFactor;
    hl[i] *= enhancementFactor;
    hh[i] *= enhancementFactor;
  }

  // Inverse Haar transform (reconstruct image)
  for (let y = 0; y < halfHeight; y++) {
    for (let x = 0; x < halfWidth; x++) {
      const blockIdx = y * halfWidth + x;
      const idx = y * width + x * 2;

      const LL = ll[blockIdx];
      const LH = lh[blockIdx];
      const HL = hl[blockIdx];
      const HH = hh[blockIdx];

      // Reconstruct original 4 pixels
      gray[idx] = Math.max(0, Math.min(255, LL + LH + HL + HH));
      gray[idx + 1] = Math.max(0, Math.min(255, LL - LH + HL - HH));
      gray[idx + width] = Math.max(0, Math.min(255, LL + LH - HL - HH));
      gray[idx + width + 1] = Math.max(0, Math.min(255, LL - LH - HL + HH));
    }
  }

  // Handle odd dimensions - copy edge pixels directly
  if (hasOddWidth) {
    // Copy rightmost column
    for (let y = 0; y < height; y++) {
      const srcIdx = y * width + (width - 2);
      const dstIdx = y * width + (width - 1);
      if (srcIdx >= 0 && srcIdx < gray.length && dstIdx >= 0 && dstIdx < gray.length) {
        gray[dstIdx] = gray[srcIdx];
      }
    }
  }

  if (hasOddHeight) {
    // Copy bottom row
    for (let x = 0; x < width; x++) {
      const srcIdx = (height - 2) * width + x;
      const dstIdx = (height - 1) * width + x;
      if (srcIdx >= 0 && srcIdx < gray.length && dstIdx >= 0 && dstIdx < gray.length) {
        gray[dstIdx] = gray[srcIdx];
      }
    }
  }

  // Copy result back
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i + 1] = data[i + 2] = Math.round(gray[i >> 2]);
  }
}

/**
 * Anisotropic Diffusion (Perona-Malik)
 */
export function applyAnisotropicDiffusion(data, width, height, iterations, conductance, timestep) {
  const output = new Uint8ClampedArray(data);
  const K = conductance;
  const dt = timestep;

  const gray = new Float32Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    gray[i >> 2] = (data[i] + data[i + 1] + data[i + 2]) / 3;
  }

  for (let iter = 0; iter < iterations; iter++) {
    const input = new Float32Array(gray);
    const delta = new Float32Array(width * height);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const center = input[idx];

        const gradN = Math.abs(input[(y - 1) * width + x] - center);
        const gradS = Math.abs(input[(y + 1) * width + x] - center);
        const gradW = Math.abs(input[y * width + (x - 1)] - center);
        const gradE = Math.abs(input[y * width + (x + 1)] - center);

        const cN = 1 / (1 + (gradN / K) ** 2);
        const cS = 1 / (1 + (gradS / K) ** 2);
        const cW = 1 / (1 + (gradW / K) ** 2);
        const cE = 1 / (1 + (gradE / K) ** 2);

        const fluxN = cN * (input[(y - 1) * width + x] - center);
        const fluxS = cS * (input[(y + 1) * width + x] - center);
        const fluxW = cW * (input[y * width + (x - 1)] - center);
        const fluxE = cE * (input[y * width + (x + 1)] - center);

        delta[idx] = dt * (fluxN + fluxS + fluxW + fluxE);
      }
    }

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const newValue = input[idx] + delta[idx];
        gray[idx] = Math.max(0, Math.min(255, Math.round(newValue)));
      }
    }
  }

  // Copy result back
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i + 1] = data[i + 2] = Math.round(gray[i >> 2]);
  }
}

/**
 * Apply full enhancement pipeline with optional stage caching
 * Order: Denoise → CLAHE → Wavelet Detail → Unsharp → Window/Level + Gamma
 * Based on: J Med Phys (2025) - Hybrid Approach for Medical Image Enhancement
 *
 * @param {ImageData} imageData - Input image data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Object} options - Enhancement options
 * @param {Object} prevParamsRef - Optional reference to previous parameters (for caching)
 * @param {Object} resultCache - Optional cache for storing processed intermediate results
 * @returns {ImageData} Processed image data
 */
export function applyEnhancementPipeline(
  imageData,
  width,
  height,
  options = {},
  prevParamsRef = null,
  resultCache = null
) {
  const data = new Uint8ClampedArray(imageData.data);

  const {
    denoiseType = null, // 'nlm' or 'bilateral'
    denoiseParams = null,
    denoiseMode = 'standard', // 'standard' | 'adaptive' | 'multiscale'
    anisotropicEnabled = false,
    anisotropicParams = null,
    claheEnabled = false,
    claheParams = null,
    waveletEnabled = false,
    waveletFactor = 1.5,
    unsharpEnabled = false,
    unsharpParams = null,
    windowCenter = 128,
    windowWidth = 255,
    gamma = 1.0,
  } = options;

  // Build simplified hash for caching comparison (more reliable than deepEqual for this use case)
  const buildParamsHash = (params) => JSON.stringify(params);

  const currentHash = {
    denoise: buildParamsHash({ type: denoiseType, params: denoiseParams, anisotropic: { enabled: anisotropicEnabled, params: anisotropicParams } }),
    clahe: buildParamsHash({ enabled: claheEnabled, params: claheParams }),
    wavelet: buildParamsHash({ enabled: waveletEnabled, factor: waveletFactor }),
    unsharp: buildParamsHash({ enabled: unsharpEnabled, params: unsharpParams }),
  };

  // Check if we can use cached intermediate result (only window/level changed)
  const prevHash = prevParamsRef?.hash;
  const onlyWindowLevelChanged = prevHash &&
    prevHash.denoise === currentHash.denoise &&
    prevHash.clahe === currentHash.clahe &&
    prevHash.wavelet === currentHash.wavelet &&
    prevHash.unsharp === currentHash.unsharp &&
    resultCache?.preWindowLevel;

  if (onlyWindowLevelChanged && resultCache?.preWindowLevel) {
    // Skip expensive stages, copy cached intermediate result
    const cachedData = resultCache.preWindowLevel;
    for (let i = 0; i < data.length; i++) {
      data[i] = cachedData[i];
    }
  } else {
    // Step 1: Denoising (full pipeline)
    if (anisotropicEnabled && anisotropicParams) {
      applyAnisotropicDiffusion(
        data,
        width,
        height,
        anisotropicParams.iterations,
        anisotropicParams.conductance,
        anisotropicParams.timestep
      );
    } else if (denoiseType === 'nlm' && denoiseParams) {
      // Choose NLM variant based on denoiseMode
      if (denoiseMode === 'adaptive') {
        // Improved NLM with automatic noise estimation
        const result = applyAdaptiveNLM(
          data,
          width,
          height,
          denoiseParams.h,
          denoiseParams.patchSize,
          denoiseParams.searchSize
        );
        // Optionally log estimated noise for debugging
        // console.log('Adaptive NLM:', result);
      } else {
        // Standard NLM (fixed parameters)
        applyNLM(
          data,
          width,
          height,
          denoiseParams.h,
          denoiseParams.patchSize,
          denoiseParams.searchSize
        );
      }
    } else if (denoiseType === 'bilateral' && denoiseParams) {
      // Choose bilateral variant based on denoiseMode
      if (denoiseMode === 'multiscale') {
        // Multi-scale bilateral (2025 research-inspired)
        applyMultiScaleBilateral(
          data,
          width,
          height,
          denoiseParams.sigmaSpace,
          denoiseParams.sigmaRange,
          3 // 3 scales
        );
      } else {
        // Standard bilateral filter
        applyBilateralFilter(
          data,
          width,
          height,
          denoiseParams.sigmaSpace,
          denoiseParams.sigmaRange
        );
      }
    }

    // Step 2: CLAHE
    if (claheEnabled && claheParams) {
      applyCLAHE(
        data,
        width,
        height,
        claheParams.clipLimit,
        claheParams.tileW,
        claheParams.tileH,
        claheParams.autoClip
      );
    }

    // Step 3: Wavelet Detail Enhancement (NEW - J Med Phys 2025)
    // Enhances fine details and edges without amplifying noise
    if (waveletEnabled) {
      applyWaveletDetailEnhancement(data, width, height, waveletFactor);
    }

    // Step 4: Unsharp Mask (only if wavelet is disabled, to avoid double enhancement)
    if (!waveletEnabled && unsharpEnabled && unsharpParams) {
      applyUnsharpMask(
        data,
        width,
        height,
        unsharpParams.amount,
        unsharpParams.radius
      );
    }

    // Cache intermediate result (before window/level) for future frames
    if (resultCache) {
      resultCache.preWindowLevel = new Uint8ClampedArray(data);
    }
  }

  // Step 5: Window/Level + Gamma (always applied, very fast)
  const low = windowCenter - windowWidth / 2;
  const high = windowCenter + windowWidth / 2;
  for (let i = 0; i < data.length; i += 4) {
    let gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
    gray = (gray - low) / ((high - low) || 1);
    gray = Math.max(0, Math.min(1, gray));
    gray = Math.pow(gray, 1 / gamma);
    gray = Math.round(gray * 255);
    data[i] = data[i + 1] = data[i + 2] = gray;
  }

  // Update cache hash for next frame comparison
  if (prevParamsRef) {
    prevParamsRef.hash = currentHash;
  }

  return new ImageData(data, width, height);
}

/**
 * Multi-Scale Retinex with HVS-Inspired Enhancement
 * Based on: 2025 Research - D-PerceptCT (arXiv:2511.14518) and Hybrid Multi-Stage Pipeline (J Med Phys 2025)
 *
 * Key innovations:
 * 1. Multi-scale decomposition mimicking human visual system (HVS) frequency channels
 * 2. Adaptive gain based on local contrast sensitivity (CSF-inspired)
 * 3. Edge-preserving detail enhancement using gradient-based weighting
 * 4. Noise-aware suppression in homogeneous regions
 *
 * Scientific basis:
 * - HVS has multiple frequency channels with different contrast sensitivity
 * - Low-frequency bands carry structure, high-frequency bands carry edges/details
 * - Enhancement should be spatially adaptive: boost edges, suppress noise in flat regions
 */
export function applyMultiScaleRetinex(data, width, height, scales = [15, 80, 250], detailBoost = 1.8, edgeThreshold = 20) {
  // Convert to grayscale (working buffer)
  const gray = new Float32Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    gray[i >> 2] = (data[i] + data[i + 1] + data[i + 2]) / 3;
  }

  // Multi-scale decomposition using Gaussian pyramids
  // Each scale captures different frequency band (HVS-inspired)
  const pyramid = [];
  const maxScale = Math.max(...scales);
  const pad = maxScale * 2 + 1;

  // Pad image for border handling
  const padded = new Float32Array((width + pad * 2) * (height + pad * 2));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      padded[(y + pad) * (width + pad * 2) + (x + pad)] = gray[y * width + x];
    }
  }

  // Build scale layers
  for (const scale of scales) {
    const blurred = new Float32Array(width * height);
    const sigma2 = 2 * scale * scale;

    // Gaussian blur at this scale
    const kernelRad = Math.ceil(scale * 2);
    const kernel = [];
    let kernelSum = 0;

    for (let ky = -kernelRad; ky <= kernelRad; ky++) {
      kernel[ky + kernelRad] = [];
      for (let kx = -kernelRad; kx <= kernelRad; kx++) {
        const w = Math.exp(-(kx * kx + ky * ky) / sigma2);
        kernel[ky + kernelRad][kx + kernelRad] = w;
        kernelSum += w;
      }
    }

    // Apply blur
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0, weightSum = 0;
        for (let ky = -kernelRad; ky <= kernelRad; ky++) {
          for (let kx = -kernelRad; kx <= kernelRad; kx++) {
            const px = x + kx + pad;
            const py = y + ky + pad;
            if (px >= 0 && px < width + pad * 2 && py >= 0 && py < height + pad * 2) {
              const w = kernel[ky + kernelRad][kx + kernelRad] / kernelSum;
              sum += padded[py * (width + pad * 2) + px] * w;
              weightSum += w;
            }
          }
        }
        blurred[y * width + x] = sum / weightSum;
      }
    }
    pyramid.push(blurred);
  }

  // Compute gradient magnitude for edge detection
  const gradientMag = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const gx = Math.abs(gray[idx + 1] - gray[idx - 1]);
      const gy = Math.abs(gray[idx + width] - gray[idx - width]);
      gradientMag[idx] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  // Compute local variance for noise detection (homogeneous vs textured regions)
  const localVariance = new Float32Array(width * height);
  const localVarRad = 3;
  for (let y = localVarRad; y < height - localVarRad; y++) {
    for (let x = localVarRad; x < width - localVarRad; x++) {
      const idx = y * width + x;
      let localMean = 0;
      for (let ly = -localVarRad; ly <= localVarRad; ly++) {
        for (let lx = -localVarRad; lx <= localVarRad; lx++) {
          localMean += gray[idx + ly * width + lx];
        }
      }
      localMean /= (2 * localVarRad + 1) ** 2;

      let variance = 0;
      for (let ly = -localVarRad; ly <= localVarRad; ly++) {
        for (let lx = -localVarRad; lx <= localVarRad; lx++) {
          const diff = gray[idx + ly * width + lx] - localMean;
          variance += diff * diff;
        }
      }
      localVariance[idx] = variance / (2 * localVarRad + 1) ** 2;
    }
  }

  // Multi-scale enhancement with adaptive gain
  // Based on HVS contrast sensitivity: boost mid-frequencies more than low/high
  const result = new Float32Array(gray);
  const csfPeak = 0.4; // CSF peaks at mid-frequencies

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const centerVal = gray[idx];
      const edgeStrength = gradientMag[idx];
      const variance = localVariance[idx];

      // Edge-adaptive weight: protect strong edges from over-enhancement
      const edgeWeight = edgeStrength > edgeThreshold ? 0.5 : 1.0;

      // Noise-adaptive weight: reduce enhancement in homogeneous (noisy) regions
      const noiseWeight = variance < 50 ? 0.3 : (variance < 200 ? 0.6 : 1.0);

      // Multi-scale detail extraction and enhancement
      let enhancedVal = centerVal;

      for (let s = 0; s < pyramid.length; s++) {
        const scaleVal = pyramid[s][idx];
        const detail = centerVal - scaleVal;

        // CSF-inspired gain: mid-frequencies get more boost
        const scaleIndex = s / pyramid.length;
        const csfGain = Math.exp(-Math.pow(scaleIndex - csfPeak, 2) / 0.15);

        // Combined adaptive gain
        const adaptiveGain = detailBoost * csfGain * edgeWeight * noiseWeight;
        enhancedVal += detail * adaptiveGain;
      }

      result[idx] = enhancedVal;
    }
  }

  // Apply result to RGBA data
  for (let i = 0; i < data.length; i += 4) {
    const idx = i >> 2;
    const val = Math.max(0, Math.min(255, result[idx]));
    data[i] = data[i + 1] = data[i + 2] = val;
  }
}

/**
 * Hybrid Enhancement Pipeline (2025 Research-Based)
 * Combines: Denoising → Multi-Scale Retinex → CLAHE → Gamma
 *
 * Based on: "Reducing Noise and Improving Image Contrast with a Hybrid Approach" (J Med Phys 2025)
 * This pipeline achieved best results for CT and MRI:
 * - PSNR: 39.86 (CT), 37.79 (MRI)
 * - SSIM: 0.7106 (CT), 0.7368 (MRI)
 */
export function applyHybridPipeline(
  data,
  width,
  height,
  params = {}
) {
  const {
    denoiseEnabled = false,
    denoiseStrength = 0.5,
    retinexEnabled = true,
    retinexDetailBoost = 1.8,
    claheEnabled = true,
    claheClipLimit = 2.0,
    claheAutoClip = false, // Allow user to toggle auto-clip
    gammaEnabled = false,
    gamma = 1.0,
    windowCenter = 128,
    windowWidth = 255
  } = params;

  // Step 1: Optional denoising (NLM for best quality)
  if (denoiseEnabled) {
    applyNLM(data, width, height, denoiseStrength, 3, 7);
  }

  // Step 2: Multi-Scale Retinex enhancement (NEW - 2025 research)
  if (retinexEnabled) {
    applyMultiScaleRetinex(data, width, height, [15, 80, 250], retinexDetailBoost, 20);
  }

  // Step 3: CLAHE for contrast enhancement
  // Pass claheClipLimit as base value - adaptive mode now uses it as starting point
  if (claheEnabled) {
    applyCLAHE(data, width, height, claheClipLimit, 64, 64, claheAutoClip);
  }

  // Step 4: Window/Level + Gamma for display
  if (gammaEnabled && gamma !== 1.0) {
    // Apply window/level first
    const low = windowCenter - windowWidth / 2;
    const high = windowCenter + windowWidth / 2;

    for (let i = 0; i < data.length; i += 4) {
      let gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      gray = (gray - low) / ((high - low) || 1);
      gray = Math.max(0, Math.min(1, gray));
      gray = Math.pow(gray, 1 / gamma);
      gray = Math.round(gray * 255);
      data[i] = data[i + 1] = data[i + 2] = gray;
    }
  }

  return new ImageData(data, width, height);
}
