import { describe, expect, it } from 'vitest';
import { META_APOIOS, progressoMeta } from './meta';

describe('progressoMeta', () => {
  it('mede o avanço em porcentagem da meta', () => {
    expect(progressoMeta(0)).toBe(0);
    expect(progressoMeta(18)).toBe(36);
    expect(progressoMeta(META_APOIOS)).toBe(100);
  });

  it('não passa de 100 quando a meta foi superada', () => {
    expect(progressoMeta(META_APOIOS * 3)).toBe(100);
  });

  it('não fica negativo', () => {
    expect(progressoMeta(-4)).toBe(0);
  });
});
