import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createWindowLevelProgram } from '../../../src/webgl/shaders/windowLevel';

// Mock WebGL2 context for testing shader compilation
function createMockWebGL2() {
  const shaders = [];
  const programs = [];

  return {
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

    createBuffer() {
      return {};
    },

    bindBuffer(target, buffer) {},

    bufferData(target, data, usage) {},

    createFramebuffer() {
      return {};
    },

    bindFramebuffer(target, framebuffer) {},

    createTexture() {
      return {};
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
}

describe('WindowLevel Shader', () => {
  let gl;

  beforeEach(() => {
    gl = createMockWebGL2();
  });

  afterEach(() => {
    gl = null;
  });

  it('should compile vertex and fragment shaders successfully', () => {
    const result = createWindowLevelProgram(gl);

    expect(result).not.toBeNull();
    expect(result.program).toBeDefined();
    expect(result.locations.position).toBeDefined();
    expect(result.locations.windowCenter).toBeDefined();
    expect(result.locations.windowWidth).toBeDefined();
  });

  it('should have correct uniform locations', () => {
    const result = createWindowLevelProgram(gl);

    expect(result.locations.image).toBeDefined();
    expect(result.locations.windowCenter).toBeDefined();
    expect(result.locations.windowWidth).toBeDefined();
  });

  it('should have valid shader source code', () => {
    const result = createWindowLevelProgram(gl);

    expect(result).not.toBeNull();
    expect(result.program.attachedShaders).toHaveLength(2);
  });
});
