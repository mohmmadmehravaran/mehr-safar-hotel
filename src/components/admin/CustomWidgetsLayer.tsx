import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, type NavigateFunction } from 'react-router-dom';
import { useSiteEdits, CustomWidget } from '../../context/SiteEditsContext';
import { useTheme } from '../../context/ThemeContext';
import { getIconComp } from '../../utils/iconLibrary';
import { shapeCss } from '../../utils/shapeLibrary';
import { computeDomPath, findByDomPath } from '../../utils/domPath';

/** Canva/Photoshop-style extras applied to every widget: rotation, lock, visibility. */
function extraStyle(w: CustomWidget, editing: boolean): React.CSSProperties {
  const s: React.CSSProperties = {};
  if (w.rotation) s.transform = `rotate(${w.rotation}deg)`;
  if (w.hidden) {
    if (!editing) { s.display = 'none'; }
    else { s.opacity = 0.3; s.outline = '2px dashed #ef4444'; s.outlineOffset = '2px'; }
  }
  // Locked layers can't be grabbed/clicked on the canvas while editing (manage via the layers panel).
  if (w.locked && editing) s.pointerEvents = 'none';
  return s;
}

function getBorder(w: CustomWidget, scale: number = 1): string {
  if (w.strokeWidth !== undefined && w.strokeWidth > 0) {
    const style = w.strokeStyle || 'solid';
    const color = w.strokeColor || '#10b981';
    const borderW = Math.max(1, Math.round(w.strokeWidth * scale));
    return `${borderW}px ${style} ${color}`;
  }
  if (w.strokeWidth === 0) return 'none';
  return w.border || '1px solid #e5e7eb';
}

function getShadow(w: CustomWidget, defaultShadow: string, scale: number = 1): string {
  if (
    w.shadowX !== undefined || w.shadowY !== undefined ||
    w.shadowBlur !== undefined || w.shadowSpread !== undefined ||
    w.shadowColor !== undefined
  ) {
    const x = Math.round((w.shadowX ?? 0) * scale);
    const y = Math.round((w.shadowY ?? 4) * scale);
    const blur = Math.round((w.shadowBlur ?? 12) * scale);
    const spread = Math.round((w.shadowSpread ?? 0) * scale);
    const color = w.shadowColor ?? 'rgba(0,0,0,0.15)';
    const inset = w.shadowInset ? 'inset ' : '';
    return `${inset}${x}px ${y}px ${blur}px ${spread}px ${color}`;
  }
  return defaultShadow;
}

const isEditingNow = (editing: boolean) =>
  (typeof document !== 'undefined' && document.body.classList.contains('master-visual-editing')) || editing;

/**
 * Renders the actual visual element for a widget. Position + z-index come in via
 * `positionStyle` so the same component can be used both for floating (foreground)
 * widgets and for backdrops portaled inside a site section.
 */
function WidgetVisual({
  w, scale, positionStyle, editing, navigate,
}: {
  w: CustomWidget;
  scale: number;
  positionStyle: React.CSSProperties;
  editing: boolean;
  navigate: NavigateFunction;
}) {
  const editingNow = () => isEditingNow(editing);
  const goLink = () => { if (w.link && !editingNow()) navigate(w.link); };
  const z = w.zIndex ?? 25;

  if (w.type === 'container') {
    return (
      <div
        data-custom-widget-id={w.id}
        style={{
          ...positionStyle,
          backgroundColor: w.bg || '#ffffff',
          color: w.color || '#111827',
          borderRadius: Math.round((w.radius ?? 16) * scale),
          padding: Math.round((w.padding ?? 20) * scale),
          border: getBorder(w, scale),
          boxShadow: getShadow(w, '0 10px 30px rgba(0,0,0,0.12)', scale),
          zIndex: z,
          opacity: w.opacity ?? 1,
          backgroundImage: w.bgGradient || 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backdropFilter: w.glass ? 'blur(16px) saturate(180%)' : 'none',
          overflow: 'hidden',
          boxSizing: 'border-box',
          fontFamily: w.fontFamily || "'Vazirmatn', sans-serif",
          fontSize: Math.max(10, Math.round((w.fontSize ?? 14) * scale)),
          cursor: w.link ? 'pointer' : 'default',
          ...extraStyle(w, editing),
        }}
        dir="rtl"
        onClick={() => { if (w.link && !document.body.classList.contains('master-visual-editing')) navigate(w.link); }}
      >
        {w.title && <h3 style={{ fontSize: 'inherit', fontFamily: "'Vazirmatn', sans-serif", fontWeight: 'bold', marginBottom: Math.max(4, Math.round(8 * scale)), margin: 0 }}>{w.title}</h3>}
        {w.text && <p style={{ fontSize: 'inherit', fontFamily: "'Vazirmatn', sans-serif", lineHeight: 1.6, margin: 0, opacity: 0.9 }}>{w.text}</p>}
      </div>
    );
  }

  if (w.type === 'button') {
    return (
      <button
        data-custom-widget-id={w.id}
        type="button"
        onClick={goLink}
        style={{
          ...positionStyle,
          backgroundColor: w.bg || '#10b981',
          backgroundImage: w.bgGradient || 'none',
          color: w.color || '#ffffff',
          borderRadius: Math.round((w.radius ?? 14) * scale),
          padding: Math.round((w.padding ?? 12) * scale),
          border: getBorder(w, scale),
          boxShadow: getShadow(w, '0 8px 20px rgba(16,185,129,0.25)', scale),
          zIndex: z,
          opacity: w.opacity ?? 1,
          fontFamily: w.fontFamily || "'Vazirmatn', sans-serif",
          fontSize: Math.max(10, Math.round((w.fontSize ?? 16) * scale)),
          fontWeight: (w.fontWeight as any) ?? 700,
          textAlign: (w.textAlign as any) ?? 'center',
          cursor: editingNow() ? 'move' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
          backdropFilter: w.glass ? 'blur(16px) saturate(180%)' : 'none',
          ...extraStyle(w, editing),
        }}
        dir="rtl"
      >
        {w.title || 'دکمه'}
      </button>
    );
  }

  if (w.type === 'text') {
    return (
      <div
        data-custom-widget-id={w.id}
        onClick={goLink}
        style={{
          ...positionStyle,
          color: w.color || '#111827',
          padding: Math.round((w.padding ?? 4) * scale),
          zIndex: z,
          opacity: w.opacity ?? 1,
          fontFamily: w.fontFamily || "'Vazirmatn', sans-serif",
          fontSize: Math.max(10, Math.round((w.fontSize ?? 20) * scale)),
          fontWeight: (w.fontWeight as any) ?? 600,
          textAlign: (w.textAlign as any) ?? 'right',
          lineHeight: 1.7,
          cursor: w.link && !editingNow() ? 'pointer' : 'default',
          boxSizing: 'border-box',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          ...extraStyle(w, editing),
        }}
        dir="rtl"
      >
        {w.text || 'متن دلخواه'}
      </div>
    );
  }

  if (w.type === 'icon') {
    const IconComp = getIconComp(w.icon);
    const baseSize = w.iconSize ?? Math.min(w.width, w.height) * 0.8;
    const iconSize = baseSize * scale;
    return (
      <div
        data-custom-widget-id={w.id}
        onClick={goLink}
        style={{
          ...positionStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: w.bg || 'transparent',
          backgroundImage: w.bgGradient || 'none',
          borderRadius: Math.round((w.radius ?? 16) * scale),
          border: w.strokeWidth ? getBorder(w, scale) : 'none',
          boxShadow: getShadow(w, 'none', scale),
          padding: Math.round((w.padding ?? 0) * scale),
          zIndex: z,
          opacity: w.opacity ?? 1,
          cursor: w.link && !editingNow() ? 'pointer' : 'default',
          boxSizing: 'border-box',
          ...extraStyle(w, editing),
        }}
      >
        <IconComp size={iconSize} color={w.color || '#10b981'} strokeWidth={2} />
      </div>
    );
  }

  if (w.type === 'shape') {
    const css = shapeCss(w.shape, Math.round((w.radius ?? 16) * scale));
    const isLine = w.shape === 'line';
    return (
      <div
        data-custom-widget-id={w.id}
        onClick={goLink}
        style={{
          ...positionStyle,
          height: isLine ? Math.min(positionStyle.height as number, 12 * scale) : positionStyle.height,
          backgroundColor: w.bg || '#10b981',
          backgroundImage: w.bgGradient || 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: w.strokeWidth ? getBorder(w, scale) : 'none',
          boxShadow: getShadow(w, 'none', scale),
          zIndex: z,
          opacity: w.opacity ?? 1,
          cursor: w.link && !editingNow() ? 'pointer' : 'default',
          boxSizing: 'border-box',
          backdropFilter: w.glass ? 'blur(16px) saturate(180%)' : 'none',
          ...css,
          ...extraStyle(w, editing),
        }}
      />
    );
  }

  // type === 'image'
  return (
    <img
      data-custom-widget-id={w.id}
      src={w.src || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'}
      alt={w.title || 'تصویر دلخواه'}
      style={{
        ...positionStyle,
        objectFit: 'cover',
        borderRadius: Math.round((w.radius ?? 16) * scale),
        border: getBorder(w, scale),
        boxShadow: getShadow(w, '0 12px 32px rgba(0,0,0,0.18)', scale),
        zIndex: z,
        opacity: w.opacity ?? 1,
        backdropFilter: w.glass ? 'blur(16px) saturate(180%)' : undefined,
        WebkitBackdropFilter: w.glass ? 'blur(16px) saturate(180%)' : undefined,
        boxSizing: 'border-box',
        ...extraStyle(w, editing),
      }}
    />
  );
}

/**
 * Find the site section that visually contains a given document-space point.
 * Used to host "behind" widgets so they paint *inside* that section — above its
 * background but below its in-flow content (the real Photoshop "send to back").
 */
function findAnchorSection(cx: number, cy: number): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const candidates = Array.from(
    document.querySelectorAll('main section, main > div, header, footer')
  ) as HTMLElement[];
  let best: HTMLElement | null = null;
  for (const el of candidates) {
    if (el.closest('[data-visual-ui]')) continue;        // skip editor chrome
    if (el.hasAttribute('data-custom-widget-id')) continue; // skip other widgets
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const left = r.left + window.scrollX;
    const top = r.top + window.scrollY;
    if (cx >= left && cx <= left + r.width && cy >= top && cy <= top + r.height) {
      best = el; // later (more deeply nested) matches win
    }
  }
  return best;
}

/**
 * Within a host section, find the in-flow element the backdrop sits behind by
 * picking the descendant whose box best overlaps the backdrop's rectangle
 * (highest intersection-over-union). This reliably lands on the search card
 * (rather than the whole section or a tiny input inside it). All coords are in
 * document space (include scroll).
 */
function findAnchorTarget(
  section: HTMLElement,
  bx: number, by: number, bw: number, bh: number,
): HTMLElement | null {
  if (bw <= 0 || bh <= 0) return null;
  const bArea = bw * bh;
  const bRight = bx + bw, bBottom = by + bh;
  let best: HTMLElement | null = null;
  let bestIoU = 0;
  const els = Array.from(section.querySelectorAll('*')) as HTMLElement[];
  for (const el of els) {
    if (el.closest('[data-visual-ui]')) continue;        // editor chrome
    if (el.closest('[data-custom-widget-id]')) continue; // other widgets
    const r = el.getBoundingClientRect();
    if (r.width < 24 || r.height < 24) continue;          // ignore tiny leaves
    const x = r.left + window.scrollX, y = r.top + window.scrollY;
    const ix = Math.max(bx, x), iy = Math.max(by, y);
    const ix2 = Math.min(bRight, x + r.width), iy2 = Math.min(bBottom, y + r.height);
    const iw = ix2 - ix, ih = iy2 - iy;
    if (iw <= 0 || ih <= 0) continue;
    const inter = iw * ih;
    const union = bArea + r.width * r.height - inter;
    const iou = union > 0 ? inter / union : 0;
    if (iou > bestIoU) { bestIoU = iou; best = el; }
  }
  // Require a meaningful overlap so we don't latch onto an unrelated box.
  return bestIoU >= 0.25 ? best : null;
}

/**
 * A widget rendered BEHIND the page content. It is portaled into the nearest
 * site section and positioned relative to it with a negative z-index, so it sits
 * above that section's background but below its content (e.g. behind the search box).
 */
function BehindWidget({
  w, scale, baseStyle, editing, navigate, canCapture,
}: {
  w: CustomWidget;
  scale: number;
  baseStyle: React.CSSProperties;
  editing: boolean;
  navigate: NavigateFunction;
  canCapture: boolean;
}) {
  const { setWidgetBackdrop } = useSiteEdits();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const baseLeft = (baseStyle.left as number) || 0;
  const baseTop = (baseStyle.top as number) || 0;
  const baseW = (baseStyle.width as number) || w.width;
  const baseH = (baseStyle.height as number) || w.height;

  // (Re)find the host section whenever the backdrop moves or the page changes.
  useEffect(() => {
    const cx = baseLeft + baseW / 2;
    const cy = baseTop + baseH / 2;
    const el = findAnchorSection(cx, cy);
    if (el) {
      const cs = getComputedStyle(el);
      if (cs.position === 'static') el.style.position = 'relative'; // anchor absolute children to it
      // The host section must form its OWN stacking context, otherwise a negative
      // z-index child escapes to the page root and ends up *behind* the section's
      // background (hidden). `isolation: isolate` creates a stacking context without
      // touching layout, so the backdrop paints above the section background but
      // below its in-flow content (the search box, text, cards…).
      if (cs.isolation !== 'isolate') el.style.isolation = 'isolate';
    }
    setAnchor(el);
  }, [baseLeft, baseTop, baseW, baseH]);

  // Keep the backdrop glued to the section as it scrolls / resizes / reflows.
  const lastKey = useRef('');
  useEffect(() => {
    if (!anchor) return;
    let id = 0;
    const loop = () => {
      if (anchor.isConnected) {
        const r = anchor.getBoundingClientRect();
        const key = `${Math.round(r.left)}|${Math.round(r.top)}|${Math.round(r.width)}|${Math.round(r.height)}`;
        if (key !== lastKey.current) {
          lastKey.current = key;
          setRect({ x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height });
        }
      }
      id = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(id);
  }, [anchor]);

  // Whenever a reliable DESKTOP layout is on screen (editing or just viewing on a
  // wide window), capture the backdrop's geometry RELATIVE to its section (center
  // fractions + width fraction + aspect). These responsive values keep the backdrop
  // centered & proportional on mobile / any screen. We never capture on a narrow
  // (mobile) layout because the absolute design coords wouldn't match it.
  useEffect(() => {
    if (!canCapture || !rect || rect.w === 0 || rect.h === 0 || baseW === 0) return;
    const relLeft = baseLeft - rect.x;
    const relTop = baseTop - rect.y;
    const bcx = (relLeft + baseW / 2) / rect.w;
    const bcy = (relTop + baseH / 2) / rect.h;
    const bwf = baseW / rect.w;
    const bar = baseH / baseW;
    // Also capture geometry relative to the actual element the backdrop sits
    // behind (the search card). This keeps the banner glued to that element on
    // mobile, where the section reflows and section-fractions drift.
    let tgt: string | undefined;
    let tlf: number | undefined, ttf: number | undefined, twf: number | undefined, thf: number | undefined;
    if (anchor) {
      const tEl = findAnchorTarget(anchor, baseLeft, baseTop, baseW, baseH);
      if (tEl && tEl !== anchor) {
        const tr = tEl.getBoundingClientRect();
        const tx = tr.left + window.scrollX, ty = tr.top + window.scrollY;
        if (tr.width > 0 && tr.height > 0) {
          const path = computeDomPath(tEl);
          if (path) {
            tgt = path;
            tlf = (baseLeft - tx) / tr.width;
            ttf = (baseTop - ty) / tr.height;
            twf = baseW / tr.width;
            thf = baseH / tr.height;
          }
        }
      }
    }

    const close = (a: number | undefined, b: number) => a !== undefined && Math.abs(a - b) < 0.002;
    const sectionSame = close(w.bcx, bcx) && close(w.bcy, bcy) && close(w.bwf, bwf) && close(w.bar, bar);
    const targetSame = (w.tgt === tgt) && close(w.tlf, tlf ?? NaN) && close(w.ttf, ttf ?? NaN) &&
      close(w.twf, twf ?? NaN) && close(w.thf, thf ?? NaN);
    if (sectionSame && (tgt === undefined || targetSame)) return;
    setWidgetBackdrop(w.id, { bcx, bcy, bwf, bar, tgt, tlf, ttf, twf, thf });
  }, [canCapture, rect, baseLeft, baseTop, baseW, baseH, anchor, w.id, w.bcx, w.bcy, w.bwf, w.bar, w.tgt, w.tlf, w.ttf, w.twf, w.thf, setWidgetBackdrop]);

  if (!anchor || !rect) return null;

  // Decide where the backdrop sits inside the section.
  let left: number, top: number, width: number, height: number;
  const hasRel = w.bwf != null && w.bcx != null && w.bcy != null;
  const hasTgt = !!w.tgt && w.twf != null && w.thf != null && w.tlf != null && w.ttf != null;
  // In live mode, try to anchor to the real element the backdrop sits behind
  // (e.g. the search card). This tracks it exactly on mobile, where the section
  // reflows and plain section-fractions would drift.
  let tgtEl: HTMLElement | null = null;
  if (!editing && hasTgt) {
    const el = findByDomPath(w.tgt as string);
    if (el && anchor.contains(el)) tgtEl = el;
  }
  if (!editing && tgtEl) {
    const tr = tgtEl.getBoundingClientRect();
    const tx = tr.left + window.scrollX - rect.x;
    const ty = tr.top + window.scrollY - rect.y;
    width = (w.twf as number) * tr.width;
    height = (w.thf as number) * tr.height;
    left = tx + (w.tlf as number) * tr.width;
    top = ty + (w.ttf as number) * tr.height;
  } else if (!editing && hasRel) {
    // Fallback: position by fractions of the CURRENT section size.
    width = (w.bwf as number) * rect.w;
    height = w.bar != null ? width * (w.bar as number) : (baseH / baseW) * width;
    left = (w.bcx as number) * rect.w - width / 2;
    top = (w.bcy as number) * rect.h - height / 2;
  } else {
    // Editing (or no captured geometry yet): use absolute coordinates so dragging
    // on the canvas feels 1:1.
    left = baseLeft - rect.x;
    top = baseTop - rect.y;
    width = baseW;
    height = baseH;
  }

  const positionStyle: React.CSSProperties = {
    position: 'absolute',
    left, top, width, height,
    pointerEvents: isEditingNow(editing) ? 'auto' : 'none', // never block clicks on the live site
  };

  // Force the widget behind the section's in-flow content but above its background.
  const behindW: CustomWidget = {
    ...w,
    zIndex: (w.zIndex != null && w.zIndex < 0) ? w.zIndex : -1,
  };

  return createPortal(
    <WidgetVisual w={behindW} scale={scale} positionStyle={positionStyle} editing={editing} navigate={navigate} />,
    anchor
  );
}

export default function CustomWidgetsLayer() {
  const { customWidgets } = useSiteEdits();
  const { isVisualEditing: editing } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Re-render on viewport changes (resize / device rotation) so responsive
  // backdrops recompute their position against the freshly laid-out sections.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const onResize = () => forceTick((t) => t + 1);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  if (typeof document === 'undefined') return null;

  // Only show widgets for current page
  const currentPage = location.pathname;
  const pageWidgets = customWidgets.filter((w) => w.page === currentPage);

  // Responsive styling helpers
  const currentW = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const editingNow = () => document.body.classList.contains('master-visual-editing') || editing;

  const getWidgetStyle = (w: CustomWidget): React.CSSProperties => {
    const designW = w.designWidth || 1280;
    const designH = w.designHeight || 800;

    const isMobileScale = currentW < 1024 && !editingNow();
    const scale = isMobileScale ? (currentW / designW) : 1;

    const style: React.CSSProperties = {};

    if (w.pinned) {
      style.position = 'fixed';

      // Horizontal anchoring (closest screen side)
      const isRightSide = (w.x + w.width / 2) > (designW / 2);
      if (isRightSide && !editingNow()) {
        const rightDistance = designW - (w.x + w.width);
        style.right = rightDistance;
      } else {
        style.left = w.x;
      }

      // Vertical anchoring (closest screen side)
      const isBottomSide = (w.y + w.height / 2) > (designH / 2);
      if (isBottomSide && !editingNow()) {
        const bottomDistance = designH - (w.y + w.height);
        style.bottom = bottomDistance;
      } else {
        style.top = w.y;
      }

      style.width = w.width;
      style.height = w.height;

      if (currentW < 768 && !editingNow()) {
        const pinnedScale = Math.max(0.65, currentW / 1280);
        style.transform = `scale(${pinnedScale})`;
        style.transformOrigin = `${isRightSide ? 'right' : 'left'} ${isBottomSide ? 'bottom' : 'top'}`;
      }

      return style;
    }

    style.position = 'absolute';

    if (isMobileScale) {
      style.left = w.x * scale;
      style.top = w.y * scale;
      style.width = w.width * scale;
      style.height = w.height * scale;
      style.maxWidth = '100vw';
    } else {
      style.left = w.x;
      style.top = w.y;
      style.width = w.width;
      style.height = w.height;
    }

    return style;
  };

  const getScaleFactor = (w: CustomWidget): number => {
    if (editingNow()) return 1;
    if (currentW >= 1024) return 1;
    const designW = w.designWidth || 1280;
    return currentW / designW;
  };

  // A backdrop only makes sense for a normally-positioned (non-pinned) widget.
  const isBackdrop = (w: CustomWidget) => !!w.behind && !w.pinned;
  const foreground = pageWidgets.filter((w) => !isBackdrop(w));
  const backdrops = pageWidgets.filter((w) => isBackdrop(w));

  return (
    <>
      {/* Floating widgets — rendered on top of the page (unchanged behaviour). */}
      {createPortal(
        <>
          {foreground.map((w) => (
            <WidgetVisual
              key={w.id}
              w={w}
              scale={getScaleFactor(w)}
              positionStyle={getWidgetStyle(w)}
              editing={editing}
              navigate={navigate}
            />
          ))}
        </>,
        document.body
      )}

      {/* Backdrops — rendered behind the content of the section they sit over. */}
      {backdrops.map((w) => (
        <BehindWidget
          key={w.id}
          w={w}
          scale={getScaleFactor(w)}
          baseStyle={getWidgetStyle(w)}
          editing={editing}
          navigate={navigate}
          canCapture={currentW >= 1024}
        />
      ))}
    </>
  );
}
