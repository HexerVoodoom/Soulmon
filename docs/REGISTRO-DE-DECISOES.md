# Registro de decisões — o que a pesquisa disse, o que fizemos com isso, e como saberemos se erramos

> **Para que serve.** Consolidar, num lugar só, cada escolha de produto do Soulmon
> ao lado da evidência que a sustentou, da alternativa que perdeu e — a parte que
> mais importa — **do que provaria que a escolha está errada**.
>
> Existe para três coisas:
>
> 1. **Não rediscutir** o que já foi decidido com argumento. Quem quiser reabrir
>    uma decisão encontra aqui o que teria de derrubar primeiro.
> 2. **Rever com honestidade** quando houver telemetria: a §7 transforma cada
>    aposta grande numa hipótese com número e instrumento.
> 3. **Saber onde estamos expostos**: a §8 lista as decisões que não têm evidência
>    nenhuma além da nossa própria tese.
>
> **Nada aqui é dado do Soulmon.** Ninguém nunca usou o app em produção
> (`docs/STATUS.md`). Toda afirmação sobre "o usuário" é hipótese informada por
> terceiros. Este documento não esconde isso — ele marca linha por linha.
>
> **Consolidado em 08/09/2026.** As fontes primárias continuam sendo os arquivos
> citados; este registro aponta para eles em vez de reescrevê-los.

### Como ler o nível de evidência

| Marca | Significado | Peso |
|---|---|---|
| 🎥 | *via transcrição* — a fala dentro do vídeo, executada no NotebookLM (`08-transcricoes-notebooklm.md`) | **O mais forte.** É a única categoria que pode DERRUBAR uma recomendação anterior |
| 📚 | literatura com autor e ano (Lally, Gollwitzer, Marlatt, Polivy & Herman, Dai/Milkman/Riis, Nunes & Drèze, Masicampo & Baumeister, Deci & Ryan, Neff, Fogg) | Forte, mas quase toda de fora do nosso contexto (app, público, idioma) |
| 📊 | número de mercado com fonte e data (receita, retenção, ARR, conversão) | Forte para calibrar expectativa; fraco para prever ESTE app |
| 🖼️ | tela real lida no Mobbin (`09-mobbin-dossie.md` — 27 buscas, ~90 achados) | Forte sobre **forma**; diz o que o mercado faz, não se funciona |
| 📰 | título de vídeo + fonte secundária (a rodada 1 não conseguia ler transcrição) | Fraco. Sempre que houver 🎥 sobre o mesmo tema, o 🎥 manda |
| 🧭 | decisão de tese — não há estudo, há a essência declarada do produto | **Sem apoio externo.** É onde estamos mais expostos (ver §8) |

---

## 0. Índice

| § | Conteúdo |
|---|---|
| **1** | A tese, e o eixo que organizou tudo |
| **2** | As fontes, e o que cada uma pode e não pode afirmar |
| **3** | Os princípios permanentes, e os quatro critérios que nasceram depois |
| **4** | Por que o vínculo funciona — o mecanismo, e os públicos que ele protege |
| **5** | Registro de decisões, por tema (4 subseções × 8 temas) |
| **6** | As decisões de 07–08/09/2026 |
| **7** | **Falseabilidade** — as 12 apostas, com número e instrumento |
| **8** | Mapa de exposição — onde não temos evidência nenhuma |
| **9** | A crítica mais forte contra o produto |
| **10** | O que a pesquisa contradisse, e o que continua em aberto |
| **11** | Como usar este documento para rever uma decisão |

---

## 1. A tese, e o eixo que organizou tudo

> **O Soulmon é um avatar do usuário que evolui junto com ele e o encoraja —
> nunca um cobrador.** (`docs/PLANO-EVOLUCAO.md`)

Toda decisão passa por uma pergunta: *isso faz o bichinho parecer mais um
companheiro, ou mais um chefe?* O que faz parecer chefe foi cortado ou invertido,
**mesmo quando "engajaria" mais**.

O eixo que organizou a pesquisa inteira foi **como cada produto trata a falha**:

| Produto | Ao falhar | Resultado | Ev. |
|---|---|---|---|
| Pokémon Sleep | você **não ganha**; nunca perde | US$ 234,9M em 3 anos, queda de só 3,2% no ano 3 | 📊 |
| V-Pet Digimon (1997) | erros **selecionam outro galho** de evolução | ~14M de unidades; a linha fiel segue até 2027 | 📊 |
| Vital Bracelet | **estagna** ou cresce em algo indesejado | apps encerrados, servidores offline em 2024 | 📊 |
| Pokémon GO | gentil no físico, **punitivo nos streaks** | 20M ativos/semana, mas 2 crises graves de acessibilidade | 📊 |
| Tamagotchi original | **morria** em <12h sem pausa | apego **e** abandono em massa. O criador Akihiro Yokoi projetou a dor de propósito, achando que bicho real "só é fofo 20–30% do tempo" | 🎥 |
| Finch | pássaro **nunca morre, nunca cobra** | ~US$ 30M ARR sem VC; D1 ~54% / D7 ~37%; elogio nº 1: "não me faz sentir culpado" | 📊 📰 |
| Habitica | Dailies não feitas dão **dano de HP** | o contra-exemplo canônico: usuários relatam gastar mais tempo administrando o app que os hábitos | 📰 |
| Forest | árvore morre se você sair do app | **perda aceitável** — o usuário escolhe apostar a cada sessão | 📰 |
| Snapchat | Snapstreak **recíproco** | caso-limite abusivo: ansiedade documentada em adolescentes, gente entregando senha para o amigo manter o streak nas férias | 📰 |
| **Soulmon (antes da Fase 1)** | **perdia HP**, podia zerar e degenerar num dia | — | — |

**A conclusão que virou o produto:** um app de produtividade que castiga quem está
mal está desenhado para funcionar melhor com quem menos precisa dele — porque
quem não cumpre as tarefas é justamente quem está doente, deprimido ou em crise.

**O benchmark correto do Soulmon não é o Duolingo. É o Finch.** O Duolingo
monetiza a fricção que ele mesmo cria (corações infinitos pagos); o Finch chegou a
~US$ 30M ARR **sem VC** com paywall suave, free tier generoso e pago
majoritariamente cosmético (`06-paywall-monetizacao.md`).

---

## 2. As fontes, e o que cada uma pode e não pode afirmar

| Fonte | O que é | Força | Limite declarado |
|---|---|---|---|
| `docs/PLANO-EVOLUCAO.md` | Benchmark de ago/2026: Habitica, Finch, Catzy, Forest, Tamagotchis modernos, V-Pet → Vital Bracelet, Pokémon Sleep/GO, Palworld + SDT, Octalysis, Fogg, loot boxes | 📊 📰 | Escrito **antes** das transcrições; parte vem de título + artigo |
| `docs/PLANO-TAREFAS.md` | Benchmark de **25+ produtos** de tarefa/hábito (Todoist, Things 3, TickTick, Sunsama, Motion, Structured, Reclaim, Akiflow, Atoms, Streaks…) + a literatura comportamental | 📚 📰 | É onde está a ciência de verdade: Lally, Gollwitzer, Zeigarnik |
| `docs/GUIA-EXPERIENCIA.md` | Síntese de **7 relatórios** + **rodada 2** com 16 perguntas executadas no NotebookLM sobre transcrições reais | 🎥 📚 📊 | A rodada 1 **não lia transcrição** (IP bloqueado). A rodada 2 é a única que pode derrubar a 1 |
| `guia-experiencia/01-youtube-mobbin-timgabe.md` | Tim Gabe (500+ apps gamificados, leaderboards, onboarding paradox) + o método Mobbin | 📰 | ⚠️ **Correção de autoria (01/09/2026)**: 5 vídeos estavam no canal errado; **nenhum** vídeo citado é do canal `@mobbindesign`. Verificado via oEmbed. É o lembrete permanente de que a fonte precisa ser checada, não citada |
| `guia-experiencia/02-tamagotchi-effect` | Psicologia do vínculo: Tamagotchi effect, ELIZA, autocompaixão por procuração, SDT, Fogg; **e a seção de públicos vulneráveis** | 📚 | Literatura de fora do app |
| `guia-experiencia/03-gamificacao-streaks` | Octalysis, SDT, Hooked, violação de abstinência; benchmarks Duolingo/Finch/Forest/Snapchat | 📚 📰 | — |
| `guia-experiencia/04-monster-taming` | V-Pet 97, Pokémon (starter/dex/shiny), Monster Rancher, Temtem, Cassette Beasts, Palworld | 📰 | Análise de gênero, não de mercado |
| `guia-experiencia/05-onboarding` · `06-paywall` · `07-retencao` | Funil, benchmarks de conversão/retenção com fonte e data, mapa de churn, plano de telemetria | 📊 | O 07 abre dizendo que **sem telemetria tudo é hipótese** — e isso vale para os outros seis |
| `guia-experiencia/09-mobbin-dossie.md` | **27 buscas**, ~90 telas lidas, 13 dossiês, 8 decisões de arquitetura | 🖼️ | Só iOS e web. **Sem Android, sem desktop**, sem estados transitórios, sem data de captura |
| `product/soulmon-01/balance/carga-diaria.md` | 6 bugs + 5 propostas de balanceamento + pesquisa em 4 eixos | 📰 | Nasceu de **UM** teste com usuário do dono ("nem todo dia consigo fazer as 6") — é o único dado de usuário real que o projeto tem |
| `docs/PLANO-COOP.md` | O modo cooperativo, derivado do item 4.2 | 📊 🧭 | — |

**Regra que o próprio guia impõe a si mesmo:** `via transcrição` vence `título +
artigo`, que vence `conhecimento consolidado`. Quando duas fontes discordam, a
mais forte manda — e a discordância fica registrada (§10).

---

## 3. Os princípios permanentes

Sete fronteiras que a pesquisa validou externamente (`PLANO-EVOLUCAO.md`). **Não
afrouxar.**

| # | Princípio | De onde veio | Onde mora no código |
|---|---|---|---|
| 1 | **Dinheiro compra conveniência, cosmético e identidade — nunca o comportamento nem o perdão dele** | A Bandai gateou linhagens de evolução com Dim Cards pagos e pagou com o produto 📊 | `utils/currencies.ts` (3 moedas com fronteira travada por teste); `Bits → Créditos` proibido |
| 2 | **Nada de conteúdo aleatório vendido.** Drops se ganham jogando; a loja vende item determinado | A linha que separa "variável que deleita" de "variável que vicia" 📰; Lei 15.211/2025 (ECA Digital) em vigor | Glitchtama nunca vendido; `DUNGEON_HEART_DROPS` com teto |
| 3 | **Modernizar o atrito, nunca a dificuldade** | Os fãs premiaram no Digimon COLOR USB-C, backup e treino rápido — **zero afrouxamento** das condições de evolução 📊 | É o critério que separou P1 (perdão no coração) de "afrouxar o dia completo" |
| 4 | **O jogo continua íntegro com o backend morto** | Vital Bracelet: servidores offline em 2024, apps mortos 📊 | A regra do `?? padrão` no load; nenhuma progressão exige rede |
| 5 | **Regras explicadas, resultados surpreendentes** | V-Pet: diga que existem galhos e o que os influencia; não entregue a tabela. **É a condição para o Oráculo não virar gacha caro** (§4) | A árvore de 11 formas é visível; os thresholds não |
| 6 | **O sinal do Soulmon é declarado, não inferido** | O sensor óptico do Vital Bracelet **falha em pele mais escura** 📊 — "o usuário marcou" não tem erro de sensor nem discrimina corpo | Ver a qualificação D abaixo |
| 7 | **"Passou muito tempo no app" é antipadrão** | Sessões curtas por meses; os tetos (5 comidas/h, 1 coração/dia de carinho) impedem consumir o app em 30h | É o motivo de os tetos **não** serem afrouxados quando o app "parece vazio" |

### Os quatro critérios que nasceram depois

**A. O teste do "exploitationware"** (§9, 🎥). Toda mecânica nova de recompensa
responde antes de entrar: *"isto faz a pessoa querer fazer a tarefa, ou querer a
notificação?"*.

**B. A regra de ouro do parâmetro** (`PLANO-TAREFAS.md`, Parte 3):

> Um parâmetro novo só entra se **ou for alimentado por uma tarefa real cumprida,
> ou gastar um recurso que veio de tarefa real**. Medidor que sobe e desce sozinho
> com o tempo é cobrança desacoplada da vida real — e neste app a vida real é o jogo.

Brincar passa (gasta energia que veio de tarefa). Cansaço passa (é derivado, não
medido). Uma barra de diversão que decai com o relógio **não passa**.

**C. Meta que cede, nunca que aperta.** Adaptar para baixo pode ser discutido;
adaptar para cima é a esteira do Vital Bracelet, que fez os donos pararem nos
estágios médios. *Um jogador nunca pode ser punido por ter tido uma boa semana.*

**D. A qualificação do Princípio 6** (`PLANO-TAREFAS.md`, Parte 3):

> **Declarado pontua. Inferido confirma e enriquece. Nunca o inverso.**

O princípio original dizia "não importar sinais inferidos". A Fase 4a trouxe o
contador de passos e a régua ficou mais precisa: o sensor **nunca pontua sozinho**
— só confirma o que a pessoa já marcou, ou vira conteúdo opcional com teto. Quem
não tem sensor não fica em desvantagem estrutural. É evolução registrada do
princípio, não quebra.

### As 5 regras destiladas sobre perda (`03-gamificacao-streaks.md` §1.3)

Vale transcrever, porque são o filtro mais operacional que a pesquisa produziu:

1. Perda só sobre **recurso recuperável e voluntariamente apostado** (run da masmorra, aposta do Forest) — **nunca** sobre identidade, coleção ou progresso.
2. Proteção contra falha **por padrão**, nunca opt-in.
3. Contador que **acumula** retém; contador que **zera** produz violação de abstinência.
4. Recompensa variável no **cosmético/narrativo**, determinística no **essencial**.
5. Prestígio **visual** captura o orgulho do streak sem o custo psicológico.

> A regra 5 é a única das cinco que o Soulmon **ainda não implementou** — é o
> *Perfect Streak* dourado do Duolingo, e é a resposta direta à pergunta em aberto
> "o que ainda dói perder?" (§10.1).

---

## 4. Por que o vínculo funciona — o mecanismo, e os públicos que ele protege

Esta seção não gera decisões diretas; ela explica **por que** as decisões da §5
são as que são. Sem ela, várias regras parecem escrúpulo gratuito.

### 4.1 Os oito mecanismos (`02-tamagotchi-effect-psicologia.md`) 📚

1. **Tamagotchi effect** — o apego vem do ato de **cuidar**. O ingrediente ativo não é o realismo da criatura, é a **responsabilidade percebida**.
2. **Antropomorfismo** — disparado por comportamento **contingente**: a coisa reage a mim. *Reação específica > reação genérica.*
3. **ELIZA effect** — com linguagem, o efeito é muito mais forte; o motor é a projeção da pessoa, não a sofisticação do sistema. **O pet do Soulmon fala** — é o amplificador de vínculo mais potente do app, e o de maior responsabilidade ética.
4. **Caregiving como fonte de bem-estar** — cuidar de algo que depende de você é gratificante em si (Paro, AIBO — cujos donos fizeram funerais quando a Sony encerrou o suporte).
5. **Autocompaixão por procuração** — a alavanca terapêutica do gênero: quem não consegue se tratar com gentileza consegue tratar o bichinho com gentileza; como a criatura é espelho, o cuidado volta.
6. **Identidade e história** — apego cresce com singularidade ("é MEU"), memória e trajetória causada pelas minhas escolhas.
7. **SDT (Deci & Ryan)** — autonomia (eu escolho a meta, o pet não manda), competência (progresso visível e alcançável), relacionamento. **Dark patterns funcionam justamente frustrando esses três eixos.**
8. **Fogg (B=MAP)** — o pet é *prompt* quente; mas prompt sem habilidade (tarefa grande demais) gera frustração — daí o "hoje, só 5 minutos?".

### 4.2 O que QUEBRA o vínculo — e a distinção que decide tudo

> **Culpa motiva reparação. Vergonha motiva fuga.**

Se a criatura **é** a alma do usuário, criatura sofrendo não se lê como "falhei
numa tarefa" — se lê como **"eu sou ruim"**. E vergonha não faz ninguém melhorar:
faz desinstalar. É por isso que a proibição de punição no Soulmon é mais forte que
em qualquer app de hábito comum: **aqui o objeto punido é a representação da
pessoa.**

Os outros quebradores: punição no lapso já ocorrido · cobrança no retorno ·
notificação manipuladora · monetização atravessando o afeto (pagar para o pet não
sofrer = **resgate**) · perda de identidade/progresso · **superjustificação**
(recompensa externa por hábito já desejado corrói o motivo original).

### 4.3 Os quatro públicos que o desenho protege — e como

Isto é restrição de projeto, não sensibilidade: são as pessoas que o app existe
para servir, e que qualquer punição atinge primeiro.

| Público | O que devasta | Mitigação no produto |
|---|---|---|
| **TDAH** | punição por inconsistência | perdão embutido; versão reduzida da tarefa (`MISS_INTERVENTION_AT`); "dia completo" no lugar de "perfeito" |
| **Ansiedade** | timers e perda visível de HP | tetos; `hideMetrics` na Janela de Descanso |
| **Depressão** | dias em que a meta é inatingível | perdão de ausência; carinho como cura sempre disponível e grátis |
| **Luto por pet virtual** | o apego é genuíno (AIBO teve funerais) | degeneração **sempre reversível** e **nunca** chamada de morte |

### 4.4 O que o gênero ensinou (`04-monster-taming.md`)

- **V-Pet 97**: o jogo não pergunta "você venceu?", pergunta **"como você cuidou?"**. E a joia: um Numemon (a "forma-castigo") cuidado perfeitamente vira Monzaemon — **uma rota de redenção embutida no castigo**. Além disso, *care mistakes* **zeram na evolução**: cada estágio é uma página nova, o passado não persegue. ⚠️ *O Soulmon absorveu o seletor (`carePattern.ts`) mas ainda não a narrativa de redenção visível.*
- **Monster Rancher**: a mágica não era o algoritmo, era a **origem** — o monstro nascia do *seu* CD. O Oráculo é o Monster Rancher da identidade: substitui o CD pela própria pessoa. **A condição para funcionar é o Princípio 5**: se a criatura não parecer dizer algo sobre a pessoa, vira gacha caro.
- **Shiny (Pokémon)**: raridade **puramente cosmética**, zero poder. É o único modelo de raridade compatível com a essência.
- **Temtem** (lição negativa): 100% capturáveis por todos → **paridade total apaga o "meu"**.
- **Palworld** (contraexemplo): vínculo por **utilidade** — retenção alta, afeto raso ("caixa de ferramentas com carinha"). O único transplante são as **animações idle**: Pals dormindo e tropeçando criam afeto barato.

---

## 5. Registro de decisões, por tema

Formato: **decisão** · evidência · **alternativa que perdeu, e por quê** · onde está · estado.

### 5.1 Falha e perdão

| Decisão | Evidência | Alternativa rejeitada | Onde | Estado |
|---|---|---|---|---|
| **Teto de 1 coração por dia** | Um dia ruim é um sinal, não uma sentença 📊 | Perda proporcional sem teto (o Soulmon original): zerava e degenerava num dia | `MAX_HEARTS_LOST_PER_DAY` | ✅ Fase 1 |
| **Ausência ≥ 2 dias não cobra nada** | Finch 📰; *what-the-hell effect* (Polivy & Herman) e violação de abstinência (Marlatt) 📚: cobrar no retorno dispara abandono total | Cobrar retroativamente os dias perdidos (Habitica) | `ABSENCE_FORGIVENESS_DAYS`, `welcomeBack` | ✅ Fase 1 |
| **Segunda-feira devolve 0,5 coração** | *Fresh start effect* (Dai, Milkman & Riis) 📚: segunda, dia 1 e aniversários "relegam as imperfeições ao período anterior" | Nada na virada de semana | `WEEKLY_RELIEF_HEARTS` | ✅ Fase 1 |
| **`perfectDays` só acumula, nunca zera** | Lally et al. 2010 📚: pular UM dia **não prejudicou mensuravelmente** a automaticidade — *a ciência autoriza o perdão*. "Forced Play / Punição por Inatividade" é dark pattern **nomeado** (Extra Credits 🎥). Streak clássico é **puro Black Hat core drive 8** no Octalysis 📚 | Streak visível de dias consecutivos — "a alavanca de retenção mais forte que existe" (a própria Duolingo 📰), e funciona por **aversão à perda**, que a essência recusa como motor | Travado por teste | ✅ |
| **Constância "N das últimas 7"** | Uma falha custa ~14%, não 100% | Contador por hábito que zera | `habitRhythm.ts`, `CONSTANCY_WINDOW_DAYS` | ✅ |
| **Escudos consumidos AUTOMATICAMENTE** | Duolingo 🎥: dar 2 freezes **equipados por padrão** foi "holy smokes" de ganho. Quem acabou de perder o dia, por definição, não está no app para ir comprar proteção | Escudo que a pessoa precisa lembrar de ativar (a Pousada do Habitica) | `applyMissedDay` | ✅ |
| **Estoque de escudos INVISÍVEL** | Mobbin 🖼️: sete apps com a mesma mecânica, e a diferença toda é a exibição — `1 Streak Freeze` (positivo) vs `Streak saves 0` / `NO STREAK FREEZE` (negativo, em caixa alta). Não expor o estoque **evita o único modo de falha da mecânica** | Mostrar "você tem 2 escudos" | Decisão 4 do dossiê | ✅ |
| **`REST_SHIELD_MAX = 3`** | ⚠️ Duolingo 🎥: "**three streak freezes was no better than two**… we were training them to take more time off" | — | `taskModel.ts` | ⏸️ **Em aberto (H0)**. Ver §7, aposta 2 |
| **"Never miss twice" + versão reduzida** | Atoms/James Clear 📚; Finch 📰. Fogg: prompt sem habilidade gera frustração 📚 | Dano de HP na segunda falha | `MISS_INTERVENTION_AT = 2` | ✅ |
| **Meta de coração = 60% da meta do dia (P1)** | Habitica separa *Dailies* (machuca) de *Habits* (não machuca) 📰; o Soulmon tinha os dois eixos num número só. Princípio 3: a excelência continua custando a meta inteira | Afrouxar a meta do **dia completo** — quebraria o princípio 3 e cederia o caminho de evolução | `heartGoalFor`; `heartGoal.test.ts` trava que o desconto NÃO vaza para `dayWasPerfect` | ✅ 07/09 |
| **Folga semanal automática e retroativa (P2)** | Habitica *Rest in the Inn* 📰: sai a punição, fica a recompensa — "descansar não é sair do jogo". Duolingo 📰: proteção no bolso ANTES de precisar | "Modo férias" com datas — é planejamento, e planejamento é a fricção da queixa nº 2 | `REST_DAYS_PER_WEEK`; `restDay.test.ts` | ✅ 07/09 |
| **A folga é ANUNCIADA (ao contrário do escudo)** | 🧭 Perdão que a pessoa não soube que recebeu faz a cobrança da semana seguinte parecer arbitrária | Gastar em silêncio | `restDayUsed` no relatório | ✅ |
| **Chave da semana por aritmética de CALENDÁRIO** | Achado da sessão de QA (`4be07ee9`): `getTime() − n·86400000` caía no domingo anterior na virada do horário de verão — folga extra de graça, 1×/ano, em todo fuso com DST. Invisível no Brasil, que não tem mais DST | `new Date(ano, mês, dia − n)` | `restWeekKeyFor`; teste roda 400 dias em 4 fusos | ✅ corrigido |
| **Alívio adaptativo (P3)** | — | — | — | ⏸️ **Adiada**. Duas leituras incompatíveis; seria o 6º perdão empilhado; a pergunta que decide é de fato, não de design |
| **Degeneração nunca se chama "morte"; sempre reversível, nunca por pagamento** | Tamagotchi original 🎥: morte em <12h deu apego **e** abandono em massa. Luto por pet virtual é genuíno (AIBO) 📚 | "Seu pet morreu" | — | ✅ |

### 5.2 Hábitos, tarefas e planejamento

| Decisão | Evidência | Alternativa rejeitada | Onde | Estado |
|---|---|---|---|---|
| **Otimizar o PLANEJAR, não o marcar o check** | Masicampo & Baumeister 📚: a tensão da tarefa inacabada é aliviada por **fazer um plano**, não por concluí-la. Gollwitzer 📚: tarefa com *quando e onde* tem execução categoricamente maior | Otimizar o check (Todoist Karma, Duolingo) produz **gaming**: tarefa trivial só para pontuar, lição mínima só para o streak | Todo o motor | ✅ |
| **Recorrência contada da CONCLUSÃO** | Todoist `every! 3 days` 📰: impede acúmulo de instâncias atrasadas — **a causa nº 1 documentada de abandono** de app de tarefas | Contar do calendário | `everyNDays`, `from: 'completion'` | ✅ |
| **"3× por semana"** | Streaks 📰: frequência flexível existe porque agenda rígida quebra quando trabalho e família invadem | Só dias fixos | `timesPerWeek` | ✅ |
| **Esforço 1–3; recompensa escala com esforço, NUNCA com contagem** | O defeito exato do Karma do Todoist, crítica nº 1 àquele sistema 📰 | Recompensa por item | `dailyGoal.contract.test.ts` | ✅ |
| **"Quando" separado de "Prazo"** | Things 3 📰: prazo não é plano; escolher quando começar é implementation intention embutida | Prazo que polui o Hoje | `startDate` vs `deadline` | ✅ |
| **"Deixar pra lá" como estado terminal digno** | TickTick *Won't Do* 📰; Things *Someday* inerte 📰. Sem saída digna, o mercado sofre **falência periódica** (apagar tudo e recomeçar) | Deletar (perde contexto) ou mentir que fez | `TaskStatus` | ✅ |
| **Contador de adiamentos visível; intervenção em 3** | Sunsama 📰: torna evitação crônica um dado, não um sentimento | Adiar em silêncio para sempre | `POSTPONE_NUDGE_AT` | ✅ |
| **Marcos em 7 / 21 / 66 dias** | Lally et al. 📚: mediana de **66 dias**, faixa 18–254. **O "21 dias" é mito** — vem de Maxwell Maltz (1960), sobre pacientes de cirurgia plástica | 21 dias | `HABIT_MILESTONES` | ✅ |
| **Hábito novo nasce em ratio 1 (progresso dotado)** | Nunes & Drèze 📚; Catan dá a todos 2 dos 10 pontos (GDC 🎥) | Começar em 0% | `habitRhythm.ts` | ✅ |
| **Carga do dia é AVISO, nunca bloqueio** | *The Freedom Fallacy* 🎥: autonomia é **volição**, não liberdade irrestrita — estrutura satisfaz autonomia melhor que ausência de direção | Bloquear criação acima do teto | `isOvercommitted` | ✅ |
| **Âncora ("depois do café, na cozinha")** | Gollwitzer 📚 — a intervenção de custo zero com maior efeito medido na literatura; é o formulário do Atoms | Só horário de alarme | `HabitAnchor` | ✅ |
| **Presets de 1 toque + "Equilibrar minha semana" (P4)** | Pesquisa **negativa e útil**: ninguém planeja a semana num app de hábito; quem tenta, desiste. Planejamento tem de ser subproduto de 1 toque | Um planejador semanal | `ROUTINE_PRESETS`, `weekBalance.ts` | ✅ 07/09 |
| **Quick Add de uma linha, na tela inicial** | Akiflow/Todoist 📰: fricção de captura decide se o sistema sobrevive à segunda semana | Captura em 3 telas | `quickAdd.ts`, `QuickAddBar` | ✅ 08/09 |
| **Reduzir o `cap` para "proteger" quem cadastra demais** | — | **Recusado**: cadastrar muito é saudável; `min(cadastradas, requisito)` já neutraliza. O problema era o app **mostrar** que penalizava (BUG-1), não o usuário | — | ❌ |

### 5.3 Onboarding, identidade e o Oráculo

| Decisão | Evidência | Alternativa rejeitada | Onde | Estado |
|---|---|---|---|---|
| **Cada pergunta muda a experiência visivelmente** | Tim Gabe, *Onboarding Paradox* 📰: pedir só o que muda a experiência imediata, e transformar as perguntas em **parte do produto**, não formulário | Formulário de cadastro | As 6 perguntas geram a criatura; `soulGoal` volta no relatório | ✅ |
| **Valor antes de cadastro (gradual engagement)** | Duolingo dá a 1ª lição antes de pedir e-mail 🖼️ 📰 | Cadastro na porta | O ritual do Oráculo **é** a primeira lição | ✅ (⚠️ tensionado — ver 5.3, conta na 1ª tela) |
| **Criatura comum grátis; criatura própria paga** | Decisão 1 do dossiê 🖼️ | Paywall antes de qualquer criatura | `demoCharacterId` | ✅ |
| **Neutro por nome próprio, sem gênero declarado** | Decisão 2 🖼️. **Custo declarado**: exige disciplina de redação permanente — nenhuma copy sobre a criatura pode usar adjetivo concordado. Em PT-BR isso é requisito estrutural de localização, não estética | Declarar `She/Her` como o Finch | Toda a copy | ✅ |
| **Psicométrico INVISÍVEL — só alimenta a criatura** | Decisão 6 🖼️ | Mostrar perfil de personalidade | `oracle.ts` | ✅ — ⚠️ criou o **Problema 1** do dossiê: 20 telas de custo, retorno invisível. Solução mapeada (Speak `What I heard`, Lovi, Noom): *"invisível" tem de significar "não devolve diagnóstico", não "não dá sinal nenhum"*. **Em aberto** |
| **A criatura é ESPÉCIE, não personagem** | frogMak 🎥: traços humanos rígidos **impedem a pessoa de projetar a própria história** | Descrição com personalidade fechada | A descrição diz **de onde veio**, não **como se comporta** | ✅ calibração |
| **Não cobrar no reveal; value moment = 1º dia completo** | Conflito C.3 #1: rel. 01 pedia paywall no reveal (padrão Noom "seu plano está pronto"); rel. 05/06 diziam não. Paywall após value moment = **2,1× mais trial starts** 📊 | Paywall no reveal | `UnlockNudge` com `reason: 'report'` | ✅ — **gatilho para reconsiderar: conversão < 1%** |
| **Manter a bifurcação teste longo → reveal; medir antes de reordenar** | Conflito C.3 #6 | Reveal antes do teste | `onboarding_long_test` | ✅ — **gatilho: se o teste de 20 itens matar >30% do funil, reordenar vira P0** |
| **Conta é a PRIMEIRA tela** | 🧭 dono (07/09). O argumento técnico contra (D-07: consentimento antes de dado pessoal) estava **certo no diagnóstico e errado na conclusão** — a saída foi trazer o bloco legal para DENTRO da tela de conta | Identidade depois do consentimento | `IDENTITY_STEP` | ✅ ⚠️ **tensiona o "valor antes de cadastro"** — ver §7, aposta 9 |
| **Idade por CAIXA de declaração** | 🧭 dono: "deixe que o Google verifique, ou no máximo um checkbox". Menos dado pessoal para o mesmo efeito legal | Campo de mês/ano de nascimento | `consent.ts` | ✅ 07/09 |

### 5.4 Monetização

| Decisão | Evidência | Alternativa rejeitada | Onde | Estado |
|---|---|---|---|---|
| **Nunca vender**: evolução, `perfectDays`, HP irrestrito, escudos, conclusão de tarefa, "pular o dia", vantagem em PvP, Glitchtama. **Nunca ads intersticiais** | Princípio 1; crítica ao Premium Pass do Pokémon Sleep 📰 | — | C.2 #14 | ✅ |
| **Nunca vender proteção contra punição** | Vender proteção cria **incentivo comercial para a punição existir** — o conflito de interesse estrutural do Duolingo, que monetiza a fricção que ele mesmo cria 🎥 📰 | Streak freeze pago | C.2 #15 | ✅ |
| **Cura instantânea por Créditos: REMOVIDA** | É pagar para pular o cuidado — e, pior, **resgate**: pagar para o pet não sofrer atravessa o afeto (§4.2) 📚 | Manter, ou limitar a 1/semana | `monetization.ts` | ✅ resolvido |
| **Reroll: aleatoriedade com seed derivada + tela dizendo que todo resultado é equivalente** | Lei 15.211/2025 em vigor desde 17/03/2026; condenação de R$ 333M em jun/2026; Pokémon GO teve incubadoras removidas no Brasil 📊. Atenuante: todo pet é **mecanicamente equivalente** — é identidade, não poder (o modelo *shiny*) | `Math.random()` puro; ou remover | `oracle.ts` (`mulberry32`) | ✅ resolvido |
| **Vender o resultado, não a feature** | Cravotta, *100 Paywalls* 📰: benefícios concretos, âncora simples, botão de fechar presente mas discreto | Lista de features técnicas | `UnlockAccountModal` | ✅ |
| **A recusa sempre tem saída** | Tim Gabe sobre dead-ends 📰; caso `24870bf7` do próprio repo | Recusa seca | 3 lugares | ✅ |
| **"Agora não" com a mesma largura do primário** | Mobbin 🖼️: uma oferta cuja única saída é o X **encurrala** | Só o X no canto | `UnlockAccountModal` | ✅ |
| **Assinatura recorrente** | Compra única **não cobre custo recorrente de IA**, que escala com DAU. Freemium D60 ~US$ 0,38 vs hard paywall US$ 3,09 📊 — não para virar hard paywall, mas para medir o custo da invisibilidade | — | — | ⏸️ **Dono (H1)**. Admissível com 3 travas: nada de progresso; cancelar não remove nada; conteúdo = IA + cosmético |
| **Preço regionalizado para o Brasil como prática JUSTA** | Rodada 2 🎥 | Preço US/EU | — | ⏸️ **Dono (H2)** |

### 5.5 Camada social

| Decisão | Evidência | Alternativa rejeitada | Onde | Estado |
|---|---|---|---|---|
| **Faixas ANTES do ranking global; acumular nunca rebaixa** | Tim Gabe 🎥 📰: placar global "parece impossível de vencer e desmotiva"; **31,3%** relataram efeito psicológico negativo de comparação em ambiente só-leaderboard 📊 | Ranking global cru | `tournamentTiers.ts` | ✅ |
| **Nenhum componente de métrica reusado do próprio perfil na tela do amigo** | Mobbin 🖼️ (Mimo): não desenhou leaderboard — só reusou o card do perfil, **e a comparação emergiu da simetria de componente** | Reusar componentes | Regra 1 do §16.4 — **a única não negociável depois**, porque é decisão de design system, não de tela | ✅ |
| **Exibir GALHO, não altura** | Mobbin 🖼️: Opal `Owned by 23%` (fato) vs Mimo `Wooden LEAGUE` (escada). **Ramificação converte comparação vertical em variedade horizontal** — mas só se a UI exibir o galho | "estágio 4 de 5" | Regra 3 | ✅ |
| **Só verbos de DAR** | Finch 🖼️: `Share Goal` · `Send Good Vibes` · `Send Gift` — **e a ausência de uma quarta** | "Ver progresso do amigo" | `tasksDone` não trafega | ✅ |
| **Nunca streak social recíproco nem accountability com prazo** | Snapchat 📰: ansiedade documentada, senha entregue a amigos | Streak entre amigos | — | ✅ |
| **Coop: progresso COLETIVO + presença binária** | Item 4.2 (31,3%) 📊: um grupo que mostrasse contribuição individual reinventaria o leaderboard **entre amigos — onde dói mais**. Regra 5 do dossiê: **meta somada, nunca confrontada** | Mostrar quanto cada membro fez | `vistaDoGrupo` (invariante de SERVIDOR) | ✅ 07/09 |
| **Sair é um toque; a meta ENCOLHE junto** | Exigência escrita do item 4.3 | Confirmação; meta fixa | `target = members × 5` derivado | ✅ |
| **Entrada só por código de convite** | Grupo achável é raide de estranho; o diretório já respeita consentimento (N-4) | Busca de grupos | `coopJoin` | ✅ |
| **Meta 5×; sem recompensa; sem gate de Vínculo** | 🧭 dono (08/09). 5 e não 7: exigir dia completo por pressão social desfaz o perdão da Fase 1 | Bits por meta batida | `COOP_CHECKINS_POR_MEMBRO` | ✅ |
| **O ESTADO da criatura é visível socialmente?** | Mobbin §17 Q7 🖼️: criatura abatida na árvore de amigos é **acusação pública** | — | — | ⏸️ **Em aberto** |

### 5.6 Recompensa e conteúdo

| Decisão | Evidência | Alternativa rejeitada | Onde | Estado |
|---|---|---|---|---|
| **Uma ação, várias barras** | Pokémon GO 📊: um km avança ovo, candy, missão e recompensa semanal ao mesmo tempo | Feedback isolado | Item 4.4 | ✅ |
| **Recompensa variável com TETO, nunca à venda** | *Hooked* 📚: a variável saudável varia em **sabor** (qual sonho, qual fala), não em **se existe** recompensa pelo esforço central | Loot box | `DUNGEON_HEART_DROPS` | ✅ |
| **Janela do Torneio em DIAS, nunca horas** | Community Day 📊 é o motor de retenção do GO; janelas curtas excluem quem trabalha | Eventos de horas | Item 4.1 | ✅ |
| **A masmorra não cobra da barra de cuidado** | Empilhar punição é o que afunda o Habitica 📰 | Masmorra que custa HP | — | ✅ |
| **Glitchtama: máx. 1/dia** | A conta: 59 runs seguidas comprariam a escada de evolução inteira num fim de semana | Sem teto | `GLITCHTAMA_PER_DAY` | ✅ |
| **Brincar NUNCA é condição de dia completo, HP ou evolução** | Critério B: no instante em que um dos três olhar para `playLog`, a oferta vira obrigação | Brincar obrigatório | — | ✅ |
| **Cansaço é DERIVADO e só cosmético** | 🧭 Quem aparece cansado é quem trabalhou demais — reduzir a recompensa dele puniria quem mais precisa de acolhimento | Barra que sobe e desce sozinha | — | ✅ |
| **Aventura da noite: narrativa, sem recompensa material** | Finch 📰: "a recompensa é narrativa, não numérica — **narrativa não satura**". 🧭 dono (08/09) | Bits/item pelo achado — o relatório viraria tela que a pessoa PRECISA abrir | `adventure.ts`; teste trava o catálogo sem campo de recompensa | ✅ 08/09 |
| **Aventura: dia mexe na CHANCE, nunca no acesso; nenhum dia volta vazio** | 🧭 O relatório do dia ruim é o momento mais frágil do app. Teste prova que o catálogo inteiro é alcançável por quem só teve dias ruins | Dia ruim sem aventura | `ADVENTURE_ODDS` | ✅ |
| **Aventura determinística por dia** | Razão variável 📚 só é saudável se o ATO for previsível e o RESULTADO surpreendente — re-sortear ao reabrir é caça-níquel | Sorteio no `useState` | seed = `dayKey` | ✅ |
| **Diário NÃO mostra o que falta nem raridade** | 🧭 "Painel de pendências é o Habitica"; rotular a noite de ontem como "comum" é dizer que valeu pouco | Silhuetas do não coletado | `AdventureDiary` | ✅ |
| **Sonhos sazonais continuam obteníveis fora da estação** | A regra que separa estação de battle pass | Exclusividade sazonal | `SEASON_DREAM_WEIGHT` | ✅ |
| **Rota de redenção visível** (o Numemon → Monzaemon) | V-Pet 97 📰: a forma-castigo tem saída, com janela de 48h. *"O bicho ruim não é um beco; é um retrato com saída"* | — | — | ⬜ **Não implementado.** O `carePattern` já é seletor sem "melhor"; falta a narrativa |
| **Atividades acopladas a alguma necessidade mesmo depois de comprar tudo** | "Motivational sand traps" (Far Cry 3) 🎥: atividade desconectada vira **ruído**, não oportunidade | — | — | ⏸️ **Eixo D30–D90, o mais fraco do produto** |

### 5.7 Presença fora do app

| Decisão | Evidência | Alternativa rejeitada | Onde | Estado |
|---|---|---|---|---|
| **Nunca notificação de culpa ou medo; a voz do pet nunca cobra** | Push de culpa é o padrão que os breakdowns condenam 📰 — e que o Duolingo usa com ironia consciente, coisa que o Soulmon **não deve** imitar | "Seu pet está morrendo sem você" | C.2 #17 | ✅ |
| **Widget mostra O SEU pet** | Finch 📰: o widget personalizado é motor de retenção **declarado**; usuários com widget retêm melhor (Duolingo) 📰. "Widget é tão eficaz quanto push" | Widget genérico | `DigiWidgetPlugin` | 🔧 personalizar (P0 do guia) |
| **O widget nunca cobra tarefas que o jogo não cobra** | BUG-1: `dailyTotal` cru mostrava `6/9` a quem já cumpriu a meta — **o cobrador entregue por push passivo, na tela de bloqueio, o dia inteiro** | Denominador cru | `useProgressTracking` | ✅ |
| **Celebração que faz PARAR, não acelerar** | Duolingo 🎥: háptico + animação para o usuário **saborear**, reservada para marcos; a animação existe para o personagem virar "um parceiro atencioso" em vez de software frio | Animação decorativa | — | 🔧 P1 |

### 5.8 Telemetria e privacidade

| Decisão | Evidência | Alternativa rejeitada | Onde | Estado |
|---|---|---|---|---|
| **Sem telemetria, tudo é hipótese — construir antes de otimizar** | Rel. 07 📚: a arbitragem mais dura da rodada — *"toda afirmação comportamental nos outros seis relatórios é hipótese não testada"* | Priorizar por opinião | ~20 eventos em `metrics.js` | ✅ construído, ❌ **sem usuário para ler** |
| **Métrica-farol = tarefas concluídas por usuário ativo/dia, ponderadas por esforço** | Mede a promessa (executar tarefas reais de forma sustentada), não o vício | DAU, tempo de sessão | `carga-diaria.md` §5 | ✅ |
| **Tempo de sessão é ANTI-indicador** | Princípio 7: quem abre 3×/dia e conclui 1 tarefa está **pior** que quem abre 1× e conclui 5 | — | — | ✅ |
| **Nunca coletar**: texto de tarefa, `soulGoal`/`soulStruggle`, psicométrico, nascimento, humor individual, e-mail | LGPD | — | Teste confere a lista de eventos contra o código | ✅ |
| **Humor NUNCA vira pontuação — mas pode alimentar a FALA** | Emily Greer (GDC) 🎥 sobre o perigo de métrica isolada; conflito C.3 #4: alimentar fala não é alimentar score | Meta adaptada ao humor — **pareceria empatia e faria a pessoa responder o que rende ponto** | Teste roda a virada com e sem humor ruim exigindo resultado idêntico | ✅ |
| **Passos e humor DECLARADOS no Data Safety** | Achado de 08/09: o save leva `steps` e `moodLog` para a nuvem e a política não nomeava nenhum dos dois | Declarar "não há dado de saúde" | `PLAY-DATA-SAFETY.md` §2.6 | ✅ |

---

## 6. As decisões de 07–08/09/2026

| Decisão | Argumento vencedor | O que teria de ser derrubado para reabrir |
|---|---|---|
| **P1 — meta de coração a 60%** | Duas réguas onde havia uma; a excelência intacta (princípio 3) | Dado mostrando que o mega fazendo 4 de 6 sem perder coração destrói o stake — **com número**, não com intuição |
| **P2 — folga semanal automática** | Inn do Habitica + freeze do Duolingo + Pokémon Sleep. Automática porque quem precisou de folga não abriu o app | O achado do 3º escudo do Duolingo, transposto: a folga treina ausência |
| **P3 — adiada** | Duas leituras incompatíveis; seria o 6º perdão; a pergunta que decide é de fato | Telemetria de `dailyDone/heartGoal` por estágio |
| **P5 — "dia completo"** | O contador nunca decresce; o NOME era pior que o mecanismo para traço perfeccionista e TDAH | — (é só nome) |
| **Coop: sem recompensa, meta 5×, sem gate** | As três respostas confirmaram a recomendação | Ver 5.5 |
| **Aventura: só narrativa** | Finch: narrativa não satura | Ver 5.6 |
| **Conta como 1ª tela; idade por checkbox** | Menos dado, mesmo efeito legal; o bloco legal entrou NA tela de conta | Achado jurídico de que checkbox não basta para 18+ no Brasil |

> ⚠️ **O efeito combinado de P1+P2, declarado:** um mega pode fazer 4 de 6 em seis
> dias e 0 no sétimo **sem perder um coração**. É **intencional** — degenerar passa
> a exigir negligência real, não um dia de gripe. Se ficar generoso demais, o botão
> de ajuste é `HEART_GOAL_RATIO` (0,6 → 0,7 devolve o mega a 5 de 6), **não** tirar
> a folga.

---

## 7. Falseabilidade — as 12 apostas, com número e instrumento

**Esta é a seção que torna o documento revisável em vez de apenas histórico.**

Cada linha declara: a **aposta** que uma decisão faz sobre o mundo, o que
observaríamos se ela estiver **certa**, o que observaríamos se estiver **errada**,
e **com que instrumento** medir. Sem isso, "rever no futuro" vira releitura.

> **Nenhuma destas apostas foi testada.** Os limiares vêm dos benchmarks de
> `07-retencao-engajamento.md` §1 e são projeções, não histórico do Soulmon.

### As metas de referência (a régua geral)

Benchmarks públicos 2025/2026 📊 · Simulação/pet-sim: D1 45–60%, D30 20–30% ·
Health & Fitness: D1 20–27%, D30 ~3% · Finch: D1 ~54%, D7 ~37%.

O Soulmon é híbrido produtividade × pet-sim. **Metas declaradas:**

| | Suficiente para continuar | Problema estrutural |
|---|---|---|
| D1 | ≥ 35% | **< 20%** |
| D7 | ≥ 18% | — |
| D30 | ≥ 10% | **< 4% sustentado** |

### As apostas

| # | A aposta | Se estiver CERTA | Se estiver ERRADA | Instrumento |
|---|---|---|---|---|
| **1** | **O perdão retém mais do que a punição retinha.** É a aposta-mãe: toda a Fase 1 e P1/P2 dependem dela | D30 ≥ 10%; churn condicional depois de `heart_lost` **não** maior que depois de um dia neutro | D30 < 4% sustentado **com** taxa de conclusão de tarefas caindo — sinal de que sem consequência nada importa (o "extinction level event" do Duolingo, §10.1) | `heart_lost` + coorte D30 + a métrica-farol |
| **2** | **O 3º escudo de descanso ajuda** (`REST_SHIELD_MAX = 3`) | Retorno após ausência ≥ o de quem tem 2 | Duolingo 🎥 já mediu o contrário. Se a taxa de retorno de quem gastou 3 escudos for **menor** que a de quem gastou 2 | `shield_used` + retorno D+1..D+4 |
| **3** | **A folga semanal não treina ausência** (P2) | Quem usou a folga volta no dia seguinte na mesma taxa de quem não usou | Taxa de retorno **menor** entre quem usou — é o mecanismo do escudo nº 3 aplicado a outra peça | `restDayUsed` + retorno D+1 |
| **4** | **P1+P2 não esvaziam o stake** | Degeneração continua acontecendo, e só depois de negligência real (≥ 3 dias abaixo do heartGoal na mesma semana) | Degeneração cai a ~zero **e** a métrica-farol cai junto — cuidar deixou de importar | `degeneration` + `days_since_install` + farol |
| **5** | **O reveal do Oráculo vale as 20 telas do teste psicométrico** | Quem aceita o teste longo retém mais que quem pula | Drop-off > 30% na bifurcação — **e aí reordenar o ritual vira P0** (gatilho já declarado) | `onboarding_long_test` (accepted) + drop por passo |
| **6** | **A conta na primeira tela não mata o funil** ⚠️ **a aposta mais arriscada** | Install → `pet_revealed` acima de ~60% | Drop-off na `IDENTITY_STEP` acima de qualquer outro passo. Contraria diretamente o "valor antes de cadastro" do Duolingo 🖼️ 📰, que é evidência forte | `onboarding_step` no `IDENTITY_STEP` |
| **7** | **O paywall invisível não custa caro demais** | RPI acima do piso freemium (~US$ 0,38 D60 📊) | RPI no piso **e** `paywall_view` quase zero — ninguém descobre que existe algo pago. Gatilho já declarado: **conversão < 1% reabre o paywall no reveal** | `paywall_view` / `purchase` / RPI |
| **8** | **A comparação social ramificada não vira placar** | Uso da Biblioteca estável, sem correlação entre visitar amigo e churn | Churn sobe depois de visitar um amigo em estágio mais alto. É o **Problema 2** do dossiê, que a própria fonte diz **não ser consertável por copy** | `layer3_used` (biblioteca) + churn condicional |
| **9** | **A recompensa narrativa não satura** (aventura, sonhos) | Abertura do relatório noturno estável ao longo de 90 dias | Abertura caindo depois que o catálogo de 24 cenas é visto — aí o eixo D30–D90 é o buraco, e conteúdo novo é a única saída | abertura do relatório por coorte |
| **10** | **A criatura sustenta significado sem punição** | Retenção de veteranos (D90) acima do piso, com `care_action` ativo | Veteranos param de cuidar assim que a evolução termina — "se cuidar não muda nada, some o motivo de cuidar" (§10.1) | `care_action` + D90 |
| **11** | **O sinal declarado basta** (Princípio 6) | Conclusões de tarefa por ativo/dia estáveis | Sinal de **inflação de marcação** (marcar sem fazer): conclusões subindo enquanto retenção cai | farol ponderado por esforço + D7 |
| **12** | **A meta de coop 5× é o número certo** | Grupos que batem a meta ≈ metade; ninguém sai por pressão | Grupos batem quase sempre (fácil demais) ou quase nunca (pressão) | eventos de coop (**a instrumentar** — hoje não existem) |

### Como usar esta seção quando houver dado

1. **Não olhe uma métrica isolada.** Emily Greer (GDC) 🎥: métrica isolada e avaliação precoce escondem canibalização.
2. **Cheque primeiro os guarda-corpos**, não o farol: aberturas/dia sem conclusão ↑ · churn pós-degeneração ↑ · `push_optout` ↑ · humor negativo em dias de perda ↑. **Se eles pioram, estamos otimizando dano** — e o farol subindo não redime isso.
3. **A/B só quando houver escala.** O rel. 07 tem uma seção inteira sobre quando A/B é fantasia.
4. Uma aposta falseada **não vira reversão automática**. Vira uma decisão nova, registrada aqui com a mesma honestidade.

---

## 8. Mapa de exposição — onde não temos evidência nenhuma

As decisões 🧭 são as que não têm apoio externo. Não são erradas; são **as que
cairiam primeiro** se estivermos enganados sobre o próprio produto.

| Decisão só de tese | Por que é exposição | O que reduziria a exposição |
|---|---|---|
| **Conta na primeira tela** | Contraria evidência forte (gradual engagement, Duolingo) 🖼️ 📰. Foi decisão do dono contra a recomendação técnica | Aposta 6 da §7 |
| **A folga é anunciada, o escudo não** | Duas peças de perdão com política oposta de visibilidade. A do escudo tem 7 apps de evidência 🖼️; a da folga tem só o nosso raciocínio | Medir se anunciar a folga muda o retorno |
| **Aventura sem recompensa material** | O Finch sustenta "narrativa não satura" 📰, mas nenhuma fonte mediu isso em 90 dias | Aposta 9 |
| **Diário sem "o que falta" e sem raridade** | O Dex de Sonhos faz o oposto **no mesmo app**, com a mesma justificativa invertida. Uma das duas telas está errada | Comparar uso das duas coleções |
| **Cansaço derivado e cosmético** | Coerente com o critério B, sem nenhuma evidência de que a pessoa perceba | Observação qualitativa |
| **Coop sem recompensa nenhuma** | Correto pela tese; **nenhum app do acervo tem grupo cooperativo sem prêmio** para comparar | Aposta 12 |
| **Meta de coop 5×** | Número inventado. Declarado como tal em `PLANO-COOP.md` | Aposta 12 |
| **A degeneração continua existindo** | Mantida por tese ("consequência dá sentido ao cuidado"), mas os 10 perdões a tornaram quase inalcançável. **É a peça que mais mudou de significado sem ninguém redecidir** | Aposta 4 |

> **O padrão que sai do mapa:** onde estamos expostos não é onde fomos duros — é
> onde fomos gentis **sem conseguir medir** se a gentileza ainda deixa o cuidado
> significar alguma coisa. É a mesma pergunta da §10.1.

---

## 9. A crítica mais forte contra o produto

Registrada na íntegra em `GUIA-EXPERIENCIA.md` I.1.3 (🎥 — Errant Signal / Ian
Bogost / Extra Credits). Está aqui porque **acerta uma mecânica que o Soulmon tem**:

> Gamificação é "colar um motivador extrínseco e frequentemente sem sentido a uma
> atividade para induzir as pessoas a engajarem nela"; o objetivo real é "explorar
> reações humanas instintivas… para fazer você fazer algo que de outra forma não
> faria". Bogost propõe renomear para **"exploitationware"**.

E o golpe específico:

> ao anunciar antecipadamente a recompensa por concluir a tarefa, o cérebro reduz a
> atividade a "**um mero meio para um fim**" — o trabalho vira "um estorvo que se
> coloca entre o usuário e a notificação de conquista".

No Soulmon, concluir tarefa **dá comida**, que dá energia e atributo que decidem o
galho. É recompensa tangível, esperada e condicional — a configuração que a
literatura de motivação intrínseca aponta como a que corrói (superjustificação,
§4.2). O Extra Credits completa com a curva: o entusiasmo inicial some e, sem
recompensa intrínseca, o engajamento "desmorona de forma abrupta".

**Como isto entrou no produto, honestamente:**

1. **Não como remoção.** A comida é o coração do produto; removê-la é outro produto.
2. **Como critério permanente** (critério A da §3).
3. **Como o argumento a favor das peças que NÃO são extrínsecas**: o relatório que
   descreve sem julgar, o humor que não vira score, o `soulGoal` devolvido, a
   aventura que é cena e não moeda, o ritmo de cuidado que muda **quem a criatura
   vira**. Essas são a defesa contra a curva de colapso — e são exatamente as que o
   roadmap P0 manda investir.

**A assimetria a favor do Soulmon:** o "evento de extinção" do Duolingo é sobre 9
milhões de pessoas perderem o apreço por um **número**. O Soulmon não tem esse
número exposto — tem uma **criatura**. Vínculo com criatura não barateia pela mesma
via. Mas também não é imune: *se cuidar não muda nada, some o motivo de cuidar.*

---

## 10. O que a pesquisa contradisse, e o que continua em aberto

### 10.1 A pergunta estratégica sem resposta

> "You can almost always get engagement wins… by just **cheapening the streak**…
> but **you kind of got to hold the line at some point. And it's not clear where
> that line is.** … there's a point where you go too far and it's a one-way door."
> — Duolingo 🎥

O Soulmon empilhou **oito** mecanismos de perdão, cada um decidido com bom
argumento e **isoladamente**. Com P1 e P2 são **dez**. Nenhum documento do projeto
pergunta onde o perdão para de significar cuidado e passa a significar que nada
importa.

Isso **não** é argumento para punir. É argumento para **nomear o que o Soulmon
protege como inviolável**. A pergunta que falta: *o que ainda dói perder no
Soulmon?* Hoje, honestamente: quase nada além da criatura.

**A resposta candidata já existe na pesquisa e não foi implementada:** o prestígio
puramente cosmético (regra 5 da §3, o *Perfect Streak* dourado). Cria significado
**sem criar punição** — quem usa a proteção não perde nada, só não ganha o dourado.

### 10.2 Onde a evidência forte contraria uma regra atual

| Regra atual | Evidência contra | Estado |
|---|---|---|
| `REST_SHIELD_MAX = 3` | Duolingo 🎥 testou: 3 = 2 em ganho, e o 3º **treina ausência** | ⏸️ Experimento (3→2). Não é o mesmo mecanismo (ganho por constância, gasto sozinho), por isso não é correção automática |
| **Conta na primeira tela** | Gradual engagement 🖼️ 📰: valor antes de cadastro | ✅ decisão do dono, consciente. Aposta 6 |
| **Dez perdões empilhados** | 🎥 acima | ⏸️ §10.1 |

### 10.3 O que os relatórios não cobriram

- **ASO e aquisição paga** — nenhum relatório. Descoberta é orgânica por padrão.
- **Som e música** — ausente, e é alavanca conhecida de vínculo.
- **QA com usuários reais** — só como recomendação. O único dado de usuário real do projeto é o teste do dono que originou `carga-diaria.md`.
- **Android e desktop no Mobbin** — o MCP só tem iOS e web. O **overlay de desktop** (decisão 3: "a criatura É o overlay", com animação idle para 11 formas — o item de arte mais caro do conjunto) **não tem levantamento nenhum**.
- **Celebração não-bloqueante** — dois passes no Mobbin não acharam nada.
- **Mercado LATAM/preço no Brasil** — parcialmente respondido na rodada 2.

### 10.4 As perguntas abertas do dossiê Mobbin (§17)

| # | Pergunta | Estado |
|---|---|---|
| 1 | A criatura grátis também ramifica? | Em aberto. Se sim, o pago compra só arte única; se não, o grátis tem mecânica mais pobre — **e isso aparece na árvore de amigos** |
| 2 | Como sinalizar que os 20 itens foram usados, se o resultado é invisível? | Em aberto — **custo sem retorno percebido**. Três modelos no acervo (Speak, Lovi, Noom) |
| 3 | Área mínima e repouso do overlay de desktop | Em aberto — sem fonte |
| 4 | Piso de evolução para oferecer compartilhamento | Em aberto (Uxcel oferece compartilhar "2 days in a row"; Marriott oferece um card com quatro zeros — **ambos constrangem**) |
| 5 | A tela de amigos escala além de ~5? | Em aberto (o limite de 5 amigos adia o problema) |
| 6 | `Buddy up` cria pressão? | **Respondida pelo desenho do coop**: presença binária, meta somada, saída de um toque, meta que encolhe — nada expõe a falha de alguém |
| 7 | O ESTADO da criatura é visível socialmente? | Em aberto — a decisão 8b resolveu o *estágio*, não o *estado* |
| 8 | Celebração não-bloqueante | Em aberto — limite do acervo |

### 10.5 Recomendações do guia ainda não executadas

| # | O quê | Por que importa |
|---|---|---|
| I.3.1 | **Prestígio cosmético por não usar a proteção** | É a resposta direta à §10.1 |
| I.3.2 | Trocar `Continuar` por **`Assumir a meta`** no check-in | Duolingo: +10.000 DAU **só de copy** 🎥 |
| I.3.3 | Celebração que **interrompe** nos marcos 7/21/66 | A cerimônia existe na mecânica, não na tela |
| 5.6 | **Rota de redenção visível** (Numemon → Monzaemon) | O castigo com saída é a peça mais elegante do V-Pet, e falta |
| lição 18 | **Card mensal compartilhável** | O único crescimento orgânico compatível com a essência (identidade, nunca posição) |
| lição 21 | **Checklist D0** da primeira sessão | ~50% dos trial starts e a maior parte do churn acontecem em D0–D1 📊 |
| P0 | **Sprite no reveal** | O momento de maior investimento emocional do produto entrega **texto** |

---

## 11. Como usar este documento para rever uma decisão

1. **Encontre a linha.** Se não está aqui, não foi decidido com argumento — pode ser discutido do zero.
2. **Leia a alternativa rejeitada.** Na maior parte dos casos, o que se quer propor já foi a alternativa que perdeu. Se for, a pergunta não é *"por que não fazemos X?"*, é **"o que mudou desde que X perdeu?"**.
3. **Confira o nível de evidência.** Uma regra 🎥 ou 📚 precisa de evidência do mesmo nível para cair. Uma regra 🧭 pode cair por decisão do dono — mas registre a nova aqui, com a mesma honestidade.
4. **Verifique o gatilho.** Várias linhas dizem *"reconsiderar se…"* (conversão < 1%, funil perdendo > 30%, D30 < 4%). **Se o gatilho não disparou, a decisão está de pé** — inclusive contra uma boa ideia nova.
5. **Se houver dado, vá para a §7** e veja se a aposta correspondente foi falseada. Uma aposta falseada não vira reversão automática: vira decisão nova.
6. **Se mudar, mude os três lugares:** o código, o teste que trava a regra, e esta linha. Doc que diz ✅ sobre regra que não existe mais é pior que doc ausente (`CLAUDE.md`).

E a pergunta que fecha toda revisão, a mesma que abriu o projeto:

> *Isso faz o bichinho parecer mais um companheiro, ou mais um chefe?*
