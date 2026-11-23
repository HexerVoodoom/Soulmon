# Benchmark visual: sites oficiais de jogos (capturas de 2026-11-05)

Base para o redesenho do site de beta do Soulmon. Tudo aqui vem de capturas reais em
`E:\Soulmon-marketing\_pesquisa\benchmark-sites\<slug>\` (desktop 1440x900 `d1..d5`, celular 390x844 `m1..m4`).
Nenhuma descrição vem de memória do site: só do que a imagem mostra. Onde digo "inferência", é dedução a
partir de imagem parada (não vi movimento).

## 0. Escopo e limites

- **Analisados de fato: 18 sites.** Falhas registradas: **davediver** (redirecionou para `mintrock.et/en/DaveTheDiver`, título "404 Not Found", altura 900) e **moonlighter** (`ERR_NAME_NOT_RESOLVED` em `moonlighterthegame.com`, sem captura).
- **Capturas abertas** (as demais não foram vistas e não sustentam nenhuma afirmação):
  animalwell d1 d2 d3 m1 · balatro d1 d2 d3 m1 · cassette d1 m1 · celeste d1 d2 d3 m1 · coromon d1 d2 d3 m1 ·
  cultlamb d1 d2 d3 d4 m1 · deadcells d1 d2 m1 · eastward d1 d2 d3 d4 d5 m1 · hades2 d1 d2 m1 · hyperlight d1 d3 m1 ·
  monsanct d1 d2 d3 m1 · ori d1 d2 d3 m1 · palworld d1 d2 d3 d4 m1 · seaofstars d1 d2 d3 d4 d5 m1 ·
  silksong d1 d2 d3 m1 · stardew d1 d2 d3 m1 · temtem d1 d2 d3 m1 · tunic d1 d2 m1.
  Soulmon: `preview-prints\01-hero.png`, `02-ciclo.png`, `04-aba-universo.png`, `11-celular-hero.png`.
- **Sites de tela única ou captura incompleta:**
  - **cassette**: altura 900, `d1..d5` com MD5 idêntico e `m1..m4` idênticos. É uma splash de tela única (o jogo capturado é "Cassette Beasts 2002", lançamento em março de 2027).
  - **hyperlight**: altura 900 (844 no celular). `d1` e `d3` são visualmente iguais, mas com MD5 diferente; `m1..m4` idênticos. Ou é tela única com fundo animado, ou a rolagem é sequestrada e a captura não avançou. Só a 1ª dobra é confiável.
  - **deadcells** (1925 px) e **tunic** (1840 px) são páginas curtas de verdade, não falha.
- As capturas não aceitaram cookies: o banner de consentimento aparece em 5 sites e distorce a 1ª dobra, principalmente no celular. Isso é dado real de primeira visita, não defeito da captura.
- Não há vídeo nem interação nas capturas. Trailers aparecem só como miniatura; carrosséis, só no estado inicial.

## 1. Ficha por site

### 1.1 animalwell — https://www.animalwell.net/ (4289 px)
- **1ª dobra desktop** (`d1`): fundo preto puro, logo em néon branco-esverdeado, 4 ícones de plataforma, "AVAILABLE NOW", e o trailer grande com cantos arredondados e borda branca já na dobra. Abaixo, "DEV LOG", redes e "PRESS KIT".
- **1ª dobra celular** (`m1`): a mesma pilha, logo e trailer cabem na dobra.
- **Ordem**: logo + plataformas + trailer → edições físicas (3 pares de caixas, `d2`) → uma frase de descrição → grade 2x2 de capturas pixel → lista de bullets → plataforma, data e preço → mais capturas (`d3`).
- **Gameplay**: grade de capturas/GIFs pixel com borda arredondada branca; é o site que mais mostra jogo cru.
- **Tipografia e cor**: logo display condensado; todo o resto em sans de sistema (Arial), links azuis padrão. Preto + brilho esverdeado.
- **Molduras**: só a borda arredondada branca, repetida em tudo.
- **Movimento**: nenhum sinal além do brilho do logo (inferência: GIFs nas capturas).
- **CTA**: ícones de plataforma no topo, sem botão textual; não se repete.
- **Criaturas e mundo**: aparecem dentro das capturas (garças, cão fantasma, capivaras); nada recortado.
- **Memorável**: contenção total, o jogo fala sozinho. **Fraco**: corpo em Arial e bullets parecem página de 2005; nenhum fecho.

### 1.2 balatro — https://www.playbalatro.com/ (2763 px)
- **1ª dobra desktop** (`d1`): fundo escuro vermelho/azul com linhas de varredura de CRT, logo enorme com carta e redemoinho, nav em fonte pixel ciano, ícones de 5 plataformas e 3 selos de loja (Apple Arcade, App Store, Google Play). Curinga pixel anunciando merch à esquerda. Quadradinhos coloridos espalhados.
- **1ª dobra celular** (`m1`): logo, 5 ícones, os 3 selos de loja empilhados e grandes, carta do Curinga entrando por baixo. É a melhor dobra de celular para um jogo com loja mobile.
- **Ordem**: logo + lojas → carta do Curinga + parágrafo (`d2`) → faixa de prêmios com louros (`d3`) → trailer de lançamento.
- **Gameplay**: só pelo trailer nas capturas vistas; a carta pixel faz o papel de "peça do jogo".
- **Tipografia e cor**: uma única fonte pixel em tudo, inclusive o parágrafo; vermelho, azul, branco.
- **Molduras**: losangos na nav, faixa de louros dourados, scanlines em todo o fundo.
- **Movimento**: inferência de confetes flutuando e carta inclinada animada (posição dos quadradinhos muda entre `d1`, `d2` e `m1`).
- **CTA**: ícones + selos na 1ª dobra; botão flutuante do publisher no canto.
- **Memorável**: a página inteira parece a tela do jogo (CRT + fonte pixel). **Fraco**: parágrafo longo em fonte pixel cansa; pouca coisa abaixo do trailer.

### 1.3 cassette — https://www.cassettebeasts.com/ (900 px, tela única)
- **1ª dobra desktop** (`d1`): ilustração de capa: treinadora com 5 criaturas coloridas, fundo pastel azul/rosa com raios. Logo em forma de fita embaixo ao centro. Trailer pequeno do YouTube no canto superior esquerdo ("Launching March 2027"). Menu de texto no canto superior direito (Overview, Wishlist Now!, Support, Discord...).
- **1ª dobra celular** (`m1`): arte recortada, logo, menu de texto com sombra rosa sobreposto à personagem.
- **Ordem**: não há; é uma splash.
- **Gameplay**: só o trailer pequeno.
- **Tipografia e cor**: menu em sans bold branca com sombra dura rosa; paleta pastel saturada.
- **CTA**: "Wishlist Now!" é um item de menu como os outros, sem destaque.
- **Criaturas**: são o hero inteiro, com personalidade e escala variada.
- **Memorável**: a capa vende o elenco de criaturas em um olhar. **Fraco**: CTA sem hierarquia, texto do menu sobre a arte perde legibilidade no celular, nada explica o jogo.

### 1.4 celeste — https://www.celestegame.com/ (5865 px)
- **1ª dobra desktop** (`d1`): barra escura no topo com botões de loja (Steam, itch.io, Switch, PS4, Epic) e links; logo gigante (montanha + letras nevadas) sobre céu roxo estrelado; asas do morango aparecendo na base da dobra.
- **1ª dobra celular** (`m1`): ícones de loja no topo, logo, início da ilustração.
- **Ordem**: logo → ilustração vertical contínua que ocupa mais de uma dobra sem texto (`d2`) → trailer + uma frase → grade de botões de loja na cor de cada plataforma → merch e trilha (`d3`).
- **Gameplay**: apenas o trailer.
- **Tipografia e cor**: sans geométrica bold; roxos e azuis da ilustração.
- **Molduras**: nenhuma; a ilustração é o layout.
- **Movimento**: inferência de camadas (nuvens, estrelas) sobre a ilustração.
- **CTA**: lojas no topo e de novo depois do trailer (2 vezes).
- **Memorável**: uma ilustração única que você "desce" como a montanha. **Fraco**: nenhuma captura de jogo; quem não conhece não sabe que é plataforma.

### 1.5 coromon — https://coromon.com/ (4974 px)
- **1ª dobra desktop** (`d1`): site do estúdio, tema azul-marinho. Selo "COROMON AVAILABLE NOW", logo, frase em negrito, descrição, 2 botões (cheio ciano "EXPLORE COROMON" e contorno), linha de prova social ("VERY POSITIVE · 6,000+ STEAM REVIEWS · 6 PLATFORMS"), arte de treinador e criaturas à direita, faixa de 3 capturas pixel. Barra fixa embaixo com tocador da trilha e ícones de loja.
- **1ª dobra celular** (`m1`): mesmo bloco empilhado, arte vira fundo escurecido, barra fixa ocupa cerca de 15% da tela.
- **Ordem**: hero Coromon → hero do segundo jogo em vermelho (`d2`) → bloco do jogo de cartas com etiquetas (`d3`).
- **Gameplay**: faixa de 3 capturas pequenas.
- **Tipografia e cor**: sans grotesca + rótulos espaçados em caixa-alta; cantos retos; azul-marinho e ciano.
- **Molduras**: nenhuma do universo do jogo.
- **CTA**: 2 botões no hero + barra fixa de lojas (persistente).
- **Memorável**: prova social em uma linha, tocador de trilha sempre presente. **Fraco**: parece página de produto de software; a identidade do jogo some atrás do sistema de design do estúdio.

### 1.6 cultlamb — https://www.cultofthelamb.com/ (6184 px)
- **1ª dobra desktop** (`d1`): arte da expansão em tela cheia (azul gelo + vermelho), logo ao centro. Barra superior com fita vermelha "Watch Trailer", 7 ícones de plataforma, busca da wiki e links. Caixa preta de borda vermelha diagonal com o nome da expansão. Cookie cobre cerca de 20% da base.
- **1ª dobra celular** (`m1`): ícones de plataforma no topo, links como etiquetas de papel, arte + logo; cookie cobre cerca de 30%.
- **Ordem**: arte → trailer em moldura de papel rasgado → faixa vermelha com borda de sangue escorrendo (`d2`) → blocos de recurso com título serifado vermelho, texto sobre mancha de fumaça e captura em moldura rasgada (`d3`) → depoimento em balão de fala do jogo sobre cena do templo (`d4`).
- **Gameplay**: capturas/GIFs emoldurados em papel rasgado ao lado de cada recurso.
- **Tipografia e cor**: serifa display vermelha nos títulos, corpo branco; vermelho, preto, creme.
- **Molduras**: papel rasgado, fita, sangue escorrendo como divisor, etiquetas.
- **Movimento**: inferência de sprites animados: seguidores (porco, vaca, coelho, cão) soltos dançando sobre o cenário em `d3`.
- **CTA**: "Watch Trailer" + ícones de plataforma na barra fixa (presente em `d1` e `d4`).
- **Criaturas e mundo**: seguidores recortados vivem nas margens da página; o fundo de cada seção é um lugar do jogo.
- **Memorável**: o depoimento falado pelo cordeiro; os divisores que só poderiam ser deste jogo. **Fraco**: a 1ª dobra vende a expansão, não o jogo; cookie pesado.

### 1.7 deadcells — https://dead-cells.com/ (1925 px)
- **1ª dobra desktop** (`d1`): barra simples (logo pequeno + About, Leaderboard, Patch notes, Press, Wiki), cenário pixel rosa/roxo nas laterais, trailer do YouTube ocupando quase toda a dobra.
- **1ª dobra celular** (`m1`): logo, trailer, botão largo "WHERE TO BUY?", início de "What is Dead Cells?".
- **Ordem**: trailer → botão vermelho "WHERE TO BUY?" → "What is Dead Cells?" com parágrafo e bullets com termos em vermelho (`d2`).
- **Gameplay**: só o trailer.
- **Tipografia e cor**: título serifado vermelho com filetes laterais, corpo amarelo claro, botão em fonte condensada.
- **CTA**: um botão vermelho logo abaixo do trailer; sem repetição.
- **Memorável**: honesto e direto: vídeo, onde comprar, o que é. **Fraco**: página curta e datada (trailer antigo), sem capturas, sem personagem.

### 1.8 eastward — https://eastwardgame.com/ (9794 px)
- **1ª dobra desktop** (`d1`): amarelo chapado, logo preto pincelado gigante, a arte da cidade e dos personagens "estourando" de uma mancha azul pintada. Selo oval de DLC. Nav creme com borda pincelada e "BUY NOW" com mascote. Fixos na base: botão roxo "TRAILER" + 3 quadrados coloridos de loja à esquerda, tocador de música com radinho pixel à direita.
- **1ª dobra celular** (`m1`): logo, selo de DLC, arte inteira, e na base a mesma fileira "TRAILER" + 3 lojas. A melhor 1ª dobra de celular do conjunto.
- **Ordem**: arte → sinopse + trailer em fundo roxo (`d2`) → citação de imprensa em tela cheia (`d3`) → carrossel de recursos → "MEET THE CAST" com 4 bonecos sobre mancha creme e seta de seleção (`d4`) → rodapé com logos, lista de e-mail "HEAD EASTWARD..." e sprite pixel no canto (`d5`).
- **Gameplay**: trailer e carrossel de recursos.
- **Tipografia e cor**: sans geométrica bold em caixa-alta; amarelo → roxo escuro → preto, com creme.
- **Molduras**: borda pincelada em toda divisão de seção.
- **Movimento**: inferência de seletor interativo de elenco e de tocador de trilha funcional.
- **CTA**: "BUY NOW" na nav + trailer e lojas fixos na base durante toda a rolagem (`d1` a `d5`).
- **Memorável**: cor chapada corajosa, elenco como brinquedos, trilha sempre a um toque. **Fraco**: página muito longa; a citação de imprensa ocupa uma dobra inteira.

### 1.9 hades2 — https://www.supergiantgames.com/games/hades-ii/ (2947 px)
- **1ª dobra desktop** (`d1`): cabeçalho do estúdio (logo + faixa de personagens de todos os jogos, nav com cada jogo em uma cor). Banner do jogo com logo verde luminoso e a protagonista com círculos arcanos; o banner não ocupa a dobra inteira. Abaixo, fundo claro: cartão "About the game" e coluna "What people are saying" com 3 citações e notas.
- **1ª dobra celular** (`m1`): logo do estúdio, banner, capa do jogo grande, "About the game".
- **Ordem**: banner → sobre + lojas ("Available on") + citações → faixa escura com link do pacote de mídia e 4 miniaturas de trailer (`d2`).
- **Gameplay**: só miniaturas de vídeo.
- **Tipografia e cor**: títulos em serifa egípcia, corpo sans cinza sobre off-white; o verde do jogo vive só no banner.
- **CTA**: selos de loja abaixo da dobra, uma vez.
- **Memorável**: arte da protagonista; citações com nota bem diagramadas. **Fraco**: é uma página institucional; a identidade do jogo acaba onde o banner acaba.

### 1.10 hyperlight — https://www.hyperlightbreaker.com/en/ (900 px, só 1ª dobra confiável)
- **1ª dobra desktop** (`d1`, `d3`): paisagem pintada em tela cheia (ruínas, floresta, crânio gigante, céu pêssego e ciano), 3 personagens de costas no canto, logo amarelo anguloso com glifos ciano. Nav preta com "JOIN US ON DISCORD" (contorno) e "PLAY EARLY ACCESS" (amarelo cheio) no canto superior direito. Cookie cobre cerca de 14%.
- **1ª dobra celular** (`m1`): cookie cobre cerca de 52%; vê-se meio logo; o CTA está dentro do menu.
- **CTA**: par Discord + jogar no topo, sempre visível.
- **Memorável**: personagens de costas olhando o mundo (convida a entrar). **Fraco**: no celular, a primeira visita é um formulário de cookies.

### 1.11 monsanct — https://monster-sanctuary.com/ (4194 px)
- **1ª dobra desktop** (`d1`): fundo cinza-azulado chapado, 6 ícones sociais, trailer grande com miniatura de baixa resolução, "Play now On" + 4 botões de loja nas cores das marcas.
- **1ª dobra celular** (`m1`): sociais, trailer, 4 botões de loja empilhados enormes.
- **Ordem**: trailer + lojas → "Support Us!" (pote de gorjeta com slime) → pelúcia à venda → descrição de uma frase → lista de e-mail → comunidade (`d2`) → blocos alternados texto + captura: Explore, Battle, Hatch monsters (`d3`).
- **Gameplay**: capturas reais de exploração, tela de batalha e lista de ovos, ao lado do texto de cada recurso.
- **Tipografia e cor**: Arial branca, títulos laranja; nenhum ornamento.
- **CTA**: 4 lojas logo abaixo do trailer, uma vez.
- **Memorável**: mostra a mecânica de criatura (batalha, chocar ovo) com tela real. **Fraco**: pedido de gorjeta e pelúcia antes de explicar o jogo; visual de modelo genérico; nenhuma criatura em destaque.

### 1.12 ori — https://www.orithegame.com/ (7203 px)
- **1ª dobra desktop** (`d1`): arte pintada roxo/azul em tela cheia, logo caligráfico luminoso, nav em faixa branca "pincelada" com uma pena roxa marcando o item ativo, 2 medalhões circulares com arabescos (caixa do jogo e cena), botões de loja em tiras brancas pinceladas à esquerda e 2 "WATCH TRAILER" à direita, selo "Must-Play". Cookie no topo.
- **1ª dobra celular** (`m1`): cookie ocupa cerca de 40% do topo; logo e medalhão da caixa; nenhum CTA na dobra.
- **Ordem**: hero → painel de texto escuro translúcido sobre cena de floresta laranja (`d2`) → notas da imprensa em louros dourados nas laterais + lista de prêmios (`d3`).
- **Gameplay**: nada de jogo cru nas capturas vistas; só arte e botões de trailer.
- **Tipografia e cor**: sans humanista branca; roxo → laranja → preto com dourado.
- **Molduras**: pinceladas, pena, medalhões, louros.
- **Movimento**: inferência de fundos fixos trocando por seção (a cena muda inteira entre `d1` e `d2`).
- **CTA**: lojas e trailer no hero; não se repetem nas capturas vistas.
- **Memorável**: a pena como cursor da nav; cada seção é um lugar. **Fraco**: nav fixa passa por cima do texto (`d2`) e o selo cobre uma nota (`d3`); celular começa por cookie.

### 1.13 palworld — https://www.pocketpair.jp/en/games-en/palworld-en/ (9304 px)
- **1ª dobra desktop** (`d1`): página dentro do site do publisher (nav branca corporativa). Arte 3D lotada de criaturas, logo branco, e um botão vermelho "PLAY NOW!" flutuante na base da tela.
- **1ª dobra celular** (`m1`): arte, grade 2x2 de lojas, redes, notícias; "PLAY NOW!" fixo embaixo.
- **Ordem**: arte → "Over 200 Unique Pals" com número gigante e criaturas amontoadas dos dois lados (`d2`) → vídeo de jogo + parágrafo → "Build x Auto..." em fundo geométrico pastel (`d3`) → mais vídeo, personagens recortados, faixa de capturas (`d4`).
- **Gameplay**: vídeos de jogo embutidos por seção + faixa de capturas.
- **Tipografia e cor**: sans pesada, número em ciano, títulos pretos enormes; fundos pastel.
- **CTA**: "PLAY NOW!" flutuante em todas as capturas; chega a cobrir título (`d3`).
- **Criaturas**: quantidade como argumento: dezenas recortadas emoldurando o número.
- **Memorável**: "Over 200" com as criaturas em volta: um número, uma imagem, uma promessa. **Fraco**: nav do publisher no topo dilui o jogo; o botão flutuante atropela conteúdo.

### 1.14 seaofstars — https://seaofstarsgame.co/ (11895 px)
- **1ª dobra desktop** (`d1`): ilustração do elenco em tela cheia com fases da lua no céu, logo serifado na base com faixa "SUNSET EDITION". Nav em moldura roxa de cantos chanfrados; emblema do estúdio pendurado como flâmula. Não há botão de compra na dobra. Cookie na base.
- **1ª dobra celular** (`m1`): ilustração e logo; cookie cobre cerca de 35%.
- **Ordem**: ilustração → trailer em moldura azul-petróleo sobre noite estrelada (`d2`) → cartões creme tipo pergaminho, cada um com captura pixel, paginador de estrelinhas, título serifado e parágrafo; divisor com emblema (`d3`) → seção do compositor em ciano com cantoneiras ornamentais → "Question & Answers" em pergaminho com nuvens (`d4`) → fecho: cena pixel de fogueira à beira-mar com o logo brilhando (`d5`).
- **Gameplay**: carrossel de capturas pixel dentro de cada cartão de recurso.
- **Tipografia e cor**: serifa display nos títulos, sans condensada no corpo, rótulos em caixa-alta espaçada; alterna noite escura e pergaminho claro.
- **Molduras**: papel rasgado entre seções, cantoneiras, filetes com losango, moldura dupla fina, emblema como divisor.
- **Movimento**: inferência de carrosséis nos cartões e de céu estrelado animado.
- **CTA**: nenhum de compra nas capturas vistas; os botões são de conteúdo ("Learn more about audio").
- **Memorável**: o contraste entre ilustração de capa e pixel art do jogo, resolvido pelos cartões; o fecho com a fogueira. **Fraco**: 11.895 px e nenhum caminho claro para comprar; cookie pesado no celular.

### 1.15 silksong — https://hollowknightsilksong.com/ (6987 px)
- **1ª dobra desktop** (`d1`): arte laranja/vermelha com o logo ornamentado ocupa cerca de 63% da dobra; sem nav, só o logo do estúdio e 4 redes. Abaixo, fundo preto e o título "Ascend to the Peak of a Haunted Kingdom".
- **1ª dobra celular** (`m1`): arte + título; o bloco de recurso mantém 2 colunas e espreme miniatura e texto.
- **Ordem**: arte → blocos captura + texto → trailer (`d2`) → banner da edição física → captura grande (`d3`).
- **Gameplay**: capturas reais ao lado de cada bloco e uma grande em largura total.
- **Tipografia e cor**: sans geométrica comum, branco sobre preto; o ornamento existe só dentro do logo.
- **CTA**: nenhum botão de compra em `d1` a `d3`; só a pré-venda física.
- **Memorável**: arte e logo. **Fraco**: fora do hero é um modelo neutro; layout de 2 colunas quebrado no celular; sem CTA.

### 1.16 stardew — https://www.stardewvalley.net/ (3036 px)
- **1ª dobra desktop** (`d1`): céu pixel em degradê de noite para dia, logo de madeira com folhas ao centro, montanhas pixel; telhado da casa e um pássaro aparecem na base. Nav azul simples, sem botão de compra.
- **1ª dobra celular** (`m1`): nav vira grade 2x4 no topo, logo, montanhas.
- **Ordem**: céu + logo → a fazenda (casa, personagens, galinha, girassóis) que se dissolve em areia amarela → "You're moving to the Valley..." + duas linhas (`d2`) → captura grande do jogo (`d3`).
- **Gameplay**: capturas grandes em largura de coluna.
- **Tipografia e cor**: sans arredondada azul nos títulos; azul → verde → amarelo areia.
- **Molduras**: divisor em zigue-zague fino; o resto é a própria pixel art.
- **Movimento**: inferência forte de camadas com parallax (o pássaro muda de posição relativa entre `d1` e `d2`; céu, montanhas e fazenda são planos separados).
- **CTA**: nenhum nas capturas vistas.
- **Memorável**: rolar é anoitecer-amanhecer e chegar na fazenda; a pixel art do jogo é a página. **Fraco**: nenhum botão de compra; nav ocupa muito no celular.

### 1.17 temtem — https://crema.gg/games/temtem/ (3630 px)
- **1ª dobra desktop** (`d1`): página no site do estúdio. Arte 2D de criaturas, logo laranja de contorno roxo, uma linha ("A massively multiplayer creature-collection adventure."), botão de play heptagonal e 5 botões heptagonais de plataforma. Bordas rasgadas entre seções. Cookie na base.
- **1ª dobra celular** (`m1`): logo, play, 5 heptágonos em 1-3-2; cookie cobre a base.
- **Ordem**: arte + CTAs → bloco roxo "About" + "Features" em lista, com criatura vazando pela borda esquerda (`d2`) → "Screenshots & Videos": grade de quadrados de borda torta + 2 vídeos (`d3`).
- **Gameplay**: grade de 8 capturas.
- **Tipografia e cor**: condensada em caixa-alta laranja nos títulos; teal, roxo, creme, laranja.
- **Molduras**: heptágono como forma de botão, bordas rasgadas, quadros tortos.
- **CTA**: play + 5 plataformas no hero e links de loja em texto no "About" (2 vezes).
- **Memorável**: uma forma própria (heptágono) em todo botão; frase única que diz o gênero. **Fraco**: lista de bullets genérica; criaturas quase não aparecem fora do hero; cookie cobre texto.

### 1.18 tunic — https://tunicgame.com/ (1840 px)
- **1ª dobra desktop** (`d1`): azul chapado com cenário isométrico de poucos polígonos nas laterais, logo com runas, trailer logo abaixo, faixa de pergaminho "Out now!" com duas raposinhas.
- **1ª dobra celular** (`m1`): logo, trailer, faixa, botão amarelo ornamentado "Get TUNIC on Switch", grade 2x3 de botões de pergaminho, um parágrafo, logos de loja.
- **Ordem**: logo → trailer → faixa + botões (`d2`) → um parágrafo → lojas → contatos.
- **Gameplay**: só o trailer.
- **Tipografia e cor**: sans arredondada bold; azul elétrico, amarelo, pergaminho.
- **Molduras**: faixa de pergaminho com pontas dobradas, botões com cantoneiras desenhadas, raposa sentada na faixa.
- **CTA**: um botão principal amarelo + 6 secundários, tudo em um bloco.
- **Memorável**: página inteira em uma tela, com hierarquia clara de botões e ornamento próprio. **Fraco**: quase nenhuma informação; sem capturas.

## 2. Tabela de padrões (N = 18)

Contagem pelo que as capturas abertas mostram. "Não visto" conta como ausente.

| # | Padrão | n/N | Quem |
|---|---|---|---|
| 1 | Logo do jogo é o maior elemento tipográfico da 1ª dobra (sem título-frase competindo) | 15/18 | todos menos coromon, deadcells, monsanct |
| 2 | Trailer em algum ponto da página | 15/18 | todos menos coromon, hyperlight, stardew |
| 3 | Hero luminoso ou saturado (não escuro) | 13/18 | exceto animalwell, balatro, coromon, monsanct, deadcells |
| 4 | CTA de loja/plataforma visível na 1ª dobra desktop | 12/18 | animalwell, balatro, cassette, celeste, coromon, cultlamb, eastward, hyperlight, monsanct, ori, palworld, temtem |
| 5 | Arte ou cena em tela cheia na 1ª dobra desktop | 11/18 | cassette, celeste, cultlamb, eastward, hyperlight, ori, palworld, seaofstars, silksong, stardew, temtem |
| 6 | CTA de loja visível na 1ª dobra do celular | 11/18 | animalwell, balatro, cassette, celeste, coromon, cultlamb, deadcells, eastward, monsanct, palworld, temtem, tunic (12 se contar cassette, onde é só item de menu) |
| 7 | Trailer (player ou botão) na 1ª dobra desktop | 9/18 | animalwell, cassette, deadcells, monsanct, tunic, ori, cultlamb, eastward, temtem |
| 8 | Jogo real (captura ou GIF) embutido fora do trailer | 9/18 | animalwell, coromon, cultlamb, monsanct, palworld, seaofstars, silksong, stardew, temtem |
| 9 | Fundo muda de cor ou de cenário a cada seção | 8/18 | celeste, cultlamb, eastward, ori, palworld, seaofstars, stardew, temtem |
| 10 | Personagens/criaturas soltos no layout, fora de caixa | 8/18 | balatro, cultlamb, eastward, palworld, seaofstars, stardew, temtem, tunic |
| 11 | Ornamento do universo aplicado à interface (botão, nav, divisor) | 7/18 | balatro, cultlamb, eastward, ori, seaofstars, temtem, tunic |
| 12 | Prova social (nota, prêmio, citação, avaliações) | 6/18 | balatro, coromon, cultlamb, eastward, hades2, ori |
| 13 | Divisor de seção rasgado ou pincelado | 5/18 | cultlamb, eastward, ori, seaofstars, temtem |
| 14 | Banner de cookie na primeira visita | 5/18 | cultlamb, hyperlight, ori, seaofstars, temtem |
| 15 | CTA persistente durante a rolagem | 4/18 | coromon, cultlamb, eastward, palworld |
| 16 | Página dentro do site do estúdio/publisher | 4/18 | coromon, hades2, palworld, temtem |
| 17 | Página curta ou tela única (até cerca de 2000 px) | 4/18 | cassette, deadcells, hyperlight, tunic |
| 18 | Título-frase de venda na 1ª dobra desktop | 3/18 | coromon, silksong, temtem |
| 19 | Trilha/áudio como elemento da página | 3/18 | coromon, eastward, seaofstars |
| 20 | Conteúdo principal escondido atrás de abas | 0/18 | nenhum |

Leituras diretas:
- O padrão dominante é **logo + arte + caminho para jogar**, não título-frase. Só 3 de 18 abrem com frase.
- Metade mostra jogo real fora do trailer; os que não mostram dependem de arte muito forte (celeste, ori, eastward).
- **Nenhum** usa abas para o conteúdo central. Carrossel aparece, sempre dentro de uma seção já visível.

## 3. O que os 5 melhores fazem e os medianos não

Melhores, pela soma de identidade, clareza e execução nas capturas: **seaofstars, cultlamb, eastward, stardew, ori**.
Medianos: silksong, hades2, temtem, palworld, coromon, celeste, balatro, tunic, animalwell. Fracos: monsanct, deadcells, cassette (splash), hyperlight (só uma dobra).

1. **A interface é feita do material do jogo.** Pergaminho e cantoneiras (seaofstars `d3`, `d4`), papel rasgado e sangue (cultlamb `d2`, `d3`), pincelada (eastward `d1`, ori `d1`), pixel art como chão da página (stardew `d2`). Nos medianos o ornamento para no logo (silksong `d1`, hades2 `d1`).
2. **Cada seção é um lugar.** O fundo troca de cenário ou de cor inteira (ori `d1` para `d2`; eastward `d1` para `d2`; stardew `d1` para `d2`). Medianos repetem um fundo único preto ou branco (silksong `d2`, animalwell `d3`).
3. **Personagens habitam as margens.** Seguidores dançando (cultlamb `d3`), elenco de brinquedo (eastward `d4`), fazendeiros e galinha (stardew `d2`), fogueira no fecho (seaofstars `d5`). Nos medianos, personagem só existe dentro de retângulo de captura.
4. **Alternância de claro e escuro como ritmo.** seaofstars alterna noite e pergaminho; eastward, amarelo e roxo. Os medianos escuros ficam escuros do começo ao fim.
5. **Cada recurso vem colado a uma prova visual.** Cartão com captura + título + parágrafo (seaofstars `d3`), bloco com GIF emoldurado (cultlamb `d3`). Nos medianos é lista de bullets (temtem `d2`, animalwell `d3`).
6. **A página tem fim.** Cena de fecho (seaofstars `d5`) ou convite (eastward `d5`). Medianos terminam em rodapé de links.

Ressalva honesta: três dos cinco melhores (seaofstars, stardew, e ori no celular) são **piores em conversão** do que medianos como palworld, balatro e tunic: não mostram botão de compra na dobra. Beleza e CTA não vieram juntos em quase ninguém; **eastward** é o único que acerta os dois (`d1`, `m1`).

## 4. Anti-padrões vistos

- **Cookie engolindo a primeira dobra do celular**: hyperlight `m1` (cerca de 52%), ori `m1` (40%), seaofstars `m1` (35%), cultlamb `m1` (30%).
- **Elemento fixo atropelando conteúdo**: nav sobre o texto em ori `d2`, selo sobre nota em ori `d3`, botão flutuante sobre título em palworld `d3`.
- **Sem caminho para jogar na dobra**: seaofstars `d1`, silksong `d1`, stardew `d1`, hades2 `d1`.
- **Identidade diluída por sistema corporativo**: nav do publisher em palworld `d1`; estética de software em coromon `d1`; página institucional em hades2 `d1`.
- **Layout de desktop espremido no celular**: 2 colunas em silksong `m1`; nav de 8 itens ocupando o topo em stardew `m1`.
- **Texto sobre arte sem proteção**: menu em cassette `m1`.
- **Corpo em fonte de sistema e lista de bullets**: animalwell `d3`, monsanct `d3`.
- **Pedir antes de mostrar**: gorjeta e pelúcia antes da descrição em monsanct `d2`; 1ª dobra vendendo a expansão em cultlamb `d1`.
- **Mídia envelhecida ou de baixa qualidade na dobra**: miniatura borrada em monsanct `d1`; trailer antigo em deadcells `d1`.
- **Fonte pixel em parágrafo longo**: balatro `d2`.
- **CTA sem hierarquia**: "Wishlist Now!" como item de menu em cassette `d1`.

## 5. Comparação franca com o site atual do Soulmon

O que está certo e deve ficar: a frase "Criaturas que evoluem com suas tarefas." é mais clara do que a 1ª dobra de 15 dos 18 sites; o botão com moldura de cobre e cristal é ornamento próprio aplicado à interface (padrão 11, que só 7 têm); a 1ª dobra do celular (`11-celular-hero.png`) tem mapa em tela cheia, criatura, frase e CTA, no nível de eastward `m1`; a demo de checklist (`02-ciclo.png`) é uma ideia que nenhum dos 18 tem.

O que ele faz pior:

1. **Hero desktop vazio** (`01-hero.png`). O mapa ocupa uma tira vertical de cerca de 28% da largura; o resto é preto esverdeado chapado. 11 de 18 usam a dobra inteira para a arte. O mesmo mapa já funciona em tela cheia no celular; no desktop ele foi encolhido.
2. **Escuro do começo ao fim.** As três telas de desktop têm o mesmo fundo quase preto, sem mudança de lugar entre seções. 13 de 18 abrem luminosos e 8 de 18 trocam o fundo por seção. O turquesa da identidade quase não aparece como cor de superfície; aparece como detalhe.
3. **A criatura é pequena e única.** Um dragãozinho vermelho no hero, um ouriço na demo. Os jogos de criatura do conjunto abrem com elenco (cassette `d1`, palworld `d1` e `d2`, temtem `d1`). O Soulmon não mostra quantas criaturas existem nem as formas de evolução lado a lado.
4. **Muito vazio em volta do conteúdo.** Em `02-ciclo.png` a demo ocupa o terço central e o resto da dobra é fundo; em `04-aba-universo.png` metade inferior da tela é vazia. Os melhores preenchem a margem com mundo e personagem.
5. **Conteúdo atrás de abas.** Universo, Habitantes, Jogos e Elementos estão em 4 abas; quem não clica vê só a primeira. 0 de 18 fazem isso com conteúdo central.
6. **Nenhuma tela real do jogo.** A demo é uma reconstrução; não há captura do app. 9 de 18 mostram jogo cru, e para um app de celular isso significa a tela do telefone.
7. **Sem trailer ou vídeo.** 15 de 18 têm; 9 já na 1ª dobra.
8. **CTA não acompanha a rolagem.** "Entrar no beta" aparece no hero e some em `02` e `04`. 4 de 18 mantêm CTA fixo, e são justamente os de melhor conversão aparente.
9. **Os mapas estão presos em tiras.** Em `04-aba-universo.png`, seis ilustrações ricas viram miniaturas verticais recortadas dentro de uma caixa. Nos melhores, a arte do mundo é o fundo da seção, não um cartão.
10. **Sem prova social e sem fecho** nas telas comparadas (não avaliei `08` a `10`).
11. **Tipografia sem contraste de papéis.** Título em serifa caixa-alta e corpo em sans pequena cinza; falta o terceiro nível (rótulo espaçado) que seaofstars usa para dar ritmo.
12. **A barra de progresso vertical à esquerda** é ornamento próprio, mas compete com o conteúdo e não tem equivalente em nenhum dos 18; não ajuda a entender onde se está.

## 6. Doze princípios acionáveis

Caminhos relativos a `E:\Soulmon-marketing\_pesquisa\benchmark-sites\`.

1. **Hero desktop em tela cheia com o mapa como cenário, não como tira.** Levar para o desktop o que o celular já faz. Origem: `ori\d1.png`, `hyperlight\d1.png`, `seaofstars\d1.png`, `eastward\d1.png`.
2. **Abrir com elenco: várias criaturas, de tamanhos diferentes, uma delas grande.** Origem: `cassette\d1.png`, `palworld\d1.png`, `temtem\d1.png`.
3. **Um número, uma imagem, uma promessa para a coleção** ("N criaturas, 5 formas cada", cercado por elas). Origem: `palworld\d2.png`.
4. **Manter a frase de venda, mas com CTA duplo na dobra: entrar no beta (cheio) + ver o jogo (contorno).** Origem: `hyperlight\d1.png` (par Discord + jogar), `coromon\d1.png` (cheio + contorno), `tunic\d2.png` (um botão principal, os demais menores).
5. **CTA persistente na base durante a rolagem, pequeno e sem cobrir conteúdo.** Origem: `eastward\d1.png`, `eastward\d5.png`, `eastward\m1.png`; contraexemplo `palworld\d3.png`.
6. **Cada seção é um lugar do mundo: trocar o fundo inteiro (Exploração, Arena, Laboratório...) em vez de pôr os mapas em cartões.** Origem: `ori\d2.png`, `stardew\d2.png`, `cultlamb\d2.png`.
7. **Alternar superfície escura (turquesa profundo) e clara (pergaminho ou pedra clara) para dar ritmo.** Origem: `seaofstars\d3.png`, `seaofstars\d4.png`, `eastward\d2.png`.
8. **Divisores e molduras feitos da identidade (cano de cobre, cristal, folhas, circuito), não linha reta.** Origem: `cultlamb\d2.png`, `seaofstars\d4.png`, `temtem\d1.png`, `tunic\d2.png`.
9. **Cada recurso = cartão com tela real do app + título + duas linhas; nada de bullets e nada de abas.** Origem: `seaofstars\d3.png`, `cultlamb\d3.png`, `monsanct\d3.png`; contraexemplo `animalwell\d3.png`.
10. **Criaturas soltas nas margens e entre seções (inferência: com animação curta de sprite).** Origem: `cultlamb\d3.png`, `stardew\d2.png`, `eastward\d4.png`, `tunic\d1.png`.
11. **Prova e voz no formato do jogo: depoimento em balão de fala de um NPC, e uma linha de números reais do beta.** Origem: `cultlamb\d4.png`, `coromon\d1.png`, `hades2\d1.png`.
12. **Celular primeiro: logo, criatura, frase e selo de loja/CTA na 1ª dobra, sem banner tomando a tela; e fechar a página com uma cena e o convite.** Origem: `balatro\m1.png`, `eastward\m1.png`, `seaofstars\d5.png`; contraexemplos `hyperlight\m1.png`, `ori\m1.png`.

## 7. Capturas mais inspiradoras

1. `E:\Soulmon-marketing\_pesquisa\benchmark-sites\seaofstars\d3.png` (cartão de recurso com pixel art + pergaminho)
2. `E:\Soulmon-marketing\_pesquisa\benchmark-sites\seaofstars\d4.png` (cantoneiras, filetes, troca de superfície)
3. `E:\Soulmon-marketing\_pesquisa\benchmark-sites\cultlamb\d3.png` (recurso + GIF emoldurado + criaturas soltas)
4. `E:\Soulmon-marketing\_pesquisa\benchmark-sites\eastward\m1.png` (1ª dobra de celular com CTA fixo)
5. `E:\Soulmon-marketing\_pesquisa\benchmark-sites\stardew\d2.png` (pixel art do jogo como chão da página)
6. `E:\Soulmon-marketing\_pesquisa\benchmark-sites\palworld\d2.png` (número + criaturas)
