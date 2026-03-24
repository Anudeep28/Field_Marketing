import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Slot, usePathname, router, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, MobileFontSize, Spacing, MobileSpacing, Shadow, BorderRadius } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsMobile } from '../../utils/responsive';

const ALL_TABS = [
  { name: '/(tabs)', href: '/(tabs)', label: 'Home', icon: 'grid' as const, roles: ['admin', 'field_agent'] },
  { name: 'visits', href: '/(tabs)/visits', label: 'Visits', icon: 'location' as const, roles: ['admin', 'field_agent'] },
  { name: 'team', href: '/(tabs)/team', label: 'Team', icon: 'people-circle' as const, roles: ['admin'] },
  { name: 'calendar', href: '/(tabs)/calendar', label: 'Calendar', icon: 'calendar' as const, roles: ['admin', 'field_agent'] },
  { name: 'clients', href: '/(tabs)/clients', label: 'Clients', icon: 'people' as const, roles: ['admin'] },
  { name: 'profile', href: '/(tabs)/profile', label: 'Profile', icon: 'person-circle' as const, roles: ['admin', 'field_agent'] },
];

export default function TabsLayout() {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const isLoading = useStore((s) => s.isLoading);
  const currentUser = useStore((s) => s.currentUser);
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const role = currentUser?.role || 'field_agent';
  const TABS = ALL_TABS.filter((tab) => tab.roles.includes(role));

  const sp = isMobile ? MobileSpacing : Spacing;
  const fs = isMobile ? MobileFontSize : FontSize;

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/login" />;

  const isActive = (tab: typeof TABS[number]) => {
    if (tab.href === '/(tabs)') return pathname === '/' || pathname === '/(tabs)';
    return pathname.includes(tab.name);
  };

  // ── MOBILE: Bottom navigation ──
  if (isMobile) {
    return (
      <View style={styles.wrapper}>
        {/* Compact header */}
        <View style={[styles.mobileHeader, { paddingTop: insets.top + sp.xs }]}>
          <Text style={styles.mobileHeaderTitle}>FieldPulse</Text>
        </View>

        {/* Screen Content */}
        <View style={styles.content}>
          <Slot />
        </View>

        {/* Bottom Tab Bar */}
        <View style={[styles.mobileTabBar, { paddingBottom: Math.max(insets.bottom, sp.sm) }]}>
          {TABS.map((tab) => {
            const active = isActive(tab);
            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.mobileTab}
                onPress={() => router.replace(tab.href as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.mobileTabIconWrap, active && styles.mobileTabIconWrapActive]}>
                  <Ionicons
                    name={active ? tab.icon : (`${tab.icon}-outline` as any)}
                    size={22}
                    color={active ? Colors.primary : Colors.textTertiary}
                  />
                </View>
                <Text style={[
                  styles.mobileTabLabel,
                  active && styles.mobileTabLabelActive,
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.brandingBar}>
          <Text style={styles.brandingText}>Powered by Eneru (OPC)</Text>
        </View>
      </View>
    );
  }

  // ── DESKTOP: Top navigation ──
  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Text style={styles.headerTitle}>FieldPulse</Text>
      </View>

      {/* Top Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const active = isActive(tab);
          return (
            <TouchableOpacity
              key={tab.name}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => router.replace(tab.href as any)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={active ? tab.icon : (`${tab.icon}-outline` as any)}
                size={18}
                color={active ? Colors.primary : Colors.textTertiary}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Screen Content */}
      <View style={styles.content}>
        <Slot />
      </View>

      {/* Branding footer */}
      <View style={styles.brandingBarDesktop}>
        <Text style={styles.brandingTextDesktop}>Powered by Eneru (OPC)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },

  // ── Desktop: Top bar ──
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.md,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textOnPrimary,
    letterSpacing: -0.3,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    ...Shadow.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: 5,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },

  // ── Mobile: Compact header + Bottom bar ──
  mobileHeader: {
    backgroundColor: Colors.primary,
    paddingHorizontal: MobileSpacing.lg,
    paddingBottom: MobileSpacing.sm,
    alignItems: 'flex-start',
  },
  mobileHeaderTitle: {
    fontSize: MobileFontSize.lg,
    fontWeight: '800',
    color: Colors.textOnPrimary,
    letterSpacing: -0.3,
  },
  mobileTabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: MobileSpacing.xs,
    ...Shadow.md,
  },
  mobileTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: MobileSpacing.xs,
    minHeight: 52,
  },
  mobileTabIconWrap: {
    width: 36,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileTabIconWrapActive: {
    backgroundColor: Colors.infoLight,
  },
  mobileTabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textTertiary,
    marginTop: 2,
  },
  mobileTabLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },

  // ── Branding ──
  brandingBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingVertical: 4,
    alignItems: 'center',
  },
  brandingText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textTertiary,
    letterSpacing: 0.3,
  },
  brandingBarDesktop: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingVertical: 6,
    alignItems: 'center',
  },
  brandingTextDesktop: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
    letterSpacing: 0.3,
  },
});
