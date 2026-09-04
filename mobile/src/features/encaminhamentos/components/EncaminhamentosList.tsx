import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EmptyState, ErrorState, LoadingSpinner } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { useEncaminhamentos } from '../hooks/useEncaminhamentos';
import { EncaminhamentoCard } from './EncaminhamentoCard';
import { RegistrarRespostaModal } from './RegistrarRespostaModal';
import type { Encaminhamento } from '../types';

interface EncaminhamentosListProps {
  problemaId: number;
}

export function EncaminhamentosList({ problemaId }: EncaminhamentosListProps) {
  const theme = useAppTheme();
  const { data, isLoading, isError, error, refetch } = useEncaminhamentos(problemaId);
  const [respondendo, setRespondendo] = useState<Encaminhamento | null>(null);

  return (
    <View style={styles.container}>
      <Text style={[styles.titulo, { color: theme.colors.onSurface }]}>
        Encaminhamentos institucionais
      </Text>

      {isLoading && <LoadingSpinner size="small" />}

      {!isLoading && isError && (
        <ErrorState
          message={(error as Error).message}
          onRetry={() => {
            refetch();
          }}
        />
      )}

      {!isLoading && !isError && data?.length === 0 && (
        <EmptyState
          title="Nenhum encaminhamento"
          description="Este problema ainda não foi enviado a um órgão responsável."
        />
      )}

      {!isLoading && !isError && !!data?.length && (
        <View style={styles.lista}>
          {data.map((encaminhamento) => (
            <EncaminhamentoCard
              key={encaminhamento.id}
              encaminhamento={encaminhamento}
              onRegistrarResposta={setRespondendo}
            />
          ))}
        </View>
      )}

      <RegistrarRespostaModal
        problemaId={problemaId}
        encaminhamento={respondendo}
        onFechar={() => setRespondendo(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.three },
  titulo: { fontSize: typography.fontSize.md, fontWeight: '700' },
  lista: { gap: spacing.two },
});
