import { describe, expect, it } from 'vitest';

import {
  defaultChartSlots,
  parseChartSlots,
  parseWideChartId,
  serializeChartSlots,
  supportsWideChart,
} from './chart-selection';

describe('chart selection', () => {
  it('parses saved chart slots', () => {
    expect(parseChartSlots('["balance-trend","daily-expenses"]')).toEqual([
      'balance-trend',
      'daily-expenses',
    ]);
  });

  it('allows the same chart in both slots', () => {
    const slots = parseChartSlots('["monthly-cashflow","monthly-cashflow"]');

    expect(slots).toEqual(['monthly-cashflow', 'monthly-cashflow']);
    expect(serializeChartSlots(slots)).toBe('["monthly-cashflow","monthly-cashflow"]');
  });

  it('returns defaults for broken storage values', () => {
    expect(parseChartSlots('not-json')).toEqual(defaultChartSlots);
    expect(parseChartSlots('["unknown","daily-expenses"]')).toEqual(defaultChartSlots);
  });

  it('allows only wide-capable charts to use wide layout', () => {
    expect(supportsWideChart('monthly-cashflow')).toBe(true);
    expect(parseWideChartId('monthly-cashflow')).toBe('monthly-cashflow');
    expect(parseWideChartId('expense-categories')).toBeNull();
    expect(parseWideChartId('unknown')).toBeNull();
  });
});
