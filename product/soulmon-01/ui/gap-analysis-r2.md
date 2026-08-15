# Gap Analysis R2 — portões da §6 rodados no olho

> `design-critic`, segunda passada. Feita **vendo** `REF-home.png` contra
> `E:\pw\shots\r2-depois-*`.
>
> ⚠️ **Correção do orquestrador (verificada por medição):** o item **B6** está
> DESATUALIZADO. `nest-base.png` mede **77,2% de transparência** nos dois
> worktrees, e os 7 sprites de criatura com ruído pontilhado foram limpos por
> componente conexo. Os screenshots que o crítico olhou são **anteriores** à
> limpeza. A "nuvem quadriculada" citada no T1 da Home precisa ser
> **refotografada** antes de virar tarefa.

## 0. Veredito

**Passaria em design review? Ainda não — mas por três telas, não pelo sistema.**
O kit venceu: Loja, Biblioteca, Atividades e Torneio (escuro) estão **muito
alinhados** e devem parar de receber investimento. Reprova hoje (1) a **moldura
da Home** — tudo que está *fora* do painel de rituais, (2) **Configurações**,
intocada e Material puro, (3) **duas telas com o controle primário cortado**.

## 1. T1 — teste dos 5 segundos invertido

### Home — **FALHA**
Respostas, na ordem em que saltam: coluna de ícones soltos à esquerda
(ITENS/BANHO/DORMIR) que a referência não tem · barra vertical vazia colada à
direita · corações soltos no ar, sem moldura · nuvem em volta do bicho
(**ver correção acima**) · botão grande do fim do painel cortado pela barra de
digitação · nav de baixo sem os nomes sob os ícones.

Nenhuma é conteúdo → reprova cedo. **E nenhuma delas é o painel de rituais** —
o G1 acertou. O que reprova é a **moldura em volta dele**, que as duas rodadas
não tocaram porque o G1 mirou dentro do painel.

### Loja — **PASSA**
Citações: itens e preços diferentes (conteúdo) · moeda é BITS e não SOUL CRYSTAL
(conteúdo) · diamante colorido nos pacotes de câmbio (asset já nomeado) · só
cabem 3 abas (estrutura, B3). Card, moldura, botão de preço, chip de moeda e
tipografia **não foram citados** — que é o que o portão mede.
**A Loja está muito alinhada. Parar.**

### Atividades — passa raspando
Jogos diferentes (conteúdo) · setinha `>` em line-art destoando (P1) · nome
quebra em duas linhas por causa da etiqueta (P2).

### Veredito por tela
| tela | T1 |
|---|---|
| Loja (5 abas) | **passa — parar** |
| Biblioteca | **passa — parar** |
| Torneio escuro · Detalhe de jogador · Masmorra · Dino | passa |
| Atividades | passa raspando (P1, P2) |
| Torneio claro | **falha** (B4 + ilha de tema) |
| PPT | **falha** (B2) |
| **Home** | **falha** (B1, B5, B7) |
| **Configurações** | **falha catastrófica** (B8) |

## 2. T6 — cobertura da lista fechada

Cobertos nos 2 temas: Home, Atividades, Evolução, Estatísticas, Loja, Torneio,
Masmorra, Dino, Glossário/Guia, Biblioteca, detalhe de jogador.

**4 buracos:**
1. **Modais de tarefa** — convertidos, testados em unidade, **zero screenshot**.
2. **Onboarding / ritual do oráculo** — nunca fotografado; `r3-*-40-tutorial` é o
   tutorial de jogo, não o onboarding.
3. **Relatório diário / modal de desbloqueio** — nunca fotografados.
4. **Evolução** — os shots são anteriores ao G4/G5/G8; nav, chips e tokens
   mudaram desde então.

**O mais provável de esconder surpresa não são os modais — é o onboarding:
única tela que 100% dos usuários veem e que nunca passou por rodada nenhuma.**

## 3. Gap restante, priorizado

### Bloqueadores
**B1 — a Home tem uma HUD flutuante que a referência não tem · (A) · o maior.**
Fora do painel: 3 ações soltas à esquerda (ícone + rótulo, sem moldura, sem alvo
visível), 3 corações no ar, barra vertical vazia à direita, partículas. Seis
grupos em superfície nenhuma. A REF resolve o mesmo espaço com **uma coisa só** e
ancora todo controle em moldura. Causa 4 das 6 respostas do T1. Padrão do gênero
(Tamagotchi, Neko Atsume, Habitica): o cuidado do pet mora numa **fileira
emoldurada de ações** rente ao palco. Fix: painel horizontal de ações sob o
palco, HP em chip emoldurado ao lado de ENERGIA/CRÉDITOS, matar ou
emoldurar+rotular a barra vertical. Zero arte nova.

**B2 — PPT: os três botões de jogar estão cortados pela nav · (A).** Arena de
altura fixa (~1350px de vazio com um pet de 60px no meio) empurra os **únicos
controles do jogo** para debaixo da barra de navegação. Minijogo com controle
primário inalcançável = dead-end. Auditar o mesmo em Masmorra e Dino.

**B3 — Loja: 2 de 5 abas invisíveis, sem affordance · (A).** Torneio e Missões
existem sem pista. O padrão (Material/HIG) corta a última aba **no meio** ou usa
fade de borda — nunca rente à margem.

**B4 — Torneio claro: decoração desenhada por cima do texto · (A) · legibilidade.**
Anel dourado atravessa "TORNEIO" e a frase de PvP.

**B5 — o CTA do painel de rituais é comido pelo dock de chat · (A).** O G1 matou
o FAB *porque* o CTA largo é o padrão da REF — e o CTA está ocluído.

**B6 — ⚠️ DESATUALIZADO, ver correção no topo.** Refotografar antes de tratar.

**B7 — nav inferior: 6 destinos, nenhum rótulo · (A) · a11y.** A REF tem 3
destinos **com nome**. Material e HIG convergem: 3–5 destinos com rótulo
persistente. Rótulo Silkscreen 8–9px cabe em 6 × 68px.

**B8 — Configurações é uma segunda identidade visual inteira · (A).** Cards
brancos com sombra, campos-cápsula, botões cinza com sombra Material, toggle
teal com bolinha branca, ícone em line-art, emoji nos cabeçalhos, chevron.
**Os cinco inventários do T2 falham nesta tela sozinha.** `PixelSwitch`,
`.sm-px-card`, `PixelButton` e os ícones do kit **já existem**.

### Polimento
**P1** chevron `>` em line-art nos cards de Atividades · **P2** etiqueta divide a
linha do título · **P3** emoji não declarados (🔍 na busca, ❤️🤝 na aba AMIGOS) —
se confirmados no DOM, o "20" da rodada 2 está subcontado · **P4** Loja, Torneio,
Biblioteca e Atividades terminam com 600–1000px de vazio, o oposto da densidade
que o G1 perseguiu · **P5** G6 (barras fora da Home) e G10 (fundo de circuito)
intocados — o G10 custa quase nada e é o que dá profundidade à REF · **P6**
dívidas herdadas: `PixelSegmentedBar` some abaixo de 9px, `GROUND_Y` defasado,
`item.displayIcon` (lucide) vivo no modelo.

**Categorias:** (A) 12 de 14 · (B) P3 e parte de P5 · (C) nenhum urgente após a
correção do B6. **A arte não é o gargalo — nunca foi.**

## 4. Onde PARAR (dito com todas as letras)

- **Loja: muito alinhada.** Só B3 e o 💎. Não investir mais.
- **Biblioteca: muito alinhada.** Só P3. Encerrar.
- **Detalhe de jogador, Masmorra, Dino: alinhados** (auditar só o corte do B2).
- **Torneio escuro: alinhado** — o que sobra é exclusivo do tema claro.
- **O painel de rituais da Home: encerrado.** É a melhor peça do app hoje, mais
  fiel à REF que a moldura em volta.
- **G11 (moldura de cano) e G12 (botões em quarentena) seguem corretamente parados.**

## 5. Autocrítica dos próprios critérios

- **T1 é soberano mas binário demais.** Reprovou Atividades por um chevron de
  12px com o mesmo peso da HUD flutuante inteira da Home. **Correção: contar a
  resposta nº 1** — se a primeira citação é conteúdo, passa; estrutura a partir
  da terceira vira polimento. Do jeito que foi escrito, o portão **nunca fecha**
  — e a própria §6 dizia que essa diferença **deve** sobrar. O critério
  contradizia o próprio parágrafo de parada.
- **T2 mediu inventário e perdeu composição.** Emoji 0, pílulas 0, sombras 0 — e
  a Home reprova assim mesmo, porque nenhuma métrica vê "elemento sem
  superfície". A métrica que faltou: **controle interativo sem moldura = 0**.
  Teria pego o B1 na rodada 1.
- **T4 foi cumprido e virou irrelevante.** Passou a 5,00 enquanto quatro telas
  terminam em 1000px de vazio sem o portão reclamar — ele só mede a Home.
  Densidade sem contrapartida de vazio premia empilhar.
- **T6 estava certo e foi o portão mais útil.** Impediu o loop de polir a Home
  para sempre. Manter sem mudança.
- **Erro admitido:** priorizar o G3 como "esconder o berço". O dono inverteu e
  estava certo — espaço nomeado com arte por fora é melhor arquitetura. Tratei
  um problema de asset como problema de layout.

## 6. Ordem sugerida

**B1 → B8 → B5 → B2 → B4 → B3 → B7 → refotografar os 4 buracos do T6 → P1/P2/P5.**

A correção de maior alavancagem é **emoldurar a Home fora do painel (B1)**: as
peças soltas são 4 das 6 respostas do T1, e o custo é CSS com tokens que já
existem. Empatada: **varredura de Configurações (B8)**, a única tela que ainda
tem um design system inteiro dentro dela.
