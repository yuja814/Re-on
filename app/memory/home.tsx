//memory/home.tsx

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
        <TouchableOpacity 
            style={styles.mainCard}
            onPress={() => router.push('/memory/detail')}
        >
        {/* 13 moments 뱃지 */}
            <View style={styles.momentsBadge}>
                <Text style={styles.momentsBadgeText}>
                    <Text style={styles.momentsCount}>2 </Text>
                    moments
                </Text>
            </View>

            {/* 타이틀 및 날짜 */}
            <View style={styles.albumInfo}>
                <Text style={styles.albumTitle}>NCT127과 함께한 7월</Text>
                <Text style={styles.albumDate}>2026.07.03 - 2026.07.21</Text>        
            </View>

            <View style={styles.imageContainer}>
                <Image
                    source={{
                        uri: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop',
                    }}
                    style={styles.albumCover}
                />
            </View>
        </TouchableOpacity>

        {/* 회색 메인 카드 영역 */}

        <TouchableOpacity 
            style={styles.mainCard}
            onPress={() => router.push('/memory/detail')}
        >
            {/* 13 moments 뱃지 */}
            <View style={styles.momentsBadge}>
                <Text style={styles.momentsBadgeText}>
                    <Text style={styles.momentsCount}>2 </Text>
                    moments
                </Text>
            </View>

            {/* 타이틀 및 날짜 */}
            <View style={styles.albumInfo}>
                <Text style={styles.albumTitle}>9월의 늦은 밤</Text>
                <Text style={styles.albumDate}>2026.09.08 - 2026.09.29</Text>        
            </View>

            <View style={styles.imageContainer}>
                <Image
                    source={{
                        uri: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop',
                    }}
                    style={styles.albumCover}
                />
            </View>
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
    marginBottom: 24,
  },
  addButton: {
    padding: 4,
  },

  /* 메인 노란 카드 */
  mainCard: {
    backgroundColor: '#FFE680',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 28,
    padding: 15,
    alignItems: 'center',
    marginBottom: 22,
  },
  albumInfo: {
    flex: 1,
    marginRight: 16,
    alignSelf: 'stretch',
    justifyContent: 'flex-end',
    marginBottom: 15,
},
  imageContainer: {
    position: 'relative',
    width: '38%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  albumCover: {
    width: '100%',
    height: '100%',
  },
  momentsBadge: {
    position: 'absolute',
    zIndex: 10,
    top: 10,
    right: 65,
    backgroundColor: '#FFFFFF',
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