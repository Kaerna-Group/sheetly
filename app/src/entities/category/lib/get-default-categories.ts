import type { Category } from '../types/category.type';

export function getDefaultCategories(): Category[] {
  return [
    {
      id: 'salary',
      name: 'Salary',
      kind: 'income',
      color: '#22c55e',
      icon: 'wallet',
      isDefault: true,
    },
    {
      id: 'food',
      name: 'Food',
      kind: 'expense',
      color: '#ef4444',
      icon: 'shopping-cart',
      isDefault: true,
    },
  ];
}
