import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { Colors, Spacing, MobileSpacing, FontSize, MobileFontSize, BorderRadius, Shadow, StatusColors, PurposeLabels } from '../../constants/theme';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import { formatDate, getToday } from '../../utils/helpers';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { useIsMobile } from '../../utils/responsive';

export default function CalendarScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const getMyVisits = useStore((s) => s.getMyVisits);
  const getTeamVisits = useStore((s) => s.getTeamVisits);
  const getAvailableVisits = useStore((s) => s.getAvailableVisits);
  const isAgent = currentUser?.role === 'field_agent';
  const visits = isAgent ? [...getMyVisits(), ...getAvailableVisits()] : getTeamVisits();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(getToday());

  const today = getToday();

  const visitsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    visits.forEach((v) => {
      map[v.date] = (map[v.date] || 0) + 1;
    });
    return map;
  }, [visits]);

  const selectedVisits = useMemo(() => {
    return visits
      .filter((v) => v.date === selectedDate)
      .sort((a, b) => (a.scheduledTime || a.createdAt).localeCompare(b.scheduledTime || b.createdAt));
  }, [visits, selectedDate]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const isMobile = useIsMobile();
  const sp = isMobile ? MobileSpacing : Spacing;
  const fs = isMobile ? MobileFontSize : FontSize;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Month Navigation */}
      <View style={[styles.monthNav, { paddingHorizontal: sp.lg, paddingVertical: sp.lg }]}>
        <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))} style={styles.navButton}>
          <Ionicons name="chevron-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentMonth(new Date())}>
          <Text style={[styles.monthTitle, { fontSize: fs.xl }]}>{format(currentMonth, 'MMMM yyyy')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Week Day Headers */}
      <View style={[styles.weekHeader, { paddingHorizontal: sp.sm, marginBottom: sp.sm }]}>
        {weekDays.map((d) => (
          <Text key={d} style={[styles.weekDayText, { fontSize: fs.xs }]}>{d}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={[styles.calendarGrid, { paddingHorizontal: sp.sm }]}>
        {calendarDays.map((day, index) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const visitCount = visitsByDate[dateStr] || 0;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                isSelected && styles.dayCellSelected,
                isToday && !isSelected && styles.dayCellToday,
              ]}
              onPress={() => setSelectedDate(dateStr)}
            >
              <Text
                style={[
                  styles.dayText,
                  { fontSize: fs.md },
                  !isCurrentMonth && styles.dayTextOutside,
                  isSelected && styles.dayTextSelected,
                  isToday && !isSelected && styles.dayTextToday,
                ]}
              >
                {format(day, 'd')}
              </Text>
              {visitCount > 0 && (
                <View style={styles.dotRow}>
                  {Array.from({ length: Math.min(visitCount, 3) }).map((_, i) => (
                    <View
                      key={i}
                      style={[styles.visitDot, isSelected && styles.visitDotSelected]}
                    />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Date Visits */}
      <View style={[styles.selectedSection, { paddingHorizontal: sp.lg, paddingTop: sp.xl }]}>
        <View style={[styles.selectedHeader, { marginBottom: sp.md }]}>
          <Text style={[styles.selectedDate, { fontSize: fs.lg }]}>{formatDate(selectedDate, 'EEEE, MMMM d')}</Text>
          <Text style={[styles.visitCount, { fontSize: fs.sm }]}>
            {selectedVisits.length} visit{selectedVisits.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {selectedVisits.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={28} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No visits on this day</Text>
            {!isAgent && <Button title="Plan a Visit" variant="outline" size="sm" onPress={() => router.push('/visit/new')} />}
          </Card>
        ) : (
          selectedVisits.map((visit) => (
            <TouchableOpacity key={visit.id} onPress={() => router.push(`/visit/${visit.id}`)}>
              <Card style={styles.visitCard}>
                <View style={styles.visitRow}>
                  <View style={[styles.timeLine, { backgroundColor: StatusColors[visit.status]?.bg || Colors.border }]} />
                  <View style={styles.visitContent}>
                    <View style={styles.visitTop}>
                      <Text style={styles.visitClient} numberOfLines={1}>{visit.clientName}</Text>
                      <StatusBadge status={visit.status} size="sm" />
                    </View>
                    <View style={styles.visitMeta}>
                      {visit.scheduledTime && (
                        <Text style={styles.visitTime}>{visit.scheduledTime}</Text>
                      )}
                      <Text style={styles.visitPurpose}>{PurposeLabels[visit.purpose] || visit.purpose}</Text>
                    </View>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={{ height: isMobile ? 80 : 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  navButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceVariant,
  },
  monthTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.sm,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayCellToday: {
    backgroundColor: Colors.infoLight,
  },
  dayText: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.text,
  },
  dayTextOutside: {
    color: Colors.textTertiary,
    opacity: 0.4,
  },
  dayTextSelected: {
    color: Colors.textOnPrimary,
    fontWeight: '700',
  },
  dayTextToday: {
    color: Colors.primary,
    fontWeight: '700',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  visitDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  visitDotSelected: {
    backgroundColor: Colors.textOnPrimary,
  },
  selectedSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
  },
  selectedDate: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  visitCount: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  emptyCard: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
  },
  visitCard: {
    paddingVertical: Spacing.md,
    paddingLeft: 0,
  },
  visitRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  timeLine: {
    width: 4,
    borderRadius: 2,
    marginRight: Spacing.md,
    minHeight: 40,
  },
  visitContent: {
    flex: 1,
  },
  visitTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
    gap: Spacing.md,
  },
  visitTime: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  visitPurpose: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
});
