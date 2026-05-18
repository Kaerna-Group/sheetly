import { calculateSignedAmount, type Transaction } from '@entities/transaction';

import { generateTransactionId } from './generate-transaction-id';
import type { TransactionFormValues } from '../types/transaction-form-values.type';

export function mapFormToTransaction(values: TransactionFormValues): Transaction {
  const amount = Number(values.amount);
  const createdAt = new Date().toISOString();

  return {
    id: generateTransactionId(),
    amount,
    categoryId: values.categoryName.toLowerCase().replaceAll(' ', '-'),
    categoryName: values.categoryName,
    comment: values.comment,
    createdAt,
    currency: values.currency,
    date: values.date,
    kind: values.kind,
    paymentMethod: values.paymentMethod,
    signedAmount: calculateSignedAmount(values.kind, amount),
    source: 'local-demo',
    syncStatus: 'local',
  };
}
