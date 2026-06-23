import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CardGroup, SiteCard, SiteCardType } from '../types';

const STORAGE_KEY = 'mehrsafar-card-groups';

interface CardsContextType {
  groups: CardGroup[];
  addGroup: (page?: string) => string;
  updateGroup: (id: string, partial: Partial<CardGroup>) => void;
  removeGroup: (id: string) => void;
  moveGroup: (id: string, dir: -1 | 1) => void;
  addCard: (groupId: string, type?: SiteCardType) => void;
  addCardTo: (page: string, card: Omit<SiteCard, 'id'>) => void;
  updateCard: (groupId: string, cardId: string, partial: Partial<SiteCard>) => void;
  removeCard: (groupId: string, cardId: string) => void;
  moveCard: (groupId: string, cardId: string, dir: -1 | 1) => void;
}

const CardsContext = createContext<CardsContextType | undefined>(undefined);

const uid = () => Math.random().toString(36).slice(2, 10);

function load(): CardGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CardGroup[];
  } catch {
    /* noop */
  }
  return [];
}

export function CardsProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<CardGroup[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
    } catch {
      /* noop */
    }
  }, [groups]);

  const addGroup = (page: string = '/') => {
    const id = uid();
    setGroups((g) => [...g, { id, page, title: 'بخش جدید', layout: 'horizontal', cardHeight: 208, minCardWidth: 280, cards: [] }]);
    return id;
  };

  const updateGroup = (id: string, partial: Partial<CardGroup>) =>
    setGroups((g) => g.map((grp) => (grp.id === id ? { ...grp, ...partial } : grp)));

  const removeGroup = (id: string) => setGroups((g) => g.filter((grp) => grp.id !== id));

  const moveGroup = (id: string, dir: -1 | 1) =>
    setGroups((g) => {
      const i = g.findIndex((x) => x.id === id);
      if (i < 0) return g;
      // Page-aware reorder: only swap with the nearest group on the SAME page,
      // so reordering on one page never disturbs another page's sections.
      const pg = g[i].page ?? '/';
      let j = i + dir;
      while (j >= 0 && j < g.length && (g[j].page ?? '/') !== pg) j += dir;
      if (j < 0 || j >= g.length) return g;
      const next = [...g];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const addCard = (groupId: string, type: SiteCardType = 'banner') =>
    setGroups((g) =>
      g.map((grp) =>
        grp.id === groupId
          ? {
              ...grp,
              cards: [
                ...grp.cards,
                { id: uid(), type, title: 'کارت جدید', subtitle: '', image: '', link: '/' },
              ],
            }
          : grp
      )
    );

  const updateCard = (groupId: string, cardId: string, partial: Partial<SiteCard>) =>
    setGroups((g) =>
      g.map((grp) =>
        grp.id === groupId
          ? { ...grp, cards: grp.cards.map((c) => (c.id === cardId ? { ...c, ...partial } : c)) }
          : grp
      )
    );

  // Append a fully-populated card to a page. Uses the first existing group on
  // that page, or creates a new group if the page has none yet. Used by the
  // "add hotel" form to drop a hotel card onto a chosen page.
  const addCardTo = (page: string, card: Omit<SiteCard, 'id'>) =>
    setGroups((g) => {
      const newCard: SiteCard = { id: uid(), ...card };
      const idx = g.findIndex((grp) => (grp.page ?? '/') === page);
      if (idx >= 0) {
        return g.map((grp, i) => (i === idx ? { ...grp, cards: [...grp.cards, newCard] } : grp));
      }
      return [
        ...g,
        { id: uid(), page, title: '', layout: 'horizontal', cardHeight: 208, minCardWidth: 280, cards: [newCard] },
      ];
    });

  const removeCard = (groupId: string, cardId: string) =>
    setGroups((g) =>
      g.map((grp) =>
        grp.id === groupId ? { ...grp, cards: grp.cards.filter((c) => c.id !== cardId) } : grp
      )
    );

  const moveCard = (groupId: string, cardId: string, dir: -1 | 1) =>
    setGroups((g) =>
      g.map((grp) => {
        if (grp.id !== groupId) return grp;
        const i = grp.cards.findIndex((c) => c.id === cardId);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= grp.cards.length) return grp;
        const cards = [...grp.cards];
        [cards[i], cards[j]] = [cards[j], cards[i]];
        return { ...grp, cards };
      })
    );

  return (
    <CardsContext.Provider
      value={{ groups, addGroup, updateGroup, removeGroup, moveGroup, addCard, addCardTo, updateCard, removeCard, moveCard }}
    >
      {children}
    </CardsContext.Provider>
  );
}

export function useCards() {
  const ctx = useContext(CardsContext);
  if (!ctx) throw new Error('useCards must be used within CardsProvider');
  return ctx;
}
