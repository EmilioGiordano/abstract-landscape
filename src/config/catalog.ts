import type { Vec3 } from '../util/vec3';

export const WORLD_IDS = ['canyon', 'mandala', 'clouds', 'asteroid', 'crystal', 'mountain', 'volcano'] as const;
export const TERRAIN_IDS = ['lumpy', 'ridged', 'faceted', 'terraced', 'columns', 'dunes'] as const;
export const STYLE_IDS = ['backlight', 'night', 'clay', 'contour', 'aura'] as const;
export const PALETTE_IDS = [
  'sepia',
  'mono',
  'cyanotype',
  'ember',
  'aurora',
  'ultraviolet',
  'gold',
  'sunset',
  'moss',
  'ink',
] as const;
export const SYMMETRY_IDS = ['none', 'mirror', 'quad', 'kaleidoscope6', 'kaleidoscope10'] as const;
export const CAMERA_IDS = ['front', 'side', 'reverse'] as const;
export const CYCLE_IDS = ['random', 'presets'] as const;
export const QUALITY_IDS = ['eco', 'balanced', 'high', 'ultra'] as const;

export type WorldId = (typeof WORLD_IDS)[number];
export type TerrainId = (typeof TERRAIN_IDS)[number];
export type StyleId = (typeof STYLE_IDS)[number];
export type PaletteId = (typeof PALETTE_IDS)[number];
export type SymmetryId = (typeof SYMMETRY_IDS)[number];
export type CameraId = (typeof CAMERA_IDS)[number];
export type CycleId = (typeof CYCLE_IDS)[number];
export type QualityId = (typeof QUALITY_IDS)[number];

export interface OrbitRig {
  radius: number;
  elevations: readonly [number, number, number] | null;
  targetHeight: number;
}

export interface BoltRig {
  top: number;
  impactHeight: number;
  spread: number;
}

export interface WorldSpec {
  id: WorldId;
  orbit: OrbitRig | null;
  bolt: BoltRig;
  morphRate: number;
  swayScale: number;
  usesTerrain: boolean;
}

const DEFAULT_BOLT: BoltRig = { top: 9, impactHeight: 0, spread: 1.5 };

const world = (id: WorldId, overrides: Partial<Omit<WorldSpec, 'id'>> = {}): WorldSpec => ({
  id,
  orbit: null,
  bolt: DEFAULT_BOLT,
  morphRate: 1,
  swayScale: 1,
  usesTerrain: true,
  ...overrides,
});

export const WORLDS: readonly WorldSpec[] = [
  world('canyon'),
  world('mandala', { swayScale: 0.3 }),
  world('clouds'),
  world('asteroid', { orbit: { radius: 10.5, elevations: null, targetHeight: 0 } }),
  world('crystal', { orbit: { radius: 11.5, elevations: null, targetHeight: 0 }, usesTerrain: false }),
  world('mountain', {
    orbit: { radius: 25, elevations: [0.6, 0.22, 1.45], targetHeight: 0.5 },
    bolt: { top: 17, impactHeight: 5, spread: 0.5 },
    morphRate: 2.5,
  }),
  world('volcano', {
    orbit: { radius: 27, elevations: [0.55, 0.22, 1.45], targetHeight: -0.5 },
    bolt: { top: 15, impactHeight: 2, spread: 2.5 },
  }),
];

export interface Palette {
  shadow: Vec3;
  mid: Vec3;
  light: Vec3;
}

export const PALETTES: readonly Palette[] = [
  { shadow: [0.012, 0.01, 0.008], mid: [0.52, 0.46, 0.36], light: [1.0, 0.975, 0.93] },
  { shadow: [0.0, 0.0, 0.0], mid: [0.48, 0.48, 0.48], light: [1.0, 1.0, 1.0] },
  { shadow: [0.0, 0.02, 0.07], mid: [0.1, 0.38, 0.62], light: [0.92, 0.97, 1.0] },
  { shadow: [0.03, 0.0, 0.01], mid: [0.85, 0.22, 0.05], light: [1.0, 0.93, 0.7] },
  { shadow: [0.0, 0.03, 0.05], mid: [0.05, 0.55, 0.45], light: [0.85, 1.0, 0.8] },
  { shadow: [0.03, 0.0, 0.07], mid: [0.62, 0.12, 0.72], light: [1.0, 0.86, 0.95] },
  { shadow: [0.02, 0.015, 0.0], mid: [0.62, 0.42, 0.1], light: [1.0, 0.94, 0.72] },
  { shadow: [0.05, 0.02, 0.15], mid: [0.9, 0.35, 0.3], light: [1.0, 0.9, 0.6] },
  { shadow: [0.0, 0.03, 0.01], mid: [0.35, 0.58, 0.12], light: [0.95, 1.0, 0.75] },
  { shadow: [0.96, 0.94, 0.89], mid: [0.52, 0.5, 0.47], light: [0.04, 0.04, 0.05] },
];

export interface QualityLevel {
  scale: number;
  fps: number;
}

export const QUALITY_LEVELS: readonly QualityLevel[] = [
  { scale: 0.5, fps: 30 },
  { scale: 0.7, fps: 60 },
  { scale: 0.85, fps: 60 },
  { scale: 1.0, fps: 144 },
];

export const worldIndex = (id: WorldId): number => WORLD_IDS.indexOf(id);
export const terrainIndex = (id: TerrainId): number => TERRAIN_IDS.indexOf(id);
export const styleIndex = (id: StyleId): number => STYLE_IDS.indexOf(id);
export const paletteIndex = (id: PaletteId): number => PALETTE_IDS.indexOf(id);
export const symmetryIndex = (id: SymmetryId): number => SYMMETRY_IDS.indexOf(id);
export const cameraIndex = (id: CameraId): number => CAMERA_IDS.indexOf(id);
export const cycleIndex = (id: CycleId): number => CYCLE_IDS.indexOf(id);
export const qualityIndex = (id: QualityId): number => QUALITY_IDS.indexOf(id);
