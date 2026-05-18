import { useState } from 'react';

import { CreateTransactionModal } from '@features/create-transaction';
import { GoogleConnectButton, GoogleConnectionStatus, useGoogleAuth } from '@features/google-auth';
import { AppLayout } from '@widgets/app-layout';
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';
import { EmptyState } from '@shared/ui/empty-state';
import { PageHeader } from '@shared/ui/page-header';

export function DashboardPage() {
  const [isCreateTransactionOpen, setIsCreateTransactionOpen] = useState(false);
  const googleAuth = useGoogleAuth();

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
          <p className="mt-2 text-2xl font-semibold text-zinc-950">0 UAH</p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500">Expense</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">0 UAH</p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500">Balance</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">0 UAH</p>
        </Card>
      </section>
      <EmptyState
        actionLabel="Create transaction"
        description="Transactions will be read from Ledger after the Google Integration milestone."
        onAction={() => setIsCreateTransactionOpen(true)}
        title="No transactions yet"
      />
      <CreateTransactionModal
        isOpen={isCreateTransactionOpen}
        onClose={() => setIsCreateTransactionOpen(false)}
      />
    </AppLayout>
  );
}
