# Canvas "Onboarding-oráculo" — identidade (Fase 2, o 14º e último canvas) · rodada 2

> Dono: `soulmon-visual-designer` · 20/09/2026, rodada 2 no mesmo dia (após `CRITICA.md`: VOLTA — F1, X1–X6 aplicados; R1, R3, R6 aplicados; R2, R4, R5, R7 registrados) · HANDOFF-IDENTIDADE §1, §4–§7 · base: canvas **Sistema** aprovado
> (`../../sistema/identidade/`, DECISÕES §18 — P1 espaço 4/8/12/16/24/32 + 2, **P2 = (a)** 256² a 128 CSS, **P3** nav 32),
> **Home** (§19), **Atividades** (§20 — tinta nunca alpha, o gerador reprova `opacity < 1`), **Rituais** (§21 — escala INTEIRA
> de toda arte no vidro), **Pet** (§22 — heroína 128 em vidro 192², D-P1 seleção tonal), **Onboarding-funil** (§23 — a paleta do
> visor num escopo, a chama do kit, `role=alert` âmbar, a 13.19 citada), **Evolução** (§24 — D1 placeholders `dormant/forming/glitch`
> no vidro), **Estatísticas** (o `BirthCard` = sprite 128 em vidro 192² com anel, D-S4) e as `CRITICA.md` anteriores.
> Estrutura: os 12 wireframes cinza aprovados de `../` (DECISÕES §17 R1–R5 / V1–V8 / S1–S4 + REGISTRO 13.19 = `RevealDemo`) e as
> linhas `ONB-21`→`ONB-38` + `ONB-44` do `INVENTARIO-WIREFRAMES.md` §1.3.
> **Cada artboard = o wireframe de mesmo nome com a identidade aplicada** — mesma hierarquia, mesmos estados, mesma copy
> (EN; PT no rodapé), mesma ordem de foco. Nada estrutural mudou; o que "pediu" para mudar está no rodapé como achado.
> Escuro em todos; claro só no `MainClaro` (decisão 3 do dono).

## Como abrir

O `<style>` de cada `.dc.html` é o bloco do `Sistema/Main.dc.html` **copiado** (tokens `--sm2-*`, átomos, rodapé) + o bloco
`HOME (composição)` (anel/vidro, `.strip`) + o bloco `ATIV (composição)` (`.dobra`) + o bloco `ONB (composição)` do funil (campos,
a linha de caixa, o `role=alert` âmbar) + um bloco `ORÁCULO (composição)` só de layout (a barra do ritual, o passo, as opções tonais,
o casulo no vidro, o cartão de nascimento, o batismo, o convite) — nenhum token novo, nenhum literal de cor fora do vidro. As mesmas
podas da rodada 2 de Atividades e o mesmo `guard()` no gerador (reprova `opacity < 1`, `text-shadow`, `.pix`/`<img>` fora do vidro e
`danger` dentro do telefone).
Imagens e fontes por caminho relativo ao repo. Servir a raiz do repo:
`npx -y serve -l 8780 D:/Soulmon/repo` → `http://localhost:8780/docs/design/wireframes/onboarding-oraculo/identidade/Main.dc.html`.
Gerador (fora do repo, no scratchpad da sessão): `gen_oraculo.py` (importa `gen_ativ_head.py`, o `STYLE_ATIV` de `gen_ativ.py` e o
`STYLE_ONB` de `gen_onb.py`) — os `.dc.html` são a fonte commitada. Medição: `measure_oraculo.mjs` + `pos_ora.mjs`; diff: `cmp.py`.

## O que cada artboard prova

| Artboard | Id | Prova |
|---|---|---|
| `Main.dc.html` | ONB-22 · 36 | **O passo como aparelho**: a barra do ritual = `.meter` SIS-07 a 8px (`primary-fill` sobre `surface-2`, anel `muted` 1px — não-texto 6,30/5,09); o `StepShell` = título Fredoka 20 + o porquê 12 `muted`; o campo SIS-03 44; a nav = **`arrow_back` 24 pelado** num alvo 44 em `ink` (o wireframe desenhou um quadrado — ícone nunca em box) + "Continue" primário 48 **inerte por superfície** (`surface-2` + `muted`, `aria-disabled`, fora do Tab, sem número). Sem selo, sem skip link. |
| `MainClaro.dc.html` | ONB-22 claro | O mesmo DOM sob `[data-theme=light]`: `ink` `#0E2422` / `bg` `#F1F7F5` 14,96; `muted` 5,35; `primary-fill` `#0B6F68` na barra; o inerte 5,09. |
| `Nascimento.dc.html` | ONB-23 · 21 · 24 · 25 | Data e hora em `--sm2-font-mono` `tabular-nums`; a hora "não sei" = campo **inerte por FORMA** (tracejado 1px `muted` + tinta `muted` + `aria-disabled`, nunca `opacity .5`) com `schedule` 20; a caixa 24 marcada (`primary-fill` + `check` 18 `on-primary`) num alvo 44; os resultados da cidade = card SIS-03 com linhas de **44** (o wireframe: 36) separadas por `line`; o vazio = uma frase 12 `muted`. **O muro de idade** = Fredoka 20 + uma linha + UM primário "Back to start" — sem `role=alert`, sem ícone, sem âmbar, sem vermelho (guarda (b)). |
| `Favorita.dc.html` | ONB-26 | Campo 44 + caixa vazia (anel 2px `muted`) com o rótulo 14; "Continue" VIVO — a última tela com "Continue". |
| `Ritual.dc.html` | ONB-27 | As 5 opções = cards SIS-03 de 44 com anel `muted` 1px e texto 14 centrado; a escolhida é **TONAL** (`primary-soft` + anel 2px `primary-ink` + tinta `primary-ink` 500 — Pet D-P1; nunca placa cheia: não há primário, escolher avança); a dica de ORIGEM 12 `muted` centrada; o voltar `[novo]` = `arrow_back` 24 pelado num alvo 44, sozinho na linha. |
| `Bifurcacao.dc.html` | ONB-28 · 29 | Título Fredoka 20 + "This choice is final" 12 `muted`; o texto 14 `ink`; **as duas portas em `outline`** 48, o teste primeiro (X5 — mesmo peso: numa decisão final sem porta "certa" o primário seria recomendação implícita; sem dourado, sem badge, sem preço); o erro = `role=alert` com filete 3px **`gold-ink`** e texto `ink` (âmbar: a falha não é da pessoa). |
| `Teste.dc.html` | ONB-30 | Os 4 formatos com o MESMO aparelho: título Fredoka 20 (o item), hint 12 com o formato, os botões empilhados = cards 44 (5/5/2/3), a escolhida tonal — um radiogroup tonal por formato, nunca "1–5", nunca placa cheia; `role=button` + `aria-pressed` mantidos (semântica é estrutura). |
| `Gerando.dc.html` | ONB-31 | **A espera é ritual**: o `role=status` = o casulo — placeholder **`forming`** (D1, o cristal aceso) 256² a **128** num **vidro 192²** com anel, pulsando DENTRO do vidro por posição (2 quadros `steps()`, nunca opacidade; reduced-motion = parado, o anúncio fica); `sync` 24 `primary-ink` **girando** (R1: o único movimento fora do vidro, D7 — rotação com easing, reduced-motion parado); a frase 14 `ink`. O corvo a 64 do código sai (é a marca, não a criatura). |
| `Reveal.dc.html` | ONB-32 | Eyebrow 12/500 caixa alta; o **`BirthCard`** = a MESMA peça das Estatísticas (D-S4): sprite 256² a **128** em vidro **192²** com anel (`role=img` com o nome), "BORN · SEPTEMBER 15" sem ano, o nome Fredoka 24, o epíteto 12/500 em **`gold-ink`** (a linha de essência), "You said…" 12 `muted`; a descrição num card 14; o batismo = rótulo 12 + campo 44 **pré-preenchido** com anel de foco + a frase 12; "Hatch Pyraka" primário. Só nome + descrição (T8): nenhum eixo, nenhuma pontuação, nenhum prompt. **A âncora da oferta do wireframe saiu do telefone** (X2): o reveal pago tem 2 paradas de foco (nome, Hatch); o card 13.1 vive no `RevealDemo`. |
| `RevealDemo.dc.html` | ONB-44 | **13.19**: o MESMO cartão, com a criatura em **SILHUETA** (X1: a mesma peça por `mask-image` em `color-mix(viewport-bg 58%, viewport-ink)`, Pet D-P7 — o sprite só pagando; `role=img` "Pyraka, silhouette"), sem "Born" (o demo nasce no cadastro), nome + epíteto + "You said…"; a descrição; o convite = `.nudge` 280 com `auto_awesome` `gold-ink` e o × 44; **"Continue with a demo character" PRIMÁRIO** (F1 — 13.1: "agora não" com peso de primário; o card comercial é o secundário); a barra a **88 %** (X4: 14/16 no caminho curto — o denominador do demo é decisão do achado 10). Não existe no código. |
| `RevealSemSprite.dc.html` | ONB-33 | Esperando: o casulo `forming` a 128 **no vidro do próprio cartão** (`role=status` "The creature is taking shape", pulsando), nome + epíteto. A região `role=status` leva o texto visualmente oculto (`.vh`, R3) — live region sem conteúdo não anuncia; o casulo pulsa aqui também (X3: seletor `.screen img.pulse`, medido `animationName: cocoon`). Teto estourado (D9): o placeholder **`dormant`** (o cristal apagado — "ainda vai nascer") no mesmo vidro, sem `role`; uma linha 12 `muted` `[novo — copy proposta]` "The drawing is still being made — it arrives on its own, later." (§17 achado e / V6 — o `redator-ux` fecha a copy; o lugar e o tom estão aqui); **nunca `glitch`** (rachado = falhou, pode pedir de novo — aqui não há "retry"); nunca arte de reserva (S4). |
| `Cadastro.dc.html` | ONB-35 | Título Fredoka 20 sem hint; campo 44 com rótulo 12 acima e a explicação 12 `muted` abaixo; "Hatch Pyraka" inerte por superfície + a frase do que falta 12 `muted` (sem `role`, sem âmbar); a barra a 97 %, nunca 100. |
| `Upgrade.dc.html` | ONB-37 · 38 | O mesmo passo 1 do `Main` sem intro e sem cadastro (barra a 3 % desde o 1º passo); a saída pela metade e o fim como notas 12 (registro, não tela). |

**Medido no DOM (13 artboards, `getComputedStyle` + `getBoundingClientRect` em todos os nós do `.phone`, Chromium via
Playwright em `localhost:8780`, DPR 1):** **0** nós de texto < 12px dentro do `.phone` · **0** elementos vazando a largura de 390 ·
**0** alvos < 44 entre `button/checkbox/textbox/radio/link/summary` (opções 44; linhas da cidade 44; voltar 44; × do convite 44;
convite 56) · **0** Silkscreen fora de `.screen` (**nenhuma Silkscreen no canvas** — dentro dos vidros só há arte) · **0** nós com
`opacity` < 1, **0** com `opacity()` em `filter`, **0** `text-shadow` · **0** PNG/`<img>` fora de
`.screen` (os únicos `<img>` são `forming.png`, `dormant.png` e `kaelen-rookie.png`, todos a 128 dentro de um vidro 192², corte 0 %; a silhueta do
`RevealDemo` é `mask-image` do mesmo PNG dentro do vidro; **o anel `.ring` em volta do vidro é gradiente vetor + sombra, fora do `.screen` — a
composição da Home/Pet/Estatísticas, aceita lá; X6**) ·
**6 glifos usados, 6 no inventário de 102** (`arrow_back, auto_awesome, check, close, schedule, sync`) · alturas do `canvas.json`
= `scrollHeight` do `.ab`.
**Fidelidade (`cmp.py`, sequência de `role`, `aria-label`, `.fo` e conjunto de textos, 12 pares):** a sequência dos marcadores de
foco é **idêntica em 11 de 12** — a exceção é declarada: `Reveal` (pago) tem **2** paradas (nome, Hatch) e o wireframe **4**, porque a
âncora da oferta 13.1 (foco 3–4, "Not now") saiu do telefone na rodada 2 (X2: pertence ao `RevealDemo`, que já a prova; quando o
wireframe foi desenhado o `RevealDemo` não existia); `role` idênticas em 10 de 12 — as duas diferenças são o **`role="img"` a mais** do
vidro do cartão em `Reveal` e `RevealDemo` (a criatura é conteúdo, não decoração — o mesmo caso de `CadastroDemo`/`TutorialConceito`
do funil, R6 confirmado); `aria-label` a mais nas duas caixas (`Favorita`, `Nascimento` — o rótulo visível repetido no nome acessível, como o
`cbrow` do funil) e o nome no `role=img`. Copy EN idêntica; as únicas diferenças de texto são as ligatures dos ícones (`back`→
`arrow_back`, `clock`→`schedule`, `✓`→`check`, `spark`→`auto_awesome`, `x`→`close`), as anotações do wireframe que viraram desenho
("PET", "PET 112", "(silhouette)", "cocoon", "(empty frame)"), a legenda de `Nascimento` sem o "(`opacity .5`)", as marcas `.dobra`
de `Reveal`/`RevealDemo`, a linha `[novo — copy proposta]` de `RevealSemSprite` e **o cabeçalho**: o wireframe traz "SOULMON ·
✓ focus done" (o molde da Home que vazou para o template do wireframer); o ritual não monta selo nenhum (`SoulmonOnboarding` não
tem `HomeHud`) — aqui fica só o wordmark Fredoka 20, e "focus done" é a única palavra do wireframe que não está no canvas.
**Nenhum skip link no ritual**: a numeração começa em 1 (DECISÕES §17 R5).

## Dobra medida a 390×844 (F2 da Home aplicada)

| Artboard | Wireframe aprovado (`../`) | Identidade | |
|---|---|---|---|
| `Main` / `MainClaro` | barra; pergunta; campo ~110; nav no pé | barra 65–73 · título 85–109 · campo **136–180** · nav (voltar + Continue inerte) **718–766** · nota 778–827 | ✓ (a nav vai ao pé por `margin-top:auto`, como o wireframe) |
| `Favorita` | idem + caixa | campo 136–180 · caixa **190–234** · nav **718–766** | ✓ |
| `Gerando` | PET 96 + spinner centrados | vidro 192 **97–297** · `sync` · frase até ~330 · nota 393–507 | ✓ |
| `Reveal` | eyebrow; card PET 112; descrição; batismo; Hatch ~560; oferta ~640 | eyebrow 85 · cartão **111–456** (vidro 124–324) · descrição 468–535 · batismo 547–648 · **Hatch 660–708** · nota 720–801 | cabe inteiro (a âncora da oferta saiu — X2) ✓ |
| `RevealDemo` (`tall` + `.dobra`) | nota; eyebrow; card 96; descrição; oferta; Continue ~560 | nota 85–166 · eyebrow 178 · cartão **204–531** · descrição 543–610 · convite **622–777** · **Continue 789–837** · nota 849–946 | tudo o que a pessoa toca antes de 844 (7px de folga) ✓ |
| `Cadastro` | título; campo; Hatch ~200 | título 85 · campo **140–184** · Hatch **233–281** · frase · nota 322–452 | ✓ |

`Nascimento`, `Ritual`, `Bifurcacao`, `Teste`, `RevealSemSprite`, `Upgrade` são folhas de estados (`tall`), sem dobra a medir;
no telefone, a 1ª pergunta do ritual cabe inteira (barra + título + 5×44 + dica + voltar ≈ 480px) e a bifurcação em ≈ 300px.

## Decisões de identidade tomadas neste canvas (canvas vence; a confirmar na crítica)

| # | Decisão | Motivo |
|---|---|---|
| D-Q1 | **A barra do ritual = `.meter` SIS-07 a 8px** com anel `muted` 1px e preenchimento `primary-fill` (o código: `div` 6px `primary-ink` sem anel) | Um medidor, uma peça (Dados SIS-07); o trilho `surface-2` sobre `bg` sozinho lê 1,2:1 — o anel é o que faz a barra existir; `fill`, não `ink`: é medidor, não link |
| D-Q2 | **O voltar = `arrow_back` 24 pelado num alvo 44 em `ink`**, sem rótulo visível (o rótulo no `aria-label`); "Continue" toma o resto da linha | Regra do dono (ícone nunca em box — o wireframe desenhou um quadrado); a seta já é o verbo; a copy "Back" do código fica no nome acessível |
| D-Q3 | **Inerte por superfície ou por forma, nunca por opacidade**: "Continue"/"Hatch" `surface-2` + `muted`; o campo da hora tracejado `muted` + tinta `muted` | Home F1 / Atividades D-A3; o `sm2Button` e o wireframe usam `opacity .5` |
| D-Q4 | **A opção escolhida é TONAL** (`primary-soft` + anel 2px `primary-ink` + tinta `primary-ink` 500) — no ritual E nos 20 itens | Pet D-P1: "onde estou" nunca é placa cheia; a placa cheia é o primário, e nestas telas não há primário — escolher avança. O `optionBtn` do código pinta `primary-fill` cheio |
| D-Q5 | **As duas portas da bifurcação em `outline`** (mesmo peso; o teste primeiro) — revista na rodada 2 (X5) | §17 V3 pedia a resposta com o desenho pronto: numa decisão declarada final sem porta "certa", o primário é recomendação implícita — "sem empurrão" vale para a forma; a mesma regra do `RevealDemo` (o primário é a saída que não custa; aqui nenhuma custa). Achado 9 para o `staff-frontend` (o código dá `primary` ao teste) |
| D-Q6 | **A espera = o casulo `forming` no vidro 192²** (não o corvo a 64 + spinner) | A criatura que está nascendo é o conteúdo; o corvo é a marca (funil D-O4: só no vidro da intro); `.sm-reveal-cocoon-img` já usa este placeholder no `REVEAL` — a espera do `GENERATING` é a mesma espera |
| D-Q7 | **O epíteto em `gold-ink` 12/500** sob o nome (o código: `sm2Hint` `muted`) | É a linha de essência — a única frase que carrega a leitura sem número (T8); a mesma tinta do convite ("o que você pode ser"); a única cor quente do cartão |
| D-Q8 | **O `RevealDemo` mostra a criatura em SILHUETA** (`mask-image` em `color-mix(viewport-bg 58%, viewport-ink)`, a mesma peça) — revista na rodada 2 (X1) | 13.19 ("sprite e árvore só pagando") e o "Sai" do wireframe (§17: "a silhueta é o convite", PRINCÍPIOS §9); a leitura não atribui personagem — o `DEMO_PICK` vem depois com 6 escolhas, e um rosto inteiro aqui mentiria e esvaziaria a oferta. Manter visível exigiria decisão de produto (a leitura atribui; `DEMO_PICK` sai) que não existe |
| D-Q9 | **O casulo dentro do vidro do cartão** (o código o põe FORA, 96, acima do `BirthCard`) e, passado o teto, **`dormant`** no mesmo vidro | Uma peça, um lugar: a criatura toma forma onde vai ficar; `dormant` é, por definição do D1, "ainda vai nascer" — e não é arte de reserva (S4): é o mesmo cristal do nó da árvore. `glitch` fica para a Evolução (falhou + retry) |
| D-Q10 | **Nenhuma Silkscreen no canvas** — dentro dos vidros só arte | O ritual é aparelho do começo ao fim; o único lugar onde o visor "fala" (HP/EN, EVOLVE) é a Home |
| D-Q11 | **O pulso do casulo por posição em `steps(2)`** dentro do vidro; `prefers-reduced-motion` = parado, o `role=status` fica | `sm-reveal-cocoon-pulse` anima por opacidade (Home F1: nada por alpha); dentro do visor o movimento é `steps()` (04 §6) |
| D-Q12 | **Todo `role=alert` do ritual em ÂMBAR** (filete 3px `gold-ink`); o muro de idade sem alerta nenhum | O `generateError` já é âmbar no código; o muro é convite adiado (guarda (b)) |
| D-Q13 | **"Continue with a demo character" = PRIMÁRIO** no `RevealDemo` (rodada 2, F1) | REGISTRO 13.1 — "agora não" com peso de primário — e 13.19 (é ali que a 13.1 acontece); regra que não se reabre (HANDOFF §7). A régua de morte da 13.1 mede a conversão desta tela: uma saída grátis mais fraca do que o decidido mediria outra coisa |

## Contraste (WCAG 2.x, hex do `index.css` bloco ONDA 1)

| Par | Onde | Escuro | Claro |
|---|---|---|---|
| `ink` / `bg` | títulos, textos, o valor dos campos, a frase da espera | 16,15 | 14,96 |
| `muted` / `bg` | o porquê de cada passo, hints, dicas de origem, notas, o eyebrow, a frase do que falta | 8,83 | 5,35 |
| `ink` / `surface` | as opções, a descrição, o nome no cartão, a manchete do convite | 13,59 | 16,23 |
| `muted` / `surface` | "You said…", o preço no convite, "BORN · …" | 7,43 | 5,80 |
| `ink` / `surface-2` | o valor no campo (data, hora viva, cidade, o nome do batismo) | 11,52 | 14,23 |
| `muted` / `surface-2` | placeholder, o texto do inerte ("Continue", "Hatch"), o campo da hora inerte | 6,30 | 5,09 |
| `primary-ink` / `surface` | a opção escolhida (sobre `primary-soft` ≈ `#1A4643` no escuro: 7,69) | 11,12 | 6,02 |
| `primary-ink` / `primary-soft` | a opção escolhida | 7,69 | 5,21 |
| `primary-ink` / `bg` | `sync` da espera, anel de foco do campo do nome/cidade | 13,21 | 5,55 |
| `on-primary` / `primary-fill` | "Continue", "Back to start", "Answer 20 more questions", "Hatch" | 12,38 | 6,02 |
| `gold-ink` / `surface` | o epíteto, o `auto_awesome` do convite | 8,84 | 5,87 |
| `gold-ink` / `bg` | o filete do `role=alert` | 10,51 | 5,41 |
| `primary-fill` / `surface-2` (não-texto) | a barra do ritual, a caixa marcada | 9,43 | 5,28 |
| `muted` / `surface-2` · `muted` / `surface` (não-texto) | anel dos campos, das opções, das caixas, da barra; o tracejado do inerte | 6,30 · 7,43 | 5,09 · 5,80 |
| `viewport-ring` / `surface` (não-texto) | o anel de cobre do vidro do cartão (dentro do card) | 4,98 | 3,97 |
| `viewport-ring` / `bg` (não-texto) | o anel do vidro da espera | 5,92 | 3,66 |
| `line` / `surface` (decorativo) | borda dos cards, separador das linhas da cidade | 1,32 | 1,25 (como Sistema F2 aceitou) |

Nenhum par abaixo de 4,5 (texto) ou 3 (não-texto) nos dois temas. **Nenhuma opacidade em nó nenhum do telefone** (medido nos 13).
O vidro é sempre escuro (`viewport-bg` `#071413`/`#0E2422`) e aqui não carrega texto — só arte.

## Escala do pixel dentro dos vidros

| Peça | Arte | Nativo | CSS | DPR 1 | DPR 2 | Grade |
|---|---|---|---|---|---|---|
| Casulo (espera, reveal esperando) | `placeholder/forming.png` | 256² | 128 em 192² (offset 32/32) | 0,5× | 1× | ✓ P2 (a); corte 0 % (a arte ocupa 54–202 × 0–256 → cabe inteira) |
| Cristal apagado (teto estourado) | `placeholder/dormant.png` | 256² | 128 em 192² | 0,5× | 1× | ✓ idem |
| Criatura do cartão (reveal pago) | `lines/kaelen-rookie.png` | 256² | 128 em 192² | 0,5× | 1× | ✓ = Estatísticas D-S4 / Pet D-P2 |
| Silhueta do cartão (reveal demo) | `mask-image` de `kaelen-rookie.png` | 256² | 128 em 192² | 0,5× | 1× | ✓ Pet D-P7 (sem alpha; o mesmo cinza nos dois temas) |
| Silkscreen | — | — | — | — | — | nenhuma neste canvas |

O `BirthCard` do código desenha o sprite a **112** solto (0,44× — fora de escala inteira e fora do vidro) e o casulo a **96**
(0,375×): os dois vão a 128 no vidro 192² — a escala da criatura em todo o app (Home, Ficha, funil, Estatísticas).

## Achados (divergências com o código de hoje — para o `staff-frontend`)

1. **`BirthCard.tsx`**: `<img 112>` solto → sprite 128 num vidro 192² com anel (WP1.6: o componente é UM — muda aqui, muda nas Estatísticas); `epithet` `sm2Hint` `muted` → 12/500 `gold-ink` (D-Q7); o `App.tsx` continua sem passar `epithet` à instância das Estatísticas (achado de lá).
2. **O casulo do `REVEAL`** (`revealEsperando && !revealSprite`): `.sm-reveal-cocoon-img` 96 FORA do cartão, pulsando por opacidade → dentro do vidro do cartão, 128, pulso por posição em `steps(2)` (D-Q9/D-Q11); passado o teto, `dormant` no vidro em vez de cartão sem `<img>` (S4: não é arte de reserva — é o D1).
3. **`GENERATING`**: `ravenMascot` 64 (512² a 0,125×) + `Spinner` 32 → o casulo `forming` no vidro 192² + `sync` 24 (D-Q6); `role="status" aria-live="polite"` fica.
4. **A barra do ritual**: `div` 6px `primary-ink` → `.meter` SIS-07 8px `primary-fill` com anel `muted` (D-Q1); a fórmula (`REGISTER + 1`, desconta os 20 recusados) não muda.
5. **O voltar**: `sm2Button quiet` `arrow_back` 20 + "Back" → `arrow_back` 24 pelado num alvo 44, rótulo no `aria-label` (D-Q2). **A 1ª pergunta do ritual ganha voltar → `FAVORITE_STEP`** (§17 V2, decisão do dono 15/09; STATUS a).
6. **`optionBtn`** (ritual e `SoulTestItem`): escolhida em `primary-fill` cheio → tonal `primary-soft` + anel `primary-ink` (D-Q4); cards 44 com anel `muted` 1px.
7. **`disabled` por opacidade** (`sm2Button`, o campo da hora) → inerte por superfície/forma (D-Q3).
8. **`CityPicker`**: linhas de 36 → 44 (W10).
9. **A bifurcação**: o código dá `primary` ao teste e `outline` ao reveal → **as duas em `outline`** (D-Q5, X5 — a resposta da §17 V3). `generateError` já em `alertStyle` âmbar — igual.
10. **`REVEAL_DEMO` não existe** (13.19): um passo entre `QUIZ_END` e `DEMO_PICK` no `flow === 'demo'`, com a leitura de `buildSoulProfile` sobre as 6 respostas (sem os 20 itens, sem mapa astral — o demo não deu nome/data/hora/cidade) e a criatura em **silhueta** (`mask-image` de uma linha pronta — nenhuma é "a dela"; D-Q8); "Continue with a demo character" **primário** (F1); o `UnlockNudge` a 280 (`maxWidth 440` hoje — Conta R4) com motivo de telemetria novo (`reveal-demo`); dispensar → `DEMO_PICK`, a leitura guardada para o upgrade. **A barra do demo** (X4): a fórmula R2 dá 14/16 = 88 % para o reveal no caminho curto se a barra seguir medindo até `REGISTER + 1` — mas o demo não vai ao `REGISTER`: o denominador do demo é decisão nova (desenhado 88 %, registrado). **`GENERATING`/`RevealSemSprite`**: o `role=status` do casulo precisa de TEXTO na região (visualmente oculto, R3) — `aria-label` num `span` vazio não anuncia; o giro do `sync` fora do vidro com easing e reduced-motion parado (R1).
11. **O cabeçalho**: o ritual não tem selo nem `HomeHud` — o wordmark do canvas é composição; se a implementação não o montar, nada muda.
12. **Copy pendente do `redator-ux`** (não desenhada, só o lugar): a ponte e a estimativa de tempo no passo 1 do upgrade (V7); o batismo diferente no upgrade (V5, D17); a frase sob a moldura sem sprite (V6 — desenhada como `[novo — copy proposta]` em `RevealSemSprite`, texto a fechar); o texto longo do `AGE_BLOCK` que existe no código e não no wireframe (cartógrafo).
13. **Registro (§17 para o STATUS)**: o `setTimeout(1400)` no 20º item (b); o muro de idade zera até o nome num typo (c); a favorita nunca ecoada no reveal (g); os 4 estados sem linha (`submitting`, `unlockMessage`, cidade com fuso, rascunho retomado).
14. **Nenhum glifo novo**: `arrow_back, auto_awesome, check, close, schedule, sync` — todos no inventário de 102.

## Pendentes

- **Sem pendência do dono.** Nenhum token novo, nenhum glifo fora do inventário, nenhuma estrutura reaberta, nenhuma Silkscreen.
- **Rodada 2 (`CRITICA.md`, 20/09):** F1 → "Continue with a demo character" primário (D-Q13); X1 → silhueta (D-Q8 revista); X2 → a âncora da oferta fora do `.phone` do `Reveal`; X3 → seletor do pulso sem `.wait` (medido `cocoon` nos dois artboards); X4 → 88 %; X5 → as duas portas em `outline` (D-Q5 revista); X6 → esta tabela e a frase do anel corrigidas; R1 (`sync` gira), R3 (`.vh` na região), R6 (rodapé do `Main` diz para onde o voltar vai) aplicados; R2 (título do `Teste` no `canvas.json` herdado do wireframe — o voltar do 1º item é código, não desenho), R4, R5 (45px por meia linha de `line`), R7 registrados.
- **Para o `redator-ux`:** a linha `[novo — copy proposta]` de `RevealSemSprite` ("The drawing is still being made — it arrives on its own, later.") — o lugar e o tom estão decididos; o texto é proposta.
- **Para a `squad-arte`:** nada — os três placeholders v4 (D1) e as linhas 256² já servem a 0,5×.

## Fontes

`SoulmonOnboarding.tsx` (`StepShell`, `role="progressbar"` "Ritual progress", `IDENTITY_STEP`→`FAVORITE_STEP`, `QUIZ_START..QUIZ_END`,
`REFINE_OFFER`, `DEEP_START..DEEP_END`, `GENERATING`, `REVEAL`, `REGISTER`, `AGE_BLOCK`, `mode='upgrade'`, `REVEAL_WAIT_MS`,
`.sm-reveal-cocoon-img`, `generateError`/`alertStyle`, `optionBtn`) · `SoulTestItem.tsx` · `CityPicker.tsx` · `BirthCard.tsx` ·
`UnlockAccountModal.tsx` (`UnlockNudge`) · `utils/oracle.ts` (`ORACLE_QUESTIONS`) · `utils/soulProfile/` · `utils/placeholderArt.ts`
(D1) · `utils/monetization.ts` (`PREMADE_CHARACTERS`) · `App.tsx` (`handleUpgradeRevealed`) · `index.css` (`sm-reveal-cocoon-pulse`) ·
`src/assets/soulmon/placeholder/`, `lines/` · `tokens.md` §4, §5 (subset de 102) · `tokens.contrast.test.ts` · DECISÕES §17, §18–§26 ·
REGISTRO 13.1, 13.19 · HANDOFF §1, §4–§7 · `CLAUDE.md` › Oráculo, porquê do usuário, Desbloqueio no meio do jogo · PRINCÍPIOS §3, §8 ·
T8 · D9 · D17 · Estatísticas `README.md` (D-S4) · Pet `README.md` (D-P1, D-P2, D-P7) · Onboarding-funil `CRITICA.md`/`README.md`.
