import { useCallback, useEffect, useState } from 'react';

import { offlineTransactionsStorage } from '../lib/offline-transactions.storage';

export type OfflineSyncStatus = {
  cachedTransactions: number;
  failed: number;
  isOnline: boolean;
  lastError: string | null;
  lastSuccessfulSyncAt: string | null;
  pending: number;
  totalQueued: number;
};

const defaultStatus: OfflineSyncStatus = {
  cachedTransactions: 0,
  failed: 0,
  isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
  lastError: null,
  lastSuccessfulSyncAt: null,
  pending: 0,
  totalQueued: 0,
};

export function useOfflineSyncStatus() {
  const [status, setStatus] = useState<OfflineSyncStatus>(defaultStatus);

  const refresh = useCallback(async () => {
    const diagnostics = await offlineTransactionsStorage.getSyncDiagnostics();

    setStatus({
      ...diagnostics,
      isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
    });
  }, []);

  useEffect(() => {
    let isActive = true;

    async function refreshIfActive() {
      const diagnostics = await offlineTransactionsStorage.getSyncDiagnostics();

      if (isActive) {
        setStatus({
          ...diagnostics,
          isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
        });
      }
    }

    function handleNetworkChange() {
      void refreshIfActive();
    }

    void refreshIfActive();
    const intervalId = window.setInterval(() => void refreshIfActive(), 5000);

    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
    };
  }, []);

  return {
    refresh,
    status,
  };
}
