import { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import { FAB, LoadingSpinner, ErrorState, EmptyState } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { useLocalizacao } from '@shared/hooks/useLocalizacao';
import { useProblemas, useEstatisticas, useApoio } from '../hooks';
import { clusterizar } from '../utils/clusterUtils';
import { ProblemMarker } from './ProblemMarker';
import { ProblemCluster } from './ProblemCluster';
import { MapBottomSheet } from './MapBottomSheet';
import { MapFilters } from './MapFilters';
import { MapLegend } from './MapLegend';
import { PertoDeVoce } from './PertoDeVoce';
import type { Problema } from '../types';

interface ProblemMapProps {
  onRelatar?: () => void;
  onVerDetalhes?: (id: number) => void;
  onApoiar?: (id: number) => void;
}

export function ProblemMap({ onRelatar, onVerDetalhes, onApoiar }: ProblemMapProps) {
  const theme = useAppTheme();
  const { coordenada, carregando, erro } = useLocalizacao();
  const [filtroCausa, setFiltroCausa] = useState<number | null>(null);
  const [regiao, setRegiao] = useState<Region | null>(null);
  const [selecionado, setSelecionado] = useState<Problema | null>(null);

  const { data: problemas, isLoading, isError } = useProblemas({
    lat: coordenada?.latitude,
    lng: coordenada?.longitude,
    raio: 8000,
    causaId: filtroCausa ?? undefined,
    status: 'ativo',
    limite: 100,
  });

  const { data: estatisticas } = useEstatisticas({
    lat: coordenada?.latitude,
    lng: coordenada?.longitude,
    raio: 8000,
    status: 'ativo',
  });

  const cellSize = regiao ? Math.max(0.008, regiao.latitudeDelta / 10) : 0.02;
  const clusters = useMemo(
    () => clusterizar(problemas ?? [], cellSize),
    [problemas, cellSize],
  );

  const { apoiar } = useApoio(selecionado?.id ?? 0);

  if (carregando || (isLoading && !problemas)) return <LoadingSpinner />;
  if (erro) return <ErrorState message={erro} />;
  if (isError) return <ErrorState message="Não foi possível carregar o mapa." />;

  const regiaoInicial: Region =
    regiao ?? {
      latitude: coordenada?.latitude ?? -23.5505,
      longitude: coordenada?.longitude ?? -46.6333,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={regiaoInicial}
        region={regiao ?? undefined}
        onRegionChangeComplete={(r) => setRegiao(r)}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {clusters.map((grupo) => {
          if (grupo.pontos.length === 1) {
            const p = grupo.pontos[0];
            return (
              <ProblemMarker key={p.id} problema={p} onPress={setSelecionado} />
            );
          }
          return (
            <ProblemCluster
              key={grupo.id}
              pontos={grupo.pontos}
              onPress={() =>
                setRegiao({
                  latitude: grupo.coordenada.latitude,
                  longitude: grupo.coordenada.longitude,
                  latitudeDelta: (regiao?.latitudeDelta ?? 0.04) / 3,
                  longitudeDelta: (regiao?.longitudeDelta ?? 0.04) / 3,
                })
              }
            />
          );
        })}
      </MapView>

      <View style={[styles.topBar, { backgroundColor: theme.colors.surface }]}>
        <MapFilters ativo={filtroCausa} onSelecionar={setFiltroCausa} />
      </View>

      {coordenada && (
        <PertoDeVoce
          total={estatisticas?.total ?? 0}
          mobilizando={estatisticas?.porCausa?.reduce((acc, c) => acc + c.total, 0) ?? 0}
        />
      )}

      <MapLegend />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.secondary }]}
        color={theme.colors.onSecondary}
        onPress={onRelatar}
      />

      <MapBottomSheet
        problema={selecionado}
        visible={selecionado != null}
        onDismiss={() => setSelecionado(null)}
        onVerDetalhes={(id) => {
          setSelecionado(null);
          onVerDetalhes?.(id);
        }}
        onApoiar={selecionado ? () => apoiar.mutate() : undefined}
        apoiando={apoiar.isPending}
      />

      {!problemas?.length && !isLoading && (
        <View style={styles.emptyOverlay}>
          <EmptyState title="Nenhum problema por aqui" description="Toque no + para relatar algo." />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E6EC',
  },
  fab: {
    position: 'absolute',
    right: spacing.four,
    bottom: 96,
  },
  emptyOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 120,
    height: 200,
  },
});
