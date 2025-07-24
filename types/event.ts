export interface Event {
  id: string;
  images?: string[];
  title: string;
  description?: string;
  courtId: string;
  mainOrganiser: {
	  type: 'club' | 'user',
	  id: string
  }
  organiserUserIds: string[];
  organiserClubIds: string[];
  startDate: string;
  endDate: string;
  maxParticipants: number; //if zero, that means unlimited
  currentParticipants: number;
  pricing: string[]; // list of ticketIds
  ticketDeadline: 'upcoming' | 'live'
  isPrivate: boolean;
  participants: EventParticipant[], // contains user type and transaction type for refering payment and handling refunds
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  createdAt: string;
  acceptingParticipants: boolean
  verifyParticipants: boolean
}