import { readLocal, writeLocal } from './safeStorage';

/** Poções favoritas do Laboratório (Vesca). Só por aparelho (localStorage), não vai para o save na nuvem. */
export const POTION_FAVORITES_KEY = 'soulmon:potionFavorites';

export function readPotionFavorites(): Set<string> {
  try {
    const raw = JSON.parse(readLocal(POTION_FAVORITES_KEY) ?? '[]');
    return new Set(Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : []);
  } catch { return new Set(); }
}

export function writePotionFavorites(ids: ReadonlySet<string>): void {
  try { writeLocal(POTION_FAVORITES_KEY, JSON.stringify([...ids])); } catch { /* sem storage: favorito vale só na sessão */ }
}

/** Devolve um novo conjunto com o id marcado ou desmarcado. */
export function toggleFavorite(favs: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(favs);
  if (next.has(id)) next.delete(id); else next.add(id);
  return next;
}

/** Favoritas primeiro; a ordem relativa de cada grupo é preservada (estável). */
export function favoritesFirst<T extends { id: string }>(list: readonly T[], favs: ReadonlySet<string>): T[] {
  return [...list.filter(r => favs.has(r.id)), ...list.filter(r => !favs.has(r.id))];
}
