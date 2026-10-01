/**
 * ROSTER DOS CHEFES E GUARDIÕES (leva `poderosos`, rodada 3, aprovada pelo
 * dono em 30/09–01/10/2026). Fonte: `E:/Soulmon-assets/out/rodada3/poderosos/
 * ROSTER.md` + `MANIFEST.md` (sha256 conferido na instalação).
 *
 * 24 criaturas originais, amarradas por FUNÇÃO do jogo (Torneio, Corrida,
 * Masmorra, Duelo, Feira, Ateliê, Refúgio, Passeio, Laboratório, Sonhos,
 * Mercado). ⚠️ **SEM CHAMADA HOJE**: a arte e os dados estão registrados, mas
 * NENHUMA tela desenha um chefe ainda — onde cada um entra é decisão de jogo
 * (`docs/PERGUNTAS-DO-DONO.md`, "onde os 24 chefes entram"). A coluna
 * `funcao` é a SUGESTÃO do ROSTER, não uma fiação.
 *
 * Elementos: ids reais do class-system (`Class-System/taxonomy.json`,
 * `src/registry/elementos.ts` e `combinacoes.ts`). O nome EN vem SEMPRE de
 * `utils/soulProfile/essenceLabels.ts` (`essenceEn`) — dono único; aqui só
 * mora o PT, que é o nome do class-system.
 *
 * Nenhum nome termina em "-mon" (régua: `bossRoster.test.ts`). Lore sem
 * cobrança, sem número, sem emoji.
 */
import { essenceEn } from '../utils/soulProfile/essenceLabels';

export type BossTier = 'guardiao' | 'chefe';

/** Enquadramento da arte: `busto` (formato NPC, o padrão dos 24) ou `corpo-inteiro` (sprite para a arena). */
export type BossForm = 'busto' | 'corpo-inteiro';

export type BossFunction =
  | 'torneio' | 'corrida' | 'masmorra' | 'duelo' | 'feira' | 'atelie'
  | 'refugio' | 'passeio' | 'laboratorio' | 'sonhos' | 'mercado';

export interface BossElement {
  /** id do class-system (derivado de 2º/3º nível ou combinação de 4). */
  id: string;
  /** Nome PT do class-system. O EN sai de `essenceEn(id)`. */
  pt: string;
}

export interface BossEntry {
  /** Slug do arquivo: `assets/soulmon/bosses/boss-<id>.png`. */
  id: string;
  namePt: string;
  nameEn: string;
  tier: BossTier;
  funcao: BossFunction;
  /** Papel sugerido dentro da função (PT/EN). */
  papelPt: string;
  papelEn: string;
  elements: BossElement[];
  lorePt: string;
  loreEn: string;
  /** Enquadramentos que existem em arte. Ausente = só `busto`. O Arauto do Fim também tem `corpo-inteiro`
   *  (`boss-arauto-do-fim-full.png`, 01/10/2026, "pendente do dono" no MANIFEST — o busto aprovado segue intacto). */
  formas?: readonly BossForm[];
}

const el = (id: string, pt: string): BossElement => ({ id, pt });

export const BOSS_ROSTER: readonly BossEntry[] = [
  {
    id: 'arauto-do-fim', namePt: 'Arauto do Fim', nameEn: 'Herald of the End', tier: 'chefe', funcao: 'torneio',
    papelPt: 'Chefe da Arena (final do Torneio)', papelEn: 'Arena boss (Tournament final)',
    elements: [el('juizo_final', 'Juízo Final'), el('julgamento', 'Julgamento'), el('requiem', 'Réquiem'), el('ocaso', 'Ocaso')],
    formas: ['busto', 'corpo-inteiro'],
    lorePt: 'Não ruge nem ataca primeiro: toca a trombeta uma vez, e a arena inteira sabe que a última rodada começou.',
    loreEn: 'It never roars or strikes first: it sounds its horn once, and the whole arena knows the last round has begun.',
  },
  {
    id: 'cinderhorn', namePt: 'Cinderhorn', nameEn: 'Cinderhorn', tier: 'guardiao', funcao: 'torneio',
    papelPt: 'Guardião da Arena (preliminar do Torneio)', papelEn: 'Arena guardian (Tournament preliminary)',
    elements: [el('fervor', 'Fervor'), el('lava', 'Lava'), el('brado', 'Brado')],
    lorePt: 'Crava as garras no chão três vezes antes de cada luta; só então a arena acende.',
    loreEn: 'It digs its claws into the ground three times before every bout; only then does the arena light up.',
  },
  {
    id: 'thrummer', namePt: 'Thrummer', nameEn: 'Thrummer', tier: 'guardiao', funcao: 'corrida',
    papelPt: 'Guardião da Corrida (largada e obstáculos)', papelEn: 'Race guardian (start and obstacles)',
    elements: [el('tempestade', 'Tempestade'), el('estampido', 'Estampido'), el('impeto', 'Ímpeto')],
    lorePt: 'Chega antes do próprio trovão e para na linha de chegada, esperando o barulho alcançá-la.',
    loreEn: 'It arrives before its own thunder and waits at the finish line for the sound to catch up.',
  },
  {
    id: 'squallstride', namePt: 'Squallstride', nameEn: 'Squallstride', tier: 'chefe', funcao: 'corrida',
    papelPt: 'Chefe da Corrida (chefe do percurso)', papelEn: 'Race boss (master of the course)',
    elements: [el('trovao', 'Trovão'), el('furacao', 'Furacão')],
    lorePt: 'Não corre na pista: é a pista que passa debaixo dele.',
    loreEn: 'It does not run the track: the track runs beneath it.',
  },
  {
    id: 'orbitant', namePt: 'Orbitant', nameEn: 'Orbitant', tier: 'guardiao', funcao: 'masmorra',
    papelPt: 'Chefe do andar 3 (câmara de gravidade)', papelEn: 'Floor 3 boss (gravity chamber)',
    elements: [el('peso_descomunal', 'Peso Descomunal'), el('asteroide', 'Asteroide')],
    lorePt: 'O que é pequeno cai em órbita em volta dele; o que é grande, ele deixa passar.',
    loreEn: 'Small things fall into orbit around it; large things it lets pass.',
  },
  {
    id: 'mycelar', namePt: 'Mycelar', nameEn: 'Mycelar', tier: 'chefe', funcao: 'masmorra',
    papelPt: 'Chefe do andar 4 (caverna úmida)', papelEn: 'Floor 4 boss (damp cavern)',
    elements: [el('miasma', 'Miasma'), el('parasita', 'Parasita'), el('ossuario', 'Ossuário')],
    lorePt: 'É uma criatura só por baixo da caverna inteira; o urso é só a parte que resolveu se levantar.',
    loreEn: 'It is a single creature beneath the whole cavern; the bear is only the part that decided to stand up.',
  },
  {
    id: 'obsidarch', namePt: 'Obsidarch', nameEn: 'Obsidarch', tier: 'chefe', funcao: 'masmorra',
    papelPt: 'Chefe do andar 5 (último andar da masmorra)', papelEn: 'Floor 5 boss (the dungeon’s last floor)',
    elements: [el('obsidiana', 'Obsidiana'), el('tita', 'Titã'), el('galvanismo', 'Galvanismo')],
    lorePt: 'Uma montanha de vidro escuro que só se move quando alguém chega ao fim.',
    loreEn: 'A mountain of dark glass that only moves when someone reaches the end.',
  },
  {
    id: 'bladeveil', namePt: 'Bladeveil', nameEn: 'Bladeveil', tier: 'guardiao', funcao: 'duelo',
    papelPt: 'Guardião do Duelo (mestre de esgrima)', papelEn: 'Duel guardian (fencing master)',
    elements: [el('lamina_viva', 'Lâmina Viva'), el('espectro', 'Espectro'), el('esgrima', 'Esgrima')],
    lorePt: 'Cumprimenta com a ponta da lâmina e devolve a primeira rodada, sempre.',
    loreEn: 'It salutes with the tip of its blade and always gives the first round back.',
  },
  {
    id: 'sabrefin', namePt: 'Sabrefin', nameEn: 'Sabrefin', tier: 'chefe', funcao: 'duelo',
    papelPt: 'Chefe do Duelo (campeão)', papelEn: 'Duel boss (champion)',
    elements: [el('lamina_oculta', 'Lâmina Oculta'), el('contratempo', 'Contratempo'), el('reflexo', 'Reflexo')],
    lorePt: 'Nunca ataca primeiro; o golpe dela sempre chega um instante antes do seu.',
    loreEn: 'It never strikes first; its blow always lands a moment before yours.',
  },
  {
    id: 'glimmerswarm', namePt: 'Glimmerswarm', nameEn: 'Glimmerswarm', tier: 'guardiao', funcao: 'feira',
    papelPt: 'Guardião da Feira (vitrine e multidão)', papelEn: 'Fair guardian (stalls and crowd)',
    elements: [el('alento', 'Alento'), el('fulgor', 'Fulgor')],
    lorePt: 'Mil pontinhos de luz formam uma asa enorme e, no fim do dia, se dispersam sem pressa.',
    loreEn: "A thousand points of light form one huge wing and, at day's end, drift apart without hurry.",
  },
  {
    id: 'corallume', namePt: 'Corallume', nameEn: 'Corallume', tier: 'chefe', funcao: 'feira',
    papelPt: 'Guardião do Bestiário (vitrine aquática)', papelEn: 'Bestiary guardian (aquatic showcase)',
    elements: [el('mare', 'Maré'), el('sinfonia', 'Sinfonia'), el('vitalidade', 'Vitalidade')],
    lorePt: 'Um recife inteiro que respira junto; cada peixinho é uma voz de um coro muito antigo.',
    loreEn: 'An entire reef breathing as one; each little fish is a voice in a very old choir.',
  },
  {
    id: 'halorune', namePt: 'Halorune', nameEn: 'Halorune', tier: 'guardiao', funcao: 'atelie',
    papelPt: 'Guardião do Ateliê (biblioteca)', papelEn: 'Atelier guardian (library)',
    elements: [el('runa', 'Runa'), el('ocultismo', 'Ocultismo'), el('eco', 'Eco')],
    lorePt: 'Um anel que lê em voz baixa tudo o que passa perto, e nunca repete em voz alta.',
    loreEn: 'A ring that quietly reads everything passing near it, and never repeats it aloud.',
  },
  {
    id: 'chorale', namePt: 'Chorale', nameEn: 'Chorale', tier: 'chefe', funcao: 'atelie',
    papelPt: 'Chefe do Ateliê (constructo de cristal)', papelEn: 'Atelier boss (crystal construct)',
    elements: [el('cristal', 'Cristal'), el('harmonia', 'Harmonia'), el('cantico', 'Cântico')],
    lorePt: 'Toca sozinho a nota que faltava a quem entrou.',
    loreEn: 'It plays, on its own, the note its visitor was missing.',
  },
  {
    id: 'drifela', namePt: 'Drifela', nameEn: 'Drifela', tier: 'guardiao', funcao: 'refugio',
    papelPt: 'Guardião do Refúgio (piscina de repouso)', papelEn: 'Refuge guardian (resting pool)',
    elements: [el('nascente', 'Nascente'), el('melodia', 'Melodia Vital')],
    lorePt: 'Sobe e desce com a água do salão; as franjas acendem quando alguém passa por baixo.',
    loreEn: "It rises and sinks with the hall's water; its frills light up when someone passes beneath.",
  },
  {
    id: 'hollowmere', namePt: 'Hollowmere', nameEn: 'Hollowmere', tier: 'chefe', funcao: 'refugio',
    papelPt: 'Chefe do Refúgio (lago de repouso)', papelEn: 'Refuge boss (resting lake)',
    elements: [el('florescer', 'Florescer'), el('selva', 'Selva'), el('ancora_vital', 'Âncora Vital')],
    lorePt: 'Dorme de olhos abertos; o jardim nas costas só floresce quando o salão inteiro está em silêncio.',
    loreEn: 'It sleeps with its eyes open; the garden on its back only blooms when the whole hall is quiet.',
  },
  {
    id: 'astrawing', namePt: 'Astrawing', nameEn: 'Astrawing', tier: 'guardiao', funcao: 'passeio',
    papelPt: 'Guardião das Travessias (rota de migração)', papelEn: 'Crossings guardian (migration route)',
    elements: [el('estratosfera', 'Estratosfera'), el('constelacao', 'Constelação')],
    lorePt: 'Migra todo ano pelo mesmo caminho e deixa, em cada parada, uma estrela pendurada.',
    loreEn: 'It migrates the same road every year and leaves one hanging star at each stop.',
  },
  {
    id: 'nebulara', namePt: 'Nebulara', nameEn: 'Nebulara', tier: 'chefe', funcao: 'passeio',
    papelPt: 'Chefe das Travessias (raia-celeste)', papelEn: 'Crossings boss (sky ray)',
    elements: [el('nebulosa', 'Nebulosa'), el('vazio', 'Vazio')],
    lorePt: 'A raia que nada pelo céu e deixa estrelas novas na esteira.',
    loreEn: 'The ray that swims through the sky and leaves new stars in its wake.',
  },
  {
    id: 'voltbloom', namePt: 'Voltbloom', nameEn: 'Voltbloom', tier: 'guardiao', funcao: 'laboratorio',
    papelPt: 'Guardião do Laboratório (estufa)', papelEn: 'Laboratory guardian (greenhouse)',
    elements: [el('sinapse', 'Sinapse'), el('flora', 'Flora')],
    lorePt: 'Uma flor que cresceu em volta de uma bobina e nunca soube qual das duas veio primeiro.',
    loreEn: 'A flower that grew around a coil and never learned which of the two came first.',
  },
  {
    id: 'graftfang', namePt: 'Graftfang', nameEn: 'Graftfang', tier: 'chefe', funcao: 'laboratorio',
    papelPt: 'Chefe do Laboratório (câmara de mutação)', papelEn: 'Laboratory boss (mutation chamber)',
    elements: [el('mutacao', 'Mutação'), el('galvanismo', 'Galvanismo'), el('vitalidade', 'Vitalidade')],
    lorePt: 'Cada parte veio de um bicho diferente; foi ele quem decidiu que agora são uma só.',
    loreEn: 'Every part came from a different beast; it was the one who decided they are now one.',
  },
  {
    id: 'duskveil', namePt: 'Duskveil', nameEn: 'Duskveil', tier: 'guardiao', funcao: 'sonhos',
    papelPt: 'Guardião dos Sonhos (limiar)', papelEn: 'Dreams guardian (threshold)',
    elements: [el('crepusculo', 'Crepúsculo'), el('sussurro', 'Sussurro'), el('espectro', 'Espectro')],
    lorePt: 'Um manto sem dono que carrega uma única lanterna e nunca a apaga.',
    loreEn: 'A cloak with no owner that carries a single lantern and never lets it go out.',
  },
  {
    id: 'dawnloom', namePt: 'Dawnloom', nameEn: 'Dawnloom', tier: 'guardiao', funcao: 'sonhos',
    papelPt: 'Guardião dos Sonhos (amanhecer)', papelEn: 'Dreams guardian (dawn)',
    elements: [el('aurora', 'Aurora'), el('santidade', 'Santidade')],
    lorePt: 'Tece o amanhecer em fios; o que sobra fica pendurado no teto.',
    loreEn: 'It weaves dawn into threads; whatever is left hangs from the ceiling.',
  },
  {
    id: 'aeonyx', namePt: 'Aeonyx', nameEn: 'Aeonyx', tier: 'chefe', funcao: 'sonhos',
    papelPt: 'Chefe dos Sonhos (sonho lendário)', papelEn: 'Dreams boss (legendary dream)',
    elements: [el('eon', 'Éon'), el('entropia', 'Entropia'), el('continuum', 'Continuum')],
    lorePt: 'A areia cai das rachaduras e volta a subir; ele nunca acaba, só muda de lado.',
    loreEn: 'Sand falls from its cracks and rises again; it never runs out, it only turns over.',
  },
  {
    id: 'tallyjack', namePt: 'Tallyjack', nameEn: 'Tallyjack', tier: 'guardiao', funcao: 'mercado',
    papelPt: 'Guardião do Mercado (balcão)', papelEn: 'Market guardian (counter)',
    elements: [el('ouro_vivo', 'Ouro Vivo'), el('magnetismo', 'Magnetismo')],
    lorePt: 'Conta cada peça duas vezes e, no fim, devolve o troco em sorriso.',
    loreEn: 'It counts every piece twice and gives the change back as a smile.',
  },
  {
    id: 'cuprex', namePt: 'Cuprex', nameEn: 'Cuprex', tier: 'chefe', funcao: 'mercado',
    papelPt: 'Chefe do Mercado (golem-mercador)', papelEn: 'Market boss (merchant golem)',
    elements: [el('aco', 'Aço'), el('nucleo', 'Núcleo'), el('tita', 'Titã')],
    lorePt: 'Um titã de cobre velho; a pátina verde é a única coisa que ele deixa alguém tocar.',
    loreEn: 'A titan of old copper; the green patina is the only thing it lets anyone touch.',
  },
];

// Glob eager (padrão de `utils/attackFxArt.ts`): o Vite empacota cada PNG e
// devolve a URL final. Id sem arte → `undefined` (quem chamar cai no fallback).
const modules = import.meta.glob('../assets/soulmon/bosses/boss-*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const isFull = (path: string) => /-full\.png$/.test(path);

/** Busto (o enquadramento dos 24): `boss-<id>.png`. */
export const BOSS_ART: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(modules).filter(([path]) => !isFull(path)).map(([path, url]) => [/\/boss-([a-z-]+)\.png$/.exec(path)![1], url]),
);

/** Corpo inteiro (`boss-<id>-full.png`): hoje só o Arauto do Fim. */
export const BOSS_FULL_ART: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(modules).filter(([path]) => isFull(path)).map(([path, url]) => [/\/boss-([a-z-]+)-full\.png$/.exec(path)![1], url]),
);

export function bossArt(id: string, forma: BossForm = 'busto'): string | undefined {
  return forma === 'corpo-inteiro' ? BOSS_FULL_ART[id] : BOSS_ART[id];
}

/** Nome, papel, elementos e lore de um chefe no idioma pedido. */
export function bossText(entry: BossEntry, isPt: boolean): { name: string; papel: string; elements: string[]; lore: string } {
  return {
    name: isPt ? entry.namePt : entry.nameEn,
    papel: isPt ? entry.papelPt : entry.papelEn,
    elements: entry.elements.map(e => (isPt ? e.pt : essenceEn(e.id) ?? e.pt)),
    lore: isPt ? entry.lorePt : entry.loreEn,
  };
}
