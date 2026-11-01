/**
 * Arte da HEXSMITH — ponto de entrada da arte final (01/11/2026). A arte é resolvida por `import.meta.glob` (o mesmo padrão de
 * `resolveArt` em `assets/soulmon/areas/index.ts`): assim que o PNG cair nesta pasta com o nome-alvo, a tela passa a usá-lo sozinha;
 * enquanto não existir, `undefined` → a tela cai no glifo SVG inline (`components/hex/HexSlotGlyph.tsx`).
 *
 * Nomes-alvo: `slot-coroa.png`, `slot-amuleto.png`, `slot-garra.png`, `slot-couraca.png`, `slot-luvas.png` (silhueta do slot vazio,
 * PNG com alfa real) e `forjar.png` (ícone do botão Forjar).
 */
import type { HexSlot } from '../../../utils/hexsmith';

const ARTE = import.meta.glob('./{slot-*,forjar}.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

const art = (nome: string): string | undefined => ARTE[`./${nome}.png`];

export const HEX_ART: {
  readonly slotIcon: Readonly<Partial<Record<HexSlot, string>>>;
  readonly forge?: string;
} = {
  slotIcon: {
    coroa: art('slot-coroa'),
    amuleto: art('slot-amuleto'),
    garra: art('slot-garra'),
    couraca: art('slot-couraca'),
    luvas: art('slot-luvas'),
  },
  forge: art('forjar'),
};

/** A arte do slot, ou `undefined` (= use o glifo SVG inline). */
export const resolveHexSlotArt = (slot: HexSlot): string | undefined => HEX_ART.slotIcon[slot];
