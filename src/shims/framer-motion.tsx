/* ───────────────────────────────────────────────────────────────
   Shim جایگزین framer-motion (به‌درخواست کاربر: حذف کامل انیمیشن سایت).
   هر <motion.x> به یک المان ساده‌ی <x> تبدیل می‌شود و همه‌ی propهای
   انیمیشن (initial/animate/exit/transition/whileHover/...) حذف می‌شوند.
   AnimatePresence و MotionConfig هم فقط فرزندانشان را بدون انیمیشن
   رندر می‌کنند. vite.config.ts ایمپورت 'framer-motion' را به این
   فایل alias کرده است، بنابراین هیچ کامپوننتی نیازی به تغییر ندارد.
   ─────────────────────────────────────────────────────────────── */
import React from 'react';

// propهای مخصوص framer-motion که نباید به DOM پاس داده شوند.
const MOTION_PROPS = new Set([
  'initial', 'animate', 'exit', 'transition', 'variants',
  'whileHover', 'whileTap', 'whileFocus', 'whileInView', 'whileDrag',
  'drag', 'dragConstraints', 'dragElastic', 'dragMomentum', 'dragTransition',
  'dragControls', 'dragListener', 'dragSnapToOrigin', 'dragPropagation',
  'layout', 'layoutId', 'layoutDependency', 'layoutScroll', 'layoutRoot',
  'viewport', 'inherit', 'custom',
  'onAnimationStart', 'onAnimationComplete', 'onUpdate',
  'onDragStart', 'onDrag', 'onDragEnd', 'onDirectionLock',
  'onHoverStart', 'onHoverEnd', 'onTap', 'onTapStart', 'onTapCancel',
  'onViewportEnter', 'onViewportLeave', 'onLayoutAnimationStart', 'onLayoutAnimationComplete',
  'transformTemplate', 'style',
]);

function stripMotionProps(props: Record<string, any>) {
  const clean: Record<string, any> = {};
  for (const key in props) {
    if (key === 'style') { clean.style = props.style; continue; } // style را نگه می‌داریم
    if (MOTION_PROPS.has(key)) continue;
    clean[key] = props[key];
  }
  return clean;
}

const cache = new Map<string, React.ElementType>();

function getComponent(tag: string): React.ElementType {
  if (!cache.has(tag)) {
    const Comp = React.forwardRef<any, Record<string, any>>((props, ref) => {
      const clean = stripMotionProps(props);
      return React.createElement(tag, { ...clean, ref });
    });
    (Comp as any).displayName = `motion.${tag}`;
    cache.set(tag, Comp);
  }
  return cache.get(tag)!;
}

// motion.div / motion.button / motion.span / ... و همچنین motion(Component)
export const motion: any = new Proxy(
  function (Component: React.ElementType) {
    return React.forwardRef<any, Record<string, any>>((props, ref) => {
      const clean = stripMotionProps(props);
      return React.createElement(Component, { ...clean, ref });
    });
  },
  {
    get: (_target, tag: string) => getComponent(tag),
  }
);

export const AnimatePresence: React.FC<{ children?: React.ReactNode }> = ({ children }) =>
  React.createElement(React.Fragment, null, children);

export const MotionConfig: React.FC<{ children?: React.ReactNode }> = ({ children }) =>
  React.createElement(React.Fragment, null, children);

// hookهای رایج (در صورت استفاده‌ی احتمالی در آینده) – بدون انیمیشن.
export const useReducedMotion = () => true;
export const useAnimation = () => ({
  start: () => Promise.resolve(),
  stop: () => {},
  set: () => {},
});

export default { motion, AnimatePresence, MotionConfig, useReducedMotion, useAnimation };
