import { useCallback, useEffect, useState } from 'react';

import type { Transaction } from '@entities/transaction';
import { useGoogleAuth } from '@features/google-auth';
import { localStorageService } from '@shared/lib/storage/local-storage.service';

import { createTransaction, readTransactions } from '../lib/manage-transactions.service';

export function useTransactions() {
  const googleAuth = useGoogleAuth();
  const spreadsheetId = localStorageService.get('spreadsheetId');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadTransactions = useCallback(
    () =>
      readTransactions({
        accessToken: googleAuth.accessToken,
        spreadsheetId,
      }),
    [googleAuth.accessToken, spreadsheetId],
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const loadedTransactions = await loadTransactions();

      setTransactions(loadedTransactions);
    } catch (caughtError) {
      setTransactions([]);
      setError(caughtError instanceof Error ? caughtError.message : 'Could not load transactions.');
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
          setTransactions([]);
          setError(
            caughtError instanceof Error ? caughtError.message : 'Could not load transactions.',
          );
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
      await createTransaction({
        accessToken: googleAuth.accessToken,
        spreadsheetId,
        transaction,
      });

      setTransactions((currentTransactions) => [transaction, ...currentTransactions]);
      void refresh();
      return true;
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : 'Could not create transaction.',
      );
      return false;
    } finally {
      setIsCreating(false);
    }
  }

  return {
    createAndRefresh,
    error,
    isCreating,
    isLoading,
    refresh,
    transactions,
  };
}
