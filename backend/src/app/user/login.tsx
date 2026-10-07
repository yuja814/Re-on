import { StyleSheet, Text, View } from 'react-native';

export default function TestComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>TypeScript 세팅 완료!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});