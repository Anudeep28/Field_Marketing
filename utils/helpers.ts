import { format, parseISO, differenceInMinutes, subMonths, isAfter, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Visit, Client, DailyStats, FilterOptions } from '../types';

export function generateId(): string {
  return 'xxxx-xxxx-xxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

export function formatDate(date: string | Date, fmt: string = 'MMM dd, yyyy'): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, fmt);
  } catch {
    return String(date);
  }
}

export function formatTime(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'hh:mm a');
  } catch {
    return String(date);
  }
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export function calculateDuration(checkIn: string, checkOut: string): number {
  try {
    return differenceInMinutes(parseISO(checkOut), parseISO(checkIn));
  } catch {
    return 0;
  }
}

export function getToday(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getNow(): string {
  return new Date().toISOString();
}

export function isOlderThanMonths(dateStr: string, months: number): boolean {
  const cutoff = subMonths(new Date(), months);
  const date = parseISO(dateStr);
  return !isAfter(date, cutoff);
}

export function filterVisits(visits: Visit[], filters: FilterOptions): Visit[] {
  return visits.filter((visit) => {
    if (filters.dateFrom) {
      const from = startOfDay(parseISO(filters.dateFrom));
      if (!isAfter(parseISO(visit.date), from) && format(parseISO(visit.date), 'yyyy-MM-dd') !== filters.dateFrom) {
        return false;
      }
    }
    if (filters.dateTo) {
      const to = endOfDay(parseISO(filters.dateTo));
      if (isAfter(parseISO(visit.date), to)) return false;
    }
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(visit.status)) return false;
    }
    if (filters.purpose && filters.purpose.length > 0) {
      if (!filters.purpose.includes(visit.purpose)) return false;
    }
    if (filters.clientId && visit.clientId !== filters.clientId) return false;
    if (filters.userId && visit.userId !== filters.userId) return false;
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const match =
        visit.clientName.toLowerCase().includes(q) ||
        visit.notes.toLowerCase().includes(q) ||
        (visit.outcome || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}

export function calculateDailyStats(visits: Visit[], date: string): DailyStats {
  const dayVisits = visits.filter((v) => v.date === date);
  return {
    date,
    totalVisits: dayVisits.length,
    completedVisits: dayVisits.filter((v) => v.status === 'completed').length,
    plannedVisits: dayVisits.filter((v) => v.status === 'planned').length,
    cancelledVisits: dayVisits.filter((v) => v.status === 'cancelled').length,
    totalDuration: dayVisits.reduce((sum, v) => sum + (v.duration || 0), 0),
    newLeads: dayVisits.filter((v) => v.purpose === 'new_lead').length,
  };
}

export function getWeekRange(): { start: string; end: string } {
  const now = new Date();
  return {
    start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  };
}

export function getMonthRange(): { start: string; end: string } {
  const now = new Date();
  return {
    start: format(startOfMonth(now), 'yyyy-MM-dd'),
    end: format(endOfMonth(now), 'yyyy-MM-dd'),
  };
}

export function groupVisitsByDate(visits: Visit[]): Record<string, Visit[]> {
  const grouped: Record<string, Visit[]> = {};
  visits.forEach((visit) => {
    if (!grouped[visit.date]) grouped[visit.date] = [];
    grouped[visit.date].push(visit);
  });
  return grouped;
}

export function getVisitCountByDate(visits: Visit[]): Record<string, number> {
  const counts: Record<string, number> = {};
  visits.forEach((visit) => {
    counts[visit.date] = (counts[visit.date] || 0) + 1;
  });
  return counts;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function generateCSVFromVisits(visits: Visit[]): string {
  const headers = [
    'Date', 'Client', 'Purpose', 'Status', 'Check-In Time', 'Check-Out Time',
    'Duration (min)', 'Notes', 'Outcome', 'Check-In Address'
  ];
  const rows = visits.map((v) => [
    v.date,
    `"${v.clientName}"`,
    v.purpose,
    v.status,
    v.checkInTime ? formatTime(v.checkInTime) : '',
    v.checkOutTime ? formatTime(v.checkOutTime) : '',
    String(v.duration || 0),
    `"${v.notes.replace(/"/g, '""')}"`,
    `"${(v.outcome || '').replace(/"/g, '""')}"`,
    `"${v.checkInLocation?.address || ''}"`,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
