import type { CurrencyCode } from '@entities/app-settings';
import type { Container } from '@entities/container';
import { localStorageService } from '@shared/lib/storage/local-storage.service';
import { Combobox } from '@shared/ui/combobox';

import { useContainers } from '../model/useContainers';

type ContainerComboboxProps = {
  currency: CurrencyCode;
  onChange: (container: Container) => void;
  value: Container | null;
};

export function ContainerCombobox({ currency, onChange, value }: ContainerComboboxProps) {
  const {
    containers,
    createAndSelectContainer,
    error,
    isCreating,
    isLoading,
    templateStatus,
    warning,
  } = useContainers();
  const canCreate = templateStatus !== 'needs-setup';

  return (
    <Combobox
      key={value?.id ?? 'empty-container'}
      canCreate={canCreate}
      emptyLabel="No containers found"
      error={error ?? undefined}
      getCreateLabel={(inputValue) => `Create "${inputValue}"`}
      hint={
        warning ??
        (isLoading
          ? 'Loading containers...'
          : isCreating
            ? 'Creating container...'
            : canCreate
              ? 'Choose an existing container or create a new one.'
              : 'Run spreadsheet setup before creating new containers.')
      }
      items={containers.map((container) => ({
        ...container,
        label: `${container.name} · ${container.currency}`,
      }))}
      label="Container"
      onCreate={async (name) => {
        const container = await createAndSelectContainer(name, currency);

        if (container) {
          localStorageService.set('lastSelectedContainerId', container.id);
          onChange(container);
        }
      }}
      onSelect={(container) => {
        localStorageService.set('lastSelectedContainerId', container.id);
        onChange(container);
      }}
      placeholder="Start typing container"
      value={value ? { ...value, label: `${value.name} · ${value.currency}` } : null}
    />
  );
}
