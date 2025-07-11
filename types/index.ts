export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isClubAdmin?: boolean;
  clubId?: string;
  createdAt: string;
}

export interface Court {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address: string;
  images: string[];
  amenities: string[];
  checkedInUsers: string[];
  followers: string[];
  createdBy: string;
  createdAt: Date;
  rating: number;
  reviews: Review[];
}

export interface Review {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  courtId: string;
  organizerId: string;
  startDate: Date;
  endDate: Date;
  maxParticipants: number;
  currentParticipants: number;
  price: number;
  isPrivate: boolean;
  participants: string[];
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  logo?: string;
  adminId: string;
  members: string[];
  trainingSchedule: TrainingSession[];
  courtIds: string[];
  fees: {
    monthly: number;
    session: number;
  };
  createdAt: Date;
}

export interface TrainingSession {
  id: string;
  title: string;
  courtId: string;
  startTime: Date;
  endTime: Date;
  maxParticipants: number;
  currentParticipants: number;
  price: number;
  recurringDays: string[];
}

export interface CheckIn {
  id: string;
  userId: string;
  courtId: string;
  checkedInAt: Date;
  checkedOutAt?: Date;
}