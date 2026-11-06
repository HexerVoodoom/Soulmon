# Benchmark visual mobile — site de beta do Soulmon (2026-11-05)

Base: capturas reais em `E:\Soulmon-marketing\_pesquisa\benchmark-mobile\<slug>\` — `m1..m4.png` (390x844, DPR 2, UA Android, do topo ao fim) e `d1..d5.png` (1440x900).

**Legenda:** **[O]** = observação (está na captura). **[I]** = inferência minha (não está provado na captura).

## 0. Método e limites (ler antes de usar)

- **Como foi visto [O]:** para cada site abri uma folha com m1+m2+m3+m4 lado a lado em 390x844 (1 px CSS = 1 px) e outra com d1..d4 a 50%. Abri no arquivo original, em resolução cheia: `forest/m2.png`, `umamusume/m3.png`, `pikmin/d3.png`, mais as duas folhas de visão geral e os prints do Soulmon (`02`, `03`, `08`, `09`, `11`, `12`). `d5` não foi aberto em nenhum site.
- **Tentados: 24. Analisados de fato: 22. Falhas: 2.**
  - `mv3` — "Page not found" (404 do Netlify), as 4 capturas idênticas. **Falha.**
  - `squad` — "PAGE NOT FOUND" do Supercell. **Falha.**
- **Dos 22, só 16 têm rolagem no celular.** Os outros 6 são tela única no celular:
  - `finch` — m1=m2=m3=m4 (mesmo hash), altura 844: tela única com banner de cookies cobrindo a metade de baixo. No desktop também (altura 900, 5 capturas idênticas).
  - `peridot` — m1..m4 idênticas, altura 849: tela única + cookies. E não é página de jogo: é página institucional ("Featured Experiences", "The Latest").
  - `genshin`, `starrail`, `wuwa`, `zzz` — altura 844, as 4 capturas mostram a mesma tela (hash muda porque o fundo é animado). Landing de tela cheia sem rolagem no celular. `starrail` rola no desktop (altura 3956).
  - `forest` no **desktop** não rolou (altura 900, 4 capturas iguais); no celular rolou normal (7658).
- **Cookies sujam a amostra [O]:** 16/22 capturas de celular têm banner de consentimento sobre a 1ª dobra (não foi aceito nem recusado, por regra). Em 4 ele cobre ~1/3 ou mais da tela: `habitica` (~50%), `pokesleep` (~46%), `tcgpocket` (~46%, no meio), `finch` (~36%). `brawl` fica escurecido por inteiro. O que está atrás do banner eu **não vi**.
- **Nenhum dos 22 é página de pré-registro ou de beta [O].** Todos são jogos/apps já lançados: não há contador de inscritos, metas de recompensa por marco, nem formulário de e-mail de pré-registro em nenhuma captura. Tudo que este documento diz sobre "inscrição" vem de 2 sites com campo de e-mail (`alto`, `habitica`) e do resto por analogia **[I]**. Padrão de pré-registro continua sem benchmark visual.
- Vídeo: captura é quadro parado. "Tem vídeo" = vi botão de play ou quadro borrado de vídeo; não sei duração, som nem se toca sozinho.

## 1. Fichas por site (22)

### Apps de hábito / criatura (o grupo que mais importa)

**finch** — https://finchcare.com/ — tela única
- 1ª dobra [O]: logo com o passarinho no topo; título "Your new self-care best friend."; selo Google Play grande (só Google Play no celular; no desktop App Store + Google Play); "5.0" enorme + 5 estrelinhas + "500k+ ratings"; sol nascendo; banner de cookies cobre o resto.
- No desktop [O]: aparece a frase que explica o loop inteiro: "Daily self-care is finally fun — take care of your pet by taking care of yourself!" e o personagem (pássaro rosa/amarelo) + gato laranja. No celular capturado essa frase **não aparece** (ou está atrás do banner).
- Gameplay: nenhum. Personagem: 1 mascote ilustrado. Navegação: só logo.
- Memorável: nota 5.0 em tamanho de título, colada no selo da loja. Fraco: não mostra o app.

**forest** — https://www.forestapp.cc/
- 1ª dobra [O]: cabeçalho (logo + menu); título 2 linhas "Spend your time well with **Forest**." (nome em amarelo); 3 linhas de apoio; broto 3D brilhando no centro; botão "Download"; rodapé de prova "60M+ downloads • ★★★★★ 4.8 on App Store • Google Play Editors' Choice • Top productivity app in 157 countries". Sem cookies.
- Ordem [O]: hero → loop em 3 passos → casos de uso ("Digital detox"…) → "The original focus app that plants real trees on Earth." com número gigante **2,311,002** "Real trees planted — and still growing." + parceiro nomeado → FAQ → fecho "Ready to **focus**, and take back your time?" + "Join 60 million people…" + Download → rodapé.
- Loop [O] (`forest/m2.png`): 3 blocos empilhados, cada um = círculo com a árvore num estado + título de 3–6 palavras + 1 linha: "Start focusing" / "Distraction kills it — Use other apps and your tree dies." (galho seco) / "Stay focused and earn a tree" (pinheiro).
- Navegação [O]: cabeçalho fixo; depois de rolar ganha o botão "Download" ao lado do menu.
- Memorável: o loop com a mesma coisa mudando de estado; o contador de árvores. Fraco: nenhuma tela do app.

**habitica** — https://habitica.com/static/home
- 1ª dobra [O]: logo, botão "Log In", formulário "Sign Up For Free" (Email, Password, Confirm Password) **por cima** dos sprites em pixel art e cortado na direita ("Confirm Passwo"); título "Motivate yourself to achieve your goals." aparece cortado atrás do banner de cookies, que cobre a metade de baixo. **[I]** o layout a 390 px parece quebrado (pode ser artefato da captura).
- Desktop [O] (`d1`): sprites + título à esquerda, formulário à direita (3 campos + Continue + "Continue with Google"/"Apple"), "Join over 4 million Habiticans".
- Ordem [O]: hero com cadastro → "Gamify Your Life" com 3 colunas (linhas de tarefa reais "Floss teeth at night / Go to the gym / Drink water" → "Track Your Habits and Goals"; sprites → "Earn Rewards for Your Goals"; chefão + grupo → "Battle Monsters with Friends") → "Players Use Habitica to Improve" (3 vinhetas pixel) → "Level Up Anywhere" com 2 molduras de celular mostrando a tela real + selos de loja → "Join over 4 million people…".
- Memorável: a interface de tarefa desenhada ao lado da criatura = o loop sem texto. Fraco: senha na 1ª dobra; cookie gigante.

**duolingo** — https://www.duolingo.com/
- 1ª dobra [O]: logo; ilustração (coruja + personagens); título "The most fun way to learn languages, chess, and more!"; botão verde largura total "GET STARTED"; botão secundário "I ALREADY HAVE AN ACCOUNT"; faixa fixa no rodapé "Install the Duolingo App — 4.5 ★ 15,300,000+ — Google Play — INSTALL".
- Ordem [O]: hero → blocos de valor com título de 1–2 palavras + 2–3 linhas + ilustração ("personalized learning", "stay motivated": "game-like features, fun challenges, and reminders from our friendly mascot") → "learn anytime, anywhere" com selos → produtos irmãos → rodapé verde.
- Navegação [O]: depois da 1ª dobra o cabeçalho encolhe para ícone + "GET STARTED" fixo; a faixa de instalar fica no rodapé o tempo todo (2 CTAs sempre na tela).
- Gameplay: nenhuma tela real; só ilustração. Fraco para nós: não explica o loop.

**pokesleep** — https://www.pokemonsleep.net/en/
- 1ª dobra [O]: foto de mão segurando celular com o gráfico de sono do app + relógio no pulso; "Rest your very best!" + logo. Metade de baixo coberta por cookies. No desktop (`d1`): abaixo da foto, "This sleep app gives you something fun to look forward to when you wake up in the morning. Pokémon Sleep is available now!" + App Store + Google Play.
- Ordem [O]: hero → faixa de 4 cartões → 2 blocos de foto ("Sleep Tracking — Rest your very best!" / "Pokémon — Research Pokémon sleep styles!") → News → X → rodapé Download.
- Memorável: o app aparece **na mão de uma pessoa**, no contexto de uso. Fraco: criatura quase ausente na 1ª dobra.

**pikmin** — https://pikminbloom.com/
- 1ª dobra [O]: cabeçalho (logo, botão "Web Store", menu); cartão de evento flutuante; 3 Pikmin 3D em cima de um celular deitado; links "News / What's Pikmin Bloom? / Play with others!"; ícone do app + selo Google Play pequeno (só Google Play no celular). Cookies nos 20% de baixo.
- Ordem [O]: hero → "What's Pikmin Bloom?" com vídeo no meio de uma colagem de fotos do mundo real → blocos de texto longo com cartão de foto real + selo "17846 STEPS" (`pikmin/d3.png`) → "Play with others!" (Party Walk, Weekly Challenges) → ícone + "Download Here" + selo.
- Memorável: criaturas em cima do aparelho; número de passos colado numa foto real. Fraco: parágrafos de 5–8 linhas no celular; `m2` é quase uma tela vazia (bloco ainda não carregado/animado).

### Jogos de criatura / coleção

**neko** — https://www.nekoatsume.com/en/ (altura 1746: a página inteira cabe em ~2 telas)
- 1ª dobra [O]: banner com logo; 3 abas com gatinho-ícone (Top / How to Play / Support); bloco amarelo em forma de gato "What is Neko Atsume?" com **moldura de celular mostrando a tela real do jogo** + 2 frases; começo do bloco "Download" (App Store, Google Play, QR).
- Ordem [O]: banner → abas → o que é (2 frases + celular) → Download → rodapé. Desktop: banner carrossel com "over 30 million downloads".
- Memorável: página inteira = 1 tela de jogo + 2 frases + baixar. É o site mais curto e mais claro da amostra.

**cookierun** — https://www.cookierun-kingdom.com/en/
- 1ª dobra [O]: vídeo de fundo borrado; logo; botão de play em losango; selo Google Play (só ele no celular; desktop tem os dois); já aparece o começo de "GAME OVERVIEW" com 5 chips (Cookies / Adventure / **Battles** / Kingdom / Guilds).
- Ordem [O]: hero → Game Overview (chips + 1 cartão por vez com setas) → Characters (chips Heroes / GingerBrave & Friends / Legends / Villains → carta grande ocupando a largura → nome, dublador, 5 linhas de bio, setas) → Story → Media (lista de vídeos com título) → rodapé.
- Navegação [O]: hambúrguer amarelo e botão Facebook flutuando por cima do conteúdo o tempo todo.
- Memorável: a ficha de personagem em formato de carta (`cookierun/m2.png`).

**umamusume** — https://umamusume.com/
- 1ª dobra [O]: logo, menu, arte do elenco inteiro, selo "The Game Awards — Best Mobile Game Winner", "Play Now!" + 4 selos de loja, faixa de loja web, redes sociais, começo de "News". Cookie nos 17% de baixo.
- Ordem [O]: hero → News → About (vídeo com legenda) → **Gameplay "Train your Umamusume!"** (capturas verticais do jogo com play, legenda de 1 frase "Lead your Umamusume to victory by choosing a training regimen that fits their needs!", 3 pontinhos) → Characters (mosaico de retratos com nome na lateral, 1 grande + vários pequenos) → selos de loja → rodapé.
- Memorável: `umamusume/m3.png` — gameplay vertical + 1 frase + mosaico, tudo em 1 tela e meia. Fraco: 1ª dobra entupida (9 elementos clicáveis).

**pokemongo** — https://pokemongo.com/en
- 1ª dobra [O]: cabeçalho; 1 vídeo horizontal pequeno com play no meio de um fundo azul vazio; "Latest News". Nenhum CTA, nenhuma frase. 
- Ordem [O]: vídeo → notícias → blocos de mecânica com foto (mão segurando o celular com a criatura em AR) + título + 3 linhas → carrossel de personagens (Arlo) → "Get Up and GO! Download Today" → rodapé.
- Fraco: quem chega sem conhecer não descobre o que é nem onde baixar na 1ª dobra.

**tcgpocket** — https://tcgpocket.pokemon.com/en-us/
- 1ª dobra [O]: vídeo de fundo (mão mexendo no celular), logo, caixa de cookies no meio da tela, botão flutuante "Reduced motion". CTA não visível.
- Ordem [O]: hero → "…Is Available Now!" → cartões de loja/guia → vídeo de gameplay dentro de moldura de celular (desktop `d2`) → "Immersive cards" com cartas grandes → fileira de cartas → rodapé.
- Memorável: opção "Reduced motion" sempre à mão. Fraco: cookie no centro.

**mhnow** — https://monsterhunternow.com/ (em português)
- 1ª dobra [O]: cabeçalho ("Loja Web", menu); cartão de evento; vídeo de fundo (monstro); ícone do app; "A caçada começa agora" + 2 linhas + link "Aprenda a jogar". Botões de baixar ficam atrás do cookie (no desktop: "Experimentar online" / "Baixe agora").
- Ordem [O]: hero → novidades (carrossel) → "Mais de 60 monstros para caçar" (cartões de monstro com nome) → "Escolha a sua arma" (grade de ícones + **vídeo vertical de gameplay** ao lado; no celular o vídeo fica logo abaixo dos ícones) → rodapé.
- Memorável: seletor de ícones que troca o clipe vertical. 

**brawl** — https://supercell.com/en/games/brawlstars/
- 1ª dobra [O]: cabeçalho Supercell; arte + logo; tudo escurecido pelo cookie (32% de baixo). Sem CTA.
- Ordem [O]: arte → "3v3 and Battle Royale" com gameplay em moldura de celular deitado + selos → News → "Stay up-to-date" → vídeos → rodapé com selos.
- Fraco: página de catálogo de estúdio, não landing.

**snap** — https://marvelsnap.com/
- 1ª dobra [O]: cabeçalho com ícone de download e carrinho; arte cheia; "DOWNLOAD NOW!" (selos atrás do cookie, 29%).
- Ordem [O]: hero → Latest News (1º cartão em branco = imagem não carregou) → Overview ("Award-Winning Strategy Game" + parágrafo de 11 linhas + leque de cartas) → redes → rodapé.
- Fraco: parágrafo de 11 linhas no celular.

### Vitrine / lançados "premium"

**alto** — https://www.altosodyssey.com/
- 1ª dobra [O]: logo + "The next adventure awaits"; paisagem; 3 selos de loja; começo do trailer. Sem cookies, sem menu.
- Ordem [O]: hero → trailer → 2º trailer → grade 3x2 de capturas → 9 prêmios em louros → 14 citações de imprensa com logo → **campo de e-mail "Sign up to join the adventure" + Submit** → redes → rodapé.
- Memorável: 1ª dobra limpa. Fraco: prêmios e citações em lilás sobre roxo, quase ilegíveis; e-mail só no fim, depois de ~5 telas.

**sky** — https://www.thatskygame.com/
- 1ª dobra [O]: paisagem cheia, logo, 5 círculos de plataforma (Apple, Android, Steam, Switch, PlayStation), menu flutuante; cookie 25%.
- Ordem [O]: hero → descrição → News → prêmios (logos grandes, 1 por linha) → Media → rodapé.

**afk** — https://afkjourney.farlightgames.com → página de temporada (`/GW-I2608092/m/`, versão própria para celular)
- 1ª dobra [O]: cabeçalho fixo (logo + "OFFICIAL SITE"); arte; "New Season — VEIL OF MEMORIES — Arrives September 23"; 3 selos de loja; começo de "New Rewards: Get 500+ Invite Letters & 100,000+ Diamonds!". Sem cookies.
- Ordem [O]: hero → recompensas → cenário (carrossel com setas e nome do local) → New Heroes (1 personagem por vez, placa com nome, setas) → novidades em pares título + 2 linhas + imagem → "Welcome Home, Magister!" + selos de novo + aviso "content… may change".
- Memorável: cada seção = título curto + 2 linhas centralizadas + 1 imagem; recompensa logo depois do CTA.

### Landing de tela única (gacha) — 4 sites, mesmo molde

**genshin**, **starrail**, **wuwa**, **zzz** [O]: arte vertical cheia; título da **versão** (não do jogo); 1 botão "Download"; botão de play pequeno; cookie. `genshin` tem 2 botões lado a lado ("Download" / "Newcomer Benefits") e selo "Up to 818 Bonus Primogems"; `zzz` tem barra fixa no rodapé "Join the Version 3.3 Check-In and Earn 20 Pulls Immediately! — Download"; `starrail` tem "Download Game" no topo e no meio; `wuwa` tem o botão colado no rodapé. Desktop do `starrail` rola: ficha de personagem (nome, estrelas, dublador, citação) → item → destaques com recompensa de check-in.
- Para nós: molde de "1 arte + 1 botão" funciona como cartaz, mas não explica nada a quem não conhece o jogo **[I]**.

**peridot** — https://playperidot.com/ — tela única, institucional, sem CTA de jogo. Pouco aproveitável.

## 2. Padrões com contagem (celular; N=22 salvo indicado)

| # | Padrão [O] | n/N | Quem |
|---|---|---|---|
| 1 | CTA ou selo de loja visível na 1ª dobra (como capturado) | 16/22 | afk, alto, cookierun, duolingo, finch, forest, genshin, habitica (formulário), neko, pikmin, sky, snap, starrail, umamusume, wuwa, zzz |
| 2 | Sem CTA visível na 1ª dobra | 6/22 | brawl, peridot, pokemongo; e mhnow, pokesleep, tcgpocket (CTA atrás do cookie) |
| 3 | Banner de cookies sobre a 1ª dobra | 16/22 | todos menos afk, alto, cookierun, duolingo, forest, neko |
| 4 | Frase que diz o que o produto faz na 1ª dobra | 7/22 | duolingo, finch, forest, habitica, mhnow, pokesleep, alto (só tagline) |
| 5 | 1ª dobra só com logo + arte (sem frase de promessa) | 10/22 | brawl, cookierun, neko*, peridot, pikmin, pokemongo, sky, snap, tcgpocket, umamusume (*neko explica logo abaixo, ainda na 1ª tela) |
| 6 | Título da 1ª dobra é nome de versão/temporada | 5/22 | afk, genshin, starrail, wuwa, zzz |
| 7 | Selo oficial de loja na 1ª dobra | 7/22 | afk, alto, cookierun, finch, neko, pikmin, umamusume |
| 8 | Só o selo Google Play para UA Android (desktop mostra os dois) | 4/22 | cookierun, finch, pikmin, duolingo (faixa de instalar) |
| 9 | Play de vídeo na 1ª dobra | 6/22 | cookierun, genshin, pokemongo, starrail, wuwa, zzz (+ fundo em vídeo em mhnow e tcgpocket **[I]**) |
| 10 | Gameplay real em moldura de celular, foto de aparelho ou captura vertical | 8/22 | neko, habitica, pokesleep, pokemongo, brawl, tcgpocket, umamusume, mhnow |
| 11 | Nenhuma tela real do produto em nenhuma captura | 5/16 com rolagem | duolingo, forest, alto*, sky*, afk* (*têm capturas/arte de cena, não a tela de celular); finch idem na tela única |
| 12 | Vitrine dedicada de personagens/criaturas | 9/22 | cookierun, umamusume, afk, mhnow, starrail (desktop), pokemongo, snap, tcgpocket, habitica |
| 13 | Vitrine "1 por vez" com setas | 4/9 | cookierun, afk, pokemongo, starrail |
| 14 | Vitrine em grade/mosaico/fileira | 5/9 | umamusume, mhnow, snap, tcgpocket, habitica |
| 15 | Prova social numérica ou prêmio | 9/22 | finch, forest, duolingo, habitica, alto, sky, umamusume, snap, neko (desktop) |
| 16 | Cabeçalho fixo durante a rolagem | 11/16 | afk, brawl, cookierun, duolingo, forest, mhnow, pikmin, pokemongo, sky, snap, umamusume |
| 17 | CTA de baixar sempre na tela (cabeçalho ou barra fixa) | 5/22 | duolingo (2), forest, snap, starrail, zzz |
| 18 | CTA repetido no fim da página | 9/16 | afk, alto (e-mail), brawl, forest, neko, pikmin, pokemongo, pokesleep, umamusume |
| 19 | Recompensa anunciada junto do CTA | 4/22 | afk, genshin, starrail, zzz |
| 20 | Campo de e-mail na página | 2/22 | alto (1 campo, no fim), habitica (3 campos, no topo) |
| 21 | Contador de pré-registro / metas por marco | 0/22 | — (amostra não tem pré-registro) |
| 22 | Seção de notícias em 2º lugar | 8/22 | brawl, mhnow, pokemongo, pokesleep, sky, snap, umamusume, peridot — coisa de jogo no ar, não serve a beta **[I]** |

## 3. O que funciona especificamente em tela de celular

1. **[O]** Um botão de largura quase total, na zona do polegar: duolingo (`duolingo/m1.png`), wuwa e zzz (colado no rodapé). **[I]** É o que o Soulmon já faz.
2. **[O]** Bloco = título de até 6 palavras + 1–2 linhas centradas + 1 imagem. forest (`forest/m2.png`), afk (`afk/m3.png`). O contrário (parágrafo de 8–11 linhas) aparece em snap (`snap/m3.png`) e pikmin (`pikmin/m3.png`) e vira parede de texto.
3. **[O]** Selo só da loja do aparelho (4/22). No celular Android, cookierun/finch/pikmin mostram 1 selo em vez de 2–4; umamusume mostra 4 e a 1ª dobra fica entupida.
4. **[O]** Tela do jogo em pé, dentro de moldura ou crua, ocupando ~40–60% da largura com texto ao lado (neko) ou a largura toda com 1 frase embaixo (umamusume). É legível sem zoom.
5. **[O]** Um item por vez com setas e pontinhos, em vez de grade encolhida: cookierun (carta), afk (herói), umamusume (gameplay).
6. **[O]** Chips de categoria que quebram em 2 linhas (cookierun: 3+2) em vez de abas que rolam para o lado.
7. **[O]** CTA persistente: cabeçalho que encolhe e ganha o botão depois da 1ª dobra (duolingo, forest).
8. **[O]** Número grande como elemento gráfico: "5.0" (finch), "2,311,002" (forest).
9. **[O]** Página curta: neko resolve tudo em ~2 telas; forest e duolingo levam 9–10 telas.

## 4. Como os apps de hábito com criatura explicam o loop em 1 tela

| App | Como [O] | Captura |
|---|---|---|
| Forest | 3 passos empilhados; a **mesma árvore** em 3 estados (broto → seca → crescida); título de 3–6 palavras + 1 linha cada. Mostra também a consequência ruim ("your tree dies"). | `forest/m2.png` |
| Habitica | 3 colunas: linhas de tarefa de verdade com caixinha marcada → sprites de recompensa → chefão com o grupo. A tarefa e a criatura aparecem lado a lado. | `habitica/d2.png` (no celular fica atrás do cookie) |
| Finch | 1 frase: "take care of your pet by taking care of yourself". Sem passo a passo, sem tela. | `finch/d1.png` |
| Pokémon Sleep | 1 foto (app na mão, de noite) + 1 frase + 2 ladrilhos ("Sleep Tracking" / "Pokémon"). | `pokesleep/m1.png`, `pokesleep/d2.png` |
| Pikmin Bloom | Vídeo + colagem de fotos reais + contagem de passos sobre foto real; mas explica com parágrafos longos. | `pikmin/d2.png`, `pikmin/d3.png` |
| Duolingo | **Não explica o loop.** Aposta na marca: frase de benefício + botão. O hábito aparece só como bloco "stay motivated". | `duolingo/m1.png` |

**Síntese [I]:** os dois que realmente explicam o mecanismo (Forest, Habitica) fazem igual: **causa do mundo real → efeito na criatura**, em 3 passos, com a criatura mudando de estado, quase sem texto. Finch e Pokémon Sleep trocam o passo a passo por 1 frase em espelho ("X do pet = X de você"). Nenhum dos 6 usa vídeo como explicação principal. Nenhum promete resultado de saúde na 1ª dobra — falam de "fun", "time well spent", "something to look forward to" **[O]**.

## 5. Anti-padrões vistos

1. **Cookie comendo a 1ª dobra** — 16/22; em habitica, pokesleep, tcgpocket e finch esconde o CTA ou a promessa. **[I]** Para tráfego pago de Instagram isso é a primeira coisa que a pessoa vê.
2. **Formulário pesado no topo** — habitica pede e-mail + senha + confirmação antes de mostrar o produto, e o formulário aparece cortado a 390 px (`habitica/m1.png`).
3. **1ª dobra sem dizer o que é** — pokemongo (vídeo pequeno num vazio azul + notícias), brawl, sky, tcgpocket.
4. **Título de versão no lugar da promessa** — os 4 gacha e afk. Só serve a quem já joga.
5. **Excesso de selos e links na 1ª dobra** — umamusume (4 lojas + loja web + 4 redes + prêmio).
6. **Parede de texto** — snap (11 linhas), pikmin (5–8 linhas por bloco).
7. **Prova social ilegível** — alto: louros e citações lilás sobre roxo, 3 telas seguidas (`alto/m2.png`, `alto/m3.png`).
8. **E-mail enterrado no fim** — alto: o campo só aparece na 4ª captura.
9. **Botões flutuantes sobre o conteúdo** — cookierun (Facebook em cima da carta), mhnow e pikmin (cartão de evento fixo cobrindo títulos: `pikmin/m3.png`, `mhnow/m3.png`).
10. **Imagem que não carrega / tela vazia** — snap (cartão de notícia em branco), pikmin (`pikmin/m2.png` quase vazia).
11. **Nenhuma tela real do produto** — duolingo, forest, finch. Eles podem (marca conhecida + nota de loja); um beta desconhecido não **[I]**.

## 6. Comparação franca com o site atual do Soulmon

Vistos: `E:\Soulmon-marketing\preview-prints\11-celular-hero.png`, `12-celular-popup.png`, `09-inscricao.png`, `02-ciclo.png`, `03-seu-soulmon.png`, `08-como-entrar.png`. Só `11` e `12` são de celular; o resto é desktop — **não vi** como ciclo, linha de evolução, abas e formulário ficam a 390 px.

**Onde o Soulmon já está acima da média da amostra [O]**
- 1ª dobra sem banner de cookies (só 6/22 conseguem).
- Frase que diz o que é, em 6 palavras: "Criaturas que evoluem com suas tarefas." (só 7/22 têm promessa na 1ª dobra).
- 1 CTA só, largura total, embaixo, com a letra miúda honesta logo abaixo ("Android. 1ª leva: 50 vagas, por ordem de inscrição.").
- Formulário de 1 campo (habitica pede 3); consentimento e 18+ numa linha.
- Seção "Faz a tarefa, seu Soulmon evolui." já usa a receita do Habitica (lista de tarefas ao lado da criatura) e rotula "Demonstração. No jogo, evoluir leva dias." — nenhum site da amostra rotula demonstração.
- "Como entrar" em 3 passos com prazo real (7 dias, 14 dias) — mesma estrutura do loop do Forest.
- Identidade visual própria e consistente; não parece modelo pronto.

**Onde está abaixo [O] + [I]**
- **[O]** A 1ª dobra não mostra que é um app de celular: não há tela do jogo, moldura, nem selo Google Play — só a palavra "Android" em letra miúda. 8/22 mostram a tela real; neko mostra na 1ª dobra.
- **[O]** A criatura ocupa ~1/5 da altura e disputa com um cenário muito detalhado; a frase fica por cima de arte cheia de pontos de luz. Finch/Forest/Duolingo isolam 1 personagem em fundo calmo. **[I]** Em tela pequena e com sol, o cenário vira ruído e a criatura some.
- **[O]** A tarefa (metade da promessa) não aparece na 1ª dobra — só a criatura. O loop só é mostrado na 2ª seção.
- **[O]** Nenhuma prova de que é real: nem captura de tela, nem número. (Regra da casa: só número real — então a prova disponível hoje é gameplay real rotulado, não nota de loja.)
- **[O]** Nos prints de desktop há muito vazio escuro (em `03-seu-soulmon.png` e `02-ciclo.png` mais da metade da tela é fundo). **[I]** Se isso se repetir no celular, a página fica longa e rala.
- **[O]** O campo de e-mail só existe no fim da página; o botão do topo depende de rolagem. alto faz o mesmo e é anti-padrão 8.
- **[O]** Não vi CTA fixo durante a rolagem (5/22 têm).
- **[O]** No popup de sucesso a única ação é "Fechar"; "Compartilhar"/"Copiar link" ficam atrás, no formulário. **[I]** O momento de maior boa vontade termina num botão que não faz nada pelo beta.
- **[O]** Título em versalete serifado ("SEU SOULMON ESTÁ ESPERANDO.") é bonito, mas no celular quebra em 3 linhas de caixa alta; os apps de hábito usam caixa normal, sem serifa.

## 7. Doze princípios acionáveis

1. **A 1ª dobra tem 5 coisas e nada mais: marca, promessa, criatura, tela do jogo, botão.** [O] neko entrega logo + o que é + tela + baixar em 1 tela. → `…\benchmark-mobile\neko\m1.png`
2. **Mostrar a tela real do jogo, em pé, já na 1ª dobra — e rotular "tela do jogo".** [O] 8/22 mostram; neko e umamusume fazem legível sem zoom. Resolve a regra "só gameplay real rotulado". → `…\neko\m1.png`, `…\umamusume\m3.png`
3. **Uma criatura grande em fundo calmo; cenário detalhado sai de trás do texto.** [O] finch, forest e duolingo isolam 1 personagem. → `…\forest\m1.png`, `…\duolingo\m1.png`
4. **Explicar o loop em 3 passos com a mesma criatura mudando de estado, 1 linha por passo.** [O] Forest. No Soulmon: tarefa marcada → energia → nova forma, com as formas reais de `03-seu-soulmon`. → `…\forest\m2.png`
5. **Pôr a tarefa ao lado da criatura (causa → efeito), sem parágrafo.** [O] Habitica; o Soulmon já tem isso na 2ª seção — subir para a 1ª ou 2ª tela do celular e manter o rótulo "Demonstração". → `…\habitica\d2.png`
6. **Um CTA só, largura total, sempre ao alcance: no topo, fixo depois da 1ª dobra, e de novo no fim.** [O] duolingo e forest (cabeçalho que ganha o botão); 9/16 repetem no fim. → `…\duolingo\m2.png`, `…\forest\m4.png`
7. **O campo de e-mail fica a 1 toque: ou na 1ª dobra, ou o botão abre o campo ali mesmo. 1 campo, nunca senha.** [O] alto enterra o e-mail na 4ª tela; habitica pede 3 campos e quebra a 390 px. [I] folha que sobe do rodapé resolve sem rolar. → `…\alto\m4.png`, `…\habitica\m1.png` (como não fazer)
8. **Zero banner de consentimento sobre a 1ª dobra.** [O] 16/22 perdem de 20% a 50% da tela; manter o que o Soulmon já faz (sem rastreio que exija banner; consentimento na linha do formulário). → `…\pokesleep\m1.png` (como não fazer)
9. **Falar a língua do aparelho: no Android, só Google Play; fora dele, dizer na hora que o beta é só Android.** [O] cookierun, finch, pikmin mostram 1 selo para UA Android. [I] usar o selo/ícone da Play junto da letra miúda dá a pista "é app" que hoje falta. → `…\finch\m1.png`, `…\cookierun\m1.png`
10. **Número grande só se for verdadeiro — e então em tamanho de título.** [O] "5.0" (finch), "2,311,002" (forest). No Soulmon os números reais são "50 vagas" e vagas restantes de fato; nada de nota ou total inventado. → `…\forest\m3.png`, `…\finch\m1.png`
11. **Criaturas como fichas, uma por vez, com setas; categorias em chips que quebram linha.** [O] cookierun (carta + nome + 1 frase), afk (placa com nome). No Soulmon: 1 Soulmon por elemento, silhuetas "?" para o que não foi revelado (já existe). → `…\cookierun\m2.png`, `…\afk\m2.png`
12. **Cada seção cabe em 1 tela: título de até 6 palavras, até 2 linhas, 1 imagem. Página inteira em 5–6 telas.** [O] forest e afk seguem; snap e pikmin viram parede; neko prova que 2 telas bastam. → `…\afk\m3.png`, `…\snap\m3.png` (como não fazer)

(`…` = `E:\Soulmon-marketing\_pesquisa\benchmark-mobile`)

## 8. Seis capturas mais inspiradoras

1. `E:\Soulmon-marketing\_pesquisa\benchmark-mobile\forest\m2.png` — loop em 3 passos com a criatura mudando de estado.
2. `E:\Soulmon-marketing\_pesquisa\benchmark-mobile\neko\m1.png` — 1ª dobra com tela real do jogo em moldura + 2 frases + baixar.
3. `E:\Soulmon-marketing\_pesquisa\benchmark-mobile\umamusume\m3.png` — gameplay vertical com 1 frase e mosaico de personagens.
4. `E:\Soulmon-marketing\_pesquisa\benchmark-mobile\duolingo\m1.png` — mascote isolado, promessa, botão de largura total, faixa de instalar.
5. `E:\Soulmon-marketing\_pesquisa\benchmark-mobile\cookierun\m2.png` — ficha de personagem em carta com chips e setas.
6. `E:\Soulmon-marketing\_pesquisa\benchmark-mobile\habitica\d2.png` — tarefa ao lado da criatura (causa → efeito) em pixel art.

## 9. O que ficou sem resposta

- Pré-registro/beta de verdade (contador, metas, recompensa por marco, lista de espera): 0 exemplos na amostra. Precisa de outra rodada de capturas com páginas de pré-registro ativas.
- O que está atrás dos banners de cookies (CTA de mhnow, pokesleep, tcgpocket, snap; subtítulo do finch no celular).
- Site do Soulmon a 390 px além do hero e do popup (ciclo, evolução, abas, como entrar, formulário): não há print de celular dessas seções.
- `mv3` e `squad`: URLs erradas/aposentadas; não substituídas.
- Comportamento em movimento (vídeo toca sozinho? carrossel desliza sozinho?): captura parada não mostra.
