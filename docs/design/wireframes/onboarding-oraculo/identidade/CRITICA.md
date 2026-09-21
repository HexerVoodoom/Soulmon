# Crítica — canvas de identidade ONBOARDING-ORÁCULO (rodada 1)

> `design-critic` · 20/09/2026 · bloqueante · sobre os 13 artboards de `docs/design/wireframes/onboarding-oraculo/identidade/`
> (12 `.dc.html` + `MainClaro`, `canvas.json`, `README.md`), servidos em `http://localhost:8780/…` e medidos no browser
> (Chromium, DPR 1, `getComputedStyle` + `getBoundingClientRect` em todos os nós do `.phone` dos 13 artboards, via iframe
> na mesma origem) · contraste recalculado pelos hex do `src/index.css` (bloco ONDA 1, escuro + `[data-theme=light]`).
> Critérios: HANDOFF-IDENTIDADE §4–§7; DECISÕES §17 (R1–R5, V1–V8, S1–S4) e §18–§29; REGISTRO §13 (13.1, 13.19); tese do
> Visor; regras do Oráculo do `CLAUDE.md`; D5; alvo ≥ 44; texto ≥ 12; críticas anteriores dos 13 canvases de identidade.

## 0. O que a medição confirmou (o README não mente)

| Régua | Resultado medido |
|---|---|
| Texto < 12px dentro do `.phone` | **0** nos 13 |
| Alvo < 44 (`button/checkbox/textbox/radio/link/summary`) | **0** — opções 330×44, campos 44, voltar 44×44, × do convite 44×44, primários 48, convite 280×113; a única exceção é a 2ª linha da cidade a **45** (arredondamento, não defeito) |
| `opacity < 1`, `text-shadow` | **0** nos 13 (o inerte é por superfície/forma — D-Q3 comprovada) |
| `<img>` fora de `.screen` | **0**; os únicos `<img>` são `forming.png`, `dormant.png`, `kaelen-rookie.png`, todos **128×128** dentro de um `.screen` de **192**, `image-rendering: pixelated` |
| Silkscreen | **0** nós no canvas inteiro (D-Q10 comprovada) |
| Vazamento dos 390 | **0** |
| Fontes | Rubik, Fredoka, Material Symbols Rounded, Cascadia Mono (o `--sm2-font-mono` da data/hora) — nada fora do sistema |
| Glifos | `arrow_back, auto_awesome, check, close, schedule, sync` — todos com `aria-hidden="true"` (o nome acessível do convite e do `role=status` não lê a ligature) |
| `role=alert` | só na `Bifurcacao`: filete **3px `#EBBE84`** (`gold-ink`), texto `ink` — âmbar, nunca `danger`. O muro de idade não tem `role` nenhum (guarda (b)) |
| Barra do ritual | `role=progressbar` "Ritual progress" com `aria-valuenow` 3 / 14 / 17 / 92 / 94 / 97 — bate com a fórmula R2 (`/36`: 1, 5, 6, 33, 34, 35) em `Main`, `Favorita`, `Ritual`, `Gerando`, `Reveal`, `Cadastro`; **não bate no `RevealDemo`** (ver X4) |
| Contraste (17 pares × 2 temas) | recalculado hex a hex: **todos os 34 números da tabela do README conferem** (piso: `primary-ink/primary-soft` claro 5,21; `viewport-ring/bg` claro 3,66 não-texto; `line/surface` 1,32/1,25 decorativo, aceito no Sistema F2). Nenhum texto < 4,5; nenhum não-texto < 3 |
| Pulso do casulo | `@keyframes cocoon` = `translateY(0 → -4px → 0)` em `steps(2,end)` — **posição, nunca opacidade**; `prefers-reduced-motion: reduce` → `animation: none` (D-Q11 comprovada no `Gerando`; ver X3 para o `RevealSemSprite`) |
| Fidelidade (sequência de `.fo`, `role`, textos) | conferida nos 4 pares sensíveis (`Teste`, `Reveal`, `RevealDemo`, `RevealSemSprite`): a copy EN é idêntica; as diferenças são as declaradas no README (ligatures, anotações que viraram desenho, `role=img` do vidro, a linha `[novo — copy proposta]`) |

Regras do Oráculo (`CLAUDE.md`), tela a tela: 6 perguntas com dica de ORIGEM e avanço ao escolher ✓ · bifurcação declarada
final ("This choice is final — there's no answering the test later") ✓ · reveal só nome + epíteto + descrição, sem eixo, sem
pontuação, sem prompt ✓ · `Gerando` como ritual (o casulo no vidro, `role=status`, sem cronômetro, sem barra de %) ✓ · muro de
idade sem erro vermelho e com saída única ✓ · batismo pré-preenchido no reveal ✓ · D5 (um sprite, pulso por posição, nunca por
quadros) ✓.

## 1. FATAL (o canvas volta)

### F1 — `RevealDemo`: a 13.1 exige "agora não" com **peso de primário**; o canvas declara "nenhum primário na tela"

- Onde: `RevealDemo.dc.html`, o botão "Continue with a demo character" (`.fo` 3, 356×48, **`outline`**) e o rodapé, que
  escreve "nenhum primário na tela: quem decide é a pessoa".
- Regra: REGISTRO 13.1 — *"'agora não' com peso de primário"* — e a 13.19, que diz que **é ali** que a 13.1 acontece. As duas
  estão em HANDOFF §7 ("regras que não se reabrem"). O wireframe aprovado (R4) repete a letra: *"'Not now'/'Continue…' with
  the weight of the primary"* — e já a contrariava desenhando `ghost`; a identidade subiu para `outline` e continua abaixo do
  que a decisão manda. O canvas trocou uma regra registrada por um princípio próprio ("nenhum primário").
- Por que é fatal e não fixável de gosto: a 13.1 tem uma régua de morte escrita (conversão no reveal demo < pós-value-moment)
  e a tela é a **única** superfície da decisão. Se a saída grátis não tiver o peso do primário, a medição da 13.1 vai medir
  outra coisa (uma oferta com saída mais fraca do que o decidido). O padrão que a 13.1 cita (Garmin) é exatamente este: o
  cartão comercial é secundário, o "continuar sem" é o botão principal da tela.
- Correção: "Continue with a demo character" = **`primary`** 48 (o `on-primary/primary-fill` já passa 12,38 / 6,02). O convite
  `.nudge` 280 e o × 44 ficam como estão. Nada estrutural muda (a mesma peça, outra classe).

## 2. FIXÁVEL (aplicar antes do checkpoint)

### X1 — D-Q8: a criatura pronta **visível** no `RevealDemo` contradiz a letra da 13.19 e o `DEMO_PICK`

- Onde: `RevealDemo.dc.html`, `kaelen-rookie.png` 128 no vidro 192², `role=img` "Pyraka".
- O que quebra: (a) 13.19: *"a criatura própria (sprite, árvore) só pagando"* e o "Sai" do wireframe aprovado (§17): *"O
  sprite e a árvore no reveal demo — só pagando (a silhueta é o convite, PRINCÍPIOS §9)"* — o wireframe **decidiu** silhueta,
  não deixou em aberto; (b) o fluxo: o README (achado 10) manda "dispensar → `DEMO_PICK`" — a pessoa vê "Pyraka, your soul's
  creature" com o rosto inteiro e no passo seguinte escolhe entre **6** personagens; se escolher outro, o reveal mentiu. Para o
  desenho ser verdadeiro, a leitura teria que **atribuir** o personagem pronto e o `DEMO_PICK` (ONB-20, canvas do funil,
  §23 fechado) teria que sair — decisão de produto que ninguém registrou; (c) a oferta perde o objeto: "Want a creature that
  is only yours?" logo abaixo de uma criatura inteira, já entregue. O padrão do próprio app para "o que você ainda não tem" é
  a silhueta por `mask-image` (Pet D-P7, Bestiário, nós bloqueados da Evolução) — e é a alternativa que o próprio D-Q8 registra.
- Correção: a **mesma peça com `mask-image`** (silhueta em `color-mix(viewport-bg 58%, viewport-ink)`, como o Dex do Pet), nome +
  epíteto + "You said…" mantidos (a leitura é para todos — 13.19). Se o lead preferir manter a criatura visível, então o
  achado 10 tem que virar "a leitura atribui; `DEMO_PICK` sai" e ir ao dono — não cabe no canvas.

### X2 — `Reveal` (pago): a âncora da oferta vive **dentro** do `.phone` com `.fo` 3 e 4

- Onde: `Reveal.dc.html`, o `.nudge` 280 + × 44 depois de "Hatch Pyraka", marcados como foco 3 e 4.
- O que quebra: o próprio artboard escreve "belongs to the REVEAL DEMO, never to this paid reveal". A ordem de foco é a spec
  que o `staff-frontend` lê: o reveal pago tem **2** paradas (campo, Hatch), o desenho declara 4. O wireframe fez o mesmo
  (fidelidade preservada), mas quando ele foi desenhado o `RevealDemo` ainda não existia; hoje a âncora é duplicata do
  artboard ao lado.
- Correção: tirar a âncora do `.phone` (vira nota abaixo da dobra ou some — o `RevealDemo` já a prova). Sem `.fo` 3–4 no
  reveal pago. É anotação, não estrutura.

### X3 — `RevealSemSprite`: o casulo **não pulsa** (o README diz que pulsa)

- Onde: `RevealSemSprite.dc.html`. O `<img class="pulse">` existe, mas a regra é `.wait .screen img.pulse{animation:…}` — copiada
  do `Gerando` — e este artboard **não tem `.wait`**: medido, `animationName: none`. O `prefers-reduced-motion` também só cobre
  `.wait`.
- Correção: seletor sem `.wait` (ou dar `.wait` ao vidro do cartão em espera) + a mesma regra de reduced-motion. D-Q11 fica
  provada nos dois lugares em que o casulo aparece, não só num.

### X4 — `RevealDemo`: barra a **94 %** — a fórmula R2 não produz esse número no caminho demo

- Onde: `aria-valuenow="94"` no `RevealDemo`. O demo não faz os 20 itens (R2: o denominador desconta o bloco) e não chega ao
  `REGISTER` (vai a `DEMO_PICK`). 94 é o valor do reveal **pago**, copiado.
- Correção: ou o número que a fórmula dá para o caminho curto (reveal = 14/16 = **88 %**, se a barra continuar medindo até
  `REGISTER + 1`), ou registrar no rodapé que a barra do demo é uma pergunta em aberto para o achado 10 (o `REVEAL_DEMO` não
  existe no código, então o denominador do demo é decisão nova). O que não pode é a spec carregar um número que nenhuma
  fórmula produz.

### X5 — D-Q5: a bifurcação com primário no teste contradiz a regra que o próprio canvas usa no `RevealDemo`

- Onde: `Bifurcacao.dc.html` — "Answer 20 more questions" `primary`, "Reveal my Soulmon now" `outline`.
- Julgamento pedido (§17 V3, adiado para "o crítico com o desenho pronto"): **igualar**. Razões: (1) a decisão é declarada
  **final** na própria tela; num par sem volta em que nenhuma porta é "certa", o primário é a recomendação implícita
  (efeito-padrão), e a linha do Oráculo é "sem empurrão" — o guarda aceitou "custo declarado", mas custo declarado + botão
  cheio ainda é empurrão de forma; (2) o canvas, três artboards adiante, recusa o primário no `RevealDemo` com o argumento
  "quem decide é a pessoa" — a mesma regra vale aqui ou lá, não só onde convém (e lá a 13.1 já resolve, ver F1); (3) HIG da
  Apple e Material: em alertas com duas ações de valor equivalente e sem uma "provável", nenhuma leva o estilo de destaque
  (o destaque é para a ação esperada, não para a mais longa).
- Correção: as duas portas em **`outline`** 48, empilhadas, o teste primeiro (é o caminho mais longo, a ordem já informa).
  Vira achado 9 para o `staff-frontend` (o código dá `primary` ao teste). Não é fatal: o guarda (c) passou e o texto declara o
  custo — mas com o desenho pronto a resposta da V3 é esta.

### X6 — README: duas afirmações medidas como falsas

- "**0** `background-image` fora de `.screen`": o `.ring` (anel do vidro) usa `linear-gradient(…)` + `box-shadow` com
  `rgba(0,0,0,.35)` fora do `.screen` em `Gerando`, `Reveal`, `RevealDemo` e `RevealSemSprite` (×2). É a composição do anel da
  Home/Pet/Estatísticas (vetor, sem PNG, aceita lá) — o problema é a frase, não o anel. Escrever "nenhum PNG/`<img>` fora do
  vidro; o anel é gradiente vetor".
- "O casulo pulsando" no `RevealSemSprite` — ver X3.

## 3. RUÍDO (registrar, não bloqueia)

- R1 — `Gerando`: o `sync` 24 é estático no canvas; o README o chama de "o único movimento fora do vidro (D7)". Ou o
  artboard gira (`steps()`, com reduced-motion) ou o rodapé diz que o giro é do código. Hoje o artboard não prova D7.
- R2 — `canvas.json`, título do `Teste`: "o 1º TEM voltar (para a bifurcação)"; nem o wireframe nem a identidade desenham
  esse voltar (o rodapé da identidade explica que o template é o do ritual). Coerente com o código (`step === DEEP_START →
  REFINE_OFFER`), mas o título promete um desenho que não está lá.
- R3 — `RevealSemSprite`: `role="status"` num `<span class="screen">` com `aria-label` e **sem texto** — um live region sem
  conteúdo nunca anuncia nada; a intenção ("The creature is taking shape") tem que ser texto (visualmente oculto) dentro da
  região, como o `role=status` do `Gerando` faz. Fica para o `staff-frontend` (é implementação), mas o artboard deveria
  mostrar o texto oculto como o funil mostra o `aria-busy`.
- R4 — `RevealSemSprite` não desenha o batismo (o wireframe também não): é folha de estado do cartão, ok — mas a frase
  `[novo — copy proposta]` está no lugar certo (sob o vidro, 12 `muted`, sem `role`); o `redator-ux` fecha o texto.
- R5 — `Nascimento`: a 2ª linha da cidade mede 45px (a 1ª 44) — meia linha de `line` somando; cosmético.
- R6 — `Main`/`Upgrade`: o voltar no passo 1 aparece em ambos; no `Upgrade` ele sai do ritual (R5), no `Main` volta à intro
  do funil — o rodapé do `Main` deveria dizer para onde, como o do `Upgrade` diz.
- R7 — D-Q7: o epíteto "Fire essence · Blacksmith" em `gold-ink` traz a **profissão** do class-system para o cartão. R3 do §17
  aprovou a linha ("‹essence› essence · ‹profession›"), então está dentro — só registro que é a única palavra do reveal que
  cheira a "ficha" (T8 problema 1 segue aberto, como o §17 já anota).

## 4. Veredito por decisão

| # | Decisão | Veredito | Nota |
|---|---|---|---|
| D-Q1 | Barra = `.meter` SIS-07 8px, anel `muted`, `primary-fill` | **Confirmada** | `primary-fill/surface-2` 9,43 / 5,28; anel 6,30 / 5,09; `aria-valuenow` pela fórmula R2 (exceto X4) |
| D-Q2 | Voltar = `arrow_back` 24 pelado num alvo 44, rótulo no `aria-label` | **Confirmada** | 44×44 medido em 7 artboards; `aria-hidden` no glifo; regra do dono (ícone nunca em box) |
| D-Q3 | Inerte por superfície/forma, nunca opacidade | **Confirmada** | 0 nós com `opacity < 1`; `aria-disabled` + fora do Tab no "Continue"/"Hatch"; o campo da hora tracejado |
| D-Q4 | Opção escolhida TONAL (`primary-soft` + anel `primary-ink`) | **Confirmada** | 7,69 / 5,21 sobre o soft; `aria-pressed` mantido; nenhuma placa cheia onde escolher avança |
| D-Q5 | Bifurcação: primário no teste, `outline` no reveal | **Volta (X5)** | Igualar as duas portas em `outline`; a V3 pedia esta resposta com o desenho pronto |
| D-Q6 | Espera = casulo `forming` no vidro 192², corvo sai | **Confirmada** | 128 no 192, corte 0 %; `role=status` com texto; o corvo é marca (funil D-O4) |
| D-Q7 | Epíteto em `gold-ink` 12/500 | **Confirmada** | 8,84 / 5,87; a única cor quente do cartão; R3 aprovou a linha (R7) |
| D-Q8 | Criatura pronta visível no `RevealDemo` | **Volta (X1)** | Silhueta por `mask-image` (a alternativa já registrada); manter visível exige decisão de produto sobre o `DEMO_PICK` |
| D-Q9 | Casulo dentro do vidro do cartão; `dormant` após o teto; nunca `glitch` | **Confirmada** | Medido: só `forming` e `dormant` no artboard; `dormant` é D1, não arte de reserva (S4) |
| D-Q10 | Nenhuma Silkscreen no canvas | **Confirmada** | 0 nós medidos |
| D-Q11 | Pulso por posição em `steps(2)`, reduced-motion parado | **Confirmada com X3** | Provada no `Gerando`; no `RevealSemSprite` o seletor não casa — corrigir |
| D-Q12 | `role=alert` âmbar; muro de idade sem alerta | **Confirmada** | 3px `#EBBE84`, texto `ink`; muro = título + linha + um primário, sem `role`, sem vermelho |

## 5. Veredito final

**VOLTA** — 1 fatal (F1), 6 fixáveis (X1–X6), 7 ruídos. A base está certa e medida: AA nos dois temas confere hex a hex,
zero opacidade, zero pixel fora do vidro, escala inteira em toda arte, alvos e texto no piso, todas as regras do Oráculo
respeitadas, fidelidade estrutural aos 12 wireframes. O que trava o carimbo é a única tela nova do canvas — o `RevealDemo`,
que é a casa da 13.1 e da 13.19 — desenhada contra a letra das duas decisões (F1 e X1). A correção de maior alavanca é
**F1**: "Continue with a demo character" em `primary` (uma classe) — resolve a 13.1 e, de quebra, a tensão com a
bifurcação (X5), porque o canvas passa a ter uma regra só: em decisão da pessoa, o primário é a saída que não custa.

Passa numa revisão de staff? **Ainda não** — passa na rodada 2 com F1 + X1–X4 aplicados (X5 é decisão do lead sobre a V3,
recomendação acima; X6 é texto). Re-carimbo por medição, não por leitura.
