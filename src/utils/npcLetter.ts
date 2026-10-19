// ---------------------------------------------------------------------------
// CARTA DE NPC (dono, 19/10/2026; D-13/D-14, P6, S-8; REGISTRO §115).
//
// Mecânica nova: chega UMA carta por dia, escrita por um NPC, quando há alguma NOVIDADE de NPC
// (promoção que já existe, missão de prédio disponível, evento). As novidades do dia se juntam
// numa carta só, de até 3 linhas. A Home mostra uma cartinha à esquerda, abaixo do retrato, SÓ
// enquanto há carta não lida; tocar abre a carta (pela fila de modais, `npcLetter`) e a marca
// lida (a cartinha some).
//
// Dono único desta regra. PURO (sem React, sem localStorage): o estado entra e sai por
// parâmetro; quem persiste é o `App` (`STORAGE_KEYS.NPC_LETTER`, `parseLetterState` /
// `serializeLetterState`). Sem campo novo no save.
//
// O que NÃO é: não cobra, não conta cartas, não acumula ("você tem 3 cartas"), não pune quem não
// lê (a carta do dia seguinte é nova; a antiga some sem rastro), sem som (superfície nova nasce
// muda), sem promoção nova (a promoção é a que já existe, `weeklyDiscountItem`).
//
// PUSH: o push da carta CONTA no teto de 4/dia do W4-A. Este módulo só expõe o PONTO DE ENTRADA:
// `notificarCarta(letter, language)` chama o `CartaPushHandler` registrado por quem implementa o
// teto (`registerCartaPushHandler`). Sem handler registrado: no-op (nada vai ao aparelho).
// Idempotente por dia: o `App` só a chama quando a carta NASCE (`letterForDay` → `created`).
// ---------------------------------------------------------------------------

import type { Language } from './i18n';
import { buildingGateFor, type BuildingId } from './gates';
import { weeklyDiscountFor, weeklyDiscountItem } from './equipment';
import type { QuestMark } from './questMarks';

/** O tipo de novidade que uma carta pode juntar. `event` é a vaga para o que o jogo ainda vai ganhar (sem fonte hoje). */
export type LetterNewsKind = 'promo' | 'quest' | 'event';

/** Ordem fixa das linhas e teto de 3 (S-8). */
export const LETTER_NEWS_ORDER: readonly LetterNewsKind[] = ['promo', 'quest', 'event'];
export const LETTER_MAX_LINES = 3;

export interface LetterState {
  /** O dia do JOGADOR (`playerDayKey`) em que a carta chegou. */
  day: string;
  /** As novidades juntadas, na ordem fixa, sem repetição, no máximo 3. */
  kinds: LetterNewsKind[];
  /** Já aberta? Lida = a cartinha da Home some. */
  read: boolean;
}

function isKind(x: unknown): x is LetterNewsKind {
  return typeof x === 'string' && (LETTER_NEWS_ORDER as readonly string[]).includes(x);
}

/** Normaliza uma lista de novidades: só tipos válidos, sem repetição, na ordem fixa, até 3. */
export function normalizeKinds(raw: readonly unknown[] | undefined | null): LetterNewsKind[] {
  const set = new Set((raw ?? []).filter(isKind));
  return LETTER_NEWS_ORDER.filter(k => set.has(k)).slice(0, LETTER_MAX_LINES);
}

/**
 * As novidades de NPC de hoje, só do que JÁ EXISTE (nenhuma promoção nova, D-14):
 *  - `promo`: a peça da semana da forja está com desconto PARA ESTE jogador (talento de Comércio) e a forja está aberta;
 *  - `quest`: há missão de prédio disponível (`buildingMarks`: "!" no prédio).
 * `weekKey` = `isoWeekKey(dia)`; `marks` = `buildingMarks(...)`.
 */
export function npcNewsToday(input: {
  weekKey: string | null | undefined;
  bondLevel: number;
  talentPicks: readonly string[] | undefined;
  marks: Partial<Record<BuildingId, QuestMark>>;
}): LetterNewsKind[] {
  const out: LetterNewsKind[] = [];
  const item = weeklyDiscountItem(input.weekKey);
  if (item && weeklyDiscountFor(item, input.talentPicks as string[] | undefined, input.weekKey) > 0 && buildingGateFor('mercado.ferreiro', input.bondLevel).open) out.push('promo');
  if (Object.values(input.marks).some(m => m === 'available')) out.push('quest');
  return out;
}

/**
 * A regra do dia: no máximo UMA carta por dia.
 *  - já há carta DO DIA (lida ou não): ela fica como está (novidade que chega depois NÃO gera segunda carta);
 *  - sem carta do dia e sem novidade: nada (a carta de ontem não sobrevive à virada);
 *  - sem carta do dia e com novidade: nasce uma, não lida (`created: true`).
 */
export function letterForDay(
  stored: LetterState | null | undefined,
  day: string,
  news: readonly LetterNewsKind[],
): { letter: LetterState | null; created: boolean } {
  if (stored && stored.day === day) return { letter: stored, created: false };
  const kinds = normalizeKinds(news);
  if (kinds.length === 0) return { letter: null, created: false };
  return { letter: { day, kinds, read: false }, created: true };
}

/** A cartinha da Home aparece? Só com carta do dia, não lida. */
export function hasUnreadLetter(letter: LetterState | null | undefined, day: string): boolean {
  return !!letter && letter.day === day && !letter.read;
}

/** Marca como lida. Idempotente: já lida devolve o MESMO objeto. */
export function markLetterRead(letter: LetterState): LetterState {
  return letter.read ? letter : { ...letter, read: true };
}

/** `JSON` do localStorage → estado (lixo/ausente → `null`). */
export function parseLetterState(raw: string | null | undefined): LetterState | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Record<string, unknown> | null;
    if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
    if (typeof o.day !== 'string' || o.day.length === 0 || o.day.length > 40) return null;
    const kinds = normalizeKinds(Array.isArray(o.kinds) ? o.kinds : []);
    if (kinds.length === 0) return null;
    return { day: o.day, kinds, read: o.read === true };
  } catch { return null; }
}

export function serializeLetterState(letter: LetterState): string {
  return JSON.stringify({ day: letter.day, kinds: letter.kinds, read: letter.read });
}

// --- copy (voz do NPC; nunca culpa, nunca cobrança) -------------------------

/** O NPC que assina cada novidade (nome e fala moram em `areaNpcVoice.ts`; aqui só o endereço `área:lote`). */
export const LETTER_NPC: Readonly<Record<LetterNewsKind, { area: 'mercado' | 'exploracao'; lot: string }>> = {
  promo: { area: 'mercado', lot: 'ferreiro' },
  quest: { area: 'exploracao', lot: 'caderno' },
  event: { area: 'mercado', lot: 'ferreiro' },
};

const LINES: Record<LetterNewsKind, { pt: string; en: string }> = {
  promo: { pt: 'Hoje tem algumas coisas em promoção. Vem checar a minha loja!', en: 'A few things are on sale today. Come check my shop!' },
  quest: { pt: 'Tem uma tarefinha esperando por você no Caderno, sem pressa.', en: 'There is a little task waiting for you at the Journal, no rush.' },
  event: { pt: 'Tem novidade por aqui. Passa quando puder.', en: 'There is news around here. Drop by when you can.' },
};

export interface LetterCopy {
  /** Quem assina (a primeira novidade manda). */
  from: { area: 'mercado' | 'exploracao'; lot: string };
  /** Uma linha por novidade, no máximo 3. */
  lines: string[];
  /** Rótulo da cartinha da Home e do botão de fechar. */
  iconLabel: string;
  closeLabel: string;
  title: string;
}

export function letterCopy(letter: LetterState, language: Language): LetterCopy {
  const pt = language === 'pt-BR';
  const kinds = normalizeKinds(letter.kinds);
  const first = kinds[0] ?? 'event';
  return {
    from: LETTER_NPC[first],
    lines: kinds.map(k => (pt ? LINES[k].pt : LINES[k].en)),
    iconLabel: pt ? 'Você tem uma carta' : 'You have a letter',
    closeLabel: pt ? 'Fechar' : 'Close',
    title: pt ? 'Uma carta para você' : 'A letter for you',
  };
}

// --- ponto de entrada do PUSH (W4-A liga aqui) ------------------------------

export type CartaPushHandler = (letter: LetterState, copy: { from: LetterCopy['from']; lines: string[] }) => void;

let pushHandler: CartaPushHandler | null = null;

/** O W4-A registra aqui a função que conta no teto de 4/dia e manda o push. Devolve o desregistro. */
export function registerCartaPushHandler(handler: CartaPushHandler | null): () => void {
  pushHandler = handler;
  return () => { if (pushHandler === handler) pushHandler = null; };
}

/**
 * PONTO DE ENTRADA do push da carta. Chamado UMA vez, quando a carta nasce. Devolve `true` se
 * entregou ao handler (o handler decide, pelo teto/ordem, se manda mesmo). Nunca lança.
 * O texto vai no idioma pedido.
 */
export function notificarCarta(letter: LetterState, language: Language): boolean {
  if (!pushHandler) return false;
  try {
    const c = letterCopy(letter, language);
    pushHandler(letter, { from: c.from, lines: c.lines });
    return true;
  } catch { return false; }
}
