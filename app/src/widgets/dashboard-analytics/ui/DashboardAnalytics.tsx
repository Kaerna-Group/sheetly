import { useMemo, useState } from 'react';

import type { Transaction } from '@entities/transaction';
import {
  useAnalyticsStats,
  type CategoryStats,
  type ChartId,
} from '@features/analyze-transactions';
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

function renderEmptyChart(title: string) {
  return <EmptyState description="Add transactions to see this chart." title={title} />;
}

function renderChart({
  categoryStats,
  chartId,
  dailyExpenseStats,
  monthlyStats,
}: Pick<ChartSlotProps, 'categoryStats' | 'chartId' | 'dailyExpenseStats' | 'monthlyStats'>) {
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

  if (chartId === 'monthly-cashflow') {
    if (!monthlyStats.length) {
      return renderEmptyChart('No monthly stats');
    }

    return (
      <BarChart data={monthlyStats}>
        <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tickLine={false} />
        <YAxis tickFormatter={formatMoney} tickLine={false} width={56} />
        <Tooltip formatter={(value) => formatMoney(Number(value))} />
        <Legend />
        <Bar dataKey="income" fill="#059669" name="Income" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" fill="#dc2626" name="Expense" radius={[4, 4, 0, 0]} />
      </BarChart>
    );
  }

  if (chartId === 'balance-trend') {
    if (!monthlyStats.length) {
      return renderEmptyChart('No balance trend');
    }

    return (
      <LineChart data={monthlyStats}>
        <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tickLine={false} />
        <YAxis tickFormatter={formatMoney} tickLine={false} width={56} />
        <Tooltip formatter={(value) => formatMoney(Number(value))} />
        <Line dataKey="balance" name="Balance" stroke="#4f46e5" strokeWidth={3} type="monotone" />
      </LineChart>
    );
  }

  if (chartId === 'expense-categories') {
    if (!expenseCategoryStats.length) {
      return renderEmptyChart('No expenses yet');
    }

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
        <Tooltip formatter={(value) => formatMoney(Number(value))} />
      </PieChart>
    );
  }

  if (chartId === 'category-bar') {
    if (!expenseCategoryStats.length) {
      return renderEmptyChart('No category totals');
    }

    return (
      <BarChart data={[...expenseCategoryStats].sort((left, right) => right.total - left.total)}>
        <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="categoryName" tickLine={false} />
        <YAxis tickFormatter={formatMoney} tickLine={false} width={56} />
        <Tooltip formatter={(value) => formatMoney(Number(value))} />
        <Bar dataKey="total" fill="#0f766e" name="Total" radius={[4, 4, 0, 0]} />
      </BarChart>
    );
  }

  if (chartId === 'income-expense-ratio') {
    if (!ratioStats.some((stat) => stat.total > 0)) {
      return renderEmptyChart('No totals yet');
    }

    return (
      <BarChart data={ratioStats}>
        <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tickLine={false} />
        <YAxis tickFormatter={formatMoney} tickLine={false} width={56} />
        <Tooltip formatter={(value) => formatMoney(Number(value))} />
        <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]}>
          {ratioStats.map((stat, index) => (
            <Cell fill={index === 0 ? '#059669' : '#dc2626'} key={stat.label} />
          ))}
        </Bar>
      </BarChart>
    );
  }

  if (!dailyExpenseStats.length) {
    return renderEmptyChart('No daily expenses');
  }

  return (
    <LineChart data={dailyExpenseStats}>
      <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="label" tickLine={false} />
      <YAxis tickFormatter={formatMoney} tickLine={false} width={56} />
      <Tooltip formatter={(value) => formatMoney(Number(value))} />
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

  return (
    <Card
      className={isWide ? 'min-h-[420px]' : 'min-h-[360px]'}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        const droppedChartId = event.dataTransfer.getData('text/plain');

        if (
          chartCatalog.some((chart) => chart.id === droppedChartId) &&
          (!isWide || supportsWideChart(droppedChartId as ChartId))
        ) {
          onDropChart(droppedChartId as ChartId);
        }
      }}
    >
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-400">{slotLabel}</p>
          <h2 className="mt-1 text-base font-semibold text-zinc-950">{chartMeta.title}</h2>
          <p className="mt-1 text-sm text-zinc-500">{chartMeta.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isWide && onSplit ? (
            <Button onClick={onSplit} size="sm" variant="ghost">
              Split view
            </Button>
          ) : null}
          <Button onClick={onOpenPicker} size="sm" variant="secondary">
            Change
          </Button>
        </div>
      </div>
      <div className={isWide ? 'h-80' : 'h-72'}>
        <ResponsiveContainer height="100%" width="100%">
          {renderChart({ categoryStats, chartId, dailyExpenseStats, monthlyStats })}
        </ResponsiveContainer>
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

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed -left-[10000px] top-0 w-80 rounded-md border border-zinc-200 bg-white p-3 shadow-xl"
      data-chart-drag-preview
    >
      <div className="mb-2">
        <p className="text-xs font-semibold uppercase text-zinc-400">Chart preview</p>
        <h3 className="mt-1 text-sm font-semibold text-zinc-950">{chartMeta.title}</h3>
      </div>
      <div className="h-44">
        <ResponsiveContainer height="100%" width="100%">
          {renderChart({ categoryStats, chartId, dailyExpenseStats, monthlyStats })}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function DashboardAnalytics({ transactions }: DashboardAnalyticsProps) {
  const { categoryStats, monthlyStats, source } = useAnalyticsStats(transactions);
  const [chartSlots, setChartSlots] = useState<ChartSlots>(() =>
    parseChartSlots(localStorageService.get('analyticsChartSlots')),
  );
  const [wideChartId, setWideChartId] = useState<ChartId | null>(() =>
    parseWideChartId(localStorageService.get('analyticsWideChartId')),
  );
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<0 | 1>(0);
  const dailyExpenseStats = useMemo(() => calculateDailyExpenseStats(transactions), [transactions]);

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
        title="No analytics yet"
      />
    );
  }

  return (
    <section className="relative">
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-zinc-500">
            {source === 'google-sheets' ? 'Google Sheets analytics' : 'Local analytics'}
          </p>
          <Button onClick={() => setIsPickerOpen((current) => !current)} variant="secondary">
            {isPickerOpen ? 'Hide charts' : 'Choose charts'}
          </Button>
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
            slotLabel="Wide chart"
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
              slotLabel="Slot 1"
            />
            <ChartSlot
              categoryStats={categoryStats}
              chartId={chartSlots[1]}
              dailyExpenseStats={dailyExpenseStats}
              monthlyStats={monthlyStats}
              onDropChart={(chartId) => updateChartSlot(1, chartId)}
              onOpenPicker={() => openPicker(1)}
              slotLabel="Slot 2"
            />
          </div>
        )}
      </div>
      {isPickerOpen ? (
        <aside className="fixed inset-x-4 bottom-4 top-20 z-40 overflow-y-auto xl:inset-x-auto xl:right-4 xl:w-80">
          <Card className="min-h-full">
            <div className="mb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-zinc-950">Chart library</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Choose chart for slot {selectedSlotIndex + 1} or wide view.
                  </p>
                </div>
                <Button onClick={() => setIsPickerOpen(false)} size="sm" variant="ghost">
                  Close
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              {chartCatalog.map((chart) => (
                <div
                  className={
                    chartSlots[selectedSlotIndex] === chart.id || wideChartId === chart.id
                      ? 'rounded-md border border-brand bg-indigo-50 px-3 py-3 text-left'
                      : 'rounded-md border border-zinc-200 bg-white px-3 py-3 text-left hover:border-zinc-300 hover:bg-zinc-50'
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
                  <span className="block text-sm font-semibold text-zinc-950">{chart.title}</span>
                  <span className="mt-1 block text-sm text-zinc-500">{chart.description}</span>
                  <ChartDragPreview
                    categoryStats={categoryStats}
                    chartId={chart.id}
                    dailyExpenseStats={dailyExpenseStats}
                    monthlyStats={monthlyStats}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button onClick={() => updateChartSlot(0, chart.id)} size="sm" variant="ghost">
                      Slot 1
                    </Button>
                    <Button onClick={() => updateChartSlot(1, chart.id)} size="sm" variant="ghost">
                      Slot 2
                    </Button>
                    {chart.supportsWide ? (
                      <Button
                        onClick={() => updateWideChart(chart.id)}
                        size="sm"
                        variant="secondary"
                      >
                        Wide
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      ) : null}
    </section>
  );
}
