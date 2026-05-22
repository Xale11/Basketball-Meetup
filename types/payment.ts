/**
 * Not a Supabase table — client-side / future feature.
 * No `transactions` table exists in Supabase yet.
 * Note: `event_tickets` (ticket tier definitions) IS in Supabase and is typed
 * as `EventTicket` in types/event.ts. This `Transaction` type models a payment
 * record that will be needed once the ticketing/payments flow is built.
 */

/** Not a Supabase table — future feature. Represents a payment or refund transaction for a ticketed event. */
export interface Transaction {
  id: string;
  user_id: string;
  event_id: string;
  ticket_id?: string; // if ticket_id is provided, this is a payment for a ticket
  transaction_type: 'payment' | 'refund';
  amount: number;
  payment_method: 'card' | 'cash' | 'bank_transfer' | 'other';
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}
