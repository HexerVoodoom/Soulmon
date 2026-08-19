# Plano — o motor de tarefas do Soulmon

> Revisão 2 (2026-08-19), com benchmarking de 25+ produtos e literatura comportamental. Esta é a feature central: tudo mais no jogo (pet, evolução, loja, torneio) é consequência dela.

---

## Parte 0 — O diagnóstico

### O que o Soulmon já tem de raro (não jogar fora)

1. **Evolução ramificada por tipo de esforço.** A árvore de 11 formas decidida pelas categorias das tarefas é a mecânica mais valiosa do produto e quase ninguém tem. É exatamente o que o Digimon Vital Bracelet faz com cardio vs força, e é a materialização perfeita do conceito de *identity-based habits* do Atomic Habits: cada tarefa é um voto no tipo de pessoa que você é, e o pet é a prova visível desse voto. Nenhum task manager consegue isso; nenhum habit tracker consegue isso com essa fidelidade.
2. **Falha já é perdoada.** HP perde no máximo 1/dia, ausência ≥2 dias não cobra, segunda-feira devolve 0,5. Isso já está do lado certo da linha que separa Finch de Habitica.
3. **"Dia perfeito" que só acumula e nunca zera.** Já é a alternativa correta ao streak binário — o resto do plano é generalizar esse princípio.
4. **Loop de duas visitas embrionário** (relatório diário + cuidado do pet), que é o modelo do Finch.

### O que está faltando (e por que dói)

| Buraco | Consequência |
|---|---|
| Recorrência só por dia da semana | Não existe "3x por semana", nem "a cada 3 dias a partir da conclusão" — os dois modelos que o mercado inteiro tem |
| Recompensa idêntica para tarefa trivial e projeto | Premia criar micro-tarefas. É o defeito exato do Karma do Todoist, a crítica nº1 àquele sistema |
| Meta diária conta itens homogêneos | O usuário aprende que 5 tarefas fáceis > 1 tarefa difícil |
| Sem estimativa de esforço, sem noção de carga | Nada combate o *planning fallacy*, que é a causa mecânica do backlog |
| Sem streak nem marco por hábito individual | O hábito não tem história própria; nada distingue "medito há 60 dias" de "meditei ontem" |
| Sem triagem do backlog | A pilha de atrasadas é a **causa nº1 documentada de abandono** de app de tarefas — o padrão dominante do mercado não é uso estável, é *falência periódica* (apagar tudo e recomeçar) |
| Sem saída digna para tarefa que não vai acontecer | Só resta deletar (perde contexto) ou mentir que fez |
| Sem ritual de planejamento | E é justamente o ritual, não a lista, que muda vida real |

### O achado que reorganiza tudo

Masicampo & Baumeister, sobre o efeito Zeigarnik: **a tensão de uma tarefa inacabada não é aliviada por concluí-la — é aliviada por fazer um plano concreto para ela.** E Gollwitzer (implementation intentions) mostra que uma tarefa com *quando e onde* tem taxa de execução categoricamente maior que uma tarefa com só prazo.

Tradução para o produto: **o app não deve otimizar o ato de marcar o check. Deve otimizar o ato de planejar.** Todo task manager que realmente muda comportamento (Sunsama, Things, Atoms) cobra 5 minutos de planejamento e entrega tranquilidade em troca. Os que otimizam o check (Todoist Karma, Duolingo) produzem gaming: tarefa trivial criada só para pontuar, lição mínima só para manter streak.

---

## Parte 1 — Benchmarking: as mecânicas que valem roubar

### Task managers

| Produto | Mecânica-assinatura | Por que funciona |
|---|---|---|
| **Todoist** | `every! 3 days` — recorrência **contada da conclusão**, não da data prevista | Estruturalmente impede acúmulo de instâncias atrasadas |
| **Todoist** | Smart Schedule: reagendar **todas** as atrasadas de uma vez, com sugestão | Transforma 200 itens vermelhos em uma decisão de um clique — quebra o ciclo de falência |
| **Todoist** | Vacation Mode congela Karma e preserva streak | A existência dele é a confissão de que streak punia descanso |
| **Things 3** | Separa **"When" (quando começo)** de **"Deadline" (quando vence)**; item com deadline *não* pula pro Today | Prazo não é plano. Obrigar a escolher quando começar é implementation intention embutida |
| **Things 3** | Lista **Someday** deliberadamente inerte | Permissão formal para não fazer nada impede o backlog de virar depósito de culpa |
| **Things 3** | Repetidor é **template**, não tarefa; impossível ter duas cópias pendentes | Acúmulo é impossível por construção |
| **TickTick** | Estado terminal **"Won't Do"**, com lista própria e Restart | Saída digna: drena o backlog sem a culpa de deletar nem a mentira de concluir |
| **TickTick** | Repeat Type explícito: By Due Date / By Completion Date / By Specific Dates | O modelo de recorrência mais legível do mercado |
| **Sunsama** | **Contador de adiamentos visível** ("movida 7 vezes") | Torna evitação crônica um dado, não um sentimento |
| **Sunsama** | **Shutdown ritual** que bloqueia o dia seguinte: não fechou ontem → hoje começa pelas pendências | A dívida nunca fica invisível |
| **Sunsama** | Medidor de carga que escala por cor até "you've overcommitted"; default de ~5,5h úteis num dia 9–5 | Único antídoto de UI contra o planning fallacy — o app assume que sua estimativa está errada pra baixo |
| **Motion** | Estado **"Can't Fit"** fixado no topo em vez de agendar e falhar | Dizer a verdade sobre capacidade cedo vale mais que qualquer reagendamento automático |
| **Structured** | Timeline vertical com blocos **proporcionais à duração** | Você *vê* que não cabe, sem somar nada |
| **Reclaim** | Rotinas flexíveis + adaptativas + **defendidas** | Hábito que se move sozinho mas continua ocupando espaço real é o único que sobrevive a agenda cheia |
| **Akiflow / Todoist** | Quick Add numa linha: `Ligar pro João amanhã 15h por 1h #Trabalho !p1` | Fricção de captura determina se o sistema sobrevive à segunda semana |

### Apps gamificados e de hábitos

| Produto | Mecânica | Leitura |
|---|---|---|
| **Finch** | Pet **nunca morre, nunca adoece, nunca cobra**. Falhou? "Que tal uma meta menor?" | ~$30M ARR sem VC. Carinho monetiza melhor que competição |
| **Finch** | Loop de duas visitas: manhã define intenção, o pássaro sai numa aventura de ~6h, à noite você lê **o que ele descobriu** | A recompensa é narrativa, não numérica — narrativa não satura |
| **Duolingo** | **Streak Freeze equipado por padrão** (não exige lembrar de ativar) | Churn caiu de ~47% para ~28%. Proteção tem que existir *antes* da falha |
| **Duolingo** | Crítica: "gamificação vazia" — gente faz a lição mínima só pelo streak | Aviso direto: recompensa desacoplada do esforço real produz teatro |
| **Habitica** | Dailies não feitas dão **dano de HP**, morte custa nível e equipamento, party sofre junto | O contra-exemplo canônico: complexidade + culpa. Usuários relatam gastar mais tempo administrando o Habitica que os hábitos |
| **Pokémon Sleep** | Sono vira **gacha de coleta**: você não "faz" nada, dorme, e acorda com um pull. Sleep Style Dex com 200+ entradas | Converte comportamento passivo e invisível em colecionável. Dormir mal **não pune — só rende menos** |
| **Rise Science** | **"Sleep debt"** — dívida acumulável e *pagável*, em vez de streak quebrada | Modelo mental diretamente roubável: dívida é reversível, streak não |
| **Forest** | Árvore murcha (punição simbólica leve) e a floresta morta continua no histórico | Punição sem cascata |
| **Zombies, Run!** | Áudio-drama que só avança correndo | *Temptation bundling* canônico (Milkman: +51% de idas à academia — mas **decaiu com o tempo**: exige conteúdo novo) |
| **Atoms** | Formulário do hábito É uma implementation intention: "depois de X, faço Y em Z". "Never miss twice" | A intervenção de custo zero com maior efeito medido na literatura |
| **Pokémon GO** | Retenção do mês 6 vem de **eventos sazonais**, não do loop diário | Calendário dá motivo novo pra voltar antes que o loop canse |
| **Vital Bracelet** | Rota de evolução ramifica por **tipo** de esforço; cardio vira um Digimon, força vira outro | Já é o Soulmon. Confirma que a aposta central está certa |

### A ciência (só o que muda decisão)

- **O mito dos 21 dias é falso.** Vem de Maxwell Maltz (1960), sobre pacientes de cirurgia plástica. **Lally et al. (2010, n=96): mediana de 66 dias, faixa de 18 a 254**, conforme complexidade.
- **O achado mais subestimado de Lally: pular um único dia não prejudicou mensuravelmente a automaticidade.** A ciência autoriza o perdão. Streak binário é invenção de produto, não de psicologia.
- ***What-the-hell effect*** (Polivy & Herman) e violação de abstinência (Marlatt): quebrar o streak dispara abandono total, não um dia perdido.
- **Aversão à perda** motiva forte no curto prazo e destrói no longo. Regra: use perda sobre **itens recuperáveis** (moedas, escudos), nunca sobre **identidade ou progresso acumulado**.
- ***Fresh start effect*** (Dai, Milkman & Riis): segunda-feira, dia 1 e aniversários aumentam adesão porque "relegam as imperfeições ao período anterior". É o antídoto nativo à quebra de streak — e o Soulmon já usa segunda-feira para devolver 0,5 HP.
- **Progresso dotado** (Nunes & Drèze): barra já iniciada é muito mais concluída. Nunca começar o usuário em 0%.
- **Recompensa de razão variável**: mantenha o *ato* previsível e o *resultado* surpreendente.

---

## Parte 2 — O desenho proposto

### Princípio geral

> **Duas mecânicas, dois contratos.** Hábito é um contrato de *constância* — o valor está em repetir. Tarefa é um contrato de *execução* — o valor está em terminar e sair da cabeça. Hoje as duas rendem a mesma coisa, e é por isso que nenhuma das duas rende muito.

---

### 2.1 Hábitos — o contrato de constância

**Modelo de recorrência novo** (substitui `weekDays[]`, mantendo-o como um dos casos):

```ts
type Schedule =
  | { kind: 'weekdays'; days: number[] }          // hoje
  | { kind: 'timesPerWeek'; target: number }       // "3x por semana" — perdão embutido
  | { kind: 'everyNDays'; n: number; from: 'schedule' | 'completion' }  // o `every!` do Todoist
```

O `from: 'completion'` é o item mais importante desta seção: é o que impede acúmulo de instâncias atrasadas — a causa nº1 de abandono. Na UI, texto direto em vez de jargão: *"a cada 3 dias, contando de quando eu fizer"*.

**Âncora, não só alarme.** Campo `anchor: { after: string; where?: string }` — "depois do café da manhã", "na mesa da cozinha". É literalmente o formulário do Atoms, e é a intervenção mais barata com maior efeito na literatura. O texto vira parte do card do hábito e do nudge do pet.

**Constância, não streak.**
- Métrica exibida: **"5 das últimas 7"** (média móvel), não um número que zera. Uma falha custa ~14%, não 100%.
- **Escudos de descanso**: 1 ganho por semana de boa constância, máximo 3 acumulados, **consumidos automaticamente** — o usuário nunca precisa lembrar de ativar (é isso que faz o Streak Freeze do Duolingo funcionar).
- **"Never miss twice"**: a primeira falha não gera nada visível. Na segunda seguida, o pet aparece oferecendo uma **versão reduzida** do hábito ("hoje, só 5 minutos?"). Aceitar conta como feito. Isso é o Finch, e é o oposto exato do dano de HP do Habitica.

**Marcos de maturidade** (substituem o "21 dias" popular, usando os números reais de Lally): **7 / 21 / 66 dias efetivos**, com nomes de estágio (semente → broto → árvore). Cada marco:
- dá uma recompensa única (decoração/comida rara),
- o ícone do hábito na lista **evolui visualmente** — mesmo idioma do pet que evolui,
- o hábito passa a render +10% de atributo (o esforço antigo vale mais, não menos).

**O hábito maduro vira identidade.** Ao atingir 66 dias, o hábito entra no perfil do Soulmon como traço: *"criado por alguém que medita há 66 dias"*. Custo de implementação quase zero, e é o mecanismo de retenção de longo prazo mais forte que existe — porque o usuário não abandona um app que guarda quem ele se tornou.

**Visibilidade do galho.** Na criação e na lista, mostrar qual atributo o hábito fortalece ("este hábito alimenta Harmonia") e o que isso faz com a árvore de evolução. Hoje a conexão existe no código mas é invisível — e ela é o melhor argumento do produto.

---

### 2.2 Tarefas — o contrato de execução

**Esforço obrigatório na criação**: `effort: 1 | 2 | 3` (rápida / média / projeto, com duração sugerida). Recompensa escala com esforço, **nunca com contagem** — é a correção direta do defeito do Karma do Todoist.

**"Quando" separado de "Prazo"** (Things 3): `startDate` = quando pretendo fazer; `deadline` = quando vence. Tarefa com prazo distante **não** polui o Hoje. Só o "quando" traz a tarefa para a tela principal.

**Contador de adiamentos visível** (Sunsama): a tarefa exibe *"adiada 4 vezes"*. Ao chegar em 3, o pet intervém com três botões: **decompor** (chama a IA de `suggest-tasks` que já existe), **encolher** (rebaixa o effort e reescreve pra algo menor) ou **deixar pra lá**.

**"Deixar pra lá" é um estado terminal de verdade** (o *Won't Do* do TickTick), com lista própria e botão Restart. Não é deletar, não é concluir. É a saída digna — e é ela que impede o ciclo de falência (apagar tudo e recomeçar) que o mercado inteiro sofre.

**Aging temático**: tarefa vencida ou parada há mais de 7 dias fica **"assombrada"** (esmaecida, com uma partícula escura; o pet olha para ela de vez em quando). Concluir uma assombrada dá **bônus de alívio** — o pet comemora mais alto, com animação própria. Isso converte a pilha de culpa, que é a causa nº1 de abandono, num loop de jogo com recompensa. Nenhum concorrente faz isso, e é a peça mais "Soulmon" do plano.

**Foco do dia (3 tarefas)**: escolhidas no check-in matinal. Completar as 3 = selo do dia, e conta para "dia perfeito" ao lado da meta. É o ritual de planejamento em versão de 20 segundos — o formato Sunsama sem o custo de 20 minutos.

**Medidor de carga** (Sunsama, versão leve): ao marcar mais que ~6 pontos de esforço como foco/meta do dia, o pet avisa em tom gentil: *"isso é bastante pra um dia só — quer deixar uma pra amanhã?"*. Aviso, nunca bloqueio.

**Triagem em massa**: um botão único **"Arrumar a pilha"** na lista, que pega tudo que está atrasado e apresenta em fila de cartas — cada carta com quatro ações grandes: hoje / esta semana / algum dia / deixar pra lá. É o Smart Schedule do Todoist com a ergonomia de um jogo. Terminar a fila dá recompensa (é trabalho real de planejamento, o que mais alivia a mente segundo Masicampo & Baumeister).

**"Algum dia"**: lista inerte, fora do backlog ativo, que não gera culpa nem aging (o Someday do Things).

---

### 2.3 Meta diária ponderada

`dailyGoalFor` passa a somar **pontos de esforço** (hábito = 1, tarefa = seu effort) em vez de contar itens. Sem isso, todo o resto do desenho é contornável fazendo cinco coisas triviais. Mexe em `dailyReset.ts` (função pura) e nos testes.

---

### 2.4 Os dois rituais

**Manhã — Check-in (≤20s):** hábitos do dia + escolher até 3 focos + humor (já existe em `mood.ts`). Se houver pendência de ontem não resolvida, ela aparece **primeiro** — o Shutdown do Sunsama, invertido para caber num app mobile.

**Noite — Relatório (já existe, expandir):** o `DailyReportModal` ganha a narrativa do pet. Aqui entra a **aventura**: durante o dia o pet saiu, e à noite ele volta com um achado **variável e narrado** (item, cena, memória, fragmento de lore). O que ele traz depende do que você fez, mas *qual* ele traz é imprevisível. Razão variável + recompensa narrativa é a combinação que sustenta o Finch, e é a única que não satura.

**Domingo — Semana:** constância por hábito, melhor sequência, categoria dominante, e **uma sugestão gerada pela IA de chat que já existe** — no formato "você nunca falha em Estudo às terças; que tal ancorar Exercício logo depois?". Isso é habit stacking assistido, e é a coisa mais próxima de "o app melhorou minha vida" que dá pra entregar.

**Estações (fresh start):** todo dia 1 e toda segunda, o pet propõe um recomeço explícito — zera dívidas, mantém 100% da evolução. Usa o *fresh start effect* como mecanismo programado de retorno do usuário lapsado, que é o público que todo tracker perde em silêncio.

---

### 2.5 Captura sem fricção

Quick Add de uma linha com parsing PT-BR/EN: `pagar boleto amanhã 14h !2 #trabalho`. Regras: `!1..!3` esforço, `#categoria`, data/hora em linguagem natural, `*3x semana` cria hábito. Se a captura custa três telas, o sistema não sobrevive à segunda semana — é a queixa mais consistente do mercado inteiro.

---

## Parte 3 — Saúde e sono

### O princípio, revisado

O `PLANO-EVOLUCAO.md` diz *"o sinal do Soulmon é declarado, não inferido"*, justificado pela falha do sensor óptico do Vital Bracelet em pele mais escura. **A justificativa está certa e o princípio deve continuar de pé — com uma qualificação:**

> **Declarado pontua. Inferido confirma e enriquece. Nunca o inverso.**

O usuário sempre marca. O sensor, quando existe, dá um selo de "verificado" e um bônus pequeno, ou preenche automaticamente o que ele declararia. Quem não tem wearable não fica em desvantagem estrutural, e nenhum sinal fisiológico decide nada sozinho.

### Realidade técnica (importante, muda o roadmap)

- **Google Fit está morrendo em 2026.** Cadastros novos fechados desde 01/05/2024; APIs suportadas só até o fim de 2026. **Não escrever uma linha contra Google Fit.**
- O sucessor é **Health Connect**, e ele custa caro em compliance: declaração de health app no Play Console, política de privacidade dedicada, **conta de organização verificada** (enforcement de jan/2026 — se o publisher for conta pessoal, isso é bloqueador), permissões separadas para leitura em background e para histórico além de 30 dias.
- **Janela de 30 dias**: por padrão só lê os 30 dias anteriores à concessão. Reinstalou o app? A janela recomeça. Isso empurra a espelhar dado sensível no backend — e sono/passos são **dado sensível sob LGPD art. 11**, exigindo consentimento específico e destacado por finalidade (checkbox dentro dos Termos é juridicamente inválido).
- **Decisão de arquitetura barata**: guardar **agregados diários** ("regularidade da semana = 0,82"), nunca séries brutas. Sai quase inteiro do escopo de dado sensível.
- **Plugin**: `@capgo/capacitor-health` é o único vivo e mantido em 2026 que expõe `SleepSessionRecord` (o `capacitor-health` original do mley não expõe sono). O app **já é Capacitor** — isso é adicionar plugin + permissões ao build Android existente, não fazer app novo.
- **Na PWA pura: nada.** Não existe ponte web para Health Connect ou HealthKit. Web Bluetooth não existe no iOS e é inviável comercialmente. Sensores web morrem com a tela apagada. **A mecânica precisa funcionar sem sensor, ou não funciona para a maior parte da base.**

### O sono: "Janela de Descanso"

A pesquisa entregou o achado que resolve o desenho inteiro:

> **Regularidade do sono prevê mortalidade melhor que duração.** Sleep Regularity Index sobre 60.977 participantes do UK Biobank: os quatro quintis superiores tiveram **20–48% menos mortalidade por todas as causas** que o quintil mais irregular — e o efeito sobrevive ao controle por duração.

Ou seja: **a métrica cientificamente mais forte é também a única que dá para medir sem sensor nenhum, e a que menos gera ansiedade** — porque é um comportamento sob controle do usuário, não um resultado fisiológico que ele não pode comandar às 3h da manhã.

O desenho:

1. **O usuário escolhe a própria janela-alvo** (ex.: 23h30–07h00). Nenhuma recomendação de "8 horas".
2. **A recompensa é por *entrar na janela*, não por dormir bem.** Colocar o pet pra dormir dentro da janela fecha o ciclo. Isso já existe no app — é só dar significado a ele.
3. **Sem streak que quebra.** Média móvel: "5 das últimas 7 noites". Uma noite ruim custa ~14%.
4. **Noite sem registro é neutra, nunca perdida.** Isso elimina o incentivo que produz o exploit famoso do Pokémon Sleep (gente forjando semanas de sono) e a ansiedade de dormir com o celular na cama.
5. **Nada de score de qualidade de sono na home.** Oura/Whoop produzem exatamente o número que gera ortossonia: **3–14% da população geral apresenta sinais**, com escores de insônia mais altos, e o gradiente etário é brutal — **~23% dos usuários de 18–35 anos** dizem que apps de sono os estressam, contra 2,4% acima dos 66. O público do Soulmon está inteiro na faixa de risco.
6. **Feedback só de manhã.** Nunca notificação noturna sobre desempenho — a ortossonia é ansiedade *antes* de dormir.
7. **Switch "não quero ver métricas"** que preserva as recompensas e esconde os números. Boa prática já reconhecida na literatura.
8. **A recompensa é criatura, não veredito.** É aqui que entra a mecânica principal:

**Sonhos — o Sleep Style Dex do Soulmon.** Cada noite dentro da janela, o Soulmon **sonha**, e o sonho é uma ilustração colecionável do próprio pet numa cena (dormindo numa lua, correndo num campo, na chuva). Raridade ligada à **regularidade**, não à duração. O Dex de sonhos é uma barra de completude infinita, e o pipeline de sprites (`imagePrompt` do oráculo + CLI Higgsfield) já produz exatamente esse tipo de asset — é conteúdo barato e infinitamente extensível, com a vantagem de ser único por jogador, já que o pet é único.

Regra final, que resume a seção: **premie o comportamento (deitar no horário), nunca o resultado (dormir bem).** Comportamento é controlável; resultado não. Premiar resultado é a definição operacional de como se fabrica ortossonia.

### Passos e exercício

- Hábitos de Fitness/Health podem ser marcados como **verificáveis**: ao completar, se houver sessão de exercício ou passos no dia, ganha selo "verificado" + bônus pequeno. Sem sensor, completa normal, sem selo.
- **Missões corporais opcionais** em `missions.ts`: "7.000 passos hoje" → Bits, com teto diário para não virar farm.
- O **como** disso mudou e virou seção própria: ver **Parte 3b — Passos**. Em resumo: nem Health Connect, nem Google Fit — o sensor de passos do próprio aparelho, que é permissão de runtime simples.

---

## Parte 3a — Pesadelos: o sono deixa de ser passivo

Dono da regra: `src/utils/nightmares.ts`. Camada de cima da Janela de Descanso, irmã dos Sonhos.

### O buraco que ela fecha

A Parte 3 entregou um sono que **rende** — o Dex de Sonhos — mas que o jogador não *joga*. Coleta passiva é exatamente o modelo do Pokémon Sleep, e é também de onde vem a crítica de que ele é "um app de sono com uma tela de gacha", não um jogo. O Soulmon já tem um motor de combate pago e testado (a Masmorra). Não usá-lo para a mecânica de sono era desperdício de conteúdo.

O desenho: **sonho é a coleta, pesadelo é o combate — as duas faces da mesma noite.** Uma noite dentro da janela rende as duas coisas: a cena colecionável e uma luta curta de manhã, em que o Soulmon conta que enfrentou algo enquanto o dono dormia.

O enquadramento é regra, não enfeite: o pesadelo **não é uma ameaça ao jogador**, é o Soulmon *defendendo o descanso do dono*. Nomes e descrições são fofos de propósito (Nuvenzinha Rabugenta, Bicho-Cobertor Embolado). Um app que assusta perto da hora de dormir é o oposto exato do que a Janela de Descanso existe para ser.

### A regra que precisa estar em destaque

> **A quantidade de pesadelos NUNCA escala com a DURAÇÃO do sono. Só com a REGULARIDADE.**

Por quê, e o argumento tem duas pernas:

1. **Duração é resultado fisiológico, não comportamento.** Ninguém comanda o próprio sono às 3h da manhã. Premiar o resultado é a definição operacional de como se fabrica **ortossonia** — a busca ansiosa pelo sono perfeito alimentada por métrica (3–14% da população geral; **~23% dos usuários de 18–35 anos** relatam estresse com apps de sono, contra 2,4% acima dos 66 — o público deste app está *inteiro* na faixa de risco). É a mesma razão pela qual não há score de sono na home.
2. **Duração é farmável, e o precedente é famoso.** O exploit do Pokémon Sleep — gente forjando semanas de sono para farmar recompensa — nasce de recompensa por duração. Se dormir 11h rendesse mais inimigos que dormir 6h, a jogada ótima passaria a ser mentir para o app, ou pior: ficar deitado sem dormir.

Quem escala é a **regularidade** (o `ratio` de `restConstancy`), e ela ganha nos três eixos que importam:

- é **comportamento controlável** — deitar no horário que a própria pessoa escolheu;
- tem **teto natural**: não dá para farmar regularidade dormindo 14h, porque o máximo é uma noite por noite (`NIGHTMARES_PER_NIGHT = 1`);
- é a **métrica mais forte cientificamente**: no UK Biobank (n=60.977) o Sleep Regularity Index previu mortalidade por todas as causas *melhor* que a duração (20–48% menos mortalidade nos quintis mais regulares), e o efeito **sobrevive ao controle por duração**.

Consequência de arquitetura, e ela é verificável: `nightmares.ts` **não lê `sleptAt`/`wokeAt` para calcular nada**. As únicas entradas de regra são o bit `onTime` da noite e a razão de regularidade. Há teste travando — mesma regularidade com noites de 3h e de 11h devolve resultado idêntico.

### O resto do desenho

- **1 pesadelo por noite dentro da janela** (`NIGHTMARES_PER_NIGHT = 1`). A única forma de ver mais pesadelos é ter mais *noites* — ou seja, viver mais dias, a única "moeda" que ninguém acelera.
- **Luta curta**: `NIGHTMARE_WAVE_SIZE = 2` inimigos, contra os 6 de um andar de masmorra. Isto acontece **de manhã**; uma mecânica de sono que exige dez minutos de combate antes do café vira obrigação.
- **Vencer restaura energia e até meio coração** (`NIGHTMARE_MAX_HEART_CURE = 0.5`). E este é o ponto: **o sono contribui para a saúde do pet ATRAVÉS do combate, nunca por bônus passivo.** A diferença não é cosmética — um bônus passivo por "ter dormido bem" é um score de sono disfarçado, e vira métrica na cabeça do jogador. Passando pelo jogo, o que se ganha é uma partida. O teto de meio coração também protege a economia: o carinho continua sendo a cura principal (até 1 coração/dia); se o sono curasse mais, ele viraria a rota ótima de HP e o app estaria de novo premiando resultado fisiológico.
- **Perder não custa nada. Não combater não custa nada.** Pesadelo não combatido simplesmente **expira** — sem dano, sem multa, sem fila que acumula, sem contador que zera. Cobrar por não combater transformaria uma recompensa em dívida, que é exatamente como um bônus vira imposto na cabeça do usuário. Perder a luta segue a mesma regra da Masmorra: o jogo nunca cobra da barra que representa o cuidado que o usuário teve consigo mesmo.
- **Noite sem registro, ou fora da janela = 0 pesadelos e nenhuma perda.** Noite sem registro é NEUTRA (regra de `restConstancy`): o app não sabe se a pessoa dormiu mal ou só não abriu o app, e chutar "falhou" seria inventar um dado ruim sobre a vida de alguém.
- **O combate é delegado.** `buildNightmareWave` chama `buildDungeonWave` em vez de reimplementar inimigo/stat/escala — regra copiada é regra que diverge em silêncio (footgun 9). O módulo só decide *quantos* e *até que tier*; o tier alvo vem da raridade (`baby-ii`/`rookie`/`champion`) e é limitado pelo estágio do pet, para um rookie nunca encarar um mega.

---

## Parte 3b — Passos: o sensor certo é o mais burro

Dono da regra: `src/utils/steps.ts`. **Esta seção substitui a antiga dependência de Health Connect para passos.**

### A decisão técnica

`Sensor.TYPE_STEP_COUNTER` do próprio aparelho, via **`@capgo/capacitor-pedometer`** (no iOS, `CMPedometer`), com a permissão **`ACTIVITY_RECOGNITION`** — permissão de runtime simples, do mesmo tipo que câmera ou microfone. **Sem Health Connect e sem Google Fit.**

**Por que não Health Connect.** Ele é a plataforma certa para um app de saúde, e o Soulmon não é um. O custo de conformidade é desproporcional para um bônus cosmético: **conta de organização verificada no Play** (enforcement de jan/2026 — se o publisher for conta pessoal, é bloqueador absoluto), declaração pesada de acesso a dados de saúde no Play Console e **política de privacidade dedicada**. Some-se a janela de 30 dias (só lê os 30 dias anteriores à concessão; reinstalar recomeça a contagem), que empurra a espelhar dado sensível no backend. Nada disso se paga por um selo de "verificado".

**Por que não Google Fit.** Está sendo desligado: cadastros novos fechados desde 01/05/2024, APIs suportadas só até o fim de 2026. **Nada deve ser escrito contra ele** — nem a Recording API, que aparecia como "caminho leve" na versão anterior deste documento e morre junto.

**O custo real desta escolha**, e é ele que a torna viável:

1. marcar **"Activity and fitness"** no formulário de health apps que *todo* app já preenche — não é a declaração de health app, é uma linha no formulário que já existe;
2. **tela de consentimento no app**, mostrada ANTES do diálogo do sistema (`stepsConsentCopy`, EN + PT-BR): o que é lido, para quê, e o que não sai do aparelho. Chamar `requestStepsPermission()` sem ter mostrado essa tela é bug de conformidade, não de UX;
3. **APK novo** — é código nativo, mudou `android/`. Mudança web não precisa de APK; esta precisa.

E a decisão de dado que barateia tudo: guarda-se **só o agregado diário** (`{ date, baseline, today }`). Nunca a série bruta, nunca horário de passo, nunca localização. Minimização de dados — e sem série não há como inferir a rotina de ninguém.

### O princípio continua o mesmo

> **Declarado pontua. Inferido confirma.**

Passo é sinal **inferido**, e por isso **nunca pontua sozinho**. Os dois usos legítimos:

- **selo de "verificado" + bônus pequeno** num hábito de Fitness/Health que o usuário **já marcou** como feito — o hábito marcado é que vale, o passo só confirma;
- **missões corporais opcionais com teto diário** — conteúdo extra, nunca requisito de meta, de coração, de dia perfeito ou de evolução.

Nenhuma função de `steps.ts` devolve HP, energia, `perfectDays` ou peso de esforço, e nenhuma delas deve passar a devolver. **Quem não tem sensor não fica em desvantagem estrutural**: a maior parte da base joga na PWA, onde não existe sensor nenhum, e lá a mecânica degrada sozinha — `isStepsAvailable()` responde `false`, `readStepsToday()` responde `null`, e o app segue idêntico, só sem passos. No dia em que existir uma recompensa alcançável *só* com sensor, a regra já foi quebrada.

Meta padrão: `DEFAULT_STEP_GOAL = 7000` — referência de caminhada regular, **não meta médica**.

### A limitação técnica achada na implementação (registrada de propósito)

`TYPE_STEP_COUNTER` conta acumulado **desde o boot** e zera no reboot. O plugin acrescenta um **segundo reset**: no Android ele entrega passos desde o `startMeasurementUpdates()` da *sessão*, então relançar o app também derruba o número para 0. Os dois casos têm exatamente a mesma assinatura — *a leitura crua caiu abaixo da última leitura* — e por isso são tratados pelo mesmo caminho, em função pura e testável (`stepsDeltaFrom` / `updateStepBaseline`). O invariante que sai daí: **nunca devolvemos passo negativo**, e uma queda do acumulado só pode *adicionar* ao total do dia, jamais subtrair.

A consequência honesta: **passos dados com o app morto (e o aparelho não reiniciado) ficam de fora.** Isso é aceitável — e é aceitável *exatamente* porque passo não pontua sozinho. Subcontar não tira nada de ninguém. Se um dia passo virasse insumo de pontuação, esta limitação deixaria de ser aceitável no mesmo instante, e a resposta certa seria rever a pontuação, não o sensor.

---

## Parte 3c — Mais parâmetros de v-pet? Não — mais consequências

Dono da regra: `src/utils/petNeeds.ts`.

### A decisão: NÃO adicionar medidores

A pergunta natural depois de tudo isso é "que outras barras de v-pet clássico faltam?". A resposta medida é: **quase nenhuma**. O Soulmon já tem cocô, energia, banho, dormir e carinho. Do kit clássico do gênero, o que faltava mesmo era **brincar**.

E cada barra nova é **uma cobrança nova**. O contra-exemplo canônico é o **Habitica**, onde usuários relatam gastar mais tempo administrando o app do que fazendo os próprios hábitos. O benchmark é inequívoco na outra direção: **quem retém (Finch, Pokémon Sleep) tem MENOS sistemas, não mais.** Profundidade nesses produtos vem de consequência, não de contagem de medidores.

Então o que entrou no lugar foram duas coisas que **não são medidores**:

### 1. Brincar como dreno de recurso

- Oferta de **1×/dia** (`PLAY_TIMES_PER_DAY = 1`).
- **Consome energia** (`PLAY_ENERGY_COST = 1`) — e energia só existe porque alguém comeu, e comida só existe porque alguém **concluiu uma tarefa real**. O gasto está ancorado em trabalho real; não há barra de "diversão" que desce sozinha.
- **Concede um buff no minijogo seguinte**: `PLAY_BUFF_MULTIPLIER = 1.2` (+20% de Bits) por `PLAY_BUFF_DURATION_MIN = 60` minutos, mais 1 ponto de atributo na categoria do dia. Modesto **de propósito**: um bônus grande transformaria a oferta em dever diário — a pessoa passaria a "ter que" brincar antes de todo minijogo, que é a definição de mais uma cobrança.
- ⚠️ **Regra que não pode ser quebrada: brincar NUNCA é condição de dia perfeito, de HP ou de evolução.** No instante em que qualquer um dos três olhar para `playLog`, a oferta vira obrigação. Brincar só pode *somar*; nunca subtrair de nada além da energia que o próprio jogador escolheu gastar. Não ter brincado não é uma pendência, e `canPlay() === false` não é aviso vermelho — é só a oferta não estar disponível.

### 2. Cansaço como estado DERIVADO

- **Não é campo de save e não é barra.** É calculado, a cada leitura, de duas entradas que **já existem**: a **sobrecarga de ontem** (`plannedEffort` acima de `OVERCOMMIT_EFFORT`) e a **noite fora da janela**. Nada novo é medido, nada novo é persistido. No instante em que `tiredness` virar campo do `GameState`, ele vira uma barra que sobe e desce sozinha.
- **O efeito é APENAS cosmético/narrativo.** O pet aparece sonolento — um espelho do dono, e nada além disso. Cansaço **não pode**: reduzir recompensa (Bits, comida, atributo, multiplicador); travar ação nenhuma (brincar, minijogo, masmorra, concluir tarefa); nem entrar em dia perfeito, HP ou evolução.
- O porquê é o desenho inteiro do produto: **quem aparece cansado é exatamente quem trabalhou demais ou dormiu fora de hora.** Se o jogo reduzisse a recompensa dessa pessoa, estaria punindo justamente quem mais precisa de acolhimento. O pet sonolento existe para a pessoa **se ver**, não para pagar por isso — e por isso a fala é cumplicidade ("a gente descansa junto"), nunca diagnóstico.
- No mesmo espírito, `needsAttention` devolve **no máximo UM** desejo por vez. Uma lista de três desejos é um painel de pendências, e painel de pendências é o Habitica: a pessoa abre o app e encontra uma fatura. Um convite de cada vez é o Finch. Array vazio é um resultado perfeitamente bom — um pet que não quer nada agora é um pet feliz, não um bug.

### A regra de ouro para qualquer parâmetro futuro

> Um parâmetro novo só entra se **ou for alimentado por uma tarefa real cumprida, ou gastar um recurso que veio de tarefa real**.
>
> **Medidor que sobe e desce sozinho com o tempo é cobrança desacoplada da vida real — e neste app a vida real é o jogo.**

Todo pedido futuro de "adicionar higiene", "adicionar humor do pet", "adicionar social" passa por esse teste antes de qualquer linha de código. Brincar passa (gasta energia que veio de tarefa). Cansaço passa (é derivado, não medido). Uma barra de diversão que decai com o relógio **não passa** — e não passar é a resposta correta.

---

## Parte 4 — Roadmap

**Fase 1 — o motor (só código web, sem dependência nativa, impacto máximo)** — ✅ **implementada**
Recorrência flexível com `from: 'completion'` · esforço nas tarefas · meta ponderada · constância "5 das últimas 7" + escudos automáticos · marcos 7/21/66 · when vs deadline · contador de adiamentos · "deixar pra lá" · aging assombrado · foco do dia.

**Fase 2 — os rituais** — 🟡 **parcial**
✅ Check-in · relatório semanal com sugestão de habit stacking · estações/fresh start · "Arrumar a pilha" (`triageQueue`).
⬜ Falta: **Quick Add de uma linha** e a **aventura narrada** no relatório noturno.

**Fase 3 — sono (sem sensor)** — ✅ **implementada**
Janela de Descanso · média móvel · 18 Sonhos no `DREAM_CATALOG`. **Roda igual na PWA e no Android** — não depende de nada nativo.

**Fase 3b — pesadelos (sem sensor)** — ✅ **implementada** (`utils/nightmares.ts`)
1 por noite dentro da janela · onda de 2 inimigos delegada a `buildDungeonWave` · tier pela **regularidade**, nunca pela duração · vitória devolve energia e até meio coração · derrota e não-combate custam **zero**. Também roda igual na PWA — não lê sensor nenhum.

**Fase 4a — passos (só Android, opt-in)** — ✅ **implementada** (`utils/steps.ts`)
`@capgo/capacitor-pedometer` + `ACTIVITY_RECOGNITION` · agregado diário só (`{date, baseline, today}`) · `stepsConsentCopy` antes do diálogo do sistema · degradação graciosa na PWA. **Exige APK novo** (mudou `android/`). Ainda ⬜ na camada de cima: ligar o **selo de "verificado"** nos hábitos de Fitness/Health e as **missões corporais** com teto diário — sempre como confirmação de algo já declarado.

**Fase 4b — Health Connect: continua FORA, e isto é decisão fechada**
Sono e exercício via Health Connect **não entram**. O motivo não é técnico e sim de custo: exige **conta de organização verificada no Play** (enforcement de jan/2026 — conta pessoal é bloqueador absoluto), **declaração de health app** no Play Console, **política de privacidade dedicada** e consentimento LGPD art. 11 específico e destacado por finalidade. Tudo isso para entregar um selo cosmético que a Parte 3b já entrega sem sensor nenhum. A Janela de Descanso, os Sonhos e os Pesadelos rodam **inteiros sem permissão de saúde** — o sono virou conteúdo de jogo por *design*, não por falta de acesso ao sensor. Se um dia isso mudar, a decisão volta para o dono (`docs/STATUS.md` §3.2) e o caminho técnico é `@capgo/capacitor-health`, guardando **só agregados diários**.

**Não haverá Fase 5 de "mais medidores"** — ver Parte 3c. Brincar e cansaço derivado fecham o kit; qualquer parâmetro novo passa antes pela regra de ouro.

**Nunca**: Google Fit; Health Connect enquanto o custo de conformidade não se pagar; punição por sono ruim; score de sono na home; recompensa que escale com a **duração** do sono; streak que zera; recompensa por contagem de tarefas.

---

## Parte 5 — Notas de implementação

- Todo campo novo em `GameState` precisa de linha em `hydrateSave()` — omissão já causou tela branca permanente.
- Regras vão em `dailyReset.ts` / `careRules.ts` (funções puras + testes), **nunca** dentro de handler do `App.tsx`. Atualizar `GuideModal` e `HelpModal` junto, senão a regra diverge em silêncio.
- Migração de `weekDays[]` para `Schedule`: manter o campo antigo lendo como `{kind:'weekdays'}` para não quebrar saves existentes.
- Classes Tailwind com valor arbitrário não funcionam (CSS pré-compilado) — usar `style={{}}` inline.
- Todo texto de UI em EN + PT-BR.
- `ActivitiesPage.tsx` é a página de **minijogos**, não de hábitos; a lista é a view `main` do `App.tsx`.
