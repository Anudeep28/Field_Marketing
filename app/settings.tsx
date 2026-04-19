import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useStore } from '../store/useStore';
import { Colors, Spacing, MobileSpacing, FontSize, MobileFontSize, BorderRadius } from '../constants/theme';
import Card from '../components/ui/Card';
import { useIsMobile } from '../utils/responsive';

export default function SettingsScreen() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const currentUser = useStore((s) => s.currentUser);

  const isAgent = currentUser?.role === 'field_agent';

  const isMobile = useIsMobile();
  const sp = isMobile ? MobileSpacing : Spacing;
  const fs = isMobile ? MobileFontSize : FontSize;

  return (
    <ScrollView style={[styles.container, { padding: sp.lg }]} showsVerticalScrollIndicator={false}>
      {!isAgent && (
        <Card>
          <Text style={styles.sectionTitle}>Data Retention</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Retention Period</Text>
              <Text style={styles.settingDesc}>
                Records older than {settings.dataRetentionMonths} months will be automatically cleaned up
              </Text>
            </View>
            <View style={styles.stepper}>
              <Text
                style={styles.stepperBtn}
                onPress={() => updateSettings({ dataRetentionMonths: Math.max(1, settings.dataRetentionMonths - 1) })}
              >
                −
              </Text>
              <Text style={styles.stepperValue}>{settings.dataRetentionMonths}mo</Text>
              <Text
                style={styles.stepperBtn}
                onPress={() => updateSettings({ dataRetentionMonths: Math.min(24, settings.dataRetentionMonths + 1) })}
              >
                +
              </Text>
            </View>
          </View>
        </Card>
      )}

      <Card>
        <Text style={styles.sectionTitle}>Visit Settings</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto Check-out</Text>
            <Text style={styles.settingDesc}>
              Automatically check out after {settings.autoCheckoutMinutes} minutes
            </Text>
          </View>
          <Switch
            value={settings.autoCheckout}
            onValueChange={(v) => updateSettings({ autoCheckout: v })}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={settings.autoCheckout ? Colors.primary : Colors.textTertiary}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Require Photos</Text>
            <Text style={styles.settingDesc}>Require at least one photo per visit</Text>
          </View>
          <Switch
            value={settings.requirePhotos}
            onValueChange={(v) => updateSettings({ requirePhotos: v })}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={settings.requirePhotos ? Colors.primary : Colors.textTertiary}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Require Notes</Text>
            <Text style={styles.settingDesc}>Require notes for every visit</Text>
          </View>
          <Switch
            value={settings.requireNotes}
            onValueChange={(v) => updateSettings({ requireNotes: v })}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={settings.requireNotes ? Colors.primary : Colors.textTertiary}
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Offline Mode</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Enable Offline Mode</Text>
            <Text style={styles.settingDesc}>All data is stored locally and works without internet</Text>
          </View>
          <Switch
            value={settings.enableOfflineMode}
            onValueChange={(v) => updateSettings({ enableOfflineMode: v })}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={settings.enableOfflineMode ? Colors.primary : Colors.textTertiary}
          />
        </View>
      </Card>

      <Card variant="filled">
        <Text style={styles.aboutTitle}>FieldPulse v1.0.0</Text>
        <Text style={styles.aboutText}>
          Marketing Visit Tracker for field teams. Built with Expo for iOS, Android, and Web.
        </Text>
        <Text style={styles.aboutText}>
          Data is stored locally on your device. Export regularly for backup.
        </Text>
      </Card>

      <View style={{ height: isMobile ? 60 : 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  settingInfo: { flex: 1, marginRight: Spacing.lg },
  settingLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  settingDesc: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2, lineHeight: 18 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  stepperBtn: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.primary,
    paddingHorizontal: Spacing.sm,
  },
  stepperValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    minWidth: 36,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  aboutTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  aboutText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
});
