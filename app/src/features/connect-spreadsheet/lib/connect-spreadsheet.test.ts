import { describe, expect, it, vi } from 'vitest';

import { GoogleSheetsApiError } from '@shared/api/google-sheets';

import { connectSpreadsheet } from './connect-spreadsheet';

function createStorageMock() {
  return {
    set: vi.fn(),
  };
}

describe('connectSpreadsheet', () => {
  it('rejects invalid URLs', async () => {
    const storage = createStorageMock();

    await expect(
      connectSpreadsheet({
        accessToken: null,
        googleSheetsClient: { getSpreadsheetMetadata: vi.fn() },
        storage,
        value: 'invalid',
      }),
    ).resolves.toMatchObject({
      spreadsheetId: null,
      status: 'invalid',
    });
    expect(storage.set).not.toHaveBeenCalled();
  });

  it('saves id and marks connection as needing auth without token', async () => {
    const storage = createStorageMock();

    await expect(
      connectSpreadsheet({
        accessToken: null,
        googleSheetsClient: { getSpreadsheetMetadata: vi.fn() },
        storage,
        value: 'https://docs.google.com/spreadsheets/d/1abcdefghijklmnopqrstuvwxyzABCDE/edit',
      }),
    ).resolves.toMatchObject({
      spreadsheetId: '1abcdefghijklmnopqrstuvwxyzABCDE',
      status: 'needs-auth',
    });
    expect(storage.set).toHaveBeenCalledWith('spreadsheetId', '1abcdefghijklmnopqrstuvwxyzABCDE');
  });

  it('checks metadata and marks connection as connected with token', async () => {
    const storage = createStorageMock();
    const getSpreadsheetMetadata = vi.fn().mockResolvedValue({ spreadsheetId: 'sheet-id' });

    await expect(
      connectSpreadsheet({
        accessToken: 'token',
        googleSheetsClient: { getSpreadsheetMetadata },
        storage,
        value: 'https://docs.google.com/spreadsheets/d/1abcdefghijklmnopqrstuvwxyzABCDE/edit',
      }),
    ).resolves.toMatchObject({
      status: 'connected',
    });
    expect(getSpreadsheetMetadata).toHaveBeenCalledWith({
      accessToken: 'token',
      spreadsheetId: '1abcdefghijklmnopqrstuvwxyzABCDE',
    });
  });

  it('maps forbidden metadata checks to no-access', async () => {
    const storage = createStorageMock();

    await expect(
      connectSpreadsheet({
        accessToken: 'token',
        googleSheetsClient: {
          getSpreadsheetMetadata: vi
            .fn()
            .mockRejectedValue(new GoogleSheetsApiError('forbidden', 'No access', 403)),
        },
        storage,
        value: 'https://docs.google.com/spreadsheets/d/1abcdefghijklmnopqrstuvwxyzABCDE/edit',
      }),
    ).resolves.toMatchObject({
      status: 'no-access',
    });
  });
});
