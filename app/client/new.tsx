import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../../store/useStore';
import { Colors, Spacing, MobileSpacing, FontSize, MobileFontSize, BorderRadius } from '../../constants/theme';
import Button from '../../components/ui/Button';
import { LeadStatus } from '../../types';
import { showAlert } from '../../utils/alert';
import { useIsMobile } from '../../utils/responsive';

const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

export default function NewClientScreen() {
  const { currentUser, addClient } = useStore();

  // Only admin can add clients — redirect agents
  useEffect(() => {
    if (currentUser?.role === 'field_agent') {
      router.back();
    }
  }, [currentUser]);

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [leadStatus, setLeadStatus] = useState<LeadStatus>('new');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      showAlert('Required', 'Please enter client name and phone number');
      return;
    }
    setLoading(true);
    try {
      await addClient({
        name: name.trim(),
        company: company.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim(),
        address: address.trim() || undefined,
        leadStatus,
        assignedTo: currentUser?.id || '',
        notes: notes.trim() || undefined,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      showAlert('Success', 'Client added successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      showAlert('Error', 'Failed to add client');
    } finally {
      setLoading(false);
    }
  };

  const isMobile = useIsMobile();
  const sp = isMobile ? MobileSpacing : Spacing;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={[styles.form, { padding: sp.lg }]}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Client Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor={Colors.textTertiary}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Company</Text>
          <TextInput
            style={styles.input}
            value={company}
            onChangeText={setCompany}
            placeholder="Company name"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Phone *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 98765 43210"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="phone-pad"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Street, City, State"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Lead Status</Text>
          <View style={styles.statusGrid}>
            {LEAD_STATUSES.map((s) => (
              <TouchableOpacity
                key={s.value}
                style={[styles.statusChip, leadStatus === s.value && styles.statusChipActive]}
                onPress={() => setLeadStatus(s.value)}
              >
                <Text style={[styles.statusText, leadStatus === s.value && styles.statusTextActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tags (comma separated)</Text>
          <TextInput
            style={styles.input}
            value={tags}
            onChangeText={setTags}
            placeholder="e.g. VIP, Enterprise, Retail"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes about this client..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <Button
          title="Add Client"
          onPress={handleSave}
          loading={loading}
          disabled={!name.trim() || !phone.trim()}
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
  row: { flexDirection: 'row', gap: Spacing.md },
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
  textArea: { minHeight: 80, paddingTop: Spacing.md },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statusChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  statusTextActive: {
    color: Colors.textOnPrimary,
  },
  saveButton: { marginTop: Spacing.lg },
});
