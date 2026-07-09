import { useState, useEffect, useRef, useCallback } from 'react';
import { getSpriteForStage } from '../utils/sprites';
import { playTaskComplete, playDegenerate, playFeed } from '../utils/sounds';
import { getStageLevel } from '../types/progression';
import {
  buildDungeonWave, getDungeonDifficulty, getDungeonBest,
  setDungeonDifficultyAtLeast, recordDungeonScore, LADDER_TIERS,
  type DungeonEnemy,
} from '../utils/dungeon';
import { buildRunScenes, DUNGEON_SCENES, type DungeonScene } from '../utils/dungeonScenes';
import type { Language } from '../utils/i18n';

/**
 * Dungeon minigame — timing-bar battle across up to 5 FLOORS.
 *
 * A run is up to 5 floors; each floor is a fixed ladder of 6 RANDOM Digimon
 * climbing the tiers (baby-i → baby-ii → rookie → champion → ultimate → mega).
 * Floor difficulty = base level + (floor-1), so floor 1 suits a rookie, floor 2
 * a champion, floor 3 an ultimate… — a couple floors above the pet is brutal.
 * Each floor has its own retro scene (Tamagotchi/VHS/synthwave/CRT/glitch).
 * Clearing all 5 floors COMPLETES the run and raises the base level (next run is
 * harder); the base level resets WEEKLY. Player HP carries between floors with a
 * small heal on each clear.
 *
 * Attack: stop the sweeping marker near CENTER for more damage (≥92% = crit).
 * Defense: same bar, timed — center dodges, a perfect stop dodges + counters.
 * No daily cap — entry is gated only by HP: LOSING costs one real heart, so you
 * can't enter with ≤1 heart. Hearts (rarely) drop; the run score feeds a ranking.
 */

const PLAYER_STATS: Record<string, { hp: number; dmg: number }> = {
  digiegg:  { hp: 10, dmg: 3 },
  'baby-i': { hp: 10, dmg: 3 },
  'baby-ii':{ hp: 11, dmg: 3 },
  rookie:   { hp: 12, dmg: 4 },
  champion: { hp: 14, dmg: 5 },
  ultimate: { hp: 16, dmg: 6 },
  mega:     { hp: 18, dmg: 7 },
  ultra:    { hp: 20, dmg: 8 },
};
const MAX_FLOORS = 5;
const PERFECT = 0.92;
const DEFEND_TIME = 3.0;   // seconds to react on defense
const POPUP_MS = 1400;     // how long result popups stay before the next phase
// Bits for clearing a floor — scales with how deep you are (10/15/20/25/30).
const clearBonus = (floor: number) => 10 + 5 * (floor - 1);

type Phase = 'intro' | 'blocked' | 'attack' | 'defend' | 'result' | 'enemy-down' | 'floor-clear' | 'run-complete' | 'lost';
interface Popup { icon: string; title: string; detail: string; color: string }

// ── Timing bar ─────────────────────────────────────────────────────────────
function TimingBar({ speed, color, label, onStop }: {
  speed: number;
  color: string;
  label: string;
  onStop: (accuracy: number) => void;
}) {
  const [pos, setPos] = useState(0);
  const posRef = useRef(0);
  const rafRef = useRef(0);
  const stoppedRef = useRef(false);

  useEffect(() => {
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = (((t - t0) / 1000) * speed) % 2;
      const x = p < 1 ? p : 2 - p; // ping-pong 0..1..0
      posRef.current = x;
      setPos(x);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [speed]);

  const stop = () => {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    cancelAnimationFrame(rafRef.current);
    onStop(1 - Math.abs(posRef.current - 0.5) * 2); // 1 = dead center
  };

  const mono = { fontFamily: 'monospace' as const };
  return (
    <div style={{ width: '100%' }}>
      <div
        onPointerDown={stop}
        style={{ position: 'relative', height: 34, borderRadius: 6, background: '#131a26', border: '1px solid #2c3a52', overflow: 'hidden', cursor: 'pointer', touchAction: 'manipulation' }}
      >
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '35%', width: '30%', background: 'rgba(250, 204, 21, 0.22)' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '46%', width: '8%', background: 'rgba(74, 222, 128, 0.45)' }} />
        <div style={{ position: 'absolute', top: 2, bottom: 2, left: `calc(${pos * 100}% - 3px)`, width: 6, borderRadius: 2, background: color, boxShadow: `0 0 8px ${color}` }} />
      </div>
      <button
        onPointerDown={stop}
        style={{ ...mono, width: '100%', marginTop: 8, padding: '10px 0', borderRadius: 8, border: 'none', background: color, color: '#0b0f17', fontWeight: 800, fontSize: '0.95rem', letterSpacing: 1, cursor: 'pointer' }}
      >
        {label}
      </button>
    </div>
  );
}

// ── Game ───────────────────────────────────────────────────────────────────
export function DungeonGame({ evolutionStage, language, onEnter, onLose, onHeartDrop, onDigimentalDrop, onGlitchtama, onEnemyDefeated, onEarnPoints, onExit }: {
  evolutionStage: string;
  language: Language;
  /** Start a run: gates on HP only. Returns the base level (floor 1's level). */
  onEnter: () => { ok: true; level: number; best: number } | { ok: false; reason: 'hp' };
  /** Losing costs 1 real heart. */
  onLose: () => void;
  /** Rolls for a heart drop (added to Items); returns whether one dropped. */
  onHeartDrop: () => boolean;
  /** Rolls for a digimental drop (added to Items); returns its display name or null. */
  onDigimentalDrop: () => string | null;
  /** Completing all 5 floors grants a Glitchtama (added to Items). */
  onGlitchtama: () => void;
  /** Mission counter: called once per defeated enemy. */
  onEnemyDefeated: () => void;
  /** Grants Bits. */
  onEarnPoints: (pts: number) => void;
  onExit: () => void;
}) {
  const isPt = language === 'pt-BR';
  const playerStats = PLAYER_STATS[getStageLevel(evolutionStage)] ?? PLAYER_STATS.rookie;

  const [enemies, setEnemies] = useState<DungeonEnemy[]>([]);
  const [enemyIdx, setEnemyIdx] = useState(0);
  const [enemyHp, setEnemyHp] = useState(0);
  const [playerHp, setPlayerHp] = useState(playerStats.hp);
  const [phase, setPhase] = useState<Phase>('intro');
  const [popup, setPopup] = useState<Popup | null>(null);
  const [hitFx, setHitFx] = useState<'enemy' | 'player' | null>(null);
  const [rewardMsg, setRewardMsg] = useState('');
  const [defendTimeLeft, setDefendTimeLeft] = useState(DEFEND_TIME);
  const [baseLevel, setBaseLevel] = useState(() => getDungeonDifficulty());
  const [floor, setFloor] = useState(1);
  const [best, setBest] = useState(() => getDungeonBest());
  const [runScore, setRunScore] = useState(0);
  const [blocked, setBlocked] = useState(false);
  // 5 scenes drawn per run from the classic pool + the shop backdrops.
  const [runScenes, setRunScenes] = useState<DungeonScene[]>(() => buildRunScenes());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const defendResolvedRef = useRef(false);
  const runScoreRef = useRef(0);

  const enemy = enemies[enemyIdx];
  const petSprite = getSpriteForStage(evolutionStage);
  const mono = { fontFamily: 'monospace' as const };
  const ladderLen = LADDER_TIERS.length;
  const scene = runScenes[floor - 1] ?? DUNGEON_SCENES[0];
  // Some shop backdrops are LIGHT — keep the in-scene labels readable on them.
  const sceneLabel = { textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.5)' as const };

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

  // Begin a run at floor 1 (level = persisted base); gated only by HP.
  const startRun = () => {
    const res = onEnter();
    if (!res.ok) {
      setBlocked(true);
      setPhase('blocked');
      return;
    }
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
    setPopup(null);
    setBlocked(false);
    setPhase('attack');
  };

  // Enemy defeated: grant points + roll heart/digimental drops, then confirm.
  const defeatEnemy = (finalMsg: Popup) => {
    playTaskComplete();
    onEnemyDefeated();
    addPoints(enemy.points);
    const gotHeart = onHeartDrop();
    const digimental = onDigimentalDrop();
    setRewardMsg(
      `+${enemy.points} Bits` +
      (gotHeart ? ` · 💗 +1 ${isPt ? 'coração' : 'heart'}` : '') +
      (digimental ? ` · ✨ ${digimental}!` : ''),
    );
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
    const atkPopup: Popup = { icon: '⚔️', title, detail: isPt ? `${dmg} de dano no ${enemy.name}` : `${dmg} damage to ${enemy.name}`, color: '#4ade80' };

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
        color: '#60a5fa',
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
    setPopup({ icon: '💥', title, detail: isPt ? `Você sofreu ${taken} de dano` : `You took ${taken} damage`, color: '#f87171' });
    setPhase('result');

    if (newHp <= 0) {
      playDegenerate();
      onLose();                                   // -1 real heart
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

  const hpBar = (cur: number, max: number, color: string) => (
    <div style={{ width: 110, height: 10, borderRadius: 5, background: '#1c2636', border: '1px solid #2c3a52', overflow: 'hidden' }}>
      <div style={{ width: `${(cur / max) * 100}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
    </div>
  );

  const inBattle = enemies.length > 0 && ['attack', 'defend', 'result', 'enemy-down', 'floor-clear', 'run-complete', 'lost'].includes(phase);
  const sceneName = isPt ? scene.namePt : scene.nameEn;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#07090f', display: 'flex', flexDirection: 'column', color: '#e8eefc' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
        <span style={{ ...mono, fontWeight: 800, fontSize: '0.95rem', letterSpacing: 1 }}>
          ⚔️ {isPt ? 'MASMORRA' : 'DUNGEON'}
          <span style={{ color: scene.accent, marginLeft: 8, fontSize: '0.8rem' }}>
            {isPt ? 'Andar' : 'Floor'} {floor}/{MAX_FLOORS} · {sceneName}
          </span>
          {inBattle ? <span style={{ color: '#9fb2d8', marginLeft: 8, fontSize: '0.8rem' }}>{enemyIdx + 1}/{ladderLen}</span> : null}
        </span>
        <button onClick={exitRun} style={{ ...mono, background: 'rgba(255,255,255,0.08)', border: '1px solid #2c3a52', color: '#e8eefc', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
          {isPt ? 'Sair' : 'Exit'}
        </button>
      </div>

      {/* Battlefield (only during a run) — per-floor retro scene + VHS overlay */}
      {inBattle && enemy && (
        <div style={{ flex: 1, position: 'relative', margin: '0 16px', borderRadius: 12, border: `1px solid ${scene.accent}55`, background: scene.bg, overflow: 'hidden', boxShadow: `inset 0 0 60px rgba(0,0,0,0.6)` }}>
          {/* VHS scanline overlay */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0 1px, transparent 1px 3px)', backgroundSize: '100% 6px', animation: 'dungeon-vhs 5s linear infinite', opacity: 0.55, mixBlendMode: 'overlay' }} />
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: `inset 0 0 40px ${scene.accent}22` }} />

          {/* Enemy (top-right) */}
          <div style={{ position: 'absolute', top: 14, right: 16, textAlign: 'right' }}>
            <p style={{ ...mono, ...sceneLabel, fontSize: '0.8rem', marginBottom: 4 }}>{enemy.name}</p>
            {hpBar(enemyHp, enemy.hp, '#f87171')}
          </div>
          <img
            src={getSpriteForStage(enemy.stage)}
            alt={enemy.name}
            style={{
              position: 'absolute', top: '18%', right: '10%', width: 96, height: 96, objectFit: 'contain',
              imageRendering: 'pixelated',
              ['--flip' as string]: '-1',
              filter: hitFx === 'enemy' ? 'brightness(3) drop-shadow(0 0 10px #f87171)' : 'drop-shadow(0 0 8px rgba(248,113,113,0.35))',
              transition: 'filter 0.15s',
              animation: 'dungeon-idle 1.6s ease-in-out infinite',
            } as React.CSSProperties}
          />
          {/* Pet (bottom-left) */}
          <div style={{ position: 'absolute', bottom: 'calc(6% + 96px)', left: 16 }}>
            <p style={{ ...mono, ...sceneLabel, fontSize: '0.8rem', marginBottom: 4 }}>{isPt ? 'Você' : 'You'}</p>
            {hpBar(playerHp, playerStats.hp, '#4ade80')}
          </div>
          <img
            src={petSprite}
            alt="pet"
            style={{
              position: 'absolute', bottom: '6%', left: '8%', width: 84, height: 84, objectFit: 'contain',
              imageRendering: 'pixelated',
              filter: hitFx === 'player' ? 'brightness(3) drop-shadow(0 0 10px #f87171)' : 'drop-shadow(0 0 8px rgba(74,222,128,0.35))',
              transition: 'filter 0.15s',
              animation: 'dungeon-idle 1.3s ease-in-out infinite',
            }}
          />

          {/* Result popup — feedback beat between actions */}
          {popup && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,9,15,0.45)' }}>
              <div style={{ ...mono, textAlign: 'center', background: '#0e1522', border: `2px solid ${popup.color}`, borderRadius: 12, padding: '16px 26px', boxShadow: `0 0 24px ${popup.color}55` }}>
                <div style={{ fontSize: '1.7rem', lineHeight: 1.2 }}>{popup.icon}</div>
                <p style={{ fontWeight: 800, fontSize: '1rem', color: popup.color, margin: '4px 0 2px' }}>{popup.title}</p>
                <p style={{ fontSize: '0.82rem', color: '#c6d4f2' }}>{popup.detail}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Intro / blocked title area */}
      {(phase === 'intro' || phase === 'blocked') && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }}>⚔️</div>
          <div style={{ ...mono, display: 'flex', gap: 18, fontSize: '0.82rem', color: '#c6d4f2' }}>
            <span>🏅 {isPt ? 'Recorde' : 'Best'}: <b style={{ color: '#facc15' }}>{best}</b></span>
            <span>🔥 {isPt ? 'Dificuldade base' : 'Base level'}: <b style={{ color: '#c084fc' }}>{baseLevel}</b></span>
          </div>
          {blocked ? (
            <p style={{ ...mono, fontSize: '0.82rem', color: '#f87171', maxWidth: 300, fontWeight: 700 }}>
              {isPt ? '💔 Corações insuficientes! Perder custa 1 coração — recupere antes (não dá pra entrar com 1 ou meio coração).'
                    : '💔 Not enough hearts! Losing costs 1 heart — recover first (you can\'t enter with 1 or half a heart).'}
            </p>
          ) : (
            <p style={{ ...mono, fontSize: '0.76rem', color: '#9fb2d8', maxWidth: 330 }}>
              {isPt
                ? '5 andares, cada um com 6 inimigos e mais forte que o anterior. Andar 1 serve pra um rookie; alguns andares acima ficam brutais. Concluir a run inteira sobe a dificuldade (reset semanal). Perder custa 1 coração real!'
                : '5 floors, each with 6 enemies and tougher than the last. Floor 1 suits a rookie; a few floors up gets brutal. Completing the whole run raises the difficulty (weekly reset). Losing costs 1 real heart!'}
            </p>
          )}
          <button
            onClick={blocked ? exitRun : startRun}
            style={{
              ...mono, width: '100%', maxWidth: 320, padding: '12px 0', borderRadius: 8, border: 'none',
              background: blocked ? '#60a5fa' : '#4ade80', color: '#0b0f17',
              fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
            }}>
            {blocked
              ? (isPt ? 'VOLTAR' : 'BACK')
              : (isPt ? 'ENTRAR NA MASMORRA' : 'ENTER THE DUNGEON')}
          </button>
        </div>
      )}

      {/* Action area (during a run) */}
      {inBattle && (
        <div style={{ padding: 16, minHeight: 150 }}>
          {phase === 'attack' && (
            <div>
              <p style={{ ...mono, textAlign: 'center', fontSize: '0.78rem', color: '#9fb2d8', marginBottom: 6 }}>
                {isPt ? 'Seu turno — mire no centro!' : 'Your turn — aim for the center!'}
              </p>
              <TimingBar key={`atk-${floor}-${enemyIdx}-${enemyHp}-${playerHp}`} speed={enemy.speed} color="#4ade80" label={isPt ? 'ATACAR!' : 'ATTACK!'} onStop={handleAttack} />
            </div>
          )}
          {phase === 'defend' && (
            <div>
              <p style={{ ...mono, textAlign: 'center', fontSize: '0.82rem', fontWeight: 800, color: defendTimeLeft <= 1 ? '#f87171' : '#facc15', marginBottom: 6 }}>
                {isPt ? `${enemy.name} atacando — DESVIE!` : `${enemy.name} attacking — DODGE!`} ⏱ {defendTimeLeft.toFixed(1)}s
              </p>
              <TimingBar key={`def-${floor}-${enemyIdx}-${enemyHp}-${playerHp}`} speed={enemy.speed * 1.2} color="#60a5fa" label={isPt ? 'DESVIAR!' : 'DODGE!'} onStop={a => handleDefend(a)} />
            </div>
          )}
          {phase === 'result' && (
            <p style={{ ...mono, textAlign: 'center', fontSize: '0.8rem', color: '#5d729c', paddingTop: 24 }}>…</p>
          )}
          {phase === 'enemy-down' && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ ...mono, fontWeight: 800, marginBottom: 4 }}>
                ✅ {isPt ? `${enemy.name} derrotado!` : `${enemy.name} defeated!`}
              </p>
              <p style={{ ...mono, fontSize: '0.82rem', color: '#facc15', marginBottom: 10 }}>{rewardMsg}</p>
              <button onClick={nextEnemy}
                style={{ ...mono, width: '100%', padding: '12px 0', borderRadius: 8, border: 'none', background: '#facc15', color: '#0b0f17', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }}>
                {enemyIdx + 1 >= enemies.length
                  ? (floor >= MAX_FLOORS
                      ? (isPt ? `CONCLUIR RUN (+${clearBonus(floor)} Bits + 🌀)` : `FINISH RUN (+${clearBonus(floor)} Bits + 🌀)`)
                      : (isPt ? `LIMPAR ANDAR (+${clearBonus(floor)} Bits)` : `CLEAR FLOOR (+${clearBonus(floor)} Bits)`))
                  : (isPt ? `DESAFIAR ${enemies[enemyIdx + 1].name.toUpperCase()} →` : `CHALLENGE ${enemies[enemyIdx + 1].name.toUpperCase()} →`)}
              </button>
            </div>
          )}
          {phase === 'floor-clear' && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ ...mono, fontWeight: 800, fontSize: '1.05rem', marginBottom: 4 }}>
                🚪 {isPt ? `Andar ${floor} concluído!` : `Floor ${floor} cleared!`}
              </p>
              <p style={{ ...mono, fontSize: '0.8rem', color: '#c6d4f2', marginBottom: 2 }}>
                {isPt ? `Placar: ${runScore} · Recorde: ${best}` : `Score: ${runScore} · Best: ${best}`}
              </p>
              <p style={{ ...mono, fontSize: '0.74rem', color: '#4ade80', marginBottom: 10 }}>{rewardMsg}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={nextFloor}
                  style={{ ...mono, flex: 1, padding: '12px 0', borderRadius: 8, border: 'none', background: (runScenes[floor] ?? DUNGEON_SCENES[0]).accent, color: '#0b0f17', fontWeight: 800, cursor: 'pointer' }}>
                  {isPt ? `ANDAR ${floor + 1} →` : `FLOOR ${floor + 1} →`}
                </button>
                <button onClick={exitRun}
                  style={{ ...mono, flex: 1, padding: '12px 0', borderRadius: 8, border: '1px solid #2c3a52', background: 'transparent', color: '#e8eefc', fontWeight: 800, cursor: 'pointer' }}>
                  {isPt ? 'SAIR C/ PLACAR' : 'BANK & EXIT'}
                </button>
              </div>
            </div>
          )}
          {phase === 'run-complete' && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ ...mono, fontWeight: 800, fontSize: '1.05rem', marginBottom: 4, color: '#facc15' }}>
                {isPt ? '🏆 RUN COMPLETA! Os 5 andares caíram!' : '🏆 RUN COMPLETE! All 5 floors down!'}
              </p>
              <p style={{ ...mono, fontSize: '0.8rem', color: '#c6d4f2', marginBottom: 2 }}>
                {isPt ? `Placar: ${runScore} · Recorde: ${best}` : `Score: ${runScore} · Best: ${best}`}
              </p>
              <p style={{ ...mono, fontSize: '0.78rem', color: '#4ade80', marginBottom: 2, fontWeight: 800 }}>
                🌀 {isPt ? 'Glitchtama obtido! (pastinha de itens)' : 'Glitchtama acquired! (Items folder)'}
              </p>
              <p style={{ ...mono, fontSize: '0.74rem', color: '#c084fc', marginBottom: 10 }}>
                {isPt ? 'A próxima run ficou mais difícil.' : 'The next run got harder.'}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={startRun}
                  style={{ ...mono, flex: 1, padding: '12px 0', borderRadius: 8, border: 'none', background: '#4ade80', color: '#0b0f17', fontWeight: 800, cursor: 'pointer' }}>
                  {isPt ? 'NOVA RUN' : 'NEW RUN'}
                </button>
                <button onClick={onExit}
                  style={{ ...mono, flex: 1, padding: '12px 0', borderRadius: 8, border: '1px solid #2c3a52', background: 'transparent', color: '#e8eefc', fontWeight: 800, cursor: 'pointer' }}>
                  {isPt ? 'SAIR' : 'EXIT'}
                </button>
              </div>
            </div>
          )}
          {phase === 'lost' && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ ...mono, fontWeight: 800, fontSize: '1.05rem', marginBottom: 4 }}>
                {isPt ? '💀 Você foi derrotado... (−1 ❤️)' : '💀 You were defeated... (−1 ❤️)'}
              </p>
              <p style={{ ...mono, fontSize: '0.8rem', color: '#c6d4f2', marginBottom: 10 }}>
                {isPt ? `Andar ${floor} · Placar: ${runScore} · Recorde: ${best}` : `Floor ${floor} · Score: ${runScore} · Best: ${best}`}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={startRun}
                  style={{ ...mono, flex: 1, padding: '12px 0', borderRadius: 8, border: 'none', background: '#4ade80', color: '#0b0f17', fontWeight: 800, cursor: 'pointer' }}>
                  {isPt ? 'JOGAR DE NOVO' : 'PLAY AGAIN'}
                </button>
                <button onClick={onExit}
                  style={{ ...mono, flex: 1, padding: '12px 0', borderRadius: 8, border: '1px solid #2c3a52', background: 'transparent', color: '#e8eefc', fontWeight: 800, cursor: 'pointer' }}>
                  {isPt ? 'SAIR' : 'EXIT'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
