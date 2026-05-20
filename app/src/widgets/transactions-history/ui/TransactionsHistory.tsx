import { useEffect, useMemo, useRef, useState } from 'react';

import type { Transaction } from '@entities/transaction';
import {
  createDefaultTransactionFilters,
  filterTransactions,
  getTransactionContainerOptions,
  getTransactionCategoryOptions,
  type TransactionFilters,
} from '@features/filter-transactions';
import { Badge, type BadgeVariant } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';
import { EmptyState } from '@shared/ui/empty-state';
import { Input } from '@shared/ui/input';
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

function formatDateLabel(value: string) {
  if (!value) {
    return 'dd.mm.yyyy';
  }

  const [year, month, day] = value.split('-');

  return `${day}.${month}.${year}`;
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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

type FilterOption = {
  label: string;
  value: string;
};

type FilterSelectProps = {
  id: string;
  label: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  value: string;
};

function FilterSelect({ id, label, onChange, options, value }: FilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];
  const wrapperRef = useOutsideClose(isOpen, () => setIsOpen(false));

  return (
    <div className="relative grid gap-2 text-sm font-medium text-zinc-700" ref={wrapperRef}>
      <span id={`${id}-label`}>{label}</span>
      <button
        aria-expanded={isOpen}
        aria-labelledby={`${id}-label`}
        className="flex h-10 items-center justify-between gap-3 rounded-md border border-zinc-200 bg-white px-3 text-left text-sm text-zinc-900 shadow-sm outline-none transition hover:border-zinc-300 focus:border-brand focus:ring-2 focus:ring-indigo-100"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="truncate">{selectedOption.label}</span>
        <span className="text-xs text-zinc-400">⌄</span>
      </button>
      {isOpen ? (
        <div className="absolute top-full z-20 mt-2 max-h-64 w-full min-w-44 overflow-auto rounded-md border border-zinc-200 bg-white p-1 shadow-lg">
          {options.map((option) => (
            <button
              className={
                option.value === value
                  ? 'flex w-full rounded px-3 py-2 text-left text-sm font-medium text-brand'
                  : 'flex w-full rounded px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50'
              }
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type DateFilterFieldProps = {
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
};

function DateFilterField({ id, label, onChange, value }: DateFilterFieldProps) {
  const selectedDate = value ? new Date(`${value}T00:00:00`) : new Date();
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );
  const wrapperRef = useOutsideClose(isOpen, () => setIsOpen(false));
  const monthLabel = visibleMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const firstWeekday = (visibleMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0,
  ).getDate();
  const calendarDays = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, index) => new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index + 1),
    ),
  ];

  function moveMonth(direction: -1 | 1) {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + direction, 1),
    );
  }

  return (
    <div className="relative grid gap-2 text-sm font-medium text-zinc-700" ref={wrapperRef}>
      <span id={`${id}-label`}>{label}</span>
      <button
        aria-expanded={isOpen}
        aria-labelledby={`${id}-label`}
        className="flex h-10 items-center justify-between gap-3 rounded-md border border-zinc-200 bg-white px-3 text-left text-sm text-zinc-900 shadow-sm outline-none transition hover:border-zinc-300 focus:border-brand focus:ring-2 focus:ring-indigo-100"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className={value ? 'text-zinc-900' : 'text-zinc-400'}>{formatDateLabel(value)}</span>
        <span className="text-zinc-400">▦</span>
      </button>
      {isOpen ? (
        <div className="absolute top-full z-30 mt-2 w-72 rounded-lg border border-zinc-200 bg-white p-3 shadow-xl">
          <div className="flex items-center justify-between">
            <button
              className="rounded-md px-2 py-1 text-zinc-500 hover:bg-zinc-100"
              onClick={() => moveMonth(-1)}
              type="button"
            >
              ←
            </button>
            <p className="text-sm font-semibold text-zinc-950">{monthLabel}</p>
            <button
              className="rounded-md px-2 py-1 text-zinc-500 hover:bg-zinc-100"
              onClick={() => moveMonth(1)}
              type="button"
            >
              →
            </button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-zinc-400">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) =>
              date ? (
                <button
                  className={
                    toDateValue(date) === value
                      ? 'h-8 rounded-md bg-brand text-sm font-semibold text-white'
                      : 'h-8 rounded-md text-sm text-zinc-700 hover:bg-indigo-50 hover:text-brand'
                  }
                  key={toDateValue(date)}
                  onClick={() => {
                    onChange(toDateValue(date));
                    setIsOpen(false);
                  }}
                  type="button"
                >
                  {date.getDate()}
                </button>
              ) : (
                <span key={`empty-${index}`} />
              ),
            )}
          </div>
          <div className="mt-3 flex justify-between border-t border-zinc-100 pt-3">
            <button
              className="text-sm font-medium text-zinc-500 hover:text-danger"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              type="button"
            >
              Clear
            </button>
            <button
              className="text-sm font-medium text-brand"
              onClick={() => {
                const today = new Date();

                setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                onChange(toDateValue(today));
                setIsOpen(false);
              }}
              type="button"
            >
              Today
            </button>
          </div>
        </div>
      ) : null}
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
        className="grid size-8 place-items-center rounded-md border border-zinc-200 text-lg leading-none text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        ...
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-full z-20 mt-2 w-32 rounded-md border border-zinc-200 bg-white p-1 shadow-lg">
          <button
            className="w-full rounded px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
            onClick={() => {
              onEdit();
              setIsOpen(false);
            }}
            type="button"
          >
            Edit
          </button>
          <button
            className="w-full rounded px-3 py-2 text-left text-sm text-danger hover:bg-red-50"
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
    return <div className="text-zinc-600">-</div>;
  }

  return (
    <div className="max-w-56 truncate text-zinc-600" title={value}>
      {value}
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

  if (!isInitialLoading && !transactions.length) {
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
    <Card className="mb-16 p-0">
      <div className="flex flex-col gap-4 border-b border-zinc-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">Transactions history</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {`${filteredTransactions.length} of ${transactions.length} transactions`}
            {isLoading ? <span className="ml-2 text-brand">Refreshing...</span> : null}
          </p>
          {error ? <p className="mt-1 text-sm text-danger">{error}</p> : null}
          {syncWarning ? <p className="mt-1 text-sm text-amber-700">{syncWarning}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {hasPendingSync ? (
            <Button
              disabled={isSyncing}
              isLoading={isSyncing}
              onClick={() => void onRetrySync()}
              variant="primary"
            >
              Retry sync
            </Button>
          ) : null}
          <Button disabled={isLoading} onClick={() => void onRefresh()} variant="secondary">
            Refresh
          </Button>
        </div>
      </div>
      <div className="border-b border-zinc-200 bg-zinc-50/60 px-5 py-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.5fr)_minmax(120px,0.8fr)_minmax(160px,1fr)_auto_auto] lg:items-end">
          <Input
            className="truncate"
            id="transactions-search"
            label="Search"
            onChange={(event) => updateFilters({ query: event.target.value })}
            placeholder="Comment, method, category"
            value={filters.query}
          />
          <FilterSelect
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
          <FilterSelect
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
            onClick={() => setIsAdvancedFiltersOpen((current) => !current)}
            type="button"
            variant="secondary"
          >
            {isAdvancedFiltersOpen ? 'Hide filters' : 'More filters'}
          </Button>
          <Button disabled={!isFiltered} onClick={clearFilters} type="button" variant="ghost">
            Clear
          </Button>
        </div>
        {isAdvancedFiltersOpen ? (
          <div className="mt-4 grid gap-4 rounded-md border border-zinc-200 bg-white p-4 lg:grid-cols-[repeat(4,minmax(130px,1fr))]">
            <DateFilterField
              id="transactions-date-from"
              label="Date from"
              onChange={(dateFrom) => updateFilters({ dateFrom })}
              value={filters.dateFrom}
            />
            <DateFilterField
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
            {containersEnabled ? (
              <FilterSelect
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
            <FilterSelect
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
            <label className="flex items-end gap-2 pb-2 text-sm font-medium text-zinc-700">
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
          <div className="hidden grid-cols-[110px_78px_1fr_110px_120px_1fr_110px_86px_104px] gap-3 border-b border-zinc-200 px-5 py-3 text-xs font-semibold uppercase text-zinc-500 md:grid">
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
          <div className="divide-y divide-zinc-100">
            {filteredTransactions.map((transaction) => (
              <div
                className={
                  transaction.deletedAt
                    ? 'grid gap-2 bg-zinc-50 px-5 py-4 text-sm opacity-70 md:grid-cols-[110px_78px_1fr_110px_120px_1fr_110px_86px_104px] md:items-center md:gap-3'
                    : 'grid gap-2 px-5 py-4 text-sm md:grid-cols-[110px_78px_1fr_110px_120px_1fr_110px_86px_104px] md:items-center md:gap-3'
                }
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
                <CommentCell value={transaction.comment} />
                <div className="text-zinc-600">{transaction.containerName || '-'}</div>
                <div>
                  <div className="flex flex-wrap gap-1">
                    {transaction.deletedAt ? <Badge variant="neutral">Deleted</Badge> : null}
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
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
