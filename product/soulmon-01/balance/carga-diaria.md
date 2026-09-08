# Carga diária — diagnóstico e proposta de balanceamento

> Rodada de **diagnóstico + proposta**. Nada foi implementado. Nenhum arquivo de
> `src/components/` ou `src/index.css` foi tocado.
>
> Lentes aplicadas ao mesmo tempo: psicologia comportamental, gamificação,
> desenho de produto e pesquisa com usuário (personas em `.claude/agents/`).
>
> Filtro que barra tudo aqui: *isso faz o bichinho parecer mais um companheiro,
> ou mais um chefe?* (`docs/PLANO-EVOLUCAO.md`, "A essência").

---

## Veredito em uma frase

**A regra que COBRA já é gentil; o que está quebrado é a regra que MOSTRA** — há
três denominadores diferentes na tela e no widget, todos crus (`cadastradas`), e
é isso que faz o usuário sentir a punição por cadastrar demais que o código não
aplica. Só depois disso sobra um problema de balanceamento de verdade, e ele é
mais estreito do que a queixa sugere: **não é "6 tarefas", é "5 de 6 tarefas para
não perder coração" + "energia cheia no requisito do estágio, não na meta do
dia"**.

---

## 1. Diagnóstico — o que é BUG e o que é DESENHO

### 1.0 Antes de tudo: o número da queixa

`FORM_REQUIREMENTS` (`src/types/progression.ts:14-20`): rookie 4 · champion 5 ·
**ultimate 5** · **mega 6** · ultra 6.

Procurei uma UI que exibisse um requisito errado. **Não existe**: `GuideModal`
(l. 132-136) e `EvolveTaskModal` leem das constantes. O número errado que o
usuário vê **não é o requisito — é o denominador**. Ele vê `2/9` no widget e uma
barra em 22% num dia em que a meta cobrada era 5 e ele fez 2 (40%). O "6" da
queixa é ou o mega (6 correto), ou o denominador cru que o app pinta como se
fosse a meta. **A queixa 3 do usuário é literalmente verdadeira na experiência
dele, mesmo sendo falsa na cobrança.** É a pior combinação possível: o jogo não
pune, mas parece que pune — então o usuário paga o custo psicológico da punição
sem que ela sequer aconteça.

### 🔴 BUG-1 — `dailyTotal` cru vaza para o widget Android

`src/hooks/useProgressTracking.ts:51-54`

```ts
const dailyTotal = availableActivities.length + gameState.tasks.length + tasksCompletedToday.length;
```

Sem `min(..., requisito)`. Vai para `App.tsx:447` (`totalTasks`) →
`DigiWidgetPlugin.kt:26` → `WidgetRenderer.kt:31` `"$completedTasks/$totalTasks"`
e `WidgetRenderer.kt:217-227` `contextualMessage`.

**Efeito medido pela leitura do código**: jogador mega (meta 6) com 9 itens
cadastrados para hoje que fez 6 — **cumpriu a meta, não perde nada, ganha o dia
perfeito** — vê na tela de início do celular:

| | hoje | correto |
|---|---|---|
| widget | `6/9` | `6/6` |
| mensagem do widget | `"💪 Quase lá!"` (ratio 0,67) | `"✨ Dia perfeito!"` |
| widget chat (`WidgetRenderer.kt:108`) | `"3 task(s) left, let's go!"` | "conseguimos!" |

O widget é a superfície que o usuário mais vê e a única que ele não pediu para
abrir. **Ele cobra 3 tarefas que o jogo não cobra, na tela de bloqueio, o dia
inteiro.** Isso é o cobrador que a essência proíbe, entregue por push passivo.

**Conserto**: `dailyTotal` = `dailyGoalFor(gameState, hoje, dayKey)` e
`dailyDone` reportado ao widget = `min(done, meta)`. Dono da regra já existe
(`src/utils/dailyReset.ts:211`) e há guard (`dailyGoal.contract.test.ts`) — que
**não pegou este caso** porque o hook não escreve a fórmula, ele escreve outra
coisa. Vale estender o guard para "denominador exibido == `dailyGoalFor`".

### 🔴 BUG-2 — `progress` (%) é cru E conta sub-passos: o pet fica triste por mérito

`src/hooks/useProgressTracking.ts:76-97` → `App.tsx:1985 energyLevel={progress}`,
`App.tsx:459-463` (humor do pet) e `465-473` (fala do pet).

Dois defeitos empilhados:

- **(a) denominador cru** — mesmo problema do BUG-1.
- **(b) o denominador conta PASSOS, não itens** (l. 81-89): uma atividade com 5
  passos vale **5** no denominador da barra e **1** na meta.

Consequência com número: mega, meta 6, 6 atividades cadastradas, uma delas
quebrada em 5 passos → denominador da barra = 10. Fechou as 6 atividades → barra
= 100%, ok. Mas fechou 4 atividades simples + 3 dos 5 passos da sexta →
`7/10 = 70%` enquanto a meta real está em 4/6 = 67%… e, pior, no início do dia,
`0/10` versus `0/6`: **quem quebra a tarefa em passos vê o pet ficar `tired`
(`progress <= 15`) por mais tempo do que quem não quebra**.

Quebrar tarefa grande em passo pequeno é uma técnica de mudança de comportamento
(BCT "task breakdown", `soulmon-behavioral-psychologist` §1) e o app **tem** o
componente para isso (`StepRow.tsx`). **Hoje o app pune visualmente exatamente o
comportamento que deveria premiar.**

**Conserto**: `progress` = `min(1, dailyDone / dailyGoalFor(...)) × 100`, com
atividade em passos contando como **1 item concluído quando todos os passos
fecham** (é o que `dailyDone` já faz na l. 59-68). Se quiser mostrar o avanço
parcial de passos, que seja uma barra SECUNDÁRIA dentro do card da atividade —
nunca no humor do pet.

### 🔴 BUG-3 — energia cheia usa `required`, não a meta do dia

`src/utils/dailyReset.ts:321-322`

```ts
const energyWasFull = (prev.energyPoints ?? 0) >= requiredToday;   // requisito do ESTÁGIO
const dayWasPerfect = totalTasks > 0 && dailyDone >= dailyGoal && energyWasFull;
```

A mesma linha mistura as duas metas: as tarefas são cobradas contra `dailyGoal`
(min) e a energia contra `requiredToday` (cru). Comida se ganha **1 por
conclusão** (`careRules.ts:243`).

**Cenário concreto, sábado**: mega com atividades só de seg–sex e 2 tarefas
avulsas no sábado. `dailyGoal` = 2. Ele faz as 2 → ganha 2 comidas → energia
máxima possível **2**. `requiredToday` = 6. `energyWasFull` = false →
**dia perfeito negado a quem fez 100% da própria meta**, sem uma linha de aviso.
É a Fase 1 do fix de `tasksCompletedOn` (`round5-final.md:60-98`) repetida no
outro eixo: a meta foi corrigida nas tarefas e ficou crua na energia.

**Conserto**: `energyWasFull = energyPoints >= dailyGoal`. Muda a linha **⚡
Energia** e a linha **⭐ Dia perfeito** do `CLAUDE.md` ("energia cheia (≥
requisito)" → "≥ meta do dia"). Isto é conserto de coerência, não afrouxamento:
a regra prometida em toda parte é `min(cadastradas, requisito)`.

### 🔴 BUG-4 — o teto de 5 comidas/hora torna o dia perfeito **impossível** em mega/ultra numa sessão só

`FOOD_LIMIT_PER_HOUR = 5` (`src/utils/careRules.ts:39`) < `required` de mega e
ultra = **6**.

Jogador mega que faz as 6 tarefas numa única sessão à noite (o padrão real de
quem trabalha) ganha 6 comidas e **só consegue dar 5**: a 6ª barra de energia só
entra depois de a janela deslizante de 60 min liberar. Se ele fechou o dia às
23h10, o dia perfeito **não acontece**, por um limite de ritmo, não por falta de
esforço. Ele fez tudo. **Esta é, na minha leitura, a explicação mecânica mais
provável da queixa "não consigo fazer as N tarefas nos estágios altos"** — ele
provavelmente FEZ, e o jogo disse que não.

Interage com o BUG-3: com o conserto do BUG-3, a meta do dia raramente passa de
5 e o problema quase some; mas em mega/ultra com 6+ cadastradas ele volta.
**Conserto**: `FOOD_LIMIT_PER_HOUR = max(FORM_REQUIREMENTS[*].required) = 6`.
O limite existe para impedir o farm de atributos, e 6 preserva isso (é 1 a mais).
Alternativa mais cirúrgica: comida que apenas leva a energia até a meta do dia
não conta no limite (mesma isenção que chips e coraçãozinhos já têm, `careRules.ts:62`).

### 🟠 BUG-5 — `isDayPerfect` é uma segunda definição viva de "dia perfeito"

`src/hooks/useProgressTracking.ts:74`. **Já está registrado como código morto em
`product/soulmon-01/sweeper/round5-final.md:391`** — `App.tsx:411` desestrutura
só `dailyTotal, dailyDone, progress`. Confirmei: nenhum outro consumidor no
repositório.

Ou seja: **não vaza para o usuário hoje**. Mas é exatamente o footgun 9 em
estado latente — uma definição de `isDayPerfect` que exige `dailyDone ===
dailyTotal` (fazer TUDO), pronta para o primeiro dev que precisar de "o dia foi
perfeito?" na UI. **Conserto**: apagar a linha 74 e removê-la do retorno. Quem
precisar da resposta lê `lastDayReport.wasPerfect`, como `dailyReset.ts:44-51`
manda.

### 🟡 BUG-6 — `registeredTasks` cru no `EvolveTaskModal`

`App.tsx:2531`: `gameState.activities.length + gameState.tasks.length` — sem
filtro de dia da semana e sem `tasksCompletedOn`. É o componente (b) do bug já
documentado em `dailyReset.ts:144-162`, sobrevivendo num call site. Efeito:
o modal de evolução diz "você já tem tarefas suficientes" contando atividades de
seg–sex para um jogador que está vendo aquilo num sábado. **Conserto**:
`registeredForDay(gameState, hoje, dayKey)`.

### O que NÃO é bug — é desenho, e é decisão do dono

| # | Fato | Por que é desenho |
|---|---|---|
| D1 | Para **não perder coração** o mega precisa de **5 de 6** e o ultimate de **4 de 5** (`tasksToAvoidHeartLoss`, derivado de `floor((1−feitas/meta)×maxHP)`) | Está correto e é coerente com a fórmula. Mas é a definição operacional de "carga alta": nos estágios altos, o dia só é seguro a ~83%. **Isto é a queixa 1 do usuário, e é balanceamento de verdade.** |
| D2 | Requisito é **fixo por estágio** e não conhece a semana da pessoa | Escolha explícita (`progression.ts:8-13`, a escada achata no topo de propósito). O que falta não é diminuir — é dar **variância legítima** entre os dias. |
| D3 | Não existe **folga** de nenhum tipo | Existem perdões (teto 1♥/dia, `ABSENCE_FORGIVENESS_DAYS`, `WEEKLY_RELIEF_HEARTS`) mas **todos são reativos**: só valem depois que a coisa deu errado. Não há nada que o usuário possa **declarar antes**. |
| D4 | Planejar a semana é 100% manual (`weekDays` por atividade) | É a queixa 2, e é 100% fricção de UI — nenhuma regra do jogo precisa mudar. |

---

## 2. Pesquisa — como os outros resolvem

Complementa o benchmark de ago/2026 de `docs/PLANO-EVOLUCAO.md` nos 4 eixos
pedidos.

**(a) Meta diária variável / frequência flexível** — o **Streaks** deixa o
usuário definir a habit como "X vezes por semana" ou em dias específicos, em vez
de diária; a leitura da comunidade é que a frequência flexível existe justamente
porque agenda rígida quebra quando trabalho e família invadem o dia
([Zapier](https://zapier.com/blog/best-habit-tracker-app/),
[The Sweet Setup](https://thesweetsetup.com/apps/best-habit-tracking-app-ios/)).
→ Tradução para o Soulmon: o app **já tem** `weekDays` e `dailyGoalFor` já
respeita o dia da semana. A capacidade existe; o que falta é o usuário
conseguir usá-la sem trabalho (ver P4).

**(b) Dia de folga / rest day** — o **Habitica** tem *Rest in the Inn*: o jogador
não perde vida nem streak pelas Dailies não feitas enquanto descansa, **e ainda
pode marcá-las se quiser**, ganhando ouro/XP normalmente
([Habitica Wiki](https://habitica.fandom.com/wiki/Rest_in_the_Inn),
[blog oficial](https://habitica.wordpress.com/2020/05/13/rest-in-the-inn/)). O
detalhe que importa: **descansar não é o mesmo que não jogar** — a recompensa
continua disponível, só a punição sai. O **Finch** vai além e não pune nada: o
pássaro nunca morre nem some, ele "espera pacientemente"
([Calmevo](https://calmevo.com/finch-app-review/),
[AuDHD Flourishing](https://www.audhdflourishing.com/post/finch-adhd-self-care-app)).

**(c) O usuário que se sabota cadastrando demais** — o **Duolingo** trata o
lapso com o *streak freeze*, e a peça de design que interessa é operacional:
ele é **concedido automaticamente e consumido sozinho**, colocado no bolso do
usuário **antes** de ele precisar — porque quem acabou de perder o dia, por
definição, não está no app para ir comprar proteção
([Duolingo Wiki](https://duolingo.fandom.com/wiki/Shop/Streak_freeze),
[Deconstructor of Fun](https://duolingo.deconstructoroffun.com/mechanics/streaks)).
A empresa chama streaks de "a alavanca de retenção mais efetiva do produto", e a
mesma fonte descreve o mecanismo como exploração de **aversão à perda** — o que
é exatamente o que a essência do Soulmon recusa como motor principal.

**(d) Planejamento semanal sem fricção** — nenhum dos benchmarks resolve isso com
um planejador; todos resolvem com **presets de um toque** na criação do item
(Streaks: diária / X por semana / dias específicos). A conclusão de pesquisa é
negativa e útil: **ninguém planeja a semana num app de hábito. Quem tenta,
desiste.** Planejamento tem que ser subproduto de uma escolha de 1 toque no
momento do cadastro, ou não acontece.

---

## 3. Proposta de balanceamento

Ordem = razão impacto/risco. Cada item traz o número, o arquivo e a linha do
`CLAUDE.md` que muda.

### P0 — Consertar os 6 bugs acima (não é balanceamento, é honestidade)

Sem P0, qualquer número novo será exibido errado do mesmo jeito. **Nada mais
deve entrar antes disto.** Custo estimado: baixo, 4 arquivos, nenhum é
`src/components/`. Não muda nenhuma linha do `CLAUDE.md` exceto ⚡/⭐ (BUG-3).

### P1 — Meta de coração ≠ meta de dia perfeito (a "meta mínima vs. meta ideal")

O Habitica separa **Dailies** (obrigatório, machuca) de **Habits** (bônus, não
machuca). O Soulmon tem os dois eixos escondidos num número só.

**Proposta com número**: introduzir `HEART_GOAL_RATIO = 0,6` e

```
heartGoal = max(1, ceil(dailyGoal × 0,6))
```

usado **apenas** em `rawHeartsLostFor` / `tasksToAvoidHeartLoss`
(`src/utils/dailyReset.ts:227` e `:247`). `dayWasPerfect` continua exigindo
`dailyDone >= dailyGoal` inteiro.

Efeito, em número:

| estágio | meta (ideal) | itens p/ não perder ♥ hoje | com P1 |
|---|---|---|---|
| rookie | 4 | 3 | **3** (igual) |
| champion | 5 | 4 | **3** |
| ultimate | 5 | 4 | **3** |
| mega | 6 | 5 | **4** |
| ultra | 6 | 5 | **4** |

Leitura: **a excelência continua custando 6; a segurança passa a custar 4.**
O jogador ruim de um dia ruim para de perder coração; o jogador que quer evoluir
continua tendo que fazer tudo. Nada foi afrouxado no caminho da evolução —
respeita o princípio permanente #3 ("modernizar o atrito, nunca a dificuldade").

⚠️ **Muda a linha ❤️ Corações do `CLAUDE.md`** (a fórmula passa a usar
`heartGoal` no lugar de `meta`). **É decisão do dono**: muda a experiência de
quem já joga — para melhor, mas muda.

Crítica honesta: reduz o stake do v-pet. Mitigação: o stake real do Soulmon é a
**evolução** (`perfectDays`, único caminho com `MANUAL_EVOLUTION`), e ela não é
tocada. O coração vira o que a essência diz que ele é — o retrato do cuidado,
não a fatura.

### P2 — Dia de folga declarado: 1 por semana, grátis, automático

Modelo: Habitica Inn (não punir) + Duolingo (já estar no bolso, consumido
sozinho) + Pokémon Sleep (você não ganha, mas nunca perde).

**Números exatos**:
- `REST_DAYS_PER_WEEK = 1`, recarga na virada de **domingo→segunda** (mesma
  virada de `WEEKLY_RELIEF_HEARTS`, `dailyReset.ts:356`), **sem acúmulo** (teto 1).
- Consumo **automático** na virada: se `heartsLost > 0` e há folga disponível,
  a folga é gasta, `heartsLost = 0`, e o `lastDayReport` diz o que aconteceu.
- O dia de folga **não** vira dia perfeito (`dayWasPerfect` intocado). Não ganha,
  não perde — é o formato do Pokémon Sleep, o produto do benchmark com a menor
  queda no ano 3.
- Se o jogador marcar tarefas nesse dia, tudo o que ele fez vale normalmente
  (comida, atributos, Bits) — a lição do Inn: **descansar não é sair do jogo**.

Por que automático e retroativo, e não "marque folga hoje": quem precisou de
folga não abriu o app. Uma folga que precisa ser declarada de antemão é mais um
item de planejamento — exatamente a fricção da queixa 2.

⚠️ **Muda a linha ❤️ Corações** (novo perdão nomeado) e acrescenta campo ao
GameState (`restDaysLeft`, `restWeekKey`) — lembrar do `?? padrão` no load.
**Decisão do dono.**

Crítica honesta: com P1 + P2 juntos, um jogador mega pode fazer 4/6 seis dias e
0 no sétimo sem nunca perder um coração. Isso é intencional e é o ponto: **a
degeneração passa a exigir negligência real (3 dias abaixo de 4/6 na mesma
semana), não um dia de gripe.** Se o dono achar generoso demais, o botão de
ajuste é `HEART_GOAL_RATIO` (0,6 → 0,7 devolve mega a 5/6), **não** tirar a folga.

### P3 — Alívio adaptativo (meta que cede, nunca que aperta)

Pedido: "meta que se adapta ao histórico". **Aceito pela metade e digo qual.**

- **Adaptar para baixo: sim.** `heartGoal` cai **1** (piso 2) após **2 viradas
  consecutivas** com `dailyDone < heartGoal`, e volta ao valor cheio na primeira
  virada em que o jogador cumprir. Estado: `softGoalRelief: 0|1` no GameState.
  Efeito concreto no mega: **a meta de coração cai de 4 para 3 após 2 dias
  falhos.**
- **Adaptar para cima: RECUSADO.** Meta que sobe com bom desempenho é a esteira
  do Vital Bracelet, e o próprio `PLANO-EVOLUCAO.md` já diagnosticou que foi ela
  que fez os donos pararem nos estágios médios ("o custo real ultrapassa a
  vontade justamente no terço final", `progression.ts:8-13`). Um jogador nunca
  pode ser punido por ter tido uma boa semana.

Crítica: dá para "gamear" falhando de propósito. Irrelevante — não há vantagem
competitiva em HP, e o caminho de evolução (`perfectDays`) não cede um milímetro.
Quem "gameia" o alívio só está optando por não evoluir, o que é uma escolha
legítima.

#### ⏸️ ADIADA em 08/09/2026 — decisão do dono, e o que reabre

**Não é recusa.** É "ainda não", e o motivo é que decidir agora seria decidir no
escuro. Leia isto antes de implementar a P3 em qualquer sessão futura.

**1. A proposta acima tem DUAS leituras incompatíveis, e ninguém escolheu.**
A frase é *"volta ao valor cheio na primeira virada em que o jogador cumprir"* —
cumprir o quê?

| Leitura | O que acontece com um mega fazendo 3 de 6 todo dia |
|---|---|
| **A — cumprir a meta REDUZIDA** | serrilhado: o alívio liga no dia 3, zera no mesmo dia, e a meta volta a 4 no dia 4. Ele **ainda degenera**, ~40% mais devagar. Pior dos dois mundos: não salva quem afunda e ainda faz o número da tela oscilar sem explicação |
| **B — cumprir a meta CHEIA** | o alívio fica ligado até ele fazer 4 de verdade. **3 de 6 para sempre passa a ser sustentável** — nunca mais perde coração |

A B não é ajuste, é decisão de produto: significa que existe um patamar em que o
jogo **para de cobrar, indefinidamente**.

**2. Os números da proposta são PRÉ-P1 e PRÉ-P2.** Quando ela foi escrita, o
mega precisava de 5 de 6 e não havia folga semanal. Hoje precisa de 4, e a
primeira falha da semana já é absorvida. Além disso, **o dia perdoado pela folga
continua contando como dia falho** para o contador da P3 — então o alívio
chegaria um dia antes do que a proposta imaginava. Refaça as contas antes de
usar qualquer número desta seção.

**3. Custo escondido na UI.** `tasksToAvoidHeartLoss` é dono único do número que
a tela promete. Com a P3 ele cai de 4 para 3 sozinho depois de dois dias ruins.
Ou o app **conta** isso — e "baixei sua meta porque você falhou duas vezes" é
difícil de escrever sem soar condescendente — ou fica em silêncio, que é
mecânica escondida, exatamente o que foi recusado para a folga (por isso existe
`lastDayReport.restDayUsed`).

**4. Seria o SEXTO perdão empilhado**: teto de 1 coração/dia, perdão de
ausência, alívio de segunda, P1 (meta de coração a 60%) e P2 (folga semanal).

#### O gatilho para reabrir

A pergunta que decide a P3 não é de design, é de fato: **o jogador que faz 3 de
6 é o caso comum ou a exceção?**

- **Se for exceção** → a P3 é um mecanismo permanente para um caso raro. Não vale.
- **Se for a regra** → o problema nunca foi o perdão, e sim o `required: 6` do
  mega estar alto demais. O conserto certo é mexer em `FORM_REQUIREMENTS`, não
  empilhar um sexto perdão por cima.

E não dá para responder isso hoje **porque não há um único usuário para medir**
(ver `docs/STATUS.md`, "ninguém nunca usou o app em produção"). Logo: reabra a
P3 quando houver telemetria de distribuição de `dailyDone/heartGoal` por
estágio — o que depende dos itens 9 a 12 de `docs/DEPENDE-DE-VOCE.md`, não de
código.

### P4 — Presets de rotina de 1 toque (mata a queixa 2, sem tocar em regra)

A pesquisa foi clara: **ninguém planeja a semana.** Então não peça planejamento
— peça **uma escolha**.

- No cadastro de atividade, 3 chips de 1 toque em vez da grade de 7 dias:
  **"Todo dia" (7) · "Dias úteis" (seg–sex) · "Leve" (seg/qua/sex)**. A grade
  completa continua atrás de um "Personalizar".
- Botão **"Equilibrar minha semana"** na página de Atividades: redistribui as
  atividades já cadastradas pelos 7 dias de modo que **nenhum dia fique com mais
  que `required` itens**, mostra o antes/depois em uma tela e **exige
  confirmação**. Nunca roda sozinho — autoria da meta é o que sustenta a
  motivação intrínseca (SDT); um app que reorganiza a vida da pessoa sem
  perguntar é o chefe de novo.
- Copy do botão em tom de companheiro, nunca de auditor: *"Quer que eu espalhe
  isso pela semana? Assim sobram dias mais leves."*

**Não muda nenhuma linha do `CLAUDE.md`.** É a proposta de maior retorno por
esforço da lista inteira, e é a única que ataca a queixa 2 diretamente.
(É UI — `src/components/` é território de outro agente; aqui fica a especificação.)

### P5 — Desacoplar `perfectDay` de "fazer tudo"

Já está desacoplado **na regra que cobra**. O que falta é:
1. BUG-1/BUG-2 (a exibição),
2. BUG-3 (a energia),
3. BUG-4 (o teto de comida).

**Não proponho mudar `dayWasPerfect`.** `dailyDone >= dailyGoal &&
totalTasks > 0` já é a definição certa. Registro só uma nota de tom, que é do
`soulmon-behavioral-psychologist`: **"dia perfeito" é um nome perigoso para
traço perfeccionista.** Como o contador nunca decresce (`perfectDays` só
acumula), o nome é pior que o mecanismo. Renomear para **"dia completo"** custa
uma string PT/EN e remove a palavra "perfeito" da conversa interna do usuário.
Decisão do dono, baixo custo, não muda nada mecânico.

### Resumo da fila

| # | O quê | Muda `CLAUDE.md`? | Quem decide | Estado |
|---|---|---|---|---|
| P0 | Corrigir BUG-1…6 | só ⚡/⭐ (BUG-3) | conserto óbvio | ✅ **feito** — conferido no código em 07/09/2026: `dailyTotal` sai de `dailyGoalFor` e `dailyDone` é limitado à meta (BUG-1/2), `energyWasFull >= dailyGoal` (BUG-3), `FOOD_LIMIT_PER_HOUR = MAX_STAGE_REQUIREMENT` (BUG-4), `isDayPerfect` apagado e travado por teste (BUG-5), `registeredForDay(...)` no `EvolveTaskModal` (BUG-6) |
| P4 | Presets de rotina + "Equilibrar minha semana" | não | conserto óbvio (é UI) | ✅ **feito em 07/09/2026** — `src/utils/weekBalance.ts`, `ROUTINE_PRESETS` em `taskModel.ts`, `BalanceWeekModal` |
| P1 | `HEART_GOAL_RATIO = 0,6` | ❤️ | **dono** | ✅ **aprovado e entregue em 07/09/2026** — `heartGoalFor`/`heartGoalFromDailyGoal` em `dailyReset.ts`, com `heartGoal.test.ts` travando que o desconto NÃO vaza para o dia completo |
| P2 | 1 dia de folga/semana, automático | ❤️ | **dono** | ✅ **aprovado e entregue em 07/09/2026** — `REST_DAYS_PER_WEEK`/`restWeekKeyFor`, campos `restDaysLeft`/`restWeekKey` no save, e o relatório do dia CONTA que a folga foi usada (`restDay.test.ts`) |
| P3 | Alívio adaptativo (−1 após 2 dias falhos) | ❤️ | **dono** | ⏸️ **ADIADA em 08/09/2026** — não recusada. O gatilho para reabrir e as duas leituras incompatíveis da proposta estão na seção 3-P3 abaixo |
| P5 | "dia perfeito" → "dia completo" | ⭐ (só o nome) | **dono** | ✅ **aprovado e entregue em 07/09/2026** — 13 arquivos, só dentro de literais de string; `perfectDays`/`wasPerfect` intocados no código |

---

## 4. O que EU RECUSEI, e por quê

A essência proíbe cobrança. As propostas abaixo aumentariam engajamento e estão
fora **por isso**.

1. **Streak visível de dias consecutivos.** É a alavanca de retenção mais forte
   que existe (a própria Duolingo diz isso), e funciona por **aversão à perda** —
   a fonte descreve o mecanismo explicitamente assim
   ([Deconstructor of Fun](https://duolingo.deconstructoroffun.com/mechanics/streaks)).
   Um contador que zera dispara o *what-the-hell effect*: depois de quebrar,
   abandona-se tudo. O Soulmon já resolveu isso de forma superior — `perfectDays`
   **só acumula** (`dailyReset.ts:364-366`). Não voltar atrás.

2. **Vender folga / perdão / "streak freeze" por Bits ou Créditos.** Cruza o
   princípio permanente #1: *"dinheiro real compra conveniência, cosmético e
   identidade — nunca o comportamento nem o perdão dele"*. Se a folga tiver
   preço, ela vira uma dívida com o app. A folga do P2 é **grátis, automática e
   invisível até ser usada**. (Nota adjacente: a "cura instantânea por Créditos"
   já listada em `PLANO-EVOLUCAO.md` §Depende do dono é a mesma fronteira e
   merece a mesma leitura.)

3. **Qualquer notificação nova de cobrança.** Já existem nudges às 10h e 16h
   (`NotificationManager.tsx:202,211`). Adicionar "faltam 2 tarefas!" seria
   transformar o conserto do BUG-1 num novo cobrador por outro canal. E há um
   agravante operacional: **o nudge das 21h foi removido do produto e continua
   vivo no servidor** (`docs/DEPENDE-DE-VOCE.md` item 1) — o `wrangler deploy`
   dos `workers/` é pré-requisito de qualquer discussão sobre tom, porque hoje o
   usuário recebe cobrança que o repositório já apagou.

4. **Meta que sobe com desempenho** (P3, metade recusada). Ver acima.

5. **Reduzir o `cap` de atividades para "proteger" o usuário de cadastrar
   demais.** Recusado: cadastrar muito é comportamento saudável e a regra
   `min(cadastradas, requisito)` já neutraliza o risco. O problema nunca foi o
   usuário cadastrar demais — foi o app **mostrar** que isso o penaliza. Limitar
   o cadastro seria consertar o usuário em vez do bug.

6. **Perguntar "como foi seu dia?" e usar a resposta na meta.** Já existe
   check-in de humor, e a linha 😊 do `CLAUDE.md` é explícita: humor **nunca**
   alimenta pontuação, com teste travando. Uma "meta adaptada ao humor" pareceria
   empatia e faria a pessoa responder o que rende ponto em vez do que sente.

7. **Pausa manual estilo "modo férias" com data de início e fim.** Recusada em
   favor do P2: é mais planejamento, e planejamento é a fricção da queixa 2. O
   Inn do Habitica funciona porque é 1 toque; uma tela de datas não é.

---

## 5. Como medir se funcionou (sem virar vigilância)

Partindo do fato de que **o Soulmon não tem telemetria nenhuma** — toda afirmação
sobre comportamento aqui, inclusive a minha, é hipótese (`soulmon-retention-analyst`).

### Métrica-farol

> **Taxa de meta própria cumprida** — % de dias ativos em que
> `dailyDone >= dailyGoal`, por usuário, por semana.

Por que esta: mede a **promessa do produto** (a pessoa fez o que ela mesma se
comprometeu a fazer), e não o vício no app. É deliberadamente contra o
denominador cru — o número mede a pessoa contra ela mesma, como o resto do jogo.

Baseline: **desconhecido, e é o primeiro item a instrumentar.** Sem baseline, não
declare vitória. Meta proposta para depois de 4 semanas com P0+P1+P2:
**baseline + 15 pontos percentuais**, com o guarda-corpo abaixo estável.

### Métricas de entrada (as alavancas)

| Métrica | O que testa |
|---|---|
| % de dias com `heartsLost > 0` | P1 funcionou? Alvo: cair, mas **não a zero** — zero significa que não há mais stake |
| % de dias de folga consumidos por semana | P2 é usado? Se ficar perto de 0, o problema não era folga |
| nº mediano de dias da semana com ≥1 atividade cadastrada | P4 funcionou? Alvo: subir (rotina espalhada, não amontoada) |
| desvio-padrão de itens por dia da semana | a queixa 2 era desequilíbrio; alvo: **cair** |
| taxa de dias completos (ex-"perfeitos") | P0 (BUG-3/BUG-4) sozinho deve subir isto sem afrouxar nada |

### Guarda-corpos (se piorarem, estamos otimizando dano)

- **Churn nos 7 dias seguintes ao primeiro dia com perda de coração** — o maior
  ponto de churn suspeito do produto inteiro.
- **Taxa de desativação de notificações.**
- **Aberturas por dia acima de 4** — o `PLANO-EVOLUCAO.md` §4.5 diz que o dia
  cabe em ~3. Mais que isso é ansiedade, não engajamento. Aqui, **subir é ruim**.
- **Retorno após ausência ≥3 dias** — se cair, o acolhimento não está acolhendo.

### Instrumentação sem vigilância — a regra

1. **Nada de conteúdo.** Nunca sai o nome, a categoria, o horário ou o texto de
   nenhuma tarefa. Só contadores.
2. **Agregação no cliente, dentro do próprio save.** Ex.: `weekStats: { weekKey,
   daysActive, daysGoalMet, daysHeartLost, restUsed }` — 5 inteiros por semana,
   janela de 12 semanas, gravados na virada (`computeDailyReset`, que já é o
   único ponto que fecha o dia). Zero evento por ação, zero rede nova: o campo
   sobe junto no cloud save que já existe.
3. **Nada de sinal inferido** (passos, tempo de tela, geolocalização) —
   princípio permanente #6.
4. **Devolver ao usuário.** Regra do check-in de humor, linha 😊 do `CLAUDE.md`:
   *coletar e não devolver é extração*. O mesmo `weekStats` deve virar uma tela
   de "sua semana" — e sem ranking, sem comparação com outros e sem "você caiu
   12% em relação à semana passada". Só o retrato.
5. **Antes de qualquer A/B**: a base é pequena demais para significância.
   A sequência correta é **qualitativa agora** (5 usuários, teste moderado,
   entrevista pós-churn), quantitativa depois de escala.

### O experimento mais barato, e é sem código

Antes de P1/P2, mostre a **mesma tela com o denominador consertado** (P0) a 5
usuários que reclamaram e pergunte se a carga ainda parece injusta. Hipótese
falsificável e desconfortável: **é possível que P0 sozinho resolva 60% da queixa
1 e toda a queixa 3.** Se resolver, P1 e P2 entram por mérito próprio — não como
remendo de um problema que era de exibição.

---

## 6. Separação final: conserto óbvio × decisão do dono

**Conserto óbvio (podem ir sem consulta):** BUG-1, BUG-2, BUG-4, BUG-5, BUG-6 e
P4. Nenhum deles muda a regra cobrada — todos fazem a tela contar a verdade que
o código já aplica.

**Decisão do dono (mudam a experiência de quem já joga):** BUG-3 (é conserto de
coerência, mas mexe nas linhas ⚡/⭐ do `CLAUDE.md` e torna o dia perfeito mais
acessível), P1, P2, P3 e P5.

**Pré-requisito operacional de tudo:** `cd workers && npx wrangler deploy`
(`DEPENDE-DE-VOCE.md` item 1). Discutir tom de cobrança com um nudge de 21h vivo
em produção é discutir o cardápio com a cozinha pegando fogo.

---

## Fontes

- [Habitica Wiki — Rest in the Inn](https://habitica.fandom.com/wiki/Rest_in_the_Inn)
- [Habitica blog — Rest in the Inn (2020)](https://habitica.wordpress.com/2020/05/13/rest-in-the-inn/)
- [Duolingo Wiki — Streak Freeze](https://duolingo.fandom.com/wiki/Shop/Streak_freeze)
- [Deconstructor of Fun — Duolingo Streaks: How the Mechanic Drives 2x Daily Retention](https://duolingo.deconstructoroffun.com/mechanics/streaks)
- [Zapier — The 5 best habit tracker apps (Streaks: frequência flexível)](https://zapier.com/blog/best-habit-tracker-app/)
- [The Sweet Setup — Best Habit Tracking App for iOS](https://thesweetsetup.com/apps/best-habit-tracking-app-ios/)
- [Calmevo — Finch App Review 2026](https://calmevo.com/finch-app-review/)
- [AuDHD Flourishing — Finch: ND-friendly self-care app](https://www.audhdflourishing.com/post/finch-adhd-self-care-app)
- Benchmark interno já produzido: `docs/PLANO-EVOLUCAO.md` (Pokémon Sleep, V-Pet,
  Vital Bracelet, Pokémon GO — com os números de receita/retenção).
