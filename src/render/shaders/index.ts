import type { TerrainId, WorldId } from '../../config/catalog';
import common from './chunks/common.glsl?raw';
import displaced from './chunks/displaced.glsl?raw';
import prepassMain from './chunks/prepass-main.glsl?raw';
import sceneMain from './chunks/scene-main.glsl?raw';
import sceneUniforms from './chunks/scene-uniforms.glsl?raw';
import compositeFragment from './composite.frag?raw';
import fullscreenVertex from './fullscreen.vert?raw';
import columns from './terrain/columns.glsl?raw';
import dunes from './terrain/dunes.glsl?raw';
import faceted from './terrain/faceted.glsl?raw';
import lumpy from './terrain/lumpy.glsl?raw';
import ridged from './terrain/ridged.glsl?raw';
import terraced from './terrain/terraced.glsl?raw';
import asteroid from './world/asteroid.glsl?raw';
import canyon from './world/canyon.glsl?raw';
import clouds from './world/clouds.glsl?raw';
import crystal from './world/crystal.glsl?raw';
import mandala from './world/mandala.glsl?raw';
import mountain from './world/mountain.glsl?raw';
import volcano from './world/volcano.glsl?raw';

const HEADER = '#version 300 es\nprecision highp float;';

const TERRAINS: Record<TerrainId, string> = { lumpy, ridged, faceted, terraced, columns, dunes };
const WORLDS: Record<WorldId, string> = { canyon, mandala, clouds, asteroid, crystal, mountain, volcano };

const geometry = (world: WorldId, terrain: TerrainId): string[] => [
  HEADER,
  sceneUniforms,
  common,
  TERRAINS[terrain],
  displaced,
  WORLDS[world],
];

export const sceneFragment = (world: WorldId, terrain: TerrainId): string =>
  [...geometry(world, terrain), sceneMain].join('\n');

export const prepassFragment = (world: WorldId, terrain: TerrainId): string =>
  [...geometry(world, terrain), prepassMain].join('\n');

export { compositeFragment, fullscreenVertex };
