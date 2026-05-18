export type SpreadsheetConnection = {
  spreadsheetId: string;
  status: 'idle' | 'connected' | 'invalid';
};
