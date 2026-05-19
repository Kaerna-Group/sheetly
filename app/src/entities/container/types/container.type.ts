import type { CurrencyCode } from '@entities/app-settings';

import type { ContainerId } from './container-id.type';

export type Container = {
  color: string;
  createdAt: string;
  currency: CurrencyCode;
  icon: string;
  id: ContainerId;
  isDefault: boolean;
  name: string;
};
