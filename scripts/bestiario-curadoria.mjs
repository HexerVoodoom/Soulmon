// CURADORIA DO BESTIÁRIO — nome, tags e descrição coerentes, para o que a
// procedência (`bestiario-procedencia.mjs`) já deixou passar.
//
// ⚠️ Existe porque "não ser de franquia" não é o mesmo que "estar correto".
// Medido em 617 criaturas (27/09/2026), depois do corte de PI:
//
//   • **72% das descrições (442/617) terminavam no MEIO DE UMA PALAVRA.**
//     `scripts/sync-oracle-data.mjs` cortava com `.slice(0, 200)`, sem olhar
//     limite de frase. O texto que sobrava do corte já foi perdido — não hÁ
//     como recuperá-lo sem os repos irmãos —, então o conserto é reescrever,
//     não re-truncar.
//   • **O campo `familia` estava CORROMPIDO pelo elemento.** Toda vez que a
//     variante "de Fogo" existia para uma espécie real, ela vinha com
//     `familia: "ignea"` em vez da família de verdade — um Cão de Fogo, um
//     Elefante de Fogo e um Urso-d'água de Fogo perdiam a família `besta` só
//     por causa do elemento sorteado. Isso não é cosmético: `familia` decide
//     o bônus de continuidade de linhagem em `bestiary/select.ts` — a mesma
//     regra que faz "dragão tender a dragão" ficava cega para essas 20
//     entradas.
//   • **Duas entradas tinham `familia` fisicamente impossível**: a Mantícora
//     (fera terrestre da mitologia persa) vinha com `familia: "aquatica"`, e
//     a Welwitschia (planta do deserto da Namíbia) também.
//   • **O "drift" do §4 de `docs/BESTIARIO-PROCEDENCIA.md` não era só de
//     franquia.** O Urso-d'água (Tardígrado) tinha variantes com a descrição
//     da "zona habitável" em astronomia e de um filo de FUNGOS — nada a ver
//     com o animal. A Mantícora vinha tageada `biologia: ["Inseto/Aracnídeo"]`,
//     que também é errado (é fera, não artrópode).
//
// Este módulo é o dono ÚNICO da correção de CONTEÚDO das ~37 bases que
// sobrevivem à procedência — descrição completa e exata, família e biologia
// coerentes. É aplicado depois de `entradaPermitida`, tanto no script de sync
// quanto na poda do `pool.json` atual, para não divergir (footgun 9).
//
// Fonte das descrições: conhecimento geral de biologia/mitologia de domínio
// público — nenhuma reproduz texto de terceiro. Nomes científicos conferidos.

import { baseDe } from './bestiario-procedencia.mjs';

/** Os seis "tipos" não-procedurais que variam por bioma no NOME
 *  ("Tigre Costeiro Venenoso", "Tigre do Pântano Venenoso"…), mas
 *  compartilham a mesma curadoria — a espécie é a mesma, só muda onde vive. */
const TIPOS_COM_VARIANTE_DE_BIOMA = ['Tigre', 'Leão', 'Urso', 'Carvalho', 'Baobá', 'Girassol'];

/**
 * A chave de curadoria de uma entrada: a base procedural (via `baseDe`,
 * importado — nunca copiado) ou, para as não-procedurais, o TIPO com os
 * sufixos de elemento/veneno e o modificador de bioma removidos.
 */
export function chaveDeCuradoria(nome) {
  const base = baseDe(nome);
  if (base !== nome) return base; // procedural — já resolvido

  let s = String(nome ?? '')
    .replace(/\s+de\s+(Fogo|Água|Terra|Ar|Sombra|Luz)$/i, '')
    .replace(/\s+Venenos[oa]$/i, '')
    .replace(/\s+Veneno$/i, '')
    .trim();

  for (const tipo of TIPOS_COM_VARIANTE_DE_BIOMA) {
    if (s === tipo || s.startsWith(`${tipo} `)) return tipo;
  }
  return s;
}

/**
 * A tabela. Cada entrada corrige `descricao` (sempre), `familia` e
 * `biologia` (quando fazem sentido — planta e mítico ficam com
 * `biologia: []`, que é o correto, não um campo esquecido).
 *
 * `biologia` usa o vocabulário livre já existente (Anfíbio, Mamífero, Réptil,
 * Inseto/Aracnídeo) e acrescenta duas categorias que faltavam para peixe e
 * ave — o campo não tem enum fechado no código (`select.ts` só faz overlap
 * de string[]), então a extensão é segura.
 */
export const CURADORIA = {
  // ---- as 12 espécies reais (procedurais) ----
  'Axolote (Ambystoma mexicanum)': {
    familia: 'aquatica',
    biologia: ['Anfíbio'],
    descricao: 'O axolote (Ambystoma mexicanum) é uma salamandra mexicana que mantém características larvais a vida toda, como as brânquias externas — um fenômeno chamado neotenia. Vive só em lagos de água doce e está criticamente ameaçado na natureza.',
  },
  'Ocapi (Okapia johnstoni)': {
    familia: 'besta',
    biologia: ['Mamífero'],
    descricao: 'O ocapi (Okapia johnstoni) é um mamífero da família das girafas, nativo das florestas da República Democrática do Congo. As listras nas pernas lembram uma zebra, mas seu parente mais próximo é mesmo a girafa.',
  },
  'Peixe-gota (Blobfish)': {
    familia: 'aquatica',
    biologia: ['Peixe'],
    descricao: 'O peixe-gota (Psychrolutes marcidus) vive nas profundezas geladas ao largo da Austrália e da Tasmânia. Sob a alta pressão das águas abissais, sua carne gelatinosa o sustenta sem precisar de bexiga natatória.',
  },
  'Welwitschia mirabilis': {
    familia: 'planta',
    biologia: [],
    descricao: 'Welwitschia mirabilis é uma planta do deserto do Namibe, entre a Namíbia e Angola, que pode viver mais de mil anos. Ao longo de toda a vida produz só duas folhas, que crescem sem parar e se rasgam com o vento.',
  },
  'Cão (Canis lupus familiaris)': {
    familia: 'besta',
    biologia: ['Mamífero'],
    descricao: 'O cão (Canis lupus familiaris) é uma subespécie do lobo domesticada há milênios, e o primeiro animal a viver ao lado dos humanos. Existem centenas de raças, todas descendentes do mesmo ancestral selvagem.',
  },
  'Flor-cadáver (Rafflesia arnoldii)': {
    familia: 'planta',
    biologia: [],
    descricao: 'Rafflesia arnoldii, a flor-cadáver, produz a maior flor individual do mundo, nativa das florestas de Sumatra e Bornéu. Sem folhas nem caule próprio, ela libera um cheiro de carne podre para atrair moscas polinizadoras.',
  },
  "Urso-d'água (Tardígrado)": {
    familia: 'besta',
    biologia: [], // filo próprio (Tardigrada); nenhuma categoria existente encaixa sem forçar
    descricao: "Os tardígrados, ou ursos-d'água, são animais microscópicos capazes de sobreviver ao vácuo do espaço, a temperaturas extremas e à radiação, entrando num estado de vida suspensa chamado criptobiose.",
  },
  Fênix: {
    familia: 'ave',
    biologia: [], // mitológica — não é ave real
    descricao: 'A fênix é uma ave mitológica que renasce das próprias cinzas ao final da vida, presente em lendas do Egito à Grécia antiga. Seu ciclo de morte e renascimento é símbolo universal de renovação.',
  },
  Dragão: {
    familia: 'draconico',
    biologia: [],
    descricao: 'O dragão é uma criatura lendária presente em mitologias de quase todos os povos do mundo, geralmente descrito como um réptil colossal capaz de cuspir fogo e guardar tesouros em covis escondidos.',
  },
  'Elefante Africano': {
    familia: 'besta',
    biologia: ['Mamífero'],
    descricao: 'O elefante-africano (Loxodonta) é o maior animal terrestre vivo, reconhecido pelas orelhas grandes e presas longas. Vive em manadas lideradas por fêmeas mais velhas, nas savanas e florestas da África.',
  },
  'Sangue-de-dragão (Dracaena cinnabari)': {
    familia: 'planta',
    biologia: [],
    descricao: 'A árvore sangue-de-dragão (Dracaena cinnabari) cresce só na ilha de Socotra, no Iêmen, com a copa em formato de guarda-chuva invertido. Seu nome vem da resina vermelha que escorre quando o tronco é cortado.',
  },
  'Dragão-azul (Glaucus atlanticus)': {
    familia: 'aquatica',
    biologia: [], // molusco marinho; nenhuma categoria existente encaixa sem forçar
    descricao: 'O dragão-azul (Glaucus atlanticus) é uma lesma-do-mar minúscula que flutua de barriga para cima na superfície do oceano. Alimenta-se de caravelas-portuguesas e guarda as células urticantes delas para se defender.',
  },
  'Sakura (Cerejeira)': {
    familia: 'planta',
    biologia: [],
    descricao: 'A sakura, ou cerejeira ornamental, é famosa no Japão pela floração breve e intensa da primavera. A queda das pétalas é celebrada como símbolo da beleza passageira da vida, na tradição do hanami.',
  },
  'Carvalho Sagrado (Quercus)': {
    familia: 'planta',
    biologia: [],
    descricao: 'O carvalho é uma árvore do gênero Quercus, associada a divindades do trovão em várias mitologias europeias, da grega à nórdica e à celta. Pode viver centenas de anos e é símbolo de força e resistência.',
  },

  // ---- os tipos não-procedurais (biome-variantes ou entrada única) ----
  Hipopótamo: {
    familia: 'besta',
    biologia: ['Mamífero'],
    descricao: 'O hipopótamo é um mamífero semiaquático da África subsaariana, um dos animais terrestres mais pesados do planeta. Apesar do corpo robusto, é considerado um dos mais perigosos por sua agressividade territorial.',
  },
  Crocodilo: {
    familia: 'besta',
    biologia: ['Réptil'],
    descricao: 'Os crocodilos são répteis predadores que existem quase sem mudanças há mais de 80 milhões de anos. Vivem em rios e pântanos tropicais, à espreita, e têm uma das mordidas mais fortes do reino animal.',
  },
  Tubarão: {
    familia: 'aquatica',
    biologia: ['Peixe'],
    descricao: 'O tubarão é um peixe cartilaginoso que existe há mais de 400 milhões de anos, antes das árvores. Seus sentidos apurados de olfato e vibração o tornam um dos predadores mais eficientes dos oceanos.',
  },
  Águia: {
    familia: 'ave',
    biologia: ['Ave'],
    descricao: 'A águia é uma ave de rapina de visão extraordinariamente aguçada, capaz de enxergar uma presa a quilômetros de distância. Símbolo de poder e liberdade em culturas de todo o mundo, caça em mergulhos rasantes.',
  },
  Tigre: {
    familia: 'besta',
    biologia: ['Mamífero'],
    descricao: 'O tigre é o maior felino vivo, reconhecido pelas listras alaranjadas e pretas únicas de cada indivíduo. Solitário e territorial, caça sozinho à espreita e é um dos predadores mais temidos da Ásia.',
  },
  Girassol: {
    familia: 'planta',
    biologia: [],
    descricao: 'O girassol é uma planta que gira a flor ao longo do dia para acompanhar o sol, comportamento chamado heliotropismo. Suas sementes são fonte de óleo e alimento em várias partes do mundo.',
  },
  Manticora: {
    familia: 'besta',
    biologia: [], // FIX: vinha "Inseto/Aracnídeo" — mantícora não é artrópode
    descricao: 'A mantícora é uma criatura da mitologia persa, com corpo de leão, rosto humano e cauda de escorpião capaz de disparar espinhos venenosos. Diz a lenda que devora suas presas por inteiro, sem deixar vestígios.',
  },
  Javali: {
    familia: 'besta',
    biologia: ['Mamífero'],
    descricao: 'O javali é o ancestral selvagem do porco doméstico, um mamífero robusto e agressivo quando encurralado. Vive em bandos e usa as presas curvas para escavar o solo em busca de raízes e larvas.',
  },
  Lobisomem: {
    familia: 'besta',
    biologia: [],
    descricao: 'O lobisomem é uma figura do folclore europeu: uma pessoa amaldiçoada a se transformar em lobo, geralmente sob a lua cheia. A lenda atravessou séculos como símbolo do lado selvagem escondido em cada um.',
  },
  Aranha: {
    familia: 'besta',
    biologia: ['Inseto/Aracnídeo'],
    descricao: 'As aranhas são aracnídeos que produzem seda para tecer teias, casulos e fios de segurança. Quase todas as espécies têm veneno, usado principalmente para imobilizar presas, não para atacar humanos.',
  },
  Leão: {
    familia: 'besta',
    biologia: ['Mamífero'],
    descricao: 'O leão é o único felino verdadeiramente social, vivendo em grupos chamados alcateias. Fêmeas caçam em conjunto enquanto os machos, com sua juba característica, defendem o território do bando.',
  },
  Carvalho: {
    familia: 'planta',
    biologia: [],
    descricao: 'O carvalho é uma árvore de crescimento lento e vida longa, cuja madeira densa é usada há séculos na construção naval e em barris de envelhecimento. Suas bolotas alimentam esquilos e javalis nas florestas temperadas.',
  },
  Rinoceronte: {
    familia: 'besta',
    biologia: ['Mamífero'],
    descricao: 'O rinoceronte é um mamífero de pele grossa e chifre feito de queratina, o mesmo material das unhas humanas. Apesar do porte imenso, pode disparar em corridas curtas surpreendentemente rápidas quando ameaçado.',
  },
  Urso: {
    familia: 'besta',
    biologia: ['Mamífero'],
    descricao: 'O urso é um mamífero carnívoro de grande porte, com espécies adaptadas a quase todos os climas — do gelo do Ártico às florestas tropicais. Hiberna em climas frios, reduzindo o metabolismo para sobreviver ao inverno.',
  },
  Baobá: {
    familia: 'planta',
    biologia: [],
    descricao: 'O baobá é uma árvore africana de tronco largo e retorcido, capaz de armazenar milhares de litros de água para sobreviver às secas da savana. Pode viver mais de mil anos, o que lhe rendeu o apelido de árvore da vida.',
  },
  Cobra: {
    familia: 'besta',
    biologia: ['Réptil'],
    descricao: 'As cobras são répteis sem patas que se movem por ondulação do corpo, com espécies peçonhentas e não peçonhentas em quase todos os continentes. Suas presas retráteis injetam veneno para caçar ou se defender.',
  },
  Cérbero: {
    familia: 'demonio',
    biologia: [],
    descricao: 'Cérbero é o cão de três cabeças da mitologia grega, guardião do portão do submundo de Hades. Sua função era impedir que os mortos escapassem e que os vivos entrassem sem autorização.',
  },
  Quimera: {
    familia: 'besta',
    biologia: [], // FIX: vinha "ignea", corrompida pelo elemento
    descricao: 'A quimera é uma criatura da mitologia grega com corpo de leão, cabeça de cabra saindo do dorso e cauda de serpente, capaz de cuspir fogo. Foi derrotada pelo herói Belerofonte, montado no cavalo alado Pégaso.',
  },
  Lobo: {
    familia: 'besta',
    biologia: ['Mamífero'],
    descricao: 'O lobo é um predador social que vive e caça em matilhas lideradas por um casal dominante. Ancestral direto do cão doméstico, se comunica por uivos que podem ser ouvidos a quilômetros de distância.',
  },
  Sucuri: {
    familia: 'besta',
    biologia: ['Réptil'],
    descricao: 'A sucuri é uma das maiores serpentes do mundo, encontrada nos rios e pântanos da América do Sul. Não é venenosa: mata suas presas por constrição, enrolando o corpo até interromper a respiração.',
  },
  Elefante: {
    familia: 'besta',
    biologia: ['Mamífero'],
    descricao: 'O elefante é o maior animal terrestre vivo, reconhecido pelas orelhas grandes e presas longas. Vive em manadas lideradas por fêmeas mais velhas, e se comunica por infrassons que viajam quilômetros.',
  },
  Gorila: {
    familia: 'besta',
    biologia: ['Mamífero'],
    descricao: 'O gorila é o maior primata vivo, um herbívoro gigante e surpreendentemente pacífico apesar da força descomunal. Vive em grupos familiares liderados por um macho dominante, chamado de costas-prateadas.',
  },
  'Mandrágora Real': {
    familia: 'planta',
    biologia: [],
    descricao: 'A mandrágora é uma planta real do Mediterrâneo cuja raiz bifurcada lembra uma figura humana, o que alimentou lendas de que gritaria ao ser arrancada do solo. Foi usada na medicina antiga como sedativo.',
  },
};

/** Aplica a curadoria a UMA criatura. Devolve um objeto NOVO quando há
 *  correção, e a MESMA referência quando não há (nenhuma base fora da
 *  tabela é tocada — a curadoria não inventa dado para o que não conhece). */
export function curarEntrada(criatura) {
  const correcao = CURADORIA[chaveDeCuradoria(criatura?.nome)];
  if (!correcao) return criatura;
  return {
    ...criatura,
    descricao: correcao.descricao,
    familia: correcao.familia,
    biologia: correcao.biologia,
  };
}
