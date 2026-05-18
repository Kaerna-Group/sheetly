import type { GoogleAccessToken } from './google-token.type';

export type GoogleAuthState = {
  accessToken: GoogleAccessToken | null;
  status: 'idle' | 'connected' | 'error';
};
