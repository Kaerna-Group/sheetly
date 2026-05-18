export type EnvConfig = {
  googleClientId?: string;
  isGoogleAuthConfigured: boolean;
};

type RawEnv = {
  VITE_GOOGLE_CLIENT_ID?: string;
};

export function createEnvConfig(env: RawEnv): EnvConfig {
  const googleClientId = env.VITE_GOOGLE_CLIENT_ID?.trim();

  return {
    googleClientId: googleClientId || undefined,
    isGoogleAuthConfigured: Boolean(googleClientId),
  };
}

export const envConfig = createEnvConfig({
  VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
});
