/**
 * MARCAS SOBRE OS PRÉDIOS DO MAPA (pedido do dono, 04/11/2026).
 *
 *  · "!" / "?" (`lotMissionMarks`): TODO prédio com missão a fazer recebe a marca, não só o Caderno. Fontes: o Passeio, as missões da
 *    semana (Torneio), as Conquistas (Mercado), as missões do dia dos jogos/atividades (mapa evento → prédio abaixo) e as missões de
 *    prédio listadas. Vale a mais urgente por prédio ("?" vence "!"), como em `questMarks`.
 *  · MOEDA DE RECURSO (`lotCoins`): o prédio que tem uma recompensa-recurso DISPONÍVEL agora mostra uma moeda (raio da energia em
 *    amarelo num círculo escuro). É só um indicador: usado ou no limite, some. A lista `LOT_COIN_RULES` é pequena e tipada.
 *
 * Puro: sem React nem relógio próprio (`nowMs` por parâmetro).
 */
import type { BuildingId } from './gates';
import { strongestMark, type QuestMark } from './questMarks';
import { dailyMissionsFor, dailyStatus, type DailyEvent, type DailyMissionsState } from './dailyMissions';
import { maxEnergyOf, settleEnergy, type HungerState } from './hunger';
import { refugioEnergyTaken, type RefugioEnergyState } from './refugio/energia';

/** Onde mora cada evento de missão do dia. `null` = cuidado do bichinho na Home (sem prédio no mapa). */
export const DAILY_EVENT_BUILDING: Readonly<Record<DailyEvent, BuildingId | null>> = {
  dino: 'jogos.salao', ppt: 'jogos.salao', match3: 'jogos.salao', barrage: 'jogos.salao',
  eco: 'jogos.mente', zip: 'jogos.mente', patches: 'jogos.mente', selo: 'jogos.mente',
  masmorra: 'exploracao.fenda', calabouco: 'exploracao.dungeon',
  foco: 'forja.oficina',
  arena: 'arena.duelo', torneio: 'arena.torneio',
  mercado: 'mercado.itens', amigo: 'laboratorio.amigos',
  banho: null, carinho: null, comida: null, humor: null, sono: null,
};

export interface LotMarkInput {
  /** `buildingMarks` (missões de prédio listadas: o Caderno). */
  buildings?: Partial<Record<BuildingId, QuestMark>>;
  /** A marca do Passeio (`questMarks().passeio`). */
  passeio: QuestMark;
  /** As missões da semana (`questMarks().torneio`) moram no Torneio. */
  weekly: QuestMark;
  /** As Conquistas (`questMarks().conquistas`) moram no Mercado. */
  conquistas: QuestMark;
  dailyMissions: DailyMissionsState | undefined;
  day: string;
  bondLevel: unknown;
}

export function lotMissionMarks(i: LotMarkInput): Partial<Record<BuildingId, QuestMark>> {
  const acc: Partial<Record<BuildingId, QuestMark[]>> = {};
  const put = (id: BuildingId, m: QuestMark) => { if (m) (acc[id] ??= []).push(m); };
  for (const [id, m] of Object.entries(i.buildings ?? {}) as [BuildingId, QuestMark][]) put(id, m);
  put('exploracao.passeio', i.passeio);
  put('arena.torneio', i.weekly);
  put('mercado.conquistas', i.conquistas);
  for (const m of dailyMissionsFor(i.day, i.bondLevel)) {
    const b = DAILY_EVENT_BUILDING[m.event];
    if (!b) continue;
    const st = dailyStatus(i.dailyMissions, i.day, m);
    if (st === 'ready') put(b, 'ready'); else if (st === 'available') put(b, 'available');
  }
  const out: Partial<Record<BuildingId, QuestMark>> = {};
  for (const [id, ms] of Object.entries(acc) as [BuildingId, QuestMark[]][]) { const s = strongestMark(ms); if (s) out[id] = s; }
  return out;
}

/** Recursos que a moeda sabe anunciar. */
export type LotCoinId = 'refugio-energia';

type CoinState = HungerState & RefugioEnergyState;
interface CoinRule { id: LotCoinId; building: BuildingId; available: (s: CoinState, nowMs: number) => boolean }

/**
 * A lista (pequena, de propósito). Só entra recurso cujo "disponível agora" sai do save, sem rede:
 *  · `refugio-energia`: concluir uma atividade do Refúgio devolve metade da energia, 1× por dia do jogador
 *    (`utils/refugio/energia.ts`). Acende se o do dia não foi tomado E a energia não está cheia; some ao usar ou no limite.
 */
export const LOT_COIN_RULES: readonly CoinRule[] = [
  {
    id: 'refugio-energia', building: 'forja.refugio',
    available: (s, nowMs) => !refugioEnergyTaken(s, nowMs) && (settleEnergy(s, nowMs).energyPoints ?? 0) < maxEnergyOf(s),
  },
];

export function lotCoins(state: CoinState, nowMs: number): Partial<Record<BuildingId, readonly LotCoinId[]>> {
  const out: Partial<Record<BuildingId, LotCoinId[]>> = {};
  for (const r of LOT_COIN_RULES) if (r.available(state, nowMs)) (out[r.building] ??= []).push(r.id);
  return out;
}
