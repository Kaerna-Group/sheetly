import type { CurrencyCode } from '@entities/app-settings';
import type { Container } from '@entities/container';

import { normalizeContainerName } from './normalize-container-name';

export function filterContainers(containers: Container[], query: string) {
  const normalizedQuery = normalizeContainerName(query);

  if (!normalizedQuery) {
    return containers;
  }

  return containers.filter((container) =>
    normalizeContainerName(`${container.name} ${container.currency}`).includes(normalizedQuery),
  );
}

export function findContainerDuplicate(
  containers: Container[],
  name: string,
  currency: CurrencyCode,
) {
  const normalizedName = normalizeContainerName(name);

  return containers.find(
    (container) =>
      normalizeContainerName(container.name) === normalizedName && container.currency === currency,
  );
}
