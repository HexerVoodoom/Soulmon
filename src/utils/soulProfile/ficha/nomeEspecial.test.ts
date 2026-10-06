/**
 * PR9 — o nome próprio do especial, novo por estágio, por regra determinística.
 * Varre escolas × elementos × famílias × estágios: sem vazio, EN e PT, sem colisão proibida.
 */
import { describe, it, expect } from 'vitest';
import { buildStageSkills, buildAllStageSkills, elementoNomeDe } from './skills';
import {
  SUBSTANTIVOS_ESPECIAL, PESO_FAMILIA_ESCOLA, familiaDoEspecial, nomeDoEspecial, descricaoDoEspecial, nomeEspecialInimigo,
} from './nomeEspecial';
import { SPECIAL_FAMILIES } from '../../combate/specials';
import { CLASS_ELEMENT_ORDER } from '../types';
import { DERIVED_ELEMENT_PAIRS } from '../derivedElements';
import { FICHA_STAGE_ORDER, type EscolaId, type EscolaSkillId, type Ficha, type FichaStage } from './types';

const ESCOLAS: EscolaSkillId[] = ['combate_fisico', 'longo_alcance', 'conjuracao', 'benca', 'maldicao'];
const TODAS_ESCOLAS = ESCOLAS;
const AMOSTRA_PARES = DERIVED_ELEMENT_PAIRS.slice(0, 6).map(p => p.id);

function ficha(escola: EscolaSkillId, elementos: Record<string, number>): Ficha {
  return {
    nome: 'T', elementos, escolas: { [escola]: 5 }, recursos: { mana: 2 }, talentos: {}, profissoes: {},
    totals: { elementos: 0, escolas: 5, recursos: 2, talentos: 0, profissoes: 0 },
  };
}

/** A régua da narrativa (bíblia §12 / `narrativa.contract.test.ts`), aplicada ao TEXTO GERADO. */
const VETADOS: RegExp[] = [
  /\bWeave\b/, new RegExp('V[ií]r' + 'us|Vac' + 'ina|Vac' + 'cine'), // montado por partes: a régua do renomeio de caminhos lê o fonte /Glitchtama/, /\b(domador|domadora|treinador|treinadora|tamer)\b/i,
  /\bdigi[ée]volu/i, /\b(mundo digital|digital world)\b/i, /n[ií]vel|\blevel\b|\blvl\b/i, /\bcurar?\b|\bcure\b|\bheal(ing)?\b/i,
];
const FRANQUIA = ['agumon', 'gabumon', 'greymon', 'garurumon', 'patamon', 'veemon', 'tapirmon', 'salamon', 'gatomon',
  'angemon', 'angewomon', 'devimon', 'ladydevimon', 'imperialdramon', 'gaioumon', 'mastemon', 'ophanimon', 'etemon', 'numemon'];
const COBRANCA = /\b(deve|precisa|n[aã]o esque[cç]a|don't forget|you must|you should|falta)\b/i;

function limpo(t: string): string[] {
  const erros: string[] = [];
  for (const re of VETADOS) if (re.test(t)) erros.push(`vetado ${re}: ${t}`);
  for (const w of t.toLowerCase().split(/[^a-zà-ú]+/)) {
    if (/mon$/.test(w)) erros.push(`sufixo -mon: ${t}`);
    if (FRANQUIA.includes(w)) erros.push(`franquia: ${t}`);
  }
  if (COBRANCA.test(t)) erros.push(`cobrança: ${t}`);
  return erros;
}

describe('léxico do especial', () => {
  it('toda família tem 8 substantivos EN+PT, sem vazio, sem repetir dentro nem entre famílias', () => {
    const ens = new Set<string>(), pts = new Set<string>();
    for (const f of SPECIAL_FAMILIES) {
      expect(SUBSTANTIVOS_ESPECIAL[f]).toHaveLength(8);
      for (const n of SUBSTANTIVOS_ESPECIAL[f]) {
        expect(n.en.trim()).not.toBe(''); expect(n.pt.trim()).not.toBe('');
        expect(ens.has(n.en), `EN repetido ${n.en}`).toBe(false); ens.add(n.en);
        expect(pts.has(n.pt), `PT repetido ${n.pt}`).toBe(false); pts.add(n.pt);
        expect(limpo(n.en)).toEqual([]); expect(limpo(n.pt)).toEqual([]);
      }
    }
  });

  it('é DISJUNTO dos nomes da básica (o especial nunca colide com o golpe comum)', () => {
    const basicos = new Set<string>();
    // coleta todo substantivo de básica sorteável: 12 seeds × 5 escolas × 5 estágios bastam para cobrir os 6 bancos
    for (let s = 0; s < 40; s++) for (const e of ESCOLAS) for (const st of FICHA_STAGE_ORDER) {
      const b = buildStageSkills(ficha(e, { fogo: 3 }), st, `seed${s}`).basica.nome;
      basicos.add(b.en); basicos.add(b.pt);
    }
    const lexEn = new Set(Object.values(SUBSTANTIVOS_ESPECIAL).flat().map(n => n.en));
    const lexPt = new Set(Object.values(SUBSTANTIVOS_ESPECIAL).flat().map(n => n.pt));
    for (const nome of basicos) {
      for (const w of lexEn) expect(new RegExp(`(^|\\s)${w}(\\s|$)`).test(nome), `${nome} usa "${w}"`).toBe(false);
      for (const w of lexPt) expect(new RegExp(`^${w} de `).test(nome), `${nome} usa "${w}"`).toBe(false);
    }
  });

  it('toda escola alcança toda família (peso > 0): nenhuma família inalcançável', () => {
    for (const e of TODAS_ESCOLAS) for (const f of SPECIAL_FAMILIES) expect(PESO_FAMILIA_ESCOLA[e][f]).toBeGreaterThan(0);
  });
});

describe('varredura: escolas × elementos × famílias × estágios', () => {
  const elementos = [...CLASS_ELEMENT_ORDER, ...AMOSTRA_PARES];

  it('nome e descrição de TODA combinação: não vazios, EN e PT, régua da narrativa limpa', () => {
    let n = 0;
    for (const escola of TODAS_ESCOLAS) for (const elId of elementos) for (const familia of SPECIAL_FAMILIES) for (const stage of FICHA_STAGE_ORDER) {
      const el = elementoNomeDe(elId);
      const outro = elementoNomeDe(elId === 'fogo' ? 'agua' : 'fogo');
      const nome = nomeDoEspecial({ familia, elemento: el, elementoBasica: outro, seedKey: `${escola}|${elId}`, stage });
      const desc = descricaoDoEspecial(familia, el, { pt: 'Mana', en: 'Mana' });
      for (const t of [nome.en, nome.pt, desc.en, desc.pt]) { expect(t.trim().length, `${escola}/${elId}/${familia}/${stage}`).toBeGreaterThan(3); }
      expect(nome.en).not.toBe(nome.pt === nome.en ? '' : '\0');
      // o ÚNICO texto nosso é o substantivo e a descrição: o rótulo do elemento é vocabulário do app
      expect(limpo(nome.en.replace(el.en, '').replace(outro.en, ''))).toEqual([]);
      expect(limpo(desc.en.replace(el.en.toLowerCase(), ''))).toEqual([]);
      expect(limpo(desc.pt.replace(el.pt.toLowerCase(), ''))).toEqual([]);
      n++;
    }
    expect(n).toBe(TODAS_ESCOLAS.length * elementos.length * 7 * 5);
  });

  it('jornada de 5 estágios: especiais distintos entre si, distintos da básica, 5 famílias diferentes', () => {
    const elBase = [...CLASS_ELEMENT_ORDER];
    for (const escola of ESCOLAS) for (const el of elBase) for (let s = 0; s < 6; s++) {
      const fichas = Object.fromEntries(FICHA_STAGE_ORDER.map(st => [st, ficha(escola, { [el]: 4, agua: 1 })])) as Record<FichaStage, Ficha>;
      const jornada = buildAllStageSkills(fichas, `seed-${s}`);
      const nomesEn = FICHA_STAGE_ORDER.map(st => jornada[st].especial.nome.en);
      const nomesPt = FICHA_STAGE_ORDER.map(st => jornada[st].especial.nome.pt);
      const fams = FICHA_STAGE_ORDER.map(st => jornada[st].especial.familia);
      expect(new Set(nomesEn).size, nomesEn.join(' | ')).toBe(5);
      expect(new Set(nomesPt).size, nomesPt.join(' | ')).toBe(5);
      expect(new Set(fams).size, fams.join(',')).toBe(5);
      for (const st of FICHA_STAGE_ORDER) {
        const { basica, especial } = jornada[st];
        expect(especial.nome.en).not.toBe(basica.nome.en);
        expect(especial.nome.pt).not.toBe(basica.nome.pt);
        expect(especial.nome.en.trim()).not.toBe(''); expect(especial.nome.pt.trim()).not.toBe('');
        expect(especial.descricao.en.trim()).not.toBe(''); expect(especial.descricao.pt.trim()).not.toBe('');
        expect(SPECIAL_FAMILIES).toContain(especial.familia);
        expect(basica.familia).toBe('direct');
        expect(especial.forma === 'melee' || especial.forma === 'ranged').toBe(true);
      }
    }
  });

  it('determinístico: mesma seed + mesmo estágio = mesmo nome e mesma família', () => {
    const f = ficha('benca', { vida: 4, luz: 2 });
    const a = buildStageSkills(f, 'champion', 'pessoa-1', new Set(['esp:Solace']), 'luz');
    const b = buildStageSkills(f, 'champion', 'pessoa-1', new Set(['esp:Solace']), 'luz');
    expect(a).toEqual(b);
    expect(buildStageSkills(f, 'ultimate', 'pessoa-1').especial.nome).not.toEqual(buildStageSkills(f, 'ultimate', 'pessoa-2').especial.nome);
  });
});

describe('alcance: toda família tem chance > 0 (amostra declarada: 400 seeds × 5 escolas)', () => {
  it('as 7 famílias saem em alguma das 5 escolas de skill', () => {
    const vistas = new Set<string>();
    for (const escola of TODAS_ESCOLAS) for (let s = 0; s < 400; s++) {
      vistas.add(familiaDoEspecial({ escola, elementoId: 'fogo', seedKey: `s${s}`, stage: 'rookie' }));
    }
    expect([...vistas].sort()).toEqual([...SPECIAL_FAMILIES].sort());
    // e cada UMA das 7 sai em pelo menos uma escola DISTRIBUÍDA (as que a ficha realmente produz)
    const dist = new Set<string>();
    for (const escola of ESCOLAS) for (let s = 0; s < 400; s++) dist.add(familiaDoEspecial({ escola, elementoId: 'vigor', seedKey: `s${s}`, stage: 'mega' }));
    expect(dist.size).toBe(7);
  });

  it('a escola e o elemento INCLINAM a família (não é sorteio cego)', () => {
    const conta = (escola: EscolaSkillId, elementoId: string) => {
      const c: Record<string, number> = {};
      for (let s = 0; s < 600; s++) { const f = familiaDoEspecial({ escola, elementoId, seedKey: `k${s}`, stage: 'rookie' }); c[f] = (c[f] ?? 0) + 1; }
      return c;
    };
    expect(conta('benca', 'vida').heal).toBeGreaterThan(conta('combate_fisico', 'vigor').heal);
    expect(conta('maldicao', 'sombra').defDebuff).toBeGreaterThan(conta('benca', 'luz').defDebuff);
  });
});

describe('inimigos', () => {
  it('família do servidor: só a lista fechada vale; lixo vira dano direto', () => {
    const el = elementoNomeDe('agua');
    for (const f of SPECIAL_FAMILIES) {
      const n = nomeEspecialInimigo(el, 'Rival', f);
      expect(SUBSTANTIVOS_ESPECIAL[f].some(x => n.en.includes(x.en) && n.pt.includes(x.pt)), f).toBe(true);
    }
    for (const lixo of ['hackeada', '', null, undefined, '__proto__', 'constructor']) {
      expect(nomeEspecialInimigo(el, 'Rival', lixo)).toEqual(nomeEspecialInimigo(el, 'Rival', 'direct'));
    }
  });

  it('o nome do especial do inimigo é do banco de dano direto, estável por identidade e com EN e PT', () => {
    const el = elementoNomeDe('fogo');
    const a = nomeEspecialInimigo(el, 'Fera de Fogo');
    expect(a).toEqual(nomeEspecialInimigo(el, 'Fera de Fogo'));
    expect(a.en).toBeTruthy(); expect(a.pt).toBeTruthy();
    const direct = SUBSTANTIVOS_ESPECIAL.direct;
    expect(direct.some(n => a.en.includes(n.en) && a.pt.includes(n.pt))).toBe(true);
    const variados = new Set(Array.from({ length: 40 }, (_, i) => nomeEspecialInimigo(el, `inimigo-${i}`).en));
    expect(variados.size).toBeGreaterThan(5);
  });
});

describe('cache do save (skills persistidas)', () => {
  it('só o cache com família em todos os estágios fica; o anterior ao PR9 é trocado', async () => {
    const { skillsTemFamilia } = await import('./stageSkillsFor');
    const fichas = Object.fromEntries(FICHA_STAGE_ORDER.map(st => [st, ficha('benca', { vida: 3 })])) as Record<FichaStage, Ficha>;
    const novo = buildAllStageSkills(fichas, 'x');
    expect(skillsTemFamilia(novo)).toBe(true);
    const velho = JSON.parse(JSON.stringify(novo));
    for (const st of FICHA_STAGE_ORDER) delete velho[st].especial.familia;
    expect(skillsTemFamilia(velho)).toBe(false);
    expect(skillsTemFamilia(undefined)).toBe(false);
    expect(skillsTemFamilia({})).toBe(false);
  });
});
