import type { Category } from '@entities/category';
import type { Transaction } from '@entities/transaction';
import { getDefaultCategories } from '@entities/category';
import type { FinanceDataSource, SyncQueueOperation, SyncResult } from '@shared/lib/data-source';

import { createOfflineTransactionsStorage } from './offline-transactions.storage';
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

function asSyncingTransaction(transaction: Transaction): Transaction {
  return {
    ...transaction,
    source: 'offline-queue',
    syncStatus: 'syncing',
  };
}

export function createLocalQueueDataSource(
  remoteDataSource?: FinanceDataSource,
  spreadsheetId = '__unscoped__',
): FinanceDataSource {
  const storage = createOfflineTransactionsStorage(spreadsheetId);

  return {
    async createTransaction(transaction: Transaction): Promise<Transaction> {
      const pendingTransaction = asPendingTransaction(transaction);

      await storage.upsertCachedTransaction(pendingTransaction);
      await storage.addQueueItem(createQueueItem('create', transaction.id, pendingTransaction));

      return pendingTransaction;
    },
    getCategories(): Promise<Category[]> {
      return Promise.resolve(getDefaultCategories());
    },
    getTransactions() {
      return storage.getCachedTransactions();
    },
    async softDeleteTransaction(transactionId: string): Promise<void> {
      const cachedTransactions = await storage.getCachedTransactions();
      const pendingQueue = await storage.getPendingQueue();
      const now = new Date().toISOString();
      const transaction = cachedTransactions.find(
        (cachedTransaction) => cachedTransaction.id === transactionId,
      );
      const pendingCreate = pendingQueue.find(
        (item) => item.transactionId === transactionId && item.operation === 'create',
      );

      if (transaction) {
        await storage.upsertCachedTransaction({
          ...transaction,
          deletedAt: now,
          syncStatus: 'pending',
          updatedAt: now,
        });
      }

      if (pendingCreate) {
        await storage.removeQueueItem(pendingCreate.id);
        return;
      }

      await storage.addQueueItem(createQueueItem('delete', transactionId));
    },
    async syncPending(): Promise<SyncResult> {
      const queue = await storage.getPendingQueue();
      const failedQueue = await storage.getFailedQueue();
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
          if (item.transaction) {
            await storage.upsertCachedTransaction(asSyncingTransaction(item.transaction));
          }

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

            await storage.upsertCachedTransaction(syncedTransaction);
          }

          if (item.operation === 'update' && item.transaction) {
            const syncedTransaction = await remoteDataSource.updateTransaction({
              ...item.transaction,
              source: 'google-sheets',
              syncStatus: 'synced',
            });

            await storage.upsertCachedTransaction(syncedTransaction);
          }

          if (item.operation === 'delete') {
            await remoteDataSource.softDeleteTransaction(item.transactionId);
          }

          await storage.removeQueueItem(item.id);
          synced += 1;
        } catch (error) {
          await storage.markQueueItemFailed(item, error);
          failed += 1;
        }
      }

      if (synced > 0) {
        await storage.setLastSuccessfulSyncAt(new Date().toISOString());
      }

      return {
        failed,
        synced,
        total: syncQueue.length,
      };
    },
    async updateTransaction(transaction: Transaction): Promise<Transaction> {
      const pendingQueue = await storage.getPendingQueue();
      const pendingCreate = pendingQueue.find(
        (item) => item.transactionId === transaction.id && item.operation === 'create',
      );
      const pendingTransaction = {
        ...asPendingTransaction(transaction),
        updatedAt: new Date().toISOString(),
      };

      await storage.upsertCachedTransaction(pendingTransaction);
      await storage.addQueueItem(
        createQueueItem(pendingCreate ? 'create' : 'update', transaction.id, pendingTransaction),
      );

      return pendingTransaction;
    },
  };
}
