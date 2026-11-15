import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { rotuloProblemas } from '../utils/proximidade';

interface AvisoPertoProps {
  total: number;
  raioKm: number;
}

export function AvisoPerto({ total, raioKm }: AvisoPertoProps) {
  const theme = useAppTheme();

  return (
    <View
      accessibilityRole="summary"
      style={[
        styles.aviso,
        { backgroundColor: theme.colors.primaryContainer, borderBottomColor: theme.colors.outline },
      ]}
    >
      <MaterialCommunityIcons name="crosshairs-gps" size={18} color={theme.colors.primary} />
      <Text style={[styles.texto, { color: theme.colors.onSurfaceVariant }]}>
        Perto de você agora:{' '}
        <Text style={[styles.forte, { color: theme.colors.onSurface }]}>
          {rotuloProblemas(total)}
        </Text>{' '}
        em {raioKm} km
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.one,
    paddingVertical: spacing.one,
    paddingHorizontal: spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  texto: { flex: 1, fontSize: typography.fontSize.sm },
  forte: { fontWeight: '700' },
});
