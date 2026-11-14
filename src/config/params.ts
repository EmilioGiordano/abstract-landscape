import {
  CAMERA_LABELS,
  CYCLE_LABELS,
  PALETTE_LABELS,
  QUALITY_LABELS,
  STYLE_LABELS,
  SYMMETRY_LABELS,
  TERRAIN_LABELS,
  WORLD_LABELS,
} from './labels';
import { qualityIndex } from './catalog';

export const PARAM_KEYS = [
  'world',
  'terrain',
  'style',
  'palette',
  'symmetry',
  'camera',
  'storm',
  'auto',
  'cycle',
  'speed',
  'morph',
  'lens',
  'roll',
  'glow',
  'contrast',
  'terrace',
  'detail',
  'folds',
  'tint',
  'iris',
  'quality',
  'seed',
] as const;

export type ParamKey = (typeof PARAM_KEYS)[number];
export type Settings = Record<ParamKey, number>;

export interface RangeParam {
  kind: 'range';
  min: number;
  max: number;
  step: number;
  initial: number;
}

export interface ChoiceParam {
  kind: 'choice';
  options: readonly string[];
  initial: number;
}

export type ParamSpec = RangeParam | ChoiceParam;

export const SEED_LIMITS = { min: 1, max: 9999 } as const;

const range = (min: number, max: number, step: number, initial: number): RangeParam => ({
  kind: 'range',
  min,
  max,
  step,
  initial,
});

const choice = (options: readonly string[], initial = 0): ChoiceParam => ({ kind: 'choice', options, initial });

export const PARAMS: Record<ParamKey, ParamSpec> = {
  world: choice(WORLD_LABELS),
  terrain: choice(TERRAIN_LABELS),
  style: choice(STYLE_LABELS),
  palette: choice(PALETTE_LABELS),
  symmetry: choice(SYMMETRY_LABELS),
  camera: choice(CAMERA_LABELS),
  storm: range(0, 1, 0.01, 0),
  auto: range(0, 30, 0.5, 3),
  cycle: choice(CYCLE_LABELS),
  speed: range(0, 2, 0.01, 0.45),
  morph: range(0, 0.3, 0.005, 0.04),
  lens: range(0.6, 3, 0.01, 1.45),
  roll: range(-0.3, 0.3, 0.005, 0),
  glow: range(0, 2, 0.01, 1),
  contrast: range(0, 1, 0.01, 0.8),
  terrace: range(0, 1, 0.01, 0.7),
  detail: range(0, 1.5, 0.01, 1),
  folds: range(2, 12, 1, 6),
  tint: range(0, 1, 0.01, 1),
  iris: range(0, 1, 0.01, 0),
  quality: choice(QUALITY_LABELS, qualityIndex('balanced')),
  seed: range(SEED_LIMITS.min, SEED_LIMITS.max, 1, 7),
};

export const SYSTEM_KEYS: readonly ParamKey[] = ['auto', 'cycle', 'quality'];
export const SCENE_KEYS: readonly ParamKey[] = PARAM_KEYS.filter((key) => !SYSTEM_KEYS.includes(key));

export type ParamGroupId = 'scene' | 'motion' | 'image' | 'system';

export const PARAM_GROUPS: readonly { id: ParamGroupId; keys: readonly ParamKey[] }[] = [
  { id: 'scene', keys: ['world', 'terrain', 'style', 'palette', 'symmetry', 'camera', 'storm', 'auto', 'cycle'] },
  { id: 'motion', keys: ['speed', 'morph', 'lens', 'roll'] },
  { id: 'image', keys: ['glow', 'contrast', 'terrace', 'detail', 'folds', 'tint', 'iris'] },
  { id: 'system', keys: ['quality', 'seed'] },
];

export const defaultSettings = (): Settings =>
  Object.fromEntries(PARAM_KEYS.map((key) => [key, PARAMS[key].initial])) as Settings;

export const sanitize = (key: ParamKey, value: number): number => {
  const spec = PARAMS[key];
  if (!Number.isFinite(value)) return spec.initial;
  if (spec.kind === 'choice') {
    const index = Math.round(value);
    return index >= 0 && index < spec.options.length ? index : spec.initial;
  }
  return value >= spec.min && value <= spec.max ? value : spec.initial;
};

export const formatValue = (key: ParamKey, value: number): string => {
  const spec = PARAMS[key];
  if (spec.kind === 'choice') return spec.options[value] ?? '';
  if (spec.step >= 1) return String(value);
  return value.toFixed(spec.step < 0.01 ? 3 : spec.step >= 0.5 ? 1 : 2);
};
