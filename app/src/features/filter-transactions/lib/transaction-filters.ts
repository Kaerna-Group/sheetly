import type { Transaction } from '@entities/transaction';

import type { TransactionFilters } from '../types/transaction-filters.type';

export function createDefaultTransactionFilters(): TransactionFilters {
  return {
    category: '',
    container: '',
    dateFrom: '',
    dateTo: '',
    kind: 'all',
    query: '',
  };
}

function normalizeSearchValue(value: string | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

function matchesDateRange(transaction: Transaction, filters: TransactionFilters) {
  if (filters.dateFrom && transaction.date < filters.dateFrom) {
    return false;
  }

  if (filters.dateTo && transaction.date > filters.dateTo) {
    return false;
  }

  return true;
}

function matchesQuery(transaction: Transaction, query: string) {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return true;
  }

  return [transaction.categoryName, transaction.comment, transaction.paymentMethod].some((value) =>
    normalizeSearchValue(value).includes(normalizedQuery),
  );
}

export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters,
): Transaction[] {
  return transactions.filter((transaction) => {
    if (!matchesDateRange(transaction, filters)) {
      return false;
    }

    if (filters.kind !== 'all' && transaction.kind !== filters.kind) {
      return false;
    }

    if (filters.category && transaction.categoryName !== filters.category) {
      return false;
    }

    if (filters.container && transaction.containerName !== filters.container) {
      return false;
    }

    return matchesQuery(transaction, filters.query);
  });
}

export function getTransactionCategoryOptions(transactions: Transaction[]) {
  return [...new Set(transactions.map((transaction) => transaction.categoryName))]
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));
}

export function getTransactionContainerOptions(transactions: Transaction[]) {
  return [...new Set(transactions.map((transaction) => transaction.containerName))]
    .filter((containerName): containerName is string => Boolean(containerName))
    .sort((left, right) => left.localeCompare(right));
}
