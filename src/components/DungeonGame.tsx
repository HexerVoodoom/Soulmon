import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useBackLayer } from '../utils/backStack';
import { RewardLine } from './ui/RewardLine';
import { STAIRS_ICON, ENERGY_ICON, rewardItemLabel } from '../utils/rewardIcons';
import { InfoTip } from './ui/InfoTip';
import { sm2Button } from './form/FormKit';
import { GameRoot, GameHeader, GameVisor, VisorSprite, StatTag, phaseTitle, phaseLine } from './games/GameKit';
import { BitsAmount } from './ui/BitsAmount';
import { ResultScreen } from './games/ResultScreen';
import { RankingPanel } from './RankingPanel';
import { applyRiftLayer, riftBestThisMonth, RIFT_RANKING_FROM, RIFT_GAME_ID, type RiftMonthState } from '../utils/endlessRift';
import { submitScore as submitRankingScore } from '../utils/rankings';
import { getSpriteForStage } from '../utils/sprites';
import { usePetScale } from '../hooks/usePetScale';
import { petScaleStyle } from '../utils/spriteScale';
import { playDefeat, playVictory } from '../utils/sounds';
import { clearBonus } from '../utils/dungeon';
import {
  DUNGEON_AUTO_FIGHT_MS, DUNGEON_MILESTONE_FLOOR, DUNGEON_MIN_HP_TO_ENTER_PCT, DUNGEON_HP_REGEN_FULL_HOURS,
  hpAgora, gravarHp, podeDescer, msAteDescer, formatarEspera,
  DUNGEON_ENERGY_PER_LAYER, DUNGEON_FIGHTS_PER_FLOOR, DUNGEON_MAX_LAYER, dungeonLayerCap, startLayerFor, isMilestoneLayer,
  layersAffordable, spendLayer, layerRefusal, recordLayerCleared, sanitizeDepthRecord,
  nextDungeonSpeed, sanitizeDungeonSpeed, DUNGEON_AWAY_MAX_HOURS, type DungeonSpeed, type DungeonAway, type DungeonAwayPlayer,
} from '../utils/dungeonIdle';
import { applyRiftLayerPaid, dungeonWaveOf, settleDungeonAwayNow, type AwayReport } from '../utils/dungeonAway';
import { marcarTelaMasmorra } from '../utils/dungeonScreenOpen';
import { pushDrop, popDrop, type DropGroup, type DropKind } from '../utils/dungeonDrops';
import { DropNotice } from './games/DropNotice';
import { HEART_ITEM_EMOJI, SPARK_ITEM_EMOJI } from '../utils/shop';
import { canOfferRevive, consumeOne, addOne, heartsOwned, sparksOwned, reviveSeed, reviveStart, rollSparkDrop, SPARK_ENERGY } from '../utils/dungeonRevive';
import { readLocal, writeLocal } from '../utils/safeStorage';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { getMaxEnergyForStage } from '../types/progression';
import { settleEnergy } from '../utils/hunger';
import { addFragments } from '../utils/equipment';
import { MINIGAME_BITS_PER_DAY, minigameBitsToday, remainingMinigameBits } from '../utils/currencies';
import { playerDayKey } from '../utils/playerDay';
import { newDefenseSeed } from '../utils/autoDefesa';
import {
  getDungeonBest, recordDungeonScore, LADDER_TIERS,
  type DungeonEnemy,
} from '../utils/dungeon';
import { dungeonFamily, dungeonFight, dungeonFightSeed, dungeonPlayerSide, type DungeonPlayerCfg } from '../utils/dungeonFight';
import { CHEER, ENERGY_TRIGGER } from '../utils/combate/specials';
import { hpPoints } from '../utils/combate/fight';
import { CHEER_TAPS_FULL } from '../utils/energia';
import type { GroupResult } from '../utils/combate/group';
import { stageSkillsFor, type FichaSkills } from '../utils/soulProfile/ficha/stageSkillsFor';
import { fighterIdentity } from '../utils/fighterIdentity';
import { fxElementId, dungeonEnemyElement, dungeonFoeSpecialLabel, prefersReducedMotion, elementStrikeForm, specialLabel } from '../utils/combatFx';
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
import { bondLevelFor, XP_DUNGEON_FLOOR, XP_DUNGEON_RUN } from '../utils/bond';
import { RewardPreview } from './ui/RewardPreview';
import type { LText } from '../utils/oracle';
import type { Language } from '../utils/i18n';
import { wildFoeLabel } from '../utils/wildFoeLabel';

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
 * Vínculo fecha o próximo andar alto); perder não custa coração nem Bits. Sem Pausar (§71); Sair é o X da cena.
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
export { clearBonus };

type Phase = 'intro' | 'fight' | 'enemy-down' | 'floor-clear' | 'ended' | 'away';

/** O cartão de resultado sobre a cena (entre inimigos, camadas e no fim). */

/** Texto só para leitor de tela (a camada já está no título; a linha viva não se repete na tela). */
const SR_ONLY: CSSProperties = {
  position: 'absolute', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
};

const PANEL: CSSProperties = {
  position: 'absolute', left: 12, right: 12, zIndex: 7, boxSizing: 'border-box',
  bottom: 'calc(var(--sm-corner-h, 68px) + env(safe-area-inset-bottom, 0px) + 62px)',
  maxHeight: '52vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: 12,
  backgroundColor: 'color-mix(in srgb, var(--sm2-surface) 92%, transparent)',
  border: '1px solid var(--sm2-line)', borderRadius: 'var(--sm2-radius-md)',
};

// ── Game ───────────────────────────────────────────────────────────────────
export function DungeonGame({ evolutionStage, demoCharacterId, petElement, skills, profissao, profissaoNome, language, onEnter, onLose, onHeartDrop, onGlitchtama, onFloorCleared, onRunEnd, onEnemyDefeated, onEarnPoints, onExit, onExitToMap, bits = 0, onSpendBits, rankSaveId }: {
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
  /** beta3 A4: uma descida que terminou (energia/HP/teto) com ≥1 camada limpa = UMA run para a missão semanal. */
  onRunEnd?: () => void;
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
  /** Endless Rift (M6): saveId para enviar o score mensal ao ranking (só a partir da faixa 3) e ler o painel. Ausente = sem ranking. */
  rankSaveId?: string;
  onExit: () => void;
  /** Sair DIRETO para o mapa (o ícone do mapa no lugar do X, 14/10/2026). Ausente (demo/testes) → `onExit`. */
  onExitToMap?: () => void;
}) {
  // Música (11/10/2026): na masmorra toca o "Stone Hall Combat" (se o interruptor "Música" está ligado; 19/10/2026). Abrir o jogo é o gesto do jogador.

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
  const hpMax = hpPoints(dungeonPlayerSide(jogador).combatant.hp);

  /* ⏩ AVANÇO RÁPIDO (REGISTRO §36): 1×/3×, preferência do aparelho. Só encurta o relógio da cena e a pausa entre lutas. */
  const [speed, setSpeedState] = useState<DungeonSpeed>(() => sanitizeDungeonSpeed(readLocal(STORAGE_KEYS.DUNGEON_SPEED)));
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const cycleSpeed = () => {
    const n = nextDungeonSpeed(speedRef.current);
    speedRef.current = n;
    setSpeedState(n);
    writeLocal(STORAGE_KEYS.DUNGEON_SPEED, String(n));
  };
  /* 🎁 O modalzinho de DROP: fila (a lógica é de `utils/dungeonDrops.ts`; em 3× tudo vira um aviso só). */
  const [drops, setDrops] = useState<DropGroup[]>([]);
  const dropSeq = useRef(0);
  const noteDrop = (kind: DropKind, qty: number) => setDrops(q => pushDrop(q, kind, qty, speedRef.current, ++dropSeq.current));
  const closeDrop = useCallback(() => setDrops(q => popDrop(q)), []);
  /** O que a ausência rendeu (a descida seguiu sozinha) — o cartão que abre ao voltar. */
  const [awayReport, setAwayReport] = useState<AwayReport | null>(null);
  const awaySettledRef = useRef(false);
  const [enemies, setEnemies] = useState<DungeonEnemy[]>([]);
  const [enemyIdx, setEnemyIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('intro');
  const [rewardMsg, setRewardMsg] = useState('');
  /** Bits do último inimigo (D-62: vão ao `BitsAmount`, não a uma string). */
  const [rewardBits, setRewardBits] = useState(0);
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
  /** 💗 A oferta "Usar Coraçãozinho" aberta na queda (30/10/2026, REGISTRO §180) e a CONTINUAÇÃO da luta depois dela: n-ésima retomada + HP do inimigo na queda. */
  const [reviveOffer, setReviveOffer] = useState(false);
  const contRef = useRef<{ n: number; foeFrac: number } | null>(null);
  const lastFoeFracRef = useRef(1);
  const [hpFrac, setHpFrac] = useState(1);
  /** A confirmação de sair está aberta: a luta espera. */
  const [pausadoConfirm, setPausado] = useState(false);
  /* Sem botão de Pausar (dono, 15/10/2026, REGISTRO §71): só a pausa de sistema (confirmação de sair aberta) segura a luta. */
  const pausado = pausadoConfirm;
  /** Por que a descida acabou: HP zerado, energia acabou, o portão do Vínculo fechou, ou o teto de camadas do Lv. */
  const [endReason, setEndReason] = useState<'hp' | 'sealed' | 'energy' | 'deep' | 'daily'>('hp');
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
  const petScale = usePetScale(evolutionStage, petSprite);
  const ladderLen = LADDER_TIERS.length;
  const scene = runScenes[(floor - 1) % Math.max(1, runScenes.length)] ?? DUNGEON_SCENES[0];
  // A identidade de combate (dono único): o mesmo golpe básico/especial da Arena, do Torneio e do PvP.
  const ident = useMemo(() => fighterIdentity(par, petElement), [par, petElement]);
  const petEl = fxElementId(ident.basico.elemento);
  const enemyEl = fxElementId(dungeonEnemyElement(enemy));
  const foeMax = enemy ? hpPoints(enemy.foe.combatant.hp) : 1;

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
  /** O ícone do mapa (e o voltar do Android): sai da TELA direto para o mapa, sem confirmação. Sair ≠ abandonar: o registro `dungeonAway`
      (posição persistida) NÃO é tocado — a descida segue; quem retira o Soulmon é o "Retirar da masmorra" da Home / do cartão de volta. */
  const exitToMap = () => {
    recordDungeonScore(runScoreRef.current);
    (onExitToMap ?? onExit)();
  };
  useBackLayer(true, exitToMap);

  /** Põe um inimigo da escada na luta. */
  const enterEnemy = (list: DungeonEnemy[], idx: number) => {
    enemiesRef.current = list;
    enemyIdxRef.current = idx;
    contRef.current = null; // luta nova: sem continuação pendente
    setEnemyIdx(idx);
    setFightKey(k => k + 1);
  };

  /** A onda de uma CAMADA: a força é a do andar EFETIVO (`effectiveFloor`: a zona de conforto do Lv luta no andar 1);
      o sabor e a semente da luta saem da camada de verdade, para duas camadas da zona não repetirem a mesma luta. */
  const waveOf = (layer: number) => dungeonWaveOf(runSeedRef.current, layer, nivelJogador, evolutionStage);

  /* 🔋 ENERGIA, TETO E RECORDE (REGISTRO §31). Sem provider (demo, testes) não há save: nada é cobrado nem fecha. */
  const bond = gs ? bondLevelFor(gs.totalXP ?? 0) : 1;
  const capCamadas = gs ? dungeonLayerCap(nivelJogador, bond) : Number.POSITIVE_INFINITY;
  const recorde = sanitizeDepthRecord(gs?.dungeonDepthRecord);
  /** A energia de AGORA (a regeneração até o instante já acertada), não a do último tick. */
  const energia = gs ? settleEnergy(gs, agora).energyPoints ?? 0 : Number.POSITIVE_INFINITY;
  const energiaMax = getMaxEnergyForStage(evolutionStage);
  /** 🚧 Por que a PRÓXIMA camada não pode começar (energia ou limite diário) — a UI só ESPELHA o que `spendLayer` decide no updater. */
  const recusaCamada = gs ? layerRefusal(gs, agora) : undefined;
  const temEnergia = !gs || recusaCamada !== 'no-energy';
  const inicio = gs ? startLayerFor(recorde, capCamadas) : 1;
  /** O ESPELHO do save no instante do gasto: a tela decide por ele, mas quem manda é o updater (`spendLayer` reconfere energia e limite
      diário sobre o `prev`). Cada camada paga atualiza o espelho na hora, para dois toques no mesmo lote não passarem os dois. */
  const gsRef = useRef(gs);
  gsRef.current = gs;
  // a tela é a dona da conta da descida enquanto está montada: o retorno automático da Home espera (sem crédito duplicado)
  useEffect(() => marcarTelaMasmorra(), []);
  /** Começa UMA camada (energia + limite diário, pela porta única). Devolve se deu (sem provider, sempre). */
  const pagarCamada = (): boolean => {
    if (!ctx) return true;
    const now = Date.now();
    const atual = gsRef.current;
    if (!atual || layerRefusal(atual, now)) return false;
    gsRef.current = spendLayer(atual, now);
    ctx.setGameState(prev => spendLayer(prev, now));
    resumoRef.current.energy += DUNGEON_ENERGY_PER_LAYER;
    return true;
  };
  /** Registra a camada LIMPA: recorde (só sobe) e os fragmentos dos marcos de profundidade (1× na vida). */
  const registrarCamada = (layer: number) => {
    if (!ctx) return;
    const { marks } = recordLayerCleared({ dungeonDepthRecord: recordeRef.current }, layer);
    recordeRef.current = Math.max(recordeRef.current, layer);
    resumoRef.current.recordTo = Math.max(resumoRef.current.recordTo, layer);
    // Endless Rift (M6): score mensal e faixas do mês. As faixas são pagas DENTRO do updater (`applyRiftLayerPaid`, puro e idempotente sobre o
    // `prev`: a faixa só paga se o `prev` ainda não a tinha) — o MESMO caminho da conta de quem ficou fora. Nada de cópia local congelada.
    const agoraMs = Date.now();
    const riftBefore = riftBestThisMonth(riftRef.current, agoraMs); // só para decidir o envio ao ranking; não paga nada
    riftRef.current = applyRiftLayer(riftRef.current, layer, agoraMs).next;
    if (rankSaveId && (riftRef.current.riftMonth?.best ?? 0) >= RIFT_RANKING_FROM && (riftRef.current.riftMonth?.best ?? 0) > riftBefore) {
      // melhor do mês a partir da faixa 3: entra no ranking mensal (o servidor guarda só o melhor; falha de rede é silenciosa)
      submitRankingScore(RIFT_GAME_ID, rankSaveId, riftRef.current.riftMonth?.best ?? 0, 'monthly').catch(() => { /* sem rede: o ranking nunca atrapalha a descida */ });
    }
    const frag = marks.reduce((a, m) => a + m.fragments, 0);
    resumoRef.current.fragments += frag;
    if (frag > 0) noteDrop('fragments', frag);
    ctx.setGameState(prev => {
      const r = recordLayerCleared(prev, layer);
      const rr = applyRiftLayerPaid(r.next, layer, agoraMs, playerDayKey(new Date(agoraMs), prev.playerDayTz));
      // idempotente por camada (o StrictMode roda o updater 2×): o resumo soma isto no fim da descida
      riftPagoRef.current.set(layer, { bits: rr.bits, fragments: rr.fragments });
      const ganho = r.marks.reduce((a, m) => a + m.fragments, 0);
      return ganho > 0 ? addFragments(rr.next, ganho) : rr.next;
    });
  };
  /** O que as faixas do mês pagaram nesta descida, por camada (preenchido DENTRO do updater; ver acima). */
  const riftPagoRef = useRef(new Map<number, { bits: number; fragments: number }>());
  const recordeRef = useRef(recorde);
  const riftRef = useRef<RiftMonthState>({ riftMonth: gs?.riftMonth });
  const riftBest = gs ? riftBestThisMonth({ riftMonth: gs.riftMonth }, agora) : 0;

  /** Grava o HP da descida no save (fração do máximo + instante). Só o cliente: não compra vantagem. */
  const salvarHp = (frac: number) => {
    ctx?.setGameState(prev => ({ ...prev, dungeonHp: gravarHp(frac, Date.now()) }));
  };
  /** O instantâneo do jogador que vai junto da descida: a conta de quem ficou fora (`utils/dungeonAway.ts`) não depende de hook nem de tela. */
  const instantaneoDoJogador = (): DungeonAwayPlayer => {
    const j = jogadorRef.current;
    const c = j.combatant;
    return {
      level: c.level, atk: c.atk, def: c.def, spd: c.spd, hp: c.hp, bonus: c.bonus,
      fam: j.family, prof: profissao ?? undefined, sh: rift.startShield ?? 0, hb: rift.healBoost ?? 0, rb: rift.riftBits ?? 0, stage: evolutionStage,
    };
  };
  /** 🏠 GRAVA onde a descida está (camada, lugar na escada, HP, energia): é isso que faz sair da tela NÃO cancelar nada — e que
      deixa o Soulmon OCUPADO na masmorra (`soulmonNaMasmorra`). Sem provider (demo, testes) não há save e nada é gravado. */
  const gravarAway = (layer: number, slot: number) => {
    if (!ctx) return;
    const reg: DungeonAway = {
      since: Date.now(), seed: runSeedRef.current, layer, slot, hp: hpCarryRef.current, en: energyCarryRef.current,
      ms: milestoneRef.current, player: instantaneoDoJogador(),
    };
    ctx.setGameState(prev => ({ ...prev, dungeonAway: reg }));
  };
  /** A descida acabou (ou o jogador retirou o Soulmon): ele volta para casa. */
  const limparAway = () => { ctx?.setGameState(prev => (prev.dungeonAway ? { ...prev, dungeonAway: undefined } : prev)); };
  /** O estado de onde sai o HP de agora (sem provider — demo, testes —: cheio). */
  const hpState = { dungeonHp: gs?.dungeonHp };

  // Começa a descida no andar 1 (level = base persistida). O piso de HP é o único portão — e não custa nada.
  const startRun = () => {
    const now = Date.now();
    if (!podeDescer(hpState, now)) return;
    resumoRef.current = { layers: 0, enemies: 0, bits: 0, hearts: 0, glitchtama: 0, fragments: 0, energy: 0, recordFrom: recorde, recordTo: recorde };
    riftPagoRef.current.clear();
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
    setAwayReport(null);
    gravarAway(inicio, 0); // a descida já fica registrada: fechar o app agora não a perde
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
    if (ctx && rollSparkDrop()) { ctx.setGameState(prev => ({ ...prev, foodInventory: addOne(prev.foodInventory, SPARK_ITEM_EMOJI) })); noteDrop('spark', 1); }
    const caiuCoracao = onHeartDrop();
    if (caiuCoracao) { resumoRef.current.hearts += 1; noteDrop('heart', 1); }
    setGotHeart(caiuCoracao);
    setRewardMsg(''); setRewardBits(e.points);
    if (enemyIdxRef.current + 1 >= enemiesRef.current.length) clearFloor();
    else { gravarAway(e.floor, enemyIdxRef.current + 1); setPhase('enemy-down'); }
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
      noteDrop('glitchtama', 1);
      onGlitchtama();                             // marco → 🌀 Glitchtama (1 uso/dia: `specialItemUse.ts`)
    } else {
      setMilestoneNow(false);
    }
    // A cura entre andares (`curaAndar` do ofício) é fração do HP máximo; fica fora da régua do TTK.
    const cura = pve.cura + rift.healBoost; // Tarefa B (`tal-pve-03`): a cura entre andares sobe poucos pontos do HP máximo
    // VIDA INTEIRA (30/10/2026): a cura é em pontos inteiros e o texto mostra exatamente o que a barra subiu
    const ptsNow = Math.round(Math.max(0, hpCarryRef.current) * hpMax);
    const heal = Math.max(0, Math.min(hpMax - ptsNow, Math.round(hpMax * cura)));
    hpCarryRef.current = (ptsNow + heal) / hpMax;
    setHpFrac(hpCarryRef.current);
    salvarHp(hpCarryRef.current);
    setRewardMsg(isPt ? `Recuperou ${heal} de HP` : `Recovered ${heal} HP`);
    // PR7: os andares ALTOS têm portão pelo Vínculo. Fechado, a descida termina aqui — sem cobrança.
    if (!floorOpen(floor + 1)) { endDescent(gs && floor + 1 > capCamadas && masmorraFloorOpen(floor + 1, bond) ? 'deep' : 'sealed'); return; }
    // 🔋 A próxima camada custa energia: sem ela, a descida para aqui com uma frase calma (nunca cobrança).
    if (!temEnergiaAgora()) { endDescent('energy'); return; }
    gravarAway(floor, DUNGEON_FIGHTS_PER_FLOOR); // camada limpa; a de baixo ainda não foi paga
    setPhase('floor-clear');
  };

  /** Sem provider (demo, testes) não há Vínculo para medir e nada fecha. */
  const floorOpen = (f: number) => !gs || masmorraFloorOpen(f, bondLevelFor(gs.totalXP ?? 0)) && f <= capCamadas;
  const temEnergiaAgora = () => !ctx || !gsRef.current || layerRefusal(gsRef.current, Date.now()) === undefined;

  const endDescent = (why: 'hp' | 'sealed' | 'energy' | 'deep' | 'daily') => {
    // as faixas do mês foram pagas no estado (updater): entram no resumo aqui, uma vez
    for (const v of riftPagoRef.current.values()) { resumoRef.current.bits += v.bits; resumoRef.current.fragments += v.fragments; }
    riftPagoRef.current.clear();
    setResumo({ ...resumoRef.current });
    if (resumoRef.current.layers > 0) onRunEnd?.();
    recordDungeonScore(runScoreRef.current);
    setBest(getDungeonBest());
    setRunScore(runScoreRef.current);
    setEndReason(why);
    setAgora(Date.now());
    limparAway(); // a descida acabou: o Soulmon volta para casa
    setPhase('ended');
  };

  /* A luta é o núcleo v3 (`utils/combate/`, `groupFightSteps` com 1 inimigo): o `dungeonFight` monta o
     jogador (`soulCombatant` + o jeito do ofício), o inimigo relativo ao level (`dungeonFoe`), a defesa
     automática e o contra-ataque; o relógio da cena é o `useGroupBattle`, que consome os eventos no relógio do
     núcleo. A defesa perfeita não dá dano; o especial do inimigo (o mega) pode ser esquivado. */
  const rodadaDoNucleo = useCallback((): GroupRound => {
    const e = enemiesRef.current[enemyIdxRef.current];
    const f = dungeonFight(jogadorRef.current, e.foe, dungeonFightSeed(runSeedRef.current, e.floor, e.slot), e.slot === 0); // o escudo de largada (`tal-pve-07`) é só do 1º da escada de cada andar
    const cont = contRef.current; // continuação após o Coraçãozinho: semente derivada, inimigo com o HP da queda
    return {
      player: f.player, foes: f.foes, seed: cont ? reviveSeed(f.seed, cont.n) : f.seed,
      startHp: hpCarryRef.current, startEnergy: energyCarryRef.current,
      ...(cont ? { options: { startFoesHp: reviveStart(cont.foeFrac).foesHp } } : {}),
      hitScale: f.hitScale,
      castScale: ({ who, ring, dodge }) => f.castScale({ who, ring, dodge }),
    };
  }, []);

  const cena = useCallback((): GroupScene => {
    const e = enemiesRef.current[enemyIdxRef.current];
    const p = jogadorRef.current;
    const foeEl = fxElementId(dungeonEnemyElement(e));
    return {
      playerMaxHp: hpPoints(dungeonPlayerSide(p).combatant.hp),
      foeMaxHp: [hpPoints(e?.foe.combatant.hp ?? 1)],
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
    // 💗 Antes da derrota: com ao menos 1 Coraçãozinho, oferece a volta com 50% do HP (a luta continua de onde parou).
    if (ctx && canOfferRevive(gsRef.current?.foodInventory)) {
      lastFoeFracRef.current = battleRef.current?.foesHp[0] ?? 1;
      setReviveOffer(true);
      return;
    }
    perder();
  };
  /** A derrota de sempre (sem oferta, ou oferta recusada). */
  const perder = () => {
    // Derrota ou empate (o empate conta como derrota, sem custo): o HP zerou e a descida acaba.
    // C-6 (run `som-01`): sem som de degeneracao. Perder a descida nao custa coracao nem Bits —
    // `handleDungeonLose` é um callback vazio, de propósito. O HP volta com o TEMPO (`hpAgora`).
    playDefeat(); // D-92: o som NEUTRO de fim de luta (`arcade`) — não é o `playDegenerate`, que segue só do App (C-6).
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

  const aceitarRevive = () => {
    if (!reviveOffer || !ctx || !canOfferRevive(gsRef.current?.foodInventory)) return;
    setReviveOffer(false);
    if (gsRef.current) gsRef.current = { ...gsRef.current, foodInventory: consumeOne(gsRef.current.foodInventory, HEART_ITEM_EMOJI) };
    ctx.setGameState(prev => ({ ...prev, foodInventory: consumeOne(prev.foodInventory, HEART_ITEM_EMOJI) }));
    const st = reviveStart(lastFoeFracRef.current);
    contRef.current = { n: (contRef.current?.n ?? 0) + 1, foeFrac: st.foesHp[0] };
    hpCarryRef.current = st.hp;
    energyCarryRef.current = st.energy;
    setHpFrac(st.hp);
    salvarHp(st.hp);
    setFightKey(k => k + 1);
  };
  const recusarRevive = () => { setReviveOffer(false); perder(); };
  const usarFaisca = () => {
    if (!ctx || sparksOwned(gsRef.current?.foodInventory) < 1) return;
    if (gsRef.current) gsRef.current = { ...gsRef.current, foodInventory: consumeOne(gsRef.current.foodInventory, SPARK_ITEM_EMOJI) };
    ctx.setGameState(prev => ({ ...prev, foodInventory: consumeOne(prev.foodInventory, SPARK_ITEM_EMOJI) }));
    battleRef.current?.boostEnergy(SPARK_ENERGY);
  };
  const battle = useGroupBattle({
    running: phase === 'fight' && !!enemy,
    paused: pausado, reduced: reduzido.current, runKey: fightKey, seed: seedLuta,
    round: rodadaDoNucleo, scene: cena, onEnd: aoFimDaLuta, torcida: true,
    speed,
    // §202 (dono, 30/10/2026): o anel e a esquiva voltam a ser do JOGADOR na tela (o especial automático do §36 fica só na conta fora do app).
  });

  const battleRef = useRef<typeof battle | null>(null);
  battleRef.current = battle;

  // O próximo passo da descida, SEM toque: outro inimigo do andar, ou o andar de baixo (sem teto).
  const avancar = () => {
    if (phase === 'enemy-down') {
      enterEnemy(enemies, enemyIdx + 1); // a energia do pet PERSISTE
      setRewardMsg('');
      setPhase('fight');
    } else if (phase === 'floor-clear') {
      const f = floor + 1;
      if (!pagarCamada()) { endDescent('energy'); return; } // energia ou limite diário podem ter mudado entre o fim do andar e agora
      const list = waveOf(f);
      setFloor(f);
      setEnemies(list);
      enterEnemy(list, 0);
      setRewardMsg('');
      setMilestoneNow(false);
      gravarAway(f, 0);
      setPhase('fight');
    }
  };
  const avancarRef = useRef(avancar);
  avancarRef.current = avancar;

  /** Põe a tela na posição de um registro `dungeonAway` (a descida que seguiu sozinha enquanto o jogador estava fora). */
  const posicionar = (a: DungeonAway, hp: number) => {
    runSeedRef.current = a.seed;
    setSeedLuta(a.seed);
    const list = waveOf(a.layer);
    setRunScenes(buildRunScenes());
    setStartLayer(a.layer);
    setFloor(a.layer);
    setEnemies(list);
    hpCarryRef.current = hp;
    energyCarryRef.current = a.en;
    setHpFrac(hp);
    milestoneRef.current = a.ms;
    setMilestoneNow(false);
    runScoreRef.current = 0;
    setRunScore(0);
    enterEnemy(list, Math.min(a.slot, list.length - 1));
  };
  /** O Soulmon sai da masmorra de vez (o botão "Retirar da masmorra"): o que rendeu até aqui já foi creditado; ele volta para casa. */
  const retirar = () => {
    recordDungeonScore(runScoreRef.current);
    ctx?.setGameState(prev => ({ ...prev, dungeonAway: undefined, dungeonHp: gravarHp(hpCarryRef.current, Date.now()) }));
    onExit();
  };
  // 🏠 AO ENTRAR: se a descida seguiu sozinha enquanto o jogador estava fora, acerta a conta (UMA vez) e mostra o que rendeu.
  useEffect(() => {
    if (awaySettledRef.current || !ctx || !gs?.dungeonAway) return;
    awaySettledRef.current = true;
    const antes = gs.dungeonAway;
    const r = settleDungeonAwayNow(gs, ctx.setGameState, Date.now(), false);
    if (!r) return;
    const { report, away, hp } = r;
    resumoRef.current = {
      layers: report.layers, enemies: report.enemies, bits: report.bits, hearts: report.hearts, glitchtama: report.glitchtama,
      fragments: report.fragments, energy: report.energy, recordFrom: report.recordFrom, recordTo: report.recordTo,
    };
    setResumo({ ...resumoRef.current });
    recordeRef.current = Math.max(recordeRef.current, report.recordTo);
    if (!away) {
      // a descida acabou sozinha (HP, energia, portão ou teto): o Soulmon já voltou para casa
      posicionar({ ...antes, layer: report.toLayer, slot: DUNGEON_FIGHTS_PER_FLOOR - 1 }, hp);
      setAwayReport(report);
      setEndReason((report.ended === 'energy' || report.ended === 'sealed' || report.ended === 'deep' || report.ended === 'daily') ? report.ended : 'hp');
      setAgora(Date.now());
      setPhase('ended');
      return;
    }
    posicionar(away, hp);
    if (report.enemies === 0 && report.layers === 0) {
      setPhase(away.slot >= DUNGEON_FIGHTS_PER_FLOOR ? 'floor-clear' : 'fight'); // não houve avanço para contar: segue direto
    } else {
      setAwayReport(report);
      setPhase('away'); // o cartão "enquanto você esteve fora" — a luta espera o "Ver a descida"
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const verDescida = () => {
    const a = ctx?.gameState.dungeonAway;
    setAwayReport(null);
    setPhase(a && a.slot >= DUNGEON_FIGHTS_PER_FLOOR ? 'floor-clear' : 'fight');
  };
  // O relógio entre lutas: uma a cada `DUNGEON_AUTO_FIGHT_MS`; pausar (ou a confirmação de sair) o segura.
  useEffect(() => {
    if ((phase !== 'enemy-down' && phase !== 'floor-clear') || pausado) return;
    const t = setTimeout(() => avancarRef.current(), DUNGEON_AUTO_FIGHT_MS / speed);
    return () => clearTimeout(t);
  }, [phase, pausado, fightKey, floor, speed]);

  // No lobby, repinta a contagem de recuperação (o valor vem de `hpAgora`, nunca é acumulado aqui).
  useEffect(() => {
    if (phase !== 'intro' && phase !== 'ended') return;
    const t = setInterval(() => setAgora(Date.now()), 30_000);
    return () => clearInterval(t);
  }, [phase]);

  // S18: lobby, fim da descida e retorno (intro/ended/away) tocam o "Dungeon Theme"; a descida (luta, entre lutas, entre andares: o
  // intervalo é de 4 s) segue no "Stone Hall Combat" — trocar de faixa a cada andar seria barulho, não música.
  const emDescida = phase === 'fight' || phase === 'enemy-down' || phase === 'floor-clear';
  useEffect(() => entrarNaSuperficie(emDescida ? 'masmorra' : 'masmorra-mapa'), [emDescida]);

  const inStage = enemies.length > 0 && phase !== 'intro';
  const capBits = !!gs && minigameBitsToday(gs, playerDayKey(new Date(), gs.playerDayTz)) >= MINIGAME_BITS_PER_DAY;
  /** Quanto falta para o HP chegar ao piso de entrada (0 = já pode descer). */
  const espera = msAteDescer(hpState, agora);
  const exitLabel = isPt ? 'Sair' : 'Exit';
  const scoreLine = isPt ? `Placar: ${runScore} · Recorde: ${best}` : `Score: ${runScore} · Best: ${best}`;
  /** O indicador único do HUD: "Camada 3 · luta 2 de 6" / "Layer 3 · fight 2 of 6". */
  const hudLabel = isPt ? `Camada ${floor} · luta ${enemyIdx + 1} de ${ladderLen}` : `Layer ${floor} · fight ${enemyIdx + 1} of ${ladderLen}`;

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
        onTap={battle.cheer}
        active={fighting && !pausado && battle.phase === 'idle'} /* torcida de volta na Masmorra (dono, 15/10/2026, REGISTRO §70) */
        isPt={isPt}
        style={BATTLE_LAYER_STYLE}
        mascot
        belowMascot={!ended && phase !== 'away' ? (<>
          {fighting && pronto && sparksOwned(gs?.foodInventory) > 0 && (
            <button type="button" data-dungeon-spark onClick={usarFaisca} disabled={battle.petEnergy >= ENERGY_TRIGGER || reviveOffer}
              aria-label={isPt ? `Faísca de Alma (${sparksOwned(gs?.foodInventory)}): enche a barra do especial` : `Soul Spark (${sparksOwned(gs?.foodInventory)}): fills the special bar`}
              style={{ pointerEvents: 'auto', background: 'none', border: 'none', padding: 0, minWidth: 44, minHeight: 44, cursor: 'pointer', color: 'var(--sm2-viewport-ink)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, fontWeight: 700, opacity: battle.petEnergy >= ENERGY_TRIGGER ? 0.4 : 1 }}>
              <img src={ENERGY_ICON} alt="" width={20} height={20} style={{ imageRendering: 'pixelated' }} />
              <span className="sm2-num">{sparksOwned(gs?.foodInventory)}</span>
            </button>
          )}
          <button
            type="button"
            data-dungeon-speed={speed}
            onClick={cycleSpeed}
            aria-label={isPt ? `Avanço rápido: ${speed}×. Toque para mudar para ${nextDungeonSpeed(speed)}×.` : `Fast forward: ${speed}×. Tap to change to ${nextDungeonSpeed(speed)}×.`}
            className="sm2-num"
            style={{ pointerEvents: 'auto', background: 'none', border: 'none', boxShadow: 'none', padding: 0, minWidth: 44, minHeight: 44, cursor: 'pointer', color: 'var(--sm2-viewport-ink)', fontSize: 16, fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,.9), 0 0 3px rgba(0,0,0,.8)', WebkitTextStroke: '0.5px rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
          >
            {speed}×
          </button>
        </>) : undefined}
        cheerRatio={fighting && pronto ? battle.meter / CHEER_TAPS_FULL : 0}
        swipeActive={fighting && battle.phase === 'dodge'}
        onSwipe={battle.swipe}
      >
        <BattleStage
          specialLabel={specialLabel(isPt, par?.especial)}
          foeSpecialLabel={(f) => dungeonFoeSpecialLabel(isPt, enemy, f.element, f.name)}
          isPt={isPt}
          scene={scene.bg}
          me={{
            key: 'me', sprite: petSprite, scale: petScale, name: isPt ? 'Você' : 'You', hp: Math.round(Math.max(0, meHpFrac) * hpMax), maxHp: hpMax,
            element: petEl, energy: (pronto ? battle.petEnergy : energyCarryRef.current) / ENERGY_TRIGGER,
            status: pronto ? battle.status.me : undefined,
            cheerPending: pronto ? (battle.meter / CHEER_TAPS_FULL) * (CHEER.energyPerDischarge / ENERGY_TRIGGER) : 0,
          }}
          foes={[{
            key: `${floor}-${enemyIdx}`, sprite: enemy.sprite, stage: enemy.stage, name: wildFoeLabel(enemy.stage, isPt), hp: Math.round(Math.max(0, foeHpFrac) * foeMax), maxHp: foeMax,
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
          /* UM indicador só (pedido do dono, 11/10/2026, REGISTRO §36): "Camada N · luta k de 6". O "6" NÃO é o número de camadas (elas vão
             até a 999, sem fim de andares): é a escada de criaturas da camada (`LADDER_TIERS`, baby-i → mega). Copy §4: "camada/layer" é o
             termo canônico (§12). */
          title={hudLabel}
          fast={speed > 1}
          closeLabel={isPt ? 'Ir ao mapa (ele continua descendo sozinho)' : 'Go to the map (he keeps going down on his own)'}
          closeIcon="map"
          onClose={exitToMap}
          onPauseChange={setPausado}
        >
          {/* A linha viva (`aria-live`) é só para o leitor de tela e só muda quando a CAMADA muda. O AVANÇO RÁPIDO 1×/3× mora no canto,
              ABAIXO da torcida (`belowMascot`, sem caixa); o Sair é o X da cena. Sem Pausar (§71). */}
          {!ended && phase !== 'away' && (
            <p data-dungeon-floor-live aria-live="polite" style={SR_ONLY}>
              {isPt ? `Camada ${floor}` : `Layer ${floor}`}
            </p>
          )}
          {phase === 'away' && awayReport && (
            <div role="status" style={PANEL} data-dungeon-away-report>
              <p style={phaseTitle}>{isPt ? 'Enquanto você esteve fora, a descida seguiu.' : 'While you were away, the descent went on.'}</p>
              <DungeonSummary isPt={isPt} resumo={resumo} capBits={capBits} />
              <p className="sm2-num" style={phaseLine}>
                {isPt ? `Agora ele está na camada ${floor}.` : `He is on layer ${floor} now.`}
              </p>
              {awayReport.capped && (
                <p style={phaseLine} data-dungeon-away-capped>
                  {isPt ? `Contei até ${DUNGEON_AWAY_MAX_HOURS} h de descida por vez; o resto do tempo fica para a próxima.` : `I count up to ${DUNGEON_AWAY_MAX_HOURS} h of descent at a time; the rest waits for next time.`}
                </p>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={verDescida} data-dungeon-away-continue style={{ ...sm2Button('primary'), flex: 1, minWidth: 0, padding: '0 8px' }}>
                  {isPt ? 'Ver a descida' : 'Watch the descent'}
                </button>
                <button type="button" onClick={retirar} data-dungeon-retire style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 8px' }}>
                  {isPt ? 'Retirar da Fenda' : 'Take him out of the Rift'}
                </button>
              </div>
            </div>
          )}
          {phase === 'enemy-down' && (
            <div role="status" style={PANEL}>
              {/* Copy §4 (§5.12, L3): vencer é PASSAR, não matar — nenhuma
                  criatura da Malha morre. ⚠️ EN nunca "{name} passed": é o
                  eufemismo de velório. O verbo canônico é "parar de insistir". */}
              <p style={phaseTitle}>
                {isPt
                  ? `${wildFoeLabel(enemy.stage, true)} parou de insistir aqui. O padrão dele reassenta noutro lugar.`
                  : `${wildFoeLabel(enemy.stage, false)} stopped holding here. The pattern settles somewhere else.`}
              </p>
              {/* "+N Bits" e, raramente, o coraçãozinho — o emoji da string virou
                  glifo `favorite` 20 FILL `primary-ink` + "+1 heart" (D-J9). */}
              <p style={phaseLine}>
                {/* D-71: a linha de recompensa com ícones (Bits + coração) é a `RewardLine`. */}
                {rewardBits > 0 || gotHeart
                  ? <RewardLine bits={rewardBits} hearts={gotHeart ? 1 : 0} language={isPt ? 'pt-BR' : 'en-US'} />
                  : <span className="sm2-num">{rewardMsg}</span>}
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
              <p style={phaseLine}>{rewardMsg}{rewardMsg ? ' · ' : ''}<BitsAmount value={clearBonus(floor)} sign="+" /></p>
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
            /* Fim de descida SEM vereditos: não é derrota nem cobrança, é o HP que acabou — e ele volta com o tempo.
               Copy §4 (L5, §7): perda só sobre o que foi apostado de propósito (a descida). Sem "descansar" (§5.12:
               vocabulário da criatura que acaba) — o verbo é RECUPERAR. Tela padrão: `ResultScreen` (Proposta D). */
            <ResultScreen
              language={language}
              outcome={resumo.recordTo > resumo.recordFrom ? 'record' : endReason === 'hp' ? 'tired' : 'calm'}
              gameName={isPt ? 'Fenda Sem Fim' : 'Endless Rift'}
              title={isPt ? 'Descida encerrada' : 'Descent over'}
              rootAttrs={{ 'data-dungeon-ended': endReason }}
              // Herói = camadas limpas NESTA descida, com UMA escada por camada estourando (até 10; acima disso 10 + "×N").
              hero={{ label: isPt ? 'Camadas limpas' : 'Layers cleared', value: resumo.layers, big: true, unit: { icon: STAIRS_ICON, count: resumo.layers } }}
              // "Mais fundo até hoje" aparece UMA vez, em destaque, logo abaixo do herói (saiu da lista de estatísticas).
              deepest={{ label: isPt ? 'Mais fundo até hoje' : 'Deepest so far', value: isPt ? `camada ${resumo.recordTo}` : `layer ${resumo.recordTo}` }}
              recordNote={isPt ? 'Novo recorde!' : 'New record!'}
              stats={[
                { key: 'enemies', label: isPt ? 'Criaturas que pararam de insistir' : 'Creatures that stopped holding', value: resumo.enemies },
                ...(resumo.energy > 0 ? [{ key: 'energy', label: isPt ? 'Energia usada' : 'Energy used', value: resumo.energy, icon: ENERGY_ICON }] : []),
              ]}
              strip={[
                { key: 'score', label: isPt ? 'Placar' : 'Score', value: runScore },
                // Primeira descida (sem recorde anterior): a célula repetiria o próprio placar.
                ...(resumo.recordFrom > 0 ? [{ key: 'best', label: isPt ? 'Recorde' : 'Best', value: best, hideOnRecord: true }] : []),
              ]}
              ledger={[
                { key: 'bits', kind: 'bits', value: resumo.bits },
                { key: 'xp', kind: 'xp' as const, value: resumo.layers * XP_DUNGEON_FLOOR },
                // O "coração da mochila" é o ITEM de recuperar vida (a poção em forma de coração), com a arte do item.
                ...(resumo.hearts > 0 ? [{ key: 'hearts', kind: 'item' as const, itemKind: 'heart' as const, label: rewardItemLabel('heart', isPt), amount: resumo.hearts }] : []),
                ...(resumo.glitchtama > 0 ? [{ key: 'glitchtama', kind: 'item' as const, itemKind: 'glitchtama' as const, label: isPt ? 'Glitchtama (mochila)' : 'Glitchtama (Backpack)', amount: resumo.glitchtama }] : []),
                ...(resumo.fragments > 0 ? [{ key: 'fragments', kind: 'item' as const, itemKind: 'fragments' as const, label: rewardItemLabel('fragments', isPt), amount: resumo.fragments }] : []),
              ]}
              emptyLedgerLine={isPt ? 'Rodada leve, sem Bits desta vez.' : 'A light round, no Bits this time.'}
              petSrc={petSprite}
              scene={scene.bg}
              notes={(
                <>
                  {endReason === 'sealed' && gs && (
                    <p style={phaseLine} data-gate-masmorra>{gateLine('masmorraAlto', bondLevelFor(gs.totalXP ?? 0), language)}</p>
                  )}
                  {endReason === 'energy' && (
                    <p style={phaseLine} data-dungeon-no-energy>
                      {isPt
                        ? 'Volte mais tarde: a energia volta com o tempo, e mais depressa quando ele está bem alimentado.'
                        : 'Come back later: energy returns with time, and faster when he is well fed.'}
                    </p>
                  )}
                  {endReason === 'deep' && (
                    <p style={phaseLine} data-dungeon-deep>
                      {isPt
                        ? `O Lv dele chega até a camada ${capCamadas}. O Lv cresce com os seus dias completos e a evolução.`
                        : `His Lv reaches down to layer ${capCamadas}. Lv grows with your complete days and evolution.`}
                    </p>
                  )}
                  {awayReport && (
                    <p style={phaseLine} data-dungeon-away-note>
                      {isPt ? 'Isto aconteceu enquanto você esteve fora; ele já voltou para casa.' : 'This happened while you were away; he is back home now.'}
                    </p>
                  )}
                  {capBits && <p style={phaseLine} data-dungeon-bits-cap>{isPt ? 'Teto diário de Bits atingido — a descida segue, só sem Bits.' : 'Daily Bits cap reached — the descent goes on, just without Bits.'}</p>}
                  {espera > 0 && (
                    <p style={phaseLine} data-dungeon-recovering>
                      {isPt ? `Recuperando… pode descer de novo em ${formatarEspera(espera, true)}.` : `Recovering… ready to go down again in ${formatarEspera(espera, false)}.`}
                    </p>
                  )}
                </>
              )}
              playAgainLabel={isPt ? 'Descer de novo' : 'Go down again'}
              onPlayAgain={espera === 0 && temEnergia ? startRun : undefined}
              homeLabel={exitLabel}
              onHome={onExit}
            />
          )}
        </BattleStage>
        {/* O modalzinho de drop: a luta continua por trás (nada pausa), toque no véu/cartão fecha, a fila é de `dungeonDrops.ts`. */}
        {drops.length > 0 && <DropNotice group={drops[0]} isPt={isPt} speed={speed} onClose={closeDrop} />}
        {/* 💗 A queda: antes da derrota, "Usar Coraçãozinho". Esquerda = recusar (derrota normal), direita = confirmar (volta com 50% do HP). */}
        {reviveOffer && (
          <div role="dialog" aria-modal="true" data-revive-offer style={{ position: 'absolute', inset: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.6)', padding: 16 }}>
            <div style={{ background: 'var(--sm2-surface, #14221f)', color: 'var(--sm2-ink, #fff)', borderRadius: 12, padding: 16, maxWidth: 320, width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0, fontWeight: 700 }}>{isPt ? 'Seu Soulmon caiu' : 'Your Soulmon went down'}</p>
              <p style={{ margin: 0 }}>
                {isPt ? 'Usar um Coraçãozinho para ele voltar com metade da vida e seguir a luta?' : 'Use a Little heart to bring him back with half his HP and keep fighting?'}
              </p>
              <p style={{ margin: 0 }} data-revive-count>{isPt ? `Você tem: ${heartsOwned(gs?.foodInventory)}` : `You have: ${heartsOwned(gs?.foodInventory)}`}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" data-revive-decline onClick={recusarRevive} style={{ ...sm2Button('outline'), flex: 1, minHeight: 44 }}>{isPt ? 'Não usar' : 'Not now'}</button>
                <button type="button" data-revive-confirm onClick={aceitarRevive} style={{ ...sm2Button('primary'), flex: 1, minHeight: 44 }}>{isPt ? 'Usar Coraçãozinho' : 'Use Little heart'}</button>
              </div>
            </div>
          </div>
        )}
      </TorcidaLayer>
    );
  }

  return (
    <GameRoot>
      <GameHeader
        run={false}
        title={isPt ? 'Fenda Sem Fim' : 'Endless Rift'}
        sub={isPt ? 'Descida automática' : 'Automatic descent'}
        closeLabel={exitLabel}
        onClose={exitRun}
      />

      {/* O VISOR do lobby: a cena do andar em `cover` e só o pet, centrado. */}
      <GameVisor height={88} scene={scene.bg}>
        <VisorSprite
          src={petSprite}
          alt=""
          style={{ left: '50%', marginLeft: -64, bottom: 8, ...petScaleStyle(petScale) }}
          data-visor-pet
        />
      </GameVisor>

      {/* Lobby */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <StatTag label={isPt ? 'Mais fundo' : 'Deepest'} value={recorde} />
        <StatTag label={isPt ? 'Neste mês' : 'This month'} value={riftBest} />
        <StatTag label={isPt ? 'Energia' : 'Energy'} value={gs ? `${energia}/${energiaMax}` : '—'} />
        {/* E1 (02/10/2026): o texto longo do lobby mora atrás do "?" — toque lê.
            I13: agora é o `InfoTip` padrão (antes era um "?" próprio). */}
        <InfoTip language={language} label={isPt ? 'Como funciona a descida' : 'How the descent works'} align="right">
          <span data-dungeon-help-panel style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span>
                  {isPt
                    ? `A descida é automática: a cada ${ladderLen} lutas, uma camada (${DUNGEON_ENERGY_PER_LAYER} de energia, a da Home).`
                    : `The descent is automatic: every ${ladderLen} fights, a layer (${DUNGEON_ENERGY_PER_LAYER} energy, the Home energy).`}
                </span>
                <span>
                  {isPt
                    ? `O HP volta com o tempo e precisa de ${DUNGEON_MIN_HP_TO_ENTER_PCT}% para descer. Perder nunca custa seus corações.`
                    : `HP comes back over time and you need ${DUNGEON_MIN_HP_TO_ENTER_PCT}% to go down. Losing never costs your hearts.`}
                </span>
                <span>
                  {isPt
                    ? 'Aqui o assentamento falhou e as camadas se empilharam. Ninguém mora numa fenda.'
                    : 'Here the settling failed and the layers piled up. Nobody lives in a rift.'}
                </span>
                <span>
                  {isPt
                    ? 'Seu Soulmon luta e solta o especial sozinho (a energia passa de um inimigo para o outro). O botão do canto acelera a cena (1× ou 3×).'
                    : 'Your Soulmon fights and unleashes its special by itself (energy carries over between enemies). The corner button speeds up the scene (1× or 3×).'}
                </span>
                <span>
                  {isPt
                    ? 'Pode sair da tela: a descida segue. Para chamá-lo de volta, use "Retirar da Fenda".'
                    : 'You can leave the screen: the descent goes on. To call him back, use "Take him out of the Rift".'}
                </span>
          </span>
        </InfoTip>
      </div>
      {/* Endless Rift (M6): o ranking MENSAL (faixa 3 em diante envia o melhor do mês; os Créditos do top 3 são pagos pelo servidor). */}
      {rankSaveId && <RankingPanel key={riftBest} game={RIFT_GAME_ID} period="monthly" saveId={rankSaveId} language={language} score={riftBest >= RIFT_RANKING_FROM ? riftBest : null} />}
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
              ? `Começa na camada ${inicio} · dá para ${layersAffordable(energia)} agora`
              : `Starts at layer ${inicio} · enough for ${layersAffordable(energia)} now`}
          </p>
        )}
        {gs && (
          <RewardPreview mode="before" language={isPt ? 'pt-BR' : 'en-US'} items={[
            { kind: 'bits', max: remainingMinigameBits(gs, playerDayKey(new Date(), gs.playerDayTz)) },
            { kind: 'xp', max: XP_DUNGEON_FLOOR * 5 + XP_DUNGEON_RUN },
            { kind: 'item', item: 'heart' },
          ]} />
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
        {/* Sem energia: um convite, nunca cobrança. A energia volta com o tempo e a fome decide a velocidade (comida enche a fome). */}
        {!temEnergia && (
          <p style={phaseLine} role="status" data-dungeon-no-energy>
            {isPt
              ? 'Sem energia por agora. Ela volta com o tempo, mais depressa com ele bem alimentado: conclua algo do seu dia, dê a comida a ele e volte.'
              : 'No energy for now. It returns with time, faster when he is well fed: finish something from your day, feed him, and come back.'}
          </p>
        )}
      </div>
    </GameRoot>
  );
}

/** O RESUMO da descida (REGISTRO §31): o que ela rendeu, em linhas de fato — sem placar de cobrança. */
function DungeonSummary({ isPt, resumo, capBits, statsOnly = false }: {
  isPt: boolean; capBits: boolean;
  /** Só as linhas de estatística (camadas, criaturas, recorde, energia): Bits e itens vão para o livro da `ResultScreen`. */
  statsOnly?: boolean;
  resumo: { layers: number; enemies: number; bits: number; hearts: number; glitchtama: number; fragments: number; energy: number; recordFrom: number; recordTo: number };
}) {
  const linhas: Array<{ k: string; n: ReactNode }> = [
    { k: 'layers', n: isPt ? `Camadas limpas: ${resumo.layers}` : `Layers cleared: ${resumo.layers}` },
    { k: 'enemies', n: isPt ? `Criaturas que pararam de insistir: ${resumo.enemies}` : `Creatures that stopped holding: ${resumo.enemies}` },
    // D-62/D-80: o valor em Bits é o `BitsAmount` (moeda + número); o rótulo "Bits" fica só para leitor de tela.
    { k: 'bits', n: <><BitsAmount value={resumo.bits} />{capBits ? (isPt ? ' (o teto diário de Bits já foi atingido)' : ' (the daily Bits cap was already reached)') : ''}</> },
  ].filter(l => !statsOnly || l.k !== 'bits');
  const add = (k: string, n: string) => linhas.push({ k, n });
  if (!statsOnly && resumo.hearts > 0) linhas.push({ k: 'hearts', n: <><RewardLine hearts={resumo.hearts} language={isPt ? 'pt-BR' : 'en-US'} size={16} />{isPt ? ' (mochila)' : ' (Backpack)'}</> });
  if (!statsOnly && resumo.glitchtama > 0) add('glitchtama', isPt ? `Glitchtama: +${resumo.glitchtama} (mochila)` : `Glitchtama: +${resumo.glitchtama} (Backpack)`);
  if (!statsOnly && resumo.fragments > 0) add('fragments', isPt ? `Fragmentos do Soulsmith: +${resumo.fragments}` : `Soulsmith fragments: +${resumo.fragments}`);
  if (resumo.recordTo > resumo.recordFrom) add('record', isPt ? `Mais fundo até hoje: camada ${resumo.recordTo}` : `Deepest so far: layer ${resumo.recordTo}`);
  if (resumo.energy > 0) add('energy', isPt ? `Energia usada: ${resumo.energy}` : `Energy used: ${resumo.energy}`);
  return (
    <ul data-dungeon-summary aria-label={isPt ? 'Resumo da descida' : 'Descent summary'} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {linhas.map(l => <li key={l.k} className="sm2-num" style={phaseLine}>{l.n}</li>)}
    </ul>
  );
}
