import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusColors, LeadStatusColors, VisitStatusLabels } from '../../constants/theme';
import { BorderRadius, FontSize, Spacing } from '../../constants/theme';

interface StatusBadgeProps {
  status: string;
  type?: 'visit' | 'lead';
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, type = 'visit', size = 'md' }: StatusBadgeProps) {
  const colorMap = type === 'visit' ? StatusColors : LeadStatusColors;
  const colors = colorMap[status] || { bg: '#F1F5F9', text: '#64748B' };
  const label = type === 'visit' ? (VisitStatusLabels[status] || status) : status;

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, size === 'sm' && styles.badgeSm]}>
      <Text style={[styles.text, { color: colors.text }, size === 'sm' && styles.textSm]}>
        {label.charAt(0).toUpperCase() + label.slice(1).replace(/_/g, ' ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  textSm: {
    fontSize: 10,
  },
});
