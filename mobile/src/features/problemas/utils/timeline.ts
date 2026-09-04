import type { Comentario } from '@features/comentarios/types';
import type { Mobilizacao } from '@features/mobilizations/types';
import type { EventoTimeline, ImagemProblema, Problema } from '../types';

export interface MontarTimelineInput {
  problema?: Problema | null;
  imagens?: ImagemProblema[];
  comentarios?: Comentario[];
  mobilizacoes?: Mobilizacao[];
}

function ehDataValida(data: string): boolean {
  return !Number.isNaN(new Date(data).getTime());
}

export function montarTimeline({
  problema,
  imagens = [],
  comentarios = [],
  mobilizacoes = [],
}: MontarTimelineInput): EventoTimeline[] {
  const eventos: EventoTimeline[] = [];

  if (problema) {
    eventos.push({
      id: `problema-${problema.id}`,
      tipo: 'problema_criado',
      data: problema.criado_em,
      titulo: 'Problema registrado',
      descricao: problema.titulo,
    });
  }

  imagens.forEach((imagem) => {
    eventos.push({
      id: `imagem-${imagem.id}`,
      tipo: 'evidencia_adicionada',
      data: imagem.criado_em,
      titulo: 'Evidência adicionada',
    });
  });

  comentarios.forEach((comentario) => {
    eventos.push({
      id: `comentario-${comentario.id}`,
      tipo: 'comentario_criado',
      data: comentario.criado_em,
      titulo: 'Novo comentário',
      descricao: comentario.conteudo,
      autor: comentario.autor.nome,
    });
  });

  mobilizacoes.forEach((mobilizacao) => {
    eventos.push({
      id: `mobilizacao-${mobilizacao.id}`,
      tipo: 'mobilizacao_criada',
      data: mobilizacao.criado_em,
      titulo: 'Mobilização criada',
      descricao: mobilizacao.titulo,
    });

    if (mobilizacao.status === 'realizada') {
      eventos.push({
        id: `mobilizacao-realizada-${mobilizacao.id}`,
        tipo: 'mobilizacao_realizada',
        data: mobilizacao.atualizado_em,
        titulo: 'Mobilização realizada',
        descricao: mobilizacao.titulo,
      });
    }
  });

  return eventos
    .filter((evento) => ehDataValida(evento.data))
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}
