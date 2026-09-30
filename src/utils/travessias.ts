/**
 * TRAVESSIAS (Crossings) e o PASSEIO — a lógica. Funções PURAS: sem React, sem
 * `localStorage`, sem relógio (o `dayKey` vem por parâmetro). Um dono por regra.
 *
 * Decisão do dono (30/09/2026, `docs/REGISTRO-DE-DECISOES.md` §5.6); condições
 * em `docs/reviews/2026-09-30-missoes/` e `docs/reviews/2026-09-30-exploracao/`.
 * Tipos e constantes: `types/travessias.ts` (dono único). Catálogo:
 * `data/travessiasCatalog.ts`.
 *
 * O que este arquivo garante (e o que os testes travam):
 *  - A Travessia é opt-in, sem prazo e sem data: a ativa não envelhece, e o
 *    "Fiz" guardado (`pending`) nunca expira.
 *  - "Trocar" escolhe entre os MESMOS três desafios da região (os do
 *    catálogo): nada aqui sorteia desafio.
 *  - No máximo `REGIONS_OPENED_PER_DAY` região se abre por noite, e só na
 *    noite (`settleNight`) — o "Fiz" não abre nada na hora (linha vermelha
 *    R-32, psicologia R-1).
 *  - O progresso é só no mapa: nada aqui toca HP, energia, meta, `perfectDays`,
 *    evolução, Vínculo, missões, Bits ou Emblemas — e nenhum desses módulos
 *    importa este (contrato `travessias.contract.test.ts`).
 *  - O Passeio sai todo dia, com ou sem Travessia; em casa ele é EXATAMENTE a
 *    Aventura comum (o catálogo comum continua 100% alcançável — R-33).
 */
import {
  HOME_REGION, PASSEIO_REGION_FIND_CHANCE, REGIONS_OPENED_PER_DAY,
  type CrossingChallenge, type CrossingsState, type Region, type RegionFind, type RegionId,
} from '../types/travessias';
import { REGIONS } from '../data/travessiasCatalog';
import { adventureOfDay, findById, type AdventureEntry, type AdventureFind } from './adventure';
import { hashString, mulberry32 } from './oracle';

export { normalizeCrossings, REGION_IDS, isRegionId, crossingsTouchMap } from './travessiasSave';

export const regionById = (id: RegionId): Region | undefined => REGIONS.find(r => r.id === id);

export const isRegionOpen = (s: CrossingsState, id: RegionId): boolean =>
  id === HOME_REGION || s.opened.some(o => o.region === id);

/** Casa primeiro, depois as abertas na ordem em que abriram. */
export function openRegions(s: CrossingsState): Region[] {
  const ids: RegionId[] = [HOME_REGION, ...s.opened.map(o => o.region).filter(id => id !== HOME_REGION)];
  return ids.map(regionById).filter((r): r is Region => !!r);
}

/** Regiões ainda em névoa (nem abertas nem com "Fiz" guardado), na ordem do catálogo. */
export function mistRegions(s: CrossingsState): Region[] {
  return REGIONS.filter(r => !isRegionOpen(s, r.id) && !s.pending.includes(r.id));
}

/** Os 3 desafios da região — os do catálogo, sempre os mesmos (não há sorteio). */
export const offerFor = (region: Region): readonly CrossingChallenge[] => region.challenges;

/** O desafio ativo resolvido no catálogo (ou null, se o id sumiu numa versão futura). */
export function activeChallenge(s: CrossingsState): { region: Region; challenge: CrossingChallenge } | null {
  if (!s.active) return null;
  const region = regionById(s.active.region);
  const id = s.active.challenge;
  const challenge = region?.challenges.find(c => c.id === id) ?? null;
  return region && challenge ? { region, challenge } : null;
}

/**
 * Escolhe uma Travessia. Só para região em névoa (não aberta, sem "Fiz"
 * guardado) e só entre os desafios DELA. Substitui a ativa — trocar não custa
 * nada. Qualquer pedido inválido devolve o MESMO estado.
 */
export function pickCrossing(s: CrossingsState, regionId: RegionId, challengeId: string): CrossingsState {
  if (isRegionOpen(s, regionId) || s.pending.includes(regionId)) return s;
  const region = regionById(regionId);
  if (!region || !region.challenges.some(c => c.id === challengeId)) return s;
  if (s.active?.region === regionId && s.active.challenge === challengeId) return s;
  return { ...s, active: { region: regionId, challenge: challengeId } };
}

/** "Deixar pra lá": sem custo, sem marca. */
export const dropCrossing = (s: CrossingsState): CrossingsState =>
  s.active === null ? s : { ...s, active: null };

/**
 * "Fiz": a ativa vira `pending` (sem data — nunca expira) e sai de cena. Não
 * abre nada agora: a região abre na próxima noite (`settleNight`). Idempotente.
 */
export function markDone(s: CrossingsState): CrossingsState {
  if (!s.active) return s;
  const { region } = s.active;
  if (isRegionOpen(s, region) || s.pending.includes(region)) return { ...s, active: null };
  return { ...s, active: null, pending: [...s.pending, region] };
}

/**
 * A NOITE `dayKey`: se nenhuma região abriu nesta noite e há "Fiz" guardado,
 * abre o mais antigo. `arrived` é a região que chegou NESTA noite (a mesma a
 * cada chamada). Idempotente: a 2ª chamada no mesmo dia devolve o MESMO objeto
 * `state` (footgun 6 — updater que roda 2× não pode abrir duas regiões).
 */
export function settleNight(s: CrossingsState, dayKey: string): { state: CrossingsState; arrived: RegionId | null } {
  const nestaNoite = s.opened.filter(o => o.day === dayKey);
  if (nestaNoite.length >= REGIONS_OPENED_PER_DAY || s.pending.length === 0) {
    return { state: s, arrived: nestaNoite[0]?.region ?? null };
  }
  const [region, ...rest] = s.pending;
  if (isRegionOpen(s, region)) {
    // Save antigo inconsistente: descarta a pendência duplicada e tenta a próxima.
    return settleNight({ ...s, pending: rest }, dayKey);
  }
  return {
    state: { ...s, pending: rest, opened: [...s.opened, { region, day: dayKey }] },
    arrived: region,
  };
}

/** Para onde o pet passeia. Só região aberta; casa (ou null) guarda `null`. */
export function setDestination(s: CrossingsState, region: RegionId | null): CrossingsState {
  const next = region === null || region === HOME_REGION ? null : region;
  if (next !== null && !isRegionOpen(s, next)) return s;
  return next === s.destination ? s : { ...s, destination: next };
}

/** Esconde/mostra a camada de Travessias. O Passeio continua funcionando. */
export const setHidden = (s: CrossingsState, hidden: boolean): CrossingsState =>
  s.hidden === hidden ? s : { ...s, hidden };

/** O achado da noite: um da Aventura comum ou um postal de região (`trv-*`). */
export type PasseioFind = AdventureFind | RegionFind;

/** Resolve qualquer id do diário: o catálogo comum primeiro, depois os `trv-*`. */
export function findAnyById(id: string): PasseioFind | undefined {
  const comum = findById(id);
  if (comum) return comum;
  for (const r of REGIONS) {
    if (r.arrival.id === id) return r.arrival;
    const f = r.finds.find(x => x.id === id);
    if (f) return f;
  }
  return undefined;
}

/**
 * O ACHADO DA NOITE, fundido (Passeio + Aventura). Determinístico por `dayKey`
 * e nunca vazio:
 *  1. já guardado nesta noite → é ele (reabrir não re-sorteia);
 *  2. uma região ABRIU nesta noite → a cena de chegada dela;
 *  3. destino = região aberta ≠ casa → com `PASSEIO_REGION_FIND_CHANCE`, um
 *     achado exclusivo dela ainda não coletado;
 *  4. senão (e sempre em casa) → exatamente `adventureOfDay`.
 * `crossings` deve ser o estado JÁ assentado pela noite (`settleNight`).
 */
export function passeioFindOfDay(args: {
  crossings: CrossingsState;
  entries: readonly AdventureEntry[];
  feito: number;
  meta: number;
  dayKey: string;
}): PasseioFind {
  const { crossings: c, entries, feito, meta, dayKey } = args;

  const daNoite = entries.find(e => e.day === dayKey);
  const ja = daNoite ? findAnyById(daNoite.id) : undefined;
  if (ja) return ja;

  const antes = entries.filter(e => e.day !== dayKey).map(e => e.id);

  const chegou = c.opened.find(o => o.day === dayKey);
  const regiaoNova = chegou ? regionById(chegou.region) : undefined;
  if (regiaoNova) return regiaoNova.arrival;

  const dest = c.destination;
  if (dest && dest !== HOME_REGION && isRegionOpen(c, dest)) {
    const r = regionById(dest);
    if (r) {
      const seed = hashString(`passeio:${dayKey}:${dest}`);
      if (mulberry32(seed >>> 0)() < PASSEIO_REGION_FIND_CHANCE) {
        const tem = new Set(antes);
        const livres = r.finds.filter(f => !tem.has(f.id));
        if (livres.length > 0) {
          const i = Math.floor(mulberry32((seed ^ 0x85ebca6b) >>> 0)() * livres.length) % livres.length;
          return livres[i];
        }
      }
    }
  }

  return adventureOfDay(antes, feito, meta, dayKey);
}
