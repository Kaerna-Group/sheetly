import { describe, expect, it } from 'vitest';

import { mapRowToCategoryStats, mapRowToMonthlyStats } from './analytics-row.mapper';

describe('analytics row mapper', () => {
  it('maps monthly stats rows', () => {
    expect(mapRowToMonthlyStats(['2026-05', 'UAH', '1000', '250', '750'])).toEqual({
      balance: 750,
      currency: 'UAH',
      expense: 250,
      income: 1000,
      label: 'May 2026',
      month: '2026-05',
    });
  });

  it('maps category stats rows', () => {
    expect(mapRowToCategoryStats(['Food', 'expense', 'UAH', '350', '2'])).toEqual({
      categoryName: 'Food',
      count: 2,
      currency: 'UAH',
      expense: 350,
      income: 0,
      kind: 'expense',
      total: 350,
    });
  });

  it('maps income category stats rows', () => {
    expect(mapRowToCategoryStats(['Salary', 'income', 'USD', '3000', '1'])).toEqual({
      categoryName: 'Salary',
      count: 1,
      currency: 'USD',
      expense: 0,
      income: 3000,
      kind: 'income',
      total: 3000,
    });
  });

  it('tolerates missing currency in monthly stats rows', () => {
    const result = mapRowToMonthlyStats(['2026-05', '', '1000', '250', '750']);

    expect(result).not.toBeNull();
    expect(result?.currency).toBe('');
  });

  it('skips invalid rows', () => {
    expect(mapRowToMonthlyStats(['2026-05', 'UAH', 'bad', '250', '750'])).toBeNull();
    expect(mapRowToCategoryStats(['Food', 'other', 'UAH', '350', '2'])).toBeNull();
  });
});
