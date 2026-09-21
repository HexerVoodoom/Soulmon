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
> **Consolidado em 08/09/2026, e revisado no mesmo dia** por uma sessão de QA
> independente que atacou as decisões daqui por mutação (§12). As fontes
> primárias continuam sendo os arquivos citados; este registro aponta para eles
> em vez de reescrevê-los.

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
| **12** | O que a revisão adversarial de 08/09/2026 fez com este documento |

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
| **A folga NÃO cobre o dreno de cocô** ⚠️ | Achado do QA (08/09): a folga absorve a perda vinda da meta, mas o dreno de cocô cobra por outro caminho — então existe um dia "de folga" em que a pessoa perde coração assim mesmo | — | `poopDrain.ts` | ⬜ **Lacuna conhecida, não decidida.** Ou a folga cobre as duas fontes, ou o produto assume que cocô é a única cobrança que sobrevive ao descanso — e isso precisa estar escrito |
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
| **O × que dispensa o convite tem alvo de 44×44** | Achado do QA (08/09): tinha 32×32 — o **único** alvo abaixo da régua no relatório noturno, e justamente o da ação **terminal** (`offerDismissed` grava no save, o convite não volta nunca mais), encostado num card que leva à compra. Errar o toque ali abria o paywall | 32×32 | `UnlockNudge` | ✅ corrigido |
| **Preço sempre em R$, inclusive para quem está em inglês** | ⚠️ Achado do QA: quem usa o app em EN vê o preço em reais | — | `priceLabel.ts` | ⬜ **Em aberto.** Ligado ao item de preço regionalizado (H2) |
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
| **Cada membro escreve só a PRÓPRIA presença** (`coopCk:<gid>:<saveId>`) | Achado do QA (08/09): `coopCheckin` fazia ler-modificar-gravar sobre o blob do grupo. **Dois membros marcando na mesma noite — o caso normal de um grupo de quatro** — e a segunda gravação apagava a primeira, sem erro. O progresso do grupo, que é a única coisa que o modo entrega, ficava menor que a verdade | Blob compartilhado no caminho quente | `community.js`; guard provado vermelho por mutação | ✅ **corrigido — a corrida foi removida, não mitigada** |
| **Entrar confere a própria entrada e admite colisão** | Achado do QA: duas pessoas na última vaga → a última gravação vencia e o perdedor recebia **200 com a vista do grupo**, para depois o grupo sumir sem nenhum evento que explicasse | Sucesso falso | `coopJoin` → `409 join collision` | ✅ corrigido |
| **As três chaves do grupo renovam JUNTAS** | Achado do QA: só `coop:<gid>` era reescrita; `coopOf:` e `coopCode:` eram gravadas uma vez. Aos 120 dias um grupo **vivo e ativo** perdia os dois índices — todo mundo via "você não está em nenhum grupo" e o convite parava de abrir, ao mesmo tempo, sem erro | TTL por chave | `gravarGrupo` | ✅ corrigido |
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
| **Emoji de interface só do bloco que a base de aparelhos desenha** | Achado do QA (08/09): **nove emojis do app renderizam como caixa vazia (▯), sem erro e sem aviso** — todos do bloco `Symbols and Pictographs Extended-A` (Emoji 12.0+). Atingem o **marco de 21 dias**, o traço Carinhoso, cinco mobílias da loja, **três das 24 cenas da aventura**, quatro dos 30 sonhos e um reino do Oráculo. É a **mesma família de dano** da fonte de ícones subsetada: renderiza vazio, sem erro | — | `emojiSuportado.contract.test.ts` congela a dívida e barra um emoji novo desse bloco | ⚠️ **Guard entrou; a troca dos nove é decisão do dono** (são catálogos curados por ele) |
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
| **O código de passo do funil não pode colidir** ⚠️ | Achado do QA (08/09): `onboardingStepCode` mapeia passo negativo para `45 + passo`; o portão trouxe três telas novas e hoje o fundo é `GOOGLE_STEP` (-9) → **36**. O maior passo positivo (`REGISTER`) vale **35**. **A folga inteira é de UM**: um item novo no teste psicométrico faz duas telas do funil somarem no mesmo contador, sem erro e com o dado parecendo plausível | — | Guard novo em `telemetry.test.ts` | ⚠️ **Alarme armado.** Ver §7 — é o instrumento das apostas 5 e 6 |
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

### 6.1 As decisões de SOM (08/09/2026)

Contexto: até esta data o app tinha **11 sons, 100% sintetizados em runtime** por
osciladores (`src/utils/sounds.ts`), **zero arquivo de áudio**, **zero música**,
**zero mixer** (cada som abre um `AudioContext` próprio e o fecha em 2 s) e um
único `mute` booleano. Ganhos hardcoded entre 0,045 e 0,12, **nunca medidos**.
Dois sons — `playPoopAlert` e `playMenuOpen` — estão exportados com **zero
chamadores** (contagem por `grep` nos 7 arquivos que importam o módulo).

O eixo sonoro do produto foi aberto por um run próprio (`squad-alpha-runs/som-01/`),
com uma squad instanciada a partir da SQUAD-Alpha e cinco loops de refino
adversarial. As decisões que saíram dali:

| Decisão | Argumento vencedor | O que teria de ser derrubado para reabrir |
|---|---|---|
| **S1 — a fonte do som novo é GERAÇÃO POR IA** (Higgsfield / Seed Audio) | Decisão do dono. Dá paleta tímbrica, ambiente e variação que dois osciladores não alcançam | Ver a alternativa que perdeu, abaixo — ela tem gatilho declarado |
| **S2 — a trilha EXISTE, mas nasce DESLIGADA e só começa por gesto** | Trilha com **autoplay viola a D11 por extensão**: `sounds.ts` declara que *"a fronteira da D11 é o pacote inteiro"* e que a taxonomia é presença + confirmação de ação — música contínua não é nenhuma das duas, e cai no predicado literal *"som que sai sozinho não é presença, é alarme"*. Iniciada por gesto, ela deixa de ser som não solicitado e passa a ser escolha, como o Forest | Evidência de que a trilha ligada por padrão **não** aumenta abandono no perfil "usuário em público" — e ela não existe hoje, porque **ninguém nunca usou o app** |
| **S3 — o alvo de loudness é AES / EBU R 128: ≤ −16 LUFS integrado, true peak ≤ −1 dBTP** | É o padrão com norma citada (ITU-R BS.1770 K-weighting; EBU R 128). A alternativa (−10/−12 **dBFS**, de `references/audio.md` da skill de geração) mistura régua de PICO com régua de LOUDNESS — e as duas estão a **3,017 dB medidos** uma da outra, diferença aferida no protótipo de medição deste run | Medição mostrando que −16 LUFS deixa o app inaudível no alto-falante de celular em ambiente ruidoso — **medida**, não impressão |
| **S4 — nenhum som pode reintroduzir PI de terceiro** | O bundle já carregou 74 sprites e 57 nomes registrados da Bandai. Vale para jingle reconhecível e para timbre-assinatura de franquia | Nada. É linha vermelha, não trade-off |
| **S5 — texto do usuário NUNCA entra em prompt de geração de áudio** | Extensão direta da regra já vigente para geração de sprite. Agora o áudio também é gerado por IA, então a mesma superfície de injeção existe | Nada |

As decisões do dono no gate da Fase 0 (08/09/2026), que fecham quatro pendências abertas:

| Decisão | Argumento vencedor | O que teria de ser derrubado para reabrir |
|---|---|---|
| **S6 — orçamento de áudio: 300 KB no total, ZERO no bundle inicial** | `dist/` é commitado, então todo asset é **permanente no histórico do git**. 300 KB cabe ~8–10 SFX em Opus/AAC mais uma cama curta de trilha, e força carregamento sob demanda. **Não existia régua nenhuma antes desta linha** — o `vitest.budget.mjs` é orçamento de tempo, não de bytes. Guard a escrever em `sprites.dungeonRoster.test.ts` **e** no `PRECACHE_URLS` do `public/sw.js`, porque asset "sob demanda" listado no precache é baixado no primeiro load do mesmo jeito | Medição mostrando que o teto força qualidade inaceitável num evento que o gate de escuta aprovou — com o peso real por codec na mão, não estimado |
| **S7 — sem teste de escuta com pessoas de fora; o dono decide sozinho** | Decisão explícita, não esquecimento. O cético registrou que *"recusar é legítimo, não ter perguntado não é"* — perguntou-se, e a resposta foi recusar | ⚠️ **Consequência declarada:** o design system sonoro passa a ser aprovado por **N=1**, e esse N=1 já aprovou o conceito antes de ouvir. `"irrita na 20ª repetição?"` continua estruturalmente irrespondível — o mitigador é de design (variação, round-robin, teto de frequência por evento), não de gate |
| **S8 — o dono é o dono de áudio e exerce o gate de escuta** | Fone **e** alto-falante de celular, três perguntas fechadas por asset, lote máximo de 8 por sessão, registro em `escuta/<fase>.md`. Sem isso a Fase 2 não fecha | Taxa de aprovação de **100%** é o resultado esperado de um gate **não exercido**, não prova de lote bom — vigiado por `alpha-governanca` |
| **S9 — risco residual de PI da geração por IA: ACEITO, com registro** | Termos do gerador consultados em 08/09/2026: a §4.4 concede uso comercial sem trava de plano, mas a **§13.2 nega expressamente garantia de originalidade ou legalidade** e põe o *rights clearance* como responsabilidade exclusiva do usuário; a §4.4 nega exclusividade (outro app pode receber output idêntico) | Notificação de terceiro, ou mudança dos termos. ⚠️ **Não existe `grep` por melodia**: o guard executável prova **procedência** (hash casado com o manifesto nas duas direções + linha obrigatória em `docs/Attributions.md` com origem, modelo, prompt, data e termos), **nunca originalidade**. O único controle de originalidade que existe é a escuta humana do S8 |

| **S10 — o som PROCEDURAL é a solução provisória; os prompts de IA ficam prontos e engatilhados** | Decisão do dono em 09/09/2026, com a conta na mão: a conta do gerador está em **0,45 crédito** e o piloto A/B **não rodou** — a premissa do run está **não medida, não refutada**. Em vez de travar o eixo sonoro esperando recarga, o procedural que já existe é melhorado contra a escada de loudness (que agora existe e tem gate), e o pacote de prompts é escrito e guardado para disparar quando houver crédito | O A/B cego, quando rodar. Se o candidato de IA vencer em ≥2 dos 3 pares, o procedural volta a ser provisório de verdade; se empatar ou perder, **S1 cai para SFX** e sobrevive só para trilha e ambiente — que é o híbrido já previsto na alternativa que perdeu, abaixo |

As decisões que fecharam as pendências de produto do run, tomadas em 09/09/2026 pelo dono da
disciplina sonora. **Nenhuma das três acrescenta uma amostra ao orçamento do S6.**

| Decisão | Argumento vencedor | O que teria de ser derrubado para reabrir |
|---|---|---|
| **S11 — o carinho não ganha som próprio; o som do gesto é a PRESENÇA que já toca no primeiro toque do pet na sessão** | O carinho é o evento mais repetido do app (medido: `rubTick` dispara a cada 2000 ms de arrasto, 10 s = 5 disparos) e hoje é **mudo com HP cheio** — o som existente era contingente ao recurso curado, não ao gesto, então torná-lo contingente ao gesto **aumentaria** os disparos. O motivo está proibido em evento que se repete (§5.2 do inventário) e a Presença é 1×/sessão por **D11**, então "variação do motivo de presença" quebraria a regra que faz da paleta um sistema. A objeção comportamental — é o único gesto de cuidado puro, e um app que só sonoriza produção soa como chefe — é respondida sem asset: tocar e esfregar são o mesmo dedo (§4.3 regra 2), e o gesto fica com o único som do produto que não celebra nada. **Custo zero**: nenhuma amostra, nenhum byte, nenhuma categoria | O gate de escuta do **S8** ler a sequência real (primeiro toque = Presença; os 8 s seguintes = nada) como **interação quebrada** e não como silêncio deliberado; **ou** série da Fase 4 mostrando abandono do gesto de esfregar acima do dos gestos com som. Enquanto não houver instrumento e série, é `[hipótese]`. Revisão de **D11** também a reabre — e D11 não é minha |
| **S12 — a Arena fica muda, e se um dia tiver som será a classe Arcade genérica, sem uma única amostra própria; toda superfície nova nasce MUDA (R-NOVA)** | `ArenaGame.tsx` nasceu 21 min antes do commit dos cortes e reintroduziu `playTaskComplete` (**C-1**) e `playFeed` (**C-2/C-3**) com **3.974 testes verdes** — o defeito não foi a tela, foi a **ausência de régua** para superfície nova. Pelo critério da escada (repetição) a Arena não tem perfil próprio: rodada de combate é impacto, rodada limpa é fim de partida, e as duas já estão na classe Arcade do §5.2 — logo, pela **R-CAT** (P-4), ela não justifica categoria nem asset. E o risco do C-1 é literal ali: "rodada limpa" é cadência de combate, não conclusão, e gastar a celebração do produto nela é o dano já registrado em §5.7 | Medição mostrando que a rodada de combate da Arena tem perfil de repetição **distinto** do impacto da masmorra e do pesadelo (condição (a) da R-CAT), com contagem por run medida no código. A **R-NOVA** cai se a varredura de call-site se mostrar impraticável de manter — e aí vira régua de gate, não deixa de existir |
| **S13 — o contrato adaptativo E0–E6 (§7 do inventário) é CONGELADO como proposta não verificada; a regra E0 e a chave separada da trilha são extraídas e valem sozinhas** | Validar um sistema de camadas sem nenhuma camada mede só que o barramento sobe e desce um ganho — não mede qual camada entra em qual estado, que é o que o §7 decide; todo teste seria verde com a resposta escrita nele. Mas **E0** (`document.hidden` · app sem foco · `isSleeping` · janela de descanso) **não é regra de trilha**: é **D11** e **S2** sobre o pacote inteiro, vale para os SFX que existem hoje e sobe para a classe 0 da hierarquia; e a chave da trilha separada de `SOUND_MUTED` é **proibição**, que não precisa de asset para valer. A quantização em batida (**P-2**) **não** é congelada: é aritmética sobre `ctx.currentTime`, já medida viável, e a deriva em tempo real pode ser medida hoje | Descongela com as **duas** condições juntas: (1) existirem no repositório ≥2 camadas reais (`base` + `ritmo`) no mesmo BPM fixo declarado no manifesto, com hash e procedência; **e** (2) o dono ter ligado a trilha por gesto ao menos uma vez numa sessão real (§7.1 declara o contrato inerte com a trilha desligada). Recarga de crédito do gerador **não** descongela sozinha. Reabre antes disso se aparecer outra peça do §7 que governe SFX e não trilha — como o E0 acabou sendo —, ou se a trilha nascer procedural em runtime (plausível sob **S10**), caso em que a condição (1) está escrita na moeda errada |

Os termos do gerador foram lidos **na fonte** em 09/09/2026, fechando a pendência que a S9 tinha
deixado aberta. O resultado **confirmou a S9** e **abriu uma ponta nova**:

| Decisão | Argumento vencedor | O que teria de ser derrubado para reabrir |
|---|---|---|
| **S15 — termos do gerador de áudio: levantados na fonte; risco de PI segue ACEITO, mas com uma ponta NOVA e NÃO fechada (§8, provedor terceiro anônimo)** | Higgsfield Terms of Use, Last Updated 26/07/2026 (efetiva 27/08/2026 p/ contas existentes), lida em 09/09/2026: **§4.4** concede uso comercial sem trava de plano, sem cessão de propriedade, com direito de transferir/sublicenciar, e **os direitos sobre output gerado e exportado sobrevivem ao fim da assinatura/conta** — é isto que sustenta `dist/` commitado; **§4.4** nega exclusividade; **§13.2** nega garantia de originalidade/legalidade e põe o rights clearance como responsabilidade exclusiva nossa; **§12** nos obriga a indenizar a plataforma e **não** há indemnity a nosso favor; atribuição não é exigida (a nossa é regra interna); proibido usar output para treinar/fine-tunar/destilar modelo. **A numeração e o teor citados na S9 foram CONFIRMADOS, não mudaram.** O que a S9 não sabia: **§8 obriga a cumprir também a política do provedor terceiro do modelo, prevalente quando mais restritiva — e a plataforma não nomeia o provedor de `seed_audio` em nenhuma fonte pública (termos, help center, `MODELS.md` do CLI). Estamos vinculados a uma política que não conseguimos ler.** Veredito: pode embarcar em app de loja, sob as 6 condições de `squad-alpha-runs/som-01/termos-gerador.md` §2 | A plataforma nomear o provedor e a política dele ser mais restritiva que o piso acima (derruba o veredito, não a decisão de aceitar risco); mudança de versão dos termos (por isso a linha de atribuição carrega a data e a versão); notificação de terceiro. ⚠️ Continua valendo o núcleo da S9: **não existe `grep` por melodia** — o guard prova procedência, nunca originalidade, e os termos agora CONFIRMAM por escrito (§13.2) que o fornecedor também não prova |

> ### ⚠️ Emenda à S10, em 09/09/2026 — o procedural deixou de ser provisório de dias
>
> A S10 nasceu como desvio de rota de curto prazo: *"o procedural vira a solução provisória e os
> prompts ficam engatilhados"*. **O dono decidiu não recarregar o gerador por ora**, então o prazo
> deixou de ser curto e passou a ser **indeterminado**.
>
> Isso muda o que a decisão significa, e a mudança precisa estar escrita: **o som procedural é a
> solução VIGENTE do Soulmon**, não um rascunho esperando substituição. Ele foi calibrado contra a
> escada (dispersão de **41,63 dB → 8,02 dB**), passa nos três critérios do gate, e o subsistema
> inteiro ocupa **1,9% do orçamento S6 com zero byte de asset**. Não é um remendo pobre: para SFX
> de UI, é a solução com menos custo em todas as moedas que este projeto paga — byte permanente no
> histórico, exposição de PI, latência de decode e dependência de fornecedor.
>
> **O que continua verdadeiro, e não pode ser esquecido:** a **premissa do run segue NÃO MEDIDA,
> não refutada**. Ninguém comparou som de IA com o procedural em teste cego. Dizer que "o
> procedural venceu" seria inventar um resultado que não existe — ele **não venceu, ele ficou**,
> porque o outro lado nunca entrou em campo.
>
> **Gatilho para reabrir, e ele não expira:** haver crédito no gerador. O caminho está engatilhado
> em `squad-alpha-runs/som-01/prototyper/pacote-prompts.md` (12 prompts prontos + a sequência de 6
> passos), e o `pos-processar.mjs` já foi testado contra um WAV real. Quando o A/B rodar, valem os
> critérios já escritos na S10: candidato de IA vencendo em ≥2 de 3 devolve o procedural à condição
> de provisório; empate ou derrota faz a **S1 cair para SFX** e sobreviver só para trilha e ambiente.
>
> ⚠️ **A pendência dos termos comerciais NÃO foi resolvida por esta emenda** — ela só ficou menos
> urgente. Ela volta a ser bloqueante no minuto em que o primeiro asset for gerado, porque `dist/`
> é commitado e todo byte é permanente no histórico do git.

> **A alternativa que perdeu, e o gatilho para ela voltar.** O caminho não
> escolhido é **melhorar o sintetizador procedural** (ADSR, segundo oscilador,
> filtro, round-robin por detune) em vez de embarcar arquivos. Ele é gratuito em
> todas as moedas que este projeto de fato paga: **zero byte permanente** num repo
> onde `dist/` é commitado (todo asset é imortal no histórico), **zero exposição
> de PI**, **zero latência de decode** (MP3 carrega ≥100 ms, e SFX de UI precisam
> ser buffers curtos pré-decodificados), **zero dependência de fornecedor** — e os
> termos de uso comercial da saída do gerador são **lacuna aberta, num projeto sem
> jurídico**. Perdeu porque o caso é forte para SFX de UI e **fraco para trilha e
> ambiente**: ninguém sintetiza ambiente de sessão longa com dois osciladores.
>
> **Gatilho para reabrir:** um teste cego A/B (mesmo evento, loudness normalizado,
> ordem sorteada) em que o procedural vença ou empate em **≥2 de 3** pares de SFX
> de UI. Se isso acontecer **e** os termos do gerador voltarem restritivos, S1 cai
> para SFX e sobrevive só para trilha e ambiente. **O escopo híbrido — SFX de UI
> procedurais + IA para trilha, ambiente e stingers — é admissível desde já**, e é
> o desfecho mais provável.

> ⚠️ **Nada nesta subseção foi medido no Soulmon.** §1 vale aqui inteira: ninguém
> nunca usou o app, não há telemetria de áudio nenhuma (nem evento de mute, nem de
> volume, nem de sessão com som ligado). Toda afirmação sobre como o usuário reage
> a som é `[hipótese]`, e criar essa instrumentação é entregável do run, não
> pré-requisito dele.

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
| **5** | **O reveal do Oráculo vale as 20 telas do teste psicométrico** | Quem aceita o teste longo retém mais que quem pula | Drop-off > 30% na bifurcação — **e aí reordenar o ritual vira P0** (gatilho já declarado) | `onboarding_long_test` (accepted) + drop por passo ⚠️ **ver o alerta do instrumento abaixo** |
| **6** | **A conta na primeira tela não mata o funil** ⚠️ **a aposta mais arriscada** | Install → `pet_revealed` acima de ~60% | Drop-off na `IDENTITY_STEP` acima de qualquer outro passo. Contraria diretamente o "valor antes de cadastro" do Duolingo 🖼️ 📰, que é evidência forte. **E o QA achou um agravante: se o popup do Google for bloqueado, a única saída pode estar bloqueada também** (§10.2) | `onboarding_step` no `IDENTITY_STEP` ⚠️ **ver abaixo** |
| **7** | **O paywall invisível não custa caro demais** | RPI acima do piso freemium (~US$ 0,38 D60 📊) | RPI no piso **e** `paywall_view` quase zero — ninguém descobre que existe algo pago. Gatilho já declarado: **conversão < 1% reabre o paywall no reveal** | `paywall_view` / `purchase` / RPI |
| **8** | **A comparação social ramificada não vira placar** | Uso da Biblioteca estável, sem correlação entre visitar amigo e churn | Churn sobe depois de visitar um amigo em estágio mais alto. É o **Problema 2** do dossiê, que a própria fonte diz **não ser consertável por copy** | `layer3_used` (biblioteca) + churn condicional |
| **9** | **A recompensa narrativa não satura** (aventura, sonhos) | Abertura do relatório noturno estável ao longo de 90 dias | Abertura caindo depois que o catálogo de 24 cenas é visto — aí o eixo D30–D90 é o buraco, e conteúdo novo é a única saída | abertura do relatório por coorte |
| **10** | **A criatura sustenta significado sem punição** | Retenção de veteranos (D90) acima do piso, com `care_action` ativo | Veteranos param de cuidar assim que a evolução termina — "se cuidar não muda nada, some o motivo de cuidar" (§10.1) | `care_action` + D90 |
| **11** | **O sinal declarado basta** (Princípio 6) | Conclusões de tarefa por ativo/dia estáveis | Sinal de **inflação de marcação** (marcar sem fazer): conclusões subindo enquanto retenção cai | farol ponderado por esforço + D7 |
| **12** | **A meta de coop 5× é o número certo** | Grupos que batem a meta ≈ metade; ninguém sai por pressão | Grupos batem quase sempre (fácil demais) ou quase nunca (pressão) | eventos de coop (**a instrumentar** — hoje não existem) |

### ⚠️ O instrumento das apostas 5 e 6 está a UM passo de mentir

Achado do QA (08/09/2026). `onboardingStepCode` traduz passo negativo para
`45 + passo`; hoje o fundo é `GOOGLE_STEP` (-9) → **36**, e o maior passo
positivo (`REGISTER`) vale **35**. **A folga é de um.**

Um item novo no teste psicométrico empurra `REGISTER` para 36 e **duas telas do
funil passam a somar no mesmo contador** — sem erro, e com o dado parecendo
plausível. As duas apostas que dependem de `onboarding_step` seriam medidas com
uma régua quebrada, e nada avisaria.

Há guard novo em `telemetry.test.ts` que fica vermelho antes disso acontecer, e
**a correção certa quando ele cair é subir a base, não afrouxar a asserção**.

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

**O que a revisão de 08/09 tirou deste mapa:** o coop deixou de ser exposição
*de implementação* (as três corridas do KV foram removidas e travadas por
mutação), e a suspeita de que eu tivesse ensinado os guards de P1/P2 a
concordarem **foi testada e descartada** (§12). O que sobra no mapa é exposição
de **tese**, que é o tipo que só telemetria resolve.

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
| **O fallback de popup bloqueado** (`signInWithRedirect`) | ⚠️ **Hipótese levantada pelo QA (08/09), e é a mais grave em aberto.** `authDomain` é `soulmon-app.firebaseapp.com` e o app roda em `soulmon.mateus-sprnd.workers.dev` — **domínios diferentes**. Desde o SDK 9.19 a documentação do Firebase avisa que `signInWithRedirect` para de funcionar em navegador que bloqueia armazenamento de terceiros (Chrome, Safari/ITP, Firefox/ETP) a menos que `/__/auth/handler` seja servido pelo domínio do próprio app — **e não é**. Ou seja: a única saída para popup bloqueado pode estar barrada pela mesma família de proteção | ⏸️ **Não reproduzível sem conta Google real e popup barrado.** Se confirmar, o portão — que é a PRIMEIRA tela — vira parede para uma fatia de gente, e a aposta 6 falha por um motivo técnico, não de produto. Cinco testes agora cobrem a lógica do fallback; **nenhum prova que o redirecionamento funciona no navegador da pessoa** |
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

---

## 12. O que a revisão adversarial de 08/09/2026 fez com este documento

Uma sessão de QA independente recebeu instrução explícita de **atacar as
decisões registradas aqui**, começando pela desconfiança que eu mesmo declarei
no handoff: *eu ajustei os guards de P1 e P2 na mesma sessão em que mudei as
regras que eles vigiam — pode ser que eu tenha ensinado o teste a concordar.*

### 12.1 O que RESISTIU (e isto é evidência, não elogio)

| O que foi atacado | Como | Resultado |
|---|---|---|
| Os guards de P1 e P2 | **Onze mutações** na regra de HP e de meta | **Nenhuma sobreviveu.** A desconfiança do handoff estava errada — os guards mordem |
| Contraste, nas 5 telas principais + portão + relatório | Medido no app **rodando**, em 375 px, compondo o alfa camada a camada até a cor sólida | Nenhuma falha. Menor razão 5,57:1 contra 4,5 exigido |
| Texto num idioma só | Varredura de `src`, `functions`, `workers`, `desktop/renderer` | Nada encontrado. **A disciplina de i18n do repositório está de pé** |
| O portão sem `.env` | Conferido **no navegador**, não só lendo o código | Vira aceite + 18+ + "Continuar", e dá para atravessar o app. **Falta de configuração não tranca nada** |
| Rascunho na volta do redirecionamento | Código + teste | O aceite é carimbado antes de sair, e **o e-mail nunca entra no rascunho** |

> **A lição de método:** a desconfiança que eu registrei era razoável e estava
> errada — e só dá para saber isso porque ela foi **escrita e depois atacada**.
> Um handoff que só lista o que foi feito não produz esta linha.

### 12.2 O que CAIU, e o que isso diz sobre as decisões

Dezesseis defeitos, quatro deles de produção. Os que tocam decisões registradas
já estão nas tabelas da §5. O padrão que eles formam vale nomear:

**Nenhum defeito estava na REGRA. Todos estavam na fronteira entre a regra e o
mundo** — concorrência no KV, ordem de pintura, tamanho de alvo de toque, glifo
que a fonte não desenha, código de telemetria que colide. As decisões de produto
deste documento saíram intactas; o que falhou foi a entrega delas.

Isso é reconfortante e enganoso ao mesmo tempo: significa que a pesquisa
orientou bem o **desenho**, e não diz **nada** sobre o desenho estar certo. Só
telemetria diz (§7).

### 12.3 O achado que muda uma aposta

O `signInWithRedirect` (§10.2) é o único achado que ataca uma **decisão**, e não
uma implementação: se ele estiver certo, a conta como primeira tela vira parede
para quem tem popup bloqueado. **É a aposta 6 podendo falhar por um motivo
técnico, antes mesmo de a hipótese de produto ser testada.**

### 12.4 O que sobrou para o dono

- Os **nove emojis** que renderizam vazio — a troca é escolha de catálogo (§5.6).
- A hipótese do **`signInWithRedirect`** (§10.2) — precisa de conta real e popup barrado.
- A **folga que não cobre o dreno de cocô** (§5.1) — decidir se cobre ou se fica escrito que não cobre.
- O **preço em R$ para quem está em inglês** (§5.4).

## 13. As decisões do dono de 13/09/2026 — cinco reaberturas, na rodada de wireframes

Contexto: a SQUAD-DESIGN destilou a pesquisa em `docs/design/PRINCIPIOS-DE-WIREFRAME.md` e
achou nove pontos em que a pesquisa contradiz uma decisão registrada aqui (§14 daquele doc).
O dono respondeu as nove em 13/09/2026, em modal. Quatro mantidas (T6 prestígio visível sem
o escudo quebrar, T7 veto #21 mantido, T8 psicométrico invisível, T9 conta primeiro com o
porquê visível — registradas em `docs/design/DECISOES-WIREFRAME.md` §3). Cinco **reabrem**
decisão desta página; o que o código faz hoje continua sendo o antigo até alguém implementar.

| # | Decisão nova | Substitui | Evidência que pesou | Alternativa que perdeu | Gatilho para rever |
|---|---|---|---|---|---|
| 13.1 | **Oferta no reveal** — dispensável pelo card, largura parcial, container igual ao não-comercial, "agora não" com peso de primário; sem tabela free × pago, sem preço riscado | §5.3 "não cobrar no reveal; value moment = 1º dia completo" | quiz longo converte +40% quando o resultado é vendido ali (`G01` lição 4, `G05` F4) | oferta só após o value moment (2,1× trial starts em outro contexto) | conversão no reveal < a do pós-value-moment por 30 dias medidos, ou abandono do reveal subir |
| 13.2 | **Contador do dia no widget** ("N de M"), só com ≥ 1 feita, sem verbo de cobrança | WP2.6 "nenhuma frase do widget cita quantidade" (`M-const §2`, `M-LV` E1) | `G07 §5` item 2 — visível sem abrir o app | widget só com pet + faixa de constância | qualquer sinal de que o número vira cobrança (o placar antigo só aparecia para quem perdia o dia — é o que não pode voltar). **Implementar exige mudar `src/plugins/widgetSemCobranca.contract.test.ts` e a linha do `CLAUDE.md`** |
| 13.3 | **Live-ops rotativo que NÃO tira** (visita/conteúdo semanal que aparece por tempo, mas o que foi ganho fica) | leitura estrita de #15 como "nada rotativo" | `G07 §6` item 13 | ritual fixo (Rodada do Torneio) como único evento | #15 continua: nada de "última chance", contagem regressiva ou "expira" na copy; se a copy escorregar, volta |
| 13.4 | **Card compartilhável mensal**, além do da evolução — ambos com piso (nenhum campo em zero) | `MOB §16.5` / WP4.8 "gatilho = forma nova, nunca calendário" | `G01` lição 18 | só o card da evolução | card mensal com campo em zero é proibido; se o piso não segurar, sai |
| 13.5 | **Estoque de escudos visível sempre, inclusive zero**, como posse ("o que você tem"), sem placar | decisão 4 (`MOB §16.1` #4) "estoque invisível"; código mostra só `> 0` | leitura positiva em seção de propriedade do sistema (Yazio, `MOB §15.5`) | invisível / só quando > 0 | Duolingo mediu que o 3º escudo treina ausência; se o número visível virar meta, volta a `> 0` |
| 13.6 | **Pastinha (Itens) só com itens especiais** (🌀💗🦠💾💉); comida comum só pela folha Alimentar | `03 §4.2b`: `use()` → `onFeed` para qualquer item — duas portas para a mesma geladeira | W4 cruzado no wireframe da Home (parecer `soulmon-product-designer`, 13/09/2026, e `DECISOES-WIREFRAME.md` §5.2 V1) | manter as duas portas | se alguém precisar comer pela pastinha (ex.: comida como item de uso), volta |
| 13.7 | **Zero visível só em POSSE, nunca em DÍVIDA do dia**: escudos/coleção podem mostrar `0` (13.5); "N de M feitos" só ganha dígito com N ≥ 1 (piso) | leitura estrita da 13.5 como "zero sempre pode aparecer" | parecer do `soulmon-guarda-linha-vermelha` 8b (PRINCÍPIOS §4, ledger E4/C-P2); é a mesma régua da 13.2 | dígito sempre visível, inclusive `0 de M` | se o piso esconder informação que o jogador pede (ex.: "por que não aparece o contador?"), rever |
| 13.8 | **Excluir hábito com histórico pede confirmação que NOMEIA o marco** ("Este hábito é uma Muda — 30 dias. Excluir apaga esse histórico.") | exclusão num toque (`EditModal`, botão quiet) | ressalva 4e do `soulmon-guarda-linha-vermelha` (regra de perda 1: nunca progresso por acidente); `02 §28` | "Guardar" para hábito (arquiva, preserva `totalDone`) — regra maior; ou como está | se a confirmação virar atrito medido (ninguém exclui), rever |
| 13.9 | **Passos aceitos no nudge de adiamento SOMAM à mesma tarefa** (a tarefa continua uma só, com passos; o contador de adiamentos fica) | indefinido no `onDecompose` | aceite 5 do guarda: substituir zeraria o contador — um perdão a mais | substituir (a tarefa vira `dropped` e cada passo vira tarefa rápida) | se somar deixar a tarefa-mãe assombrada por inércia, rever |
| 13.10 | **Missão semanal `mood-checkins` fica, com alvo 5 em vez de 3** (2 Emblemas por responder o humor 5×; o humor continua opcional e fora de pontuação, e as carinhas do relatório não levam rótulo de prêmio) | alvo 3 (`src/utils/weeklyMissions.ts`) | ressalva 5b do `soulmon-guarda-linha-vermelha` no checkpoint de Rituais (recompensar RESPONDER um dado opcional faz "opcional" virar "vale ponto"); `02 §12`, `02 §50` | tirar a missão do pool (recomendação do guarda) | se o alvo 5 mostrar que a pessoa responde para ganhar (humor uniforme na semana da missão), sai do pool |
| 13.11 | **O "1×/semana" do convite de compra no relatório conta ao MOSTRAR, não ao tocar** (`offerShownWeek` carimbado na exibição) | carimbo no toque (`onOpenOffer`, `App.tsx`) — na prática o convite voltava em todo dia completo até tocar ou dispensar | achado 3a-ii do guarda no checkpoint de Rituais; é o que WP5.1 aprovou (Garmin, `MOB §11A`: canal proativo 1×/semana) | ao tocar (como estava) | se a conversão do canal proativo cair a zero por falta de repetição, rever — nunca acima de 1×/semana |
| 13.12 | **O aviso pós-evolução ("cadastre mais N tarefas para garantir o ponto de evolução") vira CARD na página de Evolução, não modal** — a cerimônia termina em silêncio; a mensagem mora onde a barra já mudou | `EvolveTaskModal` montado logo depois da cerimônia (dois toques seguidos em cima do clímax) | ressalva 4b do `soulmon-guarda-linha-vermelha` e achado #4 do `soulmon-product-designer` no checkpoint de Evolução (PRINCÍPIOS §5: a celebração pede pausa); `03 §4.11` | manter o modal (visto com garantia) | se a meta do estágio novo passar a ser ignorada (dia completo cai depois de evoluir), rever |
| 13.13 | **O resultado do Torneio mostra "Against ‹oponente› · N pts", e o N é o poder DAQUELA partida** (`result.points`, com aleatoriedade) — nunca `lifetimePoints` do oponente; o número some com "Continue" | leitura estrita de PRINCÍPIOS §10 ("número por pessoa" no social — MOB §13A) | tensão nova levantada pelo `soulmon-product-designer` (#3) no checkpoint de Jogos; aceite 3c do guarda (poder da partida, não do jogador); `02 §53` | tirar o número (o diálogo só com o nome e os Emblemas) | se o "N pts" virar comparação entre jogadores (ex.: aparecer fora do diálogo, ou como acumulado), sai |
| 13.14 | **O Coraçãozinho NÃO volta à loja** — `heart` fica em `SPECIAL_ITEMS`, fonte única = drop raro da masmorra (`HEART_HEAL = 1`); a seção Itens vende só os três chips de atributo (+3, `CHIP_BOOST`), que FICAM | D7+D15 (06/09/2026) já o tiraram; a rodada 1 do wireframe da Loja o desenhou de volta por engano | linha #13 (não se vende proteção contra punição); veto 2b do `soulmon-guarda-linha-vermelha`; decisão do dono no início da meta autônoma (15/09/2026) | vender de novo (Créditos → Bits → cura sem esforço, o furo que D7+D15 fecharam) | se o drop da masmorra deixar de existir e a cura precisar de outra fonte, reabre — nunca por Bits |
| 13.15 | **"N days playing" por pessoa FICA no diretório e no perfil do Social** — é duração (só cresce, não ordena ninguém), a única exceção à regra "nenhum número por pessoa" (PRINCÍPIOS §10); formaliza o que o código faz desde 06/09/2026 (quando o `rank` saiu) | racional de comentário de código nunca registrado (guarda do Social); PRINCÍPIOS §10 proíbe "qualquer número por pessoa" | modal final da meta autônoma (15/09/2026); `DECISOES-WIREFRAME.md` §14 V1 (T10) | tirar o número (modelo Finch puro — nenhum número por pessoa) | se virar ordenação, ranking ou comparação explícita (ex.: ordenar a lista por dias, "há mais tempo que você"), sai |
| 13.16 | **Piso ≥ 1 também no widget e no overlay de desktop**: com zero feitas o widget NÃO mostra a linha do contador (nem "0/5" nem "—" — a frase da escada cobre); a energia do overlay nunca aparece como "⚡0/5" (mesmo piso da 13.7) | a 13.2 previa "só com ≥ 1 feita" sem dizer o que vai no lugar; o "—" desenhado ficou ambíguo ("nada ainda" × "quebrado"); a energia zera todo dia e é dívida do dia | modal final (15/09/2026); `DECISOES-WIREFRAME.md` §16 V1 e V3 | manter o "—" / mostrar "⚡0/5" | se a ausência da linha for lida como widget quebrado (suporte), volta um sinal neutro sem dígito |
| 13.17 | **O badge de pendentes do overlay de desktop perde o dígito** — "✅ Today's tasks ›", sem número; a lista diz o resto | o número de pendentes é "quantidade que falta" (PRINCÍPIOS §12; a mesma regra que o widget já cumpre) | modal final (15/09/2026); `DECISOES-WIREFRAME.md` §16 V2; guarda (e) do Fora do app | manter o badge de pendentes / trocar por total registrado no dia | se a pessoa deixar de abrir as tarefas por não saber que há pendentes (medir toques no botão) |
| 13.18 | **A copy dos widgets Android é só em INGLÊS** — a escada de frases, o contador e o chat; nada de PT no widget (⚠️ diverge do `CLAUDE.md` › Idioma, que pede PT e EN pela bridge — o dono decidiu a exceção; o `CLAUDE.md` precisa registrar) | hoje a escada é só PT (hardcoded) e o chat só EN; o bridge não leva idioma | modal final (15/09/2026): "Faz só EN"; `DECISOES-WIREFRAME.md` §16 V4 | estender o bridge com `language` e ter PT e EN | se o público do APK for majoritariamente PT e a home screen em inglês gerar estranhamento (avaliações), reabre |
| 13.19 | **O funil ganha um REVEAL DEMO**: as 6 perguntas do ritual valem para todo mundo; o demo vê o reveal da leitura com a OFERTA (13.1: card dispensável, largura parcial, "agora não" com peso de primário); a criatura própria (sprite, árvore) só pagando — é ALI que a 13.1 acontece | a 13.1 não tinha superfície: o reveal era só do caminho pago e o demo escolhia personagem (D3) | modal final (15/09/2026); `DECISOES-WIREFRAME.md` §17 V1; product-designer #7 do Oráculo | represar a 13.1 / oferta no `CHOICE_STEP` (posição do guarda) | se a conversão no reveal demo for menor que a do pós-value-moment (a mesma régua da 13.1), sai |

**Decididas em 14–15/09/2026, nos checkpoints da Home, de Atividades, de Rituais, da Evolução, dos Jogos e da Loja, e no modal final da meta autônoma:** 13.6 a 13.14 (nos checkpoints; a 13.14 no modal de abertura da meta) e 13.15 a 13.19 (no modal final de 15/09/2026, com as respostas aos pendentes dos 13 canvases; ver `docs/design/DECISOES-WIREFRAME.md` §5–§7 e §10–§17). Também no modal final, sem virar regra: o "0" grande do primeiro uso fica como o código; a lista do Social fica lista (T11); a ordem da página de Configurações fica; `CONTA-13` fora; o widget E sem piso; o "voltar" entra na 1ª pergunta do ritual.

**Não decidido aqui:** nada disto muda regra de jogo (`02-REGRAS-DE-NEGOCIO.md`); muda
superfície. Quem implementa passa pelo guarda dono (constância para 13.2/13.5, sustento para
13.1, permanência para 13.3/13.4) e pelo `soulmon-guarda-linha-vermelha`.


---

## 14. As decisões do dono de 21/09/2026 — narrativa, PI e a trava de crise

Saíram da rodada da SQUAD-NARRATIVA (a bíblia `docs/NARRATIVA-E-UNIVERSO.md`, o
pacote `docs/NARRATIVA-COPY.md`, três pareceres bloqueantes e a crítica
adversarial). Quatro perguntas foram ao dono; as quatro voltaram decididas.

### 14.1 A marca `Soulmon` fica — o nome é do app e dos personagens próprios

**A medição, que continua verdadeira e não é o que ficou decidido:** existe uma
criatura da Bandai chamada Soulmon (Champion, tipo Fantasma, atributo Virus),
listada na enciclopédia oficial (`digimon.net/reference_en`), verificada na
fonte em 21/09/2026. O parecer de PI classificou como risco alto pela
convergência de sinais: v-pet, atributo vírus/dado/vacina, escada
rookie→champion→ultimate→mega.

**A decisão:** *"Soulmon é o nome do nosso app e personagens próprios, não da
Bandai."* O nome **fica**, e a proposta P8 está fechada.

**Por que isto está registrado assim, com a medição junto:** para nenhuma
sessão futura reabrir o assunto como se fosse novidade. O achado não some
porque foi decidido; ele fica aqui como o que já se sabia quando se decidiu. Se
o gatilho de revisão vier — uma notificação de loja, uma reclamação de PI —, a
conversa começa deste parágrafo, não do zero.

**Alternativa que perdeu:** trocar o nome antes de submeter a loja, ou levantar
anterioridade (INPI/USPTO) primeiro. **Gatilho de revisão:** qualquer
comunicação formal de titular ou de loja.

### 14.2 A trava de crise do chat ganha caminho: diretório externo + serviços locais

**Contexto:** o parecer clínico achou que `functions/api/chat.js` — a única
superfície onde a pessoa escreve texto livre e íntimo, respondida por um modelo
de 8B sem revisão humana — não tinha **nenhuma** instrução sobre autolesão. Pior,
a persona é definida como alguém que sofre quando a pessoa não cuida dela, o que
torna previsível a frase mais perigosa possível ali: *"não faz isso, e eu?"* —
culpa como dissuasor, que é o conteúdo de "sou um peso" na forma mais direta que
este produto consegue produzir.

**A decisão:** entra o diretório `findahelpline.com` (resolve por país; é o que
Apple e Google usam) **mais** os serviços locais do público real — CVV 188 no
Brasil, 988 nos EUA/Canadá, 116 123 no Reino Unido/Irlanda.

**A regra dura que acompanha, e ela não é negociável:** a lista é **curada,
estática e humana**, e **nunca** sai do modelo. Um `llama-3.1-8b-instant`
alucina número de telefone com facilidade, e número alucinado numa tela de crise
pune quem teve a coragem de pedir ajuda. A cláusula SAFETY do system prompt
proíbe explicitamente o modelo de citar número, serviço ou site.

**Alternativas que perderam:** só os serviços locais (deixaria sem caminho quem
está fora de BR/US) e manter só a frase genérica (transfere a pesquisa para quem
está no estado em que iniciativa e função executiva estão mais comprometidas —
o parecer foi explícito em recusar).

**Onde mora:** a frase e os links no `ChatBox`, e não nas Configurações, porque
quem está mal às 2h da manhã não navega até lá. Discrição é requisito clínico:
aviso de crise proeminente numa tela de bichinho virtual estigmatiza e assusta o
uso normal.

### 14.3 O reencontro continua por FAIXAS de ausência (WP2.7 mantido)

**A decisão:** as faixas de `welcomeBack.ts` ficam. O WP2.7 continua valendo:
*continuar* e *voltar* não são a mesma coisa.

**A alternativa que perdeu:** colapsar tudo numa frase idêntica em 2 e em 40
dias, pedida pelo critério (e) do parecer clínico e sustentada pelo sensório da
bíblia (§5.10: a criatura não tem órgão que leia tempo decorrido).

**O que mudou de fato, e não dependia desta decisão:** as frases das faixas 2 e
3 diziam *"Quanto tempo!"*, *"Senti saudade esses dias"* e *"Eu estava aqui,
esperando"* — e saíram. O cabeçalho do arquivo já proibia mencionar o que ficou
para trás, e elas obedeciam ao pé da letra; o que mencionavam era **tempo** e
**espera**. A culpa não precisa de número: vem da cena. A trava fechou a
contabilidade e deixou a iconografia aberta.

**Consequência declarada:** a saudação de retorno passa a ser a **única** exceção
ao sensório — ela varia com a ausência porque é voz do PRODUTO lendo um dado do
save, não a criatura lendo tempo. Nenhuma frase dela pode dizer, sugerir ou
encenar a duração. **Gatilho de revisão:** se alguma frase futura voltar a
encenar espera, a decisão volta à mesa.

### 14.4 Os nomes de propriedade intelectual ficam todos como estão

**A decisão:** *"nenhum, aceito todos assim."* Ficam `Vírus/Dado/Vacina` como
rótulo, `Glitchtama`, `Serah`, `Pyraka` e `Zeed`. As propostas **P1, P5, P9 e
P10 estão fechadas**.

**O que isso muda no que já existe:** `Ruptura / Trama / Guarda` deixam de ser
proposta de rótulo e passam a ser **vocabulário de MUNDO** — servem para
escrever lore sobre o que cada galho é, e não substituem o texto da interface. A
régua `src/narrativa.contract.test.ts` foi reescrita: a tabela deixou de se
chamar `DÍVIDA` (pendência a quitar) e passou a `EXCECOES` (o que ficou, por
decisão registrada).

**O que a régua continua travando, e é por isso que ela sobrevive à decisão:**
os termos que **nunca** foram aceitos — `tamer`, `domador`, `treinador`,
`digievolução`, `mundo digital` — e o espalhamento de um termo aceito para um
arquivo **novo**. A decisão foi "fica como está", não "use à vontade": arquivo
novo é escolha nova, e ela passa a ser visível em vez de silenciosa.

**Gatilho de revisão:** o mesmo de 14.1 — comunicação formal de titular ou de
loja, ou reprovação de ficha.
