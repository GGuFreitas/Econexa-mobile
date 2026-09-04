import { describe, it, expect } from 'vitest';
import { montarTimeline } from './timeline';
import type { Problema, ImagemProblema } from '../types';
import type { Comentario } from '@features/comentarios/types';
import type { Mobilizacao } from '@features/mobilizations/types';

const problema = {
  id: 1,
  titulo: 'Alagamento na esquina',
  criado_em: '2026-09-01T08:00:00.000Z',
} as Problema;

const imagem = {
  id: 4,
  criado_em: '2026-09-01T09:00:00.000Z',
} as ImagemProblema;

const comentario = {
  id: 7,
  conteudo: 'Piorou depois da chuva.',
  criado_em: '2026-09-02T12:00:00.000Z',
  autor: { id: 5, nome: 'Ana' },
} as Comentario;

const mobilizacao = {
  id: 2,
  titulo: 'Mutirão de limpeza',
  status: 'realizada',
  criado_em: '2026-09-01T18:00:00.000Z',
  atualizado_em: '2026-09-03T10:00:00.000Z',
} as Mobilizacao;

describe('montarTimeline', () => {
  it('monta os eventos disponíveis do problema em ordem do mais recente para o mais antigo', () => {
    const eventos = montarTimeline({
      problema,
      imagens: [imagem],
      comentarios: [comentario],
      mobilizacoes: [mobilizacao],
    });

    expect(eventos.map((evento) => evento.tipo)).toEqual([
      'mobilizacao_realizada',
      'comentario_criado',
      'mobilizacao_criada',
      'evidencia_adicionada',
      'problema_criado',
    ]);
  });

  it('leva autor e conteúdo do comentário para o evento', () => {
    const eventos = montarTimeline({ problema, comentarios: [comentario] });
    const evento = eventos.find((item) => item.tipo === 'comentario_criado');

    expect(evento?.autor).toBe('Ana');
    expect(evento?.descricao).toBe('Piorou depois da chuva.');
  });

  it('não gera evento de mobilização realizada enquanto ela estiver agendada', () => {
    const eventos = montarTimeline({
      problema,
      mobilizacoes: [{ ...mobilizacao, status: 'agendada' } as Mobilizacao],
    });

    expect(eventos.some((evento) => evento.tipo === 'mobilizacao_realizada')).toBe(false);
    expect(eventos.some((evento) => evento.tipo === 'mobilizacao_criada')).toBe(true);
  });

  it('retorna lista vazia quando o problema ainda não carregou', () => {
    expect(montarTimeline({})).toEqual([]);
  });

  it('descarta eventos com data inválida', () => {
    const eventos = montarTimeline({
      problema,
      imagens: [{ ...imagem, criado_em: 'sem-data' } as ImagemProblema],
    });

    expect(eventos).toHaveLength(1);
    expect(eventos[0].tipo).toBe('problema_criado');
  });
});
