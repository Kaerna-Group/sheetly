export type ComboboxItem = {
  id: string;
  label: string;
};

export type ComboboxOption =
  | {
      item: ComboboxItem;
      kind: 'item';
    }
  | {
      id: string;
      inputValue: string;
      kind: 'create';
      label: string;
    };

export function normalizeComboboxValue(value: string) {
  return value.trim().toLowerCase();
}

type BuildComboboxOptionsParams<TItem extends ComboboxItem> = {
  getCreateLabel?: (value: string) => string;
  inputValue: string;
  items: TItem[];
};

export function buildComboboxOptions<TItem extends ComboboxItem>({
  getCreateLabel = (value) => `Create "${value}"`,
  inputValue,
  items,
}: BuildComboboxOptionsParams<TItem>): ComboboxOption[] {
  const normalizedInput = normalizeComboboxValue(inputValue);
  const filteredItems = normalizedInput
    ? items.filter((item) => normalizeComboboxValue(item.label).includes(normalizedInput))
    : items;
  const hasExactMatch = items.some(
    (item) => normalizeComboboxValue(item.label) === normalizedInput,
  );
  const options: ComboboxOption[] = filteredItems.map((item) => ({
    item,
    kind: 'item',
  }));

  if (normalizedInput && !hasExactMatch) {
    options.push({
      id: `create-${normalizedInput}`,
      inputValue: inputValue.trim(),
      kind: 'create',
      label: getCreateLabel(inputValue.trim()),
    });
  }

  return options;
}
