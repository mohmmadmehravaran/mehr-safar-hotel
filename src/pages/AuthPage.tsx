import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Phone, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useDocumentTitle } from '../utils/useDocumentTitle';

export default function AuthPage() {
  const navigate = useNavigate();
  const { loginWithPhone } = useApp();
  const { theme } = useTheme();
  useDocumentTitle('ورود');

  const [phone, setPhone] = useState('');
  const [alert, setAlert] = useState<{ ok: boolean; msg: string } | null>(null);

  const close = () => navigate(-1);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await loginWithPhone(phone);
    setAlert({ ok: r.success, msg: r.message });
    if (r.success) setTimeout(() => navigate('/account'), 600);
  };

  return (
    <div
      className="min-h-[calc(100dvh-64px)] flex items-center justify-center px-5 py-10 pb-24 md:pb-10"
      style={{ backgroundColor: theme.colors.bodyBg }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-soft-xl"
        style={{ backgroundColor: theme.colors.cardBg, border: `1px solid ${theme.colors.cardBorder}` }}
      >
        {/* Header: close + title */}
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={close}
            aria-label="بستن"
            className="p-2 -m-2 rounded-xl transition-colors hover:bg-gray-100"
            style={{ color: theme.colors.textSecondary }}
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
          <h1 className="text-lg font-black" style={{ color: theme.colors.textPrimary }}>
            ورود به مهر سفر
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-sm mb-5 text-right" style={{ color: theme.colors.textSecondary }}>
          برای ادامه لطفاً شماره موبایل خود را وارد کنید.
        </p>

        {/* Alert */}
        {alert && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-4 p-3.5 rounded-2xl text-sm font-semibold"
            style={alert.ok
              ? { backgroundColor: theme.colors.primaryLight, color: theme.colors.primary }
              : { backgroundColor: '#fee2e2', color: '#dc2626' }}
          >
            {alert.ok ? '✓ ' : '✗ '}{alert.msg}
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          {/* Phone input */}
          <div className="relative">
            <label htmlFor="login-phone" className="sr-only">شماره موبایل</label>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">
              <Phone className="w-5 h-5" />
            </div>
            <input
              id="login-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="شماره موبایل"
              aria-label="شماره موبایل"
              className="w-full pr-12 pl-4 py-4 rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 text-right placeholder:text-right"
              style={{
                backgroundColor: theme.colors.bodyBg,
                border: `2px solid ${theme.colors.cardBorder}`,
                color: theme.colors.textPrimary,
              }}
            />
          </div>

          {/* Terms note */}
          <div className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: theme.colors.textSecondary }}>
            <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <p>
              ورود و استفاده از مهر سفر به معنای پذیرش{' '}
              <Link to="/support" className="font-semibold" style={{ color: theme.colors.primary }}>
                قوانین و مقررات
              </Link>{' '}
              آن می‌باشد.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-4 rounded-2xl text-white font-black text-base transition-all active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
              boxShadow: `0 12px 28px ${theme.colors.primary}35`,
            }}
          >
            تأیید و ادامه
          </button>
        </form>
      </motion.div>
    </div>
  );
}
