import type { GoogleAccessToken } from './google-token.type';

export type GoogleAuthState = {
  accessToken: GoogleAccessToken | null;
  disconnect: () => void;
  error: string | null;
  isConfigured: boolean;
  requestAccessToken: () => Promise<GoogleAccessToken | null>;
  status: 'idle' | 'loading' | 'connected' | 'error';
};
