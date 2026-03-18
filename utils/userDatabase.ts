import { User, UserRole } from '../types';

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

// Pre-registered users for the application
// In production, this would come from a backend API
const REGISTERED_USERS: RegisteredUser[] = [
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

export function authenticateUser(email: string, password: string): RegisteredUser | null {
  const user = REGISTERED_USERS.find(
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
  return REGISTERED_USERS.filter((u) => u.role === 'field_agent');
}

export function registerUser(user: RegisteredUser): void {
  // Check if email already exists
  const existing = REGISTERED_USERS.find(
    (u) => u.email.toLowerCase() === user.email.toLowerCase()
  );
  if (existing) {
    throw new Error('A user with this email already exists');
  }
  REGISTERED_USERS.push(user);
}

export function isEmailTaken(email: string): boolean {
  return REGISTERED_USERS.some(
    (u) => u.email.toLowerCase() === email.toLowerCase().trim()
  );
}
