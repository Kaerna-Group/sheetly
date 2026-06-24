import { useState } from 'react';

import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Modal } from '@shared/ui/modal';
import { CurrencySelect } from '@features/manage-currencies';

import { useContainers } from '../model/useContainers';

type ManageContainersModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ManageContainersModal({ isOpen, onClose }: ManageContainersModalProps) {
  const { containers, createAndSelectContainer, error, isCreating, isLoading, warning } =
    useContainers();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('UAH');

  async function submitContainer() {
    if (!name.trim()) {
      return;
    }

    const container = await createAndSelectContainer(name, currency);

    if (container) {
      setName('');
    }
  }

  return (
    <Modal
      description="Containers are separate money stores used by transactions."
      isOpen={isOpen}
      onClose={onClose}
      title="Manage containers"
    >
      <div className="grid gap-4">
        {error || warning ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {error ?? warning}
          </div>
        ) : null}
        <div className="grid gap-3 md:grid-cols-[1fr_96px_auto] md:items-end">
          <Input
            id="container-name"
            label="Name"
            onChange={(event) => setName(event.target.value)}
            placeholder="Cash, Savings, EUR card"
            value={name}
          />
          <CurrencySelect onChange={setCurrency} value={currency} />
          <Button isLoading={isCreating} onClick={() => void submitContainer()}>
            Add
          </Button>
        </div>
        <div className="divide-y divide-border rounded-md border border-border">
          {isLoading ? (
            <div className="px-3 py-4 text-sm text-text-soft">Loading containers...</div>
          ) : containers.length ? (
            containers.map((container) => (
              <div className="flex items-center justify-between gap-3 px-3 py-3" key={container.id}>
                <div>
                  <p className="font-medium text-text">{container.name}</p>
                  <p className="text-sm text-text-soft">{container.currency}</p>
                </div>
                <Badge variant={container.isDefault ? 'neutral' : 'info'}>
                  {container.isDefault ? 'Default' : 'Custom'}
                </Badge>
              </div>
            ))
          ) : (
            <div className="px-3 py-4 text-sm text-text-soft">No containers yet.</div>
          )}
        </div>
      </div>
    </Modal>
  );
}
