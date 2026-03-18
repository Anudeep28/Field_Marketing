import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Visit, Client, AppSettings, FilterOptions, TeamMember } from '../types';
import { generateId, getNow, getToday, isOlderThanMonths, calculateDuration } from '../utils/helpers';
import { getSampleClients, getSampleVisits } from '../utils/sampleData';
import { getAllAgents } from '../utils/userDatabase';
import { broadcastChange, pushSyncEvent, syncSet, syncRemove, syncGet } from '../utils/crossTabSync';

export interface AdminNotification {
  id: string;
  type: 'visit_picked' | 'visit_checked_in' | 'visit_completed' | 'visit_cancelled';
  message: string;
  agentName: string;
  clientName: string;
  visitId: string;
  timestamp: string;
  read: boolean;
}

const STORAGE_KEYS = {
  USER: '@fieldpulse_user',
  VISITS: '@fieldpulse_visits',
  CLIENTS: '@fieldpulse_clients',
  SETTINGS: '@fieldpulse_settings',
  TEAM: '@fieldpulse_team',
};

// Helper: write to both local AsyncStorage AND the shared server store
async function sharedSet(key: string, value: string) {
  await AsyncStorage.setItem(key, value);
  syncSet(key, value);  // fire-and-forget to server
}

// Helper: remove from both local AsyncStorage AND the shared server store
async function sharedRemove(key: string) {
  await AsyncStorage.removeItem(key);
  syncRemove(key);  // fire-and-forget to server
}

// Helper: read from the shared server store first, fall back to local AsyncStorage
async function sharedGet(key: string): Promise<string | null> {
  const serverValue = await syncGet(key);
  if (serverValue !== null && serverValue !== undefined) {
    // Also update local AsyncStorage so it stays in sync
    await AsyncStorage.setItem(key, serverValue);
    return serverValue;
  }
  return AsyncStorage.getItem(key);
}

const DEFAULT_SETTINGS: AppSettings = {
  dataRetentionMonths: 6,
  autoCheckout: true,
  autoCheckoutMinutes: 120,
  requirePhotos: false,
  requireNotes: true,
  enableOfflineMode: true,
};

interface AppState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  teamMembers: TeamMember[];

  // Data
  visits: Visit[];
  clients: Client[];
  settings: AppSettings;

  // UI State
  isLoading: boolean;
  activeVisit: Visit | null;

  // Admin Notifications
  notifications: AdminNotification[];
  addNotification: (notification: Omit<AdminNotification, 'id' | 'timestamp' | 'read'>) => void;
  clearNotifications: () => void;
  markNotificationRead: (id: string) => void;

  // Auth Actions
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;

  // Visit Actions
  addVisit: (visit: Omit<Visit, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Visit>;
  updateVisit: (id: string, updates: Partial<Visit>) => Promise<void>;
  deleteVisit: (id: string) => Promise<void>;
  checkIn: (visitId: string, location: { latitude: number; longitude: number; address?: string }) => Promise<void>;
  checkOut: (visitId: string, location: { latitude: number; longitude: number; address?: string }, outcome?: string) => Promise<void>;

  // Client Actions
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'totalVisits' | 'lastVisitDate'>) => Promise<Client>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  // Team Actions
  addTeamMember: (member: Omit<TeamMember, 'createdAt'> & { id?: string }) => Promise<TeamMember>;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => Promise<void>;
  removeTeamMember: (id: string) => Promise<void>;

  // Role-based helpers
  getMyVisits: () => Visit[];
  getAvailableVisits: () => Visit[];
  getMyClients: () => Client[];
  getTeamVisits: () => Visit[];
  getTeamClients: () => Client[];
  getTeamMemberIds: () => string[];

  // Agent actions
  pickVisit: (visitId: string) => Promise<void>;

  // Live refresh
  refreshData: () => Promise<void>;

  // Settings
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;

  // Data Management
  loadData: () => Promise<void>;
  cleanupOldData: () => Promise<void>;
  exportData: () => Promise<string>;
  seedSampleData: (userId: string) => Promise<void>;
  resetAllData: () => Promise<void>;

  // Helpers
  getVisitsForDate: (date: string) => Visit[];
  getVisitsForClient: (clientId: string) => Visit[];
  getVisitsForDateRange: (from: string, to: string) => Visit[];
  getTodayStats: () => { total: number; completed: number; pending: number; inProgress: number };
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  teamMembers: [],
  visits: [],
  clients: [],
  settings: DEFAULT_SETTINGS,
  isLoading: true,
  activeVisit: null,
  notifications: [],

  addNotification: (notification) => {
    const newNotif: AdminNotification = {
      ...notification,
      id: generateId(),
      timestamp: getNow(),
      read: false,
    };
    set((state) => ({
      notifications: [newNotif, ...state.notifications].slice(0, 50),
    }));
  },

  clearNotifications: () => set({ notifications: [] }),

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  // ── Auth ──────────────────────────────────────────
  login: async (user: User) => {
    await sharedSet(STORAGE_KEYS.USER, JSON.stringify(user));
    set({ currentUser: user, isAuthenticated: true });
  },

  logout: async () => {
    await sharedRemove(STORAGE_KEYS.USER);
    set({
      currentUser: null,
      isAuthenticated: false,
      activeVisit: null,
    });
  },

  updateProfile: async (updates: Partial<User>) => {
    const { currentUser } = get();
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    await sharedSet(STORAGE_KEYS.USER, JSON.stringify(updated));
    set({ currentUser: updated });
  },

  // ── Visits ────────────────────────────────────────
  addVisit: async (visitData) => {
    const now = getNow();
    const visit: Visit = {
      ...visitData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    const visits = [...get().visits, visit];
    await sharedSet(STORAGE_KEYS.VISITS, JSON.stringify(visits));
    broadcastChange([STORAGE_KEYS.VISITS]);
    set({ visits });
    return visit;
  },

  updateVisit: async (id, updates) => {
    const visits = get().visits.map((v) =>
      v.id === id ? { ...v, ...updates, updatedAt: getNow() } : v
    );
    await sharedSet(STORAGE_KEYS.VISITS, JSON.stringify(visits));
    broadcastChange([STORAGE_KEYS.VISITS]);
    const activeVisit = get().activeVisit;
    const newActive = activeVisit?.id === id ? { ...activeVisit, ...updates, updatedAt: getNow() } : activeVisit;
    set({ visits, activeVisit: newActive });
  },

  deleteVisit: async (id) => {
    const visits = get().visits.filter((v) => v.id !== id);
    await sharedSet(STORAGE_KEYS.VISITS, JSON.stringify(visits));
    broadcastChange([STORAGE_KEYS.VISITS]);
    const activeVisit = get().activeVisit?.id === id ? null : get().activeVisit;
    set({ visits, activeVisit });
  },

  checkIn: async (visitId, location) => {
    const now = getNow();
    const visits = get().visits.map((v) =>
      v.id === visitId
        ? {
            ...v,
            status: 'in_progress' as const,
            checkInTime: now,
            checkInLocation: { latitude: location.latitude, longitude: location.longitude, address: location.address },
            updatedAt: now,
          }
        : v
    );
    await sharedSet(STORAGE_KEYS.VISITS, JSON.stringify(visits));
    broadcastChange([STORAGE_KEYS.VISITS]);
    const activeVisit = visits.find((v) => v.id === visitId) || null;
    set({ visits, activeVisit });

    // Push structured event for admin dashboard
    const checkedInVisit = visits.find((v) => v.id === visitId);
    if (checkedInVisit) {
      pushSyncEvent({
        type: 'visit_checked_in',
        message: `${checkedInVisit.assignedToName || 'An agent'} checked in at ${checkedInVisit.clientName}`,
        agentName: checkedInVisit.assignedToName || 'Agent',
        clientName: checkedInVisit.clientName,
        visitId: visitId,
      });
    }
  },

  checkOut: async (visitId, location, outcome) => {
    const now = getNow();
    const visit = get().visits.find((v) => v.id === visitId);
    const duration = visit?.checkInTime ? calculateDuration(visit.checkInTime, now) : 0;

    const visits = get().visits.map((v) =>
      v.id === visitId
        ? {
            ...v,
            status: 'completed' as const,
            checkOutTime: now,
            checkOutLocation: { latitude: location.latitude, longitude: location.longitude, address: location.address },
            outcome: outcome || v.outcome,
            duration,
            updatedAt: now,
          }
        : v
    );

    // Update client's last visit date and total visits
    const updatedVisit = visits.find((v) => v.id === visitId);
    if (updatedVisit) {
      const clients = get().clients.map((c) =>
        c.id === updatedVisit.clientId
          ? { ...c, lastVisitDate: getToday(), totalVisits: c.totalVisits + 1, updatedAt: now }
          : c
      );
      await sharedSet(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
      set({ clients });
    }

    await sharedSet(STORAGE_KEYS.VISITS, JSON.stringify(visits));
    broadcastChange([STORAGE_KEYS.VISITS, STORAGE_KEYS.CLIENTS]);
    set({ visits, activeVisit: null });

    // Push structured event for admin dashboard
    if (updatedVisit) {
      pushSyncEvent({
        type: 'visit_completed',
        message: `${updatedVisit.assignedToName || 'An agent'} completed visit at ${updatedVisit.clientName}`,
        agentName: updatedVisit.assignedToName || 'Agent',
        clientName: updatedVisit.clientName,
        visitId: visitId,
      });
    }
  },

  // ── Clients ───────────────────────────────────────
  addClient: async (clientData) => {
    const now = getNow();
    const client: Client = {
      ...clientData,
      id: generateId(),
      totalVisits: 0,
      createdAt: now,
      updatedAt: now,
    };
    const clients = [...get().clients, client];
    await sharedSet(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    broadcastChange([STORAGE_KEYS.CLIENTS]);
    set({ clients });
    return client;
  },

  updateClient: async (id, updates) => {
    const clients = get().clients.map((c) =>
      c.id === id ? { ...c, ...updates, updatedAt: getNow() } : c
    );
    await sharedSet(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    broadcastChange([STORAGE_KEYS.CLIENTS]);
    set({ clients });
  },

  deleteClient: async (id) => {
    const clients = get().clients.filter((c) => c.id !== id);
    await sharedSet(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    broadcastChange([STORAGE_KEYS.CLIENTS]);
    set({ clients });
  },

  // ── Team ──────────────────────────────────────────
  addTeamMember: async (memberData) => {
    const member: TeamMember = {
      ...memberData,
      id: memberData.id || generateId(),
      createdAt: getNow(),
    };
    const team = [...get().teamMembers, member];
    await sharedSet(STORAGE_KEYS.TEAM, JSON.stringify(team));
    broadcastChange([STORAGE_KEYS.TEAM]);
    set({ teamMembers: team });
    return member;
  },

  updateTeamMember: async (id, updates) => {
    const team = get().teamMembers.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    );
    await sharedSet(STORAGE_KEYS.TEAM, JSON.stringify(team));
    broadcastChange([STORAGE_KEYS.TEAM]);
    set({ teamMembers: team });
  },

  removeTeamMember: async (id) => {
    const team = get().teamMembers.filter((m) => m.id !== id);
    await sharedSet(STORAGE_KEYS.TEAM, JSON.stringify(team));
    broadcastChange([STORAGE_KEYS.TEAM]);
    set({ teamMembers: team });
  },

  // ── Role-based helpers ──────────────────────────────
  getMyVisits: () => {
    const { currentUser, visits } = get();
    if (!currentUser) return [];
    // Agents see visits assigned to them
    return visits.filter((v) => v.userId === currentUser.id);
  },

  // Visits available for any agent to pick (unassigned planned visits)
  getAvailableVisits: () => {
    const { visits } = get();
    return visits.filter((v) => v.status === 'planned' && (!v.userId || v.userId === ''));
  },

  getMyClients: () => {
    // All agents see all clients
    return get().clients;
  },

  getTeamMemberIds: () => {
    const { currentUser, teamMembers } = get();
    if (!currentUser) return [];
    if (currentUser.role === 'admin') {
      return [currentUser.id, ...teamMembers.map((m) => m.id)];
    }
    return [currentUser.id];
  },

  getTeamVisits: () => {
    // Admin sees all visits
    return get().visits;
  },

  getTeamClients: () => {
    // Admin sees all clients
    return get().clients;
  },

  // ── Agent actions ───────────────────────────────────
  pickVisit: async (visitId) => {
    const { currentUser } = get();
    if (!currentUser) return;
    const now = getNow();
    const visits = get().visits.map((v) =>
      v.id === visitId
        ? { ...v, userId: currentUser.id, assignedToName: currentUser.name, updatedAt: now }
        : v
    );
    await sharedSet(STORAGE_KEYS.VISITS, JSON.stringify(visits));
    broadcastChange([STORAGE_KEYS.VISITS]);
    set({ visits });

    // Push structured event for admin dashboard
    const pickedVisit = visits.find((v) => v.id === visitId);
    if (pickedVisit) {
      pushSyncEvent({
        type: 'visit_picked',
        message: `${currentUser.name} picked up visit at ${pickedVisit.clientName}`,
        agentName: currentUser.name,
        clientName: pickedVisit.clientName,
        visitId: visitId,
      });
    }
  },

  // ── Live refresh (re-read from shared server store) ────────────
  refreshData: async () => {
    try {
      const [visitsStr, clientsStr, teamStr] = await Promise.all([
        sharedGet(STORAGE_KEYS.VISITS),
        sharedGet(STORAGE_KEYS.CLIENTS),
        sharedGet(STORAGE_KEYS.TEAM),
      ]);
      const current = get();
      
      // Only update if we got data back; preserve existing in-memory data otherwise
      const visits: Visit[] = visitsStr ? JSON.parse(visitsStr) : current.visits;
      const clients = clientsStr ? JSON.parse(clientsStr) : current.clients;
      const teamMembers = teamStr ? JSON.parse(teamStr) : current.teamMembers;
      const currentUser = current.currentUser;
      const activeVisit = currentUser
        ? visits.find((v: Visit) => v.status === 'in_progress' && v.userId === currentUser.id) || null
        : null;

      set({ visits, clients, teamMembers, activeVisit });
      
      // If we have in-memory data but server is empty, push data back to server
      if (!visitsStr && visits.length > 0) {
        syncSet(STORAGE_KEYS.VISITS, JSON.stringify(visits));
      }
      if (!clientsStr && clients.length > 0) {
        syncSet(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
      }
      if (!teamStr && teamMembers.length > 0) {
        syncSet(STORAGE_KEYS.TEAM, JSON.stringify(teamMembers));
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  },

  // ── Settings ──────────────────────────────────────
  updateSettings: async (updates) => {
    const settings = { ...get().settings, ...updates };
    await sharedSet(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    broadcastChange([STORAGE_KEYS.SETTINGS]);
    set({ settings });
  },

  // ── Data Management ───────────────────────────────
  loadData: async () => {
    try {
      set({ isLoading: true });
      const [userStr, visitsStr, clientsStr, settingsStr, teamStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        sharedGet(STORAGE_KEYS.VISITS),
        sharedGet(STORAGE_KEYS.CLIENTS),
        sharedGet(STORAGE_KEYS.SETTINGS),
        sharedGet(STORAGE_KEYS.TEAM),
      ]);

      const currentUser = userStr ? JSON.parse(userStr) : null;
      const visits = visitsStr ? JSON.parse(visitsStr) : [];
      const clients = clientsStr ? JSON.parse(clientsStr) : [];
      const settings = settingsStr ? { ...DEFAULT_SETTINGS, ...JSON.parse(settingsStr) } : DEFAULT_SETTINGS;
      const teamMembers = teamStr ? JSON.parse(teamStr) : [];

      // Find active visit for the current user only
      const activeVisit = currentUser
        ? visits.find((v: Visit) => v.status === 'in_progress' && v.userId === currentUser.id) || null
        : null;

      set({
        currentUser,
        isAuthenticated: !!currentUser,
        visits,
        clients,
        settings,
        teamMembers,
        activeVisit,
        isLoading: false,
      });
      
      // Re-push local data to server if server lost its store (e.g. after restart)
      if (!visitsStr && visits.length > 0) {
        syncSet(STORAGE_KEYS.VISITS, JSON.stringify(visits));
      }
      if (!clientsStr && clients.length > 0) {
        syncSet(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
      }
      if (!teamStr && teamMembers.length > 0) {
        syncSet(STORAGE_KEYS.TEAM, JSON.stringify(teamMembers));
      }
      if (!settingsStr) {
        syncSet(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      set({ isLoading: false });
    }
  },

  cleanupOldData: async () => {
    const { settings, visits } = get();
    const filteredVisits = visits.filter(
      (v) => !isOlderThanMonths(v.createdAt, settings.dataRetentionMonths)
    );
    if (filteredVisits.length !== visits.length) {
      await sharedSet(STORAGE_KEYS.VISITS, JSON.stringify(filteredVisits));
      broadcastChange([STORAGE_KEYS.VISITS]);
      set({ visits: filteredVisits });
    }
  },

  exportData: async () => {
    const { visits, clients } = get();
    return JSON.stringify({ visits, clients, exportedAt: getNow() }, null, 2);
  },

  seedSampleData: async (_userId) => {
    // Universal seed: create shared data.
    // Admin creates clients and plans visits (unassigned).
    // Field agents pick visits from the pool.
    const allAgents = getAllAgents();

    // Create team members from all registered agents
    const teamMembers: TeamMember[] = allAgents.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      phone: a.phone,
      role: a.role,
      status: 'active' as const,
      createdAt: getNow(),
    }));

    const sampleClients = getSampleClients();
    const sampleVisits = getSampleVisits(sampleClients);

    // Clients are created by admin — assignedTo is 'admin-001'
    sampleClients.forEach((c) => {
      c.assignedTo = 'admin-001';
    });

    // Some past visits assigned to agents (simulating completed work),
    // future/planned visits left unassigned for agents to pick
    const agentIds = allAgents.map((a) => a.id);
    const nameMap: Record<string, string> = {};
    allAgents.forEach((a) => { nameMap[a.id] = a.name; });

    sampleVisits.forEach((v, i) => {
      v.assignedBy = 'admin-001';
      if (v.status === 'completed' || v.status === 'in_progress') {
        // Completed/active visits are assigned to agents
        const agentId = agentIds[i % agentIds.length];
        v.userId = agentId;
        v.assignedToName = nameMap[agentId] || 'Agent';
      } else {
        // Planned visits are unassigned — available for any agent
        v.userId = '';
        v.assignedToName = '';
      }
    });

    await Promise.all([
      sharedSet(STORAGE_KEYS.CLIENTS, JSON.stringify(sampleClients)),
      sharedSet(STORAGE_KEYS.VISITS, JSON.stringify(sampleVisits)),
      sharedSet(STORAGE_KEYS.TEAM, JSON.stringify(teamMembers)),
    ]);
    broadcastChange([STORAGE_KEYS.CLIENTS, STORAGE_KEYS.VISITS, STORAGE_KEYS.TEAM]);
    set({ clients: sampleClients, visits: sampleVisits, teamMembers });
  },

  resetAllData: async () => {
    await Promise.all([
      sharedRemove(STORAGE_KEYS.VISITS),
      sharedRemove(STORAGE_KEYS.CLIENTS),
      sharedRemove(STORAGE_KEYS.TEAM),
      sharedRemove(STORAGE_KEYS.SETTINGS),
    ]);
    broadcastChange([STORAGE_KEYS.VISITS, STORAGE_KEYS.CLIENTS, STORAGE_KEYS.TEAM, STORAGE_KEYS.SETTINGS]);
    set({
      visits: [],
      clients: [],
      teamMembers: [],
      activeVisit: null,
      settings: DEFAULT_SETTINGS,
    });
  },

  // ── Helpers ───────────────────────────────────────
  getVisitsForDate: (date) => {
    return get().visits.filter((v) => v.date === date);
  },

  getVisitsForClient: (clientId) => {
    return get().visits.filter((v) => v.clientId === clientId);
  },

  getVisitsForDateRange: (from, to) => {
    return get().visits.filter((v) => v.date >= from && v.date <= to);
  },

  getTodayStats: () => {
    const today = getToday();
    const todayVisits = get().visits.filter((v) => v.date === today);
    return {
      total: todayVisits.length,
      completed: todayVisits.filter((v) => v.status === 'completed').length,
      pending: todayVisits.filter((v) => v.status === 'planned').length,
      inProgress: todayVisits.filter((v) => v.status === 'in_progress').length,
    };
  },
}));
