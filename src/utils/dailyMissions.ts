// ---------------------------------------------------------------------------
// MISSÕES DIÁRIAS DOS OUTROS RECURSOS (pedido do dono, 14/10/2026): "inclua mais missões diárias para incentivar o usuário a
// usar os outros recursos, como minijogos, pomodoro...". REGISTRO §52.
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
import { BUILDING_GATES, buildingGateFor, currentBuildingId, type BuildingId } from './gates';
import { MATERIAL_CAP, MATERIAL_PER_QUEST, materialOf, forDay as buildingForDay, type BuildingQuestState, type MaterialId } from './buildingQuests';
import type { QuestMark } from './questMarks';

export type DailyEvent =
  | 'dino' | 'ppt' | 'match3' | 'foco' | 'masmorra' | 'banho' | 'carinho' | 'brincar'
  | 'comida' | 'humor' | 'sono' | 'arena' | 'torneio' | 'mercado' | 'amigo'
  | 'barrage' | 'eco' | 'zip' | 'patches' | 'calabouco';

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
  { id: 'd-masmorra', event: 'masmorra', target: 1, building: 'arena.fenda', material: 'ore', descPt: 'Limpe uma camada da Fenda', descEn: 'Clear an Endless Rift layer' },
  { id: 'd-banho', event: 'banho', target: 1, building: 'exploracao.refugio', material: 'moss', descPt: 'Dê um banho no seu Soulmon', descEn: 'Give your Soulmon a bath' },
  { id: 'd-carinho', event: 'carinho', target: 1, building: 'exploracao.refugio', material: 'moss', descPt: 'Faça um carinho no seu Soulmon', descEn: 'Pet your Soulmon' },
  { id: 'd-brincar', event: 'brincar', target: 1, building: 'exploracao.refugio', material: 'moss', descPt: 'Brinque um pouco com o seu Soulmon', descEn: 'Play a little with your Soulmon' },
  { id: 'd-comida', event: 'comida', target: 1, building: 'exploracao.refugio', material: 'moss', descPt: 'Dê uma comidinha ao seu Soulmon', descEn: 'Give your Soulmon a snack' },
  { id: 'd-humor', event: 'humor', target: 1, building: 'exploracao.refugio', material: 'moss', descPt: 'Conte como você está se sentindo hoje', descEn: 'Tell how you are feeling today' },
  { id: 'd-sono', event: 'sono', target: 1, building: 'exploracao.refugio', material: 'moss', descPt: 'Deixe o seu Soulmon descansar', descEn: 'Let your Soulmon get some rest' },
  { id: 'd-mercado', event: 'mercado', target: 1, building: 'mercado.itens', material: 'ribbon', descPt: 'Dê uma passadinha no Mercado', descEn: 'Stop by the Market' },
  { id: 'd-amigo', event: 'amigo', target: 1, building: 'laboratorio.amigos', material: 'keepsake', descPt: 'Visite a criatura de um amigo', descEn: 'Visit a friend’s creature' },
  { id: 'd-arena', event: 'arena', target: 1, building: 'arena.duelo', material: 'fang', descPt: 'Faça um Duelo na Arena', descEn: 'Have a Duel in the Arena' },
  { id: 'd-torneio', event: 'torneio', target: 1, building: 'arena.torneio', material: 'laurel', descPt: 'Dispute uma partida do Torneio', descEn: 'Play a Tournament match' },
  // Rodada 6 (L4): Chuva de Almas no rodízio do Salão; Eco/Trilha/Colcha no rodízio do Ateliê; Calabouço sempre. O Calabouço não tem material
  // próprio (prédio sem lote de missão): paga o minério, o mesmo do ambiente de masmorra (a Fenda).
  { id: 'd-barrage', event: 'barrage', target: 1, building: 'jogos.salao', material: 'spark', descPt: 'Encare uma Chuva de Almas', descEn: 'Face a Soul Barrage' },
  { id: 'd-eco', event: 'eco', target: 1, building: 'jogos.mente', material: 'prism', descPt: 'Jogue uma rodada do Eco do Pet', descEn: 'Play a round of Pet Echo' },
  { id: 'd-zip', event: 'zip', target: 1, building: 'jogos.mente', material: 'prism', descPt: 'Resolva uma Trilha do Pet', descEn: 'Solve a Pet Trail' },
  { id: 'd-patches', event: 'patches', target: 1, building: 'jogos.mente', material: 'prism', descPt: 'Monte uma Colcha', descEn: 'Piece together a Patchwork' },
  { id: 'd-calabouco', event: 'calabouco', target: 1, building: 'jogos.dungeon', material: 'ore', descPt: 'Conclua um andar do Calabouço', descEn: 'Finish a Dungeon floor' },
];

/** Rodízios (rodada 6): UMA do Salão e UMA do Ateliê por dia, em ordem fixa; o Calabouço entra todo dia. */
const ROTA_SALAO: readonly string[] = ['d-dino', 'd-ppt', 'd-match3', 'd-barrage'];
const ROTA_MENTE: readonly string[] = ['d-eco', 'd-zip', 'd-patches'];
const FIXA_CALABOUCO = 'd-calabouco';
const NA_ROTA: readonly string[] = [...ROTA_SALAO, ...ROTA_MENTE, FIXA_CALABOUCO];

/** Número do dia (dias desde 1970) a partir da chave `YYYY-MM-DD` do jogador; chave fora do formato cai num hash estável. */
function numeroDoDia(day: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(day);
  if (m) return Math.floor(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 86400000);
  return (hashString(`daily-rota:${day}`) >>> 0) % 100000;
}

/** Até 6 por dia (dono, 14/10/2026, REGISTRO §54): quem tem menos recursos abertos recebe menos (o filtro de portão vem antes do corte). */
export const DAILY_MISSION_COUNT = 6;
/** Teto de contagem por evento (higiene do save; nenhum alvo passa de 2). */
export const DAILY_COUNT_CAP = 99;

/** O catálogo inteiro — existe para o teste varrer o vocabulário e a soma de recompensa. */
export function dailyMissionPool(): readonly DailyMission[] { return POOL; }

/** Listas fechadas que o servidor espelha (`functions/api/_dailyMissions.js`, travado por `dailyMissions.parity.test.js`). */
export const DAILY_MISSION_IDS: readonly string[] = POOL.map(m => m.id);
export const DAILY_EVENTS: readonly DailyEvent[] = POOL.map(m => m.event);

/**
 * As missões do dia. DETERMINÍSTICO por `day` (dia do jogador): a mesma chave devolve a mesma ordem em qualquer aparelho.
 * Embaralha o catálogo INTEIRO com a seed do dia e pega as primeiras abertas pelo Vínculo — assim abrir um prédio no meio do
 * dia só muda a lista se ele for sorteado antes das que já estão lá.
 */
export function dailyMissionsFor(day: string, bondLevel: unknown): DailyMission[] {
  const rng = mulberry32(hashString(`daily-missions:${day}`));
  const resto = POOL.filter(m => !NA_ROTA.includes(m.id));
  for (let i = resto.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [resto[i], resto[j]] = [resto[j], resto[i]];
  }
  // Rodízio DETERMINÍSTICO pelo dia do jogador: salão e Ateliê andam juntos (12 dias fecham todos os pares). O que a pessoa ainda não abriu
  // sai pelo portão; o rodízio não "pula" para outra do mesmo prédio (a de hoje é a de hoje).
  const n = numeroDoDia(day);
  const byId = (id: string) => POOL.find(m => m.id === id)!;
  const fixas = [byId(ROTA_SALAO[n % ROTA_SALAO.length]), byId(ROTA_MENTE[n % ROTA_MENTE.length]), byId(FIXA_CALABOUCO)];
  return [...fixas, ...resto].filter(m => buildingGateFor(m.building, bondLevel).open).slice(0, DAILY_MISSION_COUNT);
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

// ---------------------------------------------------------------------------
// PRIMEIRAS VEZES (missões ÚNICAS, 1× na vida — dono, 14/10/2026, REGISTRO §54): conhecer cada prédio do mapa e estrear o primeiro
// minijogo, foco (Pomodoro), passeio e masmorra. Cada uma paga 1 material UMA vez (`claimed`), idempotente.
//   - SEM retroativo pago: quem já jogava (XP > 0) no dia em que o recurso chegou tem tudo que o Vínculo já abre marcado como
//     cumprido E resgatado, sem pagar (`seedFirstTimes`) — o mais seguro: ninguém ganha material de graça por algo antigo, e ninguém
//     vê uma lista de "primeiras vezes" que já fez. Prédios que o Vínculo abrir DEPOIS contam como novos.
//   - A lista só mostra o que o Vínculo já abriu; a marca do ícone só acende "?" (pronta a resgatar), NUNCA "!": são convites
//     tranquilos, sem cobrança.
// ---------------------------------------------------------------------------

export interface FirstTime {
  id: string;
  building: BuildingId;
  material: MaterialId;
  /** Só as de evento (as de visita têm o texto montado com o nome do prédio, na tela). */
  descPt?: string;
  descEn?: string;
}

// Prédios placeholder (jogos.dungeon) não pagam material: sem tela própria para "visitar" (QA 25/10/2026).
const NO_VISIT: readonly BuildingId[] = ['laboratorio.perfil', 'arena.guerra', 'hall.grove', 'jogos.dungeon'];

const VISITS: readonly FirstTime[] = (Object.keys(BUILDING_GATES) as BuildingId[])
  .filter(b => !NO_VISIT.includes(b))
  .map(b => ({ id: `visit:${b}`, building: b, material: materialOf(b) ?? 'moss' }));

const FIRST_EVENTS: readonly (FirstTime & { from: readonly DailyEvent[] })[] = [
  { id: 'first-minigame', building: 'jogos.salao', material: 'spark', from: ['dino', 'ppt', 'match3', 'barrage'], descPt: 'Estreie o seu primeiro minijogo', descEn: 'Try your first mini-game' },
  { id: 'first-focus', building: 'exploracao.oficina', material: 'gear', from: ['foco'], descPt: 'Faça o seu primeiro ciclo de foco (Pomodoro)', descEn: 'Do your first focus cycle (Pomodoro)' },
  { id: 'first-stroll', building: 'exploracao.passeio', material: 'pebble', from: [], descPt: 'Conclua o seu primeiro passeio', descEn: 'Finish your first stroll' },
  { id: 'first-dungeon', building: 'arena.fenda', material: 'ore', from: ['masmorra'], descPt: 'Limpe a sua primeira camada da Fenda', descEn: 'Clear your first Endless Rift layer' },
];

const FIRST_POOL: readonly FirstTime[] = [...FIRST_EVENTS.map(({ from: _f, ...r }) => r), ...VISITS];
export const FIRST_TIME_IDS: readonly string[] = FIRST_POOL.map(f => f.id);

export interface FirstTimesState {
  done: string[];
  claimed: string[];
}

export const FIRST_TIMES_EMPTY: FirstTimesState = { done: [], claimed: [] };

/** As primeiras vezes que o Vínculo já abriu (a ordem do catálogo: estreias antes das visitas). */
export function firstTimesFor(bondLevel: unknown): FirstTime[] {
  return FIRST_POOL.filter(f => buildingGateFor(f.building, bondLevel).open);
}

/** A primeira vez aconteceu. Idempotente: já cumprida (ou id estranho) devolve o MESMO `s`. */
export function markFirst(s: FirstTimesState | undefined, id: string): FirstTimesState {
  const cur = s ?? FIRST_TIMES_EMPTY;
  if (!FIRST_TIME_IDS.includes(id) || cur.done.includes(id)) return cur;
  return { ...cur, done: [...cur.done, id] };
}

/** Um evento diário (`DailyEvent`) estreia as primeiras vezes que ele alimenta. */
export function markFirstForEvent(s: FirstTimesState | undefined, event: DailyEvent): FirstTimesState {
  let cur = s ?? FIRST_TIMES_EMPTY;
  for (const e of FIRST_EVENTS) if (e.from.includes(event)) cur = markFirst(cur, e.id);
  return cur;
}

export function firstStatus(s: FirstTimesState | undefined, id: string): DailyStatus {
  const cur = s ?? FIRST_TIMES_EMPTY;
  if (cur.claimed.includes(id)) return 'claimed';
  return cur.done.includes(id) ? 'ready' : 'available';
}

/** Resgata UMA primeira vez: só se está na lista do Vínculo e `ready`. Paga 1 material (até o teto). PURA e idempotente. */
export function claimFirst<T extends { firstTimes?: FirstTimesState; buildingQuests?: BuildingQuestState }>(prev: T, day: string, bondLevel: unknown, id: string): { state: T; paid: MaterialId | null } {
  const f = firstTimesFor(bondLevel).find(x => x.id === id);
  if (!f || firstStatus(prev.firstTimes, id) !== 'ready') return { state: prev, paid: null };
  const cur = prev.firstTimes ?? FIRST_TIMES_EMPTY;
  const bq = buildingForDay(prev.buildingQuests, day);
  const materials = { ...bq.materials, [f.material]: Math.min(MATERIAL_CAP, (bq.materials[f.material] ?? 0) + MATERIAL_PER_QUEST) };
  return { state: { ...prev, firstTimes: { ...cur, claimed: [...cur.claimed, id] }, buildingQuests: { ...bq, materials } }, paid: f.material };
}

/** "?" quando há primeira vez pronta a resgatar; nunca "!". */
export function firstTimesMark(s: FirstTimesState | undefined, bondLevel: unknown): QuestMark {
  return firstTimesFor(bondLevel).some(f => firstStatus(s, f.id) === 'ready') ? 'ready' : null;
}

/** Save de quem já jogava: tudo que o Vínculo abre hoje vira cumprido E resgatado, sem pagar nada. */
export function seedFirstTimes(bondLevel: unknown): FirstTimesState {
  const ids = firstTimesFor(bondLevel).map(f => f.id);
  return { done: [...ids], claimed: [...ids] };
}

/** Higienização (load e servidor): só ids do catálogo, sem repetição, `claimed` implica `done`. */
export function sanitizeFirstTimes(raw: unknown): FirstTimesState | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as Record<string, unknown>;
  // D-50: `visit:hall.biblioteca`/`visit:hall.amigos` → `visit:laboratorio.*` (a primeira vez já cumprida/resgatada não se perde).
  const moved = (x: string): string => (x.startsWith('visit:') ? `visit:${currentBuildingId(x.slice(6))}` : x);
  const pick = (v: unknown): string[] => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string').map(moved).filter(x => FIRST_TIME_IDS.includes(x)))] : []);
  const done = pick(r.done);
  const claimed = pick(r.claimed);
  for (const c of claimed) if (!done.includes(c)) done.push(c);
  return { done, claimed };
}
