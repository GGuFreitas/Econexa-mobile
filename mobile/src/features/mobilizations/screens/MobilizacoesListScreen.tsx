import { FlatList, StyleSheet, View } from 'react-native';
import { LoadingSpinner, EmptyState, ErrorState } from '@shared/ui';
import { spacing } from '@shared/theme/spacing';
import { useMobilizacoes } from '../hooks/useMobilizacoes';
import { MobilizacaoCard } from '../components/MobilizacaoCard';

interface MobilizacoesListScreenProps {
  problemaId: number;
  onPress: (id: number) => void;
}

export function MobilizacoesListScreen({ problemaId, onPress }: MobilizacoesListScreenProps) {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useMobilizacoes({
    problemaId,
    limite: 20,
  });

  const mobilizacoes = data?.pages.flat() ?? [];

  if (isLoading && mobilizacoes.length === 0) return <LoadingSpinner />;
  if (isError) return <ErrorState message="Falha ao carregar mobilizações." />;

  return (
    <FlatList
      data={mobilizacoes}
      keyExtractor={(m) => String(m.id)}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <EmptyState
          title="Nenhuma mobilização"
          description="Seja o primeiro a organizar uma ação para este problema."
        />
      }
      renderItem={({ item }) => (
        <MobilizacaoCard mobilizacao={item} onPress={onPress} />
      )}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.5}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.four, gap: spacing.three, paddingBottom: spacing.four },
});