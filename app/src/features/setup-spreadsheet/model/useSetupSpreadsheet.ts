import { useState } from 'react';

import { useGoogleAuth } from '@features/google-auth';
import { localStorageService } from '@shared/lib/storage/local-storage.service';

import { setupSpreadsheet } from '../lib/setup-spreadsheet.service';
import type { SetupSpreadsheetStatus } from '../types/setup-spreadsheet-status.type';

export function useSetupSpreadsheet() {
  const googleAuth = useGoogleAuth();
  const spreadsheetId = localStorageService.get('spreadsheetId');
  const [status, setStatus] = useState<SetupSpreadsheetStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  async function runSetup() {
    if (!googleAuth.accessToken) {
      setStatus('error');
      setError('Connect Google before setting up the spreadsheet template.');
      return;
    }

    if (!spreadsheetId) {
      setStatus('error');
      setError('Connect a spreadsheet before setting up the template.');
      return;
    }

    setStatus('setting-up');
    setError(null);

    try {
      await setupSpreadsheet({
        accessToken: googleAuth.accessToken,
        spreadsheetId,
      });
      setStatus('ready');
    } catch (caughtError) {
      setStatus('error');
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not setup spreadsheet template.',
      );
    }
  }

  return {
    error,
    runSetup,
    status,
  };
}
