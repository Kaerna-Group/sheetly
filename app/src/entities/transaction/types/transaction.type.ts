import type { TransactionId } from './transaction-id.type';
import type { TransactionKind } from './transaction-kind.type';
import type { TransactionSource } from './transaction-source.type';
import type { TransactionSyncStatus } from './transaction-status.type';

export type Transaction = {
  id: TransactionId;
  date: string;
  kind: TransactionKind;
  categoryId: string;
  categoryName: string;
  amount: number;
  signedAmount: number;
  currency: string;
  paymentMethod?: string;
  comment?: string;
  createdAt: string;
  updatedAt?: string;
  syncedAt?: string;
  source: TransactionSource;
  syncStatus: TransactionSyncStatus;
};
