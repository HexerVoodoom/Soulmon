import { describe, expect, it } from 'vitest';
import { DERIVED_ELEMENT_PAIRS } from '../soulProfile/derivedElements';
import { SPECIAL_FAMILIES } from './specials';
import { efeitoDoEspecial, efeitoVisivel } from './elementEffects';
import { STATUS_FX, emptyStatusBoard, withRealFx } from '../combatFx';

describe('§226: efeito pelo elemento do especial', () => {
  it('especial direto nunca tem efeito, em nenhum elemento', () => {
    for (const d of DERIVED_ELEMENT_PAIRS) expect(efeitoDoEspecial('direct', d.id)).toBeNull();
    expect(efeitoDoEspecial('direct', 'fogo')).toBeNull();
  });
  it('a tabela do dono', () => {
    expect(efeitoDoEspecial('dot', 'fogo')).toBe('queimadura');
    expect(efeitoDoEspecial('dot', 'vileza')).toBe('veneno');
    for (const e of ['vileza', 'sombra', 'morte']) expect(efeitoDoEspecial('defDebuff', e)).toBe('maldicao');
    expect(efeitoDoEspecial('shield', 'terra')).toBe('defesaTerra');
    expect(efeitoDoEspecial('atkBuff', 'agua')).toBe('ataqueMagico');
    expect(efeitoDoEspecial('heal', 'vida')).toBe('curaGrande');
    expect(efeitoDoEspecial('spdBuff', 'ar')).toBe('velocidade');
    expect(efeitoDoEspecial('defDebuff', 'ar')).toBe('lentidao');
    expect(efeitoDoEspecial('defDebuff', 'som')).toBe('silencio');
  });
  it('família sem par no elemento fica sem efeito próprio', () => {
    expect(efeitoDoEspecial('shield', 'fogo')).toBeNull();
    expect(efeitoDoEspecial('dot', 'marcial')).toBeNull();
    expect(efeitoDoEspecial(null, 'fogo')).toBeNull();
    expect(efeitoDoEspecial('dot', null)).toBeNull();
  });
  it('derivado herda dos componentes, com as exceções do nome', () => {
    expect(efeitoDoEspecial('dot', 'lava')).toBe('queimadura');
    expect(efeitoDoEspecial('dot', 'veneno')).toBe('veneno');
    expect(efeitoDoEspecial('dot', 'acido')).toBe('veneno');
  });
  it('todo derivado resolve sem erro em toda família', () => {
    for (const d of DERIVED_ELEMENT_PAIRS) for (const f of SPECIAL_FAMILIES) efeitoDoEspecial(f, d.id);
  });
  it('sem a mecânica ligada (PvP), silêncio, lentidão e cura contínua não aparecem: o selo não mente', () => {
    expect(efeitoVisivel('defDebuff', 'som')).toBeNull();
    expect(efeitoVisivel('defDebuff', 'ar')).toBeNull();
    expect(efeitoVisivel('shield', 'vida')).toBeNull();
    expect(efeitoVisivel('defDebuff', 'som', true)).toBe('silencio');
    expect(efeitoVisivel('dot', 'fogo')).toBe('queimadura');
  });
  it('withRealFx troca só a pele: mesmos turnos do contador real', () => {
    const fx = [
      { nAtk: 2, nVuln: 0, nSpd: 0, shield: 0.1, shieldHits: 2, dot: 0 },
      { nAtk: 0, nVuln: 0, nSpd: 0, shield: 0, shieldHits: 0, dot: 3 },
    ];
    const b = withRealFx(emptyStatusBoard(1), fx, [], () => false, (h, o) => (h === 1 && o === 'foe' ? 'queimadura' : h === 0 && o === 'self' ? 'defesaTerra' : null));
    expect(b[1]).toEqual([{ kind: 'queimadura', turns: 3, source: -1 }]);
    expect(b[0].find((e) => e.kind === 'escudo')?.variant).toBe('terra');
    expect(STATUS_FX.queimadura.mark).not.toBe(STATUS_FX.dot.mark);
  });
});
