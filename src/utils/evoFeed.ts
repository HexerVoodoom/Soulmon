/**
 * FAIXA DE EVOLUÇÕES, lado do cliente (04/11/2026): o texto da frase, a limpeza do que o servidor devolve (`functions/api/_evoFeed.js`) e a
 * fila (sem repetir). Puro: sem React, sem rede, sem relógio próprio. A frase é montada AQUI com listas fechadas — nunca HTML do servidor.
 */
/** `local`: o aviso da própria evolução, nascido no aparelho (não move a marca do que já foi visto no feed). */
export interface EvoEvent { name: string; pet: string; tier: string; branch: string | null; at: number; local?: boolean }

/** Aviso mais velho que isto não é "acabou de evoluir": não entra na faixa. */
export const EVO_MAX_AGE_MS = 60 * 60 * 1000;

const TIERS = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'] as const;
const BRANCH_PT: Record<string, string> = { power: 'do Poder', harmony: 'da Harmonia', benevolence: 'da Benevolência' };
const BRANCH_EN: Record<string, string> = { power: 'Power', harmony: 'Harmony', benevolence: 'Benevolence' };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const clean = (v: unknown, max: number): string => (typeof v === 'string' ? v.replace(/\p{C}/gu, '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max) : '');

/** `champion-harmony` → `{ tier, branch }`; fora da lista → `null`. */
export function parseEvoStage(id: unknown): { tier: string; branch: string | null } | null {
  if (typeof id !== 'string') return null;
  const [tier, branch, ...rest] = id.split('-');
  if (!(TIERS as readonly string[]).includes(tier) || rest.length) return null;
  if (branch !== undefined && !(branch in BRANCH_EN)) return null;
  return { tier, branch: branch ?? null };
}

/** O estágio novo é uma evolução (Champion ou mais, tier maior)? */
export function isEvoStep(prev: unknown, next: unknown): boolean {
  const a = parseEvoStage(prev); const b = parseEvoStage(next);
  if (!a || !b) return false;
  const ia = TIERS.indexOf(a.tier as typeof TIERS[number]); const ib = TIERS.indexOf(b.tier as typeof TIERS[number]);
  return ib >= 1 && ib > ia;
}

/** Sanea a resposta do servidor: descarta o que não é evento válido. */
export function sanitizeEvoEvents(raw: unknown): EvoEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: EvoEvent[] = [];
  for (const e of raw.slice(0, 20)) {
    if (!e || typeof e !== 'object') continue;
    const o = e as Record<string, unknown>;
    const name = clean(o.name, 32); const pet = clean(o.pet, 32);
    const tier = typeof o.tier === 'string' && (TIERS as readonly string[]).includes(o.tier) && o.tier !== 'rookie' ? o.tier : '';
    const branch = typeof o.branch === 'string' && o.branch in BRANCH_EN ? o.branch : null;
    const at = Number(o.at);
    if (!name || !pet || !tier || !Number.isFinite(at)) continue;
    out.push({ name, pet, tier, branch, at });
  }
  return out;
}

/** O que do feed ainda vale mostrar: mais novo que o último visto (a faixa não repete a cada abertura), recente, e não a própria conta (o aviso local já mostrou). */
export function freshEvoEvents(events: readonly EvoEvent[], lastSeenAt: number, now: number, ownName?: string): EvoEvent[] {
  return events.filter((e) => e.at > lastSeenAt && now - e.at <= EVO_MAX_AGE_MS && e.name !== ownName);
}

export const evoKey = (e: EvoEvent) => `${e.name}|${e.pet}|${e.tier}|${e.branch ?? ''}`;

/** "Mateus acabou de evoluir Sombra para o nível Champion através da Harmonia". */
export function evoText(e: EvoEvent, isPt: boolean): string {
  const tier = cap(e.tier);
  if (isPt) return `${e.name} acabou de evoluir ${e.pet} para o nível ${tier}${e.branch ? ` através ${BRANCH_PT[e.branch]}` : ''}`;
  return `${e.name} just evolved ${e.pet} to the ${tier} level${e.branch ? ` through ${BRANCH_EN[e.branch]}` : ''}`;
}

/** Acrescenta à fila os eventos ainda não vistos (chave = jogador+criatura+forma: o aviso local e o do servidor não duplicam). */
export function enqueueEvo(queue: readonly EvoEvent[], seen: ReadonlySet<string>, incoming: readonly EvoEvent[]): { queue: EvoEvent[]; seen: Set<string> } {
  const nextSeen = new Set(seen); const q = [...queue];
  for (const e of [...incoming].sort((a, b) => a.at - b.at)) {
    const k = evoKey(e);
    if (nextSeen.has(k)) continue;
    nextSeen.add(k); q.push(e);
  }
  return { queue: q.slice(-10), seen: nextSeen };
}
