import { useRef } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { formatMomentDate, withDatePart } from '@/utils/date';

type Props = {
  value: Date;
  onChange: (date: Date) => void;
};

function toInputValue(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// 웹에는 네이티브 날짜 선택 창이 없어 브라우저 기본 date input을 연다
export function DateField({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Pressable style={styles.field} onPress={() => inputRef.current?.showPicker()}>
      <Text style={styles.value}>{formatMomentDate(value)}</Text>
      <input
        ref={inputRef}
        type="date"
        tabIndex={-1}
        value={toInputValue(value)}
        onChange={(event) => {
          if (!event.target.value) return;
          const [year, month, day] = event.target.value.split('-').map(Number);
          onChange(withDatePart(value, year, month - 1, day));
        }}
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: 'none',
          colorScheme: 'dark',
        }}
      />
    </Pressable>
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
