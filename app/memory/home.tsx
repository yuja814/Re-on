// app/memory/home.tsx

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
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

export default function MemoryHomeScreen() {
  const router = useRouter();

  // 더미 데이터 배열 (map 함수로 깔끔하게 렌더링)
  const memoryList = [
    {
      id: '1',
      momentsCount: 5,
      title: 'NCT127과 함께한 7월',
      date: '2026. 07. 03. ~ 2026. 07. 21.',
      coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop',
    },
    {
      id: '2',
      momentsCount: 5,
      title: 'NCT127과 함께한 7월',
      date: '2026. 07. 03. ~ 2026. 07. 21.',
      coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop',
    },
    {
      id: '3',
      momentsCount: 5,
      title: 'NCT127과 함께한 7월',
      date: '2026. 07. 03. ~ 2026. 07. 21.',
      coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* 메인 스크롤 영역 */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 상단 헤더 영역 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Memory</Text>
            <Text style={styles.headerSubtitle}>
              음악이 이어준 나의 특별한 시간들
            </Text>
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* 메인 카드 리스트 */}
        {memoryList.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.mainCard}
            activeOpacity={0.8}
            onPress={() => router.push('/memory/detail')}
          >
            {/* 좌측 정보 영역 */}
            <View style={styles.albumInfo}>
              {/* moments 뱃지 */}
              <View style={styles.momentsBadge}>
                <Text style={styles.momentsBadgeText}>
                  <Text style={styles.momentsCount}>{item.momentsCount}</Text> moments
                </Text>
              </View>

              {/* 타이틀 및 날짜 */}
              <Text style={styles.albumTitle}>{item.title}</Text>
              <Text style={styles.albumDate}>{item.date}</Text>
            </View>

            {/* 우측 이미지 영역 */}
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: item.coverImage }}
                style={styles.albumCover}
              />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 하단 탭 바 */}
      <BottomTabBar active="memory" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0B02',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 16,
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFEB',
  },
  headerSubtitle: {
    fontfamily: 'SF Pro',
    fontSize: 14,
    fontWeight: '510',
    color: '#FFFFFF',
    marginTop: 8,
  },
  addButton: {
    padding: 4,
  },

  /* 앨범 카드 */
  mainCard: {
    backgroundColor: '#FFFFEB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 14,
    paddingLeft: 20,
    alignItems: 'center',
    marginBottom: 14,
  },
  albumInfo: {
    flex: 1,
    marginRight: 12,
    marginTop: 25,
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },
  momentsBadge: {
    borderWidth: 1,
    borderColor: '#B7B6B1',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  momentsBadgeText: {
    fontSize: 9,
    fontWeight: '510',
    color: '#0A0801',
  },
  momentsCount: {
    fontWeight: '700',
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A0801',
    marginBottom: 2,
  },
  albumDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
  },
  albumCover: {
    width: '100%',
    height: '100%',
  },
});