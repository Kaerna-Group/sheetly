import type { SpreadsheetBatchUpdateRequest, SpreadsheetMetadata } from '@shared/api/google-sheets';
import { sheetNames } from '@shared/config/constants/sheet.constants';

type SheetStyle = {
  columns: number;
  headerColor: {
    blue?: number;
    green?: number;
    red?: number;
  };
  tabColor: {
    blue?: number;
    green?: number;
    red?: number;
  };
  widths: number[];
};

const defaultTextFormat = {
  fontFamily: 'Inter',
  fontSize: 10,
};

const white = {
  blue: 1,
  green: 1,
  red: 1,
};

const subtleBackground = {
  blue: 0.98,
  green: 0.98,
  red: 0.97,
};

const styles: Record<string, SheetStyle> = {
  [sheetNames.ledger]: {
    columns: 16,
    headerColor: { blue: 0.39, green: 0.31, red: 0.31 },
    tabColor: { blue: 0.39, green: 0.31, red: 0.31 },
    widths: [160, 110, 96, 150, 120, 130, 92, 140, 220, 180, 130, 110, 180, 180, 140, 160],
  },
  [sheetNames.categories]: {
    columns: 6,
    headerColor: { blue: 0.22, green: 0.45, red: 0.13 },
    tabColor: { blue: 0.22, green: 0.45, red: 0.13 },
    widths: [160, 180, 120, 110, 120, 110],
  },
  [sheetNames.containers]: {
    columns: 7,
    headerColor: { blue: 0.12, green: 0.46, red: 0.06 },
    tabColor: { blue: 0.12, green: 0.46, red: 0.06 },
    widths: [160, 180, 110, 110, 120, 110, 180],
  },
  [sheetNames.currencies]: {
    columns: 7,
    headerColor: { blue: 0.1, green: 0.55, red: 0.85 },
    tabColor: { blue: 0.1, green: 0.55, red: 0.85 },
    widths: [90, 90, 200, 90, 120, 110, 110],
  },
  [sheetNames.summary]: {
    columns: 2,
    headerColor: { blue: 0.16, green: 0.18, red: 0.07 },
    tabColor: { blue: 0.16, green: 0.18, red: 0.07 },
    widths: [220, 160],
  },
  [sheetNames.monthlyStats]: {
    columns: 4,
    headerColor: { blue: 0.41, green: 0.18, red: 0.58 },
    tabColor: { blue: 0.41, green: 0.18, red: 0.58 },
    widths: [140, 130, 130, 130],
  },
  [sheetNames.categoryStats]: {
    columns: 4,
    headerColor: { blue: 0.17, green: 0.42, red: 0.79 },
    tabColor: { blue: 0.17, green: 0.42, red: 0.79 },
    widths: [180, 120, 130, 90],
  },
  [sheetNames.settings]: {
    columns: 2,
    headerColor: { blue: 0.25, green: 0.25, red: 0.24 },
    tabColor: { blue: 0.25, green: 0.25, red: 0.24 },
    widths: [220, 220],
  },
};

function getSheetIdByName(metadata: SpreadsheetMetadata) {
  return new Map(
    metadata.sheets
      ?.map((sheet) => [sheet.properties?.title, sheet.properties?.sheetId] as const)
      .filter(
        (entry): entry is readonly [string, number] =>
          typeof entry[0] === 'string' && typeof entry[1] === 'number',
      ) ?? [],
  );
}

function buildBaseSheetFormattingRequests(
  sheetId: number,
  style: SheetStyle,
): SpreadsheetBatchUpdateRequest[] {
  return [
    {
      updateSheetProperties: {
        fields: 'gridProperties.frozenRowCount,tabColor',
        properties: {
          gridProperties: {
            frozenRowCount: 1,
          },
          sheetId,
          tabColor: style.tabColor,
        },
      },
    },
    {
      repeatCell: {
        cell: {
          userEnteredFormat: {
            backgroundColor: subtleBackground,
            padding: {
              bottom: 4,
              left: 8,
              right: 8,
              top: 4,
            },
            textFormat: defaultTextFormat,
            verticalAlignment: 'MIDDLE',
            wrapStrategy: 'WRAP',
          },
        },
        fields:
          'userEnteredFormat(backgroundColor,padding,textFormat,verticalAlignment,wrapStrategy)',
        range: {
          endColumnIndex: style.columns,
          sheetId,
          startColumnIndex: 0,
        },
      },
    },
    {
      repeatCell: {
        cell: {
          userEnteredFormat: {
            backgroundColor: style.headerColor,
            horizontalAlignment: 'CENTER',
            textFormat: {
              ...defaultTextFormat,
              bold: true,
              foregroundColor: white,
            },
            verticalAlignment: 'MIDDLE',
          },
        },
        fields:
          'userEnteredFormat(backgroundColor,horizontalAlignment,textFormat,verticalAlignment)',
        range: {
          endColumnIndex: style.columns,
          endRowIndex: 1,
          sheetId,
          startColumnIndex: 0,
          startRowIndex: 0,
        },
      },
    },
    {
      setBasicFilter: {
        filter: {
          range: {
            endColumnIndex: style.columns,
            sheetId,
            startColumnIndex: 0,
            startRowIndex: 0,
          },
        },
      },
    },
    ...style.widths.map<SpreadsheetBatchUpdateRequest>((width, index) => ({
      updateDimensionProperties: {
        fields: 'pixelSize',
        properties: {
          pixelSize: width,
        },
        range: {
          dimension: 'COLUMNS',
          endIndex: index + 1,
          sheetId,
          startIndex: index,
        },
      },
    })),
  ];
}

function buildNumberFormatRequest(
  sheetId: number,
  startColumnIndex: number,
  endColumnIndex: number,
  type: 'DATE' | 'DATE_TIME' | 'NUMBER',
  pattern: string,
): SpreadsheetBatchUpdateRequest {
  return {
    repeatCell: {
      cell: {
        userEnteredFormat: {
          numberFormat: {
            pattern,
            type,
          },
        },
      },
      fields: 'userEnteredFormat.numberFormat',
      range: {
        endColumnIndex,
        sheetId,
        startColumnIndex,
        startRowIndex: 1,
      },
    },
  };
}

function buildSheetSpecificFormattingRequests(
  sheetName: string,
  sheetId: number,
): SpreadsheetBatchUpdateRequest[] {
  if (sheetName === sheetNames.ledger) {
    return [
      buildNumberFormatRequest(sheetId, 1, 2, 'DATE', 'yyyy-mm-dd'),
      buildNumberFormatRequest(sheetId, 4, 6, 'NUMBER', '#,##0.00'),
      buildNumberFormatRequest(sheetId, 9, 10, 'DATE_TIME', 'yyyy-mm-dd hh:mm'),
      buildNumberFormatRequest(sheetId, 12, 14, 'DATE_TIME', 'yyyy-mm-dd hh:mm'),
    ];
  }

  if (sheetName === sheetNames.summary) {
    return [
      buildNumberFormatRequest(sheetId, 1, 2, 'NUMBER', '#,##0.00'),
      {
        repeatCell: {
          cell: {
            userEnteredFormat: {
              backgroundColor: { blue: 0.95, green: 0.98, red: 0.94 },
              textFormat: {
                ...defaultTextFormat,
                bold: true,
                fontSize: 12,
              },
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)',
          range: {
            endColumnIndex: 2,
            endRowIndex: 7,
            sheetId,
            startColumnIndex: 0,
            startRowIndex: 1,
          },
        },
      },
    ];
  }

  if (sheetName === sheetNames.monthlyStats || sheetName === sheetNames.categoryStats) {
    return [buildNumberFormatRequest(sheetId, 1, 4, 'NUMBER', '#,##0.00')];
  }

  if (sheetName === sheetNames.containers) {
    return [buildNumberFormatRequest(sheetId, 6, 7, 'DATE_TIME', 'yyyy-mm-dd hh:mm')];
  }

  if (sheetName === sheetNames.currencies) {
    return [buildNumberFormatRequest(sheetId, 4, 5, 'NUMBER', '0')];
  }

  return [];
}

export function buildTemplateFormattingRequests(
  metadata: SpreadsheetMetadata,
): SpreadsheetBatchUpdateRequest[] {
  const sheetIds = getSheetIdByName(metadata);

  return Object.entries(styles).flatMap(([sheetName, style]) => {
    const sheetId = sheetIds.get(sheetName);

    if (typeof sheetId !== 'number') {
      return [];
    }

    return [
      ...buildBaseSheetFormattingRequests(sheetId, style),
      ...buildSheetSpecificFormattingRequests(sheetName, sheetId),
    ];
  });
}
