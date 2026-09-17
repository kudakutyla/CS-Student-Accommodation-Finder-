import { ApiResponse, User, Campus, Listing, Pagination } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('saf_token');
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await res.json()
      : null;

    if (!res.ok) {
      throw new Error(
        data?.message ||
          `The API returned a non-JSON response (HTTP ${res.status}). Make sure the backend API is running on ${API_BASE}.`
      );
    }

    if (!data) {
      throw new Error(
        `The API returned a non-JSON response. Make sure the backend API is running on ${API_BASE}.`
      );
    }

    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Network error occurred');
  }
}

// Authentication API
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiFetch<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: 'STUDENT' | 'LANDLORD';
  }) =>
    apiFetch<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => apiFetch<{ user: User }>('/auth/me'),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('saf_token');
      localStorage.removeItem('saf_user');
    }
    return apiFetch<null>('/auth/logout', { method: 'POST' });
  },
};

// Campuses API
export const campusApi = {
  getCampuses: (all = false) =>
    apiFetch<Campus[]>(`/campuses${all ? '?all=true' : ''}`),

  getCampusById: (id: string) => apiFetch<Campus>(`/campuses/${id}`),

  createCampus: (data: {
    name: string;
    location: string;
    address: string;
    latitude: number;
    longitude: number;
    isActive?: boolean;
  }) =>
    apiFetch<Campus>('/campuses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCampus: (id: string, data: Partial<Campus>) =>
    apiFetch<Campus>(`/campuses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  toggleCampusStatus: (id: string, isActive: boolean) =>
    apiFetch<Campus>(`/campuses/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),
};

// Listings API
export const listingApi = {
  searchListings: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });
    const queryString = query.toString();
    return apiFetch<{ items: Listing[]; pagination: Pagination }>(
      `/listings${queryString ? `?${queryString}` : ''}`
    );
  },

  getListingById: (id: string) => apiFetch<Listing>(`/listings/${id}`),

  getMyListings: () =>
    apiFetch<{ items: Listing[]; stats: any }>('/listings/my'),

  createListing: (data: {
    title: string;
    description: string;
    campusId: string;
    accommodationType: string;
    pricePerMonth: number;
    address: string;
    latitude: number;
    longitude: number;
    totalRooms: number;
    availableRooms: number;
    amenities: string[];
    photos: string[];
    availabilityStatus?: string;
  }) =>
    apiFetch<Listing>('/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateListing: (id: string, data: any) =>
    apiFetch<Listing>(`/listings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteListing: (id: string) =>
    apiFetch<null>(`/listings/${id}`, {
      method: 'DELETE',
    }),
};

// Admin API
export const adminApi = {
  getPendingListings: () => apiFetch<Listing[]>('/admin/listings/pending'),

  approveListing: (id: string) =>
    apiFetch<Listing>(`/admin/listings/${id}/approve`, {
      method: 'PATCH',
    }),

  rejectListing: (id: string, reason: string) =>
    apiFetch<Listing>(`/admin/listings/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),

  getAdminStats: () => apiFetch<any>('/admin/stats'),
};
