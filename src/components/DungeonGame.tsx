import { useCallback, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Icon } from './ui/Icon';
import { InfoTip } from './ui/InfoTip';
import { sm2Button } from './form/FormKit';
import { GameRoot, GameHeader, GameVisor, VisorSprite, StatTag, phaseTitle, phaseLine } from './games/GameKit';
import { getSpriteForStage } from '../utils/sprites';
import { playFeed } from '../utils/sounds';
import { DUNGEON_BITS_FACTOR } from '../utils/dungeon';
import { newDefenseSeed } from '../utils/autoDefesa';
import {
  buildDungeonWave, getDungeonDifficulty, getDungeonBest,
  setDungeonDifficultyAtLeast, recordDungeonScore, LADDER_TIERS,
  deepStartCost, canBuyDeepStart, buyDeepStart, DEEP_START_MAX_LEVEL,
  getDungeonReached, recordDungeonReached,
  type DungeonEnemy,
} from '../utils/dungeon';
import { dungeonFamily, dungeonFight, dungeonFightSeed, dungeonPlayerSide, type DungeonPlayerCfg } from '../utils/dungeonFight';
import { ENERGY_TRIGGER } from '../utils/combate/specials';
import { mulberry32 } from '../utils/combate/rng';
import type { GroupResult } from '../utils/combate/group';
import { stageSkillsFor, type FichaSkills } from '../utils/soulProfile/ficha/stageSkillsFor';
import { fxElementId, visualElementFor, prefersReducedMotion, elementStrikeForm, fighterStrikeForm, specialLabel, foeSpecialLabel } from '../utils/combatFx';
import { TorcidaLayer } from './games/TorcidaKit';
import { BattleStage, BATTLE_LAYER_STYLE } from './games/BattleStage';
import { useGroupBattle, type GroupRound, type GroupScene } from './games/useGroupBattle';
import { RING_TAG, DODGE_TAG, PERSONAL_TAG } from './games/pveTags';
import { buildRunScenes, DUNGEON_SCENES, type DungeonScene } from '../utils/dungeonScenes';
import { jeitoDaProfissao, fraseDaProfissao, jeitoParaPve } from '../utils/profissaoMasmorra';
import { useGameStateOptional } from '../contexts/GameStateContext';
import { soulCombatant, type SoulXPState } from '../utils/soulXP';
import { useTalentBonus } from '../contexts/useTalentBonus';
import { gateLine, masmorraFloorOpen } from '../utils/gates';
import { bondLevelFor } from '../utils/bond';
import type { LText } from '../utils/oracle';
import type { Language } from '../utils/i18n';

/**
 * Dungeon minigame — a battle across up to 5 FLOORS, in the full-screen `BattleStage`.
 *
 * A run is up to 5 floors; each floor is a fixed ladder of 6 RANDOM wild creatures
 * climbing the tiers (baby-i → baby-ii → rookie → champion → ultimate → mega).
 * Floor difficulty = base level + (floor-1), so floor 1 suits a rookie, floor 2
 * a champion, floor 3 an ultimate… — a couple floors above the pet is brutal.
 * Each floor has its own retro scene (Tamagotchi/VHS/synthwave/CRT/glitch).
 * Clearing all 5 floors COMPLETES the run and raises the base level (next run is
 * harder); the base level resets WEEKLY. Player HP carries between floors with a
 * small heal on each clear.
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

export const MAX_FLOORS = 5;
// Bits for clearing a floor — scales with how deep you are. Era 10/15/20/25/30;
// desde 30/09/2026 passa pelo `DUNGEON_BITS_FACTOR` (0,4 → 4/6/8/10/12), a
// decisão do dono que trouxe a run completa para perto do teto diário.
export const clearBonus = (floor: number) => Math.round((10 + 5 * (floor - 1)) * DUNGEON_BITS_FACTOR);

type Phase = 'intro' | 'fight' | 'enemy-down' | 'floor-clear' | 'run-complete' | 'lost';

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
  onEnter: () => { ok: true; level: number; best: number };
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
  const bonusTalento = useTalentBonus('pve'); // canal único de bônus (teto 5%), PR7
  const jogador = useMemo<DungeonPlayerCfg>(() => ({
    combatant: soulCombatant(estado, bonusTalento),
    family: dungeonFamily(par?.especial),
    jeito,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [estado, bonusTalento, par?.especial?.escolaId, par?.especial?.familia, profissao]);
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
  const [baseLevel, setBaseLevel] = useState(() => getDungeonDifficulty());
  /** E2: o nível mais fundo já cumprido — o teto do "Descer mais fundo". */
  const [reachedLevel, setReachedLevel] = useState(() => getDungeonReached());
  /** E1: o texto longo do lobby mora atrás do "?". */
  const [floor, setFloor] = useState(1);
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
  const [pausado, setPausado] = useState(false);
  const reduzido = useRef(prefersReducedMotion());
  const enemiesRef = useRef<DungeonEnemy[]>([]);
  const enemyIdxRef = useRef(0);

  const enemy = enemies[enemyIdx];
  const petSprite = getSpriteForStage(evolutionStage, demoCharacterId, 256);
  const ladderLen = LADDER_TIERS.length;
  const scene = runScenes[floor - 1] ?? DUNGEON_SCENES[0];
  const petEl = fxElementId(petElement);
  const enemyEl = fxElementId(visualElementFor(enemy?.stage ?? 'x'));
  const foeMax = enemy ? Math.max(1, Math.round(enemy.foe.combatant.hp)) : 1;

  const addPoints = (pts: number) => {
    onEarnPoints(pts);
    runScoreRef.current += pts;
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

  /** A onda de um andar: o sabor sai da semente da run e do andar (`mulberry32(seed ^ andar)`). */
  const waveOf = (level: number, f: number) =>
    buildDungeonWave(level, evolutionStage, mulberry32((runSeedRef.current ^ Math.imul(f, 0x9e3779b1)) | 0), nivelJogador);

  // Começa a run no andar 1 (level = base persistida). Sem gate de entrada.
  const startRun = () => {
    const res = onEnter();
    runSeedRef.current = newDefenseSeed();
    setSeedLuta(runSeedRef.current);
    const list = waveOf(res.level, 1);
    setRunScenes(buildRunScenes());
    setBaseLevel(res.level);
    setBest(res.best);
    setFloor(1);
    setEnemies(list);
    hpCarryRef.current = 1; // run nova: o HP e a energia começam do zero
    energyCarryRef.current = 0;
    setHpFrac(1);
    enterEnemy(list, 0);
    runScoreRef.current = 0;
    setRunScore(0);
    setRewardMsg('');
    setGotHeart(false);
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
    setGotHeart(onHeartDrop());
    setRewardMsg(`+${e.points} Bits`);
    setPhase('enemy-down');
  };

  /* A luta é o núcleo v3 (`utils/combate/`, `groupFightSteps` com 1 inimigo): o `dungeonFight` monta o
     jogador (`soulCombatant` + o jeito do ofício), o inimigo relativo ao level (`dungeonFoe`), a defesa
     automática e o contra-ataque; o relógio da cena é o `useGroupBattle`, que consome os eventos no relógio do
     núcleo. A defesa perfeita não dá dano; o especial do inimigo (o mega) pode ser esquivado. */
  const rodadaDoNucleo = useCallback((): GroupRound => {
    const e = enemiesRef.current[enemyIdxRef.current];
    const f = dungeonFight(jogadorRef.current, e.foe, dungeonFightSeed(runSeedRef.current, e.floor, e.slot));
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
      playerElement: () => petEl,
      foeElement: () => foeEl,
      playerKind: sp => fighterStrikeForm({ skill: sp ? par?.especial : par?.basica, element: petEl }, sp ? 'especial' : 'basica'),
      foeKind: (_f, sp) => elementStrikeForm(foeEl, sp ? 'especial' : 'basica'),
      labels: { blocked: isPt ? 'Defendeu!' : 'Defended!', ring: RING_TAG[lang], dodge: DODGE_TAG[lang] },
      personalTag: PERSONAL_TAG[lang][p.family],
    };
  }, [petEl, par, isPt, lang]);

  const aoFimDaLuta = useCallback((res: GroupResult) => {
    if (res.winner === 'player') {
      hpCarryRef.current = res.hpLeft;
      energyCarryRef.current = res.energyLeft;
      setHpFrac(res.hpLeft);
      defeatEnemy();
      return;
    }
    // Derrota ou empate (o empate conta como derrota, sem custo).
    // C-6 (run `som-01`): sem som de degeneracao. Perder a run nao custa
    // coracao nenhum, de proposito — sonorizar como perda estrutural inverte
    // a regra escrita. O fim de partida ja e mostrado em tela.
    // Não custa coração nenhum: `handleDungeonLose` é um callback vazio, de
    // propósito. O que se perde ao cair é a RUN — bônus de andar, Glitchtama
    // e placar. (WP4.20: este comentário afirmava um custo de um coração, e
    // era falso desde que o handler ficou vazio.)
    onLose();
    const newBest = recordDungeonScore(runScoreRef.current);
    setBest(newBest);
    setRunScore(runScoreRef.current);
    setHpFrac(0);
    setPhase('lost');
  // O relógio chama sempre a versão mais nova (`optsRef` do hook); `defeatEnemy` só lê refs e props do render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onLose, onEnemyDefeated, onEarnPoints, onHeartDrop]);

  const battle = useGroupBattle({
    running: phase === 'fight' && !!enemy,
    paused: pausado, reduced: reduzido.current, runKey: fightKey, seed: seedLuta,
    round: rodadaDoNucleo, scene: cena, onEnd: aoFimDaLuta, torcida: false,
  });

  // Advance to the next enemy; or clear the floor (heal), or complete the run.
  const nextEnemy = () => {
    if (enemyIdx + 1 >= enemies.length) {
      playFeed();
      addPoints(clearBonus(floor));
      // 🔗 #59b — o andar limpo. Antes do `if (floor >= MAX_FLOORS)` de
      // propósito: o 5º andar é um andar limpo E uma run completa, e a tabela
      // do §55 paga os dois (o teto diário de `bond.ts` é quem limita).
      onFloorCleared?.();
      recordDungeonScore(runScoreRef.current);
      setBest(getDungeonBest());
      setRunScore(runScoreRef.current);
      if (floor >= MAX_FLOORS) {
        setDungeonDifficultyAtLeast(baseLevel + 1); // run complete → next run harder
        setReachedLevel(recordDungeonReached(baseLevel + 1)); // E2: nível CUMPRIDO (é o teto do "Descer mais fundo")
        onGlitchtama();                             // full clear → 🌀 Glitchtama
        setPhase('run-complete');
        return;
      }
      // A cura entre andares (`curaAndar` do ofício) é fração do HP máximo; fica fora da régua do TTK.
      const heal = Math.ceil(hpMax * pve.cura);
      hpCarryRef.current = Math.min(1, hpCarryRef.current + pve.cura);
      setHpFrac(hpCarryRef.current);
      setRewardMsg(isPt ? `Recuperou ${heal} de HP` : `Recovered ${heal} HP`);
      setPhase('floor-clear');
      return;
    }
    enterEnemy(enemies, enemyIdx + 1); // a energia do pet PERSISTE
    setRewardMsg('');
    setPhase('fight');
  };

  // Descend to the next (harder) floor, carrying HP over.
  // PR7: só os andares ALTOS têm portão pelo Vínculo (`utils/gates.ts`); o andar 1 e os baixos seguem livres.
  // Sem provider (demo, testes) não há Vínculo para medir e nada fecha.
  const proximoAndarAberto = !gs || masmorraFloorOpen(floor + 1, bondLevelFor(gs.totalXP ?? 0));
  const nextFloor = () => {
    if (!proximoAndarAberto) return;
    const f = floor + 1;
    const list = waveOf(baseLevel + (f - 1), f);
    setFloor(f);
    setEnemies(list);
    enterEnemy(list, 0);
    setRewardMsg('');
    setPhase('fight');
  };

  const inStage = enemies.length > 0 && phase !== 'intro';
  const sceneName = isPt ? scene.namePt : scene.nameEn;
  const exitLabel = isPt ? 'Sair' : 'Exit';
  const scoreLine = isPt ? `Placar: ${runScore} · Recorde: ${best}` : `Score: ${runScore} · Best: ${best}`;

  /* A LUTA e os cartões de resultado moram na MESMA cena de tela cheia: a energia
     segue visível entre os inimigos (a masmorra é contínua). */
  if (inStage && enemy) {
    const fighting = phase === 'fight';
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
          /* Copy §4: "camada/layer" é o termo canônico (§12); os números vêm de `MAX_FLOORS`, nunca à mão. */
          title={`${isPt ? 'Camada' : 'Layer'} ${floor}/${MAX_FLOORS}`}
          badge={<span className="sm2-num" style={{ fontSize: 'var(--sm2-text-sm)', color: 'var(--sm2-viewport-ink)', textShadow: '0 1px 2px rgba(0,0,0,.8)' }} aria-label={`${sceneName} · ${isPt ? 'inimigo' : 'enemy'} ${enemyIdx + 1}/${ladderLen}`}>{enemyIdx + 1}/{ladderLen}</span>}
          closeLabel={exitLabel}
          onClose={exitRun}
          exitConfirm={fighting ? {
            title: isPt ? 'Sair da descida? O placar até aqui fica.' : 'Leave the descent? Your score so far stays.',
            stay: isPt ? 'Continuar' : 'Keep going',
            leave: exitLabel,
          } : undefined}
          onPauseChange={setPausado}
        >
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
              <button type="button" onClick={nextEnemy} style={{ ...sm2Button('primary'), width: '100%', maxWidth: 320, alignSelf: 'center' }}>
                {enemyIdx + 1 >= enemies.length
                  ? (floor >= MAX_FLOORS
                      ? (isPt ? `Concluir descida (+${clearBonus(floor)} Bits + Glitchtama)` : `Finish descent (+${clearBonus(floor)} Bits + Glitchtama)`)
                      : (isPt ? `Limpar camada (+${clearBonus(floor)} Bits)` : `Clear layer (+${clearBonus(floor)} Bits)`))
                  : (isPt ? `Desafiar ${enemies[enemyIdx + 1].name}` : `Challenge ${enemies[enemyIdx + 1].name}`)}
              </button>
            </div>
          )}
          {phase === 'floor-clear' && (
            <div role="status" style={PANEL}>
              <p style={phaseTitle}>{isPt ? `Camada ${floor} limpa.` : `Layer ${floor} cleared.`}</p>
              {/* Copy §4: dá sentido ao escalonamento de tier (`LADDER_TIERS`)
                  sem falar em dificuldade como mérito. */}
              <p style={phaseLine}>{isPt ? 'Esta camada é mais antiga. A fauna também.' : 'This layer is older. So is what lives in it.'}</p>
              <p className="sm2-num" style={phaseLine}>{scoreLine}</p>
              {/* A cura é FATO em `muted`, não prêmio (D-J8). */}
              <p style={phaseLine}>{rewardMsg}</p>
              {!proximoAndarAberto && gs && (
                <p style={phaseLine} data-gate-masmorra>{gateLine('masmorraAlto', bondLevelFor(gs.totalXP ?? 0), language)}</p>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={nextFloor} disabled={!proximoAndarAberto} style={{ ...sm2Button('primary'), flex: 1, minWidth: 0, padding: '0 8px', whiteSpace: 'nowrap', ...(proximoAndarAberto ? {} : { opacity: 0.5, cursor: 'not-allowed' }) }}>
                  {isPt ? `Camada ${floor + 1}` : `Layer ${floor + 1}`}
                </button>
                <button type="button" onClick={exitRun} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 8px', whiteSpace: 'nowrap' }}>
                  {isPt ? 'Sair c/ placar' : 'Bank & exit'}
                </button>
              </div>
            </div>
          )}
          {phase === 'run-complete' && (
            <div role="status" style={PANEL}>
              {/* Nenhuma cor de prêmio: o que é ganho fala pela frase (D-J8). */}
              {/* Copy §4: fato, nunca "você dominou a masmorra" (L12). O
                  número vem de `MAX_FLOORS`. */}
              <p style={phaseTitle}>{isPt ? `As ${MAX_FLOORS} camadas ficaram para trás.` : `All ${MAX_FLOORS} layers are behind you.`}</p>
              <p className="sm2-num" style={phaseLine}>{scoreLine}</p>
              {/* Copy §4, "o que se traz" (§7, §12): cobre Bits e fagulha-coração. */}
              <p style={phaseLine}>{isPt ? 'Da fenda ele trouxe fragmentos que ainda não assentaram.' : "From the rift he brought fragments that haven't settled yet."}</p>
              {/* Copy §4, o nó (§7, L4): a P5 foi decidida pelo dono em
                  21/09/2026 — o nome `Glitchtama` FICA (`EXCECOES` da régua),
                  então a frase entra com ele. "Usar" é o verbo da mochila (ex-pastinha). */}
              <p style={phaseLine}>
                {isPt
                  ? 'Um Glitchtama, com um dia inteiro preso dentro. Usar dá àquele dia o fechamento que ele não teve. (mochila)'
                  : 'A Glitchtama, with a whole day caught inside. Using it gives that day the closing it never had. (Backpack)'}
              </p>
              <p style={phaseLine}>{isPt ? 'A próxima descida ficou mais difícil.' : 'The next descent got harder.'}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={startRun} style={{ ...sm2Button('primary'), flex: 1, minWidth: 0, padding: '0 8px' }}>
                  {isPt ? 'Descer de novo' : 'Go down again'}
                </button>
                <button type="button" onClick={onExit} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 8px' }}>
                  {exitLabel}
                </button>
              </div>
            </div>
          )}
          {phase === 'lost' && (
            <div role="status" style={PANEL}>
              {/* A derrota sem visor de derrota e sem cor de perda: o que estava
                  em jogo era a run; os corações ficam, e a tela diz (JOGO-09). */}
              {/* Copy §4 (L5, §7): "Voltar sem terminar não custa nada do que
                  é seu; custa a descida" — perda SÓ sobre coisa apostada de
                  propósito. A 2ª linha mantém o fato dos corações. */}
              <p style={phaseTitle}>
                {isPt ? 'Você subiu. A descida ficou pelo caminho — e só ela.' : 'You went back up. The descent stayed behind — and only it.'}
              </p>
              <p style={phaseLine}>
                {isPt ? 'Seus corações continuam intactos.' : 'Your hearts are untouched.'}
              </p>
              <p className="sm2-num" style={phaseLine}>
                {isPt ? `Camada ${floor} · ${scoreLine}` : `Layer ${floor} · ${scoreLine}`}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={startRun} style={{ ...sm2Button('primary'), flex: 1, minWidth: 0, padding: '0 8px' }}>
                  {isPt ? 'Jogar de novo' : 'Play again'}
                </button>
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
        sub={isPt ? `Camada ${floor} de ${MAX_FLOORS}` : `Layer ${floor} of ${MAX_FLOORS}`}
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
        <StatTag label={isPt ? 'Recorde' : 'Best'} value={best} />
        <StatTag label={isPt ? 'Dificuldade base' : 'Base level'} value={baseLevel} />
        {/* E1 (02/10/2026): o texto longo do lobby mora atrás do "?" — toque lê.
            I13: agora é o `InfoTip` padrão (antes era um "?" próprio). */}
        <InfoTip language={language} label={isPt ? 'Como funciona a descida' : 'How the descent works'} align="right">
          <span data-dungeon-help-panel style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span>
                  {isPt
                    ? `${MAX_FLOORS} camadas, cada uma com ${ladderLen} inimigos e mais forte que a anterior. A camada 1 serve pra um rookie; algumas camadas abaixo ficam brutais. Concluir a descida inteira sobe a dificuldade (reset semanal). Perder custa a descida — nunca os seus corações.`
                    : `${MAX_FLOORS} layers, each with ${ladderLen} enemies and tougher than the last. Layer 1 suits a rookie; a few layers down gets brutal. Completing the whole descent raises the difficulty (weekly reset). Losing costs you the descent — never your hearts.`}
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
        <button type="button" onClick={startRun} style={{ ...sm2Button('primary'), width: '100%', maxWidth: 320 }}>
          {/* Copy §4: fenda se DESCE; não se "entra" nem se "inicia run". */}
          {isPt ? 'Descer' : 'Go down'}
        </button>

        {/* WP4.5 — DESCER MAIS FUNDO: o sumidouro recorrente de Bits.
            Os Bits só tinham compras ÚNICAS, então quem joga muito acumulava
            moeda que não compra nada — e moeda que não compra nada deixa de
            ser recompensa. Este é o único sumidouro que o CLAUDE.md declara
            legítimo: custo de ENTRADA, nunca cobrar da barra de cuidado.
            Recorrente sem mecânica nova, porque a base reseta toda semana.
            Some ao chegar no teto: oferta que não pode ser aceita é ruído.
            Aposta opcional = `outline`, sem placa cheia (canvas Lobby). */}
        {onSpendBits && baseLevel < Math.min(DEEP_START_MAX_LEVEL, reachedLevel) && (
          <>
            <button
              type="button"
              disabled={!canBuyDeepStart(baseLevel, bits, reachedLevel)}
              onClick={() => {
                const next = buyDeepStart(baseLevel, bits, reachedLevel);
                if (next === null) return;
                if (!onSpendBits(deepStartCost(baseLevel))) return;
                setBaseLevel(setDungeonDifficultyAtLeast(next));
              }}
              style={{ ...sm2Button('outline', !canBuyDeepStart(baseLevel, bits, reachedLevel)), width: '100%', maxWidth: 320 }}
            >
              {isPt
                ? `Descer mais fundo — ${deepStartCost(baseLevel)} Bits`
                : `Go deeper — ${deepStartCost(baseLevel)} Bits`}
            </button>
            <p style={phaseLine}>
              {canBuyDeepStart(baseLevel, bits, reachedLevel)
                ? (isPt
                  ? `Volta a um nível que você já alcançou (até o ${reachedLevel}). Vale até o reset da semana.`
                  : `Returns you to a level you already reached (up to ${reachedLevel}). Lasts until the weekly reset.`)
                : (isPt ? 'Bits insuficientes.' : 'Not enough Bits.')}
            </p>
          </>
        )}
      </div>
    </GameRoot>
  );
}
