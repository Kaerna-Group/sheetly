import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('base', 'active')).toBe('base active');
  });

  it('filters empty values', () => {
    expect(cn('base', false, null, undefined, 'active')).toBe('base active');
  });
});
