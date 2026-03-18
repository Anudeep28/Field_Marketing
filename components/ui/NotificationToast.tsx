import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/theme';
import { AdminNotification } from '../../store/useStore';

const ICON_MAP: Record<AdminNotification['type'], { name: string; color: string }> = {
  visit_picked: { name: 'hand-left', color: Colors.accent },
  visit_checked_in: { name: 'log-in', color: Colors.primaryLight },
  visit_completed: { name: 'checkmark-circle', color: Colors.success },
  visit_cancelled: { name: 'close-circle', color: Colors.danger },
};

interface Props {
  notification: AdminNotification;
  onDismiss: (id: string) => void;
  onPress?: (notification: AdminNotification) => void;
}

export default function NotificationToast({ notification, onDismiss, onPress }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-30)).current;

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();

    // Auto-dismiss after 6 seconds
    const timer = setTimeout(() => {
      dismissToast();
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -30, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      onDismiss(notification.id);
    });
  };

  const iconInfo = ICON_MAP[notification.type] || { name: 'notifications', color: Colors.primary };

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]}>
      <TouchableOpacity
        style={styles.content}
        activeOpacity={0.8}
        onPress={() => {
          if (onPress) onPress(notification);
          dismissToast();
        }}
      >
        <View style={[styles.iconCircle, { backgroundColor: iconInfo.color + '20' }]}>
          <Ionicons name={iconInfo.name as any} size={20} color={iconInfo.color} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.message} numberOfLines={2}>{notification.message}</Text>
          <Text style={styles.timestamp}>Just now</Text>
        </View>
        <TouchableOpacity onPress={dismissToast} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={18} color={Colors.textTertiary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
    marginHorizontal: Spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  textContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  message: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
  },
});
