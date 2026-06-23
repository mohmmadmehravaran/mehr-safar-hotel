// ───────────────────────────────────────────────────────────────────────────
// انتشار سراسری ظاهر سایت (Publish appearance for ALL devices)
//
// مشکل: تمام تغییرات ظاهری فقط در localStorage همان مرورگر ذخیره می‌شوند، پس روی
// گوشی یا دستگاه دیگر دیده نمی‌شوند. چون سایت بک‌اند ندارد (استاتیک)، راه‌حل این
// است که مدیر یک فایل «published-site-config.json» بسازد و آن را در ریشهٔ مخزن
// قرار دهد؛ این فایل هنگام بارگذاری توسط همهٔ بازدیدکنندگان (از جمله موبایل)
// خوانده می‌شود.
// ───────────────────────────────────────────────────────────────────────────

export const THEME_KEY = 'mehrsafar-theme';
export const EDITS_KEY = 'mehrsafar-visual-edits-2026';
export const WIDGETS_KEY = 'mehrsafar-visual-widgets-2026';
export const PAGES_KEY = 'mehrsafar-custom-pages-2026';
export const HEADER_LINKS_KEY = 'mehrsafar-header-links-2026';
export const CARDS_KEY = 'mehrsafar-card-groups';
export const CONFIG_VERSION_KEY = 'mehrsafar-config-version';

export interface PublishedConfig {
  version: number;
  publishedAt: string;
  theme: unknown;
  edits: unknown;
  widgets: unknown;
  pages: unknown;
  headerLinks: unknown;
  cards: unknown;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// پیکربندی فعلی را از روی حافظهٔ مرورگر می‌سازد (همهٔ تغییرات ظاهری ذخیره‌شده).
export function buildPublishedConfig(): PublishedConfig {
  return {
    version: Date.now(),
    publishedAt: new Date().toISOString(),
    theme: readJSON<unknown>(THEME_KEY, null),
    edits: readJSON<unknown>(EDITS_KEY, {}),
    widgets: readJSON<unknown>(WIDGETS_KEY, []),
    pages: readJSON<unknown>(PAGES_KEY, []),
    headerLinks: readJSON<unknown>(HEADER_LINKS_KEY, []),
    cards: readJSON<unknown>(CARDS_KEY, []),
  };
}

// فایل published-site-config.json را برای دانلود تولید می‌کند.
export function downloadPublishedConfig(): PublishedConfig {
  const config = buildPublishedConfig();
  // نسخهٔ همین دستگاه را هم‌سطح کن تا دوباره روی خودش بازنشانی نشود.
  try {
    localStorage.setItem(CONFIG_VERSION_KEY, String(config.version));
  } catch {}
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'published-site-config.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return config;
}
