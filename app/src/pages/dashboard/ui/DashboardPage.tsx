import { useState } from 'react';

import { CreateTransactionModal } from '@features/create-transaction';
import { GoogleConnectButton, GoogleConnectionStatus, useGoogleAuth } from '@features/google-auth';
import { calculateTransactionSummary, useTransactions } from '@features/manage-transactions';
import { AppLayout } from '@widgets/app-layout';
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';
import { EmptyState } from '@shared/ui/empty-state';
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
  const googleAuth = useGoogleAuth();
  const { createAndRefresh, error, isCreating, isLoading, refresh, transactions } =
    useTransactions();
  const summary = calculateTransactionSummary(transactions);
  const currency = transactions[0]?.currency ?? defaultCurrency;
  const latestTransactions = transactions.slice(0, 8);

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
      {error ? (
        <Card className="border-red-200 bg-red-50">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-danger">{error}</p>
            <Button onClick={() => void refresh()} variant="secondary">
              Retry
            </Button>
          </div>
        </Card>
      ) : null}
      {isLoading ? (
        <Card>
          <p className="text-sm text-zinc-500">Loading transactions...</p>
        </Card>
      ) : latestTransactions.length ? (
        <Card className="p-0">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="text-base font-semibold text-zinc-950">Latest transactions</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {latestTransactions.map((transaction) => (
              <div
                className="grid gap-2 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center"
                key={transaction.id}
              >
                <div>
                  <p className="font-medium text-zinc-950">{transaction.categoryName}</p>
                  <p className="text-sm text-zinc-500">
                    {transaction.date}
                    {transaction.paymentMethod ? ` · ${transaction.paymentMethod}` : ''}
                    {transaction.comment ? ` · ${transaction.comment}` : ''}
                  </p>
                </div>
                <p
                  className={
                    transaction.kind === 'income'
                      ? 'font-semibold text-emerald-600'
                      : 'font-semibold text-danger'
                  }
                >
                  {formatMoney(transaction.signedAmount, transaction.currency)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <EmptyState
          actionLabel="Create transaction"
          description="Transactions from Ledger will appear here after the first sync."
          onAction={() => setIsCreateTransactionOpen(true)}
          title="No transactions yet"
        />
      )}
      <CreateTransactionModal
        error={error}
        isCreating={isCreating}
        isOpen={isCreateTransactionOpen}
        onCreate={createAndRefresh}
        onClose={() => setIsCreateTransactionOpen(false)}
      />
    </AppLayout>
  );
}
