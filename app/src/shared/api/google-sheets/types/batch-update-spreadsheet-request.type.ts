export type AddSheetRequest = {
  addSheet: {
    properties: {
      title: string;
    };
  };
};

export type SpreadsheetBatchUpdateRequest = AddSheetRequest;

export type BatchUpdateSpreadsheetRequest = {
  accessToken: string;
  requests: SpreadsheetBatchUpdateRequest[];
  spreadsheetId: string;
};
