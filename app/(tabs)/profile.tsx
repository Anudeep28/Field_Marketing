import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { Colors, Spacing, MobileSpacing, FontSize, MobileFontSize, BorderRadius, Shadow } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { formatDate, getMonthRange, getWeekRange, getToday } from '../../utils/helpers';
import { showAlert } from '../../utils/alert';
import { useIsMobile } from '../../utils/responsive';

export default function ProfileScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const getMyVisits = useStore((s) => s.getMyVisits);
  const getMyClients = useStore((s) => s.getMyClients);
  const teamMembers = useStore((s) => s.teamMembers);
  const logout = useStore((s) => s.logout);

  const isAgent = currentUser?.role === 'field_agent';
  const visits = getMyVisits();
  const clients = getMyClients();

  const today = getToday();
  const weekRange = getWeekRange();
  const monthRange = getMonthRange();

  const stats = {
    totalVisits: visits.length,
    totalClients: clients.length,
    thisWeek: visits.filter((v) => v.date >= weekRange.start && v.date <= weekRange.end).length,
    thisMonth: visits.filter((v) => v.date >= monthRange.start && v.date <= monthRange.end).length,
    completedThisMonth: visits.filter(
      (v) => v.date >= monthRange.start && v.date <= monthRange.end && v.status === 'completed'
    ).length,
    avgDuration: Math.round(
      visits.filter((v) => v.duration).reduce((sum, v) => sum + (v.duration || 0), 0) /
        (visits.filter((v) => v.duration).length || 1)
    ),
    teamSize: isAgent ? 0 : teamMembers.length,
  };

  const handleLogout = () => {
    showAlert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const isMobile = useIsMobile();
  const sp = isMobile ? MobileSpacing : Spacing;
  const fs = isMobile ? MobileFontSize : FontSize;

  const menuItems = [
    { icon: 'settings-outline' as const, label: 'Settings', onPress: () => router.push('/settings') },
    isAgent
      ? { icon: 'download-outline' as const, label: 'Download My Data', onPress: () => router.push('/export') }
      : { icon: 'download-outline' as const, label: 'Export Data', onPress: () => router.push('/export') },
    ...(isAgent ? [] : [{ icon: 'shield-checkmark-outline' as const, label: 'Data Retention: 6 months', onPress: () => router.push('/settings') }]),
    { icon: 'information-circle-outline' as const, label: 'About FieldPulse v1.0', onPress: () => {} },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={[styles.header, { paddingVertical: sp.xxxl, paddingBottom: sp.xxxl + 10 }]}>
        <View style={[styles.avatarContainer, isMobile && { width: 80, height: 80, borderRadius: 40 }]}>
          <Text style={[styles.avatarText, { fontSize: fs.xxxl }]}>
            {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={[styles.name, { fontSize: fs.xxl }]}>{currentUser?.name || 'User'}</Text>
        <Text style={[styles.email, { fontSize: fs.md }]}>{currentUser?.email || ''}</Text>
        <View style={[styles.roleBadge, { paddingHorizontal: sp.md, paddingVertical: sp.xs }]}>
          <Text style={[styles.roleText, { fontSize: fs.sm }]}>
            {currentUser?.role === 'admin' ? 'Admin' : 'Field Agent'}
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={[styles.statsGrid, { paddingHorizontal: sp.lg, marginTop: -sp.xl, gap: sp.sm }]}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalVisits}</Text>
          <Text style={styles.statLabel}>Total Visits</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalClients}</Text>
          <Text style={styles.statLabel}>Clients</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats.thisMonth}</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats.avgDuration}m</Text>
          <Text style={styles.statLabel}>Avg Duration</Text>
        </Card>
      </View>

      {/* Performance Card */}
      <View style={[styles.section, { paddingHorizontal: sp.lg, marginTop: sp.xl }]}>
        <Text style={[styles.sectionTitle, { fontSize: fs.lg, marginBottom: sp.md }]}>This Month Performance</Text>
        <Card>
          <View style={styles.perfRow}>
            <Text style={styles.perfLabel}>Visits Completed</Text>
            <Text style={styles.perfValue}>{stats.completedThisMonth} / {stats.thisMonth}</Text>
          </View>
          {stats.thisMonth > 0 && (
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round((stats.completedThisMonth / stats.thisMonth) * 100)}%` },
                ]}
              />
            </View>
          )}
          <View style={styles.perfRow}>
            <Text style={styles.perfLabel}>This Week</Text>
            <Text style={styles.perfValue}>{stats.thisWeek} visits</Text>
          </View>
        </Card>
      </View>

      {/* Menu */}
      <View style={[styles.section, { paddingHorizontal: sp.lg, marginTop: sp.xl }]}>
        <Text style={[styles.sectionTitle, { fontSize: fs.lg, marginBottom: sp.md }]}>Options</Text>
        <Card style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={item.label} style={styles.menuItem} onPress={item.onPress}>
              <Ionicons name={item.icon} size={20} color={Colors.textSecondary} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </Card>
      </View>

      {/* Logout */}
      <View style={[styles.section, { paddingHorizontal: sp.lg, marginTop: sp.xl }]}>
        <Button title="Logout" variant="danger" onPress={handleLogout} fullWidth />
      </View>

      <View style={{ height: isMobile ? 80 : 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingBottom: Spacing.xxxl + 10,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    color: Colors.textOnPrimary,
  },
  name: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textOnPrimary,
  },
  email: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  roleBadge: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  roleText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textOnPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    marginTop: -Spacing.xl,
    gap: Spacing.sm,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  perfRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  perfLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  perfValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 3,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 3,
  },
  menuCard: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuLabel: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
  },
});
