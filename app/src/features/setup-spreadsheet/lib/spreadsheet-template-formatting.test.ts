import { describe, expect, it } from 'vitest';

import { buildTemplateFormattingRequests } from './spreadsheet-template-formatting';

const metadata = {
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
};

describe('spreadsheet template formatting', () => {
  it('builds freeze, header, filter and width requests for sheets', () => {
    const requests = buildTemplateFormattingRequests(metadata);

    expect(requests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          updateSheetProperties: expect.objectContaining({
            fields: 'gridProperties.frozenRowCount,tabColor',
          }),
        }),
        expect.objectContaining({
          setBasicFilter: expect.objectContaining({
            filter: expect.objectContaining({
              range: expect.objectContaining({
                sheetId: 1,
              }),
            }),
          }),
        }),
        expect.objectContaining({
          updateDimensionProperties: expect.objectContaining({
            fields: 'pixelSize',
          }),
        }),
      ]),
    );
  });

  it('adds Ledger number and date formats', () => {
    const requests = buildTemplateFormattingRequests(metadata);

    expect(requests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          repeatCell: expect.objectContaining({
            cell: expect.objectContaining({
              userEnteredFormat: {
                numberFormat: {
                  pattern: 'yyyy-mm-dd',
                  type: 'DATE',
                },
              },
            }),
            range: expect.objectContaining({
              sheetId: 1,
              startColumnIndex: 1,
            }),
          }),
        }),
      ]),
    );
  });

  it('skips sheets without sheet ids', () => {
    expect(
      buildTemplateFormattingRequests({
        spreadsheetId: 'sheet-id',
        sheets: [{ properties: { title: 'Ledger' } }],
      }),
    ).toEqual([]);
  });
});
