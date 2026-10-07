import {
  ApiResponse,
  AppNotification,
  Campus,
  Conversation,
  Favourite,
  Institution,
  Listing,
  ListingReport,
  Message,
  Pagination,
  Review,
  User,
} from '../types';

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

  const headers = new Headers(options.headers);
  const isMultipart = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isMultipart && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
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
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Network error occurred');
  }
}

export function getMediaUrl(reference: string): string {
  if (/^https?:\/\//i.test(reference)) return reference;
  return `${API_BASE}${reference.startsWith('/') ? reference : `/${reference}`}`;
}

export async function fetchMedia(reference: string): Promise<Blob> {
  const token = getToken();
  const response = await fetch(getMediaUrl(reference), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) throw new Error('This file is unavailable or you do not have permission to view it.');
  return response.blob();
}

// Authentication API
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiFetch<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  uploadProfilePicture: (file: File) => {
    const body = new FormData();
    body.append('picture', file);
    return apiFetch<{ user: User }>('/users/me/profile-picture', {
      method: 'POST',
      body,
    });
  },

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
  getInstitutions: () => apiFetch<Institution[]>('/campuses/institutions'),
  getAdminInstitutions: () => apiFetch<Institution[]>('/campuses/institutions/manage'),
  getInstitutionSuggestions: (search = '') => {
    const query = new URLSearchParams({ search });
    return apiFetch<Array<{ name: string; country: string; countryCode: string | null; domains: string[]; webPages: string[] }>>(`/campuses/institutions/suggestions?${query}`);
  },
  createInstitution: (data: { name: string; shortName?: string | null }) =>
    apiFetch<Institution>('/campuses/institutions', { method: 'POST', body: JSON.stringify(data) }),
  updateInstitution: (id: string, data: Partial<Institution>) =>
    apiFetch<Institution>(`/campuses/institutions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  getCampuses: (all = false, institutionId?: string) => {
    const query = new URLSearchParams();
    if (institutionId) query.set('institutionId', institutionId);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return apiFetch<Campus[]>(`${all ? '/campuses/manage' : '/campuses'}${suffix}`);
  },

  getCampusById: (id: string) => apiFetch<Campus>(`/campuses/${id}`),

  createCampus: (data: {
    name: string;
    institutionId: string;
    location: string;
    address: string;
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
  searchListings: (params: Record<string, unknown> = {}) => {
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
    apiFetch<{ items: Listing[]; stats: Record<string, number> }>('/listings/my'),

  createListing: (body: FormData) =>
    apiFetch<Listing>('/listings', {
      method: 'POST',
      body,
    }),

  updateListing: (id: string, data: Record<string, unknown>) =>
    apiFetch<Listing>(`/listings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteListing: (id: string) =>
    apiFetch<null>(`/listings/${id}`, {
      method: 'DELETE',
    }),
};

export const favouriteApi = {
  list: () => apiFetch<Favourite[]>('/users/favourites'),
  add: (listingId: string) =>
    apiFetch<{ listingId: string; isFavourite: boolean }>(`/users/favourites/${listingId}`, { method: 'POST' }),
  remove: (listingId: string) =>
    apiFetch<{ listingId: string; isFavourite: boolean }>(`/users/favourites/${listingId}`, { method: 'DELETE' }),
};

export const reviewApi = {
  list: (listingId: string) => apiFetch<Review[]>(`/listings/${listingId}/reviews`),
  create: (listingId: string, data: { rating: number; comment: string }) =>
    apiFetch<Review>(`/listings/${listingId}/reviews`, { method: 'POST', body: JSON.stringify(data) }),
};

export const reportApi = {
  create: (listingId: string, data: { reason: string; description: string }) =>
    apiFetch<ListingReport>(`/listings/${listingId}/reports`, { method: 'POST', body: JSON.stringify(data) }),
};

export const conversationApi = {
  list: () => apiFetch<Conversation[]>('/conversations'),
  start: (listingId: string) =>
    apiFetch<Conversation>('/conversations', { method: 'POST', body: JSON.stringify({ listingId }) }),
  messages: (conversationId: string) => apiFetch<Message[]>(`/conversations/${conversationId}/messages`),
  send: (conversationId: string, content: string, attachment?: File) => {
    const body = new FormData();
    body.append('content', content);
    if (attachment) body.append('attachment', attachment);
    return apiFetch<Message>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body,
    });
  },
  markRead: (conversationId: string) =>
    apiFetch<{ conversationId: string; updated: boolean }>(`/conversations/${conversationId}/read`, { method: 'PATCH' }),
};

export const notificationApi = {
  list: () => apiFetch<AppNotification[]>('/notifications'),
  markRead: (id: string) =>
    apiFetch<AppNotification>(`/notifications/${id}/read`, { method: 'PATCH' }),
};

// Admin API
export const adminApi = {
  getPendingListings: () => apiFetch<Listing[]>('/admin/listings/pending'),

  getListings: (status?: Listing['approvalStatus']) => {
    const query = new URLSearchParams();
    if (status) query.set('status', status);
    return apiFetch<Listing[]>(`/admin/listings${query.size ? `?${query}` : ''}`);
  },

  approveListing: (id: string) =>
    apiFetch<Listing>(`/admin/listings/${id}/approve`, {
      method: 'PATCH',
    }),

  rejectListing: (id: string, reason: string) =>
    apiFetch<Listing>(`/admin/listings/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),

  getAdminStats: () => apiFetch<Record<string, number>>('/admin/stats'),
  getUsers: (filters: { role?: User['role']; verified?: boolean } = {}) => {
    const query = new URLSearchParams();
    if (filters.role) query.set('role', filters.role);
    if (filters.verified !== undefined) query.set('verified', String(filters.verified));
    return apiFetch<User[]>(`/admin/users${query.size ? `?${query}` : ''}`);
  },
  updateUser: (id: string, data: { isVerified?: boolean; isActive?: boolean }) =>
    apiFetch<User>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getAuditLogs: (filters: { from?: string; to?: string; targetType?: string } = {}) => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) query.set(key, value); });
    return apiFetch<Array<{ id: string; action: string; targetType: string; targetId: string; description: string; createdAt: string; admin: Pick<User, 'id' | 'name'> }>>(`/admin/audit-logs${query.size ? `?${query}` : ''}`);
  },
  getReports: () => apiFetch<ListingReport[]>('/admin/reports'),
  updateReport: (id: string, status: ListingReport['status'], adminReviewNote = '') =>
    apiFetch<ListingReport>(`/admin/reports/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, adminReviewNote }) }),
};
