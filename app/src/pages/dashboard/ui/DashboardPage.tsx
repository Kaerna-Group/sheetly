import { useMemo, useState } from 'react';

import type { Transaction } from '@entities/transaction';
import { CreateTransactionModal } from '@features/create-transaction';
import { GoogleConnectButton, GoogleConnectionStatus, useGoogleAuth } from '@features/google-auth';
import { useContainers } from '@features/manage-containers';
import {
  calculateTransactionSummary,
  type CurrencySummary,
  useTransactions,
} from '@features/manage-transactions';
import { AppLayout } from '@widgets/app-layout';
import { DashboardAnalytics } from '@widgets/dashboard-analytics';
import { TransactionsHistory } from '@widgets/transactions-history';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';
import { ConfirmModal } from '@shared/ui/confirm-modal';
import { PageHeader } from '@shared/ui/page-header';
import { cn } from '@shared/lib/classnames/cn';

function formatMoney(amount: number, currency: string) {
  return `${amount.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })} ${currency}`;
}

function computeSparklineData(transactions: Transaction[], currency: string) {
  const filtered = [...transactions]
    .filter((t) => t.currency === currency)
    .sort((a, b) => a.date.localeCompare(b.date));

  let running = 0;
  const points = filtered.map((t) => {
    running += t.signedAmount;
    return { value: running };
  });

  return points.slice(-20);
}

function computeMonthDelta(transactions: Transaction[], currency: string) {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const thisMonth = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;

  return transactions
    .filter((t) => t.currency === currency && t.date.startsWith(thisMonth))
    .reduce((sum, t) => sum + t.signedAmount, 0);
}

type BalanceHeroCardProps = {
  className?: string;
  summaries: CurrencySummary[];
  transactions: Transaction[];
};

function BalanceHeroCard({ className, summaries, transactions }: BalanceHeroCardProps) {
  const primary = summaries[0];

  const sparklineData = useMemo(
    () => (primary ? computeSparklineData(transactions, primary.currency) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions, primary?.currency],
  );

  const monthDelta = useMemo(
    () => (primary ? computeMonthDelta(transactions, primary.currency) : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions, primary?.currency],
  );

  const isUp = monthDelta >= 0;
  const sparkColor = isUp ? 'var(--color-success)' : 'var(--color-danger)';

  return (
    <Card
      className={cn(
        'relative flex flex-col overflow-hidden hover:-translate-y-0.5 hover:shadow-2xl',
        className,
      )}
      variant="elevated"
    >
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-brand-soft blur-3xl" />
      <p className="relative text-sm text-text-soft">Balance</p>
      {!primary ? (
        <p className="relative mt-3 text-4xl font-bold tracking-tight text-text-soft">—</p>
      ) : (
        <>
          <p className="relative mt-3 text-3xl font-bold tracking-tight text-text sm:text-4xl md:text-5xl">
            {formatMoney(primary.balance, primary.currency)}
          </p>
          {summaries.length > 1 && (
            <ul className="relative mt-1 space-y-0.5">
              {summaries.slice(1).map((s) => (
                <li className="text-sm text-text-soft" key={s.currency}>
                  {formatMoney(s.balance, s.currency)}
                </li>
              ))}
            </ul>
          )}
          <div className="relative mt-3">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                isUp ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
              )}
            >
              {isUp ? '↑' : '↓'}
              {formatMoney(Math.abs(monthDelta), primary.currency)} this month
            </span>
          </div>
        </>
      )}
      {sparklineData.length > 2 && (
        <div className="-mx-6 -mb-6 mt-auto pt-6">
          <ResponsiveContainer height={64} width="100%">
            <AreaChart data={sparklineData} margin={{ bottom: 0, left: 0, right: 0, top: 4 }}>
              <defs>
                <linearGradient id="balanceSparkGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                dataKey="value"
                dot={false}
                fill="url(#balanceSparkGradient)"
                isAnimationActive={false}
                stroke={sparkColor}
                strokeWidth={1.5}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

const summaryColorMap = {
  income: {
    icon: '↑',
    iconClass: 'bg-success-soft text-success',
    orb: 'bg-success-soft',
  },
  expense: {
    icon: '↓',
    iconClass: 'bg-danger-soft text-danger',
    orb: 'bg-danger-soft',
  },
} as const;

type SummaryColor = keyof typeof summaryColorMap;

type SummaryCardProps = {
  color: SummaryColor;
  getValue: (entry: CurrencySummary) => number;
  label: string;
  summaries: CurrencySummary[];
};

function SummaryCard({ color, getValue, label, summaries }: SummaryCardProps) {
  const { icon, iconClass, orb } = summaryColorMap[color];
  return (
    <Card
      className="relative overflow-hidden hover:-translate-y-0.5 hover:shadow-md"
      variant="metric"
    >
      <div className={cn('absolute -right-4 -top-4 h-20 w-20 rounded-full blur-2xl', orb)} />
      <div className="relative flex items-center justify-between">
        <p className="text-sm text-text-soft">{label}</p>
        <span
          className={cn(
            'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
            iconClass,
          )}
        >
          {icon}
        </span>
      </div>
      {summaries.length === 0 ? (
        <p className="relative mt-2 text-xl font-semibold text-text-soft md:text-2xl">—</p>
      ) : (
        <ul className="relative mt-2 space-y-1">
          {summaries.map((entry) => (
            <li
              className="break-words text-xl font-semibold text-text md:text-2xl"
              key={entry.currency}
            >
              {formatMoney(getValue(entry), entry.currency)}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function DashboardPage() {
  const [isCreateTransactionOpen, setIsCreateTransactionOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const googleAuth = useGoogleAuth();
  const containersEnabled = localStorage.getItem('containersEnabled') === 'true';
  const { containers } = useContainers();
  const {
    createAndRefresh,
    deleteAndRefresh,
    error,
    isCreating,
    isLoading,
    isSyncing,
    refresh,
    retrySync,
    syncWarning,
    transactions,
    updateAndRefresh,
  } = useTransactions();
  const activeTransactions = transactions.filter((transaction) => !transaction.deletedAt);
  const summaries = calculateTransactionSummary(activeTransactions);
  const lastSelectedContainerId = localStorage.getItem('lastSelectedContainerId');
  const initialContainer =
    containers.find((container) => container.id === lastSelectedContainerId) ??
    containers[0] ??
    null;

  return (
    <AppLayout
      actions={
        <>
          <GoogleConnectionStatus status={googleAuth.status} />
          <GoogleConnectButton />
        </>
      }
    >
      <PageHeader
        actions={<Button onClick={() => setIsCreateTransactionOpen(true)}>New transaction</Button>}
        description="Track income, expenses and balance from your Google Sheets ledger."
        title="Dashboard"
      />
      <section className="grid gap-3 md:gap-4 lg:grid-cols-3">
        <BalanceHeroCard
          className="lg:col-span-2"
          summaries={summaries}
          transactions={activeTransactions}
        />
        <div className="grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-1">
          <SummaryCard
            color="income"
            getValue={(entry) => entry.income}
            label="Income"
            summaries={summaries}
          />
          <SummaryCard
            color="expense"
            getValue={(entry) => entry.expense}
            label="Expense"
            summaries={summaries}
          />
        </div>
      </section>
      <DashboardAnalytics transactions={activeTransactions} />
      <TransactionsHistory
        containersEnabled={containersEnabled}
        error={error}
        isLoading={isLoading}
        isSyncing={isSyncing}
        onCreateTransaction={() => setIsCreateTransactionOpen(true)}
        onDeleteTransaction={(transactionId) => setDeletingTransactionId(transactionId)}
        onEditTransaction={setEditingTransaction}
        onRefresh={refresh}
        onRetrySync={retrySync}
        syncWarning={syncWarning}
        transactions={transactions}
      />
      <CreateTransactionModal
        containersEnabled={containersEnabled}
        error={error}
        initialContainer={initialContainer}
        isCreating={isCreating}
        isOpen={isCreateTransactionOpen}
        key={`create-${containersEnabled}-${initialContainer?.id ?? 'none'}-${isCreateTransactionOpen}`}
        onCreate={createAndRefresh}
        onClose={() => setIsCreateTransactionOpen(false)}
      />
      {editingTransaction ? (
        <CreateTransactionModal
          error={error}
          containersEnabled={containersEnabled}
          initialTransaction={editingTransaction}
          isCreating={isCreating}
          isOpen
          key={editingTransaction.id}
          mode="edit"
          onCreate={updateAndRefresh}
          onClose={() => setEditingTransaction(null)}
        />
      ) : null}
      <ConfirmModal
        confirmLabel="Delete transaction"
        description="The transaction will be hidden from Sheetly and marked as deleted in Ledger."
        isOpen={Boolean(deletingTransactionId)}
        onClose={() => setDeletingTransactionId(null)}
        onConfirm={async () => {
          if (deletingTransactionId) {
            await deleteAndRefresh(deletingTransactionId);
          }

          setDeletingTransactionId(null);
        }}
        title="Delete transaction?"
      />
    </AppLayout>
  );
}
