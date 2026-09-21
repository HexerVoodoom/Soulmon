# Canvas "Fora do app" — identidade (Fase 2, 13º canvas) · rodada 2 (20/09/2026, pós-crítica)

> **Rodada 2** (`CRITICA.md`: VOLTA — 2 fatais, 10 fixáveis, 7 ruídos): **F1 — a página dos widgets foi redesenhada a
> 1:1 dp** (A 180×90 · B 110² · C 40² · D 180×40 · E 180×110 = os `minWidth/minHeight` dos XML), texto **13sp/500 e
> 12sp** (13 = o que o `widget_soulmon.xml` tem hoje; 12 = o piso, de verdade), sprite no tamanho que CABE na altura útil
> (64 / 48 / 32 dp), coração 16dp, e **camadas removidas em vez de comprimidas** (§12): B perde a frase, D perde a linha
> do contador. **F2 — o D não mostra "—"** com zero tarefas (13.16): saiu daqui e do wireframe cinza
> `../Tamanhos.dc.html` (legenda registra). **X1** tabela de contraste corrigida (o par claro de `primary-fill` era
> inventado — o widget não tem tema; o slot apagado da energia ganhou contorno 1dp `#AAB6B4` = 8,99, é estado); o
> `MainClaro` mostra o MESMO widget do escuro (literais no `.wgring`). **X2** uma cara só para o "Pixel" — `rookie.png`
> (a criatura do estágio) no widget E no overlay; `setImageViewBitmap` e o bucket de densidade nos achados (o "nodpi"
> saiu). **X3** retrato dormindo a 128 no mesmo box. **X4** menu a 340 (`MENU_SIZE`), 480 de altura com conta (≤ 520).
> **X5** degrau 7 inteiro; as 7 frases EN → `redator-ux`. **X6** badge do Web Push alfa-only (achado, `sw.js`). **X7**
> anel = `<shape>` stroke chapado, raio = `system_app_widget_background_radius`. **X8** as 3 fontes no build do
> desktop (achado). **X9** `largeIcon` redondo (a chama cabe: ponto mais distante a 88 < 96). **X10** achado 7
> corrigido (o teste não trava "0/5"; falta um `it`). Ruídos R1–R7 aplicados ou registrados.

> Dono: `soulmon-visual-designer` · 20/09/2026 · HANDOFF-IDENTIDADE §1, §4–§7 · base: canvas **Sistema** aprovado
> (`../../sistema/identidade/`, DECISÕES §18 — P1 espaço, **P2 = (a)** escala inteira, P3), **Home** (§19: balão Rubik
> sobre o vidro D-H5; cenário/berço como transição X11), **Atividades** (§20: tinta/filtro, nunca alpha), **Rituais**
> (§21: emoji de copy fica, emoji de interface vira Material), **Pet** (§22), **Evolução** (§24), **Jogos** (§25: barras
> fora do vidro nunca ❤️/vermelho) e **Loja** (§26: `diamond` em `credit-ink`; as três moedas). Tudo que as nove
> `CRITICA.md` anteriores reprovaram está reprovado aqui desde a rodada 1 (`opacity < 1`, `text-shadow`, `.pix` e `<img>`
> fora de `.screen`, `danger` no telefone — `guard()` do gerador).
> Estrutura: os 7 wireframes cinza aprovados de `../` (DECISÕES §16, F1–F5 / V1–V8 / S1–S5; modal final de 15/09: 13.16,
> 13.17, 13.18, V5) e as linhas `FORA-01`→`FORA-18` do `INVENTARIO-WIREFRAMES.md` §1.10. **Duas exceções de fidelidade
> declaradas (F1 da crítica, §12 "remover, nunca comprimir")**: o B sem a frase e o D sem a linha do contador — para o
> lead registrar no §29.
> **Cada artboard = o wireframe de mesmo nome com a identidade aplicada** — mesma hierarquia, mesmos estados, mesma copy
> (EN; PT no rodapé), mesma ordem de foco. Nada estrutural mudou; o que "pediu" para mudar está no rodapé como achado.
> Escuro em todos; claro só no `MainClaro` (decisão 3 do dono).
>
> **A tese deste canvas, em três frases.** (1) **O widget Android É o visor** — não tem aparelho em volta: anel de cobre
> + vidro `viewport-bg`, a criatura real, corações em `viewport-ink` e a energia em `primary-fill`; e como o RemoteViews só
> desenha a fonte do sistema, o texto do widget é Roboto (nunca Rubik, nunca Silkscreen) — o canvas desenha isso, não
> finge. (2) **No overlay o pet é o visor e o menu é o aparelho** — a faixa da barra de tarefas é um vidro largo com a
> criatura a 64 e o balão Rubik ao lado; o menu é um card SIS-03 de 340 em vetor, ícones Material pelados, alvos 44. (3) **No
> push o ícone mono é a chama** (`ic_notification.xml`, pintado no acento) **e o ícone grande é um mini-visor** — a chama
> pixel do `favicon` sobre `#071413`, a criatura da marca antes de o app abrir.
> **Regras que mordem, todas respeitadas:** o widget NUNCA cobra (nada de dígito do que falta, nada de "0/5", nada de
> vermelho, nada de porcentagem nem escudo — `widgetSemCobranca.contract.test.ts`); corações são posse de vitalidade (o
> vazio é contorno, nunca alarme — V5 sem piso); a copy do widget é só EN (13.18); a linha do contador some no zero e a
> energia nunca "⚡0/5" (13.16); o badge de tarefas sem dígito (13.17); nenhum push de culpa; a `tag` deduplica.

## Como abrir

O `<style>` de cada `.dc.html` é o bloco do `Sistema/Main.dc.html` **copiado** (tokens `--sm2-*`, átomos, rodapé) + o bloco
`HOME (composição)` (anel/vidro, `.strip`, `.fo`) + um bloco `FORA (composição)` só de layout: o widget-visor `.wgring`/`.wg`
(`.vert`/`.chat`/`.pet`/`.scr`), os degraus `.deg`, a faixa `.faixa`, a janela do overlay `.win` (`.tb` barra de título,
`.ph2` cabeçalho de painel, `.stat2`, `.port`, `.care`), o card de push `.push` — nenhum token novo. **Uma exceção
declarada:** o widget (`.wgring`, `.wg`) usa os hex literais `#071413` / `#C68642` / `#E9F5F2` / `#AAB6B4` / `#5FF3E0`
porque é isso que o XML do Android vai ter — o RemoteViews não lê token e o widget não tem tema (X1); são os hex de
`viewport-bg` / `viewport-ring` / `viewport-ink` / `primary-fill` escuros, e a régua é o `tokens.contrast.test.ts`. As mesmas podas
das rodadas anteriores e o mesmo `guard()`.
Imagens e fontes por caminho relativo ao repo. Servir a raiz do repo:
`npx -y serve -l 8779 D:/Soulmon/repo` → `http://localhost:8779/docs/design/wireframes/fora-do-app/identidade/Main.dc.html`.
Gerador (fora do repo, no scratchpad da sessão): `gen_fora.py` (importa `gen_ativ_head.py`); medição `measure_fora.mjs` +
`probe_fora.mjs`; diff de fidelidade `cmp.py` — os `.dc.html` são a fonte commitada.

## O que cada artboard prova

| Artboard | Id | Prova |
|---|---|---|
| `Main.dc.html` | FORA-01 | O widget A **a 1:1 dp (180×90)** como visor: anel chapado 3dp `#C68642` + vidro `#071413` (raio = `system_app_widget_background_radius`, 16 como amostra), a criatura do estágio (`rookie.png` 384²) a **64dp** à esquerda, nome **13sp/500** e "Rookie" 12sp `#AAB6B4`, o contador "3/5" 13sp `tnum` **só com ≥ 1 feita**, a frase da escada 12sp — uma linha com contador, **duas sem ele** (13.16 devolve a linha à frase). Quatro linhas de 16/15/16/15 = 62 dos 68dp úteis. Quatro estados na mesma caixa; um alvo (180×90). |
| `MainClaro.dc.html` | FORA-01 claro | A mesma folha sob `[data-theme=light]`: a página e as legendas mudam, **o widget é o mesmo, pixel por pixel** (X1) — o XML não tem tema; no Android ele vive sobre o papel de parede da pessoa, e o anel é o que o separa de qualquer fundo. |
| `Tamanhos.dc.html` | FORA-02 · 03 · 04 · 05 | **1:1 dp, removendo camadas (F1, §12).** B (110²; 88 úteis): sprite **48** + nome 13sp + "Rookie · 3/5" 12sp = 79 — **a frase sai**. C (40²; 34 úteis): só a criatura a **32** (÷12) e, com `has_poop`, o quadro 3 de `anim-poop-plop` a 16 no canto — nenhum texto. D (180×40; 34 úteis): sprite 32 + **nome 13sp + frase 12sp** = 31 — **a linha do contador sai** (V6); com zero tarefas não aparece NADA além disso (F2, 13.16; o "—" saiu daqui e do wireframe cinza). E (180×110; 88 úteis): **o único sem texto** — corações `favorite` **16dp** em `#E9F5F2`, cheio = preenchido, vazio = **contorno** 2 `#AAB6B4` (nunca vermelho); energia = 5 segmentos verticais, `#5FF3E0` acesos / apagados com **contorno 1dp `#AAB6B4`** (X1: é estado, ≥3:1); a criatura a 64 no centro. |
| `Escada.dc.html` | FORA-06 | Os 7 degraus como lista de aparelho (chip-número SIS 32, frase EN 14/500 `[novo]` — **copy nova → `redator-ux`, X5** —, condição + PT do código 12 `muted`); o degrau 7 inteiro ("You started — that already counts"); a lápide ⚰️; e um terceiro strip com o degrau 5 **dentro do widget-visor** a 1:1 — a frase é a última linha, 12sp, sem emoji. |
| `OverlayPrincipal.dc.html` | FORA-07 | `[novo — código]` **a faixa** (358×72 — 72 é a proposta de `STRIP_HEIGHT` novo; hoje 180, acima da barra de tarefas, transparente e click-through — R1): vidro largo, **a mesma criatura do widget** (`rookie.png` a 64, ÷6 — X2) rente ao chão, o balão Rubik 14 em `surface` ao lado, três `glyph-affection` a **32 (1×)** subindo de cima da cabeça; a criatura é o alvo (64²). **O menu a 340 (`MENU_SIZE`, X4; 480 de altura com conta ≤ 520)**: barra de título fixa — chama `local_fire_department` 20 FILL `primary-ink` + wordmark Fredoka 16 + `settings`/`expand_more`/`close` 20 em alvos **44**; "Rookie" 14/500; a linha de estado em Material 18 — `favorite` cheio ×2 + contorno ×1 em `ink`, `bolt` + "3/5", `restaurant` + "×2"; o retrato num vidro 160×136 com a criatura a **128 (÷3)**; a fala 14; a fileira `volunteer_activism`/`restaurant`/`shower`/`bedtime` 24 pelados + Rubik 12 em células 56; "Today's tasks" `.btn.gho` 44 com `task_alt` e `chevron_right`, **sem dígito** (13.17); as notas 12 `muted`. Dormindo: **o mesmo retrato 128** (X3) com `brightness(.55) saturate(.7)` (nunca alfa) + o Z de `anim-sleep-z` a 1× no canto; 4º botão `wb_sunny` "Wake". |
| `OverlayTarefas.dc.html` | FORA-08 | O cabeçalho de painel (`chevron_left` 24 em alvo 44 + "Today's tasks" Fredoka 16) sob a barra fixa; cada tarefa uma linha 44 com o checkbox SIS-03 (`.cb` 24) e o texto 14 — o emoji do nome é DADO do usuário e fica; vazia = frase 12 `muted` centrada; sem conta = só o aviso. Menu a 340. |
| `OverlayConfig.dc.html` | FORA-09 · 10 · 11 | "Language: English" fantasma com `translate`; e-mail 14/500; "Sync now" `.btn.out` 44 com `sync`; a carteira numa linha 12 — "Account · Full ·" + `diamond` 18 FILL em **`credit-ink`** + "32" (a terceira moeda com o glifo próprio — Loja D-L11); "Open full Soulmon" fantasma com `arrow_forward`; sem conta: "Sign in with email" com `lock`; migração: o campo SIS-03 44. Menu a 340. |
| `Pushes.dc.html` | FORA-12 → 18 | Sete cards da bandeja (330×96–99 dentro do strip): a linha do app com a chama 18 FILL (o acento — no canvas `primary-ink` do tema; o real é `#0B6F68`, R3) + "Soulmon · 10:00" + a `tag` em mono 12; título 14/500 e corpo 12 **literais de `_pushCopy.js`** (🌙/😴 são da copy — ficam); à direita **o ícone grande num mini-visor 48 REDONDO** (X9: o Android recorta o `largeIcon` em círculo; a chama do `favicon-192` cabe — ponto mais distante do centro a 88 < 96) com o `favicon.svg` a 1×. O card inteiro é o alvo. |

## Decisões de identidade (D-F1…D-F15)

| # | Decisão | Fonte |
|---|---|---|
| D-F1 | **O widget É o visor**: um único `widget_bg.xml` (`<shape>` solid `#071413` = `viewport-bg`, **stroke 3dp `#C68642` chapado** = `viewport-ring` — o gradiente/anel interno do `.ring` do app não existe no widget, X7; **corners = `@android:dimen/system_app_widget_background_radius`**, o raio com que o Android 12+ recorta) nos cinco layouts; sem aparelho em volta, sem a grade verde do `pet_grid.xml`; **sem tema** (os mesmos literais em qualquer tema do telefone — X1) | HANDOFF §1 (o Visor); footgun 2/4; X1/X7 |
| D-F2 | **A criatura do estágio no tamanho que CABE a 1:1 dp**: 64dp em A/E, 48 em B, 32 em C/D (÷6/÷8/÷12 de 384). O XML entrega por **bucket de densidade** (384 em `drawable-xxxhdpi` = 96dp de arte; 288/192/144/96 nos outros — `nodpi` não evita reescala em dp, X2) ou aceita o filtro bilinear (a arte é ilustração de 13.631 cores). **Uma cara só** (X2): `rookie.png` no widget E no overlay; a criatura REAL do jogador (linha/gerada) via `setImageViewBitmap` é achado para o lead | F1/X2; P2 (a); SIS achado 5 |
| D-F3 | **Texto do widget na fonte do sistema a 1:1 dp**: **13sp/500** nome e contador (`sans-serif-medium`, `tnum`), **12sp** estágio e frase, `#E9F5F2` (`viewport-ink`) e `#AAB6B4` (72% sobre `viewport-bg`), sem sombra, **sem emoji** na escada; **remover camada em vez de comprimir**: B sem a frase, D sem a linha do contador (frase em 2 linhas no A quando o contador some) | F1; footgun 2 (RemoteViews); 13.16/13.18; §12 |
| D-F4 | **Corações em `viewport-ink`**: cheio = o path do `favorite` preenchido; vazio = o mesmo path em contorno 2 `#AAB6B4`. Nunca vermelho; V5 sem piso | PRINCÍPIOS §12; DECISÕES §16 V5 |
| D-F5 | **Energia em `primary-fill`** (`#5FF3E0`) / apagado = `#071413` com **contorno 1dp `#AAB6B4`** (8,99 — o slot vazio é ESTADO de um medidor de 5, ≥3:1, X1) — a única luz forte do widget, a mesma régua da `VisorBar` | SIS-05; Home D-H2; WCAG 1.4.11 |
| D-F6 | **O cocô do C é o FX pixel** (quadro 3 de `anim-poop-plop`, 64² a 16dp — o que cabe no canto de 34) por cima da criatura; pedir `poop_16.png` avulso (RemoteViews não recorta sprite-sheet) | Home (cocô sai do emoji) |
| D-F7 | **A mesma criatura (`rookie.png`) a 64 (÷6) na faixa e a 128 (÷3) no retrato — acordada E dormindo** (X3: dormir escurece por filtro, não encolhe; o Z a 1× no canto) | X2/X3; P2 (a); `PET_SIZE 96` não é inteiro |
| D-F8 | **A faixa desenhada a 358×72 — 72 é a proposta de `STRIP_HEIGHT` novo** (hoje 180; ela vive acima da barra de tarefas, no `workArea`, transparente e click-through — R1) com o balão Rubik 14 em `surface` **ao lado** da criatura; os glifos sobem de cima da cabeça | Home D-H5 (balão Rubik sobre o vidro); R1 |
| D-F9 | **O overlay herda os tokens `--sm2-*` por cópia declarada** (o renderer não carrega o CSS do app) com teste de paridade de hex — **e as três fontes** (Fredoka, Rubik, Material Symbols Rounded 152 KB) entram no build do desktop como `.woff2` locais (X8: sem elas o menu cai em Segoe e os ícones ficam vazios) | footgun 9 (cópia com teste); X8 |
| D-F10 | **FX do overlay = glifos pixel a 1× (32)**: `glyph-affection` (carinho), `glyph-bath` (banho); comida e sono pendentes de glifo; subida em `steps()` sem alfa | A21.1; Atividades F1 |
| D-F11 | **Barra de título = chama `local_fire_department` FILL `primary-ink` + wordmark Fredoka 16 + `settings`/`expand_more`/`close` 20 pelados em 44**, no menu de **340×520 = `MENU_SIZE`** (X4; 480 de altura com conta). `expand_more` é o glifo de compromisso para "Minimize" (R2: `minimize`/`remove` fora do subset; o `aria-label` diz o certo) | regra do dono (ícone nunca em box); alvo 44; X4/R2 |
| D-F12 | **A linha de estado do menu em Material 18**: `favorite` FILL 1/0 em `ink` (vazio = contorno), `bolt` + "N/M" `tabular-nums` (nunca "0/M" — 13.16), `restaurant` + "×N" | Rituais (emoji de interface → Material); 13.16 |
| D-F13 | **Botões de configuração com glifo pelado**: `translate`, `sync`, `lock`, `arrow_forward` (a saída para o app; `open_in_new`/`smartphone` não estão no subset), `diamond` em `credit-ink` | Loja D-L11; tokens.md §5 |
| D-F14 | **O ícone mono do push é a chama** (`ic_notification.xml`, já vetorizada) — o Android pinta no acento e descarta cor. **O `badge` do Web Push precisa do MESMO desenho alfa-only** (`badge-96.png`, a chama branca em transparente): hoje o `sw.js` manda o favicon e a barra de status o pinta como bloco preto (X6) | `ic_notification.xml`; `public/sw.js`; X6 |
| D-F15 | **Acento da notificação = `#0B6F68`** (`primary-ink` claro): 6,02 sobre a bandeja clara; o ciano escuro dá 1,37 (o Android 12+ reajusta por tema, R3). **Ícone grande = a chama-visor 192** (`favicon-192x192.png`), o mesmo do Web Push, também no FCM nativo (`setLargeIcon`) — **sai REDONDO** (X9): o Android 12+/Pixel recorta em círculo, a chama centrada cabe (ponto mais distante do centro a 88 < 96); o canto e a moldura do visor não sobrevivem e o canvas já desenha o círculo | `_pushCopy.js`; `workers/fcm.js`; X9 |

## Contraste (WCAG 2.x, hex do `index.css` bloco ONDA 1 — e os literais do widget, que não têm tema)

| Par | Escuro | Claro |
|---|---|---|
| **widget** `#E9F5F2/#071413` (texto, corações cheios) — literal, sem tema (X1) | 16,82 | 16,82 (o mesmo) |
| **widget** `#AAB6B4/#071413` (estágio, contorno do coração vazio, contorno do slot apagado) | 8,99 | 8,99 |
| **widget** `#5FF3E0/#071413` (energia acesa, não-texto) | 13,75 | 13,75 |
| **widget** `#C68642` anel sobre `#071413` (dentro) — o fora é o papel de parede da pessoa | 5,79 | 5,79 |
| `viewport-ink/viewport-bg` (a faixa e o retrato do overlay, o mini-visor do push) | 16,82 | 14,53 |
| `viewport-ring/bg` (o anel do retrato, não-texto) | 5,92 | 3,66 |
| `ink/bg` (legendas fora dos strips) | 16,15 | 14,96 |
| `muted/bg` (legendas dos strips, lápide) | 8,83 | 5,35 |
| `ink/surface` (menu, balão, push) | 13,59 | 16,23 |
| `muted/surface` (notas, corpo do push, `tag`) | 7,43 | 5,80 |
| `primary-ink/surface` (chama, botões-fantasma, "Today's tasks") | 11,12 | 6,02 |
| `credit-ink/surface` (o `diamond` da carteira) | 7,56 | 7,10 |
| `on-primary/primary-fill` (checkbox marcado) | 12,38 | 6,02 |
| `line/surface` (bordas, decorativo) | 1,32 | 1,25 |
| acento Android `#0B6F68` sobre bandeja clara `#FFFFFF` / escura `#1C1B1F` (ícone, não-texto) | — | 6,02 / 2,85 (o 12+ reajusta) |

(`primary-fill/viewport-bg` no tema claro daria 2,70 — o par não existe no widget: o XML tem o literal escuro. Linha
removida na rodada 2, X1.)

## Medição (8 artboards, `measure_fora.mjs` + `probe_fora.mjs`, Chrome 420×900 DPR 1, rodada 2)

- **Os widgets são 1:1 dp** (o artboard é 390 CSS px = 390 dp): A 180×90 · B 110² · C 40² · D 180×40 · E 180×110 — os
  `minWidth/minHeight` dos cinco XML. Todo número dentro deles é dp/sp de verdade.
- **0 nós de texto < 12px** nos 8 — no widget: nome/contador **13sp**, estágio/frase **12sp** (a fonte reportada é a do
  sistema); no push: título 14, corpo 12; a `tag` mono 12.
- **0 vazamento** de 390; **alvo < 44: 6, todos a caixa MÍNIMA do XML** (C 40² ×2, D 180×40 ×4) — o alvo real é a célula
  do launcher (≥ ~70dp) que recebe o `PendingIntent`; todos os outros ≥ 44 (A 180×90, B 110², E 180×110; a criatura da
  faixa 64²; os 3 botões da barra de título 44²; as células de cuidado 56×68; "Today's tasks" 44; as linhas de tarefa 44;
  os botões do painel 44; o campo 44; os cards de push 330×96–99).
- **0 Silkscreen** em lugar nenhum; **0 `opacity < 1`, 0 `opacity()`, 0 `text-shadow`**; **0 PNG / `background-image`
  fora do vidro**; **`danger` ausente dos 8**.
- **Composição a 1:1 (altura útil = caixa − 2×3 de anel − 2×8 de padding)**: A 68 úteis — coluna de texto 62 (termina 8
  acima do fundo); B 88 — bloco 79 (10 acima); C/D 34 — sprite 32 e, no D, duas linhas 31 (1 acima); E 88 — sprite 64 +
  corações 16 + energia 5×(~14) — nada cortado.
- **Escala em toda arte**: `rookie.png` 384² a 64 (÷6) / 48 (÷8) / 32 (÷12) no widget e 64 (÷6) / 128 (÷3) no overlay,
  com `image-rendering:auto` no widget (o Android filtra por bucket de densidade — achado 3) e `pixelated` no overlay;
  `glyph-affection` 32² a 32 (1×); `anim-sleep-z` (quadro 64²) a 64 (1×); `anim-poop-plop` (quadro 64²) a 16 (÷4);
  `favicon.svg` (grade 48) a 48 (1×; o `naturalWidth` de um SVG sem `width` reporta 150 — é o `viewBox` que vale).
- **Menu do overlay**: 342 de largura (340 + 2 de borda = `MENU_SIZE`), **480** de altura com conta e 357 dormindo —
  cabe nos 520 (X4).
- **Fidelidade** (`cmp.py`, 7 pares): mesma sequência de `role` e de `.fo` (OverlayConfig 20, OverlayPrincipal 15,
  OverlayTarefas 14; widgets e pushes 0), mesmos `aria-label` (as diferenças são os `role=img` com nome acessível
  acrescentados aos corações/energia do E e à faixa/criatura `[novo — código]`), mesma copy — as diferenças de texto são
  os nomes de glifo no lugar dos emoji de interface (🔮⚙_✕‹☐🫶🍎🚿💤☀️🔄🔐📱💎♥♡⚡), os "PET" que viraram arte, os emojis da
  escada que saíram da frase (D-F3), a faixa `[novo — código]` no `OverlayPrincipal`, o terceiro strip do `Escada` e as
  **duas remoções da F1** (B sem "Keep it up!", D sem "3/5"/"5/5"/"1/4" — e sem o "—", que também saiu do wireframe
  cinza). `canvas.json` = `scrollHeight` dos 8 `.ab` (3068 · 1753 · 3221 · 1871 · 3605 · 1891 · 2295 · 2987).

## Achados (divergências com o código de hoje — para o `staff-frontend`; o que o RemoteViews NÃO desenha)

1. **Os quatro widgets A/B/C/D não têm fundo**: `@drawable/partner_area` é um PNG de 68 bytes (footgun 4); só o E tem o
   `pet_grid.xml` (verde-terminal `#07170E` + grade `#2BFF95` — herança do DigiApp). → `widget_bg.xml`: `<shape>` solid
   `#071413` + **stroke 3dp `#C68642` chapado** + `corners` = `@android:dimen/system_app_widget_background_radius` (D-F1,
   X7). Sem tema.
2. **O que o RemoteViews NÃO desenha** (e o canvas não finge): Fredoka/Rubik/Silkscreen (`TextView` sem `typeface`
   custom — só Roboto), Material Symbols (ícone = vetor XML, não fonte), `border-image`/9-slice pixel (só nine-patch),
   `color-mix`/token (todo hex é literal no XML — a régua é o `tokens.contrast.test.ts` com o par declarado), opacidade
   por token, animação além do `ViewFlipper`, alvo por região, `prefers-reduced-motion`, recorte de sprite-sheet. **O que
   ele desenha e o canvas usa**: `fontFeatureSettings="tnum"` e `fontFamily="sans-serif-medium"` (o 500 — não `bold`),
   R6. Por isso o widget é **arte + paleta** do visor e nada mais — e é o suficiente.
3. **Sprite a 60/68/36dp com `fitEnd`** → 64/48/32dp, o que cabe a 1:1 (F1). **`sprite_*.png` 384² está em `drawable/`
   (= mdpi: o Android pré-escala ×2,75 num xxxhdpi antes do `ImageView`; `nodpi` NÃO evita reescala em dp — X2).** O
   caminho honesto é o bucket de densidade (384 em `drawable-xxxhdpi` = 96dp; 288/192/144/96 nos outros) ou aceitar o
   filtro (ilustração de 13.631 cores).
4. **A criatura do widget é o rookie GENÉRICO** (`resolveSprite` só conhece 11 `sprite_<stage>.png` — nunca a linha
   kaelen/orrin/thalindra, as 9 da masmorra ou a criatura gerada). O canvas desenha **a criatura do estágio**, a mesma
   nas três superfícies (X2). Saída que o RemoteViews suporta: o plugin grava o PNG da criatura que o app renderiza e o
   renderer usa `setImageViewBitmap` — cobre linha e criatura gerada sem 99 drawables. **Decisão pequena de produto →
   lead (§29).**
5. **Texto a 10/11sp + `shadowColor`** → 13sp/12sp, sem sombra (D-F3).
6. **`heart_full.xml #FF3B5C` (vermelho) / `heart_empty.xml #2B2D4D` (cheio escuro)** → `#E9F5F2` cheio / contorno
   `#AAB6B4` (D-F4). O vermelho é a proibição literal do §12.
7. **`bar_on #2BFF95` / `bar_off #0C2A18`** → `#5FF3E0` / `#071413` com contorno 1dp `#AAB6B4` (D-F5, X1).
8. **"0/5" com zero feitas e "—" com zero tarefas** (`WidgetRenderer.kt` l. 31 e 99: `else "—"`) → a linha some:
   `setViewVisibility(widget_tasks, GONE)` (13.16). **`widgetSemCobranca.contract.test.ts` NÃO trava "0/5" hoje** (só as
   substrings de cobrança e as chaves vetadas) — implementar não exige mudar o teste; exige **acrescentar um `it` que
   reprove `"0/"` e `"—"`** (X10). No A a frase ganha `maxLines=2` quando a linha some.
9. **A escada em PT** e "✨ Dia perfeito!" → EN (13.18) e "Complete day!" (P5); os emojis saem da frase. **As 7 frases EN
   são copy nova → `redator-ux` (V7/X5).**
10. **⚰️ "Don't forget about me today!"** viva em `CHAT_FIXED_PHRASES` (widget D) — veto ao código (STATUS).
11. **Widget D a 40dp**: 34 úteis cabem DUAS linhas (13/12sp), não três — **a linha do contador sai** (F1/V6). As frases
    do pool acima de ~128dp ainda cortam com `ellipsize` ("Whenever you're ready, I'm here." e várias fixas) → teto de ~22
    caracteres no pool, ou o nome sai do D (já está em A/B) — decisão do lead.
12. **Widget B a 110dp**: sprite + 3 linhas = 109 > 88 — **a frase sai** (F1, §12). Exceção de fidelidade ao wireframe,
    declarada → §29.
13. **A faixa do overlay tem 180 px e o pet 96** (0,375× de 256 / 0,25× de 384) → 64 (÷6) na faixa, 128 (÷3) no
    retrato (D-F7); **72 é a proposta de `STRIP_HEIGHT`** (a faixa vive acima da barra, transparente e click-through —
    R1); o balão ao lado (D-F8). **`igni-rookie` sai do overlay**: a cara é a de `rookie.png`, a mesma do widget (X2).
14. **O overlay carrega a paleta roxa do DigiApp** (`style.css` `--sm-primary:#6d5bd0`, `--sm-bg:#f7f6fb`) → `--sm2-*`
    por cópia com teste de paridade (D-F9). **E não tem as fontes** (X8): Fredoka, Rubik e a Material Symbols Rounded
    (152 KB) não estão em `desktop/renderer/` — sem elas o menu cai em Segoe e todo `<span class="ico">` fica vazio. As
    três `.woff2` de `public/fonts/` entram no build do desktop (`desktop/vite.config.ts` + `@font-face` local).
15. **Dormindo = `opacity:.75`** e o 💤 emoji com `opacity` na animação → filtro no MESMO box de 128 + `anim-sleep-z` a
    1× (D-F7, X3).
16. **FX = emoji 18px** (❤️ 🍎 🫧 💤) subindo com alfa; só o banho tem glifo (a 16, 0,5×) → glifos a 32 (1×), `steps()`,
    sem alfa, de cima da cabeça; `glyph-food-32`/`glyph-sleep-32` para a `squad-arte` (D-F10).
17. **Barra de título 🔮 ⚙ _ ✕ em 28** → chama + wordmark + 3 ícones em 44 (D-F11); **o menu é 340×520 (`MENU_SIZE`)** e
    o canvas desenha a 340 — 480 de altura com conta (X4).
18. **`heartsLabel` ❤️ 💗 🖤** (o 🖤 é preto cheio) e "⚡0/5" → `favorite` cheio/contorno, `bolt` só o ícone com zero
    (D-F12).
19. **Fileira 🫶🍎🚿💤 em círculos** → ícones pelados (regra do dono).
20. **`badge N`** em "Today's tasks" → sem dígito (13.17); **☐ caractere** → checkbox SIS.
21. **🔄 🔐 📱 💎 nos botões** → `sync` / `lock` / `arrow_forward` / `diamond` (D-F13); `open_in_new` e `smartphone` fora
    do subset — sem glifo novo; `expand_more` é o compromisso para "Minimize" (R2).
22. **Acento da notificação não declarado** (`color` no FCM / `setColor`) → `#0B6F68` (D-F15); **sem `largeIcon` no FCM
    nativo** → a chama-visor 192, que **sai redonda** no Android 12+ (X9 — a chama cabe no círculo: ponto mais distante
    do centro a 88 < 96).
23. **O `badge` do Web Push é o favicon** (`public/sw.js`, `badge: '/favicon-192x192.png'`): o badge é alfa-only e a
    barra de status pinta o quadrado escuro como **bloco preto**; o Web Push também roda no WebView do APK. →
    `public/badge-96.png` (a chama branca em transparente) — bug de código hoje, independe do canvas (X6).
24. **Overlay × push sem teste de paridade de copy** (V8) e o imperativo das 20h (V7 → `redator-ux`) — ficam
    registrados, como o §16 mandou.
25. **`aria-label` num `<span>` sem `role`** herdado do wireframe (a linha de estado "2 of 3 hearts") — o canvas dá
    `role=img` aos corações e à energia; no código, `aria-label` só em elemento com papel (Loja X6).

## Pendentes

- Nenhum do dono. **Para o lead (§29)**: (a) a criatura REAL no widget via `setImageViewBitmap` (achado 4); (b) as duas
  remoções da F1 — B sem a frase, D sem a linha do contador — como exceção de fidelidade; (c) o pool de frases do D
  (teto de caracteres ou o nome sai). Da `squad-arte`: os 11 `sprite_*` por bucket de densidade (D-F2), `poop_16.png`
  (D-F6), `glyph-food-32`/`glyph-sleep-32` (D-F10), `badge-96.png` alfa-only (X6).

## Fontes

`android/…/WidgetRenderer.kt` (`contextualMessage`, `buildChatPhrases`, `CHAT_FIXED_PHRASES`) · `widget_soulmon*.xml` ·
`drawable/sprite_*.png` (11, 384²) · `heart_full/empty.xml` · `bar_on/off.xml` · `pet_grid.xml` · `partner_area.png` (68 B) ·
`ic_notification.xml` · `SoulmonWidgetPlugin.kt/.ts` · `widgetSemCobranca.contract.test.ts` · `desktop/renderer/menu.html` ·
`desktop/renderer/src/menu.ts` · `phrases.ts` · `main.ts` (`PET_SIZE`, `burst`, `EFFECT_ART`) · `style.css`/`menu.css` ·
`desktop/electron/main.js` (`STRIP_HEIGHT`, `MENU_SIZE`) · `functions/api/_pushCopy.js` · `NotificationManager.tsx` ·
`workers/push-scheduler.js` · `public/favicon.svg` / `favicon-192x192.png` · `src/assets/soulmon/rookie.png`,
`hud/glyph-affection.png`, `fx/anim-sleep-z.png`, `fx/anim-poop-plop.png` ·
`src/styles/tokens.md` §5 (inventário de 102 glifos) · DECISÕES §16 e §18–§26 · HANDOFF-IDENTIDADE §1, §4–§7 ·
PRINCÍPIOS §12 · REGISTRO 13.2 / 13.16 / 13.17 / 13.18 · CLAUDE.md › Widgets, Desktop, Push, Idioma, footguns 2/4/9.
