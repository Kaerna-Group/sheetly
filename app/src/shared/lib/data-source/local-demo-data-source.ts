import { getDefaultCategories } from '@entities/category';

import type { FinanceDataSource } from './data-source.type';

export function createLocalDemoDataSource(): FinanceDataSource {
  return {
    async createTransaction() {
      throw new Error('Local demo data source cannot create transactions.');
    },
    async getCategories() {
      return getDefaultCategories();
    },
    async getTransactions() {
      return [];
    },
    async softDeleteTransaction() {
      throw new Error('Local demo data source cannot delete transactions.');
    },
    async syncPending() {
      return {
        failed: 0,
        synced: 0,
        total: 0,
      };
    },
    async updateTransaction() {
      throw new Error('Local demo data source cannot update transactions.');
    },
  };
}
