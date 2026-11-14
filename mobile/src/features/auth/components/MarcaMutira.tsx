import { View, Text, StyleSheet } from 'react-native';
import { LogoMutira } from '@shared/ui/LogoMutira';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';

export function MarcaMutira() {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.selo, { backgroundColor: theme.colors.primary }]}>
        <LogoMutira tamanho={40} cor={theme.colors.onPrimary} />
      </View>
      <Text accessibilityRole="header" style={[styles.nome, { color: theme.colors.onSurface }]}>
        Mutira
      </Text>
      <Text style={[styles.slogan, { color: theme.colors.onSurfaceVariant }]}>
        Transforma ações individuais em ações coletivas.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.one, marginBottom: spacing.two },
  selo: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  nome: { fontFamily: typography.fontFamily.marca, fontSize: 32 },
  slogan: { fontSize: typography.fontSize.sm, textAlign: 'center' },
});
