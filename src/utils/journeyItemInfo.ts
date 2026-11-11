import type { JourneyItem } from './focusJourney';
import { MATERIALS } from './buildingQuestsCopy';
import { essenceName } from './essences';
import { materialIconSrc } from './materialIcons';

export interface JourneyItemInfo { name: string; /** Emoji/glifo de reserva. */ glyph: string; /** Imagem, quando existe. */ src?: string; qty: number }

/** Nome, ícone e quantidade de um item achado na jornada (bolsa, tooltip e animação). */
export function journeyItemInfo(it: JourneyItem, isPt: boolean): JourneyItemInfo {
  if (it.kind === 'food') return { name: isPt ? 'Comida' : 'Food', glyph: it.id, qty: it.qty };
  if (it.kind === 'essence') return { name: essenceName(it.id, isPt), glyph: '💠', qty: it.qty };
  const m = MATERIALS.find(x => x.id === it.id);
  return { name: m ? (isPt ? m.namePt : m.nameEn) : it.id, glyph: m?.icon ?? '❔', src: materialIconSrc(it.id), qty: it.qty };
}

const keyOf = (it: JourneyItem) => `${it.kind}:${it.id}`;
/** Soma por tipo e id (a ordem de chegada se mantém). */
export function mergeItems(list: readonly JourneyItem[], add: readonly JourneyItem[]): JourneyItem[] {
  const out = list.map(x => ({ ...x }));
  for (const it of add) {
    const hit = out.find(x => keyOf(x) === keyOf(it));
    if (hit) hit.qty += it.qty; else out.push({ ...it });
  }
  return out;
}
export const totalQty = (list: readonly JourneyItem[]): number => list.reduce((n, x) => n + x.qty, 0);
