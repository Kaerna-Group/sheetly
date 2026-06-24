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
        count: 2,
        currency: 'UAH',
        expense: 350,
        income: 0,
        kind: 'expense',
        total: 350,
      },
      {
        categoryName: 'Salary',
        count: 1,
        currency: 'UAH',
        expense: 0,
        income: 1000,
        kind: 'income',
        total: 1000,
      },
    ]);
  });

  it('groups by category and currency separately — never mixes currencies', () => {
    const result = calculateCategoryStats([
      createTransaction({
        amount: 100,
        categoryName: 'Food',
        currency: 'UAH',
        id: 'food-uah',
        kind: 'expense',
        signedAmount: -100,
      }),
      createTransaction({
        amount: 50,
        categoryName: 'Food',
        currency: 'USD',
        id: 'food-usd',
        kind: 'expense',
        signedAmount: -50,
      }),
    ]);

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ categoryName: 'Food', currency: 'UAH', expense: 100 }),
        expect.objectContaining({ categoryName: 'Food', currency: 'USD', expense: 50 }),
      ]),
    );
  });

  it('sums same-currency transactions in the same category', () => {
    expect(
      calculateCategoryStats([
        createTransaction({
          amount: 100,
          categoryName: 'Food',
          id: 'food-1',
          kind: 'expense',
          signedAmount: -100,
        }),
        createTransaction({
          amount: 50,
          categoryName: 'Food',
          id: 'food-2',
          kind: 'expense',
          signedAmount: -50,
        }),
      ]),
    ).toEqual([
      expect.objectContaining({ categoryName: 'Food', currency: 'UAH', expense: 150, count: 2 }),
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
