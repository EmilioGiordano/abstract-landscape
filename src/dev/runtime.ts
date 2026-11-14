export interface RuntimeOptions {
  persistent: boolean;
  interfaceVisible: boolean;
  still: boolean;
  benchmark: boolean;
  exportFrame: boolean;
  forceLightning: boolean;
  prepass: boolean;
  startSeconds: number;
  presetIndex: number | null;
}

const flag = (query: URLSearchParams, name: string): boolean => query.get(name) === '1';

export const readRuntimeOptions = (query: URLSearchParams): RuntimeOptions => ({
  persistent: !flag(query, 'fresh'),
  interfaceVisible: query.get('ui') !== '0',
  still: flag(query, 'still'),
  benchmark: flag(query, 'bench'),
  exportFrame: flag(query, 'dump'),
  forceLightning: flag(query, 'flash'),
  prepass: query.get('prepass') !== '0',
  startSeconds: Number(query.get('t')) || 0,
  presetIndex: query.has('preset') ? Number(query.get('preset')) : null,
});
