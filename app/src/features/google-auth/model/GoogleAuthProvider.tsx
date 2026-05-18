import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { envConfig } from '@app/config/env-config';
import { googleSheetsScopes } from '@shared/api/google-sheets';

import { createGoogleAuthClient } from '../api/google-auth.client';
import type { GoogleAccessToken } from '../types/google-token.type';
import type { GoogleAuthState } from '../types/google-auth-state.type';
import { GoogleAuthContext } from './google-auth.context';

type GoogleAuthProviderProps = {
  children: ReactNode;
};

export function GoogleAuthProvider({ children }: GoogleAuthProviderProps) {
  const [accessToken, setAccessToken] = useState<GoogleAccessToken | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<GoogleAuthState['status']>('idle');

  const requestAccessToken = useCallback(async () => {
    if (!envConfig.googleClientId) {
      const message = 'Set VITE_GOOGLE_CLIENT_ID to enable Google authorization.';
      setError(message);
      setStatus('error');
      return null;
    }

    setStatus('loading');
    setError(null);

    try {
      const client = createGoogleAuthClient({
        clientId: envConfig.googleClientId,
        scope: googleSheetsScopes.spreadsheets,
      });
      const token = await client.requestAccessToken();

      setAccessToken(token);
      setStatus('connected');
      return token;
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Google authorization failed.';

      setAccessToken(null);
      setError(message);
      setStatus('error');
      return null;
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccessToken(null);
    setError(null);
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

  return <GoogleAuthContext.Provider value={value}>{children}</GoogleAuthContext.Provider>;
}
