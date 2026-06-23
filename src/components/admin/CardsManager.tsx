import {
  Plus, Trash2, ArrowUp, ArrowDown, Rows3, Columns3, Hotel, MapPin,
  Image as ImageIcon, ExternalLink, Upload, ChevronDown, GripVertical, Check, Layers, Sparkles,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCards } from '../../context/CardsContext';
import { useApp } from '../../context/AppContext';
import { BIG_CITIES } from '../../data/iranCities';
import { SiteCard, SiteCardType } from '../../types';
import { fileToCompressedDataURL } from '../../utils/image';
import { useAllPages } from './PickerModals';

const TYPE_OPTIONS: { value: SiteCardType; label: string; icon: React.ReactNode }[] = [
  { value: 'hotel', label: 'هتل', icon: <Hotel className="w-4 h-4" /> },
  { value: 'city', label: 'شهر', icon: <MapPin className="w-4 h-4" /> },
  { value: 'banner', label: 'بنر', icon: <ImageIcon className="w-4 h-4" /> },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/* ───────────────────────── shared little UI atoms ───────────────────────── */

function IconBtn({
  onClick, disabled, title, tone = 'gray', children,
}: {
  onClick: () => void; disabled?: boolean; title: string;
  tone?: 'gray' | 'red'; children: React.ReactNode;
}) {
  const tones =
    tone === 'red'
      ? 'bg-red-50 hover:bg-red-100 text-red-600'
      : 'bg-gray-100 hover:bg-gray-200 text-gray-600';
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      whileTap={{ scale: 0.88 }}
      whileHover={disabled ? undefined : { scale: 1.06 }}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${tones}`}
    >
      {children}
    </motion.button>
  );
}

function Field({
  value, onChange, placeholder, icon,
}: {
  value: string; onChange: (v: string) => void; placeholder: string; icon?: React.ReactNode;
}) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</span>
      )}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full ${icon ? 'pr-9' : 'pr-3'} pl-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-100 placeholder:text-gray-400`}
      />
    </div>
  );
}

/* ─────────────────────────────── main panel ─────────────────────────────── */

export default function CardsManager({ page }: { page?: string } = {}) {
  const { groups, addGroup, updateGroup, removeGroup, moveGroup, addCard, updateCard, removeCard, moveCard } = useCards();
  const { hotels } = useApp();

  const scope = page ?? '/';
  const visibleGroups = groups.filter((g) => (g.page ?? '/') === scope);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Hero / add section */}
      <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-bl from-teal-500 via-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-600/20">
        <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-black text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> ساخت و مدیریت کارت‌ها
            </h3>
            <p className="text-[11px] text-teal-50/90 mt-1 leading-relaxed">
              بخش بسازید، چیدمان را انتخاب کنید و هر کارت را به صفحات سایت لینک دهید. همه‌چیز زنده اعمال می‌شود.
            </p>
          </div>
          <motion.button
            type="button"
            onClick={() => addGroup(scope)}
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.04 }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-teal-700 rounded-xl text-sm font-bold shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" /> بخش جدید
          </motion.button>
        </div>
      </div>

      {/* Empty state */}
      {visibleGroups.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/60"
        >
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-500">
            <Layers className="w-7 h-7" />
          </div>
          <p className="text-sm font-bold text-gray-700">هنوز بخشی نساخته‌اید</p>
          <p className="text-xs text-gray-400 mt-1">روی «بخش جدید» بزنید تا اولین بخش کارت‌ها ساخته شود.</p>
        </motion.div>
      )}

      {/* Groups */}
      <AnimatePresence initial={false}>
        {visibleGroups.map((group, gi) => (
          <motion.div
            key={group.id}
            layout
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.18 } }}
            transition={{ duration: 0.35, ease: EASE }}
            className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
          >
            {/* Group header */}
            <div className="flex items-center gap-2 px-3 py-3 bg-gray-50/80 border-b border-gray-100">
              <input
                value={group.title}
                onChange={(e) => updateGroup(group.id, { title: e.target.value })}
                placeholder="عنوان بخش (اختیاری)"
                className="flex-1 min-w-0 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold outline-none transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
              <div className="flex items-center gap-0.5 shrink-0">
                <IconBtn onClick={() => moveGroup(group.id, -1)} disabled={gi === 0} title="بالا">
                  <ArrowUp className="w-4 h-4" />
                </IconBtn>
                <IconBtn onClick={() => moveGroup(group.id, 1)} disabled={gi === visibleGroups.length - 1} title="پایین">
                  <ArrowDown className="w-4 h-4" />
                </IconBtn>
                <IconBtn onClick={() => removeGroup(group.id)} tone="red" title="حذف بخش">
                  <Trash2 className="w-4 h-4" />
                </IconBtn>
              </div>
            </div>

            <div className="p-3 space-y-3">
              {/* Layout segmented control */}
              <div className="grid grid-cols-2 gap-1 bg-gray-100 rounded-xl p-1">
                {([
                  { v: 'horizontal', icon: <Columns3 className="w-4 h-4" />, label: 'رو به روی هم' },
                  { v: 'vertical', icon: <Rows3 className="w-4 h-4" />, label: 'زیر هم' },
                ] as const).map((opt) => {
                  const active = group.layout === opt.v;
                  return (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => updateGroup(group.id, { layout: opt.v })}
                      className="relative flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors"
                    >
                      {active && (
                        <motion.span
                          layoutId={`layout-pill-${group.id}`}
                          className="absolute inset-0 bg-white rounded-lg shadow"
                          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                        />
                      )}
                      <span className={`relative z-10 flex items-center gap-1.5 ${active ? 'text-teal-700' : 'text-gray-500'}`}>
                        {opt.icon} {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Size sliders */}
              <div className="space-y-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                <SliderRow
                  icon={<Rows3 className="w-4 h-4 text-teal-600" />}
                  label="ارتفاع کارت"
                  min={120} max={420} step={4}
                  value={group.cardHeight ?? 208}
                  onChange={(v) => updateGroup(group.id, { cardHeight: v })}
                />
                {group.layout === 'horizontal' && (
                  <SliderRow
                    icon={<Columns3 className="w-4 h-4 text-teal-600" />}
                    label="عرض کارت"
                    min={160} max={520} step={10}
                    value={group.minCardWidth ?? 280}
                    onChange={(v) => updateGroup(group.id, { minCardWidth: v })}
                  />
                )}
              </div>

              {/* Cards */}
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {group.cards.map((card, ci) => (
                    <CardEditor
                      key={card.id}
                      card={card}
                      index={ci}
                      total={group.cards.length}
                      hotels={hotels}
                      layout={group.layout}
                      onChange={(partial) => updateCard(group.id, card.id, partial)}
                      onRemove={() => removeCard(group.id, card.id)}
                      onMove={(dir) => moveCard(group.id, card.id, dir)}
                    />
                  ))}
                </AnimatePresence>
              </div>

              <motion.button
                type="button"
                onClick={() => addCard(group.id)}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 hover:border-teal-300 hover:bg-teal-50 rounded-xl text-sm font-bold text-gray-500 hover:text-teal-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> افزودن کارت
              </motion.button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ──────────────────────────────── slider row ────────────────────────────── */

function SliderRow({
  icon, label, min, max, step, value, onChange,
}: {
  icon: React.ReactNode; label: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-3 text-xs font-bold text-gray-600">
      <span className="flex items-center gap-1.5 whitespace-nowrap w-24">{icon} {label}</span>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-teal-600 cursor-pointer"
      />
      <span className="w-14 text-center font-mono text-[11px] text-teal-700 bg-teal-50 rounded-md py-1">{value}px</span>
    </label>
  );
}

/* ─────────────────────────────── card editor ────────────────────────────── */

function CardEditor({
  card, index, total, hotels, layout, onChange, onRemove, onMove,
}: {
  card: SiteCard;
  index: number;
  total: number;
  hotels: { id: number; name: string; city: string; images: string[] }[];
  layout: 'vertical' | 'horizontal';
  onChange: (partial: Partial<SiteCard>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  // New / unfinished cards start expanded; finished ones collapse to a tidy row.
  const [open, setOpen] = useState(() => !card.image || card.title === 'کارت جدید' || !card.title);
  const allPages = useAllPages();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setUploading(true);
        const dataUrl = await fileToCompressedDataURL(file, 1200, 0.8);
        onChange({ image: dataUrl });
      } catch {
        /* noop */
      } finally {
        setUploading(false);
      }
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const typeLabel = TYPE_OPTIONS.find((t) => t.value === card.type)?.label;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -16, transition: { duration: 0.18 } }}
      transition={{ duration: 0.28, ease: EASE }}
      className="rounded-xl border border-gray-200 bg-white overflow-hidden"
    >
      {/* Summary row (click to expand/collapse) */}
      <div className="flex items-center gap-2.5 p-2.5">
        <span className="text-gray-300 shrink-0"><GripVertical className="w-4 h-4" /></span>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2.5 flex-1 min-w-0 text-right"
        >
          <span className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 ring-1 ring-gray-200">
            {card.image ? (
              <img src={card.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon className="w-5 h-5" /></span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-gray-800 truncate">{card.title || 'بدون عنوان'}</span>
            <span className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[10px] font-bold">
                {TYPE_OPTIONS.find((t) => t.value === card.type)?.icon} {typeLabel}
              </span>
              {card.subtitle && <span className="text-[11px] text-gray-400 truncate">{card.subtitle}</span>}
            </span>
          </span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} className="text-gray-400 shrink-0">
            <ChevronDown className="w-4 h-4" />
          </motion.span>
        </button>

        <div className="flex items-center gap-0.5 shrink-0">
          <IconBtn onClick={() => onMove(-1)} disabled={index === 0} title="بالا"><ArrowUp className="w-3.5 h-3.5" /></IconBtn>
          <IconBtn onClick={() => onMove(1)} disabled={index === total - 1} title="پایین"><ArrowDown className="w-3.5 h-3.5" /></IconBtn>
          <IconBtn onClick={onRemove} tone="red" title="حذف کارت"><Trash2 className="w-3.5 h-3.5" /></IconBtn>
        </div>
      </div>

      {/* Expanded editor */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 space-y-3 border-t border-gray-100">
              {/* Type segmented control */}
              <div className="grid grid-cols-3 gap-1 bg-gray-100 rounded-xl p-1">
                {TYPE_OPTIONS.map((t) => {
                  const active = card.type === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => onChange({ type: t.value })}
                      className="relative flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-colors"
                    >
                      {active && (
                        <motion.span
                          layoutId={`type-pill-${card.id}`}
                          className="absolute inset-0 bg-teal-600 rounded-lg shadow"
                          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                        />
                      )}
                      <span className={`relative z-10 flex items-center gap-1 ${active ? 'text-white' : 'text-gray-500'}`}>
                        {t.icon} {t.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* colSpan (horizontal only) */}
              {layout === 'horizontal' && (
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                  <span className="flex items-center gap-1 whitespace-nowrap"><Columns3 className="w-4 h-4 text-teal-600" /> طول کارت</span>
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 flex-1">
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => onChange({ colSpan: n })}
                        className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-colors ${
                          (card.colSpan ?? 1) === n ? 'bg-teal-600 text-white shadow' : 'text-gray-500 hover:bg-white'
                        }`}
                      >
                        {n === 1 ? 'عادی' : n === 2 ? '۲ برابر' : '۳ برابر'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick fill */}
              {card.type === 'hotel' && (
                <select
                  value=""
                  onChange={(e) => {
                    const h = hotels.find((x) => String(x.id) === e.target.value);
                    if (h) onChange({ title: h.name, subtitle: h.city, image: h.images[0] || '', link: `/hotel/${h.id}` });
                  }}
                  className="w-full px-3 py-2.5 bg-teal-50/60 border border-teal-200 rounded-xl text-sm text-teal-800 outline-none focus:ring-2 focus:ring-teal-200"
                >
                  <option value="">⚡ انتخاب هتل برای پر کردن خودکار</option>
                  {hotels.map((h) => <option key={h.id} value={h.id}>{h.name} ({h.city})</option>)}
                </select>
              )}
              {card.type === 'city' && (
                <select
                  value=""
                  onChange={(e) => { if (e.target.value) onChange({ title: e.target.value, subtitle: 'مشاهده اقامتگاه‌ها', link: '/' }); }}
                  className="w-full px-3 py-2.5 bg-teal-50/60 border border-teal-200 rounded-xl text-sm text-teal-800 outline-none focus:ring-2 focus:ring-teal-200"
                >
                  <option value="">⚡ انتخاب شهر برای پر کردن خودکار</option>
                  {BIG_CITIES.map((c: string) => <option key={c} value={c}>{c}</option>)}
                </select>
              )}

              {/* Title / subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Field value={card.title} onChange={(v) => onChange({ title: v })} placeholder="عنوان کارت" />
                <Field value={card.subtitle || ''} onChange={(v) => onChange({ subtitle: v })} placeholder="زیرعنوان (اختیاری)" />
              </div>

              {/* Image */}
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <ImageIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    value={card.image.startsWith('data:') ? '' : card.image}
                    onChange={(e) => onChange({ image: e.target.value })}
                    placeholder={card.image.startsWith('data:') ? 'عکس آپلود شد ✓' : 'آدرس عکس (URL)'}
                    className="w-full pr-9 pl-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                <motion.button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  whileTap={{ scale: 0.95 }}
                  title="آپلود عکس از دستگاه"
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold whitespace-nowrap transition-colors shrink-0"
                >
                  {uploading ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : card.image.startsWith('data:') ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploading ? '...' : 'آپلود'}
                </motion.button>
              </div>

              {/* Link */}
              <div className="space-y-2">
                <select
                  value={allPages.some((p) => p.path === card.link) ? card.link : ''}
                  onChange={(e) => { if (e.target.value) onChange({ link: e.target.value }); }}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-400"
                >
                  <option value="">— انتخاب صفحه مقصد —</option>
                  {allPages.map((p) => <option key={p.path} value={p.path}>{p.label}</option>)}
                </select>
                <div className="relative">
                  <ExternalLink className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    value={card.link}
                    onChange={(e) => onChange({ link: e.target.value })}
                    placeholder="لینک (مثلاً /hotel/3 یا https://...)"
                    list={`links-${card.id}`}
                    className="w-full pr-9 pl-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                  <datalist id={`links-${card.id}`}>
                    {allPages.map((p) => <option key={p.path} value={p.path}>{p.label}</option>)}
                    {hotels.map((h) => <option key={h.id} value={`/hotel/${h.id}`}>{h.name}</option>)}
                  </datalist>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
