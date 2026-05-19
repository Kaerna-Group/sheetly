import type { Transaction } from '@entities/transaction';
import {
  calculateCategoryStats,
  calculateMonthlyStats,
  calculateTopCategories,
} from '@features/analyze-transactions';
import { Card } from '@shared/ui/card';
import { EmptyState } from '@shared/ui/empty-state';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type DashboardAnalyticsProps = {
  transactions: Transaction[];
};

const chartColors = ['#4f46e5', '#0f766e', '#dc2626', '#9333ea', '#ca8a04'];

function formatMoney(value: number) {
  return value.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });
}

export function DashboardAnalytics({ transactions }: DashboardAnalyticsProps) {
  const monthlyStats = calculateMonthlyStats(transactions);
  const categoryStats = calculateCategoryStats(transactions).filter(
    (categoryStatsItem) => categoryStatsItem.expense > 0,
  );
  const topCategories = calculateTopCategories(transactions);

  if (!transactions.length) {
    return (
      <EmptyState
        description="Analytics will appear after you add transactions to Ledger."
        title="No analytics yet"
      />
    );
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <Card>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-zinc-950">Monthly cashflow</h2>
          <p className="mt-1 text-sm text-zinc-500">Income and expense grouped by month.</p>
        </div>
        <div className="h-72">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={monthlyStats}>
              <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} />
              <YAxis tickFormatter={formatMoney} tickLine={false} width={56} />
              <Tooltip formatter={(value) => formatMoney(Number(value))} />
              <Legend />
              <Bar dataKey="income" fill="#059669" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#dc2626" name="Expense" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-zinc-950">Expense categories</h2>
          <p className="mt-1 text-sm text-zinc-500">Where the money goes most often.</p>
        </div>
        {categoryStats.length ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr] xl:grid-cols-1">
            <div className="h-56">
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie
                    data={categoryStats}
                    dataKey="expense"
                    innerRadius={48}
                    nameKey="categoryName"
                    outerRadius={82}
                    paddingAngle={2}
                  >
                    {categoryStats.map((categoryStatsItem, index) => (
                      <Cell
                        fill={chartColors[index % chartColors.length]}
                        key={categoryStatsItem.categoryName}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatMoney(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {topCategories.map((categoryStatsItem, index) => (
                <div
                  className="flex items-center justify-between gap-3 text-sm"
                  key={categoryStatsItem.categoryName}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: chartColors[index % chartColors.length] }}
                    />
                    <span className="font-medium text-zinc-800">
                      {categoryStatsItem.categoryName}
                    </span>
                  </div>
                  <span className="text-zinc-500">{formatMoney(categoryStatsItem.total)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            description="Expense breakdown will appear after the first expense transaction."
            title="No expenses yet"
          />
        )}
      </Card>
    </section>
  );
}
