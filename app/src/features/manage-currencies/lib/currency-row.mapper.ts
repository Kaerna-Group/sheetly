import type { Currency } from '@entities/currency';

function parseSheetBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  return ['true', '1', 'yes'].includes(value.trim().toLowerCase());
}

function parseDecimalDigits(value: string | undefined): number {
  if (value === undefined || value.trim() === '') {
    return 2;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 2;
}

export function mapCurrencyToRow(currency: Currency): string[] {
  return [
    currency.id,
    currency.code,
    currency.name,
    currency.symbol,
    String(currency.decimalDigits),
    currency.isDefault ? 'TRUE' : 'FALSE',
    currency.isEnabled ? 'TRUE' : 'FALSE',
  ];
}

export function mapRowToCurrency(row: string[]): Currency | null {
  const [id, code, name, symbol, decimalDigits, isDefault, isEnabled] = row;

  if (!id || !code) {
    return null;
  }

  const normalizedCode = code.trim().toUpperCase();

  return {
    id: id.trim(),
    code: normalizedCode,
    name: name?.trim() || normalizedCode,
    symbol: symbol?.trim() || normalizedCode,
    decimalDigits: parseDecimalDigits(decimalDigits),
    isDefault: parseSheetBoolean(isDefault, false),
    isEnabled: parseSheetBoolean(isEnabled, true),
  };
}
