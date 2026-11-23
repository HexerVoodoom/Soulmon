import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { SHOP_ITEMS, TOURNAMENT_ITEMS, ALL_SHOP_ITEMS } from './shop';
import { PET_BACKGROUNDS } from './backgrounds';
import { FRAMES, FRAME_IDS } from './frames';
import { DECOR_ART } from './decorArt';
import { DECOR_PRICE_TABLE } from './decorPrices';
import { COSMETICOS_NOVOS } from './cosmeticosNovos';
import { HONRA_DECOR } from './honraDecor';
import { aplicarCatalogosNovos } from './catalogosNovos';
import { carregarCatalogosNovos } from './catalogosNovosLoader';

describe('catálogos novos injetados (REGISTRO §498)', () => {
  it('cada peça de cosmético e de Honra está na loja, no mesmo lugar de antes', () => {
    const novos = COSMETICOS_NOVOS.filter(c => c.kind !== 'frame').map(c => c.id);
    const ids = SHOP_ITEMS.map(i => i.id);
    for (const id of novos) expect(ids).toContain(id);
    expect(ids.slice(-novos.length)).toEqual(novos); // fim de SHOP_ITEMS, como antes
    const honra = HONRA_DECOR.map(i => i.id);
    expect(TOURNAMENT_ITEMS.map(i => i.id).slice(-honra.length)).toEqual(honra);
    for (const i of [...SHOP_ITEMS, ...TOURNAMENT_ITEMS]) expect(ALL_SHOP_ITEMS).toContain(i);
  });
  it('cenários, molduras, preços e arte de decoração entram', () => {
    for (const c of COSMETICOS_NOVOS) {
      if (c.kind === 'bg') expect(PET_BACKGROUNDS[c.id]?.css).toMatch(/^url\(/);
      if (c.kind === 'frame') { expect(FRAME_IDS.has(c.id)).toBe(true); expect(FRAMES.some(f => f.id === c.id)).toBe(true); }
      if (c.kind === 'furn') { expect(DECOR_ART[c.id]).toBeTruthy(); expect(DECOR_PRICE_TABLE.some(r => r.id === c.id)).toBe(true); }
    }
    for (const h of HONRA_DECOR) expect(DECOR_ART[h.id]).toBeTruthy();
  });
  it('é idempotente: reaplicar e recarregar não duplica nada', async () => {
    const antes = [SHOP_ITEMS.length, TOURNAMENT_ITEMS.length, ALL_SHOP_ITEMS.length, FRAMES.length, DECOR_PRICE_TABLE.length];
    aplicarCatalogosNovos();
    await carregarCatalogosNovos();
    expect([SHOP_ITEMS.length, TOURNAMENT_ITEMS.length, ALL_SHOP_ITEMS.length, FRAMES.length, DECOR_PRICE_TABLE.length]).toEqual(antes);
    expect(new Set(ALL_SHOP_ITEMS.map(i => i.id)).size).toBe(ALL_SHOP_ITEMS.length);
  });
  it('a entrada NÃO importa os catálogos grandes de forma estática (só o chunk lazy)', () => {
    for (const f of ['shop', 'backgrounds', 'frames', 'decorArt', 'decorPrices']) {
      const src = readFileSync(`src/utils/${f}.ts`, 'utf8');
      expect(src, f).not.toMatch(/from '\.\/(cosmeticosNovos|honraDecor)'/);
    }
    expect(readFileSync('src/main.tsx', 'utf8')).toContain('carregarCatalogosNovos');
  });
});
