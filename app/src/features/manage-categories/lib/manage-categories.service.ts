import { getDefaultCategories, type Category, type CategoryKind } from '@entities/category';
import {
  createGoogleSheetsClient,
  GoogleSheetsApiError,
  type GoogleSheetsClient,
} from '@shared/api/google-sheets';
import { sheetNames, sheetRanges } from '@shared/config/constants/sheet.constants';

import { findCategoryDuplicate } from './filter-categories';
import { generateCategoryId } from './generate-category-id';
import { mapCategoryToRow, mapRowToCategory } from './category-row.mapper';

export type CategoriesTemplateStatus = 'ready' | 'needs-setup' | 'unknown';

export type ManageCategoriesContext = {
  accessToken: string | null;
  googleSheetsClient?: Pick<
    GoogleSheetsClient,
    'appendValues' | 'getSpreadsheetMetadata' | 'readRange'
  >;
  spreadsheetId: string | null;
};

export type CreateCategoryParams = ManageCategoriesContext & {
  existingCategories: Category[];
  kind: CategoryKind;
  name: string;
};

export type ReadCategoriesResult = {
  categories: Category[];
  templateStatus: CategoriesTemplateStatus;
  warning: string | null;
};

const templateNotReadyMessage =
  'Spreadsheet template is not ready. Open Settings and run setup before creating categories.';

function hasCategoriesSheet(
  metadata: Awaited<ReturnType<GoogleSheetsClient['getSpreadsheetMetadata']>>,
) {
  return Boolean(
    metadata.sheets?.some((sheet) => sheet.properties?.title === sheetNames.categories),
  );
}

export async function readCategories({
  accessToken,
  googleSheetsClient = createGoogleSheetsClient(),
  spreadsheetId,
}: ManageCategoriesContext): Promise<ReadCategoriesResult> {
  if (!accessToken || !spreadsheetId) {
    return {
      categories: getDefaultCategories(),
      templateStatus: 'unknown',
      warning: null,
    };
  }

  const metadata = await googleSheetsClient.getSpreadsheetMetadata({
    accessToken,
    spreadsheetId,
  });

  if (!hasCategoriesSheet(metadata)) {
    return {
      categories: getDefaultCategories(),
      templateStatus: 'needs-setup',
      warning: templateNotReadyMessage,
    };
  }

  try {
    const valueRange = await googleSheetsClient.readRange({
      accessToken,
      range: sheetRanges.categoriesData,
      spreadsheetId,
    });
    const remoteCategories = (valueRange.values ?? [])
      .map(mapRowToCategory)
      .filter((category) => category !== null);

    return {
      categories: remoteCategories.length ? remoteCategories : getDefaultCategories(),
      templateStatus: 'ready',
      warning: null,
    };
  } catch (error) {
    if (
      error instanceof GoogleSheetsApiError &&
      ['template-not-ready', 'unknown'].includes(error.code)
    ) {
      return {
        categories: getDefaultCategories(),
        templateStatus: 'needs-setup',
        warning: templateNotReadyMessage,
      };
    }

    throw error;
  }
}

export async function createCategory({
  accessToken,
  existingCategories,
  googleSheetsClient = createGoogleSheetsClient(),
  kind,
  name,
  spreadsheetId,
}: CreateCategoryParams): Promise<Category> {
  const normalizedName = name.trim();
  const duplicate = findCategoryDuplicate(existingCategories, kind, normalizedName);

  if (duplicate) {
    return duplicate;
  }

  if (!accessToken || !spreadsheetId) {
    throw new Error('Connect Google and spreadsheet before creating categories.');
  }

  const metadata = await googleSheetsClient.getSpreadsheetMetadata({
    accessToken,
    spreadsheetId,
  });

  if (!hasCategoriesSheet(metadata)) {
    throw new Error(templateNotReadyMessage);
  }

  const category: Category = {
    id: generateCategoryId(normalizedName, kind),
    name: normalizedName,
    kind,
    color: '#6366f1',
    icon: 'tag',
    isDefault: false,
  };

  try {
    await googleSheetsClient.appendValues({
      accessToken,
      range: sheetRanges.categories,
      spreadsheetId,
      values: [mapCategoryToRow(category)],
    });

    return category;
  } catch (error) {
    if (
      error instanceof GoogleSheetsApiError &&
      ['not-found', 'template-not-ready', 'unknown'].includes(error.code)
    ) {
      throw new Error('Spreadsheet template is not ready.', {
        cause: error,
      });
    }

    throw error;
  }
}
