import type { Container } from '../types/container.type';

export function getDefaultContainers(): Container[] {
  return [
    {
      color: '#0f766e',
      createdAt: '2026-01-01T00:00:00.000Z',
      currency: 'UAH',
      icon: 'wallet',
      id: 'cash-uah',
      isDefault: true,
      name: 'Cash',
    },
    {
      color: '#4f46e5',
      createdAt: '2026-01-01T00:00:00.000Z',
      currency: 'UAH',
      icon: 'credit-card',
      id: 'card-uah',
      isDefault: true,
      name: 'Card',
    },
  ];
}
