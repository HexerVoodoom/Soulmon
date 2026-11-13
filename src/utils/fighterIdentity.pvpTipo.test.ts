/**
 * REGISTRO §332 (13/11/2026, dono): no PvP o TIPO do ataque básico do OPONENTE (corte × splash) não muda com Coroa, Amuleto ou
 * Garra; só as Luvas trocam. O cliente recalcula o tipo do `fx` que o servidor publica, e esse `fx` já leva os itens: por isso o
 * servidor publica também `orig` (família/elementos sem itens) e `golpe` (as Luvas). Só visual: o duelo dá o MESMO resultado.
 */
import { describe, it, expect } from 'vitest';
import { buildStageSkills } from './soulProfile/ficha/skills';
import type { Ficha } from './soulProfile/ficha/types';
import { ESCOLAS_SKILL } from './soulProfile/ficha/types';
import { SPECIAL_FAMILIES } from './combate/specials';
import { chaveDaIdentidade, meleeImpactOf } from './combate/golpeImpacto';
import { fxElementId } from './combatFx';
import { fighterIdentity, fighterIdentityFromFx, fighterIdentitySemItensFromFx, tipoDoBasicoPvp, type FighterFx } from './fighterIdentity';
import { hexIdentity, strikeParts, HEX_STRIKES, type HexOverrides } from './hexsmith';
import { duelSide, simulateDuel } from '../../functions/api/_duel.js';

const ficha = (escolas: Ficha['escolas'], elementos: Ficha['elementos']): Ficha => ({
  nome: 'T', elementos, escolas, recursos: { mana: 2 }, talentos: {}, profissoes: {},
  totals: { elementos: 6, escolas: 0, recursos: 2, talentos: 0, profissoes: 0 },
});

/** Saves de oponente variados: todas as escolas × 4 elementos de sprite × 2 sementes. */
const SAVES: Array<{ save: Record<string, unknown>; el: string; sk: ReturnType<typeof buildStageSkills> }> = [];
for (const escola of ESCOLAS_SKILL) for (const el of ['fogo', 'terra', 'ar', 'sombra']) for (const seed of ['a', 'b']) {
  const sk = buildStageSkills(ficha({ [escola]: 5 }, { [el]: 3, agua: 2 }), 'rookie', seed);
  SAVES.push({ el, sk, save: { evolutionStage: 'rookie', perfectDays: 3, soulmonMeta: { dominantElement: el }, soulmonSkills: { rookie: sk } } });
}

const comItens = (save: Record<string, unknown>, ids: string[]) => {
  const equipped: Record<string, string> = {};
  for (const id of ids) equipped[id.split(':')[0]] = id;
  return { ...save, hexsmith: { owned: ids, equipped } };
};
const fxDe = (save: Record<string, unknown>) => duelSide(save).fx as FighterFx;
/** O tipo do básico que o OUTRO aparelho desenha (a mesma expressão do `DuelScreen`). */
const tipoVisto = (fx: FighterFx, el: string) => tipoDoBasicoPvp(fighterIdentityFromFx(fx, el), fighterIdentitySemItensFromFx(fx, el), fxElementId);
/** O tipo como era ANTES da correção (a chave do `fx` com itens). */
const tipoAntigo = (fx: FighterFx, el: string) => {
  const id = fighterIdentityFromFx(fx, el);
  return id.basico.impacto || meleeImpactOf({ element: fxElementId(id.basico.elemento), key: chaveDaIdentidade(id) });
};

const ITENS_DE_IDENTIDADE: string[][] = [
  ...SPECIAL_FAMILIES.map(f => [`coroa:${f}`]),
  ['amuleto:morte'], ['amuleto:vigor'], ['garra:vida'], ['garra:gravidade'],
  ['coroa:dot', 'amuleto:morte', 'garra:vida'],
];

describe('PvP §332: só as Luvas trocam o tipo do básico do oponente', () => {
  it('Coroa/Amuleto/Garra (sozinhos ou juntos) não trocam o tipo visto pelo oponente', () => {
    for (const { save, el } of SAVES) {
      const antes = tipoVisto(fxDe(save), el);
      expect(antes).toBe(tipoAntigo(fxDe(save), el)); // sem itens = exatamente o comportamento antigo
      for (const ids of ITENS_DE_IDENTIDADE) expect(tipoVisto(fxDe(comItens(save, ids)), el), `${el} + ${ids.join(',')}`).toBe(antes);
    }
  });

  it('o teste morde: sem `orig`, a Coroa de DoT trocaria o tipo de algum oponente', () => {
    const mudaria = SAVES.some(({ save, el }) => tipoAntigo(fxDe(comItens(save, ['coroa:dot'])), el) !== tipoAntigo(fxDe(save), el));
    expect(mudaria).toBe(true);
  });

  it('as Luvas trocam o tipo e a forma, mesmo com Coroa', () => {
    for (const { save, el } of SAVES.slice(0, 8)) for (const s of HEX_STRIKES) {
      const fx = fxDe(comItens(save, [`luvas:${s}`, 'coroa:dot']));
      expect(fx.golpe).toBe(s);
      expect(tipoVisto(fx, el)).toBe(strikeParts(s).impacto);
      expect(fighterIdentityFromFx(fx, el).basico.forma).toBe(strikeParts(s).forma);
    }
  });

  it('servidor == cliente: o tipo que o oponente vê é o que `hexIdentity` dá no aparelho do dono', () => {
    const hxDe = (ids: string[]): HexOverrides => {
      const o: Record<string, string> = {};
      const k: Record<string, string> = { coroa: 'specialFamily', amuleto: 'specialElement', garra: 'basicElement', luvas: 'strike' };
      for (const id of ids) { const [slot, v] = id.split(':'); o[k[slot]] = v; }
      return o as HexOverrides;
    };
    for (const { save, el, sk } of SAVES) for (const ids of [...ITENS_DE_IDENTIDADE, ['luvas:magic'], ['luvas:melee-slash', 'coroa:heal']]) {
      const fx = fxDe(comItens(save, ids));
      const doDono = hexIdentity(fighterIdentity(sk, el), hxDe(ids));
      // sem o mapeamento de arte (`fxElementId`), que é da tela: o sorteio puro é o mesmo nos dois aparelhos
      expect(tipoDoBasicoPvp(fighterIdentityFromFx(fx, el), fighterIdentitySemItensFromFx(fx, el)), `${el} + ${ids.join(',')}`).toBe(doDono.basico.impacto);
      expect(fighterIdentitySemItensFromFx(fx, el)).toEqual(fighterIdentitySemItensFromFx(fxDe(save), el));
    }
  });

  it('o espelho das Luvas no dono único é o `strikeParts` da Hexsmith', () => {
    for (const s of HEX_STRIKES) {
      const fx: FighterFx = { basica: null, especial: null, golpe: s };
      const b = fighterIdentityFromFx(fx, 'fogo').basico;
      expect({ forma: b.forma, impacto: b.impacto }).toEqual(strikeParts(s));
    }
    expect(fighterIdentityFromFx({ basica: null, especial: null, golpe: 'inventado' }, 'fogo')).toEqual(fighterIdentityFromFx({ basica: null, especial: null }, 'fogo'));
  });

  it('compatível: sem itens o `fx` é o de antes; campo ausente = comportamento antigo', () => {
    for (const { save } of SAVES) {
      const fx = fxDe(save);
      expect('orig' in fx).toBe(false);
      expect('golpe' in fx).toBe(false);
    }
    const { save, el } = SAVES[0];
    const fx = fxDe(comItens(save, ['coroa:dot']));
    const { orig: _o, golpe: _g, ...velho } = fx;
    expect(fighterIdentitySemItensFromFx(velho, el)).toEqual(fighterIdentityFromFx(velho, el));
  });

  it('o resultado do duelo não muda com `orig`/`golpe` (só visual)', () => {
    for (const { save } of SAVES.slice(0, 12)) {
      const a = duelSide(comItens(save, ['coroa:dot', 'amuleto:morte', 'garra:vida', 'luvas:magic']));
      const { orig: _o, golpe: _g, ...fxSem } = a.fx as FighterFx;
      const b = duelSide(save);
      for (const seed of [1, 7, 12345]) {
        const r1 = simulateDuel({ me: a, opp: b, seed, elementScale: 0.5 });
        const r2 = simulateDuel({ me: { ...a, fx: fxSem as typeof a.fx }, opp: b, seed, elementScale: 0.5 });
        expect(r1).toEqual(r2);
      }
    }
  });
});
