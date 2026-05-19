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
  it('calculates income, expense and balance', () => {
    expect(
      calculateTransactionSummary([
        createTransaction({
          amount: 1000,
          id: 'income',
          kind: 'income',
          signedAmount: 1000,
        }),
        createTransaction({
          amount: 250,
          id: 'expense',
          kind: 'expense',
          signedAmount: -250,
        }),
      ]),
    ).toEqual({
      balance: 750,
      expense: 250,
      income: 1000,
    });
  });
});
