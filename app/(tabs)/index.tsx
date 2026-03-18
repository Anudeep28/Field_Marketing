import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore, AdminNotification } from '../../store/useStore';
import { Colors, Spacing, MobileSpacing, FontSize, MobileFontSize, BorderRadius, Shadow, StatusColors, PurposeLabels } from '../../constants/theme';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import NotificationToast from '../../components/ui/NotificationToast';
import { formatDate, formatTime, getGreeting, getToday, getWeekRange, getMonthRange, formatDuration } from '../../utils/helpers';
import { Visit } from '../../types';
import { useIsMobile } from '../../utils/responsive';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const visits = useStore((s) => s.visits);
  const clients = useStore((s) => s.clients);
  const activeVisit = useStore((s) => s.activeVisit);
  const teamMembers = useStore((s) => s.teamMembers);
  const getMyVisits = useStore((s) => s.getMyVisits);
  const getTeamVisits = useStore((s) => s.getTeamVisits);

  const getAvailableVisits = useStore((s) => s.getAvailableVisits);
  const refreshData = useStore((s) => s.refreshData);
  const notifications = useStore((s) => s.notifications);
  const markNotificationRead = useStore((s) => s.markNotificationRead);
  const logout = useStore((s) => s.logout);

  const isAgent = currentUser?.role === 'field_agent';
  const isAdmin = currentUser?.role === 'admin';

  // Track dismissed toasts so they don't reappear
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const activeToasts = isAdmin
    ? notifications.filter((n) => !n.read && !dismissedIds.has(n.id)).slice(0, 3)
    : [];
  const unreadCount = isAdmin ? notifications.filter((n) => !n.read).length : 0;

  const handleDismissToast = useCallback((id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
    markNotificationRead(id);
  }, [markNotificationRead]);

  const handleToastPress = useCallback((notification: AdminNotification) => {
    markNotificationRead(notification.id);
    router.push(`/visit/${notification.visitId}`);
  }, [markNotificationRead]);

  // Live polling: refresh data every 2 seconds so admin sees near-real-time updates.
  // Also refresh immediately when the tab gains visibility/focus.
  useEffect(() => {
    refreshData();
    const interval = setInterval(() => {
      refreshData();
    }, 2000);

    const onVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshData();
      }
    };
    const onFocus = () => refreshData();

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisible);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisible);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus);
      }
    };
  }, []);

  const today = getToday();
  const weekRange = getWeekRange();
  const monthRange = getMonthRange();

  // For field agents: their own data. For admin: all data.
  const relevantVisits = useMemo(() => {
    if (isAgent) return getMyVisits();
    return getTeamVisits();
  }, [visits, currentUser, teamMembers]);

  // Available (unassigned) visits for agents to pick
  const availableVisits = useMemo(() => {
    if (!isAgent) return [];
    return getAvailableVisits()
      .sort((a, b) => a.date.localeCompare(b.date) || (a.scheduledTime || '').localeCompare(b.scheduledTime || ''))
      .slice(0, 5);
  }, [visits, isAgent]);

  // Personal visits for the logged-in user (used by leaders too for their own section)
  const myVisits = useMemo(() => getMyVisits(), [visits, currentUser]);

  const stats = useMemo(() => {
    const src = relevantVisits;
    const todayVisits = src.filter((v) => v.date === today);
    const weekVisits = src.filter((v) => v.date >= weekRange.start && v.date <= weekRange.end);
    const monthVisits = src.filter((v) => v.date >= monthRange.start && v.date <= monthRange.end);
    return {
      today: {
        total: todayVisits.length,
        completed: todayVisits.filter((v) => v.status === 'completed').length,
        planned: todayVisits.filter((v) => v.status === 'planned').length,
        inProgress: todayVisits.filter((v) => v.status === 'in_progress').length,
        totalDuration: todayVisits.reduce((sum, v) => sum + (v.duration || 0), 0),
      },
      week: {
        total: weekVisits.length,
        completed: weekVisits.filter((v) => v.status === 'completed').length,
      },
      month: {
        total: monthVisits.length,
        completed: monthVisits.filter((v) => v.status === 'completed').length,
        newLeads: monthVisits.filter((v) => v.purpose === 'new_lead').length,
      },
      totalClients: clients.length,
    };
  }, [relevantVisits, clients, today]);

  // Team member performance (for admin)
  const teamPerformance = useMemo(() => {
    if (!isAdmin) return [];
    
    // Debug: log all team member IDs and visit userIds to detect mismatches
    console.log('--- Team Performance Debug ---');
    console.log('Today:', today);
    console.log('Team member IDs:', teamMembers.map(m => `${m.name}=${m.id}`));
    console.log('Visit userIds:', visits.map(v => `${v.clientName}: userId=${v.userId}, date=${v.date}, status=${v.status}`));
    
    const performance = teamMembers
      .filter((m) => m.status === 'active')
      .map((m) => {
        // Match visits by userId OR by assignedToName as fallback
        const mv = visits.filter((v) => v.userId === m.id || (v.assignedToName === m.name && v.userId));
        const todayV = mv.filter((v) => v.date === today);
        const activeV = mv.find((v) => v.status === 'in_progress');
        const completedToday = todayV.filter((v) => v.status === 'completed').length;
        
        // Also count visits completed today by checkOutTime (regardless of scheduled date)
        const completedTodayByCheckout = mv.filter((v) => 
          v.status === 'completed' && v.checkOutTime && v.checkOutTime.startsWith(today)
        ).length;
        
        const totalPickedToday = todayV.length;
        const totalDoneToday = Math.max(completedToday, completedTodayByCheckout);
        
        console.log(`Agent ${m.name} (${m.id}): matched=${mv.length}, todayVisits=${totalPickedToday}, completedToday=${completedToday}, completedByCheckout=${completedTodayByCheckout}`);
        
        return {
          id: m.id,
          name: m.name,
          initial: m.name.charAt(0).toUpperCase(),
          todayTotal: Math.max(totalPickedToday, totalDoneToday),
          todayDone: totalDoneToday,
          isInField: !!activeV,
          activeClient: activeV?.clientName,
        };
      })
      .sort((a, b) => b.todayDone - a.todayDone);
    
    return performance;
  }, [teamMembers, visits, today, currentUser]);

  // Agent: only their own assigned upcoming visits (NOT available ones)
  const myUpcomingVisits = useMemo(() => {
    if (!isAgent) return [];
    return myVisits
      .filter((v) => v.date >= today && (v.status === 'planned' || v.status === 'in_progress'))
      .sort((a, b) => a.date.localeCompare(b.date) || (a.scheduledTime || '').localeCompare(b.scheduledTime || ''))
      .slice(0, 5);
  }, [myVisits, today, isAgent]);

  const recentVisits = useMemo(() => {
    const src = isAgent ? myVisits : relevantVisits;
    return src
      .filter((v) => v.status === 'completed')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 3);
  }, [myVisits, relevantVisits]);

  // Admin: derive a recent activity feed from visit state changes
  const recentActivity = useMemo(() => {
    if (!isAdmin) return [];
    type ActivityItem = {
      id: string;
      visitId: string;
      type: 'picked_up' | 'checked_in' | 'completed' | 'created' | 'cancelled';
      message: string;
      agentName: string;
      clientName: string;
      timestamp: string;
      icon: 'hand-left' | 'log-in' | 'checkmark-circle' | 'add-circle' | 'close-circle';
      color: string;
    };
    const activities: ActivityItem[] = [];

    relevantVisits.forEach((v) => {
      // Visit completed
      if (v.status === 'completed' && v.checkOutTime && v.assignedToName) {
        activities.push({
          id: v.id + '-completed',
          visitId: v.id,
          type: 'completed',
          message: `${v.clientName} visit completed by ${v.assignedToName}`,
          agentName: v.assignedToName,
          clientName: v.clientName,
          timestamp: v.checkOutTime,
          icon: 'checkmark-circle',
          color: Colors.success,
        });
      }
      // Visit checked in
      if (v.checkInTime && v.assignedToName && v.status !== 'completed') {
        activities.push({
          id: v.id + '-checkin',
          visitId: v.id,
          type: 'checked_in',
          message: `${v.assignedToName} checked in at ${v.clientName}`,
          agentName: v.assignedToName,
          clientName: v.clientName,
          timestamp: v.checkInTime,
          icon: 'log-in',
          color: Colors.accent,
        });
      }
      // Visit picked up (has assignedToName, is planned, and was originally unassigned)
      if (v.assignedToName && v.userId && v.status === 'planned') {
        activities.push({
          id: v.id + '-picked',
          visitId: v.id,
          type: 'picked_up',
          message: `${v.clientName} visit picked up by ${v.assignedToName}`,
          agentName: v.assignedToName,
          clientName: v.clientName,
          timestamp: v.updatedAt,
          icon: 'hand-left',
          color: Colors.primaryLight,
        });
      }
      // Visit cancelled
      if (v.status === 'cancelled') {
        activities.push({
          id: v.id + '-cancelled',
          visitId: v.id,
          type: 'cancelled',
          message: `${v.clientName} visit was cancelled`,
          agentName: v.assignedToName || '',
          clientName: v.clientName,
          timestamp: v.updatedAt,
          icon: 'close-circle',
          color: Colors.danger,
        });
      }
    });

    return activities
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 10);
  }, [relevantVisits, isAdmin]);

  const roleLabel = isAdmin ? 'Admin' : 'Field Agent';
  const isMobile = useIsMobile();
  const sp = isMobile ? MobileSpacing : Spacing;
  const fs = isMobile ? MobileFontSize : FontSize;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Greeting Header */}
      <View style={[styles.greetingSection, { paddingHorizontal: sp.xxl, paddingTop: sp.lg, paddingBottom: sp.xxxl }]}>
        <View style={styles.greetingContent}>
          <Text style={[styles.greeting, { fontSize: fs.md }]}>{getGreeting()}</Text>
          <Text style={[styles.userName, { fontSize: fs.xxl }]}>{currentUser?.name || 'User'}</Text>
          <View style={[styles.rolePill, { paddingHorizontal: sp.md }]}>
            <Text style={[styles.rolePillText, { fontSize: fs.xs }]}>{roleLabel}</Text>
          </View>
          <Text style={[styles.dateText, { fontSize: fs.sm, marginTop: sp.xs }]}>{formatDate(today, 'EEEE, MMMM d, yyyy')}</Text>
        </View>
        <View style={styles.headerActions}>
          {isAdmin && (
            <View style={styles.bellContainer}>
              <Ionicons name={unreadCount > 0 ? 'notifications' : 'notifications-outline'} size={isMobile ? 24 : 22} color={Colors.textOnPrimary} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </View>
          )}
          <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={isMobile ? 24 : 22} color={Colors.textOnPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={isMobile ? 24 : 22} color={Colors.textOnPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Live Notification Toasts */}
      {activeToasts.length > 0 && (
        <View style={styles.toastContainer}>
          {activeToasts.map((notif) => (
            <NotificationToast
              key={notif.id}
              notification={notif}
              onDismiss={handleDismissToast}
              onPress={handleToastPress}
            />
          ))}
        </View>
      )}

      {/* ─── ADMIN: Team Overview Section ─── */}
      {isAdmin && (
        <>
          <Text style={[styles.sectionTitle, { fontSize: fs.lg, paddingHorizontal: sp.lg, marginBottom: sp.md }]}>Organisation Overview</Text>
          <View style={[styles.kpiRow, { paddingHorizontal: sp.lg, gap: sp.sm, marginBottom: sp.xl, flexWrap: 'wrap' }]}>
            <Card style={styles.kpiCard}>
              <Ionicons name="people" size={20} color={Colors.primary} />
              <Text style={styles.kpiValue}>{teamPerformance.length}</Text>
              <Text style={styles.kpiLabel}>Active Agents</Text>
            </Card>
            <Card style={styles.kpiCard}>
              <Ionicons name="location" size={20} color={Colors.success} />
              <Text style={[styles.kpiValue, { color: Colors.success }]}>{teamPerformance.filter((a) => a.isInField).length}</Text>
              <Text style={styles.kpiLabel}>In Field Now</Text>
            </Card>
            <Card style={styles.kpiCard}>
              <Ionicons name="checkmark-done" size={20} color={Colors.accent} />
              <Text style={[styles.kpiValue, { color: Colors.accent }]}>{stats.today.completed}/{stats.today.total}</Text>
              <Text style={styles.kpiLabel}>Team Today</Text>
            </Card>
          </View>

          {/* Agent Performance Cards */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Agent Activity</Text>
            <TouchableOpacity onPress={() => router.replace('/(tabs)/team' as any)}>
              <Text style={styles.seeAll}>Manage Team</Text>
            </TouchableOpacity>
          </View>
          {teamPerformance.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="people-outline" size={32} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No team members yet</Text>
              <Button title="Add Agent" variant="outline" size="sm" onPress={() => router.replace('/(tabs)/team' as any)} />
            </Card>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.agentScroll}>
              {teamPerformance.map((agent) => (
                <Card key={agent.id} style={styles.agentCard}>
                  <View style={styles.agentAvatarRow}>
                    <View style={styles.agentAvatar}>
                      <Text style={styles.agentAvatarText}>{agent.initial}</Text>
                    </View>
                    {agent.isInField && (
                      <View style={styles.fieldDot} />
                    )}
                  </View>
                  <Text style={styles.agentName} numberOfLines={1}>{agent.name}</Text>
                  <Text style={styles.agentStat}>{agent.todayDone}/{agent.todayTotal} today</Text>
                  {agent.isInField && agent.activeClient && (
                    <Text style={styles.agentActive} numberOfLines={1}>@ {agent.activeClient}</Text>
                  )}
                </Card>
              ))}
            </ScrollView>
          )}

          {/* Team week/month summary */}
          <View style={[styles.statsRow, { paddingHorizontal: sp.lg, gap: sp.sm, marginBottom: sp.xl }]}>
            <Card style={styles.statCard}>
              <View style={styles.statHeader}>
                <Ionicons name="calendar-outline" size={20} color={Colors.primaryLight} />
                <Text style={[styles.statTitle, { fontSize: fs.sm }]}>Team This Week</Text>
              </View>
              <Text style={[styles.statValue, { fontSize: fs.xl }]}>{stats.week.completed}/{stats.week.total}</Text>
              <Text style={[styles.statSubtext, { fontSize: fs.xs }]}>visits completed</Text>
              {stats.week.total > 0 && (
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.round((stats.week.completed / stats.week.total) * 100)}%` }]} />
                </View>
              )}
            </Card>
            <Card style={styles.statCard}>
              <View style={styles.statHeader}>
                <Ionicons name="trending-up" size={20} color={Colors.success} />
                <Text style={[styles.statTitle, { fontSize: fs.sm }]}>Team This Month</Text>
              </View>
              <Text style={[styles.statValue, { fontSize: fs.xl }]}>{stats.month.total}</Text>
              <Text style={[styles.statSubtext, { fontSize: fs.xs }]}>total visits</Text>
              <Text style={[styles.statHighlight, { fontSize: fs.xs }]}>{stats.month.newLeads} new leads</Text>
            </Card>
          </View>
        </>
      )}

      {/* Active Visit Banner (own) */}
      {activeVisit && (
        <TouchableOpacity onPress={() => router.push(`/visit/${activeVisit.id}`)}>
          <Card style={styles.activeVisitCard}>
            <View style={styles.activeVisitHeader}>
              <View style={styles.activePulse} />
              <Text style={styles.activeVisitLabel}>Active Visit</Text>
            </View>
            <Text style={styles.activeVisitClient}>{activeVisit.clientName}</Text>
            <Text style={styles.activeVisitTime}>
              Checked in at {activeVisit.checkInTime ? formatTime(activeVisit.checkInTime) : '--'}
            </Text>
          </Card>
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <View style={[styles.quickActions, { paddingHorizontal: sp.lg, paddingVertical: sp.xl, gap: sp.md }]}>
        {isAdmin ? (
          <>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/visit/new')}>
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.primaryLight }]}>
                <Ionicons name="add-circle" size={28} color={Colors.textOnPrimary} />
              </View>
              <Text style={styles.quickActionText}>New Visit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/client/new')}>
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.secondary }]}>
                <Ionicons name="person-add" size={24} color={Colors.textOnPrimary} />
              </View>
              <Text style={styles.quickActionText}>Add Client</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.replace('/(tabs)/team' as any)}>
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.success }]}>
                <Ionicons name="people" size={24} color={Colors.textOnPrimary} />
              </View>
              <Text style={styles.quickActionText}>Team</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/export')}>
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.accent }]}>
                <Ionicons name="download" size={24} color={Colors.textOnPrimary} />
              </View>
              <Text style={styles.quickActionText}>Export</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.replace('/(tabs)/visits' as any)}>
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.primaryLight }]}>
                <Ionicons name="location" size={28} color={Colors.textOnPrimary} />
              </View>
              <Text style={styles.quickActionText}>My Visits</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/calendar')}>
          <View style={[styles.quickActionIcon, { backgroundColor: Colors.accent }]}>
            <Ionicons name="calendar" size={24} color={Colors.textOnPrimary} />
          </View>
          <Text style={styles.quickActionText}>Calendar</Text>
        </TouchableOpacity>
      </View>

      {/* ─── AGENT: Personal KPIs ─── */}
      {isAgent && (
        <>
          <Text style={[styles.sectionTitle, { fontSize: fs.lg, paddingHorizontal: sp.lg, marginBottom: sp.md }]}>Today's Overview</Text>
          <View style={[styles.kpiRow, { paddingHorizontal: sp.lg, gap: sp.sm, marginBottom: sp.xl, flexWrap: isMobile ? 'wrap' : 'nowrap' }]}>
            <Card style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{stats.today.total}</Text>
              <Text style={styles.kpiLabel}>Total Visits</Text>
            </Card>
            <Card style={styles.kpiCard}>
              <Text style={[styles.kpiValue, { color: Colors.success }]}>{stats.today.completed}</Text>
              <Text style={styles.kpiLabel}>Completed</Text>
            </Card>
            <Card style={styles.kpiCard}>
              <Text style={[styles.kpiValue, { color: Colors.warning }]}>{stats.today.planned}</Text>
              <Text style={styles.kpiLabel}>Pending</Text>
            </Card>
          </View>

          <View style={[styles.statsRow, { paddingHorizontal: sp.lg, gap: sp.sm, marginBottom: sp.xl }]}>
            <Card style={styles.statCard}>
              <View style={styles.statHeader}>
                <Ionicons name="calendar-outline" size={20} color={Colors.primaryLight} />
                <Text style={[styles.statTitle, { fontSize: fs.sm }]}>This Week</Text>
              </View>
              <Text style={[styles.statValue, { fontSize: fs.xl }]}>{stats.week.completed}/{stats.week.total}</Text>
              <Text style={[styles.statSubtext, { fontSize: fs.xs }]}>visits completed</Text>
              {stats.week.total > 0 && (
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.round((stats.week.completed / stats.week.total) * 100)}%` }]} />
                </View>
              )}
            </Card>
            <Card style={styles.statCard}>
              <View style={styles.statHeader}>
                <Ionicons name="trending-up" size={20} color={Colors.success} />
                <Text style={[styles.statTitle, { fontSize: fs.sm }]}>This Month</Text>
              </View>
              <Text style={[styles.statValue, { fontSize: fs.xl }]}>{stats.month.total}</Text>
              <Text style={[styles.statSubtext, { fontSize: fs.xs }]}>total visits</Text>
              <Text style={[styles.statHighlight, { fontSize: fs.xs }]}>{stats.month.newLeads} new leads</Text>
            </Card>
          </View>

          {stats.today.totalDuration > 0 && (
            <Card style={styles.timeCard}>
              <View style={styles.timeHeader}>
                <Ionicons name="time-outline" size={22} color={Colors.primary} />
                <Text style={styles.timeTitle}>Time in Field Today</Text>
              </View>
              <Text style={styles.timeValue}>{formatDuration(stats.today.totalDuration)}</Text>
            </Card>
          )}
        </>
      )}

      {/* ── AGENT: Available Visits to Pick Up ── */}
      {isAgent && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Visits</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/visits')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {availableVisits.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="checkmark-done-outline" size={32} color={Colors.success} />
              <Text style={styles.emptyText}>All visits have been picked up</Text>
            </Card>
          ) : (
            availableVisits.map((visit) => (
              <TouchableOpacity key={visit.id} onPress={() => router.push(`/visit/${visit.id}`)}>
                <Card style={{ ...styles.visitCard, borderLeftWidth: 3, borderLeftColor: Colors.accent }}>
                  <View style={styles.visitHeader}>
                    <Text style={styles.visitClient} numberOfLines={1}>{visit.clientName}</Text>
                    <View style={styles.pickupBadge}>
                      <Ionicons name="hand-left" size={12} color={Colors.accent} />
                      <Text style={styles.pickupBadgeText}>Pick Up</Text>
                    </View>
                  </View>
                  <View style={styles.visitMeta}>
                    <View style={styles.visitMetaItem}>
                      <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.visitMetaText}>{formatDate(visit.date, 'MMM d')}</Text>
                    </View>
                    {visit.scheduledTime && (
                      <View style={styles.visitMetaItem}>
                        <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                        <Text style={styles.visitMetaText}>{visit.scheduledTime}</Text>
                      </View>
                    )}
                    <View style={styles.visitMetaItem}>
                      <Ionicons name="flag-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.visitMetaText}>{PurposeLabels[visit.purpose] || visit.purpose}</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </>
      )}

      {/* ── ADMIN: Recent Activity Feed ── */}
      {isAdmin && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/visits')}>
              <Text style={styles.seeAll}>All Visits</Text>
            </TouchableOpacity>
          </View>
          {recentActivity.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="pulse-outline" size={32} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No recent activity</Text>
              <Button title="Plan a Visit" variant="outline" size="sm" onPress={() => router.push('/visit/new')} />
            </Card>
          ) : (
            recentActivity.map((activity) => (
              <TouchableOpacity key={activity.id} onPress={() => router.push(`/visit/${activity.visitId}`)}>
                <Card variant="filled" style={styles.recentCard}>
                  <View style={styles.recentRow}>
                    <View style={[styles.activityIconCircle, { backgroundColor: activity.color + '20' }]}>
                      <Ionicons name={activity.icon as any} size={18} color={activity.color} />
                    </View>
                    <View style={styles.recentContent}>
                      <Text style={styles.recentClient} numberOfLines={2}>{activity.message}</Text>
                      <Text style={styles.recentMeta}>{formatDate(activity.timestamp, 'MMM d, h:mm a')}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </>
      )}

      {/* ── AGENT: My Upcoming Visits (assigned to me) ── */}
      {isAgent && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Upcoming Visits</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/visits')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {myUpcomingVisits.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={32} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No visits picked up yet</Text>
              <Text style={[styles.emptyText, { fontSize: 13 }]}>Pick up an available visit above to get started</Text>
            </Card>
          ) : (
            myUpcomingVisits.map((visit) => (
              <TouchableOpacity key={visit.id} onPress={() => router.push(`/visit/${visit.id}`)}>
                <Card style={{ ...styles.visitCard, borderLeftWidth: 3, borderLeftColor: Colors.primary }}>
                  <View style={styles.visitHeader}>
                    <Text style={styles.visitClient} numberOfLines={1}>{visit.clientName}</Text>
                    <StatusBadge status={visit.status} size="sm" />
                  </View>
                  <View style={styles.visitMeta}>
                    <View style={styles.visitMetaItem}>
                      <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.visitMetaText}>{formatDate(visit.date, 'MMM d')}</Text>
                    </View>
                    {visit.scheduledTime && (
                      <View style={styles.visitMetaItem}>
                        <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                        <Text style={styles.visitMetaText}>{visit.scheduledTime}</Text>
                      </View>
                    )}
                    <View style={styles.visitMetaItem}>
                      <Ionicons name="flag-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.visitMetaText}>{PurposeLabels[visit.purpose] || visit.purpose}</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}

          {/* Agent: Recent completed */}
          {recentVisits.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Recently Completed</Text>
              {recentVisits.map((visit) => (
                <TouchableOpacity key={visit.id} onPress={() => router.push(`/visit/${visit.id}`)}>
                  <Card variant="filled" style={styles.recentCard}>
                    <View style={styles.recentRow}>
                      <View style={styles.recentDot} />
                      <View style={styles.recentContent}>
                        <Text style={styles.recentClient}>{visit.clientName}</Text>
                        <Text style={styles.recentMeta}>
                          {formatDate(visit.date, 'MMM d')} · {visit.duration ? formatDuration(visit.duration) : 'N/A'}
                        </Text>
                      </View>
                      <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </>
          )}
        </>
      )}

      <View style={{ height: isMobile ? 80 : 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  greetingSection: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingContent: {
    flex: 1,
  },
  greeting: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textOnPrimary,
    marginTop: 2,
  },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 2,
    marginTop: Spacing.xs,
  },
  rolePillText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textOnPrimary,
  },
  dateText: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: Spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bellContainer: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
  },
  toastContainer: {
    marginTop: -Spacing.md,
    marginBottom: Spacing.sm,
    zIndex: 10,
  },
  headerButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  activeVisitCard: {
    marginHorizontal: Spacing.lg,
    marginTop: -Spacing.lg,
    backgroundColor: Colors.warning,
    borderLeftWidth: 4,
    borderLeftColor: '#B45309',
  },
  activeVisitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  activePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B45309',
  },
  activeVisitLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: '#78350F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activeVisitClient: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: '#78350F',
  },
  activeVisitTime: {
    fontSize: FontSize.sm,
    color: '#92400E',
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  quickActionText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  seeAll: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primaryLight,
  },
  kpiRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  kpiCard: {
    flex: 1,
    minWidth: 150,
    maxWidth: '48%',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: 4,
  },
  kpiValue: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.primary,
  },
  kpiLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
    textAlign: 'center',
  },
  agentScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  agentCard: {
    width: 120,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  agentAvatarRow: {
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  agentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentAvatarText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textOnPrimary,
  },
  fieldDot: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  agentName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  agentStat: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  agentActive: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  statSubtext: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  statHighlight: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 2,
    marginTop: Spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 2,
  },
  timeCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  timeTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  timeValue: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.primary,
  },
  emptyCard: {
    marginHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
  },
  visitCard: {
    marginHorizontal: Spacing.lg,
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  visitClient: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  visitMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  visitMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  visitMetaText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  recentCard: {
    marginHorizontal: Spacing.lg,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  pickupBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: Colors.accentLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  pickupBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700' as const,
    color: Colors.accent,
  },
  activityIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  recentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  recentContent: {
    flex: 1,
  },
  recentClient: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  recentMeta: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 1,
  },
});
