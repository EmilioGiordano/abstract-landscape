import type { WorldSpec } from '../config/catalog';
import { centered, randomInt } from '../util/random';
import { cross, normalize, type Vec3 } from '../util/vec3';
import type { CameraPose } from './camera';

const BOLT_POINTS = 17;
const FORK_POINTS = 9;
const FLASH_DURATION = 0.8;

const jagged = (from: Vec3, to: Vec3, levels: number, amplitude: number): Vec3[] => {
  let points: Vec3[] = [from, to];
  let reach = amplitude;
  for (let level = 0; level < levels; level++) {
    const next: Vec3[] = [points[0]];
    for (let index = 1; index < points.length; index++) {
      const a = points[index - 1];
      const b = points[index];
      next.push(
        [
          (a[0] + b[0]) / 2 + centered(reach),
          (a[1] + b[1]) / 2 + centered(reach * 0.4),
          (a[2] + b[2]) / 2 + centered(reach),
        ],
        b,
      );
    }
    points = next;
    reach *= 0.55;
  }
  return points;
};

const flashEnvelope = (age: number): number => {
  if (age > FLASH_DURATION) return 0;
  const first = Math.exp(-age * 11);
  const second = age > 0.16 ? 0.75 * Math.exp(-(age - 0.16) * 13) : 0;
  const third = age > 0.33 ? 0.5 * Math.exp(-(age - 0.33) * 16) : 0;
  return Math.max(first, second, third) * (0.8 + 0.2 * Math.random());
};

export class Storm {
  readonly bolt = new Float32Array(BOLT_POINTS * 3);
  readonly fork = new Float32Array(FORK_POINTS * 3);
  light: Vec3 = [0, 0, 0];
  flash = 0;

  private age = Infinity;
  private untilNextStrike = 1.5;

  update(seconds: number, intensity: number, world: WorldSpec, pose: () => CameraPose): void {
    this.age += seconds;
    if (intensity <= 0) {
      this.flash = 0;
      return;
    }
    this.untilNextStrike -= seconds;
    if (this.untilNextStrike <= 0) {
      this.strike(world, pose());
      this.untilNextStrike = 0.9 + Math.random() * (2.5 + 16 * (1 - intensity));
    }
    this.flash = flashEnvelope(this.age);
  }

  strikeNow(world: WorldSpec, pose: CameraPose): void {
    this.strike(world, pose);
    this.flash = 1;
  }

  private strike(world: WorldSpec, pose: CameraPose): void {
    const [from, to] = world.orbit ? this.overTarget(world) : this.aheadOf(pose);
    const main = jagged(from, to, 4, 2.6);
    const branchStart = main[randomInt(5, 9)];
    const branchEnd: Vec3 = [
      branchStart[0] + centered(7),
      branchStart[1] - 2 - Math.random() * 3,
      branchStart[2] + centered(7),
    ];
    const branch = jagged(branchStart, branchEnd, 3, 1.3);
    main.forEach((point, index) => this.bolt.set(point, index * 3));
    branch.forEach((point, index) => this.fork.set(point, index * 3));
    this.light = main[11];
    this.age = 0;
  }

  private overTarget(world: WorldSpec): [Vec3, Vec3] {
    const { top, impactHeight, spread } = world.bolt;
    return [
      [centered(top), top, centered(top)],
      [centered(spread), impactHeight, centered(spread)],
    ];
  }

  private aheadOf(pose: CameraPose): [Vec3, Vec3] {
    const ahead = normalize([pose.forward[0], 0, pose.forward[2]]);
    const sideways = cross([0, 1, 0], ahead);
    const reach = 7 + Math.random() * 9;
    const offset = centered(10);
    const ground: Vec3 = [
      pose.origin[0] + ahead[0] * reach + sideways[0] * offset,
      pose.origin[1],
      pose.origin[2] + ahead[2] * reach + sideways[2] * offset,
    ];
    return [
      [ground[0] + centered(3), ground[1] + 9, ground[2] + centered(3)],
      [ground[0], ground[1] - 3, ground[2]],
    ];
  }
}
