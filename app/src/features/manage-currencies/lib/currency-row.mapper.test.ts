import { describe, expect, it } from 'vitest';

import type { Currency } from '@entities/currency';

import { mapCurrencyToRow, mapRowToCurrency } from './currency-row.mapper';

const currency: Currency = {
  id: 'uah',
  code: 'UAH',
  name: 'Ukrainian Hryvnia',
  symbol: '₴',
  decimalDigits: 2,
  isDefault: true,
  isEnabled: true,
};

describe('currency row mapper', () => {
  it('maps currency to Google Sheets row', () => {
    expect(mapCurrencyToRow(currency)).toEqual([
      'uah',
      'UAH',
      'Ukrainian Hryvnia',
      '₴',
      '2',
      'TRUE',
      'TRUE',
    ]);
  });

  it('maps row to currency', () => {
    expect(mapRowToCurrency(['uah', 'UAH', 'Ukrainian Hryvnia', '₴', '2', 'TRUE', 'TRUE'])).toEqual(
      currency,
    );
  });

  it('parses lowercase booleans and uppercases the code', () => {
    expect(mapRowToCurrency(['eur', 'eur', 'Euro', '€', '2', 'true', 'false'])).toEqual({
      id: 'eur',
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      decimalDigits: 2,
      isDefault: true,
      isEnabled: false,
    });
  });

  it('treats blank flags as not default but enabled so hand-added rows show up', () => {
    expect(mapRowToCurrency(['gbp', 'GBP', 'British Pound', '£', '', '', ''])).toEqual({
      id: 'gbp',
      code: 'GBP',
      name: 'British Pound',
      symbol: '£',
      decimalDigits: 2,
      isDefault: false,
      isEnabled: true,
    });
  });

  it('falls back to code for missing name and symbol', () => {
    expect(mapRowToCurrency(['czk', 'czk', '', '', 'x', 'FALSE', 'TRUE'])).toEqual({
      id: 'czk',
      code: 'CZK',
      name: 'CZK',
      symbol: 'CZK',
      decimalDigits: 2,
      isDefault: false,
      isEnabled: true,
    });
  });

  it('returns null for rows without an id or code', () => {
    expect(mapRowToCurrency(['', 'UAH'])).toBeNull();
    expect(mapRowToCurrency(['uah', ''])).toBeNull();
  });
});
