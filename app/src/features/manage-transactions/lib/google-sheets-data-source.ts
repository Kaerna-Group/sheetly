import type { Category } from '@entities/category';
import type { Transaction } from '@entities/transaction';
import { readCategories } from '@features/manage-categories';
import type { FinanceDataSource, SyncResult } from '@shared/lib/data-source';

import {
  createTransaction,
  readTransactions,
  softDeleteTransaction,
  updateTransaction,
  type ManageTransactionsContext,
} from './manage-transactions.service';

export function createGoogleSheetsDataSource(
  context: ManageTransactionsContext,
): FinanceDataSource {
  return {
    createTransaction(transaction: Transaction) {
      return createTransaction({
        ...context,
        transaction,
      });
    },
    async getCategories(): Promise<Category[]> {
      const result = await readCategories(context);

      return result.categories;
    },
    getTransactions() {
      return readTransactions(context);
    },
    softDeleteTransaction(transactionId: string) {
      return softDeleteTransaction({
        ...context,
        transactionId,
      });
    },
    syncPending(): Promise<SyncResult> {
      return Promise.resolve({
        failed: 0,
        synced: 0,
        total: 0,
      });
    },
    updateTransaction(transaction: Transaction) {
      return updateTransaction({
        ...context,
        transaction,
      });
    },
  };
}
