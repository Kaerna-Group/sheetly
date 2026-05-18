import type { CurrencyCode } from './currency-code.type';
import type { ThemeMode } from './theme-mode.type';

export type AppLanguage = 'ru' | 'uk' | 'en';

export type AppSettings = {
  spreadsheetId?: string;
  defaultCurrency: CurrencyCode;
  theme: ThemeMode;
  language: AppLanguage;
};
