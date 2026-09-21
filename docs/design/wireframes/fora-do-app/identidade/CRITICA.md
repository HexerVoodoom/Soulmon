# Crítica bloqueante — canvas "Fora do app" (identidade, Fase 2) · rodada 1 · 20/09/2026

> Crítico: `design-critic` · alvo: os 8 `.dc.html` + `canvas.json` + `README.md` (D-F1…D-F15) desta pasta.
> Réguas: HANDOFF-IDENTIDADE §4–§7 · DECISÕES §16 (F1–F5, V1–V8, S1–S5; modal final 13.16/13.17/13.18) e §18–§28 ·
> wireframes cinza de `../` · footgun 2 (RemoteViews) · `widgetSemCobranca.contract.test.ts` · hex do `index.css` (bloco
> ONDA 1) · PRINCÍPIOS §12 · D5 (um sprite por criatura).
> Medido em `http://localhost:8779/docs/design/wireframes/fora-do-app/identidade/<arquivo>.dc` (Chrome, DPR 1, fontes
> carregadas — `document.fonts.check` = true para a Material Symbols Rounded). Nenhum artboard foi editado.

## 0. O que eu medi (e o que bate)

| Régua | Resultado |
|---|---|
| Texto < 12px dentro do telefone (8 artboards) | **0** — bate com o README |
| Alvo < 44 (`role=button/checkbox/textbox`) | **0** — barra de título 44², células de cuidado 56×68, linhas 44, botões 44, cards 330×96–99 |
| `opacity < 1`, `text-shadow`, `danger` | **0** |
| `scrollHeight` dos 8 `.ab` × `canvas.json` | 2738 · 1850 · 2981 · 1877 · 3403 · 1891 · 2348 · 2801 — **iguais** |
| Fidelidade estrutural (strips / `role` × wireframe) | Main 4/4 · Tamanhos 4/4 (+2 `role=img`) · Escada 2→3 (strip novo declarado) · OverlayPrincipal 3→4 (faixa `[novo — código]`, +2 `role`) · OverlayTarefas 3/3, 14/14 · OverlayConfig 3/3, 20/20 · Pushes 7/7, 8/8 |
| Copy dos 7 pushes × `_pushCopy.js` | **literal** (título, corpo, `tag`, 🌙/😴 da copy) |
| Glifos Material × inventário `tokens.md` §5 (102) | os 19 usados estão no subset (`local_fire_department`…`diamond`); `minimize`/`open_in_new`/`smartphone` de fato não estão |
| Arte | `rookie.png` 384² (13.631 cores), `igni-rookie` 256², `glyph-affection` 32², `anim-sleep-z`/`anim-poop-plop` 192×64, `favicon.svg` grade 48, `favicon-192x192.png` 192² — como o README diz; **um sprite por criatura**, as sheets são só FX (D5 ok) |
| Contraste recalculado pelos hex do `index.css` | 13 dos 14 pares batem (16,82 · 8,99 · 13,75 · 5,92 · 16,15 · 8,83 · 13,59 · 7,43 · 11,12 · 7,56 · 12,38 · 1,32 · 6,02/2,85). **Um está errado** — ver X1 |

O que **não** bate está abaixo. O canvas é bom nas páginas 2 e 3 (overlay e push); a página 1 (widgets) tem um erro de
régua que invalida os números que ela mesma anuncia.

## 1. FATAL (não passa sem isto)

### F1 — Os cinco widgets estão desenhados a 1,4× e medidos como se fossem 1× (D-F2, D-F3, achados 3/4/10)

O artboard é 390 CSS px = 390 dp (o telefone inteiro do canvas é 1:1). O widget A é desenhado a **252×126** e legendado
"180×90dp a 1,4" — mas todo número dentro dele é lido como dp/sp: "sprite 96 (÷4)", "nome 14/500", "frase 12",
"corações 16". Numa caixa a 1,4, esses números **são** 68,6 dp · **10 sp** · **8,6 sp** · 11,4 dp:

- a frase e o estágio ficam **abaixo do piso de 12** (o "0 texto < 12" mede o canvas, não o widget); o nome a 10 sp é
  **menor** que os 13 sp que o `widget_soulmon.xml` tem hoje — o canvas "corrige" o texto para um tamanho pior que o
  achado 4 reprova;
- o coração do E a 11,4 dp é menor que os 15 dp de hoje;
- "96 = ÷4 de 384" só existe em px CSS; em dp não é divisor de nada (e ver X2 sobre densidade);
- o D "cabe por 1 px" = três linhas em 34 dp, a 10/8,6/8,6 sp — é exatamente a compressão que §12 e V6 mandam remover,
  desenhada como se coubesse.

E a 1:1 a composição não fecha: A (180×90, anel 3, padding 8) tem 74 dp de altura útil — o sprite 96 **não cabe**;
B (110²) com sprite 64 + nome + linha + frase em 2 linhas = 126 > 98; E (180×110) com sprite 96 e padding 8 = 96 > 94.
Ou seja: o widget que o canvas prova não é o widget que o Android vai desenhar.

**O que precisa:** redesenhar a página 1 a **1:1 dp** (A 180×90 · B 110² · C 40² · D 180×40 · E 180×110, ou o tamanho
real de célula que o lead decidir declarar) e recompor sem esconder nada: A com sprite 64 + 14/12 (quatro linhas = 64 dp
cabem em 74); B remove uma camada (a frase, ou a linha "Rookie · 3/5") em vez de comprimir; D fica com **duas** linhas
(V6 já apontava a linha do contador como candidata); E com sprite 64 ou padding 4. O README passa a dizer sp/dp, e a
medição "0 texto < 12" passa a valer para o widget.

### F2 — O widget D mostra "—" com zero tarefas (13.16, decisão do dono; HANDOFF §7 "não se reabre")

`Tamanhos.dc.html`, terceiro D ("Let's add a task?"): `<span class="ct num">—</span>`. A 13.16 (modal final 15/09) é
"sem a linha do contador no zero" e V1 diz textualmente "o canvas sai do '—'". O README afirma que a 13.16 está
respeitada; o A respeita, o D não. O wireframe cinza carrega o mesmo "—" (a rodada republicada não tocou no D) — o
erro é herdado, mas fidelidade não cobre decisão do dono: **corrigir nos dois** (a linha some; o nome fica sozinho em
cima da frase) e registrar que o `WidgetRenderer.kt` (linhas 31 e 99: `else "—"`) vira `setViewVisibility(GONE)`.

## 2. FIXÁVEL (entra depois de corrigido)

- **X1 · Contraste: um número inventado e um estado sem contraste.** `primary-fill/viewport-bg` no claro é **2,70**
  (`#0B6F68` sobre `#0E2422`), não 11,89 — só é irrelevante porque o XML terá o literal escuro, e o README precisa
  dizer isso em vez do número. E o segmento **apagado** da energia (`viewport-ink` 18%, 1,64:1) não é decoração: é o
  ESTADO "vazio" de um medidor de 5 — sem ≥3:1 (WCAG 1.4.11) a pessoa não vê que existem 5 slots. Contorno 1 dp em
  `#AAB6B4` (8,99) ou mistura ≥40%. Junto: **o `MainClaro` muda o widget** (medido: fundo `#0E2422`, anel `#B0722F` —
  os tokens do visor claro), contra a legenda do próprio artboard ("o widget não muda"). Fixar o `.wg` nos literais
  escuros nos dois temas (é o que o XML vai ter: `#071413`/`#C68642`).
- **X2 · "A criatura real" no widget é ficção do código.** `resolveSprite` só conhece 11 `sprite_<stage>.png` — o
  widget mostra o rookie **genérico**, nunca a linha do jogador (kaelen/orrin/thalindra, os 9 da masmorra, ou a
  criatura gerada). No mesmo canvas o "Pixel" tem duas caras: `rookie.png` no widget, `igni-rookie` no overlay.
  Registrar como achado com a saída técnica que o RemoteViews **suporta**: o plugin grava o PNG da criatura (a mesma
  que o app renderiza) e o renderer usa `setImageViewBitmap` — cobre linha e criatura gerada sem 99 drawables. Até
  lá, o canvas diz "a criatura do estágio". E o achado 3 sobre "escala inteira": `sprite_*.png` 384² está em
  `drawable/` (= mdpi → o Android pré-escala ×2,75 antes do `ImageView`); `drawable-nodpi` a 96² **não** evita
  reescala num `ImageView` em dp. O caminho honesto é bucket de densidade (384 em `drawable-xxxhdpi` = 96 dp; 288/192/
  144/96 nos outros) — ou aceitar o filtro, que o README já admite ser aceitável para ilustração.
- **X3 · Retrato dormindo a 64 no mesmo vidro em que acordado é 128** (`OverlayPrincipal`, D-F7). O wireframe tinha
  o mesmo box 67² nos dois estados; dormir escurece (filtro, ok), não encolhe. → 128 + filtro + o Z a 1× no canto.
- **X4 · Menu 300 × 539 (com conta) vs `MENU_SIZE` 340×520** (`desktop/electron/main.js`): 19 px além da janela, e a
  largura 300 diverge de 340 sem achado. Declarar o `MENU_SIZE` novo (e caber) ou caber em 520.
- **X5 · Escada, degrau 7 quebrado**: título "You started" e a cauda `· that already counts"` colada à linha PT
  (o `—` cortou a frase). No A a mesma frase sai inteira. E as 7 frases EN `[novo]` são **copy nova** (o wireframe F3
  só previa glosa) → passar pelo `redator-ux` como V7.
- **X6 · Web Push: o `badge` é o favicon** (`public/sw.js`, `badge: '/favicon-192x192.png'`). O badge do Chrome/
  Android é alfa-only (a barra de status pinta a silhueta): o quadrado escuro com chama vira um **bloco preto**. D-F14
  cobre só o FCM (`ic_notification.xml`); o Web Push também roda dentro do WebView do APK. → badge mono 96² (a chama
  branca em transparente) + linha nos achados.
- **X7 · Anel do widget: o canvas desenha gradiente + anel interno `ring-deep` + sombra; D-F1 promete um `<shape>` com
  `stroke 3dp`** — stroke de `<shape>` é chapado. Ou `<layer-list>` (shape externo com `<gradient>` + shape interno
  `#241507` + o vidro) ou declarar que o XML é chapado e o canvas mostra a peça do app. E o raio: Android 12+ recorta o
  widget em `@android:dimen/system_app_widget_background_radius` (≤ 28 dp) — usar o dimen, não 12/20 literais.
- **X8 · O overlay não tem as fontes.** D-F9 copia tokens; Fredoka/Rubik/Material Symbols (152 KB) não estão em
  `desktop/renderer/` — sem elas o menu cai em Segoe e os `<span class="ico">` ficam vazios. Achado a acrescentar
  (bundle das 3 woff2 no build do desktop).
- **X9 · Ícone grande do push num "mini-visor" quadrado**: Android 12+/Pixel recorta o `largeIcon` em **círculo**; o
  canto 4 e a moldura não sobrevivem, a chama centrada sim. Declarar e conferir a margem da chama no `favicon-192`.
- **X10 · README achado 7 está errado**: `widgetSemCobranca.contract.test.ts` não trava "0/5" (só as substrings de
  cobrança e as chaves vetadas) — implementar 13.16 não exige mudar o teste; exige mudar o `WidgetRenderer.kt` e
  acrescentar um `it` que reprove `"0/"` e `"—"`.

## 3. RUÍDO (registrar, não trava)

- R1 · A faixa: README "390×72 = a altura da barra de tarefas"; o CSS é 358 e a faixa vive **acima** da barra (workArea),
  transparente e click-through. 72 é uma altura nova para o `STRIP_HEIGHT`, não a barra. Os três `glyph-affection`
  (x 20–96) sobrepõem a criatura (x 16–80) — subir de cima da cabeça, não de dentro do corpo.
- R2 · `expand_more` como "Minimize" lê "expandir"; aceitável por falta de `minimize`/`remove` no subset — registrar
  que é o glifo de compromisso, e o `aria-label` já diz o certo.
- R3 · A chama do push no card escuro está em `#5FF3E0`; o acento real é `#0B6F68`, que o Android reajusta na bandeja
  escura (não vira `#5FF3E0`). Legenda, não erro.
- R4 · Cocô 32 sobre a criatura 48 no C cobre 2/3 da altura; é 0,5× e é o único tamanho inteiro que cabe — fica.
- R5 · `.wg .st` e o coração vazio usam `color-mix` no canvas; o literal `#AAB6B4` está declarado — ok.
- R6 · `tabular-nums` no XML = `android:fontFeatureSettings="tnum"`, e 500 = `sans-serif-medium` — os dois funcionam em
  RemoteViews; vale escrever nos achados para o `staff-frontend` não cair em `bold`.
- R7 · Widget E: `role=img` nos corações/energia é o certo (a diferença de fidelidade está declarada).

## 4. Veredito por decisão

| # | Veredito | Por quê |
|---|---|---|
| D-F1 | **ok com X7** | Vidro + anel são `<shape>`/`<layer-list>`; o gradiente e o raio precisam ser ditos |
| D-F2 | **VOLTA (F1, X2)** | 96/64/48 são px CSS a 1,4, não dp; "nativo em nodpi" não evita reescala — bucket de densidade |
| D-F3 | **VOLTA (F1)** | 14/12 desenhados são 10/8,6 sp; abaixo do piso e abaixo do código de hoje |
| D-F4 | ok | Cheio `viewport-ink`, vazio contorno `#AAB6B4` (8,99) — VectorDrawable com `strokeColor` |
| D-F5 | **ok com X1** | Aceso `#5FF3E0` 13,75; apagado a 1,64 é estado, não decoração → ≥3:1 |
| D-F6 | ok | FrameLayout + ImageView; `poop_32.png` avulso pedido |
| D-F7 | **VOLTA parcial (X3)** | 128 no retrato ok; dormindo a 64 é invenção fora do wireframe |
| D-F8 | ok (R1) | Balão ao lado cabe (14+30 em 72); ajustar o número e a posição dos glifos |
| D-F9 | ok + X8 | Tokens por cópia com teste; falta a cópia das fontes |
| D-F10 | ok | Glifos a 1×, `steps()`, sem alfa |
| D-F11 | ok (R2) | Chama + wordmark + 3 alvos 44² medidos |
| D-F12 | ok | `favorite` 1/0 em `ink`, `bolt` só o ícone no zero (13.16), `restaurant` ×N |
| D-F13 | ok | `translate`/`sync`/`lock`/`arrow_forward`/`diamond` `#C9A7FF` medido (7,56) |
| D-F14 | ok + X6 | `ic_notification.xml` é silhueta — mas o badge do Web Push não é |
| D-F15 | ok (R3, X9) | 6,02 sobre bandeja clara bate; o `largeIcon` vai sair redondo |

## 5. Veredito final

**VOLTA — rodada 2 necessária.** 2 fatais, 10 fixáveis, 7 ruídos.

O overlay e os pushes passariam numa crit de staff (fidelidade, alvos, copy literal, glifos no subset, contraste
recalculado batendo); o que os segura são X3/X4/X6/X8, todos de uma linha. A página dos widgets **não** passa: a
tese "o widget É o visor" está certa e é desenhável no RemoteViews, mas foi provada numa caixa a 1,4× com números
lidos a 1× — o que o README anuncia como "0 texto < 12" e "escala inteira" não descreve o widget que o Android vai
desenhar, e o D repete o "—" que o dono já tirou.

**A correção de maior alavanca:** redesenhar os cinco widgets a 1:1 dp e recompor removendo camadas (§12), com o
README em sp/dp. Feito isso, F2, X1 e X2 são legendas e uma linha de markup.

**Para o lead (`DECISÕES` §29):** (a) X2 é decisão de produto pequena com custo técnico baixo — o widget mostrar a
criatura de verdade via `setImageViewBitmap`; (b) V6 volta como F1: o D de 40 dp tem espaço para duas linhas, não três;
(c) X6 é bug de código hoje (badge do Web Push), independe do canvas.
