/**
 * TRAVESSIAS — A VIAGEM DA NOITE (04/10/2026, pedido do dono): a missão feita
 * no dia leva o Soulmon à região dela, e ele volta no relatório daquela noite
 * com uma historinha. Só dados; quem sorteia é `utils/travessias.ts` ›
 * `passeioFindOfDay`, e o tipo é o mesmo `RegionFind` dos achados do Passeio —
 * mesmo diário, mesmo card, nenhum sistema paralelo.
 *
 * Contém também os três postais dos MARCOS DE AVENTURA (5, 10 e 20 missões):
 * cosméticos, sem Bits, sem XP, sem nada que dê vantagem.
 *
 * REGRAS DE ESCRITA (as do catálogo, `data/travessiasCatalog.ts`, mais estas):
 *  · 1ª pessoa do Soulmon, passado, 2–3 frases curtas: ele conta o que viu,
 *    para quem ficou. Nunca "você fez", nunca avalia o dia da pessoa, nunca
 *    pede nada, nunca cobra;
 *  · nada fala da missão nem de mérito: quem viaja é o Soulmon;
 *  · três por região (as sete com desafio; a casa não tem), sem repetir o
 *    emoji de nenhum outro achado e só de Emoji 11 ou anterior.
 */
import type { RegionFind, RegionId } from '../types/travessias';

type Viagem = Omit<RegionFind, 'id'> & { id: string };

export const VIAGENS: Readonly<Partial<Record<RegionId, readonly [Viagem, Viagem, Viagem]>>> = {
  floresta: [
    {
      id: 'trv-floresta-volta-1', emoji: '🍁',
      titleEn: 'Slices of light', titlePt: 'Luz em fatias',
      textEn: 'I reached the forest and the light came in slices between the leaves. I walked from slice to slice, like hopping stones across a creek. When I looked up again, it was time to head back.',
      textPt: 'Cheguei à floresta e a luz entrava em fatias entre as folhas. Fui andando de fatia em fatia, como quem pula pedras num riacho. Quando olhei de novo, já era hora de voltar.',
    },
    {
      id: 'trv-floresta-volta-2', emoji: '🦔',
      titleEn: 'A prickly neighbour', titlePt: 'Um vizinho de espinhos',
      textEn: 'A prickly little animal crossed my path in no hurry at all. I waited for all of it to pass, and it did not say thanks. I liked it anyway.',
      textPt: 'Um bicho de espinhos atravessou o meu caminho sem pressa nenhuma. Esperei ele passar inteiro, e ele nem agradeceu. Gostei dele mesmo assim.',
    },
    {
      id: 'trv-floresta-volta-3', emoji: '🐞',
      titleEn: 'A leaf with a passenger', titlePt: 'Uma folha com passageiro',
      textEn: 'A ladybug hitched a ride on my head for half the way. I did not move my head. She hopped off onto some leaf and was gone, quite content.',
      textPt: 'Uma joaninha pegou carona na minha cabeça por metade do caminho. Eu não mexi a cabeça. Ela desceu numa folha qualquer e sumiu, satisfeita.',
    },
  ],
  oceano: [
    {
      id: 'trv-oceano-volta-1', emoji: '⛵',
      titleEn: 'A boat the size of a leaf', titlePt: 'Um barco do tamanho de uma folha',
      textEn: 'I found a tiny boat wedged between the rocks at the shore. I gave it a gentle push and it went, slowly, as if it knew the way. I watched until it was a dot.',
      textPt: 'Achei um barquinho preso entre as pedras da beira. Empurrei de leve e ele foi, devagar, como se soubesse o caminho. Fiquei olhando até virar um ponto.',
    },
    {
      id: 'trv-oceano-volta-2', emoji: '🐡',
      titleEn: 'A round, serious fish', titlePt: 'Um peixe redondo e sério',
      textEn: 'A round fish stared at me from the shallows, very serious. I made my most serious face too. It puffed up, and I decided I had lost.',
      textPt: 'Um peixe redondo me encarou da água rasa, muito sério. Fiz a minha cara mais séria também. Ele inflou, e eu decidi que tinha perdido.',
    },
    {
      id: 'trv-oceano-volta-3', emoji: '🏝️',
      titleEn: 'An island too small', titlePt: 'Uma ilha pequena demais',
      textEn: 'I saw an island so small it only fit one palm tree and me. I stayed a while, just to be its only resident. I came back when the tide started calling me.',
      textPt: 'Vi uma ilha tão pequena que só cabia uma palmeira e eu. Fiquei lá um tempo, só para ser o único morador. Voltei quando a maré começou a me chamar.',
    },
  ],
  deserto: [
    {
      id: 'trv-deserto-volta-1', emoji: '🏺',
      titleEn: 'A jar with no story', titlePt: 'Um pote sem história',
      textEn: 'I dug up half of an old jar from the sand. It held nothing, only the shape of having kept something. I left it where it was and covered it back up.',
      textPt: 'Desenterrei metade de um pote antigo da areia. Não tinha nada dentro, só o formato de ter guardado algo. Deixei no lugar e cobri de volta.',
    },
    {
      id: 'trv-deserto-volta-2', emoji: '🐪',
      titleEn: 'One step at a time', titlePt: 'Um passo de cada vez',
      textEn: 'I followed a camel from far behind, by its rhythm. It was never in a hurry and arrived everywhere. I tried walking like that and almost managed.',
      textPt: 'Segui um camelo bem de longe, pelo ritmo. Ele nunca teve pressa e chegou em todos os lugares. Tentei andar igual e quase consegui.',
    },
    {
      id: 'trv-deserto-volta-3', emoji: '🐍',
      titleEn: 'A drawing in the sand', titlePt: 'Um desenho na areia',
      textEn: 'A snake left a wavy line in the sand and went on its way. I followed the line to the end, to be polite. There was nothing there, just the end of the line.',
      textPt: 'Uma cobra deixou uma linha ondulada na areia e foi embora. Segui a linha até o fim, para ser educado. Ali não tinha nada, só o fim da linha.',
    },
  ],
  picos: [
    {
      id: 'trv-picos-volta-1', emoji: '🏞️',
      titleEn: 'The valley below', titlePt: 'O vale lá embaixo',
      textEn: 'I climbed to a spot where the whole valley fit in my eyes. Everything down below looked calm and tidy. I stayed until the wind asked me to come down.',
      textPt: 'Subi até um ponto de onde o vale cabia inteiro nos meus olhos. Tudo lá embaixo parecia calmo e arrumado. Fiquei até o vento me pedir para descer.',
    },
    {
      id: 'trv-picos-volta-2', emoji: '🦙',
      titleEn: 'A woolly animal with opinions', titlePt: 'Um bicho de lã e opinião',
      textEn: 'A woolly animal looked me up and down, chewing something, thoughtful. I think it found me small. I found it big, so it was fair.',
      textPt: 'Um bicho de lã me olhou de cima a baixo, mastigando algo, pensativo. Acho que me achou pequeno. Eu achei ele grande, então ficou justo.',
    },
    {
      id: 'trv-picos-volta-3', emoji: '🌄',
      titleEn: 'The first light of the day', titlePt: 'A primeira luz do dia',
      textEn: 'I arrived early and waited for the light to touch the tallest peak first. It took its time, but it came. It was worth it, though I had not been waiting for anything.',
      textPt: 'Cheguei cedo e esperei a luz tocar primeiro o pico mais alto. Ela demorou, mas veio. Valeu, mesmo sem eu estar esperando nada.',
    },
  ],
  pantano: [
    {
      id: 'trv-pantano-volta-1', emoji: '🐊',
      titleEn: 'A log that blinked', titlePt: 'Um tronco que piscou',
      textEn: 'A log by the mud opened one eye and closed it again. I got the message and tiptoed by along the far bank. It was a polite meeting on both sides.',
      textPt: 'Um tronco na beira da lama abriu um olho e fechou de novo. Entendi o recado e passei bem devagar, pela outra margem. Foi um encontro educado dos dois lados.',
    },
    {
      id: 'trv-pantano-volta-2', emoji: '🦢',
      titleEn: 'A swan in the mist', titlePt: 'Um cisne no meio da névoa',
      textEn: 'A white swan appeared in the mist, still as a drawing. It made no sound and neither did I. When the mist closed again, it was gone.',
      textPt: 'Um cisne branco apareceu no meio da névoa, parado como um desenho. Não fez barulho, nem eu. Quando a névoa fechou de novo, ele já tinha ido.',
    },
    {
      id: 'trv-pantano-volta-3', emoji: '🐛',
      titleEn: 'A busy caterpillar', titlePt: 'Uma lagarta atarefada',
      textEn: 'I followed a caterpillar carrying a leaf twice its size. I offered help, and it declined without ever stopping. The two of them got where they wanted.',
      textPt: 'Segui uma lagarta que carregava uma folha duas vezes maior que ela. Ofereci ajuda, e ela recusou sem parar de andar. As duas chegaram aonde queriam.',
    },
  ],
  cavernas: [
    {
      id: 'trv-cavernas-volta-1', emoji: '🔦',
      titleEn: 'One small light is enough', titlePt: 'Uma luz pequena basta',
      textEn: 'I went in with just one small light and it was enough. I could see half of the wall, and I imagined the other half. Imagining turned out to be quite comfortable.',
      textPt: 'Entrei com uma luzinha só e ela deu conta do recado. Via metade da parede, e a outra metade eu imaginei. Imaginar acabou sendo bem confortável.',
    },
    {
      id: 'trv-cavernas-volta-2', emoji: '🕳️',
      titleEn: 'An echo from the bottom', titlePt: 'Um eco lá do fundo',
      textEn: 'I dropped a pebble into a hole to hear the answer. The answer took a while and came back soft, like someone waking up. I apologised and tiptoed away.',
      textPt: 'Joguei uma pedrinha num buraco para ouvir a resposta. A resposta demorou e veio baixinha, como quem acorda. Pedi desculpa e fui embora na ponta dos pés.',
    },
    {
      id: 'trv-cavernas-volta-3', emoji: '🏮',
      titleEn: 'A forgotten lantern', titlePt: 'Uma lanterna esquecida',
      textEn: 'I found an old lantern hanging on the wall, somehow still warm. I did not light anything, just stayed near it for a bit. Then I left it just as it was.',
      textPt: 'Achei uma lanterna velha pendurada na parede, ainda morna de algum jeito. Não acendi nada, só fiquei perto dela um pouco. Depois deixei do jeito que estava.',
    },
  ],
  gelo: [
    {
      id: 'trv-gelo-volta-1', emoji: '⛸️',
      titleEn: 'A sheet of ice that slides', titlePt: 'Um chão de gelo que escorrega',
      textEn: 'I stepped onto a smooth sheet of ice and slid without meaning to. I spun twice and decided it had been on purpose. Nobody was watching, so it counted.',
      textPt: 'Pisei num chão de gelo liso e fui deslizando sem querer. Girei duas vezes e decidi que tinha sido de propósito. Ninguém estava olhando, então valeu.',
    },
    {
      id: 'trv-gelo-volta-2', emoji: '🎿',
      titleEn: 'Footprints in new snow', titlePt: 'Pegadas na neve nova',
      textEn: 'The snow was so fresh that mine were the first footprints. I zigzagged just to leave a drawing. I looked back and liked it.',
      textPt: 'A neve estava tão nova que as minhas eram as primeiras pegadas. Andei em zigue-zague só para deixar um desenho. Olhei para trás e gostei.',
    },
    {
      id: 'trv-gelo-volta-3', emoji: '☃️',
      titleEn: 'A snowman on its own', titlePt: 'Um boneco de neve sozinho',
      textEn: 'I came across a snowman with nobody around, scarf and all. I sat beside it a while, in silence. It was good company, like anyone who asks nothing of you.',
      textPt: 'Encontrei um boneco de neve sem ninguém por perto, de cachecol e tudo. Sentei um tempo do lado dele, em silêncio. Foi boa companhia, como todo mundo que não pergunta nada.',
    },
  ],
};

/** Os postais dos Marcos de Aventura, na ordem de `MARCO_THRESHOLDS` (5, 10, 20). */
export const MARCO_POSTAIS: readonly RegionFind[] = [
  {
    id: 'trv-marco-5', emoji: '🎒',
    titleEn: 'The first travel postcard', titlePt: 'O primeiro postal de viagem',
    textEn: 'I gathered everything I saw on these strolls into one postcard. It has leaves, sand, snow and a little mud. It fit nicely on the wall.',
    textPt: 'Juntei tudo o que vi nesses passeios num postal só. Tem folha, areia, neve e um pouco de lama. Coube bem na parede.',
  },
  {
    id: 'trv-marco-10', emoji: '🏕️',
    titleEn: 'A corner to rest in', titlePt: 'Um canto para descansar',
    textEn: 'I set up a little travel corner with the things I have been bringing back. It is small, but there is room for both of us. Come sit whenever you like.',
    textPt: 'Montei um cantinho de viagem com as coisas que fui trazendo. É pequeno, mas tem lugar para os dois. Pode vir sentar quando quiser.',
  },
  {
    id: 'trv-marco-20', emoji: '🏵️',
    titleEn: 'A map made of postcards', titlePt: 'Um mapa feito de postais',
    textEn: 'I pasted the postcards side by side and they became a map. You can see where I have walked, and where I have not yet. I like both parts.',
    textPt: 'Colei os postais um do lado do outro e virou um mapa. Dá para ver por onde andei, e por onde ainda não. Gosto dos dois pedaços.',
  },
];
