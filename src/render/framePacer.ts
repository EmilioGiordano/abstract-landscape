const SAMPLE_COUNT = 60;
const MIN_SAMPLES = 20;
const IGNORED_INTERVAL_MS = 100;

const median = (values: readonly number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[sorted.length >> 1];
};

export class FramePacer {
  private readonly intervals: number[] = [];
  private previous = 0;
  private refreshHz = 60;
  private divisor = 1;
  private counter = 0;

  get frameSeconds(): number {
    return this.divisor / this.refreshHz;
  }

  shouldRender(now: number, targetFps: number): boolean {
    if (this.previous > 0) this.observe(now - this.previous);
    this.previous = now;
    this.divisor = Math.max(1, Math.ceil(this.refreshHz / targetFps - 0.15));
    this.counter = (this.counter + 1) % this.divisor;
    return this.counter === 0;
  }

  private observe(interval: number): void {
    if (interval <= 0 || interval > IGNORED_INTERVAL_MS) return;
    this.intervals.push(interval);
    if (this.intervals.length > SAMPLE_COUNT) this.intervals.shift();
    if (this.intervals.length >= MIN_SAMPLES) this.refreshHz = 1000 / median(this.intervals);
  }
}
