import { Visit, Client, TeamMember } from '../types';

// Demo data has been removed. These functions return empty arrays so the app
// starts with a clean slate. They are kept only to preserve existing imports
// (store/useStore.ts still references them).

export function getSampleTeamMembers(): TeamMember[] {
  return [];
}

export function getSampleClients(): Client[] {
  return [];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getSampleVisits(_clients: Client[]): Visit[] {
  return [];
}
