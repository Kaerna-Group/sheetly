import type { Currency } from '@entities/currency';

export function getEnabledCurrencies(currencies: Currency[]): Currency[] {
  return currencies.filter((currency) => currency.isEnabled);
}

export function formatCurrencyLabel(currency: Pick<Currency, 'code' | 'symbol'>): string {
  const symbol = currency.symbol.trim();

  return symbol && symbol !== currency.code ? `${currency.code} ${symbol}` : currency.code;
}
