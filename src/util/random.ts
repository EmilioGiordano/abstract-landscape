export const seededUnit = (seed: number, channel: number): number => {
  const x = Math.sin(seed * 127.1 + channel * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const centered = (range: number): number => (Math.random() - 0.5) * range;

export const randomInt = (min: number, max: number): number => min + Math.floor(Math.random() * (max - min + 1));

export const pickWeighted = (weights: readonly number[]): number => {
  let remaining = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
  for (let index = 0; index < weights.length; index++) {
    remaining -= weights[index];
    if (remaining < 0) return index;
  }
  return 0;
};
