import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { LoadingSpinner, EmptyState, ErrorState } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { useLocalizacao } from '@shared/hooks/useLocalizacao';
import type { RootStackParamList } from '@navigation/AppNavigator';
import { useEstatisticas, useProblemas } from '../hooks';
import { MapFilters } from '../map/MapFilters';
import { ProblemCard } from '../components/ProblemCard';
import { AvisoPerto } from '../components/AvisoPerto';
import { RAIO_PERTO_METROS } from '../utils/proximidade';
import { useMeusApoios } from '@features/perfil/hooks/usePerfil';

type Desfazer = (() => void) | null;

export function FeedScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [causa, setCausa] = useState<number | null>(null);
  const [desfazer, setDesfazer] = useState<Desfazer>(null);
  const { coordenada, carregando, erro } = useLocalizacao();
  const { data: meusApoios } = useMeusApoios();
  const apoiados = new Set(meusApoios ?? []);

  // Sem esperar o GPS: a lista aparece já; quando a localização chega, reordena por distância.
  const perto =
    !carregando && !erro && coordenada
      ? { lat: coordenada.latitude, lng: coordenada.longitude, raio: RAIO_PERTO_METROS }
      : null;

  const { data, isLoading, isError, refetch, isRefetching } = useProblemas({
    status: 'ativo',
    causaId: causa ?? undefined,
    limite: 50,
    ...perto,
  });
  const { data: estatisticas } = useEstatisticas({ status: 'ativo', ...perto }, perto !== null);

  const raioKm = RAIO_PERTO_METROS / 1000;
  const totalPerto = perto && estatisticas ? estatisticas.total : null;
  const relatar = () => navigation.navigate('CriarProblema');
  const fecharAviso = () => setDesfazer(null);
  const aoRetirarApoio = (acao: () => void) => setDesfazer(() => acao);
  const desfazerRetirada = () => {
    desfazer?.();
    setDesfazer(null);
  };

  const cabecalho = (
    <View style={{ backgroundColor: theme.colors.background }}>
      <AvisoPerto total={totalPerto} raioKm={raioKm} localizando={carregando} />
      <MapFilters ativo={causa} onSelecionar={setCausa} />
    </View>
  );

  if (isLoading && !data) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {cabecalho}
        <LoadingSpinner mensagem="Carregando o feed" />
      </View>
    );
  }

  if (isError && !data) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {cabecalho}
        <ErrorState message="Não deu para carregar o feed." dica="Confira sua conexão e tente de novo." onRetry={() => refetch()} />
      </View>
    );
  }

  const vazioDescricao = causa
    ? 'Nenhum problema desta categoria por aqui. Tente outra ou relate um novo.'
    : perto
      ? `Nenhum problema em até ${raioKm} km. Viu algo? Seja a primeira pessoa a relatar.`
      : 'Ninguém relatou nada ainda. Viu algo? Seja a primeira pessoa a relatar.';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={data}
        keyExtractor={(p) => String(p.id)}
        ListHeaderComponent={cabecalho}
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        contentContainerStyle={{ paddingBottom: spacing.five, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.three }} />}
        ListEmptyComponent={
          <EmptyState
            icon="map-marker-plus-outline"
            title="Nada por aqui ainda"
            description={vazioDescricao}
            acaoRotulo="Relatar problema"
            acaoIcone="plus"
            onAcao={relatar}
          />
        }
        renderItem={({ item, index }) => (
          <View style={{ paddingHorizontal: spacing.three, paddingTop: index === 0 ? spacing.two : 0 }}>
            <ProblemCard
              problema={item}
              apoiado={apoiados.has(item.id)}
              onPress={(id) => navigation.navigate('DetalheProblema', { id })}
              onApoioRetirado={aoRetirarApoio}
            />
          </View>
        )}
      />
      <Snackbar
        visible={desfazer !== null}
        onDismiss={fecharAviso}
        duration={5000}
        action={{ label: 'Desfazer', onPress: desfazerRetirada }}
      >
        Apoio retirado.
      </Snackbar>
    </View>
  );
}
