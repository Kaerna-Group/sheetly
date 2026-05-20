import { afterEach, describe, expect, it, vi } from 'vitest';

import { createGoogleAuthClient } from './google-auth.client';

describe('createGoogleAuthClient', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('passes prompt options and resolves access token', async () => {
    vi.useFakeTimers();
    const requestAccessToken = vi.fn();
    const getGoogle = vi.fn(() => ({
      accounts: {
        oauth2: {
          initTokenClient: vi.fn((config) => {
            window.setTimeout(() => {
              config.callback({
                access_token: 'token',
              });
            }, 1);

            return {
              requestAccessToken,
            };
          }),
          revoke: vi.fn(),
        },
      },
    }));
    const client = createGoogleAuthClient({
      clientId: 'client-id',
      getGoogle,
      scope: 'scope',
    });
    const tokenPromise = client.requestAccessToken({
      prompt: '',
      timeoutMs: 5000,
    });

    await vi.advanceTimersByTimeAsync(101);
    await vi.advanceTimersByTimeAsync(1);

    await expect(tokenPromise).resolves.toBe('token');
    expect(requestAccessToken).toHaveBeenCalledWith({
      prompt: '',
    });
  });

  it('rejects when Google token flow does not answer before timeout', async () => {
    vi.useFakeTimers();
    const getGoogle = vi.fn(() => ({
      accounts: {
        oauth2: {
          initTokenClient: vi.fn(() => ({
            requestAccessToken: vi.fn(),
          })),
          revoke: vi.fn(),
        },
      },
    }));
    const client = createGoogleAuthClient({
      clientId: 'client-id',
      getGoogle,
      scope: 'scope',
    });
    const tokenPromise = client.requestAccessToken({
      prompt: '',
      timeoutMs: 500,
    });

    const assertion = expect(tokenPromise).rejects.toThrow('Silent Google authorization timed out');

    await vi.advanceTimersByTimeAsync(101);
    await vi.advanceTimersByTimeAsync(500);
    await assertion;
  });
});
