import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { type ComponentProps, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SongInfoCard } from '@/components/moment/song-info-card';
import { BottomTabBar } from '@/components/navigation/bottom-tab-bar';
import { ApiError } from '@/services/api-client';
import { loadMoment, useMoment } from '@/stores/moment-store';
import { formatMomentDate } from '@/utils/date';

type InfoRowProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  text?: string;
};

// 값이 없어도 항목은 빈칸으로 남겨둔다
function InfoRow({ icon, text }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color="#E8E8E6" />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

export default function MomentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const moment = useMoment(id);
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'notFound' | 'failed'>(
    'loading',
  );

  // 목록에서 넘어왔으면 먼저 보여주고, 위치까지 담긴 상세 정보로 채운다
  const load = useCallback(() => {
    if (!id) return;
    loadMoment(id)
      .then(() => setLoadState('loaded'))
      .catch((error) => {
        setLoadState(error instanceof ApiError && error.status === 404 ? 'notFound' : 'failed');
      });
  }, [id]);

  useEffect(load, [load]);

  const retry = () => {
    setLoadState('loading');
    load();
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/moment/moment');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={goBack} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
        </Pressable>

        {moment && loadState !== 'notFound' ? (
          <Pressable
            style={styles.editButton}
            onPress={() =>
              router.push({ pathname: '/moment/edit/[id]', params: { id: moment.id } })
            }
            hitSlop={8}>
            <Text style={styles.editButtonText}>편집</Text>
          </Pressable>
        ) : null}
      </View>

      {moment && loadState !== 'notFound' ? (
        <ScrollView contentContainerStyle={styles.content}>
          <SongInfoCard track={moment.track} />

          <View style={styles.infoList}>
            <InfoRow icon="calendar-outline" text={formatMomentDate(new Date(moment.createdAt))} />
            <InfoRow icon="location-sharp" text={moment.location} />
            <InfoRow icon="pencil-outline" text={moment.memo} />
          </View>
        </ScrollView>
      ) : (
        <View style={styles.notFound}>
          {loadState === 'loading' ? (
            <ActivityIndicator color="#E8E8E6" />
          ) : loadState === 'failed' ? (
            <Pressable onPress={retry} hitSlop={8}>
              <Text style={styles.notFoundText}>기록을 불러오지 못했어요. 눌러서 다시 시도</Text>
            </Pressable>
          ) : (
            <Text style={styles.notFoundText}>기록을 찾을 수 없어요.</Text>
          )}
        </View>
      )}
      <BottomTabBar active="moment" />
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
  editButton: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    justifyContent: 'center',
    backgroundColor: '#8F8E89',
  },
  editButtonText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#1A1A1A',
  },

  /* Content */
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  infoList: {
    paddingHorizontal: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
    minHeight: 47,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#464335',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: -1,
    color: '#E8E8E6',
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
