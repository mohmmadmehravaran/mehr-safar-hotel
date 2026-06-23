// ──────────────────────────────────────────────────────────────────────────
// API client for the Mehr Safar backend.
// Base URL: VITE_API_BASE if provided, otherwise same-origin "/api"
// (works when the backend serves the built frontend as a single service).
// ──────────────────────────────────────────────────────────────────────────
import type { Hotel, Booking, UserReview, SiteUser } from './types';

const BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') || '/api';

const ADMIN_TOKEN_KEY = 'mehrsafar-admin-token';
const USER_TOKEN_KEY = 'mehrsafar-user-token';

export const tokenStore = {
  getAdmin: () => { try { return localStorage.getItem(ADMIN_TOKEN_KEY) || ''; } catch { return ''; } },
  getUser: () => { try { return localStorage.getItem(USER_TOKEN_KEY) || ''; } catch { return ''; } },
  setAdmin: (t: string) => { try { t ? localStorage.setItem(ADMIN_TOKEN_KEY, t) : localStorage.removeItem(ADMIN_TOKEN_KEY); } catch { /* ignore */ } },
  setUser: (t: string) => { try { t ? localStorage.setItem(USER_TOKEN_KEY, t) : localStorage.removeItem(USER_TOKEN_KEY); } catch { /* ignore */ } },
};

interface ApiOk<T> { success: true; data?: T; [k: string]: unknown; }
interface ApiErr { success: false; error: { message: string; details?: unknown }; }

async function request<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown; token?: string } = {},
): Promise<ApiOk<T>> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  let json: ApiOk<T> | ApiErr;
  try {
    json = await res.json();
  } catch {
    throw new Error('پاسخ نامعتبر از سرور دریافت شد.');
  }
  if (!res.ok || (json as ApiErr).success === false) {
    const msg = (json as ApiErr)?.error?.message || `خطای سرور (${res.status})`;
    throw new Error(msg);
  }
  return json as ApiOk<T>;
}

export const api = {
  // ── Hotels ──
  listHotels: () => request<Hotel[]>('/hotels?limit=200').then((r) => r.data ?? []),
  createHotel: (h: Partial<Hotel>, token: string) => request<Hotel>('/hotels', { method: 'POST', body: h, token }),
  updateHotel: (id: number, h: Partial<Hotel>, token: string) => request<Hotel>(`/hotels/${id}`, { method: 'PUT', body: h, token }),
  deleteHotel: (id: number, token: string) => request(`/hotels/${id}`, { method: 'DELETE', token }),

  // ── Reviews ──
  listReviews: () => request<UserReview[]>('/reviews').then((r) => r.data ?? []),
  createReview: (body: { hotelId: number; userName: string; rating: number; comment: string }) =>
    request<UserReview>('/reviews', { method: 'POST', body }),

  // ── Bookings ──
  createBooking: (body: {
    hotelId: number; roomId: number; guestName: string; guestPhone: string;
    guestEmail: string; checkIn: string; checkOut: string; guests: number;
  }, token?: string) => request<Booking>('/bookings', { method: 'POST', body, token }),
  myBookings: (token: string) => request<Booking[]>('/bookings/me', { token }).then((r) => r.data ?? []),
  allBookings: (token: string) => request<Booking[]>('/bookings', { token }).then((r) => r.data ?? []),
  trackBooking: (q: string) => request<Booking>(`/bookings/track/${encodeURIComponent(q)}`).then((r) => r.data as Booking),
  updateBookingStatus: (id: number, status: Booking['status'], token: string) =>
    request<Booking>(`/bookings/${id}/status`, { method: 'PATCH', body: { status }, token }),

  // ── Auth (user) ──
  loginPhone: (phone: string) => request<SiteUser>('/auth/login-phone', { method: 'POST', body: { phone } }),
  me: (token: string) => request<SiteUser>('/auth/me', { token }).then((r) => (r as { user: SiteUser }).user),
  updateProfile: (body: { fullName: string; email: string; phone: string }, token: string) =>
    request('/auth/profile', { method: 'PATCH', body, token }),

  // ── Auth (admin) ──
  adminLogin: (username: string, password: string) =>
    request('/auth/admin/login', { method: 'POST', body: { username, password } }),

  // ── Users (admin) ──
  listUsers: (token: string) => request<SiteUser[]>('/users', { token }).then((r) => r.data ?? []),
  updateUser: (id: number, body: { fullName: string; phone: string; email: string; password?: string }, token: string) =>
    request<SiteUser>(`/users/${id}`, { method: 'PUT', body, token }),
  deleteUser: (id: number, token: string) => request(`/users/${id}`, { method: 'DELETE', token }),
};

export type AuthResponse = { token: string; user?: SiteUser; admin?: { id: number; username: string; name: string } };
