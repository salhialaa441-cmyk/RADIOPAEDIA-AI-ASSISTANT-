// Gamma correction shader for display calibration
// Preserves relative intensities while adjusting brightness perception

export const gammaVertexShader = `#version 300 es
  in vec2 position;
  out vec2 uv;

  void main() {
    uv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

export const gammaFragmentShader = `#version 300 es
  precision highp float;

  uniform sampler2D image;
  uniform float gamma;

  in vec2 uv;
  out vec4 fragColor;

  void main() {
    vec4 pixel = texture(image, uv);

    // Gamma correction: Vout = Vin^(1/gamma)
    float corrected = pow(pixel.r, 1.0 / gamma);

    fragColor = vec4(corrected, corrected, corrected, 1.0);
  }
`;

export function createGammaProgram(gl) {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, gammaVertexShader);
  gl.compileShader(vertexShader);

  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error('Vertex shader compile error:', gl.getShaderInfoLog(vertexShader));
    return null;
  }

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, gammaFragmentShader);
  gl.compileShader(fragmentShader);

  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error('Fragment shader compile error:', gl.getShaderInfoLog(fragmentShader));
    return null;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    return null;
  }

  return {
    program,
    locations: {
      position: gl.getAttribLocation(program, 'position'),
      image: gl.getUniformLocation(program, 'image'),
      gamma: gl.getUniformLocation(program, 'gamma'),
    }
  };
}
