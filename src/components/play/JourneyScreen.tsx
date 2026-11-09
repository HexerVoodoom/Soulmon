/**
 * A JORNADA DO FOCO em tela cheia (§247). Posição = função do tempo de foco do SERVIDOR (`now` corrigido por `delta`); sair,
 * ir para o fundo ou recarregar não muda nada. Desenho em SVG, com arte provisória (gradiente + motivos) até a fila de geração.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
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
import { MATERIALS } from '../../utils/buildingQuestsCopy';
import { essenceName } from '../../utils/essences';
import { JOURNEY_ART, KEY_ART, CHEST_ART, ARRIVAL_ART, CHEST_OPEN_SHEET, CHEST_GLOW_SHEET } from './journeyArt';

export const KEY_COLOR: Record<JourneyKeyId, string> = {
  bancada: 'var(--sm2-key-bancada)', relampago: 'var(--sm2-key-relampago)', quadrantes: 'var(--sm2-key-quadrantes)',
  brejo: 'var(--sm2-key-brejo)', elo: 'var(--sm2-key-elo)', pena: 'var(--sm2-key-pena)',
};
const ENV_TONE: Record<string, [string, string]> = {
  forest: ['#0d2b27', '#15463a'], shore: ['#0b2a33', '#14495a'], cavern: ['#0a1f22', '#1a3438'],
  garden: ['#10302c', '#1d5246'], workshop: ['#0e2626', '#2a3b33'], observatory: ['#081c22', '#0f3640'],
};
const VIEW_BLOCKS = 1.2;
const ROUND: CSSProperties = { width: 48, height: 48, borderRadius: '50%', border: '2px solid var(--sm2-ink)', background: 'transparent', color: 'var(--sm2-ink)', display: 'grid', placeItems: 'center', padding: 0, cursor: 'pointer' };
const SVG = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;
const H = 200; // altura do bloco em unidades do SVG (arte 1:2)

export function itemLabel(it: JourneyItem, isPt: boolean): string {
  if (it.kind === 'food') return `${it.id} ×${it.qty}`;
  if (it.kind === 'essence') return `${essenceName(it.id, isPt)} ×${it.qty}`;
  const m = MATERIALS.find(x => x.id === it.id);
  return m ? `${m.icon} ${isPt ? m.namePt : m.nameEn} ×${it.qty}` : `${it.id} ×${it.qty}`;
}

export function JourneyScreen({ language, active, delta, petSprite, lastItems, onPause, onResume, onClaim, onEnd, onClose }: {
  language: Language; active: ActiveJourney; delta: number; petSprite?: string; lastItems: JourneyItem[] | null;
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
    if (reached > claimed.current || p >= 1) { if (claimed.current !== reached || p >= 1) { claimed.current = reached; onClaim(); } }
  }, [reached, p >= 1]); // eslint-disable-line react-hooks/exhaustive-deps

  const left = Math.max(0, JOURNEY_MODES[active.mode].focusMin * 60_000 - focusElapsed(active, now));
  const pet = trailAt(spine, p);
  const camY = Math.min(blocks - VIEW_BLOCKS, Math.max(0, pet.y - VIEW_BLOCKS * 0.45));
  const tone = ENV_TONE[active.env] ?? ENV_TONE.forest;
  const Y = (y: number) => (blocks - y) * H;
  const art = JOURNEY_ART[active.env];
  const paused = active.pausedAt !== null;

  const box: CSSProperties = { position: 'fixed', inset: 0, zIndex: 210, background: tone[0], overflow: 'hidden' };
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={isPt ? 'Jornada do foco' : 'Focus journey'} data-journey style={box}>
      <svg data-journey-scene viewBox={`0 ${Y(camY + VIEW_BLOCKS)} 100 ${VIEW_BLOCKS * H}`} preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: paused ? 0.6 : 1 }}>
        <defs><linearGradient id="jt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={tone[1]} /><stop offset="1" stopColor={tone[0]} /></linearGradient></defs>
        {Array.from({ length: blocks }, (_, b) => art
          ? <image key={b} data-journey-block href={art} x={0} y={Y(b + 1)} width={100} height={H} preserveAspectRatio="none" />
          : <g key={b}>
          <rect x={0} y={Y(b + 1)} width={100} height={H} fill="url(#jt)" />
          <rect x={0} y={Y(b + 1)} width={100} height={6} fill="#0a1d1d" />
          <line x1={50} x2={50} y1={Y(b + 1)} y2={Y(b + 1) + 6} stroke="#b8733a" strokeWidth={0.8} />
          {[0.12, 0.88].map(x => <polygon key={x} points={`${x * 100},${Y(b + 0.5) - 6} ${x * 100 + 3},${Y(b + 0.5)} ${x * 100},${Y(b + 0.5) + 6} ${x * 100 - 3},${Y(b + 0.5)}`} fill="#4fe3d6" opacity={0.55} />)}
        </g>)}
        <image data-journey-arrival href={ARRIVAL_ART} x={20} y={Y(blocks)} width={60} height={60} opacity={p >= 1 ? 1 : 0.85} />
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
          ? <image data-journey-pet href={petSprite} x={Math.min(89, Math.max(11, pet.x * 100)) - 11} y={Y(pet.y) - 22} width={22} height={22} style={{ imageRendering: 'pixelated' }} />
          : <circle data-journey-pet cx={pet.x * 100} cy={Y(pet.y) - 6} r={5.5} fill="#e9f5f2" />}
      </svg>

      {lastItems && lastItems.length > 0 && <p role="status" data-journey-toast style={{ ...sm2Text, position: 'absolute', left: 16, right: 16, bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', margin: 0, padding: '8px 12px', borderRadius: 10, background: 'rgba(4,16,18,.85)', color: '#e9f5f2', textAlign: 'center', zIndex: 1 }}>
        {(isPt ? 'Baú aberto: ' : 'Chest opened: ') + lastItems.map(i => itemLabel(i, isPt)).join(' · ')}
      </p>}

      <section data-journey-modal style={{ position: 'absolute', top: 'calc(10px + env(safe-area-inset-top, 0px))', left: '50%', transform: 'translateX(-50%)', width: 'min(236px, calc(100% - 24px))', zIndex: 2, background: 'color-mix(in srgb, var(--sm2-surface) 80%, transparent)', color: 'var(--sm2-ink)', borderRadius: 14, padding: '8px 12px 10px', boxShadow: '0 6px 18px rgba(0,0,0,.35)', display: 'grid', justifyItems: 'center', gap: 6 }}>
        <span data-journey-clock role="timer" aria-label={isPt ? (p >= 1 ? 'Chegou' : paused ? 'Tempo restante, em pausa' : 'Tempo restante') : (p >= 1 ? 'Arrived' : paused ? 'Time left, paused' : 'Time left')} className="sm2-num" style={{ fontFamily: 'var(--sm2-font-display)', fontWeight: 700, fontSize: 44, lineHeight: 1.1, opacity: paused ? 0.7 : 1 }}>{formatClock(left)}</span>
        {active.keys.length > 0 && <span data-journey-keys aria-label={isPt ? 'Chaves desta jornada' : 'Keys for this journey'} style={{ display: 'flex', gap: 6 }}>
          {active.keys.map(k => <KeyGlyph key={k} k={k} size={20} />)}
        </span>}
        <div data-journey-actions style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
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
      </section>
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
