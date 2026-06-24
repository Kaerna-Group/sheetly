import { describe, expect, it, vi } from 'vitest';

import { readCurrencies } from './manage-currencies.service';

const metadataWithCurrencies = {
  spreadsheetId: 'sheet-id',
  sheets: [
    {
      properties: {
        title: 'Currencies',
      },
    },
  ],
};

describe('manage currencies service', () => {
  it('returns default currencies without Google context', async () => {
    await expect(readCurrencies({ accessToken: null, spreadsheetId: null })).resolves.toEqual({
      currencies: expect.arrayContaining([
        expect.objectContaining({ code: 'UAH' }),
        expect.objectContaining({ code: 'USD' }),
      ]),
      templateStatus: 'unknown',
      warning: null,
    });
  });

  it('reads currencies from Google Sheets rows including disabled ones', async () => {
    const getSpreadsheetMetadata = vi.fn().mockResolvedValue(metadataWithCurrencies);
    const readRange = vi.fn().mockResolvedValue({
      values: [
        ['uah', 'UAH', 'Ukrainian Hryvnia', '₴', '2', 'TRUE', 'TRUE'],
        ['rub', 'RUB', 'Russian Ruble', '₽', '2', 'TRUE', 'FALSE'],
      ],
    });

    await expect(
      readCurrencies({
        accessToken: 'token',
        googleSheetsClient: { getSpreadsheetMetadata, readRange },
        spreadsheetId: 'sheet-id',
      }),
    ).resolves.toEqual({
      currencies: [
        {
          id: 'uah',
          code: 'UAH',
          name: 'Ukrainian Hryvnia',
          symbol: '₴',
          decimalDigits: 2,
          isDefault: true,
          isEnabled: true,
        },
        {
          id: 'rub',
          code: 'RUB',
          name: 'Russian Ruble',
          symbol: '₽',
          decimalDigits: 2,
          isDefault: true,
          isEnabled: false,
        },
      ],
      templateStatus: 'ready',
      warning: null,
    });
  });

  it('falls back to defaults without reading values when Currencies sheet is missing', async () => {
    const getSpreadsheetMetadata = vi.fn().mockResolvedValue({
      spreadsheetId: 'sheet-id',
      sheets: [{ properties: { title: 'Ledger' } }],
    });
    const readRange = vi.fn();

    const result = await readCurrencies({
      accessToken: 'token',
      googleSheetsClient: { getSpreadsheetMetadata, readRange },
      spreadsheetId: 'sheet-id',
    });

    expect(result.templateStatus).toBe('needs-setup');
    expect(result.warning).toContain('Spreadsheet template is not ready');
    expect(result.currencies).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'UAH' })]),
    );
    expect(readRange).not.toHaveBeenCalled();
  });

  it('falls back to defaults when the sheet has no rows', async () => {
    const getSpreadsheetMetadata = vi.fn().mockResolvedValue(metadataWithCurrencies);
    const readRange = vi.fn().mockResolvedValue({ values: [] });

    const result = await readCurrencies({
      accessToken: 'token',
      googleSheetsClient: { getSpreadsheetMetadata, readRange },
      spreadsheetId: 'sheet-id',
    });

    expect(result.templateStatus).toBe('ready');
    expect(result.currencies.length).toBeGreaterThan(0);
  });
});
