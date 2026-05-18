export { buildCategoryComboboxOptions } from './lib/category-options';
export { mapCategoryToRow, mapRowToCategory } from './lib/category-row.mapper';
export { filterCategories, findCategoryDuplicate } from './lib/filter-categories';
export { generateCategoryId } from './lib/generate-category-id';
export { createCategory, readCategories } from './lib/manage-categories.service';
export { normalizeCategoryName } from './lib/normalize-category-name';
export { useCategories } from './model/useCategories';
export { CategoryCombobox } from './ui/CategoryCombobox';
export type {
  CreateCategoryParams,
  ManageCategoriesContext,
} from './lib/manage-categories.service';
