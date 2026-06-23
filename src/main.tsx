import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import {
  THEME_KEY, EDITS_KEY, WIDGETS_KEY, PAGES_KEY, HEADER_LINKS_KEY, CARDS_KEY, CONFIG_VERSION_KEY,
} from "./utils/sitePublish";

// ───────────────────────────────────────────────────────────────────────────
// قبل از رندر، پیکربندی ظاهری منتشرشده را (در صورت وجود) از کنار سایت می‌خوانیم تا
// تغییرات مدیر روی همهٔ دستگاه‌ها (از جمله موبایل) نمایش داده شود. اگر نسخهٔ
// منتشرشده جدیدتر از چیزی باشد که این مرورگر قبلاً اعمال کرده، آن را در حافظهٔ
// مرورگر می‌نشانیم تا کانتکست‌های موجود بدون تغییر آن را بخوانند.
// ───────────────────────────────────────────────────────────────────────────
async function applyPublishedConfig(): Promise<void> {
  try {
    // مسیر نسبی به صفحهٔ فعلی؛ با base نسبی روی GitHub Pages هم درست کار می‌کند.
    const url = new URL("published-site-config.json", document.baseURI).href;
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) return;
    const cfg = await res.json();
    if (!cfg || typeof cfg.version !== "number") return;

    const storedVersion = Number(localStorage.getItem(CONFIG_VERSION_KEY) || 0);
    if (cfg.version <= storedVersion) return; // قبلاً اعمال شده یا قدیمی‌تر است

    if (cfg.theme) localStorage.setItem(THEME_KEY, JSON.stringify(cfg.theme));
    if (cfg.edits) localStorage.setItem(EDITS_KEY, JSON.stringify(cfg.edits));
    if (cfg.widgets) localStorage.setItem(WIDGETS_KEY, JSON.stringify(cfg.widgets));
    if (cfg.pages) localStorage.setItem(PAGES_KEY, JSON.stringify(cfg.pages));
    if (cfg.headerLinks) localStorage.setItem(HEADER_LINKS_KEY, JSON.stringify(cfg.headerLinks));
    if (cfg.cards) localStorage.setItem(CARDS_KEY, JSON.stringify(cfg.cards));
    localStorage.setItem(CONFIG_VERSION_KEY, String(cfg.version));
  } catch {
    // اگر فایل نبود یا خطا داد، با تنظیمات محلی/پیش‌فرض ادامه می‌دهیم.
  }
}

applyPublishedConfig().finally(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
