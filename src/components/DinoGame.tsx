import { useState, useEffect, useRef, useCallback } from 'react';
import { getSpriteForStage } from '../utils/sprites';
import { playDegenerate, playTaskComplete } from '../utils/sounds';
import { STORAGE_KEYS } from '../utils/storageKeys';
import type { Language } from '../utils/i18n';

/**
 * Dino Runner — Chrome-offline-style endless runner, starring the pet.
 * Tap / space to jump the cacti; speed ramps up over time.
 * Scoring: 🎖️ earned = floor(distance score / 100) per run.
 */
export function DinoGame({ evolutionStage, language, onEarnPoints, onExit }: {
  evolutionStage: string;
  language: Language;
  onEarnPoints: (pts: number) => void;
  onExit: () => void;
}) {
  const isPt = language === 'pt-BR';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreElRef = useRef<HTMLSpanElement>(null);
  const spriteRef = useRef<HTMLImageElement | null>(null);
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready');
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const [finalScore, setFinalScore] = useState(0);
  const [earned, setEarned] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem(STORAGE_KEYS.DINO_BEST)) || 0);
  const mono = { fontFamily: 'monospace' as const };

  // Physics/game state lives in a ref — the loop never re-renders React.
  const g = useRef({ h: 0, vy: 0, obstacles: [] as { x: number; w: number; h: number }[], speed: 0, t: 0, spawnIn: 0, score: 0 });

  useEffect(() => {
    const img = new Image();
    img.src = getSpriteForStage(evolutionStage);
    spriteRef.current = img;
  }, [evolutionStage]);

  const jump = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    const s = g.current;
    if (s.h <= 0) {
      s.vy = 640;
      try { navigator.vibrate?.(8); } catch { /* noop */ }
    }
  }, []);

  const start = () => {
    g.current = { h: 0, vy: 0, obstacles: [], speed: 260, t: 0, spawnIn: 1.1, score: 0 };
    setEarned(0);
    setPhase('playing');
  };

  useEffect(() => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    canvas.width = canvas.clientWidth;
    canvas.height = 240;
    ctx.imageSmoothingEnabled = false;
    const GROUND = canvas.height - 28;
    const DINO_X = 26, DINO_S = 46;
    const s = g.current;
    let raf = 0;
    let last = performance.now();
    let dead = false;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      s.t += dt;
      s.speed = Math.min(620, 260 + s.t * 9);
      s.score += dt * 10;

      // Jump physics
      if (s.h > 0 || s.vy > 0) {
        s.vy -= 1900 * dt;
        s.h = Math.max(0, s.h + s.vy * dt);
        if (s.h === 0) s.vy = 0;
      }

      // Obstacles
      s.spawnIn -= dt;
      if (s.spawnIn <= 0) {
        const oh = 24 + Math.random() * 26;
        s.obstacles.push({ x: canvas.width + 20, w: 14 + Math.random() * 16, h: oh });
        s.spawnIn = (0.95 + Math.random() * 0.85) * (340 / s.speed) + 0.32;
      }
      for (const o of s.obstacles) o.x -= s.speed * dt;
      s.obstacles = s.obstacles.filter(o => o.x + o.w > -10);

      // Collision (AABB with padding)
      const dTop = GROUND - DINO_S - s.h + 10;
      const dBot = GROUND - s.h - 2;
      const dL = DINO_X + 8, dR = DINO_X + DINO_S - 10;
      for (const o of s.obstacles) {
        if (dR > o.x && dL < o.x + o.w && dBot > GROUND - o.h && dTop < GROUND) { dead = true; break; }
      }

      // Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#3a4b68';
      ctx.beginPath(); ctx.moveTo(0, GROUND + 1); ctx.lineTo(canvas.width, GROUND + 1); ctx.stroke();
      ctx.fillStyle = '#5d8a4e';
      for (const o of s.obstacles) {
        ctx.fillRect(o.x, GROUND - o.h, o.w, o.h);
        ctx.fillRect(o.x - 4, GROUND - o.h * 0.62, 4, 6); // little cactus arm
      }
      const img = spriteRef.current;
      if (img?.complete) ctx.drawImage(img, DINO_X, GROUND - DINO_S - s.h, DINO_S, DINO_S);
      if (scoreElRef.current) scoreElRef.current.textContent = String(Math.floor(s.score));

      if (!dead) { raf = requestAnimationFrame(tick); return; }

      // Game over
      const score = Math.floor(s.score);
      const pts = Math.floor(score / 100);
      setFinalScore(score);
      setEarned(pts);
      if (pts > 0) { onEarnPoints(pts); playTaskComplete(); } else { playDegenerate(); }
      setBest(prev => {
        const nb = Math.max(prev, score);
        localStorage.setItem(STORAGE_KEYS.DINO_BEST, String(nb));
        return nb;
      });
      try { navigator.vibrate?.(60); } catch { /* noop */ }
      setPhase('over');
    };
    raf = requestAnimationFrame(tick);

    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); }
    };
    window.addEventListener('keydown', onKey);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); };
  }, [phase, jump, onEarnPoints]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'linear-gradient(180deg, #0b0f17 0%, #16202f 100%)', display: 'flex', flexDirection: 'column', color: '#e8eefc' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
        <span style={{ ...mono, fontWeight: 800, fontSize: '0.95rem', letterSpacing: 1 }}>
          🦖 {isPt ? 'CORRIDA DO DINO' : 'DINO RUNNER'}
        </span>
        <button onClick={onExit} style={{ ...mono, background: 'rgba(255,255,255,0.08)', border: '1px solid #2c3a52', color: '#e8eefc', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
          {isPt ? 'Sair' : 'Exit'}
        </button>
      </div>

      <div style={{ ...mono, display: 'flex', justifyContent: 'space-between', padding: '0 20px 6px', fontSize: '0.8rem', color: '#9fb2d8' }}>
        <span>{isPt ? 'Recorde' : 'Best'}: {best}</span>
        <span>Score: <span ref={scoreElRef}>0</span></span>
      </div>

      <div style={{ margin: '0 16px', borderRadius: 12, border: '1px solid #2c3a52', overflow: 'hidden', position: 'relative' }}>
        <canvas
          ref={canvasRef}
          onPointerDown={jump}
          style={{ display: 'block', width: '100%', height: 240, touchAction: 'manipulation', cursor: 'pointer' }}
        />
        {phase !== 'playing' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'rgba(11,15,23,0.82)' }}>
            {phase === 'over' && (
              <>
                <p style={{ ...mono, fontWeight: 800, fontSize: '1.05rem' }}>💥 {isPt ? 'Fim de jogo!' : 'Game over!'}</p>
                <p style={{ ...mono, fontSize: '0.85rem', color: '#9fb2d8' }}>
                  Score: {finalScore} · 🎖️ +{earned} {isPt ? 'pontos' : 'points'}
                </p>
              </>
            )}
            {phase === 'ready' && (
              <p style={{ ...mono, fontSize: '0.8rem', color: '#9fb2d8', padding: '0 20px', textAlign: 'center' }}>
                {isPt ? 'Toque (ou ESPAÇO) para pular os cactos. A cada 100 de score = 1 🎖️' : 'Tap (or SPACE) to jump the cacti. Every 100 score = 1 🎖️'}
              </p>
            )}
            <button onClick={start}
              style={{ ...mono, padding: '12px 28px', borderRadius: 8, border: 'none', background: '#4ade80', color: '#0b0f17', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }}>
              {phase === 'over' ? (isPt ? 'JOGAR DE NOVO' : 'PLAY AGAIN') : (isPt ? 'COMEÇAR' : 'START')}
            </button>
          </div>
        )}
      </div>

      <p style={{ ...mono, textAlign: 'center', marginTop: 10, fontSize: '0.72rem', color: '#5d729c' }}>
        {isPt ? 'Toque na área do jogo para pular' : 'Tap the game area to jump'}
      </p>
    </div>
  );
}
