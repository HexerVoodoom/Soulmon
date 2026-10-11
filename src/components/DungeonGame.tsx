import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Icon } from './ui/Icon';
import { InfoTip } from './ui/InfoTip';
import { sm2Button } from './form/FormKit';
import { GameRoot, GameHeader, GameVisor, VisorSprite, StatTag, phaseTitle, phaseLine } from './games/GameKit';
import { getSpriteForStage } from '../utils/sprites';
import { playVictory } from '../utils/sounds';
import { DUNGEON_BITS_FACTOR } from '../utils/dungeon';
import {
  DUNGEON_AUTO_FIGHT_MS, DUNGEON_MILESTONE_FLOOR, DUNGEON_MIN_HP_TO_ENTER_PCT, DUNGEON_HP_REGEN_FULL_HOURS,
  hpAgora, gravarHp, podeDescer, msAteDescer, formatarEspera,
  DUNGEON_ENERGY_PER_LAYER, DUNGEON_MAX_LAYER, effectiveFloor, dungeonLayerCap, startLayerFor, isMilestoneLayer,
  canPayLayer, layersAffordable, spendLayerEnergy, recordLayerCleared, sanitizeDepthRecord,
} from '../utils/dungeonIdle';
import { getMaxEnergyForStage } from '../types/progression';
import { addFragments } from '../utils/equipment';
import { MINIGAME_BITS_PER_DAY, minigameBitsToday } from '../utils/currencies';
import { playerDayKey } from '../utils/playerDay';
import { newDefenseSeed } from '../utils/autoDefesa';
import {
  buildDungeonWave, getDungeonBest, recordDungeonScore, LADDER_TIERS,
  type DungeonEnemy,
} from '../utils/dungeon';
import { dungeonFamily, dungeonFight, dungeonFightSeed, dungeonPlayerSide, type DungeonPlayerCfg } from '../utils/dungeonFight';
import { ENERGY_TRIGGER } from '../utils/combate/specials';
import { mulberry32 } from '../utils/combate/rng';
import type { GroupResult } from '../utils/combate/group';
import { stageSkillsFor, type FichaSkills } from '../utils/soulProfile/ficha/stageSkillsFor';
import { fighterIdentity } from '../utils/fighterIdentity';
import { fxElementId, visualElementFor, prefersReducedMotion, elementStrikeForm, specialLabel, foeSpecialLabel } from '../utils/combatFx';
import { TorcidaLayer } from './games/TorcidaKit';
import { BattleStage, BATTLE_LAYER_STYLE } from './games/BattleStage';
import { entrarNaSuperficie } from '../utils/musica';
import { useGroupBattle, type GroupRound, type GroupScene } from './games/useGroupBattle';
import { RING_TAG, DODGE_TAG, PERSONAL_TAG } from './games/pveTags';
import { buildRunScenes, DUNGEON_SCENES, type DungeonScene } from '../utils/dungeonScenes';
import { jeitoDaProfissao, fraseDaProfissao, jeitoParaPve } from '../utils/profissaoMasmorra';
import { useGameStateOptional } from '../contexts/GameStateContext';
import { soulCombatant, type SoulXPState } from '../utils/soulXP';
import { useDungeonBonus, useRiftTalents, riftBitsWith } from '../contexts/useTalentBonus';
import { gateLine, masmorraFloorOpen } from '../utils/gates';
import { bondLevelFor } from '../utils/bond';
import type { LText } from '../utils/oracle';
import type { Language } from '../utils/i18n';

/**
 * Dungeon minigame — an AUTOMATIC, endless descent, in the full-screen `BattleStage`.
 *
 * ── A DESCIDA IDLE (08/10/2026, decisão do dono; constantes em `utils/dungeonIdle.ts`) ─────────────
 * Ao tocar em "Descer" as lutas encadeiam SOZINHAS (uma a cada `DUNGEON_AUTO_FIGHT_MS`); não há botão de
 * "próximo oponente" nem de "próximo andar". Cada andar é uma escada de 6 criaturas (baby-i → mega); a cada
 * 6 lutas desce-se um andar, SEM teto (a dificuldade de `dungeonFoe`/`DUNGEON_FLOOR_GROWTH` é o que a
 * encerra). O HP NÃO enche entre descidas: persiste no save (`dungeonHp`, lido por `hpAgora`) e regenera com
 * o tempo, inclusive com o app fechado. Limpar o andar `DUNGEON_MILESTONE_FLOOR` (5) é um MARCO (uma vez por
 * descida): Glitchtama + sobe a base semanal. A descida acaba quando o HP zera (ou quando o portão do
 * Vínculo fecha o próximo andar alto); perder não custa coração nem Bits. Pausar/Sair ficam sempre à mão.
 *
 * Floor difficulty = base level + (floor-1). Each floor has its own retro scene. The base level resets
 * WEEKLY. A pequena cura ao limpar um andar (`curaAndar` do ofício + talento) SEGUE valendo — é cura
 * DENTRO da descida (a parede calibrada do combate v3 a pressupõe), não o enchimento entre descidas que saiu.
 *
 * ── A LUTA (04/10/2026, REGISTRO §20.10) ──────────────────────────────────────
 * A cena é a MESMA tela cheia do Duelo (`games/BattleStage.tsx`): o Soulmon grande embaixo à
 * esquerda, o inimigo em cima à direita, HP e ENERGIA em cima de cada um. SEM torcida (contexto §2.19):
 * o Soulmon vai sozinho.
 *
 * ── COMBATE v3 (PR4, `docs/squad-alpha-runs/combate-v3-01`, contexto §2.18) ───────────────────────────
 * O MOTOR é o núcleo v3 (`utils/combate/`, `groupFightSteps` com 1 inimigo, igual ao 1v1): o pet é
 * `soulCombatant(estado)` (level e ramo → ATK/DEF/SPD/HP), o inimigo é RELATIVO ao level dele
 * (`dungeonFoe`, andar = base semanal + camada − 1) e o OFÍCIO da ficha entra por `jeitoParaPve`. As
 * regras de cada luta moram em `utils/dungeonFight.ts` (a MESMA que o balanço simula); o relógio da cena
 * é `games/useGroupBattle.ts`. O Soulmon golpeia e se defende sozinho (defesa automática); **a energia e o HP PERSISTEM entre os
 * inimigos e as camadas da run** (a masmorra é contínua). Energia cheia = o ESPECIAL, com o ANEL (toque
 * na hora certa); quando o inimigo (o mega) solta o dele, dá para ESQUIVAR deslizando o dedo. Sem
 * `Math.random` na luta nem na onda: a semente da run (`newDefenseSeed`) decide tudo.
 *
 * A `TimingBar` de ataque/esquiva saiu desta tela (`TIMING_DODGE_ENABLED = false`, `utils/autoDefesa.ts`;
 * o componente `pixel/TimingBar.tsx` fica no repo para reaproveitar).
 * Sem limite diário e SEM gate de entrada: a masmorra não cobra da barra de
 * cuidado do pet (perder custa a run — bônus de andar, Glitchtama e placar —
 * nunca corações). Coraçõezinhos (raramente) dropam; o placar alimenta o ranking.
 */

// Bits for clearing a floor — scales with how deep you are. Era 10/15/20/25/30;
// desde 30/09/2026 passa pelo `DUNGEON_BITS_FACTOR` (0,4 → 4/6/8/10/12), a
// decisão do dono que trouxe a run completa para perto do teto diário.
export const clearBonus = (floor: number) => Math.round((10 + 5 * (floor - 1)) * DUNGEON_BITS_FACTOR);

type Phase = 'intro' | 'fight' | 'enemy-down' | 'floor-clear' | 'ended';

/** O cartão de resultado sobre a cena (entre inimigos, camadas e no fim). */
/** Sem torcida na Masmorra (contexto §2.19): o toque na cena não faz nada. */
const noTap = (): void => {};

const PANEL: CSSProperties = {
  position: 'absolute', left: 12, right: 12, zIndex: 7, boxSizing: 'border-box',
  bottom: 'calc(var(--sm-corner-h, 68px) + env(safe-area-inset-bottom, 0px) + 62px)',
  maxHeight: '52vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: 12,
  backgroundColor: 'color-mix(in srgb, var(--sm2-surface) 92%, transparent)',
  border: '1px solid var(--sm2-line)', borderRadius: 'var(--sm2-radius-md)',
};

// ── Game ───────────────────────────────────────────────────────────────────
export function DungeonGame({ evolutionStage, demoCharacterId, petElement, skills, profissao, profissaoNome, language, onEnter, onLose, onHeartDrop, onGlitchtama, onFloorCleared, onEnemyDefeated, onEarnPoints, onExit, bits = 0, onSpendBits }: {
  evolutionStage: string;
  /** Modo demo (utils/monetization.ts): personagem pré-pronto — sobrepõe o sprite do pet (nunca dos inimigos). */
  demoCharacterId?: string;
  /** Elemento dominante do Soulmon (`soulmonMeta.dominantElement`): a arte dos golpes dele. Sem ele, o neutro. */
  petElement?: string;
  /** As skills da ficha (o mesmo `skills` da Arena). Com elas, a escola decide o golpe e o selo leva o nome do especial (PR1b B2/N1); sem elas, o elemento. */
  skills?: FichaSkills;
  /** Fase 3 do Oráculo — id da profissão da ficha (`ficha/manifestacao.ts`).
   *  Ausente = `JEITO_PADRAO`. Nunca toca Bits, drops nem dificuldade. */
  profissao?: string | null;
  /** O nome do ofício, já PT+EN (vem do cache `soulmonManifestacao`) — este
   *  componente NÃO importa o snapshot do class-system: `buildSheet.ts`
   *  arrasta o `oracle.ts` inteiro, e a folha lazy da fenda passava a demorar
   *  segundos para abrir. Sem nome, a linha do lobby não aparece. */
  profissaoNome?: LText | null;
  language: Language;
  /** Inicia a run. Sem gate: a masmorra não cobra da barra de cuidado. */
  onEnter: () => { ok: true; level?: number; best: number };
  /** Perder encerra a run — não custa HP. */
  onLose: () => void;
  /** Rolls for a heart drop (added to Items); returns whether one dropped. */
  onHeartDrop: () => boolean;
  /** Completing all 5 floors grants a Glitchtama (added to Items). */
  onGlitchtama: () => void;
  /** 🔗 #59b — um ANDAR limpo (os 6 inimigos da escada). O componente não
   *  expunha este momento: só `onEnemyDefeated`, `onEarnPoints` e
   *  `onGlitchtama` (a run inteira). Era por isso que o `BondEvent`
   *  `dungeonFloor` da tabela do §55 nunca tinha emissor. Opcional para não
   *  obrigar quem monta a masmorra fora da Home a saber do Vínculo. */
  onFloorCleared?: () => void;
  /** Mission counter: called once per defeated enemy.
   *  WP4.6 — recebe também a CHAVE do inimigo, para o bestiário registrar o
   *  que o jogador enfrentou. A chave é a mesma do sprite (`stage`), que já é
   *  única por linha e tier — inventar um id novo aqui criaria uma segunda
   *  identidade para a mesma criatura. */
  onEnemyDefeated: (enemyKey?: string) => void;
  /** Grants Bits. */
  onEarnPoints: (pts: number) => void;
  /** WP4.5 — Bits em caixa, para a compra de profundidade. */
  bits?: number;
  /** WP4.5 — cobra os Bits e devolve se deu. Quem decide é quem tem o save. */
  onSpendBits?: (pts: number) => boolean;
  onExit: () => void;
}) {
  // Música (11/10/2026): na masmorra toca o LOOP (se a música de masmorra e arena está ligada). Abrir o jogo é o gesto do jogador.
  useEffect(() => entrarNaSuperficie('masmorra'), []);

  const isPt = language === 'pt-BR';
  const lang = isPt ? 'pt' : 'en';
  const jeito = jeitoDaProfissao(profissao);
  const pve = jeitoParaPve(jeito);
  const par = stageSkillsFor(skills, evolutionStage);
  const profissaoRotulo = profissao && profissaoNome ? (isPt ? profissaoNome.pt : profissaoNome.en) : undefined;
  const profissaoFrase = fraseDaProfissao(profissao, isPt);

  // O level e o ramo vêm do estado do save (`soulCombatant`); sem provider (demo, testes) cai no estágio.
  const ctx = useGameStateOptional();
  const gs = ctx?.gameState;
  const estado = useMemo<SoulXPState>(
    () => (gs
      ? { evolutionStage: gs.evolutionStage, perfectDays: gs.perfectDays, powerPoints: gs.powerPoints, harmonyPoints: gs.harmonyPoints, benevolencePoints: gs.benevolencePoints, degeneratedByHP: gs.degeneratedByHP }
      : { evolutionStage }),
    [gs, evolutionStage],
  );
  /** O jogador do núcleo: `soulCombatant(estado)` com o jeito do ofício (`jeitoParaPve`). */
  const bonusTalento = useDungeonBonus(); // canal único de bônus (teto 5%): ATK/DEF/SPD (PR7 + PR12a)
  const rift = useRiftTalents(); // Tarefa B: cura entre andares, Bits e escudo de largada (fora do canal de 5%: não são % de combate)
  const jogador = useMemo<DungeonPlayerCfg>(() => ({
    combatant: soulCombatant(estado, bonusTalento),
    family: dungeonFamily(par?.especial),
    jeito,
    startShield: rift.startShield,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [estado, bonusTalento, rift.startShield, par?.especial?.escolaId, par?.especial?.familia, profissao]);
  const jogadorRef = useRef(jogador);
  jogadorRef.current = jogador;
  const nivelJogador = jogador.combatant.level;
  const hpMax = Math.max(1, Math.round(dungeonPlayerSide(jogador).combatant.hp));

  const [enemies, setEnemies] = useState<DungeonEnemy[]>([]);
  const [enemyIdx, setEnemyIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('intro');
  const [rewardMsg, setRewardMsg] = useState('');
  /** O coraçãozinho caiu neste inimigo (JOGO-10) — vira glifo, não emoji na string. */
  const [gotHeart, setGotHeart] = useState(false);
  /** E1: o texto longo do lobby mora atrás do "?". */
  const [floor, setFloor] = useState(1);
  /** Camada onde a descida começou (o ponto de retorno). */
  const [startLayer, setStartLayer] = useState(1);
  const [best, setBest] = useState(() => getDungeonBest());
  const [runScore, setRunScore] = useState(0);
  // 5 scenes drawn per run from the classic pool + the shop backdrops.
  const [runScenes, setRunScenes] = useState<DungeonScene[]>(() => buildRunScenes());
  const runScoreRef = useRef(0);
  /** A SEMENTE da run: o sabor das ondas, a defesa automática, o anel e a esquiva. Nunca `Math.random` (o `newDefenseSeed` só a sorteia). */
  const runSeedRef = useRef(newDefenseSeed());
  const [seedLuta, setSeedLuta] = useState(() => runSeedRef.current);
  /** Muda a cada inimigo: reinicia o relógio da cena. */
  const [fightKey, setFightKey] = useState(0);
  /** O que passa de um inimigo para o outro: HP (fração) e energia do pet. */
  const hpCarryRef = useRef(1);
  const energyCarryRef = useRef(0);
  const [hpFrac, setHpFrac] = useState(1);
  /** A confirmação de sair está aberta: a luta espera. */
  const [pausadoConfirm, setPausado] = useState(false);
  /** O jogador apertou "Pausar": a luta e o relógio entre lutas esperam até "Retomar". */
  const [pausadoManual, setPausadoManual] = useState(false);
  const pausado = pausadoConfirm || pausadoManual;
  /** Por que a descida acabou: HP zerado, energia acabou, o portão do Vínculo fechou, ou o teto de camadas do Lv. */
  const [endReason, setEndReason] = useState<'hp' | 'sealed' | 'energy' | 'deep'>('hp');
  /** O RESUMO da descida (REGISTRO §31): o que ela rendeu, contado aqui e mostrado no fim. */
  const resumoRef = useRef({ layers: 0, enemies: 0, bits: 0, hearts: 0, glitchtama: 0, fragments: 0, energy: 0, recordFrom: 0, recordTo: 0 });
  const [resumo, setResumo] = useState(resumoRef.current);
  /** O marco do andar 5 já foi pago NESTA descida (idempotência: uma vez por descida). */
  const milestoneRef = useRef(false);
  const [milestoneNow, setMilestoneNow] = useState(false);
  /** Relógio de PAREDE só para repintar a contagem do lobby; a conta é `hpAgora(estado, agora)`, nunca acumulada. */
  const [agora, setAgora] = useState(() => Date.now());
  const reduzido = useRef(prefersReducedMotion());
  const enemiesRef = useRef<DungeonEnemy[]>([]);
  const enemyIdxRef = useRef(0);

  const enemy = enemies[enemyIdx];
  const petSprite = getSpriteForStage(evolutionStage, demoCharacterId, 256);
  const ladderLen = LADDER_TIERS.length;
  const scene = runScenes[(floor - 1) % Math.max(1, runScenes.length)] ?? DUNGEON_SCENES[0];
  // A identidade de combate (dono único): o mesmo golpe básico/especial da Arena, do Torneio e do PvP.
  const ident = useMemo(() => fighterIdentity(par, petElement), [par, petElement]);
  const petEl = fxElementId(ident.basico.elemento);
  const enemyEl = fxElementId(visualElementFor(enemy?.stage ?? 'x'));
  const foeMax = enemy ? Math.max(1, Math.round(enemy.foe.combatant.hp)) : 1;

  const addPoints = (pts: number) => {
    const ganhos = riftBitsWith(pts, rift.riftBits);
    onEarnPoints(ganhos); // Bits ganhos: o talento soma por cima; o placar da run fica na base (o funil aplica o teto diário)
    runScoreRef.current += pts;
    resumoRef.current.bits += ganhos;
  };

  // Record the run score, then leave the dungeon.
  const exitRun = () => {
    recordDungeonScore(runScoreRef.current);
    onExit();
  };

  /** Põe um inimigo da escada na luta. */
  const enterEnemy = (list: DungeonEnemy[], idx: number) => {
    enemiesRef.current = list;
    enemyIdxRef.current = idx;
    setEnemyIdx(idx);
    setFightKey(k => k + 1);
  };

  /** A onda de uma CAMADA: a força é a do andar EFETIVO (`effectiveFloor`: a zona de conforto do Lv luta no andar 1);
      o sabor e a semente da luta saem da camada de verdade, para duas camadas da zona não repetirem a mesma luta. */
  const waveOf = (layer: number) =>
    buildDungeonWave(effectiveFloor(layer, nivelJogador), evolutionStage, mulberry32((runSeedRef.current ^ Math.imul(layer, 0x9e3779b1)) | 0), nivelJogador)
      .map(e => ({ ...e, floor: layer }));

  /* 🔋 ENERGIA, TETO E RECORDE (REGISTRO §31). Sem provider (demo, testes) não há save: nada é cobrado nem fecha. */
  const bond = gs ? bondLevelFor(gs.totalXP ?? 0) : 1;
  const capCamadas = gs ? dungeonLayerCap(nivelJogador, bond) : Number.POSITIVE_INFINITY;
  const recorde = sanitizeDepthRecord(gs?.dungeonDepthRecord);
  const energia = gs ? gs.energyPoints ?? 0 : Number.POSITIVE_INFINITY;
  const energiaMax = getMaxEnergyForStage(evolutionStage);
  const temEnergia = !gs || canPayLayer(energia);
  const inicio = gs ? startLayerFor(recorde, capCamadas) : 1;
  /** A energia é lida do save no instante do gasto (o updater decide; aqui só se espelha o que ele fez). */
  const energiaRef = useRef(energia);
  energiaRef.current = energia;
  /** Gasta a energia de UMA camada. Devolve se deu (sem provider, sempre). */
  const pagarCamada = (): boolean => {
    if (!ctx) return true;
    if (!canPayLayer(energiaRef.current)) return false;
    energiaRef.current -= DUNGEON_ENERGY_PER_LAYER;
    ctx.setGameState(prev => spendLayerEnergy(prev));
    resumoRef.current.energy += DUNGEON_ENERGY_PER_LAYER;
    return true;
  };
  /** Registra a camada LIMPA: recorde (só sobe) e os fragmentos dos marcos de profundidade (1× na vida). */
  const registrarCamada = (layer: number) => {
    if (!ctx) return;
    const { marks } = recordLayerCleared({ dungeonDepthRecord: recordeRef.current }, layer);
    recordeRef.current = Math.max(recordeRef.current, layer);
    resumoRef.current.recordTo = Math.max(resumoRef.current.recordTo, layer);
    const frag = marks.reduce((a, m) => a + m.fragments, 0);
    resumoRef.current.fragments += frag;
    ctx.setGameState(prev => {
      const r = recordLayerCleared(prev, layer);
      const ganho = r.marks.reduce((a, m) => a + m.fragments, 0);
      return ganho > 0 ? addFragments(r.next, ganho) : r.next;
    });
  };
  const recordeRef = useRef(recorde);

  /** Grava o HP da descida no save (fração do máximo + instante). Só o cliente: não compra vantagem. */
  const salvarHp = (frac: number) => {
    ctx?.setGameState(prev => ({ ...prev, dungeonHp: gravarHp(frac, Date.now()) }));
  };
  /** O estado de onde sai o HP de agora (sem provider — demo, testes —: cheio). */
  const hpState = { dungeonHp: gs?.dungeonHp };

  // Começa a descida no andar 1 (level = base persistida). O piso de HP é o único portão — e não custa nada.
  const startRun = () => {
    const now = Date.now();
    if (!podeDescer(hpState, now)) return;
    resumoRef.current = { layers: 0, enemies: 0, bits: 0, hearts: 0, glitchtama: 0, fragments: 0, energy: 0, recordFrom: recorde, recordTo: recorde };
    recordeRef.current = recorde;
    if (!pagarCamada()) return; // a 1ª camada também custa energia; sem ela o botão nem acende
    const res = onEnter();
    runSeedRef.current = newDefenseSeed();
    setSeedLuta(runSeedRef.current);
    const list = waveOf(inicio);
    setRunScenes(buildRunScenes());
    setBest(res.best);
    setStartLayer(inicio);
    setFloor(inicio);
    setEnemies(list);
    hpCarryRef.current = hpAgora(hpState, now); // o HP NÃO enche: sai do que o save e o relógio dizem
    energyCarryRef.current = 0;
    setHpFrac(hpCarryRef.current);
    enterEnemy(list, 0);
    runScoreRef.current = 0;
    setRunScore(0);
    setRewardMsg('');
    setGotHeart(false);
    milestoneRef.current = false;
    setMilestoneNow(false);
    setPausadoManual(false);
    setPhase('fight');
  };

  // Enemy defeated: grant points + roll a heart drop, then confirm.
  // C-1 (run `som-01`): a morte de inimigo NAO usa o som de conclusao. Uma run
  // sao 5 andares x 6 inimigos = 30 disparos do som que o produto reserva para
  // "voce concluiu uma coisa real" — gastar celebracao no evento frequente e
  // gasta-la. O canal visual (inimigo saindo da escada) e sincrono e continua.
  const defeatEnemy = () => {
    const e = enemiesRef.current[enemyIdxRef.current];
    if (!e) return;
    onEnemyDefeated(e.stage);
    addPoints(e.points);
    resumoRef.current.enemies += 1;
    const caiuCoracao = onHeartDrop();
    if (caiuCoracao) resumoRef.current.hearts += 1;
    setGotHeart(caiuCoracao);
    setRewardMsg(`+${e.points} Bits`);
    if (enemyIdxRef.current + 1 >= enemiesRef.current.length) clearFloor();
    else setPhase('enemy-down');
  };

  /** O andar limpo (os 6 da escada): bônus, Vínculo, o MARCO (1×/descida), a cura do ofício — e o portão do próximo. */
  const clearFloor = () => {
    playVictory(); // PR18: vitória do andar (era `playFeed`, o som de COMER — R-CAT: o evento decide)
    addPoints(clearBonus(floor));
    // 🔗 #59b — o andar limpo; o teto diário de `bond.ts` é quem limita.
    onFloorCleared?.();
    recordDungeonScore(runScoreRef.current);
    setBest(getDungeonBest());
    setRunScore(runScoreRef.current);
    resumoRef.current.layers += 1;
    registrarCamada(floor); // recorde + marcos de profundidade (fragmentos, 1× na vida)
    if (isMilestoneLayer(floor) && !milestoneRef.current) {
      milestoneRef.current = true; // idempotente: um Glitchtama por descida, no primeiro marco limpo
      setMilestoneNow(true);
      resumoRef.current.glitchtama += 1;
      onGlitchtama();                             // marco → 🌀 Glitchtama (1 uso/dia: `specialItemUse.ts`)
    } else {
      setMilestoneNow(false);
    }
    // A cura entre andares (`curaAndar` do ofício) é fração do HP máximo; fica fora da régua do TTK.
    const cura = pve.cura + rift.healBoost; // Tarefa B (`tal-pve-03`): a cura entre andares sobe poucos pontos do HP máximo
    const heal = Math.ceil(hpMax * cura);
    hpCarryRef.current = Math.min(1, hpCarryRef.current + cura);
    setHpFrac(hpCarryRef.current);
    salvarHp(hpCarryRef.current);
    setRewardMsg(isPt ? `Recuperou ${heal} de HP` : `Recovered ${heal} HP`);
    // PR7: os andares ALTOS têm portão pelo Vínculo. Fechado, a descida termina aqui — sem cobrança.
    if (!floorOpen(floor + 1)) { endDescent(gs && floor + 1 > capCamadas && masmorraFloorOpen(floor + 1, bond) ? 'deep' : 'sealed'); return; }
    // 🔋 A próxima camada custa energia: sem ela, a descida para aqui com uma frase calma (nunca cobrança).
    if (!temEnergiaAgora()) { endDescent('energy'); return; }
    setPhase('floor-clear');
  };

  /** Sem provider (demo, testes) não há Vínculo para medir e nada fecha. */
  const floorOpen = (f: number) => !gs || masmorraFloorOpen(f, bondLevelFor(gs.totalXP ?? 0)) && f <= capCamadas;
  const temEnergiaAgora = () => !ctx || canPayLayer(energiaRef.current);

  const endDescent = (why: 'hp' | 'sealed' | 'energy' | 'deep') => {
    setResumo({ ...resumoRef.current });
    recordDungeonScore(runScoreRef.current);
    setBest(getDungeonBest());
    setRunScore(runScoreRef.current);
    setEndReason(why);
    setAgora(Date.now());
    setPausadoManual(false);
    setPhase('ended');
  };

  /* A luta é o núcleo v3 (`utils/combate/`, `groupFightSteps` com 1 inimigo): o `dungeonFight` monta o
     jogador (`soulCombatant` + o jeito do ofício), o inimigo relativo ao level (`dungeonFoe`), a defesa
     automática e o contra-ataque; o relógio da cena é o `useGroupBattle`, que consome os eventos no relógio do
     núcleo. A defesa perfeita não dá dano; o especial do inimigo (o mega) pode ser esquivado. */
  const rodadaDoNucleo = useCallback((): GroupRound => {
    const e = enemiesRef.current[enemyIdxRef.current];
    const f = dungeonFight(jogadorRef.current, e.foe, dungeonFightSeed(runSeedRef.current, e.floor, e.slot), e.slot === 0); // o escudo de largada (`tal-pve-07`) é só do 1º da escada de cada andar
    return {
      player: f.player, foes: f.foes, seed: f.seed,
      startHp: hpCarryRef.current, startEnergy: energyCarryRef.current,
      hitScale: f.hitScale,
      castScale: ({ who, ring, dodge }) => f.castScale({ who, ring, dodge }),
    };
  }, []);

  const cena = useCallback((): GroupScene => {
    const e = enemiesRef.current[enemyIdxRef.current];
    const p = jogadorRef.current;
    const foeEl = fxElementId(visualElementFor(e?.stage ?? 'x'));
    return {
      playerMaxHp: Math.max(1, Math.round(dungeonPlayerSide(p).combatant.hp)),
      foeMaxHp: [Math.max(1, Math.round(e?.foe.combatant.hp ?? 1))],
      playerElement: sp => fxElementId(sp ? ident.especial.elemento : ident.basico.elemento),
      foeElement: () => foeEl,
      playerKind: sp => (sp ? ident.especial.forma : ident.basico.forma),
      foeKind: (_f, sp) => elementStrikeForm(foeEl, sp ? 'especial' : 'basica'),
      labels: { blocked: isPt ? 'Defendeu!' : 'Defended!', ring: RING_TAG[lang], dodge: DODGE_TAG[lang] },
      personalTag: PERSONAL_TAG[lang][p.family],
      playerSpecialEscola: ident.especial.escola,
    };
  }, [ident, par, isPt, lang]);

  const aoFimImpl = (res: GroupResult) => {
    if (res.winner === 'player') {
      hpCarryRef.current = res.hpLeft;
      energyCarryRef.current = res.energyLeft;
      setHpFrac(res.hpLeft);
      salvarHp(res.hpLeft); // o HP persiste a cada luta: fechar a tela agora não o perde
      defeatEnemy();
      return;
    }
    // Derrota ou empate (o empate conta como derrota, sem custo): o HP zerou e a descida acaba.
    // C-6 (run `som-01`): sem som de degeneracao. Perder a descida nao custa coracao nem Bits —
    // `handleDungeonLose` é um callback vazio, de propósito. O HP volta com o TEMPO (`hpAgora`).
    onLose();
    hpCarryRef.current = 0;
    salvarHp(0);
    setHpFrac(0);
    endDescent('hp');
  };
  /* O fim da luta é lido por um PROXY estável sobre a versão do render mais novo: `clearFloor` lê andar, base e
     talentos, e um `useCallback` com deps fixas os congelaria no andar 1 (a descida não tem mais teto de andares). */
  const aoFimRef = useRef(aoFimImpl);
  aoFimRef.current = aoFimImpl;
  const aoFimDaLuta = useCallback((res: GroupResult) => aoFimRef.current(res), []);

  const battle = useGroupBattle({
    running: phase === 'fight' && !!enemy,
    paused: pausado, reduced: reduzido.current, runKey: fightKey, seed: seedLuta,
    round: rodadaDoNucleo, scene: cena, onEnd: aoFimDaLuta, torcida: false,
  });

  // O próximo passo da descida, SEM toque: outro inimigo do andar, ou o andar de baixo (sem teto).
  const avancar = () => {
    if (phase === 'enemy-down') {
      enterEnemy(enemies, enemyIdx + 1); // a energia do pet PERSISTE
      setRewardMsg('');
      setPhase('fight');
    } else if (phase === 'floor-clear') {
      const f = floor + 1;
      if (!pagarCamada()) { endDescent('energy'); return; } // a energia pode ter mudado entre o fim do andar e agora
      const list = waveOf(f);
      setFloor(f);
      setEnemies(list);
      enterEnemy(list, 0);
      setRewardMsg('');
      setMilestoneNow(false);
      setPhase('fight');
    }
  };
  const avancarRef = useRef(avancar);
  avancarRef.current = avancar;
  // O relógio entre lutas: uma a cada `DUNGEON_AUTO_FIGHT_MS`; pausar (ou a confirmação de sair) o segura.
  useEffect(() => {
    if ((phase !== 'enemy-down' && phase !== 'floor-clear') || pausado) return;
    const t = setTimeout(() => avancarRef.current(), DUNGEON_AUTO_FIGHT_MS);
    return () => clearTimeout(t);
  }, [phase, pausado, fightKey, floor]);

  // No lobby, repinta a contagem de recuperação (o valor vem de `hpAgora`, nunca é acumulado aqui).
  useEffect(() => {
    if (phase !== 'intro' && phase !== 'ended') return;
    const t = setInterval(() => setAgora(Date.now()), 30_000);
    return () => clearInterval(t);
  }, [phase]);

  const inStage = enemies.length > 0 && phase !== 'intro';
  const sceneName = isPt ? scene.namePt : scene.nameEn;
  const capBits = !!gs && minigameBitsToday(gs, playerDayKey(new Date(), gs.playerDayTz)) >= MINIGAME_BITS_PER_DAY;
  /** Quanto falta para o HP chegar ao piso de entrada (0 = já pode descer). */
  const espera = msAteDescer(hpState, agora);
  const hpLobby = hpAgora(hpState, agora);
  const exitLabel = isPt ? 'Sair' : 'Exit';
  const scoreLine = isPt ? `Placar: ${runScore} · Recorde: ${best}` : `Score: ${runScore} · Best: ${best}`;

  /* A LUTA e os cartões de resultado moram na MESMA cena de tela cheia: a energia
     segue visível entre os inimigos (a masmorra é contínua). */
  if (inStage && enemy) {
    const fighting = phase === 'fight';
    const ended = phase === 'ended';
    // Entre o começo da luta nova e o 1º passo do relógio, o estado do hook ainda é o do inimigo anterior: a cena pinta o novo cheio.
    const pronto = battle.stateKey === fightKey;
    const foeHpFrac = pronto ? (battle.foesHp[0] ?? 1) : 1;
    const meHpFrac = fighting && pronto ? battle.hp : hpFrac;
    return (
      <TorcidaLayer
        onTap={noTap}
        active={false} /* sem torcida na Masmorra (contexto §2.19): a camada só leva o gesto da esquiva */
        isPt={isPt}
        style={BATTLE_LAYER_STYLE}
        swipeActive={fighting && battle.phase === 'dodge'}
        onSwipe={battle.swipe}
      >
        <BattleStage
          specialLabel={specialLabel(isPt, par?.especial)}
          foeSpecialLabel={(f) => foeSpecialLabel(isPt, f.element, f.name)}
          isPt={isPt}
          scene={scene.bg}
          me={{
            key: 'me', sprite: petSprite, name: isPt ? 'Você' : 'You', hp: Math.round(Math.max(0, meHpFrac) * hpMax), maxHp: hpMax,
            element: petEl, energy: (pronto ? battle.petEnergy : energyCarryRef.current) / ENERGY_TRIGGER,
            status: pronto ? battle.status.me : undefined,
          }}
          foes={[{
            key: `${floor}-${enemyIdx}`, sprite: enemy.sprite, name: enemy.name, hp: Math.round(Math.max(0, foeHpFrac) * foeMax), maxHp: foeMax,
            element: enemyEl, down: foeHpFrac <= 1e-9,
            // só quem tem especial (o mega) mostra a barra de energia
            energy: enemy.foe.special && pronto ? (battle.foeEnergy[0] ?? 0) / ENERGY_TRIGGER : undefined,
            status: pronto ? battle.status.foes[0] : undefined,
          }]}
          action={pronto ? battle.action : null}
          hit={pronto ? battle.hits : []}
          charging={pronto && battle.charging}
          ring={pronto ? battle.ring : null}
          onRingGrade={battle.resolveRing}
          dodge={pronto ? battle.dodge : null}
          onDodge={battle.swipe}
          petDodge={pronto ? battle.petDodge : null}
          mechLabels={{
            strike: isPt ? 'Golpear' : 'Strike',
            dodgeLeft: isPt ? 'Esquivar para a esquerda' : 'Dodge left',
            dodgeRight: isPt ? 'Esquivar para a direita' : 'Dodge right',
          }}
          /* Copy §4: "camada/layer" é o termo canônico (§12). Sem "/N": a descida não tem fim de andares. */
          title={`${isPt ? 'Camada' : 'Layer'} ${floor}`}
          badge={<span className="sm2-num" style={{ fontSize: 'var(--sm2-text-sm)', color: 'var(--sm2-viewport-ink)', textShadow: '0 1px 2px rgba(0,0,0,.8)' }} aria-label={`${sceneName} · ${isPt ? 'inimigo' : 'enemy'} ${enemyIdx + 1}/${ladderLen}`}>{enemyIdx + 1}/{ladderLen}</span>}
          closeLabel={exitLabel}
          onClose={exitRun}
          exitConfirm={!ended ? {
            title: isPt ? 'Sair da descida? O placar até aqui fica.' : 'Leave the descent? Your score so far stays.',
            stay: isPt ? 'Continuar' : 'Keep going',
            leave: exitLabel,
          } : undefined}
          onPauseChange={setPausado}
        >
          {/* Os controles da descida: SEMPRE à mão (Pausar/Retomar; o Sair é o X da cena). A linha viva é o placar do
              andar para o leitor de tela (`aria-live`): só muda quando o ANDAR muda. Sem botão de "próximo". */}
          {!ended && (
            <div data-dungeon-controls style={{ position: 'absolute', left: 12, right: 12, zIndex: 8, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 8, bottom: 'calc(var(--sm-corner-h, 68px) + env(safe-area-inset-bottom, 0px) + 8px)' }}>
              <button type="button" data-dungeon-pause aria-pressed={pausadoManual} onClick={() => setPausadoManual(v => !v)} style={{ ...sm2Button('outline'), flexShrink: 0, padding: '0 12px' }}>
                {pausadoManual ? (isPt ? 'Retomar' : 'Resume') : (isPt ? 'Pausar' : 'Pause')}
              </button>
              <p data-dungeon-floor-live aria-live="polite" className="sm2-num" style={{ ...phaseLine, margin: 0, textAlign: 'right', flex: 1, minWidth: 0 }}>
                {isPt ? `Camada ${floor}` : `Layer ${floor}`}{pausadoManual ? (isPt ? ' · em pausa' : ' · paused') : ''}
              </p>
            </div>
          )}
          {phase === 'enemy-down' && (
            <div role="status" style={PANEL}>
              {/* Copy §4 (§5.12, L3): vencer é PASSAR, não matar — nenhuma
                  criatura da Malha morre. ⚠️ EN nunca "{name} passed": é o
                  eufemismo de velório. O verbo canônico é "parar de insistir". */}
              <p style={phaseTitle}>
                {isPt
                  ? `${enemy.name} parou de insistir aqui. O padrão dele reassenta noutro lugar.`
                  : `${enemy.name} stopped holding here. The pattern settles somewhere else.`}
              </p>
              {/* "+N Bits" e, raramente, o coraçãozinho — o emoji da string virou
                  glifo `favorite` 20 FILL `primary-ink` + "+1 heart" (D-J9). */}
              <p style={phaseLine}>
                <span className="sm2-num">{rewardMsg}</span>
                {gotHeart && (
                  <>
                    {' · '}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, verticalAlign: 'middle' }}>
                      <Icon name="favorite" size={20} fill={1} tone="primary" />
                      +1 {isPt ? 'coração' : 'heart'}
                    </span>
                  </>
                )}
              </p>
              {capBits && <p style={phaseLine} data-dungeon-bits-cap>{isPt ? 'Teto diário de Bits atingido — a descida segue, só sem Bits.' : 'Daily Bits cap reached — the descent goes on, just without Bits.'}</p>}
            </div>
          )}
          {phase === 'floor-clear' && (
            <div role="status" style={PANEL}>
              <p style={phaseTitle}>{isPt ? `Camada ${floor} limpa.` : `Layer ${floor} cleared.`}</p>
              {/* Copy §4: dá sentido ao escalonamento de tier (`LADDER_TIERS`)
                  sem falar em dificuldade como mérito. */}
              <p style={phaseLine}>{isPt ? 'A próxima camada é mais antiga. A fauna também.' : 'The next layer is older. So is what lives in it.'}</p>
              <p className="sm2-num" style={phaseLine}>{scoreLine}</p>
              {/* A cura é FATO em `muted`, não prêmio (D-J8). */}
              <p style={phaseLine}>{rewardMsg} · <span className="sm2-num">+{clearBonus(floor)} Bits</span></p>
              {/* O MARCO do andar 5 (uma vez por descida). Copy §4, o nó (§7, L4): o nome `Glitchtama` FICA
                  (`EXCECOES` da régua). "Usar" é o verbo da mochila. Fato, nunca "você dominou a masmorra" (L12). */}
              {milestoneNow && (
                <div data-dungeon-milestone>
                  <p style={phaseLine}>{isPt ? `Marco: a camada ${DUNGEON_MILESTONE_FLOOR} ficou para trás. Da fenda ele trouxe fragmentos que ainda não assentaram.` : `Milestone: layer ${DUNGEON_MILESTONE_FLOOR} is behind you. From the rift he brought fragments that haven't settled yet.`}</p>
                  <p style={phaseLine}>
                    {isPt
                      ? 'Um Glitchtama, com um dia inteiro preso dentro. Usar dá àquele dia o fechamento que ele não teve. (mochila)'
                      : 'A Glitchtama, with a whole day caught inside. Using it gives that day the closing it never had. (Backpack)'}
                  </p>
                  <p style={phaseLine}>{isPt ? 'A próxima descida ficou mais difícil.' : 'The next descent got harder.'}</p>
                </div>
              )}
              {capBits && <p style={phaseLine} data-dungeon-bits-cap>{isPt ? 'Teto diário de Bits atingido — a descida segue, só sem Bits.' : 'Daily Bits cap reached — the descent goes on, just without Bits.'}</p>}
            </div>
          )}
          {phase === 'ended' && (
            <div role="status" style={PANEL} data-dungeon-ended={endReason}>
              {/* Fim de descida SEM vereditos: não é derrota nem cobrança, é o HP que acabou — e ele volta com o tempo.
                  Copy §4 (L5, §7): perda só sobre o que foi apostado de propósito (a descida). Sem "descansar" (§5.12:
                  vocabulário da criatura que acaba) — o verbo é RECUPERAR. */}
              <p style={phaseTitle}>
                {endReason === 'sealed'
                  ? (isPt ? 'O caminho para baixo está lacrado por ora.' : 'The way further down is sealed for now.')
                  : endReason === 'energy'
                    ? (isPt ? 'A energia desta descida acabou. Ele volta à superfície.' : 'The energy for this descent ran out. He heads back up.')
                    : endReason === 'deep'
                      ? (isPt ? 'Mais fundo que isso, ele ainda não alcança.' : 'Deeper than this is still out of his reach.')
                      : (isPt ? 'Seu Soulmon ficou sem fôlego. A descida para aqui.' : 'Your Soulmon is out of breath. The descent stops here.')}
              </p>
              {endReason === 'sealed' && gs && (
                <p style={phaseLine} data-gate-masmorra>{gateLine('masmorraAlto', bondLevelFor(gs.totalXP ?? 0), language)}</p>
              )}
              {endReason === 'energy' && (
                <p style={phaseLine} data-dungeon-no-energy>
                  {isPt
                    ? 'Volte mais tarde: cada atividade concluída vira comida, e a comida enche a energia.'
                    : 'Come back later: each activity you finish becomes food, and food fills the energy.'}
                </p>
              )}
              {endReason === 'deep' && (
                <p style={phaseLine} data-dungeon-deep>
                  {isPt
                    ? `O Lv dele chega até a camada ${capCamadas}. O Lv cresce com os seus dias completos e a evolução.`
                    : `His Lv reaches down to layer ${capCamadas}. Lv grows with your complete days and evolution.`}
                </p>
              )}
              <DungeonSummary isPt={isPt} resumo={resumo} capBits={capBits} />
              <p className="sm2-num" style={phaseLine}>
                {isPt ? `Camada ${floor} · ${scoreLine}` : `Layer ${floor} · ${scoreLine}`}
              </p>
              <p style={phaseLine}>{isPt ? 'Seus corações continuam intactos.' : 'Your hearts are untouched.'}</p>
              {espera > 0 && (
                <p style={phaseLine} data-dungeon-recovering>
                  {isPt ? `Recuperando… pode descer de novo em ${formatarEspera(espera, true)}.` : `Recovering… ready to go down again in ${formatarEspera(espera, false)}.`}
                </p>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                {espera === 0 && temEnergia && (
                  <button type="button" onClick={startRun} style={{ ...sm2Button('primary'), flex: 1, minWidth: 0, padding: '0 8px' }}>
                    {isPt ? 'Descer de novo' : 'Go down again'}
                  </button>
                )}
                <button type="button" onClick={onExit} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 8px' }}>
                  {exitLabel}
                </button>
              </div>
            </div>
          )}
        </BattleStage>
      </TorcidaLayer>
    );
  }

  return (
    <GameRoot>
      <GameHeader
        run={false}
        title={isPt ? 'Masmorra' : 'Dungeon'}
        sub={isPt ? 'Descida automática' : 'Automatic descent'}
        closeLabel={exitLabel}
        onClose={exitRun}
      />

      {/* O VISOR do lobby: a cena do andar em `cover` e só o pet, centrado. */}
      <GameVisor height={88} scene={scene.bg}>
        <VisorSprite
          src={petSprite}
          alt=""
          style={{ left: '50%', marginLeft: -64, bottom: 8 }}
          data-visor-pet
        />
      </GameVisor>

      {/* Lobby */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <StatTag label={isPt ? 'Mais fundo' : 'Deepest'} value={recorde} />
        <StatTag label={isPt ? 'Energia' : 'Energy'} value={gs ? `${energia}/${energiaMax}` : '—'} />
        <StatTag label="HP" value={`${Math.round(hpLobby * 100)}%`} />
        {/* E1 (02/10/2026): o texto longo do lobby mora atrás do "?" — toque lê.
            I13: agora é o `InfoTip` padrão (antes era um "?" próprio). */}
        <InfoTip language={language} label={isPt ? 'Como funciona a descida' : 'How the descent works'} align="right">
          <span data-dungeon-help-panel style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span>
                  {isPt
                    ? `A descida é automática: as lutas vêm sozinhas, e a cada ${ladderLen} lutas você desce uma camada, até a ${DUNGEON_MAX_LAYER}. Cada camada gasta ${DUNGEON_ENERGY_PER_LAYER} de energia — a mesma da Home, que enche quando ele come o que você ganha concluindo atividades. O HP volta com o tempo, até com o app fechado (uns ${DUNGEON_HP_REGEN_FULL_HOURS} h do zero ao cheio; precisa de ${DUNGEON_MIN_HP_TO_ENTER_PCT}% para descer). Cada ${DUNGEON_MILESTONE_FLOOR} camadas são um marco: a descida seguinte começa dali, e o primeiro marco de cada descida rende um Glitchtama. Quanto mais Lv, mais fundo ele vai. Subir de nível enche a energia e o HP. Nunca custa seus corações.`
                    : `The descent is automatic: fights come one after another on their own, and every ${ladderLen} fights you go down a layer, all the way to ${DUNGEON_MAX_LAYER}. Each layer costs ${DUNGEON_ENERGY_PER_LAYER} energy — the same energy as Home, which fills when he eats what you earn by finishing activities. HP comes back over time, even with the app closed (about ${DUNGEON_HP_REGEN_FULL_HOURS} h from empty to full; you need ${DUNGEON_MIN_HP_TO_ENTER_PCT}% to go down). Every ${DUNGEON_MILESTONE_FLOOR} layers is a milestone: the next descent starts there, and the first milestone of each descent earns a Glitchtama. The higher his Lv, the deeper he goes. Leveling up refills energy and HP. It never costs your hearts.`}
                </span>
                <span>
                  {isPt
                    ? 'Aqui o assentamento falhou e as camadas se empilharam. Ninguém mora numa fenda.'
                    : 'Here the settling failed and the layers piled up. Nobody lives in a rift.'}
                </span>
                <span>
                  {isPt
                    ? 'Seu Soulmon vai sozinho: golpeia e se defende, e a energia dele fica de um inimigo para o outro. Com a energia cheia, ele solta o especial: toque no anel na hora certa. Quando o inimigo soltar o dele, deslize o dedo para o lado para esquivar.'
                    : 'Your Soulmon goes alone: it strikes and defends, and its energy carries over from one enemy to the next. With full energy it unleashes its special: tap the ring at the right moment. When the enemy unleashes its own, swipe sideways to dodge.'}
                </span>
          </span>
        </InfoTip>
      </div>
      {/* Fase 3 do Oráculo: o OFÍCIO da ficha e o jeito dele na fenda —
          uma palavra nomeada e uma frase de mundo sobre a criatura; o
          número fica dentro da run. Sem profissão, nada aqui. */}
      {profissaoRotulo && profissaoFrase && (
        <p style={phaseLine} data-profissao={profissao}>
          {isPt ? `Ofício ${profissaoRotulo} — ${profissaoFrase}` : `${profissaoRotulo} craft — ${profissaoFrase}`}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        {/* Antes de descer, o que a descida vai custar e até onde ela vai (REGISTRO §31): fatos, sem cobrança. */}
        {gs && (
          <p style={phaseLine} data-dungeon-plan className="sm2-num">
            {isPt
              ? `Começa na camada ${inicio} · ${DUNGEON_ENERGY_PER_LAYER} de energia por camada · dá para ${layersAffordable(energia)} agora · o Lv ${nivelJogador} chega até a ${capCamadas}`
              : `Starts at layer ${inicio} · ${DUNGEON_ENERGY_PER_LAYER} energy per layer · enough for ${layersAffordable(energia)} now · Lv ${nivelJogador} reaches layer ${capCamadas}`}
          </p>
        )}
        <button type="button" onClick={startRun} disabled={espera > 0 || !temEnergia} style={{ ...sm2Button('primary', espera > 0 || !temEnergia), width: '100%', maxWidth: 320 }}>
          {/* Copy §4: fenda se DESCE; não se "entra" nem se "inicia run". */}
          {isPt ? 'Descer' : 'Go down'}
        </button>
        {/* Abaixo do piso: recuperação, não punição — sem culpa, sem coração, sem Bits. Verbo RECUPERAR (a bíblia veta "descansar" sobre a criatura). */}
        {espera > 0 && (
          <p style={phaseLine} role="status" data-dungeon-recovering>
            {isPt ? `Recuperando… pode descer de novo em ${formatarEspera(espera, true)}.` : `Recovering… ready to go down again in ${formatarEspera(espera, false)}.`}
          </p>
        )}
        {/* Sem energia: um convite, nunca cobrança. A energia volta comendo (cada atividade concluída vira comida). */}
        {!temEnergia && (
          <p style={phaseLine} role="status" data-dungeon-no-energy>
            {isPt
              ? 'Sem energia por agora. Conclua algo do seu dia, dê a comida a ele e volte para descer.'
              : 'No energy for now. Finish something from your day, feed him, and come back to go down.'}
          </p>
        )}
      </div>
    </GameRoot>
  );
}

/** O RESUMO da descida (REGISTRO §31): o que ela rendeu, em linhas de fato — sem placar de cobrança. */
function DungeonSummary({ isPt, resumo, capBits }: {
  isPt: boolean; capBits: boolean;
  resumo: { layers: number; enemies: number; bits: number; hearts: number; glitchtama: number; fragments: number; energy: number; recordFrom: number; recordTo: number };
}) {
  const linhas: string[] = [
    isPt ? `Camadas limpas: ${resumo.layers}` : `Layers cleared: ${resumo.layers}`,
    isPt ? `Criaturas que pararam de insistir: ${resumo.enemies}` : `Creatures that stopped holding: ${resumo.enemies}`,
    capBits
      ? (isPt ? `Bits: ${resumo.bits} (o teto diário de Bits já foi atingido)` : `Bits: ${resumo.bits} (the daily Bits cap was already reached)`)
      : `Bits: ${resumo.bits}`,
  ];
  if (resumo.hearts > 0) linhas.push(isPt ? `Coraçãozinho: +${resumo.hearts} (mochila)` : `Little heart: +${resumo.hearts} (Backpack)`);
  if (resumo.glitchtama > 0) linhas.push(isPt ? `Glitchtama: +${resumo.glitchtama} (mochila)` : `Glitchtama: +${resumo.glitchtama} (Backpack)`);
  if (resumo.fragments > 0) linhas.push(isPt ? `Fragmentos do Soulsmith: +${resumo.fragments}` : `Soulsmith fragments: +${resumo.fragments}`);
  if (resumo.recordTo > resumo.recordFrom) linhas.push(isPt ? `Mais fundo até hoje: camada ${resumo.recordTo}` : `Deepest so far: layer ${resumo.recordTo}`);
  if (resumo.energy > 0) linhas.push(isPt ? `Energia usada: ${resumo.energy}` : `Energy used: ${resumo.energy}`);
  return (
    <ul data-dungeon-summary aria-label={isPt ? 'Resumo da descida' : 'Descent summary'} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {linhas.map(l => <li key={l} className="sm2-num" style={phaseLine}>{l}</li>)}
    </ul>
  );
}
