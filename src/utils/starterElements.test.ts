// REGISTRO §75 — cada inicial grátis usa UM elemento base, e os golpes, o FX e o tipo exibido seguem esse elemento.
import { describe, it, expect } from 'vitest';
import { STARTER_IDS } from './sprites';
import { STARTER_ELEMENT, STARTER_ALIGNMENT, starterElementOf, petElementOf } from './starterElements';
import { starterSkillsFor, STARTER_SCHOOL, STARTER_MOVES } from './starterSkills';
import { PREMADE_CHARACTERS } from './monetization';
import { VISUAL_ELEMENTS, fxElementId, fxFrame, FX_FALLBACK_ELEMENT, elementStrikeForm } from './combatFx';
import { fighterIdentity } from './fighterIdentity';
import { stageSkillsFor } from './soulProfile/ficha/stageSkillsFor';
import { SCHOOL_STRIKE_FORM } from './soulProfile/ficha/strikeForm';
import { SUBSTANTIVOS_ESPECIAL } from './soulProfile/ficha/nomeEspecial';
import { baseElementLabel } from './soulProfile/essenceLabels';
import { FICHA_STAGE_ORDER } from './soulProfile/ficha/types';

const PEDIDO: Record<string, string> = { industrial: 'terra', nascente: 'som', alento: 'ar', vida: 'vida', meteoro: 'fogo' };
const PODER = ['vileza', 'morte', 'sombra', 'fogo', 'vigor', 'marcial'];
const HARMONIA = ['arcano', 'tempo', 'espaco', 'gravidade', 'som', 'eletricidade'];
const BENEVOLENCIA = ['vida', 'luz', 'agua', 'terra', 'ar'];

describe('elemento dos 5 iniciais', () => {
  it('terra, som, ar, vida e fogo — como o dono pediu (tartaruga, pato, borboleta, planta, vermelho)', () => {
    expect({ ...STARTER_ELEMENT }).toEqual(PEDIDO);
    for (const id of STARTER_IDS) expect(starterElementOf(id)).toBe(PEDIDO[id]);
    expect(starterElementOf('kaelen')).toBeUndefined();
    expect(starterElementOf(undefined)).toBeUndefined();
  });

  it('é um dos 17 base, tem FX próprio (sem cair no neutro) e o alinhamento bate com a divisão do jogo', () => {
    for (const id of STARTER_IDS) {
      const el = STARTER_ELEMENT[id];
      expect(VISUAL_ELEMENTS).toContain(el);
      expect(fxElementId(el)).toBe(el);
      expect(fxElementId(el)).not.toBe(FX_FALLBACK_ELEMENT);
      for (const st of ['orb', 'impact', 'cast', 'aura'] as const) expect(fxFrame(el, st)).toBeTruthy();
      const grupo = STARTER_ALIGNMENT[id] === 'poder' ? PODER : STARTER_ALIGNMENT[id] === 'harmonia' ? HARMONIA : BENEVOLENCIA;
      expect(grupo).toContain(el);
    }
  });

  it('o tipo exibido (PT/EN) é o nome do elemento', () => {
    for (const c of PREMADE_CHARACTERS) {
      expect(c.typePt).toBe(baseElementLabel(STARTER_ELEMENT[c.id], true));
      expect(c.typeEn).toBe(baseElementLabel(STARTER_ELEMENT[c.id], false));
    }
  });

  it('petElementOf: o inicial manda; sem inicial, o dominante do oráculo', () => {
    expect(petElementOf({ demoCharacterId: 'industrial', soulmonMeta: { dominantElement: 'agua' } })).toBe('terra');
    expect(petElementOf({ soulmonMeta: { dominantElement: 'agua' } })).toBe('agua');
    expect(petElementOf({ demoCharacterId: 'kaelen' })).toBeUndefined();
  });
});

describe('golpes dos iniciais (básica e especial do elemento)', () => {
  it('as duas skills, nos 5 estágios, são do elemento do inicial, com nome PT e EN e selo próprio', () => {
    for (const id of STARTER_IDS) {
      const el = STARTER_ELEMENT[id];
      const skills = starterSkillsFor(id);
      expect(skillsOk(skills)).toBe(true);
      for (const st of FICHA_STAGE_ORDER) {
        const par = skills[st];
        expect(par.basica.elementoId).toBe(el);
        expect(par.especial.elementoId).toBe(el);
        expect(par.elementoDominante?.id).toBe(el);
        for (const s of [par.basica, par.especial]) {
          expect(s.nome.pt.length).toBeGreaterThan(2);
          expect(s.nome.en.length).toBeGreaterThan(2);
          expect(s.escolaId).toBe(STARTER_SCHOOL[id].escola);
        }
        expect(par.basica.nome).toEqual(STARTER_MOVES[id].basica);
        expect(par.especial.nome).toEqual(STARTER_MOVES[id].especial);
      }
    }
  });

  it('fighterIdentity: o elemento do inicial e a forma da TABELA DO ELEMENTO (ELEMENT_STRIKE_FORM) nos dois golpes', () => {
    for (const id of STARTER_IDS) {
      const par = stageSkillsFor(starterSkillsFor(id), 'rookie');
      const ident = fighterIdentity(par, STARTER_ELEMENT[id]);
      expect(ident.basico.elemento).toBe(STARTER_ELEMENT[id]);
      expect(ident.especial.elemento).toBe(STARTER_ELEMENT[id]);
      expect(ident.basico.forma).toBe(elementStrikeForm(STARTER_ELEMENT[id], 'basica'));
      expect(ident.especial.forma).toBe(elementStrikeForm(STARTER_ELEMENT[id], 'especial'));
    }
    // pedido do dono: Crato (terra) especial à distância; Bolid (fogo) especial corpo a corpo
    expect(fighterIdentity(starterSkillsFor('industrial').rookie, 'terra').especial.forma).toBe('ranged');
    expect(fighterIdentity(starterSkillsFor('meteoro').rookie, 'fogo').especial.forma).toBe('melee');
  });

  it('a regra só vale para os iniciais: skill de ficha comum segue a escola', () => {
    const par = JSON.parse(JSON.stringify(starterSkillsFor('industrial').rookie));
    delete par.basica.formaDoElemento; delete par.especial.formaDoElemento;
    expect(fighterIdentity(par, 'terra').especial.forma).toBe(SCHOOL_STRIKE_FORM[STARTER_SCHOOL.industrial.escola].especial);
  });

  it('nomes autorais: 10 nomes distintos, PT e EN, sem colidir com o léxico automático dos especiais', () => {
    const todos = STARTER_IDS.flatMap(id => [STARTER_MOVES[id].basica, STARTER_MOVES[id].especial]);
    expect(new Set(todos.map(n => n.pt)).size).toBe(10);
    expect(new Set(todos.map(n => n.en)).size).toBe(10);
    const lex = Object.values(SUBSTANTIVOS_ESPECIAL).flat();
    for (const n of todos) {
      expect(n.pt.length).toBeLessThanOrEqual(26);
      expect(n.en.length).toBeLessThanOrEqual(26);
      for (const l of lex) {
        expect(n.pt.toLowerCase().split(/\s+/)).not.toContain(l.pt.toLowerCase());
        expect(n.en.toLowerCase().split(/\s+/)).not.toContain(l.en.toLowerCase());
      }
    }
  });

  it('sem a ficha (save que ainda não carregou), o inicial luta com o elemento dele, nunca no neutro', () => {
    for (const id of STARTER_IDS) {
      const ident = fighterIdentity(undefined, petElementOf({ demoCharacterId: id }));
      expect(ident.basico.elemento).toBe(STARTER_ELEMENT[id]);
      expect(ident.especial.elemento).toBe(STARTER_ELEMENT[id]);
    }
  });

  it('é determinístico (mesma saída em duas chamadas)', () => {
    for (const id of STARTER_IDS) expect(starterSkillsFor(id)).toEqual(starterSkillsFor(id));
  });
});

function skillsOk(s: ReturnType<typeof starterSkillsFor>): boolean {
  return FICHA_STAGE_ORDER.every(st => !!s[st]?.basica && !!s[st]?.especial && typeof s[st].especial.familia === 'string' && !!s[st].especial.lex);
}
