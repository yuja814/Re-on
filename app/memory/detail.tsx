// app/memory/detail.tsx

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { BottomTabBar } from '@/components/navigation/bottom-tab-bar';

// 백엔드 API 인터페이스 정의
interface MemoryContext {
  type: 'TIME' | 'PLACE';
  label: string;
}

interface MomentItem {
  id: number;
  recordedAt: string;
  songTitle: string;
  artist: string;
  memo?: string;
  coverImageUrl?: string;
}

interface MemoryDetailData {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  momentsCount: number;
  contexts: MemoryContext[];
  moments: MomentItem[];
}

// 음파 무빙 애니메이션 컴포넌트
const AnimatedWaveBar = ({
  minHeight,
  maxHeight,
  duration,
}: {
  minHeight: number;
  maxHeight: number;
  duration: number;
}) => {
  const animHeight = useRef(new Animated.Value(minHeight)).current;

  useEffect(() => {
    const loopAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(animHeight, {
          toValue: maxHeight,
          duration: duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(animHeight, {
          toValue: minHeight,
          duration: duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
    loopAnim.start();

    return () => loopAnim.stop();
  }, [animHeight, minHeight, maxHeight, duration]);

  return <Animated.View style={[styles.waveBar, { height: animHeight }]} />;
};

export default function MemoryDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const memoryId = params.memoryId;

  const [detailData, setDetailData] = useState<MemoryDetailData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // RE:PLAY 버튼 클릭 시 모달 상태 관리
  const [isReplaying, setIsReplaying] = useState<boolean>(false);

  // GET 상세 조회 ➔ 성공 후 PATCH 읽음 처리 순차 실행
  useEffect(() => {
    if (!memoryId) return;

    const fetchDetailAndMarkRead = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // TODO: 실제 서비스 시 저장된 JWT Auth 토큰으로 교체하세요.
        const token = 'YOUR_JWT_ACCESS_TOKEN';

        // 1. GET 상세 정보 조회
        const getRes = await fetch(`http://localhost:8080/api/v1/memories/${memoryId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!getRes.ok) {
          if (getRes.status === 404) {
            throw new Error('존재하지 않거나 접근 권한이 없는 Memory입니다.');
          }
          throw new Error('Memory 상세 정보를 가져오지 못했습니다.');
        }

        const data: MemoryDetailData = await getRes.json();
        setDetailData(data);

        // 2. 상세 정보 GET 성공 후 PATCH 읽음 처리 호출 (명세서 규칙 준수)
        fetch(`http://localhost:8080/api/v1/memories/${memoryId}/read`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }).catch((patchErr) => console.error('Failed to mark as read:', patchErr));

      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.message || '데이터를 불러오는 중에 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetailAndMarkRead();
  }, [memoryId]);

  // 날짜 포맷팅 헬퍼 함수
  const formatDateRange = (start?: string, end?: string) => {
    if (!start || !end) return '';
    const fmt = (d: string) => d.replace(/-/g, '. ');
    return `${fmt(start)} ~ ${fmt(end)}`;
  };

  // ISO 날짜에서 일(DD) 추출
  const getDayStr = (isoDate: string) => {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    return String(d.getDate()).padStart(2, '0');
  };

  // ISO 날짜에서 요일(MON, TUE 등) 추출
  const getDayNameStr = (isoDate: string) => {
    if (!isoDate) return '';
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[new Date(isoDate).getDay()];
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFFC36" />
          <Text style={styles.loadingText}>Memory 상세 정보를 불러오고 있어요...</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (error || !detailData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#FF6B6B" />
          <Text style={styles.errorText}>{error || '정보를 찾을 수 없습니다.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryBtnText}>목록으로 돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // RE:PLAY용 4분할 대표 커버 이미지 (없을 경우 기본 이미지 대용)
  const mosaicCovers = detailData.moments.slice(0, 4).map(
    (m) => m.coverImageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop'
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. 상단 히어로 배너 */}
        <View style={styles.heroContainer}>
          <Image
            source={{
              uri: detailData.moments[0]?.coverImageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
            }}
            style={styles.heroImage}
          />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* 2. 상세 설명 영역 */}
        <View style={styles.descriptionSection}>
          <View style={styles.titleHeaderRow}>
            <Text style={styles.heroTitle}>{detailData.title}</Text>
            {detailData.contexts[0] && (
              <View style={styles.badgeItem}>
                <Text style={styles.badgeText}>{detailData.contexts[0].label}</Text>
              </View>
            )}
          </View>

          <View style={styles.subInfoRow}>
            <Text style={styles.heroDateText}>
              <Text style={{ fontWeight: '700' }}>{detailData.momentsCount} Moment</Text> |{' '}
              {formatDateRange(detailData.startDate, detailData.endDate)}
            </Text>
            {detailData.contexts[1] && (
              <View style={styles.badgeItem}>
                <Text style={styles.badgeText}>{detailData.contexts[1].label}</Text>
              </View>
            )}
          </View>

          <Text style={styles.albumDescription}>{detailData.description}</Text>
        </View>
{/* 3. 타임라인 영역 */}
        <View style={styles.timelineContainer}>
          {detailData.moments.map((item, idx) => {
            // 동일 날짜 항목의 경우 첫 번째 항목에만 날짜 표시
            const prevDate = idx > 0 ? getDayStr(detailData.moments[idx - 1].recordedAt) : null;
            const currentDate = getDayStr(item.recordedAt);
            const showDate = prevDate !== currentDate;

            return (
              <View key={item.id} style={styles.timelineItem}>
                {/* 좌측 날짜 표시 */}
                <View style={styles.dateContainer}>
                  {showDate ? (
                    <>
                      <Text style={styles.dateText}>{currentDate}</Text>
                      <Text style={styles.dayText}>{getDayNameStr(item.recordedAt)}</Text>
                    </>
                  ) : null}
                </View>

                {/* 우측 Moment 카드 */}
                <View style={[styles.momentCard, isReplaying && styles.dimmedCard]}>
                  <Image
                    source={{
                      uri: item.coverImageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop',
                    }}
                    style={styles.cardCoverImage}
                  />
                  <View style={styles.cardContent}>
                    <Text style={styles.songTitle}>{item.songTitle}</Text>
                    <Text style={styles.artistName}>{item.artist}</Text>
                    {item.memo ? <Text style={styles.memoText}>{item.memo}</Text> : null}
                  </View>
                </View>
              </View>
            );
          })}

          {/* 4. RE:PLAY 카드 */}
          <TouchableOpacity
            style={styles.replayCard}
            activeOpacity={0.9}
            onPress={() => setIsReplaying(!isReplaying)}
          >
            <View style={styles.replayLeft}>
              <View style={styles.mosaicGrid}>
                {mosaicCovers.map((uri, idx) => (
                  <Image key={idx} source={{ uri }} style={styles.mosaicImg} />
                ))}
              </View>
              <View style={styles.replayTextGroup}>
                <Text style={styles.replayTitle}>RE: PLAY</Text>
                <Text style={styles.replaySub}>그때 그 음악을 다시 들어보세요!</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={36} color="#464335" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 5. 음파 애니메이션 모달 */}
      {isReplaying && (
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setIsReplaying(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.waveContainer}>
              <AnimatedWaveBar minHeight={12} maxHeight={36} duration={450} />
              <AnimatedWaveBar minHeight={18} maxHeight={48} duration={350} />
              <AnimatedWaveBar minHeight={24} maxHeight={56} duration={500} />
              <AnimatedWaveBar minHeight={14} maxHeight={32} duration={400} />
              <AnimatedWaveBar minHeight={20} maxHeight={44} duration={300} />
            </View>
            <Text style={styles.modalTitle}>그때의 음악을 준비하고 있어요...</Text>
            <Text style={styles.modalSub}>잠시만 기다려주세요.</Text>
          </View>
        </TouchableOpacity>
      )}

      <BottomTabBar active="memory" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  centerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 12, 
    fontSize: 14,
    color: '#95938B' 
  },
  errorText: { 
    marginTop: 12, 
    fontSize: 14, 
    color: '#FF6B6B', 
    marginBottom: 16 
  },
  retryBtn: { 
    backgroundColor: '#1C1C1E', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 12 
  },
  retryBtnText: { 
    fontSize: 13, 
    color: '#FFFFFF' 
  },

  /* 1. Hero Image */
  heroContainer: {
    position: 'relative',
    width: '100%',
    height: 352,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 54,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* 2. Description Section */
  descriptionSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  titleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E8E8E6',
  },
  subInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroDateText: {
    fontSize: 12,
    color: '#95938B',
    letterSpacing: -0.2,
  },
  badgeItem: {
    backgroundColor: '#1c1c1e00',
    borderWidth: 1,
    borderColor: '#95938B',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 9,
    color: '#95938B',
  },
  albumDescription: {
    fontSize: 12,
    color: '#95938B',
    marginBottom: 28,
  },

  /* 3. Timeline */
  timelineContainer: {
    paddingHorizontal: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  dateContainer: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFEB',
  },

  /* Moment Card */
  momentCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFEB',
    height: 72,
    borderRadius: 16,
    padding: 4,
    alignItems: 'center',
  },
  dimmedCard: {
    backgroundColor: '#6A6A60', // 딤(Dim) 상태 스타일
  },
  cardCoverImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  cardContent: {
    flex: 1,
    marginLeft: 20,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  songTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A0801',
  },
  artistName: {
    fontSize: 12,
    color: '#95938B',
    marginTop: 1,
  },
  memoText: {
    marginTop: 5,
    fontSize: 12,
    color: '#0A0801',
  },

  /* 4. RE:PLAY Card */
  replayCard: {
    backgroundColor: '#FFFC36',
    borderRadius: 16,
    padding: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
  },
  replayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mosaicGrid: {
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginRight: 16,
  },
  mosaicImg: {
    width: '50%',
    height: '50%',
  },
  replayTextGroup: {},
  replayTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0A0801',
  },
  replaySub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#464335',
    marginTop: 2,
  },

  /* 5. Modal Sheet (Replay Active) */
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0d0b027b',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  modalSheet: {
    backgroundColor: '#FFFC36',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 48,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 57,
    width: 52.5,
    marginBottom: 20,
  },
  waveBar: {
    width: 5,
    backgroundColor: '#0A0801',
    borderRadius: 3,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0A0801',
    marginBottom: 7,
  },
  modalSub: {
    fontSize: 14,
    fontWeight: '500',
    color: '#464335',
  },
});