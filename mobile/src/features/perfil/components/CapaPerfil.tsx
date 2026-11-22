import { Image, StyleSheet, View } from 'react-native';
import { useAppTheme } from '@shared/hooks/useAppTheme';

interface CapaPerfilProps {
  fotos: string[];
}

const ALTURA = 150;
const DESFOQUE = 14;

export function CapaPerfil({ fotos }: CapaPerfilProps) {
  const theme = useAppTheme();
  const mosaico = fotos.slice(0, 6);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.capa, { backgroundColor: theme.colors.primaryContainer }]}
    >
      {mosaico.length > 0 && (
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  capa: { height: ALTURA, overflow: 'hidden' },
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
});
