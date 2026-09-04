import { describe, it, expect } from 'vitest';
import {
  apresentarEvento,
  apresentarEventos,
  AVISO_RESPOSTA_NAO_VERIFICADA,
} from './eventos';
import type { ProblemaEvento, ProblemaEventoTipo } from '../types';

function evento(
  tipo: ProblemaEventoTipo,
  dados: Record<string, unknown> = {},
  autor: { id: number; nome: string } | null = { id: 5, nome: 'Ana' },
): ProblemaEvento {
  return { id: 1, problema_id: 3, tipo, dados, criado_em: '2026-09-03T10:00:00.000Z', autor };
}

describe('apresentarEvento', () => {
  it('dá um título próprio para cada tipo de evento', () => {
    const tipos: ProblemaEventoTipo[] = [
      'PROBLEMA_CRIADO',
      'EVIDENCIA_ADICIONADA',
      'COMENTARIO_CRIADO',
      'APOIO_CRIADO',
      'APOIO_REMOVIDO',
      'MOBILIZACAO_CRIADA',
      'MOBILIZACAO_REALIZADA',
      'ENCAMINHADO',
      'RESPOSTA_RECEBIDA',
      'STATUS_ALTERADO',
      'RESOLVIDO',
    ];

    const titulos = tipos.map((tipo) => apresentarEvento(evento(tipo)).titulo);

    expect(new Set(titulos).size).toBe(tipos.length);
    expect(titulos).not.toContain(undefined);
  });

  it('usa o trecho do comentário como descrição', () => {
    const apresentado = apresentarEvento(
      evento('COMENTARIO_CRIADO', { trecho: 'Piorou depois da chuva.' }),
    );

    expect(apresentado.descricao).toBe('Piorou depois da chuva.');
    expect(apresentado.autor).toBe('Ana');
  });

  it('descreve a mudança de status com os rótulos em português', () => {
    const apresentado = apresentarEvento(
      evento('STATUS_ALTERADO', { de: 'ativo', para: 'encaminhado' }),
    );

    expect(apresentado.descricao).toBe('Ativo → Encaminhado');
  });

  it('junta órgão e protocolo na resposta, sempre marcada como relato do cidadão', () => {
    expect(
      apresentarEvento(
        evento('RESPOSTA_RECEBIDA', { orgao_nome: 'Secretaria de Obras', protocolo: 'OS-1' }),
      ).descricao,
    ).toBe(`Secretaria de Obras — protocolo OS-1. ${AVISO_RESPOSTA_NAO_VERIFICADA}`);

    expect(
      apresentarEvento(evento('RESPOSTA_RECEBIDA', { orgao_nome: 'Secretaria de Obras' })).descricao,
    ).toBe(`Secretaria de Obras. ${AVISO_RESPOSTA_NAO_VERIFICADA}`);
  });

  it('não deixa a resposta passar por confirmação do órgão nem sem dado nenhum', () => {
    const apresentado = apresentarEvento(evento('RESPOSTA_RECEBIDA'));

    expect(apresentado.titulo).toBe('Resposta relatada pelo cidadão');
    expect(apresentado.descricao).toBe(AVISO_RESPOSTA_NAO_VERIFICADA);
  });

  it('dá título próprio para apoio dado e apoio retirado', () => {
    expect(apresentarEvento(evento('APOIO_CRIADO')).titulo).toBe('Apoiou o problema');
    expect(apresentarEvento(evento('APOIO_REMOVIDO')).titulo).toBe('Retirou o apoio');
    expect(apresentarEvento(evento('APOIO_CRIADO')).autor).toBe('Ana');
    expect(apresentarEvento(evento('APOIO_CRIADO')).descricao).toBeUndefined();
  });

  it('não inventa descrição quando os dados do evento estão vazios', () => {
    expect(apresentarEvento(evento('EVIDENCIA_ADICIONADA')).descricao).toBeUndefined();
    expect(apresentarEvento(evento('RESOLVIDO')).descricao).toBeUndefined();
    expect(apresentarEvento(evento('PROBLEMA_CRIADO', { titulo: '   ' })).descricao).toBeUndefined();
  });

  it('deixa o autor indefinido em evento sem ator', () => {
    expect(apresentarEvento(evento('EVIDENCIA_ADICIONADA', {}, null)).autor).toBeUndefined();
  });

  it('preserva a ordem que veio do backend', () => {
    const eventos = apresentarEventos([
      { ...evento('RESOLVIDO'), id: 3 },
      { ...evento('ENCAMINHADO'), id: 2 },
      { ...evento('PROBLEMA_CRIADO'), id: 1 },
    ]);

    expect(eventos.map((item) => item.id)).toEqual([3, 2, 1]);
  });

  it('devolve lista vazia quando ainda não há eventos carregados', () => {
    expect(apresentarEventos()).toEqual([]);
  });
});
