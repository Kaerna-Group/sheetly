import { getDefaultCategories } from '@entities/category';
import type {
  SpreadsheetMetadata,
  SpreadsheetBatchUpdateRequest,
  ValueRange,
} from '@shared/api/google-sheets';
import {
  categoryHeaders,
  ledgerHeaders,
  requiredSheetNames,
  settingsHeaders,
  sheetRanges,
  templateVersion,
} from '@shared/config/constants/sheet.constants';
import { mapCategoryToRow } from '@features/manage-categories';

export function getExistingSheetNames(metadata: SpreadsheetMetadata) {
  return new Set(
    metadata.sheets
      ?.map((sheet) => sheet.properties?.title)
      .filter((sheetName): sheetName is string => Boolean(sheetName)) ?? [],
  );
}

export function getMissingSheetNames(metadata: SpreadsheetMetadata) {
  const existingSheetNames = getExistingSheetNames(metadata);

  return requiredSheetNames.filter((sheetName) => !existingSheetNames.has(sheetName));
}

export function buildAddSheetRequests(sheetNames: string[]): SpreadsheetBatchUpdateRequest[] {
  return sheetNames.map((sheetName) => ({
    addSheet: {
      properties: {
        title: sheetName,
      },
    },
  }));
}

export function buildTemplateValueRanges(includeDefaultCategories: boolean): ValueRange[] {
  const valueRanges: ValueRange[] = [
    {
      range: sheetRanges.ledgerHeaders,
      values: [[...ledgerHeaders]],
    },
    {
      range: sheetRanges.categoriesHeaders,
      values: [[...categoryHeaders]],
    },
    {
      range: sheetRanges.settingsHeaders,
      values: [[...settingsHeaders]],
    },
    {
      range: sheetRanges.settingsTemplateVersion,
      values: [['templateVersion', templateVersion]],
    },
  ];

  if (includeDefaultCategories) {
    valueRanges.push({
      range: sheetRanges.categoriesData,
      values: getDefaultCategories().map(mapCategoryToRow),
    });
  }

  return valueRanges;
}
