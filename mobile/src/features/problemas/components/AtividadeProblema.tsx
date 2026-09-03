import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { ComentariosList } from '@features/comentarios/components/ComentariosList';
import { useTimeline } from '../hooks/useTimeline';
import { Timeline } from './Timeline';

interface AtividadeProblemaProps {
  problemaId: number;
}

export function AtividadeProblema({ problemaId }: AtividadeProblemaProps) {
  const theme = useAppTheme();
  const { eventos, isLoading, isError, error, refetch } = useTimeline(problemaId);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.secao}>
        <Text style={[styles.titulo, { color: theme.colors.onSurface }]}>Linha do tempo</Text>
        <Timeline
          eventos={eventos}
          isLoading={isLoading}
          isError={isError}
          mensagemErro={(error as Error | null)?.message}
          onRetry={refetch}
        />
      </View>

      <ComentariosList problemaId={problemaId} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.four, gap: spacing.four },
  secao: { gap: spacing.three },
  titulo: { fontSize: typography.fontSize.md, fontWeight: '700' },
});
