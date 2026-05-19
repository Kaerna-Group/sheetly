import type { Transaction } from '@entities/transaction';
import { indexedDbService } from '@shared/lib/storage/indexed-db.service';

import type { TransactionQueueItem } from '../types/sync-queue.type';

const storageKeys = {
  failedQueue: 'failedSyncQueue',
  lastSuccessfulSyncAt: 'lastSuccessfulSyncAt',
  pendingQueue: 'pendingTransactionsQueue',
  transactionsCache: 'transactionsCache',
} as const;

function sortTransactions(transactions: Transaction[]) {
  return [...transactions].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export const offlineTransactionsStorage = {
  async addQueueItem(item: TransactionQueueItem): Promise<void> {
    const queue = await this.getPendingQueue();
    const nextQueue = [
      ...queue.filter((queueItem) => queueItem.transactionId !== item.transactionId),
      item,
    ];

    await indexedDbService.set(storageKeys.pendingQueue, nextQueue);
  },
  async cacheTransactions(transactions: Transaction[]): Promise<void> {
    await indexedDbService.set(
      storageKeys.transactionsCache,
      sortTransactions(transactions).filter((transaction) => !transaction.deletedAt),
    );
  },
  async getCachedTransactions(): Promise<Transaction[]> {
    return (await indexedDbService.get<Transaction[]>(storageKeys.transactionsCache)) ?? [];
  },
  async getFailedQueue(): Promise<TransactionQueueItem[]> {
    return (await indexedDbService.get<TransactionQueueItem[]>(storageKeys.failedQueue)) ?? [];
  },
  async getLastSuccessfulSyncAt(): Promise<string | null> {
    return indexedDbService.get<string>(storageKeys.lastSuccessfulSyncAt);
  },
  async getPendingQueue(): Promise<TransactionQueueItem[]> {
    return (await indexedDbService.get<TransactionQueueItem[]>(storageKeys.pendingQueue)) ?? [];
  },
  async markQueueItemFailed(item: TransactionQueueItem, error: unknown): Promise<void> {
    const failedQueue = await this.getFailedQueue();
    const failedItem: TransactionQueueItem = {
      ...item,
      attempts: item.attempts + 1,
      lastError: error instanceof Error ? error.message : 'Sync failed.',
    };

    await indexedDbService.set(storageKeys.failedQueue, [
      ...failedQueue.filter((queueItem) => queueItem.id !== item.id),
      failedItem,
    ]);
  },
  async removeQueueItem(itemId: string): Promise<void> {
    const pendingQueue = await this.getPendingQueue();
    const failedQueue = await this.getFailedQueue();

    await indexedDbService.set(
      storageKeys.pendingQueue,
      pendingQueue.filter((item) => item.id !== itemId),
    );
    await indexedDbService.set(
      storageKeys.failedQueue,
      failedQueue.filter((item) => item.id !== itemId),
    );
  },
  async setLastSuccessfulSyncAt(value: string): Promise<void> {
    await indexedDbService.set(storageKeys.lastSuccessfulSyncAt, value);
  },
  async upsertCachedTransaction(transaction: Transaction): Promise<void> {
    const cachedTransactions = await this.getCachedTransactions();
    const nextTransactions = [
      transaction,
      ...cachedTransactions.filter((cachedTransaction) => cachedTransaction.id !== transaction.id),
    ];

    await this.cacheTransactions(nextTransactions);
  },
};
