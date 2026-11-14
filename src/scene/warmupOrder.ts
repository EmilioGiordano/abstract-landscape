import { TERRAIN_IDS, WORLDS } from '../config/catalog';
import type { PipelineSpec } from '../render/renderer';
import type { PresetLibrary } from '../state/presetLibrary';

const everyCombination = (): PipelineSpec[] =>
  WORLDS.flatMap((world, worldIndex) =>
    (world.usesTerrain ? TERRAIN_IDS : TERRAIN_IDS.slice(0, 1)).map((_, terrainIndex) => ({
      world: worldIndex,
      terrain: terrainIndex,
    })),
  );

const pipelineKey = (spec: PipelineSpec): string =>
  [spec.world, WORLDS[spec.world].usesTerrain ? spec.terrain : 0].join('/');

export const warmupOrder = (presets: PresetLibrary): PipelineSpec[] => {
  const fromPresets = presets.names.flatMap((name) => {
    const scene = presets.resolve(name);
    return scene ? [{ world: scene.world ?? 0, terrain: scene.terrain ?? 0 }] : [];
  });
  const seen = new Set<string>();
  return [...fromPresets, ...everyCombination()].filter((spec) => {
    const key = pipelineKey(spec);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
