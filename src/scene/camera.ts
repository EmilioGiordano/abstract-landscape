import { cameraIndex, type OrbitRig, type WorldSpec } from '../config/catalog';
import { blend, cross, normalize, type Vec3 } from '../util/vec3';
import type { Motion } from './motion';

export interface CameraPose {
  origin: Vec3;
  forward: Vec3;
  right: Vec3;
  up: Vec3;
}

const PATH_RADIUS = 300;
const TAU = Math.PI * 2;
const SIDE = cameraIndex('side');
const REVERSE = cameraIndex('reverse');
const WORLD_UP: Vec3 = [0, 1, 0];

interface Aim {
  origin: Vec3;
  forward: Vec3;
  upReference: Vec3;
}

const onSphere = (radius: number, azimuth: number, elevation: number): Vec3 => [
  radius * Math.cos(azimuth) * Math.cos(elevation),
  radius * Math.sin(elevation),
  radius * Math.sin(azimuth) * Math.cos(elevation),
];

const aimOrbit = (rig: OrbitRig, camera: number, distance: number): Aim => {
  const azimuth = distance * 0.1;
  const breathing = 1 + 0.18 * Math.sin(distance * 0.045);
  let origin: Vec3;
  let upReference = WORLD_UP;

  if (rig.elevations) {
    const elevation = rig.elevations[camera] + 0.05 * Math.sin(distance * 0.031);
    origin = onSphere(rig.radius * breathing * (camera === SIDE ? 0.8 : 1), azimuth, elevation);
  } else if (camera === REVERSE) {
    const drift = distance * 0.013;
    const radius = rig.radius * breathing;
    origin = [
      radius * Math.cos(azimuth) * Math.cos(drift),
      radius * Math.sin(azimuth),
      radius * Math.cos(azimuth) * Math.sin(drift),
    ];
    upReference = [-Math.sin(azimuth) * Math.cos(drift), Math.cos(azimuth), -Math.sin(azimuth) * Math.sin(drift)];
  } else {
    const elevation = 0.1 + 0.3 * Math.sin(distance * 0.031);
    origin = onSphere(rig.radius * breathing * (camera === SIDE ? 0.72 : 1), azimuth, elevation);
  }

  let forward = normalize([-origin[0], rig.targetHeight - origin[1], -origin[2]]);
  if (camera === SIDE) {
    const sideways = normalize(cross(upReference, forward));
    forward = normalize(blend(forward, sideways, Math.cos(0.3), Math.sin(0.3)));
  }
  return { origin, forward, upReference };
};

const aimFlight = (sway: number, camera: number, distance: number): Aim => {
  const along = (distance / PATH_RADIUS) % TAU;
  const cosAlong = Math.cos(along);
  const sinAlong = Math.sin(along);
  const offsetSide = sway * (0.45 * Math.sin(distance * 0.19) + 0.25 * Math.sin(distance * 0.071 + 1.3));
  const offsetUp = sway * (0.22 * Math.sin(distance * 0.13 + 0.7) + 0.1 * Math.sin(distance * 0.31));
  const heading = camera === SIDE ? 1.25 : camera === REVERSE ? Math.PI : 0;
  const yaw = sway * (0.35 * Math.sin(distance * 0.09) + 0.15 * Math.sin(distance * 0.23)) + heading;
  const pitch = sway * (0.12 * Math.sin(distance * 0.07 + 2.0) - 0.04);
  const ahead = Math.cos(yaw) * Math.cos(pitch);
  const outward = Math.sin(yaw) * Math.cos(pitch);
  return {
    origin: [(PATH_RADIUS + offsetSide) * cosAlong, offsetUp, (PATH_RADIUS + offsetSide) * sinAlong],
    forward: normalize([-sinAlong * ahead + cosAlong * outward, Math.sin(pitch), cosAlong * ahead + sinAlong * outward]),
    upReference: WORLD_UP,
  };
};

export const poseCamera = (world: WorldSpec, camera: number, motion: Motion): CameraPose => {
  const aim = world.orbit
    ? aimOrbit(world.orbit, camera, motion.distance)
    : aimFlight(world.swayScale, camera, motion.distance);
  const right = normalize(cross(aim.upReference, aim.forward));
  const up = cross(aim.forward, right);
  const roll = 0.08 * Math.sin(motion.distance * 0.05) + motion.roll;
  const cosRoll = Math.cos(roll);
  const sinRoll = Math.sin(roll);
  return {
    origin: aim.origin,
    forward: aim.forward,
    right: blend(right, up, cosRoll, sinRoll),
    up: blend(up, right, cosRoll, -sinRoll),
  };
};
