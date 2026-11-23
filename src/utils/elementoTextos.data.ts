/**
 * Textos dos 20 elementos BASE no modal do dex (Biblioteca › Elementos). Aprovados pelo dono em 23/11/2026
 * (docs/TEXTOS-ELEMENTOS-ARCANOS-FINAL.md): descrição do elemento + parágrafo conceitual. O arcano de cada um é só metadado interno do doc
 * e NÃO aparece aqui nem na tela. Só os 20 base têm texto: combinados (inclusive fantasma, morto-vivo, sangue e fúria) seguem sem descrição própria.
 * Dados puros; só o `ElementDex` importa (fora da entrada).
 */
export const TEXTOS_ELEMENTO_BASE: Readonly<Record<string, { pt: string; en: string }>> = {
  fogo: {
    pt: "O fogo de lampião mantém a chama baixa mesmo com vento forte, embora um celeiro inteiro coubesse nele e a noite toda caiba num único pavio. Representa a capacidade de controlar os próprios impulsos sem precisar destruí-los. A verdadeira força nasce do domínio de si mesmo.",
    en: "Lantern fire keeps its flame low even in strong wind, though an entire barn would fit inside it and a whole night fits in a single wick. It represents the ability to control one's own impulses without having to destroy them. True strength is born of mastery over oneself.",
  },
  agua: {
    pt: "Água de poço fundo reflete apenas o que se inclina sobre ela e abafa os sons de fora. As cheias são sabidas antes de chegarem, pelo modo como a superfície estremece sem vento algum. Representa a sabedoria que não depende exclusivamente da razão. É a capacidade de observar, compreender e perceber aquilo que permanece oculto.",
    en: "Water of a deep well reflects only what leans over it and muffles the sounds outside. Floods are known before they arrive, by the way the surface trembles with no wind at all. It represents wisdom that does not depend on reason alone. It is the ability to observe, understand and perceive what remains hidden.",
  },
  terra: {
    pt: "A terra guarda sulcos antigos, traçados pela geração anterior. As valas repetem o mesmo desenho há séculos. A chuva apaga, aos poucos, as marcas dos marcos de divisa. Representa os ensinamentos recebidos da sociedade, da família e das instituições. É o conhecimento transmitido entre gerações.",
    en: "The earth keeps old furrows, drawn by the previous generation. The ditches repeat the same pattern for centuries. Rain slowly washes out the marks on the boundary markers. It represents the teachings received from society, family and institutions. It is knowledge handed down between generations.",
  },
  ar: {
    pt: "O ar da manhã atravessa o vale com pólen e fumaça, e a corrente refaz o caminho em sentido contrário quando o peso passa de um lado. Representa a compreensão de que escolhas possuem consequências. Busca avaliar situações com imparcialidade e reconhecer a responsabilidade individual.",
    en: "Morning air crosses the valley carrying pollen and smoke, and the current reverses its path whenever the weight tips to one side. It represents the understanding that choices have consequences. It seeks to weigh situations impartially and to recognize individual responsibility.",
  },
  eletricidade: {
    pt: "A eletricidade das tempestades de montanha procura o lugar mais alto. Quando alcança a torre da vila, abre nela a rachadura que a altura da obra escondia. Representa o colapso de estruturas construídas sobre fundamentos frágeis. Uma verdade inesperada destrói aquilo que parecia seguro.",
    en: "Electricity from mountain storms seeks the highest spot. When it reaches the village tower, it opens the crack that the height of the work had hidden. It represents the collapse of structures built on fragile foundations. An unexpected truth destroys what seemed safe.",
  },
  arcano: {
    pt: "Runas e compassos esperam na bancada da oficina, todos prontos. Um fio de luz liga a mesa ao teto e marca onde entra o primeiro traço. Representa a capacidade de transformar ideias em realidade. Há ferramentas, talentos e recursos, mas é preciso aprender a utilizá-los.",
    en: "Runes and compasses wait on the workshop bench, all ready. A thread of light joins the table to the ceiling and marks where the first stroke will go. It represents the ability to turn ideas into reality. There are tools, talents and resources, but one must learn to use them.",
  },
  sombra: {
    pt: "A sombra ocupa o canto que a lamparina não alcança. O corpo dela está inteiro ali, mas a vista não o lê, e a porta só reaparece quando a luz chega perto. Representa os territórios desconhecidos da mente. Medos, fantasias, inseguranças e desejos inconscientes influenciam a percepção da realidade.",
    en: "Shadow occupies the corner the lamp does not reach. Its body is whole there, but the eye does not read it, and the door only reappears when the light comes near. It represents the unknown territories of the mind. Fears, fantasies, insecurities and unconscious desires shape the perception of reality.",
  },
  luz: {
    pt: "Ao meio-dia a luz cobre os pátios de lajota clara. Ela alcança o muro e o poço juntos, e as rachaduras aparecem no tamanho e na cor que têm. Representa a plenitude da existência. É a capacidade de encontrar alegria, reconhecer o próprio valor e compartilhar a própria luz com o mundo.",
    en: "At midday light covers the courtyards of pale tile. It reaches the wall and the well together, and the cracks show at the size and colour they have. It represents the fullness of existence. It is the ability to find joy, recognize one's own worth and share one's own light with the world.",
  },
  vileza: {
    pt: "A vileza é áspera e tem apetite. Raspa a borda de toda moeda que passa pelo balcão. O pouco que leva por vez forma uma pilha. Representa os desejos humanos, os prazeres e os vínculos que podem se transformar em correntes. É o confronto com aquilo que nos domina.",
    en: "Fel is rough and has an appetite. It scrapes the edge off every coin that crosses the counter. The little it takes each time makes a pile. It represents human desires, pleasures and bonds that can turn into chains. It is the confrontation with what dominates us.",
  },
  morte: {
    pt: "Nas fendas, a morte é o término. O corpo de linha antiga deixa de insistir ali, o mesmo padrão volta à camada, e a camada o levanta de novo noutro lugar. Representa o encerramento inevitável de ciclos. A morte simbólica de uma identidade, crença ou condição permite que algo novo surja.",
    en: "In the fissures, death is the termination. The body of an old line stops insisting there, the same pattern returns to the layer, and the layer raises it again elsewhere. It represents the inevitable ending of cycles. The symbolic death of an identity, belief or condition lets something new emerge.",
  },
  vida: {
    pt: "As sementes acordam uma por vez. A umidade as alcança em ritmos diferentes. A colheita é contada broto por broto no fim do ano. Representa o momento de confrontar as próprias escolhas, reconhecer a verdade e responder ao chamado da transformação.",
    en: "Seeds wake one at a time. Moisture reaches them at different paces. The harvest is counted sprout by sprout at year's end. It represents the moment of facing one's own choices, acknowledging the truth and answering the call of transformation.",
  },
  vigor: {
    pt: "O vigor das rodas cresce quanto mais a ladeira resiste, e o veículo atravessa lama e cascalho em marcha constante até o alto. Representa a vontade de avançar, superar obstáculos e conquistar objetivos. É a força que transforma intenção em movimento.",
    en: "The vigor of the wheels grows the more the slope resists, and the vehicle crosses mud and gravel at a steady pace all the way to the top. It represents the will to move forward, overcome obstacles and achieve goals. It is the force that turns intention into movement.",
  },
  marcial: {
    pt: "O marcial vive nas muralhas bem conservadas, com os blocos alinhados e os turnos de vigia escritos em quadro. O portão abre apenas por senha, e as escalas ficam afixadas no corredor da guarda. Representa a capacidade de estabelecer ordem, construir estruturas e assumir responsabilidades. É a figura que protege e organiza.",
    en: "Martial lives in well-kept ramparts, with the blocks aligned and the watch shifts written on a board. The gate opens only by password, and the rosters hang posted in the guardroom corridor. It represents the ability to establish order, build structures and take on responsibilities. It is the figure that protects and organizes.",
  },
  tempo: {
    pt: "O tempo fica de ponta-cabeça num relógio de areia preso a um fio que o sustenta. A pausa inverte a posição das coisas, e o que estava embaixo passa a ser visto de cima. Representa a necessidade de interromper o movimento habitual para enxergar o mundo de outra maneira. Às vezes, avançar exige abrir mão de algo.",
    en: "Time sits upside down in an hourglass tied to a thread that holds it. The pause inverts the position of things, and what lay below comes to be seen from above. It represents the need to interrupt the usual movement in order to see the world another way. Sometimes moving forward means letting go of something.",
  },
  som: {
    pt: "Som de duas cordas afinadas na mesma nota, em que uma vibra quando a outra é tocada. Afastadas, mudam de timbre, e juntas escolhem um tom comum. Representa os relacionamentos e a necessidade de escolher aquilo que realmente importa. Não se limita ao romance: envolve vínculos, valores e decisões.",
    en: "Sound of two strings tuned to the same note, where one vibrates when the other is plucked. Apart, they change timbre, and together they settle on a common tone. It represents relationships and the need to choose what truly matters. It is not limited to romance: it involves bonds, values and decisions.",
  },
  gravidade: {
    pt: "Ao se aproximarem, os corpos celestes são desviados pela gravidade de massas que nem sabiam existir, e o encontro traça uma rota nova. Representa aquele que inicia uma jornada sem conhecer completamente o caminho. É o estado de possibilidades infinitas, inocência e experimentação.",
    en: "As they draw near, celestial bodies are turned aside by the gravity of masses they did not know existed, and the meeting traces a new route. It represents the one who begins a journey without fully knowing the way. It is the state of infinite possibilities, innocence and experimentation.",
  },
  espaco: {
    pt: "No espaço, tudo o que existe cabe junto, da poeira à estrela mais distante, e as medidas somadas fecham o mapa por inteiro. A última folha do cartógrafo encaixa no traço da primeira. Representa a descoberta do significado da vida, a consciência da própria existência e a busca por compreender aquilo que nos torna humanos.",
    en: "In space, everything that exists fits together, from dust to the farthest star, and the summed measurements close the map entire. The cartographer's last sheet meets the line of the first. It represents the discovery of the meaning of life, the awareness of one's own existence and the search to understand what makes us human.",
  },
  fada: {
    pt: "A fada das encruzilhadas muda as coisas de lugar com um sopro. A mesa amanhece à esquerda, o banco à direita, e a casa segue o novo arranjo. Representa a natureza imprevisível da existência. A vida está em constante transformação, alternando oportunidades, perdas e recomeços.",
    en: "The fairy of the crossroads moves things from place to place with a breath. The table wakes on the left, the bench on the right, and the house keeps the new arrangement. It represents the unpredictable nature of existence. Life is in constant transformation, alternating opportunities, losses and new beginnings.",
  },
  industrial: {
    pt: "Na oficina, cobre e estanho são fundidos na proporção certa, e um cede ao outro um pouco da dureza, de modo que a liga suporta calor e golpe. Representa a capacidade de combinar elementos diferentes sem perder o equilíbrio. É a arte de encontrar uma medida sustentável entre extremos.",
    en: "In the workshop, copper and tin are fused in the right proportion, and each yields a little hardness to the other, so that the alloy withstands heat and blows. It represents the ability to combine different elements without losing balance. It is the art of finding a sustainable measure between extremes.",
  },
  planta: {
    pt: "A planta de raiz larga sombreia as mudas contra a geada, e as flores dela se abrem por todo o canteiro e pelos canteiros vizinhos. Representa a força criadora da vida. Está relacionada ao cuidado, à fertilidade, à beleza e à capacidade de fazer algo florescer.",
    en: "The broad-rooted plant shades its seedlings against the frost, and its flowers open across the whole bed and the beds that border it. It represents the creative force of life. It is related to care, fertility, beauty and the ability to make something flourish.",
  },
};

/** O texto do elemento base `id` no idioma, ou `undefined` (combinado, neutro ou id desconhecido). */
export const textoDoElementoBase = (id: string, isPt: boolean): string | undefined => {
  const t = TEXTOS_ELEMENTO_BASE[id];
  return t ? (isPt ? t.pt : t.en) : undefined;
};
