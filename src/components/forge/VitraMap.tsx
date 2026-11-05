/**
 * O MAPA DO SOULSMITH (Vitra) em TELA CHEIA (05/11/2026, pedido do dono): a arte de celular (852x1846) ocupa a tela de borda a borda; no centro, uma
 * figura HUMANOIDE de vidro quente sendo soprada. Três chakras, em linha vertical, seguram os três equipamentos que a Vitra aprimora; tocar um abre,
 * logo abaixo dele, o balão com as duas opções de aprimoramento (`popover`, montado por `ForgeCard`).
 *
 * Geometria: o PALCO tem a proporção da arte e cobre a tela (cover calculado, centrado: nas telas mais largas corta em cima/embaixo, nas mais
 * estreitas corta os lados; o eixo central, onde estão os chakras, fica sempre). Os chakras ficam em % do PALCO, então acompanham o recorte e
 * continuam EXATAMENTE sobre os anéis. Componente só de LAYOUT: não conhece regra de forja (`utils/forge*.ts`).
 */
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import type { EquipSlot } from '../../utils/equipment';
import { VITRA_MAP_ART } from '../../assets/soulmon/vitra';

/** Centro de cada chakra em % do PALCO (a arte inteira, 852x1846), medido nos anéis de `vitra-mapa.png`; o diâmetro do anel é 18% da largura. */
export const CHAKRA: Readonly<Record<EquipSlot, { x: number; y: number; side: 'below' }>> = {
  nucleo: { x: 50, y: 29.9, side: 'below' },
  carapaca: { x: 50, y: 41.6, side: 'below' },
  rastro: { x: 50, y: 53, side: 'below' },
};

export interface VitraChakra {
  slot: EquipSlot;
  pieceId: string;
  label: string;
  /** Há aprimoramento possível agora: acende um brilho leve no chakra. */
  ready: boolean;
  owned: boolean;
  open: boolean;
  /** O rosto do chakra (a arte do equipamento). */
  face: ReactNode;
  /** O balão ao lado, só quando `open`. */
  popover: ReactNode;
  onToggle: () => void;
}

/** O balão do chakra: abre logo abaixo do anel e, se sair da tela (telas baixas, recorte do palco), é empurrado para dentro com uma folga. */
function Pop({ slot, side, children }: { slot: EquipSlot; side: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.setProperty('--dx', '0px'); el.style.setProperty('--dy', '0px');
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth, vh = window.innerHeight, m = 8;
      const dx = r.left < m ? m - r.left : r.right > vw - m ? vw - m - r.right : 0;
      const dy = r.bottom > vh - m ? vh - m - r.bottom : 0;
      el.style.setProperty('--dx', `${Math.round(dx)}px`); el.style.setProperty('--dy', `${Math.round(dy)}px`);
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  return <div ref={ref} className="sm2-vit-pop" data-side={side} data-vitra-pop={slot}>{children}</div>;
}

export function VitraMap({ chakras, onBackdrop, label, children }: { chakras: readonly VitraChakra[]; onBackdrop: () => void; label: string; children?: ReactNode }) {
  return (
    <div data-vitra-map className="sm2-vit-map" role="group" aria-label={label} onKeyDown={(e) => { if (e.key === "Escape") onBackdrop(); }}>
      <div className="sm2-vit-stage" data-vitra-stage>
        {VITRA_MAP_ART && <img src={VITRA_MAP_ART} alt="" aria-hidden="true" draggable={false} className="sm2-vit-figure" data-vitra-art />}
        {/* toque no fundo fecha o balão aberto (alvo fantasma sob os chakras) */}
        <span aria-hidden="true" className="sm2-vit-backdrop" onClick={onBackdrop} />
        {chakras.map((c) => {
          const at = CHAKRA[c.slot];
          return (
            <div key={c.slot} className="sm2-vit-spot" style={{ left: `${at.x}%`, top: `${at.y}%` }}>
              <button type="button" className="sm2-vit-chakra" data-vitra-chakra={c.slot} data-forge-piece={c.pieceId}
                data-ready={c.ready || undefined} data-owned={c.owned || undefined} data-open={c.open || undefined}
                aria-label={c.label} aria-expanded={c.open} aria-haspopup="dialog" onClick={c.onToggle}>
                {c.face}
              </button>
              {c.open && <Pop slot={c.slot} side={at.side}>{c.popover}</Pop>}
            </div>
          );
        })}
      </div>
      {children}
    </div>
  );
}
