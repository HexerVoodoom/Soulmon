/**
 * O PASSEIO PAGA NA HORA (REGISTRO §413, pedido do dono, 16/11/2026) — dono único da conta.
 *
 * Antes, o "Concluir" só gravava o "Fiz" e o resto (a cena do Soulmon no cenário, o achado, o Soulmon avistado, a região que abre)
 * esperava o resumo da noite, na virada do dia. Agora o "Concluir" — no NPC ou na linha "Stroll" da Home, o mesmo caminho — roda a
 * cena e paga TUDO naquele instante, uma vez só.
 *
 * Função PURA sobre o save (o updater do `App` a chama; o `App` a chama de novo sobre a ref só para ler a cena). Idempotente: o
 * `markDone` devolve o MESMO estado se o dia já foi feito, então marcar pelas duas portas, ou duas vezes, paga uma vez. O resumo da
 * noite lê `crossings.sceneDay` e não repete a cena nem sorteia outro avistado.
 *
 * O achado e o avistado são os MESMOS que o resumo da noite sortearia: o achado vem da viagem da missão (`passeioFindOfDay`, que não
 * depende do quanto o dia rendeu) e o avistado é determinístico por (dia, o que o Drive já tem) — `strollDiscoveryOf`.
 */
import type { GameState } from '../contexts/GameStateContext';
import { CROSSINGS_EMPTY } from '../types/travessias';
import { collectAdventure, type AdventureFind } from './adventure';
import { applyBestiarySeen } from './dungeonRewards';
import type { RosterEntry } from './enemyRoster';
import { playerDayIso, playerDayKey } from './playerDay';
import { strollDiscoveryOf } from './strollDiscovery';
import { passeioFindOfDay, regionById, settleNight, strollSummary, markDone, type PasseioFind } from './travessias';

/** O que a cena precisa para abrir. */
export interface StrollNowScene {
  regionId: string;
  bgId: string | null;
  adventure: PasseioFind;
  adventureIsNew: boolean;
  stroll: { missionTitle: string; destination: string };
  discovery: RosterEntry | null;
}

export interface StrollNowResult<T> { state: T; scene: StrollNowScene }

type Save = Pick<GameState, 'crossings' | 'adventures' | 'bestiary' | 'playerDayTz'>;

/**
 * Conclui o passeio de hoje e paga na hora. `null` = nada a fazer (sem missão de pé, já feito hoje, ou missão que se foi): o
 * chamador não abre cena nem mexe no resto do save.
 */
export function applyStrollNow<T extends Save>(prev: T, nowMs: number, isPt: boolean): StrollNowResult<T> | null {
  const hoje = playerDayIso(new Date(nowMs), prev.playerDayTz);
  const c0 = prev.crossings ?? CROSSINGS_EMPTY;
  const feito = markDone(c0, hoje, nowMs);
  if (feito === c0) return null;
  // A região guardada abre agora (no máximo uma por dia, `settleNight`) e a cena de hoje fica marcada como rodada.
  const c1 = { ...settleNight(feito, hoje).state, claimDay: hoje, sceneDay: hoje };
  const stroll = strollSummary(c1, hoje, isPt);
  if (!stroll) return null;
  // O diário conta os dias na chave do JOGADOR (`playerDayKey`, a mesma `date` do resumo da noite).
  const diaDiario = playerDayKey(new Date(nowMs), prev.playerDayTz);
  const diario = prev.adventures ?? [];
  const achado = passeioFindOfDay({ crossings: c1, entries: diario, feito: 0, meta: 1, dayKey: diaDiario, crossDay: hoje });
  const avistado = strollDiscoveryOf(prev.bestiary, hoje);
  const comAchado = { ...prev, crossings: c1, adventures: collectAdventure(diario, achado.id, diaDiario) };
  const state = applyBestiarySeen(comAchado, avistado?.key);
  return {
    state,
    scene: {
      regionId: stroll.regionId,
      bgId: regionById(stroll.regionId)?.bgId ?? null,
      adventure: achado as AdventureFind,
      adventureIsNew: !diario.some(e => e.id === achado.id),
      stroll: { missionTitle: stroll.missionTitle, destination: stroll.destination },
      discovery: avistado,
    },
  };
}
