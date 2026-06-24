import { type JSX, useMemo, useState } from 'react';

import type { Transaction } from '@entities/transaction';
import {
  useAnalyticsStats,
  type CategoryStats,
  type ChartId,
} from '@features/analyze-transactions';
import { getTransactionCurrencyOptions } from '@features/filter-transactions';
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';
import { EmptyState } from '@shared/ui/empty-state';
import { localStorageService } from '@shared/lib/storage/local-storage.service';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  chartCatalog,
  type ChartSlots,
  parseChartSlots,
  parseWideChartId,
  serializeChartSlots,
  supportsWideChart,
} from '../lib/chart-selection';

type DashboardAnalyticsProps = {
  transactions: Transaction[];
};

type ChartSlotProps = {
  chartId: ChartId;
  dailyExpenseStats: DailyExpenseStats[];
  isWide?: boolean;
  onDropChart: (chartId: ChartId) => void;
  onOpenPicker: () => void;
  onSplit?: () => void;
  categoryStats: CategoryStats[];
  monthlyStats: ReturnType<typeof useAnalyticsStats>['monthlyStats'];
  slotLabel: string;
};

type DailyExpenseStats = {
  date: string;
  expense: number;
  label: string;
};

const chartColors = ['#4f46e5', '#0f766e', '#dc2626', '#9333ea', '#ca8a04', '#0891b2'];

const chartTypeLabels: Record<string, string> = {
  'balance-trend': 'Line',
  'category-bar': 'Bar',
  'daily-expenses': 'Line',
  'expense-categories': 'Pie',
  'income-expense-ratio': 'Bar',
  'monthly-cashflow': 'Bar',
};

function formatMoney(value: number) {
  return value.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });
}

function getChartMeta(chartId: ChartId) {
  return chartCatalog.find((chart) => chart.id === chartId) ?? chartCatalog[0];
}

function calculateDailyExpenseStats(transactions: Transaction[]): DailyExpenseStats[] {
  const statsByDate = new Map<string, DailyExpenseStats>();

  transactions
    .filter((transaction) => transaction.kind === 'expense' && !transaction.deletedAt)
    .forEach((transaction) => {
      const currentStats =
        statsByDate.get(transaction.date) ??
        ({
          date: transaction.date,
          expense: 0,
          label: transaction.date.slice(5),
        } satisfies DailyExpenseStats);

      currentStats.expense += transaction.amount;
      statsByDate.set(transaction.date, currentStats);
    });

  return [...statsByDate.values()].sort((left, right) => left.date.localeCompare(right.date));
}

function getExpenseCategoryStats(categoryStats: CategoryStats[]) {
  return categoryStats.filter((categoryStatsItem) => categoryStatsItem.kind === 'expense');
}

type ChartTooltipContentProps = {
  active?: boolean;
  formatter?: (value: number) => string;
  label?: string;
  payload?: Array<{ color?: string; name?: string; value?: number }>;
};

function ChartTooltipContent({ active, formatter, label, payload }: ChartTooltipContentProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 shadow-lg">
      {label ? <p className="mb-1 text-xs text-text-soft">{label}</p> : null}
      {payload.map((entry) => (
        <p className="text-sm text-text" key={entry.name}>
          <span style={{ color: entry.color }}>{'● '}</span>
          {entry.name}: {formatter ? formatter(Number(entry.value)) : String(entry.value)}
        </p>
      ))}
    </div>
  );
}

function getChartEmptyTitle(chartId: ChartId): string {
  if (chartId === 'monthly-cashflow') return 'No monthly stats';
  if (chartId === 'balance-trend') return 'No balance trend';
  if (chartId === 'expense-categories') return 'No expenses yet';
  if (chartId === 'category-bar') return 'No category totals';
  if (chartId === 'income-expense-ratio') return 'No totals yet';
  return 'No daily expenses';
}

const axisTickStyle = { fill: 'var(--color-text-soft)', fontSize: 12 };

function renderChart({
  categoryStats,
  chartId,
  dailyExpenseStats,
  monthlyStats,
}: Pick<
  ChartSlotProps,
  'categoryStats' | 'chartId' | 'dailyExpenseStats' | 'monthlyStats'
>): JSX.Element | null {
  const expenseCategoryStats = getExpenseCategoryStats(categoryStats);
  const ratioStats = [
    {
      label: 'Income',
      total: monthlyStats.reduce((sum, stat) => sum + stat.income, 0),
    },
    {
      label: 'Expense',
      total: monthlyStats.reduce((sum, stat) => sum + stat.expense, 0),
    },
  ];

  const tooltipEl = <ChartTooltipContent formatter={formatMoney} />;

  if (chartId === 'monthly-cashflow') {
    if (!monthlyStats.length) return null;

    return (
      <BarChart data={monthlyStats}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={axisTickStyle} tickLine={false} />
        <YAxis tick={axisTickStyle} tickFormatter={formatMoney} tickLine={false} width={56} />
        <Tooltip content={tooltipEl} />
        <Legend wrapperStyle={{ color: 'var(--color-text-muted)', fontSize: 12 }} />
        <Bar dataKey="income" fill="#059669" name="Income" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" fill="#dc2626" name="Expense" radius={[4, 4, 0, 0]} />
      </BarChart>
    );
  }

  if (chartId === 'balance-trend') {
    if (!monthlyStats.length) return null;

    return (
      <LineChart data={monthlyStats}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={axisTickStyle} tickLine={false} />
        <YAxis tick={axisTickStyle} tickFormatter={formatMoney} tickLine={false} width={56} />
        <Tooltip content={tooltipEl} />
        <Line dataKey="balance" name="Balance" stroke="#4f46e5" strokeWidth={3} type="monotone" />
      </LineChart>
    );
  }

  if (chartId === 'expense-categories') {
    if (!expenseCategoryStats.length) return null;

    return (
      <PieChart>
        <Pie
          data={expenseCategoryStats}
          dataKey="expense"
          innerRadius={52}
          nameKey="categoryName"
          outerRadius={88}
          paddingAngle={2}
        >
          {expenseCategoryStats.map((categoryStatsItem, index) => (
            <Cell
              fill={chartColors[index % chartColors.length]}
              key={`${categoryStatsItem.categoryName}-${categoryStatsItem.kind}`}
            />
          ))}
        </Pie>
        <Tooltip content={tooltipEl} />
      </PieChart>
    );
  }

  if (chartId === 'category-bar') {
    if (!expenseCategoryStats.length) return null;

    return (
      <BarChart data={[...expenseCategoryStats].sort((left, right) => right.total - left.total)}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="categoryName" tick={axisTickStyle} tickLine={false} />
        <YAxis tick={axisTickStyle} tickFormatter={formatMoney} tickLine={false} width={56} />
        <Tooltip content={tooltipEl} />
        <Bar dataKey="total" fill="#0f766e" name="Total" radius={[4, 4, 0, 0]} />
      </BarChart>
    );
  }

  if (chartId === 'income-expense-ratio') {
    if (!ratioStats.some((stat) => stat.total > 0)) return null;

    return (
      <BarChart data={ratioStats}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={axisTickStyle} tickLine={false} />
        <YAxis tick={axisTickStyle} tickFormatter={formatMoney} tickLine={false} width={56} />
        <Tooltip content={tooltipEl} />
        <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]}>
          {ratioStats.map((stat, index) => (
            <Cell fill={index === 0 ? '#059669' : '#dc2626'} key={stat.label} />
          ))}
        </Bar>
      </BarChart>
    );
  }

  if (!dailyExpenseStats.length) return null;

  return (
    <LineChart data={dailyExpenseStats}>
      <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="label" tick={axisTickStyle} tickLine={false} />
      <YAxis tick={axisTickStyle} tickFormatter={formatMoney} tickLine={false} width={56} />
      <Tooltip content={tooltipEl} />
      <Line dataKey="expense" name="Expense" stroke="#dc2626" strokeWidth={3} type="monotone" />
    </LineChart>
  );
}

function ChartSlot({
  categoryStats,
  chartId,
  dailyExpenseStats,
  isWide = false,
  monthlyStats,
  onDropChart,
  onOpenPicker,
  onSplit,
  slotLabel,
}: ChartSlotProps) {
  const chartMeta = getChartMeta(chartId);
  const chart = renderChart({ categoryStats, chartId, dailyExpenseStats, monthlyStats });

  return (
    <Card
      className={
        isWide
          ? 'min-h-[360px] md:min-h-[420px] hover:border-brand'
          : 'min-h-[320px] md:min-h-[360px] hover:border-brand'
      }
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        const droppedChartId = event.dataTransfer.getData('text/plain');

        if (
          chartCatalog.some((c) => c.id === droppedChartId) &&
          (!isWide || supportsWideChart(droppedChartId as ChartId))
        ) {
          onDropChart(droppedChartId as ChartId);
        }
      }}
    >
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-text-soft">{slotLabel}</p>
          <h2 className="mt-1 text-base font-semibold text-text">{chartMeta.title}</h2>
          <p className="mt-1 text-sm text-text-soft">{chartMeta.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isWide && onSplit ? (
            <Button onClick={onSplit} size="sm" variant="ghost">
              Two-column view
            </Button>
          ) : null}
          <Button onClick={onOpenPicker} size="sm" variant="secondary">
            Customize
          </Button>
        </div>
      </div>
      <div className={isWide ? 'h-64 md:h-80' : 'h-56 md:h-72'}>
        {chart ? (
          <ResponsiveContainer height="100%" width="100%">
            {chart}
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              description="Add transactions to see this chart."
              title={getChartEmptyTitle(chartId)}
            />
          </div>
        )}
      </div>
    </Card>
  );
}

function ChartDragPreview({
  categoryStats,
  chartId,
  dailyExpenseStats,
  monthlyStats,
}: Pick<ChartSlotProps, 'categoryStats' | 'chartId' | 'dailyExpenseStats' | 'monthlyStats'>) {
  const chartMeta = getChartMeta(chartId);
  const chart = renderChart({ categoryStats, chartId, dailyExpenseStats, monthlyStats });

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed -left-[10000px] top-0 w-80 rounded-md border border-border bg-surface p-3 shadow-xl"
      data-chart-drag-preview
    >
      <div className="mb-2">
        <p className="text-xs font-semibold uppercase text-text-soft">Chart preview</p>
        <h3 className="mt-1 text-sm font-semibold text-text">{chartMeta.title}</h3>
      </div>
      <div className="h-44">
        {chart ? (
          <ResponsiveContainer height="100%" width="100%">
            {chart}
          </ResponsiveContainer>
        ) : (
          <EmptyState
            description="Add transactions to see this chart."
            title={getChartEmptyTitle(chartId)}
          />
        )}
      </div>
    </div>
  );
}

export function DashboardAnalytics({ transactions }: DashboardAnalyticsProps) {
  const availableCurrencies = useMemo(
    () => getTransactionCurrencyOptions(transactions),
    [transactions],
  );
  const isMultiCurrency = availableCurrencies.length > 1;

  const [activeCurrency, setActiveCurrency] = useState<string>(() => {
    const stored = localStorageService.get('analyticsActiveCurrency');
    return stored ?? availableCurrencies[0] ?? '';
  });

  const displayCurrency = useMemo(
    () =>
      availableCurrencies.includes(activeCurrency)
        ? activeCurrency
        : (availableCurrencies[0] ?? ''),
    [availableCurrencies, activeCurrency],
  );

  function handleCurrencyChange(currency: string) {
    setActiveCurrency(currency);
    localStorageService.set('analyticsActiveCurrency', currency);
  }

  const filteredTransactions = useMemo(
    () =>
      isMultiCurrency ? transactions.filter((t) => t.currency === displayCurrency) : transactions,
    [transactions, isMultiCurrency, displayCurrency],
  );

  const { categoryStats, monthlyStats, source } = useAnalyticsStats(
    filteredTransactions,
    isMultiCurrency,
  );
  const [chartSlots, setChartSlots] = useState<ChartSlots>(() =>
    parseChartSlots(localStorageService.get('analyticsChartSlots')),
  );
  const [wideChartId, setWideChartId] = useState<ChartId | null>(() =>
    parseWideChartId(localStorageService.get('analyticsWideChartId')),
  );
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<0 | 1>(0);
  const dailyExpenseStats = useMemo(
    () => calculateDailyExpenseStats(filteredTransactions),
    [filteredTransactions],
  );

  function updateChartSlot(slotIndex: 0 | 1, chartId: ChartId) {
    const nextSlots: ChartSlots =
      slotIndex === 0 ? [chartId, chartSlots[1]] : [chartSlots[0], chartId];

    setChartSlots(nextSlots);
    setWideChartId(null);
    localStorageService.set('analyticsChartSlots', serializeChartSlots(nextSlots));
    localStorageService.remove('analyticsWideChartId');
  }

  function updateWideChart(chartId: ChartId) {
    if (!supportsWideChart(chartId)) {
      return;
    }

    setWideChartId(chartId);
    localStorageService.set('analyticsWideChartId', chartId);
  }

  function clearWideChart() {
    setWideChartId(null);
    localStorageService.remove('analyticsWideChartId');
  }

  function openPicker(slotIndex: 0 | 1) {
    setSelectedSlotIndex(slotIndex);
    setIsPickerOpen(true);
  }

  if (!transactions.length) {
    return (
      <EmptyState
        description="Analytics will appear after you add transactions to Ledger."
        illustration="chart"
        title="No analytics yet"
      />
    );
  }

  return (
    <section className="relative">
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-text-soft">
            {source === 'google-sheets' ? 'Google Sheets analytics' : 'Local analytics'}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {isMultiCurrency ? (
              <div className="flex gap-1">
                {availableCurrencies.map((currency) => (
                  <Button
                    key={currency}
                    onClick={() => handleCurrencyChange(currency)}
                    size="sm"
                    variant={currency === displayCurrency ? 'secondary' : 'ghost'}
                  >
                    {currency}
                  </Button>
                ))}
              </div>
            ) : null}
            <Button
              className="w-full sm:w-auto"
              onClick={() => setIsPickerOpen((current) => !current)}
              variant="secondary"
            >
              {isPickerOpen ? 'Close' : 'Customize dashboard'}
            </Button>
          </div>
        </div>
        {wideChartId ? (
          <ChartSlot
            categoryStats={categoryStats}
            chartId={wideChartId}
            dailyExpenseStats={dailyExpenseStats}
            isWide
            monthlyStats={monthlyStats}
            onDropChart={updateWideChart}
            onOpenPicker={() => setIsPickerOpen(true)}
            onSplit={clearWideChart}
            slotLabel="Focus view"
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartSlot
              categoryStats={categoryStats}
              chartId={chartSlots[0]}
              dailyExpenseStats={dailyExpenseStats}
              monthlyStats={monthlyStats}
              onDropChart={(chartId) => updateChartSlot(0, chartId)}
              onOpenPicker={() => openPicker(0)}
              slotLabel="Main insight"
            />
            <ChartSlot
              categoryStats={categoryStats}
              chartId={chartSlots[1]}
              dailyExpenseStats={dailyExpenseStats}
              monthlyStats={monthlyStats}
              onDropChart={(chartId) => updateChartSlot(1, chartId)}
              onOpenPicker={() => openPicker(1)}
              slotLabel="Secondary insight"
            />
          </div>
        )}
      </div>
      {isPickerOpen ? (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setIsPickerOpen(false)}
          />
          <aside className="animate-drawer-in-right fixed inset-x-3 bottom-3 top-16 z-40 overflow-y-auto sm:inset-x-4 sm:bottom-4 sm:top-20 xl:inset-x-auto xl:right-4 xl:w-96">
            <Card className="min-h-full">
              <div className="mb-5 flex items-start justify-between gap-3 border-b border-border pb-4">
                <div>
                  <h2 className="text-base font-semibold text-text">Customize dashboard</h2>
                  <p className="mt-1 text-sm text-text-soft">
                    Drag a chart onto the canvas or assign it to a slot.
                  </p>
                </div>
                <Button onClick={() => setIsPickerOpen(false)} size="sm" variant="ghost">
                  ✕
                </Button>
              </div>
              <div className="grid gap-2">
                {chartCatalog.map((chart) => {
                  const isActive =
                    chartSlots[selectedSlotIndex] === chart.id || wideChartId === chart.id;
                  const typeLabel = chartTypeLabels[chart.id] ?? 'Chart';

                  return (
                    <div
                      className={
                        isActive
                          ? 'rounded-xl border border-brand bg-brand-soft px-3 py-3 text-left'
                          : 'rounded-xl border border-border bg-surface px-3 py-3 text-left hover:border-border-strong hover:bg-surface-hover'
                      }
                      draggable
                      key={chart.id}
                      onDragStart={(event) => {
                        const preview = event.currentTarget.querySelector<HTMLElement>(
                          '[data-chart-drag-preview]',
                        );
                        event.dataTransfer.effectAllowed = 'copy';
                        event.dataTransfer.setData('text/plain', chart.id);
                        if (preview) {
                          event.dataTransfer.setDragImage(preview, 160, 96);
                        }
                      }}
                      tabIndex={0}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-text">{chart.title}</span>
                            <span className="rounded-full border border-border px-1.5 py-0.5 text-xs text-text-soft">
                              {typeLabel}
                            </span>
                          </div>
                          <span className="mt-0.5 block text-xs text-text-soft">
                            {chart.description}
                          </span>
                        </div>
                      </div>
                      <ChartDragPreview
                        categoryStats={categoryStats}
                        chartId={chart.id}
                        dailyExpenseStats={dailyExpenseStats}
                        monthlyStats={monthlyStats}
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          onClick={() => updateChartSlot(0, chart.id)}
                          size="sm"
                          variant="ghost"
                        >
                          Main
                        </Button>
                        <Button
                          onClick={() => updateChartSlot(1, chart.id)}
                          size="sm"
                          variant="ghost"
                        >
                          Secondary
                        </Button>
                        {chart.supportsWide ? (
                          <Button
                            onClick={() => updateWideChart(chart.id)}
                            size="sm"
                            variant="secondary"
                          >
                            Focus view
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </aside>
        </>
      ) : null}
    </section>
  );
}
