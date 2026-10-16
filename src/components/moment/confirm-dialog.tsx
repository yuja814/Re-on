import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  title: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  /** 확인 버튼을 누른 뒤 처리 중일 때 버튼을 잠근다 */
  disabled?: boolean;
};

export function ConfirmDialog({
  visible,
  title,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  disabled = false,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>

          <Pressable
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            disabled={disabled}>
            <Text style={styles.cancelText}>{cancelLabel}</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.confirmButton, disabled && styles.buttonDisabled]}
            onPress={onConfirm}
            disabled={disabled}>
            <Text style={styles.confirmText}>{confirmLabel}</Text>
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
  buttonDisabled: {
    opacity: 0.4,
  },
  cancelButton: {
    backgroundColor: '#0091FF',
  },
  cancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  confirmButton: {
    backgroundColor: '#3A3A3C',
  },
  confirmText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FF453A',
  },
});
