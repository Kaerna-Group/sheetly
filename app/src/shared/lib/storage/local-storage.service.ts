import type { LocalStorageKey } from './storage-keys';
import { localStorageKeys } from './storage-keys';

function readStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

export const localStorageService = {
  clearKnownKeys() {
    const storage = readStorage();

    localStorageKeys.forEach((key) => storage?.removeItem(key));
  },
  get(key: LocalStorageKey) {
    return readStorage()?.getItem(key) ?? null;
  },
  exportKnownKeys() {
    const storage = readStorage();

    return Object.fromEntries(
      localStorageKeys.map((key) => [key, storage?.getItem(key) ?? null]),
    ) as Record<LocalStorageKey, string | null>;
  },
  importKnownKeys(values: Partial<Record<LocalStorageKey, string | null>>) {
    const storage = readStorage();

    localStorageKeys.forEach((key) => {
      const value = values[key];

      if (typeof value === 'string') {
        storage?.setItem(key, value);
      }
    });
  },
  set(key: LocalStorageKey, value: string) {
    readStorage()?.setItem(key, value);
  },
  remove(key: LocalStorageKey) {
    readStorage()?.removeItem(key);
  },
};
