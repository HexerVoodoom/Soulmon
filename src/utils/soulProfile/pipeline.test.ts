// ---------------------------------------------------------------------------
// Contratos do pipeline completo: leitura → ficha → bestiário → criatura.
// O que quebraria em silêncio se alguém mexesse numa ponta sem olhar a outra.
// ---------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';
import { generateOracleComplete } from './pipeline';
import { buildSoulProfile } from './profile';
import { CLASS_DATA, STAGE_MULTIPLIER, ROOKIE_BUDGET, ELEMENT_ORCAMENTO_BY_STAGE } from './ficha/buildSheet';
import { cascataDosPares } from './ficha/cascata';
import { CLASS_ELEMENT_ORDER } from './types';
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
      // elementos agora são medidos em ORÇAMENTO (base 1 · par destravado 3),
      // com curva própria — é ela que faz a cascata geracional acontecer.
      expect(f.totals.elementos).toBe(ELEMENT_ORCAMENTO_BY_STAGE[stage]);
      expect(f.totals.escolas).toBe(Math.round(ROOKIE_BUDGET.escolasDistribuidas * m) + Math.round(ROOKIE_BUDGET.evocacaoFixo * m));
      expect(f.totals.recursos).toBe(Math.round(ROOKIE_BUDGET.recursos * m));
      expect(f.totals.profissoes).toBe(Math.round(ROOKIE_BUDGET.profissao * m));
    }
  });

  it('alocação geracional: ponto direto em par SÓ destravado (10 passivos), e nunca nos estágios baixos', () => {
    const baseIds = new Set<string>(CLASS_ELEMENT_ORDER);
    for (const seed of [5, 21, 77]) {
      const input = makeInput(`Gera Cascata ${seed}`, QUIZ, seed % 2 === 1);
      const { fichaByStage } = generateOracleComplete(input, seed);
      for (const stage of FICHA_STAGE_ORDER) {
        const f = fichaByStage[stage];
        const pares = Object.keys(f.elementos).filter(id => !baseIds.has(id));
        // rookie/champion nunca alcançam o destrave (orçamento 30/60 < marco 100)
        if (stage === 'rookie' || stage === 'champion') expect(pares).toEqual([]);
        for (const par of pares) {
          const soDiretosBase = Object.fromEntries(
            Object.entries(f.elementos).filter(([id]) => baseIds.has(id))
          ) as Partial<Record<(typeof CLASS_ELEMENT_ORDER)[number], number>>;
          const destravado = cascataDosPares(soDiretosBase).some(
            c => c.def.id === par && c.destravado,
          );
          expect(destravado, `${par} comprado sem destrave no ${stage}`).toBe(true);
        }
      }
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

  it('a linhagem do bestiário tem um pick por estágio, sem repetir criatura, e o 1º É o bestiaryPick', () => {
    const input = makeInput('Elisa Linhagem', QUIZ, true);
    const { bestiaryPick, bestiaryLineage } = generateOracleComplete(input, 7);
    expect(Object.keys(bestiaryLineage)).toEqual([...FICHA_STAGE_ORDER]);
    expect(bestiaryLineage.rookie.creature.nome).toBe(bestiaryPick.creature.nome);
    const nomes = FICHA_STAGE_ORDER.map(s => bestiaryLineage[s].creature.nome);
    expect(new Set(nomes).size).toBe(nomes.length);
  });

  it('a evolução tende a ficar na mesma espécie: maioria das transições preserva a família', () => {
    // "Dragão tende a ir para dragão" — mede sobre vários perfis: quando o
    // estágio anterior TEM família, a transição mantém a família na maioria
    // dos casos. A travessia existe (proximidade somada pode vencer), mas é
    // exceção, não regra.
    let same = 0; let total = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const input = makeInput(`Perfil Especie ${seed}`, QUIZ, seed % 2 === 0);
      const { bestiaryLineage } = generateOracleComplete(input, seed);
      for (let i = 1; i < FICHA_STAGE_ORDER.length; i++) {
        const prev = bestiaryLineage[FICHA_STAGE_ORDER[i - 1]].creature;
        const next = bestiaryLineage[FICHA_STAGE_ORDER[i]].creature;
        if (!prev.familia) continue;
        total++;
        if (next.familia === prev.familia) same++;
      }
    }
    expect(total).toBeGreaterThan(0);
    expect(same / total).toBeGreaterThan(0.5);
  });

  it('skills por forma: básica/especial em todo estágio, PT+EN, estáveis no reroll', () => {
    const input = makeInput('Fabio Skills', QUIZ, true);
    const a = generateOracleComplete(input, 4);
    const b = generateOracleComplete(input, 5);
    const baseIds = new Set<string>(CLASS_ELEMENT_ORDER);
    for (const stage of FICHA_STAGE_ORDER) {
      const s = a.stageSkills[stage];
      expect(s.basica.custo).toBe('baixo');
      expect(s.especial.custo).toBe('alto');
      for (const skill of [s.basica, s.especial]) {
        expect(skill.nome.pt.length).toBeGreaterThan(3);
        expect(skill.nome.en.length).toBeGreaterThan(3);
        expect(skill.descricao.pt).not.toBe(skill.descricao.en);
      }
      // a básica fala a língua de todo dia: sempre elemento BASE
      expect(baseIds.has(s.basica.elementoId)).toBe(true);
      // skills são função da identidade — reroll não as troca
      expect(b.stageSkills[stage]).toEqual(s);
    }
    // quando a ficha ultra comprou um par, a especial do ultra É do par
    const paresUltra = Object.keys(a.fichaByStage.ultra.elementos).filter(id => !baseIds.has(id));
    if (paresUltra.length > 0) {
      expect(paresUltra).toContain(a.stageSkills.ultra.especial.elementoId);
    }
  });

  it('as 6 respostas do RITUAL alcançam ficha, skills, companheiro e bestiário', () => {
    // Regressão medida: tudo que o pipeline deriva lia `soul.oracle` cru, e o
    // quiz só era aplicado nas cópias locais do generateOracle. Resultado: duas
    // pessoas com o mesmo nascimento e respostas OPOSTAS recebiam ficha,
    // ofício, essência, companheiro, skills e bestiário idênticos — e para quem
    // pula o teste de 20 as 6 respostas são o único sinal de personalidade.
    const cuidar = makeInput('Gemeo Ritual', { grupo: 'protege', objetivo: 'cuidar', pressao: 'firme' });
    const vencer = makeInput('Gemeo Ritual', { grupo: 'lidera', objetivo: 'vencer', pressao: 'ataca' });
    const a = generateOracleComplete(cuidar, 777);
    const b = generateOracleComplete(vencer, 777);
    expect(a.fichaByStage.rookie).not.toEqual(b.fichaByStage.rookie);
    expect(a.stageSkills.ultra.especial.nome.pt).not.toBe(b.stageSkills.ultra.especial.nome.pt);
    expect(a.bestiaryPick.creature.nome).not.toBe(b.bestiaryPick.creature.nome);
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
