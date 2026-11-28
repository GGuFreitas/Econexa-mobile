import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, type LayoutChangeEvent } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FAB, LoadingSpinner, ErrorState } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { texto } from '@shared/theme/typography';
import { useLocalizacao } from '@shared/hooks/useLocalizacao';
import { useMeusApoios } from '@features/perfil/hooks/usePerfil';
import { useProblemas, useEstatisticas, useApoio } from '../hooks';
import { clusterizar } from '../utils/clusterUtils';
import { RAIO_PERTO_METROS } from '../utils/proximidade';
import { MapaBase } from './MapaBase';
import { MapBottomSheet } from './MapBottomSheet';
import { MapFilters } from './MapFilters';
import { PertoDeVoce } from './PertoDeVoce';
import { mapShadow } from './mapTheme';
import type { Regiao } from './mapaBase.types';
import type { Problema } from '../types';

interface ProblemMapProps {
  onRelatar?: () => void;
  onVerDetalhes?: (id: number) => void;
}

const DELTA_INICIAL = 0.04;

export function ProblemMap({ onRelatar, onVerDetalhes }: ProblemMapProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [alturaTopo, setAlturaTopo] = useState(insets.top + 64);
  const { coordenada, carregando, erro } = useLocalizacao();
  const [filtroCausa, setFiltroCausa] = useState<number | null>(null);
  const [regiao, setRegiao] = useState<Regiao | null>(null);
  const [selecionadoId, setSelecionadoId] = useState<number | null>(null);
  const { data: meusApoios } = useMeusApoios();

  const { data: problemas, isLoading, isError, refetch } = useProblemas({
    lat: coordenada?.latitude,
    lng: coordenada?.longitude,
    raio: RAIO_PERTO_METROS,
    causaId: filtroCausa ?? undefined,
    status: 'ativo',
    limite: 100,
  });

  const { data: estatisticas } = useEstatisticas({
    lat: coordenada?.latitude,
    lng: coordenada?.longitude,
    raio: RAIO_PERTO_METROS,
    status: 'ativo',
  });

  // O mapa abre já (no centro de SP) e vai para a pessoa quando o GPS responde.
  useEffect(() => {
    if (carregando || erro || !coordenada || regiao) return;
    setRegiao({ ...coordenada, latitudeDelta: DELTA_INICIAL, longitudeDelta: DELTA_INICIAL });
  }, [carregando, erro, coordenada, regiao]);

  const cellSize = regiao ? Math.max(0.008, regiao.latitudeDelta / 10) : 0.02;
  const clusters = useMemo(() => clusterizar(problemas ?? [], cellSize), [problemas, cellSize]);

  // Lê o problema da lista atual, para a prévia refletir apoios recém-dados.
  const selecionado: Problema | null = problemas?.find((p) => p.id === selecionadoId) ?? null;
  const apoiado = selecionadoId != null && (meusApoios ?? []).includes(selecionadoId);
  const { apoiar, desapoiar } = useApoio(selecionadoId ?? 0);
  const alternarApoio = () => (apoiado ? desapoiar.mutate() : apoiar.mutate());

  const medirTopo = (e: LayoutChangeEvent) => setAlturaTopo(e.nativeEvent.layout.height);
  const abaixoDoTopo = alturaTopo + spacing.two;

  if (isLoading && !problemas) return <LoadingSpinner mensagem="Carregando o mapa" />;
  if (isError && !problemas) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}>
        <ErrorState message="Não deu para carregar o mapa." dica="Confira sua conexão e tente de novo." onRetry={() => refetch()} />
      </View>
    );
  }

  const regiaoInicial: Regiao = {
    latitude: coordenada?.latitude ?? -23.5505,
    longitude: coordenada?.longitude ?? -46.6333,
    latitudeDelta: DELTA_INICIAL,
    longitudeDelta: DELTA_INICIAL,
  };
  const vazio = !problemas?.length && !isLoading;

  return (
    <View style={{ flex: 1 }}>
      <MapaBase
        regiaoInicial={regiaoInicial}
        regiao={regiao}
        onMudarRegiao={setRegiao}
        clusters={clusters}
        onSelecionar={(p) => setSelecionadoId(p.id)}
        onAproximar={(grupo) =>
          setRegiao({
            latitude: grupo.coordenada.latitude,
            longitude: grupo.coordenada.longitude,
            latitudeDelta: (regiao?.latitudeDelta ?? DELTA_INICIAL) / 3,
            longitudeDelta: (regiao?.longitudeDelta ?? DELTA_INICIAL) / 3,
          })
        }
      />

      <View
        onLayout={medirTopo}
        style={[
          styles.topBar,
          { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outline, paddingTop: insets.top + spacing.one },
        ]}
      >
        <MapFilters ativo={filtroCausa} onSelecionar={setFiltroCausa} />
      </View>

      {!erro && !carregando && estatisticas && (
        <PertoDeVoce total={estatisticas.total} raioKm={RAIO_PERTO_METROS / 1000} top={abaixoDoTopo} />
      )}

      {erro && (
        <View
          accessibilityRole="alert"
          style={[
            styles.aviso,
            mapShadow,
            { top: abaixoDoTopo, backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow },
          ]}
        >
          <MaterialCommunityIcons name="crosshairs-off" size={18} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.avisoTexto, { color: theme.colors.onSurface }]}>
            Sem sua localização. Mostrando o centro de São Paulo.
          </Text>
        </View>
      )}

      {vazio && (
        <View
          style={[
            styles.vazio,
            mapShadow,
            { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow },
          ]}
        >
          <Text style={[styles.vazioTitulo, { color: theme.colors.onSurface }]}>Nenhum problema por aqui</Text>
          <Text style={[styles.vazioTexto, { color: theme.colors.onSurfaceVariant }]}>
            {filtroCausa ? 'Nada desta categoria nesta área. Tente outra.' : 'Viu algo na rua? Toque em Relatar.'}
          </Text>
        </View>
      )}

      <FAB
        icon="plus"
        label="Relatar"
        accessibilityLabel="Relatar um problema"
        style={[styles.fab, { backgroundColor: theme.colors.secondary }]}
        color={theme.colors.onSecondary}
        onPress={onRelatar}
      />

      <MapBottomSheet
        problema={selecionado}
        visible={selecionado != null}
        apoiado={apoiado}
        enviando={apoiar.isPending || desapoiar.isPending}
        onDismiss={() => setSelecionadoId(null)}
        onAlternarApoio={alternarApoio}
        onVerDetalhes={(id) => {
          setSelecionadoId(null);
          onVerDetalhes?.(id);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, borderBottomWidth: 1, paddingBottom: spacing.half },
  aviso: {
    position: 'absolute',
    left: spacing.three,
    right: spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.one,
    paddingVertical: spacing.two,
    paddingHorizontal: spacing.three,
    borderRadius: 16,
  },
  avisoTexto: { ...texto.meta, fontSize: 14, flex: 1 },
  fab: { position: 'absolute', right: spacing.three, bottom: spacing.three },
  vazio: {
    position: 'absolute',
    left: spacing.three,
    right: 128,
    bottom: spacing.three,
    borderRadius: 16,
    padding: spacing.three,
    gap: 2,
  },
  vazioTitulo: { ...texto.corpoForte },
  vazioTexto: { ...texto.meta },
});
