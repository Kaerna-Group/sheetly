import type { Currency } from '../types/currency.type';

/**
 * Seed list used only to initialize the `Currencies` sheet and as an offline
 * fallback when Google Sheets is unavailable. The sheet remains the source of
 * truth: new currencies can be added there without touching this list.
 */
export function getDefaultCurrencies(): Currency[] {
  return [
    {
      id: 'uah',
      code: 'UAH',
      name: 'Ukrainian Hryvnia',
      symbol: '₴',
      decimalDigits: 2,
      isDefault: true,
      isEnabled: true,
    },
    {
      id: 'usd',
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      decimalDigits: 2,
      isDefault: true,
      isEnabled: true,
    },
    {
      id: 'eur',
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      decimalDigits: 2,
      isDefault: true,
      isEnabled: true,
    },
    {
      id: 'rub',
      code: 'RUB',
      name: 'Russian Ruble',
      symbol: '₽',
      decimalDigits: 2,
      isDefault: true,
      isEnabled: true,
    },
    {
      id: 'pln',
      code: 'PLN',
      name: 'Polish Zloty',
      symbol: 'zł',
      decimalDigits: 2,
      isDefault: true,
      isEnabled: true,
    },
    {
      id: 'gbp',
      code: 'GBP',
      name: 'British Pound',
      symbol: '£',
      decimalDigits: 2,
      isDefault: true,
      isEnabled: true,
    },
    {
      id: 'chf',
      code: 'CHF',
      name: 'Swiss Franc',
      symbol: 'CHF',
      decimalDigits: 2,
      isDefault: true,
      isEnabled: true,
    },
    {
      id: 'cad',
      code: 'CAD',
      name: 'Canadian Dollar',
      symbol: 'C$',
      decimalDigits: 2,
      isDefault: true,
      isEnabled: true,
    },
    {
      id: 'try',
      code: 'TRY',
      name: 'Turkish Lira',
      symbol: '₺',
      decimalDigits: 2,
      isDefault: true,
      isEnabled: true,
    },
    {
      id: 'jpy',
      code: 'JPY',
      name: 'Japanese Yen',
      symbol: '¥',
      decimalDigits: 0,
      isDefault: true,
      isEnabled: true,
    },
  ];
}
