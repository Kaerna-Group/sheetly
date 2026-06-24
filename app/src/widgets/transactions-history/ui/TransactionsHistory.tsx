import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

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

type TransactionsHistoryProps = {
  containersEnabled?: boolean;
  error: string | null;
  isLoading: boolean;
  onCreateTransaction: () => void;
  onDeleteTransaction: (transactionId: string) => void | Promise<void>;
  onEditTransaction: (transaction: Transaction) => void;
  onRefresh: () => void | Promise<void>;
  onRetrySync: () => void | Promise<void>;
  isSyncing?: boolean;
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

function formatKind(kind: Transaction['kind']) {
  return kind === 'income' ? 'Income' : 'Expense';
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
    if (!isOpen) {
      return;
    }

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
      <div className="hidden grid-cols-[120px_96px_1fr_140px_160px_1fr] gap-3 border-b border-border px-5 py-3 md:grid">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton className="h-3" key={index} />
        ))}
      </div>
      <div className="divide-y divide-border">
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

type RowActionsProps = {
  onDelete: () => void | Promise<void>;
  onEdit: () => void;
};

function RowActions({ onDelete, onEdit }: RowActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useOutsideClose(isOpen, () => setIsOpen(false));

  return (
    <div className="relative flex justify-start md:justify-end" ref={wrapperRef}>
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

function CommentCell({ value }: { value?: string }) {
  if (!value) {
    return <div className="text-text-muted">-</div>;
  }

  return (
    <div className="max-w-56 truncate text-text-muted" title={value}>
      {value}
    </div>
  );
}

function TransactionField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="flex items-start justify-between gap-3 md:block">
      <span className="shrink-0 text-xs font-semibold uppercase text-text-soft md:hidden">
        {label}
      </span>
      <div className="min-w-0 text-right md:text-left">{children}</div>
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
  const hasPendingSync = transactions.some((transaction) =>
    ['failed', 'pending', 'syncing'].includes(transaction.syncStatus),
  );

  function updateFilters(nextFilters: Partial<TransactionFilters>) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      ...nextFilters,
    }));
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
        onAction={onCreateTransaction}
        onSecondAction={() => void onRefresh()}
        secondActionLabel="Refresh"
        title="No transactions yet"
      />
    );
  }

  return (
    <Card className="mb-16 p-0">
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
                  ...containerOptions.map((container) => ({ label: container, value: container })),
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
        <div>
          <div className="hidden grid-cols-[110px_78px_1fr_110px_120px_1fr_110px_86px_104px] gap-3 border-b border-border px-5 py-3 text-xs font-semibold uppercase text-text-soft md:grid">
            <span>Date</span>
            <span>Type</span>
            <span>Category</span>
            <span className="text-right">Amount</span>
            <span>Payment method</span>
            <span>Comment</span>
            <span>Container</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="divide-y divide-border">
            {filteredTransactions.map((transaction) => (
              <div
                className={
                  transaction.deletedAt
                    ? 'grid gap-3 bg-surface-muted px-4 py-4 text-sm opacity-70 md:grid-cols-[110px_78px_1fr_110px_120px_1fr_110px_86px_104px] md:items-center md:gap-3 md:px-5'
                    : 'grid gap-3 px-4 py-4 text-sm md:grid-cols-[110px_78px_1fr_110px_120px_1fr_110px_86px_104px] md:items-center md:gap-3 md:px-5'
                }
                key={transaction.id}
              >
                <TransactionField label="Date">
                  <div className="text-text-soft">{transaction.date}</div>
                </TransactionField>
                <TransactionField label="Type">
                  <div className="font-medium text-text-muted">{formatKind(transaction.kind)}</div>
                </TransactionField>
                <TransactionField label="Category">
                  <div className="font-medium text-text">{transaction.categoryName}</div>
                </TransactionField>
                <TransactionField label="Amount">
                  <div
                    className={
                      transaction.kind === 'income'
                        ? 'font-semibold text-emerald-600 md:text-right'
                        : 'font-semibold text-danger md:text-right'
                    }
                  >
                    {formatMoney(transaction.signedAmount, transaction.currency)}
                  </div>
                </TransactionField>
                <TransactionField label="Payment">
                  <div className="text-text-muted">{transaction.paymentMethod || '-'}</div>
                </TransactionField>
                <TransactionField label="Comment">
                  <CommentCell value={transaction.comment} />
                </TransactionField>
                <TransactionField label="Container">
                  <div className="text-text-muted">{transaction.containerName || '-'}</div>
                </TransactionField>
                <TransactionField label="Status">
                  <div className="flex flex-wrap gap-1">
                    {transaction.deletedAt ? <Badge variant="neutral">Deleted</Badge> : null}
                    <Badge variant={syncStatusVariants[transaction.syncStatus]}>
                      {formatSyncStatus(transaction.syncStatus)}
                    </Badge>
                  </div>
                </TransactionField>
                <RowActions
                  onDelete={() => onDeleteTransaction(transaction.id)}
                  onEdit={() => onEditTransaction(transaction)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
