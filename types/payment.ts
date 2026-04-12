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
