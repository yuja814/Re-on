// app/memory/detail.tsx

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    Image,
    ImageBackground,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function MemoryDetailScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* 메인 스크롤 영역 */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. 상단 헤더 영역 (커버 이미지 + 오버레이) */}
        <ImageBackground
          source={{
            uri: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
          }}
          style={styles.heroImage}
        >
          <View style={styles.heroOverlay}>
            {/* 뒤로가기 버튼 */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={28} color="#FFE680" />
            </TouchableOpacity>

            {/* 타이틀 및 날짜/뱃지 정보 */}
            <View style={styles.heroBottomContent}>
              <Text style={styles.heroTitle}>NCT127과 함께한 7월</Text>

              <View style={styles.heroInfoRow}>
                {/* 13 moments | 날짜 */}
                <View style={styles.heroDateBox}>
                  <Text style={styles.heroDateText}>
                    <Text style={{ fontWeight: '800' }}>13 moments</Text> | 2026.07.03 - 2026.07.21
                  </Text>
                </View>

                {/* 우측 뱃지 모음 */}
                <View style={styles.heroBadgesColumn}>
                  <View style={styles.badgeItem}>
                    <Text style={styles.badgeText}>🌙 저녁 62%</Text>
                  </View>
                  <View style={styles.badgeItem}>
                    <Text style={styles.badgeText}>📍 체조경기장</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ImageBackground>

        {/* 2. 앨범 상세 설명 영역 */}
        <View style={styles.descriptionSection}>
          <Text style={styles.albumDescription}>
            7월에는 NCT127의 음악을 많이 남겼어요.{"\n"}
            특히 저녁 시간과 체조경기장을 중심으로 기록이 이어졌고, 메모에서도 ‘공연’, ‘집 가는 길’처럼 비슷한 순간들이 반복해서 나타났어요.
          </Text>
          <Text style={styles.momentsTitle}>포함된 Moment</Text>
        </View>

        {/* 3. 타임라인 리스트 영역 */}
        <View style={styles.timelineContainer}>
          {/* 세로 타임라인 연장선 */}
          <View style={styles.timelineLine} />

          {/* Moment 1: 07/03 (노란색) */}
          <View style={styles.timelineItem}>
            {/* 타임라인 노드 (동그라미 & 날짜) */}
            <View style={styles.nodeContainer}>
              <View style={[styles.nodeDot, { backgroundColor: '#FFE680' }]} />
              <Text style={styles.nodeDateText}>07/03</Text>
            </View>

            {/* 카드 박스 */}
            <View style={[styles.momentCard, { backgroundColor: '#FFE680' }]}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop',
                }}
                style={styles.cardCoverImage}
              />
              <View style={styles.cardContent}>
                <Text style={styles.songTitle}>삐그덕</Text>
                <Text style={styles.artistName}>NCT 127</Text>
                <Text style={styles.memoText}>오랜만에 들으니까 신남</Text>
              </View>
            </View>
          </View>

          {/* Moment 2: 07/05 (회색) */}
          <View style={styles.timelineItem}>
            <View style={styles.nodeContainer}>
              <View style={[styles.nodeDot, { backgroundColor: '#D9D9D9' }]} />
              <Text style={styles.nodeDateText}>07/05</Text>
            </View>

            <View style={[styles.momentCard, { backgroundColor: '#D9D9D9' }]}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop',
                }}
                style={styles.cardCoverImage}
              />
              <View style={styles.cardContent}>
                <Text style={styles.songTitle}>영웅</Text>
                <Text style={styles.artistName}>NCT 127</Text>
              </View>
            </View>
          </View>

          {/* Moment 3: 07/07 (노란색) */}
          <View style={styles.timelineItem}>
            <View style={styles.nodeContainer}>
              <View style={[styles.nodeDot, { backgroundColor: '#FFE680' }]} />
              <Text style={styles.nodeDateText}>07/07</Text>
            </View>

            <View style={[styles.momentCard, { backgroundColor: '#FFE680' }]}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=400&auto=format&fit=crop',
                }}
                style={styles.cardCoverImage}
              />
              <View style={styles.cardContent}>
                <Text style={styles.songTitle}>종이비행기</Text>
                <Text style={styles.artistName}>NCT127</Text>
                <Text style={styles.memoText}>이 노래 들으니까 기분 좋아졌어</Text>
              </View>
            </View>
          </View>

          {/* Moment 4: 07/27 (회색) */}
          <View style={styles.timelineItem}>
            <View style={styles.nodeContainer}>
              <View style={[styles.nodeDot, { backgroundColor: '#D9D9D9' }]} />
              <Text style={styles.nodeDateText}>07/27</Text>
            </View>

            <View style={[styles.momentCard, { backgroundColor: '#D9D9D9' }]}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop',
                }}
                style={styles.cardCoverImage}
              />
              <View style={styles.cardContent}>
                <Text style={styles.songTitle}>Cherry bomb</Text>
                <Text style={styles.artistName}>NCT 127</Text>
                <Text style={styles.memoText}>명곡임</Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* 하단 탭 바 */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="book" size={24} color="#FFFFFF" />
          <Text style={[styles.tabLabel, styles.activeTabLabel]}>Memory</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <MaterialCommunityIcons name="file-document-edit-outline" size={24} color="#8E8E93" />
          <Text style={styles.tabLabel}>기록</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="person-outline" size={24} color="#8E8E93" />
          <Text style={styles.tabLabel}>내 정보</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingBottom: 40,
  },

  /* 1. Hero Image Header */
  heroImage: {
    width: '100%',
    height: 242,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 20,
    paddingTop: 50,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  heroBottomContent: {
    marginTop: 'auto',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 0,
  },
  heroInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  heroDateBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  heroDateText: {
    fontSize: 13,
    color: '#000000',
  },
  heroBadgesColumn: {
    gap: 6,
  },
  badgeItem: {
    backgroundColor: '#FFE680',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-end',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },

  /* 2. Description */
  descriptionSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  albumDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#FFFFFF',
    marginBottom: 28,
  },
  momentsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 20,
  },

  /* 3. Timeline */
  timelineContainer: {
    paddingHorizontal: 24,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 29.5, // 노드 센터 위치에 지정
    top: 10,
    bottom: 0,
    width: 1,
    backgroundColor: '#D9D9D9',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  nodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
    paddingTop: 8,
  },
  nodeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 9,
    zIndex: 1,
  },
  nodeDateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Moment Card */
  momentCard: {
    flex: 1,
    flexDirection: 'row',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 5,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 5,
    overflow: 'hidden',
    minHeight: 95,
  },
  cardCoverImage: {
    width: 90,
    height: '100%',
  },
  cardContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 12,
    color: '#444444',
    marginBottom: 10,
  },
  memoText: {
    fontSize: 13,
    color: '#222222',
  },

  /* 리플레이 카드 */
  replayCard: {
    backgroundColor: '#FFE680',
    borderRadius: 5,
    overflow: 'hidden',
  },
  replayCardCoverImage: {
    width: '100%',
    height: 150,
  },
  replaytext: {
    fontSize: 22.5,
    fontWeight: '700',
    color: '#000000',
  },

  /* Bottom Tab Bar */
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingVertical: 12,
    paddingBottom: 24,
    borderTopWidth: 0.5,
    borderTopColor: '#2C2C2E',
  },
  tabItem: {
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
  },
  activeTabLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});