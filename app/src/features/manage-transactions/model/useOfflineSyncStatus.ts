import { useCallback, useEffect, useMemo, useState } from 'react';

import { createOfflineTransactionsStorage } from '../lib/offline-transactions.storage';
import type { TransactionQueueItem } from '../types/sync-queue.type';

export type OfflineSyncStatus = {
  cachedTransactions: number;
  failed: number;
  isOnline: boolean;
  lastError: string | null;
  lastSuccessfulSyncAt: string | null;
  pending: number;
  queueItems: TransactionQueueItem[];
  totalQueued: number;
};

const defaultStatus: OfflineSyncStatus = {
  cachedTransactions: 0,
  failed: 0,
  isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
  lastError: null,
  lastSuccessfulSyncAt: null,
  pending: 0,
  queueItems: [],
  totalQueued: 0,
};

export function useOfflineSyncStatus(spreadsheetId: string | null = null) {
  const storage = useMemo(
    () => createOfflineTransactionsStorage(spreadsheetId ?? '__unscoped__'),
    [spreadsheetId],
  );
  const [status, setStatus] = useState<OfflineSyncStatus>(defaultStatus);

  const refresh = useCallback(async () => {
    const [diagnostics, queueItems] = await Promise.all([
      storage.getSyncDiagnostics(),
      storage.getQueueItems(),
    ]);

    setStatus({
      ...diagnostics,
      isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
      queueItems,
    });
  }, [storage]);

  useEffect(() => {
    let isActive = true;

    async function refreshIfActive() {
      const [diagnostics, queueItems] = await Promise.all([
        storage.getSyncDiagnostics(),
        storage.getQueueItems(),
      ]);

      if (isActive) {
        setStatus({
          ...diagnostics,
          isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
          queueItems,
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
  }, [storage]);

  return {
    refresh,
    status,
  };
}
