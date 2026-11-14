import { PALETTES } from '../config/catalog';
import { SEED_LIMITS, type Settings } from '../config/params';
import { pickWeighted, randomInt } from '../util/random';

const WORLD_WEIGHTS = [3, 2, 2, 2, 2, 2.5, 2];
const TERRAIN_WEIGHTS = [3, 2.5, 2, 1.5, 1.5, 1.5];
const STYLE_WEIGHTS = [3, 2, 1, 1.5, 1.5];
const SYMMETRY_WEIGHTS = [5, 2, 0.8, 0.8, 0.5];
const CAMERA_WEIGHTS = [4, 1.5, 1];
const STORM_CHANCE = 0.18;

const differentWorld = (current: number): number => {
  let world = pickWeighted(WORLD_WEIGHTS);
  while (world === current) world = pickWeighted(WORLD_WEIGHTS);
  return world;
};

export const randomScene = (current: Settings): Partial<Settings> => ({
  world: differentWorld(current.world),
  terrain: pickWeighted(TERRAIN_WEIGHTS),
  style: pickWeighted(STYLE_WEIGHTS),
  palette: randomInt(0, PALETTES.length - 1),
  symmetry: pickWeighted(SYMMETRY_WEIGHTS),
  camera: pickWeighted(CAMERA_WEIGHTS),
  seed: randomInt(SEED_LIMITS.min, SEED_LIMITS.max),
  storm: Math.random() < STORM_CHANCE ? 0.5 + 0.4 * Math.random() : 0,
});
