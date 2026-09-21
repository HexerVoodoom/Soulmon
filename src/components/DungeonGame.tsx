import { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from './ui/Icon';
import { sm2Button } from './form/FormKit';
import { GameRoot, GameHeader, GameVisor, VisorSprite, VisorFx, HpBars, FxPopup, StatTag, phaseTitle, phaseLine } from './games/GameKit';
import { getSpriteForStage } from '../utils/sprites';
import { playFeed } from '../utils/sounds';
import { playerStatsFor } from '../utils/dungeon';
import { TimingBar } from './pixel/TimingBar';
import {
  buildDungeonWave, getDungeonDifficulty, getDungeonBest,
  setDungeonDifficultyAtLeast, recordDungeonScore, LADDER_TIERS,
  deepStartCost, canBuyDeepStart, DEEP_START_MAX_LEVEL,
  type DungeonEnemy,
} from '../utils/dungeon';
import { buildRunScenes, DUNGEON_SCENES, type DungeonScene } from '../utils/dungeonScenes';
import type { Language } from '../utils/i18n';

/**
 * Dungeon minigame — timing-bar battle across up to 5 FLOORS.
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
 * Canvas Jogos (DECISÕES §25, D-J3…D-J9): o minijogo é o conteúdo de um VISOR
 * 348×176 (cena do andar em `cover`, pet e inimigo 256² a 128, FX 128² a 1× na
 * caixa do inimigo — o golpe, a derrota dele e a faísca da run completa; nunca
 * sobre o pet); o chrome é aparelho em vetor (`games/GameKit.tsx`): × 44 pelado
 * primeiro, barras de HP `.meter` fora do vidro ("You" ciano, o outro
 * `gold-fill` — nunca ❤️, nunca vermelho), `TimingBar` por token, popups
 * `role=status` com o FX num mini-visor 64. O overlay VHS saiu (movimento
 * contínuo sem propósito; `prefers-reduced-motion` já não o lia).
 *
 * Attack: stop the sweeping marker near CENTER for more damage (≥92% = crit).
 * Defense: same bar, timed — center dodges, a perfect stop dodges + counters.
 * Sem limite diário e SEM gate de entrada: a masmorra não cobra da barra de
 * cuidado do pet (perder custa a run — bônus de andar, Glitchtama e placar —
 * nunca corações). Coraçõezinhos (raramente) dropam; o placar alimenta o ranking.
 */

const MAX_FLOORS = 5;
const PERFECT = 0.92;
const DEFEND_TIME = 3.0;   // seconds to react on defense
const POPUP_MS = 1400;     // how long result popups stay before the next phase
// Bits for clearing a floor — scales with how deep you are (10/15/20/25/30).
const clearBonus = (floor: number) => 10 + 5 * (floor - 1);

type Phase = 'intro' | 'attack' | 'defend' | 'result' | 'enemy-down' | 'floor-clear' | 'run-complete' | 'lost';
interface Popup { icon: string; title: string; detail: string }

// ── Game ───────────────────────────────────────────────────────────────────
export function DungeonGame({ evolutionStage, demoCharacterId, language, onEnter, onLose, onHeartDrop, onGlitchtama, onEnemyDefeated, onEarnPoints, onExit, bits = 0, onSpendBits }: {
  evolutionStage: string;
  /** Modo demo (utils/monetization.ts): personagem pré-pronto — sobrepõe o sprite do pet (nunca dos inimigos). */
  demoCharacterId?: string;
  language: Language;
  /** Inicia a run. Sem gate: a masmorra não cobra da barra de cuidado. */
  onEnter: () => { ok: true; level: number; best: number };
  /** Perder encerra a run — não custa HP. */
  onLose: () => void;
  /** Rolls for a heart drop (added to Items); returns whether one dropped. */
  onHeartDrop: () => boolean;
  /** Completing all 5 floors grants a Glitchtama (added to Items). */
  onGlitchtama: () => void;
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
  const playerStats = playerStatsFor(evolutionStage);

  const [enemies, setEnemies] = useState<DungeonEnemy[]>([]);
  const [enemyIdx, setEnemyIdx] = useState(0);
  const [enemyHp, setEnemyHp] = useState(0);
  const [playerHp, setPlayerHp] = useState(playerStats.hp);
  const [phase, setPhase] = useState<Phase>('intro');
  const [popup, setPopup] = useState<Popup | null>(null);
  const [hitFx, setHitFx] = useState<'enemy' | 'player' | null>(null);
  const [rewardMsg, setRewardMsg] = useState('');
  /** O coraçãozinho caiu neste inimigo (JOGO-10) — vira glifo, não emoji na string. */
  const [gotHeart, setGotHeart] = useState(false);
  const [defendTimeLeft, setDefendTimeLeft] = useState(DEFEND_TIME);
  const [baseLevel, setBaseLevel] = useState(() => getDungeonDifficulty());
  const [floor, setFloor] = useState(1);
  const [best, setBest] = useState(() => getDungeonBest());
  const [runScore, setRunScore] = useState(0);
  // 5 scenes drawn per run from the classic pool + the shop backdrops.
  const [runScenes, setRunScenes] = useState<DungeonScene[]>(() => buildRunScenes());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const defendResolvedRef = useRef(false);
  const runScoreRef = useRef(0);

  const enemy = enemies[enemyIdx];
  const petSprite = getSpriteForStage(evolutionStage, demoCharacterId);
  const ladderLen = LADDER_TIERS.length;
  const scene = runScenes[floor - 1] ?? DUNGEON_SCENES[0];

  const after = useCallback((ms: number, fn: () => void) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(fn, ms);
  }, []);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const flash = (who: 'enemy' | 'player') => {
    setHitFx(who);
    setTimeout(() => setHitFx(null), 450);
  };

  const addPoints = (pts: number) => {
    onEarnPoints(pts);
    runScoreRef.current += pts;
  };

  // Record the run score, then leave the dungeon.
  const exitRun = () => {
    recordDungeonScore(runScoreRef.current);
    onExit();
  };

  // Começa a run no andar 1 (level = base persistida). Sem gate de entrada.
  const startRun = () => {
    const res = onEnter();
    const list = buildDungeonWave(res.level, evolutionStage);
    setRunScenes(buildRunScenes());
    setBaseLevel(res.level);
    setBest(res.best);
    setFloor(1);
    setEnemies(list);
    setEnemyIdx(0);
    setEnemyHp(list[0].hp);
    setPlayerHp(playerStats.hp);
    runScoreRef.current = 0;
    setRunScore(0);
    setRewardMsg('');
    setGotHeart(false);
    setPopup(null);
    setPhase('attack');
  };

  // Enemy defeated: grant points + roll a heart drop, then confirm.
  // C-1 (run `som-01`): a morte de inimigo NAO usa o som de conclusao. Uma run
  // sao 5 andares x 6 inimigos = 30 disparos do som que o produto reserva para
  // "voce concluiu uma coisa real" — gastar celebracao no evento frequente e
  // gasta-la. O canal visual (inimigo saindo da escada) e sincrono e continua.
  const defeatEnemy = (finalMsg: Popup) => {
    onEnemyDefeated(enemy.stage);
    addPoints(enemy.points);
    setGotHeart(onHeartDrop());
    setRewardMsg(`+${enemy.points} Bits`);
    setPopup(finalMsg);
    setPhase('result');
    after(POPUP_MS, () => { setPopup(null); setPhase('enemy-down'); });
  };

  // Player attack: accuracy² scaling, then the enemy shrugs off dmgReduction.
  const handleAttack = (acc: number) => {
    const crit = acc >= PERFECT;
    const raw = playerStats.dmg * (0.25 + 0.75 * acc * acc) * (crit ? 1.5 : 1);
    const dmg = Math.max(1, Math.round(raw * (1 - enemy.dmgReduction)));
    const newHp = Math.max(0, enemyHp - dmg);
    setEnemyHp(newHp);
    flash('enemy');
    try { navigator.vibrate?.(crit ? 40 : 15); } catch { /* noop */ }

    const title = crit ? (isPt ? 'PERFEITO!' : 'PERFECT!')
      : acc >= 0.6 ? (isPt ? 'Bom golpe!' : 'Good hit!')
      : (isPt ? 'Raspão...' : 'Graze...');
    const atkPopup: Popup = { icon: '⚔️', title, detail: isPt ? `${dmg} de dano no ${enemy.name}` : `${dmg} damage to ${enemy.name}` };

    if (newHp <= 0) { defeatEnemy(atkPopup); return; }

    setPopup(atkPopup);
    setPhase('result');
    after(POPUP_MS, () => {
      setPopup(null);
      defendResolvedRef.current = false;
      setDefendTimeLeft(DEFEND_TIME);
      setPhase('defend');
    });
  };

  // Defense: graded — closer to center avoids more; perfect = dodge + counter.
  const handleDefend = (acc: number, timedOut = false) => {
    if (defendResolvedRef.current) return;
    defendResolvedRef.current = true;

    if (!timedOut && acc >= PERFECT) {
      const counter = Math.max(1, Math.round(2 * (1 - enemy.dmgReduction)));
      const newEnemyHp = Math.max(0, enemyHp - counter);
      setEnemyHp(newEnemyHp);
      flash('enemy');
      try { navigator.vibrate?.(40); } catch { /* noop */ }
      const dodgePopup: Popup = {
        icon: '🛡️', title: isPt ? 'DESVIO PERFEITO!' : 'PERFECT DODGE!',
        detail: isPt ? `Contra-ataque: ${counter} de dano!` : `Counter-attack: ${counter} damage!`,
      };
      if (newEnemyHp <= 0) { defeatEnemy(dodgePopup); return; }
      setPopup(dodgePopup);
      setPhase('result');
      after(POPUP_MS, () => { setPopup(null); setPhase('attack'); });
      return;
    }

    const effAcc = timedOut ? 0 : acc;
    const taken = Math.max(1, Math.ceil(enemy.atk * (1 - effAcc)));
    const newHp = Math.max(0, playerHp - taken);
    setPlayerHp(newHp);
    flash('player');
    try { navigator.vibrate?.(30); } catch { /* noop */ }

    const title = timedOut ? (isPt ? 'Muito lento!' : 'Too slow!')
      : effAcc >= 0.6 ? (isPt ? 'Desvio parcial!' : 'Partial dodge!')
      : (isPt ? 'Ataque em cheio!' : 'Direct hit!');
    setPopup({ icon: '💥', title, detail: isPt ? `Você sofreu ${taken} de dano` : `You took ${taken} damage` });
    setPhase('result');

    if (newHp <= 0) {
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
      after(POPUP_MS, () => { setPopup(null); setPhase('lost'); });
      return;
    }
    after(POPUP_MS, () => { setPopup(null); setPhase('attack'); });
  };
  const handleDefendRef = useRef(handleDefend);
  handleDefendRef.current = handleDefend;

  // Defense countdown — shown to the player; expiring = full hit.
  useEffect(() => {
    if (phase !== 'defend') return;
    const id = setInterval(() => {
      setDefendTimeLeft(t => {
        const nt = Math.max(0, +(t - 0.1).toFixed(1));
        if (nt <= 0) handleDefendRef.current(0, true);
        return nt;
      });
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  // Advance to the next enemy; or clear the floor (heal), or complete the run.
  const nextEnemy = () => {
    if (enemyIdx + 1 >= enemies.length) {
      playFeed();
      addPoints(clearBonus(floor));
      recordDungeonScore(runScoreRef.current);
      setBest(getDungeonBest());
      setRunScore(runScoreRef.current);
      if (floor >= MAX_FLOORS) {
        setDungeonDifficultyAtLeast(baseLevel + 1); // run complete → next run harder
        onGlitchtama();                             // full clear → 🌀 Glitchtama
        setPhase('run-complete');
        return;
      }
      const heal = Math.ceil(playerStats.hp * 0.25);
      setPlayerHp(hp => Math.min(playerStats.hp, hp + heal));
      setRewardMsg(isPt ? `Recuperou ${heal} de HP` : `Recovered ${heal} HP`);
      setPhase('floor-clear');
      return;
    }
    const idx = enemyIdx + 1;
    setEnemyIdx(idx);
    setEnemyHp(enemies[idx].hp);
    setRewardMsg('');
    setPhase('attack');
  };

  // Descend to the next (harder) floor, carrying HP over.
  const nextFloor = () => {
    const f = floor + 1;
    const list = buildDungeonWave(baseLevel + (f - 1), evolutionStage);
    setFloor(f);
    setEnemies(list);
    setEnemyIdx(0);
    setEnemyHp(list[0].hp);
    setRewardMsg('');
    setPopup(null);
    setPhase('attack');
  };

  const inBattle = enemies.length > 0 && ['attack', 'defend', 'result', 'enemy-down', 'floor-clear', 'run-complete', 'lost'].includes(phase);
  const sceneName = isPt ? scene.namePt : scene.nameEn;
  const exitLabel = isPt ? 'Sair' : 'Exit';
  const scoreLine = isPt ? `Placar: ${runScore} · Recorde: ${best}` : `Score: ${runScore} · Best: ${best}`;

  /* O que o VIDRO mostra na caixa do inimigo (canto superior direito, 128²,
     a MESMA caixa em todas as fases — X1/X4): o inimigo espelhado na luta; o
     `fx-defeat` quando ele cai; o `fx-sparkle` quando a run acaba (a run
     acabou onde o último inimigo estava — nunca sobre o pet); nada na derrota
     (o pet fica inteiro — nada caiu do lado dele). */
  const enemyBox: React.CSSProperties = { right: 16, top: 8 };
  const enemySlot = phase === 'run-complete'
    ? <VisorFx icon="✨" style={enemyBox} data-visor-fx="sparkle" />
    : phase === 'enemy-down' || phase === 'floor-clear'
      ? <VisorFx icon="🏳️" style={enemyBox} data-visor-fx="defeat" />
      : phase === 'lost'
        ? null
        : enemy
          ? <VisorSprite src={enemy.sprite} alt={enemy.name} flip style={enemyBox} data-visor-enemy />
          : null;

  return (
    <GameRoot>
      <GameHeader
        run={inBattle}
        title={isPt ? 'Masmorra' : 'Dungeon'}
        sub={
          <>
            {/* Copy §4: "camada/layer" é o termo canônico (§12); os números
                vêm de `MAX_FLOORS`, nunca à mão. */}
            {isPt ? `Camada ${floor} de ${MAX_FLOORS}` : `Layer ${floor} of ${MAX_FLOORS}`} · {sceneName}
            {inBattle ? ` · ${isPt ? 'inimigo' : 'enemy'} ${enemyIdx + 1}/${ladderLen}` : null}
          </>
        }
        closeLabel={exitLabel}
        onClose={exitRun}
      />

      {/* O VISOR (D-J3): a cena do andar em `cover`, o pet a 128 embaixo à
          esquerda, o inimigo a 128 espelhado no alto à direita; 176 de altura
          em TODAS as fases (X4). No lobby, só o pet, centrado. */}
      <GameVisor height={88} scene={scene.bg}>
        {enemySlot}
        <VisorSprite
          src={petSprite}
          alt=""
          style={inBattle ? { left: 16, bottom: 8 } : { left: '50%', marginLeft: -64, bottom: 8 }}
          data-visor-pet
        />
        {/* O golpe é o FX `fx-hit` 128² a 1× sobre quem apanhou (D-J4) —
            nunca `filter: brightness(3)`. */}
        {hitFx === 'enemy' && <VisorFx icon="💥" style={enemyBox} data-visor-fx="hit" />}
        {hitFx === 'player' && <VisorFx icon="💥" style={{ left: 16, bottom: 8 }} data-visor-fx="hit" />}
      </GameVisor>

      {/* As barras FORA do vidro, em vetor (D-J5): "You" ciano, o outro dourado. */}
      {inBattle && enemy && (
        <HpBars
          bars={[
            { label: isPt ? 'Você' : 'You', cur: playerHp, max: playerStats.hp, tone: 'cyan' },
            { label: enemy.name, cur: enemyHp, max: enemy.hp, tone: 'gold' },
          ]}
        />
      )}

      {/* Lobby */}
      {phase === 'intro' && (
        <>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <StatTag label={isPt ? 'Recorde' : 'Best'} value={best} />
            <StatTag label={isPt ? 'Dificuldade base' : 'Base level'} value={baseLevel} />
          </div>
          <p style={phaseLine}>
            {isPt
              ? `${MAX_FLOORS} camadas, cada uma com ${ladderLen} inimigos e mais forte que a anterior. A camada 1 serve pra um rookie; algumas camadas abaixo ficam brutais. Concluir a descida inteira sobe a dificuldade (reset semanal). Perder custa a descida — nunca os seus corações.`
              : `${MAX_FLOORS} layers, each with ${ladderLen} enemies and tougher than the last. Layer 1 suits a rookie; a few layers down gets brutal. Completing the whole descent raises the difficulty (weekly reset). Losing costs you the descent — never your hearts.`}
          </p>
          {/* Copy §4, linha de contexto (§7, L3): fecha a leitura de que os
              inimigos são vítimas ou de que a fenda é castigo de alguém. */}
          <p style={phaseLine}>
            {isPt
              ? 'Aqui o assentamento falhou e as camadas se empilharam. Ninguém mora numa fenda.'
              : 'Here the settling failed and the layers piled up. Nobody lives in a rift.'}
          </p>
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
            {onSpendBits && baseLevel < DEEP_START_MAX_LEVEL && (
              <>
                <button
                  type="button"
                  disabled={!canBuyDeepStart(baseLevel, bits)}
                  onClick={() => {
                    if (!canBuyDeepStart(baseLevel, bits)) return;
                    if (!onSpendBits(deepStartCost(baseLevel))) return;
                    setBaseLevel(setDungeonDifficultyAtLeast(baseLevel + 1));
                  }}
                  style={{ ...sm2Button('outline', !canBuyDeepStart(baseLevel, bits)), width: '100%', maxWidth: 320 }}
                >
                  {isPt
                    ? `Descer mais fundo — ${deepStartCost(baseLevel)} Bits`
                    : `Go deeper — ${deepStartCost(baseLevel)} Bits`}
                </button>
                <p style={phaseLine}>
                  {canBuyDeepStart(baseLevel, bits)
                    ? (isPt
                      ? 'Começa a run um nível abaixo. Vale até o reset da semana.'
                      : 'Starts the run one level deeper. Lasts until the weekly reset.')
                    : (isPt ? 'Bits insuficientes.' : 'Not enough Bits.')}
                </p>
              </>
            )}
          </div>
        </>
      )}

      {/* Área de ação (durante a run) */}
      {inBattle && enemy && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 120 }}>
          {phase === 'attack' && (
            <>
              <p style={phaseTitle}>
                {isPt ? 'Seu turno — mire no centro!' : 'Your turn — aim for the center!'}
              </p>
              <TimingBar key={`atk-${floor}-${enemyIdx}-${enemyHp}-${playerHp}`} speed={enemy.speed} label={isPt ? 'Atacar!' : 'Attack!'} onStop={handleAttack} />
            </>
          )}
          {phase === 'defend' && (
            <>
              {/* O relógio é leitura, não alarme: `ink` sempre, `tabular-nums`
                  (D-J8 — era `#facc15` → `#f87171` no último segundo). */}
              <p style={phaseTitle}>
                {isPt ? `${enemy.name} atacando — desvie!` : `${enemy.name} attacking — dodge!`}{' '}
                <span className="sm2-num">{defendTimeLeft.toFixed(1)}s</span>
              </p>
              <TimingBar key={`def-${floor}-${enemyIdx}-${enemyHp}-${playerHp}`} speed={enemy.speed * 1.2} label={isPt ? 'Desviar!' : 'Dodge!'} onStop={a => handleDefend(a)} />
            </>
          )}
          {phase === 'result' && popup && (
            <FxPopup icon={popup.icon} title={popup.title} detail={popup.detail} />
          )}
          {phase === 'enemy-down' && (
            <>
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
            </>
          )}
          {phase === 'floor-clear' && (
            <>
              <p style={phaseTitle}>{isPt ? `Camada ${floor} limpa.` : `Layer ${floor} cleared.`}</p>
              {/* Copy §4: dá sentido ao escalonamento de tier (`LADDER_TIERS`)
                  sem falar em dificuldade como mérito. */}
              <p style={phaseLine}>{isPt ? 'Esta camada é mais antiga. A fauna também.' : 'This layer is older. So is what lives in it.'}</p>
              <p className="sm2-num" style={phaseLine}>{scoreLine}</p>
              {/* A cura é FATO em `muted`, não prêmio (D-J8). */}
              <p style={phaseLine}>{rewardMsg}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={nextFloor} style={{ ...sm2Button('primary'), flex: 1, minWidth: 0, padding: '0 8px', whiteSpace: 'nowrap' }}>
                  {isPt ? `Camada ${floor + 1}` : `Layer ${floor + 1}`}
                </button>
                <button type="button" onClick={exitRun} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 8px', whiteSpace: 'nowrap' }}>
                  {isPt ? 'Sair c/ placar' : 'Bank & exit'}
                </button>
              </div>
            </>
          )}
          {phase === 'run-complete' && (
            <>
              {/* Nenhuma cor de prêmio: o que é ganho fala pela frase (D-J8). */}
              {/* Copy §4: fato, nunca "você dominou a masmorra" (L12). O
                  número vem de `MAX_FLOORS`. */}
              <p style={phaseTitle}>{isPt ? `As ${MAX_FLOORS} camadas ficaram para trás.` : `All ${MAX_FLOORS} layers are behind you.`}</p>
              <p className="sm2-num" style={phaseLine}>{scoreLine}</p>
              {/* Copy §4, "o que se traz" (§7, §12): cobre Bits e fagulha-coração. */}
              <p style={phaseLine}>{isPt ? 'Da fenda ele trouxe fragmentos que ainda não assentaram.' : "From the rift he brought fragments that haven't settled yet."}</p>
              {/* Copy §4, o nó (§7, L4): a P5 foi decidida pelo dono em
                  21/09/2026 — o nome `Glitchtama` FICA (`EXCECOES` da régua),
                  então a frase entra com ele. "Usar" é o verbo da pastinha. */}
              <p style={phaseLine}>
                {isPt
                  ? 'Um Glitchtama, com um dia inteiro preso dentro. Usar dá àquele dia o fechamento que ele não teve. (pastinha de itens)'
                  : 'A Glitchtama, with a whole day caught inside. Using it gives that day the closing it never had. (Items folder)'}
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
            </>
          )}
          {phase === 'lost' && (
            <>
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
            </>
          )}
        </div>
      )}
    </GameRoot>
  );
}
