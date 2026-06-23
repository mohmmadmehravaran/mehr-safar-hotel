import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Wifi, Car, UtensilsCrossed, Dumbbell, Waves, Coffee, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Hotel } from '../types';
import StarRating from './StarRating';
import ReviewBadge from './ReviewBadge';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

const amenityIcons: Record<string, React.ReactNode> = {
  'استخر': <Waves className="w-3.5 h-3.5" />,
  'سونا': <Waves className="w-3.5 h-3.5" />,
  'جکوزی': <Waves className="w-3.5 h-3.5" />,
  'رستوران': <UtensilsCrossed className="w-3.5 h-3.5" />,
  'کافی‌شاپ': <Coffee className="w-3.5 h-3.5" />,
  'پارکینگ': <Car className="w-3.5 h-3.5" />,
  'اینترنت رایگان': <Wifi className="w-3.5 h-3.5" />,
  'مرکز بدنسازی': <Dumbbell className="w-3.5 h-3.5" />,
};

interface HotelCardProps {
  hotel: Hotel;
  index?: number;
}

export default function HotelCard({ hotel, index = 0 }: HotelCardProps) {
  const { theme } = useTheme();

  // Image carousel ("ورق زدن") — flip through the hotel's photos on the card itself.
  const images = hotel.images && hotel.images.length ? hotel.images : [''];
  const [current, setCurrent] = useState(0);
  const safeCurrent = Math.min(current, images.length - 1);

  const go = (e: React.MouseEvent, dir: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrent((c) => {
      const len = images.length;
      return (Math.min(c, len - 1) + dir + len) % len;
    });
  };

  const select = (e: React.MouseEvent, i: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrent(i);
  };

  // ── Drag scrubbing for mobile AND desktop ──
  // کاربر کلیک/لمس را نگه می‌دارد و با حرکت چپ↔راست، عکس‌ها پشت‌سرهم ورق می‌خورند.
  const drag = useRef<{ x: number; y: number; lastX: number; active: boolean; axis: null | 'h' | 'v' }>(
    { x: 0, y: 0, lastX: 0, active: false, axis: null }
  );
  const swiped = useRef(false);
  const STEP = 55; // هر این مقدار حرکت افقی → یک عکس جلو/عقب

  const step = (dir: number) => {
    swiped.current = true; // علامت بزن تا کلیک بعدی صفحه هتل را باز نکند
    setCurrent((c) => {
      const len = images.length;
      return (Math.min(c, len - 1) + dir + len) % len;
    });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return; // فقط کلیک چپ
    if ((e.target as HTMLElement).closest('button')) return; // فلش/نقطه‌ها خودشان کار کنند
    if (images.length <= 1) return;
    drag.current = { x: e.clientX, y: e.clientY, lastX: e.clientX, active: true, axis: null };
    swiped.current = false;
    // فقط برای ماوس قفل کن (تا روی موبایل اسکرول عمودی آزاد بماند)
    if (e.pointerType === 'mouse') {
      try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* noop */ }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    // تعیین جهت حرکت در اولین جابه‌جایی محسوس
    if (d.axis === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      d.axis = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
      if (d.axis === 'v') { d.active = false; return; } // حرکت عمودی → بگذار صفحه اسکرول شود
    }
    if (d.axis !== 'h') return;
    // فقط دسکتاپ (ماوس): اسکراب پیوسته حین نگه‌داشتن و حرکت.
    // موبایل (لمس): اینجا کاری نمی‌کنیم؛ یک سوایپ ساده در پایان حساب می‌شود.
    if (e.pointerType !== 'mouse') return;
    let move = e.clientX - d.lastX;
    while (Math.abs(move) >= STEP) {
      const fwd = move > 0;
      step(fwd ? -1 : 1); // RTL: حرکت به راست → عکس قبلی، به چپ → عکس بعدی
      d.lastX += fwd ? STEP : -STEP;
      move = e.clientX - d.lastX;
    }
  };

  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    if (e.pointerType === 'mouse') {
      try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* noop */ }
    }
    if (d.active && d.axis !== 'v') {
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (e.pointerType === 'mouse') {
        // دسکتاپ: اگر کشیدن کوتاه بود و هنوز عکسی عوض نشده، یک عکس ورق بزن
        if (!swiped.current && Math.abs(dx) >= 30 && Math.abs(dx) > Math.abs(dy)) step(dx > 0 ? -1 : 1);
      }
        // موبایل: سوایپ افقی برای جابه‌جایی بین کارت‌ها (کاروسل) رزرو شده است؛
        // ورق‌زدن عکس روی موبایل با دکمه‌های فلش و نقطه‌های پایین تصویر انجام می‌شود.
    }
    d.active = false;
    d.axis = null;
  };

  // بعد از کشیدن، مرورگر یک کلیک تولید می‌کند؛ آن را لغو کن تا <Link> ناوبری نکند.
  const handleClickCapture = (e: React.MouseEvent) => {
    if (swiped.current) {
      e.preventDefault();
      e.stopPropagation();
      swiped.current = false;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="group relative overflow-hidden card-lift flex flex-col"
      style={{
        backgroundColor: theme.colors.cardBg,
        borderRadius: theme.sizes.cardBorderRadius + 4,
        border: `1px solid ${theme.colors.cardBorder}`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)',
      }}
      whileHover={{ y: -6 }}
    >
      <Link to={`/hotel/${hotel.id}`} className="flex flex-col flex-1 min-h-0">
        {/* Image carousel */}
        <div
          className="relative overflow-hidden [touch-action:pan-x_pan-y] select-none cursor-grab active:cursor-grabbing w-full shrink-0"
          style={{ height: theme.sizes.cardImageHeight }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onDragStart={(e) => e.preventDefault()}
          onClickCapture={handleClickCapture}
        >
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`تصویر ${i + 1} ${hotel.name} در ${hotel.city}`}
              loading="lazy"
              decoding="async"
              draggable={false}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-110 pointer-events-none ${
                i === safeCurrent ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

          {/* Carousel controls (only with more than one image) */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="تصویر بعدی"
                onClick={(e) => go(e, 1)}
                className="absolute top-1/2 left-2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 backdrop-blur-md shadow-lg flex items-center justify-center text-gray-700 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-white transition-all z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                aria-label="تصویر قبلی"
                onClick={(e) => go(e, -1)}
                className="absolute top-1/2 right-2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 backdrop-blur-md shadow-lg flex items-center justify-center text-gray-700 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-white transition-all z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`رفتن به تصویر ${i + 1}`}
                    onClick={(e) => select(e, i)}
                    className={`rounded-full transition-all ${
                      i === safeCurrent ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/60 hover:bg-white/90'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Type badge */}
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-full text-xs font-semibold text-gray-800 shadow-lg">
              {hotel.type}
            </span>
          </div>

          {/* Featured badge */}
          {hotel.isFeatured && (
            <div className="absolute top-3 left-3">
              <span
                className="px-3 py-1.5 text-white rounded-full text-xs font-bold shadow-lg flex items-center gap-1"
                style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` }}
              >
                ⭐ ویژه
              </span>
            </div>
          )}

          {/* Price on image — کادر قیمت روی موبایل کوچک‌تر */}
          <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3">
            <div className="bg-white/95 backdrop-blur-md rounded-lg sm:rounded-xl px-2 py-1 sm:px-3 sm:py-2 shadow-lg">
              <div className="flex items-baseline gap-1">
                <span className="text-sm sm:text-lg font-bold" style={{ color: theme.colors.priceBadgeColor }}>
                  {hotel.pricePerNight.toLocaleString('fa-IR')}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-500">تومان</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content — ارتفاع کادر سفید در همهٔ کارت‌ها یکسان */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3
                className="font-bold text-sm sm:text-base leading-tight mb-2 truncate"
                style={{ color: theme.colors.textPrimary }}
              >
                {hotel.name}
              </h3>
              <StarRating stars={hotel.stars} />
            </div>
            <ReviewBadge review={hotel.review} score={hotel.reviewScore} />
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 mb-4" style={{ color: theme.colors.textSecondary }}>
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs truncate">{hotel.city}، {hotel.address}</span>
          </div>

          {/* Amenities — تک‌خطی تا ارتفاع محتوا ثابت بماند */}
          <div className="flex flex-nowrap gap-1.5 mb-4 overflow-hidden">
            {hotel.amenities.slice(0, 3).map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg text-xs text-gray-600 shrink-0 whitespace-nowrap"
              >
                {amenityIcons[amenity] || null}
                {amenity}
              </span>
            ))}
            {hotel.amenities.length > 3 && (
              <span className="px-2 py-1 bg-gray-50 rounded-lg text-xs text-gray-500 shrink-0 whitespace-nowrap">
                +{hotel.amenities.length - 3}
              </span>
            )}
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-100">
            <span className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>
              مشاهده و رزرو
            </span>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                boxShadow: `0 4px 12px ${theme.colors.primary}40`,
              }}
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
