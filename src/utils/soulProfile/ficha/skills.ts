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
//   • escola: a distribuída dominante da ficha (a evocação fixa não conta).
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
import type { Ficha, FichaStage, EscolaId, RecursoId } from './types';
import { cascataDosPares, CUSTO_PONTO_PAR } from './cascata';
import { DERIVED_ELEMENT_PAIRS } from '../derivedElements';
import { essenceLabel, baseElementLabel } from '../essenceLabels';
import { CLASS_DATA } from './buildSheet';
import type { AreaConfig } from 'class-system';
import { SPECIAL_FAMILIES, type SpecialFamily } from '../../combate/specials';
import { SCHOOL_STRIKE_FORM, type StrikeForm } from './strikeForm';
import { familiaDoEspecial, nomeDoEspecial, descricaoDoEspecial, SUBSTANTIVOS_ESPECIAL } from './nomeEspecial';

export interface SkillText { pt: string; en: string }

export interface StageSkill {
  /** 'basica' | 'especial' — o papel da skill no par. */
  tipo: 'basica' | 'especial';
  nome: SkillText;
  descricao: SkillText;
  /** id do elemento (base ou par) — vocabulário do class-system. */
  elementoId: string;
  elementoNome: SkillText;
  escolaId: EscolaId;
  recursoId: RecursoId;
  /** Área do golpe (Q-AREA, contexto §2.16): POR ESCOLA — conjuração e longo alcance
   *  em círculo de 4 m (`RAIO_MAXIMO_BASE` do class-system), as outras de alvo único.
   *  O núcleo de combate lê `area.tipo === 'circulo'` como área. */
  area: AreaConfig;
  /** PR9: a família do efeito (uma das 7 do núcleo de combate). A básica é sempre `direct`; a do especial
   *  muda a cada estágio. Ausente só em dado antigo: os consumidores caem em `familyOfEscola`. */
  familia?: SpecialFamily;
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

export interface StageSkills { basica: StageSkill; especial: StageSkill }

/** Raio-base do class-system (`RAIO_MAXIMO_BASE`), em metros. */
export const RAIO_AREA_BASE_METROS = 4;

/** Q-AREA: escolas de área. As demais acertam um alvo só. */
export const ESCOLAS_DE_AREA: readonly EscolaId[] = ['conjuracao', 'longo_alcance'];

/** A área de uma escola (função pura da escola — determinística por ficha/estágio). */
export function areaDaEscola(escola: EscolaId): AreaConfig {
  return ESCOLAS_DE_AREA.includes(escola) ? { tipo: 'circulo', raioMetros: RAIO_AREA_BASE_METROS } : { tipo: 'unico' };
}

const PAR_NOME = new Map(DERIVED_ELEMENT_PAIRS.map(d => [d.id, d]));

export function elementoNomeDe(id: string): SkillText {
  const par = PAR_NOME.get(id);
  if (par) {
    const candidate = { id: par.id, nome: par.nome, score: 0, componentes: par.componentes };
    return { pt: essenceLabel(candidate, true), en: essenceLabel(candidate, false) };
  }
  return { pt: baseElementLabel(id, true), en: baseElementLabel(id, false) };
}

/** Substantivos da BÁSICA por escola, sorteio determinístico. O ESPECIAL tem léxico, família e nome próprios em `nomeEspecial.ts` (PR9). */
const NOMES: Record<EscolaId, {
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
  evocacao: {
    basica: [{ pt: 'Chamado de', en: 'Call' }, { pt: 'Eco de', en: 'Echo' }, { pt: 'Vulto de', en: 'Wisp' },
      { pt: 'Aceno de', en: 'Beckon' }, { pt: 'Presságio de', en: 'Omen' }, { pt: 'Rastro de', en: 'Trail' }],
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

const DISTRIBUIDAS: EscolaId[] = ['combate_fisico', 'longo_alcance', 'conjuracao', 'benca', 'maldicao'];

export function escolaDominante(ficha: Ficha): EscolaId {
  let melhor: EscolaId = 'conjuracao';
  let melhorPts = -1;
  for (const escola of DISTRIBUIDAS) {
    const pts = ficha.escolas[escola] ?? 0;
    if (pts > melhorPts) { melhor = escola; melhorPts = pts; }
  }
  return melhor;
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
  /** Substantivos e famílias já usados nos estágios anteriores — a jornada não pode mostrar o mesmo
   *  nome nem o mesmo efeito de especial em dois cards. Mutado ao gerar (chaves `esp:` e `fam:`). */
  usados?: Set<string>,
  /** Elemento dominante da leitura do perfil (tendência leve da família do especial). */
  tendencia?: string,
): StageSkills {
  const ranked = rankElementos(ficha);
  const topBase = ranked.find(r => BASE_SET.has(r.id))?.id ?? CLASS_ELEMENT_ORDER[0];
  const topGeral = ranked[0]?.id ?? topBase;
  // básica fala a língua de todo dia (base); especial, a mais avançada.
  const elBasica = topBase;
  const elEspecial = topGeral !== topBase ? topGeral
    : (ranked.find(r => r.id !== topBase)?.id ?? topBase);

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
    const familiasUsadas = new Set<SpecialFamily>(
      SPECIAL_FAMILIES.filter(f => usados?.has(`fam:${f}`)),
    );
    const familia = familiaDoEspecial({ escola, elementoId: elEspecial, tendencia, seedKey, stage, familiasUsadas });
    const evitar = new Set([...(usados ?? [])].filter(k => k.startsWith('esp:')).map(k => k.slice(4)));
    const nome = nomeDoEspecial({ familia, elemento: b.elementoNome, elementoBasica: elementoNomeDe(elBasica), seedKey, stage }, evitar);
    usados?.add(`fam:${familia}`);
    // a chave do substantivo é o EN dele (o primeiro token que não é elemento): guardamos o nome inteiro EN
    for (const n of SUBSTANTIVOS_ESPECIAL[familia]) if (nome.en.includes(n.en)) usados?.add(`esp:${n.en}`);
    return {
      ...b,
      nome,
      descricao: descricaoDoEspecial(familia, b.elementoNome, { pt: recursoNomePt, en: recursoNomeEn }),
      familia,
    };
  };

  return { basica: montarBasica(), especial: montarEspecial() };
}

/** As skills de todos os estágios de uma vez (pipeline / persistência). */
export function buildAllStageSkills(
  fichaByStage: Record<FichaStage, Ficha>,
  seedKey: string,
  tendencia?: string,
): Record<FichaStage, StageSkills> {
  const saida = {} as Record<FichaStage, StageSkills>;
  const usados = new Set<string>();
  for (const stage of Object.keys(fichaByStage) as FichaStage[]) {
    saida[stage] = buildStageSkills(fichaByStage[stage], stage, seedKey, usados, tendencia);
  }
  return saida;
}
