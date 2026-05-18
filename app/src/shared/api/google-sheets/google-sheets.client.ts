import type { AppendValuesRequest } from './types/append-values-request.type';
import type { BatchUpdateValuesRequest } from './types/batch-update-request.type';
import type { ValueRange } from './types/value-range.type';

export type ReadRangeRequest = {
  accessToken: string;
  range: string;
  spreadsheetId: string;
};

export type GoogleSheetsClient = {
  appendValues: (request: AppendValuesRequest) => Promise<void>;
  batchUpdateValues: (request: BatchUpdateValuesRequest) => Promise<void>;
  readRange: (request: ReadRangeRequest) => Promise<ValueRange>;
};

export function createGoogleSheetsClient(): GoogleSheetsClient {
  return {
    async appendValues() {
      throw new Error(
        'Google Sheets appendValues is planned for the Google Integration milestone.',
      );
    },
    async batchUpdateValues() {
      throw new Error(
        'Google Sheets batchUpdateValues is planned for the Google Integration milestone.',
      );
    },
    async readRange() {
      throw new Error('Google Sheets readRange is planned for the Google Integration milestone.');
    },
  };
}
