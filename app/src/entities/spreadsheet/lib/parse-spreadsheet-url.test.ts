import { describe, expect, it } from 'vitest';

import { parseSpreadsheetUrl } from './parse-spreadsheet-url';

describe('parseSpreadsheetUrl', () => {
  it('extracts id from a Google Sheets URL', () => {
    expect(
      parseSpreadsheetUrl(
        'https://docs.google.com/spreadsheets/d/1x2y3z4-sheetly-id-567890/edit#gid=0',
      ),
    ).toBe('1x2y3z4-sheetly-id-567890');
  });

  it('accepts a raw spreadsheet id', () => {
    expect(parseSpreadsheetUrl('1x2y3z4-sheetly-id-567890')).toBe('1x2y3z4-sheetly-id-567890');
  });

  it('rejects invalid values', () => {
    expect(parseSpreadsheetUrl('not a sheet')).toBeNull();
  });
});
