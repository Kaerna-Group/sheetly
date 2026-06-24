import { describe, expect, it } from 'vitest';

import type { Transaction } from '@entities/transaction';

import {
  createDefaultTransactionFilters,
  filterTransactions,
  getTransactionCategoryOptions,
  getTransactionCurrencyOptions,
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

  it('filters by amount range', () => {
    expect(
      filterTransactions(transactions, {
        ...createDefaultTransactionFilters(),
        amountFrom: '200',
        amountTo: '600',
      }).map((transaction) => transaction.id),
    ).toEqual(['salary']);
  });

  it('filters by sync status', () => {
    expect(
      filterTransactions(
        [
          ...transactions,
          createTransaction({
            id: 'pending',
            syncStatus: 'pending',
          }),
        ],
        {
          ...createDefaultTransactionFilters(),
          syncStatus: 'pending',
        },
      ).map((transaction) => transaction.id),
    ).toEqual(['pending']);
  });

  it('hides deleted transactions by default and shows them when enabled', () => {
    const deletedTransaction = createTransaction({
      deletedAt: '2026-05-20T10:00:00.000Z',
      id: 'deleted',
    });

    expect(
      filterTransactions([...transactions, deletedTransaction], createDefaultTransactionFilters())
        .map((transaction) => transaction.id)
        .includes('deleted'),
    ).toBe(false);
    expect(
      filterTransactions([...transactions, deletedTransaction], {
        ...createDefaultTransactionFilters(),
        showDeleted: true,
      })
        .map((transaction) => transaction.id)
        .includes('deleted'),
    ).toBe(true);
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

describe('filterTransactions currency filter', () => {
  const multiCurrencyTransactions = [
    createTransaction({ id: 'uah-1', currency: 'UAH' }),
    createTransaction({ id: 'usd-1', currency: 'USD' }),
    createTransaction({ id: 'eur-1', currency: 'EUR' }),
    createTransaction({ id: 'uah-2', currency: 'UAH' }),
  ];

  it('shows all currencies when filter is empty', () => {
    expect(
      filterTransactions(multiCurrencyTransactions, createDefaultTransactionFilters()).map(
        (transaction) => transaction.id,
      ),
    ).toEqual(['uah-1', 'usd-1', 'eur-1', 'uah-2']);
  });

  it('shows only UAH transactions', () => {
    expect(
      filterTransactions(multiCurrencyTransactions, {
        ...createDefaultTransactionFilters(),
        currency: 'UAH',
      }).map((transaction) => transaction.id),
    ).toEqual(['uah-1', 'uah-2']);
  });

  it('shows only USD transactions', () => {
    expect(
      filterTransactions(multiCurrencyTransactions, {
        ...createDefaultTransactionFilters(),
        currency: 'USD',
      }).map((transaction) => transaction.id),
    ).toEqual(['usd-1']);
  });

  it('does not break other active filters', () => {
    expect(
      filterTransactions(
        [
          ...multiCurrencyTransactions,
          createTransaction({
            id: 'uah-income',
            currency: 'UAH',
            kind: 'income',
            signedAmount: 500,
          }),
        ],
        { ...createDefaultTransactionFilters(), currency: 'UAH', kind: 'income' },
      ).map((transaction) => transaction.id),
    ).toEqual(['uah-income']);
  });
});

describe('getTransactionCurrencyOptions', () => {
  it('dedupes and sorts currencies', () => {
    expect(
      getTransactionCurrencyOptions([
        createTransaction({ currency: 'USD', id: 'usd-1' }),
        createTransaction({ currency: 'UAH', id: 'uah-1' }),
        createTransaction({ currency: 'EUR', id: 'eur-1' }),
        createTransaction({ currency: 'UAH', id: 'uah-2' }),
      ]),
    ).toEqual(['EUR', 'UAH', 'USD']);
  });
});
