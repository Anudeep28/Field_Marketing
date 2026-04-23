import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, MobileSpacing, FontSize, MobileFontSize, Shadow } from '../../constants/theme';
import { useIsMobile } from '../../utils/responsive';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const isMobile = useIsMobile();
  const sizeKey = isMobile ? `mSize_${size}` : `size_${size}`;
  const labelSizeKey = isMobile ? `mLabelSize_${size}` : `labelSize_${size}`;

  const buttonStyles = [
    styles.base,
    isMobile && styles.baseMobile,
    styles[variant],
    (styles as any)[sizeKey],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    (variant === 'primary' || variant === 'secondary' || variant === 'danger') && Shadow.md,
    style,
  ];

  const labelStyles = [
    styles.label,
    styles[`label_${variant}`],
    (styles as any)[labelSizeKey],
    disabled && styles.labelDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.textOnPrimary : Colors.primary} size="small" />
      ) : (
        <>
          {icon}
          <Text style={labelStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  baseMobile: {
    borderRadius: BorderRadius.md,
    gap: MobileSpacing.sm,
    minHeight: 46,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  outline: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  danger: {
    backgroundColor: Colors.danger,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  // Desktop sizes
  size_sm: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  size_md: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  size_lg: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
  },
  // Mobile sizes — bigger touch targets
  mSize_sm: {
    paddingHorizontal: MobileSpacing.lg,
    paddingVertical: MobileSpacing.sm,
  },
  mSize_md: {
    paddingHorizontal: MobileSpacing.xl,
    paddingVertical: MobileSpacing.md,
  },
  mSize_lg: {
    paddingHorizontal: MobileSpacing.xxl,
    paddingVertical: MobileSpacing.lg,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  label_primary: {
    color: Colors.textOnPrimary,
  },
  label_secondary: {
    color: Colors.textOnPrimary,
  },
  label_outline: {
    color: Colors.text,
  },
  label_danger: {
    color: Colors.textOnPrimary,
  },
  label_ghost: {
    color: Colors.primary,
  },
  // Desktop label sizes
  labelSize_sm: {
    fontSize: FontSize.sm,
  },
  labelSize_md: {
    fontSize: FontSize.md,
  },
  labelSize_lg: {
    fontSize: FontSize.lg,
  },
  // Mobile label sizes
  mLabelSize_sm: {
    fontSize: MobileFontSize.sm,
  },
  mLabelSize_md: {
    fontSize: MobileFontSize.md,
  },
  mLabelSize_lg: {
    fontSize: MobileFontSize.lg,
  },
  labelDisabled: {
    opacity: 0.7,
  },
});
