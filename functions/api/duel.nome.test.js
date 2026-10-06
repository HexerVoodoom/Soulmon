/**
 * PR9b — o nome EXATO do especial no PvP, sem texto do save.
 *
 * O dono vê o nome gravado na própria skill (`StageSkill.especial.nome`, gerado por regra). O servidor publica só o ID
 * dele (`fx.lex` = índice do substantivo + formato + ids de elemento, todos validados) e o cliente do oponente recompõe
 * o nome com a MESMA função pura (`comporNome`). Este arquivo prova: (1) nome do oponente == nome do dono, em
 * escolas × estágios × elementos × seeds, nos dois idiomas; (2) a paridade das constantes que o servidor espelha;
 * (3) payload malicioso no save nunca vira texto na tela do outro.
 */
import { describe, it, expect } from 'vitest';
import { duelSide, LEXICO_POR_FAMILIA, SPECIAL_FAMILY_IDS, ESCOLA_FAMILY, lexOf } from './_duel.js';
import { buildAllStageSkills } from '../../src/utils/soulProfile/ficha/skills';
import { SUBSTANTIVOS_ESPECIAL, SUBSTANTIVOS_POR_FAMILIA, nomeDeLexico } from '../../src/utils/soulProfile/ficha/nomeEspecial';
import { foeSpecialLabel, specialLabel } from '../../src/utils/combatFx';
import { SPECIAL_FAMILIES } from '../../src/utils/combate/specials';
import { ESCOLA_FAMILY_PADRAO } from '../../src/utils/arena';
import { FICHA_STAGE_ORDER } from '../../src/utils/soulProfile/ficha/types';
import { DERIVED_ELEMENT_PAIRS } from '../../src/utils/soulProfile/derivedElements';

const ESCOLAS = ['combate_fisico', 'longo_alcance', 'conjuracao', 'benca', 'maldicao'];
const PARES = DERIVED_ELEMENT_PAIRS.slice(0, 5).map(p => p.id);
const ELEMENTOS = [{ fogo: 4, agua: 2 }, { sombra: 3, luz: 3 }, { vigor: 5 }, { [PARES[0]]: 4, fogo: 2 }, { [PARES[3]]: 5, terra: 1, ar: 1 }];

const ficha = (escola, elementos) => ({
  nome: 'T', elementos, escolas: { [escola]: 5, evocacao: 4 }, recursos: { mana: 2 }, talentos: {}, profissoes: {},
  totals: { elementos: 0, escolas: 5, recursos: 2, talentos: 0, profissoes: 0 },
});
const jornada = (escola, elementos, seed) =>
  buildAllStageSkills(Object.fromEntries(FICHA_STAGE_ORDER.map(s => [s, ficha(escola, elementos)])), seed, 'fogo');

describe('paridade das constantes que o servidor espelha', () => {
  it('o léxico tem o tamanho que o servidor valida, em TODA família', () => {
    expect(LEXICO_POR_FAMILIA).toBe(SUBSTANTIVOS_POR_FAMILIA);
    for (const f of SPECIAL_FAMILIES) expect(SUBSTANTIVOS_ESPECIAL[f]).toHaveLength(LEXICO_POR_FAMILIA);
  });
  it('as 7 famílias e a tabela escola → família padrão são as do app, e `evocacao` não existe em nenhuma', () => {
    expect([...SPECIAL_FAMILY_IDS]).toEqual([...SPECIAL_FAMILIES]);
    expect(ESCOLA_FAMILY).toEqual(ESCOLA_FAMILY_PADRAO);
    expect(Object.keys(ESCOLA_FAMILY)).not.toContain('evocacao');
  });
});

describe('nome do oponente == nome que o dono vê', () => {
  it('varredura: 5 escolas × 5 estágios × 5 elementos × 6 seeds, em PT e EN (selo do cast incluso)', () => {
    let n = 0;
    for (const escola of ESCOLAS) for (const el of ELEMENTOS) for (let s = 0; s < 6; s++) {
      const skills = jornada(escola, el, `${escola}-${s}`);
      for (const stage of FICHA_STAGE_ORDER) {
        const side = duelSide({ evolutionStage: stage, perfectDays: 3, soulmonSkills: skills });
        const dono = skills[stage].especial;
        expect(side.fx.lex, `${escola}/${stage}/${s}`).not.toBeNull();
        const nome = nomeDeLexico({ familia: side.fx.familia, lex: side.fx.lex });
        expect(nome).toEqual(dono.nome);
        for (const isPt of [true, false]) {
          // o selo que o APARELHO DO OPONENTE mostra (qualquer elemento/seed de inimigo: o ID manda) == o selo do dono
          expect(foeSpecialLabel(isPt, 'agua', 'qualquer-seed', side.fx.familia, side.fx.lex)).toBe(specialLabel(isPt, dono));
        }
        n++;
      }
    }
    expect(n).toBe(5 * 5 * 5 * 6);
  });

  it('a família publicada é a da skill do dono (o nome sai do léxico dela)', () => {
    const skills = jornada('maldicao', ELEMENTOS[0], 'fam');
    for (const stage of FICHA_STAGE_ORDER) {
      expect(duelSide({ evolutionStage: stage, soulmonSkills: skills }).fx.familia).toBe(skills[stage].especial.familia);
    }
  });

  it('save sem `lex` (cache antigo): lex nulo, o cliente cai no nome por família (nada quebra)', () => {
    const skills = jornada('benca', ELEMENTOS[1], 'velho');
    delete skills.champion.especial.lex;
    const fx = duelSide({ evolutionStage: 'champion', soulmonSkills: skills }).fx;
    expect(fx.lex).toBeNull();
    expect(fx.familia).toBe(skills.champion.especial.familia);
    expect(foeSpecialLabel(true, 'fogo', 'seed', fx.familia, fx.lex)).toMatch(/\S/);
  });
});

describe('string maliciosa no save nunca chega à tela do outro', () => {
  const XSS = '<img src=x onerror=alert(1)>';
  const base = () => jornada('conjuracao', ELEMENTOS[0], 'mal');
  const lado = (mexe) => {
    const skills = base();
    mexe(skills.champion);
    return duelSide({ evolutionStage: 'champion', soulmonSkills: skills });
  };

  it('o texto do save (nome, descrição, elemento) não aparece em NADA que o servidor publica', () => {
    const side = lado(c => {
      c.especial.nome = { pt: XSS, en: XSS }; c.especial.descricao = { pt: XSS, en: XSS }; c.especial.elementoNome = { pt: XSS, en: XSS };
      c.basica.nome = { pt: XSS, en: XSS };
    });
    const json = JSON.stringify(side);
    expect(json).not.toContain('img');
    expect(json).not.toContain('onerror');
    expect(side.fx.lex).not.toBeNull(); // o ID segue válido: o nome some, o ID não
  });

  it('ID forjado: fora de faixa, de tipo errado ou de formato → lex nulo (servidor)', () => {
    const forjados = [
      { n: 8, f: 0 }, { n: -1, f: 0 }, { n: 1.5, f: 0 }, { n: '3', f: 0 }, { n: XSS, f: 0 }, { n: 0, f: 3 }, { n: 0, f: '1' }, { n: 0, f: XSS },
      null, 'x', 7, [], { n: 0 }, { f: 0 },
    ];
    for (const lex of forjados) expect(lado(c => { c.especial.lex = lex; }).fx.lex, JSON.stringify(lex)).toBeNull();
  });

  it('elemento forjado: fora do formato fechado → lex nulo (servidor); no formato mas desconhecido → o cliente recusa', () => {
    for (const el of [XSS, 'Fogo', 'a'.repeat(40), '', 7, null, '../x', 'fogo ']) {
      expect(lado(c => { c.especial.elementoId = el; }).fx.lex, String(el)).toBeNull();
      expect(lado(c => { c.basica.elementoId = el; }).fx.lex, String(el)).toBeNull();
    }
    const side = lado(c => { c.especial.elementoId = 'hackeado'; });
    expect(side.fx.lex?.el).toBe('hackeado'); // passa o formato fechado...
    expect(nomeDeLexico({ familia: side.fx.familia, lex: side.fx.lex })).toBeNull(); // ...e o cliente só aceita elemento da lista dele
    expect(foeSpecialLabel(true, 'fogo', 'seed', side.fx.familia, side.fx.lex)).not.toMatch(/hackeado/i);
  });

  it('o cliente também recusa o que o servidor jamais mandaria (defesa em profundidade)', () => {
    const ok = { familia: 'dot', lex: { n: 2, f: 1, el: 'fogo', elB: 'agua' } };
    expect(nomeDeLexico(ok)).not.toBeNull();
    for (const ruim of [
      { ...ok, familia: XSS }, { ...ok, familia: 'constructor' }, { ...ok, familia: '__proto__' },
      { ...ok, lex: { ...ok.lex, n: 99 } }, { ...ok, lex: { ...ok.lex, n: XSS } }, { ...ok, lex: { ...ok.lex, f: 5 } },
      { ...ok, lex: { ...ok.lex, el: XSS } }, { ...ok, lex: { ...ok.lex, elB: '__proto__' } }, { ...ok, lex: { ...ok.lex, el: 'constructor' } },
      { ...ok, lex: null }, { familia: 'dot' }, null, 'x',
    ]) {
      expect(nomeDeLexico(ruim), JSON.stringify(ruim)).toBeNull();
    }
  });

  it('família forjada no save: não há ID (o índice é do léxico da família salva) e a família cai na padrão da escola', () => {
    const side = lado(c => { c.especial.familia = XSS; });
    expect(side.fx.lex).toBeNull();
    expect(side.fx.familia).toBe(ESCOLA_FAMILY.conjuracao);
    expect(JSON.stringify(side)).not.toContain('img');
  });

  it('lexOf isolado: sem especial/básica/família = nulo', () => {
    expect(lexOf(null, null, 'dot')).toBeNull();
    expect(lexOf({ lex: { n: 0, f: 0 }, elementoId: 'fogo' }, null, 'dot')).toBeNull();
    expect(lexOf({ lex: { n: 0, f: 0 }, elementoId: 'fogo' }, { elementoId: 'agua' }, null)).toBeNull();
    expect(lexOf({ lex: { n: 0, f: 0 }, elementoId: 'fogo' }, { elementoId: 'agua' }, 'dot')).toEqual({ n: 0, f: 0, el: 'fogo', elB: 'agua' });
  });
});
