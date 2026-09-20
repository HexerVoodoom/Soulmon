// ---------------------------------------------------------------------------
// Classe da criatura: contrato mínimo + cobertura medida sobre vários
// perfis. Segue o mesmo padrão de `pipeline.test.ts` — nome varia entre
// perfis pra sortear eixos diferentes.
// ---------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';
import { computeClassTitle, computeClassTitlesAllStages, CLASS_TITLE_EN } from './classTitle';
import { sigilArt } from '../../sigilArt';
import { buildFichaESkills } from './fromInput';
import { buildSoulProfile } from '../profile';
import { FICHA_STAGE_ORDER, type FichaStage } from './types';
import type { OracleInput } from '../../oracle';
import type { Answers } from '../personality/types';

const REFERENCE_DAY = new Date('2026-08-15T12:00:00Z');

function makeInput(nome: string, comTeste: boolean): OracleInput {
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

describe('computeClassTitle', () => {
  it('devolve PT+EN diferentes, sempre não-vazios, pra todo estágio', async () => {
    const input = makeInput('Classe Teste Um', true);
    const { fichaByStage } = buildFichaESkills(input, 'classe-teste-1');
    for (const stage of FICHA_STAGE_ORDER) {
      const titulo = await computeClassTitle(fichaByStage[stage]);
      expect(titulo.nome.pt.length).toBeGreaterThan(0);
      expect(titulo.nome.en.length).toBeGreaterThan(0);
      expect(titulo.nome.en).not.toBe(titulo.nome.pt);
      expect(['arquetipo', 'diluido', 'generico']).toContain(titulo.origem);
      // o sigilo da classe (canvas Pet, D-P4) sempre aponta para uma arte que existe
      expect(titulo.sigilo, `sigilo de ${stage}`).toBeTruthy();
      expect(sigilArt(titulo.sigilo!), `arte do sigilo ${titulo.sigilo}`).toBeTruthy();
    }
  });

  it('computeClassTitlesAllStages devolve os 5 estágios de uma vez', async () => {
    const input = makeInput('Classe Teste Dois', true);
    const { fichaByStage } = buildFichaESkills(input, 'classe-teste-2');
    const todas = await computeClassTitlesAllStages(fichaByStage);
    expect(Object.keys(todas).sort()).toEqual([...FICHA_STAGE_ORDER].sort());
  });

  it('é determinístico: mesma ficha = mesma classe', async () => {
    const input = makeInput('Classe Teste Três', true);
    const { fichaByStage } = buildFichaESkills(input, 'classe-teste-3');
    const a = await computeClassTitle(fichaByStage.ultra);
    const b = await computeClassTitle(fichaByStage.ultra);
    expect(a).toEqual(b);
  });

  it('cobertura: sobre vários perfis, o ultra alcança arquétipo pleno com frequência real (não é inatingível)', async () => {
    const contagem: Record<FichaStage, Record<string, number>> = {
      rookie: {}, champion: {}, ultimate: {}, mega: {}, ultra: {},
    };
    const N = 24;
    for (let i = 0; i < N; i++) {
      const input = makeInput(`Classe Cobertura ${i}`, i % 2 === 0);
      const { fichaByStage } = buildFichaESkills(input, `classe-cobertura-${i}`);
      for (const stage of FICHA_STAGE_ORDER) {
        const titulo = await computeClassTitle(fichaByStage[stage]);
        contagem[stage][titulo.origem] = (contagem[stage][titulo.origem] ?? 0) + 1;
      }
    }
    // Medido (24 perfis, metade com teste longo): rookie/champion/ultimate
    // ficam no fallback (a ficha ainda não concentrou o bastante pra bater
    // limiar de arquétipo — condição mais leve é elementos:8, a maioria
    // pede 10-20); mega e ultra SEMPRE alcançam arquétipo pleno — os
    // orçamentos (300/500) e o FOCUS_EXPONENT dos estágios altos concentram
    // o bastante. É a mesma escada "rookie–ultimate só bases, mega quase
    // destravando, ultra destrava" que a cascata de pares já tem.
    expect(contagem.rookie.arquetipo ?? 0).toBe(0);
    expect(contagem.mega.arquetipo).toBe(N);
    expect(contagem.ultra.arquetipo).toBe(N);
  });
});

describe('paridade da tradução EN dos arquétipos (antídoto do footgun 9)', () => {
  it('todo arquétipo real do class-system tem tradução EN, e nenhuma tradução é órfã', async () => {
    const { ARQUETIPOS } = await import('class-system');
    const idsReais = new Set(Object.keys(ARQUETIPOS));
    const idsTraduzidos = new Set(Object.keys(CLASS_TITLE_EN));
    for (const id of idsReais) {
      expect(idsTraduzidos.has(id), `arquétipo "${id}" sem tradução EN em CLASS_TITLE_EN`).toBe(true);
    }
    for (const id of idsTraduzidos) {
      expect(idsReais.has(id), `CLASS_TITLE_EN tem "${id}", que não existe mais no class-system`).toBe(true);
    }
  });
});
