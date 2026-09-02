import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';

interface TabProps {
  label: string;
  icon: string;
  badge?: number;
}

interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactElement<TabProps>[];
  style?: any;
}

export function Tabs({ value, onChange, children, style }: TabsProps) {
  const theme = useAppTheme();
  const tabs = children.map((child) => child.props);

  return (
    <View style={[styles.container, style]}>
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.tab,
            value === tab.label ? styles.tabActive : {},
            { borderBottomColor: value === tab.label ? theme.colors.primary : 'transparent' },
          ]}
          onPress={() => onChange(tab.label)}
        >
          <View style={styles.tabContent}>
            <Text style={[
              styles.tabLabel,
              value === tab.label ? styles.tabLabelActive : {},
              { color: value === tab.label ? theme.colors.primary : theme.colors.textSecondary },
            ]}>
              {tab.label}
            </Text>
            {tab.badge && tab.badge > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
                <Text style={styles.badgeText}>{tab.badge > 99 ? '99+' : tab.badge}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

interface TabProps2 {
  label: string;
  icon: string;
  badge?: number;
}

export function Tab({ label, icon, badge }: TabProps2) {
  return null; // Rendered by Tabs
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E6EC',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {},
  tabContent: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tabLabel: { fontSize: 14, fontWeight: '600' },
  tabLabelActive: { fontWeight: '700' },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
});