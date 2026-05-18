import type { Category } from '@entities/category';

export function mapCategoryToRow(category: Category): string[] {
  return [
    category.id,
    category.name,
    category.kind,
    category.color,
    category.icon,
    category.isDefault ? 'TRUE' : 'FALSE',
  ];
}

export function mapRowToCategory(row: string[]): Category | null {
  const [id, name, kind, color, icon, isDefault] = row;

  if (!id || !name || (kind !== 'income' && kind !== 'expense')) {
    return null;
  }

  return {
    id,
    name,
    kind,
    color: color || '#6366f1',
    icon: icon || 'tag',
    isDefault: isDefault === 'TRUE',
  };
}
