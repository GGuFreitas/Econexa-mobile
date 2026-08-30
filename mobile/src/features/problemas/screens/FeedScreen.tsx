import { useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { Header, ScreenWrapper, LoadingSpinner, EmptyState, ErrorState } from '@shared/ui';
import { spacing } from '@shared/theme/spacing';
import type { RootStackParamList } from '@navigation/AppNavigator';
import { useProblemas } from '../hooks';
import { MapFilters } from '../map/MapFilters';
import { ProblemCard } from '../components/ProblemCard';

export function FeedScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [causa, setCausa] = useState<number | null>(null);
  const { data, isLoading, isError } = useProblemas({
    status: 'ativo',
    causaId: causa ?? undefined,
    limite: 50,
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState message="Falha ao carregar o feed." />;

  return (
    <ScreenWrapper>
      <Header title="Mutira" />
      <MapFilters ativo={causa} onSelecionar={setCausa} />
      <FlatList
        data={data}
        keyExtractor={(p) => String(p.id)}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState title="Nada por aqui" description="Relate o primeiro problema." />
        }
        renderItem={({ item }) => (
          <ProblemCard
            problema={item}
            onPress={(id) => navigation.navigate('DetalheProblema', { id })}
          />
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: { paddingBottom: spacing.four, gap: spacing.three },
});
