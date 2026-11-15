import { Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { typography } from '@shared/theme/typography';

type TipoDeRetorno = 'erro' | 'sucesso';

type MensagemDeRetornoProps = {
  texto: string | null;
  tipo?: TipoDeRetorno;
};

export function MensagemDeRetorno({ texto, tipo = 'erro' }: MensagemDeRetornoProps) {
  const theme = useAppTheme();

  if (!texto) return null;

  const cor = tipo === 'sucesso' ? theme.colors.success : theme.colors.error;

  return (
    <Text accessibilityLiveRegion="polite" style={[styles.texto, { color: cor }]}>
      {texto}
    </Text>
  );
}

const styles = StyleSheet.create({
  texto: { fontSize: typography.fontSize.sm, lineHeight: 20 },
});
