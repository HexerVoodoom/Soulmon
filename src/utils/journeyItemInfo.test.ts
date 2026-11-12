import { describe, expect, it } from 'vitest';
import { journeyItemInfo, mergeItems, totalQty } from './journeyItemInfo';
import { MATERIAL_IDS } from './buildingQuests';
import { MATERIALS } from './buildingQuestsCopy';
import { materialIconSrc } from './materialIcons';

describe('itens da jornada', () => {
  it('todo material tem emoji de reserva e nome nos dois idiomas, mesmo sem imagem', () => {
    for (const id of MATERIAL_IDS) {
      const pt = journeyItemInfo({ kind: 'material', id, qty: 2 }, true);
      const en = journeyItemInfo({ kind: 'material', id, qty: 2 }, false);
      expect(pt.glyph).toBeTruthy(); expect(pt.name).toBeTruthy(); expect(en.name).toBeTruthy(); expect(pt.qty).toBe(2);
      expect(pt.src).toBe(materialIconSrc(id));
    }
    expect(MATERIALS.length).toBe(MATERIAL_IDS.length);
  });
  it('soma por tipo e id sem mexer na lista original', () => {
    const base = [{ kind: 'material' as const, id: 'moss' as const, qty: 1 }];
    const out = mergeItems(base, [{ kind: 'material', id: 'moss', qty: 2 }, { kind: 'food', id: '🍎', qty: 1 }]);
    expect(out).toEqual([{ kind: 'material', id: 'moss', qty: 3 }, { kind: 'food', id: '🍎', qty: 1 }]);
    expect(base[0].qty).toBe(1);
    expect(totalQty(out)).toBe(4);
  });
});
