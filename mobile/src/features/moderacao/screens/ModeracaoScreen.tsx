import { FlatList, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Header, ScreenWrapper, LoadingSpinner, EmptyState, ErrorState } from '@shared/ui';
import { spacing } from '@shared/theme/spacing';
import type { RootStackParamList } from '@navigation/AppNavigator';
import { useFilaDeDenuncias } from '../hooks/useFilaDeDenuncias';
import { ProblemaDenunciadoCard } from '../components/ProblemaDenunciadoCard';
import type { ProblemaDenunciado } from '../types';

type ModeracaoNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ModeracaoScreen() {
  const navigation = useNavigation<ModeracaoNavigationProp>();
  const { data, isLoading, isError, refetch, isRefetching } = useFilaDeDenuncias();

  const handleVoltar = () => navigation.goBack();
  const handleAbrir = (item: ProblemaDenunciado) => navigation.navigate('ModeracaoItem', { item });
  const handleRecarregar = () => {
    refetch();
  };

  let conteudo;
  if (isLoading) {
    conteudo = <LoadingSpinner />;
  } else if (isError) {
    conteudo = (
      <ErrorState message="Não foi possível carregar as denúncias." onRetry={handleRecarregar} />
    );
  } else {
    conteudo = (
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => String(item.problema_id)}
        renderItem={({ item }) => <ProblemaDenunciadoCard item={item} onPress={handleAbrir} />}
        ItemSeparatorComponent={Separador}
        contentContainerStyle={styles.lista}
        refreshing={isRefetching}
        onRefresh={handleRecarregar}
        ListEmptyComponent={
          <EmptyState
            icon="shield-check"
            title="Nenhuma denúncia pendente"
            description="Quando alguém denunciar um problema, ele aparece aqui."
          />
        }
      />
    );
  }

  return (
    <ScreenWrapper>
      <Header title="Moderação" onBack={handleVoltar} />
      {conteudo}
    </ScreenWrapper>
  );
}

function Separador() {
  return <View style={styles.separador} />;
}

const styles = StyleSheet.create({
  lista: { paddingVertical: spacing.three, flexGrow: 1 },
  separador: { height: spacing.two },
});
