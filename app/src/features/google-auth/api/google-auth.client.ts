export type GoogleAuthClient = {
  requestAccessToken: (options?: RequestAccessTokenOptions) => Promise<string>;
};

export type RequestAccessTokenOptions = {
  prompt?: '' | 'consent' | 'select_account';
  timeoutMs?: number;
};

type CreateGoogleAuthClientParams = {
  clientId: string;
  getGoogle?: () => Window['google'];
  scope: string;
};

type GoogleIdentity = NonNullable<Window['google']>;

function waitForGoogleIdentityServices(getGoogle: () => Window['google']) {
  return new Promise<GoogleIdentity>((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 30;

    const intervalId = window.setInterval(() => {
      const google = getGoogle();

      attempts += 1;

      if (google?.accounts.oauth2) {
        window.clearInterval(intervalId);
        resolve(google as GoogleIdentity);
        return;
      }

      if (attempts >= maxAttempts) {
        window.clearInterval(intervalId);
        reject(new Error('Google Identity Services script is not loaded yet.'));
      }
    }, 100);
  });
}

function createTimeoutError(prompt: RequestAccessTokenOptions['prompt']) {
  return new Error(
    prompt === ''
      ? 'Silent Google authorization timed out.'
      : 'Google authorization timed out. Try connecting again.',
  );
}

export function createGoogleAuthClient({
  clientId,
  getGoogle = () => window.google,
  scope,
}: CreateGoogleAuthClientParams): GoogleAuthClient {
  return {
    async requestAccessToken(options = {}) {
      const google = await waitForGoogleIdentityServices(getGoogle);

      return new Promise<string>((resolve, reject) => {
        let isSettled = false;
        const timeoutId = window.setTimeout(() => {
          if (!isSettled) {
            isSettled = true;
            reject(createTimeoutError(options.prompt));
          }
        }, options.timeoutMs ?? 8000);
        const settle = (callback: () => void) => {
          if (isSettled) {
            return;
          }

          isSettled = true;
          window.clearTimeout(timeoutId);
          callback();
        };
        const client = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope,
          callback: (response) => {
            if (response.error) {
              settle(() => reject(new Error(response.error_description || response.error)));
              return;
            }

            if (!response.access_token) {
              settle(() => reject(new Error('Google did not return an access token.')));
              return;
            }

            const accessToken = response.access_token;

            settle(() => resolve(accessToken));
          },
          error_callback: (error) => {
            settle(() => reject(new Error(error.message || error.type || 'Google OAuth failed.')));
          },
        });

        client.requestAccessToken({
          prompt: options.prompt,
        });
      });
    },
  };
}
