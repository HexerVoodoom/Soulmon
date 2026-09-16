# Canvas "Home" — identidade (Fase 2, segundo canvas) · rodada 2

> Dono: `soulmon-visual-designer` · rodada 1 em 16/09/2026, **rodada 2 em 16/09/2026** após `CRITICA.md`
> (veredito VOLTA — F1, F2, X1–X12 resolvidos abaixo) · HANDOFF-IDENTIDADE §1, §4–§7 · base: canvas **Sistema**
> aprovado (`../../sistema/identidade/`, DECISÕES §18 — P1 espaço 4/8/12/16/24/32 + 2, **P2 = (a)** 256² a
> 128 CSS, **P3 = nav 32**) · estrutura: os 28 wireframes cinza aprovados de `../` (DECISÕES §5, E1–E9 / S1–S7)
> e as linhas `HOME-*` do `INVENTARIO-WIREFRAMES.md` §1.1.
> **Cada artboard = o wireframe de mesmo nome com a identidade aplicada** — mesma hierarquia, mesmos estados,
> mesma copy (EN; PT no rodapé), mesma ordem de foco. Nada estrutural mudou; o que "pediu" para mudar está no
> rodapé como achado. Escuro em todos; claro só no `MainClaro` (decisão 3 do dono).

## Como abrir

O `<style>` de cada `.dc.html` é o bloco do `Sistema/Main.dc.html` **copiado** (tokens `--sm2-*`, átomos,
rodapé) + um bloco `HOME (composição)` só de layout — nenhum token novo, nenhum literal de cor além do
scrim/sombra do `ModalSheet`. Imagens e fontes por caminho relativo ao repo (`../../../../../src/assets/…`,
`../../../../../public/fonts/…`, Silkscreen de `node_modules/@fontsource/silkscreen`). Servir a raiz do repo:
`npx -y serve -l 8766 D:/Soulmon/repo` → `http://localhost:8766/docs/design/wireframes/home/identidade/Main.dc.html`.
Gerador (fora do repo, no scratchpad da sessão): `gen_home.py` — os `.dc.html` são a fonte commitada.

## O que cada artboard prova

| Artboard | Id | Prova |
|---|---|---|
| `Main.dc.html` | HOME-01 (06 · 09 · 17 · 25 · 31 · 40 · 41) | A composição inteira com a tese do Visor: wordmark Fredoka 20, **anel de cobre (356) + vidro 348×200** com `bg-room`, `igni-rookie` 256²→128 CSS (P2 a), berço 220×104, `furn-picture`/`furn-plant` a ½×, sombra de contato, balão de fala (vetor), `VisorBar` HP/EN em pixel sobre a placa de D-H3, Silkscreen 14 e dígitos `tabular`; **dobra medida**: painel a 627, título 628–672, 1ª linha 672–728, dock 722; nome Fredoka 20 + "Companion" Rubik 12; deck 5 células (ícone 24 pelado + Rubik 12); slot (outline + quiet), captura (campo filled + `add` pelado 48), painel de rituais (SIS-03: linha 56, `eco`/`task_alt`, lápis 44, checkbox 24/44), dock 60, nav 68 (ícone 32, sublinhado ciano). Ordem de foco 1–24 idêntica ao wireframe. |
| `MainClaro.dc.html` | HOME-01 claro | O mesmo DOM sob `[data-theme=light]`: o vidro segue escuro, o cobre escurece, o ciano vira `#0B6F68`. Altura diferente do Main só pelo rodapé (o telefone é 844 nos dois). |
| `HomeRolado.dc.html` | HOME-01 | Lista sob o pet fixo: o anel de cobre é a fronteira do sticky; 4 linhas + "Put aside (2)" em `quiet muted` (posse, não dívida). |
| `HomeVazio.dc.html` | HOME-02 | **`primary` "New Activity" a 649–697, inteiro acima do dock (722)**; sem balão, sem Vínculo, energia **sem dígito** (segmentos vazios em pixel); vazio da lista = SIS-06 (`eco` 48 ciano + Rubik 14 + um `primary`); Play inerte (tracejado `muted` + `aria-disabled`). |
| `HomePrimeiroDia.dc.html` | HOME-03 · 11 | FirstDayCard no slot como card SIS-03 (`radio_button_unchecked` → `check_circle`); "not yet today" no lugar de zero. |
| `HomeCarregando.dc.html` | HOME-04 · 46 | Vidro 56×40 com um segmento ciano pulsando; contêiner com `role="status" aria-live="polite" aria-label="Loading"`; "LOADING" em Rubik 12/500 caixa alta **fora** do vidro (achado 8). |
| `HomeSemMetricas.dc.html` | HOME-05 | A linha perde o metadado de constância; o vidro não muda. |
| `HomeOffline.dc.html` | HOME-44 | `OfflineSeal` = pílula do SIS-06 (`cloud_off` âmbar + Silkscreen 14 "NO SIGNAL"), à direita do wordmark, sem cobrir célula. |
| `HomeErro.dc.html` | HOME-47 | Mascote em pixel **dentro de um vidro 96²**, Fredoka 20, Rubik 14 `muted`, um `primary` "Reload" (D-H9: única ação). Sem `danger`. |
| `HomeAvisosExpandido.dc.html` | HOME-10 | Ordem literal dos `push`: aviso de HP (card + `volunteer_activism` âmbar, sem vermelho), "+3 notices" como disclosure `quiet`, semanal, pilha, recomeço (`primary sm` + `quiet sm`, mesma altura). |
| `HomeAvisosCartoes.dc.html` | HOME-13 · 14 · 15 · 16 | Cada cartão isolado; o priming com o PET como remetente = **miniatura do sprite dentro de um vidro 40²** + balão `surface-2`. |
| `FirstDayEstados.dc.html` | HOME-11 · 12 | Feito = `check_circle` FILL 1 ciano + a dica some (não só cor). |
| `HomeHudEstados.dc.html` | HOME-06 · 07 · 08 | Wordmark; selo do foco = chip de etiqueta 24 em `primary-soft`; **`VisorBar` em 5 escalas** (rookie 2/3, 1.5/3, ultra 4/5 + 5/6, piso 0, crítico 0.5 sem dígito), todas sobre a placa de D-H3 (X1), com a moldura crescendo com o `max`; e a **segunda leitura** (barra DOM do `HomeHud`, vetor SIS-07) desenhada só para registrar a duplicidade (achado 1). |
| `PetCarinho.dc.html` | HOME-18 | `anim-heart-burst` quadro 3 a 2× acima e à direita da cabeça (X8); alvo = o sprite (128²). |
| `PetDormindo.dc.html` | HOME-19 | Sprite escurecido (`brightness .55`) + `anim-sleep-z` quadro 3; Sleep → Wake (`wb_sunny`); Play inerte. |
| `PetAssombrado.dc.html` | HOME-20 | Sprite virado para a lista (`scaleX(-1)`, anotação); linha esmaecida pela TINTA (`muted` 7,43 / 5,80, **alpha 1**), chip "haunted · +relief" 24 em `gold-ink` sobre `surface-2` (7,49 / 5,15), lápis e checkbox intactos (F1). |
| `PetPodeEvoluir.dc.html` | HOME-22 | "EVOLVE" em **Silkscreen 14 dentro de moldura pixel** (`frame-pipe-vine-96` a ½×) sobre a placa de D-H3, alvo 44, no canto do vidro (X3 — o LCD fala em LCD) + `anim-sparkle-pop` acima da cabeça; a planta cede o canto. |
| `PetDeckEstados.dc.html` | HOME-21 · 23 · 24 | Ponto de cobre 8px + FILL 1 (itens novos); Bath inerte tracejado; cocô = `anim-poop-plop` quadro 3 no vidro; retorno após ausência no balão; a regra única de "não dá agora". |
| `PetCheio.dc.html` | HOME-36 | Recusa como fala do pet no balão; nada vermelho, nada decrementa. |
| `AlimentarFolha.dc.html` | HOME-35 | `ModalSheet` literal (alça, scrim, sem borda); comida 96² a ½× em células `surface-2` + `muted` 1px (F2); vazio = um parágrafo. |
| `ItensPastinha.dc.html` | HOME-37 | Grade 3 col., célula 96, arte 48, nome 12, `×N` tabular; sem rodapé. |
| `ItensVazio.dc.html` | HOME-38 | Mascote em vidro 96² + Rubik 14 `muted`. |
| `ItensUsar.dc.html` | HOME-39 | Seleção = anel ciano 2px + `primary-soft`; rodapé nome → efeito → `primary sm` "Use"; toast do teto (`info` âmbar, sem botão); as três recusas em três canais. |
| `ChatEstados.dc.html` | HOME-25 → 30 | Um botão que muda de ação: `mic` (ink) → `send` (ciano) → `send` desativado (`muted`) → `stop_circle` FILL 1 → `sync`; campo filled com `>_` em mono; permissão negada = fala do pet; offline = toast âmbar. |
| `PlayEstados.dc.html` | HOME-31 · 32 · 33 | Play como 5ª célula (`toys` 24, SVG inline — P6); desejo com custo e recusa no balão; inerte (já brincou / antes da 1ª conclusão); o buff sai (registro); o cartão antigo (registro W9). |
| `TrilhaEvolucao.dc.html` | HOME-34 | O que **sai** (`EvoTrail`) e a proposta (lista com 342px), só para registro. |
| `NavEstados.dc.html` | HOME-40 · 41 · 43 | Skip link com anel de foco ciano (fresta 3px); nav normal / ativa (FILL 1 + sublinhado 3px com halo) / menu aberto. |
| `NavMenu.dc.html` | HOME-42 | Popover `surface` (raio 12, sombra de folha) com 4 linhas 44: `groups` (SVG inline — P6) · `diamond` em `credit-ink` · `settings` · `replay`. |
| `FeedbackEstados.dc.html` | HOME-45 · 48 | Toast do SIS-06 acima do dock (`check_circle` ciano); região `aria-live` do visor sem pixel visível. |

Medido no DOM (todos os 29, rodada 2): **0 nós com texto < 12px dentro do `.phone`**, **0 elementos vazando a largura
do telefone**, **0 elementos com opacidade < 1** (o único era o botão desativado do chat, agora só `muted`), **0 `.meters` sem placa**; alturas do `canvas.json` = `scrollHeight` do `.ab`, gravado em UTF-8 pelo gerador (X10).

## Decisões de identidade tomadas neste canvas (canvas vence; a confirmar na crítica)

| # | Decisão | Motivo |
|---|---|---|
| D-H1 | **Corpo do aparelho = a página**: só anel (356) + vidro (348×200); nome e deck sobre `--sm2-bg`, sem o card com borda de cobre do `.sm2-device` | SIS-01 ("tudo nesta página é o aparelho") — **confirmado pelo crítico**; vale por SIS-01, não pela dobra; a dobra fecha por F2 |
| D-H2 | **`VisorBar` com a moldura recortada ao `max`**. **Fórmula única (X4)**, a 1×: largura = cap 6 + 7·max + cap 6; segmento 6 em `left = 6 + 7·i`; meio = 3. A 2× (como desenhado): 12 + 14·max + 12, segmentos em 12 + 14·i | Com a moldura fixa de 96, HP 3/3 lê como "⅓ cheio" — **confirmado pelo crítico** (Tamagotchi mostra `max` corações). Os caps hoje são fatiados do `bar-frame-96x8` (495 cores) → `squad-arte` entrega `bar-cap-l-6x8` / `bar-mid-1x8` / `bar-cap-r-6x8` em grade |
| D-H3 | **Placa escura atrás dos medidores**: `color-mix(in srgb, var(--sm2-viewport-bg) 78%, transparent)`, cantos retos — em TODOS os vidros com `VisorBar`, inclusive os 5 do `HomeHudEstados` (X1) | Pior caso medido pelo crítico 8,46:1 (Silkscreen sobre pixel branco do `bg-room`), segmento 4,97 — **confirmado**; HUD diegético (a faixa do LCD), não card |
| D-H4 | **FX de `animArt` a 2×** (célula 64 → 128 CSS), sprite a 128 CSS; FX ancorados **fora do rosto** (X8: coração acima e à direita da cabeça, faísca acima e à esquerda, Z acima e à direita); **berço e cenário declarados como transição** (X11): `bg-room` ≈0,29× e `nest-cradle-wide` ⅓× com `image-rendering:auto` (ilustração reduz com filtro), `pixelated` só no que É grade | Mesma grade lógica 64 × `scale` 2 do `Viewport`; o sprite 256→128 é a transição P2 (a) — **confirmado como transição** |
| D-H5 | **Só o balão de fala** fica em vetor sobre o vidro (frase inteira, Rubik 14; overlay sem borda) — e **não cobre a criatura** (X2): o sprite e o berço descem 22px com balão de 1 linha (36px) e 40px com 2 linhas (54px). **"Evolve" foi derrubado**: virou Silkscreen 14 em moldura pixel do `hudArt` (X3), mesma estrutura e foco | Balão: confirmado com condição; "Evolve": uma palavra cabe em Silkscreen, o gênero desenha comandos on-screen na língua do LCD. Não precisa de decisão de estrutura |
| D-H6 | **Arte de item (comida, especiais) em pixel dentro de célula vetor** nas folhas | Itens são o inventário da criatura, não chrome; a tese cobre sprite/cenário/FX. Se o crítico reprovar, cada célula vira mini-vidro (como a miniatura do priming) |
| D-H7 | Mascote (`mascot-raven`) e miniatura do pet **sempre dentro de um vidro** (96², 40²) | Pixel só no vidro — vale para ilustração também |
| D-H8 | Tidy = `filter_list`, aviso de HP = `volunteer_activism`, "+N" = `expand_more/less` (confirmados). **Play = `toys`**, **Library = `groups`** (crítico: `pets` é a criatura, `person` é perfil) — os dois **não estão no subset** e aparecem no canvas como SVG inline (`data-fora-do-subset`) | P6: entram em `icon_names` (`tokens.md` §5, +2), refaz o `.woff2`, +1 no `CACHE_VERSION`; `iconInventory.contract.test.ts` cobra |
| D-H9 | "New Activity" é `primary` só onde é a única ação (HomeVazio, HomePrimeiroDia); nas outras Homes é `outline`. `HomeErro`: "Reload" é `primary` (X7) | Um primário por tela (SIS-02) — confirmado |

## Rodada 2 — achado → conserto

| Achado | Conserto |
|---|---|
| **F1** linha assombrada a 3,26 / 2,31 (opacidade .55) | `opacity` fora; título e ícone em `--sm2-muted` (7,43 / 5,80), chip `gold-ink` sobre `surface-2` (7,49 / 5,15) a 24px (X9), lápis e checkbox intactos. Medido: 0 elementos com opacidade < 1 nos 29. |
| **F2** dobra reaberta (painel a 686, `primary` do vazio a 711) | `.panel .ph` border-box 61→44 (X5) · dock 60→52 · `.pf` 12→8 · avisos em `sm` 44 (104→96) · notas de spec ("Balance my week", Play inerte, Feed/Items no D1) foram para o rodapé. **Medido a 390×844**: `Main` painel a 627 (wireframe 648), título 628–672, 1ª linha 672–728, dock 722; `HomeVazio` `primary` 649–697 (wireframe 658–702), inteiro visível. |
| **X1** `HomeHudEstados` sem placa | os 5 vidros são `.screen.stage`; placa em `color-mix(in srgb, var(--sm2-viewport-bg) 78%, transparent)` (sem literal). |
| **X2** balão cobre a cabeça | balão sem borda, `top:6`, padding 6/12, 1,3 de entrelinha (1 linha = 36px, 2 = 54px); sprite, berço e sombra descem 22 / 40px. Medido no Main: balão 71–101 no viewport, sprite a partir de 111. Variante de 2 linhas (`PlayEstados` sem energia): a frente do berço corta no vidro — registrado no rodapé. |
| **X3** "Evolve" slab vetor | `.pxbtn`: Silkscreen 14 "EVOLVE" `viewport-ink` sobre a placa de D-H3, moldura `frame-pipe-vine-96` (`border-image` slice 24 / 12px = ½×), alvo 44, mesma posição e foco 3. |
| **X4** números de D-H2 | uma fórmula (cap 6 + 7·max + cap 6 a 1×) no README, no rodapé do Main e no CSS (`w = 12 + 14·max + 12`, caps de 12 a 2×). Pedido à `squad-arte` registrado. |
| **X5** `.ph` 61px | `box-sizing:border-box`, `padding:0 12px` → 44. |
| **X6** skeleton sem `status` | `role="status" aria-live="polite" aria-label="Loading"` de volta no contêiner. |
| **X7** `HomeErro` × D-H9 | "Reload" é `primary`. |
| **X8** FX no rosto | coração `top:-40`, +44 à direita; faísca `top:-40`, −104 à esquerda; Z `top:-44`, +48 à direita — acima da cabeça. |
| **X9** chip a 20 | inline removido → 24 (SIS-03). |
| **X10** mojibake | `canvas.json` regravado pelo gerador lendo/escrevendo UTF-8; 0 "Â". |
| **X11** cinco grãos | berço e cenário declarados como transição (rodapé do Main + D-H4); `image-rendering:auto` nos dois; pedido à `squad-arte` (berço 110×52, cenário 176×100). |
| **X12** medidas do vidro | rodapé do Main: anel 356, vidro 348×200. |
| R3 / R6 | `.seal` registrado como segunda exceção à tese (para o `04` §1); borda do balão removida. |

## Achados (divergências com o código de hoje — para o `staff-frontend`)

1. **Duas leituras de HP/energia na Home**: `CompanionHUD` monta a `VisorBar` (pixel) E o `HomeHud hideBrand compact` continua desenhando a barra DOM — o jogador lê o mesmo número duas vezes (`HomeHudEstados` desenha as duas para provar). Proposta: a DOM sai; `HomeHud` fica só com wordmark + selo.
2. **Pixel fora do visor** em deck, botões, painel, selos, popover, folhas (`.sm-px-*`, `PixelKit`, `ui/btn-*.png`) — tudo vetor aqui (SIS achado 1).
3. **`VisorBar`**: moldura fixa 96 + passo 6 → moldura ao `max`, fórmula cap 6 + 7·max + cap 6 (D-H2); caps em grade limpa da `squad-arte`.
4. **Cocô** ainda é `figma:asset/9087…png` (156×145, herança) → `anim-poop-plop` do `animArt`.
5. **`anim-sleep-z` é teal escuro** — quase some sobre `bg-room`; pedir variante clara à `squad-arte`.
6. **Sombra de contato (E4)** é CSS de borda dura no canvas → FX 64×16 da `squad-arte`.
7. **Balão de fala sobre o vidro** (D-H5, exceção declarada junto com o `.seal`) — a criatura desce sob o balão; "Evolve" é pixel no vidro (X3).
8. **`ScreenSkeleton` escreve "LOADING" em Silkscreen fora do vidro** → Rubik 12/500 caixa alta, ou a palavra entra no vidro (96×40).
9. **Aviso de HP em `sm2-notice-warn`** (vermelho) → card comum + ícone âmbar (W6, guarda 1b).
10. **Rótulo da nav** Silkscreen 12 → Rubik 12/500; sublinhado `--sm-px-cyan` → `--sm2-primary-ink` (SIS achado 3).
11. **`lucide-react`** no `ChatBox`/`HomeHud` → `Icon` (mic/send/stop_circle/sync estão no subset).
12. **Botão "Add" da captura em caixa** → ícone pelado 24 ciano, alvo 48.
13. **Miniatura do pet no priming** a 32 CSS = 0,125× do 256² — reamostragem pesada até a arte 64² (P2 b) existir.
14. **`ItemsWindow`**: sem teste que monte a tela (já no STATUS); a pastinha ainda mostra comida comum — o dono decidiu **só especiais** (13.6); o wireframe aprovado ainda a desenha com comida e o canvas replica a estrutura aprovada (muda quando o canvas Loja/Atividades redesenhar a pastinha).
15. **`home-scene-1547.png`** (1376×3058, moldura de cobre pintada) é fundo de PÁGINA em pixel — contraria a tese e não entrou.
16. Deck: ícone 24 (escala viva do código; o `CLAUDE.md` já foi corrigido para 24 em 16/09).
18. **Subset de ícones**: `toys` (Play) e `groups` (Library) entram em `icon_names` — P6.
17. `EvoTrail.tsx` continua no `App.tsx` (S1); os dois toasts 🎈 de `handlePlay` (E7); `sonner` genérico → toast do sistema.

## `[pendente do dono]`

| # | O que falta | Proposta | Estado |
|---|---|---|---|
| P1 | Tokens de espaço | já aprovado em §18 — o canvas usa 4/8/12/16 + 2 | aguarda `index.css` |
| P2 | Escala do sprite | (a) decidida; a miniatura 32 (priming) e o mascote 72 herdam a mesma transição | fechado, registrado |
| P4 | **Moldura pintada como fundo de página** (`home-scene-1547.png`) | **não usar** (tese; crítico concorda) | recomendação: não usar |
| P5 | **Cor dedicada da tarefa assombrada** | `muted` na tinta, **sem opacidade**, sem token (F1; crítico: um 4º acento não se justifica) | recomendação: sem token |
| P6 | **Glifo de Brincar e de Biblioteca** | `toys` e `groups` (Material) — **entram no subset**: +2 em `icon_names`, `.woff2` refeito, `CACHE_VERSION` +1, guard `iconInventory.contract.test.ts`. No canvas estão em SVG inline até o subset existir | recomendação: subset +2 (custo conhecido) |
| P7 | **Segmento do medidor** | manter o cubo `bar-fill-6` (coração 6×6 a 2× não lê como forma; HP/EN + dígito já rotulam) | recomendação: cubo |

## Encaminhar

- **`design-critic`** (rodada 2): F1, F2 e X1–X12 medidos; D-H5 reduzido ao balão; a lista de volta acima.
- **`squad-arte`**: caps da barra em grade (X4), berço 110×52 e cenário 176×100 em grade (X11), `sleep-z` claro (achado 5), sombra de contato 64×16 (achado 6).
- **`soulmon-guarda-linha-vermelha`**: aviso de HP em âmbar + `volunteer_activism`; chip "haunted · +relief" em `gold-ink`; HP 0.5 sem dígito (E5) e `viewport-danger` sem uso na Home; toast do Glitchtama com `info` âmbar.
- **`soulmon-design-lead`**: D-H5 e a decisão de estrutura que ele implica; P4–P7.

## Regras que este canvas NÃO reabre (HANDOFF §7)

O Visor · ícone nunca em box · sublinhado ciano na nav · `.sm-pet-sticky` · nada de vermelho de cobrança ·
AA nos dois temas por token · nenhum token novo · a estrutura aprovada dos 28 wireframes (DECISÕES §5).
