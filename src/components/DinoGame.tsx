import { RankingPanel } from './RankingPanel';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getSpriteForStage, artFacesLeft } from '../utils/sprites';

/** A corrida SEMPRE corre para a DIREITA: arte de perfil esquerdo (`artFacesLeft`, mesma regra da Home) é espelhada. */
export const dinoPetMirrored = (stage: string, demoCharacterId?: string): boolean => artFacesLeft(stage, demoCharacterId);
import { lineIconForStage } from '../utils/lineIcons';
import { usePetScale } from '../hooks/usePetScale';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { readNumber, writeLocal } from '../utils/safeStorage';
import type { Language } from '../utils/i18n';
import { sm2Button } from './form/FormKit';
import { GameRoot, GameHeader, GAME_VISOR_W, phaseTitle, phaseLine, gameExitConfirm } from './games/GameKit';
import { BitsAmount } from './ui/BitsAmount';
import { DINO_SCENE } from '../utils/dungeonScenes';
import { idlePose, runPose, type PetPose } from '../utils/petBounce';
import obstacle1 from '../assets/soulmon/dino/dino-obstacle-1.png';
import obstacle2 from '../assets/soulmon/dino/dino-obstacle-2.png';
import obstacle3 from '../assets/soulmon/dino/dino-obstacle-3.png';
import obstacle4 from '../assets/soulmon/dino/dino-obstacle-4.png';
import obstacle1b from '../assets/soulmon/dino/dino-obstacle-1b.png';
import obstacle1c from '../assets/soulmon/dino/dino-obstacle-1c.png';
import obstacle2b from '../assets/soulmon/dino/dino-obstacle-2b.png';
import obstacle2c from '../assets/soulmon/dino/dino-obstacle-2c.png';
import obstacle3b from '../assets/soulmon/dino/dino-obstacle-3b.png';
import obstacle3c from '../assets/soulmon/dino/dino-obstacle-3c.png';
import obstacle4b from '../assets/soulmon/dino/dino-obstacle-4b.png';
import obstacle4c from '../assets/soulmon/dino/dino-obstacle-4c.png';
import groundStrip from '../assets/soulmon/dino/dino-ground-strip.png';
import parallaxFar from '../assets/soulmon/dino/dino-parallax-far.png';

/**
 * Corrida com obstáculos (EN Obstacle Run; até 30/09/2026 "Corrida do Dino" / "Dino
 * Runner" — o id `dino`, a pasta `dino/` e as chaves de save NÃO mudaram) — endless
 * runner starring the pet. Obstacles are bones and cold-fire crystals (tema da rodada 3,
 * decisão do dono de 30/09/2026) and get bigger as difficulty ramps; each tier has three
 * VARIANTS (a/b/c) drawn at random, each with its own measured hit box. Tier by elapsed
 * time; speed and spawn rate also scale continuously. Arte própria
 * (`assets/soulmon/dino/`). Jump via the big button BELOW the game
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
 * DENTRO do vidro. FORA dele tudo é aparelho em vetor: o chrome (Cinzel 20 +
 * "Best N" 12 + × 44), as regras, "Start"/"Play again" e o **"Jump" primário
 * de 64 de altura e largura inteira**, sem ícone.
 *
 * ⚠️ Os obstáculos continuam nos tamanhos do balanceamento (38/44/50/56 — a
 * caixa de colisão é medida sobre eles). O canvas os desenhou a 64 (0,5×);
 * regra de jogo vence o canvas — trocar o tamanho muda a dificuldade.
 */

// Obstacle tiers: unlocked as the run progresses (start time in seconds).
// Cada tier tem 3 variantes (rodada 3, 30/09/2026), sorteadas no spawn. `hit` é a
// fração horizontal OPACA da arte e `top` a fração vazia acima dela (bounding box do
// alfa, medida sobre os PNGs de 128px — MANIFEST da leva `corrida`): a coluna do tier 3
// ocupa só o meio da caixa, e as variantes baixas (1b, 4b) só a metade de baixo — uma
// colisão na caixa inteira mataria o jogador "no ar". `size` é balanceamento e não mudou.
type ObstacleArt = { src: string; hit: readonly [number, number]; top: number };
const OBSTACLE_TIERS: { from: number; size: number; variants: ObstacleArt[] }[] = [
  { from: 0, size: 38, variants: [
    { src: obstacle1, hit: [4 / 128, 124 / 128], top: 1 / 128 },
    { src: obstacle1b, hit: [1 / 128, 127 / 128], top: 65 / 128 },
    { src: obstacle1c, hit: [6 / 128, 122 / 128], top: 1 / 128 },
  ] },
  { from: 20, size: 44, variants: [
    { src: obstacle2, hit: [6 / 128, 121 / 128], top: 1 / 128 },
    { src: obstacle2b, hit: [1 / 128, 127 / 128], top: 15 / 128 },
    { src: obstacle2c, hit: [1 / 128, 127 / 128], top: 4 / 128 },
  ] },
  { from: 45, size: 50, variants: [
    { src: obstacle3, hit: [40 / 128, 88 / 128], top: 1 / 128 },
    { src: obstacle3b, hit: [38 / 128, 89 / 128], top: 1 / 128 },
    { src: obstacle3c, hit: [41 / 128, 86 / 128], top: 1 / 128 },
  ] },
  { from: 75, size: 56, variants: [
    { src: obstacle4, hit: [1 / 128, 127 / 128], top: 38 / 128 },
    { src: obstacle4b, hit: [1 / 128, 127 / 128], top: 66 / 128 },
    { src: obstacle4c, hit: [1 / 128, 127 / 128], top: 45 / 128 },
  ] },
];
// Chão e silhueta de fundo, repetíveis em X (medidos: costura < 20/765),
// desenhados a 1× (D-J4): a faixa do chão 384×48 e o parallax 512×128.
const GROUND_H = 48;
const GROUND_W = 384;
const PARALLAX_H = 128;
const PARALLAX_W = 512;
const PARALLAX_SPEED = 0.25;    // fração da velocidade do chão
// TELA CHEIA (rodada 7 · J3, 04/10/2026): o campo ocupa tudo entre o cabeçalho e o "Pular" —
// sangra até as bordas, sem o anel do visor. O tamanho mínimo é o vidro de antes (348×192);
// acima disso o canvas acompanha o campo (ResizeObserver) e o chão desce com ele. A física e o
// balanceamento NÃO mudam: velocidades, pulo e caixas de colisão são em px, e a linha dos pés
// continua 40 px acima do fundo.
const VISOR_W = GAME_VISOR_W * 2;
const STAGE_MIN_H = 192;
/** Distância da linha dos pés ao fundo do campo (canvas `Dino`). */
const GROUND_FROM_BOTTOM = 40;
const DINO_X = 24, DINO_S = 64;

// Velocidade (E3): antes min(620, 260 + 9·t); agora min(1300, 260 + 24·t) — chega ao dobro do teto antigo e mais rápido.
export const RUN_SPEED_START = 260;
export const RUN_SPEED_ACCEL = 24;
export const RUN_SPEED_CAP = 1300;
export const runSpeedAt = (t: number) => Math.min(RUN_SPEED_CAP, RUN_SPEED_START + t * RUN_SPEED_ACCEL);
// Nível 2: dash, cargas, coletável e plataformas suspensas.
export const DASH_START_CHARGES = 5;
const DASH_TIME = 0.2, DASH_MULT = 3, DASH_PUSH = 40;
const PLAT_H = 70, PLAT_W = 260, PLAT_THICK = 8;
const PICKUP_EVERY = 7;
type Plat = { x: number };
type Pickup = { x: number; h: number };
function newRun(level: 1 | 2) {
  return { h: 0, vy: 0, obstacles: [] as { x: number; size: number; tier: number; v: number }[], speed: RUN_SPEED_START, t: 0, spawnIn: 1.1, score: 0, gx: 0, px: 0, dust: [] as Dust[], sinceLand: 9, dustIn: 0, wasAir: false,
    level, charges: DASH_START_CHARGES, dashT: 0, plats: [] as Plat[], pickups: [] as Pickup[], platIn: 3, pickIn: PICKUP_EVERY, floor: 0 };
}

/** Poeira dos pés: quadradinhos de 2–3 px (grade nítida), poucos, 3 cores do visor. */
type Dust = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; c: number };
const MAX_DUST = 14;
const reducedMotionNow = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};
const readDustColors = (el: Element): string[] => {
  const cs = getComputedStyle(el);
  const v = (n: string, d: string) => cs.getPropertyValue(n).trim() || d;
  return [v('--sm2-viewport-ink', '#E9F5F2'), v('--sm2-viewport-ring', '#B0722F'), v('--sm2-viewport-ring-deep', '#5E3612')];
};
function spawnDust(list: Dust[], x: number, y: number, speed: number, n: number) {
  for (let i = 0; i < n && list.length < MAX_DUST; i++) {
    const max = 0.28 + Math.random() * 0.2;
    list.push({ x: x + Math.random() * 6, y: y - Math.random() * 3, vx: -speed * (0.25 + Math.random() * 0.3), vy: -(8 + Math.random() * 26), life: max, max, size: Math.random() < 0.6 ? 2 : 3, c: Math.floor(Math.random() * 3) });
  }
}
function stepDust(list: Dust[], dt: number) {
  for (const d of list) { d.life -= dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 60 * dt; }
  for (let i = list.length - 1; i >= 0; i--) if (list[i].life <= 0) list.splice(i, 1);
}
function drawDust(ctx: CanvasRenderingContext2D, list: Dust[], colors: string[]) {
  for (const d of list) {
    ctx.globalAlpha = Math.max(0, d.life / d.max) * 0.85;
    ctx.fillStyle = colors[d.c];
    ctx.fillRect(Math.round(d.x), Math.round(d.y), d.size, d.size);
  }
  ctx.globalAlpha = 1;
}
/** Desenha o pet com a pose (origem nos pés, centro da base); sprite sempre nítido. */
function drawPet(ctx: CanvasRenderingContext2D, img: HTMLImageElement, groundY: number, h: number, pose: PetPose, mirror = false, vis = 1) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(DINO_X + DINO_S / 2, groundY - h + pose.dy);
  if (pose.rot) ctx.rotate(pose.rot);
  // `vis` = porte do bicho (utils/spriteScale.ts): só o DESENHO encolhe, com origem nos pés; a caixa de colisão não muda.
  ctx.scale((mirror ? -pose.sx : pose.sx) * vis, pose.sy * vis);
  ctx.drawImage(img, -DINO_S / 2, -DINO_S, DINO_S, DINO_S);
  ctx.restore();
}

export function DinoGame({ evolutionStage, demoCharacterId, language, onEarnPoints, onScore, onExit, rankSaveId }: {
  rankSaveId?: string;
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
  const petUrl = lineIconForStage(evolutionStage, 64, demoCharacterId) ?? getSpriteForStage(evolutionStage, demoCharacterId, 256);
  const petScaleRef = useRef(1);
  petScaleRef.current = usePetScale(evolutionStage, petUrl);
  const tierImgsRef = useRef<HTMLImageElement[][]>([]);
  const groundImgRef = useRef<HTMLImageElement | null>(null);
  const parallaxImgRef = useRef<HTMLImageElement | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  /** Tamanho do campo em px de CSS (= px do canvas, escala 1× nítida). */
  const [stage, setStage] = useState({ w: VISOR_W, h: STAGE_MIN_H });
  const groundYRef = useRef(STAGE_MIN_H - GROUND_FROM_BOTTOM);
  groundYRef.current = stage.h - GROUND_FROM_BOTTOM;
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready');
  /** I3: a confirmação de sair pausa a corrida (o laço é por `dt`, retoma sem salto). */
  const [paused, setPaused] = useState(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const [finalScore, setFinalScore] = useState(0);
  const [earned, setEarned] = useState(0);
  const [best, setBest] = useState(() => readNumber(STORAGE_KEYS.DINO_BEST, 0));

  // O campo acompanha a tela (rotação, barra do sistema); piso = o vidro de antes.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const w = Math.max(VISOR_W, Math.round(el.clientWidth));
      const h = Math.max(STAGE_MIN_H, Math.round(el.clientHeight));
      setStage(p => (p.w === w && p.h === h ? p : { w, h }));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // A corrida vai para a DIREITA: arte de perfil ESQUERDO (`artFacesLeft`, como na Home) é espelhada.
  const petMirror = dinoPetMirrored(evolutionStage, demoCharacterId);

  // Physics/game state lives in a ref — the loop never re-renders React.
  const g = useRef(newRun(1));
  const [level, setLevel] = useState<1 | 2>(1);
  const chargesElRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const pet = new Image();
    // O ícone-ficha 64² da linha (rodada 2, D-J13: bbox cheia, pés no chão) ou
    // o sprite 256² a 0,25× quando o estágio não é de linha.
    pet.src = lineIconForStage(evolutionStage, 64, demoCharacterId) ?? getSpriteForStage(evolutionStage, demoCharacterId, 256);
    petImgRef.current = pet;
    tierImgsRef.current = OBSTACLE_TIERS.map(t => t.variants.map(v => {
      const img = new Image();
      img.src = v.src;
      return img;
    }));
    const ground = new Image(); ground.src = groundStrip; groundImgRef.current = ground;
    const far = new Image(); far.src = parallaxFar; parallaxImgRef.current = far;
    // O quadro parado do vidro antes de começar: chão, parallax e o pet na
    // linha dos pés — a criatura pequena esperando, não um vidro vazio.
    // Parado (antes de começar / depois de perder) o pet respira — a curva da Home
    // (`utils/petBounce.idlePose`). Depois de perder, os obstáculos da última cena e o
    // chão ficam onde estavam; só a respiração continua (30 fps, pausa com a aba oculta).
    const t0 = performance.now();
    const drawStatic = () => {
      if (phaseRef.current === 'playing') return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      const s = g.current;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const strip = (img: HTMLImageElement, off: number, y: number, w: number, h: number) => { const st = -((off % w) + w) % w; for (let x = st; x < canvas.width; x += w) ctx.drawImage(img, x, y, w, h); };
      if (far.complete && far.naturalWidth) strip(far, s.px, groundYRef.current - PARALLAX_H, PARALLAX_W, PARALLAX_H);
      for (const o of s.obstacles) {
        const img = tierImgsRef.current[o.tier]?.[o.v];
        if (!img?.complete || !img.naturalWidth) continue;
        ctx.drawImage(img, o.x, groundYRef.current - o.size, o.size, o.size);
      }
      if (ground.complete && ground.naturalWidth) strip(ground, s.gx, canvas.height - GROUND_H, GROUND_W, GROUND_H);
      if (pet.complete && pet.naturalWidth) {
        const pose = idlePose((performance.now() - t0) / 1000, reducedMotionNow());
        drawPet(ctx, pet, groundYRef.current, 0, pose, petMirror, petScaleRef.current);
      }
    };
    for (const img of [pet, ground, far]) img.addEventListener('load', drawStatic);
    drawStatic();
    let raf = 0;
    let lastDraw = 0;
    const idleLoop = (now: number) => {
      raf = requestAnimationFrame(idleLoop);
      if (phaseRef.current === 'playing' || document.hidden || now - lastDraw < 33) return;
      lastDraw = now;
      drawStatic();
    };
    raf = requestAnimationFrame(idleLoop);
    return () => { cancelAnimationFrame(raf); for (const img of [pet, ground, far]) img.removeEventListener('load', drawStatic); };
  }, [evolutionStage, demoCharacterId, petMirror]);

  const jump = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    const s = g.current;
    if (s.h <= 0 || s.floor > 0) {
      s.floor = 0;
      s.vy = 660;
      try { navigator.vibrate?.(8); } catch { /* noop */ }
    }
  }, []);

  const dash = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    const s = g.current;
    if (s.level !== 2 || s.charges <= 0 || s.dashT > 0) return;
    s.charges -= 1;
    s.dashT = DASH_TIME;
    try { navigator.vibrate?.(8); } catch { /* noop */ }
  }, []);

  const start = () => {
    g.current = newRun(level);
    setEarned(0);
    setPhase('playing');
  };

  useEffect(() => {
    if (phase !== 'playing' || paused) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    let GROUND = groundYRef.current;
    const s = g.current;
    let raf = 0;
    let last = performance.now();
    let dead = false;
    const reduced = reducedMotionNow();
    const dustColors = readDustColors(canvas);

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
      GROUND = groundYRef.current; // o campo pode ter mudado de tamanho (rotação)
      ctx.imageSmoothingEnabled = false; // redimensionar o canvas zera o contexto
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      s.t += dt;
      s.speed = runSpeedAt(s.t);
      s.score += dt * 10;

      // Jump physics
      const wasDashing = s.dashT > 0;
      if (s.dashT > 0) s.dashT = Math.max(0, s.dashT - dt);
      const dashing = s.dashT > 0 || wasDashing;
      const mv = s.speed * (s.dashT > 0 ? DASH_MULT : 1);
      const px0 = DINO_X + 8, px1 = DINO_X + DINO_S - 10;
      if (s.h > 0 || s.vy > 0) {
        const prevH = s.h;
        s.vy -= 1900 * dt;
        s.h = Math.max(0, s.h + s.vy * dt);
        if (s.h === 0) s.vy = 0;
        // Plataforma suspensa: pousa por cima (só descendo), caminho alternativo do nível 2.
        if (s.vy <= 0 && prevH >= PLAT_H - 1 && s.h <= PLAT_H && s.plats.some(p => px1 > p.x && px0 < p.x + PLAT_W)) {
          s.h = PLAT_H; s.vy = 0; s.floor = PLAT_H;
        }
      }
      if (s.floor > 0 && !s.plats.some(p => px1 > p.x && px0 < p.x + PLAT_W)) s.floor = 0; // saiu da borda: cai

      // Poeira: uma lufada a cada passada no chão; maior no pouso. Só desenho — não
      // mexe em física, colisão, pontuação nem tempo.
      const air = (s.h > 0 || s.vy > 0) && s.floor === 0;
      s.sinceLand += dt;
      if (s.floor > 0) { s.wasAir = false; }
      if (s.wasAir && !air) {
        s.sinceLand = 0;
        if (!reduced) spawnDust(s.dust, DINO_X + 10, GROUND - 1, s.speed, 4);
      }
      s.wasAir = air;
      if (!air && !reduced) {
        s.dustIn -= dt;
        if (s.dustIn <= 0) { spawnDust(s.dust, DINO_X + 6, GROUND - 1, s.speed, 1 + (Math.random() < 0.4 ? 1 : 0)); s.dustIn = 0.11 + Math.random() * 0.05; }
      }
      stepDust(s.dust, dt);

      // Obstacles — tier can also roll one level below for variety
      s.spawnIn -= dt;
      if (s.spawnIn <= 0) {
        const maxTier = currentTier();
        const tier = maxTier > 0 && Math.random() < 0.35 ? maxTier - 1 : maxTier;
        const v = Math.floor(Math.random() * OBSTACLE_TIERS[tier].variants.length);
        s.obstacles.push({ x: canvas.width + 20, size: OBSTACLE_TIERS[tier].size, tier, v });
        s.spawnIn = (0.95 + Math.random() * 0.85) * (340 / s.speed) + 0.34;
      }
      if (s.level === 2) {
        s.platIn -= dt;
        if (s.platIn <= 0) { s.plats.push({ x: canvas.width + 20 }); s.platIn = 4 + Math.random() * 4; }
        s.pickIn -= dt;
        if (s.pickIn <= 0) {
          // coletável: às vezes sobre uma plataforma (recompensa do caminho de cima), às vezes no ar
          s.pickups.push({ x: canvas.width + 20 + PLAT_W / 2, h: Math.random() < 0.5 ? PLAT_H + 22 : 30 });
          s.pickIn = PICKUP_EVERY + Math.random() * 3;
        }
        for (const p of s.plats) p.x -= mv * dt;
        for (const k of s.pickups) k.x -= mv * dt;
        s.plats = s.plats.filter(p => p.x + PLAT_W > -10);
        s.pickups = s.pickups.filter(k => k.x > -20);
        // coleta
        s.pickups = s.pickups.filter(k => {
          const hit = k.x + 12 > px0 && k.x - 4 < px1 + (dashing ? DASH_PUSH : 0) && k.h + 12 > s.h && k.h - 12 < s.h + DINO_S;
          if (hit) s.charges += 1;
          return !hit;
        });
      }
      for (const o of s.obstacles) o.x -= mv * dt;
      s.obstacles = s.obstacles.filter(o => o.x + o.size > -10);
      s.gx += mv * dt;
      s.px += mv * dt * PARALLAX_SPEED;

      // Collision (AABB with generous padding — sprites have transparent margins)
      const dTop = GROUND - DINO_S - s.h + 10;
      const dBot = GROUND - s.h - 2;
      const dL = DINO_X + 8, dR = DINO_X + DINO_S - 10 + (s.dashT > 0 ? DASH_PUSH : 0);
      for (const o of s.obstacles) {
        const { hit: [hl, hr], top } = OBSTACLE_TIERS[o.tier].variants[o.v];
        const oL = o.x + o.size * hl + 2, oR = o.x + o.size * hr - 2, oT = GROUND - o.size * (1 - top) + 6;
        if (dR > oL && dL < oR && dBot > oT && dTop < GROUND) {
          if (s.dashT > 0) { // o dash destrói o obstáculo atingido
            o.x = -1000;
            if (!reduced) spawnDust(s.dust, Math.max(0, oL), GROUND - 4, s.speed, 4);
            continue;
          }
          dead = true; break;
        }
      }
      s.obstacles = s.obstacles.filter(o => o.x > -500);

      // Draw — fundo distante, obstáculos, chão, pet (ordem de profundidade)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const far = parallaxImgRef.current;
      if (far?.complete) drawStrip(far, s.px, GROUND - PARALLAX_H, PARALLAX_W, PARALLAX_H);
      for (const o of s.obstacles) {
        const img = tierImgsRef.current[o.tier]?.[o.v];
        if (!img?.complete) continue;
        ctx.drawImage(img, o.x, GROUND - o.size, o.size, o.size);
      }
      if (s.level === 2) {
        for (const p of s.plats) {
          const y = GROUND - PLAT_H - PLAT_THICK;
          ctx.fillStyle = dustColors[2]; ctx.fillRect(Math.round(p.x), y, PLAT_W, PLAT_THICK);
          ctx.fillStyle = dustColors[1]; ctx.fillRect(Math.round(p.x), y, PLAT_W, 3);
        }
        for (const k of s.pickups) {
          ctx.fillStyle = dustColors[1]; ctx.fillRect(Math.round(k.x - 8), Math.round(GROUND - k.h - 8), 16, 16);
          ctx.fillStyle = dustColors[0]; ctx.fillRect(Math.round(k.x - 4), Math.round(GROUND - k.h - 4), 8, 8);
        }
      }
      const ground = groundImgRef.current;
      if (ground?.complete) drawStrip(ground, s.gx, canvas.height - GROUND_H, GROUND_W, GROUND_H);
      const pet = petImgRef.current;
      // Poeira atrás dos pés (some em movimento reduzido), depois o pet com a pose
      // da corrida: quique da passada, estica no impulso, achata no pouso.
      drawDust(ctx, s.dust, dustColors);
      if (pet?.complete) {
        const pose = runPose({ t: s.t, speed: s.speed, h: s.h, vy: s.vy, sinceLand: s.sinceLand, reduced });
        ctx.save();
        if (s.dashT > 0) ctx.translate(DASH_PUSH, 0);
        drawPet(ctx, pet, GROUND, s.h, pose, petMirror, petScaleRef.current);
        ctx.restore();
      }
      if (chargesElRef.current) chargesElRef.current.textContent = String(s.charges);
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
      // C-11 (decisão do dono, 30/09/2026): vencer um minijogo NÃO é concluir
      // uma tarefa — pela R-CAT a categoria vem do EVENTO, e `playTaskComplete`
      // é a categoria de conclusão. Fica mudo até existir a categoria arcade.
      if (pts > 0) onEarnPoints(pts);
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
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyX') { e.preventDefault(); dash(); }
    };
    window.addEventListener('keydown', onKey);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); };
  }, [phase, paused, jump, dash, onEarnPoints, onScore, petMirror]);

  return (
    <GameRoot style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)' }}>
      <GameHeader
        title={isPt ? 'Corrida com obstáculos' : 'Obstacle Run'}
        sub={<span className="sm2-num">{isPt ? 'Recorde' : 'Best'} {best}</span>}
        language={language}
        infoLabel={isPt ? 'Como se joga' : 'How to play'}
        info={isPt
          ? 'Pule os inimigos! Eles ficam mais fortes com o tempo. 100 de score = 1 Bit. Nível 2: Dash (Shift/X) destrói obstáculos; pegue o coletável para +1 carga'
          : 'Jump the enemies! They get scarier over time. 100 score = 1 Bit. Level 2: Dash (Shift/X) smashes obstacles; grab the pickup for +1 charge'}
        closeLabel={isPt ? 'Sair' : 'Exit'}
        onClose={onExit}
        exitConfirm={phase === 'playing' ? gameExitConfirm(isPt, 'da corrida') : undefined}
        onPauseChange={setPaused}
      />

      {/* O VISOR 348×192 (D-J3): a cena `minigame-dino` em `cover` atrás, o
          `<canvas>` transparente na frente desenhando o parallax e o chão a
          1×, o pet a 64 e os obstáculos. Tocar no vidro também pula. */}
      <div
        ref={stageRef}
        data-dino-stage
        style={{
          position: 'relative', flex: '1 1 0', minHeight: STAGE_MIN_H, overflow: 'hidden',
          // sangra até as bordas (o `GameRoot` tem 16 px de gutter lateral)
          margin: '0 -16px',
          background: `${DINO_SCENE.bg.replace('center/cover', 'center 40%/cover')}`,
          imageRendering: 'auto',
        }}
      >
        <canvas
          ref={canvasRef}
          width={stage.w}
          height={stage.h}
          onPointerDown={jump}
          style={{ display: 'block', width: stage.w, height: stage.h, touchAction: 'manipulation', imageRendering: 'pixelated' }}
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
        {g.current.level === 2 && phase === 'playing' && (
          <span aria-live="off" className="sm2-num" style={{ position: 'absolute', right: 8, top: 8, padding: '2px 6px', zIndex: 2, fontFamily: 'var(--sm2-font-pixel)', fontSize: 'var(--sm2-text-sm)', color: 'var(--sm2-viewport-ink)', backgroundColor: 'color-mix(in srgb, var(--sm2-viewport-bg) 78%, transparent)', borderRadius: 'var(--sm2-radius-sm)' }}>
            Dash <span ref={chargesElRef}>{DASH_START_CHARGES}</span>
          </span>
        )}
      </div>


      {phase !== 'playing' && (
        <div role="group" aria-label={isPt ? 'Nível' : 'Level'} style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {([1, 2] as const).map(n => (
            <button key={n} type="button" onClick={() => setLevel(n)} aria-pressed={level === n}
              style={{ ...sm2Button(level === n ? 'primary' : 'outline'), minWidth: 110 }}>
              {isPt ? 'Nível' : 'Level'} {n}
            </button>
          ))}
        </div>
      )}
      {phase === 'ready' && (
        <>
          <button type="button" onClick={start} style={{ ...sm2Button('primary'), width: '100%', maxWidth: 240, alignSelf: 'center' }}>
            {isPt ? 'Começar' : 'Start'}
          </button>
        </>
      )}
      {phase === 'over' && (
        <>
          <p style={phaseTitle}>{isPt ? 'Fim de jogo!' : 'Game over!'}</p>
          <p className="sm2-num" style={phaseLine}>Score: {finalScore} · <BitsAmount value={earned} sign="+" /></p>
          <button type="button" onClick={start} style={{ ...sm2Button('primary'), width: '100%', maxWidth: 240, alignSelf: 'center' }}>
            {isPt ? 'Jogar de novo' : 'Play again'}
          </button>
          <RankingPanel key={finalScore} game="dino" saveId={rankSaveId} language={language} score={finalScore} />
        </>
      )}

      {/* O PULAR é aparelho: primário de 64 de altura e largura inteira, sem
          ícone, `onPointerDown` (reflexo — não espera o `click`). Inerte
          antes de começar: `surface-2` + `muted`, nunca opacidade. */}
      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
      <button
        type="button"
        onPointerDown={jump}
        disabled={phase !== 'playing'}
        aria-label={isPt ? 'Pular' : 'Jump'}
        style={{ ...sm2Button('primary', phase !== 'playing', 'lg'), minHeight: 64, flex: 1, touchAction: 'manipulation', userSelect: 'none' }}
      >
        {isPt ? 'Pular' : 'Jump'}
      </button>
        {level === 2 && (
          <button
            type="button"
            onPointerDown={dash}
            disabled={phase !== 'playing'}
            aria-label="Dash"
            style={{ ...sm2Button('primary', phase !== 'playing', 'lg'), minHeight: 64, flex: 1, touchAction: 'manipulation', userSelect: 'none' }}
          >
            Dash
          </button>
        )}
      </div>
    </GameRoot>
  );
}
