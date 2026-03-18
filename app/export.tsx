import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Redirect } from 'expo-router';
import { useStore } from '../store/useStore';
import { Colors, Spacing, MobileSpacing, FontSize, MobileFontSize, BorderRadius, Shadow } from '../constants/theme';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { generateCSVFromVisits, formatDate, getToday, getMonthRange, getWeekRange } from '../utils/helpers';
import { showAlert } from '../utils/alert';
import { useIsMobile } from '../utils/responsive';

export default function ExportScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const visits = useStore((s) => s.visits);
  const clients = useStore((s) => s.clients);
  const [loading, setLoading] = useState('');

  // Only admin can access the export screen
  if (currentUser?.role !== 'admin') {
    return <Redirect href="/(tabs)" />;
  }

  const exportCSV = async (filterLabel: string, filteredVisits: typeof visits) => {
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

  return (
    <ScrollView style={[styles.container, { padding: sp.lg }]} showsVerticalScrollIndicator={false}>
      <Card>
        <Text style={styles.sectionTitle}>Export Visits (CSV)</Text>
        <Text style={styles.description}>
          Export visit records as CSV file for use in Excel, Google Sheets, or other tools.
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
});
