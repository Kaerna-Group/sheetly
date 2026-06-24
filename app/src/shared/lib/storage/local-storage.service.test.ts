import { afterEach, describe, expect, it } from 'vitest';

import { localStorageService } from './local-storage.service';

afterEach(() => {
  localStorage.clear();
});

describe('localStorageService.get', () => {
  it('returns null for a key that has never been set', () => {
    expect(localStorageService.get('theme')).toBeNull();
  });

  it('returns the stored string value', () => {
    localStorage.setItem('theme', 'dark');
    expect(localStorageService.get('theme')).toBe('dark');
  });
});

describe('localStorageService.set', () => {
  it('persists the value so get returns it', () => {
    localStorageService.set('theme', 'light');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('overwrites an existing value', () => {
    localStorageService.set('theme', 'dark');
    localStorageService.set('theme', 'system');
    expect(localStorage.getItem('theme')).toBe('system');
  });
});

describe('localStorageService.remove', () => {
  it('deletes a previously stored key', () => {
    localStorageService.set('theme', 'dark');
    localStorageService.remove('theme');
    expect(localStorage.getItem('theme')).toBeNull();
  });

  it('is a no-op for a key that does not exist', () => {
    expect(() => localStorageService.remove('theme')).not.toThrow();
  });
});

describe('localStorageService.exportKnownKeys', () => {
  it('returns null for all keys when storage is empty', () => {
    const snapshot = localStorageService.exportKnownKeys();
    expect(Object.values(snapshot).every((v) => v === null)).toBe(true);
  });

  it('includes the stored value for each set key', () => {
    localStorageService.set('theme', 'dark');
    localStorageService.set('currency', 'USD');
    const snapshot = localStorageService.exportKnownKeys();
    expect(snapshot.theme).toBe('dark');
    expect(snapshot.currency).toBe('USD');
    expect(snapshot.language).toBeNull();
  });

  it('does not include unknown/external keys', () => {
    localStorage.setItem('someRandomKey', 'value');
    const snapshot = localStorageService.exportKnownKeys();
    expect(Object.keys(snapshot)).not.toContain('someRandomKey');
  });
});

describe('localStorageService.importKnownKeys', () => {
  it('writes provided keys to storage', () => {
    localStorageService.importKnownKeys({ theme: 'light', currency: 'EUR' });
    expect(localStorage.getItem('theme')).toBe('light');
    expect(localStorage.getItem('currency')).toBe('EUR');
  });

  it('skips keys with null values', () => {
    localStorage.setItem('theme', 'dark');
    localStorageService.importKnownKeys({ theme: null });
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('skips keys with undefined values', () => {
    localStorage.setItem('theme', 'dark');
    localStorageService.importKnownKeys({ language: undefined });
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('only imports known keys — unknown keys are ignored', () => {
    localStorageService.importKnownKeys({ theme: 'dark' } as never);
    expect(localStorage.getItem('rogue')).toBeNull();
  });
});

describe('localStorageService.clearKnownKeys', () => {
  it('removes all known keys', () => {
    localStorageService.set('theme', 'dark');
    localStorageService.set('currency', 'USD');
    localStorageService.set('spreadsheetId', 'abc123');

    localStorageService.clearKnownKeys();

    expect(localStorage.getItem('theme')).toBeNull();
    expect(localStorage.getItem('currency')).toBeNull();
    expect(localStorage.getItem('spreadsheetId')).toBeNull();
  });

  it('does not remove unknown keys', () => {
    localStorage.setItem('externalKey', 'should-survive');
    localStorageService.clearKnownKeys();
    expect(localStorage.getItem('externalKey')).toBe('should-survive');
  });
});
