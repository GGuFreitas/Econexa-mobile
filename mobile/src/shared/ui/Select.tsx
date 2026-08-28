import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export function Select({
  label,
  value,
  onValueChange,
  options,
}) {
  const [selectedValue, setSelectedValue] = useState(value);

  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ marginBottom: 8, color: '#334155' }}>{label}</Text>
      <View
        style={{
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#cbd5e1',
          overflow: 'hidden',
        }}
      >
        <Picker
          selectedValue={selectedValue}
          onValueChange={(nextValue) => {
            setSelectedValue(nextValue);
            onValueChange(nextValue as string | number);
          }}
        >
          {options.map((option) => (
            <Picker.Item key={String(option.value)} label={option.label} value={option.value} />
          ))}
        </Picker>
      </View>
    </View>
  );
}
