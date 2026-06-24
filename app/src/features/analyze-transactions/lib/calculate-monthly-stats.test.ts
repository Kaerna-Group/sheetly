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
        currency: 'UAH',
        expense: 250,
        income: 1000,
        label: 'May 2026',
        month: '2026-05',
      },
      {
        balance: -100,
        currency: 'UAH',
        expense: 100,
        income: 0,
        label: 'Jun 2026',
        month: '2026-06',
      },
    ]);
  });

  it('groups by month and currency separately — never mixes currencies', () => {
    const result = calculateMonthlyStats([
      createTransaction({
        amount: 100,
        currency: 'UAH',
        date: '2026-05-01',
        id: 'uah-expense',
        kind: 'expense',
        signedAmount: -100,
      }),
      createTransaction({
        amount: 50,
        currency: 'USD',
        date: '2026-05-01',
        id: 'usd-expense',
        kind: 'expense',
        signedAmount: -50,
      }),
    ]);

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ month: '2026-05', currency: 'UAH', expense: 100, income: 0 }),
        expect.objectContaining({ month: '2026-05', currency: 'USD', expense: 50, income: 0 }),
      ]),
    );
  });

  it('sums same-currency transactions in the same month', () => {
    expect(
      calculateMonthlyStats([
        createTransaction({ amount: 100, id: 'uah-1', kind: 'expense', signedAmount: -100 }),
        createTransaction({ amount: 50, id: 'uah-2', kind: 'expense', signedAmount: -50 }),
      ]),
    ).toEqual([
      expect.objectContaining({ currency: 'UAH', expense: 150, income: 0, balance: -150 }),
    ]);
  });

  it('returns empty stats for empty transactions', () => {
    expect(calculateMonthlyStats([])).toEqual([]);
  });
});
