# Canvas "Sistema" — identidade (Fase 2, primeiro canvas) · rodada 2

> Dono: `soulmon-visual-designer` · rodada 1 em 16/09/2026, **rodada 2 em 16/09/2026** após `CRITICA.md`
> (veredito VOLTA — F1, F2, X1–X13 resolvidos abaixo). HANDOFF-IDENTIDADE §2 decisão 2 ("sistema antes de tela").
> Não replica wireframe nenhum: é o SISTEMA aplicado. Os valores dos `--sm2-*` foram **copiados** do
> `src/index.css` (bloco ONDA 1) — nenhum token novo; o que falta está marcado `[pendente do dono]`.
> Escuro em todos os artboards; claro só no `Main` (decisão 3 do dono).

## Como abrir

Os `.dc.html` referenciam imagens e fontes por caminho relativo ao repo
(`../../../../../src/assets/…`, `../../../../../public/fonts/…`, Silkscreen de
`node_modules/@fontsource/silkscreen`). **Sem `@import` do Google** (X12): abra servindo a raiz do repo
(`python -m http.server 8765` em `repo/` → `http://localhost:8765/docs/design/wireframes/sistema/identidade/Main.dc.html`).
`_sim-*-64.png` são simulações por *nearest* só para a opção (b) do P2 — não são arte.
Os `.dc.html` e o `canvas.json` são commitados; o `.html` semeado que se publica não é.

## O que cada artboard prova

| Artboard | Id | Prova |
|---|---|---|
| `Main.dc.html` | SIS-01 | 27 tokens de cor (hex escuro **e** claro, papel), **17** pares de contraste calculados dos hex (os 14 originais + `gold-ink/surface-2`, `credit-ink/surface-2`, `muted/bg` — todos ≥ 4,5 nos dois temas), tipografia (Fredoka 32/24/20 · Rubik 16/14/12 · rótulo de seção Rubik 12/500 caixa alta · `tabular-nums` · mono Bits · serifa Emblemas · Silkscreen 14 só no vidro), ícones 20/24/32/48 (+18 só dentro de checkbox) com FILL 0→.5→1, raios 4/12/20 + pílula, grid de 4 **com meio-passo 2 declarado**, movimento 120/200/320/400 + `steps()`/reduced-motion. |
| `MainClaro.dc.html` | SIS-01 claro | O mesmo artboard sob `[data-theme=light]` — **mesma altura medida** (4262). |
| `Botoes.dc.html` | SIS-02 | `primary / outline / ghost / quiet` × normal / pressed / disabled / foco; sm 44 · md 48 · lg 56; em progresso; botão de ícone 48 pelado; regra do foco (anel com fresta ≥ 2px); danger só irreversível; atenção = cobre + convite. Rodapé com a tabela **FormKit hoje × canvas**. |
| `Cards.dc.html` | SIS-03 | card, lista (ícone Material, linha pressionada, contador de adiamento em `muted`), chip de seleção **44 de alvo** tonal (+ selecionado+desativado, `shape: day`), chip de etiqueta 24, campo **filled** (`surface-2` + `muted` 1px, anel 2px por box-shadow, aviso âmbar, `date`/`time`, desativado), switch (linha inteira é o alvo), checkbox 24/44, foco. Rodapé FormKit × canvas. |
| `Dados.dc.html` | SIS-07 (novo, X9) | cabeçalho de página (voltar 48 + Fredoka 24 + stat chips de moeda), tabs (44, sublinhado ciano), slot 64 (selecionado / `locked` / contador / vazio), medidor contínuo e segmentado **fora do visor** (nunca vermelho, nunca vazio acusando — constância nova nasce cheia), segmento (radiogroup, sólido como o `FormKit.Segment`), painel com título e ícone. |
| `FolhaNav.dc.html` | SIS-04 | `ModalSheet` com os literais do `FormKit` (scrim `rgba(4,18,20,.55)`, sem borda, `SM2_SHADOW_SHEET`, alça 36×4, fechar 44 ícone 24 `muted`) e `BottomNav` (ícone 32, Rubik 12/500, sublinhado ciano 3px, ponto cobre). Rodapé FormKit × canvas. |
| `Visor.dc.html` | SIS-05 | aparelho → anel → vidro com `bg-room`, sprite, `VisorBar` (1× no componente, 2× pelo `scale` do Viewport), **P2 com as duas opções lado a lado + nota do crítico (DPR 3 = 1,5×)**, `forming` na mesma escala do sprite, emblema só a 1×, moldura 9-slice como **overlay dentro do vidro** sob o reflexo, par PIXEL × Vetor. |
| `Estados.dc.html` | SIS-06 | skeleton, vazio, erro (âmbar, duas saídas), `OfflineSeal`, **diálogo de confirmação** (só irreversível; saída segura à esquerda com foco inicial), **toast** (sistema fala no toast, pet no balão; sem ação), reduced-motion. |

## Rodada 2 — achado → conserto

| Achado | Conserto |
|---|---|
| **F1** chip alvo 36 | `.chip` min-height **44** (= `FormKit.Chip`); rótulo do card diz "44 de alvo"; chips `day` com 44 de largura. |
| **F2** fronteira campo/chip 1,3:1 | Padrão **filled** do `FormKit`: fundo `surface-2` + fronteira **`--sm2-muted` 1px** (7,43 / 5,80 ≥ 3:1) em campo, chip não selecionado, trilho do switch off, botão outline, medidor, slot, segmento. Sem token novo. |
| **X1** ignora `FormKit` | Variantes renomeadas `primary / outline / ghost / quiet`; campo com anel por `box-shadow` como o código; `ModalSheet` com os literais do código; chip tonal declarado como troca de padrão. Rodapés de `Botoes`/`Cards`/`FolhaNav` ganharam a tabela "FormKit hoje × canvas" com a decisão por linha (canvas vence: nomes, raio 12, chip tonal; código vence: mecanismo do foco, literais da folha). |
| **X2** moldura 9-slice fora do vidro | `.frame9` é `position:absolute; inset:0` **dentro** do `.screen`, sob o `.glass`; anel de cobre segue como fronteira externa (verificado no DOM: pai é `.screen`). |
| **X3** raio 8 | Todos os vidros a 12 (`--sm2-radius-md`). Zero `border-radius:8px` nos artboards. |
| **X4** texto < 12px no telefone | `.note`, `.sw`, `.pair`, `.tagd`, `code` (`max(12px,.92em)`) a 12px. Medido: **0 nós < 12px** dentro do `.phone` nos 8 artboards (o rodapé cinza fica fora, como antes). |
| **X5** P2 com DPR errado | Conta corrigida (390px = DPR 3 → 256→128 = 1,5×). `Visor` mostra **(a)** 256² a 128px como transição declarada e **(b)** arte 64² × `Viewport 64×2\|3` (inteira em todo DPR), com a nota do crítico e a recomendação (b). |
| **X6** `forming` 0,375× / emblema 0,5× | `forming` na **mesma escala do sprite** (128); emblema só a 1× (64) — se precisar de 32, é arte 32² própria. |
| **X7** literais sem token | scrim e sombra = literais do `ModalSheet`/`SM2_SHADOW_SHEET` (citados); nav 68 registrado como literal do `BottomNav.tsx`; `.lab` virou **Rubik 12/500 caixa alta** (rótulo, não papel de Fredoka). |
| **X8** grid de 4 violado | 6→8, 10→12, 14→16 em todos os artboards (0 ocorrências restantes dentro do telefone); `gap:2` só ícone↔rótulo, declarado como `--sm2-space-half` no card de espaço (P1). |
| **X9** cobertura | Novo `Dados.dc.html` (tabs, medidor contínuo + segmentado, slot, stat chip, segmento, cabeçalho com voltar, painel com título) + diálogo e toast no `Estados` + chip `day`, chip selecionado+desativado, botão em progresso, linha pressionada, campo `date`/`time`. |
| **X10** "moved 3×" em âmbar | `muted`; nota explica (contagem visível, convite vem do pet). Encaminhar ao guarda. |
| **X11** foco na cor do fill | Regra escrita no `Botoes` ("anel sempre com fresta ≥ 2px"); chip com `outline-offset: 2`. |
| **X12** `@import` Google | Removido; só `@font-face` self-host (README manda servir da raiz). |
| **X13** alturas | Medidas por `scrollHeight` do `.ab`; `Main` = `MainClaro` = 4262 (coluna de hex com largura fixa, sem refluxo por tema). |
| R2 / R3 / R4 / R5 / R6 / R7 | "5 of the last 7 days" · Chip→Berry na folha · "Companion" sem "lvl" · especímenes "do que sai" movidos para o rodapé cinza · 18 declarado na escala ("só dentro de checkbox 24") · nota de que a `VisorBar` desenha a 1× e o `scale` do Viewport leva a 2×. |
| §1.2 | Os 3 pares recomendados entraram no card "Contraste medido". |

Não tocado (por decisão): chip tonal em vez do sólido do `FormKit` (declarado como canvas vence); R1/R8/R9 registrados.

## Achados (divergências com o código de hoje — para o `staff-frontend`)

1. **Pixel fora do visor** em 28 `.tsx` (`.sm-px-*`, `PixelKit` inteiro: botão, painel, tabs, medidores, slot, chip, tag, checkbox, switch) — o `Dados`/`Cards`/`Botoes` desenham o substituto vetor de cada peça da API.
2. **`FormKit`**: `sm2Button('ghost')` → `outline`; raio 10 → 12; `Chip` sólido → tonal; fronteira `line` → `muted` em campo/chip. `ModalSheet` fica como está.
3. **`BottomNav`** em Silkscreen 12px + sublinhado em `--sm-px-cyan` → Rubik 12/500 + `--sm2-primary-ink`; `navRotulo.contract.test.ts` precisa de régua de fonte.
4. **`lucide-react`** em 8 arquivos → `Icon`.
5. **Escala do sprite** (P2) — ver pendente.
6. **Duas leituras de HP** na Home (`VisorBar` + `HomeHud`).
7. **`components/ui/`** em `--foreground/--background` (footgun 10).
8. **Erro/validação/toast/diálogo** sem padrão → o canvas fixa.
9. **Moldura 9-slice** sem consumidor (spec: overlay dentro do vidro); `forming` não em todos os fluxos.
10. **Cabeçalho de página** varia por tela → um só (`Dados`).

## `[pendente do dono]`

| # | O que falta | Proposta | Estado |
|---|---|---|---|
| P1 | Tokens de espaço | `--sm2-space-1..6` = 4/8/12/16/24/32 + `--sm2-space-half` = 2 (só ícone↔rótulo), invariantes de tema | **aprovado pelo coordenador em 16/09** — segue marcado até entrar no `index.css` + `tokens.contrast.test.ts` |
| P2 | Escala canônica do sprite no visor | Crítico recomenda **(b)** arte 64² (`Viewport 64×2\|3`, inteiro em todo DPR); (a) 256²→128 fica como transição declarada; fallback 128² com `scale: 1` muda o tipo | aberto — as duas opções estão desenhadas lado a lado no `Visor` |
| P3 | Ícone da nav 32 × 36 | manter 32; corrigir o `CLAUDE.md` | **decidido: 32** (coordenador, 16/09) — falta só a edição do `CLAUDE.md` |

## Encaminhar ao `soulmon-guarda-linha-vermelha`

X10 (contador de adiamento — agora em `muted`), R3 (contador de comida na folha "3 of 6 this hour"), R8 (HP crítico em `viewport-danger` dentro do vidro), e os medidores do `Dados` (o segmentado "2.5 / 4" mostra número).

## Regras que este canvas NÃO reabre (HANDOFF §7)

O Visor · ícone nunca em box · sublinhado ciano na nav · nada de vermelho de cobrança (âmbar e
convite) · AA nos dois temas por token · nenhum token novo · estrutura dos wireframes aprovados.
