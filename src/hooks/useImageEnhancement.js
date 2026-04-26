import { useState, useCallback } from 'react';

const DEFAULTS = {
  windowCenter: 128,
  windowWidth: 256,
  gamma: 1.0,
};

export function useImageEnhancement() {
  const [windowCenter, setWindowCenter] = useState(DEFAULTS.windowCenter);
  const [windowWidth, setWindowWidth] = useState(DEFAULTS.windowWidth);
  const [gamma, setGamma] = useState(DEFAULTS.gamma);

  const setWindowLevel = useCallback((center, width) => {
    setWindowCenter(center);
    setWindowWidth(width);
  }, []);

  const reset = useCallback(() => {
    setWindowCenter(DEFAULTS.windowCenter);
    setWindowWidth(DEFAULTS.windowWidth);
    setGamma(DEFAULTS.gamma);
  }, []);

  return {
    windowCenter,
    windowWidth,
    gamma,
    setWindowLevel,
    setGamma,
    reset,
  };
}
