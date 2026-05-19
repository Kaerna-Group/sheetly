import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Transaction } from '@entities/transaction';
import { indexedDbService } from '@shared/lib/storage/indexed-db.service';

import { createLocalQueueDataSource } from './local-queue-data-source';

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

describe('local queue data source', () => {
  beforeEach(async () => {
    await indexedDbService.clear();
  });

  it('stores pending transactions in cache and queue', async () => {
    const dataSource = createLocalQueueDataSource();

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
    const dataSource = createLocalQueueDataSource(remoteDataSource);

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
    const dataSource = createLocalQueueDataSource(remoteDataSource);

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
    const dataSource = createLocalQueueDataSource(remoteDataSource);

    await dataSource.createTransaction(transaction);
    await expect(dataSource.syncPending()).resolves.toEqual({
      failed: 1,
      synced: 0,
      total: 1,
    });
    await expect(dataSource.syncPending()).resolves.toEqual({
      failed: 1,
      synced: 0,
      total: 1,
    });
  });
});
