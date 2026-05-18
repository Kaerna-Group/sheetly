import type { Category, CategoryKind } from '@entities/category';

import { normalizeCategoryName } from './normalize-category-name';

export function filterCategories(categories: Category[], kind: CategoryKind, query: string) {
  const normalizedQuery = normalizeCategoryName(query);

  return categories.filter((category) => {
    if (category.kind !== kind) {
      return false;
    }

    return normalizedQuery ? normalizeCategoryName(category.name).includes(normalizedQuery) : true;
  });
}

export function findCategoryDuplicate(categories: Category[], kind: CategoryKind, name: string) {
  const normalizedName = normalizeCategoryName(name);

  return categories.find(
    (category) => category.kind === kind && normalizeCategoryName(category.name) === normalizedName,
  );
}
