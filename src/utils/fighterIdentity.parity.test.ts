/**
 * Identidade do lutador: o ESPELHO do servidor (`duelSide(save).fx`, `_duel.js`) e o dono único do app dão a MESMA
 * resposta para o mesmo save — o que o oponente vê no PvP é o que o dono vê nas outras telas.
 */
import { describe, it, expect } from 'vitest';
import { buildStageSkills, type StageSkills } from './soulProfile/ficha/skills';
import type { Ficha } from './soulProfile/ficha/types';
import { ESCOLAS_SKILL } from './soulProfile/ficha/types';
import { CLASS_ELEMENT_ORDER } from './soulProfile/types';
import { DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';
import { fighterIdentity, fighterIdentityFromFx, fxDoLutador } from './fighterIdentity';
import { duelSide, ELEMENTOS_FICHA } from '../../functions/api/_duel.js';

const ficha = (escolas: Ficha['escolas'], elementos: Ficha['elementos']): Ficha => ({
  nome: 'T', elementos, escolas, recursos: { mana: 2 }, talentos: {}, profissoes: {},
  totals: { elementos: 6, escolas: 0, recursos: 2, talentos: 0, profissoes: 0 },
});
const doServidor = (par: unknown, fallback?: string) =>
  fighterIdentityFromFx(duelSide({ evolutionStage: 'rookie', soulmonSkills: { rookie: par } }).fx, fallback);

describe('identidade do lutador: cliente == servidor', () => {
  it('a lista fechada de elementos do servidor é a do app (17 base + 136 pares)', () => {
    expect([...ELEMENTOS_FICHA].sort()).toEqual([...CLASS_ELEMENT_ORDER, ...DERIVED_ELEMENT_PAIRS.map(d => d.id)].sort());
  });

  it('fichas geradas (todas as escolas × bases × pares × sementes): a mesma identidade nos dois lados', () => {
    let n = 0;
    for (const escola of ESCOLAS_SKILL) for (const el of ['fogo', 'terra', 'vigor']) for (const par of [undefined, 'vapor', 'lava']) for (const seed of ['a', 'b']) {
      const f = ficha({ [escola]: 5 }, { [el]: 3, agua: 2, ...(par ? { [par]: 2 } : {}) });
      const sk = buildStageSkills(f, 'rookie', seed);
      expect(doServidor(sk, 'fogo')).toEqual(fighterIdentity(sk, 'fogo'));
      expect(fighterIdentityFromFx(fxDoLutador(sk), 'fogo')).toEqual(fighterIdentity(sk, 'fogo'));
      n++;
    }
    expect(n).toBe(90);
  });

  it('o básico é o elemento DOMINANTE (par comprado), o especial é o dele', () => {
    const sk = buildStageSkills(ficha({ maldicao: 5 }, { fogo: 2, vapor: 2 }), 'rookie', 's');
    const id = fighterIdentity(sk);
    expect(id.basico.elemento).toBe(sk.elementoDominante!.id);
    expect(id.basico.elemento).toBe('vapor');
    expect(id.especial.elemento).toBe(sk.especial.elementoId);
  });

  it('legado: skills sem `elementoDominante`/`familia`, escola `evocacao` e lixo caem igual nos dois lados', () => {
    const base = buildStageSkills(ficha({ combate_fisico: 5 }, { fogo: 4, agua: 1 }), 'rookie', 's');
    const semDom = { ...base, elementoDominante: undefined, especial: { ...base.especial, familia: undefined } } as unknown as StageSkills;
    expect(fighterIdentity(semDom).basico.elemento).toBe(base.basica.elementoId);
    expect(doServidor(semDom)).toEqual(fighterIdentity(semDom));
    const evo = { ...base, basica: { ...base.basica, escolaId: 'evocacao' }, especial: { ...base.especial, escolaId: 'evocacao', familia: undefined } } as unknown as StageSkills;
    expect(doServidor(evo, 'fogo')).toEqual(fighterIdentity(evo, 'fogo'));
    expect(fighterIdentity(evo).basico.escola).toBe('conjuracao');
  });

  it('sem ficha: o fallback é o mesmo em toda tela e no servidor; sem nada, neutro', () => {
    expect(fighterIdentity(undefined, 'fogo').basico.elemento).toBe('fogo');
    expect(fighterIdentity(undefined).basico.elemento).toBe('neutro');
    const semFicha = duelSide({ evolutionStage: 'rookie' }).fx;
    expect(fighterIdentityFromFx(semFicha, 'fogo')).toEqual(fighterIdentity(undefined, 'fogo'));
  });

  it('elemento forjado no save/fx nunca sai do servidor nem vale no cliente (lista fechada)', () => {
    const sk = buildStageSkills(ficha({ combate_fisico: 5 }, { fogo: 4 }), 'rookie', 's');
    const forjado = { ...sk, elementoDominante: { id: '<img src=x onerror=1>', nome: sk.elementoDominante!.nome }, especial: { ...sk.especial, elementoId: 'nao_existe' } };
    const fx = duelSide({ evolutionStage: 'rookie', soulmonSkills: { rookie: forjado } }).fx;
    expect(fx.elBasica).toBe(sk.basica.elementoId); // dominante forjado cai no elemento da básica (da lista)
    expect(fx.elEspecial).toBeNull();
    const id = fighterIdentityFromFx({ basica: null, especial: null, elBasica: 'nao_existe', elEspecial: '<x>' }, 'agua');
    expect(id.basico.elemento).toBe('agua');
    expect(id.especial.elemento).toBe('agua');
  });
});
