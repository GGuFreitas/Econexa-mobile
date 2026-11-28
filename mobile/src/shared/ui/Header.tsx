import type { ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { texto, ALVO_MINIMO } from '@shared/theme/typography';
import { comAlfa } from '@shared/theme/alfa';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  /** Ações à direita (ex.: menu ⋮). Cada uma deve ter alvo de 48. */
  acoes?: ReactNode;
}

const ALTURA = 64;

/** Barra de topo de ponta a ponta. Cuida da área segura do topo. */
export function Header({ title, onBack, acoes }: HeaderProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const toque = comAlfa(theme.colors.onPrimary, 0.16);

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: theme.colors.primary,
      }}
    >
      <View
        style={{
          minHeight: ALTURA,
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: onBack ? spacing.half : spacing.three,
          paddingRight: spacing.half,
          gap: spacing.half,
        }}
      >
        {onBack && (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            android_ripple={{ color: toque, borderless: true, radius: 24 }}
            style={({ pressed }) => ({
              width: ALVO_MINIMO,
              height: ALVO_MINIMO,
              borderRadius: ALVO_MINIMO / 2,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? toque : 'transparent',
            })}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onPrimary} />
          </Pressable>
        )}
        <Text
          accessibilityRole="header"
          numberOfLines={2}
          style={{ ...texto.titulo, fontSize: 20, flex: 1, color: theme.colors.onPrimary }}
        >
          {title}
        </Text>
        {acoes}
      </View>
    </View>
  );
}
