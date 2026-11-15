import { describe, expect, it } from 'vitest';
import { formatarDistancia, rotuloProblemas } from './proximidade';

describe('formatarDistancia', () => {
  it('mostra metros arredondados de 10 em 10 abaixo de 1 km', () => {
    expect(formatarDistancia(347)).toBe('350 m');
    expect(formatarDistancia(3)).toBe('10 m');
  });

  it('passa para km quando o arredondamento chega a 1000 m', () => {
    expect(formatarDistancia(996)).toBe('1,0 km');
  });

  it('usa uma casa decimal com vírgula até 10 km', () => {
    expect(formatarDistancia(1500)).toBe('1,5 km');
    expect(formatarDistancia(2149)).toBe('2,1 km');
  });

  it('arredonda para km inteiro a partir de 10 km', () => {
    expect(formatarDistancia(12600)).toBe('13 km');
  });
});

describe('rotuloProblemas', () => {
  it('concorda o número', () => {
    expect(rotuloProblemas(1)).toBe('1 problema');
    expect(rotuloProblemas(0)).toBe('0 problemas');
    expect(rotuloProblemas(6)).toBe('6 problemas');
  });
});
