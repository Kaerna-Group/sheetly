import type { Transaction } from '@entities/transaction';

function normalizeCategoryId(categoryName: string) {
  return categoryName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04ff]+/gi, '-')
    .replace(/^-+|-+$/g, '');
}

function readNumber(value: string | undefined) {
  const compactValue = String(value ?? '')
    .trim()
    .replace('\u2212', '-')
    .replace(/\s/g, '');

  if (!compactValue) {
    return null;
  }

  const lastCommaIndex = compactValue.lastIndexOf(',');
  const lastDotIndex = compactValue.lastIndexOf('.');
  let normalizedValue = compactValue;

  if (lastCommaIndex !== -1 && lastDotIndex !== -1) {
    normalizedValue =
      lastCommaIndex > lastDotIndex
        ? compactValue.replace(/\./g, '').replace(',', '.')
        : compactValue.replace(/,/g, '');
  } else if (lastCommaIndex !== -1) {
    normalizedValue = /^-?\d{1,3}(,\d{3})+$/.test(compactValue)
      ? compactValue.replace(/,/g, '')
      : compactValue.replace(',', '.');
  } else if (lastDotIndex !== -1 && /^-?\d{1,3}(\.\d{3})+$/.test(compactValue)) {
    normalizedValue = compactValue.replace(/\./g, '');
  }

  const number = Number(normalizedValue);

  return Number.isFinite(number) ? number : null;
}

function readSource(value: string | undefined): Transaction['source'] {
  return value === 'offline-queue' ? 'offline-queue' : 'google-sheets';
}

function readSyncStatus(value: string | undefined): Transaction['syncStatus'] {
  if (['failed', 'local', 'pending', 'syncing', 'synced'].includes(value ?? '')) {
    return value as Transaction['syncStatus'];
  }

  return 'synced';
}

export function mapTransactionToRow(transaction: Transaction): string[] {
  return [
    transaction.id,
    transaction.date,
    transaction.kind,
    transaction.categoryName,
    String(transaction.amount),
    String(transaction.signedAmount),
    transaction.currency,
    transaction.paymentMethod ?? '',
    transaction.comment ?? '',
    transaction.createdAt,
    transaction.source,
    transaction.syncStatus,
    transaction.updatedAt ?? '',
    transaction.deletedAt ?? '',
    transaction.containerId ?? '',
    transaction.containerName ?? '',
  ];
}

export function mapRowToTransaction(row: string[]): Transaction | null {
  const [
    id,
    date,
    kind,
    categoryName,
    amountValue,
    signedAmountValue,
    currency,
    paymentMethod,
    comment,
    createdAt,
    source,
    syncStatus,
    updatedAt,
    deletedAt,
    containerId,
    containerName,
  ] = row;
  const amount = readNumber(amountValue);
  const signedAmount =
    readNumber(signedAmountValue) ??
    (amount === null ? null : kind === 'expense' ? -Math.abs(amount) : Math.abs(amount));
  const normalizedSource = readSource(source);
  const normalizedSyncStatus = readSyncStatus(syncStatus);

  if (
    !id ||
    !date ||
    (kind !== 'income' && kind !== 'expense') ||
    !categoryName ||
    amount === null ||
    signedAmount === null ||
    !currency ||
    !createdAt
  ) {
    return null;
  }

  return {
    id,
    amount,
    categoryId: normalizeCategoryId(categoryName),
    categoryName,
    comment: comment || undefined,
    containerId: containerId || undefined,
    containerName: containerName || undefined,
    createdAt,
    currency,
    date,
    kind,
    paymentMethod: paymentMethod || undefined,
    signedAmount,
    source: normalizedSource,
    syncStatus: normalizedSyncStatus,
    updatedAt: updatedAt || undefined,
    deletedAt: deletedAt || undefined,
  };
}
