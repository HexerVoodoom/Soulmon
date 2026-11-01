/**
 * Glifo SVG inline do TIPO de slot da Hexsmith (fallback enquanto a arte final não entra em `assets/soulmon/hex`).
 * Ícone pelado (sem caixa): só o traço da peça. `filled` = slot ocupado (traço cheio na cor do valor); vazio = silhueta tracejada.
 */
import type { HexSlot } from '../../utils/hexsmith';

const PATHS: Readonly<Record<HexSlot, string>> = {
  // coroa: três pontas sobre uma faixa
  coroa: 'M5 17 L5 8 L9.5 12 L12 5 L14.5 12 L19 8 L19 17 Z M5 19 L19 19',
  // amuleto: cordão + gema hexagonal
  amuleto: 'M6 3 Q12 11 18 3 M12 10 L15.5 12 L15.5 16 L12 18 L8.5 16 L8.5 12 Z',
  // garra: três lâminas curvas
  garra: 'M6 20 Q5 11 9 4 M11 20 Q11 11 14 4 M16 20 Q17 12 20 7',
  // couraça: peitoral com placa central
  couraca: 'M5 5 L9 4 Q12 6 15 4 L19 5 L18 15 Q12 21 6 15 Z M12 7 L12 17',
  // luvas: mão aberta com punho
  luvas: 'M7 20 L7 11 L7 6 M10 11 L10 4 M13 11 L13 4.5 M16 12 L16 6.5 M7 13 Q6 9 4 10 M7 20 L16 20 L16 12',
};

export function HexSlotGlyph({ slot, size, color, filled = false }: { slot: HexSlot; size: number; color: string; filled?: boolean }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" data-hex-glyph={slot}
      style={{ display: 'block', filter: filled ? `drop-shadow(0 0 4px ${color})` : undefined }}>
      <path d={PATHS[slot]} fill="none" stroke={color} strokeWidth={filled ? 1.8 : 1.3} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={filled ? undefined : '2 1.6'} opacity={filled ? 1 : 0.85} />
    </svg>
  );
}
