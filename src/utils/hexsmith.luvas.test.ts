import { describe, it, expect } from 'vitest';
import { HEX_STRIKES, HEX_COSTS, hexValuesOf, hexCost, parseHexItem, migrateHexId, sanitizeHexsmith, hexOverrides, hexIdentity, strikeParts, forgeHexItem, type HexForgeState } from './hexsmith';
import { COMBAT_BONUS_CAP } from './combate/bonus';
import type { FighterIdentity } from './fighterIdentity';

const ident: FighterIdentity = {
  basico: { elemento: 'fogo', escola: null, forma: 'ranged' },
  especial: { elemento: 'agua', escola: null, forma: 'ranged', familia: 'direct' },
};

describe('Luvas: 4 ataques (alcance x efeito)', () => {
  it('os 4 tipos existem, custam o mesmo e sao validos', () => {
    expect(hexValuesOf('luvas')).toEqual(['magic', 'ranged-slash', 'melee-slash', 'melee-smash']);
    for (const v of HEX_STRIKES) {
      expect(parseHexItem(`luvas:${v}`)).toEqual({ slot: 'luvas', value: v });
      expect(hexCost(`luvas:${v}`)).toEqual(HEX_COSTS.luvas);
    }
  });
  it('cada tipo da a forma e o acabamento certos no basico (so visual)', () => {
    const esperado = { magic: ['ranged', 'concussao'], 'ranged-slash': ['ranged', 'corte'], 'melee-slash': ['melee', 'corte'], 'melee-smash': ['melee', 'concussao'] } as const;
    for (const v of HEX_STRIKES) {
      expect(strikeParts(v)).toEqual({ forma: esperado[v][0], impacto: esperado[v][1] });
      const hx = hexOverrides({ owned: [`luvas:${v}`], equipped: { luvas: `luvas:${v}` } });
      const out = hexIdentity(ident, hx);
      expect([out.basico.forma, out.basico.impacto]).toEqual([...esperado[v]]);
      expect(out.especial).toEqual(ident.especial); // o especial nao muda
    }
    expect(hexIdentity(ident, {}).basico.impacto).toBeUndefined();
  });
  it('migracao: ranged->magic, melee->melee-slash; idempotente e sem duplicar', () => {
    expect(migrateHexId('luvas:ranged')).toBe('luvas:magic');
    expect(migrateHexId('luvas:melee')).toBe('luvas:melee-slash');
    expect(migrateHexId(migrateHexId('luvas:melee'))).toBe('luvas:melee-slash');
    expect(migrateHexId('garra:fogo')).toBe('garra:fogo');
    const a = sanitizeHexsmith({ owned: ['luvas:ranged', 'luvas:magic', 'luvas:melee'], equipped: { luvas: 'luvas:melee' } });
    expect(a).toEqual({ owned: ['luvas:magic', 'luvas:melee-slash'], equipped: { luvas: 'luvas:melee-slash' } });
    expect(sanitizeHexsmith(a)).toEqual(a);
  });
  it('forjar pelo id antigo entrega o id novo', () => {
    const st: HexForgeState = { foodInventory: {}, gamePoints: 5000, equipment: { owned: [], equipped: {}, fragments: 20 } };
    const n = forgeHexItem(st, 'luvas:ranged');
    expect(n.hexsmith?.owned).toEqual(['luvas:magic']);
  });
  it('teto de 5% intocado e custo so em Bits ganhos', () => {
    expect(COMBAT_BONUS_CAP).toBe(0.05);
    const pobre: HexForgeState = { foodInventory: {}, gamePoints: 100, equipment: { owned: [], equipped: {}, fragments: 20 } };
    expect(forgeHexItem(pobre, 'luvas:magic')).toBe(pobre);
  });
});
