/**
 * Arte da HEXSMITH — ponto de entrada da arte final (01/11/2026). A arte é resolvida por `import.meta.glob` (o mesmo padrão de
 * `resolveArt` em `assets/soulmon/areas/index.ts`): assim que o PNG cair nesta pasta com o nome-alvo, a tela passa a usá-lo sozinha;
 * enquanto não existir, `undefined` → a tela cai no glifo SVG inline (`components/hex/HexSlotGlyph.tsx`).
 *
 * Nomes-alvo: `slot-coroa.png`, `slot-amuleto.png`, `slot-garra.png`, `slot-couraca.png`, `slot-luvas.png` (silhueta do slot vazio,
 * PNG com alfa real), `forjar.png` (ícone do botão Forjar) e `mapa-portas.png` (640², a placa de circuito com o hexágono central
 * vazado e as 5 portas; sem ela o mapa fica só com o sprite e as portas).
 *
 * Coroa POR FAMÍLIA (13/11/2026, pedido do dono): `coroa-<familia>.png` (ids de `SPECIAL_FAMILIES`: `coroa-direct.png`,
 * `coroa-dot.png`, `coroa-heal.png`, `coroa-shield.png`, `coroa-atkBuff.png`, `coroa-defDebuff.png`, `coroa-spdBuff.png`), mesmo
 * tamanho e alfa real da `slot-coroa.png`. Sem o arquivo da família, cai na `slot-coroa.png` (a coroa única de hoje). Basta soltar
 * o PNG nesta pasta: nenhuma linha de código muda. Fila da arte: `docs/ASSETS-A-GERAR.md` (Coroas por família).
 */
import type { HexSlot } from '../../../utils/hexsmith';
import type { SpecialFamily } from '../../../utils/combate/specials';

const ARTE = import.meta.glob('./{slot-*,chip-*,coroa-*,forjar,mapa-portas}.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

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

/** A placa do mapa (`mapa-portas.png`), ou `undefined`. */
export const HEX_MAP_ART: string | undefined = art('mapa-portas');

/** Chip de essência da Hexsmith por elemento BASE (`chip-<id>.png`, 128², alfa real), ou `undefined` (= ícone do elemento). */
export const resolveHexChipArt = (elementId: string): string | undefined => art(`chip-${elementId}`);

/** A coroa da FAMÍLIA do especial (`coroa-<familia>.png`); sem ela, a coroa única (`slot-coroa.png`); sem as duas, `undefined` (glifo). */
export const resolveHexCrownArt = (family: SpecialFamily | string): string | undefined => art(`coroa-${family}`) ?? HEX_ART.slotIcon.coroa;
