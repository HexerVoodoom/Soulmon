/**
 * FORMAS JÁ VISTAS dos Soulmons de outros jogadores (31/10/2026, pedido do dono: "tocar nele e ver todas as formas que
 * eu já encontrei, e não só a atual"). Dono único do histórico local: `{ [idDoJogador]: SeenForm[] }`, no aparelho (como
 * `librarySeen.ts`: chave `STORAGE_KEYS.LIBRARY_FORMS`, não é progresso, não pontua, NÃO vai no save em nuvem — sem campo novo
 * em `GameState`, então nada para o `hydrateSave`/servidor sanitizar). Quem MORA no servidor é o histórico DO AMIGO
 * (`community.js?action=forms`, derivado de `spriteLibrary.sprites` do save dele); aqui se junta os dois sem duplicar.
 *
 * Regras: dedupe por (estágio + URL), no máximo MAX_FORMS_PER_PLAYER por criatura (as mais antigas por ordem de estágio/data
 * ficam, as excedentes mais novas do mesmo estágio saem), URL só de host permitido (`isSafeSpriteSrc`, a mesma guarda de
 * `HOSTS_DE_SPRITE`; `data:` não é guardado — pesaria o localStorage) e leitura tolerante a lixo. Migração: quem já estava
 * em `LIBRARY_SEEN` e não tem histórico ganha 1 forma (a atual) na próxima vez que a Biblioteca carrega o perfil dele.
 */
import { readJson, writeJson } from './safeStorage';
import { STORAGE_KEYS } from './storageKeys';
import { isSafeSpriteSrc } from './spriteLibrary';

export interface SeenForm {
  /** Id da forma: 'rookie' | '{champion|ultimate|mega}-{power|harmony|benevolence}' | 'ultra'. */
  stage: string;
  /** URL do sprite próprio (host permitido) ou `null` = arte da linha do jogador. */
  spriteUrl: string | null;
  element: string | null;
  /** Epoch ms da 1ª vez que a pessoa viu esta forma (ou, vinda do servidor, quando a forma ganhou arte). */
  date: number;
}

export const MAX_FORMS_PER_PLAYER = 8;
const ID_ESTAGIO = /^[A-Za-z0-9_.-]{1,40}$/;
const ID_ELEMENTO = /^[a-z][a-z0-9_-]{0,31}$/;
const ORDEM: Record<string, number> = { rookie: 0, champion: 1, ultimate: 2, mega: 3, ultra: 4 };
const baseOf = (stage: string) => stage.split('-')[0];

/** Uma forma crua (storage, servidor, perfil) -> `SeenForm` segura, ou `null`. */
export function sanitizeForm(raw: unknown): SeenForm | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.stage !== 'string' || !ID_ESTAGIO.test(r.stage)) return null;
  const url = typeof r.spriteUrl === 'string' && !r.spriteUrl.startsWith('data:') && isSafeSpriteSrc(r.spriteUrl) ? r.spriteUrl : null;
  const element = typeof r.element === 'string' && ID_ELEMENTO.test(r.element) ? r.element : null;
  const date = Number.isFinite(r.date) && (r.date as number) > 0 ? Math.floor(r.date as number) : 0;
  return { stage: r.stage, spriteUrl: url, element, date };
}

const sameForm = (a: SeenForm, b: SeenForm) => a.stage === b.stage && (a.spriteUrl ?? '') === (b.spriteUrl ?? '');

/** Ordem de exibição: estágio (rookie→ultra), depois data. */
export function sortForms(forms: readonly SeenForm[]): SeenForm[] {
  return [...forms].sort((a, b) => ((ORDEM[baseOf(a.stage)] ?? 9) - (ORDEM[baseOf(b.stage)] ?? 9)) || (a.date - b.date) || a.stage.localeCompare(b.stage));
}

/**
 * Junta `incoming` em `existing` SEM duplicar (mesma forma = mesmo estágio + URL; fica a data mais antiga e o elemento já
 * conhecido), higieniza tudo, ordena e limita. Pura e idempotente: `merge(merge(a,b),b)` == `merge(a,b)`.
 */
export function mergeForms(existing: readonly unknown[], incoming: readonly unknown[]): SeenForm[] {
  const acc: SeenForm[] = [];
  for (const raw of [...existing, ...incoming]) {
    const f = sanitizeForm(raw);
    if (!f) continue;
    const i = acc.findIndex(x => sameForm(x, f));
    if (i < 0) { acc.push(f); continue; }
    const cur = acc[i];
    acc[i] = { ...cur, date: cur.date && f.date ? Math.min(cur.date, f.date) : (cur.date || f.date), element: cur.element ?? f.element };
  }
  return sortForms(acc).slice(0, MAX_FORMS_PER_PLAYER);
}

/** O mapa inteiro, lido com defesa (lixo vira `{}`). */
export function readAllForms(): Record<string, SeenForm[]> {
  const v = readJson<unknown>(STORAGE_KEYS.LIBRARY_FORMS, {});
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  const out: Record<string, SeenForm[]> = {};
  for (const [id, forms] of Object.entries(v as Record<string, unknown>)) {
    if (!Array.isArray(forms)) continue;
    const m = mergeForms([], forms);
    if (m.length) out[id] = m;
  }
  return out;
}

export const readFormsOf = (id: string): SeenForm[] => readAllForms()[id] ?? [];

/** Grava as formas vistas de `id` (junta com o que já havia). Devolve a lista resultante; no-op se nada mudou. */
export function recordForms(id: string | null | undefined, incoming: readonly unknown[]): SeenForm[] {
  if (!id || typeof id !== 'string') return [];
  const all = readAllForms();
  const before = all[id] ?? [];
  const next = mergeForms(before, incoming);
  if (JSON.stringify(next) !== JSON.stringify(before)) writeJson(STORAGE_KEYS.LIBRARY_FORMS, { ...all, [id]: next });
  return next;
}

const STAGE_PT: Record<string, string> = { rookie: 'Iniciante', champion: 'Campeão', ultimate: 'Supremo', mega: 'Mega', ultra: 'Ultra' };
const STAGE_EN: Record<string, string> = { rookie: 'Rookie', champion: 'Champion', ultimate: 'Ultimate', mega: 'Mega', ultra: 'Ultra' };
const PATH_PT: Record<string, string> = { power: 'Poder', harmony: 'Harmonia', benevolence: 'Benevolência' };
const PATH_EN: Record<string, string> = { power: 'Power', harmony: 'Harmony', benevolence: 'Benevolence' };

/** Nome do estágio de uma forma (PT/EN), com o caminho quando há ('Champion · Power'). Id desconhecido volta como veio. */
export function formStageLabel(stage: string, isPt: boolean): string {
  const [base, path] = stage.split('-');
  const nome = (isPt ? STAGE_PT : STAGE_EN)[base] ?? stage;
  const caminho = path ? (isPt ? PATH_PT : PATH_EN)[path] : undefined;
  return caminho ? `${nome} · ${caminho}` : nome;
}

/** É a forma ATUAL (mesmo estágio e mesma arte)? */
export const isCurrentForm = (f: SeenForm, current: SeenForm | null): boolean => !!current && sameForm(f, current);
