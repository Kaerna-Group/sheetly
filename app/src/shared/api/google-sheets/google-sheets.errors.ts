export type GoogleSheetsErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'network'
  | 'unknown';

export class GoogleSheetsApiError extends Error {
  code: GoogleSheetsErrorCode;
  status?: number;

  constructor(code: GoogleSheetsErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'GoogleSheetsApiError';
    this.code = code;
    this.status = status;
  }
}

type GoogleErrorPayload = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

export function mapGoogleSheetsResponseError(status: number, payload?: GoogleErrorPayload) {
  const message = payload?.error?.message;

  if (status === 401) {
    return new GoogleSheetsApiError(
      'unauthorized',
      message || 'Google authorization expired. Connect Google again.',
      status,
    );
  }

  if (status === 403) {
    return new GoogleSheetsApiError(
      'forbidden',
      message || 'You do not have access to this spreadsheet.',
      status,
    );
  }

  if (status === 404) {
    return new GoogleSheetsApiError('not-found', message || 'Spreadsheet was not found.', status);
  }

  return new GoogleSheetsApiError(
    'unknown',
    message || 'Google Sheets API request failed.',
    status,
  );
}

export function mapGoogleSheetsNetworkError(error: unknown) {
  if (error instanceof GoogleSheetsApiError) {
    return error;
  }

  const message =
    error instanceof Error ? error.message : 'Network error while calling Google Sheets.';

  return new GoogleSheetsApiError('network', message);
}
