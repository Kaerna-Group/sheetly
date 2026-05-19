import { calculateSignedAmount, type Transaction } from '@entities/transaction';

import { generateTransactionId } from './generate-transaction-id';
import type { TransactionFormValues } from '../types/transaction-form-values.type';

export function mapFormToTransaction(values: TransactionFormValues): Transaction {
  const amount = Number(values.amount);
  const createdAt = new Date().toISOString();

  return {
    id: generateTransactionId(),
    amount,
    categoryId: values.categoryId,
    categoryName: values.categoryName,
    comment: values.comment,
    containerId: values.containerId,
    containerName: values.containerName,
    createdAt,
    currency: values.currency,
    date: values.date,
    kind: values.kind,
    paymentMethod: values.paymentMethod,
    signedAmount: calculateSignedAmount(values.kind, amount),
    source: 'offline-queue',
    syncStatus: 'pending',
  };
}
