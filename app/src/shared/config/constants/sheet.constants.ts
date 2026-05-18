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
