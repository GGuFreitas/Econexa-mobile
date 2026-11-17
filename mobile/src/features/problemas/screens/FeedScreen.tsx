import { useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { Header, ScreenWrapper, LoadingSpinner, EmptyState, ErrorState } from '@shared/ui';
import { spacing } from '@shared/theme/spacing';
import { useLocalizacao } from '@shared/hooks/useLocalizacao';
import type { RootStackParamList } from '@navigation/AppNavigator';
import { useEstatisticas, useProblemas } from '../hooks';
import { MapFilters } from '../map/MapFilters';
import { ProblemCard } from '../components/ProblemCard';
import { AvisoPerto } from '../components/AvisoPerto';
import { RAIO_PERTO_METROS } from '../utils/proximidade';
import { useMeusApoios } from '@features/perfil/hooks/usePerfil';

export function FeedScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [causa, setCausa] = useState<number | null>(null);
  const { coordenada, carregando, erro } = useLocalizacao();
  const { data: meusApoios } = useMeusApoios();
  const apoiados = new Set(meusApoios ?? []);

  const perto =
    !carregando && !erro && coordenada
      ? { lat: coordenada.latitude, lng: coordenada.longitude, raio: RAIO_PERTO_METROS }
      : null;

  const { data, isLoading, isError } = useProblemas(
    { status: 'ativo', causaId: causa ?? undefined, limite: 50, ...perto },
    !carregando,
  );
  const { data: estatisticas } = useEstatisticas(
    { status: 'ativo', ...perto },
    perto !== null,
  );

  if (carregando || isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState message="Falha ao carregar o feed." />;

  const raioKm = RAIO_PERTO_METROS / 1000;

  return (
    <ScreenWrapper>
      <Header title="Mutira" />
      <MapFilters ativo={causa} onSelecionar={setCausa} />
      {perto && estatisticas && <AvisoPerto total={estatisticas.total} raioKm={raioKm} />}
      <FlatList
        data={data}
        keyExtractor={(p) => String(p.id)}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            title="Nada por aqui"
            description={
              perto
                ? `Nenhum problema a até ${raioKm} km. Relate o primeiro.`
                : 'Relate o primeiro problema.'
            }
          />
        }
        renderItem={({ item }) => (
          <ProblemCard
            problema={item}
            apoiado={apoiados.has(item.id)}
            onPress={(id) => navigation.navigate('DetalheProblema', { id })}
          />
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: {
    paddingTop: spacing.two,
    paddingBottom: spacing.four,
    gap: spacing.two,
  },
});
