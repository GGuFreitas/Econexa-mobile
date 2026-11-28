import { Platform, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { texto } from '@shared/theme/typography';
import { comAlfa } from '@shared/theme/alfa';
import { iniciais } from '../utils/perfil';

// Desfoque nativo confiável só no iOS. No Android e na web o "vidro" é feito
// com a folha quase opaca sobre a capa, com borda clara: o mesmo efeito, sem custo.
const DESFOCA = Platform.OS === 'ios';

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
  const opacidade = DESFOCA ? 0.74 : 0.9;

  return (
    <View
      style={[
        styles.cartao,
        {
          borderColor: comAlfa(theme.dark ? theme.colors.onSurface : theme.colors.surface, theme.dark ? 0.12 : 0.8),
          shadowColor: theme.colors.shadow,
        },
      ]}
    >
      {DESFOCA && (
        <BlurView intensity={40} tint={theme.dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      )}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: comAlfa(theme.colors.surface, opacidade) }]} />

      <View style={styles.identidade}>
        <View
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={[styles.iniciais, { color: theme.colors.onPrimary }]}>{iniciais(nome)}</Text>
        </View>
        <View style={styles.textos}>
          <Text accessibilityRole="header" style={[styles.nome, { color: theme.colors.onSurface }]} numberOfLines={2}>
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
            <Text style={[styles.rotulo, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
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
    marginTop: -64,
    marginHorizontal: spacing.three,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    padding: spacing.three,
    gap: spacing.three,
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  identidade: { flexDirection: 'row', alignItems: 'center', gap: spacing.three },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iniciais: { ...texto.numero },
  textos: { flex: 1, minWidth: 0, gap: 2 },
  nome: { ...texto.titulo, fontSize: 20, lineHeight: 26 },
  sub: { ...texto.meta },
  numeros: { flexDirection: 'row', gap: spacing.one },
  numero: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.two,
    paddingHorizontal: spacing.half,
    borderRadius: 14,
  },
  valor: { ...texto.numero },
  rotulo: { ...texto.meta, textAlign: 'center' },
});
