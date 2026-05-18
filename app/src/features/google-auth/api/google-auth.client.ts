export type GoogleAuthClient = {
  requestAccessToken: () => Promise<string>;
};

export function createGoogleAuthClient(): GoogleAuthClient {
  return {
    async requestAccessToken() {
      throw new Error('Google OAuth is planned for the Google Integration milestone.');
    },
  };
}
