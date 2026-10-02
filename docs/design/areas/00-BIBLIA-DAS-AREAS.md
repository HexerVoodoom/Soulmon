# Bíblia das Áreas do Mapa — tema, lotes e NPCs

> Etiqueta: **plano** (decisão de direção de arte, 29/09/2026). Não decide regra
> de jogo. Precedência: código > teste > `CLAUDE.md` > manual > bíblia de
> narrativa > este arquivo. Quem executa a arte: `/squad-arte` (famílias
> `cenario`, `criatura`/NPC). Quem escreve a fala final: `/squad-narrativa`
> (`soulmon-copy-redator`), usando as falas-modelo daqui como ponto de partida.

## 0. Decisões (resumo)

1. **Cada área ganha UMA cor de acento, UM material dominante, UMA luz e UMA forma.** O kit comum (verde-petróleo de fundo, cobre nas bordas, fagulha turquesa) continua em TODAS — é a identidade. O acento é o que muda.
2. **Jogos (feérico/cogumelos) é o benchmark e fica** — com repintura de paleta (as flores rosa e as plantas roxas saem).
3. **Mercado, Arena e Exploração falham hoje no teste de reconhecimento**: os três fundos são o mesmo kit (petróleo escuro + cristal azul + tocha turquesa). Os três são refeitos. Arena é o pior caso (o próprio `index.ts` diz que o fundo é provisório).
4. **Laboratório e Hall não têm fundo de área** (só a zona do mapa). Ganham fundo novo.
5. **`arena:guilda` vira `arena:feira`** (PLANO-GUILDA §6). **`hall:guilda` já é o Salão.** Total de lotes continua 16.
6. **Um NPC por lote, sem reuso.** Marla fica só no Salão; a Feira ganha NPC próprio.
7. **Sai do bundle**: o placeholder `npc-placeholder-poring` (o nome do arquivo e do símbolo `poring` é termo de franquia de terceiro; além disso a arte é roxa e verde-néon, fora da paleta). Sai também o nome **Tico** (é o nome PT-BR de personagem registrado de terceiro — o par "Tico e Teco"): vira **Bento**.
8. **O que NÃO entra**: lote novo para Jogos (não existe mecânica para ele; lote sem folha é cenário que finge ser porta), mudar o Dino de área (é decisão de navegação, não de arte — fica anotado em §7), e qualquer cor magenta/roxo/rosa, inclusive como "exceção fofa".

---

## 1. Inventário medido

### 1.1 Arquivos (medido por `Glob`, 29/09/2026)

| Pasta | Arquivos PNG | Conteúdo |
|---|---|---|
| `src/assets/soulmon/mapa/` | **7** | `bg-mapa` + 6 `zona-<area>` |
| `src/assets/soulmon/areas/` | **13** | 4 fundos (`bg-mercado`, `bg-arena`, `bg-exploracao`, `bg-jogos`) + 9 lotes |
| `src/assets/soulmon/npcs/` | **11** | 6 anfitriões `npc-<area>` + 3 `npc-loja-*` + 2 placeholders (`coruja-cervo`, `poring`) |

Régua para refazer a conta: `ls src/assets/soulmon/{mapa,areas,npcs}/*.png | wc -l` (hoje 31).
Fundos de área faltando: **laboratorio, hall** (2 de 6).

### 1.2 Lotes por área

Fonte: `src/utils/areaSheetCopy.ts` (Mercado, Arena, Laboratório, Hall), `src/utils/playAreaLots.ts` (Exploração, Jogos), arte em `src/assets/soulmon/areas/index.ts`, NPC em `src/assets/soulmon/npcs/index.ts` › `LOT_NPC_ART` e voz em `src/utils/areaNpcVoice.ts` › `LOT_NPC_VOICE`.

| Área | Lote (id) | Nome PT / EN | Abre | Arte do lote | NPC hoje (arte / voz) |
|---|---|---|---|---|---|
| mercado | `itens` | Itens / Items | loja, segmento Itens | própria `lote-loja-itens` | `npc-loja-itens` / **Lamela** (voz própria desde 01/10/2026) |
| mercado | `decoracao` | Decoração / Decor | loja, Mobílias | própria | `npc-loja-decoracao` / **Lasca** (voz própria desde 01/10/2026) |
| mercado | `background` | Background / Background | loja, Cenários | própria | `npc-loja-background` / Grom |
| mercado | `conquistas` | Conquistas / Achievements | Missões | própria | **placeholder poring** / Grom |
| arena | `torneio` | Torneio / Tournament | Torneio | própria | `npc-arena` (Vultrak) |
| arena | `duelo` | Duelo / Duel | `ArenaGame` (`DueloSheet`) | própria | **placeholder poring** / Tuska |
| arena | `guilda` → **`feira`** | Guilda → **Feira / Fair** | `GuildSheet` (sala Feira) | **placeholder** (= conquistas) | **placeholder coruja-cervo** / Marla |
| exploracao | `masmorra` | Masmorra / Dungeon | `DungeonGame` | própria | `npc-exploracao` (Zeph) |
| exploracao | `dino` | Corrida do Dino / Dino Runner | Dino | própria | **placeholder poring** / Zeph |
| jogos | `ppt` | Pedra, papel e tesoura / Rock, paper, scissors | PPT | própria | `npc-jogos` (Pipo) |
| laboratorio | `evolucao` | Árvore da Evolução / Evolution Tree | Evolução | **placeholder** (= background) | `npc-laboratorio` (Vesca) |
| laboratorio | `pet` | Meu Soulmon / My Soulmon | página do Pet | **placeholder** (= itens) | **coruja-cervo** / Tico |
| laboratorio | `stats` | Observatório / Observatory | Estatísticas | **placeholder** (= conquistas) | **poring** / Quill |
| hall | `biblioteca` | Biblioteca / Library | Biblioteca | **placeholder** (= ppt) | `npc-hall` (Lumi) |
| hall | `amigos` | Círculo de Amigos / Friends Circle | amigos | **placeholder** (= decoração) | **coruja-cervo** / Nino |
| hall | `guilda` | Salão da Guilda / Guild Hall | `GuildSheet` (Bosque) | **placeholder** (= conquistas) | **coruja-cervo** / Marla |

**Totais**: 16 lotes (4 · 3 · 2 · 1 · 3 · 3). Arte de lote própria: **9/16**. Lotes sem arte: **7** (Feira + os 3 do Laboratório + os 3 do Hall). NPC com arte própria: **8/16** (e a dos 3 vendedores do Mercado é rascunho em média qualidade — `BACKLOG-CREDITOS.md` #5–#7). `lote-loja-conquistas` hoje representa **4 construções diferentes** — é o pior caso de "todas iguais".

**Lotes que o PLANO-GUILDA exige**: `hall:guilda` (Salão — já existe como id, falta arte) e `arena:feira` (id novo em `ArenaLotId`, substitui `arena:guilda`; testes `areaLotsNovos.test.ts`). Nenhum outro.

**Residentes da Biblioteca** (`src/utils/libraryNpcs.ts`): Kaelen, Orrin, Thalindra — são perfis visitáveis, **não anfitriões de lote**. Ficam onde estão, dentro da folha da Biblioteca.

### 1.3 Achados de conformidade (entram na fila da squad-arte)

| # | Onde | Problema | Decisão |
|---|---|---|---|
| A1 | `areas/bg-jogos.png` | flores rosa, plantas roxas, pontos magenta | repintar mantendo composição; flores viram creme/âmbar, folhagem roxa vira petróleo |
| A2 | `mapa/zona-laboratorio.png`, `npcs/npc-placeholder-poring.png` | frascos e líquido roxo; slime roxo/verde-néon | refazer; líquido vira turquesa/âmbar |
| A3 | `npcs/npc-placeholder-poring.png` + símbolo `PLACEHOLDER_NPC_ART.poring` | nome de criatura de franquia de terceiro no bundle (a arte não é cópia, o NOME é) | sai; ninguém aponta mais para ele quando os NPCs de §4 chegarem. Até lá, renomear arquivo e símbolo para `npc-placeholder-slime` |
| A4 | `LOT_NPC_VOICE['laboratorio:pet']` | "Tico" | vira **Bento** |
| A5 | `bg-mercado`, `bg-arena`, `bg-exploracao` | mesmo kit, indistinguíveis em cinza | refazer sob §2 |
| A6 | `hall:guilda` e `arena:guilda` com a MESMA fala e o MESMO NPC | "grupo pequeno" fica falso com 12 membros (PLANO-GUILDA §6) | Marla só no Salão, fala nova; Feira ganha Fanfare |

---

## 2. Tema por área

**Âncora comum, obrigatória nas seis**: fundo verde-petróleo, ferragem e moldura em cobre profundo, fagulha turquesa como a única "energia viva", videira sobre estrutura. **Proibido nas seis**: magenta, roxo, rosa; vermelho/laranja como energia (fogo humano só como chama de lampião, pequena e contida). O acento de cada área é **material e luz**, nunca uma segunda energia.

### 2.1 Jogos — o Anel dos Cogumelos (benchmark)
- **Conceito**: clareira de floresta onde a Malha brota em cogumelos gigantes; é onde as criaturas brincam sem placar. Um círculo de fadas feito de terra batida, degraus de pedra e chapéus de cogumelo como telhado.
- **Paleta**: âncora + acento **verde-musgo luminoso** (`#9BD46A`) + chapéus em **ferrugem apagada** (vermelho dessaturado para `#A8553F`, pintas creme `#EFE3C2`). Material: musgo, madeira viva, chapéu esponjoso. Luz: **bioluminescência de baixo para cima**, pontos pequenos no chão.
- **Forma**: **arredondada**. Nada de quina.
- **Skyline**: domos de chapéu de cogumelo em alturas variadas.
- **Ambiente (nota)**: grilos, gotas, sininho de madeira oco.
- **Nunca confunde porque**: é a única área com massa redonda de copa no horizonte e com pintas claras repetidas — lê como "bolinhas" até em 64 px cinza.

### 2.2 Mercado — a Galeria de Caixotes
- **Conceito**: uma mina antiga que a Malha virou bazar; trilhos, guindastes e caixotes empilhados em andares. Tudo foi trazido de algum lugar e está à venda em prateleiras.
- **Paleta**: âncora + acento **latão/âmbar** (`#D9A441`). Material: **madeira de caixote + lona de toldo + latão**. Luz: **lampiões quentes, pontuais**, poças de luz âmbar sobre fundo escuro.
- **Forma**: **retangular empilhada** (caixas, prateleiras, andaimes). Sem cristal no chão — o cristal sai desta área.
- **Skyline**: guindaste de carga + chaminés finas com fio de vapor + toldos listrados (listras petróleo/creme).
- **Ambiente**: roldana, moedas, conversa abafada.
- **Nunca confunde porque**: é a única com toldo listrado e guindaste — linhas horizontais e diagonais retas contra o céu.

### 2.3 Arena — o Anfiteatro dos Picos
- **Conceito**: um anfiteatro escavado no topo de um pico de arenito, aberto ao céu. As criaturas vêm se medir contra si mesmas; o público é o vento e os estandartes.
- **Paleta**: âncora + acento **arenito/osso** (`#C8A878`). Material: **pedra talhada em blocos, pano de estandarte**. Luz: **sol alto e duro**, sombras curtas e escuras — a área mais contrastada do jogo.
- **Forma**: **angular** — triângulos, degraus, pontas de mastro.
- **Skyline**: arquibancada em degraus em meia-lua + mastros com flâmula triangular.
- **Ambiente**: vento, pano batendo, gongo distante.
- **Nunca confunde porque**: é a área mais CLARA e a única com céu aberto; o dente de serra dos degraus e das flâmulas é inconfundível em silhueta.

### 2.4 Exploração — o Charco das Ilhas
- **Conceito**: pântano de névoa onde pedaços de chão flutuam e raízes pendem no vazio; é o limite do que já foi lido na Malha. As trilhas são pedras de passar.
- **Paleta**: âncora + acento **fogo-fátuo verde-pálido** (`#A8F0D0`). Material: **pedra molhada, raiz, turfa**. Luz: **difusa, contraluz de névoa** — tudo em recorte, nada iluminado de frente.
- **Forma**: **orgânica fragmentada** (bordas quebradas, blocos soltos).
- **Skyline**: ilhas flutuantes com raízes pendentes + um salgueiro caído.
- **Ambiente**: água parada, eco, respiração do vento.
- **Nunca confunde porque**: é a área mais ESCURA e a única em que o chão não toca a borda da tela — os blocos flutuam. (Remover as caveiras dos fogos-fátuos do fundo atual: lê como morte, e morte não existe no universo — bíblia §5.12.)

### 2.5 Laboratório — a Estufa de Vidro
- **Conceito**: uma estufa facetada crescida em volta de uma árvore antiga; a Malha é observada crescendo, através de vidro e lente. Aqui se acompanha a forma da criatura, não se experimenta com ela.
- **Paleta**: âncora + acento **azul-gelo de vidro** (`#BFEFFF`). Material: **vidro facetado + caixilho de cobre + folha de samambaia**. Luz: **fria, difusa, filtrada pelo vidro**, reflexos em faixa.
- **Forma**: **geométrica** — hexágonos, cúpulas facetadas, lentes circulares.
- **Skyline**: cúpulas de estufa em favo + um telescópio/lente apontado para cima.
- **Ambiente**: gotejar de condensação, zumbido baixo.
- **Nunca confunde porque**: é a única com transparência e grade hexagonal; em cinza, os reflexos em faixa diagonal a denunciam. (O roxo das poções sai: líquidos viram turquesa e âmbar.)

### 2.6 Hall — o Claustro da Manhã
- **Conceito**: um claustro de arcos em volta de um pátio de grama, onde as criaturas se encontram e as guildas mantêm seus bosques. É a única área em luz de dia; é o lugar de estar com outros.
- **Paleta**: âncora + acento **creme-pergaminho** (`#EFE3C2`) com turquesa nas águas. Material: **pedra clara lisa, grama, madeira encerada, papel**. Luz: **manhã, alta e suave**, sem sombra dura.
- **Forma**: **arcos e simetria**.
- **Skyline**: arcada contínua + uma torre de sino/relógio d'água central.
- **Ambiente**: fonte, passos em pedra, páginas.
- **Nunca confunde porque**: é clara como a Arena, mas **curva e simétrica** onde a Arena é angular e dura; e é a única com grama verde no chão central.

### 2.7 Tabela de comparação (prova em escala de cinza)

| Área | Valor médio (cinza) | Contraste | Forma | Luz | Skyline | Acento |
|---|---|---|---|---|---|---|
| Jogos | médio | médio, com pintas claras | arredondada | de baixo, pontilhada | domos de cogumelo | verde-musgo |
| Mercado | baixo-médio | poças de luz | retangular empilhada | lampião pontual | guindaste + toldos | latão/âmbar |
| Arena | **alto** | **muito alto** | **angular** | sol zenital duro | degraus + flâmulas | arenito/osso |
| Exploração | **muito baixo** | baixo | orgânica quebrada | contraluz de névoa | ilhas flutuantes | fogo-fátuo |
| Laboratório | médio-alto | faixas de reflexo | geométrica/hexagonal | fria filtrada | cúpulas em favo + lente | azul-gelo |
| Hall | alto | **baixo** | arcos simétricos | manhã suave | arcada + torre | creme-pergaminho |

Pares de risco e o que os separa: Arena × Hall (ambos claros) → contraste e forma (angular duro × arco suave). Mercado × Exploração (ambos escuros) → Mercado tem ilhas de luz quente e linhas retas; Exploração é névoa uniforme e bordas quebradas. **Aceite**: a conferente reduz os 6 fundos a 64 px de largura em cinza e um terceiro identifica cada um sem legenda.

---

## 3. Cada lote único

Regra: dentro de uma área, **nenhum par de lotes compartilha forma-base**. O tamanho relativo é em relação à base 300² do recorte (1 = cabe inteiro, sem folga).

### Mercado (4)

| Lote | Silhueta | Material | Detalhe-assinatura | Tam. | Teste da silhueta preta |
|---|---|---|---|---|---|
| Itens | **carroça de feira** com duas rodas e toldo curvo | madeira + lona | frascos pendurados em fileira sob o toldo | 0,8 | é a única com RODAS |
| Decoração | **casa-caixote em andares tortos**, poltrona na varanda | caixotes + tábua | abajur saindo pela janela | 0,9 | a única com varanda e telhado inclinado torto |
| Background | **tenda alta de molduras** — armação vertical com telas penduradas | lona esticada + moldura de cobre | uma tela grande mostrando um horizonte | 0,9 | a única com retângulos pendurados verticais (quadros) |
| Conquistas | **guindaste-mostruário**: torre de treliça com um baú içado | treliça de latão + baú | medalha pendurada na corrente | 1,0 | a única com braço diagonal + objeto suspenso |

### Arena (3)

| Lote | Silhueta | Material | Detalhe-assinatura | Tam. | Teste |
|---|---|---|---|---|---|
| Torneio | **coliseu em meia-lua** com arquibancada em degraus | arenito em blocos | 5 flâmulas triangulares (uma por faixa, Semente→Lendário) | 1,0 | a meia-lua dentada é única |
| Duelo | **ringue baixo quadrado** com quatro postes e cordas | pedra + corda | dois círculos de giz no chão, frente a frente | 0,7 | baixo e largo, quatro pontas iguais |
| Feira | **tenda-cúpula de circo** com mastro central e bandeirolas radiais | lona listrada petróleo/osso | lanternas penduradas nas bandeirolas | 0,9 | a única CÚPULA com cordas partindo do topo |

### Exploração (2)

| Lote | Silhueta | Material | Detalhe-assinatura | Tam. | Teste |
|---|---|---|---|---|---|
| Masmorra | **boca de caverna** num rochedo flutuante, raízes caindo da borda | pedra molhada | escada descendo para o escuro | 1,0 | a única massa pesada com abertura negra |
| Corrida do Dino | **pista-ponte** em arco longo de tábuas entre duas ilhas | tábua + corda | bandeira de largada na ponta | 0,8, horizontal | a única forma LONGA e horizontal |

### Jogos (1)

| Lote | Silhueta | Material | Detalhe-assinatura | Tam. | Teste |
|---|---|---|---|---|---|
| Pedra, papel e tesoura | **toco-mesa** sob um cogumelo-guarda-chuva gigante | madeira viva + chapéu | três marcas entalhadas no toco (pedra, folha, graveto — nunca mão humana) | 1,0 | cogumelo sobre mesa redonda; único lote da área, o maior domo |

### Laboratório (3)

| Lote | Silhueta | Material | Detalhe-assinatura | Tam. | Teste |
|---|---|---|---|---|---|
| Árvore da Evolução | **árvore-casa** atravessando o teto de uma estufa facetada | tronco + vidro | galhos com 3 casulos de luz (os 3 galhos) | 1,0 | a única com COPA saindo por cima |
| Meu Soulmon | **viveiro-redoma**: cúpula de vidro única sobre pedestal | vidro + cobre | uma almofada e um espelho redondo dentro | 0,7 | a única redoma lisa (sino) |
| Observatório | **torre de lente**: cilindro fino com telescópio inclinado | cobre + vidro | anéis de astrolábio girando no topo | 0,9, vertical | a única torre fina com tubo diagonal |

### Hall (3)

| Lote | Silhueta | Material | Detalhe-assinatura | Tam. | Teste |
|---|---|---|---|---|---|
| Biblioteca | **torre-estante** alta e estreita com escada em caracol por fora | pedra clara + madeira | livros empilhados na janela | 1,0, vertical | a única torre com espiral externa |
| Círculo de Amigos | **gazebo aberto** redondo, oito colunas, banco em anel | madeira encerada | uma caixa de correio de cobre na entrada | 0,7 | vazado — dá para ver através |
| Salão da Guilda | **casa-longa com uma árvore no pátio** atrás de um arco | pedra + madeira + árvore | a árvore do Bosque (cresce, nunca murcha — PLANO-GUILDA) | 1,0, larga | a única com árvore DENTRO de um arco |

---

## 4. NPCs

Critérios: criatura própria do universo (nunca humano genérico), paleta da área, nenhum nome com sufixo fixo tipo "-mon", nenhuma cópia de personagem existente ("Do not copy any existing franchise character" vai em todo prompt). Nomes conferidos contra os termos que `src/narrativa.contract.test.ts` trava (`tamer`, `domador`, `treinador`, `digievolução`, `mundo digital`) e contra nomes de personagem conhecidos. Falas sob L1–L12: descrevem o lugar e o ato, nunca a pessoa; sem imperativo de cobrança; sem emoji; sem número de desempenho.

### 4.1 Distribuição

| Lote | NPC | Situação |
|---|---|---|
| (anfitrião do Mercado, cabeçalho da área) | Grom | existe (nome + arte) |
| mercado:itens | **Lamela** (⚰️ Tamba) | arte existe (`npc-loja-itens`, criatura-cogumelo); nome e voz em `LOT_NPC_VOICE` desde 01/10/2026 |
| mercado:decoracao | **Lasca** (⚰️ Musga) | arte existe (`npc-loja-decoracao`, panda-vermelha); nome e voz em `LOT_NPC_VOICE` desde 01/10/2026 |
| mercado:background | **Panora** | arte existe, **nome criado agora** |
| mercado:conquistas | **Medra** | **criado agora** (nome + arte) |
| arena:torneio | Vultrak | existe |
| arena:duelo | Tuska | nome existe, **arte falta** (espécie fixada abaixo) |
| arena:feira | **Fanfare** | **criado agora** |
| exploracao:masmorra | Zeph | existe |
| exploracao:dino | **Trote** | **criado agora** |
| jogos:ppt | Pipo | existe |
| laboratorio:evolucao | Vesca | existe (arte a repintar sem roxo) |
| laboratorio:pet | **Bento** (ex-Tico) | nome **trocado agora**, arte falta |
| laboratorio:stats | Quill | nome existe, arte falta |
| hall:biblioteca | Lumi | existe |
| hall:amigos | Nino | nome existe, arte falta |
| hall:guilda | Marla | nome existe, arte falta, fala nova |

Contagem: **16 lotes**. NPCs nomeados que já existiam: **11** (Grom, Vultrak, Zeph, Pipo, Vesca, Lumi, Tuska, Marla, Nino, Quill, Tico) — com arte própria só **6** (os anfitriões). NPCs **criados agora**: **6** (Tamba, Musga, Panora, Medra, Fanfare, Trote) + **1 renomeado** (Bento). Arte a gerar: **11 bustos** — 8 novos (Medra, Fanfare, Trote, Tuska, Bento, Quill, Nino, Marla) + 3 refeitos em alta (Tamba, Musga, Panora; fila de crédito #5–#7) — e **2 repinturas** (Vesca, zona do Laboratório).

### 4.2 Fichas dos NPCs sem ficha (os criados e os que só tinham nome)

**Lamela — Itens (Mercado)** (01/10/2026, pedido do dono: a banca mostrava "Grom")
- Espécie: criatura-cogumelo de pelo cinza-claro, chapéu turquesa com veios de luz, óculos-visor âmbar, braço mecânico de latão; carrega bolsas cheias de chips e miudezas. É o busto `npc-loja-itens` que já está no app.
- Nome: as **lamelas** são as lâminas sob o chapéu do cogumelo. PT e EN iguais (o nome não traduz; só o ofício: "a mascate" / "the peddler").
- Fala de boas-vindas: PT "Tudo o que cabe nos meus bolsos tem serventia. Fique à vontade para olhar." / EN "Everything that fits in my pockets has a use. Feel free to look." — fala do objeto, sem preço, sem pressa (L1, L12).
- Colisão: `grep -riw lamela src docs` sem outro uso (01/10/2026); nenhum termo vetado.

**Lasca — Decoração (Mercado)** (01/10/2026, idem)
- Espécie: panda-vermelha marceneira, avental verde com retalhos, martelo de madeira, vaso de muda na pata; espinhos de casca e musgo nas costas. É o busto `npc-loja-decoracao`.
- Nome: a **lasca** de madeira que sobra da plaina. PT e EN iguais (ofício: "a marceneira" / "the carpenter").
- Fala de boas-vindas: PT "Cada peça daqui foi lixada à mão. Escolha um canto para ela, se quiser." / EN "Every piece here was sanded by hand. Pick a corner for it, if you like." — convite opcional, sem cobrança.
- Colisão: `grep -riw lasca` só acha a palavra comum em comentários de código; nenhum personagem.

⚰️ As duas fichas abaixo (Tamba, Musga) descreviam criaturas que a arte instalada NÃO é (caranguejo-eremita e lesma de musgo). Ficam como registro; os nomes estão livres para outro NPC.

**Tamba — Itens (Mercado)**
- Espécie: caranguejo-eremita do tamanho de um cachorro, cuja concha é um gaveteiro de latão com seis gavetinhas; antenas com pontas turquesa.
- Papel: vende chips e itens de uso.
- Temperamento: miúdo, preciso, conta as gavetas antes de abrir. Fala pouco e sempre sobre o objeto.
- Falas: PT "Cada gaveta guarda uma coisa só. Escolha a sua." / EN "Each drawer holds one thing. Pick yours." · PT "Esse chip é pequeno, mas pesa na forma." / EN "This chip is small, but it weighs on the form." · PT "Volta quando quiser. As gavetas não saem daqui." / EN "Come back whenever. The drawers stay right here."
- Gesto: abre uma gaveta da própria concha com a garra.
- Por que combina: a concha-gaveteiro é a forma retangular empilhada do Mercado.

**Musga — Decoração (Mercado)**
- Espécie: lesma grande de musgo que carrega nas costas um quartinho inteiro (janela acesa, telhado de tábua).
- Papel: vende mobílias do palco.
- Temperamento: lenta, caseira, fala de lugares como quem fala de gente.
- Falas: PT "Todo canto fica melhor com alguma coisa sentada nele." / EN "Every corner gets better with something sitting in it." · PT "Esse tapete já morou em três cenários. Gostou de todos." / EN "This rug has lived in three scenes. It liked them all." · PT "Pode olhar sem pressa. Eu também sou devagar." / EN "Look as long as you like. I'm slow too."
- Gesto: a luz da janelinha nas costas acende quando ela fala.
- Combina: é a "casa-caixote" em forma de criatura.

**Panora — Background (Mercado)**
- Espécie: criatura-lula de terra, corpo creme, cujo manto é uma tela esticada que projeta paisagens em pixel.
- Papel: vende cenários.
- Temperamento: sonhadora, descreve lugares como se tivesse ido.
- Falas: PT "Esse horizonte tem cheiro de chuva. Quer ver de perto?" / EN "This horizon smells like rain. Want a closer look?" · PT "Cada cenário é um lugar onde a Malha já assentou." / EN "Each scene is a place where the Mesh has settled." · PT "Troquei de paisagem hoje três vezes. Todas eram boas." / EN "I changed scenery three times today. All of them were good."
- Gesto: o manto troca de paisagem num piscar.
- Combina: a tenda de molduras do lote.

**Medra — Conquistas (Mercado)**
- Espécie: jabuti velho com casco de placas de latão, cada placa uma medalha gravada; musgo na borda do casco.
- Papel: guarda as Missões e os cenários que elas liberam.
- Temperamento: calmo, memorioso, fala de marcos como de estações do ano. Nunca conta o que falta.
- Falas: PT "Cada placa do meu casco lembra um trecho atravessado." / EN "Each plate on my shell remembers a stretch crossed." · PT "Os marcos não fogem. Ficam aqui, esperando quem chega." / EN "Milestones don't run off. They stay here for whoever arrives." · PT "Esse cenário abriu. Ele é seu para levar." / EN "This scene opened up. It's yours to take."
- Gesto: bate o casco uma vez, as placas tilintam.
- Combina: latão/âmbar do Mercado; lento como o guindaste que ergue o baú.

**Tuska — Duelo (Arena)** (nome existia)
- Espécie: rinoceronte-bípede atarracado, couro cor de arenito, chifre de pedra lascada com veio turquesa, faixa de pano na testa.
- Temperamento: bonachão, ri quando apanha. Gosta do encontro, não do resultado.
- Falas: PT "Um duelo, uma rodada de cada vez. Pode vir." / EN "One duel, one round at a time. Come on." · PT "Essa doeu no chifre. Boa!" / EN "That one rang my horn. Nice!" · PT "Ganhar ou perder, a gente volta pro círculo." / EN "Win or lose, we step back into the circle."
- Gesto: bate o chifre no poste do ringue.
- Combina: angular, arenito, contato direto.

**Fanfare — Feira (Arena)** (novo; substitui Marla na Arena)
- Espécie: criatura-sanfona, corpo em fole de lona listrada petróleo/osso, braços longos que carregam lanternas; boca no centro do fole.
- Papel: anuncia o fenômeno da semana da Feira, cooperativo.
- Temperamento: festivo, fala no plural, conta o que aconteceu na roda, nunca quem faltou.
- Falas: PT "A roda já está armada. Chegou mais uma luz." / EN "The ring is set up. One more light arrived." · PT "O fenômeno desta semana está no meio da praça. Juntos ele se desfaz." / EN "This week's phenomenon sits in the middle of the square. Together it comes undone." · PT "Mais uma lanterna acesa. A roda ficou mais clara." / EN "Another lantern lit. The ring got brighter."
- Gesto: estica e fecha o fole, soltando um sopro de fagulha.
- Combina: a tenda-cúpula; é a única voz coletiva da Arena. (Nunca cita contribuição individual — PLANO-GUILDA §13.)

**Trote — Corrida do Dino (Exploração)** (novo)
- Espécie: ave-corredora de pernas longas e bico curto, penas cor de turfa com pontas fogo-fátuo, uma pena solta sempre caindo.
- Papel: corre ao lado na pista-ponte.
- Temperamento: agitado, gosta de começar, esquece o placar logo depois.
- Falas: PT "A ponte está firme. Bora ver até onde ela vai?" / EN "The bridge is steady. Want to see how far it goes?" · PT "Pulo, pulo, pedra! Essa foi longe." / EN "Hop, hop, rock! That one went far." · PT "Já estou pronto de novo. Minhas pernas não cansam." / EN "I'm ready again. My legs don't tire."
- Gesto: bate as duas patas no lugar, como largada.
- Combina: a única forma longa da área; leveza contra o peso da Masmorra.

**Bento — Meu Soulmon (Laboratório)** (ex-Tico)
- Espécie: coruja-cervo pequena (a do placeholder atual vira a dele, repintada): chifrinhos de vidro, penas petróleo, óculos de lente redonda de cobre.
- Temperamento: cuidadoso, atento a detalhe, fala da criatura com respeito de quem cuida de planta.
- Falas: PT "Aqui está tudo sobre quem vive com você." / EN "Here is everything about who lives with you." · PT "O traço dele veio de nascença. Não se troca, se conhece." / EN "Its trait came at birth. You don't swap it, you get to know it." · PT "Olha como a pelagem pegou luz hoje." / EN "Look how its coat caught the light today."
- Gesto: ajusta os óculos com a ponta da asa.
- Combina: a redoma; vidro e cobre.

**Quill — Observatório (Laboratório)** (nome existia)
- Espécie: louva-a-deus de vidro esverdeado, cujas patas dianteiras são penas de escrever; um caderno de cobre preso às costas.
- Temperamento: meticuloso e sereno; anota, nunca avalia.
- Falas: PT "Cada dia fica anotado aqui. É só para olhar." / EN "Every day is written here. It's just to look at." · PT "Esta página tem um sonho novo. Anotei com cuidado." / EN "This page has a new dream. I wrote it down carefully." · PT "O registro só cresce. Nada se apaga daqui." / EN "The record only grows. Nothing is erased here."
- Gesto: vira uma página com a pata-pena.
- Combina: torre de lente; geometria fina.

**Nino — Círculo de Amigos (Hall)** (nome existia)
- Espécie: esquilo-planador de pelagem creme com membrana de pergaminho entre as patas; bolsa de cobre a tiracolo.
- Temperamento: sociável, rápido, gosta de levar recado mais do que de receber.
- Falas: PT "Quem você quer visitar hoje? Estão logo ali." / EN "Who do you want to visit today? They're right over there." · PT "Chegou um aceno. Guardei na bolsa pra você." / EN "A wave arrived. I kept it in my bag for you." · PT "O gazebo tem lugar pra mais um sempre." / EN "The gazebo always has room for one more."
- Gesto: plana de uma coluna para outra do gazebo.
- Combina: o gazebo vazado, leveza, creme do Hall.

**Marla — Salão da Guilda (Hall)** (nome existia; sai da Arena)
- Espécie: cervo-árvore grande e lento, galhada que é um pequeno bosque com folhas turquesa; casco de pedra clara.
- Temperamento: acolhedora, fala do bosque e do grupo, nunca de quem está ou não está.
- Falas (a primeira é a do PLANO-GUILDA §6): PT "Algumas criaturas cuidam de um bosque juntas. Ele só cresce." / EN "Some creatures keep a grove together. It only grows." · PT "Brotou uma folha nova hoje. O bosque ficou mais fundo." / EN "A new leaf sprouted today. The grove got deeper." · PT "Quem viaja volta pro mesmo lugar na roda." / EN "Whoever travels comes back to the same place in the ring."
- Gesto: inclina a galhada e cai uma folha.
- Combina: a árvore dentro do arco é a galhada dela.

### 4.3 Anfitriões existentes (só ajuste de arte)
Grom, Vultrak, Zeph, Pipo, Vesca, Lumi mantêm nome e fala. Ajustes: **Vesca** perde o roxo (poções turquesa/âmbar). **Vultrak** ganha acento arenito para casar com a nova Arena. **Zeph** confere que não carrega caveira. **Pipo** é o benchmark de tom.

---

## 5. Regras de produção (para os prompts da fase seguinte)

| Família | Saída | Resolução | Chão/âncora | Alfa |
|---|---|---|---|---|
| Fundo de área (`cenario`, subtipo área) | `src/assets/soulmon/areas/bg-<area>.png` | **760×1344** (9:16), ≤ **400 KB** após WebP (`orcamentoDeBytes.contract.test.ts`) | vista isométrica de cima; clareiras vazias onde os lotes pousam, nas posições `left/top` de `areaSheetCopy.ts`/`playAreaLots.ts` | sem alfa |
| Lote | `src/assets/soulmon/areas/lote-<area>-<lote>.png` | gerar 768², recortar **300²** | centro da BASE no centro-inferior do quadro (é o ponto que `left/top` posiciona); sombra de contato inclusa | **alfa real** (fundo transparente de verdade, nunca xadrez pintado) |
| NPC (busto) | `src/assets/soulmon/npcs/npc-<area>-<lote>.png` (novos); os anfitriões mantêm `npc-<area>.png` | **768²** | busto da cintura para cima, olhando 3/4 para a esquerda (fala à direita) | **alfa real**, contorno preto de 1 px |
| Palco (não é deste doc) | `src/assets/backgrounds/` | — | chão em **74%**, horizonte ≤ 74% | — |

Estilo: pixel art isométrica, pixel limpo sem anti-aliasing borrado, contorno escuro, luz vinda da direção declarada em §2 para a área. Kit comum em todo prompt: fundo verde-petróleo, ferragem cobre profundo, fagulha turquesa, videira sobre estrutura. Cada prompt carrega o acento, o material, a luz e a forma da área (§2) e a silhueta do lote (§3), literal.

**Proibido em qualquer prompt/arte**: magenta, roxo, rosa, violeta (inclusive em flor, poção, slime); chama vermelha/laranja como energia; caveira, osso humano, lápide; texto, letra, número, logotipo; mão humana; humano genérico como NPC; personagem, criatura ou nome de franquia existente ("Do not copy any existing franchise character" obrigatório); aparelho estilo v-pet ovalado de outra marca.

**Convenção de id**: `lote-<area>-<loteId>` e `npc-<area>-<loteId>`, com `<loteId>` idêntico ao id do código (`feira`, não `guilda`, para a Arena). Instalação: só trocar os imports em `src/assets/soulmon/areas/index.ts` (`GUILDA_LOT_ART`, `LABORATORIO_LOT_ART`, `HALL_LOT_ART`) e `src/assets/soulmon/npcs/index.ts` (`LOT_NPC_ART`); voz nova em `LOT_NPC_VOICE` (`src/utils/areaNpcVoice.ts`, dono único). Conferência pelo `arte-conferente`: alfa, paleta (varredura de matiz 270°–340° deve dar zero), tamanho, e o teste de silhueta preta de §3 lado a lado com as vizinhas.

---

## 6. Ordem de produção (por frequência de uso)

1. **Mercado** (fundo + lote Conquistas + Medra; refazer Tamba/Musga/Panora) — loja é a área mais visitada do mapa.
2. **Laboratório** (fundo novo + 3 lotes + Bento/Quill + repintar Vesca e zona) — Evolução e Estatísticas são vistas toda semana; hoje é 100% placeholder.
3. **Hall** (fundo + 3 lotes + Nino/Marla) — junto da Guilda.
4. **Arena** (fundo definitivo + Feira + Fanfare + Tuska).
5. **Exploração** (repintar fundo sem caveiras + Trote).
6. **Jogos** (só repintura A1).

## 7. Anotado, não decidido aqui
- O Dino é minijogo e mora na Exploração; mover para Jogos daria a Jogos um segundo lote. É decisão de navegação (dono + squad-design), não de arte.
