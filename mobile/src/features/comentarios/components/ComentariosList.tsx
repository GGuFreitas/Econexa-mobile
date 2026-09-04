import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, EmptyState, ErrorState, LoadingSpinner, Modal } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { useComentarios } from '../hooks/useComentarios';
import { useExcluirComentario } from '../hooks/useExcluirComentario';
import { ComentarioForm } from './ComentarioForm';
import { ComentarioItem } from './ComentarioItem';
import type { Comentario } from '../types';

interface ComentariosListProps {
  problemaId: number;
}

export function ComentariosList({ problemaId }: ComentariosListProps) {
  const theme = useAppTheme();
  const { data: comentarios, isLoading, isError, error, refetch } = useComentarios(problemaId);
  const excluir = useExcluirComentario(problemaId);
  const [confirmacao, setConfirmacao] = useState<Comentario | null>(null);

  const fecharConfirmacao = () => setConfirmacao(null);

  const confirmarExclusao = () => {
    if (!confirmacao) return;
    excluir.mutate(confirmacao.id, { onSuccess: fecharConfirmacao });
  };

  const handleRefetch = () => {
    refetch();
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.titulo, { color: theme.colors.onSurface }]}>Comentários</Text>

      <ComentarioForm problemaId={problemaId} />

      {isLoading && <LoadingSpinner size="small" />}

      {!isLoading && isError && (
        <ErrorState message={(error as Error).message} onRetry={handleRefetch} />
      )}

      {!isLoading && !isError && comentarios?.length === 0 && (
        <EmptyState
          title="Nenhum comentário ainda"
          description="Seja o primeiro a contar o que está acontecendo por aí."
        />
      )}

      {!isLoading && !isError && !!comentarios?.length && (
        <View style={styles.lista}>
          {comentarios.map((comentario) => (
            <ComentarioItem
              key={comentario.id}
              comentario={comentario}
              onExcluir={setConfirmacao}
              excluindo={excluir.isPending && confirmacao?.id === comentario.id}
            />
          ))}
        </View>
      )}

      {excluir.isError && (
        <Text style={[styles.erro, { color: theme.colors.error }]}>
          {(excluir.error as Error).message}
        </Text>
      )}

      <Modal visible={confirmacao !== null} onDismiss={fecharConfirmacao}>
        <View style={[styles.modal, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.modalTitulo, { color: theme.colors.onSurface }]}>
            Excluir comentário
          </Text>
          <Text style={[styles.modalTexto, { color: theme.colors.textSecondary }]}>
            Esta ação não pode ser desfeita.
          </Text>
          <View style={styles.modalAcoes}>
            <Button mode="outlined" onPress={fecharConfirmacao} disabled={excluir.isPending}>
              Cancelar
            </Button>
            <Button
              mode="contained"
              buttonColor={theme.colors.error}
              loading={excluir.isPending}
              disabled={excluir.isPending}
              onPress={confirmarExclusao}
            >
              Excluir
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.three },
  titulo: { fontSize: typography.fontSize.md, fontWeight: '700' },
  lista: { gap: spacing.two },
  erro: { fontSize: typography.fontSize.xs },
  modal: { margin: spacing.four, padding: spacing.four, borderRadius: 12, gap: spacing.two },
  modalTitulo: { fontSize: typography.fontSize.lg, fontWeight: '700' },
  modalTexto: { fontSize: typography.fontSize.sm },
  modalAcoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.two, marginTop: spacing.two },
});
