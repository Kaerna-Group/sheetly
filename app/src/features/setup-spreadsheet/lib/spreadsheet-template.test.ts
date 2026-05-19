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
    ).toEqual(['Categories', 'Containers', 'Summary', 'MonthlyStats', 'CategoryStats', 'Settings']);
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

  it('builds template value ranges with default categories', () => {
    const ranges = buildTemplateValueRanges(true);

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
          range: 'Settings!A2:B2',
          values: [['templateVersion', '2']],
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
          range: 'CategoryStats!A1:D1',
          values: [['category', 'kind', 'total', 'count']],
        }),
      ]),
    );
  });

  it('skips default categories when requested', () => {
    expect(buildTemplateValueRanges(false).some((range) => range.range === 'Categories!A2:F')).toBe(
      false,
    );
  });
});
