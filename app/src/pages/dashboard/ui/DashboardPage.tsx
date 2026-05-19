import { useState } from 'react';

import { CreateTransactionModal } from '@features/create-transaction';
import { GoogleConnectButton, GoogleConnectionStatus, useGoogleAuth } from '@features/google-auth';
import { calculateTransactionSummary, useTransactions } from '@features/manage-transactions';
import { AppLayout } from '@widgets/app-layout';
import { TransactionsHistory } from '@widgets/transactions-history';
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';
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
      <TransactionsHistory
        error={error}
        isLoading={isLoading}
        onCreateTransaction={() => setIsCreateTransactionOpen(true)}
        onRefresh={refresh}
        transactions={transactions}
      />
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
