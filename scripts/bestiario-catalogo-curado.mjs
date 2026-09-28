// Catálogo curado de criaturas-inspiração para o bestiário do oráculo.
// Grupos biológicos = espécies reais; grupos fantásticos = conceitos genéricos
// ou folclore/mitologia de domínio público. Descrições são texto original.

export const GRUPOS = {
  fungo: { rotulo: 'Fungos', biologia: ['Fungo'] },
  planta: { rotulo: 'Plantas', biologia: ['Planta'] },
  peixe: { rotulo: 'Peixes', biologia: ['Peixe'] },
  inseto: { rotulo: 'Insetos', biologia: ['Inseto/Aracnídeo'] },
  aracnideo: { rotulo: 'Aracnídeos', biologia: ['Inseto/Aracnídeo'] },
  anfibio: { rotulo: 'Anfíbios', biologia: ['Anfíbio'] },
  reptil: { rotulo: 'Répteis', biologia: ['Réptil'] },
  ave: { rotulo: 'Aves', biologia: ['Ave'] },
  mamifero: { rotulo: 'Mamíferos', biologia: ['Mamífero'] },
  cnidario: { rotulo: 'Cnidários', biologia: ['Invertebrado'] },
  verme: { rotulo: 'Vermes', biologia: ['Invertebrado'] },
  molusco: { rotulo: 'Moluscos', biologia: ['Molusco'] },
  crustaceo: { rotulo: 'Crustáceos', biologia: ['Invertebrado'] },
  monstro: { rotulo: 'Monstros', biologia: [] },
  humanoide: { rotulo: 'Humanoides', biologia: ['Humanoide'] },
  construto: { rotulo: 'Construtos', biologia: [] },
  etereo: { rotulo: 'Etéreos', biologia: [] },
  morto_vivo: { rotulo: 'Mortos-vivos', biologia: [] },
  extraplanetario: { rotulo: 'Extraplanetários', biologia: [] },
  geologico: { rotulo: 'Geológicos', biologia: [] },
  elemental: { rotulo: 'Elementais', biologia: [] },
  demonio: { rotulo: 'Demônios', biologia: [] },
  angelical: { rotulo: 'Angelicais', biologia: [] },
};

const c = (nome, grupo, elementos, bioma, tamanho, hostilidade, [forca, inteligencia, velocidade, magia], descricao) => ({
  nome, grupo, biologia: [...GRUPOS[grupo].biologia], elementos, bioma, tamanho, hostilidade,
  atributos: { forca, inteligencia, velocidade, magia }, descricao,
});

export const CATALOGO = [
  // fungo
  c('Cogumelo-fantasma (Omphalotus nidiformis)', 'fungo', ['luz', 'vida'], ['Floresta'], 'Miudo', 2, [1, 2, 1, 5], 'O cogumelo-fantasma brilha em verde pálido no escuro graças à bioluminescência. Cresce em troncos mortos de florestas australianas.'),
  c('Fungo-zumbi (Ophiocordyceps unilateralis)', 'fungo', ['vileza', 'morte'], ['Selva'], 'Miudo', 7, [1, 4, 1, 6], 'O fungo-zumbi invade formigas e as conduz a um ponto alto antes de brotar da cabeça delas. Libera esporos sobre a colônia abaixo.'),
  c('Armilária-gigante (Armillaria ostoyae)', 'fungo', ['terra', 'vida', 'tempo'], ['Floresta', 'Subsolo'], 'Colossal', 3, [6, 2, 1, 5], 'A armilária forma uma rede subterrânea que ocupa quilômetros e pode ter milhares de anos. É um dos maiores organismos vivos conhecidos.'),
  c('Estrela-da-terra (Geastrum saccatum)', 'fungo', ['terra', 'ar'], ['Bosque'], 'Miudo', 1, [1, 1, 1, 3], 'A estrela-da-terra abre sua casca externa em pontas, formando uma estrela no chão. Solta nuvens de esporos quando gotas de chuva a atingem.'),
  c('Mofo-limoso (Physarum polycephalum)', 'fungo', ['vida', 'arcano'], ['Floresta', 'Caverna'], 'Pequeno', 2, [1, 5, 2, 4], 'O mofo-limoso amarelo rasteja em busca de alimento e encontra caminhos curtos em labirintos. Não tem cérebro, mas resolve problemas espaciais.'),
  c('Dedo-do-morto (Xylaria polymorpha)', 'fungo', ['morte', 'sombra'], ['Bosque'], 'Miudo', 2, [1, 1, 1, 4], 'O dedo-do-morto brota em tocos apodrecidos como dedos escuros saindo da terra. Decompõe madeira dura lentamente.'),
  c('Cogumelo-véu (Phallus indusiatus)', 'fungo', ['vida', 'tempo'], ['Selva'], 'Miudo', 1, [1, 1, 2, 4], 'O cogumelo-véu estende uma saia rendada em poucas horas e atrai insetos com odor forte. Some quase tão rápido quanto surge.'),

  // planta
  c('Dioneia (Dionaea muscipula)', 'planta', ['vileza', 'eletricidade'], ['Pântano'], 'Miudo', 5, [2, 3, 8, 2], 'A dioneia fecha suas folhas em armadilha quando pelos sensíveis são tocados duas vezes. Um sinal elétrico dispara o fechamento em fração de segundo.'),
  c('Sequoia-gigante (Sequoiadendron giganteum)', 'planta', ['terra', 'tempo', 'vigor'], ['Montanha', 'Floresta'], 'Colossal', 1, [9, 2, 1, 5], 'A sequoia-gigante vive milhares de anos e resiste a incêndios com casca grossa. Suas pinhas dependem do calor do fogo para liberar sementes.'),
  c('Nepentes (Nepenthes rajah)', 'planta', ['agua', 'vileza'], ['Montanha', 'Selva'], 'Pequeno', 4, [1, 2, 1, 3], 'A nepentes forma jarros cheios de líquido digestivo onde pequenos animais escorregam. Algumas espécies servem de sanitário para musaranhos.'),
  c('Mimosa-sensitiva (Mimosa pudica)', 'planta', ['vida', 'som'], ['Campo'], 'Miudo', 1, [1, 2, 6, 3], 'A mimosa-sensitiva dobra seus folíolos ao menor toque ou vibração. Reabre minutos depois, quando o perigo passa.'),
  c('Cacto-saguaro (Carnegiea gigantea)', 'planta', ['fogo', 'vigor', 'tempo'], ['Deserto'], 'Grande', 2, [5, 1, 1, 2], 'O cacto-saguaro armazena toneladas de água no tronco sanfonado. Leva décadas para formar seu primeiro braço.'),
  c('Árvore-de-lótus-sagrado (Nelumbo nucifera)', 'planta', ['luz', 'agua', 'vida'], ['Pântano', 'Brejo'], 'Pequeno', 1, [1, 3, 1, 7], 'O lótus-sagrado ergue flores limpas acima da lama e aquece a própria corola. Suas sementes germinam após séculos.'),
  c('Rafflesia (Rafflesia arnoldii)', 'planta', ['vileza', 'morte'], ['Selva'], 'Medio', 2, [1, 1, 1, 5], 'A rafflesia produz a maior flor isolada do mundo e cheira a carne podre. Vive parasitando cipós sem folhas próprias.'),

  // peixe
  c('Peixe-pescador-abissal (Melanocetus johnsonii)', 'peixe', ['sombra', 'luz', 'agua'], ['Oceano'], 'Pequeno', 6, [3, 3, 3, 4], 'O peixe-pescador-abissal atrai presas com uma isca luminosa na testa. Vive na escuridão total do oceano profundo.'),
  c('Poraquê (Electrophorus electricus)', 'peixe', ['eletricidade', 'agua'], ['Pântano', 'Aquático'], 'Grande', 7, [6, 3, 5, 6], 'O poraquê gera descargas elétricas de centenas de volts para atordoar presas. Respira ar e sobe à superfície com frequência.'),
  c('Peixe-leão (Pterois volitans)', 'peixe', ['vileza', 'agua'], ['Mar', 'Costa'], 'Pequeno', 6, [2, 3, 4, 3], 'O peixe-leão exibe nadadeiras listradas cheias de espinhos venenosos. Encurrala presas abrindo as nadadeiras como leque.'),
  c('Celacanto (Latimeria chalumnae)', 'peixe', ['tempo', 'agua'], ['Oceano', 'Caverna'], 'Grande', 2, [5, 3, 3, 5], 'O celacanto pertence a uma linhagem antiquíssima que se julgava extinta. Descansa em grutas submarinas durante o dia.'),
  c('Peixe-voador (Exocoetus volitans)', 'peixe', ['ar', 'agua'], ['Oceano'], 'Miudo', 1, [1, 2, 9, 2], 'O peixe-voador salta da água e plana dezenas de metros com nadadeiras largas. Foge assim de predadores marinhos.'),
  c('Peixe-remo (Regalecus glesne)', 'peixe', ['agua', 'espaco'], ['Oceano'], 'Enorme', 2, [4, 2, 3, 5], 'O peixe-remo é o peixe ósseo mais longo e nada na vertical em águas profundas. Sua crista vermelha ondula como fita.'),
  c('Baiacu (Tetraodon mbu)', 'peixe', ['vileza', 'vigor'], ['Aquático'], 'Pequeno', 4, [2, 3, 2, 3], 'O baiacu infla o corpo com água quando ameaçado e guarda toxina potente nos órgãos. Dentes fortes quebram conchas.'),

  // inseto
  c('Besouro-bombardeiro (Brachinus crepitans)', 'inseto', ['fogo', 'vileza'], ['Campo'], 'Miudo', 5, [2, 2, 4, 3], 'O besouro-bombardeiro dispara um jato químico fervente pelo abdômen. A reação estala como pequena explosão.'),
  c('Louva-a-deus-orquídea (Hymenopus coronatus)', 'inseto', ['marcial', 'vida'], ['Selva'], 'Miudo', 6, [3, 4, 7, 2], 'O louva-a-deus-orquídea imita pétalas rosadas para emboscar polinizadores. Ataca com patas dianteiras velozes.'),
  c('Vaga-lume (Lampyris noctiluca)', 'inseto', ['luz', 'ar'], ['Bosque', 'Campo'], 'Miudo', 1, [1, 2, 4, 5], 'O vaga-lume produz luz fria no abdômen para se comunicar à noite. Cada espécie pisca num ritmo próprio.'),
  c('Cigarra-periódica (Magicicada septendecim)', 'inseto', ['som', 'tempo'], ['Floresta'], 'Miudo', 1, [1, 2, 3, 3], 'A cigarra-periódica passa dezessete anos enterrada e emerge em massa num único verão. O canto coletivo ensurdece florestas inteiras.'),
  c('Vespa-gigante-asiática (Vespa mandarinia)', 'inseto', ['vileza', 'marcial'], ['Montanha', 'Floresta'], 'Miudo', 9, [4, 3, 7, 1], 'A vespa-gigante-asiática saqueia colmeias inteiras em grupos organizados. Sua ferroada injeta veneno doloroso.'),
  c('Formiga-de-fogo (Solenopsis invicta)', 'inseto', ['fogo', 'marcial'], ['Campo'], 'Miudo', 7, [2, 3, 5, 1], 'A formiga-de-fogo forma balsas vivas durante enchentes. Sua picada queima como brasa.'),
  c('Esperança-folha (Phyllium giganteum)', 'inseto', ['vida', 'sombra'], ['Selva'], 'Miudo', 1, [1, 2, 2, 3], 'A esperança-folha imita uma folha verde até nas nervuras e manchas. Balança o corpo como se o vento a movesse.'),

  // aracnideo
  c('Escorpião-imperador (Pandinus imperator)', 'aracnideo', ['marcial', 'luz'], ['Selva'], 'Pequeno', 5, [5, 2, 3, 2], 'O escorpião-imperador brilha azul-esverdeado sob luz ultravioleta. Usa as pinças fortes mais do que o ferrão.'),
  c('Aranha-pavão (Maratus volans)', 'aracnideo', ['luz', 'som'], ['Campo'], 'Miudo', 2, [1, 4, 6, 3], 'A aranha-pavão macho ergue um leque colorido e dança para a fêmea. Vibra o abdômen em ritmo marcado.'),
  c('Opilião (Leiobunum rotundum)', 'aracnideo', ['sombra', 'terra'], ['Bosque', 'Caverna'], 'Miudo', 1, [1, 2, 4, 1], 'O opilião caminha sobre pernas finíssimas e não produz seda. Pode soltar uma perna para escapar de predadores.'),
  c('Aranha-sino-de-mergulho (Argyroneta aquatica)', 'aracnideo', ['agua', 'ar'], ['Brejo'], 'Miudo', 3, [1, 4, 3, 4], 'A aranha-sino-de-mergulho vive submersa dentro de uma bolha de ar presa em teia. Renova o ar trazendo bolhas da superfície.'),
  c('Carrapato-estrela (Amblyomma cajennense)', 'aracnideo', ['vileza', 'vigor'], ['Campo', 'Pradaria'], 'Miudo', 6, [1, 1, 2, 2], 'O carrapato-estrela suga sangue por dias e aumenta muitas vezes de tamanho. Pode transmitir doenças graves.'),
  c('Solífugo (Galeodes arabs)', 'aracnideo', ['fogo', 'marcial'], ['Deserto'], 'Pequeno', 7, [4, 2, 8, 1], 'O solífugo corre pela areia do deserto e tritura presas com quelíceras enormes. Caça principalmente à noite.'),

  // anfibio
  c('Rã-dardo-dourada (Phyllobates terribilis)', 'anfibio', ['vileza', 'luz'], ['Selva'], 'Miudo', 3, [1, 2, 4, 5], 'A rã-dardo-dourada carrega na pele toxina suficiente para matar vários adultos. Sua cor viva avisa predadores.'),
  c('Salamandra-gigante-chinesa (Andrias davidianus)', 'anfibio', ['agua', 'tempo'], ['Montanha', 'Aquático'], 'Grande', 4, [5, 2, 2, 3], 'A salamandra-gigante-chinesa passa de um metro e vive em rios frios de montanha. Respira quase toda pela pele enrugada.'),
  c('Rã-de-vidro (Hyalinobatrachium valerioi)', 'anfibio', ['luz', 'agua'], ['Floresta'], 'Miudo', 1, [1, 2, 4, 4], 'A rã-de-vidro tem barriga transparente que revela órgãos e coração. Os machos vigiam os ovos em folhas sobre riachos.'),
  c('Cecília (Siphonops annulatus)', 'anfibio', ['terra', 'sombra'], ['Subterrâneo'], 'Pequeno', 2, [2, 2, 2, 2], 'A cecília é um anfíbio sem pernas que escava o solo como minhoca. Os filhotes se alimentam da pele da mãe.'),
  c('Sapo-cururu (Rhinella marina)', 'anfibio', ['vileza', 'vigor'], ['Pântano', 'Campo'], 'Pequeno', 3, [3, 2, 2, 2], 'O sapo-cururu secreta veneno leitoso pelas glândulas atrás dos olhos. Come quase tudo que cabe na boca.'),
  c('Rã-da-madeira (Lithobates sylvaticus)', 'anfibio', ['tempo', 'vida'], ['Gelo', 'Floresta'], 'Miudo', 1, [1, 2, 4, 5], 'A rã-da-madeira congela quase por completo no inverno e revive na primavera. O coração para e volta a bater.'),

  // reptil
  c('Dragão-de-komodo (Varanus komodoensis)', 'reptil', ['vileza', 'vigor'], ['Colina', 'Campo'], 'Grande', 8, [8, 3, 4, 2], 'O dragão-de-komodo é o maior lagarto vivo e derruba presas grandes com mordida e saliva tóxica. Fareja carcaças a quilômetros.'),
  c('Lagarto-basilisco (Basiliscus plumifrons)', 'reptil', ['agua', 'ar'], ['Selva'], 'Pequeno', 2, [2, 3, 9, 2], 'O lagarto-basilisco corre sobre a superfície da água nas patas traseiras. Tem crista verde na cabeça e dorso.'),
  c('Camaleão-pantera (Furcifer pardalis)', 'reptil', ['luz', 'arcano'], ['Floresta'], 'Pequeno', 2, [2, 4, 2, 5], 'O camaleão-pantera muda de cor conforme humor e temperatura. Sua língua dispara mais longa que o corpo.'),
  c('Tartaruga-gigante-de-galápagos (Chelonoidis niger)', 'reptil', ['tempo', 'terra', 'vigor'], ['Campo'], 'Grande', 1, [7, 3, 1, 3], 'A tartaruga-gigante-de-galápagos vive mais de cem anos. Carrega um casco enorme e passa horas se aquecendo ao sol.'),
  c('Naja-rei (Ophiophagus hannah)', 'reptil', ['vileza', 'marcial'], ['Floresta'], 'Grande', 8, [5, 5, 6, 3], 'A naja-rei é a serpente peçonhenta mais longa e caça outras cobras. Ergue um terço do corpo quando ameaçada.'),
  c('Lagarto-diabo-espinhoso (Moloch horridus)', 'reptil', ['terra', 'fogo'], ['Deserto'], 'Miudo', 1, [1, 2, 2, 3], 'O lagarto-diabo-espinhoso bebe orvalho que corre por sulcos da pele até a boca. É coberto de espinhos cônicos.'),
  c('Gavial (Gavialis gangeticus)', 'reptil', ['agua', 'marcial'], ['Aquático'], 'Enorme', 5, [7, 2, 4, 2], 'O gavial tem focinho longo e fino cheio de dentes para pescar. Os machos exibem uma protuberância bulbosa na ponta.'),

  // ave
  c('Coruja-das-neves (Bubo scandiacus)', 'ave', ['ar', 'luz'], ['Tundra', 'Gelo'], 'Pequeno', 3, [2, 5, 7, 3], 'A coruja-das-neves caça de dia no verão ártico sem noite. Sua plumagem branca a esconde na neve.'),
  c('Pássaro-lira (Menura novaehollandiae)', 'ave', ['som', 'arcano'], ['Floresta'], 'Pequeno', 1, [1, 7, 4, 5], 'O pássaro-lira imita com perfeição outros pássaros, motosserras e obturadores de câmera. O macho abre a cauda em forma de lira.'),
  c('Casuar (Casuarius casuarius)', 'ave', ['marcial', 'vigor'], ['Selva'], 'Grande', 7, [7, 3, 6, 1], 'O casuar desfere chutes com garras afiadas nos pés. Carrega um capacete córneo sobre a cabeça.'),
  c('Falcão-peregrino (Falco peregrinus)', 'ave', ['ar', 'gravidade'], ['Montanha', 'Picos'], 'Pequeno', 5, [3, 4, 10, 2], 'O falcão-peregrino mergulha a mais de trezentos quilômetros por hora. É o animal mais rápido do planeta.'),
  c('Albatroz-errante (Diomedea exulans)', 'ave', ['ar', 'espaco'], ['Oceano'], 'Medio', 1, [3, 4, 8, 3], 'O albatroz-errante tem a maior envergadura entre as aves e plana por dias sem bater asas. Cruza oceanos inteiros.'),
  c('Harpia (Harpia harpyja)', 'ave', ['marcial', 'ar'], ['Selva'], 'Medio', 7, [7, 4, 6, 2], 'A harpia arranca macacos e preguiças do alto das árvores com garras enormes. É uma das águias mais fortes.'),
  c('Pinguim-imperador (Aptenodytes forsteri)', 'ave', ['agua', 'vigor'], ['Gelo', 'Ártico'], 'Medio', 1, [3, 3, 5, 2], 'O pinguim-imperador choca o ovo sobre os pés durante o inverno antártico. Os machos jejuam por meses.'),

  // mamifero
  c('Ornitorrinco (Ornithorhynchus anatinus)', 'mamifero', ['eletricidade', 'agua', 'vileza'], ['Aquático'], 'Pequeno', 3, [2, 4, 4, 5], 'O ornitorrinco bota ovos, sente campos elétricos com o bico e o macho tem esporão venenoso. Caça de olhos fechados.'),
  c('Morcego-vampiro (Desmodus rotundus)', 'mamifero', ['sombra', 'som'], ['Caverna'], 'Miudo', 5, [1, 5, 6, 3], 'O morcego-vampiro se alimenta de sangue e divide refeições com companheiros famintos. Localiza presas por calor e eco.'),
  c('Leopardo-das-neves (Panthera uncia)', 'mamifero', ['ar', 'marcial'], ['Montanha', 'Neve'], 'Medio', 6, [6, 5, 7, 2], 'O leopardo-das-neves salta entre penhascos usando a cauda longa como contrapeso. Vive em montanhas altas e frias.'),
  c('Cachalote (Physeter macrocephalus)', 'mamifero', ['som', 'agua', 'gravidade'], ['Oceano'], 'Colossal', 4, [9, 7, 4, 4], 'O cachalote mergulha a grandes profundidades caçando lulas com cliques sonoros. Tem o maior cérebro do reino animal.'),
  c('Pangolim (Manis javanica)', 'mamifero', ['terra', 'vigor'], ['Floresta'], 'Pequeno', 1, [2, 3, 2, 2], 'O pangolim é coberto de escamas de queratina e se enrola em bola ao sentir perigo. Come formigas com língua longa.'),
  c('Texugo-do-mel (Mellivora capensis)', 'mamifero', ['marcial', 'vigor'], ['Campo', 'Deserto'], 'Pequeno', 8, [5, 5, 5, 1], 'O texugo-do-mel enfrenta cobras e leões com pele grossa e frouxa. Invade colmeias atrás de larvas.'),
  c('Toupeira-nariz-de-estrela (Condylura cristata)', 'mamifero', ['terra', 'eletricidade'], ['Subsolo', 'Brejo'], 'Miudo', 1, [1, 4, 8, 3], 'A toupeira-nariz-de-estrela tem vinte e dois tentáculos no focinho que tocam o solo muito rápido. Identifica comida em milissegundos.'),

  // cnidario
  c('Água-viva-imortal (Turritopsis dohrnii)', 'cnidario', ['tempo', 'vida'], ['Mar'], 'Miudo', 1, [1, 1, 2, 8], 'A água-viva-imortal pode reverter ao estágio de pólipo e recomeçar a vida. Em teoria escapa da morte por velhice.'),
  c('Caravela-portuguesa (Physalia physalis)', 'cnidario', ['vileza', 'ar', 'agua'], ['Oceano'], 'Pequeno', 7, [2, 1, 2, 4], 'A caravela-portuguesa é uma colônia de organismos com vela de gás que navega ao vento. Tentáculos longos queimam como fogo.'),
  c('Vespa-do-mar (Chironex fleckeri)', 'cnidario', ['vileza', 'morte'], ['Costa'], 'Pequeno', 9, [1, 2, 5, 5], 'A vespa-do-mar carrega um dos venenos mais letais do oceano. Tem olhos complexos no sino transparente.'),
  c('Coral-cérebro (Diploria labyrinthiformis)', 'cnidario', ['terra', 'tempo'], ['Mar'], 'Grande', 1, [4, 2, 1, 4], 'O coral-cérebro forma cúpulas com sulcos que lembram um cérebro. Cresce devagar por séculos.'),
  c('Água-viva-juba-de-leão (Cyanea capillata)', 'cnidario', ['agua', 'sombra'], ['Oceano', 'Ártico'], 'Enorme', 5, [3, 1, 2, 4], 'A água-viva-juba-de-leão arrasta tentáculos com dezenas de metros em mares frios. É uma das maiores medusas.'),
  c('Anêmona-do-mar (Actinia equina)', 'cnidario', ['agua', 'marcial'], ['Costa'], 'Miudo', 3, [1, 1, 1, 3], 'A anêmona-do-mar recolhe os tentáculos na maré baixa e parece uma gota vermelha. Luta com vizinhas usando baterias de ferrões.'),

  // verme
  c('Verme-de-pompeia (Alvinella pompejana)', 'verme', ['fogo', 'vigor'], ['Oceano'], 'Miudo', 1, [1, 1, 1, 3], 'O verme-de-pompeia vive em chaminés hidrotermais escaldantes. Bactérias nas costas o protegem do calor.'),
  c('Verme-tubular-gigante (Riftia pachyptila)', 'verme', ['fogo', 'vida', 'agua'], ['Oceano'], 'Medio', 1, [2, 1, 1, 4], 'O verme-tubular-gigante não tem boca e depende de bactérias internas. Vive em fontes termais do fundo do mar.'),
  c('Minhocuçu (Rhinodrilus alatus)', 'verme', ['terra', 'vida'], ['Campo', 'Subsolo'], 'Pequeno', 1, [2, 1, 1, 2], 'O minhocuçu pode passar de um metro e areja camadas profundas do solo do cerrado.'),
  c('Verme-bobbit (Eunice aphroditois)', 'verme', ['marcial', 'sombra'], ['Mar'], 'Medio', 8, [5, 2, 9, 2], 'O verme-bobbit se esconde na areia e fecha mandíbulas com velocidade brutal. Pode partir peixes ao meio.'),
  c('Sanguessuga-medicinal (Hirudo medicinalis)', 'verme', ['vida', 'vileza'], ['Pântano'], 'Miudo', 4, [1, 2, 2, 4], 'A sanguessuga-medicinal injeta anticoagulante ao sugar sangue. Ainda é usada em cirurgias de reimplante.'),
  c('Verme-de-fogo (Hermodice carunculata)', 'verme', ['fogo', 'vileza'], ['Costa'], 'Miudo', 4, [1, 1, 2, 2], 'O verme-de-fogo tem cerdas brancas que causam ardor ao toque. Devora corais e anêmonas.'),
  c('Nemertino-bootlace (Lineus longissimus)', 'verme', ['espaco', 'vileza'], ['Costa'], 'Enorme', 2, [1, 1, 1, 3], 'O nemertino bootlace pode alcançar dezenas de metros de comprimento. Secreta muco tóxico.'),

  // molusco
  c('Polvo-mimético (Thaumoctopus mimicus)', 'molusco', ['arcano', 'agua'], ['Costa'], 'Pequeno', 3, [2, 9, 5, 6], 'O polvo-mimético imita peixes venenosos, cobras-do-mar e arraias. Escolhe o disfarce conforme o predador.'),
  c('Lula-colossal (Mesonychoteuthis hamiltoni)', 'molusco', ['sombra', 'agua', 'gravidade'], ['Oceano', 'Gelo'], 'Colossal', 6, [8, 5, 4, 4], 'A lula-colossal tem os maiores olhos do reino animal e ganchos giratórios nos braços. Vive em mares antárticos profundos.'),
  c('Náutilo (Nautilus pompilius)', 'molusco', ['tempo', 'gravidade'], ['Oceano'], 'Pequeno', 1, [1, 4, 2, 5], 'O náutilo regula gás nas câmaras da concha espiralada para subir e descer. Sua linhagem é antiga.'),
  c('Caracol-de-pé-escamoso (Chrysomallon squamiferum)', 'molusco', ['terra', 'fogo'], ['Oceano'], 'Miudo', 1, [2, 1, 1, 3], 'O caracol-de-pé-escamoso reveste a concha e o pé com sulfeto de ferro. Vive junto a fontes hidrotermais.'),
  c('Lesma-do-mar-folha (Elysia chlorotica)', 'molusco', ['luz', 'vida'], ['Costa'], 'Miudo', 1, [1, 3, 1, 6], 'A lesma-do-mar-folha guarda cloroplastos das algas que come e faz fotossíntese. Parece uma folha verde.'),
  c('Cone-geógrafo (Conus geographus)', 'molusco', ['vileza', 'morte'], ['Mar'], 'Miudo', 8, [1, 3, 3, 5], 'O cone-geógrafo dispara um dente-arpão com veneno paralisante. Uma picada pode matar uma pessoa.'),

  // crustaceo
  c('Tamarutaca (Odontodactylus scyllarus)', 'crustaceo', ['marcial', 'luz', 'vigor'], ['Mar'], 'Pequeno', 7, [8, 4, 9, 2], 'A tamarutaca golpeia com clavas tão rápidas que a água ferve em bolhas. Enxerga cores invisíveis para nós.'),
  c('Caranguejo-dos-coqueiros (Birgus latro)', 'crustaceo', ['terra', 'marcial'], ['Costa'], 'Medio', 4, [8, 3, 2, 1], 'O caranguejo-dos-coqueiros é o maior artrópode terrestre e quebra cocos com as pinças. Escala árvores.'),
  c('Camarão-pistola (Alpheus heterochaelis)', 'crustaceo', ['som', 'agua'], ['Mar'], 'Miudo', 4, [2, 2, 5, 5], 'O camarão-pistola fecha a pinça criando uma bolha que estoura com estalo fortíssimo. O choque atordoa peixes.'),
  c('Caranguejo-aranha-japonês (Macrocheira kaempferi)', 'crustaceo', ['agua', 'tempo'], ['Oceano'], 'Grande', 2, [5, 2, 2, 2], 'O caranguejo-aranha-japonês tem pernas que somam quase quatro metros de envergadura. Pode viver um século.'),
  c('Isópode-gigante (Bathynomus giganteus)', 'crustaceo', ['sombra', 'morte'], ['Oceano'], 'Pequeno', 2, [3, 2, 1, 2], 'O isópode-gigante vasculha o fundo do mar atrás de carcaças. Aguenta anos sem comer.'),
  c('Krill-antártico (Euphausia superba)', 'crustaceo', ['luz', 'vida'], ['Gelo', 'Oceano'], 'Miudo', 1, [1, 1, 4, 2], 'O krill antártico forma enxames visíveis do espaço e sustenta baleias. Brilha fracamente no escuro.'),

  // monstro
  c('Basilisco', 'monstro', ['vileza', 'morte'], ['Deserto'], 'Medio', 9, [5, 4, 5, 8], 'O basilisco do bestiário medieval mata com o olhar e o hálito. Só o canto do galo e a doninha o vencem.'),
  c('Kraken', 'monstro', ['agua', 'gravidade'], ['Oceano'], 'Colossal', 9, [10, 4, 4, 6], 'O kraken das sagas nórdicas é tão grande que marinheiros o confundiam com ilha. Arrasta navios ao fundo.'),
  c('Wendigo', 'monstro', ['morte', 'vileza'], ['Gelo', 'Floresta'], 'Grande', 10, [8, 5, 7, 6], 'O wendigo do folclore algonquino é um espírito de fome insaciável no inverno. Quanto mais come, mais magro fica.'),
  c('Serpente-marinha', 'monstro', ['agua', 'tempo'], ['Mar'], 'Colossal', 7, [9, 3, 6, 4], 'A serpente-marinha dos relatos de navegantes ondula entre as vagas com dorso interminável. Aparece antes de tempestades.'),
  c('Roca', 'monstro', ['ar', 'gravidade'], ['Montanha', 'Picos'], 'Colossal', 6, [10, 3, 8, 3], 'A roca das narrativas árabes é uma ave gigantesca que ergue elefantes. Seus ovos lembram cúpulas brancas.'),
  c('Cocatriz', 'monstro', ['vileza', 'ar'], ['Campo'], 'Pequeno', 7, [3, 3, 6, 6], 'A cocatriz nasce do ovo chocado por um sapo e petrifica com o toque. Tem corpo de galo e cauda de serpente.'),
  c('Hidra de muitas cabeças', 'monstro', ['vileza', 'agua', 'vida'], ['Pântano'], 'Enorme', 9, [9, 4, 4, 7], 'A hidra de muitas cabeças regenera duas cabeças para cada uma cortada. Vive em pântanos e envenena as águas.'),

  // humanoide
  c('Troll-das-montanhas', 'humanoide', ['terra', 'vigor'], ['Montanha', 'Caverna'], 'Grande', 7, [9, 2, 3, 3], 'O troll-das-montanhas do folclore nórdico vira pedra quando a luz do sol o toca. Guarda pontes e cavernas.'),
  c('Ogro', 'humanoide', ['vigor', 'marcial'], ['Floresta'], 'Grande', 8, [9, 2, 3, 1], 'O ogro dos contos antigos é um gigante guloso e de pouca astúcia. Mora em castelos rústicos.'),
  c('Sereia', 'humanoide', ['som', 'agua'], ['Mar', 'Costa'], 'Medio', 5, [3, 7, 6, 7], 'A sereia do folclore marinho atrai navegantes com um canto irresistível. Metade mulher, metade peixe.'),
  c('Centauro', 'humanoide', ['marcial', 'ar'], ['Planície', 'Pradaria'], 'Grande', 5, [7, 6, 8, 3], 'O centauro da mitologia grega une tronco humano a corpo de cavalo. Alguns são sábios curandeiros e arqueiros.'),
  c('Minotauro', 'humanoide', ['marcial', 'vigor', 'terra'], ['Caverna', 'Subterrâneo'], 'Grande', 9, [10, 3, 5, 2], 'O minotauro do mito cretense tem cabeça de touro e vive preso num labirinto. Devora quem se perde lá dentro.'),
  c('Duende-da-mina', 'humanoide', ['terra', 'arcano'], ['Caverna', 'Subsolo'], 'Miudo', 3, [2, 6, 6, 6], 'O duende-da-mina das lendas de mineiros bate nas paredes para avisar desabamentos. Esconde ferramentas de quem o ofende.'),
  c('Curupira', 'humanoide', ['vida', 'arcano'], ['Floresta', 'Selva'], 'Pequeno', 6, [3, 7, 9, 7], 'O curupira do folclore brasileiro tem os pés virados para trás e protege a mata. Confunde caçadores com rastros enganosos.'),

  // construto
  c('Golem de argila', 'construto', ['terra', 'arcano'], ['Caverna'], 'Grande', 5, [9, 2, 2, 5], 'O golem de argila das lendas judaicas é moldado em barro e animado por uma palavra escrita. Obedece sem pensar.'),
  c('Autômato de relojoaria', 'construto', ['tempo', 'eletricidade'], ['Caverna'], 'Medio', 3, [4, 6, 4, 3], 'O autômato de relojoaria move-se por engrenagens e molas que precisam de corda. Repete tarefas com precisão de pêndulo.'),
  c('Sentinela de ferro', 'construto', ['marcial', 'gravidade'], ['Montanha'], 'Enorme', 7, [10, 3, 2, 2], 'A sentinela de ferro vigia passagens sem dormir nem cansar. Cada passo pesado faz o chão tremer.'),
  c('Drone-enxame', 'construto', ['eletricidade', 'ar', 'som'], ['Etéreo', 'Campo'], 'Miudo', 6, [1, 7, 9, 2], 'O drone-enxame é formado por centenas de unidades zumbindo em sincronia. Juntas agem como um só corpo.'),
  c('Talos de bronze', 'construto', ['fogo', 'marcial'], ['Costa'], 'Colossal', 8, [10, 3, 4, 4], 'O gigante de bronze do mito grego chamado Talos rondava a ilha de Creta arremessando rochas. Um único veio levava sua força vital.'),
  c('Espantalho animado', 'construto', ['sombra', 'vida'], ['Campo'], 'Medio', 4, [3, 2, 3, 5], 'O espantalho animado ganha vida em noites de colheita e vigia a plantação. Palha seca escapa das suas mangas.'),

  // etereo
  c('Fogo-fátuo', 'etereo', ['luz', 'arcano'], ['Pântano'], 'Miudo', 4, [1, 5, 6, 8], 'O fogo-fátuo é uma chama azulada que flutua sobre brejos à noite. Quem o segue acaba perdido.'),
  c('Banshee', 'etereo', ['som', 'morte'], ['Etéreo', 'Colina'], 'Medio', 5, [1, 6, 5, 9], 'A banshee do folclore irlandês anuncia uma morte na família com um lamento agudo. Raramente é vista.'),
  c('Tulpa', 'etereo', ['arcano', 'espaco'], ['Espiritual'], 'Medio', 3, [2, 8, 5, 9], 'A tulpa é um ser criado apenas pela força do pensamento concentrado. Ganha vontade própria com o tempo.'),
  c('Kitsune', 'etereo', ['fogo', 'arcano'], ['Floresta', 'Espiritual'], 'Pequeno', 4, [3, 9, 7, 9], 'A kitsune do folclore japonês é uma raposa espiritual que ganha caudas com a idade. Cria ilusões e fogo fantasma.'),
  c('Sombra errante', 'etereo', ['sombra', 'tempo'], ['Etéreo'], 'Medio', 5, [1, 5, 7, 7], 'A sombra errante vaga separada do corpo que a projetava. Procura um dono novo ao anoitecer.'),
  c('Poltergeist', 'etereo', ['gravidade', 'som'], ['Espiritual'], 'Pequeno', 6, [4, 4, 6, 7], 'O poltergeist do folclore alemão arremessa objetos e faz barulhos sem ser visto. Prefere casas cheias de tensão.'),

  // morto_vivo
  c('Esqueleto guerreiro', 'morto_vivo', ['morte', 'marcial'], ['Caverna'], 'Medio', 7, [5, 2, 4, 3], 'O esqueleto guerreiro ergue-se de túmulos antigos ainda empunhando armas. Os ossos estalam a cada golpe.'),
  c('Múmia', 'morto_vivo', ['morte', 'fogo', 'tempo'], ['Deserto'], 'Medio', 6, [6, 4, 2, 7], 'A múmia enfaixada desperta quando sua tumba no deserto é violada. Traz consigo a poeira de séculos.'),
  c('Draugr', 'morto_vivo', ['morte', 'vigor'], ['Gelo', 'Colina'], 'Grande', 8, [9, 3, 3, 5], 'O draugr das sagas nórdicas guarda seu túmulo com força sobre-humana. Incha e escurece como cadáver afogado.'),
  c('Carniçal', 'morto_vivo', ['morte', 'vileza'], ['Deserto', 'Caverna'], 'Medio', 8, [5, 3, 6, 4], 'O carniçal do folclore árabe ronda cemitérios e ruínas atrás de carne morta. Assume formas para enganar viajantes.'),
  c('Revenant', 'morto_vivo', ['morte', 'marcial', 'tempo'], ['Espiritual'], 'Medio', 7, [6, 6, 5, 6], 'O revenant retorna do túmulo movido por uma vingança pendente. Descansa só quando ela se cumpre.'),
  c('Lich', 'morto_vivo', ['morte', 'arcano', 'sombra'], ['Caverna', 'Subterrâneo'], 'Medio', 9, [3, 10, 3, 10], 'O lich é um feiticeiro que prendeu a própria alma para escapar da morte. Seu corpo seco guarda saber antigo.'),
  c('Jiangshi', 'morto_vivo', ['morte', 'vigor'], ['Montanha'], 'Medio', 7, [6, 2, 4, 4], 'O jiangshi do folclore chinês avança aos saltos com braços esticados. Um talismã de papel na testa o paralisa.'),

  // extraplanetario
  c('Viajante Estelar', 'extraplanetario', ['espaco', 'luz'], ['Cósmico'], 'Medio', 3, [3, 9, 8, 8], 'O Viajante Estelar cruza o vazio entre sóis dentro de um casulo de luz. Coleta memórias dos mundos que visita.'),
  c('Medusa do Vácuo', 'extraplanetario', ['espaco', 'gravidade', 'eletricidade'], ['Cósmico'], 'Enorme', 5, [3, 4, 4, 9], 'A Medusa do Vácuo flutua entre planetas arrastando filamentos carregados de estática. Alimenta-se de vento solar.'),
  c('Semente de Cometa', 'extraplanetario', ['vida', 'espaco', 'fogo'], ['Astral'], 'Miudo', 2, [1, 4, 9, 7], 'A Semente de Cometa viaja presa ao gelo da cauda de cometas. Germina quando cai num mundo úmido.'),
  c('Colmeia Orbital', 'extraplanetario', ['eletricidade', 'marcial', 'som'], ['Cósmico'], 'Colossal', 7, [8, 8, 3, 5], 'A Colmeia Orbital é um organismo coletivo que gira ao redor de luas. Suas operárias zumbem em rádio.'),
  c('Andarilho de Cratera', 'extraplanetario', ['terra', 'gravidade'], ['Deserto', 'Cósmico'], 'Grande', 4, [8, 5, 2, 4], 'O Andarilho de Cratera caminha lentamente por planícies sem ar sobre seis pernas de rocha. Alimenta-se de metais.'),
  c('Eco de Nebulosa', 'extraplanetario', ['som', 'espaco', 'arcano'], ['Etéreo', 'Astral'], 'Colossal', 2, [1, 7, 5, 10], 'O Eco de Nebulosa é uma consciência feita de gás colorido que se comunica por ressonância. Pensa ao longo de milênios.'),
  c('Parasita de Meteoro', 'extraplanetario', ['vileza', 'espaco'], ['Cósmico', 'Caverna'], 'Miudo', 8, [2, 5, 6, 5], 'O Parasita de Meteoro chega dentro de rochas espaciais e se instala em hospedeiros próximos. Muda de forma rapidamente.'),

  // geologico
  c('Golem de cristal', 'geologico', ['luz', 'terra'], ['Caverna'], 'Grande', 4, [8, 3, 2, 6], 'O golem de cristal cresce em geodos profundos e refrata a luz em arco-íris. Estala quando se move.'),
  c('Geodo vivo', 'geologico', ['terra', 'arcano'], ['Subterrâneo'], 'Pequeno', 2, [3, 3, 1, 6], 'O geodo vivo parece pedra comum até se abrir e mostrar um interior de ametista. Fecha-se de novo quando assustado.'),
  c('Elemental de basalto', 'geologico', ['fogo', 'terra', 'vigor'], ['Montanha'], 'Enorme', 6, [10, 2, 2, 5], 'O elemental de basalto nasce de lava resfriada em colunas hexagonais. Brasas ainda brilham nas suas fissuras.'),
  c('Rocha Andante', 'geologico', ['terra', 'tempo', 'gravidade'], ['Deserto'], 'Grande', 1, [7, 2, 1, 4], 'A Rocha Andante desliza pelo leito seco de lagos deixando trilhas longas. Ninguém a vê se mover.'),
  c('Gárgula', 'geologico', ['terra', 'sombra', 'ar'], ['Montanha'], 'Medio', 5, [6, 4, 5, 5], 'A gárgula de pedra vigia telhados e desperta à noite para afastar espíritos. Ao amanhecer volta a ser estátua.'),
  c('Estalagmite desperta', 'geologico', ['agua', 'tempo'], ['Caverna'], 'Grande', 3, [6, 2, 1, 5], 'A estalagmite desperta cresceu gota a gota por milênios até ganhar consciência. Fala num eco lento.'),

  // elemental
  c('Salamandra elemental', 'elemental', ['fogo', 'arcano'], ['Montanha'], 'Pequeno', 6, [4, 5, 7, 8], 'A salamandra elemental da alquimia de Paracelso habita as chamas e se alimenta de fogo. Apaga-se em água.'),
  c('Ondina', 'elemental', ['agua', 'vida'], ['Aquático', 'Costa'], 'Medio', 3, [3, 6, 6, 8], 'A ondina é o espírito da água descrito por Paracelso. Deseja ganhar uma alma casando com um mortal.'),
  c('Sílfide', 'elemental', ['ar', 'som'], ['Etéreo', 'Picos'], 'Pequeno', 2, [1, 7, 10, 8], 'A sílfide é o espírito do ar, leve e quase invisível. Viaja nas correntes de vento de montanha.'),
  c('Gnomo elemental', 'elemental', ['terra', 'gravidade'], ['Subsolo'], 'Miudo', 3, [5, 7, 3, 7], 'O gnomo elemental atravessa rocha como se fosse ar e conhece todos os veios de minério. Protege tesouros enterrados.'),
  c('Elemental do trovão', 'elemental', ['eletricidade', 'som', 'ar'], ['Picos'], 'Enorme', 8, [8, 4, 10, 8], 'O elemental do trovão nasce nas nuvens de tempestade e desce em raios. Seu estrondo quebra janelas.'),
  c('Elemental do gelo', 'elemental', ['agua', 'tempo'], ['Gelo', 'Ártico'], 'Grande', 5, [6, 4, 3, 7], 'O elemental do gelo congela tudo que toca e parece parar o tempo ao redor. Vive em geleiras eternas.'),
  c('Elemental da aurora', 'elemental', ['luz', 'espaco'], ['Ártico', 'Etéreo'], 'Colossal', 1, [2, 6, 7, 9], 'O elemental da aurora dança no céu polar em cortinas verdes e roxas. Canaliza a luz que chega do espaço.'),

  // demonio
  c('Oni das montanhas', 'demonio', ['marcial', 'vigor', 'vileza'], ['Montanha'], 'Grande', 9, [9, 4, 4, 5], 'O oni das montanhas, do folclore japonês, é um ogro de pele vermelha ou azul com chifres e clava de ferro. Castiga os maus.'),
  c('Íncubo', 'demonio', ['sombra', 'arcano'], ['Etéreo'], 'Medio', 7, [3, 7, 6, 8], 'O íncubo das lendas medievais visita os que dormem e se nutre dos seus sonhos. Some antes do galo cantar.'),
  c('Súcubo', 'demonio', ['sombra', 'vida'], ['Espiritual'], 'Medio', 7, [3, 8, 6, 8], 'O súcubo da demonologia medieval seduz viajantes e drena sua energia vital. Assume a forma mais desejada.'),
  c('Diabrete', 'demonio', ['fogo', 'vileza'], ['Caverna'], 'Miudo', 5, [2, 5, 8, 5], 'O diabrete é um demônio miúdo que prega peças e espalha pequenos incêndios. Ri alto enquanto foge.'),
  c('Rakshasa', 'demonio', ['arcano', 'vileza', 'marcial'], ['Selva'], 'Grande', 9, [7, 8, 6, 9], 'O rakshasa dos épicos hindus muda de forma à vontade e ataca à noite. Suas garras são envenenadas.'),
  c('Djinn do fogo', 'demonio', ['fogo', 'ar', 'arcano'], ['Deserto'], 'Grande', 6, [6, 8, 8, 10], 'O djinn do fogo da tradição árabe nasce de chama sem fumaça. Pode ser benevolente ou cruel.'),
  c('Asura', 'demonio', ['marcial', 'vigor'], ['Etéreo'], 'Enorme', 8, [9, 6, 5, 7], 'O asura das tradições indianas trava guerra eterna contra os deuses. Tem vários braços armados.'),

  // angelical
  c('Serafim', 'angelical', ['luz', 'fogo'], ['Etéreo'], 'Grande', 2, [5, 9, 8, 10], 'O serafim tem seis asas e arde em fogo sagrado. Canta louvores sem cessar.'),
  c('Querubim', 'angelical', ['luz', 'marcial'], ['Espiritual'], 'Grande', 4, [7, 8, 6, 9], 'O querubim das escrituras antigas guarda portões sagrados com espada flamejante. Tem quatro faces.'),
  c('Ofanim', 'angelical', ['espaco', 'luz', 'tempo'], ['Cósmico'], 'Enorme', 2, [4, 9, 7, 10], 'O ofanim aparece como rodas dentro de rodas cobertas de olhos. Move-se em todas as direções sem virar.'),
  c('Trono celeste', 'angelical', ['gravidade', 'luz'], ['Astral'], 'Colossal', 1, [6, 9, 3, 10], 'O trono celeste é uma ordem angelical que sustenta o peso da justiça divina. Irradia calma absoluta.'),
  c('Valquíria', 'angelical', ['marcial', 'ar', 'morte'], ['Picos', 'Etéreo'], 'Medio', 5, [7, 7, 8, 7], 'A valquíria da mitologia nórdica escolhe os mais bravos entre os mortos em batalha. Leva-os a cavalo pelos céus.'),
  c('Arauto Alado', 'angelical', ['som', 'ar', 'luz'], ['Etéreo'], 'Medio', 2, [3, 8, 9, 8], 'O Arauto Alado leva mensagens entre mundos com uma trombeta de luz. Sua voz atravessa montanhas.'),
  c('Anjo da guarda', 'angelical', ['vida', 'luz'], ['Espiritual'], 'Medio', 1, [4, 8, 6, 9], 'O anjo da guarda acompanha uma única pessoa por toda a vida. Protege sem ser visto.'),
];
