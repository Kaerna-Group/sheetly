import type { Category } from '@entities/category';
import type { Transaction } from '@entities/transaction';

export type FinanceDataSource = {
  createTransaction: (transaction: Transaction) => Promise<void>;
  getCategories: () => Promise<Category[]>;
  getTransactions: () => Promise<Transaction[]>;
};
