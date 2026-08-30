import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';

interface SelectOption {
  label: string;
  value: string | number;
}

interface SelectProps {
  label?: string;
  value: string | number;
  onValueChange: (value: string | number) => void;
  options: SelectOption[];
}

export function Select({ label, value, onValueChange, options }: SelectProps) {
  const theme = useAppTheme();
  const [selected, setSelected] = useState(value);

  useEffect(() => {
    setSelected(value);
  }, [value]);

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>}
      <View
        style={[
          styles.pickerWrapper,
          { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface },
        ]}
      >
        <Picker
          selectedValue={selected}
          dropdownIconColor={theme.colors.textSecondary}
          onValueChange={(next) => {
            setSelected(next);
            onValueChange(next);
          }}
          style={{ color: theme.colors.text }}
        >
          {options.map((option) => (
            <Picker.Item
              key={String(option.value)}
              label={option.label}
              value={option.value}
              color={theme.colors.text}
            />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.four },
  label: { marginBottom: spacing.two, fontSize: typography.fontSize.sm },
  pickerWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
