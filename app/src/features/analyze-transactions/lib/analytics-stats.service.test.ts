import { describe, expect, it } from 'vitest';

import type { Transaction } from '@entities/transaction';

import { readAnalyticsStats } from './analytics-stats.service';

function createTransaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'tx',
    amount: 0,
    categoryId: 'category',
    categoryName: 'Category',
    createdAt: '2026-05-19T10:00:00.000Z',
    currency: 'UAH',
    date: '2026-05-19',
    kind: 'expense',
    signedAmount: 0,
    source: 'google-sheets',
    syncStatus: 'synced',
    ...overrides,
  };
}

describe('readAnalyticsStats', () => {
  it('reads analytics from Google Sheets when stats are available', async () => {
    const ranges = new Map([
      [
        'MonthlyStats!A2:D',
        { range: 'MonthlyStats!A2:D', values: [['2026-05', '1000', '250', '750']] },
      ],
      [
        'CategoryStats!A2:D',
        { range: 'CategoryStats!A2:D', values: [['Food', 'expense', '250', '1']] },
      ],
    ]);

    await expect(
      readAnalyticsStats({
        accessToken: 'token',
        googleSheetsClient: {
          readRange: ({ range }) => Promise.resolve(ranges.get(range) ?? { range, values: [] }),
        },
        spreadsheetId: 'sheet-id',
        transactions: [],
      }),
    ).resolves.toMatchObject({
      source: 'google-sheets',
      monthlyStats: [{ month: '2026-05' }],
      categoryStats: [{ categoryName: 'Food', kind: 'expense' }],
    });
  });

  it('falls back to local stats when Google Sheets stats are empty', async () => {
    await expect(
      readAnalyticsStats({
        accessToken: 'token',
        googleSheetsClient: {
          readRange: ({ range }) => Promise.resolve({ range, values: [] }),
        },
        spreadsheetId: 'sheet-id',
        transactions: [
          createTransaction({
            amount: 120,
            categoryName: 'Food',
            id: 'food',
            kind: 'expense',
            signedAmount: -120,
          }),
        ],
      }),
    ).resolves.toMatchObject({
      source: 'local',
      categoryStats: [{ categoryName: 'Food', total: 120 }],
      monthlyStats: [{ expense: 120, month: '2026-05' }],
    });
  });
});
