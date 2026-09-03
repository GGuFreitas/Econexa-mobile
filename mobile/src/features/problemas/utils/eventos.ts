import type { EventoApresentado, ProblemaEvento, ProblemaEventoTipo } from '../types';

const TITULO_POR_TIPO: Record<ProblemaEventoTipo, string> = {
  PROBLEMA_CRIADO: 'Problema registrado',
  EVIDENCIA_ADICIONADA: 'Evidência adicionada',
  COMENTARIO_CRIADO: 'Novo comentário',
  MOBILIZACAO_CRIADA: 'Mobilização criada',
  MOBILIZACAO_REALIZADA: 'Mobilização realizada',
  ENCAMINHADO: 'Encaminhado ao órgão responsável',
  RESPOSTA_RECEBIDA: 'Resposta do órgão registrada',
  STATUS_ALTERADO: 'Status alterado',
  RESOLVIDO: 'Problema resolvido',
};

export const STATUS_LABEL: Record<string, string> = {
  ativo: 'Ativo',
  em_analise: 'Em análise',
  encaminhado: 'Encaminhado',
  resolvido: 'Resolvido',
  removido: 'Removido',
};

function texto(dados: Record<string, unknown>, chave: string): string | undefined {
  const valor = dados[chave];
  return typeof valor === 'string' && valor.trim() !== '' ? valor : undefined;
}

function rotuloStatus(dados: Record<string, unknown>, chave: string): string | undefined {
  const valor = texto(dados, chave);
  return valor ? (STATUS_LABEL[valor] ?? valor) : undefined;
}

function descrever(evento: ProblemaEvento): string | undefined {
  const dados = evento.dados ?? {};

  switch (evento.tipo) {
    case 'PROBLEMA_CRIADO':
      return texto(dados, 'titulo');
    case 'COMENTARIO_CRIADO':
      return texto(dados, 'trecho');
    case 'MOBILIZACAO_CRIADA':
    case 'MOBILIZACAO_REALIZADA':
      return texto(dados, 'titulo');
    case 'ENCAMINHADO':
      return texto(dados, 'orgao_nome');
    case 'RESPOSTA_RECEBIDA': {
      const orgao = texto(dados, 'orgao_nome');
      const protocolo = texto(dados, 'protocolo');
      if (orgao && protocolo) return `${orgao} — protocolo ${protocolo}`;
      return orgao ?? (protocolo ? `Protocolo ${protocolo}` : undefined);
    }
    case 'STATUS_ALTERADO': {
      const de = rotuloStatus(dados, 'de');
      const para = rotuloStatus(dados, 'para');
      return de && para ? `${de} → ${para}` : para;
    }
    case 'RESOLVIDO':
      return undefined;
    case 'EVIDENCIA_ADICIONADA':
      return undefined;
    default:
      return undefined;
  }
}

export function apresentarEvento(evento: ProblemaEvento): EventoApresentado {
  return {
    id: evento.id,
    tipo: evento.tipo,
    data: evento.criado_em,
    titulo: TITULO_POR_TIPO[evento.tipo] ?? 'Atividade registrada',
    descricao: descrever(evento),
    autor: evento.autor?.nome,
  };
}

export function apresentarEventos(eventos: ProblemaEvento[] = []): EventoApresentado[] {
  return eventos.map(apresentarEvento);
}
