import { useState } from 'react';

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
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';
import { ConfirmModal } from '@shared/ui/confirm-modal';
import { PageHeader } from '@shared/ui/page-header';

function formatMoney(amount: number, currency: string) {
  return `${amount.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })} ${currency}`;
}

type SummaryCardProps = {
  label: string;
  getValue: (entry: CurrencySummary) => number;
  summaries: CurrencySummary[];
};

function SummaryCard({ label, getValue, summaries }: SummaryCardProps) {
  return (
    <Card>
      <p className="text-sm text-zinc-500">{label}</p>
      {summaries.length === 0 ? (
        <p className="mt-2 text-xl font-semibold text-zinc-500 md:text-2xl">—</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {summaries.map((entry) => (
            <li
              className="break-words text-xl font-semibold text-zinc-950 md:text-2xl"
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
      <section className="grid gap-3 sm:grid-cols-3 md:gap-4">
        <SummaryCard getValue={(entry) => entry.income} label="Income" summaries={summaries} />
        <SummaryCard getValue={(entry) => entry.expense} label="Expense" summaries={summaries} />
        <SummaryCard getValue={(entry) => entry.balance} label="Balance" summaries={summaries} />
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
