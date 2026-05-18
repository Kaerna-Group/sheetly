import type { Category, CategoryKind } from '@entities/category';
import { Combobox } from '@shared/ui/combobox';

import { filterCategories } from '../lib/filter-categories';
import { useCategories } from '../model/useCategories';

type CategoryComboboxProps = {
  kind: CategoryKind;
  onChange: (category: Category) => void;
  value: Category | null;
};

export function CategoryCombobox({ kind, onChange, value }: CategoryComboboxProps) {
  const { categories, createAndSelectCategory, error, isCreating, isLoading } = useCategories(kind);

  return (
    <Combobox
      key={`${kind}-${value?.id ?? 'empty'}`}
      emptyLabel="No categories found"
      error={error ?? undefined}
      getCreateLabel={(inputValue) => `Create "${inputValue}"`}
      hint={
        isLoading
          ? 'Loading categories...'
          : isCreating
            ? 'Creating category...'
            : 'Choose an existing category or create a new one.'
      }
      items={filterCategories(categories, kind, '').map((category) => ({
        ...category,
        label: category.name,
      }))}
      label="Category"
      onCreate={async (name) => {
        const category = await createAndSelectCategory(name);

        if (category) {
          onChange(category);
        }
      }}
      onSelect={onChange}
      placeholder="Start typing category"
      value={value ? { ...value, label: value.name } : null}
    />
  );
}
