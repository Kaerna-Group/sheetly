export const sheetNames = {
  ledger: 'Ledger',
  categories: 'Categories',
  containers: 'Containers',
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
  'updatedAt',
  'deletedAt',
  'containerId',
  'containerName',
] as const;

export const categoryHeaders = ['id', 'name', 'kind', 'color', 'icon', 'isDefault'] as const;

export const containerHeaders = [
  'id',
  'name',
  'currency',
  'color',
  'icon',
  'isDefault',
  'createdAt',
] as const;

export const summaryHeaders = ['metric', 'value'] as const;

export const monthlyStatsHeaders = ['month', 'income', 'expense', 'balance'] as const;

export const categoryStatsHeaders = ['category', 'kind', 'total', 'count'] as const;

export const settingsHeaders = ['key', 'value'] as const;

export const templateVersion = '2';

export const requiredSheetNames = [
  sheetNames.ledger,
  sheetNames.categories,
  sheetNames.containers,
  sheetNames.summary,
  sheetNames.monthlyStats,
  sheetNames.categoryStats,
  sheetNames.settings,
] as const;

export const sheetRanges = {
  categories: `${sheetNames.categories}!A:F`,
  categoriesData: `${sheetNames.categories}!A2:F`,
  categoriesHeaders: `${sheetNames.categories}!A1:F1`,
  containers: `${sheetNames.containers}!A:G`,
  containersData: `${sheetNames.containers}!A2:G`,
  containersHeaders: `${sheetNames.containers}!A1:G1`,
  ledger: `${sheetNames.ledger}!A:P`,
  ledgerData: `${sheetNames.ledger}!A2:P`,
  ledgerHeaders: `${sheetNames.ledger}!A1:P1`,
  categoryStatsHeaders: `${sheetNames.categoryStats}!A1:D1`,
  monthlyStatsHeaders: `${sheetNames.monthlyStats}!A1:D1`,
  summary: `${sheetNames.summary}!A:B`,
  settingsHeaders: `${sheetNames.settings}!A1:B1`,
  settingsTemplateVersion: `${sheetNames.settings}!A2:B2`,
} as const;
