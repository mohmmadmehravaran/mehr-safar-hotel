import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Hotel, LogIn, LogOut, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useSiteEdits } from '../context/SiteEditsContext';

const isExternal = (to: string) => /^https?:\/\//i.test(to) || to.startsWith('mailto:') || to.startsWith('tel:');

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<'home' | 'hotels'>('home');
  const { isAdmin, logoutAdmin, adminName, currentUser, logoutUser } = useApp();
  const { theme } = useTheme();
  const { headerLinks } = useSiteEdits();
  const location = useLocation();
  const navigate = useNavigate();

  const onHome = location.pathname === '/';

  const goToHome = () => {
    setActiveSection('home');
    const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(scrollTop, 300);
    } else {
      scrollTop();
    }
  };

  const goToHotels = () => {
    setActiveSection('hotels');
    const scroll = () => document.getElementById('hotels')?.scrollIntoView({ behavior: 'smooth' });
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(scroll, 300);
    } else {
      scroll();
    }
  };

  // Scroll spy: keep the active nav button (home / hotels) in sync with the
  // section the user is currently looking at while on the home page.
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      if (location.pathname !== '/') return;
      const hotelsEl = document.getElementById('hotels');
      if (!hotelsEl) {
        setActiveSection('home');
        return;
      }
      const threshold = (typeof theme.sizes.headerHeight === 'number' ? theme.sizes.headerHeight : 64) + 40;
      setActiveSection(hotelsEl.getBoundingClientRect().top <= threshold ? 'hotels' : 'home');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname, theme.sizes.headerHeight]);

  return (
    <header
      className="sticky top-0 z-50 transition-all duration-500"
      style={{
        minHeight: theme.sizes.headerHeight,
        backgroundColor: scrolled ? `${theme.colors.headerBg}CC` : `${theme.colors.headerBg}80`,
        backdropFilter: 'blur(24px) saturate(200%)',
        WebkitBackdropFilter: 'blur(24px) saturate(200%)',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
        boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.04)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full min-h-[64px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div
              className="p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                boxShadow: `0 8px 20px ${theme.colors.primary}40`,
              }}
            >
              <Hotel className="w-5 h-5 text-white" />
            </div>
            <span
              className="text-lg font-bold tracking-tight transition-colors"
              style={{ color: theme.colors.headerText, fontFamily: `'${theme.fonts.heading}'`, fontWeight: theme.fonts.headingWeight }}
            >
              {theme.texts.siteName}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavButton onClick={goToHome} active={onHome && activeSection === 'home'}>
              خانه
            </NavButton>
            <NavButton onClick={goToHotels} active={onHome && activeSection === 'hotels'}>
              هتل‌ها
            </NavButton>
            <NavLink to="/track" active={location.pathname === '/track'} scrolled={scrolled}>
              پیگیری رزرو
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" active={location.pathname === '/admin'} scrolled={scrolled}>
                پنل مدیریت
              </NavLink>
            )}

            {/* Custom header buttons (managed from the visual editor) */}
            {/* لینک‌هایی که به مسیرهای ثابتِ هدر (مثل پیگیری رزرو) اشاره می‌کنند فیلتر می‌شوند تا دکمه تکراری نشود */}
            {headerLinks.filter((link) => link.to !== '/track').map((link) =>
              isExternal(link.to) ? (
                <a
                  key={link.id}
                  href={link.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 text-gray-700 hover:bg-gray-100"
                >
                  {link.label}
                </a>
              ) : (
                <NavLink
                  key={link.id}
                  to={link.to}
                  active={location.pathname === link.to}
                  scrolled={scrolled}
                >
                  {link.label}
                </NavLink>
              )
            )}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-2">
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` }}>
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-medium" style={{ color: theme.colors.headerText }}>{adminName}</span>
                </div>
                <button
                  onClick={logoutAdmin}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-full transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  خروج
                </button>
              </div>
            ) : currentUser ? (
              <div className="flex items-center gap-2">
                <Link to="/account" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` }}>
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-medium" style={{ color: theme.colors.headerText }}>{currentUser.fullName}</span>
                </Link>
                <button
                  onClick={logoutUser}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-full transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  خروج
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-full transition-all duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                  boxShadow: `0 4px 16px ${theme.colors.primary}40`,
                }}
              >
                <LogIn className="w-4 h-4" />
                ورود / عضویت
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}

function NavButton({ onClick, active, children }: { onClick: () => void; active: boolean; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer ${
        active ? '' : 'text-gray-700 hover:bg-gray-100'
      }`}
      style={active ? {
        backgroundColor: theme.colors.navActiveBg || '#dbeafe',
        color: theme.colors.navActiveText || '#2563eb',
      } : undefined}
    >
      {children}
    </button>
  );
}

function NavLink({ to, active, scrolled, children, hash }: { to: string; active: boolean; scrolled: boolean; children: React.ReactNode; hash?: string }) {
  const { theme } = useTheme();
  return (
    <Link
      to={hash ? `${to}${hash}` : to}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
        active ? '' : 'text-gray-700 hover:bg-gray-100'
      }`}
      style={active ? {
        backgroundColor: theme.colors.navActiveBg || '#dbeafe',
        color: theme.colors.navActiveText || '#2563eb',
      } : undefined}
    >
      {children}
    </Link>
  );
}
