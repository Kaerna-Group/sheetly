import { describe, expect, it } from 'vitest';

import type { Category } from '@entities/category';

import { filterCategories, findCategoryDuplicate } from './filter-categories';

const categories: Category[] = [
  {
    id: 'expense-food',
    name: 'Food',
    kind: 'expense',
    color: '#ef4444',
    icon: 'tag',
    isDefault: true,
  },
  {
    id: 'income-salary',
    name: 'Salary',
    kind: 'income',
    color: '#22c55e',
    icon: 'wallet',
    isDefault: true,
  },
];

describe('filterCategories', () => {
  it('filters by kind and query', () => {
    expect(filterCategories(categories, 'expense', 'foo')).toEqual([categories[0]]);
  });

  it('finds duplicates by normalized name and kind', () => {
    expect(findCategoryDuplicate(categories, 'expense', ' food ')?.id).toBe('expense-food');
  });
});
