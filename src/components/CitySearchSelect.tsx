import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Search, X, Building2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { BIG_CITIES, searchCities } from '../data/iranCities';

interface Props {
  value: string;
  onChange: (v: string) => void;
  /** Called when a concrete city is chosen (click / Enter on a suggestion). */
  onSelect: (city: string) => void;
  placeholder?: string;
}

/**
 * Searchable city picker for the hotel search box.
 * - Clicking the field (while empty) shows the four big cities as quick picks.
 * - Typing filters the full list of Iranian cities.
 * - Choosing a city (click or Enter) fires onSelect.
 *
 * The suggestion list is rendered through a portal to <body> with a high
 * z-index so it always floats above the page. Rendering it inline trapped it
 * inside the hero section's isolated stacking context (isolation: isolate;
 * z-index: 40), which made the list appear *behind* the sections below it.
 */
export default function CitySearchSelect({ value, onChange, onSelect, placeholder }: Props) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Build the suggestion list: typed → search results, empty → big cities.
  const typed = value.trim().length > 0;
  const results = typed ? searchCities(value, 60) : BIG_CITIES;

  // Position of the floating list (page coordinates).
  const [pos, setPos] = useState({ top: 0, left: 0, w: 320 });
  const updatePos = () => {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    setPos({
      top: r.bottom + window.scrollY + 8, // 8px gap (was mt-2)
      left: r.left + window.scrollX,
      w: r.width,
    });
  };
  useLayoutEffect(() => { if (open) updatePos(); }, [open, value]);
  useEffect(() => {
    if (!open) return;
    const fn = () => updatePos();
    window.addEventListener('resize', fn);
    window.addEventListener('scroll', fn, true);
    return () => {
      window.removeEventListener('resize', fn);
      window.removeEventListener('scroll', fn, true);
    };
  }, [open]);

  // Close on outside click — account for the portal'd list living outside wrapRef.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (popupRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => { setActive(0); }, [value, open]);

  const choose = (city: string) => {
    onChange(city);
    onSelect(city);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) { setOpen(true); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[active]) choose(results[active]);
      else if (value.trim()) { onSelect(value.trim()); setOpen(false); }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const listbox = (
    <div
      ref={popupRef}
      id="city-listbox"
      role="listbox"
      className="bg-white rounded-2xl shadow-2xl border max-h-72 overflow-y-auto py-1.5"
      style={{
        position: 'absolute',
        top: pos.top,
        left: pos.left,
        width: pos.w,
        zIndex: 9999,
        borderColor: theme.colors.cardBorder,
        fontFamily: "'Vazirmatn', sans-serif",
      }}
      dir="rtl"
    >
      {!typed && (
        <div className="flex items-center gap-1.5 px-4 pt-1 pb-2 text-xs font-bold" style={{ color: theme.colors.textMuted }}>
          <Building2 className="w-3.5 h-3.5" />
          شهرهای بزرگ
        </div>
      )}

      {results.length === 0 && (
        <div className="px-4 py-6 text-center text-sm flex flex-col items-center gap-2" style={{ color: theme.colors.textMuted }}>
          <Search className="w-5 h-5" />
          شهری با این نام پیدا نشد
        </div>
      )}

      {results.map((city, i) => {
        const isActive = i === active;
        const isBig = !typed && BIG_CITIES.includes(city);
        return (
          <button
            type="button"
            key={city}
            role="option"
            aria-selected={isActive}
            onMouseEnter={() => setActive(i)}
            onClick={() => choose(city)}
            className="w-full text-right px-4 py-2.5 text-sm flex items-center gap-2.5 transition-colors"
            style={{
              backgroundColor: isActive ? theme.colors.primaryLight : 'transparent',
              color: isActive ? theme.colors.primary : theme.colors.textPrimary,
              fontWeight: isBig ? 700 : 500,
            }}
          >
            <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: isActive ? theme.colors.primary : theme.colors.textMuted }} />
            <span>{city}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div ref={wrapRef} className="relative w-full">
      <label htmlFor="city-search" className="sr-only">{placeholder}</label>
      <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10" style={{ color: theme.colors.textMuted }} aria-hidden="true" />
      <input
        id="city-search"
        name="city"
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls="city-listbox"
        aria-autocomplete="list"
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="w-full pr-12 pl-9 h-[60px] bg-white border rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        style={{ borderColor: theme.colors.cardBorder, color: theme.colors.textPrimary }}
      />
      {value && (
        <button
          type="button"
          onClick={() => { onChange(''); setOpen(true); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 z-10"
          aria-label="پاک کردن"
        >
          <X className="w-4 h-4" style={{ color: theme.colors.textMuted }} />
        </button>
      )}

      {open && typeof document !== 'undefined' && createPortal(listbox, document.body)}
    </div>
  );
}
