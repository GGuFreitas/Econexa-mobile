import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { texto } from '@shared/theme/typography';
import { ETAPAS_STATUS, iconeStatus, rotuloStatus } from '../utils/status';
import type { ProblemaStatus } from '../types';

type Icone = keyof typeof MaterialCommunityIcons.glyphMap;

interface TrilhaStatusProps {
  status: ProblemaStatus;
}

/**
 * O caminho do problema até o resultado: Ativo → Em análise → Encaminhado → Resolvido.
 * Cada etapa tem ícone e nome; a atual fica em Barro e em negrito (nunca só cor).
 */
export function TrilhaStatus({ status }: TrilhaStatusProps) {
  const theme = useAppTheme();

  if (status === 'removido') {
    return (
      <View
        accessibilityRole="alert"
        style={[styles.removido, { backgroundColor: theme.colors.surfaceVariant }]}
      >
        <MaterialCommunityIcons name="close-circle-outline" size={20} color={theme.colors.error} />
        <Text style={[styles.removidoTexto, { color: theme.colors.onSurface }]}>
          Este problema foi removido pela moderação.
        </Text>
      </View>
    );
  }

  const atual = Math.max(0, ETAPAS_STATUS.indexOf(status));
  const resumo = `Status: ${rotuloStatus(status)}, etapa ${atual + 1} de ${ETAPAS_STATUS.length}.`;

  return (
    <View accessible accessibilityRole="summary" accessibilityLabel={resumo} style={styles.trilha}>
      {ETAPAS_STATUS.map((etapa, i) => {
        const feita = i < atual;
        const ehAtual = i === atual;
        const fundo = ehAtual
          ? theme.colors.secondary
          : feita
            ? theme.colors.primaryContainer
            : theme.colors.surfaceVariant;
        const corIcone = ehAtual
          ? theme.colors.onSecondary
          : feita
            ? theme.colors.onPrimaryContainer
            : theme.colors.onSurfaceVariant;
        const corLinha = i < atual ? theme.colors.primary : theme.colors.outline;

        return (
          <Fragment key={etapa}>
            {i > 0 && <View style={[styles.linha, { backgroundColor: corLinha }]} />}
            <View style={styles.etapa}>
              <View style={[styles.circulo, { backgroundColor: fundo }]}>
                <MaterialCommunityIcons
                  name={(feita ? 'check' : iconeStatus(etapa)) as Icone}
                  size={18}
                  color={corIcone}
                />
              </View>
              <Text
                style={[
                  styles.rotulo,
                  {
                    color: ehAtual ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
                    fontWeight: ehAtual ? '700' : '400',
                  },
                ]}
              >
                {rotuloStatus(etapa)}
              </Text>
            </View>
          </Fragment>
        );
      })}
    </View>
  );
}

const CIRCULO = 36;

const styles = StyleSheet.create({
  trilha: { flexDirection: 'row', alignItems: 'flex-start' },
  etapa: { width: 72, alignItems: 'center', gap: spacing.half + 2 },
  circulo: { width: CIRCULO, height: CIRCULO, borderRadius: CIRCULO / 2, alignItems: 'center', justifyContent: 'center' },
  linha: { flex: 1, height: 2, marginTop: CIRCULO / 2 - 1, marginHorizontal: -18 },
  rotulo: { ...texto.meta, textAlign: 'center' },
  removido: { flexDirection: 'row', alignItems: 'center', gap: spacing.one, padding: spacing.three, borderRadius: 16 },
  removidoTexto: { ...texto.corpo, flex: 1 },
});
