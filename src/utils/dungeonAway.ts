// 🏠 A DESCIDA QUE CONTINUA SOZINHA — a conta de quem ficou fora (pedido do dono, 11/10/2026 — REGISTRO §36).
//
// "Se ele sair, não cancela: depois ele volta e teve o avanço ali." Este arquivo é o DONO ÚNICO dessa conta e é PURO:
// `(estado do save, agora) → (estado novo, relatório)`. Nada de hook, tela, `Math.random` nem relógio escondido — o `now`
// vem por parâmetro e a semente da descida vem do save.
//
// COMO FUNCIONA
//  · O registro `dungeonAway` (tipo e higienização em `utils/dungeonIdle.ts`) guarda onde a descida está: camada, lugar na
//    escada, HP, energia do especial, semente e um instantâneo do jogador. A `DungeonGame` o regrava a cada luta vencida
//    e o apaga quando a descida acaba; sair da tela NÃO o apaga.
//  · Ao voltar, `applyDungeonAway` REJOGA a descida pelo MESMO motor da tela (`dungeonFight` + `groupFightSteps`), luta por
//    luta, com o especial AUTOMÁTICO (`autoRingGrade/autoDodgeGrade`, a mesma nota que a cena sorteia) — logo o resultado de
//    uma luta é o que a tela mostraria, em qualquer velocidade. Cada luta gasta o TEMPO que a cena gastaria (duração do
//    núcleo + a pausa de cada especial + o respiro do fim + `DUNGEON_AUTO_FIGHT_MS`); quando o tempo acaba, a descida fica
//    parada no ponto em que estava e `since` avança até o fim da última luta que coube (nada se perde nem se conta 2×).
//  · O TETO: no máximo `DUNGEON_AWAY_MAX_MS` (8 h) por vez — e o que limita de verdade é a ENERGIA (1 por camada, a da Home).
//    A descida acaba sozinha por HP zerado, energia, portão do Vínculo ou teto do Lv, e o Soulmon volta para casa.
//  · RECOMPENSA: só sai desta conta, pelos MESMOS funis da tela — Bits por `creditMinigameBits` (teto diário de 150), coração
//    pelo teto de 2/dia, o item do 1º marco da descida, fragmentos nos marcos de profundidade, Vínculo e missões pelas
//    mesmas funções puras. O cliente não escolhe valor nenhum: o que ele grava é a posição, e a posição só avança por esta conta.
//
// LIMITES DECLARADOS (não há relógio de servidor no app): `now` é o relógio do aparelho — o mesmo que já manda no HP da
// masmorra (`hpAgora`) e nos tetos diários. Adiantar o relógio rende, no máximo, `DUNGEON_AWAY_MAX_MS` de descida por registro
// e custa a energia correspondente; `now < since` não rende nada. Os Bits ainda passam pelo teto diário.
import type { GameState } from '../contexts/GameStateContext';
import {
  DUNGEON_AUTO_FIGHT_MS, DUNGEON_AWAY_MAX_MS, DUNGEON_ENERGY_PER_LAYER, DUNGEON_FIGHTS_PER_FLOOR, DUNGEON_MAX_LAYER,
  dungeonLayerCap, effectiveFloor, gravarHp, isMilestoneLayer, layerRefusal, recordLayerCleared, sanitizeDungeonAway, spendLayer,
  type DungeonAway, type DungeonAwayPlayer,
} from './dungeonIdle';
import { buildDungeonWave, clearBonus, dungeonHeartsLeftToday, noteDungeonHeartDrops, HEART_DROP_CHANCE, type DungeonEnemy } from './dungeon';
import { autoDodgeGrade, autoRingGrade, dungeonFight, dungeonFightSeed, type DungeonPlayerCfg } from './dungeonFight';
import { groupFightSteps, type GroupEvent, type GroupResult } from './combate/group';
import { mulberry32 } from './combate/rng';
import { SPECIAL_FAMILIES, type SpecialFamily } from './combate/specials';
import { jeitoDaProfissao, jeitoParaPve } from './profissaoMasmorra';
import { creditMinigameBits } from './currencies';
import { bondLevelFor } from './bond';
import { addFragments } from './equipment';
import { applyEnemyDefeated, applyFloorCleared, applyMilestoneItem, countWeeklyMission } from './dungeonRewards';
import { HEART_ITEM_EMOJI } from './shop';
import { playerDayKey } from './playerDay';
import { masmorraFloorOpen } from './gates';
import { heartDropBonus } from './passives';

/** O respiro entre o último golpe e o aviso de fim de luta na cena (`END_BEAT_MS` do `useGroupBattle`). */
export const AWAY_END_BEAT_MS = 900;
/** A pausa de apresentação de cada especial na cena (intro + trajeto + cauda de `combatFx`), em ms — só tempo, não muda a luta. */
export const AWAY_CAST_PAUSE_MS = 2200;
/** Segurança contra laço: nunca simula mais lutas que isto numa só chamada (8 h de energia cheia cabem folgado). */
const MAX_FIGHTS_PER_CALL = 4000;

/** Por que a descida terminou (o Soulmon voltou para casa). `null` = segue lá. */
export type AwayEnd = 'hp' | 'energy' | 'daily' | 'sealed' | 'deep' | 'retired' | null;

/** O que a ausência rendeu — o relatório que a tela mostra. */
export interface AwayReport {
  /** Tempo de descida contado (ms), já limitado pelo teto. */
  elapsedMs: number;
  /** O tempo fora passou do teto (o que sobrou não rende). */
  capped: boolean;
  layers: number;
  enemies: number;
  /** Bits que de fato entraram (depois do teto diário). */
  bits: number;
  hearts: number;
  glitchtama: number;
  fragments: number;
  energy: number;
  /** Camada onde estava e onde está agora. */
  fromLayer: number;
  toLayer: number;
  /** O recorde de profundidade antes/depois. */
  recordFrom: number;
  recordTo: number;
  ended: AwayEnd;
}

export const emptyAwayReport = (fromLayer: number, record: number): AwayReport => ({
  elapsedMs: 0, capped: false, layers: 0, enemies: 0, bits: 0, hearts: 0, glitchtama: 0, fragments: 0, energy: 0,
  fromLayer, toLayer: fromLayer, recordFrom: record, recordTo: record, ended: null,
});

/** A onda de uma CAMADA — a MESMA da tela (`DungeonGame`): força do andar efetivo, sabor da semente da descida. */
export function dungeonWaveOf(seed: number, layer: number, level: number, stage: string): DungeonEnemy[] {
  return buildDungeonWave(effectiveFloor(layer, level), stage, mulberry32((seed ^ Math.imul(layer, 0x9e3779b1)) | 0), level)
    .map(e => ({ ...e, floor: layer }));
}

/** O jogador do instantâneo como o motor o lê. */
export function awayPlayerCfg(p: DungeonAwayPlayer): DungeonPlayerCfg {
  const fam = (SPECIAL_FAMILIES as readonly string[]).includes(p.fam) ? p.fam as SpecialFamily : 'direct';
  return {
    combatant: { level: p.level, atk: p.atk, def: p.def, spd: p.spd, hp: p.hp, bonus: p.bonus },
    family: fam,
    jeito: jeitoDaProfissao(p.prof),
    startShield: p.sh,
  };
}

/** Uma luta da descida com o especial automático: devolve o resultado do núcleo e quantos especiais houve. */
export function playAutoFight(cfg: DungeonPlayerCfg, enemy: DungeonEnemy, runSeed: number, hp: number, en: number): { res: GroupResult; casts: number } {
  const f = dungeonFight(cfg, enemy.foe, dungeonFightSeed(runSeed, enemy.floor, enemy.slot), enemy.slot === 0);
  const g = groupFightSteps(f.player, f.foes, { seed: f.seed, startHp: hp, startEnergy: en, hitScale: f.hitScale });
  let nRing = 0;
  let nDodge = 0;
  let casts = 0;
  let step = g.next();
  while (!step.done) {
    const e: GroupEvent = step.value;
    let ans: number | undefined;
    if (e.kind === 'cast') {
      casts++;
      ans = f.castScale(e.who === 0
        ? { who: 0, ring: autoRingGrade(f.seed, nRing++), dodge: null }
        : { who: e.who, ring: null, dodge: autoDodgeGrade(f.seed, nDodge++) });
    }
    step = g.next(ans);
  }
  return { res: step.value, casts };
}

/** Duração (ms) que a cena gasta numa luta: núcleo + a pausa de cada especial + o respiro do fim. */
export const fightWallMs = (res: GroupResult, casts: number): number => Math.round(res.t * 1000) + casts * AWAY_CAST_PAUSE_MS + AWAY_END_BEAT_MS;

// ── a conta ──────────────────────────────────────────────────────────────────────────────────────────────────────────

const clampInt = (n: unknown): number => (typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0);

export interface ApplyAwayOptions {
  /** Corações que o teto de 2/dia ainda deixa cair (`dungeonHeartsLeftToday()`). Padrão 0. */
  heartsLeft?: number;
  /** O jogador pediu para retirar da masmorra: acerta o que rendeu até agora e o Soulmon volta para casa. */
  retire?: boolean;
}

/**
 * Aplica a descida que ficou rodando: rejoga até `now` (com o teto de tempo), credita o que rendeu e devolve o estado novo.
 * IDEMPOTENTE: chamar de novo com o mesmo `now` sobre o estado novo não muda nada. Sem `dungeonAway` devolve o MESMO objeto.
 */
export function applyDungeonAway<T extends GameState>(prev: T, nowMs: number, opts: ApplyAwayOptions = {}): { next: T; report: AwayReport | null } {
  const away = sanitizeDungeonAway(prev.dungeonAway);
  if (!away) return { next: prev, report: null };
  const now = new Date(nowMs);
  const dayKey = playerDayKey(now, prev.playerDayTz);
  const p = away.player;
  const cfg = awayPlayerCfg(p);
  const cura = jeitoParaPve(cfg.jeito ?? jeitoDaProfissao(undefined)).cura + p.hb;
  const bond = bondLevelFor(prev.totalXP ?? 0);
  const layerCap = dungeonLayerCap(p.level, bond);
  const record0 = clampInt(prev.dungeonDepthRecord);
  const report = emptyAwayReport(away.layer, record0);

  const elapsedReal = Math.max(0, nowMs - away.since);
  report.capped = elapsedReal > DUNGEON_AWAY_MAX_MS;
  const limit = away.since + Math.min(elapsedReal, DUNGEON_AWAY_MAX_MS);

  let s: T = prev;
  let t = away.since;
  let { layer, slot, hp, en, ms } = away;
  const bits0 = s.gamePoints ?? 0;
  let heartsLeft = Math.max(0, Math.floor(opts.heartsLeft ?? 0));
  const heartBonus = heartDropBonus(prev.petPassive);
  const waves = new Map<number, DungeonEnemy[]>();
  const waveOf = (l: number): DungeonEnemy[] => {
    let w = waves.get(l);
    if (!w) { w = dungeonWaveOf(away.seed, l, p.level, p.stage); waves.set(l, w); }
    return w;
  };
  const credit = (pts: number) => {
    const ganho = pts + Math.floor(Math.max(0, pts) * p.rb); // `riftBitsWith`
    s = creditMinigameBits(s, ganho, dayKey);
  };
  let ended: AwayEnd = null;

  for (let guard = 0; guard < MAX_FIGHTS_PER_CALL && !ended; guard++) {
    if (slot >= DUNGEON_FIGHTS_PER_FLOOR) {
      // A camada foi limpa: descer para a de baixo (portão do Vínculo, teto do Lv, energia) — como o `avancar` da tela.
      if (t + DUNGEON_AUTO_FIGHT_MS > limit) break;
      const next = layer + 1;
      if (next > DUNGEON_MAX_LAYER || next > layerCap || !masmorraFloorOpen(next, bond)) {
        ended = masmorraFloorOpen(next, bond) ? 'deep' : 'sealed';
        break;
      }
      // A MESMA porta da tela (`spendLayer`): energia com a regeneração acertada até o instante DA LINHA DO TEMPO da descida (`t`) e o
      // limite diário de camadas do dia daquele instante. Sem isto a conta fora do app furaria o limite que a tela respeita.
      t += DUNGEON_AUTO_FIGHT_MS;
      const refusal = layerRefusal(s, t);
      if (refusal) { ended = refusal === 'daily-limit' ? 'daily' : 'energy'; t -= DUNGEON_AUTO_FIGHT_MS; break; }
      s = spendLayer(s, t);
      report.energy += DUNGEON_ENERGY_PER_LAYER;
      layer = next; slot = 0;
      continue;
    }
    const enemy = waveOf(layer)[slot];
    const { res, casts } = playAutoFight(cfg, enemy, away.seed, hp, en);
    const dur = fightWallMs(res, casts);
    if (t + DUNGEON_AUTO_FIGHT_MS + dur > limit) break; // não coube: fica parado aqui
    t += DUNGEON_AUTO_FIGHT_MS + dur;
    if (res.winner !== 'player') { hp = 0; en = 0; ended = 'hp'; break; }
    hp = res.hpLeft; en = res.energyLeft;
    // o inimigo parou de insistir: abate, bestiário, Bits e (raro, com teto) o coraçãozinho
    s = applyEnemyDefeated(s, enemy.stage);
    credit(enemy.points);
    report.enemies += 1;
    if (heartsLeft > 0 && mulberry32((away.seed * 31 + layer * 7 + slot * 3 + 1) | 0)() <= HEART_DROP_CHANCE + heartBonus) {
      heartsLeft -= 1;
      report.hearts += 1;
      s = { ...s, foodInventory: { ...s.foodInventory, [HEART_ITEM_EMOJI]: (s.foodInventory[HEART_ITEM_EMOJI] ?? 0) + 1 } };
    }
    slot += 1;
    if (slot < DUNGEON_FIGHTS_PER_FLOOR) continue;
    // a camada inteira: bônus, Vínculo, recorde e marcos de profundidade, o marco do andar 5 (1× por descida), a cura do ofício
    credit(clearBonus(layer));
    s = applyFloorCleared(s, now);
    report.layers += 1;
    const rec = recordLayerCleared({ dungeonDepthRecord: s.dungeonDepthRecord }, layer);
    s = { ...s, dungeonDepthRecord: Math.max(clampInt(s.dungeonDepthRecord), layer) };
    const frag = rec.marks.reduce((a, m) => a + m.fragments, 0);
    if (frag > 0) { s = addFragments(s, frag); report.fragments += frag; }
    if (isMilestoneLayer(layer) && !ms) {
      ms = true;
      report.glitchtama += 1;
      s = countWeeklyMission(applyMilestoneItem(s, now), 'dungeon-runs', now);
    }
    hp = Math.min(1, hp + cura);
  }

  if (opts.retire && !ended) ended = 'retired'; // retirar acerta o que rendeu até agora e o Soulmon volta para casa
  report.ended = ended;
  report.toLayer = layer;
  report.recordTo = Math.max(record0, clampInt(s.dungeonDepthRecord));
  report.elapsedMs = Math.max(0, t - away.since);
  report.bits = Math.max(0, (s.gamePoints ?? 0) - bits0);
  const emHp = ended === 'retired' ? Math.max(nowMs, t) : t;
  const proximo: DungeonAway | undefined = ended ? undefined : { ...away, since: t, layer, slot, hp, en, ms };
  return { next: { ...s, dungeonAway: proximo, dungeonHp: gravarHp(hp, emHp) }, report };
}

/**
 * A ponte com o estado do app: acerta a descida de `base` até `nowMs`, grava o resultado pelo `setGameState` e devolve o relatório
 * e a posição nova (`null` = o Soulmon voltou para casa). Os efeitos de fora do save (o teto de 2 corações/dia no aparelho) ficam
 * AQUI, nunca dentro do updater (ele roda 2× no StrictMode). Quem chama garante UMA chamada por volta.
 */
export function settleDungeonAwayNow(
  base: GameState, setGameState: (f: (prev: GameState) => GameState) => void, nowMs: number, retire: boolean,
): { report: AwayReport; away: DungeonAway | null; hp: number } | null {
  const heartsLeft = dungeonHeartsLeftToday();
  try {
    const { next, report } = applyDungeonAway(base, nowMs, { heartsLeft, retire });
    if (!report) return null;
    setGameState(prev => (prev === base ? next : applyDungeonAway(prev, nowMs, { heartsLeft, retire }).next));
    noteDungeonHeartDrops(report.hearts);
    return { report, away: next.dungeonAway ?? null, hp: next.dungeonHp?.frac ?? 1 };
  } catch {
    // Um registro que passou na higienização mas o motor não consegue jogar (estágio/família que não existem mais): a descida é
    // dada por encerrada e o Soulmon volta para casa — nunca uma tela branca permanente por causa de um campo do save.
    setGameState(prev => (prev.dungeonAway ? { ...prev, dungeonAway: undefined } : prev));
    return null;
  }
}
