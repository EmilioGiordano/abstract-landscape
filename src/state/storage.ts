export interface Store {
  read<T>(key: string, fallback: T): T;
  write(key: string, value: unknown): void;
}

const NAMESPACE = 'abstract-wallpaper';

export const createStore = (persistent: boolean): Store => ({
  read<T>(key: string, fallback: T): T {
    if (!persistent) return fallback;
    try {
      const raw = localStorage.getItem(`${NAMESPACE}:${key}`);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  },
  write(key: string, value: unknown): void {
    if (!persistent) return;
    try {
      localStorage.setItem(`${NAMESPACE}:${key}`, JSON.stringify(value));
    } catch {
      return;
    }
  },
});
