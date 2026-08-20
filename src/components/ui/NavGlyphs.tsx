import { CSSProperties, memo, useEffect, useState, type ReactNode } from 'react';

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
 *  2. **O NÓ** (círculo cheio). É o miolo do Menu, os estágios da Evolução, as
 *     gotas do banho, o segredo do Cadeado, a estrela da medalha e a cabeça do
 *     spinner. Quando o glifo se enche, o nó vira **vazio** — é o que impede um
 *     ícone cheio de virar mancha (a porta do Início inaugurou a regra).
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

/** D-pad: cruz de braços 6, cantos convexos e CÔNCAVOS de r 2. */
const DPAD =
  'M11 3h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2'
  + 'a2 2 0 0 0-2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2a2 2 0 0 0-2-2H5'
  + 'a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2a2 2 0 0 0 2-2V5a2 2 0 0 1 2-2Z';
/**
 * O EIXO do d-pad, e ele não é decoração: a cruz pelada lia como "adicionar"
 * (visto no app rodando, 32px) — o pior mal-entendido possível numa nav, porque
 * "+" é a ação mais comum do app. Com o pino no meio ela vira um botão
 * direcional. No estado cheio o pino é um VAZIO, pelo mesmo motivo da porta.
 */
const DPAD_HUB = 'M14.1 12a2.1 2.1 0 1 0-4.2 0 2.1 2.1 0 1 0 4.2 0Z';

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
 */
const EVO_NODES: [number, number, number][] = [[5.9, 18.1, 2.0], [12, 12.8, 2.8], [18.1, 7, 3.6]];

/**
 * Sacola: trapézio de cantos r 1.2 + alça em ARCO de r 3 — o MESMO arco da
 * porta do Início. A boca desceu para y 9.5 (era 8.5) porque com a alça
 * aparecendo só 1.5 acima do corpo o glifo lia como BALDE em 32px.
 */
const SHOP_BAG =
  'M6.2 9.5h11.6a1.2 1.2 0 0 1 1.19 1.33l-1.15 9.11A1.2 1.2 0 0 1 16.65 21'
  + 'H7.35a1.2 1.2 0 0 1-1.19-1.06L5.01 10.83A1.2 1.2 0 0 1 6.2 9.5Z';
const SHOP_HANDLE = 'M9 9.5V7.6a3 3 0 0 1 6 0v1.9';

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
 * ALIMENTAR — cuba + nó. A cuba é meio ARCO (o mesmo da porta, virado) e a
 * comida é um NÓ. Garfo-e-faca (o `restaurant` do Material) é ícone de
 * restaurante: fala de refeição humana em mesa posta. Aqui a ação é dar comida
 * ao bicho, e uma tigela é o gesto certo — e cabe na gramática, o que garfo e
 * faca cruzados nunca iam caber.
 */
const BOWL = 'M4.4 11.6h15.2a7.6 7.6 0 0 1-15.2 0Z';
const BOWL_FOOD: [number, number, number] = [12, 7.2, 2.2];
/* O pé. Sem ele, cuba + nó lia como CABEÇA E OMBROS (um ícone de pessoa) no
   deck de 42px; com a linha embaixo vira um prato apoiado, e só isso. */
const BOWL_FOOT = 'M8.6 20.4h6.8';

/** Caixa de itens: tampa + corpo + trava em ARCO de r 2.4. */
/**
 * Caixa de itens: tampa LARGA e baixa + corpo estreito + trava em ARCO de 2.4.
 * A folga entre as duas peças (9.6 → 10.5) e a diferença de largura são o que
 * impede a versão cheia de virar uma fatia de pão — que foi como ela leu em
 * 32px quando tampa e corpo tinham a mesma largura e se encostavam.
 */
const BOX_LID =
  'M4.2 4.4h15.6a1 1 0 0 1 1 1v2.8a1 1 0 0 1-1 1H4.2a1 1 0 0 1-1-1V5.4a1 1 0 0 1 1-1Z';
const BOX_BODY = 'M5.6 10.8h12.8v7.6a2 2 0 0 1-2 2H7.6a2 2 0 0 1-2-2Z';
const BOX_LATCH = 'M9.6 10.8a2.4 2.4 0 0 0 4.8 0';

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
 * `check_circle` e `task_alt`. `CHECK_HOLE` é o contorno geométrico desse
 * mesmo traço (largura 2.1, junção em esquadria), usado como VAZIO quando o
 * disco se enche — de novo a regra da porta do Início.
 */
const CHECK_IN_RING = 'M8 12.4 11 15.4 17.4 8';
const CHECK_HOLE = 'M7.26 13.14 11.06 16.94 18.19 8.69 16.61 7.31 10.94 13.86 8.74 11.66Z';
const RING = 'M20.6 12a8.6 8.6 0 1 1-17.2 0 8.6 8.6 0 1 1 17.2 0Z';
/**
 * `task_alt`: o MESMO anel e o MESMO cheque, só que o cheque SAI por uma falha
 * do anel. Com o cheque contido, `task_alt` e `check_circle` ficavam
 * indistinguíveis em 20px — dois nomes para o mesmo desenho.
 */
const CHECK_OUT = 'M8 12.4 11 15.4 19.4 6';
const CHECK_OUT_HOLE = 'M7.26 13.14 11.04 16.93 20.18 6.7 18.62 5.3 10.96 13.87 8.74 11.66Z';
const RING_OPEN = 'M19.97 8.78A8.6 8.6 0 1 1 17.05 5.04';
const CHECK_BARE = 'M5.2 12.6 9.8 17.2 18.8 6.8';
const CLOSE = 'M6.4 6.4 17.6 17.6M17.6 6.4 6.4 17.6';
/* O mais. É a cruz direcional sem os cantos: por isso o D-pad da nav precisou
   do pino no meio — sem ele os dois desenhos disputavam o mesmo significado. */
const PLUS = 'M12 4.6v14.8M4.6 12h14.8';

/** Chevron e seta: um desenho só, girado. */
const CHEVRON = 'M9.6 5.4 16.2 12l-6.6 6.6';
const ARROW = 'M4.2 12h15.6M13.4 5.6 19.8 12l-6.4 6.4';

/** Créditos: losango + faceta. A faceta vira VAZIO no estado cheio. */
const GEM = 'M12 3.4 20.6 12 12 20.6 3.4 12Z';
const GEM_FACET = 'M7.9 7.9h8.2';
const GEM_FACET_HOLE = 'M7.9 6.85h8.2v2.1H7.9Z';

/** Cadeado: corpo + haste em ARCO r 3.6 + o segredo, que é um NÓ. */
const LOCK_BODY =
  'M6.4 10.4h11.2a1.8 1.8 0 0 1 1.8 1.8v7a1.8 1.8 0 0 1-1.8 1.8H6.4'
  + 'a1.8 1.8 0 0 1-1.8-1.8v-7a1.8 1.8 0 0 1 1.8-1.8Z';
const LOCK_SHACKLE = 'M8.4 10.4V8a3.6 3.6 0 0 1 7.2 0v2.4';
/** Aberto = a MESMA haste sem a perna direita descendo. */
const LOCK_SHACKLE_OPEN = 'M8.4 10.4V8a3.6 3.6 0 0 1 7.2 0';
const LOCK_KEY: [number, number, number] = [12, 15.7, 1.55];
const LOCK_KEY_HOLE = 'M13.55 15.7a1.55 1.55 0 1 0-3.1 0 1.55 1.55 0 1 0 3.1 0Z';

/** Carregando: ARCO com falha + a cabeça, que é um NÓ. */
/* A falha fica na DIAGONAL (nordeste), e não em cima: anel com falha no topo é
   o símbolo de liga/desliga, e ninguém precisa achar que o app vai desligar. */
const SYNC_ARC = 'M20.08 10.58A8.2 8.2 0 1 1 13.42 3.93';
const SYNC_HEAD: [number, number, number] = [20.08, 10.58, 1.5];

/**
 * `refresh`/`replay`: o MESMO arco do `sync`, com farpa no lugar do nó. A
 * diferença entre carregar (nó = cabeça de spinner) e refazer (seta) fica na
 * ponta, não em dois desenhos diferentes. `replay` é o espelho de `refresh`.
 */
const SYNC_HEAD_ARROW = 'M20.62 13.63 22.25 9.59 17.71 10.39Z';

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
const CLOCK_HANDS_HOLE = 'M10.95 6.8 10.95 12.59 15.06 14.75 16.14 13.65 13.05 11.41 13.05 6.8Z';

/** Folha: dois ARCOS de r 15 se encontrando em ponta + nervura. */
/* Raios DIFERENTES nos dois lados: uma vesica simétrica com nervura no meio é
   um grão de café, não uma folha. */
const LEAF = 'M4.8 19.2A15 15 0 0 1 19.2 4.8 11 11 0 0 1 4.8 19.2Z';
const LEAF_VEIN = 'M6.6 17.4 15.6 8.4';
const LEAF_VEIN_HOLE = 'M5.86 16.66 14.86 7.66 16.34 9.14 7.34 18.14Z';

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

interface GlyphDef {
  /** Sempre desenhado, em traço. */
  outline: ReactNode;
  /** A MESMA forma, cheia. Ausente = o glifo não tem estado ativo. */
  solid?: ReactNode;
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
    // `evenodd` + a porta FECHADA: no estado cheio a casa é sólida e a porta
    // continua sendo um vazio — é o que impede o glifo de virar uma mancha.
    solid: <path fillRule="evenodd" d={`${HOME_BODY}${HOME_DOOR}Z`} />,
  },
  activities: {
    outline: <><path d={DPAD} /><circle cx={12} cy={12} r={2.1} /></>,
    solid: <path fillRule="evenodd" d={`${DPAD}${DPAD_HUB}`} />,
  },
  evolution: {
    outline: <>{circles(EVO_NODES)}</>,
    solid: <>{circles(EVO_NODES)}</>,
  },
  shop: {
    outline: <><path d={SHOP_BAG} /><path d={SHOP_HANDLE} /></>,
    solid: <path d={SHOP_BAG} />,
  },
  menu: {
    outline: <>{circles(MENU_NODES)}</>,
    solid: <>{circles(MENU_NODES)}</>,
  },

  /* ── Deck do aparelho: aparece em TODA sessão ─────────────────────────── */
  favorite: { outline: <path d={HEART} />, solid: <path d={HEART} /> },
  bolt: { outline: <path d={BOLT} />, solid: <path d={BOLT} /> },
  restaurant: {
    outline: <><path d={BOWL} /><path d={BOWL_FOOT} />{node(BOWL_FOOD)}</>,
    solid: <><path d={BOWL} />{node(BOWL_FOOD)}</>,
  },
  inventory_2: {
    outline: <><path d={BOX_LID} /><path d={BOX_BODY} /><path d={BOX_LATCH} /></>,
    solid: <><path d={BOX_LID} /><path fillRule="evenodd" d={`${BOX_BODY}${BOX_LATCH}Z`} /></>,
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
    solid: <path fillRule="evenodd" d={`${RING}${CHECK_OUT_HOLE}`} />,
  },
  check_circle: {
    outline: <><path d={RING} /><path d={CHECK_IN_RING} /></>,
    solid: <path fillRule="evenodd" d={`${RING}${CHECK_HOLE}`} />,
  },
  check: { outline: <path d={CHECK_BARE} /> },
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
    solid: <path fillRule="evenodd" d={`${GEM}${GEM_FACET_HOLE}`} />,
  },
  lock: {
    outline: (
      <>
        <path d={LOCK_BODY} /><path d={LOCK_SHACKLE} />
        <g fill="currentColor" stroke="none">{node(LOCK_KEY)}</g>
      </>
    ),
    solid: <><path d={LOCK_SHACKLE} /><path fillRule="evenodd" d={`${LOCK_BODY}${LOCK_KEY_HOLE}`} /></>,
  },
  lock_open: {
    outline: (
      <>
        <path d={LOCK_BODY} /><path d={LOCK_SHACKLE_OPEN} />
        <g fill="currentColor" stroke="none">{node(LOCK_KEY)}</g>
      </>
    ),
    solid: <path fillRule="evenodd" d={`${LOCK_BODY}${LOCK_KEY_HOLE}`} />,
  },
  sync: {
    outline: <><path d={SYNC_ARC} /><g fill="currentColor" stroke="none">{node(SYNC_HEAD)}</g></>,
  },
  refresh: {
    outline: (
      <><path d={SYNC_ARC} /><g fill="currentColor" stroke="none"><path d={SYNC_HEAD_ARROW} /></g></>
    ),
  },
  replay: {
    outline: (
      <><path d={SYNC_ARC} /><g fill="currentColor" stroke="none"><path d={SYNC_HEAD_ARROW} /></g></>
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
    solid: <path fillRule="evenodd" d={`${RING}${STOP_SQUARE}`} />,
  },
  schedule: {
    outline: <><path d={RING} /><path d={CLOCK_HANDS} /></>,
    solid: <path fillRule="evenodd" d={`${RING}${CLOCK_HANDS_HOLE}`} />,
  },
  eco: {
    outline: <><path d={LEAF} /><path d={LEAF_VEIN} /></>,
    solid: <path fillRule="evenodd" d={`${LEAF}${LEAF_VEIN_HOLE}`} />,
  },
  auto_awesome: {
    outline: <><path d={SPARK_BIG} /><path d={SPARK_SMALL} /></>,
    solid: <><path d={SPARK_BIG} /><path d={SPARK_SMALL} /></>,
  },
};

/* Os nomes Material que a nav já resolvia à mão. Ficam como ALIAS para que um
   call-site fora da `BottomNav` (`Icon name="home"`) receba o mesmo desenho —
   duas casas diferentes na mesma sessão seria o pior dos dois mundos. */
GLYPHS.casino = GLYPHS.activities;
GLYPHS.storefront = GLYPHS.shop;
GLYPHS.shopping_bag = GLYPHS.shop;
GLYPHS.more_horiz = GLYPHS.menu;

export type NavGlyphName = 'home' | 'activities' | 'evolution' | 'shop' | 'menu';
export type GlyphName = string;

/** Existe glifo próprio para este nome? É o que o `Icon` pergunta. */
export function hasGlyph(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(GLYPHS, name);
}

/** Só para inspeção/teste — a lista do que já saiu do Material. */
export const GLYPH_NAMES = Object.keys(GLYPHS);

/** O equivalente óptico do `wght` 500 do Material em caixa de 24dp. */
const STROKE_AT_500 = 2.1;

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
  if (!glyph) return null;

  const f = clamp(fill, 0, 1);
  const stroke = STROKE_AT_500 * (clamp(weight, 100, 700) / 500);
  const transform = [
    glyph.flip ? 'translate(24 0) scale(-1 1)' : '',
    glyph.rotate ? `rotate(${glyph.rotate} 12 12)` : '',
  ].filter(Boolean).join(' ') || undefined;

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      focusable="false"
      aria-hidden="true"
      style={{ display: 'block', ...style }}
    >
      <g
        transform={transform}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {glyph.outline}
      </g>
      {glyph.solid ? (
        <g
          transform={transform}
          fill="currentColor"
          style={{
            opacity: f,
            transition: reduced ? 'none' : 'opacity var(--sm2-dur-tap) var(--sm2-ease)',
          }}
        >
          {glyph.solid}
        </g>
      ) : null}
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
