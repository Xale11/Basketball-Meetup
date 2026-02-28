export interface Event_V2 {
  id: string;
  
  societyId?: string;
  universityId?: string; // ✅ for discover queries

  name: string;
  description?: string;

  images?: string[];

  startDate: string;
  endDate: string;

  location: {
    address: string;
    latitude: number;
    longitude: number;
    geohash: string;
  };

  visibility: "PUBLIC" | "SOCIETY_ONLY";

  capacity?: number;
  attendeeCount: number;

  isCancelled: boolean;

  createdByUserId: string;

  createdAt: number;
  updatedAt: number;
}

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
  pricing: Ticket[]; // list of tickets
  ticketDeadline: 'upcoming' | 'live' 
  participants: string[], // list of userIds
  isCancelled: boolean;
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

export interface CreateEventForm {
  title: string;
  description: string;
  courtId: string;
  mainOrganiserType: 'club' | 'user',
  mainOrganiserId: string
  organiserUserIds: string[];
  organiserClubIds: string[];
  startDate: string;
  endDate: string;
  maxParticipants: number; //if zero, that means unlimited
  pricing: Ticket[]; // list of tickets
  ticketDeadline: 'upcoming' | 'live'
  isCancelled: boolean;
  createdAt: string;
  acceptingParticipants: boolean
  verifyParticipants: boolean
}