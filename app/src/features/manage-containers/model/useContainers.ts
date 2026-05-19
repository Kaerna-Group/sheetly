import { useCallback, useEffect, useMemo, useState } from 'react';

import type { CurrencyCode } from '@entities/app-settings';
import type { Container } from '@entities/container';
import { useGoogleAuth } from '@features/google-auth';
import { localStorageService } from '@shared/lib/storage/local-storage.service';

import { createContainer, readContainers } from '../lib/manage-containers.service';

export function useContainers() {
  const googleAuth = useGoogleAuth();
  const spreadsheetId = localStorageService.get('spreadsheetId');
  const [containers, setContainers] = useState<Container[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [templateStatus, setTemplateStatus] = useState<'ready' | 'needs-setup' | 'unknown'>(
    'unknown',
  );
  const [warning, setWarning] = useState<string | null>(null);

  const context = useMemo(
    () => ({
      accessToken: googleAuth.accessToken,
      spreadsheetId,
    }),
    [googleAuth.accessToken, spreadsheetId],
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await readContainers(context);

      setContainers(result.containers);
      setTemplateStatus(result.templateStatus);
      setWarning(result.warning);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not load containers.');
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  async function createAndSelectContainer(name: string, currency: CurrencyCode) {
    setIsCreating(true);
    setError(null);

    try {
      const container = await createContainer({
        ...context,
        currency,
        existingContainers: containers,
        name,
      });

      setContainers((currentContainers) => [
        container,
        ...currentContainers.filter((currentContainer) => currentContainer.id !== container.id),
      ]);

      return container;
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not create container.');
      return null;
    } finally {
      setIsCreating(false);
    }
  }

  return {
    containers,
    createAndSelectContainer,
    error,
    isCreating,
    isLoading,
    refresh,
    templateStatus,
    warning,
  };
}
