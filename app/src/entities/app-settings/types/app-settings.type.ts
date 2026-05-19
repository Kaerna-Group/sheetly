import type { CurrencyCode } from './currency-code.type';
import type { ThemeMode } from './theme-mode.type';

export type AppLanguage = 'ru' | 'uk' | 'en';

export type AppSettings = {
  containersEnabled: boolean;
  spreadsheetId?: string;
  defaultCurrency: CurrencyCode;
  lastSelectedContainerId?: string;
  theme: ThemeMode;
  language: AppLanguage;
};
