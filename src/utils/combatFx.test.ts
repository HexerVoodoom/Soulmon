import { describe, it, expect } from 'vitest';
import {
  fxElementId, fxFrame, visualElementFor, strikeKindForSchool, VISUAL_ELEMENTS, FX_FALLBACK_ELEMENT,
  SCHOOL_STRIKE_FORM, ELEMENT_STRIKE_FORM, skillStrikeForm, elementStrikeForm, specialLabel, SPECIAL_LABEL,
  STAGE_TIMING, impactMs, totalMs,
} from './combatFx';
import { ATTACK_FX_COUNT } from './attackFxArt';
import classSystem from './soulProfile/ficha/classSystem.data.json';
import pool from './soulProfile/bestiary/pool.json';
import { CLASS_ELEMENT_ORDER } from './soulProfile/types';

describe('inventário da arte de skill por elemento (a base da cena de combate)', () => {
  it('os 17 elementos base têm TODOS os estados que a cena usa (cast, slash, orb, impact, defended, aura)', () => {
    for (const id of VISUAL_ELEMENTS) {
      for (const estado of ['cast', 'slash', 'orb', 'impact', 'defended', 'aura'] as const) {
        expect(fxFrame(id, estado), `${id}:${estado}`).toBeTruthy();
      }
    }
    // E o neutro (o fallback) também.
    for (const estado of ['cast', 'slash', 'orb', 'impact', 'defended', 'aura'] as const) {
      expect(fxFrame(FX_FALLBACK_ELEMENT, estado)).toBeTruthy();
    }
  });

  it('o glob achou a arte inteira: 154 elementos × 6 estados', () => {
    expect(ATTACK_FX_COUNT).toBe(154 * 6);
  });

  it('id sem arte cai no neutro; ids do oráculo sem arte caem no mais próximo', () => {
    expect(fxElementId(undefined)).toBe('neutro');
    expect(fxElementId('')).toBe('neutro');
    expect(fxElementId('elemento-que-nao-existe')).toBe('neutro');
    expect(fxElementId('planta')).toBe('vida');
    expect(fxElementId('industrial')).toBe('aco');
    expect(fxElementId('fogo')).toBe('fogo');
    expect(fxFrame('elemento-que-nao-existe', 'orb')).toBe(fxFrame('neutro', 'orb'));
    // Derivado também tem arte própria (não cai no neutro).
    expect(fxElementId('vapor')).toBe('vapor');
    expect(fxFrame('vapor', 'orb')).not.toBe(fxFrame('neutro', 'orb'));
  });

  it('fogo usa a arte de fogo e água a de água (cada elemento tem a SUA arte)', () => {
    expect(fxFrame('fogo', 'orb')).not.toBe(fxFrame('agua', 'orb'));
    expect(fxFrame('fogo', 'slash')).toMatch(/fx-fogo-slash/);
    expect(fxFrame('agua', 'defended')).toMatch(/fx-agua-defended/);
  });
});

describe('o elemento visual do oponente e a ação de cada escola', () => {
  it('o oponente recebe um elemento determinístico (o servidor não publica elemento)', () => {
    expect(visualElementFor('abc')).toBe(visualElementFor('abc'));
    const ids = Array.from({ length: 300 }, (_, i) => visualElementFor(`jogador-${i}`));
    for (const e of ids) expect(VISUAL_ELEMENTS).toContain(e);
    expect(new Set(ids).size).toBeGreaterThanOrEqual(12); // espalha, não colapsa num elemento
  });

  it('o golpe BÁSICO segue a tabela da escola (R8: combate físico e a mordida da maldição investem; o resto atira)', () => {
    for (const e of ['combate_fisico', 'maldicao'] as const) expect(strikeKindForSchool(e)).toBe('melee');
    for (const e of ['longo_alcance', 'conjuracao', 'benca'] as const) expect(strikeKindForSchool(e)).toBe('ranged');
    expect(strikeKindForSchool(undefined)).toBe('ranged');
  });

  it('R8: nenhuma skill sem kind — toda escola × papel (básica/especial) e todo elemento de inimigo tem forma', () => {
    // PR9b: `evocacao` é escola do class-system (captura), mas não tem skill: a tabela cobre as 5 de skill e SÓ elas.
    const escolas = Object.keys((classSystem as { escolas: Record<string, unknown> }).escolas).filter(e => e !== 'evocacao');
    expect(escolas.length).toBe(5);
    expect(Object.keys(SCHOOL_STRIKE_FORM).sort()).toEqual([...escolas].sort());
    for (const e of escolas) {
      for (const role of ['basica', 'especial'] as const) {
        const f = SCHOOL_STRIKE_FORM[e as keyof typeof SCHOOL_STRIKE_FORM]?.[role];
        expect(['melee', 'ranged'], `${e}/${role}`).toContain(f);
      }
    }
    const elementos = new Set<string>([...CLASS_ELEMENT_ORDER, ...VISUAL_ELEMENTS]);
    for (const c of (pool as { criaturas: Array<{ elementos: string[] }> }).criaturas) c.elementos.forEach(x => elementos.add(x));
    for (const el of elementos) {
      for (const role of ['basica', 'especial'] as const) {
        expect(['melee', 'ranged'], `${el}/${role}`).toContain(ELEMENT_STRIKE_FORM[el]?.[role]);
      }
    }
  });

  it('R8: a forma vem da SKILL (escola/papel ou elemento), sem índice; desconhecido cai à distância', () => {
    expect(skillStrikeForm({ escolaId: 'combate_fisico' }, 'basica')).toBe('melee');
    expect(skillStrikeForm({ escolaId: 'combate_fisico' }, 'especial')).toBe('melee');
    expect(skillStrikeForm({ escolaId: 'conjuracao' }, 'especial')).toBe('ranged');
    expect(skillStrikeForm({ escolaId: 'maldicao' }, 'basica')).toBe('melee');
    expect(skillStrikeForm({ escolaId: 'maldicao' }, 'especial')).toBe('ranged');
    // sem escola (ficha ausente): cai no elemento da skill; sem nada, à distância
    expect(skillStrikeForm({ elementoId: 'marcial' }, 'basica')).toBe('melee');
    expect(skillStrikeForm(undefined, 'basica')).toBe('ranged');
    // determinístico: a mesma skill dá sempre a mesma forma
    const seq = Array.from({ length: 6 }, () => elementStrikeForm('fogo', 'basica'));
    expect(new Set(seq).size).toBe(1);
    expect(elementStrikeForm('fogo', 'basica')).toBe('ranged');
    expect(elementStrikeForm('fogo', 'especial')).toBe('melee');
    expect(elementStrikeForm('planta', 'basica')).toBe(elementStrikeForm('vida', 'basica')); // alias do oráculo
    expect(elementStrikeForm('elemento-que-nao-existe', 'especial')).toBe('ranged');
  });

  it('R8: o rótulo do especial está centralizado (EN e PT)', () => {
    expect(specialLabel(false)).toBe(SPECIAL_LABEL.en);
    expect(specialLabel(true)).toBe(SPECIAL_LABEL.pt);
  });

  it('movimento reduzido: o impacto chega logo (só o flash), sem trajeto', () => {
    for (const k of ['melee', 'ranged', 'special'] as const) {
      expect(impactMs(k, true)).toBeLessThan(impactMs(k, false));
      expect(totalMs(k, true)).toBeLessThanOrEqual(STAGE_TIMING.reduced.total);
    }
  });
});
