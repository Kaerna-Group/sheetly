export type GoogleAuthClient = {
  requestAccessToken: () => Promise<string>;
};

type CreateGoogleAuthClientParams = {
  clientId: string;
  getGoogle?: () => Window['google'];
  scope: string;
};

export function createGoogleAuthClient({
  clientId,
  getGoogle = () => window.google,
  scope,
}: CreateGoogleAuthClientParams): GoogleAuthClient {
  return {
    async requestAccessToken() {
      const google = getGoogle();

      if (!google?.accounts.oauth2) {
        throw new Error('Google Identity Services script is not loaded yet.');
      }

      return new Promise<string>((resolve, reject) => {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope,
          callback: (response) => {
            if (response.error) {
              reject(new Error(response.error_description || response.error));
              return;
            }

            if (!response.access_token) {
              reject(new Error('Google did not return an access token.'));
              return;
            }

            resolve(response.access_token);
          },
          error_callback: (error) => {
            reject(new Error(error.message || error.type || 'Google OAuth failed.'));
          },
        });

        client.requestAccessToken();
      });
    },
  };
}
