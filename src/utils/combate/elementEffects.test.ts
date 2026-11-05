import { describe, expect, it } from 'vitest';
import { DERIVED_ELEMENT_PAIRS } from '../soulProfile/derivedElements';
import { SPECIAL_FAMILIES } from './specials';
import { efeitoDoEspecial, efeitoVisivel } from './elementEffects';
import { STATUS_FX, emptyStatusBoard, statusGlyphId, statusLabel, withRealFx } from '../combatFx';

describe('§228: efeito pelo elemento do especial', () => {
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
    expect(efeitoVisivel('defDebuff', 'ar', true)).toBe('lentidao');
    expect(efeitoVisivel('dot', 'fogo')).toBe('queimadura');
  });
  it('§236: os 11 elementos têm efeito real, e o direto segue sem nada', () => {
    const tabela = {
      gravidade: ['defDebuff', 'peso'], tempo: ['defDebuff', 'retardo'], industrial: ['defDebuff', 'ferrugem'], espaco: ['defDebuff', 'distorcao'],
      luz: ['defDebuff', 'ofuscado'], eletricidade: ['defDebuff', 'curtoCircuito'], marcial: ['defDebuff', 'atordoado'], arcano: ['defDebuff', 'selado'],
      planta: ['shield', 'seiva'], fada: ['shield', 'poDeFada'], vigor: ['shield', 'folego'],
    } as const;
    for (const [el, [fam, efeito]] of Object.entries(tabela)) {
      expect(efeitoDoEspecial(fam, el), el).toBe(efeito);
      expect(efeitoDoEspecial('direct', el), el).toBeNull();
      expect(efeitoVisivel(fam, el), el).toBeNull(); // PvP não mostra regra que não roda
      expect(efeitoVisivel(fam, el, true), el).toBe(efeito);
    }
    expect(efeitoVisivel('atkBuff', 'vigor')).toBe('furia'); // buff real da família: vale no PvP também
  });
  it('§236: derivado que já tinha efeito não muda', () => {
    expect(efeitoDoEspecial('defDebuff', 'silencio_cosmico')).toBe('silencio');
    expect(efeitoDoEspecial('dot', 'lava')).toBe('queimadura');
  });
  it('§236: o selo veste o contador real sem trocar os turnos', () => {
    const fx = [
      { nAtk: 0, nVuln: 0, nSpd: 0, shield: 0, shieldHits: 0, dot: 0, hot: 2 },
      { nAtk: 0, nVuln: 1, nSpd: 0, shield: 0, shieldHits: 0, dot: 0, nSil: 2, nSlow: 1 },
    ];
    const b = withRealFx(emptyStatusBoard(1), fx, [], () => false, (h, o) => (h === 0 && o === 'self' ? 'seiva' : h === 1 && o === 'foe' ? 'peso' : null));
    expect(b[0].find((e) => e.kind === 'hot')).toMatchObject({ variant: 'seiva', turns: 2 });
    expect(b[1].find((e) => e.kind === 'lento')).toMatchObject({ variant: 'peso', turns: 1 });
    expect(b[1].find((e) => e.kind === 'silencio')?.variant).toBeUndefined(); // 'peso' é pele de lentidão
    expect(statusLabel('hot', true, 'seiva')).toBe('Seiva');
    expect(statusGlyphId('lento', 'peso')).toBe('st-peso');
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
