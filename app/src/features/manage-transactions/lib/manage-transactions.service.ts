import type { Transaction } from '@entities/transaction';
import {
  createGoogleSheetsClient,
  GoogleSheetsApiError,
  type GoogleSheetsClient,
} from '@shared/api/google-sheets';
import { sheetNames, sheetRanges } from '@shared/config/constants/sheet.constants';

import { mapRowToTransaction, mapTransactionToRow } from './transaction-row.mapper';

export type ManageTransactionsContext = {
  accessToken: string | null;
  googleSheetsClient?: Pick<
    GoogleSheetsClient,
    'appendValues' | 'getSpreadsheetMetadata' | 'readRange' | 'updateValues'
  >;
  spreadsheetId: string | null;
};

export type CreateTransactionParams = ManageTransactionsContext & {
  transaction: Transaction;
};

type ReadyTransactionsContext = {
  accessToken: string;
  googleSheetsClient: Pick<
    GoogleSheetsClient,
    'appendValues' | 'getSpreadsheetMetadata' | 'readRange' | 'updateValues'
  >;
  spreadsheetId: string;
};

const noGoogleContextMessage = 'Connect Google and spreadsheet before working with transactions.';
const templateNotReadyMessage =
  'Spreadsheet template is not ready. Open Settings and run setup before working with transactions.';

function hasLedgerSheet(
  metadata: Awaited<ReturnType<GoogleSheetsClient['getSpreadsheetMetadata']>>,
) {
  return Boolean(metadata.sheets?.some((sheet) => sheet.properties?.title === sheetNames.ledger));
}

async function ensureLedgerReady({
  accessToken,
  googleSheetsClient,
  spreadsheetId,
}: ReadyTransactionsContext) {
  const metadata = await googleSheetsClient.getSpreadsheetMetadata({
    accessToken,
    spreadsheetId,
  });

  if (!hasLedgerSheet(metadata)) {
    throw new Error(templateNotReadyMessage);
  }
}

function mapTransactionError(error: unknown) {
  if (error instanceof GoogleSheetsApiError) {
    if (error.code === 'unauthorized') {
      return new Error('Google authorization expired. Connect Google again.', { cause: error });
    }

    if (['forbidden', 'not-found'].includes(error.code)) {
      return new Error('You do not have access to this spreadsheet.', { cause: error });
    }

    if (['template-not-ready', 'unknown'].includes(error.code)) {
      return new Error(templateNotReadyMessage, { cause: error });
    }
  }

  return error;
}

export async function readTransactions({
  accessToken,
  googleSheetsClient = createGoogleSheetsClient(),
  spreadsheetId,
}: ManageTransactionsContext): Promise<Transaction[]> {
  if (!accessToken || !spreadsheetId) {
    throw new Error(noGoogleContextMessage);
  }

  const googleContext = {
    accessToken,
    googleSheetsClient,
    spreadsheetId,
  };

  try {
    await ensureLedgerReady(googleContext);

    const valueRange = await googleSheetsClient.readRange({
      accessToken,
      range: sheetRanges.ledgerData,
      spreadsheetId,
    });

    return valueRange.values
      .map(mapRowToTransaction)
      .filter((transaction) => transaction !== null)
      .filter((transaction) => !transaction.deletedAt)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  } catch (error) {
    throw mapTransactionError(error);
  }
}

export async function createTransaction({
  accessToken,
  googleSheetsClient = createGoogleSheetsClient(),
  spreadsheetId,
  transaction,
}: CreateTransactionParams): Promise<Transaction> {
  if (!accessToken || !spreadsheetId) {
    throw new Error(noGoogleContextMessage);
  }

  const googleContext = {
    accessToken,
    googleSheetsClient,
    spreadsheetId,
  };

  try {
    await ensureLedgerReady(googleContext);
    const syncedTransaction: Transaction = {
      ...transaction,
      source: 'google-sheets',
      syncStatus: 'synced',
      syncedAt: new Date().toISOString(),
    };

    await googleSheetsClient.appendValues({
      accessToken,
      range: sheetRanges.ledger,
      spreadsheetId,
      values: [mapTransactionToRow(syncedTransaction)],
    });

    return syncedTransaction;
  } catch (error) {
    throw mapTransactionError(error);
  }
}

async function findTransactionRowIndex({
  accessToken,
  googleSheetsClient,
  spreadsheetId,
  transactionId,
}: ReadyTransactionsContext & { transactionId: string }) {
  const valueRange = await googleSheetsClient.readRange({
    accessToken,
    range: sheetRanges.ledgerData,
    spreadsheetId,
  });
  const rowIndex = valueRange.values.findIndex((row) => row[0] === transactionId);

  return rowIndex === -1 ? null : rowIndex + 2;
}

export async function updateTransaction({
  accessToken,
  googleSheetsClient = createGoogleSheetsClient(),
  spreadsheetId,
  transaction,
}: CreateTransactionParams): Promise<Transaction> {
  if (!accessToken || !spreadsheetId) {
    throw new Error(noGoogleContextMessage);
  }

  const googleContext = {
    accessToken,
    googleSheetsClient,
    spreadsheetId,
  };

  try {
    await ensureLedgerReady(googleContext);
    const rowIndex = await findTransactionRowIndex({
      ...googleContext,
      transactionId: transaction.id,
    });

    if (!rowIndex) {
      throw new Error('Transaction was not found in Ledger.');
    }

    const nextTransaction: Transaction = {
      ...transaction,
      source: 'google-sheets',
      syncStatus: 'synced',
      syncedAt: new Date().toISOString(),
      updatedAt: transaction.updatedAt ?? new Date().toISOString(),
    };

    await googleSheetsClient.updateValues({
      accessToken,
      range: `${sheetNames.ledger}!A${rowIndex}:P${rowIndex}`,
      spreadsheetId,
      values: [mapTransactionToRow(nextTransaction)],
    });

    return nextTransaction;
  } catch (error) {
    throw mapTransactionError(error);
  }
}

export async function softDeleteTransaction({
  accessToken,
  googleSheetsClient = createGoogleSheetsClient(),
  spreadsheetId,
  transactionId,
}: ManageTransactionsContext & { transactionId: string }): Promise<void> {
  if (!accessToken || !spreadsheetId) {
    throw new Error(noGoogleContextMessage);
  }

  const googleContext = {
    accessToken,
    googleSheetsClient,
    spreadsheetId,
  };

  try {
    await ensureLedgerReady(googleContext);
    const valueRange = await googleSheetsClient.readRange({
      accessToken,
      range: sheetRanges.ledgerData,
      spreadsheetId,
    });
    const rowIndex = valueRange.values.findIndex((row) => row[0] === transactionId);

    if (rowIndex === -1) {
      throw new Error('Transaction was not found in Ledger.');
    }

    const transaction = mapRowToTransaction(valueRange.values[rowIndex]);

    if (!transaction) {
      throw new Error('Transaction row is invalid.');
    }

    await googleSheetsClient.updateValues({
      accessToken,
      range: `${sheetNames.ledger}!A${rowIndex + 2}:P${rowIndex + 2}`,
      spreadsheetId,
      values: [
        mapTransactionToRow({
          ...transaction,
          deletedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      ],
    });
  } catch (error) {
    throw mapTransactionError(error);
  }
}
