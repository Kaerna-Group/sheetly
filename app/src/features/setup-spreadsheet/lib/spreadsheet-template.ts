import { getDefaultCategories } from '@entities/category';
import { getDefaultContainers } from '@entities/container';
import type {
  SpreadsheetMetadata,
  SpreadsheetBatchUpdateRequest,
  ValueRange,
} from '@shared/api/google-sheets';
import {
  categoryStatsHeaders,
  categoryHeaders,
  containerHeaders,
  ledgerHeaders,
  monthlyStatsHeaders,
  requiredSheetNames,
  settingsHeaders,
  sheetRanges,
  summaryHeaders,
  templateVersion,
} from '@shared/config/constants/sheet.constants';
import { mapCategoryToRow } from '@features/manage-categories';
import { mapContainerToRow } from '@features/manage-containers';

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
      range: sheetRanges.containersHeaders,
      values: [[...containerHeaders]],
    },
    {
      range: sheetRanges.settingsHeaders,
      values: [[...settingsHeaders]],
    },
    {
      range: sheetRanges.monthlyStatsHeaders,
      values: [[...monthlyStatsHeaders]],
    },
    {
      range: sheetRanges.categoryStatsHeaders,
      values: [[...categoryStatsHeaders]],
    },
    {
      range: sheetRanges.summary,
      values: [
        [...summaryHeaders],
        ['Total Income', '=SUMIF(Ledger!C:C,"income",Ledger!E:E)'],
        ['Total Expense', '=SUMIF(Ledger!C:C,"expense",Ledger!E:E)'],
        ['Balance', '=B2-B3'],
        ['Transaction Count', '=MAX(COUNTA(Ledger!A:A)-1,0)'],
        ['Average Expense', '=IFERROR(AVERAGEIF(Ledger!C:C,"expense",Ledger!E:E),0)'],
      ],
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
    valueRanges.push({
      range: sheetRanges.containersData,
      values: getDefaultContainers().map(mapContainerToRow),
    });
  }

  return valueRanges;
}
