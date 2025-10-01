import React, { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface SuccessPopupProps {
  visible: boolean;
  message?: string;
  autoClose?: boolean; // optional: auto close after 2s
  onClose: () => void;
}

const SuccessPopup: React.FC<SuccessPopupProps> = ({
  visible,
  message = 'Your data has been submitted successfully!',
  autoClose = false,
  onClose,
}) => {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (visible && autoClose) {
      timer = setTimeout(onClose, 2000);
    }
    return () => clearTimeout(timer);
  }, [visible, autoClose, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.popupOverlay}>
        <View style={styles.popupContainer}>
          <Text style={styles.popupTitle}>✅ Success</Text>
          <Text style={styles.popupMessage}>{message}</Text>

          {!autoClose && (
            <TouchableOpacity style={styles.popupButton} onPress={onClose}>
              <Text style={styles.popupButtonText}>OK</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default SuccessPopup;

const styles = StyleSheet.create({
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 5,
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#007AFF',
  },
  popupMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  popupButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  popupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
