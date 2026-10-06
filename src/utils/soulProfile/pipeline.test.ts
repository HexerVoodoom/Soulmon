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
// @ts-expect-error — módulo .mjs de build, sem tipos; é de propósito o MESMO
// arquivo que o `sync-oracle-data.mjs` importa (régua copiada mente nos dois).
import { entradaPermitida } from '../../../scripts/bestiario-procedencia.mjs';
import { DERIVED_ELEMENT_PAIRS, BASE_ELEMENT_LABELS } from './derivedElements';
import { essenceHasEn, PROFISSAO_EN } from './essenceLabels';
import { computeClassTitle } from './ficha/classTitle';
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
  it('é determinístico: mesma entrada e seed = mesma ficha, mesmo bicho, mesma inspiração', async () => {
    const input = makeInput('Mateus Sperandio', QUIZ, true);
    const a = await generateOracleComplete(input, 77);
    const b = await generateOracleComplete(input, 77);
    expect(a.result.creature.baseName).toBe(b.result.creature.baseName);
    expect(a.bestiaryPick.creature.nome).toBe(b.bestiaryPick.creature.nome);
    expect(a.fichaByStage.ultra).toEqual(b.fichaByStage.ultra);
  });

  it('reroll (seed nova) troca a criatura, NUNCA a ficha — a ficha é quem a pessoa é', async () => {
    const input = makeInput('Mateus Sperandio', QUIZ, true);
    const a = await generateOracleComplete(input, 1);
    const b = await generateOracleComplete(input, 2);
    expect(a.fichaByStage.rookie).toEqual(b.fichaByStage.rookie);
    expect(a.fichaByStage.ultra).toEqual(b.fichaByStage.ultra);
    expect(a.companion?.id).toBe(b.companion?.id);
  });

  it('o NOME da inspiração VAI no prompt da 1ª tentativa, e NÃO no fallback', async () => {
    /* ⚠️ **ESTA REGRA VIROU AO CONTRÁRIO em 27/09/2026 (D-B1, decisão do
       dono).** Este caso se chamava "o NOME da criatura do bestiário nunca
       aparece em prompt" e travava a ausência dele nos 11 prompts.

       O dono decidiu deixar o nome passar, **sabendo do risco de direito
       autoral**, com o desenho de sempre: tenta COM o nome, e se o provedor
       recusar por política de conteúdo (`isRefusal`), a 2ª tentativa vai sem.
       Quem decide o limite é o PROVEDOR, não uma lista nossa — e é por isso
       que o par de variantes é a parte que não pode cair.

       O que este teste protege agora é o fallback existir de verdade: um
       `imagePromptFallback` que também carregasse o nome deixaria a recusa
       sem saída, e a geração falharia em vez de degradar. */
    /* ⚠️ Achado de 28/09/2026: `bestiaryLineage` (um pick por estágio,
       calculado por `selectBestiaryLineage`) alimenta o `inspiracao` de
       CADA estágio agora — não mais sempre o nome do estágio 0 repetido nos
       11 prompts. Este caso passou a checar, por estágio, a base do pick DA
       LINHAGEM daquele estágio (mapeando `CreatureStage.stage` para a chave
       de `FichaStage` correspondente — `perfeito` ↔ `ultimate`). */
    const baseOf = (nome: string): string =>
      (/^(?:Titânico|Espiritual|Cristalino|Corrompido|Ancião)\s+(.+?)\s+de\s+\S+$/
        .exec(nome)?.[1] ?? nome).trim().toLowerCase();
    const FICHA_STAGE_FOR: Record<string, 'rookie' | 'champion' | 'ultimate' | 'mega' | 'ultra'> = {
      rookie: 'rookie', champion: 'champion', perfeito: 'ultimate', mega: 'mega', ultra: 'ultra',
    };

    for (const seed of [3, 14, 62, 240]) {
      const input = makeInput(`Pessoa Teste ${seed}`, QUIZ, seed % 2 === 0);
      const { result, bestiaryLineage } = await generateOracleComplete(input, seed);

      for (const stage of result.creature.stages) {
        const alvo = baseOf(bestiaryLineage[FICHA_STAGE_FOR[stage.stage]].creature.nome);
        expect(stage.imagePrompt.toLowerCase(), `a 1ª tentativa (${stage.stage}) leva a inspiração nomeada`)
          .toContain(alvo);
        // A cláusula inteira, não só a palavra: com o corpus do bestiário sem allowlist,
        // o nome pode ser uma palavra comum que o conceito também usa (ex.: "golem").
        expect(stage.imagePromptFallback.toLowerCase(), 'o FALLBACK tem de ficar limpo')
          .not.toContain(`draw inspiration from ${alvo}`);
      }
    }
  });

  it('a cláusula "não copie personagem de franquia" continua nas DUAS variantes', async () => {
    // Citar de onde veio a inspiração não é licença para devolver personagem
    // registrado. Se esta cláusula cair junto com a mudança acima, o prompt
    // deixa de pedir criatura ORIGINAL — que é outra decisão, e não foi tomada.
    const { result } = await generateOracleComplete(makeInput('Ana Clausula', QUIZ), 9);
    for (const stage of result.creature.stages) {
      expect(stage.imagePrompt).toContain('Do not copy any existing franchise character');
      expect(stage.imagePromptFallback).toContain('Do not copy any existing franchise character');
    }
  });

  it('o nome da inspiração continua FORA do que o jogador lê', async () => {
    // A mudança do dono é sobre o PROMPT. Nome, bio e descrição por forma
    // seguem sem a inspiração: o jogador vê a criatura dele, não a fonte.
    for (const seed of [3, 62]) {
      const input = makeInput(`Pessoa Teste ${seed}`, QUIZ, seed % 2 === 0);
      const { result, bestiaryPick } = await generateOracleComplete(input, seed);
      const nome = bestiaryPick.creature.nome.toLowerCase();
      expect(result.creature.baseName.toLowerCase()).not.toContain(nome);
      const bioTudo = `${result.creature.bio.pt} ${result.creature.bio.en}`.toLowerCase();
      expect(bioTudo).not.toContain(nome);
    }
  });

  it('a ficha de cada estágio gasta exatamente o orçamento do estágio', async () => {
    const { fichaByStage } = await generateOracleComplete(makeInput('Ana Orcamento', QUIZ), 5);
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

  it('alocação geracional: ponto direto em par SÓ destravado (10 passivos), e nunca nos estágios baixos', async () => {
    const baseIds = new Set<string>(CLASS_ELEMENT_ORDER);
    for (const seed of [5, 21, 77]) {
      const input = makeInput(`Gera Cascata ${seed}`, QUIZ, seed % 2 === 1);
      const { fichaByStage } = await generateOracleComplete(input, seed);
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

  it('talentos respeitam ranksMaximos, exclusivoCom e pré-requisito de verdade', async () => {
    const { fichaByStage } = await generateOracleComplete(makeInput('Bruno Talento', QUIZ, true), 9);
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

  it('o companheiro é uma captura LEGAL da ficha mega (mecânica, não flavor)', async () => {
    // ⚠️ Era a ficha ROOKIE até 28/09/2026 — ver o comentário de
    // `selectCompanion` em `pipeline.ts` (12/32 criaturas alcançáveis).
    const { fichaByStage, companion } = await generateOracleComplete(makeInput('Carla Captura', QUIZ), 11);
    expect(companion).not.toBeNull();
    const poder = poderCaptura(fichaByStage.mega, companion!.criatura);
    expect(poder).toBeGreaterThanOrEqual(companion!.criatura.poderBase);
  });

  it('a linhagem do bestiário tem um pick por estágio, sem repetir criatura, e o 1º É o bestiaryPick', async () => {
    const input = makeInput('Elisa Linhagem', QUIZ, true);
    const { bestiaryPick, bestiaryLineage } = await generateOracleComplete(input, 7);
    expect(Object.keys(bestiaryLineage)).toEqual([...FICHA_STAGE_ORDER]);
    expect(bestiaryLineage.rookie.creature.nome).toBe(bestiaryPick.creature.nome);
    const nomes = FICHA_STAGE_ORDER.map(s => bestiaryLineage[s].creature.nome);
    expect(new Set(nomes).size).toBe(nomes.length);
  });

  it('a evolução tende a ficar na mesma espécie: maioria das transições preserva a família', async () => {
    // "Dragão tende a ir para dragão" — mede sobre vários perfis: quando o
    // estágio anterior TEM família, a transição mantém a família na maioria
    // dos casos. A travessia existe (proximidade somada pode vencer), mas é
    // exceção, não regra.
    let same = 0; let total = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const input = makeInput(`Perfil Especie ${seed}`, QUIZ, seed % 2 === 0);
      const { bestiaryLineage } = await generateOracleComplete(input, seed);
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

  it('skills por forma: básica/especial em todo estágio, PT+EN, estáveis no reroll', async () => {
    const input = makeInput('Fabio Skills', QUIZ, true);
    const a = await generateOracleComplete(input, 4);
    const b = await generateOracleComplete(input, 5);
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

  it('as 6 respostas do RITUAL alcançam ficha, skills, companheiro e bestiário', async () => {
    // Regressão medida: tudo que o pipeline deriva lia `soul.oracle` cru, e o
    // quiz só era aplicado nas cópias locais do generateOracle. Resultado: duas
    // pessoas com o mesmo nascimento e respostas OPOSTAS recebiam ficha,
    // ofício, essência, companheiro, skills e bestiário idênticos — e para quem
    // pula o teste de 20 as 6 respostas são o único sinal de personalidade.
    const cuidar = makeInput('Gemeo Ritual', { grupo: 'protege', objetivo: 'cuidar', pressao: 'firme' });
    const vencer = makeInput('Gemeo Ritual', { grupo: 'lidera', objetivo: 'vencer', pressao: 'ataca' });
    const a = await generateOracleComplete(cuidar, 777);
    const b = await generateOracleComplete(vencer, 777);
    expect(a.fichaByStage.rookie).not.toEqual(b.fichaByStage.rookie);
    expect(a.stageSkills.ultra.especial.nome.pt).not.toBe(b.stageSkills.ultra.especial.nome.pt);
    expect(a.bestiaryPick.creature.nome).not.toBe(b.bestiaryPick.creature.nome);
  });

  it('as skills NÃO repetem nome ao longo da jornada dos 5 estágios', async () => {
    // A jornada tem 5 estágios; o banco de substantivos por (escola, tipo)
    // tinha 2 e o anti-repetição esgotava no 3º — rookie e ultimate saíam com
    // "Golpe de Água" idêntico (nome, custo E descrição). Agora são 6.
    for (const seed of [4, 33, 108]) {
      const { stageSkills } = await generateOracleComplete(makeInput(`Jornada ${seed}`, QUIZ, seed % 2 === 0), seed);
      for (const tipo of ['basica', 'especial'] as const) {
        const nomes = FICHA_STAGE_ORDER.map(stage => stageSkills[stage][tipo].nome.pt);
        expect(new Set(nomes).size, `${tipo} repetiu: ${nomes.join(' / ')}`).toBe(nomes.length);
      }
    }
  });

  it('a classe REAL entra só no prompt de sprite — nunca no nome, bio ou descrição por forma', async () => {
    // Pedido do dono: mais detalhe no prompt (classe do class-system), mas
    // JAMAIS visível pro jogador em texto nenhum. `archetype.phrase`/
    // "arquétipo" já existiam ANTES disso (sistema de frase-identidade
    // próprio do oracle.ts, sem relação com o class-system) — não dá pra
    // banir a palavra, então o teste confere a PALAVRA REAL que
    // `computeClassTitle` calculou pra essa ficha.
    const input = makeInput('Helena Classe', QUIZ, true);
    const { result, fichaByStage } = await generateOracleComplete(input, 321);
    const classe = await computeClassTitle(fichaByStage.ultra);
    expect(classe.origem).toBe('arquetipo'); // ultra sempre bate pleno (medido)
    const palavraClasse = classe.nome.en.toLowerCase();
    for (const stage of result.creature.stages) {
      expect(stage.description.pt.toLowerCase()).not.toContain(palavraClasse);
      expect(stage.description.en.toLowerCase()).not.toContain(palavraClasse);
      // mas o prompt de sprite TEM que carregar o detalhe extra
      expect(stage.imagePrompt.toLowerCase()).toContain(palavraClasse);
    }
    expect(`${result.creature.bio.pt} ${result.creature.bio.en}`.toLowerCase()).not.toContain(palavraClasse);
  });

  it('sobrevive a JSON — perfil salvo gera a mesma criatura no reroll', async () => {
    const input = makeInput('Diego Persistencia', QUIZ, true);
    const direto = await generateOracleComplete(input, 42);
    const roundTrip = await generateOracleComplete(JSON.parse(JSON.stringify(input)) as OracleInput, 42);
    expect(roundTrip.result.creature.baseName).toBe(direto.result.creature.baseName);
    expect(roundTrip.bestiaryPick.creature.nome).toBe(direto.bestiaryPick.creature.nome);
  });
});

describe('dados sincronizados dos repositórios', () => {
  it('snapshots carregam procedência (repo + SHA) — dado sem origem não entra', () => {
    expect(CLASS_DATA._provenance.repo).toContain('Class-System');
    expect(CLASS_DATA._provenance.sha).toMatch(/^[0-9a-f]{40}$/);
    expect(BESTIARY_PROVENANCE.repo).toMatch(/besti-rio/i);
    expect(BESTIARY_PROVENANCE.sha).toMatch(/^[0-9a-f]{40}$/);
  });

  it('o registro completo está presente: 65 talentos, 11 profissões, 14 famílias', () => {
    expect(Object.keys(CLASS_DATA.talentos).length).toBeGreaterThanOrEqual(65);
    expect(Object.keys(CLASS_DATA.profissoes).length).toBeGreaterThanOrEqual(11);
    expect(Object.keys(CLASS_DATA.familias).length).toBeGreaterThanOrEqual(14);
  });

  it('o pool é o corpus do Besti-rio- direto, sem allowlist de procedência', () => {
    /* ⚠️ DECISÃO DO DONO, 06/10/2026: "sincronizar com o corpus inteiro, sem
       allowlist que restrinja". Este caso afirmava o OPOSTO — que nenhuma
       entrada do pool vinha de franquia protegida (`entradaPermitida`) — e foi
       virado. O que ele protege agora é só que o pool continue sendo um
       snapshot com origem declarada em cada entrada. O risco de PI foi posto
       na mesa e aceito pelo dono; o gatilho para rever é reclamação de titular
       ou parecer de loja. */
    expect(BESTIARY_POOL.length).toBeGreaterThan(1000);
    expect(BESTIARY_POOL.filter(c => !c.origem)).toEqual([]);
  });

  it('AUTOVERIFICAÇÃO: o critério ENXERGA o que a régua antiga deixava passar', () => {
    /* Sem este caso, um critério que aprova tudo faria o teste acima passar
       pelo mesmo motivo que o anterior passava. */
    const exemplosReais = [
      { nome: 'Titânico Zubat de Morte', origem: 'Geração Procedural (Class-System)',
        descricao: 'A primeira geração (Geração I) da franquia Pokémon apresentou 151 criaturas fictícias' },
      { nome: 'Espiritual Beholder de Fogo', origem: 'Geração Procedural (Class-System)',
        descricao: 'Beholder é um monstro fictício de Dungeons & Dragons' },
      { nome: 'Ciclope Celeste', origem: 'Criaturas Mitologicas',
        descricao: 'Emma Grace Frost é uma personagem fictícia que aparece nas histórias em quadrinhos da Marvel Comics.' },
      // Drift: nome limpo, descrição de OUTRA criatura registrada.
      { nome: 'Ancião Tarrasque de Fogo', origem: 'Geração Procedural (Class-System)',
        descricao: 'Deathclaw é uma espécie reptiliana fictícia da franquia Fallout' },
    ];
    for (const c of exemplosReais) {
      expect(entradaPermitida(c), `deixou passar: ${c.nome}`).toBe(false);
    }
    // …e NÃO reprova o que é do mundo (fauna real com descrição de biologia).
    expect(entradaPermitida({
      nome: 'Titânico Ocapi (Okapia johnstoni) de Água', origem: 'Geração Procedural (Class-System)',
      descricao: 'O ocapi (Okapia johnstoni) é um mamífero artiodáctilo da família Giraffidae.',
    })).toBe(true);
  });

  it('o pool do bestiário é grande, único por nome e com descrição real', () => {
    /* ⚠️ Era 2000, e o alvo caiu para 1700 em 07/09/2026 porque **282
       criaturas saíram do pool**: 242 de franquia protegida (Pokémon, D&D,
       Warcraft, Digimon, Ragnarok, Final Fantasy, Warhammer, Senhor dos
       Anéis) com a DESCRIÇÃO OFICIAL copiada palavra por palavra, mais 40
       procedurais que carregavam nome de franquia no próprio nome. Tudo isso
       ia no `pool.json` de 947 KB que entra no bundle servido — contra a
       regra escrita em duas seções do `CLAUDE.md`.
       O filtro está no `scripts/sync-oracle-data.mjs` (na FONTE, para não
       voltar no próximo sync) e o guard está logo abaixo. */
    /* ⚠️ O piso foi 2000, depois 1700, e **caiu para 600 em 27/09/2026**.
       Não é afrouxamento: é a conta do corte. O pool tinha 1.718 entradas e
       **1.101 saíram** por PI de terceiro (60,6%), deixando **617**. O
       `pool.json` passou de 832 KB para 374 KB no bundle servido.
       O número é MEDIDO, não escolhido — e ele deve SUBIR de novo quando o
       `POOL_TARGET` for recalibrado sobre fauna e flora reais, que é a
       pendência registrada em `docs/BESTIARIO-PROCEDENCIA.md` §"o que falta":
       sobraram 617 entradas, mas de apenas **12 espécies** procedurais, e é
       diversidade de FAMÍLIA que dá caráter à criatura — cinco prefixos sobre
       o mesmo cachorro não são cinco criaturas. */
    /* ⚠️ E caiu para 150 em 28/09/2026 — de propósito, e é a conta certa:
       decisão do dono de usar SÓ entradas originais. As 617/732 de antes eram
       variantes geradas de ~42 bases; hoje são 194 CRIATURAS DISTINTAS em 25
       grupos (`scripts/bestiario-originais.mjs`). Menos linhas, muito mais
       criaturas. O piso de diversidade real mora em
       `bestiary/curadoria.contract.test.ts`. */
    expect(BESTIARY_POOL.length).toBeGreaterThanOrEqual(150);
    expect(new Set(BESTIARY_POOL.map(c => c.nome)).size).toBe(BESTIARY_POOL.length);
    // Varre TUDO: é um pool em memória, e `slice(0, 50)` validava 3% dele.
    for (const c of BESTIARY_POOL) {
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
