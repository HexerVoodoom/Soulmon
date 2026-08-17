// ---------------------------------------------------------------------------
// Contratos do pipeline completo: leitura → ficha → bestiário → criatura.
// O que quebraria em silêncio se alguém mexesse numa ponta sem olhar a outra.
// ---------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';
import { generateOracleComplete } from './pipeline';
import { buildSoulProfile } from './profile';
import { CLASS_DATA, STAGE_MULTIPLIER, ROOKIE_BUDGET } from './ficha/buildSheet';
import { FICHA_STAGE_ORDER } from './ficha/types';
import { poderCaptura } from './ficha/capture';
import { BESTIARY_POOL, BESTIARY_PROVENANCE } from './bestiary/select';
import { DERIVED_ELEMENT_PAIRS, BASE_ELEMENT_LABELS } from './derivedElements';
import { essenceHasEn, PROFISSAO_EN } from './essenceLabels';
import type { OracleInput } from '../oracle';
import type { Answers } from './personality/types';
import { items } from './personality/questions';

const REFERENCE_DAY = new Date('2026-08-15T12:00:00Z');

function makeInput(nome: string, quiz: Record<string, string>, comTeste = false): OracleInput {
  const answers: Answers = {};
  if (comTeste) {
    for (const item of items) {
      if (item.kind === 'likert' || item.kind === 'frequency') answers[item.id] = { kind: 'likert', value: 4 };
      else if (item.kind === 'forced-choice') answers[item.id] = { kind: 'forced-choice', choice: 'b' };
      else if (item.kind === 'scenario') answers[item.id] = { kind: 'scenario', optionId: item.options[1].id };
    }
  }
  const soulProfile = buildSoulProfile({
    fullName: nome, birthDate: '1991-03-12', birthTime: '08:20', timeUnknown: false,
    placeLabel: 'Curitiba - PR, BR', latitude: -25.4284, longitude: -49.2733, timeZone: 'America/Sao_Paulo',
  }, answers, REFERENCE_DAY);
  return { fullName: nome, birthDate: '1991-03-12', birthTime: '08:20', birthPlace: 'Curitiba - PR, BR', answers: quiz, soulProfile };
}

const QUIZ = { grupo: 'protege', objetivo: 'cuidar', pressao: 'firme' };

describe('pipeline completo do oráculo', () => {
  it('é determinístico: mesma entrada e seed = mesma ficha, mesmo bicho, mesma inspiração', () => {
    const input = makeInput('Mateus Sperandio', QUIZ, true);
    const a = generateOracleComplete(input, 77);
    const b = generateOracleComplete(input, 77);
    expect(a.result.creature.baseName).toBe(b.result.creature.baseName);
    expect(a.bestiaryPick.creature.nome).toBe(b.bestiaryPick.creature.nome);
    expect(a.fichaByStage.ultra).toEqual(b.fichaByStage.ultra);
  });

  it('reroll (seed nova) troca a criatura, NUNCA a ficha — a ficha é quem a pessoa é', () => {
    const input = makeInput('Mateus Sperandio', QUIZ, true);
    const a = generateOracleComplete(input, 1);
    const b = generateOracleComplete(input, 2);
    expect(a.fichaByStage.rookie).toEqual(b.fichaByStage.rookie);
    expect(a.fichaByStage.ultra).toEqual(b.fichaByStage.ultra);
    expect(a.companion?.id).toBe(b.companion?.id);
  });

  it('o NOME da criatura do bestiário nunca aparece em prompt, nome ou bio', () => {
    // A inspiração é interna. O corpus tem nomes de franquia (o dono decidiu
    // que tudo bem PORQUE não sai no prompt final) — este teste é essa regra.
    for (const seed of [3, 14, 62, 240]) {
      const input = makeInput(`Pessoa Teste ${seed}`, QUIZ, seed % 2 === 0);
      const { result, bestiaryPick } = generateOracleComplete(input, seed);
      const nome = bestiaryPick.creature.nome.toLowerCase();
      expect(result.creature.baseName.toLowerCase()).not.toContain(nome);
      const bioTudo = `${result.creature.bio.pt} ${result.creature.bio.en}`.toLowerCase();
      expect(bioTudo).not.toContain(nome);
      for (const stage of result.creature.stages) {
        expect(stage.imagePrompt.toLowerCase()).not.toContain(nome);
      }
    }
  });

  it('a ficha de cada estágio gasta exatamente o orçamento do estágio', () => {
    const { fichaByStage } = generateOracleComplete(makeInput('Ana Orcamento', QUIZ), 5);
    for (const stage of FICHA_STAGE_ORDER) {
      const m = STAGE_MULTIPLIER[stage];
      const f = fichaByStage[stage];
      expect(f.totals.elementos).toBe(Math.round(ROOKIE_BUDGET.elementos * m));
      expect(f.totals.escolas).toBe(Math.round(ROOKIE_BUDGET.escolasDistribuidas * m) + Math.round(ROOKIE_BUDGET.evocacaoFixo * m));
      expect(f.totals.recursos).toBe(Math.round(ROOKIE_BUDGET.recursos * m));
      expect(f.totals.profissoes).toBe(Math.round(ROOKIE_BUDGET.profissao * m));
    }
  });

  it('talentos respeitam ranksMaximos, exclusivoCom e pré-requisito de verdade', () => {
    const { fichaByStage } = generateOracleComplete(makeInput('Bruno Talento', QUIZ, true), 9);
    for (const stage of FICHA_STAGE_ORDER) {
      const f = fichaByStage[stage];
      const owned = Object.keys(f.talentos);
      for (const id of owned) {
        const def = CLASS_DATA.talentos[id];
        expect(def, `talento desconhecido: ${id}`).toBeTruthy();
        expect(f.talentos[id]!).toBeLessThanOrEqual(def.ranksMaximos);
        for (const ex of def.exclusivoCom ?? []) {
          expect(owned, `${id} e ${ex} são exclusivos`).not.toContain(ex);
        }
        if (def.requisito?.escola) {
          expect(f.escolas[def.requisito.escola] ?? 0).toBeGreaterThanOrEqual(def.requisito.nivelMinimo);
        }
        if (def.requisito?.recurso) {
          expect(f.recursos[def.requisito.recurso] ?? 0).toBeGreaterThanOrEqual(def.requisito.nivelMinimo);
        }
      }
    }
  });

  it('o companheiro é uma captura LEGAL da ficha rookie (mecânica, não flavor)', () => {
    const { fichaByStage, companion } = generateOracleComplete(makeInput('Carla Captura', QUIZ), 11);
    expect(companion).not.toBeNull();
    const poder = poderCaptura(fichaByStage.rookie, companion!.criatura);
    expect(poder).toBeGreaterThanOrEqual(companion!.criatura.poderBase);
  });

  it('sobrevive a JSON — perfil salvo gera a mesma criatura no reroll', () => {
    const input = makeInput('Diego Persistencia', QUIZ, true);
    const direto = generateOracleComplete(input, 42);
    const roundTrip = generateOracleComplete(JSON.parse(JSON.stringify(input)) as OracleInput, 42);
    expect(roundTrip.result.creature.baseName).toBe(direto.result.creature.baseName);
    expect(roundTrip.bestiaryPick.creature.nome).toBe(direto.bestiaryPick.creature.nome);
  });
});

describe('dados sincronizados dos repositórios', () => {
  it('snapshots carregam procedência (repo + SHA) — dado sem origem não entra', () => {
    expect(CLASS_DATA._provenance.repo).toContain('Class-System');
    expect(CLASS_DATA._provenance.sha).toMatch(/^[0-9a-f]{40}$/);
    expect(BESTIARY_PROVENANCE.repo).toContain('Besti-rio');
    expect(BESTIARY_PROVENANCE.sha).toMatch(/^[0-9a-f]{40}$/);
  });

  it('o registro completo está presente: 65 talentos, 11 profissões, 14 famílias', () => {
    expect(Object.keys(CLASS_DATA.talentos).length).toBeGreaterThanOrEqual(65);
    expect(Object.keys(CLASS_DATA.profissoes).length).toBeGreaterThanOrEqual(11);
    expect(Object.keys(CLASS_DATA.familias).length).toBeGreaterThanOrEqual(14);
  });

  it('o pool do bestiário é grande, único por nome e com descrição real', () => {
    expect(BESTIARY_POOL.length).toBeGreaterThanOrEqual(2000);
    expect(new Set(BESTIARY_POOL.map(c => c.nome)).size).toBe(BESTIARY_POOL.length);
    for (const c of BESTIARY_POOL.slice(0, 50)) {
      expect(c.descricao.length).toBeGreaterThan(10);
      expect(c.elementos.length).toBeGreaterThan(0);
    }
  });

  it('toda essência tem nome em EN — PT sem par é bug de idioma', () => {
    for (const pair of DERIVED_ELEMENT_PAIRS) {
      expect(essenceHasEn(pair.id), `sem EN: ${pair.id}`).toBe(true);
    }
    for (const id of Object.keys(BASE_ELEMENT_LABELS)) {
      expect(essenceHasEn(id), `sem EN base: ${id}`).toBe(true);
    }
    for (const id of Object.keys(CLASS_DATA.profissoes)) {
      expect(PROFISSAO_EN[id], `profissão sem EN: ${id}`).toBeTruthy();
    }
  });
});
