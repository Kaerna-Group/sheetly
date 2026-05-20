import { useState } from 'react';

import { useGoogleAuth } from '@features/google-auth';
import { templateVersion } from '@shared/config/constants/sheet.constants';
import { localStorageService } from '@shared/lib/storage/local-storage.service';

import { setupSpreadsheet } from '../lib/setup-spreadsheet.service';
import type { SetupSpreadsheetStatus } from '../types/setup-spreadsheet-status.type';

export function useSetupSpreadsheet() {
  const googleAuth = useGoogleAuth();
  const spreadsheetId = localStorageService.get('spreadsheetId');
  const isCachedReady =
    Boolean(spreadsheetId) &&
    localStorageService.get('templateReadySpreadsheetId') === spreadsheetId &&
    localStorageService.get('templateReadyVersion') === templateVersion;
  const [status, setStatus] = useState<SetupSpreadsheetStatus>(isCachedReady ? 'ready' : 'idle');
  const [error, setError] = useState<string | null>(null);

  function cacheReadyStatus() {
    if (!spreadsheetId) {
      return;
    }

    localStorageService.set('templateReadySpreadsheetId', spreadsheetId);
    localStorageService.set('templateReadyVersion', templateVersion);
    localStorageService.set('templateReadyAt', new Date().toISOString());
  }

  function clearReadyStatus() {
    localStorageService.remove('templateReadySpreadsheetId');
    localStorageService.remove('templateReadyVersion');
    localStorageService.remove('templateReadyAt');
  }

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
      cacheReadyStatus();
      setStatus('ready');
    } catch (caughtError) {
      clearReadyStatus();
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
