import { describe, expect, it } from 'vitest';

import { calculateSignedAmount } from './calculate-signed-amount';

describe('calculateSignedAmount', () => {
  it('keeps income positive', () => {
    expect(calculateSignedAmount('income', 250)).toBe(250);
  });

  it('converts expense to negative amount', () => {
    expect(calculateSignedAmount('expense', 250)).toBe(-250);
  });
});
