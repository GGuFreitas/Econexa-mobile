import { describe, expect, it } from 'vitest';
import {
  apresentarAviso,
  comAlfa,
  formatarDataHora,
  iniciais,
  membroDesde,
  quandoAcontece,
  rotuloPapel,
} from './perfil';

const iso = (ano: number, mes: number, dia: number, hora = 9, minuto = 0) =>
  new Date(ano, mes - 1, dia, hora, minuto).toISOString();

describe('iniciais', () => {
  it('usa a primeira letra do primeiro e do último nome', () => {
    expect(iniciais('Joana Ribeiro')).toBe('JR');
    expect(iniciais('joana maria ribeiro')).toBe('JR');
  });

  it('com um nome só, usa uma letra', () => {
    expect(iniciais('Joana')).toBe('J');
  });

  it('sem nome, devolve um marcador', () => {
    expect(iniciais('   ')).toBe('?');
  });
});

describe('membroDesde', () => {
  it('mostra mês abreviado e ano', () => {
    expect(membroDesde(iso(2026, 10, 3))).toBe('out/2026');
  });
});

describe('quandoAcontece', () => {
  const sexta = new Date(2026, 10, 13, 18, 0);

  it('fala hoje e amanhã pelo dia do calendário, não por 24 h', () => {
    expect(quandoAcontece(iso(2026, 11, 13, 21), sexta)).toBe('hoje');
    expect(quandoAcontece(iso(2026, 11, 14, 8), sexta)).toBe('amanhã');
  });

  it('usa o dia da semana até 6 dias à frente', () => {
    expect(quandoAcontece(iso(2026, 11, 16), sexta)).toBe('segunda');
    expect(quandoAcontece(iso(2026, 11, 19), sexta)).toBe('quinta');
  });

  it('usa a data a partir de uma semana', () => {
    expect(quandoAcontece(iso(2026, 11, 20), sexta)).toBe('20/11');
  });
});

describe('formatarDataHora', () => {
  it('mostra dia, mês e hora', () => {
    expect(formatarDataHora(iso(2026, 11, 16, 9, 5))).toBe('16/11, 09:05');
  });
});

describe('rotuloPapel', () => {
  it('diz o papel da pessoa na ação', () => {
    expect(rotuloPapel('organizadora')).toBe('você organiza');
    expect(rotuloPapel('participante')).toBe('você participa');
  });
});

describe('apresentarAviso', () => {
  it('relato perto da meta diz quanto falta e mede o avanço', () => {
    const aviso = apresentarAviso({
      tipo: 'perto_da_meta',
      problema_id: 5,
      titulo: 'Poste apagado',
      cont_apoios: 41,
      meta: 50,
    });

    expect(aviso).toMatchObject({ titulo: 'Faltam 9 apoios', progresso: 82, alerta: false });
    expect(aviso.texto).toContain('"Poste apagado"');
  });

  it('concorda quando falta um apoio só', () => {
    const aviso = apresentarAviso({
      tipo: 'perto_da_meta',
      problema_id: 5,
      titulo: 'Poste',
      cont_apoios: 49,
      meta: 50,
    });

    expect(aviso.titulo).toBe('Falta 1 apoio');
  });

  it('encaminhamento sem resposta vira alerta com o órgão', () => {
    const aviso = apresentarAviso({
      tipo: 'sem_resposta',
      problema_id: 5,
      encaminhamento_id: 9,
      titulo: 'Poste apagado',
      orgao: 'Subprefeitura',
      enviado_em: iso(2026, 11, 4),
      dias: 10,
    });

    expect(aviso).toMatchObject({ titulo: 'Sem resposta há 10 dias', alerta: true });
    expect(aviso.texto).toContain('Subprefeitura');
  });

  it('ação próxima diz quando é, quantos vão e o papel', () => {
    const aviso = apresentarAviso(
      {
        tipo: 'acao_proxima',
        mobilizacao_id: 3,
        problema_id: 5,
        titulo: 'Mutirão',
        data_inicio: iso(2026, 11, 14, 9),
        cont_participantes: 14,
        papel: 'organizadora',
      },
      new Date(2026, 10, 13, 18),
    );

    expect(aviso.titulo).toBe('Sua ação é amanhã');
    expect(aviso.texto).toBe('Mutirão · 14 confirmadas · você organiza');
  });
});

describe('comAlfa', () => {
  it('converte hex em rgba', () => {
    expect(comAlfa('#FFFFFF', 0.74)).toBe('rgba(255, 255, 255, 0.74)');
    expect(comAlfa('#171B21', 0.5)).toBe('rgba(23, 27, 33, 0.5)');
    expect(comAlfa('#abc', 1)).toBe('rgba(170, 187, 204, 1)');
  });
});
