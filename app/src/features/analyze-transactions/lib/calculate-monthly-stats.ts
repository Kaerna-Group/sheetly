import type { Transaction } from '@entities/transaction';

import type { MonthlyStats } from '../types/analytics-stat.types';

function formatMonthLabel(month: string) {
  const [year, monthIndex] = month.split('-').map(Number);
  const date = new Date(year, monthIndex - 1);

  return date.toLocaleString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

export function calculateMonthlyStats(transactions: Transaction[]): MonthlyStats[] {
  const statsByKey = new Map<string, MonthlyStats>();

  transactions.forEach((transaction) => {
    const month = transaction.date.slice(0, 7);
    const { currency } = transaction;
    const key = `${month}:${currency}`;
    const currentStats =
      statsByKey.get(key) ??
      ({
        balance: 0,
        currency,
        expense: 0,
        income: 0,
        label: formatMonthLabel(month),
        month,
      } satisfies MonthlyStats);

    if (transaction.kind === 'income') {
      currentStats.income += transaction.amount;
    } else {
      currentStats.expense += transaction.amount;
    }

    currentStats.balance += transaction.signedAmount;
    statsByKey.set(key, currentStats);
  });

  return [...statsByKey.values()].sort((left, right) =>
    left.month === right.month
      ? left.currency.localeCompare(right.currency)
      : left.month.localeCompare(right.month),
  );
}
