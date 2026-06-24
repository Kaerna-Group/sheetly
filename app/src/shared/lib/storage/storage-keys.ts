export type LocalStorageKey =
  | 'spreadsheetId'
  | 'sheetName'
  | 'currency'
  | 'theme'
  | 'language'
  | 'lastSelectedCategory'
  | 'lastSelectedExpenseCategoryId'
  | 'lastSelectedExpenseCategoryName'
  | 'lastSelectedIncomeCategoryId'
  | 'lastSelectedIncomeCategoryName'
  | 'containersEnabled'
  | 'lastPaymentMethod'
  | 'lastTransactionDate'
  | 'lastSelectedContainerId'
  | 'templateReadyAt'
  | 'templateReadySpreadsheetId'
  | 'templateReadyVersion'
  | 'analyticsActiveCurrency'
  | 'analyticsChartSlots'
  | 'analyticsWideChartId'
  | 'googleAuthEverConnected';

export const localStorageKeys: LocalStorageKey[] = [
  'spreadsheetId',
  'sheetName',
  'currency',
  'theme',
  'language',
  'lastSelectedCategory',
  'lastSelectedExpenseCategoryId',
  'lastSelectedExpenseCategoryName',
  'lastSelectedIncomeCategoryId',
  'lastSelectedIncomeCategoryName',
  'containersEnabled',
  'lastPaymentMethod',
  'lastTransactionDate',
  'lastSelectedContainerId',
  'templateReadyAt',
  'templateReadySpreadsheetId',
  'templateReadyVersion',
  'analyticsActiveCurrency',
  'analyticsChartSlots',
  'analyticsWideChartId',
  'googleAuthEverConnected',
];
