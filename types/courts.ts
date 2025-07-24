export interface CourtVisit {
  courtId: string;
  date: string; // ISO string
  checkedIn: boolean;
}
  
  
export interface Court {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address: string;
  images?: string[];
  tags: string[]; // amenities - extensive list of options
  checkedInUsers: string[];
  followers: string[];
  createdBy: string;
  createdAt: string;
  rating?: number;
  reviews?: Review[];
  openingHours: OpeningHours;
}
  
export interface OpeningHours {
  alwaysOpen: boolean;
  timezone: string; // extensive list timezones based on luxon library
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