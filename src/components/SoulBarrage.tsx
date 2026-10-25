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
import { fxFrame } from '../utils/combatFx';
import type { GameChallenge } from '../utils/gameChallenge';
import { rosterSpriteOf } from '../utils/novosSoulmon';
import {
  FIELD_W, FIELD_H, PLAYER_Y, PLAYER_SIZE, ENEMY_SIZE, SHOT_R, BARRAGE_POINTS_PER_BIT,
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
  const [finalScore, setFinalScore] = useState(0);
  const [earned, setEarned] = useState(0);
  const [best, setBest] = useState(() => readNumber(STORAGE_KEYS.BARRAGE_BEST, 0));
  const g = useRef<BarrageState>(newBarrage());
  const targetX = useRef(FIELD_W / 2);
  const hudRef = useRef<HTMLSpanElement>(null);
  const imgs = useRef<{ pet?: HTMLImageElement; orb?: HTMLImageElement; foes: Map<string, HTMLImageElement>; foeOrbs: Map<string, HTMLImageElement> }>({ foes: new Map(), foeOrbs: new Map() });

  const loadImg = (src: string | undefined) => { if (!src) return undefined; const i = new Image(); i.src = src; return i; };

  useEffect(() => {
    imgs.current.pet = loadImg(lineIconForStage(evolutionStage, 64, demoCharacterId) ?? getSpriteForStage(evolutionStage, demoCharacterId, 256));
    imgs.current.orb = loadImg(fxFrame(petElement, 'orb'));
  }, [evolutionStage, demoCharacterId, petElement]);

  const start = () => {
    g.current = newBarrage();
    targetX.current = FIELD_W / 2;
    setEarned(0);
    setPhase('playing');
  };

  useEffect(() => {
    if (phase !== 'playing' || paused) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    const s = g.current;
    let raf = 0;
    let last = performance.now();
    const foeImg = (e: BarrageState['enemies'][number]) => {
      let i = imgs.current.foes.get(e.entry.key);
      if (!i) { i = loadImg(rosterSpriteOf(e.entry)); if (i) imgs.current.foes.set(e.entry.key, i); }
      return i;
    };
    const ready = (i?: HTMLImageElement) => !!i && i.complete && i.naturalWidth > 0;

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const ev = stepBarrage(s, dt, targetX.current, playerLevel, Math.random);
      if (ev.hit) { try { navigator.vibrate?.(30); } catch { /* noop */ } }

      // fundo: faixas que rolam para cima
      ctx.clearRect(0, 0, FIELD_W, FIELD_H);
      ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, FIELD_W, FIELD_H);
      ctx.fillStyle = 'rgba(233,245,242,0.35)';
      for (let i = 0; i < 40; i++) {
        const x = (i * 97) % FIELD_W;
        const y = (((i * 53) % FIELD_H) - s.scroll * (0.5 + (i % 3) * 0.4)) % FIELD_H;
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
      if (!(s.invuln > 0 && Math.floor(s.t * 12) % 2 === 0)) {
        if (ready(pet)) ctx.drawImage(pet!, s.px - PLAYER_SIZE / 2, PLAYER_Y - PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);
        else { ctx.fillStyle = '#E9F5F2'; ctx.fillRect(s.px - 12, PLAYER_Y - 12, 24, 24); }
      }
      if (hudRef.current) hudRef.current.textContent = `${isPt ? 'Fase' : 'Phase'} ${s.phase} · ${s.score} · ${'♥'.repeat(Math.max(0, s.lives))}`;

      const ch = challengeRef.current;
      const survived = !!ch && !s.over && s.t >= ch.goal;
      if (!s.over && !survived) { raf = requestAnimationFrame(tick); return; }
      if (ch) { ch.onResult(survived); return; }
      const score = s.score;
      const pts = barrageBits(score);
      setFinalScore(score);
      setEarned(pts);
      if (pts > 0) onEarnPoints(pts);
      setBest(prev => { const nb = Math.max(prev, score); writeLocal(STORAGE_KEYS.BARRAGE_BEST, String(nb)); return nb; });
      setPhase('over');
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, paused, playerLevel, onEarnPoints, isPt]);

  const moveTo = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (r.width > 0) targetX.current = ((e.clientX - r.left) / r.width) * FIELD_W;
  };

  return (
    <GameRoot style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)' }}>
      <GameHeader
        title="Soul Barrage"
        sub={<span className="sm2-num">{isPt ? 'Recorde' : 'Best'} {best}</span>}
        language={language}
        infoLabel={isPt ? 'Como se joga' : 'How to play'}
        info={isPt
          ? `Arraste para mover: o seu Soulmon atira sozinho. Desvie dos tiros inimigos (3 vidas). As fases ficam mais difíceis. ${BARRAGE_POINTS_PER_BIT} pontos = 1 Bit`
          : `Drag to move: your Soulmon fires on its own. Dodge enemy shots (3 lives). Each phase gets harder. ${BARRAGE_POINTS_PER_BIT} points = 1 Bit`}
        closeLabel={isPt ? 'Sair' : 'Exit'}
        onClose={onExit}
        exitConfirm={phase === 'playing' ? gameExitConfirm(isPt, isPt ? 'da partida' : 'this run') : undefined}
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
          style={{ display: 'block', height: '100%', maxWidth: '100%', aspectRatio: `${FIELD_W} / ${FIELD_H}`, touchAction: 'none', imageRendering: 'pixelated', background: '#0b1220' }}
        />
        <span
          aria-live="off"
          style={{ position: 'absolute', left: 8, top: 8, padding: '2px 6px', fontFamily: 'var(--sm2-font-pixel)', fontSize: 'var(--sm2-text-sm)', color: 'var(--sm2-viewport-ink)', backgroundColor: 'color-mix(in srgb, var(--sm2-viewport-bg) 78%, transparent)', borderRadius: 'var(--sm2-radius-sm)' }}
        >
          <span ref={hudRef}>{isPt ? 'Fase' : 'Phase'} 1 · 0</span>
        </span>
      </div>
      {phase === 'ready' && (
        <button type="button" data-barrage-start onClick={start} style={{ ...sm2Button('primary'), width: '100%', maxWidth: 240, alignSelf: 'center' }}>
          {isPt ? 'Começar' : 'Start'}
        </button>
      )}
      {phase === 'over' && (
        <>
          <p style={phaseTitle}>{isPt ? 'Fim de jogo!' : 'Game over!'}</p>
          <p className="sm2-num" style={phaseLine}>Score: {finalScore} · <BitsAmount value={earned} sign="+" /></p>
          <button type="button" onClick={start} style={{ ...sm2Button('primary'), width: '100%', maxWidth: 240, alignSelf: 'center' }}>
            {isPt ? 'Jogar de novo' : 'Play again'}
          </button>
          <RankingPanel key={finalScore} game="soul-barrage" saveId={rankSaveId} language={language} score={finalScore} />
        </>
      )}
    </GameRoot>
  );
}
