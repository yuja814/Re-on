import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useSession } from '@/stores/auth-store';

/** 앱 첫 화면: 로그인 상태면 Moment 화면, 아니면 로그인 화면으로 보낸다 */
export default function IndexScreen() {
  const sessionState = useSession();

  if (sessionState.status === 'loading') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color="#E8E8E6" />
      </View>
    );
  }

  return (
    <Redirect href={sessionState.status === 'signedIn' ? '/moment/moment' : '/user/login'} />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0B02',
  },
});
