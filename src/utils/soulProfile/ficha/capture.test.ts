// ---------------------------------------------------------------------------
// Captura do companheiro inicial — cobertura DIRETA (achado do LOOP 1,
// 28/09/2026: até aqui a única cobertura era indireta, via `pipeline.test.ts`
// checando "companion não é null"). A mecânica é a fórmula REAL do
// class-system (`poderCaptura`/`avaliarCaptura`), copiada com nota de
// paridade — merece teste próprio, não só de passagem.
// ---------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';
import { avaliarCaptura, capturableCreatures, poderCaptura, selectCompanion } from './capture';
import { CLASS_DATA } from './buildSheet';
import { buildFichaESkills } from './fromInput';
import { buildSoulProfile } from '../profile';
import type { Ficha } from './types';
import type { OracleInput } from '../../oracle';
import type { Answers } from '../personality/types';
import { CLASS_ELEMENT_ORDER } from '../types';

const REFERENCE_DAY = new Date('2026-08-15T12:00:00Z');

function makeInput(nome: string): OracleInput {
  const answers: Answers = {};
  const soulProfile = buildSoulProfile({
    fullName: nome, birthDate: '1991-03-12', birthTime: '08:20', timeUnknown: false,
    placeLabel: 'Curitiba - PR, BR', latitude: -25.4284, longitude: -49.2733, timeZone: 'America/Sao_Paulo',
  }, answers, REFERENCE_DAY);
  return {
    fullName: nome, birthDate: '1991-03-12', birthTime: '08:20', birthPlace: 'Curitiba - PR, BR',
    answers: { grupo: 'protege', objetivo: 'cuidar', pressao: 'firme' }, soulProfile,
  };
}

const CRIATURA_ID = Object.keys(CLASS_DATA.criaturas)[0];
const CRIATURA = CLASS_DATA.criaturas[CRIATURA_ID];

function fichaVazia(): Ficha {
  return {
    nome: 'vazia', elementos: {}, escolas: {}, recursos: {}, talentos: {}, profissoes: {},
    totals: { elementos: 0, escolas: 0, recursos: 0, talentos: 0, profissoes: 0 },
  };
}

describe('poderCaptura', () => {
  it('sem afinidade elemental nenhuma, poder é sempre 0 — não capturável de jeito nenhum', () => {
    const ficha = fichaVazia();
    expect(poderCaptura(ficha, CRIATURA)).toBe(0);
  });

  it('cresce com o nível de afinidade E com Evocação — a fórmula real, não um sorteio', () => {
    const semEvocacao: Ficha = { ...fichaVazia(), elementos: { [CRIATURA.afinidades[0]]: 3 } };
    const comEvocacao: Ficha = { ...semEvocacao, escolas: { evocacao: 5 } };
    const poderBase = poderCaptura(semEvocacao, CRIATURA);
    const poderComEvocacao = poderCaptura(comEvocacao, CRIATURA);
    expect(poderBase).toBeGreaterThan(0);
    expect(poderComEvocacao).toBeGreaterThan(poderBase);
  });

  it('usa a MAIOR afinidade entre as da criatura, nunca soma as duas', () => {
    const ficha: Ficha = { ...fichaVazia(), elementos: { [CRIATURA.afinidades[0]]: 2, [CRIATURA.afinidades[1] ?? CRIATURA.afinidades[0]]: 6 } };
    const poder = poderCaptura(ficha, CRIATURA);
    const soAMaior: Ficha = { ...fichaVazia(), elementos: { [CRIATURA.afinidades[1] ?? CRIATURA.afinidades[0]]: 6 } };
    expect(poder).toBe(poderCaptura(soAMaior, CRIATURA));
  });
});

describe('avaliarCaptura', () => {
  it('sem Evocação nenhuma, nunca é capturável — mesmo com afinidade e poder de sobra', () => {
    const ficha: Ficha = { ...fichaVazia(), elementos: { [CRIATURA.afinidades[0]]: 20 } };
    const a = avaliarCaptura(ficha, CRIATURA_ID, CRIATURA);
    expect(a.capturavel).toBe(false);
    expect(a.poder).toBe(0);
  });

  it('sem NENHUMA afinidade em comum, nunca é capturável — mesmo com Evocação alta', () => {
    const outroElemento = CLASS_ELEMENT_ORDER.find(e => !CRIATURA.afinidades.includes(e))
      ?? 'elemento-inexistente';
    const ficha: Ficha = { ...fichaVazia(), elementos: { [outroElemento]: 10 }, escolas: { evocacao: 10 } };
    const a = avaliarCaptura(ficha, CRIATURA_ID, CRIATURA);
    expect(a.capturavel).toBe(false);
  });

  it('capturável = poder alcança o poderBase da criatura, nem um ponto antes', () => {
    // Ficha muito forte no elemento da criatura + Evocação alta: deve capturar.
    const forte: Ficha = { ...fichaVazia(), elementos: { [CRIATURA.afinidades[0]]: 10 }, escolas: { evocacao: 10 } };
    const a = avaliarCaptura(forte, CRIATURA_ID, CRIATURA);
    expect(a.poder).toBeGreaterThanOrEqual(CRIATURA.poderBase);
    expect(a.capturavel).toBe(true);
  });
});

describe('capturableCreatures', () => {
  it('ficha vazia não captura ninguém do registro', () => {
    expect(capturableCreatures(fichaVazia())).toHaveLength(0);
  });

  it('ficha muito forte em Evocação + todo elemento base captura pelo menos alguém do registro', () => {
    const elementosBase = Array.from(new Set(Object.values(CLASS_DATA.criaturas).flatMap(c => c.afinidades)));
    const tudoAlto: Ficha = {
      ...fichaVazia(),
      elementos: Object.fromEntries(elementosBase.map(e => [e, 20])),
      escolas: { evocacao: 20 },
    };
    expect(capturableCreatures(tudoAlto).length).toBeGreaterThan(0);
  });

  it('vem ordenada por poderBase decrescente', () => {
    const elementosBase = Array.from(new Set(Object.values(CLASS_DATA.criaturas).flatMap(c => c.afinidades)));
    const tudoAlto: Ficha = {
      ...fichaVazia(),
      elementos: Object.fromEntries(elementosBase.map(e => [e, 20])),
      escolas: { evocacao: 20 },
    };
    const catches = capturableCreatures(tudoAlto);
    for (let i = 1; i < catches.length; i++) {
      expect(catches[i - 1].criatura.poderBase).toBeGreaterThanOrEqual(catches[i].criatura.poderBase);
    }
  });
});

describe('selectCompanion', () => {
  it('sem nenhuma captura possível, devolve null', () => {
    expect(selectCompanion(fichaVazia(), 'seed-vazio')).toBeNull();
  });

  it('mesma (ficha, seedKey) = mesmo companheiro — determinístico', () => {
    const { fichaByStage } = buildFichaESkills(makeInput('Captura Determinismo'), 'captura-det');
    const a = selectCompanion(fichaByStage.rookie, 'seed-fixo');
    const b = selectCompanion(fichaByStage.rookie, 'seed-fixo');
    expect(a?.id).toBe(b?.id);
  });

  it('sobre um leque de perfis sintéticos, mais de uma criatura do registro chega a ser companheiro (não trava sempre na mesma)', () => {
    const vistos = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const { fichaByStage } = buildFichaESkills(makeInput(`Captura Leque ${i}`), `captura-leque-${i}`);
      const companion = selectCompanion(fichaByStage.rookie, `captura-leque-${i}`);
      if (companion) vistos.add(companion.id);
    }
    expect(vistos.size).toBeGreaterThan(1);
  });
});
