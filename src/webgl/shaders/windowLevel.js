// Window/Level (WW/WL) shader for medical image enhancement
// DICOM standard windowing for radiological viewing

export const windowLevelVertexShader = `#version 300 es
  in vec2 position;
  out vec2 uv;

  void main() {
    uv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

export const windowLevelFragmentShader = `#version 300 es
  precision highp float;

  uniform sampler2D image;
  uniform float windowCenter;
  uniform float windowWidth;

  in vec2 uv;
  out vec4 fragColor;

  void main() {
    vec4 pixel = texture(image, uv);
    float gray = pixel.r; // Use red channel (grayscale images)

    // DICOM windowing formula
    float low = windowCenter - windowWidth / 2.0;
    float high = windowCenter + windowWidth / 2.0;

    // Linear windowing
    float mapped = (gray - low) / (high - low);
    mapped = clamp(mapped, 0.0, 1.0);

    fragColor = vec4(mapped, mapped, mapped, 1.0);
  }
`;

export function createWindowLevelProgram(gl) {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, windowLevelVertexShader);
  gl.compileShader(vertexShader);

  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error('Vertex shader compile error:', gl.getShaderInfoLog(vertexShader));
    return null;
  }

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, windowLevelFragmentShader);
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
      windowCenter: gl.getUniformLocation(program, 'windowCenter'),
      windowWidth: gl.getUniformLocation(program, 'windowWidth'),
    }
  };
}
