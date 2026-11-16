import { describe, it, expect } from 'vitest';
import { SPECIAL_FAMILIES, type SpecialFamily } from '../../combate/specials';
import {
  SUBSTANTIVOS_ESPECIAL, SUBSTANTIVOS_EFEITO, SUBSTANTIVOS_POR_FAMILIA, SUBSTANTIVOS_LEGADO, comporNome, nomeParaFamilia, nomeAtualDoEspecial, familiaDoNomeInimigo, nomeEspecialInimigo, type LexNome,
} from './nomeEspecial';
import { foeSpecialLabel, dungeonFoeSpecialLabel, specialLabel } from '../../combatFx';
import { foeSpecialOf } from '../../combate/foeFamilies';
import { comNomeDoEspecial } from './especialNome';
import type { FichaSkills } from './stageSkillsFor';

/**
 * GUARDA DE COERENCIA NOME x EFEITO (dono, 16/11/2026: "Onslaught nao faz sentido para cura").
 * O nome do especial vem do lexico da FAMILIA do efeito; aqui o lexico e proibido de conter a palavra de outra familia
 * e os caminhos que escolhem o nome (inimigo, Coroa da Hexsmith, save antigo) tem de seguir a familia que VALE na luta.
 */

/** Palavras que dizem DANO/ATAQUE: so o dano direto (`direct`) as usa. */
const OFENSIVAS = ['onslaught', 'strike', 'barrage', 'assault', 'slash', 'smite', 'blast', 'rampage', 'volley', 'flurry', 'charge', 'rush', 'fury'];
/** Palavras de CURA: so `heal`. */
const CURATIVAS = ['heal', 'mend', 'restore', 'salve', 'renewal', 'solace', 'respite', 'bloom'];
/** Palavras de ESCUDO: so `shield`. */
const PROTETORAS = ['ward', 'bulwark', 'aegis', 'bastion', 'rampart', 'citadel', 'carapace', 'cocoon'];
/** Palavras de VELOCIDADE: so `spdBuff`. */
const VELOZES = ['haste', 'quicken', 'quickening', 'swiftness', 'dash'];

const DENY: Record<SpecialFamily, string[]> = {
  direct: [...CURATIVAS, ...PROTETORAS, ...VELOZES],
  dot: [...OFENSIVAS, ...CURATIVAS, ...PROTETORAS, ...VELOZES],
  heal: [...OFENSIVAS, ...PROTETORAS, ...VELOZES],
  shield: [...OFENSIVAS, ...CURATIVAS, ...VELOZES],
  atkBuff: [...CURATIVAS, ...PROTETORAS, ...VELOZES, 'onslaught', 'barrage', 'assault'],
  defDebuff: [...CURATIVAS, ...PROTETORAS, ...VELOZES, 'onslaught', 'barrage', 'assault'],
  spdBuff: [...OFENSIVAS, ...CURATIVAS, ...PROTETORAS],
};
const palavras = (en: string) => en.toLowerCase().split(/\s+/);

describe('lexico por familia: nenhuma palavra de outra familia', () => {
  for (const f of SPECIAL_FAMILIES) {
    it(`${f}`, () => {
      for (const n of SUBSTANTIVOS_ESPECIAL[f]) {
        const ws = palavras(n.en);
        for (const d of DENY[f]) expect(ws.includes(d), `"${n.en}" (${f}) usa "${d}", palavra de outra familia`).toBe(false);
      }
    });
  }
  it('o nome composto de cada familia nunca leva substantivo de outra familia', () => {
    const lex: LexNome[] = [0, 1].flatMap(f => Array.from({ length: 8 }, (_, n) => ({ n, f: f as 0 | 1 })));
    for (const f of SPECIAL_FAMILIES) {
      const outros = SPECIAL_FAMILIES.filter(o => o !== f).flatMap(o => SUBSTANTIVOS_ESPECIAL[o].map(x => x.en));
      for (const l of lex) {
        const nome = comporNome(f, l, { en: 'Fire', pt: 'Fogo' });
        for (const w of outros) {
          if (SUBSTANTIVOS_ESPECIAL[f].some(x => x.en === w)) continue;
          expect(palavras(nome.en).includes(w.toLowerCase()), `${nome.en} (${f}) traz "${w}"`).toBe(false);
        }
      }
    }
  });
});

describe('o selo do especial do INIMIGO segue a familia dele', () => {
  const cura = (id: string) => foeSpecialLabel(false, 'fogo', id, 'heal');
  it('foe de cura nunca leva substantivo de dano direto', () => {
    const diretos = SUBSTANTIVOS_ESPECIAL.direct.map(x => x.en.toLowerCase());
    for (let i = 0; i < 60; i++) for (const w of palavras(cura(`foe${i}`))) expect(diretos.includes(w), cura(`foe${i}`)).toBe(false);
  });
  it('cada familia do sorteio dos inimigos gera nome do proprio lexico, tambem em PT', () => {
    for (let i = 0; i < 400; i++) {
      for (const stage of ['rookie', 'champion']) {
        const fam = familiaDoNomeInimigo(foeSpecialOf(stage, `k${i}`)) as SpecialFamily;
        const nome = foeSpecialLabel(false, 'agua', `n${i}`, fam);
        expect(SUBSTANTIVOS_ESPECIAL[fam].some(x => nome.includes(x.en)), `${nome} (${fam})`).toBe(true);
        const pt = foeSpecialLabel(true, 'agua', `n${i}`, fam);
        expect(SUBSTANTIVOS_ESPECIAL[fam].some(x => pt.startsWith(x.pt)), `${pt} (${fam})`).toBe(true);
      }
    }
  });
  it('cura ao longo do tempo (shield + hot) leva nome de CURA, nao de escudo', () => {
    expect(familiaDoNomeInimigo({ family: 'shield', effect: 'hot' })).toBe('heal');
    expect(familiaDoNomeInimigo({ family: 'shield' })).toBe('shield');
    expect(familiaDoNomeInimigo(null)).toBeUndefined();
  });
  it('nome de criatura da tabela so vale para dano direto', () => {
    const e = { especial: { pt: 'Erupcao de Magma', en: 'Magma Eruption' } };
    expect(dungeonFoeSpecialLabel(false, { ...e, foe: { special: { family: 'direct' } } }, 'fogo', 'x')).toBe('Magma Eruption');
    expect(dungeonFoeSpecialLabel(false, e, 'fogo', 'x')).toBe('Magma Eruption');
    const curando = dungeonFoeSpecialLabel(false, { ...e, foe: { special: { family: 'shield', effect: 'hot' } } }, 'fogo', 'x');
    expect(curando).not.toBe('Magma Eruption');
    expect(SUBSTANTIVOS_ESPECIAL.heal.some(x => curando.includes(x.en))).toBe(true);
  });
  it('sem familia, o inimigo segue dano direto (o PvE antigo)', () => {
    const nome = nomeEspecialInimigo({ en: 'Fire', pt: 'Fogo' }, 's');
    expect(SUBSTANTIVOS_ESPECIAL.direct.some(x => nome.en.includes(x.en))).toBe(true);
  });
});

describe('Coroa da Hexsmith: o nome acompanha a familia que vale', () => {
  const esp = { nome: { en: 'Fire Onslaught', pt: 'Investida Total de Fogo' }, familia: 'direct' as SpecialFamily, lex: { n: 7, f: 0 } as LexNome };
  it('direto vira cura: mesmo indice no lexico da cura, nada de Onslaught', () => {
    const r = nomeParaFamilia(esp, 'heal');
    expect(r.nome.en).toBe(`Fire ${SUBSTANTIVOS_ESPECIAL.heal[7].en}`);
    expect(r.nome.pt).toBe(`${SUBSTANTIVOS_ESPECIAL.heal[7].pt} de Fogo`);
    expect(r.nome.en).not.toContain('Onslaught');
  });
  it('forma "X of Fire" (EN) e dois elementos tambem', () => {
    const a = nomeParaFamilia({ ...esp, nome: { en: 'Onslaught of Fire', pt: 'Investida Total de Fogo' }, lex: { n: 7, f: 1 } }, 'shield');
    expect(a.nome.en).toBe(`${SUBSTANTIVOS_ESPECIAL.shield[7].en} of Fire`);
    const b = nomeParaFamilia({ ...esp, nome: { en: 'Onslaught of Fire and Water', pt: 'Investida Total de Fogo e Agua' }, lex: { n: 7, f: 2 } }, 'dot');
    expect(b.nome.en).toBe(`${SUBSTANTIVOS_ESPECIAL.dot[7].en} of Fire and Water`);
  });
  it('mesma familia, sem lex ou nome do jogador: intocado', () => {
    expect(nomeParaFamilia(esp, 'direct')).toBe(esp);
    expect(nomeParaFamilia(esp, undefined)).toBe(esp);
    const semLex = { nome: esp.nome, familia: 'direct' as SpecialFamily };
    expect(nomeParaFamilia(semLex, 'heal')).toBe(semLex);
    const meu = { ...esp, nome: { en: 'Minha Furia', pt: 'Minha Furia' } };
    expect(nomeParaFamilia(meu, 'heal')).toBe(meu);
  });
  it('specialLabel aplica a familia efetiva', () => {
    expect(specialLabel(false, esp, 'heal')).toBe(`Fire ${SUBSTANTIVOS_ESPECIAL.heal[7].en}`);
    expect(specialLabel(false, esp)).toBe('Fire Onslaught');
  });
});

describe('save antigo: texto velho de substantivo renomeado aparece novo, pela tabela', () => {
  it('Rapture e Flurry saem; o indice (lex) segue igual', () => {
    const heal = { nome: { en: 'Rapture of Light', pt: 'Extase de Luz' }, familia: 'heal' as SpecialFamily, lex: { n: 4, f: 1 } as LexNome };
    const novo = nomeAtualDoEspecial({ ...heal, nome: { en: 'Rapture of Light', pt: `${SUBSTANTIVOS_LEGADO.heal?.[4]?.pt} de Luz` } });
    expect(novo.nome).toEqual({ en: `${SUBSTANTIVOS_ESPECIAL.heal[4].en} of Light`, pt: `${SUBSTANTIVOS_ESPECIAL.heal[4].pt} de Luz` });
    expect(novo.lex).toEqual(heal.lex);
    const spd = { nome: { en: 'Wind Flurry', pt: 'Torvelinho de Vento' }, familia: 'spdBuff' as SpecialFamily, lex: { n: 7, f: 0 } as LexNome };
    expect(nomeAtualDoEspecial(spd).nome.en).toBe(`Wind ${SUBSTANTIVOS_ESPECIAL.spdBuff[7].en}`);
  });
  it('o texto velho nao esta mais no lexico, e o legado so lista indices que existem', () => {
    for (const f of SPECIAL_FAMILIES) {
      for (const [n, velho] of Object.entries(SUBSTANTIVOS_LEGADO[f] ?? {})) {
        expect(SUBSTANTIVOS_ESPECIAL[f][Number(n)].en).not.toBe(velho.en);
        expect(SUBSTANTIVOS_ESPECIAL[f].some(x => x.en === velho.en)).toBe(false);
      }
    }
  });
  it('comNomeDoEspecial le o nome novo e respeita o nome do jogador', () => {
    type Lido = { rookie: { especial: { nome: { en: string } } } };
    const skills = { rookie: { basica: { nome: { en: 'a', pt: 'a' } }, especial: { nome: { en: 'Rapture of Light', pt: 'Extase de Luz' }, familia: 'heal', lex: { n: 4, f: 1 } } } } as unknown as FichaSkills;
    expect((comNomeDoEspecial(skills, '') as unknown as Lido).rookie.especial.nome.en).toBe(`${SUBSTANTIVOS_ESPECIAL.heal[4].en} of Light`);
    expect((comNomeDoEspecial(skills, 'Meu Golpe') as unknown as Lido).rookie.especial.nome.en).toBe('Meu Golpe');
  });
});

describe('a BASICA (dano direto) de toda escola nao tem nome de cura, escudo ou controle', () => {
  it('nenhum substantivo da basica soa como outra familia', async () => {
    const { NOMES_BASICA } = await import('./skills');
    const proibidas = [...CURATIVAS, ...PROTETORAS, ...VELOZES, 'blessing', 'shelter', 'dew', 'caress', 'shackle', 'ward', 'haste'];
    for (const [escola, { basica }] of Object.entries(NOMES_BASICA)) {
      for (const n of basica) expect(proibidas.includes(n.en.toLowerCase()), `${escola}: "${n.en}"`).toBe(false);
    }
  });
});

describe('lexico dos EFEITOS das Coroas (slow, silence): 8 por efeito, disjunto das familias, e o nome segue o efeito', () => {
  const todos = SPECIAL_FAMILIES.flatMap(f => SUBSTANTIVOS_ESPECIAL[f].map(x => x.en.toLowerCase()));
  for (const e of ['slow', 'silence'] as const) {
    it(`${e}`, () => {
      expect(SUBSTANTIVOS_EFEITO[e].length).toBe(SUBSTANTIVOS_POR_FAMILIA);
      for (const n of SUBSTANTIVOS_EFEITO[e]) {
        expect(todos.includes(n.en.toLowerCase()), `"${n.en}" ja e de uma familia`).toBe(false);
        expect(n.pt.length).toBeGreaterThan(0);
      }
      const outro = SUBSTANTIVOS_EFEITO[e === 'slow' ? 'silence' : 'slow'].map(x => x.en.toLowerCase());
      for (const n of SUBSTANTIVOS_EFEITO[e]) expect(outro.includes(n.en.toLowerCase())).toBe(false);
    });
  }
  it('nomeParaFamilia com efeito troca o substantivo pelo MESMO indice do lexico do efeito; hot usa o de cura', () => {
    const esp = { nome: comporNome('direct', { n: 3, f: 0 }, { en: 'Fire', pt: 'Fogo' }), familia: 'direct' as const, lex: { n: 3, f: 0 as const } };
    expect(nomeParaFamilia(esp, 'defDebuff', 'slow').nome.en).toBe('Fire Quagmire');
    expect(nomeParaFamilia(esp, 'defDebuff', 'silence').nome.pt).toBe('Abafo de Fogo');
    expect(nomeParaFamilia(esp, 'shield', 'hot').nome.en).toBe(`Fire ${SUBSTANTIVOS_ESPECIAL.heal[3].en}`);
    expect(nomeParaFamilia(esp, 'defDebuff').nome.en).toBe(`Fire ${SUBSTANTIVOS_ESPECIAL.defDebuff[3].en}`);
  });
});
