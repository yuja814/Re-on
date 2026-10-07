import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DateField } from '@/components/moment/date-field';
import { DiscardDialog } from '@/components/moment/discard-dialog';
import { SongInfoCard } from '@/components/moment/song-info-card';
import { updateMoment, useMoment } from '@/stores/moment-store';
import type { Moment } from '@/types/moment';

const PLACEHOLDER_COLOR = 'rgba(235, 235, 245, 0.3)';

export default function MomentEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const moment = useMoment(id);

  if (!moment) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>기록을 찾을 수 없어요.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return <MomentEditForm moment={moment} />;
}

function MomentEditForm({ moment }: { moment: Moment }) {
  const router = useRouter();

  const [date, setDate] = useState(() => new Date(moment.createdAt));
  const [location, setLocation] = useState(moment.location ?? '');
  const [memo, setMemo] = useState(moment.memo ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [discardVisible, setDiscardVisible] = useState(false);

  const isDirty =
    date.getTime() !== new Date(moment.createdAt).getTime() ||
    location !== (moment.location ?? '') ||
    memo !== (moment.memo ?? '');

  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({ pathname: '/moment/[id]', params: { id: moment.id } });
    }
  };

  const handleBack = () => {
    if (isDirty) {
      setDiscardVisible(true);
    } else {
      close();
    }
  };

  const handleDone = async () => {
    if (!isDirty) {
      close();
      return;
    }

    setIsSaving(true);
    setSaveFailed(false);
    try {
      await updateMoment(moment.id, {
        createdAt: date.toISOString(),
        location: location.trim() || undefined,
        memo: memo.trim() || undefined,
      });
      close();
    } catch {
      setSaveFailed(true);
      setIsSaving(false);
    }
  };

  // Android 뒤로가기 버튼도 화면의 뒤로가기와 동일하게 처리한다
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!isDirty) return false;
      setDiscardVisible(true);
      return true;
    });
    return () => subscription.remove();
  }, [isDirty]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: !isDirty }} />

      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
        </Pressable>

        <Pressable
          style={[styles.doneButton, isSaving && styles.doneButtonDisabled]}
          onPress={handleDone}
          disabled={isSaving}
          hitSlop={8}>
          <Text style={styles.doneButtonText}>완료</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        <View style={styles.panel}>
          <SongInfoCard track={moment.track} />

          <View style={styles.fields}>
            <View style={styles.fieldRow}>
              <DateField value={date} onChange={setDate} />
            </View>

            <View style={styles.fieldRow}>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="위치"
                placeholderTextColor={PLACEHOLDER_COLOR}
              />
            </View>

            <View style={styles.fieldRow}>
              <TextInput
                style={[styles.input, styles.memoInput]}
                value={memo}
                onChangeText={setMemo}
                placeholder="메모"
                placeholderTextColor={PLACEHOLDER_COLOR}
                multiline
                scrollEnabled={false}
              />
            </View>

            {saveFailed ? (
              <Text style={styles.errorText}>저장하지 못했어요. 다시 시도해주세요.</Text>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <DiscardDialog
        visible={discardVisible}
        onKeepEditing={() => setDiscardVisible(false)}
        onDiscard={() => {
          setDiscardVisible(false);
          close();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0B02',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#8F8E89',
  },
  doneButton: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    justifyContent: 'center',
    backgroundColor: '#8F8E89',
  },
  doneButtonDisabled: {
    opacity: 0.4,
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#1A1A1A',
  },

  /* Form */
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  panel: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: '#1C1C1E',
  },
  fields: {
    marginTop: 24,
  },
  fieldRow: {
    borderTopWidth: 1,
    borderTopColor: '#38383A',
  },
  input: {
    minHeight: 51,
    paddingVertical: 15,
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: -0.43,
    color: '#FFFFFF',
  },
  memoInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FF453A',
    marginTop: 4,
  },

  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E8E8E6',
  },
});
