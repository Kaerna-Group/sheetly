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
    ).toEqual(['Categories', 'Summary', 'MonthlyStats', 'CategoryStats', 'Settings']);
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
          range: 'Ledger!A1:L1',
        }),
        expect.objectContaining({
          range: 'Categories!A2:F',
        }),
        expect.objectContaining({
          range: 'Settings!A2:B2',
          values: [['templateVersion', '1']],
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
