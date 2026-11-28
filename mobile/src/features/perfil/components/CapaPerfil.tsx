import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { LogoMutira } from '@shared/ui/LogoMutira';
import { comAlfa } from '@shared/theme/alfa';

interface CapaPerfilProps {
  fotos: string[];
}

const ALTURA = 150;
const DESFOQUE = 14;
const PADRAO_COLUNAS = 6;
const PADRAO_LINHAS = 4;

/**
 * Capa do perfil: mosaico desfocado das fotos da pessoa. Sem fotos ainda,
 * mostra o pino tracejado do Mutira em padrão, em vez de um bloco liso.
 */
export function CapaPerfil({ fotos }: CapaPerfilProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const mosaico = fotos.slice(0, 6);
  const altura = ALTURA + insets.top;
  const corPadrao = comAlfa(theme.colors.primary, theme.dark ? 0.35 : 0.22);

  return (
    <View
      accessibilityElementsHidden
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.capa, { height: altura, backgroundColor: theme.colors.primaryContainer }]}
    >
      {mosaico.length > 0 ? (
        <View style={styles.mosaico}>
          {mosaico.map((uri, indice) => (
            <Image
              key={`${uri}-${indice}`}
              source={{ uri }}
              blurRadius={DESFOQUE}
              resizeMode="cover"
              style={[styles.foto, { width: mosaico.length < 3 ? `${100 / mosaico.length}%` : '33.34%' }]}
            />
          ))}
        </View>
      ) : (
        <View style={[styles.padrao, { paddingTop: insets.top }]}>
          {Array.from({ length: PADRAO_LINHAS * PADRAO_COLUNAS }, (_, i) => (
            <View
              key={i}
              style={[
                styles.celula,
                { transform: [{ translateX: Math.floor(i / PADRAO_COLUNAS) % 2 ? 22 : 0 }] },
              ]}
            >
              <LogoMutira tamanho={28} cor={corPadrao} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  capa: { overflow: 'hidden' },
  mosaico: {
    position: 'absolute',
    top: -24,
    right: -24,
    bottom: -24,
    left: -24,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  foto: { height: '50%', flexGrow: 1 },
  padrao: {
    position: 'absolute',
    top: -6,
    left: -12,
    right: -12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  celula: { width: `${100 / PADRAO_COLUNAS}%`, height: 44, alignItems: 'center', justifyContent: 'center' },
});
