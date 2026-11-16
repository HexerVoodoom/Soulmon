import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ModalSheet, sm2Button, sm2Text } from '../form/FormKit';
import { ElementIcon, elName } from '../ElementBaseSlots';
import {
  RIFT_MAP_HEIGHT, RIFT_MAP_TILE_RATIO, riftCurrentLayer, riftMapNode, riftNodeState, riftRewindRefusal, riftScrollTopFor, riftSegmentPath,
  riftSegmentReached, riftVisibleRange, type RiftMapNode, type RiftMapSave,
} from '../../utils/riftMap';
import { RIFT_SET_COUNT, riftSetOfLayer } from '../../utils/riftSets';
import { riftMapCopy } from '../../utils/riftMapCopy';
import type { Language } from '../../utils/i18n';

/**
 * O MAPA DE ANDARES DO RIFT (REGISTRO §462): um nó por conjunto (2 andares), caminho tracejado sinuoso, scroll vertical VIRTUALIZADO
 * (só os nós da janela existem no DOM; 269 no total). Os dados e a regra de "voltar" são de `utils/riftMap.ts`; aqui só a tela.
 * Fundo: o tile do prédio do Endless Rift repetido (`assets/soulmon/rift/mapa-tile.*`); sem o arquivo, um gradiente em CSS (tolerante).
 * Modais (toque do jogador, fora da fila de avisos — `docs/FILA-DE-MODAIS.md` §1: o que nasce de gesto passa): "Voltar para este nó?" e "Sem volta".
 */
const tiles = import.meta.glob('../../assets/soulmon/rift/mapa-tile.{webp,png}', { eager: true, import: 'default' }) as Record<string, string>;
const TILE_URL: string | undefined = Object.values(tiles)[0];

/** Fundo de reserva (sem o tile): pedra escura com veios turquesa, repetível na vertical. */
const FALLBACK_BG = 'repeating-linear-gradient(180deg, rgba(20,60,66,.5) 0 2px, transparent 2px 160px), linear-gradient(180deg, #14282c 0%, #0e1c20 100%)';
const NODE = 56;

export interface RiftMapProps {
  language: Language;
  save: RiftMapSave;
  /** O sprite do Soulmon do jogador (a mesma fonte da Home). */
  sprite?: string | null;
  /** Confirmou o "Sem volta": o dono do save aplica `rewindToSet`. */
  onRewind: (index: number) => void;
  onClose: () => void;
}

export function RiftMap({ language, save, sprite, onRewind, onClose }: RiftMapProps) {
  const isPt = language === 'pt-BR';
  const t = riftMapCopy(isPt);
  const scroller = useRef<HTMLDivElement>(null);
  const currentIdx = riftSetOfLayer(riftCurrentLayer(save)).index;
  const openAt = useRef(currentIdx);
  const [view, setView] = useState(() => ({ w: 360, h: 640, top: riftScrollTopFor(currentIdx, 640) }));
  const [note, setNote] = useState<string | null>(null);
  const [ask, setAsk] = useState<number | null>(null);
  const [sure, setSure] = useState<number | null>(null);

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setView(v => {
      const w = el.clientWidth || v.w, h = el.clientHeight || v.h, top = el.scrollTop;
      return v.w === w && v.h === h && v.top === top ? v : { w, h, top };
    });
  }, []);
  // começa centrado no nó atual (só na abertura: depois, o jogador manda no scroll)
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = riftScrollTopFor(openAt.current, el.clientHeight || 640);
    measure();
  }, [measure]);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; measure(); }); };
    el.addEventListener('scroll', onScroll, { passive: true });
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onScroll);
    ro?.observe(el);
    return () => { el.removeEventListener('scroll', onScroll); ro?.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [measure]);
  useEffect(() => {
    if (!note) return;
    const id = window.setTimeout(() => setNote(null), 4200);
    return () => window.clearTimeout(id);
  }, [note]);

  const { from, to } = riftVisibleRange(view.top, view.h);
  const nodes = useMemo(() => {
    const out: RiftMapNode[] = [];
    for (let i = from; i <= to; i++) out.push(riftMapNode(i, save));
    return out;
  }, [from, to, save]);
  const lastReached = useMemo(() => {
    let last = currentIdx;
    for (let i = RIFT_SET_COUNT - 1; i > last; i--) if (riftNodeState(i, save) !== 'locked') { last = i; break; }
    return last;
  }, [save, currentIdx]);
  const grayTop = riftMapNode(lastReached, save).y + 70;

  const tap = (n: RiftMapNode) => {
    if (n.state === 'locked') { setNote(t.lockedNote); return; }
    if (n.state === 'current') { setNote(t.hereNote); return; }
    if (riftRewindRefusal(save, n.index) === 'busy') { setNote(t.busyNote); return; }
    setAsk(n.index);
  };
  const askNode = ask === null ? null : riftMapNode(ask, save);
  const sureNode = sure === null ? null : riftMapNode(sure, save);
  const tileH = view.w * RIFT_MAP_TILE_RATIO;

  return (
    <div data-rift-map style={{ position: 'absolute', inset: 0, zIndex: 6000, display: 'flex', flexDirection: 'column', background: '#0e1c20', color: '#e6f4f1' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', minHeight: 52, background: 'rgba(8,18,20,.92)', borderBottom: '1px solid rgba(80,200,190,.25)' }}>
        <button type="button" data-rift-map-close onClick={onClose} aria-label={t.back} style={{ ...sm2Button('outline'), minHeight: 44, minWidth: 44, padding: '0 12px' }}>←</button>
        <h2 style={{ margin: 0, fontSize: 'var(--sm2-text-lg, 18px)', fontWeight: 700 }}>{t.title}</h2>
      </header>
      <style>{`[data-rift-node] button:focus-visible{outline:3px solid #fff;outline-offset:4px}@keyframes rift-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}@media (prefers-reduced-motion:no-preference){[data-rift-node][data-state="current"] button{animation:rift-pulse 2.4s ease-in-out infinite}}`}</style>
      <div ref={scroller} data-rift-map-scroll style={{ position: 'relative', flex: 1, overflowY: 'auto', overflowX: 'hidden', overscrollBehavior: 'contain' }}>
        <div data-rift-map-canvas style={{
          position: 'relative', height: RIFT_MAP_HEIGHT, width: '100%',
          background: TILE_URL ? `url(${TILE_URL}) 0 0 / 100% ${tileH}px repeat-y, ${FALLBACK_BG}` : FALLBACK_BG,
        }}>
          {/* o mapa que ainda não foi percorrido fica CINZA (véu abaixo do último nó alcançado) */}
          <div aria-hidden="true" data-rift-map-gray style={{ position: 'absolute', left: 0, right: 0, top: grayTop, bottom: 0, background: 'rgba(96,100,106,.6)', pointerEvents: 'none' }} />
          <svg aria-hidden="true" width={view.w} height={RIFT_MAP_HEIGHT} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
            {nodes.map(n => {
              const d = riftSegmentPath(n.index, view.w);
              if (!d) return null;
              const reached = riftSegmentReached(n.index, save);
              return <g key={n.index}><path d={d} fill="none" strokeWidth={8} strokeLinecap="round" strokeDasharray="2 12" stroke="rgba(4,10,12,.55)" /><path d={d} data-rift-seg={reached ? 'on' : 'off'} fill="none" strokeWidth={4} strokeLinecap="round" strokeDasharray="2 12"
                stroke={reached ? '#4fd8c8' : '#8c9298'} opacity={reached ? 0.95 : 0.7} /></g>;
            })}
          </svg>
          {nodes.map(n => {
            const labelLeft = n.x > 0.5;
            const el = elName(n.element, isPt);
            const locked = n.state === 'locked';
            const current = n.state === 'current';
            return (
              <div key={n.index} data-rift-node={n.index} data-state={n.state} style={{ position: 'absolute', left: n.x * view.w - NODE / 2, top: n.y - NODE / 2, width: NODE, height: NODE }}>
                <button type="button" aria-current={current ? 'step' : undefined} onClick={() => tap(n)} aria-label={t.nodeAria(n.label, el, n.state)} style={{
                  width: NODE, height: NODE, borderRadius: '50%', padding: 0, cursor: 'pointer', display: 'grid', placeItems: 'center',
                  background: locked ? '#050607' : 'radial-gradient(circle at 35% 30%, #1d5a5c, #0b2a2d)',
                  border: `3px solid ${locked ? '#3a3f44' : current ? '#ffd27a' : '#4fd8c8'}`,
                  boxShadow: `0 0 0 8px rgba(6,14,16,.5), 0 0 22px 10px rgba(6,14,16,.45), ${current ? '0 0 0 4px rgba(255,210,122,.28), 0 0 18px rgba(79,216,200,.6)' : locked ? '0 0 0 0 transparent' : '0 0 10px rgba(79,216,200,.35)'}`,
                  color: '#9aa1a8', fontSize: 'var(--sm2-text-lg, 22px)', fontWeight: 800,
                }}>
                  {locked ? <span aria-hidden="true">?</span> : <ElementIcon id={n.element} size={32} />}
                </button>
                <span data-rift-node-label className="sm2-num" aria-hidden="true" onClick={() => tap(n)} style={{
                  position: 'absolute', top: '50%', transform: 'translateY(-50%)', [labelLeft ? 'right' : 'left']: NODE + 8, whiteSpace: 'nowrap',
                  fontSize: 'var(--sm2-text-sm, 14px)', fontWeight: 700, color: locked ? '#c3c8cd' : '#e6f4f1', textShadow: '0 1px 3px rgba(0,0,0,.9)', cursor: 'pointer', padding: '1px 7px', borderRadius: 999, background: 'rgba(6,14,16,.55)',
                }}>{n.label}</span>
                {current && sprite && (
                  <img data-rift-sprite src={sprite} alt={t.you} width={52} height={52} draggable={false} style={{
                    position: 'absolute', top: '50%', transform: 'translateY(-60%)', [labelLeft ? 'left' : 'right']: NODE + 2, width: 52, height: 52, filter: 'drop-shadow(0 0 4px rgba(6,14,16,.95)) drop-shadow(0 2px 3px rgba(6,14,16,.9))', objectFit: 'contain', imageRendering: 'pixelated', pointerEvents: 'none',
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
      {note && <p role="status" data-rift-map-note style={{ ...sm2Text, position: 'absolute', left: 16, right: 16, bottom: 16, margin: 0, padding: '10px 14px', borderRadius: 12, background: 'rgba(8,18,20,.95)', border: '1px solid rgba(80,200,190,.35)', color: '#e6f4f1', textAlign: 'center' }}>{note}</p>}
      <ModalSheet open={askNode !== null} onClose={() => setAsk(null)} language={language} title={t.askTitle} maxWidth={380}
        footer={askNode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <button type="button" data-rift-ask-yes onClick={() => { setSure(askNode.index); setAsk(null); }} style={{ ...sm2Button('primary'), width: '100%' }}>{t.askYes}</button>
            <button type="button" data-rift-ask-no onClick={() => setAsk(null)} style={{ ...sm2Button('outline'), width: '100%' }}>{t.askNo}</button>
          </div>
        )}>
        {askNode && <p style={{ ...sm2Text, margin: 0 }}>{t.askBody(askNode.label, elName(askNode.element, isPt))}</p>}
      </ModalSheet>
      <ModalSheet open={sureNode !== null} onClose={() => setSure(null)} language={language} title={t.sureTitle} maxWidth={380}
        footer={sureNode && (
          <div className="sm2-conta-two">
            <button type="button" data-rift-sure-no onClick={() => setSure(null)} style={sm2Button('outline')}>{t.sureNo}</button>
            <button type="button" data-rift-sure-yes onClick={() => { onRewind(sureNode.index); setSure(null); setNote(t.doneNote(sureNode.floors[0])); }} style={sm2Button('primary')}>{t.sureYes}</button>
          </div>
        )}>
        <p style={{ ...sm2Text, margin: 0 }}>{t.sureBody}</p>
      </ModalSheet>
    </div>
  );
}
