import { describe, expect, it } from 'vitest';

import { createTransactionFormSchema } from './transaction-form.schema';

const values = {
  amount: '250',
  categoryId: 'food',
  categoryName: 'Food',
  currency: 'UAH',
  date: '2026-05-19',
  kind: 'expense' as const,
};

describe('createTransactionFormSchema', () => {
  it('allows missing container when containers are disabled', () => {
    expect(createTransactionFormSchema(false).safeParse(values).success).toBe(true);
  });

  it('requires container when containers are enabled', () => {
    expect(createTransactionFormSchema(true).safeParse(values).success).toBe(false);
    expect(
      createTransactionFormSchema(true).safeParse({
        ...values,
        containerId: 'cash-uah',
        containerName: 'Cash',
      }).success,
    ).toBe(true);
  });
});
