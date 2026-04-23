import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { Colors, Spacing, MobileSpacing, FontSize, MobileFontSize, BorderRadius, Shadow, PurposeLabels } from '../../constants/theme';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate, formatTime, formatDuration } from '../../utils/helpers';
import { Visit, VisitStatus } from '../../types';
import { useIsMobile } from '../../utils/responsive';

const STATUS_FILTERS: { value: VisitStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'Active' },
  { value: 'completed', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function VisitsScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const allVisits = useStore((s) => s.visits);
  const getMyVisits = useStore((s) => s.getMyVisits);
  const getTeamVisits = useStore((s) => s.getTeamVisits);
  const getAvailableVisits = useStore((s) => s.getAvailableVisits);
  const isAgent = currentUser?.role === 'field_agent';
  // Agents see their own visits + available (unassigned) visits; Admin sees all
  const visits = isAgent ? [...getMyVisits(), ...getAvailableVisits()] : getTeamVisits();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<VisitStatus | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const isMobile = useIsMobile();
  const sp = isMobile ? MobileSpacing : Spacing;
  const fs = isMobile ? MobileFontSize : FontSize;

  const filteredVisits = useMemo(() => {
    let result = [...visits];
    if (statusFilter !== 'all') {
      result = result.filter((v) => v.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.clientName.toLowerCase().includes(q) ||
          v.notes.toLowerCase().includes(q) ||
          (v.outcome || '').toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      const cmp = b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
      return sortOrder === 'newest' ? cmp : -cmp;
    });
    return result;
  }, [visits, statusFilter, searchQuery, sortOrder]);

  const renderVisitItem = ({ item }: { item: Visit }) => (
    <TouchableOpacity onPress={() => router.push(`/visit/${item.id}`)}>
      <Card style={{ ...styles.visitCard, marginBottom: sp.sm }}>
        <View style={styles.visitHeader}>
          <View style={styles.visitInfo}>
            <Text style={[styles.visitClient, { fontSize: fs.md }]} numberOfLines={1}>{item.clientName}</Text>
            <Text style={[styles.visitDate, { fontSize: fs.sm }]}>{formatDate(item.date, 'EEE, MMM d, yyyy')}</Text>
          </View>
          <StatusBadge status={item.status} size="sm" />
        </View>
        {!item.userId || item.userId === '' ? (
          <View style={[styles.agentTag, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="hand-left-outline" size={12} color="#B45309" />
            <Text style={[styles.agentTagText, { color: '#B45309' }]}>
              {isAgent ? 'Available — Tap to pick up' : 'Unassigned'}
            </Text>
          </View>
        ) : !isAgent && item.assignedToName ? (
          <View style={styles.agentTag}>
            <Ionicons name="person-outline" size={12} color={Colors.primary} />
            <Text style={styles.agentTagText}>{item.assignedToName}</Text>
          </View>
        ) : null}
        <View style={styles.visitDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="flag-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{PurposeLabels[item.purpose] || item.purpose}</Text>
          </View>
          {item.checkInTime && (
            <View style={styles.detailItem}>
              <Ionicons name="log-in-outline" size={14} color={Colors.success} />
              <Text style={styles.detailText}>{formatTime(item.checkInTime)}</Text>
            </View>
          )}
          {item.duration ? (
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{formatDuration(item.duration)}</Text>
            </View>
          ) : null}
        </View>
        {item.notes ? (
          <Text style={styles.visitNotes} numberOfLines={2}>{item.notes}</Text>
        ) : null}
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.searchSection, { paddingHorizontal: sp.lg, paddingTop: sp.md, gap: sp.sm }]}>
        <View style={[styles.searchBar, { paddingHorizontal: sp.md, height: isMobile ? 48 : 44 }]}>
          <Ionicons name="search" size={isMobile ? 20 : 18} color={Colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { fontSize: fs.md }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search visits..."
            placeholderTextColor={Colors.textTertiary}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={isMobile ? 20 : 18} color={Colors.textTertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={[styles.sortButton, { width: isMobile ? 48 : 44, height: isMobile ? 48 : 44 }]}
          onPress={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
        >
          <Ionicons name={sortOrder === 'newest' ? 'arrow-down' : 'arrow-up'} size={isMobile ? 20 : 18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <FlatList
          horizontal
          data={STATUS_FILTERS}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filterContainer, { paddingHorizontal: sp.lg, paddingVertical: sp.md, gap: sp.sm }]}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, { paddingHorizontal: sp.lg, paddingVertical: sp.sm }, statusFilter === item.value && styles.filterChipActive]}
              onPress={() => setStatusFilter(item.value)}
            >
              <Text style={[styles.filterChipText, { fontSize: fs.sm }, statusFilter === item.value && styles.filterChipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={[styles.resultsBar, { paddingHorizontal: sp.lg }]}>
        <Text style={[styles.resultsCount, { fontSize: fs.sm }]}>{filteredVisits.length} visit{filteredVisits.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={filteredVisits}
        keyExtractor={(item) => item.id}
        renderItem={renderVisitItem}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: sp.lg, paddingBottom: isMobile ? 120 : 100 }]}
        ListEmptyComponent={
          <EmptyState
            icon="location-outline"
            title="No visits found"
            subtitle={searchQuery ? 'Try a different search term' : 'Start tracking your field visits'}
            action={!isAgent ? <Button title="Log a Visit" onPress={() => router.push('/visit/new')} size="sm" /> : undefined}
          />
        }
      />

      {!isAgent && (
        <TouchableOpacity style={[styles.fab, isMobile && styles.fabMobile]} onPress={() => router.push('/visit/new')} activeOpacity={0.8}>
          <Ionicons name="add" size={28} color={Colors.textOnPrimary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  sortButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterRow: {
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.textOnPrimary,
    fontWeight: '700',
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
  visitCard: { marginBottom: Spacing.sm },
  agentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.infoLight,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  agentTagText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  visitInfo: { flex: 1, marginRight: Spacing.sm },
  visitClient: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  visitDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  visitDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  visitNotes: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.xl,
  },
  fabMobile: {
    bottom: 80,
    right: MobileSpacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
});
