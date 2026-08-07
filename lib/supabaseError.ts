import { PostgrestError } from '@supabase/supabase-js'

/**
 * Postgres / PostgREST error codes worth branching on.
 *
 * These were being lost entirely: the API layer threw
 * `new Error(JSON.stringify(error))`, which produces an unreadable blob in the
 * UI and drops `code` on error shapes whose fields are non-enumerable.
 */
export const PG_ERROR = {
  /** RLS denied the operation (or no policy exists for it). */
  RLS_VIOLATION: '42501',
  /** Unique constraint — e.g. joining an event you're already in. */
  UNIQUE_VIOLATION: '23505',
  /** FK constraint — e.g. referencing a profile row that doesn't exist. */
  FOREIGN_KEY_VIOLATION: '23503',
  /** NOT NULL constraint. */
  NOT_NULL_VIOLATION: '23502',
} as const

/** Preserves the Supabase error fields the UI and logs actually need. */
export class SupabaseApiError extends Error {
  readonly context: string
  readonly code?: string
  readonly details?: string
  readonly hint?: string

  constructor(context: string, error: PostgrestError | { message?: string; code?: string; details?: string; hint?: string }) {
    super(error?.message ?? 'Unknown Supabase error')
    this.name = 'SupabaseApiError'
    this.context = context
    this.code = (error as any)?.code
    this.details = (error as any)?.details
    this.hint = (error as any)?.hint
  }

  get isRlsViolation() {
    return this.code === PG_ERROR.RLS_VIOLATION
  }

  get isUniqueViolation() {
    return this.code === PG_ERROR.UNIQUE_VIOLATION
  }

  /** A message safe to show a user, mapped from the underlying code. */
  get userMessage() {
    if (this.isRlsViolation) return "You don't have permission to do that."
    if (this.isUniqueViolation) return 'That already exists.'
    return this.message
  }
}

/**
 * Logs a Supabase error with the fields that matter, then throws it typed.
 * Use at every `if (error)` branch in the api layer.
 */
export function throwSupabaseError(
  context: string,
  error: PostgrestError | { message?: string; code?: string; details?: string; hint?: string },
): never {
  console.error(`[${context}] Supabase error:`, {
    message: error?.message,
    code: (error as any)?.code,
    details: (error as any)?.details,
    hint: (error as any)?.hint,
  })
  throw new SupabaseApiError(context, error)
}
