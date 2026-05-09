import { User, UserRole } from '../types';
import { syncGet, syncSet } from './crossTabSync';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RegisteredUser {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

/** Derive a safe username from email local-part (used for migrating legacy users). */
function deriveUsernameFromEmail(email: string): string {
  const local = (email || '').split('@')[0] || '';
  // strip non-alphanumerics so the derived username is predictable
  return local.toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'user';
}

const USERS_STORAGE_KEY = '@fieldpulse_registered_users';

// Pre-registered (hardcoded) users — only the admin is built-in.
// Field agents must register through the app (persisted via registerUser).
const BUILTIN_USERS: RegisteredUser[] = [
  {
    id: 'admin-001',
    name: 'Anurag',
    username: 'admin',
    email: 'admin@fieldpulse.in',
    phone: '+91 99001 10011',
    password: 'admin123',
    role: 'admin',
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
      // and migrate legacy users (no username) by deriving one from email.
      const taken = new Set<string>(BUILTIN_USERS.map((b) => b.username.toLowerCase()));
      dynamicUsers = parsed
        .filter((u) => !BUILTIN_USERS.some((b) => b.email.toLowerCase() === u.email.toLowerCase()))
        .map((u) => {
          if (u.username && u.username.trim()) return u;
          let candidate = deriveUsernameFromEmail(u.email);
          // ensure uniqueness within this batch
          let suffix = 1;
          while (taken.has(candidate.toLowerCase())) {
            candidate = `${deriveUsernameFromEmail(u.email)}${suffix++}`;
          }
          taken.add(candidate.toLowerCase());
          return { ...u, username: candidate };
        });
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

/**
 * Authenticate a user by username (preferred) or email (fallback).
 * The first parameter is named `identifier` to make either accepted form clear.
 */
export function authenticateUser(identifier: string, password: string): RegisteredUser | null {
  const id = identifier.toLowerCase().trim();
  const user = allUsers().find(
    (u) =>
      ((u.username || '').toLowerCase() === id || u.email.toLowerCase() === id) &&
      u.password === password
  );
  return user || null;
}

export function toUser(reg: RegisteredUser): User {
  return {
    id: reg.id,
    name: reg.name,
    username: reg.username,
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
  // Check if username already exists
  if (isUsernameTaken(user.username)) {
    throw new Error('A user with this username already exists');
  }
  // Check if email already exists
  if (user.email && isEmailTaken(user.email)) {
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

export function isUsernameTaken(username: string): boolean {
  const u = username.toLowerCase().trim();
  return allUsers().some((x) => (x.username || '').toLowerCase() === u);
}
