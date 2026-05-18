import type { Category, CategoryKind } from '@entities/category';
import { buildComboboxOptions } from '@shared/ui/combobox';

import { filterCategories } from './filter-categories';

export function buildCategoryComboboxOptions(
  categories: Category[],
  kind: CategoryKind,
  inputValue: string,
) {
  return buildComboboxOptions({
    getCreateLabel: (value) => `Create "${value}"`,
    inputValue,
    items: filterCategories(categories, kind, inputValue).map((category) => ({
      ...category,
      label: category.name,
    })),
  });
}
