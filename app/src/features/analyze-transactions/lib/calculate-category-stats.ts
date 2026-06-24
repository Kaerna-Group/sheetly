import type { Transaction } from '@entities/transaction';

import type { CategoryStats, TopCategoryStats } from '../types/analytics-stat.types';

export function calculateCategoryStats(transactions: Transaction[]): CategoryStats[] {
  const statsByKey = new Map<string, CategoryStats>();

  transactions.forEach((transaction) => {
    const { currency } = transaction;
    const statsKey = `${transaction.kind}:${transaction.categoryName}:${currency}`;
    const currentStats =
      statsByKey.get(statsKey) ??
      ({
        categoryName: transaction.categoryName,
        count: 0,
        currency,
        expense: 0,
        income: 0,
        kind: transaction.kind,
        total: 0,
      } satisfies CategoryStats);

    if (transaction.kind === 'income') {
      currentStats.income += transaction.amount;
    } else {
      currentStats.expense += transaction.amount;
    }

    currentStats.count += 1;
    currentStats.total += Math.abs(transaction.amount);
    statsByKey.set(statsKey, currentStats);
  });

  return [...statsByKey.values()].sort((left, right) =>
    left.categoryName === right.categoryName
      ? left.kind.localeCompare(right.kind)
      : left.categoryName.localeCompare(right.categoryName),
  );
}

export function calculateTopCategories(transactions: Transaction[], limit = 5): TopCategoryStats[] {
  return calculateCategoryStats(transactions)
    .filter((categoryStats) => categoryStats.kind === 'expense' && categoryStats.expense > 0)
    .map((categoryStats) => ({
      categoryName: categoryStats.categoryName,
      total: categoryStats.expense,
    }))
    .sort((left, right) => right.total - left.total)
    .slice(0, limit);
}
