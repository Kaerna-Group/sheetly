import { describe, expect, it } from 'vitest';

import type { Transaction } from '@entities/transaction';

import { mapRowToTransaction, mapTransactionToRow } from './transaction-row.mapper';

const transaction: Transaction = {
  id: 'tx-1',
  amount: 250,
  categoryId: 'food',
  categoryName: 'Food',
  comment: 'Lunch',
  createdAt: '2026-05-19T10:00:00.000Z',
  currency: 'UAH',
  date: '2026-05-19',
  kind: 'expense',
  paymentMethod: 'Card',
  signedAmount: -250,
  source: 'google-sheets',
  syncStatus: 'synced',
};

describe('transaction row mapper', () => {
  it('maps transaction to Ledger row', () => {
    expect(mapTransactionToRow(transaction)).toEqual([
      'tx-1',
      '2026-05-19',
      'expense',
      'Food',
      '250',
      '-250',
      'UAH',
      'Card',
      'Lunch',
      '2026-05-19T10:00:00.000Z',
      'google-sheets',
      'synced',
      '',
      '',
      '',
      '',
    ]);
  });

  it('maps Ledger row to transaction', () => {
    expect(
      mapRowToTransaction([
        'tx-1',
        '2026-05-19',
        'expense',
        'Food',
        '250',
        '-250',
        'UAH',
        'Card',
        'Lunch',
        '2026-05-19T10:00:00.000Z',
        'google-sheets',
        'synced',
        '',
        '',
      ]),
    ).toEqual(transaction);
  });

  it('maps optional updated and deleted timestamps', () => {
    expect(
      mapRowToTransaction([
        'tx-1',
        '2026-05-19',
        'expense',
        'Food',
        '250',
        '-250',
        'UAH',
        'Card',
        'Lunch',
        '2026-05-19T10:00:00.000Z',
        'google-sheets',
        'synced',
        '2026-05-20T10:00:00.000Z',
        '2026-05-21T10:00:00.000Z',
      ]),
    ).toMatchObject({
      deletedAt: '2026-05-21T10:00:00.000Z',
      updatedAt: '2026-05-20T10:00:00.000Z',
    });
  });

  it('skips invalid rows', () => {
    expect(mapRowToTransaction(['', '2026-05-19'])).toBeNull();
    expect(
      mapRowToTransaction([
        'tx-1',
        '2026-05-19',
        'expense',
        'Food',
        'not-a-number',
        '-250',
        'UAH',
        '',
        '',
        '2026-05-19T10:00:00.000Z',
        'google-sheets',
        'synced',
      ]),
    ).toBeNull();
  });
});
