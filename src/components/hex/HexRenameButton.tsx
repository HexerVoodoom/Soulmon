/**
 * Botão hexagonal de RENOMEAR da Hexsmith (11/11/2026): lápis = nome do Soulmon, chama = nome do especial. Usa a arte final
 * (`assets/soulmon/hexsmith`) quando existir; senão desenha um hexágono GENERATIVO no estilo das Portas (aro colorido, miolo
 * turquesa, losangos nas pontas) com um glifo SVG próprio (sem engrenagem). Mesmo tamanho dos hexágonos do mapa.
 */
import { HEXSMITH_RENAME_ART } from '../../assets/soulmon/hexsmith';
import type { HexRenameKind } from '../../utils/hexsmithRename';

const HEX = '50,4 90,27 90,73 50,96 10,73 10,27';
const HEX_IN = '50,16 80,33 80,67 50,84 20,67 20,33';
const COR: Readonly<Record<HexRenameKind, string>> = { pet: '#D96BA8', especial: '#F08A3C' };
/** Traço no viewBox 24, no mesmo peso dos glifos do app. */
const GLIFO: Readonly<Record<HexRenameKind, string>> = {
  // lápis: corpo inclinado, ponta e borracha
  pet: 'M5 19 L6 15 L16 5 L19 8 L9 18 Z M14 7 L17 10 M5 19 L9 18',
  // chama: gota com chama interna
  especial: 'M12 3 Q16 8 16 12.5 A4 4 0 0 1 8 12.5 Q8 10 10 8 Q10.5 10 12 10 Q12 6 12 3 Z',
};

export function HexRenameButton({ kind, label, x, y, onClick }: { kind: HexRenameKind; label: string; x: number; y: number; onClick: () => void }) {
  const art = HEXSMITH_RENAME_ART[kind === 'pet' ? 'lapis' : 'chama'];
  return (
    <button type="button" data-hex-rename={kind} className="sm2-hex-slot" aria-label={label} aria-haspopup="dialog" onClick={onClick}
      style={{ left: `${x}%`, top: `${y}%`, width: 56, height: 56 }}>
      {art ? <img src={art} alt="" aria-hidden="true" width={56} height={56} draggable={false} data-hex-rename-art={kind} />
        : (
          <svg aria-hidden="true" width={56} height={56} viewBox="0 0 100 100" data-hex-rename-generative={kind} style={{ display: 'block' }}>
            <polygon points={HEX} fill="var(--sm2-surface-2, #12302e)" stroke={COR[kind]} strokeWidth="7" strokeLinejoin="round" />
            <polygon points={HEX_IN} fill="none" stroke="#2FD8C8" strokeWidth="3" strokeLinejoin="round" />
            <rect x="46" y="0" width="8" height="8" fill="#2FD8C8" transform="rotate(45 50 4)" />
            <rect x="46" y="92" width="8" height="8" fill="#2FD8C8" transform="rotate(45 50 96)" />
            <g transform="translate(26 26) scale(2)">
              <path d={GLIFO[kind]} fill="none" stroke={COR[kind]} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </svg>
        )}
    </button>
  );
}
