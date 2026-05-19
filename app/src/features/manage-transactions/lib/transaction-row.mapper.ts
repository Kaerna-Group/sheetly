import type { Transaction } from '@entities/transaction';

function normalizeCategoryId(categoryName: string) {
  return categoryName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '');
}

function readNumber(value: string | undefined) {
  const number = Number(value);

  return Number.isFinite(number) ? number : null;
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
  ] = row;
  const amount = readNumber(amountValue);
  const signedAmount = readNumber(signedAmountValue);

  if (
    !id ||
    !date ||
    (kind !== 'income' && kind !== 'expense') ||
    !categoryName ||
    amount === null ||
    signedAmount === null ||
    !currency ||
    !createdAt ||
    source !== 'google-sheets' ||
    syncStatus !== 'synced'
  ) {
    return null;
  }

  return {
    id,
    amount,
    categoryId: normalizeCategoryId(categoryName),
    categoryName,
    comment: comment || undefined,
    createdAt,
    currency,
    date,
    kind,
    paymentMethod: paymentMethod || undefined,
    signedAmount,
    source,
    syncStatus,
  };
}
