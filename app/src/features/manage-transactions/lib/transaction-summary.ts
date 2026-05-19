import type { Transaction } from '@entities/transaction';

export type TransactionSummary = {
  balance: number;
  expense: number;
  income: number;
};

export function calculateTransactionSummary(transactions: Transaction[]): TransactionSummary {
  return transactions.reduce<TransactionSummary>(
    (summary, transaction) => {
      if (transaction.kind === 'income') {
        summary.income += transaction.amount;
      } else {
        summary.expense += transaction.amount;
      }

      summary.balance += transaction.signedAmount;

      return summary;
    },
    {
      balance: 0,
      expense: 0,
      income: 0,
    },
  );
}
