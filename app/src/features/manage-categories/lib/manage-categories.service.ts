import { getDefaultCategories, type Category, type CategoryKind } from '@entities/category';
import {
  createGoogleSheetsClient,
  GoogleSheetsApiError,
  type GoogleSheetsClient,
} from '@shared/api/google-sheets';
import { sheetRanges } from '@shared/config/constants/sheet.constants';

import { findCategoryDuplicate } from './filter-categories';
import { generateCategoryId } from './generate-category-id';
import { mapCategoryToRow, mapRowToCategory } from './category-row.mapper';

export type ManageCategoriesContext = {
  accessToken: string | null;
  googleSheetsClient?: Pick<GoogleSheetsClient, 'appendValues' | 'readRange'>;
  spreadsheetId: string | null;
};

export type CreateCategoryParams = ManageCategoriesContext & {
  existingCategories: Category[];
  kind: CategoryKind;
  name: string;
};

export async function readCategories({
  accessToken,
  googleSheetsClient = createGoogleSheetsClient(),
  spreadsheetId,
}: ManageCategoriesContext): Promise<Category[]> {
  if (!accessToken || !spreadsheetId) {
    return getDefaultCategories();
  }

  try {
    const valueRange = await googleSheetsClient.readRange({
      accessToken,
      range: sheetRanges.categoriesData,
      spreadsheetId,
    });
    const remoteCategories = valueRange.values
      .map(mapRowToCategory)
      .filter((category) => category !== null);

    return remoteCategories.length ? remoteCategories : getDefaultCategories();
  } catch (error) {
    if (error instanceof GoogleSheetsApiError && ['not-found', 'unknown'].includes(error.code)) {
      throw new Error('Spreadsheet template is not ready.', {
        cause: error,
      });
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
    if (error instanceof GoogleSheetsApiError && ['not-found', 'unknown'].includes(error.code)) {
      throw new Error('Spreadsheet template is not ready.', {
        cause: error,
      });
    }

    throw error;
  }
}
