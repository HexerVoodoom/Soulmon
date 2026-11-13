/**
 * ESPECIAL DOS INIMIGOS (dono, 11/11/2026): "quase só aparece dano direto". Meta de Champion em diante: 50% dano direto e 50% nos
 * outros tipos (buff, DoT, cura, cura ao longo do tempo, debuff; ~10% cada). Rookie fica conservador (75% direto, ~5% cada).
 * Vale para selvagens (Arena, Endless Rift/Masmorra) e simulados `sim_*`. O especial que o JOGADOR escolhe não passa por aqui.
 * O Pesadelo fica fora (não chama).
 *
 * O núcleo já suporta todos: `direct`, `dot`, `heal`, `shield` (+ `effect: 'hot'` em PvE), `atkBuff`/`spdBuff`, `defDebuff`.
 * Cura ao longo do tempo (HoT) só existe no núcleo de grupo (PvE); no duelo 1v1 (PvP/simulados) a fatia do HoT vira `shield`.
 */
import { EFFECT_TUNE, OVER_TIME_BONUS, SPECIAL_POWER_PVE, specialOf, specialOfPve, type Special, type SpecialFamily } from './specials';

export type FoeKind = 'direct' | 'buff' | 'dot' | 'heal' | 'hot' | 'debuff';

/** Percentuais por faixa (somam 100). Ordem = ordem do sorteio. */
export const FOE_MIX: Readonly<Record<'rookie' | 'adulto', Readonly<Record<FoeKind, number>>>> = {
  rookie: { direct: 75, buff: 5, dot: 5, heal: 5, hot: 5, debuff: 5 },
  adulto: { direct: 50, buff: 10, dot: 10, heal: 10, hot: 10, debuff: 10 },
};
const ORDEM: readonly FoeKind[] = ['direct', 'buff', 'dot', 'heal', 'hot', 'debuff'];

/** FNV-1a 32 bits: determinístico, sem Math.random. */
export function foeHash(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

/** O tipo sorteado para a chave `key` no estágio `stage` (`rookie` = faixa conservadora; qualquer outro = meta cheia). */
export function foeKindOf(stage: string, key: string): FoeKind {
  const mix = FOE_MIX[stage === 'rookie' ? 'rookie' : 'adulto'];
  const u = foeHash(`foe|${key}`) % 100;
  let acc = 0;
  for (const k of ORDEM) { acc += mix[k]; if (u < acc) return k; }
  return 'direct';
}

/**
 * O especial do inimigo. `pvp` = duelo 1v1 (sem HoT: vira escudo). Buff alterna entre `atkBuff` e `spdBuff` pela chave.
 * `hot` PvE = `shield` com `effect: 'hot'` (a regra já existente do núcleo de grupo).
 */
export function foeSpecialOf(stage: string, key: string, pvp = false): Special {
  const kind = foeKindOf(stage, key);
  const par = foeHash(`buff|${key}`) % 2 === 0;
  // §325 (dono, 13/11/2026): buff e debuff que duram têm de render MAIS que o dano direto. Medido no motor de grupo, o `spdBuff` do inimigo
  // rendia 0,99× do direto (o "inimigo acelerado" batia menos que o especial direto) e atk/def 1,01×. Recebem o mesmo `OVER_TIME_BONUS`
  // do DoT/HoT (só PvE; o 1v1 do servidor segue o `SPECIAL_POWER`). Gate: `efeitosRegraTotal.test.ts`.
  const bonus = (f: SpecialFamily): Special => (pvp ? specialOf(f) : { ...specialOfPve(f), power: SPECIAL_POWER_PVE[f] * OVER_TIME_BONUS });
  switch (kind) {
    case 'buff': return bonus(par ? 'atkBuff' : 'spdBuff');
    case 'dot': return pvp ? specialOf('dot') : { ...specialOf('dot'), power: OVER_TIME_BONUS };
    case 'heal': return specialOf('heal');
    // §327: o HoT do PvE lê o poder do PvE (`specialOfPve`), para um ajuste do `SPECIAL_POWER.shield` do 1v1 não vazar para cá.
    case 'hot': return pvp ? specialOf('shield') : { ...specialOfPve('shield'), effect: 'hot', tune: { ...EFFECT_TUNE, hotScale: OVER_TIME_BONUS } };
    case 'debuff': return bonus('defDebuff');
    default: return specialOf('direct');
  }
}
export const foeFamilyOf = (stage: string, key: string, pvp = false): SpecialFamily => foeSpecialOf(stage, key, pvp).family;

/** Pendência: no duelo 1v1 do servidor `SPECIAL_POWER.dot` segue 1 (ver REGISTRO); o bônus de 15% só vale no núcleo de grupo (Arena/Rift/selvagens). */
