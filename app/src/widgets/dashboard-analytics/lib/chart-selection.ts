import type { ChartId } from '@features/analyze-transactions';

export type ChartSlots = readonly [ChartId, ChartId];

export const chartCatalog = [
  {
    description: 'Income and expense grouped by month.',
    id: 'monthly-cashflow',
    supportsWide: true,
    title: 'Monthly cashflow',
  },
  {
    description: 'Balance movement across months.',
    id: 'balance-trend',
    supportsWide: true,
    title: 'Balance trend',
  },
  {
    description: 'Expense share by category.',
    id: 'expense-categories',
    supportsWide: false,
    title: 'Expense categories',
  },
  {
    description: 'Top category totals.',
    id: 'category-bar',
    supportsWide: true,
    title: 'Category totals',
  },
  {
    description: 'Income compared with expense.',
    id: 'income-expense-ratio',
    supportsWide: false,
    title: 'Income vs expense',
  },
  {
    description: 'Expense movement by transaction day.',
    id: 'daily-expenses',
    supportsWide: true,
    title: 'Daily expenses',
  },
] as const satisfies readonly {
  description: string;
  id: ChartId;
  supportsWide: boolean;
  title: string;
}[];

const chartIds = new Set<ChartId>(chartCatalog.map((chart) => chart.id));
const wideChartIds = new Set<ChartId>(
  chartCatalog.filter((chart) => chart.supportsWide).map((chart) => chart.id),
);

export const defaultChartSlots: ChartSlots = ['monthly-cashflow', 'expense-categories'];

export function isChartId(value: unknown): value is ChartId {
  return typeof value === 'string' && chartIds.has(value as ChartId);
}

export function supportsWideChart(value: ChartId) {
  return wideChartIds.has(value);
}

export function parseChartSlots(value: string | null): ChartSlots {
  if (!value) {
    return defaultChartSlots;
  }

  try {
    const parsedValue = JSON.parse(value) as unknown;

    if (Array.isArray(parsedValue) && parsedValue.length === 2 && parsedValue.every(isChartId)) {
      return [parsedValue[0], parsedValue[1]];
    }
  } catch {
    return defaultChartSlots;
  }

  return defaultChartSlots;
}

export function serializeChartSlots(slots: ChartSlots) {
  return JSON.stringify(slots);
}

export function parseWideChartId(value: string | null): ChartId | null {
  if (!value || !isChartId(value) || !supportsWideChart(value)) {
    return null;
  }

  return value;
}
