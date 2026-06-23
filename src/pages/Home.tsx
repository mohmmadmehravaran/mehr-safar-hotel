import { useState, useEffect, useRef } from 'react';
import { Search, Award, TrendingUp, Heart, Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import HotelCard from '../components/HotelCard';
import CardSections from '../components/CardSections';
import CitySearchSelect from '../components/CitySearchSelect';
import FilterPanel from '../components/FilterPanel';
import PersianRangeDatePicker from '../components/PersianRangeDatePicker';
import PersianDatePicker from '../components/PersianDatePicker';
import DateRangeField from '../components/DateRangeField';
import heroBg from '../assets/hero-bg.jpeg';
import { motion } from 'framer-motion';
import { getTodayJalali, gregorianToISO, jalaliToGregorian } from '../utils/date';
import { useDocumentTitle } from '../utils/useDocumentTitle';

export default function Home() {
  const { filteredHotels, filters, setFilters } = useApp();
  const { theme } = useTheme();
  useDocumentTitle();
  const [searchInput, setSearchInput] = useState(filters.search);

  const today = getTodayJalali();
  const todayISO = gregorianToISO(jalaliToGregorian(today));

  // Filter hotels by the chosen city (no scroll here — we only scroll once city + both dates are set).
  const applyCity = (city: string) => {
    const term = city.trim();
    setFilters((prev) => ({ ...prev, city: term, search: '' }));
    setSearchInput(term);
  };
  const handleSearch = () => applyCity(searchInput);
  const clearCity = () => { setFilters((prev) => ({ ...prev, city: '', search: '' })); setSearchInput(''); };
  // When the city text is cleared (manually or via the ✕ button), reset the city
  // filter so the home page shows all default hotel cards again.
  const handleCityInputChange = (v: string) => {
    setSearchInput(v);
    if (v.trim() === '') {
      setFilters((prev) => ({ ...prev, city: '', search: '' }));
    }
  };
  const handleCheckInChange = (date: string) => setFilters((prev) => ({ ...prev, checkIn: date, checkOut: prev.checkOut && prev.checkOut <= date ? '' : prev.checkOut }));
  const handleCheckOutChange = (date: string) => setFilters((prev) => ({ ...prev, checkOut: date }));

  // Scroll to the hotel cards only after the user has chosen a city AND both check-in and check-out dates.
  const didScrollRef = useRef(false);
  useEffect(() => {
    const ready = Boolean(filters.city && filters.checkIn && filters.checkOut);
    if (ready && !didScrollRef.current) {
      didScrollRef.current = true;
      setTimeout(() => document.getElementById('hotels')?.scrollIntoView({ behavior: 'smooth' }), 80);
    } else if (!ready) {
      // Reset so the scroll fires again next time the selection is completed.
      didScrollRef.current = false;
    }
  }, [filters.city, filters.checkIn, filters.checkOut]);

  const featuredHotels = filteredHotels.filter((h) => h.isFeatured);
  const regularHotels = filteredHotels.filter((h) => !h.isFeatured);

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ backgroundColor: theme.colors.bodyBg }}>

      {/* ── HERO ── */}
      <section className="relative" style={{ backgroundColor: theme.colors.bodyBg, isolation: 'isolate', zIndex: 40 }}>
        <div className="relative mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: 1424, paddingTop: theme.sizes.heroTopPadding + 20, paddingBottom: theme.sizes.heroBottomPadding }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }} className="w-full max-w-[1360px] mx-auto">

            {/* Hero banner image */}
            <div className="relative">
              <img
                src={heroBg}
                alt=""
                style={{ height: 300 }}
                className="w-full object-cover rounded-3xl select-none pointer-events-none"
              />

              {/* Search box - clean white card overlapping the banner */}
              <div
                className="relative z-10 bg-white rounded-2xl shadow-soft-xl mx-auto px-5 md:px-7 pt-3.5 pb-5 md:pb-6 w-[96%] -mt-10 md:-mt-12"
                style={{ border: `1px solid ${theme.colors.cardBorder}` }}
              >
                {/* Section tab */}
                <div className="flex justify-start mb-4 border-b border-gray-100">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 pb-3 -mb-px font-bold text-[15px] border-b-2"
                    style={{ color: theme.colors.primary, borderColor: theme.colors.primary }}
                  >
                    <Building2 className="w-[18px] h-[18px]" />
                    هتل یا اقامتگاه
                  </button>
                </div>

                <div className="flex flex-col md:flex-row gap-3 items-start">
                  {/* City / destination */}
                  <div className="w-full md:flex-[1.7]">
                    <CitySearchSelect
                      value={searchInput}
                      onChange={handleCityInputChange}
                      onSelect={applyCity}
                      placeholder="مقصد یا هتل"
                    />
                  </div>

                  {/* Check-in / Check-out date range */}
                  <DateRangeField
                    checkIn={filters.checkIn}
                    checkOut={filters.checkOut}
                    onCheckInChange={handleCheckInChange}
                    onCheckOutChange={handleCheckOutChange}
                    minDate={todayISO}
                    className="w-full md:flex-[2]"
                  />

                  {/* Search button */}
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="flex items-center justify-center gap-2 px-12 h-[60px] text-white font-bold text-base rounded-xl w-full md:w-auto flex-shrink-0"
                    style={{
                      backgroundColor: theme.colors.primary,
                      boxShadow: `0 4px 16px ${theme.colors.primary}40`,
                    }}
                  >
                    <span>جستجو</span>
                  </button>
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      </section>

      {/* ── CUSTOM CARD SECTIONS (built in admin → کارت‌ها) ── */}
      <CardSections />

      {/* ── HOTELS ── */}
      <section id="hotels" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" style={{ scrollMarginTop: theme.sizes.headerHeight + 24 }}>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters appear only after the user has entered a city AND both check-in and check-out dates */}
          {filters.city && filters.checkIn && filters.checkOut && (
            <aside className="lg:w-80 flex-shrink-0">
              <FilterPanel />
            </aside>
          )}

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black mb-1" style={{ color: theme.colors.textPrimary }}>
                  {filters.city ? `هتل‌های ${filters.city}` : 'هتل‌ها و اقامتگاه‌ها'}
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-sm" style={{ color: theme.colors.textSecondary }}>{filteredHotels.length} مورد یافت شد</p>
                  {filters.city && (
                    <button
                      onClick={clearCity}
                      className="text-xs font-bold px-2.5 py-1 rounded-full hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: theme.colors.primaryLight, color: theme.colors.primary }}
                    >
                      نمایش همه شهرها ✕
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: theme.colors.primaryLight }}>
                <TrendingUp className="w-4 h-4" style={{ color: theme.colors.primary }} />
                <span className="text-sm font-bold" style={{ color: theme.colors.primary }}>محبوب‌ترین</span>
              </div>
            </div>

            {filteredHotels.length === 0 ? (
              <div className="text-center py-20 rounded-3xl" style={{ backgroundColor: theme.colors.cardBg, border: `1px solid ${theme.colors.cardBorder}` }}>
                <Search className="w-14 h-14 mx-auto mb-4" style={{ color: theme.colors.textMuted }} />
                <h3 className="text-lg font-bold mb-2" style={{ color: theme.colors.textPrimary }}>هتلی یافت نشد</h3>
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>برای این شهر هتلی ثبت نشده است؛ شهر دیگری را جستجو کنید</p>
              </div>
            ) : (
              <>
                {featuredHotels.length > 0 && (
                  <div className="mb-10">
                    <div className="flex items-center gap-2 mb-5">
                      <Award className="w-5 h-5" style={{ color: theme.colors.primary }} />
                      <h3 className="font-black" style={{ color: theme.colors.textPrimary }}>هتل‌های ویژه</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 card-carousel">
                      {featuredHotels.map((h, i) => <HotelCard key={h.id} hotel={h} index={i} />)}
                    </div>
                  </div>
                )}
                {regularHotels.length > 0 && (
                  <div>
                    {featuredHotels.length > 0 && (
                      <div className="flex items-center gap-2 mb-5">
                        <Heart className="w-5 h-5" style={{ color: theme.colors.textSecondary }} />
                        <h3 className="font-bold" style={{ color: theme.colors.textSecondary }}>سایر هتل‌ها</h3>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 card-carousel">
                      {regularHotels.map((h, i) => <HotelCard key={h.id} hotel={h} index={i} />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
