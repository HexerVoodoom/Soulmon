/**
 * O MAPA DO SOULSMITH (Vitra), no mesmo esquema da Hexsmith (04/11/2026, pedido do dono): no centro, uma figura HUMANOIDE de vidro quente
 * sendo soprada, ainda pastosa — preto no miolo, ganhando luz e cor para as bordas. Três pontos de chakra, em linha vertical, seguram os três equipamentos que a
 * Vitra aprimora; tocar um abre, ao lado dele, o balão com as duas opções de aprimoramento (`popover`, montado por `ForgeCard`).
 *
 * Arte: `assets/soulmon/vitra` (`vitra-mapa.png`, glob). Sem o arquivo, a figura é desenhada aqui em SVG (fallback). Componente só de
 * LAYOUT: não conhece regra nenhuma de forja; quem decide tudo é `ForgeCard` (`utils/forge*.ts`).
 */
import type { ReactNode } from 'react';
import type { EquipSlot } from '../../utils/equipment';
import { VITRA_MAP_ART } from '../../assets/soulmon/vitra';

/** Centro de cada chakra em % da placa quadrada, na vertical do eixo da figura (05/11/2026, pedido do dono), medido nos anéis de `vitra-mapa.png`. */
export const CHAKRA: Readonly<Record<EquipSlot, { x: number; y: number; side: 'below' | 'right' | 'left' }>> = {
  nucleo: { x: 50, y: 23.4, side: 'below' },
  carapaca: { x: 50, y: 37.9, side: 'below' },
  rastro: { x: 50, y: 50.1, side: 'below' },
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

/** A figura de vidro soprado (SVG) — usada enquanto não há `vitra-mapa.png`. Preto no miolo, brasa/magenta/ciano nas bordas. */
function GlassFigure() {
  return (
    <svg className="sm2-vit-figure" viewBox="0 0 200 200" aria-hidden="true" focusable="false" data-vitra-fallback>
      <defs>
        <radialGradient id="vit-bg" cx="50%" cy="50%" r="70%">
          <stop offset="0" stopColor="#000" />
          <stop offset=".38" stopColor="#06171A" />
          <stop offset=".72" stopColor="#0E4A52" />
          <stop offset="1" stopColor="#E8742A" />
        </radialGradient>
        <radialGradient id="vit-body" cx="50%" cy="52%" r="62%">
          <stop offset="0" stopColor="#000" />
          <stop offset=".5" stopColor="#14090A" />
          <stop offset=".82" stopColor="#B23A2E" />
          <stop offset="1" stopColor="#FFB04A" />
        </radialGradient>
        <filter id="vit-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      <rect width="200" height="200" fill="url(#vit-bg)" />
      {/* a cana de sopro, cobre, saindo da boca para o alto */}
      <path d="M100 52 L100 4" stroke="#C8965A" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="100" cy="6" rx="6" ry="2.5" fill="#C8965A" />
      <g filter="url(#vit-glow)" opacity=".7" fill="#FF8A3D">
        <circle cx="100" cy="64" r="17" /><rect x="76" y="82" width="48" height="58" rx="22" /><rect x="52" y="86" width="20" height="46" rx="10" /><rect x="128" y="86" width="20" height="46" rx="10" /><rect x="82" y="136" width="15" height="50" rx="7" /><rect x="103" y="136" width="15" height="50" rx="7" />
      </g>
      <g fill="url(#vit-body)" stroke="#FFC070" strokeWidth=".8">
        <circle cx="100" cy="64" r="15" />
        <rect x="78" y="80" width="44" height="56" rx="20" />
        <rect x="54" y="84" width="18" height="44" rx="9" />
        <rect x="128" y="84" width="18" height="44" rx="9" />
        <rect x="83" y="134" width="14" height="48" rx="7" />
        <rect x="103" y="134" width="14" height="48" rx="7" />
      </g>
      {/* bolhas e fios do vidro pastoso */}
      <g fill="none" stroke="#7CE8E0" strokeWidth=".7" opacity=".6"><circle cx="92" cy="58" r="3" /><circle cx="108" cy="70" r="2" /><path d="M70 120 q-6 14 -2 28" /><path d="M130 120 q6 14 2 28" /></g>
    </svg>
  );
}

export function VitraMap({ chakras, onBackdrop, label }: { chakras: readonly VitraChakra[]; onBackdrop: () => void; label: string }) {
  return (
    <div data-vitra-map className="sm2-vit-map" role="group" aria-label={label} onKeyDown={(e) => { if (e.key === "Escape") onBackdrop(); }}>
      {VITRA_MAP_ART
        ? <img src={VITRA_MAP_ART} alt="" aria-hidden="true" draggable={false} className="sm2-vit-figure" data-vitra-art />
        : <GlassFigure />}
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
            {c.open && <div className="sm2-vit-pop" data-side={at.side} data-vitra-pop={c.slot}>{c.popover}</div>}
          </div>
        );
      })}
    </div>
  );
}
