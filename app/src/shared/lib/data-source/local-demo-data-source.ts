import { getDefaultCategories } from '@entities/category';

import type { FinanceDataSource } from './data-source.type';

export function createLocalDemoDataSource(): FinanceDataSource {
  return {
    async createTransaction() {
      return Promise.resolve();
    },
    async getCategories() {
      return getDefaultCategories();
    },
    async getTransactions() {
      return [];
    },
  };
}
