import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { Colors, Spacing, MobileSpacing, FontSize, MobileFontSize, BorderRadius, Shadow, LeadStatusColors } from '../../constants/theme';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/helpers';
import { Client, LeadStatus } from '../../types';
import { useIsMobile } from '../../utils/responsive';

const LEAD_FILTERS: { value: LeadStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

export default function ClientsScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const getMyClients = useStore((s) => s.getMyClients);
  const getTeamClients = useStore((s) => s.getTeamClients);
  const isAgent = currentUser?.role === 'field_agent';
  const clients = isAgent ? getMyClients() : getTeamClients();
  const [searchQuery, setSearchQuery] = useState('');
  const [leadFilter, setLeadFilter] = useState<LeadStatus | 'all'>('all');
  const isMobile = useIsMobile();
  const sp = isMobile ? MobileSpacing : Spacing;
  const fs = isMobile ? MobileFontSize : FontSize;

  const filteredClients = useMemo(() => {
    let result = [...clients];
    if (leadFilter !== 'all') {
      result = result.filter((c) => c.leadStatus === leadFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.company || '').toLowerCase().includes(q) ||
          c.phone.includes(q)
      );
    }
    result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return result;
  }, [clients, leadFilter, searchQuery]);

  const renderClientItem = ({ item }: { item: Client }) => (
    <TouchableOpacity onPress={() => router.push(`/client/${item.id}`)}>
      <Card style={{ ...styles.clientCard, marginBottom: sp.sm }}>
        <View style={[styles.clientHeader, { gap: sp.md, marginBottom: sp.sm }]}>
          <View style={[styles.avatar, isMobile && { width: 44, height: 44, borderRadius: 22 }]}>
            <Text style={[styles.avatarText, { fontSize: fs.lg }]}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.clientInfo}>
            <Text style={[styles.clientName, { fontSize: fs.md }]} numberOfLines={1}>{item.name}</Text>
            {item.company && <Text style={[styles.clientCompany, { fontSize: fs.sm }]}>{item.company}</Text>}
          </View>
          <StatusBadge status={item.leadStatus} type="lead" size="sm" />
        </View>
        <View style={[styles.clientMeta, { gap: sp.md, marginBottom: sp.sm }]}>
          <View style={styles.metaItem}>
            <Ionicons name="call-outline" size={isMobile ? 14 : 13} color={Colors.textTertiary} />
            <Text style={[styles.metaText, { fontSize: fs.xs }]}>{item.phone}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={isMobile ? 14 : 13} color={Colors.textTertiary} />
            <Text style={[styles.metaText, { fontSize: fs.xs }]}>{item.totalVisits} visits</Text>
          </View>
          {item.lastVisitDate && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={isMobile ? 14 : 13} color={Colors.textTertiary} />
              <Text style={[styles.metaText, { fontSize: fs.xs }]}>Last: {formatDate(item.lastVisitDate, 'MMM d')}</Text>
            </View>
          )}
        </View>
        {item.tags.length > 0 && (
          <View style={styles.tagRow}>
            {item.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={[styles.tag, { paddingHorizontal: sp.sm }]}>
                <Text style={[styles.tagText, { fontSize: fs.xs }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.searchSection, { paddingHorizontal: sp.lg, paddingTop: sp.md }]}>
        <View style={[styles.searchBar, { paddingHorizontal: sp.md, height: isMobile ? 48 : 44 }]}>
          <Ionicons name="search" size={isMobile ? 20 : 18} color={Colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { fontSize: fs.md }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search clients..."
            placeholderTextColor={Colors.textTertiary}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={isMobile ? 20 : 18} color={Colors.textTertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.filterRow}>
        <FlatList
          horizontal
          data={LEAD_FILTERS}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filterContainer, { paddingHorizontal: sp.lg, paddingVertical: sp.md, gap: sp.sm }]}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, { paddingHorizontal: sp.lg, paddingVertical: sp.sm }, leadFilter === item.value && styles.filterChipActive]}
              onPress={() => setLeadFilter(item.value)}
            >
              <Text style={[styles.filterChipText, { fontSize: fs.sm }, leadFilter === item.value && styles.filterChipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={[styles.resultsBar, { paddingHorizontal: sp.lg }]}>
        <Text style={[styles.resultsCount, { fontSize: fs.sm }]}>{filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.id}
        renderItem={renderClientItem}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: sp.lg, paddingBottom: isMobile ? 120 : 100 }]}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No clients found"
            subtitle="Add your first client to start managing leads"
            action={!isAgent ? <Button title="Add Client" onPress={() => router.push('/client/new')} size="sm" /> : undefined}
          />
        }
      />

      {!isAgent && (
        <TouchableOpacity style={[styles.fab, isMobile && styles.fabMobile]} onPress={() => router.push('/client/new')} activeOpacity={0.8}>
          <Ionicons name="person-add" size={24} color={Colors.textOnPrimary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  filterRow: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: '#E2E8F0',
    borderWidth: 2,
    borderColor: '#475569',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: '#1E293B',
  },
  filterChipTextActive: {
    color: Colors.textOnPrimary,
  },
  resultsBar: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  resultsCount: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  clientCard: { marginBottom: Spacing.sm },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textOnPrimary,
  },
  clientInfo: { flex: 1 },
  clientName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  clientCompany: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  clientMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  tagRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceVariant,
  },
  tagText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
  fabMobile: {
    bottom: 80,
    right: MobileSpacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
});
