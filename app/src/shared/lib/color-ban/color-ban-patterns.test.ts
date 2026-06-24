/* eslint-disable color-ban/no-hardcoded-colors */
import { describe, expect, it } from 'vitest';

// Mirrors the patterns in app/eslint.config.js colorBanPlugin.
// Keeping them here provides a regression-test spec: if someone edits the rule,
// the test fails and forces a conscious decision about what's allowed.
const BANNED: RegExp[] = [
  /\bbg-white\b/,
  /\bbg-zinc-\d+/,
  /\bbg-slate-\d+/,
  /\btext-zinc-\d+/,
  /\btext-red-\d+/,
  /\btext-green-\d+/,
  /\btext-indigo-\d+/,
  /\bborder-zinc-\d+/,
  /\bring-red-\d+/,
  /\bring-indigo-\d+/,
  /\bhover:bg-zinc-\d+/,
];

function findBanned(value: string): string | null {
  for (const re of BANNED) {
    const match = re.exec(value);
    if (match) return match[0];
  }
  return null;
}

describe('color-ban patterns — must catch banned Tailwind utilities', () => {
  const bannedCases: [string, string][] = [
    ['bg-white', 'bg-white'],
    ['bg-zinc-100', 'bg-zinc-100'],
    ['bg-zinc-900', 'bg-zinc-900'],
    ['bg-slate-800', 'bg-slate-800'],
    ['text-zinc-500', 'text-zinc-500'],
    ['text-red-500', 'text-red-500'],
    ['text-green-500', 'text-green-500'],
    ['text-indigo-600', 'text-indigo-600'],
    ['border-zinc-200', 'border-zinc-200'],
    ['ring-red-500', 'ring-red-500'],
    ['ring-indigo-200', 'ring-indigo-200'],
    // hover: prefix doesn't escape the check — bg-zinc-\d+ catches it first via \b after ':'
    ['hover:bg-zinc-100', 'bg-zinc-100'],
    ['embedded in a template className="bg-zinc-50 px-3"', 'bg-zinc-50'],
    ['multiple classes "text-red-600 font-bold"', 'text-red-600'],
  ];

  it.each(bannedCases)('catches "%s"', (input, expected) => {
    expect(findBanned(input)).toBe(expected);
  });
});

describe('color-ban patterns — must allow semantic tokens', () => {
  const allowedCases = [
    'bg-surface',
    'bg-surface-hover',
    'bg-surface-muted',
    'bg-surface-strong',
    'bg-app-bg',
    'bg-brand',
    'bg-brand-soft',
    'bg-danger',
    'bg-danger-soft',
    'bg-success-soft',
    'bg-warning-soft',
    'text-text',
    'text-text-soft',
    'text-text-muted',
    'text-text-inverted',
    'text-brand',
    'text-danger',
    'text-success',
    'text-warning',
    'border-border',
    'border-border-strong',
    'ring-brand-ring',
    'ring-danger-soft',
    'hover:bg-surface-hover',
    'hover:text-text',
    // partial words that contain banned substrings but are NOT banned
    'bg-zinc', // no digit suffix
    'text-reds', // not text-red-<digit>
    'bg-whites-soft', // bg-white is only the exact token
  ];

  it.each(allowedCases)('allows "%s"', (input) => {
    expect(findBanned(input)).toBeNull();
  });
});
