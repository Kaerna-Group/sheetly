import { describe, expect, it, vi } from 'vitest';

import { createCategory, readCategories } from './manage-categories.service';

describe('manage categories service', () => {
  it('returns default categories without Google context', async () => {
    await expect(readCategories({ accessToken: null, spreadsheetId: null })).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'food',
        }),
      ]),
    );
  });

  it('reads categories from Google Sheets rows', async () => {
    const readRange = vi.fn().mockResolvedValue({
      values: [['expense-food', 'Food', 'expense', '#ef4444', 'tag', 'TRUE']],
    });

    await expect(
      readCategories({
        accessToken: 'token',
        googleSheetsClient: {
          appendValues: vi.fn(),
          readRange,
        },
        spreadsheetId: 'sheet-id',
      }),
    ).resolves.toEqual([
      {
        id: 'expense-food',
        name: 'Food',
        kind: 'expense',
        color: '#ef4444',
        icon: 'tag',
        isDefault: true,
      },
    ]);
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

    await expect(
      createCategory({
        accessToken: 'token',
        existingCategories: [],
        googleSheetsClient: {
          appendValues,
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
});
