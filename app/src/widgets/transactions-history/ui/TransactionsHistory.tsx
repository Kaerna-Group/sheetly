import { useMemo, useState } from 'react';

import type { Transaction } from '@entities/transaction';
import {
  createDefaultTransactionFilters,
  filterTransactions,
  getTransactionCategoryOptions,
  type TransactionFilters,
} from '@features/filter-transactions';
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';
import { EmptyState } from '@shared/ui/empty-state';
import { Input } from '@shared/ui/input';
import { Select } from '@shared/ui/select';
import { Skeleton } from '@shared/ui/skeleton';

type TransactionsHistoryProps = {
  error: string | null;
  isLoading: boolean;
  onCreateTransaction: () => void;
  onRefresh: () => void | Promise<void>;
  transactions: Transaction[];
};

const defaultCurrency = 'UAH';

function formatMoney(amount: number, currency = defaultCurrency) {
  return `${amount.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })} ${currency}`;
}

function formatKind(kind: Transaction['kind']) {
  return kind === 'income' ? 'Income' : 'Expense';
}

function hasActiveFilters(filters: TransactionFilters) {
  return Boolean(
    filters.category ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.kind !== 'all' ||
    filters.query,
  );
}

function TransactionsHistorySkeleton() {
  return (
    <div aria-label="Loading transactions" role="status">
      <div className="hidden grid-cols-[120px_96px_1fr_140px_160px_1fr] gap-3 border-b border-zinc-200 px-5 py-3 md:grid">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton className="h-3" key={index} />
        ))}
      </div>
      <div className="divide-y divide-zinc-100">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            className="grid gap-3 px-5 py-4 md:grid-cols-[120px_96px_1fr_140px_160px_1fr] md:items-center"
            key={index}
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24 md:justify-self-end" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-full max-w-48" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TransactionsHistory({
  error,
  isLoading,
  onCreateTransaction,
  onRefresh,
  transactions,
}: TransactionsHistoryProps) {
  const [filters, setFilters] = useState<TransactionFilters>(createDefaultTransactionFilters);
  const categoryOptions = useMemo(
    () => getTransactionCategoryOptions(transactions),
    [transactions],
  );
  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, filters),
    [filters, transactions],
  );
  const isFiltered = hasActiveFilters(filters);

  function updateFilters(nextFilters: Partial<TransactionFilters>) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      ...nextFilters,
    }));
  }

  function clearFilters() {
    setFilters(createDefaultTransactionFilters());
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-danger">{error}</p>
          <Button onClick={() => void onRefresh()} variant="secondary">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (!isLoading && !transactions.length) {
    return (
      <EmptyState
        actionLabel="Create transaction"
        description="Transactions from Ledger will appear here after the first sync."
        onAction={onCreateTransaction}
        title="No transactions yet"
      />
    );
  }

  return (
    <Card className="p-0">
      <div className="flex flex-col gap-4 border-b border-zinc-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">Transactions history</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {isLoading
              ? 'Refreshing transactions'
              : `${filteredTransactions.length} of ${transactions.length} transactions`}
          </p>
        </div>
        <Button disabled={isLoading} onClick={() => void onRefresh()} variant="secondary">
          Refresh
        </Button>
      </div>
      <div className="grid gap-4 border-b border-zinc-200 px-5 py-4 lg:grid-cols-5">
        <Input
          id="transactions-date-from"
          label="Date from"
          onChange={(event) => updateFilters({ dateFrom: event.target.value })}
          type="date"
          value={filters.dateFrom}
        />
        <Input
          id="transactions-date-to"
          label="Date to"
          onChange={(event) => updateFilters({ dateTo: event.target.value })}
          type="date"
          value={filters.dateTo}
        />
        <Select
          id="transactions-kind"
          label="Type"
          onChange={(event) =>
            updateFilters({ kind: event.target.value as TransactionFilters['kind'] })
          }
          value={filters.kind}
        >
          <option value="all">All</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </Select>
        <Select
          id="transactions-category"
          label="Category"
          onChange={(event) => updateFilters({ category: event.target.value })}
          value={filters.category}
        >
          <option value="">All categories</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
        <Input
          id="transactions-search"
          label="Search"
          onChange={(event) => updateFilters({ query: event.target.value })}
          placeholder="Comment, method, category"
          value={filters.query}
        />
      </div>
      {isLoading ? (
        <TransactionsHistorySkeleton />
      ) : !filteredTransactions.length ? (
        <EmptyState
          actionLabel={isFiltered ? 'Clear filters' : undefined}
          className="m-5"
          description="Try changing date, type, category or search query."
          onAction={isFiltered ? clearFilters : undefined}
          title="No matching transactions"
        />
      ) : (
        <div>
          <div className="hidden grid-cols-[120px_96px_1fr_140px_160px_1fr] gap-3 border-b border-zinc-200 px-5 py-3 text-xs font-semibold uppercase text-zinc-500 md:grid">
            <span>Date</span>
            <span>Type</span>
            <span>Category</span>
            <span className="text-right">Amount</span>
            <span>Payment method</span>
            <span>Comment</span>
          </div>
          <div className="divide-y divide-zinc-100">
            {filteredTransactions.map((transaction) => (
              <div
                className="grid gap-2 px-5 py-4 text-sm md:grid-cols-[120px_96px_1fr_140px_160px_1fr] md:items-center md:gap-3"
                key={transaction.id}
              >
                <div className="text-zinc-500">{transaction.date}</div>
                <div className="font-medium text-zinc-700">{formatKind(transaction.kind)}</div>
                <div className="font-medium text-zinc-950">{transaction.categoryName}</div>
                <div
                  className={
                    transaction.kind === 'income'
                      ? 'font-semibold text-emerald-600 md:text-right'
                      : 'font-semibold text-danger md:text-right'
                  }
                >
                  {formatMoney(transaction.signedAmount, transaction.currency)}
                </div>
                <div className="text-zinc-600">{transaction.paymentMethod || '-'}</div>
                <div className="text-zinc-600">{transaction.comment || '-'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
