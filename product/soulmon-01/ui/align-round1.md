# Rodada de alinhamento 1 — G3′ (berço) · G1 (densidade) · G2 (ícones)

Worktree `E:\soulmon-ui-qa`, branch `claude/ui-qa`. Nada commitado, nada
enviado.

> **Correção de escopo aplicada no meio da rodada.** A instrução original era
> *esconder* o berço sujo (G3). O dono decidiu o contrário: o berço **fica**, o
> pet passa a ser **centrado dentro dele**, e a peça vira um **espaço nomeado**
> com a arte entrando por fora. O trabalho de esconder foi desfeito — não
> sobrou constante, flag nem teste do desligamento. A limpeza do xadrez de
> `nest-base.png` é do outro worktree; **não toquei no arquivo**.

---

## 1. O que mudou

### G3′ — o pet está NO berço, e o berço virou um slot

**O defeito era mudo.** O `<img>` do berço tinha `transform: translateX(-50%)`
e o `<div>` do pet **não** — o pet nascia com a borda esquerda no eixo dos 50 %,
ou seja, **62 px à direita** do berço. Nada quebrava, nada avisava: eram duas
imagens sobrepostas por acaso, exatamente como o dono descreveu.

- `src/components/CompanionHUD.tsx` — o sprite ganhou
  `translateX(-50%)` **antes** do `scaleX(±1)` do espelhamento (a ordem
  importa: depois, virar para a esquerda joga o pet para fora do berço).
- `src/utils/petStage.ts` — novo conceito **`BaseSlotId`** (`'nest'`) +
  `BASE_SLOTS`, com a caixa do berço (148 × 83) e as duas origens verticais
  (`PET_TOP_OFFSET`, `PET_BOX`) declaradas em um lugar só.
- `src/components/nestArt.ts` (**novo**) — a **fronteira de troca**:
  `NEST_ART: Record<NestId, string>` + `DEFAULT_NEST`. É o único arquivo que
  sabe *com que PNG* o espaço é desenhado, no mesmo contrato do
  `components/evolution/nodeArt.tsx`. `CompanionHUD` não importa mais PNG
  nenhum nem número mágico.
- `docs/PALCO-E-DECORACAO.md` — seção nova documentando o espaço.

**Sobre reaproveitar um slot existente (a pergunta do briefing): não dá, e o
motivo é regra de produto.** Os cinco `SlotId` são o catálogo do jogador — a
loja vende para eles, `equippedDecor` os grava no save, e há teste exigindo que
**todo** `SlotId` tenha ao menos um item à venda. O berço não é comprado nem
equipado. Pôr o berço no `rug` roubaria do jogador o espaço do tapete que ele
comprou; criar `'nest'` dentro de `SlotId` quebraria o teste do catálogo. Por
isso ele é um espaço **irmão**, com o mesmo contrato que importa (caixa fixa em
px + arte por fora) e sem entrar no catálogo.

> ⚠️ **Achado que atrapalha a próxima rodada: `GROUND_Y` está defasado.** Os
> 74 % foram medidos quando o sprite do pet tinha **80 px**; hoje ele tem
> **152 px** e a renderização real não bate mais com a tabela do
> `PALCO-E-DECORACAO.md`. Consequência concreta: **as cinco decorações compradas
> e o pet não estão exatamente na mesma linha de chão.** Não refiz essa conta
> nesta rodada (mexer nela mexe em cenário, decoração, cocô e comida de uma vez);
> deixei o berço ancorado a uma origem própria, declarada, e registrei a
> pendência no doc.

### G1 — a composição da Home (a correção de maior alavancagem)

Era **um `PixelPanel` emoldurado por item**. Agora é **um painel titulado com
linhas de ~72 px**:

```
[ ícone 40 ] [ nome (trunca) / subtítulo · barra segmentada ] [ 44×44 ]
```

- `src/components/pixel/RitualPanel.tsx` (**novo**) — `RitualPanel` +
  `RitualRow` + `RitualIcon`. Todas as decisões estão no cabeçalho do arquivo.
- `src/index.css` — bloco novo **no fim**, `.sm-px-ritual*`, variantes
  **aninhadas** (`&:hover`, `&:focus-visible`), cor só de token. O guard
  `index.css.contract.test.ts` passa.
- `src/App.tsx` — a Home monta o painel; `TaskCard`/`ActivityCard` ficaram sem
  consumidor (a página "Atividades" é o hub de minijogos, não a lista) e foram
  **removidos** junto com seus testes de render, cujas garantias migraram para
  `RitualPanel.render.test.tsx`.
- **O FAB saiu da Home.** Ele flutuava sobre a lista e, em 412 × 915, cobria
  exatamente a última linha visível — o controle de criar tapava o conteúdo que
  ele cria. O CTA largo no fim do painel é o que a referência tem. A regra
  `.sm-px-fab` ficou no CSS sem consumidor (peça de kit).

Onde a **referência não foi seguida**, conforme §4 da análise:

- **N1 — coluna única.** Duas colunas em 412 px viram duas de ~190 px. O alvo é
  a densidade, não a geometria. Nem o breakpoint de 768 px foi feito: seria
  código sem tela para provar.
- **N3 — dimensionado pelo PT-BR.** `RITUAIS DIÁRIOS` é ~25 % mais longo que
  `DAILY RITUALS`, e o nome do item é escrito pelo usuário sem limite. O nome
  **trunca em uma linha com `…` e carrega `title`** com o texto inteiro, e a
  altura da linha **não depende** do texto caber. Provado no seed com um nome de
  45 caracteres (`Organizar a manhã inteira antes das nove horas`).
- **N2 — nome do item em sans, não em bitmap.** Silkscreen fica nos rótulos
  (título do painel, contador, CTA).

Duas decisões que mudaram a interação e merecem contestação se alguém discordar:

1. **A coluna de texto é o botão de EDITAR.** Em 412 px não sobra largura para
   ícone + texto + editar + concluir. `aria-label` é `"Editar: <nome>"`, o alvo
   tem ≥44 px de altura e `:focus-visible` medido a 3 px sólidos.
2. **Etapas nascem recolhidas.** A atividade de 4 etapas media **441 px** e
   ficava inteira abaixo da dobra; hoje mede **79 px** e a barra segmentada diz
   `2/4` de relance. O expansor (`aria-expanded`) ocupa a casa do checkbox, que
   essas atividades não têm.

### G2 — ícones ligados, emoji fora

- Cada linha usa `categoryIconImg` (os 8 ícones de categoria do kit) e o painel
  usa `icon-target.png` no cabeçalho.
- **Fallback = quadro de cobre vazio, nunca emoji.** A casa de 40 px é
  desenhada sempre — com arte ou sem — e é ela que alinha a coluna de texto
  entre linhas. Antes, item sem categoria caía no emoji do sistema; medido no
  "antes", o `🗒️` aparecia colorido ao lado da moldura pixelada.
- Emojis do sistema no conteúdo da Home: **1 → 0** (medido no DOM, nos dois
  temas).

---

## 2. Antes/depois — caminhos dos screenshots

Todos em 412 × 915, `deviceScaleFactor: 2`, PT-BR, **nos dois temas**. O
"antes" foi capturado do **estado commitado** (`git stash` → servir o `dist/`
de HEAD), não de screenshots antigos.

| | escuro | claro |
|---|---|---|
| **Antes** | `E:\pw\shots\antes-dark-home.png` | `E:\pw\shots\antes-light-home.png` |
| **Depois** | `E:\pw\shots\depois-dark-home.png` | `E:\pw\shots\depois-light-home.png` |
| Depois, rolado | `E:\pw\shots\depois-dark-home-scroll.png` | `E:\pw\shots\depois-light-home-scroll.png` |
| Etapas abertas | `E:\pw\shots\depois-dark-etapas-abertas.png` | `E:\pw\shots\depois-light-etapas-abertas.png` |
| Foco de teclado na linha | `E:\pw\shots\depois-dark-foco-linha.png` | `E:\pw\shots\depois-light-foco-linha.png` |

Roteiros: `E:\pw\round1.mjs` (antes/depois + T2/T4), `E:\pw\t4antes.mjs`
(T4 na marcação antiga), `E:\pw\verif.mjs` (composição, foco, contraste).

> **Armadilha que quase falsificou a rodada, anotada para a próxima:** as portas
> 4173–4179 estavam ocupadas por outros `vite preview` (outro worktree), e o
> `sw.js` do app cacheia `dist/` por `CACHE_VERSION`. As duas coisas juntas
> serviam o **build anterior** com cara de build novo. O roteiro agora usa
> `serviceWorkers: 'block'` e a URL entra por `SOULMON_URL`.

---

## 3. T4 — densidade acima da dobra (a medida pedida)

Unidade de ação primária = linha/ficha de tarefa ou atividade. A dobra efetiva
**não** é 915: o dock de chat começa em **771 px**, e o que está debaixo dele
não conta.

| | unidades acima da dobra |
|---|---|
| Referência (§6) | ≈ 3 + CTA |
| **Meta** | **≥ 3** |
| Análise de gap (build antigo) | 1,5 |
| **Antes (HEAD commitado, medido agora)** | **3,82** (3 inteiras + 0,82) |
| **Depois** | **5,00** (5 inteiras) — idêntico nos dois temas |

**T4 passa.** Duas honestidades sobre o número:

- o "1,5" da análise saiu de um build anterior ao commit atual; medido contra o
  HEAD real, o ponto de partida já era 3,82. O ganho desta rodada é **3,82 → 5**,
  não 1,5 → 5;
- o ganho maior não está no número e sim no que ele esconde: a atividade com
  etapas caiu de **441 px para 79 px**, e as linhas passaram de 92–132 px para
  **72–79 px**.

Outras medidas do §6 verificadas de passagem:

- **T2** — famílias tipográficas na Home: **2** (`ui-sans-serif` + `Silkscreen`)
  · emojis do sistema no conteúdo: **0** (era 1) · controles círculo/pílula na
  Home: **0** (o FAB saiu) · checkboxes: **44×44**, `role="checkbox"`,
  `aria-checked`.
- **T5** — contraste medido sobre o painel, nos dois temas: nome **12,54:1**
  (escuro) / **14,44:1** (claro) · subtítulo **5,95** / **5,19** · título do
  painel **7,51** / **5,47**. Nada abaixo de 4,5:1; nada inverteu entre temas.
  `:focus-visible` presente (3 px sólidos de cobre) e caindo no controle certo.

---

## 4. Portões (números reais)

| | resultado |
|---|---|
| `npx tsc --noEmit` | **0 erros** |
| `npx vitest run` | **60 arquivos · 825 passando · 1 pulado** |
| `npm run build` | **ok** — `vite build` + 115 PNG→WebP + worker compilado |

Sobre a contagem de testes: a baseline citada era 829. Saíram **10** casos com a
remoção de `TaskCard`/`ActivityCard` (sem consumidor) e entraram **16** novos em
`RitualPanel.render.test.tsx`, cobrindo o que os antigos travavam (44×44,
`role="checkbox"`) **mais** o que é novo e frágil: truncamento + `title`,
altura de linha independente do texto, quadro vazio sem emoji, etapas
recolhidas, estado vazio com CTA. `CompanionHUD.render.test.tsx` ganhou dois
casos travando a composição pet × berço — era o defeito mudo desta rodada.

Uma nota de ambiente: o `vitest` estourou heap uma vez com vários `vite preview`
pendurados em segundo plano. Matar os processos e repetir dá verde
determinístico; não é flakiness do suite.

---

## 5. O que ficou SEM verificação

- **Aparelho real / mid-tier.** Tudo foi medido em Chromium headless a
  `deviceScaleFactor: 2`. Não há número de LCP/INP/CLS nesta rodada.
- **Leitor de tela de verdade.** `role`, `aria-checked`, `aria-expanded` e
  `aria-label` estão medidos no DOM; ninguém rodou TalkBack/VoiceOver.
- **A decisão nº 1 (texto = editar) com usuário.** É a única mudança de
  interação desta rodada e é a que eu mais quero ver contestada. O risco é
  abrir o modal de edição sem querer; a mitigação é o checkbox de 44 px ficar
  isolado na direita.
- **≥768 px.** A regra N1 diz "duas colunas só ≥768 px" e isso **não** foi
  feito. Em tablet a lista continua em coluna única, ocupando a largura toda.
- **`GROUND_Y` × decoração comprada.** Não medi o desalinho entre as cinco
  peças de decoração e o pet — só constatei que a conta do documento está
  defasada.
- **`nest-base.png` limpo.** Assumi que chegará limpo, como combinado. As
  medidas do berço (148 × 83) valem para o arquivo atual; se a arte limpa mudar
  a bbox, `BASE_SLOTS.nest` precisa ser reconferido.
- **T1 (teste dos 5 segundos) e T6 (cobertura de tela).** Fora do escopo desta
  rodada; T1 depende de outra pessoa e T6 depende do G4.

---

## 6. O que sobrou de G1 / G2 / G3

**G3′ — fechado no que era meu.** Pet centrado (desalinho horizontal medido:
**0 px**, era 62), berço é espaço nomeado com arte entrando por fora, doc
atualizado. Fica com o dono: a limpeza do xadrez do PNG.

**G1 — fechado.** Painel único, linha de 72 px, CTA largo, FAB aposentado,
T4 = 5. Resta o breakpoint ≥768 px (deliberadamente adiado).

**G2 — fechado na Home, aberto no resto.** Zero emoji de sistema na Home, com
fallback em quadro vazio. Continuam com emoji, e caem no **G4**: a loja
(`ShopModal`, catálogo inteiro em emoji), a pastinha de itens (`🍎`/`💗`/`🌀`),
`StatsPage` e os modais. Dos ~60 ícones do kit, os de `categories/` e um punhado
de avulsos estão ligados; `games/` só na nav.

### Duas coisas que encontrei e não corrigi (as duas são armadilha para quem vier)

1. **`PixelSegmentedBar` some em silêncio abaixo de 9 px de altura.**
   `.sm-px-bar` é `border-box` com 2 px de borda e 2 px de padding em cima e
   embaixo: com `height={6}` a altura interna fica **negativa** e os blocos
   acesos não aparecem — a barra continua no DOM, com o `aria-valuenow` certo, e
   não mostra nada. Contornei na linha (uso 14 px) e deixei a nota no JSX, mas
   **o primitivo continua aceitando uma altura que o apaga**. Vale um `Math.max`
   ou um teste no kit.

2. **`StepRow` é de outro design system.** Aberto, ele mostra pílulas
   `rounded-2xl` com preenchimento verde-claro no meio do painel de cobre — dá
   para ver em `depois-light-etapas-abertas.png`. É G5/G8, não G1, então não
   mexi; mas agora ele está **dentro** do painel principal, o que torna o
   desencontro mais visível do que era.
