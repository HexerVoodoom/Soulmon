import { useState, useEffect, useRef, useCallback } from 'react';
import { getSpriteForStage } from '../utils/sprites';
import { playTaskComplete, playDegenerate, playFeed } from '../utils/sounds';
import { getStageLevel } from '../types/progression';
import {
  buildDungeonWave, getDungeonDifficulty, getDungeonBest,
  setDungeonDifficultyAtLeast, recordDungeonScore, LADDER_TIERS,
  type DungeonEnemy,
} from '../utils/dungeon';
import { BITS_ICON } from '../utils/currency';
import type { Language } from '../utils/i18n';

/**
 * Dungeon minigame — timing-bar battle over an ascending enemy ladder.
 *
 * A wave is a fixed ladder of RANDOM Digimon climbing the tiers in order
 * (baby-i → baby-ii → rookie → champion → ultimate → mega), each stronger than
 * the last. Clearing the whole ladder advances the dungeon level: the next
 * wave's enemies deal MORE damage and take LESS. That level persists (resets
 * monthly), so runs start where you left off and only get harder.
 *
 * Attack: stop the sweeping marker near CENTER for more damage (≥92% = crit).
 * Defense: same bar, timed — center dodges, a perfect stop dodges + counters.
 * A run costs one of the day's limited entries; LOSING costs one real heart, so
 * entry is blocked at ≤1 heart. Hearts (not food) can drop, and the run's score
 * feeds a best-score ranking.
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
const PERFECT = 0.92;
const DEFEND_TIME = 3.0;   // seconds to react on defense
const POPUP_MS = 1400;     // how long result popups stay before the next phase
const CLEAR_BONUS = 12;    // 🎖️ for clearing a whole wave

type Phase = 'intro' | 'blocked' | 'attack' | 'defend' | 'result' | 'enemy-down' | 'wave-clear' | 'lost';
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
export function DungeonGame({ evolutionStage, language, onEnter, onLose, onHeartDrop, onEarnPoints, onExit }: {
  evolutionStage: string;
  language: Language;
  /** Start a run: gates on HP only. Returns the starting level. */
  onEnter: () => { ok: true; level: number; best: number } | { ok: false; reason: 'hp' };
  /** Losing costs 1 real heart. */
  onLose: () => void;
  /** Rolls for a heart drop (added to Items); returns whether one dropped. */
  onHeartDrop: () => boolean;
  /** Grants 🪙 Bits. */
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
  const [waveLevel, setWaveLevel] = useState(() => getDungeonDifficulty());
  const [best, setBest] = useState(() => getDungeonBest());
  const [runScore, setRunScore] = useState(0);
  const [wavesCleared, setWavesCleared] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const defendResolvedRef = useRef(false);
  const runScoreRef = useRef(0);

  const enemy = enemies[enemyIdx];
  const petSprite = getSpriteForStage(evolutionStage);
  const mono = { fontFamily: 'monospace' as const };
  const ladderLen = LADDER_TIERS.length;

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

  // Begin a run at the persisted dungeon level; gated only by HP.
  const startRun = () => {
    const res = onEnter();
    if (!res.ok) {
      setBlocked(true);
      setPhase('blocked');
      return;
    }
    const list = buildDungeonWave(res.level, evolutionStage);
    setWaveLevel(res.level);
    setBest(res.best);
    setEnemies(list);
    setEnemyIdx(0);
    setEnemyHp(list[0].hp);
    setPlayerHp(playerStats.hp);
    runScoreRef.current = 0;
    setRunScore(0);
    setWavesCleared(0);
    setRewardMsg('');
    setPopup(null);
    setBlocked(false);
    setPhase('attack');
  };

  // Enemy defeated: grant points + roll a heart drop, then show the confirm screen.
  const defeatEnemy = (finalMsg: Popup) => {
    playTaskComplete();
    addPoints(enemy.points);
    const gotHeart = onHeartDrop();
    setRewardMsg(
      `${BITS_ICON} +${enemy.points} Bits` +
      (gotHeart ? ` · 💗 +1 ${isPt ? 'coração' : 'heart'}` : ''),
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

  // Advance to the next enemy, or clear the wave (bump level, heal a little).
  const nextEnemy = () => {
    if (enemyIdx + 1 >= enemies.length) {
      playFeed();
      addPoints(CLEAR_BONUS);
      recordDungeonScore(runScoreRef.current);
      setBest(getDungeonBest());
      setDungeonDifficultyAtLeast(waveLevel + 1);  // persist progress (monthly)
      const heal = Math.ceil(playerStats.hp * 0.25);
      setPlayerHp(hp => Math.min(playerStats.hp, hp + heal));
      setRunScore(runScoreRef.current);
      setWavesCleared(n => n + 1);
      setRewardMsg(isPt ? `Recuperou ${heal} de HP` : `Recovered ${heal} HP`);
      setPhase('wave-clear');
      return;
    }
    const idx = enemyIdx + 1;
    setEnemyIdx(idx);
    setEnemyHp(enemies[idx].hp);
    setRewardMsg('');
    setPhase('attack');
  };

  // Continue into the next (harder) wave, carrying HP over.
  const continueWave = () => {
    const nextWave = waveLevel + 1;
    const list = buildDungeonWave(nextWave, evolutionStage);
    setWaveLevel(nextWave);
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

  const inBattle = enemies.length > 0 && ['attack', 'defend', 'result', 'enemy-down', 'wave-clear', 'lost'].includes(phase);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'linear-gradient(180deg, #0b0f17 0%, #121a2a 60%, #1a1426 100%)', display: 'flex', flexDirection: 'column', color: '#e8eefc' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
        <span style={{ ...mono, fontWeight: 800, fontSize: '0.95rem', letterSpacing: 1 }}>
          ⚔️ {isPt ? 'MASMORRA' : 'DUNGEON'}
          <span style={{ color: '#c084fc', marginLeft: 8, fontSize: '0.8rem' }}>{isPt ? 'Onda' : 'Wave'} {waveLevel}</span>
          {inBattle ? <span style={{ color: '#9fb2d8', marginLeft: 8, fontSize: '0.8rem' }}>{enemyIdx + 1}/{ladderLen}</span> : null}
        </span>
        <button onClick={exitRun} style={{ ...mono, background: 'rgba(255,255,255,0.08)', border: '1px solid #2c3a52', color: '#e8eefc', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
          {isPt ? 'Sair' : 'Exit'}
        </button>
      </div>

      {/* Battlefield (only during a run) */}
      {inBattle && enemy && (
        <div style={{ flex: 1, position: 'relative', margin: '0 16px', borderRadius: 12, border: '1px solid #2c3a52', background: 'repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(90,120,190,0.07) 31px), repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(90,120,190,0.07) 31px)', overflow: 'hidden' }}>
          {/* Enemy (top-right) */}
          <div style={{ position: 'absolute', top: 14, right: 16, textAlign: 'right' }}>
            <p style={{ ...mono, fontSize: '0.8rem', marginBottom: 4 }}>{enemy.name}</p>
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
            <p style={{ ...mono, fontSize: '0.8rem', marginBottom: 4 }}>{isPt ? 'Você' : 'You'}</p>
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
            <span>🌊 {isPt ? 'Onda inicial' : 'Start wave'}: <b style={{ color: '#c084fc' }}>{waveLevel}</b></span>
          </div>
          {blocked ? (
            <p style={{ ...mono, fontSize: '0.82rem', color: '#f87171', maxWidth: 300, fontWeight: 700 }}>
              {isPt ? '💔 Corações insuficientes! Perder custa 1 coração — recupere antes (não dá pra entrar com 1 ou meio coração).'
                    : '💔 Not enough hearts! Losing costs 1 heart — recover first (you can\'t enter with 1 or half a heart).'}
            </p>
          ) : (
            <p style={{ ...mono, fontSize: '0.76rem', color: '#9fb2d8', maxWidth: 320 }}>
              {isPt
                ? 'Escada de inimigos bebê→mega, cada um mais forte. Vença todos pra subir de onda — aí ficam ainda mais fortes. Perder custa 1 coração real!'
                : 'Enemy ladder baby→mega, each stronger. Beat them all to level up the wave — they get even tougher. Losing costs 1 real heart!'}
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
              <TimingBar key={`atk-${waveLevel}-${enemyIdx}-${enemyHp}-${playerHp}`} speed={enemy.speed} color="#4ade80" label={isPt ? 'ATACAR!' : 'ATTACK!'} onStop={handleAttack} />
            </div>
          )}
          {phase === 'defend' && (
            <div>
              <p style={{ ...mono, textAlign: 'center', fontSize: '0.82rem', fontWeight: 800, color: defendTimeLeft <= 1 ? '#f87171' : '#facc15', marginBottom: 6 }}>
                {isPt ? `${enemy.name} atacando — DESVIE!` : `${enemy.name} attacking — DODGE!`} ⏱ {defendTimeLeft.toFixed(1)}s
              </p>
              <TimingBar key={`def-${waveLevel}-${enemyIdx}-${enemyHp}-${playerHp}`} speed={enemy.speed * 1.2} color="#60a5fa" label={isPt ? 'DESVIAR!' : 'DODGE!'} onStop={a => handleDefend(a)} />
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
                  ? (isPt ? `LIMPAR ONDA (+${CLEAR_BONUS} ${BITS_ICON})` : `CLEAR WAVE (+${CLEAR_BONUS} ${BITS_ICON})`)
                  : (isPt ? `DESAFIAR ${enemies[enemyIdx + 1].name.toUpperCase()} →` : `CHALLENGE ${enemies[enemyIdx + 1].name.toUpperCase()} →`)}
              </button>
            </div>
          )}
          {phase === 'wave-clear' && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ ...mono, fontWeight: 800, fontSize: '1.05rem', marginBottom: 4 }}>
                🌊 {isPt ? `Onda ${waveLevel} concluída!` : `Wave ${waveLevel} cleared!`}
              </p>
              <p style={{ ...mono, fontSize: '0.8rem', color: '#c6d4f2', marginBottom: 2 }}>
                {isPt ? `Placar: ${runScore} · Recorde: ${best}` : `Score: ${runScore} · Best: ${best}`}
              </p>
              <p style={{ ...mono, fontSize: '0.74rem', color: '#4ade80', marginBottom: 10 }}>{rewardMsg}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={continueWave}
                  style={{ ...mono, flex: 1, padding: '12px 0', borderRadius: 8, border: 'none', background: '#c084fc', color: '#0b0f17', fontWeight: 800, cursor: 'pointer' }}>
                  {isPt ? `ONDA ${waveLevel + 1} →` : `WAVE ${waveLevel + 1} →`}
                </button>
                <button onClick={exitRun}
                  style={{ ...mono, flex: 1, padding: '12px 0', borderRadius: 8, border: '1px solid #2c3a52', background: 'transparent', color: '#e8eefc', fontWeight: 800, cursor: 'pointer' }}>
                  {isPt ? 'SAIR C/ PLACAR' : 'BANK & EXIT'}
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
                {isPt ? `Ondas: ${wavesCleared} · Placar: ${runScore} · Recorde: ${best}` : `Waves: ${wavesCleared} · Score: ${runScore} · Best: ${best}`}
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
