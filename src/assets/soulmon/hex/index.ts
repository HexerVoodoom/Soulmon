/**
 * Arte da HEXSMITH — ponto de entrada da arte final (01/11/2026). Ainda NÃO existe arte própria: tudo é `undefined` e a tela cai no
 * fallback CSS/SVG inline (`components/hex/HexSlotGlyph.tsx`). Quando a arte entrar (fila em `docs/ASSETS-A-GERAR.md`), importe o PNG
 * aqui e preencha a entrada — a tela não muda.
 *
 *  · `slotIcon[slot]`  — ícone do TIPO de slot (silhueta do slot vazio), PNG transparente ~128px.
 *  · `socket`          — o encaixe/nó de circuito atrás do slot (não é caixa de ícone: é parte do traçado do circuito).
 *  · `circuit`         — textura opcional das linhas de circuito hex ao fundo do mapa.
 */
import type { HexSlot } from '../../../utils/hexsmith';

export const HEX_ART: {
  readonly slotIcon: Readonly<Partial<Record<HexSlot, string>>>;
  readonly socket?: string;
  readonly circuit?: string;
} = {
  slotIcon: {},
  socket: undefined,
  circuit: undefined,
};

/** A arte do slot, ou `undefined` (= use o glifo SVG inline). */
export const resolveHexSlotArt = (slot: HexSlot): string | undefined => HEX_ART.slotIcon[slot];
