/**
 * MANIFESTAÇÃO da ficha (Fase 3 do Oráculo, PLANO-ORACULO.md §3): talento →
 * fala, profissão → masmorra. "Nenhum cálculo novo sem manifestação" — então
 * a régua é que TODO talento e TODA profissão do snapshot tenham a sua, e
 * que nenhuma fala cobre (mesma lista de `petVoice.test.ts`).
 */
import { describe, it, expect } from 'vitest';
import { CLASS_DATA } from './buildSheet';
import { manifestacaoDaFicha, profissaoDaFicha, sanitizeManifestacao, talentoDominante } from './manifestacao';
import { buildFichaESkills } from './fromInput';
import { buildSoulProfile } from '../profile';
import { TALENTO_LINES, TALENTO_VOICE_RATE, talentoLine } from '../../talentoVoice';
import { JEITO_PADRAO, PROFISSAO_MASMORRA, fraseDaProfissao, jeitoDaProfissao } from '../../profissaoMasmorra';
import { FICHA_STAGE_ORDER, type Ficha } from './types';
import type { OracleInput } from '../../oracle';

const PROIBIDAS_PT = [
  'deveria', 'devia', 'atrasou', 'atrasad', 'falhou', 'falha', 'esqueceu',
  'finalmente', 'até que enfim', 'preguiç', 'desculpa', 'culpa', 'perdeu',
];
const PROIBIDAS_EN: RegExp[] = [
  /should/, /late/, /failed/, /failure/, /you forgot/, /finally/, /at last/,
  /lazy/, /excuse/, /guilt/, /lost/,
];
const EMOJI = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/u;

const REFERENCE_DAY = new Date('2026-09-28T12:00:00Z');
function makeInput(nome: string): OracleInput {
  const soulProfile = buildSoulProfile({
    fullName: nome, birthDate: '1991-03-12', birthTime: '08:20', timeUnknown: false,
    placeLabel: 'Curitiba - PR, BR', latitude: -25.4284, longitude: -49.2733, timeZone: 'America/Sao_Paulo',
  }, {}, REFERENCE_DAY);
  return {
    fullName: nome, birthDate: '1991-03-12', birthTime: '08:20', birthPlace: 'Curitiba - PR, BR',
    answers: { grupo: 'protege', objetivo: 'cuidar', pressao: 'firme' }, soulProfile,
  };
}

describe('talento dominante e profissão — determinísticos pela ficha', () => {
  it('maior rank vence; empate cai no menor id — nunca na ordem de inserção', () => {
    expect(talentoDominante({ talentos: { salto: 2, rajada: 3 } } as Pick<Ficha, 'talentos'>)).toBe('rajada');
    expect(talentoDominante({ talentos: { salto: 2, egide: 2 } } as Pick<Ficha, 'talentos'>)).toBe('egide');
    expect(talentoDominante({ talentos: { egide: 2, salto: 2 } } as Pick<Ficha, 'talentos'>)).toBe('egide');
    expect(talentoDominante({ talentos: {} } as Pick<Ficha, 'talentos'>)).toBeNull();
    expect(profissaoDaFicha({ profissoes: { ferreiro: 6 } } as Pick<Ficha, 'profissoes'>)).toBe('ferreiro');
    expect(profissaoDaFicha({ profissoes: {} } as Pick<Ficha, 'profissoes'>)).toBeNull();
  });

  it('numa ficha real, todo estágio tem talento e profissão, e a profissão é a mesma nos 5', () => {
    const { fichaByStage } = buildFichaESkills(makeInput('Manifesta Ficha'), 'manifesta-ficha');
    const m = manifestacaoDaFicha(fichaByStage);
    const profissoes = new Set(FICHA_STAGE_ORDER.map(s => m[s].profissao));
    expect(profissoes.size).toBe(1);
    for (const s of FICHA_STAGE_ORDER) {
      expect(m[s].talento, s).toBeTruthy();
      // o nome do ofício vem pronto, PT do snapshot + EN próprio
      expect(m[s].profissaoNome?.pt).toBe(CLASS_DATA.profissoes[m[s].profissao as keyof typeof CLASS_DATA.profissoes].nome);
      expect(m[s].profissaoNome?.en).toBeTruthy();
      expect(m[s].profissaoNome?.en).not.toBe(m[s].profissaoNome?.pt);
      expect(TALENTO_LINES[m[s].talento!], `talento '${m[s].talento}' sem fala`).toBeTruthy();
      expect(PROFISSAO_MASMORRA[m[s].profissao!], `profissão '${m[s].profissao}' sem jeito`).toBeTruthy();
    }
  });

  it('o que vem do save é higienizado: forma errada vira undefined, campo faltando vira null', () => {
    expect(sanitizeManifestacao(null)).toBeUndefined();
    expect(sanitizeManifestacao([])).toBeUndefined();
    expect(sanitizeManifestacao({ rookie: { talento: 'x' } })).toBeUndefined();
    const ok = Object.fromEntries(FICHA_STAGE_ORDER.map(s => [s, { talento: 'salto', profissao: 7 }]));
    const m = sanitizeManifestacao(ok)!;
    expect(m.mega).toEqual({ talento: 'salto', profissao: null, profissaoNome: null });
  });
});

describe('talento → fala (todo talento do snapshot tem a sua, e nenhuma cobra)', () => {
  const ids = Object.keys(CLASS_DATA.talentos);

  it('65/65 com par PT+EN, sem emoji, curta', () => {
    expect(ids.length).toBeGreaterThanOrEqual(65);
    for (const id of ids) {
      const l = TALENTO_LINES[id];
      expect(l, `talento '${id}' sem fala`).toBeTruthy();
      expect(l.pt.trim().length).toBeGreaterThan(0);
      expect(l.en.trim().length).toBeGreaterThan(0);
      expect(l.pt).not.toMatch(EMOJI);
      expect(l.en).not.toMatch(EMOJI);
      expect(l.pt.split(' ').length, `PT longa demais em '${id}'`).toBeLessThanOrEqual(12);
      expect(l.en.split(' ').length, `EN longa demais em '${id}'`).toBeLessThanOrEqual(14);
    }
    // e nenhuma fala órfã: id que não existe no snapshot
    for (const id of Object.keys(TALENTO_LINES)) expect(ids, `fala sem talento: '${id}'`).toContain(id);
  });

  it('nenhuma frase cobra (a mesma régua de petVoice) nem tem a PESSOA como sujeito', () => {
    for (const [id, l] of Object.entries(TALENTO_LINES)) {
      for (const p of PROIBIDAS_PT) expect(l.pt.toLowerCase(), `${id} PT: '${p}'`).not.toContain(p);
      for (const p of PROIBIDAS_EN) expect(l.en.toLowerCase(), `${id} EN: ${p}`).not.toMatch(p);
      // L1/L2: a criatura fala de si — "você é/fez" não entra
      expect(l.pt, `${id} PT fala da pessoa`).not.toMatch(/\bvocê (é|fez|deixou|não)/i);
      expect(l.en, `${id} EN fala da pessoa`).not.toMatch(/\byou (are|did|didn|were)/i);
    }
  });

  it('a taxa é uma fração fixa, e sem talento a fala é undefined (cai na escada genérica)', () => {
    expect(TALENTO_VOICE_RATE).toBeGreaterThan(0);
    expect(TALENTO_VOICE_RATE).toBeLessThan(0.5);
    expect(talentoLine(null, true)).toBeUndefined();
    expect(talentoLine('nao_existe', true)).toBeUndefined();
    expect(talentoLine('salto', true)).toBe(TALENTO_LINES.salto.pt);
    expect(talentoLine('salto', false)).toBe(TALENTO_LINES.salto.en);
  });
});

describe('profissão → jeito na masmorra (11/11, leve, e nunca economia)', () => {
  const ids = Object.keys(CLASS_DATA.profissoes);

  it('toda profissão do snapshot tem jeito + frase PT/EN, e nenhuma órfã', () => {
    expect(ids.length).toBe(11);
    for (const id of ids) {
      const p = PROFISSAO_MASMORRA[id];
      expect(p, `profissão '${id}' sem jeito`).toBeTruthy();
      expect(Object.keys(p.jeito).length, `'${id}' não muda nada`).toBeGreaterThan(0);
      expect(p.frase.pt.length).toBeGreaterThan(0);
      expect(p.frase.en.length).toBeGreaterThan(0);
      expect(fraseDaProfissao(id, true)).toBe(p.frase.pt);
      expect(fraseDaProfissao(id, false)).toBe(p.frase.en);
    }
    for (const id of Object.keys(PROFISSAO_MASMORRA)) expect(ids).toContain(id);
  });

  it('cada jeito move de LEVE: multiplicadores entre 0,85 e 1,15, nunca um novo campo de economia', () => {
    const chavesPermitidas = new Set(Object.keys(JEITO_PADRAO));
    for (const [id, p] of Object.entries(PROFISSAO_MASMORRA)) {
      for (const [k, v] of Object.entries(p.jeito)) {
        expect(chavesPermitidas.has(k), `'${id}' inventou '${k}'`).toBe(true);
        if (k === 'hp' || k === 'dmg' || k === 'velocidadeAtaque' || k === 'velocidadeDefesa') {
          expect(v).toBeGreaterThanOrEqual(0.85);
          expect(v).toBeLessThanOrEqual(1.15);
        }
      }
    }
    expect(chavesPermitidas.has('bits')).toBe(false);
    expect(chavesPermitidas.has('drop')).toBe(false);
  });

  it('sem profissão (ou desconhecida) o jeito é exatamente o padrão — a masmorra de sempre', () => {
    expect(jeitoDaProfissao(undefined)).toEqual(JEITO_PADRAO);
    expect(jeitoDaProfissao(null)).toEqual(JEITO_PADRAO);
    expect(jeitoDaProfissao('nao_existe')).toEqual(JEITO_PADRAO);
    expect(jeitoDaProfissao('ferreiro')).toEqual({ ...JEITO_PADRAO, hp: 1.15 });
    expect(fraseDaProfissao(null, true)).toBeUndefined();
  });
});
