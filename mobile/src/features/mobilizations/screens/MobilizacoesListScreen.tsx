import { FlatList, StyleSheet, View } from 'react-native';
import { Button, LoadingSpinner, EmptyState, ErrorState } from '@shared/ui';
import { spacing } from '@shared/theme/spacing';
import { useMobilizacoes } from '../hooks/useMobilizacoes';
import { MobilizacaoCard } from '../components/MobilizacaoCard';

interface MobilizacoesListScreenProps {
  problemaId: number;
  onPress: (id: number) => void;
  onCriar: () => void;
}

export function MobilizacoesListScreen({
  problemaId,
  onPress,
  onCriar,
}: MobilizacoesListScreenProps) {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMobilizacoes({ problemaId, limite: 20 });

  const mobilizacoes = data?.pages.flat() ?? [];

  if (isLoading && mobilizacoes.length === 0) return <LoadingSpinner />;
  if (isError) return <ErrorState message="Falha ao carregar mobilizações." />;

  return (
    <FlatList
      data={mobilizacoes}
      keyExtractor={(m) => String(m.id)}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        mobilizacoes.length > 0 ? (
          <Button mode="contained" icon="account-group" onPress={onCriar}>
            Nova mobilização
          </Button>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.vazio}>
          <EmptyState
            title="Nenhuma mobilização"
            description="Seja o primeiro a organizar uma ação para este problema."
          />
          <Button mode="contained" icon="account-group" onPress={onCriar}>
            Organizar uma ação
          </Button>
        </View>
      }
      renderItem={({ item }) => <MobilizacaoCard mobilizacao={item} onPress={onPress} />}
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
  vazio: { gap: spacing.three, paddingVertical: spacing.four },
});
