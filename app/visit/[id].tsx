import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useStore } from '../../store/useStore';
import { Colors, Spacing, MobileSpacing, FontSize, MobileFontSize, BorderRadius, Shadow, PurposeLabels, VisitStatusLabels } from '../../constants/theme';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import { formatDate, formatTime, formatDuration } from '../../utils/helpers';
import { showAlert } from '../../utils/alert';
import { Visit } from '../../types';
import { useIsMobile } from '../../utils/responsive';

export default function VisitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const visits = useStore((s) => s.visits);
  const currentUser = useStore((s) => s.currentUser);
  const checkIn = useStore((s) => s.checkIn);
  const checkOut = useStore((s) => s.checkOut);
  const updateVisit = useStore((s) => s.updateVisit);
  const deleteVisit = useStore((s) => s.deleteVisit);
  const pickVisit = useStore((s) => s.pickVisit);

  const isAgent = currentUser?.role === 'field_agent';

  const [visit, setVisit] = useState<Visit | null>(null);
  const [outcome, setOutcome] = useState('');
  const [showOutcome, setShowOutcome] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const found = visits.find((v) => v.id === id);
    if (found) {
      setVisit(found);
      setOutcome(found.outcome || '');
    }
  }, [visits, id]);

  const getLocation = async () => {
    try {
      console.log('Requesting location permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('Location permission status:', status);
      
      if (status !== 'granted') {
        console.log('Location permission denied, using fallback');
        // Geolocation is blocked on non-HTTPS origins (e.g. LAN access).
        // Fall back to a placeholder so check-in/out still works.
        return {
          latitude: 0,
          longitude: 0,
          address: 'Location unavailable (HTTP)',
        };
      }
      
      console.log('Getting current position...');
      const loc = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Balanced
      });
      console.log('Got location:', loc.coords);
      
      let address = '';
      try {
        const [geo] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (geo) {
          address = [geo.street, geo.city, geo.region].filter(Boolean).join(', ');
        }
      } catch (geoError) {
        console.log('Reverse geocoding failed:', geoError);
      }
      
      return {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        address: address || 'Address unavailable',
      };
    } catch (e) {
      console.error('Location error:', e);
      // Fallback for any geolocation error (timeout, unavailable, etc.)
      return {
        latitude: 0,
        longitude: 0,
        address: 'Location unavailable',
      };
    }
  };

  const handleCheckIn = async () => {
    if (!visit) return;
    setLoading(true);
    try {
      const location = await getLocation();
      await checkIn(visit.id, location);
    } catch (error) {
      console.error('Check-in failed:', error);
      showAlert('Check-in Failed', 'Unable to check in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!visit) return;
    setShowOutcome(true);
  };

  const confirmCheckOut = async () => {
    if (!visit) return;
    setLoading(true);
    try {
      const location = await getLocation();
      await checkOut(visit.id, location, outcome);
      setShowOutcome(false);
    } catch (error) {
      console.error('Check-out failed:', error);
      showAlert('Check-out Failed', 'Unable to check out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    showAlert('Cancel Visit', 'Are you sure you want to cancel this visit?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          if (visit) {
            await updateVisit(visit.id, { status: 'cancelled' });
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    showAlert('Delete Visit', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (visit) {
            await deleteVisit(visit.id);
            router.back();
          }
        },
      },
    ]);
  };

  const isMobile = useIsMobile();
  const sp = isMobile ? MobileSpacing : Spacing;
  const fs = isMobile ? MobileFontSize : FontSize;

  if (!visit) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Visit not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { padding: sp.lg }]} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerInfo}>
            <Text style={[styles.clientName, { fontSize: fs.xxl }]}>{visit.clientName}</Text>
            <Text style={[styles.dateText, { fontSize: fs.md }]}>{formatDate(visit.date, 'EEEE, MMMM d, yyyy')}</Text>
          </View>
          <StatusBadge status={visit.status} />
        </View>

        {/* Assignment info */}
        {visit.assignedBy && visit.assignedBy !== visit.userId && visit.assignedToName && (
          <View style={styles.assignmentBanner}>
            <Ionicons name="arrow-forward-circle" size={16} color={Colors.primary} />
            <Text style={styles.assignmentText}>
              Assigned to <Text style={styles.assignmentBold}>{visit.assignedToName}</Text>
            </Text>
          </View>
        )}

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Ionicons name="flag" size={16} color={Colors.primary} />
            <Text style={styles.detailLabel}>Purpose</Text>
            <Text style={styles.detailValue}>{PurposeLabels[visit.purpose] || visit.purpose}</Text>
          </View>
          {visit.scheduledTime && (
            <View style={styles.detailItem}>
              <Ionicons name="time" size={16} color={Colors.primary} />
              <Text style={styles.detailLabel}>Scheduled</Text>
              <Text style={styles.detailValue}>{visit.scheduledTime}</Text>
            </View>
          )}
          {visit.duration !== undefined && visit.duration > 0 && (
            <View style={styles.detailItem}>
              <Ionicons name="hourglass" size={16} color={Colors.primary} />
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>{formatDuration(visit.duration)}</Text>
            </View>
          )}
        </View>
      </Card>

      {/* Check-in/out Times */}
      {(visit.checkInTime || visit.checkOutTime) && (
        <Card>
          <Text style={styles.sectionTitle}>Timeline</Text>
          {visit.checkInTime && (
            <View style={styles.timelineRow}>
              <Ionicons name="log-in" size={18} color={Colors.success} />
              <View style={styles.timelineInfo}>
                <Text style={styles.timelineLabel}>Checked In</Text>
                <Text style={styles.timelineValue}>{formatTime(visit.checkInTime)}</Text>
                {visit.checkInLocation?.address && (
                  <Text style={styles.timelineAddress}>{visit.checkInLocation.address}</Text>
                )}
              </View>
            </View>
          )}
          {visit.checkOutTime && (
            <View style={styles.timelineRow}>
              <Ionicons name="log-out" size={18} color={Colors.danger} />
              <View style={styles.timelineInfo}>
                <Text style={styles.timelineLabel}>Checked Out</Text>
                <Text style={styles.timelineValue}>{formatTime(visit.checkOutTime)}</Text>
                {visit.checkOutLocation?.address && (
                  <Text style={styles.timelineAddress}>{visit.checkOutLocation.address}</Text>
                )}
              </View>
            </View>
          )}
        </Card>
      )}

      {/* Notes */}
      {visit.notes ? (
        <Card>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{visit.notes}</Text>
        </Card>
      ) : null}

      {/* Outcome */}
      {visit.outcome ? (
        <Card>
          <Text style={styles.sectionTitle}>Outcome</Text>
          <Text style={styles.notesText}>{visit.outcome}</Text>
        </Card>
      ) : null}

      {/* Outcome Input (for checkout) */}
      {showOutcome && (
        <Card style={styles.outcomeCard}>
          <Text style={styles.sectionTitle}>Visit Outcome</Text>
          <TextInput
            style={styles.outcomeInput}
            value={outcome}
            onChangeText={setOutcome}
            placeholder="Describe the outcome of this visit..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <View style={styles.outcomeActions}>
            <Button title="Cancel" variant="ghost" size="sm" onPress={() => setShowOutcome(false)} />
            <Button title="Complete Check-Out" variant="primary" size="sm" onPress={confirmCheckOut} loading={loading} />
          </View>
        </Card>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {/* Unassigned visit: agent can pick it up */}
        {visit.status === 'planned' && isAgent && (!visit.userId || visit.userId === '') && (
          <Button
            title="Pick Up This Visit"
            onPress={async () => {
              setLoading(true);
              await pickVisit(visit.id);
              showAlert('Picked Up', 'This visit is now assigned to you. You can check in when you arrive.');
              setLoading(false);
            }}
            loading={loading}
            fullWidth
            size="lg"
            icon={<Ionicons name="hand-left-outline" size={20} color={Colors.textOnPrimary} />}
          />
        )}
        {/* Assigned planned visit: agent can check in */}
        {visit.status === 'planned' && visit.userId === currentUser?.id && (
          <>
            <Button
              title="Check In"
              onPress={handleCheckIn}
              loading={loading}
              fullWidth
              size="lg"
              icon={<Ionicons name="log-in-outline" size={20} color={Colors.textOnPrimary} />}
            />
            <Button title="Cancel Visit" variant="outline" onPress={handleCancel} fullWidth />
          </>
        )}
        {/* Admin can cancel any planned visit */}
        {visit.status === 'planned' && currentUser?.role === 'admin' && (
          <Button title="Cancel Visit" variant="outline" onPress={handleCancel} fullWidth />
        )}
        {visit.status === 'in_progress' && !showOutcome && (
          <Button
            title="Check Out"
            variant="secondary"
            onPress={handleCheckOut}
            loading={loading}
            fullWidth
            size="lg"
            icon={<Ionicons name="log-out-outline" size={20} color={Colors.textOnPrimary} />}
          />
        )}
        <Button title="Delete Visit" variant="danger" onPress={handleDelete} fullWidth size="sm" style={styles.deleteBtn} />
      </View>

      <View style={{ height: isMobile ? 60 : 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: FontSize.lg, color: Colors.textTertiary },
  headerCard: { marginBottom: Spacing.md },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  headerInfo: { flex: 1, marginRight: Spacing.md },
  clientName: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
  dateText: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 4 },
  assignmentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.infoLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  assignmentText: { fontSize: FontSize.sm, color: Colors.primary },
  assignmentBold: { fontWeight: '700' },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xl },
  detailItem: { alignItems: 'center', gap: 4 },
  detailLabel: { fontSize: FontSize.xs, color: Colors.textTertiary },
  detailValue: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  timelineInfo: { flex: 1 },
  timelineLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  timelineValue: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  timelineAddress: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  notesText: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },
  outcomeCard: { borderWidth: 1, borderColor: Colors.primary },
  outcomeInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    minHeight: 80,
    backgroundColor: Colors.surfaceVariant,
    marginBottom: Spacing.md,
  },
  outcomeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  actions: { gap: Spacing.md, marginTop: Spacing.lg },
  deleteBtn: { marginTop: Spacing.xl, opacity: 0.7 },
});
