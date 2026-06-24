import { describe, expect, it } from 'vitest';

import type { Currency } from '@entities/currency';

import { formatCurrencyLabel, getEnabledCurrencies } from './currency-options';

function makeCurrency(overrides: Partial<Currency>): Currency {
  return {
    id: 'usd',
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimalDigits: 2,
    isDefault: false,
    isEnabled: true,
    ...overrides,
  };
}

describe('getEnabledCurrencies', () => {
  it('keeps only enabled currencies', () => {
    const currencies = [
      makeCurrency({ id: 'usd', code: 'USD', isEnabled: true }),
      makeCurrency({ id: 'rub', code: 'RUB', isEnabled: false }),
    ];

    expect(getEnabledCurrencies(currencies).map((currency) => currency.code)).toEqual(['USD']);
  });
});

describe('formatCurrencyLabel', () => {
  it('shows code and symbol', () => {
    expect(formatCurrencyLabel({ code: 'UAH', symbol: '₴' })).toBe('UAH ₴');
  });

  it('shows code only when symbol duplicates or is empty', () => {
    expect(formatCurrencyLabel({ code: 'CHF', symbol: 'CHF' })).toBe('CHF');
    expect(formatCurrencyLabel({ code: 'XXX', symbol: '' })).toBe('XXX');
  });
});
