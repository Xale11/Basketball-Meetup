export interface Transaction {
  id: string;
  userId: string;
  eventId: string;
  ticketId?: string; // if ticketId is provided, this is a payment for a ticket
  transactionType: 'payment' | 'refund';
  amount: number;
  paymentMethod: 'card' | 'cash' | 'bank_transfer' | 'other';
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}