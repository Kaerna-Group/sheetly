import { describe, expect, it } from 'vitest';

import { buildComboboxOptions } from './build-combobox-options';

const items = [
  { id: 'food', label: 'Food' },
  { id: 'transport', label: 'Transport' },
];

describe('buildComboboxOptions', () => {
  it('returns all items for empty input', () => {
    expect(buildComboboxOptions({ inputValue: '', items })).toHaveLength(2);
  });

  it('filters matching items and adds create option when no exact match exists', () => {
    expect(buildComboboxOptions({ inputValue: 'foo', items })).toEqual([
      {
        item: {
          id: 'food',
          label: 'Food',
        },
        kind: 'item',
      },
      {
        id: 'create-foo',
        inputValue: 'foo',
        kind: 'create',
        label: 'Create "foo"',
      },
    ]);
  });

  it('does not add create option for exact matches', () => {
    expect(buildComboboxOptions({ inputValue: 'food', items })).toEqual([
      {
        item: {
          id: 'food',
          label: 'Food',
        },
        kind: 'item',
      },
    ]);
  });

  it('does not add create option when creation is disabled', () => {
    expect(buildComboboxOptions({ canCreate: false, inputValue: 'coffee', items })).toEqual([]);
  });
});
