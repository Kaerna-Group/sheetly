import type { CurrencyCode } from '@entities/app-settings';

export function generateContainerId(name: string, currency: CurrencyCode) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}0-9]+/gu, '-')
    .replace(/^-+|-+$/g, '');

  return `${slug || 'container'}-${currency.toLowerCase()}`;
}
