import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmDialog } from '@/components/moment/confirm-dialog';
import { resolveTrack } from '@/services/music';
import { createMoment } from '@/stores/moment-store';
import type { Track } from '@/types/moment';
import { startContextCollection } from '@/utils/context';

const PLACEHOLDER_COLOR = 'rgba(0, 0, 0, 0.52)';

type TrackState =
  | { status: 'loading' }
  | { status: 'loaded'; track: Track }
  | { status: 'failed' };

/** REC-01 간편 기록하기: 음악 앱에서 공유한 곡에 메모를 남겨 Moment로 저장한다 */
export default function MomentCreateScreen() {
  const router = useRouter();
  const { url } = useLocalSearchParams<{ url?: string }>();

  const [trackState, setTrackState] = useState<TrackState>({ status: 'loading' });
  const [memo, setMemo] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [discardVisible, setDiscardVisible] = useState(false);
  const contextRef = useRef<ReturnType<typeof startContextCollection> | null>(null);

  const isDirty = memo.trim().length > 0;
  const canSave = trackState.status === 'loaded' && !isSaving;

  useEffect(() => {
    let cancelled = false;

    resolveTrack(url ?? '')
      .then((track) => {
        if (!cancelled) setTrackState({ status: 'loaded', track });
      })
      .catch(() => {
        if (!cancelled) setTrackState({ status: 'failed' });
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    contextRef.current = startContextCollection();
  }, []);

  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/moment/moment');
    }
  };

  const handleClose = () => {
    if (isDirty) {
      setDiscardVisible(true);
    } else {
      close();
    }
  };

  const handleSave = async () => {
    if (trackState.status !== 'loaded' || isSaving) return;

    setIsSaving(true);
    setSaveFailed(false);
    try {
      const context = await (contextRef.current ?? startContextCollection()).collect();

      await createMoment({
        track: trackState.track,
        memo: memo.trim() || undefined,
        ...context,
      });
      close();
    } catch {
      setSaveFailed(true);
      setIsSaving(false);
    }
  };

  // Android 뒤로가기 버튼도 닫기 버튼과 동일하게 처리한다
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!isDirty) return false;
      setDiscardVisible(true);
      return true;
    });
    return () => subscription.remove();
  }, [isDirty]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen
        options={{ headerShown: false, presentation: 'modal', gestureEnabled: !isDirty }}
      />

      <View style={styles.header}>
        <Pressable
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={8}
          accessibilityLabel="닫기">
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.headerTitle}>Re:on</Text>

        <Pressable
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          hitSlop={8}
          accessibilityLabel="저장">
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="arrow-up" size={24} color="#FFFFFF" />
          )}
        </Pressable>
      </View>

      <View style={styles.content}>
        <TrackCard state={trackState} />

        <TextInput
          style={styles.memoInput}
          value={memo}
          onChangeText={setMemo}
          placeholder="짧은 한 줄 기록..."
          placeholderTextColor={PLACEHOLDER_COLOR}
          autoFocus
          returnKeyType="done"
          maxLength={2000}
          editable={!isSaving}
        />

        {trackState.status === 'failed' ? (
          <Text style={styles.errorText}>
            곡 정보를 불러오지 못했어요. 음악 앱에서 다시 공유해주세요.
          </Text>
        ) : null}
        {saveFailed ? (
          <Text style={styles.errorText}>저장하지 못했어요. 다시 시도해주세요.</Text>
        ) : null}
      </View>

      <ConfirmDialog
        visible={discardVisible}
        title="작성 중인 내용을 버릴까요?"
        cancelLabel="계속 편집하기"
        confirmLabel="삭제하기"
        onCancel={() => setDiscardVisible(false)}
        onConfirm={() => {
          setDiscardVisible(false);
          close();
        }}
      />
    </SafeAreaView>
  );
}

function TrackCard({ state }: { state: TrackState }) {
  if (state.status === 'loaded') {
    return (
      <View style={styles.trackCard}>
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {state.track.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {state.track.artist}
          </Text>
        </View>
        <Image source={{ uri: state.track.albumCoverUrl }} style={styles.albumCover} />
      </View>
    );
  }

  return (
    <View style={[styles.trackCard, styles.trackCardPlaceholder]}>
      {state.status === 'loading' ? (
        <ActivityIndicator size="small" color="#0A0801" />
      ) : (
        <Ionicons name="musical-notes-outline" size={22} color="#0A0801" />
      )}
    </View>
  );
}

// 값은 Figma wireframe '간편 기록하기'(7:70)와 REC-01 음악 기록 작성 화면을 따른다
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3A3A3C',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0091FF',
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },

  /* Content */
  content: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 25,
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 71,
    paddingLeft: 18,
    paddingRight: 12,
    borderRadius: 20,
    backgroundColor: '#FFE680',
  },
  trackCardPlaceholder: {
    justifyContent: 'center',
  },
  trackInfo: {
    flex: 1,
    gap: 4,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  trackArtist: {
    fontSize: 14,
    color: '#000000',
  },
  albumCover: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#E8E8E6',
  },
  memoInput: {
    height: 42,
    marginTop: 30,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#FFF3BF',
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  errorText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '500',
    color: '#FF453A',
  },
});
