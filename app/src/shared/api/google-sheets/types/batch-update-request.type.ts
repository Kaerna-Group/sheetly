import type { ValueRange } from './value-range.type';

export type BatchUpdateValuesRequest = {
  accessToken: string;
  data: ValueRange[];
  spreadsheetId: string;
};
