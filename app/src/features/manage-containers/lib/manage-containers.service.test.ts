import { describe, expect, it, vi } from 'vitest';

import { createContainer, readContainers } from './manage-containers.service';

const metadataWithContainers = {
  spreadsheetId: 'sheet-id',
  sheets: [
    {
      properties: {
        title: 'Containers',
      },
    },
  ],
};

describe('manage containers service', () => {
  it('returns default containers without Google context', async () => {
    await expect(
      readContainers({
        accessToken: null,
        spreadsheetId: null,
      }),
    ).resolves.toMatchObject({
      templateStatus: 'unknown',
    });
  });

  it('reads containers from Google Sheets rows', async () => {
    await expect(
      readContainers({
        accessToken: 'token',
        googleSheetsClient: {
          appendValues: vi.fn(),
          getSpreadsheetMetadata: vi.fn().mockResolvedValue(metadataWithContainers),
          readRange: vi.fn().mockResolvedValue({
            values: [
              ['cash-uah', 'Cash', 'UAH', '#6366f1', 'wallet', 'TRUE', '2026-05-19T10:00:00.000Z'],
            ],
          }),
        },
        spreadsheetId: 'sheet-id',
      }),
    ).resolves.toMatchObject({
      containers: [
        {
          id: 'cash-uah',
          name: 'Cash',
        },
      ],
      templateStatus: 'ready',
    });
  });

  it('appends new containers to Google Sheets', async () => {
    const appendValues = vi.fn().mockResolvedValue(undefined);

    await expect(
      createContainer({
        accessToken: 'token',
        currency: 'UAH',
        existingContainers: [],
        googleSheetsClient: {
          appendValues,
          getSpreadsheetMetadata: vi.fn().mockResolvedValue(metadataWithContainers),
          readRange: vi.fn(),
        },
        name: 'Savings',
        spreadsheetId: 'sheet-id',
      }),
    ).resolves.toMatchObject({
      id: 'savings-uah',
      name: 'Savings',
    });

    expect(appendValues.mock.calls[0][0]).toMatchObject({
      range: 'Containers!A:G',
      spreadsheetId: 'sheet-id',
    });
  });
});
