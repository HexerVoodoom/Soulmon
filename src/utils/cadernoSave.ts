/**
 * CADERNO — a parte PURA do dado (04/10/2026): tipo, tetos, sanitização e as operações sobre a lista.
 *
 * Mora separado de `cadernoLocal.ts` pelo orçamento de bytes (como `travessiasSave`): o
 * `GameStateContext` está no chunk de entrada e só precisa da higienização; o léxico de crise do
 * chat (`chatSafety`) fica de fora dele. Só `safeStorage` (a chave legada); nada de rede.
 *
 * ⚠️ DADO SENSÍVEL (decisão do dono, 04/10/2026): as anotações vivem em `GameState.caderno`, no save
 * na nuvem do próprio titular. NUNCA entram em payload de IA/chat, telemetria, métricas, perfil
 * público ou guilda — há contrato (`cadernoSensivel.contract.test.ts`).
 */
export type CadernoFormato = 'tres-coisas' | 'gratidao' | 'aprendi' | 'livre';
export const CADERNO_FORMATOS: readonly CadernoFormato[] = ['tres-coisas', 'gratidao', 'aprendi', 'livre'];

/** Teto de texto por entrada e de entradas guardadas — só higiene de storage. */
export const MAX_CHARS = 2000;
export const MAX_ENTRIES = 120;

export interface CadernoEntry { id: string; day: string; formato: CadernoFormato; text: string; at: number }

const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isFormato = (v: unknown): v is CadernoFormato => typeof v === 'string' && (CADERNO_FORMATOS as readonly string[]).includes(v);

/** Tolera lixo: descarta o que não tem o formato; nunca lança; mais novo primeiro, no teto. */
export function normalizeEntries(raw: unknown): CadernoEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: CadernoEntry[] = [];
  const vistos = new Set<string>();
  for (const e of raw) {
    const r = (e ?? {}) as Record<string, unknown>;
    if (typeof r.id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(r.id) || vistos.has(r.id)) continue;
    if (!isDay(r.day) || !isFormato(r.formato) || typeof r.text !== 'string') continue;
    const text = r.text.slice(0, MAX_CHARS);
    const at = Number(r.at);
    if (!text.trim() || !Number.isFinite(at)) continue;
    vistos.add(r.id);
    out.push({ id: r.id, day: r.day, formato: r.formato, text, at });
  }
  return out.sort((a, b) => b.at - a.at).slice(0, MAX_ENTRIES);
}

import { readJson, removeLocal } from './safeStorage';
import { STORAGE_KEYS } from './storageKeys';

/** Junta duas listas (a do save e a legada do aparelho): mesmo id vale uma vez; teto e ordem de sempre. */
export const mergeEntries = (a: CadernoEntry[] | undefined, b: CadernoEntry[]): CadernoEntry[] =>
  normalizeEntries([...(a ?? []), ...b]);

/** Acrescenta uma entrada (pura); texto vazio não cria entrada. */
export function addEntry(list: CadernoEntry[], day: string, formato: CadernoFormato, text: string, at: number): CadernoEntry[] {
  const limpo = text.trim().slice(0, MAX_CHARS);
  if (!limpo || !isDay(day)) return list;
  const id = `${at.toString(36)}-${(list.length % 1000).toString(36)}`;
  return normalizeEntries([{ id, day, formato, text: limpo, at }, ...list]);
}

export const removeEntry = (list: CadernoEntry[], id: string): CadernoEntry[] => list.filter(e => e.id !== id);

/** O formato SUGERIDO do dia — determinístico por data, só uma sugestão (a pessoa troca à vontade). */
export function formatoDoDia(dayKey: string): CadernoFormato {
  let h = 0;
  for (const c of dayKey) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return CADERNO_FORMATOS[h % CADERNO_FORMATOS.length];
}

/** As anotações da 1ª versão (só no aparelho, `soulmon-caderno`), higienizadas. Vazio se não houver. */
export const loadLegacyEntries = (): CadernoEntry[] => normalizeEntries(readJson<unknown>(STORAGE_KEYS.CADERNO, []));

/** Apaga a chave local — chamar SÓ depois de as entradas estarem no save. */
export function clearLegacy(): void { removeLocal(STORAGE_KEYS.CADERNO); }
