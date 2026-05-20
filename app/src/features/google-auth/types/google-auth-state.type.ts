import type { GoogleAccessToken } from './google-token.type';

export type GoogleAuthState = {
  accessToken: GoogleAccessToken | null;
  disconnect: () => void;
  error: string | null;
  isConfigured: boolean;
  requestAccessToken: (options?: GoogleAuthRequestOptions) => Promise<GoogleAccessToken | null>;
  status: 'idle' | 'restoring' | 'loading' | 'connected' | 'error';
};

export type GoogleAuthRequestOptions = {
  mode?: 'interactive' | 'silent';
};
