export class ShaderError extends Error {}

type GL = WebGL2RenderingContext;

export interface ParallelCompile {
  readonly COMPLETION_STATUS_KHR: number;
}

const submit = (gl: GL, type: number, source: string): WebGLShader => {
  const shader = gl.createShader(type);
  if (!shader) throw new ShaderError('Unable to create shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
};

export class ProgramBuild {
  private readonly handle: WebGLProgram;
  private readonly shaders: WebGLShader[];

  constructor(
    private readonly gl: GL,
    vertexSource: string,
    fragmentSource: string,
  ) {
    const handle = gl.createProgram();
    if (!handle) throw new ShaderError('Unable to create program');
    this.handle = handle;
    this.shaders = [submit(gl, gl.VERTEX_SHADER, vertexSource), submit(gl, gl.FRAGMENT_SHADER, fragmentSource)];
    for (const shader of this.shaders) gl.attachShader(handle, shader);
    gl.linkProgram(handle);
  }

  isComplete(parallel: ParallelCompile | null): boolean {
    return parallel === null || Boolean(this.gl.getProgramParameter(this.handle, parallel.COMPLETION_STATUS_KHR));
  }

  finish(): Program {
    const { gl, handle, shaders } = this;
    const linked = Boolean(gl.getProgramParameter(handle, gl.LINK_STATUS));
    const logs = linked ? [] : [...shaders.map((shader) => gl.getShaderInfoLog(shader)), gl.getProgramInfoLog(handle)];
    for (const shader of shaders) gl.deleteShader(shader);
    if (!linked) {
      gl.deleteProgram(handle);
      throw new ShaderError(logs.filter(Boolean).join('\n') || 'Unknown shader error');
    }
    return new Program(gl, handle);
  }
}

export class Program {
  private readonly locations = new Map<string, WebGLUniformLocation | null>();

  constructor(
    private readonly gl: GL,
    private readonly handle: WebGLProgram,
  ) {}

  static create(gl: GL, vertexSource: string, fragmentSource: string): Program {
    return new ProgramBuild(gl, vertexSource, fragmentSource).finish();
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
