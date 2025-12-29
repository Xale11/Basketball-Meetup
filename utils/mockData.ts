import { Court } from '@/types/courts';
import { Event } from '@/types/event';
import { User } from '@/types/user';
import { Club } from '@/types/club';

export const mockUser: User = {
  id: '1',
  email: 'john.doe@example.com',
  name: 'John Doe',
  avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
  createdAt: new Date().toISOString(),
  over18: true,
  clubs: [],
  courtHistory: [],
  badges: [],
};

export const mockCourts: Court[] = [
  {
    id: '1',
    name: 'Central Park Basketball Court',
    description: 'A popular outdoor basketball court located in the heart of Central Park. Features full court with lighting for evening games.',
    location: {
      latitude: 40.7829,
      longitude: -73.9654,
      geohash: '',
      address: '1 Central Park, New York, NY 10023',
    },
    images: [
      'https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1080882/pexels-photo-1080882.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    tags: ['Outdoor', 'Full Court', 'Lighting', 'Free'],
    checkedInUsers: ['1', '2'],
    followers: ['1', '2', '3'],
    createdBy: '1',
    createdAt: new Date().toISOString(),
    rating: 4.5,
    reviews: [],
    openingHours: {
      alwaysOpen: true,
      monday: { alwaysOpen: true, openTime: '', closeTime: '' },
      tuesday: { alwaysOpen: true, openTime: '', closeTime: '' },
      wednesday: { alwaysOpen: true, openTime: '', closeTime: '' },
      thursday: { alwaysOpen: true, openTime: '', closeTime: '' },
      friday: { alwaysOpen: true, openTime: '', closeTime: '' },
      saturday: { alwaysOpen: true, openTime: '', closeTime: '' },
      sunday: { alwaysOpen: true, openTime: '', closeTime: '' },
    },
    verified: true,
  },
  {
    id: '2',
    name: 'Brooklyn Bridge Park Courts',
    description: 'Scenic half-court basketball courts with stunning waterfront views. Perfect for casual games and pickup matches.',
    location: {
      latitude: 40.7009,
      longitude: -73.9969,
      geohash: '',
      address: '334 Furman St, Brooklyn, NY 11201',
    },
    images: [
      'https://images.pexels.com/photos/1080882/pexels-photo-1080882.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    tags: ['Outdoor', 'Half Court', 'Waterfront View'],
    checkedInUsers: ['3'],
    followers: ['1', '4'],
    createdBy: '2',
    createdAt: new Date().toISOString(),
    rating: 4.2,
    reviews: [],
    openingHours: {
      alwaysOpen: true,
      monday: { alwaysOpen: true, openTime: '', closeTime: '' },
      tuesday: { alwaysOpen: true, openTime: '', closeTime: '' },
      wednesday: { alwaysOpen: true, openTime: '', closeTime: '' },
      thursday: { alwaysOpen: true, openTime: '', closeTime: '' },
      friday: { alwaysOpen: true, openTime: '', closeTime: '' },
      saturday: { alwaysOpen: true, openTime: '', closeTime: '' },
      sunday: { alwaysOpen: true, openTime: '', closeTime: '' },
    },
    verified: false,
  },
];

export const mockEvents: Event[] = [
  {
    id: '1',
    title: '3v3 Tournament',
    description: 'Competitive 3v3 basketball tournament. Winner takes all!',
    courtId: '1',
    mainOrganiser: { type: 'user', id: '1' },
    organiserUserIds: ['1'],
    organiserClubIds: [],
    startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    endDate: new Date(Date.now() + 86400000 + 3600000).toISOString(), // Tomorrow + 1 hour
    maxParticipants: 12,
    currentParticipants: 8,
    pricing: [],
    ticketDeadline: 'upcoming',
    isPrivate: false,
    participants: [],
    status: 'upcoming',
    createdAt: new Date().toISOString(),
    acceptingParticipants: true,
    verifyParticipants: false,
  },
  {
    id: '2',
    title: 'Free Pickup Games',
    description: 'Casual pickup games every Sunday. All skill levels welcome!',
    courtId: '2',
    mainOrganiser: { type: 'user', id: '2' },
    organiserUserIds: ['2'],
    organiserClubIds: [],
    startDate: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
    endDate: new Date(Date.now() + 259200000 + 7200000).toISOString(), // 3 days + 2 hours
    maxParticipants: 20,
    currentParticipants: 5,
    pricing: [],
    ticketDeadline: 'upcoming',
    isPrivate: false,
    participants: [],
    status: 'upcoming',
    createdAt: new Date().toISOString(),
    acceptingParticipants: true,
    verifyParticipants: false,
  },
];

export const mockClubs: Club[] = [
  {
    id: '1',
    name: 'NYC Ballers',
    description: 'Premier basketball club in New York City. We focus on skill development and competitive play.',
    logo: 'https://images.pexels.com/photos/1080882/pexels-photo-1080882.jpeg?auto=compress&cs=tinysrgb&w=400',
    adminId: '1',
    members: ['1', '2', '3', '4', '5'],
    trainingSchedule: [
      {
        id: '1',
        title: 'Skills Training',
        courtId: '1',
        startTime: new Date(Date.now() + 86400000),
        endTime: new Date(Date.now() + 86400000 + 3600000),
        maxParticipants: 15,
        currentParticipants: 10,
        price: 20,
        recurringDays: ['Monday', 'Wednesday', 'Friday'],
      },
    ],
    courtIds: ['1'],
    fees: {
      monthly: 150,
      session: 20,
    },
    createdAt: new Date(),
  },
];