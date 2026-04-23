import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { Colors, Spacing, MobileSpacing, FontSize, MobileFontSize, BorderRadius, Shadow, PurposeLabels } from '../../constants/theme';
import Button from '../../components/ui/Button';
import { getToday } from '../../utils/helpers';
import { showAlert } from '../../utils/alert';
import { VisitPurpose } from '../../types';
import { useIsMobile } from '../../utils/responsive';

const PURPOSES: { value: VisitPurpose; label: string }[] = [
  { value: 'collection', label: 'Collection' },
  { value: 'new_enquiry', label: 'New Enquiry' },
  { value: 'trial', label: 'Trial' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'other', label: 'Other' },
];

export default function NewVisitScreen() {
  const { clients, currentUser, addVisit } = useStore();

  // Only admin can create visits — redirect agents
  useEffect(() => {
    if (currentUser?.role === 'field_agent') {
      router.back();
    }
  }, [currentUser]);

  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [date, setDate] = useState(getToday());
  const [scheduledTime, setScheduledTime] = useState('');
  const [purpose, setPurpose] = useState<VisitPurpose>('follow_up');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const q = clientSearch.toLowerCase();
    return clients.filter((c) => c.name.toLowerCase().includes(q) || (c.company || '').toLowerCase().includes(q));
  }, [clients, clientSearch]);

  const handleSave = async () => {
    if (!clientName.trim()) {
      showAlert('Required', 'Please enter a client name');
      return;
    }
    setLoading(true);
    try {
      // Admin creates unassigned visits — agents pick them up later
      const targetUserId = '';
      const targetUserName = '';

      await addVisit({
        userId: targetUserId,
        assignedBy: currentUser?.id || '',
        assignedToName: targetUserName,
        clientId: clientId || 'manual-' + Date.now(),
        clientName: clientName.trim(),
        date,
        scheduledTime: scheduledTime || undefined,
        status: 'planned',
        purpose,
        notes: notes.trim(),
        photos: [],
      });
      const msg = 'Visit planned. Field agents can now pick it up.';
      showAlert('Success', msg, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      showAlert('Error', 'Failed to create visit');
    } finally {
      setLoading(false);
    }
  };

  const isMobile = useIsMobile();
  const sp = isMobile ? MobileSpacing : Spacing;
  const fs = isMobile ? MobileFontSize : FontSize;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={[styles.form, { padding: sp.lg }]}>

        {/* Info banner for admin */}
        {isAdmin && (
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.infoBannerText}>
              This visit will be available for all field agents to pick up.
            </Text>
          </View>
        )}

        {/* Client Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Client Name *</Text>
          <TextInput
            style={styles.input}
            value={clientName}
            onChangeText={setClientName}
            placeholder="Enter client name"
            placeholderTextColor={Colors.textTertiary}
          />
          {clients.length > 0 && !showClientPicker && (
            <TouchableOpacity onPress={() => setShowClientPicker(true)} style={styles.pickClientBtn}>
              <Ionicons name="people-outline" size={16} color={Colors.primary} />
              <Text style={styles.pickClientText}>Choose from existing clients</Text>
            </TouchableOpacity>
          )}
          {showClientPicker && (
            <View style={styles.dropdownContainer}>
              <View style={styles.dropdownHeader}>
                <View style={styles.dropdownSearchRow}>
                  <Ionicons name="search-outline" size={16} color={Colors.textTertiary} />
                  <TextInput
                    style={styles.dropdownSearchInput}
                    placeholder="Search clients..."
                    placeholderTextColor={Colors.textTertiary}
                    value={clientSearch}
                    onChangeText={setClientSearch}
                    autoFocus
                  />
                </View>
                <TouchableOpacity onPress={() => { setShowClientPicker(false); setClientSearch(''); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={22} color={Colors.textTertiary} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={filteredClients}
                keyExtractor={(c) => c.id}
                style={styles.dropdownList}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <View style={styles.dropdownEmpty}>
                    <Text style={styles.dropdownEmptyText}>No clients found</Text>
                  </View>
                }
                renderItem={({ item: c }) => (
                  <TouchableOpacity
                    style={[styles.dropdownItem, clientId === c.id && styles.dropdownItemActive]}
                    onPress={() => {
                      setClientId(c.id);
                      setClientName(c.name);
                      setShowClientPicker(false);
                      setClientSearch('');
                    }}
                  >
                    <View style={[styles.dropdownAvatar, { backgroundColor: Colors.secondary }]}>
                      <Text style={styles.dropdownAvatarText}>{c.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dropdownItemText}>{c.name}</Text>
                      {c.company ? <Text style={styles.dropdownItemSub}>{c.company}</Text> : null}
                    </View>
                    {clientId === c.id && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        {/* Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Visit Date</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>

        {/* Scheduled Time */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Scheduled Time (optional)</Text>
          <TextInput
            style={styles.input}
            value={scheduledTime}
            onChangeText={setScheduledTime}
            placeholder="e.g. 10:00 AM"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>

        {/* Purpose */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Visit Purpose</Text>
          <View style={styles.purposeGrid}>
            {PURPOSES.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[styles.purposeChip, purpose === p.value && styles.purposeChipActive]}
                onPress={() => setPurpose(p.value)}
              >
                <Text style={[styles.purposeText, purpose === p.value && styles.purposeTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add visit notes, agenda, or objectives..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <Button
          title="Plan Visit for Agents"
          onPress={handleSave}
          loading={loading}
          disabled={!clientName.trim()}
          fullWidth
          size="lg"
          style={styles.saveButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  form: { padding: Spacing.lg },
  inputGroup: { marginBottom: Spacing.xl },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    fontSize: FontSize.md,
    color: Colors.text,
    backgroundColor: Colors.surface,
    minHeight: 48,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  // Info banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.infoLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  infoBannerText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  // Shared dropdown styles
  dropdownContainer: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surfaceVariant,
    gap: Spacing.sm,
  },
  dropdownSearchRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
    paddingVertical: Spacing.xs,
  },
  dropdownList: {
    maxHeight: 220,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.md,
  },
  dropdownItemActive: {
    backgroundColor: Colors.infoLight,
  },
  dropdownAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownAvatarText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textOnPrimary,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '600',
  },
  dropdownItemSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  dropdownEmpty: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  // Client picker button
  pickClientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    padding: Spacing.sm,
  },
  pickClientText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  purposeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  purposeChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  purposeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  purposeText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  purposeTextActive: {
    color: Colors.textOnPrimary,
    fontWeight: '700',
  },
  saveButton: {
    marginTop: Spacing.lg,
  },
});
