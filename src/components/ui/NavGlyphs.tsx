import { CSSProperties, memo, useEffect, useId, useState, type ReactNode } from 'react';

/**
 * Os GLIFOS PRÓPRIOS do Soulmon — o conjunto inteiro
 * ==================================================
 *
 * POR QUE ESTE ARQUIVO EXISTE
 * ---------------------------
 * No teste dos 200×200 (a nav recortada, sem logo e sem contexto) a barra
 * reprovava: Material Symbols Rounded + rótulo Rubik é a nav padrão do
 * Android — `home`/`casino`/`auto_awesome`/`storefront`/`more_horiz` são
 * indistinguíveis de qualquer app Material. A primeira rodada desenhou os
 * CINCO da navegação; a medição seguinte mostrou que o ganho tinha um teto:
 * com 45 Material espalhados pelo resto do app, o conjunto saiu de "nav do
 * Google" para "nav genérica no meio de ícones do Google".
 *
 * Esta rodada desenha o **segundo lote** — o deck do aparelho (alimentar,
 * itens, banho, dormir/acordar), a lista diária (concluir, marcar, expandir),
 * as moedas e os utilitários de toda tela (fechar, seta, cadeado, relógio,
 * carregando). O critério de corte não mudou: **um Material honesto é melhor
 * que um glifo próprio feio.** O que ficou em Material está listado no fim
 * deste bloco, com o motivo.
 *
 * CONVIVER COM O MATERIAL: A MÉTRICA É A MESMA
 * --------------------------------------------
 * Estes glifos não são "outro estilo", são o MESMO estilo com autoria. Por
 * isso copiam a métrica da Material Symbols Rounded, que é o que faz um ícone
 * próprio parecer parte do conjunto em vez de um adesivo colado:
 *
 *  · **caixa de 24dp** (`viewBox="0 0 24 24"`), mesmo grid do Material;
 *  · **traço 2.1** — o equivalente óptico do eixo `wght` 500 que o resto do
 *    app usa (o 400 do Material mede 2.0 em 24dp; 500 engrossa ~5%). O eixo
 *    `wght` do `Icon` continua valendo aqui: o traço é `2.1 × wght/500`, então
 *    um call-site que pedia 400 ou 600 continua recebendo o que pediu;
 *  · **pontas e junções redondas** (`linecap`/`linejoin` = round), que é
 *    literalmente o que "Rounded" quer dizer;
 *  · **o traço escala com o tamanho** (não há `vectorEffect`): em 32px o traço
 *    vira 2.8px, exatamente como o glifo de fonte engrossa junto.
 *
 * A ASSINATURA (o que faz o conjunto ser nosso)
 * ---------------------------------------------
 * Três motivos, repetidos de propósito em TODO o conjunto — é isso, e não o
 * fato de ser SVG, que faz a coisa ler como "nosso sistema":
 *
 *  1. **O ARCO** (meio-círculo de raio 2.4–3.6). Nasceu no visor do aparelho,
 *     a peça de marca do app. É a porta do Início, a alça da Loja, a trava da
 *     caixa de Itens, a haste do Cadeado, a cuba do prato, a cúpula do
 *     chuveiro, a lua e o anel do carregando.
 *  2. **O NÓ** (círculo cheio). É o miolo do Menu, os estágios da Evolução, o
 *     pino do D-pad, o segredo do Cadeado e a cabeça do spinner. Quando o glifo
 *     se enche, o nó vira **vazio** — é o que impede um ícone cheio de virar
 *     mancha (a porta do Início inaugurou a regra). O nó é sempre CHEIO, nunca
 *     um anelzinho: círculo de raio ~2 com traço 2.1 fecha o miolo em 20/24px, e
 *     aí vazio e cheio viram o mesmo desenho (era o defeito do `evolution`).
 *  3. **A CRUZ DIRECIONAL** do v-pet: o D-pad de Atividades, os raios do sol,
 *     os ponteiros do relógio, as pontas côncavas da fagulha.
 *
 * O EIXO FILL, REPRODUZIDO
 * ------------------------
 * O app usa `FILL 0→1` da Material como sistema de estado, e isso não podia
 * quebrar num ícone desenhado à mão. Aqui a mesma ideia sem fonte variável: o
 * contorno está SEMPRE desenhado e a camada sólida do MESMO desenho aparece
 * por cima com `opacity = fill`. É um glifo se preenchendo — não são dois
 * ícones trocando de lugar — e aceita valor fracionário igual ao eixo real.
 *
 * O VAZIO É UMA MÁSCARA, E ISSO É A PEÇA CENTRAL
 * ----------------------------------------------
 * "O glifo se enche e o furo continua vazio" é a tese deste arquivo, e a
 * primeira implementação a quebrava justamente onde ela importava: o furo era um
 * subpath `evenodd` DA CAMADA SÓLIDA, então o traço de contorno já desenhado
 * EMBAIXO preenchia o furo por baixo e ele sumia. Todo furo que era o contorno
 * geométrico de um traço caía exatamente sobre esse mesmo traço — `check_circle`
 * cheio virava um disco preto, e com ele o estado mais importante do app
 * (*concluída*) perdia a forma; `task_alt`, `schedule`, `diamond`, `eco` e o
 * segredo do `lock` tinham o mesmo defeito.
 *
 * Agora o glifo declara `holes` (`areaHole`/`nodeHole`/`strokeHole`) e o
 * componente monta com eles uma **máscara** aplicada às DUAS camadas de uma vez.
 * O furo passa a ser furo por construção, em qualquer glifo, sem que o desenho
 * precise saber quem está embaixo — era esse cuidado manual, camada por camada,
 * que produzia o bug. Um `strokeHole` traça o PRÓPRIO `d` do contorno (mais
 * grosso, ver `HOLE_STROKE_RATIO`): não existe mais contorno geométrico
 * calculado à mão para ficar fora de sincronia com o traço que ele apaga.
 *
 * **Glifo sem estado ativo não finge ter um.** `close`, `check`, as setas, os
 * chevrons e o `sync` não declaram camada sólida: o FILL neles é no-op, o que
 * é honesto (nenhum call-site pede fill neles) e melhor que inventar uma
 * versão "cheia" de um X.
 *
 * `prefers-reduced-motion` é lido em JS (`matchMedia`) e zera a transição da
 * camada sólida — o bloco global do `index.css` cobre `.sm2-icon`, mas não
 * alcança um `<g>` de SVG com transição inline.
 *
 * ÍCONE NUNCA DENTRO DE BOX
 * -------------------------
 * Nenhum glifo daqui desenha moldura, placa, fundo, halo ou padding, e o
 * componente não aceita prop que faça isso. O alvo de 44px é do BOTÃO.
 *
 * O QUE FICOU EM MATERIAL, DE PROPÓSITO
 * -------------------------------------
 * `star`, `pets`, `emoji_events`, `swords`, `psychology`, `spa`, `park`,
 * `settings`, `person`, `mood`, `palette`, `casino`(*) e os demais do
 * inventário. São desenhos figurativos (bicho, troféu, espada, cabeça) ou
 * formas que o mercado inteiro já leu mil vezes (a estrela): redesenhar à mão
 * traz risco de qualidade sem ganho de identidade. (*) `casino` NÃO é usado
 * como dado na nav — lá ele já é o D-pad.
 */

/* ────────────────────────────────────────────────────────────────────────────
   Geometria. Coordenadas cravadas no grid de 24; nada é gerado em tempo de
   execução — ícone é desenho, não cálculo.
   ──────────────────────────────────────────────────────────────────────── */

/** Casa com porta em ARCO. O telhado tem o ápice arredondado (r 2.2). */
const HOME_BODY =
  'M10.48 4.7A2.2 2.2 0 0 1 13.52 4.7L20.4 10.58A1.5 1.5 0 0 1 21 11.72'
  + 'V19.5A1.5 1.5 0 0 1 19.5 21H4.5A1.5 1.5 0 0 1 3 19.5V11.72'
  + 'a1.5 1.5 0 0 1 .6-1.14Z';
/** A porta: meio arco de r 2.5, o MESMO da alça da Loja. */
const HOME_DOOR = 'M9.5 21v-4.4a2.5 2.5 0 0 1 5 0V21';
/* O vazio da porta desce ABAIXO da base (22.4 contra 21): a base da casa é um
   traço de 2.1 e metade dele fica sob a linha do chão — sem esticar o furo
   sobrava uma lasca preta atravessando o vão da porta no estado cheio. */
const HOME_DOOR_HOLE = 'M9.5 22.4v-5.8a2.5 2.5 0 0 1 5 0V22.4';

/**
 * D-pad: cruz de braços LARGOS (7.6 de vão), cantos de ponta r 1.4 e cantos
 * CÔNCAVOS de r 0.7.
 *
 * A versão anterior tinha braço 6 com canto côncavo de r 2 — e r 2 de concavidade
 * contra braço 6 arredonda o braço inteiro: a cruz virava um TREVO DE QUATRO
 * PÉTALAS, e cheia em 20/24px lia como FLOR (medido na rasterização). É o ícone
 * central da nav, então o defeito custava caro. A correção é geométrica e não
 * cosmética: braço mais largo (o lado reto passa a existir de fato) e concavidade
 * de 0.7, que marca o encaixe sem comer o braço.
 *
 * **O 0.7 fica, e a decisão foi MEDIDA, não herdada.** A crítica é justa — com
 * 0.7 o encaixe côncavo (um dos três motivos da assinatura) some abaixo de
 * 32px. Só que a alternativa foi rasterizada: subindo a concavidade para 1.2 e
 * comparando pixel a pixel os oito quadros (20/24/32/42 × fill 0 e 1), a
 * diferença é de **0.6% dos pixels, e nenhum deles fora do antialias** — o
 * encaixe continua invisível, e o único efeito real é aproximar de novo o braço
 * do trevo que a rodada anterior matou. Recuperar o côncavo aqui custaria a
 * legibilidade do ícone central da nav; o motivo côncavo continua vivo onde ele
 * cabe (as pontas da fagulha). Não gaste a rodada nisto de novo.
 */
const DPAD =
  'M9.6 3h4.8a1.4 1.4 0 0 1 1.4 1.4V7.5a.7.7 0 0 0 .7.7H19.6a1.4 1.4 0 0 1 1.4 1.4'
  + 'v4.8a1.4 1.4 0 0 1-1.4 1.4H16.5a.7.7 0 0 0-.7.7V19.6a1.4 1.4 0 0 1-1.4 1.4'
  + 'h-4.8a1.4 1.4 0 0 1-1.4-1.4V16.5a.7.7 0 0 0-.7-.7H4.4a1.4 1.4 0 0 1-1.4-1.4'
  + 'v-4.8a1.4 1.4 0 0 1 1.4-1.4H7.5a.7.7 0 0 0 .7-.7V4.4A1.4 1.4 0 0 1 9.6 3Z';
/**
 * O EIXO do d-pad, e ele não é decoração: a cruz pelada lia como "adicionar"
 * (visto no app rodando, 32px) — o pior mal-entendido possível numa nav, porque
 * "+" é a ação mais comum do app. Com o pino no meio ela vira um botão
 * direcional. O pino é um NÓ (círculo CHEIO, não um anelzinho): anel de r 2.1
 * com traço 2.1 deixa um miolo de 1 px em 24 e some. No estado cheio ele vira
 * VAZIO, pelo mesmo motivo da porta do Início.
 */
const DPAD_HUB: [number, number, number] = [12, 12, 1.7];
const DPAD_HUB_HOLE: [number, number, number] = [12, 12, 2.05];

/**
 * EVOLUÇÃO — três nós CRESCENDO numa diagonal ascendente.
 *
 * O desenho anterior (três círculos iguais + um Y ligando) era tecnicamente a
 * mecânica do jogo (o galho que se divide), mas visualmente é o ícone de
 * COMPARTILHAR — círculos de mesmo tamanho unidos por hastes é o `share` do
 * Android, e foi assim que a avaliação leu. O que sobrou dele: os nós e a
 * diagonal. O que entrou: **tamanho**. Três estágios que crescem não têm
 * segunda leitura possível — é metamorfose, e é literalmente o que a página
 * mostra (a escada rookie→champion→ultimate→mega). Sem hastes de propósito:
 * ligação entre nós é exatamente o que dizia "rede".
 *
 * O nó menor tinha r 2.0 contra traço 2.1: sobrava um miolo de 0.95 de raio, que
 * em 20 e 24px FECHA — vazio e cheio viravam o mesmo desenho. Os três raios
 * subiram (2.3 / 3.0 / 3.7) e as distâncias entre centros foram abertas para que
 * nenhum par se toque com o traço de 2.1 (a menor folga é do par 2–3: 9.05 de
 * distância contra 8.8 de necessidade).
 */
const EVO_NODES: [number, number, number][] = [[5.2, 18.8, 2.3], [12, 12.4, 3.0], [18.6, 6.2, 3.7]];

/**
 * Sacola — QUARTA tentativa, e as três anteriores morreram pela mesma
 * restrição autoimposta: "a alça mora DENTRO da boca". Ela nasceu para matar o
 * balde (alça externa sobre corpo que afina), mas o preço era um retângulo
 * arredondado FECHADO com um arquinho solto no meio — em 20px cheio, um
 * quadrado preto com um entalhe branco. Pior: o entalhe era o MESMO arco da
 * porta do `home`, o vizinho imediato na barra.
 *
 * O que uma sacola tem e um balde não tem não é a alça por dentro — é a BOCA.
 * Agora são três peças: o **corpo** (lados retos), a **borda** que passa dele
 * (a boca, mais larga que o corpo — a lasca de traço que sobra dos dois lados é
 * o que diz "isto é um recipiente aberto") e a **alça ACIMA da boca**.
 *
 * E some o furo: a alça e a borda são TRAÇO e vivem no contorno, que é
 * desenhado sempre — inclusive sob a camada cheia. Cheio vira corpo sólido com
 * arco vazado por cima, que é a silhueta de sacola e de nada mais. Sem `holes`,
 * sem colisão de motivo com a porta do Início.
 */
const SHOP_BAG =
  'M6 9.4h12a1 1 0 0 1 1 1.05v7.15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7.15'
  + 'a1 1 0 0 1 1-1.05Z';
const SHOP_RIM = 'M4.2 9.4h15.6';
const SHOP_HANDLE = 'M9.2 9.4V7.6a2.8 2.8 0 0 1 5.6 0v1.8';

/**
 * MAPA (minimal-ui F1, 23/09/2026) — a folha dobrada em três painéis, com o
 * NÓ marcando o lugar. É o link único da Home para o Mapa (a barra inferior
 * saiu), então precisa ler como "mapa" sozinho, sem rótulo ao lado.
 *
 * As DOBRAS são traço de contorno e viram VAZIO no estado cheio
 * (`strokeHole`) — sem isso a folha cheia vira um retângulo torto e perde a
 * leitura. O nó fica no painel do meio, que é o motivo da assinatura (o NÓ);
 * cheio, ele se esvazia, pela mesma regra da porta do Início.
 */
const MAP_SHEET = 'M3.6 6.4 9 4.2l6 2.4 5.4-2.2v13.2L15 19.8l-6-2.4-5.4 2.2Z';
const MAP_FOLDS = 'M9 4.2v13.2M15 6.6v13.2';
const MAP_PIN: [number, number, number] = [12, 11.6, 1.6];
const MAP_PIN_HOLE: [number, number, number] = [12, 11.6, 2];

/** Menu: quatro nós. O mesmo círculo da Evolução, em grade. */
const MENU_NODES: [number, number, number][] = [
  [7.6, 7.6, 2.4], [16.4, 7.6, 2.4], [7.6, 16.4, 2.4], [16.4, 16.4, 2.4],
];

/** Coração: dois lobos de r 4.5 (o ARCO em par) descendo até a ponta. */
const HEART =
  'M12 20.4 5 13.1a4.5 4.5 0 0 1 0-6.4 4.5 4.5 0 0 1 6.4 0l.6.6.6-.6'
  + 'a4.5 4.5 0 0 1 6.4 0 4.5 4.5 0 0 1 0 6.4Z';

/** Raio. Junções redondas de propósito: um raio de ponta viva não é deste kit. */
const BOLT = 'M13.6 3.2 6.8 13.2h4.4l-.8 7.6 6.8-10h-4.4Z';

/**
 * ALIMENTAR — cuba + fumaça. A cuba é meio ARCO (o mesmo da porta, virado).
 * Garfo-e-faca (o `restaurant` do Material) é ícone de restaurante: fala de
 * refeição humana em mesa posta. Aqui a ação é dar comida ao bicho, e uma
 * tigela é o gesto certo — e cabe na gramática, o que garfo e faca cruzados
 * nunca iam caber.
 *
 * A comida ERA um NÓ pousado acima da cuba, e cheio isso é uma bola sobre uma
 * base: a leitura CABEÇA E OMBROS (ícone de pessoa) voltava mesmo com o pé. O
 * que sobe de uma tigela e não pode ser confundido com uma cabeça é FUMAÇA —
 * duas mechas em S. Sendo traço, elas sobrevivem ao estado cheio de graça.
 */
const BOWL = 'M4.4 11.6h15.2a7.6 7.6 0 0 1-15.2 0Z';
const BOWL_STEAM = 'M10.2 9.2q-1-1.2 0-2.4t0-2.4M13.8 9.2q-1-1.2 0-2.4t0-2.4';
/* O pé. Sem ele, cuba + nó lia como CABEÇA E OMBROS (um ícone de pessoa) no
   deck de 42px; com a linha embaixo vira um prato apoiado, e só isso. */
const BOWL_FOOT = 'M8.6 20.4h6.8';

/** Caixa de itens: tampa + corpo + trava em ARCO de r 2.4. */
/**
 * Caixa de itens: tampa LARGA e baixa + corpo estreito + trava em ARCO de 2.4.
 * A folga entre as duas peças e a diferença de largura são o que impede a
 * versão cheia de virar uma fatia de pão — que foi como ela leu em 32px quando
 * tampa e corpo tinham a mesma largura e se encostavam.
 *
 * **A folga tem que ser maior que o TRAÇO INTEIRO, não que meio traço.** A
 * rodada passada deixou 1.4 de vão (tampa até 9.4, corpo a partir de 10.8) e
 * isso é menos do que o próprio contorno gasta: a tampa desce 1.05 abaixo da
 * base (→10.45) e o corpo sobe 1.05 acima do topo (→9.75). Os dois se
 * SOBREPÕEM, tampa e corpo viram uma peça só e o glifo cheio lê como CAMISETA —
 * no deck da Home, a 42px, no ícone de "Itens".
 *
 * Agora o vão é **3.2** (8.4 → 11.6): 2.1 gastos pelos dois contornos e **1.1
 * de branco sobrando**, que é o que sobrevive à rasterização em 20px.
 */
const BOX_LID =
  'M4.2 4h15.6a1 1 0 0 1 1 1v2.4a1 1 0 0 1-1 1H4.2a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z';
const BOX_BODY = 'M5.6 11.6h12.8v6.8a2 2 0 0 1-2 2H7.6a2 2 0 0 1-2-2Z';
/* Bolsa (bag): a MOCHILA da Home (07/10/2026, pedido do dono: SVG genérico, outro que não o backpack nem a arte pixel). */
const BAG_BODY = 'M5.5 8.5h13l1.2 10.4a1.6 1.6 0 0 1-1.6 1.8H5.9a1.6 1.6 0 0 1-1.6-1.8Z';
const BAG_HANDLE = 'M9 11V7a3 3 0 0 1 6 0v4';
const BOX_LATCH = 'M9.6 11.6a2.4 2.4 0 0 0 4.8 0';

/**
 * Chuveiro: cúpula (ARCO r 6.4) + aro + a água caindo.
 *
 * A água era três NÓS em leque e o conjunto lia como uma CARINHA (dois olhos e
 * uma boca sob um chapéu) — visto em 32px. Traços verticais de comprimentos
 * diferentes leem como água caindo e só como isso.
 */
const SHOWER_DOME = 'M5.6 10.6a6.4 6.4 0 0 1 12.8 0';
const SHOWER_DOME_CLOSED = 'M5.6 10.6a6.4 6.4 0 0 1 12.8 0Z';
const SHOWER_RIM = 'M4.6 10.6h14.8';
const SHOWER_RAIN = 'M8.4 13.8v2.2M12 13.8v5M15.6 13.8v2.2';

/** Lua: dois ARCOS de r 8.9. É o único jeito de desenhar uma lua, e tudo bem. */
const MOON = 'M20.4 15.1A8.9 8.9 0 0 1 8.9 3.6 8.9 8.9 0 1 0 20.4 15.1Z';

/** Sol: NÓ grande + oito raios (a cruz direcional, e as diagonais dela). */
const SUN_CORE: [number, number, number] = [12, 12, 4.3];
const SUN_RAYS =
  'M12 5.4V3.2M12 18.6v2.2M5.4 12H3.2M18.6 12h2.2'
  + 'M7.33 7.33 5.78 5.78M16.67 16.67l1.55 1.55M16.67 7.33l1.55-1.55M7.33 16.67l-1.55 1.55';

/**
 * O CHEQUE, e ele é UM SÓ no app inteiro: o mesmo traço em `check`,
 * `check_circle` e `task_alt`. Quando o disco se enche, o VAZIO é ESTE MESMO
 * caminho declarado como `strokeHole` — nunca um contorno redesenhado à mão.
 */
const CHECK_IN_RING = 'M8 12.4 11 15.4 17.4 8';
const RING = 'M20.6 12a8.6 8.6 0 1 1-17.2 0 8.6 8.6 0 1 1 17.2 0Z';
/**
 * `task_alt`: o MESMO anel e o MESMO cheque, só que o cheque SAI por uma falha
 * do anel. Com o cheque contido, `task_alt` e `check_circle` ficavam
 * indistinguíveis em 20px — dois nomes para o mesmo desenho.
 *
 * **A camada cheia é o anel ABERTO fechado por uma corda** (`RING_DISC_OPEN`),
 * não o anel inteiro. Enchendo com o `RING` fechado o furo do cheque — que sai
 * do anel (ponta em 19.4,6, a 9.5 do centro contra raio 8.6) — atravessava a
 * borda do disco e abria uma MORDIDA numa parte cheia do desenho: em 20px, um
 * borrão torto. Com o disco já faltando a cunha por onde o cheque passa
 * (−22° a −54°, e o cheque cruza a borda em −38°, com folga angular dos dois
 * lados), o branco do furo cai onde o contorno também tem falha: cheio e vazio
 * viram o mesmo desenho, que é a tese do arquivo.
 */
const CHECK_OUT = 'M8 12.4 11 15.4 19.4 6';
const RING_OPEN = 'M19.97 8.78A8.6 8.6 0 1 1 17.05 5.04';
const RING_DISC_OPEN = `${RING_OPEN}Z`;
const CHECK_BARE = 'M5.2 12.6 9.8 17.2 18.8 6.8';
/* A EXCLAMAÇÃO (I8, 02/10/2026): o ícone das Missões do Torneio — "tem coisa a fazer".
   Haste em TRAÇO (ponta redonda, como o cheque) e o ponto é um NÓ. Nome próprio, não
   Material: `exclamation` não existe na fonte, então não depende do subset. */
const EXCLAMATION_STEM = 'M12 4.8v9.2';
const EXCLAMATION_DOT: [number, number, number] = [12, 18.6, 1.55];
/* A INTERROGAÇÃO (04/10/2026): o par da exclamação — "missão em andamento / à espera do
   'Fiz'", como o "?" amarelo do World of Warcraft. O gancho é TRAÇO (ponta redonda, mesmo
   peso da haste da exclamação) e o ponto é o MESMO nó, na mesma posição: lado a lado os dois
   glifos são irmãos. Nome próprio (`question`, não `help` — esse é o "?" em círculo do
   InfoTip), então também não depende do subset da fonte. */
const QUESTION_HOOK = 'M8.7 8.6a3.3 3.3 0 1 1 5.2 2.7c-1.2.8-1.9 1.5-1.9 3.1';
const QUESTION_DOT: [number, number, number] = [12, 18.6, 1.55];
const CLOSE = 'M6.4 6.4 17.6 17.6M17.6 6.4 6.4 17.6';
/* O mais. É a cruz direcional sem os cantos: por isso o D-pad da nav precisou
   do pino no meio — sem ele os dois desenhos disputavam o mesmo significado. */
const PLUS = 'M12 4.6v14.8M4.6 12h14.8';

/** Chevron e seta: um desenho só, girado. */
const CHEVRON = 'M9.6 5.4 16.2 12l-6.6 6.6';
const ARROW = 'M4.2 12h15.6M13.4 5.6 19.8 12l-6.4 6.4';

/** Créditos: losango + faceta. A faceta vira VAZIO no estado cheio. */
const GEM = 'M12 3.4 20.6 12 12 20.6 3.4 12Z';
/*
 * A MESA (o `table` da lapidação) — o traço vai de ARESTA A ARESTA.
 *
 * A faceta anterior era um traço curto solto no meio do losango, sem encostar em
 * aresta nenhuma: uma pílula flutuante, isto é, um SINAL DE MENOS dentro de um
 * losango — placa de proibição, e renderizada 7× por tela na Loja e no Menu.
 * Faceta que não nasce numa aresta não é faceta, é ruído.
 *
 * Um V de duas diagonais saindo do ápice também toca as arestas, foi desenhado
 * e foi DESCARTADO na rasterização: cheio, o vazio em V lê como CORAÇÃO em
 * 24/32/42px (visto ampliado, não deduzido). Trocar "proibido" por "curtir" não
 * é conserto. A mesa reta não tem essa segunda leitura.
 *
 * A altura é 9.2 e não o meio: ali o losango mede 11.6 de largura, o que dá
 * mesa larga E uma coroa de proporção de joia acima dela.
 * (6.2,9.2) e (17.8,9.2) caem exatamente sobre x+y=15.4 e x−y=8.6, as retas das
 * duas arestas de cima.
 *
 * O VAZIO para 2.85 antes de cada aresta — mais que a meia-largura do furo
 * (1.47) somada à espessura horizontal da aresta (1.48). Se ele fosse de ponta
 * a ponta DECEPARIA a coroa do losango cheio e ela ficaria boiando solta; assim
 * a coroa continua presa pelos dois cantos e a mesa lê como vinco, não corte.
 */
const GEM_FACET = 'M6.2 9.2H17.8';
const GEM_FACET_HOLE = 'M9.05 9.2H14.95';

/** Cadeado: corpo + haste em ARCO r 3.6 + o segredo, que é um NÓ. */
const LOCK_BODY =
  'M6.4 10.4h11.2a1.8 1.8 0 0 1 1.8 1.8v7a1.8 1.8 0 0 1-1.8 1.8H6.4'
  + 'a1.8 1.8 0 0 1-1.8-1.8v-7a1.8 1.8 0 0 1 1.8-1.8Z';
const LOCK_SHACKLE = 'M8.4 10.4V8a3.6 3.6 0 0 1 7.2 0v2.4';
/**
 * Aberto = a MESMA haste, DESENGATADA PARA O LADO.
 *
 * Antes a única diferença era a perna direita 2.4 mais curta, e a Loja renderiza
 * `lock` seis vezes a 24px: dois cadeados com o mesmo arco centrado sobre o
 * mesmo corpo são o mesmo ícone, e "travado/destravado" — que é a informação —
 * some. A correção é a que a Material usa: a haste SAI do lugar. O arco inteiro
 * anda 3.8 para a direita, o pé direito desaparece (a haste soltou) e o pé
 * esquerdo cai no corpo perto da borda. A silhueta muda de simétrica para
 * assimétrica, que é uma diferença que sobrevive a 20px.
 */
const LOCK_SHACKLE_OPEN = 'M12.2 10.4V8a3.6 3.6 0 0 1 7.2 0';
const LOCK_KEY: [number, number, number] = [12, 15.7, 1.55];
const LOCK_KEY_HOLE: [number, number, number] = [12, 15.7, 1.95];

/** Carregando: ARCO com falha + a cabeça, que é um NÓ. */
/* A falha fica na DIAGONAL (nordeste), e não em cima: anel com falha no topo é
   o símbolo de liga/desliga, e ninguém precisa achar que o app vai desligar. */
/*
 * O arco do `sync` PARA ANTES da cabeça (θ 8°, contra os −10° de antes) e a
 * cabeça é um nó de 1.7 solto em θ −16°. Antes o nó ficava exatamente na ponta
 * do arco e o `linecap` redondo o engolia: sobrava um anel quebrado igual ao do
 * `refresh` — dois nomes, um desenho.
 */
const SYNC_ARC = 'M20.12 13.14A8.2 8.2 0 1 1 13.42 3.93';
const SYNC_HEAD: [number, number, number] = [19.88, 9.74, 1.7];

/**
 * `refresh`/`replay`: arco MAIS FECHADO que o do `sync` (a falha é menor) e
 * farpa no lugar do nó. Carregar (nó solto = cabeça de cometa) e refazer (seta
 * na ponta do arco) passam a ter silhueta diferente, não só um detalhe de 1px.
 * `replay` continua sendo o espelho de `refresh` — é a mesma relação que a
 * Material usa entre os dois.
 */
const REFRESH_ARC = 'M20.08 10.58A8.2 8.2 0 1 1 13.42 3.93';
/* A farpa fica na PONTA DE CHEGADA do arco (o alto), apontando para dentro da
   falha, no sentido em que o traço estava andando. Antes ela ficava na ponta de
   PARTIDA e apontava para trás: virava um caroço na lateral do anel, que foi
   exatamente a leitura "três nomes, um desenho". */
const SYNC_HEAD_ARROW = 'M15.88 4.37 11.96 5.91 12.72 1.57Z';

/** Enviar: a seta de papel, com a dobra do meio (o vértice côncavo em 6.5). */
const SEND = 'M4.6 4.4 20.2 12 4.6 19.6 8.4 12Z';
/** Parar: o MESMO anel do `check_circle`, com o quadrado dentro. */
const STOP_SQUARE = 'M10.6 9.4h2.8a1.2 1.2 0 0 1 1.2 1.2v2.8a1.2 1.2 0 0 1-1.2 1.2h-2.8a1.2 1.2 0 0 1-1.2-1.2v-2.8a1.2 1.2 0 0 1 1.2-1.2Z';

/** Microfone: cápsula + berço em ARCO + haste. */
const MIC_CAPSULE = 'M12 3.4a3 3 0 0 1 3 3v4.6a3 3 0 0 1-6 0V6.4a3 3 0 0 1 3-3Z';
const MIC_CRADLE = 'M6.4 11.6a5.6 5.6 0 0 0 11.2 0';
const MIC_STEM = 'M12 17.2v3.2';

/** Relógio: anel + ponteiros (a cruz, quebrada nas 3h10). */
const CLOCK_HANDS = 'M12 6.8V12l3.6 2.2';

/**
 * Folha: dois ARCOS de raios diferentes + nervura que SAI da folha virando talo.
 *
 * Raio diferente nos dois lados já estava certo e não bastou: a avaliação leu
 * GRÃO DE CAFÉ, e o culpado é a nervura — um vinco reto que morre nas duas
 * pontas de uma amêndoa é literalmente o desenho do grão. A correção é o TALO.
 *
 * Só que a rodada anterior *disse* talo e não *desenhou* talo: a lâmina tinha a
 * ponta em 6,18.6 e a nervura começava em 4.6,19.4 — 2 unidades de sobra, que a
 * ponta REDONDA do traço de 2.1 (0.5×largura de avanço em cada extremidade)
 * engolia inteirinhas. Sobrava uma amêndoa com uma barra atravessada, ou seja
 * **Ø, o símbolo de proibido** — o pior mal-entendido possível para o ícone que
 * marca a maturidade de um hábito.
 *
 * Agora as duas correções juntas: a lâmina RECUOU (ponta em 7.4,17.2) e o talo
 * DESCE (até 3.6,21). Os três pontos vivem na mesma diagonal x+y = 24.6, então
 * o talo é a continuação exata da nervura, e sobram **5.4 unidades** de talo
 * fora da lâmina — mais que o dobro do que a ponta redonda consegue comer.
 *
 * O vazio cobre só o trecho DE DENTRO da lâmina: assim, cheio, o talo continua
 * desenhado (preto) do lado de fora, que é onde ele faz o trabalho.
 */
const LEAF = 'M7.4 17.2A13 13 0 0 1 19.6 5 10.5 10.5 0 0 1 7.4 17.2Z';
const LEAF_VEIN = 'M3.6 21 14.6 10';
const LEAF_VEIN_HOLE = 'M9.4 15.2 14.6 10';

/** Fagulha: estrela de 4 pontas CÔNCAVAS — a mesma concavidade do D-pad. */
const SPARK_BIG =
  'M11 5.6Q11.8 12.2 18.4 13Q11.8 13.8 11 20.4Q10.2 13.8 3.6 13Q10.2 12.2 11 5.6Z';
const SPARK_SMALL =
  'M18.4 3Q18.7 5.9 21.6 6.2Q18.7 6.5 18.4 9.4Q18.1 6.5 15.2 6.2Q18.1 5.9 18.4 3Z';

/*
 * MEDALHA (`military_tech`) — DESENHADA E DESCARTADA, de propósito.
 *
 * Fita + disco + nó no meio: nas duas tentativas (fita larga e fita estreita)
 * o conjunto leu como um COELHO em 20 e 32px — duas orelhas sobre uma cabeça
 * com um olho. Emblema é moeda do Torneio e aparece em 4 lugares raros; um
 * Material honesto vale mais que um glifo próprio que vira bicho. Fica na
 * fonte. Se um dia voltar, o caminho é a fita ATRÁS do disco (sem pontas
 * livres acima dele), que é como o Material resolve.
 */

function circles(nodes: [number, number, number][]) {
  return nodes.map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />);
}
function node([cx, cy, r]: [number, number, number]) {
  return <circle cx={cx} cy={cy} r={r} />;
}

/* ────────────────────────────────────────────────────────────────────────────
   OS TIPOS DE VAZIO. Um glifo declara seus furos com estas funções e mais
   nada — quem desenha um ícone novo não precisa saber COMO o furo é recortado.
   Era exatamente esse "cuidado manual" (contorno geométrico calculado à mão,
   camada por camada) que produziu o defeito do `check_circle`.
   ──────────────────────────────────────────────────────────────────────── */

/** Vazio de ÁREA: a forma inteira vira buraco (a porta da casa, a alça da sacola). */
function areaHole(d: string) {
  return <path d={d} stroke="none" />;
}
/** Vazio de ÁREA circular — o NÓ que se esvazia (o pino do D-pad, o segredo do cadeado). */
function nodeHole([cx, cy, r]: [number, number, number]) {
  return <circle cx={cx} cy={cy} r={r} stroke="none" />;
}
/**
 * Vazio de TRAÇO: o MESMO caminho do contorno vira buraco. É o caso do cheque,
 * dos ponteiros do relógio, da faceta e da nervura — nenhum deles redesenha
 * contorno à mão. A máscara traça o próprio `d` um pouco mais grosso que o
 * traço (`HOLE_STROKE_RATIO`), o que garante que a ponta redonda também saia.
 */
function strokeHole(d: string) {
  return <path d={d} fill="none" />;
}

interface GlyphDef {
  /** Sempre desenhado, em traço. */
  outline: ReactNode;
  /**
   * A MESMA forma, cheia — SILHUETA PURA, sem `fill-rule` e sem furo embutido.
   * Ausente = o glifo não tem estado ativo.
   */
  solid?: ReactNode;
  /**
   * Os VAZIOS, como formas POSITIVAS (`areaHole`/`nodeHole`/`strokeHole`). Viram
   * uma MÁSCARA que corta as DUAS camadas de uma vez, com opacidade = `fill`.
   */
  holes?: ReactNode;
  /** Giro em graus sobre o centro (12,12) — chevrons e setas. */
  rotate?: number;
  /** Espelho horizontal — `replay` é `refresh` ao contrário. */
  flip?: boolean;
}

const GLYPHS: Record<string, GlyphDef> = {
  /* ── Navegação (os cinco da barra; `Icon` também os alcança pelos nomes
        Material equivalentes, logo abaixo) ─────────────────────────────── */
  home: {
    outline: <><path d={HOME_BODY} /><path d={HOME_DOOR} /></>,
    solid: <path d={HOME_BODY} />,
    holes: <>{areaHole(`${HOME_DOOR_HOLE}Z`)}{strokeHole(HOME_DOOR_HOLE)}</>,
  },
  activities: {
    outline: <><path d={DPAD} /><g fill="currentColor" stroke="none">{node(DPAD_HUB)}</g></>,
    solid: <path d={DPAD} />,
    holes: nodeHole(DPAD_HUB_HOLE),
  },
  evolution: {
    outline: <>{circles(EVO_NODES)}</>,
    solid: <>{circles(EVO_NODES)}</>,
  },
  shop: {
    outline: <><path d={SHOP_BAG} /><path d={SHOP_RIM} /><path d={SHOP_HANDLE} /></>,
    solid: <path d={SHOP_BAG} />,
  },
  menu: {
    outline: <>{circles(MENU_NODES)}</>,
    solid: <>{circles(MENU_NODES)}</>,
  },
  map: {
    outline: (
      <><path d={MAP_SHEET} /><path d={MAP_FOLDS} /><g fill="currentColor" stroke="none">{node(MAP_PIN)}</g></>
    ),
    solid: <path d={MAP_SHEET} />,
    holes: <>{strokeHole(MAP_FOLDS)}{nodeHole(MAP_PIN_HOLE)}</>,
  },

  /* ── Deck do aparelho: aparece em TODA sessão ─────────────────────────── */
  favorite: { outline: <path d={HEART} />, solid: <path d={HEART} /> },
  bolt: { outline: <path d={BOLT} />, solid: <path d={BOLT} /> },
  restaurant: {
    /* O PÉ é traço e vive no CONTORNO, que é desenhado sempre — inclusive
       debaixo do estado cheio. É o que devolve o pé ao prato preenchido (sem
       ele volta o "cabeça e ombros" que este desenho existe para evitar). */
    outline: <><path d={BOWL} /><path d={BOWL_FOOT} /><path d={BOWL_STEAM} /></>,
    solid: <path d={BOWL} />,
  },
  bag: {
    outline: <><path d={BAG_BODY} /><path d={BAG_HANDLE} /></>,
    solid: <path d={BAG_BODY} />,
  },
  inventory_2: {
    outline: <><path d={BOX_LID} /><path d={BOX_BODY} /><path d={BOX_LATCH} /></>,
    solid: <><path d={BOX_LID} /><path d={BOX_BODY} /></>,
    holes: <>{areaHole(`${BOX_LATCH}Z`)}{strokeHole(BOX_LATCH)}</>,
  },
  shower: {
    outline: <><path d={SHOWER_DOME} /><path d={SHOWER_RIM} /><path d={SHOWER_RAIN} /></>,
    solid: <path d={SHOWER_DOME_CLOSED} />,
  },
  bedtime: { outline: <path d={MOON} />, solid: <path d={MOON} /> },
  wb_sunny: {
    outline: <>{node(SUN_CORE)}<path d={SUN_RAYS} /></>,
    solid: <>{node(SUN_CORE)}</>,
  },

  /* ── Lista diária: concluir, marcar, expandir ─────────────────────────── */
  task_alt: {
    outline: <><path d={RING_OPEN} /><path d={CHECK_OUT} /></>,
    solid: <path d={RING_DISC_OPEN} />,
    holes: strokeHole(CHECK_OUT),
  },
  check_circle: {
    outline: <><path d={RING} /><path d={CHECK_IN_RING} /></>,
    solid: <path d={RING} />,
    holes: strokeHole(CHECK_IN_RING),
  },
  check: { outline: <path d={CHECK_BARE} /> },
  exclamation: {
    outline: <><path d={EXCLAMATION_STEM} /><g fill="currentColor" stroke="none">{node(EXCLAMATION_DOT)}</g></>,
  },
  question: {
    outline: <><path d={QUESTION_HOOK} /><g fill="currentColor" stroke="none">{node(QUESTION_DOT)}</g></>,
  },
  close: { outline: <path d={CLOSE} /> },
  add: { outline: <path d={PLUS} /> },
  chevron_right: { outline: <path d={CHEVRON} /> },
  chevron_left: { outline: <path d={CHEVRON} />, rotate: 180 },
  expand_more: { outline: <path d={CHEVRON} />, rotate: 90 },
  expand_less: { outline: <path d={CHEVRON} />, rotate: -90 },
  arrow_forward: { outline: <path d={ARROW} /> },
  arrow_back: { outline: <path d={ARROW} />, rotate: 180 },

  /* ── Moedas, estados e utilitários de toda tela ───────────────────────── */
  diamond: {
    outline: <><path d={GEM} /><path d={GEM_FACET} /></>,
    solid: <path d={GEM} />,
    holes: strokeHole(GEM_FACET_HOLE),
  },
  /* A haste do cadeado é TRAÇO nas duas camadas. Antes a camada sólida
     PREENCHIA o caminho ABERTO da haste — vira uma lente colada no corpo, e era
     por isso que `lock` e `lock_open` cheios ficavam o mesmo desenho de bolsa.
     Desenhada só no contorno (que nunca sai), ela sobrevive ao estado cheio com
     a forma certa, e a perna que falta no `lock_open` volta a se ver. */
  lock: {
    outline: (
      <>
        <path d={LOCK_BODY} /><path d={LOCK_SHACKLE} />
        <g fill="currentColor" stroke="none">{node(LOCK_KEY)}</g>
      </>
    ),
    solid: <path d={LOCK_BODY} />,
    holes: nodeHole(LOCK_KEY_HOLE),
  },
  lock_open: {
    outline: (
      <>
        <path d={LOCK_BODY} /><path d={LOCK_SHACKLE_OPEN} />
        <g fill="currentColor" stroke="none">{node(LOCK_KEY)}</g>
      </>
    ),
    solid: <path d={LOCK_BODY} />,
    holes: nodeHole(LOCK_KEY_HOLE),
  },
  sync: {
    outline: <><path d={SYNC_ARC} /><g fill="currentColor" stroke="none">{node(SYNC_HEAD)}</g></>,
  },
  refresh: {
    outline: (
      <><path d={REFRESH_ARC} /><g fill="currentColor" stroke="none"><path d={SYNC_HEAD_ARROW} /></g></>
    ),
  },
  replay: {
    outline: (
      <><path d={REFRESH_ARC} /><g fill="currentColor" stroke="none"><path d={SYNC_HEAD_ARROW} /></g></>
    ),
    flip: true,
  },
  mic: {
    outline: <><path d={MIC_CAPSULE} /><path d={MIC_CRADLE} /><path d={MIC_STEM} /></>,
    solid: <path d={MIC_CAPSULE} />,
  },
  send: { outline: <path d={SEND} />, solid: <path d={SEND} /> },
  stop_circle: {
    outline: <><path d={RING} /><path d={STOP_SQUARE} /></>,
    solid: <path d={RING} />,
    holes: <>{areaHole(STOP_SQUARE)}{strokeHole(STOP_SQUARE)}</>,
  },
  schedule: {
    outline: <><path d={RING} /><path d={CLOCK_HANDS} /></>,
    solid: <path d={RING} />,
    holes: strokeHole(CLOCK_HANDS),
  },
  eco: {
    outline: <><path d={LEAF} /><path d={LEAF_VEIN} /></>,
    solid: <path d={LEAF} />,
    holes: strokeHole(LEAF_VEIN_HOLE),
  },
  auto_awesome: {
    outline: <><path d={SPARK_BIG} /><path d={SPARK_SMALL} /></>,
    solid: <><path d={SPARK_BIG} /><path d={SPARK_SMALL} /></>,
  },
};

/* Os nomes Material que a nav já resolvia à mão. Ficam como ALIAS para que um
   call-site qualquer (`Icon name="home"`, hoje o `CornerLink`; antes, fora da
   `BottomNav` que saiu na minimal-ui F1) receba o mesmo desenho —
   duas casas diferentes na mesma sessão seria o pior dos dois mundos. */
GLYPHS.casino = GLYPHS.activities;
GLYPHS.storefront = GLYPHS.shop;
GLYPHS.shopping_bag = GLYPHS.shop;
GLYPHS.more_horiz = GLYPHS.menu;

/** Os glifos que a NAVEGAÇÃO usa: Home ↔ Mapa, o menu da Home, o voltar das
 *  áreas e os ícones das áreas no Mapa. */
export type NavGlyphName = 'home' | 'map' | 'menu' | 'arrow_back' | 'activities' | 'evolution' | 'shop';
export type GlyphName = string;

/** Existe glifo próprio para este nome? É o que o `Icon` pergunta. */
export function hasGlyph(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(GLYPHS, name);
}

/** Só para inspeção/teste — a lista do que já saiu do Material. */
export const GLYPH_NAMES = Object.keys(GLYPHS);

/** O equivalente óptico do `wght` 500 do Material em caixa de 24dp. */
const STROKE_AT_500 = 2.1;

/**
 * Quanto o vazio de TRAÇO é mais grosso que o traço que ele apaga. Precisa ser
 * >1 por duas razões: a ponta REDONDA do traço avança 0.5×largura além do fim
 * geométrico (era o que deixava tocos pretos), e um vazio rente ao traço vira
 * uma costura de antialias em vez de um furo legível em 20px.
 */
const HOLE_STROKE_RATIO = 1.4;

function clamp(v: number, lo: number, hi: number) { return v < lo ? lo : v > hi ? hi : v; }

/**
 * `prefers-reduced-motion` em JS: o `@media` global do `index.css` zera a
 * transição de `.sm2-icon`, mas não alcança a transição inline do `<g>` sólido.
 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

export interface GlyphSvgProps {
  name: string;
  /** Tamanho renderizado em px. */
  size?: number;
  /** Eixo de estado, 0 (contorno) a 1 (preenchido). Interpolável. */
  fill?: number;
  /** Eixo wght do `Icon`, 100–700: vira espessura de traço. */
  weight?: number;
  style?: CSSProperties;
}

/**
 * O DESENHO puro — sem `<span>`, sem classe de tom, sem aria. Quem monta a
 * casca é o `Icon` (ou o `NavGlyph` abaixo), justamente para que a casca do
 * ícone próprio seja **byte a byte** a mesma do ícone Material.
 */
export function GlyphSvg({ name, size = 24, fill = 0, weight = 500, style }: GlyphSvgProps) {
  const glyph = GLYPHS[name];
  const reduced = usePrefersReducedMotion();
  const uid = useId();
  if (!glyph) return null;

  const f = clamp(fill, 0, 1);
  const stroke = STROKE_AT_500 * (clamp(weight, 100, 700) / 500);
  const transform = [
    glyph.flip ? 'translate(24 0) scale(-1 1)' : '',
    glyph.rotate ? `rotate(${glyph.rotate} 12 12)` : '',
  ].filter(Boolean).join(' ') || undefined;
  const ease = reduced ? 'none' : 'opacity var(--sm2-dur-tap) var(--sm2-ease)';
  const maskId = glyph.holes ? `sm2-hole-${uid.replace(/:/g, '')}` : undefined;

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      focusable="false"
      aria-hidden="true"
      style={{ display: 'block', ...style }}
    >
      {/* A MÁSCARA DO VAZIO. Branco = fica; preto = furo. Ela é aplicada ao
          grupo INTEIRO (contorno + sólido), e é aí que mora a correção: antes o
          furo era um subpath `evenodd` só da camada sólida, então o traço já
          desenhado embaixo o preenchia por baixo e o furo sumia — foi assim que
          o `check_circle` cheio virou um disco preto. Cortando as duas camadas
          de uma vez, "vazio" quer dizer vazio em qualquer glifo, e um desenho
          novo não precisa de cuidado manual nenhum para herdar isso.
          A opacidade do furo é o próprio `fill`: em 0.5 o cheque está meio
          aberto, como no eixo real da fonte. */}
      {maskId ? (
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
          <rect x="0" y="0" width="24" height="24" fill="#fff" />
          <g
            fill="#000"
            stroke="#000"
            strokeWidth={stroke * HOLE_STROKE_RATIO}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: f, transition: ease }}
          >
            {glyph.holes}
          </g>
        </mask>
      ) : null}
      {/* O `transform` fica FORA do grupo mascarado: assim a máscara é sempre
          lida no grid de 24 cru, sem depender de o navegador transformar (ou
          não) a máscara junto com o elemento que a referencia. */}
      <g transform={transform}>
        <g mask={maskId ? `url(#${maskId})` : undefined}>
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {glyph.outline}
          </g>
          {glyph.solid ? (
            <g fill="currentColor" style={{ opacity: f, transition: ease }}>
              {glyph.solid}
            </g>
          ) : null}
        </g>
      </g>
    </svg>
  );
}

/** Mesmo vocabulário de tom do `Icon` — todos são tokens de TINTA. */
export type NavGlyphTone = 'ink' | 'muted' | 'primary' | 'inherit';

const TONE_CLASS: Record<NavGlyphTone, string> = {
  ink: 'sm2-icon-ink',
  muted: 'sm2-icon-muted',
  primary: 'sm2-icon-primary',
  inherit: '',
};

export interface NavGlyphProps {
  name: NavGlyphName;
  /** Tamanho renderizado em px. Padrão 24 (a nav pede 32). */
  size?: number;
  /** Eixo de estado, 0 (contorno) a 1 (preenchido). Interpolável. */
  fill?: number;
  tone?: NavGlyphTone;
  /** Ausente = decorativo (`aria-hidden`), que é o caso da nav: há rótulo. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * A casca da NAV. O `<span>` externo reusa a classe `.sm2-icon` porque ela é
 * justamente o contrato do "ícone pelado" (não declara `background`, `border`
 * nem `padding`) e porque é dela que vêm as classes de TINTA — que o SVG
 * consome por `currentColor`.
 */
function NavGlyphBase({
  name, size = 24, fill = 0, tone = 'inherit', label, className, style,
}: NavGlyphProps) {
  const f = clamp(fill, 0, 1);
  const vars = { '--sm2-icon-fill': String(f) } as CSSProperties;
  const classes = ['sm2-icon', TONE_CLASS[tone], className].filter(Boolean).join(' ');

  return (
    <span
      className={classes}
      style={{ fontSize: size, width: size, height: size, ...vars, ...style }}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <GlyphSvg name={name} size={size} fill={f} />
    </span>
  );
}

/** `memo` pelo mesmo motivo do `Icon`: props primitivas, muitas instâncias. */
export const NavGlyph = memo(NavGlyphBase);
export default NavGlyph;
