import { spriteUrlOrNull } from './_artLine.js';

// Aviso de entrada nova na Biblioteca (01/11/2026): `libraryAck = { b, e, s }` = tamanhos de `bestiary`, `defeatedElements` e
// `strayPlayersSeen` na última abertura da Biblioteca. Espelho de FORMA de `sanitizeLibraryAck` (`src/utils/libraryNew.ts`):
// inteiros 0..100000. O corte pelo tamanho da lista e o "ausente = sem retroativo" são do cliente (hidratação).
// Nunca recusa o save: forma errada vira `undefined` (o campo é descartado).
export const LIBRARY_ACK_MAX = 100_000;
const ok = (v) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= LIBRARY_ACK_MAX;

export function sanitizeLibraryAck(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  if (!ok(raw.b) || !ok(raw.e) || !ok(raw.s)) return undefined;
  return { b: raw.b, e: raw.e, s: raw.s };
}

// Desgarrados vistos (§213): espelho de FORMA de `sanitizeStrayPlayersSeen` (`src/utils/strayPlayers.ts`), sem a allowlist de
// host do sprite (a do servidor é `spriteUrlOrNull`, aplicada aqui também).
export const STRAY_SEEN_MAX = 200;
const SID = /^[a-f0-9]{24}$/;
const STAGE = /^[A-Za-z0-9_.-]{1,40}$/;
const ELEMENT = /^[a-z][a-z0-9_-]{0,31}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function sanitizeStrayPlayersSeen(raw) {
  if (!Array.isArray(raw)) return undefined;
  const out = [];
  for (const v of raw) {
    if (!v || typeof v !== 'object' || typeof v.sid !== 'string' || !SID.test(v.sid) || out.some(o => o.sid === v.sid)) continue;
    const item = { sid: v.sid, stage: typeof v.stage === 'string' && STAGE.test(v.stage) ? v.stage : 'rookie' };
    const sprite = spriteUrlOrNull(v.spriteUrl);
    if (sprite) item.spriteUrl = sprite;
    if (typeof v.element === 'string' && ELEMENT.test(v.element)) item.element = v.element;
    item.at = typeof v.at === 'string' && DAY.test(v.at) ? v.at : '1970-01-01';
    out.push(item);
    if (out.length >= STRAY_SEEN_MAX) break;
  }
  return out;
}
