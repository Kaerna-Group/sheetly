import type { SpreadsheetId } from '../types/spreadsheet-id.type';

const spreadsheetPathPattern = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;

export function parseSpreadsheetUrl(value: string): SpreadsheetId | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const match = spreadsheetPathPattern.exec(trimmedValue);

  if (match?.[1]) {
    return match[1];
  }

  return /^[a-zA-Z0-9-_]{20,}$/.test(trimmedValue) ? trimmedValue : null;
}
