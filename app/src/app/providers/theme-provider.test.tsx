import { render, renderHook, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getEffectiveTheme, ThemeProvider, useTheme } from './theme-provider';

function mockMatchMedia(dark: boolean) {
  const mq = {
    matches: dark,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mq));
  return mq;
}

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  vi.unstubAllGlobals();
});

// ── getEffectiveTheme ──────────────────────────────────────────────────────────

describe('getEffectiveTheme', () => {
  it("'dark' always resolves to 'dark'", () => {
    mockMatchMedia(false);
    expect(getEffectiveTheme('dark')).toBe('dark');
  });

  it("'light' always resolves to 'light'", () => {
    mockMatchMedia(true);
    expect(getEffectiveTheme('light')).toBe('light');
  });

  it("'system' resolves to 'dark' when OS prefers dark", () => {
    mockMatchMedia(true);
    expect(getEffectiveTheme('system')).toBe('dark');
  });

  it("'system' resolves to 'light' when OS prefers light", () => {
    mockMatchMedia(false);
    expect(getEffectiveTheme('system')).toBe('light');
  });
});

// ── ThemeProvider DOM integration ─────────────────────────────────────────────

describe('ThemeProvider', () => {
  it('sets data-theme on documentElement on mount', () => {
    mockMatchMedia(false);
    render(<ThemeProvider>child</ThemeProvider>);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('reads initial theme from localStorage', () => {
    localStorage.setItem('theme', 'dark');
    mockMatchMedia(false);
    render(<ThemeProvider>child</ThemeProvider>);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('falls back to system when localStorage is empty', () => {
    mockMatchMedia(true);
    render(<ThemeProvider>child</ThemeProvider>);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});

// ── useTheme hook ─────────────────────────────────────────────────────────────

describe('useTheme', () => {
  it('throws when used outside ThemeProvider', () => {
    expect(() => renderHook(() => useTheme())).toThrow(
      'useTheme must be used inside ThemeProvider',
    );
  });

  it('returns the current theme value', () => {
    localStorage.setItem('theme', 'light');
    mockMatchMedia(false);
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });
    expect(result.current.theme).toBe('light');
  });

  it('setTheme updates the theme state and persists to localStorage', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('setTheme updates data-theme attribute on documentElement', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    act(() => {
      result.current.setTheme('dark');
    });

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('switching to system registers a matchMedia listener', () => {
    localStorage.setItem('theme', 'light');
    const mq = mockMatchMedia(false);
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    act(() => {
      result.current.setTheme('system');
    });

    expect(mq.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
