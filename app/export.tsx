import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Redirect } from 'expo-router';
import { useStore } from '../store/useStore';
import { Colors, Spacing, MobileSpacing, FontSize, MobileFontSize, BorderRadius, Shadow } from '../constants/theme';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { generateCSVFromVisits, generateCSVFromAttendance, formatDate, getToday, getMonthRange, getWeekRange, groupVisitsByDate } from '../utils/helpers';
import { showAlert } from '../utils/alert';
import { useIsMobile } from '../utils/responsive';

export default function ExportScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const allVisits = useStore((s) => s.visits);
  const clients = useStore((s) => s.clients);
  const teamMembers = useStore((s) => s.teamMembers);
  const officeHistory = useStore((s) => s.officeHistory);
  const [loading, setLoading] = useState('');

  if (!currentUser) return <Redirect href="/(tabs)" />;

  const isAdmin = currentUser.role === 'admin';
  const isAgent = currentUser.role === 'field_agent';

  // Admin sees all visits; agent sees only their own
  const visits = isAgent
    ? allVisits.filter((v) => v.userId === currentUser.id)
    : allVisits;

  // Agent sees only their own attendance
  const agentOfficeHistory: Record<string, string[]> = isAgent
    ? { [currentUser.id]: officeHistory[currentUser.id] || [] }
    : officeHistory;

  const exportCSV = async (filterLabel: string, filteredVisits: typeof allVisits) => {
    if (filteredVisits.length === 0) {
      showAlert('No Data', 'No visits found for the selected period');
      return;
    }
    setLoading(filterLabel);
    try {
      const csv = generateCSVFromVisits(filteredVisits);
      const fileName = `fieldpulse_visits_${filterLabel.replace(/\s/g, '_').toLowerCase()}_${getToday()}.csv`;

      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const filePath = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(filePath, csv, { encoding: FileSystem.EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(filePath, { mimeType: 'text/csv', dialogTitle: 'Export Visits' });
        } else {
          showAlert('Exported', `File saved to: ${filePath}`);
        }
      }
    } catch (e) {
      showAlert('Error', 'Failed to export data');
      console.error(e);
    } finally {
      setLoading('');
    }
  };

  const today = getToday();
  const weekRange = getWeekRange();
  const monthRange = getMonthRange();

  const exportOptions = [
    {
      label: 'Today',
      description: `${formatDate(today, 'MMMM d, yyyy')}`,
      visits: visits.filter((v) => v.date === today),
    },
    {
      label: 'This Week',
      description: `${formatDate(weekRange.start, 'MMM d')} - ${formatDate(weekRange.end, 'MMM d')}`,
      visits: visits.filter((v) => v.date >= weekRange.start && v.date <= weekRange.end),
    },
    {
      label: 'This Month',
      description: `${formatDate(monthRange.start, 'MMMM yyyy')}`,
      visits: visits.filter((v) => v.date >= monthRange.start && v.date <= monthRange.end),
    },
    {
      label: 'All Records',
      description: `${visits.length} total visits`,
      visits: visits,
    },
  ];

  const exportAttendance = async () => {
    const historyToExport = isAgent ? agentOfficeHistory : officeHistory;
    const totalEntries = Object.values(historyToExport).reduce((sum, dates) => sum + dates.length, 0);
    if (totalEntries === 0) {
      showAlert('No Data', isAgent ? 'You have no office days recorded yet' : 'No agents have marked themselves as working from office yet');
      return;
    }
    setLoading('attendance');
    try {
      const membersForExport = isAgent ? [{ id: currentUser.id, name: currentUser.name }] : teamMembers;
      const csv = generateCSVFromAttendance(historyToExport, membersForExport);
      const fileName = isAgent
        ? `my_attendance_${getToday()}.csv`
        : `fieldpulse_attendance_${getToday()}.csv`;

      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const filePath = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(filePath, csv, { encoding: FileSystem.EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(filePath, { mimeType: 'text/csv', dialogTitle: 'Export Attendance' });
        } else {
          showAlert('Exported', `File saved to: ${filePath}`);
        }
      }
    } catch (e) {
      showAlert('Error', 'Failed to export attendance data');
      console.error(e);
    } finally {
      setLoading('');
    }
  };

  const exportJSON = async () => {
    setLoading('json');
    try {
      const data = JSON.stringify({ visits, clients, exportedAt: new Date().toISOString() }, null, 2);
      const fileName = `fieldpulse_backup_${getToday()}.json`;

      if (Platform.OS === 'web') {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const filePath = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(filePath, data, { encoding: FileSystem.EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(filePath, { mimeType: 'application/json', dialogTitle: 'Export Backup' });
        } else {
          showAlert('Exported', `File saved to: ${filePath}`);
        }
      }
    } catch (e) {
      showAlert('Error', 'Failed to export data');
    } finally {
      setLoading('');
    }
  };

  const isMobile = useIsMobile();
  const sp = isMobile ? MobileSpacing : Spacing;

  const myWfoDates = new Set(agentOfficeHistory[currentUser.id] || []);
  const myWfoDays = myWfoDates.size;
  const visitsByDate = groupVisitsByDate(visits);
  const allActivityDates = isAgent
    ? Array.from(new Set([...Object.keys(visitsByDate), ...(agentOfficeHistory[currentUser.id] || [])]))
        .sort()
        .reverse()
        .slice(0, 60)
    : [];
  const myAttendanceCount = (agentOfficeHistory[currentUser.id] || []).length;
  const pageTitle = isAgent ? 'My Data Export' : 'Export Data';

  return (
    <ScrollView style={[styles.container, { padding: sp.lg }]} showsVerticalScrollIndicator={false}>
      {isAgent && (
        <View style={styles.agentHeader}>
          <View style={styles.agentHeaderIcon}>
            <Text style={styles.agentHeaderInitial}>{currentUser.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.agentHeaderName}>{currentUser.name}</Text>
            <Text style={styles.agentHeaderSub}>{visits.length} visits · {myWfoDays} office day{myWfoDays !== 1 ? 's' : ''} recorded</Text>
          </View>
        </View>
      )}

      {isAgent && (
        <Card>
          <Text style={styles.sectionTitle}>My Activity Log</Text>
          <Text style={styles.description}>Your visits and work location by day — most recent first.</Text>
          {allActivityDates.length === 0 ? (
            <Text style={styles.emptyText}>No activity recorded yet.</Text>
          ) : (
            allActivityDates.map((date) => {
              const dayVisits = visitsByDate[date] || [];
              const completedCount = dayVisits.filter((v) => v.status === 'completed').length;
              const isOffice = myWfoDates.has(date);
              return (
                <View key={date} style={styles.activityRow}>
                  <View style={styles.activityDateCol}>
                    <Text style={styles.activityDate}>{formatDate(date, 'EEE, MMM d')}</Text>
                    <Text style={styles.activityYear}>{formatDate(date, 'yyyy')}</Text>
                  </View>
                  <View style={styles.activityDetails}>
                    {dayVisits.length > 0 ? (
                      <Text style={styles.activityVisits}>
                        {dayVisits.length} visit{dayVisits.length !== 1 ? 's' : ''}
                        {completedCount > 0 ? ` · ${completedCount} completed` : ''}
                      </Text>
                    ) : (
                      <Text style={styles.activityNoVisits}>Office day, no visits</Text>
                    )}
                  </View>
                  <View style={[styles.locationBadge, isOffice ? styles.officeBadge : styles.fieldBadge]}>
                    <Text style={[styles.locationBadgeText, isOffice ? styles.officeBadgeText : styles.fieldBadgeText]}>
                      {isOffice ? 'Office' : 'Field'}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </Card>
      )}

      <Card>
        <Text style={styles.sectionTitle}>{isAgent ? 'My Visits (CSV)' : 'Export Visits (CSV)'}</Text>
        <Text style={styles.description}>
          {isAgent
            ? 'Download your visit history as a CSV file.'
            : 'Export visit records as CSV file for use in Excel, Google Sheets, or other tools.'}
        </Text>
        {exportOptions.map((opt) => (
          <View key={opt.label} style={styles.exportRow}>
            <View style={styles.exportInfo}>
              <Text style={styles.exportLabel}>{opt.label}</Text>
              <Text style={styles.exportDesc}>{opt.description} ({opt.visits.length} visits)</Text>
            </View>
            <Button
              title="Export"
              variant="outline"
              size="sm"
              onPress={() => exportCSV(opt.label, opt.visits)}
              loading={loading === opt.label}
              disabled={opt.visits.length === 0}
            />
          </View>
        ))}
      </Card>

      {!isAgent && (
        <Card>
          <Text style={styles.sectionTitle}>Full Backup (JSON)</Text>
          <Text style={styles.description}>
            Export all data including visits, clients, and settings as a JSON backup file.
          </Text>
          <Button
            title="Export Full Backup"
            variant="primary"
            onPress={exportJSON}
            loading={loading === 'json'}
            fullWidth
            style={styles.backupButton}
          />
        </Card>
      )}

      <Card>
        <Text style={styles.sectionTitle}>
          {isAgent ? 'My Office Days (CSV)' : 'Agent Attendance (CSV)'}
        </Text>
        <Text style={styles.description}>
          {isAgent
            ? 'Download a CSV of your office days — dates when you marked yourself as working from office.'
            : 'Export a record of which agents marked themselves as working from office vs. field, across all dates.'}
        </Text>
        <View style={styles.exportRow}>
          <View style={styles.exportInfo}>
            <Text style={styles.exportLabel}>
              {isAgent ? 'My Office Days' : 'All WFO Records'}
            </Text>
            <Text style={styles.exportDesc}>
              {isAgent
                ? `${myAttendanceCount} office day${myAttendanceCount !== 1 ? 's' : ''} recorded`
                : `${Object.values(officeHistory).reduce((s, d) => s + d.length, 0)} office day${Object.values(officeHistory).reduce((s, d) => s + d.length, 0) !== 1 ? 's' : ''} logged across ${Object.keys(officeHistory).length} agent${Object.keys(officeHistory).length !== 1 ? 's' : ''}`}
            </Text>
          </View>
          <Button
            title="Export"
            variant="outline"
            size="sm"
            onPress={exportAttendance}
            loading={loading === 'attendance'}
            disabled={isAgent
              ? myAttendanceCount === 0
              : Object.values(officeHistory).reduce((s, d) => s + d.length, 0) === 0}
          />
        </View>
      </Card>

      <Card variant="filled">
        <Text style={styles.infoTitle}>Data Retention</Text>
        <Text style={styles.infoText}>
          Your data is stored locally with a 6-month retention policy by default. 
          Export regularly to keep permanent records. You can adjust the retention 
          period in Settings.
        </Text>
      </Card>

      <View style={{ height: isMobile ? 60 : 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  exportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  exportInfo: { flex: 1, marginRight: Spacing.md },
  exportLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  exportDesc: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  backupButton: { marginTop: Spacing.md },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  activityDateCol: {
    width: 80,
  },
  activityDate: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  activityYear: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  activityDetails: {
    flex: 1,
  },
  activityVisits: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  activityNoVisits: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  locationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full ?? 99,
  },
  officeBadge: {
    backgroundColor: '#EEF2FF',
  },
  fieldBadge: {
    backgroundColor: '#F0FDF4',
  },
  locationBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  officeBadgeText: {
    color: '#4F46E5',
  },
  fieldBadgeText: {
    color: '#16A34A',
  },
  infoTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  agentHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentHeaderInitial: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textOnPrimary,
  },
  agentHeaderName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textOnPrimary,
  },
  agentHeaderSub: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});
