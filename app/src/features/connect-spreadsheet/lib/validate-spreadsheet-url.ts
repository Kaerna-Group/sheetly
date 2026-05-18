import { extractSpreadsheetId } from './extract-spreadsheet-id';

export function validateSpreadsheetUrl(value: string) {
  return extractSpreadsheetId(value) !== null;
}
