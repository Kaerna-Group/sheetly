import { describe, expect, it, vi } from 'vitest';

import { setupSpreadsheet } from './setup-spreadsheet.service';

describe('setupSpreadsheet', () => {
  it('creates only missing sheets and writes template values', async () => {
    const googleSheetsClient = {
      batchUpdateSpreadsheet: vi.fn().mockResolvedValue(undefined),
      batchUpdateValues: vi.fn().mockResolvedValue(undefined),
      getSpreadsheetMetadata: vi
        .fn()
        .mockResolvedValueOnce({
          spreadsheetId: 'sheet-id',
          sheets: [
            {
              properties: {
                sheetId: 1,
                title: 'Ledger',
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          spreadsheetId: 'sheet-id',
          sheets: [
            'Ledger',
            'Categories',
            'Containers',
            'Summary',
            'MonthlyStats',
            'CategoryStats',
            'Settings',
          ].map((title, index) => ({
            properties: {
              sheetId: index + 1,
              title,
            },
          })),
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
      createdSheets: [
        'Categories',
        'Containers',
        'Summary',
        'MonthlyStats',
        'CategoryStats',
        'Settings',
      ],
      status: 'ready',
    });
    expect(googleSheetsClient.batchUpdateSpreadsheet).toHaveBeenNthCalledWith(1, {
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
    expect(googleSheetsClient.batchUpdateSpreadsheet).toHaveBeenNthCalledWith(2, {
      accessToken: 'token',
      requests: expect.arrayContaining([
        expect.objectContaining({
          repeatCell: expect.any(Object),
        }),
        expect.objectContaining({
          updateDimensionProperties: expect.any(Object),
        }),
      ]),
      spreadsheetId: 'sheet-id',
    });
    expect(googleSheetsClient.batchUpdateValues).toHaveBeenCalledWith({
      accessToken: 'token',
      data: expect.arrayContaining([
        expect.objectContaining({
          range: 'Ledger!A1:P1',
        }),
        expect.objectContaining({
          range: 'Categories!A2:F',
        }),
        expect.objectContaining({
          range: 'Containers!A2:G',
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
          'Containers',
          'Summary',
          'MonthlyStats',
          'CategoryStats',
          'Settings',
        ].map((title, index) => ({
          properties: {
            sheetId: index + 1,
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

    expect(googleSheetsClient.batchUpdateSpreadsheet).toHaveBeenCalledWith({
      accessToken: 'token',
      requests: expect.arrayContaining([
        expect.objectContaining({
          setBasicFilter: expect.any(Object),
        }),
      ]),
      spreadsheetId: 'sheet-id',
    });
    expect(googleSheetsClient.batchUpdateValues.mock.calls[0][0].data).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          range: 'Categories!A2:F',
        }),
      ]),
    );
  });
});
