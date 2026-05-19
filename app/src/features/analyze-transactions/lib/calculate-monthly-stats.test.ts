import { describe, expect, it } from 'vitest';

import type { Transaction } from '@entities/transaction';

import { calculateMonthlyStats } from './calculate-monthly-stats';

function createTransaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'tx',
    amount: 0,
    categoryId: 'category',
    categoryName: 'Category',
    createdAt: '2026-05-19T10:00:00.000Z',
    currency: 'UAH',
    date: '2026-05-19',
    kind: 'expense',
    signedAmount: 0,
    source: 'google-sheets',
    syncStatus: 'synced',
    ...overrides,
  };
}

describe('calculateMonthlyStats', () => {
  it('groups income and expense by month', () => {
    expect(
      calculateMonthlyStats([
        createTransaction({
          amount: 1000,
          date: '2026-05-01',
          id: 'income-may',
          kind: 'income',
          signedAmount: 1000,
        }),
        createTransaction({
          amount: 250,
          date: '2026-05-02',
          id: 'expense-may',
          kind: 'expense',
          signedAmount: -250,
        }),
        createTransaction({
          amount: 100,
          date: '2026-06-01',
          id: 'expense-jun',
          kind: 'expense',
          signedAmount: -100,
        }),
      ]),
    ).toEqual([
      {
        balance: 750,
        expense: 250,
        income: 1000,
        label: 'May 2026',
        month: '2026-05',
      },
      {
        balance: -100,
        expense: 100,
        income: 0,
        label: 'Jun 2026',
        month: '2026-06',
      },
    ]);
  });

  it('returns empty stats for empty transactions', () => {
    expect(calculateMonthlyStats([])).toEqual([]);
  });
});
