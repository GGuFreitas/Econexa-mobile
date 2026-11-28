import type { ReactElement } from 'react';
import { View, Text, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { texto, ALVO_MINIMO } from '@shared/theme/typography';

type Icone = keyof typeof MaterialCommunityIcons.glyphMap;

interface TabProps {
  label: string;
  icon?: Icone;
  /** Contagem mostrada ao lado do rótulo (ex.: 3 mobilizações). */
  badge?: number;
}

interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactElement<TabProps>[];
  style?: StyleProp<ViewStyle>;
}

/** Abas de ponta a ponta, no padrão Material: sublinhado na ativa, 48 de altura. */
export function Tabs({ value, onChange, children, style }: TabsProps) {
  const theme = useAppTheme();
  const tabs = children.map((child) => child.props);

  return (
    <View
      accessibilityRole="tablist"
      style={[
        {
          flexDirection: 'row',
          borderBottomWidth: 1,
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.outline,
        },
        style,
      ]}
    >
      {tabs.map((tab) => {
        const ativa = value === tab.label;
        const cor = ativa ? theme.colors.primary : theme.colors.onSurfaceVariant;
        const temBadge = tab.badge != null && tab.badge > 0;
        const rotuloLeitor = temBadge ? `${tab.label}, ${tab.badge}` : tab.label;

        return (
          <Pressable
            key={tab.label}
            onPress={() => onChange(tab.label)}
            accessibilityRole="tab"
            accessibilityLabel={rotuloLeitor}
            accessibilityState={{ selected: ativa }}
            android_ripple={{ color: theme.colors.primaryContainer }}
            style={{
              flex: 1,
              minHeight: ALVO_MINIMO,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: spacing.half + 2,
              paddingHorizontal: spacing.one,
              borderBottomWidth: 3,
              borderBottomColor: ativa ? theme.colors.primary : 'transparent',
            }}
          >
            {tab.icon && <MaterialCommunityIcons name={tab.icon} size={18} color={cor} />}
            <Text numberOfLines={1} style={{ ...texto.rotulo, fontSize: 14, color: cor, fontWeight: ativa ? '700' : '600' }}>
              {tab.label}
            </Text>
            {temBadge && (
              <View
                style={{
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  paddingHorizontal: 5,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: ativa ? theme.colors.primary : theme.colors.surfaceVariant,
                }}
              >
                <Text style={{ ...texto.rotulo, fontSize: 13, lineHeight: 16, color: ativa ? theme.colors.onPrimary : theme.colors.onSurface }}>
                  {tab.badge! > 99 ? '99+' : tab.badge}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Só declara a aba; quem desenha é `Tabs`. */
export function Tab(_props: TabProps) {
  return null;
}
