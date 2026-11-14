import { PARAM_KEYS, defaultSettings, sanitize, type ParamKey, type Settings } from '../config/params';
import type { Store } from './storage';

const STORAGE_KEY = 'settings';

export const applyQueryOverrides = (settings: Settings, query: URLSearchParams): void => {
  for (const key of PARAM_KEYS) {
    const raw = query.get(key);
    if (raw !== null && raw !== '') settings[key] = sanitize(key, Number(raw));
  }
};

export const loadSettings = (store: Store, query: URLSearchParams): Settings => {
  const settings = defaultSettings();
  const saved = store.read<Partial<Record<ParamKey, unknown>>>(STORAGE_KEY, {});
  for (const key of PARAM_KEYS) {
    const value = saved[key];
    if (typeof value === 'number') settings[key] = sanitize(key, value);
  }
  applyQueryOverrides(settings, query);
  return settings;
};

export const saveSettings = (store: Store, settings: Settings): void => store.write(STORAGE_KEY, settings);
