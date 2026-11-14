import {
  CAMERA_LABELS,
  PALETTE_LABELS,
  STYLE_LABELS,
  SYMMETRY_LABELS,
  TERRAIN_LABELS,
  UI,
  WORLD_LABELS,
} from '../config/labels';
import { WORLDS } from '../config/catalog';
import type { Settings } from '../config/params';

export const describeScene = (settings: Settings, presetName: string): string => {
  const parts: string[] = [WORLD_LABELS[settings.world]];
  if (settings.terrain > 0 && WORLDS[settings.world].usesTerrain) parts.push(TERRAIN_LABELS[settings.terrain]);
  parts.push(STYLE_LABELS[settings.style], PALETTE_LABELS[settings.palette]);
  if (settings.symmetry > 0) parts.push(SYMMETRY_LABELS[settings.symmetry]);
  if (settings.camera > 0) parts.push(CAMERA_LABELS[settings.camera]);
  if (settings.storm > 0) parts.push(UI.stormTag);
  const summary = parts.join(' · ');
  return presetName ? `${presetName} — ${summary}` : summary;
};
