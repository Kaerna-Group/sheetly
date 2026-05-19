import { useCallback, useEffect, useState } from 'react';

import type { Transaction } from '@entities/transaction';
import { useGoogleAuth } from '@features/google-auth';
import { localStorageService } from '@shared/lib/storage/local-storage.service';

import { createGoogleSheetsDataSource } from '../lib/google-sheets-data-source';
import { createLocalQueueDataSource } from '../lib/local-queue-data-source';
import { offlineTransactionsStorage } from '../lib/offline-transactions.storage';

export function useTransactions() {
  const googleAuth = useGoogleAuth();
  const spreadsheetId = localStorageService.get('spreadsheetId');
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

  useEffect(() => {
    let isActive = true;

    async function loadInitialTransactions() {
      setIsLoading(true);
      setError(null);

      try {
        const loadedTransactions = await loadTransactions();

        if (isActive) {
          setTransactions(loadedTransactions);
        }
      } catch (caughtError) {
        if (isActive) {
          const cachedTransactions = await offlineTransactionsStorage.getCachedTransactions();

          setTransactions(cachedTransactions);
          setError(
            caughtError instanceof Error ? caughtError.message : 'Could not load transactions.',
          );
          setSyncWarning(cachedTransactions.length ? 'Showing cached transactions.' : null);
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

  async function createAndRefresh(transaction: Transaction) {
    setIsCreating(true);
    setError(null);

    try {
      const dataSource = remoteDataSource() ?? localDataSource();
      const createdTransaction = await dataSource.createTransaction(transaction);

      setTransactions((currentTransactions) => [createdTransaction, ...currentTransactions]);
      void refresh();
      return true;
    } catch {
      try {
        const createdTransaction = await localDataSource().createTransaction(transaction);

        setSyncWarning('Google is unavailable. Transaction was saved offline.');
        setTransactions((currentTransactions) => [createdTransaction, ...currentTransactions]);
        return true;
      } catch (offlineError) {
        setError(
          offlineError instanceof Error ? offlineError.message : 'Could not create transaction.',
        );
        return false;
      }
    } finally {
      setIsCreating(false);
    }
  }

  async function updateAndRefresh(transaction: Transaction) {
    setIsCreating(true);
    setError(null);

    try {
      const dataSource = remoteDataSource() ?? localDataSource();
      const updatedTransaction = await dataSource.updateTransaction(transaction);

      setTransactions((currentTransactions) =>
        currentTransactions.map((currentTransaction) =>
          currentTransaction.id === updatedTransaction.id ? updatedTransaction : currentTransaction,
        ),
      );
      void refresh();
      return true;
    } catch {
      const updatedTransaction = await localDataSource().updateTransaction(transaction);

      setSyncWarning('Google is unavailable. Update was saved offline.');
      setTransactions((currentTransactions) =>
        currentTransactions.map((currentTransaction) =>
          currentTransaction.id === updatedTransaction.id ? updatedTransaction : currentTransaction,
        ),
      );
      return true;
    } finally {
      setIsCreating(false);
    }
  }

  async function deleteAndRefresh(transactionId: string) {
    setError(null);

    try {
      const dataSource = remoteDataSource() ?? localDataSource();

      await dataSource.softDeleteTransaction(transactionId);
      setTransactions((currentTransactions) =>
        currentTransactions.filter((transaction) => transaction.id !== transactionId),
      );
      void refresh();
      return true;
    } catch {
      await localDataSource().softDeleteTransaction(transactionId);
      setSyncWarning('Google is unavailable. Delete was saved offline.');
      setTransactions((currentTransactions) =>
        currentTransactions.filter((transaction) => transaction.id !== transactionId),
      );
      return true;
    }
  }

  async function retrySync() {
    setIsSyncing(true);
    setError(null);

    try {
      const result = await localDataSource().syncPending();

      setSyncWarning(
        result.failed
          ? `${result.failed} offline changes still need sync.`
          : result.synced
            ? 'Offline changes synced.'
            : null,
      );
      await refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not sync changes.');
    } finally {
      setIsSyncing(false);
    }
  }

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
