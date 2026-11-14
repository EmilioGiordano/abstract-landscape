import { seededUnit } from '../util/random';
import { normalize } from '../util/vec3';

const FOLD_ITERATIONS = 5;

export const crystalRotation = (seed: number, phase: number): number[] => {
  const [x, y, z] = normalize([seededUnit(seed, 4) - 0.5, seededUnit(seed, 5) - 0.5, seededUnit(seed, 6) - 0.5]);
  const angle = 0.04 + 0.14 * seededUnit(seed, 7) + 0.05 * Math.sin(phase * 0.6);
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const t = 1 - c;
  return [
    t * x * x + c,
    t * x * y + s * z,
    t * x * z - s * y,
    t * x * y - s * z,
    t * y * y + c,
    t * y * z + s * x,
    t * x * z + s * y,
    t * y * z - s * x,
    t * z * z + c,
  ];
};

export const crystalShape = (seed: number): [number, number, number, number] => [
  2.25 + 0.35 * seededUnit(seed, 8),
  0.85 + 0.15 * seededUnit(seed, 9),
  0.15 + 0.3 * seededUnit(seed, 10),
  FOLD_ITERATIONS,
];
