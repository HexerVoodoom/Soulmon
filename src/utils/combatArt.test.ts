import { describe, it, expect } from 'vitest';
import { combatBaseElement, combatSceneBg, combatShield, combatGlowColor, combatGlowPair, COMBAT_BG_COUNT, COMBAT_SHIELD_COUNT } from './combatArt';
import { VISUAL_ELEMENTS } from './combatFx';
import { elementIcon, elementIconIds } from './elementIconArt';

describe('combatArt — cenário, escudo e plataforma por elemento (rodada 2, 04/10/2026)', () => {
  // 30/10/2026: fada/industrial/planta ganharam cenário base próprio (21 cenários); os escudos deles ainda faltam (18).
  it('21 cenários (todo elemento BASE + o neutro) e 18 escudos', () => {
    expect(COMBAT_BG_COUNT).toBe(21);
    expect(COMBAT_SHIELD_COUNT).toBe(18);
    for (const el of [...VISUAL_ELEMENTS, 'neutro']) {
      expect(combatSceneBg(el), el).toMatch(new RegExp(String.raw`bg-${el}\.png\) center/cover #[0-9a-f]{6}$`));
    }
    for (const el of [...VISUAL_ELEMENTS.filter(e => e !== 'planta' && e !== 'industrial' && e !== 'fada'), 'neutro']) {
      expect(combatShield(el), el).toMatch(new RegExp(String.raw`escudo-${el}\.png$`));
    }
  });
  it('derivado usa o 1º componente; planta/industrial nunca viram vida/marcial; neutro tem arte própria; desconhecido → undefined', () => {
    expect(combatBaseElement('vapor')).toBe('fogo');
    expect(combatBaseElement('planta')).toBe('planta'); // cenário base próprio desde 30/10/2026; nunca 'vida'
    expect(combatSceneBg('planta')).toMatch(/bg-planta\.png/);
    expect(combatSceneBg('industrial')).toMatch(/bg-industrial\.png/);
    expect(combatShield('planta')).toBeUndefined(); // cai no `defended` próprio do FX
    expect(combatBaseElement('flora')).toBeDefined();
    expect(combatSceneBg('neutro')).toMatch(/bg-neutro\.png\) center\/cover #285558$/);
    expect(combatShield('neutro')).toMatch(/escudo-neutro\.png$/);
    expect(combatSceneBg('nao-existe')).toBeUndefined();
    expect(combatShield('nao-existe')).toBeUndefined();
    expect(combatSceneBg(null)).toBeUndefined();
  });
  it('brilho do especial: cor do elemento (hex), misto sem assinatura usa o 1º componente, desconhecido = undefined', () => {
    const c = (id: string | null) => combatGlowColor(id);
    expect(c('fogo')).toMatch(/^#[0-9a-f]{6}$/);
    expect(c('fogo')).not.toBe(c('sombra'));
    expect(c('aco_voltaico')).toMatch(/^#[0-9a-f]{6}$/);
    expect(c('nao-existe')).toBeUndefined();
    expect(c(null)).toBeUndefined();
    expect(combatGlowPair('fogo')).toEqual([c('fogo'), c('fogo')]);
    expect(combatGlowPair('vapor')).toEqual([c('fogo'), c('agua')]);
  });
  it('ícones de elemento: os 17 base passaram a existir (230 = 17 + 136 + neutro)', () => {
    expect(elementIconIds().length).toBe(230);
    for (const el of VISUAL_ELEMENTS) expect(elementIcon(el), el).toBeDefined();
  });
});
