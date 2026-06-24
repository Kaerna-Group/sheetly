import { useEffect, useState } from 'react';

import { getDefaultCurrencies, type Currency } from '@entities/currency';
import { useGoogleAuth } from '@features/google-auth';
import { localStorageService } from '@shared/lib/storage/local-storage.service';

import { type CurrenciesTemplateStatus, readCurrencies } from '../lib/manage-currencies.service';

export function useCurrencies() {
  const googleAuth = useGoogleAuth();
  const spreadsheetId = localStorageService.get('spreadsheetId');
  const [currencies, setCurrencies] = useState<Currency[]>(getDefaultCurrencies);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [templateStatus, setTemplateStatus] = useState<CurrenciesTemplateStatus>('unknown');
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadCurrencies() {
      setIsLoading(true);
      setError(null);
      setWarning(null);

      try {
        const result = await readCurrencies({
          accessToken: googleAuth.accessToken,
          spreadsheetId,
        });

        if (isActive) {
          setCurrencies(result.currencies);
          setTemplateStatus(result.templateStatus);
          setWarning(result.warning);
        }
      } catch (caughtError) {
        if (isActive) {
          setTemplateStatus('unknown');
          setCurrencies(getDefaultCurrencies());
          setError(
            caughtError instanceof Error ? caughtError.message : 'Could not load currencies.',
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadCurrencies();

    return () => {
      isActive = false;
    };
  }, [googleAuth.accessToken, spreadsheetId]);

  return {
    currencies,
    error,
    isLoading,
    templateStatus,
    warning,
  };
}
