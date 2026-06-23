import { useMemo, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { Smartphone, RotateCw, RefreshCw, ExternalLink, Hand } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// پیش‌نمایش موبایل: سایت را داخل یک قاب واقعیِ گوشی (iframe) نمایش می‌دهد تا مدیر
// بتواند دقیقاً مثل یک گوشی موبایل ظاهر سایت را ببیند. چون کل اپ با HashRouter
// اجرا می‌شود، با باز کردن همان index.html داخل iframe یک نمونهٔ تازه از سایت روی
// مسیر انتخاب‌شده بوت می‌شود و تغییرات منتشرشده (از localStorage هم‌مبدأ) هم دیده می‌شود.
//
// «حالت لمسی»: چون با ماوس روی دسکتاپ نمی‌توان مثل انگشت کارت‌ها/کاروسل‌ها را کشید،
// یک شبیه‌ساز لمس داخل iframe تزریق می‌کنیم که کشیدنِ ماوس را به اسکرول (افقی برای
// کاروسل کارت‌ها و عمودی برای کل صفحه) تبدیل می‌کند — دقیقاً مثل کشیدن انگشت.
// ─────────────────────────────────────────────────────────────────────────────

type Device = {
  id: string;
  label: string;
  width: number;
  height: number;
  radius: number;
  notch: boolean;
};

const DEVICES: Device[] = [
  { id: 'iphone-se', label: 'iPhone SE', width: 375, height: 667, radius: 44, notch: false },
  { id: 'iphone-13', label: 'iPhone 13/14', width: 390, height: 844, radius: 52, notch: true },
  { id: 'iphone-pro-max', label: 'iPhone 15 Pro Max', width: 430, height: 932, radius: 56, notch: true },
  { id: 'pixel-7', label: 'Pixel 7', width: 412, height: 915, radius: 40, notch: false },
  { id: 'galaxy-s8', label: 'Galaxy S8+', width: 360, height: 740, radius: 44, notch: false },
];

const ROUTES: { path: string; label: string }[] = [
  { path: '#/', label: 'صفحهٔ اصلی' },
  { path: '#/support', label: 'پشتیبانی' },
  { path: '#/track', label: 'پیگیری رزرو' },
  { path: '#/login', label: 'ورود / ثبت‌نام' },
  { path: '#/account', label: 'پنل کاربری' },
];

function baseDocUrl(): string {
  return window.location.href.split('#')[0];
}

export default function MobilePreviewPanel() {
  const [deviceId, setDeviceId] = useState<string>('iphone-13');
  const [landscape, setLandscape] = useState(false);
  const [route, setRoute] = useState<string>('#/');
  const [reloadKey, setReloadKey] = useState(0);
  const [touchDrag, setTouchDrag] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  // مرجعِ زندهٔ وضعیت «حالت لمسی» تا هندلرهای داخل iframe همیشه مقدار به‌روز را بخوانند.
  const touchDragRef = useRef(touchDrag);
  touchDragRef.current = touchDrag;

  const device = useMemo(
    () => DEVICES.find((d) => d.id === deviceId) ?? DEVICES[1],
    [deviceId],
  );

  const frameW = landscape ? device.height : device.width;
  const frameH = landscape ? device.width : device.height;

  // ابعاد بیرونی قاب گوشی (با حاشیهٔ بدنه)
  const outerW = frameW + 24;
  const outerH = frameH + 24;

  // ── مقیاس خودکار: قاب گوشی را متناسب با عرض پنل کوچک می‌کنیم تا هر سایز گوشی
  //    (حتی Pro Max یا حالت افقی) کامل و بدون اسکرول روی همهٔ نمایشگرها دیده شود.
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const compute = () => {
      const avail = el.clientWidth - 8; // کمی حاشیه
      const s = Math.min(1, avail / outerW);
      setScale(s > 0 && Number.isFinite(s) ? s : 1);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    window.addEventListener('resize', compute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, [outerW]);

  const src = useMemo(
    () => `${baseDocUrl()}${route}`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [route, reloadKey],
  );

  const reload = () => setReloadKey((k) => k + 1);
  const openInNewTab = () => window.open(src, '_blank');

  // ── تزریق شبیه‌ساز لمس داخل iframe پس از بارگذاری ──
  const installTouchEmulation = useCallback(() => {
    const frame = iframeRef.current;
    if (!frame) return;
    let doc: Document | null = null;
    let win: Window | null = null;
    try {
      doc = frame.contentDocument;
      win = frame.contentWindow;
    } catch {
      return; // cross-origin؛ نباید رخ دهد چون هم‌مبدأ است
    }
    if (!doc || !win) return;
    // جلوگیری از نصب دوباره روی همان سند
    if ((doc as any).__touchEmuInstalled) return;
    (doc as any).__touchEmuInstalled = true;

    const D = doc;
    const W = win;
    const THRESHOLD = 4;

    let dragging = false;
    let moved = false;
    let startX = 0, startY = 0, lastX = 0, lastY = 0;
    let hEl: HTMLElement | null = null;
    let vEl: HTMLElement | null = null;

    const isScrollable = (el: HTMLElement, axis: 'x' | 'y'): boolean => {
      if (!el || el === D.body || el === D.documentElement) return false;
      const style = W.getComputedStyle(el);
      const ov = axis === 'x' ? style.overflowX : style.overflowY;
      if (ov !== 'auto' && ov !== 'scroll') return false;
      return axis === 'x'
        ? el.scrollWidth > el.clientWidth + 2
        : el.scrollHeight > el.clientHeight + 2;
    };

    const findScroll = (start: EventTarget | null, axis: 'x' | 'y'): HTMLElement | null => {
      let el = start as HTMLElement | null;
      while (el && el !== D.body) {
        if (isScrollable(el, axis)) return el;
        el = el.parentElement;
      }
      return null;
    };

    const onDown = (e: MouseEvent) => {
      if (!touchDragRef.current || e.button !== 0) return;
      dragging = true;
      moved = false;
      startX = lastX = e.clientX;
      startY = lastY = e.clientY;
      hEl = findScroll(e.target, 'x');
      vEl = findScroll(e.target, 'y');
    };

    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      if (!moved && (Math.abs(e.clientX - startX) > THRESHOLD || Math.abs(e.clientY - startY) > THRESHOLD)) {
        moved = true;
        D.body.style.userSelect = 'none';
        D.body.style.cursor = 'grabbing';
      }
      if (!moved) return;
      e.preventDefault();
      // کشیدن طبیعی مثل انگشت: محتوا با جهت حرکت دست می‌رود
      if (hEl) hEl.scrollLeft -= dx;
      if (vEl) vEl.scrollTop -= dy;
      else W.scrollBy(0, -dy);
    };

    const end = () => {
      if (dragging && moved) {
        // کلیکِ بعد از کشیدن را بی‌اثر کن تا ناخواسته روی لینک/دکمه نزند
        const swallow = (ev: Event) => {
          ev.stopPropagation();
          ev.preventDefault();
          D.removeEventListener('click', swallow, true);
        };
        D.addEventListener('click', swallow, true);
        setTimeout(() => D.removeEventListener('click', swallow, true), 60);
      }
      dragging = false;
      moved = false;
      hEl = null;
      vEl = null;
      D.body.style.userSelect = '';
      D.body.style.cursor = '';
    };

    D.addEventListener('mousedown', onDown, true);
    D.addEventListener('mousemove', onMove, { passive: false, capture: true });
    D.addEventListener('mouseup', end, true);
    D.addEventListener('mouseleave', end, true);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-emerald-600" />
          نمایش موبایل
        </h2>
        <p className="text-xs text-gray-500">
          ظاهر سایت را دقیقاً مثل صفحهٔ یک گوشی موبایل ببینید و با کشیدن، کارت‌ها را لمسی جابه‌جا کنید.
        </p>
      </div>

      {/* نوار کنترل‌ها */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">مدل گوشی:</label>
          <select
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {DEVICES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label} ({d.width}×{d.height})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">صفحه:</label>
          <select
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {ROUTES.map((r) => (
              <option key={r.path} value={r.path}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 mr-auto">
          <button
            onClick={() => setTouchDrag((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              touchDrag ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
            title="کشیدن لمسی (مثل انگشت روی گوشی)"
          >
            <Hand className="w-4 h-4" />
            حالت لمسی: {touchDrag ? 'روشن' : 'خاموش'}
          </button>
          <button
            onClick={() => setLandscape((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
            title="چرخش صفحه"
          >
            <RotateCw className="w-4 h-4" />
            {landscape ? 'عمودی' : 'افقی'}
          </button>
          <button
            onClick={reload}
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
            title="بارگذاری مجدد"
          >
            <RefreshCw className="w-4 h-4" />
            رفرش
          </button>
          <button
            onClick={openInNewTab}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
            title="باز کردن در تب جدید"
          >
            <ExternalLink className="w-4 h-4" />
            تب جدید
          </button>
        </div>
      </div>

      {/* قاب گوشی — با مقیاس خودکار تا هر اندازهٔ گوشی روی هر نمایشگری کامل جا شود */}
      <div ref={stageRef} className="flex justify-center py-6 bg-gradient-to-b from-gray-100 to-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
        {/* جای‌نگه‌دار با ابعاد مقیاس‌خورده تا ارتفاع به‌درستی رزرو شود */}
        <div style={{ width: outerW * scale, height: outerH * scale }}>
          <div
            className="relative bg-black shadow-2xl"
            style={{
              width: outerW,
              height: outerH,
              borderRadius: device.radius + 12,
              padding: 12,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
          {device.notch && !landscape && (
            <div
              className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-black rounded-b-2xl"
              style={{ width: Math.min(160, frameW * 0.45), height: 26 }}
            />
          )}

          <div
            className="relative w-full h-full overflow-hidden bg-white"
            style={{ borderRadius: device.radius, cursor: touchDrag ? 'grab' : 'default' }}
          >
            <iframe
              key={`${device.id}-${landscape ? 'l' : 'p'}-${reloadKey}-${route}`}
              ref={iframeRef}
              src={src}
              title="پیش‌نمایش موبایل سایت"
              onLoad={installTouchEmulation}
              className="w-full h-full border-0 bg-white"
              style={{ width: frameW, height: frameH }}
            />
          </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-3">
        اندازهٔ صفحه: {frameW}×{frameH} پیکسل — {device.label}
        {landscape ? ' (افقی)' : ''} — برای جابه‌جایی کارت‌ها، با ماوس بکشید (مثل لمس).
      </p>
    </div>
  );
}
