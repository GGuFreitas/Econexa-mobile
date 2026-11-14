import { StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { comAlfa, iniciais } from '../utils/perfil';

interface Numero {
  valor: number;
  rotulo: string;
}

interface CartaoIdentidadeProps {
  nome: string;
  subtitulo: string;
  numeros: Numero[];
}

export function CartaoIdentidade({ nome, subtitulo, numeros }: CartaoIdentidadeProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.cartao,
        { borderColor: comAlfa(theme.colors.surface, 0.6), shadowColor: theme.colors.shadow },
      ]}
    >
      <BlurView
        intensity={40}
        tint={theme.dark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: comAlfa(theme.colors.surface, 0.74) }]}
      />

      <View style={styles.identidade}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
          <Text style={[styles.iniciais, { color: theme.colors.primary }]}>{iniciais(nome)}</Text>
        </View>
        <View style={styles.textos}>
          <Text style={[styles.nome, { color: theme.colors.onSurface }]} numberOfLines={1}>
            {nome}
          </Text>
          <Text style={[styles.sub, { color: theme.colors.onSurfaceVariant }]}>{subtitulo}</Text>
        </View>
      </View>

      <View style={styles.numeros}>
        {numeros.map((numero) => (
          <View
            key={numero.rotulo}
            accessible
            accessibilityLabel={`${numero.valor} ${numero.rotulo}`}
            style={[styles.numero, { backgroundColor: theme.colors.surfaceVariant }]}
          >
            <Text style={[styles.valor, { color: theme.colors.onSurface }]}>{numero.valor}</Text>
            <Text style={[styles.rotulo, { color: theme.colors.onSurfaceVariant }]}>
              {numero.rotulo}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    marginTop: -62,
    marginHorizontal: spacing.two,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    padding: spacing.three - 2,
    gap: spacing.two,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  identidade: { flexDirection: 'row', alignItems: 'center', gap: spacing.two },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iniciais: { fontSize: typography.fontSize.lg, fontWeight: '700' },
  textos: { flex: 1, minWidth: 0 },
  nome: { fontSize: typography.fontSize.md + 1, fontWeight: '700' },
  sub: { fontSize: typography.fontSize.sm },
  numeros: { flexDirection: 'row', gap: spacing.one },
  numero: { flex: 1, alignItems: 'center', paddingVertical: spacing.one, borderRadius: 10 },
  valor: { fontSize: typography.fontSize.md + 1, fontWeight: '800' },
  rotulo: { fontSize: typography.fontSize.xs },
});
