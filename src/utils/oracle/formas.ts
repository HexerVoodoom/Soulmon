// EIXOS DE FORMA da evolução (decisão do dono, 15/10/2026): o sorteio de cada
// estágio combina morfologia (SHAPE, só plano corporal) + motivo de elemento/
// tema (MOTIF) + ALIGNMENT_DESIGNS + TYPE_LOOK. Aqui moram os dados novos;
// a lógica de sorteio fica em `motor.ts`. Itens novos entram SEMPRE no fim.
import type { ElementId, AlignmentId, LText } from '../oracle';

/** Grupo de morfologia da espécie do rookie; usado como afinidade LEVE. */
export type KinGroup = 'quad' | 'bird' | 'aqua' | 'bug' | 'plant' | 'rept';

export interface EvoShape {
  pt: string; en: string; elements: ElementId[]; alignments: AlignmentId[];
  /** Espécies (grupo) em que a morfologia combina; vazio = serve a qualquer. */
  kin?: KinGroup[];
}

const m = (pt: string, en: string, kin: KinGroup[] = [], elements: ElementId[] = [], alignments: AlignmentId[] = []): EvoShape =>
  ({ pt, en, elements, alignments, ...(kin.length ? { kin } : {}) });

/** família (id de `CREATURE_FAMILIES`) -> grupo de morfologia. */
export const FAMILY_KIN: Record<string, KinGroup> = {
  feline: 'quad', canine: 'quad', ursine: 'quad', rodent: 'quad', equine: 'quad', bovine: 'quad',
  deer: 'quad', primate: 'quad', mustelid: 'quad', proboscidean: 'quad', chiroptera: 'bird',
  raptor: 'bird', corvid: 'bird', owl: 'bird', songbird: 'bird', waterfowl: 'bird', seabird: 'bird',
  ornamentalbird: 'bird', ratite: 'bird',
  shark: 'aqua', deepsea: 'aqua', reeffish: 'aqua', eel: 'aqua', pelagicfish: 'aqua', cephalopod: 'aqua',
  cetacean: 'aqua', crab: 'aqua', lobster: 'aqua', cnidarian: 'aqua', worm: 'aqua',
  beetle: 'bug', butterfly: 'bug', mantis: 'bug', hymenopteran: 'bug', dragonfly: 'bug',
  orthopteran: 'bug', myriapod: 'bug', spider: 'bug', scorpion: 'bug',
  flower: 'plant', tree: 'plant', fungus: 'plant', carniplant: 'plant', desertplant: 'plant',
  vine: 'plant', fruitgourd: 'plant',
  dinosaur: 'rept', reptile: 'rept', amphibian: 'rept', dragon: 'rept',
};

export const CHAMPION_MORPHS_EXTRA: EvoShape[] = [
  m('quadrúpede esguio de costas arqueadas', 'a lean arch-backed quadruped built for sprinting', ['quad']),
  m('quadrúpede maciço de ombros largos', 'a broad-shouldered heavy quadruped', ['quad']),
  m('bípede imponente de postura ereta', 'an imposing upright biped with a proud chest', ['quad', 'rept']),
  m('serpentiforme de corpo longo e ondulante', 'a long undulating serpentine body', ['rept', 'aqua']),
  m('alado de envergadura ampla', 'a wide-winged flier with a streamlined body', ['bird']),
  m('ave bípede de pernas fortes e crista', 'a strong-legged crested bipedal bird', ['bird']),
  m('aquático de barbatanas largas e cauda de leme', 'a finned aquatic body with a rudder tail', ['aqua']),
  m('inseto de seis patas e carapaça em placas', 'a six-legged insectoid with a plated carapace', ['bug']),
  m('arácnide de oito patas e abdômen redondo', 'an eight-legged arachnid with a round abdomen', ['bug']),
  m('anfíbio agachado de patas palmadas', 'a crouching amphibian with webbed limbs', ['rept', 'aqua']),
  m('rastejante de ventre rente ao chão', 'a low belly-crawling body with short strong limbs', ['rept', 'bug']),
  m('tentacular de braços sinuosos', 'a tentacled body with long sinuous arms', ['aqua']),
  m('orbe redonda com pequenos membros', 'a round orb-like body with small stubby limbs', []),
  m('flutuante, sem pernas, cauda em fita', 'a floating legless body trailing a ribbon tail', []),
  m('bípede de braços longos e punhos grandes', 'a long-armed biped with oversized fists', ['quad']),
  m('vegetal de corpo ramificado e raízes nos pés', 'a branching plant-like body with root feet', ['plant']),
  m('felino de cauda longa e orelhas grandes', 'a long-tailed big-eared prowler', ['quad']),
  m('blindado de casco e patas curtas', 'a short-legged armored shell-back', ['rept', 'aqua']),
];

export const PERFECT_MORPHS_EXTRA: EvoShape[] = [
  m('centauro de tronco humanoide e corpo de quadrúpede', 'a centaur-like body with a humanoid torso on four legs', ['quad']),
  m('multi-braços de quatro braços e postura firme', 'a four-armed biped in a steady stance', []),
  m('serpentiforme com cabeça de crista aberta', 'a coiled serpentine body with a flared hood crest', ['rept']),
  m('alado de asas duplas e cauda longa', 'a double-winged flier with a long tail', ['bird']),
  m('aquático com cauda de leme e nadadeiras-lâmina', 'an aquatic hunter with a rudder tail and blade-like fins', ['aqua']),
  m('inseto bípede de asas de élitros', 'a bipedal insectoid with wing-case elytra', ['bug']),
  m('arácnide de patas em lança e abdômen blindado', 'a spear-legged arachnid with an armored abdomen', ['bug']),
  m('gigante de membros grossos e cabeça pequena', 'a giant with thick limbs and a small head', []),
  m('flutuante com anéis e membros soltos', 'a floating body with detached drifting limbs and rings', []),
  m('tentacular de manto largo e braços em leque', 'a mantled tentacular body with fanned arms', ['aqua']),
  m('quadrúpede de juba longa e porte nobre', 'a noble long-maned quadruped', ['quad']),
  m('ave bípede de asas-capa e garras', 'a bipedal bird-form with cape-like wings and talons', ['bird']),
  m('anfíbio ereto de pele lisa e longas pernas', 'an upright amphibian with long legs and smooth skin', ['rept']),
  m('rastejante de múltiplos segmentos', 'a long multi-segmented crawler with many small legs', ['bug']),
  m('esfera central com membros em órbita', 'a central orb with limbs orbiting around it', []),
  m('bípede esguio de capa e cauda longa', 'a slender caped biped with a long tail', ['quad', 'rept']),
  m('vegetal em tronco com braços de galhos', 'a trunk-bodied plant form with branch arms', ['plant']),
  m('quadrúpede de dois chifres e couraça', 'a two-horned armored quadruped', ['quad']),
  m('dragoniforme de asas membranosas', 'a dragon-like body with membranous wings', ['rept', 'bird']),
  m('torso humanoide em base de cauda enrolada', 'a humanoid torso rising from a coiled tail', ['rept', 'aqua']),
];

export const MEGA_MORPHS_EXTRA: EvoShape[] = [
  m('colosso gigante de silhueta de montanha', 'a mountain-sized colossus with a towering silhouette', []),
  m('serpentiforme colossal de múltiplas cabeças', 'a colossal multi-headed serpentine body', ['rept']),
  m('alado colossal de asas que cobrem o céu', 'a colossal winged form whose wings darken the sky', ['bird']),
  m('quadrúpede titânico de passo que racha o chão', 'a titanic quadruped whose step cracks the ground', ['quad']),
  m('flutuante, corpo anelar com núcleo aceso', 'a floating ring-bodied form around a lit core', []),
  m('aquático leviatânico de nadadeiras-vela', 'a leviathan aquatic form with sail-like fins', ['aqua']),
  m('inseto soberano de quatro asas e coroa de antenas', 'a sovereign four-winged insectoid with an antenna crown', ['bug']),
  m('arácnide gigante de patas em arco', 'a giant arachnid with arching legs like a cathedral', ['bug']),
  m('multi-braços de seis braços e halo', 'a six-armed form with a halo behind its head', []),
  m('centauro colossal de armadura orgânica', 'a colossal centaur form in organic armor', ['quad']),
  m('tentacular de corpo estrelado e braços longos', 'a star-bodied tentacular form with trailing arms', ['aqua']),
  m('bípede heroico de cauda e capa gigantes', 'a heroic biped with a giant tail and cape', ['rept', 'quad']),
  m('ave soberana de plumas em leque', 'a sovereign bird form with a fan of plumes', ['bird']),
  m('vegetal gigante de copa que abriga um mundo', 'a giant plant form whose crown shelters a small world', ['plant']),
  m('dragoniforme de quatro asas e cauda de cometa', 'a four-winged dragon-like form with a comet tail', ['rept', 'bird']),
  m('bípede anfíbio de pescoço longo e coroa de nadadeiras', 'a long-necked amphibian biped with a fin crown', ['rept', 'aqua']),
  m('esfera-orbe com braços de fita', 'a great orb with ribbon-like arms', []),
  m('quimera de tronco felino e asas de ave', 'a chimera form with a feline body and bird wings', ['quad', 'bird']),
  m('rastejante gigante de corpo em onda', 'a giant crawler with a rippling wave-like body', ['bug', 'rept']),
  m('humanoide bestial de armadura e chifres', 'a beastly humanoid in horned armor', []),
];

// ---------------------------------------------------------------------------
// MOTIVOS: o "tema" visual ligado ao ELEMENTO (e a temas afins). Eixo
// separado da morfologia.
// ---------------------------------------------------------------------------
export type ThemeId = 'vileza' | 'morte' | 'vigor' | 'marcial' | 'arcano' | 'tempo' | 'espaco'
  | 'gravidade' | 'som' | 'eletricidade' | 'vida';

const t = (pt: string, en: string): LText => ({ pt, en });

export const ELEMENT_MOTIFS: Record<ElementId, LText[]> = {
  agua: [t('coral', 'coral growths'), t('bolhas flutuantes', 'floating bubbles'), t('escamas de maré', 'tide-pattern scales'), t('gelo cristalino', 'clear ice crystals'), t('conchas', 'shell plates'), t('ondas', 'wave-curl markings'), t('pérolas', 'pearl studs'), t('algas', 'trailing seaweed')],
  fogo: [t('magma', 'glowing magma seams'), t('brasas', 'floating embers'), t('cinzas', 'ash plumes'), t('chamas na cauda', 'a tail of flame'), t('carvão rachado', 'dark charcoal plating'), t('forja', 'forge-glow seams'), t('fumaça', 'curling smoke'), t('faíscas', 'spark trails')],
  terra: [t('cristais de pedra', 'rock crystal spikes'), t('argila rachada', 'smooth clay plates'), t('raízes', 'root tendrils'), t('minério', 'ore veins'), t('musgo de pedra', 'mossy stone armor'), t('areia', 'sand-swirl markings'), t('fósseis', 'fossil-bone patterns'), t('barro', 'mud-caked patches')],
  ar: [t('nuvens', 'cloud puffs'), t('penas de vento', 'wind-swept feathers'), t('fitas de brisa', 'ribbons of breeze'), t('redemoinhos', 'whirlwind spirals'), t('névoa', 'drifting mist'), t('asas de papel', 'paper-thin fins'), t('pólen', 'drifting pollen'), t('tempestade', 'storm-cloud mane')],
  sombra: [t('espectro', 'ghostly translucent wisps'), t('manchas luminosas', 'glowing spot patterns'), t('fumaça escura', 'dark smoke'), t('véu de breu', 'a pitch-black veil'), t('placa de casco', 'a crest plate'), t('cortina de sombra', 'a trailing shadow cloak'), t('lunar', 'crescent-moon marks'), t('fungo', 'glowing fungus caps')],
  luz: [t('auréola', 'a halo ring'), t('vitral', 'stained-glass panels'), t('prisma', 'prism facets'), t('raios', 'radiating light rays'), t('espelho', 'mirror-bright plates'), t('estrelas', 'star-dot patterns'), t('pétalas de luz', 'petals of light'), t('aurora', 'aurora ribbons')],
  planta: [t('planta carnívora', 'carnivorous plant jaws'), t('flores', 'blooming flowers'), t('cipós', 'curling vines'), t('folhas', 'layered leaf plating'), t('cogumelos', 'mushroom caps'), t('espinhos de rosa', 'rose-thorn spikes'), t('casca de árvore', 'bark armor'), t('sementes', 'seed-pod clusters')],
  industrial: [t('marionete', 'puppet-like jointed limbs'), t('engrenagens', 'visible gears'), t('ciborgue', 'cyborg plating and a mechanical limb'), t('relógio', 'a clockwork dial'), t('canos a vapor', 'steam pipes'), t('rebites', 'riveted metal plates'), t('antena', 'antenna and circuit lines'), t('mola', 'coil-spring joints')],
};

export const THEME_MOTIFS: Record<ThemeId, { elements: ElementId[]; motifs: LText[] }> = {
  vileza: { elements: ['sombra', 'fogo'], motifs: [t('espinhos de traição', 'treacherous barbs'), t('placas de vigília', 'watchful ridge plates'), t('veneno', 'dripping venom'), t('correntes soltas', 'loose hanging chains'), t('couraça hostil', 'hard hostile plating')] },
  morte: { elements: ['sombra', 'terra'], motifs: [t('ossos', 'exposed bone plates'), t('caveira', 'a skull motif'), t('mortalha', 'a flowing shroud'), t('foice', 'scythe-shaped blades'), t('costelas expostas', 'exposed ribs')] },
  vigor: { elements: ['terra', 'fogo', 'planta'], motifs: [t('músculos salientes', 'bulging muscle'), t('veias brilhantes', 'glowing veins'), t('chifres grossos', 'thick horns'), t('couraça robusta', 'sturdy plating'), t('respiração vaporosa', 'steaming breath')] },
  marcial: { elements: ['fogo', 'terra', 'industrial'], motifs: [t('faixa de mestre', 'a master headband'), t('punhos enfaixados', 'wrapped fists'), t('armadura de samurai', 'samurai-style armor'), t('lâminas gêmeas', 'twin blades'), t('selo de dojo', 'a dojo seal')] },
  arcano: { elements: ['luz', 'sombra'], motifs: [t('runas', 'glowing runes'), t('círculo mágico', 'a magic circle'), t('cristal arcano', 'an arcane crystal'), t('grimório flutuante', 'a floating grimoire'), t('selo místico', 'a mystic seal')] },
  tempo: { elements: ['industrial', 'luz'], motifs: [t('ampulheta', 'an hourglass'), t('ponteiros de relógio', 'clock-hand blades'), t('areia do tempo', 'streaming sand'), t('anéis de eras', 'age-ring bands'), t('pêndulo', 'a swinging pendulum')] },
  espaco: { elements: ['luz', 'sombra', 'ar'], motifs: [t('portais', 'small portals'), t('constelações', 'constellation lines'), t('nebulosa', 'nebula swirls'), t('lua orbitando', 'a tiny orbiting moon'), t('fendas dimensionais', 'dimensional rifts')] },
  gravidade: { elements: ['terra', 'sombra'], motifs: [t('pedras flutuantes', 'floating stones'), t('anéis de massa', 'heavy orbit rings'), t('núcleo denso', 'a dense dark core'), t('corpo achatado', 'a pressed, compact frame'), t('detritos orbitando', 'orbiting debris')] },
  som: { elements: ['ar', 'industrial'], motifs: [t('sinos', 'bell-like growths'), t('alto-falantes', 'horn-shaped amplifiers'), t('ondas sonoras', 'sound-wave rings'), t('cordas de harpa', 'harp-string tendrils'), t('tambores', 'drum-shaped plates')] },
  eletricidade: { elements: ['ar', 'industrial'], motifs: [t('raios', 'lightning bolts'), t('bobinas', 'tesla coils'), t('centelhas', 'crackling sparks'), t('pelos eletrizados', 'static-raised fur'), t('arcos elétricos', 'electric arcs')] },
  vida: { elements: ['planta', 'luz', 'agua'], motifs: [t('coração luminoso', 'a glowing heart'), t('brotos', 'fresh sprouts'), t('seiva dourada', 'golden sap'), t('flor-semente', 'a seed flower'), t('veias de luz verde', 'soft green life-veins')] },
};
