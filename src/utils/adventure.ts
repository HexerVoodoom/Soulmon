/**
 * A AVENTURA DA NOITE — o que a criatura traz de volta.
 *
 * Fecha o último item aberto de `docs/PLANO-TAREFAS.md` §2.4: *"durante o dia o
 * pet saiu, e à noite ele volta com um achado variável e narrado. O que ele
 * traz depende do que você fez, mas qual ele traz é imprevisível."*
 *
 * O modelo é o Finch, e o motivo está escrito no benchmark do plano: **a
 * recompensa é narrativa, não numérica — e narrativa não satura.** Um número
 * que sobe todo dia vira ruído em duas semanas; uma cena que você nunca viu,
 * não.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUATRO REGRAS QUE ESTE ARQUIVO NÃO PODE QUEBRAR
 *
 * 1. **NENHUM DIA VOLTA DE MÃOS VAZIAS.** Um dia ruim traz uma cena mais
 *    silenciosa — nunca nada. O relatório de um dia ruim já é o momento mais
 *    frágil do app; transformá-lo num segundo lugar onde a pessoa perde algo é
 *    exatamente a cobrança que a essência declarada proíbe. Há teste.
 *
 * 2. **NÃO PAGA NADA.** Sem Bits, sem item, sem atributo, sem XP (decisão do
 *    dono, 08/09/2026). Recompensa material transformaria o relatório num lugar
 *    que a pessoa PRECISA abrir para não perder coisa — o oposto de um ritual
 *    tranquilo — e criaria um farm onde hoje não há nada para farmar.
 *
 * 3. **É DETERMINÍSTICO POR DIA.** Mesma seed, mesmo estado, mesmo achado.
 *    Reabrir o relatório não re-sorteia: um achado que muda a cada abertura é
 *    um caça-níquel, e ensina a pessoa a reabrir a tela em vez de viver o dia.
 *    A aleatoriedade mora na seed (o `dayKey`), nunca aqui dentro.
 *
 * 4. **O DIA MEXE NA CHANCE, NUNCA NO ACESSO.** Cumprir a meta aumenta a chance
 *    de um achado raro. Não cumprir reduz a chance — e nunca zera nem bloqueia
 *    nada. Não existe achado que só quem teve um dia bom possa ver.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Mesma arquitetura do Dex de Sonhos (`utils/restWindow.ts`), de propósito: ela
 * já resolveu catálogo por raridade, sorteio determinístico que prefere o não
 * coletado, e coleção com data. Inventar uma segunda forma para o mesmo
 * problema seria o footgun 9 em escala de módulo.
 */
import { hashString, mulberry32 } from './oracle';

export type AdventureRarity = 'common' | 'rare' | 'legendary';

export interface AdventureFind {
  id: string;
  /**
   * O glifo. É emoji por enquanto, e a estrutura já aceita PNG: foi o caminho
   * dos Sonhos e da decoração, que nasceram emoji e receberam arte depois sem
   * reescrever nada. O emoji FICA mesmo depois da arte — é o único glifo que
   * cabe num push, num título de notificação ou num log, onde não há `<img>`.
   */
  emoji: string;
  titlePt: string;
  titleEn: string;
  /** A cena. Primeira pessoa da criatura, sempre — quem viajou foi ela. */
  textPt: string;
  textEn: string;
  rarity: AdventureRarity;
}

/**
 * O catálogo.
 *
 * VOZ: a criatura conta o que viu, no passado, para alguém que ficou. Nunca
 * avalia o dia de quem leu, nunca usa a segunda pessoa para cobrar ("você não
 * fez"), e nunca pede nada. As cenas de dia ruim são as mais quietas do
 * catálogo, e é isso que as torna adequadas — não são consolo explícito, que
 * soaria como diagnóstico.
 */
export const ADVENTURE_CATALOG: readonly AdventureFind[] = [
  // ── comuns: o dia a dia da viagem ─────────────────────────────────────────
  {
    id: 'adv-orvalho', emoji: '💧', rarity: 'common',
    titlePt: 'Orvalho na folha larga', titleEn: 'Dew on a broad leaf',
    textPt: 'Encontrei uma folha do meu tamanho cheia de orvalho e bebi tudo. Depois deitei nela um pouco.',
    textEn: 'I found a leaf my own size full of dew and drank all of it. Then I lay on it for a while.',
  },
  {
    id: 'adv-pegadas', emoji: '🐾', rarity: 'common',
    titlePt: 'Pegadas que não eram minhas', titleEn: 'Footprints that were not mine',
    textPt: 'Segui umas pegadas por um bom tempo. No fim elas davam a volta e voltavam para casa, igual às minhas.',
    textEn: 'I followed some footprints for a long while. In the end they looped around and came home, just like mine.',
  },
  {
    id: 'adv-pedra-lisa', emoji: '🪨', rarity: 'common',
    titlePt: 'A pedra mais lisa do riacho', titleEn: 'The smoothest stone in the creek',
    textPt: 'Testei muitas. Essa aqui é a mais lisa. Trouxe para você ver, mas acho que vou querer de volta.',
    textEn: 'I tested a lot of them. This one is the smoothest. I brought it to show you, though I think I want it back.',
  },
  {
    id: 'adv-vento-morno', emoji: '🍃', rarity: 'common',
    titlePt: 'Um vento morno no meio da tarde', titleEn: 'A warm wind mid-afternoon',
    textPt: 'Parei de andar só para sentir. Não tinha nada para achar ali, e mesmo assim valeu a parada.',
    textEn: 'I stopped walking just to feel it. There was nothing to find there, and it was still worth stopping for.',
  },
  {
    id: 'adv-semente', emoji: '🌱', rarity: 'common',
    titlePt: 'Uma semente teimosa', titleEn: 'A stubborn seed',
    textPt: 'Nasceu numa fresta de pedra, onde não devia dar. Fiquei olhando um tempo e vim embora sem mexer.',
    textEn: 'It sprouted in a crack in the rock, where it had no business growing. I watched a while and left it alone.',
  },
  {
    id: 'adv-eco', emoji: '🗻', rarity: 'common',
    titlePt: 'Um eco que respondeu', titleEn: 'An echo that answered',
    textPt: 'Gritei o seu nome num vale e ele voltou duas vezes. Gritei de novo só para conferir.',
    textEn: "I shouted your name into a valley and it came back twice. I shouted again just to check.",
  },
  {
    id: 'adv-caminho-curto', emoji: '🧭', rarity: 'common',
    titlePt: 'Um atalho que era mais longo', titleEn: 'A shortcut that was longer',
    textPt: 'Achei um caminho novo, tinha certeza de que cortava. Cheguei mais tarde e vi coisas que não teria visto.',
    textEn: 'I found a new path and was sure it cut the distance. I arrived later and saw things I would have missed.',
  },
  {
    id: 'adv-chuva-curta', emoji: '🌦️', rarity: 'common',
    titlePt: 'Uma chuva de três minutos', titleEn: 'A three-minute rain',
    textPt: 'Me escondi debaixo de um cogumelo grande. Quando saí já tinha passado, e o cheiro do chão estava ótimo.',
    textEn: 'I hid under a big mushroom. When I came out it had already passed, and the ground smelled wonderful.',
  },
  {
    id: 'adv-sombra-boa', emoji: '🌳', rarity: 'common',
    titlePt: 'Uma sombra do tamanho certo', titleEn: 'A shade exactly my size',
    textPt: 'Andei bastante e cansei. Sentei numa sombra que parecia feita para mim e fiquei ali até esfriar.',
    textEn: 'I walked a lot and got tired. I sat in a shade that felt made for me and stayed until it cooled down.',
  },
  {
    id: 'adv-passaro', emoji: '🐦', rarity: 'common',
    titlePt: 'Um pássaro que não fugiu', titleEn: 'A bird that did not fly off',
    textPt: 'Cheguei bem perto e ele continuou ali, me encarando. Um dos dois tinha que desviar o olhar, e fui eu.',
    textEn: 'I got close and it stayed put, staring at me. One of us had to look away, and it was me.',
  },
  {
    id: 'adv-concha', emoji: '🐚', rarity: 'common',
    titlePt: 'Uma concha longe do mar', titleEn: 'A shell far from the sea',
    textPt: 'Estava no meio do campo, o que não faz sentido nenhum. Encostei no ouvido e não tinha barulho de onda.',
    textEn: 'It was in the middle of a field, which makes no sense. I held it to my ear and there was no wave sound.',
  },
  {
    id: 'adv-nuvem', emoji: '☁️', rarity: 'common',
    titlePt: 'Uma nuvem com a sua cara', titleEn: 'A cloud shaped like you',
    textPt: 'Juro que era. Fiquei olhando até virar outra coisa, e aí voltei.',
    textEn: 'I swear it was. I watched until it turned into something else, and then I headed back.',
  },

  // ── raras ─────────────────────────────────────────────────────────────────
  {
    id: 'adv-porta-arvore', emoji: '🚪', rarity: 'rare',
    titlePt: 'Uma porta no tronco', titleEn: 'A door in a tree trunk',
    textPt: 'Do tamanho de uma moeda, com maçaneta e tudo. Bati. Ninguém abriu, mas ouvi passos lá dentro.',
    textEn: 'Coin-sized, with a handle and everything. I knocked. Nobody opened, but I heard footsteps inside.',
  },
  {
    id: 'adv-lago-espelho', emoji: '🪞', rarity: 'rare',
    titlePt: 'Um lago que refletia outro céu', titleEn: 'A lake reflecting a different sky',
    textPt: 'Estava nublado onde eu estava, e no reflexo era noite estrelada. Não encostei na água.',
    textEn: 'It was overcast where I stood, and in the reflection it was a starry night. I did not touch the water.',
  },
  {
    id: 'adv-mapa-rasgado', emoji: '🗺️', rarity: 'rare',
    titlePt: 'Metade de um mapa', titleEn: 'Half of a map',
    textPt: 'Rasgado bem no meio. A parte que sobrou mostra um lugar que eu ainda não sei onde fica.',
    textEn: 'Torn right down the middle. The half that remains shows a place I still cannot locate.',
  },
  {
    id: 'adv-sino', emoji: '🔔', rarity: 'rare',
    titlePt: 'Um sino sem badalo', titleEn: 'A bell with no clapper',
    textPt: 'Balancei e não fez som nenhum. Mas os bichos por perto viraram a cabeça ao mesmo tempo.',
    textEn: 'I shook it and it made no sound. But every animal nearby turned its head at once.',
  },
  {
    id: 'adv-escada', emoji: '🪜', rarity: 'rare',
    titlePt: 'Uma escada que não encostava em nada', titleEn: 'A ladder leaning on nothing',
    textPt: 'De pé sozinha no meio da clareira. Subi três degraus e desci — não porque tive medo, só não era hoje.',
    textEn: 'Standing on its own in a clearing. I climbed three rungs and came down — not from fear, it just was not today.',
  },
  {
    id: 'adv-carta', emoji: '✉️', rarity: 'rare',
    titlePt: 'Uma carta sem destinatário', titleEn: 'A letter with no addressee',
    textPt: 'Estava lacrada e sem nome. Deixei onde encontrei, mas passei o dia pensando nela.',
    textEn: 'Sealed, with no name on it. I left it where I found it, and thought about it all day.',
  },
  {
    id: 'adv-flor-fora', emoji: '🌼', rarity: 'rare',
    titlePt: 'Uma flor fora de época', titleEn: 'A flower out of season',
    textPt: 'Não era o mês dela e ela estava aberta assim mesmo. Achei que você ia gostar de saber.',
    textEn: 'It was not her month and she was open anyway. I thought you would like knowing that.',
  },
  {
    id: 'adv-trilha-antiga', emoji: '🏚️', rarity: 'rare',
    titlePt: 'Uma casa que alguém amou', titleEn: 'A house someone loved',
    textPt: 'Vazia há muito tempo, e ainda dava para ver onde ficava a mesa. Saí sem levar nada.',
    textEn: 'Empty for a long time, and you could still see where the table stood. I left without taking anything.',
  },

  // ── lendárias ─────────────────────────────────────────────────────────────
  {
    id: 'adv-cometa', emoji: '☄️', rarity: 'legendary',
    titlePt: 'Um risco no céu, de dia', titleEn: 'A streak across the daytime sky',
    textPt: 'Aconteceu rápido e ninguém mais viu. Fiquei um tempo olhando para cima esperando o segundo, que não veio.',
    textEn: 'It happened fast and nobody else saw it. I stared up a while waiting for a second one, which never came.',
  },
  {
    id: 'adv-guardiao', emoji: '🗿', rarity: 'legendary',
    titlePt: 'Alguém muito velho e muito quieto', titleEn: 'Someone very old and very quiet',
    textPt: 'Não disse nada e eu também não. Ficamos ali um tempo e depois cada um seguiu o seu caminho.',
    textEn: 'It said nothing and neither did I. We stayed there a while, then each of us went our own way.',
  },
  {
    id: 'adv-ponte', emoji: '🌉', rarity: 'legendary',
    titlePt: 'Uma ponte para o outro lado', titleEn: 'A bridge to the other side',
    textPt: 'Dava para atravessar. Cheguei até o meio, olhei para trás e voltei — de lá não dava para ver você.',
    textEn: 'It was crossable. I got halfway, looked back, and returned — from there I could not see you.',
  },
  {
    id: 'adv-aurora', emoji: '🌌', rarity: 'legendary',
    titlePt: 'O céu inteiro mudando de cor', titleEn: 'The whole sky changing colour',
    textPt: 'Durou muito mais do que eu esperava. Não tenho como trazer isso, então guardei do jeito que dá.',
    textEn: 'It lasted far longer than I expected. There is no way to carry that home, so I kept it the only way I can.',
  },
];

const POR_RARIDADE: Record<AdventureRarity, readonly AdventureFind[]> = {
  common: ADVENTURE_CATALOG.filter(a => a.rarity === 'common'),
  rare: ADVENTURE_CATALOG.filter(a => a.rarity === 'rare'),
  legendary: ADVENTURE_CATALOG.filter(a => a.rarity === 'legendary'),
};

export const findById = (id: string): AdventureFind | undefined =>
  ADVENTURE_CATALOG.find(a => a.id === id);

/**
 * A CHANCE de cada faixa, em função de quanto do dia foi cumprido.
 *
 * `ratio` é `feito / meta`, limitado a 1. Repare no que a tabela NÃO faz: a
 * linha de baixo (dia parado) continua tendo chance de raro e de lendário. O
 * dia mexe na probabilidade, nunca no acesso — não existe achado reservado a
 * quem teve um dia bom, e é isso que separa isto de um battle pass.
 *
 * As faixas são três porque um gradiente contínuo seria imperceptível: a pessoa
 * não sente 4% virar 4,7%, e uma regra que ninguém sente é uma regra que não
 * precisa existir.
 */
export const ADVENTURE_ODDS: ReadonlyArray<{
  minRatio: number;
  rare: number;
  legendary: number;
}> = [
  { minRatio: 1, rare: 0.30, legendary: 0.08 },   // cumpriu a meta
  { minRatio: 0.5, rare: 0.20, legendary: 0.04 }, // meio caminho
  { minRatio: 0, rare: 0.12, legendary: 0.02 },   // dia parado — MENOS, nunca ZERO
];

/**
 * Sorteia a raridade do achado da noite. Determinístico pela `seed`.
 *
 * `meta <= 0` (nada cadastrado para o dia) cai na faixa de cima: não há o que
 * cumprir, então não há por que a pessoa receber a chance mais baixa por um dia
 * que o próprio jogo decidiu não cobrar.
 */
export function adventureRarity(feito: number, meta: number, seed: number): AdventureRarity {
  const ratio = meta > 0 ? Math.min(1, Math.max(0, feito / meta)) : 1;
  const faixa = ADVENTURE_ODDS.find(f => ratio >= f.minRatio) ?? ADVENTURE_ODDS[ADVENTURE_ODDS.length - 1];
  const r = mulberry32(seed >>> 0)();
  if (r < faixa.legendary) return 'legendary';
  if (r < faixa.legendary + faixa.rare) return 'rare';
  return 'common';
}

/**
 * Escolhe o achado da faixa, preferindo um que a pessoa ainda NÃO tem — a
 * coleção avança em vez de devolver repetido enquanto houver o que descobrir.
 * Quando a faixa acaba, repete: um catálogo esgotado não pode virar tela vazia.
 */
export function rollAdventure(
  colecionados: readonly string[],
  rarity: AdventureRarity,
  seed: number,
): string {
  const pool = POR_RARIDADE[rarity];
  if (pool.length === 0) return ADVENTURE_CATALOG[0].id;
  const tem = new Set(colecionados);
  const inicio = Math.floor(mulberry32((seed ^ 0x9e3779b9) >>> 0)() * pool.length) % pool.length;
  for (let i = 0; i < pool.length; i++) {
    const c = pool[(inicio + i) % pool.length];
    if (!tem.has(c.id)) return c.id;
  }
  return pool[inicio].id;
}

export interface AdventureEntry {
  id: string;
  /** O `dayKey` DO JOGADOR em que o achado entrou — nunca o relógio do aparelho. */
  day: string;
}

/**
 * O achado de um dia, de ponta a ponta. É esta a função que a UI chama.
 *
 * `dayKey` é a seed: o mesmo dia devolve sempre o mesmo achado, quantas vezes a
 * pessoa reabrir o relatório. Sem isso o relatório vira caça-níquel, e a pessoa
 * aprende a reabrir a tela em vez de viver o dia.
 */
export function adventureOfDay(
  colecionados: readonly string[],
  feito: number,
  meta: number,
  dayKey: string,
): AdventureFind {
  const seed = hashString(`adventure:${dayKey}`);
  const rarity = adventureRarity(feito, meta, seed);
  const id = rollAdventure(colecionados, rarity, seed);
  // O catálogo é a fonte da verdade; um id órfão (achado removido numa versão
  // futura) devolve o primeiro em vez de quebrar a tela de quem já o tinha.
  return findById(id) ?? ADVENTURE_CATALOG[0];
}

/**
 * Guarda no diário. Idempotente: rever o relatório do mesmo dia não duplica, e
 * reencontrar um achado antigo mantém a data da PRIMEIRA vez — é ela que faz a
 * coleção ser uma história ("esse foi na primeira semana") em vez de uma lista.
 */
export function collectAdventure(
  diario: readonly AdventureEntry[],
  id: string,
  dayKey: string,
): AdventureEntry[] {
  if (diario.some(e => e.id === id)) return [...diario];
  return [...diario, { id, day: dayKey }];
}
