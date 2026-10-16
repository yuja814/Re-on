// app/memory/home.tsx

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

interface MemoryListItem {
  id: number;
  title: string;
  momentsCount: number;
  startDate: string;
  endDate: string;
  coverImageUrl: string;
}

export default function MemoryHomeScreen() {
  const router = useRouter();

  const [memoryList, setMemoryList] = useState<MemoryListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // GET /api/v1/memories API 호출
  const fetchMemories = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: 실제 서비스 시 저장된 JWT Auth 토큰으로 대체하세요.
      const token = 'YOUR_JWT_ACCESS_TOKEN';

      const response = await fetch('http://localhost:8080/api/v1/memories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
        }
        throw new Error('Memory 목록을 가져오지 못했습니다.');
      }

      const data = await response.json();
      // 백엔드 응답 형태: { content: [...] }
      setMemoryList(data.content || []);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const isEmpty = memoryList.length === 0;

  // 날짜 포맷 변환 (YYYY.MM.DD ~ YYYY.MM.DD)
  const formatDateRange = (start: string, end: string) => {
    const formatDate = (dateStr: string) => dateStr.replace(/-/g, '. ');
    return `${formatDate(start)} ~ ${formatDate(end)}`;
  };

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

          <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/memory/create')}
          activeOpacity={0.7}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* 상태별 조건부 렌더링 */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#FFFC36" />
            <Text style={styles.loadingText}>Memory를 불러오고 있어요...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={40} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchMemories}>
              <Text style={styles.retryBtnText}>다시 시도하기</Text>
            </TouchableOpacity>
          </View>
        ) : isEmpty ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>아직 생성된 Memory가 없어요.{'\n'}다양한 기록들을 남겨보세요.</Text> 
          </View>
        ) : (
          memoryList.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.mainCard}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: '/memory/detail',
                  params: { memoryId: item.id },
                })
              }
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
                <Text style={styles.albumDate}>{formatDateRange(item.startDate, item.endDate)}</Text>
              </View>

              {/* 우측 이미지 영역 */}
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: item.coverImageUrl }}
                  style={styles.albumCover}
                />
              </View>
            </TouchableOpacity>
          ))
        )}
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
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginTop: 8,
  },
  addButton: {
    padding: 4,
  },
  centerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingBottom: 80 
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
  /* Empty State */
  emptyContainer: {
    justifyContent: 'center',
    paddingVertical: 200,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    color: '#E8E8E6',
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
    fontWeight: '500',
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