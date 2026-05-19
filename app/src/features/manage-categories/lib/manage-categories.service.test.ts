import { describe, expect, it, vi } from 'vitest';

import { createCategory, readCategories } from './manage-categories.service';

const metadataWithCategories = {
  spreadsheetId: 'sheet-id',
  sheets: [
    {
      properties: {
        title: 'Categories',
      },
    },
  ],
};

describe('manage categories service', () => {
  it('returns default categories without Google context', async () => {
    await expect(readCategories({ accessToken: null, spreadsheetId: null })).resolves.toEqual({
      categories: expect.arrayContaining([
        expect.objectContaining({
          id: 'food',
        }),
      ]),
      templateStatus: 'unknown',
      warning: null,
    });
  });

  it('reads categories from Google Sheets rows', async () => {
    const getSpreadsheetMetadata = vi.fn().mockResolvedValue(metadataWithCategories);
    const readRange = vi.fn().mockResolvedValue({
      values: [['expense-food', 'Food', 'expense', '#ef4444', 'tag', 'TRUE']],
    });

    await expect(
      readCategories({
        accessToken: 'token',
        googleSheetsClient: {
          appendValues: vi.fn(),
          getSpreadsheetMetadata,
          readRange,
        },
        spreadsheetId: 'sheet-id',
      }),
    ).resolves.toEqual({
      categories: [
        {
          id: 'expense-food',
          name: 'Food',
          kind: 'expense',
          color: '#ef4444',
          icon: 'tag',
          isDefault: true,
        },
      ],
      templateStatus: 'ready',
      warning: null,
    });
  });

  it('returns fallback categories without reading values when Categories sheet is missing', async () => {
    const getSpreadsheetMetadata = vi.fn().mockResolvedValue({
      spreadsheetId: 'sheet-id',
      sheets: [
        {
          properties: {
            title: 'Ledger',
          },
        },
      ],
    });
    const readRange = vi.fn();

    await expect(
      readCategories({
        accessToken: 'token',
        googleSheetsClient: {
          appendValues: vi.fn(),
          getSpreadsheetMetadata,
          readRange,
        },
        spreadsheetId: 'sheet-id',
      }),
    ).resolves.toEqual({
      categories: expect.arrayContaining([
        expect.objectContaining({
          id: 'food',
        }),
      ]),
      templateStatus: 'needs-setup',
      warning:
        'Spreadsheet template is not ready. Open Settings and run setup before creating categories.',
    });

    expect(readRange).not.toHaveBeenCalled();
  });

  it('does not create duplicates', async () => {
    const existingCategories = [
      {
        id: 'expense-food',
        name: 'Food',
        kind: 'expense' as const,
        color: '#ef4444',
        icon: 'tag',
        isDefault: true,
      },
    ];
    const appendValues = vi.fn();

    await expect(
      createCategory({
        accessToken: 'token',
        existingCategories,
        googleSheetsClient: {
          appendValues,
          getSpreadsheetMetadata: vi.fn(),
          readRange: vi.fn(),
        },
        kind: 'expense',
        name: ' food ',
        spreadsheetId: 'sheet-id',
      }),
    ).resolves.toEqual(existingCategories[0]);
    expect(appendValues).not.toHaveBeenCalled();
  });

  it('appends new categories to Google Sheets', async () => {
    const appendValues = vi.fn().mockResolvedValue(undefined);
    const getSpreadsheetMetadata = vi.fn().mockResolvedValue(metadataWithCategories);

    await expect(
      createCategory({
        accessToken: 'token',
        existingCategories: [],
        googleSheetsClient: {
          appendValues,
          getSpreadsheetMetadata,
          readRange: vi.fn(),
        },
        kind: 'expense',
        name: 'Coffee',
        spreadsheetId: 'sheet-id',
      }),
    ).resolves.toMatchObject({
      id: 'expense-coffee',
      name: 'Coffee',
    });

    expect(appendValues).toHaveBeenCalledWith({
      accessToken: 'token',
      range: 'Categories!A:F',
      spreadsheetId: 'sheet-id',
      values: [['expense-coffee', 'Coffee', 'expense', '#6366f1', 'tag', 'FALSE']],
    });
  });

  it('blocks category creation until spreadsheet template is ready', async () => {
    await expect(
      createCategory({
        accessToken: 'token',
        existingCategories: [],
        googleSheetsClient: {
          appendValues: vi.fn(),
          getSpreadsheetMetadata: vi.fn().mockResolvedValue({
            spreadsheetId: 'sheet-id',
            sheets: [],
          }),
          readRange: vi.fn(),
        },
        kind: 'expense',
        name: 'Coffee',
        spreadsheetId: 'sheet-id',
      }),
    ).rejects.toThrow('Spreadsheet template is not ready');
  });
});
