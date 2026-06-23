import { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronRight, ChevronLeft } from 'lucide-react';
import {
  JalaliDate,
  getTodayJalali,
  gregorianToJalali,
  jalaliToGregorian,
  getJalaliMonthDays,
  getJalaliMonthStartWeekday,
  gregorianToISO,
  toPersianNumber,
} from '../utils/date';

/* ── helpers ── */
function jsWeekdayToPersian(d: number) { return (d + 1) % 7; }
function normTs(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }

const monthNames = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const weekdayLabels = ['ش','ی','د','س','چ','پ','ج'];

interface ViewMonth { year: number; month: number; }

interface Props {
  checkIn: string;   // ISO
  checkOut: string;  // ISO
  onCheckInChange: (iso: string) => void;
  onCheckOutChange: (iso: string) => void;
  minDate?: string;  // ISO
  className?: string;
}

export default function DateRangeField({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  minDate,
  className = '',
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState<'checkIn' | 'checkOut'>('checkIn');
  const [hoverTs, setHoverTs] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const checkInJ = useMemo(() => (checkIn ? gregorianToJalali(checkIn) : null), [checkIn]);
  const checkOutJ = useMemo(() => (checkOut ? gregorianToJalali(checkOut) : null), [checkOut]);
  const checkInTs = useMemo(() => (checkIn ? normTs(new Date(checkIn)) : null), [checkIn]);
  const checkOutTs = useMemo(() => (checkOut ? normTs(new Date(checkOut)) : null), [checkOut]);
  const minTs = useMemo(() => (minDate ? normTs(new Date(minDate)) : null), [minDate]);

  const nights = useMemo(() => {
    if (checkInTs !== null && checkOutTs !== null && checkOutTs > checkInTs) {
      return Math.round((checkOutTs - checkInTs) / 86400000);
    }
    return 0;
  }, [checkInTs, checkOutTs]);

  const [view, setView] = useState<ViewMonth>(() => {
    const j = checkInJ || getTodayJalali();
    return { year: j.year, month: j.month };
  });

  const wrapRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const open = (which: 'checkIn' | 'checkOut') => {
    if (which === 'checkOut' && checkInJ) setPhase('checkOut');
    else setPhase('checkIn');
    const focus = checkInJ || getTodayJalali();
    setView({ year: focus.year, month: focus.month });
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (popupRef.current && !popupRef.current.contains(t) &&
          wrapRef.current && !wrapRef.current.contains(t)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [isOpen]);

  const [pos, setPos] = useState({ top: 0, left: 0, w: 680 });
  const updatePos = () => {
    if (!wrapRef.current || isMobile) return;
    const r = wrapRef.current.getBoundingClientRect();
    const w = Math.min(680, window.innerWidth - 32);
    let left = r.right - w;
    if (left < 16) left = 16;
    if (left + w > window.innerWidth - 16) left = window.innerWidth - w - 16;
    setPos({ top: r.bottom + window.scrollY + 8, left: left + window.scrollX, w });
  };
  useLayoutEffect(() => { if (isOpen && !isMobile) updatePos(); }, [isOpen, isMobile]);
  useEffect(() => {
    if (!isOpen || isMobile) return;
    const fn = () => updatePos();
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, [isOpen, isMobile]);

  const nextMonth = (v: ViewMonth): ViewMonth => (v.month === 12 ? { year: v.year + 1, month: 1 } : { year: v.year, month: v.month + 1 });
  const prevMonth = (v: ViewMonth): ViewMonth => (v.month === 1 ? { year: v.year - 1, month: 12 } : { year: v.year, month: v.month - 1 });
  const goForward = () => setView((v) => nextMonth(v));
  const goBack = () => setView((v) => prevMonth(v));
  const view2 = nextMonth(view);

  const handleDayClick = (greg: Date) => {
    const ts = normTs(greg);
    const iso = gregorianToISO(greg);
    if (phase === 'checkIn') {
      onCheckInChange(iso);
      onCheckOutChange('');
      setPhase('checkOut');
    } else {
      if (checkInTs !== null && ts <= checkInTs) {
        onCheckInChange(iso);
        onCheckOutChange('');
        setPhase('checkOut');
      } else {
        onCheckOutChange(iso);
      }
    }
  };

  const fmt = (j: JalaliDate | null) => (j ? `${toPersianNumber(j.day)} ${monthNames[j.month - 1]} ${toPersianNumber(j.year)}` : '');
  const fmtShort = (j: JalaliDate | null) => (j ? `${toPersianNumber(j.day)} ${monthNames[j.month - 1]}` : '');

  const renderMonth = (v: ViewMonth) => {
    const monthDays = getJalaliMonthDays(v.year, v.month);
    const startWd = jsWeekdayToPersian(getJalaliMonthStartWeekday(v.year, v.month));
    const todayTs = normTs(new Date());

    return (
      <div className="grid grid-cols-7 gap-y-1 pt-3">
        {Array.from({ length: startWd }).map((_, i) => <div key={`e${i}`} className="h-10" />)}
        {Array.from({ length: monthDays }).map((_, i) => {
          const day = i + 1;
          const greg = jalaliToGregorian({ year: v.year, month: v.month, day });
          const ts = normTs(greg);
          const colIndex = (startWd + i) % 7;
          const isFriday = colIndex === 6;
          const isToday = ts === todayTs;
          const disabled = minTs !== null ? ts < minTs : false;
          const isStart = checkInTs !== null && ts === checkInTs;
          const isEnd = checkOutTs !== null && ts === checkOutTs;

          let inRange = false;
          if (checkInTs !== null) {
            if (checkOutTs !== null) {
              inRange = ts > checkInTs && ts < checkOutTs;
            } else if (phase === 'checkOut' && hoverTs !== null && hoverTs > checkInTs) {
              inRange = ts > checkInTs && ts < hoverTs;
            }
          }
          const isHoverEnd = !checkOutTs && phase === 'checkOut' && hoverTs !== null
            && ts === hoverTs && checkInTs !== null && hoverTs > checkInTs;

          let cls = 'relative h-10 w-full text-[13px] font-medium transition-colors flex items-center justify-center ';
          if (isStart && isEnd) {
            cls += 'bg-blue-600 text-white rounded-lg z-10';
          } else if (isStart) {
            cls += 'bg-blue-600 text-white rounded-r-lg z-10';
          } else if (isEnd || isHoverEnd) {
            cls += 'bg-blue-600 text-white rounded-l-lg z-10';
          } else if (inRange) {
            cls += 'bg-blue-50 text-blue-700';
          } else if (disabled) {
            cls += 'text-gray-300 cursor-not-allowed rounded-lg';
          } else if (isToday) {
            cls += 'text-blue-700 font-bold rounded-lg ring-1 ring-blue-300';
          } else if (isFriday) {
            cls += 'text-red-500 hover:bg-gray-100 rounded-lg';
          } else {
            cls += 'text-gray-700 hover:bg-gray-100 rounded-lg';
          }

          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => handleDayClick(greg)}
              onMouseEnter={() => setHoverTs(ts)}
              onMouseLeave={() => setHoverTs(null)}
              className={cls}
            >
              {isStart && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shadow-sm">ورود</span>
              )}
              {isEnd && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shadow-sm">خروج</span>
              )}
              {toPersianNumber(day)}
            </button>
          );
        })}
      </div>
    );
  };

  const monthLabel = (v: ViewMonth) => `${monthNames[v.month - 1]} ${toPersianNumber(v.year)}`;

  const calendarPopup = (
    <>
      {isMobile && <div className="fixed inset-0 bg-black/40 z-[9998]" onClick={() => setIsOpen(false)} />}
      <div
        ref={popupRef}
        className="bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
        dir="rtl"
        style={{
          position: isMobile ? 'fixed' : 'absolute',
          top: isMobile ? '50%' : pos.top,
          left: isMobile ? '50%' : pos.left,
          transform: isMobile ? 'translate(-50%, -50%)' : undefined,
          width: isMobile ? 'calc(100vw - 24px)' : pos.w,
          maxWidth: isMobile ? '420px' : '720px',
          zIndex: 9999,
          fontFamily: "'Vazirmatn', sans-serif",
        }}
      >
        {/* Top: go-to-today (left side in RTL) */}
        <div className="flex justify-end px-5 pt-4">
          <button
            type="button"
            onClick={() => { const t = getTodayJalali(); setView({ year: t.year, month: t.month }); }}
            className="px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 text-[13px] font-bold hover:bg-blue-50 transition-colors"
          >
            برو به امروز
          </button>
        </div>

        {/* Calendars */}
        <div className={`px-5 pb-2 ${isMobile ? '' : 'flex gap-0'}`}>
          {/* RIGHT column = earlier month (view) */}
          <div className={`flex-1 min-w-0 ${isMobile ? '' : 'pl-5'}`}>
            <div className="relative flex items-center justify-center h-8 mb-1">
              <button type="button" onClick={goBack} className="absolute right-0 flex items-center gap-0.5 text-[13px] text-blue-600 font-bold hover:text-blue-700">
                ماه قبل <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-[15px] font-bold text-gray-800">{monthLabel(view)}</span>
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {weekdayLabels.map((n, i) => <div key={i} className="text-center text-[11px] font-medium text-gray-400 py-1">{n}</div>)}
            </div>
            {renderMonth(view)}
          </div>

          {!isMobile && <div className="w-px bg-gray-200 self-stretch my-2" />}

          {/* LEFT column = later month (view2) */}
          {!isMobile && (
            <div className="flex-1 min-w-0 pr-5">
              <div className="relative flex items-center justify-center h-8 mb-1">
                <span className="text-[15px] font-bold text-gray-800">{monthLabel(view2)}</span>
                <button type="button" onClick={goForward} className="absolute left-0 flex items-center gap-0.5 text-[13px] text-blue-600 font-bold hover:text-blue-700">
                  <ChevronLeft className="w-4 h-4" /> ماه بعد
                </button>
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {weekdayLabels.map((n, i) => <div key={i} className="text-center text-[11px] font-medium text-gray-400 py-1">{n}</div>)}
              </div>
              {renderMonth(view2)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-3">
          {(checkIn || checkOut) ? (
            <button
              type="button"
              onClick={() => { onCheckInChange(''); onCheckOutChange(''); setPhase('checkIn'); }}
              className="px-4 py-2 rounded-lg border border-blue-200 text-blue-600 text-[13px] font-bold hover:bg-blue-50 transition-colors whitespace-nowrap"
            >
              پاک کردن
            </button>
          ) : <span />}

          <span className="text-[13px] text-gray-600 text-center flex-1 truncate">
            {checkInJ && <>تاریخ ورود {fmtShort(checkInJ)}</>}
            {checkInJ && checkOutJ && <span className="mx-1">،</span>}
            {checkOutJ && <>تاریخ خروج {fmtShort(checkOutJ)}</>}
          </span>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-5 py-2.5 rounded-lg text-[13px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            {nights > 0 ? `تایید تاریخ (${toPersianNumber(nights)} شب)` : 'تایید تاریخ'}
          </button>
        </div>
      </div>
    </>
  );

  const fieldBox = (which: 'checkIn' | 'checkOut', value: JalaliDate | null, placeholder: string) => (
    <div className="flex-1">
      <button
        type="button"
        onClick={() => open(which)}
        className="relative w-full flex items-center gap-2 pr-11 pl-4 h-[60px] bg-white border border-gray-200 rounded-xl text-[15px] text-right focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors"
      >
        <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <span className={value ? 'text-gray-900 font-medium' : 'text-gray-500'}>{value ? fmt(value) : placeholder}</span>
      </button>
    </div>
  );

  return (
    <div ref={wrapRef} className={className}>
      <div className="flex flex-col md:flex-row gap-3 items-start">
        {fieldBox('checkIn', checkInJ, 'تاریخ ورود')}
        {fieldBox('checkOut', checkOutJ, 'تاریخ خروج')}
      </div>
      {isOpen && typeof document !== 'undefined' && createPortal(calendarPopup, document.body)}
    </div>
  );
}
