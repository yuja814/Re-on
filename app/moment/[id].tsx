import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SongInfoCard } from '@/components/moment/song-info-card';
import { MOCK_MOMENTS } from '@/mocks/moments';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function formatDate(iso: string) {
  const date = new Date(iso);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}. ${month}. ${day}. (${WEEKDAYS[date.getDay()]})`;
}

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
  const moment = MOCK_MOMENTS.find((item) => item.id === id);

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

        {moment ? (
          // TODO: Moment 수정 화면(MO-03) 연결
          <Pressable style={styles.editButton} hitSlop={8}>
            <Text style={styles.editButtonText}>편집</Text>
          </Pressable>
        ) : null}
      </View>

      {moment ? (
        <ScrollView contentContainerStyle={styles.content}>
          <SongInfoCard track={moment.track} />

          <View style={styles.infoList}>
            <InfoRow icon="calendar-outline" text={formatDate(moment.createdAt)} />
            <InfoRow icon="location-sharp" text={moment.location} />
            <InfoRow icon="pencil-outline" text={moment.memo} />
          </View>
        </ScrollView>
      ) : (
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>기록을 찾을 수 없어요.</Text>
        </View>
      )}
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
