import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/navigation/bottom-tab-bar';
import { LogoutButton } from '@/components/user/logout-button';
import { useSession } from '@/stores/auth-store';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

/** 마이페이지 > 내 정보 (Figma 566:3235) */
export default function MyPageScreen() {
  const sessionState = useSession();

  if (sessionState.status === 'loading') {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#E8E8E6" />
      </View>
    );
  }

  if (sessionState.status === 'signedOut') {
    return <Redirect href="/user/login" />;
  }

  const { user } = sessionState.session;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topSpace} />

      <View style={styles.profile}>
        {user.profileImageUrl ? (
          <Image source={{ uri: user.profileImageUrl }} style={styles.profileImage} />
        ) : (
          <View style={styles.profileImage} />
        )}

        <View style={styles.userInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {user.name}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {user.email}
          </Text>
        </View>
      </View>

      <View style={styles.middleSpace} />

      <View style={styles.footer}>
        <LogoutButton />
        <Text style={styles.version}>Re:on 버전 {APP_VERSION}</Text>
      </View>

      <View style={styles.bottomSpace} />
      <BottomTabBar active="me" />
    </SafeAreaView>
  );
}

// 세로 위치는 Figma 프레임(874px)에서 각 요소의 위치 비율을 따른다
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0B02',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSpace: {
    flex: 124,
  },
  middleSpace: {
    flex: 264,
  },
  bottomSpace: {
    flex: 154,
  },

  /* Profile */
  profile: {
    alignItems: 'center',
    gap: 40,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#B7B6B1',
  },
  userInfo: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 40,
  },
  name: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  email: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },

  /* Footer */
  footer: {
    alignItems: 'flex-end',
    gap: 7,
    paddingHorizontal: 40,
  },
  version: {
    fontSize: 12,
    fontWeight: '500',
    color: '#B7B6B1',
  },
});
