import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { logout } from '@/services/logout';

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      // logout()은 실패해도 기기의 로그인 정보를 지우므로 로그인 화면으로 이동한다
    }
    router.replace('/user/login');
  };

  return (
    <Pressable onPress={handleLogout} disabled={isLoggingOut} hitSlop={8}>
      <Text style={[styles.text, isLoggingOut && styles.textDisabled]}>로그아웃</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
    fontWeight: '500',
    color: '#B7B6B1',
  },
  textDisabled: {
    opacity: 0.4,
  },
});
