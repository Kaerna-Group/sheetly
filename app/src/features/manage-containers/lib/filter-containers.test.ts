import { describe, expect, it } from 'vitest';

import type { Container } from '@entities/container';

import { filterContainers, findContainerDuplicate } from './filter-containers';

const containers: Container[] = [
  {
    color: '#6366f1',
    createdAt: '2026-05-19T10:00:00.000Z',
    currency: 'UAH',
    icon: 'wallet',
    id: 'cash-uah',
    isDefault: true,
    name: 'Cash',
  },
  {
    color: '#0f766e',
    createdAt: '2026-05-19T10:00:00.000Z',
    currency: 'EUR',
    icon: 'wallet',
    id: 'cash-eur',
    isDefault: false,
    name: 'Cash',
  },
];

describe('filterContainers', () => {
  it('filters by name and currency', () => {
    expect(filterContainers(containers, 'eur')).toEqual([containers[1]]);
  });

  it('finds duplicates by normalized name and currency', () => {
    expect(findContainerDuplicate(containers, ' cash ', 'UAH')).toEqual(containers[0]);
    expect(findContainerDuplicate(containers, ' cash ', 'USD')).toBeUndefined();
  });
});
