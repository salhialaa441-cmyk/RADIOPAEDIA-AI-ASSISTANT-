// ShaderPipeline - WebGL shader pipeline manager for medical image enhancement
// Chains multiple shaders (Window/Level, Gamma, CLAHE, etc.) for real-time processing

import { createWindowLevelProgram } from './shaders/windowLevel';
import { createGammaProgram } from './shaders/gamma';

export class ShaderPipeline {
  constructor(gl) {
    this.gl = gl;

    // Initialize shader programs
    this.windowLevelProgram = createWindowLevelProgram(gl);
    this.gammaProgram = createGammaProgram(gl);

    // Default parameters (DICOM standard)
    this.params = {
      windowCenter: 128,
      windowWidth: 256,
      gamma: 1.0,
    };

    // Create fullscreen quad buffer
    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    // Create framebuffer for chaining
    this.framebuffer = gl.createFramebuffer();
  }

  setWindowLevel(center, width) {
    this.params.windowCenter = center;
    this.params.windowWidth = width;
  }

  setGamma(gamma) {
    this.params.gamma = gamma;
  }

  getWindowCenter() {
    return this.params.windowCenter;
  }

  getWindowWidth() {
    return this.params.windowWidth;
  }

  getGamma() {
    return this.params.gamma;
  }

  process(texture, width, height) {
    const gl = this.gl;

    // Bind framebuffer for off-screen rendering
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

    // Create texture for intermediate result
    const outputTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, outputTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Attach texture to framebuffer
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      outputTexture,
      0
    );

    // Set viewport
    gl.viewport(0, 0, width, height);

    // Process with Window/Level shader
    this._processWithShader(
      this.windowLevelProgram,
      texture,
      this.params.windowCenter,
      this.params.windowWidth
    );

    // Process with Gamma shader (read from framebuffer, write to screen)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    this._processWithShader(
      this.gammaProgram,
      outputTexture,
      this.params.gamma
    );

    return outputTexture;
  }

  _processWithShader(program, texture, ...uniforms) {
    const gl = this.gl;

    gl.useProgram(program.program);

    // Bind vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.enableVertexAttribArray(program.locations.position);
    gl.vertexAttribPointer(program.locations.position, 2, gl.FLOAT, false, 0, 0);

    // Bind texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(program.locations.image, 0);

    // Set uniforms based on program type
    if (program.locations.windowCenter !== undefined) {
      gl.uniform1f(program.locations.windowCenter, uniforms[0]);
      gl.uniform1f(program.locations.windowWidth, uniforms[1]);
    } else if (program.locations.gamma !== undefined) {
      gl.uniform1f(program.locations.gamma, uniforms[0]);
    }

    // Draw fullscreen quad
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose() {
    const gl = this.gl;

    if (this.windowLevelProgram) {
      gl.deleteProgram(this.windowLevelProgram.program);
    }
    if (this.gammaProgram) {
      gl.deleteProgram(this.gammaProgram.program);
    }
    gl.deleteBuffer(this.quadBuffer);
    gl.deleteFramebuffer(this.framebuffer);
  }
}
