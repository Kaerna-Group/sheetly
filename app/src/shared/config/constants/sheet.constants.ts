export const sheetNames = {
  ledger: 'Ledger',
  categories: 'Categories',
  summary: 'Summary',
  monthlyStats: 'MonthlyStats',
  categoryStats: 'CategoryStats',
  settings: 'Settings',
} as const;

export const ledgerHeaders = [
  'id',
  'date',
  'kind',
  'category',
  'amount',
  'signedAmount',
  'currency',
  'paymentMethod',
  'comment',
  'createdAt',
  'source',
  'syncStatus',
] as const;

export const categoryHeaders = ['id', 'name', 'kind', 'color', 'icon', 'isDefault'] as const;

export const settingsHeaders = ['key', 'value'] as const;

export const templateVersion = '1';

export const requiredSheetNames = [
  sheetNames.ledger,
  sheetNames.categories,
  sheetNames.summary,
  sheetNames.monthlyStats,
  sheetNames.categoryStats,
  sheetNames.settings,
] as const;

export const sheetRanges = {
  categories: `${sheetNames.categories}!A:F`,
  categoriesData: `${sheetNames.categories}!A2:F`,
  categoriesHeaders: `${sheetNames.categories}!A1:F1`,
  ledger: `${sheetNames.ledger}!A:L`,
  ledgerData: `${sheetNames.ledger}!A2:L`,
  ledgerHeaders: `${sheetNames.ledger}!A1:L1`,
  settingsHeaders: `${sheetNames.settings}!A1:B1`,
  settingsTemplateVersion: `${sheetNames.settings}!A2:B2`,
} as const;
