import type { TransactionKind } from '@entities/transaction';

export type TransactionFormValues = {
  amount: string;
  categoryId: string;
  categoryName: string;
  comment?: string;
  currency: string;
  date: string;
  kind: TransactionKind;
  paymentMethod?: string;
};
