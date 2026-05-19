import { describe, expect, it } from 'vitest';

import type { Transaction } from '@entities/transaction';

import { calculateCategoryStats, calculateTopCategories } from './calculate-category-stats';

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

describe('calculateCategoryStats', () => {
  it('groups income and expense by category', () => {
    expect(
      calculateCategoryStats([
        createTransaction({
          amount: 200,
          categoryName: 'Food',
          id: 'food-1',
          kind: 'expense',
          signedAmount: -200,
        }),
        createTransaction({
          amount: 150,
          categoryName: 'Food',
          id: 'food-2',
          kind: 'expense',
          signedAmount: -150,
        }),
        createTransaction({
          amount: 1000,
          categoryName: 'Salary',
          id: 'salary',
          kind: 'income',
          signedAmount: 1000,
        }),
      ]),
    ).toEqual([
      {
        categoryName: 'Food',
        expense: 350,
        income: 0,
        total: 350,
      },
      {
        categoryName: 'Salary',
        expense: 0,
        income: 1000,
        total: 1000,
      },
    ]);
  });
});

describe('calculateTopCategories', () => {
  it('returns top expense categories sorted by amount', () => {
    expect(
      calculateTopCategories(
        [
          createTransaction({
            amount: 200,
            categoryName: 'Food',
            id: 'food',
            kind: 'expense',
            signedAmount: -200,
          }),
          createTransaction({
            amount: 350,
            categoryName: 'Transport',
            id: 'transport',
            kind: 'expense',
            signedAmount: -350,
          }),
          createTransaction({
            amount: 1000,
            categoryName: 'Salary',
            id: 'salary',
            kind: 'income',
            signedAmount: 1000,
          }),
        ],
        1,
      ),
    ).toEqual([
      {
        categoryName: 'Transport',
        total: 350,
      },
    ]);
  });

  it('returns empty top categories for empty transactions', () => {
    expect(calculateTopCategories([])).toEqual([]);
  });
});
