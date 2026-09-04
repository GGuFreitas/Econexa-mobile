import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, ErrorState, LoadingSpinner, Modal, Select, TextInput } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { useOrgaos } from '../hooks/useOrgaos';
import { useCriarEncaminhamento } from '../hooks/useCriarEncaminhamento';
import { opcoesDeOrgao } from '../utils/status';

interface EncaminharProblemaModalProps {
  problemaId: number;
  visivel: boolean;
  onFechar: () => void;
}

export function EncaminharProblemaModal({
  problemaId,
  visivel,
  onFechar,
}: EncaminharProblemaModalProps) {
  const theme = useAppTheme();
  const orgaos = useOrgaos(visivel);
  const encaminhar = useCriarEncaminhamento(problemaId);
  const [orgaoId, setOrgaoId] = useState<number | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [confirmando, setConfirmando] = useState(false);

  const opcoes = opcoesDeOrgao(orgaos.data);
  const selecionado = orgaoId ?? opcoes[0]?.value ?? null;
  const orgaoEscolhido = orgaos.data?.find((orgao) => orgao.id === selecionado);

  const fechar = () => {
    setConfirmando(false);
    setMensagem('');
    setOrgaoId(null);
    encaminhar.reset();
    onFechar();
  };

  const confirmar = () => {
    if (selecionado == null) return;
    encaminhar.mutate(
      { orgaoId: selecionado, mensagem: mensagem.trim() || undefined },
      { onSuccess: fechar },
    );
  };

  return (
    <Modal visible={visivel} onDismiss={fechar}>
      <View style={[styles.modal, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.titulo, { color: theme.colors.onSurface }]}>Encaminhar problema</Text>

        {orgaos.isLoading && <LoadingSpinner size="small" />}

        {!orgaos.isLoading && orgaos.isError && (
          <ErrorState
            message={(orgaos.error as Error).message}
            onRetry={() => {
              orgaos.refetch();
            }}
          />
        )}

        {!orgaos.isLoading && !orgaos.isError && opcoes.length === 0 && (
          <Text style={[styles.aviso, { color: theme.colors.textSecondary }]}>
            Nenhum órgão responsável cadastrado.
          </Text>
        )}

        {!orgaos.isLoading && !orgaos.isError && opcoes.length > 0 && !confirmando && (
          <>
            <Select
              label="Órgão responsável"
              value={selecionado ?? opcoes[0].value}
              onValueChange={(valor) => setOrgaoId(Number(valor))}
              options={opcoes}
            />
            <TextInput
              label="Mensagem complementar (opcional)"
              value={mensagem}
              onChangeText={setMensagem}
              multiline
              numberOfLines={3}
            />
            <View style={styles.acoes}>
              <Button mode="outlined" onPress={fechar}>
                Cancelar
              </Button>
              <Button mode="contained" icon="send" onPress={() => setConfirmando(true)}>
                Continuar
              </Button>
            </View>
          </>
        )}

        {confirmando && (
          <>
            <Text style={[styles.aviso, { color: theme.colors.textSecondary }]}>
              O problema será enviado por e-mail para {orgaoEscolhido?.nome} e o registro do
              encaminhamento fica público na linha do tempo. Esta ação não pode ser desfeita.
            </Text>
            {encaminhar.isError && (
              <Text style={[styles.erro, { color: theme.colors.error }]}>
                {(encaminhar.error as Error).message}
              </Text>
            )}
            <View style={styles.acoes}>
              <Button
                mode="outlined"
                onPress={() => setConfirmando(false)}
                disabled={encaminhar.isPending}
              >
                Voltar
              </Button>
              <Button
                mode="contained"
                loading={encaminhar.isPending}
                disabled={encaminhar.isPending}
                onPress={confirmar}
              >
                Confirmar envio
              </Button>
            </View>
          </>
        )}
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
