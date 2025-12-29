export interface CourtVisit {
  courtId: string;
  date: string; // ISO string
  checkedIn: boolean;
}
  
  
export interface Court {
  id: string;
  name: string;
  description: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
    geohash: string;
  };
  images?: string[];
  tags: string[]; // amenities - extensive list of options
  checkedInUsers: string[];
  followers: string[];
  createdBy: string;
  createdAt: string;
  rating?: number;
  reviews?: Review[];
  openingHours: OpeningHours;
  verified: boolean;
}
  
export interface OpeningHours {
  alwaysOpen: boolean;
  monday: {
    alwaysOpen: boolean;
    openTime: string;
    closeTime: string;
  };
  tuesday: {
    alwaysOpen: boolean;
    openTime: string;
    closeTime: string;
  };
  wednesday: {
    alwaysOpen: boolean;
    openTime: string;
    closeTime: string;
  };
  thursday: {
    alwaysOpen: boolean;
    openTime: string;
    closeTime: string;
  };
  friday: {
    alwaysOpen: boolean;
    openTime: string;
    closeTime: string;
  };
  saturday: {
    alwaysOpen: boolean;
    openTime: string;
    closeTime: string;
  };
  sunday: {
    alwaysOpen: boolean;
    openTime: string;
    closeTime: string;
  };
}
  
export interface Review {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface CreateCourtForm {
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  geohash: string;
  images: string[];
  tags: string[]; // amenities - extensive list of options
  createdBy: string;
  openingHours: OpeningHours;
}