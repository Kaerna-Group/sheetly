import { getDefaultCurrencies, type Currency } from '@entities/currency';
import {
  createGoogleSheetsClient,
  GoogleSheetsApiError,
  type GoogleSheetsClient,
} from '@shared/api/google-sheets';
import { sheetNames, sheetRanges } from '@shared/config/constants/sheet.constants';

import { mapRowToCurrency } from './currency-row.mapper';

export type CurrenciesTemplateStatus = 'ready' | 'needs-setup' | 'unknown';

export type ReadCurrenciesContext = {
  accessToken: string | null;
  googleSheetsClient?: Pick<GoogleSheetsClient, 'getSpreadsheetMetadata' | 'readRange'>;
  spreadsheetId: string | null;
};

export type ReadCurrenciesResult = {
  currencies: Currency[];
  templateStatus: CurrenciesTemplateStatus;
  warning: string | null;
};

const templateNotReadyMessage =
  'Spreadsheet template is not ready. Open Settings and run setup to load currencies.';

function hasCurrenciesSheet(
  metadata: Awaited<ReturnType<GoogleSheetsClient['getSpreadsheetMetadata']>>,
) {
  return Boolean(
    metadata.sheets?.some((sheet) => sheet.properties?.title === sheetNames.currencies),
  );
}

export async function readCurrencies({
  accessToken,
  googleSheetsClient = createGoogleSheetsClient(),
  spreadsheetId,
}: ReadCurrenciesContext): Promise<ReadCurrenciesResult> {
  if (!accessToken || !spreadsheetId) {
    return {
      currencies: getDefaultCurrencies(),
      templateStatus: 'unknown',
      warning: null,
    };
  }

  const metadata = await googleSheetsClient.getSpreadsheetMetadata({
    accessToken,
    spreadsheetId,
  });

  if (!hasCurrenciesSheet(metadata)) {
    return {
      currencies: getDefaultCurrencies(),
      templateStatus: 'needs-setup',
      warning: templateNotReadyMessage,
    };
  }

  try {
    const valueRange = await googleSheetsClient.readRange({
      accessToken,
      range: sheetRanges.currenciesData,
      spreadsheetId,
    });
    const remoteCurrencies = (valueRange.values ?? [])
      .map(mapRowToCurrency)
      .filter((currency): currency is Currency => currency !== null);

    return {
      currencies: remoteCurrencies.length ? remoteCurrencies : getDefaultCurrencies(),
      templateStatus: 'ready',
      warning: null,
    };
  } catch (error) {
    if (
      error instanceof GoogleSheetsApiError &&
      ['template-not-ready', 'unknown'].includes(error.code)
    ) {
      return {
        currencies: getDefaultCurrencies(),
        templateStatus: 'needs-setup',
        warning: templateNotReadyMessage,
      };
    }

    throw error;
  }
}
