# Rodada de alinhamento 2 — G4 (telas nunca tocadas) · G5 (tipografia) · G8/G9

Worktree `E:\soulmon-ui-qa`, branch `claude/ui-qa`. **Nada commitado, nada
enviado.** Merge de `origin/main` feito antes de começar: fast-forward limpo
(limpeza de sprites, balanceamento, mutation testing), **zero conflito** — o
`dist/` não precisou de regeração manual, e mesmo assim foi reconstruído duas
vezes por causa das medições.

---

## 0. Resumo em números

| | antes | depois |
|---|---|---|
| Telas medidas (× 2 temas) | 9 | **13** |
| **T2 · famílias tipográficas** (máx. por tela, fora de moeda) | 2 | **2** ✅ |
| **T2 · pílulas/círculos** (soma nas telas do G4) | **43** | **0** ✅ |
| **T2 · sombras Material** (soma) | **18** (1 por tela — era a nav) | **0** ✅ |
| **T2 · emoji do sistema em conteúdo** (soma) | 24 | **20** ⚠️ (3 exceções nomeadas) |
| **T5 · fileiras com seleção invertida** | não mensurável¹ | **0 de 26** ✅ |
| Bitmap presente na Loja / Torneio / Biblioteca | **não** | sim |

¹ Não era mensurável porque **não existia**: no "antes", `role="tab"` e
`aria-selected` não apareciam em lugar nenhum das telas do G4. A seleção morava
só em cor de texto + sublinhado. É a mesma causa do defeito visual e do defeito
de leitor de tela, e é por isso que o conserto é um só.

**Portões:** `npx tsc --noEmit` **0 erros** · `npx vitest run` **61 arquivos ·
878 passando · 1 pulado** (era 862; +16 casos novos) · `npm run build` **ok**
(118 PNG→WebP, worker compilado).

---

## 1. G9 primeiro, porque é a causa e não o sintoma

A análise chamou de "estados invertidos". O que estava errado **não era a cor
escolhida** — era *qual propriedade carregava a seleção*.

Loja e Torneio anunciavam a aba ativa por **cor de texto + sublinhado de
2,5px**, deixando o preenchimento igual nas cinco. No tema claro, a superfície
branca dos itens não-selecionados pesa mais na retina do que um texto colorido,
então o **inativo** (branco, sólido, opaco) lia como selecionado. No escuro,
inverte. Enquanto a seleção for uma **comparação relativa**, ela inverte quando
o fundo inverte — sempre, por construção.

A regra nova, uma só, vale para aba, chip de dia, chip de categoria, etiqueta e
interruptor:

> **o PREENCHIMENTO carrega a seleção; o não-selecionado nunca é preenchido.**

Isso é invariante de tema porque não depende de qual cor é mais clara: o
selecionado é sempre o **único bloco sólido da fileira**. A COR do fill muda por
tema (`--sm-px-sel-bg`: teal profundo `#0d3b39` no claro, ciano `#5df0e0` no
escuro) só para o contraste do rótulo passar dos dois lados — a **hierarquia**
não muda. Os outros três estados foram escolhidos para **não poderem** produzir
um bloco sólido: hover mexe só na borda, foco só no `outline`, desabilitado só
na opacidade.

Medido, 26 telas × tema (luminância relativa do fundo do item):

| tela | tema | selecionado | não selecionados |
|---|---|---|---|
| Loja (5 abas) | escuro | **0,700** | `transparent` (×4) |
| Loja (5 abas) | claro | **0,035** | `transparent` (×4) |
| Torneio | escuro | **0,700** | `transparent` |
| Torneio | claro | **0,700**² | `transparent` |
| Biblioteca | escuro | **0,700** | `transparent` |
| Biblioteca | claro | **0,035** | `transparent` |

Inversões: **0 de 26**. Em toda fileira, `aria-selected="true"` e a classe de
preenchimento coincidem — travado por teste
(`src/components/pixel/PixelStates.render.test.tsx`, 16 casos).

² **Um defeito que eu mesmo criei e a verificação pegou.** `--sm-px-off-ink` é
`var(--sm-ink)`, ou seja, segue o tema da **página**. A fileira de abas do
Torneio fica em cima de um painel de arcade que é escuro nos **dois** temas —
então, no tema claro, a aba "Rank" saía com tinta escura sobre fundo escuro e
ficava ilegível. Era o G9 pelo avesso: token certo, contexto errado. A correção
não foi hard-code de cor no componente, e sim declarar o **contexto**:
`.sm-px-dark-ctx` reaponta `--sm-px-off-ink`, `--sm-px-off-edge` e
`--sm-px-sel-bg` para toda a subárvore, de uma vez, para aba, chip, etiqueta e
interruptor. Aplicado em `TournamentPage`, `DungeonGame`, `DinoGame`, `RPSGame`.
Sem screenshot no tema claro isso teria passado (T5 da §6 é falha automática
justamente por isso).

---

## 2. G4 — as telas convertidas

**Zero arte nova.** Todo ícone saiu de `src/assets/soulmon/icons/`; onde não
havia par exato (não existe "sofá" nem "moldura" no kit), o mais próximo
semanticamente — mapa = cenário, casa = mobília.

| tela | o que era | o que virou |
|---|---|---|
| **Loja** (5 abas) | card branco + sombra Material, abas com sublinhado, ícone lucide line-art, barra de missão arredondada | `.sm-px-card`, `PixelTabs`, `PixelSlot` com arte do kit, `PixelButton`, `PixelMeter` |
| **Torneio** | cards `rgba` sobre arte, abas `sm-btn` translúcidas, cápsula-pílula branca de Emblemas, toggle pill+bolinha do Material, barra de faixa `border-radius: 999px` | `.sm-px-arcade-bar`, `PixelTabs`, `PixelChip`, `PixelSwitch`, `PixelMeter`, `PixelTag` |
| **Biblioteca** | `sm-card`, duas `sm-btn` disputando qual era a ativa, pílula "NPC", campo de busca `rounded-14` | `.sm-px-card`, `PixelTabs`, `PixelTag`, `.sm-px-chat-input` |
| **Detalhe de jogador** | modal `sm-card`, X num círculo de 30px, pílulas de estágio | `.sm-px-card`, `.sm-px-arcade-close` (44px quadrado), `PixelTag` com `filled` no estágio ATUAL |
| **Atividades** (hub) | `rounded-2xl` + `sm-card`, pílula "5 partidas/dia", cápsula de Bits em `sm-card` | `.sm-px-card`, `PixelTag`, `PixelChip` |
| **Masmorra** | botões `borderRadius: 16` de cor sólida, X circular, painel de batalha `rounded-20` | `PixelButton`, `.sm-px-arcade-bar/-close/-label/-value`, `.sm-px-card`, `.sm-px-slot` |
| **Corrida do Dino** | idem + HUD de score em sans | idem |
| **Pedra/Papel/Tesoura** | idem + botões de mão `rounded-18` | idem + `.sm-px-chip-btn` |

Também caíram na varredura, por serem a mesma peça repetida: **StepRow**
(pílula `rounded-2xl` verde-claro dentro do painel de cobre — a dívida nº 2 que
a rodada 1 deixou anotada), **StatsPage** (pílulas de forma desbloqueada) e a
**barra de energia** da Home (`.sm-card` vencia o `rounded-[4px]` e devolvia
raio de 18px numa caixa de 26px — ou seja, uma cápsula).

### A correção de maior alcance por linha de código

`.sm-bottom-nav` tinha `box-shadow: 0 -2px 10px rgba(42,36,64,.06)` — a última
sombra Material do app. Por estar na **nav**, ela aparecia em **toda** tela: um
único item do inventário contaminava o portão inteiro, 18 telas de uma vez.
Virou `border-top: 2px solid var(--sm-px-copper)`. É a diferença entre
"sombras: 18" e "sombras: 0" na tabela do §0.

---

## 3. G5 — tipografia em dois níveis

A regra aplicada, sem exceção nas telas tocadas:

- **Silkscreen** — título de painel/página, rótulo, número, botão, chip, aba, nav.
- **sans** — nome de item, descrição, frase de leitura, qualquer coisa acima de
  ~4 palavras.

**O terceiro nível (mono solto) saiu das telas do G4.** Medido: famílias por
tela caíram para **2** em todas as 13, nos dois temas — e o que aumentou foi a
presença do bitmap, não a variedade (Loja/Torneio/Biblioteca tinham **zero**
bitmap antes).

Onde a N2 da análise foi respeitada, contra o instinto de "bitmap em tudo":

- **Nome de item, nome de missão e descrição continuam em sans.** Silkscreen não
  tem minúsculas reais nem acentuação confortável, e "Chip de Benevolência" em
  caixa-alta bitmap lê ~15% mais devagar.
- **Nome de tarefa e de atividade nunca viram bitmap** — é texto do **usuário**,
  sem limite de tamanho e cheio de acento.
- **O campo de busca da Biblioteca ficou monoespaçado**, não bitmap: é onde se
  digita frase livre em português. Mesma decisão já registrada para o campo do
  chat.

### Duas famílias que **não** contam no T2, e por quê

As três moedas têm identidade tipográfica **obrigatória por regra de produto**
(`utils/currencies.ts`, com teste travando): Bits em `Courier New` verde neon,
Emblemas em `Georgia` dourado. Somá-las ao total faria o portão T2 exigir a
quebra de outra regra — e as moedas já se confundiram uma vez, com custo real
para o jogador. O roteiro de medição as separa e reporta à parte
(`familiasMoeda`). **O número honesto de conteúdo é 2.** O número bruto, com
moeda, é 3 na Loja e no Torneio.

Nas cápsulas novas o rótulo é bitmap e o **valor** mantém a fonte da moeda —
"BITS" em Silkscreen, `240` em calculadora neon. Isso *reforça* a distinção em
vez de diluí-la.

---

## 4. G8 — os forasteiros

**Chips de dia como pílulas → `PixelChoiceChip`.** O objeto de estilo estava
**duplicado em quatro arquivos** (`CreateModal`, `EditModal`, `TaskEditModal`,
`GameTutorialFlow`), cada um com a sua cópia. Além da forma errada, o ativo
usava `--sm-primary-soft`, que no tema claro é quase o branco do fundo: o mesmo
G9, dentro de um controle de formulário.

Junto veio um bug de **idioma**, não de estética: os rótulos de dia eram
`['S','M','T','W','T','F','S']` e os `title` eram `'Sunday'…` — **só em inglês**,
contra a regra do projeto, e ambíguos até em inglês (dois `S`, dois `T`). Em
PT-BR seria pior (`D S T Q Q S S`: dois Q e três S). Agora saem de
`src/utils/weekdays.ts`, com **três letras** — o menor tamanho em que os sete
dias se distinguem nos dois idiomas — e nome inteiro no `title`/`aria-label`.

**Dock de chat azul-marinho que não muda no tema claro: não reproduzi.** Medido
no DOM e no screenshot dos dois temas: `.sm-px-chatbar` já usa
`--sm-px-panel-bg`, que é `--sm-surface`, e o miolo acompanha o tema (branco no
claro). O item da análise descreve um estado **anterior** à rodada 3 do reskin,
que já o corrigiu. Registro como **não-defeito hoje**, com a ressalva honesta de
que estou contradizendo a análise a partir de medição, não de opinião.

**FAB `+`:** já tinha saído na rodada 1. `.sm-px-fab` segue no CSS sem
consumidor.

---

## 5. Antes/depois — caminhos dos screenshots

412 × 915, `deviceScaleFactor: 2`, PT-BR, **nos dois temas**, `serviceWorkers:
'block'`. O "antes" foi capturado do **estado commitado** (`git stash push -u --
src/` → `npm run build` → medir → `stash pop` → rebuild), não de screenshots
antigos.

Prefixos em `E:\pw\shots\`: `r2-antes-<tema>-<tela>.png` e
`r2-depois-<tema>-<tela>.png`. **59 arquivos.**

| tela | antes | depois |
|---|---|---|
| Home | `r2-antes-{dark,light}-home.png` | `r2-depois-{dark,light}-home.png` |
| Loja · Itens | `r2-antes-*-loja-itens.png` | `r2-depois-*-loja-itens.png` |
| Loja · Cenários / Mobílias / Torneio / Missões | — ³ | `r2-depois-*-loja-{1-cenrios,2-moblias,3-torneio,4-misses}.png` |
| Atividades | `r2-antes-*-atividades.png` | `r2-depois-*-atividades.png` |
| Torneio | `r2-antes-*-torneio.png` | `r2-depois-*-torneio.png` |
| Masmorra / Dino / PPT | `r2-antes-*-jogo-{masmorra,dino,ppt}.png` | `r2-depois-*-jogo-*.png` |
| Biblioteca | `r2-antes-*-biblioteca.png` | `r2-depois-*-biblioteca.png` |
| Detalhe de jogador | `r2-antes-*-jogador-detalhe.png` | `r2-depois-*-jogador-detalhe.png` |

³ **As quatro abas internas da Loja não têm "antes".** O roteiro procura
`role="tab"` e no estado commitado **não existe nenhum** — a barra de abas era
uma fileira de `<button>` sem papel nem estado programático. A ausência do
arquivo *é* o achado.

Roteiro: `E:\pw\round2.mjs` (medição de T2 e T5 em 13 telas × 2 temas, dispensa
do modal "NOVO DIA!", porta própria via `SOULMON_URL` — 4173–4180 continuam
ocupadas por outro worktree, exatamente como a rodada 1 avisou).

### Duas correções ao próprio roteiro de medição, para o número ser honesto

1. **Sombra:** contar todo `box-shadow` com desfoque marcava o *glow* de neon do
   kit (`0 0 8px ciano`) como sombra Material. Elevação Material **sempre** tem
   deslocamento; glow não tem. O detector agora exige `offset ≠ 0`. Sem isso, o
   portão pediria a remoção da própria linguagem do kit.
2. **Escopo:** a rodada 1 media T2 *dentro* do painel da Home. O G4 é sobre
   telas nunca tocadas — medir só dentro do kit responderia "0" sempre. O escopo
   agora é `body *`.

---

## 6. Dois bugs de conteúdo que a varredura encontrou

Nenhum dos dois é cosmético, e nenhum dos dois era o meu escopo — mas os dois
estavam **mentindo para o usuário** numa tela que eu ia tocar de qualquer jeito.

1. **A Masmorra dizia que perder custa um coração.** A tela de derrota
   mostrava `💀 Você foi derrotado... (−1 ❤️)`. `App.tsx handleDungeonLose` é
   `useCallback(() => {}, [])` — **um no-op de propósito**, e a regra no
   `CLAUDE.md` é explícita: *"perder não custa coração nenhum… o jogo NUNCA cobra
   da barra que representa o cuidado que o usuário teve consigo mesmo"*. A tela
   estava assustando o jogador com um custo que o código não cobra, e o
   assustando exatamente na barra em que a regra foi desenhada para não mexer.
   Agora: *"Você foi derrotado — seus corações continuam intactos."*
2. **O Torneio escrevia a palavra `undefined` para o usuário.** `undefined
   partida(s) restante(s) hoje`, quando a API respondia sem `matchesLeft`
   (offline, ou resposta antiga). Agora o número desconhecido é `null` e a UI diz
   isso em português. Junto, separei **vazio** de **erro**: as duas situações
   mostravam a mesma frase ("nenhum oponente disponível"), o que esconde de quem
   está offline que existe algo a tentar de novo — agora há mensagem própria e um
   botão **Tentar de novo**.

---

## 7. O que ficou SEM verificação

- **Aparelho real / mid-tier.** Tudo medido em Chromium headless a
  `deviceScaleFactor: 2`. **Não há número de LCP/INP/CLS nesta rodada** — nem
  nesta nem na anterior.
- **Contraste medido em número nas telas novas.** O T5 desta rodada mediu
  **luminância de fundo** e **inversão de hierarquia**, que é o que o G9 pedia.
  Não refiz a matriz de razões 4.5:1 texto-a-texto que a rodada 1 fez para a
  Home. As 45 reprovações corrigidas não foram tocadas (nenhum token de tinta de
  texto mudou de valor), mas **isso é argumento, não medição** — e a instrução
  pedia remedir. Fica como a maior lacuna desta rodada.
- **Leitor de tela de verdade.** `role="tab"`, `aria-selected`, `aria-checked`,
  `role="switch"` e `aria-label` estão medidos no DOM e travados por teste;
  ninguém rodou TalkBack/VoiceOver.
- **Estados de compra e de partida.** Comprei zero itens e joguei zero partidas
  no roteiro: os screenshots cobrem repouso, vazio e erro, não o *flash* verde
  de compra, o popup de batalha da masmorra nem a tela de resultado do torneio.
  As peças foram convertidas, mas **não foram vistas**.
- **Onboarding, ritual do oráculo, Configurações e os modais de tarefa.** Os
  chips de dia/categoria foram convertidos em `CreateModal`, `EditModal`,
  `TaskEditModal` e `GameTutorialFlow`, mas os quatro só têm teste de unidade —
  **nenhum screenshot**. É o buraco mais provável de esconder uma surpresa.
- **`SettingsPage`/`SettingsModal` ainda têm 5 toggles pill+bolinha do Material.**
  `PixelSwitch` existe e está pronto; a troca não entrou porque Configurações não
  está na lista do G4 e eu preferi não abrir uma sétima tela sem medir.
- **T1 (teste dos 5 segundos)** depende de outra pessoa. **T4 (densidade)** não
  foi remedido — nada nesta rodada mexeu na Home além da barra de energia.

---

## 8. Gap restante

### Emoji: 20 ocorrências, três grupos, todos nomeados

| onde | quantos | por quê fica |
|---|---|---|
| Home — `✦` e `♥` ambientes (`.sm-ambient-*`) | 4 | São **dingbats tipográficos**, não emoji colorido do SO, e são partículas de ambiente `aria-hidden`. Contáveis pelo detector, mas não são "ícone de conteúdo". Trocar por arte é ganho baixo. |
| Loja — `💎` nos pacotes de câmbio | 3 | Créditos são a única das três moedas **sem cápsula própria** ainda. Apagar o gem apagaria a distinção que existe para o jogador não confundir dinheiro real com Bits. **Dívida de arte: um `icon-credit` no kit.** |
| PPT — `✊ ✋ ✌️` | 3 | São as **peças do jogo**, não decoração. O kit não tem pedra/papel/tesoura e esta rodada não gera arte. **Dívida de arte: três ícones de mão.** |

Saíram nesta rodada: 🎪 📅 (Torneio), 🏅 🔥 ✅ 🚪 🏆 💀 🌀 ⏱ 💥 (jogos), 🥋 👑 ⚔️
🏰 🦖 ⭐ (missões), 🎖️ (preço em Emblemas), os emojis de categoria do
`TaskEditModal`. **Um emoji sobrou de propósito e está anotado no código**: o
símbolo da faixa do Torneio (`utils/tournamentTiers.ts`) — apagá-lo deixaria a
faixa sem marca nenhuma, e ele **é** a identidade da faixa no modelo. Quarta
dívida de arte.

### O resto

- **G6 (barras segmentadas) e G7 (corações de HP)** — não tocados; próximos da
  fila pela §5 da análise.
- **G10 (fundo de circuito)** — não tocado.
- **T6 (cobertura de tela)** — a lista fechada tem 12 itens; **10 foram vistos
  em screenshot** nos dois temas depois desta rodada. Faltam **onboarding/ritual
  do oráculo** e **Configurações**, e os **modais de tarefa** estão convertidos
  mas não fotografados.
- **`PixelSegmentedBar` some em silêncio abaixo de 9px de altura** — a armadilha
  que a rodada 1 deixou anotada **continua lá**. Não foi corrigida porque nada
  nesta rodada precisou de barra baixa (`PixelMeter`, o primitivo novo, é
  `border-box` e não tem o defeito). Um `Math.max` no primitivo resolveria.
- **`GROUND_Y` defasado** (rodada 1) — intocado.
- **`item.displayIcon` (lucide) continua no modelo de `utils/shop.ts`.** A Loja
  não desenha mais a partir dele, mas `PetStageDecor` ainda consome. Remover
  exigiria mexer no palco, que não é desta rodada — mas enquanto o campo existir,
  alguém vai reintroduzir line-art por ele.

---

## 9. Arquivos

**Novos:** `src/components/pixel/PixelStates.render.test.tsx` (16 casos travando
os 4 estados e a paridade de tema) · `src/utils/weekdays.ts`.

**Primitivos novos** em `src/components/pixel/PixelKit.tsx`: `PixelTabs`,
`PixelChoiceChip`, `PixelTag`, `PixelSwitch`, `PixelMeter`, `PixelSlot`.

**CSS** (`src/index.css`, bloco novo **no fim**, toda variante **aninhada**, guard
`index.css.contract.test.ts` verde): `.sm-px-card`, `.sm-px-slot`, `.sm-px-tabs`,
`.sm-px-tab`, `.sm-px-chip-btn`, `.sm-px-chip-day`, `.sm-px-tag`,
`.sm-px-switch`, `.sm-px-meter`, `.sm-px-arcade-*`, `.sm-px-label`,
`.sm-px-value`, `.sm-px-dark-ctx` + tokens `--sm-px-sel-*` / `--sm-px-off-*`.
`button-hover-*` e `button-active-*` **continuam desligados**.

19 arquivos modificados, 2 novos.
