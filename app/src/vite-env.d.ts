/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_GOOGLE_CLIENT_ID?: string;
  }

  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: GoogleTokenClientConfig) => GoogleTokenClient;
          revoke: (accessToken: string, done: () => void) => void;
        };
      };
    };
  }

  type GoogleTokenClientConfig = {
    callback: (response: GoogleTokenResponse) => void;
    client_id: string;
    error_callback?: (error: GoogleTokenError) => void;
    scope: string;
  };

  type GoogleTokenClient = {
    requestAccessToken: (overrideConfig?: GoogleTokenRequestOptions) => void;
  };

  type GoogleTokenRequestOptions = {
    prompt?: '' | 'consent' | 'select_account';
  };

  type GoogleTokenResponse = {
    access_token?: string;
    error?: string;
    error_description?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  };

  type GoogleTokenError = {
    message?: string;
    type?: string;
  };
}

export {};
