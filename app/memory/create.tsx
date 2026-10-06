//memory/create.tsx

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

export default function CreateMemoryScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* 메인 스크롤 영역 */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
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

        {/* 노란색 메인 카드 영역 */}
        <View style={styles.mainCard}>
          <Text style={styles.cardMainTitle}>새로운 Memory가</Text>
          <Text style={styles.cardMainTitleRight}>생성되었어요.</Text>

          {/* 카드 내부 흰색 앨범 박스 */}
          <View style={styles.innerCard}>
            <View style={styles.imageContainer}>
              {/* 앨범 커버 이미지 */}
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop',
                }}
                style={styles.albumCover}
              />
              {/* 13 moments 뱃지 */}
              <View style={styles.momentsBadge}>
                <Text style={styles.momentsBadgeText}>
                  <Text style={styles.momentsCount}>13 </Text>
                  moments
                </Text>
              </View>
            </View>

            {/* 타이틀 및 날짜 */}
            <Text style={styles.albumTitle}>NCT127과 함께한 7월</Text>
            <Text style={styles.albumDate}>2026.07.03 - 2026.07.21</Text>
          </View>
        </View>

        {/* 확인하기 버튼 */}
        <TouchableOpacity style={styles.confirmButton} 
          onPress={() => router.push('/memory/home')}
        >
          <Text style={styles.confirmButtonText}>확인하기</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 하단 탭 바 (일반 Bottom Tab) */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="book" size={24} color="#FFFFFF" />
          <Text style={[styles.tabLabel, styles.activeTabLabel]}>Memory</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <MaterialCommunityIcons
            name="file-document-edit-outline"
            size={24}
            color="#8E8E93"
          />
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
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 20,
  },
  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#A0A0A0',
    marginTop: 4,
  },
  addButton: {
    padding: 4,
  },

  /* Main Yellow Card */
  mainCard: {
    backgroundColor: '#FFE680',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    marginTop: 24,
  },
  cardMainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000000',
    alignSelf: 'flex-start',
  },
  cardMainTitleRight: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000000',
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  innerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#000000',
    paddingTop: 15,
    paddingRight: 40,
    paddingBottom: 18,
    paddingLeft: 40,
    width: '100%',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  albumCover: {
    width: '100%',
    height: '100%',
  },
  momentsBadge: {
    position: 'absolute',
    top: 10,
    right: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  momentsBadgeText: {
    fontSize: 13,
    color: '#000000',
  },
  momentsCount: {
    fontWeight: '800',
  },
  albumTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 4,
  },
  albumDate: {
    fontSize: 12,
    color: '#666666',
  },

  /* Confirm Button */
  confirmButton: {
    backgroundColor: '#FFE67B',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
  },

  /* Bottom Tab Bar */
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    paddingVertical: 13,
    paddingBottom: 13,
    borderTopWidth: 0.5,
    borderTopColor: '#38383A',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
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