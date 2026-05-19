import type { GoogleSheetsClient } from '@shared/api/google-sheets';
import { createGoogleSheetsClient } from '@shared/api/google-sheets';
import { sheetRanges } from '@shared/config/constants/sheet.constants';

import {
  buildAddSheetRequests,
  buildTemplateValueRanges,
  getMissingSheetNames,
} from './spreadsheet-template';
import { buildTemplateFormattingRequests } from './spreadsheet-template-formatting';

export type SetupSpreadsheetParams = {
  accessToken: string;
  googleSheetsClient?: Pick<
    GoogleSheetsClient,
    'batchUpdateSpreadsheet' | 'batchUpdateValues' | 'getSpreadsheetMetadata' | 'readRange'
  >;
  spreadsheetId: string;
};

export type SetupSpreadsheetResult = {
  createdSheets: string[];
  status: 'ready';
};

async function hasExistingCategories({
  accessToken,
  googleSheetsClient,
  spreadsheetId,
}: Required<SetupSpreadsheetParams>) {
  try {
    const categories = await googleSheetsClient.readRange({
      accessToken,
      range: sheetRanges.categoriesData,
      spreadsheetId,
    });

    return categories.values.length > 0;
  } catch {
    return false;
  }
}

export async function setupSpreadsheet({
  accessToken,
  googleSheetsClient = createGoogleSheetsClient(),
  spreadsheetId,
}: SetupSpreadsheetParams): Promise<SetupSpreadsheetResult> {
  const metadata = await googleSheetsClient.getSpreadsheetMetadata({
    accessToken,
    spreadsheetId,
  });
  const missingSheetNames = getMissingSheetNames(metadata);

  if (missingSheetNames.length) {
    await googleSheetsClient.batchUpdateSpreadsheet({
      accessToken,
      requests: buildAddSheetRequests(missingSheetNames),
      spreadsheetId,
    });
  }

  const formattingMetadata = missingSheetNames.length
    ? await googleSheetsClient.getSpreadsheetMetadata({
        accessToken,
        spreadsheetId,
      })
    : metadata;

  const includeDefaultCategories = !(await hasExistingCategories({
    accessToken,
    googleSheetsClient,
    spreadsheetId,
  }));

  await googleSheetsClient.batchUpdateValues({
    accessToken,
    data: buildTemplateValueRanges(includeDefaultCategories),
    spreadsheetId,
  });

  const formattingRequests = buildTemplateFormattingRequests(formattingMetadata);

  if (formattingRequests.length) {
    await googleSheetsClient.batchUpdateSpreadsheet({
      accessToken,
      requests: formattingRequests,
      spreadsheetId,
    });
  }

  return {
    createdSheets: [...missingSheetNames],
    status: 'ready',
  };
}
