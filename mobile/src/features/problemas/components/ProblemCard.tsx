import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { getCausa } from '../map/markerConfig';
import type { Problema } from '../types';

interface ProblemCardProps {
  problema: Problema;
  onPress: (id: number) => void;
}

export function ProblemCard({ problema, onPress }: ProblemCardProps) {
  const theme = useAppTheme();
  const causa = getCausa(problema.causa_id);

  return (
    <Card onPress={() => onPress(problema.id)} style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: causa.cor }]}>
        <MaterialCommunityIcons
          name={causa.icone as keyof typeof MaterialCommunityIcons.glyphMap}
          size={22}
          color="#FFFFFF"
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.titulo, { color: theme.colors.onSurface }]} numberOfLines={1}>
          {problema.titulo}
        </Text>
        {problema.local_nome && (
          <Text style={[styles.local, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
            {problema.local_nome}
          </Text>
        )}
        <View style={styles.footer}>
          <Text style={[styles.causa, { color: causa.cor }]}>{causa.nome}</Text>
          <View style={styles.apoio}>
            <MaterialCommunityIcons name="account-group" size={14} color={theme.colors.primary} />
            <Text style={[styles.apoioText, { color: theme.colors.onSurfaceVariant }]}>
              {problema.cont_apoios}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.three, padding: spacing.three },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontSize: typography.fontSize.base, fontWeight: '700' },
  local: { fontSize: typography.fontSize.xs },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.three, marginTop: spacing.one },
  causa: { fontSize: typography.fontSize.xs, fontWeight: '700' },
  apoio: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  apoioText: { fontSize: typography.fontSize.xs },
});
