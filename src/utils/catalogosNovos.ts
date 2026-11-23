/**
 * Os catálogos GRANDES de cosméticos fora do chunk de entrada (orçamento de bytes, REGISTRO §498): `cosmeticosNovos` (temas e elementos,
 * 04/11/2026) e `honraDecor` (decoração de Honra, 14–15/11/2026). Este módulo só existe para ser carregado por `import()`
 * (`catalogosNovosLoader.ts`): ele injeta cada peça no MESMO lugar de antes (loja, cenários, molduras, arte de decoração, preços).
 * Idempotente (as injeções ignoram o que já entrou).
 */
import type { ShopItem } from './shop';
import { injetarCatalogosNovos, injetarConcessoes } from './shop';
import { injetarCenariosNovos } from './backgrounds';
import { injetarMolduras, type AvatarFrame } from './frames';
import { injetarPrecosDeDecor } from './decorPrices';
import { injetarArteDeDecor, injetarChamasDeDecor } from './decorArt';
import { COSMETICOS_NOVOS, ARTE_BG_NOVOS, ARTE_DECOR_NOVOS } from './cosmeticosNovos';
import { HONRA_DECOR, ARTE_DECOR_HONRA } from './honraDecor';
import { CRISTAL_FUNDADOR, ARTE_CRISTAL_FUNDADOR, CHAMA_CRISTAL_FUNDADOR } from './cristalFundador';
import { FUNDADOR_FUNDO, FUNDADOR_FUNDO_CENARIO, FUNDADOR_MOLDURA } from './fundadorCatalogo';

export function aplicarCatalogosNovos(): void {
  injetarCatalogosNovos(
    COSMETICOS_NOVOS.filter(c => c.kind !== 'frame').map((c): ShopItem => ({
      id: c.id, kind: c.kind === 'bg' ? 'bg' : 'furniture', icon: c.icon, namePt: c.namePt, nameEn: c.nameEn,
      descPt: c.descPt, descEn: c.descEn, price: c.price,
      ...(c.slot ? { slot: c.slot, fits: c.fits } : {}), ...(c.element ? { element: c.element } : {}),
    })),
    HONRA_DECOR,
  );
  injetarCenariosNovos(COSMETICOS_NOVOS.filter(c => c.kind === 'bg').map(c => ({
    id: c.id, namePt: c.namePt, nameEn: c.nameEn, css: `url(${ARTE_BG_NOVOS[c.id]})`, baseColor: c.baseColor,
  })));
  injetarMolduras(COSMETICOS_NOVOS.filter(c => c.kind === 'frame').map((c): AvatarFrame => ({
    id: c.id, namePt: c.namePt, nameEn: c.nameEn, origin: 'shop', price: c.price, ...(c.element ? { element: c.element } : {}),
    look: { ring: '#8A8F98', line: 'solid', width: 3 },
  })));
  injetarPrecosDeDecor(COSMETICOS_NOVOS.filter(c => c.kind === 'furn').map(c => ({
    id: c.id, old: 100, tier: c.tier!, reason: c.element ? 'peça exclusiva de elemento' : c.slot === 'rug' ? 'textura de chão' : 'peça de tema',
  })));
  injetarArteDeDecor(ARTE_DECOR_NOVOS, ARTE_DECOR_HONRA, ARTE_CRISTAL_FUNDADOR);
  injetarConcessoes([CRISTAL_FUNDADOR, FUNDADOR_FUNDO]);
  injetarCenariosNovos([FUNDADOR_FUNDO_CENARIO]);
  injetarMolduras([FUNDADOR_MOLDURA]);
  injetarChamasDeDecor(CHAMA_CRISTAL_FUNDADOR);
}
