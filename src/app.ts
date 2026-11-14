import { QUALITY_LEVELS, WORLDS, type WorldSpec } from './config/catalog';
import { UI } from './config/labels';
import { PARAMS, SEED_LIMITS, SYSTEM_KEYS, defaultSettings, type ParamKey, type Settings } from './config/params';
import { BUILT_IN_PRESETS, DEFAULT_PRESET } from './config/presets';
import { captureStill, runBenchmark, type CaptureTarget } from './dev/capture';
import type { RuntimeOptions } from './dev/runtime';
import { AdaptiveScale } from './render/adaptiveScale';
import { FramePacer } from './render/framePacer';
import { ShaderError } from './render/gl';
import { GpuTimer } from './render/gpuTimer';
import { PipelineWarmup } from './render/pipelineWarmup';
import { Renderer } from './render/renderer';
import { poseCamera, type CameraPose } from './scene/camera';
import { describeScene } from './scene/describe';
import { Director, type SceneChange } from './scene/director';
import { Motion } from './scene/motion';
import { Storm } from './scene/storm';
import { warmupOrder } from './scene/warmupOrder';
import { PresetLibrary } from './state/presetLibrary';
import { applyQueryOverrides, loadSettings, saveSettings } from './state/settings';
import { createStore, type Store } from './state/storage';
import { Hint } from './ui/hint';
import { bindKeyboard } from './ui/keyboard';
import { Panel } from './ui/panel';
import { randomInt } from './util/random';

export interface AppElements {
  canvas: HTMLCanvasElement;
  panel: HTMLElement;
  hint: HTMLElement;
  error: HTMLElement;
}

const MAX_PIXEL_RATIO = 2;
const MAX_FRAME_SECONDS = 0.1;
const STATUS_INTERVAL_SECONDS = 0.5;
const SHADER_KEYS: readonly ParamKey[] = ['world', 'terrain'];
const WARMUP_DELAY_SECONDS = 1;

export class App implements CaptureTarget {
  readonly canvas: HTMLCanvasElement;

  private readonly store: Store;
  private readonly settings: Settings;
  private readonly presets: PresetLibrary;
  private readonly renderer: Renderer;
  private readonly timer: GpuTimer;
  private readonly director: Director;
  private readonly warmup: PipelineWarmup;
  private readonly panel: Panel;
  private readonly hint: Hint;
  private readonly motion = new Motion();
  private readonly storm = new Storm();
  private readonly pacer = new FramePacer();
  private readonly adaptive = new AdaptiveScale();
  private readonly fixedOutput: boolean;

  private frameIndex = 0;
  private lastFrameTime = 0;
  private statusSeconds = 0;
  private statusFrames = 0;

  constructor(
    private readonly elements: AppElements,
    private readonly options: RuntimeOptions,
    query: URLSearchParams,
  ) {
    this.canvas = elements.canvas;
    this.fixedOutput = options.still || options.benchmark;
    this.store = createStore(options.persistent);
    this.settings = loadSettings(this.store, query);
    this.presets = new PresetLibrary(this.store);
    this.applyStartupPreset(query);

    this.renderer = new Renderer(this.canvas, { preserveDrawingBuffer: this.fixedOutput, prepass: options.prepass });
    this.timer = new GpuTimer(this.renderer.gl);
    this.warmup = new PipelineWarmup(this.renderer, warmupOrder(this.presets));
    this.director = new Director(
      this.settings,
      this.presets,
      {
        prepare: (change) => this.renderer.request({ ...this.settings, ...change.scene }),
        isReady: (change) => this.pipelineReady(change),
        apply: (change) => this.applyScene(change),
      },
      options.still,
    );
    this.hint = new Hint(elements.hint, options.interfaceVisible);
    this.panel = new Panel(elements.panel, this.settings, this.presets, {
      changeParam: (key, value) => this.changeParam(key, value),
      choosePreset: (name) => this.choosePreset(name),
      savePreset: (name) => this.savePreset(name),
      deletePreset: () => this.deletePreset(),
      randomScene: () => this.director.goRandom(),
      reseed: () => this.changeParam('seed', randomInt(SEED_LIMITS.min, SEED_LIMITS.max), true),
      reset: () => this.reset(),
    });

    bindKeyboard({
      togglePanel: () => this.togglePanel(),
      randomScene: () => this.director.goRandom(),
      stepPreset: (step) => this.director.stepPreset(step),
    });
    this.canvas.addEventListener('dblclick', () => this.togglePanel());
    window.addEventListener('resize', () => this.resize());

    this.motion.advance(options.startSeconds, this.settings);
    this.resize();
  }

  get gl(): WebGL2RenderingContext {
    return this.renderer.gl;
  }

  start(): void {
    if (!this.compileShaders()) return;
    if (this.options.benchmark) {
      runBenchmark(this);
    } else if (this.options.still) {
      if (this.options.forceLightning) this.storm.strikeNow(this.world, this.pose());
      captureStill(this, this.options.exportFrame);
    } else {
      this.hint.show(UI.hint, 6000);
      requestAnimationFrame(this.tick);
    }
  }

  seekDistance(distance: number): void {
    this.motion.distance = distance;
  }

  describe(): string {
    return describeScene(this.settings, '');
  }

  drawFrame(): void {
    this.renderer.render({
      settings: this.settings,
      pose: this.pose(),
      phase: this.motion.phase,
      clock: this.motion.clock,
      storm: this.storm,
      fade: this.director.fade,
      frameIndex: this.options.still ? 0 : this.frameIndex,
      scale: QUALITY_LEVELS[this.settings.quality].scale * (this.fixedOutput ? 1 : this.adaptive.factor),
    });
    this.frameIndex++;
  }

  private get world(): WorldSpec {
    return WORLDS[this.settings.world];
  }

  private pose(): CameraPose {
    return poseCamera(this.world, this.settings.camera, this.motion);
  }

  private readonly tick = (now: number): void => {
    requestAnimationFrame(this.tick);
    if (!this.pacer.shouldRender(now, QUALITY_LEVELS[this.settings.quality].fps)) return;
    const elapsed = (now - (this.lastFrameTime || now)) / 1000;
    this.lastFrameTime = now;
    const seconds = Math.min(elapsed, MAX_FRAME_SECONDS);

    this.adaptive.observe(elapsed, this.pacer.frameSeconds);
    this.motion.advance(seconds, this.settings);
    this.storm.update(seconds, this.settings.storm, this.world, () => this.pose());
    this.director.update(seconds);
    if (this.motion.clock > WARMUP_DELAY_SECONDS) this.warmup.step();

    this.timer.begin();
    this.drawFrame();
    this.timer.end();
    this.reportStatus(seconds);
  };

  private reportStatus(seconds: number): void {
    this.statusSeconds += seconds;
    this.statusFrames++;
    if (this.statusSeconds < STATUS_INTERVAL_SECONDS) return;
    if (this.panel.visible) {
      const parts = [
        `${Math.round(this.statusFrames / this.statusSeconds)} fps`,
        `${this.renderer.sceneWidth}×${this.renderer.sceneHeight}`,
      ];
      if (this.timer.milliseconds !== null) parts.push(`GPU ${this.timer.milliseconds.toFixed(1)} ms`);
      this.panel.setStatus(parts.join(' · '));
    }
    this.statusSeconds = 0;
    this.statusFrames = 0;
  }

  private resize(): void {
    if (this.options.benchmark) return;
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    const width = Math.max(2, Math.round(window.innerWidth * ratio));
    const height = Math.max(2, Math.round(window.innerHeight * ratio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    if (this.options.still && this.frameIndex > 0) this.drawFrame();
  }

  private applyStartupPreset(query: URLSearchParams): void {
    const preset = this.options.presetIndex === null ? undefined : BUILT_IN_PRESETS[this.options.presetIndex];
    if (!preset) return;
    Object.assign(this.settings, this.presets.resolve(preset.name));
    applyQueryOverrides(this.settings, query);
    this.presets.active = preset.name;
  }

  private compileShaders(): boolean {
    try {
      this.renderer.prepare(this.settings);
      return true;
    } catch (error) {
      const detail = error instanceof ShaderError ? error.message : String(error);
      this.showError(`${UI.shaderError} (${this.describe()}):\n${detail}`);
      return false;
    }
  }

  private showError(message: string): void {
    this.elements.error.textContent = message;
    this.elements.error.classList.add('is-visible');
    document.title = 'ERROR';
  }

  private pipelineReady(change: SceneChange): boolean {
    try {
      return this.renderer.isReady({ ...this.settings, ...change.scene });
    } catch {
      return true;
    }
  }

  private applyScene(change: SceneChange): void {
    Object.assign(this.settings, change.scene);
    this.presets.active = change.presetName;
    if (!this.compileShaders()) return;
    this.afterSceneChange();
  }

  private afterSceneChange(): void {
    saveSettings(this.store, this.settings);
    this.panel.sync();
    this.hint.show(describeScene(this.settings, this.presets.active));
    if (this.options.still) this.drawFrame();
  }

  private changeParam(key: ParamKey, value: number, syncPanel = false): void {
    if (SHADER_KEYS.includes(key)) {
      this.director.goScene({ [key]: value });
      return;
    }
    this.settings[key] = value;
    saveSettings(this.store, this.settings);
    const isSceneKey = !SYSTEM_KEYS.includes(key);
    if (isSceneKey && this.presets.active) {
      this.presets.active = '';
      this.panel.syncPresets();
    }
    if (key === 'auto' || PARAMS[key].kind === 'choice') this.director.restartTimer();
    if (isSceneKey && PARAMS[key].kind === 'choice') this.hint.show(describeScene(this.settings, this.presets.active));
    if (syncPanel) this.panel.sync();
    if (this.options.still) this.drawFrame();
  }

  private choosePreset(name: string): void {
    if (name) this.director.goPreset(name);
    else this.presets.active = '';
  }

  private savePreset(requestedName: string): void {
    const name = this.presets.capture(requestedName, this.settings);
    this.panel.syncPresets();
    this.hint.show(`${UI.presetSaved}: ${name}`);
  }

  private deletePreset(): void {
    this.presets.remove(this.presets.active);
    this.panel.syncPresets();
  }

  private reset(): void {
    Object.assign(this.settings, defaultSettings());
    this.presets.active = DEFAULT_PRESET;
    if (!this.compileShaders()) return;
    this.afterSceneChange();
  }

  private togglePanel(): void {
    this.panel.toggle();
    this.hint.hide();
  }
}
