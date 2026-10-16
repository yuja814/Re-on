import { Image } from 'expo-image';
import { Redirect, Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { requestGoogleLogin } from '@/services/auth-api';
import { signInWithGoogle } from '@/services/google-sign-in';
import { saveSession, useSession } from '@/stores/auth-store';

/** 온보딩 > 로그인 (Figma 545:2649) */
export default function LoginScreen() {
  const router = useRouter();
  const sessionState = useSession();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loginFailed, setLoginFailed] = useState(false);

  if (sessionState.status === 'signedIn' && !isSigningIn) {
    return <Redirect href="/moment/moment" />;
  }

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setLoginFailed(false);
    try {
      const idToken = await signInWithGoogle();
      if (!idToken) {
        // 사용자가 계정 선택을 취소한 경우
        setIsSigningIn(false);
        return;
      }

      const session = await requestGoogleLogin(idToken);
      await saveSession(session);
      router.replace('/moment/moment');
    } catch {
      setLoginFailed(true);
      setIsSigningIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topSpace} />

      <View style={styles.brand}>
        <View style={styles.logoArea}>
          <View style={styles.logo}>
            <Image
              source={require('@/assets/images/auth/reon-logo.svg')}
              style={styles.logoImage}
              contentFit="contain"
            />
            <Text style={styles.logoColon}>:</Text>
          </View>
          <Text style={styles.logoText}>Re:on</Text>
        </View>
        <Text style={styles.tagline}>음악과 함께 순간을 기록하세요.</Text>
      </View>

      <View style={styles.middleSpace} />

      <View style={styles.loginArea}>
        {isSigningIn ? (
          <ActivityIndicator size="small" color="#E8E8E6" style={styles.googleButton} />
        ) : (
          <Pressable
            onPress={handleGoogleLogin}
            accessibilityRole="button"
            accessibilityLabel="Google로 로그인">
            <Image
              source={require('@/assets/images/auth/google-sign-in.png')}
              style={styles.googleButton}
              contentFit="contain"
            />
          </Pressable>
        )}
        {loginFailed ? (
          <Text style={styles.errorText}>로그인하지 못했어요. 다시 시도해주세요.</Text>
        ) : null}
      </View>

      <View style={styles.bottomSpace} />
    </SafeAreaView>
  );
}

// 세로 위치는 Figma 프레임(874px)에서 각 요소의 위치 비율을 따른다
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#0D0B02',
  },
  topSpace: {
    flex: 202,
  },
  middleSpace: {
    flex: 219,
  },
  bottomSpace: {
    flex: 101,
  },

  /* Brand */
  brand: {
    width: 260,
    alignItems: 'center',
    gap: 36,
  },
  logoArea: {
    width: 116,
    margin: 10,
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 116,
    height: 133,
  },
  logoImage: {
    width: 116,
    height: 117,
  },
  logoColon: {
    position: 'absolute',
    left: 10,
    top: 36,
    width: 96,
    fontSize: 69,
    fontWeight: '700',
    lineHeight: 97,
    letterSpacing: -0.69,
    color: '#FFE680',
    textAlign: 'center',
    textShadowColor: '#FFE680',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E8E8E6',
  },
  tagline: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Login */
  loginArea: {
    alignItems: 'center',
    gap: 12,
  },
  googleButton: {
    width: 200,
    height: 47,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FF453A',
  },
});
