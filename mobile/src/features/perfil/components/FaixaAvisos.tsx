import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { texto } from '@shared/theme/typography';
import { comAlfa } from '@shared/theme/alfa';
import { apresentarAviso } from '../utils/perfil';
import type { Aviso } from '../types';

type Icone = keyof typeof MaterialCommunityIcons.glyphMap;

interface FaixaAvisosProps {
  avisos: Aviso[];
  onAbrirProblema: (id: number) => void;
  onAbrirAcao: (id: number) => void;
}

const LARGURA_BASE = 240;

export function FaixaAvisos({ avisos, onAbrirProblema, onAbrirAcao }: FaixaAvisosProps) {
  const theme = useAppTheme();
  const { width, fontScale } = useWindowDimensions();
  // Cresce com a fonte do sistema, sem passar de 85% da tela.
  const largura = Math.min(LARGURA_BASE * Math.max(1, fontScale), width * 0.85);

  return (
    <View style={styles.secao}>
      <Text accessibilityRole="header" style={[styles.titulo, { color: theme.colors.onSurface }]}>
        Metas e avisos
      </Text>

      {avisos.length === 0 ? (
        <View style={[styles.vazio, { backgroundColor: theme.colors.surfaceVariant }]}>
          <MaterialCommunityIcons name="bell-outline" size={22} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.texto, { flex: 1, color: theme.colors.onSurfaceVariant }]}>
            Quando um relato seu chegar perto da meta de apoios, ou um mutirão seu estiver para
            acontecer, o aviso aparece aqui.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={largura + spacing.two}
          decelerationRate="fast"
          contentContainerStyle={styles.faixa}
        >
          {avisos.map((aviso) => {
            const item = apresentarAviso(aviso);
            // Atenção em Barro (cor de atenção da marca); o laranja de aviso não passa 3:1.
            const cor = item.alerta ? theme.colors.secondary : theme.colors.primary;
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
                android_ripple={{ color: comAlfa(cor, 0.12) }}
                style={[
                  styles.cartao,
                  { width: largura, backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
                ]}
              >
                <View style={[styles.icone, { backgroundColor: comAlfa(cor, 0.14) }]}>
                  <MaterialCommunityIcons name={item.icone as Icone} size={20} color={cor} />
                </View>
                <Text style={[styles.cartaoTitulo, { color: theme.colors.onSurface }]}>{item.titulo}</Text>
                <Text style={[styles.texto, { color: theme.colors.onSurfaceVariant }]}>{item.texto}</Text>
                {item.progresso != null && (
                  <View style={[styles.barra, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <View
                      style={[styles.barraCheia, { width: `${item.progresso}%`, backgroundColor: cor }]}
                    />
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  secao: { gap: spacing.two, paddingTop: spacing.four },
  titulo: { ...texto.tituloSecao, paddingHorizontal: spacing.three },
  faixa: { gap: spacing.two, paddingHorizontal: spacing.three, paddingBottom: spacing.one },
  cartao: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.three,
    gap: spacing.one,
    overflow: 'hidden',
  },
  icone: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartaoTitulo: { ...texto.corpoForte },
  texto: { ...texto.meta },
  barra: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: spacing.half },
  barraCheia: { height: '100%', borderRadius: 3 },
  vazio: {
    marginHorizontal: spacing.three,
    borderRadius: 16,
    padding: spacing.three,
    flexDirection: 'row',
    gap: spacing.two,
    alignItems: 'flex-start',
  },
});
