import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { apresentarAviso, comAlfa } from '../utils/perfil';
import type { Aviso } from '../types';

type Icone = keyof typeof MaterialCommunityIcons.glyphMap;

interface FaixaAvisosProps {
  avisos: Aviso[];
  onAbrirProblema: (id: number) => void;
  onAbrirAcao: (id: number) => void;
}

const LARGURA = 230;

export function FaixaAvisos({ avisos, onAbrirProblema, onAbrirAcao }: FaixaAvisosProps) {
  const theme = useAppTheme();
  const sombra = { shadowColor: theme.colors.shadow };

  return (
    <View>
      <Text style={[styles.secao, { color: theme.colors.onSurfaceVariant }]}>Metas e avisos</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={LARGURA + spacing.two}
        decelerationRate="fast"
        contentContainerStyle={styles.faixa}
      >
        {avisos.length === 0 && (
          <View style={[styles.vazio, { borderColor: theme.colors.outline }]}>
            <MaterialCommunityIcons name="bell-outline" size={20} color={theme.colors.textTertiary} />
            <Text style={[styles.texto, { color: theme.colors.onSurfaceVariant }]}>
              Quando um relato seu chegar perto da meta ou uma ação sua estiver chegando, o aviso
              aparece aqui.
            </Text>
          </View>
        )}

        {avisos.map((aviso) => {
          const item = apresentarAviso(aviso);
          const cor = item.alerta ? theme.colors.warning : theme.colors.primary;
          const abrir = () =>
            aviso.tipo === 'acao_proxima'
              ? onAbrirAcao(aviso.mobilizacao_id)
              : onAbrirProblema(aviso.problema_id);

          return (
            <Pressable
              key={item.chave}
              onPress={abrir}
              accessibilityRole="button"
              accessibilityLabel={`${item.titulo}. ${item.texto}`}
              style={[styles.cartao, sombra, { backgroundColor: theme.colors.surface }]}
            >
              <View style={[styles.icone, { backgroundColor: comAlfa(cor, 0.14) }]}>
                <MaterialCommunityIcons name={item.icone as Icone} size={18} color={cor} />
              </View>
              <Text style={[styles.titulo, { color: theme.colors.onSurface }]}>{item.titulo}</Text>
              <Text style={[styles.texto, { color: theme.colors.onSurfaceVariant }]} numberOfLines={3}>
                {item.texto}
              </Text>
              {item.progresso != null && (
                <View style={[styles.barra, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <View
                    style={[
                      styles.barraCheia,
                      { width: `${item.progresso}%`, backgroundColor: theme.colors.primary },
                    ]}
                  />
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  secao: {
    fontSize: typography.fontSize.xs + 0.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: spacing.three - 2,
    paddingTop: spacing.three,
    paddingBottom: spacing.one - 2,
  },
  faixa: { gap: spacing.two, paddingHorizontal: spacing.two, paddingBottom: spacing.one },
  cartao: {
    width: LARGURA,
    borderRadius: 14,
    padding: spacing.two,
    gap: 6,
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  icone: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontSize: typography.fontSize.base - 0.5, fontWeight: '700' },
  texto: { fontSize: typography.fontSize.sm - 0.5, lineHeight: 17 },
  barra: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 2 },
  barraCheia: { height: '100%', borderRadius: 3 },
  vazio: {
    width: LARGURA + 60,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: spacing.two,
    gap: 6,
  },
});
