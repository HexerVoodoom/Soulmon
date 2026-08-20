import { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from './ui/Icon';
import { getSpriteForStage } from '../utils/sprites';
import { playDegenerate, playTaskComplete } from '../utils/sounds';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { readNumber, writeLocal } from '../utils/safeStorage';
import type { Language } from '../utils/i18n';
import { PixelButton } from './pixel/PixelKit';

/**
 * Dino Runner — endless runner starring the pet.
 * Obstacles are enemy creatures and get scarier as difficulty ramps:
 * Bakemon → Tuskmon → Gigadramon → Titamon (tier by elapsed time; speed and
 * spawn rate also scale continuously). Jump via the big button BELOW the game
 * box (thumb never covers the action), the box itself, or SPACE.
 * Scoring: 🪙 Bits earned = floor(distance score / 100) per run.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * A FRONTEIRA RETRÔ, nesta tela
 * ───────────────────────────────────────────────────────────────────────────
 * DENTRO do `<canvas>` (pet, inimigos, linha do chão, o véu de fim de jogo)
 * é território retrô, diegético, e NÃO migra: é o conteúdo do visor.
 * FORA dele — a barra de cabeçalho, o botão de sair, o HUD de Recorde/Score e
 * o botão de pular — é CHROME, ou seja, interface, e fala Material Symbols.
 * O `sm-px-*` do chrome de arcade fica (é a moldura do fliperama, decisão da
 * Onda 6 do PLANO-DESIGN); o que saiu foram os PNGs raster de ícone.
 *
 * `expand_less` e não `arrow_upward` no botão de pular: `arrow_upward` NÃO
 * está no subset da fonte (`src/styles/tokens.md`) e um nome fora do
 * inventário renderiza VAZIO, sem erro nenhum.
 */

// Obstacle tiers: unlocked as the run progresses (start time in seconds).
const OBSTACLE_TIERS = [
  { stage: 'bakemon',    from: 0,  size: 38 },
  { stage: 'tuskmon',    from: 20, size: 44 },
  { stage: 'gigadramon', from: 45, size: 50 },
  { stage: 'titamon',    from: 75, size: 56 },
];

export function DinoGame({ evolutionStage, demoCharacterId, language, onEarnPoints, onScore, onExit }: {
  evolutionStage: string;
  /** Modo demo (utils/monetization.ts): personagem pré-pronto — sobrepõe o sprite do pet (nunca dos obstáculos). */
  demoCharacterId?: string;
  language: Language;
  onEarnPoints: (pts: number) => void;
  /** Mission counter: reports the final score of each run. */
  onScore: (score: number) => void;
  onExit: () => void;
}) {
  const isPt = language === 'pt-BR';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreElRef = useRef<HTMLSpanElement>(null);
  const petImgRef = useRef<HTMLImageElement | null>(null);
  const tierImgsRef = useRef<HTMLImageElement[]>([]);
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready');
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const [finalScore, setFinalScore] = useState(0);
  const [earned, setEarned] = useState(0);
  const [best, setBest] = useState(() => readNumber(STORAGE_KEYS.DINO_BEST, 0));

  // Nossa arte é sempre desenhada olhando pra DIREITA, que é o sentido da
  // corrida — não existe mais lista de exceções (era só de sprite emprestado).
  const petNeedsFlip = false;

  // Physics/game state lives in a ref — the loop never re-renders React.
  const g = useRef({ h: 0, vy: 0, obstacles: [] as { x: number; size: number; tier: number }[], speed: 0, t: 0, spawnIn: 0, score: 0 });

  useEffect(() => {
    const pet = new Image();
    pet.src = getSpriteForStage(evolutionStage, demoCharacterId);
    petImgRef.current = pet;
    tierImgsRef.current = OBSTACLE_TIERS.map(t => {
      const img = new Image();
      img.src = getSpriteForStage(t.stage);
      return img;
    });
  }, [evolutionStage, demoCharacterId]);

  const jump = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    const s = g.current;
    if (s.h <= 0) {
      s.vy = 660;
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

    // Draw an image horizontally mirrored (enemies face left; pet faces right)
    // Arte em transição: sprites legados desenhados como silhueta.
    const SILHOUETTE = 'brightness(0) opacity(0.85)';
    const drawFlipped = (img: HTMLImageElement, x: number, y: number, w: number, h: number) => {
      ctx.save();
      ctx.filter = SILHOUETTE;
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, w, h);
      ctx.restore();
    };

    const currentTier = () => {
      let tier = 0;
      for (let i = 0; i < OBSTACLE_TIERS.length; i++) if (s.t >= OBSTACLE_TIERS[i].from) tier = i;
      return tier;
    };

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

      // Obstacles — tier can also roll one level below for variety
      s.spawnIn -= dt;
      if (s.spawnIn <= 0) {
        const maxTier = currentTier();
        const tier = maxTier > 0 && Math.random() < 0.35 ? maxTier - 1 : maxTier;
        s.obstacles.push({ x: canvas.width + 20, size: OBSTACLE_TIERS[tier].size, tier });
        s.spawnIn = (0.95 + Math.random() * 0.85) * (340 / s.speed) + 0.34;
      }
      for (const o of s.obstacles) o.x -= s.speed * dt;
      s.obstacles = s.obstacles.filter(o => o.x + o.size > -10);

      // Collision (AABB with generous padding — sprites have transparent margins)
      const dTop = GROUND - DINO_S - s.h + 10;
      const dBot = GROUND - s.h - 2;
      const dL = DINO_X + 8, dR = DINO_X + DINO_S - 10;
      for (const o of s.obstacles) {
        const oL = o.x + 7, oR = o.x + o.size - 7, oT = GROUND - o.size + 9;
        if (dR > oL && dL < oR && dBot > oT && dTop < GROUND) { dead = true; break; }
      }

      // Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#453a63';
      ctx.beginPath(); ctx.moveTo(0, GROUND + 1); ctx.lineTo(canvas.width, GROUND + 1); ctx.stroke();
      for (const o of s.obstacles) {
        const img = tierImgsRef.current[o.tier];
        if (img?.complete) drawFlipped(img, o.x, GROUND - o.size, o.size, o.size);
      }
      const pet = petImgRef.current;
      if (pet?.complete) {
        if (petNeedsFlip) {
          ctx.save();
          ctx.translate(DINO_X + DINO_S, GROUND - DINO_S - s.h);
          ctx.scale(-1, 1);
          ctx.drawImage(pet, 0, 0, DINO_S, DINO_S);
          ctx.restore();
        }
        else ctx.drawImage(pet, DINO_X, GROUND - DINO_S - s.h, DINO_S, DINO_S);
      }
      if (scoreElRef.current) scoreElRef.current.textContent = String(Math.floor(s.score));

      if (!dead) { raf = requestAnimationFrame(tick); return; }

      // Game over
      const score = Math.floor(s.score);
      const pts = Math.floor(score / 100);
      setFinalScore(score);
      setEarned(pts);
      if (pts > 0) { onEarnPoints(pts); playTaskComplete(); } else { playDegenerate(); }
      onScore(score);
      setBest(prev => {
        const nb = Math.max(prev, score);
        // Recorde do jogador: é progresso, a falha AVISA.
        writeLocal(STORAGE_KEYS.DINO_BEST, String(nb));
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
  }, [phase, jump, onEarnPoints, onScore, petNeedsFlip]);

  return (
    <div className="sm-px-dark-ctx sm-px-arcade-root" style={{ background: 'linear-gradient(180deg, #0e1522 0%, #16213a 100%)', color: '#eef2fb' }}>
      {/* Cabecalho de arcade: mesma peca do Torneio e da Masmorra. O circulo
          de 34px do botao de sair virou quadrado chanfrado de 44px — era o
          ultimo controle redondo da tela (portao T2). */}
      <div className="sm-px-arcade-bar" style={{ margin: '14px 16px 8px', justifyContent: 'space-between' }}>
        <Icon name="pets" size={20} />
        <span className="sm-px-arcade-value" style={{ flex: 1, minWidth: 0 }}>
          {isPt ? 'Corrida do Dino' : 'Dino Runner'}
        </span>
        <button onClick={onExit} aria-label={isPt ? 'Sair' : 'Exit'} className="sm-px-arcade-close">
          <Icon name="close" size={20} />
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 20px 8px' }}>
        <span className="sm-px-arcade-label">
          {isPt ? 'Recorde' : 'Best'} <span className="sm-px-arcade-value">{best}</span>
        </span>
        <span className="sm-px-arcade-label">
          Score <span className="sm-px-arcade-value" ref={scoreElRef}>0</span>
        </span>
      </div>

      <div className="sm-px-card" style={{ margin: 'auto 16px 0', overflow: 'hidden', position: 'relative', backgroundColor: 'transparent' }}>
        <canvas
          ref={canvasRef}
          onPointerDown={jump}
          style={{ display: 'block', width: '100%', height: 240, touchAction: 'manipulation' }}
        />
        {phase !== 'playing' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'rgba(14,21,34,0.85)' }}>
            {phase === 'over' && (
              <>
                <p className="sm-px-arcade-value" style={{ fontSize: '1.05rem' }}>{isPt ? 'Fim de jogo!' : 'Game over!'}</p>
                <p style={{ fontSize: '0.85rem', color: '#93a3c9' }}>
                  Score: {finalScore} · +{earned} Bits
                </p>
              </>
            )}
            {phase === 'ready' && (
              <p style={{ fontSize: '0.82rem', color: '#93a3c9', padding: '0 20px', textAlign: 'center' }}>
                {isPt
                  ? 'Pule os inimigos! Eles ficam mais fortes com o tempo. 100 de score = 1 Bit'
                  : 'Jump the enemies! They get scarier over time. 100 score = 1 Bit'}
              </p>
            )}
            {/* Era uma cápsula verde `#4ade80` com raio 16 e sans bold — o
                último botão Material vivo fora de Configurações, e num jogo
                que a crítica R2 tinha dado como "alinhado" (o veredito veio
                do hub de Atividades, não de dentro do jogo). Agora é o botão
                do kit, como em Masmorra e no PPT. */}
            <PixelButton size="md" variant="primary" onClick={start}>
              {phase === 'over' ? (isPt ? 'Jogar de novo' : 'Play again') : (isPt ? 'Começar' : 'Start')}
            </PixelButton>
          </div>
        )}
      </div>

      {/* Big jump button OUTSIDE the game box — thumb never covers the action */}
      <div style={{ padding: 16, marginBottom: 'auto' }}>
        {/* Continua sendo um `<button>` cru e não um `PixelButton`: a ação é
            `onPointerDown` (pular no toque, sem esperar o `click`), que é
            requisito do jogo e o kit não expõe. O que mudou é a LINGUAGEM —
            chanfro + borda de cobre + ciano, em vez do raio 18 e do azul
            `#60a5fa` fora da paleta. */}
        <button
          onPointerDown={jump}
          disabled={phase !== 'playing'}
          className="sm-px-jump"
          aria-label={isPt ? 'Pular' : 'Jump'}
        >
          <Icon name="expand_less" size={20} weight={600} />
          {isPt ? 'Pular' : 'Jump'}
        </button>
      </div>
    </div>
  );
}
