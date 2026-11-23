# Design guide do site do beta do Soulmon (v1, 05/11/2026)

Para quem desenha, escreve ou revisa o site. Os valores vivem no [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) e no `site-beta/src/styles/tokens.css`; aqui fica o porquê e o como usar. Todo número citado é um token; se divergir, vale o token.

Capturas do benchmark: `J\<site>\<arq>` = `E:\Soulmon-marketing\_pesquisa\benchmark-sites\<site>\<arq>.png` (jogos, [BENCHMARK-VISUAL-JOGOS.md](BENCHMARK-VISUAL-JOGOS.md)); `M\<site>\<arq>` = `E:\Soulmon-marketing\_pesquisa\benchmark-mobile\<site>\<arq>.png` ([BENCHMARK-VISUAL-MOBILE.md](BENCHMARK-VISUAL-MOBILE.md)).

**Quem visita:** chega de anúncio no Instagram ou de comunidade de jogos, no celular Android, com pressa, às vezes no sol. Não conhece o Soulmon. Decide em segundos se vale deixar o e-mail.

**O que a página precisa fazer:** mostrar que **faz tarefa, seu Soulmon evolui**, provar com tela real, e levar ao campo de e-mail. A riqueza do universo vem depois.

---

## 1. Princípios

Cada princípio nasce de uma observação contada no benchmark ou de uma regra do dono.

### P1. Cada rolagem é um lugar
Cada seção é uma área do jogo em tela cheia, com criaturas nela; o texto aparece como parte da cena. Seções calmas alternam com as cenas, e uma seção clara dá respiro.
- **Origem:** 8 de 18 sites de jogos trocam o cenário inteiro por seção, e são os melhores (`J\ori\d1` → `d2`, `J\stardew\d1` → `d2`, `J\cultlamb\d2`). Os medianos repetem um fundo preto (`J\silksong\d2`). O site atual é escuro do começo ao fim (diagnóstico §1.4).
- **Na prática:** mapa como fundo, nunca dentro de cartão pequeno (`04-aba-universo.png` prendia seis mapas em tiras).

### P2. Mostre o jogo de verdade, e diga que é de verdade
Toda tela do app aparece dentro de moldura de aparelho com o rótulo "Gameplay real". A demonstração interativa é rotulada "Demonstração"; a abertura, "Cinemática".
- **Origem:** 8 de 22 sites mobile mostram tela real, e são os mais claros (`M\neko\m1`, `M\umamusume\m3`). Duolingo, Forest e Finch não mostram, mas têm marca e nota de loja; um beta desconhecido não tem. Nenhum dos 22 rotula demonstração: o Soulmon rotular é vantagem, não custo. Regra do dono (PLANO §17 e §18).

### P3. Causa e efeito, em 3 passos, com a mesma criatura
A tarefa marcada fica ao lado da criatura que muda. Três passos, a mesma criatura em três estados, uma linha cada.
- **Origem:** os dois apps de hábito que explicam o mecanismo fazem assim: `M\forest\m2` (a mesma árvore em 3 estados) e `M\habitica\d2` (linha de tarefa ao lado do sprite).

### P4. Um caminho só, sempre ao alcance
Uma ação principal ("Entrar no beta"), visível na 1ª dobra, fixa durante a rolagem e repetida no fim. Nunca dois botões primários na mesma tela.
- **Origem:** 4 de 18 sites de jogos mantêm CTA fixo e são os de melhor conversão aparente; Eastward é o único que acerta beleza e CTA juntos (`J\eastward\m1`, `J\eastward\d5`). Duolingo e Forest ganham o botão no cabeçalho depois da dobra. Contraexemplo: botão flutuante cobrindo título (`J\palworld\d3`).

### P5. A interface é feita do material do jogo
Botão, painel, aba, barra e divisor são peças de pixel art com cobre, cristal com chama, circuito e folhinhas. O texto em cima é limpo.
- **Origem:** os 5 melhores sites de jogos fazem a interface com o material do mundo (`J\seaofstars\d3`, `J\seaofstars\d4`, `J\cultlamb\d2`, `J\tunic\d2`); nos medianos o ornamento para no logo (`J\silksong\d1`). Padrão 11: 7 de 18.

### P6. Pouco texto: título de até 6 palavras e uma frase
Quem chega não tem tempo. Cada seção tem um título e uma frase. Exceções: FAQ e privacidade.
- **Origem:** regra do dono (PLANO §18). Confirmada no benchmark: `M\forest\m2` e `M\afk\m3` (título curto + 2 linhas + 1 imagem) contra `M\snap\m3` (11 linhas) e `M\pikmin\m3` (parede de texto).

### P7. Só número verdadeiro
Número grande é argumento forte (`J\palworld\d2`, `M\forest\m3`, `M\finch\m1`), então só entra o que é real: 50 vagas, 20 elementos, mais de 200 combinações, 5 formas.
- **Contra o benchmark:** 9 de 22 usam prova social numérica. O Soulmon ainda não tem, e não se inventa: nada de nota, inscritos ou contador dinâmico na v1.

---

## 2. Fundamentos (o porquê de cada decisão)

### 2.1 Cor
- **Turquesa escuro é a superfície, turquesa vivo é energia.** `--sb-fundo` `#071413` e `--sb-sup` `#0F2A29` vêm do app; `--sb-pri` `#5FF3E0` é usado como luz (link, foco, check, "Forma N de 5"), nunca como parede. *Porquê:* o site tem que parecer o jogo, e o jogo é noturno.
- **Cobre é moldura, ouro é número.** `--sb-anel` `#C68642` contorna; `--sb-ouro` `#EBBE84` destaca "MISSÃO 0/3", "50" e "Demonstração". *Porquê:* é a mesma divisão do app (`gold-ink` ≠ `gold-fill`).
- **Uma seção clara.** "Como entrar" usa o tema claro do app (`#F1F7F5`, tinta `#0E2422`, 15,0:1). *Porquê:* ritmo claro e escuro (`J\seaofstars\d4`), e é a seção de instrução, que pede leitura calma.
- **Todo par de texto ≥ 4,5:1, medido** (tabela no DESIGN-SYSTEM §2.3). Sobre mapa, véu de 0,72 (só texto principal) ou 0,82 (qualquer texto), calculado contra pixel branco.

### 2.2 Tipografia
- **Cinzel nos títulos, Rubik em tudo o mais, inclusive botão.** Regra do dono; são as fontes do app. Silkscreen fica fora: no app ela só vive dentro do visor, e fonte pixel em parágrafo cansa (`J\balatro\d2`).
- **Escala fluida com piso de 14px.** H2 vai de 28px (390) a 48px (1440). *Porquê:* acima de 14px o texto aguenta sol e pressa; o app usa 12, o site não.
- **Rótulo espaçado em caixa alta** (14px, 600, `.12em`) é o terceiro nível que faltava (diagnóstico §5.11) e é exatamente o "HOJE" da Home.

### 2.3 Espaço e grade
- Base 4. 4 colunas (390), 8 (768), 12 (1024+), contêiner de 1200px.
- Margem esquerda maior que a direita porque a barra de cobre mora ali. *Porquê:* a barra nunca encosta em texto.

### 2.4 Raio, elevação, movimento
- **Moldura de arte tem raio 0; sombra é dura.** *Porquê:* desfoque e canto arredondado em CSS desmentem a pixel art ao lado.
- **Uma curva, durações do app** (120/200/320ms) mais três do site (480 cena, 1600 flutuação, 900 carregando). *Porquê:* movimento é vocabulário, não enfeite.
- **Movimento reduzido reduz movimento, nunca informação:** o elenco para, a demo vira 5 estágios empilhados, o cenário troca por corte, o vídeo espera o play.

---

## 3. Faça e não faça (exemplos concretos)

| Faça | Não faça | Por quê |
|---|---|---|
| Mapa da Exploração em tela cheia no hero, criaturas pisando na ponte | Mapa numa tira de 28% da largura com o resto preto (`01-hero.png`) | P1; 11 de 18 abrem com cena cheia |
| Protagonista a 4x (256px) e companheiras a 3x e 2x, mais ao fundo | Criatura a 2,7x para "caber" | Pixel art só em escala inteira |
| "Entrar no beta" no hero, no CTA fixo e na seção final | "Entrar no beta" e "Quero participar" em lugares diferentes | Um destino, um rótulo |
| "Ver o jogo" em contorno ao lado do primário | Dois botões cheios lado a lado | P4: um primário por tela |
| Lista com "HOJE · MISSÃO 0/3" e caixinha de cobre 24px, como no app | Título da lista em Cinzel, caixinha turquesa redonda | Tem que ser reconhecível como o jogo |
| Rótulo "GAMEPLAY REAL" colado em cima da moldura do aparelho | Rótulo no rodapé da seção, ou só no hover | P2; quem rola rápido não vê |
| "Demonstração. No jogo, evoluir leva dias." sobre a demo | Demo sem rótulo, como se fosse o app | Honestidade sobre o ritmo real |
| Ícone de elemento pelado + nome ao lado | Ícone dentro de quadrado com borda | Regra do app: ícone nunca em caixa |
| "?" como texto Rubik 700 sobre a silhueta | "?" desenhado dentro do asset | Texto real escala, traduz e é lido |
| "20 elementos" em número grande dourado | "Mais de 10.000 jogadores" | P7 |
| Véu escuro só atrás do bloco de texto, chegando a 0 em 64px | Escurecer a cena inteira em 60% | A cena é o argumento |
| Pop-up que termina em "Compartilhar" com "Fechar" como link | Pop-up que termina só em "Fechar" | O melhor momento de boa vontade não pode morrer num botão vazio |
| Sem divisor até o asset `divisor` existir | Cano e cristal desenhados em CSS | PLANO §18: sem CSS imitando asset |
| Cristal, folha, circuito e cobre como ornamento | Engrenagem, rebite, válvula, manômetro, correia | Identidade: arcano, não steampunk |
| Abas Universo/Habitantes/Jogos/Elementos; no celular, chips em 2 linhas | Abas que rolam para o lado no celular | `M\cookierun\m1`: chips que quebram linha |
| Campo com rótulo visível e a dica "E-mail da conta Google usada na Play Store." | Placeholder fazendo papel de rótulo | Some ao digitar |
| CTA fixo some quando o formulário aparece | CTA fixo por cima do campo de e-mail | Elemento fixo não cobre conteúdo |
| Nenhum banner de cookie | Banner de consentimento na 1ª dobra | 16 de 22 perdem até 52% da tela com isso (`M\pokesleep\m1`) |

---

## 4. Voz e microcopy

### 4.1 Voz
Calma, convidativa, concreta. O Soulmon **evolui com** a pessoa e a encoraja; nunca cobra. Frases curtas, verbo no começo, nada de exclamação em série. O par em inglês é escrito para quem lê inglês, não traduzido palavra por palavra (o inglês é a língua principal do produto; o site abre em PT para o tráfego brasileiro e oferece EN).

**Nunca escrever:** "domador", "treinador", "tamer", "digievolução", "mundo digital"; "dia perfeito" (no jogo é "dia completo"); "vírus", "data", "vacina" (os caminhos são Poder, Harmonia, Benevolência); culpa ou pressa ("não perca", "corra", "últimas vagas!"); promessa de saúde ou produtividade medida; número que não existe; "grátis" (há compras no app).

### 4.2 Textos por seção (PT / EN)

| Seção | Título | Frase |
|---|---|---|
| 1 Hero | Criaturas que evoluem com suas tarefas. / Creatures that grow with your tasks. | **50** vagas no beta para Android. / **50** spots in the Android beta. · linha: Android, pela Google Play. / Android, via Google Play. |
| 2 | O jogo na sua mão / The game in your hand | A tela de verdade, gravada no celular. / The real screen, recorded on a phone. |
| 3 | Faz a tarefa, seu Soulmon evolui. / Do the task, your Soulmon grows. | Marque as tarefas e veja a forma mudar. / Check off tasks and watch it change. · rótulo: No jogo, evoluir leva dias. / In the game, evolving takes days. |
| 4 | Seu Soulmon é só seu / Your Soulmon is yours alone | Nasce de um teste de personalidade; o elemento muda o corpo e o combate. / Born from a personality test; its element shapes its body and its fights. |
| 5 | O universo / The world | Lugares, habitantes, jogos e elementos. / Places, people, games and elements. |
| 6 | O que você faz / What you do | Cuide, explore e jogue, um pouco por dia. / Care, explore and play, a little each day. |
| 7 | Abertura / Opening | A cinemática que abre o jogo. / The cinematic that opens the game. |
| 8 | Como entrar / How to join | Três passos, sem pressa. / Three steps, no rush. |
| 9 | Perguntas / Questions | (sem frase) |
| 10 | Seu Soulmon está esperando. / Your Soulmon is waiting. | (campo, botão, linha legal) |

Passos (seção 8): **1** Deixe seu e-mail / Leave your email · "Use o e-mail da sua conta Google." / "Use your Google Account email." **2** Receba o convite / Get your invite · "Você tem 7 dias para aceitar." / "You have 7 days to accept." **3** Instale e jogue / Install and play · "Fique no teste por 14 dias." / "Stay in the test for 14 days." Regra das 50 em uma linha: "A 1ª leva tem 50 vagas, por ordem de inscrição; depois, lista de espera." / "The first wave has 50 spots in sign-up order; after that, a waitlist." O texto legal completo da regra (PLANO §17) vai no FAQ.

### 4.3 Botões, rótulos, estados

| Uso | PT | EN |
|---|---|---|
| CTA principal | Entrar no beta | Join the beta |
| CTA com lista de espera | Entrar na lista | Join the waitlist |
| Secundário do hero | Ver o jogo | See the game |
| Carregando | Enviando… | Sending… |
| Rótulos de mídia | GAMEPLAY REAL · DEMONSTRAÇÃO · CINEMÁTICA | REAL GAMEPLAY · DEMO · CINEMATIC |
| Setas da ficha | Criatura anterior · Próxima criatura | Previous creature · Next creature |
| Contador da ficha | 3 de 8 | 3 of 8 |
| Silhueta | Forma ainda não revelada | Form not revealed yet |
| Vídeo | Pausar vídeo · Tocar vídeo | Pause video · Play video |
| Pular | Pular para o conteúdo | Skip to content |

### 4.4 Erros: antes e depois

| Antes (genérico) | Depois (diz o que houve e o que fazer) |
|---|---|
| "E-mail inválido." | "Confira o e-mail: falta algo antes ou depois do @." / "Check the email: something is missing before or after the @." |
| "Erro. Tente novamente." | "Sem conexão. Seu e-mail não foi enviado; tente de novo." / "No connection. Your email wasn't sent; try again." |
| "Erro 429." | "Muitas tentativas daqui. Tente de novo amanhã." / "Too many tries from here. Try again tomorrow." |
| "Falha na verificação." | "Não deu para confirmar que você é uma pessoa. Recarregue a página." / "We couldn't confirm you're a person. Reload the page." |
| "Este e-mail já existe." (como erro, em vermelho) | "Esse e-mail já está na fila. O convite chega nele." (informativo, turquesa) / "That email is already in line. Your invite will go there." |
| "Fechar" como única saída do pop-up | "Compartilhar" + link "Fechar" / "Share" + "Close" |

---

## 5. Padrões de tela por seção (wireframes em texto)

Legenda: `[BOTÃO]` primário · `(botão)` contorno · `<arte>` asset · `{...}` mapa de fundo · `▌` barra lateral. Medidas em px CSS.

### 0. Barra superior + barra lateral + CTA fixo

```
390                                         1440
┌▌──────────────────────────────┐          ┌▌────────────────────────────────────────────────────┐
│▌ <logo 40>          English   │ 56       │▌  <logo 48>                 English  [Entrar no beta]│ 64
│▌ (sem fundo sobre o hero)     │          │▌  CTA compacto 1x só depois que o CTA do hero sai     │
│▌                              │          │▌                                                     │
│▌ ...                          │          │▌  sem CTA fixo no rodapé                              │
├▌──────────────────────────────┤          └▌────────────────────────────────────────────────────┘
│▌ [      Entrar no beta      ] │ 96 fixo, entra quando o CTA do hero sai, some no formulário
└▌──────────────────────────────┘
```

### 1. Hero: Exploração

```
390 × 664 (svh)                                 1440 × 900
┌▌─────────────────────────────┐               ┌▌───────────────────────────────────────────────────────┐
│▌ <LOGO COMPLETO 200>   English│               │▌ <LOGO COMPLETO 360>                          English  │
│▌ {exploração inteira, sem     │               │▌                               {exploração em cover,    │
│▌  corte, véu 0,72 no topo}    │               │▌ CRIATURAS QUE EVOLUEM          foco no terço direito}  │
│▌ CRIATURAS QUE                │               │▌ COM SUAS TAREFAS.  (64)              <cria 3x>         │
│▌ EVOLUEM COM                  │               │▌                                  <PROTAGONISTA 4x>     │
│▌ SUAS TAREFAS.  (32,5)        │               │▌ 50 vagas no beta para Android  <2x>  <3x>   <2x> <2x> │
│▌ 50 vagas no beta  <PROTAG 3x>│               │▌ [ Entrar no beta 2x 360 ] ( Ver o jogo 2x 240 )       │
│▌  <1x>  <1x>      (192)       │               │▌ Android, pela Google Play.                            │
│▌ [   Entrar no beta  3x 120  ]│               │▌ véu 0,72 só nas colunas 1–6                            │
│▌   Ver o jogo (link)          │               └▌───────────────────────────────────────────────────────┘
│▌ Android, pela Google Play.   │
└▌─────────────────────────────┘
```
No celular "Ver o jogo" é link de texto (não cabe um segundo botão de 80px na dobra).

### 2. O jogo na sua mão: painel calmo

```
390                                   1440
┌▌──────────────────────────┐        ┌▌──────────────────────────────────────────────────────┐
│▌ O JOGO NA SUA MÃO         │        │▌        O JOGO NA SUA MÃO           GAMEPLAY REAL       │
│▌ A tela de verdade, ...    │        │▌        A tela de verdade,       ┌───────────────┐     │
│▌     GAMEPLAY REAL         │        │▌        gravada no celular.      │  loop real     │     │
│▌   ┌────────────────┐      │        │▌                                  │  da Home      │     │
│▌   │ loop real 240  │      │        │▌   1 <sprite 3x> Marque a tarefa  │  320 × 692    │     │
│▌   │ da Home        │      │        │▌   2 <sprite 3x> A energia enche  └───────────────┘     │
│▌   └────────────────┘ ‖ pausa       │▌   3 <sprite 3x> A forma muda                           │
│▌ 1 <2x> Marque a tarefa    │        └▌──────────────────────────────────────────────────────┘
│▌   <seta 90°>              │
│▌ 2 <2x> A energia enche    │
│▌ 3 <2x> A forma muda       │
└▌──────────────────────────┘
```
Sem item em `midia.json`, a seção não aparece (e a Fatia 1 não publica).

### 3. Faça a tarefa: Laboratório (demo com scroll)

```
390 (pin de 340svh; sem pin em movimento reduzido)        1440
┌▌──────────────────────────────┐   ┌▌───────────────────────────────────────────────────────┐
│▌ FAZ A TAREFA, SEU             │   │▌            FAZ A TAREFA, SEU SOULMON EVOLUI.           │
│▌ SOULMON EVOLUI.               │   │▌         Marque as tarefas e veja a forma mudar.        │
│▌ DEMONSTRAÇÃO · No jogo, ...   │   │▌  DEMONSTRAÇÃO · No jogo, evoluir leva dias.           │
│▌ Forma 3 de 5                  │   │▌        Forma 3 de 5         ┌ HOJE  MISSÃO 1/3 ────┐  │
│▌ ┌disco 1x 240┐ ┌ HOJE MISSÃO┐  │   │▌                              │ HÁBITOS              │  │
│▌ │ <sprite 2x>│ │ ☐ Lavar... │  │   │▌     <sprite 4x 256>          │ ☑ Lavar a louça      │  │
│▌ │  <cristal> │ │ ☑ Respond..│  │   │▌   <disco 2x 480>             │ ☐ Responder e-mail   │  │
│▌ └────────────┘ └────────────┘  │   │▌     <cristal>                │ ☐ Ler dez páginas    │  │
│▌ (lista 320 empilha abaixo     │   │▌                              └ 360 ─────────────────┘  │
│▌  do disco abaixo de 390)      │   │▌                [ Entrar no beta 2x ]                   │
└▌──────────────────────────────┘   └▌───────────────────────────────────────────────────────┘
```
Mapa do Laboratório ao fundo com véu 0,82 atrás do título; lista e disco sobre `--sb-sup` com `--sb-sombra-1`.

### 4. Seu Soulmon: Jogos

```
390                                   1440
┌▌──────────────────────────┐        ┌▌───────────────────────────────────────────────────────┐
│▌ SEU SOULMON É SÓ SEU      │        │▌ SEU SOULMON É SÓ SEU           ┌ ficha 480 ─────────┐ │
│▌ Nasce de um teste...      │        │▌ Nasce de um teste de...        │  <sprite 4x 256>    │ │
│▌ 20 elementos (51)         │        │▌ 20 elementos  (83–96)          │   NOME (Cinzel 24) │ │
│▌ mais de 200 combinações   │        │▌ mais de 200 combinações         │ <el> Planta <el> Ar│ │
│▌ ┌ficha─────────────────┐   │        │▌ ÁRVORE 5 FORMAS                │ 1 frase             │ │
│▌ │ ‹  <sprite 3x 192>  › │   │        │▌ Forma 1   [ok]                 │ ‹    3 de 8       › │ │
│▌ │   NOME               │   │        │▌ Forma 2 [ok][?][?]             └────────────────────┘ │
│▌ │ <el>Planta <el>Ar     │   │        │▌ Forma 3 [ok][?][?]  células 144, sprite 2x            │
│▌ │ 1 frase   3 de 8      │   │        │▌ Forma 4 [ok][?][?]                                     │
│▌ └──────────────────────┘   │        │▌ Forma 5   [ok]                                         │
│▌ ÁRVORE (células 96, 1x)   │        └▌───────────────────────────────────────────────────────┘
│▌ [ok] / [ok][?][?] x3 / [ok]│
└▌──────────────────────────┘
```

### 5. O universo: Hall

```
390                                   1440
┌▌──────────────────────────┐        ┌▌───────────────────────────────────────────────────────┐
│▌ O UNIVERSO                │        │▌ O UNIVERSO   Lugares, habitantes, jogos e elementos.  │
│▌ Lugares, habitantes...    │        │▌ [Universo][Habitantes][Jogos][Elementos]  abas 48     │
│▌ [Universo  ][Habitantes ] │        │▌ ┌ painel 9-slice ────────────────────────────────────┐│
│▌ [Jogos     ][Elementos  ] │ chips  │▌ │ <lugar><lugar><lugar><lugar><lugar><lugar> 6 col   ││
│▌ ┌───────────┐┌──         │        │▌ │  nome Cinzel 16 sobre véu                           ││
│▌ │ <lugar>   ││ <lugar     │ 72%    │▌ └─────────────────────────────────────────────────────┘│
│▌ │ EXPLORAÇÃO││            │ snap   └▌───────────────────────────────────────────────────────┘
│▌ └───────────┘└──         │
│▌        ‹   1 de 6   ›    │
└▌──────────────────────────┘
```
Hall tem céu claro: véu 0,82 atrás de todo texto.

### 6. O que você faz: Arena

```
390                                   1440
┌▌──────────────────────────┐        ┌▌───────────────────────────────────────────────────────┐
│▌ O QUE VOCÊ FAZ            │        │▌ O QUE VOCÊ FAZ   Cuide, explore e jogue, um pouco...  │
│▌ Cuide, explore e jogue... │        │▌ ┌GAMEPLAY REAL┐ ┌GAMEPLAY REAL┐ ┌GAMEPLAY REAL┐       │
│▌ ┌GAMEPLAY REAL┐┌──        │        │▌ │ <Home 200>  │ │ <Hall 200>  │ │ <Jogos 200> │       │
│▌ │ <Home 200>  ││ <Hall    │ 260    │▌ │ Sua lista   │ │ Amigos e    │ │ Jogos       │       │
│▌ │ Sua lista   ││          │ snap   │▌ │ do dia      │ │ guilda      │ │ rápidos     │       │
│▌ │ do dia      ││          │        │▌ │ 1 linha     │ │ 1 linha     │ │ 1 linha     │       │
│▌ └─────────────┘└──        │        │▌ └─────────────┘ └─────────────┘ └─────────────┘       │
└▌──────────────────────────┘        └▌───────────────────────────────────────────────────────┘
```

### 7. Abertura: painel calmo

```
390                                   1440
┌▌──────────────────────────┐        ┌▌───────────────────────────────────────────────────────┐
│▌ ABERTURA                  │        │▌  ABERTURA                     CINEMÁTICA              │
│▌ A cinemática que abre...  │        │▌  A cinemática que abre       ┌──────────────┐        │
│▌      CINEMÁTICA           │        │▌  o jogo.                     │ vídeo 9:16   │        │
│▌   ┌───────────────┐       │        │▌                               │ poster, play │        │
│▌   │ poster ▶ 240  │       │        │▌                               │ manual, som  │        │
│▌   └───────────────┘       │        │▌                               └──────────────┘        │
└▌──────────────────────────┘        └▌───────────────────────────────────────────────────────┘
```
`preload="none"`, nunca toca sozinho com som, legenda se houver fala.

### 8. Como entrar: faixa da Guilda + superfície clara

```
390                                   1440
┌▌──────────────────────────┐        ┌▌───────────────────────────────────────────────────────┐
│▌ {Guilda, 40svh, sem texto}│        │▌ {Guilda, faixa de 40svh, sem texto}                   │
├▌──────────────────────────┤        ├▌───────────────────────────────────────────────────────┤
│▌ #F1F7F5                   │        │▌ #F1F7F5      COMO ENTRAR   Três passos, sem pressa.   │
│▌ COMO ENTRAR               │        │▌  <medalhão 192>   <medalhão 192>   <medalhão 192>     │
│▌ Três passos, sem pressa.  │        │▌  1 Deixe seu      2 Receba o       3 Instale e        │
│▌ <med 96> 1 Deixe seu e-mail│       │▌    e-mail           convite          jogue            │
│▌          Use o e-mail...  │        │▌    1 linha          7 dias           14 dias           │
│▌ <med 96> 2 Receba o convite│       │▌ ┌ faixa #E9F2EF: A 1ª leva tem 50 vagas... ─────────┐ │
│▌ <med 96> 3 Instale e jogue│        │▌ └───────────────────────────────────────────────────┘ │
│▌ ┌#E9F2EF regra das 50─┐   │        └▌───────────────────────────────────────────────────────┘
└▌──────────────────────────┘
```

### 9. Perguntas: painel calmo

```
390                                   1440 (coluna de 60ch à esquerda do centro)
┌▌──────────────────────────┐        ┌▌───────────────────────────────────────────────────────┐
│▌ PERGUNTAS                 │        │▌        PERGUNTAS                                       │
│▌ <seta> Só tem no Android? │        │▌        <seta> Só tem no Android?                       │
│▌ ─────────────────────     │        │▌        <seta> Quanto tempo tenho para aceitar?         │
│▌ <seta> Quanto tempo ...   │        │▌        <seta> Por que ficar 14 dias?                   │
│▌ ...                       │        │▌        <seta> Quem pode entrar? (18+)                  │
│▌ Privacidade →             │        │▌        Privacidade →                                   │
└▌──────────────────────────┘        └▌───────────────────────────────────────────────────────┘
```

### 10. Entre no beta: Exploração (fecho)

```
390                                   1440
┌▌──────────────────────────┐        ┌▌───────────────────────────────────────────────────────┐
│▌ {exploração: cachoeiras}  │        │▌ {exploração em cover, criaturas nas bordas}           │
│▌ SEU SOULMON ESTÁ          │        │▌            SEU SOULMON ESTÁ ESPERANDO.                 │
│▌ ESPERANDO.                │        │▌    <cria 2x>   ┌ véu 0,82, 480 de largura ┐  <cria 3x> │
│▌ E-mail                    │        │▌                │ E-mail                    │            │
│▌ E-mail da conta Google... │        │▌                │ [____________________]    │            │
│▌ [_______________________] │        │▌                │ 18+ · Privacidade         │            │
│▌ 18+ · Privacidade         │        │▌                │ [ Entrar no beta 3x ]     │            │
│▌ [  Entrar no beta 3x 120 ]│        │▌                └───────────────────────────┘            │
│▌ <cria 2x>       <cria 2x> │        └▌───────────────────────────────────────────────────────┘
└▌──────────────────────────┘        (rodapé abaixo; CTA fixo oculto aqui)
```

---

## 6. Regras de pixel art, mapas e criaturas

### 6.1 Pixel art
1. **Escala inteira, sempre.** Sprites têm grade de 64 × 64: aparecem a 64, 128, 192 ou 256px. Peças 9-slice usam a grade registrada em `assets.json` (botão 120 × 40 → alturas de 40, 80 ou 120).
2. `image-rendering: pixelated` em sprite e moldura; nunca em texto, mapa ou logo.
3. Movimento em pixel inteiro com `steps()`; rotação só de 90 em 90; espelhar pode.
4. Não recolorir por CSS. Só `brightness` (hover, inativo, silhueta) e `grayscale(.6)` (desabilitado).
5. Nenhum texto dentro da arte.
6. **Teste do recorte:** um recorte de 200 × 200 sem logo, de qualquer seção, tem que ser reconhecível como Soulmon (critério do manual 04 §1).

### 6.2 Mapas
- Só os instalados no app (`soulmon/areas/`, `soulmon/mapa/`): Exploração, Laboratório, Jogos, Hall, Arena, Guilda. **Fora:** Mercado, Forja, mapa-múndi, tudo da DEMO.
- Mapa é fundo de seção, nunca miniatura. No celular, inteiro; no desktop, cena cheia com foco medido (DESIGN-SYSTEM §4.3, dúvida do dono).
- Nunca ampliar acima do tamanho do arquivo. Exportar 480, 960 e 1440 de largura em AVIF e WebP.
- O Hall tem céu claro: texto sobre ele só com véu 0,82.

### 6.3 Criaturas
- Só de `soulmon/novos/`. **Fora:** os 5 iniciais da DEMO (Crato, Brooka, Zefi, Oaken, Bolid), o lagarto com chama na cauda, qualquer arte de franquia.
- Linha **planta** é a protagonista do hero e do ciclo (a confirmar pelo dono, PLANO §18).
- Elenco de 5 a 7 no hero e 2 a 4 nas cenas: uma grande, as outras menores e mais ao fundo (o tamanho diz profundidade).
- Criatura **pisa** no cenário: pés num ponto medido do mapa (`--x`, `--y` em % do mapa), com a elipse dura de sombra. Nunca flutuando sobre o vazio, nunca cortada pela borda da tela no celular.
- Elenco é decorativo (`alt=""`); a ficha da seção 4 é que nomeia.

---

## 7. Acessibilidade (WCAG 2.2 AA aplicado)

| Critério | Como o site atende | Como medir |
|---|---|---|
| 1.1.1 Conteúdo não textual | Prints com `alt` descritivo; elenco e ornamento `alt=""`; sprite da ficha com nome | axe + leitura manual |
| 1.2.2 Legendas | Cinemática com `<track kind="captions">` se tiver fala; loops sem áudio | Abrir com som |
| 1.3.1 Info e relações | Um `<h1>`; H2 por seção; listas `<ol>` nos passos; tabs ARIA | axe; árvore de acessibilidade |
| 1.4.3 Contraste (texto) | Todos os pares ≥ 4,5:1 (DESIGN-SYSTEM §2.3); sobre arte, véus 0,72/0,82 | Amostrar pixel atrás do texto em 390 e 1440 |
| 1.4.4 / 1.4.10 Zoom e reflow | Funciona a 200% e a 320px sem rolagem lateral | Chrome a 320px e zoom 200% |
| 1.4.11 Contraste não textual | Anel de foco 13,8:1 (escuro) e 5,6:1 (claro); bordas de campo 5,0:1 | Tabela §2.3 |
| 1.4.12 Espaçamento de texto | Nada com altura fixa em volta de texto (exceto botão, que cresce na largura) | Bookmarklet de text spacing |
| 2.1.1 Teclado | Tudo operável: abas (setas, Home, End), fichas (setas), FAQ, pop-up (Esc), vídeo | Percorrer a página só com Tab |
| 2.2.2 Pausar | Loop de vídeo com pausa visível; flutuação de 4px para em movimento reduzido | Manual |
| 2.3.3 Animação por interação | `prefers-reduced-motion` desliga parallax, pin, flutuação, crossfade | DevTools › Rendering › reduce |
| 2.4.1 Pular blocos | "Pular para o conteúdo" primeiro na ordem | Tab na carga |
| 2.4.7 / 2.4.11 Foco visível e não encoberto | Anel 3px; `scroll-padding` 72 em cima e 112 embaixo para barra e CTA fixos | Tab até o campo de e-mail e o FAQ |
| 2.5.7 Movimento de arrastar | Toda faixa deslizável tem setas | Manual |
| 2.5.8 Tamanho do alvo | Mínimo 44 × 44 (acima dos 24 do AA); compacto com alvo de 48 | Medir no DevTools |
| 3.1.1 / 3.1.2 Idioma | `lang` na página; link de idioma com `lang` e `hreflang` | Validador |
| 3.3.1 / 3.3.3 Erro e sugestão | Erro em texto, ligado por `aria-describedby`, dizendo o que fazer | Enviar vazio, inválido, sem rede |
| 4.1.2 Nome, função, valor | Botões reais, `aria-busy`, `aria-checked`, `aria-selected` | axe |

Meta: Lighthouse acessibilidade ≥ 95, zero violação séria no axe, página inteira percorrível sem mouse, legível sem JS.

---

## 8. Checklist de revisão antes de publicar

**Mensagem e texto**
- [ ] A 1ª dobra do celular (390 × 664) mostra logo, H1, "50 vagas", criatura e CTA, sem nada cobrindo.
- [ ] Todo H2 tem até 6 palavras e cabe em 2 linhas a 390; cada seção tem no máximo 1 frase (fora FAQ e privacidade).
- [ ] Nenhuma palavra vetada (§4.1); nenhum número que não seja real; nenhum "grátis".
- [ ] PT e EN completos, incluindo `alt`, `aria-label`, erros e pop-up. A versão de lista de espera (`LEVA_ESTADO=espera`) testada nos dois idiomas.

**Prova e rótulos**
- [ ] Toda captura real tem "GAMEPLAY REAL"; a demo tem "DEMONSTRAÇÃO" e "No jogo, evoluir leva dias."; a abertura tem "CINEMÁTICA". Nada da cinemática rotulado como gameplay.
- [ ] Há pelo menos um loop real ou sequência de capturas em `midia.json` (sem isso a Fatia 1 não publica).

**Identidade e arte**
- [ ] Turquesa escuro, cobre, cristal com chama, circuito e folhas presentes; nenhuma engrenagem, rebite, válvula ou correia.
- [ ] Toda imagem de pixel art em escala inteira (inspecionar largura CSS ÷ grade = inteiro).
- [ ] Nenhuma criatura da DEMO, nenhum lagarto com chama na cauda, nenhum mapa fora da lista.
- [ ] Nenhuma peça desenhada em CSS imitando asset; peças `provisorio` do `assets.json` conferidas.
- [ ] Teste do recorte 200 × 200 aprovado em 3 seções.

**Interação**
- [ ] CTA fixo aparece depois do hero, some no formulário, no pop-up e com o teclado aberto, e nunca cobre o foco.
- [ ] Pop-up termina em "Compartilhar"; Web Share e o fallback "Link copiado" testados.
- [ ] Todos os estados de erro do campo provocados: vazio, inválido, já inscrito, sem rede, 429, Turnstile, 5xx.

**Acessibilidade e desempenho**
- [ ] Tabela §7 percorrida; Lighthouse acessibilidade ≥ 95.
- [ ] Contraste do texto sobre mapa medido por amostragem de pixel em 390 e 1440 (não a olho).
- [ ] Movimento reduzido ligado: nada desliza, nada pisca, demo empilhada.
- [ ] Sem JS: página inteira legível, formulário envia.
- [ ] LCP mobile < 2,5s, JS inicial < 90 KB, CLS < 0,1 (medido em Moto G Power ou equivalente, 4G lento).
- [ ] Prints por seção a 390 e 1440 entregues ao dono.

---

## 9. Changelog

- **v1, 05/11/2026:** primeira versão, sobre o PLANO-DESIGN v3 e os dois benchmarks visuais.
