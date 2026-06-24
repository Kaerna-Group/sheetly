import { useEffect, useMemo, useRef, useState } from 'react';

import type { Transaction } from '@entities/transaction';
import {
  createDefaultTransactionFilters,
  filterTransactions,
  getTransactionContainerOptions,
  getTransactionCategoryOptions,
  getTransactionCurrencyOptions,
  type TransactionFilters,
} from '@features/filter-transactions';
import { Badge, type BadgeVariant } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';
import { DatePicker } from '@shared/ui/date-picker';
import { EmptyState } from '@shared/ui/empty-state';
import { Input } from '@shared/ui/input';
import { Select } from '@shared/ui/select';
import { Skeleton } from '@shared/ui/skeleton';
import { cn } from '@shared/lib/classnames/cn';

type TransactionsHistoryProps = {
  containersEnabled?: boolean;
  error: string | null;
  isLoading: boolean;
  isSyncing?: boolean;
  onCreateTransaction: () => void;
  onDeleteTransaction: (transactionId: string) => void | Promise<void>;
  onEditTransaction: (transaction: Transaction) => void;
  onRefresh: () => void | Promise<void>;
  onRetrySync: () => void | Promise<void>;
  syncWarning?: string | null;
  transactions: Transaction[];
};

const defaultCurrency = 'UAH';

function formatMoney(amount: number, currency = defaultCurrency) {
  return `${amount.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })} ${currency}`;
}

const syncStatusVariants: Record<Transaction['syncStatus'], BadgeVariant> = {
  failed: 'danger',
  local: 'neutral',
  pending: 'warning',
  synced: 'success',
  syncing: 'info',
};

function formatSyncStatus(status: Transaction['syncStatus']) {
  return status[0].toUpperCase() + status.slice(1);
}

function useOutsideClose(isOpen: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen, onClose]);

  return ref;
}

function hasActiveFilters(filters: TransactionFilters) {
  return Boolean(
    filters.amountFrom ||
    filters.amountTo ||
    filters.category ||
    filters.container ||
    filters.currency ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.kind !== 'all' ||
    filters.query ||
    filters.showDeleted ||
    filters.syncStatus !== 'all',
  );
}

function TransactionsHistorySkeleton() {
  return (
    <div aria-label="Loading transactions" role="status">
      <div className="divide-y divide-border">
        {Array.from({ length: 5 }, (_, index) => (
          <div className="flex items-center gap-3 px-4 py-3 md:gap-4 md:px-5 md:py-4" key={index}>
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

type RowActionsProps = {
  onDelete: () => void | Promise<void>;
  onEdit: () => void;
};

function RowActions({ onDelete, onEdit }: RowActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useOutsideClose(isOpen, () => setIsOpen(false));

  return (
    <div className="relative shrink-0" ref={wrapperRef}>
      <button
        aria-label="Transaction actions"
        className="grid size-8 place-items-center rounded-md border border-border text-lg leading-none text-text-soft hover:bg-surface-hover hover:text-text"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        ...
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-full z-20 mt-2 w-32 rounded-md border border-border bg-surface p-1 shadow-lg">
          <button
            className="w-full rounded px-3 py-2 text-left text-sm text-text-muted hover:bg-surface-hover"
            onClick={() => {
              onEdit();
              setIsOpen(false);
            }}
            type="button"
          >
            Edit
          </button>
          <button
            className="w-full rounded px-3 py-2 text-left text-sm text-danger hover:bg-danger-soft"
            onClick={() => {
              void onDelete();
              setIsOpen(false);
            }}
            type="button"
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function TransactionsHistory({
  containersEnabled = false,
  error,
  isLoading,
  isSyncing = false,
  onCreateTransaction,
  onDeleteTransaction,
  onEditTransaction,
  onRefresh,
  onRetrySync,
  syncWarning = null,
  transactions,
}: TransactionsHistoryProps) {
  const [filters, setFilters] = useState<TransactionFilters>(createDefaultTransactionFilters);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);

  const categoryOptions = useMemo(
    () => getTransactionCategoryOptions(transactions),
    [transactions],
  );
  const containerOptions = useMemo(
    () => getTransactionContainerOptions(transactions),
    [transactions],
  );
  const currencyOptions = useMemo(
    () => getTransactionCurrencyOptions(transactions),
    [transactions],
  );
  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, filters),
    [filters, transactions],
  );

  const isFiltered = hasActiveFilters(filters);
  const isInitialLoading = isLoading && !transactions.length;
  const hasPendingSync = transactions.some((t) =>
    ['failed', 'pending', 'syncing'].includes(t.syncStatus),
  );

  function updateFilters(nextFilters: Partial<TransactionFilters>) {
    setFilters((current) => ({ ...current, ...nextFilters }));
  }

  function clearFilters() {
    setFilters(createDefaultTransactionFilters());
  }

  if (error && !transactions.length) {
    return (
      <Card className="border-danger/20 bg-danger-soft">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-danger">{error}</p>
          <Button onClick={() => void onRefresh()} variant="secondary">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (!isInitialLoading && !transactions.length) {
    return (
      <EmptyState
        actionLabel="Create transaction"
        description="Transactions from Ledger will appear here after the first sync."
        illustration="wallet"
        onAction={onCreateTransaction}
        onSecondAction={() => void onRefresh()}
        secondActionLabel="Refresh"
        title="No transactions yet"
      />
    );
  }

  return (
    <Card className="mb-16 p-0">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-text">Transactions history</h2>
          <p className="mt-1 text-sm text-text-soft">
            {`${filteredTransactions.length} of ${transactions.length} transactions`}
            {isLoading ? <span className="ml-2 text-brand">Refreshing...</span> : null}
          </p>
          {error ? <p className="mt-1 text-sm text-danger">{error}</p> : null}
          {syncWarning ? <p className="mt-1 text-sm text-warning">{syncWarning}</p> : null}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {hasPendingSync ? (
            <Button
              className="col-span-2 sm:col-span-1"
              disabled={isSyncing}
              isLoading={isSyncing}
              onClick={() => void onRetrySync()}
              variant="primary"
            >
              Retry sync
            </Button>
          ) : null}
          <Button
            className={hasPendingSync ? undefined : 'col-span-2 sm:col-span-1'}
            disabled={isLoading}
            onClick={() => void onRefresh()}
            variant="secondary"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-border bg-surface-muted/60 px-5 py-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.5fr)_minmax(120px,0.8fr)_minmax(160px,1fr)_auto_auto] lg:items-end">
          <Input
            className="truncate"
            id="transactions-search"
            label="Search"
            onChange={(event) => updateFilters({ query: event.target.value })}
            placeholder="Comment, method, category"
            value={filters.query}
          />
          <Select
            id="transactions-kind"
            label="Type"
            onChange={(kind) => updateFilters({ kind: kind as TransactionFilters['kind'] })}
            options={[
              { label: 'All', value: 'all' },
              { label: 'Income', value: 'income' },
              { label: 'Expense', value: 'expense' },
            ]}
            value={filters.kind}
          />
          <Select
            id="transactions-category"
            label="Category"
            onChange={(category) => updateFilters({ category })}
            options={[
              { label: 'All categories', value: '' },
              ...categoryOptions.map((category) => ({ label: category, value: category })),
            ]}
            value={filters.category}
          />
          <Button
            className="w-full"
            onClick={() => setIsAdvancedFiltersOpen((current) => !current)}
            type="button"
            variant="secondary"
          >
            {isAdvancedFiltersOpen ? 'Hide filters' : 'More filters'}
          </Button>
          <Button
            className="w-full"
            disabled={!isFiltered}
            onClick={clearFilters}
            type="button"
            variant="ghost"
          >
            Clear
          </Button>
        </div>
        {isAdvancedFiltersOpen ? (
          <div className="mt-4 grid gap-4 rounded-md border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(130px,1fr))]">
            <DatePicker
              id="transactions-date-from"
              label="Date from"
              onChange={(dateFrom) => updateFilters({ dateFrom })}
              value={filters.dateFrom}
            />
            <DatePicker
              id="transactions-date-to"
              label="Date to"
              onChange={(dateTo) => updateFilters({ dateTo })}
              value={filters.dateTo}
            />
            <Input
              id="transactions-amount-from"
              label="Amount from"
              onChange={(event) => updateFilters({ amountFrom: event.target.value })}
              placeholder="0"
              value={filters.amountFrom}
            />
            <Input
              id="transactions-amount-to"
              label="Amount to"
              onChange={(event) => updateFilters({ amountTo: event.target.value })}
              placeholder="1000"
              value={filters.amountTo}
            />
            <Select
              id="transactions-currency"
              label="Currency"
              onChange={(currency) => updateFilters({ currency })}
              options={[
                { label: 'All currencies', value: '' },
                ...currencyOptions.map((currency) => ({ label: currency, value: currency })),
              ]}
              value={filters.currency}
            />
            {containersEnabled ? (
              <Select
                id="transactions-container"
                label="Container"
                onChange={(container) => updateFilters({ container })}
                options={[
                  { label: 'All containers', value: '' },
                  ...containerOptions.map((container) => ({
                    label: container,
                    value: container,
                  })),
                ]}
                value={filters.container}
              />
            ) : null}
            <Select
              id="transactions-sync-status"
              label="Sync status"
              onChange={(syncStatus) =>
                updateFilters({ syncStatus: syncStatus as TransactionFilters['syncStatus'] })
              }
              options={[
                { label: 'All statuses', value: 'all' },
                { label: 'Pending', value: 'pending' },
                { label: 'Syncing', value: 'syncing' },
                { label: 'Synced', value: 'synced' },
                { label: 'Failed', value: 'failed' },
                { label: 'Local', value: 'local' },
              ]}
              value={filters.syncStatus}
            />
            <label className="flex items-end gap-2 pb-2 text-sm font-medium text-text-muted">
              <input
                checked={filters.showDeleted}
                className="mb-1 h-4 w-4 accent-brand"
                onChange={(event) => updateFilters({ showDeleted: event.target.checked })}
                type="checkbox"
              />
              Show deleted
            </label>
          </div>
        ) : null}
      </div>

      {/* List */}
      {isInitialLoading ? (
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
        <div className="divide-y divide-border">
          {filteredTransactions.map((transaction) => {
            const isDeleted = Boolean(transaction.deletedAt);
            const isIncome = transaction.kind === 'income';

            const metaParts = [
              transaction.date,
              transaction.paymentMethod,
              transaction.comment,
              containersEnabled ? transaction.containerName : undefined,
            ]
              .filter(Boolean)
              .join(' · ');

            return (
              <div
                className={cn(
                  'flex items-center gap-3 px-4 py-3 md:gap-4 md:px-5 md:py-4',
                  isDeleted ? 'bg-surface-muted' : 'transition-colors hover:bg-surface-hover',
                )}
                key={transaction.id}
              >
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold uppercase',
                    isDeleted
                      ? 'bg-border text-text-soft'
                      : isIncome
                        ? 'bg-success-soft text-success'
                        : 'bg-danger-soft text-danger',
                  )}
                >
                  {transaction.categoryName.charAt(0)}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'truncate text-sm font-semibold',
                      isDeleted ? 'text-text-muted line-through' : 'text-text',
                    )}
                  >
                    {transaction.categoryName}
                  </p>
                  {metaParts ? (
                    <p className="mt-0.5 truncate text-xs text-text-soft">{metaParts}</p>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={cn(
                      'text-sm font-semibold tabular-nums',
                      isDeleted ? 'text-text-soft' : isIncome ? 'text-success' : 'text-danger',
                    )}
                  >
                    {formatMoney(transaction.signedAmount, transaction.currency)}
                  </span>
                  <div className="flex flex-wrap justify-end gap-1">
                    {isDeleted ? <Badge variant="neutral">Deleted</Badge> : null}
                    <Badge variant={syncStatusVariants[transaction.syncStatus]}>
                      {formatSyncStatus(transaction.syncStatus)}
                    </Badge>
                  </div>
                </div>

                <RowActions
                  onDelete={() => onDeleteTransaction(transaction.id)}
                  onEdit={() => onEditTransaction(transaction)}
                />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
