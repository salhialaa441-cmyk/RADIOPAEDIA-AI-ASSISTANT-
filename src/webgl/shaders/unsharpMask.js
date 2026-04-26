// Unsharp Mask shader for edge enhancement and sharpening
// GPU-accelerated implementation using 3x3 Gaussian blur kernel

export const unsharpVertexShader = `#version 300 es
  in vec2 position;
  out vec2 uv;

  void main() {
    uv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

export const unsharpFragmentShader = `#version 300 es
  precision highp float;

  uniform sampler2D image;
  uniform float strength;
  uniform vec2 imageSize;

  in vec2 uv;
  out vec4 fragColor;

  void main() {
    vec4 center = texture(image, uv);

    // 3x3 Gaussian blur kernel
    float blur = 0.0;
    blur += texture(image, uv + vec2(-1, -1) / imageSize).r * 1.0;
    blur += texture(image, uv + vec2(0, -1) / imageSize).r * 2.0;
    blur += texture(image, uv + vec2(1, -1) / imageSize).r * 1.0;
    blur += texture(image, uv + vec2(-1, 0) / imageSize).r * 2.0;
    blur += texture(image, uv).r * 4.0;
    blur += texture(image, uv + vec2(1, 0) / imageSize).r * 2.0;
    blur += texture(image, uv + vec2(-1, 1) / imageSize).r * 1.0;
    blur += texture(image, uv + vec2(0, 1) / imageSize).r * 2.0;
    blur += texture(image, uv + vec2(1, 1) / imageSize).r * 1.0;
    blur /= 16.0;

    // Unsharp mask: original + strength * (original - blurred)
    float sharpened = center.r + strength * (center.r - blur);
    sharpened = clamp(sharpened, 0.0, 1.0);

    fragColor = vec4(sharpened, sharpened, sharpened, 1.0);
  }
`;

export function createUnsharpMaskProgram(gl) {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, unsharpVertexShader);
  gl.compileShader(vertexShader);

  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error('Vertex shader compile error:', gl.getShaderInfoLog(vertexShader));
    return null;
  }

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, unsharpFragmentShader);
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
      strength: gl.getUniformLocation(program, 'strength'),
      imageSize: gl.getUniformLocation(program, 'imageSize'),
    }
  };
}
