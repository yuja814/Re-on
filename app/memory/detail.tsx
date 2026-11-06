// app/memory/detail.tsx

import { Ionicons } from '@expo/vector-icons';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { BottomTabBar } from '@/components/navigation/bottom-tab-bar';

import { fetchMemory, markMemoryRead, type MemoryDetail } from '@/services/memory-api';
import { ApiError } from '@/services/api-client';
import { createPlaylist, resumePlaylist, youtubeStatus } from '@/services/youtube-api';
import { beginYouTubeConnection } from '@/services/youtube-browser';
import { useSession } from '@/stores/auth-store';

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
  const [animHeight] = useState(() => new Animated.Value(minHeight));

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

  const [detailData, setDetailData] = useState<MemoryDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // RE:PLAY 버튼 클릭 시 모달 상태 관리
  const [isReplaying, setIsReplaying] = useState<boolean>(false);

  const session=useSession();
  const [readError,setReadError]=useState('');
  const [replayError,setReplayError]=useState('');
  const [playlistUrl,setPlaylistUrl]=useState('');
  const [playlistId,setPlaylistId]=useState('');
  const [playlistCount,setPlaylistCount]=useState<number|null>(null);
  const [needsConnection,setNeedsConnection]=useState(false);
  const [canResume,setCanResume]=useState(false);
  useEffect(()=>{
    let active=true;
    const load=async()=>{
      if(session.status!=='signedIn')return;
      if(typeof memoryId!=='string' || !/^[1-9][0-9]*$/.test(memoryId))throw new Error('Memory ID가 올바르지 않습니다.');
      const data=await fetchMemory(memoryId);
      if(!active)return;
      setDetailData(data);
      try{await markMemoryRead(memoryId);}catch{if(active)setReadError('읽음 처리를 완료하지 못했어요. 다시 시도해주세요.');}
    };
    void load().catch((reason:unknown)=>{if(active)setError(reason instanceof Error?reason.message:'Memory 조회 실패');})
      .finally(()=>{if(active && session.status!=='loading')setIsLoading(false);});
    return()=>{active=false;};
  },[memoryId,session.status]);
  const replay=async(resume=false)=>{
    if(isReplaying || typeof memoryId!=='string')return;
    setIsReplaying(true);setReplayError('');
    try{
      const status=await youtubeStatus();
      if(!status.connected){setNeedsConnection(true);setReplayError('YouTube 계정을 연결해주세요.');return;}
      setNeedsConnection(false);
      const result=await (resume?resumePlaylist(memoryId):createPlaylist(memoryId));
      setPlaylistUrl(result.playlistUrl);setPlaylistId(result.playlistId);setPlaylistCount(result.trackCount);setCanResume(false);
    }catch(reason){
      if(reason instanceof ApiError){
        const partial=reason.details.playlistUrl;
        if(partial)setPlaylistUrl(partial);
        setNeedsConnection(['YOUTUBE_AUTH_REQUIRED','YOUTUBE_REAUTH_REQUIRED','YOUTUBE_NOT_CONNECTED'].includes(reason.code));
        setCanResume(reason.code!=='PLAYLIST_RECOVERY_BLOCKED' && (Boolean(partial)||reason.code==='PLAYLIST_CREATION_INCOMPLETE'||reason.code==='NETWORK_ERROR'));
        setReplayError(reason.message+(reason.details.confirmedTrackCount!==undefined?` (확인된 곡 ${reason.details.confirmedTrackCount}개)`:''));
      }else setReplayError(reason instanceof Error?reason.message:'플레이리스트 요청에 실패했습니다.');
    }finally{setIsReplaying(false);}
  };
  if(session.status==='signedOut')return <Redirect href="/user/login"/>;

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
    () => 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop'
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. 상단 히어로 배너 */}
        <View style={styles.heroContainer}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
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
              <Text style={{ fontWeight: '700' }}>{detailData.momentCount} Moment</Text> |{' '}
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
                      uri: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop',
                    }}
                    style={styles.cardCoverImage}
                  />
                  <View style={styles.cardContent}>
                    <Text style={styles.songTitle}>{item.title}</Text>
                    <Text style={styles.artistName}>{item.artist}</Text>
                    {item.memo ? <Text style={styles.memoText}>{item.memo}</Text> : null}
                  </View>
                </View>
              </View>
            );
          })}

          {readError?<TouchableOpacity onPress={()=>{if(typeof memoryId==='string')void markMemoryRead(memoryId).then(()=>setReadError('')).catch(()=>{});}}><Text style={{color:'#FF6B6B'}}>{readError}</Text></TouchableOpacity>:null}
          {replayError?<Text style={{color:'#FF6B6B',marginTop:16}}>{replayError}</Text>:null}
          {needsConnection?<TouchableOpacity onPress={()=>{if(typeof memoryId==='string')void beginYouTubeConnection(memoryId).catch((reason:unknown)=>setReplayError(reason instanceof Error?reason.message:'연결 실패'));}}><Text style={{color:'#FFE680',padding:16}}>YouTube 권한 연결</Text></TouchableOpacity>:null}
          {canResume?<TouchableOpacity disabled={isReplaying} onPress={()=>{void replay(true);}}><Text style={{color:'#FFE680',padding:16}}>기존 플레이리스트 복구</Text></TouchableOpacity>:null}
          {playlistId?<TouchableOpacity onPress={()=>{void Linking.openURL('https://www.youtube.com/playlist?list='+encodeURIComponent(playlistId)).catch(()=>setReplayError('플레이리스트를 열지 못했어요.'));}}><Text style={{color:'#FFE680',padding:16}}>일반 YouTube에서 열기</Text></TouchableOpacity>:null}
          {playlistUrl?<TouchableOpacity onPress={()=>{void Linking.openURL(playlistUrl).catch(()=>setReplayError('플레이리스트를 열지 못했어요.'));}}><Text style={{color:'#FFE680',padding:16}}>YouTube Music에서 열기{playlistCount!==null?` · ${playlistCount}곡`:''}</Text></TouchableOpacity>:null}
          {/* 4. RE:PLAY 카드 */}
          <TouchableOpacity
            style={styles.replayCard}
            activeOpacity={0.9}
            onPress={() => {void replay();}}
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
          disabled={true}
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