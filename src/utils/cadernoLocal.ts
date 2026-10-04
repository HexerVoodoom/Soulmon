/**
 * CADERNO — o journaling local (04/10/2026, `docs/PLANO-OFICINA-FOCO.md` §3).
 *
 * ⚠️ PRIVADO. O texto é da pessoa e fica SÓ neste aparelho (`STORAGE_KEYS.CADERNO`):
 *  · não entra no save em nuvem (nem em `GameState`), não vai a servidor, à IA, ao chat,
 *    à telemetria nem ao relatório do dia — este módulo não importa nada de rede;
 *  · é apagável por entrada e por inteiro (`removeEntry`, `clearAll`);
 *  · nada aqui conta, pontua ou paga: sem sequência, sem total, sem lembrete (psicologia).
 * A sugestão de sofrimento (`needsBridge`, o léxico do chat) é calculada no aparelho, sobre o
 * rascunho, só para mostrar a linha de apoio — nunca bloqueia, nunca grava a detecção.
 */
import { readJson, writeJson, removeLocal } from './safeStorage';
import { STORAGE_KEYS } from './storageKeys';
export { needsBridge as sinaisDeSofrimento } from './chatSafety';

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

export const loadEntries = (): CadernoEntry[] => normalizeEntries(readJson<unknown>(STORAGE_KEYS.CADERNO, []));

/** Grava. NÃO é silencioso: se não coube, quem chama precisa dizer à pessoa. Devolve `true` se gravou. */
export const saveEntries = (list: CadernoEntry[]): boolean => writeJson(STORAGE_KEYS.CADERNO, list);

/** Acrescenta uma entrada (pura); texto vazio não cria entrada. */
export function addEntry(list: CadernoEntry[], day: string, formato: CadernoFormato, text: string, at: number): CadernoEntry[] {
  const limpo = text.trim().slice(0, MAX_CHARS);
  if (!limpo || !isDay(day)) return list;
  const id = `${at.toString(36)}-${(list.length % 1000).toString(36)}`;
  return normalizeEntries([{ id, day, formato, text: limpo, at }, ...list]);
}

export const removeEntry = (list: CadernoEntry[], id: string): CadernoEntry[] => list.filter(e => e.id !== id);

/** Apaga TUDO, inclusive a chave do storage. */
export function clearAll(): void { removeLocal(STORAGE_KEYS.CADERNO); }

/** O formato SUGERIDO do dia — determinístico por data, só uma sugestão (a pessoa troca à vontade). */
export function formatoDoDia(dayKey: string): CadernoFormato {
  let h = 0;
  for (const c of dayKey) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return CADERNO_FORMATOS[h % CADERNO_FORMATOS.length];
}
