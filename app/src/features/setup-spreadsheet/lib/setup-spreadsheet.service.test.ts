import { describe, expect, it, vi } from 'vitest';

import { setupSpreadsheet } from './setup-spreadsheet.service';

describe('setupSpreadsheet', () => {
  it('creates only missing sheets and writes template values', async () => {
    const googleSheetsClient = {
      batchUpdateSpreadsheet: vi.fn().mockResolvedValue(undefined),
      batchUpdateValues: vi.fn().mockResolvedValue(undefined),
      getSpreadsheetMetadata: vi.fn().mockResolvedValue({
        spreadsheetId: 'sheet-id',
        sheets: [
          {
            properties: {
              title: 'Ledger',
            },
          },
        ],
      }),
      readRange: vi.fn().mockResolvedValue({
        range: 'Categories!A2:F',
        values: [],
      }),
    };

    await expect(
      setupSpreadsheet({
        accessToken: 'token',
        googleSheetsClient,
        spreadsheetId: 'sheet-id',
      }),
    ).resolves.toEqual({
      createdSheets: ['Categories', 'Summary', 'MonthlyStats', 'CategoryStats', 'Settings'],
      status: 'ready',
    });
    expect(googleSheetsClient.batchUpdateSpreadsheet).toHaveBeenCalledWith({
      accessToken: 'token',
      requests: expect.arrayContaining([
        {
          addSheet: {
            properties: {
              title: 'Categories',
            },
          },
        },
      ]),
      spreadsheetId: 'sheet-id',
    });
    expect(googleSheetsClient.batchUpdateValues).toHaveBeenCalledWith({
      accessToken: 'token',
      data: expect.arrayContaining([
        expect.objectContaining({
          range: 'Ledger!A1:L1',
        }),
        expect.objectContaining({
          range: 'Categories!A2:F',
        }),
      ]),
      spreadsheetId: 'sheet-id',
    });
  });

  it('does not create sheets when all required sheets exist', async () => {
    const googleSheetsClient = {
      batchUpdateSpreadsheet: vi.fn().mockResolvedValue(undefined),
      batchUpdateValues: vi.fn().mockResolvedValue(undefined),
      getSpreadsheetMetadata: vi.fn().mockResolvedValue({
        spreadsheetId: 'sheet-id',
        sheets: [
          'Ledger',
          'Categories',
          'Summary',
          'MonthlyStats',
          'CategoryStats',
          'Settings',
        ].map((title) => ({
          properties: {
            title,
          },
        })),
      }),
      readRange: vi.fn().mockResolvedValue({
        range: 'Categories!A2:F',
        values: [['expense-food']],
      }),
    };

    await setupSpreadsheet({
      accessToken: 'token',
      googleSheetsClient,
      spreadsheetId: 'sheet-id',
    });

    expect(googleSheetsClient.batchUpdateSpreadsheet).not.toHaveBeenCalled();
    expect(googleSheetsClient.batchUpdateValues.mock.calls[0][0].data).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          range: 'Categories!A2:F',
        }),
      ]),
    );
  });
});
