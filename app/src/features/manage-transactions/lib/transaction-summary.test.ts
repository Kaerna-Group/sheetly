import { describe, expect, it } from 'vitest';

import type { Transaction } from '@entities/transaction';

import { calculateTransactionSummary } from './transaction-summary';

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

describe('calculateTransactionSummary', () => {
  it('returns empty array for no transactions', () => {
    expect(calculateTransactionSummary([])).toEqual([]);
  });

  it('calculates income, expense and balance within one currency', () => {
    expect(
      calculateTransactionSummary([
        createTransaction({ amount: 1000, id: 'income', kind: 'income', signedAmount: 1000 }),
        createTransaction({ amount: 250, id: 'expense', kind: 'expense', signedAmount: -250 }),
      ]),
    ).toEqual([{ currency: 'UAH', income: 1000, expense: 250, balance: 750 }]);
  });

  it('groups amounts by currency and never mixes them', () => {
    const result = calculateTransactionSummary([
      createTransaction({
        amount: 1000,
        id: 'uah-income',
        kind: 'income',
        signedAmount: 1000,
        currency: 'UAH',
      }),
      createTransaction({
        amount: 300,
        id: 'usd-income',
        kind: 'income',
        signedAmount: 300,
        currency: 'USD',
      }),
      createTransaction({
        amount: 250,
        id: 'uah-expense',
        kind: 'expense',
        signedAmount: -250,
        currency: 'UAH',
      }),
      createTransaction({
        amount: 100,
        id: 'usd-expense',
        kind: 'expense',
        signedAmount: -100,
        currency: 'USD',
      }),
    ]);

    expect(result).toEqual(
      expect.arrayContaining([
        { currency: 'UAH', income: 1000, expense: 250, balance: 750 },
        { currency: 'USD', income: 300, expense: 100, balance: 200 },
      ]),
    );
    expect(result).toHaveLength(2);
  });

  it('preserves insertion order of first appearance', () => {
    const result = calculateTransactionSummary([
      createTransaction({ currency: 'EUR', id: 'eur' }),
      createTransaction({ currency: 'UAH', id: 'uah' }),
    ]);

    expect(result.map((entry) => entry.currency)).toEqual(['EUR', 'UAH']);
  });
});
