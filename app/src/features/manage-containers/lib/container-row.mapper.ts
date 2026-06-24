import type { Container } from '@entities/container';

export function mapContainerToRow(container: Container): string[] {
  return [
    container.id,
    container.name,
    container.currency,
    container.color,
    container.icon,
    container.isDefault ? 'TRUE' : 'FALSE',
    container.createdAt,
  ];
}

export function mapRowToContainer(row: string[]): Container | null {
  const [id, name, currency, color, icon, isDefault, createdAt] = row;

  if (!id || !name || !currency || !createdAt) {
    return null;
  }

  return {
    color: color || '#6366f1',
    createdAt,
    currency: currency.toUpperCase(),
    icon: icon || 'wallet',
    id,
    isDefault: isDefault === 'TRUE',
    name,
  };
}
