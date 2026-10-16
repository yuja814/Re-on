// app/memory/detail.tsx

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
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

// 개별 음파 무빙 애니메이션 컴포넌트
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
    // 위아래 반복 애니메이션 실행
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
  // RE:PLAY 버튼 클릭 시 모달 상태 관리
  const [isReplaying, setIsReplaying] = useState(false);

  // 타임라인 데이터
  const momentList = [
    {
      id: '1',
      date: '07',
      day: 'MON',
      showDate: true,
      songTitle: 'Blingy',
      artist: 'NCT 127',
      memo: '밸런스는 좋은데 여백이 많아',
      coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: '2',
      date: '07',
      day: 'MON',
      showDate: false,
      songTitle: 'Blingy',
      artist: 'NCT 127',
      memo: '밸런스는 좋은데 여백이 많아',
      coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: '3',
      date: '07',
      day: 'MON',
      showDate: true,
      songTitle: 'Blingy',
      artist: 'NCT 127',
      memo: '밸런스는 좋은데 여백이 많아',
      coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: '4',
      date: '07',
      day: 'MON',
      showDate: false,
      songTitle: 'Blingy',
      artist: 'NCT 127',
      memo: '밸런스는 좋은데 여백이 많아',
      coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: '5',
      date: '07',
      day: 'MON',
      showDate: true,
      songTitle: 'Blingy',
      artist: 'NCT 127',
      memo: '밸런스는 좋은데 여백이 많아',
      coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* 메인 스크롤 영역 */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. 상단 히어로 배너 영역 */}
        <View style={styles.heroContainer}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
            }}
            style={styles.heroImage}
          />
          {/* 동그란 뒤로가기 버튼 */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* 2. 앨범 타이틀 및 상세 정보 영역 */}
        <View style={styles.descriptionSection}>
          <View style={styles.titleHeaderRow}>
            <Text style={styles.heroTitle}>NCT127과 함께한 7월</Text>
            <View style={styles.badgeItem}>
              <Text style={styles.badgeText}>🌙 저녁 62%</Text>
            </View>
          </View>

          <View style={styles.subInfoRow}>
            <Text style={styles.heroDateText}>
              <Text style={{ fontWeight: '700' }}>13 Moment</Text> | 2026. 07. 03. ~ 2026. 07. 21.
            </Text>
            <View style={styles.badgeItem}>
              <Text style={styles.badgeText}>📍 체조경기장</Text>
            </View>
          </View>

          <Text style={styles.albumDescription}>
            7월에는 NCT127의 음악을 많이 남겼어요. 특히 저녁 시간과 체조경기장을 중심으로 기록이 이어졌고, 메모에서도 ‘공연’, ‘집 가는 길’처럼 비슷한 순간들이 반복해서 나타났어요.
          </Text>
        </View>

        {/* 3. 타임라인 리스트 영역 */}
        <View style={styles.timelineContainer}>
          {momentList.map((item) => (
            <View key={item.id} style={styles.timelineItem}>
              {/* 좌측 날짜 영역 */}
              <View style={styles.dateContainer}>
                {item.showDate ? (
                  <>
                    <Text style={styles.dateText}>{item.date}</Text>
                    <Text style={styles.dayText}>{item.day}</Text>
                  </>
                ) : null}
              </View>

              {/* 우측 Moment 카드 (isReplaying 시 딤 처리) */}
              <View style={[styles.momentCard, isReplaying && styles.dimmedCard]}>
                <Image source={{ uri: item.coverImage }} style={styles.cardCoverImage} />
                <View style={styles.cardContent}>
                  <Text style={styles.songTitle}>{item.songTitle}</Text>
                  <Text style={styles.artistName}>{item.artist}</Text>
                  <Text style={styles.memoText}>{item.memo}</Text>
                </View>
              </View>
            </View>
          ))}

          {/* 4. RE:PLAY 카드 */}
          <TouchableOpacity
            style={styles.replayCard}
            activeOpacity={0.9}
            onPress={() => setIsReplaying(!isReplaying)}
          >
            <View style={styles.replayLeft}>
              {/* 4분할 앨범 커버 모자이크 */}
              <View style={styles.mosaicGrid}>
                <Image source={{ uri: momentList[0].coverImage }} style={styles.mosaicImg} />
                <Image source={{ uri: momentList[1].coverImage }} style={styles.mosaicImg} />
                <Image source={{ uri: momentList[2].coverImage }} style={styles.mosaicImg} />
                <Image source={{ uri: momentList[3].coverImage }} style={styles.mosaicImg} />
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

      {/* 5. 리플레이 클릭 시 하단 플레이어 준비 모달 */}
      {isReplaying && (
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setIsReplaying(false)}
        >
          <View style={styles.modalSheet}>
            {/* 음파 그래프 무빙 애니메이션 */}
            <View style={styles.waveContainer}>
              <AnimatedWaveBar minHeight={12} maxHeight={36} duration={450} />
              <AnimatedWaveBar minHeight={18} maxHeight={48} duration={350} />
              <AnimatedWaveBar minHeight={24} maxHeight={56} duration={500} />
              <AnimatedWaveBar minHeight={18} maxHeight={48} duration={350} />
              <AnimatedWaveBar minHeight={12} maxHeight={36} duration={450} />
            </View>
            <Text style={styles.modalTitle}>그때의 음악을 준비하고 있어요...</Text>
            <Text style={styles.modalSub}>잠시만 기다려주세요.</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* 하단 탭 바 */}
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