import { useState, useEffect, useRef, useCallback } from 'react';
import { getSpriteForStage } from '../utils/sprites';
import { lineIconForStage } from '../utils/lineIcons';
import { playTaskComplete } from '../utils/sounds';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { readNumber, writeLocal } from '../utils/safeStorage';
import type { Language } from '../utils/i18n';
import { sm2Button } from './form/FormKit';
import { GameRoot, GameHeader, GameVisor, GAME_VISOR_W, phaseTitle, phaseLine } from './games/GameKit';
import { DINO_SCENE } from '../utils/dungeonScenes';
import obstacle1 from '../assets/soulmon/dino/dino-obstacle-1.png';
import obstacle2 from '../assets/soulmon/dino/dino-obstacle-2.png';
import obstacle3 from '../assets/soulmon/dino/dino-obstacle-3.png';
import obstacle4 from '../assets/soulmon/dino/dino-obstacle-4.png';
import groundStrip from '../assets/soulmon/dino/dino-ground-strip.png';
import parallaxFar from '../assets/soulmon/dino/dino-parallax-far.png';

/**
 * Dino Runner — endless runner starring the pet.
 * Obstacles are dungeon ruins and get bigger as difficulty ramps:
 * broken pillar → crystal rock → vine column → copper barricade (tier by
 * elapsed time; speed and spawn rate also scale continuously). Arte própria
 * (`assets/soulmon/dino/`, entrega 4) — até 15/09/2026 os obstáculos eram os
 * sprites do roster desenhados como silhueta espelhada e o chão era uma linha
 * de 1px. Jump via the big button BELOW the game
 * box (thumb never covers the action), the box itself, or SPACE.
 * Scoring: 🪙 Bits earned = floor(distance score / 100) per run.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * A FRONTEIRA RETRÔ, nesta tela (canvas Jogos, DECISÕES §25, D-J3/D-J4)
 * ───────────────────────────────────────────────────────────────────────────
 * O jogo é o conteúdo de um VISOR 348×192 (`games/GameKit.tsx`): a cena
 * `minigame-dino` em `cover` atrás, o `<canvas>` transparente na frente com o
 * parallax (512×128) e o chão (384×48) a 1×, o pet 256² a 64 (0,25× — a
 * criatura pequena correndo) e os obstáculos; o placar em Silkscreen 14
 * DENTRO do vidro. FORA dele tudo é aparelho em vetor: o chrome (Fredoka 20 +
 * "Best N" 12 + × 44), as regras, "Start"/"Play again" e o **"Jump" primário
 * de 64 de altura e largura inteira**, sem ícone.
 *
 * ⚠️ Os obstáculos continuam nos tamanhos do balanceamento (38/44/50/56 — a
 * caixa de colisão é medida sobre eles). O canvas os desenhou a 64 (0,5×);
 * regra de jogo vence o canvas — trocar o tamanho muda a dificuldade.
 */

// Obstacle tiers: unlocked as the run progresses (start time in seconds).
// `hit` é a fração horizontal OPACA da arte (medida da bounding box, 128px):
// a coluna do tier 3 ocupa só o meio da caixa quadrada, e uma colisão na
// caixa inteira mataria o jogador "no ar".
const OBSTACLE_TIERS = [
  { src: obstacle1, from: 0,  size: 38, hit: [6 / 128, 122 / 128] },
  { src: obstacle2, from: 20, size: 44, hit: [14 / 128, 114 / 128] },
  { src: obstacle3, from: 45, size: 50, hit: [38 / 128, 90 / 128] },
  { src: obstacle4, from: 75, size: 56, hit: [3 / 128, 125 / 128] },
];
// Chão e silhueta de fundo, repetíveis em X (medidos: costura < 20/765),
// desenhados a 1× (D-J4): a faixa do chão 384×48 e o parallax 512×128.
const GROUND_H = 48;
const GROUND_W = 384;
const PARALLAX_H = 128;
const PARALLAX_W = 512;
const PARALLAX_SPEED = 0.25;    // fração da velocidade do chão
// O vidro: 174×96 lógicos a 2× = 348×192 (canvas `Dino`).
const VISOR_W = GAME_VISOR_W * 2;
const VISOR_H = 96;
/** Linha dos pés (pet e obstáculos): 40 acima do fundo do vidro (canvas). */
const GROUND_Y = VISOR_H * 2 - 40;
const DINO_X = 24, DINO_S = 64;

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
  const groundImgRef = useRef<HTMLImageElement | null>(null);
  const parallaxImgRef = useRef<HTMLImageElement | null>(null);
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
  const g = useRef({ h: 0, vy: 0, obstacles: [] as { x: number; size: number; tier: number }[], speed: 0, t: 0, spawnIn: 0, score: 0, gx: 0, px: 0 });

  useEffect(() => {
    const pet = new Image();
    // O ícone-ficha 64² da linha (rodada 2, D-J13: bbox cheia, pés no chão) ou
    // o sprite 256² a 0,25× quando o estágio não é de linha.
    pet.src = lineIconForStage(evolutionStage, 64, demoCharacterId) ?? getSpriteForStage(evolutionStage, demoCharacterId);
    petImgRef.current = pet;
    tierImgsRef.current = OBSTACLE_TIERS.map(t => {
      const img = new Image();
      img.src = t.src;
      return img;
    });
    const ground = new Image(); ground.src = groundStrip; groundImgRef.current = ground;
    const far = new Image(); far.src = parallaxFar; parallaxImgRef.current = far;
    // O quadro parado do vidro antes de começar: chão, parallax e o pet na
    // linha dos pés — a criatura pequena esperando, não um vidro vazio.
    const drawStatic = () => {
      if (phaseRef.current === 'playing') return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const strip = (img: HTMLImageElement, y: number, w: number, h: number) => { for (let x = 0; x < canvas.width; x += w) ctx.drawImage(img, x, y, w, h); };
      if (far.complete && far.naturalWidth) strip(far, GROUND_Y - PARALLAX_H, PARALLAX_W, PARALLAX_H);
      if (ground.complete && ground.naturalWidth) strip(ground, canvas.height - GROUND_H, GROUND_W, GROUND_H);
      if (pet.complete && pet.naturalWidth) ctx.drawImage(pet, DINO_X, GROUND_Y - DINO_S, DINO_S, DINO_S);
    };
    for (const img of [pet, ground, far]) img.addEventListener('load', drawStatic);
    drawStatic();
    return () => { for (const img of [pet, ground, far]) img.removeEventListener('load', drawStatic); };
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
    g.current = { h: 0, vy: 0, obstacles: [], speed: 260, t: 0, spawnIn: 1.1, score: 0, gx: 0, px: 0 };
    setEarned(0);
    setPhase('playing');
  };

  useEffect(() => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    const GROUND = GROUND_Y;
    const s = g.current;
    let raf = 0;
    let last = performance.now();
    let dead = false;

    // Faixa repetível em X: desenha cópias lado a lado a partir do offset.
    const drawStrip = (img: HTMLImageElement, offset: number, y: number, w: number, h: number) => {
      const start = -((offset % w) + w) % w;
      for (let x = start; x < canvas.width; x += w) ctx.drawImage(img, x, y, w, h);
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
      s.gx += s.speed * dt;
      s.px += s.speed * dt * PARALLAX_SPEED;

      // Collision (AABB with generous padding — sprites have transparent margins)
      const dTop = GROUND - DINO_S - s.h + 10;
      const dBot = GROUND - s.h - 2;
      const dL = DINO_X + 8, dR = DINO_X + DINO_S - 10;
      for (const o of s.obstacles) {
        const [hl, hr] = OBSTACLE_TIERS[o.tier].hit;
        const oL = o.x + o.size * hl + 2, oR = o.x + o.size * hr - 2, oT = GROUND - o.size + 6;
        if (dR > oL && dL < oR && dBot > oT && dTop < GROUND) { dead = true; break; }
      }

      // Draw — fundo distante, obstáculos, chão, pet (ordem de profundidade)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const far = parallaxImgRef.current;
      if (far?.complete) drawStrip(far, s.px, GROUND - PARALLAX_H, PARALLAX_W, PARALLAX_H);
      for (const o of s.obstacles) {
        const img = tierImgsRef.current[o.tier];
        if (img?.complete) ctx.drawImage(img, o.x, GROUND - o.size, o.size, o.size);
      }
      const ground = groundImgRef.current;
      if (ground?.complete) drawStrip(ground, s.gx, canvas.height - GROUND_H, GROUND_W, GROUND_H);
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
      // C-6 (run `som-01`): `pts === 0` significa score ABAIXO de 100 — ou seja,
      // a primeira partida de quem esta aprendendo o minijogo recebia o som de
      // perder a forma. Fim de partida sem ponto e silencioso; o placar final
      // na tela e o canal.
      if (pts > 0) { onEarnPoints(pts); playTaskComplete(); }
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
    <GameRoot>
      <GameHeader
        title={isPt ? 'Corrida do Dino' : 'Dino Runner'}
        sub={<span className="sm2-num">{isPt ? 'Recorde' : 'Best'} {best}</span>}
        closeLabel={isPt ? 'Sair' : 'Exit'}
        onClose={onExit}
      />

      {/* O VISOR 348×192 (D-J3): a cena `minigame-dino` em `cover` atrás, o
          `<canvas>` transparente na frente desenhando o parallax e o chão a
          1×, o pet a 64 e os obstáculos. Tocar no vidro também pula. */}
      <GameVisor height={VISOR_H} scene={`${DINO_SCENE.bg.replace('center/cover', 'center 40%/cover')}`}>
        <canvas
          ref={canvasRef}
          width={VISOR_W}
          height={VISOR_H * 2}
          onPointerDown={jump}
          style={{ display: 'block', width: VISOR_W, height: VISOR_H * 2, touchAction: 'manipulation', imageRendering: 'pixelated' }}
        />
        {/* O placar é DOM, em Silkscreen 14 DENTRO do vidro, sobre a placa
            `color-mix(viewport-bg 78%)` — a voz do aparelho (D-J10 idem). */}
        <span
          aria-live="off"
          style={{
            position: 'absolute', left: 8, top: 8, padding: '2px 6px', zIndex: 2,
            fontFamily: 'var(--sm2-font-pixel)', fontSize: 'var(--sm2-text-sm)', lineHeight: 1.2,
            textTransform: 'uppercase', letterSpacing: 0, WebkitFontSmoothing: 'none',
            color: 'var(--sm2-viewport-ink)',
            backgroundColor: 'color-mix(in srgb, var(--sm2-viewport-bg) 78%, transparent)',
            borderRadius: 'var(--sm2-radius-sm)',
          }}
        >
          <span ref={scoreElRef}>0</span>
        </span>
      </GameVisor>

      {phase === 'ready' && (
        <>
          <p style={phaseLine}>
            {isPt
              ? 'Pule os inimigos! Eles ficam mais fortes com o tempo. 100 de score = 1 Bit'
              : 'Jump the enemies! They get scarier over time. 100 score = 1 Bit'}
          </p>
          <button type="button" onClick={start} style={{ ...sm2Button('primary'), width: '100%', maxWidth: 240, alignSelf: 'center' }}>
            {isPt ? 'Começar' : 'Start'}
          </button>
        </>
      )}
      {phase === 'over' && (
        <>
          <p style={phaseTitle}>{isPt ? 'Fim de jogo!' : 'Game over!'}</p>
          <p className="sm2-num" style={phaseLine}>Score: {finalScore} · +{earned} Bits</p>
          <button type="button" onClick={start} style={{ ...sm2Button('primary'), width: '100%', maxWidth: 240, alignSelf: 'center' }}>
            {isPt ? 'Jogar de novo' : 'Play again'}
          </button>
        </>
      )}

      {/* O PULAR é aparelho: primário de 64 de altura e largura inteira, sem
          ícone, `onPointerDown` (reflexo — não espera o `click`). Inerte
          antes de começar: `surface-2` + `muted`, nunca opacidade. */}
      <button
        type="button"
        onPointerDown={jump}
        disabled={phase !== 'playing'}
        aria-label={isPt ? 'Pular' : 'Jump'}
        style={{ ...sm2Button('primary', phase !== 'playing', 'lg'), minHeight: 64, width: '100%', marginTop: 'auto', touchAction: 'manipulation', userSelect: 'none' }}
      >
        {isPt ? 'Pular' : 'Jump'}
      </button>
    </GameRoot>
  );
}
