/**
 * TRAVESSIAS — o pedaço do SAVE que não precisa do catálogo.
 *
 * Mora separado de `utils/travessias.ts` por causa do orçamento de bytes
 * (`src/deploy/orcamentoDeBytes.contract.test.ts`): o `GameStateContext` e o
 * `App` estão no chunk de entrada, e o catálogo das regiões (texto EN + PT de
 * oito reinos) não pode ir junto. Aqui fica só o que o load e a Home precisam
 * — a higienização e a pergunta "este save já mexeu no mapa?" —, e
 * `utils/travessias.ts` reexporta tudo, então a regra continua tendo UM dono.
 *
 * O save guarda só ids, enum e `dayKey` (parecer de menores e marca, 04 R-4):
 * nada de texto livre, lugar, foto ou pessoa. A higienização descarta o que
 * não for isso.
 */
import { CROSSINGS_EMPTY, HOME_REGION, type CrossingsState, type RegionId } from '../types/travessias';

/**
 * Os oito reinos, na ordem da bíblia (§7.2). É a lista de valores do tipo
 * `RegionId` — há teste conferindo que bate, um a um, com o catálogo.
 */
export const REGION_IDS: readonly RegionId[] = [
  'campina', 'floresta', 'oceano', 'deserto', 'picos', 'pantano', 'cavernas', 'gelo',
];

export const isRegionId = (v: unknown): v is RegionId =>
  typeof v === 'string' && (REGION_IDS as readonly string[]).includes(v);

/** `AAAA-MM-DD` — o formato do dia do jogador. Qualquer outra coisa é lixo. */
const isDayKey = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Id de desafio: só o formato de id do catálogo (nunca texto livre no save). */
const isChallengeId = (v: unknown): v is string => typeof v === 'string' && /^[a-z0-9-]{1,64}$/.test(v);

/**
 * Tolera ausência e lixo, nunca derruba o load: é camada opcional, e perder
 * uma linha dela vale infinitamente menos que perder o save. Casa nunca entra
 * em `opened` (é implícita), região repetida fica só na PRIMEIRA abertura, e
 * `pending` nunca repete nem inclui região já aberta.
 */
export function normalizeCrossings(raw: unknown): CrossingsState {
  if (!raw || typeof raw !== 'object') return CROSSINGS_EMPTY;
  const r = raw as Record<string, unknown>;

  const opened: CrossingsState['opened'] = [];
  const vistas = new Set<RegionId>([HOME_REGION]);
  for (const e of Array.isArray(r.opened) ? r.opened : []) {
    const o = (e ?? {}) as Record<string, unknown>;
    if (!isRegionId(o.region) || !isDayKey(o.day) || vistas.has(o.region)) continue;
    vistas.add(o.region);
    opened.push({ region: o.region, day: o.day });
  }

  const pending: RegionId[] = [];
  for (const p of Array.isArray(r.pending) ? r.pending : []) {
    if (!isRegionId(p) || vistas.has(p)) continue;
    vistas.add(p);
    pending.push(p);
  }

  const a = (r.active ?? null) as Record<string, unknown> | null;
  const active = a && typeof a === 'object' && isRegionId(a.region) && isChallengeId(a.challenge)
    && !vistas.has(a.region)
    ? { region: a.region, challenge: a.challenge }
    : null;

  const aberta = (id: RegionId) => id === HOME_REGION || opened.some(o => o.region === id);
  const destination = isRegionId(r.destination) && r.destination !== HOME_REGION && aberta(r.destination)
    ? r.destination : null;

  return { opened, active, pending, destination, hidden: r.hidden === true };
}

/**
 * Este save já mexeu no mapa? Sem região aberta nem "Fiz" guardado, o achado
 * da noite é EXATAMENTE a Aventura comum — e o `App` nem precisa carregar o
 * catálogo das regiões para saber disso.
 */
export const crossingsTouchMap = (c: CrossingsState): boolean =>
  c.opened.length > 0 || c.pending.length > 0;
