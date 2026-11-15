import { describe, expect, it } from 'vitest';
import { resumoDosMotivos, rotuloDoMotivo } from './motivos';

describe('motivos de denúncia', () => {
  it('traduz os motivos conhecidos e mantém os desconhecidos', () => {
    expect(rotuloDoMotivo('conteudo_inadequado')).toBe('Conteúdo inadequado');
    expect(rotuloDoMotivo('novo_motivo')).toBe('novo_motivo');
  });

  it('agrupa e ordena do motivo mais citado para o menos', () => {
    expect(resumoDosMotivos(['spam', 'outro', 'spam'])).toEqual([
      { rotulo: 'Spam', quantidade: 2 },
      { rotulo: 'Outro', quantidade: 1 },
    ]);
  });
});
