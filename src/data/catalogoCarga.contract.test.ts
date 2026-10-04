import { describe, it, expect } from 'vitest';
import { ACTIVITY_CATALOG } from './activityCatalog';
import { CATALOG_OPT_IN_ONLY_IDS, catalogIfLoaded, loadCatalog } from './catalogoCarga';

describe('catalogoCarga — a regra optInOnly síncrona não pode derivar do catálogo', () => {
  it('CATALOG_OPT_IN_ONLY_IDS é EXATAMENTE o conjunto de itens com optInOnly: true', () => {
    const doCatalogo = ACTIVITY_CATALOG.filter(i => i.optInOnly === true).map(i => i.id).sort();
    expect([...CATALOG_OPT_IN_ONLY_IDS].sort()).toEqual(doCatalogo);
    expect(doCatalogo.length).toBeGreaterThan(0);
  });

  it('loadCatalog() carrega o índice por id uma vez e catalogIfLoaded() passa a devolvê-lo', async () => {
    const idx = await loadCatalog();
    expect(Object.keys(idx).length).toBe(ACTIVITY_CATALOG.length);
    expect(catalogIfLoaded()).toBe(idx);
    expect(await loadCatalog()).toBe(idx);
  });
});
