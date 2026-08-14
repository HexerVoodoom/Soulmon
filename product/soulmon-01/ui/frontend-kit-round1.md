# Soulmon — Kit pixel, rodada 1 (aplicação da UI das referências)

> Escopo: criar os **primitivos** do kit e ligá-los aos alvos de maior uso.
> Nada de arte nova — o kit já existia solto no bundle; o trabalho foi **ligar**.
> Nada de `functions/`, `workers/`, `desktop/`, `android/` foi tocado.
> **Não commitei e não dei push.** Nenhum teste foi afrouxado.

---

## 1. O que foi criado

### `src/components/pixel/PixelKit.tsx` — os primitivos

| Primitivo | API | Onde já é usado |
|---|---|---|
| `PixelButton` | `{ children, onClick?, size?: 'sm'\|'md'\|'lg', variant?: 'default'\|'primary', disabled?, icon?: string, type?, title?, ariaLabel?, style? }` | ItemsWindow (Cancelar/Usar), estado vazio de atividades (App), botão Evoluir (CompanionHUD) |
| `PixelPanel` | `{ children, title?, titleIcon?, padded?: boolean, className?, style? }` | TaskCard, ActivityCard, ItemsWindow |
| `PixelSegmentedBar` | `{ value, max, segments?, tone?: 'cyan'\|'red'\|'gold', height?, label?, style? }` | ActivityCard (etapas), HomeHud (energia) |
| `PixelCheckbox` | `{ checked, onToggle, disabled?, language?, labelPt?, labelEn? }` | TaskCard, ActivityCard |
| `PixelChip` | `{ label, value: ReactNode, icon?, title?, style? }` | HomeHud (Energia, Créditos) |

### `src/components/pixel/HomeHud.tsx`
Cabeçalho da Home da Ref C: marca `SOUL MON` com chama à esquerda + duas cápsulas
de cobre à direita. A de Créditos é um `<button>` que abre o `CreditsModal` — a
cápsula é ação, não enfeite.

### `src/index.css` — bloco `KIT PIXEL — primitivos (rodada 1)`, no fim do arquivo
Tokens (`--sm-px-ink/cyan/copper/track/panel-bg/chip-bg/red`) + as classes
`.sm-px-btn(-sm/-md/-lg/-primary)`, `.sm-px-panel(-body/-title)`, `.sm-px-bar(-seg/-seg-on)`,
`.sm-px-check(-box/-on)`, `.sm-px-chip(-label/-value)`.
**Todas as variantes estão em forma aninhada** (`&:hover`, `&:active`, `&:disabled`,
`&::before`) — a forma plana é invisível para `index.css.contract.test.ts`, como o
relatório do sweeper deixou registrado. Nenhuma regra anterior foi alterada; nada
do que a rodada de QA consertou foi desfeito (o `max-h-[80vh]` do AISettingsModal,
os 8 alvos de 44px e as variantes reescritas continuam intactos e verdes).

### `src/assets/soulmon/ui/btn-{sm,md,lg}.png` — 3 arquivos derivados
São `buttons/button-normal-{small,medium,large}.png` **recortados na bounding box
do alfa** (via `sharp`, determinístico). Não é arte nova: os originais têm margem
transparente irregular (17px, 21px, 11px) e `border-image` fatia o canvas inteiro
— margem dentro da fatia vira moldura fina com folga. Fatias medidas na arte
recortada: sm 82px, md 66px, lg 43px (espessura da moldura até o miolo teal).

---

## 2. Três decisões que precisam de aprovação (ou pelo menos de ciência)

**(a) Os PNGs `hover` e `active` do kit NÃO foram ligados.** Eles trazem um halo
**magenta/roxo assado na arte** — resíduo da paleta antiga, que o reskin de
ago/2026 substituiu por teal/cobre. Ligá-los reintroduziria roxo na UI, contra a
regra de "nenhuma cor fora dos tokens". Hover/active/disabled são derivados do
`normal` por filtro (`brightness` + `drop-shadow` ciano; `grayscale` no disabled),
dentro da paleta. O `disabled` PNG tem, além disso, enquadramento diferente dos
outros (bbox até a borda do canvas), o que quebraria a fatia. **Pedido ao
designer: regerar hover/active/disabled com halo ciano/cobre e o mesmo
enquadramento do `normal`.**

**(b) A barra segmentada é DOM, não o PNG.** `bar-hp-segmented-cyan.png` é uma
barra fixa de 9 blocos cheios: não sabe representar 2/4. A leitura visual é a
mesma (blocos discretos, trilho escuro, brilho ciano) e o valor é real.

**(c) "SOUL CRYSTAL" virou "CREDITS / CRÉDITOS".** A Ref C rotula a cápsula da
direita como SOUL CRYSTAL, e essa cápsula é a moeda de **dinheiro real**. Um
rótulo de fantasia sobre a moeda paga é exatamente o mecanismo do bug histórico
(Bits e Créditos com o mesmo ícone 💎, e o jogador sem como saber que o que pagou
não compra na loja). A cápsula usa o `icon-gem` — o mesmo ícone que o menu já usa
para Créditos, e só ele — e o nome real da moeda. **Bits não aparecem neste HUD**;
onde aparecem (página de Atividades) seguem sem ícone e em fonte de calculadora,
verificado em screenshot. `src/utils/currencies.test.ts` continua verde.

**Tema claro:** a arte de cobre é um objeto **escuro** por natureza. Resolvi assim:
o **botão** mantém o miolo teal da arte (`border-image: … fill`) nos dois temas —
é uma peça pequena, e o texto claro sobre teal profundo passa AA folgado. O
**painel** usa a mesma moldura **sem `fill`**, com o miolo no token de superfície
do tema: no claro o card continua branco com moldura de cobre; no escuro fica
`#10312f`. Assim o tema claro não vira um escuro mal contrastado. Verificado nos
dois temas (§4).

---

## 3. Telas aplicadas

| Alvo | O que mudou |
|---|---|
| **Home — HUD do topo** | Novo. Marca + cápsulas de Energia (com mini barra segmentada) e Créditos |
| **TaskCard** | `sm-card` arredondado → `PixelPanel` (moldura de cobre 9-slice); círculo → checkbox quadrado de cobre |
| **ActivityCard** | Idem; barra lisa de etapas → `PixelSegmentedBar` (um bloco por etapa) |
| **ItemsWindow** | Modal ganhou moldura de janela; Cancelar/Usar viraram `PixelButton` (o "Usar" é `primary`, miolo ciano) |
| **CompanionHUD** | Botão "Evoluir" → `PixelButton primary` (posição `left/transform` segue inline, footgun 1) |
| **App (estado vazio)** | "+ Nova atividade" → `PixelButton sm primary` |
| **BottomNav** | **Não mexi** — já consumia os ícones do kit e estava verde no QA |

Acessibilidade preservada/medida: `[role="checkbox"]` + `aria-checked` + par PT/EN
no `aria-label` continuam dentro do `PixelCheckbox`; alvos medidos em **44×44**;
botões pixel medidos em **48px de altura**; `PixelSegmentedBar` expõe
`role="progressbar"` com `aria-valuenow/min/max`. O `button:focus-visible` global
do `index.css` continua valendo (não criei regra concorrente).

---

## 4. Verificação visual (Playwright + Chromium em `E:/pw`, contra `vite preview` do build real)

Seed por `page.addInitScript` (nunca `evaluate` + `reload`). Viewport 412×880 @2x.
Scripts: `E:/pw/shot9.mjs` (dois temas) e `E:/pw/shot10.mjs` (interação).

**Antes** — screenshots da rodada anterior, tiradas do build **pré-kit** com o
mesmo seed base e a mesma viewport (`E:/pw/shot5.mjs`/`shot6.mjs`):

| Tela | Antes | Depois (claro) | Depois (escuro) |
|---|---|---|---|
| Home (topo) | `E:/pw/shots/60-home.png` | `E:/pw/shots/kit-light-10-home.png` | `E:/pw/shots/kit-dark-10-home.png` |
| Home (fichas) | `E:/pw/shots/50-home.png` | `E:/pw/shots/kit-light-11-home-cards.png` | `E:/pw/shots/kit-dark-11-home-cards.png` |
| ItemsWindow | `E:/pw/shots/80-itens.png` | `E:/pw/shots/kit-light-30-itens.png` + `kit-light-31-itens-detalhe.png` | `E:/pw/shots/kit-dark-30-itens.png` + `kit-dark-31-itens-detalhe.png` |
| Atividades | `E:/pw/shots/61-atividades.png` | `E:/pw/shots/kit-light-20-atividades.png` | `E:/pw/shots/kit-dark-20-atividades.png` |
| Interação (marcar tarefa/etapas) | — | — | `E:/pw/shots/kit-dark-40-interacao.png` |

**Ressalva honesta sobre o "antes":** o repo não é um repositório git aqui e o
`dist/` anterior foi sobrescrito pelo primeiro `npm run build` desta rodada, então
**não consegui gerar um "antes" novo com o seed exato desta rodada**. As imagens
"antes" acima são do build anterior de verdade (não são reconstrução), mas o seed
tinha 1 tarefa e 1 atividade sem etapas, contra 2 tarefas e 2 atividades agora.

**Medições feitas no DOM real** (não olhômetro):
- checkboxes de tarefa/atividade: **44×44** (3 ocorrências, nos dois temas);
- botões pixel: **118×48**, **85×48** (PT) / **100×48**, **74×48** (EN);
- painéis: `border-image-source` resolvido para `assets/btn-lg-*.png`, `border-width` **10px**,
  fundo `rgb(255,255,255)` no claro e `rgb(16,49,47)` no escuro — a prova de que o
  tema claro segue claro;
- barra segmentada após marcar 2 de 4 etapas: `sm-px-bar-seg-on` = **2**, total de blocos **8**
  (4 das etapas + 4 da cápsula de energia); contador textual "2/4" coerente.

**Um bug encontrado e corrigido pela verificação**, não por revisão: a variante
`primary` usava `box-shadow: inset` para o miolo ciano e **não aparecia** —
`border-image: … fill` pinta o centro depois do background e de qualquer sombra
interna. Virou um `&::before` sobre a caixa de padding, com o conteúdo subindo num
`<span>` com `z-index: 1`. Está no screenshot `kit-dark-31-itens-detalhe.png`
("USE" em tinta escura sobre ciano).

### O que ficou SEM verificação visual (digo explicitamente)
- **Botão "Evoluir"** (`CompanionHUD`) — depende de `canEvolve`, que eu não consigo
  semear sem forjar estado de regra de jogo. Foi o mesmo item não verificado da
  rodada anterior.
- **"+ Nova atividade" do estado vazio** — só aparece com ≥1 tarefa e 0 atividades
  disponíveis hoje; não cobri essa combinação.
- **Estados `:hover` e `:disabled` do PixelButton** — o filtro/dessaturação não foi
  fotografado; só o `default` e o `primary`.
- **Foco de teclado** — tirei `kit-dark-41-foco.png` depois de 3 `Tab`, mas **não
  confirmei em qual elemento o foco caiu**, então não conto como verificado.
- **Telas que não toquei** (Evolução, Loja, Torneio, Biblioteca, Configurações,
  minijogos, modais restantes) — não foram refotografadas nesta rodada.
- **Contraste medido com ferramenta** — não rodei medidor de contraste; a
  afirmação de AA para o texto claro sobre teal profundo é por leitura dos tokens,
  não por medição.

---

## 5. Portões (números reais, rodados agora)

| Portão | Comando | Resultado |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | **exit 0, limpo** |
| Testes | `npx vitest run` | **29 arquivos · 413 testes · 413 passam · 0 falham** (mesmo número da rodada do sweeper). `index.css.contract.test.ts` e `currencies.test.ts` verdes |
| Build | `npm run build` | **✓ built in 3.33s**, **112/112** PNG→WebP (−7,08 MB), worker compilado |
| Bundle | — | `index-*.css` **83,09 kB** (gzip **15,51**) — era 79,02 / 14,68: **+4,07 kB / +0,83 kB gzip**. `index-*.js` **388,75 kB** (gzip 129,08) — era 386,54 / 128,01: **+2,21 kB / +1,07 kB**. `vendor` 141,72 kB inalterado. Os 3 PNGs recortados somam ~40 kB antes do WebP |

---

## 6. O que falta para bater a Ref C (priorizado)

1. **Fonte bitmap caixa-alta.** É o maior *delta* que sobra: a moldura, a barra e a
   cápsula já são as da referência, a tipografia não. Sem isso a tela nunca "parece"
   a referência. Decisão pendente de licença (Press Start 2P / Silkscreen / m5x7).
2. **Regerar `hover`/`active`/`disabled`** dos botões sem o halo magenta/roxo e com
   o mesmo enquadramento do `normal` (§2a). Enquanto não vier, os estados são filtro.
3. **Árvore de evolução como grafo** (nós de cristal, linhas ciano, anel no nó
   atual, pet pousado). Precisa dos assets do item 5 da spec e é a metade esquerda
   da Ref C — a maior área ainda sem a linguagem nova.
4. **Card "DAILY RITUALS" com título de seção.** Hoje cada tarefa é um painel
   solto; a referência agrupa tudo num painel com barra de título. `PixelPanel` já
   aceita `title`/`titleIcon` — falta decidir se a Home agrupa ou mantém a lista.
5. **Ícones dos 3 atributos** (Poder / Harmonia / Benevolência) em 64×64 com alfa,
   para a página de Evolução e o card de atributos.
6. **Moldura modular de cano + vinha em peças 9-slice** — hoje a moldura de painel
   reaproveita o frame do botão large, que é limpo demais para a Ref A.
7. **Nav inferior com rótulo e item ativo em cápsula** (a Ref C mostra HOME /
   COMMUNITY / SHOP rotulados). Hoje é só ícone com halo.
8. **`nest-base.png` limpo** — sobrou resíduo atrás da fumaça, visível nos
   screenshots da Home (o berço tem um bloco de xadrez à esquerda do cristal).
   **Isso aparece em produção hoje**; é o defeito de arte mais visível das imagens
   desta rodada.
9. **Alvo de toque do `StepRow`: 40×40, abaixo dos 44 do WCAG 2.2 AA.** Medido nesta
   rodada, em 4 ocorrências. Ficou fora do escopo (o sweeper corrigiu outros 8
   botões, esse não estava na lista) — mas é regressão silenciosa esperando
   acontecer e deveria entrar na próxima.
