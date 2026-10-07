import catalogo from '../assets/avatares/catalogo.json';

/** Rótulos de domínio (grupo do catálogo) PT/EN. Alt do avatar: EN = descrição do catálogo (`en`, padrão); PT = slug legível. */
export const AVATAR_GROUPS: Record<string, { pt: string; en: string }> = {
  ativo: { pt: 'Personagens', en: 'Characters' }, extra: { pt: 'Extras', en: 'Extras' },
  agua: { pt: 'Água', en: 'Water' }, akasha: { pt: 'Akasha', en: 'Akasha' }, ar: { pt: 'Ar', en: 'Air' },
  campina: { pt: 'Campina', en: 'Meadow' }, cavernas: { pt: 'Cavernas', en: 'Caves' }, deserto: { pt: 'Deserto', en: 'Desert' },
  floresta: { pt: 'Floresta', en: 'Forest' }, fogo: { pt: 'Fogo', en: 'Fire' }, gelo: { pt: 'Gelo', en: 'Ice' },
  industrial: { pt: 'Industrial', en: 'Industrial' }, luz: { pt: 'Luz', en: 'Light' }, oceano: { pt: 'Oceano', en: 'Ocean' },
  pantano: { pt: 'Pântano', en: 'Swamp' }, picos: { pt: 'Picos', en: 'Peaks' }, planta: { pt: 'Planta', en: 'Plant' },
  sombra: { pt: 'Sombra', en: 'Shadow' }, terra: { pt: 'Terra', en: 'Earth' },
};

export interface AvatarEntry { id: string; g: string; n: string; /** descrição EN (padrão/fallback) */ en: string }
export const AVATAR_CATALOG = catalogo as AvatarEntry[];

/** EN primeiro: o alt/nome é a descrição EN do catálogo; PT-BR é localização derivada do slug do arquivo. */
export function avatarAlt(e: AvatarEntry, _index: number, isPt: boolean): string {
  if (isPt) { const t = e.n.replace(/-/g, ' '); return t.charAt(0).toUpperCase() + t.slice(1); }
  return e.en;
}
