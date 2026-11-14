import { cycleIndex } from '../config/catalog';
import type { Settings } from '../config/params';
import type { PresetLibrary } from '../state/presetLibrary';
import { randomScene } from './randomScene';

export interface SceneChange {
  scene: Partial<Settings>;
  presetName: string;
}

export interface SceneHooks {
  prepare(change: SceneChange): void;
  isReady(change: SceneChange): boolean;
  apply(change: SceneChange): void;
}

const FADE_OUT_SECONDS = 0.35;
const FADE_IN_SECONDS = 0.6;
const PRESET_CYCLE = cycleIndex('presets');

export class Director {
  fade = 1;

  private pending: SceneChange | null = null;
  private sinceChange = 0;

  constructor(
    private readonly settings: Settings,
    private readonly presets: PresetLibrary,
    private readonly hooks: SceneHooks,
    private readonly instant: boolean,
  ) {}

  goRandom(): void {
    this.queue({ scene: randomScene(this.settings), presetName: '' });
  }

  goScene(scene: Partial<Settings>): void {
    this.queue({ scene, presetName: '' });
  }

  goPreset(name: string): void {
    const scene = this.presets.resolve(name);
    if (scene) this.queue({ scene, presetName: name });
  }

  stepPreset(step: number): void {
    this.goPreset(this.presets.neighbor(step));
  }

  restartTimer(): void {
    this.sinceChange = 0;
  }

  update(seconds: number): void {
    this.sinceChange += seconds;
    if (this.settings.auto > 0 && this.sinceChange >= this.settings.auto * 60) {
      if (this.settings.cycle === PRESET_CYCLE) this.stepPreset(1);
      else this.goRandom();
    }
    if (this.pending) {
      this.fade -= seconds / FADE_OUT_SECONDS;
      if (this.fade <= 0) {
        this.fade = 0;
        if (this.hooks.isReady(this.pending)) {
          const change = this.pending;
          this.pending = null;
          this.hooks.apply(change);
        }
      }
    } else if (this.fade < 1) {
      this.fade = Math.min(1, this.fade + seconds / FADE_IN_SECONDS);
    }
  }

  private queue(change: SceneChange): void {
    if (this.pending) return;
    this.sinceChange = 0;
    this.hooks.prepare(change);
    if (this.instant) this.hooks.apply(change);
    else this.pending = change;
  }
}
