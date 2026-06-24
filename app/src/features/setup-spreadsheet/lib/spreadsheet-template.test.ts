import { describe, expect, it } from 'vitest';

import {
  buildAddSheetRequests,
  buildTemplateValueRanges,
  getMissingSheetNames,
} from './spreadsheet-template';

describe('spreadsheet template helpers', () => {
  it('detects missing sheets from metadata', () => {
    expect(
      getMissingSheetNames({
        spreadsheetId: 'sheet-id',
        sheets: [
          {
            properties: {
              title: 'Ledger',
            },
          },
        ],
      }),
    ).toEqual([
      'Categories',
      'Containers',
      'Currencies',
      'Summary',
      'MonthlyStats',
      'CategoryStats',
      'Settings',
    ]);
  });

  it('builds addSheet requests', () => {
    expect(buildAddSheetRequests(['Ledger'])).toEqual([
      {
        addSheet: {
          properties: {
            title: 'Ledger',
          },
        },
      },
    ]);
  });

  it('builds template value ranges with default categories and currencies', () => {
    const ranges = buildTemplateValueRanges({
      includeDefaultCategories: true,
      includeDefaultCurrencies: true,
    });

    expect(ranges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          range: 'Ledger!A1:P1',
        }),
        expect.objectContaining({
          range: 'Categories!A2:F',
        }),
        expect.objectContaining({
          range: 'Containers!A2:G',
        }),
        expect.objectContaining({
          range: 'Currencies!A1:G1',
          values: [['id', 'code', 'name', 'symbol', 'decimalDigits', 'isDefault', 'isEnabled']],
        }),
        expect.objectContaining({
          range: 'Currencies!A2:G',
          values: expect.arrayContaining([
            ['uah', 'UAH', 'Ukrainian Hryvnia', '₴', '2', 'TRUE', 'TRUE'],
            ['jpy', 'JPY', 'Japanese Yen', '¥', '0', 'TRUE', 'TRUE'],
          ]),
        }),
        expect.objectContaining({
          range: 'Settings!A2:B2',
          values: [['templateVersion', '3']],
        }),
        expect.objectContaining({
          range: 'Summary!A:B',
          values: expect.arrayContaining([
            ['Total Income', '=SUMIF(Ledger!C:C,"income",Ledger!E:E)'],
            ['Total Expense', '=SUMIF(Ledger!C:C,"expense",Ledger!E:E)'],
          ]),
        }),
        expect.objectContaining({
          range: 'MonthlyStats!A1:D1',
          values: [['month', 'income', 'expense', 'balance']],
        }),
        expect.objectContaining({
          range: 'MonthlyStats!A2',
          values: [[expect.stringContaining('QUERY(FILTER')]],
        }),
        expect.objectContaining({
          range: 'CategoryStats!A1:D1',
          values: [['category', 'kind', 'total', 'count']],
        }),
        expect.objectContaining({
          range: 'CategoryStats!A2',
          values: [[expect.stringContaining('group by Col1, Col2')]],
        }),
      ]),
    );
  });

  it('always writes currency headers even when seed rows are skipped', () => {
    const ranges = buildTemplateValueRanges({
      includeDefaultCategories: false,
      includeDefaultCurrencies: false,
    });

    expect(ranges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          range: 'Currencies!A1:G1',
        }),
      ]),
    );
  });

  it('skips default categories and currencies when requested', () => {
    const ranges = buildTemplateValueRanges({
      includeDefaultCategories: false,
      includeDefaultCurrencies: false,
    });

    expect(ranges.some((range) => range.range === 'Categories!A2:F')).toBe(false);
    expect(ranges.some((range) => range.range === 'Currencies!A2:G')).toBe(false);
  });
});
