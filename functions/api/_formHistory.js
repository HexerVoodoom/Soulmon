// Histórico de FORMAS de um Soulmon, derivado do SAVE no KV (`state.spriteLibrary.sprites[<formId>] = { url, at }`).
// O servidor já guardava as formas passadas (uma entrada por forma que ganhou sprite próprio), então não há campo novo:
// o endpoint `action=forms` de `community.js` só LÊ e filtra. Dono único da regra; só sai `{stage, spriteUrl, element, date}`
// — nada de nome do dono, save id, prompt ou outro dado pessoal. Toda URL passa por `spriteUrlOrNull` (mesma allowlist de hosts).
import { spriteUrlOrNull } from './_artLine.js';

export const MAX_FORMAS = 8;
const ORDEM = { rookie: 0, champion: 1, ultimate: 2, mega: 3, ultra: 4 };
const ID_FORMA = /^(rookie|ultra|(?:champion|ultimate|mega)-(?:power|harmony|benevolence))$/;
const ELEMENTO = /^[a-z][a-z0-9_-]{0,31}$/;

/** Estágio ('rookie'|'champion'|'ultimate'|'mega'|'ultra') de um id de forma. */
export const estagioDaForma = (formId) => String(formId).split('-')[0];

/**
 * @param {unknown} rawState save já parseado
 * @param {unknown} element elemento atual do perfil público (o elemento é da criatura, igual em todas as formas)
 * @returns {{stage:string, formId:string, spriteUrl:string, element:string|null, date:number}[]} ordenado por estágio e data, ≤ MAX_FORMAS
 */
export function formsFromSaveState(rawState, element) {
  const state = /** @type {any} */ (rawState);
  if (!state || typeof state !== 'object' || Array.isArray(state)) return [];
  const sprites = state.spriteLibrary && typeof state.spriteLibrary === 'object' ? state.spriteLibrary.sprites : null;
  if (!sprites || typeof sprites !== 'object' || Array.isArray(sprites)) return [];
  const el = typeof element === 'string' && ELEMENTO.test(element) ? element : null;
  const out = [];
  for (const [formId, e] of Object.entries(sprites)) {
    if (!ID_FORMA.test(formId) || !e || typeof e !== 'object') continue;
    const spriteUrl = spriteUrlOrNull(e.url);
    if (!spriteUrl) continue;
    const date = Number.isFinite(+e.at) && +e.at > 0 ? Math.floor(+e.at) : 0;
    out.push({ stage: estagioDaForma(formId), formId, spriteUrl, element: el, date });
  }
  out.sort((a, b) => (ORDEM[a.stage] - ORDEM[b.stage]) || (a.date - b.date) || a.formId.localeCompare(b.formId));
  return out.slice(0, MAX_FORMAS);
}
