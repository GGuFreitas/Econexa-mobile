import { FlatList, StyleSheet } from 'react-native';
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
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMobilizacoes({ problemaId, limite: 20 });

  const mobilizacoes = data?.pages.flat() ?? [];

  if (isLoading && mobilizacoes.length === 0) return <LoadingSpinner mensagem="Carregando os mutirões" />;
  if (isError) return <ErrorState message="Não deu para carregar os mutirões." dica="Confira sua conexão e tente de novo." onRetry={() => refetch()} />;

  return (
    <FlatList
      data={mobilizacoes}
      keyExtractor={(m) => String(m.id)}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        mobilizacoes.length > 0 ? (
          <Button mode="outlined" icon="plus" onPress={onCriar} style={styles.novo}>
            Organizar outro mutirão
          </Button>
        ) : null
      }
      ListEmptyComponent={
        <EmptyState
          compacto
          icon="account-group-outline"
          title="Nenhum mutirão ainda"
          description="Junte gente do bairro para resolver ou chamar atenção para este problema."
          acaoRotulo="Organizar mutirão"
          acaoIcone="account-group"
          onAcao={onCriar}
        />
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
  list: { padding: spacing.three, gap: spacing.three, paddingBottom: spacing.five },
  novo: { alignSelf: 'flex-start' },
});
