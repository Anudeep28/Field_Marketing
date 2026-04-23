import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, MobileSpacing, Shadow } from '../../constants/theme';
import { useIsMobile } from '../../utils/responsive';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'filled';
}

export default function Card({ children, style, variant = 'elevated' }: CardProps) {
  const isMobile = useIsMobile();
  const mobileStyle = isMobile ? styles.cardMobile : undefined;

  return (
    <View style={[styles.card, mobileStyle, variant === 'elevated' && Shadow.md, variant === 'outlined' && styles.outlined, variant === 'filled' && styles.filled, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardMobile: {
    padding: MobileSpacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: MobileSpacing.md,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filled: {
    backgroundColor: Colors.surfaceVariant,
    borderColor: 'transparent',
  },
});
