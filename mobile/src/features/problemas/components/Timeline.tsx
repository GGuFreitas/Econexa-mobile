import { View, StyleSheet } from 'react-native';
import { EmptyState, ErrorState, LoadingSpinner } from '@shared/ui';
import { spacing } from '@shared/theme/spacing';
import { EventoItem } from './EventoItem';
import type { EventoApresentado } from '../types';

interface TimelineProps {
  eventos: EventoApresentado[];
  isLoading: boolean;
  isError: boolean;
  mensagemErro?: string;
  onRetry: () => void;
}

export function Timeline({ eventos, isLoading, isError, mensagemErro, onRetry }: TimelineProps) {
  if (isLoading) return <LoadingSpinner size="small" />;
  if (isError) {
    return (
      <ErrorState message={mensagemErro ?? 'Falha ao carregar a atividade.'} onRetry={onRetry} />
    );
  }
  if (eventos.length === 0) {
    return (
      <EmptyState
        title="Sem atividade ainda"
        description="As ações registradas neste problema vão aparecer aqui."
      />
    );
  }

  return (
    <View style={styles.container}>
      {eventos.map((evento, index) => (
        <EventoItem key={evento.id} evento={evento} ultimo={index === eventos.length - 1} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.two },
});
