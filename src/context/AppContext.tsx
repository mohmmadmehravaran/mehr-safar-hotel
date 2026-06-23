import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Hotel, Booking, UserReview, ReviewLevel, AccommodationType, SiteUser } from '../types';
import { api, tokenStore } from '../api';
import { sampleHotels, sampleReviews, sampleBookings, adminUser } from '../data/hotels';

// در صورت نبود بک‌اند (مثلاً دیپلوی استاتیک روی GitHub Pages) اپ به این داده‌های نمونه و ورود محلی برمی‌گردد.
const DEMO_ADMIN_TOKEN = 'demo-admin-token';
const DEMO_USER_TOKEN_PREFIX = 'demo-user-token:';
const DEMO_USERS_KEY = 'mehrsafar-demo-users';
const DEMO_HOTELS_KEY = 'mehrsafar-demo-hotels';
const DEMO_REVIEWS_KEY = 'mehrsafar-demo-reviews';
const DEMO_BOOKINGS_KEY = 'mehrsafar-demo-bookings';

// ── کمک‌تابع‌های حالت دمو برای کاربران (ذخیره در localStorage) ──
function loadDemoUsers(): SiteUser[] {
  try { return JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || '[]') as SiteUser[]; } catch { return []; }
}
function saveDemoUsers(list: SiteUser[]) {
  try { localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}
function demoLoginByPhone(phone: string): SiteUser {
  const list = loadDemoUsers();
  let user = list.find((u) => u.phone === phone);
  if (!user) {
    user = {
      id: Date.now(),
      fullName: 'کاربر مهمان',
      phone,
      email: '',
      password: '',
      createdAt: new Date().toISOString(),
    };
    list.push(user);
    saveDemoUsers(list);
  }
  return user;
}
function demoUpdateUser(phone: string, data: { fullName: string; email: string; phone: string }): SiteUser | null {
  const list = loadDemoUsers();
  const i = list.findIndex((u) => u.phone === phone);
  if (i < 0) return null;
  list[i] = { ...list[i], ...data };
  saveDemoUsers(list);
  return list[i];
}

// ── ذخیره‌سازی محلی هتل‌ها / نظرات / رزروها (حالت دمو بدون بک‌اند) ──
function loadDemoHotels(): Hotel[] {
  try {
    const raw = localStorage.getItem(DEMO_HOTELS_KEY);
    if (raw) return JSON.parse(raw) as Hotel[];
  } catch { /* ignore */ }
  return sampleHotels;
}
function saveDemoHotels(list: Hotel[]) {
  try { localStorage.setItem(DEMO_HOTELS_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}
function loadDemoReviews(): UserReview[] {
  try {
    const raw = localStorage.getItem(DEMO_REVIEWS_KEY);
    if (raw) return JSON.parse(raw) as UserReview[];
  } catch { /* ignore */ }
  return sampleReviews;
}
function saveDemoReviews(list: UserReview[]) {
  try { localStorage.setItem(DEMO_REVIEWS_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}
function loadDemoBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(DEMO_BOOKINGS_KEY);
    if (raw) return JSON.parse(raw) as Booking[];
  } catch { /* ignore */ }
  return sampleBookings;
}
function saveDemoBookings(list: Booking[]) {
  try { localStorage.setItem(DEMO_BOOKINGS_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

interface Filters {
  stars: number[];
  types: AccommodationType[];
  reviews: ReviewLevel[];
  minPrice: number;
  maxPrice: number;
  city: string;
  search: string;
  checkIn: string;
  checkOut: string;
}

type Result = { success: boolean; message: string };

interface AppContextType {
  hotels: Hotel[];
  bookings: Booking[];
  reviews: UserReview[];
  users: SiteUser[];
  filters: Filters;
  filteredHotels: Hotel[];
  loading: boolean;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  addBooking: (booking: Booking) => Promise<Result>;
  updateBookingStatus: (id: number, status: Booking['status']) => Promise<void>;
  addReview: (review: UserReview) => Promise<void>;
  addHotel: (hotel: Hotel) => Promise<void>;
  updateHotel: (hotel: Hotel) => Promise<void>;
  deleteHotel: (id: number) => Promise<void>;
  isAdmin: boolean;
  adminName: string;
  loginAdmin: (username: string, password: string) => Promise<boolean>;
  logoutAdmin: () => void;
  adminUpdateUser: (id: number, data: { fullName: string; phone: string; email: string; password?: string }) => Promise<Result>;
  adminDeleteUser: (id: number) => Promise<void>;
  currentUser: SiteUser | null;
  loginWithPhone: (phone: string) => Promise<Result>;
  updateProfile: (data: { fullName: string; email: string; phone: string }) => Promise<Result>;
  logoutUser: () => void;
}

const defaultFilters: Filters = {
  stars: [], types: [], reviews: [], minPrice: 0, maxPrice: 10000000,
  city: '', search: '', checkIn: '', checkOut: '',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [users, setUsers] = useState<SiteUser[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [loading, setLoading] = useState(true);

  const [isAdmin, setIsAdmin] = useState<boolean>(() => !!tokenStore.getAdmin());
  const [adminName, setAdminName] = useState<string>(() => {
    try { return localStorage.getItem('mehrsafar-admin-name') || ''; } catch { return ''; }
  });
  const [currentUser, setCurrentUser] = useState<SiteUser | null>(null);

  // ── Initial public data ──
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [h, r] = await Promise.all([api.listHotels(), api.listReviews()]);
        if (!alive) return;
        setHotels(h);
        setReviews(r);
      } catch (e) {
        // بک‌اند در دسترس نیست → حالت دمو با داده‌های داخلی
        console.warn('Backend unavailable, falling back to demo data', e);
        if (alive) {
          setHotels(loadDemoHotels());
          setReviews(loadDemoReviews());
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // ── Restore logged-in user from token ──
  useEffect(() => {
    const t = tokenStore.getUser();
    if (!t) return;
    // حالت دمو: بازیابی کاربر از localStorage
    if (t.startsWith(DEMO_USER_TOKEN_PREFIX)) {
      const phone = t.slice(DEMO_USER_TOKEN_PREFIX.length);
      const u = loadDemoUsers().find((x) => x.phone === phone) || null;
      if (u) setCurrentUser(u); else { tokenStore.setUser(''); setCurrentUser(null); }
      return;
    }
    api.me(t).then(setCurrentUser).catch(() => { tokenStore.setUser(''); setCurrentUser(null); });
  }, []);

  // ── Load bookings (admin: all, user: mine) ──
  const refreshBookings = useCallback(async () => {
    const adminTok = tokenStore.getAdmin();
    const userTok = tokenStore.getUser();
    if (adminTok === DEMO_ADMIN_TOKEN) { setBookings(loadDemoBookings()); return; }
    if (userTok.startsWith(DEMO_USER_TOKEN_PREFIX)) {
      const phone = userTok.slice(DEMO_USER_TOKEN_PREFIX.length);
      setBookings(loadDemoBookings().filter((b) => b.guestPhone === phone));
      return;
    }
    try {
      if (adminTok) setBookings(await api.allBookings(adminTok));
      else if (userTok) setBookings(await api.myBookings(userTok));
      else setBookings([]);
    } catch (e) {
      // حالت دمو: نمایش رزروهای نمونه برای مدیر
      if (adminTok) setBookings(loadDemoBookings()); else setBookings([]);
      console.warn('Bookings API unavailable, using demo data', e);
    }
  }, []);

  const refreshUsers = useCallback(async () => {
    const adminTok = tokenStore.getAdmin();
    if (!adminTok) { setUsers([]); return; }
    try { setUsers(await api.listUsers(adminTok)); } catch (e) { console.error('Failed to load users', e); }
  }, []);

  useEffect(() => { void refreshBookings(); }, [isAdmin, currentUser, refreshBookings]);
  useEffect(() => { void refreshUsers(); }, [isAdmin, refreshUsers]);

  const refreshHotels = useCallback(async () => {
    try { setHotels(await api.listHotels()); } catch (e) { console.error(e); }
  }, []);

  // ── Client-side filtering (unchanged behavior) ──
  const filteredHotels = hotels.filter((hotel) => {
    if (filters.stars.length > 0 && !filters.stars.includes(hotel.stars)) return false;
    if (filters.types.length > 0 && !filters.types.includes(hotel.type)) return false;
    if (filters.reviews.length > 0 && !filters.reviews.includes(hotel.review)) return false;
    if (hotel.pricePerNight < filters.minPrice || hotel.pricePerNight > filters.maxPrice) return false;
    if (filters.city && !hotel.city.includes(filters.city)) return false;
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (!hotel.name.toLowerCase().includes(s) && !hotel.city.toLowerCase().includes(s) && !hotel.address.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  // ── Bookings ──
  const addBooking = useCallback(async (booking: Booking): Promise<Result> => {
    const adminTok = tokenStore.getAdmin();
    const userTok = tokenStore.getUser();
    // حالت دمو (بدون بک‌اند): ذخیره‌ی محلی رزرو
    if (adminTok === DEMO_ADMIN_TOKEN || userTok.startsWith(DEMO_USER_TOKEN_PREFIX) || (!adminTok && !userTok)) {
      const all = loadDemoBookings();
      const exists = all.some((b) => b.id === booking.id);
      const next = exists ? all : [booking, ...all];
      saveDemoBookings(next);
      await refreshBookings();
      return { success: true, message: 'رزرو با موفقیت ثبت شد.' };
    }
    try {
      await api.createBooking({
        hotelId: booking.hotelId,
        roomId: booking.roomId,
        guestName: booking.guestName,
        guestPhone: booking.guestPhone,
        guestEmail: booking.guestEmail || '',
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests,
      }, tokenStore.getUser() || undefined);
      await refreshBookings();
      return { success: true, message: 'رزرو با موفقیت ثبت شد.' };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : 'ثبت رزرو ناموفق بود.' };
    }
  }, [refreshBookings]);

  const updateBookingStatus = useCallback(async (id: number, status: Booking['status']) => {
    const tok = tokenStore.getAdmin();
    if (!tok) return;
    if (tok === DEMO_ADMIN_TOKEN) {
      const next = loadDemoBookings().map((b) => (b.id === id ? { ...b, status } : b));
      saveDemoBookings(next);
      setBookings(next);
      return;
    }
    try {
      await api.updateBookingStatus(id, status, tok);
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    } catch (e) { console.error(e); }
  }, []);

  // ── Reviews ──
  const addReview = useCallback(async (review: UserReview) => {
    try {
      await api.createReview({ hotelId: review.hotelId, userName: review.userName, rating: review.rating, comment: review.comment });
      setReviews(await api.listReviews());
    } catch (e) {
      // حالت دمو (بدون بک‌اند): ذخیره‌ی محلی نظر
      console.warn('Reviews API unavailable, storing review locally', e);
      const next = [{ ...review }, ...loadDemoReviews()];
      saveDemoReviews(next);
      setReviews(next);
    }
  }, []);

  // ── Hotels (admin) ──
  const addHotel = useCallback(async (hotel: Hotel) => {
    const tok = tokenStore.getAdmin();
    if (!tok) return;
    if (tok === DEMO_ADMIN_TOKEN) {
      const current = loadDemoHotels();
      const id = (!hotel.id || current.some((h) => h.id === hotel.id))
        ? (current.length ? Math.max(...current.map((h) => h.id)) + 1 : 1)
        : hotel.id;
      const next = [...current, { ...hotel, id }];
      saveDemoHotels(next);
      setHotels(next);
      return;
    }
    try { await api.createHotel(hotel, tok); await refreshHotels(); } catch (e) { console.error(e); alert(e instanceof Error ? e.message : 'خطا'); }
  }, [refreshHotels]);

  const updateHotel = useCallback(async (hotel: Hotel) => {
    const tok = tokenStore.getAdmin();
    if (!tok) return;
    if (tok === DEMO_ADMIN_TOKEN) {
      const next = loadDemoHotels().map((h) => (h.id === hotel.id ? { ...hotel } : h));
      saveDemoHotels(next);
      setHotels(next);
      return;
    }
    try { await api.updateHotel(hotel.id, hotel, tok); await refreshHotels(); } catch (e) { console.error(e); alert(e instanceof Error ? e.message : 'خطا'); }
  }, [refreshHotels]);

  const deleteHotel = useCallback(async (id: number) => {
    const tok = tokenStore.getAdmin();
    if (!tok) return;
    if (tok === DEMO_ADMIN_TOKEN) {
      const next = loadDemoHotels().filter((h) => h.id !== id);
      saveDemoHotels(next);
      setHotels(next);
      return;
    }
    try { await api.deleteHotel(id, tok); setHotels((prev) => prev.filter((h) => h.id !== id)); } catch (e) { console.error(e); }
  }, []);

  // ── Admin auth ──
  const loginAdmin = useCallback(async (username: string, password: string) => {
    try {
      const res = await api.adminLogin(username, password) as { token: string; admin: { name: string } };
      tokenStore.setAdmin(res.token);
      setIsAdmin(true);
      setAdminName(res.admin?.name || 'مدیر سیستم');
      try { localStorage.setItem('mehrsafar-admin-name', res.admin?.name || 'مدیر سیستم'); } catch { /* ignore */ }
      return true;
    } catch {
      // بک‌اند در دسترس نیست → ورود محلی (حالت دمو) با مقایسه‌ی مقادیر داخلی
      if (username === adminUser.username && password === adminUser.password) {
        tokenStore.setAdmin(DEMO_ADMIN_TOKEN);
        setIsAdmin(true);
        setAdminName(adminUser.name);
        try { localStorage.setItem('mehrsafar-admin-name', adminUser.name); } catch { /* ignore */ }
        return true;
      }
      return false;
    }
  }, []);

  const logoutAdmin = useCallback(() => {
    tokenStore.setAdmin('');
    setIsAdmin(false);
    setAdminName('');
    setUsers([]);
    try {
      localStorage.removeItem('mehrsafar-admin-name');
      localStorage.setItem('mehrsafar-visual-editing', '0');
    } catch { /* ignore */ }
  }, []);

  const adminUpdateUser = useCallback(async (id: number, data: { fullName: string; phone: string; email: string; password?: string }): Promise<Result> => {
    const tok = tokenStore.getAdmin();
    if (!tok) return { success: false, message: 'دسترسی مدیر لازم است.' };
    try {
      await api.updateUser(id, data, tok);
      await refreshUsers();
      return { success: true, message: 'اطلاعات کاربر به‌روزرسانی شد.' };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : 'به‌روزرسانی ناموفق بود.' };
    }
  }, [refreshUsers]);

  const adminDeleteUser = useCallback(async (id: number) => {
    const tok = tokenStore.getAdmin();
    if (!tok) return;
    try { await api.deleteUser(id, tok); setUsers((prev) => prev.filter((u) => u.id !== id)); } catch (e) { console.error(e); }
  }, []);

  // ── User auth (phone-first) ──
  const loginWithPhone = useCallback(async (phone: string): Promise<Result> => {
    try {
      const res = await api.loginPhone(phone) as unknown as { token: string; user: SiteUser };
      tokenStore.setUser(res.token);
      setCurrentUser(res.user);
      return { success: true, message: 'ورود با موفقیت انجام شد.' };
    } catch (e) {
      // بک‌اند در دسترس نیست → ورود/ثبت‌نام محلی (حالت دمو)
      const cleaned = (phone || '').trim();
      const digits = cleaned.replace(/\D/g, '');
      if (digits.length >= 10) {
        const user = demoLoginByPhone(cleaned);
        tokenStore.setUser(DEMO_USER_TOKEN_PREFIX + cleaned);
        setCurrentUser(user);
        return { success: true, message: 'ورود با موفقیت انجام شد.' };
      }
      return { success: false, message: 'شماره موبایل معتبر وارد کنید.' };
    }
  }, []);

  const updateProfile = useCallback(async (data: { fullName: string; email: string; phone: string }): Promise<Result> => {
    const tok = tokenStore.getUser();
    if (!tok) return { success: false, message: 'ابتدا وارد شوید.' };
    // حالت دمو: به‌روزرسانی محلی پروفایل
    if (tok.startsWith(DEMO_USER_TOKEN_PREFIX)) {
      const phone = tok.slice(DEMO_USER_TOKEN_PREFIX.length);
      const updated = demoUpdateUser(phone, data);
      if (updated) {
        // اگر شماره عوض شد، توکن را نیز به‌روزرسانی کن
        if (data.phone && data.phone !== phone) tokenStore.setUser(DEMO_USER_TOKEN_PREFIX + data.phone);
        setCurrentUser(updated);
        return { success: true, message: 'پروفایل به‌روزرسانی شد.' };
      }
      return { success: false, message: 'به‌روزرسانی ناموفق بود.' };
    }
    try {
      const fresh = await api.me(tok);
      setCurrentUser(fresh);
      return { success: true, message: 'پروفایل به‌روزرسانی شد.' };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : 'به‌روزرسانی ناموفق بود.' };
    }
  }, []);

  const logoutUser = useCallback(() => {
    tokenStore.setUser('');
    setCurrentUser(null);
    setBookings([]);
  }, []);

  return (
    <AppContext.Provider
      value={{
        hotels, bookings, reviews, users, filters, filteredHotels, loading,
        setFilters, addBooking, updateBookingStatus, addReview,
        addHotel, updateHotel, deleteHotel,
        isAdmin, adminName, loginAdmin, logoutAdmin,
        adminUpdateUser, adminDeleteUser,
        currentUser, loginWithPhone, updateProfile, logoutUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
