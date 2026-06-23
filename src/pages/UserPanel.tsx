import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Settings, LogOut, UserCircle, Phone, Mail,
  BadgeCheck, Pencil, Moon, Users, Wallet, Ticket, MapPin, Save, ChevronLeft,
  Sparkles, Hotel as HotelIcon, Clock, Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { formatJalali, toPersianNumber } from '../utils/date';
import { useDocumentTitle } from '../utils/useDocumentTitle';

type View = 'dashboard' | 'bookings' | 'account';
type BookingFilter = 'all' | 'confirmed' | 'pending' | 'cancelled';

const statusLabel: Record<string, string> = { confirmed: 'تأیید شده', pending: 'در انتظار', cancelled: 'لغو شده' };
const statusStyle: Record<string, React.CSSProperties> = {
  confirmed: { backgroundColor: '#d1fae5', color: '#065f46' },
  pending: { backgroundColor: '#fef3c7', color: '#92400e' },
  cancelled: { backgroundColor: '#fee2e2', color: '#991b1b' },
};

function nights(checkIn: string, checkOut: string) {
  const a = new Date(checkIn).getTime();
  const b = new Date(checkOut).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86400000));
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'صبح بخیر';
  if (h < 17) return 'ظهر بخیر';
  if (h < 20) return 'عصر بخیر';
  return 'شب بخیر';
}

export default function UserPanel() {
  const navigate = useNavigate();
  const { currentUser, logoutUser, bookings, hotels, updateProfile } = useApp();
  const { theme } = useTheme();
  useDocumentTitle('پنل کاربری');

  const [view, setView] = useState<View>('dashboard');
  const [filter, setFilter] = useState<BookingFilter>('all');
  const [editing, setEditing] = useState(false);

  const myBookings = useMemo(() => {
    if (!currentUser) return [];
    return bookings.filter(
      (b) => b.guestEmail.toLowerCase() === currentUser.email.toLowerCase() || b.guestPhone === currentUser.phone
    );
  }, [bookings, currentUser]);

  // ── not logged in ──────────────────────────────────────────────
  if (!currentUser) {
    return (
      <div className="min-h-[calc(100dvh-64px)] flex flex-col items-center justify-center px-5 pb-24 md:pb-0" style={{ backgroundColor: theme.colors.bodyBg }}>
        <div className="text-center rounded-3xl p-8 w-full max-w-sm shadow-soft" style={{ backgroundColor: theme.colors.cardBg, border: `1px solid ${theme.colors.cardBorder}` }}>
          <UserCircle className="w-20 h-20 mx-auto mb-4" style={{ color: theme.colors.primary, opacity: 0.4 }} />
          <h1 className="text-2xl font-black mb-2" style={{ color: theme.colors.textPrimary }}>وارد نشده‌اید</h1>
          <p className="text-sm mb-6" style={{ color: theme.colors.textSecondary }}>برای مشاهده پنل کاربری ابتدا وارد شوید.</p>
          <Link to="/login" className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white font-black" style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` }}>
            ورود / عضویت
          </Link>
        </div>
      </div>
    );
  }

  const totalNights = myBookings.reduce((s, b) => s + nights(b.checkIn, b.checkOut), 0);
  const totalSpent = myBookings.filter((b) => b.status !== 'cancelled').reduce((s, b) => s + b.totalPrice, 0);
  const confirmedCount = myBookings.filter((b) => b.status === 'confirmed').length;

  const counts = {
    all: myBookings.length,
    confirmed: confirmedCount,
    pending: myBookings.filter((b) => b.status === 'pending').length,
    cancelled: myBookings.filter((b) => b.status === 'cancelled').length,
  };
  const visibleBookings = filter === 'all' ? myBookings : myBookings.filter((b) => b.status === filter);
  const hotelOf = (id: number) => hotels.find((h) => h.id === id);
  const isSyntheticEmail = currentUser.email.endsWith('@mehrsafar.local');
  const firstName = currentUser.fullName.split(' ')[0] || currentUser.fullName;

  const nav: { key: View; label: string; icon: typeof LayoutDashboard }[] = [
    { key: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { key: 'bookings', label: 'رزروهای من', icon: CalendarDays },
    { key: 'account', label: 'اطلاعات حساب', icon: Settings },
  ];

  const stats = [
    { icon: Ticket, label: 'رزروها', val: toPersianNumber(myBookings.length), tone: theme.colors.primary },
    { icon: Moon, label: 'شب اقامت', val: toPersianNumber(totalNights), tone: '#0ea5e9' },
    { icon: BadgeCheck, label: 'تأیید شده', val: toPersianNumber(confirmedCount), tone: '#10b981' },
    { icon: Wallet, label: 'مجموع خرید (تومان)', val: totalSpent.toLocaleString('fa-IR'), tone: '#f59e0b' },
  ];

  return (
    <div className="min-h-screen pb-28 md:pb-0" style={{ backgroundColor: theme.colors.bodyBg }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        <div className="flex flex-col md:flex-row gap-6">

          {/* ───────── SIDEBAR ───────── */}
          <aside className="md:w-72 shrink-0">
            <div className="md:sticky md:top-24 space-y-3">
              {/* profile card */}
              <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: theme.colors.cardBg, border: `1px solid ${theme.colors.cardBorder}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shrink-0" style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` }}>
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-black truncate" style={{ color: theme.colors.textPrimary }}>{currentUser.fullName}</div>
                    <div className="text-xs mt-0.5" dir="ltr" style={{ color: theme.colors.textSecondary, textAlign: 'right' }}>{currentUser.phone}</div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.colors.primaryLight, color: theme.colors.primary }}>
                      <BadgeCheck className="w-3 h-3" /> تأیید شده
                    </span>
                  </div>
                </div>
              </div>

              {/* nav */}
              <nav className="rounded-3xl p-2 shadow-sm flex md:block gap-1 overflow-x-auto" style={{ backgroundColor: theme.colors.cardBg, border: `1px solid ${theme.colors.cardBorder}` }}>
                {nav.map((n) => {
                  const active = view === n.key;
                  return (
                    <button
                      key={n.key}
                      onClick={() => setView(n.key)}
                      className="flex-1 md:w-full flex items-center justify-center md:justify-start gap-2.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap"
                      style={active
                        ? { background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`, color: '#fff' }
                        : { color: theme.colors.textSecondary }}
                    >
                      <n.icon className="w-4 h-4" /> {n.label}
                    </button>
                  );
                })}
              </nav>

              {/* logout (desktop) */}
              <button
                onClick={() => { logoutUser(); navigate('/'); }}
                className="hidden md:flex w-full py-3.5 rounded-2xl items-center justify-center gap-2 font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" /> خروج از حساب
              </button>
            </div>
          </aside>

          {/* ───────── CONTENT ───────── */}
          <main className="flex-1 min-w-0 space-y-5">

            {/* welcome banner — shown on every view as the post-login greeting */}
            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl p-6 text-white"
              style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` }}
            >
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full blur-3xl bg-white" />
                <div className="absolute -bottom-12 right-8 w-40 h-40 rounded-full blur-3xl bg-white" />
              </div>
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg sm:text-xl font-black flex items-center gap-2">
                    <span>{greeting()}، {firstName}</span>
                    <span aria-hidden>👋</span>
                  </div>
                  <p className="text-sm opacity-85 mt-1.5 leading-relaxed">
                    {myBookings.length > 0
                      ? `شما ${toPersianNumber(myBookings.length)} رزرو دارید. سفر بعدی‌تان را با مهر سفر برنامه‌ریزی کنید.`
                      : 'به پنل کاربری مهر سفر خوش آمدید. اولین رزرو خود را ثبت کنید!'}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs opacity-75">
                    <Clock className="w-3.5 h-3.5" />
                    عضو از {formatJalali(currentUser.createdAt)}
                  </div>
                </div>
                <Link
                  to="/"
                  className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold bg-white/15 hover:bg-white/25 backdrop-blur-xl px-4 py-2.5 rounded-2xl transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" /> رزرو جدید
                </Link>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {/* ───── DASHBOARD ───── */}
              {view === 'dashboard' && (
                <motion.div key="dash" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                  {/* stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {stats.map((s) => (
                      <div key={s.label} className="rounded-3xl p-4 shadow-sm" style={{ backgroundColor: theme.colors.cardBg, border: `1px solid ${theme.colors.cardBorder}` }}>
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: `${s.tone}1a` }}>
                          <s.icon className="w-5 h-5" style={{ color: s.tone }} />
                        </div>
                        <div className="text-lg font-black leading-tight" style={{ color: theme.colors.textPrimary }}>{s.val}</div>
                        <div className="text-[11px] font-semibold mt-0.5" style={{ color: theme.colors.textSecondary }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* recent bookings + quick actions */}
                  <div className="grid lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2 rounded-3xl p-5 shadow-sm" style={{ backgroundColor: theme.colors.cardBg, border: `1px solid ${theme.colors.cardBorder}` }}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-sm" style={{ color: theme.colors.textPrimary }}>آخرین رزروها</h3>
                        {myBookings.length > 0 && (
                          <button onClick={() => setView('bookings')} className="text-xs font-bold inline-flex items-center gap-0.5" style={{ color: theme.colors.primary }}>
                            مشاهده همه <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      {myBookings.length === 0 ? (
                        <EmptyBookings theme={theme} />
                      ) : (
                        <div className="space-y-3">
                          {myBookings.slice(0, 3).map((b) => (
                            <BookingCard key={b.id} b={b} hotel={hotelOf(b.hotelId)} theme={theme} compact />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: theme.colors.cardBg, border: `1px solid ${theme.colors.cardBorder}` }}>
                      <h3 className="font-black text-sm mb-4" style={{ color: theme.colors.textPrimary }}>دسترسی سریع</h3>
                      <div className="space-y-2">
                        <QuickLink to="/" icon={HotelIcon} label="جستجوی هتل" theme={theme} />
                        <QuickAction onClick={() => setView('bookings')} icon={Ticket} label="رزروهای من" theme={theme} />
                        <QuickAction onClick={() => { setView('account'); setEditing(true); }} icon={Pencil} label="ویرایش حساب" theme={theme} />
                        <QuickLink to="/track" icon={MapPin} label="پیگیری رزرو" theme={theme} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ───── BOOKINGS ───── */}
              {view === 'bookings' && (
                <motion.div key="bk" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {([
                      { key: 'all', label: 'همه' },
                      { key: 'confirmed', label: 'تأیید شده' },
                      { key: 'pending', label: 'در انتظار' },
                      { key: 'cancelled', label: 'لغو شده' },
                    ] as { key: BookingFilter; label: string }[]).map((f) => {
                      const active = filter === f.key;
                      return (
                        <button key={f.key} onClick={() => setFilter(f.key)} className="shrink-0 text-xs font-bold px-3.5 py-2 rounded-full transition-all"
                          style={active ? { backgroundColor: theme.colors.primary, color: '#fff' } : { backgroundColor: theme.colors.cardBg, color: theme.colors.textSecondary, border: `1px solid ${theme.colors.cardBorder}` }}>
                          {f.label} ({toPersianNumber(counts[f.key])})
                        </button>
                      );
                    })}
                  </div>

                  {visibleBookings.length === 0 ? (
                    <div className="rounded-3xl p-10 shadow-sm" style={{ backgroundColor: theme.colors.cardBg, border: `1px solid ${theme.colors.cardBorder}` }}>
                      <EmptyBookings theme={theme} />
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {visibleBookings.map((b) => (
                        <BookingCard key={b.id} b={b} hotel={hotelOf(b.hotelId)} theme={theme} />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ───── ACCOUNT ───── */}
              {view === 'account' && (
                <motion.div key="acc" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <AccountSection user={currentUser} isSyntheticEmail={isSyntheticEmail} editing={editing} setEditing={setEditing} updateProfile={updateProfile} theme={theme} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* logout (mobile) */}
            <button
              onClick={() => { logoutUser(); navigate('/'); }}
              className="md:hidden w-full py-4 rounded-3xl flex items-center justify-center gap-2 font-black text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-5 h-5" /> خروج از حساب کاربری
            </button>
          </main>
        </div>
      </div>
    </div>
  );
}

/* ── reusable bits ── */
type Theme = ReturnType<typeof useTheme>['theme'];

function EmptyBookings({ theme }: { theme: Theme }) {
  return (
    <div className="text-center py-6">
      <HotelIcon className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: theme.colors.textPrimary }} />
      <p className="text-sm mb-4" style={{ color: theme.colors.textSecondary }}>هنوز رزروی ثبت نکرده‌اید.</p>
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: theme.colors.primary }}>
        <Sparkles className="w-4 h-4" /> مشاهده هتل‌ها
      </Link>
    </div>
  );
}

function BookingCard({ b, hotel, theme, compact }: { b: any; hotel: any; theme: Theme; compact?: boolean }) {
  const img = hotel?.images?.[0];
  const n = nights(b.checkIn, b.checkOut);
  return (
    <div className="rounded-3xl overflow-hidden shadow-sm" style={{ backgroundColor: theme.colors.bodyBg, border: `1px solid ${theme.colors.cardBorder}` }}>
      <div className="flex">
        {img && (
          <div className="w-24 shrink-0 relative">
            <img src={img} alt={b.hotelName} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          </div>
        )}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-black text-sm truncate" style={{ color: theme.colors.textPrimary }}>{b.hotelName}</div>
              <div className="text-xs mt-0.5 flex items-center gap-2 flex-wrap" style={{ color: theme.colors.textSecondary }}>
                <span>{b.roomName}</span>
                {hotel?.city && <span className="inline-flex items-center gap-0.5"><MapPin className="w-3 h-3" />{hotel.city}</span>}
              </div>
            </div>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full shrink-0" style={statusStyle[b.status]}>{statusLabel[b.status]}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mt-2" style={{ color: theme.colors.textSecondary }}>
            <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{formatJalali(b.checkIn)} → {formatJalali(b.checkOut)}</span>
            <span className="flex items-center gap-1"><Moon className="w-3 h-3" />{toPersianNumber(n)} شب</span>
            {!compact && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{toPersianNumber(b.guests)} نفر</span>}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px dashed ${theme.colors.cardBorder}` }}>
            <span className="font-black text-sm" style={{ color: theme.colors.primary }}>{b.totalPrice.toLocaleString('fa-IR')} تومان</span>
            <Link to={`/hotel/${b.hotelId}`} className="text-xs font-bold inline-flex items-center gap-0.5" style={{ color: theme.colors.primary }}>
              هتل <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label, theme }: { to: string; icon: typeof Ticket; label: string; theme: Theme }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors hover:opacity-90" style={{ backgroundColor: theme.colors.bodyBg }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: theme.colors.primaryLight }}>
        <Icon className="w-4 h-4" style={{ color: theme.colors.primary }} />
      </div>
      <span className="text-sm font-bold flex-1" style={{ color: theme.colors.textPrimary }}>{label}</span>
      <ChevronLeft className="w-4 h-4" style={{ color: theme.colors.textMuted }} />
    </Link>
  );
}

function QuickAction({ onClick, icon: Icon, label, theme }: { onClick: () => void; icon: typeof Ticket; label: string; theme: Theme }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors hover:opacity-90" style={{ backgroundColor: theme.colors.bodyBg }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: theme.colors.primaryLight }}>
        <Icon className="w-4 h-4" style={{ color: theme.colors.primary }} />
      </div>
      <span className="text-sm font-bold flex-1 text-right" style={{ color: theme.colors.textPrimary }}>{label}</span>
      <ChevronLeft className="w-4 h-4" style={{ color: theme.colors.textMuted }} />
    </button>
  );
}

/* ── Account info + inline editor ── */
function AccountSection({ user, isSyntheticEmail, editing, setEditing, updateProfile, theme }: {
  user: { fullName: string; email: string; phone: string };
  isSyntheticEmail: boolean;
  editing: boolean;
  setEditing: (v: boolean) => void;
  updateProfile: (d: { fullName: string; email: string; phone: string }) => { success: boolean; message: string };
  theme: Theme;
}) {
  const [form, setForm] = useState({ fullName: user.fullName, email: isSyntheticEmail ? '' : user.email, phone: user.phone });
  const [alert, setAlert] = useState<{ ok: boolean; msg: string } | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await updateProfile(form);
    setAlert({ ok: r.success, msg: r.message });
    if (r.success) setEditing(false);
  };

  const rows = [
    { icon: UserCircle, label: 'نام و نام خانوادگی', value: user.fullName },
    { icon: Phone, label: 'شماره موبایل', value: user.phone, ltr: true },
    { icon: Mail, label: 'ایمیل', value: isSyntheticEmail ? '— ثبت نشده —' : user.email, ltr: !isSyntheticEmail, muted: isSyntheticEmail },
  ];

  return (
    <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: theme.colors.cardBg, border: `1px solid ${theme.colors.cardBorder}` }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-sm" style={{ color: theme.colors.textPrimary }}>اطلاعات حساب</h3>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-xs font-bold inline-flex items-center gap-1" style={{ color: theme.colors.primary }}>
            <Pencil className="w-3.5 h-3.5" /> ویرایش
          </button>
        )}
      </div>

      {alert && (
        <div role="alert" className="mb-4 p-3.5 rounded-2xl text-sm font-semibold"
          style={alert.ok ? { backgroundColor: theme.colors.primaryLight, color: theme.colors.primary } : { backgroundColor: '#fee2e2', color: '#dc2626' }}>
          {alert.ok ? '✓ ' : '✗ '}{alert.msg}
        </div>
      )}

      {!editing ? (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-3 p-3 rounded-2xl" style={{ backgroundColor: theme.colors.bodyBg }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: theme.colors.primaryLight }}>
                <r.icon className="w-4 h-4" style={{ color: theme.colors.primary }} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px]" style={{ color: theme.colors.textSecondary }}>{r.label}</div>
                <div className="text-sm font-semibold truncate" dir={r.ltr ? 'ltr' : 'rtl'} style={{ color: r.muted ? theme.colors.textMuted : theme.colors.textPrimary, textAlign: 'right' }}>{r.value}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <form onSubmit={save} className="space-y-3">
          <Field label="نام و نام خانوادگی" value={form.fullName} onChange={(v) => setForm((p) => ({ ...p, fullName: v }))} theme={theme} />
          <Field label="شماره موبایل" value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} theme={theme} dir="ltr" inputMode="tel" />
          <Field label="ایمیل (اختیاری)" value={form.email} onChange={(v) => setForm((p) => ({ ...p, email: v }))} theme={theme} dir="ltr" inputMode="email" placeholder="example@mail.com" />
          <div className="flex gap-2 pt-1">
            <button type="submit" className="flex-1 py-3.5 rounded-2xl text-white font-black inline-flex items-center justify-center gap-2" style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` }}>
              <Save className="w-4 h-4" /> ذخیره تغییرات
            </button>
            <button type="button" onClick={() => { setEditing(false); setForm({ fullName: user.fullName, email: isSyntheticEmail ? '' : user.email, phone: user.phone }); }} className="px-5 py-3.5 rounded-2xl font-bold" style={{ backgroundColor: theme.colors.bodyBg, color: theme.colors.textSecondary, border: `1px solid ${theme.colors.cardBorder}` }}>
              انصراف
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({ label, value, onChange, theme, dir = 'rtl', inputMode, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; theme: Theme;
  dir?: 'rtl' | 'ltr'; inputMode?: 'text' | 'tel' | 'email'; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold mb-1.5" style={{ color: theme.colors.textSecondary }}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} dir={dir} inputMode={inputMode} placeholder={placeholder}
        className="w-full px-4 py-3 rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 text-right"
        style={{ backgroundColor: theme.colors.bodyBg, border: `2px solid ${theme.colors.cardBorder}`, color: theme.colors.textPrimary }} />
    </div>
  );
}
