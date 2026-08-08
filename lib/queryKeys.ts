/**
 * Central query-key factory.
 *
 * Keys used to be hand-written strings at both the query site and every
 * invalidation site, so a typo silently broke invalidation with no error —
 * which is how several caches ended up never refreshing. Import `qk` instead
 * of writing array literals.
 *
 * Keys are hierarchical: `qk.events.detail(id)` starts with `qk.events.all`, so
 * `invalidateQueries({ queryKey: qk.events.all })` clears every event query at
 * once, while a narrower key invalidates just that slice.
 */

type Id = string | null | undefined

export const qk = {
  users: {
    all: ['users'] as const,
    detail: (id: Id) => ['users', 'detail', id] as const,
  },

  events: {
    all: ['events'] as const,
    lists: ['events', 'list'] as const,
    /**
     * Society ids are sorted so that a re-ordered memberships array doesn't
     * produce a different key for the same logical query.
     */
    list: (universityId: Id, societyIds?: string[]) =>
      ['events', 'list', universityId ?? null, [...(societyIds ?? [])].sort()] as const,
    detail: (eventId: Id) => ['events', 'detail', eventId] as const,
    mine: (userId: Id) => ['events', 'mine', userId] as const,
    bySociety: (societyId: Id) => ['events', 'bySociety', societyId] as const,
    /** Events the user is a participant of (full event rows). */
    participating: (userId: Id) => ['events', 'participating', userId] as const,
    /** The user's participation rows (event_id + status). */
    participations: (userId: Id) => ['events', 'participations', userId] as const,
  },

  eventInvites: {
    all: ['eventInvites'] as const,
    received: (userId: Id) => ['eventInvites', 'received', userId] as const,
    forEvent: (eventId: Id, userId: Id) => ['eventInvites', 'forEvent', eventId, userId] as const,
    invitees: (eventId: Id, userId: Id) => ['eventInvites', 'invitees', eventId, userId] as const,
  },

  friends: {
    all: ['friends'] as const,
    list: (userId: Id) => ['friends', 'list', userId] as const,
    friendship: (userId: Id, targetId: Id) => ['friends', 'friendship', userId, targetId] as const,
    pending: (userId: Id) => ['friends', 'pending', userId] as const,
    search: (term: string) => ['friends', 'search', term] as const,
    /** Friends of the current user who are attending a given event. */
    forEvent: (eventId: Id, userId: Id) => ['friends', 'forEvent', eventId, userId] as const,
  },

  societies: {
    all: ['societies'] as const,
    byUniversity: (universityId: Id) => ['societies', 'byUniversity', universityId] as const,
    detail: (societyId: Id) => ['societies', 'detail', societyId] as const,
    mine: (userId: Id) => ['societies', 'mine', userId] as const,
    announcements: (societyId: Id) => ['societies', 'announcements', societyId] as const,
  },

  notifications: {
    all: ['notifications'] as const,
    list: (userId: Id) => ['notifications', 'list', userId] as const,
    unreadCount: (userId: Id) => ['notifications', 'unreadCount', userId] as const,
  },

  universities: {
    all: ['universities'] as const,
    list: () => ['universities', 'list'] as const,
    membership: (userId: Id) => ['universities', 'membership', userId] as const,
  },

  courts: {
    all: ['courts'] as const,
    list: () => ['courts', 'list'] as const,
  },
} as const
