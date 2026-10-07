// ---------------------------------------------------------------------------
// Skills por forma — o par básica/especial de cada estágio, derivado da FICHA.
//
// O class-system não tem gerador de skill: o motor de lá é um validador/
// calculadora (`calcularSkill`) e quem escolhe os parâmetros é o jogador.
// Aqui o "jogador" é o oráculo: a derivação é determinística a partir da
// ficha do estágio, usando SÓ vocabulário real do snapshot —
//
//   • elemento: o dominante da ficha, com PESO POR GERAÇÃO (par comprado
//     vale ×3 por ponto — o custo econômico da geração). A BÁSICA usa o
//     melhor elemento BASE; a ESPECIAL usa o melhor elemento GERAL — quando
//     a ficha ultra comprou um par (ex.: vapor), a especial é do par: o
//     elemento avançado é literalmente a habilidade do topo da escada.
//   • escola: a de skill dominante da ficha (a evocação é só captura: nunca é escola de skill).
//   • recurso: o recurso da ficha; o CUSTO é qualitativo por desenho —
//     básica = consumo baixo, usável com frequência; especial = consumo
//     alto, rara — sem portar a fórmula de custo do motor (que depende de
//     talento/proficiência e mudaria com o balanceamento de lá).
//
// Nomes/descrições nascem EN com par PT (regra do app), compostos de léxico
// próprio + nomes de elemento já traduzidos (`essenceLabels`).
// ---------------------------------------------------------------------------

import { hashString, mulberry32, pick } from '../../oracle';
import { CLASS_ELEMENT_ORDER } from '../types';
import type { Ficha, FichaStage, EscolaSkillId, RecursoId } from './types';
import { ESCOLAS_SKILL, escolaSkillSegura } from './types';
import { cascataDosPares, CUSTO_PONTO_PAR } from './cascata';
import { elementoNomeDe } from './elementoNome';
import { CLASS_DATA } from './buildSheet';
import type { AreaConfig } from 'class-system';
import { SPECIAL_FAMILIES, type SpecialFamily } from '../../combate/specials';
import { SCHOOL_STRIKE_FORM, type StrikeForm } from './strikeForm';
import { familiasDaJornada, type PerfilEstagio } from './estabilidadeFamilia';
import { familiaDoEspecial, nomeEscolhidoDoEspecial, descricaoDoEspecial, SUBSTANTIVOS_ESPECIAL, type LexNome } from './nomeEspecial';

export interface SkillText { pt: string; en: string }

export interface StageSkill {
  /** 'basica' | 'especial' — o papel da skill no par. */
  tipo: 'basica' | 'especial';
  nome: SkillText;
  descricao: SkillText;
  /** id do elemento (base ou par) — vocabulário do class-system. */
  elementoId: string;
  elementoNome: SkillText;
  escolaId: EscolaSkillId;
  recursoId: RecursoId;
  /** Área do golpe (Q-AREA, contexto §2.16): POR ESCOLA — conjuração e longo alcance
   *  em círculo de 4 m (`RAIO_MAXIMO_BASE` do class-system), as outras de alvo único.
   *  O núcleo de combate lê `area.tipo === 'circulo'` como área. */
  area: AreaConfig;
  /** PR9: a família do efeito (uma das 7 do núcleo de combate). A básica é sempre `direct`; a do especial
   *  muda a cada estágio. Ausente só em dado antigo: os consumidores caem em `familyOfEscola`. */
  familia?: SpecialFamily;
  /** PR9b: o ID do nome do especial (índice do substantivo no léxico da família + formato). O servidor o publica
   *  no duelo e o cliente do oponente recompõe o MESMO nome por regra — nunca o texto do save. Só no especial. */
  lex?: LexNome;
  /** PR9: a forma do golpe (corpo a corpo ou à distância) — a tabela da escola, lida do dono único. */
  forma?: StrikeForm;
  /** Custo qualitativo por desenho: básica é frequente, especial é rara. */
  custo: 'baixo' | 'alto';
  /** Impacto REAL calculado pelo motor do class-system (`calcularSkill`),
   *  preenchido sob demanda por `realSkillPower.ts` — ausente até lá (e em
   *  skills persistidas de antes desta mudança). Não normalizado: lido em
   *  RELATIVO (básica vs. especial, forma vs. forma), como todo "poder" de
   *  jogo — o dono pediu que o custo fosse "balanceado quando tá criando a
   *  skill" pelo motor de verdade, não por um rótulo fixo. */
  poder?: number;
}

export interface StageSkills {
  basica: StageSkill;
  especial: StageSkill;
  /** O elemento REAL do Soulmon neste estágio — o de maior peso da ficha, base
   *  OU combinado (par). É o que o jogador vê como "o elemento do meu Soulmon"
   *  (ex.: o Duelo). Não é o elemento do golpe especial: quando o topo é uma
   *  base, a especial herda o SEGUNDO colocado, e mostrar esse como "o
   *  elemento" era errado. Opcional: skills salvas antes desta mudança não o
   *  têm, e quem lê cai no elemento do golpe. */
  elementoDominante?: { id: string; nome: SkillText };
}

/** Raio-base do class-system (`RAIO_MAXIMO_BASE`), em metros. */
export const RAIO_AREA_BASE_METROS = 4;

/** Q-AREA: escolas de área. As demais acertam um alvo só. */
export const ESCOLAS_DE_AREA: readonly EscolaSkillId[] = ['conjuracao', 'longo_alcance'];

/** A área de uma escola (função pura da escola — determinística por ficha/estágio). */
export function areaDaEscola(escola: EscolaSkillId): AreaConfig {
  return ESCOLAS_DE_AREA.includes(escolaSkillSegura(escola)) ? { tipo: 'circulo', raioMetros: RAIO_AREA_BASE_METROS } : { tipo: 'unico' };
}

export { elementoNomeDe };

/** Substantivos da BÁSICA por escola, sorteio determinístico. O ESPECIAL tem léxico, família e nome próprios em `nomeEspecial.ts` (PR9). */
const NOMES: Record<EscolaSkillId, {
  basica: Array<{ pt: string; en: string }>;
}> = {
  // SEIS por (escola, tipo), não dois: a jornada tem 5 estágios e o
  // anti-repetição da rodada 1 esgotava o banco no 3º, voltando a mostrar
  // "Golpe de Água" idêntico em rookie e ultimate. Com 6, os 5 estágios
  // sempre cabem sem repetir.
  combate_fisico: {
    basica: [{ pt: 'Golpe de', en: 'Strike' }, { pt: 'Investida de', en: 'Rush' }, { pt: 'Corte de', en: 'Slash' },
      { pt: 'Impacto de', en: 'Impact' }, { pt: 'Pancada de', en: 'Smash' }, { pt: 'Estocada de', en: 'Thrust' }],
  },
  longo_alcance: {
    basica: [{ pt: 'Disparo de', en: 'Shot' }, { pt: 'Flecha de', en: 'Arrow' }, { pt: 'Dardo de', en: 'Dart' },
      { pt: 'Míssil de', en: 'Missile' }, { pt: 'Lança de', en: 'Lance' }, { pt: 'Estilhaço de', en: 'Shard' }],
  },
  conjuracao: {
    basica: [{ pt: 'Lampejo de', en: 'Spark' }, { pt: 'Rajada de', en: 'Bolt' }, { pt: 'Selo de', en: 'Sigil' },
      { pt: 'Fagulha de', en: 'Ember' }, { pt: 'Trama de', en: 'Weave' }, { pt: 'Pulso de', en: 'Pulse' }],
  },
  benca: {
    basica: [{ pt: 'Toque de', en: 'Touch' }, { pt: 'Sopro de', en: 'Breath' }, { pt: 'Bênção de', en: 'Blessing' },
      { pt: 'Carícia de', en: 'Caress' }, { pt: 'Orvalho de', en: 'Dew' }, { pt: 'Abrigo de', en: 'Shelter' }],
  },
  maldicao: {
    basica: [{ pt: 'Marca de', en: 'Mark' }, { pt: 'Aflição de', en: 'Bane' }, { pt: 'Praga de', en: 'Blight' },
      { pt: 'Sussurro de', en: 'Whisper' }, { pt: 'Mordida de', en: 'Bite' }, { pt: 'Grilhão de', en: 'Shackle' }],
  },
};

/** Descrição da BÁSICA (a do especial vem da família: `descricaoDoEspecial`). */
const DESCRICAO_BASICA = (el: SkillText, recurso: string, recursoEn: string): SkillText => ({
  en: `A quick ${el.en.toLowerCase()} technique with a low ${recursoEn.toLowerCase()} cost — reliable, ready whenever it's needed.`,
  pt: `Uma técnica rápida de ${el.pt.toLowerCase()} com custo baixo de ${recurso.toLowerCase()} — confiável, pronta sempre que precisar.`,
});

/** Nome EN dos recursos (o snapshot é PT-only). */
const RECURSO_EN: Record<RecursoId, string> = {
  mana: 'Mana', fe: 'Faith', furia: 'Fury', soullink: 'Soullink', ressonancia: 'Resonance',
};

const BASE_SET = new Set<string>(CLASS_ELEMENT_ORDER);

/** Elementos da ficha ordenados por peso geracional (par comprado ×3). */
function rankElementos(ficha: Ficha): Array<{ id: string; peso: number }> {
  const ranked = Object.entries(ficha.elementos)
    .map(([id, pts]) => ({ id, peso: (pts ?? 0) * (BASE_SET.has(id) ? 1 : CUSTO_PONTO_PAR) }))
    .sort((a, b) => b.peso - a.peso || a.id.localeCompare(b.id));
  return ranked;
}

export function escolaDominante(ficha: Ficha): EscolaSkillId {
  let melhor: EscolaSkillId = 'conjuracao';
  let melhorPts = -1;
  for (const escola of ESCOLAS_SKILL) {
    const pts = ficha.escolas[escola] ?? 0;
    if (pts > melhorPts) { melhor = escola; melhorPts = pts; }
  }
  return melhor;
}

/** Os elementos da básica e do especial de UMA ficha (o topo base, o topo geral, e o do especial). */
export function elementosDoStage(ficha: Ficha) {
  const ranked = rankElementos(ficha);
  const topBase = ranked.find(r => BASE_SET.has(r.id))?.id ?? CLASS_ELEMENT_ORDER[0];
  const topGeral = ranked[0]?.id ?? topBase;
  // básica fala a língua de todo dia (base); especial, a mais avançada.
  const elBasica = topBase;
  const elEspecial = topGeral !== topBase ? topGeral
    : (ranked.find(r => r.id !== topBase)?.id ?? topBase);
  return { topBase, topGeral, elBasica, elEspecial };
}

/** O perfil do estágio para a regra de estabilidade da família: pesos efetivos (par já ×CUSTO_PONTO_PAR). */
export function perfilDaFicha(ficha: Ficha, galhos?: PerfilEstagio['galhos']): PerfilEstagio {
  const elementos: Record<string, number> = {};
  for (const r of rankElementos(ficha)) if (r.peso > 0) elementos[r.id] = r.peso;
  return galhos ? { elementos, galhos } : { elementos };
}

/**
 * O par básica/especial de UM estágio. Determinístico por (ficha, seedKey).
 * A especial herda o elemento mais avançado que a ficha alcançou — par
 * comprado nos estágios altos, senão o segundo elemento (quando os pontos
 * empatam em peso, a variedade vem do sorteio de substantivo, não do
 * elemento — identidade primeiro).
 */
export function buildStageSkills(
  ficha: Ficha,
  stage: FichaStage,
  seedKey: string,
  /** Substantivos já usados nos estágios anteriores — a jornada não pode mostrar o mesmo nome em dois
   *  cards. Mutado ao gerar (chave `esp:`). A família NÃO entra aqui: ela é estável (PR14). */
  usados?: Set<string>,
  /** Elemento dominante da leitura do perfil (tendência leve da família do especial). */
  tendencia?: string,
  /** A família do estágio, já decidida por `familiasDaJornada` (PR14). Sem ela: o sorteio puro da seed. */
  familiaFixa?: SpecialFamily,
): StageSkills {
  const { topBase, topGeral, elBasica, elEspecial } = elementosDoStage(ficha);

  const escola = escolaDominante(ficha);
  const recurso = (Object.keys(ficha.recursos)[0] ?? 'mana') as RecursoId;
  const recursoNomePt = CLASS_DATA.recursos[recurso]?.nome ?? recurso;
  const recursoNomeEn = RECURSO_EN[recurso] ?? recurso;

  const rng = mulberry32(hashString(`${seedKey}|skills|${stage}`));

  const base = (tipo: 'basica' | 'especial', elementoId: string) => {
    const el = elementoNomeDe(elementoId);
    return {
      tipo,
      elementoId,
      elementoNome: el,
      escolaId: escola,
      area: areaDaEscola(escola),
      recursoId: recurso,
      forma: SCHOOL_STRIKE_FORM[escola][tipo],
      custo: (tipo === 'basica' ? 'baixo' : 'alto') as 'baixo' | 'alto',
    };
  };

  const montarBasica = (): StageSkill => {
    const b = base('basica', elBasica);
    const el = b.elementoNome;
    // evita repetir o mesmo substantivo em estágios diferentes: a ficha escala mantendo a identidade.
    const banco = NOMES[escola].basica;
    const livres = usados ? banco.filter(n => !usados.has(n.pt)) : banco;
    const substantivo = pick(rng, livres.length > 0 ? livres : banco);
    usados?.add(substantivo.pt);
    return {
      ...b,
      nome: { pt: `${substantivo.pt} ${el.pt}`, en: `${el.en} ${substantivo.en}` },
      descricao: DESCRICAO_BASICA(el, recursoNomePt, recursoNomeEn),
      familia: 'direct',
    };
  };

  // PR9 (§2.4 Q6/Q8): o especial de CADA estágio é novo — família e nome por regra, sem IA.
  const montarEspecial = (): StageSkill => {
    const b = base('especial', elEspecial);
    const familia = familiaFixa ?? familiaDoEspecial({ escola, elementoId: elEspecial, tendencia, seedKey, stage });
    const evitar = new Set([...(usados ?? [])].filter(k => k.startsWith('esp:')).map(k => k.slice(4)));
    const { nome, lex } = nomeEscolhidoDoEspecial({ familia, elemento: b.elementoNome, elementoBasica: elementoNomeDe(elBasica), seedKey, stage }, evitar);
    // a chave do substantivo é o EN dele (o primeiro token que não é elemento): guardamos o nome inteiro EN
    for (const n of SUBSTANTIVOS_ESPECIAL[familia]) if (nome.en.includes(n.en)) usados?.add(`esp:${n.en}`);
    return {
      ...b,
      nome,
      descricao: descricaoDoEspecial(familia, b.elementoNome, { pt: recursoNomePt, en: recursoNomeEn }),
      familia,
      lex,
    };
  };

  return {
    basica: montarBasica(),
    especial: montarEspecial(),
    elementoDominante: { id: topGeral, nome: elementoNomeDe(topGeral) },
  };
}

/** As skills de todos os estágios de uma vez (pipeline / persistência). */
export function buildAllStageSkills(
  fichaByStage: Record<FichaStage, Ficha>,
  seedKey: string,
  tendencia?: string,
  /** PR15b: os galhos (fatias) que moldaram cada estágio, quando o comportamento pesou. Sem eles o perfil não informa galho. */
  galhosByStage?: Partial<Record<FichaStage, PerfilEstagio['galhos']>>,
): Record<FichaStage, StageSkills> {
  const saida = {} as Record<FichaStage, StageSkills>;
  const usados = new Set<string>();
  const stages = Object.keys(fichaByStage) as FichaStage[];
  // PR14: a família é ESTÁVEL — só troca com mudança forte de perfil (elemento/galho dominante).
  const jornada = familiasDaJornada({
    seedKey, tendencia, stages,
    escolas: stages.map(st => escolaDominante(fichaByStage[st])),
    elementosEspecial: stages.map(st => elementosDoStage(fichaByStage[st]).elEspecial),
    perfis: stages.map(st => perfilDaFicha(fichaByStage[st], galhosByStage?.[st])),
  });
  stages.forEach((stage, i) => {
    saida[stage] = buildStageSkills(fichaByStage[stage], stage, seedKey, usados, tendencia, jornada[i].familia);
  });
  return saida;
}
