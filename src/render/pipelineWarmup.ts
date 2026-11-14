import type { PipelineSpec, Renderer } from './renderer';

export class PipelineWarmup {
  private current: PipelineSpec | null = null;

  constructor(
    private readonly renderer: Renderer,
    private readonly queue: PipelineSpec[],
  ) {}

  step(): void {
    if (!this.renderer.compilesInBackground) return;
    if (this.current && !this.finished(this.current)) return;
    this.current = this.queue.shift() ?? null;
    if (this.current) this.renderer.request(this.current);
  }

  private finished(spec: PipelineSpec): boolean {
    try {
      return this.renderer.isReady(spec);
    } catch {
      return true;
    }
  }
}
