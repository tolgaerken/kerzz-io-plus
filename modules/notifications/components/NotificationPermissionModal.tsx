import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  StyleSheet, 
  Alert 
} from 'react-native';
import { useNotifications } from '../hooks/useNotifications';

interface NotificationPermissionModalProps {
  visible: boolean;
  onClose: () => void;
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
  visible,
  onClose,
  onPermissionGranted,
  onPermissionDenied,
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const { requestPermission } = useNotifications();

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    
    try {
      const permission = await requestPermission();
      
      if (permission.status === 'granted') {
        onPermissionGranted?.();
        onClose();
      } else {
        onPermissionDenied?.();
        
        if (!permission.canAskAgain) {
          Alert.alert(
            'Bildirim İzni',
            'Bildirim izni reddedildi. Bildirimleri etkinleştirmek için ayarlardan izin vermeniz gerekiyor.',
            [{ text: 'Tamam', onPress: onClose }]
          );
        } else {
          onClose();
        }
      }
    } catch (error) {
      console.error('Permission request error:', error);
      onClose();
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔔</Text>
          </View>
          
          <Text style={styles.title}>Bildirimleri Etkinleştir</Text>
          
          <Text style={styles.description}>
            Önemli güncellemeler, mesajlar ve hatırlatmalar için bildirim almak ister misiniz?
          </Text>
          
          <View style={styles.benefits}>
            <Text style={styles.benefit}>• Yeni mesajlardan anında haberdar olun</Text>
            <Text style={styles.benefit}>• Önemli güncellemeleri kaçırmayın</Text>
            <Text style={styles.benefit}>• Hatırlatmalar alın</Text>
          </View>
          
          <View style={styles.buttons}>
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={onClose}
              disabled={isRequesting}
            >
              <Text style={styles.secondaryButtonText}>Şimdi Değil</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={handleRequestPermission}
              disabled={isRequesting}
            >
              <Text style={styles.primaryButtonText}>
                {isRequesting ? 'İzin İsteniyor...' : 'İzin Ver'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  benefits: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  benefit: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default NotificationPermissionModal;
