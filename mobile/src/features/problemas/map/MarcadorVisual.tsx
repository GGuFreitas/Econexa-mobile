import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { corDaCausa } from '@shared/theme/theme';
import { texto } from '@shared/theme/typography';
import { getCausa } from './markerConfig';
import { markerSizeByPriority, mapShadow } from './mapTheme';
import { iconeStatus, rotuloStatus } from '../utils/status';
import type { Problema } from '../types';

type Icone = keyof typeof MaterialCommunityIcons.glyphMap;

interface MarcadorVisualProps {
  problema: Problema;
}

/** Nome do marcador para leitor de tela: categoria, título, apoios e status. */
export function rotuloDoMarcador(problema: Problema): string {
  const causa = getCausa(problema.causa_id);
  const apoios = problema.cont_apoios === 1 ? '1 apoio' : `${problema.cont_apoios} apoios`;
  return `${causa.nome}: ${problema.titulo}. ${apoios}. ${rotuloStatus(problema.status)}.`;
}

/**
 * Gramática do marcador (sem depender do mapa nativo; usado no nativo e na web):
 * ícone + cor = categoria · tamanho = prioridade · número = apoios ·
 * selo com ícone = status (só quando sai de "ativo"; nunca só cor).
 */
export function MarcadorVisual({ problema }: MarcadorVisualProps) {
  const theme = useAppTheme();
  const causa = getCausa(problema.causa_id);
  const cor = corDaCausa(theme, problema.causa_id);
  const size = markerSizeByPriority[causa.priority];
  const temApoio = problema.cont_apoios > 0;
  const mostraStatus = problema.status !== 'ativo';

  return (
    <View accessible accessibilityLabel={rotuloDoMarcador(problema)} style={styles.wrapper}>
      <View
        style={[
          styles.bubble,
          {
            width: size,
            height: size,
            backgroundColor: cor.cor,
            borderRadius: size / 2,
            borderColor: theme.colors.surface,
            ...mapShadow,
            shadowColor: theme.colors.shadow,
          },
        ]}
      >
        <MaterialCommunityIcons name={causa.icone as Icone} size={size * 0.52} color={cor.sobre} />
      </View>
      {temApoio && (
        <View style={[styles.apoios, { backgroundColor: theme.colors.surface, borderColor: cor.cor }]}>
          <Text style={[styles.apoiosTexto, { color: theme.colors.onSurface }]}>{problema.cont_apoios}</Text>
        </View>
      )}
      {mostraStatus && (
        <View style={[styles.status, { backgroundColor: theme.colors.primary, borderColor: theme.colors.surface }]}>
          <MaterialCommunityIcons name={iconeStatus(problema.status) as Icone} size={12} color={theme.colors.onPrimary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center', padding: 8 },
  bubble: { alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  apoios: {
    position: 'absolute',
    top: 0,
    right: -2,
    minWidth: 22,
    borderRadius: 11,
    borderWidth: 2,
    paddingHorizontal: 5,
    alignItems: 'center',
  },
  apoiosTexto: { ...texto.rotulo, fontSize: 13, lineHeight: 16 },
  status: {
    position: 'absolute',
    bottom: 2,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
