import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { Colors, Spacing, MobileSpacing, FontSize, MobileFontSize, BorderRadius, Shadow, PurposeLabels } from '../../constants/theme';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import { formatDate } from '../../utils/helpers';
import { showAlert } from '../../utils/alert';
import { Client } from '../../types';
import { useIsMobile } from '../../utils/responsive';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const clients = useStore((s) => s.clients);
  const visits = useStore((s) => s.visits);
  const deleteClient = useStore((s) => s.deleteClient);

  const client = useMemo(() => clients.find((c) => c.id === id), [clients, id]);
  const clientVisits = useMemo(
    () => visits.filter((v) => v.clientId === id).sort((a, b) => b.date.localeCompare(a.date)),
    [visits, id]
  );

  const handleDelete = () => {
    showAlert('Delete Client', 'This will remove the client but keep visit history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (client) {
            await deleteClient(client.id);
            router.back();
          }
        },
      },
    ]);
  };

  const isMobile = useIsMobile();
  const sp = isMobile ? MobileSpacing : Spacing;
  const fs = isMobile ? MobileFontSize : FontSize;

  if (!client) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Client not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { padding: sp.lg }]} showsVerticalScrollIndicator={false}>
      {/* Client Header */}
      <View style={[styles.header, { paddingVertical: sp.xxl, gap: sp.sm }]}>
        <View style={[styles.avatar, isMobile && { width: 80, height: 80, borderRadius: 40 }]}>
          <Text style={[styles.avatarText, { fontSize: fs.xxxl }]}>{client.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={[styles.clientName, { fontSize: fs.xxl }]}>{client.name}</Text>
        {client.company && <Text style={styles.clientCompany}>{client.company}</Text>}
        <StatusBadge status={client.leadStatus} type="lead" />
      </View>

      {/* Contact Info */}
      <Card>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.contactRow}>
          <Ionicons name="call-outline" size={18} color={Colors.primary} />
          <Text style={styles.contactText}>{client.phone}</Text>
        </View>
        {client.email && (
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={18} color={Colors.primary} />
            <Text style={styles.contactText}>{client.email}</Text>
          </View>
        )}
        {client.address && (
          <View style={styles.contactRow}>
            <Ionicons name="location-outline" size={18} color={Colors.primary} />
            <Text style={styles.contactText}>{client.address}</Text>
          </View>
        )}
      </Card>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{client.totalVisits}</Text>
          <Text style={styles.statLabel}>Total Visits</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>
            {client.lastVisitDate ? formatDate(client.lastVisitDate, 'MMM d') : 'N/A'}
          </Text>
          <Text style={styles.statLabel}>Last Visit</Text>
        </Card>
      </View>

      {/* Tags */}
      {client.tags.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagRow}>
            {client.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Notes */}
      {client.notes && (
        <Card>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{client.notes}</Text>
        </Card>
      )}

      {/* Visit History */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Visit History</Text>
          <Button
            title="New Visit"
            variant="outline"
            size="sm"
            onPress={() => router.push('/visit/new')}
          />
        </View>
        {clientVisits.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No visits recorded yet</Text>
          </Card>
        ) : (
          clientVisits.slice(0, 10).map((visit) => (
            <TouchableOpacity key={visit.id} onPress={() => router.push(`/visit/${visit.id}`)}>
              <Card style={styles.visitCard}>
                <View style={styles.visitRow}>
                  <View style={styles.visitInfo}>
                    <Text style={styles.visitDate}>{formatDate(visit.date, 'MMM d, yyyy')}</Text>
                    <Text style={styles.visitPurpose}>{PurposeLabels[visit.purpose] || visit.purpose}</Text>
                  </View>
                  <StatusBadge status={visit.status} size="sm" />
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button title="Delete Client" variant="danger" onPress={handleDelete} fullWidth size="sm" />
      </View>

      <View style={{ height: isMobile ? 60 : 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: FontSize.lg, color: Colors.textTertiary },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    color: Colors.textOnPrimary,
  },
  clientName: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
  clientCompany: { fontSize: FontSize.md, color: Colors.textSecondary },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  contactText: { fontSize: FontSize.md, color: Colors.text },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  statValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceVariant,
  },
  tagText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  notesText: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },
  section: { marginTop: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: FontSize.md, color: Colors.textTertiary },
  visitCard: { marginBottom: Spacing.xs },
  visitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visitInfo: {},
  visitDate: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  visitPurpose: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  actions: { marginTop: Spacing.xxxl },
});
