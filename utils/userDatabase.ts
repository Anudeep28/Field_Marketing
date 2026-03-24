import { User, UserRole } from '../types';
import { syncGet, syncSet } from './crossTabSync';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

const USERS_STORAGE_KEY = '@fieldpulse_registered_users';

// Pre-registered (hardcoded) users — always available as a baseline
const BUILTIN_USERS: RegisteredUser[] = [
  // Admin
  {
    id: 'admin-001',
    name: 'Anurag',
    email: 'admin@fieldpulse.in',
    phone: '+91 99001 10011',
    password: 'admin123',
    role: 'admin',
  },
  // Field Agents
  {
    id: 'agent-001',
    name: 'Arjun Mehta',
    email: 'arjun@fieldpulse.in',
    phone: '+91 99887 76655',
    password: 'agent123',
    role: 'field_agent',
  },
  {
    id: 'agent-002',
    name: 'Kavitha Nair',
    email: 'kavitha@fieldpulse.in',
    phone: '+91 88776 65544',
    password: 'agent123',
    role: 'field_agent',
  },
  {
    id: 'agent-003',
    name: 'Rohit Verma',
    email: 'rohit@fieldpulse.in',
    phone: '+91 77665 54433',
    password: 'agent123',
    role: 'field_agent',
  },
  {
    id: 'agent-004',
    name: 'Deepa Kulkarni',
    email: 'deepa@fieldpulse.in',
    phone: '+91 66554 43322',
    password: 'agent123',
    role: 'field_agent',
  },
  {
    id: 'agent-005',
    name: 'Manish Tiwari',
    email: 'manish@fieldpulse.in',
    phone: '+91 55443 32211',
    password: 'agent123',
    role: 'field_agent',
  },
];

// Dynamically registered users (loaded from persistent storage)
let dynamicUsers: RegisteredUser[] = [];
let _loaded = false;

/** All known users = hardcoded + dynamically registered */
function allUsers(): RegisteredUser[] {
  return [...BUILTIN_USERS, ...dynamicUsers];
}

/**
 * Load dynamically registered users from the shared server data store.
 * Call this once on app startup (e.g. inside loadData in the store).
 */
export async function loadRegisteredUsers(): Promise<void> {
  try {
    // Try server first, fall back to local AsyncStorage
    let raw = await syncGet(USERS_STORAGE_KEY);
    if (raw === null || raw === undefined) {
      raw = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    }
    if (raw) {
      const parsed: RegisteredUser[] = JSON.parse(raw);
      // Merge: only add users whose email isn't already in BUILTIN_USERS
      dynamicUsers = parsed.filter(
        (u) => !BUILTIN_USERS.some((b) => b.email.toLowerCase() === u.email.toLowerCase())
      );
    }
    _loaded = true;
  } catch (e) {
    console.error('Failed to load registered users:', e);
  }
}

/** Persist the dynamic users list to both local storage and server */
async function persistDynamicUsers(): Promise<void> {
  const raw = JSON.stringify(dynamicUsers);
  try {
    await AsyncStorage.setItem(USERS_STORAGE_KEY, raw);
    await syncSet(USERS_STORAGE_KEY, raw);
  } catch (e) {
    console.error('Failed to persist registered users:', e);
  }
}

export function authenticateUser(email: string, password: string): RegisteredUser | null {
  const user = allUsers().find(
    (u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
  );
  return user || null;
}

export function toUser(reg: RegisteredUser): User {
  return {
    id: reg.id,
    name: reg.name,
    email: reg.email,
    phone: reg.phone,
    role: reg.role,
    createdAt: new Date().toISOString(),
  };
}

export function getAllAgents(): RegisteredUser[] {
  return allUsers().filter((u) => u.role === 'field_agent');
}

export async function registerUser(user: RegisteredUser): Promise<void> {
  // Check if email already exists
  const existing = allUsers().find(
    (u) => u.email.toLowerCase() === user.email.toLowerCase()
  );
  if (existing) {
    throw new Error('A user with this email already exists');
  }
  dynamicUsers.push(user);
  await persistDynamicUsers();
}

export function isEmailTaken(email: string): boolean {
  return allUsers().some(
    (u) => u.email.toLowerCase() === email.toLowerCase().trim()
  );
}
