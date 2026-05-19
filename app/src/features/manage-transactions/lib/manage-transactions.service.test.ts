import { describe, expect, it, vi } from 'vitest';

import type { Transaction } from '@entities/transaction';

import { createTransaction, readTransactions } from './manage-transactions.service';

const metadataWithLedger = {
  spreadsheetId: 'sheet-id',
  sheets: [
    {
      properties: {
        title: 'Ledger',
      },
    },
  ],
};

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
  source: 'google-sheets',
  syncStatus: 'synced',
};

describe('manage transactions service', () => {
  it('reads transactions from Ledger rows', async () => {
    const readRange = vi.fn().mockResolvedValue({
      values: [
        [
          'tx-1',
          '2026-05-19',
          'expense',
          'Food',
          '250',
          '-250',
          'UAH',
          'Card',
          'Lunch',
          '2026-05-19T10:00:00.000Z',
          'google-sheets',
          'synced',
        ],
      ],
    });

    await expect(
      readTransactions({
        accessToken: 'token',
        googleSheetsClient: {
          appendValues: vi.fn(),
          getSpreadsheetMetadata: vi.fn().mockResolvedValue(metadataWithLedger),
          readRange,
        },
        spreadsheetId: 'sheet-id',
      }),
    ).resolves.toEqual([transaction]);

    expect(readRange).toHaveBeenCalledWith({
      accessToken: 'token',
      range: 'Ledger!A2:L',
      spreadsheetId: 'sheet-id',
    });
  });

  it('appends transactions to Ledger', async () => {
    const appendValues = vi.fn().mockResolvedValue(undefined);

    await expect(
      createTransaction({
        accessToken: 'token',
        googleSheetsClient: {
          appendValues,
          getSpreadsheetMetadata: vi.fn().mockResolvedValue(metadataWithLedger),
          readRange: vi.fn(),
        },
        spreadsheetId: 'sheet-id',
        transaction,
      }),
    ).resolves.toBeUndefined();

    expect(appendValues).toHaveBeenCalledWith({
      accessToken: 'token',
      range: 'Ledger!A:L',
      spreadsheetId: 'sheet-id',
      values: [
        [
          'tx-1',
          '2026-05-19',
          'expense',
          'Food',
          '250',
          '-250',
          'UAH',
          'Card',
          'Lunch',
          '2026-05-19T10:00:00.000Z',
          'google-sheets',
          'synced',
        ],
      ],
    });
  });

  it('requires Google context', async () => {
    await expect(
      readTransactions({
        accessToken: null,
        spreadsheetId: null,
      }),
    ).rejects.toThrow('Connect Google and spreadsheet');
  });

  it('requires Ledger template', async () => {
    await expect(
      createTransaction({
        accessToken: 'token',
        googleSheetsClient: {
          appendValues: vi.fn(),
          getSpreadsheetMetadata: vi.fn().mockResolvedValue({
            spreadsheetId: 'sheet-id',
            sheets: [],
          }),
          readRange: vi.fn(),
        },
        spreadsheetId: 'sheet-id',
        transaction,
      }),
    ).rejects.toThrow('Spreadsheet template is not ready');
  });
});
