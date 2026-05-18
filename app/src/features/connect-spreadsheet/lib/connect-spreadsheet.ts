import { GoogleSheetsApiError, type GoogleSheetsClient } from '@shared/api/google-sheets';
import type { LocalStorageKey } from '@shared/lib/storage/storage-keys';

import { extractSpreadsheetId } from './extract-spreadsheet-id';
import type { SpreadsheetConnection } from '../types/spreadsheet-connection.type';

type StoragePort = {
  set: (key: LocalStorageKey, value: string) => void;
};

type ConnectSpreadsheetParams = {
  accessToken: string | null;
  googleSheetsClient: Pick<GoogleSheetsClient, 'getSpreadsheetMetadata'>;
  storage: StoragePort;
  value: string;
};

export type ConnectSpreadsheetResult = SpreadsheetConnection & {
  error: string | null;
};

export async function connectSpreadsheet({
  accessToken,
  googleSheetsClient,
  storage,
  value,
}: ConnectSpreadsheetParams): Promise<ConnectSpreadsheetResult> {
  const spreadsheetId = extractSpreadsheetId(value);

  if (!spreadsheetId) {
    return {
      error: 'Paste a valid Google Sheets URL or spreadsheet id.',
      spreadsheetId: null,
      status: 'invalid',
    };
  }

  if (!accessToken) {
    storage.set('spreadsheetId', spreadsheetId);

    return {
      error: null,
      spreadsheetId,
      status: 'needs-auth',
    };
  }

  try {
    await googleSheetsClient.getSpreadsheetMetadata({
      accessToken,
      spreadsheetId,
    });
    storage.set('spreadsheetId', spreadsheetId);

    return {
      error: null,
      spreadsheetId,
      status: 'connected',
    };
  } catch (error) {
    if (error instanceof GoogleSheetsApiError && ['forbidden', 'not-found'].includes(error.code)) {
      return {
        error: error.message,
        spreadsheetId,
        status: 'no-access',
      };
    }

    return {
      error: error instanceof Error ? error.message : 'Could not verify spreadsheet access.',
      spreadsheetId,
      status: 'error',
    };
  }
}
