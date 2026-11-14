import { PARAMS, SCENE_KEYS, sanitize, type ParamKey, type Settings } from '../config/params';
import { BUILT_IN_PRESETS, type Preset } from '../config/presets';
import { UI } from '../config/labels';
import type { Store } from './storage';

const CUSTOM_KEY = 'presets';
const ACTIVE_KEY = 'preset';

const isPreset = (value: unknown): value is Preset =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Preset).name === 'string' &&
  typeof (value as Preset).scene === 'object' &&
  (value as Preset).scene !== null;

export class PresetLibrary {
  private custom: Preset[];
  private activeName: string;

  constructor(private readonly store: Store) {
    this.custom = store.read<unknown[]>(CUSTOM_KEY, []).filter(isPreset);
    const saved = store.read<string>(ACTIVE_KEY, '');
    this.activeName = this.find(saved) ? saved : '';
  }

  get active(): string {
    return this.activeName;
  }

  set active(name: string) {
    this.activeName = name;
    this.store.write(ACTIVE_KEY, name);
  }

  get builtInNames(): string[] {
    return BUILT_IN_PRESETS.map((preset) => preset.name);
  }

  get customNames(): string[] {
    return this.custom.map((preset) => preset.name);
  }

  get names(): string[] {
    return [...this.builtInNames, ...this.customNames];
  }

  isCustom(name: string): boolean {
    return this.custom.some((preset) => preset.name === name);
  }

  resolve(name: string): Partial<Settings> | null {
    const preset = this.find(name);
    if (!preset) return null;
    const scene: Partial<Settings> = {};
    for (const key of SCENE_KEYS) {
      const value = preset.scene[key];
      scene[key] = typeof value === 'number' ? sanitize(key, value) : PARAMS[key].initial;
    }
    return scene;
  }

  neighbor(step: number): string {
    const names = this.names;
    const current = names.indexOf(this.activeName);
    const start = current < 0 ? (step > 0 ? -1 : 0) : current;
    return names[(start + step + names.length) % names.length];
  }

  capture(requestedName: string, settings: Settings): string {
    let name = requestedName.trim() || `${UI.presetDefaultName} ${this.custom.length + 1}`;
    if (this.builtInNames.includes(name)) name = `${name} ${UI.presetOwnSuffix}`;
    const scene: Partial<Record<ParamKey, number>> = {};
    for (const key of SCENE_KEYS) scene[key] = settings[key];
    this.custom = [...this.custom.filter((preset) => preset.name !== name), { name, scene }];
    this.store.write(CUSTOM_KEY, this.custom);
    this.active = name;
    return name;
  }

  remove(name: string): void {
    this.custom = this.custom.filter((preset) => preset.name !== name);
    this.store.write(CUSTOM_KEY, this.custom);
    if (this.activeName === name) this.active = '';
  }

  private find(name: string): Preset | undefined {
    return BUILT_IN_PRESETS.find((preset) => preset.name === name) ?? this.custom.find((preset) => preset.name === name);
  }
}
