// As 9 CONQUISTAS exibíveis (emblemas de arte — `utils/emblemArt.ts`), todas
// DERIVADAS do save na leitura; nada aqui é persistido (footgun 9: duas fontes
// para o mesmo fato) — a ÚNICA exceção é `conquistasHerdadas`, abaixo. Cada uma
// lê um contador que já existe e nunca decresce, então uma conquista, uma vez
// lida como aberta, não fecha.
//
// ⚠️ Nenhuma é "streak que zera" — a tese do produto proíbe (habitRhythm.ts):
// `habit-7`/`habit-21`/`habit-66` leem `totalDone` (os marcos de `HABIT_MILESTONES`), não sequência.
// Nenhuma premia CONTAGEM DE TAREFAS — nem cosmética. ⚰️ 21/09/2026 (QA GERAL,
// decisão do dono #30): `tasks-100` ("Cem tarefas", `completedTasks + activityLog
// ≥ 100`) virou `dias-completos-30` — 30 dias completos (`totalPerfectDays`, o
// vitalício da regra §7 "dia completo"), que é COMPORTAMENTO, não contagem.
// Quem já tinha a antiga aberta mantém: `hydrateSave` grava
// `conquistasHerdadas: ['dias-completos-30']` UMA vez (só quando o campo não
// existe e o gatilho antigo estava batido) e este módulo lê o campo abaixo.
import type { GameState } from '../contexts/GameStateContext';

/** O gatilho ANTIGO de `tasks-100`, mantido só para a migração no load. */
export const gatilhoAntigoTasks100 = (s: Partial<Pick<GameState, 'completedTasks' | 'activityLog'>>) =>
  (s.completedTasks?.length ?? 0) + (s.activityLog?.length ?? 0) >= 100;

/** Dias completos vitalícios que abrem `dias-completos-30`. */
export const DIAS_COMPLETOS_PARA_CONQUISTA = 30;

export const ACHIEVEMENT_IDS = [
  'perfect-day',
  'habit-7',
  'habit-21',
  'habit-66',
  'first-evolution',
  'mega-form',
  'dungeon-10',
  'tournament-champion',
  'dias-completos-30',
] as const;
export type AchievementId = typeof ACHIEVEMENT_IDS[number];

export const ACHIEVEMENT_LABELS: Record<AchievementId, { pt: string; en: string }> = {
  'perfect-day': { pt: 'Primeiro dia completo', en: 'First complete day' },
  'habit-7': { pt: 'Broto — 7 dias de hábito', en: 'Sprout — 7-day habit' },
  'habit-21': { pt: 'Arvoreta — 21 dias', en: 'Sapling — 21 days' },
  'habit-66': { pt: 'Árvore — 66 dias', en: 'Tree — 66 days' },
  'first-evolution': { pt: 'Primeira evolução', en: 'First evolution' },
  'mega-form': { pt: 'Forma mega', en: 'Mega form' },
  'dungeon-10': { pt: 'Dez masmorras', en: 'Ten dungeon runs' },
  'tournament-champion': { pt: 'Campeão do torneio', en: 'Tournament champion' },
  'dias-completos-30': { pt: 'Trinta dias completos', en: 'Thirty complete days' },
};

/**
 * COMO se abre cada conquista, em palavras — I12 (02/10/2026): o emblema da
 * Ficha é tocável e diz isto. Texto de posse/instrução, nunca "faltam N" e
 * nunca sequência (a tese do produto proíbe streak que zera).
 */
export const ACHIEVEMENT_HOW: Record<AchievementId, { pt: string; en: string }> = {
  'perfect-day': { pt: 'Conclua todas as tarefas de um mesmo dia.', en: 'Finish every task of a single day.' },
  'habit-7': { pt: 'Cumpra um hábito 7 vezes no total — não precisa ser em sequência.', en: 'Do a habit 7 times in total — no streak needed.' },
  'habit-21': { pt: 'Cumpra um hábito 21 vezes no total — não precisa ser em sequência.', en: 'Do a habit 21 times in total — no streak needed.' },
  'habit-66': { pt: 'Cumpra um hábito 66 vezes no total — não precisa ser em sequência.', en: 'Do a habit 66 times in total — no streak needed.' },
  'first-evolution': { pt: 'Evolua o seu Soulmon pela primeira vez.', en: 'Evolve your Soulmon for the first time.' },
  'mega-form': { pt: 'Chegue à forma mega.', en: 'Reach the mega form.' },
  'dungeon-10': { pt: 'Complete 10 masmorras.', en: 'Complete 10 dungeon runs.' },
  'tournament-champion': { pt: 'Fique em 1º lugar num torneio.', en: 'Place first in a tournament.' },
  'dias-completos-30': { pt: 'Feche 30 dias completos — não precisam ser seguidos.', en: 'Finish 30 complete days — they need not be consecutive.' },
};

/** Nome CURTO para a legenda do emblema: o que vem antes do " — " do rótulo. */
export const achievementShortName = (id: AchievementId, isPt: boolean): string =>
  (isPt ? ACHIEVEMENT_LABELS[id].pt : ACHIEVEMENT_LABELS[id].en).split(' — ')[0];

type Slice = Pick<GameState,
  'totalPerfectDays' | 'perfectDays' | 'habitRhythms' | 'unlockedEvolutions'
  | 'evolutionStage' | 'dungeonRunsCompleted' | 'trophies' | 'conquistasHerdadas'>;

const maxTotalDone = (s: Slice) =>
  Math.max(0, ...Object.values(s.habitRhythms ?? {}).map(r => r.totalDone ?? 0));

/** Conquistas abertas, na ordem canônica. Função pura. */
export function unlockedAchievements(s: Slice): AchievementId[] {
  const done = maxTotalDone(s);
  const stage = s.evolutionStage ?? '';
  const tests: Record<AchievementId, boolean> = {
    'perfect-day': (s.totalPerfectDays ?? 0) >= 1 || (s.perfectDays ?? 0) >= 1,
    'habit-7': done >= 7,
    'habit-21': done >= 21,
    'habit-66': done >= 66,
    'first-evolution': (s.unlockedEvolutions ?? []).some(id => id !== 'rookie'),
    'mega-form': stage.startsWith('mega') || stage === 'ultra',
    'dungeon-10': (s.dungeonRunsCompleted ?? 0) >= 10,
    'tournament-champion': (s.trophies ?? []).some(t => t.place === 1),
    'dias-completos-30': (s.totalPerfectDays ?? 0) >= DIAS_COMPLETOS_PARA_CONQUISTA
      || (s.conquistasHerdadas ?? []).includes('dias-completos-30'),
  };
  return ACHIEVEMENT_IDS.filter(id => tests[id]);
}
