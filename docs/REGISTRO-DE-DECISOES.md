# Registro de decisões — o que a pesquisa disse, o que fizemos com isso, e por quê

> **Para que serve.** Consolidar, num lugar só, cada escolha de produto do Soulmon
> ao lado da evidência que a sustentou e da alternativa que perdeu. Existe para
> duas coisas: **rever no futuro** se a escolha continua fazendo sentido contra os
> estudos, e **não rediscutir** o que já foi decidido com argumento — quem quiser
> reabrir uma decisão encontra aqui o que teria de derrubar primeiro.
>
> **Regra de leitura.** Cada linha traz o **nível de evidência** da fonte:
>
> | Marca | Significado |
> |---|---|
> | 🎥 | *via transcrição* — a fala dentro do vídeo, executada no NotebookLM (`08-transcricoes-notebooklm.md`). A evidência mais forte do projeto |
> | 📚 | literatura com autor e ano (Lally, Gollwitzer, Polivy & Herman, Dai/Milkman/Riis, Nunes & Drèze, Masicampo & Baumeister) |
> | 📊 | número de mercado com fonte (receita, retenção, ARR) |
> | 🖼️ | tela real lida no Mobbin (`09-mobbin-dossie.md`, 27 buscas, ~90 achados) |
> | 📰 | título de vídeo + fonte secundária (a rodada 1 não conseguia ler transcrição) |
> | 🧭 | decisão de tese — não há estudo, há a essência declarada do produto |
>
> **Nada aqui é dado do Soulmon.** Ninguém nunca usou o app em produção
> (`docs/STATUS.md`). Toda afirmação sobre "o usuário" é hipótese informada por
> terceiros até existir telemetria. Este documento não esconde isso — ele marca.
>
> **Consolidado em 08/09/2026.** As fontes primárias continuam sendo os arquivos
> citados; este registro aponta para eles em vez de reescrevê-los.

---

## 0. Índice

1. A tese, e o eixo que organizou tudo
2. As fontes, e o que cada uma pode e não pode afirmar
3. Os princípios permanentes (e os quatro critérios que nasceram depois)
4. Registro de decisões, por tema
   - 4.1 Falha e perdão
   - 4.2 Hábitos, tarefas e planejamento
   - 4.3 Onboarding, identidade e o Oráculo
   - 4.4 Monetização
   - 4.5 Camada social
   - 4.6 Recompensa e conteúdo
   - 4.7 Presença fora do app (push, widget)
   - 4.8 Telemetria e privacidade
5. As decisões de 07–08/09/2026 (a rodada mais recente)
6. A crítica mais forte contra o produto — e como a gente responde
7. O que a pesquisa contradisse, e o que continua em aberto
8. Como usar este documento para rever uma decisão

---

## 1. A tese, e o eixo que organizou tudo

> **O Soulmon é um avatar do usuário que evolui junto com ele e o encoraja —
> nunca um cobrador.** (`docs/PLANO-EVOLUCAO.md`)

Toda decisão passa por uma pergunta: *isso faz o bichinho parecer mais um
companheiro, ou mais um chefe?* O que faz parecer chefe foi cortado ou invertido,
**mesmo quando "engajaria" mais**.

O eixo que organizou a pesquisa inteira foi **como cada produto trata a falha**:

| Produto | Ao falhar | Resultado | Evidência |
|---|---|---|---|
| Pokémon Sleep | você **não ganha**; nunca perde | US$ 234,9M em 3 anos, queda de só 3,2% no ano 3 | 📊 |
| V-Pet Digimon (1997) | erros **selecionam outro galho** de evolução | ~14M de unidades; a linha fiel segue até 2027 | 📊 |
| Vital Bracelet | **estagna** ou cresce em algo indesejado | apps encerrados, servidores offline em 2024 | 📊 |
| Pokémon GO | gentil no físico, **punitivo nos streaks** | 20M ativos/semana, mas 2 crises graves de acessibilidade | 📊 |
| Tamagotchi original | **morria** em <12h sem pausa | apego **e** abandono em massa — o criador projetou a dor de propósito | 🎥 |
| Finch | pássaro **nunca morre, nunca cobra** | ~US$ 30M ARR sem VC; D1 ~54% / D7 ~37%; elogio nº 1: "não me faz sentir culpado" | 📊 📰 |
| Habitica | Dailies não feitas dão **dano de HP**, morte custa nível | o contra-exemplo canônico: usuários relatam gastar mais tempo administrando o app que os hábitos | 📰 |
| **Soulmon (antes da Fase 1)** | **perdia HP**, podia zerar e degenerar num dia | — | — |

**A conclusão que virou o produto:** um app de produtividade que castiga quem está
mal está desenhado para funcionar melhor com quem menos precisa dele — porque
quem não cumpre as tarefas é justamente quem está doente, deprimido ou em crise.

**O benchmark correto do Soulmon não é o Duolingo. É o Finch.** (`GUIA-EXPERIENCIA.md` A.2)

---

## 2. As fontes, e o que cada uma pode e não pode afirmar

| Fonte | O que é | Força | Limite declarado |
|---|---|---|---|
| `docs/PLANO-EVOLUCAO.md` | Benchmark de ago/2026: Habitica, Finch, Catzy, Forest, Tamagotchis modernos, V-Pet → Vital Bracelet, Pokémon Sleep/GO, Palworld + SDT, Octalysis, Fogg, loot boxes | 📊 📰 | Escrito antes das transcrições; parte vem de título + artigo |
| `docs/PLANO-TAREFAS.md` | Benchmark de **25+ produtos** de tarefa/hábito (Todoist, Things 3, TickTick, Sunsama, Motion, Structured, Reclaim, Akiflow, Atoms, Streaks…) + a literatura comportamental | 📚 📰 | É o documento com mais ciência citada; é onde estão Lally, Gollwitzer, Zeigarnik |
| `docs/GUIA-EXPERIENCIA.md` | Síntese de **7 relatórios** (`guia-experiencia/01`–`07`) + **rodada 2** com 16 perguntas executadas no NotebookLM sobre transcrições reais | 🎥 📚 📊 | A rodada 1 **não lia transcrição** (IP bloqueado); a rodada 2 é a única que pode DERRUBAR recomendação da 1 |
| `guia-experiencia/01-youtube-mobbin-timgabe.md` | Tim Gabe (500+ apps gamificados, leaderboards, onboarding paradox, Spotify) + o método Mobbin | 📰 | ⚠️ **Correção de autoria de 01/09/2026**: 5 vídeos estavam atribuídos ao canal errado; **nenhum** vídeo citado é do canal `@mobbindesign`. Verificado via oEmbed |
| `guia-experiencia/09-mobbin-dossie.md` | **27 buscas no Mobbin**, ~90 telas lidas, 13 dossiês temáticos, 8 decisões de arquitetura | 🖼️ | Só iOS e web; sem Android, sem desktop, sem estados transitórios, sem data de captura |
| `guia-experiencia/02` a `07` | Psicologia do vínculo (Tamagotchi effect), streaks, monster-taming, onboarding, paywall, retenção | 📚 📰 | O 07 abre dizendo que **sem telemetria tudo é hipótese** — e isso vale para os outros seis |
| `product/soulmon-01/balance/carga-diaria.md` | Auditoria da carga diária: 6 bugs + 5 propostas de balanceamento + pesquisa em 4 eixos (Streaks, Habitica Inn, Duolingo freeze, planejamento) | 📰 | Nasceu de UM teste com usuário do dono ("nem todo dia consigo fazer as 6") |
| `docs/PLANO-COOP.md` | O modo cooperativo, derivado do item 4.2 (31,3% de efeito negativo de comparação) | 📊 🧭 | — |

**Regra que o próprio guia impõe a si mesmo:** `via transcrição` vence `título +
artigo`, que vence `conhecimento consolidado`. Quando duas fontes discordam, a
mais forte manda — e a discordância fica registrada (seção 7).

---

## 3. Os princípios permanentes

Sete fronteiras que a pesquisa validou externamente (`PLANO-EVOLUCAO.md`). **Não
afrouxar.** E, abaixo, quatro critérios que nasceram depois e viraram régua
permanente também.

| # | Princípio | De onde veio | Onde mora no código |
|---|---|---|---|
| 1 | **Dinheiro compra conveniência, cosmético e identidade — nunca o comportamento nem o perdão dele** | A Bandai gateou linhagens de evolução com Dim Cards pagos e pagou com o produto 📊 | `utils/currencies.ts` (3 moedas com fronteira travada por teste); `Bits → Créditos` proibido |
| 2 | **Nada de conteúdo aleatório vendido.** Drops se ganham jogando; a loja vende item determinado | Loot box = a linha que separa "variável que deleita" de "variável que vicia" 📰; Lei 15.211/2025 (ECA Digital) em vigor | Glitchtama nunca vendido; `DUNGEON_HEART_DROPS` com teto |
| 3 | **Modernizar o atrito, nunca a dificuldade** | Os fãs premiaram no Digimon COLOR USB-C, backup e treino rápido — **zero afrouxamento** das condições de evolução 📊 | É o critério que separou P1 (perdão no coração) de "afrouxar o dia completo" |
| 4 | **O jogo continua íntegro com o backend morto** | Vital Bracelet: servidores offline em 2024, apps mortos 📊 | A regra do `?? padrão` no load; nenhuma progressão exige rede |
| 5 | **Regras explicadas, resultados surpreendentes** | V-Pet: diga que existem galhos e o que os influencia; não entregue a tabela | A árvore de 11 formas é visível; a tabela de thresholds não |
| 6 | **O sinal do Soulmon é declarado, não inferido** | O sensor óptico do Vital Bracelet **falha em pele mais escura** 📊 — "o usuário marcou" não tem erro de sensor nem discrimina corpo | Ver a qualificação abaixo (critério D) |
| 7 | **"Passou muito tempo no app" é antipadrão** | O Soulmon quer sessões curtas por meses; os tetos (5 comidas/h, 1 coração/dia de carinho) impedem consumir o app em 30h | Princípio 7 é o motivo de os tetos **não** serem afrouxados quando o app "parece vazio" |

### Os quatro critérios que nasceram depois

**A. O teste do "exploitationware"** (`GUIA` I.1.3, 🎥). Toda mecânica nova de
recompensa responde antes de entrar: *"isto faz a pessoa querer fazer a tarefa,
ou querer a notificação?"*. Nasceu da crítica mais dura contra o produto (seção 6).

**B. A regra de ouro do parâmetro** (`PLANO-TAREFAS.md`, Parte 3):

> Um parâmetro novo só entra se **ou for alimentado por uma tarefa real cumprida,
> ou gastar um recurso que veio de tarefa real**. Medidor que sobe e desce sozinho
> com o tempo é cobrança desacoplada da vida real — e neste app a vida real é o jogo.

Brincar passa (gasta energia que veio de tarefa). Cansaço passa (é derivado, não
medido). Uma barra de diversão que decai com o relógio **não passa**.

**C. Meta que cede, nunca que aperta.** Adaptar para baixo pode ser discutido;
adaptar para cima é a esteira do Vital Bracelet, que fez os donos pararem nos
estágios médios. *Um jogador nunca pode ser punido por ter tido uma boa semana.*
(`carga-diaria.md` P3)

**D. A qualificação do Princípio 6** (`PLANO-TAREFAS.md`, Parte 3):

> **Declarado pontua. Inferido confirma e enriquece. Nunca o inverso.**

O princípio original dizia "não importar sinais inferidos". A Fase 4a trouxe o
contador de passos e a régua ficou mais precisa: o sensor **nunca pontua sozinho**
— só confirma o que a pessoa já marcou, ou vira conteúdo opcional com teto. Quem
não tem sensor não fica em desvantagem estrutural. É uma evolução registrada do
princípio, não uma quebra.

---

## 4. Registro de decisões, por tema

Formato de cada linha: **decisão** · evidência · **alternativa que perdeu, e por quê** · onde está · estado.

### 4.1 Falha e perdão

| Decisão | Evidência | Alternativa rejeitada | Onde | Estado |
|---|---|---|---|---|
| **Teto de 1 coração por dia** (`MAX_HEARTS_LOST_PER_DAY = 1`) | Um dia ruim é um sinal, não uma sentença. A tabela de falha da seção 1 📊 | Perda proporcional sem teto (o Soulmon original): zerava e degenerava num dia | `dailyReset.ts` | ✅ Fase 1 |
| **Ausência ≥ 2 dias não cobra nada** (`ABSENCE_FORGIVENESS_DAYS`) | Finch: quem volta encontra saudade, não fatura 📰; o *what-the-hell effect* (Polivy & Herman) 📚: cobrar no retorno dispara abandono total | Cobrar retroativamente os dias perdidos (Habitica) | `dailyReset.ts`, `welcomeBack` no relatório | ✅ Fase 1 |
| **Segunda-feira devolve 0,5 coração** | *Fresh start effect* (Dai, Milkman & Riis) 📚: segunda, dia 1 e aniversários "relegam as imperfeições ao período anterior" | Nada na virada de semana | `WEEKLY_RELIEF_HEARTS` | ✅ Fase 1 |
| **`perfectDays` só acumula, nunca zera** | Lally et al. 2010 📚: pular UM dia não prejudicou mensuravelmente a automaticidade — *a ciência autoriza o perdão*. Streak binário é invenção de produto. "Forced Play" é dark pattern **nomeado** (Extra Credits 🎥) | Streak visível de dias consecutivos — "a alavanca de retenção mais forte que existe" (a própria Duolingo 📰) e funciona por **aversão à perda**, que a essência recusa como motor | Travado por teste | ✅ C.1 #1 |
| **Constância "N das últimas 7"** em vez de streak por hábito | Uma falha custa ~14%, não 100% (`PLANO-TAREFAS`); mesma base de Lally | Contador por hábito que zera | `habitRhythm.ts`, `CONSTANCY_WINDOW_DAYS` | ✅ |
| **Escudos de descanso consumidos AUTOMATICAMENTE** | Duolingo 🎥: dar 2 freezes **equipados por padrão** foi "holy smokes" de ganho; quem acabou de perder o dia, por definição, não está no app para ir comprar proteção | Escudo que a pessoa precisa lembrar de ativar | `applyMissedDay` | ✅ |
| **Estoque de escudos INVISÍVEL** | Mobbin 🖼️: sete apps com a mesma mecânica; a diferença toda é a exibição — `1 Streak Freeze` (positivo) vs `Streak saves 0` / `NO STREAK FREEZE` (negativo). Não expor o estoque evita o único modo de falha | Mostrar "você tem 2 escudos" | Decisão 4 do dossiê | ✅ |
| **`REST_SHIELD_MAX = 3`** | ⚠️ Duolingo 🎥: "**three streak freezes was no better than two**… we were training them to take more time off" | — | `taskModel.ts` | ⏸️ **Em aberto (H0)**. O escudo do Soulmon é ganho por constância e gasto sozinho, não é a mesma peça — por isso é experimento (3→2), não correção. Depende de telemetria |
| **"Never miss twice" + versão reduzida** (`MISS_INTERVENTION_AT = 2`) | Atoms/James Clear 📚; o Finch oferece "hoje, só 5 minutos?" 📰 | Dano de HP na segunda falha (Habitica) | `habitRhythm.ts` | ✅ |
| **Meta de coração = 60% da meta do dia** (`HEART_GOAL_RATIO`, **P1**) | Habitica separa *Dailies* (machuca) de *Habits* (não machuca); o Soulmon tinha os dois eixos num número só 📰. Princípio 3: a **excelência** (dia completo) continua custando a meta inteira | Afrouxar a meta do dia completo — quebraria o princípio 3 e cederia o caminho de evolução | `heartGoalFor` / `heartGoalFromDailyGoal`; `heartGoal.test.ts` trava que o desconto NÃO vaza para `dayWasPerfect` | ✅ 07/09/2026 (dono) |
| **Um dia de folga por semana, automático e retroativo** (`REST_DAYS_PER_WEEK = 1`, **P2**) | Habitica *Rest in the Inn* 📰: sai a punição, fica a recompensa — "descansar não é sair do jogo". Duolingo freeze 📰: no bolso ANTES de precisar. Sem acúmulo: saldo que empilha é trabalho | "Modo férias" com data de início e fim — é planejamento, e planejamento é a fricção da queixa nº 2 | `dailyReset.ts`; `restDay.test.ts`; o relatório **conta** que usou (`restDayUsed`) | ✅ 07/09/2026 (dono) |
| **A chave da semana da folga é aritmética de CALENDÁRIO, não de milissegundos** | Primeiro achado da sessão de QA (`4be07ee9`, 08/09/2026): `getTime() − n·86400000` subtrai 24 h exatas e, na virada do horário de verão, caía no domingo anterior — uma folga extra de graça, uma vez por ano, em todo fuso com DST. Invisível no Brasil, que não tem mais DST | `new Date(ano, mês, dia − n)` | `restWeekKeyFor`; teste roda 400 dias em 4 fusos por processo filho | ✅ corrigido |
| **Perdão invisível NÃO existe: a folga é anunciada** | Perdão que a pessoa não soube que recebeu faz a cobrança da semana seguinte parecer arbitrária 🧭 | Gastar em silêncio, como o escudo | `DailyReportModal` | ✅ |
| **Alívio adaptativo (P3)** | — | — | — | ⏸️ **Adiada** (08/09/2026). Duas leituras incompatíveis da proposta; seria o 6º perdão empilhado; sem usuário não dá para saber se 3 de 6 é regra ou exceção. Gatilho para reabrir em `carga-diaria.md` |
| **Degeneração nunca se chama "morte"; sempre reversível, nunca por pagamento** | Tamagotchi original 🎥: morte em <12h sem pausa deu apego **e** abandono em massa. O Soulmon fica com a primeira metade | "Seu pet morreu" | C.2 #23 | ✅ |

### 4.2 Hábitos, tarefas e planejamento

| Decisão | Evidência | Alternativa rejeitada | Onde | Estado |
|---|---|---|---|---|
| **Otimizar o PLANEJAR, não o marcar o check** | Masicampo & Baumeister 📚: a tensão da tarefa inacabada é aliviada por **fazer um plano**, não por concluí-la. Gollwitzer 📚: tarefa com *quando e onde* tem execução categoricamente maior | Otimizar o check (Todoist Karma, Duolingo) produz **gaming**: tarefa trivial só para pontuar | Todo o motor de tarefas | ✅ Fase 1 do motor |
| **Recorrência contada da CONCLUSÃO** (`everyNDays`, `from: 'completion'`) | Todoist `every! 3 days` 📰: impede acúmulo de instâncias atrasadas — **a causa nº 1 documentada de abandono** de app de tarefas | Contar do calendário | `Schedule` em `taskModel.ts` | ✅ |
| **"3× por semana"** (`timesPerWeek`) | Streaks 📰: frequência flexível existe porque agenda rígida quebra quando trabalho e família invadem | Só dias fixos | idem | ✅ |
| **Esforço 1–3 obrigatório; recompensa escala com esforço, NUNCA com contagem** | O defeito exato do Karma do Todoist, crítica nº 1 àquele sistema 📰 | Recompensa por item | `Effort`, `dailyGoal.contract.test.ts` | ✅ C.1 #2 |
| **"Quando" separado de "Prazo"; só o "quando" traz para o Hoje** | Things 3 📰: prazo não é plano; escolher quando começar é implementation intention embutida | Prazo que polui o Hoje | `startDate` vs `deadline` | ✅ |
| **"Deixar pra lá" como estado terminal digno** | TickTick *Won't Do* 📰; Things *Someday* inerte 📰. Sem saída digna, o mercado inteiro sofre **falência periódica** (apagar tudo e recomeçar) | Deletar (perde contexto) ou mentir que fez | `TaskStatus: 'dropped'`, `'someday'` | ✅ |
| **Contador de adiamentos visível; intervenção em 3** | Sunsama 📰: torna evitação crônica um dado, não um sentimento | Adiar em silêncio para sempre | `POSTPONE_NUDGE_AT = 3` | ✅ |
| **Marcos em 7 / 21 / 66 dias** | Lally et al. 📚: mediana de **66 dias**, faixa 18–254. **O "21 dias" é mito** (Maxwell Maltz, 1960, cirurgia plástica) | 21 dias | `HABIT_MILESTONES` | ✅ |
| **Hábito novo nasce em ratio 1 (progresso dotado)** | Nunes & Drèze 📚; Catan começa todos com 2 dos 10 pontos (GDC 🎥) | Começar em 0% | `habitRhythm.ts` | ✅ I.2 |
| **Carga do dia é AVISO, nunca bloqueio** (`isOvercommitted`) | *The Freedom Fallacy* 🎥: autonomia é volição, não liberdade irrestrita — estrutura satisfaz autonomia melhor que ausência de direção | Bloquear criação acima do teto | C.2 #24 | ✅ |
| **Âncora ("depois do café, na cozinha") no lugar de só alarme** | Gollwitzer 📚; é literalmente o formulário do Atoms | Só horário | `HabitAnchor` | ✅ |
| **Presets de rotina de 1 toque + "Equilibrar minha semana" (P4)** | Pesquisa negativa e útil: **ninguém planeja a semana num app de hábito; quem tenta, desiste** (`carga-diaria.md` 2d). Planejamento tem de ser subproduto de 1 toque | Um planejador semanal | `ROUTINE_PRESETS`, `weekBalance.ts`, `BalanceWeekModal` | ✅ 07/09/2026 |
| **Quick Add de uma linha, na tela inicial** | Akiflow/Todoist 📰: fricção de captura decide se o sistema sobrevive à segunda semana | Captura em 3 telas | `quickAdd.ts`, `QuickAddBar` | ✅ 08/09/2026 |
| **Reduzir o `cap` para "proteger" quem cadastra demais** | — | **Recusado**: cadastrar muito é saudável; `min(cadastradas, requisito)` já neutraliza. O problema era o app **mostrar** que penalizava (BUG-1), não o usuário | — | ❌ recusado |

### 4.3 Onboarding, identidade e o Oráculo

| Decisão | Evidência | Alternativa rejeitada | Onde | Estado |
|---|---|---|---|---|
| **Cada pergunta do onboarding muda a experiência visivelmente** | Tim Gabe, *Onboarding Paradox* 📰: pedir só o que muda a experiência imediata | Formulário de cadastro | `soulGoal`/`soulStruggle` voltam no relatório; as 6 perguntas geram a criatura | ✅ |
| **Criatura comum grátis; criatura própria paga** | Decisão 1 do dossiê 🖼️ | Paywall antes de qualquer criatura | `demoCharacterId` | ✅ |
| **Neutro por nome próprio, sem gênero declarado** | Decisão 2 🖼️; custo declarado: disciplina de redação permanente — nenhuma copy pode usar adjetivo concordado | Declarar `She/Her` como o Finch | Toda a copy | ✅ |
| **Psicométrico INVISÍVEL — só alimenta a criatura** | Decisão 6 🖼️ | Mostrar perfil de personalidade | `oracle.ts` | ✅ — ⚠️ criou o **Problema 1** do dossiê: 20 telas de custo, retorno invisível. Solução mapeada (Speak `What I heard`, Lovi, Noom), **ainda em aberto** |
| **A criatura é ESPÉCIE, não personagem** | frogMak 🎥: traços humanos rígidos impedem a pessoa de projetar a própria história | Descrição com personalidade fechada | Descrição diz **de onde veio**, não **como se comporta** | ✅ I.3.4 (calibração) |
| **Não cobrar no reveal; value moment = 1º dia completo** | Conflito C.3 #1: rel. 01 pedia paywall no reveal (padrão Noom "seu plano está pronto"); rel. 05/06 diziam não | Paywall no reveal | `UnlockNudge` com `reason: 'report'` | ✅ — reconsiderar só com conversão < 1% |
| **Manter a bifurcação teste longo → reveal; medir antes de reordenar** | Conflito C.3 #6 | Reveal antes do teste | `onboarding_long_test` | ✅ — se o teste de 20 itens matar >30% do funil, reordenar vira P0 |
| **Conta é a PRIMEIRA tela: Google / ou / Novo usuário** | 🧭 decisão do dono (07/09/2026). O argumento técnico contra (D-07: consentimento antes de dado pessoal) estava certo no diagnóstico e errado na conclusão: a saída foi trazer o bloco legal **para dentro** da tela de conta | Identidade depois do consentimento (a proposta original do `PLANO-TELA-IDENTIDADE.md`) | `SoulmonOnboarding.tsx`, `IDENTITY_STEP` | ✅ 07/09/2026 |
| **Idade por CAIXA de declaração, não mês/ano** | 🧭 dono: "deixe que o Google verifique, ou no máximo um checkbox". Menos dado pessoal coletado para o mesmo efeito legal | Campo de mês/ano de nascimento | `consent.ts` (funções de idade removidas) | ✅ 07/09/2026 |
| **E-mail obrigatório para todos** | 🧭 dono (07/09/2026) — o `saveId` deriva dele, e a compra precisava de vínculo estável | Conta opcional | `_auth.js` | ✅ |

### 4.4 Monetização

| Decisão | Evidência | Alternativa rejeitada | Onde | Estado |
|---|---|---|---|---|
| **Nunca vender**: evolução, `perfectDays`, HP irrestrito, escudos, conclusão de tarefa, "pular o dia", vantagem em PvP, Glitchtama. **Nunca ads intersticiais** | Princípio 1 + Kotaku/Digital Trends sobre o Premium Pass do Pokémon Sleep 📰 | — | C.2 #14 | ✅ |
| **Nunca vender proteção contra punição (freeze comprável)** | Vender proteção cria **incentivo comercial para a punição existir** — o conflito de interesse estrutural do Duolingo 🎥 📰 | Streak freeze pago | C.2 #15; `carga-diaria.md` §4.2 | ✅ |
| **Cura instantânea por Créditos: REMOVIDA** | É pagar para pular o cuidado — a crítica do Premium Pass 📰. Conflito C.3 #7 | Manter ou limitar a 1/semana | `monetization.ts` ("a peça inteira foi removida") | ✅ resolvido (H3) |
| **Reroll por Créditos: aleatoriedade com seed derivada + tela explícita de que todo resultado é equivalente** | Lei 15.211/2025 (ECA Digital) em vigor desde 17/03/2026; condenação de R$ 333M em jun/2026; Pokémon GO teve incubadoras removidas no Brasil 📊. Atenuante: todo pet é **mecanicamente equivalente** (é identidade, não poder) | `Math.random()` puro; ou remover o reroll | `oracle.ts` (`mulberry32`, seed) | ✅ resolvido (H4, 07/09/2026) |
| **Assinatura recorrente** | Compra única não cobre custo recorrente de IA — o problema é real (C.3 #3) | — | — | ⏸️ **Dono (H1)**. Admissível com 3 travas: nada de progresso; cancelar não remove nada; conteúdo = IA + cosmético |
| **Vender o resultado, não a feature** ("um Soulmon que é só seu") | Cravotta, *100 Paywalls* 📰: benefícios concretos, âncora simples, botão de fechar presente | Lista de features técnicas | `UnlockAccountModal` | ✅ |
| **A recusa sempre tem saída** (cap do demo → `UnlockNudge`) | Tim Gabe sobre dead-ends 📰; caso `24870bf7` do próprio repo | Recusa seca | 3 lugares | ✅ |
| **"Agora não" com a mesma largura do primário** | Mobbin 🖼️ (Character AI): uma oferta cuja única saída é o X encurrala | Só o X no canto | `UnlockAccountModal` | ✅ WP5.5 |
| **Preço regionalizado para o Brasil como prática JUSTA** | Rodada 2, I.5 🎥 | Preço US/EU | — | ⏸️ **Dono (H2)** |

### 4.5 Camada social

| Decisão | Evidência | Alternativa rejeitada | Onde | Estado |
|---|---|---|---|---|
| **Faixas/tiers ANTES do ranking global; acumular nunca rebaixa** | Tim Gabe, *Why Leaderboards Kill Retention* 🎥 📰: placar global "parece impossível de vencer e desmotiva"; **31,3%** relataram efeito psicológico negativo de comparação em ambiente só-leaderboard 📊 | Ranking global cru | `tournamentTiers.ts` | ✅ C.1 #8 |
| **Nenhum componente de métrica reusado do próprio perfil na tela do amigo** | Mobbin 🖼️ (Mimo): não desenhou leaderboard — só reusou o card do perfil, e virou placar. **A comparação emergiu da simetria de componente** | Reusar componentes | Regra 1 do §16.4 — **a única não negociável depois** | ✅ |
| **Exibir GALHO, não altura** ("Forma: Brasa", nunca "estágio 4 de 5") | Mobbin 🖼️: Opal `Owned by 23%` (fato) vs Mimo `Wooden LEAGUE` (escada). Ramificação converte comparação vertical em variedade horizontal | Mostrar estágio numérico do amigo | Regra 3 | ✅ |
| **Só verbos de DAR; nenhuma ação de "ver progresso do amigo"** | Finch 🖼️: `Send Gift` · `Send Good Vibes` — e a ausência de uma quarta | Perfil de desempenho do amigo | Regra 4; `tasksDone` NÃO trafega (proibição #21) | ✅ |
| **Nunca streak social recíproco nem accountability com prazo** | Snapchat 📰; C.2 #21 | Streak entre amigos | — | ✅ |
| **Compartilhar só identidade, nunca posição** | Conflito C.3 #5 | Card com ranking/percentil | — | ✅ |
| **Modo cooperativo: progresso COLETIVO + presença binária ("apareceu hoje")** | Item 4.2 (31,3%) 📊: um grupo que mostrasse contribuição individual reinventaria o leaderboard entre amigos — onde dói MAIS. Cooperação tem evidência mais forte que competição para adesão a hábito 📰. Regra 5 do dossiê: **meta somada, nunca confrontada** | Mostrar quanto cada membro fez | `community.js` `vistaDoGrupo` (invariante de SERVIDOR) | ✅ 07/09/2026 |
| **Sair do grupo é um toque; a meta ENCOLHE junto** | Exigência escrita do item 4.3: "saída limpa, sem penalidade". Senão sair vira sabotagem e o grupo pressiona | Confirmação; meta fixa | `target = members × 5` derivado | ✅ |
| **Entrada só por código de convite** | Grupo achável é raide de estranho; o diretório já respeita consentimento (N-4) | Busca de grupos | `coopJoin` | ✅ |
| **Meta `5 × membros`; sem recompensa; sem gate de Vínculo** | 🧭 dono (08/09/2026). 5 e não 7: exigir dia completo por pressão social desfaz o perdão da Fase 1. Sem recompensa: item exclusivo de grupo obriga quem joga sozinho a arranjar gente | Bits/item por meta batida; gate nível 5 | `COOP_CHECKINS_POR_MEMBRO` | ✅ |
| **Estado da criatura visível socialmente?** | Mobbin §17 Q7 🖼️: criatura abatida na árvore de amigos é acusação pública | — | — | ⏸️ **Em aberto** |

### 4.6 Recompensa e conteúdo

| Decisão | Evidência | Alternativa rejeitada | Onde | Estado |
|---|---|---|---|---|
| **Uma ação, várias barras** (concluir alimenta energia + comida + evolução + missão) | Pokémon GO 📊: um km avança ovo, candy, missão e recompensa semanal ao mesmo tempo | Feedback isolado | Item 4.4 | ✅ |
| **Recompensa variável com TETO, nunca à venda** | Tim Gabe 📰: drop raro ganho jogando = deleite; comprado = loot box | Loot box | `DUNGEON_HEART_DROPS` máx. 2/dia | ✅ |
| **Janela do Torneio em DIAS, nunca horas** | Pokémon GO Community Day 📊 é o motor de retenção; janelas curtas excluem quem trabalha | Eventos de horas | Item 4.1 | ✅ C.2 #18 |
| **A masmorra não cobra da barra de cuidado** | Empilhar punição é o que afunda o Habitica 📰 | Masmorra que custa HP | C.2 #13 | ✅ Fase 1.5 |
| **Glitchtama: máx. 1/dia do JOGADOR** | A conta: 59 runs seguidas comprariam a escada inteira num fim de semana | Sem teto | `GLITCHTAMA_PER_DAY` | ✅ |
| **Brincar NUNCA é condição de dia completo, HP ou evolução** | Regra de ouro do parâmetro (critério B): no instante em que um dos três olhar para `playLog`, a oferta vira obrigação | Brincar obrigatório | `PLANO-TAREFAS` Parte 3 | ✅ |
| **Cansaço é DERIVADO e só cosmético** | Quem aparece cansado é quem trabalhou demais — reduzir a recompensa dele puniria quem mais precisa de acolhimento 🧭 | Barra de cansaço que sobe e desce | idem | ✅ |
| **Aventura da noite: narrativa, sem recompensa material** | Finch 📰: "a recompensa é narrativa, não numérica — **narrativa não satura**". 🧭 dono (08/09/2026) | Bits/item pelo achado — transformaria o relatório num lugar que a pessoa PRECISA abrir | `adventure.ts`; teste trava que o catálogo não ganhe campo de recompensa | ✅ 08/09/2026 |
| **Aventura: o dia mexe na CHANCE, nunca no acesso; nenhum dia volta de mãos vazias** | O relatório do dia ruim é o momento mais frágil do app 🧭. Teste prova que o catálogo inteiro é alcançável por quem só teve dias ruins — a linha que separa isto de um battle pass | Dia ruim sem aventura | `ADVENTURE_ODDS` (nenhuma faixa é zero) | ✅ |
| **Aventura determinística por dia (reabrir não re-sorteia)** | Razão variável 📚 só é saudável se o ATO for previsível e o RESULTADO surpreendente — re-sortear ao reabrir é caça-níquel | Sorteio no `useState` | seed = `dayKey` | ✅ |
| **Diário de aventuras NÃO mostra o que falta nem raridade** | "Painel de pendências é o Habitica" (`PLANO-TAREFAS`); rotular a noite de ontem como "comum" é dizer que valeu pouco 🧭 | Silhuetas do não coletado (como o Dex de Sonhos) | `AdventureDiary` | ✅ |
| **Sonhos sazonais continuam obteníveis fora da estação (peso, não portão)** | A regra que separa estação de battle pass | Exclusividade sazonal | `SEASON_DREAM_WEIGHT`; teste | ✅ |
| **Atividades acopladas a alguma necessidade mesmo depois de comprar tudo** | "Motivational sand traps" (Far Cry 3) 🎥: atividade desconectada vira ruído | — | — | ⏸️ **Eixo D30–D90, o mais fraco do produto** (I.3.5) |

### 4.7 Presença fora do app

| Decisão | Evidência | Alternativa rejeitada | Onde | Estado |
|---|---|---|---|---|
| **Nunca notificação de culpa ou medo; a voz do pet nunca cobra; no widget, no máximo "com saudade"** | Push de culpa é o padrão que os breakdowns condenam 📰 — e que o Duolingo usa com ironia consciente, coisa que o Soulmon **não deve** imitar | "Seu pet está morrendo sem você" | C.2 #17 | ✅ |
| **Widget é "tão eficaz quanto push"** | Finch/Duolingo 📰 | Widget genérico | `DigiWidgetPlugin` | 🔧 personalizar (P0 do guia) |
| **O widget nunca cobra tarefas que o jogo não cobra** | BUG-1 da carga diária: `dailyTotal` cru mostrava `6/9` para quem já tinha cumprido a meta — o cobrador entregue por push passivo | Denominador cru | `useProgressTracking` usa `dailyGoalFor` | ✅ P0 |
| **Celebração que faz PARAR, não acelerar** | Duolingo 🎥: háptico + animação para o usuário saborear, reservada para marcos | Animação decorativa | — | 🔧 P1 do guia |

### 4.8 Telemetria e privacidade

| Decisão | Evidência | Alternativa rejeitada | Onde | Estado |
|---|---|---|---|---|
| **Sem telemetria, tudo é hipótese — construir antes de otimizar** | Rel. 07 📚: a arbitragem mais dura da rodada | Priorizar por opinião | ~20 eventos em `metrics.js` | ✅ construído, ❌ sem usuário para ler |
| **Nunca coletar**: texto de tarefa, `soulGoal`/`soulStruggle`, psicométrico, nascimento, humor individual, e-mail | LGPD; C.2 #25 | — | Teste confere a lista de eventos contra o código | ✅ |
| **Humor NUNCA vira pontuação — mas pode alimentar a FALA** | Emily Greer (GDC) 🎥 sobre métrica isolada; conflito C.3 #4: alimentar fala não é alimentar score | Meta adaptada ao humor — pareceria empatia e faria a pessoa responder o que rende ponto | Teste roda a virada com e sem humor ruim e exige resultado idêntico; `chat.js` lê `moodToday` | ✅ |
| **Tempo de sessão é anti-indicador** | Princípio 7 | DAU/tempo como sucesso | Métrica-farol em `carga-diaria.md` §5 | ✅ |
| **Passos e humor DECLARADOS no Data Safety** | Achado de 08/09/2026: o save leva `steps` e `moodLog` para a nuvem e a política não nomeava nenhum dos dois | Declarar "não há dado de saúde" | `PLAY-DATA-SAFETY.md` §2.6; `privacidade.html` | ✅ |

---

## 5. As decisões de 07–08/09/2026 — a rodada mais recente

Registradas aqui porque **ainda não estão no `GUIA-EXPERIENCIA.md`**, e são as
que mais provavelmente alguém vai querer rediscutir.

| Decisão | Quem | Argumento vencedor | O que teria de ser derrubado para reabrir |
|---|---|---|---|
| **P1 — meta de coração a 60%** | dono | Duas réguas onde havia uma; a excelência intacta (princípio 3) | Mostrar que o mega fazendo 4 de 6 sem perder coração destrói o stake do v-pet — **com dado**, não com intuição |
| **P2 — folga semanal automática** | dono | Inn do Habitica + freeze do Duolingo + Pokémon Sleep; automático porque quem precisou de folga não abriu o app | Mostrar que a folga treina ausência (o achado do 3º escudo do Duolingo, transposto) |
| **P3 — adiada** | dono | Duas leituras incompatíveis; seria o 6º perdão; a pergunta que decide é de fato, não de design | Telemetria de `dailyDone/heartGoal` por estágio |
| **P5 — "dia completo"** | dono | O contador nunca decresce; o NOME era pior que o mecanismo para traço perfeccionista | — (é só nome) |
| **Coop: sem recompensa, meta 5×, sem gate** | dono | As três confirmaram a recomendação | Ver 4.5 |
| **Aventura: só narrativa; chance não acesso; todo dia traz algo** | dono | Finch: narrativa não satura | Ver 4.6 |
| **Conta como primeira tela; idade por checkbox** | dono | Menos dado, mesmo efeito legal; o bloco legal entrou NA tela de conta | Achado jurídico de que checkbox não basta para 18+ no Brasil |
| **Efeito combinado P1+P2 declarado** | — | Um mega pode fazer 4/6 seis dias e 0 no sétimo sem perder coração. **Intencional**: degenerar passa a exigir negligência real. O botão de ajuste é `HEART_GOAL_RATIO`, **não** tirar a folga | Ver P1 |
| **Passos e humor nomeados na política** | — | Estavam saindo do aparelho dentro do save sem constar | — (é correção de fato) |

---

## 6. A crítica mais forte contra o produto — e como a gente responde

Registrada na íntegra em `GUIA-EXPERIENCIA.md` I.1.3 (🎥, Errant Signal / Ian
Bogost / Extra Credits). Está aqui porque **acerta uma mecânica que o Soulmon tem**:

> Gamificação é "colar um motivador extrínseco a uma atividade para induzir as
> pessoas a engajarem por mais tempo"; ao anunciar antecipadamente a recompensa
> por concluir a tarefa, o cérebro reduz a atividade a "**um mero meio para um
> fim**".

No Soulmon, concluir tarefa **dá comida**, que dá energia e atributo que decidem
o galho. É recompensa tangível, esperada e condicional — a configuração que a
literatura de motivação intrínseca aponta como a que corrói.

**Como isto entrou no produto, honestamente:**

1. **Não como remoção.** A comida é o coração do produto; removê-la é outro produto.
2. **Como critério permanente** (critério A da seção 3): toda mecânica nova
   responde *"faz querer a tarefa, ou querer a notificação?"*.
3. **Como o argumento a favor das peças que NÃO são extrínsecas**: o relatório
   que descreve sem julgar, o humor que não vira score, o `soulGoal` devolvido, a
   aventura que é cena e não moeda, o ritmo de cuidado que muda **quem a criatura
   vira**. Essas são a defesa contra a curva de colapso — e são exatamente as que
   o roadmap P0 manda investir.

**A assimetria a favor do Soulmon** (I.1.2): o "evento de extinção" do Duolingo é
sobre 9 milhões de pessoas perderem o apreço por um **número**. O Soulmon não tem
esse número exposto — tem uma **criatura**. Vínculo com criatura não barateia
pela mesma via. Mas também não é imune: *se cuidar não muda nada, some o motivo
de cuidar.*

---

## 7. O que a pesquisa contradisse, e o que continua em aberto

### 7.1 Onde a evidência forte contraria uma regra atual

| Regra atual | Evidência contra | Estado |
|---|---|---|
| `REST_SHIELD_MAX = 3` | Duolingo 🎥 testou: 3 = 2 em ganho, e o 3º **treina ausência** | ⏸️ Experimento (3→2) aguardando telemetria. Não é o mesmo mecanismo (ganho por constância, gasto sozinho), por isso não é correção automática |
| **Oito perdões decididos isoladamente**, agora **dez** (P1, P2) | Duolingo 🎥: "you kind of got to hold the line at some point… it's a one-way door" | ⏸️ **A pergunta estratégica sem resposta: o que ainda dói perder no Soulmon?** Hoje, honestamente: quase nada além da criatura. A P3 foi adiada em parte por isso |

### 7.2 O que os relatórios não cobriram

- **ASO e aquisição paga** — nenhum relatório. Descoberta é orgânica por padrão.
- **Som e música** — ausente, e é alavanca conhecida de vínculo.
- **QA com usuários reais** — só como recomendação. O único dado real de usuário
  é o teste do dono que originou `carga-diaria.md`.
- **Android e desktop no Mobbin** — o MCP só tem iOS e web. O overlay de desktop
  (decisão 3: "a criatura É o overlay") não tem levantamento.
- **Celebração não-bloqueante** — dois passes no Mobbin não acharam nada.

### 7.3 As perguntas abertas do dossiê Mobbin (§17), e o que mudou

| # | Pergunta | Estado em 08/09/2026 |
|---|---|---|
| 1 | A criatura grátis também ramifica? | Em aberto |
| 2 | Como sinalizar que os 20 itens foram usados, se o resultado é invisível? | Em aberto — **custo sem retorno percebido** |
| 3 | Área mínima e repouso do overlay de desktop | Em aberto — sem fonte |
| 4 | Piso de evolução para oferecer compartilhamento | Em aberto |
| 5 | A tela de amigos escala além de ~5? | Em aberto (limite de 5 amigos hoje adia o problema) |
| 6 | `Buddy up` cria pressão? "A falha de um pode decepcionar o outro" | **Respondida pelo desenho do coop**: presença binária, meta somada, saída de um toque, meta que encolhe — nada expõe a falha de alguém |
| 7 | O ESTADO da criatura é visível socialmente? | Em aberto — a decisão 8b resolveu o estágio, não o estado |
| 8 | Celebração não-bloqueante | Em aberto — limite do acervo |

### 7.4 Recomendações do guia ainda não executadas

- **I.3.1** Prestígio cosmético por não usar escudo (o *Perfect Streak* dourado) — é a resposta direta ao "o que ainda dói perder".
- **I.3.2** Trocar `Continuar` por `Assumir a meta` no check-in (Duolingo: +10.000 DAU só de copy 🎥).
- **I.3.3** Celebração que interrompe nos marcos 7/21/66.
- **Card mensal compartilhável** (lição 18 do rel. 01) — o único crescimento orgânico compatível com a essência.
- **Checklist D0** da primeira sessão (lição 21).

---

## 8. Como usar este documento para rever uma decisão

Quando alguém quiser mudar algo que está aqui:

1. **Encontre a linha.** Se não está aqui, não foi decidido com argumento — pode
   ser discutido do zero.
2. **Leia a alternativa rejeitada.** Na maior parte dos casos, o que se quer
   propor já foi a alternativa que perdeu. Se for, a pergunta não é "por que não
   fazemos X?", é **"o que mudou desde que X perdeu?"**.
3. **Confira o nível de evidência.** Uma regra sustentada por 🎥 ou 📚 precisa de
   evidência do mesmo nível para cair. Uma regra 🧭 pode cair por decisão do dono
   — mas registre aqui a nova, com a mesma honestidade.
4. **Verifique o gatilho.** Várias linhas dizem *"reconsiderar se…"* (conversão
   < 1%, funil perdendo >30%, telemetria por estágio). Se o gatilho não
   disparou, a decisão está de pé.
5. **Se mudar, mude os três lugares:** o código, o teste que trava a regra, e
   esta linha. Doc que diz ✅ sobre regra que não existe mais é pior que doc
   ausente (`CLAUDE.md`).

E a pergunta que fecha toda revisão, a mesma que abriu o projeto:

> *Isso faz o bichinho parecer mais um companheiro, ou mais um chefe?*
