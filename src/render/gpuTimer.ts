interface TimerQueryExtension {
  readonly TIME_ELAPSED_EXT: number;
  readonly GPU_DISJOINT_EXT: number;
}

const MAX_PENDING = 3;
const SMOOTHING = 0.1;

export class GpuTimer {
  milliseconds: number | null = null;

  private readonly extension: TimerQueryExtension | null;
  private readonly pending: WebGLQuery[] = [];
  private active: WebGLQuery | null = null;

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.extension = gl.getExtension('EXT_disjoint_timer_query_webgl2') as TimerQueryExtension | null;
  }

  begin(): void {
    if (!this.extension || this.pending.length >= MAX_PENDING) return;
    this.active = this.gl.createQuery();
    this.gl.beginQuery(this.extension.TIME_ELAPSED_EXT, this.active);
  }

  end(): void {
    if (!this.extension) return;
    if (this.active) {
      this.gl.endQuery(this.extension.TIME_ELAPSED_EXT);
      this.pending.push(this.active);
      this.active = null;
    }
    this.collect(this.extension);
  }

  private collect(extension: TimerQueryExtension): void {
    const { gl } = this;
    while (this.pending.length > 0 && gl.getQueryParameter(this.pending[0], gl.QUERY_RESULT_AVAILABLE)) {
      const query = this.pending.shift()!;
      if (!gl.getParameter(extension.GPU_DISJOINT_EXT)) {
        const sample = (gl.getQueryParameter(query, gl.QUERY_RESULT) as number) / 1e6;
        this.milliseconds = this.milliseconds === null ? sample : this.milliseconds + (sample - this.milliseconds) * SMOOTHING;
      }
      gl.deleteQuery(query);
    }
  }
}
