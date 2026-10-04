/**
 * O GATILHO REAL do convite de nível (CAT-7, `docs/PERGUNTAS-DO-DONO.md`).
 *
 * `utils/catalogLevel.ts` já decide O QUE oferecer a partir de números
 * (ratio/daysAtLevel/lowConstancyDays). Este módulo é quem PRODUZ esses
 * números a partir do `HabitRhythm` real de um hábito de catálogo — função
 * PURA, sem React, sem localStorage, `now: Date` sempre por parâmetro.
 *
 * Duas janelas de constância, nunca uma só (A6 da revisão de psicologia):
 *  - **Subir**: `constancy(rhythm, now, LEVEL_UP_WINDOW_DAYS)` — 21 dias.
 *  - **Descer**: `constancy(rhythm, now, CONSTANCY_WINDOW_DAYS)` — 7 dias,
 *    sustentada por `lowConstancyDays` dias CONSECUTIVOS, SEM contar dias
 *    perdoados (ausência não registrada, dia protegido por escudo).
 *
 * `suggestLevelChange` (catalogLevel.ts) não sabe de janela — só recebe UM
 * `ratio` e compara contra os dois limiares. Por isso este módulo chama a
 * função DUAS vezes, uma por janela, e é o que garante que "subir" nunca lê
 * a constância de 7 dias nem "descer" a de 21 (a inconsistência que a
 * revisão de psicologia apontou no comentário antigo, antes de existir este
 * gatilho).
 */
import { dayKeyOf, dayKeyToDate, constancy, emptyRhythm, type HabitRhythm } from './habitRhythm';
import { CONSTANCY_WINDOW_DAYS } from '../types/taskModel';
import {
  suggestLevelChange, applyLevelChange, LEVEL_UP_WINDOW_DAYS, LEVEL_DOWN_COOLDOWN_DAYS,
  type LevelSuggestion,
} from './catalogLevel';
import { catalogIfLoaded } from '../data/catalogoCarga';
import type { CatalogLevel, CatalogItem } from '../types/activityCatalog';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Dias CONSECUTIVOS (contando de ontem para trás) em que a constância de
 * `CONSTANCY_WINDOW_DAYS` (7) esteve abaixo de `limiar`, SEM contar dias
 * perdoados:
 *  - dia protegido por escudo (`shielded`) — a proteção existe para isso,
 *    contá-lo contra a pessoa anularia o escudo;
 *  - dia sem registro nenhum (nem `done`, nem `missed`, nem `shielded`) —
 *    ausência: o app não sabe se a pessoa teve um dia ruim ou só não abriu o
 *    app, e não é dado ruim para chutar (mesmo princípio de `restConstancy`).
 * Um dia `done` interrompe a sequência (as coisas melhoraram); um dia
 * `missed` com constância baixa naquele momento CONTA e continua a
 * sequência. Teto de 60 dias de busca — nenhum contador deste app cresce
 * sem limite.
 */
export function lowConstancyStreak(
  rhythm: HabitRhythm,
  now: Date,
  limiar: number,
  windowDays: number = CONSTANCY_WINDOW_DAYS,
): number {
  let streak = 0;
  for (let i = 1; i <= 60; i++) {
    const dia = new Date(now.getTime() - i * DAY_MS);
    const key = dayKeyOf(dia);
    if (rhythm.done.includes(key)) break; // melhorou — a sequência acaba
    const perdoado = rhythm.shielded.includes(key) || !rhythm.missed.includes(key);
    if (perdoado) continue; // ausência ou escudo: pula, não conta, não quebra
    const { ratio } = constancy(rhythm, dia, windowDays);
    if (ratio < limiar) streak++;
    else break;
  }
  return streak;
}

export interface CatalogLevelSignalInput {
  currentLevel: CatalogLevel;
  optInOnly?: boolean;
  rhythm: HabitRhythm;
  now: Date;
  /** ISO de quando o item entrou no nível atual. Ausente (item de save
   *  anterior a este campo, ou legado) = ainda não elegível a SUBIR — nunca
   *  se assume tempo que não foi observado (mesma regra de `playerDay.ts`:
   *  não inventar dado a favor de uma cobrança OU de uma oferta prematura). */
  levelSetAt?: string;
  /** ISO da última vez que a pessoa RECUSOU a oferta de "deixar mais leve"
   *  para este item, ou `undefined` se nunca recusou. */
  lastDownDeclineAt?: string;
}

/** `daysAtLevel` a partir de uma data ISO — 0 se ausente (nunca dispara
 *  "subir" prematuramente por falta de dado). */
function daysSince(iso: string | undefined, now: Date): number {
  if (!iso) return 0;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  return Math.max(0, Math.floor((dayKeyToDate(dayKeyOf(now)).getTime() - dayKeyToDate(dayKeyOf(d)).getTime()) / DAY_MS));
}

/**
 * A sugestão REAL para um item de catálogo, a partir do `HabitRhythm`
 * verdadeiro. Nunca sugere nada em item `optInOnly` (protocolos de TCC —
 * `suggestLevelChange` já bloqueia 'up'; aqui a chamada de 'down' segue
 * permitida, mesma regra do A6).
 */
export function catalogLevelSignal(input: CatalogLevelSignalInput): LevelSuggestion {
  const { currentLevel, optInOnly, rhythm, now, levelSetAt, lastDownDeclineAt } = input;

  const ratioUp = constancy(rhythm, now, LEVEL_UP_WINDOW_DAYS).ratio;
  const daysAtLevel = daysSince(levelSetAt, now);
  const subir = suggestLevelChange({
    currentLevel, optInOnly, ratio: ratioUp, daysAtLevel, lowConstancyDays: 0,
  });
  if (subir === 'up') return 'up';

  const ratioDown = constancy(rhythm, now, CONSTANCY_WINDOW_DAYS).ratio;
  const lowConstancyDays = lowConstancyStreak(rhythm, now, 0.4, CONSTANCY_WINDOW_DAYS);
  const daysSinceLastDownDecline = lastDownDeclineAt === undefined ? undefined : daysSince(lastDownDeclineAt, now);
  const descer = suggestLevelChange({
    currentLevel, optInOnly, ratio: ratioDown, daysAtLevel, lowConstancyDays, daysSinceLastDownDecline,
  });
  return descer;
}

/** Um hábito genérico o bastante para ler `catalogId`/`level`/os dois campos
 *  novos sem depender do tipo `Activity` completo (evita import circular com
 *  `contexts/GameStateContext.tsx`, que é quem de fato o declara). */
export interface CatalogLinkedActivity {
  id: string;
  catalogId?: string;
  level?: CatalogLevel;
  catalogLevelSetAt?: string;
  catalogLevelDeclinedAt?: string;
}

export interface CatalogLevelInviteCandidate {
  activity: CatalogLinkedActivity;
  item: CatalogItem;
  suggestion: 'up' | 'down';
}

/**
 * A varredura completa (CAT-7): dado o array de atividades e o
 * `habitRhythms` do save, mais o `now` e a flag de "já mostrou hoje",
 * devolve o PRIMEIRO hábito de catálogo com uma sugestão pendente, na ordem
 * do array — determinístico, nunca sorteia qual hábito "vence" quando dois
 * qualificam no mesmo dia. `null` quando não há nenhum, ou quando o teto de
 * 1 convite/dia já foi atingido.
 *
 * Função PURA: só lê o que recebe, nunca decide o quê aplicar — quem chama
 * decide o que fazer com o candidato (é o `App.tsx` que aplica).
 */
export function pickCatalogLevelInviteCandidate(
  activities: CatalogLinkedActivity[],
  habitRhythms: Record<string, HabitRhythm> | undefined,
  now: Date,
  lastInviteDayKey: string | undefined,
): CatalogLevelInviteCandidate | null {
  if (lastInviteDayKey === dayKeyOf(now)) return null; // teto de 1/dia, app inteiro
  // O catálogo carrega sob demanda (`loadCatalog`); antes disso não há convite.
  const porId = catalogIfLoaded();
  if (!porId) return null;
  for (const activity of activities) {
    if (!activity.catalogId) continue;
    const item = porId[activity.catalogId];
    if (!item) continue;
    const rhythm = habitRhythms?.[activity.id] ?? emptyRhythm();
    const suggestion = catalogLevelSignal({
      currentLevel: activity.level ?? 1,
      optInOnly: item.optInOnly,
      rhythm,
      now,
      levelSetAt: activity.catalogLevelSetAt,
      lastDownDeclineAt: activity.catalogLevelDeclinedAt,
    });
    if (suggestion) return { activity, item, suggestion };
  }
  return null;
}

export { applyLevelChange, LEVEL_DOWN_COOLDOWN_DAYS };
