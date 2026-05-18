import { parseSpreadsheetUrl } from '@entities/spreadsheet';

export function extractSpreadsheetId(value: string) {
  return parseSpreadsheetUrl(value);
}
