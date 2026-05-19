import type { Category } from '@entities/category';
import type { Transaction } from '@entities/transaction';

export type SyncQueueOperation = 'create' | 'update' | 'delete';

export type SyncQueueItem = {
  attempts: number;
  createdAt: string;
  id: string;
  lastError?: string;
  operation: SyncQueueOperation;
  transaction?: Transaction;
  transactionId: string;
};

export type SyncResult = {
  failed: number;
  synced: number;
  total: number;
};

export type FinanceDataSource = {
  createTransaction: (transaction: Transaction) => Promise<Transaction>;
  getCategories: () => Promise<Category[]>;
  getTransactions: () => Promise<Transaction[]>;
  softDeleteTransaction: (transactionId: string) => Promise<void>;
  syncPending: () => Promise<SyncResult>;
  updateTransaction: (transaction: Transaction) => Promise<Transaction>;
};
