import { useSyncExternalStore } from 'react';

/**
 * Tiny external store for the in-editor "Cards builder" panel open/close state.
 * Kept in its own module so both the toolbar (MasterVisualEditor) and the
 * Page Manager (PickerModals) can toggle it without creating a circular import.
 */
let _cardsOpen = false;
const _listeners = new Set<() => void>();

export function getCardsPanelOpen() {
  return _cardsOpen;
}

export function setCardsPanelOpen(v: boolean) {
  _cardsOpen = v;
  _listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  _listeners.add(cb);
  return () => {
    _listeners.delete(cb);
  };
}

export function useCardsPanelOpen() {
  return useSyncExternalStore(subscribe, getCardsPanelOpen, getCardsPanelOpen);
}
