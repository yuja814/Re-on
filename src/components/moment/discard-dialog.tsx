import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
};

export function DiscardDialog({ visible, onKeepEditing, onDiscard }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onKeepEditing}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={styles.title}>작성 중인 내용을 버릴까요?</Text>

          <Pressable style={[styles.button, styles.keepButton]} onPress={onKeepEditing}>
            <Text style={styles.keepText}>계속 편집하기</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.discardButton]} onPress={onDiscard}>
            <Text style={styles.discardText}>삭제하기</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialog: {
    width: 280,
    padding: 14,
    paddingTop: 22,
    borderRadius: 30,
    backgroundColor: '#2C2C2E',
    gap: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  button: {
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keepButton: {
    backgroundColor: '#0091FF',
  },
  keepText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  discardButton: {
    backgroundColor: '#3A3A3C',
  },
  discardText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FF453A',
  },
});
