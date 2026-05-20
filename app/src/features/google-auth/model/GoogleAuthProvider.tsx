import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { envConfig } from '@app/config/env-config';
import { googleSheetsScopes } from '@shared/api/google-sheets';
import { localStorageService } from '@shared/lib/storage/local-storage.service';

import { createGoogleAuthClient } from '../api/google-auth.client';
import type { GoogleAccessToken } from '../types/google-token.type';
import type { GoogleAuthRequestOptions, GoogleAuthState } from '../types/google-auth-state.type';
import { GoogleAuthContext } from './google-auth.context';

type GoogleAuthProviderProps = {
  children: ReactNode;
};

export function GoogleAuthProvider({ children }: GoogleAuthProviderProps) {
  const [accessToken, setAccessToken] = useState<GoogleAccessToken | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<GoogleAuthState['status']>('idle');

  const requestAccessToken = useCallback(async (options: GoogleAuthRequestOptions = {}) => {
    const mode = options.mode ?? 'interactive';

    if (!envConfig.googleClientId) {
      const message = 'Set VITE_GOOGLE_CLIENT_ID to enable Google authorization.';

      if (mode === 'interactive') {
        setError(message);
        setStatus('error');
      }

      return null;
    }

    setStatus(mode === 'silent' ? 'restoring' : 'loading');
    setError(null);

    try {
      const client = createGoogleAuthClient({
        clientId: envConfig.googleClientId,
        scope: googleSheetsScopes.spreadsheets,
      });
      const token = await client.requestAccessToken({
        prompt: mode === 'silent' ? '' : 'select_account',
        timeoutMs: mode === 'silent' ? 5000 : 30000,
      });

      if (mode === 'interactive') {
        localStorageService.set('googleAuthEverConnected', 'true');
      }

      setAccessToken(token);
      setStatus('connected');
      return token;
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Google authorization failed.';

      setAccessToken(null);

      if (mode === 'silent') {
        setError(null);
        setStatus('idle');
      } else {
        setError(message);
        setStatus('error');
      }

      return null;
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccessToken(null);
    setError(null);
    localStorageService.remove('googleAuthEverConnected');
    setStatus('idle');
  }, []);

  const value = useMemo<GoogleAuthState>(
    () => ({
      accessToken,
      disconnect,
      error,
      isConfigured: envConfig.isGoogleAuthConfigured,
      requestAccessToken,
      status,
    }),
    [accessToken, disconnect, error, requestAccessToken, status],
  );

  useEffect(() => {
    if (
      !envConfig.isGoogleAuthConfigured ||
      localStorageService.get('googleAuthEverConnected') !== 'true'
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void requestAccessToken({ mode: 'silent' });
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [requestAccessToken]);

  return <GoogleAuthContext.Provider value={value}>{children}</GoogleAuthContext.Provider>;
}
