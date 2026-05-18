import type { LocalStorageKey } from './storage-keys';

function readStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

export const localStorageService = {
  get(key: LocalStorageKey) {
    return readStorage()?.getItem(key) ?? null;
  },
  set(key: LocalStorageKey, value: string) {
    readStorage()?.setItem(key, value);
  },
  remove(key: LocalStorageKey) {
    readStorage()?.removeItem(key);
  },
};
