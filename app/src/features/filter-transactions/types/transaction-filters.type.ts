import type { TransactionKind } from '@entities/transaction';

export type TransactionKindFilter = TransactionKind | 'all';

export type TransactionFilters = {
  category: string;
  dateFrom: string;
  dateTo: string;
  kind: TransactionKindFilter;
  query: string;
};
