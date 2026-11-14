import type { ParamKey } from './params';

export const WORLD_LABELS = ['Cañón', 'Mandala', 'Nubes', 'Astro', 'Cristal', 'Montaña', 'Volcán'] as const;
export const TERRAIN_LABELS = ['Grumoso', 'Crestas', 'Facetado', 'Bancales', 'Columnas', 'Dunas'] as const;
export const STYLE_LABELS = ['Contraluz', 'Noche', 'Arcilla', 'Topográfico', 'Aura'] as const;
export const PALETTE_LABELS = [
  'Sepia',
  'Mono',
  'Cianotipo',
  'Brasa',
  'Aurora',
  'Ultravioleta',
  'Oro',
  'Atardecer',
  'Musgo',
  'Tinta',
] as const;
export const SYMMETRY_LABELS = ['Ninguna', 'Espejo', 'Cuádruple', 'Caleidoscopio 6', 'Caleidoscopio 10'] as const;
export const CAMERA_LABELS = ['Frontal', 'Lateral', 'Inversa'] as const;
export const CYCLE_LABELS = ['Al azar', 'Presets'] as const;
export const QUALITY_LABELS = ['Eco', 'Equilibrado', 'Alto', 'Máximo'] as const;

export const PARAM_LABELS: Record<ParamKey, string> = {
  world: 'Mundo',
  terrain: 'Terreno',
  style: 'Estilo',
  palette: 'Paleta',
  symmetry: 'Simetría',
  camera: 'Cámara',
  storm: 'Tormenta',
  auto: 'Cambio min',
  cycle: 'Ciclo',
  speed: 'Velocidad',
  morph: 'Deformación',
  lens: 'Lente',
  roll: 'Giro',
  glow: 'Brillo',
  contrast: 'Contraste',
  terrace: 'Estratos',
  detail: 'Detalle',
  folds: 'Pliegues',
  tint: 'Color',
  iris: 'Iridiscencia',
  quality: 'Calidad',
  seed: 'Semilla',
};

export const UI = {
  groups: {
    preset: 'Preset',
    scene: 'Escena',
    motion: 'Movimiento',
    image: 'Imagen',
    system: 'Sistema',
  },
  presetChoose: 'Elegir',
  presetSave: 'Guardar',
  presetNamePlaceholder: 'nombre',
  presetSaveTitle: 'Guardar la escena actual como preset',
  presetDelete: 'Borrar este preset',
  presetCustom: 'Personalizado',
  presetBuiltIn: 'Incluidos',
  presetMine: 'Míos',
  presetDefaultName: 'Mío',
  presetOwnSuffix: '(mío)',
  presetSaved: 'Guardado',
  random: 'Al azar',
  reseed: 'Semilla',
  reset: 'Reset',
  keys: 'H panel · N al azar · ← → presets',
  hint: 'H · controles   N · al azar   ← → · presets',
  stormTag: 'Tormenta',
  unsupported: 'Este navegador no soporta WebGL2.',
  shaderError: 'Error de shader',
} as const;
