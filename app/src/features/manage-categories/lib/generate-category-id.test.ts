import { describe, expect, it } from 'vitest';

import { generateCategoryId } from './generate-category-id';

describe('generateCategoryId', () => {
  it('generates kind-prefixed slugs', () => {
    expect(generateCategoryId('Fast Food', 'expense')).toBe('expense-fast-food');
  });

  it('supports Cyrillic names', () => {
    expect(generateCategoryId('Кафе и еда', 'expense')).toBe('expense-кафе-и-еда');
  });
});
