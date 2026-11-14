import { cameraIndex, paletteIndex, styleIndex, symmetryIndex, terrainIndex, worldIndex } from './catalog';
import type { Settings } from './params';

export interface Preset {
  name: string;
  scene: Partial<Settings>;
}

const world = worldIndex;
const terrain = terrainIndex;
const style = styleIndex;
const palette = paletteIndex;
const symmetry = symmetryIndex;
const camera = cameraIndex;

export const DEFAULT_PRESET = 'Origen';

export const BUILT_IN_PRESETS: readonly Preset[] = [
  { name: DEFAULT_PRESET, scene: {} },
  { name: 'Aguja', scene: { world: world('mountain'), terrain: terrain('ridged'), seed: 21 } },
  {
    name: 'Tormenta',
    scene: {
      world: world('mountain'),
      terrain: terrain('ridged'),
      storm: 0.85,
      palette: palette('mono'),
      camera: camera('side'),
      seed: 21,
    },
  },
  {
    name: 'Carta náutica',
    scene: {
      world: world('mountain'),
      terrain: terrain('terraced'),
      style: style('contour'),
      palette: palette('ink'),
      camera: camera('reverse'),
      seed: 64,
    },
  },
  {
    name: 'Bancales',
    scene: {
      world: world('mountain'),
      terrain: terrain('terraced'),
      palette: palette('moss'),
      camera: camera('side'),
      seed: 64,
    },
  },
  {
    name: 'Volcán',
    scene: {
      world: world('volcano'),
      terrain: terrain('ridged'),
      style: style('night'),
      palette: palette('ember'),
      seed: 310,
    },
  },
  {
    name: 'Erupción',
    scene: { world: world('volcano'), palette: palette('sunset'), camera: camera('side'), storm: 0.5, seed: 12 },
  },
  { name: 'Cordillera', scene: { terrain: terrain('ridged') } },
  { name: 'Basalto', scene: { terrain: terrain('faceted'), palette: palette('mono') } },
  { name: 'Dunas', scene: { terrain: terrain('dunes'), style: style('clay'), palette: palette('gold') } },
  { name: 'Órgano', scene: { world: world('mandala'), terrain: terrain('columns'), folds: 8 } },
  { name: 'Lava', scene: { style: style('night'), palette: palette('ember') } },
  { name: 'Plano azul', scene: { style: style('contour'), palette: palette('cyanotype') } },
  { name: 'Rorschach', scene: { palette: palette('mono'), symmetry: symmetry('mirror') } },
  { name: 'Ultravioleta', scene: { style: style('aura'), palette: palette('ultraviolet') } },
  { name: 'Musgo', scene: { camera: camera('side'), palette: palette('moss') } },
  { name: 'Catedral', scene: { world: world('mandala'), folds: 8 } },
  {
    name: 'Rosa de brasa',
    scene: { world: world('mandala'), style: style('aura'), palette: palette('ember'), folds: 4 },
  },
  {
    name: 'Aurora',
    scene: {
      world: world('clouds'),
      style: style('night'),
      palette: palette('aurora'),
      symmetry: symmetry('kaleidoscope6'),
    },
  },
  { name: 'Archipiélago', scene: { world: world('clouds') } },
  { name: 'Icebergs', scene: { world: world('clouds'), terrain: terrain('faceted'), palette: palette('cyanotype') } },
  { name: 'Meteorito', scene: { world: world('asteroid') } },
  {
    name: 'Gema',
    scene: {
      world: world('asteroid'),
      terrain: terrain('faceted'),
      style: style('night'),
      palette: palette('ultraviolet'),
    },
  },
  {
    name: 'Curvas de oro',
    scene: { world: world('asteroid'), style: style('contour'), palette: palette('gold'), camera: camera('side') },
  },
  {
    name: 'Monolito',
    scene: { world: world('crystal'), style: style('night'), palette: palette('cyanotype'), seed: 77 },
  },
  { name: 'Reliquia', scene: { world: world('crystal'), palette: palette('sunset'), camera: camera('reverse') } },
];
