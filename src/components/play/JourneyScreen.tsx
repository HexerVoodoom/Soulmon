/**
 * A JORNADA DO FOCO em tela cheia (§247). Posição = função do tempo de foco do SERVIDOR (`now` corrigido por `delta`); sair,
 * ir para o fundo ou recarregar não muda nada. Desenho em SVG, com arte provisória (gradiente + motivos) até a fila de geração.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
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
  const [mini, setMini] = useState(false);
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
  const path = spine.map((pt, i) => `${i ? 'L' : 'M'}${(pt.x * 100).toFixed(2)},${Y(pt.y).toFixed(2)}`).join(' ');
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
        <path d={path} fill="none" stroke="#0a1d1d" strokeWidth={4.2} strokeLinejoin="round" strokeLinecap="round" />
        <path d={path} fill="none" stroke="#5c8f84" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
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
          ? <image data-journey-pet href={petSprite} x={pet.x * 100 - 6} y={Y(pet.y) - 12} width={12} height={12} style={{ imageRendering: 'pixelated' }} />
          : <circle data-journey-pet cx={pet.x * 100} cy={Y(pet.y) - 4} r={3} fill="#e9f5f2" />}
      </svg>

      {lastItems && lastItems.length > 0 && <p role="status" data-journey-toast style={{ ...sm2Text, position: 'absolute', left: 16, right: 16, bottom: mini ? 72 : 132, margin: 0, padding: '8px 12px', borderRadius: 10, background: 'rgba(4,16,18,.85)', color: '#e9f5f2', textAlign: 'center', zIndex: 1 }}>
        {(isPt ? 'Baú aberto: ' : 'Chest opened: ') + lastItems.map(i => itemLabel(i, isPt)).join(' · ')}
      </p>}

      <section data-journey-modal style={{ position: 'absolute', left: 12, right: 12, bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))', zIndex: 2, background: 'var(--sm2-surface)', color: 'var(--sm2-ink)', borderRadius: 14, padding: mini ? '6px 12px' : 12, boxShadow: '0 6px 18px rgba(0,0,0,.4)', display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" data-journey-clock onClick={() => setMini(m => !m)} aria-expanded={!mini} aria-label={isPt ? 'Recolher ou abrir o relógio' : 'Collapse or expand the timer'} style={{ background: 'none', border: 0, color: 'inherit', padding: 0, minHeight: 44, display: 'flex', alignItems: 'baseline', gap: 8, cursor: 'pointer' }}>
            <span className="sm2-num" style={{ fontFamily: 'var(--sm2-font-display)', fontWeight: 700, fontSize: 'var(--sm2-text-2xl)' }}>{formatClock(left)}</span>
            <span style={{ ...sm2Hint, margin: 0 }}>{p >= 1 ? (isPt ? 'Chegou' : 'Arrived') : paused ? (isPt ? 'Pausa' : 'Paused') : (isPt ? 'Foco' : 'Focus')}</span>
          </button>
          {!mini && <span aria-label={isPt ? 'Chaves desta jornada' : 'Keys for this journey'} style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
            {active.keys.map(k => <KeyGlyph key={k} k={k} size={24} />)}
          </span>}
        </div>
        {!mini && p < 1 && <div style={{ display: 'flex', gap: 8 }}>
          {paused
            ? <button type="button" data-journey-resume onClick={onResume} style={{ ...sm2Button('primary'), flex: 1 }}>{isPt ? 'Continuar' : 'Resume'}</button>
            : active.pauses < JOURNEY_MAX_PAUSES && <button type="button" data-journey-pause onClick={onPause} style={{ ...sm2Button('outline'), flex: 1 }}>{isPt ? 'Pausar' : 'Pause'}</button>}
          {!confirmEnd
            ? <button type="button" data-journey-end onClick={() => setConfirmEnd(true)} style={{ ...sm2Button('quiet'), flex: 1 }}>{isPt ? 'Encerrar' : 'End'}</button>
            : <button type="button" data-journey-end-confirm onClick={onEnd} style={{ ...sm2Button('outline'), flex: 1 }}>{isPt ? 'Encerrar e voltar' : 'End and go back'}</button>}
        </div>}
        {!mini && p < 1 && !paused && active.pauses >= JOURNEY_MAX_PAUSES && <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Daqui até o fim, o Soulmon segue direto.' : 'From here to the end, your Soulmon keeps going.'}</p>}
        {!mini && <button type="button" data-journey-close onClick={onClose} style={{ ...sm2Button('quiet'), minHeight: 44 }}>{isPt ? 'Voltar à Oficina (a jornada continua)' : 'Back to the Workshop (the journey goes on)'}</button>}
      </section>
    </div>,
    document.body,
  );
}

/** Chave com arte quando existe; senão o ícone na cor do token. */
export function KeyGlyph({ k, size, muted }: { k: JourneyKeyId; size: 20 | 24; muted?: boolean }) {
  const src = KEY_ART[k];
  if (src && !muted) return <img src={src} alt="" width={size} height={size} style={{ display: 'block' }} />;
  const color = { color: muted ? 'var(--sm2-muted)' : KEY_COLOR[k] };
  return size === 20 ? <Icon name="lock_open" size={20} tone="inherit" style={color} /> : <Icon name="lock_open" size={24} tone="inherit" style={color} />;
}
