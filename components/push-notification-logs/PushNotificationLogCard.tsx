import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useStyles } from '../../modules/theme';
import { TCombinedUser, TPushNotificationLog } from '../../types/dto';
import { ThemedText } from '../themed-text';

interface PushNotificationLogCardProps {
  log: TPushNotificationLog;
  onPress?: (log: TPushNotificationLog) => void;
  users?: TCombinedUser[];
}

export function PushNotificationLogCard({ log, onPress, users = [] }: PushNotificationLogCardProps) {
  const { colors, spacing, fontSize } = useStyles();

  // fromUserId'den kullanıcı adını bul
  const fromUserName = useMemo(() => {
    if (!log.fromUserId || !users || users.length === 0) return null;
    const user = users.find(u => u.id === log.fromUserId);
    return user?.name || null;
  }, [log.fromUserId, users]);

  const styles = {
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: spacing.medium,
      marginHorizontal: spacing.medium,
      marginVertical: spacing.small,
      borderWidth: 1,
      borderColor: colors.border + '30',
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      marginBottom: spacing.small,
    },
    headerLeft: {
      flex: 1,
      marginRight: spacing.small,
    },
    title: {
      fontSize: fontSize.medium,
      fontWeight: 'bold' as const,
      color: colors.text,
      marginBottom: spacing.tiny,
    },
    message: {
      fontSize: fontSize.small,
      color: colors.textLight,
      marginBottom: spacing.small,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginVertical: 2,
    },
    label: {
      fontSize: fontSize.small,
      color: colors.textLight,
      marginRight: spacing.tiny,
    },
    value: {
      fontSize: fontSize.small,
      color: colors.text,
      fontWeight: '500' as const,
    },
    statusBadge: {
      paddingHorizontal: spacing.small,
      paddingVertical: spacing.tiny,
      borderRadius: 6,
      alignSelf: 'flex-start' as const,
    },
    statusText: {
      fontSize: fontSize.tiny,
      fontWeight: 'bold' as const,
      color: '#FFF',
    },
    moduleChip: {
      backgroundColor: colors.primary + '20',
      paddingHorizontal: spacing.small,
      paddingVertical: spacing.tiny,
      borderRadius: 6,
      marginRight: spacing.tiny,
      marginTop: spacing.tiny,
    },
    moduleText: {
      fontSize: fontSize.tiny,
      color: colors.primary,
      fontWeight: '500' as const,
    },
    platformIcon: {
      marginLeft: spacing.tiny,
    },
    footer: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginTop: spacing.small,
      paddingTop: spacing.small,
      borderTopWidth: 1,
      borderTopColor: colors.border + '20',
    },
    timestamp: {
      fontSize: fontSize.tiny,
      color: colors.textLight,
    },
  };

  const getStatusColor = (deliveryStatus?: string) => {
    switch (deliveryStatus) {
      case 'sent':
        return '#4CAF50'; // Green
      case 'failed':
        return '#F44336'; // Red
      default:
        return colors.textLight;
    }
  };

  const getStatusText = (deliveryStatus?: string) => {
    switch (deliveryStatus) {
      case 'sent':
        return 'Başarılı';
      case 'failed':
        return 'Başarısız';
      default:
        return 'Bilinmiyor';
    }
  };

  const getDeliveryMethodIcon = (method?: string) => {
    switch (method) {
      case 'token':
        return 'person';
      case 'topic':
        return 'group';
      case 'broadcast':
        return 'campaign';
      default:
        return 'send';
    }
  };

  const getDeliveryMethodText = (method?: string) => {
    switch (method) {
      case 'token':
        return 'Tekil';
      case 'topic':
        return 'Konu';
      case 'broadcast':
        return 'Toplu';
      default:
        return method || 'Bilinmiyor';
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const content = (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText style={styles.title}>{log.title}</ThemedText>
          {log.message && (
            <ThemedText style={styles.message} numberOfLines={2}>
              {log.message}
            </ThemedText>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(log.deliveryStatus) }]}>
          <ThemedText style={styles.statusText}>{getStatusText(log.deliveryStatus)}</ThemedText>
        </View>
      </View>

          {/* Info Rows */}
          {log.fromUserId && (
            <View style={styles.row}>
              <MaterialIcons name="person" size={16} color={colors.primary} style={{ marginRight: 4 }} />
              <ThemedText style={styles.label}>Gönderen:</ThemedText>
              <ThemedText style={styles.value}>
                {fromUserName || log.fromUserId}
              </ThemedText>
            </View>
          )}

      {log.action && (
        <View style={styles.row}>
          <ThemedText style={styles.label}>Aksiyon:</ThemedText>
          <ThemedText style={styles.value}>{log.action}</ThemedText>
        </View>
      )}
      
      <View style={styles.row}>
        <View style={styles.moduleChip}>
          <ThemedText style={styles.moduleText}>{log.module}</ThemedText>
        </View>
        <MaterialIcons
          name={getDeliveryMethodIcon(log.deliveryMethod) as any}
          size={16}
          color={colors.textLight}
          style={styles.platformIcon}
        />
        <ThemedText style={[styles.label, { marginLeft: spacing.tiny }]}>
          {getDeliveryMethodText(log.deliveryMethod)}
        </ThemedText>
        {log.isRead && (
          <MaterialIcons
            name="visibility"
            size={16}
            color={colors.success}
            style={{ marginLeft: spacing.tiny }}
          />
        )}
      </View>

      {log.errorMessage && (
        <View style={styles.row}>
          <MaterialIcons name="error" size={16} color={colors.error} style={{ marginRight: 4 }} />
          <ThemedText style={[styles.value, { color: colors.error, flex: 1 }]} numberOfLines={2}>
            {log.errorMessage}
          </ThemedText>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <ThemedText style={styles.timestamp}>
          {formatDate(log.sentAt)}
        </ThemedText>
        {log.priority && (
          <ThemedText style={[styles.timestamp, { fontStyle: 'italic', color: log.priority === 'high' ? colors.error : colors.textLight }]}>
            {log.priority === 'high' ? 'Yüksek Öncelik' : 'Normal'}
          </ThemedText>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={() => onPress(log)}>{content}</TouchableOpacity>;
  }

  return content;
}
