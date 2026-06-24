import type { CurrencyCode } from '@entities/app-settings';
import { getDefaultContainers, type Container } from '@entities/container';
import {
  createGoogleSheetsClient,
  GoogleSheetsApiError,
  type GoogleSheetsClient,
} from '@shared/api/google-sheets';
import { sheetNames, sheetRanges } from '@shared/config/constants/sheet.constants';

import { findContainerDuplicate } from './filter-containers';
import { generateContainerId } from './generate-container-id';
import { mapContainerToRow, mapRowToContainer } from './container-row.mapper';

export type ContainersTemplateStatus = 'ready' | 'needs-setup' | 'unknown';

export type ManageContainersContext = {
  accessToken: string | null;
  googleSheetsClient?: Pick<
    GoogleSheetsClient,
    'appendValues' | 'getSpreadsheetMetadata' | 'readRange'
  >;
  spreadsheetId: string | null;
};

export type CreateContainerParams = ManageContainersContext & {
  currency: CurrencyCode;
  existingContainers: Container[];
  name: string;
};

export type ReadContainersResult = {
  containers: Container[];
  templateStatus: ContainersTemplateStatus;
  warning: string | null;
};

const templateNotReadyMessage =
  'Spreadsheet template is not ready. Open Settings and run setup before creating containers.';

function hasContainersSheet(
  metadata: Awaited<ReturnType<GoogleSheetsClient['getSpreadsheetMetadata']>>,
) {
  return Boolean(
    metadata.sheets?.some((sheet) => sheet.properties?.title === sheetNames.containers),
  );
}

export async function readContainers({
  accessToken,
  googleSheetsClient = createGoogleSheetsClient(),
  spreadsheetId,
}: ManageContainersContext): Promise<ReadContainersResult> {
  if (!accessToken || !spreadsheetId) {
    return {
      containers: getDefaultContainers(),
      templateStatus: 'unknown',
      warning: null,
    };
  }

  const metadata = await googleSheetsClient.getSpreadsheetMetadata({
    accessToken,
    spreadsheetId,
  });

  if (!hasContainersSheet(metadata)) {
    return {
      containers: getDefaultContainers(),
      templateStatus: 'needs-setup',
      warning: templateNotReadyMessage,
    };
  }

  try {
    const valueRange = await googleSheetsClient.readRange({
      accessToken,
      range: sheetRanges.containersData,
      spreadsheetId,
    });
    const remoteContainers = (valueRange.values ?? [])
      .map(mapRowToContainer)
      .filter((container) => container !== null);

    return {
      containers: remoteContainers.length ? remoteContainers : getDefaultContainers(),
      templateStatus: 'ready',
      warning: null,
    };
  } catch (error) {
    if (
      error instanceof GoogleSheetsApiError &&
      ['template-not-ready', 'unknown'].includes(error.code)
    ) {
      return {
        containers: getDefaultContainers(),
        templateStatus: 'needs-setup',
        warning: templateNotReadyMessage,
      };
    }

    throw error;
  }
}

export async function createContainer({
  accessToken,
  currency,
  existingContainers,
  googleSheetsClient = createGoogleSheetsClient(),
  name,
  spreadsheetId,
}: CreateContainerParams): Promise<Container> {
  const normalizedName = name.trim();
  const duplicate = findContainerDuplicate(existingContainers, normalizedName, currency);

  if (duplicate) {
    return duplicate;
  }

  if (!accessToken || !spreadsheetId) {
    throw new Error('Connect Google and spreadsheet before creating containers.');
  }

  const metadata = await googleSheetsClient.getSpreadsheetMetadata({
    accessToken,
    spreadsheetId,
  });

  if (!hasContainersSheet(metadata)) {
    throw new Error(templateNotReadyMessage);
  }

  const container: Container = {
    color: '#6366f1',
    createdAt: new Date().toISOString(),
    currency,
    icon: 'wallet',
    id: generateContainerId(normalizedName, currency),
    isDefault: false,
    name: normalizedName,
  };

  try {
    await googleSheetsClient.appendValues({
      accessToken,
      range: sheetRanges.containers,
      spreadsheetId,
      values: [mapContainerToRow(container)],
    });

    return container;
  } catch (error) {
    if (
      error instanceof GoogleSheetsApiError &&
      ['not-found', 'template-not-ready', 'unknown'].includes(error.code)
    ) {
      throw new Error('Spreadsheet template is not ready.', {
        cause: error,
      });
    }

    throw error;
  }
}
