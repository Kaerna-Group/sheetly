import { describe, expect, it } from 'vitest';

import type { Transaction } from '@entities/transaction';

import {
  createDefaultTransactionFilters,
  filterTransactions,
  getTransactionCategoryOptions,
} from './transaction-filters';

function createTransaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'tx',
    amount: 100,
    categoryId: 'food',
    categoryName: 'Food',
    createdAt: '2026-05-19T10:00:00.000Z',
    currency: 'UAH',
    date: '2026-05-19',
    kind: 'expense',
    signedAmount: -100,
    source: 'google-sheets',
    syncStatus: 'synced',
    ...overrides,
  };
}

const transactions = [
  createTransaction({
    categoryName: 'Food',
    comment: 'Lunch',
    date: '2026-05-10',
    id: 'food',
    paymentMethod: 'Card',
  }),
  createTransaction({
    amount: 500,
    categoryName: 'Salary',
    date: '2026-05-15',
    id: 'salary',
    kind: 'income',
    paymentMethod: 'Bank',
    signedAmount: 500,
  }),
  createTransaction({
    categoryName: 'Transport',
    comment: 'Taxi',
    date: '2026-05-20',
    id: 'transport',
    paymentMethod: 'Cash',
  }),
];

describe('filterTransactions', () => {
  it('filters by date range', () => {
    expect(
      filterTransactions(transactions, {
        ...createDefaultTransactionFilters(),
        dateFrom: '2026-05-12',
        dateTo: '2026-05-20',
      }).map((transaction) => transaction.id),
    ).toEqual(['salary', 'transport']);
  });

  it('filters by kind', () => {
    expect(
      filterTransactions(transactions, {
        ...createDefaultTransactionFilters(),
        kind: 'income',
      }).map((transaction) => transaction.id),
    ).toEqual(['salary']);
  });

  it('filters by category', () => {
    expect(
      filterTransactions(transactions, {
        ...createDefaultTransactionFilters(),
        category: 'Transport',
      }).map((transaction) => transaction.id),
    ).toEqual(['transport']);
  });

  it('searches by comment, payment method and category', () => {
    expect(
      filterTransactions(transactions, {
        ...createDefaultTransactionFilters(),
        query: 'cash',
      }).map((transaction) => transaction.id),
    ).toEqual(['transport']);

    expect(
      filterTransactions(transactions, {
        ...createDefaultTransactionFilters(),
        query: 'lunch',
      }).map((transaction) => transaction.id),
    ).toEqual(['food']);

    expect(
      filterTransactions(transactions, {
        ...createDefaultTransactionFilters(),
        query: 'salary',
      }).map((transaction) => transaction.id),
    ).toEqual(['salary']);
  });

  it('combines filters', () => {
    expect(
      filterTransactions(transactions, {
        ...createDefaultTransactionFilters(),
        dateFrom: '2026-05-12',
        kind: 'expense',
        query: 'cash',
      }).map((transaction) => transaction.id),
    ).toEqual(['transport']);
  });
});

describe('getTransactionCategoryOptions', () => {
  it('dedupes and sorts categories', () => {
    expect(
      getTransactionCategoryOptions([
        ...transactions,
        createTransaction({
          categoryName: 'Food',
          id: 'food-2',
        }),
      ]),
    ).toEqual(['Food', 'Salary', 'Transport']);
  });
});
