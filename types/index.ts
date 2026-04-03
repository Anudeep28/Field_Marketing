export type UserRole = 'admin' | 'field_agent';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  teamId?: string;
  createdAt: string;
}

export type VisitStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
export type VisitPurpose = 'collection' | 'new_enquiry' | 'trial' | 'follow_up' | 'other';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
}

export interface Visit {
  id: string;
  userId: string;
  assignedBy?: string;
  assignedToName?: string;
  clientId: string;
  clientName: string;
  date: string;
  scheduledTime?: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkInLocation?: GeoLocation;
  checkOutLocation?: GeoLocation;
  status: VisitStatus;
  purpose: VisitPurpose;
  notes: string;
  outcome?: string;
  photos: string[];
  followUpDate?: string;
  followUpNotes?: string;
  duration?: number; // minutes
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone: string;
  address?: string;
  location?: GeoLocation;
  leadStatus: LeadStatus;
  assignedTo: string;
  notes?: string;
  tags: string[];
  totalVisits: number;
  lastVisitDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyStats {
  date: string;
  totalVisits: number;
  completedVisits: number;
  plannedVisits: number;
  cancelledVisits: number;
  totalDuration: number; // minutes
  newLeads: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface FilterOptions {
  dateFrom?: string;
  dateTo?: string;
  status?: VisitStatus[];
  purpose?: VisitPurpose[];
  clientId?: string;
  userId?: string;
  searchQuery?: string;
}

export interface AppSettings {
  dataRetentionMonths: number;
  autoCheckout: boolean;
  autoCheckoutMinutes: number;
  requirePhotos: boolean;
  requireNotes: boolean;
  enableOfflineMode: boolean;
}
