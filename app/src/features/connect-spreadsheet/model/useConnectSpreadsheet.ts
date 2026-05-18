import { useState } from 'react';

import { localStorageService } from '@shared/lib/storage/local-storage.service';

import { extractSpreadsheetId } from '../lib/extract-spreadsheet-id';

export function useConnectSpreadsheet(onConnected?: () => void) {
  const [error, setError] = useState<string | null>(null);

  function connect(value: string) {
    const spreadsheetId = extractSpreadsheetId(value);

    if (!spreadsheetId) {
      setError('Paste a valid Google Sheets URL or spreadsheet id.');
      return;
    }

    localStorageService.set('spreadsheetId', spreadsheetId);
    setError(null);
    onConnected?.();
  }

  return {
    connect,
    error,
  };
}
