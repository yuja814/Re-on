import { useRouter } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>REON 메인 테스트 화면</Text>
        <Text style={styles.subtitle}>아래 버튼을 눌러 Memory 생성 페이지로 이동하세요.</Text>

        {/* /memory/create 페이지로 이동하는 임의 버튼 */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/memory/create')}
        >
          <Text style={styles.buttonText}>Memory 작성 페이지로 이동 🚀</Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FFE67B',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
});