import { useState, useEffect, useRef, useCallback } from 'react';
import { getSpriteForStage } from '../utils/sprites';
import { playTaskComplete, playDegenerate, playFeed } from '../utils/sounds';
import type { Language } from '../utils/i18n';

/**
 * Dungeon minigame — timing-bar battle.
 *
 * Attack: a marker sweeps back and forth; stop it near the CENTER for more
 * damage (perfect ≥92% = crit). Defense uses the same mechanic but graded the
 * other way: the closer to center, the more damage you avoid — a perfect stop
 * fully dodges AND lands a free counter-attack.
 *
 * The run is self-contained (does not touch the pet's real HP). Each defeated
 * enemy grants a food reward via onReward (App caps rewards per day).
 */

interface Enemy {
  name: string;
  stage: string;   // sprite key
  hp: number;
  atk: number;
  speed: number;   // bar sweeps per second (higher = harder)
}

const ENEMIES: Enemy[] = [
  { name: 'Bakemon',      stage: 'bakemon',      hp: 8,  atk: 3, speed: 0.9 },
  { name: 'Tuskmon',      stage: 'tuskmon',      hp: 12, atk: 4, speed: 1.15 },
  { name: 'Gigadramon',   stage: 'gigadramon',   hp: 16, atk: 5, speed: 1.4 },
  { name: 'LadyDevimon',  stage: 'ladydevimon',  hp: 20, atk: 6, speed: 1.7 },
  { name: 'Titamon',      stage: 'titamon',      hp: 26, atk: 7, speed: 2.0 },
];

const PLAYER_MAX_HP = 12;
const PLAYER_BASE_DMG = 4;
const PERFECT = 0.92;

type Phase = 'intro' | 'attack' | 'defend' | 'enemy-down' | 'cleared' | 'lost';

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
        {/* zones: outer (weak) / mid (good) / center (perfect) */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '35%', width: '30%', background: 'rgba(250, 204, 21, 0.22)' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '46%', width: '8%', background: 'rgba(74, 222, 128, 0.45)' }} />
        {/* marker */}
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
export function DungeonGame({ evolutionStage, language, onReward, onExit }: {
  evolutionStage: string;
  language: Language;
  /** Called on each enemy defeated; returns the food emoji granted, or null if the daily cap was hit. */
  onReward: () => string | null;
  onExit: () => void;
}) {
  const isPt = language === 'pt-BR';
  const [enemyIdx, setEnemyIdx] = useState(0);
  const [enemyHp, setEnemyHp] = useState(ENEMIES[0].hp);
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
  const [phase, setPhase] = useState<Phase>('intro');
  const [message, setMessage] = useState('');
  const [hitFx, setHitFx] = useState<'enemy' | 'player' | null>(null);
  const [rewardMsg, setRewardMsg] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enemy = ENEMIES[enemyIdx];
  const petSprite = getSpriteForStage(evolutionStage);
  const mono = { fontFamily: 'monospace' as const };

  // Single place to schedule delayed phase changes (cleared on unmount)
  const after = useCallback((ms: number, fn: () => void) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(fn, ms);
  }, []);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const flash = (who: 'enemy' | 'player') => {
    setHitFx(who);
    setTimeout(() => setHitFx(null), 450);
  };

  // Player attack: damage scales with accuracy² (edge hits still chip a little)
  const handleAttack = (acc: number) => {
    const crit = acc >= PERFECT;
    const dmg = Math.max(1, Math.round(PLAYER_BASE_DMG * (0.25 + 0.75 * acc * acc) * (crit ? 1.5 : 1)));
    const newHp = Math.max(0, enemyHp - dmg);
    setEnemyHp(newHp);
    flash('enemy');
    try { navigator.vibrate?.(crit ? 40 : 15); } catch { /* noop */ }
    setMessage(crit
      ? (isPt ? `PERFEITO! ${dmg} de dano!` : `PERFECT! ${dmg} damage!`)
      : acc >= 0.6
        ? (isPt ? `Bom golpe! ${dmg} de dano` : `Good hit! ${dmg} damage`)
        : (isPt ? `Raspão... ${dmg} de dano` : `Graze... ${dmg} damage`));
    if (newHp <= 0) {
      playTaskComplete();
      const emoji = onReward();
      setRewardMsg(emoji
        ? (isPt ? `Recompensa: ${emoji} +1 comida!` : `Reward: ${emoji} +1 food!`)
        : (isPt ? 'Sem mais recompensas hoje.' : 'No more rewards today.'));
      setPhase('enemy-down');
      return;
    }
    after(1000, () => {
      setMessage(isPt ? `${enemy.name} vai atacar — DESVIE!` : `${enemy.name} is attacking — DODGE!`);
      setPhase('defend');
    });
  };

  // Defense: graded — closer to center avoids more; perfect = full dodge + counter
  const handleDefend = (acc: number) => {
    if (acc >= PERFECT) {
      const counter = 2;
      const newEnemyHp = Math.max(0, enemyHp - counter);
      setEnemyHp(newEnemyHp);
      flash('enemy');
      try { navigator.vibrate?.(40); } catch { /* noop */ }
      setMessage(isPt ? `DESVIO PERFEITO! Contra-ataque: ${counter} de dano!` : `PERFECT DODGE! Counter: ${counter} damage!`);
      if (newEnemyHp <= 0) {
        playTaskComplete();
        const emoji = onReward();
        setRewardMsg(emoji
          ? (isPt ? `Recompensa: ${emoji} +1 comida!` : `Reward: ${emoji} +1 food!`)
          : (isPt ? 'Sem mais recompensas hoje.' : 'No more rewards today.'));
        setPhase('enemy-down');
        return;
      }
      after(1100, () => { setMessage(isPt ? 'Seu turno!' : 'Your turn!'); setPhase('attack'); });
      return;
    }
    const taken = Math.max(1, Math.ceil(enemy.atk * (1 - acc)));
    const newHp = Math.max(0, playerHp - taken);
    setPlayerHp(newHp);
    flash('player');
    try { navigator.vibrate?.(30); } catch { /* noop */ }
    setMessage(acc >= 0.6
      ? (isPt ? `Desvio parcial! Sofreu ${taken}` : `Partial dodge! Took ${taken}`)
      : (isPt ? `Ataque em cheio! Sofreu ${taken}` : `Direct hit! Took ${taken}`));
    if (newHp <= 0) {
      playDegenerate();
      setPhase('lost');
      return;
    }
    after(1100, () => { setMessage(isPt ? 'Seu turno!' : 'Your turn!'); setPhase('attack'); });
  };

  const nextEnemy = () => {
    if (enemyIdx + 1 >= ENEMIES.length) { playFeed(); setPhase('cleared'); return; }
    const idx = enemyIdx + 1;
    setEnemyIdx(idx);
    setEnemyHp(ENEMIES[idx].hp);
    setRewardMsg('');
    setMessage(isPt ? `${ENEMIES[idx].name} apareceu!` : `${ENEMIES[idx].name} appeared!`);
    setPhase('attack');
  };

  const restart = () => {
    setEnemyIdx(0);
    setEnemyHp(ENEMIES[0].hp);
    setPlayerHp(PLAYER_MAX_HP);
    setRewardMsg('');
    setMessage('');
    setPhase('intro');
  };

  const hpBar = (cur: number, max: number, color: string) => (
    <div style={{ width: 110, height: 10, borderRadius: 5, background: '#1c2636', border: '1px solid #2c3a52', overflow: 'hidden' }}>
      <div style={{ width: `${(cur / max) * 100}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'linear-gradient(180deg, #0b0f17 0%, #121a2a 60%, #1a1426 100%)', display: 'flex', flexDirection: 'column', color: '#e8eefc' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
        <span style={{ ...mono, fontWeight: 800, fontSize: '0.95rem', letterSpacing: 1 }}>
          ⚔️ {isPt ? 'MASMORRA' : 'DUNGEON'} — {enemyIdx + 1}/{ENEMIES.length}
        </span>
        <button onClick={onExit} style={{ ...mono, background: 'rgba(255,255,255,0.08)', border: '1px solid #2c3a52', color: '#e8eefc', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
          {isPt ? 'Sair' : 'Exit'}
        </button>
      </div>

      {/* Battlefield */}
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
            ['--flip' as string]: '-1', // face the pet (animation reads this var)
            filter: hitFx === 'enemy' ? 'brightness(3) drop-shadow(0 0 10px #f87171)' : 'drop-shadow(0 0 8px rgba(248,113,113,0.35))',
            transition: 'filter 0.15s',
            animation: phase === 'lost' ? undefined : 'dungeon-idle 1.6s ease-in-out infinite',
          } as React.CSSProperties}
        />
        {/* Pet (bottom-left) */}
        <div style={{ position: 'absolute', bottom: 'calc(6% + 96px)', left: 16 }}>
          <p style={{ ...mono, fontSize: '0.8rem', marginBottom: 4 }}>{isPt ? 'Você' : 'You'}</p>
          {hpBar(playerHp, PLAYER_MAX_HP, '#4ade80')}
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
        {/* Message */}
        <p style={{ ...mono, position: 'absolute', top: '48%', left: 0, right: 0, textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, textShadow: '0 2px 6px #000', padding: '0 12px' }}>
          {message}
        </p>
      </div>

      {/* Action area */}
      <div style={{ padding: 16, minHeight: 140 }}>
        {phase === 'intro' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ ...mono, fontSize: '0.8rem', color: '#9fb2d8', marginBottom: 10 }}>
              {isPt
                ? 'Pare o marcador no CENTRO para causar mais dano. Na defesa, o centro desvia — perfeito contra-ataca!'
                : 'Stop the marker at the CENTER for more damage. On defense, center dodges — perfect counters!'}
            </p>
            <button onClick={() => { setMessage(isPt ? `${enemy.name} apareceu!` : `${enemy.name} appeared!`); setPhase('attack'); }}
              style={{ ...mono, width: '100%', padding: '12px 0', borderRadius: 8, border: 'none', background: '#4ade80', color: '#0b0f17', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}>
              {isPt ? 'ENTRAR NA MASMORRA' : 'ENTER THE DUNGEON'}
            </button>
          </div>
        )}
        {phase === 'attack' && (
          <TimingBar key={`atk-${enemyIdx}-${enemyHp}-${playerHp}`} speed={enemy.speed} color="#4ade80" label={isPt ? 'ATACAR!' : 'ATTACK!'} onStop={handleAttack} />
        )}
        {phase === 'defend' && (
          <TimingBar key={`def-${enemyIdx}-${enemyHp}-${playerHp}`} speed={enemy.speed * 1.2} color="#60a5fa" label={isPt ? 'DESVIAR!' : 'DODGE!'} onStop={handleDefend} />
        )}
        {phase === 'enemy-down' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ ...mono, fontWeight: 800, marginBottom: 4 }}>
              {isPt ? `${enemy.name} derrotado!` : `${enemy.name} defeated!`}
            </p>
            <p style={{ ...mono, fontSize: '0.8rem', color: '#9fb2d8', marginBottom: 10 }}>{rewardMsg}</p>
            <button onClick={nextEnemy}
              style={{ ...mono, width: '100%', padding: '12px 0', borderRadius: 8, border: 'none', background: '#facc15', color: '#0b0f17', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }}>
              {enemyIdx + 1 >= ENEMIES.length ? (isPt ? 'FINALIZAR' : 'FINISH') : (isPt ? 'PRÓXIMO INIMIGO →' : 'NEXT ENEMY →')}
            </button>
          </div>
        )}
        {(phase === 'cleared' || phase === 'lost') && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ ...mono, fontWeight: 800, fontSize: '1.05rem', marginBottom: 10 }}>
              {phase === 'cleared'
                ? (isPt ? '🏆 Masmorra concluída!' : '🏆 Dungeon cleared!')
                : (isPt ? '💀 Você foi derrotado...' : '💀 You were defeated...')}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={restart}
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
    </div>
  );
}
