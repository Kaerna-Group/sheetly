import type { CurrencyId } from './currency-id.type';

export type Currency = {
  id: CurrencyId;
  code: string;
  name: string;
  symbol: string;
  decimalDigits: number;
  isDefault: boolean;
  isEnabled: boolean;
};
