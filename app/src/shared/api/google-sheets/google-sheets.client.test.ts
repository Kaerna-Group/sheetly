import { describe, expect, it, vi } from 'vitest';

import { createGoogleSheetsClient } from './google-sheets.client';

function createJsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
    },
    status: 200,
    ...init,
  });
}

describe('createGoogleSheetsClient', () => {
  it('reads a range with authorization header', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      createJsonResponse({
        range: 'Ledger!A1:B2',
        values: [['id']],
      }),
    );
    const client = createGoogleSheetsClient({ fetcher });

    await expect(
      client.readRange({
        accessToken: 'token',
        range: 'Ledger!A1:B2',
        spreadsheetId: 'sheet-id',
      }),
    ).resolves.toEqual({
      range: 'Ledger!A1:B2',
      values: [['id']],
    });

    expect(fetcher).toHaveBeenCalledWith(
      'https://sheets.googleapis.com/v4/spreadsheets/sheet-id/values/Ledger!A1%3AB2',
      {
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
        },
        method: 'GET',
      },
    );
  });

  it('appends values with USER_ENTERED input option', async () => {
    const fetcher = vi.fn().mockResolvedValue(createJsonResponse({}));
    const client = createGoogleSheetsClient({ fetcher });

    await client.appendValues({
      accessToken: 'token',
      range: 'Ledger!A:L',
      spreadsheetId: 'sheet-id',
      values: [['1']],
    });

    const [url, init] = fetcher.mock.calls[0];

    expect(url).toBe(
      'https://sheets.googleapis.com/v4/spreadsheets/sheet-id/values/Ledger!A%3AL:append?valueInputOption=USER_ENTERED',
    );
    expect(init.body).toBe(JSON.stringify({ values: [['1']] }));
  });

  it('batch updates values with USER_ENTERED input option', async () => {
    const fetcher = vi.fn().mockResolvedValue(createJsonResponse({}));
    const client = createGoogleSheetsClient({ fetcher });

    await client.batchUpdateValues({
      accessToken: 'token',
      data: [{ range: 'Summary!A1:B2', values: [['Metric', 'Value']] }],
      spreadsheetId: 'sheet-id',
    });

    const [, init] = fetcher.mock.calls[0];

    expect(init.body).toBe(
      JSON.stringify({
        data: [{ range: 'Summary!A1:B2', values: [['Metric', 'Value']] }],
        valueInputOption: 'USER_ENTERED',
      }),
    );
  });

  it('gets spreadsheet metadata', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      createJsonResponse({
        spreadsheetId: 'sheet-id',
        properties: { title: 'Budget' },
      }),
    );
    const client = createGoogleSheetsClient({ fetcher });

    await expect(
      client.getSpreadsheetMetadata({
        accessToken: 'token',
        spreadsheetId: 'sheet-id',
      }),
    ).resolves.toMatchObject({
      spreadsheetId: 'sheet-id',
    });

    expect(fetcher.mock.calls[0][0]).toContain('/spreadsheets/sheet-id?fields=');
  });
});
