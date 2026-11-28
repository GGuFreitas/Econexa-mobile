import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Modal, Select } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { texto } from '@shared/theme/typography';
import { mensagemDeErro } from '@shared/utils/mensagemDeErro';
import { useDenuncia } from '../hooks/useDenuncia';
import type { DenunciaMotivo } from '../types';

interface DenunciaModalProps {
  problemaId: number;
  visivel: boolean;
  onFechar: () => void;
  onEnviada: () => void;
}

const MOTIVOS: { label: string; value: DenunciaMotivo }[] = [
  { label: 'Spam ou propaganda', value: 'spam' },
  { label: 'Conteúdo inadequado', value: 'conteudo_inadequado' },
  { label: 'Repetido (já existe)', value: 'duplicado' },
  { label: 'Outro motivo', value: 'outro' },
];

export function DenunciaModal({ problemaId, visivel, onFechar, onEnviada }: DenunciaModalProps) {
  const theme = useAppTheme();
  const denuncia = useDenuncia(problemaId);
  const [motivo, setMotivo] = useState<DenunciaMotivo>('spam');
  const erro = denuncia.isError ? mensagemDeErro(denuncia.error, 'Não deu para enviar a denúncia. Tente de novo.') : null;

  const enviar = () =>
    denuncia.mutate(motivo, {
      onSuccess: () => {
        onFechar();
        onEnviada();
      },
    });

  return (
    <Modal
      visible={visivel}
      onDismiss={onFechar}
      contentContainerStyle={[styles.caixa, { backgroundColor: theme.colors.surface }]}
    >
      <Text accessibilityRole="header" style={[styles.titulo, { color: theme.colors.onSurface }]}>
        Denunciar este problema
      </Text>
      <Text style={[styles.texto, { color: theme.colors.onSurfaceVariant }]}>
        Diga o motivo. A moderação revisa cada denúncia.
      </Text>
      <Select
        label="Motivo"
        value={motivo}
        onValueChange={(v) => setMotivo(v as DenunciaMotivo)}
        options={MOTIVOS}
      />
      {erro && (
        <Text accessibilityRole="alert" style={[styles.erro, { color: theme.colors.error }]}>
          {erro}
        </Text>
      )}
      <View style={styles.acoes}>
        <Button mode="text" onPress={onFechar} disabled={denuncia.isPending}>
          Cancelar
        </Button>
        <Button mode="contained" icon="flag" loading={denuncia.isPending} disabled={denuncia.isPending} onPress={enviar}>
          Enviar denúncia
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  caixa: { margin: spacing.three, borderRadius: 24, padding: spacing.four, gap: spacing.three },
  titulo: { ...texto.tituloSecao, fontSize: 20, lineHeight: 26 },
  texto: { ...texto.corpo },
  erro: { ...texto.meta, fontSize: 14 },
  acoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.one, flexWrap: 'wrap' },
});
