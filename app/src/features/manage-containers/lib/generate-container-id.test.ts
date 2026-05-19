import { describe, expect, it } from 'vitest';

import { generateContainerId } from './generate-container-id';

describe('generateContainerId', () => {
  it('generates currency-suffixed slugs', () => {
    expect(generateContainerId('Cash Wallet', 'UAH')).toBe('cash-wallet-uah');
  });

  it('supports Cyrillic names', () => {
    expect(generateContainerId('Готівка', 'UAH')).toBe('готівка-uah');
  });
});
