// Vista do HISTÓRICO de temporadas do Torneio (pílula "Última temporada" + modal). Puro: o servidor
// (`functions/api/_seasonHist.js`) é a autoridade da colocação; aqui só se junta, ordena e escreve.
import type { SeasonHistory, SeasonHistoryEntry } from './community';

type Lang = 'pt-BR' | 'en-US';

/** "1º" no PT; "1st / 2nd / 3rd / 4th / 11th / 21st" no EN. */
export function placeLabel(place: number, language: Lang): string {
  if (language === 'pt-BR') return `${place}º`;
  const r100 = place % 100;
  const r10 = place % 10;
  const suf = r100 >= 11 && r100 <= 13 ? 'th' : r10 === 1 ? 'st' : r10 === 2 ? 'nd' : r10 === 3 ? 'rd' : 'th';
  return `${place}${suf}`;
}

/** "2026-10" → "Outubro de 2026" / "October 2026". A temporada é o mês em UTC, então o formato também. */
export function seasonMonthLabel(season: string, language: Lang): string {
  const m = /^(\d{4})-(\d{2})$/.exec(season);
  if (!m) return season;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1));
  const txt = d.toLocaleDateString(language, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return txt.charAt(0).toUpperCase() + txt.slice(1); // PT vem em minúscula ("outubro de 2026"); só a 1ª letra sobe, o "de" fica
}

/** Chave (YYYY-MM, UTC) da temporada do mês anterior — a "última temporada". */
export function prevSeasonKey(now: Date = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
}

/** Janela do histórico: temporadas que terminaram há no máximo 120 dias (mesma regra do servidor). */
export const HIST_WINDOW_DAYS = 120;
export function dentroDaJanela(season: string, now: number = Date.now()): boolean {
  const m = /^(\d{4})-(\d{2})$/.exec(season);
  return !!m && Date.UTC(Number(m[1]), Number(m[2]), 1) >= now - HIST_WINDOW_DAYS * 86400000;
}

export interface SeasonHistoryView {
  /** Mais recente primeiro. */
  seasons: SeasonHistoryEntry[];
  best: { season: string; place: number } | null;
  /** Colocação na temporada do mês anterior; `null` = não jogou (ou o dado já venceu). */
  lastPlace: number | null;
}

/**
 * Vista do histórico do servidor, só da janela de 120 dias (dono, 06/11/2026). Os troféus do save NÃO entram.
 * `prevSeason` = mês anterior (`SeasonHistory.lastSeason`).
 */
export function buildSeasonHistoryView(
  hist: SeasonHistory | null,
  _trophies: ReadonlyArray<{ season: string; place: number }>,
  prevSeason: string,
  now: number = Date.now(),
): SeasonHistoryView {
  const map = new Map<string, SeasonHistoryEntry>();
  if (hist?.excluded) return { seasons: [], best: null, lastPlace: null };
  // Só o servidor conta, e só a janela de 120 dias (dono, 06/11/2026): troféu antigo do save não entra no cálculo.
  for (const s of hist?.seasons ?? []) if (dentroDaJanela(s.season, now)) map.set(s.season, s);
  const seasons = [...map.values()].sort((a, b) => (a.season < b.season ? 1 : a.season > b.season ? -1 : 0));
  let best: SeasonHistoryView['best'] = null;
  for (const s of seasons) if (!best || s.place < best.place) best = { season: s.season, place: s.place };
  return { seasons, best, lastPlace: map.get(hist?.lastSeason ?? prevSeason)?.place ?? null };
}
