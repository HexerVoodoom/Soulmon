// ---------------------------------------------------------------------------
// MISSÕES DIÁRIAS DOS OUTROS RECURSOS (pedido do dono, 14/10/2026): "inclua mais missões diárias para incentivar o usuário a
// usar os outros recursos, como minijogos, pomodoro...". REGISTRO §51.
//
// O que é: um CATÁLOGO de convites do dia. Cada dia o jogo mostra `DAILY_MISSION_COUNT` deles, sorteados de forma
// DETERMINÍSTICA pelo dia do jogador (mesma chave de dia = mesma lista em qualquer aparelho, como `weeklyMissions` é por semana).
// Convivem com as duas linhas que já existiam em "Hoje" (o Passeio e o Caderno) — não as substituem.
//
// O que NÃO é (e há teste varrendo):
//   - NÃO cobra: não fazer não custa nada, não há sequência, perda, contagem regressiva nem número no ícone;
//   - NÃO rastreia: a condição é um EVENTO que o jogo já emitia (terminar uma rodada, um ciclo de foco, dar um banho...). Nada
//     novo é medido, nada sai do aparelho além do próprio save;
//   - NÃO premia contagem de tarefas (proibição do CLAUDE.md) — só uso dos recursos e cuidado;
//   - NÃO oferece o que a pessoa não abriu: cada missão cita o PRÉDIO que a abriga e só entra na lista com o Vínculo que o abre
//     (`buildingGateFor`, a mesma tabela única);
//   - NÃO cria moeda: a recompensa é 1 MATERIAL (`MATERIAL_PER_QUEST`), a mesma que a missão do Caderno já paga, com o teto de
//     estoque de sempre (`MATERIAL_CAP`). Sem XP, sem Créditos, sem Bits, sem Emblemas.
//
// Anti-abuso: a contagem é por EVENTO REAL (1 por rodada/ciclo/banho que de fato aconteceu), o alvo é baixo, cada missão paga
// UMA vez por dia (`claimed`), e reabrir a folha só LÊ o estado — o resgate é idempotente sobre o `prev` do updater.
//
// Estado (UM objeto no save, `GameState.dailyMissions`): `day` (dia do jogador), `counts` por evento (de TODOS os eventos, não só
// dos sorteados — o que a pessoa já fez antes de abrir a folha conta) e `claimed` (missões pagas hoje). Dia novo zera na leitura.
// ---------------------------------------------------------------------------

import { hashString, mulberry32 } from './oracle/base';
import { buildingGateFor, type BuildingId } from './gates';
import { MATERIAL_CAP, MATERIAL_PER_QUEST, forDay as buildingForDay, type BuildingQuestState, type MaterialId } from './buildingQuests';
import type { QuestMark } from './questMarks';

export type DailyEvent =
  | 'dino' | 'ppt' | 'match3' | 'foco' | 'masmorra' | 'banho' | 'carinho' | 'brincar'
  | 'comida' | 'humor' | 'sono' | 'arena' | 'torneio' | 'mercado' | 'amigo';

export interface DailyMission {
  /** Estável (o save e os testes o citam). */
  id: string;
  /** O evento que a conta. */
  event: DailyEvent;
  target: number;
  /** O prédio que abriga o recurso: a missão só entra com o Vínculo que o abre. */
  building: BuildingId;
  /** Material pago (1) — o do prédio, ou o do Refúgio para o cuidado. */
  material: MaterialId;
  descPt: string;
  descEn: string;
}

/**
 * O catálogo. Quinze entradas; as de Vínculo 1 (a pessoa nova só vê estas) são dez, então a lista de três nunca fica curta.
 * Voz: convite, nunca ordem.
 */
const POOL: readonly DailyMission[] = [
  { id: 'd-dino', event: 'dino', target: 1, building: 'jogos.salao', material: 'spark', descPt: 'Dê uma corrida na Corrida com obstáculos', descEn: 'Take a run in the obstacle course' },
  { id: 'd-ppt', event: 'ppt', target: 1, building: 'jogos.salao', material: 'spark', descPt: 'Jogue uma partida de Pedra, papel e tesoura', descEn: 'Play a match of Rock, paper, scissors' },
  { id: 'd-match3', event: 'match3', target: 1, building: 'jogos.salao', material: 'spark', descPt: 'Jogue uma rodada de Combina 3', descEn: 'Play a round of Match 3' },
  { id: 'd-foco', event: 'foco', target: 1, building: 'exploracao.oficina', material: 'gear', descPt: 'Faça um ciclo de foco (Pomodoro) na Oficina', descEn: 'Do one focus cycle (Pomodoro) in the Workshop' },
  { id: 'd-masmorra', event: 'masmorra', target: 1, building: 'exploracao.masmorra', material: 'ore', descPt: 'Limpe um andar da Masmorra', descEn: 'Clear a Dungeon floor' },
  { id: 'd-banho', event: 'banho', target: 1, building: 'jogos.refugio', material: 'moss', descPt: 'Dê um banho no seu Soulmon', descEn: 'Give your Soulmon a bath' },
  { id: 'd-carinho', event: 'carinho', target: 1, building: 'jogos.refugio', material: 'moss', descPt: 'Faça um carinho no seu Soulmon', descEn: 'Pet your Soulmon' },
  { id: 'd-brincar', event: 'brincar', target: 1, building: 'jogos.refugio', material: 'moss', descPt: 'Brinque um pouco com o seu Soulmon', descEn: 'Play a little with your Soulmon' },
  { id: 'd-comida', event: 'comida', target: 1, building: 'jogos.refugio', material: 'moss', descPt: 'Dê uma comidinha ao seu Soulmon', descEn: 'Give your Soulmon a snack' },
  { id: 'd-humor', event: 'humor', target: 1, building: 'jogos.refugio', material: 'moss', descPt: 'Conte como você está se sentindo hoje', descEn: 'Tell how you are feeling today' },
  { id: 'd-sono', event: 'sono', target: 1, building: 'jogos.refugio', material: 'moss', descPt: 'Deixe o seu Soulmon descansar', descEn: 'Let your Soulmon get some rest' },
  { id: 'd-mercado', event: 'mercado', target: 1, building: 'mercado.itens', material: 'ribbon', descPt: 'Dê uma passadinha no Mercado', descEn: 'Stop by the Market' },
  { id: 'd-amigo', event: 'amigo', target: 1, building: 'hall.amigos', material: 'keepsake', descPt: 'Visite a criatura de um amigo', descEn: 'Visit a friend’s creature' },
  { id: 'd-arena', event: 'arena', target: 1, building: 'arena.duelo', material: 'fang', descPt: 'Faça um Duelo na Arena', descEn: 'Have a Duel in the Arena' },
  { id: 'd-torneio', event: 'torneio', target: 1, building: 'arena.torneio', material: 'laurel', descPt: 'Dispute uma partida do Torneio', descEn: 'Play a Tournament match' },
];

export const DAILY_MISSION_COUNT = 3;
/** Teto de contagem por evento (higiene do save; nenhum alvo passa de 2). */
export const DAILY_COUNT_CAP = 99;

/** O catálogo inteiro — existe para o teste varrer o vocabulário e a soma de recompensa. */
export function dailyMissionPool(): readonly DailyMission[] { return POOL; }

/**
 * As missões do dia. DETERMINÍSTICO por `day` (dia do jogador): a mesma chave devolve a mesma ordem em qualquer aparelho.
 * Embaralha o catálogo INTEIRO com a seed do dia e pega as primeiras abertas pelo Vínculo — assim abrir um prédio no meio do
 * dia só muda a lista se ele for sorteado antes das que já estão lá.
 */
export function dailyMissionsFor(day: string, bondLevel: unknown): DailyMission[] {
  const rng = mulberry32(hashString(`daily-missions:${day}`));
  const ordem = [...POOL];
  for (let i = ordem.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
  }
  return ordem.filter(m => buildingGateFor(m.building, bondLevel).open).slice(0, DAILY_MISSION_COUNT);
}

export interface DailyMissionsState {
  day: string;
  counts: Partial<Record<DailyEvent, number>>;
  claimed: string[];
}

export type DailyStatus = 'available' | 'ready' | 'claimed';

/** Zera no dia novo. Mesmo dia devolve a MESMA referência. */
export function dailyForDay(s: DailyMissionsState | undefined, day: string): DailyMissionsState {
  if (s && s.day === day) return s;
  return { day, counts: {}, claimed: [] };
}

/** Um evento real aconteceu. Soma 1 (até o teto) na contagem do dia. */
export function bumpDaily(s: DailyMissionsState | undefined, day: string, event: DailyEvent): DailyMissionsState {
  const cur = dailyForDay(s, day);
  const n = cur.counts[event] ?? 0;
  if (n >= DAILY_COUNT_CAP) return cur;
  return { ...cur, counts: { ...cur.counts, [event]: n + 1 } };
}

export function dailyCount(s: DailyMissionsState | undefined, day: string, m: DailyMission): number {
  return Math.min(m.target, dailyForDay(s, day).counts[m.event] ?? 0);
}

export function dailyStatus(s: DailyMissionsState | undefined, day: string, m: DailyMission): DailyStatus {
  const cur = dailyForDay(s, day);
  if (cur.claimed.includes(m.id)) return 'claimed';
  return (cur.counts[m.event] ?? 0) >= m.target ? 'ready' : 'available';
}

export interface DailyClaimable {
  dailyMissions?: DailyMissionsState;
  buildingQuests?: BuildingQuestState;
}

/**
 * Resgata UMA missão do dia: só se ela está na lista de hoje (aberta pelo Vínculo) e `ready`. Marca como paga e soma 1 do
 * material (até `MATERIAL_CAP`). PURA e idempotente: fora de `ready` devolve o MESMO `prev` e `paid: null` (o updater do React
 * roda 2×; reabrir a folha ou tocar duas vezes não paga duas).
 */
export function claimDaily<T extends DailyClaimable>(prev: T, day: string, bondLevel: unknown, id: string): { state: T; paid: MaterialId | null } {
  const m = dailyMissionsFor(day, bondLevel).find(x => x.id === id);
  if (!m || dailyStatus(prev.dailyMissions, day, m) !== 'ready') return { state: prev, paid: null };
  const cur = dailyForDay(prev.dailyMissions, day);
  const bq = buildingForDay(prev.buildingQuests, day);
  const had = bq.materials[m.material] ?? 0;
  const materials = { ...bq.materials, [m.material]: Math.min(MATERIAL_CAP, had + MATERIAL_PER_QUEST) };
  return {
    state: { ...prev, dailyMissions: { ...cur, claimed: [...cur.claimed, m.id] }, buildingQuests: { ...bq, materials } },
    paid: m.material,
  };
}

/** A marca da aba/ícone: `?` com missão pronta a resgatar, `!` com missão ainda a fazer, nada se tudo foi pago. */
export function dailyMissionsMark(s: DailyMissionsState | undefined, day: string, bondLevel: unknown): QuestMark {
  const st = dailyMissionsFor(day, bondLevel).map(m => dailyStatus(s, day, m));
  if (st.includes('ready')) return 'ready';
  return st.includes('available') ? 'available' : null;
}

const EVENTS: readonly DailyEvent[] = POOL.map(m => m.event);

/** Higienização do load (e do que vem da nuvem): eventos só do catálogo, contagem inteira 0..cap, `claimed` só de ids do catálogo. */
export function sanitizeDailyMissions(raw: unknown): DailyMissionsState | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as Record<string, unknown>;
  if (typeof r.day !== 'string' || r.day.length === 0 || r.day.length > 40) return undefined;
  const c = r.counts && typeof r.counts === 'object' && !Array.isArray(r.counts) ? r.counts as Record<string, unknown> : {};
  const counts: Partial<Record<DailyEvent, number>> = {};
  for (const e of EVENTS) {
    const v = Object.prototype.hasOwnProperty.call(c, e) ? c[e] : undefined;
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) counts[e] = Math.min(DAILY_COUNT_CAP, Math.floor(v));
  }
  const ids = POOL.map(m => m.id);
  const claimed = Array.isArray(r.claimed) ? [...new Set(r.claimed.filter((x): x is string => typeof x === 'string' && ids.includes(x)))] : [];
  return { day: r.day, counts, claimed };
}
