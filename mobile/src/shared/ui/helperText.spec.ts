import { describe, it, expect } from 'vitest';
import { estadoDoHelperText } from './helperText';

describe('estadoDoHelperText', () => {
  it('mostra a mensagem de erro de validação em vez de engoli-la', () => {
    expect(estadoDoHelperText('Mínimo 3 caracteres', true)).toEqual({
      visivel: true,
      tipo: 'error',
      texto: 'Mínimo 3 caracteres',
    });
  });

  it('mostra a dica sem cor de erro quando o campo está válido', () => {
    expect(estadoDoHelperText('Use o nome da rua')).toEqual({
      visivel: true,
      tipo: 'info',
      texto: 'Use o nome da rua',
    });
  });

  it('não ocupa espaço quando não há mensagem', () => {
    expect(estadoDoHelperText(undefined, true).visivel).toBe(false);
    expect(estadoDoHelperText('', true).visivel).toBe(false);
    expect(estadoDoHelperText('   ', true).visivel).toBe(false);
  });
});
