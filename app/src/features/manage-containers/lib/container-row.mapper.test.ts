import { describe, expect, it } from 'vitest';

import type { Container } from '@entities/container';

import { mapContainerToRow, mapRowToContainer } from './container-row.mapper';

const container: Container = {
  color: '#6366f1',
  createdAt: '2026-05-19T10:00:00.000Z',
  currency: 'UAH',
  icon: 'wallet',
  id: 'cash-uah',
  isDefault: true,
  name: 'Cash',
};

describe('container row mapper', () => {
  it('maps container to Google Sheets row', () => {
    expect(mapContainerToRow(container)).toEqual([
      'cash-uah',
      'Cash',
      'UAH',
      '#6366f1',
      'wallet',
      'TRUE',
      '2026-05-19T10:00:00.000Z',
    ]);
  });

  it('maps row to container', () => {
    expect(
      mapRowToContainer([
        'cash-uah',
        'Cash',
        'UAH',
        '#6366f1',
        'wallet',
        'TRUE',
        '2026-05-19T10:00:00.000Z',
      ]),
    ).toEqual(container);
  });

  it('returns null for invalid rows', () => {
    expect(mapRowToContainer(['', 'Cash'])).toBeNull();
  });
});
