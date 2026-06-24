import type { TransactionKind } from '@entities/transaction';

export type MonthlyStats = {
  balance: number;
  currency: string;
  expense: number;
  income: number;
  label: string;
  month: string;
};

export type CategoryStats = {
  categoryName: string;
  count: number;
  currency: string;
  expense: number;
  income: number;
  kind: TransactionKind;
  total: number;
};

export type TopCategoryStats = {
  categoryName: string;
  total: number;
};

export type AnalyticsSource = 'google-sheets' | 'local';

export type ChartId =
  | 'monthly-cashflow'
  | 'balance-trend'
  | 'expense-categories'
  | 'category-bar'
  | 'income-expense-ratio'
  | 'daily-expenses';

export type AnalyticsStats = {
  categoryStats: CategoryStats[];
  monthlyStats: MonthlyStats[];
  source: AnalyticsSource;
};
