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
        'MonthlyStats!A2:E',
        { range: 'MonthlyStats!A2:E', values: [['2026-05', 'UAH', '1000', '250', '750']] },
      ],
      [
        'CategoryStats!A2:E',
        { range: 'CategoryStats!A2:E', values: [['Food', 'expense', 'UAH', '250', '1']] },
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
      monthlyStats: [{ month: '2026-05', currency: 'UAH' }],
      categoryStats: [{ categoryName: 'Food', kind: 'expense', currency: 'UAH' }],
    });
  });

  it('forces local stats when forceLocal is true even with valid credentials', async () => {
    const ranges = new Map([
      [
        'MonthlyStats!A2:E',
        { range: 'MonthlyStats!A2:E', values: [['2026-05', 'UAH', '999', '999', '0']] },
      ],
      [
        'CategoryStats!A2:E',
        { range: 'CategoryStats!A2:E', values: [['Remote', 'expense', 'UAH', '999', '1']] },
      ],
    ]);

    await expect(
      readAnalyticsStats({
        accessToken: 'token',
        forceLocal: true,
        googleSheetsClient: {
          readRange: ({ range }) => Promise.resolve(ranges.get(range) ?? { range, values: [] }),
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
      categoryStats: [{ categoryName: 'Food' }],
    });
  });

  it('local analytics keeps UAH and USD as separate monthly and category entries', async () => {
    await expect(
      readAnalyticsStats({
        accessToken: null,
        spreadsheetId: null,
        transactions: [
          createTransaction({
            id: 'uah',
            amount: 100,
            currency: 'UAH',
            kind: 'expense',
            signedAmount: -100,
          }),
          createTransaction({
            id: 'usd',
            amount: 50,
            currency: 'USD',
            kind: 'expense',
            signedAmount: -50,
          }),
        ],
      }),
    ).resolves.toMatchObject({
      source: 'local',
      monthlyStats: expect.arrayContaining([
        expect.objectContaining({ currency: 'UAH', expense: 100 }),
        expect.objectContaining({ currency: 'USD', expense: 50 }),
      ]),
      categoryStats: expect.arrayContaining([
        expect.objectContaining({ currency: 'UAH', categoryName: 'Category', expense: 100 }),
        expect.objectContaining({ currency: 'USD', categoryName: 'Category', expense: 50 }),
      ]),
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
