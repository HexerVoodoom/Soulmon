import { describe, it, expect } from 'vitest';
import { combatBaseElement, combatSceneBg, combatShield, combatShadow, COMBAT_BG_COUNT, COMBAT_SHIELD_COUNT } from './combatArt';
import { VISUAL_ELEMENTS } from './combatFx';
import { elementIcon, elementIconIds } from './elementIconArt';

describe('combatArt — cenário, escudo e plataforma por elemento (rodada 2, 04/10/2026)', () => {
  it('18 cenários e 18 escudos: um por elemento BASE + o neutro', () => {
    expect(COMBAT_BG_COUNT).toBe(18);
    expect(COMBAT_SHIELD_COUNT).toBe(18);
    for (const el of [...VISUAL_ELEMENTS, 'neutro']) {
      expect(combatSceneBg(el), el).toMatch(new RegExp(String.raw`bg-${el}\.png\) center/cover #[0-9a-f]{6}$`));
      expect(combatShield(el), el).toMatch(new RegExp(String.raw`escudo-${el}\.png$`));
    }
  });
  it('derivado usa o 1º componente; planta → vida; neutro tem arte própria; desconhecido → undefined', () => {
    expect(combatBaseElement('vapor')).toBe('fogo');
    expect(combatBaseElement('planta')).toBe('vida');
    expect(combatBaseElement('flora')).toBeDefined();
    expect(combatSceneBg('neutro')).toMatch(/bg-neutro\.png\) center\/cover #285558$/);
    expect(combatShield('neutro')).toMatch(/escudo-neutro\.png$/);
    expect(combatSceneBg('nao-existe')).toBeUndefined();
    expect(combatShield('nao-existe')).toBeUndefined();
    expect(combatSceneBg(null)).toBeUndefined();
  });
  it('plataforma: escura só sobre o cenário de luz; clara no resto (e sem cenário)', () => {
    expect(combatShadow('luz')).toMatch(/sombra-escura\.png$/);
    expect(combatShadow('fogo')).toMatch(/sombra-clara\.png$/);
    expect(combatShadow(null)).toMatch(/sombra-clara\.png$/);
  });
  it('ícones de elemento: os 17 base passaram a existir (154 = 17 + 136 + neutro)', () => {
    expect(elementIconIds().length).toBe(154);
    for (const el of VISUAL_ELEMENTS) expect(elementIcon(el), el).toBeDefined();
  });
});
