import type { Transaction } from '@entities/transaction';

import type { CategoryStats, TopCategoryStats } from '../types/analytics-stat.types';

export function calculateCategoryStats(transactions: Transaction[]): CategoryStats[] {
  const statsByCategory = new Map<string, CategoryStats>();

  transactions.forEach((transaction) => {
    const currentStats =
      statsByCategory.get(transaction.categoryName) ??
      ({
        categoryName: transaction.categoryName,
        expense: 0,
        income: 0,
        total: 0,
      } satisfies CategoryStats);

    if (transaction.kind === 'income') {
      currentStats.income += transaction.amount;
    } else {
      currentStats.expense += transaction.amount;
    }

    currentStats.total += Math.abs(transaction.amount);
    statsByCategory.set(transaction.categoryName, currentStats);
  });

  return [...statsByCategory.values()].sort((left, right) =>
    left.categoryName.localeCompare(right.categoryName),
  );
}

export function calculateTopCategories(transactions: Transaction[], limit = 5): TopCategoryStats[] {
  return calculateCategoryStats(transactions)
    .filter((categoryStats) => categoryStats.expense > 0)
    .map((categoryStats) => ({
      categoryName: categoryStats.categoryName,
      total: categoryStats.expense,
    }))
    .sort((left, right) => right.total - left.total)
    .slice(0, limit);
}
