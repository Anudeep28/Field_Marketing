import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, MobileFontSize, Spacing, MobileSpacing } from '../../constants/theme';
import { useIsMobile } from '../../utils/responsive';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  const isMobile = useIsMobile();
  const sp = isMobile ? MobileSpacing : Spacing;
  const fs = isMobile ? MobileFontSize : FontSize;

  return (
    <View style={[styles.container, { paddingVertical: sp.xxxl * 2, paddingHorizontal: sp.xxl }]}>
      <View style={[styles.iconContainer, isMobile && { width: 88, height: 88, borderRadius: 44 }]}>
        <Ionicons name={icon} size={isMobile ? 48 : 44} color={Colors.primary} />
      </View>
      <Text style={[styles.title, { fontSize: fs.lg, marginBottom: sp.sm }]}>{title}</Text>
      {subtitle && <Text style={[styles.subtitle, { fontSize: fs.md }]}>{subtitle}</Text>}
      {action && <View style={[styles.action, { marginTop: sp.xl }]}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl * 2,
    paddingHorizontal: Spacing.xxl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  action: {
    marginTop: Spacing.xl,
  },
});
