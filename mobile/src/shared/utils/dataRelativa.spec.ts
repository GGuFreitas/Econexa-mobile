import { describe, it, expect } from 'vitest';
import { formatarDataRelativa } from './dataRelativa';

const referencia = new Date('2026-09-03T12:00:00.000Z');

describe('formatarDataRelativa', () => {
  it('retorna "agora" para menos de um minuto', () => {
    expect(formatarDataRelativa('2026-09-03T11:59:30.000Z', referencia)).toBe('agora');
  });

  it('usa singular e plural em minutos e horas', () => {
    expect(formatarDataRelativa('2026-09-03T11:59:00.000Z', referencia)).toBe('há 1 minuto');
    expect(formatarDataRelativa('2026-09-03T11:45:00.000Z', referencia)).toBe('há 15 minutos');
    expect(formatarDataRelativa('2026-09-03T10:00:00.000Z', referencia)).toBe('há 2 horas');
  });

  it('escala para dias, semanas, meses e anos', () => {
    expect(formatarDataRelativa('2026-09-01T12:00:00.000Z', referencia)).toBe('há 2 dias');
    expect(formatarDataRelativa('2026-08-20T12:00:00.000Z', referencia)).toBe('há 2 semanas');
    expect(formatarDataRelativa('2026-06-03T12:00:00.000Z', referencia)).toBe('há 3 meses');
    expect(formatarDataRelativa('2024-09-03T12:00:00.000Z', referencia)).toBe('há 2 anos');
  });

  it('retorna string vazia para data inválida', () => {
    expect(formatarDataRelativa('data-quebrada', referencia)).toBe('');
  });
});
