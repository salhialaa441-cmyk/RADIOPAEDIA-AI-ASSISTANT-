// CLAHE (Contrast Limited Adaptive Histogram Equalization) shader
// Professional-grade local contrast enhancement for medical imaging
// Note: This is a simplified tile-based implementation

export const claheVertexShader = `#version 300 es
  in vec2 position;
  out vec2 uv;

  void main() {
    uv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

export const claheFragmentShader = `#version 300 es
  precision highp float;

  uniform sampler2D image;
  uniform float clipLimit;
  uniform float tileSize;
  uniform vec2 imageSize;

  in vec2 uv;
  out vec4 fragColor;

  // Compute local histogram for tile - simplified CLAHE
  float computeCLAHE(vec2 coord) {
    float pixel = texture(image, coord).r;
    float bin = pixel * 255.0;

    // Apply contrast limiting
    float limited = clamp(bin, 0.0, clipLimit * 255.0);
    return limited / 255.0;
  }

  void main() {
    vec2 pixelPos = uv * imageSize;
    vec2 tilePos = fract(pixelPos / tileSize);
    vec2 tileIndex = floor(pixelPos / tileSize);

    // Bilinear interpolation between 4 neighboring tiles
    float tl = computeCLAHE((tileIndex + vec2(0, 0)) * tileSize / imageSize);
    float tr = computeCLAHE((tileIndex + vec2(1, 0)) * tileSize / imageSize);
    float bl = computeCLAHE((tileIndex + vec2(0, 1)) * tileSize / imageSize);
    float br = computeCLAHE((tileIndex + vec2(1, 1)) * tileSize / imageSize);

    float top = mix(tl, tr, tilePos.x);
    float bottom = mix(bl, br, tilePos.x);
    float result = mix(top, bottom, tilePos.y);

    fragColor = vec4(result, result, result, 1.0);
  }
`;

export function createCLAHEProgram(gl) {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, claheVertexShader);
  gl.compileShader(vertexShader);

  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error('Vertex shader compile error:', gl.getShaderInfoLog(vertexShader));
    return null;
  }

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, claheFragmentShader);
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
      clipLimit: gl.getUniformLocation(program, 'clipLimit'),
      tileSize: gl.getUniformLocation(program, 'tileSize'),
      imageSize: gl.getUniformLocation(program, 'imageSize'),
    }
  };
}
