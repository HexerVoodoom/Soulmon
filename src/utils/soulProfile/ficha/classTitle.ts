// ---------------------------------------------------------------------------
// Classe da criatura — pedido do dono: "a classe da criatura, gerada a
// partir do que ela faz, suas skills, talvez talentos e também de seus
// elementos". O class-system já tem exatamente esse conceito: ARQUÉTIPOS são
// identidades que EMERGEM da distribuição de pontos (elemento + escola +
// recurso — a mesma ficha que já gera as skills), nunca escolhidas à mão.
// Não inventamos uma segunda classificação: `calcularProgressao` (motor
// real, import dinâmico) já devolve `arquetipos` (condição plena) e
// `arquetiposDiluidos` (meia-identidade, de combinações amplas) — usamos os
// dois, com um fallback genérico por elemento dominante para quando nenhum
// arquétipo nasceu ainda (comum em rookie, antes da ficha concentrar).
//
// Nome PT vem AO VIVO do motor (`ArquetipoDef.nome`) — zero cópia, zero
// risco de divergir se o class-system renomear um arquétipo (footgun 9). O
// EN é tradução própria do Soulmon, indexada pelo `id` do arquétipo — ESSE
// sim precisa ser mantido aqui, porque o class-system é PT-only. `id` é a
// parte estável (a prosa do `nome`/`descricao` é que muda com mais
// frequência), então a tradução por id sobrevive a um reescrita de nome lá.
// ---------------------------------------------------------------------------

import type { Ficha } from './types';
import type { LText } from '../../oracle';
import { baseElementLabel } from '../essenceLabels';
import { buildRealPersonagem } from './realEngine';
import { CLASS_ELEMENT_ORDER } from '../types';

export interface ClassTitle {
  /** Nome PT+EN — o que a página do Pet mostra. */
  nome: LText;
  /** 'arquetipo' = condição plena; 'diluido' = meia-identidade (combinação
   *  ampla); 'generico' = nenhum arquétipo nasceu ainda, cai no elemento
   *  dominante. */
  origem: 'arquetipo' | 'diluido' | 'generico';
  /**
   * Chave do SIGILO da classe (`utils/sigilArt.ts`, nome do arquivo em
   * `assets/soulmon/sigilos/`) — a peça que a Ficha desenha a 48 no canto
   * superior esquerdo do visor (canvas Pet, D-P4). A ESCOLA vence o elemento
   * porque o elemento já é dito dentro do vidro pela aura (D9): o sigilo diz
   * o que a aura não diz. Opcional porque o cache no save (`soulmonClassTitles`)
   * anterior a 20/09/2026 não o tem — sem chave, a Ficha não desenha sigilo
   * (nunca inventa um), até a próxima recomputação preencher o cache.
   */
  sigilo?: string;
}

/**
 * Tradução EN dos 79 arquétipos do class-system, por ID (estável). O PT vem
 * direto do motor — não duplicado aqui.
 */
export const CLASS_TITLE_EN: Record<string, string> = {
  necromante: 'Necromancer',
  verdejante: 'Verdant Warden',
  demonologista: 'Demonologist',
  senhor_dos_mortos_vis: 'Lord of the Vile Dead',
  arsenal_espectral: 'Spectral Arsenal',
  piromante_vegetal: 'Verdant Pyromancer',
  engenheiro_galvanico: 'Galvanic Engineer',
  senhor_das_feras: 'Beastlord',
  horologista_do_horror: 'Abomination Weaver',
  avatar_primordial: 'Primordial Avatar',
  lavamante: 'Lavamancer',
  tempestario: 'Stormcaller',
  feiticeiro_do_abismo: 'Abyssal Sorcerer',
  arquimago: 'Archmage',
  portador_do_nulo: 'Null Bearer',
  berserker: 'Berserker',
  cavaleiro_da_morte: 'Death Knight',
  paladino: 'Paladin',
  espadachim_arcano: 'Arcane Swordsman',
  sombra_ambulante: 'Walking Shadow',
  olho_da_tormenta: 'Eye of the Storm',
  atirador_fantasma: 'Phantom Marksman',
  mestre_de_armas: 'Weapon Master',
  forjador_de_guerra: 'War Forger',
  arsenal_arcano: 'Arcane Arsenal',
  avatar_da_guerra: 'War Avatar',
  santo_guardiao: 'Holy Guardian',
  mestre_das_runas: 'Rune Master',
  corruptor: 'Corruptor',
  toxicologista: 'Toxicologist',
  inquisidor: 'Inquisitor',
  vampiro_espiritual: 'Spirit Vampire',
  guardiao_do_ciclo: 'Warden of the Cycle',
  geomante: 'Geomancer',
  cronomante: 'Chronomancer',
  senhor_do_paradoxo: 'Lord of Paradox',
  bardo: 'Bard',
  alquimista: 'Alchemist',
  xama_totemico: 'Totem Shaman',
  feiticeiro_de_cartas: 'Card Sorcerer',
  bokor: 'Bokor',
  tecelao_de_sangue: 'Blood Weaver',
  cavaleiro_dragao: 'Dragoon',
  cavalaria_negra: 'Black Cavalry',
  mago_vermelho: 'Red Mage',
  cabalista: 'Kabbalist',
  invocador: 'Summoner',
  menestrel: 'Minstrel',
  trovador_sombrio: 'Dark Troubadour',
  senhor_da_gravidade: 'Lord of Gravity',
  astromante: 'Astromancer',
  viajante_dimensional: 'Dimensional Traveler',
  demiurgo: 'Demiurge',
  vulcanologo: 'Volcanologist',
  senhor_das_neves: 'Lord of Snow',
  gladiador_arq: 'Gladiator',
  executor: 'Executioner',
  epidemiologista: 'Epidemiologist',
  taumaturgo: 'Thaumaturge',
  astrofisico: 'Astrophysicist',
  guardiao_do_horizonte: 'Warden of the Horizon',
  hipnotizador: 'Hypnotist',
  vidente: 'Seer',
  jardineiro_eterno: 'Eternal Gardener',
  faroleiro: 'Lighthouse Keeper',
  senhor_do_clima: 'Lord of Weather',
  portador_do_cataclismo: 'Cataclysm Bearer',
  arauto_do_fim: 'Herald of the End',
  demiurgo_absoluto: 'Architect of Reality',
  elementalista_pleno: 'Full Elementalist',
  cavaleiro_absoluto_arq: 'Absolute Knight',
  portador_do_ragnarok: 'Bearer of Ragnarök',
  semeador: 'Sower',
  regente_do_caos: 'Regent of Chaos',
  mestre_encantador: 'Master Enchanter',
  escriba_do_pacto: 'Scribe of the Pact',
  mestre_de_banquete: 'Feast Master',
  luthier_de_guerra: 'War Luthier',
  cartografo_dimensional: 'Dimensional Cartographer',
};

interface CondicaoLike {
  elementos?: Record<string, number>;
  escolas?: Record<string, number>;
  recursos?: Record<string, number>;
}

/** Quão ESPECÍFICO um arquétipo é: mais dimensões de exigência e limiares
 *  mais altos = identidade mais rara/específica — é essa que vale mostrar
 *  quando a ficha desbloqueia mais de uma ao mesmo tempo. */
function especificidade(condicao: CondicaoLike): number {
  const grupos = [condicao.elementos, condicao.escolas, condicao.recursos];
  let dimensoes = 0;
  let somaLimiares = 0;
  for (const grupo of grupos) {
    if (!grupo) continue;
    for (const limiar of Object.values(grupo)) {
      dimensoes += 1;
      somaLimiares += limiar;
    }
  }
  return dimensoes * 1000 + somaLimiares;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function melhorArquetipo(lista: any[]): any | undefined {
  if (!lista.length) return undefined;
  return [...lista].sort((a, b) => especificidade(b.condicao) - especificidade(a.condicao))[0];
}

const BASE_SET = new Set<string>(CLASS_ELEMENT_ORDER);

/** Elemento BASE dominante da ficha (maior pontuação direta), pro fallback
 *  genérico quando a ficha ainda não destravou arquétipo nenhum. */
function elementoBaseDominante(ficha: Ficha): string {
  let melhor: string = CLASS_ELEMENT_ORDER[0];
  let melhorPts = -1;
  for (const [id, pts] of Object.entries(ficha.elementos)) {
    if (!BASE_SET.has(id) || (pts ?? 0) <= melhorPts) continue;
    melhor = id;
    melhorPts = pts ?? 0;
  }
  return melhor;
}

/**
 * O sigilo de uma classe, a partir da CONDIÇÃO do arquétipo que a nomeou:
 * a escola de maior limiar; sem escola, o elemento de maior limiar; sem
 * nenhum dos dois (fallback genérico), o elemento base dominante da ficha —
 * que é o mesmo que dá nome ao "Adepto de …". Pura e determinística.
 */
export function sigiloDaClasse(condicao: CondicaoLike | undefined, ficha: Ficha): string {
  const maior = (grupo?: Record<string, number>): string | undefined => {
    let melhor: string | undefined;
    let melhorPts = -Infinity;
    for (const [id, pts] of Object.entries(grupo ?? {})) {
      if (pts > melhorPts) { melhor = id; melhorPts = pts; }
    }
    return melhor;
  };
  return maior(condicao?.escolas) ?? maior(condicao?.elementos) ?? elementoBaseDominante(ficha);
}

/**
 * Classe de UM estágio. Determinística: função da ficha (que já é função da
 * identidade), então reroll não troca a classe — mesmo padrão das skills.
 */
export async function computeClassTitle(ficha: Ficha): Promise<ClassTitle> {
  const { prog } = await buildRealPersonagem(ficha);

  const pleno = melhorArquetipo(prog.arquetipos);
  if (pleno) {
    return {
      nome: { pt: pleno.nome, en: CLASS_TITLE_EN[pleno.id] ?? pleno.nome },
      origem: 'arquetipo',
      sigilo: sigiloDaClasse(pleno.condicao, ficha),
    };
  }

  const diluido = melhorArquetipo(prog.arquetiposDiluidos);
  if (diluido) {
    const en = CLASS_TITLE_EN[diluido.id] ?? diluido.nome;
    return {
      nome: { pt: `Aspirante a ${diluido.nome}`, en: `${en} Aspirant` },
      origem: 'diluido',
      sigilo: sigiloDaClasse(diluido.condicao, ficha),
    };
  }

  const elId = elementoBaseDominante(ficha);
  return {
    nome: {
      pt: `Adepto de ${baseElementLabel(elId, true)}`,
      en: `${baseElementLabel(elId, false)} Adept`,
    },
    origem: 'generico',
    sigilo: elId,
  };
}

/** `computeClassTitle` pra todos os estágios de uma vez. */
export async function computeClassTitlesAllStages(
  fichaByStage: Record<string, Ficha>,
): Promise<Record<string, ClassTitle>> {
  const entries = await Promise.all(
    Object.entries(fichaByStage).map(async ([stage, ficha]) => {
      try {
        return [stage, await computeClassTitle(ficha)] as const;
      } catch {
        return [stage, undefined] as const;
      }
    }),
  );
  return Object.fromEntries(entries.filter((e): e is [string, ClassTitle] => e[1] !== undefined));
}
