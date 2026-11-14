export interface CaptureTarget {
  readonly canvas: HTMLCanvasElement;
  readonly gl: WebGL2RenderingContext;
  seekDistance(distance: number): void;
  drawFrame(): void;
  describe(): string;
}

const BENCHMARK_WIDTH = 1920;
const BENCHMARK_HEIGHT = 1080;
const WARMUP_FRAMES = 5;
const MEASURED_FRAMES = 40;

const waitForGpu = (gl: WebGL2RenderingContext): void => {
  gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
};

export const captureStill = (target: CaptureTarget, exportFrame: boolean): void => {
  target.drawFrame();
  waitForGpu(target.gl);
  document.title = `READY ${target.canvas.width}x${target.canvas.height} err=${target.gl.getError()}`;
  if (exportFrame) document.body.dataset.frame = target.canvas.toDataURL('image/jpeg', 0.92);
};

export const runBenchmark = (target: CaptureTarget): void => {
  target.canvas.width = BENCHMARK_WIDTH;
  target.canvas.height = BENCHMARK_HEIGHT;
  const frame = (index: number): void => {
    target.seekDistance(5 + index * 9);
    target.drawFrame();
  };
  for (let index = 0; index < WARMUP_FRAMES; index++) frame(index);
  waitForGpu(target.gl);
  const start = performance.now();
  for (let index = 0; index < MEASURED_FRAMES; index++) frame(index);
  waitForGpu(target.gl);
  const milliseconds = (performance.now() - start) / MEASURED_FRAMES;
  document.title = `BENCH ${target.describe()} ${milliseconds.toFixed(2)} ms/frame`;
};
