export type Vec3 = [number, number, number];

export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

export const normalize = (a: Vec3): Vec3 => {
  const length = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / length, a[1] / length, a[2] / length];
};

export const blend = (a: Vec3, b: Vec3, weightA: number, weightB: number): Vec3 => [
  a[0] * weightA + b[0] * weightB,
  a[1] * weightA + b[1] * weightB,
  a[2] * weightA + b[2] * weightB,
];
