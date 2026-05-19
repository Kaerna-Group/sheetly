import type { AppendValuesRequest } from './types/append-values-request.type';
import type { BatchUpdateSpreadsheetRequest } from './types/batch-update-spreadsheet-request.type';
import type { BatchUpdateValuesRequest } from './types/batch-update-request.type';
import type { SpreadsheetMetadata } from './types/spreadsheet-metadata.type';
import type { ValueRange } from './types/value-range.type';
import { googleSheetsEndpoints } from './google-sheets.endpoints';
import { mapGoogleSheetsNetworkError, mapGoogleSheetsResponseError } from './google-sheets.errors';

export type ReadRangeRequest = {
  accessToken: string;
  range: string;
  spreadsheetId: string;
};

export type GetSpreadsheetMetadataRequest = {
  accessToken: string;
  spreadsheetId: string;
};

export type GoogleSheetsClient = {
  appendValues: (request: AppendValuesRequest) => Promise<void>;
  batchUpdateSpreadsheet: (request: BatchUpdateSpreadsheetRequest) => Promise<void>;
  batchUpdateValues: (request: BatchUpdateValuesRequest) => Promise<void>;
  getSpreadsheetMetadata: (request: GetSpreadsheetMetadataRequest) => Promise<SpreadsheetMetadata>;
  readRange: (request: ReadRangeRequest) => Promise<ValueRange>;
  updateValues: (request: AppendValuesRequest) => Promise<void>;
};

type CreateGoogleSheetsClientParams = {
  fetcher?: typeof fetch;
};

const valueInputOption = 'USER_ENTERED';

function buildAuthHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  return text ? (JSON.parse(text) as T) : ({} as T);
}

async function requestJson<T>(fetcher: typeof fetch, url: string, init: RequestInit): Promise<T> {
  try {
    const response = await fetcher(url, init);

    if (!response.ok) {
      throw mapGoogleSheetsResponseError(response.status, await parseJsonResponse(response));
    }

    return parseJsonResponse<T>(response);
  } catch (error) {
    throw mapGoogleSheetsNetworkError(error);
  }
}

export function createGoogleSheetsClient({
  fetcher = fetch,
}: CreateGoogleSheetsClientParams = {}): GoogleSheetsClient {
  return {
    async appendValues({ accessToken, range, spreadsheetId, values }) {
      const url = new URL(googleSheetsEndpoints.appendValues(spreadsheetId, range));
      url.searchParams.set('valueInputOption', valueInputOption);

      await requestJson(fetcher, url.toString(), {
        method: 'POST',
        headers: buildAuthHeaders(accessToken),
        body: JSON.stringify({ values }),
      });
    },
    async batchUpdateSpreadsheet({ accessToken, requests, spreadsheetId }) {
      await requestJson(fetcher, googleSheetsEndpoints.spreadsheetBatchUpdate(spreadsheetId), {
        method: 'POST',
        headers: buildAuthHeaders(accessToken),
        body: JSON.stringify({ requests }),
      });
    },
    async batchUpdateValues({ accessToken, data, spreadsheetId }) {
      await requestJson(fetcher, googleSheetsEndpoints.batchUpdateValues(spreadsheetId), {
        method: 'POST',
        headers: buildAuthHeaders(accessToken),
        body: JSON.stringify({
          data,
          valueInputOption,
        }),
      });
    },
    async getSpreadsheetMetadata({ accessToken, spreadsheetId }) {
      const url = new URL(googleSheetsEndpoints.spreadsheet(spreadsheetId));
      url.searchParams.set(
        'fields',
        'spreadsheetId,properties.title,sheets.properties(sheetId,title)',
      );

      return requestJson<SpreadsheetMetadata>(fetcher, url.toString(), {
        method: 'GET',
        headers: buildAuthHeaders(accessToken),
      });
    },
    async readRange({ accessToken, range, spreadsheetId }) {
      return requestJson<ValueRange>(fetcher, googleSheetsEndpoints.values(spreadsheetId, range), {
        method: 'GET',
        headers: buildAuthHeaders(accessToken),
      });
    },
    async updateValues({ accessToken, range, spreadsheetId, values }) {
      const url = new URL(googleSheetsEndpoints.values(spreadsheetId, range));
      url.searchParams.set('valueInputOption', valueInputOption);

      await requestJson(fetcher, url.toString(), {
        method: 'PUT',
        headers: buildAuthHeaders(accessToken),
        body: JSON.stringify({ values }),
      });
    },
  };
}
