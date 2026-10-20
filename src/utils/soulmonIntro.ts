// A apresentação do Soulmon pago (D-110..D-116): o Soulmon se apresenta numa NpcSequence depois do batismo.
// Função PURA e determinística: sem IA, sem rede, sem efeito de jogo. Só fala.
import type { ActivityCategory } from '../types/attributes';
import { FOOD_BY_CATEGORY } from '../constants/labels';
import { COUNTERS } from './arena';
import { elementoConhecido, elementoNomeDe, baseDominanteDoElemento } from './soulProfile/ficha/elementoNome';

export interface SoulmonIntroInput {
  /** Nome escolhido no batismo (petNameFinal) ou baseName no upgrade. */
  name: string;
  /** Id do oráculo (agua|fogo|terra|ar|sombra|luz|planta|industrial) OU id base/par do class-system. */
  element: string;
  /** `result.dominantAlignment` (nunca powerPoints). */
  alignment: 'poder' | 'harmonia' | 'benevolencia';
  /** Id de PET_PASSIVES (src/utils/passives.ts). */
  petPassive?: string;
  /** Categorias das atividades iniciais. */
  categories?: readonly ActivityCategory[];
  /** Bio do reveal, só para garantir que nenhuma fala a repete. */
  bio?: { pt: string; en: string };
}

/** Teto de caracteres de cada frase (pedaço entre '\n'). */
export const INTRO_FRASE_MAX = 90;

/** Clichês que nenhuma fala pode conter (comparação sem caixa). */
export const INTRO_CLICHES_PROIBIDOS: readonly string[] = [
  'journey', 'embark', "I'm here to", "together we'll grow", 'jornada', 'estou aqui para',
];

// TODO rebasear: a frente fix/elemento-oraculo-perfil cria o dono único do mapa oráculo->classe;
// trocar esta normalização por ele. Hoje só os dois ids do oráculo que não existem no class-system.
const ORACULO_PARA_CLASSE: Record<string, string> = { planta: 'vida', industrial: 'aco' };

// Mesma tabela de src/utils/premiumFood.ts (PT_NAMES), em minúsculo e já traduzida.
const COMIDA_PT: Record<string, string> = {
  Protein: 'proteína', Salad: 'salada', Apple: 'maçã', Coffee: 'café',
  Juice: 'suco', Rice: 'arroz', Pizza: 'pizza', Candy: 'doce',
};

const TRACO: Record<string, { en: string; pt: string }> = {
  guloso: { en: "And I'm a foodie: I enjoy every single meal.", pt: 'E sou guloso: aproveito cada refeição.' },
  carinhoso: { en: "I'm cuddly, too. A little affection goes a long way.", pt: 'Também sou carinhoso: um pouco de colo faz diferença.' },
  teimoso: { en: "I'm stubborn, too. A rough day doesn't shake me much.", pt: 'Também sou teimoso: um dia ruim não me abala tanto.' },
  sortudo: { en: "I'm lucky, too. I tend to stumble into good things.", pt: 'Também sou sortudo: costumo tropeçar em coisa boa.' },
  madrugador: { en: "I'm an early bird, too. I like keeping my own hours.", pt: 'Também sou madrugador: gosto de ter meus horários.' },
};

const CAMINHO: Record<SoulmonIntroInput['alignment'], { en: string; pt: string }> = {
  poder: { en: "I lean toward Power: when something matters, I like to face it head on.", pt: 'Puxo para o Poder: quando algo importa, gosto de ir de frente.' },
  harmonia: { en: 'I lean toward Harmony: I like things in balance, one step at a time.', pt: 'Puxo para a Harmonia: gosto das coisas em equilíbrio, um passo de cada vez.' },
  benevolencia: { en: "I lean toward Benevolence: I feel best when I'm looking after someone.", pt: 'Puxo para a Benevolência: fico melhor quando estou cuidando de alguém.' },
};

/** O elemento com VANTAGEM sobre `base`: primeiro cujo 1º alvo é a base; senão primeiro que a contém. */
function elementoQueLevaVantagem(base: string): string | null {
  const ids = Object.keys(COUNTERS);
  return ids.find(e => COUNTERS[e][0] === base) ?? ids.find(e => COUNTERS[e].includes(base)) ?? null;
}

/** A comida da categoria mais frequente; empate vai para a 1ª na ordem de `FOOD_BY_CATEGORY`. */
function comidaFavorita(categories: readonly ActivityCategory[] | undefined): string | null {
  if (!categories || categories.length === 0) return null;
  let melhor: string | null = null;
  let max = 0;
  for (const cat of Object.keys(FOOD_BY_CATEGORY) as ActivityCategory[]) {
    const n = categories.filter(c => c === cat).length;
    if (n > max) { max = n; melhor = FOOD_BY_CATEGORY[cat].name; }
  }
  return melhor;
}

export function soulmonIntroLines(input: SoulmonIntroInput, lang: 'en' | 'pt'): string[] {
  const pt = lang === 'pt';
  const nome = input.name.trim();
  const baloes: string[] = [];

  baloes.push(pt
    ? `Oi, eu sou ${nome}.\nSou uma contraparte digital da sua alma, e juntos vamos crescer.`
    : `Hi, I'm ${nome}.\nI'm a digital counterpart of your soul, and we grow together.`);

  const el = ORACULO_PARA_CLASSE[input.element] ?? input.element;
  if (elementoConhecido(el)) {
    const rotulo = elementoNomeDe(el)[pt ? 'pt' : 'en'];
    const contra = elementoQueLevaVantagem(baseDominanteDoElemento(el));
    const l1 = pt ? `Meu elemento principal é ${rotulo}.` : `My main element is ${rotulo}.`;
    if (contra && elementoConhecido(contra)) {
      const rc = elementoNomeDe(contra)[pt ? 'pt' : 'en'];
      baloes.push(`${l1}\n${pt
        ? `Já de ${rc} eu não gosto: leva vantagem sobre mim.`
        : `I'm not a fan of ${rc}, though. It gets the better of me.`}`);
    } else {
      baloes.push(l1);
    }
  }

  const comida = comidaFavorita(input.categories);
  const gosto = comida
    ? (pt ? `Gosto muito de ${COMIDA_PT[comida] ?? comida.toLowerCase()}.` : `I really like ${comida.toLowerCase()}.`)
    : null;
  const tracoTxt = input.petPassive ? TRACO[input.petPassive]?.[pt ? 'pt' : 'en'] : undefined;
  const b3 = [gosto, tracoTxt].filter((s): s is string => !!s);
  if (b3.length > 0) baloes.push(b3.join('\n'));

  // O caminho sempre existe: garante >= 3 balões mesmo sem dados.
  baloes.push(CAMINHO[input.alignment][pt ? 'pt' : 'en']);

  // Garantia: nenhuma fala repete a bio do reveal.
  const bio = input.bio?.[pt ? 'pt' : 'en']?.trim();
  const sobra = bio ? baloes.filter(b => b.trim() !== bio) : baloes;
  // Faltou dado (elemento desconhecido, sem categorias, sem traço): o 1º balão se divide nas suas duas frases,
  // sem inventar fala nova, para manter >= 3 balões.
  if (sobra.length < 3) {
    const [a, b] = sobra[0].split('\n');
    return [a, b, ...sobra.slice(1)];
  }
  return sobra;
}
