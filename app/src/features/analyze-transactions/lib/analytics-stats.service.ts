import type { Transaction } from '@entities/transaction';
import { createGoogleSheetsClient, type GoogleSheetsClient } from '@shared/api/google-sheets';
import { sheetRanges } from '@shared/config/constants/sheet.constants';

import { calculateCategoryStats } from './calculate-category-stats';
import { calculateMonthlyStats } from './calculate-monthly-stats';
import { mapRowToCategoryStats, mapRowToMonthlyStats } from './analytics-row.mapper';
import type { AnalyticsStats } from '../types/analytics-stat.types';
import type { CategoryStats, MonthlyStats } from '../types/analytics-stat.types';

type ReadAnalyticsStatsParams = {
  accessToken: string | null;
  forceLocal?: boolean;
  googleSheetsClient?: Pick<GoogleSheetsClient, 'readRange'>;
  spreadsheetId: string | null;
  transactions: Transaction[];
};

function buildLocalAnalyticsStats(transactions: Transaction[]): AnalyticsStats {
  return {
    categoryStats: calculateCategoryStats(transactions),
    monthlyStats: calculateMonthlyStats(transactions),
    source: 'local',
  };
}

function isMonthlyStats(value: MonthlyStats | null): value is MonthlyStats {
  return value !== null;
}

function isCategoryStats(value: CategoryStats | null): value is CategoryStats {
  return value !== null;
}

export async function readAnalyticsStats({
  accessToken,
  forceLocal = false,
  googleSheetsClient = createGoogleSheetsClient(),
  spreadsheetId,
  transactions,
}: ReadAnalyticsStatsParams): Promise<AnalyticsStats> {
  const localStats = buildLocalAnalyticsStats(transactions);

  if (!accessToken || !spreadsheetId || forceLocal) {
    return localStats;
  }

  try {
    const [monthlyRange, categoryRange] = await Promise.all([
      googleSheetsClient.readRange({
        accessToken,
        range: sheetRanges.monthlyStatsData,
        spreadsheetId,
      }),
      googleSheetsClient.readRange({
        accessToken,
        range: sheetRanges.categoryStatsData,
        spreadsheetId,
      }),
    ]);
    const monthlyStats = (monthlyRange.values ?? [])
      .map(mapRowToMonthlyStats)
      .filter(isMonthlyStats);
    const categoryStats = (categoryRange.values ?? [])
      .map(mapRowToCategoryStats)
      .filter(isCategoryStats);

    if (!monthlyStats.length && !categoryStats.length) {
      return localStats;
    }

    return {
      categoryStats: categoryStats.length ? categoryStats : localStats.categoryStats,
      monthlyStats: monthlyStats.length ? monthlyStats : localStats.monthlyStats,
      source: 'google-sheets',
    };
  } catch {
    return localStats;
  }
}
