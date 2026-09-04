import { useMemo } from 'react';
import { useComentarios } from '@features/comentarios/hooks/useComentarios';
import { useMobilizacoes } from '@features/mobilizations/hooks/useMobilizacoes';
import { useProblema } from './useProblema';
import { useImagensProblema } from './useImagensProblema';
import { montarTimeline } from '../utils/timeline';
import type { EventoTimeline } from '../types';

const LIMITE_MOBILIZACOES = 20;

interface TimelineResultado {
  eventos: EventoTimeline[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useTimeline(problemaId: number): TimelineResultado {
  const problema = useProblema(problemaId);
  const imagens = useImagensProblema(problemaId);
  const comentarios = useComentarios(problemaId);
  const mobilizacoes = useMobilizacoes({ problemaId, limite: LIMITE_MOBILIZACOES });

  const eventos = useMemo(
    () =>
      montarTimeline({
        problema: problema.data,
        imagens: imagens.data,
        comentarios: comentarios.data,
        mobilizacoes: mobilizacoes.data?.pages.flat(),
      }),
    [problema.data, imagens.data, comentarios.data, mobilizacoes.data],
  );

  const refetch = () => {
    problema.refetch();
    imagens.refetch();
    comentarios.refetch();
    mobilizacoes.refetch();
  };

  return {
    eventos,
    isLoading:
      problema.isLoading || imagens.isLoading || comentarios.isLoading || mobilizacoes.isLoading,
    isError: problema.isError || imagens.isError || comentarios.isError || mobilizacoes.isError,
    refetch,
  };
}
