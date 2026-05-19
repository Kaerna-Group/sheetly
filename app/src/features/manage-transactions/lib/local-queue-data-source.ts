import type { Category } from '@entities/category';
import type { Transaction } from '@entities/transaction';
import { getDefaultCategories } from '@entities/category';
import type { FinanceDataSource, SyncQueueOperation, SyncResult } from '@shared/lib/data-source';

import { offlineTransactionsStorage } from './offline-transactions.storage';
import type { TransactionQueueItem } from '../types/sync-queue.type';

function createQueueItem(
  operation: SyncQueueOperation,
  transactionId: string,
  transaction?: Transaction,
): TransactionQueueItem {
  return {
    attempts: 0,
    createdAt: new Date().toISOString(),
    id: `${operation}-${transactionId}`,
    operation,
    transaction,
    transactionId,
  };
}

function asPendingTransaction(transaction: Transaction): Transaction {
  return {
    ...transaction,
    source: 'offline-queue',
    syncStatus: 'pending',
  };
}

export function createLocalQueueDataSource(
  remoteDataSource?: FinanceDataSource,
): FinanceDataSource {
  return {
    async createTransaction(transaction: Transaction): Promise<Transaction> {
      const pendingTransaction = asPendingTransaction(transaction);

      await offlineTransactionsStorage.upsertCachedTransaction(pendingTransaction);
      await offlineTransactionsStorage.addQueueItem(
        createQueueItem('create', transaction.id, pendingTransaction),
      );

      return pendingTransaction;
    },
    getCategories(): Promise<Category[]> {
      return Promise.resolve(getDefaultCategories());
    },
    getTransactions() {
      return offlineTransactionsStorage.getCachedTransactions();
    },
    async softDeleteTransaction(transactionId: string): Promise<void> {
      const cachedTransactions = await offlineTransactionsStorage.getCachedTransactions();
      const pendingQueue = await offlineTransactionsStorage.getPendingQueue();
      const now = new Date().toISOString();
      const transaction = cachedTransactions.find(
        (cachedTransaction) => cachedTransaction.id === transactionId,
      );
      const pendingCreate = pendingQueue.find(
        (item) => item.transactionId === transactionId && item.operation === 'create',
      );

      if (transaction) {
        await offlineTransactionsStorage.upsertCachedTransaction({
          ...transaction,
          deletedAt: now,
          syncStatus: 'pending',
          updatedAt: now,
        });
      }

      if (pendingCreate) {
        await offlineTransactionsStorage.removeQueueItem(pendingCreate.id);
        return;
      }

      await offlineTransactionsStorage.addQueueItem(createQueueItem('delete', transactionId));
    },
    async syncPending(): Promise<SyncResult> {
      const queue = await offlineTransactionsStorage.getPendingQueue();
      const failedQueue = await offlineTransactionsStorage.getFailedQueue();
      const syncQueue = [...queue, ...failedQueue];
      let synced = 0;
      let failed = 0;

      if (!remoteDataSource) {
        return {
          failed: syncQueue.length,
          synced: 0,
          total: syncQueue.length,
        };
      }

      for (const item of syncQueue) {
        try {
          if (item.operation === 'create' && item.transaction) {
            const remoteTransactions =
              (await Promise.resolve(remoteDataSource.getTransactions()).catch(() => [])) ?? [];
            const existingTransaction = remoteTransactions.find(
              (transaction) => transaction.id === item.transactionId,
            );
            const syncedTransaction =
              existingTransaction ??
              (await remoteDataSource.createTransaction({
                ...item.transaction,
                source: 'google-sheets',
                syncStatus: 'synced',
              }));

            await offlineTransactionsStorage.upsertCachedTransaction(syncedTransaction);
          }

          if (item.operation === 'update' && item.transaction) {
            const syncedTransaction = await remoteDataSource.updateTransaction({
              ...item.transaction,
              source: 'google-sheets',
              syncStatus: 'synced',
            });

            await offlineTransactionsStorage.upsertCachedTransaction(syncedTransaction);
          }

          if (item.operation === 'delete') {
            await remoteDataSource.softDeleteTransaction(item.transactionId);
          }

          await offlineTransactionsStorage.removeQueueItem(item.id);
          synced += 1;
        } catch (error) {
          await offlineTransactionsStorage.markQueueItemFailed(item, error);
          failed += 1;
        }
      }

      if (synced > 0) {
        await offlineTransactionsStorage.setLastSuccessfulSyncAt(new Date().toISOString());
      }

      return {
        failed,
        synced,
        total: syncQueue.length,
      };
    },
    async updateTransaction(transaction: Transaction): Promise<Transaction> {
      const pendingQueue = await offlineTransactionsStorage.getPendingQueue();
      const pendingCreate = pendingQueue.find(
        (item) => item.transactionId === transaction.id && item.operation === 'create',
      );
      const pendingTransaction = {
        ...asPendingTransaction(transaction),
        updatedAt: new Date().toISOString(),
      };

      await offlineTransactionsStorage.upsertCachedTransaction(pendingTransaction);
      await offlineTransactionsStorage.addQueueItem(
        createQueueItem(pendingCreate ? 'create' : 'update', transaction.id, pendingTransaction),
      );

      return pendingTransaction;
    },
  };
}
