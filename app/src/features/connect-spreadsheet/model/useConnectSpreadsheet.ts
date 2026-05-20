import { useState } from 'react';

import { useGoogleAuth } from '@features/google-auth';
import { createGoogleSheetsClient } from '@shared/api/google-sheets';
import { localStorageService } from '@shared/lib/storage/local-storage.service';

import { connectSpreadsheet } from '../lib/connect-spreadsheet';
import type { SpreadsheetConnection } from '../types/spreadsheet-connection.type';

export function useConnectSpreadsheet(onConnected?: () => void) {
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<SpreadsheetConnection>({
    spreadsheetId: null,
    status: 'idle',
  });
  const googleAuth = useGoogleAuth();

  async function connect(value: string) {
    setConnection((currentConnection) => ({
      ...currentConnection,
      status: 'checking',
    }));
    setError(null);

    const result = await connectSpreadsheet({
      accessToken: googleAuth.accessToken,
      googleSheetsClient: createGoogleSheetsClient(),
      storage: localStorageService,
      value,
    });

    setConnection({
      spreadsheetId: result.spreadsheetId,
      status: result.status,
    });
    setError(result.error);

    if (result.status === 'invalid' || result.status === 'no-access' || result.status === 'error') {
      return;
    }

    onConnected?.();
    window.dispatchEvent(new Event('sheetly:spreadsheet-connected'));
  }

  return {
    connect,
    connection,
    error,
    isChecking: connection.status === 'checking',
  };
}
