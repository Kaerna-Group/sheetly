import { describe, expect, it } from 'vitest';

import { createEnvConfig } from './env-config';

describe('createEnvConfig', () => {
  it('marks Google auth as unconfigured without client id', () => {
    expect(createEnvConfig({}).isGoogleAuthConfigured).toBe(false);
  });

  it('trims and exposes configured Google client id', () => {
    expect(createEnvConfig({ VITE_GOOGLE_CLIENT_ID: ' client-id ' })).toEqual({
      googleClientId: 'client-id',
      isGoogleAuthConfigured: true,
    });
  });
});
