export type AddSheetRequest = {
  addSheet: {
    properties: {
      title: string;
    };
  };
};

type GridRange = {
  endColumnIndex?: number;
  endRowIndex?: number;
  sheetId: number;
  startColumnIndex?: number;
  startRowIndex?: number;
};

type RgbColor = {
  blue?: number;
  green?: number;
  red?: number;
};

type CellFormat = {
  backgroundColor?: RgbColor;
  horizontalAlignment?: 'CENTER' | 'LEFT' | 'RIGHT';
  numberFormat?: {
    pattern: string;
    type: 'CURRENCY' | 'DATE' | 'DATE_TIME' | 'NUMBER' | 'TEXT';
  };
  padding?: {
    bottom?: number;
    left?: number;
    right?: number;
    top?: number;
  };
  textFormat?: {
    bold?: boolean;
    fontFamily?: string;
    fontSize?: number;
    foregroundColor?: RgbColor;
  };
  verticalAlignment?: 'MIDDLE' | 'TOP';
  wrapStrategy?: 'CLIP' | 'OVERFLOW_CELL' | 'WRAP';
};

export type RepeatCellRequest = {
  repeatCell: {
    cell: {
      userEnteredFormat: CellFormat;
    };
    fields: string;
    range: GridRange;
  };
};

export type SetBasicFilterRequest = {
  setBasicFilter: {
    filter: {
      range: GridRange;
    };
  };
};

export type UpdateDimensionPropertiesRequest = {
  updateDimensionProperties: {
    fields: string;
    properties: {
      pixelSize: number;
    };
    range: {
      dimension: 'COLUMNS' | 'ROWS';
      endIndex: number;
      sheetId: number;
      startIndex: number;
    };
  };
};

export type UpdateSheetPropertiesRequest = {
  updateSheetProperties: {
    fields: string;
    properties: {
      gridProperties?: {
        frozenRowCount?: number;
      };
      sheetId: number;
      tabColor?: RgbColor;
    };
  };
};

export type SpreadsheetBatchUpdateRequest =
  | AddSheetRequest
  | RepeatCellRequest
  | SetBasicFilterRequest
  | UpdateDimensionPropertiesRequest
  | UpdateSheetPropertiesRequest;

export type BatchUpdateSpreadsheetRequest = {
  accessToken: string;
  requests: SpreadsheetBatchUpdateRequest[];
  spreadsheetId: string;
};
