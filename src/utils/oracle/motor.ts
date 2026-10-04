/**
 * Motor de geração do Oráculo (a "leitura"): pontuação de elementos/papéis/
 * alinhamentos/reinos, nomes, formas de evolução, prompts de sprite.
 *
 * Saiu de `../oracle.ts` em 04/10/2026 (rodada 6, perf): era ~70 KB do chunk de
 * ENTRADA e só roda na criação/renascimento — quem chama é `generateOracleAsync`
 * (em `../oracle.ts`) por `import()`. NUNCA importe este arquivo estaticamente
 * de código do chunk de entrada (`oracleBundleSplit.contract.test.ts` cobra).
 * Testes e scripts que precisam do corpo síncrono importam daqui.
 */
import type { OracleInputSync, OracleInputWithClass, FamiliasOraculo, ElementId, RoleId, AlignmentId, RealmId, LText, OracleInput, OracleOverrides, ScoreEntry, ArchetypeResult, CreatureStage, OracleResult, FamilySlot, FamilyResult, QuestionEffects, CaminhoRitual } from '../oracle';
import {
  hashString,
  mulberry32,
  pick,
  normalizeName,
  upperFirstText,
  computeNumerology,
  signInfoByName,
  westernSunSign,
  approximateAscendant,
  computeChinese,
  computeVedic,
  ELEMENT_INFO,
  ROLE_INFO,
  ALIGNMENT_INFO,
  REALM_INFO,
  ALIGNMENT_ORDER,
  REALM_ORDER,
  NUMBER_ELEMENTS,
  NUMBER_ROLES,
  ELEMENT_ORDER,
  ROLE_ORDER,
  ORACLE_QUESTIONS,
  RITUAL_ELEMENT_SCALE,
  RITUAL_ALIGNMENT_SCALE,
  RITUAL_REALM_SCALE,
  ROLE_DOMINANCE_COMPENSATION,
  ELEMENT_PATH_COMPENSATION,
  REALM_DOMINANCE_COMPENSATION,
  NUMBER_ALIGNMENT,
  ROLE_ALIGNMENT,
  REALM_WEIGHTS,
  STAGE_NAMES,
  VOWELS,
  CHINESE_ANIMALS,
  CHINESE_ELEMENTS,
  ZODIAC_ELEMENT_ROLE,
  MODALITY_ROLE,
  CHINESE_ANIMAL_ROLE,
  CHINESE_ELEMENT_MAP,
  ELEMENT_DOMINANCE_COMPENSATION,
  ZODIAC_ELEMENT_ALIGNMENT,
  CHINESE_ANIMAL_ALIGNMENT,
} from '../oracle';
import type { CreatureFamily, Subfamily } from './familias';
import type { SoulProfile } from '../soulProfile/profile';

const ALIGNMENT_REALM_BONUS: Record<AlignmentId, RealmId[]> = {
  poder: ['picos', 'deserto'],
  harmonia: ['akasha', 'cavernas'],
  benevolencia: ['campina', 'floresta'],
};

// ---------------------------------------------------------------------------
// 6. Arquétipo — bancos de palavras
// ---------------------------------------------------------------------------

const NOUNS_BY_ELEMENT: Record<ElementId, Array<{ pt: string; en: string }>> = {
  agua: [
    { pt: 'Sereia', en: 'mermaid' }, { pt: 'Leviatã', en: 'leviathan' }, { pt: 'Maré', en: 'tide' },
    { pt: 'Água-viva', en: 'jellyfish' }, { pt: 'Nascente', en: 'spring well' }, { pt: 'Kraken', en: 'kraken' },
  ],
  fogo: [
    { pt: 'Fênix', en: 'phoenix' }, { pt: 'Salamandra', en: 'salamander' }, { pt: 'Vulcão', en: 'volcano' },
    { pt: 'Braseiro', en: 'brazier' }, { pt: 'Cometa', en: 'comet' }, { pt: 'Dragão', en: 'dragon' },
  ],
  terra: [
    { pt: 'Golem', en: 'golem' }, { pt: 'Montanha', en: 'mountain' }, { pt: 'Cristal', en: 'crystal' },
    { pt: 'Urso', en: 'bear' }, { pt: 'Fortaleza', en: 'fortress' }, { pt: 'Menir', en: 'menhir' },
  ],
  ar: [
    { pt: 'Grifo', en: 'griffin' }, { pt: 'Ventania', en: 'gale' }, { pt: 'Pipa', en: 'kite' },
    { pt: 'Falcão', en: 'falcon' }, { pt: 'Nuvem', en: 'cloud' }, { pt: 'Zéfiro', en: 'zephyr' },
  ],
  sombra: [
    { pt: 'Eclipse', en: 'eclipse' }, { pt: 'Corvo', en: 'raven' }, { pt: 'Lanterna', en: 'lantern' },
    { pt: 'Esfinge', en: 'sphinx' }, { pt: 'Névoa', en: 'mist' }, { pt: 'Pantera', en: 'panther' },
  ],
  luz: [
    { pt: 'Farol', en: 'lighthouse' }, { pt: 'Unicórnio', en: 'unicorn' }, { pt: 'Aurora', en: 'aurora' },
    { pt: 'Estrela', en: 'star' }, { pt: 'Prisma', en: 'prism' }, { pt: 'Vaga-lume', en: 'firefly' },
  ],
  planta: [
    { pt: 'Mandrágora', en: 'mandrake' }, { pt: 'Carvalho', en: 'oak tree' }, { pt: 'Vitória-régia', en: 'giant water lily' },
    { pt: 'Cacto', en: 'cactus' }, { pt: 'Cogumelo', en: 'mushroom' }, { pt: 'Bambu', en: 'bamboo' },
  ],
  industrial: [
    { pt: 'Autômato', en: 'automaton' }, { pt: 'Engrenagem', en: 'gear' }, { pt: 'Dínamo', en: 'dynamo' },
    { pt: 'Relógio', en: 'clockwork' }, { pt: 'Locomotiva', en: 'locomotive' }, { pt: 'Satélite', en: 'satellite' },
  ],
};

// Adjetivos por função (concordância neutra impossível em PT — usamos formas que
// funcionam razoavelmente com os substantivos do banco; ajuste fino é estético).
const ADJECTIVES_BY_ROLE: Record<RoleId, LText[]> = {
  suporte: [
    { pt: 'acolhedor', en: 'nurturing' }, { pt: 'gentil', en: 'gentle' }, { pt: 'devotado', en: 'devoted' },
    { pt: 'curador', en: 'healing' }, { pt: 'leal', en: 'loyal' },
  ],
  tanque: [
    { pt: 'inabalável', en: 'unshakable' }, { pt: 'protetor', en: 'protective' }, { pt: 'colossal', en: 'colossal' },
    { pt: 'firme', en: 'steadfast' }, { pt: 'blindado', en: 'armored' },
  ],
  fisico: [
    { pt: 'feroz', en: 'fierce' }, { pt: 'indomável', en: 'untamable' }, { pt: 'veloz', en: 'swift' },
    { pt: 'implacável', en: 'relentless' }, { pt: 'valente', en: 'valiant' },
  ],
  magico: [
    { pt: 'arcano', en: 'arcane' }, { pt: 'enigmático', en: 'enigmatic' }, { pt: 'hipnótico', en: 'hypnotic' },
    { pt: 'visionário', en: 'visionary' }, { pt: 'etéreo', en: 'ethereal' },
  ],
  alcance: [
    { pt: 'certeiro', en: 'sharp-eyed' }, { pt: 'paciente', en: 'patient' }, { pt: 'vigilante', en: 'watchful' },
    { pt: 'astuto', en: 'cunning' }, { pt: 'preciso', en: 'precise' },
  ],
};

const ADJECTIVES_BY_ELEMENT: Record<ElementId, LText[]> = {
  agua: [{ pt: 'profundo', en: 'deep' }, { pt: 'sereno', en: 'serene' }, { pt: 'fluido', en: 'flowing' }],
  fogo: [{ pt: 'ardente', en: 'blazing' }, { pt: 'incandescente', en: 'incandescent' }, { pt: 'fervoroso', en: 'fervent' }],
  terra: [{ pt: 'ancestral', en: 'ancient' }, { pt: 'sólido', en: 'solid' }, { pt: 'fértil', en: 'fertile' }],
  ar: [{ pt: 'ligeiro', en: 'nimble' }, { pt: 'etéreo', en: 'airy' }, { pt: 'imprevisível', en: 'unpredictable' }],
  sombra: [{ pt: 'noturno', en: 'nocturnal' }, { pt: 'oculto', en: 'hidden' }, { pt: 'insondável', en: 'unfathomable' }],
  luz: [{ pt: 'radiante', en: 'radiant' }, { pt: 'cintilante', en: 'shimmering' }, { pt: 'benevolente', en: 'benevolent' }],
  planta: [{ pt: 'florescente', en: 'blooming' }, { pt: 'perene', en: 'evergreen' }, { pt: 'silvestre', en: 'wild-grown' }],
  industrial: [{ pt: 'cromado', en: 'chrome-plated' }, { pt: 'incansável', en: 'tireless' }, { pt: 'engenhoso', en: 'ingenious' }],
};

// Pool GRANDE de traços concretos por elemento — usado para o ELEMENTO
// SECUNDÁRIO: vira só um adjetivo/material aplicado na criatura (nunca muda
// a classe definitiva, ver CLASS_MATRIX). Propositalmente maior e mais
// concreto que ADJECTIVES_BY_ELEMENT (que alimenta outros textos).
const ELEMENT_FLAVOR_WORDS: Record<ElementId, LText[]> = {
  agua: [
    { pt: 'aquático', en: 'aquatic' }, { pt: 'translúcido', en: 'translucent' },
    { pt: 'gelado', en: 'frosted' }, { pt: 'perolado', en: 'pearlescent' },
    { pt: 'salgado', en: 'briny' }, { pt: 'abissal', en: 'abyssal' },
    { pt: 'orvalhado', en: 'dew-kissed' }, { pt: 'de maré-viva', en: 'tidal' },
  ],
  fogo: [
    { pt: 'flamejante', en: 'blazing' }, { pt: 'incandescente', en: 'incandescent' },
    { pt: 'acinzentado', en: 'ashen' }, { pt: 'vulcânico', en: 'volcanic' },
    { pt: 'em brasa', en: 'ember-lit' }, { pt: 'fumegante', en: 'smoldering' },
    { pt: 'magmático', en: 'magmatic' }, { pt: 'chamuscado', en: 'scorched' },
  ],
  terra: [
    { pt: 'rochoso', en: 'rocky' }, { pt: 'ancestral', en: 'ancient' },
    { pt: 'argiloso', en: 'clay-formed' }, { pt: 'cristalino', en: 'crystalline' },
    { pt: 'musgoso', en: 'mossy' }, { pt: 'fossilizado', en: 'fossilized' },
    { pt: 'mineral', en: 'mineral-crusted' }, { pt: 'blindado', en: 'armored' },
  ],
  ar: [
    { pt: 'etéreo', en: 'ethereal' }, { pt: 'emplumado', en: 'feathered' },
    { pt: 'tempestuoso', en: 'stormy' }, { pt: 'veloz', en: 'swift' },
    { pt: 'diáfano', en: 'gossamer' }, { pt: 'nebuloso', en: 'misty' },
    { pt: 'eletrizado', en: 'static-charged' }, { pt: 'leve como o ar', en: 'airy' },
  ],
  sombra: [
    { pt: 'sombrio', en: 'shadowy' }, { pt: 'espectral', en: 'spectral' },
    { pt: 'enevoado', en: 'misty' }, { pt: 'sussurrante', en: 'whispering' },
    { pt: 'umbrio', en: 'umbral' }, { pt: 'esfumaçado', en: 'smoky' },
    { pt: 'encoberto', en: 'hidden' }, { pt: 'noturno', en: 'nocturnal' },
  ],
  luz: [
    { pt: 'radiante', en: 'radiant' }, { pt: 'dourado', en: 'gilded' },
    { pt: 'cintilante', en: 'shimmering' }, { pt: 'celestial', en: 'celestial' },
    { pt: 'luminoso', en: 'glowing' }, { pt: 'resplandecente', en: 'resplendent' },
    { pt: 'sagrado', en: 'sacred' }, { pt: 'brilhante', en: 'luminous' },
  ],
  planta: [
    { pt: 'musgoso', en: 'mossy' }, { pt: 'florido', en: 'flowering' },
    { pt: 'espinhoso', en: 'thorny' }, { pt: 'viçoso', en: 'verdant' },
    { pt: 'raizudo', en: 'root-laced' }, { pt: 'fúngico', en: 'fungal' },
    { pt: 'fotossintético', en: 'photosynthetic' }, { pt: 'silvestre', en: 'wild-grown' },
  ],
  industrial: [
    { pt: 'robótico', en: 'robotic' }, { pt: 'ciborgue', en: 'cybernetic' },
    { pt: 'mecânico', en: 'mechanical' }, { pt: 'enferrujado', en: 'rusted' },
    { pt: 'feito de sucata', en: 'scrap-built' }, { pt: 'tipo marionete', en: 'puppet-like' },
    { pt: 'poluído', en: 'polluted' }, { pt: 'cromado', en: 'chrome-plated' },
  ],
};

// ---------------------------------------------------------------------------
// 7. Criatura — bestiário de fusão, características e prompts
// ---------------------------------------------------------------------------

// Bancos AMPLOS de propósito: a máquina de nomes era o gargalo de entropia do
// pipeline (identidade ~96% única virava ~89% de nomes únicos). Regras dos
// bancos: radical curto (4-7 letras), pronunciável, com sabor do elemento/
// reino; NUNCA nome de franquia; evitar quase-gêmeos entre bancos (foi o
// 'Sylvo' da floresta colidindo com o 'Sylva' da planta — Sylvafa/Sylvofa
// eram perceptivelmente o mesmo nome).
const ELEMENT_NAME_STEMS: Record<ElementId, string[]> = {
  agua: ['Aqua', 'Hydro', 'Maris', 'Nixa', 'Undi', 'Coral', 'Naia', 'Torren'],
  fogo: ['Pyra', 'Igni', 'Flare', 'Vulko', 'Faiska', 'Emba', 'Ardo', 'Forna'],
  terra: ['Terra', 'Gaio', 'Rocko', 'Petra', 'Grani', 'Argil', 'Basal', 'Monti'],
  ar: ['Aero', 'Zephy', 'Venti', 'Skye', 'Aira', 'Nimbo', 'Alize', 'Zonda'],
  sombra: ['Umbra', 'Nykta', 'Noxi', 'Krow', 'Duska', 'Vespra', 'Morvo', 'Onyra'],
  luz: ['Lumi', 'Solari', 'Astra', 'Helio', 'Luxa', 'Fulgo', 'Alba', 'Prisma'],
  planta: ['Flora', 'Verdi', 'Sylva', 'Thorn', 'Bromia', 'Vinea', 'Mossa', 'Germi'],
  industrial: ['Mecha', 'Gear', 'Volta', 'Ferro', 'Servo', 'Dyna', 'Cupra', 'Zinka'],
};

const REALM_NAME_STEMS: Record<RealmId, string[]> = {
  deserto: ['Duna', 'Sahar', 'Mira', 'Oasi', 'Cactu', 'Siro'],
  picos: ['Zeka', 'Tromu', 'Raiku', 'Cumo', 'Alpi', 'Cerra'],
  oceano: ['Abyssa', 'Nauti', 'Mareo', 'Ondra', 'Salso', 'Batia'],
  pantano: ['Boggu', 'Mirena', 'Sludge', 'Brego', 'Lodru', 'Charko'],
  floresta: ['Bosco', 'Brume', 'Kodama', 'Cerni', 'Ramu', 'Fronde'],
  cavernas: ['Grotta', 'Stalag', 'Ekko', 'Kripta', 'Geoda', 'Cavra'],
  gelo: ['Kriona', 'Frosta', 'Boreal', 'Nevia', 'Glacu', 'Polara'],
  campina: ['Prati', 'Leana', 'Solis', 'Tryga', 'Relva', 'Savna'],
  akasha: ['Akasha', 'Aetheri', 'Nimbra', 'Mantra', 'Orbe', 'Anima'],
};

// Codas de nome: começam em vogal e vêm sempre depois da consoante da sílaba
// pessoal (radical + consoante + coda) — é o que mantém o resultado
// pronunciável. Até a B4 havia um banco "após vogal" para radical + coda sem
// nada do nome, e esse padrão era o que mais colidia (C8).
const NAME_CODAS_AFTER_CONSONANT = ['is', 'ix', 'ar', 'el', 'yn', 'ia', 'or', 'us', 'eo', 'ax', 'on', 'ura'];
// Cauda curta do padrão radical+sílaba+cauda (a sílaba pessoal termina em
// vogal, então a cauda é 1 consoante ou vogal fechando: Flaredin, Flaredis…).
const NAME_TAILS = ['n', 'r', 's', 'l', 'x', 'a', 'o', 'u'];

// Prefixos de nome por LINHA de evolução (uma linha por tipo) — o nome conta
// a história: Fang→War→Zeed (Poder), Sage→Meta→Aeon (Harmonia), Holy→Arch→Seraph
// (Benevolência), e o Ultra é sempre Triune_. NENHUM nome de estágio leva sufixo
// fixo (ver `rookieName`/`ultraName`) — combinar prefixo + sufixo mecânico
// é o que soletrava nomes de outra franquia.
const CHAMPION_PREFIXES: Record<AlignmentId, string[]> = {
  poder: ['Fang', 'Dark', 'Rage', 'Grim'],
  harmonia: ['Sage', 'Rune', 'Gale', 'Echo'],
  benevolencia: ['Holy', 'Sol', 'Aegis', 'Bell'],
};
const PERFECT_STAGE_PREFIXES: Record<AlignmentId, string[]> = {
  poder: ['War', 'Chaos', 'Doom'],
  harmonia: ['Meta', 'Astra', 'Prime'],
  benevolencia: ['Arch', 'Radiant', 'Lumen'],
};
const MEGA_STAGE_PREFIXES: Record<AlignmentId, string[]> = {
  poder: ['Zeed', 'Omega', 'Abyss'],
  harmonia: ['Aeon', 'Zenith', 'Cosmo'],
  benevolencia: ['Seraph', 'Ultima', 'Elysium'],
};

// ---------------------------------------------------------------------------
// POOL DE FORMAS DE EVOLUÇÃO por nível — arquétipos corporais no espírito dos
// Soulmon (e um pouco de Pokémon): shapes variados por estágio, com afinidade
// de tipo (alignments) e de elemento (elements). Vazio = serve para qualquer.
// A forma é sorteada por linha, sem repetir entre as 9 evoluções.
// ---------------------------------------------------------------------------

interface EvoShape { pt: string; en: string; elements: ElementId[]; alignments: AlignmentId[] }

const CHAMPION_SHAPES: EvoShape[] = [
  { pt: 'dinossauro tirano bípede com elmo de caveira', en: 'a bipedal tyrant dinosaur with a horned skull helm', elements: ['fogo', 'terra'], alignments: ['poder'] },
  { pt: 'fera lupina selvagem de quatro patas', en: 'a savage four-legged wolf beast with bristling fur', elements: ['sombra', 'agua'], alignments: ['poder', 'harmonia'] },
  { pt: 'ogro brutamontes com clava de osso', en: 'a hulking ogre brute swinging a bone club', elements: ['terra'], alignments: ['poder'] },
  { pt: 'guerreiro demônio de asas rasgadas', en: 'a horned demon warrior with tattered wings', elements: ['sombra'], alignments: ['poder'] },
  { pt: 'predador marinho de barbatanas-navalha', en: 'a razor-finned sea predator with a harpoon snout', elements: ['agua'], alignments: ['poder'] },
  { pt: 'serpente venenosa de capuz', en: 'a hooded venomous serpent with dripping fangs', elements: ['sombra', 'planta'], alignments: ['poder'] },
  { pt: 'planta carnívora ambulante', en: 'a walking carnivorous plant with snapping jaw-buds', elements: ['planta'], alignments: ['poder'] },
  { pt: 'fera elegante de cauda-lâmina', en: 'a sleek quadruped beast with a blade-tipped tail', elements: [], alignments: ['harmonia'] },
  { pt: 'inseto blindado de chifre elétrico', en: 'a giant armored insect with a crackling electric horn', elements: ['industrial', 'ar'], alignments: ['harmonia'] },
  { pt: 'coruja-fera de asas rúnicas', en: 'a great owl beast with rune-marked wings', elements: ['ar', 'sombra'], alignments: ['harmonia'] },
  { pt: 'golem sentinela de pedra', en: 'a stone golem sentinel with glowing core lines', elements: ['terra'], alignments: ['harmonia'] },
  { pt: 'raposa mística de várias caudas', en: 'a mystic fox with multiple flowing tails', elements: ['sombra', 'luz'], alignments: ['harmonia'] },
  { pt: 'autômato andarilho de engrenagens', en: 'a clockwork walker automaton with brass joints', elements: ['industrial'], alignments: ['harmonia'] },
  { pt: 'dragão-marinho de coral', en: 'a coral sea-dragon with gem-like eyes', elements: ['agua'], alignments: ['harmonia'] },
  { pt: 'corcel alado nobre', en: 'a noble winged stallion with a shining mane', elements: ['luz', 'ar'], alignments: ['benevolencia'] },
  { pt: 'cão de guarda em armadura de bronze', en: 'a loyal guardian hound in bronze armor', elements: ['luz', 'terra'], alignments: ['benevolencia'] },
  { pt: 'lutador angélico de bastão sagrado', en: 'an angelic fighter wielding a sacred staff', elements: ['luz'], alignments: ['benevolencia'] },
  { pt: 'dragão-flor de asas de pétala', en: 'a flower dragon with petal wings', elements: ['planta'], alignments: ['benevolencia'] },
  { pt: 'yeti guardião das neves', en: 'a gentle snow yeti guardian with icicle bracers', elements: ['agua', 'terra'], alignments: ['benevolencia'] },
  { pt: 'ave-canora gigante da alvorada', en: 'a giant dawn songbird with radiant tail feathers', elements: ['ar', 'luz'], alignments: ['benevolencia'] },
  { pt: 'fera de juba flamejante', en: 'a proud beast with a blazing flame mane', elements: ['fogo'], alignments: [] },
  { pt: 'raptor relâmpago', en: 'a lightning raptor crackling with static', elements: ['ar', 'industrial'], alignments: [] },
  { pt: 'marionete assombrada', en: 'a haunted marionette with living strings', elements: ['sombra', 'industrial'], alignments: ['poder', 'harmonia'] },
  { pt: 'tartaruga guerreira de rio', en: 'a river turtle warrior with a shell-shield', elements: ['agua', 'terra'], alignments: [] },
];

const PERFECT_SHAPES: EvoShape[] = [
  { pt: 'dino ciborgue com canhão no peito', en: 'a cyborg dinosaur with a metal chest cannon and one mechanical arm', elements: ['industrial', 'fogo'], alignments: ['poder'] },
  { pt: 'nobre vampiro de capa alta', en: 'a vampire noble with a high-collared cape and piercing gaze', elements: ['sombra'], alignments: ['poder'] },
  { pt: 'general demônio de seis braços', en: 'a six-armed demon general gripping many weapons', elements: ['sombra', 'fogo'], alignments: ['poder'] },
  { pt: 'ceifador espectral de foice', en: 'a spectral reaper wraith carrying a great scythe', elements: ['sombra'], alignments: ['poder'] },
  { pt: 'leviatã couraçado colossal', en: 'a colossal armored leviathan breaching the deep', elements: ['agua'], alignments: ['poder'] },
  { pt: 'minotauro de guerra acorrentado', en: 'a chained war minotaur with cracked horns', elements: ['terra', 'fogo'], alignments: ['poder'] },
  { pt: 'cavaleiro de armadura completa', en: 'a full-plate armored knight with a greatsword', elements: ['industrial', 'terra'], alignments: ['harmonia', 'benevolencia'] },
  { pt: 'besouro-samurai senhor da lâmina', en: 'a samurai beetle lord with katana-shaped horn blades', elements: ['industrial', 'planta'], alignments: ['harmonia'] },
  { pt: 'mago dos espelhos', en: 'a mirror mage whose body reflects like polished glass', elements: ['luz', 'agua'], alignments: ['harmonia'] },
  { pt: 'místico do planetário', en: 'an orrery mystic with tiny planets orbiting its shoulders', elements: ['luz', 'sombra'], alignments: ['harmonia'] },
  { pt: 'esfinge enigmática', en: 'an enigmatic sphinx posing eternal riddles', elements: ['luz', 'terra'], alignments: ['harmonia'] },
  { pt: 'atirador ciborgue de precisão', en: 'a precision cyborg gunner frame with a long-barrel arm', elements: ['industrial'], alignments: ['harmonia'] },
  { pt: 'rainha-inseto da colmeia', en: 'a regal insect queen with layered wing veils', elements: ['planta', 'ar'], alignments: ['harmonia'] },
  { pt: 'valquíria de lança luminosa', en: 'a valkyrie with a luminous lance and winged helm', elements: ['luz', 'ar'], alignments: ['benevolencia'] },
  { pt: 'sumo-sacerdote bestial', en: 'a beastly high priest in ceremonial vestments', elements: ['luz'], alignments: ['benevolencia'] },
  { pt: 'paladino canino de escudo duplo', en: 'a canine paladin bearing twin shields', elements: ['luz', 'terra'], alignments: ['benevolencia'] },
  { pt: 'rainha do jardim vivo', en: 'a garden queen whose gown blooms with living flowers', elements: ['planta'], alignments: ['benevolencia'] },
  { pt: 'dama da geleira', en: 'a glacier maiden crowned with aurora ice', elements: ['agua', 'luz'], alignments: ['benevolencia'] },
  { pt: 'harpia rainha das tempestades', en: 'a storm harpy queen wreathed in lightning', elements: ['ar'], alignments: [] },
  { pt: 'ancião treant de galhos sábios', en: 'an elder treant with wise branching antlers', elements: ['planta', 'terra'], alignments: [] },
  { pt: 'juggernaut de magma', en: 'a magma juggernaut with molten armor seams', elements: ['fogo', 'terra'], alignments: [] },
];

const MEGA_SHAPES: EvoShape[] = [
  { pt: 'dragão soberano de armadura negra', en: 'a dragon overlord clad in black spiked armor', elements: ['fogo', 'sombra'], alignments: ['poder'] },
  { pt: 'deus-demônio do abismo', en: 'an abyssal demon god wreathed in dark flames', elements: ['sombra'], alignments: ['poder'] },
  { pt: 'deus da guerra berserker de machados gêmeos', en: 'a berserker war god swinging twin great-axes', elements: ['fogo', 'terra'], alignments: ['poder'] },
  { pt: 'serpente do fim que morde o horizonte', en: 'a doom serpent vast enough to bite the horizon', elements: ['agua', 'sombra'], alignments: ['poder'] },
  { pt: 'kaiju de ferro fumegante', en: 'a smoldering iron kaiju with furnace eyes', elements: ['industrial', 'fogo'], alignments: ['poder'] },
  { pt: 'lorde lobisomem da lua de sangue', en: 'a blood-moon werewolf lord in shredded regalia', elements: ['sombra'], alignments: ['poder'] },
  { pt: 'dragão cósmico da ordem', en: 'a cosmic dragon whose scales map the constellations', elements: ['luz', 'ar'], alignments: ['harmonia'] },
  { pt: 'divindade-máquina de anéis orbitais', en: 'a machine deity with orbital rings and a satellite halo', elements: ['industrial'], alignments: ['harmonia'] },
  { pt: 'soberano do tempo com auréola de relógio', en: 'a time sovereign crowned with a clockwork halo', elements: ['industrial', 'luz'], alignments: ['harmonia'] },
  { pt: 'imperador-fera dos sábios', en: 'a sage emperor beast draped in scholar silks', elements: ['terra', 'luz'], alignments: ['harmonia'] },
  { pt: 'imperatriz-esfinge estelar', en: 'a star sphinx empress with galaxy-pattern wings', elements: ['sombra', 'luz'], alignments: ['harmonia'] },
  { pt: 'duelista divino de mercúrio', en: 'a quicksilver divine duelist with liquid-metal blades', elements: ['agua', 'industrial'], alignments: ['harmonia'] },
  { pt: 'cavaleiro sagrado de branco e ouro', en: 'a holy knight in white-and-gold plate armor with a cape', elements: ['luz'], alignments: ['benevolencia'] },
  { pt: 'serafim de dez asas', en: 'a ten-winged seraph radiating gentle light', elements: ['luz', 'ar'], alignments: ['benevolencia'] },
  { pt: 'deusa da vida do jardim eterno', en: 'a life goddess of the eternal garden trailing blossoms', elements: ['planta', 'luz'], alignments: ['benevolencia'] },
  { pt: 'imperador fênix solar', en: 'a solar phoenix emperor with a corona crest', elements: ['fogo', 'luz'], alignments: ['benevolencia'] },
  { pt: 'colosso guardião da cidadela', en: 'a citadel guardian colossus sheltering a tiny town on its back', elements: ['terra'], alignments: ['benevolencia'] },
  { pt: 'soberana curadora dos oceanos', en: 'an ocean sovereign healer robed in living tides', elements: ['agua'], alignments: ['benevolencia'] },
  { pt: 'avatar da árvore-mundo', en: 'a world-tree avatar with continents of moss on its shoulders', elements: ['planta', 'terra'], alignments: [] },
  { pt: 'deus-cervo da aurora', en: 'an aurora stag god with antlers of northern lights', elements: ['luz', 'agua'], alignments: [] },
  { pt: 'fera de duas almas yin-yang', en: 'a twin-souled yin-yang beast, half light and half shadow', elements: ['luz', 'sombra'], alignments: [] },
];

/** Sorteia uma forma de evolução: prioriza afinidade de tipo e de elemento,
 *  nunca repete forma entre as 9 evoluções da mesma criatura. */
function pickShape(
  rng: () => number,
  pool: EvoShape[],
  branch: AlignmentId,
  elements: ElementId[],
  used: Set<string>,
): EvoShape {
  let candidates = pool.filter(s => !used.has(s.en) && (s.alignments.length === 0 || s.alignments.includes(branch)));
  const elMatches = candidates.filter(s => s.elements.length === 0 || s.elements.some(e => elements.includes(e)));
  if (elMatches.length >= 2) candidates = elMatches;
  if (candidates.length === 0) candidates = pool.filter(s => !used.has(s.en));
  if (candidates.length === 0) candidates = pool;
  const shape = pick(rng, candidates);
  used.add(shape.en);
  return shape;
}

// FAMÍLIAS — os DADOS (`CREATURE_FAMILIES`, `MOTIVO_ELEMENTO_CLASSE`) moram
// em `./oracle/familias.ts`, carregado sob demanda por `generateOracleAsync`
// (Fase 2). Aqui fica só a lógica, que recebe as famílias por parâmetro.
const sf = (pt: string, en: string, nounPt: string, nounEn: string): Subfamily =>
  ({ pt, en, noun: { pt: nounPt, en: nounEn } });

/**
 * Ponte entre a taxonomia GROSSA do bestiário (`BestiaryCreature.familia`/
 * `.biologia`, `utils/soulProfile/bestiary/select.ts` — 12 valores de família
 * e 9 de biologia hoje no pool) e a taxonomia FINA daqui (`CREATURE_FAMILIES`,
 * 43 ids, cada um com subfamílias próprias). Nenhum dos dois lados inventa
 * bicho novo — é só a tradução necessária para `pickFamilies` conseguir usar
 * o que `pipeline.ts` já calcula e manda em `bestiaryInspiration.familia`/
 * `.biologia`, hoje escrito e nunca lido (achado de 28/09/2026). `biologia`
 * é mais específica que `familia` e vence quando as duas apontam famílias
 * diferentes — é o campo mais próximo de uma classificação inequívoca que o
 * bestiário tem.
 */
const BIOLOGIA_TO_FAMILY_IDS: Record<string, string[]> = {
  'Fungo': ['fungus'],
  'Planta': ['flower', 'tree', 'carniplant', 'desertplant', 'vine', 'fruitgourd'],
  'Anfíbio': ['amphibian'],
  'Ave': ['raptor', 'corvid', 'owl', 'songbird', 'waterfowl', 'seabird', 'ornamentalbird', 'ratite'],
  'Humanoide': ['halfhuman', 'goblinoid'],
  'Inseto/Aracnídeo': ['beetle', 'butterfly', 'mantis', 'hymenopteran', 'dragonfly', 'orthopteran', 'myriapod', 'spider', 'scorpion'],
  'Invertebrado': ['cephalopod', 'crab', 'lobster'],
  'Mamífero': ['feline', 'canine', 'ursine', 'rodent', 'equine', 'bovine', 'deer', 'primate', 'mustelid', 'proboscidean', 'chiroptera'],
  'Molusco': ['cephalopod'],
  'Peixe': ['shark', 'deepsea', 'reeffish', 'eel', 'pelagicfish', 'cetacean'],
  'Réptil': ['reptile', 'dinosaur'],
};

/** ⚠️ Vocabulário trocado em 28/09/2026: a `familia` do pool passou a ser o
 *  GRUPO da criatura (os grupos pedidos pelo dono — `scripts/bestiario-
 *  originais.mjs`), fino o bastante para decidir sozinho. Por isso a
 *  família agora vence a biologia em `bestiaryFamilyIds` (cnidário e verme
 *  compartilham `biologia: ['Invertebrado']`). */
const FAMILIA_TO_FAMILY_IDS: Record<string, string[]> = {
  fungo: ['fungus'],
  planta: ['flower', 'tree', 'carniplant', 'desertplant', 'vine', 'fruitgourd'],
  peixe: ['shark', 'deepsea', 'reeffish', 'eel', 'pelagicfish'],
  inseto: ['beetle', 'butterfly', 'mantis', 'hymenopteran', 'dragonfly', 'orthopteran', 'myriapod'],
  aracnideo: ['spider', 'scorpion'],
  anfibio: ['amphibian'],
  reptil: ['reptile', 'dinosaur', 'dragon'],
  ave: ['raptor', 'corvid', 'owl', 'songbird', 'waterfowl', 'seabird', 'ornamentalbird', 'ratite'],
  mamifero: ['feline', 'canine', 'ursine', 'rodent', 'equine', 'bovine', 'deer', 'primate', 'mustelid', 'proboscidean', 'chiroptera', 'cetacean'],
  cnidario: ['cnidarian'],
  // Fase 1 B1 (28/09/2026): o tardígrado saiu do grupo `invertebrado` (1
  // criatura só) para `verme`, e a centopeia que ele puxava veio junto.
  verme: ['worm', 'myriapod'],
  molusco: ['cephalopod'],
  crustaceo: ['crab', 'lobster'],
  monstro: ['chimeric', 'slime', 'aquamyth', 'lycan', 'dragon'],
  humanoide: ['halfhuman', 'goblinoid', 'giantkin', 'lycan'],
  construto: ['construct'],
  etereo: ['fae', 'yokai'],
  morto_vivo: ['zombie', 'skeleton', 'ghost', 'vampire'],
  extraplanetario: ['extraterrestrial'],
  geologico: ['geological'],
  elemental: ['elemental', 'genie', 'golem'],
  demonio: ['fiend', 'yokai'],
  angelical: ['celestial', 'unicornkin'],
  draconico: ['dragon'],
};

/** Ids de `CREATURE_FAMILIES` sugeridos pela inspiração do bestiário — `null`
 *  se ela não render nenhum id conhecido (aí `pickFamilies` cai no comportamento
 *  de sempre, só por elemento/reino). */
function bestiaryFamilyIds(familia: string | null, biologia: string[]): string[] | null {
  if (familia) {
    const ids = FAMILIA_TO_FAMILY_IDS[familia];
    if (ids) return ids;
  }
  for (const b of biologia) {
    const ids = BIOLOGIA_TO_FAMILY_IDS[b];
    if (ids) return ids;
  }
  return null;
}

// Pool ESPECIAL de OBJETOS — só pode aparecer no 2º slot de família e é raro.
const FAMILY_OBJECTS: Subfamily[] = [
  sf('lâmina', 'blade', 'espada', 'sword'),
  sf('relojoaria', 'clockwork', 'relógio', 'clock'),
  sf('luminária', 'lantern', 'lanterna', 'lantern'),
  sf('grimório', 'tome', 'livro de feitiços', 'spellbook'),
  sf('espelho', 'mirror', 'espelho', 'mirror'),
  sf('sino', 'bell', 'sino', 'bell'),
  sf('cálice', 'chalice', 'cálice', 'chalice'),
  sf('coroa', 'crown', 'coroa', 'crown'),
  sf('chave', 'key', 'chave', 'key'),
  sf('bússola', 'compass', 'bússola', 'compass'),
  sf('ampulheta', 'hourglass', 'ampulheta', 'hourglass'),
  sf('bigorna', 'anvil', 'bigorna', 'anvil'),
  sf('canhão', 'cannon', 'canhão', 'cannon'),
  sf('tambor', 'drum', 'tambor', 'drum'),
  sf('máscara', 'mask', 'máscara', 'mask'),
  sf('escudo', 'shield', 'escudo', 'shield'),
  sf('orbe', 'orb', 'orbe', 'orb'),
  sf('engrenagem', 'gear', 'engrenagem', 'gear'),
  sf('telescópio', 'telescope', 'telescópio', 'telescope'),
  sf('guarda-chuva', 'umbrella', 'guarda-chuva', 'umbrella'),
  sf('pipa', 'kite', 'pipa', 'kite'),
  sf('caixa de música', 'music box', 'caixa de música', 'music box'),
  sf('vela', 'candle', 'vela', 'candle'),
  sf('peça de xadrez', 'chess piece', 'peça de xadrez', 'chess piece'),
  sf('dado', 'die', 'dado', 'die'),
  sf('moeda', 'coin', 'moeda', 'coin'),
  sf('pergaminho', 'scroll', 'pergaminho', 'scroll'),
  sf('pena de escrever', 'quill', 'pena', 'quill'),
  sf('manopla', 'gauntlet', 'manopla', 'gauntlet'),
  sf('elmo', 'helmet', 'elmo', 'helmet'),
  sf('cajado', 'staff', 'cajado', 'staff'),
  sf('varinha', 'wand', 'varinha', 'wand'),
  sf('bola de cristal', 'crystal ball', 'bola de cristal', 'crystal ball'),
  sf('bule', 'teapot', 'bule', 'teapot'),
  sf('marionete', 'marionette', 'marionete', 'marionette'),
  sf('lampião a vapor', 'steam lamp', 'lampião a vapor', 'steam lamp'),
  sf('fonógrafo', 'phonograph', 'fonógrafo', 'phonograph'),
  sf('âncora', 'anchor', 'âncora', 'anchor'),
  sf('fechadura', 'lockbox', 'baú-fechadura', 'lockbox'),
  sf('foguete', 'rocket', 'foguete', 'rocket'),
];

/** Constrói um FamilySlot a partir de uma família + subfamília. */
function makeSlot(fam: CreatureFamily, sub: Subfamily): FamilySlot {
  return { family: fam.name, subfamily: { pt: sub.pt, en: sub.en }, noun: sub.noun, isObject: false };
}

/**
 * Seleciona as duas famílias. Regras:
 *  - Slot 1 (dominante): família com afinidade ao elemento/reino, subfamília
 *    sorteada. Descrição do pet citando um bicho tem prioridade.
 *  - Slot 2 (impacto menor): ~65% MESMA família (mono), ~30% 2ª família
 *    distinta, ~5% um OBJETO (pool especial, só aqui).
 */
/** Famílias/subfamílias citadas pelo nome num texto já normalizado. */
function familiasCitadas(CREATURE_FAMILIES: CreatureFamily[], text: string): Array<{ f: CreatureFamily; s: Subfamily }> {
  if (!text) return [];
  return CREATURE_FAMILIES.flatMap(f => f.subs.filter(s =>
    text.includes(normalizeText(s.noun.en)) || text.includes(normalizeText(s.noun.pt)) ||
    text.includes(normalizeText(f.name.en)) || text.includes(normalizeText(f.name.pt)),
  ).map(s => ({ f, s })));
}

/**
 * Chance de o slot 1 seguir a sugestão do bestiário (quando há sugestão
 * compatível com a afinidade). ⚠️ Achado do Loop A (28/09/2026, N=400): com
 * a sugestão do bestiário DETERMINÍSTICA, só 13 das 44 famílias apareciam
 * (Canino 28% — toda inspiração "Cão" virava Canino, sempre) e a tupla
 * visível (elemento, família, base) colidia em 74% dos perfis. Como
 * puxão, o bestiário segue pesando — metade das vezes decide sozinho —
 * mas a afinidade elemento/reino da PESSOA volta a ter voz.
 */
const BESTIARY_FAMILY_PULL = 0.5;

/**
 * Sorteio de família com peso INVERSO à chance dela entrar no pool de
 * afinidade. ⚠️ 28/09/2026: o sorteio era uniforme dentro do pool, e família
 * que declara muitos elementos/reinos entra em quase todo pool — medido
 * (N=800): Inseto 6,1% contra Planta Carnívora 0,4% (15×). A leitura continua
 * decidindo QUEM entra no pool; o peso só tira a vantagem de ter uma
 * declaração mais larga. Chance de inclusão ≈ 1 − P(nenhum dos 2 elementos
 * bate) × P(reino não bate).
 */
/**
 * Correção EMPÍRICA por família (id), multiplicada sobre o peso inverso de
 * `pickFamiliaCompensada` (padrão 1). ⚠️ Fase 1 B3 (28/09/2026): o peso
 * inverso só enxerga a DECLARAÇÃO (quantos elementos/reinos), não o que puxa
 * a família de fora — o bestiário (`FAMILIA_TO_FAMILY_IDS`: Yokai vem de
 * etéreo E demônio) e os motivos de `MOTIVO_ELEMENTO_CLASSE`. Estrutural
 * (N=2400): Yokai 3,3% × Primata 0,7% (4,6×). Calibrado por simulação (seed
 * 20260928); exportado mutável só para o script de calibração.
 */
export const FAMILIA_PESO: Record<string, number> = {
  amphibian: 0.43, aquamyth: 1.97, beetle: 1.57, bovine: 1.71, butterfly: 1.94,
  canine: 0.42, carniplant: 2.29, celestial: 0.87, cephalopod: 0.35,
  cetacean: 1.56, chimeric: 1.33, chiroptera: 1.23, cnidarian: 0.29,
  construct: 0.48, corvid: 1.64, crab: 0.89, deepsea: 1.63, deer: 1.24,
  desertplant: 1.6, dinosaur: 1.31, dragon: 0.95, dragonfly: 2.12, eel: 1.55,
  elemental: 1.16, equine: 1.76, extraterrestrial: 0.16, fae: 0.78,
  feline: 1.47, fiend: 0.48, flower: 1.68, fruitgourd: 1.79, fungus: 0.37,
  genie: 1.33, geological: 0.15, ghost: 1.52, giantkin: 0.94, goblinoid: 1.96,
  golem: 1.11, halfhuman: 1.56, hymenopteran: 0.3, lobster: 0.86, lycan: 1.23,
  mantis: 1.64, mustelid: 2.52, myriapod: 1.11, ornamentalbird: 1.78,
  orthopteran: 1.6, owl: 1.52, pelagicfish: 1.41, primate: 2.68,
  proboscidean: 1.3, raptor: 1.58, ratite: 1.25, reeffish: 1.8, reptile: 0.91,
  rodent: 1.85, scorpion: 0.76, seabird: 2.1, shark: 1.97, skeleton: 1.52,
  slime: 1.93, songbird: 2.55, spider: 0.78, tree: 1.26, unicornkin: 0.8,
  ursine: 2.02, vampire: 1.83, vine: 2.47, waterfowl: 1.75, worm: 0.63,
  yokai: 0.34, zombie: 1.09,
};

function pickFamiliaCompensada(rng: () => number, pool: CreatureFamily[]): CreatureFamily {
  const peso = (f: CreatureFamily) => {
    const semElemento = Math.pow(1 - Math.min(f.elements.length, 8) / 8, 2);
    const semReino = 1 - Math.min(f.realms.length, 9) / 9;
    return (FAMILIA_PESO[f.id] ?? 1) / Math.max(0.05, 1 - semElemento * semReino);
  };
  const total = pool.reduce((s, f) => s + peso(f), 0);
  let alvo = rng() * total;
  for (const f of pool) { alvo -= peso(f); if (alvo < 0) return f; }
  return pool[pool.length - 1];
}


function pickFamilies(
  CREATURE_FAMILIES: CreatureFamily[],
  rng: () => number,
  dominantElement: ElementId,
  secondaryElement: ElementId | null,
  dominantRealm: RealmId,
  descText: string,
  bestiaryFamilyHint?: string[] | null,
  bestiaryText?: string,
  familiasDoMotivo: string[] = [],
): FamilyResult {
  // Descrição do PRÓPRIO jogador: bicho citado pelo nome manda (é dado dele).
  const mentioned = familiasCitadas(CREATURE_FAMILIES, descText);

  const affinity = (f: CreatureFamily) =>
    f.elements.includes(dominantElement) ||
    (secondaryElement !== null && f.elements.includes(secondaryElement)) ||
    f.realms.includes(dominantRealm) ||
    familiasDoMotivo.includes(f.id);

  const pool1 = CREATURE_FAMILIES.filter(affinity);
  // Sugestão do bestiário = taxonomia estruturada (`familia`/`biologia`) +
  // bichos citados na descrição da criatura-inspiração. Até 28/09/2026 a
  // citação no texto do bestiário tinha o MESMO poder da descrição do
  // jogador (override determinístico) — ver `BESTIARY_FAMILY_PULL`.
  const citadasBestiario = familiasCitadas(CREATURE_FAMILIES, bestiaryText ?? '');
  const sugeridas = new Set<string>([...(bestiaryFamilyHint ?? []), ...citadasBestiario.map(m => m.f.id)]);
  const bestiaryPool = pool1.filter(f => sugeridas.has(f.id));
  const seguirBestiario = bestiaryPool.length > 0 && rng() < BESTIARY_FAMILY_PULL;
  const fam1 = mentioned[0]?.f
    ?? pickFamiliaCompensada(rng, seguirBestiario ? bestiaryPool : (pool1.length ? pool1 : CREATURE_FAMILIES));
  // Se a família escolhida é uma que o texto do bestiário citou, usa a
  // subfamília citada (coerência: "Cão" → canino/cão, não canino/raposa).
  const citadaNaFam = mentioned[0]?.f === fam1 ? mentioned[0] : citadasBestiario.find(m => m.f === fam1);
  const sub1 = citadaNaFam?.s ?? pick(rng, fam1.subs);
  const primary = makeSlot(fam1, sub1);

  // Slot 2
  const roll = rng();
  let secondary: FamilySlot;
  let mono = false;
  if (mentioned[1]) {
    secondary = makeSlot(mentioned[1].f, mentioned[1].s);
  } else if (roll < 0.65) {
    // mono — mesma família E mesma subfamília (criatura única nos dois slots)
    secondary = makeSlot(fam1, sub1);
    mono = true;
  } else if (roll < 0.95) {
    // 2ª família distinta (afinidade ao elemento secundário quando existe)
    const el2 = secondaryElement ?? dominantElement;
    const pool2 = CREATURE_FAMILIES.filter(f => f.id !== fam1.id && (f.elements.includes(el2) || f.realms.includes(dominantRealm)));
    const fam2 = pick(rng, pool2.length ? pool2 : CREATURE_FAMILIES.filter(f => f.id !== fam1.id));
    secondary = makeSlot(fam2, pick(rng, fam2.subs));
  } else {
    // raro — OBJETO no 2º slot
    const obj = pick(rng, FAMILY_OBJECTS);
    secondary = { family: { pt: 'Objeto', en: 'Object' }, subfamily: { pt: obj.pt, en: obj.en }, noun: obj.noun, isObject: true };
  }
  return { primary, secondary, mono };
}

// POOLS por elemento: paletas e texturas variadas (sorteio semeado)
const ELEMENT_PALETTES: Record<ElementId, string[]> = {
  agua: [
    'cool blue and teal color palette',
    'deep navy and seafoam color palette',
    'turquoise and pearl-white color palette',
  ],
  fogo: [
    'warm red, orange and ember-yellow color palette',
    'crimson and charcoal-smoke color palette',
    'sunset orange and molten-gold color palette',
  ],
  terra: [
    'earthy brown and ochre color palette',
    'clay-red and sandstone color palette',
    'moss-brown and slate color palette',
  ],
  ar: [
    'sky blue, white and pale silver color palette',
    'cloud-white and periwinkle color palette',
    'pale gray-blue and silver-lining color palette',
  ],
  sombra: [
    'deep purple and charcoal color palette',
    'midnight blue and smoky black color palette',
    'dark violet and ash-gray color palette',
  ],
  luz: [
    'golden yellow, white and warm cream color palette',
    'dawn-pink and radiant white color palette',
    'amber and ivory color palette',
  ],
  planta: [
    'leafy green and lime color palette',
    'deep fern and blossom-pink color palette',
    'sage green and sunflower color palette',
  ],
  industrial: [
    'steel gray and gunmetal color palette',
    'brass and copper machinery color palette',
    'chrome and hazard-yellow color palette',
  ],
};

const ELEMENT_TEXTURES: Record<ElementId, string[]> = {
  agua: [
    'smooth glossy skin with small fins and droplet shapes',
    'scaled hide with rippling wave patterns',
    'translucent jelly-like body parts with bubble details',
    'sleek wet-look coat with tide-line markings',
  ],
  fogo: [
    'ember-flecked hide with tiny flame tufts',
    'charcoal-cracked skin glowing from within',
    'smoldering fur with sparks at the tips',
    'smooth magma-vein patterns across the body',
  ],
  terra: [
    'cracked stone plates and pebble bumps',
    'compact clay body with carved groove patterns',
    'crystal shards growing from the shoulders and back',
    'sandy hide with fossil-like spiral marks',
  ],
  ar: [
    'fluffy feather-down and cloud-like puffs',
    'streamlined body with wind-groove lines',
    'wispy tufts that trail like small contrails',
    'light plumage with layered feather rows',
  ],
  sombra: [
    'sleek dark velvet fur with faint glow marks',
    'smoky edges that fade like mist',
    'ink-black patches with tiny star-like specks',
    'matte shadowy carapace with a single glowing seam',
  ],
  luz: [
    'softly glowing pearl-like skin',
    'prism-scale patches that catch the light',
    'radiant fur with a faint halo shimmer',
    'stained-glass-like translucent panels on the body',
  ],
  planta: [
    'leaf-scale skin with sprouts and buds',
    'bark-plated limbs with moss patches',
    'petal-layered coat with a flower bud somewhere',
    'vine-wrapped body with tiny berries',
  ],
  industrial: [
    'riveted metal plates with visible gears',
    'segmented chassis with piston joints',
    'brass clockwork panels with a small wind-up key',
    'wired body with blinking indicator lights',
  ],
};

// Características avulsas (sorteio semeado — aumentam a variedade combinatória)
const CRESTS = [
  'small curved horns', 'branching antlers', 'a fin-shaped crest', 'a sprouting leaf on the head',
  'a tiny gear halo', 'crystal spikes along the head', 'a flame tuft on the forehead', 'an icicle crown',
  'a mushroom cap hat', 'insect antennae', 'a third-eye gem on the forehead', 'a star-shaped emblem on the brow',
  'a single spiral unicorn nub', 'a mohawk of stiff bristles', 'droopy long ears like a hood',
  'a cracked half-mask over one eye', 'a floating tiny crown that never touches the head', 'twin feather plumes',
  'a bone-white skull cap', 'a glowing rune etched on the forehead',
];

const TAILS = [
  'a stubby round tail', 'a long whip-like tail with a glowing tip', 'a leafy vine tail',
  'a segmented armored tail', 'a fluffy fan tail', 'a coiled spring tail', 'twin ribbon tails',
  'a crystal-tipped tail', 'a little flame tail', 'no tail at all',
  'a paddle-shaped swimming tail', 'a scorpion-curl tail held high', 'a peacock-fan tail kept folded',
  'a plug-and-cable tail', 'a fox-brush tail with a pale tip', 'a chain-link tail ending in a tiny weight',
];

// Marcas corporais por alinhamento (pool)
const ALIGNMENT_MARKINGS: Record<AlignmentId, string[]> = {
  poder: [
    'bold jagged war-paint stripes on the body',
    'claw-slash markings raked across the flank',
    'cracked-glass fracture lines glowing faintly',
    'tally-mark scratches counting victories',
  ],
  harmonia: [
    'concentric ring and spiral markings on the body',
    'perfectly symmetric mandala patterns on the back',
    'thin meridian lines tracing the body like a map',
    'yin-yang teardrop marks on the shoulders',
  ],
  benevolencia: [
    'small heart and star speckle markings on the body',
    'soft cloud-and-sun patches on the chest',
    'a pale guardian sigil over the heart',
    'freckle constellations that form a smile',
  ],
};

const ROLE_MOTIFS: Record<RoleId, string[]> = {
  suporte: [
    'carrying a small healing charm, kind expression',
    'a first-aid pouch slung across the body, attentive eyes',
    'a tiny bell that chimes to rally allies, gentle look',
  ],
  tanque: [
    'wearing chunky shield-like armor pieces, sturdy stance',
    'a heavy collar-guard and knuckle plates, grounded pose',
    'one oversized armored shoulder it leans into, stoic look',
  ],
  fisico: [
    'with bold little claws or fists, energetic pose',
    'wrapped sparring bandages on the paws, bouncing on its feet',
    'a cracked training dummy strap as a trophy, eager grin',
  ],
  magico: [
    'with a floating rune orb beside it, mystical gaze',
    'a spellbook page tucked under one arm, knowing look',
    'faint glyphs circling one raised paw, focused eyes',
  ],
  alcance: [
    'with a tiny slingshot or shoulder cannon, focused eyes',
    'a spotting scope held to one eye, patient posture',
    'a bandolier of pebble-ammo across the chest, steady aim',
  ],
};

// ---------------------------------------------------------------------------
// Descrição livre do pet — palavras-chave (PT/EN) que pontuam nos eixos.
// A descrição também é injetada crua no prompt (50% de peso).
// ---------------------------------------------------------------------------

const DESC_KEYWORDS: {
  elements: Record<ElementId, string[]>;
  realms: Record<RealmId, string[]>;
  alignments: Record<AlignmentId, string[]>;
  roles: Record<RoleId, string[]>;
} = {
  elements: {
    agua: ['agua', 'mar', 'oceano', 'peixe', 'azul', 'chuva', 'rio', 'onda', 'aquatic', 'water', 'sea', 'fish', 'blue', 'rain', 'wave'],
    fogo: ['fogo', 'chama', 'lava', 'brasa', 'vermelho', 'quente', 'vulcao', 'fire', 'flame', 'ember', 'red', 'burn', 'volcano'],
    terra: ['terra', 'pedra', 'rocha', 'montanha', 'marrom', 'cristal', 'areia', 'earth', 'stone', 'rock', 'brown', 'crystal', 'sand'],
    ar: ['vento', 'voar', 'asas', 'ceu', 'nuvem', 'passaro', 'leve', 'wind', 'fly', 'wings', 'sky', 'cloud', 'bird', 'feather'],
    sombra: ['sombra', 'escuro', 'noite', 'roxo', 'preto', 'misterio', 'lua', 'shadow', 'dark', 'night', 'purple', 'black', 'moon', 'mist'],
    luz: ['luz', 'brilho', 'dourado', 'sol', 'estrela', 'sagrado', 'anjo', 'light', 'glow', 'golden', 'sun', 'star', 'holy', 'angel'],
    planta: ['planta', 'folha', 'flor', 'verde', 'arvore', 'musgo', 'semente', 'plant', 'leaf', 'flower', 'green', 'tree', 'moss', 'seed'],
    industrial: ['metal', 'robo', 'maquina', 'engrenagem', 'cromado', 'aco', 'cyber', 'robot', 'machine', 'gear', 'chrome', 'steel', 'mech', 'tech'],
  },
  realms: {
    deserto: ['deserto', 'duna', 'arido', 'desert', 'dune', 'arid'],
    picos: ['pico', 'tempestade', 'raio', 'trovao', 'montanha', 'peak', 'storm', 'lightning', 'thunder'],
    oceano: ['oceano', 'abissal', 'profundo', 'mar', 'ocean', 'abyss', 'deep sea'],
    pantano: ['pantano', 'brejo', 'lodo', 'veneno', 'toxico', 'swamp', 'marsh', 'bog', 'poison', 'toxic'],
    floresta: ['floresta', 'mata', 'selva', 'bosque', 'forest', 'jungle', 'woods'],
    cavernas: ['caverna', 'gruta', 'subterraneo', 'cave', 'cavern', 'underground'],
    gelo: ['gelo', 'neve', 'frio', 'congelado', 'artico', 'ice', 'snow', 'cold', 'frozen', 'arctic'],
    campina: ['campo', 'campina', 'prado', 'jardim', 'meadow', 'field', 'garden', 'prairie'],
    akasha: ['espirito', 'etereo', 'cosmico', 'astral', 'dimensao', 'spirit', 'ethereal', 'cosmic', 'astral', 'void'],
  },
  alignments: {
    poder: ['feroz', 'bravo', 'selvagem', 'garra', 'presa', 'espinho', 'assustador', 'forte', 'fierce', 'wild', 'savage', 'claw', 'fang', 'spike', 'scary', 'strong', 'demon', 'demonio'],
    harmonia: ['calmo', 'sereno', 'sabio', 'equilibrado', 'zen', 'inteligente', 'calm', 'serene', 'wise', 'balanced', 'smart', 'neutral'],
    benevolencia: ['fofo', 'gentil', 'protetor', 'amoroso', 'heroi', 'nobre', 'bondoso', 'cute', 'gentle', 'protective', 'loving', 'hero', 'noble', 'kind'],
  },
  roles: {
    suporte: ['curar', 'cuidar', 'apoiar', 'heal', 'care', 'support'],
    tanque: ['escudo', 'armadura', 'defender', 'proteger', 'shield', 'armor', 'defend', 'protect', 'tank'],
    fisico: ['lutar', 'garras', 'punho', 'briga', 'fight', 'punch', 'melee', 'brawl'],
    magico: ['magia', 'feitico', 'runa', 'arcano', 'magic', 'spell', 'rune', 'arcane', 'wizard', 'mago'],
    alcance: ['arco', 'flecha', 'canhao', 'atirar', 'longe', 'bow', 'arrow', 'cannon', 'shoot', 'sniper', 'ranged'],
  },
};

/** Normaliza texto para casar palavras-chave (minúsculas, sem acento). */
function normalizeText(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function countKeywordHits<K extends string>(text: string, dict: Record<K, string[]>, keys: K[]): Record<K, number> {
  const hits = Object.fromEntries(keys.map(k => [k, 0])) as Record<K, number>;
  for (const key of keys) {
    for (const kw of dict[key]) {
      if (text.includes(kw)) hits[key] += 1;
    }
  }
  return hits;
}

// ---------------------------------------------------------------------------
// Prompt de sprite — TEMPLATE VALIDADO pelo dono do projeto em testes reais.
// Regra de ouro: prompt CURTO, estilo Tamagotchi, sem fundo — frases longas
// ("wielding X to Y", blocos extra de tipo/elemento/bioma) geram sprites
// PIORES na prática. A descrição do monstro é uma lista curta de traços
// (espécie + classe definitiva + adjetivo do elemento secundário), não uma
// frase corrida — ver composeSpritePrompt.
//
//   "Tamagotchi-style v-pet sprite, 16x16 pixel art, no background:
//    octopus-frog, Druid, mechanical. it has evolved into a towering
//    shape. Flat cool blue and teal colors with gold accents, no shading,
//    no outlines, no anti-aliasing."
//
// Parametrizamos as cores sem travar demais: a paleta base vem do POOL variado
// do elemento (muda por seed) e o ACENTO marca o tipo p/ reconhecibilidade
// (Poder=red, Harmonia=cyan, Benevolência=gold).
// ---------------------------------------------------------------------------

// ===========================================================================
// BLOCOS DO PROMPT — o prompt final é a soma de blocos pré-definidos:
//   [estilo fixo, sem fundo] + [espécie + classe + adjetivo] + [nível/forma] + [paleta]
// Espécie vem do sistema de família/subfamília; classe vem de CLASS_MATRIX
// (função × alinhamento × elemento dominante); o adjetivo vem do elemento
// SECUNDÁRIO (ELEMENT_FLAVOR_WORDS). A descrição livre do pet SUBSTITUI esse
// bloco inteiro (não soma).
// ===========================================================================

const ALIGNMENT_ACCENT: Record<AlignmentId, string> = {
  poder: 'red',
  harmonia: 'cyan',
  benevolencia: 'gold',
};

// ---------------------------------------------------------------------------
// Bloco CONCEITO — versão rica: "um(a) <bicho> humanoide <arquétipo>, que
// empunha <poder>, para <efeito>" (ex.: "a humanoid triceratops witch doctor,
// wielding hex magic that warps reality, to heal allies and harm foes").
// Escolhido UMA vez por criatura (constante nos 11 prompts — é a identidade
// fixa da espécie); a descrição livre do pet SUBSTITUI esse bloco inteiro.
// ---------------------------------------------------------------------------

// Arquétipo humanoide por FUNÇÃO (~10 cada)
const ROLE_ARCHETYPES: Record<RoleId, LText[]> = {
  suporte: [
    { pt: 'curandeiro xamã', en: 'witch doctor' },
    { pt: 'médico de batalha', en: 'battle medic' },
    { pt: 'sacerdote do lar', en: 'hearth priest' },
    { pt: 'oráculo curador', en: 'healing oracle' },
    { pt: 'sábio herborista', en: 'herbalist sage' },
    { pt: 'médico da peste', en: 'plague doctor' },
    { pt: 'místico tecelão de vida', en: 'life-weaving mystic' },
    { pt: 'sacerdotisa da alvorada', en: 'dawn priestess' },
    { pt: 'monge remendador de almas', en: 'soul-mending monk' },
    { pt: 'capelão de campo', en: 'field chaplain' },
  ],
  tanque: [
    { pt: 'cavaleiro de ferro', en: 'iron knight' },
    { pt: 'guardião-baluarte', en: 'bulwark guardian' },
    { pt: 'donzela-escudo', en: 'shieldmaiden' },
    { pt: 'guardião da fortaleza', en: 'fortress warden' },
    { pt: 'paladino de égide', en: 'aegis paladin' },
    { pt: 'colosso quebra-cercos', en: 'siege-breaking juggernaut' },
    { pt: 'sentinela de pedra', en: 'stone sentinel' },
    { pt: 'cavaleiro-barricada', en: 'barricade knight' },
    { pt: 'defensor de vanguarda', en: 'vanguard defender' },
    { pt: 'brutamontes derrubador de muros', en: 'wall-breaking brute' },
  ],
  fisico: [
    { pt: 'gladiador', en: 'gladiator' },
    { pt: 'fora-da-lei motoqueiro', en: 'biker outlaw' },
    { pt: 'brigão de rua', en: 'street brawler' },
    { pt: 'duelista espadachim', en: 'duelist swordsman' },
    { pt: 'invasor berserker', en: 'berserker raider' },
    { pt: 'dançarino de lâminas', en: 'blade dancer' },
    { pt: 'lutador premiado', en: 'prizefighter' },
    { pt: 'brutamontes de arena clandestina', en: 'pit-fighting brute' },
    { pt: 'invasor pintado de guerra', en: 'war-painted raider' },
    { pt: 'campeão de arena', en: 'arena champion' },
  ],
  magico: [
    { pt: 'bruxo de feitiços', en: 'hex witch' },
    { pt: 'feiticeiro rúnico', en: 'rune sorcerer' },
    { pt: 'erudito arcano', en: 'arcane scholar' },
    { pt: 'duelista de lâmina mágica', en: 'spellblade duelist' },
    { pt: 'conjurador do vazio', en: 'void conjurer' },
    { pt: 'tecelão de glifos', en: 'glyph weaver' },
    { pt: 'bruxa lançadora de maldições', en: 'curse-casting witch' },
    { pt: 'místico tocado pelas estrelas', en: 'star-touched mystic' },
    { pt: 'alquimista', en: 'alchemist' },
    { pt: 'erudito de tomo proibido', en: 'forbidden-tome scholar' },
  ],
  alcance: [
    { pt: 'caçador de recompensas', en: 'bounty hunter' },
    { pt: 'atirador de elite', en: 'sniper marksman' },
    { pt: 'patrulheiro da tempestade', en: 'storm ranger' },
    { pt: 'armador de sombras', en: 'shadow trapper' },
    { pt: 'batedor falcoeiro', en: 'falconer scout' },
    { pt: 'duelista de arco longo', en: 'longbow duelist' },
    { pt: 'arqueiro do céu', en: 'sky archer' },
    { pt: 'pistoleiro certeiro', en: 'deadeye gunslinger' },
    { pt: 'atirador de tiros de efeito', en: 'trick-shot ranger' },
    { pt: 'rastreador silencioso', en: 'silent tracker' },
  ],
};

// ---------------------------------------------------------------------------
// CLASSE DEFINITIVA — função × alinhamento × elemento DOMINANTE (5×3×8 = 120
// combinações, FIXAS — não sorteadas). É o nome de classe estilo RPG que
// aparece curto no prompt de imagem ("um polvo-sapo Druida, robótico") e na
// bio. O elemento SECUNDÁRIO nunca entra aqui — vira só um adjetivo
// (ELEMENT_FLAVOR_WORDS) aplicado na criatura, sem alterar a classe.
// Onde um único substantivo já é icônico pra a combinação (Druida, Patrulheiro,
// Caçador, Paladino, Curandeiro Bruxo/Witch Doctor, Berserker, Bruxo,
// Tecnomante, Mago, Zelote...) ele é usado puro, sem prefixo de elemento.
// ---------------------------------------------------------------------------
const CLASS_MATRIX: Record<RoleId, Record<AlignmentId, Record<ElementId, LText>>> = {
  suporte: {
    poder: {
      agua: { pt: 'Xamã da Maré', en: 'Tide Shaman' },
      fogo: { pt: 'Xamã de Sangue', en: 'Blood Shaman' },
      terra: { pt: 'Xamã de Ossos', en: 'Bone Shaman' },
      ar: { pt: 'Xamã da Tempestade', en: 'Storm Shaman' },
      sombra: { pt: 'Curandeiro Bruxo', en: 'Witch Doctor' },
      luz: { pt: 'Xamã do Sol', en: 'Sun Shaman' },
      planta: { pt: 'Xamã de Espinhos', en: 'Thorn Shaman' },
      industrial: { pt: 'Xamã da Sucata', en: 'Scrap Shaman' },
    },
    harmonia: {
      agua: { pt: 'Clérigo da Maré', en: 'Tide Cleric' },
      fogo: { pt: 'Sábio da Lareira', en: 'Hearth Sage' },
      terra: { pt: 'Sábio de Pedra', en: 'Stone Sage' },
      ar: { pt: 'Clérigo do Céu', en: 'Sky Cleric' },
      sombra: { pt: 'Sábio da Noite', en: 'Night Sage' },
      luz: { pt: 'Clérigo', en: 'Cleric' },
      planta: { pt: 'Herborista', en: 'Herbalist' },
      industrial: { pt: 'Artífice', en: 'Artificer' },
    },
    benevolencia: {
      agua: { pt: 'Sacerdotisa da Maré', en: 'Tide Priestess' },
      fogo: { pt: 'Guardiã do Lar', en: 'Hearthkeeper' },
      terra: { pt: 'Guardião da Vida', en: 'Life Warden' },
      ar: { pt: 'Curandeira do Vento', en: 'Windsong Healer' },
      sombra: { pt: 'Curandeira do Crepúsculo', en: 'Dusk Healer' },
      luz: { pt: 'Sacerdote', en: 'Priest' },
      planta: { pt: 'Guardiã da Flor', en: 'Bloomkeeper' },
      industrial: { pt: 'Médica de Campo', en: 'Field Medic' },
    },
  },
  tanque: {
    poder: {
      agua: { pt: 'Juggernaut das Marés', en: 'Tide Juggernaut' },
      fogo: { pt: 'Juggernaut de Magma', en: 'Magma Juggernaut' },
      terra: { pt: 'Colosso', en: 'Colossus' },
      ar: { pt: 'Senhor da Tempestade', en: 'Storm Warlord' },
      sombra: { pt: 'Portador da Guerra', en: 'Warbringer' },
      luz: { pt: 'Cruzado', en: 'Crusader' },
      planta: { pt: 'Juggernaut de Espinhos', en: 'Bramble Juggernaut' },
      industrial: { pt: 'Máquina de Guerra', en: 'War Machine' },
    },
    harmonia: {
      agua: { pt: 'Guardião da Maré', en: 'Tide Warden' },
      fogo: { pt: 'Guardião da Forja', en: 'Forge Warden' },
      terra: { pt: 'Guardião de Pedra', en: 'Stone Warden' },
      ar: { pt: 'Sentinela do Céu', en: 'Sky Sentinel' },
      sombra: { pt: 'Sentinela do Crepúsculo', en: 'Twilight Sentinel' },
      luz: { pt: 'Sentinela da Alvorada', en: 'Dawn Sentinel' },
      planta: { pt: 'Guardião das Raízes', en: 'Root Warden' },
      industrial: { pt: 'Sentinela de Ferro', en: 'Iron Sentinel' },
    },
    benevolencia: {
      agua: { pt: 'Protetor da Maré', en: 'Tide Protector' },
      fogo: { pt: 'Guarda-Brasa', en: 'Emberguard' },
      terra: { pt: 'Guarda-Terra', en: 'Earthguard' },
      ar: { pt: 'Guarda-Céu', en: 'Skyguard' },
      sombra: { pt: 'Guarda-Noturno', en: 'Nightguard' },
      luz: { pt: 'Paladino', en: 'Paladin' },
      planta: { pt: 'Guarda-Espinhos', en: 'Thornguard' },
      industrial: { pt: 'Engenheiro-Égide', en: 'Aegis Engineer' },
    },
  },
  fisico: {
    poder: {
      agua: { pt: 'Assolador da Maré', en: 'Tide Reaver' },
      fogo: { pt: 'Berserker', en: 'Berserker' },
      terra: { pt: 'Assolador de Pedra', en: 'Stone Reaver' },
      ar: { pt: 'Assolador da Tempestade', en: 'Storm Reaver' },
      sombra: { pt: 'Assolador de Sangue', en: 'Blood Reaver' },
      luz: { pt: 'Zelote', en: 'Zealot' },
      planta: { pt: 'Assolador de Espinhos', en: 'Thorn Reaver' },
      industrial: { pt: 'Berserker Mecânico', en: 'Mechanized Berserker' },
    },
    harmonia: {
      agua: { pt: 'Duelista da Maré', en: 'Tide Duelist' },
      fogo: { pt: 'Duelista da Brasa', en: 'Ember Duelist' },
      terra: { pt: 'Duelista de Pedra', en: 'Stone Duelist' },
      ar: { pt: 'Mestre-Lâmina da Tempestade', en: 'Storm Blademaster' },
      sombra: { pt: 'Mestre-Lâmina das Sombras', en: 'Shadow Blademaster' },
      luz: { pt: 'Duelista da Lâmina Solar', en: 'Sunblade Duelist' },
      planta: { pt: 'Duelista da Lâmina de Espinhos', en: 'Thornblade Duelist' },
      industrial: { pt: 'Duelista da Lâmina de Engrenagens', en: 'Gearblade Duelist' },
    },
    benevolencia: {
      agua: { pt: 'Monge da Maré', en: 'Tide Monk' },
      fogo: { pt: 'Campeão da Brasa', en: 'Ember Champion' },
      terra: { pt: 'Campeão de Pedra', en: 'Stone Champion' },
      ar: { pt: 'Monge do Vento', en: 'Windmonk' },
      sombra: { pt: 'Campeão do Crepúsculo', en: 'Dusk Champion' },
      luz: { pt: 'Campeão Radiante', en: 'Radiant Champion' },
      planta: { pt: 'Campeão da Flor', en: 'Bloom Champion' },
      industrial: { pt: 'Monge de Ferro', en: 'Iron Monk' },
    },
  },
  magico: {
    poder: {
      agua: { pt: 'Feiticeiro da Maré', en: 'Tide Sorcerer' },
      fogo: { pt: 'Piromante', en: 'Pyromancer' },
      terra: { pt: 'Bruxo de Pedra', en: 'Stone Warlock' },
      ar: { pt: 'Feiticeiro da Tempestade', en: 'Storm Sorcerer' },
      sombra: { pt: 'Bruxo', en: 'Warlock' },
      luz: { pt: 'Feiticeiro do Sol', en: 'Sun Sorcerer' },
      planta: { pt: 'Bruxo de Espinhos', en: 'Bramble Warlock' },
      industrial: { pt: 'Tecnomante', en: 'Technomancer' },
    },
    harmonia: {
      agua: { pt: 'Mago da Maré', en: 'Tide Mage' },
      fogo: { pt: 'Arcanista da Brasa', en: 'Ember Arcanist' },
      terra: { pt: 'Arcanista de Pedra', en: 'Stone Arcanist' },
      ar: { pt: 'Arcanista da Tempestade', en: 'Storm Arcanist' },
      sombra: { pt: 'Mago do Vazio', en: 'Void Mage' },
      luz: { pt: 'Mago', en: 'Mage' },
      planta: { pt: 'Arcanista Verdejante', en: 'Verdant Arcanist' },
      industrial: { pt: 'Ferreiro de Runas', en: 'Runesmith' },
    },
    benevolencia: {
      agua: { pt: 'Mística da Maré', en: 'Tide Mystic' },
      fogo: { pt: 'Mística da Brasa', en: 'Ember Mystic' },
      terra: { pt: 'Místico de Pedra', en: 'Stone Mystic' },
      ar: { pt: 'Mística do Vento', en: 'Windsong Mystic' },
      sombra: { pt: 'Mística do Crepúsculo', en: 'Dusk Mystic' },
      luz: { pt: 'Tecelã da Luz', en: 'Lightweaver' },
      planta: { pt: 'Druida', en: 'Druid' },
      industrial: { pt: 'Mística de Relojoaria', en: 'Clockwork Mystic' },
    },
  },
  alcance: {
    poder: {
      agua: { pt: 'Caçador da Maré', en: 'Tide Hunter' },
      fogo: { pt: 'Caçador da Brasa', en: 'Ember Hunter' },
      terra: { pt: 'Caçador de Pedra', en: 'Stone Hunter' },
      ar: { pt: 'Caçador da Tempestade', en: 'Storm Hunter' },
      sombra: { pt: 'Caçador das Sombras', en: 'Shadow Hunter' },
      luz: { pt: 'Caçador Solar', en: 'Solar Hunter' },
      planta: { pt: 'Caçador', en: 'Hunter' },
      industrial: { pt: 'Caçador de Sucata', en: 'Scrap Hunter' },
    },
    harmonia: {
      agua: { pt: 'Batedor da Maré', en: 'Tide Scout' },
      fogo: { pt: 'Batedor da Brasa', en: 'Ember Scout' },
      terra: { pt: 'Batedor de Pedra', en: 'Stone Scout' },
      ar: { pt: 'Batedor da Tempestade', en: 'Storm Scout' },
      sombra: { pt: 'Batedor das Sombras', en: 'Shadow Scout' },
      luz: { pt: 'Batedor Solar', en: 'Sun Scout' },
      planta: { pt: 'Batedor da Mata', en: 'Wildwood Scout' },
      industrial: { pt: 'Batedor da Sucata', en: 'Scrapline Scout' },
    },
    benevolencia: {
      agua: { pt: 'Patrulheiro da Maré', en: 'Tide Ranger' },
      fogo: { pt: 'Patrulheiro da Brasa', en: 'Ember Ranger' },
      terra: { pt: 'Patrulheiro de Pedra', en: 'Stone Ranger' },
      ar: { pt: 'Patrulheiro do Céu', en: 'Sky Ranger' },
      sombra: { pt: 'Patrulheiro do Crepúsculo', en: 'Dusk Ranger' },
      luz: { pt: 'Patrulheiro da Alvorada', en: 'Dawn Ranger' },
      planta: { pt: 'Patrulheiro', en: 'Ranger' },
      industrial: { pt: 'Patrulheiro de Ferro', en: 'Ironline Ranger' },
    },
  },
};

// Poder empunhado por ELEMENTO (~10 cada) — o que completa "que empunha ___"
const ELEMENT_POWERS: Record<ElementId, LText[]> = {
  agua: [
    { pt: 'correntes de maré que se quebram como ondas', en: 'tidal chains that crash like waves' },
    { pt: 'um tridente que canaliza a pressão do mar profundo', en: 'a trident channeling deep-sea pressure' },
    { pt: 'chicotes de água viva', en: 'living water whips' },
    { pt: 'duas azagaias com pontas de gelo', en: 'frost-tipped twin harpoons' },
    { pt: 'uma concha que comanda as marés', en: 'a conch horn that commands the tides' },
    { pt: 'lâminas gêmeas esculpidas em água sólida', en: 'twin blades carved from solid water' },
    { pt: 'um tambor de guerra que invoca chuva', en: 'a rain-summoning war drum' },
    { pt: 'manoplas incrustadas de coral', en: 'coral-encrusted gauntlets' },
    { pt: 'um redemoinho preso na palma da mão', en: 'a whirlpool bound to its palm' },
    { pt: 'canhões gêmeos movidos a vapor', en: 'steam-vented dual cannons' },
  ],
  fogo: [
    { pt: 'correntes de chamas vivas', en: 'living flame chains' },
    { pt: 'um martelo de guerra vulcânico', en: 'a volcanic warhammer' },
    { pt: 'lâminas gêmeas de brasa', en: 'twin ember blades' },
    { pt: 'uma lança de fogo-fênix', en: 'a phoenix-fire lance' },
    { pt: 'manoplas em fusão que nunca esfriam', en: 'molten gauntlets that never cool' },
    { pt: 'uma lâmina em forma de disco solar', en: 'a solar disk blade' },
    { pt: 'punhos de tempestade de cinzas', en: 'cinder-storm fists' },
    { pt: 'um canhão de sopro de dragão', en: "a dragon's-breath cannon" },
    { pt: 'chicotes de corrente em chamas', en: 'burning chain whips' },
    { pt: 'um machado de batalha forjado em magma', en: 'a magma-forged battle axe' },
  ],
  terra: [
    { pt: 'punhos que despedaçam com terremotos', en: 'quake-shattering fists' },
    { pt: 'um martelo de guerra forjado em montanha', en: 'a mountain-forged warhammer' },
    { pt: 'manoplas de pedra viva', en: 'living stone gauntlets' },
    { pt: 'espinhos de cristal que irrompem do chão', en: 'crystal spikes bursting from the ground' },
    { pt: 'um estilingue de arremesso de pedregulhos', en: 'a boulder-throwing sling' },
    { pt: 'correntes de raízes de ferro', en: 'iron-root chains' },
    { pt: 'um tambor de guerra sísmico', en: 'a seismic war drum' },
    { pt: 'lâminas gêmeas de obsidiana', en: 'obsidian twin blades' },
    { pt: 'anéis de pedra que dobram a gravidade', en: 'gravity-bending stone rings' },
    { pt: 'garras com pontas de diamante', en: 'diamond-tipped claws' },
  ],
  ar: [
    { pt: 'chicotes de corrente da tempestade', en: 'storm-chain whips' },
    { pt: 'um arco forjado em relâmpago', en: 'a lightning-forged bow' },
    { pt: 'lâminas gêmeas de ciclone', en: 'twin cyclone blades' },
    { pt: 'um martelo de guerra de trovão', en: 'a thunderclap warhammer' },
    { pt: 'adagas gêmeas de lâmina de vento', en: 'wind-blade twin daggers' },
    { pt: 'um furacão engarrafado à cintura', en: 'a hurricane bottled at its side' },
    { pt: 'manoplas carregadas de eletricidade estática', en: 'static-charged gauntlets' },
    { pt: 'uma lança de tempestade', en: 'a tempest spear' },
    { pt: 'punhos com força de vendaval', en: 'gale-force fists' },
    { pt: 'um chicote de corrente eletrificado', en: 'an electrified chain whip' },
  ],
  sombra: [
    { pt: 'correntes forjadas de sombra viva', en: 'chains forged from living shadow' },
    { pt: 'uma foice tocada pelo vazio', en: 'a void-touched scythe' },
    { pt: 'adagas gêmeas tecidas de maldição', en: 'curse-woven twin daggers' },
    { pt: 'uma lanterna de pesadelos', en: 'a nightmare lantern' },
    { pt: 'garras forjadas em eclipse', en: 'eclipse-forged claws' },
    { pt: 'um cajado que suga almas', en: 'a soul-siphoning staff' },
    { pt: 'tentáculos de sombra viva', en: 'living shadow tendrils' },
    { pt: 'uma lâmina de noite sem lua', en: 'a moonless-night blade' },
    { pt: 'chicotes de corrente fantasma', en: 'phantom chain whips' },
    { pt: 'uma foice presa a um espírito', en: 'a wraith-bound sickle' },
  ],
  luz: [
    { pt: 'correntes forjadas em luz solar', en: 'sunlight-forged chains' },
    { pt: 'uma lança radiante', en: 'a radiant lance' },
    { pt: 'lâminas gêmeas forjadas em estrelas', en: 'twin star-forged blades' },
    { pt: 'um escudo-lâmina em forma de auréola', en: 'a halo-shaped blade-shield' },
    { pt: 'adagas gêmeas talhadas em prisma', en: 'prism-cut twin daggers' },
    { pt: 'um martelo de guerra do amanhecer', en: 'a dawnbreaker warhammer' },
    { pt: 'chicotes de corrente sagrados', en: 'holy chain whips' },
    { pt: 'um arco de luz de cometa', en: 'a comet-light bow' },
    { pt: 'manoplas de fogo solar', en: 'sunfire gauntlets' },
    { pt: 'um florete celestial', en: 'a celestial rapier' },
  ],
  planta: [
    { pt: 'correntes de vinhas espinhosas envoltas em chamas', en: 'thorned vine chains wrapped in flame' },
    { pt: 'chicotes de raízes vivas', en: 'living root whips' },
    { pt: 'um martelo de guerra florescente', en: 'a blooming warhammer' },
    { pt: 'adagas gêmeas de nuvem de esporos', en: 'spore-cloud twin daggers' },
    { pt: 'um escudo de flor carnívora', en: 'a carnivorous-flower shield' },
    { pt: 'manoplas envoltas em espinhos', en: 'bramble-wrapped gauntlets' },
    { pt: 'um canhão lançador de sementes', en: 'a seed-launching cannon' },
    { pt: 'lâminas gêmeas envoltas em hera', en: 'ivy-wrapped twin blades' },
    { pt: 'um cajado de batalha de mandrágora', en: 'a mandrake battle staff' },
    { pt: 'um chicote de corrente com espinhos venenosos', en: 'a poison-thorn chain whip' },
  ],
  industrial: [
    { pt: 'chicotes mecânicos movidos a corrente', en: 'chain-driven mechanical whips' },
    { pt: 'um martelo de guerra movido a pistão', en: 'a piston-powered warhammer' },
    { pt: 'lâminas gêmeas de serra circular', en: 'twin buzzsaw blades' },
    { pt: 'um canhão de rebites', en: 'a rivet-gun cannon' },
    { pt: 'manoplas eletromagnéticas', en: 'electro-magnetic gauntlets' },
    { pt: 'uma lança movida a vapor', en: 'a steam-powered lance' },
    { pt: 'um mangual movido a engrenagens', en: 'a gear-driven flail' },
    { pt: 'uma lâmina cortadora a plasma', en: 'a plasma-cutter blade' },
    { pt: 'uma manopla-foguete', en: 'a rocket-fist gauntlet' },
    { pt: 'chicotes de corrente cromados', en: 'chrome chain whips' },
  ],
};

/** Efeito final ("para ___"), marcado por afinidade de ALINHAMENTO — a mesma
 *  função tem sabores diferentes conforme o tipo (ex.: suporte Poder cura E
 *  pune; suporte Benevolência cura com compaixão pura). */
interface AlignedEffect extends LText { alignments: AlignmentId[] }

const ROLE_EFFECTS: Record<RoleId, AlignedEffect[]> = {
  suporte: [
    { pt: 'curar aliados enquanto pune quem os ameaça', en: 'heal allies while punishing those who threaten them', alignments: ['poder'] },
    { pt: 'sarar feridas e desencadear retribuição sobre os responsáveis', en: 'mend wounds and unleash retribution on those responsible', alignments: ['poder'] },
    { pt: 'sarar feridas e restaurar o equilíbrio no campo de batalha', en: 'mend wounds and restore balance to the battlefield', alignments: ['harmonia'] },
    { pt: 'canalizar uma energia calma que acalma o coração de cada aliado', en: "channel calm energy that steadies every ally's heart", alignments: ['harmonia'] },
    { pt: 'curar aliados e protegê-los com cuidado incondicional', en: 'heal allies and shield them with unconditional care', alignments: ['benevolencia'] },
    { pt: 'sarar cada ferida com compaixão radiante e altruísta', en: 'mend every wound with selfless, radiant compassion', alignments: ['benevolencia'] },
  ],
  tanque: [
    { pt: 'esmagar qualquer um tolo o bastante para romper seu muro', en: 'crush anything foolish enough to breach its wall', alignments: ['poder'] },
    { pt: 'punir todo atacante que ousar se aproximar', en: 'punish every attacker who dares to get close', alignments: ['poder'] },
    { pt: 'absorver com calma cada golpe destinado a seus aliados', en: 'calmly absorb every blow meant for its allies', alignments: ['harmonia'] },
    { pt: 'segurar a linha de frente com resolução disciplinada e inabalável', en: 'hold the line with unshakable, disciplined resolve', alignments: ['harmonia'] },
    { pt: 'proteger os inocentes de qualquer mal, custe o que custar', en: 'shield the innocent from any harm, whatever the cost', alignments: ['benevolencia'] },
    { pt: 'se colocar entre o perigo e quem não pode se defender', en: 'stand between danger and those who cannot defend themselves', alignments: ['benevolencia'] },
  ],
  fisico: [
    { pt: 'esmagar inimigos com força bruta e implacável', en: 'crush enemies with brute, merciless force', alignments: ['poder'] },
    { pt: 'deixar um rastro de inimigos despedaçados por onde passa', en: 'leave a trail of shattered foes in its wake', alignments: ['poder'] },
    { pt: 'golpear com maestria marcial precisa e disciplinada', en: 'strike with precise, disciplined martial mastery', alignments: ['harmonia'] },
    { pt: 'superar rivais através de técnica perfeita, não fúria', en: 'overcome rivals through perfect technique, not rage', alignments: ['harmonia'] },
    { pt: 'defender os fracos com força justa e imparável', en: 'defend the weak with righteous, unstoppable strength', alignments: ['benevolencia'] },
    { pt: 'lutar só para proteger quem não pode lutar', en: 'fight only to protect those who cannot fight back', alignments: ['benevolencia'] },
  ],
  magico: [
    { pt: 'torcer o destino e dobrar a realidade a uma vontade implacável', en: 'twist fate and bend reality to a ruthless will', alignments: ['poder'] },
    { pt: 'desfazer inimigos com magia proibida e impiedosa', en: 'unravel enemies with forbidden, merciless magic', alignments: ['poder'] },
    { pt: 'manipular a própria realidade com precisão calma e calculada', en: 'manipulate reality itself with calm, calculated precision', alignments: ['harmonia'] },
    { pt: 'dobrar as leis da natureza rumo ao equilíbrio perfeito', en: 'bend the laws of nature toward perfect balance', alignments: ['harmonia'] },
    { pt: 'tecer magia protetora que escuda os inocentes', en: 'weave protective magic that shields the innocent', alignments: ['benevolencia'] },
    { pt: 'curar e elevar os outros através de magia sagrada e radiante', en: 'heal and uplift others through radiant, sacred magic', alignments: ['benevolencia'] },
  ],
  alcance: [
    { pt: 'caçar toda ameaça sem hesitação ou piedade', en: 'hunt down every threat without hesitation or mercy', alignments: ['poder'] },
    { pt: 'atirar primeiro e não deixar nenhum alvo de pé', en: 'strike first and leave no target standing', alignments: ['poder'] },
    { pt: 'atacar inimigos de distâncias impossíveis com precisão serena', en: 'strike foes from impossible distances with calm precision', alignments: ['harmonia'] },
    { pt: 'observar, esperar e eliminar ameaças no momento perfeito', en: 'observe, wait, and eliminate threats with perfect timing', alignments: ['harmonia'] },
    { pt: 'proteger aliados atacando o perigo antes que ele chegue', en: 'protect allies by striking danger before it arrives', alignments: ['benevolencia'] },
    { pt: 'vigiar seus companheiros à distância, guardando cada passo', en: "watch over its companions from afar, guarding every step", alignments: ['benevolencia'] },
  ],
};

/** Escolhe pelo alinhamento (com fallback pro pool inteiro se não achar). */
function pickAligned<T extends { alignments: AlignmentId[] }>(
  rng: () => number, pool: T[], alignment: AlignmentId,
): T {
  const matches = pool.filter(p => p.alignments.includes(alignment));
  return pick(rng, matches.length > 0 ? matches : pool);
}

// ----- Bloco TIPO (visual): nem todo Poder é demoníaco, mas sempre feroz;
//       Harmonia sempre equilibrado; Benevolência sempre nobre. ~24 opções cada.
const TYPE_LOOK: Record<AlignmentId, string[]> = {
  poder: [
    'a fierce fanged grin', 'bristling sharp spikes', 'jagged claws', 'battle scars',
    'a fierce scowl', 'narrow predatory eyes', 'an aggressive spiky silhouette', 'a single curved horn',
    'a wild spiky mane', 'clenched fists', 'a snarling mouth', 'angular armor plates',
    'a spiked whip-tail', 'glowing angry eyes', 'a torn ragged cape', 'a muscular hunched stance',
    'twin sharp horns', 'a menacing pose', 'a scarred eye', 'bared fangs',
    'a bladed forearm', 'a crest of quills', 'a predator crouch', 'a chipped tusk',
  ],
  harmonia: [
    'a calm expression', 'a symmetric balanced body', 'a serene half-smile', 'glowing rune marks',
    'a small floating orb', 'a smooth rounded shape', 'meditative closed eyes', 'tidy geometric patterns',
    'a scholarly posture', 'gentle glowing lines', 'a small halo ring', 'neat crystalline edges',
    'a thoughtful gaze', 'balanced twin features', 'a zen sitting pose', 'soft flowing curves',
    'a wise steady look', 'tiny orbiting dots', 'a mirrored pattern', 'a poised stance',
    'a spiral emblem', 'a monk-like robe', 'a focused stare', 'clean minimal lines',
  ],
  benevolencia: [
    'big kind eyes', 'a warm smile', 'a soft rounded body', 'a small halo',
    'angelic feather tufts', 'a protective posture', 'a heart marking', 'a gentle glowing aura',
    'a tiny cape', 'sparkling friendly eyes', 'a shield emblem', 'fluffy soft edges',
    'a caring expression', 'a little bell charm', 'a noble upright stance', 'a golden trim',
    'a gentle bow', 'open welcoming arms', 'a soft chest fluff', 'a guardian sigil',
    'rosy cheeks', 'a beaming grin', 'a plush huggable shape', 'a small crown',
  ],
};

// ----- Bloco ELEMENTO (visual): ~20 opções cada
const ELEMENT_LOOK: Record<ElementId, string[]> = {
  agua: [
    'dripping water droplets', 'blue fins', 'fish-scale skin', 'a wavy body', 'bubble details',
    'a teardrop shape', 'gill slits', 'a splashing tail', 'a smooth wet look', 'aqua highlights',
    'a water-drop crest', 'rippling patterns', 'webbed feet', 'a shiny blue hide', 'tidal markings',
    'a coral fin', 'a bubbly trail', 'a seafoam tuft', 'a dripping snout', 'a wave-shaped ear',
  ],
  fogo: [
    'little flame tufts', 'glowing embers', 'a fiery crest', 'smoldering cracks', 'spark details',
    'a flame tail', 'burning eyes', 'ember-flecked skin', 'a small fire mane', 'heat-glow marks',
    'charred edges', 'a torch-tip tail', 'molten seams', 'flickering flames', 'a blazing aura',
    'a spark-lit crest', 'smoke wisps', 'a coal-red belly', 'a flame eyebrow', 'ash-gray patches',
  ],
  terra: [
    'rocky plates', 'pebble bumps', 'crystal shards', 'a stony hide', 'cracked-earth skin',
    'moss patches', 'a boulder shape', 'sandy texture', 'jagged rock spikes', 'a mineral crest',
    'a clay-like body', 'fossil marks', 'sturdy stone armor', 'a rugged look', 'earthy ridges',
    'a gravel mane', 'a stone-slab back', 'quartz knuckles', 'a dusty coat', 'a rock-brow',
  ],
  ar: [
    'fluffy cloud puffs', 'feather tufts', 'a wispy trail', 'light plumage', 'a breezy shape',
    'wind-swept fur', 'small wings', 'a floating pose', 'airy white streaks', 'a cloud-like body',
    'soft feathers', 'a gust crest', 'nimble thin limbs', 'a swirl mark', 'drifting wisps',
    'a feathered collar', 'a kite-tail', 'puffy cheeks', 'a breeze-blown crest', 'a pale down coat',
  ],
  sombra: [
    'smoky edges', 'a shadowy body', 'eyes glowing in the dark', 'a dark mist trail', 'a crescent mark',
    'ink-black patches', 'a single glowing seam', 'a spooky silhouette', 'faint star specks', 'a dusk-colored hide',
    'a hooded shape', 'a wispy shadow tail', 'purple glow marks', 'a mysterious veil', 'a dark aura',
    'a masked face', 'a fading outline', 'violet eyes', 'a smoke plume', 'a night-black coat',
  ],
  luz: [
    'a soft glow', 'a small halo', 'pearl-like skin', 'sunbeam streaks', 'a star mark',
    'radiant edges', 'a shining crest', 'glowing trim', 'prism sparkles', 'a bright aura',
    'twinkling dots', 'a golden shimmer', 'a lantern glow', 'luminous eyes', 'a dawn tint',
    'a sunburst crest', 'a ray-of-light tail', 'a glowing chest gem', 'a bright halo ring', 'a warm cream coat',
  ],
  planta: [
    'leaf details', 'a flower bud', 'vine wraps', 'sprout tufts', 'bark patches',
    'petal edges', 'a mossy hide', 'a leafy crest', 'berry dots', 'a seedling shape',
    'green shoots', 'a blooming mark', 'ivy trails', 'a bud crown', 'foliage texture',
    'a petal collar', 'a twig tail', 'a mushroom cap', 'a clover mark', 'a vine whisker',
  ],
  industrial: [
    'metal plates', 'visible gears', 'bolt rivets', 'a piston joint', 'an antenna',
    'blinking lights', 'a wind-up key', 'chrome trim', 'a robotic body', 'wired seams',
    'a gauge dial', 'brass panels', 'a mechanical arm', 'a small screen face', 'segmented armor',
    'a bolt-eye', 'a vent grille', 'a cable tail', 'a lever switch', 'a rivet-studded plate',
  ],
};

// ----- Bloco BIOMA (visual): ~16 opções cada
const BIOME_LOOK: Record<RealmId, string[]> = {
  deserto: [
    'sun-baked coloring', 'sandy tones', 'a desert-worn look', 'cactus-green trim', 'a dune-beige hide',
    'a sun-disc mark', 'heat-hardened skin', 'a nomad wrap', 'ochre patterns', 'a mirage shimmer',
    'scorched edges', 'a scarab motif', 'a sunbaked crest', 'terracotta spots', 'a dry cracked coat', 'a sand-swept tail',
  ],
  picos: [
    'storm-cloud coloring', 'a windswept crest', 'lightning marks', 'granite-gray tones', 'a peak-climber build',
    'electric sparks', 'a highland cloak', 'jagged mountain edges', 'thunder-bruised hide', 'a soaring pose',
    'frosty tips', 'a storm emblem', 'a bolt-shaped tail', 'a cliffside stance', 'a gale-blown mane', 'slate-blue patches',
  ],
  oceano: [
    'deep-sea coloring', 'bioluminescent dots', 'coral trim', 'a fin crest', 'an abyssal-blue hide',
    'pearl highlights', 'a tide mark', 'kelp-green streaks', 'a nautilus spiral', 'a glowing lure',
    'wave patterns', 'a deep-water glow', 'a shell plate', 'anemone tufts', 'a barnacle crust', 'a jellyfish veil',
  ],
  pantano: [
    'murky-green tones', 'a toxic-purple glow', 'a bog-brown hide', 'firefly dots', 'a miasma haze',
    'twisted-root trim', 'swamp-slick skin', 'orchid marks', 'a will-o-wisp light', 'mossy patches',
    'a venom drip', 'muddy texture', 'a lily-pad ear', 'a reed crest', 'a fungal bloom', 'a slime coat',
  ],
  floresta: [
    'forest-green tones', 'bark-brown trim', 'a leafy mane', 'mushroom-red spots', 'canopy shadows',
    'an acorn charm', 'a wild-antler crest', 'vine wraps', 'a woodland cloak', 'dappled-light marks',
    'a beast-claw motif', 'earthy fur', 'a fern tail', 'a bramble collar', 'a bird-nest crest', 'a sap streak',
  ],
  cavernas: [
    'slate-gray tones', 'amethyst crystals', 'a glowworm-blue glow', 'obsidian edges', 'a geode crest',
    'copper-vein marks', 'stone-dust hide', 'a stalactite fang', 'echoing rune marks', 'quartz sparkles',
    'a cave-dweller look', 'dark rocky armor', 'a crystal horn', 'a mineral crust', 'a lantern-eye', 'a gem-studded back',
  ],
  gelo: [
    'ice-white coloring', 'glacial-blue trim', 'an aurora glow', 'frost-lilac marks', 'icicle spikes',
    'a snowflake crest', 'a polar-silver hide', 'frozen breath', 'a snow-dusted look', 'crystal-ice edges',
    'a frostbitten tint', 'a blizzard aura', 'an ice-shard tail', 'a frozen mane', 'a snowcap crest', 'glassy frost plates',
  ],
  campina: [
    'sunny-yellow tones', 'blossom-pink trim', 'a flower crown', 'a wheat-gold hide', 'clover-green marks',
    'a daisy motif', 'morning-dew sparkles', 'a meadow-fresh look', 'butterfly dots', 'a gentle breeze pose',
    'petal confetti', 'a honeycomb charm', 'a dandelion tuft', 'a ladybug spot', 'a grassy tail', 'a sunlit coat',
  ],
  akasha: [
    'twilight gold-and-violet tones', 'starlight-silver trim', 'a void-purple glow', 'a dawn-and-dusk gradient', 'an all-seeing eye',
    'twin-crescent marks', 'an infinity glyph', 'cosmic sparkles', 'an ethereal aura', 'a duotone shimmer',
    'floating light motes', 'a celestial crest', 'a galaxy-swirl mark', 'a halo of runes', 'a phasing outline', 'a starfield coat',
  ],
};

// ----- Bloco NÍVEL para rookie/ultra (champion/perfeito/mega usam os SHAPES)
const ROOKIE_LOOK: string[] = [
  'a tiny round chibi body', 'small and simple with a big head', 'a little blob-like body',
  'a small egg-shaped body', 'a chubby palm-sized body', 'a tiny two-legged sprout',
  'a small curled-up shape', 'a baby-sized round form', 'a squishy little body',
  'a pint-sized simple shape', 'a tiny bouncy body', 'a small button-eyed form',
];
const ULTRA_LOOK: string[] = [
  'a grand fused body merging its three final forms', 'a towering tri-part fusion silhouette',
  'a radiant fusion of three great forms', 'a colossal combined body of all three lines',
  'a majestic three-in-one fused shape', 'an imposing unified apex body',
  'a transcendent triple-fusion form', 'a supreme combined silhouette',
];

/** Junta os blocos num prompt CURTO — lista de traços, não frase longa.
 *  Testes empíricos: prompt estilo Tamagotchi, sem fundo, descrição bem
 *  curta (espécie + classe + adjetivo) gera sprites melhores que frases
 *  longas tipo "wielding X to Y" ou blocos extras de tipo/elemento/bioma. */
/** Referências de gênero citadas na PRIMEIRA tentativa. Decisão do dono do
 *  projeto: citar as inspirações puxa um resultado visivelmente melhor, então
 *  toda criação começa por aqui. O risco (o gerador chegar perto demais de um
 *  personagem registrado) fica contido por dois lados: a frase "original
 *  creature / do not copy any existing franchise character" continua no prompt,
 *  e quando o provedor RECUSA por política de conteúdo a geração cai
 *  automaticamente no `imagePromptFallback`, que não cita ninguém. */
const GENRE_REFERENCES =
  'Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, ' +
  'Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft';

function composeSpritePrompt(args: {
  concept: string; colorDesc: string; accent: string; levelBlock: string;
  /** "Qual sua criatura favorita?" (1-2 palavras) — prefixo literal antes do
   *  conceito, em todos os estágios (ver OracleInput.favoriteCreature). */
  favoriteCreature?: string;
  /** Cláusula do renascimento, já composta (ver `rebirthPromptClause`). Entra
   *  nas DUAS variantes: é escolha do jogador, não referência de franquia. */
  rebirth?: string;
  /** Nome da criatura-inspiração do bestiário. Entra SÓ na variante com
   *  referências — ver `OracleInput.bestiaryInspiration.nome`. */
  inspiracao?: string;
  /** true = cita GENRE_REFERENCES (1ª tentativa); false = prompt limpo (2ª). */
  withReferences: boolean;
}): string {
  const concept = args.favoriteCreature ? `${args.favoriteCreature} ${args.concept}` : args.concept;
  return (
    `Generate an original creature for a monster-raising RPG` +
    (args.withReferences ? ` inspired by ${GENRE_REFERENCES}` : '') + `. ` +
    // A inspiração do bestiário, nomeada, só na 1ª tentativa (D-B1,
    // 27/09/2026). A cláusula logo abaixo FICA: citar de onde veio a
    // inspiração não é pedir uma cópia, e é ela que mantém o pedido em
    // "criatura original" nas duas variantes.
    (args.withReferences && args.inspiracao ? `Draw inspiration from ${args.inspiracao}. ` : '') +
    // Vale nas DUAS variantes: mesmo citando inspirações, o que sai não pode ser
    // um personagem registrado — o sprite vai pro app de um usuário real.
    `Do not copy any existing franchise character. ` +
    `Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: ` +
    `${concept}. ${args.levelBlock}. ` +
    (args.rebirth ? `${args.rebirth} ` : '') +
    `Flat ${args.colorDesc} colors with ${args.accent} accents, no shading, no outlines, no anti-aliasing. ` +
    // As paletas do pool já citam 2–3 cores, mas o gerador ainda entrega
    // resultados quase monocromáticos (uma cor só em tons diferentes) —
    // principalmente com paletas do tipo "crimson and charcoal-smoke". Este
    // pedido é explícito de propósito.
    //
    // Escala de cinza é EXCEÇÃO PERMITIDA: preto e branco lê como escolha de
    // arte, enquanto o bicho inteiro tingido de um vermelho só parece filtro.
    // Por isso o veto é ao TINGIMENTO de matiz única, não à falta de cor.
    `Do not tint the whole creature in a single hue — use clearly distinct colors. ` +
    `Grayscale/black-and-white is acceptable.`
  );
}

/** Par de prompts de uma forma: o COM referências (sempre a 1ª tentativa) e o
 *  limpo (2ª tentativa, para quando o provedor recusa). Quem gera a imagem
 *  manda os dois — ver `requestSprite` e `functions/api/generate-sprite.js`. */
function composeSpritePrompts(
  args: Omit<Parameters<typeof composeSpritePrompt>[0], 'withReferences'>,
): { imagePrompt: string; imagePromptFallback: string } {
  return {
    imagePrompt: composeSpritePrompt({ ...args, withReferences: true }),
    imagePromptFallback: composeSpritePrompt({ ...args, withReferences: false }),
  };
}

const BODY_PLANS: Array<{ en: string; pt: string }> = [
  { en: 'small bipedal', pt: 'bípede compacto' },
  { en: 'sturdy quadruped', pt: 'quadrúpede robusto' },
  { en: 'winged bipedal', pt: 'bípede alado' },
  { en: 'serpentine coiled', pt: 'serpentino enrolado' },
  { en: 'floating levitating', pt: 'flutuante' },
];

const ROLE_METAMORPHS: Record<RoleId, Array<{ en: string; pt: string }>> = {
  tanque: [
    { en: 'a bulwark knight: heavy segmented armor plates, massive pauldrons and one arm shaped like a tower shield', pt: 'cavaleiro-baluarte: placas de armadura segmentada, ombreiras massivas e um braço em forma de escudo-torre' },
    { en: 'a living fortress: castle-wall plating, battlement ridges along the back and a gate-like chest guard', pt: 'fortaleza viva: blindagem de muralha, ameias ao longo das costas e um protetor de peito em forma de portão' },
    { en: 'an immovable colossus: dense oversized forearms planted like pillars and a low unshakable stance', pt: 'colosso imóvel: antebraços densos e desproporcionais fincados como pilares e postura baixa inabalável' },
  ],
  suporte: [
    { en: 'a radiant cleric: flowing vestment drapes, a relic censer and small floating healing orbs', pt: 'clérigo radiante: vestes esvoaçantes, um turíbulo-relíquia e pequenos orbes de cura flutuantes' },
    { en: 'a field medic spirit: satchels of remedies, bandage wraps and a stretcher-tail for carrying allies', pt: 'espírito de médico de campo: bolsas de remédios, faixas enroladas e uma cauda-maca para carregar aliados' },
    { en: 'a hearth keeper: a warm lantern staff, a cloak that shelters smaller creatures and steam of comfort rising', pt: 'guardião da lareira: cajado-lanterna aquecido, manto que abriga criaturas menores e vapor de conforto subindo' },
  ],
  fisico: [
    { en: 'a battle master: reinforced gauntlets, blade-like limb edges and a fierce combat stance', pt: 'mestre de batalha: manoplas reforçadas, membros com bordas de lâmina e postura feroz de combate' },
    { en: 'a martial-arts adept: wrapped fists, a training-belt sash and a coiled ready-to-strike pose', pt: 'adepto de artes marciais: punhos enfaixados, faixa de treinamento e pose enrolada pronta pro golpe' },
    { en: 'a wild brawler: cracked knuckle guards, a torn cape and claw marks raked across its own armor', pt: 'brigador selvagem: proteções de punho rachadas, capa rasgada e marcas de garra riscadas na própria armadura' },
  ],
  magico: [
    { en: 'an arcane sage: rune-etched robe folds, a floating grimoire and glowing sigils orbiting the body', pt: 'sábio arcano: dobras de manto gravadas com runas, um grimório flutuante e sigilos brilhantes orbitando o corpo' },
    { en: 'an elemental conduit: energy channels glowing along the limbs and a focusing crystal at the chest', pt: 'condutor elemental: canais de energia brilhando pelos membros e um cristal focalizador no peito' },
    { en: 'a hex weaver: threads of spell-light between the fingers and charm talismans hanging from the crest', pt: 'tecelão de feitiços: fios de luz-mágica entre os dedos e talismãs pendurados na crista' },
  ],
  alcance: [
    { en: 'a sharpshooter: a long arm-cannon, a targeting visor over one eye and stabilizer fins', pt: 'atirador de elite: um longo canhão no braço, visor de mira sobre um olho e aletas estabilizadoras' },
    { en: 'a phantom archer: an energy bow grown from the forearm and a quiver of light arrows on the back', pt: 'arqueiro fantasma: um arco de energia crescido do antebraço e uma aljava de flechas de luz nas costas' },
    { en: 'an artillery frame: shoulder-mounted launchers, ammo-belt details and fold-out bipod legs', pt: 'chassi de artilharia: lançadores nos ombros, detalhes de cinto de munição e pernas-bipé dobráveis' },
  ],
};

// O elemento vira matéria física no estágio perfeito (pool por elemento)
const ELEMENT_MANIFESTS: Record<ElementId, Array<{ en: string; pt: string }>> = {
  agua: [
    { en: 'flowing water veils and liquid ribbons around the limbs', pt: 'véus de água corrente e fitas líquidas nos membros' },
    { en: 'a living tide that swirls around its feet', pt: 'uma maré viva que rodopia em volta dos pés' },
    { en: 'frost-and-spray armor condensing over the shoulders', pt: 'armadura de bruma e respingo condensada nos ombros' },
  ],
  fogo: [
    { en: 'magma plating and glowing ember vents on the shoulders', pt: 'placas de magma e aberturas de brasa nos ombros' },
    { en: 'a mane of controlled flame down the spine', pt: 'uma juba de chama controlada ao longo da espinha' },
    { en: 'twin torch-tips burning at the elbows', pt: 'duas pontas de tocha ardendo nos cotovelos' },
  ],
  terra: [
    { en: 'heavy stone slabs growing from the back and forearms', pt: 'lajes de pedra crescendo das costas e antebraços' },
    { en: 'floating orbiting boulders bound to its will', pt: 'pedregulhos flutuantes orbitando sob seu comando' },
    { en: 'crystal gauntlets crusted over the fists', pt: 'manoplas de cristal incrustadas nos punhos' },
  ],
  ar: [
    { en: 'wind-swept plumes and small cyclone rings around the arms', pt: 'plumas ao vento e pequenos anéis de ciclone nos braços' },
    { en: 'a personal whirlwind that lifts it slightly off the ground', pt: 'um redemoinho pessoal que o ergue de leve do chão' },
    { en: 'blade-thin air currents visible as white streaks', pt: 'correntes de ar finas como lâminas, visíveis em riscos brancos' },
  ],
  sombra: [
    { en: 'smoky shadow trails and a dark mist cloak', pt: 'rastros de sombra fumegante e um manto de névoa escura' },
    { en: 'its own shadow moving independently as a second pair of arms', pt: 'a própria sombra se movendo sozinha como um segundo par de braços' },
    { en: 'a veil of dusk that dims the light around it', pt: 'um véu de crepúsculo que escurece a luz ao redor' },
  ],
  luz: [
    { en: 'shards of solid light forming a broken halo', pt: 'estilhaços de luz sólida formando uma auréola partida' },
    { en: 'sunbeam ribbons woven through its limbs', pt: 'fitas de raio de sol trançadas nos membros' },
    { en: 'a constellation of small stars orbiting the crest', pt: 'uma constelação de estrelinhas orbitando a crista' },
  ],
  planta: [
    { en: 'blooming vines, bark guards and flower buds along the body', pt: 'vinhas floridas, proteções de casca e botões de flor pelo corpo' },
    { en: 'a small living garden sprouting along the spine', pt: 'um pequeno jardim vivo brotando ao longo da espinha' },
    { en: 'root-whips coiled around the forearms', pt: 'chicotes de raiz enrolados nos antebraços' },
  ],
  industrial: [
    { en: 'bolted mechanical augments, pistons and antenna arrays', pt: 'implementos mecânicos parafusados, pistões e antenas' },
    { en: 'deployable turbine wings folded on the back', pt: 'asas-turbina retráteis dobradas nas costas' },
    { en: 'a humming power core visible in the chest', pt: 'um núcleo de energia zumbindo visível no peito' },
  ],
};

// Linguagem de design por alinhamento — entra CEDO no prompt e em TODOS os
// estágios, como o atributo dos Soulmon (Poder/Harmonia/Benevolência). POOL grande por
// tipo: nem todo Poder é demoníaco, mas é sempre mais feroz, voraz e
// perspicaz; nem todo Benevolência é angelical, mas é sempre nobre e protetor.
const ALIGNMENT_DESIGNS: Record<AlignmentId, string[]> = {
  poder: [
    'POWER-attribute design language: jagged asymmetric silhouette, sharp angular spikes, small fangs and pointed claws, mischievous fierce eyes with narrow pupils, one aggressive blood-red accent, villainous but charming look',
    'POWER-attribute design language: apex-predator build, lean muscular stance ready to pounce, slit predatory eyes, scratch-mark motifs, one deep crimson accent, wild untamed look',
    'POWER-attribute design language: gladiator bearing, battle-scarred details, cracked horn or chipped ear, confident smirk with one visible fang, burnt-orange war accent, veteran brawler look',
    'POWER-attribute design language: cunning trickster energy, sly grin, sharp angular ears or fins, mismatched asymmetric details, one toxic-purple accent, streetwise rogue look',
    'POWER-attribute design language: stormy berserker energy, bristling fur or plating standing on end, wild wide fierce eyes, jagged lightning-shaped marks, one hot magenta accent, untamable look',
    'POWER-attribute design language: silent hunter poise, low crouched stance, cold calculating narrow eyes, arrow-sharp silhouette edges, one dark scarlet accent, ruthless precision look',
  ],
  harmonia: [
    'HARMONY-attribute design language: clean symmetric silhouette, balanced geometric shapes with smooth rounded edges, calm focused intelligent eyes, one cool cyan accent, composed scholarly look',
    'HARMONY-attribute design language: wandering-monk simplicity, minimal serene lines, half-closed meditative eyes, circular zen motifs, one soft jade accent, tranquil sage look',
    'HARMONY-attribute design language: inventor-tinkerer energy, tidy modular body segments, bright curious round eyes, subtle blueprint-line marks, one teal accent, clever craftsman look',
    'HARMONY-attribute design language: stargazer poise, upright contemplative posture, deep thoughtful eyes, tiny constellation dot patterns, one indigo accent, quiet oracle look',
    'HARMONY-attribute design language: tactician bearing, neat symmetric armor lines, sharp attentive eyes scanning ahead, chessboard-like subtle patterning, one emerald accent, strategist look',
    'HARMONY-attribute design language: flowing dancer grace, smooth continuous curves, gentle balanced expression, ripple and wave motifs, one aquamarine accent, effortless equilibrium look',
  ],
  benevolencia: [
    'BENEVOLENCE-attribute design language: noble heroic silhouette, soft rounded shapes with upright proud posture, big kind sparkling eyes, white and gold highlights, knightly guardian look',
    'BENEVOLENCE-attribute design language: gentle-healer warmth, plump huggable proportions, warm smiling eyes, ribbon or bandage motifs, cream and rose-gold highlights, caretaker look',
    'BENEVOLENCE-attribute design language: loyal-shepherd bearing, sturdy dependable frame, soft attentive eyes always watching over others, bell or lantern charm, ivory and amber highlights, protector look',
    'BENEVOLENCE-attribute design language: cheerful-champion energy, bouncy confident posture, bright optimistic eyes, star and medal motifs, sunny yellow and white highlights, inspiring hero look',
    'BENEVOLENCE-attribute design language: serene-priestess aura, flowing graceful lines, calm compassionate eyes, subtle halo or petal ornaments, pearl and pale-gold highlights, blessed look',
    'BENEVOLENCE-attribute design language: big-brother bulk, broad gentle frame that shields smaller creatures, soft brave eyes, shield and heart motifs, silver and warm-white highlights, dependable look',
  ],
};

// O atributo já aparece na forma bebê (pool por tipo)
const ALIGNMENT_BABY_HINTS: Record<AlignmentId, string[]> = {
  poder: [
    'even the baby form already shows tiny fangs and a mischievous smirk',
    'even the baby form already crouches like a tiny predator, eyes locked on a target',
    'even the baby form already has one little crooked spike and a defiant pout',
    'even the baby form already growls adorably, bristling when approached',
  ],
  harmonia: [
    'even the baby form already looks calm, symmetric and quietly observant',
    'even the baby form already sits in a tiny meditative pose',
    'even the baby form already tilts its head, studying everything with curious eyes',
    'even the baby form already arranges things around it in neat little patterns',
  ],
  benevolencia: [
    'even the baby form already has kind sparkling eyes and a soft bright glow',
    'even the baby form already tries to hug everything nearby',
    'even the baby form already stands between danger and smaller creatures',
    'even the baby form already offers little gifts with a warm smile',
  ],
};

// Traços de temperamento por alinhamento (usados nos TEXTOS das descrições —
// substituem qualquer menção simbólica a signos/horóscopo)
const ALIGNMENT_TRAIT_WORDS: Record<AlignmentId, LText[]> = {
  poder: [
    { pt: 'feroz e perspicaz', en: 'fierce and sharp-witted' },
    { pt: 'voraz e destemido', en: 'voracious and fearless' },
    { pt: 'implacável quando provocado', en: 'relentless when provoked' },
    { pt: 'audaz e territorial', en: 'bold and territorial' },
  ],
  harmonia: [
    { pt: 'sereno e observador', en: 'serene and observant' },
    { pt: 'curioso e equilibrado', en: 'curious and balanced' },
    { pt: 'paciente e engenhoso', en: 'patient and resourceful' },
    { pt: 'contemplativo e preciso', en: 'contemplative and precise' },
  ],
  benevolencia: [
    { pt: 'gentil e protetor', en: 'gentle and protective' },
    { pt: 'leal até o fim', en: 'loyal to the end' },
    { pt: 'acolhedor e corajoso', en: 'warm-hearted and brave' },
    { pt: 'altruísta e vigilante', en: 'selfless and watchful' },
  ],
};

const MEGA_REGALIAS: Record<AlignmentId, Array<{ en: string; pt: string }>> = {
  poder: [
    { en: 'warlord-monarch apotheosis: a crown-like crest, a tattered banner-cape and one oversized weapon-arm', pt: 'apoteose de monarca da guerra: crista em coroa, capa-estandarte esfarrapada e um braço-arma desproporcional' },
    { en: 'apex-predator apotheosis: a colossal beast frame, saber fangs and trophy scars worn like medals', pt: 'apoteose de predador supremo: corpo colossal de fera, presas de sabre e cicatrizes-troféu exibidas como medalhas' },
    { en: 'grand-gladiator apotheosis: spiked champion armor, a chained gauntlet and an arena-champion stance', pt: 'apoteose de grande gladiador: armadura de campeão com espinhos, manopla acorrentada e postura de campeão de arena' },
    { en: 'storm-tyrant apotheosis: crackling energy horns, a mantle of living lightning and thunderous presence', pt: 'apoteose de tirano da tempestade: chifres de energia crepitante, manto de relâmpago vivo e presença trovejante' },
  ],
  harmonia: [
    { en: 'celestial arbiter apotheosis: detached floating body segments, orbiting rings and a serene extra pair of eyes', pt: 'apoteose de árbitro celeste: segmentos do corpo flutuando separados, anéis em órbita e um sereno par extra de olhos' },
    { en: 'grand-sage apotheosis: a levitating lotus throne of energy, flowing scholar robes and a third-eye gem', pt: 'apoteose de grande sábio: trono de lótus de energia levitante, vestes de erudito esvoaçantes e joia de terceiro olho' },
    { en: 'world-clock apotheosis: rotating orrery rings around the body and planetary orbs in orbit', pt: 'apoteose de relógio do mundo: anéis de planetário girando ao redor do corpo e esferas planetárias em órbita' },
    { en: 'perfect-form apotheosis: an impossibly clean geometric body of pure balance, hovering in stillness', pt: 'apoteose da forma perfeita: corpo geométrico de equilíbrio puro, pairando em quietude absoluta' },
  ],
  benevolencia: [
    { en: 'guardian seraph apotheosis: a protective mantle of layered wings, a soft aureole and open embracing arms', pt: 'apoteose de serafim guardião: manto protetor de asas em camadas, auréola suave e braços abertos que acolhem' },
    { en: 'holy-paladin apotheosis: radiant plate armor, a banner of hope and a greatshield planted at its side', pt: 'apoteose de paladino sagrado: armadura de placas radiante, estandarte da esperança e escudo enorme fincado ao lado' },
    { en: 'great-shepherd apotheosis: a colossal gentle frame that smaller creatures shelter beneath, lantern staff in hand', pt: 'apoteose de grande pastor: corpo colossal e gentil sob o qual criaturas menores se abrigam, cajado-lanterna na mão' },
    { en: 'life-fountain apotheosis: healing springs flowing from the shoulders and blooming flowers in its footsteps', pt: 'apoteose de fonte da vida: nascentes curativas fluindo dos ombros e flores brotando por onde pisa' },
  ],
};

const REALM_EMBLEMS: Record<RealmId, Array<{ en: string; pt: string }>> = {
  deserto: [
    { en: 'a sun-disc emblem', pt: 'um emblema de disco solar' },
    { en: 'a scarab-seal emblem', pt: 'um emblema de selo de escaravelho' },
    { en: 'a mirage-eye emblem', pt: 'um emblema de olho de miragem' },
  ],
  picos: [
    { en: 'a storm-bolt emblem', pt: 'um emblema de raio' },
    { en: 'a summit-peak emblem', pt: 'um emblema de pico nevado' },
    { en: 'a wind-spiral emblem', pt: 'um emblema de espiral de vento' },
  ],
  oceano: [
    { en: 'a tide-crest emblem', pt: 'um emblema de crista de maré' },
    { en: 'a nautilus-spiral emblem', pt: 'um emblema de espiral de náutilo' },
    { en: 'an abyssal-lantern emblem', pt: 'um emblema de lanterna abissal' },
  ],
  pantano: [
    { en: 'a miasma-orchid emblem', pt: 'um emblema de orquídea do miasma' },
    { en: 'a will-o-wisp emblem', pt: 'um emblema de fogo-fátuo' },
    { en: 'a twisted-root emblem', pt: 'um emblema de raiz retorcida' },
  ],
  floresta: [
    { en: 'a wild-antler emblem', pt: 'um emblema de galhada selvagem' },
    { en: 'an ancient-leaf emblem', pt: 'um emblema de folha ancestral' },
    { en: 'a beast-claw emblem', pt: 'um emblema de garra de fera' },
  ],
  cavernas: [
    { en: 'a geode emblem', pt: 'um emblema de geodo' },
    { en: 'a stalactite-fang emblem', pt: 'um emblema de presa de estalactite' },
    { en: 'an echo-rune emblem', pt: 'um emblema de runa do eco' },
  ],
  gelo: [
    { en: 'a snowflake-sigil emblem', pt: 'um emblema de floco de neve' },
    { en: 'an aurora-arc emblem', pt: 'um emblema de arco de aurora' },
    { en: 'a frozen-star emblem', pt: 'um emblema de estrela congelada' },
  ],
  campina: [
    { en: 'a golden-bloom emblem', pt: 'um emblema de flor dourada' },
    { en: 'a honeycomb emblem', pt: 'um emblema de favo de mel' },
    { en: 'a morning-dew emblem', pt: 'um emblema de orvalho da manhã' },
  ],
  akasha: [
    { en: 'a twin-crescent emblem of light and shadow', pt: 'um emblema de crescentes gêmeos de luz e sombra' },
    { en: 'an all-seeing-prism emblem', pt: 'um emblema de prisma onisciente' },
    { en: 'an infinity-loop emblem', pt: 'um emblema de laço do infinito' },
  ],
};

// Acentos de cor por reino (pool — complementa a paleta do elemento)
const REALM_ACCENTS: Record<RealmId, string[]> = {
  deserto: ['sand-gold and terracotta accents', 'dune-beige and cactus-green accents', 'sunset-copper accents'],
  picos: ['storm-blue and electric-yellow accents', 'granite-gray and lightning-white accents', 'thundercloud-violet accents'],
  oceano: ['abyssal-blue and bioluminescent-cyan accents', 'coral-pink and deep-teal accents', 'pearl and kelp-green accents'],
  pantano: ['murky-green and toxic-purple accents', 'bog-brown and firefly-yellow accents', 'moss and orchid-violet accents'],
  floresta: ['forest-green and bark-brown accents', 'fern and mushroom-red accents', 'canopy-emerald and acorn accents'],
  cavernas: ['slate-gray and amethyst accents', 'obsidian and glowworm-blue accents', 'copper-vein and quartz accents'],
  gelo: ['ice-white and glacial-blue accents', 'aurora-green and frost-lilac accents', 'polar-silver accents'],
  campina: ['sunny-yellow and blossom-pink accents', 'wheat-gold and sky accents', 'clover-green and daisy-white accents'],
  akasha: ['duotone gold-and-violet twilight accents', 'starlight-silver and void-purple accents', 'dawn-and-dusk gradient accents'],
};

// ---------------------------------------------------------------------------
// 8. Geração principal
// ---------------------------------------------------------------------------

function addScore<K extends string>(
  scores: Record<K, number>,
  breakdown: Record<K, ScoreEntry[]>,
  key: K,
  points: number,
  source: LText,
) {
  scores[key] += points;
  breakdown[key].push({ source, points });
}
/** O corpo puro da geração: as famílias entram por parâmetro. */
export function generateOracleWithFamilies(input: OracleInputSync | OracleInputWithClass, familias: FamiliasOraculo, seed?: number, overrides?: OracleOverrides): OracleResult {
  const { CREATURE_FAMILIES, MOTIVO_ELEMENTO_CLASSE } = familias;
  const [year, month, day] = input.birthDate.split('-').map(Number);
  const [hour, minute] = (input.birthTime || '12:00').split(':').map(Number);

  const soul = input.soulProfile;

  const numerology = computeNumerology(input.fullName, input.birthDate);
  // Com o perfil de alma, o Sol e o Ascendente vêm do mapa astral REAL
  // (efemérides + casas), não da faixa de datas e do palpite de 1 signo a cada
  // 2h a partir das 6h que `approximateAscendant` faz. Quando a pessoa não
  // soube a hora de nascimento, o mapa se recusa a dar Ascendente (e diz isso
  // em `astrology.warnings`) — aí a aproximação antiga volta, porque um
  // ascendente lúdico declarado como lúdico é melhor do que campo vazio no
  // resumo de personalidade.
  const chartSun = soul ? signInfoByName(soul.astrology.bigThree.sun) : null;
  const chartAsc = soul?.astrology.bigThree.ascendant
    ? signInfoByName(soul.astrology.bigThree.ascendant)
    : null;
  const sun = chartSun ?? westernSunSign(month, day);
  const ascendant = chartAsc ?? approximateAscendant(sun.id, hour, minute);
  const chinese = computeChinese(year, month, day);
  const vedic = computeVedic(month, day);

  // ----- Pontuação de elementos -----
  const elementScores = Object.fromEntries(ELEMENT_ORDER.map(e => [e, 0])) as Record<ElementId, number>;
  const elementBreakdown = Object.fromEntries(ELEMENT_ORDER.map(e => [e, [] as ScoreEntry[]])) as Record<ElementId, ScoreEntry[]>;

  addScore(elementScores, elementBreakdown, sun.element, 3,
    { pt: `Signo solar (${sun.name.pt})`, en: `Sun sign (${sun.name.en})` });
  addScore(elementScores, elementBreakdown, ascendant.element, 2,
    { pt: `Ascendente aproximado (${ascendant.name.pt})`, en: `Approximate ascendant (${ascendant.name.en})` });
  addScore(elementScores, elementBreakdown, vedic.element, 2,
    { pt: `Rashi védico (${vedic.rashi})`, en: `Vedic rashi (${vedic.rashi})` });

  const chineseElementIdx = CHINESE_ELEMENTS.findIndex(e => e.pt === chinese.element.pt);
  addScore(elementScores, elementBreakdown, CHINESE_ELEMENT_MAP[chineseElementIdx], 3,
    { pt: `Elemento chinês (${chinese.element.pt})`, en: `Chinese element (${chinese.element.en})` });

  addScore(elementScores, elementBreakdown, chinese.yinYang === 'yin' ? 'sombra' : 'luz', 2,
    { pt: `Polaridade chinesa (${chinese.yinYang})`, en: `Chinese polarity (${chinese.yinYang})` });

  const bornAtNight = hour < 6 || hour >= 18;
  addScore(elementScores, elementBreakdown, bornAtNight ? 'sombra' : 'luz', 2,
    bornAtNight
      ? { pt: 'Nascimento noturno', en: 'Night birth' }
      : { pt: 'Nascimento diurno', en: 'Day birth' });

  const numberContribs: Array<[number, number, LText]> = [
    [numerology.lifePath, 3, { pt: `Caminho de vida ${numerology.lifePath}`, en: `Life path ${numerology.lifePath}` }],
    [numerology.expression, 2, { pt: `Número de expressão ${numerology.expression}`, en: `Expression number ${numerology.expression}` }],
    [numerology.soulUrge, 1, { pt: `Motivação ${numerology.soulUrge}`, en: `Soul urge ${numerology.soulUrge}` }],
    [numerology.personality, 1, { pt: `Impressão ${numerology.personality}`, en: `Personality ${numerology.personality}` }],
  ];
  for (const [num, pts, source] of numberContribs) {
    const [primary, secondary] = NUMBER_ELEMENTS[num];
    addScore(elementScores, elementBreakdown, primary, pts, source);
    if (pts > 1) addScore(elementScores, elementBreakdown, secondary, 1, source);
  }

  // Local de nascimento: um toque místico determinístico (+1 em um elemento)
  const placeElement = ELEMENT_ORDER[hashString(input.birthPlace.trim().toLowerCase()) % ELEMENT_ORDER.length];
  addScore(elementScores, elementBreakdown, placeElement, 1,
    { pt: 'Eco do local de nascimento', en: 'Echo of the birthplace' });

  // Respostas do quiz somam na LEITURA (fazem parte da base, como os astros)
  const answerSource: LText = { pt: 'Suas respostas', en: 'Your answers' };
  const questionEffects: QuestionEffects[] = [];
  if (input.answers) {
    for (const q of ORACLE_QUESTIONS) {
      const chosen = q.options.find(o => o.id === input.answers?.[q.id]);
      if (chosen) questionEffects.push(chosen.effects);
    }
  }
  for (const fx of questionEffects) {
    for (const [el, pts] of Object.entries(fx.elements ?? {}) as Array<[ElementId, number]>) {
      addScore(elementScores, elementBreakdown, el, pts, answerSource);
    }
  }

  const baseSortedElements = [...ELEMENT_ORDER].sort((a, b) => elementScores[b] - elementScores[a]);
  const baseDominantElement = baseSortedElements[0];

  // ----- Pontuação de funções -----
  const roleScores = Object.fromEntries(ROLE_ORDER.map(r => [r, 0])) as Record<RoleId, number>;
  const roleBreakdown = Object.fromEntries(ROLE_ORDER.map(r => [r, [] as ScoreEntry[]])) as Record<RoleId, ScoreEntry[]>;

  addScore(roleScores, roleBreakdown, ZODIAC_ELEMENT_ROLE[sun.element], 3,
    { pt: `Elemento do signo solar (${sun.name.pt})`, en: `Sun sign element (${sun.name.en})` });
  addScore(roleScores, roleBreakdown, MODALITY_ROLE[sun.modality], 2,
    { pt: `Modalidade ${sun.modality}`, en: `${sun.modality} modality` });
  addScore(roleScores, roleBreakdown, ZODIAC_ELEMENT_ROLE[ascendant.element], 1,
    { pt: `Ascendente (${ascendant.name.pt})`, en: `Ascendant (${ascendant.name.en})` });

  const animalIdx = CHINESE_ANIMALS.findIndex(a => a.en === chinese.animalEn);
  addScore(roleScores, roleBreakdown, CHINESE_ANIMAL_ROLE[animalIdx], 3,
    { pt: `Animal chinês (${chinese.animal.pt})`, en: `Chinese animal (${chinese.animal.en})` });

  addScore(roleScores, roleBreakdown, ZODIAC_ELEMENT_ROLE[vedic.element], 1,
    { pt: `Rashi védico (${vedic.rashi})`, en: `Vedic rashi (${vedic.rashi})` });

  for (const [num, pts, source] of numberContribs) {
    addScore(roleScores, roleBreakdown, NUMBER_ROLES[num], pts, source);
  }

  // Sombra puxa dano mágico; industrial puxa longo alcance (afinidade temática)
  if (baseDominantElement === 'sombra') {
    addScore(roleScores, roleBreakdown, 'magico', 2, { pt: 'Elemento dominante Sombra', en: 'Dominant Shadow element' });
  }
  if (baseDominantElement === 'industrial') {
    addScore(roleScores, roleBreakdown, 'alcance', 2, { pt: 'Elemento dominante Industrial', en: 'Dominant Industrial element' });
  }
  if (baseDominantElement === 'planta') {
    addScore(roleScores, roleBreakdown, 'suporte', 2, { pt: 'Elemento dominante Planta', en: 'Dominant Plant element' });
  }
  if (baseDominantElement === 'luz') {
    addScore(roleScores, roleBreakdown, 'suporte', 1, { pt: 'Elemento dominante Luz', en: 'Dominant Light element' });
  }

  for (const fx of questionEffects) {
    for (const [role, pts] of Object.entries(fx.roles ?? {}) as Array<[RoleId, number]>) {
      addScore(roleScores, roleBreakdown, role, pts, answerSource);
    }
  }

  const sortedRoles = [...ROLE_ORDER].sort((a, b) => roleScores[b] - roleScores[a]);
  let dominantRole = sortedRoles[0];

  // ----- Pontuação de alinhamento (poder / harmonia / benevolência) -----
  const alignmentScores = Object.fromEntries(ALIGNMENT_ORDER.map(a => [a, 0])) as Record<AlignmentId, number>;
  const alignmentBreakdown = Object.fromEntries(ALIGNMENT_ORDER.map(a => [a, [] as ScoreEntry[]])) as Record<AlignmentId, ScoreEntry[]>;

  addScore(alignmentScores, alignmentBreakdown, ZODIAC_ELEMENT_ALIGNMENT[sun.element], 3,
    { pt: `Signo solar (${sun.name.pt})`, en: `Sun sign (${sun.name.en})` });
  addScore(alignmentScores, alignmentBreakdown, ZODIAC_ELEMENT_ALIGNMENT[ascendant.element], 1,
    { pt: `Ascendente (${ascendant.name.pt})`, en: `Ascendant (${ascendant.name.en})` });
  addScore(alignmentScores, alignmentBreakdown, CHINESE_ANIMAL_ALIGNMENT[animalIdx], 3,
    { pt: `Animal chinês (${chinese.animal.pt})`, en: `Chinese animal (${chinese.animal.en})` });
  addScore(alignmentScores, alignmentBreakdown, chinese.yinYang === 'yang' ? 'poder' : 'harmonia', 1,
    { pt: `Polaridade ${chinese.yinYang}`, en: `${chinese.yinYang} polarity` });
  addScore(alignmentScores, alignmentBreakdown, ROLE_ALIGNMENT[dominantRole], 2,
    { pt: `Função dominante (${ROLE_INFO[dominantRole].name.pt})`, en: `Dominant role (${ROLE_INFO[dominantRole].name.en})` });
  for (const [num, pts, source] of numberContribs) {
    addScore(alignmentScores, alignmentBreakdown, NUMBER_ALIGNMENT[num], pts, source);
  }
  for (const fx of questionEffects) {
    for (const [al, pts] of Object.entries(fx.alignments ?? {}) as Array<[AlignmentId, number]>) {
      addScore(alignmentScores, alignmentBreakdown, al, pts, answerSource);
    }
  }

  const baseSortedAlignments = [...ALIGNMENT_ORDER].sort((a, b) => alignmentScores[b] - alignmentScores[a]);
  const baseDominantAlignment = baseSortedAlignments[0];

  // ----- Pontuação de reino -----
  // Matriz de pesos sobre os elementos + bônus do alinhamento + respostas do
  // quiz + jitter determinístico por pessoa (desempate único por input).
  const inputKey = [
    normalizeName(input.fullName), input.birthDate, input.birthTime,
    input.birthPlace.trim().toLowerCase(),
    JSON.stringify(input.answers ?? {}), JSON.stringify(input.preferences ?? {}),
    (input.petDescription ?? '').trim().toLowerCase(),
    // Duas pessoas de mesmo nome/nascimento e respostas DIFERENTES precisam de
    // fluxos de RNG diferentes, senão saem com a mesma criatura. No caminho
    // legado quem garantia isso era `input.answers`; no caminho novo são os
    // escores do teste, que é onde as respostas viram número.
    JSON.stringify(input.soulProfile?.psychometric.traitPoints ?? {}),
  ].join('|');
  const realmScores = Object.fromEntries(REALM_ORDER.map(r => [r, 0])) as Record<RealmId, number>;
  for (const realm of REALM_ORDER) {
    let score = 0;
    for (const [el, weight] of Object.entries(REALM_WEIGHTS[realm]) as Array<[ElementId, number]>) {
      score += weight * elementScores[el];
    }
    if (ALIGNMENT_REALM_BONUS[baseDominantAlignment].includes(realm)) score += 3;
    for (const fx of questionEffects) {
      score += (fx.realms?.[realm] ?? 0) * 3; // quiz pesa forte no reino
    }
    score += hashString(`${inputKey}|${realm}`) % 4; // 0–3: assinatura pessoal
    realmScores[realm] = score;
  }

  // ----- Troca do MOTOR da leitura (utils/soulProfile/) -----
  // Tendo perfil de alma, os quatro eixos acima são SUBSTITUÍDOS pelos que o
  // motor novo calculou. O que veio antes vira leitura descartada — de
  // propósito: é mais barato deixar o caminho legado rodar do que espalhar um
  // `if` por 150 linhas de pontuação, e a diferença é imperceptível ao lado do
  // mapa astral que a UI já calculou.
  //
  // A escala não importa daqui pra frente: `combineAxis` normaliza cada eixo
  // pelo próprio total, então shares que somam 100 e pontos crus de 0 a 20
  // produzem exatamente a mesma mistura com preferências e descrição.
  if (soul) {
    const axes = soul.oracle;
    // O detalhamento por fonte fica GROSSO neste caminho, e isso é honesto: o
    // motor novo é uma soma ponderada contínua de dezenas de termos das três
    // camadas, não uma pilha de "+3 por causa do signo". Rachar o resultado em
    // três números por eixo seria inventar uma atribuição que a fórmula não
    // faz. Quem quiser o porquê fino tem a leitura inteira em `soulProfile`
    // (traços, facetas, mapa e números), que vai junto no OracleResult.
    const soulSource: LText = {
      pt: 'Perfil de alma (teste + mapa astral + numerologia)',
      en: 'Soul profile (test + natal chart + numerology)',
    };
    const replace = <K extends string>(
      scores: Record<K, number>, breakdown: Record<K, ScoreEntry[]>,
      order: K[], next: Record<K, number>,
    ) => {
      for (const k of order) {
        scores[k] = next[k];
        breakdown[k] = [{ source: soulSource, points: Math.round(next[k]) }];
      }
    };
    replace(elementScores, elementBreakdown, ELEMENT_ORDER, axes.elements);
    // Compensação de DOMINÂNCIA dos 8 elementos do jogo — só aqui, no eixo
    // que a bio e o reveal mostram. ⚠️ Achado do Loop B (28/09/2026): com o
    // ritual igualado (`RITUAL_ELEMENT_SCALE`), apareceu o que ele escondia —
    // `sombra` dominava 3% dos perfis e `ar` 19%: a leitura base de `sombra`
    // é baixa aqui porque o valor é COMPARTILHADO com o class-system, onde
    // ela já é a mais comum dos 17 (`axes.ts` documenta por que não dá pra
    // subi-la lá). Compensar AQUI mexe só no rótulo de 8, nunca na ficha.
    // Calibrado por medição até todos ficarem perto de 1/8; régua
    // `criacaoDistribuicao.test.ts`.
    for (const el of ELEMENT_ORDER) elementScores[el] += ELEMENT_DOMINANCE_COMPENSATION[el];
    // Fase 1 (28/09/2026): ajuste POR CAMINHO por cima da tabela acima, que
    // foi calibrada só no caminho curto — com os 20 itens o elemento ia a
    // 2,68× (auditoria). Ver `ROLE_DOMINANCE_COMPENSATION`.
    const caminhoEl: CaminhoRitual = soul.psychometric.answeredCount > 0 ? 'longo' : 'curto';
    for (const el of ELEMENT_ORDER) elementScores[el] += ELEMENT_PATH_COMPENSATION[caminhoEl][el];
    replace(roleScores, roleBreakdown, ROLE_ORDER, axes.roles);
    replace(alignmentScores, alignmentBreakdown, ALIGNMENT_ORDER, axes.alignments);
    for (const realm of REALM_ORDER) realmScores[realm] = axes.realms[realm];
    // Compensação de DOMINÂNCIA de papel e reino, por caminho do ritual
    // (Fase 1 do Oráculo, 28/09/2026 — ver `ROLE_DOMINANCE_COMPENSATION`).
    const caminhoRitual: CaminhoRitual = soul.psychometric.answeredCount > 0 ? 'longo' : 'curto';
    for (const role of ROLE_ORDER) roleScores[role] += ROLE_DOMINANCE_COMPENSATION[caminhoRitual][role];
    for (const realm of REALM_ORDER) realmScores[realm] += REALM_DOMINANCE_COMPENSATION[caminhoRitual][realm];

    // As 6 perguntas do ritual entram DE NOVO, por cima dos eixos do motor.
    // Elas fazem parte da leitura nos DOIS caminhos, e para quem não responde
    // o teste de 20 elas são o ÚNICO sinal de personalidade que existe — o
    // resto é céu de nascimento e nome. Substituir os eixos sem reaplicá-las
    // fazia o ritual inteiro não contar para nada.
    //
    // Escala: os eixos vêm normalizados para somar 100, então a média de cada
    // chave é 100/N (12,5 num elemento, 20 num papel, 33 num alinhamento, 11
    // num reino). Os efeitos do quiz são inteiros de 1 a 4, ou seja, um efeito
    // forte move um elemento em ~⅓ da média — mexe de verdade sem apagar o
    // mapa e o teste. O reino NÃO leva o ×3 do caminho legado: lá os escores
    // eram somas de peso×pontos (números grandes), aqui são shares de ~11, e
    // ×3 faria uma única resposta decidir o bioma sozinha.
    for (const fx of questionEffects) {
      for (const [el, pts] of Object.entries(fx.elements ?? {}) as Array<[ElementId, number]>) {
        addScore(elementScores, elementBreakdown, el, pts * RITUAL_ELEMENT_SCALE[el], answerSource);
      }
      for (const [role, pts] of Object.entries(fx.roles ?? {}) as Array<[RoleId, number]>) {
        addScore(roleScores, roleBreakdown, role, pts, answerSource);
      }
      for (const [al, pts] of Object.entries(fx.alignments ?? {}) as Array<[AlignmentId, number]>) {
        addScore(alignmentScores, alignmentBreakdown, al, pts * RITUAL_ALIGNMENT_SCALE[al], answerSource);
      }
      for (const realm of REALM_ORDER) {
        realmScores[realm] += (fx.realms?.[realm] ?? 0) * RITUAL_REALM_SCALE[realm];
      }
    }
  }

  // ----- Combinação de pesos: leitura + preferências (25%) + descrição (50%) -----
  // Sem preferências e sem descrição → 100% leitura (astros + numerologia + quiz).
  const descText = input.petDescription?.trim() ? normalizeText(input.petDescription) : '';
  const descHits = {
    elements: descText ? countKeywordHits(descText, DESC_KEYWORDS.elements, ELEMENT_ORDER) : null,
    realms: descText ? countKeywordHits(descText, DESC_KEYWORDS.realms, REALM_ORDER) : null,
    alignments: descText ? countKeywordHits(descText, DESC_KEYWORDS.alignments, ALIGNMENT_ORDER) : null,
    roles: descText ? countKeywordHits(descText, DESC_KEYWORDS.roles, ROLE_ORDER) : null,
  };

  function combineAxis<K extends string>(
    base: Record<K, number>,
    order: K[],
    pref: K | undefined,
    hits: Record<K, number> | null,
    arredondar = true,
  ): Record<K, number> {
    const totalBase = order.reduce((s, k) => s + base[k], 0) || 1;
    const totalHits = hits ? order.reduce((s, k) => s + hits[k], 0) : 0;
    const wPref = pref ? 0.25 : 0;
    const wDesc = totalHits > 0 ? 0.5 : 0;
    const wBase = 1 - wPref - wDesc;
    const out = {} as Record<K, number>;
    for (const k of order) {
      let f = wBase * (base[k] / totalBase);
      if (pref && k === pref) f += wPref;
      if (hits && totalHits > 0) f += wDesc * (hits[k] / totalHits);
      out[k] = arredondar ? Math.round(f * 100) : f * 100;
    }
    return out;
  }

  const finalElementScores = combineAxis(elementScores, ELEMENT_ORDER, input.preferences?.element, descHits.elements);
  const finalRoleScores = combineAxis(roleScores, ROLE_ORDER, undefined, descHits.roles);
  const finalAlignmentScores = combineAxis(alignmentScores, ALIGNMENT_ORDER, input.preferences?.alignment, descHits.alignments);
  const finalRealmScores = combineAxis(realmScores, REALM_ORDER, input.preferences?.realm, descHits.realms);

  // Registra as influências extras no breakdown (transparência)
  if (input.preferences?.element) {
    addScore(elementScores, elementBreakdown, input.preferences.element, 0,
      { pt: 'Preferência direta (25%)', en: 'Direct preference (25%)' });
  }
  if (descText) {
    addScore(elementScores, elementBreakdown,
      [...ELEMENT_ORDER].sort((a, b) => (descHits.elements?.[b] ?? 0) - (descHits.elements?.[a] ?? 0))[0], 0,
      { pt: 'Descrição do pet (50%)', en: 'Pet description (50%)' });
  }

  const sortedElements = [...ELEMENT_ORDER].sort((a, b) => finalElementScores[b] - finalElementScores[a]);
  let dominantElement = sortedElements[0];
  // Elemento ÚNICO por padrão; só há um segundo elemento se a pontuação for
  // próxima da do primeiro (≥ 75%).
  let secondaryElement: ElementId | null =
    finalElementScores[sortedElements[1]] >= finalElementScores[sortedElements[0]] * 0.75
      ? sortedElements[1]
      : null;

  // Renascimento (Fase 3, decisão 1): o traço herdado do ciclo anterior. Só
  // preenche o 2º slot quando ele está VAZIO e o elemento herdado não é o
  // dominante — influência leve, registrada no breakdown por transparência.
  const herdado = input.rebirth?.herdado?.elemento;
  if (herdado && ELEMENT_ORDER.includes(herdado) && herdado !== dominantElement && secondaryElement === null) {
    secondaryElement = herdado;
    addScore(elementScores, elementBreakdown, herdado, 0,
      { pt: 'Herança do ciclo anterior', en: 'Inherited from the previous cycle' });
  }

  // Papel e reino decidem pelo escore NÃO arredondado (Fase 1, 28/09/2026):
  // com shares inteiros de ~11 (reino) e ~20 (papel), o empate era comum e
  // caía na ordem fixa de `ROLE_ORDER`/`REALM_ORDER` — viés estrutural sem
  // significado, e o que deixava a calibração por simulação oscilando.
  // Os escores exibidos (`finalRoleScores`/`finalRealmScores`) seguem inteiros.
  const roleExato = combineAxis(roleScores, ROLE_ORDER, undefined, descHits.roles, false);
  const realmExato = combineAxis(realmScores, REALM_ORDER, input.preferences?.realm, descHits.realms, false);
  dominantRole = [...ROLE_ORDER].sort((a, b) => roleExato[b] - roleExato[a])[0];
  let dominantAlignment = [...ALIGNMENT_ORDER].sort((a, b) => finalAlignmentScores[b] - finalAlignmentScores[a])[0];
  let dominantRealm = [...REALM_ORDER].sort((a, b) => realmExato[b] - realmExato[a])[0];

  // ----- Ajustes manuais do usuário (override direto dos vencedores) -----
  if (overrides) {
    dominantElement = overrides.dominantElement ?? dominantElement;
    if (overrides.secondaryElement !== undefined) secondaryElement = overrides.secondaryElement; // pode ser null (único)
    if (secondaryElement === dominantElement) {
      secondaryElement = sortedElements.find(e => e !== dominantElement) ?? null;
    }
    dominantRole = overrides.dominantRole ?? dominantRole;
    dominantAlignment = overrides.dominantAlignment ?? dominantAlignment;
    dominantRealm = overrides.dominantRealm ?? dominantRealm;
  }

  // ----- RNG semeado (parte criativa) -----
  const baseHash = hashString(inputKey);
  const salt = seed ?? Math.floor(Math.random() * 0xffffffff);
  const rng = mulberry32((baseHash ^ salt) >>> 0);

  // ----- Arquétipo: 1 substantivo + 2 adjetivos -----
  const nounPool = [
    ...NOUNS_BY_ELEMENT[dominantElement],
    ...(secondaryElement ? NOUNS_BY_ELEMENT[secondaryElement] : []),
  ];
  const noun = pick(rng, nounPool);
  const adjRole = pick(rng, ADJECTIVES_BY_ROLE[dominantRole]);
  const adjElement = pick(rng, ADJECTIVES_BY_ELEMENT[secondaryElement ?? dominantElement]);
  const archetype: ArchetypeResult = {
    noun: { pt: noun.pt, en: noun.en },
    nounEn: noun.en,
    adjectives: [adjRole, adjElement],
    phrase: {
      pt: `${noun.pt} ${adjRole.pt} e ${adjElement.pt}`,
      en: `${adjRole.en} and ${adjElement.en} ${noun.en}`,
    },
  };

  // ----- Resumo de personalidade (deduzida dos astros + numerologia + quiz;
  // os símbolos ficam SÓ aqui — a criatura não os representa) -----
  const sunTrait = pick(rng, sun.traits);
  const ascTrait = pick(rng, ascendant.traits);
  const chinTrait = chinese.traits[0];
  const vedTrait = vedic.traits[0];
  const personalitySummary: LText = {
    pt: `${ELEMENT_INFO[dominantElement].personality.pt} No fundo é ${sunTrait.pt}, mostra-se ${ascTrait.pt}, carrega a essência de quem é ${chinTrait.pt} e a alma védica de "${vedTrait.pt}". ${ROLE_INFO[dominantRole].profile.pt} Alinhamento ${ALIGNMENT_INFO[dominantAlignment].name.pt.toLowerCase()}: ${ALIGNMENT_INFO[dominantAlignment].profile.pt.toLowerCase()}`,
    en: `${ELEMENT_INFO[dominantElement].personality.en} Deep down ${sunTrait.en}, outwardly ${ascTrait.en}, carrying the essence of someone ${chinTrait.en} and the Vedic soul of "${vedTrait.en}". ${ROLE_INFO[dominantRole].profile.en} ${ALIGNMENT_INFO[dominantAlignment].name.en} alignment: ${ALIGNMENT_INFO[dominantAlignment].profile.en.toLowerCase()}`,
  };

  // ----- Criatura: FAMÍLIA (2 slots) -----
  // Slot 1 dominante + slot 2 (menor impacto, quase sempre a mesma família;
  // raramente 2ª família distinta; mais raro ainda, um OBJETO). Descrição do
  // pet citando um bicho tem prioridade. O horóscopo NUNCA aparece no corpo.
  // Dica de família: a descrição do USUÁRIO manda; sem ela, a inspiração do
  // bestiário guia a escolha de família/subfamília (por menção textual aos
  // substantivos internos — o nome da criatura já foi removido antes de
  // chegar aqui). Só a ESCOLHA de família lê este texto: bio, conceito e
  // prompts continuam saindo dos bancos de palavras próprios.
  const familyHintText = descText || (input.bestiaryInspiration ? normalizeText(input.bestiaryInspiration.texto) : '');
  /* ⚠️ **O NOME da inspiração passou a ir no prompt em 27/09/2026 (D-B1,
     decisão do dono).** Antes ele era removido de propósito — `pipeline.ts`
     cortava o nome da descrição e havia teste travando a ausência dele nos 11
     prompts. O dono decidiu o contrário, sabendo do risco de direito autoral:
     tenta COM o nome, e se o provedor recusar, a 2ª tentativa vai sem.
     Entra SÓ em `imagePrompt`; `imagePromptFallback` segue limpo. */
  const inspiracaoNome = input.bestiaryInspiration?.nome?.trim() || undefined;
  // Por estágio, prefere a base da LINHAGEM (proximidade de espécie já
  // calculada); sem lineage (caminho legado/`generateOracle` puro), cai no
  // nome único de sempre — nunca quebra quem não passa o campo novo.
  const inspiracaoPorEstagio = input.bestiaryLineageNomes;
  const inspiracaoRookie = inspiracaoPorEstagio?.rookie?.trim() || inspiracaoNome;
  const inspiracaoChampion = inspiracaoPorEstagio?.champion?.trim() || inspiracaoNome;
  const inspiracaoPerfeito = inspiracaoPorEstagio?.perfeito?.trim() || inspiracaoNome;
  const inspiracaoMega = inspiracaoPorEstagio?.mega?.trim() || inspiracaoNome;
  const inspiracaoUltra = inspiracaoPorEstagio?.ultra?.trim() || inspiracaoNome;
  // ⚠️ Achado de 28/09/2026: `familia`/`biologia` chegavam em
  // `bestiaryInspiration` e nunca eram lidos aqui — a taxonomia que
  // `select.ts` já calculou com confiança (bônus de `REALM_TO_FAMILIAS`) era
  // jogada fora na hora de escolher a família visual. Hoje reforça o slot 1
  // quando a descrição do usuário não citou bicho nenhum explicitamente.
  const bestiaryFamilyHint = input.bestiaryInspiration
    ? bestiaryFamilyIds(input.bestiaryInspiration.familia, input.bestiaryInspiration.biologia)
    : null;
  // O mais forte dos 11 elementos exclusivos do class-system (ver
  // `MOTIVO_ELEMENTO_CLASSE`). Só existe no caminho com perfil de alma.
  const motivoId = soul
    ? Object.keys(MOTIVO_ELEMENTO_CLASSE)
      .sort((a, b) => (soul.oracle.classElements[b as keyof typeof soul.oracle.classElements] ?? 0) - (soul.oracle.classElements[a as keyof typeof soul.oracle.classElements] ?? 0))[0]
    : undefined;
  const motivo = motivoId ? MOTIVO_ELEMENTO_CLASSE[motivoId] : undefined;
  const family = pickFamilies(
    CREATURE_FAMILIES, rng, dominantElement, secondaryElement, dominantRealm,
    descText, bestiaryFamilyHint,
    descText ? '' : familyHintText,
    motivo?.familias ?? [],
  );
  // fusionA/fusionB = substantivos concretos dos dois slots (compat + conceito)
  const fusionA = family.primary.noun;
  const fusionB = family.secondary.noun;
  // Identidade CURTA da criatura (espécie): mono = 1 conceito só (ex.: "Cérberus");
  // híbrido bicho+bicho = composto com hífen (ex.: "octopus-frog"); híbrido
  // bicho+objeto = objeto qualificando o bicho (ex.: "hammer-crab" / "caranguejo
  // de martelo"). Curta de propósito — prompts de sprite curtos funcionam melhor.
  /** Funde dois rótulos sem repetir radical: quando um contém o outro (dois
   *  bichos da mesma família, tipo "urso" + "urso polar"), o composto saía
   *  "urso-urso polar". Fica só o mais específico. */
  const fundir = (a: string, b: string, sep: string): string => {
    const na = a.trim().toLowerCase(); const nb = b.trim().toLowerCase();
    if (na === nb) return a;
    if (nb.includes(na)) return b;
    if (na.includes(nb)) return a;
    return `${a}${sep}${b}`;
  };
  const identity: LText = family.mono
    ? { pt: fusionA.pt, en: fusionA.en }
    : family.secondary.isObject
      ? { pt: fundir(fusionA.pt, fusionB.pt, ' de '), en: fundir(fusionB.en, fusionA.en, '-') }
      : { pt: fundir(fusionA.pt, fusionB.pt, '-'), en: fundir(fusionA.en, fusionB.en, '-') };

  // Características sorteadas dos POOLS (assinatura visual única).
  // Nota: em 16x16 não cabem textura/cauda/marcas — esses pools continuam
  // existindo para descrições e para um futuro "modo HD", mas os prompts de
  // sprite carregam só o essencial: paleta do elemento + acento do tipo +
  // fusão mínima + a forma do estágio. Os pools ricos abaixo alimentam as
  // DESCRIÇÕES em texto (e um futuro modo HD), não o prompt 16x16.
  const alignTrait = pick(rng, ALIGNMENT_TRAIT_WORDS[dominantAlignment]);
  const palette = pick(rng, ELEMENT_PALETTES[dominantElement]);
  const realmInfo = REALM_INFO[dominantRealm];
  const emblem = pick(rng, REALM_EMBLEMS[dominantRealm]);

  // Nome: radical de elemento(s) OU de reino combinado com sílaba pessoal,
  // em PADRÕES variados. RNG dedicado ao nome (mesmos bits de identidade +
  // salt, stream decorrelacionado do principal): o pipeline entrega uma
  // identidade ~96% única e a máquina de nomes não pode jogar isso fora.
  // Antes: radical + (1ª letra + 1ª vogal do nome) — as sílabas pessoais
  // colapsavam em "ma/ca/jo/pe" e ~11% dos nomes colidiam em N=200. Agora:
  // bancos maiores, TODAS as sílabas CV do nome como candidatas, e 4 padrões
  // de composição (a posição variável da sílaba do elemento é o que separa
  // pares quase-iguais tipo Sylvafa/Sylvofa). Estilo preservado: curto,
  // pronunciável, com sabor de elemento.
  const stemPool = [
    ...ELEMENT_NAME_STEMS[dominantElement],
    ...(secondaryElement ? ELEMENT_NAME_STEMS[secondaryElement] : []),
    ...REALM_NAME_STEMS[dominantRealm],
  ];
  const nameRng = mulberry32((hashString(`${inputKey}|nome`) ^ salt) >>> 0);
  const stem = pick(nameRng, stemPool);
  const nameLetters = normalizeName(input.fullName);
  // Sílabas consoante+vogal extraídas do nome INTEIRO (não só a inicial):
  // "MATEUSSPERANDIO" → ma/te/pe/ra/di… — mais bits da identidade na escolha.
  const cvSyllables: string[] = [];
  for (let i = 0; i + 1 < nameLetters.length; i++) {
    if (!VOWELS.has(nameLetters[i]) && VOWELS.has(nameLetters[i + 1])) {
      cvSyllables.push((nameLetters[i] + nameLetters[i + 1]).toLowerCase());
    }
  }
  const nameSyllable = cvSyllables.length
    ? pick(nameRng, cvSyllables)
    : nameLetters
      ? (nameLetters[0] + (nameLetters.slice(1).match(/[AEIOU]/)?.[0] ?? 'a')).toLowerCase()
      : 'mo';
  const codaAfterPersonal = pick(nameRng, NAME_CODAS_AFTER_CONSONANT);
  const tail = pick(nameRng, NAME_TAILS);
  const patternRoll = nameRng();
  let rawName: string;
  if (patternRoll < 0.4) {
    rawName = stem + nameSyllable; // clássico: Flaredi
  } else if (patternRoll < 0.6) {
    // sílaba pessoal na FRENTE, elemento atrás: Diflare
    rawName = nameSyllable[0].toUpperCase() + nameSyllable.slice(1) + stem.toLowerCase();
  } else if (patternRoll < 0.8) {
    // radical + consoante pessoal + coda: Aquamis, Thornedix. Até a B4 era
    // só radical + coda, sem nada do nome — o padrão que mais colidia (C8).
    rawName = stem + nameSyllable[0] + codaAfterPersonal;
  } else {
    rawName = stem + nameSyllable + tail; // Flaredin, Flaredis
  }
  const baseName = rawName.replace(/(.)\1+/g, '$1');

  // Nome sem sufixo mecânico: um "-mon" fixo em toda criatura, combinado com
  // prefixos de linha (War/Omega/Omni…), soletrava nomes reais do Digimon
  // (WarGreymon, Omegamon/Omnimon) — o mesmo tipo de risco que já tirou os
  // 74 sprites da Bandai daqui (ver "Arte e nomes" no CLAUDE.md). O radical
  // (`baseName`) já é próprio e único; ele é o nome inteiro do rookie.
  const rookieName = baseName;

  const elName = ELEMENT_INFO[dominantElement].name;
  const el2Name = secondaryElement ? ELEMENT_INFO[secondaryElement].name : null;
  const roleName = ROLE_INFO[dominantRole].name;
  const alignName = ALIGNMENT_INFO[dominantAlignment].name;

  const attribute = ALIGNMENT_INFO[dominantAlignment].attribute;
  const elementPhrase = {
    pt: el2Name ? `Elemento ${elName.pt} com traços de ${el2Name.pt}` : `Elemento ${elName.pt} puro`,
    en: el2Name ? `${elName.en} element with ${el2Name.en} traits` : `pure ${elName.en} element`,
  };
  const concept: LText = {
    pt: `Família ${family.primary.family.pt} (${family.primary.subfamily.pt})${family.mono ? '' : family.secondary.isObject ? ` + objeto ${family.secondary.subfamily.pt}` : ` + ${family.secondary.family.pt} (${family.secondary.subfamily.pt})`}, nascida no reino ${realmInfo.name.pt} ${realmInfo.emoji}. ${elementPhrase.pt}, alinhamento ${alignName.pt} (atributo ${attribute.pt}), função ${roleName.pt} — encarnação do arquétipo "${archetype.phrase.pt}". Do rookie partem 3 linhas de evolução (Poder, Harmonia e Benevolência), e os três Megas se fundem no Ultra.`,
    en: `${family.primary.family.en} family (${family.primary.subfamily.en})${family.mono ? '' : family.secondary.isObject ? ` + ${family.secondary.subfamily.en} object` : ` + ${family.secondary.family.en} (${family.secondary.subfamily.en})`}, born in the ${realmInfo.name.en} realm ${realmInfo.emoji}. ${elementPhrase.en}, ${alignName.en} alignment (${attribute.en} attribute), ${roleName.en} role — incarnation of the archetype "${archetype.phrase.en}". From the rookie, 3 evolution lines branch out (Power, Harmony and Benevolence), and the three Megas fuse into the Ultra.`,
  };

  // ----- BLOCOS DO PROMPT -----
  // Cor base (paleta variada do pool, sem "color palette").
  const colorDesc = palette.replace(/\s*color palette\s*$/i, '');
  // Classe DEFINITIVA (função × alinhamento × elemento dominante, ver
  // CLASS_MATRIX) + elemento SECUNDÁRIO como adjetivo solto (nunca muda a
  // classe). Escolhidos UMA vez — constantes nos 11 prompts, é a identidade
  // fixa da espécie. A descrição livre do pet SUBSTITUI o bloco (não soma).
  const dominantClass = CLASS_MATRIX[dominantRole][dominantAlignment][dominantElement];
  const secondaryFlavor = secondaryElement ? pick(rng, ELEMENT_FLAVOR_WORDS[secondaryElement]) : null;
  // Prompt de sprite CURTO — lista de traços, não frase longa (testes empíricos:
  // "Tamagotchi style, sem fundo, descrição bem curta" gera sprites melhores
  // que frases tipo "wielding X to Y"). `promptClassFlavor` é o 4º traço,
  // OPCIONAL — só quando o pipeline calculou um arquétipo pleno de verdade
  // (não o fallback genérico "Adept of X"); dá o mesmo detalhe extra que o
  // reveal já tinha antes de virar mais genérico, mas só na imagem.
  const spriteTraitsEn = [identity.en, dominantClass.en, secondaryFlavor?.en, motivo?.en, input.promptClassFlavor]
    .filter(Boolean).join(', ');
  // A bio é o ÚNICO texto descritivo do reveal — o momento mais importante do
  // ritual. Era um fragmento em EN ("angel-seraph, Sky Cleric": minúscula, sem
  // verbo, sem ponto, e o traço secundário sumia) e uma frase truncada em PT
  // ("de traços cintilante", sem concordância nem ponto). Agora é frase de
  // verdade nos dois idiomas, com o traço secundário presente em ambos.
  const upperFirst = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
  // "marcado por algo X" evita o problema de concordância: os flavors vêm em
  // formatos diferentes (adjetivo "aquático", locução "de maré-viva") e
  // "de traços cintilante" saía sem plural nem gênero.
  // Companheiro capturado (achado do LOOP 1, ver `companionName` acima):
  // sentença final opcional, do mesmo jeito que `secondaryFlavor` já soma —
  // nunca substitui nada, só acrescenta se existir.
  const companionName = input.companionName?.pt.trim() ? input.companionName : undefined;
  const companionClauseEn = companionName ? ` Bonded with a ${companionName.en.trim()} companion.` : '';
  const companionClausePt = companionName ? ` Vínculo com um companheiro ${companionName.pt.trim()}.` : '';
  const richConceptEn = (secondaryFlavor
    ? `${upperFirst(dominantClass.en)} of the ${identity.en} bloodline, marked by something ${secondaryFlavor.en}.`
    : `${upperFirst(dominantClass.en)} of the ${identity.en} bloodline.`) + companionClauseEn;
  const richConceptPt = (secondaryFlavor
    ? `${upperFirst(dominantClass.pt)} da linhagem ${identity.pt}, marcado por algo ${secondaryFlavor.pt}.`
    : `${upperFirst(dominantClass.pt)} da linhagem ${identity.pt}.`) + companionClausePt;
  const petConceptRaw = input.petDescription?.trim()
    ? input.petDescription.trim().replace(/\s+/g, ' ').slice(0, 200)
    : null;
  const spriteConcept = petConceptRaw ?? spriteTraitsEn;
  // "Qual sua criatura favorita?" — prefixo literal (1-2 palavras) injetado
  // antes do conceito em TODOS os prompts de imagem (não substitui, só soma).
  const favoriteCreature = input.favoriteCreature?.trim()
    ? input.favoriteCreature.trim().replace(/\s+/g, ' ').split(' ').slice(0, 2).join(' ')
    : undefined;
  // Renascimento: a criatura é campo ABERTO e por isso vai entre aspas no
  // prompt — delimitar é o que impede o texto do jogador de ser lido como
  // instrução. Escola e elemento são de catálogo fechado e entram soltos.
  // O traço herdado (Fase 3, decisão 1) é a marca de continuidade — "É ele.
  // Ainda é ele." — e por isso vai em TODAS as formas, nas duas variantes.
  const herdadoEl = input.rebirth?.herdado?.elemento;
  const herancaClause = herdadoEl && ELEMENT_INFO[herdadoEl]
    ? ` Carries a trace of its previous cycle: subtle ${ELEMENT_INFO[herdadoEl].name.en.toLowerCase()} tones in its markings.`
    : '';
  const rebirthClause = input.rebirth
    ? `Reborn form: shaped after "${input.rebirth.criatura}", `
      + `of the ${input.rebirth.escolaNome} school, `
      + `${input.rebirth.elementoNome} element.` + herancaClause
    : undefined;
  // Bio: descrição breve e legível da criatura (não some no prompt, é exibida
  // na página/exportação). Se o dono descreveu o pet, essa descrição vale.
  const bio: LText = petConceptRaw
    ? { pt: petConceptRaw, en: petConceptRaw }
    : { pt: richConceptPt, en: richConceptEn };

  const stages: CreatureStage[] = [];

  // COMPORTAMENTO — a metade que faltava na descrição por forma. Reusa sinal
  // REAL já computado (papel + alinhamento dominantes), em vez de inventar
  // texto — as mesmas frases que hoje só apareciam na OraclePage interna
  // (`personalitySummary`), nunca para o jogador. Uma frase só, plana, sem
  // termos de jogo (nada de "alinhamento X" ou pontuação) — pura descrição de
  // COMO ele age, igual em toda a espécie (é o traço nascido junto com ela).
  const behaviorSentence: LText = {
    pt: `${ROLE_INFO[dominantRole].profile.pt} ${ALIGNMENT_INFO[dominantAlignment].profile.pt}`,
    en: `${ROLE_INFO[dominantRole].profile.en} ${ALIGNMENT_INFO[dominantAlignment].profile.en}`,
  };

  // ----- Rookie: forma base ÚNICA (usa o tipo dominante da leitura) -----
  const rookieLevel = pick(rng, ROOKIE_LOOK);
  stages.push({
    stage: 'rookie',
    stageName: STAGE_NAMES.rookie,
    name: rookieName,
    description: {
      pt: `${rookieName} é a forma base: um monstrinho pequeno e simples em que ${family.mono ? `a família ${fusionA.pt}` : `a mistura de ${fusionA.pt} e ${fusionB.pt}`} já aparece, ${alignTrait.pt}. Todas as 3 linhas de evolução partem daqui. ${behaviorSentence.pt}`,
      en: `${rookieName} is the base form: a small, simple little monster where ${family.mono ? `the ${fusionA.en} family` : `the ${fusionA.en}-${fusionB.en} blend`} already shows, ${alignTrait.en}. All 3 evolution lines branch from here. ${behaviorSentence.en}`,
    },
    ...composeSpritePrompts({
      concept: spriteConcept, colorDesc, accent: ALIGNMENT_ACCENT[dominantAlignment],
      favoriteCreature, rebirth: rebirthClause, inspiracao: inspiracaoRookie,
      levelBlock: rookieLevel,
    }),
  });

  // ----- 3 linhas de evolução: champion → perfeito → mega por TIPO -----
  const usedShapes = new Set<string>();
  const petElements: ElementId[] = [dominantElement, ...(secondaryElement ? [secondaryElement] : [])];
  const megaShapeByBranch = {} as Record<AlignmentId, EvoShape>;

  for (const branch of ALIGNMENT_ORDER) {
    const bInfo = ALIGNMENT_INFO[branch];
    const bTrait = pick(rng, ALIGNMENT_TRAIT_WORDS[branch]);
    const bManifest = pick(rng, ELEMENT_MANIFESTS[secondaryElement ?? dominantElement]);
    const bRegalia = pick(rng, MEGA_REGALIAS[branch]);
    const bAccent = ALIGNMENT_ACCENT[branch];
    const champShape = pickShape(rng, CHAMPION_SHAPES, branch, petElements, usedShapes);
    const perfShape = pickShape(rng, PERFECT_SHAPES, branch, petElements, usedShapes);
    const megaShape = pickShape(rng, MEGA_SHAPES, branch, petElements, usedShapes);
    megaShapeByBranch[branch] = megaShape;

    const champName = `${pick(rng, CHAMPION_PREFIXES[branch])}${baseName}`;
    const perfName = `${pick(rng, PERFECT_STAGE_PREFIXES[branch])}${baseName}`;
    const megaName = `${pick(rng, MEGA_STAGE_PREFIXES[branch])}${baseName}`;
    const linePt = `linha ${bInfo.name.pt} (${bInfo.attribute.pt})`;
    const lineEn = `${bInfo.name.en} (${bInfo.attribute.en}) line`;

    stages.push({
      stage: 'champion',
      branch,
      stageName: STAGE_NAMES.champion,
      name: champName,
      description: {
        pt: `${champName} — Champion da ${linePt}: ${rookieName} evolui para ${champShape.pt}, ${bTrait.pt}. Maior e mais selvagem, mas com o mesmo rosto e a mesma crista. ${behaviorSentence.pt}`,
        en: `${champName} — Champion of the ${lineEn}: ${rookieName} evolves into ${champShape.en}, ${bTrait.en}. Bigger and wilder, yet with the same face and crest. ${behaviorSentence.en}`,
      },
      ...composeSpritePrompts({
        concept: spriteConcept, colorDesc, accent: bAccent,
        favoriteCreature, rebirth: rebirthClause, inspiracao: inspiracaoChampion,
        levelBlock: `it has evolved into ${champShape.en}`,
      }),
    });

    stages.push({
      stage: 'perfeito',
      branch,
      stageName: STAGE_NAMES.perfeito,
      name: perfName,
      description: {
        pt: `${perfName} — Perfeito da ${linePt}: metamorfose completa — vira ${perfShape.pt}. Seu elemento se materializa (${bManifest.pt}) e ${emblem.pt} do ${realmInfo.name.pt} marca o corpo. Mesmo rosto, mesma crista. ${behaviorSentence.pt}`,
        en: `${perfName} — Perfect of the ${lineEn}: full metamorphosis — it becomes ${perfShape.en}. Its element materializes (${bManifest.en}) and ${emblem.en} of the ${realmInfo.name.en} marks its body. Same face, same crest. ${behaviorSentence.en}`,
      },
      ...composeSpritePrompts({
        concept: spriteConcept, colorDesc, accent: bAccent,
        favoriteCreature, rebirth: rebirthClause, inspiracao: inspiracaoPerfeito,
        levelBlock: `it has transformed into ${perfShape.en}`,
      }),
    });

    stages.push({
      stage: 'mega',
      branch,
      stageName: STAGE_NAMES.mega,
      name: megaName,
      description: {
        pt: `${megaName} — Mega da ${linePt}: a apoteose — ascende como ${megaShape.pt}. ${bRegalia.pt}. O corpo se transmuta parcialmente em ${elName.pt} vivo. ${behaviorSentence.pt}`,
        en: `${megaName} — Mega of the ${lineEn}: the apotheosis — it ascends as ${megaShape.en}. ${upperFirstText(bRegalia.en.split(':')[0])}. Its body partially transmutes into living ${elName.en}. ${behaviorSentence.en}`,
      },
      ...composeSpritePrompts({
        concept: spriteConcept, colorDesc, accent: bAccent,
        favoriteCreature, rebirth: rebirthClause, inspiracao: inspiracaoMega,
        levelBlock: `in its final form, it is ${megaShape.en}`,
      }),
    });
  }

  // ----- Ultra: a fusão dos 3 Megas (o ápice absoluto) -----
  // "Triune" (três-em-um), não "Omni_mon" — o prefixo antigo + o sufixo
  // fixo juntos soletravam demais um fusão bem específica e famosa de outra
  // franquia. Ver nota do `baseName`/`rookieName` acima.
  const ultraName = `Triune${baseName}`;
  stages.push({
    stage: 'ultra',
    stageName: STAGE_NAMES.ultra,
    name: ultraName,
    description: {
      pt: `${ultraName} é o Ultra: a fusão dos três Megas — ${megaShapeByBranch.poder.pt}, ${megaShapeByBranch.harmonia.pt} e ${megaShapeByBranch.benevolencia.pt} — em um único ser transcendente que une a ferocidade do Poder, o equilíbrio da Harmonia e a nobreza da Benevolência. O ápice absoluto do arquétipo "${archetype.phrase.pt}". ${behaviorSentence.pt}`,
      en: `${ultraName} is the Ultra: the fusion of the three Megas — ${megaShapeByBranch.poder.en}, ${megaShapeByBranch.harmonia.en} and ${megaShapeByBranch.benevolencia.en} — into a single transcendent being uniting the ferocity of Power, the balance of Harmony and the nobility of Benevolence. The absolute apex of the archetype "${archetype.phrase.en}". ${behaviorSentence.en}`,
    },
    ...composeSpritePrompts({
      concept: spriteConcept, colorDesc, accent: 'red, cyan and gold',
      favoriteCreature, rebirth: rebirthClause, inspiracao: inspiracaoUltra,
      levelBlock: `${pick(rng, ULTRA_LOOK)}, the ultra fusion of its three mega forms`,
    }),
  });

  return {
    input,
    seed: salt,
    numerology,
    western: { sun, ascendant },
    chinese,
    vedic,
    // Pontuações FINAIS (leitura + preferências 25% + descrição 50%), 0–100
    elementScores: finalElementScores,
    elementBreakdown,
    dominantElement,
    secondaryElement,
    roleScores: finalRoleScores,
    roleBreakdown,
    dominantRole,
    alignmentScores: finalAlignmentScores,
    alignmentBreakdown,
    dominantAlignment,
    realmScores: finalRealmScores,
    dominantRealm,
    personalitySummary,
    archetype,
    creature: {
      baseName,
      concept,
      bio,
      fusion: { a: { pt: fusionA.pt, en: fusionA.en }, b: { pt: fusionB.pt, en: fusionB.en } },
      family,
      stages,
    },
  };
}

