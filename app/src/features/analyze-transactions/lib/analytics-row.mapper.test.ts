import { describe, expect, it } from 'vitest';

import { mapRowToCategoryStats, mapRowToMonthlyStats } from './analytics-row.mapper';

describe('analytics row mapper', () => {
  it('maps monthly stats rows', () => {
    expect(mapRowToMonthlyStats(['2026-05', '1000', '250', '750'])).toEqual({
      balance: 750,
      expense: 250,
      income: 1000,
      label: 'May 2026',
      month: '2026-05',
    });
  });

  it('maps category stats rows', () => {
    expect(mapRowToCategoryStats(['Food', 'expense', '350', '2'])).toEqual({
      categoryName: 'Food',
      count: 2,
      expense: 350,
      income: 0,
      kind: 'expense',
      total: 350,
    });
  });

  it('skips invalid rows', () => {
    expect(mapRowToMonthlyStats(['2026-05', 'bad', '250', '750'])).toBeNull();
    expect(mapRowToCategoryStats(['Food', 'other', '350', '2'])).toBeNull();
  });
});
