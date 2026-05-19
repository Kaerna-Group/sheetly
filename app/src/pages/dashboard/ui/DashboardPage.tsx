import { useState } from 'react';

import type { Transaction } from '@entities/transaction';
import { CreateTransactionModal } from '@features/create-transaction';
import { GoogleConnectButton, GoogleConnectionStatus, useGoogleAuth } from '@features/google-auth';
import { useContainers } from '@features/manage-containers';
import { calculateTransactionSummary, useTransactions } from '@features/manage-transactions';
import { AppLayout } from '@widgets/app-layout';
import { DashboardAnalytics } from '@widgets/dashboard-analytics';
import { TransactionsHistory } from '@widgets/transactions-history';
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';
import { ConfirmModal } from '@shared/ui/confirm-modal';
import { PageHeader } from '@shared/ui/page-header';

const defaultCurrency = 'UAH';

function formatMoney(amount: number, currency = defaultCurrency) {
  return `${amount.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })} ${currency}`;
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
  const summary = calculateTransactionSummary(transactions);
  const currency = transactions[0]?.currency ?? defaultCurrency;
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
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-zinc-500">Income</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">
            {formatMoney(summary.income, currency)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500">Expense</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">
            {formatMoney(summary.expense, currency)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500">Balance</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">
            {formatMoney(summary.balance, currency)}
          </p>
        </Card>
      </section>
      <DashboardAnalytics transactions={transactions} />
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
