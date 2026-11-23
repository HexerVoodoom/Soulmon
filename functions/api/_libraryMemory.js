import { spriteUrlOrNull } from './_artLine.js';

// Memória da Biblioteca no save (10/11/2026): `librarySeen` (ids de jogadores já vistos, filtro H17) e `libraryForms` (formas já vistas
// de cada um). Espelhos de FORMA de `sanitizeSeenIds` (`src/utils/librarySeen.ts`) e `sanitizeFormsMap` (`src/utils/libraryForms.ts`),
// com a allowlist de sprite do servidor (`spriteUrlOrNull`). Nunca recusa o save: forma errada vira `undefined` (campo descartado).
export const SEEN_MAX = 500;
export const FORMS_PLAYERS_MAX = 500;
export const FORMS_PER_PLAYER_MAX = 8;
const ID_JOGADOR = /^[A-Za-z0-9_.:-]{1,64}$/;
const ID_ESTAGIO = /^[A-Za-z0-9_.-]{1,40}$/;
const ID_ELEMENTO = /^[a-z][a-z0-9_-]{0,31}$/;
const ORDEM = { rookie: 0, champion: 1, ultimate: 2, mega: 3, ultra: 4 };
const baseOf = (stage) => stage.split('-')[0];

export function sanitizeLibrarySeen(raw) {
  if (!Array.isArray(raw)) return undefined;
  const out = [];
  const set = new Set();
  for (const x of raw) {
    if (typeof x !== 'string' || !ID_JOGADOR.test(x) || set.has(x)) continue;
    set.add(x);
    out.push(x);
  }
  return out.length > SEEN_MAX ? out.slice(-SEEN_MAX) : out;
}

function sanitizeForm(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (typeof raw.stage !== 'string' || !ID_ESTAGIO.test(raw.stage)) return null;
  const url = typeof raw.spriteUrl === 'string' && !raw.spriteUrl.startsWith('data:') ? spriteUrlOrNull(raw.spriteUrl) : null;
  const element = typeof raw.element === 'string' && ID_ELEMENTO.test(raw.element) ? raw.element : null;
  const date = Number.isFinite(raw.date) && raw.date > 0 ? Math.floor(raw.date) : 0;
  return { stage: raw.stage, spriteUrl: url, element, date };
}

// Mesma regra de `mergeForms([], forms)` do cliente: dedupe (estágio + URL; fica a data mais antiga e o 1º elemento), ordena, limita.
function mergeForms(forms) {
  const acc = [];
  for (const r of forms) {
    const f = sanitizeForm(r);
    if (!f) continue;
    const i = acc.findIndex(x => x.stage === f.stage && (x.spriteUrl ?? '') === (f.spriteUrl ?? ''));
    if (i < 0) { acc.push(f); continue; }
    const cur = acc[i];
    acc[i] = { ...cur, date: cur.date && f.date ? Math.min(cur.date, f.date) : (cur.date || f.date), element: cur.element ?? f.element };
  }
  acc.sort((a, b) => ((ORDEM[baseOf(a.stage)] ?? 9) - (ORDEM[baseOf(b.stage)] ?? 9)) || (a.date - b.date) || a.stage.localeCompare(b.stage));
  return acc.slice(0, FORMS_PER_PLAYER_MAX);
}

export function sanitizeLibraryForms(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const out = {};
  let n = 0;
  for (const [id, forms] of Object.entries(raw)) {
    if (!ID_JOGADOR.test(id) || !Array.isArray(forms)) continue;
    const m = mergeForms(forms);
    if (!m.length) continue;
    out[id] = m;
    if (++n >= FORMS_PLAYERS_MAX) break;
  }
  return out;
}
