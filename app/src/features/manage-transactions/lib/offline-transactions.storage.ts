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

function getItemTransaction(item: TransactionQueueItem, fallback?: Transaction) {
  return item.transaction ?? fallback;
}

function mergeQueueItem(
  existingItem: TransactionQueueItem | undefined,
  nextItem: TransactionQueueItem,
): TransactionQueueItem | null {
  if (!existingItem) {
    return nextItem;
  }

  if (existingItem.operation === 'create' && nextItem.operation === 'update') {
    return {
      ...existingItem,
      attempts: 0,
      lastError: undefined,
      transaction: getItemTransaction(nextItem, existingItem.transaction),
    };
  }

  if (existingItem.operation === 'create' && nextItem.operation === 'delete') {
    return null;
  }

  if (nextItem.operation === 'delete') {
    return {
      ...nextItem,
      attempts: 0,
      lastError: undefined,
    };
  }

  return {
    ...nextItem,
    attempts: 0,
    createdAt: existingItem.createdAt,
    lastError: undefined,
  };
}

export const offlineTransactionsStorage = {
  async addQueueItem(item: TransactionQueueItem): Promise<void> {
    await this.upsertQueueItem(item);
  },
  async upsertQueueItem(item: TransactionQueueItem): Promise<void> {
    const queue = await this.getPendingQueue();
    const failedQueue = await this.getFailedQueue();
    const existingItem = [...queue, ...failedQueue].find(
      (queueItem) => queueItem.transactionId === item.transactionId,
    );
    const mergedItem = mergeQueueItem(existingItem, item);
    const nextQueue = queue.filter((queueItem) => queueItem.transactionId !== item.transactionId);
    const nextFailedQueue = failedQueue.filter(
      (queueItem) => queueItem.transactionId !== item.transactionId,
    );

    await indexedDbService.set(
      storageKeys.pendingQueue,
      mergedItem ? [...nextQueue, mergedItem] : nextQueue,
    );
    await indexedDbService.set(storageKeys.failedQueue, nextFailedQueue);
  },
  async cacheTransactions(transactions: Transaction[]): Promise<void> {
    await indexedDbService.set(storageKeys.transactionsCache, sortTransactions(transactions));
  },
  async clearFailedQueue(): Promise<void> {
    await indexedDbService.remove(storageKeys.failedQueue);
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
  async getQueueItems(): Promise<TransactionQueueItem[]> {
    const [pendingQueue, failedQueue] = await Promise.all([
      this.getPendingQueue(),
      this.getFailedQueue(),
    ]);

    return [...pendingQueue, ...failedQueue].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
  },
  async getSyncDiagnostics() {
    const [cachedTransactions, failedQueue, lastSuccessfulSyncAt, pendingQueue] = await Promise.all(
      [
        this.getCachedTransactions(),
        this.getFailedQueue(),
        this.getLastSuccessfulSyncAt(),
        this.getPendingQueue(),
      ],
    );

    return {
      cachedTransactions: cachedTransactions.length,
      failed: failedQueue.length,
      lastError: failedQueue.at(-1)?.lastError ?? null,
      lastSuccessfulSyncAt,
      pending: pendingQueue.length,
      totalQueued: pendingQueue.length + failedQueue.length,
    };
  },
  async markQueueItemFailed(item: TransactionQueueItem, error: unknown): Promise<void> {
    const failedQueue = await this.getFailedQueue();
    const pendingQueue = await this.getPendingQueue();
    const failedItem: TransactionQueueItem = {
      ...item,
      attempts: item.attempts + 1,
      lastError: error instanceof Error ? error.message : 'Sync failed.',
    };

    await indexedDbService.set(
      storageKeys.pendingQueue,
      pendingQueue.filter((queueItem) => queueItem.id !== item.id),
    );
    await indexedDbService.set(storageKeys.failedQueue, [
      ...failedQueue.filter((queueItem) => queueItem.id !== item.id),
      failedItem,
    ]);

    if (item.transaction) {
      await this.upsertCachedTransaction({
        ...item.transaction,
        source: 'offline-queue',
        syncStatus: 'failed',
      });
    }
  },
  async resetOfflineData(): Promise<void> {
    await Promise.all([
      indexedDbService.remove(storageKeys.failedQueue),
      indexedDbService.remove(storageKeys.lastSuccessfulSyncAt),
      indexedDbService.remove(storageKeys.pendingQueue),
      indexedDbService.remove(storageKeys.transactionsCache),
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
