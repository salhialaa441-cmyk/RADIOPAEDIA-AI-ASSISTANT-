import { describe, it, expect, beforeEach } from 'vitest';
import { createGammaProgram } from '../../../src/webgl/shaders/gamma';

// Mock WebGL2 context for testing shader compilation
function createMockWebGL2() {
  const shaders = [];
  const programs = [];

  return {
    VERTEX_SHADER: 0x8B31,
    FRAGMENT_SHADER: 0x8B30,
    ARRAY_BUFFER: 0x8892,
    STATIC_DRAW: 0x88E4,

    createShader(type) {
      const shader = { type, source: '', compiled: false };
      shaders.push(shader);
      return shader;
    },

    shaderSource(shader, source) {
      shader.source = source;
    },

    compileShader(shader) {
      shader.compiled = true;
    },

    getShaderParameter(shader, param) {
      if (param === 0x8B81) return shader.compiled;
      return true;
    },

    getShaderInfoLog() {
      return '';
    },

    createProgram() {
      const program = { attachedShaders: [], linked: false };
      programs.push(program);
      return program;
    },

    attachShader(program, shader) {
      program.attachedShaders.push(shader);
    },

    linkProgram(program) {
      program.linked = true;
    },

    getProgramParameter(program, param) {
      if (param === 0x8B82) return program.linked;
      return true;
    },

    getProgramInfoLog() {
      return '';
    },

    getAttribLocation(program, name) {
      if (name === 'position') return 0;
      return -1;
    },

    getUniformLocation(program, name) {
      return { name };
    },
  };
}

describe('Gamma Shader', () => {
  let gl;

  beforeEach(() => {
    gl = createMockWebGL2();
  });

  it('should compile gamma shader successfully', () => {
    const result = createGammaProgram(gl);

    expect(result).not.toBeNull();
    expect(result.program).toBeDefined();
  });

  it('should have gamma uniform location', () => {
    const result = createGammaProgram(gl);

    expect(result.locations.gamma).toBeDefined();
  });

  it('should have valid shader source code', () => {
    const result = createGammaProgram(gl);

    expect(result).not.toBeNull();
    expect(result.program.attachedShaders).toHaveLength(2);
  });
});
