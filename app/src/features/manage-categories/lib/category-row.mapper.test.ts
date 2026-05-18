import { describe, expect, it } from 'vitest';

import { mapCategoryToRow, mapRowToCategory } from './category-row.mapper';

describe('category row mapper', () => {
  it('maps category to Google Sheets row', () => {
    expect(
      mapCategoryToRow({
        id: 'expense-food',
        name: 'Food',
        kind: 'expense',
        color: '#ef4444',
        icon: 'shopping-cart',
        isDefault: true,
      }),
    ).toEqual(['expense-food', 'Food', 'expense', '#ef4444', 'shopping-cart', 'TRUE']);
  });

  it('maps row to category', () => {
    expect(
      mapRowToCategory(['expense-food', 'Food', 'expense', '#ef4444', 'tag', 'FALSE']),
    ).toEqual({
      id: 'expense-food',
      name: 'Food',
      kind: 'expense',
      color: '#ef4444',
      icon: 'tag',
      isDefault: false,
    });
  });

  it('returns null for invalid rows', () => {
    expect(mapRowToCategory(['id', 'Name', 'other'])).toBeNull();
  });
});
