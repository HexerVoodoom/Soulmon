// As 8 CONQUISTAS exibíveis (emblemas de arte — `utils/emblemArt.ts`), todas
// DERIVADAS do save na leitura; nada aqui é persistido (footgun 9: duas fontes
// para o mesmo fato). Cada uma lê um contador que já existe e nunca decresce,
// então uma conquista, uma vez lida como aberta, não fecha.
//
// ⚠️ Nenhuma é "streak que zera" — a tese do produto proíbe (habitRhythm.ts):
// `habit-7`/`habit-21` leem `totalDone` (o marco de hábito), não sequência.
// Nenhuma premia CONTAGEM DE TAREFAS como missão paga em moeda; `tasks-100`
// é conquista cosmética (não paga nada), o mesmo estatuto do bestiário.
import type { GameState } from '../contexts/GameStateContext';

export const ACHIEVEMENT_IDS = [
  'perfect-day',
  'streak-7',
  'milestone-21',
  'first-evolution',
  'mega-form',
  'dungeon-10',
  'tournament-champion',
  'tasks-100',
] as const;
export type AchievementId = typeof ACHIEVEMENT_IDS[number];

export const ACHIEVEMENT_LABELS: Record<AchievementId, { pt: string; en: string }> = {
  'perfect-day': { pt: 'Primeiro dia completo', en: 'First complete day' },
  'streak-7': { pt: 'Hábito de 7 dias', en: '7-day habit' },
  'milestone-21': { pt: 'Marco de 21 dias', en: '21-day milestone' },
  'first-evolution': { pt: 'Primeira evolução', en: 'First evolution' },
  'mega-form': { pt: 'Forma mega', en: 'Mega form' },
  'dungeon-10': { pt: 'Dez masmorras', en: 'Ten dungeon runs' },
  'tournament-champion': { pt: 'Campeão do torneio', en: 'Tournament champion' },
  'tasks-100': { pt: 'Cem tarefas', en: 'One hundred tasks' },
};

type Slice = Pick<GameState,
  'totalPerfectDays' | 'perfectDays' | 'habitRhythms' | 'unlockedEvolutions'
  | 'evolutionStage' | 'dungeonRunsCompleted' | 'trophies' | 'completedTasks' | 'activityLog'>;

const maxTotalDone = (s: Slice) =>
  Math.max(0, ...Object.values(s.habitRhythms ?? {}).map(r => r.totalDone ?? 0));

/** Conquistas abertas, na ordem canônica. Função pura. */
export function unlockedAchievements(s: Slice): AchievementId[] {
  const done = maxTotalDone(s);
  const stage = s.evolutionStage ?? '';
  const tests: Record<AchievementId, boolean> = {
    'perfect-day': (s.totalPerfectDays ?? 0) >= 1 || (s.perfectDays ?? 0) >= 1,
    'streak-7': done >= 7,
    'milestone-21': done >= 21,
    'first-evolution': (s.unlockedEvolutions ?? []).some(id => id !== 'rookie'),
    'mega-form': stage.startsWith('mega') || stage === 'ultra',
    'dungeon-10': (s.dungeonRunsCompleted ?? 0) >= 10,
    'tournament-champion': (s.trophies ?? []).some(t => t.place === 1),
    'tasks-100': (s.completedTasks?.length ?? 0) + (s.activityLog?.length ?? 0) >= 100,
  };
  return ACHIEVEMENT_IDS.filter(id => tests[id]);
}
