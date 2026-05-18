import { describe, expect, it } from 'vitest';

import { getButtonClasses } from './button-variants';

describe('getButtonClasses', () => {
  it('includes variant and size classes', () => {
    const classes = getButtonClasses('primary', 'sm');

    expect(classes).toContain('bg-brand');
    expect(classes).toContain('h-8');
  });

  it('appends custom classes', () => {
    expect(getButtonClasses('ghost', 'lg', 'custom-class')).toContain('custom-class');
  });
});
