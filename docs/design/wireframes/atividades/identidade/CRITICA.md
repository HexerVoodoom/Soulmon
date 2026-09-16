# CRÍTICA — canvas "Atividades" (identidade, Fase 2, terceiro canvas) · `design-critic`

> Revisão BLOQUEANTE · 16/09/2026 · alvo: os 17 `.dc.html` + `MainClaro` + `canvas.json` + `README.md`
> desta pasta, servidos em `localhost:8767`.
> Método: (1) diff estrutural artboard a artboard contra `../<mesmo nome>.dc.html` — sequência de `role`,
> de `aria-label` e dos marcadores de foco (`.fo`), copy visível; (2) `getComputedStyle` +
> `getBoundingClientRect` nos 18 artboards (texto < 12px, Silkscreen fora do `.screen`, alvo < 44,
> vazamento da largura de 390, PNG/`background-image` fora do vidro, **opacidade < 1 em qualquer nó do
> `.phone`**, posição da dobra a 390×844); (3) hex recalculados do `src/index.css` (bloco ONDA 1) com a
> fórmula WCAG 2.x, inclusive compostos (opacidade, `primary-soft` sobre `surface`, a placa `color-mix`);
> (4) todos os glifos usados cruzados com o inventário de 102 (`tokens.md` §5); (5) cruzado com o Sistema
> aprovado (DECISÕES §18), a Home aprovada e **as decisões do dono no checkpoint da Home (§19: P4–P7)**,
> `HANDOFF-IDENTIDADE.md` §4–§7, `CLAUDE.md` › Motor de tarefas, `TriagePile.tsx`, `BalanceWeekModal.tsx`,
> `App.tsx` (toast). Não editei nenhum artboard.

## 0. Resumo

| Classe | Qtd | O que pesa |
|---|---|---|
| **fatal** | 1 | **O Home F1 voltou pela porta dos fundos**: `.dim{opacity:.55}` (regra do bloco HOME copiado) ainda esmaece a linha INTEIRA do hábito fora do dia — `Main`, `MainClaro`, `ListaCompleta`, `LinhaHabitoEstados` — a **3,26:1 escuro / 2,31:1 claro** para título 14/500 e subtítulo 12; o ● da janela cai a **2,44:1** no claro (não-texto < 3). O README (D-A3, "Notas" do Main, tabela de contraste: "nenhuma opacidade sobre texto") afirma o contrário do que o DOM mede |
| **fixável** | 9 | a tarefa assombrada em `muted` contra a **decisão P5 do dono** (`--sm2-haunted`) — e o hex escuro proposto pelo lead **não passa** (4,21:1) · o contador de adiamentos é o objeto mais pesado da linha (pílula 44 com borda, mais larga que o título) · a aura de 28 dias vira **mancha escura** no tema claro · `toys` ainda marcado "fora do subset" depois de P6 · pista dos `.segi` a `opacity:.85` (o README diz "nenhuma") · folhas em fluxo (D-A6) sem registrar o que cabe em 844 · README com números que o DOM não confirma · "Add 1 step" sem `role` (herdado) · Someday = `pending` lê como "em andamento" |
| **ruído** | 6 | anotações dentro do telefone herdadas do wireframe (`.sticky`, `.scrollhint`) · CSS morto (`.chip.sel.dis`, `.btn.busy`, `.li.pressed`) · "idle for 9 days" na carta (Fase 1, para o guarda) · o anel "falta" com a mesma saliência de borda que o "feito" (Fase 1) · `aria-label` das barras com dígito · `canvas.json` limpo, mas `TriagemFila` 72→99 |

**Veredito: VOLTA.** Um fatal só, mas é **o mesmo fatal da Home**, no mesmo par de números (3,26 / 2,31), com o
README dizendo que foi consertado — a rodada 2 tem de vir com a medição colada no rodapé, não com a
frase. Conserto de uma linha de CSS (F1) + o token do dono (X1). Nada estrutural.

**O que está certo e não precisa de rodada** (para o lead não gastar tempo): estrutura **idêntica** nos
17 pares — mesma sequência de `role`, mesmos `aria-label`, os mesmos números de foco (26 no Main, 17 no
Vazio, 20 no CargaDoDia, 24 no CriarAtividade, 28 no EditarTarefa…), a mesma copy EN (a identidade só
ACRESCENTA pistas: "Mon to Fri", "minutes / one sitting / several days", "moves to today's list", "someday"/
"let go" na gaveta — nada tirado); **0 nós < 12px** dentro do `.phone` nos 18; **0 alvo < 44** entre
`button/checkbox/textbox/radio/summary`; **0 elemento vazando** 390; Silkscreen só a 14, só em `.screen`
(HP/EN); **0 PNG e 0 `background-image` fora do vidro** (o `bar-frame`/`bar-fill` ficam na placa, dentro);
**37 glifos, 36 no inventário de 102** (o 37º é `toys`, ver X4); nenhum ícone em box; `MainClaro` com o
vidro escuro, cobre `#B0722F` (3,66 sobre `bg`), ciano `#0B6F68`, placa por `color-mix` (Home X1 aplicado);
a dobra **segura** (tabela §1.1); os 13 pares de contraste do README **conferem** ao centésimo; `canvas.json`
UTF-8 válido, alturas = `scrollHeight` dos 18 `.ab`; "focus done" como chip `primary-soft`; "That's it!"
acima do sprite (mesmo deslocamento do `PetCheio` da Home); folhas de decisão sem primário (D-A5 confirmada:
`outline` × 2, × 3, × 4); Delete `quiet` em `danger-ink` como única menção de perigo; chips de categoria com
os 8 vetores do `CATEGORY_ICON_NAME`; contador de adiamentos em `muted` (X10 do Sistema); aviso de carga como
texto `role=status` em `gold-ink` **sem moldura** e a lista viva embaixo (carga = aviso, não bloqueio ✓);
"was due 9/10/2026" na carta vencida (nunca "N days late"); gaveta "these ask nothing of you" com `someday`/
`dropped` inertes; "5 of the last 7" e "N of M decided" — nunca percentual; três saídas iguais no nudge com
"Shrink it" inerte **com motivo**.

---

## 1. Medições

### 1.1 Dobra a 390×844 (dock 722–774, nav 774–843) — confirma o README

| Artboard | Wireframe (medido em `../`) | Identidade (medido) | |
|---|---|---|---|
| `Main` | painel 401; cabeçalho 414–433; 1ª linha 447–549; 2ª 549–679; 3ª a 679 | painel 419; cabeçalho 420–464; 1ª 464–562; 2ª 562–681; 3ª a 681 | cabeçalho + 2 linhas + início da 3ª nos dois ✓ |
| `ListaVazia` | "New Activity" 624–668 | 641–689 | o único `primary` inteiro acima de 722 ✓ |
| `ListaCompleta` | — | 1ª 464–546; 2ª 546–629; 3ª 629–687 | 3 concluídas visíveis ✓ |
| `CargaDoDia` | slot 401–446; painel 531; 1ª 577–680 | aviso 419–467; painel 475; 1ª 520–617; 2ª 617–716 | **melhor** que o wireframe (2 linhas em vez de 1) ✓ |

### 1.2 AA por token — recálculo (os 13 pares do README + os que ele não lista)

| Par | Onde | Escuro | Claro | |
|---|---|---|---|---|
| `ink` / `surface` | título da linha | 13,59 | 16,23 | ✓ |
| `muted` / `surface` | subtítulo, selo, "Put aside", título concluído | 7,43 | 5,80 | ✓ |
| `muted` / `surface-2` | chip de etiqueta, contador, placeholder, "Limit reached" | 6,30 | 5,09 | ✓ |
| `gold-ink` / `surface-2` | chip "haunted · +relief" (24px, 12/500, sem opacidade) | 7,49 | 5,15 | ✓ |
| `gold-ink` / `bg` | aviso de carga | 10,51 | 5,41 | ✓ |
| `gold-ink` / `surface` | `lock_open` do nudge | 8,84 | 5,87 | ✓ |
| `primary-ink` / `surface` | `eco`, "Bring back", "Add" | 11,12 | 6,02 | ✓ |
| `primary-ink` / `surface-2` | chips do parser na captura | 9,43 | 5,28 | ✓ |
| `primary-ink` / `primary-soft` (composto) | chip selecionado, "focus done" | 7,69 | 5,21 | ✓ |
| `on-primary` / `primary-fill` | Save, Back, checkbox, `.segi.on` | 12,38 | 6,02 | ✓ |
| `ink` / `surface-2` | campo, `.segi`, toast | 11,52 | 14,23 | ✓ |
| `danger-ink` / `surface` | "Delete" | 6,73 | 6,54 | ✓ |
| `viewport-ink` / placa `color-mix(viewport-bg 78%)` | HP/EN Silkscreen 14 | ≥ 8,46 | ≥ 8,46 | ✓ (Home X1) |
| `primary-fill` / `surface` (não-texto) | ●, ◆, barra "como ficaria" (pela borda) | 11,12 | 6,02 | ✓ |
| `muted` / `surface` (não-texto) | ○, —, checkbox tracejado, `box-shadow` do `outline` | 7,43 | 5,80 | ✓ |
| `viewport-ring` / `bg` (não-texto) | o anel | 5,92 | 3,66 | ✓ |
| `ink` a `.85` / `surface-2` · `on-primary` a `.85` / `primary-fill` | pista dos `.segi` (X5) | 8,81 · 8,33 | 9,21 · 4,82 | ✓ (passa, mas é opacidade) |

**O que NÃO passa:**

| Par | Escuro | Claro | Onde |
|---|---|---|---|
| `muted` a **opacidade .55** / `surface` (texto 14/500 e 12) | **3,26** | **2,31** | `.li.dim` "Read 10 pages" — `Main`, `MainClaro`, `ListaCompleta`, `LinhaHabitoEstados` |
| `primary-fill` a .55 / `surface` (não-texto: ● da janela, `eco`) | 4,43 | **2,44** | os mesmos 4 artboards |
| borda tracejada do checkbox (`muted` 2px) a .55 (não-texto) | 3,26 | **2,31** | os mesmos 4 |
| **`#6E8AA3` (haunted escuro proposto pelo lead, §19 P5) / `surface`** | **4,21** | — | ainda não está em lugar nenhum — **não pode entrar assim** (X1) |
| `#6E8AA3` / `surface-2` | **3,57** | — | idem |

---

## 2. Achados

### FATAL

**F1 · O hábito fora do dia é a tarefa assombrada da Home de novo — e o README diz que não é.**
`Main.dc.html`, `MainClaro.dc.html`, `ListaCompleta.dc.html`, `LinhaHabitoEstados.dc.html` — `<li class="li w dim">`
"Read 10 pages · 3× per week". Medido: `getComputedStyle(li).opacity = 0.55` nos quatro. A regra vem da linha
`.dim{opacity:.55}` do bloco `HOME (composição)` copiado; a linha `.li.dim .t,.li.dim .selo{color:muted}` do
bloco `ATIV` foi acrescentada **por cima**, sem tirar a de baixo — a tinta E o alpha se somam. Resultado:
título 14/500 e subtítulo 12 a **3,26:1 (escuro) / 2,31:1 (claro, no artboard que existe para provar o claro)**;
o ● `primary-fill` da janela a 2,44 no claro e o checkbox tracejado a 2,31 (1.4.11 pede ≥ 3). São exatamente os
números do Home F1 (`../../home/identidade/CRITICA.md` §1). Régua: HANDOFF §5 "AA nos dois temas". Agrava:
o README afirma três vezes que está consertado (D-A3 "Esmaecer é tinta, nunca alpha"; Notas do Main "esmaecem
pela TINTA, nunca por opacidade"; §Contraste "Nenhuma opacidade sobre texto") — a prova foi a frase, não a
medida. **Conserto (1 linha):** apagar `.dim{opacity:.55}` do bloco HOME em todos os `.dc.html` (ou escopá-la
para fora de `.li`); a tinta `muted` já está no lugar (7,43 / 5,80), o checkbox tracejado + `aria-disabled` já
dizem "inerte" pela forma (Home E7). Na rodada 2, colar no rodapé do `LinhaHabitoEstados` o
`getComputedStyle` da linha (`opacity: 1`, `color: #9DBCB4`) — o gerador `gen_ativ.py` deveria passar a
reprovar qualquer `opacity < 1` dentro do `.phone`, que é a checagem que faltou aqui.

### FIXÁVEL (ordem de alavancagem)

**X1 · A tarefa assombrada contradiz a decisão P5 do dono — e o hex do lead não passa AA.**
`LinhaTarefaEstados.dc.html` linhas 3–4 (`.li.haunt`), `Main` (nenhuma assombrada, mas a regra vale): título e
selo em `--sm2-muted` (medido `#9DBCB4`) — **idêntico** ao fora do dia e à concluída. O dono decidiu no
checkpoint da Home (DECISÕES §19, P5, 16/09): "cor PRÓPRIA para a tarefa assombrada — token novo
`--sm2-haunted`". Com `muted`, a assombrada só se distingue pelo chip; o `README` D-A3 desenha a proposta
que **perdeu** no checkpoint. Antes de trocar: o par proposto pelo lead (escuro `#6E8AA3` / claro `#4E6A83`)
**falha no escuro** — 4,21:1 sobre `surface`, 3,57 sobre `surface-2` (texto 14 e 12 pede 4,5). O claro passa
(5,66 / 4,96). **Conserto:** (a) `.li.haunt .t, .li.haunt .selo { color: var(--sm2-haunted) }`; (b) definir o
token no `.ab[data-theme=…]` dos artboards com um escuro que passe — recomendo **`#85A0B8`** (5,58 sobre
`surface`, 4,73 sobre `surface-2`, 6,63 sobre `bg`; mesma família azul-acinzentada do lead) e manter
`#4E6A83` no claro; (c) registrar o par no README como `[pendente do dono]` → "P5 aplicado", com a régua
para o `tokens.contrast.test.ts`. Nota para o lead: haunted × muted diferem só 1,3:1 entre si — a distinção
é de **matiz** (azul × verde-cinza), não de luminância; o chip `gold-ink` continua sendo o sinal redundante,
o que está certo (cor nunca é o único canal).

**X2 · O contador de adiamentos é o objeto mais pesado da linha.** `Main` "Plan the trip" · `LinhaTarefaEstados`
linha 2: `.chip.meta44` herda de `.chip` a **borda 1px `muted`** + `surface-2` + 44 de altura + `schedule` 20 +
Rubik 14/500 — medido 44px de altura e mais largo (≈180px) que o título "Plan the trip". No screenshot a pílula
contornada é o primeiro objeto que o olho pega no painel; o título da tarefa é o segundo. X10 do Sistema pediu
`muted`, "nunca âmbar/vermelho" — cumprido —, mas PRINCÍPIOS §2 e o motor ("é dado, não bronca") pedem que o
dado seja **secundário**. Padrão de mercado: Sunsama e Todoist mostram "moved N times"/"rescheduled" como
metadado **sem contorno**, no mesmo peso das outras etiquetas; o alvo cresce, o desenho não. **Conserto sem
mudar estrutura:** `.chip.meta44` = alvo 44 **invisível** (como `.tap44`) com a pílula visual `.chip.tag`
(24px, `surface-2`, sem borda, `muted` 12/500) dentro; o `schedule` 18 em vez de 20; `.nudge` mantém o
sublinhado só em `POSTPONE_NUDGE_AT`. Assim o contador fica na mesma linha de leitura de "project" e "quick",
e o título volta a mandar.

**X3 · A aura de 28 dias vira mancha no tema claro.** `.mat.aura{text-shadow:0 0 6px primary-ink, 0 0 14px
primary-ink}` — medido no `MainClaro`: `text-shadow: rgb(11,111,104) 0 0 6px, rgb(11,111,104) 0 0 14px` sob um
glifo de 20px sobre branco. No escuro, `#5FF3E0` desfocado sobre `#0F2A29` **é** brilho; no claro, `#0B6F68`
desfocado sobre `#FFFFFF` é sombra — o glifo parece borrado/sujo, e "brilho" (D-A2, T6) não existe como
leitura. **Conserto:** no `[data-theme=light]` a aura como halo **claro**, não escuro — `text-shadow: 0 0 6px
var(--sm2-primary-soft)`-equivalente (`#D6F5EF`) com um segundo raio 0 0 2px `primary-ink`; ou, mais simples e
igual nos dois temas, um anel `box-shadow: 0 0 0 3px var(--sm2-primary-soft)` em volta do glifo (halo, não
box: sem fundo, sem borda dura). Medir no claro e colar.

**X4 · `toys` ainda está marcado "fora do subset" depois de P6.** `Main`, `MainClaro`, `ListaVazia`,
`ListaCompleta`, `CargaDoDia`: o "Play" do deck é `<svg>` inline com `data-fora-do-subset="toys"`. O dono
aprovou P6 (§19): `toys` e `groups` entram no subset, `.woff2` refeito, `CACHE_VERSION` +1. O canvas
Atividades foi gerado no mesmo dia e não absorveu. **Conserto:** manter o SVG como fallback visual (a fonte
servida ainda não tem o glifo), trocar o atributo para `data-subset="toys · P6 aprovado 16/09"` e registrar no
rodapé/README que o `staff-frontend` usa a ligature `toys` — hoje quem lê o artboard entende que precisa de
uma decisão que já foi tomada.

**X5 · Opacidade sobre texto nos `.segi`.** `.segi span{opacity:.85}` — `EditarTarefa` "minutes / one sitting /
several days" (medido `opacity: 0.85`), e o mesmo CSS vale para `CriarAtividade` e os presets de alarme. Passa
(8,81 / 9,21 inativo; 8,33 / 4,82 ativo — o ativo no claro fica a 0,3 do piso), mas o README declara "nenhuma
opacidade sobre texto" e o Sistema X1 casou `.segi` com o `Segment` do `FormKit`, que usa **tinta**.
**Conserto:** inativo → `color: var(--sm2-muted)`; ativo → `color: var(--sm2-on-primary)` sem alpha (12,38 /
6,02). Remove a última opacidade textual do canvas e faz a frase do README virar verdade.

**X6 · D-A6 (folhas em fluxo) resolve o problema do wireframe e cria outro: o artboard deixa de dizer o que
cabe em 844.** `FichaHabito` (telefone a 1213), `CriarAtividade` (1432), `EditarAtividade` (1543), `EditarTarefa`
(1591), `NudgeAdiamento` (1412), `EquilibrarSemana` (1303). Mostrar o formulário inteiro está certo (o wireframe
cortava o título a −281px); mas a tela real tem 844, o corpo do `ModalSheet` rola e Cancel/Save fica fixo — e
nenhum rodapé diz **onde cai a dobra da folha** (o que a pessoa vê antes de rolar: no `EditarTarefa`, Name +
categoria + esforço? ou já corta em "Effort"?). É a mesma pergunta que a Fase 1 mediu para a lista.
**Conserto (rodapé, não artboard):** uma linha por folha em fluxo — "a 844: folha de 640 (`.folha .sheet
max-height`) mostra do título até `<campo>`; Cancel/Save fixos a 780–828" — e, se o `staff-frontend` precisar,
um marcador tracejado no artboard na altura 640 do sheet (anotação, como as demais `.tagd`).

**X7 · README com números que o DOM não confirma.** (a) "quatro saídas iguais (`outline` 72 em 2×2)" —
medido **174×99** (as pistas de duas linhas empurram); o número certo é 99 (ou o `min-height` 72 com a
ressalva); (b) "Nenhuma opacidade sobre texto" — F1 e X5; (c) "hábito fora do dia esmaecido pela tinta"
(`ListaCompleta`) — pela tinta E pelo alpha; (d) a tabela da dobra está certa, mas cita o wireframe com
"painel a 401; cabeçalho 402–447" — medido no `../Main` o `h2` está a 414–433 (o cabeçalho é 401–447 com
padding; ok como está, só conferir a fonte). O README é o que o lead lê; quando ele erra para o lado do
otimismo, a crítica vira a única medição.

**X8 · "Add 1 step" sem `role="button"`** (`NudgeAdiamento`, sub-estado "passos sugeridos"): `<span
class="btn pri sm">Add 1 step</span>` e o inerte `<span class="btn dis sm" aria-disabled>` — nenhum dos dois
tem `role`, nenhum tem `.fo`. Herdado do wireframe (a fidelidade está certa: o par é idêntico), então **não
é falha da identidade** — mas é o único `primary` da folha e o leitor de tela não o vê como botão. Registrar
como achado para o wireframe (rodada seguinte de `../`) e para o `staff-frontend`; a identidade não muda.

**X9 · `pending` para "Someday" lê como "em andamento".** `TriagemFila`: o glifo `pending` (três pontos num
círculo) é o ícone que a Material usa para "aguardando processamento" — o oposto de "deliberadamente inerte,
sem cobrança". O `CLAUDE.md` chama o estado de 💤 e o motor o descreve como "permissão formal para não
fazer". No inventário de 102 há `nightlight` (crescente, sem uso em nenhum canvas) e `bedtime` (já é o
"Sleep" do deck — descartar). **Recomendação:** `nightlight`; o `archive` de "Let it go" fica (arquivar =
sair com dignidade). Se o lead preferir manter `pending`, a pista "no nagging, no aging" segura o sentido —
é fixável de baixo custo, não bloqueia.

### RUÍDO (registrar, não voltar por isso)

**R1 · Anotações dentro do telefone**, herdadas do wireframe e aceitas na Home: `.sticky` "▲ fixed
(`.sm-pet-sticky`) · scrolls under it ▼" (em fluxo, 18px que a dobra paga) e `.scrollhint` "▲ slot, capture and
'Balance my week' scrolled away" (absoluto, sobre a 3ª linha). D-A9 tirou as notas de spec; estas duas são
de navegação e ficam — mas a `.sticky` poderia ser `.tagd` no rodapé, devolvendo 18px à dobra do Main.

**R2 · CSS morto** no bloco copiado: `.chip.sel.dis{opacity:.45}`, `.btn.busy{opacity:.7}`, `.li.pressed`
— nenhum nó usa. São três oportunidades de um F1 futuro (a próxima cópia herda). Podar no gerador.

**R3 · "idle for 9 days · effort 2 of 3" na carta da triagem** (`TriagemFila`) — copy do código
(`TriagePile.tsx`: `idle for ${stale} days`), estrutura da Fase 1. Não é da identidade, mas é um número de
dias parados **na cara da pessoa** dentro do fluxo que existe para aliviar; a linha da lista não pode ter
número de dias (guarda 1c) e a carta pode? Encaminhar ao `soulmon-guarda-linha-vermelha` como pergunta, não
como achado deste canvas.

**R4 · O anel "falta" (○ 2px `muted`, 7,43) tem a mesma saliência de borda que o "feito" (● cheio).**
`LinhaHabitoEstados` "0 of the last 7" = sete anéis; o motor diz "a primeira falha não gera nada visível"
(never miss twice) e a janela mostra cada falta como forma. A janela é estrutura da Fase 1 (02 §25) e D-A1
acertou a ordem de saliência (— < ○ < ◆ < ●). Só anotar que o ○ não pode cair abaixo de 3:1 para "sumir"
(`line` dá 1,32) — a solução, se um dia vier, é de forma (anel mais fino, 1,5px) e não de cor.

**R5 · `aria-label="Mon: 4"` nas barras do `EquilibrarSemana`** — o README diz "sem dígito (só
`aria-label`)"; é esforço planejado por dia, não constância, e a leitura sonora precisa do número. Certo
como está; só não chamar de "sem dígito".

**R6 · `canvas.json`**: UTF-8 válido (o "Ã" único é o "NÃO" de "o teto NÃO tranca edição"), 4 páginas,
alturas = `scrollHeight`. Nada a fazer.

---

## 3. D-A1…D-A9 — veredito

| # | Decisão | Veredito | Por quê |
|---|---|---|---|
| D-A1 | Janela de 7 = formas de 12px (● ◆ ○ —), ◇ tracejado para casa vazia de escudo | **confirmo** | 108px medidos, cabe ao lado do glifo; não-texto ≥ 3:1 nos dois temas (11,12 / 6,02 e 7,43 / 5,80); ordem de saliência coerente com 02 §25; `aria-label` "N of the last 7" carrega a informação (nunca %). Ver R4 |
| D-A2 | Selo = TIPO (`task_alt`/`event_repeat`) 24 `muted`; `eco` = maturidade com FILL 0/.34/.67/1; aura = brilho no glifo | **confirmo com reserva** | Selo e `eco` certos (o wireframe desenha o tipo; `TIER_FILL` já é `eco` no código; FILL medido 0 / .34 / .67 / 1). A aura **não funciona no claro** (X3) — confirmar a decisão, corrigir o tratamento |
| D-A3 | Esmaecer é tinta, nunca alpha; assombrada = `muted` + chip âmbar; inerte = tracejado + `aria-disabled` | **derrubo** | (1) o DOM mede `opacity .55` na fora do dia — F1; (2) assombrada em `muted` é a proposta que perdeu para P5 — X1. O que fica de pé: chip `gold-ink` 24 (7,49 / 5,15), tracejado + `aria-disabled` |
| D-A4 | Contador = chip-botão 44 `muted` + `schedule`; sublinhado só em `POSTPONE_NUDGE_AT`; aviso de carga = texto `gold-ink` sem moldura | **confirmo a cor, derrubo o peso** | X10 cumprido; o aviso de carga está exemplar (texto, `role=status`, lista viva). O contador com borda é o objeto mais pesado da linha — X2: alvo 44, desenho 24 |
| D-A5 | Folhas de decisão sem primário; primário só onde há UMA ação | **confirmo** | Medido: `outline` × 2 (Equilibrar), × 3 (Nudge), × 4 (Triagem); `primary` só em Save/Back/New Activity/"Add 1 step". 02 §36 e SIS-02 |
| D-A6 | Folha > 844 entra em fluxo; as que cabem ficam ancoradas | **confirmo com condição** | Mostrar o formulário inteiro está certo; a condição é o rodapé dizer o que cabe a 844 (X6) |
| D-A7 | Chips de categoria com os 8 vetores do `CATEGORY_ICON_NAME` | **confirmo** | Os 8 no inventário, 20px, chip 44 com borda `muted` / `sel` em `primary-soft` (7,69 / 5,21); PNG `icon-cat-*` fora do visor sai |
| D-A8 | Glifos sem par exato: `visibility`, `psychology`, `do_not_disturb_on`, `archive`, `pending`, `calendar_month`, `lock_open` | **confirmo 6 de 7** | Todos no inventário. `pending` para Someday é o único que comunica o contrário do estado — X9 (`nightlight`) |
| D-A9 | Notas de spec fora do telefone nos artboards de 844; legendas `.strip .cap` nos espécimes | **confirmo** | Rodapés com as notas; `.cap` 12 `muted` (7,43); o que sobrou dentro (R1) é navegação, não spec |

## 4. `[pendente do dono]` / lead — recomendação

- **Selo do hábito na Home: `eco` → `event_repeat`.** Recomendo **trocar**. `eco` é o glifo de maturidade
  no código (`TIER_FILL`) e neste canvas; a Home mostrando `eco` como selo faria a mesma folha (`eco` FILL 0
  = "seed") significar duas coisas a 20px de distância quando a Home ganhar a janela. `event_repeat` já está
  no inventário, já é o selo aqui (7 artboards) — um só papel por glifo. Custo: 1 atributo em ~6 artboards
  da Home, rodada seguinte.
- **Glifo próprio de "assombrada"**: recomendo **não** abrir subset por isso. `visibility` diz o que o
  motor diz ("o pet OLHA", WP3.2) e não caricatura a tarefa como fantasma/cobrança; o chip "haunted · +relief"
  em `gold-ink` já carrega a palavra. Se o dono quiser o fantasma, que seja no VIDRO (partícula do `animArt`,
  onde o pixel mora), não na linha.
- **Quadro de bocejo** (`CargaDoDia`): `squad-arte`, como o README diz; enquanto não vem, o artboard usa a
  pose neutra e diz isso no rodapé — certo.
- **`--sm2-haunted`**: entra, com o escuro recalibrado (**`#85A0B8`**, não `#6E8AA3`) — ver X1.

## 5. Veredito final

**VOLTA** — rodada 2 com **F1** (apagar `.dim{opacity:.55}` do bloco HOME em todos os arquivos + medir e colar)
e **X1** (token do dono, com o hex escuro que passa). X2–X6 entram na mesma rodada por serem CSS de um
gerador só; X7–X9 e R1–R6 ficam como registro para o lead decidir. Estrutura, foco, copy, alvos, Silkscreen,
Visor, subset e a dobra estão certos e **não** precisam de rodada.

A alavanca única, se só uma coisa puder ser feita: **fazer o gerador reprovar `opacity < 1` dentro do
`.phone`** — foi o mesmo defeito na Home e aqui, e os dois READMEs disseram que não existia.
