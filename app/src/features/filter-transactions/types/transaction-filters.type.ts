import type { TransactionKind, TransactionSyncStatus } from '@entities/transaction';

export type TransactionKindFilter = TransactionKind | 'all';

export type TransactionFilters = {
  amountFrom: string;
  amountTo: string;
  category: string;
  container: string;
  dateFrom: string;
  dateTo: string;
  kind: TransactionKindFilter;
  query: string;
  showDeleted: boolean;
  syncStatus: TransactionSyncStatus | 'all';
};
