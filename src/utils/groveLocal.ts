/**
 * O QUE ESTE APARELHO JÁ VIU DO BOSQUE (`docs/PLANO-GUILDA.md` §4 e §10.7).
 *
 * A cerimônia de marco, o aviso da Home e as datas do Mural precisam de UMA
 * memória que o servidor não tem: "este aparelho já mostrou o estágio N?". É
 * estado de UI — o mesmo espírito do `TERMS_NOTICE_SHOWN` —, então mora numa
 * chave de conveniência de `storageKeys.ts` e **nunca no GameState**
 * (`guildNoSave.contract.test.ts`): um `guildId` ou um estágio no save seria uma
 * segunda fonte para um fato do servidor, e mentiria depois de uma saída feita
 * em outro aparelho (footgun 9).
 *
 * As decisões que ficam:
 *  · **Só a lógica pura mora nos reducers** (`observeGrove`, `acknowledgeGrove`,
 *    `groveAvisoFor`): `now`/`day` sempre por parâmetro, testáveis sem storage.
 *    O que toca o `localStorage` (via `safeStorage`, que já captura falha) é
 *    `observeGuildView`, e é o único que dispara o evento.
 *  · **Primeira vez que o aparelho vê a roda é BASELINE, não cerimônia.** Quem
 *    entra numa roda que já é Copa não recebe uma cerimônia por um marco que
 *    não viveu; o marco é de quem estava ali quando ele aconteceu.
 *  · **Trocar de roda recomeça a memória** (`gid` diferente), e sair a apaga: o
 *    que a pessoa GANHOU (cenários) já foi para o save e fica com ela (G12).
 *  · O Bosque só cresce, então `index` só sobe — um estágio "menor" que o
 *    reconhecido é ignorado (uma resposta velha nunca desfaz a memória).
 *  · O que sai daqui para a telemetria é o NÚMERO do estágio e uma faixa de
 *    permanência, nunca o `gid`.
 */
import { STORAGE_KEYS } from './storageKeys';
import { readJson, writeJson, removeLocal } from './safeStorage';
import { GROVE_STAGES, type GroveStageId } from './guildRules';
import { track } from './telemetry';
import type { GuildView } from './community';

export interface GroveLocal {
  /** Id PÚBLICO da roda (só para detectar troca de roda; nunca sai do aparelho). */
  gid: string;
  /** Último estágio RECONHECIDO (0..5). Só sobe. */
  index: number;
  /** O estágio que a roda JÁ tinha quando este aparelho a viu pela 1ª vez: baseline, nunca "novo" (sem aviso). */
  base: number;
  /** Maior estágio já enviado à telemetria (`guild_stage`, 1ª vez que o aparelho o vê). */
  tracked: number;
  /** Dia (do jogador) em que este aparelho viu a roda pela 1ª vez — base da faixa `weeks`. */
  joinedDay: string;
  /** Estágio (1..5) → dia do jogador em que ESTE aparelho o viu. Alimenta o Mural. */
  marks: Record<string, string>;
  /** Marco ainda por celebrar: o estágio mais alto visto acima do reconhecido. */
  pending: { index: number; day: string } | null;
  /** Maior estágio cujos cenários `bg-guild-*` já foram liberados (`mine.groveScenes`); 0 = nenhum. */
  scenes: number;
}

/** Estágios com cerimônia: a Clareira é o chão de partida e não tem marco (copy §5). */
export const CEREMONY_MIN_INDEX = 2;

/** O evento que a folha e o App usam para se avisar (mesma aba; storage não avisa a própria aba). */
export const GROVE_EVENT = 'soulmon:grove';

const intIn = (v: unknown, min: number, max: number): number =>
  typeof v === 'number' && Number.isInteger(v) ? Math.min(max, Math.max(min, v)) : min;

/** O que veio do disco é dado não confiável: vira o tipo estreito ou `null`. */
export function sanitizeGroveLocal(raw: unknown): GroveLocal | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.gid !== 'string' || !r.gid) return null;
  const marks: Record<string, string> = {};
  if (r.marks && typeof r.marks === 'object') {
    for (const [k, v] of Object.entries(r.marks as Record<string, unknown>)) {
      const i = Number(k);
      if (Number.isInteger(i) && i >= 1 && i <= GROVE_STAGES.length && typeof v === 'string' && v.length <= 40) marks[String(i)] = v;
    }
  }
  const p = r.pending && typeof r.pending === 'object' ? (r.pending as Record<string, unknown>) : null;
  const pending = p && typeof p.day === 'string'
    ? { index: intIn(p.index, 0, GROVE_STAGES.length), day: p.day.slice(0, 40) }
    : null;
  return {
    gid: r.gid.slice(0, 80),
    index: intIn(r.index, 0, GROVE_STAGES.length),
    base: intIn(r.base, 0, GROVE_STAGES.length),
    tracked: intIn(r.tracked, 0, GROVE_STAGES.length),
    joinedDay: typeof r.joinedDay === 'string' ? r.joinedDay.slice(0, 40) : '',
    marks,
    pending: pending && pending.index >= CEREMONY_MIN_INDEX ? pending : null,
    scenes: intIn(r.scenes, 0, GROVE_STAGES.length),
  };
}

/**
 * O que a pessoa JÁ reconheceu nesta execução (roda → maior estágio). É a rede de segurança de
 * `acknowledgeGroveMilestone` quando o storage está cheio ou indisponível (L3-codigo M1): sem
 * ela, o `pending` continuaria no disco, a cerimônia z-300 voltaria a cada gesto e prenderia a
 * fila inteira. Só vale enquanto o app está aberto — reabrir sem storage repete UMA cerimônia,
 * que é o pior caso aceitável (e a pessoa a fecha de novo).
 */
const reconhecido = new Map<string, number>();
/** Só para teste: a memória acima é do módulo. */
export const resetGroveMemoryForTests = () => { reconhecido.clear(); trackedStages.clear(); guildSheetOpen = false; };

export const readGroveLocal = (): GroveLocal | null => {
  const l = sanitizeGroveLocal(readJson<unknown>(STORAGE_KEYS.GUILD_LAST_STAGE, null));
  if (l?.pending && (reconhecido.get(l.gid) ?? 0) >= l.pending.index) return acknowledgeGrove(l);
  return l;
};

// ── Telemetria e consulta: uma vez só ───────────────────────────────────────

/** `guild_stage` uma vez por estágio e por execução, venha da folha ou do watcher (L3-codigo B5). */
const trackedStages = new Set<number>();
export function trackGuildStageOnce(level: number | null | undefined): void {
  if (!level || trackedStages.has(level)) return;
  trackedStages.add(level);
  track('guild_stage', { level });
}

/**
 * A folha da Guilda está montada? Enquanto estiver, ELA consulta a roda ao voltar ao app e o
 * `useGroveWatch` fica quieto: era uma `getGuild` em dobro por volta (L3-codigo M5).
 */
let guildSheetOpen = false;
export const setGuildSheetOpen = (open: boolean): void => { guildSheetOpen = open; };
export const isGuildSheetOpen = (): boolean => guildSheetOpen;

// ── Lógica pura ─────────────────────────────────────────────────────────────

export interface GroveObservation {
  next: GroveLocal;
  /** Estágio visto pela PRIMEIRA vez neste aparelho (para `guild_stage`), ou `null`. */
  firstSeenStage: number | null;
}

/**
 * O aparelho viu a vista da roda: atualiza a memória.
 *  · sem memória (ou outra roda) → baseline: reconhece o estágio de hoje, sem cerimônia;
 *  · estágio acima do reconhecido → datado em `marks`; a partir da Ramagem vira `pending`;
 *  · nunca desce (resposta velha não desfaz nada).
 */
export function observeGrove(
  prev: GroveLocal | null,
  view: { gid: string; stageIndex: number; groveScenes: boolean },
  day: string,
): GroveObservation {
  const idx = intIn(view.stageIndex, 0, GROVE_STAGES.length);
  const scenes = view.groveScenes ? idx : 0;
  if (!prev || prev.gid !== view.gid) {
    return {
      next: {
        gid: view.gid, index: idx, base: idx, tracked: idx, joinedDay: day,
        marks: idx >= 1 ? { [String(idx)]: day } : {}, pending: null, scenes,
      },
      firstSeenStage: idx >= 1 ? idx : null,
    };
  }
  const marks = { ...prev.marks };
  let pending = prev.pending;
  let index = prev.index;
  if (idx > index) {
    for (let i = index + 1; i <= idx; i++) marks[String(i)] = marks[String(i)] ?? day;
    // Vários marcos de uma vez (o aparelho ficou dias sem abrir): celebra o MAIS ALTO, uma vez.
    if (idx >= CEREMONY_MIN_INDEX) pending = { index: idx, day: pending && pending.index >= CEREMONY_MIN_INDEX ? pending.day : day };
    else index = idx;
  } else if (pending && idx > pending.index) {
    pending = { index: idx, day: pending.day };
  }
  const tracked = Math.max(prev.tracked, idx);
  return {
    next: { ...prev, index, tracked, marks, pending, scenes: Math.max(prev.scenes, scenes) },
    firstSeenStage: idx > prev.tracked ? idx : null,
  };
}

/** A pessoa fechou a cerimônia: o estágio pendente passa a reconhecido. Idempotente. */
export function acknowledgeGrove(prev: GroveLocal | null): GroveLocal | null {
  if (!prev || !prev.pending) return prev;
  return { ...prev, index: Math.max(prev.index, prev.pending.index), pending: null };
}

/**
 * O aviso da Home: só NO DIA do marco (o dia em que este aparelho o viu), só de
 * estágio com copy de marco e só de estágio NOVO (acima do baseline: quem chega
 * a uma roda que já era Copa não recebe "novo estágio" por um marco que não viveu). Devolve o estágio (2..5) ou `null`. Depois da
 * meia-noite do jogador some sozinho: é um aviso, não uma pendência.
 */
export function groveAvisoFor(local: GroveLocal | null, today: string): number | null {
  if (!local) return null;
  let melhor: number | null = null;
  for (const [k, day] of Object.entries(local.marks)) {
    const i = Number(k);
    if (day === today && i >= CEREMONY_MIN_INDEX && i > local.base && (melhor === null || i > melhor)) melhor = i;
  }
  return melhor;
}

/**
 * Faixa de permanência para `guild_leave.weeks` (0..3): 0 = menos de 1 semana,
 * 1 = 1 a 3 semanas, 2 = 4 a 11, 3 = 12 ou mais. É faixa, nunca a data.
 */
export function permanenceBand(joinedDay: string, today: string): number {
  const a = parseDayLabel(joinedDay);
  const b = parseDayLabel(today);
  if (!a || !b || b < a) return 0;
  const weeks = Math.floor((b.getTime() - a.getTime()) / (7 * 86_400_000));
  return weeks >= 12 ? 3 : weeks >= 4 ? 2 : weeks >= 1 ? 1 : 0;
}

/** Nome do dia do jogador (`Mon Sep 29 2026`) ou ISO (`2026-09-29`) → `Date` local ao meio-dia, ou `null`. */
export function parseDayLabel(day: string): Date | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 12);
  const m = /^[A-Za-z]{3} ([A-Za-z]{3}) (\d{1,2}) (\d{4})$/.exec(day);
  if (!m) return null;
  const mes = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(m[1]);
  return mes < 0 ? null : new Date(Number(m[3]), mes, Number(m[2]), 12);
}

/** "29 de setembro de 2026" / "September 29, 2026", ou `''` quando o dia não é legível. */
export function formatDayLabel(day: string, language: string): string {
  const d = parseDayLabel(day);
  if (!d) return '';
  try {
    return d.toLocaleDateString(language === 'pt-BR' ? 'pt-BR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

/** Nome do estágio pelo índice 1..5 (o servidor manda o id; o índice é a ordem). */
export const groveStageAt = (index: number): GroveStageId | null =>
  index >= 1 && index <= GROVE_STAGES.length ? GROVE_STAGES[index - 1] : null;

// ── Efeitos (storage + evento) ──────────────────────────────────────────────

function emitGrove(): void {
  try { window.dispatchEvent(new Event(GROVE_EVENT)); } catch { /* sem window (SSR/teste node) */ }
}

/**
 * A folha ou o App viram a vista da roda (`null` = sem roda). Grava a memória e
 * avisa o outro lado. Devolve o que a telemetria precisa. Nunca lança.
 */
export function observeGuildView(view: GuildView | null, day: string): GroveObservation | null {
  try {
    if (!view) {
      if (readGroveLocal()) { removeLocal(STORAGE_KEYS.GUILD_LAST_STAGE); emitGrove(); }
      return null;
    }
    const obs = observeGrove(readGroveLocal(), {
      gid: view.id, stageIndex: view.bosque.stageIndex, groveScenes: view.mine.groveScenes,
    }, day);
    writeJson(STORAGE_KEYS.GUILD_LAST_STAGE, obs.next, { silent: true });
    emitGrove();
    return obs;
  } catch {
    return null;
  }
}

/** Fechou a cerimônia. */
export function acknowledgeGroveMilestone(): void {
  try {
    const atual = readGroveLocal();
    const next = acknowledgeGrove(atual);
    // Storage cheio/indisponível (`writeJson` → `false`): a memória da execução segura o reconhecimento.
    if (next && !writeJson(STORAGE_KEYS.GUILD_LAST_STAGE, next, { silent: true }) && atual?.pending) {
      reconhecido.set(atual.gid, Math.max(reconhecido.get(atual.gid) ?? 0, atual.pending.index));
    }
    emitGrove();
  } catch { /* conveniência: falhar em silêncio */ }
}

/** Saiu da roda (ou a roda sumiu): a memória do aparelho acaba, o que foi ganho já está no save. */
export function forgetGrove(): GroveLocal | null {
  const antes = readGroveLocal();
  reconhecido.clear();
  removeLocal(STORAGE_KEYS.GUILD_LAST_STAGE);
  emitGrove();
  return antes;
}

// ── Cenários do Bosque (`bg-guild-*`) ───────────────────────────────────────

/** Os ids de cenário liberados até o estágio `upTo` (1..5): a Clareira até o estágio atual. */
export const groveSceneIds = (upTo: number): string[] =>
  GROVE_STAGES.slice(0, Math.max(0, Math.min(GROVE_STAGES.length, upTo))).map(id => `bg-guild-${id}`);

/**
 * Entrega os cenários ao SAVE do jogador (`ownedBackgrounds`). É por estarem no
 * save que eles ficam com quem sai da roda (G12): o que a pessoa ganhou é dela.
 * Idempotente por construção — devolve a MESMA referência quando não há nada a
 * acrescentar, porque o chamador é um `setGameState` (StrictMode roda o updater
 * 2× — footgun 6) e cada escrita nova é um cloud save.
 */
export function grantGroveScenes<T extends { ownedBackgrounds?: string[] }>(prev: T, ids: readonly string[]): T {
  const owned = Array.isArray(prev.ownedBackgrounds) ? prev.ownedBackgrounds : [];
  // O filtro é DAQUI, não do chamador (L3-codigo B2): só id de cenário do Bosque conhecido entra no save.
  const faltam = [...new Set(ids)].filter(id => isGroveSceneId(id) && !owned.includes(id));
  if (faltam.length === 0) return prev;
  return { ...prev, ownedBackgrounds: [...owned, ...faltam] };
}

/** É um id `bg-guild-<estágio>` conhecido? Dado de fora (servidor, disco) nunca inventa cenário no save. */
export const isGroveSceneId = (id: unknown): id is string =>
  typeof id === 'string' && GROVE_STAGES.some(st => id === `bg-guild-${st}`);

/** Cenários que o SERVIDOR diz liberados (`guildRewards.scenes`). Mesmo filtro de `grantGroveScenes`. */
export const grantGuildScenes = grantGroveScenes;
