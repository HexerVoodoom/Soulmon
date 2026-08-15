# Rodada de alinhamento 3 — B1 · B8 · B5 · B2 · B4 · B7 (+ B3, P1, P2)

Worktree `E:\soulmon-ui-qa`, branch `claude/ui-qa`. **Nada commitado, nada
enviado.** `git fetch origin && git merge origin/main` antes de começar:
fast-forward limpo `0a4b4b62..7b8a0955` (testes de snapshot de cloudSync,
`GameStateContext.saveContent`, docs) — **zero conflito**, `dist/` não precisou
de regeneração manual e mesmo assim foi reconstruído quatro vezes por causa das
medições.

---

## 0. Resumo em números

| | antes | depois |
|---|---|---|
| **Controle interativo sem moldura/superfície** (a métrica que faltava, §5 da crítica) | **13** na Home · 15 com modal aberto | **0** — em 26 telas × 2 temas |
| Controle primário coberto pela nav / dock (no fim do rolo) | **4** (3 mãos do PPT + CTA do painel) | **0** |
| Grupos soltos fora do painel na Home | **6** | **0** |
| T2 · pílulas em Configurações | **6** | **0** |
| T2 · sombras Material em Configurações | **3** | **0** |
| T2 · famílias tipográficas em Configurações | 2 (sans + mono, **sem bitmap**) | 3 (sans + mono + **Silkscreen**) |
| T2 · emoji do sistema na Home | **2** (`✦` `♥`) | **0** |
| Destinos da nav com rótulo visível | **0 de 6** | **6 de 6** |
| Ícones lucide (line-art) fora dos minijogos | 4 (`Bot`, `Info`, `Copy`, `Check`) + `ChevronRight` | **0** |
| Abas invisíveis sem affordance na Loja | 2 de 5, **sem pista** | 2 de 5, **com corte marcado** |

**Portões, números reais:**
`npx tsc --noEmit` → **0 erros** ·
`npx vitest run` → **63 arquivos · 1002 passando · 1 pulado** (era 1002 na base
após o merge: 5 casos novos entraram, 1 antigo foi reescrito) ·
`npm run build` → **ok** (119 PNG→WebP, 7,22 MB economizados, worker compilado).

---

## 1. B1 — emoldurar a Home fora do painel

### O que a métrica mostrou antes de eu mexer

A crítica dizia "seis grupos em superfície nenhuma" no olho. Eu escrevi a
métrica que a §5 pediu — *controle interativo sem moldura* — e ela devolveu
**13** na Home, contra **0** em Loja, Torneio, Masmorra, Dino e Configurações.
Ou seja: a Home não estava um pouco pior que as outras. Ela era **a única tela
do app com o defeito**, e a métrica separa isso em um número.

> **Definição da métrica** (`E:\pw\round3.mjs`): para todo
> `button, [role=button], [role=tab], [role=checkbox], [role=switch], a[href],
> input, select, textarea` visível e ≥4px, sobe a árvore procurando um
> ancestral com fundo opaco (alfa > 0,08), `background-image`, `clip-path`,
> `border-image` ou borda visível. Ancestrais que ocupam ≥88% da altura da
> viewport **não contam** — scroller, raiz do app e `body` são fundo de página,
> não superfície de controle. Sem isso a métrica dá zero sempre e não mede nada.

Os 13: 3 ações soltas (Itens/Banho/Dormir), o botão de Créditos, e as 9 linhas
do painel de rituais — **essas nove eram falso positivo meu**, e vale registrar:
a primeira versão da métrica subia só 4 níveis e não alcançava a moldura do
painel. Uma métrica que reprova a melhor peça do app está errada, não a peça.

### As três correções

**1. As ações viraram uma fileira emoldurada sob o palco.** É o padrão do
gênero (Tamagotchi, Neko Atsume, Habitica): o cuidado do bicho mora numa fila
rente ao palco, não flutuando ao lado dele. `.sm-px-actionbar` usa a **mesma**
moldura do `.sm-px-card` — chanfro + borda de cobre — e divisor de cobre entre
as células, porque três botões colados sem divisor leem como um botão só. Alvo
de **60px de altura com o rótulo dentro** (antes: 71px sem moldura nenhuma, o
que não é alvo, é uma região). Zero arte nova: os mesmos três PNG do kit.

**2. O HP saiu do ar e virou cápsula, ao lado de ENERGIA.** Os três corações
eram o único medidor do app desenhado sem superfície, e ficavam sobre o palco
disputando com o pet. Agora `HomeHud` tem duas fileiras: marca + Créditos em
cima, **VIDA + ENERGIA** embaixo, duas cápsulas de peso igual porque são a
mesma classe de informação. O meio-coração da cura por carinho continua
desenhado (travado por teste).

**3. A barra vertical de energia morreu — e essa é a decisão que eu defenderia
numa review.** Ela não era "uma barra vazia que precisava de rótulo": era um
**segundo desenho do mesmo número** que a cápsula ENERGIA do HUD já mostrava,
com 26px de largura, colada na margem, em linguagem diferente. Emoldurar e
rotular teria produzido dois medidores concorrentes da mesma grandeza, que é
pior do que um. Duplicar informação em duas linguagens é a doença, não o
sintoma.

**Bônus da mesma varredura:** as quatro partículas (`✦ ✦ ♥ ♥`) saíram — eram o
sexto grupo solto e os dois únicos caracteres de emoji que sobravam na Home; e
a tarja de risco de HP trocou `rounded-2xl` pelo chanfro do kit, que era o
último raio Material da tela.

### A cápsula de Créditos, e por que a moldura virou o botão

Depois de tudo acima a métrica ainda acusava **1**: o botão de Créditos era um
`<button>` transparente **envolvendo** uma cápsula. Funcionava — mas o
controle (o que recebe foco, o que o dedo acerta) era a caixa sem superfície, e
a moldura era um filho decorativo. Aparecia de verdade no `:focus-visible`, que
desenhava um anel em volta do nada.

`PixelChip` passou a aceitar `onClick`: com ele, a moldura **é** o `<button>`.
Métrica → **0**.

---

## 2. B8 — Configurações

Era a única tela que ainda tinha um design system inteiro dentro dela. Nada do
que entrou é peça nova: `.sm-px-card`, `PixelButton`, `PixelSwitch`,
`PixelTabs` e os ícones do kit existem desde a rodada 2 — é a varredura do G4
aplicada na tela que ficou de fora.

| era | virou |
|---|---|
| `sm-card p-6` (branco + sombra Material) | `.sm-px-card p-6` |
| campo-cápsula `rounded-xl`, 38px de altura | `.sm-px-field` — chanfro, monoespaçada, **44px de alvo**, 16px (sem auto-zoom do iOS) |
| botão `sm-btn` cinza | `PixelButton` (`lg` primário / `sm` secundário) |
| toggle pill + bolinha branca, num `<div onClick>` | `PixelSwitch` (`role="switch"`, foco de teclado, estado no DOM) — **3 lugares** |
| `Bot` / `Info` (lucide, traço de 1,5px) | `icon-spellbook` / `icon-star` do kit |
| `Copy` / `Check` (lucide, alvo de 32px) | `PixelButton` com a **palavra** "Copiar"/"Copiado" |
| `✓` / `✗` como estado de restauração | "Pronto" / "Restaurar" |
| Aparência e Idioma: fileira com **dois** blocos preenchidos | `PixelTabs` — a seleção carrega no preenchimento |
| 🇺🇸 / 🇧🇷 como rótulo de idioma | o nome do idioma |
| `AccountSection`: card `border-radius: 16px`, botão de linha `rounded-12` | `.sm-px-card` + `.sm-px-row-btn` (44px) |
| cabeçalho `1rem` em sans, oito vezes repetido | `.sm-px-section-title` (Silkscreen 12px) |

Duas coisas que eu mudei por serem **defeito**, não estilo:

- **Os três toggles não eram controles.** Eram `<div onClick>`: sem foco de
  teclado, sem papel, sem estado para leitor de tela. O visual Material era o
  sintoma visível de um problema de acessibilidade.
- **Aparência/Idioma tinham a inversão do G9 pelo avesso.** O
  não-selecionado usava `--sm-bg` — **sólido** — e o selecionado `--sm-primary`:
  dois blocos preenchidos disputando na mesma fileira. É exatamente o defeito
  que a rodada 2 consertou nas outras telas, vivo aqui porque ninguém abriu
  esta tela.
- A bandeira como rótulo de idioma está errada de todo jeito: inglês não é
  propriedade dos EUA.

Medido: pílulas **6 → 0**, sombras **3 → 0**, Silkscreen presente pela primeira
vez.

---

## 3. B5 — o CTA comido pelo dock de chat

O `paddingBottom` do scroller da Home era `... + 100px` — um número mágico que
não sabia da existência do dock. Virou o token **`--sm-chatdock-h: 82px`** (a
altura real de `.sm-chat-fixed`), somado no scroller: agora o scroller e o dock
se movem juntos, e mexer no padding do dock não deixa mais um CTA meio comido.

Medido no fim do rolo (`home-fim`, nos dois temas): "+ Nova Atividade" **não
aparece mais na lista de ocluídos**. Antes: 88% coberto.

> Nota honesta sobre a medição: no topo do rolo o CTA continua "coberto" — mas
> ele está **abaixo da dobra**, e conteúdo abaixo da dobra ficar atrás de um
> dock fixo é o comportamento correto. O que importa é o **fim do rolo**, e é
> lá que o portão fecha.

---

## 4. B2 — controles do minijogo debaixo da nav (+ auditoria de Masmorra e Dino)

**Confirmado e medido:** as três mãos do Pedra-Papel-Tesoura estavam **71%
cobertas** pela barra de navegação, nos dois temas. O único controle do jogo,
inalcançável.

A causa não é a "arena de altura fixa": os três jogos abrem como
`position: fixed; inset: 0` e empilham cabeçalho / arena `flex: 1` / controles.
A nav é `fixed` e ganha o empilhamento. Como o defeito e a estrutura são os
mesmos nos três, a correção é uma classe só — `.sm-px-arcade-root`, que reserva
a faixa da nav no próprio overlay — aplicada em `RPSGame`, `DungeonGame` e
`DinoGame`. Ocluídos: **3 → 0**.

**Auditoria de Masmorra e Dino: passam** — nenhum controle cortado, antes ou
depois. Mas a auditoria achou outra coisa:

### Achado novo: a Corrida do Dino tinha dois botões Material vivos

A crítica R2 deu Dino como "alinhado". Esse veredito veio do **hub** de
Atividades — **dentro** do jogo, "Começar" era uma cápsula verde `#4ade80` de
raio 16 em sans bold, e "Pular" era uma laje `rounded-18` em `#60a5fa`. Duas
cores fora da paleta e as duas últimas formas Material fora de Configurações.

"Começar" virou `PixelButton`. "Pular" **continua sendo um `<button>` cru** e
não um `PixelButton`, de propósito: a ação é `onPointerDown` (pular no toque,
sem esperar o `click`), que é requisito de um jogo de reflexo e o kit não
expõe. O que mudou foi a linguagem — `.sm-px-jump`, chanfro + cobre + ciano.

**Lição de portão:** T1 fotografado da lista de um hub não vê o que acontece
depois do toque. Telas com estado (`ready` / `playing` / `over`) precisam de um
screenshot **por estado**, senão o portão aprova metade da tela.

---

## 5. B4 — o ornamento do Torneio claro

O diagnóstico da crítica estava certo no efeito e errado na causa, e a diferença
mudou o conserto. **A decoração nunca esteve "por cima" do texto:** o anel
dourado é parte da arte de fundo (`tournamentBg`), e era o título que estava por
cima dele, sem placa. Baixar `z-index` não resolveria nada — o fundo já é o de
baixo. O que faltava era **separar as duas camadas por contraste**.

Entrou um véu de legibilidade: gradiente vertical forte no topo (onde o anel
cruza "TORNEIO" e a linha de PvP) que some no meio da peça, para a arte
continuar aparecendo onde não disputa leitura. Vale nos dois temas — o painel
é escuro em ambos, então o véu não pode inverter. **Zero arte nova.**

---

## 6. B7 — nav com rótulo persistente

Material e HIG convergem: barra inferior tem 3–5 destinos **com nome**. O app
tinha 6 e nenhum: o `aria-label` existia, mas quem enxerga não via nada.

**A pergunta que a tarefa mandava responder — "cabe?" — foi medida, não
estimada** (`E:\pw\navmeasure.mjs`, 412×915):

| rótulo | largura do texto | célula | folga |
|---|---|---|---|
| Início | 34px | 64,7px | 47% |
| **Atividades** (pior caso PT-BR) | **53px** | 64,7px | **18%** |
| Evolução | 47px | 64,7px | 27% |
| Biblioteca | 51px | 64,7px | 21% |
| Evolution (pior caso EN) | 50px | 64,7px | 23% |

**Cabe, com folga em todos os 12 rótulos (6 × 2 idiomas).** Silkscreen a 8px
com `letter-spacing: 0` — o espaçamento de 0,06em do resto do kit é o que
estourava. **Não é preciso reduzir destinos.**

Um defeito que a medição pegou e que teria passado: o rótulo do item ativo
saía em `font-weight: 700`, o que empurra "Atividades" para ~60px numa célula
que a placa reduz a 58,7px úteis — **"ATIVIDADES" saía cortado em "ATIVIDADE"**.
Saiu o negrito. É também a regra da rodada 2: quem carrega a seleção é o
preenchimento, e só ele.

**A seleção da nav passou a seguir a regra da rodada 2**: o destino ativo é o
único bloco sólido da fileira, com `--sm-px-sel-bg`/`--sm-px-sel-ink` — o par
de tokens que já é invariante de tema. Aqui eu repeti o erro do `.sm-px-dark-ctx`
e a verificação pegou: a primeira versão usava
`color-mix(cyan 16%, var(--sm-surface))` com rótulo em `--sm-px-ink`. No tema
claro isso é **branco sobre branco** — `--sm-px-ink` é tinta de peça ESCURA,
fixa, e a nav segue o tema da página. Sem screenshot no claro teria passado.

Ganho extra: `aria-current="page"` nos 4 destinos de verdade (Loja e Menu são
ações, e nunca recebem).

---

## 7. B3 — as duas abas invisíveis da Loja

A fileira sempre rolou; faltava a **pista**. Medido: `scrollWidth` 603px em
`clientWidth` 364px, com "Torneio" e "Missões" a **0% de visibilidade** e a
última aba visível terminando rente à margem — o desenho que Material e HIG
proíbem, porque nada distingue "acabou" de "tem mais".

O estado precisa ser **medido, não presumido**: uma máscara fixa esmaeceria a
última aba das fileiras que cabem inteiras (Aparência, Idioma, Torneio,
Biblioteca), inventando um corte que não existe. `PixelTabs` passou a expor
`data-cut` (`start`/`end`/`both`), calculado no `scroll` e num `ResizeObserver`
— e não em `window.resize`, porque a fileira também muda de largura quando o
**pai** muda (teclado abrindo, painel colapsando). O CSS reage com `mask-image`,
que não pinta cor nenhuma e por isso funciona igual nos dois temas.

Medido depois: `data-cut="end"` presente na Loja, ausente nas outras quatro
fileiras.

---

## 8. P1 e P2 — cards de Atividades

- **P1:** a setinha era `ChevronRight` da lucide — traço vetorial de 2,2px ao
  lado de sprites pixelados de 48px, o último line-art da tela. O kit não tem
  "seta" e esta rodada não gera arte: virou o mesmo glifo em **bitmap**
  (Silkscreen), `aria-hidden` porque o card inteiro já é o botão.
- **P2:** a etiqueta ("+5 Bits") dividia a **linha do título**, e em PT-BR os
  nomes longos quebravam em duas linhas por causa dela. A etiqueta desceu para
  a linha da descrição — onde mora o resto do metadado — e o título ganhou a
  largura inteira.

---

## 9. Os 4 buracos do T6: dois fechados, e o que eles esconderam

### Onboarding / ritual do oráculo — fotografado, e a crítica estava certa

Fotografado pela primeira vez, 5 passos × 2 temas
(`E:\pw\shots\r3-final-{dark,light}-onboarding-{0..4}.png`).

**É a tela mais desalinhada do app, e nenhuma rodada tocou nela.** Medido: uma
única família tipográfica — `ui-sans-serif`, **zero Silkscreen** —, 1 a 3
sombras Material por passo, ícone do app numa moldura `rounded-3xl`, título em
sans-serif pesado, e os dois CTAs no `.sm-btn` do sistema anterior.

O que **passa**: controles sem moldura = **0**, e os botões têm alvo e
contraste. Não é uma tela quebrada — é uma tela de **outro app**, e é a única
que 100% dos usuários veem antes de qualquer outra.

**Eu não a converti, e a decisão é deliberada.** A conversão do onboarding é
uma rodada inteira (5 passos, fluxo com estado, dois caminhos de compra, e o
único ponto de monetização do app). Enfiá-la no fim de uma sessão em que já
mexi em 15 arquivos é como uma rodada regride. **Fica como o item nº 1 da
rodada 4, com o diagnóstico já medido.**

### Modais de tarefa — fotografados

`r3-final-{dark,light}-modal-tarefa.png`. Estão **majoritariamente convertidos**
— os chips de categoria carregam a seleção no preenchimento, o ✕ é ícone do
kit, os checkboxes são do kit. Sobra Material identificável:

1. a casca do modal tem canto arredondado grande, não chanfro;
2. **CANCELAR / SALVAR / + ADICIONAR** ainda são `.sm-btn` (pílula 3D, sans);
3. **"Excluir" é texto vermelho solto** — sem moldura e sem alvo declarado, e
   é a ação **destrutiva** da tela;
4. 4 sombras Material.

Mesma decisão do onboarding: a casca é compartilhada por `CreateModal`,
`EditModal` e `TaskEditModal`, e refatorar uma casca compartilhada no fim da
sessão é risco sem verificação. **Diagnóstico registrado, conserto na rodada 4.**

### Os outros dois buracos seguem abertos

Relatório diário / modal de desbloqueio, e Evolução refotografada.

---

## 10. Autocrítica

- **A métrica nova quase reprovou a peça certa.** A primeira versão subia 4
  níveis de ancestral e acusava as 9 linhas do painel de rituais — a melhor
  peça do app. Métrica que reprova o que é bom está errada. A correção (subir
  toda a árvore, ignorando containers de página inteira) é o que a torna
  reutilizável; do jeito anterior ela media profundidade de DOM, não desenho.
- **Repeti o erro que a rodada 2 documentou.** `--sm-px-ink` no rótulo da nav
  é literalmente o defeito do `.sm-px-dark-ctx`: token certo, contexto errado.
  Está escrito no `align-round2.md`, eu tinha lido, e mesmo assim escrevi. Não
  foi revisão que pegou — foi o screenshot no tema claro. **O T5 (falha
  automática sem screenshot nos dois temas) é o portão que mais paga.**
- **Corrigi um diagnóstico da crítica.** O B4 não era z-index; era falta de
  placa. Se eu tivesse aplicado a receita ("z-index abaixo") sem olhar, teria
  mexido em `z-index` e o texto continuaria ilegível.
- **A crítica errou o veredito do Dino, e o método explica por quê.** T1 a
  partir da lista de um hub não vê estado. Proposta de portão: **telas com
  máquina de estado precisam de um screenshot por estado**.
- **O que eu não fiz e alguém vai cobrar:** P4 (o vazio de 600–1000px no fim
  de Loja, Torneio, Masmorra e da arena do PPT) segue intocado, e agora é o
  defeito de composição mais visível que sobra. O PPT tem ~1200px de arena
  vazia com um pet de 60px no meio — os controles estão alcançáveis (B2 fechado)
  mas a proporção está errada. É trabalho de **layout de conteúdo**, não de
  moldura, e merece uma rodada com critério próprio: densidade sem contrapartida
  de vazio premia empilhar, como a própria §5 apontou no T4.

---

## 11. Onde eu diria para parar agora

- **Home fora do painel: encerrada.** Métrica em 0, seis grupos soltos em 0,
  emoji em 0. O que sobra é composição (o vão entre o palco e a fileira de
  ações), não moldura.
- **Configurações: encerrada.** Os cinco inventários do T2 passam.
- **Nav: encerrada.** Rótulo cabe medido, seleção segue a regra da rodada 2,
  `aria-current` correto.
- **Minijogos: encerrados para moldura**, abertos para P4 (proporção).
- **Loja, Biblioteca, Torneio escuro, detalhe de jogador, painel de rituais:**
  seguem parados, como a crítica mandou. Não toquei em nenhum.

## 12. Ordem sugerida para a rodada 4

**Onboarding (o maior gap do app agora, e o único que 100% dos usuários veem)
→ casca compartilhada dos modais de tarefa (incluindo o "Excluir" sem alvo)
→ P4 (proporção/vazio) → refotografar Evolução e o relatório diário.**

---

### Artefatos

- Screenshots antes: `E:\pw\shots\r3-antes-*` (2 temas × 10 telas)
- Screenshots depois: `E:\pw\shots\r3-final-*` (2 temas × 13 telas + 5 passos
  de onboarding)
- Harness e métricas: `E:\pw\round3.mjs` (moldura, oclusão, T2),
  `E:\pw\navmeasure.mjs` (largura de rótulo), `E:\pw\contrast3.mjs` (contraste)

> **Ressalva de instrumento:** `contrast3.mjs` reporta 1,62 para
> `.sm-px-chip-label` — é **bug do medidor, não da UI**. O Chromium devolve
> aquela cor no formato `color(srgb 0.52 0.95 0.90)` e o parser do script lê
> só os três primeiros números como se fossem 0–255. A cor real é
> rgb(133, 244, 232) sobre rgb(16, 55, 58), ≈ 11:1. Todos os outros pares
> medidos passam AA com folga: rótulo da nav ativo **12,08** (escuro) /
> **11,72** (claro), inativo **5,27** / **5,19**, rótulo de ação **11,56**.

### B6 — refotografado, como o dono mandou

`nest-base.png` e os sprites estão limpos nos screenshots novos: não há nuvem
quadriculada em volta do bicho em nenhum dos dois temas. **A correção do
orquestrador se confirma no pixel — B6 não existe.** Ver
`r3-final-dark-home.png` e `r3-final-light-home.png`.
