export type UserRole = 'STUDENT' | 'LANDLORD' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Campus {
  id: string;
  name: string;
  location: string;
  address: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  listingCount?: number;
  createdAt?: string;
}

export interface ListingPhoto {
  id: string;
  listingId: string;
  photoUrl: string;
  isPrimary: boolean;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  accommodationType: string;
  pricePerMonth: number;
  address: string;
  latitude: number;
  longitude: number;
  distanceFromCampus: number;
  totalRooms: number;
  availableRooms: number;
  amenities: string[];
  availabilityStatus: 'AVAILABLE' | 'LIMITED' | 'FULL' | 'UNAVAILABLE';
  approvalStatus: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  campus: {
    id: string;
    name: string;
    location: string;
  };
  photos: ListingPhoto[];
  primaryPhoto?: string | null;
  provider?: {
    id: string;
    name: string;
    isVerified: boolean;
  };
  owner?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    isVerified: boolean;
    createdAt?: string;
  };
  reviews?: Review[];
  averageRating: number;
  reviewCount: number;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: unknown;
}
