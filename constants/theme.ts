export const Colors = {
  primary: '#1E40AF',
  primaryLight: '#3B82F6',
  primaryDark: '#1E3A8A',
  secondary: '#7C3AED',
  secondaryLight: '#A78BFA',
  accent: '#F59E0B',
  accentLight: '#FCD34D',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  text: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  textOnPrimary: '#FFFFFF',

  shadow: 'rgba(0, 0, 0, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const MobileSpacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 28,
  xxxl: 36,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  title: 28,
};

export const MobileFontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 26,
  xxxl: 34,
  title: 30,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
};

export const StatusColors: Record<string, { bg: string; text: string }> = {
  planned: { bg: '#DBEAFE', text: '#1E40AF' },
  in_progress: { bg: '#FEF3C7', text: '#92400E' },
  completed: { bg: '#D1FAE5', text: '#065F46' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B' },
  rescheduled: { bg: '#E0E7FF', text: '#3730A3' },
};

export const LeadStatusColors: Record<string, { bg: string; text: string }> = {
  new: { bg: '#DBEAFE', text: '#1E40AF' },
  contacted: { bg: '#E0E7FF', text: '#3730A3' },
  qualified: { bg: '#FEF3C7', text: '#92400E' },
  proposal: { bg: '#FDE68A', text: '#78350F' },
  negotiation: { bg: '#FBCFE8', text: '#9D174D' },
  won: { bg: '#D1FAE5', text: '#065F46' },
  lost: { bg: '#FEE2E2', text: '#991B1B' },
};

export const PurposeLabels: Record<string, string> = {
  collection: 'Collection',
  new_enquiry: 'New Enquiry',
  trial: 'Trial',
  follow_up: 'Follow-up',
  other: 'Other',
};

export const VisitStatusLabels: Record<string, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rescheduled: 'Rescheduled',
};
