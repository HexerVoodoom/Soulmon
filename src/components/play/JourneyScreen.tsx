/**
 * A JORNADA DO FOCO em tela cheia (§247). Posição = função do tempo de foco do SERVIDOR (`now` corrigido por `delta`); sair,
 * ir para o fundo ou recarregar não muda nada. Desenho em SVG, com arte provisória (gradiente + motivos) até a fila de geração.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { sm2Hint, sm2Text } from '../form/FormKit';
import { Icon } from '../ui/Icon';
import type { Language } from '../../utils/i18n';
import {
  JOURNEY_MAX_PAUSES, JOURNEY_MODES, focusElapsed, journeyChests, journeyProgress, trailAt, trailSpine, type JourneyItem, type JourneyKeyId,
} from '../../utils/focusJourney';
import type { ActiveJourney } from '../../utils/focusJourneyApi';
import { formatClock } from '../../utils/focoTimer';
import { useBackLayer } from '../../utils/backStack';
import { useKeepAwake } from '../../utils/keepAwake';
import { FocusTaskDock, JOURNEY_CARD_WIDTH, JOURNEY_GLASS, type DockTask } from './FocusTaskDock';
import { BAG_SIZE, FlyingItem, FocusBag } from './FocusBag';
import { JOURNEY_BLOCK_H, JOURNEY_TOP_PAD, JOURNEY_VIEW_BLOCKS, journeyCamera } from '../../utils/focusJourneyCamera';
import { MATERIALS } from '../../utils/buildingQuestsCopy';
import { essenceName } from '../../utils/essences';
import { JOURNEY_ART, KEY_ART, CHEST_ART, CHEST_OPEN_SHEET, CHEST_GLOW_SHEET, OASIS_TONE } from './journeyArt';

export const KEY_COLOR: Record<JourneyKeyId, string> = {
  bancada: 'var(--sm2-key-bancada)', relampago: 'var(--sm2-key-relampago)', quadrantes: 'var(--sm2-key-quadrantes)',
  brejo: 'var(--sm2-key-brejo)', elo: 'var(--sm2-key-elo)', pena: 'var(--sm2-key-pena)',
};
const ENV_TONE: Record<string, [string, string]> = {
  forest: ['#0d2b27', '#15463a'], shore: ['#0b2a33', '#14495a'], cavern: ['#0a1f22', '#1a3438'],
  garden: ['#10302c', '#1d5246'], workshop: ['#0e2626', '#2a3b33'], observatory: ['#081c22', '#0f3640'],
};
const VIEW_BLOCKS = JOURNEY_VIEW_BLOCKS;
const ROUND: CSSProperties = { width: 48, height: 48, borderRadius: '50%', border: 'none', background: 'transparent', color: 'var(--sm2-ink)', display: 'grid', placeItems: 'center', padding: 0, cursor: 'pointer' };
const SVG = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;
/** Duração da dissolução do mapa para a sala de descanso (ms). */
export const JOURNEY_LEAVE_MS = 900;
const prefersReducedMotion = (): boolean => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
const H = JOURNEY_BLOCK_H; // altura do bloco em unidades do SVG (arte 1:2)

export function itemLabel(it: JourneyItem, isPt: boolean): string {
  if (it.kind === 'food') return `${it.id} ×${it.qty}`;
  if (it.kind === 'essence') return `${essenceName(it.id, isPt)} ×${it.qty}`;
  const m = MATERIALS.find(x => x.id === it.id);
  return m ? `${m.icon} ${isPt ? m.namePt : m.nameEn} ×${it.qty}` : `${it.id} ×${it.qty}`;
}

export function JourneyScreen({ language, active, delta, petSprite, lastItems, tetoDia = false, collected = [], focusTaskId, tasks = [], onToggleTask = () => {}, onToggleStep = () => {}, onPause, onResume, onClaim, onEnd, onClose }: {
  language: Language; active: ActiveJourney; delta: number; petSprite?: string; lastItems: JourneyItem[] | null;
  /** O teto diário de itens da Jornada já foi atingido: os baús que faltam abrem vazios, e a tela diz isso (22/11/2026). */
  tetoDia?: boolean;
  /** Lista de tarefas da sessão (§304): as da Home, com subtópicos; marcar usa os handlers da Home. */
  /** Tudo o que o Soulmon achou na sessão (o baú do canto) e a tarefa escolhida ao começar (§300). */
  collected?: readonly JourneyItem[]; focusTaskId?: string | null;
  tasks?: readonly DockTask[]; onToggleTask?: (id: string) => void; onToggleStep?: (taskId: string, stepId: string) => void;
  onPause: () => void; onResume: () => void; onClaim: () => void; onEnd: () => void; onClose: () => void;
}) {
  const isPt = language === 'pt-BR';
  const [now, setNow] = useState(() => Date.now() + delta);
  const [confirmEnd, setConfirmEnd] = useState(false);
  useBackLayer(true, onClose);
  useEffect(() => {
    const tick = () => setNow(Date.now() + delta);
    tick();
    const id = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [delta]);

  const blocks = active.mode === 'p25' ? 6 : 10;
  const spine = useMemo(() => trailSpine(active.seed, active.mode, blocks), [active.seed, active.mode, blocks]);
  const chests = useMemo(() => journeyChests(active.seed, active.mode), [active.seed, active.mode]);
  const p = journeyProgress(active, now);
  const reached = chests.filter(c => c.at <= p).length;
  const claimed = useRef(-1);
  useEffect(() => {
    if (p >= 1) return;
    if (reached > claimed.current) { claimed.current = reached; onClaim(); }
  }, [reached, p >= 1]); // eslint-disable-line react-hooks/exhaustive-deps
  /* O fim do trajeto é o fim de uma SEÇÃO do mapa (§312): em vez de carregar a próxima, o cenário se dissolve na cor da sala de descanso
     e a sala (tela cheia, mesmo fundo) assume. Movimento reduzido ou jornada já terminada ao abrir: passa direto, sem fade. */
  const [leaving, setLeaving] = useState(false);
  const openedArrived = useRef(p >= 1);
  useEffect(() => {
    if (p < 1) return;
    claimed.current = reached;
    if (openedArrived.current || prefersReducedMotion()) { onClaim(); return; }
    setLeaving(true);
    const id = setTimeout(onClaim, JOURNEY_LEAVE_MS);
    return () => clearTimeout(id);
  }, [p >= 1]); // eslint-disable-line react-hooks/exhaustive-deps

  const left = Math.max(0, JOURNEY_MODES[active.mode].focusMin * 60_000 - focusElapsed(active, now));
  const pet = trailAt(spine, p);
  const tone = ENV_TONE[active.env] ?? ENV_TONE.forest;
  const Y = (y: number) => (blocks - y) * H;
  const art = JOURNEY_ART[active.env];
  const paused = active.pausedAt !== null;
  /* Tela acordada só com o timer rodando: pausa, chegada e saída soltam (§304). */
  const awake = useKeepAwake(p < 1 && !paused);
  const clockRef = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [clockBottom, setClockBottom] = useState(190);
  const [screen, setScreen] = useState(() => ({ w: typeof window !== 'undefined' ? window.innerWidth : 390, h: typeof window !== 'undefined' ? window.innerHeight : 844 }));
  useLayoutEffect(() => {
    const measure = () => {
      const b = clockRef.current?.getBoundingClientRect().bottom; if (b && b > 0) setClockBottom(Math.ceil(b));
      const r = boxRef.current?.getBoundingClientRect(); if (r && r.width > 0 && r.height > 0) setScreen({ w: r.width, h: r.height });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [paused, p >= 1]);
  const cam = journeyCamera({ petY: pet.y, blocks, screenW: screen.w, screenH: screen.h, clockBottom });
  const dockBottom = `calc(${16 + BAG_SIZE + 8}px + env(safe-area-inset-bottom, 0px))`;

  /* Itens achados: saem do baú do mapa e entram no baú do canto (§300). */
  const bagRef = useRef<HTMLButtonElement>(null);
  const seenItems = useRef(lastItems);
  const flightSeq = useRef(0);
  const [flights, setFlights] = useState<Array<{ id: number; item: JourneyItem; from: { x: number; y: number }; to: { x: number; y: number } }>>([]);
  useEffect(() => {
    if (!lastItems || lastItems.length === 0 || lastItems === seenItems.current) return;
    seenItems.current = lastItems;
    const box = boxRef.current?.getBoundingClientRect();
    const bag = bagRef.current?.getBoundingClientRect();
    const chestEl = reached > 0 ? document.querySelector(`[data-journey-chest="${reached - 1}"]`) : null;
    const c = chestEl?.getBoundingClientRect();
    const from = c && c.width > 0 && c.bottom > 0 && c.top < (box?.bottom ?? 9999) ? { x: c.left + c.width / 2, y: c.top + c.height / 2 } : { x: (box?.left ?? 0) + (box?.width ?? 360) / 2, y: (box?.top ?? 0) + (box?.height ?? 640) * 0.55 };
    const to = bag ? { x: bag.left + bag.width / 2, y: bag.top + bag.height / 2 } : { x: 38, y: (box?.bottom ?? 640) - 38 };
    setFlights(f => [...f, ...lastItems.map(item => ({ id: ++flightSeq.current, item, from, to }))]);
  }, [lastItems]); // eslint-disable-line react-hooks/exhaustive-deps
  const inFlight = flights.reduce((n, f) => n + f.item.qty, 0);


  const box: CSSProperties = { position: 'fixed', inset: 0, zIndex: 210, background: tone[0], overflow: 'hidden' };
  return createPortal(
    <div ref={boxRef} role="dialog" aria-modal="true" aria-label={isPt ? 'Jornada do foco' : 'Focus journey'} data-journey style={box}>
      <svg data-journey-scene viewBox={`0 ${cam.vbTop} 100 ${VIEW_BLOCKS * H}`} preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: paused ? 0.6 : 1 }}>
        <defs><linearGradient id="jt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={tone[1]} /><stop offset="1" stopColor={tone[0]} /></linearGradient></defs>
        {Array.from({ length: blocks }, (_, b) => art
          ? <image key={b} data-journey-block href={art} x={0} y={Y(b + 1)} width={100} height={H} preserveAspectRatio="none" />
          : <g key={b}>
          <rect x={0} y={Y(b + 1)} width={100} height={H} fill="url(#jt)" />
          <rect x={0} y={Y(b + 1)} width={100} height={6} fill="#0a1d1d" />
          <line x1={50} x2={50} y1={Y(b + 1)} y2={Y(b + 1) + 6} stroke="#b8733a" strokeWidth={0.8} />
          {[0.12, 0.88].map(x => <polygon key={x} points={`${x * 100},${Y(b + 0.5) - 6} ${x * 100 + 3},${Y(b + 0.5)} ${x * 100},${Y(b + 0.5) + 6} ${x * 100 - 3},${Y(b + 0.5)}`} fill="#4fe3d6" opacity={0.55} />)}
        </g>)}
        <rect data-journey-top x={0} y={-JOURNEY_TOP_PAD} width={100} height={JOURNEY_TOP_PAD + 1} fill={tone[0]} />
        {chests.map(c => {
          const at = trailAt(spine, c.at);
          const side = at.x > 0.5 ? -1 : 1;
          const bx = (at.x + side * 0.2) * 100;
          const open = c.at <= p;
          const special = c.type !== 'common';
          const has = special && active.keys.includes(c.type as JourneyKeyId);
          return <g key={c.k} data-journey-chest={c.k} data-open={open} data-type={c.type}>
            <path d={`M${at.x * 100},${Y(at.y)} Q${(at.x + side * 0.1) * 100},${Y(at.y) - 8} ${bx},${Y(at.y) - 10}`} fill="none" stroke="#5c8f84" strokeWidth={1.6} strokeDasharray={open ? undefined : '1.5 1.5'} />
            {has && !open && <svg data-journey-glow x={bx - 14} y={Y(at.y) - 27} width={28} height={28} viewBox="0 0 128 128"><image href={CHEST_GLOW_SHEET} width={384} height={128} /></svg>}
            {(() => {
              const img = c.type === 'common' ? CHEST_ART.common : CHEST_ART[c.type as JourneyKeyId];
              if (open && c.type === 'common') return <svg x={bx - 9} y={Y(at.y) - 22} width={18} height={18} viewBox="576 0 192 256" preserveAspectRatio="xMidYMid meet"><image href={CHEST_OPEN_SHEET} width={768} height={256} /></svg>;
              if (img) return <image href={img} x={bx - 9} y={Y(at.y) - 22} width={18} height={18} opacity={open ? 0.55 : 1} />;
              return <rect x={bx - 3.5} y={Y(at.y) - 14} width={7} height={5.5} rx={1} fill={open ? '#3a2a1a' : '#6b4a2b'} stroke={special ? KEY_COLOR[c.type as JourneyKeyId] : '#b8733a'} strokeWidth={special ? 1.2 : 0.8} />;
            })()}
            {special && !has && !open && <circle cx={bx} cy={Y(at.y) - 4} r={1.2} fill="#e9f5f2" />}
          </g>;
        })}
        {petSprite
          ? <image data-journey-pet href={petSprite} x={Math.min(89, Math.max(11, pet.x * 100)) - 11} y={Y(pet.y) - 22} width={22} height={22} opacity={p >= 1 ? 0 : 1} style={{ imageRendering: 'pixelated', transition: 'opacity 600ms ease-in' }} />
          : <circle data-journey-pet cx={pet.x * 100} cy={Y(pet.y) - 6} r={5.5} fill="#e9f5f2" />}
      </svg>

      <div data-journey-leave data-leaving={leaving} aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none', background: (OASIS_TONE[active.env] ?? OASIS_TONE.forest).sky, opacity: leaving ? 1 : 0, transition: `opacity ${JOURNEY_LEAVE_MS}ms ease-in-out` }} />
      <FocusBag ref={bagRef} language={language} items={collected} pending={inFlight} />
      {flights.map(f => <FlyingItem key={f.id} item={f.item} isPt={isPt} from={f.from} to={f.to} onDone={() => setFlights(x => x.filter(y => y.id !== f.id))} />)}

      {active.keys.length > 0 && <span data-journey-keys aria-label={isPt ? 'Chaves desta jornada' : 'Keys for this journey'} style={{ position: 'absolute', zIndex: 2, right: 16, bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', height: BAG_SIZE, display: 'flex', alignItems: 'center', gap: 6 }}>
        {active.keys.map(k => <KeyGlyph key={k} k={k} size={20} />)}
      </span>}
      <section ref={clockRef} data-journey-modal style={{ ...JOURNEY_GLASS, position: 'absolute', top: 'calc(10px + env(safe-area-inset-top, 0px))', left: '50%', transform: 'translateX(-50%)', width: JOURNEY_CARD_WIDTH, zIndex: 2, padding: '8px 12px 10px', display: 'grid', justifyItems: 'center', gap: 6 }}>
        <span data-journey-clock role="timer" aria-label={isPt ? (p >= 1 ? 'Chegou' : paused ? 'Tempo restante, em pausa' : 'Tempo restante') : (p >= 1 ? 'Arrived' : paused ? 'Time left, paused' : 'Time left')} className="sm2-num" style={{ fontFamily: 'var(--sm2-font-display)', fontWeight: 700, fontSize: 'calc(var(--sm2-text-2xl) * 1.6)', lineHeight: 1.1, opacity: paused ? 0.7 : 1 }}>{formatClock(left)}</span>
        <div data-journey-actions style={{ display: 'flex', gap: 36, alignItems: 'center', justifyContent: 'center' }}>
          <button type="button" data-journey-close onClick={onClose} aria-label={isPt ? 'Sair para a Oficina (a jornada continua)' : 'Leave to the Workshop (the journey goes on)'} style={ROUND}>
            <svg {...SVG}><path d="M10 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H10" /><path d="M9.5 12H20" /><path d="m16.5 8.5 3.5 3.5-3.5 3.5" /></svg>
          </button>
          {p < 1 && (paused
            ? <button type="button" data-journey-resume onClick={onResume} aria-label={isPt ? 'Continuar' : 'Resume'} style={ROUND}>
              <svg {...SVG}><circle cx="12" cy="12" r="9" /><path d="M10 8.6v6.8l5.6-3.4z" fill="currentColor" /></svg>
            </button>
            : <button type="button" data-journey-pause onClick={onPause} disabled={active.pauses >= JOURNEY_MAX_PAUSES} aria-label={isPt ? 'Pausar' : 'Pause'} style={{ ...ROUND, opacity: active.pauses >= JOURNEY_MAX_PAUSES ? 0.4 : 1 }}>
              <svg {...SVG}><circle cx="12" cy="12" r="9" /><path d="M10 9v6M14 9v6" /></svg>
            </button>)}
          {p < 1 && (!confirmEnd
            ? <button type="button" data-journey-end onClick={() => setConfirmEnd(true)} aria-label={isPt ? 'Encerrar' : 'End'} style={ROUND}>
              <svg {...SVG}><circle cx="12" cy="12" r="9" /><rect x="9" y="9" width="6" height="6" rx="0.8" fill="currentColor" /></svg>
            </button>
            : <button type="button" data-journey-end-confirm onClick={onEnd} aria-label={isPt ? 'Encerrar e voltar' : 'End and go back'} style={{ ...ROUND, background: 'var(--sm2-ink)', color: 'var(--sm2-surface)' }}>
              <svg {...SVG}><circle cx="12" cy="12" r="9" /><rect x="9" y="9" width="6" height="6" rx="0.8" fill="currentColor" /></svg>
            </button>)}
        </div>
        {confirmEnd && p < 1 && <p role="status" style={{ ...sm2Hint, margin: 0, textAlign: 'center' }}>{isPt ? 'Toque de novo para encerrar e voltar' : 'Tap again to end and go back'}</p>}
        {p < 1 && !paused && active.pauses >= JOURNEY_MAX_PAUSES && <p style={{ ...sm2Hint, margin: 0, textAlign: 'center' }}>{isPt ? 'Daqui até o fim, o Soulmon segue direto.' : 'From here to the end, your Soulmon keeps going.'}</p>}
        {tetoDia && p < 1 && <p data-journey-cap role="status" style={{ ...sm2Hint, margin: 0, textAlign: 'center' }}>{isPt ? 'Teto do dia atingido: os próximos baús vêm vazios. Os itens voltam amanhã.' : "Daily cap reached: the next chests will be empty. Items are back tomorrow."}</p>}
      </section>
      <FocusTaskDock language={language} tasks={tasks} focusId={focusTaskId} onToggleTask={onToggleTask} onToggleStep={onToggleStep} top={clockBottom} bottom={dockBottom} />
      {!awake && p < 1 && !paused && <p role="status" data-journey-awake-hint style={{ ...sm2Hint, position: 'absolute', zIndex: 1, top: `calc(${clockBottom}px + 4px)`, left: 16, right: 16, margin: 0, textAlign: 'center', color: '#e9f5f2' }}>{isPt ? 'Este aparelho não segura a tela acesa: mantenha-a ligada.' : "This device can't keep the screen on: keep it awake yourself."}</p>}
    </div>,
    document.body,
  );
}

export const KEY_MUTED_OPACITY = 0.4;

/** Chave com arte quando existe; senão o ícone na cor do token. `muted` = ainda não conquistada: a mesma chave, esmaecida (no lugar do cadeado). */
export function KeyGlyph({ k, size, muted, label }: { k: JourneyKeyId; size: 20 | 24; muted?: boolean; label?: string }) {
  const src = KEY_ART[k];
  if (src) return <img src={src} alt={muted ? (label ?? '') : ''} data-key-glyph={k} data-key-muted={muted ? 'true' : undefined} width={size} height={size} style={{ display: 'block', imageRendering: 'pixelated', opacity: muted ? KEY_MUTED_OPACITY : 1 }} />;
  const color = { color: muted ? 'var(--sm2-muted)' : KEY_COLOR[k] };
  return size === 20 ? <Icon name="lock_open" size={20} tone="inherit" style={color} /> : <Icon name="lock_open" size={24} tone="inherit" style={color} />;
}
