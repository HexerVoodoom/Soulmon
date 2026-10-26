import { useState, useEffect, useRef } from 'react';
import { RankingPanel } from './RankingPanel';
import { getSpriteForStage } from '../utils/sprites';
import { lineIconForStage } from '../utils/lineIcons';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { readNumber, writeLocal } from '../utils/safeStorage';
import type { Language } from '../utils/i18n';
import { sm2Button } from './form/FormKit';
import { GameRoot, GameHeader, phaseTitle, phaseLine, gameExitConfirm } from './games/GameKit';
import { BitsAmount } from './ui/BitsAmount';
import { fxFrame, prefersReducedMotion } from '../utils/combatFx';
import type { GameChallenge } from '../utils/gameChallenge';
import { rosterSpriteOf } from '../utils/novosSoulmon';
import {
  FIELD_W, FIELD_H, PLAYER_Y, PLAYER_SPEED, PLAYER_SIZE, ENEMY_SIZE, SHOT_R, BARRAGE_POINTS_PER_BIT,
  newBarrage, stepBarrage, barrageBits, type BarrageState,
} from '../utils/soulBarrage';

/**
 * Soul Barrage (EN) / Chuva de Almas (PT) — bullet hell vertical do Salão de Jogos (BETA3 M9).
 * Toda a regra mora em `utils/soulBarrage.ts`; aqui só há canvas, toque/mouse e copy.
 * Superfície NASCE MUDA (R-NOVA): nenhum som. Bits pelo MESMO funil dos minigames
 * (`onEarnPoints`, teto diário aplicado fora). Score semanal: ranking genérico `soul-barrage`.
 */
export function SoulBarrage({ evolutionStage, demoCharacterId, petElement, playerLevel = 1, language, onEarnPoints, rankSaveId, onExit, challenge }: {
  /** Modo desafio (Calabouço): vence sobrevivendo `goal` segundos; sem Bits/recorde/ranking. */
  challenge?: GameChallenge;
  evolutionStage: string;
  demoCharacterId?: string;
  /** Elemento dominante do Soulmon: escolhe o sprite `fx-<el>-orb` do tiro. */
  petElement?: string;
  playerLevel?: number;
  language: Language;
  onEarnPoints: (pts: number) => void;
  rankSaveId?: string;
  onExit: () => void;
}) {
  const isPt = language === 'pt-BR';
  const challengeRef = useRef(challenge);
  challengeRef.current = challenge;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready');
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.visibilityState === 'hidden');
  const [finalScore, setFinalScore] = useState(0);
  const [earned, setEarned] = useState(0);
  const [best, setBest] = useState(() => readNumber(STORAGE_KEYS.BARRAGE_BEST, 0));
  const onEarnRef = useRef(onEarnPoints);
  onEarnRef.current = onEarnPoints;
  const bestRef = useRef(best);
  bestRef.current = best;
  const reduced = useRef(prefersReducedMotion());
  const dirRef = useRef(0);
  const keysRef = useRef({ left: false, right: false, btnLeft: false, btnRight: false });
  const g = useRef<BarrageState>(newBarrage());
  const targetX = useRef(FIELD_W / 2);
  const hudRef = useRef<HTMLSpanElement>(null);
  const imgs = useRef<{ pet?: HTMLImageElement; orb?: HTMLImageElement; foes: Map<string, HTMLImageElement>; foeOrbs: Map<string, HTMLImageElement> }>({ foes: new Map(), foeOrbs: new Map() });

  const loadImg = (src: string | undefined) => { if (!src) return undefined; const i = new Image(); i.src = src; return i; };

  useEffect(() => {
    imgs.current.pet = loadImg(lineIconForStage(evolutionStage, 64, demoCharacterId) ?? getSpriteForStage(evolutionStage, demoCharacterId, 256));
    imgs.current.orb = loadImg(fxFrame(petElement, 'orb'));
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
      if (!i) { i = loadImg(rosterSpriteOf(e.entry)); if (i) imgs.current.foes.set(e.entry.key, i); }
      return i;
    };
    const ready = (i?: HTMLImageElement) => !!i && i.complete && i.naturalWidth > 0;

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (dirRef.current !== 0) {
        targetX.current = Math.min(FIELD_W, Math.max(0, targetX.current + dirRef.current * PLAYER_SPEED * Math.min(dt, 0.05)));
      }
      const ev = stepBarrage(s, dt, targetX.current, playerLevel, Math.random);
      if (ev.hit && !calm) { try { navigator.vibrate?.(30); } catch { /* noop */ } }

      // fundo: faixas que rolam para cima
      ctx.clearRect(0, 0, FIELD_W, FIELD_H);
      ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, FIELD_W, FIELD_H);
      ctx.fillStyle = 'rgba(233,245,242,0.35)';
      for (let i = 0; i < 40; i++) {
        const x = (i * 97) % FIELD_W;
        const y = (((i * 53) % FIELD_H) - (calm ? 0 : s.scroll) * (0.5 + (i % 3) * 0.4)) % FIELD_H;
        ctx.fillRect(x, y < 0 ? y + FIELD_H : y, 2, 2 + (i % 3));
      }
      // inimigos
      for (const e of s.enemies) {
        const img = foeImg(e);
        if (ready(img)) ctx.drawImage(img!, e.x - ENEMY_SIZE / 2, e.y - ENEMY_SIZE / 2, ENEMY_SIZE, ENEMY_SIZE);
        else { ctx.fillStyle = '#B0722F'; ctx.fillRect(e.x - 14, e.y - 14, 28, 28); }
        if (e.hp < e.maxHp) { ctx.fillStyle = '#5E3612'; ctx.fillRect(e.x - 14, e.y - ENEMY_SIZE / 2 - 4, 28, 3); ctx.fillStyle = '#E9F5F2'; ctx.fillRect(e.x - 14, e.y - ENEMY_SIZE / 2 - 4, 28 * (e.hp / e.maxHp), 3); }
      }
      // tiros
      const orb = imgs.current.orb;
      for (const b of s.shots) {
        if (ready(orb)) ctx.drawImage(orb!, b.x - 10, b.y - 10, 20, 20);
        else { ctx.fillStyle = '#E9F5F2'; ctx.fillRect(b.x - SHOT_R, b.y - SHOT_R, SHOT_R * 2, SHOT_R * 2); }
      }
      for (const b of s.enemyShots) { ctx.fillStyle = '#ff5a5a'; ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill(); }
      // jogador (pisca na invulnerabilidade)
      const pet = imgs.current.pet;
      if (calm && s.invuln > 0) ctx.globalAlpha = 0.5;
      if (calm || !(s.invuln > 0 && Math.floor(s.t * 12) % 2 === 0)) {
        if (ready(pet)) ctx.drawImage(pet!, s.px - PLAYER_SIZE / 2, PLAYER_Y - PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);
        else { ctx.fillStyle = '#E9F5F2'; ctx.fillRect(s.px - 12, PLAYER_Y - 12, 24, 24); }
      }
      ctx.globalAlpha = 1;
      const nextHud = `${isPt ? 'Fase' : 'Phase'} ${s.phase} · ${s.score} · ${'♥'.repeat(Math.max(0, s.lives))}`;
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
      const pts = barrageBits(score);
      setFinalScore(score);
      setEarned(pts);
      if (pts > 0) onEarnRef.current(pts);
      const nb = Math.max(bestRef.current, score);
      writeLocal(STORAGE_KEYS.BARRAGE_BEST, String(nb));
      setBest(nb);
      setPhase('over');
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, paused, hidden, playerLevel, isPt]);

  const moveTo = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (r.width > 0) targetX.current = ((e.clientX - r.left) / r.width) * FIELD_W;
  };

  return (
    <GameRoot style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)' }}>
      <GameHeader
        title={isPt ? 'Chuva de Almas' : 'Soul Barrage'}
        sub={<span className="sm2-num">{isPt ? 'Recorde' : 'Best'} {best}</span>}
        language={language}
        infoLabel={isPt ? 'Como se joga' : 'How to play'}
        info={isPt
          ? `Arraste, use as setas (ou A/D) ou os botões para mover: o seu Soulmon atira sozinho. Desvie dos tiros inimigos (3 vidas). As fases ficam mais difíceis. ${BARRAGE_POINTS_PER_BIT} pontos = 1 Bit`
          : `Drag, use the arrow keys (or A/D) or the buttons to move: your Soulmon fires on its own. Dodge enemy shots (3 lives). Each phase gets harder. ${BARRAGE_POINTS_PER_BIT} points = 1 Bit`}
        closeLabel={isPt ? 'Sair' : 'Exit'}
        onClose={onExit}
        exitConfirm={phase === 'playing' || (phase === 'ready' && challenge) ? gameExitConfirm(isPt, isPt ? 'da partida' : 'this run') : undefined}
        onPauseChange={setPaused}
      />
      <div style={{ position: 'relative', flex: '1 1 0', minHeight: 240, display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          data-barrage-canvas
          width={FIELD_W}
          height={FIELD_H}
          onPointerDown={e => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ } moveTo(e); }}
          onPointerMove={moveTo}
          role="application"
          aria-label={isPt ? 'Campo da Chuva de Almas. Use as setas para mover.' : 'Soul Barrage field. Use the arrow keys to move.'}
          style={{ display: 'block', height: '100%', maxWidth: '100%', aspectRatio: `${FIELD_W} / ${FIELD_H}`, touchAction: 'none', imageRendering: 'pixelated', background: '#0b1220' }}
        />
        <span
          aria-live="off"
          role="img"
          aria-label={isPt ? 'Fase 1, 0 pontos, 3 vidas' : 'Phase 1, 0 points, 3 lives'}
          style={{ position: 'absolute', left: 8, top: 8, padding: '2px 6px', fontFamily: 'var(--sm2-font-pixel)', fontSize: 'var(--sm2-text-sm)', color: 'var(--sm2-viewport-ink)', backgroundColor: 'color-mix(in srgb, var(--sm2-viewport-bg) 78%, transparent)', borderRadius: 'var(--sm2-radius-sm)' }}
        >
          <span ref={hudRef}>{isPt ? 'Fase' : 'Phase'} 1 · 0</span>
        </span>
      </div>
      {phase === 'playing' && (
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
      {phase === 'ready' && (
        <button type="button" data-barrage-start onClick={start} style={{ ...sm2Button('primary'), width: '100%', maxWidth: 240, alignSelf: 'center' }}>
          {isPt ? 'Começar' : 'Start'}
        </button>
      )}
      {phase === 'over' && (
        <>
          <p style={phaseTitle}>{isPt ? 'Fim de jogo!' : 'Game over!'}</p>
          <p className="sm2-num" style={phaseLine}>{isPt ? 'Pontos' : 'Score'}: {finalScore} · <BitsAmount value={earned} sign="+" /></p>
          <button type="button" onClick={start} style={{ ...sm2Button('primary'), width: '100%', maxWidth: 240, alignSelf: 'center' }}>
            {isPt ? 'Jogar de novo' : 'Play again'}
          </button>
          <RankingPanel key={finalScore} game="soul-barrage" saveId={rankSaveId} language={language} score={finalScore} />
        </>
      )}
    </GameRoot>
  );
}
