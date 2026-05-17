import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../../store/useStore';
import { Colors, Spacing, MobileSpacing, FontSize, MobileFontSize, BorderRadius } from '../../constants/theme';
import Button from '../../components/ui/Button';
import { showAlert } from '../../utils/alert';
import { useIsMobile } from '../../utils/responsive';

export default function NewClientScreen() {
  const { currentUser, addClient } = useStore();

  // Only admin can add clients — redirect agents
  useEffect(() => {
    if (currentUser?.role === 'field_agent') {
      router.back();
    }
  }, [currentUser]);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('Required', 'Please enter company name');
      return;
    }
    setLoading(true);
    try {
      await addClient({
        name: name.trim(),
        company: name.trim() || undefined,
        phone: '',
        address: address.trim() || undefined,
        leadStatus: 'not_defined',
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
          <Text style={styles.label}>Company Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter company name"
            placeholderTextColor={Colors.textTertiary}
            autoCapitalize="words"
          />
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
          disabled={!name.trim()}
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
  saveButton: { marginTop: Spacing.lg },
});
