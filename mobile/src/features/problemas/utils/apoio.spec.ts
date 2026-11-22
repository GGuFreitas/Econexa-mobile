import { describe, expect, it } from 'vitest';
import { ajustarApoios, alternarId, deltaDeApoio } from './apoio';

describe('alternarId', () => {
  it('inclui o id ao apoiar, sem duplicar', () => {
    expect(alternarId([1, 2], 3, true)).toEqual([1, 2, 3]);
    expect(alternarId([1, 3], 3, true)).toEqual([1, 3]);
    expect(alternarId(undefined, 3, true)).toEqual([3]);
  });

  it('tira o id ao retirar o apoio', () => {
    expect(alternarId([1, 3], 3, false)).toEqual([1]);
    expect(alternarId(undefined, 3, false)).toEqual([]);
  });
});

describe('ajustarApoios', () => {
  const lista = [
    { id: 1, cont_apoios: 5 },
    { id: 2, cont_apoios: 0 },
  ];

  it('muda só o item apoiado', () => {
    expect(ajustarApoios(lista, 1, 1)).toEqual([
      { id: 1, cont_apoios: 6 },
      { id: 2, cont_apoios: 0 },
    ]);
  });

  it('não deixa a contagem negativa', () => {
    expect(ajustarApoios(lista, 2, -1)?.[1].cont_apoios).toBe(0);
  });

  it('sem mudança devolve a mesma lista', () => {
    expect(ajustarApoios(lista, 1, 0)).toBe(lista);
    expect(ajustarApoios(undefined, 1, 1)).toBeUndefined();
  });
});

describe('deltaDeApoio', () => {
  it('só conta quando o estado muda', () => {
    expect(deltaDeApoio(false, true)).toBe(1);
    expect(deltaDeApoio(true, false)).toBe(-1);
    expect(deltaDeApoio(true, true)).toBe(0);
    expect(deltaDeApoio(false, false)).toBe(0);
  });
});
