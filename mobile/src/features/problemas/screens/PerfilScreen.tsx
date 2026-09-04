import { useSelector } from 'react-redux';
import { View, Text, StyleSheet } from 'react-native';
import { Header, ScreenWrapper, Card, LoadingSpinner } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import type { User } from '@store/authSlice';
import { useEstatisticas } from '../hooks';
import { useLocalizacao } from '@shared/hooks/useLocalizacao';

const ROLE_LABEL: Record<string, string> = {
  citizen: 'Cidadão',
  specialist: 'Especialista',
  admin: 'Moderação',
};

const RAIO_PERFIL_METROS = 8000;

export function PerfilScreen() {
  const theme = useAppTheme();
  const user = useSelector((state: { auth: { user: User | null } }) => state.auth.user);
  const { coordenada } = useLocalizacao();
  const { data: estatisticas } = useEstatisticas({
    lat: coordenada?.latitude,
    lng: coordenada?.longitude,
    raio: RAIO_PERFIL_METROS,
    status: 'ativo',
  });

  if (!user) return <LoadingSpinner />;

  return (
    <ScreenWrapper>
      <Header title="Perfil" />
      <Card style={styles.card}>
        <Text style={[styles.nome, { color: theme.colors.onSurface }]}>{user.name}</Text>
        <Text style={[styles.email, { color: theme.colors.onSurfaceVariant }]}>{user.email}</Text>
        <Text style={[styles.role, { color: theme.colors.primary }]}>
          {ROLE_LABEL[user.role] ?? user.role}
        </Text>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.section, { color: theme.colors.onSurfaceVariant }]}>
          Na sua região
        </Text>
        {estatisticas ? (
          <View style={styles.metricRow}>
            <Text style={[styles.metric, { color: theme.colors.onSurface }]}>
              {estatisticas.total}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
              problemas ativos num raio de {RAIO_PERFIL_METROS / 1000} km
            </Text>
          </View>
        ) : (
          <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
            Carregando os números da sua região.
          </Text>
        )}
      </Card>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.four, gap: spacing.two, marginBottom: spacing.three },
  nome: { fontSize: typography.fontSize.xl, fontWeight: '700' },
  email: { fontSize: typography.fontSize.sm },
  role: { fontSize: typography.fontSize.sm, fontWeight: '700' },
  section: { fontSize: typography.fontSize.sm, fontWeight: '700' },
  metricRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.two },
  metric: { fontSize: typography.fontSize.title, fontWeight: '800' },
  metricLabel: { fontSize: typography.fontSize.sm, flexShrink: 1 },
});
