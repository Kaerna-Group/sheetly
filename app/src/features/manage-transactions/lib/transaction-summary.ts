import type { Transaction } from '@entities/transaction';

export type CurrencySummary = {
  balance: number;
  currency: string;
  expense: number;
  income: number;
};

export function calculateTransactionSummary(transactions: Transaction[]): CurrencySummary[] {
  const byCurrency = new Map<string, CurrencySummary>();

  for (const transaction of transactions) {
    const { currency } = transaction;
    const entry = byCurrency.get(currency) ?? { balance: 0, currency, expense: 0, income: 0 };

    if (transaction.kind === 'income') {
      entry.income += transaction.amount;
    } else {
      entry.expense += transaction.amount;
    }

    entry.balance += transaction.signedAmount;
    byCurrency.set(currency, entry);
  }

  return [...byCurrency.values()];
}
