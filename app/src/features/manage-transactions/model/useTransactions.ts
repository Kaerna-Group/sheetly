import { useCallback, useEffect, useState } from 'react';

import type { Transaction } from '@entities/transaction';
import { useGoogleAuth } from '@features/google-auth';
import { localStorageService } from '@shared/lib/storage/local-storage.service';

import { createGoogleSheetsDataSource } from '../lib/google-sheets-data-source';
import { createLocalQueueDataSource } from '../lib/local-queue-data-source';
import { offlineTransactionsStorage } from '../lib/offline-transactions.storage';

function sortTransactions(transactions: Transaction[]) {
  return [...transactions].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function upsertTransaction(transactions: Transaction[], transaction: Transaction) {
  return sortTransactions([
    transaction,
    ...transactions.filter((currentTransaction) => currentTransaction.id !== transaction.id),
  ]);
}

function markTransactionAsFailed(transaction: Transaction): Transaction {
  return {
    ...transaction,
    source: 'offline-queue',
    syncStatus: 'failed',
  };
}

async function clearQueuedTransaction(transactionId: string) {
  await Promise.all(
    ['create', 'update', 'delete'].map((operation) =>
      offlineTransactionsStorage.removeQueueItem(`${operation}-${transactionId}`),
    ),
  );
}

export function useTransactions() {
  const googleAuth = useGoogleAuth();
  const [spreadsheetId, setSpreadsheetId] = useState(localStorageService.get('spreadsheetId'));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncWarning, setSyncWarning] = useState<string | null>(null);

  const remoteDataSource = useCallback(() => {
    if (!googleAuth.accessToken || !spreadsheetId) {
      return null;
    }

    return createGoogleSheetsDataSource({
      accessToken: googleAuth.accessToken,
      spreadsheetId,
    });
  }, [googleAuth.accessToken, spreadsheetId]);

  const localDataSource = useCallback(
    () => createLocalQueueDataSource(remoteDataSource() ?? undefined),
    [remoteDataSource],
  );

  const loadTransactions = useCallback(async () => {
    const cachedTransactions = await offlineTransactionsStorage.getCachedTransactions();

    if (cachedTransactions.length) {
      setTransactions(cachedTransactions);
    }

    const dataSource = remoteDataSource();

    if (!dataSource) {
      setSyncWarning('Connect Google to sync pending offline changes.');
      return cachedTransactions;
    }

    const loadedTransactions = await dataSource.getTransactions();
    const pendingTransactions = (await offlineTransactionsStorage.getCachedTransactions()).filter(
      (transaction) => transaction.syncStatus !== 'synced',
    );
    const mergedTransactions = [
      ...pendingTransactions,
      ...loadedTransactions.filter(
        (transaction) =>
          !pendingTransactions.some(
            (pendingTransaction) => pendingTransaction.id === transaction.id,
          ),
      ),
    ];

    await offlineTransactionsStorage.cacheTransactions(mergedTransactions);
    setSyncWarning(null);

    return mergedTransactions;
  }, [remoteDataSource]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const loadedTransactions = await loadTransactions();

      setTransactions(loadedTransactions);
    } catch (caughtError) {
      const cachedTransactions = await offlineTransactionsStorage.getCachedTransactions();

      setTransactions(cachedTransactions);
      setError(caughtError instanceof Error ? caughtError.message : 'Could not load transactions.');
      setSyncWarning(cachedTransactions.length ? 'Showing cached transactions.' : null);
    } finally {
      setIsLoading(false);
    }
  }, [loadTransactions]);

  const syncCreatedTransaction = useCallback(
    async (transaction: Transaction) => {
      const dataSource = remoteDataSource();

      if (!dataSource) {
        setSyncWarning('Connect Google to sync pending offline changes.');
        return;
      }

      try {
        setTransactions((currentTransactions) =>
          upsertTransaction(currentTransactions, {
            ...transaction,
            source: 'offline-queue',
            syncStatus: 'syncing',
          }),
        );
        const syncedTransaction = await dataSource.createTransaction(transaction);

        await clearQueuedTransaction(transaction.id);
        await offlineTransactionsStorage.upsertCachedTransaction(syncedTransaction);
        setTransactions((currentTransactions) =>
          upsertTransaction(currentTransactions, syncedTransaction),
        );
        setSyncWarning(null);
      } catch {
        const failedTransaction = markTransactionAsFailed(transaction);

        await offlineTransactionsStorage.upsertCachedTransaction(failedTransaction);
        setTransactions((currentTransactions) =>
          upsertTransaction(currentTransactions, failedTransaction),
        );
        setSyncWarning('Google is unavailable. Transaction was saved offline.');
      }
    },
    [remoteDataSource],
  );

  const syncUpdatedTransaction = useCallback(
    async (transaction: Transaction) => {
      const dataSource = remoteDataSource();

      if (!dataSource) {
        setSyncWarning('Connect Google to sync pending offline changes.');
        return;
      }

      try {
        setTransactions((currentTransactions) =>
          upsertTransaction(currentTransactions, {
            ...transaction,
            source: 'offline-queue',
            syncStatus: 'syncing',
          }),
        );
        const syncedTransaction = await dataSource.updateTransaction(transaction);

        await clearQueuedTransaction(transaction.id);
        await offlineTransactionsStorage.upsertCachedTransaction(syncedTransaction);
        setTransactions((currentTransactions) =>
          upsertTransaction(currentTransactions, syncedTransaction),
        );
        setSyncWarning(null);
      } catch {
        const failedTransaction = markTransactionAsFailed(transaction);

        await offlineTransactionsStorage.upsertCachedTransaction(failedTransaction);
        setTransactions((currentTransactions) =>
          upsertTransaction(currentTransactions, failedTransaction),
        );
        setSyncWarning('Google is unavailable. Update was saved offline.');
      }
    },
    [remoteDataSource],
  );

  const syncDeletedTransaction = useCallback(
    async (transactionId: string, deletedTransaction?: Transaction) => {
      const dataSource = remoteDataSource();

      if (!dataSource) {
        setSyncWarning('Connect Google to sync pending offline changes.');
        return;
      }

      try {
        if (deletedTransaction) {
          setTransactions((currentTransactions) =>
            upsertTransaction(currentTransactions, {
              ...deletedTransaction,
              source: 'offline-queue',
              syncStatus: 'syncing',
            }),
          );
        }

        await dataSource.softDeleteTransaction(transactionId);
        await clearQueuedTransaction(transactionId);
        if (deletedTransaction) {
          const syncedDeletedTransaction: Transaction = {
            ...deletedTransaction,
            source: 'google-sheets',
            syncStatus: 'synced',
          };

          await offlineTransactionsStorage.upsertCachedTransaction(syncedDeletedTransaction);
          setTransactions((currentTransactions) =>
            upsertTransaction(currentTransactions, syncedDeletedTransaction),
          );
        }
        setSyncWarning(null);
      } catch {
        if (deletedTransaction) {
          const failedTransaction = markTransactionAsFailed(deletedTransaction);

          await offlineTransactionsStorage.upsertCachedTransaction(failedTransaction);
          setTransactions((currentTransactions) =>
            upsertTransaction(currentTransactions, failedTransaction),
          );
        }
        setSyncWarning('Google is unavailable. Delete was saved offline.');
      }
    },
    [remoteDataSource],
  );

  useEffect(() => {
    let isActive = true;

    async function loadInitialTransactions() {
      const cachedTransactions = await offlineTransactionsStorage.getCachedTransactions();

      if (!isActive) {
        return;
      }

      if (cachedTransactions.length) {
        setTransactions(cachedTransactions);
      }

      setIsLoading(!cachedTransactions.length);
      setError(null);

      try {
        const loadedTransactions = await loadTransactions();

        if (isActive) {
          setTransactions(loadedTransactions);
        }
      } catch (caughtError) {
        if (isActive) {
          const fallbackTransactions = await offlineTransactionsStorage.getCachedTransactions();

          setTransactions(fallbackTransactions);
          setError(
            caughtError instanceof Error ? caughtError.message : 'Could not load transactions.',
          );
          setSyncWarning(fallbackTransactions.length ? 'Showing cached transactions.' : null);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialTransactions();

    return () => {
      isActive = false;
    };
  }, [loadTransactions]);

  useEffect(() => {
    function refreshSpreadsheetId() {
      setSpreadsheetId(localStorageService.get('spreadsheetId'));
    }

    window.addEventListener('sheetly:spreadsheet-connected', refreshSpreadsheetId);
    window.addEventListener('storage', refreshSpreadsheetId);

    return () => {
      window.removeEventListener('sheetly:spreadsheet-connected', refreshSpreadsheetId);
      window.removeEventListener('storage', refreshSpreadsheetId);
    };
  }, []);

  async function createAndRefresh(transaction: Transaction) {
    setIsCreating(true);
    setError(null);

    try {
      const pendingTransaction = await localDataSource().createTransaction(transaction);

      setTransactions((currentTransactions) =>
        upsertTransaction(currentTransactions, pendingTransaction),
      );
      void syncCreatedTransaction(transaction);
      return true;
    } catch (offlineError) {
      setError(
        offlineError instanceof Error ? offlineError.message : 'Could not create transaction.',
      );
      return false;
    } finally {
      setIsCreating(false);
    }
  }

  async function updateAndRefresh(transaction: Transaction) {
    setIsCreating(true);
    setError(null);

    try {
      const pendingTransaction = await localDataSource().updateTransaction(transaction);

      setTransactions((currentTransactions) =>
        upsertTransaction(currentTransactions, pendingTransaction),
      );
      void syncUpdatedTransaction(transaction);
      return true;
    } catch (offlineError) {
      setError(
        offlineError instanceof Error ? offlineError.message : 'Could not update transaction.',
      );
      return false;
    } finally {
      setIsCreating(false);
    }
  }

  async function deleteAndRefresh(transactionId: string) {
    setError(null);

    try {
      const cachedTransactions = await offlineTransactionsStorage.getCachedTransactions();
      const deletedTransaction = cachedTransactions.find(
        (transaction) => transaction.id === transactionId,
      );

      await localDataSource().softDeleteTransaction(transactionId);
      const nextCachedTransactions = await offlineTransactionsStorage.getCachedTransactions();

      setTransactions(nextCachedTransactions);
      void syncDeletedTransaction(
        transactionId,
        nextCachedTransactions.find((transaction) => transaction.id === transactionId) ??
          deletedTransaction,
      );
      return true;
    } catch (offlineError) {
      setError(
        offlineError instanceof Error ? offlineError.message : 'Could not delete transaction.',
      );
      return false;
    }
  }

  const retrySync = useCallback(async () => {
    setIsSyncing(true);
    setError(null);

    try {
      const result = await localDataSource().syncPending();
      const cachedTransactions = await offlineTransactionsStorage.getCachedTransactions();

      setTransactions(cachedTransactions);
      setSyncWarning(
        result.failed
          ? `${result.failed} offline changes still need sync.`
          : result.synced
            ? 'Offline changes synced.'
            : null,
      );
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not sync changes.');
    } finally {
      setIsSyncing(false);
    }
  }, [localDataSource]);

  useEffect(() => {
    if (!googleAuth.accessToken || !spreadsheetId) {
      return;
    }

    async function syncQueuedChanges() {
      const queueItems = await offlineTransactionsStorage.getQueueItems();

      if (queueItems.length) {
        void retrySync();
      }
    }

    void syncQueuedChanges();
  }, [googleAuth.accessToken, retrySync, spreadsheetId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    function handleOnline() {
      if (remoteDataSource()) {
        void retrySync();
      }
    }

    window.addEventListener('online', handleOnline);

    return () => window.removeEventListener('online', handleOnline);
  }, [remoteDataSource, retrySync]);

  return {
    createAndRefresh,
    deleteAndRefresh,
    error,
    isCreating,
    isLoading,
    isSyncing,
    refresh,
    retrySync,
    syncWarning,
    transactions,
    updateAndRefresh,
  };
}
