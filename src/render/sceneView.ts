import { symmetryIndex } from '../config/catalog';

export interface SceneView {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

const MIRROR = symmetryIndex('mirror');
const QUAD = symmetryIndex('quad');
const SECTORS: Record<number, number> = {
  [symmetryIndex('kaleidoscope6')]: 6,
  [symmetryIndex('kaleidoscope10')]: 10,
};

export const sceneView = (symmetry: number, aspect: number, margin: number): SceneView => {
  if (symmetry === MIRROR) {
    return { originX: -margin, originY: -0.5, width: aspect / 2 + margin, height: 1 };
  }
  if (symmetry === QUAD) {
    return { originX: -margin, originY: -margin, width: aspect / 2 + margin, height: 0.5 + margin };
  }
  const sectors = SECTORS[symmetry];
  if (sectors) {
    const reach = 0.5 * Math.hypot(aspect, 1);
    return {
      originX: -margin,
      originY: -margin,
      width: reach + 2 * margin,
      height: reach * Math.tan(Math.PI / sectors) + 2 * margin,
    };
  }
  return { originX: -aspect / 2, originY: -0.5, width: aspect, height: 1 };
};
