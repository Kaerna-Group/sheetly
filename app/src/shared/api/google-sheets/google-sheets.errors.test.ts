import { describe, expect, it } from 'vitest';

import {
  GoogleSheetsApiError,
  mapGoogleSheetsNetworkError,
  mapGoogleSheetsResponseError,
} from './google-sheets.errors';

describe('google sheets errors', () => {
  it('maps unauthorized responses', () => {
    const error = mapGoogleSheetsResponseError(401);

    expect(error.code).toBe('unauthorized');
    expect(error.status).toBe(401);
  });

  it('maps forbidden responses', () => {
    expect(mapGoogleSheetsResponseError(403).code).toBe('forbidden');
  });

  it('maps not found responses', () => {
    expect(mapGoogleSheetsResponseError(404).code).toBe('not-found');
  });

  it('maps missing sheet range responses to template not ready', () => {
    expect(
      mapGoogleSheetsResponseError(400, {
        error: {
          message: 'Unable to parse range: Categories!A2:F',
        },
      }).code,
    ).toBe('template-not-ready');
  });

  it('keeps api errors when mapping network errors', () => {
    const originalError = new GoogleSheetsApiError('forbidden', 'No access', 403);

    expect(mapGoogleSheetsNetworkError(originalError)).toBe(originalError);
  });
});
