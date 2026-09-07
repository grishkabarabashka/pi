import type { Bucket, Person, Tag } from '@/domain/types';

/** The set of buckets is a property of the team (D6), not a constant of the application. */
export const buckets: Bucket[] = [
  { id: 'swarm', teamId: 'team-apps', label: 'Swarm in progress', emphasis: 'swarm', order: 1 },
  { id: 'attention', teamId: 'team-apps', label: 'Needs attention', emphasis: 'attention', order: 2 },
  { id: 'handover', teamId: 'team-apps', label: 'For the next shift', emphasis: 'handover', order: 3 },
];

export const tags: Tag[] = [
  { id: 'wait-user', label: 'waiting for the user' },
  { id: 'wait-team', label: 'waiting for another team' },
  { id: 'recurring', label: 'recurring' },
  { id: 'next-shift', label: 'attention of the next shift' },
];

/** sys_user. Needed so the general queue can show who holds a ticket. */
export const people: Person[] = [
  { id: 'me', name: 'Shift engineer', region: 'EMEA' },
  { id: 'a.kern', name: 'A. Kern', region: 'EMEA' },
  { id: 'r.mehta', name: 'R. Mehta', region: 'APAC' },
  { id: 'j.olsen', name: 'J. Olsen', region: 'AMER' },
];

export const currentUser: Person = people[0]!;
