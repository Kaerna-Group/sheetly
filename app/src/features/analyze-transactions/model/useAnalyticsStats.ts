import { useEffect, useState } from 'react';

import type { Transaction } from '@entities/transaction';
import { useGoogleAuth } from '@features/google-auth';
import { localStorageService } from '@shared/lib/storage/local-storage.service';

import { readAnalyticsStats } from '../lib/analytics-stats.service';
import type { AnalyticsStats } from '../types/analytics-stat.types';

export function useAnalyticsStats(transactions: Transaction[]) {
  const googleAuth = useGoogleAuth();
  const [stats, setStats] = useState<AnalyticsStats>({
    categoryStats: [],
    monthlyStats: [],
    source: 'local',
  });

  useEffect(() => {
    let isActive = true;
    const spreadsheetId = localStorageService.get('spreadsheetId');

    async function loadStats() {
      const nextStats = await readAnalyticsStats({
        accessToken: googleAuth.accessToken,
        spreadsheetId,
        transactions,
      });

      if (isActive) {
        setStats(nextStats);
      }
    }

    void loadStats();

    return () => {
      isActive = false;
    };
  }, [googleAuth.accessToken, transactions]);

  return stats;
}
