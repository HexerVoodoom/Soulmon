# Mecanismo e Ética — Soulmon · run `soulmon-01` · Fase 0

> **P3–P8 respondidas por default do HANDOFF, não por escolha explícita do dono.**
> Agente: `alpha-comportamento`. Data: 2026-08-25.
>
> **Trava de honestidade que rege este documento inteiro:** P4=B — não há telemetria
> coletando. **Nenhuma linha abaixo é medição.** Onde há número, ele está rotulado
> `[previsão]` com ordem de grandeza e o teste que o falsearia. Onde há mecanismo sem
> conduta observada, está rotulado `[hipótese]`. O repo já registra uma auditoria que
> "produziu opinião com aparência de diagnóstico" (`PLANO-PRODUTO.md:88`) — a diferença
> entre este doc e aquele é que este declara o rótulo antes de alguém perguntar.
>
> **Aviso de método:** eu não observei um único usuário do Soulmon. O que eu tenho é a
> **conduta que o código FORÇA** (isso é observável e é o que auditei) e a **conduta que o
> código PREVÊ** (isso é hipótese). Não confundi as duas em nenhum item.

> ## ⚠️ CORREÇÃO PÓS-GATE (2026-08-25)
>
> Este artefato **não afirmou "jogadores reais"** em nenhum ponto — sua trava de método já
> era, corretamente, "eu não observei um único usuário do Soulmon" e todo achado já saía
> `[hipótese]`. Por isso, **nada aqui precisa de correção in loco**: a disciplina de rótulo
> já era a correta.
>
> **O que sobe/desce com a correção de contexto** (`gate.md` → Recalibração):
> - **C1 (dreno de cocô), C3 (`tasksDone` exposto) e C4 (cap do demo) continuam válidos como
>   achados de mecanismo e de contradição entre promessa e código** — eles não dependiam de
>   população real para existir: são propriedades do código, não do comportamento medido.
> - **A leitura de "quem" é afetado por C3 muda**: o `pushProfile`/diretório público, se
>   explorado hoje, exporia dado de **quem realmente tem perfil populado no KV
>   compartilhado** — na prática, hoje, o próprio dono e, pelo lado do DigiApp, a namorada
>   dele. Não há "outro jogador" de terceiro do Soulmon para comparar.
> - **V2–V8 (validações com humanos) seguem corretamente marcadas como dependentes de
>   população que ainda não existe** — a correção de contexto torna isso mais explícito, não
>   diferente: nenhuma das validações listadas em "O que precisa ser validado com humanos"
>   é executável hoje sem antes trazer gente de fora, e **V1 continua sendo a única que não
>   depende de ninguém** (é teste automatizado de código).
> - **A.0/A.1** (o mecanismo de conversão "acontece antes do diferencial poder agir") fica
>   **reforçado**: com zero população paga real, a afirmação de que "a conversão precisa
>   acontecer por outro mecanismo que não o pet único" deixa de ser só lógica de funil — é
>   também, literalmente, a única coisa que pode ser testada primeiro.

---

# PARTE B — FILTRO ÉTICO: onde o Soulmon já é um cobrador

> Esta parte vem primeiro de propósito. Era o mandato central do despacho e é onde estão
> os achados que mudam decisão.
>
> **Critério de auditoria.** Não auditei a intenção declarada (`PLANO-PRODUTO.md:63`,
> `CLAUDE.md:17-21`) — auditei o **produto construído**. A pergunta operacional foi:
> *existe algum caminho no código em que o app tira algo do usuário, mede o usuário contra
> outro, ou cria obrigação com prazo, por um motivo que não seja "ele decidiu isso"?*
>
> **Veredito curto:** a **camada de regras** (`habitRhythm.ts`, `taskTriage.ts`,
> `dailyReset.ts`, `restWindow.ts`, `tournamentTiers.ts`) é, honestamente, das mais
> cuidadosas que eu já li — cada constante tem o modo de falha escrito ao lado. O problema
> **não está lá**. Está em três lugares que ficaram fora do alcance dessa disciplina:
> **(1)** o dreno de cocô, que vive em `App.tsx` e não em `dailyReset.ts`; **(2)** a camada
> de monetização (`monetization.ts`, `CreditsModal.tsx`), que nunca passou pelo mesmo
> crivo; **(3)** a camada de comunidade (`community.ts`, `PlayerDetailModal.tsx`), que
> publica um número que a camada de regras teve o cuidado de nunca exibir.
>
> O padrão é nítido e vale nomear: **a essência foi aplicada onde a regra é regra, e não
> foi aplicada onde a regra virou tela, moeda ou rede.**

---

## C1 🔴 — O dreno de cocô é a única perda sem teto do jogo, e ele cobra ausência

**Onde:** `src/App.tsx:2007-2029` (o `setGameState` do efeito de dreno).
Constante do período: `App.tsx:1981` (`SIX_HOURS`). Regra documentada: `CLAUDE.md:84`.

```
healthPoints: Math.max(0, prev.healthPoints - periods),   // App.tsx:2027
```

**A conduta que o código força** (isto é observável no código, não é hipótese):

| Promessa do produto | Onde está escrita | O que o dreno de cocô faz |
|---|---|---|
| "Teto de 1 coração por dia — um dia ruim é um sinal, não uma sentença" | `CLAUDE.md:76`, `dailyReset.ts:125` | `periods` é **irrestrito**. Não passa por `MAX_HEARTS_LOST_PER_DAY`, não passa por `lossCap` (`dailyReset.ts:607`), não passa pelo traço Teimoso |
| "Ausência ≥2 dias não cobra nada: quem volta encontra saudade, não fatura" | `CLAUDE.md:76`, `dailyReset.ts:571,588` | `forgivesHP` (`dailyReset.ts:588`) **não existe neste caminho de código**. O dreno mora em `App.tsx`, fora de `computeDailyReset()` |
| "O jogo NUNCA cobra da barra que representa o cuidado que o usuário teve consigo mesmo" | `CLAUDE.md:94` (regra da masmorra) | O dreno cobra **exatamente** essa barra, e por passagem de tempo — não por escolha |

**A aritmética.** `periods = floor((now − clock) / 6h)` cobrado de uma vez, sem teto, sobre
um `maxHealthPoints` que é **3** em rookie/champion/ultimate e **4** em mega
(`CLAUDE.md:124`). Vinte e quatro horas com um cocô na tela = até 4 corações = **pet em
HP 0 → degeneração**, num dia em que a regra oficial permitia perder no máximo **1**.

**O caso que quebra a promessa central do produto** `[hipótese — o experimento está abaixo]`:
o usuário fecha o app com um cocô não limpo e some 2 dias. `poopPenaltyClockAt` está
persistido no save (`GameStateContext.tsx:205,689`). Ele reabre. O efeito de dreno chama
`drain()` **imediatamente na montagem** (`App.tsx:2032`), enquanto `useDailyReset` apenas
*agenda* o check da virada (a cada 30s — `CLAUDE.md:143`). Se o dreno ganha a corrida do
zeramento em `dailyReset.ts:769`, o retorno é cobrado retroativamente pelas horas em que a
pessoa **não estava lá** — que é o instante exato que `ABSENCE_FORGIVENESS_DAYS` foi criado
para proteger.

> **Isto é hipótese de ordenação, não um bug medido.** O que é FATO no código é que o
> dreno não consulta `forgivesHP` nem `MAX_HEARTS_LOST_PER_DAY` em nenhuma hipótese.

**Experimento que falseia (barato, 20 min, não precisa de telemetria):** teste de
`useDailyReset` semeando `poopPenaltyClockAt = now − 30h`, `poopEventsShown` com um item
não limpo, `lastResetDate = now − 3 dias`, e montando o app. Se `healthPoints` cai mais que
`MAX_HEARTS_LOST_PER_DAY`, C1 está confirmado. **Não existe teste cobrindo isso hoje** — os
testes de cocô que achei (`useDailyReset.test.ts:234-242`) verificam só que o relógio zera
na virada, nunca quanto ele já cobrou antes de zerar.

**Mecanismo pelo qual isso cobra.** Três, empilhados:

1. **Aversão à perda** (Kahneman & Tversky, *Prospect Theory*, Econometrica 1979): a perda
   pesa cerca de 2× o ganho equivalente. Um coração perdido não é neutralizado por um
   coração ganho depois — a assimetria é o mecanismo.
2. **Contingência de tempo, não de comportamento.** Toda a tese do motor de tarefas é
   premiar **comportamento**, nunca resultado ou relógio (`CLAUDE.md:116`, sobre a Janela de
   Descanso). O dreno de cocô é a única mecânica do app contingente a **tempo decorrido** —
   a estrutura formal de reforço do Tamagotchi de 1996, e a razão pela qual o gênero é
   lembrado por *culpa*. Ele viola a regra que o próprio repo escreveu duas tabelas acima.
3. **Custo de ausência assimétrico** → alimenta o *what-the-hell effect* (Polivy & Herman,
   1985): a pessoa que volta e encontra o pet degenerado não perde um dia, ela desinstala.
   É o mecanismo que `habitRhythm.ts:33-39` cita nominalmente para justificar não ter
   streak — e que o dreno de cocô reintroduz por outra porta.

**Explicação concorrente (e é forte).** O dreno pode não estar produzindo dano nenhum na
prática, porque: (a) o cocô só aparece 2×/dia em janelas diurnas (`CLAUDE.md:84`);
(b) o sono pausa o relógio (`App.tsx:2018`); (c) quem abre o app todo dia limpa em minutos
e nunca chega perto de 6h. Nesse mundo, C1 é um risco teórico que atinge só o usuário que
já estava indo embora.

**O dado que separa as duas leituras:** distribuição de `periods` no momento do dreno.
Se a esmagadora maioria dos ticks é `periods = 1` isolado, é ruído de desenho. Se existe
uma cauda com `periods ≥ 2`, ela está concentrada **exatamente na população que retornou
após ausência** — e aí C1 está destruindo a métrica-assinatura da tese anti-cobrança
(`contexto.md §4`: "retorno após ausência ≥2 dias"). **Nenhum dos dois é observável hoje.**

**Intervenção mínima** (ordem do framework: remover fricção → tornar o certo mais fácil →
informar → só então persuadir). Aqui a intervenção é *remover cobrança*, que é ainda mais
barata:

```
// App.tsx:2027 — uma linha
healthPoints: Math.max(0, prev.healthPoints - Math.min(periods, MAX_HEARTS_LOST_PER_DAY)),
```

E, para fechar o caso da ausência, mover a decisão para onde as outras carências já moram:
o dreno passa a consultar `forgivesHP`/`daysSinceLastReset` antes de cobrar, ou
`poopPenaltyClockAt` é zerado na **hidratação** do save (`GameStateContext.tsx:689`) e não
só na virada — o que também elimina a corrida de C1 sem depender de ordem de efeitos.

**Não quebra o jogo:** o cocô continua aparecendo, continuando incomodando visualmente,
continuando custando 1 coração se ignorado o dia inteiro. O que sai é só o **acúmulo** e a
**cobrança retroativa de ausência**. O loop de cuidado permanece intacto.

**Efeito esperado `[previsão]`:** sobre retorno-após-ausência, **unidades de ponto
percentual, não dezenas**. Intervenções comportamentais de campo têm efeito muito menor que
o de laboratório — DellaVigna & Linos (2022, Econometrica) mediram, em 126 RCTs de nudge
units com ~23 milhões de participantes, efeito médio de **1,4pp sobre base de ~26%**, cerca
de 6× menor que o publicado na literatura acadêmica. Não prometa mais que isso. **A razão
para fazer C1 não é o efeito previsto — é que a mecânica contradiz a promessa escrita do
produto, e isso vale por si.**

---

## C2 🔴 — Curar coração com dinheiro real: o app vende alívio de uma dor que ele fabrica

**Onde:** `src/utils/monetization.ts:78` (`HEART_COST_CREDITS = 10`) ·
`src/components/CreditsModal.tsx:195-206` (a linha "Curar 1 coração agora") ·
`src/App.tsx:2271` (`spendCredits(HEART_COST_CREDITS, 'instant-heal')`).

Créditos são comprados com **dinheiro real** (`CLAUDE.md:93`). O pacote mais barato é
`R$ 4,90 por 60 créditos` (`monetization.ts:85`) → **1 coração ≈ R$ 0,82**.

**Por que isto é diferente de vender um cosmético.** Um cenário da loja é um ganho
opcional. Um coração é a **remoção de uma perda que o próprio app aplicou**. A literatura de
desenho persuasivo chama isso de estrutura *pay-to-relieve*, e ela é o inverso ético de
*pay-to-gain*: o valor percebido não vem do que a pessoa recebe, vem da ansiedade que ela
para de sentir. O motor psicológico é o mesmo de C1 (aversão à perda, Kahneman & Tversky
1979), só que aqui **a assimetria é a proposta comercial**.

**E C1 + C2 juntos são pior que a soma.** O dreno de cocô é hoje a fonte de perda de HP
**mais rápida, mais frequente e a única sem teto** do jogo. A cura instantânea por dinheiro
real é o único jeito de desfazê-la na hora (o carinho cura no máximo 1/dia,
`CLAUDE.md:77`). Isso significa que **a mecânica mais punitiva do app é também a que mais
converte crédito em receita.** Eu não estou afirmando que isso foi desenhado assim — o
comentário em `App.tsx:1977-1978` deixa claro que é herança de gênero, não estratégia. Estou
afirmando que **a estrutura de incentivo existe e não depende da intenção de ninguém para
operar.** Um sistema em que o parâmetro que mais machuca é o que mais fatura vai deriva
sozinho na direção errada na primeira vez que alguém olhar receita e mexer nele.

**Explicação concorrente:** a cura instantânea pode ser lida como *misericórdia paga* — uma
saída para quem se descuidou e não quer ver o pet degenerar, exatamente como o Coraçãozinho
de 150 Bits (`CLAUDE.md:95`) já é, de graça, pela via do jogo. Nessa leitura C2 é uma
conveniência, não uma armadilha.

**O dado que separa:** a **razão de origem** do HP curado com Crédito. Se as curas pagas
acontecem majoritariamente após perda por `dailyReset` (o usuário não fez as tarefas — dor
que ele causou, teto de 1, previsível), é conveniência. Se acontecem majoritariamente após
tick de dreno de cocô (dor que o relógio causou, sem teto), é *pay-to-relieve*, e o app está
monetizando a própria falha de desenho. **Não observável hoje** — mas é um único campo de
telemetria (`heartLossSource`) e é, na minha leitura, o evento de instrumentação de maior
valor ético por unidade de esforço no repo inteiro.

**Filtro ético — veredito:** eu **não recuso** a cura paga como categoria. Ela é legítima se,
e só se, C1 for corrigido primeiro. **Recuso a combinação atual**: vender o antídoto de uma
perda ilimitada que o usuário não controla é a definição operacional de custo escondido.

**Intervenção mínima:** C1 primeiro (uma linha). Depois, C2 fica sob a regra que já existe
no repo e que hoje ele viola por implicação: *"perda só sobre item recuperável (moedas,
escudos), **nunca** sobre identidade ou progresso acumulado"* (`CLAUDE.md:119`). Se HP for
sempre recuperável de graça dentro do dia (carinho + tempo), a cura paga vira pura
conveniência e a estrutura *pay-to-relieve* deixa de existir.

**Caminho honesto equivalente**, se o objetivo for receita e não alívio: mover o gasto de
Crédito para **cosmético e identidade** (que é onde os Emblemas já foram deliberadamente
colocados, `CLAUDE.md:92` — "tudo na aba é COSMÉTICO e isso é regra"). O repo já sabe fazer
a coisa certa; só não aplicou a mesma regra à moeda de dinheiro real.

---

## C3 🔴 — "X tarefas feitas" de outro jogador: um score social de vida real, sem opt-in

**Onde:**
- Origem: `src/contexts/GameStateContext.tsx:929` — `tasksDone: gameState.completedTasks?.length ?? 0`
- Transporte: `src/utils/community.ts:33,43,47` (`PublicProfileInput` / `DirectoryPlayer` / `PlayerDetail`)
- Persistência: `functions/api/community.js:249,107-108`
- **Exibição:** `src/components/PlayerDetailModal.tsx:100-101` —
  `` `${player.daysPlaying} dias jogando · ${player.tasksDone} tarefas feitas · rank ${player.rankPoints}` ``
- Diretório navegável e **pesquisável**: `src/components/LibraryPage.tsx:279-280` + `community.ts:44-45` (`listPlayers(search)`)

**Este é o achado que mais diretamente contradiz o texto que o despacho me mandou auditar.**
`PLANO-PRODUTO.md:69-71` diz que *"o jeito mais comum de virar cobrador não é punir, é
medir"*. `TournamentPage.tsx:27-30` aplica essa doutrina com rigor exemplar: a **faixa** vem
antes do ranking, o ranking é uma janela de ±3 posições, e `tournamentTiers.ts` tem teste
garantindo que acumular pontos nunca rebaixa (`CLAUDE.md:91`).

E então, três telas adiante, o app mostra a **contagem absoluta, bruta, sem faixa e sem
janela, de quantas tarefas da vida real outro ser humano concluiu.**

Repare na diferença de natureza, que é o ponto:

| | Ranking do Torneio | `tasksDone` na Biblioteca |
|---|---|---|
| O que mede | pontos de PvP — **desempenho no jogo** | **conclusões da vida real da pessoa** |
| Enquadramento | faixa primeiro, janela de ±3 | número absoluto e cru |
| Proteção | teste travando não-rebaixamento | nenhuma |

O torneio compara jogadores como *jogadores*. A Biblioteca compara pessoas como *pessoas
que dão ou não conta da própria vida*. É o score que o produto jurou não ter, exibido no
lugar onde ninguém foi procurar por ele.

**Nota de correção pós-gate:** este mecanismo é uma propriedade do **código** — ele existe
independentemente de haver ou não população real hoje. O que muda é quem, concretamente,
seria exposto se o diretório fosse povoado: hoje, o universo real de perfis que poderiam
aparecer aí vem do namespace KV compartilhado com o DigiApp (o dono e a namorada), não de
uma base de jogadores do Soulmon.

**Mecanismo.** Teoria da comparação social (Festinger, *A Theory of Social Comparison
Processes*, Human Relations, 1954): na ausência de critério objetivo, as pessoas se avaliam
contra outras — e comparação **ascendente** (contra quem está melhor) é a que se associa a
afeto negativo. A meta-análise de Gerber, Wheeler & Suls (*Psychological Bulletin*, 2018,
k > 900 estudos) confirma que a comparação ascendente é o padrão dominante e que ela prevê
piora de autoavaliação. **Este é o mecanismo exato do dano de app de métrica que
`PLANO-TAREFAS.md:206` atribui ao público 18–35 do Soulmon — e é o único lugar do produto
onde ele existe de forma pura.**

**Agravante de consentimento:** o `pushProfile` em `GameStateContext.tsx:917-930` roda no
efeito de todo `setGameState` e **não é condicionado a `pvpEnabled`** — `pvpEnabled` viaja
como um *campo* (linha 927), não como um *portão*. Quem nunca ligou PvP aparece assim mesmo
no diretório. A dimensão regulatória disso (LGPD, finalidade, base legal) **não é minha
lane — é do `alpha-compliance`, e eu escalo formalmente ali**. A minha leitura é
comportamental e é mais simples: **o usuário não sabe que esse número é público.** Não há
tela que diga isso. Consentimento obscurecido é item explícito do meu filtro ético, e este
é o caso mais claro do repo.

**Explicação concorrente:** o diretório pode ser lido como *prova social*, e prova social é
um mecanismo legítimo — ver que outras pessoas usam o app de verdade combate a sensação de
estar sozinho num app morto. Nessa leitura, `daysPlaying` e `tasksDone` são sinais de
vitalidade da comunidade, não de julgamento.

**O dado que separa:** a **direção** da comparação, que é observável sem telemetria pesada.
Se os perfis abertos são majoritariamente de gente com `tasksDone` **abaixo** do observador,
é curiosidade/prova social. Se são majoritariamente **acima**, é comparação ascendente e o
mecanismo de dano está ligado. Sinal secundário: correlação entre abrir o `PlayerDetailModal`
de alguém muito acima e a sessão terminar logo depois.

**Intervenção mínima — deletar uma string.** Remover `tasksDone` de
`PlayerDetailModal.tsx:100-101` (PT e EN). Não precisa mexer no servidor, não precisa migrar
save, não quebra PvP, não quebra o diretório, não quebra amigos nem presentes. `daysPlaying`
pode ficar (mede permanência, não desempenho, e não ordena ninguém). Se um dia o número
precisar voltar, ele volta **como faixa**, com a mesma doutrina que `tournamentTiers.ts` já
implementa e testa — o padrão correto já existe no repo, é só reusar.

**Segunda intervenção (menor, mesma família):** condicionar o `pushProfile` inteiro a
`gameState.pvpEnabled` em `GameStateContext.tsx:917`. Uma linha. Isso alinha o
comportamento à expectativa que o próprio campo cria.

---

## C4 🟠 — Um cadastro por dia no demo: a paywall caiu em cima do cuidado

**Onde:** `src/utils/monetization.ts:101` — `export const DEMO_ACTIVITY_DAILY_CAP = 1;`
Aplicação: `monetization.ts:115-117` (`canCreateDemoTaskToday`) ·
`src/components/CreateModal.tsx:470` (`<UnlockNudge reason="task-limit" />`).

**Aplica-se ao: usuário DEMO** (nomeio o perfil, conforme a trava do briefing).

`PLANO-PRODUTO.md` lista três coisas que o Soulmon nunca deve virar, e a primeira é
**"paywall recorrente sobre cuidado"** (`contexto.md §7`). O objeto trancado aqui é o ato de
**escrever o que eu pretendo fazer da minha vida** — que é, literalmente, o cuidado. Não é
um cosmético trancado, não é um andar de masmorra trancado, não é o pet único trancado (esse
é o diferencial e é legítimo trancar). É o **verbo central do produto**, racionado em uma
unidade por dia.

**Mecanismo — e este é o meu ponto mais forte contra C4.** Reatância psicológica (Brehm,
*A Theory of Psychological Reactance*, 1966): remover uma liberdade que a pessoa acabou de
experimentar produz motivação para **restaurá-la**, e a restauração mais barata disponível
para um usuário demo não é pagar R$ 29,90 — é **desinstalar e usar o Notes**. E o segundo
mecanismo: teoria da autodeterminação (Deci & Ryan, 1985; Ryan, Rigby & Przybylski,
*Motivation and Emotion*, 2006, aplicando PENS a videogames) identifica **autonomia** como
uma das três necessidades cuja satisfação prevê engajamento intrínseco. Um teto de 1
cadastro/dia é uma frustração de autonomia aplicada exatamente no momento em que o usuário
demonstrou intenção — o pior instante possível.

**Terceiro mecanismo, e é o mais concreto:** a **lacuna intenção-ação** (Sheeran & Webb,
*Social and Personality Psychology Compass*, 2016) e a **intenção de implementação**
(Gollwitzer, *American Psychologist*, 1999, d ≈ 0,65 em meta-análise com Sheeran 2006 — um
dos efeitos maiores e mais replicados da área). O que fecha a lacuna intenção-ação é a
pessoa **especificar quando e onde** ela vai agir. O app tem a ferramenta que faz isso
(cadastrar hábito com `Schedule`) e a raciona a 1/dia justamente para quem ainda não
formou nenhum hábito com ele. **O demo é impedido de executar a única intervenção com efeito
grande e replicado que o produto oferece.**

**A ironia mecânica, verificável no código:** `dailyGoalFor` é
`min(peso cadastrado no dia, requisito do estágio)` (`CLAUDE.md:76`). Com o teto de 1, a
meta do demo é ≤1. Ele tem um pet que praticamente não perde coração e praticamente nunca
faz um dia perfeito — **o loop inteiro roda em marcha lenta.** Ele não experimenta nem a
tensão nem a recompensa que fazem o produto ser o que é. `[hipótese]` — o que o demo conclui
não é *"quero mais disso"*, é *"isso não faz nada"*. E "não faz nada" não converte por
nenhum mecanismo conhecido.

**Explicação concorrente, e é legítima:** o teto pode ser exatamente o que gera conversão —
bater no limite é o gatilho documentado do `UnlockNudge` (`UnlockAccountModal.tsx:15`), e o
comentário de `monetization.ts:123-124` mostra cuidado real ("a falha AVISA, e o app segue
permitindo, nunca bloqueando"). A leitura otimista: a pessoa que bate no teto é a pessoa
que quer usar, e é a hora certa de convidar.

**O dado que separa — e é a pergunta mais valiosa deste documento inteiro:** dos usuários
demo que **atingiram** `DEMO_ACTIVITY_DAILY_CAP`, quantos converteram e quantos nunca mais
voltaram? As duas hipóteses fazem previsões opostas sobre a mesma população, o que torna o
teste limpo. **Não é observável hoje** — e, com correção de contexto, isso continua
verdadeiro por um segundo motivo: não há hoje população de terceiro para medir. Duas linhas
de instrumentação (`demo_cap_hit` + retorno D1/D7) responderiam definitivamente **assim que
houver usuários de terceiro**.

**Intervenção mínima — e note a ordem do framework, que aqui importa muito.** A ordem
correta é **remover fricção → tornar o certo mais fácil → informar melhor → só então
persuadir**. O teto de 1/dia é a opção *persuadir* aplicada **antes** de todas as anteriores.
A intervenção mínima é subir o teto a um número que **não impeça o loop de rodar** (3 é a
mesma dose de `MAX_DAILY_FOCUS`, `taskModel.ts` — um número que o produto já defende como
"a mecânica") e **mover a trava para o diferencial**, que é onde ela pertence e onde já
existe: o pet único.

**Isto é recomendação de mecanismo, não de preço.** Mudança de preço está fora de escopo
(`contexto.md §10.7`) e eu não a proponho. O `alpha-growth` decide o número; o meu achado é
que **o objeto trancado está errado**, não que o valor esteja.

---

## C5 🟠 — Anúncio → Crédito → resultado aleatório: um loop de razão variável monetizado

**Onde:** `src/utils/monetization.ts:97-98` (`AD_REWARD_CREDITS = 5`, `AD_DAILY_CAP = 3`) ·
`functions/api/_entitlements.js:22-23,97-99` (o servidor é quem vale) ·
`src/components/CreditsModal.tsx:161-177` (a linha "Assistir anúncio") ·
`monetization.ts:77` (`REROLL_COST_CREDITS = 50`) · `CLAUDE.md:93` (Créditos → Bits,
`BITS_EXCHANGE`, 1:10).

**A cadeia completa, montada a partir do código:**
`assistir anúncio → +5 Créditos → 3×/dia → 15/dia → 50 Créditos em ~3,3 dias → 1 reroll →
criatura aleatória`.

E a segunda cadeia, que é a mais problemática: `Créditos → Bits` existe, `Bits → Créditos`
**não** existe (`CLAUDE.md:93`, e a justificativa está escrita: "permitir farmar créditos
anularia a exclusividade do dinheiro real"). A trava é boa. Mas o **anúncio recompensado
fura essa trava por outro lado**: ele não é dinheiro e mesmo assim produz Créditos. A
exclusividade que a barreira Bits→Créditos protege já está furada em `_entitlements.js:99`.

**Mecanismo.** O reroll é um **reforço de razão variável** (Ferster & Skinner, *Schedules of
Reinforcement*, 1957) — pago, com resultado incerto e desejável. É a estrutura formal da
loot box. Zendle & Cairns (*PLOS ONE*, 2018, n = 7.422, e a replicação de 2019) mediram
associação entre gasto em loot box e gravidade de problemas com jogo, e a associação é mais
forte entre os que gastam mais. **Isso é associação, não causalidade — e eu não afirmo
causalidade.**

**Atenuante real, e ele é forte:** `docs/DEPENDE-DE-VOCE.md:132-137` já registra que todo pet
é **mecanicamente equivalente** — o reroll troca identidade, nunca poder. `pipeline.test.ts:52`
trava isso ("reroll troca a criatura, NUNCA a ficha"). Isso **remove a espiral competitiva**,
que é o pior mecanismo da loot box. O que sobra não é "gastei para ficar mais forte", é
"gastei para gostar mais de quem eu sou" — menos grave, mas mais íntimo.

**A minha leitura de vulnerabilidade, que é o que o despacho pediu.** O item comprado é o
**avatar gerado do perfil psicométrico do próprio usuário**. Quem faz reroll está, num sentido
literal, pagando para **rejeitar a representação de si mesmo** que o app devolveu. A pessoa
mais propensa a repetir essa ação é justamente a que menos gostou do resultado — e, num
público 18–35 declarado em faixa de risco (`PLANO-TAREFAS.md:206`), a insatisfação com a
autoimagem não é um estado neutro para se cobrar por iteração. **Isto é raciocínio de
mecanismo, não é dado.** Eu não medi nada e não tenho estudo específico sobre reroll de
avatar psicométrico — não existe essa literatura. Marco como `[hipótese]` e mando para
`alpha-gestor-pesquisa`: **antes de ligar anúncio, é preciso saber se existe cauda de reroll
repetido.** Um usuário com 5+ rerolls não é um cliente satisfeito; é um sinal de que a
leitura do Oráculo errou nele, e vender iterações para essa pessoa é vender uma corrida que
ela não vai ganhar.

**Filtro ético — o que eu recuso e o que eu não recuso.** Não recuso o reroll pago por
Crédito comprado — **e o dono já decidiu manter a mecânica com mitigação de tela** (D-05).
Recuso, e esta é a recomendação: **não ligar o anúncio recompensado como fonte de Crédito.**
O anúncio converte *tempo e atenção* em moeda de resultado aleatório, e é exatamente esse par
(custo baixo por tentativa + resultado incerto + iterável) que produz o padrão compulsivo. O
SDK ainda não existe (`monetization.ts:5-7` — "sem SDK real ainda"), o que significa que
**desligar isso hoje custa zero** e depois custa uma reversão de comportamento já aprendido
pelos usuários.

**Intervenção mínima:** manter `adsEnabled` desligado por padrão (o servidor já responde
`adsEnabled: false` — `entitlements.test.js:47`) e, se um dia ligar, **rotear o Crédito de
anúncio para gastos determinísticos** (cura, Bits) e **nunca para o reroll**. Um flag no
`spendCredits` separando origem de crédito. Isso preserva a monetização e remove a estrutura
de razão variável.

**Fronteira de lane:** a análise regulatória (Lei 15.211/2025, ECA Digital) é do
`alpha-compliance`, conforme o despacho. Escalo formalmente C5 para lá, com esta análise
comportamental anexa. **Eu não concluo nada sobre legalidade** — P7=B, não há assessoria
jurídica no run.

---

## C6 🟡 — "Esta escolha não tem volta": irreversibilidade fabricada, desfeita só com dinheiro

**Onde:** `src/components/SoulmonOnboarding.tsx:201-203` (o comentário: *"É uma decisão SEM
VOLTA, **por escolha de produto**"*) e `816-818` (o texto na tela).
**Aplica-se ao: usuário PAGO** (é o passo 12 do ritual do Oráculo).

O comentário do próprio código é a admissão: **por escolha de produto.** Não há restrição
técnica. O motor psicométrico roda por import dinâmico (`CLAUDE.md:245-247`), o
`SOULMON_PROFILE` fica gravado para o reroll (`oracle.ts:97`), e o caminho `mode='upgrade'`
já reexecuta o ritual inteiro (`CLAUDE.md:270-271`). **A máquina consegue. O produto decidiu
que não.**

**Mecanismo.** Escassez (Cialdini, *Influence*, 1984; base experimental em Worchel, Lee &
Adewole, JPSP, 1975 — biscoitos em pote escasso avaliados como mais valiosos) combinada com
antecipação de arrependimento (Zeelenberg, *Journal of Behavioral Decision Making*, 1999).
O momento é escolhido: **imediatamente antes do reveal**, no pico de antecipação, quando a
capacidade de deliberar está no mínimo. E a saída existe, mas custa **50 Créditos**
(`monetization.ts:77`) — dinheiro real. Ou seja: **uma janela irreversível criada por decisão
de produto, cujo desfazimento é vendido.**

**O que salva parcialmente, e é preciso dar o crédito:** a tela **diz a verdade**
(`SoulmonOnboarding.tsx:817` — *"Esta escolha não tem volta — não dá para responder o teste
depois"*). Isso é honestidade e coloca C6 numa categoria completamente diferente de C3
(consentimento obscurecido). **Divulgar remove o engano; não remove a pressão.** As duas
coisas são distintas e eu não vou fingir que a segunda foi resolvida pela primeira.

**Explicação concorrente, e ela é boa:** irreversibilidade é o que faz **ritual** ser ritual.
Um nascimento que pode ser refeito não é um nascimento. Há sustentação teórica real:
justificação de esforço (Aronson & Mills, *Journal of Abnormal and Social Psychology*, 1959 —
iniciação severa aumenta a valorização do grupo) e o efeito de dotação (Kahneman, Knetsch &
Thaler, *Journal of Political Economy*, 1990). Sob essa leitura, C6 é o que **constrói o
apego** que sustenta a retenção do pago, e removê-lo esvaziaria o produto.

**Eu acho essa leitura provavelmente correta.** É por isso que C6 é 🟡 e não 🔴.

**O dado que separa:** a taxa de escolha da bifurcação. Se a maioria aceita responder os 20
itens, a irreversibilidade está funcionando como compromisso e está tudo bem. Se a maioria
pula e depois faz reroll, ela está funcionando como armadilha e o reroll está capturando o
arrependimento que ela mesma fabricou.

**Intervenção mínima — e é de texto, não de mecânica.** Manter a irreversibilidade (o ritual
precisa dela). Mudar **onde** ela é anunciada: hoje o usuário descobre o "sem volta" **no
instante da escolha**, o que é a definição de pressão. Anunciá-lo **um passo antes** (junto
com as 6 perguntas: *"mais adiante você vai poder afinar a leitura — é uma escolha única, vá
pensando"*) preserva 100% do ritual e devolve a deliberação. Isso é *informar melhor*, o
terceiro degrau do framework, e é o degrau correto aqui — não há fricção a remover, e a
persuasão já está sendo usada.

Handoff: `alpha-redator-ux` (é framing) e `alpha-product-designer` (é um passo de fluxo).

---

## C7 🟡 — A notificação de dreno é urgência com prazo, e ela é filha de C1

**Onde:** `src/App.tsx:1992-2004`.
Texto: *"🚽 Seu Soulmon está na sujeira! / Cocô não limpo tira 1 coração em breve. Dê um
banho!"*, disparado 30 min antes do tick.

**Isto não é urgência falsa** — o app realmente vai cobrar, então o aviso é verdadeiro, e
avisar antes de cobrar é melhor que cobrar em silêncio. Registro isso a favor do desenho.

Mas o filtro ético olha a **estrutura**, não a veracidade: é um push, com contagem regressiva,
sobre uma **perda**, num app que promete não ser cobrador. Compare com o único outro push que
o produto se permite: *"o único push possível é o de DEITAR"* (`CLAUDE.md:116`, Janela de
Descanso) — um convite, sem perda, sem prazo. **O app tem duas doutrinas de notificação e
elas se contradizem.** A do sono foi escrita com a essência na mão; a do cocô veio do gênero.

**Mecanismo:** aversão à perda (Kahneman & Tversky 1979) + prazo, que é o par que produz
*checking behavior* — abrir o app por ansiedade, não por vontade. `PLANO-TAREFAS.md:206`
identifica esse padrão como o dano dos apps de métrica sobre o público 18–35 do Soulmon.

**Intervenção mínima:** **C7 desaparece sozinho se C1 for corrigido**, porque o dreno passa a
ser no máximo 1 coração/dia e deixa de ser uma emergência que justifica um push. Se o push
ficar, inverter o enquadramento para ganho, sem prazo (*"seu Soulmon quer um banho"*) —
`alpha-redator-ux`. **Não corrigir só o texto e deixar a mecânica**: isso seria maquiar o
sintoma e é exatamente o anti-padrão que este documento existe para não cometer.

---

## C8 🟡 — "30 dias perfeitos totais": o único contador de longo prazo sem perdão embutido

**Onde:** `src/utils/missions.ts:87-90` — `id: 'mission-perfect-30'`, `target: 30`,
`progress: s => s.totalPerfectDays`.

**Este é o mais fraco dos oito, e eu o listo por completude, não por convicção.**

Argumento a favor de que está tudo bem, e ele é sólido: `totalPerfectDays` é **lifetime e só
cresce** (`CLAUDE.md:82,95`). Não zera. Não é streak. Não exige consecutividade. É
tecnicamente uma **barra de coleção**, exatamente como `dexProgress` dos Sonhos
(`CLAUDE.md:117` — "só cresce: barra de coleção, não de desempenho"). Pela doutrina do
próprio repo, isso está correto.

O que me incomoda: dia perfeito exige `peso feito ≥ dailyGoalFor && ≥1 cadastrada && energia
≥ dailyGoalFor` (`CLAUDE.md:82`) — três condições simultâneas. Uma barra "3/30" exibida na
loja é um número de desempenho de vida real com um alvo distante, e alvo distante com
progresso lento é onde o **desconto hiperbólico** (Ainslie, *Psychological Bulletin*, 1975;
Laibson, *QJE*, 1997) morde: a recompensa em 30 dias é descontada quase a zero, e o que
sobra na tela é a distância.

**Contra-argumento que eu acho mais provável que o meu:** o *progresso dotado* (Nunes &
Drèze, *Journal of Consumer Research*, 2006 — cartões com 2 selos já dados foram completados
mais rápido e mais vezes) e o efeito de gradiente de meta (Kivetz, Urminsky & Zheng, *JMR*,
2006) dizem que barras que **só sobem** aceleram perto do fim e não desmotivam no começo. O
repo já cita Nunes & Drèze corretamente em `habitRhythm.ts:304`.

**O dado que separa:** distribuição de `totalPerfectDays` na população. Se houver massa
parada em 1–3, é aversão ao progresso lento. Se subir suave, é coleção e está tudo bem.

**Intervenção mínima, se ficar:** mostrar o número **sem** a barra até um piso (a mesma
doutrina de `carePattern.ts`, que "com pouco histórico se declara não-confiável e não
desempata", `CLAUDE.md:90`). Custo baixo, reversível. **Não prioritário — não faça isto antes
de C1–C4.**

---

## Resumo do filtro ético

| # | Achado | `arquivo:linha` | Perfil | Mecanismo de cobrança | Intervenção mínima |
|---|---|---|---|---|---|
| C1 🔴 | Dreno de cocô sem teto, cobra ausência | `App.tsx:2007-2029` | ambos | aversão à perda + contingência de TEMPO | `Math.min(periods, MAX_HEARTS_LOST_PER_DAY)` — 1 linha |
| C2 🔴 | Cura de coração por dinheiro real | `monetization.ts:78` · `CreditsModal.tsx:195-206` | pago | *pay-to-relieve* de dor fabricada por C1 | corrigir C1; mover Crédito para cosmético |
| C3 🔴 | `tasksDone` de outro jogador exibido | `PlayerDetailModal.tsx:100-101` ← `GameStateContext.tsx:929` | ambos | comparação social ascendente (Festinger 1954) | apagar a string; gate de `pvpEnabled` no push |
| C4 🟠 | 1 cadastro/dia no demo | `monetization.ts:101` | **demo** | reatância + frustração de autonomia | subir teto; trancar o diferencial, não o cuidado |
| C5 🟠 | Anúncio → Crédito → reroll aleatório | `monetization.ts:97-98` · `_entitlements.js:99` | pago | reforço de razão variável | manter `adsEnabled` off; crédito de anúncio nunca no reroll |
| C6 🟡 | Bifurcação irreversível pré-reveal | `SoulmonOnboarding.tsx:816-818` | pago | escassez + arrependimento antecipado | anunciar um passo antes (só texto) |
| C7 🟡 | Push de urgência do dreno | `App.tsx:1996-2000` | ambos | aversão à perda + prazo | some com C1; senão, reenquadrar em ganho |
| C8 🟡 | Barra "0/30 dias perfeitos" | `missions.ts:87-90` | ambos | desconto hiperbólico `[fraco]` | esconder barra abaixo de um piso |

**Nada foi aprovado por "o mercado inteiro usa".** C2 e C5 são padrão absoluto da categoria
(Habitica vende poção de cura; metade dos F2P vende reroll) e mesmo assim estão marcados,
porque a essência declarada do Soulmon é mais estrita que a do mercado — e ela é o critério
que o próprio repo escolheu ser julgado por.

**O que eu NÃO encontrei, e registro explicitamente porque a barra de qualidade exige que o
filtro ético seja declarado mesmo quando não acha nada:**

- ❌ Escassez falsa / countdown fabricado na loja — não existe. Nenhum item tem prazo.
- ❌ Streak que zera — **ativamente proibido**, com teste travando (`habitRhythm.ts:33-39`).
- ❌ Score de sono — proibido, com teste (`CLAUDE.md:116`).
- ❌ Punição por sono ruim ou por humor ruim — teste exige resultado idêntico com e sem humor
  ruim (`CLAUDE.md:89`).
- ❌ Traço de nascimento negativo — proibido, com teste (`CLAUDE.md:80`).
- ❌ Dificultar a saída (*roach motel*) — ao contrário: `dropped`, `someday` e `restore`
  existem justamente para dar saída digna (`taskTriage.ts:293-337`).
- ❌ Pagar para ganhar vantagem competitiva — Emblemas são 100% cosméticos, com teste
  (`CLAUDE.md:92`); rerolls são mecanicamente equivalentes, com teste (`pipeline.test.ts:52`).
- ❌ Coletar e não devolver — o check-in de humor devolve resumo, e o comentário nomeia o
  problema: *"coletar e não devolver é extração"* (`CLAUDE.md:89`).

**Isso é uma lista longa de coisas certas.** O produto tem uma doutrina ética real, escrita,
testada e defendida linha a linha. C1–C8 não são a regra — são os **oito lugares onde a
doutrina não foi aplicada**, e todos os oito ficam fora de `src/utils/` (as regras puras). O
conserto não é reescrever a filosofia. É **estender a filosofia que já existe a `App.tsx`,
`monetization.ts` e `community.ts`.**

---

# PARTE A — MECANISMO

## A.0 — A pergunta que precede todas as outras

Um v-pet gerado do perfil psicométrico muda comportamento real **por qual mecanismo,
exatamente?** A resposta honesta tem duas metades, e a segunda quase nunca é dita.

**Metade 1 — o mecanismo é plausível e tem literatura.** Três candidatos, em ordem de força
de evidência:

1. **Auto-congruência da representação.** Przybylski, Weinstein, Murayama, Lynch & Ryan
   (*Psychological Science*, 2012, 5 estudos) mediram que jogadores relatam mais prazer e
   mais motivação quando o avatar se aproxima do **eu ideal** — e o efeito é maior quanto
   maior a discrepância eu-atual/eu-ideal. **Este é o mecanismo mais forte a favor da tese
   central do Soulmon**, e note o que ele implica: o valor não vem de o avatar ser *preciso*
   sobre quem a pessoa é, vem de ele ser *aspiracional*. Isso tem consequência de desenho —
   ver A.4.
2. **Efeito Proteus.** Yee & Bailenson (*Human Communication Research*, 2007): a pessoa passa
   a se comportar de acordo com os atributos do próprio avatar. Replicado, mas em contexto
   imersivo (VR, mundos 3D). **Transferência para um sprite 2D num app de tarefas é
   `[hipótese]`, não resultado.** Eu não vou vender isso como se estivesse estabelecido.
3. **Efeito de dotação e apego** (Kahneman, Knetsch & Thaler, *JPE*, 1990): o que é meu vale
   mais. Um pet gerado de mim, irrepetível, é o caso extremo da dotação. Robusto — **para
   valoração**. Que dotação vire *comportamento de tarefa real* é o salto que ninguém mediu.

**Metade 2 — nada disso é o gargalo do Soulmon hoje.** Este é o meu ponto principal desta
parte, e ele contraria o que a pergunta do despacho implica. A tese "pet único muda
comportamento" só pode ser testada em quem **tem** o pet único. E quem tem o pet único já
pagou. **A conversão acontece ANTES do mecanismo poder agir.** Ou seja: o diferencial do
produto não é o motor de retenção que o repo assume que ele é — ele é a **recompensa** de
uma conversão que precisa acontecer por outro mecanismo qualquer.

🔧 **Reforço pós-correção de contexto:** com zero população paga real hoje (não só "não
medida" — não existe), esta metade 2 deixa de ser só um argumento lógico sobre a ordem dos
eventos e passa a ser, também, uma descrição literal do estado atual: **não há ninguém em
quem o mecanismo do pet único possa estar agindo**, porque não há ninguém do lado de lá da
conversão.

Isso reenquadra o problema inteiro, e o `soulmon-user-researcher.md:68-69` já tinha chegado
perto ao escrever *"o produto tem o diferencial construído e não o entrega"*. Eu levo a
frase um passo adiante: **não é só que o demo não recebe o diferencial. É que o diferencial,
não sendo entregue, não pode ser a razão pela qual alguém compra.** Ver A.1.

---

## A.1 — O usuário DEMO: por que ele converteria (e por que provavelmente não)

**Conduta observada — e aqui eu tenho que ser rigoroso: eu não observei nenhuma.** P4=B, sem
telemetria, sem pesquisa de campo neste run — e, com a correção de contexto, sem população
de terceiro para observar mesmo que houvesse telemetria ligada. O que eu tenho é a
**conduta que o código força**, que é observável, e a partir dela um mecanismo. Tudo o que
segue é `[hipótese]`.

**A conduta que o código força no demo:**

| Passo | Onde | O que o demo recebe |
|---|---|---|
| Onboarding | `PLANO-PRODUTO.md:18`, `INVENTARIO-TELAS.md:276` (`DEMO_PICK`) | 4 telas: intro → objetivo → luta → escolher 1 de 3 |
| O pet | `monetization.ts:28-44` | **Um de 3 pré-prontos.** Não é dele, não é único, não veio dele |
| A evolução | `monetization.ts:63-74` (`getDemoCreatureStages`) | 3 galhos que são **o mesmo sprite e o mesmo nome repetidos** — "não tem escolha de caminho real" (comentário linha 58-61) |
| Cadastro | `monetization.ts:101` | **1 por dia** |
| Teto | `monetization.ts:20` | Capa em Mega, sem Ultra |

**O mecanismo de conversão que o produto tenta usar** é *lacuna de curiosidade* (Loewenstein,
*Psychological Bulletin*, 1994): mostro que existe algo melhor, a lacuna entre o que você
sabe e o que quer saber gera tensão, você paga para fechá-la. O `UnlockNudge` implementa
isso corretamente e com contenção — só dois pontos de aparição, nunca abre sozinho
(`UnlockAccountModal.tsx:15`, `CLAUDE.md:266-268`).

**Por que eu acho que não funciona como está** `[hipótese]`. A lacuna de curiosidade tem uma
pré-condição que Loewenstein é explícito sobre: ela exige **consciência do que se está
perdendo**. Ela é proporcional a *"a sensação de uma lacuna no próprio conhecimento"* — e uma
lacuna que a pessoa não sabe que existe não gera tensão nenhuma. Ela gera indiferença.

O demo escolhe 1 de 3 personagens numa tela. Do ponto de vista dele, isso **é** a mecânica de
personagem do jogo. Ele não tem experiência do que é ver uma criatura nascer de 20 itens
psicométricos + mapa astral + numerologia + a cascata do class-system + a linhagem do
bestiário (`CLAUDE.md:233-263` — um pipeline com cobertura travada por simulação em 17/17
elementos, 65/65 talentos, 32/32 criaturas). **A distância entre "escolher 1 de 3" e "isso"
é a distância entre um produto e outro produto.** O demo não está numa versão reduzida do
Soulmon; ele está num jogo diferente que compartilha o ícone.

E a página de Evolução piora ativamente: `getDemoCreatureStages` (`monetization.ts:63-74`)
monta 3 galhos com **nome e sprite idênticos**. O usuário demo abre a tela que deveria vender
profundidade e vê **a mesma criatura três vezes.** `[hipótese]` — a inferência disponível
para ele não é "a versão paga deve ter mais", é "**a evolução deste jogo é falsa**". Isso não
é uma lacuna de curiosidade não-preenchida; é **evidência ativa contra o produto**, entregue
de graça, na tela cujo trabalho era ser o anúncio.

**Explicação concorrente — e preciso apresentá-la com força honesta.** Talvez o demo não
converta por um motivo muito mais banal e muito mais comum: **ele nunca chega perto do
momento de decidir.** Ele instala, brinca 4 minutos, fecha, esquece. Nesse mundo, o problema
não é o enquadramento do diferencial nem a página de Evolução — é retenção D1, e nenhuma
mudança de mensagem move nada, porque não há ninguém na tela para ler a mensagem.

**O dado que separa as duas, e é uma pergunta só:** dos usuários demo que **abriram a página
de Evolução** (ou seja, chegaram a olhar o que o produto oferece), qual a taxa de retorno D7
comparada com os que nunca abriram?
- Se quem **abriu** volta **menos** → a hipótese A está certa: a tela está fazendo mal, e o
  conserto é de produto (mostrar a promessa, não a versão falsa dela).
- Se abrir a tela **não muda nada** → a hipótese B está certa: é retenção D1, o diferencial
  é irrelevante nessa fase, e o `alpha-growth` deve atacar os primeiros 4 minutos.

Dois eventos (`demo_evolution_page_opened`, `session_start` com dia relativo). **Não é
observável hoje** — nem seria, mesmo com telemetria ligada, sem antes existir população de
terceiro. Encaminhado a `alpha-gestor-pesquisa`, condicionado a isso.

**Intervenção mínima — na ordem do framework, e a ordem é o argumento.**

1. **Remover fricção** (primeiro degrau, e é onde está o maior ganho): C4. O demo não
   consegue rodar o loop com 1 cadastro/dia. Antes de melhorar qualquer mensagem, deixe o
   produto **funcionar** para ele. Um produto que funciona é o argumento de venda; um produto
   que não funciona não é salvo por copy.
2. **Tornar o certo mais fácil:** deixar o demo **percorrer o ritual do Oráculo até a
   véspera do reveal** e ver a leitura de si mesmo (elemento/papel/alinhamento/reino —
   `CLAUDE.md:236`), com a criatura ficando atrás da compra. Isso troca *contar sobre* o
   diferencial por *experimentá-lo*, que é a diferença entre lacuna de curiosidade abstrata
   e concreta. Custo: o pipeline pesado já é import dinâmico e a leitura roda sem gerar
   sprite. **Nomeio o trade-off da trava do briefing: isto ALONGA o funil do demo (hoje 4
   telas), e a trava diz que otimizar para um perfil degrada o outro. Esta proposta paga
   fricção do demo em troca de tornar o diferencial experienciável. É uma aposta, e ela
   precisa ser testada antes de virar decisão cara** — é exatamente o tipo de coisa que
   `alpha-gestor-pesquisa` deve barrar até haver dado.
3. **Informar melhor:** consertar `getDemoCreatureStages`. Enquanto ele mostrar a mesma
   criatura em 3 galhos, ele está informando **pior** que o silêncio.
4. **Persuadir:** o `UnlockNudge` já existe e já é contido. **Não mexer nele.** Ele é o
   último degrau e já está bem feito — mexer nele primeiro seria o anti-padrão exato que
   este documento lista.

**Efeito esperado `[previsão]`:** a tese do produto pede conversão demo→pago ≥ 3%
(`PLANO-PRODUTO.md:227`). Eu **não sei** a taxa atual — ninguém sabe, e hoje o denominador
dela é zero por construção. O que eu posso dizer sobre ordem de grandeza, para quando houver
população: mudanças de enquadramento e de copy em funis de compra movem tipicamente
**frações de ponto percentual a poucos pontos percentuais**; remover uma trava funcional
(C4) pode mover mais, porque não é persuasão, é o produto passar a funcionar. **Nenhum
desses números é medição, e a base contra a qual eles se aplicam é desconhecida.**
DellaVigna & Linos (2022) é a âncora de humildade: 1,4pp sobre base de 26%, ~6× menor que a
literatura publicada. Quem prometer "dobra a conversão" está inventando.

---

## A.2 — O ritual de 8 telas: fricção ou investimento? A resposta é "depende de uma coisa só"

A pergunta do despacho é boa porque é uma falsa dicotomia útil. **É os dois, e a variável que
decide qual dos dois é uma só, é conhecida, e é nomeável.**

**O caso "é investimento" — o Efeito IKEA.** Norton, Mochon & Ariely (*Journal of Consumer
Psychology*, 2012) mediram: quem monta a própria caixa IKEA paga mais por ela do que por uma
idêntica pré-montada, e avalia a própria como comparável à de um especialista. Mas — e o
paper é explícito sobre isso, e essa parte quase sempre é omitida quando alguém cita IKEA
para justificar onboarding longo — **o efeito depende de a montagem ser CONCLUÍDA COM
SUCESSO.** No Estudo 2 deles, participantes que montaram e depois **desmontaram** (ou não
completaram) **não mostraram o efeito**. Trabalho sem conclusão não gera valor; gera
irritação.

O mesmo padrão aparece em justificação de esforço (Aronson & Mills, 1959): a iniciação severa
aumenta a valorização do grupo **para quem passou por ela e entrou**.

**O caso "é fricção" — cada tela é um filtro multiplicativo.** Fogg (*Persuasive Technology*,
2003; modelo B=MAP, 2009): comportamento acontece quando motivação, habilidade e gatilho
coincidem; cada passo adicional reduz habilidade. Em funis, os passos compõem
multiplicativamente — 8 passos com 90% de passagem cada dão 43% de conclusão.

**A variável que decide, e é a resposta à pergunta:**

> **O ritual é investimento se, e somente se, a pessoa acredita que vai terminar E o que vem
> no fim é o que ela veio buscar. Ele vira fricção no instante em que ela deixa de acreditar
> numa das duas coisas.**

E isso não é uma condição vaga — ela é **operacionalizável em três checagens no código**:

| Condição | Estado no Soulmon | Evidência |
|---|---|---|
| **(a) O fim é visível e desejado** | ✅ forte — as 6 perguntas são sobre a própria pessoa, e o reveal é a criatura. É o produto | `CLAUDE.md:238-240` |
| **(b) O progresso é legível** | ⚠️ **não verificado.** Se não há indicador de "passo N de 8", cada tela é potencialmente infinita | `INVENTARIO-TELAS.md:21` admite que **nenhuma afirmação sobre aparência foi medida** — não sei |
| **(c) Não há passo que gere dúvida** | ❌ **existe um, e é C6.** A bifurcação irreversível em `SoulmonOnboarding.tsx:816-818` é, por desenho, um passo que **para a pessoa e a faz reconsiderar** |

**A checagem (c) é o achado.** Fluência de processamento (Alter & Oppenheimer, *Personality
and Social Psychology Review*, 2009): dificuldade percebida transfere para julgamento sobre o
objeto — um passo que "custa" faz o todo parecer mais custoso. O passo 12 injeta,
deliberadamente, uma decisão pesada e irreversível **no meio de um funil de 8 telas**. E o
ramo "sim" adiciona **mais 20 telas** (`SoulmonOnboarding.tsx:842-864`, um item por página).

Ou seja, do ponto de vista de quem responde: o ritual não é de 8 telas. É de 8 **ou 28**, e a
pessoa descobre isso na tela 12. **Isso é a antítese exata da condição (b).**

**Isto é fricção ou investimento?** É investimento **para quem escolhe o ramo longo e
termina** — e para esses o IKEA e a justificação de esforço provavelmente estão trabalhando a
favor, com força. É fricção **para quem abandona no passo 12**, e essa pessoa não só não
converte: ela sai tendo respondido 6 perguntas íntimas e não recebido nada. Isso é pior que
não ter começado, por reciprocidade frustrada.

**O ponto que reconcilia os dois lados:** `[hipótese]` — a bifurcação **não é um passo do
ritual, é um segundo funil escondido dentro dele**, e ninguém mediu qual dos dois ramos as
pessoas pegam nem a taxa de conclusão de cada um.

**O dado que separa, e é uma tabela de 4 células:**

| | Escolheu "responder mais 20" | Escolheu "revelar agora" |
|---|---|---|
| **Terminou** | investimento funcionando (esperado: maior retenção D30) | conversão rápida, apego menor |
| **Abandonou** | ⚠️ **a célula que importa** — fricção pura, e o app extraiu sem devolver | abandono comum de funil |

Se a célula ⚠️ tiver massa, a irreversibilidade está cobrando um preço que ninguém contou.
**Não é observável hoje.** É o evento de funil nº 1 a instrumentar
(`oracle_step_reached` com o índice do passo). Encaminhado a `alpha-gestor-pesquisa`.

**Intervenção mínima, e ela não é encurtar o ritual — é o oposto:**

1. **Nunca encurtar o ritual do pago.** Ele é o motivo de compra e a fonte do apego. A trava
   do briefing é explícita: *"otimizar para o demo esvazia o ritual que é o motivo de
   compra"* (`contexto.md §3`). Não encurte.
2. **Tornar o progresso legível** (condição b) — se ainda não for. É o degrau *informar
   melhor* e é o mais barato do documento. `alpha-product-designer` precisa **olhar a tela de
   verdade** antes de qualquer coisa, porque `INVENTARIO-TELAS.md:21` diz que ninguém olhou.
3. **Anunciar a bifurcação antes** (C6) — que resolve simultaneamente o problema ético e o
   problema de fluência, porque a pessoa deixa de ser surpreendida no meio do funil.

---

## A.3 — O retorno após ausência: o mecanismo suposto está certo, a implementação tem um buraco

**O que o doc supõe.** Três regras (`CLAUDE.md:76`): teto de 1 coração/dia · ausência ≥2 dias
não cobra nada · segunda devolve 0,5.

**O mecanismo suposto está correto, e a literatura é boa:**

- **Contra o *what-the-hell effect*** (Polivy & Herman, 1985; violação de abstinência,
  Marlatt & Gordon, 1985): a pessoa que quebra a sequência não perde um dia — ela abandona.
  O teto de 1 e o perdão de ausência atacam exatamente isso. `habitRhythm.ts:33-39` cita os
  dois autores nominalmente. **Está certo.**
- **Lally, van Jaarsveld, Potts & Wardle** (*European Journal of Social Psychology*, 2010,
  n=96, 84 dias): mediana de 66 dias para automaticidade, e — o achado que quase ninguém
  cita — **pular um único dia não prejudicou mensuravelmente a curva.** A ciência autoriza o
  perdão. `CLAUDE.md:109` cita isso corretamente, inclusive derrubando o mito dos 21 dias de
  Maxwell Maltz. **Está certo.**
- **Fresh start effect** (Dai, Milkman & Riis, *Management Science*, 2014): marcos temporais
  (segunda-feira, dia 1) aumentam buscas por academia e criação de metas, por criarem
  descontinuidade com o "eu velho" que falhou. O alívio de segunda (`dailyReset.ts:616-619`)
  usa isso. **Está certo** — e `applyFreshStart` (`CLAUDE.md:119`) é, na minha leitura, a
  peça mais bem desenhada do produto: *"Recomeço não é amnésia, é perdão"*, limpando só a
  cobrança e nunca o progresso.

**Então: "isso funciona pelo mecanismo que o doc supõe?"**

**A regra, sim. O produto construído, não — por causa de C1.**

O perdão de ausência vive em `computeDailyReset()` (`dailyReset.ts:571,588`), função pura,
testada, com guard. O dreno de cocô vive em `App.tsx:2007-2029`, num `useEffect`, e **não
consulta `forgivesHP` em hipótese nenhuma.** O usuário que some 2 dias com um cocô na tela é
perdoado por um sistema e cobrado pelo outro, **na mesma abertura do app**.

`[hipótese]` sobre o que a pessoa experimenta: ela não vê dois subsistemas. Ela vê o pet com
menos corações depois de voltar. **A promessa "quem volta encontra saudade, não fatura"
(`CLAUDE.md:76`) é entregue pelo `DailyReportModal` em texto e desmentida pela barra de HP na
mesma tela.** Dissonância (Festinger, 1957) resolvida contra o app: *"ele diz que não cobra,
mas cobrou"* — e a mensagem de acolhida passa a ser lida como insincera. **Uma promessa
desmentida é pior que promessa nenhuma**, porque queima também a credibilidade das que são
verdadeiras.

**Explicação concorrente, e ela é bem plausível:** talvez isso quase nunca aconteça. O cocô
tem janelas diurnas, o sono pausa, e quem some 2 dias provavelmente sumiu **antes** de um
cocô aparecer — nesse caso `poopEventsShown` está vazio, o dreno não roda
(`App.tsx:2010,2012-2013`), e o perdão funciona perfeitamente.

**O dado que separa:** entre os retornos com `daysAway ≥ 2`, a fração que teve tick de dreno
na sessão de retorno. Um único evento (`poop_drain_applied` com `periods` e `daysAway`)
responde. **Não observável hoje** — e note que essa é precisamente a métrica-assinatura da
tese anti-cobrança listada em `contexto.md §4`, que também não é medida. **A tese central do
produto e o bug que a ameaça são invisíveis pelo mesmo motivo.**

**Um segundo mecanismo que o doc NÃO supõe, e que eu acho o mais forte dos três:** o alívio
de segunda (`WEEKLY_RELIEF_HEARTS`) é descrito como fresh start, mas ele também é
**recuperação garantida**, e isso é diferente. Ele estabelece um **piso**: o pior estrago
possível é limitado a 7 dias, e a pessoa sabe disso. Piso conhecido é o que separa
"controlável" de "espiral", e a percepção de controlabilidade é o preditor central de
desamparo aprendido (Seligman, 1972; Maier & Seligman, *American Psychologist*, 2016, na
revisão neurocientífica de 50 anos em que os autores **inverteram a interpretação
original**: o default do organismo é a passividade, e o que se aprende é o **controle**).
`[hipótese]` — se essa leitura estiver certa, o valor de `WEEKLY_RELIEF_HEARTS` não está em
0,5 coração; está em **existir e ser previsível**. E C1 destrói exatamente essa propriedade,
porque um dreno sem teto significa que **não há piso**.

O comentário em `useDailyReset.test.ts:585` registra que zerar `WEEKLY_RELIEF_HEARTS` deixava
829 testes verdes — o repo já sabe que essa constante é frágil por não ser testada pelo que
importa. Vale a mesma vigilância aqui.

**Intervenção mínima:** C1. Não há outra. As regras de retorno estão corretas e não devem ser
tocadas.

---

## A.4 — Uma nota sobre a tese central, porque ela tem um risco que ninguém escreveu

`[hipótese]`, e eu a marco com força porque não tenho dado nenhum.

Przybylski et al. (2012) mediram que o avatar motiva mais quando se aproxima do **eu ideal**.
O Oráculo do Soulmon gera a criatura a partir de quem a pessoa **é** — Big Five,
Honestidade-Humildade, eixos junguianos, mapa astral, numerologia (`CLAUDE.md:236-241`).

**Esses dois não são o mesmo alvo.** Um retrato preciso do eu-atual de alguém que está
insatisfeito consigo é, pelo mecanismo de Przybylski, **menos** motivador que um retrato
aspiracional — e o público declarado é 18–35 em faixa de risco para estresse por apps de
métrica (`PLANO-TAREFAS.md:206`), que não é uma população com autoimagem folgada.

Há uma proteção parcial já construída, e ela é boa: os coeficientes de `soulProfile/axes.ts`
foram calibrados por simulação **para que nenhum elemento/papel/reino tenha vantagem
estrutural** (`CLAUDE.md:253-256`). Ninguém recebe um resultado mecanicamente pior. Mas
equivalência **mecânica** não é equivalência **afetiva**: a pessoa pode achar que o seu é
menos legal, e é isso que o reroll cobra 50 Créditos para consertar (C5).

**O que eu recomendaria testar antes de qualquer coisa cara** — e é a pergunta que eu mandaria
para `alpha-gestor-pesquisa` acima de todas as outras desta parte:

> Mostre a 20 pessoas a criatura gerada do perfil delas e pergunte **"isso se parece com
> quem você é?"** e **"isso se parece com quem você quer ser?"** — separadamente, nessa ordem,
> sem sugerir que há resposta certa.

Se a segunda pontuar mais baixo que a primeira, o Oráculo está calibrado para o alvo errado, e
isso é uma decisão de produto que precisa ser tomada com dado — não com a minha teoria. **20
entrevistas resolvem uma pergunta que hoje sustenta o produto inteiro sem nenhuma evidência
por baixo.** É o item de pesquisa com melhor razão valor/custo que eu identifiquei no run.
🔧 **Nota pós-correção:** essas 20 pessoas ainda não existem como usuários do produto — este
item depende de trazer gente de fora antes de ser executável, exatamente como V2–V8 abaixo.

---

# O que precisa ser validado com humanos antes de virar decisão cara

> Percepção prevista **não é** percepção medida. Nada abaixo foi medido. Endereçado a
> `alpha-gestor-pesquisa`. 🔧 **Todas as linhas exceto V1 dependem de existir população de
> terceiro — hoje não existe.** V1 é a única executável imediatamente, porque é teste de
> código, não pesquisa com pessoas.

| # | Pergunta | Método | Custo | Decide o quê |
|---|---|---|---|---|
| V1 | O dreno de cocô cobra retorno-após-ausência? | **Teste automatizado, não pesquisa** — semear `poopPenaltyClockAt` antigo e montar | ~20 min | C1. Não precisa de humano nem de telemetria |
| V2 | A criatura se parece mais com "quem eu sou" ou "quem eu quero ser"? | 20 entrevistas, as duas perguntas separadas | baixo | A tese central (A.4) |
| V3 | Demo que bate o cap de 1/dia: converte ou some? | 2 eventos (`demo_cap_hit`, retorno D1/D7) | baixo | C4 — as hipóteses fazem previsões opostas |
| V4 | Onde o ritual de 8 telas perde gente, e o passo 12 é um cliff? | funil por passo (`oracle_step_reached`) | baixo | A.2 · C6 |
| V5 | Demo que abre a página de Evolução volta mais ou menos? | 2 eventos | baixo | A.1 — separa "produto" de "retenção D1" |
| V6 | O reroll tem cauda de repetição? | contador de rerolls/usuário | trivial | C5 — vulnerabilidade |
| V7 | Curas pagas vêm de perda por dreno ou por virada? | 1 campo (`heartLossSource`) | trivial | C2 — separa conveniência de *pay-to-relieve* |
| V8 | Usuários sabem que `tasksDone` é público? | 5 entrevistas ("quem mais vê isso?") | trivial | C3 — consentimento |

**V1 é a única que não depende de nada nem de ninguém e pode ser feita hoje.**

---

# Handoffs

- **→ `alpha-product-designer`** — o mecanismo que a solução tem que atacar, por ordem:
  **(1)** C1, o dreno é a única perda sem teto e contradiz a promessa escrita; **(2)** C4, o
  demo não consegue rodar o loop — remover fricção vem **antes** de qualquer copy; **(3)** o
  passo 12 como cliff de fluência (A.2); **(4)** `getDemoCreatureStages` mostrando a mesma
  criatura em 3 galhos — a tela que deveria vender profundidade entrega evidência contra.
- **→ `alpha-growth`** — por que a ativação não acontece: **o diferencial não pode ser a
  razão da compra porque só é entregue depois dela** (A.0/A.1). A alavanca de conversão não
  é mensagem, é deixar o demo **experimentar a leitura de si** antes do paywall. **Com a
  ressalva registrada:** isso alonga o funil do demo e a trava do briefing diz que otimizar
  para um perfil degrada o outro — precisa de V4/V5 antes de virar decisão cara, **e ambos
  dependem de trazer usuário de terceiro primeiro.**
- **→ `alpha-redator-ux`** — framing: C7 (push de perda com prazo → convite sem prazo) e
  C6 (anunciar a irreversibilidade um passo antes). **Nenhum dos dois conserta mecânica —
  não deixe que sejam usados como substituto de C1.**
- **→ `alpha-gestor-pesquisa`** — V1–V8. V1 é teste, não pesquisa, e sai hoje. V2–V8
  dependem de população de terceiro.
- **→ `alpha-compliance`** 🔴 — três escalações formais, todas fora da minha lane:
  **(a) C5**, reroll aleatório pago com dinheiro real + anúncio recompensado como fonte de
  Crédito (Lei 15.211/2025, ECA Digital; `DEPENDE-DE-VOCE.md:132-137`, `STATUS.md:698` —
  **já resolvido pelo dono, D-05: mitigar com tela e seguir**);
  **(b) C3**, `pushProfile` (`GameStateContext.tsx:917-930`) publica nome, pet, estágio,
  atributos e `tasksDone` **sem gate de `pvpEnabled` e sem tela que informe** — a minha
  leitura é de consentimento obscurecido, a leitura de base legal é sua;
  **(c) C2**, cura de HP por dinheiro real combinada com C1 (perda sem teto).
  **Eu não concluo nada sobre legalidade** — P7=B, não há assessoria jurídica no run.
- **→ o dono** (§9, dono único; formato `docs/DEPENDE-DE-VOCE.md`) — **uma decisão que só ele
  toma:** ligar ou não o anúncio recompensado (C5). O SDK ainda não existe
  (`monetization.ts:5-7`), então **desligar hoje custa zero** e depois custa reverter
  comportamento já aprendido. É a janela mais barata que este run encontrou.

---

## Declaração final de método

- Nenhuma afirmação quantitativa sobre funil, retenção, conversão ou custo foi produzida.
  Toda previsão está rotulada `[previsão]` com ordem de grandeza e âncora de humildade
  (DellaVigna & Linos 2022: efeito de campo ~6× menor que o de laboratório).
- Todo achado de ética tem `arquivo:linha`. Todo mecanismo tem princípio **e** fonte
  nomeada. Onde a fonte não existe (reroll de avatar psicométrico), está dito que não existe.
- Toda seção oferece a explicação concorrente **e** o dado que a separaria. Onde o dado não
  é observável hoje, está dito, e virou item em V1–V8.
- A ordem *remover fricção → tornar o certo mais fácil → informar → persuadir* foi aplicada
  em todas as recomendações. Onde o produto inverteu a ordem (C4: persuasão por trava antes
  de o produto funcionar), o achado é exatamente essa inversão.
- O filtro ético foi aplicado explicitamente, inclusive na lista do que **não** foi
  encontrado — que é longa, e é justo que conste.
- 🔧 **Nota final pós-gate:** este documento nunca precisou da premissa "jogadores reais" para
  nenhuma de suas conclusões — todo achado de mecanismo é uma propriedade do código, e toda
  validação com humanos já estava corretamente marcada como pendente. A correção de contexto
  torna essa pendência mais explícita (não há hoje quem responder V2–V8), não diferente.
