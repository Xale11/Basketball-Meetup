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
  participants: string[], // list of userIds
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  createdAt: string;
  acceptingParticipants: boolean
  verifyParticipants: boolean
}

export interface Ticket {
  id: string;
  eventId: string;
  name: string;
  description: string;
  price: number;
  maxQuantity: number;
  quantitySold: number;
}