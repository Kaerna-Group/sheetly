export type SpreadsheetConnection = {
  spreadsheetId: string | null;
  status: 'idle' | 'checking' | 'connected' | 'needs-auth' | 'invalid' | 'no-access' | 'error';
};
