import type { TransactionKind } from '../types/transaction-kind.type';

export function calculateSignedAmount(kind: TransactionKind, amount: number) {
  return kind === 'expense' ? -Math.abs(amount) : Math.abs(amount);
}
