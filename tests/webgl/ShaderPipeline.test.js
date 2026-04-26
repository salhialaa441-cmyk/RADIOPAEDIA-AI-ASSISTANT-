import { describe, it, expect, beforeEach } from 'vitest';
import { ShaderPipeline } from '../../src/webgl/ShaderPipeline';

// Mock WebGL2 context for testing
function createMockWebGL2() {
  const shaders = [];
  const programs = [];
  const textures = [];
  const buffers = [];
  const framebuffers = [];

  const gl = {
    VERTEX_SHADER: 0x8B31,
    FRAGMENT_SHADER: 0x8B30,
    ARRAY_BUFFER: 0x8892,
    STATIC_DRAW: 0x88E4,
    TEXTURE_2D: 0x0DE1,
    TEXTURE_MIN_FILTER: 0x2801,
    TEXTURE_MAG_FILTER: 0x2800,
    LINEAR: 0x2601,
    FRAMEBUFFER: 0x8D40,
    COLOR_ATTACHMENT0: 0x8CE0,
    TEXTURE0: 0x84C0,
    TRIANGLE_STRIP: 0x0005,
    RGBA: 0x1908,
    UNSIGNED_BYTE: 0x1401,
    FRAMEBUFFER: 0x8D40,

    canvas: { width: 800, height: 600 },

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
      const program = { attachedShaders: [], linked: false, locations: {} };
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
      program.locations[name] = 0;
      return 0;
    },

    getUniformLocation(program, name) {
      program.locations[name] = { name };
      return { name };
    },

    createBuffer() {
      const buffer = {};
      buffers.push(buffer);
      return buffer;
    },

    bindBuffer(target, buffer) {},

    bufferData(target, data, usage) {},

    createFramebuffer() {
      const fb = {};
      framebuffers.push(fb);
      return fb;
    },

    bindFramebuffer(target, framebuffer) {},

    createTexture() {
      const tex = {};
      textures.push(tex);
      return tex;
    },

    bindTexture(target, texture) {},

    texImage2D(target, level, internalformat, width, height, border, format, type, pixels) {},

    texParameteri(target, pname, param) {},

    framebufferTexture2D(target, attachment, textarget, texture, level) {},

    viewport(x, y, width, height) {},

    useProgram(program) {},

    enableVertexAttribArray(index) {},

    vertexAttribPointer(index, size, type, normalized, stride, offset) {},

    activeTexture(texture) {},

    uniform1i(location, value) {},

    uniform1f(location, value) {},

    drawArrays(mode, first, count) {},

    deleteProgram(program) {},
    deleteBuffer(buffer) {},
    deleteFramebuffer(framebuffer) {},
    deleteTexture(texture) {},
  };

  return gl;
}

describe('ShaderPipeline', () => {
  let gl;
  let pipeline;

  beforeEach(() => {
    gl = createMockWebGL2();
    pipeline = new ShaderPipeline(gl);
  });

  it('should initialize with default parameters', () => {
    expect(pipeline.getWindowCenter()).toBe(128);
    expect(pipeline.getWindowWidth()).toBe(256);
    expect(pipeline.getGamma()).toBe(1.0);
  });

  it('should update window/level parameters', () => {
    pipeline.setWindowLevel(100, 200);

    expect(pipeline.getWindowCenter()).toBe(100);
    expect(pipeline.getWindowWidth()).toBe(200);
  });

  it('should update gamma parameter', () => {
    pipeline.setGamma(2.2);

    expect(pipeline.getGamma()).toBe(2.2);
  });

  it('should have valid shader programs after initialization', () => {
    expect(pipeline.windowLevelProgram).toBeDefined();
    expect(pipeline.gammaProgram).toBeDefined();
  });
});
