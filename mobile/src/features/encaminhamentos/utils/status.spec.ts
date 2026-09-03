import { describe, it, expect } from 'vitest';
import { corStatusEncaminhamento, opcoesDeOrgao, rotuloStatusEncaminhamento } from './status';

describe('status do encaminhamento', () => {
  it('traduz cada estado do encaminhamento', () => {
    expect(rotuloStatusEncaminhamento('pendente')).toBe('Aguardando envio');
    expect(rotuloStatusEncaminhamento('enviado')).toBe('Enviado ao órgão');
    expect(rotuloStatusEncaminhamento('respondido')).toBe('Respondido');
    expect(rotuloStatusEncaminhamento('falhou')).toBe('Falha no envio');
  });

  it('dá uma cor distinta para cada estado', () => {
    const cores = (['pendente', 'enviado', 'respondido', 'falhou'] as const).map(
      corStatusEncaminhamento,
    );
    expect(new Set(cores).size).toBe(4);
  });
});

describe('opcoesDeOrgao', () => {
  it('mostra o órgão com a esfera para o usuário escolher', () => {
    expect(
      opcoesDeOrgao([{ id: 2, nome: 'Secretaria de Obras', esfera: 'municipal' }]),
    ).toEqual([{ label: 'Secretaria de Obras (municipal)', value: 2 }]);
  });

  it('não oferece órgão nenhum quando a lista ainda não carregou', () => {
    expect(opcoesDeOrgao()).toEqual([]);
    expect(opcoesDeOrgao([])).toEqual([]);
  });
});
