import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { Colors, Spacing, MobileSpacing, FontSize, MobileFontSize, BorderRadius, Shadow } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { showAlert } from '../../utils/alert';
import { formatDate, getToday, getWeekRange, getMonthRange, generateId } from '../../utils/helpers';
import { UserRole } from '../../types';
import { registerUser, isEmailTaken } from '../../utils/userDatabase';
import { useIsMobile } from '../../utils/responsive';

export default function TeamScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const teamMembers = useStore((s) => s.teamMembers);
  const visits = useStore((s) => s.visits);
  const addTeamMember = useStore((s) => s.addTeamMember);
  const updateTeamMember = useStore((s) => s.updateTeamMember);
  const removeTeamMember = useStore((s) => s.removeTeamMember);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('field_agent');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const today = getToday();
  const weekRange = getWeekRange();
  const monthRange = getMonthRange();

  const isAdmin = currentUser?.role === 'admin';
  const isMobile = useIsMobile();
  const sp = isMobile ? MobileSpacing : Spacing;
  const fs = isMobile ? MobileFontSize : FontSize;

  const visibleMembers = useMemo(() => {
    // Admin sees all team members (field agents)
    return teamMembers;
  }, [teamMembers]);

  const filteredMembers = useMemo(() => {
    let result = visibleMembers;
    if (filterStatus !== 'all') {
      result = result.filter((m) => m.status === filterStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.phone.includes(q)
      );
    }
    return result;
  }, [visibleMembers, filterStatus, searchQuery]);

  const getMemberStats = (memberId: string) => {
    const member = teamMembers.find((m) => m.id === memberId);
    const memberVisits = visits.filter((v) => v.userId === memberId || (member && v.assignedToName === member.name && v.userId));
    const todayVisits = memberVisits.filter((v) => v.date === today);
    const weekVisits = memberVisits.filter((v) => v.date >= weekRange.start && v.date <= weekRange.end);
    const monthVisits = memberVisits.filter((v) => v.date >= monthRange.start && v.date <= monthRange.end);
    const activeVisit = memberVisits.find((v) => v.status === 'in_progress');
    
    // Count completions by checkOutTime to catch visits completed today but scheduled for other dates
    const completedTodayByDate = todayVisits.filter((v) => v.status === 'completed').length;
    const completedTodayByCheckout = memberVisits.filter((v) => 
      v.status === 'completed' && v.checkOutTime && v.checkOutTime.startsWith(today)
    ).length;
    const todayCompleted = Math.max(completedTodayByDate, completedTodayByCheckout);
    
    return {
      today: Math.max(todayVisits.length, todayCompleted),
      todayCompleted,
      week: weekVisits.length,
      month: monthVisits.length,
      isActive: !!activeVisit,
      activeClient: activeVisit?.clientName,
    };
  };

  const teamStats = useMemo(() => {
    const memberNames = visibleMembers.map((m) => m.name);
    const memberIds = visibleMembers.map((m) => m.id);
    const allTeamVisits = visits.filter((v) => memberIds.includes(v.userId) || (v.assignedToName && memberNames.includes(v.assignedToName) && v.userId));
    const todayVisits = allTeamVisits.filter((v) => v.date === today);
    const weekVisits = allTeamVisits.filter((v) => v.date >= weekRange.start && v.date <= weekRange.end);
    
    // Count completions by checkOutTime as well
    const completedTodayByDate = todayVisits.filter((v) => v.status === 'completed').length;
    const completedTodayByCheckout = allTeamVisits.filter((v) => 
      v.status === 'completed' && v.checkOutTime && v.checkOutTime.startsWith(today)
    ).length;
    
    return {
      totalMembers: visibleMembers.length,
      activeMembers: visibleMembers.filter((m) => m.status === 'active').length,
      todayVisits: todayVisits.length,
      todayCompleted: Math.max(completedTodayByDate, completedTodayByCheckout),
      weekVisits: weekVisits.length,
      agentsInField: visibleMembers.filter((m) => {
        const mv = visits.find((v) => (v.userId === m.id || v.assignedToName === m.name) && v.status === 'in_progress');
        return !!mv;
      }).length,
    };
  }, [visibleMembers, visits, today]);

  const handleAddMember = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      showAlert('Required', 'Please enter name and phone number');
      return;
    }
    if (!newEmail.trim()) {
      showAlert('Required', 'Please enter an email address (used for login)');
      return;
    }
    if (!newPassword.trim() || newPassword.trim().length < 6) {
      showAlert('Required', 'Please set a password (min 6 characters)');
      return;
    }
    if (isEmailTaken(newEmail)) {
      showAlert('Error', 'A user with this email already exists');
      return;
    }

    const memberId = generateId();

    // Register in user database so they can log in
    try {
      await registerUser({
        id: memberId,
        name: newName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim(),
        password: newPassword.trim(),
        role: 'field_agent',
      });
    } catch (e: any) {
      showAlert('Error', e.message || 'Failed to register user');
      return;
    }

    await addTeamMember({
      id: memberId,
      name: newName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
      role: 'field_agent',
      status: 'active',
    });
    showAlert('Success', `${newName.trim()} can now log in with:\nEmail: ${newEmail.trim()}\nPassword: ${newPassword.trim()}`);
    setShowAddModal(false);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewPassword('');
    setShowNewPassword(false);
    setNewRole('field_agent');
  };

  const handleToggleStatus = (memberId: string, currentStatus: 'active' | 'inactive') => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    showAlert(
      `${newStatus === 'active' ? 'Activate' : 'Deactivate'} Member`,
      `Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this team member?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => updateTeamMember(memberId, { status: newStatus }),
        },
      ]
    );
  };

  const handleRemove = (memberId: string, name: string) => {
    showAlert('Remove Member', `Remove ${name} from the team? Their visit history will be preserved.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeTeamMember(memberId),
      },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { padding: sp.lg }]} showsVerticalScrollIndicator={false}>
      {/* Team Overview */}
      <View style={[styles.overviewGrid, { gap: sp.sm, marginBottom: sp.lg }]}>
        <Card style={styles.overviewCard}>
          <Text style={[styles.overviewValue, { color: Colors.primary }]}>{teamStats.totalMembers}</Text>
          <Text style={styles.overviewLabel}>Total Members</Text>
        </Card>
        <Card style={styles.overviewCard}>
          <Text style={[styles.overviewValue, { color: Colors.success }]}>{teamStats.activeMembers}</Text>
          <Text style={styles.overviewLabel}>Active</Text>
        </Card>
        <Card style={styles.overviewCard}>
          <Text style={[styles.overviewValue, { color: Colors.accent }]}>{teamStats.agentsInField}</Text>
          <Text style={styles.overviewLabel}>In Field</Text>
        </Card>
        <Card style={styles.overviewCard}>
          <Text style={[styles.overviewValue, { color: Colors.secondary }]}>{teamStats.todayCompleted}/{teamStats.todayVisits}</Text>
          <Text style={styles.overviewLabel}>Today</Text>
        </Card>
      </View>

      {/* Search & Filter */}
      <View style={[styles.controls, { marginBottom: sp.lg }]}>
        <View style={[styles.searchBox, { marginBottom: sp.md }]}>
          <Ionicons name="search-outline" size={isMobile ? 20 : 18} color={Colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { fontSize: fs.md, paddingVertical: sp.md }]}
            placeholder="Search members..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={[styles.filterRow, { gap: sp.sm }]}>
          {(['all', 'active', 'inactive'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.filterChip, { paddingHorizontal: sp.lg, paddingVertical: sp.sm }, filterStatus === s && styles.filterChipActive]}
              onPress={() => setFilterStatus(s)}
            >
              <Text style={[styles.filterText, { fontSize: fs.sm }, filterStatus === s && styles.filterTextActive]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Member List */}
      {filteredMembers.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="people-outline" size={40} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>No team members found</Text>
          <Button title="Add Member" variant="primary" size="sm" onPress={() => setShowAddModal(true)} />
        </Card>
      ) : (
        filteredMembers.map((member) => {
          const stats = getMemberStats(member.id);
          return (
            <Card key={member.id} style={styles.memberCard}>
              <View style={styles.memberHeader}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.avatarText}>{member.name.charAt(0).toUpperCase()}</Text>
                  <View style={[styles.statusDot, { backgroundColor: member.status === 'active' ? Colors.success : Colors.textTertiary }]} />
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>Field Agent</Text>
                  <View style={styles.contactRow}>
                    <Ionicons name="call-outline" size={12} color={Colors.textTertiary} />
                    <Text style={styles.contactText}>{member.phone}</Text>
                  </View>
                </View>
                {stats.isActive && (
                  <View style={styles.inFieldBadge}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.inFieldText}>In Field</Text>
                  </View>
                )}
              </View>

              {/* Member Stats */}
              <View style={styles.memberStats}>
                <View style={styles.memberStat}>
                  <Text style={styles.memberStatValue}>{stats.today}</Text>
                  <Text style={styles.memberStatLabel}>Today</Text>
                </View>
                <View style={styles.memberStat}>
                  <Text style={styles.memberStatValue}>{stats.todayCompleted}</Text>
                  <Text style={styles.memberStatLabel}>Done</Text>
                </View>
                <View style={styles.memberStat}>
                  <Text style={styles.memberStatValue}>{stats.week}</Text>
                  <Text style={styles.memberStatLabel}>This Week</Text>
                </View>
                <View style={styles.memberStat}>
                  <Text style={styles.memberStatValue}>{stats.month}</Text>
                  <Text style={styles.memberStatLabel}>This Month</Text>
                </View>
              </View>

              {stats.isActive && stats.activeClient && (
                <View style={styles.activeVisitBanner}>
                  <Ionicons name="location" size={14} color={Colors.success} />
                  <Text style={styles.activeVisitText}>Currently at: {stats.activeClient}</Text>
                </View>
              )}

              {/* Actions */}
              <View style={styles.memberActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleToggleStatus(member.id, member.status)}
                >
                  <Ionicons
                    name={member.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
                    size={20}
                    color={member.status === 'active' ? Colors.warning : Colors.success}
                  />
                  <Text style={[styles.actionText, { color: member.status === 'active' ? Colors.warning : Colors.success }]}>
                    {member.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleRemove(member.id, member.name)}
                >
                  <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                  <Text style={[styles.actionText, { color: Colors.danger }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </Card>
          );
        })
      )}

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, isMobile && styles.fabMobile]} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
        <Ionicons name="person-add" size={24} color={Colors.textOnPrimary} />
      </TouchableOpacity>

      {/* Add Member Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Team Member</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Full name"
                  placeholderTextColor={Colors.textTertiary}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email * (used for login)</Text>
                <TextInput
                  style={styles.input}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  placeholder="email@fieldpulse.in"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone *</Text>
                <TextInput
                  style={styles.input}
                  value={newPhone}
                  onChangeText={setNewPhone}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Login Password *</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={styles.passwordInput}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Min 6 characters"
                    placeholderTextColor={Colors.textTertiary}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeBtn}>
                    <Ionicons name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              </View>

              <Button
                title="Add Member"
                onPress={handleAddMember}
                fullWidth
                size="lg"
                disabled={!newName.trim() || !newPhone.trim() || !newEmail.trim() || !newPassword.trim()}
                style={{ marginTop: Spacing.lg }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={{ height: isMobile ? 100 : 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  overviewCard: {
    width: '48%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  overviewValue: { fontSize: FontSize.xxl, fontWeight: '800' },
  overviewLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2, fontWeight: '500' },
  controls: { marginBottom: Spacing.lg },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  filterRow: { flexDirection: 'row', gap: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: Colors.textOnPrimary },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.lg },
  emptyText: { fontSize: FontSize.md, color: Colors.textTertiary },
  memberCard: { marginBottom: Spacing.md },
  memberHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textOnPrimary },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  memberRole: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 1 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  contactText: { fontSize: FontSize.xs, color: Colors.textTertiary },
  inFieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  inFieldText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.success },
  memberStats: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  memberStat: { flex: 1, alignItems: 'center' },
  memberStatValue: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
  memberStatLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  activeVisitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  activeVisitText: { fontSize: FontSize.sm, color: Colors.success, fontWeight: '500' },
  memberActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.xl,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: FontSize.sm, fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  fabMobile: {
    bottom: 80,
    right: MobileSpacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text },
  inputGroup: { marginBottom: Spacing.xl },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  eyeBtn: {
    padding: Spacing.md,
  },
  roleRow: { flexDirection: 'row', gap: Spacing.sm },
  roleChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  roleChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  roleText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  roleTextActive: { color: Colors.textOnPrimary },
});
