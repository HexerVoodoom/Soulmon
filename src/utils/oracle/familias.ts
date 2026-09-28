/**
 * Dados das famílias visuais do Oráculo — SÓ dado, zero função.
 *
 * Por que este arquivo existe (Fase 2, PR 1): `CREATURE_FAMILIES` (72
 * famílias) e `MOTIVO_ELEMENTO_CLASSE` só são lidos na CRIAÇÃO da criatura,
 * mas moravam em `oracle.ts`, que o `App.tsx` importa estaticamente — o que
 * os prendia no chunk de entrada (+15 KB, `orcamentoDeBytes.contract.test.ts`).
 * `generateOracleAsync` carrega este módulo por `import()` dinâmico.
 * Nunca importe este arquivo estaticamente de código do chunk de entrada
 * (`oracleBundleSplit.contract.test.ts` cobra).
 */
import type { ElementId, LText, RealmId } from '../oracle';

// ---------------------------------------------------------------------------
// FAMÍLIAS — taxonomia grande (família → subfamílias). 2 slots por criatura:
// o 1º é dominante; o 2º tem impacto menor e quase sempre repete a mesma
// família (mono). Raramente uma 2ª família distinta e, mais raro ainda, um
// OBJETO (pool especial, SÓ no 2º slot). Cada subfamília tem um substantivo
// concreto (`noun`) usado no conceito. Afinidade por elemento/reino orienta
// o sorteio. Pool o maior possível.
// ---------------------------------------------------------------------------

export interface Subfamily { pt: string; en: string; noun: LText }
export interface CreatureFamily {
  id: string;
  name: LText;
  elements: ElementId[];
  realms: RealmId[];
  subs: Subfamily[];
}
const sf = (pt: string, en: string, nounPt: string, nounEn: string): Subfamily =>
  ({ pt, en, noun: { pt: nounPt, en: nounEn } });

export const CREATURE_FAMILIES: CreatureFamily[] = [
  // ---- Animais ----
  { id: 'dinosaur', name: { pt: 'Dinossauro', en: 'Dinosaur' }, elements: ['terra', 'fogo'], realms: ['deserto', 'floresta', 'cavernas'], subs: [
    sf('ceratopsídeo', 'ceratopsian', 'triceratops', 'triceratops'),
    sf('terópode', 'theropod', 'tiranossauro', 'tyrannosaur'),
    sf('saurópode', 'sauropod', 'braquiossauro', 'brachiosaur'),
    sf('estegossauro', 'stegosaur', 'estegossauro', 'stegosaurus'),
    sf('anquilossauro', 'ankylosaur', 'anquilossauro', 'ankylosaur'),
    sf('pterossauro', 'pterosaur', 'pteranodonte', 'pteranodon'),
  ]},
  { id: 'raptor', name: { pt: 'Ave de Rapina', en: 'Bird of Prey' }, elements: ['ar', 'luz'], realms: ['picos', 'campina', 'deserto'], subs: [
    sf('águia', "eagle", 'águia', "eagle"),
    sf('falcão', "falcon", 'falcão', "falcon"),
    sf('gavião', "hawk", 'gavião', "hawk"),
    sf('harpia', "harpy eagle", 'harpia', "harpy eagle"),
  ]},
  { id: 'corvid', name: { pt: 'Corvídeo', en: 'Corvid' }, elements: ['sombra', 'ar'], realms: ['floresta', 'picos', 'campina'], subs: [
    sf('corvo', "raven", 'corvo', "raven"),
    sf('gralha', "crow", 'gralha', "crow"),
    sf('pega', "magpie", 'pega', "magpie"),
  ]},
  { id: 'owl', name: { pt: 'Coruja', en: 'Owl' }, elements: ['sombra', 'ar'], realms: ['floresta', 'gelo'], subs: [
    sf('coruja', "owl", 'coruja', "owl"),
    sf('corujão', "great horned owl", 'corujão', "great horned owl"),
    sf('coruja-das-neves', "snowy owl", 'coruja-das-neves', "snowy owl"),
    sf('suindara', "barn owl", 'suindara', "barn owl"),
  ]},
  { id: 'songbird', name: { pt: 'Ave Canora', en: 'Songbird' }, elements: ['ar', 'luz', 'planta'], realms: ['floresta', 'campina'], subs: [
    sf('pardal', "sparrow", 'pardal', "sparrow"),
    sf('beija-flor', "hummingbird", 'beija-flor', "hummingbird"),
    sf('canário', "canary", 'canário', "canary"),
    sf('sabiá', "thrush", 'sabiá', "thrush"),
  ]},
  { id: 'waterfowl', name: { pt: 'Ave Aquática', en: 'Waterfowl' }, elements: ['agua', 'ar'], realms: ['pantano', 'campina'], subs: [
    sf('cisne', "swan", 'cisne', "swan"),
    sf('pato', "duck", 'pato', "duck"),
    sf('garça', "heron", 'garça', "heron"),
    sf('flamingo', "flamingo", 'flamingo', "flamingo"),
  ]},
  { id: 'seabird', name: { pt: 'Ave Marinha', en: 'Seabird' }, elements: ['agua', 'ar'], realms: ['oceano', 'gelo'], subs: [
    sf('pinguim', "penguin", 'pinguim', "penguin"),
    sf('albatroz', "albatross", 'albatroz', "albatross"),
    sf('papagaio-do-mar', "puffin", 'papagaio-do-mar', "puffin"),
    sf('gaivota', "gull", 'gaivota', "gull"),
  ]},
  { id: 'ornamentalbird', name: { pt: 'Ave Ornamental', en: 'Ornamental Bird' }, elements: ['luz', 'planta', 'fogo'], realms: ['floresta', 'campina'], subs: [
    sf('pavão', "peacock", 'pavão', "peacock"),
    sf('faisão', "pheasant", 'faisão', "pheasant"),
    sf('ave-do-paraíso', "bird-of-paradise", 'ave-do-paraíso', "bird-of-paradise"),
    sf('arara', "macaw", 'arara', "macaw"),
  ]},
  { id: 'ratite', name: { pt: 'Ratita', en: 'Ratite' }, elements: ['terra', 'ar'], realms: ['deserto', 'campina'], subs: [
    sf('avestruz', "ostrich", 'avestruz', "ostrich"),
    sf('ema', "rhea", 'ema', "rhea"),
    sf('casuar', "cassowary", 'casuar', "cassowary"),
  ]},
  { id: 'reptile', name: { pt: 'Réptil', en: 'Reptile' }, elements: ['terra', 'sombra'], realms: ['deserto', 'pantano', 'cavernas'], subs: [
    sf('serpente', 'serpent', 'cobra', 'cobra'),
    sf('lagarto', 'lizard', 'lagarto', 'lizard'),
    sf('crocodiliano', 'crocodilian', 'crocodilo', 'crocodile'),
    sf('quelônio', 'chelonian', 'tartaruga', 'tortoise'),
    sf('camaleão', 'chameleon', 'camaleão', 'chameleon'),
    sf('varano', 'monitor', 'dragão-de-komodo', 'komodo dragon'),
  ]},
  { id: 'feline', name: { pt: 'Felino', en: 'Feline' }, elements: ['fogo', 'sombra'], realms: ['floresta', 'campina', 'deserto'], subs: [
    sf('grande felino', 'big cat', 'leão', 'lion'),
    sf('tigre', 'tiger', 'tigre', 'tiger'),
    sf('pantera', 'panther', 'pantera', 'panther'),
    sf('lince', 'lynx', 'lince', 'lynx'),
    sf('felino doméstico', 'domestic cat', 'gato', 'housecat'),
    sf('guepardo', 'cheetah', 'guepardo', 'cheetah'),
  ]},
  { id: 'canine', name: { pt: 'Canino', en: 'Canine' }, elements: ['sombra', 'luz'], realms: ['floresta', 'gelo', 'campina'], subs: [
    sf('lobo', 'wolf', 'lobo', 'wolf'),
    sf('raposa', 'fox', 'raposa', 'fox'),
    sf('cão', 'hound', 'cão', 'hound'),
    sf('chacal', 'jackal', 'chacal', 'jackal'),
    sf('licaão', 'wild dog', 'mabeco', 'painted dog'),
  ]},
  { id: 'ursine', name: { pt: 'Urso', en: 'Bear' }, elements: ['terra'], realms: ['floresta', 'gelo'], subs: [
    sf('urso pardo', 'brown bear', 'urso', 'bear'),
    sf('urso polar', 'polar bear', 'urso polar', 'polar bear'),
    sf('panda', 'panda', 'panda', 'panda'),
  ]},
  { id: 'rodent', name: { pt: 'Roedor', en: 'Rodent' }, elements: ['terra', 'planta'], realms: ['floresta', 'cavernas', 'campina'], subs: [
    sf('camundongo', 'mouse', 'rato', 'mouse'),
    sf('esquilo', 'squirrel', 'esquilo', 'squirrel'),
    sf('castor', 'beaver', 'castor', 'beaver'),
    sf('porco-espinho', 'porcupine', 'porco-espinho', 'porcupine'),
    sf('capivara', 'capybara', 'capivara', 'capybara'),
  ]},
  { id: 'beetle', name: { pt: 'Besouro', en: 'Beetle' }, elements: ['terra', 'industrial'], realms: ['floresta', 'deserto', 'campina'], subs: [
    sf('besouro-rinoceronte', "rhinoceros beetle", 'besouro-rinoceronte', "rhinoceros beetle"),
    sf('escaravelho', "scarab", 'escaravelho', "scarab"),
    sf('besouro-veado', "stag beetle", 'besouro-veado', "stag beetle"),
    sf('joaninha', "ladybug", 'joaninha', "ladybug"),
    sf('vaga-lume', "firefly", 'vaga-lume', "firefly"),
  ]},
  { id: 'butterfly', name: { pt: 'Borboleta', en: 'Butterfly' }, elements: ['ar', 'luz', 'planta'], realms: ['floresta', 'campina'], subs: [
    sf('borboleta-monarca', "monarch butterfly", 'borboleta-monarca', "monarch butterfly"),
    sf('mariposa-atlas', "atlas moth", 'mariposa-atlas', "atlas moth"),
    sf('mariposa-lua', "luna moth", 'mariposa-lua', "luna moth"),
    sf('borboleta-asa-de-vidro', "glasswing butterfly", 'borboleta-asa-de-vidro', "glasswing butterfly"),
  ]},
  { id: 'mantis', name: { pt: 'Louva-a-deus', en: 'Mantis' }, elements: ['planta', 'ar'], realms: ['floresta', 'campina'], subs: [
    sf('louva-a-deus-orquídea', "orchid mantis", 'louva-a-deus-orquídea', "orchid mantis"),
    sf('louva-a-deus-fantasma', "ghost mantis", 'louva-a-deus-fantasma', "ghost mantis"),
    sf('louva-a-deus-flor', "flower mantis", 'louva-a-deus-flor', "flower mantis"),
  ]},
  { id: 'hymenopteran', name: { pt: 'Abelha e Vespa', en: 'Bee & Wasp' }, elements: ['luz', 'industrial', 'fogo'], realms: ['campina', 'floresta', 'deserto'], subs: [
    sf('abelha', "bee", 'abelha', "bee"),
    sf('vespa', "wasp", 'vespa', "wasp"),
    sf('formiga', "ant", 'formiga', "ant"),
    sf('marimbondo', "hornet", 'marimbondo', "hornet"),
  ]},
  { id: 'dragonfly', name: { pt: 'Libélula', en: 'Dragonfly' }, elements: ['ar', 'agua'], realms: ['pantano', 'floresta'], subs: [
    sf('libélula', "dragonfly", 'libélula', "dragonfly"),
    sf('donzelinha', "damselfly", 'donzelinha', "damselfly"),
  ]},
  { id: 'orthopteran', name: { pt: 'Grilo e Cigarra', en: 'Cricket & Cicada' }, elements: ['ar', 'planta'], realms: ['campina', 'deserto'], subs: [
    sf('grilo', "cricket", 'grilo', "cricket"),
    sf('gafanhoto', "grasshopper", 'gafanhoto', "grasshopper"),
    sf('cigarra', "cicada", 'cigarra', "cicada"),
    sf('esperança', "katydid", 'esperança', "katydid"),
  ]},
  { id: 'myriapod', name: { pt: 'Centopeia', en: 'Myriapod' }, elements: ['sombra', 'terra'], realms: ['cavernas', 'floresta'], subs: [
    sf('centopeia', "centipede", 'centopeia', "centipede"),
    sf('lacraia', "giant centipede", 'lacraia', "giant centipede"),
    sf('piolho-de-cobra', "millipede", 'piolho-de-cobra', "millipede"),
  ]},
  { id: 'spider', name: { pt: 'Aranha', en: 'Spider' }, elements: ['sombra', 'terra'], realms: ['cavernas', 'floresta', 'deserto'], subs: [
    sf('aranha', "spider", 'aranha', "spider"),
    sf('tarântula', "tarantula", 'tarântula', "tarantula"),
    sf('aranha-saltadora', "jumping spider", 'aranha-saltadora', "jumping spider"),
    sf('viúva-negra', "black widow", 'viúva-negra', "black widow"),
  ]},
  { id: 'scorpion', name: { pt: 'Escorpião', en: 'Scorpion' }, elements: ['fogo', 'terra', 'sombra'], realms: ['deserto', 'cavernas'], subs: [
    sf('escorpião', "scorpion", 'escorpião', "scorpion"),
    sf('escorpião-imperador', "emperor scorpion", 'escorpião-imperador', "emperor scorpion"),
    sf('pseudoescorpião', "pseudoscorpion", 'pseudoescorpião', "pseudoscorpion"),
  ]},
  { id: 'crab', name: { pt: 'Caranguejo', en: 'Crab' }, elements: ['agua', 'terra'], realms: ['oceano', 'pantano'], subs: [
    sf('caranguejo', "crab", 'caranguejo', "crab"),
    sf('caranguejo-ermitão', "hermit crab", 'caranguejo-ermitão', "hermit crab"),
    sf('caranguejo-aranha-gigante', "giant spider crab", 'caranguejo-aranha-gigante', "giant spider crab"),
    sf('siri', "swimming crab", 'siri', "swimming crab"),
  ]},
  { id: 'lobster', name: { pt: 'Lagosta e Camarão', en: 'Lobster & Shrimp' }, elements: ['agua'], realms: ['oceano', 'pantano', 'gelo'], subs: [
    sf('lagosta', "lobster", 'lagosta', "lobster"),
    sf('camarão-boxeador', "mantis shrimp", 'camarão-boxeador', "mantis shrimp"),
    sf('lagostim', "crayfish", 'lagostim', "crayfish"),
  ]},
  { id: 'shark', name: { pt: 'Tubarão e Arraia', en: 'Shark & Ray' }, elements: ['agua', 'sombra'], realms: ['oceano'], subs: [
    sf('tubarão', "shark", 'tubarão', "shark"),
    sf('tubarão-martelo', "hammerhead", 'tubarão-martelo', "hammerhead"),
    sf('arraia', "ray", 'arraia', "ray"),
    sf('raia-manta', "manta ray", 'raia-manta', "manta ray"),
  ]},
  { id: 'deepsea', name: { pt: 'Peixe Abissal', en: 'Deep-sea Fish' }, elements: ['agua', 'sombra', 'luz'], realms: ['oceano', 'cavernas'], subs: [
    sf('peixe-lanterna', "anglerfish", 'peixe-lanterna', "anglerfish"),
    sf('peixe-víbora', "viperfish", 'peixe-víbora', "viperfish"),
    sf('peixe-remo', "oarfish", 'peixe-remo', "oarfish"),
  ]},
  { id: 'reeffish', name: { pt: 'Peixe de Recife', en: 'Reef Fish' }, elements: ['agua', 'luz', 'planta'], realms: ['oceano', 'pantano'], subs: [
    sf('carpa', "koi", 'carpa', "koi"),
    sf('peixe-palhaço', "clownfish", 'peixe-palhaço', "clownfish"),
    sf('baiacu', "pufferfish", 'baiacu', "pufferfish"),
    sf('peixe-leão', "lionfish", 'peixe-leão', "lionfish"),
    sf('betta', "betta", 'betta', "betta"),
  ]},
  { id: 'eel', name: { pt: 'Enguia', en: 'Eel' }, elements: ['agua', 'industrial'], realms: ['pantano', 'oceano', 'cavernas'], subs: [
    sf('enguia', "eel", 'enguia', "eel"),
    sf('moreia', "moray", 'moreia', "moray"),
    sf('poraquê', "electric eel", 'poraquê', "electric eel"),
  ]},
  { id: 'pelagicfish', name: { pt: 'Peixe de Mar Aberto', en: 'Pelagic Fish' }, elements: ['agua', 'ar'], realms: ['oceano', 'gelo'], subs: [
    sf('peixe-espada', "swordfish", 'peixe-espada', "swordfish"),
    sf('peixe-vela', "sailfish", 'peixe-vela', "sailfish"),
    sf('atum', "tuna", 'atum', "tuna"),
    sf('peixe-voador', "flying fish", 'peixe-voador', "flying fish"),
  ]},
  { id: 'cephalopod', name: { pt: 'Cefalópode', en: 'Cephalopod' }, elements: ['agua', 'sombra'], realms: ['oceano'], subs: [
    sf('polvo', 'octopus', 'polvo', 'octopus'),
    sf('lula', 'squid', 'lula', 'squid'),
    sf('náutilo', 'nautilus', 'náutilo', 'nautilus'),
  ]},
  { id: 'amphibian', name: { pt: 'Anfíbio', en: 'Amphibian' }, elements: ['agua', 'planta'], realms: ['pantano', 'floresta'], subs: [
    sf('sapo', 'frog', 'sapo', 'frog'),
    sf('salamandra', 'salamander', 'salamandra', 'salamander'),
    sf('axolote', 'axolotl', 'axolote', 'axolotl'),
  ]},
  { id: 'cetacean', name: { pt: 'Cetáceo', en: 'Cetacean' }, elements: ['agua'], realms: ['oceano', 'gelo'], subs: [
    sf('baleia', 'whale', 'baleia', 'whale'),
    sf('golfinho', 'dolphin', 'golfinho', 'dolphin'),
    sf('orca', 'orca', 'orca', 'orca'),
  ]},
  { id: 'equine', name: { pt: 'Equino', en: 'Equine' }, elements: ['ar', 'terra'], realms: ['campina', 'picos'], subs: [
    sf('cavalo', 'horse', 'cavalo', 'horse'),
    sf('zebra', 'zebra', 'zebra', 'zebra'),
  ]},
  { id: 'bovine', name: { pt: 'Bovino', en: 'Bovine' }, elements: ['terra', 'fogo'], realms: ['campina', 'picos'], subs: [
    sf('touro', 'bull', 'touro', 'bull'),
    sf('bisão', 'bison', 'bisão', 'bison'),
    sf('carneiro', 'ram', 'carneiro', 'ram'),
  ]},
  { id: 'deer', name: { pt: 'Cervídeo', en: 'Deer' }, elements: ['planta', 'luz'], realms: ['floresta', 'gelo', 'campina'], subs: [
    sf('veado', 'stag', 'veado', 'stag'),
    sf('alce', 'moose', 'alce', 'moose'),
    sf('rena', 'reindeer', 'rena', 'reindeer'),
  ]},
  { id: 'primate', name: { pt: 'Primata', en: 'Primate' }, elements: ['planta', 'terra'], realms: ['floresta'], subs: [
    sf('macaco', 'monkey', 'macaco', 'monkey'),
    sf('gorila', 'ape', 'gorila', 'gorilla'),
    sf('lêmure', 'lemur', 'lêmure', 'lemur'),
  ]},
  { id: 'mustelid', name: { pt: 'Mustelídeo', en: 'Mustelid' }, elements: ['agua', 'terra'], realms: ['floresta', 'oceano', 'cavernas'], subs: [
    sf('lontra', 'otter', 'lontra', 'otter'),
    sf('texugo', 'badger', 'texugo', 'badger'),
    sf('furão', 'ferret', 'furão', 'ferret'),
  ]},
  { id: 'proboscidean', name: { pt: 'Proboscídeo', en: 'Elephantine' }, elements: ['terra'], realms: ['campina', 'gelo', 'deserto'], subs: [
    sf('elefante', 'elephant', 'elefante', 'elephant'),
    sf('mamute', 'mammoth', 'mamute', 'mammoth'),
  ]},
  { id: 'chiroptera', name: { pt: 'Morcego', en: 'Bat' }, elements: ['sombra', 'ar'], realms: ['cavernas'], subs: [
    sf('morcego frugívoro', 'fruit bat', 'morcego', 'bat'),
    sf('morcego vampiro', 'vampire bat', 'morcego-vampiro', 'vampire bat'),
  ]},
  { id: 'worm', name: { pt: 'Verme', en: 'Worm' }, elements: ['terra', 'sombra'], realms: ['cavernas', 'pantano', 'deserto'], subs: [
    sf('minhoca', 'earthworm', 'minhoca', 'earthworm'),
    sf('sanguessuga', 'leech', 'sanguessuga', 'leech'),
    sf('verme-tubo', 'tube worm', 'verme-tubo', 'tube worm'),
    sf('poliqueta', 'bristle worm', 'poliqueta', 'bristle worm'),
  ]},
  { id: 'cnidarian', name: { pt: 'Cnidário', en: 'Cnidarian' }, elements: ['agua', 'luz'], realms: ['oceano'], subs: [
    sf('água-viva', 'jellyfish', 'água-viva', 'jellyfish'),
    sf('anêmona', 'sea anemone', 'anêmona', 'sea anemone'),
    sf('coral', 'coral', 'coral', 'coral'),
    sf('caravela', "man-o'-war", 'caravela', "man-o'-war"),
  ]},
  // ---- Plantas ----
  { id: 'flower', name: { pt: 'Flor', en: 'Flower' }, elements: ['planta', 'luz'], realms: ['campina', 'floresta', 'akasha'], subs: [
    sf('rosa', 'rose', 'rosa', 'rose'),
    sf('girassol', 'sunflower', 'girassol', 'sunflower'),
    sf('orquídea', 'orchid', 'orquídea', 'orchid'),
    sf('lótus', 'lotus', 'lótus', 'lotus'),
  ]},
  { id: 'tree', name: { pt: 'Árvore', en: 'Tree' }, elements: ['planta', 'terra'], realms: ['floresta', 'campina'], subs: [
    sf('carvalho', 'oak', 'carvalho', 'oak'),
    sf('salgueiro', 'willow', 'salgueiro', 'willow'),
    sf('pinheiro', 'pine', 'pinheiro', 'pine'),
    sf('bonsai', 'bonsai', 'bonsai', 'bonsai'),
  ]},
  { id: 'fungus', name: { pt: 'Fungo', en: 'Fungus' }, elements: ['planta', 'sombra'], realms: ['pantano', 'floresta', 'cavernas'], subs: [
    sf('cogumelo', 'mushroom', 'cogumelo', 'mushroom'),
    sf('chapéu-de-sapo', 'toadstool', 'chapéu-de-sapo', 'toadstool'),
    sf('mofo luminoso', 'glowcap', 'cogumelo luminoso', 'glowcap mushroom'),
  ]},
  { id: 'carniplant', name: { pt: 'Planta Carnívora', en: 'Carnivorous Plant' }, elements: ['planta'], realms: ['pantano', 'floresta'], subs: [
    sf('dioneia', 'venus flytrap', 'dioneia', 'venus flytrap'),
    sf('planta-jarro', 'pitcher plant', 'planta-jarro', 'pitcher plant'),
  ]},
  { id: 'desertplant', name: { pt: 'Planta do Deserto', en: 'Desert Plant' }, elements: ['planta', 'terra'], realms: ['deserto'], subs: [
    sf('cacto', 'cactus', 'cacto', 'cactus'),
    sf('suculenta', 'succulent', 'suculenta', 'succulent'),
  ]},
  { id: 'vine', name: { pt: 'Trepadeira', en: 'Vine' }, elements: ['planta'], realms: ['floresta', 'pantano'], subs: [
    sf('hera', 'ivy', 'hera', 'ivy'),
    sf('mandrágora', 'mandrake', 'mandrágora', 'mandrake'),
  ]},
  { id: 'fruitgourd', name: { pt: 'Fruto', en: 'Fruit' }, elements: ['planta', 'luz'], realms: ['campina', 'floresta'], subs: [
    sf('abóbora', 'pumpkin', 'abóbora', 'pumpkin'),
    sf('pêssego', 'peach', 'pêssego', 'peach'),
  ]},
  // ---- Míticos ----
  { id: 'dragon', name: { pt: 'Dragão', en: 'Dragon' }, elements: ['fogo', 'ar', 'sombra'], realms: ['picos', 'cavernas', 'akasha'], subs: [
    sf('dragão ocidental', 'western dragon', 'dragão', 'dragon'),
    sf('dragão oriental', 'eastern dragon', 'dragão-serpente', 'lung dragon'),
    sf('wyvern', 'wyvern', 'wyvern', 'wyvern'),
    sf('hidra', 'hydra', 'hidra', 'hydra'),
    sf('draconete', 'drake', 'draconete', 'drake'),
  ]},
  { id: 'fae', name: { pt: 'Feérico', en: 'Fae' }, elements: ['luz', 'planta', 'ar'], realms: ['akasha', 'campina', 'floresta'], subs: [
    sf('fada', 'fairy', 'fada', 'fairy'),
    sf('pixie', 'pixie', 'pixie', 'pixie'),
    sf('silfo', 'sylph', 'silfo', 'sylph'),
  ]},
  { id: 'zombie', name: { pt: 'Zumbi', en: 'Zombie' }, elements: ['sombra', 'terra'], realms: ['pantano', 'deserto', 'cavernas'], subs: [
    sf('zumbi', "zombie", 'zumbi', "zombie"),
    sf('carniçal', "ghoul", 'carniçal', "ghoul"),
    sf('múmia', "mummy", 'múmia', "mummy"),
  ]},
  { id: 'skeleton', name: { pt: 'Esqueleto', en: 'Skeleton' }, elements: ['sombra', 'terra'], realms: ['cavernas', 'deserto', 'gelo'], subs: [
    sf('esqueleto', "skeleton", 'esqueleto', "skeleton"),
    sf('cavaleiro-esqueleto', "skeleton knight", 'cavaleiro-esqueleto', "skeleton knight"),
    sf('lich', "lich", 'lich', "lich"),
  ]},
  { id: 'ghost', name: { pt: 'Fantasma', en: 'Ghost' }, elements: ['sombra', 'ar', 'luz'], realms: ['akasha', 'pantano', 'gelo'], subs: [
    sf('fantasma', "ghost", 'fantasma', "ghost"),
    sf('espectro', "wraith", 'espectro', "wraith"),
    sf('banshee', "banshee", 'banshee', "banshee"),
    sf('fogo-fátuo', "will-o-wisp", 'fogo-fátuo', "will-o-wisp"),
  ]},
  { id: 'vampire', name: { pt: 'Vampiro', en: 'Vampire' }, elements: ['sombra', 'fogo'], realms: ['cavernas', 'floresta'], subs: [
    sf('vampiro', "vampire", 'vampiro', "vampire"),
    sf('nosferatu', "nosferatu", 'nosferatu', "nosferatu"),
  ]},
  { id: 'fiend', name: { pt: 'Demônio', en: 'Fiend' }, elements: ['fogo', 'sombra'], realms: ['cavernas', 'akasha', 'deserto'], subs: [
    sf('diabrete', 'imp', 'diabrete', 'imp'),
    sf('demônio', 'demon', 'demônio', 'demon'),
    sf('íncubo', 'incubus', 'íncubo', 'incubus'),
    sf('súcubo', 'succubus', 'súcubo', 'succubus'),
    sf('cão infernal', 'hellhound', 'cão infernal', 'hellhound'),
    sf('arquidemônio', 'archfiend', 'arquidemônio', 'archfiend'),
  ]},
  { id: 'celestial', name: { pt: 'Celestial', en: 'Celestial' }, elements: ['luz', 'ar'], realms: ['akasha', 'picos'], subs: [
    sf('anjo', 'angel', 'anjo', 'angel'),
    sf('serafim', 'seraph', 'serafim', 'seraph'),
    sf('querubim', 'cherub', 'querubim', 'cherub'),
  ]},
  { id: 'chimeric', name: { pt: 'Quimérico', en: 'Chimeric' }, elements: ['fogo', 'terra', 'ar'], realms: ['akasha', 'deserto', 'picos'], subs: [
    sf('quimera', 'chimera', 'quimera', 'chimera'),
    sf('grifo', 'griffin', 'grifo', 'griffin'),
    sf('mantícora', 'manticore', 'mantícora', 'manticore'),
    sf('esfinge', 'sphinx', 'esfinge', 'sphinx'),
  ]},
  { id: 'aquamyth', name: { pt: 'Mito Aquático', en: 'Aquatic Myth' }, elements: ['agua', 'sombra'], realms: ['oceano', 'pantano', 'akasha'], subs: [
    sf('sereia', 'mermaid', 'sereia', 'mermaid'),
    sf('serpente marinha', 'sea serpent', 'serpente marinha', 'sea serpent'),
    sf('kraken', 'kraken', 'kraken', 'kraken'),
    sf('leviatã', 'leviathan', 'leviatã', 'leviathan'),
  ]},
  { id: 'halfhuman', name: { pt: 'Meio-humano', en: 'Half-human' }, elements: ['terra', 'fogo', 'ar'], realms: ['floresta', 'campina', 'cavernas'], subs: [
    sf('centauro', 'centaur', 'centauro', 'centaur'),
    sf('sátiro', 'satyr', 'sátiro', 'satyr'),
    sf('minotauro', 'minotaur', 'minotauro', 'minotaur'),
    sf('harpia', 'harpy', 'harpia', 'harpy'),
    sf('naga', 'naga', 'naga', 'naga'),
    sf('lamia', 'lamia', 'lamia', 'lamia'),
  ]},
  { id: 'elemental', name: { pt: 'Elemental', en: 'Elemental' }, elements: ['fogo', 'agua', 'terra', 'ar'], realms: ['akasha', 'picos'], subs: [
    sf('elemental de fogo', "fire elemental", 'elemental de fogo', "fire elemental"),
    sf('elemental de água', "water elemental", 'elemental de água', "water elemental"),
    sf('elemental de terra', "earth elemental", 'elemental de terra', "earth elemental"),
    sf('elemental de ar', "air elemental", 'elemental de ar', "air elemental"),
    sf('fênix', "phoenix", 'fênix', "phoenix"),
  ]},
  { id: 'genie', name: { pt: 'Gênio', en: 'Genie' }, elements: ['fogo', 'ar', 'luz'], realms: ['deserto', 'akasha'], subs: [
    sf('gênio', "djinn", 'gênio', "djinn"),
    sf('ifrit', "ifrit", 'ifrit', "ifrit"),
    sf('marid', "marid", 'marid', "marid"),
  ]},
  { id: 'golem', name: { pt: 'Golem', en: 'Golem' }, elements: ['terra', 'industrial'], realms: ['cavernas', 'picos'], subs: [
    sf('golem de pedra', "stone golem", 'golem de pedra', "stone golem"),
    sf('golem de ferro', "iron golem", 'golem de ferro', "iron golem"),
    sf('golem de barro', "clay golem", 'golem de barro', "clay golem"),
  ]},
  { id: 'unicornkin', name: { pt: 'Equino Mítico', en: 'Mythic Steed' }, elements: ['luz', 'ar'], realms: ['akasha', 'campina', 'picos'], subs: [
    sf('unicórnio', 'unicorn', 'unicórnio', 'unicorn'),
    sf('pégaso', 'pegasus', 'pégaso', 'pegasus'),
    sf('quilin', 'kirin', 'quilin', 'kirin'),
  ]},
  { id: 'yokai', name: { pt: 'Yokai', en: 'Yokai' }, elements: ['sombra', 'fogo'], realms: ['akasha', 'floresta', 'pantano'], subs: [
    sf('kitsune', 'kitsune', 'raposa de nove caudas', 'nine-tailed fox'),
    sf('tengu', 'tengu', 'tengu', 'tengu'),
    sf('oni', 'oni', 'oni', 'oni'),
    sf('kappa', 'kappa', 'kappa', 'kappa'),
    sf('tanuki', 'tanuki', 'tanuki', 'tanuki'),
    sf('nekomata', 'nekomata', 'gato de duas caudas', 'two-tailed cat'),
    sf('jorogumo', 'jorogumo', 'aranha-tecelã', 'weaver spider'),
  ]},
  { id: 'giantkin', name: { pt: 'Gigante', en: 'Giantkin' }, elements: ['terra', 'fogo'], realms: ['picos', 'cavernas', 'gelo'], subs: [
    sf('troll', 'troll', 'troll', 'troll'),
    sf('ogro', 'ogre', 'ogro', 'ogre'),
    sf('ciclope', 'cyclops', 'ciclope', 'cyclops'),
    sf('golias', 'giant', 'gigante', 'giant'),
  ]},
  { id: 'goblinoid', name: { pt: 'Goblinoide', en: 'Goblinoid' }, elements: ['sombra', 'industrial'], realms: ['cavernas', 'pantano'], subs: [
    sf('goblin', 'goblin', 'goblin', 'goblin'),
    sf('kobold', 'kobold', 'kobold', 'kobold'),
    sf('gremlin', 'gremlin', 'gremlin', 'gremlin'),
  ]},
  { id: 'lycan', name: { pt: 'Licantropo', en: 'Lycanthrope' }, elements: ['sombra', 'terra'], realms: ['floresta', 'gelo', 'cavernas'], subs: [
    sf('lobisomem', 'werewolf', 'lobisomem', 'werewolf'),
    sf('urso-guerreiro', 'werebear', 'urso-licantropo', 'werebear'),
  ]},
  { id: 'slime', name: { pt: 'Gosma', en: 'Slime' }, elements: ['agua', 'planta', 'sombra'], realms: ['pantano', 'cavernas', 'akasha'], subs: [
    sf('slime', 'slime', 'slime', 'slime'),
    sf('gelatina', 'ooze', 'gosma', 'ooze'),
  ]},
  { id: 'construct', name: { pt: 'Autômato', en: 'Construct' }, elements: ['industrial'], realms: ['cavernas', 'picos', 'akasha'], subs: [
    sf('autômato', 'automaton', 'autômato', 'automaton'),
    sf('golem mecânico', 'mech golem', 'golem mecânico', 'mech golem'),
    sf('dínamo vivo', 'living dynamo', 'dínamo vivo', 'living dynamo'),
  ]},
  // Quatro famílias visuais novas (28/09/2026): o dono pediu vermes,
  // cnidários, extraplanetários e geológicos entre os grupos do bestiário, e
  // nenhuma das 44 famílias do Oráculo desenhava algo assim.
  { id: 'extraterrestrial', name: { pt: 'Extraplanetário', en: 'Otherworldly' }, elements: ['luz', 'ar', 'industrial'], realms: ['akasha'], subs: [
    sf('viajante estelar', 'star wanderer', 'viajante estelar', 'star wanderer'),
    sf('semente de cometa', 'comet seed', 'semente de cometa', 'comet seed'),
    sf('medusa do vácuo', 'void jellyfish', 'medusa do vácuo', 'void jellyfish'),
  ]},
  { id: 'geological', name: { pt: 'Geológico', en: 'Mineral' }, elements: ['terra', 'fogo'], realms: ['cavernas', 'picos', 'deserto'], subs: [
    sf('geodo', 'geode', 'geodo', 'geode'),
    sf('golem de cristal', 'crystal golem', 'golem de cristal', 'crystal golem'),
    sf('rocha vulcânica', 'lava rock', 'rocha vulcânica', 'lava rock'),
    sf('estalagmite', 'stalagmite', 'estalagmite', 'stalagmite'),
  ]},
];

/**
 * Os 11 elementos que SÓ existem no class-system (os outros 6 têm par direto
 * nos 8 do Oráculo) ganham voz na APARÊNCIA. ⚠️ 28/09/2026, pergunta do dono:
 * "por que usa só o elemento ao invés de todos disponíveis em
 * class-system/bestiário?". Até aqui paleta, textura e família visual liam só
 * os 8, e tempo/som/gravidade/vida/morte… decidiam a ficha mas nunca eram
 * VISTOS. O mais forte dos 11 na leitura vira um motivo no sprite e puxa
 * famílias visuais afins (sem excluir as do elemento de 8).
 */
export const MOTIVO_ELEMENTO_CLASSE: Record<string, { en: string; pt: string; familias: string[] }> = {
  eletricidade: { en: 'crackling spark markings', pt: 'marcas de faísca', familias: ['eel', 'construct', 'raptor'] },
  arcano: { en: 'glowing rune markings', pt: 'runas brilhantes', familias: ['fae', 'genie', 'owl', 'cephalopod'] },
  vileza: { en: 'venomous barbs', pt: 'farpas venenosas', familias: ['scorpion', 'spider', 'reptile', 'carniplant'] },
  morte: { en: 'bone-white skull motifs', pt: 'motivos de osso', familias: ['skeleton', 'ghost', 'zombie', 'corvid'] },
  vida: { en: 'sprouting leaf buds', pt: 'brotos de folha', familias: ['flower', 'tree', 'deer', 'fungus'] },
  vigor: { en: 'thick muscular build', pt: 'corpo robusto', familias: ['ursine', 'bovine', 'proboscidean', 'giantkin'] },
  marcial: { en: 'battle-worn armor plates', pt: 'placas de armadura', familias: ['beetle', 'crab', 'feline', 'mantis'] },
  tempo: { en: 'hourglass and clockwork motifs', pt: 'motivos de ampulheta', familias: ['cephalopod', 'reptile', 'tree', 'construct'] },
  som: { en: 'sound-wave ripple markings', pt: 'marcas de onda sonora', familias: ['songbird', 'orthopteran', 'cetacean', 'chiroptera'] },
  gravidade: { en: 'orbiting pebble satellites', pt: 'pedrinhas em órbita', familias: ['geological', 'golem', 'proboscidean', 'deepsea'] },
  espaco: { en: 'starfield speckles', pt: 'pintas de céu estrelado', familias: ['extraterrestrial', 'cnidarian', 'celestial', 'seabird'] },
};
