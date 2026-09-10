import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, Modal, Select } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { useAlterarStatus } from '../hooks/useAlterarStatus';
import { opcoesDeStatus, rotuloStatus } from '../utils/status';
import type { ProblemaStatus } from '../types';

interface AlterarStatusModalProps {
  problemaId: number;
  visivel: boolean;
  transicoes: ProblemaStatus[];
  onFechar: () => void;
}

export function AlterarStatusModal({
  problemaId,
  visivel,
  transicoes,
  onFechar,
}: AlterarStatusModalProps) {
  const theme = useAppTheme();
  const alterar = useAlterarStatus(problemaId);
  const [destino, setDestino] = useState<ProblemaStatus | null>(null);

  const opcoes = opcoesDeStatus(transicoes);
  const selecionado = destino ?? opcoes[0]?.value ?? null;

  const fechar = () => {
    setDestino(null);
    alterar.reset();
    onFechar();
  };

  const confirmar = () => {
    if (!selecionado) return;
    alterar.mutate(selecionado, { onSuccess: fechar });
  };

  return (
    <Modal visible={visivel} onDismiss={fechar}>
      <View style={[styles.modal, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.titulo, { color: theme.colors.onSurface }]}>Alterar status</Text>

        {opcoes.length === 0 ? (
          <Text style={[styles.aviso, { color: theme.colors.textSecondary }]}>
            Não há mudança de status disponível para você neste problema.
          </Text>
        ) : (
          <>
            <Select
              label="Novo status"
              value={selecionado ?? opcoes[0].value}
              onValueChange={(valor) => setDestino(String(valor) as ProblemaStatus)}
              options={opcoes}
            />
            <Text style={[styles.aviso, { color: theme.colors.textSecondary }]}>
              O problema passa a constar como {rotuloStatus(String(selecionado))} para toda a
              comunidade e a mudança fica registrada na linha do tempo.
            </Text>
          </>
        )}

        {alterar.isError && (
          <Text style={[styles.erro, { color: theme.colors.error }]}>
            {(alterar.error as Error).message}
          </Text>
        )}

        <View style={styles.acoes}>
          <Button mode="outlined" onPress={fechar} disabled={alterar.isPending}>
            Cancelar
          </Button>
          {opcoes.length > 0 && (
            <Button
              mode="contained"
              loading={alterar.isPending}
              disabled={alterar.isPending}
              onPress={confirmar}
            >
              Confirmar
            </Button>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { margin: spacing.four, padding: spacing.four, borderRadius: 12, gap: spacing.two },
  titulo: { fontSize: typography.fontSize.lg, fontWeight: '700' },
  aviso: { fontSize: typography.fontSize.sm, lineHeight: 20 },
  erro: { fontSize: typography.fontSize.xs },
  acoes: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.two,
    marginTop: spacing.two,
  },
});
