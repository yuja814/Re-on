import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { formatMomentDate, withDatePart } from '@/utils/date';

type Props = {
  value: Date;
  onChange: (date: Date) => void;
};

export function DateField({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const handleChange = (selected: Date) => {
    onChange(withDatePart(value, selected.getFullYear(), selected.getMonth(), selected.getDate()));
  };

  return (
    <>
      <Pressable style={styles.field} onPress={() => setOpen((prev) => !prev)}>
        <Text style={styles.value}>{formatMomentDate(value)}</Text>
      </Pressable>

      {open && Platform.OS === 'ios' ? (
        <DateTimePicker
          value={value}
          mode="date"
          display="inline"
          themeVariant="dark"
          onValueChange={(_, selected) => handleChange(selected)}
        />
      ) : null}

      {/* Android는 렌더링되는 동안 시스템 날짜 선택 창이 열린다 */}
      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={value}
          mode="date"
          onValueChange={(_, selected) => {
            setOpen(false);
            handleChange(selected);
          }}
          onDismiss={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 51,
    justifyContent: 'center',
  },
  value: {
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: -0.43,
    color: '#FFFFFF',
  },
});
