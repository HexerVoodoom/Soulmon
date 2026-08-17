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
  /** Custo qualitativo por desenho: básica é frequente, especial é rara. */
  custo: 'baixo' | 'alto';
}

export interface StageSkills { basica: StageSkill; especial: StageSkill }

const PAR_NOME = new Map(DERIVED_ELEMENT_PAIRS.map(d => [d.id, d]));

function elementoNomeDe(id: string): SkillText {
  const par = PAR_NOME.get(id);
  if (par) {
    const candidate = { id: par.id, nome: par.nome, score: 0, componentes: par.componentes };
    return { pt: essenceLabel(candidate, true), en: essenceLabel(candidate, false) };
  }
  return { pt: baseElementLabel(id, true), en: baseElementLabel(id, false) };
}

/** Substantivos por escola — 2 variantes por tipo, sorteio determinístico. */
const NOMES: Record<EscolaId, {
  basica: Array<{ pt: string; en: string }>;
  especial: Array<{ pt: string; en: string }>;
}> = {
  combate_fisico: {
    basica: [{ pt: 'Golpe de', en: 'Strike' }, { pt: 'Investida de', en: 'Rush' }],
    especial: [{ pt: 'Fúria de', en: 'Fury' }, { pt: 'Avalanche de', en: 'Avalanche' }],
  },
  longo_alcance: {
    basica: [{ pt: 'Disparo de', en: 'Shot' }, { pt: 'Flecha de', en: 'Arrow' }],
    especial: [{ pt: 'Chuva de', en: 'Barrage' }, { pt: 'Salva de', en: 'Volley' }],
  },
  conjuracao: {
    basica: [{ pt: 'Lampejo de', en: 'Spark' }, { pt: 'Rajada de', en: 'Bolt' }],
    especial: [{ pt: 'Tormenta de', en: 'Tempest' }, { pt: 'Cataclismo de', en: 'Cataclysm' }],
  },
  benca: {
    basica: [{ pt: 'Toque de', en: 'Touch' }, { pt: 'Sopro de', en: 'Breath' }],
    especial: [{ pt: 'Êxtase de', en: 'Rapture' }, { pt: 'Aurora de', en: 'Halo' }],
  },
  maldicao: {
    basica: [{ pt: 'Marca de', en: 'Mark' }, { pt: 'Aflição de', en: 'Bane' }],
    especial: [{ pt: 'Sentença de', en: 'Doom' }, { pt: 'Eclipse de', en: 'Eclipse' }],
  },
  evocacao: {
    basica: [{ pt: 'Chamado de', en: 'Call' }, { pt: 'Eco de', en: 'Echo' }],
    especial: [{ pt: 'Convocação de', en: 'Summoning' }, { pt: 'Legião de', en: 'Legion' }],
  },
};

const DESCRICAO: Record<'basica' | 'especial', (el: SkillText, recurso: string, recursoEn: string) => SkillText> = {
  basica: (el, recurso, recursoEn) => ({
    en: `A quick ${el.en.toLowerCase()} technique with a low ${recursoEn.toLowerCase()} cost — reliable, ready whenever it's needed.`,
    pt: `Uma técnica rápida de ${el.pt.toLowerCase()} com custo baixo de ${recurso.toLowerCase()} — confiável, pronta sempre que precisar.`,
  }),
  especial: (el, recurso, recursoEn) => ({
    en: `A devastating burst of ${el.en.toLowerCase()} that drains ${recursoEn.toLowerCase()} — saved for the moments that matter.`,
    pt: `Uma explosão devastadora de ${el.pt.toLowerCase()} que drena ${recurso.toLowerCase()} — guardada para os momentos decisivos.`,
  }),
};

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

function escolaDominante(ficha: Ficha): EscolaId {
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
  /** Substantivos já usados nos estágios anteriores — a jornada não pode
   *  mostrar "Investida de Ar" em três cards seguidos. Mutado ao gerar. */
  usados?: Set<string>,
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

  const montar = (tipo: 'basica' | 'especial', elementoId: string): StageSkill => {
    const el = elementoNomeDe(elementoId);
    // evita repetir o mesmo substantivo em estágios diferentes: a ficha
    // escala mantendo a identidade (mesmo elemento dominante), então sem isto
    // a página do Pet mostrava o mesmo nome de skill em 3 formas seguidas.
    const banco = NOMES[escola][tipo];
    const livres = usados ? banco.filter(n => !usados.has(n.pt)) : banco;
    const substantivo = pick(rng, livres.length > 0 ? livres : banco);
    usados?.add(substantivo.pt);
    return {
      tipo,
      nome: { pt: `${substantivo.pt} ${el.pt}`, en: `${el.en} ${substantivo.en}` },
      descricao: DESCRICAO[tipo](el, recursoNomePt, recursoNomeEn),
      elementoId,
      elementoNome: el,
      escolaId: escola,
      recursoId: recurso,
      custo: tipo === 'basica' ? 'baixo' : 'alto',
    };
  };

  return { basica: montar('basica', elBasica), especial: montar('especial', elEspecial) };
}

/** As skills de todos os estágios de uma vez (pipeline / persistência). */
export function buildAllStageSkills(
  fichaByStage: Record<FichaStage, Ficha>,
  seedKey: string,
): Record<FichaStage, StageSkills> {
  const saida = {} as Record<FichaStage, StageSkills>;
  const usados = new Set<string>();
  for (const stage of Object.keys(fichaByStage) as FichaStage[]) {
    saida[stage] = buildStageSkills(fichaByStage[stage], stage, seedKey, usados);
  }
  return saida;
}
