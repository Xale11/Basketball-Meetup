export interface CourtVisit {
  court_id: string;
  date: string; // ISO string
  checked_in: boolean;
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
  checked_in_users: string[];
  followers: string[];
  created_by: string;
  created_at: string;
  rating?: number;
  reviews?: Review[];
  opening_hours: OpeningHours;
  verified: boolean;
}

export interface OpeningHours {
  always_open: boolean;
  monday: {
    always_open: boolean;
    open_time: string;
    close_time: string;
  };
  tuesday: {
    always_open: boolean;
    open_time: string;
    close_time: string;
  };
  wednesday: {
    always_open: boolean;
    open_time: string;
    close_time: string;
  };
  thursday: {
    always_open: boolean;
    open_time: string;
    close_time: string;
  };
  friday: {
    always_open: boolean;
    open_time: string;
    close_time: string;
  };
  saturday: {
    always_open: boolean;
    open_time: string;
    close_time: string;
  };
  sunday: {
    always_open: boolean;
    open_time: string;
    close_time: string;
  };
}

export interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: Date;
}

export interface CreateCourtForm {
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  geohash: string;
  images: string[]; // Array of local image URIs
  tags: string[]; // amenities - extensive list of options
  created_by: string;
  opening_hours: OpeningHours;
}
