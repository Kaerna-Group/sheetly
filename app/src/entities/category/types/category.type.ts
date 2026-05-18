import type { CategoryId } from './category-id.type';
import type { CategoryKind } from './category-kind.type';

export type Category = {
  id: CategoryId;
  name: string;
  kind: CategoryKind;
  color: string;
  icon: string;
  isDefault: boolean;
};
