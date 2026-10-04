// ---------------------------------------------------------------------------
// WP4.7 — MISSÕES SEMANAIS REPETÍVEIS.
//
// As missões que existiam eram seis, de alvo único, e acabavam: quem cumpriu
// as seis não tem mais missão nenhuma pelo resto da vida do save. Um jogo que
// dura meses precisa de algo que volte — e voltar toda semana é a cadência que
// o resto do produto já usa (a season, o relatório semanal, a métrica-norte).
//
// ⚠️ **NENHUMA missão premia CONTAGEM DE TAREFAS.** É proibição escrita do
// `CLAUDE.md`, e é a proibição mais fácil de furar sem perceber: "faça 10
// tarefas" é a missão mais óbvia do mundo e é exatamente o desenho que faz a
// pessoa cadastrar cinco triviais em vez de encarar a difícil. Por isso o pool
// é de CUIDADO e de PRESENÇA — noites na janela, check-ins, uma assombrada
// concluída, runs da masmorra. Há teste varrendo o pool.
//
// As recompensas são pequenas e cosméticas/Emblemas + XP de Vínculo. Nada de
// Bits (a economia já tem sumidouro e não precisa de mais fonte) e nada de
// Créditos (dinheiro real não se ganha jogando).
// ---------------------------------------------------------------------------

import { hashString, mulberry32 } from './oracle/base';

export type WeeklyMissionId =
  | 'rest-nights' | 'checkins' | 'haunted-done' | 'dungeon-runs'
  | 'rub-days' | 'shower' | 'play-days' | 'mood-checkins'
  | 'dream-new' | 'evolve-view' | 'tournament-match' | 'friend-visit';

export interface WeeklyMission {
  id: WeeklyMissionId;
  target: number;
  /** Emblemas — moeda do Torneio, cosmética por regra. Pequeno de propósito. */
  emblems: number;
  descPt: string;
  descEn: string;
}

/**
 * O pool. Doze entradas, todas sobre CUIDADO ou PRESENÇA — nenhuma sobre
 * quantidade de tarefas concluídas.
 */
const POOL: readonly WeeklyMission[] = [
  { id: 'rest-nights', target: 3, emblems: 3, descPt: 'Deite no seu horário em 3 noites', descEn: 'Lie down in your window on 3 nights' },
  { id: 'checkins', target: 4, emblems: 3, descPt: 'Faça o ritual do dia 4 vezes', descEn: 'Do the daily ritual 4 times' },
  { id: 'haunted-done', target: 1, emblems: 4, descPt: 'Termine uma tarefa que estava te olhando', descEn: 'Finish a task that was watching you' },
  { id: 'dungeon-runs', target: 2, emblems: 3, descPt: 'Complete 2 runs da masmorra', descEn: 'Complete 2 dungeon runs' },
  { id: 'rub-days', target: 4, emblems: 2, descPt: 'Faça carinho no seu Soulmon em 4 dias', descEn: 'Rub your Soulmon on 4 days' },
  { id: 'shower', target: 3, emblems: 2, descPt: 'Dê 3 banhos', descEn: 'Give 3 baths' },
  { id: 'play-days', target: 3, emblems: 2, descPt: 'Brinque com ele em 3 dias', descEn: 'Play with them on 3 days' },
  { id: 'mood-checkins', target: 3, emblems: 2, descPt: 'Registre como você estava em 3 dias', descEn: 'Log how you felt on 3 days' },
  { id: 'dream-new', target: 1, emblems: 4, descPt: 'Colecione um sonho novo', descEn: 'Collect a new dream' },
  { id: 'evolve-view', target: 1, emblems: 2, descPt: 'Visite a árvore de evolução', descEn: 'Visit the evolution tree' },
  { id: 'tournament-match', target: 2, emblems: 3, descPt: 'Dispute 2 partidas do Torneio', descEn: 'Play 2 Tournament matches' },
  { id: 'friend-visit', target: 1, emblems: 2, descPt: 'Visite a criatura de alguém', descEn: 'Visit someone else’s creature' },
];

export const WEEKLY_MISSION_COUNT = 3;

/**
 * As três missões da semana. DETERMINÍSTICO por semana: a mesma `weekKey`
 * devolve sempre as mesmas três, em qualquer aparelho.
 *
 * Determinismo aqui não é elegância — é a diferença entre uma missão e um
 * sorteio: se a lista mudasse a cada abertura, a pessoa aprenderia a reabrir o
 * app até cair uma fácil, que é o oposto do que missão semanal existe para
 * fazer.
 */
export function weeklyMissionsFor(weekKey: string): WeeklyMission[] {
  const rng = mulberry32(hashString(`weekly-missions:${weekKey}`));
  const restantes = [...POOL];
  const escolhidas: WeeklyMission[] = [];
  for (let i = 0; i < WEEKLY_MISSION_COUNT && restantes.length; i += 1) {
    const idx = Math.floor(rng() * restantes.length);
    escolhidas.push(restantes.splice(idx, 1)[0]);
  }
  return escolhidas;
}

/** O pool inteiro — existe para o teste varrer o vocabulário. */
export function weeklyMissionPool(): readonly WeeklyMission[] {
  return POOL;
}

export interface WeeklyMissionProgress {
  /** Semana ISO a que este progresso pertence. Semana nova zera. */
  week: string;
  /** Contagem por missão. */
  counts: Partial<Record<WeeklyMissionId, number>>;
  /** Missões já pagas nesta semana — pagar duas vezes é bug de economia. */
  claimed: WeeklyMissionId[];
}

export function emptyWeeklyProgress(week: string): WeeklyMissionProgress {
  return { week, counts: {}, claimed: [] };
}

/** Zera na virada da semana. Semana igual devolve a MESMA referência. */
export function forWeek(p: WeeklyMissionProgress | undefined, week: string): WeeklyMissionProgress {
  if (p && p.week === week) return p;
  return emptyWeeklyProgress(week);
}

/** Soma 1 numa missão. PURA e sem teto — quem lê compara com o `target`. */
export function bumpWeekly(
  p: WeeklyMissionProgress,
  id: WeeklyMissionId,
): WeeklyMissionProgress {
  return { ...p, counts: { ...p.counts, [id]: (p.counts[id] ?? 0) + 1 } };
}

export function isWeeklyDone(p: WeeklyMissionProgress, m: WeeklyMission): boolean {
  return (p.counts[m.id] ?? 0) >= m.target;
}

/**
 * Marca como paga e devolve os Emblemas devidos — `0` se já estava paga ou se
 * ainda não terminou. Idempotente: o updater do React roda 2×.
 */
export function claimWeekly(
  p: WeeklyMissionProgress,
  m: WeeklyMission,
): { progress: WeeklyMissionProgress; emblems: number } {
  if (!isWeeklyDone(p, m) || p.claimed.includes(m.id)) return { progress: p, emblems: 0 };
  return { progress: { ...p, claimed: [...p.claimed, m.id] }, emblems: m.emblems };
}
