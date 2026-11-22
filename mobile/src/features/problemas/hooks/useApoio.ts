import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { apoiarProblema } from '../api/apoiar';
import { desapoiarProblema } from '../api/desapoiar';
import { ajustarApoios, alternarId, deltaDeApoio } from '../utils/apoio';
import type { ProblemaDetalhe, ProblemaListado } from '../types';

const CHAVE_MEUS_APOIOS = ['me', 'apoios'];

interface Retrato {
  detalhe?: ProblemaDetalhe;
  listas: [QueryKey, ProblemaListado[] | undefined][];
  ids?: number[];
}

export function useApoio(problemaId: number) {
  const qc = useQueryClient();
  const chaveDetalhe = ['problema', problemaId];

  const otimista = (apoiar: boolean) => async (): Promise<Retrato> => {
    await Promise.all([
      qc.cancelQueries({ queryKey: chaveDetalhe }),
      qc.cancelQueries({ queryKey: ['problemas'] }),
      qc.cancelQueries({ queryKey: CHAVE_MEUS_APOIOS }),
    ]);

    const detalhe = qc.getQueryData<ProblemaDetalhe>(chaveDetalhe);
    const listas = qc.getQueriesData<ProblemaListado[]>({ queryKey: ['problemas'] });
    const ids = qc.getQueryData<number[]>(CHAVE_MEUS_APOIOS);

    const jaApoiava = detalhe?.apoiado ?? ids?.includes(problemaId) ?? false;
    const delta = deltaDeApoio(jaApoiava, apoiar);

    if (detalhe) {
      qc.setQueryData<ProblemaDetalhe>(chaveDetalhe, {
        ...detalhe,
        apoiado: apoiar,
        cont_apoios: Math.max(0, detalhe.cont_apoios + delta),
      });
    }
    for (const [chave, lista] of listas) {
      qc.setQueryData(chave, ajustarApoios(lista, problemaId, delta));
    }
    qc.setQueryData<number[]>(CHAVE_MEUS_APOIOS, alternarId(ids, problemaId, apoiar));

    return { detalhe, listas, ids };
  };

  const reverter = (retrato: Retrato | undefined) => {
    if (!retrato) return;
    if (retrato.detalhe) qc.setQueryData(chaveDetalhe, retrato.detalhe);
    for (const [chave, lista] of retrato.listas) qc.setQueryData(chave, lista);
    qc.setQueryData(CHAVE_MEUS_APOIOS, retrato.ids);
  };

  const sincronizar = () => {
    qc.invalidateQueries({ queryKey: ['problemas'] });
    qc.invalidateQueries({ queryKey: ['me'] });
    qc.invalidateQueries({ queryKey: chaveDetalhe });
    qc.invalidateQueries({ queryKey: ['estatisticas'] });
    qc.invalidateQueries({ queryKey: ['eventos', problemaId] });
  };

  const apoiar = useMutation({
    mutationFn: () => apoiarProblema(problemaId),
    onMutate: otimista(true),
    onError: (_erro, _variaveis, retrato) => reverter(retrato),
    onSettled: sincronizar,
  });

  const desapoiar = useMutation({
    mutationFn: () => desapoiarProblema(problemaId),
    onMutate: otimista(false),
    onError: (_erro, _variaveis, retrato) => reverter(retrato),
    onSettled: sincronizar,
  });

  return { apoiar, desapoiar };
}
