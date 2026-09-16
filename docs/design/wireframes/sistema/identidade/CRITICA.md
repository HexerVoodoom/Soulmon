# CRÍTICA — canvas "Sistema" (identidade, Fase 2) · `design-critic`

> Revisão BLOQUEANTE · 16/09/2026 · alvo: os 7 artboards `.dc.html` + `canvas.json` + `README.md` desta pasta.
> Método: hex recalculados do `src/index.css` (bloco ONDA 1) com fórmula WCAG 2.x, não lidos do
> artboard; estilos computados e caixas medidas no navegador servido em `localhost:8765`
> (`getComputedStyle`, `getBoundingClientRect`, `document.fonts`); assets abertos com Pillow
> (dimensão, bbox, contagem de cores); cruzado com `src/components/form/FormKit.tsx`,
> `src/components/pixel/PixelKit.tsx`, `pixel/VisorBar.tsx`, `BottomNav.tsx`, `04-IDENTIDADE-VISUAL.md`
> §1/§2.8/§4/§5/§6, `01-VISAO.md` §7 e `HANDOFF-IDENTIDADE.md` §4–§7.
> Não editei nenhum artboard.

## 0. Resumo

| Classe | Qtd | O que pesa |
|---|---|---|
| **fatal** | 2 | chip de seleção com alvo de 36px (a régua do §5 é ≥ 44) · fronteira de campo/chip a 1,3:1 (não-texto AA, 1.4.11) |
| **fixável** | 13 | canvas não reconcilia com os primitivos vetoriais que JÁ existem (`FormKit`), moldura 9-slice desenhada FORA do vidro, raio 8 fora da escala, 11px dentro do telefone, literais sem token (scrim, sombra, nav), P2 mal fundamentado (DPR), cobertura incompleta |
| **ruído** | 9 | semântica de artboard estático, copy de exemplo, especímenes "do que sai" dentro do telefone |

**Veredito: VOLTA.** Os dois fatais são de uma linha cada, mas são exatamente as duas réguas que o HANDOFF §5 lista como aceite — e este é o canvas que TODOS os outros 13 herdam. Entra na segunda rodada se os fatais e os fixáveis 1–4 forem resolvidos.

**O que está certo e não precisa de rodada** (para o lead não gastar tempo): os 14 pares de contraste de texto batem com o recálculo nos dois temas (menor: 4,80 `on-gold/gold-fill` claro; 6,30 `muted/surface-2` escuro) e os 8 pares que o artboard não listou mas usa também passam (tabela §1.2); Silkscreen só a 14px, caixa alta, e só dentro de `.screen`/`.seal` (11 ocorrências medidas); nenhum ícone em box (`.iconbtn` transparente, 48×48 medido); sublinhado ciano 3px na nav com halo; nav em Rubik 12/500 e células de 66×68; nenhum vermelho fora de "Delete account" (irreversível) e do HP crítico dentro do vidro (token `--sm2-viewport-danger`, calibrado para isso); nenhum token novo declarado sem `[pendente do dono]`; tese do Visor desenhada com o corpo/anel/vidro medidos iguais ao `.sm2-device`/`.sm2-viewport` do CSS (3px + 16px + 4px, raio 20/12, um reflexo, vinheta 12%); pé do sprite a 75,8% da tela contra `GROUND_Y` 74% — dentro do erro do bbox da arte.

---

## 1. AA por token — recálculo

### 1.1 Os 14 pares do artboard (Main / MainClaro)

Todos conferem ao centésimo. Escuro: 16,15 · 13,59 · 7,43 · 6,30 · 13,21 · 11,12 · 12,38 · 8,16 · 8,84 · 7,35 · 6,73 · 8,98 · 16,82 · 8,33. Claro: 14,96 · 16,23 · 5,80 · 5,09 · 5,55 · 6,02 · 6,02 · 8,78 · 5,87 · 4,80 · 6,54 · 6,55 · 14,53 · 7,20. Todos ≥ 4,5. **Passa.**

### 1.2 Pares que o canvas USA e não listou (calculados)

| Par | Onde | Escuro | Claro | |
|---|---|---|---|---|
| `gold-ink` / `surface-2` | `.chip.tag.gold` ("rest day used") | 7,49 | 5,15 | ✓ |
| `credit-ink` / `surface-2` | `.chip.tag` "💎 paid" | 6,41 | 6,23 | ✓ |
| `primary-ink` / `primary-soft` (composto sobre surface) | chip selecionado, ghost/secondary pressionado | 7,69 | 5,21 | ✓ |
| `muted` / `bg` | rótulo de nav inativo se a nav ficar sobre `bg` | 8,83 | 5,35 | ✓ |
| `gold-ink` / `bg` | ícone 48 do erro, se o card sair | 10,51 | 5,41 | ✓ |
| `on-danger` / `danger-fill` | "Delete account" | 7,50 | 6,54 | ✓ |
| `gold-fill` / `surface` (não-texto, ponto "há algo novo") | FolhaNav | 6,60 | 4,80 | ✓ (≥3) |
| `viewport-ring` / `surface` (não-texto, borda do corpo) | Visor | 4,98 | 3,97 | ✓ (≥3) |

Recomendo acrescentar os 3 primeiros ao card "Contraste medido" — são os que uma tela real vai usar mais.

### 1.3 O que NÃO passa — não-texto (WCAG 1.4.11, é AA)

| Par | Escuro | Claro | Onde |
|---|---|---|---|
| `line` / `surface` | **1,32** | **1,25** | borda de `.inp` (campo), `.chip` não selecionado, trilho do `.switch` desligado, `.sheet` |
| `line` / `surface-2` | 1,12 | 1,09 | borda do botão primário desativado (isento: disabled) |
| `surface-2` / `surface` | 1,45 | 1,16 | trilho do switch off, campo desativado (isento) |

`--sm2-line` é divisor: 1,3:1 é correto para divisor e errado para **fronteira de componente interativo**. Ver fatal F2.

---

## 2. Achados

### FATAL

**F1 · Chip de seleção com alvo de 36px** — `Cards.dc.html` (e `FolhaNav`, chips Apple/Bread/Chip). Medido: `.chip` min-height 36, altura computada 36×3. Régua: HANDOFF §5 "alvo ≥ 44px"; o próprio `FormKit.Chip` já tem `minHeight: 44`. O canvas REGRIDE um primitivo que está no ar. Padrão de mercado: Material 3 *filter chip* = 32dp visual com 48dp de alvo; iOS HIG 44pt. **Conserto:** manter 36 visual e envolver em alvo de 44 (o canvas já tem `.tap44` e usa no checkbox — usar no chip também), ou subir para 44 como o `FormKit`. Escrever a régua no rótulo do card: "36 visual · 44 de alvo".

**F2 · Campo e chip não selecionado são invisíveis sobre o card** — `Cards.dc.html` §Campo de texto (estado normal) e §Chip de seleção. Medido: `.inp` = `surface` sobre `.card` = `surface`, única fronteira = `line` 1px a **1,32:1** (escuro) / **1,25:1** (claro); idem `.chip` sem `.sel`. Screenshot confirma: o campo "Capture in one line…" lê como texto solto. Régua: WCAG 1.4.11 exige ≥ 3:1 para a fronteira que identifica o componente. O `FormKit.Field` e o `FormKit.Chip` de hoje usam `surface-2` de fundo (1,45:1 — também baixo, mas o preenchimento tonal soma ao contorno). **Conserto sem token novo:** fronteira de componente interativo em `--sm2-muted` 1px (7,43 / 5,80 — o checkbox já usa `muted` 2px e é o único que se vê no screenshot) OU o padrão M3 *filled* do `FormKit` (fundo `surface-2` + linha) com indicador de 2px em foco/aviso, que o canvas já desenha. Se o lead preferir uma linha mais leve que `muted`, é token novo: `--sm2-line-strong` `[pendente do dono]` — proposta `#4E7C75` escuro (3,23 / 3,83 sobre surface/bg) e `#6F8F89` claro (3,52 / 3,25), entra no `tokens.contrast.test.ts` como par não-texto ≥ 3.

### FIXÁVEL (ordem de alavancagem)

**X1 · O canvas ignora o `FormKit` — o kit VETORIAL que já está em produção — e não declara a divergência.** Os rodapés listam `.sm-px-*`, `.sm-btn`, `PixelKit`, mas nem uma linha sobre `src/components/form/FormKit.tsx`, que é o alvo real do `staff-frontend`. Diferenças medidas:

| Peça | `FormKit` (código) | Canvas | Achado |
|---|---|---|---|
| Botão: variantes | `primary` · `ghost` (surface + line 1px + ink) · `quiet` (sem borda, muted) | `primary` · `secondary` (outline 2px primary-ink) · `ghost` (primary-ink sem borda) | **nomes e desenhos não casam**; o "ghost" do código é o "secondary" do canvas com outra cor, e o "ghost" do canvas é o "quiet" do código com outra cor |
| Botão: métrica | minHeight 44, padding 10/16, **radius 10**, texto 14 | 48, 0/20, radius 12, texto 16 (sm: 44/14) | raio 10 não existe na escala 4/12/20 — o código está errado, o canvas certo; registrar |
| Chip selecionado | `primary-fill` + `on-primary` (sólido) | `primary-soft` + borda `primary-ink` (tonal, com `check`) | canvas segue M3 filter chip (tonal + check) — melhor, mas é troca de padrão e precisa ser dita |
| Campo | `surface-2` + line 1px + foco por `box-shadow` 2px; radius 10 | `surface` + line; foco troca borda 1→2 compensando padding; radius 12 | ver F2 |
| `ModalSheet` | scrim `rgba(4,18,20,.55)`, sem borda, sombra `SM2_SHADOW_SHEET`, fechar 44px ícone 24 `muted` | scrim `rgba(0,0,0,.45)`, borda `line` 1px, sombra própria, fechar 48px ícone `ink` | quatro literais divergentes, nenhum é token |

**Conserto:** rodapé de `Botoes`/`Cards`/`FolhaNav` ganha uma seção "`FormKit` hoje × canvas" com a tabela acima e a decisão por linha (canvas vence / código vence). Renomear as variantes do canvas para o vocabulário que vai para o código (proposta: `primary` / `outline` / `ghost`, e `quiet` = ghost em `muted` para "Not now"/"Skip"), porque `sm2Button('ghost')` já tem consumidores.

**X2 · Moldura 9-slice desenhada FORA do vidro** — `Visor.dc.html` §Placeholder/emblema/moldura: `.frame9` é `border-image` de um `div` que ENVOLVE o `.screen` — os 24px de cano/trepadeira ficam fora do retângulo `viewport-bg`, ou seja, PNG pixel na superfície do aparelho. A tese ("moldura" está na lista do que é DENTRO, no próprio texto de abertura do artboard) e o `README` ("veste o vidro") dizem o contrário. **Conserto:** a moldura é um overlay `position:absolute; inset:0` DENTRO do `.screen`, sob o `.glass`, com o anel de cobre continuando como fronteira externa. Mesma correção vale como spec para `hudArt.ts` quando ganhar consumidor.

**X3 · Raio 8px não existe** — `Visor.dc.html` (5 ocorrências: vidro do `forming`, os dois vidros do emblema) e `Estados.dc.html` (vidro do reduced-motion). Escala é 4/12/20 (`04` §4.3: "três degraus, e três é o número"). **Conserto:** 12 (é "a tela do visor" por definição) ou 4 se for miniatura em lista.

**X4 · Texto abaixo de 12px DENTRO do telefone** — `Main`/`MainClaro` (`.sw code`, `.hx`, `.rl`, `.pair` = 11px; `code` dos pares = 10px; `.tagd` = 10px) e `.note` = 11px em TODOS os 6 artboards (contadas 70× 11px e 42× 10px, parte no rodapé cinza, que é fora e não conta). Medido no navegador: 15 nós < 12px só no `Visor`. É anotação de spec, mas está renderizada dentro do `.phone`, três linhas abaixo do texto "PISO absoluto: nada abaixo de 12px". O recorte 200×200 do checkpoint pode cair em cima de um `.note`. **Conserto:** `.note`/`.sw`/`.pair` a 12px (cabem: o card de tokens ganha ~60px de altura), ou mover as notas para o rodapé cinza como as demais anotações.

**X5 · P2 está fundamentado num DPR que o próprio artboard não tem.** O `README` e o `Visor` dizem "0,5× = 128px (inteiro em DPR 2)". O artboard tem 390px de largura — é a classe iPhone 12–14, **DPR 3**: 128 CSS px × 3 = 384 px de dispositivo para 256 nativos = **1,5×, fracionário**. Em DPR 1 (desktop, onde a crítica mediu) é 0,5× = descarte de metade dos pixels com `pixelated`. O argumento só vale num DPR. Ver recomendação P2 em §4.

**X6 · `forming` a 0,375× e emblema a 0,5×** — `Visor.dc.html`. O artboard admite ("fracionário de propósito para caber") mas o vidro que o mostra é o único lugar do app onde a regra "escala INTEIRA" é contratual (`ViewportProps.scale: 2 | 3`). Emblema 64² a 32px com `pixelated` = joga fora 3 de cada 4 pixels. **Conserto:** `forming` na MESMA escala do sprite (é o substituto dele); emblema em lista a 1× (64) ou arte 32² própria — nunca meia escala.

**X7 · Literais que deveriam ser token ou constante do kit** — scrim `.45` (FolhaNav), sombra da folha `0 -8px 24px rgba(0,0,0,.25)`, nav 68px, `.lab` (Fredoka 12 caixa alta com tracking .08em — um papel tipográfico que a escala não tem: `04` §4 dá Fredoka a título 20/24/32). Nenhum é `--sm2-*` e nenhum leva `[pendente do dono]`. **Conserto:** scrim e sombra viram referência a `SM2_SHADOW_SHEET`/valor do `ModalSheet` (ou propostos como token com o tag); `.lab` vira Rubik 12/500 caixa alta (é rótulo, não título) ou declara-se "Fredoka 12 · rótulo de seção" na escala com o tag.

**X8 · Grid de 4 não é seguido pelo próprio canvas** — contagem nos 7 artboards: `gap:6px` 45×, `gap:10px` 11×, `gap:14px` 2×, `gap:2px` 7×, `padding:0 14px`, `padding:0 11px` (compensação de borda, ok). O card "Espaço — grid de 4" propõe 4/8/12/16/24/32 e o artboard ao lado usa 6 e 10. Ver P1 em §4. **Conserto:** ou o canvas encaixa (6→8, 10→12, 14→16) ou a proposta ganha o meio-passo declarado.

**X9 · Cobertura incompleta contra a API que o `staff-frontend` vai reimplementar** — tabela em §3. Faltam: **tabs** (`PixelTabs`, Loja/Estatísticas), **medidor vetor fora do visor** (`PixelMeter`/`PixelSegmentedBar` — evolução, constância, meta do dia; é a peça mais sensível à linha vermelha "medidor vazio acusando" e não está desenhada), **slot** (`PixelSlot`: item da pastinha/loja com `locked` + overlay), **chip de estatística** (`PixelChip` label+valor: Bits/Emblemas no cabeçalho), **segmento/radiogroup** (`FormKit.Segment`), **diálogo de confirmação** (o botão "Delete account" existe, o diálogo que o cerca não), **toast** (o canvas critica o toast genérico e não desenha o substituto), **cabeçalho de página com voltar** (todo wireframe tem), chip `shape:'day'` (dias da semana), campo `date`/`time`. Estados faltantes nos que existem: chip selecionado+desativado, botão em progresso ("Feeding…" sem spinner), linha de lista pressionada. **Conserto:** um 8º artboard `Dados.dc.html` (medidor, tabs, slot, stat-chip, cabeçalho) + diálogo/toast no `Estados`.

**X10 · "moved 3×" em `gold-ink`** — `Cards.dc.html`, linha "Write the report". O próprio canvas define `gold-ink` como "atenção que convida". Um contador em cor de atenção é o adiamento virando placa; a regra do motor (`CLAUDE.md`, 🕒 Adiamentos) é contador VISÍVEL (Sunsama) e o convite vem do PET em `POSTPONE_NUDGE_AT`, não da cor. **Conserto:** `muted`; âmbar só no convite. Encaminhar ao `soulmon-guarda-linha-vermelha` (pergunta 4: "expõe um número que desce?" — não desce, mas acusa).

**X11 · Foco do botão primário na mesma cor do fill** — `Botoes.dc.html`: `.focus` = outline 2px `primary-ink` sobre `.btn.pri` = `primary-fill` (1,00:1 entre anel e botão). O que salva é o `outline-offset: 3` (a fresta de `bg` entre os dois — 13,2/5,55). Funciona, mas é frágil: sobre `surface` no claro a fresta é branca e o anel #0B6F68 fica a 6:1 — ok; em cima de `primary-soft` (chip selecionado com foco) o anel vira borda-da-borda. **Conserto:** declarar a regra "anel sempre com fresta ≥ 2px de fundo" no card de foco, e no chip selecionado usar `outline-offset: 2`.

**X12 · Fontes por `@import` do Google** — todos os artboards. O `04` §4.1 e o `index.css` dizem self-host como REGRA (SW ignora cross-origin). É só o canvas, mas o `@import` pede Silkscreen 700 e Material com 4 eixos completos — e o artboard renderiza com a fonte do Google se o `@font-face` local falhar, mascarando um subset quebrado. **Conserto:** tirar o `@import` (o `README` já manda servir da raiz) ou deixá-lo DEPOIS dos `@font-face` locais e só com as faces que o app tem.

**X13 · `canvas.json`: alturas declaradas ≠ conteúdo** — `Main` 3960 × `MainClaro` 3978 (o mesmo artboard, 18px de diferença — indica que o claro reflui diferente, provavelmente o `.hx` de duas linhas); as demais alturas não foram medidas contra o DOM. **Conserto:** medir `scrollHeight` do `.ab` e gravar; MainClaro deve ter a mesma altura do Main.

### RUÍDO (registrar, não bloquear)

**R1** · Nav com `role="button"` + `aria-current="page"` — artboard estático; o `BottomNav.tsx` real já faz isso. Ok.
**R2** · "Habit · 2 of 8 today" — copy de exemplo sem regra correspondente (2 de 8 o quê?).
**R3** · Folha "Feed" lista **Chip** ao lado de Apple/Bread sob "3 of 6 this hour" — chips de atributo NÃO contam no teto de comida (`CLAUDE.md` 🍎). Exemplo contradiz regra; trocar por outro alimento. E o padrão do produto para a recusa é o PET falar que está cheio, não um contador — fica para o canvas da Home decidir.
**R4** · "Companion · lvl 2" no corpo do aparelho — o app não tem nível de companheiro exposto (`bondLevelFor` é derivado e a UI não chama "lvl"). Copy de exemplo.
**R5** · Silkscreen 12 riscada ("ATIVIDADES") e `SYNC` em `.pix` dentro de `.note` — especímenes "do que sai" renderizados DENTRO do telefone. Mover para o rodapé cinza.
**R6** · `.i18` (ícone 18px no checkbox) — fora da escala 20/24/32/48, mas está na allowlist do `iconScale.contract.test.ts` (3× 18). Declarar "18 · dentro de checkbox 24" na escala do Main.
**R7** · Mini-HUD `VisorBar` desenhada a 2× (192×16) enquanto `VisorBar.tsx` desenha a 1× (96×8) e deixa o `Viewport` escalar — coerente, mas o artboard diz "ambos a 2×" sem dizer que é o `scale` do Viewport. Uma frase.
**R8** · HP "0.5" em `viewport-danger` dentro do vidro — token existe para isso (`index.css`, nota de 28/08). Guarda deve dar o parecer (é leitura de estado, não cobrança; o canvas acerta ao não pôr texto junto).
**R9** · `.chip.tag` a 24px "não clicável" — correto que não precise de 44; garantir que nunca vire clicável sem virar chip de seleção.

---

## 3. Cobertura — canvas × `PixelKit` (API a reimplementar) × `FormKit` (vetor que já existe)

| Peça | `PixelKit` | `FormKit` | Canvas | Estado |
|---|---|---|---|---|
| Botão 3 variantes × normal/pressed/disabled/foco | `PixelButton` (default/primary, sm/md/lg) | `sm2Button` (primary/ghost/quiet) | `Botoes` | ✓ desenhado · **X1** nomes não casam |
| Botão de ícone 48 pelado | — | fechar do `ModalSheet` (44) | `Botoes`, `Visor` | ✓ |
| Painel/card (título, ícone de título) | `PixelPanel` | — | `Cards` | ✓ card · ✗ variante com título+ícone |
| Chip de seleção | `PixelChoiceChip` (+ `shape:'day'`) | `Chip` | `Cards` | ✓ · **F1** alvo · ✗ `day` |
| Tag | `PixelTag` (filled) | — | `Cards` | ✓ |
| Checkbox 24 em alvo 44 | `PixelCheckbox` | `CheckRow` | `Cards` | ✓ |
| Switch | `PixelSwitch` | — | `Cards` | ✓ (declarar que a LINHA inteira é o alvo) |
| Tabs | `PixelTabs` | — | — | **✗ falta** |
| Medidor (ratio) fora do visor | `PixelMeter`, `PixelSegmentedBar` | — | — | **✗ falta** (só a `VisorBar` pixel, dentro) |
| Slot (pastinha/loja, `locked`, overlay) | `PixelSlot` | — | — | **✗ falta** |
| Chip de estatística (label + valor) | `PixelChip` | — | — | **✗ falta** (moedas só como tipografia) |
| Campo | — | `Field` | `Cards` | ✓ · **F2** · ✗ `date`/`time` |
| Segmento (radiogroup) | — | `Segment` | — | **✗ falta** |
| Folha | (9-slice em consumidores) | `ModalSheet` | `FolhaNav` | ✓ · **X1** literais |
| Nav | — | — (`BottomNav.tsx`) | `FolhaNav` | ✓ |
| Visor + HUD + placeholder + emblema + moldura | `VisorBar`, `hudArt` | `Viewport` | `Visor` | ✓ · **X2/X5/X6** |
| Estados: skeleton/vazio/erro/offline/reduced | `ScreenSkeleton`, `OfflineSeal` | — | `Estados` | ✓ · ✗ toast · ✗ diálogo |
| Cabeçalho de página (título + voltar) | — | — | — | **✗ falta** |

---

## 4. `[pendente do dono]` — recomendação fundamentada

**P1 · Tokens de espaço.** Recomendo **aprovar** `--sm2-space-1..6` = 4/8/12/16/24/32, invariante de tema, no bloco `:root` junto de raio/duração, com trava no `tokens.contrast.test.ts` (bloco invariante, como `--sm2-radius-*`). Dois complementos que o próprio canvas prova serem necessários (X8): (a) **um meio-passo declarado**, `--sm2-space-half` = 2px, restrito a "ícone ↔ rótulo na mesma linha" (nav usa `gap:2`, chip usa 6 = 4+2) — Material usa a grade de 4dp com 8dp de gap padrão e admite 2dp só em métrica interna de componente; sem o meio-passo declarado, os 45 `gap:6px` do canvas viram 45 literais no código; (b) **o canvas encaixa no grid antes de entrar** (6→8 nos chips, 10→12 nas linhas de lista, 14→16 no `sm`), senão a régua nasce já violada pelo artefato que a propõe.

**P2 · Escala do sprite no visor.** Recomendo a **(b) — arte na grade lógica, não o visor na arte**, com uma correção de número: **64² nativo**, `Viewport width=64 scale=2|3` como o tipo já trava → 128/192 CSS px, e **inteiro em TODO DPR** (DPR 2 × 2 = 4, DPR 3 × 3 = 9; hoje 256→128 dá 1,5× em DPR 3, que é o aparelho do artboard — X5). Motivos: (1) "escala inteira" só significa algo quando a arte TEM grade lógica — `igni-rookie.png` tem 256², **3.377 cores distintas** e granularidade de 1px (medido com Pillow), ou seja, é ilustração em alta resolução com cara de pixel, não pixel art; qualquer redução é reamostragem, não escala; (2) a tese vende "PIXEL × Vetor" lado a lado (último card do `Visor`) — o contraste só existe se o pixel for LEGÍVEL como pixel, e a 0,5× de uma arte de 1px ele deixa de ser; Tamagotchi/Vital Bracelet trabalham em 16–48px lógicos justamente por isso; (3) `forming`, emblemas (64²) e a HUD (96×8, 6×6) já estão na grade de 1×/2× — o sprite é a única peça fora dela. Custo: é trabalho da `squad-arte` (regenerar ou reduzir as 6 linhas × estágios para 64², e não por `nearest` sobre a arte atual — isso destrói o traço); até lá, 256→128 fica como **transição declarada**, e o `README`/`Visor` param de afirmar "inteiro em DPR 2". Se a `arte-criatura` provar que 64² perde a identidade das linhas, o fallback é **128² nativo** com `scale` passando a aceitar `1` — mas aí o tipo `2 | 3` muda, e a decisão volta ao dono.

**P3 · Ícone da nav 32 × 36.** Recomendo **manter 32 e corrigir o `CLAUDE.md`**. A precedência escrita no próprio `CLAUDE.md` é "código > teste > CLAUDE.md"; a escala viva é `tokens.md` §6.1, travada por `iconScale.contract.test.ts`, e `grep size={36}` devolve 0 desde 09/09/2026 (`04` §5.3). Geometria confirma: célula 66×68 medida; 32 (ícone) + 2 + 12×1,45 (rótulo) = 51px, folga de 17; com 36 a folga cai para 13 e o rótulo "Evolution" encosta no sublinhado de 3px. E o número do `CLAUDE.md` (36/42/30) já está desatualizado em três (42 do deck virou 24 por decisão do dono em 27/08). O que o dono decide é só autorizar a edição do `CLAUDE.md` — a regra "ícone grande e pelado" não muda.

---

## 5. Veredito

**VOLTA.** Condições para "entra" na próxima rodada: F1, F2, X1, X2, X3, X4 resolvidos; X5/X6 reescritos conforme a decisão P2; X9 pelo menos com o medidor vetor e as tabs (são as peças que Loja, Evolução e Estatísticas — os próximos canvases — não conseguem desenhar sem). O resto pode entrar como lista para o `staff-frontend`.

Maior alavanca única: **X1** — reconciliar com o `FormKit`. Sem isso o `staff-frontend` recebe dois vocabulários de botão para o mesmo produto, e o canvas "Sistema" deixa de ser o sistema.

Encaminhar ao `soulmon-guarda-linha-vermelha`: X10 (contador em âmbar), R3 (contador de comida na folha), R8 (HP crítico em vermelho dentro do vidro).
