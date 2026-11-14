export class ShaderError extends Error {}

type GL = WebGL2RenderingContext;

const compile = (gl: GL, type: number, source: string): WebGLShader => {
  const shader = gl.createShader(type);
  if (!shader) throw new ShaderError('Unable to create shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? 'Unknown shader compile error';
    gl.deleteShader(shader);
    throw new ShaderError(log);
  }
  return shader;
};

export class Program {
  private readonly locations = new Map<string, WebGLUniformLocation | null>();

  private constructor(
    private readonly gl: GL,
    private readonly handle: WebGLProgram,
  ) {}

  static create(gl: GL, vertexSource: string, fragmentSource: string): Program {
    const handle = gl.createProgram();
    if (!handle) throw new ShaderError('Unable to create program');
    const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
    gl.attachShader(handle, vertex);
    gl.attachShader(handle, fragment);
    gl.linkProgram(handle);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(handle, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(handle) ?? 'Unknown program link error';
      gl.deleteProgram(handle);
      throw new ShaderError(log);
    }
    return new Program(gl, handle);
  }

  use(): void {
    this.gl.useProgram(this.handle);
  }

  float(name: string, value: number): void {
    this.gl.uniform1f(this.location(name), value);
  }

  int(name: string, value: number): void {
    this.gl.uniform1i(this.location(name), value);
  }

  vec2(name: string, x: number, y: number): void {
    this.gl.uniform2f(this.location(name), x, y);
  }

  vec3(name: string, value: ArrayLike<number>): void {
    this.gl.uniform3fv(this.location(name), value as Float32List);
  }

  vec4(name: string, value: ArrayLike<number>): void {
    this.gl.uniform4fv(this.location(name), value as Float32List);
  }

  mat3(name: string, value: ArrayLike<number>): void {
    this.gl.uniformMatrix3fv(this.location(name), false, value as Float32List);
  }

  private location(name: string): WebGLUniformLocation | null {
    let location = this.locations.get(name);
    if (location === undefined) {
      location = this.gl.getUniformLocation(this.handle, name);
      this.locations.set(name, location);
    }
    return location;
  }
}

export interface TargetFormat {
  internalFormat: number;
  format: number;
  type: number;
  filter: number;
}

export class RenderTarget {
  readonly framebuffer: WebGLFramebuffer;
  readonly texture: WebGLTexture;
  width = 0;
  height = 0;

  constructor(
    private readonly gl: GL,
    private readonly format: TargetFormat,
  ) {
    this.framebuffer = gl.createFramebuffer();
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, format.filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, format.filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  resize(width: number, height: number): void {
    if (width === this.width && height === this.height) return;
    const { gl, format } = this;
    this.width = width;
    this.height = height;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, format.internalFormat, width, height, 0, format.format, format.type, null);
  }

  bind(): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    this.gl.viewport(0, 0, this.width, this.height);
  }
}
