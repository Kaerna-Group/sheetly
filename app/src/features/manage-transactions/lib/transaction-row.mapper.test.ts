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

  it('reads older Ledger rows without source or sync status', () => {
    expect(
      mapRowToTransaction([
        'tx-legacy',
        '2026-05-20',
        'expense',
        'Ice cream',
        '105,50',
        '',
        'UAH',
        'Cash',
        '',
        '2026-05-20T10:00:00.000Z',
      ]),
    ).toMatchObject({
      amount: 105.5,
      id: 'tx-legacy',
      signedAmount: -105.5,
      source: 'google-sheets',
      syncStatus: 'synced',
    });
  });

  it('reads formatted Google Sheets numbers', () => {
    expect(
      mapRowToTransaction([
        'tx-income',
        '2026-05-19',
        'income',
        'Salary',
        '3,000.00',
        '3,000.00',
        'UAH',
        '',
        '',
        '2026-05-19T09:32:32.628Z',
        'google-sheets',
        'synced',
      ]),
    ).toMatchObject({
      amount: 3000,
      signedAmount: 3000,
    });
    expect(
      mapRowToTransaction([
        'tx-expense',
        '2026-05-19',
        'expense',
        'Entertainment',
        '3,000.00',
        '-3,000.00',
        'UAH',
        '',
        'Bundle',
        '2026-05-19T09:34:59.931Z',
        'google-sheets',
        'synced',
      ]),
    ).toMatchObject({
      amount: 3000,
      signedAmount: -3000,
    });
    expect(
      mapRowToTransaction([
        'tx-space',
        '2026-05-20',
        'expense',
        'Food',
        '3 000,00',
        '-3 000,00',
        'UAH',
        '',
        '',
        '2026-05-20T09:34:59.931Z',
        'google-sheets',
        'synced',
      ]),
    ).toMatchObject({
      amount: 3000,
      signedAmount: -3000,
    });
  });

  it('reads all current Ledger sample rows', () => {
    const rows = [
      [
        'ac8c1c8e-aec7-4a0f-adc2-b4040f4b0d45',
        '2026-05-19',
        'income',
        'Salary',
        '3,000.00',
        '3,000.00',
        'UAH',
        '',
        '',
        '2026-05-19T09:32:32.628Z',
        'google-sheets',
        'synced',
      ],
      [
        '2bc73d1e-f71c-4c3e-8cd2-bf29ae1c9447',
        '2026-05-19',
        'expense',
        'Entertainment',
        '3,000.00',
        '-3,000.00',
        'UAH',
        '',
        'Bundle',
        '2026-05-19T09:34:59.931Z',
        'google-sheets',
        'synced',
      ],
      [
        '2d559aea-f010-46d0-a88c-f3c610519d03',
        '2026-05-08',
        'expense',
        'Food',
        '100.54',
        '-100.54',
        'UAH',
        'Cash',
        'Ice cream',
        '2026-05-19T09:47:10.858Z',
        'google-sheets',
        'synced',
        '2026-05-20T14:49:56.144Z',
      ],
      [
        'f4fc0c67-5cc2-430b-b258-cce37202fe8e',
        '2026-05-20',
        'income',
        'Salary',
        '3,000.00',
        '3,000.00',
        'UAH',
        '',
        'Ice cream sold',
        '2026-05-20T14:02:08.391Z',
        'google-sheets',
        'synced',
        '',
        '',
        '1-uah',
        '#1',
      ],
    ];

    expect(rows.map(mapRowToTransaction).filter(Boolean)).toHaveLength(4);
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
