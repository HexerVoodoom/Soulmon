import { useState, useEffect, useRef } from 'react';
import { RankingPanel } from './RankingPanel';
import { lotIconName } from '../utils/lotIcons';
import { getSpriteForStage } from '../utils/sprites';
import { lineIconForStage } from '../utils/lineIcons';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { readNumber, writeLocal } from '../utils/safeStorage';
import type { Language } from '../utils/i18n';
import { sm2Button } from './form/FormKit';
import { ResultScreen } from './games/ResultScreen';
import { SCENE_BG } from '../utils/fxPackArt';
import heartFull from '../assets/soulmon/hud/bars/heart-full.png';
import heartEmpty from '../assets/soulmon/hud/bars/heart-empty.png';
import { GameRoot, GameHeader, phaseTitle, phaseLine, gameExitConfirm } from './games/GameKit';
import { BitsAmount } from './ui/BitsAmount';
import { RewardPreview } from './ui/RewardPreview';
import { fxFrame, prefersReducedMotion } from '../utils/combatFx';
import type { GameChallenge } from '../utils/gameChallenge';
import { temaSpriteOf } from '../utils/temaInimigosArt';
import { BARRAGE_ROSTER } from '../utils/temaInimigos';
import {
  FIELD_W, FIELD_H, PLAYER_SPEED, PLAYER_SIZE, SHOT_R, SHOT_DRAW, BARRAGE_ELEMENT, BARRAGE_POINTS_PER_BIT, BIG_SHOT_R, SPECIAL_COST,
  newBarrage, stepBarrage, barrageBits, activateSpecial, specialKindOf, type BarrageState, type BarrageSpecial,
} from '../utils/soulBarrage';
import { emitFeat } from '../utils/feats';
import { ADVANCED_BITS_FACTOR, difficultyLabel } from '../utils/minigameDifficulty';

/**
 * Soul Barrage (EN) / Chuva de Almas (PT) — bullet hell vertical do Salão de Jogos (BETA3 M9).
 * Toda a regra mora em `utils/soulBarrage.ts`; aqui só há canvas, toque/mouse e copy.
 * Superfície NASCE MUDA (R-NOVA): nenhum som. Bits pelo MESMO funil dos minigames
 * (`onEarnPoints`, teto diário aplicado fora). Score semanal: ranking genérico `soul-barrage`.
 */
export function SoulBarrage({ evolutionStage, demoCharacterId, petElement, playerLevel = 1, initialLevel, onReplayRound, specialFamily, language, onEarnPoints, rankSaveId, onExit, challenge }: {
  /** Modo desafio (Calabouço): vence sobrevivendo `goal` segundos; sem Bits/recorde/ranking. */
  challenge?: GameChallenge;
  evolutionStage: string;
  demoCharacterId?: string;
  /** Elemento dominante do Soulmon: escolhe o sprite `fx-<el>-orb` do tiro. */
  petElement?: string;
  playerLevel?: number;
  /** 1 = Comum (setas/arrasto em X); 2 = Avançado (arrasto livre em X e Y, sem setas, botão Especial). Desafio sempre Comum. */
  /** Sessão de diversão: jogar de novo conta uma rodada. `false` = sem energia. */
  onReplayRound?: () => boolean;
  initialLevel?: 1 | 2;
  /** Família do especial do Soulmon (`StageSkills.especial.familia`): escolhe o efeito do botão Especial. */
  specialFamily?: string;
  language: Language;
  onEarnPoints: (pts: number) => void;
  rankSaveId?: string;
  onExit: () => void;
}) {
  const isPt = language === 'pt-BR';
  const level: 1 | 2 = challenge ? 1 : initialLevel === 2 ? 2 : 1;
  const special: BarrageSpecial = specialKindOf(specialFamily);
  const challengeRef = useRef(challenge);
  challengeRef.current = challenge;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready');
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.visibilityState === 'hidden');
  const [finalScore, setFinalScore] = useState(0);
  const [earned, setEarned] = useState(0);
  const [prevBest, setPrevBest] = useState(0);
  const [best, setBest] = useState(() => readNumber(level === 2 ? STORAGE_KEYS.BARRAGE_BEST_2 : STORAGE_KEYS.BARRAGE_BEST, 0));
  const onEarnRef = useRef(onEarnPoints);
  onEarnRef.current = onEarnPoints;
  const bestRef = useRef(best);
  bestRef.current = best;
  const reduced = useRef(prefersReducedMotion());
  const dirRef = useRef(0);
  const keysRef = useRef({ left: false, right: false, btnLeft: false, btnRight: false });
  const g = useRef<BarrageState>(newBarrage());
  const targetX = useRef(FIELD_W / 2);
  const targetY = useRef(FIELD_H - 70);
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const specialBtn = useRef<HTMLButtonElement>(null);
  const hudRef = useRef<HTMLSpanElement>(null);
  const heartsRef = useRef<HTMLSpanElement>(null);
  const imgs = useRef<{ pet?: HTMLImageElement; orb?: HTMLImageElement; foeOrb?: HTMLImageElement; boss?: HTMLImageElement; foes: Map<string, HTMLImageElement>; foeOrbs: Map<string, HTMLImageElement> }>({ foes: new Map(), foeOrbs: new Map() });

  const loadImg = (src: string | undefined) => { if (!src) return undefined; const i = new Image(); i.src = src; return i; };

  useEffect(() => {
    imgs.current.pet = loadImg(lineIconForStage(evolutionStage, 64, demoCharacterId) ?? getSpriteForStage(evolutionStage, demoCharacterId, 256));
    imgs.current.orb = loadImg(fxFrame(petElement, 'orb'));
    // o tiro dos inimigos é o FX de ESPAÇO (todos os inimigos são do espaço)
    imgs.current.foeOrb = loadImg(fxFrame(BARRAGE_ELEMENT, 'orb'));
  }, [evolutionStage, demoCharacterId, petElement]);

  const syncDir = () => {
    const k = keysRef.current;
    dirRef.current = (k.right || k.btnRight ? 1 : 0) - (k.left || k.btnLeft ? 1 : 0);
  };

  // A aba oculta pausa a partida (essencial no desafio por tempo).
  useEffect(() => {
    const onVis = () => setHidden(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Teclado: setas / A-D.
  useEffect(() => {
    if (phase !== 'playing') return;
    const set = (e: KeyboardEvent, on: boolean) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') { keysRef.current.left = on; e.preventDefault(); }
      else if (k === 'arrowright' || k === 'd') { keysRef.current.right = on; e.preventDefault(); }
      else return;
      syncDir();
    };
    const down = (e: KeyboardEvent) => set(e, true);
    const up = (e: KeyboardEvent) => set(e, false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      keysRef.current = { left: false, right: false, btnLeft: false, btnRight: false };
      dirRef.current = 0;
    };
  }, [phase]);

  const start = () => {
    g.current = newBarrage();
    targetX.current = FIELD_W / 2;
    targetY.current = g.current.py;
    setEarned(0);
    setPhase('playing');
  };

  useEffect(() => {
    if (phase !== 'playing' || paused || hidden) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    const s = g.current;
    let raf = 0;
    let last = performance.now();
    let hudText = '';
    const calm = reduced.current;
    const foeImg = (e: BarrageState['enemies'][number]) => {
      let i = imgs.current.foes.get(e.entry.key);
      if (!i) { i = loadImg(temaSpriteOf(e.entry)); if (i) imgs.current.foes.set(e.entry.key, i); }
      return i;
    };
    const ready = (i?: HTMLImageElement) => !!i && i.complete && i.naturalWidth > 0;

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (dirRef.current !== 0) {
        targetX.current = Math.min(FIELD_W, Math.max(0, targetX.current + dirRef.current * PLAYER_SPEED * Math.min(dt, 0.05)));
      }
      const ev = stepBarrage(s, dt, targetX.current, level, Math.random, level === 2 ? targetY.current : undefined);
      if (ev.hit && !calm) { try { navigator.vibrate?.(30); } catch { /* noop */ } }

      // fundo: faixas que rolam para cima
      // o cenário (`SCENE_BG.barrage`) fica ATRÁS do canvas (CSS); o canvas só escurece um pouco e desenha as estrelas sutis
      ctx.clearRect(0, 0, FIELD_W, FIELD_H);
      ctx.fillStyle = 'rgba(233,245,242,0.18)';
      for (let i = 0; i < 40; i++) {
        const x = (i * 97) % FIELD_W;
        const y = (((i * 53) % FIELD_H) - (calm ? 0 : s.scroll) * (0.5 + (i % 3) * 0.4)) % FIELD_H;
        ctx.fillRect(x, y < 0 ? y + FIELD_H : y, 2, 2 + (i % 3));
      }
      // inimigos
      for (const e of s.enemies) {
        const img = foeImg(e);
        if (ready(img)) ctx.drawImage(img!, e.x - e.size / 2, e.y - e.size / 2, e.size, e.size);
        else { ctx.fillStyle = '#B0722F'; ctx.fillRect(e.x - e.size / 3, e.y - e.size / 3, e.size * 0.66, e.size * 0.66); }
        if (e.hp < e.maxHp) {
          const bw = e.size * 0.6;
          ctx.fillStyle = '#5E3612'; ctx.fillRect(e.x - bw / 2, e.y - e.size / 2 - 4, bw, 4);
          ctx.fillStyle = '#E9F5F2'; ctx.fillRect(e.x - bw / 2, e.y - e.size / 2 - 4, bw * (e.hp / e.maxHp), 4);
        }
      }
      // Boss: o maior dos ultimates da Chuva, com barra de vida larga no topo
      if (s.boss) {
        const bo = s.boss;
        if (!imgs.current.boss) { const ent = BARRAGE_ROSTER.find(e => e.stage === 'ultimate') ?? BARRAGE_ROSTER[BARRAGE_ROSTER.length - 1]; imgs.current.boss = loadImg(ent ? temaSpriteOf(ent) : undefined); }
        const bi = imgs.current.boss;
        if (ready(bi)) ctx.drawImage(bi!, bo.x - bo.size / 2, bo.y - bo.size / 2, bo.size, bo.size);
        else { ctx.fillStyle = '#7a2fb0'; ctx.fillRect(bo.x - bo.size / 3, bo.y - bo.size / 3, bo.size * 0.66, bo.size * 0.66); }
        const bw = FIELD_W - 32;
        ctx.fillStyle = '#2a1238'; ctx.fillRect(16, 6, bw, 8);
        ctx.fillStyle = '#e9f5f2'; ctx.fillRect(16, 6, bw * Math.max(0, bo.hp / bo.maxHp), 8);
      }
      // tiros
      const orb = imgs.current.orb;
      for (const b of s.shots) {
        if (ready(orb)) {
          // a arte do orbe aponta para a DIREITA: gira −90° para sair para CIMA
          ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(-Math.PI / 2);
          ctx.drawImage(orb!, -SHOT_DRAW / 2, -SHOT_DRAW / 2, SHOT_DRAW, SHOT_DRAW);
          ctx.restore();
        } else { ctx.fillStyle = '#E9F5F2'; ctx.fillRect(b.x - SHOT_R, b.y - SHOT_R, SHOT_R * 2, SHOT_R * 2); }
      }
      const foeOrb = imgs.current.foeOrb;
      for (const b of s.enemyShots) {
        if (ready(foeOrb)) {
          // o FX de espaço, virado para onde o tiro vai
          ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.atan2(b.vy, b.vx));
          ctx.drawImage(foeOrb!, -SHOT_DRAW / 2, -SHOT_DRAW / 2, SHOT_DRAW, SHOT_DRAW);
          ctx.restore();
        } else { ctx.fillStyle = '#ff5a5a'; ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI * 2); ctx.fill(); }
      }
      // Especial (Avançado): feixe, pulso e escudo
      // O projétil grande do especial: o MESMO orbe do especial de combate, enorme, subindo pela tela
      for (const g of s.bigShots) {
        const sz = BIG_SHOT_R * 4;
        if (ready(orb)) { ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(-Math.PI / 2); ctx.drawImage(orb!, -sz / 2, -sz / 2, sz, sz); ctx.restore(); }
        else { ctx.fillStyle = 'rgba(120,230,240,0.8)'; ctx.beginPath(); ctx.arc(g.x, g.y, BIG_SHOT_R, 0, Math.PI * 2); ctx.fill(); }
      }
      if (s.pulse > 0) {
        ctx.strokeStyle = 'rgba(120,230,240,' + (s.pulse * 1.6).toFixed(2) + ')'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(s.px, s.py, (0.5 - s.pulse) * 2 * FIELD_H, 0, Math.PI * 2); ctx.stroke();
      }
      if (s.slow > 0) { ctx.fillStyle = 'rgba(80,140,255,0.08)'; ctx.fillRect(0, 0, FIELD_W, FIELD_H); }
      // jogador (pisca na invulnerabilidade)
      const pet = imgs.current.pet;
      if (calm && s.invuln > 0) ctx.globalAlpha = 0.5;
      if (calm || !(s.invuln > 0 && Math.floor(s.t * 12) % 2 === 0)) {
        if (ready(pet)) ctx.drawImage(pet!, s.px - PLAYER_SIZE / 2, s.py - PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);
        else { ctx.fillStyle = '#E9F5F2'; ctx.fillRect(s.px - 12, s.py - 12, 24, 24); }
      }
      ctx.globalAlpha = 1;
      if (s.shield > 0) { ctx.strokeStyle = 'rgba(120,230,240,0.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s.px, s.py, PLAYER_SIZE * 0.62, 0, Math.PI * 2); ctx.stroke(); }
      if (s.overdrive > 0) { ctx.strokeStyle = 'rgba(255,200,90,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s.px, s.py, PLAYER_SIZE * 0.55, 0, Math.PI * 2); ctx.stroke(); }
      const btn = specialBtn.current;
      if (btn) {
        const pct = Math.round((s.charge / SPECIAL_COST) * 100);
        btn.style.setProperty('--charge', pct + '%');
        btn.dataset.ready = s.charge >= SPECIAL_COST ? 'true' : 'false';
      }
      const nextHud = `${isPt ? 'Fase' : 'Phase'} ${s.phase} · ${s.score}`;
      const livesNow = Math.max(0, s.lives);
      if (heartsRef.current && heartsRef.current.dataset.lives !== String(livesNow)) {
        heartsRef.current.dataset.lives = String(livesNow);
        heartsRef.current.querySelectorAll('img').forEach((im, i) => { im.src = i < livesNow ? heartFull : heartEmpty; });
      }
      if (hudRef.current && nextHud !== hudText) {
        hudText = nextHud;
        hudRef.current.textContent = nextHud;
        const hearts = hudRef.current.parentElement;
        if (hearts) hearts.setAttribute('aria-label', `${isPt ? 'Fase' : 'Phase'} ${s.phase}, ${s.score} ${isPt ? 'pontos' : 'points'}, ${Math.max(0, s.lives)} ${isPt ? 'vidas' : 'lives'}`);
      }

      const ch = challengeRef.current;
      const survived = !!ch && !s.over && s.t >= ch.goal;
      if (!s.over && !survived) { raf = requestAnimationFrame(tick); return; }
      if (ch) { ch.onResult(survived); return; }
      const score = s.score;
      const pts = barrageBits(score) * (level === 2 ? ADVANCED_BITS_FACTOR : 1);
      setFinalScore(score);
      setPrevBest(bestRef.current);
      setEarned(pts);
      if (pts > 0) onEarnRef.current(pts);
      emitFeat('barrageBest', Math.floor(score));
      const nb = Math.max(bestRef.current, score);
      writeLocal(level === 2 ? STORAGE_KEYS.BARRAGE_BEST_2 : STORAGE_KEYS.BARRAGE_BEST, String(nb));
      setBest(nb);
      setPhase('over');
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, paused, hidden, level, isPt]);

  const moveTo = (e: React.PointerEvent<HTMLElement>) => {
    const r = canvasRef.current?.getBoundingClientRect();
    if (!r) return;
    if (r.width <= 0) return;
    if (level === 2) {
      // Avançado: arrasto RELATIVO (o dedo não cobre o Soulmon), em X e Y.
      const d = drag.current;
      if (!d) return;
      targetX.current = Math.min(FIELD_W, Math.max(0, d.tx + ((e.clientX - d.x) / r.width) * FIELD_W));
      targetY.current = Math.min(FIELD_H, Math.max(0, d.ty + ((e.clientY - d.y) / r.height) * FIELD_H));
      return;
    }
    targetX.current = ((e.clientX - r.left) / r.width) * FIELD_W;
  };
  const fireSpecial = () => { if (phase === 'playing' && !paused) activateSpecial(g.current, special); };

  return (
    // Tela cheia (04/11/2026, dono): o fundo da área do jogo cobre a tela toda; o campo não fica mais numa "janela" com outro fundo atrás.
    <GameRoot style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)', background: `linear-gradient(rgba(5,18,24,.35), rgba(5,18,24,.35)), url(${SCENE_BG.barrage}) center/cover #0b1220` }}>
      <GameHeader
        title={isPt ? 'Chuva de Almas' : 'Soul Barrage'}
        sub={<span className="sm2-num">{isPt ? 'Recorde' : 'Best'} {best}</span>}
        language={language}
        infoLabel={isPt ? 'Como se joga' : 'How to play'}
        info={isPt
          ? (level === 2 ? `Arraste o dedo para mover o Soulmon em qualquer direção: ele atira sozinho. Desviar e abater enche o botão Especial (o efeito é o do especial dele). Bits ×${ADVANCED_BITS_FACTOR}. ` : '') + `Arraste, use as setas (ou A/D) ou os botões: o seu Soulmon atira sozinho. Desvie dos tiros e barre os inimigos (3 vidas; 1 s invulnerável ao perder uma). ${BARRAGE_POINTS_PER_BIT} pontos = 1 Bit`
          : (level === 2 ? `Drag a finger to move the Soulmon in any direction: it fires on its own. Defeating foes fills the Special button (its effect matches the Soulmon's special). Bits ×${ADVANCED_BITS_FACTOR}. ` : '') + `Drag, use the arrow keys (or A/D) or the buttons: your Soulmon fires on its own. Dodge shots and stop the enemies (3 lives; 1 s invulnerable after losing one). ${BARRAGE_POINTS_PER_BIT} points = 1 Bit`}
        closeLabel={isPt ? 'Sair' : 'Exit'}
        onClose={onExit}
        exitConfirm={phase === 'playing' || (phase === 'ready' && challenge) ? gameExitConfirm(isPt, isPt ? 'da partida' : 'this run') : undefined}
        onPauseChange={setPaused}
      />
      <div data-barrage-area style={{ position: 'relative', flex: '1 1 0', minHeight: 240, display: 'flex', justifyContent: 'center', overflow: 'hidden', touchAction: 'none' }}
        onPointerDown={e => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ } drag.current = { x: e.clientX, y: e.clientY, tx: g.current.px, ty: g.current.py }; moveTo(e); }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
        onPointerMove={moveTo}>
        <canvas
          ref={canvasRef}
          data-barrage-canvas
          width={FIELD_W}
          height={FIELD_H}
          role="application"
          aria-label={level === 2 ? (isPt ? 'Campo da Chuva de Almas. Arraste para mover em qualquer direção.' : 'Soul Barrage field. Drag to move in any direction.') : (isPt ? 'Campo da Chuva de Almas. Use as setas para mover.' : 'Soul Barrage field. Use the arrow keys to move.')}
          style={{ display: 'block', height: '100%', maxWidth: '100%', aspectRatio: `${FIELD_W} / ${FIELD_H}`, touchAction: 'none', imageRendering: 'pixelated', background: 'transparent' }}
        />
        <span
          aria-live="off"
          role="img"
          aria-label={isPt ? 'Fase 1, 0 pontos, 3 vidas' : 'Phase 1, 0 points, 3 lives'}
          style={{ position: 'absolute', left: 8, top: 8, padding: '2px 6px', fontFamily: 'var(--sm2-font-pixel)', fontSize: 'var(--sm2-text-sm)', color: 'var(--sm2-viewport-ink)', backgroundColor: 'color-mix(in srgb, var(--sm2-viewport-bg) 78%, transparent)', borderRadius: 'var(--sm2-radius-sm)' }}
        >
          <span ref={hudRef}>{isPt ? 'Fase' : 'Phase'} 1 · 0</span>
          <span ref={heartsRef} data-lives="3" aria-hidden="true" style={{ display: 'inline-flex', gap: 2, marginLeft: 6, verticalAlign: 'middle' }}>
            {[0, 1, 2].map(i => <img key={i} src={heartFull} alt="" width={14} height={11} style={{ display: 'block' }} />)}
          </span>
        </span>
        {level === 2 && phase === 'playing' && (
          <button
            ref={specialBtn}
            type="button"
            data-barrage-special={special}
            data-ready="false"
            onPointerDown={e => { e.preventDefault(); fireSpecial(); }}
            aria-label={isPt ? 'Especial' : 'Special'}
            style={{ ...sm2Button('primary'), position: 'absolute', right: 10, bottom: 10, minWidth: 96, minHeight: 48, touchAction: 'none', overflow: 'hidden', background: 'linear-gradient(to right, var(--sm2-accent, #3fd0c9) var(--charge, 0%), color-mix(in srgb, var(--sm2-viewport-bg) 80%, transparent) var(--charge, 0%))', color: 'var(--sm2-viewport-ink)' }}
          >
            {isPt ? 'Especial' : 'Special'}
          </button>
        )}
      </div>
      {phase === 'playing' && level === 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flex: 'none' }}>
          {(['left', 'right'] as const).map(side => {
            const key = side === 'left' ? 'btnLeft' : 'btnRight';
            const press = (on: boolean) => { keysRef.current[key] = on; syncDir(); };
            return (
              <button
                key={side}
                type="button"
                data-barrage-btn={side}
                aria-label={side === 'left' ? (isPt ? 'Mover para a esquerda' : 'Move left') : (isPt ? 'Mover para a direita' : 'Move right')}
                onPointerDown={e => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ } press(true); }}
                onPointerUp={() => press(false)}
                onPointerCancel={() => press(false)}
                onLostPointerCapture={() => press(false)}
                style={{ ...sm2Button('outline'), width: 88, minHeight: 44, touchAction: 'none' }}
              >
                <span aria-hidden="true">{side === 'left' ? '◀' : '▶'}</span>
              </button>
            );
          })}
        </div>
      )}
      {phase === 'ready' && (<>
        <div style={{ display: 'flex', justifyContent: 'center' }}><RewardPreview mode="before" language={isPt ? 'pt-BR' : 'en-US'} items={[{ kind: 'bits' }]} /></div>
        <button type="button" data-barrage-start onClick={start} style={{ ...sm2Button('primary'), width: '100%', maxWidth: 240, alignSelf: 'center' }}>
          {isPt ? 'Começar' : 'Start'}
        </button>
      </>)}
      {phase === 'over' && (
        <ResultScreen
          playAgainIcon={lotIconName('jogos', 'salao')} dailyEvent="barrage"
          language={language}
          outcome={prevBest > 0 && finalScore > prevBest ? 'record' : 'calm'}
          bannerKind={prevBest > 0 && finalScore > prevBest ? undefined : 'complete'}
          gameName={isPt ? 'Chuva de Almas' : 'Soul Barrage'}
          title={isPt ? 'Chuva encerrada' : 'Barrage over'}
          line={prevBest > 0 && finalScore > prevBest
            ? (isPt ? 'Nunca passou tanta chuva por ele. Ele está orgulhoso.' : 'Never has this much rain passed him by. He is proud.')
            : (isPt ? 'Ele está pronto quando você estiver.' : 'He is ready when you are.')}
          hero={{ label: isPt ? 'Pontos' : 'Score', value: finalScore }}
          recordNote={isPt ? `Novo recorde, antes ${prevBest}` : `New best, was ${prevBest}`}
          strip={[...(level === 2 ? [{ key: 'level', label: isPt ? 'Dificuldade' : 'Difficulty', value: difficultyLabel(2, isPt) }] : []), ...(prevBest > 0 ? [{ key: 'best', label: isPt ? 'Recorde' : 'Best', value: best, hideOnRecord: true }] : [])]}
          ledger={[{ key: 'bits', kind: 'bits', value: earned }]}
          emptyLedgerLine={isPt ? 'Rodada leve, sem Bits desta vez.' : 'A light round, no Bits this time.'}
          petSrc={getSpriteForStage(evolutionStage, demoCharacterId, 256)}
          playAgainLabel={isPt ? 'Jogar de novo' : 'Play again'}
          onPlayAgain={() => { if (onReplayRound && !onReplayRound()) return; start(); }}
          homeLabel={isPt ? 'Sair' : 'Exit'}
          onHome={onExit}
          below={<RankingPanel key={finalScore} game={level === 2 ? 'soul-barrage-2' : 'soul-barrage'} saveId={rankSaveId} language={language} score={finalScore} />}
        />
      )}
    </GameRoot>
  );
}
