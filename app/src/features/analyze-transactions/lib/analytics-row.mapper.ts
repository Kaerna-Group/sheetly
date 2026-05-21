import type { TransactionKind } from '@entities/transaction';

import type { CategoryStats, MonthlyStats } from '../types/analytics-stat.types';

function parseAmount(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsedValue = Number(value.replace(/\s/g, '').replace(',', '.'));

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function formatMonthLabel(month: string) {
  const [year, monthIndex] = month.split('-').map(Number);

  if (!year || !monthIndex) {
    return month;
  }

  return new Date(year, monthIndex - 1).toLocaleString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

function isTransactionKind(value: string | undefined): value is TransactionKind {
  return value === 'income' || value === 'expense';
}

export function mapRowToMonthlyStats(row: string[]): MonthlyStats | null {
  const [month, incomeValue, expenseValue, balanceValue] = row;
  const income = parseAmount(incomeValue);
  const expense = parseAmount(expenseValue);
  const balance = parseAmount(balanceValue);

  if (!month || income === null || expense === null || balance === null) {
    return null;
  }

  return {
    balance,
    expense,
    income,
    label: formatMonthLabel(month),
    month,
  };
}

export function mapRowToCategoryStats(row: string[]): CategoryStats | null {
  const [categoryName, kind, totalValue, countValue] = row;
  const total = parseAmount(totalValue);
  const count = parseAmount(countValue);

  if (!categoryName || !isTransactionKind(kind) || total === null || count === null) {
    return null;
  }

  return {
    categoryName,
    count,
    expense: kind === 'expense' ? total : 0,
    income: kind === 'income' ? total : 0,
    kind,
    total,
  };
}
