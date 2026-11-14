const MIN_FACTOR = 0.45;
const SLOW_RATIO = 1.3;
const SLOW_SECONDS_BEFORE_DROP = 1.5;
const STEADY_SECONDS_BEFORE_RAISE = 8;
const IGNORED_SECONDS = 0.25;

export class AdaptiveScale {
  factor = 1;

  private slowSeconds = 0;
  private steadySeconds = 0;

  observe(frameSeconds: number, expectedSeconds: number): void {
    if (frameSeconds > IGNORED_SECONDS) return;
    if (frameSeconds > expectedSeconds * SLOW_RATIO) {
      this.slowSeconds += frameSeconds;
      this.steadySeconds = 0;
    } else {
      this.steadySeconds += frameSeconds;
      this.slowSeconds = Math.max(0, this.slowSeconds - frameSeconds);
    }
    if (this.slowSeconds > SLOW_SECONDS_BEFORE_DROP) {
      this.factor = Math.max(MIN_FACTOR, this.factor * 0.85);
      this.slowSeconds = 0;
    }
    if (this.steadySeconds > STEADY_SECONDS_BEFORE_RAISE && this.factor < 1) {
      this.factor = Math.min(1, this.factor * 1.1);
      this.steadySeconds = 0;
    }
  }
}
