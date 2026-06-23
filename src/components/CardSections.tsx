import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCards } from '../context/CardsContext';
import { useTheme } from '../context/ThemeContext';
import { SiteCard } from '../types';
import HotelCard from './HotelCard';

function CardInner({ card }: { card: SiteCard }) {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl group/card">
      {card.image ? (
        <img
          src={card.image}
          alt={card.title}
          loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110 pointer-events-none"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300" />
      )}
      {/* overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      {/* text */}
      <div className="absolute bottom-0 right-0 left-0 p-4 text-white text-right">
        <h3 className="font-extrabold text-lg leading-tight drop-shadow">{card.title}</h3>
        {card.subtitle && <p className="text-sm opacity-90 mt-1 drop-shadow">{card.subtitle}</p>}
      </div>
    </div>
  );
}

function CardLink({
  card,
  className,
  style,
}: {
  card: SiteCard;
  className: string;
  style?: React.CSSProperties;
}) {
  const link = (card.link || '').trim();
  if (!link) {
    return (
      <div className={className} style={style}>
        <CardInner card={card} />
      </div>
    );
  }
  const isExternal = /^https?:\/\//i.test(link);
  if (isExternal) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" className={className} style={style}>
        <CardInner card={card} />
      </a>
    );
  }
  return (
    <Link to={link} className={className} style={style}>
      <CardInner card={card} />
    </Link>
  );
}

export default function CardSections({ page = '/' }: { page?: string }) {
  const { groups } = useCards();
  const { theme } = useTheme();

  // Only render the card sections that belong to this page (legacy groups → home "/").
  const visible = groups.filter((g) => (g.page ?? '/') === page && g.cards.length > 0);
  if (visible.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-10 space-y-10">
      {visible.map((group) => {
        // اندازه‌های قابل تنظیم از پنل مدیریت (با مقدار پیش‌فرض برای بخش‌های قدیمی)
        const cardHeight = group.cardHeight ?? 208;
        const minCardWidth = group.minCardWidth ?? 280;
        // در چیدمان شبکه‌ای از auto-fill استفاده می‌کنیم تا به‌صورت خودکار ریسپانسیو بماند:
        // روی صفحه‌های باریک یک‌ستونه و روی صفحه‌های پهن چندستونه می‌شود.
        const gridStyle: React.CSSProperties =
          group.layout === 'vertical'
            ? {}
            : {
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fill, minmax(min(${minCardWidth}px, 100%), 1fr))`,
                gap: '1rem',
              };
        return (
          <div key={group.id}>
            {group.title && (
              <h2 className="text-xl font-black mb-4" style={{ color: theme.colors.textPrimary }}>
                {group.title}
              </h2>
            )}
            <div
              className={group.layout === 'vertical' ? 'flex flex-col gap-4' : 'card-carousel'}
              style={gridStyle}
            >
              {group.cards.map((card, i) => (
                <motion.div
                  key={card.id}
                  className="flex flex-col"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  style={
                    group.layout === 'vertical'
                      ? undefined
                      : { gridColumn: `span ${Math.max(1, card.colSpan ?? 1)}` }
                  }
                >
                  {card.hotel ? (
                    // کارت کامل هتل — دقیقاً مثل کارت‌های «هتل‌های ویژه»
                    <HotelCard hotel={card.hotel} index={i} />
                  ) : (
                    <CardLink
                      card={card}
                      className="w-full card-lift flex-1 min-h-0"
                      style={{ minHeight: cardHeight }}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
