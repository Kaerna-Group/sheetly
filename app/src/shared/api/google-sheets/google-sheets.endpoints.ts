const googleSheetsApiBaseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';

export const googleSheetsEndpoints = {
  spreadsheet: (spreadsheetId: string) => `${googleSheetsApiBaseUrl}/${spreadsheetId}`,
  values: (spreadsheetId: string, range: string) =>
    `${googleSheetsApiBaseUrl}/${spreadsheetId}/values/${encodeURIComponent(range)}`,
  appendValues: (spreadsheetId: string, range: string) =>
    `${googleSheetsApiBaseUrl}/${spreadsheetId}/values/${encodeURIComponent(range)}:append`,
  batchUpdateValues: (spreadsheetId: string) =>
    `${googleSheetsApiBaseUrl}/${spreadsheetId}/values:batchUpdate`,
} as const;
