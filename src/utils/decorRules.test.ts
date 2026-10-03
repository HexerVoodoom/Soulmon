import { describe, it, expect } from 'vitest';
import { DECOR_MAX_TOTAL, decorBlockReason, decorReasonText, decorRuleText, decorFitLabel } from './decorRules';
import { SLOT_ORDER } from './petStage';
import { PET_BACKGROUNDS } from './backgrounds';
import { ALL_SHOP_ITEMS } from './shop';

describe('decorRules — a regra real da decoração (D2, 02/10/2026)', () => {
  it('o limite é um item por espaço: o total é o número de espaços do palco', () => {
    expect(DECOR_MAX_TOTAL).toBe(SLOT_ORDER.length);
    expect(DECOR_MAX_TOTAL).toBe(5);
  });

  it('sem cenário equipado, nada aparece', () => {
    expect(decorBlockReason({ slot: 'rug', fits: 'any' }, null)).toBe('no-scene');
  });

  it('cenário sem chão (void) não recebe nada', () => {
    const voids = Object.values(PET_BACKGROUNDS).filter(b => b.setting === 'void');
    for (const bg of voids) expect(decorBlockReason({ slot: 'rug', fits: 'any' }, bg)).toBe('void-scene');
  });

  it('cenário de céu aberto não tem onde pendurar', () => {
    const semParede = Object.values(PET_BACKGROUNDS).find(b => b.setting !== 'void' && !b.slots.includes('wall'))!;
    expect(decorBlockReason({ slot: 'wall', fits: 'any' }, semParede)).toBe('no-slot');
  });

  it('interior x aberto', () => {
    const quarto = PET_BACKGROUNDS['bg-room'];
    const noite = PET_BACKGROUNDS['bg-night'];
    expect(decorBlockReason({ slot: 'floor-left', fits: 'indoor' }, quarto)).toBeNull();
    expect(decorBlockReason({ slot: 'floor-left', fits: 'indoor' }, noite)).toBe('indoor-only');
    expect(decorBlockReason({ slot: 'floor-left', fits: 'outdoor' }, quarto)).toBe('outdoor-only');
    expect(decorBlockReason({ slot: 'floor-left', fits: 'any' }, quarto)).toBeNull();
    expect(decorBlockReason({ slot: 'floor-left', fits: 'any' }, noite)).toBeNull();
  });

  it('peça "any" cabe em todo cenário que tem o espaço dela (a regra de arte não é mais larga que isso)', () => {
    for (const item of ALL_SHOP_ITEMS.filter(i => i.kind === 'furniture' && i.fits === 'any' && i.slot)) {
      for (const bg of Object.values(PET_BACKGROUNDS)) {
        const r = decorBlockReason(item, bg);
        if (bg.setting === 'void') expect(r).toBe('void-scene');
        else if (!bg.slots.includes(item.slot!)) expect(r).toBe('no-slot');
        else expect(r).toBeNull();
      }
    }
  });

  it('todo motivo tem texto nos dois idiomas, e a linha de regra cita o limite', () => {
    for (const r of ['no-scene', 'void-scene', 'no-slot', 'indoor-only', 'outdoor-only'] as const) {
      expect(decorReasonText(r, true).length).toBeGreaterThan(10);
      expect(decorReasonText(r, false).length).toBeGreaterThan(10);
    }
    expect(decorRuleText(true).limit).toContain(String(DECOR_MAX_TOTAL));
    expect(decorRuleText(false).limit).toContain(String(DECOR_MAX_TOTAL));
  });
});

describe('decorFitLabel — a pílula interno/externo/qualquer (I6, 02/10/2026)', () => {
  it('traduz o `fits` da peça, nos dois idiomas; ausente = qualquer', () => {
    expect(decorFitLabel('indoor', true)).toEqual({ fit: 'indoor', text: 'Interno' });
    expect(decorFitLabel('outdoor', true)).toEqual({ fit: 'outdoor', text: 'Externo' });
    expect(decorFitLabel('any', true)).toEqual({ fit: 'any', text: 'Qualquer' });
    expect(decorFitLabel(undefined, false)).toEqual({ fit: 'any', text: 'Any' });
    expect(decorFitLabel('indoor', false).text).toBe('Indoor');
    expect(decorFitLabel('outdoor', false).text).toBe('Outdoor');
  });
});
