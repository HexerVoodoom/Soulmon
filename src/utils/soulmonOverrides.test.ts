// REGISTRO §333: os ajustes do dono por forma (Tabela de Soulmons, 13/11/2026).
import { describe, expect, it } from 'vitest';
import { ATAQUE_TIPO_MOTOR, ATAQUE_TIPO_OVERRIDE, ELEMENTO_FORMA_OVERRIDE, PERSONALIDADE_OVERRIDE, ataqueTipoOverride, flipDe, flutuaDe } from './soulmonOverrides';
import { FLIP_DATA, FLUTUA_DATA } from './soulmonOverrides.data';
import { ENEMY_ROSTER, ENEMY_ROSTER_KEYS, rosterEntryOfKey } from './enemyRoster';
import { FORMAS_ALTAS, NOVOS_DATA } from './novosSoulmonData';
import { ARENA_CHEFES_ULTRA, arenaFoeFormKey } from './arena';
import { foeStrikeForm } from './combatFx';
import { meleeImpactOf } from './combate/golpeImpacto';
import { DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';
import { isCuratedElement } from './elementosCurados';

/** As formas que existem: o roster + os Ultra (base com arte em `FORMAS_ALTAS` e os chefes Ultra da Arena), que ficam fora do roster. */
const ULTRA_KEYS = new Set([
  ...NOVOS_DATA.filter(n => FORMAS_ALTAS[n.id]?.ultra).map(n => `${n.id}-ultra`),
  ...ARENA_CHEFES_ULTRA.map(c => `${c.id}-ultra`),
]);
const existe = (k: string) => ENEMY_ROSTER_KEYS.has(k) || ULTRA_KEYS.has(k);

describe('ATAQUE_TIPO_OVERRIDE (Tabela de Soulmons do dono)', () => {
  it('nenhuma chave velha: todo id da tabela existe no roster (ou é um Ultra)', () => {
    const velhos = Object.keys(ATAQUE_TIPO_OVERRIDE).filter(k => !existe(k));
    expect(velhos).toEqual([]);
    expect(Object.keys(ATAQUE_TIPO_OVERRIDE).length).toBe(291);
  });

  it('cada tipo vira a representação do motor (forma × acabamento)', () => {
    expect(ATAQUE_TIPO_MOTOR).toEqual({
      ranged_corte: { forma: 'ranged', impacto: 'corte' }, ranged_splash: { forma: 'ranged', impacto: 'concussao' },
      melee_corte: { forma: 'melee', impacto: 'corte' }, melee_splash: { forma: 'melee', impacto: 'concussao' },
    });
  });

  it('o override vence a derivação no básico, para toda forma da tabela', () => {
    let divergentes = 0;
    for (const [k, tipo] of Object.entries(ATAQUE_TIPO_OVERRIDE)) {
      const e = rosterEntryOfKey(k);
      const el = e?.element ?? 'fogo';
      const key = e?.name ?? k;
      const want = ATAQUE_TIPO_MOTOR[tipo];
      const derivForma = foeStrikeForm(el, 'basica');
      const derivImp = meleeImpactOf({ element: el, key, name: e?.name, forma: derivForma });
      if (derivForma !== want.forma || derivImp !== want.impacto) divergentes++;
      const forma = foeStrikeForm(el, 'basica', k);
      expect(forma).toBe(want.forma);
      expect(meleeImpactOf({ element: el, key, name: e?.name, forma, formKey: k })).toBe(want.impacto);
    }
    expect(divergentes).toBeGreaterThan(0); // a tabela muda de fato alguma coisa (senão o teste não prova nada)
  });

  it('caso concreto: embrit-ultimate é melee_corte mesmo com fogo derivando ranged', () => {
    expect(foeStrikeForm('fogo', 'basica')).toBe('ranged');
    expect(foeStrikeForm('fogo', 'basica', 'embrit-ultimate')).toBe('melee');
    expect(meleeImpactOf({ element: 'fogo', key: 'x', forma: 'melee', formKey: 'embrit-ultimate' })).toBe('corte');
  });

  it('sem linha na tabela (ou no especial): a regra derivada de sempre', () => {
    expect(ataqueTipoOverride('nao-existe-rookie')).toBeUndefined();
    expect(ataqueTipoOverride(undefined)).toBeUndefined();
    expect(ataqueTipoOverride('constructor')).toBeUndefined();
    expect(foeStrikeForm('fogo', 'especial', 'embrit-ultimate')).toBe(foeStrikeForm('fogo', 'especial'));
    expect(meleeImpactOf({ element: 'agua', key: 'k' })).toBe(meleeImpactOf({ element: 'agua', key: 'k', formKey: null }));
  });

  it('Arena: a chave da forma é a do bestiário, e o chefe Ultra usa <espécie>-ultra', () => {
    expect(arenaFoeFormKey({ creature: 'embrit', form: 'ultimate' })).toBe('embrit-ultimate');
    expect(arenaFoeFormKey({ form: 'ultimate', chefeUltra: 'mareoror' })).toBe('mareoror-ultra');
  });
});

describe('flutua e flip (bandeiras de sprite, padrão desligado)', () => {
  it('o export de 13/11 não liga nenhuma', () => {
    expect(FLUTUA_DATA).toEqual([]);
    expect(FLIP_DATA).toEqual([]);
  });
  it('toda forma do roster sai desligada; chave vazia também', () => {
    for (const e of ENEMY_ROSTER) { expect(flutuaDe(e.key)).toBe(false); expect(flipDe(e.key)).toBe(false); }
    expect(flutuaDe(undefined)).toBe(false);
    expect(flipDe(null)).toBe(false);
  });
});

describe('trocas de linha validadas (elemento e personalidade)', () => {
  it('todo elemento novo é id válido (derivado ou curado) e a forma existe', () => {
    for (const [k, el] of Object.entries(ELEMENTO_FORMA_OVERRIDE)) {
      expect(ENEMY_ROSTER_KEYS.has(k)).toBe(true);
      expect(DERIVED_ELEMENT_PAIRS.some(d => d.id === el) || isCuratedElement(el)).toBe(true);
    }
    for (const k of Object.keys(PERSONALIDADE_OVERRIDE)) expect(ENEMY_ROSTER_KEYS.has(k)).toBe(true);
  });
  it('o roster aplica o elemento e mantém golpes, arte e estágio', () => {
    const t = rosterEntryOfKey('tidewark-ultimate')!;
    expect(t.element).toBe('armaria');
    expect(t.elements).toEqual(['industrial', 'marcial']);
    expect(t.stage).toBe('ultimate');
    expect(t.artFile).toBe('tidewark-ultimate');
    expect(t.basico).toBeDefined();
    const s = rosterEntryOfKey('salsoluraharmonia-ultimate')!;
    expect(s.element).toBe('sopro_do_dragao');
    expect(s.elements.length).toBeGreaterThanOrEqual(2);
  });
  it('a linha do Salsolura continua com um estágio de cada por ramo', () => {
    for (const ramo of ['poder', 'harmonia', 'benevolencia']) {
      const st = ENEMY_ROSTER.filter(e => e.id === `salsolura${ramo}`).map(e => e.stage);
      expect(st).toEqual(['champion', 'ultimate', 'mega']);
    }
  });
});
