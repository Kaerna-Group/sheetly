import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Transaction } from '@entities/transaction';
import { indexedDbService } from '@shared/lib/storage/indexed-db.service';

import { createLocalQueueDataSource } from './local-queue-data-source';
import { createOfflineTransactionsStorage } from './offline-transactions.storage';

const TEST_SPREADSHEET_ID = 'test-sheet';
const pendingQueueKey = `spreadsheet:${TEST_SPREADSHEET_ID}:pendingTransactionsQueue`;
const failedQueueKey = `spreadsheet:${TEST_SPREADSHEET_ID}:failedSyncQueue`;

const transaction: Transaction = {
  id: 'tx-1',
  amount: 250,
  categoryId: 'food',
  categoryName: 'Food',
  comment: 'Lunch',
  createdAt: '2026-05-19T10:00:00.000Z',
  currency: 'UAH',
  date: '2026-05-19',
  kind: 'expense',
  paymentMethod: 'Card',
  signedAmount: -250,
  source: 'offline-queue',
  syncStatus: 'pending',
};

function makeDataSource(remoteDataSource?: Parameters<typeof createLocalQueueDataSource>[0]) {
  return createLocalQueueDataSource(remoteDataSource, TEST_SPREADSHEET_ID);
}

describe('local queue data source', () => {
  beforeEach(async () => {
    await indexedDbService.clear();
  });

  it('stores pending transactions in cache and queue', async () => {
    const dataSource = makeDataSource();

    await expect(dataSource.createTransaction(transaction)).resolves.toMatchObject({
      id: 'tx-1',
      source: 'offline-queue',
      syncStatus: 'pending',
    });

    await expect(dataSource.getTransactions()).resolves.toEqual([
      expect.objectContaining({
        id: 'tx-1',
        syncStatus: 'pending',
      }),
    ]);
  });

  it('merges create and update into one latest create queue item', async () => {
    const dataSource = makeDataSource();

    await dataSource.createTransaction(transaction);
    await dataSource.updateTransaction({
      ...transaction,
      amount: 300,
      comment: 'Updated lunch',
      signedAmount: -300,
    });

    await expect(indexedDbService.get(pendingQueueKey)).resolves.toEqual([
      expect.objectContaining({
        operation: 'create',
        transaction: expect.objectContaining({
          amount: 300,
          comment: 'Updated lunch',
        }),
        transactionId: 'tx-1',
      }),
    ]);
  });

  it('removes pending create from queue when transaction is deleted before sync', async () => {
    const dataSource = makeDataSource();

    await dataSource.createTransaction(transaction);
    await dataSource.softDeleteTransaction(transaction.id);

    await expect(indexedDbService.get(pendingQueueKey)).resolves.toEqual([]);
    await expect(dataSource.getTransactions()).resolves.toEqual([
      expect.objectContaining({
        deletedAt: expect.any(String),
        id: 'tx-1',
      }),
    ]);
  });

  it('replaces pending update with delete queue item', async () => {
    const dataSource = makeDataSource();

    await dataSource.updateTransaction(transaction);
    await dataSource.softDeleteTransaction(transaction.id);

    await expect(indexedDbService.get(pendingQueueKey)).resolves.toEqual([
      expect.objectContaining({
        operation: 'delete',
        transactionId: 'tx-1',
      }),
    ]);
  });

  it('syncs pending creates through remote data source', async () => {
    const remoteDataSource = {
      createTransaction: vi.fn().mockResolvedValue({
        ...transaction,
        source: 'google-sheets',
        syncStatus: 'synced',
      }),
      getCategories: vi.fn(),
      getTransactions: vi.fn(),
      softDeleteTransaction: vi.fn(),
      syncPending: vi.fn(),
      updateTransaction: vi.fn(),
    };
    const dataSource = makeDataSource(remoteDataSource);

    await dataSource.createTransaction(transaction);
    await expect(dataSource.syncPending()).resolves.toEqual({
      failed: 0,
      synced: 1,
      total: 1,
    });
    expect(remoteDataSource.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'tx-1',
        source: 'google-sheets',
        syncStatus: 'synced',
      }),
    );
    await expect(dataSource.getTransactions()).resolves.toEqual([
      expect.objectContaining({
        id: 'tx-1',
        syncStatus: 'synced',
      }),
    ]);
  });

  it('does not duplicate pending creates that already exist remotely', async () => {
    const remoteDataSource = {
      createTransaction: vi.fn(),
      getCategories: vi.fn(),
      getTransactions: vi.fn().mockResolvedValue([
        {
          ...transaction,
          source: 'google-sheets',
          syncStatus: 'synced',
        },
      ]),
      softDeleteTransaction: vi.fn(),
      syncPending: vi.fn(),
      updateTransaction: vi.fn(),
    };
    const dataSource = makeDataSource(remoteDataSource);

    await dataSource.createTransaction(transaction);
    await expect(dataSource.syncPending()).resolves.toEqual({
      failed: 0,
      synced: 1,
      total: 1,
    });
    expect(remoteDataSource.createTransaction).not.toHaveBeenCalled();
  });

  it('stores failed sync attempts for retry', async () => {
    const remoteDataSource = {
      createTransaction: vi.fn().mockRejectedValue(new Error('Network failed')),
      getCategories: vi.fn(),
      getTransactions: vi.fn(),
      softDeleteTransaction: vi.fn(),
      syncPending: vi.fn(),
      updateTransaction: vi.fn(),
    };
    const dataSource = makeDataSource(remoteDataSource);

    await dataSource.createTransaction(transaction);
    await expect(dataSource.syncPending()).resolves.toEqual({
      failed: 1,
      synced: 0,
      total: 1,
    });
    await expect(indexedDbService.get(failedQueueKey)).resolves.toEqual([
      expect.objectContaining({
        attempts: 1,
        lastError: 'Network failed',
        transactionId: 'tx-1',
      }),
    ]);
    await expect(dataSource.syncPending()).resolves.toEqual({
      failed: 1,
      synced: 0,
      total: 1,
    });
    await expect(indexedDbService.get(failedQueueKey)).resolves.toEqual([
      expect.objectContaining({
        attempts: 2,
        transactionId: 'tx-1',
      }),
    ]);
  });

  it('keeps caches isolated between different spreadsheets', async () => {
    const dsA = createLocalQueueDataSource(undefined, 'sheet-a');
    const dsB = createLocalQueueDataSource(undefined, 'sheet-b');

    await dsA.createTransaction({ ...transaction, id: 'tx-a' });
    await dsB.createTransaction({ ...transaction, id: 'tx-b' });

    await expect(dsA.getTransactions()).resolves.toEqual([expect.objectContaining({ id: 'tx-a' })]);
    await expect(dsB.getTransactions()).resolves.toEqual([expect.objectContaining({ id: 'tx-b' })]);
  });

  it('pending queue from spreadsheet-a is not synced via spreadsheet-b data source', async () => {
    const remoteDataSource = {
      createTransaction: vi.fn().mockResolvedValue({
        ...transaction,
        source: 'google-sheets',
        syncStatus: 'synced',
      }),
      getCategories: vi.fn(),
      getTransactions: vi.fn().mockResolvedValue([]),
      softDeleteTransaction: vi.fn(),
      syncPending: vi.fn(),
      updateTransaction: vi.fn(),
    };
    const dsA = createLocalQueueDataSource(undefined, 'sheet-a');
    const dsB = createLocalQueueDataSource(remoteDataSource, 'sheet-b');

    await dsA.createTransaction(transaction);

    await expect(dsB.syncPending()).resolves.toEqual({ failed: 0, synced: 0, total: 0 });
    expect(remoteDataSource.createTransaction).not.toHaveBeenCalled();

    const storageA = createOfflineTransactionsStorage('sheet-a');
    await expect(storageA.getPendingQueue()).resolves.toHaveLength(1);
  });

  it('switching to a new spreadsheet sees empty cache even when old one has data', async () => {
    const storageOld = createOfflineTransactionsStorage('old-sheet');

    await storageOld.cacheTransactions([{ ...transaction, id: 'old-tx' }]);

    const storageNew = createOfflineTransactionsStorage('new-sheet');

    await expect(storageNew.getCachedTransactions()).resolves.toEqual([]);
  });
});
