export type UserRole = 'STUDENT' | 'LANDLORD' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  profilePicture?: string | null;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Institution {
  id: string;
  name: string;
  shortName?: string | null;
  isActive?: boolean;
  campusCount?: number;
  createdAt?: string;
}

export interface Campus {
  id: string;
  institutionId?: string | null;
  institution?: Institution | null;
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

export interface Favourite {
  id: string;
  listingId: string;
  createdAt: string;
  listing: Listing;
}

export interface Conversation {
  id: string;
  listingId: string;
  studentId: string;
  landlordId: string;
  listing: Listing;
  student: Pick<User, 'id' | 'name'>;
  landlord: Pick<User, 'id' | 'name'>;
  lastMessage?: Message | null;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ListingReport {
  id: string;
  reason: string;
  description: string;
  status: 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';
  adminReviewNote?: string | null;
  createdAt: string;
  listing: Pick<Listing, 'id' | 'title' | 'approvalStatus'>;
  user: Pick<User, 'id' | 'name' | 'email'>;
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
