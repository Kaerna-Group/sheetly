import { useMemo } from 'react';

import type { Currency } from '@entities/currency';
import { Select } from '@shared/ui/select';

import { formatCurrencyLabel, getEnabledCurrencies } from '../lib/currency-options';
import { useCurrencies } from '../model/useCurrencies';

type CurrencySelectProps = {
  id?: string;
  label?: string;
  onChange: (code: string) => void;
  value: string;
};

function buildUnknownCurrency(code: string): Currency {
  return {
    id: code.toLowerCase(),
    code,
    name: code,
    symbol: '',
    decimalDigits: 2,
    isDefault: false,
    isEnabled: true,
  };
}

export function CurrencySelect({
  id = 'transaction-currency',
  label = 'Currency',
  onChange,
  value,
}: CurrencySelectProps) {
  const { currencies, isLoading, warning } = useCurrencies();

  const options = useMemo(() => {
    const enabled = getEnabledCurrencies(currencies);

    // Keep a legacy/disabled currency selectable so editing an older transaction
    // never silently rewrites its currency to a different option.
    if (value && !enabled.some((currency) => currency.code === value)) {
      return [buildUnknownCurrency(value), ...enabled];
    }

    return enabled;
  }, [currencies, value]);

  return (
    <Select
      hint={warning ?? (isLoading ? 'Loading currencies...' : undefined)}
      id={id}
      label={label}
      onChange={onChange}
      options={options.map((currency) => ({
        label: formatCurrencyLabel(currency),
        value: currency.code,
      }))}
      value={value}
    />
  );
}
