import { describe, expect, it } from 'vitest';
import { gerarPeticao, referenciaDoProblema } from './peticoes.js';

const base = {
  problema: {
    id: 42,
    titulo: 'Alagamento na Rua das Flores',
    descricao: 'A rua alaga a cada chuva forte.',
    local_nome: 'Rua das Flores, 120',
    cont_apoios: 37,
    criado_em: '2026-09-01T12:00:00.000Z',
  },
  orgao: { nome: 'Secretaria de Obras', esfera: 'municipal' },
  autor: 'Ana Souza',
  linkPublico: 'http://localhost:19006/problemas/42',
};

describe('gerarPeticao', () => {
  it('usa a referência do problema no assunto e no corpo', () => {
    const peticao = gerarPeticao(base);

    expect(peticao.referencia).toBe(referenciaDoProblema(42));
    expect(peticao.assunto).toBe('[MUTIRA-P000042] Alagamento na Rua das Flores');
    expect(peticao.corpo).toContain('Referência: MUTIRA-P000042');
  });

  it('leva os dados do problema e o link público para o corpo', () => {
    const peticao = gerarPeticao(base);

    expect(peticao.corpo).toContain('Secretaria de Obras');
    expect(peticao.corpo).toContain('Rua das Flores, 120');
    expect(peticao.corpo).toContain('Apoios da comunidade: 37');
    expect(peticao.corpo).toContain('A rua alaga a cada chuva forte.');
    expect(peticao.corpo).toContain('http://localhost:19006/problemas/42');
    expect(peticao.corpo).toContain('Ana Souza');
  });

  it('inclui o complemento de quem encaminhou quando existir', () => {
    const peticao = gerarPeticao({ ...base, mensagem: '  Já houve dois acidentes.  ' });

    expect(peticao.corpo).toContain('Complemento de quem encaminhou:');
    expect(peticao.corpo).toContain('Já houve dois acidentes.');
  });

  it('não inventa dado quando o problema não tem local nem descrição', () => {
    const peticao = gerarPeticao({
      ...base,
      problema: { ...base.problema, descricao: null, local_nome: null },
    });

    expect(peticao.corpo).toContain('Local: não informado');
    expect(peticao.corpo).toContain('Sem descrição adicional informada pelo autor.');
    expect(peticao.corpo).not.toContain('Complemento de quem encaminhou:');
  });
});
