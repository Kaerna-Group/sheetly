import type { CategoryKind } from '@entities/category';

import { normalizeCategoryName } from './normalize-category-name';

export function generateCategoryId(name: string, kind: CategoryKind) {
  const slug = normalizeCategoryName(name)
    .replace(/[^a-z0-9а-яёіїєґ\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return `${kind}-${slug || 'category'}`;
}
