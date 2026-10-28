# Registro de decisões — o que a pesquisa disse, o que fizemos com isso, e como saberemos se erramos

> Termos renomeados em 29/09/2026: vírus→poder, dado→harmonia, vacina→benevolência (§14.5). O texto histórico abaixo mantém os nomes da época.

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
>
> **Regra do rastro (22/09/2026, QA Rodada 2 `05` §3.2):** todo **provisório** da fila do dono
> (`PERGUNTAS-DO-DONO.md`) que muda **código, regra de dinheiro ou texto legal publicado** ganha
> uma linha aqui com a etiqueta **`[provisório #N]`** no mesmo commit que o aplica — é o que torna
> o "se mudar" executável. Sete provisórios da Rodada 1 (#40, #42 incl. o bump de `TERMS_VERSION`,
> #43, #45, #46, #47, #50b) foram aplicados sem esse rastro; ficam para o próximo `/manter-docs`.
> A primeira linha com a etiqueta é a #55 (§5.4).
> 3. **Saber onde estamos expostos**: a §8 lista as decisões que não têm evidência
>    nenhuma além da nossa própria tese.
>
> **Até 20/10/2026, nada aqui era dado do Soulmon**: ninguém nunca usou o app em produção
> (`docs/STATUS.md`; ⚰️ premissa vencida em 20/10/2026, quando o app entrou em teste fechado na Play e passou a haver dado e usuários reais — ver §148). Até aquela data, toda afirmação sobre "o usuário" era hipótese informada por
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
| **18+ é o ICP, não só defesa legal — a persona adolescente SAI dos check-ups** (21/09/2026) | 🧭 dono, QA GERAL #15. O muro `MIN_AGE_YEARS = 18` (`src/utils/consent.ts`) barra a persona nº 1 do check-up de ago/2026 ("adolescente com TDAH que some e volta", `docs/STATUS.md`); o público que "cresceu com Digimon/Tamagotchi" (`PLANO-PRODUTO.md` Parte 3) tem 25–40 em 2026 | Manter o muro como defesa legal (LGPD art. 14 + Play Families) e continuar testando com adolescente — duas fontes para o mesmo público | `MIN_AGE_YEARS`; `docs/reviews/2026-09-21-qa-geral/08-produto-maestro.md` §2 | ✅ decidido. **Gatilho de revisão:** o 1º dado real de idade (ficha da Play ou telemetria de faixa) mostrar demanda menor de 18 que o muro barra |
| **Criação única, com a base inteira e sem vencedor estrutural — 3 loops de calibração** (28/09/2026) | 🧭 dono: "que o personagem seja único, aproveite toda base que temos tanto do class-system quanto do bestiário, seja resultado dos dados do user, mantenha uma lógica de evolução com flexibilidade e balanceamento para que todos elementos, classes, etc, tenham chances proporcionais". Loop A mediu (N=400, pipeline real): família visual 13/44 (Canino 28%); companheiro 12/32 (top 5 = 80%); 8 elementos com razão 5,4×; harmonia 46%; 79% das evoluções presas numa família; tupla visível colidindo em 74%; "Cão" 10% por ter mais variantes no pool; 7 das 79 classes nunca apareciam | Deixar como estava; reescrever as perguntas do ritual (texto é território da narrativa); fundir os sistemas de 8 e 17 elementos; subir `sombra` na leitura base (quebraria o class-system, onde ela já é a mais comum) | `oracle.ts` (`BESTIARY_FAMILY_PULL`: o texto do bestiário vira puxão de 50%, não override; `RITUAL_ELEMENT_SCALE`/`RITUAL_ALIGNMENT_SCALE`: cada resposta pesa igual, derivado das próprias perguntas; `ELEMENT_DOMINANCE_COMPENSATION`: só no rótulo de 8), `axes.ts` (`ALIGNMENT_COMPENSATION` +0,5/−1/+0,5), `ficha/buildSheet.ts` (`ALIGNMENT_SCHOOL_WEIGHT` 0,15: o caminho alimenta bênção/maldição pra todos), `pipeline.ts` (companheiro capturado pela ficha MEGA), `bestiary/select.ts` (`LINEAGE_PROXIMITY_WEIGHT` 0,5; sorteio igual por `especieDe`). Depois (900 perfis, 3 seeds): elementos 1,13×; caminhos ~36/36/28%; 44/44 famílias (topo 7%); 32/32 companheiros (top 5 = 22%); 78/79 classes; 43% das evoluções atravessam família; tupla visível 95% única. Régua: `criacaoDistribuicao.test.ts` (seed fora da calibração) | ✅ 28/09/2026. **Pendências, sem decisão tomada:** (1) a família do BESTIÁRIO ainda é 55% `besta` porque o pool é 44% besta e só 3 `ave` — conserto é corpus (sync com o repo irmão, `BESTIARIO-PROCEDENCIA.md` §7.1), não regra; (2) `combate_fisico` segue 40% das escolas dominantes porque `tanque` e `fisico` apontam pra ela — o `buildSheet.ts` documenta isso como proporção clássica ~3 dps:1 tanque:1 suporte, correta por design; (3) "Arauto do Fim" exige bênção E maldição ≥12 ao mesmo tempo e ainda não aparece; (4) reinos: akasha ~2% e pântano ~4% (compensação já existe em `REALM_SPLIT_COMPENSATION`, não mexida aqui) |
| **3 loops de revisão do sistema de criação — companheiro exposto na bio; bio×card do Pet não contradizem mais o elemento** (28/09/2026) | 🧭 dono: "faz mais 3 loops de revisão do sistema de criação do soulmon, considerando o uso de todos nossos recursos e objetivos — testes, bestiário, class system, etc". Loop 1 achou `ficha/capture.ts` (companheiro capturável, mecânica real do class-system) calculado e descartado em 100% dos call-sites — mesmo padrão do `ElementPlan`/`ALLOC_FRACTION` já conhecido. Loop 2 rodou o pipeline de ponta a ponta pra 8 perfis sintéticos e confirmou, com texto reproduzido: em ~50% dos perfis a bio do reveal (elemento dominante do sistema de 8) e o card da página do Pet no estágio rookie (elemento dominante do sistema de 17 do class-system, sem NENHUMA reconciliação) nomeavam elementos OPOSTOS pra mesma criatura — rookie é o único caminho que a suíte de cobertura mede sempre caindo no fallback genérico, então é o estágio mais exposto ao bug | Deixar o companheiro morto (contra o pedido "usar todos os recursos"); fundir os dois sistemas de elemento num só (perderia a granularidade de 17 do class-system, que serve pra outra coisa) | `src/utils/oracle.ts` (`companionName` na bio), `src/utils/soulProfile/pipeline.ts`, `src/utils/soulProfile/ficha/fromInput.ts` (`FichaESkills.dominantElement`, achado #2), `src/utils/soulProfile/ficha/classTitle.ts` (`elementoBaseDominante` prefere `dominantElement` quando é um dos 6 elementos compartilhados; planta/industrial sem equivalente seguem sem reconciliação — limite aceito, não os dois sistemas têm os mesmos 8/17 nomes), `src/components/PetPage.tsx`. Réguas novas: `ficha/capture.test.ts`, o novo describe de `ficha/classTitle.test.ts` | ✅ 28/09/2026. **Gatilho de revisão:** se um dia os dois sistemas de elemento (8 do Oráculo, 17 do class-system) forem fundidos num só, este remendo de reconciliação fica desnecessário e pode sair |
| **Bestiário só com entradas ORIGINAIS, 23 grupos; as 4 pendências da calibração fechadas** (28/09/2026) | 🧭 dono: "não faz sentido ter só três aves, será que não houve problema de tag?" + "deve haver fungos, plantas, peixes, insetos, aracnídeos, anfíbios, répteis, monstros, humanoides, robôs, etéreos, mortos-vivos, extraplanetários, vermes, geológicos, elementais, cnidários, mamíferos, demônios, angelicais" + "desative as criaturas geradas no bestiário e vamos utilizar apenas as entradas originais". Achado: NÃO era tag — o corpus irmão não tinha aves (a "fauna real" eram 1.000 combinações de leão/tigre/urso; as aves eram Chocobo/Owlbear, de franquia) e as 732 entradas eram todas variantes geradas de ~42 bases | Consertar só as tags; manter as variantes geradas | `scripts/bestiario-originais.mjs` (41 bases com texto curado) + `scripts/bestiario-catalogo-curado.mjs` (153 criaturas, 23 grupos) → pool de 194, zero variante; `bestiary/select.ts` (vocabulário de grupo em `REALM_TO_FAMILIAS`; sorteio inicial com chance igual por GRUPO; `MIN_BAND_LINHAGEM` 6 + `LINEAGE_PROXIMITY_WEIGHT` 3); `oracle.ts` (`FAMILIA_TO_FAMILY_IDS` + 4 famílias visuais: verme, cnidário, extraterrestre, geológico; `RITUAL_REALM_SCALE`); `axes.ts` (`REALM_SPLIT_COMPENSATION` recalibrado); `ficha/buildSheet.ts` (`ROLE_SCHOOL_BY_ALIGNMENT` + `distribuirEscolas`). Medido (N=800): reinos 10,6–12,4% (akasha/pântano eram 2%/4%); escola dominante 11–21% (combate físico era 40%); 79/79 classes alcançáveis (Arauto do Fim é raro, não impossível); elementos 11,5–14,1%; 24 grupos sorteados (1–10%, o reino decide) e 177/194 criaturas. Réguas: `curadoria.contract.test.ts` (reescrito), `escolaFidelidade.test.ts`, `criacaoDistribuicao.test.ts` | ✅ 28/09/2026. **Gatilho de revisão:** o repo irmão ganhar fauna real — aí o catálogo curado pode voltar a vir por sync |
| **O caminho (poder/harmonia/benevolencia) passa a pesar sobre o elemento — modesto, nunca proibitivo** (28/09/2026) | 🧭 dono: "garanta que as evoluções ainda tenham flexibilidade [...] cada um dos 3 caminhos [tenha] 1/3 dos elementos neutro, 1/3 favorecido e 1/3 dificultado [...] talvez 20% de influência [...] benevolência e sombra [...] mais raro e difícil do que poder+sombra ou benevolência+luz". Antes o único elo era um traço COMPARTILHADO entre `alignments.poder` e `elements.sombra` (nunca suprimia sombra para quem tinha honestyHumility alta) | Coeficiente de traço ad hoc (tentado primeiro: reforçar `(100−honestyHumility)` em `sombra` e subtrair `agreeableness`; media medido: piorou — `poder` já converge para `fogo` via `extraversion`, então `sombra` continuava rara mesmo pra `poder`) | `ALIGNMENT_ELEMENT_AFFINITY` em `src/utils/soulProfile/axes.ts` — tabela declarada (3 favorecidos/3 neutros/2 dificultados por caminho, ×1.15/×0.85), aplicada aos 8 elementos crus antes de `realms`/`classElements`. Régua: `alinhamentoElemento.test.ts` (a assimetria pedida) + `elementoOcorrencia.test.ts`/`classeElementoOcorrencia.test.ts` (nenhum elemento cai abaixo do piso — medido: ±20% derrubava `sombra` de ~10% pra 2,4%, ±15% ficou dentro do piso) | ✅ 28/09/2026. **Gatilho de revisão:** medição real (telemetria) mostrar que a assimetria pedida (benevolência+sombra < poder+sombra e < benevolência+luz) não se sustenta na população de jogadores de verdade, só na simulação sintética |
| **Fase 1 B2 — papel, reino e elemento sem vencedor estrutural também com o teste longo** (28/09/2026) | Auditoria Fase 0 (N=800, seeds 19870412+31415926): papel 1,89× (mágico ~26% × alcance ~11%), reino 2,75× (akasha/floresta ~16% × cavernas/deserto ~7%), elemento 1,79× (completo 2,68×). Etapa A: a divergência com o 1,16× do orquestrador era população (sem os 20 itens) + seed de calibração 20260928 dentro da medição + fatias de n=165–410 com piso de ruído ≥1,5×. Depois: papel **1,42×** (ruído 1,2×), reino **1,36×** (ruído 1,38×), elemento **1,56×** (ruído 1,33×); fatias estruturais N=2400 cada: papel 1,10–1,15×, reino 1,19–1,33×, elemento 1,29–1,35× (`docs/reviews/oraculo-auditoria/2026-09-28-b2.md`) | Uma tabela só para os dois caminhos (o viés tem formas opostas com e sem o teste longo); mexer nos coeficientes de `axes.ts` (mudaria a ficha do class-system junto) | `oracle.ts` › `ROLE_DOMINANCE_COMPENSATION`, `REALM_DOMINANCE_COMPENSATION`, `ELEMENT_PATH_COMPENSATION` (por `CaminhoRitual`) + papel/reino decididos pelo escore não arredondado (empate caía na ordem fixa). Calibração: seed 20260928, N=3000–6000 por caminho | ✅ — gatilho: mudar pergunta do ritual, item do teste longo ou peso de `axes.ts` exige recalibrar |
| **Fase 1 B1 — o grupo `invertebrado` (1 criatura) deixa de existir; o tardígrado vira `verme`** (28/09/2026) | Auditoria Fase 0: grupos do bestiário **58×** — era o piso de 0,1% de um grupo com UMA criatura (tardígrado), não espalhamento ruim. `verme` já tinha a mesma biologia (`Invertebrado`). Depois: 23 grupos, **5,27×** (ruído 1,92×), piso 1,4% (`2026-09-28-b1.md`) | Tirar grupos <6 do cálculo de C4 (esconderia um grupo que o jogador ainda poderia tirar como raridade acidental, sem lore que a justifique) | `scripts/bestiario-originais.mjs` (grupo da criatura) → `pool.json` via `montarPool`; `oracle.ts` › `FAMILIA_TO_FAMILY_IDS.verme` herdou `myriapod` | ✅ — gatilho: grupo novo com <6 criaturas reprova `curadoria.contract.test.ts` |
| **Fase 1 B2b — ficha, bestiário e reveal leem o MESMO papel/reino da criatura** (28/09/2026) | Depois de B2, `applyRitualAnswers` (ficha, companheiro, bestiário, linha do reveal) ainda decidia papel/reino SEM a compensação — duas regras para o mesmo número (footgun 9). Com a mesma compensação: grupos 5,27× → **4,67×**, famílias visuais 27× → 12,5× (ruído 4,75×), espécies 181 → 186/194. ⚠️ Custo medido: escola dominante (C3) **2,47× → 3,14×** — o equilíbrio de escolas dependia do papel enviesado (mágico ~26%); vermelho registrado, recalibração da escola fica para depois (`2026-09-28-b2b.md`) | Manter as duas regras divergentes para preservar C3 (criatura com papel X e ficha/inspiração de papel Y) | `ritualAnswers.ts` › `applyRitualAnswers(axes, answers, caminho)` — só os DOMINANTES levam a compensação; os shares que a ficha usa não mudam | ✅ — C3 aberto |
| **Fase 1 B3 — grupos do bestiário e famílias visuais com peso empírico** (28/09/2026) | Depois de B2b: grupos 4,67× (demônio/mamífero no topo, aracnídeo/molusco no piso) e famílias visuais estruturais (N=2400) **4,59×** (Yokai/Abelha 3,3% × Primata 0,7%). A frequência com que um grupo/família ENTRA na faixa depende do catálogo (quantos reinos o listam, puxões do bestiário e dos motivos), não da pessoa. Depois: grupos **1,8×** (ruído 1,92×; estrutural 1,6×), famílias estruturais **2,58×** (ruído 2,35×), topo 2,0% (`2026-09-28-b3.md`) | Mexer em `MIN_GRUPOS`/`REALM_TO_FAMILIAS` à mão (muda quem entra na faixa, ou seja, a leitura — e não fecha a conta: o viés vem de vários puxões somados) | `bestiary/select.ts` › `GRUPO_PESO` (sorteio do grupo dentro da faixa) + `oracle.ts` › `FAMILIA_PESO` (multiplica o peso inverso de `pickFamiliaCompensada`). Calibração: seed 20260928, N=4000 (grupos) e N=2400 × 7 iterações (famílias) | ✅ — gatilho: criatura/grupo/família nova exige recalibrar os dois pesos |
| **Fase 1 B5 — C9 medido: o comportamento quase não muda o resultado; mecânica fica para a Fase 3** (28/09/2026) | Primeira medição de C9 (`2026-09-28-b5.md`, 4000 pares, mesma leitura, Constante × Explosivo, mesmas categorias de tarefa): Oráculo (família, linhagem do bestiário, nome, companheiro, skills) **0%** diferente — `OracleInput` não tem campo de comportamento; galho final da mega **14,0%**; caminho de galhos **41,4%**; o ritmo só pesa nos **21,5%** de decisões com empate de atributo. Referência: atributos independentes dão 68,9% — quem diverge é a categoria das tarefas, não o ritmo | Inventar mecânica de trajetória agora (desenho de mecânica é Fase 3, plano §8) | `scripts/oraculo-auditoria.test.ts` › `c9` (usa `computeCarePattern`/`resolveBranch`, as mesmas da cerimônia) | ⚠️ KR2 vermelho, registrado — Fase 3 |
| **Bestiário = corpus do Besti-rio- direto, SEM allowlist de PI** (06/10/2026) | 🧭 dono: "pode sincronizar com o corpus inteiro, mas sem allowlist que restrinja" (depois de o risco de PI ser posto na mesa duas vezes). Reverte 27/09 (allowlist de procedência) e 28/09 (só originais curadas). Medido: 14.333 fichas no corpus; 6.507 elegíveis pelo contrato de qualidade do próprio repo irmão (confiança alta, descrição real, elementos) e únicas por nome; **6.126 de 6.709 são variantes procedurais** e **5.589 não têm família** (o vocabulário de 24 grupos de 28/09 não existe no upstream; `select.ts` já agrupa por `familia ?? especieDe(nome)`); **nenhuma criatura tem `marcial`**; `pool.json` 3 MB em chunk próprio sob demanda | Manter a allowlist; trazer só a parte sem franquia | `scripts/sync-oracle-data.mjs` seção 2 (`BESTIARIO_DIR`, `SO_BESTIARIO=1`; descrição cortada em 200 caracteres porque só alimenta o palpite de família e nunca é exibida), `bestiary/curadoria.contract.test.ts` (reescrito: contrato do motor, com a lacuna `marcial` declarada), `bundleSemFranquia.contract.test.ts` e `sprites.dungeonRoster.test.ts` (o chunk `pool-*.js` é a ÚNICA exceção, e o bundle de entrada não pode conter o pool), `combatFx.ts` (`lava`/`gelo`/`veneno`). O nome da criatura-inspiração segue indo só na 1ª tentativa (D-B1) | ✅ no branch, **sem merge** — publica texto oficial de terceiros em produção. **Gatilho de revisão:** reclamação de titular, parecer da Play, ou o bundle do pool pesar no D1. **Pendências:** calibração de grupos/famílias (`GRUPO_PESO`) foi feita para o pool curado e não foi refeita; conserto de `marcial` é corpus |
| **Bestiário = corpus completo MENOS as procedurais, enriquecido ficha a ficha** (06/10/2026, 2ª decisão do dono no dia) | 🧭 dono: "incluir tudo, menos as procedurais" e "traga elementos e descrição física de todos". Corpus 14.333 → 6.500 procedurais (origem "Geração Procedural" ou nome `<Prefixo> X de <Elemento>`) fora → **7.386 únicas**. 80% delas vinham SEM elementos e muitas com descrição inútil (o "Cattiva" do Palworld vinha descrito como um filme italiano de 1991). Cada ficha foi escrita À MÃO por agente (elementos 1–3 dos 17, grupo dos 23, descrição física em inglês ≤220), validada por lote (formato, vocabulário, zero frase repetida, zero duplicada); uma 1ª tentativa por template foi REPROVADA (13 criaturas com a mesma frase de equipamento) e refeita | Manter o corte de qualidade (só 20% teriam elemento); deixar as descrições oficiais | `scripts/data/bestiario-enriquecimento.json` (as 7.386 fichas), `scripts/sync-oracle-data.mjs` seção 2, `pool.json` (**3 MB**, `descricao` = física, nunca o texto oficial), `bestiary/select.ts` (`LINEAGE_PROXIMITY_WEIGHT` 3→**1,1**; janela estreita 1,0–1,2: 0,8→77% atravessam, 1,5→22%), `curadoria.contract.test.ts`, `arena.ts` (`pickEnemyCreature`: sorteio ESTRATIFICADO por elemento do inimigo, aprovado pelo dono) | ✅ no branch, **sem merge**. **Efeitos medidos:** sem estratificar, o spread entre os 17 elementos do jogador foi de 22pp (pool antigo) para **34pp** (vida em 18% das criaturas; vida/terra/gravidade −9pp, vigor/luz/espaço +6–11pp). Com o sorteio estratificado: **13,4pp** (56,0%–69,5%, média 63,4%), melhor que o pool antigo; piso do ganho da torcida segue 0,20; `marcial` coberto; todos com grupo; `GRUPO_PESO` não foi recalibrado para este pool; confiança do agente (2.032 alta · 4.547 média · 807 baixa) não decide nada. **Gatilho:** reclamação de titular, parecer da Play, ou rever o balanço da Arena |
| **Fase 1 B6 — ponte 8→17: cobertura de SAÍDA dos elementos da ficha** (28/09/2026) | A régua existente (`classeElementoOcorrencia.test.ts`) trava a ENTRADA (`classElements`), não o elemento dominante da ficha que `buildFicha` monta. Medido (seed 19870412, N=2000, elemento BASE com mais pontos): **17/17 alcançáveis** no rookie e no ultra. Fatia mínima: rookie `gravidade` **0,1%** (2/2000), ultra `vileza` **0,4%** (8/2000); maior fatia rookie `fogo` 19,8%, ultra `sombra` 16,3%. Com N=300 sumiam `gravidade` (rookie) e `vileza`/`vigor` (ultra) — alcançáveis, mas raros | Recalibrar agora para achatar a cauda (fora do escopo de B6: régua, não ajuste; a calibração é seed 20260928) | `soulProfile/ficha/ponte8para17.test.ts` (17/17 por estágio + teto de 22% no topo) | ✅ — gatilho: cauda <0,5% (gravidade/vileza/vigor/som/espaço) é candidata a revisão se a paridade de saída virar meta |
| **Fase 1 B4 — nome da criatura sempre carrega algo do nome da pessoa** (28/09/2026) | Depois de B3: colisão de NOME (C8, excluindo os 6 prontos) **2,25%** sobre 800 nomes, acima do alvo ≤2%. Causa: o padrão radical + coda (20% dos nomes) não tinha nada pessoal — o espaço era só radicais × 12 codas. Depois: o padrão virou radical + consoante da sílaba pessoal + coda (Aquamis, Thornedix) e a colisão caiu para **1,75%** (`2026-09-28-b4.md`); tuplas visíveis únicas 94,4% | Aumentar só os bancos de radical/coda (mais bits genéricos, mas o padrão continuaria sem identidade) ou sufixo fixo (vetado pelo CLAUDE.md) | `oracle.ts` › `baseName` (3º padrão de `patternRoll`); `NAME_CODAS_AFTER_VOWEL` saiu. Validado nas seeds 19870412/31415926 | ✅ — gatilho: C8 voltar acima de 2% |
| **Fase 1 B7 — classes e criaturas "nunca sorteadas" são ápice raro, não buraco** (28/09/2026) | O b3 (N=800) listava 11 criaturas nunca escolhidas; o plano citava 2 classes (`arauto_do_fim`, `demiurgo_absoluto`). Probabilidade EXATA por pessoa (réplica de `sortearPorGrupo`), N=3000 × 2 seeds: **194/194 criaturas com p > 0**, as 11 entre 0,13% e 0,45% (uniforme 0,515%) → chance de 0 em 800 de 3% a 36% cada. Classes: 79/79; arauto 0,27%/0,18%, demiurgo 0,05%/0,03% das fichas mega+ultra (`2026-09-28.md` § Fase 1 B7) | Subir o piso das raras (peso por criatura, ou alargar `BAND_WIDTH_NO_GRUPO`): o piso vem de `GRUPO_PESO.mamifero` = 0,44 dividido entre 18 criaturas, e mexer desfaz o grupo 1,8× do B3 | Nada muda em código: `bestiary/select.ts` e `GRUPO_PESO` ficam. Calibração seed 20260928, validação 19870412 | ✅ — gatilho: p = 0 numa réplica exata, ou classe ausente em 6000 fichas |
| **Fase 1 B8 — escola dominante: a tabela papel×caminho supunha eixos independentes** (28/09/2026) | Depois de B2b (#147/#149) papel e caminho saem CORRELACIONADOS (suporte↔benevolência 134, físico↔poder 109, mágico↔harmonia 107 de 800). Como o piso de liderança faz a escola dominante ser SEMPRE `ROLE_SCHOOL_BY_ALIGNMENT[papel][caminho]`, C3 foi a 3,14× (bênção 25,5% vs evocação 8,1%); `ALIGNMENT_SCHOOL_WEIGHT`/`DOMINANT_SCHOOL_LEAD` não mexem no topo (medido: composição idêntica à tabela). Troca de 2 células: tanque/benevolência bênção→**evocação**, alcance/poder longo alcance→**maldição**. Validação 19870412+31415926 (N=800): **1,44×** (13,5%–19,4%, ruído 1,25×); seeds 20260928+777: 1,32× (`2026-09-28-b8.md`) | Recalibrar os pesos (não é a causa: o topo é a célula), ou descorrelacionar papel e caminho (reabre o B2b) | papel/reino/elemento/caminho idênticos ao b5; `escolaFidelidade.test.ts` espelha a tabela nova. Efeito colateral: Jardineiro Eterno (jardim_eterno 15 + bênção 12) não saiu em 800 (78/79 classes) — bênção dominante caiu de 25,5% para 16,8% | ✅ — gatilho: C3 > 2× numa auditoria, ou Jardineiro Eterno ausente em 6000 fichas (régua do B7) |

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
| **Cobrança na web (Pix/cartão) entra DEPOIS do 1º usuário real e antes de qualquer marketing** (21/09/2026) | 🧭 dono, QA GERAL #17. O plano mandava "priorizar o funil web" (`PLANO-PRODUTO.md` Parte 3) e o código não cobra na web: `playBilling.ts` devolve `'unavailable'`, `functions/api/_billing.js` só tem `PRODUCTS` (Play) e `STEAM_ITEMS` — 0 hits de Stripe/Mercado Pago/Pix. Receita possível hoje = 0 em todas as superfícies | (a) Cobrar na web antes da Play — infra antes de usuário; (b) "nunca" — apagaria a frase de priorização | `PLANO-PRODUTO.md` Parte 3 (nota corrigida em 21/09/2026: a frase é meta de margem, não estado) | ✅ decidido. **Gatilho:** o 1º usuário real; se virar "nunca", apagar "priorizar o funil web" |

| **[provisório #55] Cota de chat por tier — demo 30 / paid 120 por dia; sem SKU recorrente, sem modelo acima do 8b** (22/09/2026) | `03-negocio-pesquisa-r2.md` §0.5: com o 8b e teto 120/dia a cauda do chat custa R$ 0,5–1/ano/conta (teto R$ 11/ano) — a compra única **sustenta**. O único cenário que a quebra é **trocar o modelo** (×60); e `AI_LIMITS.chat.perAccount` era igual para demo e pago: 1.000 demos no teto = R$ 950/mês, receita zero, alcançável por `curl` com conta grátis | Cota única para todos (o que havia); assinatura para cobrir IA (fica na linha "Assinatura recorrente" acima, ⏸️) | `functions/api/_aiGuard.js` › `AI_LIMITS.chat` (por tier); `PERGUNTAS-DO-DONO.md` #55 | ✅ **provisório aplicado, aguarda o dono.** Regra que fica até ele dizer o contrário: **não existe SKU recorrente e o modelo de chat não sobe do 8b** sem reabrir esta linha e a economia da Parte 3 do `PLANO-PRODUTO`. **Se mudar:** outro número = 2 constantes; modelo maior = refazer o custo antes |

#### O modelo de receita decidido em 22/09/2026 (pergunta **#55**)

O dono fechou o modelo. Isto é **registro de decisão, não autorização de
código** — nada disto foi implementado, e a ordem é explícita: **construir
DEPOIS do E0**.

| Peça | O que é |
|---|---|
| **Entrada** | **compra única de R$ 29,90** — o jogo inteiro + as 11 formas. Segue sendo o produto principal e não é assinatura disfarçada |
| **Assinatura de IA** | **R$ 9,90/mês com 300 mensagens**, **só texto e voz**: chat melhor, sugestões de tarefa, transcrição |
| **Fora da assinatura** | **o sprite**. Geração de imagem tem custo por unidade que 300 mensagens não pagam — continua no teto vitalício (`_aiGuard.js` › `AI_LIMITS.sprite.perAccountLifetime`) e nos Créditos |
| **Estourou a cota** | **compra créditos**. Não há degradação silenciosa nem cobrança automática por excedente |
| **Cortesia** | **1º mês grátis para quem comprou o desbloqueio** — quem pagou os R$ 29,90 não descobre um segundo paywall no dia seguinte |
| **Quando** | **depois do E0**. Até lá vale o teto por tier aplicado como provisório (demo 30 / paid 120 por dia, linha acima) |

**Por que esta e não outra** — as duas alternativas que perderam:

- **Só assinatura** (sem compra única): atravessa a linha de que o produto
  é comprado, não alugado, e criaria a pergunta "o que acontece com a minha
  criatura se eu parar de pagar?" — a resposta honesta ("nada, ela fica")
  esvazia a assinatura, e a desonesta ("você perde") quebra o princípio de
  que **cancelar não remove nada** (as 3 travas da linha "Assinatura
  recorrente" acima).
- **Só créditos** (sem SKU recorrente): é o que existe hoje. Faz o custo
  variável de IA aparecer como micro-decisão de compra a cada uso — o
  usuário passa a **contar** antes de conversar, que é o oposto do vínculo
  que o produto vende. Os créditos ficam, mas como **válvula de excedente**,
  não como a porta principal.

**O que dispara revisão desta decisão** (os dois gatilhos, escritos antes do
dado existir):

1. **O custo do modelo de chat mudar.** A conta que sustenta R$ 9,90 por 300
   mensagens assume o 8b (`03-negocio-pesquisa-r2.md` §0.5: R$ 0,5–1/ano/conta
   no teto de 120/dia). **Trocar o modelo multiplica por ~60** e a assinatura
   passa a dar prejuízo — refazer a conta ANTES de trocar, nunca depois.
2. **O E0 mostrar que ninguém usa o chat.** Se os 10 convidados de 14 dias
   praticamente não conversarem, a assinatura cobra por uma coisa que ninguém
   quer: ela não se constrói, e o custo de IA deixa de ser problema por
   evaporação da demanda. **O E0 é o instrumento** — por isso a ordem "depois
   do E0" não é falta de sequenciamento, é a condição do dado.

**Ponteiros:** `docs/PLANO-PRODUTO.md` Parte 3 ·
`docs/manual/01-VISAO.md` §8 · `docs/PERGUNTAS-DO-DONO.md` #55 ·
`src/utils/monetization.ts` (comentário-ponteiro apenas — **nenhum SKU novo**).

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
| **Guilda — G1: o fio é firmado pela meta de CORAÇÃO** (`heartGoalFor`, 60% de `dailyGoalFor`), não pela meta inteira (29/09/2026) | `02-psicologia.md` §2.1 e `05-servidor.md` §3: a Guilda não pode cobrar mais que o próprio app cobra para não perder coração; com a meta inteira, o dia parcial (o dia real de quem tem TDAH/depressão) nunca firma, e os prazos do Bosque em `07-balanceamento.md` pioram | Meta inteira (`dailyGoalFor`, letra de D-G2) | `functions/api/_coop.js` › `META_DO_FIO = 'heart'` / `metaDoFioCumprida`; cliente `App.tsx` (`heartGoalFor`) | ✅ **CONFIRMADO pelo dono em 29/09/2026** (modal; antes era "adotado por padrão da sessão de implementação, aguarda confirmação"). **Gatilho de revisão:** D30 de membros de guilda menor que o de não-membros (AG1, `PLANO-GUILDA.md` §16) ou dado de que o dia parcial firma tão fácil que o Bosque cresce sem esforço; reverter = `META_DO_FIO = 'full'` (e o cálculo do cliente). Achado A-2 de `docs/reviews/guilda/qa/L3-conformidade.md` |
| **Guilda — Feira: UM SPRITE PRÓPRIO POR TIPO de fenômeno, com 3 estados cada** (29/09/2026) | 🧭 dono (modal). Quatro tipos semanais (névoa, maré, estática, enxame) com 3 estados (aberto, ferido, dissipado) = **12 sprites** `fair-fenomeno-<tipo>-<estado>`; o desenho anterior tinha 1 sprite genérico de "lajes" + 4 `fx-fair-*` (`docs/design/areas/prompts/arena.md` §5–§6). Custo: **+9 ativos** e ~+27 imagens estimadas | Sprite genérico único (3 estados) + FX por tipo: mais barato, mas a semana do fenômeno só se distinguia por um FX de 128 px | `docs/design/areas/prompts/arena.md` §5; `docs/PLANO-GUILDA.md` §9/§12; código futuro: `src/utils/fairArt.ts` › `FAIR_ART` passa a mapa por tipo×estado (hoje só `fair-fenomeno-<estado>`) — **não implementado** | ✅ decidido; arte não gerada. **Gatilho de revisão:** o conferente reprovar os 4 tipos por silhueta parecida (voltar ao genérico), ou o enxame sair lendo como inseto |
| **Admin/GM — adoção do corvinho AUTOMÁTICA na primeira abertura como administrador e SEM VOLTA** (29/09/2026) | 🧭 dono (modal). `adoptCorvo` (`src/utils/corvoPet.ts`) já marca `soulmonMeta.creature` uma vez; a decisão fecha a pergunta de oferecer/desfazer | Convite com escolha, ou botão de devolver o corvinho e voltar à criatura do oráculo | `src/utils/corvoPet.ts` › `adoptCorvo`, `isCorvo`; `docs/reviews/admin-corvo/` | ✅ decidido. **Gatilho de revisão:** o dono pedir para jogar como jogador comum na mesma conta (então a alternativa é uma conta sem `ADMIN_EMAILS`, não um desfazer). O **ultra do corvinho fica como está** (P&B, sem mais textura — `arte-notas.md`) |
| **Admin/GM no PvP: ACEITAR como está — dívida M-3 conhecida** (29/09/2026) | 🧭 dono (modal). `L1-sustento.md` M-3: a ação `profile` de `community.js` confia em `stage`/`unlockedStages`/`attrs` do cliente, então forma e atributos fabricados pelo GM aparecem a outros jogadores; o ganho de tirar o administrador do PvP não paga o custo agora | Tirar o admin do PvP/diretório ou validar `stage`/`attrs` no servidor (mesma família de M-3 do plano de PvP) | `functions/api/community.js` ação `profile`; `docs/reviews/admin-corvo/impl-notas-backend.md` §"Dívidas registradas" | ✅ aceito como dívida, **sem mudança de comportamento**. **Gatilho de revisão:** primeiro PvP em que um perfil fabricado seja notado por outro jogador, ou o PvP ganhar recompensa |
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
| **Camada 3 CONGELADA até 10 usuários × 14 dias de dado** (21/09/2026) | 🧭 dono, QA GERAL #13. Camada 3 = o que está ACIMA do núcleo tarefas→cuidado→evolução: Steam, coop, som novo, arte extra, narrativa. `PLANO-PRODUTO` Parte 5 mandou "só isso" há 5 semanas e a Camada 3 ganhou som, arte, torneio por season e coop enquanto a Camada 1 continua sem gerar moeda (`08-produto-maestro.md` §"Já coberto, NÃO corrigido") — drift sem registro | Continuar a Camada 3 e registrar o contrário (o que não pode é drift sem decisão) | `docs/reviews/2026-09-21-qa-geral/08-produto-maestro.md` item 8; `PERGUNTAS-DO-DONO.md` #11/#13 | ✅ decidido. **Gatilho de revisão:** 10 usuários conhecidos (PWA) com 14 dias de dado cada (`METRICS_ADMIN_KEY` + `scripts/metrics-report.mjs`). **Exceção registrada (22/09/2026, QA Rodada 2 `05` §3.1):** `docs/BOOKLET-UNIVERSO.md` (`959e3bee`, 1 084 linhas de narrativa PT+EN) entrou em 22/09 **sob o congelamento** — é "narrativa", que esta linha lista. Fica como **exceção**: é doc de jogador derivado da bíblia, **sem asset, sem código, sem regra**; não abre precedente para som/arte/coop/Steam. Se o dono não a aceitar, o booklet é datado como pós-E0 e sai do MAPA §6.2 (etiqueta plano) ⚠️ **Exceção registrada (29/09/2026, ordem do dono): a GUILDA (Bosque + Feira, `docs/PLANO-GUILDA.md`) entra em execução sob o congelamento.** Diferente do booklet, esta exceção É de código e regra (evolui o coop, listado acima): o dono ordenou implementar, e as decisões G1..G17 do plano valem como a medição disponível na hora. Não abre precedente para som/arte/Steam; o gatilho de revisão desta linha continua o mesmo |
| **Teto de bytes re-medido, corte real como tarefa própria** (30/09/2026) | 🧭 dono, modal de 30/09: 're-medir e registrar o novo teto'. JS de entrada 649.474 → 718.798 B e CSS 142.696 → 153.795 B pelo lote da Guilda, administrador, corvinho e mapas (justificativa datada em `src/deploy/orcamentoDeBytes.contract.test.ts`) | Cortar do chunk de entrada agora (risco de regressão na inicialização) ou deixar vermelho | `orcamentoDeBytes.contract.test.ts` (`DIVIDA_ATUAL`) | ✅ decidido. **Gatilho de revisão:** o próximo crescimento acima da folga de 8 KB, ou a correção #2 (auditar o chunk de entrada) |
| **Três prédios em Jogos: Salão de Jogos (Dino + PPT), Ateliê da Mente (Eco, Bolhas do Sonho, Troca de Regra, Picross da Malha, Revisão da Malha) e Refúgio (respiração + bolhas calmas)** (30/09/2026) | 🧭 dono, depois do `docs/BENCHMARK-MINIJOGOS.md`: "Gostei dos 5! mas mantenha o PPT, dino run e a mecânica de pesadelos atuais… um prédio para os jogos livres, outro para os com benefícios cognitivos e outro para momentos críticos como onde respiração". Evidência do benchmark §1: transferência distante ≈ nula (Simons 2016, Melby-Lervåg 2016, Sala & Gobet 2019); FTC × Lumosity 2016; recuperação espaçada = utilidade alta (Dunlosky 2013) | Um lote só com todos os jogos; ou prometer efeito cognitivo na copy | `src/utils/playAreaLots.ts`, `src/components/play/PlaySheets.tsx`, `src/components/mente/`, `src/components/refugio/`, `src/utils/mente/`, `src/utils/refugio/` | ✅ decidido. **Exceção registrada ao congelamento da Camada 3** (como a Guilda): é código e regra, ordenado pelo dono. Regras que valem: os jogos do Ateliê pagam Bits só pelo funil único (`handleEarnGamePoints`, teto `MINIGAME_BITS_PER_DAY`); **o Refúgio não paga, não pontua e não mede nada** e mostra o aviso de ajuda profissional (CVV 188 / 988 / 116 123); nenhuma copy promete efeito cognitivo (teste em `playArea.render.test.tsx`); jogos nascem mudos (R-NOVA). A Corrida do Dino saiu da Exploração para o Salão; a Masmorra e o Pesadelo não mudaram. **Gatilho de revisão:** relato de alguém entendendo o Refúgio como tratamento, ou os jogos do Ateliê virarem fonte dominante de Bits |
| **Masmorra vira DESCIDA IDLE: lutas automáticas, HP que não enche e volta com o tempo, andares infinitos** (08/10/2026) | 🧭 dono: "As dungeons precisam ser mais 'idle'. Tira o botão pra desafiar o oponente seguinte, e o HP do user não enche entre uma run e outra. A cada 6 batalhas ele desce um andar até acabar o HP." Respostas no modal: (a) o HP **recupera com o tempo**, até com o app fechado, e nunca custa coração nem Bits; (b) descida **infinita** até o HP acabar, os 5 andares/Glitchtama viram **marco**; (c) lutas automáticas ≈3–5 s entre uma e outra, com pausar/sair. Evidência: a calibração do combate v3 já tinha a parede no andar 5–6 (mediu 36% / 0%), então "até acabar o HP" termina sozinho (simulação: média 5,35 andares, máx 6, ≤ ~21 min); o teto diário de Bits (`MINIGAME_BITS_PER_DAY`) segue sendo o freio de farm | Manter o botão "Desafiar" e o HP cheio a cada run (o desenho anterior, run de 5 andares); enchimento por Bits/Créditos (vender HP = pay-to-skip e fura a regra de que dinheiro não compra vantagem); regeneração por TICK (não sobrevive ao app fechado e vira spam de cloud save) | `src/utils/dungeonIdle.ts` (constantes + `hpAgora`), `src/components/DungeonGame.tsx`, `GameState.dungeonHp` | ✅ implementado. Constantes **escolhidas pela squad, o dono ajusta**: 4 h zero→cheio, piso 25%, 4 s entre lutas. Duas escolhas de desenho a rever: (1) a cura de ~25% ao limpar um andar **ficou** (é dentro da descida; a parede calibrada, o ofício `curaAndar` e o talento `healBoost` dependem dela); (2) o marco paga ao **limpar** o andar 5 (equivale ao antigo "concluir"), não ao chegar nele. **Gatilho de revisão:** descidas que terminam em < 1 min de jogo ativo (parede cedo demais), jogadores relatando espera como punição, ou o idle virar fonte dominante de Bits |
| **Masmorra paga ×0,4 (`DUNGEON_BITS_FACTOR`)** — Bits por inimigo, bônus de andar (4/6/8/10/12) e o custo de começar mais fundo (16/nível) (30/09/2026) | 🧭 dono, modal de 30/09 sobre o `BALANCO-MINIJOGOS.md` §4: uma run completa pagava 327–417 Bits, 2–3× o teto diário de 150, enchia o teto no 2º/3º andar e zerava os outros jogos no dia | manter; tetos separados por prédio | `src/utils/dungeon.ts` › `DUNGEON_BITS_FACTOR`; `DungeonGame` › `clearBonus` | ✅ run completa ~130–170. Régua: `utils/mente/balanco.test.ts`. A Arena (50 Bits por run completa) foi medida e ficou como está |
| **Folhas dos prédios mostram "Bits de minijogo hoje: X de 150"** (30/09/2026) | 🧭 dono: o teto é compartilhado, e sem a linha o "até N Bits" de cada jogo vira promessa falsa depois do teto | não mostrar | `PlaySheets.tsx` › `BitsHoje` | ✅ texto neutro, sem barra nem cor de alerta |
| **Jogos do Ateliê NÃO rendem Vínculo nem missões; a Revisão NÃO conta como atividade do dia; a Exploração fica só com a Masmorra; bônus do Picross por aparelho** (30/09/2026) | 🧭 dono, mesmo modal (as quatro recomendações) | XP/missão por minijogo; Revisão contando na meta | — | ✅ |
| **Convite ao Refúgio quando o humor do dia for 1–2** (30/09/2026) | 🧭 dono + parecer do `soulmon-behavioral-psychologist`: 1×/dia, 3 dias de intervalo, 7 de silêncio após 2 recusas, antes do aviso de HP, sem citar humor, sem crise no cartão, nada pago/contado, o Refúgio segue aberto a todos no Mapa | Refúgio só pelo Mapa | `utils/refugio/convite.ts`, `RefugeInviteCard.tsx`, fila da Home (`key: 'refugio'`) | ✅ |
| **Números de apoio num dono só (`utils/supportLine.ts`) + diretório internacional (findahelpline.com) e atalho `tel:188` no Refúgio** (30/09/2026) | 🧭 dono (acrescentar o diretório) + parecer do psicólogo (duas cópias do número divergem; número errado em tela de crise pune quem pediu ajuda) | uma cópia por tela | `supportLine.ts`, `SupportNote.tsx`, `ChatBox.tsx` | ✅ |
| **Exploração ganha o Passeio (fundido à Aventura da noite) e as Travessias — desafios da vida real que abrem regiões do mapa** (30/09/2026) — reverte em parte "a Exploração fica só com a Masmorra" | 🧭 dono, dois modais de 30/09 (EXP-1/EXP-6 e MIS-1..MIS-4), sobre `BENCHMARK-EXPLORACAO.md`, `PROPOSTA-MISSOES-EXPLORACAO.md` e 6 pareceres (`reviews/2026-09-30-exploracao/`, `reviews/2026-09-30-missoes/`). **Exceção estreita à Camada 3.** Travessia: opt-in, auto-declarada, sem prazo, sem push, fora da meta do dia, **progresso só no mapa** (região + postal + lore), 1 região aberta por dia, o Passeio sai todo dia com ou sem Travessia. **Barra = amplitude** (variedade de áreas da vida), nunca dificuldade crescente entre regiões (Sitkin 2011; bíblia §7.2). Nome **Travessias / Crossings** (Missões é da loja; Expedição é a fenda, L5). Pet "passeando" diegético sem bloquear cuidado | Dificuldade crescente por região; missão como condição de evolução/dia completo; Bits/Emblemas/XP pela Travessia; Diário de Campo e Escavação (não escolhidos) | nada implementado; condições R-1..R-48 dos pareceres viram aceite | ✅ implementado em 30/09/2026 (`utils/travessias.ts`, `PasseioSheet`; contratos `travessias.contract.test.ts`) |
| **Exceção à regra 4 da Aventura ("o dia mexe na chance, nunca no acesso"): cada região aberta tem postal e lore exclusivos** (30/09/2026) | 🧭 dono (MIS-4), parecer de gênero R-2. O catálogo COMUM da Aventura continua inteiro alcançável por quem nunca fez uma Travessia (R-33) | Nada exclusivo por região | teste futuro: catálogo comum alcançável sem Travessia | ✅ implementado em 30/09/2026 (`utils/travessias.ts`, `PasseioSheet`; contratos `travessias.contract.test.ts`) |
| **Travessias: portão de idade segue a caixa 18+, fora da ficha da loja na v1, frase de segurança nos Termos §8, nome "Crossings" só no app** (30/09/2026) | 🧭 dono, modal (MIS-13..MIS-16), parecer `reviews/2026-09-30-missoes/04-menores-e-marca.md` | Data de nascimento no onboarding; Travessias nos screenshots; trocar o nome EN | `consent.ts` › `TERMS_VERSION` 2026-09-30; `public/termos.html` §8 | ✅ |
| **Travessias: o "Fiz" vale UMA VEZ POR DIA e a Travessia continua ativa; a região abre uma só vez (1/noite); repetir não rende nada novo no mapa. "Deixar pra lá" vira "Recuar" (mesma função pura, sem custo); a tela mostra só a Travessia em uso e as 21 ficam num modal** (02/10/2026, F2/F3/F5) | 🧭 dono, navegação de 02/10 (F5: "uma travessia pode ser feita todo dia"). O relógio é o dia do jogador (`playerDayIso`, o mesmo do resto do app) guardado em `CrossingsState.doneDay`; um "Fiz" por dia no total (trocar de Travessia no mesmo dia NÃO libera outro). Não é farmável: o único ganho do "Fiz" é abrir a região (finito, 8 regiões, teto `REGIONS_OPENED_PER_DAY` = 1/noite) — o resto do ato é só do jogador. **Nenhum valor de economia mudou** (Travessia continua sem Bits/XP/Emblema, contrato `travessias.contract.test.ts`), então não há teto de economia a aplicar | **Ciclo mais longo (semanal / uma vez por Travessia, o desenho de 30/09):** punha a pessoa em "já fiz, acabou" e escondia a graça do hábito diário; a restrição por Travessia também deixava o "Fiz" ser dado várias vezes no mesmo dia trocando de carta | `travessias.test.ts` (uma vez por dia, virada de dia, trocar não libera, recuar não apaga); `PasseioSheet.render.test.tsx`; falsifica: se a pessoa passar a marcar sem fazer, ou se a repetição virar obrigação (queixa de culpa), voltar ao ciclo longo. Conflito aberto com R-31 ("a oferta não anuncia o que rende"): o card agora diz, em palavras, o que muda no mapa — a pedido do dono (F2); pendente de confirmação do dono | ✅ implementado em 02/10/2026 (`utils/travessias.ts` › `markDone`, `PasseioSheet`) |
| **Anfitriões: Tessela, a enigmista (Ateliê) e Boio, o soprador de bolhas (Refúgio); jogos novos seguem MUDOS; Refúgio travado mudo (C-10); Dino e PPT perdem o `playTaskComplete` (C-11)** (30/09/2026) | 🧭 dono, modal de 30/09. Nomes da loremaster (ofício sem promessa de efeito / sem insinuar tratamento); som: proposta da squad-som `docs/som/PROPOSTA-SOM-MINIJOGOS-2026-09-30.md` (24 de 26 eventos recusados; vencer minijogo não é concluir tarefa pela R-CAT) | Sábia/Musgo; abrir a categoria `arcade` agora; renomear o Tico e guia sonoro na respiração (não aprovados agora) | `areaNpcVoice.ts`, `cortes.contract.test.ts` (C-10, C-11), `DinoGame.tsx`, `RPSGame.tsx` | ✅ |
| **O sonho da manhã DÁ a decoração gêmea da cena; "Equipar" aparece sempre nesse caso e equipa na hora; idempotente** (01/10/2026, economia/decoração) | 🧭 dono, navegação de 01/10 (F2): leu "Esparramado no sofá" como "ganhei um sofá". Seis pares cena→decoração (`DREAM_DECOR_TWIN`); o item entra em `ownedFurniture` no mesmo updater que guarda o sonho; sonhar de novo não duplica | **"Só equipar se já tiver"** — a primeira versão do F2 (o sonho não dava item; o botão só aparecia para quem já tinha comprado a peça), escolhida por cautela de economia e revertida pelo dono | `utils/dreamDecorTwin.ts` › `dreamTwin`/`grantDreamTwin`; `MorningDream.tsx`; `dreamDecorTwin.test.ts`, `MorningDream.render.test.tsx` | ✅ **Gatilho de revisão:** os seis gêmeos virarem atalho dominante de decoração (o sofá custa 100 Bits na loja) ou o catálogo de pares crescer sem decisão |

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
| **S16 — os assets de IA dos três eventos LONGOS e a camada-base da trilha ENTRAM sem o A/B cego** | Decisão do dono em 21/09/2026, literal: *"Escolhe quaisquer um, só pra gente ter pronto. Depois melhoramos. Tenha toda parte de som pronta."* O orquestrador não ouve (S8) e não escolheu por gosto: instalou o candidato **único** de cada evento em que o gerador **passou na régua** (`playEvolve`, `playDegenerate`, `playTaskComplete` — 4 `[PASS]` cada) e deixou procedurais os cinco em que ele **reprovou** (Cuidado ×3, Transação, Presença: RECUSA de crista ou ganho > 20 dB pós-corte — `PERGUNTAS-DO-DONO.md` #9/#10). O procedural segue como **fallback** em runtime de cada um dos três (asset ainda não decodificado, `fetch` falho, motor sem `decodeAudioData` → toca o de sempre). A trilha entra como **uma camada** (`base`, E1) que liga e desliga por gesto (S2) e para em `document.hidden`/sono/mudo (E0) — **S13 continua congelada**: uma camada não descongela nada. Codec: não há nenhum nesta máquina → WebM/Opus 48 kbps pelo MediaRecorder do Chrome, decodificação conferida no mesmo motor; total **188 031 bytes** no dia em que nasceu — **emenda no mesmo dia:** a trilha ganhou a segunda camada (`ritmo`, 32 kbps, loop de 12 compassos exatos, trim medido em `TRIM_TRILHA_POR_CAMADAS_DB`) e o total vigente é **258 248 bytes em 5 arquivos**; zero em `PRECACHE_URLS` (S6). Régua: `src/utils/sonsAssets.contract.test.ts` (S6 + S9 nas duas direções). **Achado do doc-mantenedor, fechado em `980bc84c`:** o `SettingsModal` estava sem gatilho vivo, então mudo e trilha eram inalcançáveis pela UI — as duas chaves entraram na `SettingsPage` (grupo "Som"), régua `settingsSom.render.test.tsx`. | **O A/B cego, quando o dono ouvir** (`E:/Soulmon-assets/som-01/ab/escuta.html`): se o procedural vencer ou empatar em ≥2 de 3, os três assets **saem** e a S1 cai para SFX — a instalação de hoje é "pronto", não "vencedor". Também reabre se: os termos do provedor (§8, S15) ficarem restritivos; notificação de terceiro; o gerador passar a entregar os sons curtos dentro da spec (aí #10 reabre). ⚠️ `dist/` é commitado: os 4 arquivos são permanentes no histórico desde `ee79fd44` — trocar é commit novo, nunca reescrita. |
| **S17 — a música-TEMA "Stone Hall Decay" toca ao abrir o jogo (revoga o "nasce desligada" da S2 SÓ para ela)** (emendada pela §129, 19/10/2026: um interruptor só de música) | Decisão do dono em 07/10/2026, literal: *"Use essa música como tema. Abra assim que iniciar o jogo."* A faixa foi **gerada no Suno pelo dono** (3m40). **O que muda:** a preferência do tema **nasce LIGADA** (`SOUND_THEME_OFF`, polaridade do mudo: a chave guarda o desligado) — a trilha de duas camadas (S16) segue nascendo desligada. **O que NÃO muda (e é o desenho):** o navegador/WebView só libera áudio depois de um gesto, e a D11 vale nos chamadores — então o tema **começa no PRIMEIRO gesto da sessão** (toque, clique ou tecla; inclusive o toque que pula a intro), nunca por autoplay cego (`armarTemaNoPrimeiroGesto`, só instala ouvintes; nada é baixado nem nenhum `AudioContext` nasce antes). Respeita o mudo global, `document.hidden`, sono e janela de descanso (mesmos motivos da trilha, `pausarTrilha`/`retomarTrilha` repassam). **Uma música por vez:** ligar o tema desliga a trilha e o inverso. Controle persistido em Configurações › Som ("Música-tema"/"Theme music"). **Mixagem:** `<audio>` em streaming (decodificar seria ~70 MB de PCM) → `busTema` do `audioBus`, sob o `duckGeral` (o D-1 do Marco o abaixa); nível = **alvo da trilha de `loudness.ts`**, medido (LUFS-S mediano −28,0 ±0,1 nos dois formatos, true peak −15 dBFS, integrado −28,2), gravado no arquivo, ganho 1 em runtime. **Fim e retomada:** a faixa já termina em fade de ~5 s; ao acabar descansa 30 s em silêncio e volta com fade-in de 2 s (nada de loop seco). **Intro:** o vídeo é `muted`, então não há briga de áudio (guard). ⚠️ **REVISTO pelo dono em 07/10/2026 (modal): o tema toca DURANTE a intro, não só no toque que a pula.** Como o navegador/WebView só libera áudio num gesto, o `IntroScreen` ganhou uma TELA DE ABERTURA antes do vídeo — o pôster da marca (1º quadro do vídeo) + "Tap to start"/"Toque para começar" (EN primeiro, sem cobrança, sem play cinza nativo) —, cujo toque (ou Enter/Espaço) chama `iniciarTemaNoGesto()` DENTRO do handler (D11 no chamador) e monta a intro. Pulada quando não há o que liberar: o jogador já interagiu (`navigator.userActivation.hasBeenActive`, que cobre também o autoplay com som liberado), tema desligado ou app mudo. O vídeo segue `muted` e o tema toca por cima, sem ducking novo. Régua: `IntroScreen.render.test.tsx` + `tema.test.ts`. **Custo declarado:** quem abre o app ganha UM toque antes da marca (a intro de ~10 s deixa de ser a primeira coisa vista a rodar sozinha); gatilho de revisão = se a retenção do primeiro toque mostrar abandono nessa tela, ou o dono preferir a intro muda automática. **Bytes:** 2,37 MB (Opus/WebM) e 2,47 MB (AAC/M4A) por formato, **fora do S6 de 300 KB** (escrito para SFX), com orçamento próprio ≤ 2,5 MB por formato, zero no bundle inicial, fora do pré-cache e o `sw.js` não intercepta `Range`/`/sounds/tema-`. Régua: `sonsAssets.contract.test.ts` + `tema.test.ts` + `settingsSom.render.test.tsx`. ⚠️ **EMENDADA em 11/10/2026 (pedido do dono: 'gosto das duas, a música tema e a de loop; a de loop pode ser usada na dungeon; pensar numa outra para o combate da Arena'):** "uma música por vez: ligar uma desliga a outra" virou **"as duas preferências convivem, o diretor de música (`musica.ts`) nunca as deixa soar juntas"** — home = tema, masmorra = loop (as duas camadas da trilha), arena = faixa derivada (camadas a 1,2× + percussão procedural, sem asset novo), crossfade de 1,2 s. A trilha/loop segue nascendo DESLIGADA (S2): é o interruptor "Música de masmorra e arena". **Nível:** o alvo da música subiu de −28 para −22 LUFS-S (−25 em combate) a pedido do dono ("muito baixa"), e o trim da trilha foi corrigido por medição (tocava 4,6 dB abaixo do tema). Detalhe e testes: `docs/SOM.md` §10. Gatilho de revisão: a escuta do dono (S8). | **Escuta do dono** (S8: fone e alto-falante de celular) — o alvo da trilha (−28 LUFS-S) foi aplicado por política e pode soar BAIXO para uma música em primeiro plano; se soar, a alavanca é a política em `loudness.ts` (um alvo próprio do tema, medido), nunca ganho à mão. **Termos comerciais do plano Suno do dono: NÃO verificados — pendência do dono** (S15/S9: o guard prova procedência, nunca licença nem originalidade). Reabre também se o dono quiser o tema só no menu e não dentro do app. ⚠️ `dist/` é commitado: os 2 arquivos (≈4,8 MB) são permanentes no histórico do git. |
| **S18 — três trilhas novas do dono: masmorra, evolução e meditação (R-NOVA revogada SÓ para elas)** (26/10/2026) | Pedido do dono (26/10/2026): trilhas "Dungeon Theme", "Evolution Theme" e "Meditation Theme", conteúdo aprovado por ele. **Revoga o "nasce muda" (R-NOVA) só para estas superfícies:** Endless Rift/Calabouço, cerimônia de evolução e meditação ganham música, sob o MESMO interruptor "Música" (§129; desligado = silêncio), só depois de gesto (D11), uma música por vez com crossfade de `CROSSFADE_MUSICA_S`. **Onde toca:** `masmorra` (Dungeon Theme) no lobby, no fim e no retorno da descida do Endless Rift e em todo o Calabouço roguelike (`RogueDungeon`, combates simulados sem cena de luta); **as lutas da descida seguem no "Stone Hall Combat"** — decisão por conta própria: o intervalo entre lutas é 4 s (`DUNGEON_AUTO_FIGHT_MS`) e a descida é quase só luta, então trocar de faixa a cada inimigo/andar seria ruído; `evolucao` (Evolution Theme, 29,9 s) acompanha a cerimônia e o cartão final, e o estalo `playEvolve` (1,7 s) CONTINUA (a faixa acompanha, não substitui: a cerimônia dura 3 s, a faixa 30 s; fechar a cerimônia dá crossfade de volta); `meditacao` (Meditation Theme) na Respiração e nas Bolhas calmas (`mode="calma"`; Bolhas de foco não). **Implementação:** as 3 entram em `MUSICAS_DE_COMBATE` (o dono único do streaming de superfície, `busTrilha`) e no diretor como superfícies `masmorra-mapa`, `evolucao`, `meditacao`, sem o degrau de combate (−3 dB) — exploração/cerimônia/calma não são luta. **Loudness:** ganho único por faixa para o alvo de masterização, trim 0 (medidas em `SOM.md` §14). **Bytes:** Opus/AAC 64 kbps, 1,84–1,99 MB as duas longas e 246 KB a de evolução; cada formato ≤ 2,5 MiB, fora do S6 e do pré-cache. **Procedência:** "fornecida pelo dono", gerador/plano NÃO declarados (não se presume Suno); `Attributions.md` registra hash e a pendência. | **Escuta do dono** (NENHUMA trilha foi ouvida por agente): fone e alto-falante de celular, nível relativo ao combate/tema, loop sem estalo (as duas longas já terminam em fade e voltam com respiro de 8 s) e se a Evolution Theme de 30 s casa com a cerimônia de 3 s. Reabre se: o dono quiser a faixa da masmorra também nas lutas, ou a de evolução substituindo o estalo; ou se declarar a procedência/plano das faixas. Escuta pendente em `PERGUNTAS-DO-DONO.md` ("Beta3 som"). |
| **S19 — a revelação de recompensa da tela de resultado TEM som (R-NOVA revogada SÓ para ela)** (28/10/2026) | Pedido do dono (28/10/2026): a tela de resultado deve parecer jogo — cada ícone do livro "Ganhou" estoura em sequência com um som curto e os Bits rolam como odômetro de caça-níquel, com tique enquanto rola e um "ding" ao pousar. **Revoga o "nasce muda" (R-NOVA) só para esta superfície** (e `ResultScreen` já nascera muda pela Proposta D). Três sons procedurais novos, todos `arcade` (R-CAT: o EVENTO é fim de partida e o tique repete): `playRewardPop` (bolha; cada ícone sucessivo sobe um semitom, teto de 8), `playCoinRoll` (rajada de 4 tiques, repetida a cada 140 ms), `playCoinLand` (sino de 3 parciais). Loudness só pela política central: offsets MEDIDOS em Node no sinal nominal (`sonsRecompensa.loudness.test.ts`, medidor K-weighting do repo) — pop +14,1 dB, roll +10,91 dB, land +6,49 dB. **O cronograma nunca põe dois eventos sonoros dentro da janela de 120 ms da R-EX** (senão o segundo seria descartado). **D11 no chamador:** o hook `useRewardReveal` só toca com a aba visível e o áudio já liberado por um gesto; movimento reduzido, `instant` e toque-para-pular = estado final e mudo. O resto do app segue mudo. | **Escuta do dono** (NENHUM dos três sons foi ouvido por agente; gate S8): se a bolha soa agressiva, se o tique cansa em Bits grandes, se o "ding" cobre o resto. Reabre se: o dono achar a revelação barulhenta (volta a nascer muda: trocar o `sound` do hook para falso) ou quiser o mesmo som em outra tela. |


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

> ### 21/09/2026 (fim do dia) — o dono escolheu: **o GERADO nos três**
>
> Primeiro disse "Coloca o A"; aplicado literalmente sobre o mapa cego (semente 20260921: par1
> `playEvolve` A = procedural · par2/par3 A = IA), `evolve.webm` saiu em `c703c8bc`. Perguntado se
> era isso, respondeu **"Não — quero o gerado nos 3"**: `evolve.webm` voltou no commit seguinte e os
> três eventos longos ficam com o asset de IA (fallback procedural). **Isto é escolha do dono, não
> resultado do protocolo** (`ab-piloto.md` §8.3/§8.4 — 3 perguntas × 2 condições — não foi
> respondido). A S10 não muda de significado por medição nenhuma: o que está no app é o híbrido —
> **IA em 3 eventos longos e na trilha (2 camadas), procedural nos 5 curtos**. "O procedural
> venceu" e "a IA venceu" seguem proibidas.

> ### 21/09/2026 — o gatilho da S10 DISPAROU: o A/B cego está MONTADO, e ainda NÃO OUVIDO
>
> A conta do gerador voltou a ter crédito (480,95 cr em 21/09/2026) e o dono respondeu em modal as
> três perguntas do `docs/HANDOFF-SOM.md` §3: **(1)** autorizou gerar em `E:/` e, se a IA vencer o
> A/B, instalar no repo sob S6/S9 (risco da §8 dos termos — provedor terceiro anônimo, S15 — aceito
> com registro); **(2)** áudio gerado por IA **será declarado** na ficha da loja; **(3)** S11 e S12
> **mantidas**. Com isso o `pacote-prompts.md` §0 rodou: custo medido de **2,5 cr por geração**
> (não era conhecido — o piso da §5.1 era "> 0,45"); limite do plano **pro = 3 jobs concorrentes**
> (`rate_limit_reached` acima disso); fila do gerador oscilando de 4 a 30 min por job. Os 12 prompts
> literais foram gerados (`--sample-rate 48000 --format wav`), tudo em `E:/Soulmon-assets/som-01/`
> — **nenhum byte de áudio entrou no repositório**, e por isso `docs/Attributions.md` continua sem
> linha de áudio (S9: atribuir asset que não existe no repo é mentira no registro).
>
> **O pipeline reprovou de verdade** (§4 do pacote, "um lote com 100% de aprovação é sinal de gate
> não exercido"): `transaction` e `end-zero` saíram com **RECUSA (crista-inconsertável)** — os sons
> "seco/click" pedem 7,9 e 9,6 dB de atenuação de pico, acima do limite de 6,0 dB — e foram
> mandados regerar. E dois achados que **não** são aprovação: `presence` e `shower` precisaram de
> **+31,8 e +24,2 dB** de ganho depois do corte de 200/120 ms (o gerador entregou 1,6–1,7 s com o
> corpo do som fora da janela cortada) — pelo critério do AC-5 (|offset| > 20 dB = fonte errada), o
> corte pegou a parte errada do arquivo, e isso volta ao produtor antes de qualquer escuta.
>
> **O A/B cego dos 3 pares (`playEvolve`, `playDegenerate`, `playTaskComplete`) foi montado
> exatamente pelo `ab-piloto.md` §8.1** — os dois lados no alvo da categoria (Δ 0,00 LU nos três),
> A/B e ordem sorteados (semente 20260921), mapa cego em arquivo separado, página de escuta com as
> 3 perguntas × 2 condições. O lado procedural é a **captura do motor real da forma calibrada**
> (`procedural/wav-calibrado/`, síntese conferida idêntica ao `src/utils/sounds.ts` vigente).
> **O dono ainda não ouviu** (resposta em modal: "feche o resto sem o A/B"). Consequência: **a S10
> segue exatamente como está** — o procedural é a solução vigente, a premissa continua **não
> medida, não refutada**, e "o procedural venceu" continua frase proibida. O que muda é só o
> gatilho: ele deixou de ser "haver crédito" e passou a ser **"o dono responder as 18 perguntas"**
> (`E:/Soulmon-assets/som-01/ab/escuta.html`). Quando responder, a tradução é a do §8.4: IA vence
> P1 em ≥2 de 3 nas **duas** condições → procedural volta a ser provisório e o lote entra sob S6/S9
> com atribuição no mesmo commit; empate/derrota → **S1 cai para SFX**.

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

> ⚰️ **Lápide (29/09/2026):** a parte "rótulo `Vírus/Dado/Vacina`" desta
> decisão foi REVERTIDA pelo dono — ver §14.5. O resto (Glitchtama, Serah,
> Pyraka, Zeed) continua valendo.

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

### 14.5 Os caminhos viram Poder / Harmonia / Benevolência (29/09/2026) — reverte parte da 14.4

**O pedido, literal:** *"remova toda menção a virus, data e vacina e substitua
por poder, harmonia e benevolência"*.

**A decisão:** a correspondência é pela ORDEM dita (premissa registrada):
vírus → **Poder**, dado → **Harmonia**, vacina → **Benevolência** (EN Power /
Harmony / Benevolence). Em código: ids `power` / `harmony` / `benevolence`,
formas `champion|ultimate|mega-power|harmony|benevolence` (`rookie` e `ultra`
não mudam), campos `powerPoints` / `harmonyPoints` / `benevolencePoints`,
chips 👊 / 🎶 / 🤲 (eram 🦠 / 💾 / 💉), arquivos de arte e drawables
renomeados. `Ruptura / Trama / Guarda` seguem vocabulário de MUNDO, com o
mapeamento declarado: Ruptura = Poder, Trama = Harmonia, Guarda = Benevolência.

**O que mudou desde que a alternativa perdeu (14.4, 21/09/2026):** o dono
decidiu. Não há evidência nova de telemetria (não há usuários); a mudança é de
escolha, e o que pesava contra ela em 21/09 (a tríade é assinatura de outra
franquia) só reforça a direção nova.

**Como o save antigo sobrevive:** `src/utils/branchMigration.ts`
(`migrateBranchIds`, pura e idempotente) roda em toda porta de entrada — load
do localStorage e da nuvem (`hydrateSave`), `adoptCloudSave` e o overlay
(`desktop/renderer/src/cloudSync.ts`, importando). No servidor, `VALID_FORM_ID`
aceita só ids novos; as chaves KV já gravadas com id antigo (cache de sprite e
o contador vitalício por forma `ent.aiForms`) são LIDAS por compatibilidade em
`functions/api/_branchLegacy.js`, para não cobrar de novo um sprite pago nem
zerar o teto por forma.

**Réguas:** `src/utils/branchRename.contract.test.ts` (nenhum id/rótulo/emoji
antigo fora da migração), `src/narrativa.contract.test.ts` (o rótulo antigo
passa de exceção aceita a VETADO), `src/utils/branchMigration.test.ts`.

**Gatilho de revisão:** nova decisão do dono.

### 14.6 Nomes em inglês primeiro (30/09/2026) — ajusta a 14.1/14.4 no que é NOME DE EXIBIÇÃO

**A decisão do dono:** o inglês é a língua principal, o público é global, e
isso vale **inclusive para nomes de personagem**. Base: a auditoria
`docs/reviews/2026-09-30-ingles-primeiro-nomes.md`.

**Aplicado:** linhas `Akashaoi -> Akashai`, `Nautilu -> Nautil`,
`Astrase -> Astria` (`DUNGEON_LINE_NAMES`); NPCs `Brisa -> Zeph`,
`Fanfa -> Fanfare`, `Boio -> Bobbi`, PT `Rinoco -> Rhinoco`; cenários
`Freezeland -> Frostlands`, `Native Forest -> Old-Growth Forest`,
`File City -> Archive City`, cena da masmorra `Tamagotchi -> Retro Pet`;
missão `Perfect Consistency / Constância Perfeita -> Thirty Full Days /
Trinta Dias Completos`; estações PT alinhadas ao EN (`Estação da Brasa`,
`Estação Estrelada`); `Mesh Picross -> Mesh Nonogram` (PT `Nonograma da
Malha`); radicais do gerador de nomes em `oracle.ts` que eram palavras PT
(só afeta geração futura).

**Não mudou (e não pode):** ids de linha (`kaelen`/`orrin`/...), nomes de
arquivo de arte, `demoCharacterId`, ids de save; ids PT de elemento, reino e
alinhamento do oráculo (renomear exigiria migração em todas as portas de
entrada; a auditoria §7 recomenda não fazer). `Serah`, `Pyraka`, `Zeed`,
`Ignar`, `Lumel`, `Igni`, `Nimbrata` e `Glitchtama` ficam (14.1/14.4).

**Gatilho de revisão:** nova decisão do dono.

## 15. Bestiário — nome de personagem de franquia no prompt: VETADO (27/09/2026)

**O pedido:** o dono pediu para usar as ~4.000 linhas de franquia do corpus
`Besti-rio-` (Pokémon, Digimon, D&D, Warcraft, Final Fantasy, Tolkien, Marvel
etc. — mapeadas em `docs/BESTIARIO-PROCEDENCIA.md` §1–§2) como inspiração para
o gerador de sprite, citando o NOME do personagem no prompt de imagem
(`imagePrompt`), inclusive combinando dois nomes ("Chocobo Deathwing").

**O parecer (`soulmon-ip-brand-guardian`, 27/09/2026): VETADO, sem ressalva.**
Resumo dos pontos que sustentam o veredito:
- Mitologia de domínio público (Fênix, Dragão, Cérbero — já citados no prompt
  desde a decisão D-B1) é GÊNERO, sem titular. Nome de personagem registrado é
  EXPRESSÃO IDENTIFICADA de uma obra de titular vivo e comercialmente ativo —
  categoricamente diferente, e combinar dois nomes não neutraliza nenhum dos
  dois.
- Risco de bloqueio de loja: ALTO e mensurável (política de PI e de conteúdo
  gerado por IA da Play/App Store trata nome de personagem registrado em
  prompt como sinal de geração infratora).
- Risco de DMCA/ação de titular direto: ALTO — Nintendo e Bandai (a própria
  origem do Soulmon como ex-DigiApp já é exposição concreta) têm histórico
  documentado de ação agressiva; DMCA atinge a HOSPEDAGEM (Cloudflare), não só
  a loja. Beholder/Mind Flayer/Displacer Beast são os 3 itens que a WotC
  processa por serem Product Identity fora da OGL.
- Sem mitigação por titular: fair use/paródia não é isenção preventiva para um
  app comercial monetizado.
- Termos do provedor de imagem (Higgsfield/Gemini): não confirmados nesta
  sessão — lacuna registrada, não risco zero.

**O dono manteve o pedido mesmo depois do veto ser exposto.** A sessão
**recusou implementar** — não por desacordo de produto, mas porque o próprio
parecer diz que isso passa do limiar de risco de produto e exige revisão
jurídica formal **antes** do primeiro commit, não depois, e a sessão não tem
como suprir essa revisão. Nenhum prompt com nome de personagem de franquia foi
escrito, nem em código nem como texto avulso.

**O que foi implementado em vez disso** (via alternativa do próprio parecer,
aceita pelo dono): `scripts/bestiario-arquetipos-genericos.mjs` — extrai só as
FAMÍLIAS genéricas que se repetem em toda ficção de fantasia (gigante,
autômato, espectro, limo, aberração, morto-vivo — presentes centenas de vezes
em pokemon/digimon/dnd.json, mas como vocabulário genérico, não nome próprio)
e escreve descrição ORIGINAL para cada uma, nunca copiando nome nem texto de
nenhuma entrada específica. Ver `docs/BESTIARIO-PROCEDENCIA.md` §12. Pool:
630 → 732 criaturas; famílias cobertas em `REALM_TO_FAMILIAS`
(`bestiary/select.ts`): 6 → 12 de 14.

**Gatilho de revisão:** revisão jurídica formal, por escrito, aceitando o
risco residual com o dono ciente — só então a citação de nome de franquia
volta à mesa. Enquanto isso não existir, esta decisão está fechada.

## 16. Catálogo de atividades — quatro decisões do dono (28/09/2026)

Contexto: execução do `docs/PLANO-CATALOGO-ATIVIDADES.md` (F1/F2). O dono
tomou quatro decisões durante a execução, antes do checkpoint de F3/F4.

1. **Nível 3 do catálogo: SEM gate por estágio do pet.** O plano deixava a
   porta aberta para exigir Champion+ antes do nível 3. Decisão: progresso de
   nível é da PESSOA, nunca do pet — nenhum gate. `src/utils/catalogLevel.ts`
   já nasceu sem gate; esta linha fecha a decisão que o §4 do plano deixava
   em aberto.
2. **"Criar do zero" continua, mas escondido.** Fica atrás de "Algo que não
   está aqui?" no novo Catálogo (substituindo o `CreateModal` atual), com
   esforço fixo 1 (mesmo do legado). Não é removido — é a saída para quem
   quer registrar algo fora do pool.
3. **Onboarding retroativo para jogadores existentes.** Quem já tem save
   REFAZ o onboarding na próxima abertura — passa pelas perguntas novas
   (áreas/dificuldades/forças, ver `activityCatalog.ts` → `LifeArea` /
   `StruggleId` / `StrengthId`) e recebe sugestões de starter set.
   **Nenhuma atividade existente é apagada** — as antigas seguem como legado
   (sem `catalogId`); as sugeridas se somam. Roda **uma única vez** via flag
   persistida no save; é pulável mas deve ser curto, e entra pela fila única
   de intersticiais do `App.tsx` (nunca como modal solto fora da fila — ver
   `src/components/filaDeAvisos.contract.test.ts`). Pendente de implementação
   (F3, não coberta nesta sessão).
4. **Área "mente" ganha protocolos derivados de TCC**, com evidência A/B
   apenas: registro de pensamentos (reestruturação cognitiva), ativação
   comportamental agendada, exposição gradual leve, reestruturação cognitiva
   simples. Feito nesta sessão: `mente-registro-pensamentos` e
   `mente-exposicao-leve` em `src/data/activityCatalog.ts`, com revisão
   reforçada em `docs/CATALOGO-EVIDENCIAS.md` (meta-análises citadas,
   contraindicações marcadas). **Regra que a UI ainda precisa cumprir (F3/F4,
   pendente)**: copy nunca usa "trata"/"cura"; aviso "não substitui ajuda
   profissional" + CVV 188 visível especificamente nesses itens; item nunca
   sugerido a quem sinalizar crise aguda/ideação suicida — nesse caso a
   resposta do app é sempre apontar o CVV 188, nunca uma atividade do
   catálogo.

**Gatilho de revisão**: se a métrica de F5/F6 mostrar que os itens de TCC
geram confusão com tratamento clínico (ex.: usuário relatando ter entendido
o app como terapia), a decisão 4 volta à mesa com o
`soulmon-behavioral-psychologist`.

### 16.1 Fechamento de F1–F4 (28/09/2026, mesma sessão)

A revisão do `soulmon-behavioral-psychologist`
(`docs/reviews/2026-09-28-catalogo-psicologia.md`) foi aplicada por completo
antes de qualquer UI ir ao ar: todos os VETOS (V1–V3) e AJUSTES OBRIGATÓRIOS
(A1–A6) do documento estão no código, cada um com teste (`recommend.test.ts`,
`catalogOptInWeight.test.ts`, `activityCatalog.copyPromessa.contract.test.ts`,
`CatalogMindNotice.render.test.tsx`, `catalogLevel.test.ts`).

F3 (onboarding) e F4 (navegador do catálogo) foram implementados de forma
ADITIVA, sem tocar na máquina de estados do ritual do Oráculo
(`SoulmonOnboarding.tsx`) nem no formulário de criação existente
(`CreateModal.tsx`) — os dois continuam servindo exatamente o que serviam. O
convite do catálogo (`CatalogOnboardingFlow`) e o navegador
(`CatalogBrowserModal`) são superfícies novas, ligadas pela fila única de
intersticiais e pelo botão "+", respectivamente. **Decisão consciente**: dado
o histórico de bugs de reordenação naquela máquina de estados (ids negativos,
`GOAL_STEP`/`STRUGGLE_STEP`), o risco de regredir o primeiro contato de TODO
jogador não valia a economia de manter só um caminho de onboarding — dois
mecanismos que não se sobrepõem (o ritual do Oráculo continua perguntando
`soulGoal`/`soulStruggle` em texto livre; o convite do catálogo pergunta
áreas/dificuldades/forças em escolha múltipla) foram preferidos a um só
mecanismo mais arriscado de editar.

**O que ficou para uma próxima sessão** (registrado em
`docs/PERGUNTAS-DO-DONO.md`): `CatalogLevelInviteModal` existe e tem teste,
mas não está ligado a um gatilho automático de constância na virada — hoje é
só convite manual; o pool tem 28 dos ~60 itens do plano original (ver Fase 6
do `docs/PLANO-TAREFAS.md`).

### 16.2 Fechamento de CAT-4/7/8 (28/09/2026, rodada 3, mesma sessão)

Três decisões do dono, todas fechadas sem reabertura:

1. **CAT-7 (ligar o gatilho automático): SIM, ligar agora.** Implementado em
   `src/utils/catalogLevelSignal.ts` — `catalogLevelSignal` calcula a
   constância real em DUAS janelas (21 dias para subir via
   `LEVEL_UP_WINDOW_DAYS`, 7 dias para descer), `lowConstancyStreak` conta
   dias CONSECUTIVOS de baixa constância sem contar dias perdoados (escudo ou
   ausência sem registro nenhum — a mesma régua de `restConstancy`: o app não
   inventa dado ruim sobre um dia que só não foi registrado), cooldown de 14
   dias após uma recusa de "deixar mais leve", e nunca sugere SUBIR em item
   `optInOnly`. `pickCatalogLevelInviteCandidate` varre `Activity[]` na ORDEM
   do array (determinístico) e entra na fila única de intersticiais do
   `App.tsx` como `catalogLevelInvite`, respeitando um teto de **1 convite por
   dia, app inteiro** (`lastCatalogLevelInviteDayKey`). `Activity` ganhou dois
   campos opcionais: `catalogLevelSetAt` (quando o nível atual foi fixado —
   ausente = "não observado", nunca dispara SUBIR por suposição) e
   `catalogLevelDeclinedAt` (cooldown do convite de descer).
2. **CAT-4 (expandir o pool): NÃO — fica com 28 itens.** Decisão fechada;
   não é mais pendência.
3. **CAT-8 (fundir os dois onboardings): NÃO — mantém separados.** O ritual
   do Oráculo continua com `soulGoal`/`soulStruggle` em texto livre; o convite
   do catálogo continua com os seletores de área/dificuldade/força. Decisão
   fechada; não é mais pendência.

## 17. Rodada 3 de arte — dois rótulos trocados (30/09/2026)

Decisões do dono passadas ao `arte-instalador` junto com a aprovação das levas
`fx-itens`/`extras`/`corrida`/`postais` (`E:/Soulmon-assets/out/rodada3/*/MANIFEST.md`):

1. **A moeda do Torneio se chama "Honra" / "Honor" na UI.** ⚠️ Reverte a **D3** de
   23/09/2026 (`design/minimal-ui/PLANO-IMPLEMENTACAO.md` §0, "fica Emblemas"), que
   era a alternativa que tinha vencido; a perdedora (renomear para Honra, como nos
   mocks) passou. Só o RÓTULO exibido mudou (`CURRENCIES.emblems.name`, loja,
   Torneio, Mapa, Feira em `guildCopy.ts` + `NARRATIVA-COPY-GUILDA.md`, Glossário,
   Renascimento, GM): o campo `emblems` do save, o id `'emblems'`, `EMBLEMS_PER_WIN`,
   `RAID_EMBLEMS` e todo identificador continuam. Os **emblemas de conquista**
   (`emblemArt.ts`, Ficha do Pet) são outra coisa e NÃO mudaram de nome.
   Gatilho para rever: o par EN "Honor" colidir com nome de outro sistema ou o
   PT "de Honra" ler mal em contagem pequena.
2. **"Corrida do Dino" / "Dino Runner" vira "Corrida com obstáculos" / "Obstacle
   Run"**, com o tema da arte trocado para ossos e cristais de fogo frio (sem dino,
   sem caveira). Ids de save e de código mantidos: `game === 'dino'`, `dinoBest`,
   `STORAGE_KEYS.DINO_BEST`, `assets/soulmon/dino/`, `mission-dino-1000`,
   `bg-mission-dinoland`. Ficaram **fora** (decisão separada do dono): o nome da
   missão "Maratonista Jurássico" e o fundo "Vale dos Dinos".

## 18. Entrada: inglês primeiro, Google único, termos depois do login (02/10/2026)

Decisões do dono na rodada 3 (`AJUSTES-NAVEGACAO-2026-10-02.md`, A1–A4):

1. **O app abre SEMPRE em inglês** (`resolveLanguage` devolve `en-US` sem escolha
   gravada). O idioma só muda quando a pessoa escolhe — seletor English/Português na
   entrada e na tela dos termos — e a escolha persiste (`STORAGE_KEYS.LANGUAGE`).
   Alternativa que perdeu: **detectar o idioma do aparelho** (`navigator.language`),
   que era o comportamento de 01/10. Gatilho para rever: a maioria dos instalados
   abrir, estrangeira ao inglês e sem entender o seletor.
2. **O portão tem UM botão: "Continue with Google".** Conta existente entra direto;
   conta nova nasce no primeiro login (Firebase). E-mail/senha/"New User"/link por
   e-mail saíram da tela; o código de `utils/auth.ts` fica, sem ponto de entrada.
3. **Termos e 18+ vêm DEPOIS do login** (`TERMS_STEP`, id -9). Quem já aceitou a versão
   ATUAL dos dois documentos (`isConsentCurrent`) não vê de novo; versão antiga pede
   o aceite outra vez. O registro (`consent`, `TERMS_VERSION`/`PRIVACY_VERSION`) não mudou.
4. **Títulos do onboarding em Rubik**, não Cinzel (só no onboarding).


## 19. Mercado, decoração e Laboratório — rodada 3 de navegação (02/10/2026)

Fonte: `AJUSTES-NAVEGACAO-2026-10-02.md` (D1, D2, G1–G3). Itens abaixo são decisões de
implementação tomadas SEM o dono; o que está marcado **[dono]** espera resposta.

1. **Comprar no Mercado pede confirmação (D1).** Tocar no card abre "Comprar X por N
   Bits/Honra?" com custo, saldo agora e saldo depois, e só o "Confirmar" gasta. Vale para
   itens, decoração, cenário e também para a **troca de Créditos → Bits** (gasta moeda de
   dinheiro real). Sem saldo continua abrindo o "como conseguir" (H8), não a confirmação.
   Alternativa que perdeu: confirmar só acima de um preço — um limiar é regra a mais para
   lembrar, e o dono pediu o modal para "qualquer compra".
2. **Decoração: a regra REAL é mantida e passa a ser dita na tela (D2).** Limite = 1 peça por
   espaço do palco (`SLOT_ORDER`: chão, canto esquerdo, vitrine, canto direito, parede) → no
   máximo 5 ao mesmo tempo; equipar numa casa ocupada troca. Posse sem limite. Equipar é
   livre em qualquer cenário; a restrição é de EXIBIÇÃO (`decorBlockReason`): cenário `void`
   não recebe nada, cenário de céu aberto não tem parede, e peça `indoor`/`outdoor` só
   aparece em cenário do mesmo tipo (`any` aparece em todos). Dona do texto e da regra:
   `src/utils/decorRules.ts`. **Não removida** a dependência de cenário: ela é de
   COMPOSIÇÃO DE ARTE (a peça é desenhada para perspectiva de piso/parede; sofá no mar
   é erro de composição — `petStage.ts`), não de economia. Alternativa que perdeu: "toda
   peça em todo fundo" (remover `fits` e `slots`) — pede arte nova ou aceitar sofá na
   lava. **[dono]** se quiser mesmo isso, decidir se aceita a incoerência visual ou se
   manda desenhar variantes. Gatilho para rever: o dono ver peça "perdida" (equipada e
   invisível) com frequência.
3. **Laboratório sem o aparelho em volta do Soulmon (G1).** `Viewport` ganhou `bare`:
   mesma medida (escala inteira), sem anel de cobre, vidro nem reflexo. Usado na Árvore da
   Evolução, em Meu Soulmon e no cartão do Observatório. O padrão do `Viewport` não mudou
   (continua aparelho completo no resto do app).
4. **Estatísticas só no Laboratório (G2).** O Observatório (`labTab` `stats`) já era a casa
   das Estatísticas; saiu a linha "Estatísticas" do menu da Home e a página `page:stats`.
   O interruptor de **telemetria de uso** (opt-out, "Estatísticas de uso") fica em
   Configurações › Seus dados: é controle de consentimento/privacidade (LGPD), e mover o
   opt-out para dentro de um jogo esconderia o direito de sair. **[dono]** confirmar que era
   a linha do menu (e não esse interruptor) que ele queria fora de Configurações.
5. **NPC do Salão da Guilda: Bastia (G3).** Saiu a Marla-árvore; entrou a Bastia, guardiã
   do Salão (busto `npc-f-guarda`, alfa binário 768², já aprovado na leva `npcs-femininas`).
   Motivo: serena, protetora e sem arma em punho, lê "lugar seguro e sem pressa" — a fala
   do Salão (`guild.npc.hall`, "Algumas criaturas cuidam de um bosque juntas. Ele só
   cresce.") segue a mesma, sem cobrança. Alternativas descartadas: Sable (caçadora de
   recompensas: caça e pergaminho de missão soam a perseguição/FOMO) e Gila (mercenária:
   conota pagamento). O busto antigo `npc-hall-guilda.png` fica no repositório, sem uso.

## 20. Combate: torcida por toques e "Descer mais fundo" só até onde já se chegou (02/10/2026)

> ⚰️ **Itens 1, 6, 9 e 10 SUBSTITUÍDOS pela §24 (06/10/2026, combate v3):** a torcida passa a existir só na Arena e no Duelo (`CHEER.energyPerDischarge` = 9 na Arena, `pvpEnergyPerDischarge` = 2,5 no Duelo), a energia é "uma barra, um uso", o golpe é normalizado e a luta roda no núcleo `src/utils/combate/`. Vale o que está na §24.6.
>
> ⚰️ **Reescrito em parte em 04/10/2026 (item 10 abaixo):** o "gauge que vira UM golpe especial"
> (itens 1, 6 e 9) foi substituído pela **ENERGIA** — uma barra por lutador, abastecida por ataque dado,
> ataque sofrido e pela barra de cheer. Os números do gauge (8/16 toques, ×1,35, ×3 por gauge) ficam
> como histórico e como o caminho antigo atrás de `ARENA_ENERGY_ENABLED = false`.

Decisões do dono na navegação do APK (`docs/AJUSTES-NAVEGACAO-2026-10-02.md` C1/C2, E2, G4).

1. **A TORCIDA é tocar em QUALQUER LUGAR da tela de combate; cada toque enche um
   GAUGE e o pet GASTA o gauge cheio num golpe ESPECIAL.** Vale para o **duelo
   fantasma do Torneio**, o **Pesadelo**, a **Masmorra** e (desde a nota do item 6)
   o **Duelo da Arena**. Os golpes normais
   continuam sendo do pet, sozinho; a torcida **só soma** (sem torcer, o golpe é o
   base, nunca menos); cada toque solta um "grito" ("VAI!", "GO!", ✦…) no ponto
   tocado — sem animação com movimento reduzido — e os botões da tela (sair) não
   são engolidos. Há um botão "Torcer!" para quem não toca na tela.
   - **Alternativa que perdeu: torcida por TIMING** (a barra/anel que fecha sobre o
     alvo, ×1 a ×1,35 pela precisão, janela de ±400 ms — `STATUS` de 30/09/2026).
     Perdeu porque exigia olho no alvo e precisão num app de uso calmo, e o dono
     queria um gesto sem acerto/erro. O código **fica guardado, sem UI**
     (`TIMING_CHEER_ENABLED = false` em `functions/api/_duel.js`; `cheerMultiplier`,
     `sanitizeCheers` e `cheerQuality`/`CHEER_*` em `DuelScreen.tsx`) para
     reaproveitar em outro lugar.
   - **Duelo (servidor-autoritativo):** o cliente manda quantos toques deu em cada
     JANELA (o tempo até cada golpe de torcida, `DUEL_CHEER_STRIKES = [1,3,5]`); o
     servidor higieniza (`sanitizeTaps`: inteiros em [0, `DUEL_TAPS_CAP` = 10]),
     recalcula (`specialSlots`: o gauge acumula entre janelas, limitado a
     `DUEL_TAPS_FULL` = 8, e zera ao ser gasto) e decide. **Toque ilimitado não
     rende mais que o teto:** 3 janelas, no máximo 3 especiais. O especial vale
     `DUEL_SPECIAL_MULT` = ×1,35, o mesmo da torcida perfeita antiga.
   - **Calibração** (20.000 duelos, `_duel.test.js`): mesmo estágio sem torcer
     **51%**, gauge cheio nas 3 janelas **82%** (antes: 50% → ~80%); um estágio
     abaixo **14,5% → 38%** (antes ~39%). Gauge parcial ([5,5,5] ou [4,4,4]): 64%.
   - **PvE (Pesadelo e Masmorra):** `utils/torcida.ts`. Golpe-base = 0,5 × `dmg` do
     estágio (mantém o dano médio de antes); especial = 3× o base
     (`TORCIDA_PVE_SPECIAL_MULT`, decidido pelo dono em 02/10/2026 — item 8). O gauge é
     o mesmo (8 toques, importado de `_duel.js`). ⚰️ A **esquiva** (dodge) com a
     `TimingBar` SAIU no item 8: o Soulmon se defende sozinho.
   - Gatilho para rever: o dono achar a torcida cansativa de tocar, ou o especial do
     PvE desequilibrar a Masmorra.
2. **"Descer mais fundo" só libera um nível que a pessoa JÁ cumpriu; não dá para
   pular pagando.** O nível mais fundo cumprido (`DUNGEON_REACHED`, não reseta na
   semana) só sobe ao CONCLUIR uma descida; a compra devolve a base, de um em um
   nível, até esse teto (`canBuyDeepStart(nível, bits, alcançado)` e
   `buyDeepStart`, puras e testadas, em `src/utils/dungeon.ts`; a oferta some quando
   não há nível conquistado acima da base atual). O preço (16 Bits × nível) e o teto
   absoluto (`DEEP_START_MAX_LEVEL` = 5) não mudaram.
   - **Alternativa que perdeu: pular pagando** (WP4.5 — comprar `base + 1` direto,
     mesmo sem ter jogado até ali). Perdeu porque deixava o Bit comprar progresso que
     a pessoa não fez, esvaziando o "concluir a descida" como conquista; agora o Bit
     só compra a VOLTA ao ponto conquistado depois do reset semanal.
3. **A Feira da Arena é a sala cooperativa da Guilda** (o fenômeno da semana que a
   roda dissipa junta: uma rodada por dia, rende Honra e, a cada N Feiras
   dissipadas, a Concha da Maré) — não é loja nem feira de compra. A folha ganhou
   uma legenda de uma linha (`guild.feira.legenda`), e os prédios do Torneio e do
   Duelo ficaram maiores no cenário (42% da largura, antes 30%), juntos no mesmo
   tablado.
4. **Masmorra: o texto longo do lobby fica atrás de um "?"** (toque lê); o lobby
   mostra só Recorde, Dificuldade base, "Descer" e, quando cabe, "Descer mais fundo".
5. **O convite do Pesadelo mostra uma criatura que já existe** (`ignar`, linha
   própria, alfa limpo) no lugar do `dungeon-spirit.png` (bolha roxa com franja
   clara). O arquivo antigo continua no repo, sem uso na tela.
6. **O Duelo da Arena (`ArenaGame`, contra NPCs) ganha a MESMA torcida** (02/10/2026,
   rodada 4, H14 — responde TORC-2). O dono não via mudança nenhuma no combate da
   Arena porque a torcida só existia no Torneio/Pesadelo/Masmorra. Agora: o pet
   golpeia SOZINHO (`ARENA_AUTO_ACC` = 0,73, `utils/arena.ts`; ~1,5 s depois de abrir o
   turno), tocar em QUALQUER lugar enche o gauge de 8 toques (`TorcidaLayer` +
   `TorcidaGauge`, botão "Torcer!") e o gauge cheio vira um **golpe de torcida
   ×`ARENA_TORCIDA_MULT` (1,35 — o mesmo do duelo fantasma)** gasto pelo pet,
   por cima do golpe do turno (básico ou o especial da escola, que segue com a
   carga de 3 turnos e o laço de `simulateArenaRun`). A torcida só SOMA (sem
   toque o golpe é o base); **teto por golpe** (um multiplicador, sem empilhar; o
   gauge zera ao gastar; excedente de toque não rende); o Duelo é PvE e roda no
   cliente, então não há o que "forjar" além do que o teto já limita.
   - **Calibração** (`arena.test.ts`, 3.000 runs × 6 escolas, mesma semente):
     base antiga (barra de timing, precisão 0,7 ± 0,25) **57,2%** de vitória média;
     pet sozinho sem torcer **59,0%**; torcida a 2 toques/turno (especial a cada 4
     turnos) **75,4%** (+16pp); a 4 toques/turno (a cada 2) **81,9%** (+23pp); gauge
     cheio a cada golpe **92,3%** (+33pp, contra +31pp do duelo fantasma: 51% → 82%).
     Sem torcer fica dentro das faixas do balanceamento (40–80%, dispersão ≤ 20pp).
   - ⚰️ A esquiva da `TimingBar` saiu depois (item 8: defesa automática); a
     barra de timing do ATAQUE fica atrás de `ARENA_TIMING_ATTACK_ENABLED = false`
     (código e testes do caminho antigo guardados, sem apagar).
   - **Alternativa que perdeu:** manter a barra de ataque no Duelo da Arena e
     torcer só nos outros modos — perdeu porque o dono pediu "a mesma sensação nos
     dois duelos" e a barra exigia olho e precisão que a decisão do item 1 tirou.
   - Gatilho para rever: o ritmo de 1,5 s por golpe parecer curto/longo para
     encher o gauge, ou o ×1,35 deixar o Duelo fácil demais para quem toca sem
     parar (a conta acima é o piso/teto: +33pp).
7. **PvP sem interruptor: o personagem já nasce no PvP** (02/10/2026, rodada 4,
   H13). **Causa do "Join PvP não funciona":** o interruptor era `disabled`
   (inerte por forma: tracejado, `aria-disabled`, sem `onClick`) para quem tinha
   Vínculo < 5 — quase todo mundo que testa o APK — e ficava dentro da aba
   Desafiar; quem passava do 5 ainda dependia da API de perfil
   (`pushProfile`) e, se o save na nuvem estivesse atrás, o servidor devolvia
   `pvpBlocked` e o cliente DESLIGAVA o toggle de volta com um toast. Ou seja:
   ou não respondia ao toque, ou desfazia sozinho. **Agora:** `pvpEnabled` nasce
   `true` e o load FORÇA `true` (migração: quem tinha `false` salvo — antigo ou
   desligado antes — passa a ligado); o interruptor e o card "Ative o PvP acima"
   saíram. O **gate de Vínculo 5 foi MANTIDO** (é regra de produto declarada:
   `bond.ts` §6 / `level-de-conta.md` §6 — único destrave não-cosmético, social;
   o servidor continua decidindo): ele só **segura a publicação do perfil**
   (`publicarPerfil` não sobe abaixo do 5, e a recusa do servidor não desliga mais
   nada nem avisa) e a aba Desafiar **explica**: "O Torneio abre no Vínculo 5",
   barra de progresso, "você está no N, faltam X XP", o porquê (é social: apelido
   e Soulmon numa lista pública) e "sem pressa". Aberto, sobra só o aviso do
   apelido público (informação, não mais gesto).
   - **Alternativa que perdeu: opt-in explícito** (o interruptor, ligado pela
     pessoa, com o aviso do nick antes do gesto). Perdeu por decisão do dono —
     "o personagem já nasce no PvP" — e porque na prática era uma porta fechada.
   - **Risco aceito e listado:** sem o gesto, o apelido entra na lista pública ao
     cruzar o Vínculo 5 sem consentimento ativo. Mitigação: o aviso fica na aba;
     o servidor ainda não grava nada abaixo do 5. Pendência do dono (TORC-5): um
     opt-out de privacidade em Configurações. ✅ **Respondida no mesmo dia — ver o
     item 8 abaixo.**
   - Gatilho para rever: reclamação de privacidade, ou a decisão do dono sobre TORC-5.
8. **Opt-out da lista pública do Torneio** (02/10/2026, TORC-5 respondida pelo
   dono). Um interruptor discreto em Configurações → Seus dados, **ligado por
   padrão**, que NÃO mora no Torneio: "Aparecer na lista pública do Torneio" /
   "Show me on the public Tournament list" (explicação atrás do "?" do grupo, sem
   copy longa na linha). Campo `hideFromPublicList` no save (só o `true` literal
   esconde; ausente = aparece) e `publicHidden` no perfil do servidor, por conta.
   O cliente SEMPRE envia `publicHidden` (inclusive `false`) para o servidor poder
   retirar e devolver o registro na hora; cliente antigo sem o campo herda o valor
   gravado (não desfaz a escolha feita em outro aparelho). **Servidor** (a régua é
   `isHidden` em `functions/api/community.js`): escondido some de `players`
   (antes do `search`, para a busca não confirmar existência), `player` (responde
   `found:false`, igual a inexistente), `opponents`, `rank`/`seasonResult` (nem a
   linha nem o apelido), `friends` (não adicionável: `404 friend not found`), da
   lista de amigos que terceiros leem e do `from` do presente (`''`); ninguém duela
   contra ele (`404 opponent unavailable`). Ele **continua jogando** e vê o
   próprio lugar: `rank&id=` (ator autorizado) devolve `me`, e o Torneio mostra
   uma linha "Você está oculto da lista pública". Política: `PRIVACY_VERSION` =
   `2026-10-02` (§5, PT e EN).
   - **Alternativa que perdeu:** opt-in (interruptor desligado) — o dono pediu
     ligado por padrão, coerente com o PvP automático (item 7).
   - **Limites declarados:** (a) o cache de borda de 60 s de `players`/`rank` pode
     servir a lista velha em outro ponto de presença por até 60 s — a rota com
     `id` nunca é cacheada e a troca limpa o cache do ponto que a recebeu; (b) a
     **Guilda** (coop) é um círculo só por convite e segue mostrando o apelido aos
     membros (`_coop.js` `montarCartao`) — o interruptor vale para a lista
     PÚBLICA; (c) troféus de season continuam sendo concedidos a quem está oculto
     (são privados do dono) — mas não aparece no `seasonResult` público.
   - Gatilho para rever: o dono querer que o opt-out valha também na Guilda, ou
     reclamação de que 60 s de cache é tempo demais.

8. **A ESQUIVA SAIU: o Soulmon se defende sozinho, e o especial do PvE vale 3×**
   (02/10/2026, noite — responde TORC-3 e TORC-1; TORC-4 respondida: manter o gate
   do Vínculo 5). O dono só torce (toques → gauge → especial); não há mais ação
   de timing em nenhum combate.
   - **Defesa automática** (`src/utils/autoDefesa.ts`, pura e determinística pela
     semente da run + nº do golpe sofrido; nenhum atributo novo): cada golpe
     sofrido sorteia uma precisão `0,70 ± 0,25` (a convenção do jogador MÉDIO da
     barra, a mesma `sampleAcc` da Arena) e a conta de dano de cada modo segue
     intacta (`ceil(atk × (1 − precisão)) − reducaoDano` na Masmorra; `enemyHitDamage`
     com os elementos na Arena). Precisão ≥ `perfeito` = defesa perfeita (sem dano; na
     Masmorra e no Pesadelo, com o contra-ataque). A UI mostra "Defendeu!" /
     "Defendeu em parte!" / "Levou o golpe!" e um escudo curto no pet — sem botão. Os
     ofícios que mexiam na barra de desvio (tecelão, luthier, cartógrafo) viram um
     bônus de precisão (`jeitoDefesaBonus`); o `perfeito` do joalheiro e o
     contra-ataque do alquimista seguem valendo. A `TimingBar` e o ramo da esquiva
     ficam atrás de `TIMING_DODGE_ENABLED = false` ("reaproveitar em outro lugar").
     O duelo fantasma do Torneio já tinha o oponente se defendendo na simulação
     servidor-autoritativa (`_duel.js`): **não foi tocado**.
   - **Calibração** (20.000 runs por caso, `autoDefesa.test.ts`; mesma semente):
     Masmorra sem torcer, esquiva média 0,70 → defesa automática: **idênticos** em
     duração (golpes por run 10,9 / 11,3 / 11,6 / 12,2 em rookie@1, champion@2,
     ultimate@3, mega@4), inimigos derrotados (2,20 / 2,06 / 2,00 / 1,91) e derrota
     por camada (100% na camada 1, nos dois). Pesadelo (2 inimigos, rookie): vitória
     46,4% → 46,1% (nível 2) e 0,1% → 0,1% (nível 3), golpes 8,6 → 8,6 e 7,0 → 7,0.
   - **Especial 3×** (`TORCIDA_PVE_SPECIAL_MULT`: 2 → 3, Pesadelo e Masmorra; o
     Duelo segue em 1,35×). Inimigos derrotados por run, com defesa automática, a
     4 / 8 toques por golpe (gauge cheio a cada 2 / 1 golpes), 2× → 3×: rookie@1
     2,98 → 3,35 / 3,46 → 4,25; champion@2 2,72 → 3,30 / 3,16 → 4,31; ultimate@3
     2,79 → 3,19 / 3,45 → 4,13; mega@4 2,73 → 3,03 / 3,20 → 3,87. **Não deixa a run
     trivial** (nem o toque máximo limpa uma camada) e a defesa não a deixa PIOR do
     que a esquiva média era. Por isso **a vida e o dano dos inimigos NÃO foram
     tocados** (o ajuste pedido só valia se uma das duas coisas acontecesse).
   - ⚠️ **Achado que fica para o dono (TORC-6):** a curva que existia já era
     "bruta" para o jogador médio — com a esquiva em 0,70 a camada 1 não era limpa
     nem pelo estágio certo, e só quem desviava a ~0,90 passava (champion@1 limpava
     a camada 1 em 42%, ultimate@1 em 72%, com 4 toques/golpe). Como a defesa
     automática foi calibrada para o jogador médio, a Masmorra continua assim.
   - **Alternativas que perderam:** (a) manter a esquiva por timing — o dono
     decidiu que o jogador só torce; (b) defesa por escolha do jogador (botão
     "defender") — é a mesma ação ativa que ele quis tirar; (c) defesa com a taxa de
     um jogador BOM (~0,85–0,90) — deixaria a Masmorra jogável, mas rende uma luta
     bem mais fácil que a que o dono tinha sob os olhos e é decisão de dificuldade
     dele (TORC-6); (d) afinar vida/dano dos inimigos já agora — idem, sem alvo de
     dificuldade definido; (e) degrau por estágio na defesa — testado e descartado:
     movia a duração em até 7% e o estágio já entra pelo HP/dano e pela escada de
     inimigos.
   - Gatilho para rever: o dono achar a Masmorra impossível/trivial depois de
     jogá-la, ou decidir o alvo de dificuldade (TORC-6).

9. **A CENA de combate em TELA CHEIA e a luta mais LENTA** (02/10/2026, rodada 5,
   I10 — o dono testou o APK e achou a Arena "fraca e rápida demais"). Vale para o
   **Duelo da Arena** (`ArenaGame`) e o **duelo fantasma do Torneio** (`DuelScreen`);
   Pesadelo e Masmorra NÃO entram agora (a peça fica pronta para eles).
   - **A cena** (`src/components/games/BattleStage.tsx`, reutilizável): o background
     do combate (`ARENA_SCENE`, 1080×1920) ocupa a tela inteira; o seu Soulmon fica
     embaixo à ESQUERDA (grande, mais perto) e o inimigo em cima à DIREITA (0,56× — 0,5×
     com vários —, mais longe), cada um com plataforma/sombra; a **barra de HP fica
     nos PÉS** de cada um (nome curto + HP numérico, o do alvo mirado e o seu) — não
     numa barra lá em cima. O gauge de torcida vai no topo (sob o título) e o X no
     canto superior DIREITO; a faixa da nav inferior fica livre. **Nenhum texto
     explicativo na cena:** a frase da torcida virou o `InfoTip` ("?") do gauge; o
     "especial pronto" é o ícone (e texto só para leitor de tela).
   - **Três ações visuais por lutador, com a arte de SKILL do ELEMENTO**
     (`fx-<elemento>-<estado>.png`, `utils/attackFxArt.ts` — 154 elementos × 6 estados
     já estavam no repo, ninguém os chamava no combate): **físico** = investida do
     lutador até o alvo + `slash` + `impact`; **à distância** = `cast` no conjurador,
     `orb` atravessa a cena, `impact` no alvo; **escudo** = a defesa automática
     perfeita mostra o `defended` do elemento do DEFENSOR no lugar do impacto
     (substitui o "escudo curto"). O ESPECIAL/golpe da torcida é o ranged em dobro
     (`cast` + `aura` + `orb` grande). O JOGO decide; a cena só desenha, e o dano e a
     barra de HP chegam no IMPACTO (`STAGE_TIMING`, `utils/combatFx.ts`). Quem investe
     e quem atira: na Arena, a escola da ficha (só `combate_fisico` investe) e o revide
     alterna por inimigo; no duelo, alterna por golpe. Elemento: o do golpe básico/
     especial da ficha (Arena), o dominante do oráculo (duelo), e o do inimigo da Arena
     vem do bestiário. **Elemento do oponente do duelo:** o servidor não publica
     elemento, então a cena dá um elemento VISUAL determinístico pelo id dele
     (`visualElementFor`) — só desenho, nenhuma regra. Sem arte cai no `neutro`.
   - **Movimento reduzido** (`prefers-reduced-motion`): sem investida, sem projétil e
     sem pulso — só o flash do impacto/escudo no alvo (regra no bloco canônico do
     `index.css`; o JS também não monta o trajeto).
   - **Sair:** o X (canto superior direito, ícone pelado) pede CONFIRMAÇÃO quando sair
     perde progresso (Arena: a corrida; duelo: conta como derrota) e a luta PAUSA
     enquanto a pergunta está aberta.
   - **Ritmo — as contas.** Duelo fantasma (`DuelScreen`): passo de 900 ms →
     `DUEL_STEP_MS` 1500 (a ação começa antes e o golpe chega no impacto: ~1,2 s
     investida, ~1,5 s projétil, ~1,7 s especial); a luta tem 11,8 golpes em média
     (quase sempre os 12 do teto), então a duração média foi de **~10,6 s para
     ~16–17 s**. Gauge **8 → 16 toques** (`DUEL_TAPS_FULL`) e teto por janela
     **10 → 20** (`DUEL_TAPS_CAP`): a 3 toques/s o gauge enche em ~5,3 s e o **primeiro
     especial sai no 10º segundo** (mediana, modelo de tempo de `combatFx.test.ts`; antes
     já na 1ª janela, ~2,7 s). Taxa de vitória (mesmo estágio; 1.500 duelos por célula no
     modelo de tempo, 20.000 no teto; o "dedo" é um modelo de toques/s): **sem torcer 51,1%** (igual a antes);
     **3 toques/s 73,2%** (antes 77,4%, com 8 toques e 900 ms); 6 toques/s 81,8%; **gauge
     cheio nas 3 janelas 81,9%** (o teto, igual a antes). Um estágio abaixo: sem torcer
     14,5%, 3 toques/s 30,8%, teto 38,3% (antes: sem torcer 14,5% e teto 38%). **O teto de ganho NÃO
     mudou** (CAP ≥ FULL ⇒ uma janela forjada já enche o gauge, mas 3 janelas = no máximo
     3 especiais): o servidor segue sanitizando (`sanitizeTaps`) e recalculando
     (`specialSlots`) tudo; `community.duelo.test.js` trava que 999 por janela resolve
     IGUAL a 20 por janela e que 15 toques não viram especial.
     Duelo da Arena: o golpe do pet chega ~2,4 s após abrir o turno (era 1,5 s) e o
     revide ~1,4 s (era 0,8 s) — um turno contra um inimigo passa de 2,3 s para ~3,8 s.
     `TORCIDA_TAPS_FULL` = 16: a 3 toques/s são ~11 toques por turno (antes ~7 para 8).
     Calibração (`arena.test.ts`, 3.000 runs × 6 escolas, mesma semente): sem torcer
     **59,0%** (igual); **11 toques/turno (especial a cada 2 turnos) 81,9%**, o mesmo
     que 4 toques/turno rendiam com o gauge de 8; gauge cheio a cada golpe **92,3%**
     (igual). O PvE (Pesadelo/Masmorra) fica em **8 toques** (`TORCIDA_PVE_TAPS_FULL`):
     nada mudou neles.
   - **Alternativas que perderam:** (a) só desacelerar com o gauge em 8 — encheria em
     ~2,7 s e o especial sairia na 1ª janela de quem toca; o dono pediu ~10 s;
     (b) só subir o gauge mantendo 900 ms — a luta de ~10,6 s acabaria no limiar do
     especial; (c) subir o teto de especiais (mais janelas de torcida) para compensar
     o ganho de quem toca normal — mexeria no teto que o servidor aceita; fica para o
     dono se achar a torcida pouco recompensadora (a 3 toques/s ela rende +22pp, antes +26pp).
   - Limites declarados: a cena do Pesadelo e da Masmorra (e o intro/resultado da
     Arena, que seguem no layout antigo) ficam para depois; a pessoa que usa a Arena
     perde, na tela, a linha "inimigos enfraquecidos/eco ativo" (o efeito vale igual).
   - Gatilho para rever: a luta de ~17 s cansar (baixar `DUEL_STEP_MS`), o primeiro
     especial demorar demais para quem toca devagar, ou o dono querer a cena também no PvE.

10. **ENERGIA, mecânicas ativas no PvE, PvP direto, cena maior e luta mais longa** (04/10/2026, rodada 6
   — o dono pediu isto duas vezes e não tinha saído). Vale para as quatro lutas: **Duelo da Arena**, **duelo
   fantasma do Torneio**, **Pesadelo** e **Masmorra** — todas na `BattleStage` em tela cheia (Pesadelo e Masmorra
   entraram agora; a faixa do visor 348×160 saiu da luta).
   - **A cena, maior.** O seu Soulmon ocupa até ~64% da largura (≥ 215 px num celular; eram ≤ 190), o inimigo 0,66×.
     Um **mascote da torcida** (bichinho de pixel em SVG com tokens, estilo Digimon 1) fica fixo no canto inferior
     direito: a cada toque ele pula, levanta os pompons e solta o balão "VAI!"/"CHEER!" — além do grito no ponto
     tocado, que continua; ele também é o botão de torcer (teclado e leitor de tela). Com
     `prefers-reduced-motion`: sem pulo e sem o grito no ponto, só o balão **pisca**. Os lutadores fazem o
     "bouncing" idle (e brilham com a energia cheia). Nenhum texto explicativo na cena: o "?" (`InfoTip`).
   - **O modelo da energia (simples e legível).** Cada lutador tem UMA barra de **energia** (0–100), EM CIMA do
     personagem, logo abaixo da barra de HP (as duas coladas nele). Ela enche por três fatores: cada ataque DADO
     (+9), cada ataque SOFRIDO (+7) e o CHEER (+36 por despejo, um tanto maior que um golpe). A **"barra de cheer"** é o
     medidor de TOQUES do jogador (`CHEER_TAPS_FULL` = **24**, lenta de propósito: ~8 s a 3 toques/s; era 16 e 8): ao
     encher ela **despeja** a energia no pet e zera (o excedente fica). **Na Masmorra a barra de cheer e a energia do pet
     PERSISTEM entre os combates e as camadas da run** (os cartões de resultado moram SOBRE a mesma cena); uma run nova
     zera. Energia cheia = o lutador solta o **ESPECIAL** no golpe seguinte (com a arte do ELEMENTO: cast + aura + orb +
     impact) e gasta a barra. As constantes são UMAS, do servidor (`_duel.js` → `utils/energia.ts`).
   - **PvE (Pesadelo, Masmorra, Duelo da Arena): mecânicas ativas — a escolha do dono pendente é a (a).**
     (a) **O ANEL** (estilo Pokémon GO): com a energia cheia o pet carrega e um anel encolhe sobre o alvo (1,5–2,1 s,
     velocidade sorteada pela SEMENTE da luta); um toque QUALQUER na tela na hora certa define o multiplicador do
     especial — ótimo ×1,35 (±120 ms do instante em que o anel encosta no círculo), bom ×1 (±320 ms), ruim ×0,75
     (cedo, tarde ou sem toque; o especial sai mesmo assim). (b) **A ESQUIVA**: quando a energia do INIMIGO enche, ele
     carrega (cast + aura, 1–1,5 s) e solta o especial dele (2× o golpe normal, sem bloqueio de graça); o jogador pode
     **deslizar o dedo** para o lado (ou usar as setas de cada lado do pet) com o projétil no ar: nos últimos 500 ms
     antes do impacto tira 85% do dano, antes disso 50%, sem agir leva o dano cheio. **A defesa automática segue como base**
     dos golpes normais (sem agir, dano normal; agir bem reduz). A `TimingBar` segue desligada atrás das flags.
     O anel é desenhado por JS e NÃO congela com movimento reduzido (é a mecânica essencial — WCAG 2.3.3).
   - **PvP (duelo fantasma): SEM mecânica.** O especial sai DIRETO, dos dois lutadores, sem anel e sem esquiva. Continua
     **servidor-autoritativo e determinístico** (`_duel.js` + `DuelScreen`): o cliente manda os toques de cada JANELA
     (uma por golpe do dono, 13 janelas), o servidor higieniza (`sanitizeTaps`: inteiros em [0, 16]) e recalcula a
     energia, os despejos (`cheerDischarges`) e a luta; **toque forjado ou ilimitado não rende mais que o teto** (13 × 16
     toques no jogo todo = no máximo 8 despejos). O fantasma também ganha energia (dado + sofrido) e solta o especial
     dele — sem isso o duelo deixaria de ser simétrico (50% no mesmo estágio sem torcer).
   - **Batalhas mais longas — as contas (20.000 lutas por caso, `energia.test.ts`, `_duel.test.js`).** *Duelo
     fantasma:* até 26 golpes (eram 12) a ~1,7 s cada (`DUEL_STEP_MS`; era 1,5 s) = **~35–42 s** (era ~17 s depois da rodada 5
     e ~10,6 s antes); vida × 2 (`DUEL_HP_BASE` 140, 12/estágio) e o dano sorteado com mais variância (±0,74 em vez de
     ±0,5, para a mesma incerteza com mais golpes). Taxa de vitória (antes → depois): mesmo estágio sem torcer 51,3% → 50,2%;
     a 3 toques/s 73,2% → 72,3%; teto 81,9% → 81,9%; um estágio abaixo 14,5% → 13,0% (sem torcer), 30,8% → 29,2% (3 toques/s),
     38,3% → 41,3% (teto). *PvE:* vida do pet e do inimigo × `PVE_HP_SCALE` = 1,8 (e o inimigo × `PVE_FOE_HP_EXTRA` =
     1,1, porque ele agora também enche a energia e solta o especial), dano igual, `PVE_STEP_MS` = 1,7 s por lado →
     **~20–29 s por inimigo** (cada ida-e-volta ≈ 3,4 s; eram 3,6–5,0 idas por inimigo = ~12–17 s de ação, ~18–25 s com os
     popups parados da tela antiga). Inimigos derrotados por run de quem joga as mecânicas, antes → depois: Masmorra
     rookie@1 2,19 → 2,24; champion@2 2,06 → 2,05; ultimate@3 2,00 → 2,01; mega@4 1,92 → 1,91; Pesadelo (top 2) 46,4% → 50,1% de
     vitória. Quem NUNCA age (anel sempre ruim, nunca esquiva) fica abaixo (Pesadelo 25,1%); quem torce 6 toques por
     ida-e-volta ganha +0,1 a +0,2 inimigo por run. *Duelo da Arena (6 escolas × 3.000 runs):* `ARENA_HP_SCALE` 1,9 e
     `ARENA_FOE_HP_EXTRA` 0,9 → **~24 s por inimigo**; média 59,2% (antes, pet sozinho) → 59,4% jogando as mecânicas sem torcer;
     nunca agindo 34,6%; 11 toques/turno 81,6%. **Teto de duração do servidor (forfeit de 5 min, `DUEL_PENDING_MS`):**
     a luta animada do PvP leva ≤ 26 × 1,7 s = 44 s, uma fração do prazo — não foi tocado.
   - **Alternativas que perderam:** (a) o cheer como fator DIRETO por toque na energia (cada toque +x) — perdeu: o dono pediu
     uma barra de cheer que demore a carregar e despeje; (b) **arrastar/lançar o orb** no lugar do anel — perdeu: é mais
     ação e disputa o gesto livre da torcida; o anel é um toque só, com feedback claro, e já é um idioma que o dono citou
     (Pokémon GO); (c) **tocar no impacto para "aparar"** no lugar do deslize — perdeu: o toque já é torcida (e anel); o
     deslize é um gesto DISTINTO e não pode ser confundido com cheer; (d) mecânica também no PvP — perdeu por decisão do
     dono (servidor-autoritativo, sem ação do cliente que o servidor não consiga recalcular); (e) alongar a luta só pelo
     ritmo, sem mexer em vida — perdeu: o PvP já terminava quase sempre no teto de 12 golpes; sem mais vida a luta de 26 golpes
     acabaria em nocaute cedo; (f) energia só do pet — perdeu: o fantasma/inimigo sem especial deixaria o duelo assimétrico.
   - **Escolhas que ficam com o DONO (conservadoras, listadas):** a escolha do **ANEL** como mecânica do especial (e o
     ruim ×0,75 / ótimo ×1,35, a janela de ±120/320 ms e o 1,5–2,1 s do anel); o **deslize** como esquiva e os 50%/85% de
     redução; o inimigo e o fantasma soltarem o especial 2×; o ritmo de 1,7 s por golpe e a duração de ~40 s do duelo;
     e o 24 do medidor de cheer.
   - Gatilho para rever: a luta de ~40 s cansar (baixar `DUEL_STEP_MS`/`PVE_STEP_MS` ou `PVE_HP_SCALE`), o anel ficar
     difícil de acertar no celular (alargar `RING_OTIMO_MS`) ou o dono querer o especial no PvP também com mecânica.

11. **Rodada 7 / faixa A (04/10/2026): faixas clássicas, vitória da Arena destravada, golpe físico só com corte, "?" fora da luta.**
   - **Faixas do Torneio = as clássicas** (pedido do dono): Madeira/Wood 0 · Bronze 100 · Prata/Silver 300 · Ouro/Gold 700 ·
     Platina/Platinum 1100 · Diamante/Diamond 1500 · Mestre/Master 2200 (`utils/tournamentTiers.ts`). Os mínimos 100/300/700/1500
     das faixas antigas (Broto/Guardião/Ancião/Lendário) ficaram em Bronze/Prata/Ouro/Diamante; Platina e Mestre são degraus
     novos. **A regra não mudou:** a faixa é função só do `lifetime` do próprio jogador, então só sobe (testado). O campo
     `emoji` saiu do modelo; o símbolo é um glifo do inventário, sem box (park · military_tech · star · emoji_events ·
     auto_awesome · diamond · swords), e as 5 insígnias antigas (rodada 3) ficaram sem consumidor — arte de metal por faixa é
     o prompt P3 do dono. A aba de Missões do Torneio passou a usar o "?" amarelo (`question`, A2). *Alternativa que perdeu:*
     manter os 5 degraus só renomeando (Madeira…Ouro, Mestre) — perderia o par Platina/Diamante que o jogador espera nas clássicas.
     *Falsifica:* se jogadores reais ficarem presos em Diamante sem horizonte, abaixar o `min` de Mestre.
   - **A3 (bug):** o golpe que derrubava o ÚLTIMO inimigo da Arena desligava a luta (`running` dependia de haver inimigo vivo)
     dentro da pausa de fim — `onVictory` nunca rodava: inimigo apagado e tela travada. Agora a luta só para quando a fase vira
     `rodada-limpa` (teste de regressão em `ArenaGame.torcida.render.test.tsx`).
   - **A5:** o golpe FÍSICO (investida) mostra só o CORTE; o splash de impacto é do dano à distância/mágico (e do escudo/movimento
     reduzido, que não têm corte). **A6:** o Duelo fantasma sorteava físico/à distância pela paridade do índice do evento —
     como os lados se alternam, o oponente era SEMPRE à distância; agora alterna por lutador.
   - **A7/A8:** nenhum "?" dentro da luta (a explicação de torcer/anel/esquiva mora no InfoTip único da folha do Duelo); a
     explicação da Feira foi reescrita para leigo (o que é · o que se faz · o que se ganha), no InfoTip único da sala.

> **Nota 04/10/2026 (rodada 6):** item 10 — cena maior com mascote da torcida, barras de HP e ENERGIA em cima do
> personagem, barra de cheer lenta (24) que despeja energia, especial por energia cheia, anel e esquiva no PvE, PvP
> direto, lutas de ~40 s (PvP) e ~20–30 s por inimigo (PvE); Pesadelo e Masmorra entram na `BattleStage`.
> **Nota 02/10/2026 (rodada 5, I10):** item 9 — cena de combate em tela cheia, golpes
> com a arte do elemento, luta mais lenta (gauge 8 → 16 no duelo e na Arena).
> **Nota 02/10/2026 (noite):** item 8 — esquiva removida, defesa automática, especial 3×.
> **Nota 02/10/2026 (tarde, rodada 4):** itens 6 e 7 acima — o Duelo da Arena
> entra na torcida (TORC-2 respondida) e o PvP perde o interruptor. O item 1 já
> dizia "Torneio, Pesadelo e Masmorra"; a Arena é o quarto lugar.

## 21. Travessias viram MISSÕES DO DIA: 3 por dia, escolhe 1, Marcos de Aventura e viagem da noite (04/10/2026)

Pedido do dono sobre o "scroll"/Passeio da Exploração. Implementado na branch
`feat/r6-explor6`; **tudo é cosmético e opt-in** — nenhum valor de economia mudou
(Travessia continua sem Bits, XP, Emblema, Vínculo, `perfectDays` ou evolução;
contrato `travessias.contract.test.ts`).

1. **Cara de missão: "!" e "?".** Dois glifos autorais (`exclamation` — que já
   existia para as Missões do Torneio — e o novo `question`, em `ui/NavGlyphs.tsx`)
   viram o marcador `MissionMark` (`components/play/MissionMark.tsx`): **"!" = há
   missões do dia para escolher; "?" = uma escolhida, esperando o "Fiz"; nada = feita
   hoje ou camada escondida**. Aparece no card do Passeio e **sobre o lote do Passeio**
   na Exploração (`missionMark(c, dayKey)`, em `travessiasSave.ts`, para não
   puxar o catálogo ao chunk de entrada). Parado: sem animação, sem som, sem número.
   Os dois são nomes próprios, fora do subset da fonte (`iconInventory.contract`).
2. **3 missões por dia, escolhe 1.** `dailyOffer(dayKey, seed)` (pura) sorteia 3
   das 21 propostas (7 regiões × 3), **de 3 regiões diferentes** (cada missão é um
   cenário distinto, sem repetir no dia), com semente = dia do jogador + id do save:
   reabrir a folha nunca re-sorteia. `pickMission` só aceita uma das três; antes do
   "Fiz" dá para trocar (Recuar); depois, não. A escolhida **vale só para aquele
   dia** (`CrossingsState.pickDay`): no dia seguinte saem três novas, sem "atraso"
   nem culpa. Segue **um "Fiz" por dia no total** (F5 de 02/10 mantido).
   **O modal "Todas as Travessias" (as 21) saiu da UI** — a oferta do dia o substitui;
   o catálogo continua o mesmo.
3. **Pontuação: "Marcos de Aventura".** `score` = nº de missões feitas (1 por "Fiz",
   no máximo 1/dia, **nunca cai**, teto de sanidade 9999). Aos **5, 10 e 20** o
   Soulmon volta com um **postal cosmético** (`MARCO_POSTAIS`, ids `trv-marco-N`) na
   primeira noite livre (a noite que abre região tem prioridade) — derivado do total +
   diário, sem estado extra. O total aparece discreto ("Marcos de Aventura · 7", só
   com 1 ou mais, nunca "faltam N"), com a regra atrás de um `InfoTip`.
4. **Viagem da noite.** O "Fiz" guarda `trip = { day, region }`. No relatório daquele
   dia, `passeioFindOfDay` troca o sorteio pelo **cenário da missão**: na noite em que
   a região abre vale a cena de chegada de sempre; depois, **uma de 3 historinhas por
   região** (`data/travessiasViagens.ts`, 21 no total, 1ª pessoa do pet, 2–3 frases,
   preferindo a ainda não coletada). Mesmo mecanismo do achado da noite e do diário —
   nenhum sistema paralelo. Ordem do achado: já guardado > chegada de região > postal
   de Marco > viagem da missão > destino do Passeio > Aventura comum.
5. **Texto explicativo atrás de `InfoTip`** (passeio, missões, versão que vale,
   Marcos); a linha de segurança e a linha "No mapa" seguem visíveis.

**Alternativas que perderam (pontuação):**

| Alternativa | Por que perdeu |
|---|---|
| Pontos que viram Bits/XP | Farmável; veta a economia (Travessia não paga nada) |
| Sequência de dias / "streak" | Culpa e FOMO; contradiz R-1 e a linha vermelha (`PROPOSTA-MISSOES-EXPLORACAO.md`) |
| Pontos por dificuldade ou por região | A barra é amplitude, nunca dificuldade crescente (§5.6) |
| Placar semanal / reinício | Perde ao não fazer: o oposto do pedido |
| Marcos que abrem REGIÃO | Já há o teto 1 região/noite (R-32); misturaria duas regras. Ficou cosmético |
| Marcos que dão item de decoração | Pede arte e catálogo novos; fica como sugestão (pergunta 2 abaixo) |

**Falsifica:** se a pessoa passar a marcar sem fazer, ou se o "!" diário virar
obrigação (queixa de culpa), tirar o marcador do lote e voltar à oferta sem "!".

**Perguntas conservadoras ao dono (não decididas aqui):**
1. O "!" sobre o lote aparece **todo dia** enquanto a missão do dia não for feita —
   é o pedido, mas é a coisa mais "badge" do app; aceita assim, ou só aparece 1× por
   dia / some depois de aberta a folha?
2. Marcos 5/10/20: ficam só como postais, ou algum vira troféu/decoração (precisa arte)?
3. A regra antiga "a folha nunca mostra total" (R-5) abriu uma exceção: o total de Marcos.
   Confirma que é só esse número (e que continua sem "faltam N")?

## 22. Oficina do Foco e Caderno: dois prédios novos na Exploração (04/10/2026)

Pedido do dono: um prédio de TÉCNICAS de gestão de tempo e produtividade (Pomodoro e outras) e uma missão de
journaling, "talvez tudo na Exploração". Plano completo, catálogo e fontes em
[`PLANO-OFICINA-FOCO.md`](PLANO-OFICINA-FOCO.md); implementado na branch `feat/r6-oficina`. **Nada muda na
economia** (sem Bits, XP, Emblema, Vínculo, `perfectDays`); nada vai ao save.

1. **Dois lotes na clareira de baixo** do `bg-exploracao` (que estava vazia): `oficina` (Oficina do Foco, NPC Tique)
   e `caderno` (Caderno / Journal, NPC Sépia). Arte e bustos PROVISÓRIOS (sprites do Observatório e da Biblioteca;
   bustos `ferreira` e `lua` de `EXTRA_NPC_ART`). Contrato de geometria e de NPC (agora 20 lotes) seguem verdes.
2. **Timer de foco real** (25/5 e 50/10) por timestamp (`endAt`), persistido só no aparelho; aviso ao fim na tela +
   vibração curta + notificação local SÓ se a permissão já estava concedida (nunca é pedida aqui). "Foquei" é uma marca
   LOCAL do dia (sem total público, sem sequência, sem placar, 14 dias).
3. **Catálogo de 7 técnicas** com fonte e nível de evidência dito no `InfoTip` (forte: se-então; moderada: Pomodoro,
   esvaziar a cabeça; fraca: blocos 50/10 e 90/20, 2 minutos, Eisenhower, o sapo). A copy descreve, nunca promete.
4. **Caderno sensível, NO SAVE NA NUVEM do titular** (decisão do dono, 04/10/2026 — reverte a 1ª versão,
   que o deixava só no aparelho): `GameState.caderno` (até 120 entradas × 2000 caracteres, sanitizado no load
   e clampado em `functions/api/save.js`; 120 × 2000 cabe folgado nos 5 MB). Migração única do
   `localStorage` (`soulmon-caderno`) para o save, que apaga a chave. **Nunca** entra em payload de IA/chat,
   telemetria, métricas, perfil público ou guilda (contrato `cadernoSensivel.contract.test.ts`); entra na
   exportação e some com a exclusão da conta (o save inteiro é exportado e apagado). Declarado em
   `public/privacidade.html` §2 (PT e EN), `PRIVACY_VERSION` = `2026-10-04` (re-pede ciência dos termos).
   Sem Bits/XP/selo/hábito. Linha de apoio se o texto casa com o léxico de sofrimento, no aparelho.
5. **Vibração ao fim do foco: ligada por padrão**, com interruptor em Configurações › Seus dados
   (`soulmon-foco-vibrate`, só do aparelho).

**Alternativas que perderam:**

| Alternativa | Por que perdeu |
|---|---|
| Bits/XP por sessão de foco ou por entrada do Caderno | Farmável (foco vazio, texto vazio); veta a economia — e premia o app, não a vida |
| Sequência de dias de foco ou de escrita | Culpa e FOMO (linha vermelha; mesma razão do §21) |
| Caderno SÓ no aparelho (a 1ª versão) | Perdia as anotações ao trocar de aparelho ou limpar o navegador; o dono preferiu o save na nuvem do titular, com a sensibilidade protegida (04/10/2026) |
| Texto do Caderno enviado à IA para "devolutiva" | Quebra a promessa de privacidade e arrisca "diagnóstico" |
| Chamar o prédio de "Diário" | Colide com o Diário de Aventuras (o álbum do pet) |
| Um lote só para tudo (técnicas + journaling) | Duas funções sem relação; o pedido falava em prédios (plural) |
| `setInterval` cumulativo para contar o tempo | Atrasa em aba em segundo plano; o timestamp é exato |
| Pedir permissão de notificação ao iniciar o timer | Pedir permissão é decisão do app, não de uma folha |

**Falsifica:** se as pessoas marcarem "Foquei" sem focar, ou o Caderno virar obrigação (queixa de culpa), tirar o
"Hoje: N" e o formato do dia.

**Respondidas pelo dono em 04/10/2026:** nome "Caderno / Journal" aprovado; o Caderno não rende nada; vai ao save na nuvem; vibração ligada por padrão com interruptor; bustos provisórios Tique/Sépia ficam.

## 23. Torneio R8: Mestre/Grão-Mestre por posição, molduras, desafiantes NPC e "i" único (04/10/2026)

Respostas do dono de 04/10/2026 (faixas Madeira 0 · Bronze 100 · Prata 300 · Ouro 700 · Platina 1100 · Diamante 1500;
Mestre = top 100; Grão-Mestre/Grandmaster = top 20, ícone com "#N"). Implementado na branch `feat/r8-torneio`.
(O pedido citava "§20"; o §20 já era o do Combate, por isso esta seção é a 23.)

1. **Mestre e Grão-Mestre são LUGARES da season, não faixas de pontos** (`tournamentTiers.ts` › `TOURNAMENT_SEATS`).
   O Mestre deixou de ser o 7º degrau de pontos (2200). Regra decidida aqui (recomendação do lead, [pendente do dono]):
   - a posição é a do **ranking da season** (pontos da season, o mesmo que dá os troféus), não a do lifetime;
   - só disputa o lugar quem já tem **lifetime ≥ 1500** (`SEAT_MIN_LIFETIME`, a faixa Diamante) — sem isso, numa season
     com três jogadores o 1º colocado com 20 pontos viraria Grão-Mestre;
   - o lugar é **VIVO**: quem sai do top 100/20 volta, na hora, à faixa que os pontos lifetime dão (Diamante para quem
     é elegível) — **nunca abaixo dela**. As seis faixas de pontos continuam só subindo; o que se perde é o lugar, que
     se ganha de volta subindo de novo. A virada de mês (season nova) reabre todos os lugares;
   - o ícone mostra "#N" = a posição; no Grão-Mestre o #N é lido como o nível (#1 é o topo).
2. **Servidor:** `functions/api/community.js` › `action=rank&id=` passa a devolver `myPlace` (a posição REAL do
   jogador, contando também quem está oculto da lista pública), só para o dono autorizado (`denyUnlessOwner`). Sem
   rota nova. Cliente com servidor antigo cai na lista pública (top 50: serve ao Grão-Mestre, não ao Mestre inteiro).
   **Limite conhecido:** o `rank` lê até 300 chaves do KV, em ordem de chave (não de pontos) — acima de 300 jogadores
   na season a posição deixa de ser confiável. **Plano do que falta:** um índice ordenado da season (KV `rankIndex:<season>`
   regravado no `match`, ou D1 com `ORDER BY points`), e então `myPlace` sai dele; e, para mostrar a moldura/faixa dos
   OUTROS no ranking, publicar `frameId` no perfil público (decisão de privacidade do dono — hoje só o próprio jogador
   vê a própria moldura).
3. **Molduras de avatar** (`utils/frames.ts`, `components/ui/AvatarFrame.tsx`): catálogo com origem `rank | shop |
   achievement | event`; `GameState.ownedFrames` + `GameState.equippedFrame` (`?? []`/`?? null`, saneados no load e com
   forma conferida em `save.js`). As de rank seguem a faixa (Madeira…Diamante por lifetime; Mestre/Grão-Mestre só com o
   lugar ocupado — se perder o lugar, a tela desenha SEM moldura e o id fica guardado). **Cosmética, nunca vantagem**
   (teste trava os campos). Arte ainda não existe: anel CSS placeholder; quando chegar, troca por imagem no próprio
   componente. **Moldura de avatar é peça própria, não "ícone dentro de box"** — a regra do dono vale para glifos de UI,
   que seguem pelados; a moldura envolve a criatura. Compra na loja com Bits e concessão por conquista/evento ficam
   para a próxima fatia (o catálogo já traz preço/como; falta o item na loja e quem grava em `ownedFrames`).
4. **Torneio vazio → três desafiantes NPC** (`utils/tournamentNpcs.ts`: Espina/Thorn, Quartzo/Quartz, Maré/Tide, com os
   retratos `duelo-oponente-1/4/5`). É o TREINO com outra roupa: não chama o servidor, não conta partida do dia, não rende
   Honra/pontos/XP/missão; estágio do jogador. O cartão diz "Treino" e o resultado diz "Sem prêmio e sem custo" —
   disfarçado no formato, nunca mentindo.
5. **"i" único no Torneio**: um `InfoTip` no canto superior direito (ao lado da insígnia), com seções para faixas,
   desafiar/lista pública, luta e treino, missões, loja e molduras. Os cinco "i" de antes saíram.

**Alternativas que perderam:**

| Alternativa | Por que perdeu |
|---|---|
| Mestre por limiar de pontos (2200), como até a R7 | O dono definiu Mestre/Grão-Mestre por posição (top 100/20) |
| Lugar de topo "só sobe" (uma vez Mestre, sempre Mestre) | Viraria um título permanente de quem jogou cedo; o top 100 de agosto não é o de outubro. A proteção "só sobe" fica nas faixas de pontos |
| Rebaixar a faixa de pontos ao sair do top | Quebra a tese das faixas (medir o jogador contra ele mesmo) |
| Posição pelo lifetime | Lifetime só soma: o topo congelaria nos veteranos e ninguém novo chegaria |
| Lugar sem piso de lifetime | Season vazia faria Grão-Mestre de quem jogou uma partida |
| Rota nova de servidor para a posição | `myPlace` cabe na rota `rank` que já existe, com a mesma autorização |
| NPC contando partida/rendendo Honra | Seria farm sem adversário real; o pedido era treino disfarçado |

**Falsifica:** se o ranking mostrar gente "caindo" de Mestre e saindo do Torneio (queixa de perda), rever para um lugar
que vale até o fim da season (congelado na virada) em vez de vivo.

**Perguntas ao dono (em `docs/PERGUNTAS-DO-DONO.md` quando houver o lote):** (a) lugar vivo ou congelado até o fim da
season? (b) o piso de lifetime 1500 para disputar o lugar está bom? (c) mostrar a moldura dos outros no ranking
(publicar no perfil público)? (d) preços das molduras de loja (600/900 Bits) e quais conquistas/eventos dão moldura?

## 24. Ícones de interação em pixel na UI do aparelho — exceção à tese "O Visor" (04/10/2026)

**Decisão do dono (04/10/2026, repassada pelo coordenador da instalação de arte):** *"os ícones ui-\* (ciclo do
dia, atividades, passivas, recompensas, status) DEVEM ser usados na UI, mesmo fora do visor — a regra 'pixel só
dentro do visor' cede para eles."*

O que muda: o set de 39 ícones das folhas `ui-*` (gerado pelo dono, alfa real; ordem em
`E:/Soulmon-assets/entrada-dono/ui-icones-MANIFEST.json`) entra em superfícies do APARELHO — catálogo de
atividades, Estatísticas, relatório da noite, cadeados da loja e das molduras, skill básica do Pet. A tese
`docs/manual/04-IDENTIDADE-VISUAL.md` §1 continua valendo para todo o resto: a exceção é **este set**, não uma
licença geral para pixel art fora do vidro. Os ícones continuam pelados (regra "ícone nunca dentro de box").

Onde ligou (só onde havia slot): atividades → cartão do `CatalogBrowserModal` e do `CatalogOnboardingFlow` (23 de
28 têm arte); passivas → linha de traço das Estatísticas (as 5 do jogo; coruja/brincalhão/paciente ficam sem
passiva); ciclo do dia + estrela de recompensa → manchete do relatório da noite (`REPORT_HEAD_ART`); cadeado →
`ShopShelf` e `FrameSelector`; raio → skill básica no Pet. Sem slot (em disco, fora do bundle): as 3 chamas de
streak (o app recusa streak por tese — `HomeHud`), sino, escudo, cadeado aberto, 4 peças do ciclo do dia e 7 de
recompensa.

**Alternativa que perdeu:** redesenhar o set em SVG/Material para respeitar a tese (era a recomendação do
`LOG-GERACAO.md` da leva).

**Falsifica:** se a crítica de design medir a tela com as duas linguagens brigando (glifo Material + pixel lado a
lado na mesma lista) e o dono preferir a coerência, o set volta para dentro do visor e os slots caem no glifo
(todo chamador já tem o fallback).

## 02/10/2026 — Torneio: menu só de ícones e faixa no título; Rhinoco vira Tuska

Decisões do dono (pedido de 02/10/2026):

1. **O menu do Torneio tem três entradas, só ícone:** Desafiar (`swords`),
   Missões (`task_alt`) e Loja (`storefront`); o nome fica em `aria-label`/`title`.
   A aba "Faixa" saiu do menu e a folha **abre em Desafiar** (cai direto no
   combate). Alternativa que perdeu: manter a Faixa como quarta aba.
2. **A faixa vira indicador no canto direito da linha do título** (a insígnia
   atual, `TierMark`); tocar abre a folha com todas as faixas, a atual
   destacada, o progresso e o "só sobe", com seta de voltar no topo esquerdo.
   A regra e o texto de progresso não mudaram — só de lugar (a faixa continua
   vindo antes do ranking).
3. **Texto da temporada mínimo:** "Dias restantes: N" / "Remaining days: N"
   (fora da rodada, "Próxima rodada: N dias" / "Next round: N days"). Sem frase.
4. **Renome do campeão do Duelo da Arena: Rhinoco → Tuska** ("Tuska, o
   campeão" / "Tuska, the champion"). Motivo: o nome anterior era pouco
   agradável ao dono. Nenhum outro NPC muda; os arquivos de arte
   (`npc-arena-duelo`) mantêm o id. As menções históricas (esta seção
   anterior, `reviews/2026-09-30-ingles-primeiro-nomes.md`) ficam como estavam.

## 24. Combate v3: progressão por level, Vínculo com efeito de jogo e 5% no PvP (05/10/2026)

Decisões do dono no run SQUAD-Alpha `combate-v3-01` (Discovery reaberta). Plano: [`PLANO-COMBATE-V3.md`](PLANO-COMBATE-V3.md) §11. Em implementação por PRs (o PR7 cobre os itens 1 e 2, 8 e 10: ver §24.2).

1. **Revogada** a regra "a recompensa do Vínculo é só cosmética" (`bond.ts`, invariante 3). O Vínculo passa a ser o level do usuário e dá 1 ponto de talento por level.
   - Perderam: (a) um segundo level de usuário, que duplicaria a fonte da verdade (footgun 9); (b) não ter level de usuário.
2. **Revogada** a regra "escada de gates é grind com outro nome" (`bond.ts` §6). Arena/PvP, Torneio, andares altos e Renascimento passam a ter gate pelo level do Vínculo. A copy dos gates segue `copy.semFomo`.
   - Perdeu: manter um gate único (Vínculo ≥5).
3. **~5% de vantagem de talento/equipamento vale também no PvP.** O dono aceita conscientemente a contradição com "a estratégia só muda o playstyle". A linha vermelha fica de pé: nada comprável com dinheiro real dá vantagem percentual.
   - Perderam: (a) só PvE com PvP normalizado (recomendado pelo benchmark: GW2 sPvP, VGC); (b) talento só muda escolha, sem número.
4. **Chips de atributo** deixam de dar +3 pontos e passam a influenciar só a distribuição dos pontos na evolução. Isso fecha o caminho Créditos→Bits→atributo.
   - Perderam: (a) remover os chips; (b) remover o câmbio Créditos→Bits.

### 24.1 Adendo — decisões do dono de 05/10/2026 (contexto do run §2.10 e §2.11)

5. **Sorte no dano: AR(1) por golpe, ρ = 0,9, σ = 15%** (piso do multiplicador 0,05). O mais fraco por 5% vence ~31%; o mais fraco por 1 level, ~19%. RNG `mulberry32` com seed por luta e stream por lado; no PvP a seed é do servidor. As metas de win rate do mais fraco são decisão do dono. Implementado no núcleo puro `src/utils/combate/` (PR1).
   - Perderam: (a) cauda de crítico (3–5% ×2,5–3); (b) uniforme ±v por golpe; (c) sorteio anticorrelacionado por luta.
6. **Equipamento: loja direta e fragmentos, SEM RNG, só com moeda ganha jogando.** Nenhuma lootbox.
   - Perderam: (a) lootbox com teto, pity e odds exibidas; (b) Créditos→Bits para equipamento com teto diário de +25%.
7. **Créditos aceleram só o que não é combate** (cosmético e conveniência), com teto de +25% sobre o ritmo grátis. Slots pagos de Comércio entram no mesmo teto. Equipamento nunca é comprado com Créditos.
8. **Renascimento = pago + gate de Vínculo.** O Vínculo nunca é pago.
9. **Chips dão SÓ pontos de tipo** (Poder/Harmonia/Benevolência) e afetam APENAS a evolução, sem efeito direto em combate. Chips já comprados ficam como estão (sem reembolso e sem conversão); o +3 legado no PvP é tratado no clamp/normalização, e se não couber vira risco de checkpoint.
10. **Respec de talentos é sempre pago, com moeda ganha.**
11. **ROLE_SHAPE fica**, limitado a ±25%.
12. **Classificação Livre, com acesso provável por menores: o ECA Digital (Lei 15.211/2025) é tratado como aplicável.** A análise jurídica foi feita pelos próprios agentes (alpha-compliance, com fontes primárias). **É análise interna por IA, NÃO é parecer de advogado.** Não bloqueia o PR8, porque o desenho não tem RNG pago nem Créditos→combate.

### 24.3 PR7b — canal de PvP por atributo, dois talentos redesenhados, "Vínculo N" (06/10/2026, decisões do dono, contexto §2.25)
- **Canal de PvP por atributo.** `tal-pvp-01/02/03` caem em ATK (dano dado), DEF (dano recebido) e SPD (ritmo). O teto continua UM: a SOMA dos três canais, de todas as fontes, nunca passa de 5% (`combinedAttrBonus`; acima disso os três escalam juntos, o formato da build fica). DEF e SPD entram no stat de forma exata ((1 + stat/K)(1 + b)), então o motor não mudou. O servidor (`_duel.js`) recalcula tudo do save. Medido (razão das médias, HP×3): cada canal no teto vale 5,03% (ATK), 4,89% (DEF), 5,01% (SPD): nenhum atributo é atalho.
  - Perdeu: três nós dando o mesmo número num canal único (a escolha real era entre caminhos, não entre nós); teto de 5% POR canal (daria 15% no total).
- **`tal-pvp-05` (Mão aberta) redesenhado:** +5% por grau (até +15%, `CHEER_SCALE_MAX`) no rendimento da torcida do Duelo. Ação do jogador (só rende quando ele toca), só o seu lado, só moeda de jogo, nada de câmbio. Medido no teto de torcida: o inimigo cai 0–1,0% mais cedo e a vitória sobe 0–3,6pp contra o espelho (≤ o 5% da régua).
  - Perdeu: "câmbio pago / torcida fora da régua" (linha vermelha: dinheiro real nunca vira vantagem).
- **`tal-com-05` (Balança) redesenhado:** refazer UM ponto à escolha, pelo preço de um ponto do respec (Bits ganhos, com a ampulheta). Só preço e conveniência.
  - Perdeu: "conveniência de câmbio" (encostava no teto de +25% dos Créditos).
- **StatsPage:** "Nível de vínculo / Level N" virou "Vínculo N / Bond N" (NARRATIVA §12).

### 24.7 PR17 — o nome do golpe básico segue o par; a vantagem do par vem da base dominante (07/10/2026, contexto §2.35)
- **Regra.** O NOME do básico usa o elemento dominante da ficha (base OU par, `elementoDominante`) — a mesma fonte do efeito visual (`fighterIdentity`). O `elementoId` da básica, que a Arena lê para a VANTAGEM, é sempre uma BASE: a própria, ou a **base dominante do par** (o componente de maior peso na ficha; empate = o primeiro da receita). Dono único: `baseDominanteDoElemento` (`soulProfile/ficha/elementoNome.ts`), chamado por `elementosDoStage`.
- **Sem multiplicador novo, sem tocar no orçamento, em `arena.ts` nem nas constantes**: a vantagem continua ±1 golpe pela mesma tabela de 17 bases. O servidor (`_duel.js`) não deriva nome nem vantagem do básico, então não há espelho a mudar; ele já publica o elemento do par só para o efeito visual.
- **O chip de elemento do básico na UI mostra o PAR** (07/10/2026, dono): a Essência da intro da Arena e o elemento visual do lutador vêm de `fighterIdentity(...).basico.elemento` (a mesma fonte do nome); só a VANTAGEM (`basica.elementoId` -> `elements` do motor) continua na base dominante. Régua: `ArenaGame.render.test.tsx`.
- **Saves existentes** guardam o nome e o `elementoId` antigos; só a PRÓXIMA evolução usa a regra nova (mesmo critério do PR15).
- Perdeu: manter o nome pela base (mostrava "Golpe de Fogo" com golpe de vapor); dar vantagem pelas DUAS bases do par (mudaria a paridade ±5%).
- Gatilho de rever: se a régua de paridade ±5% sair da faixa.

### 24.5 PR8b — telas do equipamento, fragmentos e o câmbio visível (06/10/2026)
- **`EquipmentCard`** (StatsPage, `lazy`, só com métricas visíveis): 3 slots, 9 itens com preço em Bits ganhos e em fragmentos, equipar/tirar; ícones = os 13 já instalados (sem arte nova). Recusas neutras; o texto diz que não há sorteio nem compra com dinheiro.
- **Fragmentos:** a run COMPLETA da Masmorra (os 5 andares, `handleGlitchtama`) rende `FRAGMENTS_PER_RUN` = 5 (default da squad), +5% por grau de `tal-com-02` até +25%. Sem teto diário próprio (a run é o portão); o equipamento inteiro vale no máximo 4,5% e o teto de 5% é um só.
- **Câmbio de Créditos:** a aba mostra quanto cabe hoje (25% do ganho grátis do dia) e desabilita o pacote que não cabe; amanhã a conta abre de novo. A compra de Créditos atrás de verificação de idade segue story pendente.

### 24.4 PR8a — equipamento e procedência dos Bits (06/10/2026, decisões do dono, contexto §2.26)
- **Equipamento:** 3 slots, um por atributo (Núcleo=ATK, Carapaça=DEF, Rastro=SPD), 3 tiers (+0,5% / +1% / +1,5% no atributo do slot; os três no tier 3 somam 4,5%). Aquisição por **loja direta (Bits GANHOS) ou fragmentos**, sem sorteio, sem caixa, sem chance (teste lê a fonte e reprova `Math.random`/`odds`/`pity`). Percentual, nunca ponto plano (o item plano de +1 ponto no L1 passa de 5%: prova de vermelho). Entra pelo canal único de 5% (PvP por atributo, fenda como soma); o servidor recalcula do save e descarta slot forjado.
  - Perdeu: caixa/lootbox com pity (o dono decidiu: sem RNG); equipamento de ponto plano (estoura o teto com +1); equipamento comprável com Crédito (linha vermelha).
- **Só moeda GANHA compra equipamento.** O saldo `gamePoints` segue sendo um número só; `bitsOrigin` guarda quanto dele veio de Crédito (`paidLeft`), e o equipamento só enxerga `saldo − paidLeft`. O gasto que não é equipamento (loja de cosméticos, respec) gasta o Bit pago primeiro. Save sem o campo: todo Bit é ganho. Limite honesto: é regra de cliente (o save é local-first); o servidor garante a forma e o teto de 5%.
- **Câmbio de Créditos com teto de +25% do ganho grátis do dia** (`CREDIT_BITS_CAP_RATIO`), com piso de referência de 100 (um dia completo) para o dia sem ganho. O pacote que passa do teto NÃO é cobrado (conferido antes de gastar o Crédito) nem partido. Consequência: os pacotes de 100/250/600 Bits só cabem em dias de 400/1.000/2.400 Bits grátis (a loja de Créditos em si NÃO muda neste PR; a compra de Créditos atrás de verificação de idade segue como story pendente).
- **Comércio** liga dois nós: `tal-com-01` (equipamento −4% em Bits por grau) e `tal-com-02` (+5% de fragmentos por grau, até o teto de +25%). Só preço e ganho de moeda; nenhum dá % de combate.
  - Perdeu: Crédito comprando equipamento; Comércio dando bônus de combate.

### 24.4 Tarefa B — árvore de talentos com pré-requisitos (07/10/2026, decisão do dono, contexto §2.37)

- **Pré-requisitos no grafo** (`requires` ALL-OF, `requiresAny` ANY-OF em `src/utils/talents.ts`, espelho `_talents.js`, desenho em `talentLayout.ts`): centro, 3 caminhos, bifurcação e reencontro. Só se acrescentou o que abre cada nó; ids, graus e efeitos não mudaram.
- **O que só viola pré-requisito é PODADO, não descartado** (decisão do dono): cliente e servidor mantêm os graus que se compram (replay em ponto fixo) e os pontos dos outros VOLTAM, sem cobrar respec. **Vetor malformado** (id inventado, grau/ponto a mais, tipo errado) segue DESCARTADO inteiro.
  - Perdeu: descartar o vetor inteiro também por pré-requisito (castigaria o save de antes dos ramos por um dado que a pessoa não jogou).
  - Gatilho de rever: se alguém achar forma de ganhar poder podando; hoje o que sobra é sempre um vetor válido dentro dos pontos.
- **Os oito nós "em breve" entraram com efeito (decisão do dono, 07/10/2026)** — PvP 04/06/07, PvE 03–07 (Comércio 04/06/07 já estavam). Regras: sem RNG, nada pago alcança talento, **talentos NÃO modificam o especial**, Masmorra/Pesadelo sem torcida; o que é % de combate passa pelo canal único de 5% (`combinedAttrBonus`/`combinedBonus`), o que não é (largada, resistência, cura, Bits, escudo) tem teto próprio pequeno e foi medido. Efeitos: `tal-pvp-04` +3 de energia (de 100) por grau (teto 9; ~0,1% no KO); `tal-pvp-06` −6% do dano contínuo recebido por grau (teto 18%; ~3,9% no pior caso, contra um especial de DoT); `tal-pvp-07` +0,2% em cada canal do Duelo; `tal-pve-03` +0,5% do HP máximo por grau na cura entre andares (teto 1,5%); `tal-pve-04` +3% por grau nos Bits da fenda (teto 9%, o placar da run não muda); `tal-pve-05` +0,4% por grau só no Pesadelo; `tal-pve-06` +0,4% por grau na fenda; `tal-pve-07` escudo de 1% do HP na PRIMEIRA luta de cada andar (e na 1ª rodada da Arena).
  - Interpretações conservadoras a levar ao dono: `tal-pvp-07` ("+1 turno de reforço") e `tal-pve-06` ("escudo do especial mais forte") mexiam no especial, então viraram bônus de atributo pelo canal de 5%; `tal-pve-03` ("mais cura recebida") ficou só na cura entre andares; escudo e cura foram reduzidos de 2%/3% para 1%/1,5% porque a parede do andar 5 da Masmorra é íngreme (medido: média de andares 4,18 → 4,80 com os dois nos tetos antigos; ~+0,3 nos novos).

### 24.2 PR7 — Vínculo como level do usuário: talentos e portões (06/10/2026)

O que o PR7 implementou das decisões acima, e o que perdeu a disputa.

- **Invariante 3 do Vínculo REESCRITO (não contornado)** em `src/utils/bond.ts` e `bond.test.ts`. Antes: "recompensas 100% cosméticas, nunca vantagem de combate". Agora: o Vínculo é o level do usuário (1 ponto de talento por Vínculo, portões em `gates.ts`); o catálogo `BOND_REWARDS` segue cosmético; a única vantagem de combate é o talento, sob o teto único de 5%; nenhum caminho pago alcança talento, ponto ou portão.
  - Perdeu: manter o invariante e esconder o talento fora do Vínculo (seria um segundo level de usuário, footgun 9).
- **§6 do `bond.ts` reescrito** ("escada de gates é grind"): uma tabela única `src/utils/gates.ts` (espelho `functions/api/_gates.js`, `gates.parity.test.js`) com Arena/PvP, Torneio, andares altos da Masmorra (a partir do 4; o andar 1 segue livre) e Renascimento. Valores são DEFAULTS da squad, o dono ainda os confirma.
  - Perdeu: gate único (Vínculo 5) e o gate de Masmorra por "sem gate de entrada".
- **Renascimento = conta paga + Vínculo** (`rebirthGate.ts`, recusa `low-bond`): o dinheiro não compra Vínculo.
- **Talentos** (`src/utils/talents.ts`, espelho `_talents.js`): persistido só `talentPicks: string[]` (um id por grau); pontos = Vínculo até 20; 3 caminhos; a árvore nunca fecha; vetor inválido é descartado inteiro no `save.js` e vale 0 no duelo; entra pelo canal `combinedBonus` (teto único de 5%). Respec sempre pago em Bits. Os dois talentos que tocavam linha vermelha (`tal-pvp-05`, `tal-com-05`) foram redesenhados no PR7b (§24.3).
  - Perderam: talento só PvE com PvP normalizado; talento sem número.

### 24.6 Fechamento do run `combate-v3-01` (06/10/2026, PR10): decisões do dono, alternativas que perderam e medições

Consolida as decisões do dono do run (contexto §2.3–§2.26). Plano: [`PLANO-COMBATE-V3.md`](PLANO-COMBATE-V3.md) (concluído). Regras vigentes: [`manual/02-REGRAS-DE-NEGOCIO.md`](manual/02-REGRAS-DE-NEGOCIO.md) §55-B.

1. **Curva de atributos: por level, com golpes = ceil(HP × (1 + DEF/k) ÷ (1 + ATK/k)) e HP que cresce sozinho.** Substitui o "1 ponto por dia" e o boost de evolução do handoff.
   - Perderam: (a) curva ADITIVA (o build puro domina); (b) curva MULTIPLICATIVA (domina o distribuído, e o estágio longo quebra o equilíbrio); (c) PROPORCIONAL pura ao ponto diário (a spike da Fase 1 foi arquivada em `_superseded`). A curva re-escala por estágio: dentro do estágio +1 ponto ≈ 1 golpe (~10%), entre estágios o equilíbrio vem do ×1,5.
2. **Régua de balanço = TEMPO para vencer no espelho (±5%), não win rate.** A régua de win rate (F1, ±5pp, §2.3) foi trocada na Fase 1 e a régua pareada passa a medir a média de muitas seeds (a sorte do golpe entra no motor). Empate é resultado válido (sem pontos), sem desempate por %HP.
   - Perdeu: win rate ±5pp contra o dano direto.
3. **Golpe normalizado e sorte AR(1)** (ρ = 0,9, σ = 8%, `HIT_UNIT_H0` = 10): cada ataque vale ~1/10 do espelho em qualquer level, o que substitui o σ 15% do §24.1 item 5. Metas do mais fraco mantidas (por 5% ~31%; por 1 Lv ~19%). A maré de sorte fica OCULTA na UI.
   - Perdeu: σ 15% com golpe cru (sem normalizar o valor do golpe por level).
4. **5% de vantagem também no PvP, com TETO ÚNICO.** Foi aceito no checkpoint com a promessa "~90% de vitória entre iguais na mesa" (§2.9). Medido depois do golpe normalizado e do teto único (soma dos canais ATK/DEF/SPD, de todas as fontes, nunca acima de 5%): o mais forte por 5% vence 64–67%, BEM abaixo dos ~90% declarados. O dono manteve a decisão com o número real. A linha vermelha fica: nada comprável com dinheiro real dá vantagem percentual.
   - Perderam: (a) normalizar o PvP (GW2 sPvP, VGC), recomendado pelo benchmark; (b) um teto de 5% POR canal (daria 15% no total); (c) item de ponto plano (+1 ponto no L1 passa de 5%).
5. **Torcida só na Arena e no Duelo; Masmorra e Pesadelo vão sozinhos.** `CHEER.energyPerDischarge` = 9 (o maior valor em que a torcida SOZINHA move a vitória da run ≤ 25pp) e `pvpEnergyPerDischarge` = 2,5 (~65% na torcida normal no PvP). Medido: nenhuma habilidade +24,8pp, boa +17,9pp, TTK −8,7%.
   - Perderam: `energyPerDischarge` = 90 (tirava a parede da Arena, mas torcer sozinho vencia 95%: +46,9pp, RED do gate) e 3 (a torcida não pesava). Com 90 a diferença torcida × sem torcida era de 49pp.
6. **Evocação sai das escolas de SKILL** (PR9b) e fica na ficha como pontos, pelo companheiro capturável.
   - Perdeu: remover a escola de vez (a ficha a produz e o companheiro/capture e os requisitos de talento a leem) ou torná-la uma escola de combate.
7. **Equipamento: 3 slots por atributo, percentual, loja direta ou fragmentos, SEM RNG, só com moeda GANHA.** Lootbox descartada (decisão do dono; a análise de ECA Digital foi interna por IA, não é parecer de advogado).
   - Perderam: lootbox com pity e odds exibidas; Créditos→Bits para equipamento com teto de +25%.
8. **Créditos aceleram só o que não é combate, com teto de +25% sobre o ritmo grátis** (`CREDIT_BITS_CAP_RATIO`; piso de referência de um dia completo). O pacote que passa do teto não é cobrado nem partido.
   - Perdeu: câmbio livre.
9. **Nome do especial por REGRA, sem IA**, novo a cada estágio, em 7 famílias; o PvP publica só o ID do léxico, nunca texto do save.
   - Perderam: nome por IA; nome fixo por estágio; o rótulo "ESPECIAL!".
10. **Level desce na degeneração, com texto neutro** (`copy.semFomo`); invariante: todo Soulmon do mesmo estágio evolui com o mesmo total de pontos. Glitchtama dá ponto.
    - Perderam: level que só sobe; texto punitivo.
11. **Teto S1 do duelo:** 1 level por dia de servidor desde a 1ª gravação (`metadata.f` do KV), só no duelo, sem reescrever o save.

**Medições na `main` com o #232 (06/10/2026, `7c76eaf9`).** Régua do repositório (N = 3200, `arena.v3.test.ts`, `dungeon.v3.test.ts`, `combate/`): duração mediana da Arena R1–R5 21,8/19,7/20,9/27,6/24,3 s; vitória por build 64,0–68,6% (4,6pp), por estágio 58,0–70,9%; células família × área 60,3–72,3% (12,1pp, meta ≤ 20pp); habilidade 23,6pp (meta ≤ 25pp); torcida sozinha +24,8pp; escolas 63,4–71,3% (7,9pp). Essa régua monta o inimigo pelo espelho `arenaFoe`, então NÃO enxerga o sorteio do bestiário; por isso foi feita uma varredura extra com o pool real e elementos (N = 1600 por ponto, `buildArenaRound` + `simulateArenaRunV3`): por elemento do jogador 60,1–67,5% (7,4pp), por família 56,9–63,3% (6,4pp), por escola 61,9–71,1% (9,2pp), torcida sozinha +25,0pp (`nenhuma`) e +18,2pp (`boa`). A torcida da Arena em E = 9 está na margem da meta (≤ 25pp): o ruído de N = 1600 é de ±2pp.


## 25. Missão por prédio + materiais por prédio (decisão do dono, 07/10/2026)

**Decisão.** "Todo prédio, exceto os de Mercado, deve dar 1 missão por dia." A missão paga **1 material próprio do prédio** (Masmorra → Minério); os materiais são o recurso do futuro Ferreiro/aprimoramento de equipamento. Sem dinheiro real, sem sorteio, sem premiar contagem de tarefas.

**Como ficou.** Gatilho = presença (entrar no prédio aberto pelo Vínculo, `BUILDING_GATES`); texto do dia determinístico por `playerDayKey` + id; reseta na virada do dia do jogador; estoque por material com teto (`MATERIAL_CAP`); um único campo novo no save (`buildingQuests`). Marcas "!"/"?" no lote em dourado (azul continua sendo da semanal); no canto da Home só o "?". Dono: `src/utils/buildingQuests.ts`; espelho de forma no servidor.

- **Perderam:** missão que exige "N tarefas"; sorteio diário; material comprável ou trocável por moeda; "!" de prédio no canto da Home (16 marcas quase sempre acesas deixariam de dizer algo).
- **Gatilho para rever:** quando o aprimoramento entrar, decidir se o gatilho de algum prédio passa de "entrar" para uma ação do prédio (cuidado: nunca contagem de tarefas); se o estoque sobrar no teto, o ajuste é o teto, não o ralo em moeda.

## 26. Equipamento por missão + aprimoramento no Ferreiro (decisão do dono, 07/10/2026)

**Decisão.** "Os itens de equipamento são aprimorados, um após o outro. O usuário GANHA os itens de NÍVEL 1 em missão conforme os locais liberam. Depois ele APRIMORA no Ferreiro com RECURSOS (os materiais por prédio). Ao aprimorar ele ESCOLHE dentre opções que dão um ou outro bônus." Nível 1 a 5; 2 opções (A = atributo do slot, B = o vizinho) por nível; escolha refazível pagando Bits GANHOS (ou fragmentos), nunca Créditos nem `paidLeft`.

**Como ficou** (`src/utils/forge.ts`, `forgeActions.ts`, espelho `functions/api/_forge.js`, campo único `forge` no save). Cada uma das 9 peças tem UM prédio de origem e é concedida no **1º resgate da missão do prédio** (o mesmo ponto único que paga o material; escolhido em vez de "cumprir a missão do dia" por ser UM gatilho). Níveis 2–5: materiais (o do prédio de origem + um de apoio, 1/2/3/4 e 0/1/2/3) e Vínculo mínimo 2/3/4/5. Ganho por nível 0,3 / 0,2 / 0,3 / 0,3 / 0,4%: uma peça no 5 vale no máximo 1,5% (30% do teto); três peças 4,5%; o teto de 5% segue UM, somado a talento pelo `combinedAttrBonus`. Quem já comprou a peça a mantém, DERIVADA na leitura (nível equivalente 2/4/5 = 0,5/1,1/1,5%, nunca menos que valia; sem reembolso, sem confisco).

**O que mudou desde a compra por Bits (§24.4 PR8a/§24.5 PR8b).** O dono quis que o equipamento fosse conquista de presença e escolha, não de farm de Bits, e os materiais por prédio (§25) deram o recurso. As garantias que ficam: sem sorteio, sem dinheiro real, teto único de 5%, só Bit ganho.

- **Perderam:** comprar peça por Bits/fragmentos (⚰️ a UI saiu; `applyEquipBuy` e preços ficam como regra pura testada, sem chamador); sorteio; Créditos acelerando equipamento; multiplicador próprio por peça.
- **Efeitos colaterais a decidir (dono):** fragmentos agora só pagam "refazer" (3); `tal-com-01` (Etiqueta) e a peça da semana (`tal-com-07`) passaram a descontar o REFAZER, não mais a compra; a mochila não recusa prêmio de missão.
- **Gatilho para rever:** se faltar/sobrar material (o total para as 9 peças no 5 é 90 de origem + 54 de apoio, ~1/dia por prédio), ajustar `UPGRADE_COST`, nunca o teto.

### 26.1 Soulsmith: 15 níveis e custos maiores; as duas opções apresentadas como IGUAIS (decisão do dono, 11/10/2026)

**Decisão.** "Está fácil de upar. Aumente a quantidade de níveis e os custos; tem de levar tempo para colocar tudo no máximo. Mesmo depois do nível ultra o jogador ainda não terá todos os itens no máximo." E: "melhore a descrição do upgrade: mais direta; hoje parece que há um upgrade 'correto' para a categoria e um alternativo — apresente as DUAS opções como iguais (ex.: mais dano OU mais velocidade)." O nome da peça "cobre" **fica** (decisão do dono).

**Como ficou.** 5 → **15 níveis**, cada um 0,1 % (o teto por peça continua 1,5 %; três peças, 4,5 %; teto único de 5 % intacto). Custo total por peça 98 do material do prédio + 56 de apoio (eram 10 + 6): como cada prédio paga 1 material/dia, as três peças fecham em ~100 dias de uso diário (**passa do Ultra, 59 dias**; ~134 com 3 de 4 dias; ~198 com metade). Simulado em `forge.tempo.test.ts`, documentado em `BALANCO-SOULSMITH.md`. Vínculo exigido por nível sobe até 10 (não é o que segura o ritmo). Migração sem confisco: registro sem `v: 2` vira o nível novo de mesmo bônus (1→3, 2→5, 3→8, 4→11, 5→15). Na tela, o modal mostra **"Mais dano · +0,1 %" e "Mais defesa · +0,1 %"** (nome do ganho + efeito em palavras), lado a lado com o mesmo peso visual — sem "A/B", sem "o atributo do próprio slot / o vizinho". Mecanicamente a opção A ainda é o atributo do slot (o nível 1 é fixo nele), mas a tela não a trata como a "certa".

- **Perdeu:** os 5 níveis de 0,2–0,4 % (subir de nível era barato: 10 materiais ≈ 10 dias); a copy "A = atributo do slot / B = o vizinho".
- **Não entrou (alternativa):** custo em **Bits** a cada aprimoramento — seria mais um ralo contra o teto diário de 150 Bits dos minijogos; fica como opção.
- **Gatilho para rever:** o dono achar longo/curto demais → ajustar `UPGRADE_COST` (nunca o teto) e rodar a simulação; ou a Oficina do Foco render mais material por ciclo (a linha "foco" da tabela é a primeira a encurtar).


## 27. Onboarding enxuto: três pontos, teste de 14 itens e a primeira tarefa (decisão do dono, 11/10/2026)

**Decisão (ditado).** "O onboarding está longo. Tem pergunta de confirmação meio redundante, só pra verificar consistência; enxugue o máximo possível. A contagem está errada: primeiro conta 6, depois 20, depois tem outras perguntas. São TRÊS blocos. Prefiro três PONTOS de evolução em vez de uma barrinha que enche. Principalmente o segundo bloco é onde dá para reduzir. Crie pelo menos uma TAREFA para o usuário, com sugestão preenchida e editável."

**Como ficou.**
1. **Progresso = 3 pontos** (bloco 1 = as 6 do ritual · bloco 2 = o teste longo · bloco 3 = metas + ponto de partida), `role=progressbar` com `aria-valuetext` "Parte N de 3", sem N/M em tela nenhuma (o "Pergunta N de M" dos hints também saiu). Fora dos blocos (conta, nome, escolha, nascimento, geração, reveal) não há pontos. Movimento reduzido: a transição do ponto mora no bloco canônico do `index.css`.
2. **Teste longo: 20 → 14 itens.** Saíram os 6 itens-espelho (o segundo, invertido, de cada par `consistencyPair` Likert/frequência: O-ima-2, C-org-2, E-soc-2, A-coo-2, N-ans-2, H-sin-2). Ficam 6 Likert (um por fator) + 4 escolhas forçadas (um por eixo junguiano) + 4 cenários (cobrem os 6 fatores). Total do funil antes da meta: 6+20 = 26 → 6+14 = 20 perguntas.
3. **Primeira tarefa.** O passo "Seu ponto de partida" ganhou um campo com UMA tarefa sugerida pela 1ª área escolhida (`src/utils/firstTaskSuggestion.ts`), editável e esvaziável. Entra em `tasks` com esforço 1, sem prazo, `open`; sem recompensa extra (esforço 1 pesa 1 na meta, como um hábito). Os hábitos continuam sendo as sugestões do catálogo.

**Custo assumido (psicometria).** Sem pares, o índice de inconsistência fica 0 e o de aquiescência deixa de valer (o banco não é mais balanceado em chaveamento); `computeValidity` só julga aquiescência com itens dos dois sentidos. Esses índices só alimentavam um aviso na `OraclePage` (ferramenta de criação, fora da navegação), nunca o jogador nem a criatura. O limite do teste "separação entre protocolos" caiu de 30 para 20 pontos (um item Likert por fator). A simulação de cobertura (17/17 elementos, 65/65 talentos, 11/11 profissões, 32/32 criaturas) e a calibração de `axes.ts` seguem verdes sem refazer os coeficientes — a leitura de eixos usa `traitPoints` por fator, que os cenários e o item restante continuam alimentando.

- **Perderam:** manter o espelho invertido "para verificar consistência" (valia só o aviso interno); contagem numérica por bloco; barra contínua.
- **Alternativa não feita:** cortar também cenários/escolhas forçadas (4 eixos junguianos dependem de 1 item cada; os cenários são o único canal da Honestidade-Humildade além de 1 item).
- **Gatilho para rever:** se a leitura do Oráculo parecer genérica nos reveals, voltar um item por fator ANTES de mexer nos coeficientes.
- **Pendências:** "GOAL/STRUGGLE puláveis" (CLAUDE.md) já não vale desde 01/10/2026 (B3: todas obrigatórias, ≥1 de 1–3) — mantido como está no código; o botão "Criar o meu" da aba Hábitos do app continua criando hábito (não foi tocado).
## 28. Ritmo das refeições: três janelas por dia, convite e nunca cobrança (pedido do dono, 11/10/2026)

**Pedido do dono (literal).** "Quero incentivos para o usuário entrar APÓS as REFEIÇÕES principais, 3x ao dia, seja por cocô, alimentação ou realizar qualquer MICRO AÇÃO que mantenha o jogo em sua mente."

**Como ficou** (`src/utils/mealRhythm.ts`; dono do horário `functions/api/_mealRhythm.js`; copy `mealInviteCopy` em `_pushCopy.js`; contratos `mealRhythm.contract.test.ts` e `workers/mealRhythm.parity.test.js`).
1. **Três janelas, hora local do jogador**, padrão 09:00 · 13:30 · 20:00, editáveis nas Configurações em passos de 30 min dentro de uma faixa por refeição (café 06–11, almoço 11:30–15:30, jantar 17–22; ≥ 3 h entre elas). Cada janela fica aberta 2 h.
2. **Dentro do app:** um cartão no slot de avisos da Home (posição `refeicao`: depois do recomeço, antes da carga) pede UMA coisa pequena que o jogo já tem — banho (só se há cocô na tela), comida da pastinha (só se comer serve: comida comum, vaga na janela horária, energia com espaço), carinho ou "dizer oi". "Agora não" dispensa a janela. **Qualquer gesto de cuidado** (comer, banho, carinho, concluir algo, "oi") atende a janela aberta, com o cartão visível ou não.
3. **Recompensa: nenhuma moeda.** Atender só grava `mealRitual` (janelas de HOJE, do dia do jogador, sem histórico nem sequência). Comida, banho e carinho continuam rendendo exatamente o que rendiam, sob o teto de cada dono (🍎 por hora, 🫶 1 coração/dia, 💩 dreno/teto). O "carinho" do cartão NÃO cura — só a reação do bicho (L11). Testes provam que `markMealDone` muda um campo só.
4. **Push opt-in e SUBSTITUTIVO, com teto.** Começa desligado; exige notificações ligadas; manda horários + fuso + janela de descanso ao servidor só enquanto ligado (política de privacidade atualizada). Os convites genéricos de 10h/16h e o aviso das 20h **cedem** a vez, e o "boa noite" das 22h cede ao lembrete de deitar quando há janela de descanso: teto estrutural `PUSH_DAILY_CAP = 4` (3 refeições + 1 fechamento), provado com o worker real varrendo as 48 passadas do dia em cinco fusos. Nunca dentro da janela de descanso, nunca no D0. Uma tag por refeição (`meal-<refeição>`) funde alarme local do APK (AlarmManager, hora local, sem servidor) e FCM — sem duplicata.
5. **Cocô alinhado sem mudar a regra.** O 1º cocô continua sorteado em [07h (10h Madrugador), 15h) e o 2º 8–10 h depois do 1º aparecer; muda só a distribuição, que passa a preferir o pós-café/pós-almoço (e o pós-jantar para o 2º). Dreno, teto diário, Teimoso e perdão por ausência não foram tocados.
6. **Telemetria** (só pelo consentimento existente): `meal_ritual { meal 0..2, kind 0..3 }` — "o convite é atendido?", sem hora do dia e sem contagem de janelas perdidas.

**Benchmark rápido** (⚠️ ≈ memória e o que o repositório já registrou — **não** foi reverificado em fonte pública nesta rodada; segue a convenção ✖/≈ de `BENCHMARK-E-REFERENCIAS.md` §4.1): *Tamagotchi* de 97 chamava por beep e cobrava com "care mistakes" — o oposto do que o Soulmon quer; fica só a ideia de que o jeito de cuidar importa (já em 🌿 Ritmo de cuidado). *Finch* usa o ritmo do dia (manhã/noite) como ritual curto e o widget como presença (`GUIA-EXPERIENCIA.md`); sem culpa por não ter ido. *Pokémon Sleep* amarra a presença a um evento da vida (acordar) e a um registro retroativo que recupera o dano e não a glória (`PLANO-EVOLUCAO.md` 2.5) — é o desenho mais próximo: âncora na rotina real da pessoa, gesto curto, sem castigo. **Nenhum dos três manda convite que muda de tom com o desempenho** — essa é a linha que o ritmo respeita.

- **Perderam:** push em hora fixa para todos (não acompanha a rotina); somar os convites de refeição aos de 10h/16h/20h (quarta, quinta visita ao app); texto de "fome" como NECESSIDADE da criatura (L2/L11/§5.3: comida é ocasião; criatura que passa fome por ausência é culpa pela porta dos fundos — ela só está *perto da pastinha*); push de cocô (o worker não sabe se há cocô; mentiria); XP de vínculo/energia/Bits pelo convite (ver pergunta ao dono); sequência de "refeições atendidas".
- **Gatilho para rever:** `push_optout` subindo depois do ritmo ligado; `meal_ritual` quase só com `kind` 3 (convite virou rotina vazia); custo da passada de 30 min no KV (hoje 48 listas/dia — se o número de inscrições crescer, indexar por faixa de horário em vez de varrer tudo); horário de verão (o fuso é reenviado a cada abertura — quem passar a mudança sem abrir recebe 1 h deslocada até abrir).

## 27. Lançamento da Guilda (ditado do dono, 11/10/2026) — Arena × Torneio e o resto da fila

**Decisão (PR1).** "Torneio = RANQUEADO: obedece ao ranking e o inimigo é ALEATÓRIO com base no seu rank. Arena = você SELECIONA inimigos de poder semelhante ao seu."

**Como ficou.** *Torneio:* `opponents` (servidor) sorteia 3 dentre os 6 mais próximos de `lifetimePoints` (a medida da faixa) — `functions/api/_rankedPick.js`; o jogador não escolhe, o número não sai na resposta, as faixas continuam antes do ranking (CLAUDE.md 🎪). *Arena livre* (lote `duelo`, id mantido): a folha mostra 3 desafios de poder parecido (todo inimigo da Arena é relativo ao level — `arenaFoe`), o jogador escolhe um e a SEMENTE do card é a da run (`ArenaGame` prop `seed`): luta exatamente o que o card mostrou; a revanche sorteia outra. Rótulo do lote: "Arena livre / Open Arena".

- **Perdeu:** o Torneio sortear 3 aleatórios do pool inteiro, sem olhar para a faixa; a Arena abrir direto numa run sorteada.
- **Gatilho para rever:** pool pequeno (poucos jogadores) faz a janela de 6 virar "todo mundo" — correto por construção; se houver mais de ~300 perfis, a varredura de `profile:` (já limitada a 300) passa a ser o gargalo, não o critério.

**PR2 — a Casa da guilda.** *Decisão do dono:* doações de Bits cultivam um cenário com representação visual; cada membro põe UM item do inventário num slot próprio; item em uso na guilda não vale no cenário pessoal. *Como ficou:* `functions/api/_casa.js` + `CasaVisor`; seiva por doação (10 Bits = 1 ponto, teto 200 Bits/dia/pessoa), missão e guerra; 6 estágios por limiares só no servidor. *Perdeu:* mostrar a doação por pessoa ou um total (violaria LV-G1/Recusa 2 — o cliente não recebe número nenhum); a casa encolher quando alguém sai. *Tensão declarada:* doar é contribuição por pessoa, a linha vermelha do plano — resolvida escondendo toda quantia na vista. *Gatilho para rever:* se as doações virarem placar informal ou se o teto de 200/dia esvaziar a carteira de quem joga pouco.

## 29. Talentos: as "skills" da árvore ficam legíveis e distintas por caminho (pedido do dono, 11/10/2026)

**Pedido.** "A árvore de talentos está legal, mas as SKILLS não estão legais; melhore." Lido como: os NÓS (cada talento) — o que fazem, se são distintos e se dá para entender o que mudam. A árvore (grafo, ids, graus, custo, pré-requisitos) **não mudou**: o dono gostou dela, e os `talentPicks` salvos seguem valendo sem migração.

**Diagnóstico (no código).** (1) Na Fenda, `Garra`, `Muro` e `Arco de luz` eram **o mesmo efeito** (`combatBonus pve`, bônus de ataque) com nomes e textos diferentes — `Muro da fenda` dizia "mais firmeza" e rendia ataque; (2) o texto abria pelo número ("0,4% por grau, dentro do teto…"), sem dizer o que muda na luta; (3) nada mostrava o que a árvore dava **de fato**, depois de somada ao equipamento e cortada nos 5%.

**Como ficou.**
- **Cada nó de combate da Fenda tem o SEU canal:** `tal-pve-01` ATAQUE, `tal-pve-02` DEFESA, `tal-pve-06` RITMO (`TalentEffect.combatBonus.attr`; `talentPveAttrBonus`, espelho em `_talents.js`). Valem como canais próprios na **Masmorra** (`useDungeonBonus` → `dungeonAttrBonus` → `combinedAttrBonus`, a mesma via que o equipamento já usava), e a **Arena e o Pesadelo seguem lendo o TOTAL como um número só** (`talentBonus`) — a regra (e) do combate v3 vale agora também para talento. Números e custo iguais; a soma dos canais é exatamente o total de antes (teste), e o teto único de 5% continua cortando no canal único.
- **Copy direta:** o efeito em palavras antes do número ("O seu Soulmon bate mais forte… / aguenta mais… / os golpes saem mais seguidos…"), e `Muro`/`Arco` dizem a verdade sobre onde são defesa/ritmo de verdade (Masmorra) e onde entram no bônus único.
- **Linha "Agora / No grau máximo"** no modal de cada nó de combate/fenda (`talentEffectLine`), com unidade de jogo: "+1,2% de defesa", "9 de energia do especial já na largada (≈ 4,5 s a menos de espera)", "escudo de 1% do HP".
- **"O que a sua árvore dá agora"** acima do tabuleiro: por lugar (Duelo e Torneio · Fenda: Masmorra / Arena / Pesadelo), o bônus que vale **já somado ao equipamento e cortado nos 5%**, mais largada, torcida, resistência a dano contínuo, cura, Bits e escudo. Só leitura.

**O que NÃO mudou, de propósito.** Nenhuma magnitude: o gate de balanço da Masmorra (`talents.efeitos.test.ts`: escudo + cura nos tetos ganham < 0,4 andar) já está em ~0,35 andar — medi dobrar cura/escudo e dá +0,70 (quebra o gate), então ficam imperceptíveis por desenho e agora **legíveis** (a linha "Agora/No máximo" diz "1% do HP"). Nenhum nó novo, nada de motor de combate novo, nenhum poder pago, teto único de 5% intacto.

- **Perdeu:** três nós de Fenda que eram o mesmo ataque com nomes diferentes; a copy que abria pelo número.
- **Alternativa que não entrou (dono decide):** efeitos novos de combate por caminho (contra-ataque, imunidades, gatilhos) — exigem mexer no motor (`fight.ts`/`group.ts`), no espelho do servidor (`_combate.js`, `_duel.js`) e refazer as réguas de balanço medidas; se o dono quiser "skills" no sentido de golpes/habilidades da criatura, é outra frente (a ficha do class-system).
- **Gatilho para rever:** o dono ainda achar os nós sem graça depois da legibilidade → abrir a frente de efeitos novos acima (com a régua do ruler do PvP e do `talents.efeitos.test.ts`); se o gate da Masmorra for recalibrado, a cura e o escudo podem subir (a linha "Agora/No máximo" já acompanha as constantes).

**PR3 — o circo vira missão.** *Decisão do dono:* o circo (Feira) ganha apelo: algo misterioso acontece, o jogador MANDA o Solmon, ele some da Home enquanto investiga (tempo, como o Passeio) e volta; soma pontos para uma meta da guilda (mais membros e mais level = mais pontos); mover para o hall. *Como ficou:* `guildRaidHit` é a "volta" (servidor sorteia e rega a casa), a ida é `guildMission` no save, a sala mora no Salão. *Perdeu:* remover o lote da Arena nesta rodada (economia de prédios — ver STATUS); relógio de ida validado no servidor (a trava de verdade é 1/dia; o relógio é cerimônia, como o Passeio). *Gatilho para rever:* se a missão virar obrigação de abrir o app de 30 em 30 min, ou se o pet ausente da Home for lido como abandono (então encurtar ou trocar a lupa por uma pista).

**PR4 — a Guerra de guilda 4×4.** *Decisão do dono:* "você + 3 aliados contra 4 inimigos; guilda com 3 pareia com 3, com 2 com 2; uma arena de guilda nova no hall; reaproveite o combate v3; servidor decide; sem vantagem paga." *Como ficou:* `functions/api/_guerra.js` (fila por tamanho, `simulateDuel`, esquadrão = quem pediu + os mais antigos com ficha), seção no Salão do Hall. *Perdeu:* **D-G4 do `PLANO-GUILDA.md`** ("sem confronto guilda × guilda" — a variante (c) do `04-arena.md`, descartada em 29/09) — o dono a reabriu; ranking entre guildas (continua não existindo); tempo real (a guerra é assíncrona, ninguém espera ninguém); mostrar quem são os rivais (só silhueta). *Gatilho para rever:* se guildas viverem esperando na fila por falta de par do mesmo tamanho (então abrir tolerância de ±1), ou se a guerra virar comparação entre pessoas.

**PR5 — as sombras do Pesadelo.** *Decisão do dono:* "Solmons específicos como SOMBRAS, só com os olhos de luz; gere o pacote de pedido de arte e use placeholders silhueta por enquanto." *Como ficou:* 12 slots → 9 linhas próprias (`nightmareShadows.ts`), placeholder em canvas, pacote em `ASSETS-A-GERAR.md` §17. *Perdeu:* mexer na colisão para casar com a forma (o balanceamento é regra, o visual se prende à caixa); gerar a arte nesta sessão (ferramenta indisponível). *Gatilho para rever:* se o placeholder de 12 slots confundir (formas iguais entre degraus) antes da arte chegar.

## 30. Gauge de evolução no lugar do "dia completo"; energia com folga (decisão do dono, 11/10/2026)

*Decisão do dono (modal):* "Vamos REUSAR a energia da Home para a masmorra (energia enche comendo e zera no dia). Inclusive, vamos SUBSTITUIR a ideia de 'dia completo' por um GAUGE DE EVOLUÇÃO bem claro, em que cada nível (estágio) precisa de X tarefas (ou atividades de hábito) concluídas. A comida serve para encher a energia e podemos AUMENTAR a quantidade de energia máxima para melhorar o balanceamento." Esta rodada faz a parte de evolução/energia; a masmorra gastando energia é a próxima.

**O que mudou na tese.** O critério de evolução era `perfectDays ≥ required` (dia completo = peso feito ≥ meta **e** energia ≥ meta). Agora é o **gauge** (`src/utils/evolutionGauge.ts`, dono único): uma barra por estágio que enche com **peso de esforço** concluído (hábito = 1, tarefa = `effort` 1–3 — nunca contagem de itens, linha vermelha #16).
- **Meta por estágio** (`FORM_REQUIREMENTS[…].gauge`): rookie **30** · champion **45** · ultimate **60** · mega **60** com as três megas, ou **270** (`ULTRA_PATIENCE_POINTS` = `ULTRA_PATIENCE_DAYS` 45 × 6) pelo caminho da permanência · ultra 0 (topo).
- **Teto diário** = `required` do estágio (4/5/5/6/6) — a meta diária. Sem número novo: o teto É a meta. Vinte tarefas triviais rendem o mesmo que a meta cumprida.
- **Creditado na virada** (`computeDailyReset`, sobre o mesmo `dailyDone` que julga o coração). Um ponto só de escrita: marcar/desmarcar não credita, e desktop/widget/check-in não precisam saber do gauge. A tela mostra a **prévia de hoje** (mais clara), que entra na virada. **Custo aceito:** quem enche a barra hoje evolui amanhã, não hoje.
- **Nunca decresce** por dia ruim; zera ao evoluir; na queda por HP usa `degeneratedEvolutionPoints` (piso = metade do gauge do estágio novo, custo = 5 dias de teto) — o mesmo desenho de `degeneratedPerfectDays`.
- **Dia completo continua existindo como SELO do dia** (Bits por dia completo, XP de Vínculo, `totalPerfectDays`/missões/conquistas/estação). Só deixou de ser critério de evolução e **perdeu a perna da energia**: hoje é `peso feito ≥ meta && ≥1 cadastrada`. `perfectDays` segue no save (alimenta o XP de combate, `soulXP`, cliente e servidor) — não foi tocado para não mexer no level.
- **🌀 (item da masmorra):** soma um dia de teto ao gauge (`dayItemGaugeGain`), ainda 1 por dia do jogador; continua dando +1 `perfectDays`/`missionPerfectDays` como antes.

**Migração.** Save sem `evolutionPoints` migra na hidratação: `ceil(perfectDays × gauge / required)` — mesma fração da barra, arredonda para cima, não corta o excedente. Idempotente (campo presente vence). Quem podia evoluir continua podendo. Efeito colateral aceito: no mega o fator é 10 pontos/dia, então 27+ dias guardados já abrem a permanência (270) — antes eram 45. Nunca perde; no pior caso chega antes.

**Energia.** `getMaxEnergyForStage` = `required × ENERGY_HEADROOM` (2) → **8/10/10/12/12**. Saiu do dia completo. Orçamento para a próxima rodada (masmorra): energia GANHA por dia ≈ nº de conclusões (1 comida por conclusão, +1 energia por comida, `FOOD_LIMIT_PER_HOUR` 6) — leve ≈ 2, médio ≈ 3–4, intenso 6+; a comida premium (+5) fica dentro das barras. A energia zera na virada, então a masmorra deve **custar ≤ ~1 energia por descida para o leve e caber 2–3 descidas no médio**, sem exigir comer fora do que se ganha concluindo; o teto ×2 dá espaço para quem faz tudo sem ser obrigatório. (Valores de custo são da próxima rodada.)

**Curvas simuladas** (`evolutionGauge.test.ts`, dia em que cada forma abre, rookie→champion→ultimate→mega): **intenso** (teto todo dia) 8 / 17 / **29** dias; **médio** (3 de peso nos úteis, 2 no sábado) 12 / 31 / **57**; **leve** (2 nos úteis, nada no fim de semana) 19 / 52 / **94**. Ultra pela permanência: +45 dias no intenso. Antes, com 4/5/5 dias completos, o intenso chegava ao mega em ~14 dias.

- **Alternativa que perdeu:** manter `perfectDays` como critério e só aumentar `required` (era a recomendação escrita em `progression.ts`). Perdeu porque o dono pediu um gauge que encha com cada conclusão — o dia completo é binário: um dia com 3 de 4 rendia ZERO, que é a "falência" que a tese evita.
- **Alternativa que perdeu (2):** creditar ao concluir (barra ao vivo). Perdeu por farmabilidade (marcar/desmarcar) e porque exigiria um ledger por dia em todos os caminhos de conclusão (app, desktop, widget).
- **Gatilho para rever:** telemetria real mostrando mediana de rookie→champion acima de 4 semanas (afrouxar `gauge`), ou queixa de "enchi e não posso evoluir" (crédito ao vivo com ledger diário).

## 31. Masmorra como recurso IDLE de retorno: energia por camada, profundidade até 999, teto por Lv, recompensas claras e Level Up que restaura (decisão do dono, 11/10/2026)

*Pedido do dono (ditado):* "a dungeon seja um recurso mais idle: de tempo em tempo o usuário volta e faz alguma ação. Uma janela de tempo de ENERGIA para usar a masmorra, em sistema de FASES, cada fase GASTA energia. SEMPRE que SUBIR DE LEVEL, recupera vida e energia. […] ANDARES INFINITOS, até o andar 999, ficando mais difícil até um ponto em que o usuário precisa ter feito tarefas e hábitos com consistência […]. Pensar nas RECOMPENSAS." E: "a energia da Home só diz que reseta e como encher — NÃO diz para que serve". *Decisões do modal:* reusar a energia da Home (não criar outra); teto de Bits por andar por nível, mantendo o teto diário e o funil `creditMinigameBits`; recompensas extras em itens/materiais, não em Bits.

**Dono único:** `src/utils/dungeonIdle.ts` (constantes e contas puras); a tela é `DungeonGame.tsx`; a restauração do Level Up é `applyLevelUpCelebrated` em `src/utils/levelUp.ts`.

- **Fase = camada; 1 de energia por camada** (`DUNGEON_ENERGY_PER_LAYER`), cobrada ao COMEÇAR a camada (a 1ª inclusive). Orçamento (§30): leve (~2/dia) = 2 camadas; médio (3–4) = 3–4; intenso até o máximo do estágio (8–12) — nunca exige comer além do que as conclusões dão. Sem energia: o botão não acende, e no meio da descida ela para com "volte mais tarde: cada atividade concluída vira comida" — **nunca** coração nem Bits.
- **Profundidade 1..999 sem mexer na matemática do combate v3.** `dungeonFoe` e `DUNGEON_FLOOR_GROWTH` ficaram intactos (a calibração 1–6 do Lv 1 é idêntica, há teste). O que muda com a força é a **zona de conforto** `comfortLayers(Lv) = round(999 × ((Lv−1)/39)²)`: as camadas até ela lutam no andar efetivo 1 (`effectiveFloor`), daí em diante a dificuldade sobe como sempre. O Lv do Soulmon vem de estágio + dias completos — é a "consistência" do pedido.
- **Teto por Lv** (`dungeonLayerCap`) = `min(999, zona + DUNGEON_CAP_MARGIN (6))`, e enquanto o portão `masmorraAlto` (Vínculo 8, `gates.ts`, espelho do servidor intocado) estiver fechado, a camada 3. Tabela nos Lv de topo de estágio (6/13/21/30/40): teto **22 / 101 / 269 / 558 / 999** (Lv 1: 6).
- **Parede medida no núcleo real** (`dungeonIdle.profundidade.test.ts`, 48 descidas por Lv, skill `media`, partindo da borda da zona): média / máx de camadas — Lv1 4,4/5 · Lv6 20,4/21 · Lv13 99,4/100 · Lv21 267,4/268 · Lv30 556,3/557 · Lv40 999 (teto). Dentro da zona a descida aguenta ~36 camadas seguidas (mín. 7), então quem para ali é a ENERGIA, não o HP.
- **Ponto de retorno:** `dungeonDepthRecord` (save, campo novo, 0..999, só sobe) — cada descida começa logo depois do último marco de 5 já limpo (`startLayerFor`), sem passar do teto. **Saíram** a base semanal (`DUNGEON_DIFFICULTY`) e o "Descer mais fundo" pago (WP4.5/E2): com o retorno grátis o sumidouro de Bits ficou redundante, e a base que subia a cada marco empurraria a parede para cima a cada descida da semana.
- **Recompensas:** Bits por inimigo + bônus de camada calculados sobre o **andar efetivo** (camada 500 paga o mesmo que a parede — é o "teto de Bits por nível"), ainda pelo funil diário de 150. Glitchtama no **primeiro marco de cada descida** (uso segue 1/dia, `specialItemUse.ts`, e soma ao gauge). **Marcos de profundidade** (1× na vida, `DUNGEON_DEPTH_MARKS`): 5/10/25/50/100/250/500/999 → 5/10/15/20/30/40/50/100 fragmentos do Soulsmith — material, determinístico, sem sorteio, sem equipamento. Coraçãozinho raro inalterado. O fim da descida mostra o **resumo** (camadas, criaturas, Bits, coraçãozinho, Glitchtama, fragmentos, recorde novo, energia usada).
- **Level Up restaura** energia (até o máximo do estágio, nunca acima) e o HP da masmorra (cheio), no MESMO updater que registra `lastCelebratedLevel` — uma vez por celebração (vários níveis = um enchimento), idempotente; a linha de base de save antigo não restaura. Os **corações (HP de cuidado) não** — a cura deles tem teto próprio. Sem laço de exploit: XP da masmorra tem teto diário (`BOND_DAILY_CAP.dungeon`) e cada nível custa mais XP.
- **Home:** a dica da energia ganhou a linha "Serve para: descer a Masmorra, 1 por camada; subir de nível enche de novo" (`home/statTips.ts`).
- **Servidor:** nada da descida tem espelho em `functions/api` (é do cliente como placar e `dungeonHp`; não compra vantagem). `_combate.js`/`_gates.js` intocados.
- **Alternativas que perderam:** energia própria da masmorra (o dono vetou); afrouxar `DUNGEON_FLOOR_GROWTH` para os andares altos (quebraria a calibração 1–6 e deixaria a parede igual para todo Lv — o inimigo é relativo); custo por descida em vez de por camada (o pedido fala em fases); Bits crescendo com a profundidade absoluta (estouraria o teto e viraria a fonte dominante).
- **Para o dono rever:** (1) a curva quadrática da zona (999 só no Lv 40); (2) "nível" do teto = **Lv do Soulmon** (força), enquanto o Level Up que restaura é o **Vínculo**; (3) a restauração não cura corações; (4) os fragmentos dos marcos e a falta de item cosmético por marco (não havia catálogo cosmético decidido para isso); (5) o fim do "Descer mais fundo" (sumidouro de Bits a menos).
- **Gatilho para rever:** telemetria com a energia acabando antes do 1º marco para a maioria (custo alto demais), descidas virando a fonte dominante de Bits, ou queixa de "andar fácil demais" na zona de conforto.
**Fecho (respostas do dono em modal, 11/10/2026).** *Confirmado:* o "circo" é a Feira; doação de Bits sem mostrar quantia; Casa e Bosque separados; guerra só com seiva, 1 por dia; os 12 Solmons das sombras. *Decidido:* a Feira é **re-hospedada no Hall** (prédio `hall.feira`, lote ao lado do Salão) e o lote da Arena fecha — o material Fita (`ribbon`) e a peça `eq-rastro-t3` continuam, só mudam de endereço. *Autorizado:* atualizar `CLAUDE.md` e `PLANO-GUILDA.md` (D-G4 ⚰️). *Gatilho para rever:* se o Hall ficar apertado com 4 lotes (a Feira divide a plataforma do Salão).

## 32. Chat com o Soulmon vira agente: ações com confirmação, dúvidas do jogo e feedback; modelo de chat sobe do 8b (decisão do dono, 11/10/2026)

*Pedido do dono:* "ligar as IAs de chat com o Soulmon" — criar tasks/hábitos conversando, responder dúvidas do jogo e dar feedback sobre o comportamento. Arquitetura, schema e privacidade: `docs/CHAT-SOULMON.md`.

- **O modelo propõe, a pessoa confirma.** Tool calling devolve ações validadas por schema (servidor e cliente); o cartão `ChatActionCard` pede o toque; a gravação passa por `commitHabitCreate`/`commitTaskCreate` (tetos do plano valem igual). Saiu o `create_activity` por regex, que criava SEM confirmação.
- **Reabre a decisão provisória #55 ("o modelo de chat não sobe do 8b"):** o 8b erra o formato de ferramenta. Agora `llama-3.3-70b-versatile` (var `CHAT_MODEL`, alternativa mais barata `openai/gpt-oss-120b`). Os tetos por tier (demo 30 / pago 120 por dia) e o global ficam; **o custo da cauda precisa ser refeito** (a conta de R$ 0,5–1/ano assumia o 8b e ~120 tokens; agora há ~1.500 tokens de entrada com ferramentas/fatos). Gatilho: custo real do chat por conta ativa acima do que a compra única sustenta → baixar a cota, mover para `gpt-oss-120b` ou ligar a assinatura de IA.
- **Atualização (dono, 11/10/2026, mesmo dia): custo ZERO.** O chat roda só no plano **gratuito** do Groq com o **gratuito** do Gemini de reserva; nenhuma configuração que exija billing pago. O padrão passa a `openai/gpt-oss-120b` (não o 70b): na tabela oficial (console.groq.com/docs/rate-limits, lida em 11/10/2026) ele tem 30 RPM · 1.000 RPD · 8K TPM · 200K TPD; o 70b não está na tabela e terceiros (2026) dão 100K TPD — metade. Gemini `gemini-2.5-flash` gratuito: ~10 RPM · ~250 RPD (guias de jan/2026, não confirmado em doc oficial; dono confere no AI Studio). Com ~1.900 tokens/chamada cabem ~105 chamadas/dia no Groq + ~250 no Gemini; a cota de `_aiGuard` vira **15/dia (demo) e 20/dia (pago) por conta, 250/dia no total e 4/min por conta** (revisto no mesmo dia, antiabuso: 250 cabe no Groq ~105 + Gemini ~250 com folga; transcrição passou a ter cota 10/conta e 100/dia). 429 do Groq cai no Gemini; os dois no limite → 429 `ai-busy` e a fala cansada do Soulmon, sem erro. A conta de custo da cauda deixa de existir (custo = 0); o gatilho vira **limite gratuito**: >10 % das mensagens do dia em `ai-busy`, ou o beta passar de ~15 pessoas ativas → refazer a cota ou decidir (dono) por um plano pago. Testes: `functions/api/chat.freeTier.test.js`, `_aiGuard.tierCap.qa2.test.js`.
- **Dúvidas do jogo só com a base curada** (BM25 no Worker, gerada de `docs/manual/`, teste de defasagem); sem trecho → "não sei".
- **Feedback na voz da bíblia:** agregado inteiro, sem texto livre; nomeia o ato, não a pessoa (L1/L12); nunca conta falha (L3/L4/L6); sem conselho de saúde (L8/L9). Proativo só opt-in, 1x/dia, ao tocar no campo — sem push (nudge das 21h segue removido).
- **Alternativa que perdeu:** modelo escrevendo direto no save; ferramenta `complete_task`/`list_today` (sem ids no prompt).
- **Gatilho para rever:** pesquisa de cauda de custo, taxa de cartões recusados/editados alta (modelo propondo mal), ou queixa de que o comentário parece cobrança.

## 33. Reembolso da assinatura cosmética: mantém o já resgatado, fecha só a vitrine futura (decisão do dono, 11/10/2026)

*Contexto:* R8 do threat model da assinatura (`docs/ASSINATURA-SPEC.md`). A implementação já adotava o lado conservador e esperava aval; o dono **aprovou** em 11/10/2026.

- **Regra:** reembolso/revogação da assinatura (RTDN ou `subscriptionsv2`) fecha a vitrine "Do trimestre" e bloqueia novos resgates; **nada já resgatado é retirado** (posse mora no save; `applySubscriptionState` nunca remove item).
- **Por quê:** coerente com "entregue não é retirado" da D10 e com a voz do app (nunca cobra); retirar item do save exigiria escrita do servidor no save, que não existe.
- **Custo aceito:** abre o abuso "assinar → resgatar → reembolsar" (cosmético, sem vantagem de jogo); no beta (licença de teste) o impacto é zero.
- **Gatilho para rever:** reembolsos de assinatura acima de ~5 % das assinaturas num trimestre, ou o mesmo comprador reembolsando 2+ vezes.

## 34. Antiabuso e custo do beta: sprite uma vez por forma, beta fechado por lista, hash de IP, alertas (decisão do dono, 11/10/2026)

*Base:* `product/beta-play-01/sweeper/abuso-e-custo.md`. *Pedido:* "me proteger: usuário recriando o Soulmon e me gastando muito, abusando do chat, de estorno".

- **Sprite:** "o usuário NÃO pode ficar regerando o Soulmon" — **uma geração por forma** (`perFormLifetime: 1`), a mesma forma devolve a arte do cache para sempre; `formId` obrigatório; vitalício 15 (11 formas + 4 de folga para recusa de conteúdo, que não conta na forma); 6/dia; **40/dia e 800/mês globais** (Higgsfield). **Renascer não gera de novo** (reverte a #62: o renascimento não zera mais o vitalício; formas já desenhadas reusam a arte; formas novas saem uma vez cada). **Gemini Image desligado** (a `GEMINI_API_KEY` fica só no gratuito do chat); chave Gemini no header. Os contadores (`aiLifetime.sprite`, `aiForms`, `rebirthSpriteResetAt`) **sobrevivem à exclusão de conta** — o saveId é o hash do e-mail normalizado, então relogar com o mesmo e-mail encontra o contador. `SPRITE_DISABLED`.
- **Beta fechado:** `BETA_EMAILS` + `BETA_CLOSED` (tela própria, sem save/IA/compra); flag off = só IA exige a lista.
- **Hash de IP:** HMAC com `IP_HASH_SALT`, TTL 30 dias, nunca o IP; 3 contas novas e 4 sprites por ip-hash/dia. Privacidade §6d (legítimo interesse, LGPD art. 7º, IX); Data Safety "IDs do dispositivo ou outros IDs" para prevenção de fraude.
- **Crash:** repetição em memória, 1 escrita/h por assinatura, teto diário, `CRASH_DISABLED`, regra de Rate Limiting do painel em `/api/crash*`. Workers Paid (US$ 5) assinado pelo dono; KV mantido.
- **Chat/transcrição:** chat 250/dia global e 4/min por conta; transcrição pelo `_aiGuard` (10/conta, 100/dia, 4/min).
- **Alertas:** push FCM ao dono (`ADMIN_PUSH_TARGET`) quando um teto global passa de 80 %; `/api/top-ai` + `scripts/top-consumidores.mjs`; Cloudflare Notifications e orçamento de US$ 1 no Google Cloud (BETA-CONTINGENCIA §0.8).
- **Fica para a produção:** Voided Purchases cron, reincidência de reembolso, `purchaseType=0`, contadores atômicos (STATUS).
- **Gatilho para rever:** testador legítimo barrado pelo limite por IP (rede compartilhada: república, empresa) → subir `IP_LIMITS`; forma que ficou feia sem poder regerar virando queixa recorrente → abrir 1 regeração paga/manual por forma.

## 34b. "Gerar de novo" a aparência: um sorteio pago, mensal por forma, em Créditos (decisão do dono, rodada 5, 26/10/2026; muda o §34)

*Pedido (dono):* em Laboratório › Perfil, um botão "Generate again" / "Gerar de novo" que regenera **só a forma atual**, com o mesmo prompt; a pessoa vê a nova ao lado da atual e escolhe manter a atual ou usar a nova. 50 Créditos, 1 por forma por mês, só conta paga. **Cobra antes e aceita o sorteio.**

**O que muda no §34 (e o que não muda).** O §34 dizia "o usuário NÃO pode ficar regerando o Soulmon: uma geração por forma, a mesma forma devolve a arte do cache para sempre". Continua valendo para a **geração gratuita**: `AI_LIMITS.sprite` (`perFormLifetime: 1`, vitalício 15, 6/dia, 800/mês e 40/dia globais) **não foi tocado** nem na forma (os testes de guard travam o objeto inteiro). O que nasce é um **segundo caminho, pago e com cota própria**, ao lado do primeiro:

| Peça | Valor | Onde mora |
|---|---|---|
| Preço | **50 Créditos** (na UI "Credits"/"Créditos") | `SPRITE_REGEN.costCredits` (`functions/api/_spriteRegen.js`), espelho `SPRITE_REGEN_COST_CREDITS` (cliente), paridade travada em `spriteRegen.parity.test.js` |
| Cota | **1 por forma por mês** (UTC, `AAAA-MM`) | `ent.aiRegen { [formId]: 'AAAA-MM' }`, **no servidor** (sobrevive à exclusão da conta, como `aiForms`) |
| Quem | só `ent.tier === 'paid'` (admin e beta-full **não** passam: não têm Créditos a gastar aqui) | `generate-sprite.js` (402 `paid-tier-required`) |
| Pré-requisito | a forma já ter a **1ª geração** (a regeração não é um jeito de pagar pela gratuita) | `ent.aiForms[forma] >= 1` (409 `regen-needs-first-generation`) |
| Volume | o diário por conta, o global mensal/diário e o limite por ip-hash **valem inteiros**; o vitalício e o teto por forma **não** são consumidos | `guardAiRequest(..., { regenPaid: true })` |

**"Cobra antes", idempotente, e devolve se falhar.** `reserveRegen` confere (opId repetido → sem nova cobrança; só paga; 1ª geração; cota do mês; saldo ≥ 50) e **debita numa escrita só** do `ent:` — Créditos − 50, cota do mês da forma e marca do `opId` (`ent.regenOps[opId] = { s, f, m, at }`, `s` = `debited`→`done`|`refunded`) entram **juntos**, então não há janela em que o dinheiro saiu e a marca não existe. O débito vem **antes de qualquer chamada de IA**. No `finally` da rota, **gesto cobrado e não entregue = `refundRegen`**: devolve os 50 **e** a cota do mês daquela forma, e só desfaz um gesto ainda `debited` (a 2ª chamada vê `refunded`/`done` e não mexe em nada). Cobre recusa de teto (diário/ip), falha do provedor, recusa de conteúdo sem imagem (não saiu desenho), republicação que falhou e exceção. Repetir o mesmo `opId`: `done` → devolve a imagem do gesto (cache da forma) sem gerar nem cobrar; `debited` recente → 202; `debited` com mais de 5 min (Worker que caiu) → devolve e responde 502 `regen-refunded`; `refunded` → 409 (o cliente usa um `opId` novo). Um `opId` por **gesto** (`newRegenOpId`); a rede que cai é reenviada **uma vez com o mesmo id**.

**Mesmo prompt, só a forma atual.** `stage.imagePrompt` da forma atual, sem referência de imagem (senão o provedor copia o desenho antigo). O servidor trata `regenPaid` como `regenerate` (pula o cache de leitura). **Guarda só a versão anterior:** reaproveita `previousSprites`/`recordSprite`; "Usar a nova" = `tuneVisor`; "Manter a atual" = `discardNewSprite` (novo, em `spriteLibrary.ts`: devolve a anterior e **não deixa "anterior" sobrando**); sem escolha, a oferta expira na virada do dia e a nova vale (regra existente, §2.3.1 da spec de geração incremental, e dita na tela e nos Termos). "Manter a atual" **não devolve** a cota do mês (o sorteio aconteceu).

**Campo novo de save, com a régua do `CLAUDE.md`:** `spriteLibrary.regenUsed?: Record<formId, 'AAAA-MM'>` — **só espelho de tela** (o autoritativo é `ent.aiRegen`; a tela nunca decide cota). Opcional, leitura tolerante (`normalizeSpriteLibrary` → `sanitizeRegenUsed`: só formas válidas e mês bem-formado; lixo some); o **servidor sanea o mesmo campo no `POST /api/save`** (`save.js`, nunca recusa o save); paridade cliente×servidor travada (`spriteRegen.parity.test.js`, entradas boas e hostis). Não sobe `SAVE_SCHEMA_VERSION` (campo novo com `??`). O espelho não é monotônico no servidor **de propósito**: a devolução precisa poder limpá-lo.

**Contrato de servidor aditivo:** o corpo de `POST /api/generate-sprite` ganha `regenPaid: true` + `opId`; a resposta de sucesso ganha `regen: true` e `credits` (saldo novo). Cliente antigo não manda nada disso (nada muda); servidor antigo com cliente novo ignora os campos e devolve a arte do cache (nada cobrado). Códigos novos: 400 `regen-op-id-required`, 402 `insufficient-credits`, 409 `regen-needs-first-generation` / `regen-duplicate`, 429 `regen-monthly-limit`, 502 `regen-refunded`, 503 `sprite-regen-disabled`. **Kill-switch próprio** `SPRITE_REGEN_DISABLED` (variável do painel, sem deploy; desliga só a regeração, antes do débito).

**Termos.** O §5 do `termos.html` dizia "não é sorteado" para a Nova Leitura e, lido sozinho, contradizia um sorteio pago. Reescrito (EN+PT): a **criatura** continua não sendo sorteada; **gerar a aparência de novo é um sorteio pago de verdade** — só a imagem da forma atual, 50 Créditos, 1 por forma por mês, **sem garantia de que seja melhor ou parecida**, cobrado antes e **devolvido automaticamente se o desenho não sair**, escolha entre a atual e a nova, só a anterior guardada, e a 1ª geração de cada forma segue gratuita. `TERMS_VERSION` → `2026-10-26` (reconsentimento pelo aviso existente, `termsNotice`), os dois carimbos "Última atualização" e os testes de contrato (`consent.versoes`, `consentimentoNascimento`, `subscriptionBoundary`) atualizados.

**Copy.** Voz de produto; sem cobrança nem culpa (`docs/NARRATIVA-E-UNIVERSO.md`): nenhuma frase tem a pessoa como sujeito de veredito, "manter a atual" é uma saída tão boa quanto a outra, e a frase de falha só diz "de volta" quando o **saldo real do servidor** (relido depois do pedido) mostra isso.

**Alternativa que perdeu:** abrir uma **regeração manual grátis** por forma (era o gatilho do §34) — perdeu porque o custo de imagem seria pago por todos para o capricho de poucos. Também perdeu **cobrar só depois do sucesso** ("pague se gostar"): sem reserva escrita não há como segurar concorrência (duas abas, retry) e o provedor cobra de qualquer jeito; ficou "cobra antes e devolve se falhar", que é o que o dono pediu e é o que o resto do app já faz com os tetos (`makeRelease`). Perdeu ainda **contar a regeração no vitalício/teto por forma** do §34: ela consumiria a folga de 4 da conta e fecharia formas futuras por um gasto que a própria pessoa pagou.

**Gatilho para rever:** (1) **queixa recorrente de "paguei e veio pior"** → oferecer ver a prévia pequena antes de cobrar, ou 1 repetição por mês com desconto (nunca "garantia"); (2) **reembolso/estorno de Créditos vinculado a regeração** acima de ~2% dos pedidos, ou chamado de "cobrado e não veio" → revisar a janela de 5 min e o fluxo de devolução; (3) **custo do provedor** (Higgsfield) perto do teto global de 800/mês por causa de regerações → ligar o `SPRITE_REGEN_DISABLED` ou subir o preço; (4) **uso perto de zero** em 60 dias → remover o botão e voltar o §5 dos Termos.

### Plano de rollback (reverter não pode corromper save nem perder dinheiro)

*Princípio:* tudo que esta mudança acrescenta é **opcional e ignorado por quem não a conhece**, então voltar o código nunca invalida um save nem um registro `ent:`.

1. **Desligar sem reverter (primeiro passo, segundos):** `SPRITE_REGEN_DISABLED=1` no painel do Pages. A rota recusa com 503 **antes do débito**; a geração gratuita segue; a tela mostra "descansando por agora, nada foi cobrado". Não exige deploy.
2. **Reverter o código** (`git revert` dos commits da `r5-regen`):
   - *Save do cliente:* `spriteLibrary.regenUsed` é opcional. O `normalizeSpriteLibrary` antigo **descarta chaves que não conhece**: na próxima gravação o campo some, sem erro. `previousSprites` e `pendingTune` já existiam antes; um save com "escolha em aberto" (nova esperando) volta a se comportar como uma sintonia pendente comum (a nova vale na virada do dia).
   - *Registro do servidor:* `ent.aiRegen` e `ent.regenOps` são campos extras do `ent:`; `readEntitlement` faz `{ ...empty, ...parsed }`, então o código antigo **os carrega e os regrava intactos** (e a exclusão de conta os ignora, exceto o `aiRegen`, que o resíduo mínimo guarda). Nenhuma migração.
   - *Contrato:* servidor antigo ignora `regenPaid`/`opId` e devolve a arte do cache (nada cobrado); cliente antigo nunca os manda.
   - *Dinheiro:* **não há ledger novo** — o saldo é o mesmo `ent.credits`. O único risco é um gesto `debited` (cobrado, imagem ainda não entregue) no instante da reversão, que o código antigo não sabe devolver. **Procedimento manual:** listar `ent.regenOps` com `s === 'debited'` e `at` mais velho que 5 min (`wrangler kv key get ent:<saveId>`), somar `+50` em `credits`, trocar `s` para `refunded` e remover a forma de `aiRegen` se `aiRegen[f] === m`. Conferir pelo painel do dono quem reclamou ("cobrado e não veio").
3. **Termos:** **nunca** voltar `TERMS_VERSION` para a data antiga (a prova de consentimento aponta para o texto aceito). Se o recurso sair do ar de vez, o §5 é reescrito de novo e a versão **sobe** outra vez; enquanto o botão existir (mesmo desligado pelo kill-switch), o texto fica.
4. **Sinal de que está saudável:** nenhum `ent:` com `regenOps[*].s === 'debited'` mais velho que 5 min; saldo de Créditos das contas que usaram = saldo antes − 50 × `done`.

*Pendências (não fechadas aqui, para o dono):* (a) o botão **"Gerar Soulmon"** de Configurações (teste fechado, 23/10) ainda pede regeração **grátis** (`regenerate: true`) enquanto os tetos de sprite estão liberados; quando a liberação acabar (`_aiGuard.js`, "Valores de produção"), ele cai no teto por forma de 1 — decidir se sai de vez, já que o caminho oficial passa a ser este; (b) a **Política de Privacidade** não cita a marca de `opId`/`regenOps` (número sem dado pessoal; sem mudança de finalidade) — avaliar se vale uma linha na próxima revisão; (c) o texto de **ajuda/guia/chat** que fala em "uma geração por forma" (`_chatKnowledge.data.js`, Ajuda) ainda não menciona a regeração paga.

## 36. Masmorra que continua sozinha, avanço rápido, especial automático, modalzinho de drop e o Combina 3 (pedido do dono por voz, 11/10/2026)

*Pedido (transcrição literal em `product/beta-play-01/builder/game/`):* "só 'Layer 1 de 6'… tá lento, fast forward 2x/3x/1x no canto inferior direito… não precisa carregar o especial, deixa carregar sozinho… quando dropar item, um modalzinho com o ícone… o jogador pode sair da dungeon e deixar ela acontecendo… o Soulmon não pode ir pra outra função, tem que tirar da dungeon… na home, uma plaquinha 'Estou na dungeon, volto logo'… no Game Hall, um jogo tipo Candy Crush com os assets que a gente já tem". (A frase "se ele sair, ele cancela" é erro de reconhecimento de voz: o sentido é **não cancela**.) *Numeração:* §33 e §34 já existem na `release/beta-1`; esta usa **§36** para não colidir com a frente de integração (§35 fica livre para ela).

**1. HUD — um indicador só.** O que o "6" é: **a escada de 6 criaturas da camada** (`LADDER_TIERS`, baby-i → mega; `DUNGEON_FIGHTS_PER_FLOOR`), **não** o número de camadas (elas vão até 999, §31). A tela mostrava "Camada N" no título, "k/6" ao lado e "Camada N" de novo embaixo à direita. Agora é UM texto no título: **"Camada N · luta k de 6" / "Layer N · fight k of 6"**; o selo "k/6" saiu e a linha de baixo virou só `aria-live` para leitor de tela (fora da tela). *Por que "luta k de 6" e não "Camada N de 6":* "de 6" depois da camada diria que a descida tem 6 camadas — falso.

**2. Avanço rápido 1×/2×/3×** (botão no canto inferior direito, preferência no aparelho em `STORAGE_KEYS.DUNGEON_SPEED`, lixo → 1×). **Só encurta o relógio da cena e a pausa entre lutas** (`useGroupBattle`: o relógio da luta anda `speed` vezes mais depressa; `DUNGEON_AUTO_FIGHT_MS ÷ speed`). O núcleo de combate decide a luta pela **semente** e não lê o relógio de parede ⇒ **o resultado é o mesmo em qualquer velocidade** (teste: `useGroupBattle.velocidade.test.tsx` — 1×, 2× e 3× dão o mesmo `winner`/`hpLeft`/`energyLeft`/`t`, idênticos à conta pura). Acima de 1× a arte entra no modo de movimento reduzido (flash no alvo, sem investida/projétil — `BattleStage fast`) para acompanhar o relógio; com `prefers-reduced-motion` já era assim. Nenhum campo do servidor mudou (a luta nunca foi validada lá).

**3. Especial automático.** O anel e a esquiva **saíram da Masmorra** (Arena, Duelo e Pesadelo seguem como eram). A nota de cada especial é um **sorteio com semente** — `autoRingGrade(fightSeed, n)` / `autoDodgeGrade(fightSeed, n)` (`utils/dungeonFight.ts`) — sobre as chances da habilidade `media` (`ARENA_SKILL_ODDS`: anel 25/50/25 %, esquiva 30/40/30 %), **a mesma que todos os portões de balanço já simulam** (`playSequence`, padrão `media`). Logo a parede medida (`dungeon.v3.test.ts`) **não se mexe**; quem desviava à mão deixa de ter vantagem, quem não desviava deixa de ter desvantagem. A nota depende só da semente e do número do especial na luta ⇒ igual na tela, em qualquer velocidade e na conta fora do app.

**4. Modalzinho de drop.** Ícone + nome + quantidade (coraçãozinho, o item do marco, fragmentos do Soulsmith; Bits seguem no painel, não são "item"). Fila pura em `utils/dungeonDrops.ts`: o mesmo item soma na entrada que espera; **em 3× tudo vira um modal só**. Fecha por toque no véu/cartão, "OK", Esc ou sozinho (3,5 s ÷ velocidade). **Não é o `ModalSheet`**: aquele é folha de baixo que inertiza o resto (`useDialogA11y`) e não fecha pelo véu — aqui a luta e o botão de avanço rápido precisam seguir à mão; mesmos tokens (`--sm2-surface`, `SM2_SHADOW_CARD`, `sm2Button`). Arte: `ITEM_ART` (coração, 🌀) e `combate-v3/equip/fragmento.png`.

**5. A descida que continua sozinha.** *O que já existia (§31):* `dungeonIdle.ts` (energia 1/camada, teto por Lv, `dungeonHp`, recorde) — mas a run vivia só dentro do componente: fechar a tela a perdia. *O que nasceu:* campo **`dungeonAway`** no save (posição: camada, lugar na escada 0..6, HP, energia do especial, semente, instantâneo do jogador, marco já pago) e a conta **pura** `utils/dungeonAway.ts › applyDungeonAway(estado, now)` que **rejoga** a descida pelo MESMO motor da tela, luta a luta, com o especial automático, gastando o tempo que a cena gastaria. A tela grava a posição ao começar e a cada luta vencida; **sair não apaga**; o X pergunta "Sair da tela? Ele continua descendo sozinho…" e tem a 3ª saída **"Retirar da masmorra"**.
 - *Teto de tempo:* `DUNGEON_AWAY_MAX_MS` = **8 h** por vez (o resto não rende nem custa); `now < since` não rende nada. O que limita de verdade é a **energia** (1/camada, a da Home): sem ela a descida acaba sozinha ("energy"), assim como por HP zerado, portão do Vínculo ou teto do Lv — e o Soulmon **volta para casa** sozinho.
 - *Determinismo e "nada de cliente gravando recompensa":* a conta é função de `(save, now)`; é **idempotente** (reaplicar no mesmo instante não rende nada) e fatiar o tempo não muda o total (testes). Cada recompensa sai dos **mesmos funis puros da tela** — Bits por `creditMinigameBits` (teto diário de 150), coração com o teto de 2/dia (`dungeonHeartsLeftToday`/`noteDungeonHeartDrops`, no aparelho como sempre), o item do 1º marco, fragmentos de profundidade, Vínculo e missão semanal (`utils/dungeonRewards.ts`, dono único também para o `App`). O cliente grava a **posição**; a posição só avança por esta conta. **Limite declarado:** não existe relógio de servidor no app — `now` é o relógio do aparelho, o mesmo que já manda no `hpAgora` e nos tetos diários; adiantar o relógio rende no máximo 8 h de descida por registro, custa a energia correspondente e os Bits ainda passam pelo teto. Validar no servidor exigiria mover o save para lá (§D5 da ADR-006 recusa).
 - *Ao voltar:* a tela acerta a conta UMA vez e mostra o cartão "Enquanto você esteve fora, a descida seguiu" (camadas, criaturas, Bits, drops, energia, o teto de 8 h se passou) com **"Ver a descida"** (segue ao vivo da posição) e **"Retirar da masmorra"**; se a descida acabou sozinha, a tela de fim com a nota "isto aconteceu enquanto você esteve fora; ele já voltou para casa".
 - *Não conta fora do app:* o placar `DUNGEON_BEST` (é do aparelho e mede a descida ao vivo) e o som/animação (óbvio).

**6. Soulmon OCUPADO.** Critério único: `soulmonNaMasmorra(save)` = o registro `dungeonAway` existir. **Pontos de entrada que usam o Soulmon e ficam fechados** (aviso "Ele está na masmorra" com **Retirar da masmorra** / Deixar lá — `DungeonBusyModal`, em cima do `ModalSheet` base): evoluir (`handleEvolveRequest`, `handleEvolve`, `handleEvolveToUnlocked`), renascer (`handleRebirth`), missão da guilda (`handleGuildMissionSend`), e, nos lotes do `AreaView`, **Duelo, Torneio e Passeio** (também pelo `initialSheet`/linha "Take a stroll" da Home). No sentido contrário, o Soulmon **em missão da guilda não desce à masmorra** (aviso próprio). Lista travada por `soulmonOcupado.contract.test.ts`. **Livre de propósito:** cuidar (comer, banho, dormir, carinho) — é o que abastece a energia da própria descida e o laço central do app; os jogos do Salão/Ateliê/Refúgio (o pet ali é só avatar); o **Pesadelo da manhã** (intersticial automático, não uma ação escolhida — bloqueá-lo pularia a noite sem o jogador ter feito nada). Os três vão para o dono (abaixo).

**7. Plaquinha na Home.** Com o registro presente o pet some do palco (`visibility: hidden`, fora do leitor de tela) e no lugar fica **"Estou na masmorra, volto logo" / "I’m in the dungeon, back soon"**: componente de CSS com os tokens do app e a **porta da masmorra** que já estava no repo (`DUNGEON_PROP_ART.porta`; nenhuma imagem nova, nenhuma gerada). É um botão: toca → o aviso com "Retirar da masmorra", que restaura o pet. Mesmo precedente visual da missão da guilda (`missionAway`). Sem texto de cobrança.

**8. Combina 3 (Salão de Jogos).** Tabuleiro 7×7, 6 tipos de peça = **ícones de elemento que já existem** (`elementIconArt`: `el-fogo`, `el-agua`, `el-terra`, `el-vida`, `el-ar`, `el-luz`; formas distintas, a cor nunca é a única pista), 20 movimentos por rodada, troca de vizinhas (toque, arrasto, teclado), linhas de 3+, **cascata** (cada passo vale ×1, ×1,5, ×2…), **peça especial** (linha de 4+ deixa uma peça com setas que limpa a linha/coluna e pode disparar outras em cadeia), embaralha sozinho sem jogadas, troca inválida volta **sem gastar movimento** (aviso calmo, sem vermelho). Lógica pura e determinística por semente em `utils/match3.ts`. **Recompensa só pelo funil dos outros jogos:** `onEarnPoints(bits)` UMA vez no fim da rodada → `handleEarnGamePoints` → teto diário de 150 (`creditMinigameBits`). **Conta:** 1 Bit a cada `M3_POINTS_PER_BIT` = **250 pontos**, teto `M3_MAX_BITS` = **8** por rodada. Régua em `utils/mente/balanco.test.ts` (a mediana de 41 sementes com as funções reais): típico (qualquer jogada válida, 3,5 s/lance) **3 Bits em ~1,2 min = 3,3 Bits/min**; experiente (sempre a melhor troca, 2,3 s/lance) **6 Bits em ~0,8 min = 7,3 Bits/min** — dentro da faixa 2,5–9 do típico e ≤ 13 do experiente; o teto de 8 é alcançável (p95 do experiente). Sem moeda de dinheiro real, sem culpa, sem relógio (a rodada acaba nos movimentos). **Assets usados:** os 6 ícones de elemento acima e a gema `icons/icon-gem.png` no card do Salão; as setas da peça especial e a plaquinha são SVG/CSS. Backend: nenhum.

*Estado do save (régua):* campo **novo `dungeonAway?`** (opcional, `undefined` = em casa; **não** sobe `SAVE_SCHEMA_VERSION` — campo novo com `??`, PLANO-SAVE-SCHEMA §2.6); `hydrateSave` o higieniza inteiro (`sanitizeDungeonAway`: registro bom ou nada, faixas presas); `fuzz2` 123 → **124 campos**. Preferência de velocidade e recorde do Combina 3 ficam no aparelho (`STORAGE_KEYS`), como o recorde da Corrida.

- **Custo aceito:** a conta fora do app usa o relógio do aparelho (acima); o tempo de cada luta na conta é a duração do núcleo + 2,2 s por especial + 0,9 s de respiro + 4 s entre lutas (estimativa fiel à cena, não ao milissegundo).
- **Depende do dono:** (1) cuidar (comer, banho, dormir) com o Soulmon na masmorra: hoje livre — deveria a Home pedir a plaquinha antes? (2) o Pesadelo da manhã com o Soulmon na masmorra: hoje abre normalmente; (3) o teto de 8 h fora e o `M3_POINTS_PER_BIT` (250) são números meus, ajustáveis; (4) a "luta k de 6" no lugar de "Camada N de 6".
- **Gatilho para rever:** testador reclamando que a descida "anda de menos/mais" fora do app (ajustar `AWAY_CAST_PAUSE_MS`/o teto), ou Bits do Combina 3 virando "o jogo de fazer Bits" (a régua `balanco.test.ts` reprova antes).

## 40. Beta-2, frente B (regras): fome e energia por tempo, limite diário da masmorra, três check-ins, placa de madeira, Soulsmith e modo imersivo (backlog do dono, 13/10/2026)

*Numeração:* esta frente usa **§40** de propósito (a `release/beta-2` termina em §36 e §35 ficou para a frente de integração; as frentes A, C e D também escrevem aqui — evita colisão no merge). *Contrato com as outras frentes, save e merge:* `docs/FRENTE-B-REGRAS-BETA2.md`. *Régua viva:* os testes citados em cada item.

**Pedido (backlog beta-2, itens 3.1, 3.4, 3.5, 4.1, 6.1, 6.2, 6.3, 8.3, 13.3):** timer de energia · fome no sistema de necessidades, com a COMIDA recuperando FOME (não energia) e a fome decidindo a velocidade da regeneração (faminto = interrompida · mediano = mais lenta · bem alimentado = 100%) · três check-ins diários · limite diário de camadas na lógica autoritativa · placa de madeira com o tempo de retorno · preservar as regras da masmorra · Soulsmith bloqueado · Android imersivo · persistência/integridade.

### 40.1 O que reverte, e por quê (leia antes de rever)
* **Reverte o §30/§31 e a linha ⚡ do `CLAUDE.md` ("a energia enche só comendo"):** agora a energia SOBE COM O TEMPO e a COMIDA enche a FOME. Foi pedido expresso do dono em 13/10/2026 ("COMIDA recupera fome, não energia direto; fome determina a velocidade de regeneração de energia").
* **Reverte, só nesta parte, o "perdeu" do §28** ("texto de 'fome' como NECESSIDADE da criatura: criatura que passa fome por ausência é culpa pela porta dos fundos"). O que mudou desde que perdeu: o dono pediu a fome. A objeção do §28 vira o desenho: **fome NUNCA tira coração, Bits, XP nem bloqueia nada além da própria regeneração da energia**; não há mensagem de cobrança (a dica diz o que sobe e o que desce, em voz de produto); `faminto` é um estado do bicho, não um veredito sobre a pessoa. Quem some um dia volta com o bicho faminto e a energia parada — e a energia já zerava todo dia. Teste que trava isto: `hunger.test.ts` ("faminto: a regeneração está INTERROMPIDA") + `checkIns.test.ts` (nenhuma leitura de desempenho).
* **Não reverte** "a energia zera na virada" (§30): continua. O que mudou é COMO ela é reposta no dia.

### 40.2 Fome e regeneração (3.4 e 3.5) — números propostos
Dono único: `src/utils/hunger.ts` (puro, `now` por parâmetro). **Valores são defaults da squad — decisão do dono.**

| Peça | Valor | Por quê |
|---|---|---|
| Fome | 0–100, **cai de 100 a 0 em 14 h** (por timestamp, app aberto ou fechado) | dá uma curva graduada entre "leve" e "intenso" (ver tabela); 36 h/24 h saturavam: ou sempre cheio ou sempre faminto |
| Comida comum | **+40** de fome (cada atividade concluída ainda rende UMA comida, e ela ainda dá os pontos de atributo) | 2 comidas já passam de "bem alimentado" |
| Comida premium ★ | **+100** (enche); **recusada com fome ≥ 80** (o item volta) | era +5 de energia; mantém 1 uso/dia, 1 drop/dia e 3/semana |
| Faixas | **bem alimentado ≥ 60 · mediano 20–59 · faminto < 20** | três estados legíveis |
| Velocidade | **100% · 50% · 0%** | pedido do dono (interrompida / mais lenta / 100%) |
| Regeneração a 100% | **1 unidade a cada 120 min** (teto físico: 12/dia) | 12 = o tanque dos estágios altos; combina com a zona de conforto do §31 |
| Zera na virada | **sim, a energia — não o relógio nem a fome** | preserva §30; "timers não reiniciam" |

**Orçamento (régua `hunger.balanco.test.ts`, simulação com as funções reais, comendo espalhado das 8 h às 22 h):** energia ganha por dia × conclusões por dia — 0 → **0** · 1 → **0,7** · 2 → **1,4** · 3 → **2,8** · 4 → **6,0** · 6 → **9,2** · 9 → **9,7** · 12 → **9,7**. O §30 pedia leve ≈ 2, médio ≈ 3–4, intenso 6+. Comendo as 2 de uma vez de manhã o "leve" chega a 2,8 (comida junta mantém a fome alta por horas: não é exploit — fica abaixo de 3 e o tanque é o mesmo). **Custo aceito:** o "leve" (2 conclusões espalhadas) ganha ~1,4 camada/dia, não 2 — quem faz pouco desce menos. Se for demais: `HUNGER_PER_FOOD` 45–50 (leve → ~1,8–2).

**Como o timer não mente (3.4):** o relógio (`energyClock {at, carry}`) mora no save; o `carry` é o progresso até a próxima unidade em ponto-ms inteiros (velocidade em % × ms), sem float a derivar. `energyStatus` projeta a MESMA integral para a frente — **incluindo a queda de faixa que a fome vai sofrer** —, então o número da tela é o que o motor vai fazer (teste: 1 ms antes não há unidade; no instante há) e ele **muda quando a velocidade muda** (comer encurta; passar de faixa alonga). Se a fome vai cair a "faminto" ANTES de fechar a próxima unidade, o timer diz a verdade (`–`) em vez de inventar um tempo. Fatiar o tempo não muda o total (ler a cada 20 s = ler uma vez em 13 h). Gastar energia não reinicia o progresso; sair da energia CHEIA recomeça o relógio no instante do gasto (a energia cheia tem o relógio PARADO e re-ancorado a cada 30 min, para evoluir — o máximo sobe — não creditar dias de regeneração).
**Com o Soulmon NA MASMORRA o tick da Home congela a energia em `dungeonAway.since`** (`tickEnergy`/`tickTime`): a conta de quem ficou fora rejoga a linha do tempo regenerando entre as camadas, e creditar a regeneração de antemão daria camadas "de graça" no começo da descida. Congelar é adiar (o acerto depois da volta credita o intervalo todo; teste: mesmo total de quem ficou em casa).
**Fontes de energia por comida que existiam (auditadas, todas trocadas):** `careRules.feedFood` (+1) · `specialItemUse` premium (+5) · desktop `localFeed`/`remoteFeed` (herdam por import) · texto de Guia/Ajuda/dicas/chat · o toast "falta encher a energia" e o convite de refeição (`canFeed`, que olhava a energia cheia — agora a fome). **Outras fontes que continuam e passam pela porta única `setEnergy`:** Level Up (enche, §31), Pesadelo vencido (+energia, §20.10), brincar (−`PLAY_ENERGY_COST`), a camada da masmorra (−1) e a virada (zera).

### 40.3 Limite diário de camadas da masmorra (6.1) — onde é autoritativo
* **Achado (onde o servidor valida a masmorra):** em lugar nenhum. A descida é do cliente por decisão (§31: "nada da descida tem espelho em `functions/api`"; ADR-006 §D5: o servidor não conhece o `GameState`). O que o servidor valida são o duelo (`_duel.js`), os portões (`_gates.js`) e a FORMA de campos do save em `save.js`. **Então a camada autoritativa é a porta pura `spendLayer`** (`dungeonIdle.ts`), que a tela e a conta de quem ficou fora (`dungeonAway.ts`) usam; ela reconfere energia (com a regeneração acertada até `now`) e o contador do dia sobre o `prev` DENTRO do updater — a UI só espelha (`layerRefusal`).
* **Default proposto: `DUNGEON_DAILY_LAYERS` = 10 camadas por dia do jogador; custo = 1 de energia por camada (inalterado); duração fora do app = 8 h (inalterada).** 10 fica logo abaixo do tanque dos estágios altos (12) e acima do dos baixos (8): limita Level Up refill + comida premium + regeneração juntos, sem mexer em quem desce 3–5 por dia. Bater o limite nunca custa coração nem Bits; o botão não acende e a frase é calma ("Por hoje já deu: até 10 camadas por dia. Amanhã ele desce de novo.").
* **Persistência/exploits:** o contador mora no save (`dungeonDaily {day, layers}`); sair/entrar/reabrir/retirar não devolvem camada; relógio que volta não reabre o dia (vale o maior entre o do relógio e o do registro); a conta fora do app conta no mesmo contador (no dia da LINHA DO TEMPO da descida) e termina com "daily". **Servidor (a parte que dá para ser autoritativa sem mover o save):** `functions/api/_dayCounters.js` torna o contador MONOTÔNICO no POST do save — mesmo dia = máximo; dia anterior = mantém o gravado; dia > dia do servidor + 1 = ignora; campo omitido = mantém. Apagar o save local ou reinstalar não devolve camada. **Limite honesto:** quem edita o relógio E o save para o dia seguinte ganha, no máximo, UM dia de contador por dia de relógio adiantado, e Bits/XP/Glitchtama seguem presos aos tetos próprios.
* **6.3 preservado e travado** (testes existentes verdes sem edição de regra): `Layer N · fight k of 6`, 1×/2×/3× (resultado igual em qualquer velocidade), progresso no estado do jogo (não só no timer), sair da tela ≠ abandonar, Soulmon ocupado enquanto o registro existe, especiais pelas regras, recompensas/itens/transições.

### 40.4 Três check-ins diários (4.1) — defaults para o dono decidir
Dono único: `src/utils/checkIns.ts`. **Reusa as três janelas do §28** (padrão 09:00 · 13:30 · 20:00, editáveis em Configurações, push opt-in com o teto de 4/dia, nunca na janela de descanso): não há segundo conjunto de horários nem segundo canal. **O §28 dizia "recompensa: nenhuma"; o dono pediu benefício específico por janela → passa a existir, pequeno.**

| Janela | Propósito (rótulo do botão) | Recompensa (default) |
|---|---|---|
| Manhã | Preparar o dia | **fome +30** (o dia começa com a energia correndo) |
| Tarde | Ver como está indo | **+10 Bits** (grátis, nunca de Crédito) |
| Noite | Encerrar o dia | **+10 de XP de Vínculo** (o mesmo XP do check-in da manhã) |

**Disponibilidade:** do horário da janela até o horário da próxima (a noite vai até o fim do dia) — chegar tarde dentro do intervalo vale; **o app não precisa estar aberto na hora**. **Conclusão:** um toque no botão do cartão da refeição (Home). **Única por janela por dia do jogador** (fuso fixo do save; no máximo 3/dia); reabrir/entrar/sair/tocar duas vezes não repaga; relógio que volta não reabre; o servidor guarda `checkIns` monotônico. **Sem penalidade:** perder uma janela não deixa rastro (sem sequência, sem contador de perdidos, sem texto de cobrança) e nada neste módulo lê desempenho (teste varrendo as importações). Nenhuma janela dá energia direta, HP, Emblema nem vantagem paga.
**Pendente:** a UI hoje é um botão dentro do cartão da refeição (janela de 2 h do §28); a frente A/C decide se o check-in vira bottom sheet. A disponibilidade (até a próxima janela) é mais larga que o cartão (2 h): fora do cartão ainda não há onde tocar — dono decide se o check-in ganha entrada própria (ex.: no menu de Missões).

### 40.5 Placa de madeira "In Dungeon" (6.2)
`DungeonSign`: caixa fixa 118 × 46 (contrato de slot com a frente A), "Na masmorra"/"In Dungeon" + o tempo (`1h05`, `42 min`, `Voltou`). O tempo é o FIM PROJETADO da descida pela mesma conta determinística de `applyDungeonAway` (teto de 8 h a partir do `since` persistido; antes se energia, HP, limite diário ou portão acabarem): **vinculado ao estado persistido, não reinicia ao reabrir, muda quando energia/fome/camadas mudam** (`useDungeonReturn`, testado). Madeira em CSS com variáveis locais de fallback (`--sm2-wood*`); nenhuma imagem nova.

### 40.6 Soulsmith "bloqueado" (8.3) — causa raiz
**Reproduzido em teste** (`soulsmithAcesso.test.ts`, "causa raiz reproduzida"): o Vínculo não era o problema (o prédio abre no Vínculo 2). O que o Soulsmith precisa — a peça de nível 1 e os materiais de aprimoramento — só nasce no **resgate da missão do prédio** (`claimBuildingQuest` → `applyForgeGrant`). Desde `9f9be52a5` ("a missão só aponta, depois resgata") a tela de "Resgatar" existe **apenas para os prédios LISTADOS** (hoje só o Caderno, cujo material — tinta — não é de nenhuma peça). Os outros 14 prédios ficavam `ready` para sempre, sem botão: nenhum jogador recebia peça nem material e o Soulsmith abria vazio, "concluídos os scrolls e as missões" ou não. **Correção** (`applyBuildingEntry`, `forgeActions.ts`): o prédio NÃO listado paga o material e a peça na própria entrada; o listado (Caderno) segue com ação real + Resgatar. **Sem liberar artificialmente:** continuam valendo o Vínculo do prédio, 1 material por prédio por dia do jogador, peça única, e 15 níveis com custo crescente. Testado: no mesmo instante, depois de reabrir (JSON + sanitize), relógio para trás, entrar/sair 20×, Vínculo insuficiente (não paga), dia seguinte (paga mais 1).

### 40.7 Android imersivo (3.1)
`MainActivity`: `WindowInsetsControllerCompat.hide(systemBars)` com `BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE` (deslizar a borda mostra as barras por um instante; o gesto de voltar e o botão Voltar da navegação por 3 botões seguem funcionando), reaplicado em `onWindowFocusChanged`. **Sem** `FLAG_FULLSCREEN`/`windowFullscreen`/`setDecorFitsSystemWindows(false)` (quebram o `adjustResize` do teclado no Android < 11; o app tem campos de texto) e **sem** mexer no recorte: do Android 15 em diante o edge-to-edge já é obrigatório (targetSdk 36) e o `SystemBars` do Capacitor 8 injeta as áreas seguras na página. Verificado: `assembleDebug` verde (JBR do Android Studio), manifesto/tema inalterados, contrato em `src/deploy/androidImersivo.contract.test.ts`. **Não verificado em aparelho** (sem dispositivo na máquina): dizer ao dono para testar em Android 10, 12 e 15 — barras escondidas, deslize revela, voltar funciona, teclado abre sem cobrir o campo.

### 40.8 Save (13.3)
Campos novos, todos opcionais com sanitize no `hydrateSave` (**não sobe `SAVE_SCHEMA_VERSION`**, PLANO-SAVE-SCHEMA §2.6): `hunger`, `energyClock`, `dungeonDaily`, `checkIns` (+4 → `fuzz2` 124 → **128**; no merge somar os `+N` das quatro frentes). Servidor: `dungeonDaily` e `checkIns` monotônicos no `save.js`.

### 40.9 Decisões de balanceamento que ficam com o dono (defaults acima)
1. Fome: queda 14 h · comida +40 · premium +100/recusa ≥ 80 · faixas 60/20 · velocidades 100/50/0.
2. Regeneração: 1 unidade / 120 min a 100% (teto 12/dia); energia continua zerando na virada (alternativa: não zerar, deixando o limite diário de camadas fazer o papel).
3. Limite diário: 10 camadas/dia; custo 1/camada; duração fora do app 8 h.
4. Check-ins: recompensas (fome +30 / 10 Bits / 10 XP), "disponível até a próxima janela", onde fica o botão.
5. Fome ao dormir/estar fora: hoje cai igual (o relógio é o relógio). Alternativa: pausar a queda na janela de descanso.
6. O "leve" perde um pouco de energia/dia (1,4 contra 2) — ajustar com `HUNGER_PER_FOOD`.
7. Placa: o tempo mostrado é o fim PROJETADO (pode ser menor que 8 h); alternativa: sempre o teto de 8 h.

- **Alternativas que perderam:** contador visual só no cliente para o timer (viola 3.4); energia continuar enchendo por comida e a fome só enfeitar (viola 3.5); limite diário só na UI (viola 6.1); `FLAG_FULLSCREEN` para o modo imersivo (quebra o teclado); resgate manual para todos os 14 prédios (14 linhas no menu da Home, contra o §"a UI de missão NUNCA fica dentro do prédio"); recompensa de check-in em energia direta (conflita com 3.5).
- **Gatilho para rever:** telemetria com a mediana de "faminto" > 50% do dia (queda de 14 h curta demais) ou energia que "nunca sobe" nas queixas; `daily` encerrando mais de 1 descida em cada 3; check-in tocado por < 20% dos que abrem o cartão (benefício fraco) ou por > 90% (virou rotina vazia).

### 40.4-b Check-ins ocultos, prévia só do admin, iniciais não evoluem (dono, 14/10/2026)

- **Decisão:** (1) os três check-ins do dia (§40.4) saem do jogo por ora — "ficou horrível, oculta, depois eu melhoro": `CHECKINS_ENABLED = false` em `utils/checkIns.ts` (único interruptor); (2) forma futura **não é pré-visualizável** para o jogador comum, porque a arte só é gerada perto de evoluir — a prévia (silhueta/revelar) fica só para o administrador, flag derivada do servidor (`verifiedAdmin` → `useAdmin`); (3) **os 5 iniciais não evoluem** (um sprite só).
- **Alternativas que perderam:** apagar o código/campo `checkIns` (perde save e o mecanismo para religar); flag lida do cliente (forjável); manter a árvore dos iniciais com formas de mesmo sprite (silhuetas idênticas, "evoluções erradas").
- **Gatilho para rever:** o dono redesenhar os check-ins (religar a flag e ajustar os §40.9-4); a arte dos iniciais ganhar formas próprias.

## 41. Qualidade da geração de arte: sombras em low, sprites de Soulmon em medium (dono, 13/10/2026)

- **Decisão:** as 12 sombras do Pesadelo usam a qualidade **low** do Higgsfield (`gpt_image_2`, 0,5 crédito/imagem), instaladas em `src/assets/soulmon/dino/dino-shadow-*.png`. Os sprites de Soulmon (rookie → ultra) usam **medium** (1,0 crédito/imagem).
- **Evidência:** teste `E:\soulmon-sprites-teste` (3 usuários simulados × 5 formas, low × medium) e `sombras\folha-low-x-medium.png`.
- **Pendente:** ligar `gpt_image_2` + chroma-key verde na geração em produção (`generate-sprite.js`) com a correção de prompts do teste; refazer as sombras pelo oráculo se o dono quiser (as instaladas vieram de prompts escritos à mão para o teste).

## 44. Polimento da Home e atividades: XP por subtarefa, Hábito × Tarefa, View all (pedido do dono, 14/10/2026)

- **Pedido (voz):** sem círculos nos botões Mapa/casinha/"!"; checkbox vazio com contorno bronze e marcado com check turquesa e glow discreto; lista Hoje só com nome + checkbox (+ filhos); cada subtarefa dá XP; Hábitos = todo dia, Tasks = pontual ou em dias específicos; tirar a sugestão "Pagar contas"; `View all` discreto, com swipe lateral, só edita e mostra nome + dias.
- **XP por subtarefa — PROPOSTA A REVISAR PELO DONO (default conservador):**
  - Regra de hoje (inalterada): conclusão paga `XP_PER_EFFORT (10) × peso` (tarefa: esforço 1–3 via `effortOf`; hábito: peso 1 × tier de maturidade). Quem concede é o **cliente** (`awardBondXP` dentro do updater, `totalXP` no save); o servidor/Worker **não concede nem valida XP** (só deriva o nível do `totalXP` do save, `functions/api/_bond.js`; o limite honesto já está escrito lá). Sem teto diário para conclusão; a anti-farm de hoje é "feito não desmarca" + `completeHabit` idempotente por dia + janela de desfazer de 5 s (snapshot).
  - **Nova:** cada subtarefa concluída paga `XP_STEP_FRACTION = 10%` do XP-base da tarefa-mãe (mínimo 1), só as **5 primeiras** por tarefa (`XP_STEP_MAX_PAID`). Total de uma tarefa com subtarefas = simples **+10% a +50%** (2 subtarefas: +20%; 5 ou mais: +50%, o teto). A conclusão da tarefa continua pagando o XP dela. Hábito com etapas: mesma conta por etapa, contador **por dia** (as etapas voltam desmarcadas na virada).
  - **Sem farm:** o pagamento é por TRANSIÇÃO pendente → feita dentro do updater (idempotente no StrictMode e no duplo toque); subtarefa feita não desmarca; o contador `stepXpPaid` (campo opcional na `Task` e na `Activity`, mais `stepXpDay` no hábito) **só sobe**, então editar a lista, apagar e recriar subtarefa não abre vaga nova; ao bater 5 o XP simplesmente para. A próxima ocorrência de tarefa recorrente nasce com o contador zerado (é outra ocorrência).
  - **Migração segura:** nenhum campo de topo novo (o contador do `fuzz2` não muda); save antigo sem `stepXpPaid` conta as subtarefas já feitas como pagas (nada retroativo, ninguém ganha XP de graça na primeira abertura). O desfazer de 5 s já reverte `activities`/`totalXP`, então o contador volta junto.
  - **Não mexe na meta do dia:** o peso da tarefa continua `effortWithSteps` (subtarefas nunca multiplicam a meta). É XP do Vínculo, não esforço.
  - **Alternativa que perdeu:** pagar o XP inteiro da tarefa só no fim (estado anterior — o dono quer reconhecer a complexidade) e pagar por contagem (o defeito do Karma do Todoist, §5.2). **Gatilho de revisão:** se a mediana de XP/dia de quem usa subtarefas passar ~1,3× a de quem não usa, baixar `XP_STEP_FRACTION` ou `XP_STEP_MAX_PAID`. Números a decidir: 10%, teto de 5 subtarefas, e se hábito com etapas deve pagar (hoje paga).
- **Hábito × Tarefa (semântica):** Hábito = acontece **todo dia** (sempre no Hoje, sem agendador). Tarefa = **pontual** ou em **dias específicos** (dias da semana, a cada X dias, N× por semana), configurada pela pessoa. Modelo de dados intacto: a tarefa em dias específicos é gravada como `Activity` com `schedule` (a cota de hábitos do modo grátis continua contando atividades — decisão de produto pendente: tarefa agendada deveria contar na cota?). No Hoje, `Tasks` = pontuais + agendadas que caem hoje; `Habits` = diárias. Criação: segmento `Hábito | Tarefa` e, em Tarefa, `Uma vez | Dias específicos`.
- **View all:** só TASKS agendadas (atividades fora do "todo dia") e pontuais com início futuro; hábitos não entram; a linha não tem checkbox (tocar abre a edição) e mostra nome + dias em que aparece. Gesto: arrastar para a **esquerda** abre, para a direita volta; a tela desliza (280 ms / 240 ms), sem animação em `prefers-reduced-motion`.
- **Sugestão removida:** `src/data/taskPresets.ts` ("Pagar contas") e o atalho no `CreateModal`. Fica o `repeatEveryDays` do modelo (saves antigos) e o `nextOccurrence`.
- **Efeitos colaterais para o dono ver:** (1) a linha do Hoje perdeu o convite da tarefa assombrada, o contador de adiamentos, prazo e a prévia "+N XP base" do hábito (o pedido de 11/10 foi superado pelo de 14/10); o `TaskMeta` segue na tela de edição; (2) o brilho de linha recém-concluída (caixa dura) saiu junto do glow antigo; (3) o `AvisosLink` também perdeu o círculo, para a pilha do canto ficar coerente.

## 43. Sprites de Soulmon: fundo TRANSPARENTE (sem chroma verde) e GPT Image 2.5 flare (dono, 14/10/2026)

> **REVOGADO em parte pelo §48 (14/10/2026):** o fundo transparente não funciona por API; vale fundo verde + chroma-key no servidor, modelo padrão 2.0 Alpha.

- **Decisão:** o prompt de sprite (`composeSpritePrompt`) pede `transparent background, isolated subject, no backdrop, no checkerboard`; nenhum `#00FF00`/chroma-key no gerador de Soulmon (o pendente do §41 sobre chroma-key fica substituído). Modelo: GPT Image 2.5 **flare** via API pública, id `marketing-studio/image/flare` (`POST https://api.higgsfield.ai/marketing-studio/image/flare`, status em `GET /requests/{id}/status`), qualidade **medium**, `resolution 1k`, `aspect_ratio 1:1`, `enhance_prompt false`, `moderation auto`. Credencial única `HF_CREDENTIALS` (`keyId:keySecret`); ausente, `generate-sprite.js` segue no Soul. `SPRITE_MODEL` força o modelo (`soul` ou outro id).
- **Não vale para** ícones/UI do arte-gerador (seguem o chroma da regra global).
- **Pendente de verificação:** a documentação pública não lista o schema do flare (a página do modelo dá 404) e a CLI ficou fora do ar na sessão; o ALFA REAL não foi confirmado. Se o flare devolver xadrez/RGB, a mitigação é fundo sólido neutro + remoção no cliente, a decidir pelo dono.

## 42. Fila central de modais, intro de NPC em tela cheia e resumo do dia centralizado (pedido do dono por voz, 14/10/2026)

*Pedido (transcrição no topo de `FILA-DE-MODAIS.md`):* "bugs com esses modais novos, quando sobe de nível ou quando começa um dia novo… sobrepõe um modal com o outro, trava e o fluxo todo quebra… fechei o jogo, abri de novo, veio um modal, depois outro modal do mapa. Tem que ter uma ordem de prioridade para não haver sobreposição. Também: a tela de introdução do mapa, dos NPCs… o NPC bem GRANDE e a janela de texto, SEM aquele modalzinho com 'continuar'/'depois'… ao tocar na tela, avança… no canto superior ESQUERDO, 'Pular'/'Skip'. Os modais do começo do dia NÃO são bottom sheet: são o modal CENTRALIZADO. E agrupe mais: 'como foi o dia anterior' + 'quantas vidas tem' vira UM só. Por enquanto agrupe só esses."

- **Causa raiz (achada lendo o `App.tsx`):** a fila de intersticiais já existia (`const interstitial`, cadeia ternária), mas tinha três defeitos que produzem exatamente o relato. **(1) Recalculada a cada render, sem "quem está na tela":** o prédio novo ficava ACIMA do resumo do dia, do check-in e do level-up; ao ficar pronto no meio do resumo, ele DESMONTAVA o resumo (a pessoa perdia a página) e o resumo voltava do começo depois. **(2) "Visto" só ao fechar:** `buildingIntrosSeen` só era gravado em "Depois"/"Ir lá", `DAILY_REPORT_SHOWN` só em `handleCloseDailyReport` e `lastCelebratedLevel` só no toque do overlay — fechar o jogo no meio devolvia tudo, e vários prédios pendentes viravam um modal por prédio ("veio um modal, depois outro modal do mapa"). **(3) Nada protegia a fila de um item que falha:** erro de render ou chunk lazy que não carrega deixava o esqueleto/véu na frente de tudo.
- **Decisão 1 — UMA fila central** (`utils/presentationQueue.ts` + `hooks/usePresentationQueue.ts` + `components/PresentationSlot.tsx`; substitui a cadeia, sem sistema paralelo): ordem explícita **tour → triagem → level-up → resumo do dia → intro de NPC/mapa → escolha de metas → compromisso do dia → "crie mais atividades" → avisos leves (Bosque, sonho, pesadelo, convite de nível, sono) → ocioso**; UM item por vez; **quem está na tela não é expulso** por um mais prioritário que chega depois; o voltar do Android fecha o item da tela e a fila avança; item que lança no render, chunk que não carrega em 8 s ou fechamento que lança é pulado até a próxima abertura.
- **Decisão 2 — "visto" AO MOSTRAR**, não ao fechar (prédios, resumo do dia, level-up). Evento que não chegou à tela fica pendente e volta uma única vez. Rituais que pedem RESPOSTA (escolha de metas, compromisso) seguem pendentes até a resposta. **Sem campo novo no save** (o contador do `fuzz2` não mudou).
- **Decisão 3 — level-up antes do resumo do dia** (antes o level-up era o 7º): o dono listou "alertas críticos > level-up > resumo do dia agrupado > intro de NPC/mapa > metas/compromisso > avisos leves". **Reverte** a posição declarada em `filaDeAvisos.contract.test.ts` ("level-up depois do marco do Bosque, antes do sonho").
- **Decisão 4 — intro de NPC em tela cheia** (`NpcSequence`, componente genérico; `BuildingIntro` o usa): NPC grande, janela de texto embaixo, SEM "Próximo/Ir lá/Depois", toque avança, na última fala o toque fecha, "Pular/Skip" discreto no canto superior esquerdo encerra a sequência inteira (≥ 44 px, safe-area, Enter/Espaço avançam, Esc e voltar pulam). **Complemento do dono (mesmo dia):** "ficou muita coisa de uma vez do negócio da cidade/prédios" — prédio desbloqueado NÃO abre mais modal: vira um **balãozinho** não bloqueante ("Soulsmith desbloqueado em Mercado", vários do mesmo level-up num só; item leve `unlockToast` da fila, nunca sticky), e a intro com o NPC grande dispara **só na PRIMEIRA entrada no prédio** (flag `buildingIntrosSeen` já existente; save antigo semeado, sem campo novo), nunca no level-up nem ao abrir o Mapa; o tutorial do mapa da outra sessão segue só na primeira abertura do mapa. **Reverte** a folha de baixo do beta-2 7.1 para a apresentação de prédio e o "Ir lá" (a ida ao prédio sai: a intro só apresenta; o prédio continua no Mapa).
- **Decisão 5 — resumo do dia:** "como foi o dia anterior" + corações = UM modal **CENTRALIZADO** (`ModalSheet placement="center"`); a aventura ("From Yesterday's Adventure", com o NPC do scroll) e "hoje" seguem como passos próprios da mesma fila; a escolha de metas ("Add tasks to list") também é centralizada. **Reverte** o 4.4 do beta-2 ("modais de resumo separados por seção, bottom sheet padrão") só no que toca tarefas+corações e na forma (central, não folha). A animação do coração segue UMA vez (`lastDayReport.heartsAnimSeen`).
- **Alternativa que perdeu:** marcar "visto" ao fechar mas guardar o progresso da sequência no save (campo novo + migração + fuzz2): mais código para o mesmo resultado, e o dono pediu o contrário ("o que já foi mostrado não reaparece").
- **Custo aceito:** app encerrado no instante em que o item entrou na tela perde aquele item (o resumo continua consultável na Evolução; o prédio no Mapa). 
- **Gatilho para rever:** testador reclamar que "perdeu" um resumo/intro por ter fechado o app cedo (voltar a marcar ao fechar só para os que têm progresso), ou um novo modal da Home nascer fora da fila (o `filaDeAvisos.contract.test.ts` e a §4 de `FILA-DE-MODAIS.md` pegam).
- **Depende do dono:** (1) o resumo "hoje" (humor/convite/memórias) continua um passo separado do "ontem" — agrupar também? (2) a ida direta ao prédio saiu da intro; (3) a ordem do `evolveTask` (depois do compromisso do dia) é minha.

## 43. Placa da masmorra sem deformar, timer de energia só na dica e Zs do sono dentro do visor (dono, por voz, 14/10/2026)

- **Decisão (placa):** a placa "In Dungeon" "ficou deformada, meio cortada e com o texto enorme": sai o ícone da portinha e fica só a plaquinha. A arte (recorte de `key-sign-2.png`, 60×35, quantizada) vai na tela em **escala inteira 2×** (`<img>`, `image-rendering: pixelated`), caixa fixa 120×70, texto xs centrado na área lisa. Substitui o `border-image` 9-slice do §40.
- **Decisão (timer):** "o timer da comida/energia deixa só quando tocar na energia, no raiozinho, e mostra em tempo real, horas, minutos e segundos. Se tiver hora, mostra hora." Nada de timer fixo na faixa de status: tocar no raio abre a dica da energia com a contagem regressiva ao vivo (1 s), `H:MM:SS` com hora e `M:SS` sem; faminto mostra "pausada". Acessibilidade: `aria-live="polite"` só no rótulo, o número que muda é `aria-hidden`. Muda o §40 (3.4: timer discreto ao lado da energia) e o nome acessível do botão da energia (não leva mais o tempo).
- **Correção (Zs):** o Z do sono, ancorado acima da cabeça, saía da tela depois do zoom da cena. Agora fica ao lado da cabeça e nunca acima do topo visível (`utils/sleepZ.ts`, com teste).
- **Testes alterados:** `energiaFome.render.test.tsx` — o teste "nome acessível do botão leva o estado do timer" foi removido e o do timer na faixa trocado por "nada na faixa / dica com contagem / faminto pausada", porque o contrato mudou. O slot `statsSlots.energyTimer` do HUD continua existindo (contrato de encaixe), mas o app não o usa.
- **Fome em níveis (complemento, mesmo dia):** o indicador de fome mostra o nível N de 3 (bem alimentado 3, mediano 2, faminto 1) em marcas cheias/contorno. Tocar nele abre a dica da fome: contagem ao vivo (`H:MM:SS`/`M:SS`) até cair de nível (`msToHungerDrop` de `energyStatus`; faminto = sem contagem) e o impacto (a fome define a velocidade da energia: 3 normal, 2 metade, 1 parada). A penalidade por fome NÃO está nesta decisão (outra frente).

## 47. Template de prompt v-pet e GPT Image 2 LOW (dono, 14/10/2026)

> **REVOGADO em parte pelo §48:** fundo transparente e `SPRITE_GPT_IMAGE_ROUTE` saem; template segue, com cláusula de fundo verde.

- **Decisão:** novo template `v-pet` (baseado nos exemplos do estilo antigo do dono) vira padrão; o anterior fica como `composeSpritePromptLegacy` (`VITE_SPRITE_PROMPT_STYLE=legacy`). Texto de ambos em `docs/PROMPT-SPRITE-ESTILOS.md`. Mantidas: cláusula `Do not copy any existing franchise character`, direção RIGHT, fundo transparente explícito, duas variantes (principal com franquias, reserva sem marcas), uma geração por forma. O veto de matiz única (`hueGuard`) saiu por não constar nos exemplos (reativável).
- **Modelo:** GPT Image 2 (`gpt_image_2`) qualidade **low** (0,5 crédito) substitui o "medium"/flare do §41/§43 (`SPRITE_MODEL`, `SPRITE_QUALITY`). A rota REST de `gpt_image_2` não consta na documentação pública; configurar `SPRITE_GPT_IMAGE_ROUTE`. Sem ela cai em flare/Soul/Gemini.
- **Risco de IP (aceito pelo dono):** citar marcas no prompt principal; a cláusula anti-cópia e a reserva sem marcas continuam.
- **Teste real:** CLI gerou 3 sprites (E:\soulmon-sprites-teste-pet\); saída veio RGB opaco com fundo branco, sem alfa (ver relatório).



## 48. Sprites por API: fundo VERDE #00FF00 + chroma-key no servidor; modelo 2.0 Alpha (dono, 14/10/2026)

- **Decisão:** a API REST pública do Higgsfield (`POST https://api.higgsfield.ai/marketing-studio/image` = "2.0 Alpha" e `/marketing-studio/image/flare` = "2.5 Flare"; `Authorization: Key keyId:keySecret`; resposta `{request_id, status_url}`, polling até `completed` com `images[0].url`) **NÃO gera transparência**. O dono escolheu **fundo verde chroma `#00FF00` pedido no prompt + chroma-key no servidor**.
- **Revoga**, só para a geração de sprite de Soulmon por API, o "fundo transparente, sem chroma" do **§43** e do **§47** (e a rota `SPRITE_GPT_IMAGE_ROUTE`/`gpt_image_2` do §47, que nunca existiu na doc pública). Ícones/UI do arte-gerador seguem como estavam.
- **Motivo (evidência, 14/10/2026):** 6 chamadas reais à API (`E:\soulmon-sprites-teste-pet\`): `background: transparent`, `remove_bg` e "transparent background" no prompt foram **ignorados** em todas — PNG RGB, fundo branco. Só a CLI (login OAuth) gera alfa real, inviável em produção. Com fundo verde pedido no prompt, `flare-verde-verde.png` e `alpha-verde-verde.png` saíram com verde chapado e o chroma-key resolveu.
- **Prompt (v-pet e legacy, variante principal e reserva):** `..., 16x16 pixel art, isolated subject, on a solid flat pure #00FF00 chroma-green background (uniform, no gradient, no shadow), the creature itself contains no green and no green fringe:`. Resto intacto (direção direita, anti-cópia, marcas só no principal).
- **Servidor** (`functions/api/_chroma.js` + `_png.js`, JS puro sobre `fflate`, sem Node nativo): depois de baixar a imagem, `d = g - max(r,b)`; fundo = `g>150 && d>60`; borda suave `d` 35..60 e alfa **binário** (`>128`); despill (onde `d>0`, `g := max(r,b)`); ilhas `<24 px` (4-conexo) removidas; recorte pela bounding box, canvas quadrado, margem 4% (mín. 2 px), sem reescala; PNG RGBA vai para o armazenamento de sempre (`republicar`). Equivalente validado do `key()` de `post.py`.
- **`bad-chroma`:** erro (sem regerar em magenta, sem inventar) quando só sobra `<10%` de fundo removido (a imagem não veio verde) ou quando `>25%` do sprite é verde "furado" não ligado à borda (criatura verde) ou nada sobra. Segue o caminho de falha existente: Soul (se `HF_API_KEY`/`HF_SECRET`) -> Gemini (se ligado) -> erro 500 com a unidade de cota devolvida.
- **Modelo e rota:** `SPRITE_MODEL` padrão **`alpha`** (2.0 Alpha, qualidade `low`); `flare` opcional por var; `soul` força o Soul. `SPRITE_QUALITY` low|medium|high (flare: +xhigh, max). Corpo `{prompt, quality, resolution:'1k', aspect_ratio:'1:1', moderation:'auto', enhance_prompt:false, image_urls?}` — **sem `background`** (a API ignora). `Idempotency-Key` (UUID) em cada POST. Credencial `HF_CREDENTIALS = keyId:keySecret` (secret do Worker, cadastro do dono); ausente, o fluxo anterior (Soul/Gemini) segue. Soul/Gemini, que agora também recebem o prompt verde, passam por chroma-key "se der" (falha mantém a imagem original).
- **Gatilho de revisão:** taxa de `bad-chroma` > 5% das gerações (criaturas verdes) -> pedir fundo de outra cor para a forma ou aceitar limpeza manual.


## 46. Cota do modo grátis só conta hábito diário; prazo e assombrada voltam à linha do Hoje (dono, modal, 14/10/2026)

- **Cota:** tarefa AGENDADA (`Activity` com `schedule` em dias específicos) NÃO gasta a cota de hábitos do modo grátis (resolve a pendência do §44); só o hábito diário conta (`activityBucket === 'habit'`). Fonte única: `consomeCotaDeHabito`/`contaCotaDeHabitos` em `utils/atividadesLista.ts`, usada por `fitHabitCreates`, pelo portão de tarefa, por `atCapForDemo` e pelas contagens do `CreateModal` e do tutorial. O `CreateModal` só bloqueia o Salvar quando o tipo é Hábito; a mensagem do teto diz que tarefas (pontuais ou em dias específicos) seguem sem limite. Save antigo: uma atividade agendada que já existia deixa de ocupar vaga (só libera, nunca tira).
- **Linha do Hoje:** voltam, numa linha secundária pequena abaixo do nome (`RitualRow.below` + `TaskMeta lean`), o PRAZO da tarefa e o convite da assombrada. Continuam FORA: subtítulo, barra, XP, adiamentos, categoria e esforço. Some quando a tarefa está feita.
- **Confirmado sem mudança:** hábito com etapas paga XP por etapa (10%, teto 5); swipe do View all só esquerda abre, direita volta.
## 45. Penalidade de fome, dia completo só por tarefas e controles da masmorra (pedido do dono por voz, 14/10/2026)

*Numeração:* §42, §43 e §44 já são de outras frentes do mesmo dia; esta usa **§45**.

**A. Penalidade de fome (decisão do dono: 12 h, meio coração).** Enquanto o Soulmon está **faminto** (tier `starving`, fome < 20), perde **0,5 coração a cada 12 h CONTÍNUAS** de fome; comer (sair do faminto) zera a contagem. Dono único: `src/utils/hungerPenalty.ts` (puro, `now` por parâmetro), rodando no MESMO tick da energia (`App.tsx`, 15 s e ao voltar ao foco).
 - *Timestamps persistidos, nunca timer de tela:* a âncora é `starvingSince(hunger)` (o instante em que o registro `hunger {v, at}` cruzou 20). Comer troca o registro e, com ele, a âncora — não há "zerar" a escrever.
 - *Sem punição dupla:* `hungerPenalty {since, paid, unreported}` no save. `paid` = janelas dessa fome já resolvidas; reabrir/recarregar/trocar de aparelho lê o mesmo `paid`. No máx. 1 perda por janela de 12 h.
 - *Offline com teto:* no máx. **2 perdas por retorno** (1 coração); as janelas além do teto são **perdoadas** (`paid` avança até o total), não adiadas.
 - *Mínimo (revisto pelo dono, 14/10/2026):* a fome **PODE zerar a vida**, com o MESMO mínimo do dreno de cocô (`poopDrain.ts`): piso de 1 coração só na RAIZ da árvore (rookie); nos demais estágios o HP chega a 0, e HP 0 tem a consequência de sempre (degeneração na virada do dia) — nenhuma regra nova. Antes desta revisão o piso era 1 em todo estágio. Com o HP no mínimo nada é cobrado e as janelas contam como pagas (nada retroativo se o HP subir).
 - *Save:* HP já aceitava frações de 0,5 (CLAUDE.md, Corações; HUD escreve "2,5/3"), então não há migração de modelo. Campo novo opcional `hungerPenalty` (sem subir `SAVE_SCHEMA_VERSION`; save antigo = nada cobrado; `sanitizeHungerPenalty` no hydrate). `fuzz2` 128 → 129 campos.
 - *Resumo do dia:* `lastDayReport.hungerHeartsLost` (o que a fome tirou desde o resumo anterior; a virada lê e zera `unreported`) → a fileira de corações conta meio coração como um quebrado (regra existente de `heartStrip`) e a folha dos corações ganha uma nota. *Texto:* "Ele ficou muito tempo com fome e perdeu meio coração. Comer ajuda a recuperar." / toast ao acontecer, na mesma voz. Sem cobrança, sem culpa.
 - *Relação com o §40.1/§28:* a objeção "fome como cobrança" foi levantada pelo dono: o §40 dizia "fome nunca tira coração"; **esta decisão reverte essa frase, só nesta parte** (e só com 12 h contínuas de faminto). Bits, XP e bloqueios seguem intocados.
 - *Não aplicado de propósito:* as carências de save novo/ausência da virada. O pedido fixou o teto "2 perdas por retorno", que já cumpre o papel do perdão por ausência.

**B. Dia completo × comida.** Investigado (`completeDayReached`, `dailyReset.ts`): o dia completo já depende **só de tarefas** (peso de esforço feito ≥ meta do dia e ≥1 cadastrada); a energia saiu em 11/10/2026 e comida nunca entrou nessa conta. Único resíduo: a nota do resumo "encher a energia também fecha o dia completo", que contradizia a regra — **removida**. `lastDayReport.energyWasFull` continua gravado (informativo, sem consumidor de regra).

**C. Masmorra.** (1) Velocidades **1× e 3×** (`DUNGEON_SPEEDS = [1, 3]`); quem tinha **2× salvo migra para 3×** (`sanitizeDungeonSpeed`). O motor (`useGroupBattle`) continua aceitando qualquer fator: o teste de resultado idêntico segue cobrindo 1×/2×/3× como prova do núcleo. Nenhum balanceamento mexido. (2) No lugar do X da cena, o **ícone do mapa** (`PixelIcon name="mapa"`, o mesmo de `AreaTopBar`, sem o anel), alvo 44×44, `aria-label` PT/EN; tocar vai **direto ao mapa, sem confirmação** (`onExitToMap` → `AreaView.onGoToMap` → `goTo('map')`). **Sair ≠ abandonar:** o registro `dungeonAway` não é tocado. O voltar do Android na masmorra faz o mesmo (a masmorra registra a própria camada de voltar). *Consequência declarada:* a 3ª saída "Retirar da masmorra" saía do diálogo do X, que não existe mais; ela segue na plaquinha da Home e no cartão "Enquanto você esteve fora". O X do lobby (antes de descer) não mudou.
- **Decidido pelo dono (14/10/2026):** (1) a fome pode zerar a vida como o dreno de cocô; (2) a penalidade segue contando com o Soulmon na masmorra; (3) "Retirar da masmorra" não precisa voltar à cena.
- **Gatilho para rever:** reclamação de "perdi coração dormindo/ausente" (aplicar as carências da virada) ou de dificuldade em retirar o Soulmon.

## 49. Compra credita sozinha, "Restaurar compras" que não devolve gasto, exclusão = pagar de novo e Sair vai para a entrada (dono, 14/10/2026)

*Pedido do dono (voz):* (1) ao sair da conta, ir para a HOME/entrada do app; (2) o botão "Restaurar compras" — que ele não entendia e temia que devolvesse saldo já gasto — passa por auditoria; a compra deve creditar sozinha; (3) quem exclui a conta e cria outra paga de novo. *Depois de entender a função o dono mandou MANTER o botão* (texto claro PT/EN).

**Auditoria do botão (linguagem simples).** Ele pergunta à Google Play "o que esta conta Google tem pendente?" (`getPurchases`) e manda cada comprovante ao servidor (`POST /api/billing?action=verify`), que pergunta de novo à Google. Para o **desbloqueio completo** (compra única, fica no histórico da Google) reconhece o direito se ele ainda não estava nesta conta. **Pacote de Créditos**: depois de entregue o app o "consome" e a Play deixa de listá-lo; o botão só enxerga pacote que foi pago mas cuja entrega foi interrompida — e aí credita UMA vez. Não re-concede saldo gasto: o servidor guarda o id de cada pedido já creditado (`consumedOrders`) e responde `duplicate` sem somar nada. `order_claims` (D1; `ord:<id>` no KV) amarra cada pedido a UMA conta (PRIMARY KEY): a 2ª conta recebe 409 `order-in-use`; além disso a Google devolve de quem é a compra (`obfuscatedExternalAccountId`).

**Furos fechados.** (a) servidor: consumível que a Play já marcou **consumido** e que NÃO está no histórico da conta é recusado (`already-consumed`, 409) — cobre o histórico podado (teto de 200) e comprovante velho reapresentado; (b) cliente: reconciliação e compra manual nunca correm juntas (verify duplo do mesmo pedido); (c) exclusão: ver abaixo.

**Crédito automático.** `playBilling.reconcilePurchases()` roda ao abrir o app (com `saveId`) e ao voltar ao primeiro plano (`App.tsx`, junto da sincronização do entitlement): pega compra paga e interrompida (app fechado, rede, pagamento pendente que aprovou), verifica no servidor, consome/reconhece (ordem: servidor primeiro, Play depois — regra do `01-seguranca` §8) e atualiza `credits`/`accountTier`. Assinatura segue com `reconcileSubscription` + RTDN (§33 mantido: reembolso mantém o já resgatado).

**Exclusão de conta = pagar de novo (REGRA DO DONO).** `account.js` passo 5c: o vínculo comprovante→conta (`order_claims`/`ord:`) passa a apontar para a sentinela `deleted` (não é `saveId` válido): continua travando por 5 anos, sem dado pessoal. O entitlement minimizado perde tier, saldo, `orderDetails` (e `purchaseToken`); a **cortesia do dono** (não é compra) e os contadores antiabuso de sprite permanecem. **Muda** a nota anterior de `account.js`/`PLAY-DATA-SAFETY.md`/texto de exportação ("volte com o mesmo e-mail e restaure"), que era "⚠️ endereçada ao dono, não decidida"; não havia decisão do REGISTRO em contrário. Licença Steam segue §#54 (apagada, fica livre). Impacto LGPD/Data Safety atualizado em `docs/PLAY-DATA-SAFETY.md`: menos dado retido (some o hash do e-mail do vínculo). Se a exclusão falhar em anonimizar um pedido, o id fica no entitlement para o retry reencontrar.

**Sair.** `sessionReset.irParaEntradaDoApp()`: troca a entrada do `history` por Home (sem `?query`/`#hash`) e recarrega; sem save nem sessão o app abre no portão de login (web/PWA e WebView do Android). A limpeza de estado é a do `fix/logout-limpa-estado`.

**Gatilho de rever:** relato de quem pagou, excluiu a conta por engano e quer o direito de volta (hoje: só pelo suporte/Play, nada automático).

## 52. Missões numa folha só com abas, mais missões diárias dos outros recursos e fim do ícone de "login diário" (dono, por voz, 14/10/2026)

- **Pedido (3 itens):** (1) "o ícone Material do daily login continua lá perto das exclamações das missões"; (2) "inclua mais missões diárias para incentivar o usuário a usar os outros recursos, como minijogos, pomodoro..."; (3) "coloque tudo dentro do mesmo ícone de missão com tab para dailies, semanal, achievements".
- **1. Ícone de login diário:** o ícone Material vizinho do "!" era o botão de **Avisos** (glifo `event_note`, um calendário com nota, que lê como "check-in diário"). Os check-ins em si já saem pela flag `CHECKINS_ENABLED=false` (§40.4-b, PR #338: sem janela disponível, o atalho "Check-ins do dia" nem entra nos Avisos). Aqui o glifo do Avisos passou a `info` (do inventário da fonte, sem mexer nela), então **não há mais nenhum ícone de calendário/login diário na pilha de cantos**. Nenhum código de check-in foi apagado. O botão de Avisos segue existindo (HP, incubação, triagem, convites...).
- **3. Folha única com abas:** o ícone de missões ("!"/"?") é **um só** e abre a `MissionsSheet` com `PixelTabs variant="compact"` (o componente do Centro de Evolução, backlog 10.3): **Diárias | Semanal | Conquistas**, sublinhado fino na ativa, rótulo inteiro, toque e deslize. Saíram o segundo ícone da Home (semanal) e o `kind` daily/weekly da folha; Conquistas deixaram de ser parte da folha "semanal". Conteúdo, estados, progresso e recompensas das listas existentes ficam idênticos (mesmos componentes). Abas visitadas ficam montadas (`hidden`): trocar de aba não perde estado. O ícone **fica sempre** (porta das Conquistas e das semanais), esmaecido sem pendência; a pendência aparece como ponto discreto na aba. Mantidos, por não serem "atalho na Home/menu": o prédio Conquistas do Mercado e a lista semanal do Torneio.
- **2. Missões diárias novas (`utils/dailyMissions.ts`):** 15 convites; 3 por dia, sorteados de forma determinística pelo dia do jogador (seed `daily-missions:<dia>`), somente entre os que o Vínculo já abriu (`buildingGateFor`, a tabela única), no meio das linhas que já existiam (Passeio, Caderno). Eventos já emitidos pelo jogo, nada de rastreio novo: Corrida com obstáculos, Pedra-papel-tesoura (partida terminada, vença ou perca), Combina 3, ciclo de foco/Pomodoro (Oficina), andar limpo da Masmorra, banho, carinho, brincar, comida, humor do dia (1ª resposta), descanso, passada pelo Mercado, visita a amigo, Duelo, Torneio. Alvo 1 em todas. **1 recompensa por missão por dia** (`claimed`), contagem por evento real, reabrir não duplica (resgate idempotente sobre o `prev`). Não cobra: sem sequência, perda, contagem regressiva ou número no ícone; texto em tom de convite.
- **Proposta de recompensa (PARA O DONO REVISAR):** nenhuma moeda nova; cada missão paga **1 material** (`MATERIAL_PER_QUEST`), o mesmo que a missão do Caderno já paga, respeitando `MATERIAL_CAP` (99). Material do prédio da missão (Salão → centelha, Oficina → engrenagem, Masmorra → minério, Mercado → laço, Amigos → lembrança, Duelo → presa, Torneio → louro) e **musgo** (Refúgio) para o cuidado. Sem XP, Créditos, Bits ou Emblemas. **Soma máxima por dia: 3 materiais em qualquer faixa** (Vínculo 1: 3; do Vínculo 2 em diante soma-se o 1 do Caderno, total 4). O teto é a contagem (`DAILY_MISSION_COUNT`), não a faixa; abrir mais prédios só amplia o menu de onde sai o sorteio. Contra o orçamento anterior (1 material/dia, só do Caderno) isto **triplica a entrada de materiais**; se o dono achar demais, reduzir `DAILY_MISSION_COUNT` para 2 ou pagar 1 material a cada 2 missões é só trocar a constante/`claimDaily`.
- **Anti-abuso e limites honestos:** o estado `dailyMissions` mora no save e é conferido no cliente, como as semanais (o servidor não o espelha; ver pergunta ao dono). A lista do dia só muda no meio do dia se o Vínculo abrir um prédio sorteado antes das que já estão lá.
- **Régua viva:** `utils/dailyMissions.test.ts` (catálogo, rotação, bloqueios, condição, 1 recompensa/dia, teto de estoque), `utils/dailyMissions.fiacao.test.ts` (todo evento tem emissor), `components/nav/dailyMissionList.render.test.tsx`, `components/nav/missionsMenu.render.test.tsx` (reescrito: o teste antigo de "Weekly" e PT-BR assumia dois acessos com `kind`, já falhava na main).
- **Gatilho para rever:** o dono achar o volume de materiais alto, querer espelho no servidor, ou redesenhar os check-ins (religar a flag e rever o glifo do Avisos).

## 50. Loading minimalista: uma barra fina turquesa que enche (pedido do dono por voz, 14/10/2026)

*Pedido do dono (voz):* "Troca o asset de loading. Faz uma barra azul turquesa fina sendo preenchida." Fecha o item 9.4 do backlog do beta-2.

- **Decisão:** o indicador de carregando do app passa a ser UMA barra de 3px, turquesa (token `--sm2-primary-fill`; no visor/splash, `--sm2-primary-ink`; nenhuma cor nova), que enche da esquerda para a direita. Sem texto, sem spinner, sem ilustração. Glow só um `box-shadow` discreto na ponta; trilho a 12% da própria cor.
- **Um só componente:** `src/components/ui/LoadingBar.tsx` (`progress` 0-1 = real; sem `progress` = simulado assintótico, teto 94%; `done` completa a 100% e some em fade de 220ms; `role=progressbar`, `aria-valuenow` só quando determinado, `aria-busy`, rótulo Carregando/Loading só para leitor de tela). `ScreenSkeleton` (fallback de `lazy()`) agora só enquadra (page/overlay/inline) e mantém o estado `error`; o `loading` é a `LoadingBar`.
- **Splash do `index.html`:** só o fundo do visor + a mesma `.sm2-loadbar` (CSS puro, preenchimento 4% a 92% em 14s com desaceleração; `main.tsx` a completa e some em fade). Saíram a chama, o wordmark, os textos "LOADING DATA..."/"SOUL_LINK ESTABLISHED", a barra de 8 segmentos e os cristais (CSS `.sm2-splash-bar/crystal/flame/title/link` apagado; `brandFlame.parity.test.ts` virou "splash sem ilustração"). A `BrandFlame` do portão continua.
- **Movimento reduzido:** preenchimento em passos de 20% (até 80%), sem transição e sem brilho.
- **Assets apagados (sem importador):** `src/assets/brand/final/loading.mp4` e `loading-thumb.webp`.
- **Fora desta decisão (reportado):** a tela de intro (`intro.mp4`/`intro-poster.webp`, "TAP TO START") traz "LOADING DATA..." DENTRO da arte; e o splash nativo do Android (`android/.../drawable/splash.png`) é imagem nativa. Trocar os dois exige arte nova / mudança nativa.
- **Gatilho de rever:** relato de que a barra simulada "parece travada" em rede muito lenta (hoje para em 94% / 92% na splash até o conteúdo chegar).

## 51. Masmorra livre desde o Vínculo 1, tutorial do mapa na 1ª abertura do Mapa e ícones de canto sem círculo (pedido do dono por voz, 14/10/2026)

- **Decisão (voz):** "Dungeon tem que estar livre desde o dia 1, desde level 1, que ela é a atividade mais de gacha/idle game que temos." / "No tutorial de introdução, tira a parte do mapa e dos prédios, e quando a pessoa entrar no mapa pela primeira vez é que carrega o tutorial do mapa, falando o que é cada prédio." / "Tira o círculo em volta da casinha e do mapinha; eu tinha pedido, mas acho que fica mais legal sem."
- **Como ficou:** (1) `BUILDING_GATES['exploracao.masmorra']` = Vínculo **1** (era 2), em `src/utils/gates.ts` e no espelho `functions/api/_gates.js` (paridade travada); o prédio entra em `BUILDINGS_ALWAYS_OPEN`. **Nada mais mudou na Masmorra:** energia (1 por camada), limite diário (`DUNGEON_DAILY_LAYERS`, no servidor), portão dos andares altos (`masmorraAlto`, Vínculo 8), HP, ocupação do Soulmon e as restrições de invocação seguem como estavam. (2) O tour de boas-vindas ficou com 6 cartões (o básico + os cantos da Home); a Parte 2 (mapa e prédios) virou `MAP_TOUR_STEPS` (`utils/welcomeTour.ts`): um cartão de abertura + um por área, uma linha por prédio (os 22), EN e PT-BR, no MESMO componente `WelcomeTour` e no MESMO ponto da fila (`welcomeTour`). Abre quando o Mapa está na tela e `mapTutorialSeen` (campo novo **no save**) é `false`; visto OU pulado grava `true`. (3) `CornerLink` perdeu o anel (`ring`): casinha e ícone do Mapa ficam pelados, com o brilho (`CORNER_GLOW`) e o mesmo alvo de toque de 56 px; o anel do voltar das áreas e dos avisos continua.
- **Save existente:** `sanitizeMapTutorialSeen` — campo ausente + save com progresso (atividade, tarefa, conclusão, dia completo) OU tour de boas-vindas já visto neste aparelho → `true` (ninguém é interrompido); save vazio → `false`. O erro seguro é não apresentar de novo. Save que estava no Vínculo 1 com `buildingIntrosSeen` já gravado passa a ver UMA apresentação do NPC da Masmorra (ela acabou de abrir para ele); saves novos nascem semeados com a Masmorra já "vista".
- **Alternativas que perderam:** manter a Masmorra no Vínculo 2 com um aviso (o dono quer o gacha/idle no dia 1); abrir o tutorial do mapa também no replay de Configurações (o replay segue só no básico); flag do tutorial do mapa em `localStorage` (a regra é do jogador, não do aparelho — mesmo motivo dos tetos de cuidado, §8 do CLAUDE.md).
- **Gatilho para rever:** quem entra na Masmorra no dia 1 e abandona o app antes do 1º dia completo (aprofundar a descida cedo demais pode competir com o hábito de tarefas) — a leitura é a telemetria D1, que só existe com usuários.
- **Régua viva:** `src/utils/gates.test.ts`, `src/components/WelcomeTour.render.test.tsx`, `src/components/nav/nav.render.test.tsx`, `functions/api/gates.parity.test.js`.

## 54. Até 6 diárias, "Primeiras vezes", espelho no servidor e Avisos oculto (dono, modal, 14/10/2026)

- **Respostas do dono à PR #343:** (1) volume: até **6** missões diárias por dia, mais **missões únicas**; (2) espelhar `dailyMissions` no servidor; (3) ocultar o botão **Avisos**; (4) manter a lista semanal do Torneio e o prédio Conquistas do Mercado.
- **Diárias, até 6:** `DAILY_MISSION_COUNT = 6` (`utils/dailyMissions.ts`). O corte vem DEPOIS do filtro de portão, então quem tem menos recursos abertos recebe menos que 6; o Vínculo 1 já tem 11 elegíveis (Salão ×3, Masmorra, 6 de cuidado/humor/descanso e Mercado), então enche as 6. Recompensa inalterada: 1 material por missão, `MATERIAL_CAP` 99, sem moeda nova. **Teto novo: 6 materiais/dia** (mais o 1 do Caderno a partir do Vínculo 2 = 7). Isto é **6× a entrada de materiais de antes das diárias** (1/dia) e o dobro da proposta do §52. **Gatilho de revisão:** o estoque de materiais de jogadores ativos chegar ao teto 99 com frequência, ou os upgrades do Soulsmith ficarem baratos demais; o botão é `DAILY_MISSION_COUNT` (e, mais fino, pagar a cada 2 resgates).
- **Primeiras vezes (missões únicas, 1× na vida):** seção "Primeiras vezes" dentro da aba **Diárias** (a aba Conquistas é de metas permanentes que liberam compra; estas são convites de estreia). Catálogo: uma visita por prédio do mapa (menos o Perfil do Soulmon) + primeiro minijogo, primeiro ciclo de foco, primeiro passeio concluído e primeiro andar da Masmorra. Paga 1 material uma vez (o do prédio; Mercado paga musgo), idempotente. Só lista o que o Vínculo já abriu; a marca do ícone acende só "?" (pronta), nunca "!". **Sem retroativo pago:** o save de quem já jogava (XP > 0) é semeado com tudo que o Vínculo abre hoje como cumprido **e** resgatado, sem pagar; prédios abertos depois contam como novos. Fonte do cumprimento: `visitarPredio` (visita), `contarDiaria` (minijogo, foco, masmorra) e o resgate do passeio. Reutiliza `buildingGateFor`, `nameOf`-style rótulos do Mapa, `MissionMark`, o botão Resgatar.
- **Servidor:** `functions/api/_dailyMissions.js` sanitiza `dailyMissions` e `firstTimes` em `save.js` (listas fechadas, contagem 0..99, sem repetição), travado por `dailyMissions.parity.test.js`. O servidor garante a forma e o teto, não a procedência (como `buildingQuests`).
- **Avisos oculto:** `AVISOS_LINK_ENABLED = false` em `AvisosLink.tsx`; o botão some da pilha de cantos, o código e a folha ficam. Os avisos (`hp`, `incubacao`, `semanal`, `triagem`, `priming`, `recomeco`, `refeicao`, `checkin`, `carga`, `marcoBosque`, `termos`, `refugio`) deixam de ter canal único: ver as dúvidas ao dono nesta frente.
- **Conquistas:** inalterado. Cumprir a conquista já libera o item para compra (não existe botão de resgate nesta aba nem nunca existiu); a compra é no Mercado, prédio Conquistas. A aba ganhou uma linha dizendo isso.
- **Régua viva:** `dailyMissions.test.ts`, `dailyMissions.fiacao.test.ts`, `dailyMissions.parity.test.js`, `dailyMissionList.render.test.tsx`, `avisos.render.test.tsx` (reescrito: o botão oculto).

## 53. Compromisso da manhã volta, com interruptor próprio; os 3 check-ins seguem ocultos (dono, modal, 14/10/2026)

- **Decisão (modal):** o ritual matinal de foco do dia (`MorningCheckIn`: escolher até 3 tarefas/compromisso) estava desligado junto com os 3 check-ins de janela pela mesma `CHECKINS_ENABLED=false` (§40.4-b, nota da PR #338 — "depende do dono"). O dono quer **só o compromisso de volta**, e os 3 check-ins diários (manhã/tarde/noite, atalho "Check-ins do dia") **ocultos**.
- **Como ficou:** nova `MORNING_COMMITMENT_ENABLED = true` no mesmo lugar canônico (`src/utils/checkIns.ts`). O item `checkIn` da fila de apresentação e o effect que monta o plano (`src/App.tsx`) dependem **só** dela. `CHECKINS_ENABLED` segue `false` e continua escondendo atalho, folha, recompensa e notificação dos 3 check-ins. Sem espaço reservado na Home para eles (o atalho só entra nos Avisos quando há janela).
- **Uma vez por dia:** a fila já oferece o item uma só vez, na ordem definida (depois do relatório diário), centralizado como os demais modais (`RitualDialog`). Novo: o "visto" (`lastCheckInDate`) é gravado **ao mostrar** (`onShow`), como os outros itens da fila — recarregar no meio não reabre nem repaga o XP de Vínculo do confirmar.
- **Independência:** o compromisso não lê `checkIns` do save nem `checkIns.ts` além da flag; usa `rituals.ts` (`needsCheckIn`/`completeCheckIn`). Sem campo novo no save, `fuzz2` inalterado.
- **Alternativas que perderam:** religar `CHECKINS_ENABLED` (traria os 3 check-ins); gravar o visto só no confirmar/pular (reabria após recarga).
- **Gatilho para rever:** o dono decidir religar ou apagar os 3 check-ins de janela.
- **Régua viva:** `src/components/filaDeAvisos.contract.test.ts`, `src/utils/checkIns.test.ts`.

## 55. CI do main de volta ao verde após as PRs #326–#343 (conserto técnico, sem decisão de produto, 14/10/2026)

- **Causa:** PRs em sequência deixaram o main vermelho por 6 motivos independentes. (1) `tsc -p tsconfig.server.json`: `consumed` (PR #341) não estava no `@returns` de `verifyPlayPurchase` — o objeto agora é montado sem mudar o valor retornado e `billing.js` lê o campo com cast JSDoc (os outros verificadores — Steam etc. — não o têm). (2) `DailyRituals`: o código está certo (PR #334/§45 pôs `TaskMeta lean` na linha do Hoje: prazo + convite da assombrada, SEM contador de adiamentos), os TESTES `homePolimento` e `TaskMeta.render` estavam desatualizados e foram ajustados à decisão; o `Icon size={16}` do "Ver tudo" caiu fora da escala §6.1 e virou 20 (degrau inline). (3) `docsManual (c)`: `dailyMissions.ts` e `DailyMissionList.tsx` (§52) sem entrada em `06-REFERENCIA/` — entradas escritas. (4) CSP: o hash do `<script>` inline do `index.html` mudou (barra de loading, §50) e `public/_headers` ficou com o hash velho (em produção o script seria bloqueado) — hash trocado nas 2 linhas. (5) `dist/` rastreado incoerente — `npm run build` e commit do `dist/`.
- **Orçamento de bytes:** limite de `index.js` re-medido 681_986 → **693_587** (+11,6 KB), soma das frentes do beta-2; justificativa no próprio teste. Gatilho: corte real (já listado como tarefa própria).

## 57. Missão N/G no Hoje e a fala do Soulmon num balão de verdade (pedido do dono por voz, 14/10/2026)

- **Missão N/G:** o contador do cabeçalho do Hoje deixa de ser `N/total` + um bloco `Goal G` ao lado (item 2.4 do backlog) e vira UM indicador: `Missão N/G` / `Mission N/G`, `aria-label` "Missão N de G". G = a META do dia (`dailyGoalFor`), N = feitos; **N pode passar de G** (6 cumpridas com meta 4 mostra `6/4`, nunca limitado). A meta continua não alterando o registro (decisão 2.4): nada de progresso, recompensa nem dia completo mudou, só o que é exibido. Mantido o piso de dígitos E5 (nada aparece com 0 feitos). Sem meta definida, cai na contagem simples `N/total`.
- **Fala em balão:** a fala (`message`) fica dentro de um balão clássico: cantos arredondados, borda fina, sombra sutil, fundo sólido do token de superfície (claro/escuro seguem o tema; os 30% de opacidade de 08/10 saíram, pois o texto perdia legibilidade), texto à esquerda, largura máx. 80% do palco, 3 linhas com reticências, cauda para baixo no x do pet (acompanha o `position`). Mais baixo que antes (`BUBBLE_TOP` = 20 em vez de 6) e continua fora do fluxo (2.5: altura da Home estável). `role="status"` + `aria-live="polite"`; mesmo tempo/dispensa por toque; fade curto só fora de `prefers-reduced-motion`.
- **Limite conhecido:** com o pet dormindo e falando ao mesmo tempo, o balão pode cobrir parte do Z do sono (que fica no canto superior direito da cabeça).


## 56. Avisos viram balão, Conquistas ganham Resgatar explícito (dono, modal, 14/10/2026)

- **Respostas do dono à #345:** (1) sem o botão Avisos, os avisos importantes viram balão leve; (2) a aba Conquistas do ícone "!" ganha **Resgatar explícito**, e a compra do item continua no Mercado; (3) mantidos 1 material por missão (6/dia), musgo na visita ao Mercado e "sem retroativo pago".
- **Avisos → balão (`noticeToast`).** Novo item da fila de apresentação (`presentationQueue.ts`), o mais leve de todos, depois de `unlockToast`: não bloqueante, nunca sticky (qualquer modal ou o balão de prédio o substitui), some sozinho em 8 s. Cobre os avisos **acionáveis**: convite de refeição, convite ao Refúgio, aviso de termos, triagem e recomeço, nessa ordem. **Termos: UMA ÚNICA vez na vida** (resposta do dono à #347, persistido em `soulmon-notice-toast-once`, não repete por dia); os convites (refeição, Refúgio) seguem 1×/dia enquanto existirem. "Conquista pronta para resgatar" fica só no "?" do ícone, sem balão; nenhum aviso informativo foi religado. O toque abre a folha de Avisos (que segue existindo; só o botão da Home está oculto). "Visto" é gravado ao MOSTRAR (`localStorage` `soulmon-notice-toast-seen`, `<dia>|<chaves>`): cada aviso aparece **1× por dia** e não repete ao reabrir o app. PT/EN em `NoticeToast.tsx`. **HP** segue pelo HUD (corações do `CompanionHUD`) e **incubação** pelo visor (`incubating={incubandoAgora}`); os avisos informativos sem ação (carga, marco do Bosque, semanal, priming, check-in oculto) ficam **sem canal**, por decisão do dono.
- **Conquistas: regra nova de liberação.** Antes, cumprir a conquista liberava a COMPRA do item sozinho. Agora: **cumprir → Resgatar (aba Conquistas do "!") → a compra abre no Mercado (prédio Conquistas)**. Resgatar **não concede o item**: só libera o botão de compra, que paga com a moeda normal. Campo novo `GameState.missionsClaimed` (ids de `MISSIONS`), sanitizado no cliente e em `functions/api/save.js` (lista fechada, espelho em `_dailyMissions.js`, paridade em `dailyMissions.parity.test.js`). `isShopItemUnlocked` ganhou o 4º parâmetro `claimed`: ausente = regra antiga (automática), para nunca bloquear sem querer.
- **Migração segura:** save sem o campo ganha, no primeiro carregamento (`App`), `missionsClaimed` = as conquistas **já cumpridas** naquele momento. Quem já tinha item liberado continua com ele, sem nenhuma ação; as conquistas cumpridas depois pedem o Resgatar. Idempotente (já resgatada devolve o mesmo estado, sem duplicar).
- **UI:** bloqueada = critério + progresso; cumprida = botão **Resgatar** (só no "!"; no prédio Conquistas do Mercado aparece "Resgate em Missões (!)"); resgatada = "compre na lojinha de Background, no Mercado". O ícone "!" ganha o "?" (pendência de resgate) com conquista cumprida e não resgatada, sem número. A loja mostra "Cumprida: resgate em Missões (!) › Conquistas" no item ainda fechado.
- **Régua viva:** `missions.test.ts` (resgate libera, save não migrado segue automático, migração, sanitize), `dailyMissionList.render.test.tsx` (estados da aba, balão, fila), `functions/api/dailyMissions.parity.test.js`, `filaDeAvisos.contract.test.ts` (ordem da fila).
- **Gatilho para rever:** o dono querer que o resgate também conceda algo, ou os avisos informativos sem canal fazerem falta.

## 58. Lote P2 de arte: ícones do Perfil, selos e status do Combate v3, `fx-target-down` (squad de arte, 14/10/2026)

- **Receita:** `gpt_image_2_5` (variante `flare`), 1024², `--background transparent` (alfa real), 1 imagem de referência (folha com `energia`, `hp`, `atributo-poder` e os selos atuais), fatiada por componentes conexos e reescalada com Lanczos. **Sem pixelização, sem limite de cores** (decisão do dono de 14/10 revoga o pós-processo de 30/09). 4 gerações, 4 créditos.
- **Perfil (`SoulmonPerfil`):** atributo principal e forma de ataque ganham arte própria em `icones-ui/perfil-*.png` (64²): Força = bíceps, Resistência = toco com raízes, Agilidade = pena; corpo a corpo = lâmina curta, à distância = arco com seta. Saem o raio (colidia com a energia), o escudo (colidia com `attr-def`) e o punho (é do `strike-melee`).
- **Combate v3 (mesmo nome de arquivo, sem mexer no código):** `st-buff-atk` (espada para cima com chevron), `st-buff-spd` (chevrons duplos com linhas de velocidade), `st-hot` (cruz com gotas ouro; sem anel, para não colidir com o respec), `soul-lv-badge` (hexágono de cobre com cristal), `vinculo-badge` (dois anéis entrelaçados com vinha), `talent-respec` (setas circulares com estrela). `fx-target-down`: 6 quadros 128² + folha 3×2 (fiapos ciano descendo, sem caveira); **ainda sem consumidor**.
- **Sem geração:** o "Power" da Arena livre já usa `icones-ui/atributo-poder.png` (`DueloSheet`). A missão do dinossauro trocou o glifo Material `pets` (a pata) por `directions_run` e o emoji de dado por 🏃; o emoji nunca aparecia na tela.
- **NPCs:** o levantamento não achou prédio sem NPC (os 22 lotes de `LOT_NPC_ART` estão cobertos; o Perfil usa o corvo) e há 21 bustos de função/extras já instalados sem chamada. Nada foi gerado; variantes/poses (a garça-torre) ficam à espera de decisão do dono.
- **Gatilho para rever:** o crítico reprovar a leitura a 16 px (arco, selos) ou o dono querer o pixel mais "quebrado".

## 59. Lote P2b de arte: prédio do Perfil, 3 regerações e o levantamento dos bustos sem uso (squad de arte, 14/10/2026)

- **Prédio do Perfil:** `laboratorio/lote-laboratorio-perfil.png` (300², alfa real), o espelho-d'água que lê a alma (piscina de luz turquesa numa tribuna baixa de pedra, moldura de ouro e bronze, cristal-alma flutuante, dois braseiros), gerado com `gpt_image_2_5 flare` e a folha dos 3 prédios do Laboratório como referência; 5 seeds (3 altas, estreitas demais para a régua de largura 24% da cena, e 2 largas; a larga nº 1 foi a escolhida). Substitui o empréstimo `lote-jogos-mente-akasha` **só no Perfil** (`areas/index.ts`, bbox em `areaLotGeometry.ts`); o arquivo antigo segue em disco, sem consumidor nesta rota.
- **Regerações (conferência a 16 px):** `perfil-ataque-distancia` (arco mais grosso), `vinculo-badge` (elo de corrente de cobre com gema, sem vinha) e `fx-target-down` (riscos de ciano mais grossos, 6 quadros). 4 gerações a mais (a 5ª, de vínculo, saiu com xadrez assado e foi descartada).
- **Bustos sem uso:** nenhum lote repete o busto de outro lote. O único "repetido" é o anfitrião de área (`AREA_NPC_ART`, usado no `MapTutorial`), que é o MESMO personagem do lote (Vultrak, Zeph, Pipo, Vesca, Lumi: nomes da decisão D5 do dono, travados por testes). Trocar isso é mudar a identidade de 5 NPCs aprovados, então **não foi feito**; os 20 bustos livres (6 de função sem Ambra/Iris, 15 extras menos Oriel já em `EXTRA_NPC_ART`) aguardam o dono escolher telas na folha numerada.

## 60. Bustos de função ligados às telas (dono, modal, 14/10/2026)

- **Resposta do dono à #351:** ligar SÓ os 4 bustos livres de função, sem trocar anfitrião de área nem nome D5 (Zahra, Vela, Trill, Datura e Bastia seguem sem chamada).
- **Ligação** (`ui/FunctionNpcNote`, busto + nome + fala de `functionNpcVoice`, voz de acolhida, sem cobrança): **Tobi** no topo de Configurações, **Faro** no grupo "Sua conta", **Sona** no cartão da Janela de descanso (sono), **Nuri** na Mochila (a tela de cuidados com comida). Ambra segue no onboarding; Iris e o corvo seguem reservados.
- **Gatilho para rever:** o dono preferir outra tela para a Nuri (não existe folha própria de "Cuidados").


## 62. Missões em cartões, com "Ir" até o lugar e o "!" amarelo (dono, voz, 14/10/2026)

- **Pedidos:** (1) toda missão que depende de um prédio DIRECIONA para lá; (2) cada missão em um CARTÃO separado; (3) o "!" da Home e dos cartões é o AMARELO da paleta, sem círculo; (4) tirar o "!" da frente de "This week" na aba Semanal.
- **Cartão único (`MissionCard`):** um por missão em todas as abas (passeio, Caderno, as 6 diárias, primeiras vezes, semanais; as Conquistas já eram cartões e ganharam o "Ir"). Mesmo padrão de cartão do app (`--sm2-line`, `--sm2-surface`, `--sm2-radius-lg`), altura mínima e ação à direita para não pular de layout. Recompensa (resposta do dono, 15/10/2026): o cartão a mostra **somente quando a missão está PRONTA** para resgatar ("+1 material" nas diárias, no Caderno e nas primeiras vezes, sem dizer qual; "+N Honra" no botão Resgatar das semanais); antes disso não mostra recompensa (sem cobrança) e, depois de resgatada, vira o estado concluído. Mantidos pelo dono: "Ir" das semanais de cuidado para a Home, "Primeiro dia" como cartão único e os destinos Mercado → Itens e Evolução → Centro de Evolução.
- **"Ir":** o título vira botão. O destino sai de uma tabela única (`utils/missionTargets.ts`): minijogos → Salão; foco → Oficina; Masmorra; Mercado; Amigos; Duelo/Torneio → Arena; passeio → Passeio; visita → o próprio prédio; semanais e conquistas por categoria; cuidado, humor e descanso (acontecem no pet/Home) fecham a folha e voltam à Home; missão sem lugar (conquistas de Constância) não tem ação. Navega com o que já existe (`irAoPredioDaMissao` → lote aberto no Mapa).
- **Bloqueio:** prédio ainda fechado pelo Vínculo NÃO navega; o cartão troca o "Ir" pelo requisito ("Opens at Bond N"/"Libera no Vínculo N"), pela mesma tabela de portões (`buildingGateFor`/`buildingLockLine`).
- **"!" amarelo:** o ícone da Home e os cartões usam sempre o tom `gold` (a regra de 07/10 do "!" azul das semanais é **revogada** para esses dois lugares; `questMarks` ainda calcula o tom, só não é usado). O ponto da aba Semanal também é dourado. A seção "Esta semana" não tem mais "!" na frente do título.
- **Régua viva:** `missionCards.render.test.tsx` (um cartão por missão, "!" dourado sem azul, sem "!" em "This week", "Ir" navega, prédio fechado mostra o requisito, destinos) e os testes de lista anteriores.

## 61. Restaurante em obra (Mercado) e a Nuri sai da Mochila (dono, 14/10/2026)

- **Nuri fora da Mochila:** `FunctionNpcNote 'cuidados'` deixou de ser usado; o componente fica, e Faro (Conta), Sona (Sono) e Tobi (Configurações) seguem.
- **Restaurante em obra:** novo lote `mercado:restaurante` (arte `areas/lote-mercado-restaurante.png`, 300², alfa real; Higgsfield `gpt_image_2_5 flare`), no canto de baixo à direita do Mercado, que estava livre "para uma futura loja" e é a área da comida (Itens vende comida). NPC **Tijolino**, caranguejo pedreiro de casco-tijolo (`npcs/npc-mercado-restaurante.png`).
- **Comportamento:** sempre visível (fora do `gated`, sem Vínculo mínimo); tocar abre a folha padrão (`AreaSheet`) só com o busto e a fala. **Sem ação, sem preço, sem save, sem missão:** não é `BuildingId` (fora de `BUILDING_GATES`, das primeiras vezes e das missões de visita). Entra no tutorial do mapa com a linha "Em obra, em breve!".
- **Gatilho para rever:** quando o restaurante abrir de verdade, vira `BuildingId` com folha, gate e missão próprios.


## 63. Corvo em alta qualidade como busto do Perfil (dono, 15/10/2026)

- **Decisão do dono:** o NPC do Perfil troca o mascote pixel art 384² pelo Corvo em estilo NPC (variação 1 do lote, 1024² reduzido a 768² com Lanczos, alfa normalizado a 255 onde ≥250). Arquivo novo `npcs/npc-perfil-corvo.png`; só `LOT_NPC_ART['laboratorio:perfil']` aponta para ele. Nome 'Mysterious Soulmon' / 'Soulmon Misterioso' mantido; `mascot-raven.png` intocado (mascote em outros lugares).

## 64. Pools de alinhamento do oráculo ampliados (dono, 15/10/2026)

- **Pedido do dono:** benevolência ganha elegante, imponente, confiante, corajoso, benevolente; harmonia ganha gentil, harmonioso, equilibrado, sábio, sereno.
- **Feito** (`utils/oracle/motor.ts`): `TYPE_LOOK` +5 itens por alinhamento (24 para 29) e `ALIGNMENT_TRAIT_WORDS` +3 pares PT/EN em cada (4 para 7), tudo ANEXADO NO FIM dos arrays.
- **Efeito:** o sorteio por semente usa o tamanho do array, então sementes futuras de harmonia/benevolência podem sortear itens/traços diferentes. Soulmon já gerados não mudam (o prompt fica gravado no save).

## 65. Pesadelo: dano real, 1 fase, torcida, regra de vitória, sombras, elemento próprio e sonho bom (dono, 15/10/2026)

- **Pedido do dono:** (1) o pesadelo usa os sprites dele; (2) BUG: não causava dano; (3) Cheer (torcida) na mecânica; (4) regra de vitória difícil: sem torcer ou sem acertar o especial ao menos em parte o pesadelo não é derrotado; (5) sempre 1 fase; (6) elemento `NIGHTMARE` exclusivo da mecânica; (7) a cada 6 dias de pesadelo, 1 sonho bom que paga Honra.
- **Causa do "não causa dano":** a onda usava `dungeonFoe` do andar 1, de força 0,026-0,096 (calibrada para uma run de 5 andares, não para uma luta isolada). Medido: cada golpe tirava 0,3-1,3% do HP e a luta toda 3-12% ("1" na cena). A Masmorra não mudou. Agora o Pesadelo tem força própria (`nightmareFoe`, mesmo HP da Masmorra; valor final na regra abaixo).
- **1 fase:** `NIGHTMARE_WAVE_SIZE = 1` (era 2). O inimigo é o do tier da noite.
- **Sprites:** o inimigo e o convite usam as **sombras do Pesadelo** (`dino-shadow-{1,2,3,4}{,b,c}.png`, `nightmareShadowSprite`): degrau por tier (baby-i a rookie = 1; champion = 2; ultimate = 3; mega = 4), variante pelo hash da noite. Antes: Soulmons comuns (`DUNGEON_LINE_SPRITES`) e `ignar` no convite.
- **Torcida:** volta ao Pesadelo (revoga o §2.19 só aqui): mascote no canto, toque na tela, descarga de 24 toques (a de sempre, `CHEER`).
- **Regra de vitória (SUBSTITUÍDA pelo dono, 15/10/2026, mesma tarde):** a vitória é ZERAR o HP do pesadelo (batalha comum; acabou a ideia de "resistir com HP zerado"). A dificuldade é o pesadelo derrubar o Soulmon PRIMEIRO se o jogador não ajudar. Mecânica (`dungeonFight.NIGHTMARE_KNOBS` + `nightmareFight`): o pesadelo é uma sombra, então os golpes BÁSICOS do Soulmon valem **0,4**; o ESPECIAL vale por anel **ruim 0 / bom 1,6 / ótimo 2,0**; cada DESCARGA de torcida recolhida pelo núcleo tira **24%** do dano do pesadelo, até **72%** (3 descargas); força do pesadelo `NIGHTMARE_POWER = 1,2` (mega: x0,8, `NIGHTMARE_MEGA_EASE`, porque ele também lança especial). A Masmorra e o dano corrigido (causa do bug) seguem intactos. Torcida simulada: uma descarga a cada 6 s de luta (24 toques no teto de 16 por 3 s levam 4,5 s).
- **Números medidos** (6 fichas x 40 sementes = 240 lutas por tier; taxa de VITÓRIA do Soulmon): A sem torcida e anel ruim: **0%** em todos os tiers (exigido: perde >= 90%). B torcida + anel bom: t1 89% · t2 91% · t3 82% · t4 82% · t5 82% (exigido >= 75% nos tiers 1-3 e >= 50% nos 4-5). C1 torcida sem acertar: t1 13% · t2 10% · t3 11% · t4 4% · t5 0%; C2 especial sem torcida: t1 23% · t2 12% · t3 11% · t4 7% · t5 8% (exigido: perde >= 70%). Régua: `nightmares.pesadelo.test.ts` ("CALIBRAGEM"). O gate antigo AC5 (18-22 s, vitória >= 99%) foi aposentado. **Rever:** `NIGHTMARE_POWER`, `NIGHTMARE_KNOBS`, `NIGHTMARE_MEGA_EASE`.
- **Convite/ajuda:** "Só com a torcida e os especiais certeiros o Soulmon aguenta o pesadelo. Toque na tela para torcer e acerte o anel!" (PT/EN, `NIGHTMARE_HINT`); durante a luta dois selos mostram a torcida e os especiais certeiros.
- **Textos de fim (exatos):** desvanece = "O pesadelo desvaneceu, mas continua à espreita." / "The nightmare faded, but it still lurks."; extinto = "As sombras se dissipam, o pesadelo foi extinto e dá espaço para os sonhos." / "The shadows disperse, the nightmare is extinguished and makes room for dreams."
- **Elemento `pesadelo`:** isolado (`utils/nightmareElement.ts`): fora de `VISUAL_ELEMENTS`, dos derivados e de qualquer sorteio de Soulmon; matchup **neutro** (`nightmareMatchup() = 0`; o núcleo do PvE nem lê elemento); os golpes do pesadelo usam esse elemento. Sem arte, cai no FX procedural (`neutro`). Encaixe: PNG em `src/assets/soulmon/pesadelo/` (ver o relatório da PR).
- **Sonho bom:** o dia de pesadelo (noite lutada, ou fechada) conta UMA vez no ciclo (`lurkDays`, até 6). No 6º, `goodDream` arma o sonho bom: no slot do pesadelo da manhã seguinte (ou logo depois da luta do 6º dia) abre o modal `GoodDream`. Colher (botão ou ×) paga **3 de Honra** (`GOOD_DREAM_HONOR = EMBLEMS_PER_WIN`, o equivalente a uma vitória no Torneio; a Arena não paga Honra), reinicia o ciclo e conta `goodDreams`, tudo no MESMO updater e idempotente (`claimGoodDream`). **Sem retroativo:** save antigo começa em zero. Campos saneados no cliente (`sanitizeNightmareState`) e no servidor (`functions/api/_nightmares.js` em `save.js`), com teste de paridade. **Rever:** o valor (3), se fecha o sonho sem querer ao tocar fora, e se 6 dias é o ritmo certo.
- **Gatilho para rever:** o dono achar o pesadelo fácil/difícil demais, ou a arte do elemento chegar.

## 66. Início do dia: o achado dentro do Passeio e a reafirmação diária das metas (pedido do dono, 15/10/2026)

*Pedido:* (1) o pop-up "do que foi encontrado pelo Soulmon" deve ser INTEGRADO ao modal do stroll (passeio) — um fluxo só, mantendo a regra de que "From Yesterday's Adventure" associa o resultado ao scroll escolhido no dia anterior; (2) o pop-up "Set goals / Add tasks to list" vira uma lista de caixas de marcar com as tarefas/hábitos JÁ cadastrados; a cada dia a pessoa REAFIRMA o que quer fazer, as caixas vêm DESMARCADAS e só o marcado aparece no Hoje; o não marcado não aparece e NÃO conta como falha/quebra.

- **Decisão 1 — achado dentro do contexto do Passeio.** Nasce `components/play/StrollFind.tsx`: a missão escolhida ontem + o destino + o que o Soulmon encontrou (a regra do beta-2 4.3 intacta). É a peça única dos dois lugares onde o achado aparece: o passo "From Yesterday's Adventure" do resumo do dia (que já usa o molde `AreaSheet` do lote Passeio, com o NPC do scroll) e uma nova seção "Da aventura de ontem" no topo da folha do Passeio (`PasseioSheet`, prop `achado`, entregue pelo `App` enquanto o relatório é recente, ≤ 2 dias). Sem componente paralelo: o markup saiu do `DailyReportModal` e foi para a peça compartilhada. A fila segue igual (um item por vez, "visto" ao mostrar, centralizado).
- **Decisão 2 — reafirmar o dia (`dayGoals`).** Novo item da fila entre `catalogOnboarding` e `checkIn`: `DayGoalsModal` (centralizado, `CheckRow` do kit, alvo ≥ 44 px, PT/EN) com os hábitos, as agendadas que caem hoje e as tarefas abertas de hoje (`dayPlanCandidates`; sem duplicar, fora o que não cai hoje e o já feito). **As caixas nascem DESMARCADAS — isto SUBSTITUI o "todas marcadas por padrão" do 7.3** (também no ponto de partida do `CatalogOnboardingFlow`, que agora nasce desmarcado e exige ao menos 1 marcado, C11). Justificativa do dono: a pessoa reafirma o que quer fazer, em vez de aceitar tudo por inércia.
- **Estado:** `dayPlan { day, offered[], picked[], confirmed }` no save (dia do jogador em ISO; saneado no cliente `sanitizeDayPlan` e no servidor `functions/api/_dayPlan.js`, com teste de paridade; teto 200 ids). Esconde-se `offered − picked` no dia do plano; plano de OUTRO dia esconde tudo o que é de hoje até a reafirmação ("o dia só começa depois da confirmação"). Quem nasce depois do instantâneo (criado no meio do dia) aparece sozinho; o concluído de hoje aparece sempre. **Migração:** save sem `dayPlan` ganha, na 1ª abertura (após onboarding/tutorial), o plano de hoje como "já reafirmado" — nada escondido; o pedido do modal começa no dia seguinte.
- **Fechar sem confirmar:** o "visto" é gravado AO MOSTRAR (regra do §42), então fechar (✕/Esc/voltar) deixa a lista vazia com um convite discreto ("Montar o meu dia" / "Plan my day") e o item NÃO reaparece em laço no mesmo dia; o convite reabre o modal pela mesma fila. Sem cobrança, sem contagem.
- **Não marcado ≠ falha:** a virada não julga na constância (`applyMissedDay`) o hábito que ficou de fora naquele dia (`hiddenOnDay`, só vale para o plano do próprio dia julgado). O check-in da manhã só enxerga o marcado.
- **Meta limitada ao marcado (dono, modal, 15/10/2026, REVÊ a versão anterior "meta intacta"):** meta efetiva = `min(meta do estágio, peso do que foi marcado)`. O não marcado sai de `activitiesForWeekDay`/`registeredForDay` (`hiddenForDayKey`), logo da meta (`dailyGoalFor`, o G do `Missão N/G`), do feito, da meta de coração e do julgamento da constância na virada. Marcou 2 de meta 4 e cumpriu os 2 = dia completo, sem perda; marcou 0 = meta 0, sem perda e sem "dia completo" (`completeDayReached` exige cadastradas > 0). O plano é achado pelo DIA DO JOGADOR (`playerDayTz`), não só pelo do aparelho. Sem edição do dia depois de confirmar (mantido).
- **Testes alterados (contrato mudou):** `CatalogOnboardingFlow.render.test.tsx` — "TODAS marcadas por padrão" virou "TODAS DESMARCADAS" (e os testes de "sem duplicar" marcam antes de confirmar); `filaDeAvisos.contract.test.ts` — a ordem ganhou `dayGoals`; `GameStateContext.hydrate.fuzz2.qa.test.tsx` — 133 → 134 campos (`dayPlan`).
- **Risco assumido pelo dono:** marcar pouco facilita o dia completo; o teto continua sendo a meta do estágio.
- **Gatilho para rever:** abuso de marcar 1 item para fechar o dia completo todo dia (evolução/Bits por dia completo).
- **Depende do dono:** (1) a meta/coração devem seguir só o marcado? (2) editar o dia depois de confirmar? (3) o achado deve também ter seu próprio gatilho no início do dia dentro da folha do Passeio (hoje o passo do resumo continua sendo o momento do aviso)?

## 67. 17 novos Soulmon por elemento nos encontros da masmorra (dono, 15/10/2026)

- **Decisão do dono:** "Eu adorei todos" — os 17 Soulmon por elemento base (Rookie e Champion) viram os encontros comuns da masmorra. Divisão: Poder (vileza, morte, sombra, fogo, vigor, marcial), Harmonia (arcano, tempo, espaço, gravidade, som, eletricidade), Benevolência (vida, luz, água, terra, ar). Renomeados: Grava→Gravul, Umbrat→Umbrae, Solleon→Solion, Auroram→Aurolion, Windhawk→Cirruwing, Voltix→Voltrix.
- **Substituição mais segura:** `DUNGEON_LINE_SPRITES` (9 linhas × 4 estágios) NÃO foi tocado — é dono dos personagens prontos/legados, das sombras do Pesadelo (`SHADOW_SLOTS`), dos NPCs da Biblioteca, do Combina 3 e do bosque. O roster novo vive em `utils/novosSoulmon.ts`; `buildDungeonWave` sorteia dele nos slots baby-i/baby-ii/rookie (forma Rookie) e champion (forma Champion). Ultimate e mega da escada seguem com as linhas antigas até haver arte nova. A Arena (`getDungeonEnemySprite`) segue com as linhas antigas.
- **Elemento e golpes:** o encontro leva o elemento da criatura (`DungeonEnemy.element`; antes era um hash do `stage`), a forma do golpe sai de `ELEMENT_STRIKE_FORM`, o FX de `fx-ataque/` do próprio elemento, e o selo do especial usa o nome PT/EN da tabela (`dungeonFoeSpecialLabel`). Todos os 17 elementos já tinham FX e forma: nenhum FX faltando.
- **Sem balanceamento novo:** HP/poder do slot (`DUNGEON_SLOTS`) e Bits intactos; só muda o sabor. A chave do bestiário do save passa a ser `<id>-<tier>` (ex. `embrit-rookie`); chaves antigas ficam no save.
- **Arte:** 1024² → 256² (Lanczos, alfa preservado, ≥250 → 255), 34 PNGs, todos olhando à direita/de frente (sem entrada em `LEFT_FACING_LINES`). `CACHE_VERSION` v200.

## 68. Arte do elemento Pesadelo, 3 cenários e trilha de terror procedurais (dono, 15/10/2026)

- **Pedido do dono:** produzir, GERADOS EM CÓDIGO a partir dos monstros pesadelo já criados, (1) os assets de combate do elemento `pesadelo` ("meio sombra, meio aberração 3D, meio glitch"), (2) cenários de pesadelo e (3) uma trilha sonora de terror só para o Pesadelo. O encaixe da §65 estava pronto e vazio.
- **Arte (`scripts/gerar-pesadelo-arte.py`, determinístico, sem modelo de imagem):** `src/assets/soulmon/pesadelo/` ganhou `el-pesadelo.png` e `fx-pesadelo-{cast,aura,slash,impact,defended,orb}.png` (128², alfa, `orb` para a direita, `aura` vazada no meio, os formatos de `fx-ataque/`). Pixel art em 12 cores (preto `#05080C`, roxo-azulado `#3B2A7A`/`#763BFF`, ciano `#A9FBFF`; o "magenta escuro" do deslocamento de canais é o roxo `#4A1A7A`; nenhum rosa/vermelho, travado por teste). Efeitos: deslocamento de canais (ciano/roxo), fatiamento horizontal, scanlines, ruído de pixel, blocos de "dados corrompidos", extrusão 3D falsa (cópias deslocadas e escurecidas), wireframe, fumaça de pixels e olhos. Parte do alfa de `dino-shadow-*.png`/`dungeon-spirit.png` (silhueta que sobe do círculo no `cast`, vigias na `aura`, estilhaços no `impact`, vultos nos cenários). `hasNightmareFx()` passou a `true` (o teste mudou de propósito).
- **Cenários:** `bg/pesadelo-abismo-glitch` (ruído, scanlines, blocos corrompidos, vazio roxo), `pesadelo-corredor-impossivel` (perspectiva em wireframe com 3 pontos de fuga e quadros repetidos) e `pesadelo-quarto-sem-fim` (horizonte baixo, névoa, portas que se repetem, vultos); 608×1080 opacos, na caixa alta dos fundos pintados. `nightmareScene(dia)` (`dungeonScenes.ts`) sorteia UM por dia local por hash FNV-1a (a mesma noite mostra o mesmo cenário em qualquer aparelho); `NightmareBattle` usa em convite e luta, com a Forja das Almas (`NIGHTMARE_SCENE`) como fallback. Fora do sorteio das runs da Masmorra.
- **Trilha de terror (`utils/trilhaPesadelo.ts` + `trilhaPesadeloSintese.ts`):** WebAudio, ZERO arquivo de áudio. Síntese pura por semente (`SEMENTE_PESADELO`): drones graves (Ré1 + tritono + cluster de segundas), pad com detuning em 3 vozes por nota, batida de coração (45 bpm) e infrassom (18 Hz), sussurros de ruído filtrado, stingers FM esparsos. Loop de 24 s a 12 kHz, SEM EMENDA (toda frequência é múltiplo inteiro de 1/24 Hz e todo evento é escrito com módulo). Toca SÓ no Pesadelo (nova superfície `pesadelo` do diretor `musica.ts`: o tema recebe `cena`, as faixas de combate saem), pelo `busTrilha` do `audioBus` (mesmo volume/limitador/ducking), com fade de entrada de 3 s e de saída de 2 s. Respeita: mudo/sono/descanso (`pausarTrilha` repassa a `pausarPesadelo`), aba oculta, e só entra se o jogador JÁ liga música (tema ou trilha de combate); nada é criado antes do gesto de abrir o Pesadelo. Loudness: pico do buffer = −14,1 dBFS e o ganho de `loudness.ts` das camadas da trilha (nenhum número novo).
- **ENCAIXE PARA O MP3 DO DONO:** se existir `src/assets/audio/pesadelo-trilha.mp3` (ou `.ogg`/`.m4a`) ele toca no lugar da procedural, no mesmo bus/fade/volume; se a decodificação falhar, cai na procedural. Para trocar: soltar o arquivo com esse nome em `src/assets/audio/` e fazer o build. Recomendado: loop sem emenda e pico perto de −14 dBFS.
- **Reprodução fora do app:** `node scripts/render-trilha-pesadelo.mjs [saida.wav]` (4 loops, pico −3 dBFS).
- **Gatilho para rever:** o dono ouvir a trilha e pedir outro caráter (mais lenta, mais grave, mais stingers) ou enviar o MP3; o dono achar a arte do elemento fraca e mandar arte pintada (soltar os 7 PNG com os mesmos nomes em `soulmon/pesadelo/`).

## 69. Prompt de sprite com design de alinhamento, motivos e eixos de forma (dono, modal, 15/10/2026)

- **Ligado ao prompt (todos os estágios, as duas variantes):** `ALIGNMENT_DESIGNS[alinhamento]` (1 frase sorteada) logo após o conceito, seguida de "Distinguishing features:" com 2 itens de `TYPE_LOOK`. Sorteio por RNG dedicado (`${inputKey}|visual`), que não consome o `rng` principal. Cláusulas de segurança, fundo verde e direita intactas; prompt segue bem abaixo do teto (testes exigem < 2500).
- **Eixos separados:** (A) SHAPE = só morfologia (`CHAMPION/PERFECT/MEGA_SHAPES`, agora 42/41/41, itens novos no fim, afinidade leve com a espécie do rookie via `kin`); (B) MOTIVO de elemento e de tema (`formas.ts`: `ELEMENT_MOTIFS` 8x8 + `THEME_MOTIFS` 11 temas x5), sem repetir entre as evoluções; (C) REINO (`formasReino.ts`, clima/habitat da NARRATIVA 7.2; Mega leva o pool `mass` da 5.8; akasha só "borda que nunca fecha", sem memória/arquivo); (D) PAPEL: `ROLE_METAMORPHS` (+2 por papel) agora entra no Champion ("o corpo cresce..."). Entradas de tema/espécie antigas (planta carnívora, marionete, ciborgue, relógio, magma, espelhos) viraram motivos; no lugar ficou morfologia pura (mesmo índice).
- **Efeito:** sementes futuras mudam; Soulmon salvos não (o prompt fica gravado). Testes: `oracle/formas.test.ts`.

## 70. Torcida também na Masmorra; ciclo do sonho bom só conta quem lutou (dono, modal, 15/10/2026)

- **Torcida:** passa a existir na Masmorra e no Pesadelo (reverte de vez o §2.19 "sem torcida na Masmorra e no Pesadelo"). É o mesmo componente e a mesma mecânica das outras batalhas (`TorcidaLayer` com mascote, toque na tela, descarga de 24 toques = `CHEER.energyPerDischarge` de energia, teto de 16 toques por janela de 3 s); só dá a energia que já dá na Arena.
- **O que NÃO muda:** energia gasta para descer, limite diário e portões da Masmorra; o especial segue automático (§36); os gates de balanço e o replay offline (`dungeonAway`) simulam SEM torcida, então o resultado determinístico por semente é o mesmo; a torcida é só um bônus ao vivo de quem toca.
- **Ciclo do sonho bom:** só conta como dia de pesadelo quem LUTOU (vitória, derrota ou desvanecer). Fechar pelo × sem lutar marca a noite como vista (o convite não reabre) mas não conta para os 6 dias (`markFought(nm, key, false)`).
- **Mantidos (§65):** Honra 3; ciclo de 6; fechar o sonho bom já colhe. A regra "50% dos especiais + 1 descarga" foi substituída pela calibragem do §65 (vitória = HP).

## 71. Novos Soulmon: champions escolhidos, Arena com as 17, onda sem repetição e encaixe das formas altas (dono, modal, 15/10/2026; complementa §67)

- **Champions finais (dono):** os 17 de `champions-escolhidos/` são a fonte. Marcial e arcano ficam nas versões ANTIGAS (as regeradas v3 foram descartadas); eletricidade (Voltrix, visual industrial, elemento segue `eletricidade`) e gravidade trocaram. Mesmo processamento 256² (Lanczos, alfa ≥250 → 255).
- **Arena:** o inimigo passa a ser UMA das 17 criaturas (`buildArenaRound`, `ArenaEnemy.creature/form`), com o ELEMENTO da criatura (único; consistente com ataque/FX e com o anel de vantagens) e o nome dela. Seleção determinística pela semente da run + nº da rodada (`mulberry32(seed ^ rodada)`, como antes), uniforme entre as 17 (mesma justiça da estratificação por elemento) e SEM repetir na rodada. O nível do jogador não entra: ele só escala a força (`arenaFoe`). Fraco = Rookie, médio = Champion, chefe = maior forma com arte (ultra > mega > ultimate), senão o Champion. HP/dano/Bits/regras do Torneio e da Honra intactos. O parâmetro `pool` do bestiário ficou sem uso (o import dinâmico de ~104 KB segue carregado pela tela; remover é decisão à parte).
- **Masmorra sem repetição:** `buildDungeonWave` não repete criatura entre os slots da onda (`used`); 17 > 4, sempre possível.
- **Formas altas prontas, sem arte inventada:** `utils/novosSoulmonData.ts` (dados puros: `FORMAS_ALTAS` nomes, `FORMAS_ALTAS_ART` em `novosSoulmon.ts` sprites). Enquanto vazias: slots 4/5 da escada (e do Pesadelo, que herda a onda) seguem nas linhas antigas; o chefe da Arena usa o Champion. Ao instalar Ultimate/Mega, o slot 4/5 sorteia entre as criaturas que têm a forma (sem nenhuma, volta à linha antiga). `SHADOW_SLOTS` permanece com as sombras.


## 72. Rosto neutro nos sprites (dono, 15/10/2026)

- **Decisão:** os pools de Poder, Harmonia e Benevolência (`ALIGNMENT_DESIGNS`, `TYPE_LOOK`) e os motivos novos perdem tudo que descreve olhar, boca, sorriso, bochechas, expressão ou "fofura" (sorriso, careta, olhos, "huggable", "fluffy"...). Ficaram corpo, postura, silhueta, motivos e acentos de cor; os itens faciais foram trocados no mesmo lugar por itens neutros de corpo/postura (os pools mantêm o tamanho). Os 4 adjetivos faciais do pedido de hoje cedo (gentle expression, wise look, serene face, benevolent expression) saíram; ficaram os de postura/forma.
- **Cláusula constante** em todo prompt, nas duas variantes: "Simple neutral face with minimal facial detail, small plain eyes, no smile, no frown." (`NEUTRAL_FACE_CLAUSE`).
- **Régua:** `oracle/formas.test.ts` varre os prompts de 150 sementes (todos os estágios, as duas variantes) atrás de vocabulário de expressão. Soulmon salvos não mudam.

## 73. Busto do Tijolino é o caranguejo pedreiro do dono (dono, 15/10/2026)

- **Decisão:** o busto do NPC do Restaurante em obra deixa de ser a arte gerada por IA e passa a ser `dominios/industrial/npcs/npc-industrial-caranguejo-argila-pedreiro.png` (512², pintada, alfa binário), normalizada para 768² (Lanczos, alfa ≥250 → 255) e salva por cima de `soulmon/npcs/npc-mercado-restaurante.png` (ligações e `LOT_NPC_ART` intactos). Nome "Tijolino, o pedreiro", fala, prédio e tutorial não mudam. A pasta `dominios/` não foi tocada.

## 74. Sem botão de Pausar nos combates; velocidade 1×/3× sem caixa, abaixo da torcida (dono, 15/10/2026; ajusta §36)

Pedido: "Remova o botão de PAUSE dos combates, como nas dungeons, e coloque o botão de 1x / 3x SEM BOX e ABAIXO do Cheer." O único botão de Pausar/Retomar visível era o da Masmorra (`data-dungeon-pause`); saiu, com o estado `pausadoManual`. Fica só a pausa de SISTEMA (a confirmação "Sair?" do `GameHeader` congela o relógio via `onPauseChange`). Saída da luta: o X/mapa da cena segue. O avanço rápido 1×/3× (`data-dungeon-speed`, mesma chave `DUNGEON_SPEED`) virou texto puro (sem borda/fundo, alvo 44 px, sombra de texto) no canto, logo abaixo do mascote da torcida (`TorcidaLayer` ganhou a prop `belowMascot`). Arena, Pesadelo e Duelo nunca tiveram velocidade nem botão de pausa: seguem como estavam (dúvida ao dono: querem 1×/3× lá também?).

## 75. Elemento dos 5 iniciais gratuitos (dono, 15/10/2026)

- **Pedido do dono:** "o vermelho deve usar ataques de FOGO, a tartaruga de TERRA, a planta tipo VIDA, a borboleta tipo AR, o pato tipo SOM...".
- **Decisão:** Crato (tartaruga) = Terra, Brooka (pato) = Som, Zefi (borboleta) = Ar, Oaken (planta) = Vida, Bolid (vermelho) = Fogo — todos já cobertos pelo pedido, nenhuma proposta nova. Cada um usa UM dos 17 base nos dois golpes, no FX, na aura, na vantagem da Arena e no tipo exibido (`STARTER_ELEMENT`, `utils/starterElements.ts`). Antes o elemento exibido era um par/essência (Aço+Aríete, Nascente+Melodia, Alento, Vida, Meteoro) e em combate os iniciais lutavam no **neutro** (sem `dominantElement` nem ficha).
- **Golpes:** `utils/starterSkills.ts` gera `StageSkills` (nome PT/EN, escola, família e selo do especial) por ficha mínima; o `App` grava em `soulmonSkills` uma vez (save antigo também). A forma do golpe vem da escola (regra do jogo); diverge de `ELEMENT_STRIKE_FORM` só no especial do Crato (corpo a corpo × à distância da terra) e do Bolid (à distância × corpo a corpo do fogo) — travado por teste.
- **Intocado:** HP, dano, linhas de evolução (os iniciais seguem sem evoluir), sprites. **Efeito colateral declarado:** como agora têm elemento, passam a ter vantagem/desvantagem de elemento na Arena como qualquer Soulmon (antes eram neutros). Tabela: `docs/ELEMENTOS-DOS-INICIAIS.md`.

## 76. Golpes dos 5 iniciais: forma da tabela do elemento e nomes autorais (dono, modal, 15/10/2026; complementa §75)

- **Decisão:** (1) o dono aceitou que os iniciais tenham vantagem/desvantagem de elemento na Arena; (2) nos 5 iniciais a forma do golpe segue `ELEMENT_STRIKE_FORM`, não a escola: Crato (terra) especial à distância, Bolid (fogo) especial corpo a corpo (marcador `formaDoElemento` na `StageSkill`, lido só por `fighterIdentity`; skill de ficha comum segue a escola); (3) nomes autorais de básico e especial por inicial (`STARTER_MOVES`, `utils/starterSkills.ts`), iguais nos 5 estágios (o inicial não evolui), substituindo o léxico automático. Tabela em `docs/ELEMENTOS-DOS-INICIAIS.md`.

## 77. Bugfix: franja branca nas setas do LEVEL UP (15/10/2026, bug do dono)

- **Causa real:** o PNG, não o CSS. `fx/gain-levelup.png` tinha alfa binário mas contorno de 1px irregular; o overlay o exibe a 48px com `image-rendering: pixelated` (0,5×, vizinho-mais-próximo descarta metade dos pixels), o contorno sumia em trechos e pixels claros apareciam serrilhados sobre fundo escuro. Chest/confetti/perfect-day tinham o mesmo halo claro.
- **Correção:** chevron redesenhado por `tools/gerar-gain-levelup.py` (grade de 48 células ×2, paleta ciano `#6EFFFB`/tinta `#E9F5F2`/contorno `#061414`; mesmo nome e 96²); chest/confetti/focus-seal/perfect-day passaram por `tools/defringe-gain.py`. Guard novo `src/assets/gainFringe.contract.test.ts`. `CACHE_VERSION` v203. Antes/depois em `product/beta-play-01/builder/irma/`.

## 78. Formas altas dos 17 novos Soulmon instaladas; ramos faltantes e combinados arquivados (dono, 15/10/2026: "Aprovo todos como estão"; completa §67/§71)

- **Decisão:** (1) Ultimate, Mega e Ultra dos 17 entram: `FORMAS_ALTAS` (nomes, PT = EN como nas outras formas) e `FORMAS_ALTAS_ART` (51 PNGs 256² em `assets/soulmon/novos/<elemento>-<ultimate|mega|ultra>.png`). Slot 4 da escada = Ultimate, slot 5 = Mega, chefe da Arena = Ultra > Mega > Ultimate; a escada não tem slot de Ultra; `SHADOW_SLOTS` (sombras do Pesadelo) intacto. Nomes propostos (tabela do agente de arte não os trazia), curtos, sem colisão no repo nem franquia conhecida; o dono pode renomear editando `FORMAS_ALTAS`. (2) Processamento: a arte nova é pixelizada (alfa binário, blocos ~16 px em 1024²), então 1024² -> 256² por **vizinho mais próximo** (4:1 exato), não Lanczos: mantém a nitidez, sem franja de alfa e ~2,3x menor (amostra: 150 KB vs 348 KB em 6 imagens). (3) Os 102 PNGs de ramos faltantes (2 por criatura) e os 138 rookies combinados ficam em `assets/soulmon/novos-arquivo/` (README bilíngue + `manifest.json`), **sem import**, como `assets/dominios/`: o jogo só consome 1 ramo por criatura e não tem combinados; nenhuma mecânica nova, `dist` e orçamento de bytes inalterados.
- **Renomeação (dono, 15/10/2026, após checagem web):** Kenjo -> **Kenvar** (colisão com o software kenjo.io) e Runix -> **Runeko** (colisão com o jogo Runix: Pinball Roguelike), PT = EN. Só o nome exibido (`rookie` em `NOVOS_DATA`); os **ids `kenjo`/`runix` não mudam** (arte e `stage` `<id>-<tier>` usam id/elemento), então nada a migrar em saves ou no bestiário. Mantidos: Voltrix, Umbrae, Pebblo, Voidlet, Vibri.

## 79. Selo "Welcome" no topo da intro, ocultando o patch pintado (dono, 15/10/2026; complementa §50)

- **Pedido do dono:** "coloca um PNG por cima, uma PÍLULA escrito WELCOME"; **correção no mesmo dia:** não é uma pílula no meio, é um selinho PEQUENININHO lá em cima, onde a arte pinta o patch/versão ("VERSION 1.2"), só para ESCONDER essa informação, com o texto no estilo do logo.
- **Decisão:** `IntroWelcomePill` (`src/components/ui/`): cápsula pequena e opaca (cor da superfície do visor, sem borda para se fundir à arte) sobre o patch (x 285-435, y 55-82 do quadro 720x1280), com "Welcome"/"Bem-vindo" em Silkscreen 700 (a voz de display do app, a mesma do `.sm-display`), tracking apertado, preenchimento creme, contorno preto grosso (`-webkit-text-stroke` + `paint-order`) e segundo contorno cobre (`--sm2-viewport-ring`, em `text-shadow`). Aparece na tela de abertura (pôster) e na intro (vídeo); some no fallback do corvo. **Nada mais é coberto:** "LOADING DATA...", a barra e "SOUL_LINK ESTABLISHED" seguem aparecendo na arte (a cobertura do meio saiu); "TAP TO START" é texto do app (DOM), não pintado.
- **Por que CSS:** não há selo/plaquinha de marca adequado em `src/assets/brand/` (só ícones, logo e mascote); CSS respeita PT/EN, usa token e fonte do app, sem byte de asset. O wordmark do logo é um PNG com letras próprias, não uma fonte reutilizável — a aproximação é Silkscreen bold com o contorno duplo (dúvida ao dono).
- **Enquadramento:** o vídeo é `object-fit: cover` 720x1280; o selo é ancorado numa caixa que reproduz esse cover (`max(100cqw, 100cqh*9/16)`), em % do quadro. Sem toque, `aria-hidden` (o alvo "Skip/Tap to start" segue dono do nome).
- **Régua:** `IntroScreen.render.test.tsx`. **Gatilho para rever:** arte nova sem patch pintado (o selo sai).


## 80. Corte do `index.js`: 724.584 B -> ~642 KB (dono, 15/10/2026: "Sim, fazer o corte do index.js"; paga parte da dívida de `orcamentoDeBytes`)

- **Decisão do dono:** executar o corte que as re-medições de 22/09 a 15/10 deixavam como "tarefa própria". Sem mudar comportamento nem visual.
- **Medido** (`vite build` limpo pós-merge da `main`; bruto/gz do chunk de entrada): **724.584 B / 249,8 KB gz -> 642.067 B / ~223,6 KB gz** (-11,4% bruto, -10,5% gz). Chunks JS: 373 -> 380. Maior chunk de app segue sendo o `index`; o maior arquivo JS é `pool-*.js` (3 MB, dado do Oráculo, já lazy).
- **O que saiu da entrada:** (1) **`welcomeTourGate.ts`**: `needsWelcomeTour`/`needsMapTutorial`/`sanitizeMapTutorialSeen` (regras puras) separadas da copy do tour; `App.tsx` e `GameStateContext` importavam o `welcomeTour.ts` inteiro, que puxava `buildingIntroCopy` -> `areaNpcVoice` -> `guildCopy` (~41 KB bruto). `welcomeTour.ts` re-exporta as três (nenhum teste mudou). (2) **`UnlockToast` virou `lazy`** dentro de um `PresentationSlot` (fallback `null`, o mesmo contrato dos outros itens da fila: falha/lentidão pula o item): o balão só existe depois de um level-up e nunca era Home. (3) **`manualChunks`**: `sonner` (33,5 KB) -> `vendor-sonner`; `@capacitor/core` (8,2 KB) -> `vendor-capacitor`. Isto é **cache**, não menos bytes no 1º load (viram `modulepreload` no mesmo HTML): o retorno deixa de re-baixar ~42 KB a cada deploy.
- **Guards:** `entradaEnxuta` ganhou duas sentinelas (copy da Guilda e `data-sonner-toaster`); `orcamentoDeBytes`: `index.js` 641.708 (era 724.584) e `index.css` 180.815 (era 172.242, re-medido: o CSS veio da `main` — selo Welcome §79 e frentes anteriores —, não desta PR). `oracleBundleSplit`, `bundleSemFranquia`, `swCache`, `offlinePage` inalterados.
- **Teto de 250 KB NÃO atingido, e por quê:** `App.tsx` sozinho tem ~270 KB renderizados (8,5 mil linhas de estado, handlers e JSX da Home) e já é maior que o teto; o resto da entrada é a Home de fato (`CompanionHUD` 61 KB, `GameStateContext` 42 KB, `shop.ts` 27 KB, `telemetry` 22 KB, `NavGlyphs` 22 KB, `i18n` 20 KB, `FormKit` 20 KB, `dailyReset` 20 KB, `DailyRituals`+`RitualPanel` 30 KB). Cortes avulsos que sobram valem 5-12 KB cada e mudam comportamento (ex.: `adventure.ts` 11 KB só chega após um `import()` no relatório do dia = o achado piscaria; `sonner` lazy exige fila de toasts e 12 testes mockam o módulo; `telemetry` é síncrono). **Próximo corte de verdade = partir o `App.tsx`** (ex.: handlers de masmorra/loja/guilda para hooks em chunk), tarefa própria com `Mapa` de dependências.
- **Service worker:** sem mudança. `/assets/*` é cache-first por nome com hash e não há lista de pré-cache de JS; os chunks novos entram no cache ao primeiro uso (e os `modulepreload` do HTML os trazem no 1º load). `CACHE_VERSION` não precisou de bump.

- **15/10/2026 — Demo do portfólio:** na demo a fila de apresentação é inerte (`readyFor`), vida/energia/fome ficam cheias (`keepDemoVitalsFull`), o avatar da Home vira botão de som (`DemoSoundButton`) e `page:settings` é bloqueada no `goTo`; a Corrida espelha arte de perfil esquerdo (`artFacesLeft`).


## 81. Novo onboarding: a Ambra, o ovo-cristal e o Soulmon guia (dono, por voz, 15/10/2026; revê o fim do §13.19 e o cadastro do nome da demo)

- **Pedido do dono (fluxo exato):** (1) marca os Termos e a Privacidade e avança; (2) a lhama **Ambra**, GRANDE, se apresenta como a intro de NPC ("Bem-vindo. Eu sou a Ambra. Aqui você vai encontrar as profundezas da sua alma e evoluir junto ao seu Soulmon. Vamos te conhecer primeiro."); (3) as perguntas de sempre; (4) no lugar da tela que revelava o Soulmon e perguntava "quer ele, o seu próprio ou testar": a tela do **ovo-cristal** — o cristal com a silhueta dentro, que balança a cada toque; com ~5 toques surgem **"Conhecer o seu Soulmon"** (primário, abre o modal de compra existente, sem confirmação) e **"Me empreste um Soulmon guia"** (secundário: os 5 iniciais; SÓ ele confirma — "Você tem certeza que quer experimentar o jogo na versão demo?", Sim/Voltar); (5) demo confirmada: a Ambra aparece de novo ("Muito bem! Você pode conhecer o seu Soulmon a qualquer momento. Bem-vindo.") e o app entra no jogo demo/gratuito; (6) comprou: os botões somem, fica **"Chocar"**, a luz branca nasce no meio, cobre a tela e faz fade out, e segue o caminho pago de sempre; (7) o Soulmon pago chega com **vida cheia, energia cheia e fome 0/3** (o relógio da fome conta já na chegada).
- **Decisões (a squad escolheu onde o pedido não fechou; o dono revê):**
  - **Arte do ovo = `placeholder/dormant.png`** (o cristal da Home com um ser adormecido dentro; `forming`, o aceso, entra a partir do 3º toque e na compra). Era o único asset que existe com "cristal + silhueta"; `fx/ovo-renascimento.png` (casulo de cristal com raízes, sem silhueta; é do Renascimento) ficou de reserva. Nenhuma arte nova.
  - **Onde cada peça mora:** a Ambra reutiliza `NpcSequence` (`FUNCTION_NPC_ART.onboarding`) em dois passos novos (`AMBRA_INTRO` -14, `AMBRA_DEMO` -15; telemetria 36/35). O ovo é `OnboardingOvo.tsx` (`OvoCristal`, `LuzBranca`, `useLuzDeChocar`) montado no passo `CHOICE_STEP` (-7), que era a escolha grátis/completo. A compra é o `UnlockAccountModal` (o mesmo do jogo: "Desbloquear", "Agora não", "Já comprei — restaurar", §49), com o motivo novo `ovo` (copy própria; na telemetria conta na faixa `revealDemo`, a casa que a tela substituiu, para o funil continuar comparável). A guarda "sem e-mail comprovado não se cobra" ficou (`abrirCompra`).
  - **"Demo/gratuito" = o caminho grátis de sempre** (`onComplete({ mode: 'demo' })`, conta e respostas preservadas, compra possível depois — "você pode conhecer o seu Soulmon a qualquer momento"), não a demo local do portão (`onStartDemo`, sem conta, sem compra). O guia entra com o nome dele: a tela de batismo da demo (`REGISTER`) saiu.
  - **Saíram:** a escolha "Começar agora — é grátis"/"Tenha seu próprio Soulmon", o REVEAL DEMO (leitura em silhueta + convite âmbar + "Continue with a demo character"), `REGISTER` e `handleUnlockFull`. O passo -4 ficou livre.
  - **Toque:** balanço por animação CSS reiniciada a cada toque (a `key` do invólucro; o botão não remonta e o foco fica), cristal mais claro a cada toque, `navigator.vibrate` (12 ms; 30 ms no 5º) como o resto do app. **`prefers-reduced-motion`:** sem balanço e sem vibração (fade curto); a luz vira fade branco simples (400 ms) em vez de expandir. Alvos >= 44 px; dica em `role=status`.
  - **A luz:** disco branco centrado que expande em 1,1 s até cobrir a tela; com ela toda branca troca para o ritual pago (passo 1, nome completo) e some em 0,8 s. Branco puro de propósito (efeito, não superfície).
  - **Vitais do Soulmon pago (`paidArrivalVitals`, `utils/hunger.ts`):** `energyPoints` = máximo do Rookie, `hunger = { v: 0, at: agora }` (nível 1/3 na tela, "faminto"; `starvingSince` = agora, então a regra de 12 h -> meio coração corre desde o nascimento), `energyClock` ancorado agora; HP já era cheio. Só o NASCIMENTO pago do onboarding (`handleCompleteOnboarding`); a demo (vitais cheios) e o upgrade de quem já jogava ("trocou de pele", D17) não mudam.
  - **Fila de modais:** a de apresentação fica inerte enquanto `!hasCompletedOnboarding` (`readyFor(demo || !hasCompletedOnboarding, ...)`): nenhum "visto" é gravado, nenhum voltar é tomado por item que não aparece. O "visto" do onboarding segue o de hoje (`ONBOARDING_COMPLETE`); a Ambra não grava nada (quem retoma de um passo já gravado não a revê).
- **Régua:** `SoulmonOnboarding.ovo.render.test.tsx` (novo) e os `SoulmonOnboarding.*`/`telemetryWiring` atualizados (helpers `test/metasOnboarding.ts` e `test/ovoOnboarding.ts`; `ritualDemo.ts` e `SoulmonOnboarding.gratis.render.test.tsx` removidos junto com as telas que cobriam).
- **Não verificado (sem navegador):** o balanço/expansão a olho e a 60 fps, o háptico no aparelho, o modal de compra na Play real e a tela da Ambra em telas estreitas. **Gatilho para rever:** o dono querer a demo local no lugar do grátis; o 1/3 (e não 0/3) da fome na tela; ovo com arte própria de "cristal meio ovo".

## 82. Revisão 2, faixa A: Home / Tarefas / Missões (dono, 18/10/2026)

- **A1:** na lista de HOJE, tocar em qualquer lugar da linha marca como feita (no pai com etapas, abre/fecha as etapas). O botão "Editar: nome" saiu da Home (`RitualRow`; só `editOnly` o desenha).
- **A2:** ao concluir, UM aviso só: `📋 N/M do dia`. O trecho "+1 comida" saiu de `announceTaskGains` (sem total do dia, nenhum aviso).
- **A3/A4:** o `View all` lista TODAS as tarefas e hábitos (antes só as programadas) e é o único lugar que edita. Ganhou busca por nome (sem acento/caixa), filtro Todas/Tarefas/Hábitos e ordem A-Z (`filterAndSortLines`).
- **A5:** `utils/missionOrder.ts` — prontas para resgatar no topo, depois concluídas, depois abertas (estável) em Diárias, Prédio, Primeiras vezes, Semanais e Conquistas.
- **A6:** com todas as Primeiras vezes resgatadas, a seção inteira some (`allFirstTimesClaimed`).
- **Régua:** `missionOrder.test.ts`, `DailyRituals.todas.render.test.tsx`, `RitualPanel.render.test.tsx`.
## 90. Faixa B da revisão 2: configurações, perfil, descanso, energia e modais (dono, 18/10/2026; `product/beta-play-01/CHECKLIST-REVISAO-2.md` B1–B11)

- **B1 Sono automático nasce LIGADO, 23h–7h:** `readFlagOr(chave, true)` (`utils/safeStorage.ts`) no efeito do App, na `SettingsPage` e no `RestSetupModal`; só um `'false'` gravado desliga. **B5:** o cartão `RestWindowCard` foi apagado; o único horário de sono é o do sono automático, e `rest.window` passou a SEGUIR esse horário (cópia no efeito do sono automático em `App`). Métrica de sono (constância, contagem de sonhos, switch "não quero ver métricas") saiu da tela; `rest.hideMetrics` segue no save sem leitor.
- **B2 (investigação, sem bug de código):** o pesadelo só abre se (a) existe a noite desta manhã em `rest.nights` com `onTime` verdadeiro (`nightmaresFor`), (b) o relógio está entre 4h e 12h, (c) o pet NÃO está dormindo e (d) o app foi aberto. A noite só é registrada quando `isSleeping` troca (botão ou sono automático) e `onTime` exigia deitar dentro de `rest.window`, que era um horário SEPARADO do sono automático (que também nascia desligado). Quem não pôs o pet para dormir, ou dormiu fora da janela, não tem pesadelo — por desenho (sem noite registrada = sem pesadelo e sem perda). B1+B5 fecham a brecha: o sono automático liga sozinho e a janela é a mesma dele.
- **B3** moldura de loja ganha botão "Comprar · N" (`FrameSelector`, `App.handleBuyFrame`: confere saldo, desconta Bits pagos primeiro, grava `ownedFrames`, equipa). Antes só havia a linha trancada com o preço, sem ação de compra. **B4:** `mealRhythm.push` nasce LIGADO (`DEFAULT_MEAL_RHYTHM`, `sanitizeMealRhythm`); o principal já nascia ligado (G6). **B7:** a virada do dia não zera mais a energia (`dailyReset.ts`; revoga a parte "zera todo dia" de §30/§40); a fome já caía por timestamp. **B8:** nome editável em Editar perfil (`ProfileEditor`, `App.handleChangeUserName`, 2–24 letras). **B9:** `MORNING_COMMITMENT_ENABLED = false` (o modal "Good morning / escolher o foco"); o de checkboxes é o `dayGoals`. **B10:** os balões de convite do pet (`refeicao`, `refugio`) saíram de `NOTICE_TOAST_KEYS`. **B11:** Faro, Sona e Tobi saíram (`FunctionNpcId` agora `onboarding | oraculo | cuidados`; PNGs `npc-conta/sono/config` apagados).
- **B6 (investigação):** passos = `@capgo/capacitor-pedometer` (Android `TYPE_STEP_COUNTER`), registrado no Gradle; só nativo, na PWA a `StepsCard` some. Monitoramento de SONO por sensor NÃO existe (decisão fechada contra Health Connect/Google Fit em `utils/steps.ts`): "dormir" é o estado do pet (botão ou horário). Falta validar em aparelho real.
## 92. Faixa C da revisão 2: Mochila com aba Materiais, Panora em Molduras/Backgrounds, Conquistas que compram, amigo pelo nome (dono, 18/10/2026; `product/beta-play-01/CHECKLIST-REVISAO-2.md`)

- **C1 Mochila:** três abas (Comida e chips · Especiais · **Materiais**). Os materiais saíram de Especiais para a própria aba (somente leitura, `×0` sempre visível, "Ir lá" igual). A arte vem de `components/MaterialIcon.tsx` (faixa D, D1); sem PNG cai no emoji.
- **C2 Mercado > Conquistas:** o cenário que a conquista libera mostra **cadeado** enquanto não resgatada e **Comprar · preço** (dois toques, como a prateleira) depois de resgatada; "Yours" se já comprado. Só no prédio Conquistas do Mercado (`shop` opcional); o "!" de Missões segue apontando o Mercado.
- **C3 Panora:** a lojinha `background` ganha as abas **Molduras / Backgrounds** e, dentro de cada uma, **Bits / Honra**. Molduras de loja (`origin: 'shop'`) compram por `utils/frameBuy.ts` (`handleFrameBuy` no `App`). Honra de moldura fica vazia: nenhuma custa Honra hoje.
- **C4 Soulsmith:** Upgrade à direita na linha do nome, atributos sob o nome, materiais sob o Upgrade; o texto "faltam materiais" saiu (os custos `0/N` já dizem; outras recusas, como Vínculo, seguem em texto).
- **C5 Masmorra:** o lobby perde o HP (a espera de recuperação segue como frase) e a linha de plano encurta para "Começa na camada N · dá para X agora"; o custo por camada e o teto do Lv continuam no "?".
- **C6 Biblioteca (Hall):** lista todo Soulmon já visto (inclusive NPC aberto) pelo nome da **criatura**, em ordem alfabética; a busca filtra por esse nome, localmente (o servidor é consultado sem termo).
- **C7 Amigos:** campo "Nome do amigo" + Adicionar (acha pelo diretório; exato primeiro, ambíguo pede o nome completo); o presente usa `volunteer_activism` em vez da moeda.
- **Régua:** `Mochila.render`, `ForgeCard.render`, `DungeonGame.energia.render`, `LibraryPage.amigos.render`, `MercadoC.render`, `frameBuy.test`.
## 88. Faixa D da revisão 2: materiais, Soulsmith por nível, Pesadelo sombrio, arte pintada sem serrilhado (dono, 18/10/2026; ver `product/beta-play-01/CHECKLIST-REVISAO-2.md`)

- **D1 — materiais:** 16 ícones pixel (64², alfa binário, Higgsfield `gpt_image_2_5` flare, `@char_sprite-style`) em `assets/soulmon/materiais/mat-<id>.png`. `components/MaterialIcon.tsx` os carrega sob demanda (fora do chunk de entrada) e cai no emoji se faltar; ligado no Soulsmith (`ForgeCard`). **Mochila (aba Materiais) ligada no rebase sobre a faixa C:** o ícone e o balão usam `<MaterialIcon>`; o mapa provisório `utils/materialArt.ts` (C1) foi removido.
- **D2 — Soulsmith por nível:** o sprite da peça troca a cada **3 níveis** (`utils/forgeVisual.ts`): 1–3 cobre (PNG original), 4–6 bronze, 7–9 prata, 10–12 núcleo dourado, **13–15 prismático** (definição minha para "o que vem depois do dourado"; trocável sem tocar no código, só a arte). 36 PNG novos `eq-<slot>-t<n>-n<2..5>.png` (96², derivados do original por referência, para manter a identidade da peça). Teste: toda peça × todo nível tem arte.
- **D3 — Pesadelo:** o convite é sombrio (cartão preto, contorno violeta), a sombra do pesadelo da noite (`dino-shadow-*`) grande com glitch + aberração cromática violeta/ciano em CSS (sem vermelho; `prefers-reduced-motion` desliga), o pet sai do convite. Sem "Agora não" (o × fecha). O botão "Ficar na frente dele / Stand in its way" virou "Encarar o pesadelo / Face the nightmare".
- **D4 — pixelado:** o `image-rendering: pixelated` herdado derretia a arte PINTADA 1200×648 reduzida em quadradinhos (visores do Bosque/Casa/Guerra da Guilda, cerimônia de marco, prateleiras de cenário, cenário da Home, postal da Travessia). A arte pintada agora é suavizada; os bichos continuam `pixelated` (`.sm2-grove-creature`).
- **D5 — esticado:** `GuerraVisor` usava `100% 100%` (esticava); agora `auto 100%` como os irmãos. O lightbox de cenário sem miniatura ganhou `cover`. **Não regerei os 44 cenários em retrato**: nenhum outro ponto estica de fato (os de combate já são 9:16) e trocar a arte vendida muda produto — ver "Dúvidas abertas".
- **D6 — tema:** Caderno (jornal) e Oficina (Foco) eram a casa do tinteiro escura e a torre branca do Akasha; viraram prédios novos no kit do Mapa (pedra petróleo, cobre, cristais turquesa, vinhas): scriptorium com livro aberto e pena, e oficina de ampulhetas de cristal. Os antigos ficam em disco.

## 93. Faixa E da revisão 2: nascimento ANTES do ovo-cristal e fome 0/3 na chegada paga (dono, 18/10/2026; complementa §81; `product/beta-play-01/CHECKLIST-REVISAO-2.md` E1/E2)
- **Decisão do dono (E1):** nome completo, data, hora e cidade de nascimento são perguntados ANTES da tela do ovo. Ordem nova: ... forças → ponto de partida → nome completo → data → hora → cidade → ovo-cristal. Depois do "Chocar" (luz branca) a tela vai DIRETO à geração/revelação — não há mais passo de dados depois do pagamento. Os ids dos passos (1–4, `CHOICE_STEP` -7) não mudaram, só a ordem em `next()`/`back()` (`SoulmonOnboarding.tsx`); do ovo volta-se à cidade, e do nome completo ao ponto de partida.
  - **Vale para os dois caminhos:** quem escolhe o Soulmon guia (demo) também já respondeu o nascimento (é a ordem única; o muro de 18+ da data passou a valer antes do ovo para todos). O ritual do upgrade (`mode="upgrade"`) e rascunhos antigos do ritual pago (`oracleDraft`, `flow === 'oracle'`) seguem o fluxo antigo (nascimento → perguntas → geração).
  - **Rascunho do portão** (`utils/gateDraft.ts`): passou a guardar `fullName`, `birthDate`, `birthDateText`, `birthTime`, `birthCity` e `timeUnknown` (opcionais na leitura, versão inalterada); `RITUAL_PAGO` (1–4) entrou em `PRE_ESCOLHA`, então quem fecha o app entre o ponto de partida e o ovo retoma no primeiro dado ainda faltando. Gate draft antigo parado no ovo (-7) retoma no nome completo.
  - **Telemetria:** os passos 1–4 agora saem com funil `unknown` (antes da escolha), como o resto do trecho anterior ao ovo.
- **E2 — fome 0/3:** `HungerIndicator` mostra o nível por `hungerDisplayLevel(tier, value)` (`utils/hunger.ts`): fome EXATAMENTE vazia (0, a chegada do Soulmon pago — `paidArrivalVitals`) mostra `0/3` ("nível 0 de 3"); qualquer fome > 0 segue com o piso 1/3. O tier, a arte "faminto" e a regra das 12 h não mudaram; `hungerLevelOf` (1..3) segue para os outros usos.
- **Régua:** `SoulmonOnboarding.*` e `telemetryWiring` atualizados (helper `responderNascimento` em `test/metasOnboarding.ts`; "Chocar" agora termina na geração), `energiaFome.render.test.tsx` (0/3 e piso 1/3) e `gateDraft.test.ts` (ida e volta do nascimento). **Não verificado (sem navegador):** o fluxo a olho e em tela estreita.
- **Fechamento da integração das faixas A–D (verificador, 18/10/2026):** a suíte cheia em `main` acusou 3 contratos quebrados pela faixa D, corrigidos aqui: (1) o CSS do glitch do pesadelo (`.nm-glitch*`) saiu do `<style>` inline de `NightmareBattle.tsx` para `src/index.css` (contrato de classes fantasma); (2) as caixas opacas de `exploracao:oficina` e `exploracao:caderno` (`areaLotGeometry.ts`) foram remedidas pelo alfa dos prédios repintados, e o lote do Caderno passou de 40% para 44% de largura (`playAreaLots.ts`) para a arte mais estreita continuar ≥ 24% da cena; (3) `forgeVisual.ts` e `MaterialIcon.tsx` entraram no manual (`06-REFERENCIA`). Na integração, a compra de moldura virou UM handler (`handleFrameBuy(id, equipar)` em `App.tsx`: Mercado C3 não equipa, Perfil/Torneio B3 equipa) e a Mochila (aba Materiais) usa `MaterialIcon`, sem o mapa provisório `utils/materialArt.ts`.

## 94. Ajustes da revisão 2: permissão na 1ª abertura, cenário de combate suave, sem cartão de refeição (dono, 18/10/2026; `product/beta-play-01/CHECKLIST-REVISAO-2.md` B4/B10/D4)

- **B4:** confirmado o que já existe: pedido nativo de notificação na primeira abertura (APK direto; web no primeiro toque) e, concedido, o interruptor geral liga; os de refeição nascem ligados. Sem permissão do sistema o interruptor não pode estar ligado de verdade.
- **D4:** o cenário pintado de combate (`BattleStage`, `data-stage-scene`) deixou de forçar `image-rendering: pixelated`; sprites, glifos e efeitos seguem pixelados.
- **B10:** o cartão-convite de refeição (`MealInviteCard`, aviso `refeicao` da fila do App) foi removido; ele agia como a notificação "o pet tem algo pra você". Os lembretes agendados (push) seguem. `openBackpackSignal` e `atenderRefeicao` ficam (outros usos).


## 95. Cenários em retrato só para os fundos fora do cenário equipado (dono, 18/10/2026; complementa §88 D5)
- **Decisão do dono:** não regerar os cenários equipáveis/vendidos. Masmorra, batalha, pesadelo, minigame e torneio já são 9:16. Regerados em retrato (Higgsfield `gpt_image_2_5` flare medium, 9:16, referência = a paisagem, ~0,5 crédito cada, 4 no total) apenas os 8 pintados usados fora do cenário equipado: `bg-campina`, `bg-cavernas` (postais da Travessia), `bg-guild-{clareira,ramagem,copa,mata,bosque-antigo}` (Bosque/Casa/cerimônia) e `bg-arena-spotlight` (Guerra).
- **Arquivos:** `assets/backgrounds/bg-<id>-portrait.webp` (608×1080, WebP q80, 50–89 KB). As paisagens ficam. `utils/backgroundPortrait.ts` (`sceneCss(id, w, h)`) devolve o retrato quando a caixa é vertical e ele existe; senão a paisagem. Ligado em `GroveVisor`, `CasaVisor`, `GroveMilestoneCeremony`, `GuerraVisor` e `RegionPostal`.
- **Limite honesto:** todas as caixas atuais desses pontos são horizontais (visores 176 de altura em largura cheia, cerimônia 208×144, postal 56×44), então hoje a paisagem segue valendo na tela. O retrato entra quando houver caixa vertical. O chão foi pedido em ~74% no prompt, mas não foi medido na arte.

## 96. Guard-rail G-01: perguntar sempre antes de reduzir o impacto das tarefas do dia a dia (dono, 18/10/2026; `Core/contextos/soulmon/demandas/2026-10-18-minijogos-e-cla.md` G-01)
- **Regra permanente:** todo pedido que diminua o impacto de o usuário completar tarefas do dia a dia (ex.: vender alimentos, presente que dá comida/chip, fruto que substitui comida) é perguntado ao dono antes de ser feito, mesmo que o pedido pareça claro.
- **Se o dono permitir:** vira "perdão extra" — raro e caro por design (peso baixo em sorteio, custo alto em loja, nunca substitui a tarefa).
- **Alternativa que perdeu:** tratar cada caso como ajuste de balanço sem perguntar. Perdeu porque o laço tarefa→cuidado é a aposta central do jogo.
- **Aplicação:** todo Registro de Demanda tem a seção "Checagem G-01". Primeiros casos: D-10 (chip/comida raros no presente), D-16/D-17 (fruto = bônus leve, não substitui comida).
- **O que falsificaria:** jogadores que completam menos tarefas reais depois de um "perdão extra" entrar no ar.

## 97. Cenário nunca estica nem deixa vão: `cover` + `center bottom`, sem repetir (dono, 18/10/2026)
- **Auditoria:** masmorra, batalha (BattleStage/elemento), Pesadelo, Arena, Torneio, Dino e minigames já usavam `center/cover` (arte 9:16 sem distorção; medido: cover escala uniforme, sem `100% 100%`/`fill`). O vão estava nos visores que usavam `auto 100%`: a arte 1,85:1 na altura da caixa (150-176px) mede 277-326px, menor que a largura de 360-430 — sobrava faixa de cor nas laterais.
- **Decisão:** Home (CompanionHUD, inclusive sem `baseColor`, que antes herdava `repeat`), Casa, Bosque, Cerimônia do Bosque, Guerra, Mistério, Plantio, Praça e Feira passam a `center bottom / cover no-repeat`. O chão fica ancorado embaixo; até 462px de largura é idêntico ao `auto 100%` da Home.
- **Alternativa que perdeu:** `auto 100%` com cor de base (deixa vão em telas largas).
- **O que falsificaria:** corte do topo da arte esconder algo importante num visor largo (>462px).

## 98. Beta-full: e-mail da `BETA_EMAILS` entra como plano pago, sem compra (dono, 18/10/2026)
- **Decisão:** quem está na allowlist `BETA_EMAILS` (e-mail verificado) tem a versão cheia — Soulmon próprio pelo ritual do oráculo, não o guia/demo — sem passar pela compra. Antes, `BETA_EMAILS` só liberava acesso/IA.
- **Como:** `functions/api/_betaFull.js › verifiedBetaFull` (mesmo desenho do admin): ID token verificado (`email_verified`), mesma régua/parse da allowlist (`canonBetaEmail`/`parseBetaEmails`), token do dono do save. DERIVADO NA LEITURA, nunca gravado em `ent:` — tirar da lista revoga; restaurar/reconciliar compra não revoga nem duplica; compra real depois soma sem conflito. `GET /api/entitlements` (e as respostas de `spend`, save GET, compra/restauração) devolvem `tier:'paid'`, `provider:'beta'`, `betaFull:true`, créditos reais. `GET /api/entitlements?action=beta-full` (sem id, só token) serve a tela do ovo antes do save existir. Também vale em `generate-sprite`, cota de chat paga (`_aiGuard`) e `rebirth-reset`.
- **Cliente:** na tela do ovo o `SoulmonOnboarding` pergunta `fetchBetaFull()`; true = ovo "comprado" (só "Chocar" → ritual completo), sem modal de compra nem guia, sem evento `purchase`. Usuário existente em demo/guia: a sincronização de entitlement troca `accountTier` para `paid` e o save fica intacto; ele vê o convite "revelar" (ritual de upgrade) no Laboratório, como quem comprou.
- **Alternativa que perdeu:** gravar um pedido `beta:*` em `ent:` (como a cortesia) — exigiria escrita/limpeza e não revogaria sozinho ao sair da lista.
- **Limite honesto:** o ritual gera sprite de IA; o teto por conta/global de `_aiGuard` continua valendo. Nada de segredo no cliente; nenhum log com e-mail.
- **O que falsificaria:** testador beta pago de verdade ter a compra duplicada/estornada por sobreposição (coberto em `betaFull.test.js`).

## 99. Frente S — sono e pesadelo: noite armada, horário obrigatório, sem interruptor, bônus de manhã (dono, 18/10/2026; D-23/D-24/D-26/D-37)
- **D-23 (bug):** o lembrete de deitar abre o app ~30 min ANTES da janela; o sono automático só age dentro dela; fechado o app, a noite nunca era gravada e de manhã não havia pesadelo. Agora abrir o app no período do lembrete (`isInArmPeriod`) grava a marca `NIGHT_ARMED_AT`; na abertura seguinte, passado o fim da janela, `decideArmedNight` manda gravar a noite com o início NOMINAL da janela (`onTime` true), idempotente por manhã e sem sobrescrever registro real. Também: pet salvo dormindo e app aberto FORA da janela agora acorda quando o sono começou dentro dela (`shouldWakeOnOpen`; sesta manual não é desfeita) e a noite é gravada com o fim da janela como despertar (`nightWakeAt`). Marca com mais de 24 h do fim da janela é só descartada.
- **D-24:** o horário de dormir/acordar é OBRIGATÓRIO. Campo `rest.windowConfirmed` (migração `=== true`, save antigo = false). O intersticial `restSetup` fica pronto enquanto não confirmado (jogador novo, depois do tour, e save antigo), sem X nem Esc, e só fecha em "Confirmar". Posição na fila inalterada (13).
- **D-25/D-26:** o interruptor do sono automático saiu de Configurações e do convite; o sono automático é sempre ativo (a chave `AUTO_SLEEP_ENABLED` não é mais lida). Os horários seguem editáveis. O lembrete de deitar ganhou switch próprio (`SLEEP_REMINDER_ENABLED`, padrão ligado) com texto honesto: sem ele a noite pode não ser registrada e o pesadelo da manhã não aparece.
- **D-37:** noite `onTime` de hoje rende `NIGHT_ENERGY_BONUS` (1) de energia de manhã, 1×/dia (`rest.nightBonusDay`, no save), limitada ao teto do estágio (`nightEnergyGain`). Sem noite: nada, e nada diminui.
- **Alternativa que perdeu:** só avisar mais cedo/insistir no push (não resolve app fechado) e manter o sono automático opcional (reabre o furo de a noite sumir por configuração).
- **O que falsificaria:** noites armadas gravadas sem a pessoa ter dormido (pesadelo aparecendo para quem ficou acordada com o app fechado) inflando a constância; ou queda de quem desiste do onboarding por causa do passo obrigatório.
- **Presunção assumida (D-23):** armar sem dormir é aceito — sem sensor, a abertura no período do lembrete conta como intenção de deitar, e a dúvida vai a favor do jogador (a pior consequência é um pesadelo e 1 de energia a mais, nunca perda). A marca guarda a janela de quando armou (`{at,start,end}`), então editar o horário depois não perde nem fabrica noite. **Falsificaria:** muitas noites `onTime` com `sleptAt` nominal em quem comprovadamente não dormiu (ex.: pet acordado no app às 23h30 dentro da janela, sem transição de sono) inflando a constância e a raridade dos sonhos.

## 100. Pacote definitivo `com.soulmon` (dono, 18/10/2026; substitui `com.hexervoodoom.soulmon`)
- **Decisão:** o app foi criado na Play Console com `com.soulmon` (o antigo ficou reservado/indisponível). `applicationId`, `namespace`, `package` Java/Kotlin (`android/app/src/main/java/com/soulmon/`), `capacitor.config.json`, `strings.xml`, assetlinks (`public/.well-known` e `DEFAULT_PACKAGE` em `functions/.well-known/assetlinks.json.js`), `ANDROID_PACKAGE`, action do widget, `apk-smoke.sh`, testes e docs foram renomeados. `desktop/package.json` `appId` virou `com.soulmon.desktop`. `versionCode` 18 -> 19.
- **TODO do dono (NÃO inventado):** `android/app/google-services.json` continua com `com.hexervoodoom.soulmon` até o dono baixar o novo: Firebase `soulmon-app` > Adicionar app Android `com.soulmon` > SHA-1 e SHA-256 da chave de UPLOAD e da Play App Signing > baixar `google-services.json` e substituir (também em `E:\soulmon-release\android\app\`). Sem isso o Gradle falha com `No matching client found for package name 'com.soulmon'`. Secrets: `ANDROID_PACKAGE_NAME=com.soulmon` e `ASSETLINKS_SHA256` (SHA-256 da Play App Signing).
- **`dist/` não regenerado** (o assetlinks/worker de lá ainda carrega o pacote antigo até o próximo build de integração).
- **O que falsificaria:** assetlinks apontando para pacote errado em produção (App Links não verificam) ou push/login Google quebrados por `google-services.json` antigo.

## 101. Frente P — o lembrete de deitar vira push de verdade (dono, 18/10/2026)
- **Decisão do dono:** "Fazer o push de verdade" — o lembrete de deitar abre o app mesmo com o app fechado, sem sensor. Complementa o §99 (a noite só é armada se o app for aberto no período do lembrete).
- **Como:** a inscrição (Web Push e FCM, mesma KV `PUSH_SUBSCRIPTIONS`) ganha `sleep: {s, tz}` só quando há janela E `SLEEP_REMINDER_ENABLED` não é `false`; desligar reenvia sem o campo e o servidor o apaga. O worker, na passada de 30 min já existente (`MEAL_TICK_CRON`), envia `sleepReminderCopy` no tick `floor((s−30)/30)×30` do fuso da inscrição, com a mesma tag do lembrete local. Às 22h BRT o boa-noite cede a quem tem `sleep` (não somar duas visitas noturnas); o teto `PUSH_DAILY_CAP` não muda. D0 não recebe.
- **Alternativa que perdeu:** cron dedicado por minuto (custo 48× maior sem ganho real) e AlarmManager nativo (não cobre PWA/web).
- **Limite honesto:** o servidor não sabe se o pet já dorme; quem deitou cedo ainda recebe o push (tag funde com o local). Fuso é o do último reenvio (horário de verão desliza até abrir o app). Worker é deploy manual.
- **O que falsificaria:** queda de aberturas no período do lembrete depois do deploy, ou pedidos para desligar o lembrete por incômodo acima dos das refeições.

## 102. Músicas de combate: dungeon theme na Masmorra, pvp theme no Duelo e no Torneio, interruptor nasce ligado (dono, 19/10/2026)
- **Decisão:** ⚠️ 19/10/2026: as faixas deste item foram substituídas pela §126. Pedido do dono: incluir no jogo a "dungeon theme" e a "pvp theme". Masmorra toca o "dungeon theme"; Duelo (luta ranqueada e treino) e lobby do Torneio tocam o "pvp theme"; a Arena livre (PvE) segue com a faixa derivada; o Pesadelo segue com o terror. O interruptor "Música de combate" / "Combat music" (mesma chave `SOUND_TRACK_ENABLED`) agora NASCE LIGADO; quem gravou `false` continua desligado. Continua só depois de gesto (D11): o primeiro gesto sonoro dá o consentimento sem gravar a preferência.
- **Como:** `utils/streamMusica.ts` (NOVO) é o player de `<audio>` em streaming extraído do `tema.ts` (um dono); `utils/musicaDeCombate.ts` (NOVO) guarda o estado das faixas no `busTrilha`; manifesto `MUSICAS_DE_COMBATE` em `sonsAssets.ts`; `musica.ts` ganha as superfícies `torneio` (lobby, NÃO é combate: sem o −3 dB) e `duelo` (combate). Arquivos mestrados em −28,0 LUFS-S (ganho único; fade-out de 3 s só no pvp), 2 formatos cada. Medidas e bytes em `SOM.md` §11; procedência em `Attributions.md`.
- **O que revoga:** (1) o "nasce desligada" da S2 para as faixas de combate; (2) o loop procedural como música da masmorra (a faixa `masmorra` do loop em `trilha.ts` ficou sem chamador no diretor); (3) **consequência decidida pelo orquestrador, a confirmar com o dono:** o legado "tema desligado + só o loop ligado → loop na Home" SAIU, porque com o interruptor nascendo ligado quem desligou o tema passaria a ouvir o loop na Home sem pedir. Home = tema ou silêncio.
- **Alternativa que perdeu:** manter o loop procedural na masmorra e o interruptor nascendo desligado (preservava a S2 e o legado da Home, mas deixava as faixas pedidas pelo dono mudas até alguém achar a chave).
- **Limite honesto:** as duas faixas são do Suno plano Free, **sem direito comercial**: isto bloqueia publicar na loja com elas dentro (mesma situação do tema). Falta o gate humano de escuta (S8): nível relativo, transição e o fade de 3 s do pvp são de medição, não de ouvido. ~8,8 MB novos no repo (`public/` + `dist/`, que é commitado).
- **Gatilho de revisão / O que falsificaria:** a escuta do dono (S8) reprovar nível ou transição; a licença não ser resolvida antes da loja; ou o dono não confirmar a saída do legado da Home.

## 103. Combina 3: o inimigo mexe as peças, 4+ dá rodada extra e a dica custa Bits (dono, 19/10/2026; D-83/D-84/D-85)
- **Decisão do dono:** (D-83) os Soulmon inimigos também MEXEM AS PEÇAS: a cada vez do inimigo, UMA troca só (o da frente joga), no mesmo tabuleiro, e os combos dele tiram HP do jogador. (D-84) combinação de 4+ peças dá RODADA EXTRA em vez de passar a vez — vale para o jogador **e** para o inimigo. (D-85) botão de dica: 3 usos por partida e, acabados, mais usos comprados com Bits dentro da partida.
- **Como (dono: `utils/match3Combat.ts`, puro e determinístico):** a escolha do inimigo é `chooseMove` — a troca que mais pontua medida com uma sonda de semente FIXA, empate = a primeira na ordem de `validMoves`; sem sorte escondida (a cascata real usa o rng do tabuleiro, como a do jogador). A dica é a MESMA função aplicada ao tabuleiro do jogador. O dano do inimigo usa a fórmula do jogador (peças × `M3C_DMG_PER_TILE` × cascata) × `M3C_ENEMY_DMG_FACTOR`. Rodada extra = `grantsExtraTurn` (nasceu peça especial, isto é, linha de 4+); **não consome turno** (`turns` só conta jogadas que passam a vez) e o inimigo não joga; teto `M3C_MAX_STREAK` = 3 jogadas seguidas por lado (suposição declarada do agente; a 3ª passa a vez mesmo com 4+).
- **Suposições do agente (o dono ajusta):** (1) `M3C_ENEMY_DMG_FACTOR` = 0,2 e `M3C_PLAYER_HP` 330 → 520: com o dano cru (×1) o inimigo, que joga sempre a melhor troca, tirava ~90 de HP por vez e o jogador comum nunca vencia (0/41 na simulação); com 0,2/520 o típico vence ~78% em ~18 turnos e o experiente ~100% em ~11. (2) `M3_POINTS_PER_BIT` 250 → 130: o placar (dano − recebido + bônus) caiu com o combate mais longo e a régua `balanco.test.ts` (2,5–9 Bits/min típico, ≤ 13 experiente) pedia o recalibre; o modelo de tempo ganhou 2 s por troca inimiga. O teto `M3_MAX_BITS` (8) e o funil/teto diário não mudam. (3) Dica: `M3_HINTS_PER_GAME` = 3, `M3_HINT_PRICE_BITS` = 3 (barato: uma rodada típica rende ~3 Bits; a Loja começa em 100). A compra usa a via de gasto já existente (`play.onSpendBits` → `spendBits`, o app confere o saldo sobre o `prev`); 2 toques (pedir + confirmar); sem saldo o botão fica desabilitado com o preço visível; nada de Créditos/Honra.
- **Alternativa que perdeu:** inimigo passivo com dano fixo por resposta (o desenho de 18/10/2026) e a vez que sempre alterna (sem rodada extra).
- **O que falsificaria:** o combate ficar injusto (jogador comum perdendo quase sempre) ou longo demais (turnos medianos > 25) — a régua `match3Combat.test.ts` (balanço) e `balanco.test.ts` reprovam antes; ou Bits do Combina 3 virando "o jogo de fazer Bits" (a mesma régua).


## 104. Reorganização das áreas: Biblioteca e Amigos vão do Hall para o Laboratório; o Hall fica com Feira, Clan Hall e Grove (dono, 19/10/2026; D-50, com D-44/D-47)
- **Decisão do dono:** "o friend circle sai da Guilda e a biblioteca também — ambos vão para o Laboratório. No Clan Hall (Guilda) ficam três prédios: Feira, Clan Hall e Grove". O Clan Hall é a parte administrativa do clã; o nome "Hall" da área fica. A Biblioteca tem que aparecer inteira na primeira tela do Laboratório (D-47) e o Perfil fica ~15% maior (D-44).
- **Como:** `areaSheetCopy.ts`: Hall = [feira, grove, guilda] (um por plataforma do fundo), Laboratório = [evolucao, pet, stats, perfil, biblioteca, amigos]. Ids de prédio: `hall.biblioteca` → `laboratorio.biblioteca`, `hall.amigos` → `laboratorio.amigos`; novo `hall.grove` (abre a sala do bosque do `GuildSheet`, `room="grove"`; sem missão, sem material, sem primeira vez; Vínculo 4 como o Clan Hall). O Vínculo de Biblioteca/Amigos não muda (2). **Migração do save sem chave nova:** `gates.ts › MOVED_BUILDINGS/currentBuildingId`, aplicado na leitura por `sanitizeBuildingQuests`, `sanitizeBuildingIntrosSeen` e `sanitizeFirstTimes` (`visit:*`) — progresso, estoque e "já visto" seguem; idempotente (rodar 2× é no-op); o servidor espelha em `_gates.js`/`_buildingQuests.js`/`_dailyMissions.js`. Atalhos e missões (`d-amigo`, `friend-visit`, "Ir lá") apontam para o Laboratório; `buildingDestination` também resolve o id antigo. Biblioteca e Amigos seguem bloqueados na demo (`DEMO_BLOCKED_LOTS.laboratorio`). Arte: reaproveitada (Biblioteca e Amigos mantêm a deles; o Grove usa `lote-hall-amigos-campina` e o busto do Ramo, que estavam em disco) — a arte nova é outra onda.
- **Alternativa que perdeu:** manter Biblioteca e Amigos no Hall (4 prédios, a Feira espremida entre eles).
- **Suposição do agente (o dono ajusta):** como o prédio mais cedo do Hall agora é o Clan Hall/Grove (Vínculo 4) e a Feira (Vínculo 5), a ÁREA Hall só abre no Vínculo 4 (antes, 2 pela Biblioteca); o Laboratório, que já abria no 1, segue igual.
- **O que falsificaria:** o jogador não achar mais a Biblioteca (o guard de 360×640 e o cartão do tour do mapa a mostram no Laboratório; se a telemetria de visitas à Biblioteca cair, a aposta falhou), ou a ÁREA Hall ficar vazia/trancada demais para quem está no Vínculo 2–3.

## 105. Bits ganha ícone no app todo — revoga a D-L11 "Bits sem ícone" (dono, 19/10/2026; D-62/D-63/D-25/D-71)
- **Decisão do dono (modal, 19/10/2026):** o Bits ganha ícone em TODO o app. Isto REVOGA a D-L11 do canvas Loja e a linha 💠 do CLAUDE.md que mandava exibir Bits "sem ícone, só número + Bits". A regra "as três moedas (Bits, Honra, Créditos) nunca se misturam visualmente" CONTINUA valendo.
- **Como:** `components/ui/BitsAmount.tsx` é o único jeito de mostrar valor em Bits (`BitsIcon` + número em `bitsStyle`; o nome "Bits" vira texto só para leitor de tela). `components/ui/RewardLine.tsx` mostra recompensa em ícones (Bits, `bolt` de energia, `favorite` de coração) com nome em texto para leitor de tela — usada na vitória do pesadelo. No Mercado, a 2ª fileira (moeda) virou PÍLULAS com ícone: "Bits" (moeda própria) e "Honor" (medalha dourada) (`CurrencyPills`). Os sítios que mostravam "N Bits" ao lado de número (minijogos, Masmorra, folhas do Salão, mapa, molduras, Forja) passaram pelo componente; frases corridas (ajuda, avisos de recusa, Talentos) seguem com a palavra "Bits".
- **Alternativa que perdeu:** "Bits só número + fonte de calculadora, sem ícone" (D-L11).
- **O que falsificaria:** jogadores confundirem Bits com Honra nas pílulas/preços (mesmo ícone ou cor lidos como iguais), ou o ícone pequeno (12–16 px) ilegível em tela real. Testes travam: Bits sempre pelo componente; Bits e Honra nunca com o mesmo ícone/cor.

## 106. Missão especial diária: passos (só com sensor) ou deitar na janela, pesa 1 hábito no gauge, fora do selo (dono, 19/10/2026; D-39..D-47)
- **Decisão:** 1 missão especial por dia (`SPECIAL_MISSIONS_PER_DAY`). Com sensor de passos e consentimento, alterna por paridade do dia entre `steps` e `rest`. Sem sensor, a de passos some e a do dia é sempre `rest` (Q2, D-43). Passos seguem pelo sensor atual (`@capgo/capacitor-pedometer`, Android nativo); sem Health Connect, sem Google Fit (Q1, D-40). A meta TRAVA NO DIA: `goal` no estado, gravada na primeira avaliação do dia do jogador; trocar no `StepsCard` vale a partir do dia seguinte. Meta de passos escolhida pelo jogador: 3000, 5000, 7000 ou 10000 (padrão `DEFAULT_STEP_GOAL` = 7000, clamp 1000..30000). "Dormir X horas" virou "deitar na sua janela": vale a noite com manhã no dia (`RestNight.date`) e `onTime`. Sem duração, sem sensor; noite sem registro é neutra.
- **Como:** `utils/specialMissions.ts` (funções puras). `resolveSpecialMission` roda em efeito do App e devolve a mesma referência se nada mudou. O App só cria a missão do dia depois que a sondagem do sensor (disponível e permissão) resolveu; enquanto está pendente, não cria (evita travar em descanso no Android). Peso: UM hábito (`HABIT_WEIGHT` = 1), só no gauge de evolução, creditado na virada (`computeDailyReset`) como BÔNUS ACIMA do teto diário do gauge (`specialMissionGaugeBonus`, no máximo 1). Anti-duplo: `doneDays` / `creditedDays` (listas de até 7 dias; o bônus não se perde se o dia seguinte resolver antes da virada). Descanso exige que a noite tenha começado na véspera (`morningKey` do `sleptAt`): cochilo dentro da janela no próprio dia não conta. Fora do selo "dia completo", de `perfectDays`/`totalPerfectDays`/`missionPerfectDays`, dos Bits do dia, de coração/HP e de `dailyGoalFor`/`registeredForDay`. Sem punição: não fazer é zero perda. UI: cartão calmo "Especial do dia" / "Today's special" na folha Missões, aba Diárias, acima de "Hoje", usando `MissionCard` em modo `quiet` (sem "!", rótulo "Feita"/"Done", recompensa visível), sem resgate, sem som, não é modal e não entra na fila. A meta se escolhe no `StepsCard` (Configurações). Ajuda no `HelpModal`.
- **O que revoga:** em parte, a regra 2 de `utils/steps.ts` ("quem não tem sensor não pode ficar em desvantagem estrutural"; uma recompensa só alcançável com sensor era proibida): agora a missão de passos existe só com sensor. O teto ficou igual para os dois grupos (1 missão/dia, mesmo peso); só o caminho difere.
- **Alternativa que perdeu:** (Q2, era a RECOMENDADA) missão equivalente declarada para a PWA. (Q3) (a) bônus DENTRO do teto: substituiria uma tarefa real no gauge, fere G-01 (§96); (b) somar ao "feito" do selo: contaria para completude, contra o pedido. (Meta) meta livre durante o dia (baixar a meta à tarde cumpriria a missão na hora).
- **Limite honesto:** a recompensa é local ao save. `evolutionPoints` já é escrito pelo cliente e o servidor (`functions/api/save.js`) não valida o gauge; `specialMission` é saneado no load (`sanitizeSpecialMission`) e o servidor o guarda opaco. Passo forjado (sacudir o celular) rende no máximo +1/dia, o mesmo que deitar na janela. Anti-exploit: dia do jogador (`playerDayKey`, o mesmo relógio da virada), teto 1/dia, prêmio pequeno. Dados: só o agregado diário de passos (já existia); campos novos `specialMission` e `stepGoal`; nenhum dado de saúde novo; Data Safety inalterado.
- **Gatilho de revisão / O que falsificaria:** (1) o dono responder "acima" ou "dentro" do teto; (2) a maioria dos jogadores com sensor fazer só a de passos e evoluir visivelmente mais rápido que a PWA; (3) Health Connect entrar em pauta; (4) jogadores reclamando que a troca de meta 'não pegou' no mesmo dia.
- **Decisões do dono (19/10/2026, depois do PR #412):** (1) +1 ACIMA do teto do gauge, como está; (2) a meta de passos TRAVA NO DIA; (3) a missão NÃO exige tarefa real feita no dia.


## 110. Acordar o Soulmon: na 1ª abertura de CADA dia ele dorme e é acordado com um toque (dono, modal, 19/10/2026; D-66, K-20)
- **Decisão do dono (R1):** "o Soulmon dorme e precisa ser ACORDADO na 1ª abertura de CADA dia, para todos; a noite continua neutra (sem punição)". O gesto de acordar NÃO é modal: é o botão "Acordar" que já existe no deck (o mesmo do sono manual), 1 toque, MUDO (superfície nova nasce muda; o despertar também).
- **Como:** `utils/dayWake.ts` (regra pura) + a marca local `STORAGE_KEYS.DAY_WOKE` (dia do jogador em que foi acordado, neste aparelho). Sem a marca de hoje, a Home DESENHA o pet dormindo (`isSleeping || dayWakePending` só no `CompanionHUD`) e a fila segura o início de dia (`holdDayStart`). Quem acabou de nascer (dia 1) e quem ainda não passou do onboarding não dormem.
- **K-20 (provado em teste, `dayWake.test.ts`):** é estado de APRESENTAÇÃO, não de sono. O dreno do cocô (`applyPoopDrain`), o cocô (`useCareSystem`), a `NotificationManager` e a janela de descanso (`recordNight`, dream/nightmare) seguem lendo o `isSleeping` REAL; acordar não grava noite, não paga Vínculo e não toca o save; não acordar não cobra nada. "Noite sem registro é neutra" e "nunca cobrador" ficam intactos. O pet "dormindo para acordar" não mostra cocô (como já era dormindo), e o gesto, se o pet NÃO dorme de verdade, não o deita.
- **Alternativa que perdeu:** dormir só quem usa a janela de descanso (o sono já existente, manual + automático, sem despertar obrigatório para os outros). Perdeu porque o dono quer o despertar como o 1º gesto do dia para TODOS (é o gatilho do pesadelo e do início de dia).
- **O que falsificaria:** queda de uso na 1ª abertura do dia (menos gente chegando à Home com a lista do dia depois da 1ª abertura; mais "abre e fecha" sem concluir nada) — se o gesto extra pesar, a aposta falhou e o despertar vira opt-in.

## 111. Início de dia: ordem fixa e TETO de 3 modais; "Hoje" fundido; humor no resumo; o que sai do início de dia (dono, modal, 19/10/2026; D-64, D-68, R2)
- **Decisão do dono (R2):** ordem aprovada, TETO de 3 modais: (0) pet dormindo na Home (gesto, não modal); (1) pesadelo, ou o sonho no lugar (nunca os dois); (2) resumo de ontem COM o humor, numa tela só; (3) "Hoje" — `dayGoals` e `checkIn` FUNDIDOS num modal. As celebrações (`levelUp`, `evolveTask`, `groveMilestone`) vêm DEPOIS ou na próxima abertura; convites e configuração (`catalogLevelInvite`, `restSetup`, o priming de push e o `welcome` ocioso) SAEM do início de dia.
- **Como:** `PRESENTATION_ORDER` reordenada e as regras puras em `utils/presentationQueue.ts` (`START_OF_DAY_MODAL_CAP`, `DAY_START_IDS`, `CELEBRATION_IDS`, `INVITE_IDS`, `ctx.shown` = o que já foi mostrado NESTA abertura): pesadelo OU sonho (o sonho ainda é coletado no dex; só o modal cede), o `checkIn` só entra sem o "Hoje", celebração só se sobrar vaga no teto, convite/config só numa abertura sem início de dia. "Hoje" = `DayGoalsModal` com `fuse`: as tarefas marcadas viram o foco (até 3, ontem primeiro), a oferta de 5 minutos continua, "Hoje não, obrigado" sempre visível. O humor sobe para o resumo de ontem e deixa de ser pedido numa 3ª tela. Nada é perdido: cada item só marca "visto" ao ser MOSTRADO, então o que foi adiado volta na próxima abertura.
- **Perdas conscientes na fusão (cópia mínima):** o aviso gentil de "carga alta" e a lista "ficou de ontem" do check-in antigo não existem no "Hoje" (a pendência de ontem segue priorizando o foco). O `MorningCheckIn` continua só como fallback sem plano do dia.
- **Alternativa que perdeu:** manter a ordem antiga (level-up primeiro, sonho/pesadelo no fim, metas e compromisso em dois modais, humor em 2 lugares) — 5 a 8 modais "muito confusos" na mesma abertura.
- **O que falsificaria:** o adiamento das celebrações esfriar o level-up (o jogador subir de nível e só ver a celebração no dia seguinte e reclamar), ou menos gente confirmando o "Hoje" que confirmava as metas+compromisso separados (taxa de confirmação do "Hoje" abaixo da soma antiga).

## 112. Até acordar, só o PET e os JOGOS param; concluir tarefa/hábito nunca (dono, modal, 19/10/2026; D-67, R3, G-01)
- **Decisão do dono (R3):** até acordar o Soulmon ficam BLOQUEADAS só as ações do pet e dos jogos (aviso curto + atalho "Acordar"); concluir tarefa/hábito SEMPRE funciona, em todo lugar (app, widget Android, overlay desktop) e acorda o Soulmon sozinho. O aviso não usa palavra de culpa/medo/cobrança ("Acorde o Soulmon primeiro." / "Wake your Soulmon first."), sem número, sem custo.
- **Como:** lista EXATA em `WAKE_BLOCKED_ACTIONS`: alimentar, banho, carinho, brincar (`feed/shower/pet/play`) + Masmorra e minijogos do Salão e do Ateliê da Mente (`masmorra, dino, ppt, match3, eco, bolhas, troca, picross, revisao`). Fora da lista: tarefa/hábito/passos (`WAKE_NEVER_BLOCKED`), navegar, criar/editar, o Refúgio (não paga nem pontua) e a Arena/Torneio (PvP; não estão na lista do dono). Concluir acorda por `didCompleteToday(save)`: o widget e o overlay de desktop concluem sem abrir a Home e escrevem no mesmo save, então nunca consultam o bloqueio (travado em teste). G-01 respeitado: nada reduz nem adia o impacto de completar tarefa.
- **Alternativa que perdeu:** bloquear TUDO até acordar, inclusive concluir tarefa (o texto original do dono: "não pode fazer nada"). Perdeu na R3: reduziria/adiaria o impacto de tarefa (G-01) e o widget/desktop não teriam como bloquear sem regra nova no save.
- **O que falsificaria:** jogador reclamar que o aviso "trava" o app (muitos toques no aviso sem acordar) ou a lista deixar de fora uma ação de pet/jogo que o dono considera bloqueada (a Arena/Torneio, o Refúgio): a lista é decisão do dono e muda numa linha.

## 113. Push ligado por padrão; push de fome (faixa mediana), energia cheia e cocô; progresso 1×/dia; teto de 4/dia com prioridade (dono, modais de 19/10/2026; D-01..D-04, D-06, K-1..K-4, P2, P3, P4)

- **D-01 — notificações por padrão.** Save novo nasce com notificações e o push das refeições LIGADOS; a permissão do SO é pedida 1× (Android 13+/web exigem o pedido: não dá para ser silencioso), na primeira abertura, como o §94/B4 já fazia. **Revoga** o "começa desligado" do §28.4 (o comentário de `mealRhythm.ts` já dizia ligado desde 18/10; o §28 ficou como história). **Alternativa que perdeu:** opt-in (push só depois de a pessoa ligar). **O que falsificaria:** `push_optout` / pedidos para desligar por incômodo acima do que havia no opt-in, ou queda de aberturas depois do push de evento.
- **D-02 fome / D-03 energia cheia / D-04 cocô / D-06 progresso — pushes de EVENTO.** Planejador `src/utils/petPushEvents.ts`; copy só de CONVITE em `_pushCopy.js` (`hungerInviteCopy` "tem comida na pastinha", `energyFullCopy`, `poopPushCopy`, `progressCopy`). Fome: 1× quando cruza 60 (faixa mediana), SÓ com comida na pastinha (o texto é verdade), sem a palavra "fome", sem número, sem coração/dreno. Energia: 1×/dia ao projetar o máximo. Cocô: hora da agenda `poopEventsScheduled`, nunca na janela de descanso, nunca dormindo; alarme local no APK, timer na PWA aberta. Progresso: ≤1×/dia no fechamento (2 h antes do sono, até 21h), sem streak, sem contagem, e só se sobrar vaga. Nada em D0. **Revê os "perderam" do §28:** o push de cocô perdeu porque "o worker não sabe se há cocô; mentiria" — agora a agenda está no save e o alarme/timer local a conhece; e o texto de "fome como necessidade" perdeu por culpa pela porta dos fundos — o que volta é só o convite. **A regra "nunca notificação de culpa ou medo" (5.7) NÃO muda e vence qualquer tom**; a copy passa nas listas `PROIBIDAS_PT/EN` e no veto de culpa/necessidade (teste).
- **Teto `PUSH_DAILY_CAP = 4` com prioridade** (`functions/api/_pushBudget.js`): cocô > fome > energia cheia > carta > lembrete de deitar > refeição > hora fixa (10h/16h/22h) > progresso. **S-7 (suposição declarada):** a ordem do dono era `cocô > fome > energia > carta > refeição > progresso`; entraram o lembrete de deitar (entre carta e refeição: protege a noite armada do §99/§101) e a hora fixa (entre refeição e progresso: só existe para quem desligou o ritmo). O que o teto corta de refeição/lembrete vai ao worker no campo `x = {d, k}` da inscrição (o worker só obedece no dia `d`). Convites de hora fixa do worker são inevitáveis: contam e não se cortam. A CARTA de NPC (W4-B) conta no mesmo teto por `letterPushCandidate` → `extraPushes` do `NotificationManager`.
- **P4 — "Meal check-ins" único toggle:** a LÓGICA já é essa (o toggle `mealRhythm.push` controla as três janelas de push); falta só a UI (`SettingsPage`/`MealRhythmRows`, fora desta frente).
- **Consequência assumida:** com 2 cocôs/dia garantidos + fome + energia, o dia pode encher o teto só com eventos — refeições e lembrete de deitar cedem (é a ordem do dono). **Alternativa que perdeu:** teto separado por tipo / subir o teto. **O que falsificaria o teto:** o push de refeição quase nunca sair (tela de Configurações pedindo para ligar o que já está ligado) ou `meal_ritual` caindo a ~0.
- **Limite honesto:** a PWA FECHADA não recebe push de evento — o worker não lê o save. Viável com o cliente enviando a agenda do dia na inscrição (campo novo validado em `_pushIdentity.js`, como `meals`/`sleep`) e o worker disparando por hora; exige deploy manual do worker e ~1 KV por inscrição — NÃO feito (deploy fora de escopo). Alarmes de evento do APK são de uma vez (`AlarmReceiver` apaga a entrada ao disparar, para o `BootReceiver` não re-armar um cocô de ontem).

## 114. Cocô 2×/dia garantido, sempre com o pet acordado, o 2º antes do sono (dono, modal, 19/10/2026; D-05, P1, K-9)

- **Decisão do dono (P1):** "2 sempre, acordado; dreno como está". Antes: 1º agendado 07–15h e o 2º 8–10 h depois do 1º APARECER — muitas vezes caía no sono, e como "nunca aparece dormindo" o dia saía com 1 só.
- **Como:** `planDailyPoops` (`mealRhythm.ts`) agenda OS DOIS no começo do dia (`poopEventsScheduled` com 2 horários, o que também dá a hora ao push de cocô): 1º entre 07h (10h Madrugador) e 15h e depois do despertar; 2º de preferência 8–10 h depois (pós-jantar com o ritmo ligado), SEMPRE ≥45 min antes do início da janela de descanso (piso de 4 h entre os dois). `applyPoopDrain`, o teto diário, o Teimoso e o perdão por ausência NÃO mudam (teste de regressão do dreno segue verde). Save antigo com 1 só agendado: o 2º é sorteado ao 1º aparecer, agora CLAMPADO ao dia acordado.
- **K-9 aceito pelo dono:** mais cocô = mais exposição ao dreno de −1 coração/6 h; o dreno continua limitado pelo mesmo teto diário.
- **Alternativa que perdeu:** manter "até 2×/dia" (o 2º some no sono) ou mexer no dreno para compensar.
- **O que falsificaria:** pessoas limpando o 2º cocô quase sempre perto da hora de dormir sem querer (dreno pago à toa), ou o 2º aparecendo com o pet dormindo (teste: 300 sorteios × 5 janelas × 2 modos).

## 115. Carta de NPC: uma por dia, cartinha na Home, abre pela fila (dono, 19/10/2026; D-13, D-14, P6, S-8, K-8)
- **Decisão do dono:** na Home, um ícone de cartinha à ESQUERDA, abaixo do retrato, que só existe quando há carta. Chega uma carta de NPC para QUALQUER novidade de NPC (promoção, missão disponível, evento), no máximo 1 por dia (S-8: as novidades do dia viram UMA carta de até 3 linhas). Tocar na cartinha abre a carta e a marca lida (a cartinha some). O push da carta conta no teto de 4/dia do W4-A. Sem som (superfície nova nasce muda).
- **Como:** regra pura em `utils/npcLetter.ts` (`letterForDay`, `npcNewsToday`, `notificarCarta`); estado em `STORAGE_KEYS.NPC_LETTER` (localStorage, SEM campo novo no save); a carta nasce no `App` quando há novidade e o dia ainda não tem carta; a cartinha entra por `HomeHud.belowLeading` (absoluta, não desloca nada); o modal é o item `npcLetter` da fila (gesto, como a triagem; fora do teto de 3 do início de dia), "lida" gravada AO MOSTRAR. Promoção = só a que já existe (`weeklyDiscountFor` da forja, com o talento); missão = o "!" de `buildingMarks`. `event` é vaga sem fonte hoje. Exceção declarada à camada 3 congelada (K-8): pedido explícito do dono.
- **Ponto de entrada do push:** `registerCartaPushHandler(handler)` + `notificarCarta(letter, language)`, chamado uma vez quando a carta nasce; sem handler é no-op. O W4-A liga o teto/ordem ali.
- **Alternativa que perdeu:** sem correio (só o aviso na Home) ou só um toast: some sem deixar recado e não dá ao NPC uma voz própria no dia.
- **O que falsificaria:** a maioria das cartas ficar sem abrir (ignoradas) ou jogadores a descreverem como spam/cobrança (silenciar notificações logo depois do push da carta).

## 116. Marcadores "!" e "?" nos prédios; recolher continua só na Home (dono, 19/10/2026; D-33, D-34, K-7)
- **Decisão do dono:** o prédio com missão disponível mostra "!" no mapa da área; ao fazer a missão o "!" some. Com a missão completa mostra "?"; o "?" NÃO recolhe a recompensa ali, só a Home recolhe (como hoje).
- **Como:** `AreaView` recebe `buildingMarks` (a mesma `buildingMarks` de `utils/buildingQuests.ts`) e põe `lot.mark` nos lotes abertos (trancado e Mercado em obra não mostram); o glifo é o `MissionMark` existente, preso à arte do lote, `pointer-events: none` (guard H11), parado (sem pulso, vale com prefers-reduced-motion). Hoje só o Caderno é missão listada (as dos outros prédios pagam na entrada), então só ele acende. Muda a nota de K-7: a UI de missão e o recolher seguem fora do prédio; só o MARCADOR veio.
- **Alternativa que perdeu:** manter "nunca marca no prédio" (07/10/2026), ou marcar todo prédio todo dia (as outras missões pagam ao entrar: "!" que some no primeiro toque vira ruído).
- **O que falsificaria:** jogador tocar o "?" esperando recolher no prédio (reclamação de "não paga aqui"), ou o "!" fixo no Caderno ser percebido como cobrança.


## 117. "Meal check-ins" único (app + push) e opt-out da IA em "Your data" (dono, modais, 19/10/2026; D-16, D-17, D-19..D-23, K-5, P4, P8, P11)
- **Decisão do dono:** "Meal reminders" sai; "Meal check-ins" liga/desliga juntos o convite no app e o push de café, almoço e jantar. O toggle "AI chat" sai das notificações: a IA nasce sempre ligada e o opt-out de envio ao provedor (Groq) vira UMA linha em "Your data". "Vibrate when Focus ends" (e o "your item") sai de "Your data" e vai para "What Soulmon sends you" (título mantido). Copy do grupo mais objetiva, sem "No pressure" nem tom "soft".
- **Como:** `MealRhythmRows` tem um `SwitchRow` que grava `inApp` e `push` juntos (o push ainda exige notificações ligadas; a linha diz isso). `SettingsPage` mantém `useAI`/`onToggleAI` e a chave de storage, só mudou onde são expostos ("Send chat to AI provider" / "Enviar a conversa ao provedor de IA"); desligado = resposta por palavra-chave, como antes. O `ProfileEditor` perdeu as props deprecated `bits`/`onBuyFrame` e recebe `onOpenFrameShop` (Mercado > Frames, `utils/frameShopNav`). Política de privacidade e ficha Play não mudam: o opt-out continua existindo.
- **Alternativa que perdeu:** deixar o toggle de IA no grupo de notificações (mistura "o que chega até você" com "o que sai de você").
- **O que falsificaria:** pedidos de privacidade ou queixa de não achar o opt-out da IA; jogador que queria só o convite no app, sem push (ou o inverso), e reclama do toggle único.

## 118. Bosque = um cenário só, com todos os membros andando; cenários "From the Grove" fora do jogo (dono, 19/10/2026; D-26, D-49..D-57, K-12, K-13)
- **Decisão do dono:** o Bosque é UM cenário (o prédio do Hall, o "Enter the Grove" e a ficha do Clã são três portas para o mesmo lugar). Todos os membros do clã (até 12) andam nele, com contorno, de um lado para o outro, sem estado de presença (acima de 4 ninguém o tem); o nome só ao tocar, sem número; de vez em quando um balão com frase fixa (EN+PT, sem IA); tocar dá reação visual, sem som (superfície nova nasce muda). O visor vetorial da Casa (`CasaVisor`) sai; os cards da Guilda se separam por assunto (o Clan Hall é o administrativo). Os cenários `bg-guild-*` saem do jogo (loja, sorteio, seletores) até a arte nova, SEM apagar a posse nem sobrescrever o campo equipado do save.
- **Como:** `utils/groveWalkers.ts` (puro) + `GroveWalkers` (camada CSS, sem JS por frame) em `GroveVisor` (panorama) e `GroveCena` (ficha do Clã); `visibleBackground`/`GUILD_SCENES_RETIRED` em `utils/backgrounds.ts` (só a LEITURA de quem desenha, 3 pontos no `App`); `GuildOwnedShelf` sem a lista de cenários (a Concha da Maré segue na Decoração); a cerimônia não promete mais "já está em Background".
- **Alternativa que perdeu:** cenário parado/prévia (só o prédio ou uma imagem estática) e o visor vetorial da Casa; apagar a posse dos cenários ou trocar o equipado do save por `null`.
- **O que falsificaria:** um clã de 12 pesando em aparelho fraco (queda de quadros na ficha do Clã ou no panorama), ou membros sentindo-se expostos (nome ao toque lido como vigilância).

## 119. Linhas Akashai, Serah e Nautil aposentadas de TODO lugar visível; plaquinha da masmorra à direita (dono, R4, 19/10/2026; D-78, D-80, K-22)
- **Decisão do dono (R4):** os sprites das linhas defasadas Akashai (`orrin`), Serah (`serah`) e Nautil (`nautilu`) saem de todo lugar visível: Match 3, roster da masmorra, bestiário, sombras do Pesadelo, NPC da Biblioteca e fallback por hash de save/perfil antigo. O NOME Serah continua no lore/copy (§14). A plaquinha `DungeonSign` passa para a direita, acima de mochila/noite/banho.
- **Como:** `DUNGEON_LINE_SPRITES`/`DUNGEON_LINE_NAMES` ficam com 6 linhas (24 artes; os PNGs de `lines/` e `lines/icons/` das 3 foram removidos); `sprites.ts` ganha `RETIRED_LINE_IDS`/`RETIRED_LINE_STAND_IN`/`resolveArtLineId`: o id guardado no save (`demoCharacterId`, `artLine`, `eggType`, chaves do `bestiary`) continua VÁLIDO, só a arte exibida vira um inicial de reserva (mesmo mecanismo do `opponentArt.ts`). O NPC `npc-orrin` da Biblioteca passa a usar Astria; as sombras do Pesadelo `1b`/`2c`/`3`/`4b` reaproveitam a silhueta de outro slot do mesmo degrau até haver arte nova. Plaquinha: `.sm3-cuidar-placa` (CSS) irmã de `.sm3-cuidar`, base a 52px (topo efetivo dos ícones = 44px). Resíduos de texto "N Bits" em `AvatarFrame`, resumo da `DungeonSummary` e toasts do `App.tsx` viraram `BitsAmount`.
- **Alternativa que perdeu:** manter as 3 linhas antigas só no Match 3 (ou só esconder da seleção) — o dono quis fora de todo lugar, e uma lista visível que ainda sorteia a linha velha volta a mostrar o sprite descartado.
- **O que falsificaria:** jogador sentir falta das criaturas ou se confundir com o bestiário/histórico (ex.: chave antiga sem silhueta), ou perfil antigo exibir um inicial no lugar do bicho que lembrava.

## 120. SFX de combate procedurais: 7 efeitos próprios (dono, 19/10/2026; D-86..D-92)
- **Decisão do dono:** efeitos sonoros de combate melhores — ataque físico (corte), defesa, ataque mágico, carregando o especial, soltando o especial, vitória (curta) e derrota (curta, tom neutro, sem culpa nem escárnio) —, sem API paga e sem áudio gerado por serviço externo.
- **Como:** `src/utils/sfxCombate.ts` sintetiza os 7 como sinais determinísticos (ruído de semente fixa), cada um ≤ 1,2 s (vitória/derrota ≤ 2 s, hoje 1,3 s), origem `procedural próprio` no manifesto `SFX_DE_COMBATE`. `sounds.ts` os toca como buffer pelo barramento (`tocarNa`): mesmo gate de mudo (`SOUND_MUTED`), gesto, R-EX e ducking de sempre; todos `arcade` (R-CAT: o evento é combate; a derrota NÃO é a degeneração, C-6). O nível é o `OFFSET_POR_SOM_DB` (alvo da categoria − LUFS-M do sinal nominal, medido em Node com `src/test/lufsM.ts`, que reproduz o arnês antigo do `playFeed`); `sfxCombate.test.ts` reprova pico acima de −1 dBTP, duração acima do teto e loudness fora de ±1 LU. Quem escolhe qual toca é `BattleStage` (golpe bloqueado = defesa; físico = corte; à distância = mágico; carga ao mirar o anel ou no início do especial do inimigo/automático; soltar ~300 ms antes do fim da introdução) e as quatro telas de luta (vitória e derrota; o empate fica mudo). A escuta humana (S8) usa `scripts/render-sfx-combate.mjs`, que grava os 7 em WAV.
- **Alternativa que perdeu:** assets gerados por IA / serviço pago (o A/B cego da S10 nunca rodou; o dono vetou API paga), e manter os cinco `beep` de `square` do PR18 (um corte e um estouro lidos como o mesmo bipe).
- **O que falsificaria:** reprovação na escuta S8 (qualquer um dos 7 soando como bipe, ou a derrota soando como culpa/escárnio), ou o dono achar a carga/defesa repetitivas na Masmorra (aí vira variação por semente, não asset).


## 121. Chips: Prisma sai da loja, Chip Triplo +9, preços +100%, limite de 3 por estágio (dono, 19/10/2026; D-94..D-97)
- **Decisão do dono:** (D-94) o Chip Prisma ('inútil') sai da loja; quem já o tem na pastinha mantém e usa. (D-95) chip novo que dá +9 em CADA atributo, 2.400 Bits. (D-96) todos os chips +100% (180→360, Maiores 420→840). (D-97) no máximo 3 chips por ESTÁGIO de evolução, todos os tipos somados; o 4º é recusado, sem consumir e sem punição.
- **Como:** `shop.ts`: `chip-prism` sai de `SHOP_ITEMS` e fica só em `SPECIAL_ITEMS` (catálogo de uso); `chip-triple` (`TRIPLE_CHIP_EMOJI` 💠, "Chip Triplo"/"Triple Chip", arte do Prisma reaproveitada em `itemArt.ts`). `specialItemUse.ts`: `CHIPS_PER_STAGE` = 3, recusa `'stage-cap'` antes do decremento, `chipsStage { stage, used }` no save (sanitizado em `GameStateContext`; só vale para o estágio gravado, zerado ao evoluir/renascer/degenerar em `App.tsx`). Feedback por toast ("pode receber 3 chips neste estágio · 1 de 3", 2 de 3, 3 de 3); recusa: "já recebeu 3 chips neste estágio, o chip te espera no próximo". Migração: save sem o campo entra com 0 usados — o save antigo não registra uso de chip, então não há como saber quem já usou; ninguém perde nada nem é bloqueado por dado inexistente.
- **Alternativa que perdeu:** chips sem limite (compravam a distribuição de atributos da evolução só com Bits).
- **O que falsificaria:** jogadores travados sem saber por quê (toque no chip e nada acontece), ou queixa de preço (chips a 360/840/2.400).

## 122. Sem promoção em lugar nenhum: some o desconto semanal, o "For sale" e a carta de NPC (dono, 19/10/2026; D-98; revoga §115 e o "For sale primeiro" de D-29)
- **Decisão do dono:** "tire esse sistema de promoção de todo lugar... tira as seções de promoção das lojinhas também. Não vai ter isso, não." Sem promoção, a notificação/cartinha de promoção "deixa de fazer sentido".
- **Como:** saem o desconto semanal da forja (`weeklyDiscountItem`/`weeklyDiscountFor`/`WEEKLY_DISCOUNT`, `weekKey` de `equipPrice`/`redoBitsPrice`) e o talento que o liga (`tal-com-07` Moeda coroada, no cliente e em `functions/api/_talents.js`; `sanitizeTalentPicks` poda esse id e devolve o ponto, sem descartar o resto do vetor). Saem as seções "For sale" das lojinhas (a ordem volta ao H7: "Já são seus" no topo, o resto como lista normal). **Revoga a §115:** saem `npcLetter.ts`, `NpcLetterButton`, `NpcLetterModal`, o item `npcLetter` da fila de modais, `STORAGE_KEYS.NPC_LETTER` (a chave `soulmon-npc-letter` pode ficar órfã no aparelho, sem leitor), `HomeHud.belowLeading`, `letterPushCandidate` e `extra`/`extraPushes` do planejador de push. Prioridade de push: cocô > fome > energia cheia > lembrete de deitar > refeição > hora fixa > progresso; teto de 4/dia intacto. **Mantidos:** os marcadores "!" e "?" dos prédios (§116) e o `tal-com-01` (Etiqueta, preço fixo por grau). Nada de save é apagado.
- **Alternativa que perdeu:** promoção semanal na forja + "For sale" nas lojinhas + carta do NPC avisando dela.
- **O que falsificaria:** o dono (ou jogadores) pedir de volta algum tipo de promoção/oferta calma, ou a carta de NPC como correio de novidades.

## 123. Combina 3: poder do elemento sai do combo e mostra o dano; inimigo embaixo à direita (dono, 19/10/2026; D-99/D-100)
- **Decisão do dono:** (D-99) o Soulmon do jogador fica em cima à esquerda e o do inimigo embaixo à direita (com 3 inimigos, a fila fica embaixo, o da frente na direita). (D-100) ao fechar um combo de um elemento, da célula do combo sai um poder (ícone do elemento já existente) que viaja até o alvo e mostra o dano causado; vale para os dois lados.
- **Como:** `utils/match3Powers.ts` (puro) liga cada evento do log de `match3Combat` à célula do combo; o dano mostrado é o do evento, sem recalcular (fórmula e balanço intactos). `Match3Game` anima com Web Animations (transform/opacity, sem JS por frame); movimento reduzido: sem viagem, número direto; mudo. O layout D-99 já era o de D-76; ganhou `data-m3-pos` e teste.
- **Alternativa que perdeu:** dano sem projétil (só a barra de HP mudando).
- **O que falsificaria:** tela poluída ou queda de fluidez em aparelho fraco (poderes demais por cascata).

## 124. IA: a voz vai direto ao Groq pelo nosso Worker (sem Supabase) e o chat gasta a cota inteira (dono, 19/10/2026; D-86..D-99)
- **Decisão:** "grok" = **Groq** (com Q). `/api/transcribe` (ID token Firebase, fail-closed) chama o Whisper do Groq com a mesma `GROQ_API_KEY` do chat; o projeto Supabase, as variáveis `SUPABASE_*` e o código em `src/supabase/functions/server/` saíram (a transcrição estava devolvendo 503 em produção justamente por faltar `SUPABASE_*`). Custo zero. A fala espontânea (180 s) e o toque no pet deixam de chamar a IA (frases locais): a cota de 15/dia (demo) e 20/dia (pago) fica toda para o chat aberto. Erros do chat ganham textos distintos (`chatErrorCopy.ts`); o microfone só é desenhado com a rota disponível; gravação limitada a 60 s (servidor: 413 acima de 65 s).
- **Alternativa que perdeu:** xAI Grok para a voz (STT em lote ≈ US$ 0,10 por hora de áudio) ou para voz e chat (`grok-4-fast` ≈ US$ 0,20/0,50 por milhão de tokens) — preços de tabelas de terceiros, a verificar no console da xAI. Perdeu por trazer chave nova, custo recorrente e mudança de política/Data Safety sem ganho que o dono pedisse; revisitar se o Groq degradar ou o dono preferir a xAI.
- **Política:** a `PRIVACY_VERSION` NÃO sobe nesta decisão; o destinatário da voz mudou e a política cita o Gemini como reserva do chat. Subir junto da revisão jurídica antes da loja (pergunta no `PERGUNTAS-DO-DONO.md`).
- **Orçamento de bytes:** a main estava vermelha em `orcamentoDeBytes` (677_043 B de JS de entrada contra a dívida de 661_170, desde o refino W3+W4); re-medido em 675_858 B com a remoção do caminho Supabase. Corte real continua sendo partir o `App.tsx`.
- **O que falsificaria:** `GET /api/config` sem `transcribeAvailable:true` depois do deploy, o Groq deixar de mandar `duration` (todo áudio daria 413), ou o chat seguir esgotando a cota com a Home aberta.
- **Nota de desambiguação (19/10/2026, §128):** os rótulos `D-86..D-99` do título desta seção são os da frente de IA (voz/chat) do pedido do dono de 19/10; NÃO são os IDs de som da §120 (`D-86..D-92`, SFX de combate) nem o `D-99` da §123 (Combina 3). Os IDs repetem porque cada frente numerou o seu lote; a leitura correta é sempre "ID + seção". A linha **Política** acima ("`PRIVACY_VERSION` NÃO sobe") foi superada pela §128.

## 125. Cenários da Guilda voltam com arte nova; Retro LCD refeito em paisagem de oliva (dono, 19/10/2026; D-27/D-28, onda W5 lote L7; fecha o gancho de §118 e S-9)
- **Decisão:** os cinco `bg-guild-*` (Clareira, Ramagem, Copa, Mata, Bosque antigo) saem da aposentadoria de D-26: arte pintada nova (WebP, 1200×648 + retrato 608×1080, 130–180 KB cada, dentro do teto de 400 KB), mesma composição de cada estágio. O "Retro LCD" (`bg-gameboy`) mantém o conceito LCD, agora como paisagem de tons de oliva, limpa e em 1800×972.
- **Como:** `GUILD_SCENES_RETIRED` virou a lista `GUILD_SCENES_RETIRED_IDS` (vazia); `visibleBackground` só esconde id que estiver nela, então quem tinha um cenário do Bosque equipado o vê voltar sozinho — o campo equipado e a posse (`mine.groveScenes`) nunca foram tocados. A prateleira "From the Grove" (`GuildOwnedShelf`) e a frase da cerimônia de marco ("já está em Background") voltaram. Um estágio sem arte nova entra na lista e cai no cenário padrão.
- **Alternativa que perdeu:** manter os cenários fora do jogo à espera de uma rodada maior de arte (S-9); e redesenhar o LCD como outro conceito.
- **O que falsificaria:** o dono achar a arte pintada distante do Bosque aprovado (reverter o id para a lista de aposentados basta), ou o LCD perder a leitura de "tela de console" na caixa do Soulmon.

## 127. "Entrei no combate e não mudou a trilha": o 'false' herdado da S2 é migrado uma vez (dono, 19/10/2026; reforça §102)
- **Decisão:** a música de combate segue NASCENDO LIGADA (§102, inalterada). O defeito não está no caminho de código — entrar na Masmorra/Duelo/Torneio com a chave `soulmon-sound-track-enabled` ausente toca o dungeon/pvp theme (prova: `musicaCombate.integracao.test.ts`, módulos reais, `<audio>` falso). A causa provável é ESTADO ANTIGO: `trilhaLigada()` só trata AUSENTE como ligada; um `'false'` gravado (na era da S2 a trilha nascia desligada e o interruptor gravava a escolha) mantém o aparelho sem música de combate e com o tema na Masmorra, exatamente o relato. Os arquivos `musica-*.webm/m4a` existem em `dist/sounds` com o sha256 do manifesto, o service worker não intercepta `/sounds/musica-*` e a CSP libera `media-src 'self'`: nada disso é a causa.
- **Como:** `migrarPreferenciasDeSom()` (`audioBus.ts`), chamada por `iniciarMusica()` na partida: sem a marca `SOUND_PREFS_VERSION='1'`, apaga o `'false'` de `SOUND_TRACK_ENABLED` e grava a marca. Depois dela, o `'false'` vindo do interruptor é escolha explícita e a migração nunca mais o toca (idempotente; sobrevive ao logout).
- **Alternativa que perdeu:** deixar o aparelho como está e pedir ao dono para religar o interruptor (esconde o mesmo problema em qualquer outro aparelho antigo); ou resetar a chave a cada partida (apagaria a escolha de quem desligou de propósito).
- **Custo:** quem desligou o interruptor de propósito ENTRE a publicação do §102 e esta migração volta a ligado uma vez e precisa desligar de novo.
- **O que falsificaria:** o dono ainda sem música de combate com a chave ausente/`true` (aí a causa é gesto/autoplay, pausa de sono/descanso/mudo ou service worker velho — ver `docs/SOM.md`).

## 128. Privacidade sobe de versão; permissão de notificação na 1ª abertura já feita; resíduos D-60/D-71 (dono, 19/10/2026; D-01, D-60, D-71, D-72)
- **Decisão do dono:** (1) a `PRIVACY_VERSION` sobe para `2026-10-19` — a voz agora vai ao Groq pelo nosso Worker; a política (§6/§6b, "Groq (audio transcription)") já cobria, a versão sobe só para registrar a mudança (ninguém usa em produção, custo de reconsentimento zero). Supera a linha "Política" da §124. (2) D-01: a permissão de notificação do SO é pedida UMA vez na 1ª abertura, como a §113 prometia.
- **Como:** `utils/consent.ts` (`PRIVACY_VERSION`) + carimbo PT/EN de `public/privacidade.html` ("19 de outubro de 2026"/"October 19, 2026"); o contrato `consent.versoes.contract.test.ts` amarra HTML × constante e `subscriptionBoundary.contract.test.ts` trava o valor. `PLAY-DATA-SAFETY.md` não cita a data (nada a mudar). D-01: já existia no código desde `9436bfbc2` (efeito de `App.tsx` + `utils/notificationPermission.ts`, flag `NOTIFICATION_FIRST_OPEN_ASKED` gravada ao PEDIR, APK pede direto, web no 1º toque, sem modal nosso); o relatório fiscal olhou só `notificationDefault.ts`, cujo comentário dizia o contrário e foi corrigido. A copy de `notificationsDescription` falava de "mensagem diária às 12h" (o lembrete das 12h foi removido): agora "lembretes das suas atividades e alguns recados leves".
- **D-60 (resíduo):** `utils/opponentArt.regua.contract.test.ts` reprova chamada de `getSpriteForStage`/`lineIconForStage` com argumento de oponente, trava a lista fechada das chamadas SEM linha (só o jogador PRÓPRIO: `GuildSheet` ×4, `TournamentPage` ×1, `ProfileEditor` ×1) e proíbe `SOULMON_SPRITES` fora de `sprites.ts`. Nenhuma chamada de oponente restante; a árvore genérica ainda é o piso do próprio jogador sem linha.
- **D-71 (resíduo):** o resumo da masmorra e o "inimigo parou" passam a usar `RewardLine` para o coração (ícone `favorite`); Bits já eram `BitsAmount` em todos os minijogos. Ficam em texto por serem descrição de efeito, não recompensa recebida: `Mochila` (item "+1 de energia"), `PlayCard`, `TalentTree`.
- **D-72:** relatório de textos longos fora do repo (`D:/Soulmon/prompts/d72-textos-longos.md`); nada foi cortado.
- **Alternativa que perdeu:** não subir a versão (a §124 dizia que não precisava); ou pedir um modal próprio de permissão na abertura (estoura o teto de 3 modais do início de dia).
- **O que falsificaria:** o banner de atualização de termos aparecer para quem já aceitou `2026-10-19`, ou o pedido de notificação repetir depois de negado.

## 126. Trilhas licenciadas: uma faixa para todos os combates e uma para o Pesadelo (dono, 19/10/2026; substitui §102 nas faixas)
- **Decisão do dono:** "Todos os combates" tocam a mesma faixa, "Stone Hall Combat" (Masmorra, Arena, Duelo e Torneio). O Pesadelo toca "Stone Hall Nightmare". A casa toca o tema "Stone Hall Decay", que ganhou arquivo novo. As três foram geradas no Suno e o dono declarou, em 19/10/2026, que foi no plano pago. O lobby do Torneio segue sem o −3 dB; as lutas têm −3 dB. O interruptor "Música de combate" (nasce ligado, só toca depois de gesto, D11) cobre combate e Pesadelo.
- **Como:** manifesto `MUSICAS_DE_COMBATE` = `{ combate, pesadelo }` em `sonsAssets.ts`; `TRIM_MUSICAS_DE_COMBATE_DB = { combate: 0, pesadelo: 0 }` em `loudness.ts`; diretor `musica.ts` manda masmorra/arena/torneio/duelo para `'combate'` e pesadelo para `'pesadelo'`. Um dono só para música em streaming: `streamMusica.ts` + `musicaDeCombate.ts`. Ganho único de masterização (tema −12,3 dB; combate −12,9 dB + fade-out de 3 s; pesadelo −12,2 dB + fade-out de 3 s), Opus 72 kbps e AAC-LC 88 kbps. Medidas, bytes e pendências: `SOM.md` §12. Procedência e hashes: `Attributions.md`.
- **Alternativa que perdeu:** manter "dungeon theme" e "pvp theme" separados, manter a faixa derivada da Arena e o terror procedural do Pesadelo, inclusive como fallback.
- **Por que perdeu:** (1) pedido do dono: "Todos os combates"; (2) um dono só para música, sem dois caminhos de reprodução para manter e testar; (3) os três arquivos antigos (tema, dungeon, pvp) eram do plano Free, sem direito comercial.
- **Decisões do orquestrador, pendentes do dono:** (1) o procedural (`trilhaArena.ts`, `trilhaPesadelo.ts`, `trilhaPesadeloSintese.ts`, `scripts/render-trilha-pesadelo.mjs`) foi apagado SEM fallback, e o encaixe `pesadelo-trilha.mp3` também saiu; (2) com o interruptor desligado, o Pesadelo segue a regra das outras superfícies de combate (o tema toca mais baixo, se ligado), em vez de tocar o terror; (3) o loop de 2 camadas (`trilha-base`, `trilha-ritmo`, ~244 KB) ficou no repo sem nenhuma superfície que o peça: decidir se sai.
- **Limite honesto:** a licença é DECLARADA, não provada; o repo não prova o plano. O título original das faixas de combate e Pesadelo no Suno continha o nome de uma trilha de terceiro por erro de digitação (declaração do dono); o repo não prova por escuta a ausência de material de terceiro. Falta a escuta (S8).
- **Gatilho de revisão / O que falsificaria:** a escuta do dono (S8) das três faixas e do nível relativo entre elas reprovar; ou o print da página do plano (`suno.com/account`) mostrar plano sem direito comercial, caso em que a pendência volta a bloquear a loja.

## 129. Um interruptor só de música para tema, combate e Pesadelo (dono, 19/10/2026; emenda S17, §102 e §127)
- **Decisão do dono:** "Quando entro em combate não toca a música tema de batalha" (testado no PWA instalado, com "Música de combate" desligado por um `'false'` da era antiga) e "É só um interruptor de música, que vale pra todas." Há UM interruptor "Música" / "Music" em Configurações › Som: liga e desliga o tema da Home, a música de combate (Masmorra, Arena, Duelo, Torneio) e o Pesadelo. "Sons" (mudo/SFX) segue separado e inalterado. Nasce ligado, só toca depois de gesto (D11/S2), uma música por vez com crossfade; pausas de sono, descanso e mudo iguais; guards de loudness/manifesto e R-NOVA/D11 intactos. Desligada = silêncio em todas as superfícies (acabou o "tema em combate, mais baixo").
- **Como:** dono único da preferência em `audioBus.ts`: `musicaLigada()` / `definirMusicaLigada(on)`, chave `SOUND_MUSIC_OFF` (`soulmon-sound-music-off`, polaridade "off", ausente = ligada) e marca `SOUND_MUSIC_VERSION`. `trilhaLigada`, `definirTrilhaLigada` e `temaPreferido` viraram aliases que leem dela. Diretor `musica.ts`: `escolherFaixa(s, musicaOn)`; novas `musicaPreferida`, `ligarMusica`, `desligarMusica`. `migrarPreferenciaDeMusica()` (substitui `migrarPreferenciasDeSom` da §127), idempotente, em `iniciarMusica()`: com a marca nova, nada; sem ela, a música fica DESLIGADA só se o jogador desligou AS DUAS depois da marca da §127 (`SOUND_PREFS_VERSION='1'`, `SOUND_TRACK_ENABLED='false'` e `SOUND_THEME_OFF='true'`); qualquer outro caso fica ligada (inclusive o `'false'` herdado antes da marca e o "só tema desligado"). Remove as 3 chaves legadas e grava a marca. Régua: `musicaPreferencia.migracao.test.ts` (a–i), `musica.test.ts`, `settingsSom.render.test.tsx`, `musicaCombate.integracao.test.ts`. Detalhe: `SOM.md` §13.
- **Alternativa que perdeu:** dois interruptores (tema e combate) convivendo (S17 emendada, §102, §127).
- **Por que perdeu:** o dono não sabe que existem duas preferências; um `'false'` herdado num deles produzia "combate sem música", que parece bug.
- **Custo:** quem queria só a Home ou só o combate não tem mais como; quem desligou os dois interruptores antigos ANTES da marca da §127 volta a ouvir música uma vez.
- **Gatilho de revisão:** o dono pedir de novo música só na Home ou só em combate, ou relato de jogador querendo silenciar só um dos dois.
- **O que falsificaria:** o dono, após atualizar o PWA, entrar na Masmorra com "Música" ligada e não ouvir "Stone Hall Combat"; ou desligar "Música" e ainda ouvir Home, combate ou Pesadelo; ou "Sons" deixar de ser independente.
- **Limite honesto:** só o aparelho do dono confirma (PWA instalado, depois de atualizar). Os testes cobrem módulos reais com `<audio>` falso, não o aparelho.

## 130. SFX de combate vêm de banco gratuito livre (CC0): os 7 samples substituem a síntese procedural, que fica de fallback (dono, 20/10/2026; D-86..D-92; revisa §120)
- **Decisão do dono:** "O som eu não gostei muito. Vê se acha algum banco de dados GRATUITO que dá pra usar." Os 7 efeitos de combate (corte, defesa, ataque mágico, carregando o especial, soltando o especial, vitória curta, derrota curta neutra) passam a vir de banco gratuito com licença que permite uso comercial num app publicado, sem API paga.
- **Como:** `public/sounds/sfx-combate-{attack,defend,attack-ranged,charge,special,victory,defeat}.webm` (Opus 64 kbps mono, 3–12 KB cada, ≤ 40 KB por efeito, fora do S6 de 300 KB e do pré-cache). Fontes, todas **CC0 1.0** (atribuição não exigida, mas registrada): Kenney (RPG Audio, Impact Sounds, Sci-Fi Sounds, Music Jingles) e JaggedStone/OpenGameArt ("magic spell sfx"). Manifesto `SFX_DE_COMBATE_LIVRES` (`sonsAssets.ts`) com arquivo original, URL, autor, licença, data e hashes; `Attributions.md` ganha a tabela; `sfxCombateLivres.contract.test.ts` reprova sample sem origem/licença/hash, fora de 40 KB, fora do alvo `arcade` ±1 LU ou com true peak acima de −1 dBTP. Mestrados no alvo da categoria e tocados a ganho 1; a escuta humana (S8) usa `D:/Soulmon/_gemini_out/w10-sfx/para-ouvir/` (2–3 opções por efeito). `sfxCombate.ts` (§120) fica como FALLBACK quando o arquivo não chega/decodifica; o mapeamento evento → função (`BattleStage`) e o interruptor de Efeitos não mudaram.
- **Escolhas do dono na pré-escuta (20/10/2026):** ficam D-86 (knifeSlice), D-87 (impactPlate_medium_000), D-88 (magical_3) e D-90 (explosionCrunch_000); D-91 vitória = `jingles_HIT15`; D-92 derrota = `jingles_STEEL07` (o jingle que era a vitória; o steel drum descendente STEEL04 saiu do uso); D-89 carregar = "ki" (energia que sobe), derivado só de material CC0 (`spaceEngine_001` da Kenney com velocidade/brilho/volume crescentes; processamento registrado no manifesto e na Attributions), no lugar de `magical_1_0`.
- **Alternativa que perdeu:** síntese procedural (§120, reprovada pelo dono no ouvido) e áudio gerado por IA/serviço pago (vetado). Entre bancos: CC-BY-SA/GPL (p0ss) pelo share-alike; Pixabay como plano B (licença própria, não domínio público; reler os termos completos); Mixkit descartado (texto da licença de SFX não lido).
- **O que falsificaria:** reprovação na escuta (o dono trocar a primeira opção por outra de `para-ouvir/` ou pedir outro banco), a derrota soar como escárnio/culpa, ou a licença CC0 de um autor ser contestada (aí troca-se o arquivo, não o mecanismo).

## 131. Combina 3: aura do especial no atacante, poder maior e mais longo, burst no alvo (dono, 20/10/2026; D-102; emenda a §123)
- **Decisão do dono:** o efeito do combo estava "pequenininho e rápido, nem dá pra perceber"; quer a AURA que o personagem tem quando vai usar o especial e o poder maior, mais demorado, mais enfeitado.
- **Como:** em `Match3Game`/`PowerFx`, ao disparar um combo: (1) a aura do especial (a arte `aura` do elemento, a mesma do `BattleStage`, com `sm-bs-pop` e o brilho dourado) acende ~0,45 s no Soulmon que ataca (o seu, ou o inimigo ativo); (2) o poder (arte `orb` do elemento) sai da célula do combo — de 24 px para 56 px (84 px nos combos 4+) — e viaja 950 ms em arco (antes 300 ms) com 2 de rastro; (3) no impacto: burst (`impact` + anel; onda extra nos 4+), tremida de 240 ms do alvo e o número de dano maior (30 px; 36 nos 4+; antes 18 px). Agenda pura em `match3Powers.planFx`: no máximo 2 poderes completos ao mesmo tempo, teto de 2,5 s por lado da jogada (jogador, inimigo); o que não cabe sai na versão rápida (burst + número, sem aura nem viagem). O número e o dano são os do log; fórmula e balanço intactos. A LÓGICA NÃO ESPERA o efeito: os passos seguem em 280 + 240 ms e o HP já está no valor final quando o poder chega (a barra cai um instante antes do impacto; é decoração). Movimento reduzido: sem aura nem viagem, flash estático de 350 ms + número direto. Só `transform`/`opacity`, Web Animations, ≤ 7 elementos por poder; tudo no chunk lazy do Match 3 (`fxFrame` já está no JS de entrada via `App`). Mudo (o áudio é de outro agente).
- **Alternativa que perdeu:** manter o poder pequeno e rápido (D-100 original, §123), ou esperar o efeito terminar antes de liberar a jogada seguinte.
- **O que falsificaria:** a animação atrapalhar a jogabilidade em aparelho fraco (queda de fluidez, jogada seguinte lenta ou tela poluída em cascata longa); medir em aparelho fraco e, se preciso, encurtar `FX_TRAVEL_MS` ou baixar para 1 pista.

## 134. Combina 3: UM poder por combo (+25%); arte defasada aposentada de TODO o app (dono, 20/10/2026; D-103, D-104; emenda a §131 e §119)
- **Decisão do dono:** "só UM foguinho, um pouquinho MAIOR" no Match 3 e "sprites DEFASADOS em todo lugar: atualizar para as versões novas".
- **Como (D-103):** a conta já dava um evento por elemento por passo; os "três foguinhos" eram o poder + 2 rastros que repetiam o MESMO ícone. Agora há 1 ícone por combo (`[data-m3-shot]` com 1 `img`), o rastro virou brilho sem imagem, e o poder cresceu de 56/84 para 70/105 px (`FX_ORB_PX`/`FX_ORB_PX_BIG`). Aura, burst, número (= o do log) e lanes (máx. 2) intactos.
- **Como (D-104):** a árvore genérica (`SOULMON_SPRITES`, 11 PNGs gato-coruja) foi REMOVIDA; sem linha de arte (jogador sem `demoCharacterId`, id de estágio antigo, ramo da árvore) o piso é um INICIAL atual por hash estável do id do estágio (`fallbackStarterFor`). `resolveLineForStage` devolve `null` nesses casos (iniciais não têm ícone-ficha). Saem também as 22 formas de `orrin`/`serah` em `lines/full/`. O id no save segue válido; só a arte exibida muda. Régua em `sprites.dungeonRoster.test.ts` (D-104).
- **Alternativa que perdeu:** manter a árvore genérica como piso.
- **O que falsificaria:** jogador vendo arte errada/ausente em perfil antigo (ex.: criatura sem linha e sem sprite próprio trocando de bicho a cada estágio).

## 133. Clan Hall enxuto (só administrativo) e Grove parado na entrada, "i" no título (dono, 20/10/2026; D-105, D-106, D-107)
- **Decisão do dono:** "O Soulmon andando está esquisito, muito rápido." No preview (a janela do Grove) os 4 podem andar, mais devagar; ao ENTRAR no Grove ficam parados, num lugar definido entre as árvores, um pouco mais à frente e acima de onde estavam. O "i" do Grove vai para a linha do título do modal, à direita. No Clan Hall saem o "Enter the Grove", a "Clan War" e o "High Tide": cada prédio tem a sua função, nada redundante.
- **Como:** `WALK_SLOW` (2,5×) alonga a travessia do preview (35..65 s). `GroveWalkers mode="stand"` (usado pelo panorama) põe cada membro num slot fixo de `STAND_SLOTS` (3 clareiras entre as 4 árvores × 4 posições = 12; quem olha no primeiro; y 77/85, acima do antigo 86..91; sem sobreposição, provado em teste), sem caminhada nem virada; contorno, toque com nome, balão e bounce ficam (reduced-motion sem bounce). O "i" do bosque virou `ModalInfo` (slot do cabeçalho do `AreaSheet`). O Salão (Clan Hall) deixou de desenhar Bosque, Feira e Guerra (e de perguntar a guerra ao servidor); abrem só por Grove e Feira (Hall) e Guerra (Arena). Nenhum dado do clã mudou.
- **Alternativa que perdeu:** deixar tudo no Clan Hall (portas duplicadas) / membros andando sempre, também dentro do Grove.
- **O que falsificaria:** jogador não achar a Feira ou a Guerra (procurar o High Tide / a Clan War no Clan Hall e desistir), ou o grupo parado parecer morto no Grove; medir se a abertura dos prédios Feira e Arena cresce sem queda no uso da Guerra/Feira semanal.

## 132. Ordem da lista de missões: "?" no topo, resgatadas no fim, especial acima com linha fina; a de passos promove no mesmo dia (dono, 20/10/2026; revoga a ordem A5 do §82; emenda o §106)
- **Pedido do dono (texto dele, 20/10/2026):** "quando uma missão for concluída, ela tem que ir para o final da fila [...] quando tiver interrogação, ela vai para cima [...] as missões especiais [...] têm que ficar acima, sempre [...] menos quando ela está concluída [...] e tem uma linha fina, e depois tem as normais." E: "Eu não achei aqui a missão especial dos passos."
- **Decisão:** toda lista de missão segue `missionsInQueueOrder` (`utils/missionOrder.ts`, dono único): prontas para resgatar ("?") no topo, abertas no meio, resgatadas/entregues no FIM; estável dentro do grupo. Vale em Diárias, Primeiras vezes, Semanal e Conquistas. Na aba Diárias, a seção "Hoje" virou UMA lista (`DailyMissionBoard`, `layoutMissionBoard`): rótulo "Special mission"/"Missão especial" + especial não concluída no topo, linha fina, depois as normais (prontas, abertas) e por fim TODAS as resgatadas, a especial concluída inclusive. A seção separada "Especial do dia" saiu. "Primeiro dia" e "Primeiras vezes" continuam seções próprias.
- **Passos (emenda ao §106):** causa de "não achei" (evidência no código): a de passos só existe com sensor + consentimento + permissão (`specialHasSteps` no `App.tsx`; na PWA `loadPedometer` devolve `null` porque `Capacitor.isNativePlatform()` é falso) e, mesmo com sensor, alterna por paridade do dia (20/10 é dia de passos, 19 e 21 de descanso). Defeito achado: o tipo do dia travava na 1ª avaliação, então um dia resolvido como descanso sem sensor (save vindo da nuvem/PWA, consentimento dado no meio do dia) nunca virava de passos. Agora `resolveSpecialMission` PROMOVE rest→steps no mesmo dia quando há sensor, é dia de passos pela paridade e a missão não foi cumprida (simétrico ao rebaixamento que já existia). A meta continua travada no dia (`goal`). Com sensor, num dia de descanso, a dica "Tomorrow's special is a steps goal." / "A especial de amanhã é de passos." mostra que ela existe. Sem sensor nada muda: nenhuma menção a passos (regra 2 de `utils/steps.ts` e §106 Q2).
- **Alternativa que perdeu:** manter a A5 (concluídas antes das abertas) e a especial como seção própria; e, para a PWA, mostrar "precisa do app com sensor" (fica para o dono decidir: contraria o "a de passos some" do §106 e a regra "sem 'você está perdendo isto'").
- **O que falsificaria:** o dono (ou jogador) perder de vista o que já resgatou hoje por ficar no fim; ou a promoção rest→steps aparecer como "a missão mudou sozinha" e confundir (vigiar relato no aparelho).

## 135. Mapas: fundos do Laboratório e do Hall substituídos SEM escurecer, prédio do Clan War trocado, posições reencaixadas nas plataformas (dono, 20/10/2026; W12)
- **Decisão do dono:** fundo novo do Laboratório ("Enchanted Treehouse Alchemy Lab") e do Hall (link Higgsfield), "pode tirar o efeito de escurecer"; prédio do Clan War = o `hf_20260923_193918_c287e46f…` do banco isométrico; "encaixar bem certinho os prédios nas áreas"; Arena: Open Arena e Tournament juntos num retângulo e o Clan War no outro; Game Hall desce, centraliza e cresce; Mind Workshop e Refúgio crescem; Perfil sobe; Biblioteca e Amigos descem.
- **Como:** `tools/instalar-w12.py` (idempotente; fonte = os originais recebidos, guardados fora do repo em `_gemini_out/w5-arte-20261019/originais/*-w12.png`; fundos 760×1344, WebP q85 ≈ 374/361 KB; prédio da Guerra com o pós dos prédios: alfa em 200, bbox, 512², ~4% de margem). `tools/ajuste-tom-fundos.py aplicar` ficou desativado (regravaria os W5 escurecidos). `tools/w12-mapas.py` mede/checa/gera as prévias: plataformas medidas nos PNG, lotes lidos do `.ts`, guard H11/H12 nos 5 viewports. Arena: Torneio + Arena livre no retângulo de baixo-esquerda, Guerra no de cima-direita.
- **Limite conhecido:** no Laboratório o rótulo "Santuário do Vínculo" (~170 px) impede Biblioteca/Amigos de descer até o centro das plataformas (44%) em 360 de largura sem encurtar o rótulo; ficaram em 39,3% (pergunta ao dono).
- **Alternativa que perdeu:** manter os fundos W5 escurecidos (W8-A) e as posições antigas.
- **O que falsificaria:** prédio visivelmente fora da plataforma em aparelho real (a referência é 390×844; telas mais largas deslocam o `cover`) ou o dono achar os fundos novos claros demais e pedir a vinheta de volta.

## 136. Padrões da rodada de lançamento aprovados (L1–L9) e loop de 2 camadas removido (dono, modal, 20/10/2026)
- Decisão do dono: "Aprovar todos os padrões" (L1–L9 de `PERGUNTAS-DO-DONO.md`); e remover o loop de 2 camadas sem uso.

| Linha | Decisão (valor vigente) | Onde vive | Alternativa que perdeu | Gatilho para reabrir |
|---|---|---|---|---|
| L1 | Aprovada EM PARTE: 1 drop/dia, 3/semana, 1 uso/dia. ⚠️ O "+5 de energia" está superado pela §40 (13/10/2026): a premium enche a fome (`HUNGER_PER_PREMIUM` 100) e não dá energia | `premiumFood.ts:27-29`, `hunger.ts:40` | Outras constantes de teto | A premium virar a comida dominante na telemetria da semana |
| L2 | Work no caminho de Harmonia | `attributes.ts:33` | Work em Poder | Queixa de que "trabalho" não dá Poder |
| L3 | Teto de peso por subitens é retroativo (conta pura, derivada na leitura) | `taskModel.ts:149-158` (`effortWithSteps`/`taskEffort`) | Guardar o peso na criação da tarefa | Queixa de tarefa antiga perdendo peso |
| L4 | Masmorra idle: 4 h para regenerar, piso de 25%, 4000 ms entre lutas | `dungeonIdle.ts:24,33,36` | Outras constantes | Queixa de espera ou masmorra farmável |
| L5 | Gauge 30/45/60/60, energia ×2, crédito só na virada do dia | `progression.ts:34-37,208`; `creditGauge` em `dailyReset.ts:966` | Crédito imediato | Jogador não entender por que não evoluiu no mesmo dia |
| L6 | "Dia completo" é selo cosmético, sem peso na evolução | `dailyReset.ts:641-647` | Voltar a ser critério (reabre §30) | Pedido de recompensa de evolução pelo dia completo |
| L7 | SUPERADA em 14/10/2026 pela §56, sem aprovação: Conquistas têm "Resgatar" e o "?" acende com conquista cumprida e não resgatada. ⚠️ O comentário em `questMarks.ts:93-97` ("Fica sempre nula") está defasado | `questMarks.ts:98` (`hasUnclaimedMission`), commit `01d18fab1` | Remover o "?" das Conquistas | Conquista pronta sem "?" no aparelho |
| L8 | XP do Vínculo oculto no demo (demo não ganha XP) | `App.tsx:2021-2023` | Exibir sem gravar | Demo parecer quebrado por falta do XP |
| L9 | Padrão provisório mantido: `mascot-raven.png` com rótulo `TOUR_GUIDE_NAME`. Nenhuma arte gerada | `welcomeTour.ts:26`; pedido em `ASSETS-A-GERAR.md` | Arte própria agora | A arte própria do Mysterious Soulmon ser gerada e aprovada |

- **Loop de 2 camadas (SOM §12.5):** `public/sounds/trilha-base.webm` e `trilha-ritmo.webm` (122 447 + 122 092 B) removidos, com o manifesto `CAMADAS_DA_TRILHA` e o motor de reprodução do loop em `trilha.ts` (o módulo fica para consentimento e pausas). Alternativa que perdeu: manter como reserva. O que falsificaria: o dono pedir de novo um loop adaptativo por camadas (aí volta como asset novo, com Attributions e guard).
- **O que NÃO mudou:** nenhuma constante de regra; nenhum código de regra alterado.

## 142. Laboratório: rótulo "Vínculo", lotes reposicionados, Vínculo voando com sombra; humor com progressão de cores e legenda (dono, 20/10/2026; W13)
O lote do Santuário do Vínculo passa a se chamar **Vínculo/Bond** no mapa (a folha e o aria seguem "Santuário do Vínculo"); a Biblioteca e o Círculo de Amigos descem ao centro das plataformas, o Centro de Evolução e o Arquivo descem um pouco, o Vínculo sobe um pouco e ganha uma **sombra elíptica no chão** (só CSS, estática) por estar voando; o Perfil não muda. **Humor:** os 3 ícones do meio se pareciam, então os 5 PNG ganham progressão de matiz (mal vermelho-arroxeado → baixo laranja → normal amarelo → bom verde-lima → ótimo turquesa; `tools/mood-tint.py`, sem gerar arte nova) e uma **legenda de 11 px** sob cada um (Mal/Baixo/Normal/Bom/Ótimo; EN Rough/Low/Okay/Good/Great), para a cor não ser o único sinal. Falsificável se: o rótulo curto não for entendido, ou a legenda poluir o resumo de ontem.

## 144. Push de cocô com o app/PWA FECHADO: o cliente manda a agenda do dia na inscrição e o worker dispara (dono, 20/10/2026; emenda §113/§114)
- **Pedido do dono (20/10/2026):** o push de cocô só valia com o app aberto (o worker não lê o save, de propósito); "faça o push de cocô chegar com o app/PWA fechado".
- **Decisão:** a inscrição de push (`/api/subscribe` e `/api/fcm-subscribe`, MESMA KV `PUSH_SUBSCRIPTIONS`) ganha o campo `poop = { d, tz, t: [[slot, instante]] }`: só INSTANTES (dia local, fuso e até 2 horários em epoch ms; nenhum dado pessoal). Validado por `agendaCocoDeInscricao` (`_pushIdentity.js`): dia `YYYY-MM-DD` até 3 dias do relógio, fuso múltiplo de 15 min, cada instante tem de cair no dia `d`, slot 0..3 sem repetir, máximo `POOP_AGENDA_MAX = 2`; lixo descarta o campo inteiro. Quem monta é `serverPoopPayload` (`petPushEvents.ts`) a partir do plano do dia (só cocô futuro, acordado, que coube no teto); `NotificationManager` reenvia quando a agenda muda. O worker (`push-scheduler.js › poopNotifFor`, passada de 30 min) dispara na 1ª passada em ou depois do instante (nunca antes), no dia `d` do fuso da inscrição, nunca no D0, nunca na janela de descanso (`meals.rest`; só com `sleep` assume 10 h a partir do início). Teto e prioridade intocados (§113): cocô é a maior prioridade e nunca é cortável pelo `x`; no máximo 2 cocôs cabem nos 4/dia, e refeição/lembrete cedem pelo `x` como antes. Copy: a de convite de sempre (`poopPushCopy`), sem culpa nem medo. Idempotência: tag `poop-event-<slot>`, a MESMA do alarme local do APK e do aviso de dentro do app, então o sistema funde em vez de empilhar. Desligar as notificações faz o DELETE da inscrição (campo some junto); reinscrição sem o campo o apaga (registro regravado inteiro). A passada de 30 min passou a entregar uma LISTA por inscrição (cocô + refeição/lembrete na mesma passada saem os dois).
- **Compatibilidade:** worker antigo ignora o campo (nenhum leitor antigo o conhece); inscrição antiga sem o campo continua como hoje. O worker novo exige deploy manual.
- **Premissa declarada:** o fuso do `poop` é o offset do aparelho no momento do envio; se a mudança de horário de verão cair entre o envio e o instante, o instante pode ficar fora do dia `d` e ser descartado (silêncio, nunca hora errada) até o app abrir de novo.
- **Alternativa que perdeu:** só cliente (alarme local no APK e nada na PWA fechada); e o worker lendo o save (quebra a decisão de privacidade: o worker não lê save).
- **O que falsificaria:** cocô avisado em dobro ou fora de hora (pet dormindo, depois de o jogador já ter limpado, ou antes do cocô aparecer); mais de 4 pushes num dia; jogador que desligou as notificações ainda recebendo.

## 138. Widget Android sem a árvore genérica: mostra o inicial do jogador, ou um inicial por hash do estágio (dono, 20/10/2026; emenda a D-104 e ao §29/09 do corvo)
- **Decisão do dono:** o widget ainda usava os 11 `sprite_*` do gato-coruja descartado; trocar JÁ pelos iniciais novos (industrial, nascente, alento, vida, meteoro), com a mesma regra do app web.
- **Como:** `tools/gerar-sprites-widget.mjs` (idempotente, `--check`; fonte = `src/assets/soulmon/starters/<id>.png`, nunca o drawable) gera `drawable-nodpi/sprite_starter_<id>.png` 256² paletizado (14–20 KB cada) e apaga os 11 `sprite_*` genéricos. `widgetPetLine` passa a mandar `'corvo'`, o id do inicial (`resolveArtLineId`: linha aposentada vira o inicial de reserva) ou `''`; o plugin Kotlin grava `pet_line` só nesses valores; `WidgetRenderer.resolveSprite`: corvo → tabela do corvo; inicial por `pet_line`; senão `fallbackStarterId(stage)` (hash 31, 32 bits, módulo 5 — espelho de `fallbackStarterFor`). Widget instalado antigo ignora o valor novo (só entende `'corvo'`); app antigo + renderer novo cai no hash. Desktop já usa `getSpriteForStage` (iniciais): sem mudança, paridade intacta. `scripts/gen-soulmon-placeholders.mjs` deixou de regenerar a árvore genérica (só o `dungeon-spirit`). Régua: `widgetSprites.contract.test.ts`.
- **Alternativa que perdeu:** esperar o próximo APK/arte final e deixar o gato-coruja no widget.
- **O que falsificaria:** widget quebrado ou sem sprite em aparelho real (o Kotlin NÃO foi compilado nem rodado nesta entrega; só lido e coberto por teste de contrato sobre o fonte) ou criatura do widget diferente da Home para um jogador com inicial.

## 147. Torneio com a base na área marcada pelo dono; Arena livre desce o mínimo (dono, 20/10/2026; W19; emenda o §146)

- **Pedido:** "o TORNEIO tá mal posicionado: a área BRANCA (a BASE do prédio) deveria estar na área marcada em VERMELHO" (captura 390×844: escadaria em ≈(70,328) → alvo ≈(95,366), Δ = +25/+38 px).
- **Antes → depois (390×844):** Torneio base 19,1/42,8 → 25,5/47,3 (w 30,8 igual); a escadaria cai em (95,366), dentro do círculo vermelho. Arena livre 46,5/54,0 → 46,5/69,0 (desceu 15 pontos = 127 px, sem mexer em x). Guerra intocada (77,4/46,7).
- **Por que a Arena livre teve de descer tanto:** com o Torneio mais à direita/baixo, as caixas opacas (H11, rótulos incluídos) do Torneio e da Guerra ficam a 83 px uma da outra e a Arena livre tem 101 px: não cabe entre elas em x. Preservar o deslocamento relativo (+25/+38) bateria na Guerra; a menor saída em todos os 5 viewports do contrato é descer sem mexer em x (folga de 2 px). A diagonal do par ficou mais vertical (centro a centro 27,4/10,1 → 21,0/20,6 pontos). Nenhuma tolerância mudou; H12 intacto (opaco 26,3% e 26,0%).
- **Alternativa que perdeu:** centralizar o par na moldura (§146); o Torneio assentado na área do dono tira o par do centro do piso, e o teste "pegada do par × centro do piso" foi trocado por "âncora da escadaria do Torneio × alvo do dono (±3 px)".
- **O que falsificaria:** o dono achar a Arena livre baixa demais/solta do piso, ou a escadaria do Torneio fora do círculo vermelho na tela dele.

## 146. Torneio e Arena livre centralizados dentro da moldura de tijolos do piso (dono, 20/10/2026; W18; emenda o §145)

- **Pedido:** "os dois podem ficar mais CENTRALIZADOS no retângulo; a posição de um em relação ao outro está boa; talvez até mais próximos; tenta deixar os dois DENTRO do retângulo delimitado pelos tijolinhos."
- **Medida no `bg-arena.png` (1269×1700):** piso interno do bloco de baixo-esquerda = losango (280,775) (490,645) (735,832) (520,972) em px do fundo, centro (506/806) = 33,7% / 47,4% da cena em 390×844; a borda de tijolos tem ~28 px de espessura para fora. Ferramenta: polígono em `tools/w12-mapas.py` + prévias `w18-arena-moldura.png`.
- **Antes → depois (390×844, % da cena; base = left/top do lote, centro visual = caixa opaca):** Torneio base 18,1/49,5 w32 → 19,1/42,8 w30,8 (centro visual 18,1/43,0 → 19,1/36,4); Arena livre 46,1/61,1 w41 → 46,5/54,0 w39 (46,1/53,3 → 46,5/46,5). Diagonal preservada (centro de um a outro: 28,0/10,3 → 27,4/10,1 pontos). O par (pegadas) passou de 58 px abaixo do centro do piso para 0 px em y e 3 px à esquerda em x.
- **Mais próximos, até onde o H11 deixa:** distância entre os centros visuais 140 → 136,5 px. O limite é horizontal: a caixa opaca do Torneio (120 px mínimos de `MINW`, 28,5% a 360 px) e a da Arena livre não podem se encostar, então Δx ≥ soma das meias-larguras = 27,3 pontos (em 360 px de largura); ficou 27,4. Para chegar mais perto só encolhendo o Torneio abaixo de 120 px, que o `MINW` não deixa. Nenhuma tolerância mudou; H12 (opaco ≥ 24%) verde: 26,3% e 26,0%. A Guerra (P2) não mudou; o limite do lado direito é o H11 contra a Guerra (folga de 1,4 px).
- **Dentro da moldura: só em parte.** A caixa opaca (107×125 e 107×160 px) é maior que o piso (226×162 px); dois prédios com o H11 não cabem inteiros. Medido por pixel opaco (alfa > 20) em 390×844: a base (30% de baixo) da Arena livre estava 100% fora da borda externa de tijolos (até 65 px) e agora 14% (até 13 px); a do Torneio estava 0% fora e agora 24% (até 25 px: as pedras do rodapé passam da quina esquerda). Os corpos sobem por cima da borda de trás, como é normal na perspectiva isométrica. Em 360×640 o piso fica estreito (171 px) e o Torneio passa até 40 px. Consequência: o centro visual do Torneio (36,4%) agora fica 2,9 pontos acima do da Guerra (39,3%), e o contrato deixou de pedir "Guerra acima do Torneio".
- **Alternativa que perdeu:** posições sobre as marcas rosa exatas (§145), que deixavam a base da Arena livre pendurada fora do piso.
- **O que falsificaria:** prédio saindo da moldura de tijolos em algum viewport (hoje acontece nas pedras da base do Torneio) ou o dono achar o par alto demais em relação à Guerra.

## 145. Arena nas 4 vagas marcadas pelo dono: Guerra em P2, Torneio em P3, Arena livre em P4, P1 vazia (dono, 20/10/2026; emenda o §140)

- **Pedido:** "a posição dos prédios da arena não ficou bom", com a captura do app (720×1397) marcada: dois losangos pretos (a área) e quatro marcas rosa (as vagas). Os três prédios ocupam P2, P3 e P4; P1 (cima-esquerda) fica vazia, como decidido no §140.
- **Antes → depois (390×844, % da cena; base = left/top do lote, centro visual = caixa opaca):** Torneio base 18,5/49 w33,4 → 18,1/49,5 w32 (centro 18,1/43,0; marca P3 19,0/43,6). Arena livre 47,3/48,2 w42,8 → 46,1/61,1 w41 (centro 46,1/53,3; P4 43,1/52,2). Guerra 80,2/40,8 w40 → 77,4/46,7 w38 (centro 77,4/39,3; P2 76,3/38,3). O Arena livre agora fica 10 pontos abaixo do Torneio, na diagonal do losango, e não na mesma linha de chão.
- **O que cedeu:** a Guerra coube em P2 (opaco 35,0% = 1,28× o do Torneio). Torneio e Arena livre encolheram de 28,5% para 27,3% de largura opaca (≥ 24% do H12) e se afastaram até 3 pontos de largura do centro exato das marcas (as marcas são manchas grandes): a 390 px as marcas P3 e P4 estão a só 94 px na horizontal e 73 na vertical, e as caixas opacas de dois prédios de 27% não cabem nesse vão sem se encostar (H11). Nenhuma tolerância dos guards mudou. A posição em % é fixa e o `cover` do fundo desloca as marcas com a proporção da tela (a de 360×740 a 412×915 varia ~3 pontos em x), então o encaixe exato vale para 390×844 e fica a até ~40 px do fundo nos demais.
- **Alternativa que perdeu:** Torneio e Arena livre lado a lado na mesma linha de chão (§140, W14-A), que não acompanha a diagonal do losango.
- **O que falsificaria:** o dono ainda achar a Arena fora de lugar na tela dele (proporção 0,515) ou o par de baixo parecer apertado.

## 140. Arena em grade de 4 espaços e halo preto padronizado em todos os prédios (dono, 20/10/2026)

- **Pedido (ditado):** "cabe um do lado do outro, na perspectiva, alinhado com o retângulo: o Tournament e o Open Arena. O Clan War sempre MAIOR e CENTRALIZADO ali. Ou considerando como se fossem 4 espaços e deixa o vazio do quarto." Decidido em modal: grade de 4 espaços, o 4º vazio. E: "usa o mesmo efeito que você usou na exploração, um outer glow preto, em todos os prédios; tem alguns que estão sem".
- **Arena (antes → depois, % da cena, centro da base / largura):** Torneio 17/48,9 w36 → 18,5/49 w33,4; Arena livre 48/48,1 w44 → 47,3/48,2 w42,8; Guerra de Clãs 80,4/40,8 w36 → 80,2/40,8 w40. Torneio e Arena livre ficam lado a lado no retângulo de baixo-esquerda (centro 32,9/47,6), mesma linha de chão, mesmo tamanho opaco (28,5% da cena), sem se tocar; a Guerra fica no de cima-direita com 1,29× o tamanho opaco do Torneio.
- **Limite conhecido (decisão do dono pendente):** a Guerra NÃO está no centro do retângulo de cima (65,3%): o prédio dela é alto e a caixa opaca tocaria a do Arena livre, e o contrato H11 (alvos de toque nunca se encostam) é inegociável. O mais perto do centro que o H11 permite com os dois de baixo a 28,5% é ~80%. Para centralizar de verdade seria preciso reduzir Torneio/Arena livre a ≤ 24% (o piso do H12) e baixar o `minWidth` de 120 px dos lotes (hoje o Torneio a 360 px de largura já é puxado para 120 px), o que mexe no Laboratório.
- **Halo:** todo lote já passava por `AreaScene` com uma sombra solta `0 6px 6px` (a do mapa-múndi, `MapPage`, idem) — num fundo escuro (Arena, Laboratório, Hall) ela some, e era isso que parecia "sem". Agora UM ponto, `components/nav/lotHalo.ts` (`lotArtFilter`): contorno preto justo `drop-shadow(0 0 3px rgba(0,0,0,.92))` + a sombra de chão, em todo lote; trancado mantém o cinza (`grayscale+brightness`) e leva o mesmo halo; o halo claro do Caderno segue como acento. Dois filtros por sprite (já composto), nenhum por área. Contrato: `lotHalo.contract.test.tsx` varre os lotes das 6 áreas (abertos e trancados) e reprova lote sem o halo ou componente novo que desenhe sprite de lote.
- **Alternativa que perdeu:** halo só na Exploração (e Caderno).
- **O que falsificaria:** prédios "sujos" (contorno preto pesado) em fundo escuro, ou queda de desempenho no aparelho fraco com os filtros.

## 143. Humor: os 5 ícones são a arte do dono (dono, 20/10/2026)
- **Decisão do dono:** "usa essas para humor" (tira de 5 gotas em pixel art: cinza com chuva, azul triste, verde-água neutro, ciano feliz, dourado com brilhos). Substitui o tingimento do §142 e a arte L6 de humor; a legenda pequena embaixo (Mal/Baixo/Normal/Bom/Ótimo) fica.
- **Como:** `tools/mood-dono.py` fatia o original do dono (projeção de colunas de alfa, mesma escala nos 5, 128 px) e grava os cinco PNG; idempotente; `tools/mood-tint.py` foi desativado para não regravar os tingidos.
- **Alternativa que perdeu:** tingir a arte L6 (§142).
- **O que falsificaria:** os 5 não se distinguirem a 32–40 px sem legenda (a progressão agora é de forma E cor: chuva → triste → neutro → feliz → brilho dourado).

## 139. Textos longos cortados: os 10 piores corpos de modal/intro/tela passam a parágrafos de ≤ ~140 caracteres (dono, 20/10/2026; D-72; 2ª rodada pelo modal do dono)
- **Decisão do dono:** "o texto no geral tem que ser mais conciso; cortar os 10 piores textos longos".
- **Como:** Masmorra (descida e autonomia), Renascimento, plano da Oficina, muro de idade, Passeio (missões), Caderno, Torneio (faixas), Duelo/Arena (como lutar, resumo da Arena, rodadas). Mantidos: vocabulário canônico, `${}` das constantes, aria-labels e a voz sem cobrança/culpa/veredito. Os detalhes cortados (marcos e Glitchtama, profundidade por Lv, fome e energia) já vivem no Guia/Ajuda; as regras que não cabem viram parágrafos curtos separados no "i" da própria tela; "apagar a conta apaga o Caderno" está em `public/privacidade.html`, e "nada aqui conta nem pontua" voltou ao "i" do Caderno. Tabela em `prompts/d72-aplicado.md`.
- **Alternativa que perdeu:** manter os textos como estavam.
- **O que falsificaria:** jogador sem entender uma regra por falta de texto (ex.: não saber que a descida precisa de HP mínimo, ou o que é uma Travessia) apontado em relato ou teste de uso.

## 141. Clan Hall informativo ("Clan Code", "Bring Bits" com o total do clã); Grove e Feira completos em suas salas (dono, 20/10/2026; W14b; emenda o §133)
- **Decisão do dono:** o Clan Hall mostra SÓ a informação do clã. O rótulo do código de convite é "Clan Code" (não "Circle Code"; PT: "Código do clã"). Da contribuição de Bits ao clã ("Bring Bits") fica só a parte de dados e o TOTAL de Bits do clã. Tudo do Grove (inclusive PLANTAR) fica na sala do Grove; tudo da Feira, na sala da Feira. A loja do clã vem depois (BACKLOG em `PERGUNTAS-DO-DONO.md`). Casa, Prédios e Mural não mudam de sala ("Clan Hall é o prédio dentro de Hall").
- **Como:** `guild.codigo.label` e o aria de copiar passaram a "Código do clã" / "Clan Code" (o "Friend Circle" é outro conceito e não mudou). A seção Bring Bits (título + "Bits do clã: N") mora na Casa e aparece mesmo sem carteira; o botão de trazer Bits segue ali. O servidor passou a mandar `casa.bitsTotal` (Bits doados pelo clã: soma do que cada membro doou + `bitsLegado` de quem saiu, que nunca encolhe; um número do CLÃ, nunca por pessoa). Os gestos e a porta do Plantio saíram do Clan Hall para a sala do Grove (`room="grove"`); a Praça fica no Clan Hall. A Feira (missão/rodada) já era só da sala da Feira. **Emenda (dono, 20/10/2026, "o mistério é da feira"):** a porta do Mistério (`data-predio="misterio"`, com todo o seu estado e cartões) mora SÓ na sala da Feira (`room="feira"`), junto da missão e da rodada; o Grove fica só com Plantio ("Cuidar do bosque") e gestos; o Clan Hall não tem nenhum dos dois. Sem tela nova nem mudança de dados do clã.
- **Alternativa que perdeu:** salas misturadas (plantio na Casa/Prédios, gestos na Roda do Clan Hall).
- **O que falsificaria:** o jogador não achar o plantio (procurar no Clan Hall e desistir) ou a missão da Feira; medir a abertura do prédio Grove e o uso do plantio depois da mudança. Dúvida aberta: o que o dono quis dizer com "Isso aqui fica toda na Feira" (ver `PERGUNTAS-DO-DONO.md`).

## 137. Política de privacidade e ficha Play revistas contra o código; PRIVACY_VERSION sobe para 2026-10-20 (orquestrador, 20/10/2026; pedido do dono de 20/10; versão aprovada pelo dono em modal)
- **Decisão:** corrigir o texto da política (EN+PT) e da `PLAY-DATA-SAFETY.md` onde divergiam do código e **subir a `PRIVACY_VERSION` para `2026-10-20`** com o carimbo do HTML (`consent.versoes.contract.test.ts` amarra os dois). A mudança é **material** (dado novo declarado indo a terceiro e padrão de coleta que mudou); o dono aprovou a subida em modal em 20/10/2026, e o banner de termos reaparece.
- **Como:** política §2 (inscrição de push e "Meal check-ins" nascem ligados — `notificationDefault.ts`, `mealRhythm.ts` › `DEFAULT_MEAL_RHYTHM`), §2b/§6 (resumo agregado `chat.js` › `sanitizeBehavior`; opt-out `SettingsPage` "Send chat to AI provider"), §6d (cota `_aiGuard.js` `ai:<bucket>:<saveId>:<dia>`, TTL 30 h). Ficha: §2.5 e §3 (cota de IA como prevenção de fraude), §2.5b (refeições), §2.6 e §3 ("Informações de saúde" compartilhadas com Groq: `moodToday`, `moodAvg`, `soulGoal`). `PLAY-LANCAMENTO.md` sem "Supabase".
- **Alternativa que perdeu:** mergear o texto novo sob a data antiga de 19/10 (consentimento antigo cobriria texto que não citava o resumo nem a cota); ou deixar a ficha com saúde "não compartilhada" por ser só faixa numérica (subdeclarar é o erro que derruba a revisão).
- **O que falsificaria:** a Play recusar a ficha por divergência em saúde/IDs, ou um campo novo entrar em `CONTEXT_SCHEMA`/`BEHAVIOR_SCALARS` sem a política acompanhar.

## 148. Compatibilidade com usuários reais: o save não pode quebrar a partir de 20/10/2026 (dono, 20/10/2026; teste fechado na Play; regra = régua automática + texto)

- **Fato do dono (20/10/2026):** o app está em teste fechado na Google Play, o dono vai divulgar para recrutar testadores e o próximo passo é produção. A premissa de 07/09/2026 ("ninguém nunca usou o app em produção") venceu: tudo que antes se justificava por "não há quem perca o save" passa a exigir compatibilidade.
- **Decisão:** a regra viva mora no `CLAUDE.md`, seção "Compatibilidade — há usuários reais desde 20/10/2026", com 8 pontos: (1) todo campo novo do save tem leitura tolerante + migração idempotente + espelho no servidor; (2) nunca renomear chave (`STORAGE_KEYS`, campo de save, KV) sem migração; (3) contrato de API só aditivo; (4) bump de `CACHE_VERSION` quando o bundle ou o cache mudam de forma observável; (5) mudança em `android/` exige AAB novo e compatibilidade com o APK velho já instalado (o APK carrega `server.url`, então o Worker novo serve app velho); (6) reconsentimento só via `PRIVACY_VERSION`/`TERMS_VERSION`; (7) todo PR que toca save/contrato traz o plano de rollback; (8) backup antes de migrar KV/D1 (trocar binding/id de `SOULMON_SAVES` incluído).
- **Como é verificada:** régua automática `src/contexts/saveCompat.contract.test.ts` + o fuzz de hidratação `GameStateContext.hydrate.fuzz2.qa.test.tsx`; o texto do `CLAUDE.md` cobre o que teste não pega (backup, rollback, AAB). A régua garante servidor ⊆ cliente; o inverso (campo novo do cliente sem sanitização no servidor) fica na revisão de PR, declarado como limite (crítico adversarial de 20/10/2026, objeção 5).
- **Alternativa que perdeu:** (a) **só texto, sem régua** — o dono escolheu régua + texto, porque regra escrita sem teste se esquece no primeiro PR apressado; (b) **uma constante nova `SAVE_SCHEMA_VERSION`** — descartada: não existe hoje e seria um mecanismo grande; ancoramos no que já existe (`hydrateSave` + sanitizadores do servidor + `STORAGE_KEYS`).
- **O que falsificaria:** um save real quebrado por um campo novo que passou na régua (a régua é curta demais e precisa de um caso novo), ou a régua travar PR legítimo com frequência (ela é rígida demais).
- **Onde vive:** `CLAUDE.md` › Compatibilidade; `src/contexts/saveCompat.contract.test.ts`; `src/contexts/GameStateContext.hydrate.fuzz2.qa.test.tsx`; `docs/SEPARACAO-DIGIAPP.md` (aviso D-04); `wrangler.jsonc` (comentários).

## 149. Pesadelo é a primeira coisa do dia, a qualquer hora (dono, 20/10/2026; D-01..; emenda §99, §110, §111, §65)

- **Pedido (literal):** "no começo do dia, quando o usuário entrar no aplicativo e acordar o Soulmon, a primeira coisa que acontece é o pesadelo".
- **Decisão (Q2–Q6, D-06, D-07):**
  - **Q2:** só há pesadelo com noite registrada no horário (`onTime`) para a manhã de hoje. Sem noite registrada não há pesadelo e nada se perde.
  - **Q3:** QUALQUER hora. O portão de relógio 4h–12h do pesadelo saiu. "Começo do dia" é a primeira abertura/acordar do dia do jogador (`playerDayKey`, fuso fixo). Acordar → pesadelo (1º de `DAY_START_IDS`) → resumo → "Hoje".
  - **Q4:** pode pular sem custo: fechar expira e não volta no dia; perder ou pular deixa HP, Bits e energia iguais.
  - **Q5:** se o Soulmon acordou sozinho por concluir tarefa/hábito (app, widget, desktop), o pesadelo entra DEPOIS da celebração/toast, na próxima vez que a Home ficar livre (≥ 5 s, `NIGHTMARE_AFTER_COMPLETION_MS`, estando na Home). A conclusão nunca é interrompida (G-01).
  - **Q6:** com o Soulmon ocupado (Masmorra `dungeonAway` ou missão da guilda `guildMission`) o pesadelo ESPERA ele voltar no mesmo dia; virou o dia, expira sem custo; não traz o pet de volta. Sono real (`isSleeping`) continua segurando.
  - **D-07:** dia de sonho bom (`goodDream`) usa o mesmo slot (o GoodDream vem no lugar do pesadelo, §65); no dia seguinte volta o pesadelo.
  - **D-06:** o SONHO (modal) continua só entre 4h e 12h; fora da janela, se o pesadelo (ou sonho bom) ocupa o slot, o sonho do dia é coletado em silêncio no dex (`rest.dreams`), sem modal. "Nunca os dois" (§111) segue. Máx. 1 por dia do jogador (`nightmares.fought`, no save: o 2º aparelho não repete). Dia 1 (`bornToday`), demo e onboarding incompleto: sem pesadelo. Nenhum campo novo no save.
- **Alternativa que perdeu:** a janela 4h–12h com "pesadelo só de manhã" (§99/§110). Perdeu porque o dono quer que seja a primeira coisa ao acordar o Soulmon, seja qual for a hora. O risco de feedback de sono à noite foi ACEITO pelo dono e mitigado por exigir noite registrada e por poder pular sem custo.
- **O que falsificaria:** a taxa de "fechar sem lutar" subir muito nas aberturas da tarde/noite, ou queixa de pesadelo à noite (relato ou suporte).
- **Onde vive:** `src/utils/nightmareWake.ts` (`nightmareGateOpen`, `NIGHTMARE_AFTER_COMPLETION_MS`, `dreamMode`, `DREAM_MODAL_HOURS`, `nightmareRetryInMs`; testes em `nightmareWake.test.ts`) e os efeitos do pesadelo e do sonho no `App.tsx`.

## 150. O elemento do oráculo vira o da classe na leitura: planta → Vida, industrial → Aço (dono, 20/10/2026; hotfix do Perfil; emenda §75)

- **Bug (dono, 20/10/2026):** no Perfil do Soulmon (Laboratório › Perfil) a linha "Elemento" mostrava `planta` cru e o ícone caía no `neutro`. Causa: `petElementOf` devolvia o id CRU do oráculo (`soulmonMeta.dominantElement`), e `planta`/`industrial` não estão nos 17 base nem nos 136 pares. Sem ficha do estágio, a mesma id crua ia para a Arena, onde `COUNTERS['planta']` não existe: a vantagem elemental era SEMPRE neutra para essas criaturas.
- **Decisão:** o elemento existe e é da classe. `planta` → `vida` (Vida/Life, base); `industrial` → `aco` (Aço/Steel, par marcial+terra). Na Arena, sem ficha, a vantagem usa a BASE DOMINANTE (`baseDominanteDoElemento`): `vida` (+1 contra terra e gravidade) e `aco` → `marcial` (+1 contra arcano e tempo). A arte, a aura e a cena não mudam (já usavam `vida`/`aco`/`marcial`).
- **Regra de produto que muda de verdade:** quem tem criatura do oráculo planta/industrial e ainda não tem ficha do estágio passa a ter vantagem/desvantagem elemental na Arena (antes, neutra). Com ficha, nada muda.
- **Como:** dono único do mapa `src/utils/elementoDoOraculo.ts` (`ORACULO_PARA_CLASSE`, `elementoDoOraculo`, `aliasDoOraculo`); `petElementOf` devolve o id normalizado; `combatFx`, `attackFxArt` e `combatArt` importam o dono (os três literais duplicados saíram); `ELEMENT_BRIDGE` (pesos) é conferido por teste de consistência; `arena.ts › arenaElementsFor` aplica a base dominante sem ficha. Guard de grep em `elementoDoOraculo.test.ts` reprova literal novo do mapa fora do dono.
- **Compatibilidade:** normalização NA LEITURA; nenhum campo novo no save; servidor/PvP não leem `dominantElement` (`functions/api/_duel.js`). Rollback = reverter o commit.
- **Alternativa que perdeu:** manter o id cru e só traduzir o rótulo do Perfil. Perdeu porque deixava o ícone errado e a vantagem da Arena neutra, e mantinha três mapas divergentes (um dizia `industrial → marcial`, dois `→ aco`).
- **O que falsificaria:** relato de criatura planta/industrial com elemento diferente entre Perfil, golpe e aura, ou balanço da Arena desses jogadores fora da faixa dos demais.
- **Onde vive:** `src/utils/elementoDoOraculo.ts` (+ `.test.ts`), `src/utils/starterElements.ts › petElementOf`, `src/utils/arena.ts › arenaElementsFor`.

## 151. FX de ataque: o espelho sai de "para onde a arte olha" × "para onde o golpe vai", nunca do lado (dono, 20/10/2026; pedido repetido do backlog "Combate (efeitos de ataque)")

- **Bug (dono, pedido REPETIDO):** os poderzinhos do combate saíam virados ao contrário — ataque de espaço do inimigo "de trás pra frente", especial de luz do jogador também, físico do Nocterix (sombra) espelhado — e "acontece com vários".
- **Causa:** `BattleStage` assumia toda arte desenhada "para a direita" e espelhava só o golpe do inimigo (`flipX = actor === 'foe'`). Medido nos PNG: dos 155 elementos com arte (154 + `pesadelo`), **48 projéteis têm a cabeça à esquerda** (gravidade, marcial, tempo, espaço, luz, sombra, morte…), **116 cortes têm o bojo à esquerda**, e a arte de escudo (`defended`) entra por lados diferentes. O projétil do inimigo ainda girava 180°, saindo de cabeça para baixo.
- **Decisão (convenção):** "olha para" = a direção para onde o efeito aponta/viaja — projétil: a cabeça; corte: o BOJO (lado convexo) do crescente; `defended`: para onde o golpe recebido anda; cast/aura/impact são simétricos por contrato. O jogador (esquerda) golpeia para a direita, o inimigo para a esquerda; o espelho é `arte ≠ sentido do golpe`, uma conta só. O projétil ainda gira até o alvo, e indo para a esquerda gira `ang−180` + espelha (nunca de cabeça para baixo).
- **⚠️ Muda também o lado do JOGADOR:** os 116 cortes de bojo à esquerda passam a vir espelhados para o jogador (antes só o inimigo era espelhado). É a consequência de "bojo aponta para o alvo", que é o que o dono pediu para o Nocterix; se o dono preferir o oposto para o corte do jogador, é inverter UMA letra da convenção em `fxFacing.ts` (`slash`) e regerar a tabela.
- **Como:** dono único `src/utils/fxFacing.ts` (`fxFacing`, `fxMirror`, `orbPose`, `travelOf`); tabela `src/utils/fxFacingTable.ts` GERADA por `node scripts/fx-facing.mjs` (mede o PNG; um único override visual por inspeção, `onda_de_choque:orb`); `fxArtId` em `combatFx.ts` resolve a arte que de fato é desenhada (fallback `neutro`). Consumidores: `BattleStage` (orb, corte, escudo-fallback) e `Match3Game` (orb). Molde: `spriteUrlFacesLeft`/`LEFT_FACING_*` em `utils/sprites.ts`.
- **Régua:** `src/utils/fxFacing.contract.test.ts` remede os PNG e reprova tabela velha, exige cobertura dos 155 elementos × orb/slash/defended × jogador/inimigo, exige que o espelho do inimigo seja o inverso do do jogador e que o palco não volte a decidir por lado.
- **Compatibilidade:** só apresentação; nenhum campo de save, servidor ou regra muda.
- **Alternativa que perdeu:** corrigir caso a caso (espaço, luz, sombra) — o dono disse que não.
- **O que falsificaria:** qualquer FX de um dos dois lados saindo com a cabeça/bojo apontando para longe do alvo no aparelho (arte nova entra: rode o gerador; o teste avisa).
- **Não conferido no aparelho:** só medição do PNG + teste; olhar lado a lado no jogo (Arena, Masmorra, Pesadelo, Duelo, Match3).

## 152. O poder do ataque mágico (D-88) deixa de ser o "plim" e vira um "push": jato de ar CC0, curto e grave (dono, 20/10/2026; emenda o §130)
- **Decisão do dono:** o som do poder do ataque mágico "soa como um plim, muito ruim"; quer "alguma coisa tipo push" (impulso/rajada). Troca só o arquivo do D-88 (`public/sounds/sfx-combate-attack-ranged.webm`); evento, categoria `arcade`, nome `playAttackRanged` e caminho não mudam.
- **Como:** três candidatos derivados só de material CC0 da Kenney (Sci-Fi Sounds), em `D:/Soulmon/_gemini_out/w10-sfx/para-ouvir/`: **`D-88-push-a`** (instalado) = rajada de ar, recorte de `thrusterFire_001` com passa-baixa 3 kHz, ataque de 6 ms e queda rápida, 0,41 s; **`D-88-push-b`** = empurrão grave (`lowFrequency_explosion_001` + corpo de `explosionCrunch_000` passa-baixa), 0,36 s, mais "whump" e parecido com o especial; **`D-88-push-c`** = pulso de campo de força (`forceField_001` meio tom abaixo, passa-baixa 1,4 kHz), 0,47 s. Mestrados em −25 LUFS-M, codificados em Opus 64 kbps pelo MediaRecorder do Chrome e medidos no arquivo decodificado (instalado: 0,414 s, −24,65 LUFS-M, −4,3 dBTP, 3 698 B). Manifesto e `Attributions.md` atualizados; a fonte JaggedStone sai do uso.
- **Alternativa que perdeu:** outro sample mágico de banco (todos têm o tinido do "plim"); b e c ficam prontos para troca (basta substituir o arquivo e refazer hash/medidas).
- **O que falsificaria:** o dono ouvir o `a` e ainda achar fraco ou "ar demais" → trocar por b ou c. **Limite honesto:** a escolha foi feita sem escuta (por forma de onda e espectro); só o ouvido do dono valida (gate S8).

## 153. "Steps" da evolução viram Fragmentos de Alma — a MOEDA visível do gauge, ganha por ESFORÇO (dono, 20/10/2026; item do BACKLOG-PRODUTO › Evolução; emenda a decisão do gauge de 11/10/2026)

- **Pedido (dono):** trocar o nome/medida "steps" da evolução por uma moeda visível, **Fragmento de Alma** (EN *Soul Fragment*); ao juntar o custo do estágio os fragmentos são CONSUMIDOS e o Soulmon evolui.
- **Decisão (modal, 20/10/2026):** o fragmento é ganho **por ESFORÇO** — tarefa de esforço 1–3 rende 1–3, hábito rende `HABIT_WEIGHT` — mantendo o **teto diário** (= meta do estágio, `FORM_REQUIREMENTS[estágio].required`) e o **crédito na virada**. NÃO é "1 por ação": recompensa por contagem de tarefas segue linha vermelha. O que muda é só o NOME e o ícone; o número e a mecânica continuam.
- **O que NÃO mudou:** o campo do save continua `evolutionPoints` (1 ponto antigo = 1 fragmento, sem migração e sem perder progresso; `hydrateEvolutionPoints` intacta e idempotente); nunca decresce por dia ruim; zera ao evoluir (é o consumo); piso na queda por HP (`degeneratedEvolutionPoints`) e `ULTRA_PATIENCE_POINTS` inalterados; servidor não conhece o termo. Nenhum campo, chave ou contrato novo.
- **Como:** dono único do VOCABULÁRIO `src/utils/soulFragment.ts` (nome/plural PT+EN, frases da barra, da prévia de hoje, da ajuda e da cerimônia); glifo próprio `src/components/ui/SoulFragmentIcon.tsx` (cristal pixel 8×8 em SVG de `rect`s com tokens, mesma família do `BitsIcon`, forma distinta da moeda; sem imagem gerada). Aparece em: barra da página de Evolução (`EvolutionPath`: "X / Y" com o glifo, prévia "+N de hoje entram amanhã"), `EvolutionGaugeMini`, texto de ajuda, `GuideModal`, `HelpModal`, `EvolveTaskModal`, tour de boas-vindas, `i18n` e a **cerimônia de evolução** (`EvolutionCeremony`): durante o ritual "Seus Fragmentos de Alma se reúnem…"; ao concluir, uma vez, "N fragmentos de alma deram forma a esta evolução." (N = custo do estágio, `gaugeGoalFor`).
- **Tom (sem cobrança):** a frase principal da página trocou "Mais N passos de caminho até a próxima forma" (texto de falta) por "Você já juntou N fragmentos de alma a caminho da próxima forma" — descreve o que JÁ existe. Nenhum número desce; o consumo é dito uma vez, no ato.
- **Alternativa que perdeu:** (b) 1 fragmento por ação com teto diário próprio — perdeu por ser contagem de tarefas (anti-farm) e criar um segundo número ao lado do esforço.
- **O que falsificaria:** jogador lendo "fragmentos" como "1 por tarefa" e reclamando de tarefa grande valer mais (se for o caso, o texto de ajuda precisa dizer o peso na hora de criar a tarefa); ou relato de a cerimônia mostrar custo diferente do que a barra mostrava.
- **Compatibilidade / rollback:** só texto, glifo e UI; save e servidor intocados — reverter o commit não corrompe nada. Ainda não conferido no aparelho (APK/WebView): o glifo 16 px na barra e o texto da cerimônia.
- **Onde vive:** `src/utils/soulFragment.ts` (+ `.test.ts`), `src/components/ui/SoulFragmentIcon.tsx`, `src/components/EvolutionPath.tsx`, `src/components/EvolutionCeremony.tsx` (+ `.fragmentos.render.test.tsx`), `src/components/EvolutionGaugeMini.tsx`.

## 154. O tamanho do Soulmon depende do estágio: rookie pequeno, rookie grande é exceção rara (dono, 20/10/2026; BACKLOG-PRODUTO › Tamanho do Soulmon)

- **Pedido (dono, ditado):** o primeiro Soulmon (rookie) aparecia ENORME. O tamanho na tela depende do estágio: rookie pequeno por padrão, pode crescer (ou não) ao evoluir; pode existir Soulmon que fica pequenininho até o mega; um rookie grande pode existir, mas EXTREMAMENTE raro.
- **Medição:** cada tela dimensionava o sprite sozinha (Home em `PET_RENDER` 128 × zoom 1,5; visores a 128/64; `BattleStage` por `spot.size`; Dino no canvas). A arte de linha tem a caixa visível (lado maior da bbox do alfa ÷ canvas) em ~0,75–0,80 no rookie e 0,9–1,0 no mega; o sprite do Oráculo vem 512² com bbox variável — escalar pelo canvas faria o "enorme" voltar.
- **Decisão:** UM dono, `src/utils/spriteScale.ts`. Alvo por estágio = fração da caixa de render que o lado maior da CAIXA VISÍVEL ocupa: rookie 0,54 · champion 0,66 · ultimate 0,78 · mega 0,90 · ultra 0,96; fator = alvo ÷ preenchimento medido, preso a 0,3..1,25. Porte por criatura determinístico (hash da semente do save: `demoCharacterId` › `bornAt` › `createdAt`): 68% padrão, 20% `small` (cresce 65% da escada), 10% `tiny` (30% — o mega fica menor que um champion padrão), 2% `bigRookie` (rookie com alvo 0,84, nunca encolhe depois). A escada é monótona em TODO porte.
- **Aplicação:** `usePetScale`/`petScaleStyle` (propriedade CSS `scale`, origem nos pés) nas 14 telas que desenham o bicho do jogador (Home, Pet, Masmorra, Arena, Pesadelo, Duelo/Torneio via `BattleStage`, Match3, Dino, GoodDream, 3 jogos da Mente, Respiração). Só o desenho encolhe: hitbox do Dino, alvos de toque e chão não mudam. Retratos e cerimônias (evolução, nascimento, memórias, marcos) ficam fora de propósito.
- **Compatibilidade:** nenhum campo novo no save nem chave nova; a semente vem de campos que já existem. Rollback = reverter o commit (nada migrado).
- **Alternativa que perdeu:** escalar pelo tamanho do canvas (o acervo 512² preenche tudo e voltaria enorme) e sorteio por render (o bicho mudaria de tamanho a cada abertura).
- **O que falsificaria:** relato de Soulmon ainda enorme/minúsculo na Home em aparelho real, ou da mesma criatura com tamanhos diferentes entre telas.
- **Onde vive:** `src/utils/spriteScale.ts` (+ `.test.ts`), `src/hooks/usePetScale.ts`, `src/components/games/BattleStage.tsx` (`StageFighter.scale`), `docs/manual/06-REFERENCIA/utils.md`.

## 155. Pesadelo: só abre com 6 h de sono; e basta SOLTAR o especial, o anel não decide mais (dono, 20/10/2026)

- **Pedido do dono:** "para liberar o pesadelo o Soulmon tem que dormir pelo menos 6 horas" e "tira a necessidade de acertar o especial direitinho; basta soltar o especial".
- **Decisão (sono):** `nightmaresFor` só conta o pesadelo da manhã se a noite foi `onTime` E `wokeAt − sleptAt ≥ 6 h` (`NIGHTMARE_MIN_SLEEP_HOURS`, `sleptEnoughForNightmare`). Sem `wokeAt` registrado não há prova das 6 h: não abre (erro seguro). Acima de 6 h a duração não rende mais nada (tier e prêmio idênticos). **Isto muda a regra antiga "nunca em função de quanto tempo a pessoa dormiu"** (REGISTRO do pesadelo): a duração passa a ser um limiar, não um placar.
- **Decisão (especial):** `NIGHTMARE_KNOBS.ring.ruim` sobe de 0 para 1,6 (= `bom`): errar o anel não anula o golpe; `specialLanded` é sempre verdadeiro (o chip "Especial n/n" conta toda descarga). O anel `ótimo` continua dando o bônus cheio (2×). A torcida segue obrigatória (sem ela o Soulmon cai em ≥ 70% das sementes).
- **Alternativa que perdeu:** manter o piso do anel e só avisar. Perdeu: o dono quer o especial sem pontaria.
- **O que falsificaria:** pesadelo abrindo com noite < 6 h, ou luta de pesadelo sem torcida ficando fácil demais (> 30% de vitória) — ver `nightmares.pesadelo.test.ts`.
- **Compatibilidade:** nenhum campo novo no save; lê `sleptAt`/`wokeAt` que já existem. Noites antigas sem `wokeAt` simplesmente não geram pesadelo.
- **Onde vive:** `src/utils/nightmares.ts`, `src/utils/dungeonFight.ts` (`NIGHTMARE_KNOBS`), `src/components/NightmareBattle.tsx`.

## 156. O Soulmon se apresenta depois do batismo (dono, 20/10/2026; D-110..D-117; exceção à L1/§16)

- **Pedido (literal):** o Soulmon se apresenta ao jogador logo depois do batismo, dizendo que é "uma contraparte digital da sua alma" / "a digital counterpart of your soul".
- **Decisão:**
  - **(a) Quando e onde:** logo depois do batismo, antes de entrar no app, numa `NpcSequence` de fundo escuro. A arte é o sprite do reveal ou o casulo (`PLACEHOLDER_ART.dormant`), nunca arte de reserva. Tem Pular (Skip).
  - **(b) Fala:** template determinístico, sem IA, offline, EN primeiro + PT (`soulmonIntroLines`).
  - **(c) A frase literal:** "contraparte digital da sua alma" / "digital counterpart of your soul" fica LITERAL por decisão do dono, em conflito declarado com a L1 e com a §16 da bíblia (`NARRATIVA-E-UNIVERSO.md`). Fica registrada como exceção na régua `src/narrativa.contract.test.ts` (termo 'contraparte digital da alma'), permitida só em `src/utils/soulmonIntro.ts`.
  - **Escopo:** nascimento pago e upgrade demo->pago SIM; demo grátis, Nova Leitura e Renascimento NÃO (menos intrusivo).
  - **Sem campo novo no save:** o "visto" é o próprio ritual, que roda uma vez. O traço `petPassive` do nascimento pago passa a vir do onboarding (`getPassive(data.petPassive)?.id ?? rollPetPassive()`); o upgrade recebe `introPetPassive`/`introCategories`.
  - **Conteúdo:** "gosta" = a comida da categoria mais frequente das atividades iniciais (`FOOD_BY_CATEGORY`); "não gosta" = o elemento com vantagem sobre o dele (`COUNTERS`). Só fala, sem efeito de jogo.
  - **Dívida declarada:** planta->vida e industrial->aco são normalizados localmente até a frente `fix/elemento-oraculo-perfil` entregar o dono único do mapa oráculo->classe.
- **Alternativa que perdeu:** reescrever a frase sem alma/digital (o dono preferiu a literal); fala por IA (custo, offline).
- **O que falsificaria:** testador relatar a frase como estranha ou pesada, ou queixa de "o app disse que minha alma está no celular"; taxa de Skip alta.
- **Onde vive:** `src/utils/soulmonIntro.ts` (`soulmonIntroLines`, `INTRO_CLICHES_PROIBIDOS`, `INTRO_FRASE_MAX`); o passo `SOULMON_INTRO` em `src/components/SoulmonOnboarding.tsx`; o `petPassive` e as props do upgrade no `App.tsx`; a exceção em `src/narrativa.contract.test.ts`.

## 157. O jogador pode escolher outro elemento antes do desenho (dono, 20/10/2026; D-150..D-161)

> Aviso de numeração: a `main` tem uma §156 diferente desta branch; este número pode colidir na junção release->main. Renumere na junção.

- **Pedido (literal):** na tela do Hatch o Oráculo (Iris) diz "seu Soulmon é X, alma de Elemento (, tocada por Secundário): personalidade", com "Gostei" (primário) e "Me deixa tentar de novo" (secundário).
- **Decisão:**
  - **(a) A troca vem ANTES do desenho.** Passo novo `ELEMENT_DECIDE` (id `SOULMON_INTRO`+1) entre GENERATING e REVEAL. O `requestSprite` só sai no "Gostei". Tentar de novo não gasta cota, imagem nem Créditos. `generate-sprite.js` e `_aiGuard` ficam intactos.
  - **(b) "Escolha outro lado":** mostra o elemento dominante original e os candidatos de `elementChoiceCandidates`: o 2º colocado sempre, mais os empatados no 1º/2º. Ordem: pontuação desc, depois `ELEMENT_ORDER`. Função pura. O jogador vê só nome e descrição, nunca pontos.
  - **(c) Regera com o MESMO seed** e `OracleOverrides.dominantElement` (sem `Math.random`). Muda nome sugerido, bio, as 11 formas/prompts e `dominantElement`. Ficha de combate e essência ficam como lidas. A linha "Essência" saiu do cartão do REVEAL.
  - **(d) Sem campo novo no save.** O `SOULMON_PROFILE` segue `{input, seed}`; o result escolhido entra no save no lugar do primeiro.
  - **Escopo:** nascimento pago e upgrade demo->pago SIM; demo grátis NÃO. Nova Leitura e Renascimento sem mudança: regeram com seed nova e voltam ao elemento lido (declarado e aceito).
  - **Telemetria:** `reveal_retry` NÃO feita. O schema do cliente tem cópia em `functions/api/metrics.js` com teste de paridade; mexer é contrato de servidor. Dúvida aberta para o dono. `ELEMENT_DECIDE` fica fora de `onboarding_step`.
- **Alternativa que perdeu:** deixar trocar depois do desenho (custaria cota/Créditos e imagem descartada); sortear de novo com seed nova (resultado imprevisível, não é "escolher").
- **O que falsificaria:** a maioria dos jogadores trocar o elemento (a leitura do Oráculo não convence), ou queixa de que a troca "estraga" a surpresa do batismo.
- **Onde vive:** `src/utils/revealEscolha.ts` (`elementChoiceCandidates`); `generateOracleComplete(input, seed?, overrides?)`; o passo `ELEMENT_DECIDE` em `src/components/SoulmonOnboarding.tsx`; teste `SoulmonOnboarding.elemento.render.test.tsx`.

## 158. QA servidor + persistência: corridas de dinheiro, save que apaga a nuvem e backup forense (frente QA, 20/10/2026; L07-01..06, L08-01..04, L03-01)

- **Pedido:** corrigir os bugs de servidor e persistência do QA consolidado (`E:\Projetos\Soulmon-qa\BUGS-CONSOLIDADO.md`), com o app em produção e sem decidir a ADR-004.
- **Decisão:**
  - **(a) L07-01:** `auditRefunds` consulta a loja sem mexer no `ent:` e só depois RELÊ o registro e aplica o delta (voided, desconto idempotente, tier derivado, `auditedAt`). A janela que sobra é a de todo RMW do KV (ADR-005).
  - **(b) L08-01/02:** texto ilegível do save vai para a quarentena `soulmon-save-quarantine-v1`; carga degradada (ilegível, `GAME_STATE` ausente com `SAVE_ID`, ou marca `soulmon-local-stale-v1` de cota cheia) não posta até ler a nuvem; nuvem encontrada é adotada. Local íntegro não muda nada (sem GET novo no boot).
  - **(c) L08-03:** o logout grava num anel de 3 cópias (`soulmon-backup-ring-v1`) e só com progresso; o `soulmon-reconcile-backup` deixa de ser sobrescrito (o valor anterior vai para o anel).
  - **(d) L07-02/03/05/04/06, L03-01:** corte antes das regex; chat autentica antes do balde; erro do provedor sai como código; rank anônimo só lê pid; `secretEquals` no closeSeason; presentes com `gid` e trava D1 por presente.
- **Alternativa que perdeu:** `revision` + 409 no save (ADR-004) — fecha o caso geral, mas é decisão do dono (pergunta em `PERGUNTAS-DO-DONO.md`, 20/10/2026). Heurística "maior XP ganha" — perdeu porque o renascimento baixa XP de propósito.
- **O que falsificaria:** relato de progresso perdido depois de abrir o app num aparelho com local íntegro (caso que só a ADR-004 cobre); `order_claims` com linhas `gift:` crescendo sem limpeza; quarentena/anel estourando cota com frequência.
- **Onde vive:** `functions/api/_entitlements.js` (`auditRefunds`), `functions/api/_redact.js`, `suggest-tasks.js`, `chat.js`, `generate-sprite.js`, `community.js`; `src/utils/saveQuarantine.ts`, `src/utils/backupRing.ts`, `src/utils/storageKeys.ts`, `src/contexts/GameStateContext.tsx` (carga degradada), `src/utils/sessionReset.ts`, `src/utils/cloudSave.ts`. Testes `*.qa.test.*` de cada item.

## 159. Nomes dos NPCs do Passeio e do Restaurante em obra (dono, 21/10/2026)
- **Decisão:** o NPC do Passeio passa de Brume (e do rascunho Amandha) para **Mirk**, e o do Restaurante em obra (o caranguejo pedreiro) passa de Tijolino para **Brickle**. Só nome: arte, falas e regras ficam iguais.
- **Como:** `src/utils/areaNpcVoice.ts` (`namePt`/`nameEn`), `npcs/index.ts` (comentários) e os testes `playArea.render`, `areaLotsNovos`, `DailyReportModal.secoes` e `restauranteEmObra`; manual 02, 03 e 06 e `INVENTARIO-ASSETS.md`. Os registros datados antigos (§73 e outros) seguem citando os nomes da época: é histórico.
- **Alternativa que perdeu:** manter Brume/Tijolino. Brume e Brumefar/Rubrume coexistiam como nomes do Oráculo; Mirk não colide com nada.
- **O que falsificaria:** um teste de nome de NPC citando o nome antigo, ou estranheza dos testadores com o nome novo.

## 160. O som do golpe à distância (D-88) do Freesound (CC BY 4.0) foi retirado; volta o "push" CC0 do §152 até o dono escolher outro CC0 (dono, 21/10/2026; revoga a troca feita no mesmo dia)
- **O que aconteceu:** em 21/10/2026 o dono escolheu o "Slow Spell (Less Powerful)" (Freesound 732245, SilverIllusionist, **CC BY 4.0**, crédito obrigatório) para o golpe à distância; o arquivo (0,474 s, −24,89 LUFS-M, 4 184 B, commit `605dbdfa6`) chegou à `main`. Depois o dono decidiu **não ter tela de licenças/créditos**, e CC BY sem crédito visível não pode ficar no app.
- **Decisão:** o arquivo sai; `sfx-combate-attack-ranged.webm` volta ao "push" CC0 (Kenney `thrusterFire_001`, §152). A régua `sfxCombateLivres.contract.test.ts` volta a aceitar só **CC0 1.0** (nenhuma atribuição obrigatória). O dono vai escolher um novo som entre candidatos **CC0** (`E:\dowload
anged-cc0-*.wav`); nada é instalado antes da escolha.
- **Alternativa que perdeu:** manter o CC BY e publicar o crédito numa tela "Sobre / Licenças" (o dono não quer a tela).
- **O que falsificaria:** o dono voltar a querer um som CC BY (aí exige tela de créditos e a régua precisa aceitar CC BY de novo).

## 162. O golpe à distância (D-88) usa o zap `laserLarge_002` da Kenney (CC0), escolhido pelo dono entre 3 candidatos (dono, 21/10/2026; fecha o §160)
- **Decisão do dono:** depois de ouvir `ranged-cc0-1/2/3.wav`, escolheu o **candidato 3**: `laserLarge_002.ogg` (Kenney Sci-Fi Sounds, CC0 1.0), um zap de energia grave, sem sino.
- **Como:** velocidade 0,85x, passa-baixa 5 kHz, recorte de 0,5 s com fade-in de 3 ms e fade-out em cosseno de 0,25 a 0,50 s; mestrado em −25 LUFS-M e codificado em Opus 64 kbps pelo MediaRecorder do Chrome. Medido no arquivo decodificado: 0,415 s, −24,97 LUFS-M, −10,6 dBTP, 3 698 B. Manifesto `SFX_DE_COMBATE_LIVRES` (autor Kenney, `CC0 1.0`, `atribuicaoObrigatoria: false`) e `Attributions.md` atualizados; a régua segue só CC0.
- **Alternativa que perdeu:** candidatos 1 e 2 (JaggedStone `magical_6_0` e `magical_2`, CC0, da mesma série do "plim" reprovado); o "push" do §152.
- **O que falsificaria:** o dono achar o zap curto/agudo demais em jogo (o corte e o filtro são parâmetros).

## 163. Save com revisão e 409: a nuvem não é mais sobrescrita por aparelho atrasado (dono, 21/10/2026; ADR-004, L07-04)

- **Pedido:** o dono aprovou a ADR-004 com contrato aditivo e decidiu a política do mesmo saveId com local íntegro mas mais velho que a nuvem: só pela revisão. L07-04: nada a fazer.
- **Decisão:** `POST /api/save` aceita `baseRevision`; base diferente da gravada = 409 e nada é gravado. A revisão e o hash ficam no metadata da chave KV (o valor segue o state cru). Cliente sem base grava como antes. No 409 o cliente relê a nuvem e a adota, com o local recusado guardado antes no anel de backup e um aviso calmo; no boot e ao voltar de 5 min escondido, adota só revisão maior sem mudança pendente. Pid legado de amigo continua migrando na leitura.
- **Alternativa que perdeu:** envelope `{ v, revision, h, state }` no valor (ADR-004 original): obrigava a migrar `_bond.js` e `account.js` e tornava o rollback perigoso. Perguntar ao jogador no conflito e "maior XP ganha" (o renascimento baixa XP de propósito). Migrar todos os pids legados de uma vez (L07-04).
- **O que falsificaria:** relato de progresso perdido sem cópia no anel; 409 frequente (mais de ~1 por usuário ativo por semana nos logs `save: 409`) = a KV eventual perde a corrida e é hora de Durable Object; anel de 3 cópias girando rápido demais em quem usa dois aparelhos.
- **Publicação:** direto na `main` (fast-forward, produção) com **confirmação direta do dono em modal (21/10/2026)**, depois da suíte completa verde. **Rollback:** reverter o commit (o valor da chave KV nunca mudou de formato; a revisão no metadata volta a 0 sem migração; ao religar, quem tiver revisão gravada maior toma um 409 e adota a nuvem com cópia no anel). **Riscos aceitos pelo dono:** KV sem compare-and-set (janela de segundos entre dois POST / consistência eventual ~60 s, ADR-005); overlay do desktop ainda grava sem `baseRevision`; não testado em dois aparelhos reais. Correções do gate adversarial já incluídas: POSTs serializados por saveId, "envio em dúvida" (409 base+1 depois de falha de rede reenvia o mesmo corpo uma vez) e leitura atrasada não adotada.
- **Onde vive:** `functions/api/save.js`, `src/utils/saveRevision.ts`, `src/utils/saveReconcileRun.ts`, `src/utils/saveReconcile.ts`, `src/utils/cloudSave.ts`, `src/contexts/GameStateContext.tsx`, `src/utils/storageKeys.ts` (`soulmon-save-revision-v1`); manual 07 §3.3-A; `docs/adr/ADR-004-concorrencia-do-save.md`.

- **Onde vive:** `functions/api/save.js`, `src/utils/saveRevision.ts`, `src/utils/saveReconcile.ts`, `src/utils/cloudSave.ts`, `src/contexts/GameStateContext.tsx`, `src/utils/storageKeys.ts` (`soulmon-save-revision-v1`); manual 07 §3.3-A; `docs/adr/ADR-004-concorrencia-do-save.md`.

## 164. Restaurar backup pelo app (dono, 21/10/2026; L08-04)

- **Pedido:** o "Exportar backup" e as cópias do aparelho não tinham volta; o dono decidiu fazer a tela de restauração.
- **Decisão:** em Configurações > Seus dados, "Restaurar backup" lista as cópias do aparelho (anel de 3, cópia da reconciliação e a quarentena legível) e importa o arquivo `soulmon-local-backup-v1`. Cada cópia mostra data, nome e estágio da criatura e a origem em palavras, sem número de progresso. Restaurar pede confirmação, guarda o estado atual no anel antes (sem cópia não troca), não mexe na identidade, sobe para a nuvem com a revisão recém-lida (ADR-004) e recarrega.
- **Alternativa que perdeu:** restaurar só via suporte (o L08-04 viraria S4 proposital); mostrar XP na lista para ajudar a escolher (número vetado pela régua de linguagem; e o renascimento baixa XP de propósito).
- **O que falsificaria:** relato de restauração que apagou o progresso atual sem cópia; cópia listada que quebra o boot (o hydrate sanea, mas fica a vigiar); jogador que não acha a tela depois do aviso do 409.
- **Publicação:** direto na `main` (fast-forward) depois da ADR-004 (§163), com **confirmação direta do dono em modal (21/10/2026)** e CI verde. **Rollback:** reverter o commit (nenhuma chave nem campo novo no save; `congelarGravacoes` só existe até o reload). Correções do gate adversarial incluídas: só troca o local com a cópia do atual E da nuvem garantidas; offline não restaura; gravações do provider congeladas antes de gravar e recarregar.
- **Onde vive:** `src/utils/backupRestore.ts`, `src/components/RestoreBackupSection.tsx`, `src/components/AccountDataSection.tsx`; manual 03 (Configurações) e 06-REFERENCIA.

## 165. QA de cliente, lotes 2 e 3: decisões do dono de 21/10/2026 (frente `fix/qa-cliente-2` e `-3`)

- **L05-05 — o consentimento diz que PEDIMOS a data de nascimento.** Antes: "Não pedimos nem guardamos sua data de nascimento",
  e o ritual pede a data logo depois. Agora o texto do aceite diz, em PT e EN, que pedimos a data, para quê (o ritual do Oráculo) e
  onde fica (só no aparelho, como já diz `public/privacidade.html`). `TERMS_VERSION` e `PRIVACY_VERSION` **não mudaram** (QA-13: sem reaceite).
- **L11-06 — o cristal do onboarding mostra "crack".** A cada toque do usuário a palavra aparece sobre o cristal, maior que o texto de
  torcida do combate (30 px contra 13 px), decorativa (`aria-hidden`). O balanço do cristal já existia e não foi duplicado; as 5 batidas seguem.
- **L11-10 — a placa de vida sobe acima do sprite** na luta da Arena (`BARS_LIFT`, antes entravam 12 px na cabeça).
- **L04-02 — o Picross paga a BASE só na 1ª vez do DIA por desenho** (persistido em `soulmon-picross-base-paid`); o bônus do dia segue como era.
- **L04-01 — o NPC do treino do PvP: curva plana.** Antes "2 levels abaixo, dentro do estágio": o piso zerava a folga no 1º level de cada
  estágio (vitória do jogador ~46%) e no meio do rookie a folga era plena (~100%). Agora é o espelho do MESMO level com um handicap de
  ataque (`NPC_ATK_HANDICAP` = 0,055): 61–71% em todo level amostrado. O gate AC9 mede CADA level (1º, meio e último de cada estágio), não só a média do estágio.
- **L05-02/L09-04 — alvos de toque ≥ 44 px sem mudar o visual:** a área sobe (padding compensado por margem negativa) no link da missão e no "i".
- **L06-13 — o app trava em RETRATO** (`android:screenOrientation="portrait"` na `MainActivity`); só vale com APK novo (build de release é do dono; `DEPENDE-DE-VOCE.md`). Capacitor não tem chave de orientação.
- **L06-11 — o guia do tour se chama "Soulmon misterioso"** em PT (EN: "Mysterious Soulmon"). A grafia proposital "Solmon" de 11/10/2026 foi **revogada** em 21/10/2026.
  (`guildCopy.ts` ainda usa "Solmon" como palavra para a criatura em um texto de ajuda: fora desta decisão, fica para o dono dizer.)
- **Corrigidos sem decisão do dono (bugs):** G9 (loop de render do dreno de cocô), L02-01..05 (hábito "a cada N dias" no dia da conclusão, janela da virada,
  âncora por calendário, prazo da repetição), L05-06/07 (aviso de data impossível), L06-02 (campo acima do teclado + `interactive-widget`), L06-04
  (notificação só após o aceite), L06-09 (Combina 3 compacta até 800 px), L09-01, L09-02, L11-01/02/04/07/09/12/14/15/16.
- **Em espera por decisão do dono (21/10/2026):** a tela "Sobre / Licenças" (atribuições; o nome não pode ser "Créditos", que é a moeda) e a margem do Voltar fixo (L11-03, o dono quer ver antes/depois). Implementados em branches à parte, NÃO publicados.
- **Abertos:** L05-01 (FAB "Sair da demo", só demo), L05-04, L05-08/09, L06-07/08/12/14/15, L11-05/08/11 (L11-08 é frente de arte).

## 166. Presentes só somem depois da confirmação do aparelho (dono, 21/10/2026; L03-01 residual)

- **Pedido:** o resgate de presentes apagava a fila na própria leitura; se a resposta se perdesse na rede, o presente sumia. O dono decidiu adicionar o ack do cliente.
- **Decisão:** `gifts?claim=1&ack=1` entrega sem apagar; o app credita só os `gid` que ainda não creditou (conjunto local `soulmon-gifts-credited-v1`) e confirma com `POST giftsAck`, que apaga os confirmados. Com D1 o presente fica reservado 10 min para quem o recebeu. Cliente antigo sem `ack` continua com o resgate destrutivo de antes.
- **Alternativa que perdeu:** aceitar o residual (presente grátis, 20 Bits); apagar só por TTL (a fila crescia e o presente reapareceria).
- **O que falsificaria:** relato de presente creditado duas vezes no mesmo aparelho; fila `gifts:` que não esvazia (ack nunca chega); com D1, `order_claims` com `gift:` reservados e nunca confirmados crescendo.
- **Rollback:** reverter o commit. A fila `gifts:` não muda de formato; o servidor antigo ignora `ack=1` e volta ao resgate destrutivo; a chave local `soulmon-gifts-credited-v1` fica sem uso (o app antigo não a lê). Correção do gate adversarial incluída: o ack só sai depois de um save confirmado na nuvem que já contém o crédito, e a adoção da nuvem (409/boot) descarta os créditos ainda não confirmados para o próximo resgate creditar de novo.
- **Publicação:** fast-forward na `main` depois do lote 3 (§165) e do CI verde, por instrução da coordenação da frente (a confirmação direta do dono em modal registrada nos §163/§164 cobre A e B).
- **Onde vive:** `functions/api/community.js` (`gifts`, `giftsAck`, `GIFT_ACK_LEASE_MS`), `src/utils/community.ts` (`resgatarPresentes`), `src/App.tsx` (efeito de presentes), `src/utils/storageKeys.ts`; manual 02 (diretório e amigos).

## 167. QA de cliente, lote 4: demo no idioma certo, número legível e arrastar no Nonograma (frente `fix/qa-cliente-4`, 21/10/2026)

- **L05-08 — demo bilíngue.** Os hábitos semente da demo (`DEMO_ACTIVITIES`) acompanham o idioma: trocar `soulmon-language` depois de criar a demo
  não deixa "Drink a glass of water" numa UI em português (e o contrário). Só se troca o nome idêntico ao semente do outro idioma (`localizeDemoActivities`);
  hábito renomeado ou criado pela pessoa nunca é tocado. O 0 do Cinzel lia-se "o" ("0 Honra"): o NÚMERO das pílulas de Honra e Créditos do Mapa vai na fonte de texto.
  A moeda "R$ 29,90" em EN vem do preço da loja (Play), não do app: fora do escopo.
- **L06-08 — o Nonograma aceita arrastar.** O dedo que passa por várias casas pinta todas com o valor da primeira (cheia → enche, vazia → esvazia); o container
  usa `touch-action: none` (o navegador roubava o gesto com `pointercancel`); o clique que vem depois do arrasto é descartado. Toque simples e toque longo (X) seguem como eram.
- **Já resolvidos antes do lote (reclassificados):** L05-04 (a fileira de abas já mostra o corte com máscara, `data-cut` em `PixelTabs`).
- **Abertos, dependem de decisão de design do dono:** L05-01 (o "Sair da demo" fixo no canto inferior esquerdo foi PEDIDO dele em 20/10/2026 e cobre conteúdo na demo),
  L05-09 (estados de vazio), L06-07 (a lista da Home reordena ao concluir), L06-12 (rótulos do mapa sob a arte), L06-14 (folha "Nova tarefa" sob o teclado: mitigado pelo
  `interactive-widget=resizes-content`, falta confirmar no aparelho), L06-15 (a meta do dia não sobe ao criar tarefa), L11-05 (selo DEMO sobre o NPC), L11-11 (Esc nas telas cheias).

## 168. Splash/intro sem marca d'água e sem texto assado (dono, 21/10/2026; L11-08)

- **Problema:** `intro-poster.webp` e `intro.mp4` tinham a estrela do Gemini no canto e "LOADING DATA...", "SOUL_LINK ESTABLISHED" e "VERSION 1.2" pintados em inglês.
- **Decisão do dono:** regenerar no Gemini (imagem e vídeo) sem marca e sem texto; o texto passa a ser desenhado no app em PT e EN.
- **Feito:** vídeo novo do Gemini (saiu em paisagem 1280×720 com o quadro retrato no meio; cortado no centro para 9:16 e reescalado a 720×1280, sem áudio — a intro sempre tocou muda), pôster = 1º quadro desse corte (sem salto na troca), `IntroLoading` em DOM ("Carregando dados..." / "Vínculo de alma estabelecido", barra enchendo em 10 s, só tokens, `prefers-reduced-motion` mostra tudo pronto). `intro.mp4`: 2,52 MB → 0,73 MB (a dívida do guard de bytes pode baixar). A pílula "Welcome" (§79) ficou.
- **Honestidade:** a barra é o relógio da intro, não mede carga real; é identidade, não indicador de progresso.
- **Trade-off:** o corte 9:16 reaproveita só 402×715 px do vídeo (upscale ~1,8×), então fica mais macio que o pôster antigo; os lados escuros com folhas e monstros do vídeo original se perdem.

## 169. QA de cliente, lote 5: a lista da Home não reordena sob o dedo (dono, modal, 21/10/2026)

- **L06-07 — congelar a ordem por ~2 s.** Ao concluir um item da Home os concluídos desciam na hora e o toque seguinte no mesmo ponto acertava OUTRO item.
  Agora o item recém-concluído fica ~2 s no lugar e só então desce (`hooks/useOrdemCongelada.ts`, usado pelos dois `sort` de `DailyRituals`); quem já
  estava concluído na primeira pintura nunca congela; conclusões em sequência têm prazo próprio (um teste pegou o bug de a 2ª cancelar o prazo da 1ª).
- **L05-01 — nada a mudar** (resposta do dono): o "Sair da demo" fixo no canto inferior esquerdo fica como foi pedido em 20/10/2026.
- **L11-11 — nada a mudar** (resposta do dono): o Esc não fecha as telas cheias (luta da Arena, Combina 3), para ninguém perder a rodada por um Esc sem querer.
- **L06-15 — DEIXAR COMO ESTÁ (dono, modal, 21/10/2026).** Ele chegou a pedir que o cabeçalho mostrasse o estado real ao criar tarefa nova, e depois de ver a regra
  decidiu manter: **meta = `min(cadastradas no dia, requisito do estágio)`** fica CONFIRMADA, o contador `Missão N/G` segue mostrando a META (N pode passar de G: `6/4` é aceito),
  sem "N pendentes" e sem trocar o denominador. Nada mudou no app.

## 170. QA de cliente, lote 6: rótulos do mapa por cima, selo DEMO fora das folhas, estados com causa (dono, modal, 21/10/2026)

- **L06-12 — o lote mais alto fica por cima.** O rótulo mora na base de cada lote e a arte do vizinho de baixo o cobria ("SALÃO DE JOGOS", "ATELIÊ DA MENTE", "CONQUISTAS").
  `AreaScene` empilha por `top` (`lotZIndex`: quanto mais alto na cena, mais para cima); a posição dos prédios não mudou.
- **L11-05 — o selo DEMO some com folha de lote ou diálogo aberto** (`body:has([data-area-sheet-backdrop], [aria-modal="true"]) .sm-demo-seal`); cobria o nome do NPC do Restaurante.
- **L05-09 — três ajustes pequenos.** O vazio do "View all" diz a causa (busca, filtro de tarefas, filtro de hábitos), em PT e EN; o modal "Primeira tarefa feita!" abre com o foco no botão primário;
  o cartão calmo (missão especial) ainda não feito não reserva a coluna de ícone vazia.
- **L06-14 — pendente de confirmação no aparelho** (dono, modal): o viewport `interactive-widget=resizes-content` + `scrollIntoView` do `Field` devem manter Cancelar/Salvar acima do teclado;
  o dono confirma depois do próximo AAB. Se persistir, abre-se um botão fixo acima do teclado.

## 171. Geração recusada por conta não paga deixa de ser muda (dono, 21/10/2026; frente `fix/qa-cliente-7`)

- **O achado:** uma conta de teste voltou à demo (conta excluída) e o cristal do reveal ficava parado SEM aviso: o servidor responde 402 `paid-tier-required`
  (`generate-sprite.js`, `requirePaidTier`) e o cliente engolia o erro (`catch { /* falha de geração não é falha do ritual */ }`); no acervo, QUALQUER 402 virava `lifetime-cap`
  ("a conta estourou o teto vitalício, para para sempre") e o card ficava mudo.
- **O que mudou (só web, contrato do servidor intacto):** `spriteGen` ganhou a razão `paid-required` (402 com `error: 'paid-tier-required'`; o 402 sem código segue `lifetime-cap`), não retentável.
  No **ritual de nascimento** a tela do reveal troca a frase "o desenho ainda está sendo feito" por um aviso calmo (PT/EN, sem culpa) e um botão "Desbloquear a conta" que abre o MESMO modal de compra
  (`UnlockAccountModal`, motivo `ovo`); comprado, pede o desenho de novo. O ritual NÃO bloqueia: dá para chocar com a arte de reserva.
  No **jogo**, o lote do acervo grava `paid-required` (NÃO terminal: pagar reabre a geração), PARA (as outras formas levariam o mesmo 402) e avisa uma vez por sessão com um toast cuja ação abre o
  desbloqueio já existente (`soulmon:unlock-needed` → `setUnlockReason('evolution')`, o mesmo caminho do "Gerar personagem"; só se a conta não for paga). O card da Evolução passa a ter a frase
  (`spriteFailText('paid-required')`). O texto vive em `AVISO_CONTA_NAO_PAGA`/`SPRITE_COPY.paidFail`/`RevealContaNaoPaga`, sem string solta.
- **Régua:** `spriteGen.contract.test.ts` (402 `paid-tier-required` ≠ teto), `spriteRunner.test.ts` (não retenta, para o lote), `spriteCopy.paga.test.ts` (aviso uma vez, ação = evento do desbloqueio),
  `RevealContaNaoPaga.render.test.tsx` (aviso + ligação no onboarding).

## 172. Endless Rift (M6): score mensal, três faixas e Crédito como prêmio (dono, 25/10/2026)

- **O que é:** a masmorra (`DungeonGame.tsx`; ids de save e arquivos NÃO mudaram) aparece como **Endless Rift / Fenda Sem Fim**, descida sem teto mantida. Ganhou um **score MENSAL que reinicia**:
  a **camada mais funda limpa no mês** (UTC, chave `YYYY-MM`). Save: `riftMonth?: { m, best, claimed }`, leitura tolerante (`sanitizeRiftMonth`/`hydrateSave`); save antigo sem o campo = 0 no mês atual;
  mês velho reinicia sozinho na leitura. Dono: `src/utils/endlessRift.ts`; também alimentado pela descida que continua fora da tela (`dungeonAway.ts`).
- **Três faixas por profundidade no mês (limiares CONSERVADORES, o dono calibra com dado real; cada faixa paga UMA vez por mês):** faixa 1 = camada 25 → **material** (20 fragmentos do Soulsmith);
  faixa 2 = camada 100 → **mais Bits (+100)**, creditados pelo funil existente (`creditMinigameBits`/`onEarnPoints`: o teto diário de Bits vale; NENHUMA fonte nova de moeda fora do funil);
  faixa 3 = camada 250 → **competitiva**: a partir dela o cliente envia o score ao ranking mensal (`endless-rift` na allowlist de `_rankings.js`, período `monthly`, teto de score 999 por jogo).
- **Exceção "Crédito como prêmio" (dono, 25/10/2026).** A regra de 💎 Créditos ("só dinheiro real; não existe caminho de jogo para Créditos") ganha UMA exceção, estreita: o **top 3 mensal** do Endless Rift
  recebe **Créditos 50 / 25 / 10**, pagos **SÓ pelo servidor** (`grantRankPrize` em `_entitlements.js`, chamado só por `_riftPayout.js`). O cliente NUNCA credita: só LÊ `prize` na resposta do ranking.
  `payablePlacements` pula os `simulated` (o prêmio desce ao próximo jogador real). Empate de score: quem chegou àquele score primeiro (`t` no metadata do placar) fica na frente; depois `saveId` (determinístico).
  Não vira regra geral: nenhuma outra recompensa de jogo paga Créditos; Bits→Créditos continua inexistente. Gatilho de revisão: se o prêmio for farmado (score forjado: o cliente é editável e o score é
  o do cliente, limitado a 999), tirar os Créditos do prêmio ou validar a descida no servidor.
- **Fechamento PREGUIÇOSO com trava KV (por quê):** não há cron confiável nas Pages Functions (o worker de push é outro deploy). Em vez disso, no primeiro acesso a `/api/rankings` no mês seguinte o servidor tenta fechar o
  mês anterior (`closePreviousMonth`, `_riftPayout.js`). **Idempotência:** trava `rift-payout:<YYYY-MM>` gravada ANTES de pagar (com token, relido: só segue quem reconhece o próprio token), por usuário
  `rift-paid:<YYYY-MM>:<saveId>` gravada ANTES do crédito (prefere-se perder um pagamento a pagar duas vezes), `done` definitivo e `running` velho (>10 min) retomável sem repagar quem já recebeu. Limite honesto:
  o KV é eventualmente consistente, então a trava é best-effort contra dois primeiros acessos EXATAMENTE simultâneos; a defesa contra repetição é a chave por usuário. Régua: `functions/api/_riftPayout.test.js`
  (2x paga 1x, simulado pulado, empate, retomada, trava recente) e `src/utils/endlessRift.test.ts`.
- **REVISÃO DO DONO ANTES DE PAGAR (dono, 25/10/2026, QA beta3 — substitui o parágrafo de idempotência acima):** o fechamento do mês **não paga**: grava o top 3 real (sem simulados) como PENDENTE (`rift-pending:<YYYY-MM>:<saveId>`); o dono vê a progressão (lastro: camada de partida, camadas começadas, recorde do servidor, histórico de 3 meses) em `/gm/rift` e aprova/rejeita por `/api/gm-rift-payout`; só a aprovação chama `grantRankPrize`. A marca de pago mora DENTRO do `ent` (`ent.rankPrizes`, `rift:<mês>`), no mesmo ler-modificar-gravar do crédito: não depende de KV eventual; falha deixa o pendente pendente; conta apagada nunca recebe. **Lastro** (`_dayCounters.js`): ancorado no ponto de retomada do mês (`base`) + camadas começadas contadas pelo servidor com taxa de 60/dia + recorde do servidor que só sobe o que as camadas provam; score aceito ≤ base+n−1 (quem retoma perto do recorde não leva mais 409; forjar `dungeonDaily` não rende). Limite honesto: a 1ª leitura do recorde de uma conta antiga é confiada — por isso a aprovação do dono. **Faixas** 25/100 pagam por progresso NOVO no mês (`riftMonth.base`, `riftProgress`), não por retomar perto do recorde vitalício.

## 173. Simulados LIGADOS no merge; motor fora do caminho do POST (dono, modal, 25/10/2026; QA `fix-qa-srv2`)
- **Decisão do dono:** os 50 simulados (M11) ficam **LIGADOS** no merge — `SIMULADOS_ON: "1"` permanece em `wrangler.jsonc` (a var do arquivo sobrescreve o painel a cada deploy; para desligar, o dono edita o arquivo e faz deploy). Isto substitui o "desligada por padrão" da seção M11 de `docs/PERGUNTAS-DO-DONO.md`.
- **Custo corrigido (R6 ALTO):** `ensureSimuladosDia` saiu do caminho síncrono: as rotas chamam `agendarSimuladosDia(context)` = `context.waitUntil` (sem `waitUntil`, testes/dev, cai no `await`). Lote por invocação: `CHUNK = 3` simulados **e** estimativa `< OPS_BUDGET = 34` operações de KV (`custoEstimado`), sempre ≥ 1 simulado; cabe com folga nos 50 subrequests por request das Pages Functions. O dia fecha em ~30 invocações (era ~7), diluídas pelas requisições normais.
- **Falha não marca lote como feito:** um simulado que lança PARA o lote e fica em `next`; contador `fails` na trava; só após 3 falhas seguidas o simulado é pulado (para não travar o dia).
- **Trava `sim:dia:<dia>` com token:** `owner` aleatório + `leaseUntil` (30 s); grava o token, relê, e só prossegue se ainda é o dele; lease alheio vigente = não trabalha; solta só se ainda for dono. CAS **best-effort** (KV é eventualmente consistente): a garantia real continua sendo a idempotência de cada passo.
- **RISCO DE ROLLBACK (R2 MÉDIO):** ligar grava `profile:sim_*`, `sim_*` (save), `nick:*`/`nickof:sim_*`, `pid:*`, `rank:*` e scores nos placares. **Desligar `SIMULADOS_ON` NÃO apaga nada**: os perfis seguem no diretório/oponentes até o TTL (perfil 365 d, save 400 d, nick/pid 400 d, score 70 d) — só para de gerar novos scores. Para um rollback limpo é preciso apagar essas chaves (`sim_0001…sim_0050` e derivadas) à mão; sem isso o jogador continua vendo "gente" que o servidor não mantém mais.
- **Roster no bundle (R6 MÉDIO):** conferido — `functions/api/_simulados.data.js` só é importado por `_simulados.js` (servidor) e pelo script de fila; **nada em `src/` o importa**, logo não entra no chunk de entrada (sem import dinâmico a fazer).
- **`names` público:** exige prefixo ≥ 2 caracteres e não devolve apelido de quem está com `publicHidden`.
- **Grove/clã:** `claRegar`/`claProteger` não exigem mais `claSortear` prévio — sem sorteio HOJE (cliente antigo) o servidor sorteia a ação pedida e segue; sorteio de OUTRA ação no dia continua valendo (1 ação/dia) e segue dando 409 `no draw`.
- **NO_VISIT:** `visit:jogos.dungeon` e `visit:exploracao.preparar` (prédios placeholder) saíram das primeiras-vezes (cliente e espelho do servidor). `visit:exploracao.refugio` não tem o mesmo problema: `jogos.refugio` já é remapeado para o mesmo id pelo `currentBuildingId`, então não é resgatável duas vezes.

## 174. Calabouço roguelike: bônus com multiplicador PRÓPRIO é exceção do dono; desafio em curso consome o passo (dono, 25/10/2026)

- **Exceção declarada:** os bônus da incursão do Calabouço (`power` +6% ATK, `vigor` +10% HP, `heal` escudo de 15%) têm multiplicador próprio (`POWER_STEP`/`VIGOR_STEP`/`HEAL_SHIELD` em `utils/rogueDungeon.ts`), fora da curva de talentos/equipamento do Combate v3. Valem SÓ na incursão do dia e SÓ são lidos em `simulateRogueCombat` — travado por `src/utils/qa.masmorraFoco.test.ts` (nenhum outro módulo de combate os lê).
- **Sem re-tentativa grátis:** ao entrar num desafio que não é combate grava-se `RogueRun.pending` (campo opcional; save antigo não tem). Sair/desmontar/fechar o app sem terminar CONSOME o passo (`consumePending`); falha de carga do jogo (offline) não gasta (`cancelChallenge`, botão Voltar do Error Boundary).
- **Exploração fica para depois:** a ferramenta de Exploração do Calabouço é backlog (`docs/BACKLOG-BETA3.md`); o Eco permanece.
- **Descida de foco acompanha o timer:** pausar congela (`dungeonAway.pausedAt`), continuar retoma com o novo fim, cancelar retira o Soulmon (acerta o que já rendeu). O texto da Oficina separa "Foquei" (sem Bits) dos Bits da descida (teto diário).

## 175. Loja do Clã: cosméticos da Casa comprados com os Bits do clã, servidor decide (dono, 26/10/2026; rodada 5, lane A)

- **Decisão do dono:** seção "Loja"/"Shop" no Salão do Clã (`GuildSheet`, abaixo da Casa). Paga com os Bits TOTAIS do clã (`casa.bitsTotal`). **Só cosméticos da Casa** (nada com vantagem de jogo; não cresce a árvore). **Sem contribuição individual com nome+número** (linha vermelha): quem comprou não é gravado; a vista leva só `casa.loja = { itens, saldo }` (um número do clã).
- **Como:** catálogo de 8 itens com ids estáveis `loja-*` e preço em `functions/api/_lojaCla.js` (verdade); espelho para exibir em `src/utils/guildLoja.ts` (arte = decoração existente, `DECOR_ART`); `guildLoja.test.ts` prova a paridade de ids e preços. Endpoint `POST guildShopBuy {id, dayKey, itemId, opId}`: o cliente **nunca manda preço**; item inválido 400, `opId` inválido 400, saldo curto 409 `not enough bits` (nada gravado), item já do clã 409 `already owned` (sem cobrar), **idempotente por `opId`** (repetir devolve `repeated:true` sem cobrar; mesmo `opId` com outro item 409). Saldo = `bitsDaCasa(g, cartões) - gasto`; `bitsTotal` (doado) NÃO muda, então o total do clã continua só subindo e quem sai não encolhe o saldo (`bitsLegado`).
- **Campo novo, aditivo:** chave KV do clã `coopLoja:<gid>` = `{ v:1, gasto, itens, ops }` (TTL 120 dias, como a Casa); `normalizarLoja` é tolerante (ausente/lixo = vazio) e a vista sempre devolve `loja`. Cliente: `sanitizeCasa` lê `loja` com default vazio (servidor antigo = sem Loja de itens, saldo `null`, botões desabilitados). Nenhuma mudança no save do jogador. Cliente antigo ignora o campo novo.
- **Custo:** +1 leitura de KV por vista (a chave do clã, não por membro); o orçamento de `guild.l2.test.js` subiu 1 em cada ação (criar 17, entrar 29, fio 27, checkin 27, golpe 41, gesto 26, vista12 18), no mesmo padrão dos reajustes anteriores.
- **Copy:** `lojaText` em `guildLoja.ts` (EN primeiro), fora da tabela `GUILD_COPY` de propósito (essa exige chave no documento de copy e fecha a lista de `{n}`); a régua própria está em `guildLoja.test.ts` (sem dígito literal, sem vocabulário de cobrança). Sem saldo o botão só descansa; sem "faltam N".
- **Alternativa que perdeu:** guardar a Loja no registro `g` do clã (zero leitura extra) — perdeu porque outros escritores de `g` (fechamento do Bosque) fazem leitura-modifica-grava e poderiam apagar uma compra e zerar o `gasto` (gasto em dobro). Também perdeu: cliente manda preço / saldo no cliente; e Bits por pessoa (placar de quem doou).
- **O que falsificaria:** ninguém comprar nada em semanas (preço alto demais para o ritmo de doação: teto de 200 Bits/pessoa/dia); ou duas compras simultâneas de membros diferentes passarem juntas (KV eventualmente consistente; o `gasto` pode ficar acima do saldo por uma compra) — nesse caso mover a compra para uma trava com token como a de `_riftPayout.js`.
- **Rollback:** tirar `<GuildLoja>` do `GuildSheet` esconde a Loja sem tocar em dado; o servidor pode manter o endpoint (inócuo) ou remover a rota. Os itens comprados ficam em `coopLoja:<gid>` e somem sozinhos pelo TTL; nada do save do jogador depende deles. Devolver Bits: não há (o saldo do clã é derivado; apagar a chave `coopLoja:<gid>` devolve tudo de uma vez).

## 176. Energia: 1 unidade a cada 60 min a 100% (dono, 26/10/2026; revê a linha "Regeneração a 100%" do §40)

**Decisão do dono (26/10/2026):** "recuperar 1 de energia a cada hora se full". Interpretação: bem alimentado (faixa 100%, fome ≥ 60) a energia sobe **1 por hora** (era 1 a cada 120 min). Mediano (50%) e faminto (0%) continuam proporcionais e a fome não mudou.

**O que mudou:** só `ENERGY_REGEN_MINUTES` 120 → 60 (`src/utils/hunger.ts`, dono único); `UNIT_POINTS` deriva dela. Textos (statTips, HelpModal, GuideModal, PT e EN) leem a constante. Servidor e desktop não espelham o valor (grep em `functions/`, `server/`, `desktop/`: só um teste de paridade de comida, que não toca regeneração). O teto físico do dia a 100% passa de 12 para **24 unidades**.

**Compatibilidade do save:** o `energyClock.carry` está em ponto-ms e foi gravado com a unidade antiga (até 2× a nova). `sanitizeEnergyClock` agora só limita ao teto da unidade ANTIGA (não corta progresso válido); `settleEnergy` já converte carry ≥ unidade em unidades inteiras na primeira leitura (idempotente: depois o resto fica < `UNIT_POINTS`). Efeito: no máximo **+1 unidade, uma vez**, por jogador com carry antigo > 60 min; o progresso em minutos reais é preservado, nunca decresce. Testes em `hunger.test.ts`.

**Balanço (régua `hunger.balanco.test.ts`, comendo espalhado 8–22 h, energia gasta na hora), conclusões/dia → energia/dia:** 0 → 0 · 1 → **1,4** (era 0,7) · 2 → **2,8** (1,4) · 3 → **5,6** (2,8) · 4 → **11,8** (6,0) · 6 → **18,5** (9,2) · 9 → **19,2** (9,7) · 12 → **19,7** (9,7). Dobrou em todas as linhas. O "leve" (2) agora fecha o orçamento do §30 (≈2, antes ficava em 1,4); o "médio" (4) passa do alvo 3–4 (11,8) e o "intenso" já satura o tanque. **Impacto na Masmorra (1 energia por camada):** quem faz 4+ conclusões por dia pode pagar ~2× mais camadas; o freio passa a ser o limite diário de camadas (`dungeonDaily`) e as barras do estágio, não a fome.

**Gatilho de revisão:** o balanço da Masmorra. Se a profundidade/dia dos jogadores ativos subir de forma que enfraqueça o recorde ou a economia de Bits, reverter para 120 ou subir `HUNGER_PER_FOOD` não resolve (a fome já satura): o ajuste certo é a constante.
**Rollback:** reverter a constante para 120 não corrompe save (carry gravado com a unidade de 60 min é < 120 min e continua válido; só volta a demorar mais). Nenhuma migração.

## 177. Vantagem elemental: Arena, Combina 3 e Guerra de Guildas (meio efeito); Torneio/Duelo fica NEUTRO (dono, 27-28/10/2026)

**Decisão do dono:** o selo "Super eficiente! / Pouco eficiente" mexe no dano da **Arena** (como antes), do **Combina 3** e da **Guerra de Guildas** (esta a **±0,5 golpe exibido**). O **Torneio / Duelo ranqueado fica SEM elemento** e o selo saiu do `DuelScreen`. **Alternativas que perderam:** (a) selo só informativo; (b) ±1 golpe no Duelo/Guerra, medido em 300 lutas de espelho (mesmo level 5..44, build balanced): neutro 53,0% → **98,3% com vantagem / 2,2% com desvantagem** (sem sorteio de dano, ±1 de 10 golpes decide o espelho); (c) ±0,5 também no Torneio, medido **85,2% / 12,0%**, ainda decisivo demais para uma fila ranqueada, onde o resultado vira pontos e Honra; a Guerra é de esquadrão (vários duelos por confronto, pares por nível), então dilui o efeito.

**Como:** `simulateDuel` (`functions/api/_duel.js`) e `simulatePvp` (`combate/duel.ts`) têm `elementScale: 0 | 0.5` (padrão 0 = neutro). Só `resolverGuerra` (`_guerra.js`) passa 0,5; o Torneio passa 0. Com escala, o golpe BÁSICO de cada lado (`fx.elBasica`, por base dominante) move o `bonus` de dano: `(1+bonus)/elementHits(adv·escala) - 1`; HP/ATK/DEF/SPD e `COMBAT_BONUS_CAP` intactos; ausente = neutro. Espelho do anel e da base dominante em `functions/api/_elementoBase.js`, travado por `combate.parity.test.js` (todos os pares de ids; lutas inteiras com escala 0,5 iguais nos dois lados; escala 0 = luta neutra).

**Regra no Combina 3 (`utils/match3Combat.ts`):** dano do jogador = peças limpas × elemento da PEÇA contra o inimigo ativo × `1/elementHits(adv)` (+1 → ×1,111; -1 → ×0,909); dano do inimigo = elemento do inimigo contra o do Soulmon (`M3Combat.playerElement`; sem ele, neutro). Selo = `m3BoardAdvantage` (mesmo cálculo). Réguas `match3Combat.test.ts` e `mente/balanco.test.ts` verdes.

**Gatilho de revisão:** Guerra decidida pelo sorteio de elemento. **Rollback:** reverter o commit; sem migração nem campo novo no save.

## 178. Revelação de recompensa animada e com som na tela de resultado (dono, 28/10/2026)

**Decisão do dono:** toda recompensa revelada num fim de partida segue UM padrão de jogo: o ícone de cada linha ESTOURA (nasce minúsculo, passa um pouco do tamanho e assenta, ~250 ms entre as linhas), os Bits rolam de 0 ao valor num odômetro de caça-níquel (fonte de calculadora do `BitsAmount`), tocar em qualquer lugar pula, e **há som** (§6.1 S19; revoga a R-NOVA só aqui). **Alternativa que perdeu:** a superfície nascer muda (Proposta D, 27/10/2026), que deixava o momento de ganhar sem retorno sonoro. **Fio da decisão:** o estado final está SEMPRE no DOM (valor dos Bits em `sm2-sr-only`, herói, itens), `prefers-reduced-motion` e leitor de tela recebem o final de imediato e a região `role=status` anuncia o resumo UMA vez; nenhuma regra de recompensa mudou.

**Fenda Sem Fim (`DungeonGame`, fase `ended`):** o herói é **Camadas limpas** (maior texto da tela) com UMA escada por camada estourando (até 10; acima disso 10 escadas + "×N"); **Mais fundo até hoje** aparece UMA vez, em destaque (maior, cor de acento), logo abaixo do herói, e sai da lista de estatísticas; num recorde novo, selo `RECORD_SEAL_ICON` (**provisório**: o troféu dourado; a arte final `icon-record-seal.png` entra trocando UMA linha em `utils/rewardIcons.ts`) + "Novo recorde!/New record!" — o mesmo selo nas demais telas que marcam `record`. As estatísticas (criaturas que pararam de insistir, energia usada com o ícone de energia) sobem para antes do livro. **Saíram** as frases "O caminho para baixo está lacrado por ora" (e as outras frases de motivo do fim) e "Seus corações continuam intactos"; **fica** a frase do portão de Vínculo. Não existe linha de "corações perdidos": a descida não custa coração (o resumo não tem esse dado), então nada é mostrado. O "coração da mochila" é o item de recuperar vida: ícone `item-heart` e rótulo "Item de recuperar vida" / "Healing item"; Glitchtama e fragmento do Soulsmith usam a própria arte, pelo resolvedor único `utils/rewardIcons.ts`.

**Migrado:** `ResultScreen` (Fenda, Arena, Combina 3, Dino, Barragem, PPT, Eco/Zip/Patches, Torneio, Calabouço roguelike), `DungeonReturnModal` ("o que rendeu"), e a linha de Bits dos fins de `TrocaGame`/`PicrossGame`/`RevisaoGame` (`BitsReveal`). **Ficou como estava, por quê:** `DropNotice` (aviso no meio da luta, sem som por desenho, §36), `RewardLine` (átomo inline reutilizado em vários lugares), `NightmareBattle` (vitória ao acordar, janela de sono = silêncio), `BolhasGame`/Refúgio (C-10, silêncio protegido), cards de missão/quest (botão de resgate, não é revelação), confirmações da Loja (não animam, pedido do dono), `DailyReportModal` (não mostra recompensa).

**Gatilho de revisão:** o dono ouvir e achar barulhento; ou aparecer fila de recompensas com mais de ~8 linhas (o cronograma ficaria longo; o toque já pula). **Rollback:** reverter os commits; sem migração nem campo novo no save.

## 179. Feira: o Chefe e o Desafio na volta da Missão (dono, 28/10/2026; liga DESLIGADA)

- **Decisão do dono:** a Missão **não muda** (30 min fora, 1×/dia, `guildRaidHit`, rega a Casa, alimenta o fenômeno semanal, resgate semanal intacto). **Novo:** quando o Soulmon VOLTA, o clã encontra um mistério, sorteado de forma determinística por clã: **Chefe (70%)** ou **Desafio/Trilha (30%)**; o mistério 0 é sempre Chefe. O Chefe tem **HP compartilhado que nunca regenera**, acumula entre membros e dias, **nunca morre sozinho** (1 ataque/dia/pessoa, re-simulado no servidor com semente dele); alvo de **~2 dias** para um clã de 4 ativos no nível 1. Abatido → **1 dia de descanso** → o mistério seguinte abre 2 dias depois do abate. **Nível máximo 20**; o **Arauto do Fim** só como chefe final a partir do nível 15. A arte dos chefes já existe (J196–J220). Recompensa do abate por pessoa e idempotente por recibo: Emblemas, Bits, seiva da Casa e troféu `trophy-boss-<id>`; `reward.essences` sempre vazio (gancho, fora do escopo). **Desafio = SÓ seiva da Casa** (+1 Emblema e +3 de seiva a quem cumpre): **não** mexe na vida do chefe; **porta individual** — cada pessoa cumpre o seu para liberar a PRÓPRIA próxima incursão, sem quórum para os outros e sem nunca bloquear a Missão (a porta é informativa). **Entrega DESLIGADA** (`FEIRA_CHEFE_DESDE` no futuro): o dono manda ligar depois de testar.
- **Como:** servidor em `functions/api/_feira.js` + rotas `guildFeira*` em `guild.js` (404 `not available` enquanto desligada; `guildRaidHit.evento` e `guild.feira` só existem ligada). Cliente: `utils/feira.ts` (sanitizadores, `mapFeiraLog` log→`FightEvent`), wrappers em `community.ts` (`getGuildFeira`, `attackGuildFeira`, `claimGuildFeira`, `startGuildFeiraTrail`, `doneGuildFeiraTrail`, `hitGuildRaidEvento`), `FeiraEventoSheet` (+ `FeiraTrailPlay`, `FeiraMisterio`), item `feiraEvento` na fila central de apresentação (`docs/FILA-DE-MODAIS.md` §2c; "visto" gravado ao MOSTRAR em `STORAGE_KEYS.FEIRA_EVENTO_VISTO`). Crédito no aparelho UMA vez por recibo (`feiraCredit.ts` sobre `guildClaimLocal`), pelos caminhos de sempre (`handleGuildClaimed`, `handleClaReward`). **Sem campo novo no save** (o recibo do servidor + a memória de recibos local bastam). Só AGREGADO do clã na sala (nome/nível do chefe, % do que resta, marcas da trilha): nada por pessoa (LV-G1/G10).
- **O que isto emenda:** §104 (o fenômeno semanal permanece, mas deixa de ser o único clímax da Feira: o chefe é um segundo ciclo, mistério a mistério); §141 (o golpe do fenômeno e o 1 ataque/dia ao chefe são independentes; o chefe não tem janela ISO — dura até morrer). **Mantidos:** §27 PR3 (a Missão rega a Casa), "Torneio × Arena" (o chefe NÃO é Arena e não usa `tournamentSeason`), LV-G7 (nada toca `bosqueProgress`).
- **Alternativa que perdeu:** (a) descanso de 0 ou 2 dias; (b) luta com escolha do jogador ou jogável de verdade (mais cara e fraudável — ficou a repetição validada pelo servidor); (c) alternar 1 Chefe/1 Trilha, ou só Chefe nas 5 primeiras; (d) benefício da Trilha como −3% de HP do próximo chefe por marca (teto −15%) — **perdeu**, a Trilha só rende seiva da Casa; (e) nível sem teto ou teto 10; (f) Arauto no sorteio comum; (g) dano vindo do cliente.
- **O que falsificaria a aposta:** clãs de 4 levando bem mais de ~3 dias para abater o nível 1 (a calibração de dano/HP está errada); poucos clãs chegando ao 2º mistério (a Feira vira só mais um botão); a Trilha sendo sentida como porta trancada em vez de convite (queda de saídas da Missão depois que o desafio aparece); ou qualquer sinal de cobrança entre membros a partir da barra do clã. Métrica a registrar ao ligar: dias até o abate por tamanho de clã.
- **Rollback:** voltar `FEIRA_CHEFE_DESDE` para uma data futura desliga o `evento` (Missão e fenômeno continuam). Dados em chaves novas com TTL; nenhuma migração destrutiva. Ponto de não retorno: o primeiro resgate pago de chefe (Emblemas/Bits gravam no save do cliente) — a partir daí não se apaga `feiraDead`, só se desliga a emissão. Cliente: o item `feiraEvento` e a sala ficam inertes sem `evento`/`feira` da vista.
## 180. Arena livre: sorteio geral, reroll dos cards e cenário de arena (dono, 28/10/2026; REVOGA a "Arena por tema" de 27/10/2026)

**Decisão do dono (28/10/2026):** (A1) os 3 cards da Arena livre saem de um sorteio GERAL entre os 20 elementos base (1 criatura por elemento, chance igual), com elementos distintos entre os cards quando der e no máximo 1 Desgarrado; (A2) o jogador pode sortear de novo: 3 grátis por dia do jogador, depois só Bits (15, 30, 45 e 45 fixo); (A3) o cenário da Arena é sempre uma das duas arenas do Torneio (Arena Noturna ou Coliseu Ancião).

**Como:** `src/utils/arenaSorteio.ts` é o dono único: `arenaFoesOfSeed(seed, rodada)` (a MESMA função no card da `DueloSheet` e em `ArenaGame.montarRodada`, então o card mostra exatamente o que será lutado), `arenaCards(dia, conta, rerolls)` (determinístico: fechar e reabrir mostra os mesmos; cada reroll mistura o contador na semente), a tabela `ARENA_REROLL_FREE_PER_DAY`/`ARENA_REROLL_PRICES`/`arenaRerollCost`, `applyArenaReroll` (pura, reconfere o preço sobre o `prev`, desconta só Bits pelo caminho `spendBitsPaidFirst`) e `arenaSceneOfSeed` (o cenário é fixo durante a run, escolhido pela semente da run). Save: `arenaReroll?: { day, count }` (dia ISO do jogador, `playerDayIso`); leitura tolerante em `hydrateSave`, espelho monotônico no servidor (`_dayCounters.js › enforceArenaReroll`, paridade em `dayCounters.parity.test.js`): no mesmo dia vale o maior contador, o dia só anda para a frente. Reroll nunca usa Crédito nem Emblema. `theme` saiu de `buildArenaRound` e de `pickNovo`.

**Alternativa que perdeu:** a "Arena por tema" (27/10/2026): filtro de inimigos pelo elemento do jogador + cenário do domínio do elemento. **Por que perdeu:** só um elemento visível nos 3 cards (a "escolha" não tinha vantagem a ponderar), não havia reroll, e a arte de cenário por elemento nunca foi gerada (12 dos 20 elementos usavam um domínio emprestado). O código de domínio (`arenaTema.ts`, `combatDomainSceneBg`, os 17 cenários instalados) ficou SEM USO na Arena, mantido por ora; `docs/ASSETS-A-GERAR.md` §19 está RETIRADA.

**O que falsificaria:** jogadores gastando Bits em sequência de rerolls para caçar o elemento fraco do chefe (ver a taxa de rerolls pagos/dia); ou o reroll grátis virar o motivo de abrir a Arena (sinal de cobrança). **Gatilho de revisão:** mediana de rerolls pagos por jogador-dia > 1. **Rollback:** reverter o commit; o campo `arenaReroll` é aditivo e inofensivo se ficar no save.


## 181. Rookie a 50% é regra de RENDER (dona única `spriteScale.ts`) e o sprite pousa pelo PÉ na plataforma (dono, 28/10/2026)

**Decisão do dono:** "a regra de reduzir 50% o Soulmon ROOKIE deve ser sobre o SPRITE e não na GERAÇÃO; pode aplicar nos Soulmon que já existem de usuários reais". E: simulados e selvagens/desgarrados flutuavam muito sobre a plataforma no combate.

**Fatos achados:** a redução já vivia no render (commit `15501033d`, `STAGE_TARGET.rookie` 0,54 → 0,27); nenhum script, prompt ou canvas de geração reduz o rookie (acervo/KV `sprite:blob` guardam a arte em tamanho cheio). Logo não há redução dupla e os Soulmon existentes já obedecem sem tocar nos PNGs. O fator é `alvo ÷ preenchimento medido da caixa visível`, então não depende do tamanho do canvas (canvas folgado ou justo dão a mesma altura na tela).

**O que mudou:** a regra ganhou nome e dono: `ROOKIE_RENDER_RATIO = 0,5` × `ROOKIE_BASE_TARGET = 0,54` (valor final idêntico, 0,27), com teste de contrato (rookie 50%, demais estágios 100%). Combate: o `Fighter` do `BattleStage` mede a base da caixa visível do PNG (cache por URL, canvas) e desce/sobe o canvas (`feetShiftPx`) para o PÉ tocar a plataforma, em vez de supor que o pé está a 94% do canvas; vale para jogador, simulados, selvagens e desgarrados. Sem medida (jsdom, imagem de outra origem) o deslocamento é 0, o layout histórico. `stageLayout` e o modo `boss` não mudam.

**Decisão do dono (28/10, depois):** a regra vale também nos INIMIGOS de estágio rookie no `BattleStage` (selvagens, simulados, desgarrados): `StageFighter.stage` (Masmorra, Calabouço, Pesadelo, Arena via `tier`, Duelo via `oppStage` opcional); inimigo não-rookie ou sem estágio fica a 100%. NÃO se aplica a Bestiário, avatares e listas (só combate e Home). O Duelo/Torneio ainda não passa `oppStage` (fica a 100% até alguém ligar).

**Alternativa que perdeu:** reduzir o rookie na geração/prompt (obrigaria regerar ou reprocessar as artes reais e duplicaria a redução); corrigir a flutuação com dado de baseline por sprite em JSON (mais um arquivo para manter, e não cobre arte gerada depois).

**O que falsificaria:** bicho com sombra/cauda/aura opaca embaixo cuja base medida não é o pé (aparece afundado ou alto demais); rookie pequeno demais para tocar. **Rollback:** reverter os commits; `ROOKIE_RENDER_RATIO = 1` desfaz só a redução; sem migração nem campo novo no save.

## 182. O simulado luta com o golpe básico do PRÓPRIO elemento (dono, 28/10/2026)

**Decisão do dono:** simulados são jogadores reais para o jogo; o elemento deles (coerente com a criatura base) vale também no duelo. O `petName` dos simulados NÃO é renomeado.

**O que mudou:** `saveDoSimulado` (`functions/api/_simulados.js`) grava `soulmonSkills[estágio].elementoDominante.id = element`; `duelSide` (`_duel.js`) então publica `fx.elBasica` com esse elemento (`elementoDoBasico`, já espelhada no cliente). Determinístico (função pura de perfil+dia); stats, escola e especial intactos (teste compara o combatente com e sem a ficha). Sem mudança em `_duel.js` nem em `duel.ts`: a paridade cliente/servidor não é tocada.

**Alternativa que perdeu:** deixar `elBasica` nulo e o cliente inventar o elemento por hash do id. **Por que perdeu:** o oponente aparecia com elemento diferente do da Biblioteca.

**O que falsificaria:** simulado com golpe básico visualmente errado ou duelo com resultado diferente do de antes. **Rollback:** remover a linha `soulmonSkills` de `saveDoSimulado` (o motor regrava o save no dia seguinte).

## 183. Essências dos elementos: drop do PRÓPRIO elemento, só coleta, teto diário só na descida automática (dono, 28/10/2026)

**Decisão do dono:** todo inimigo derrotado dropa a essência do elemento dele (composto = o composto; Pesadelo = essência de pesadelo). Quantidade: 1 base; estágio forte mais; chefe da Feira mais. Sem teto na luta ativa; a descida AUTOMÁTICA da Fenda tem teto diário. Só coleta (sem uso por ora). Aparece em Laboratório > Arquivo, abaixo dos Sonhos, só as com quantidade > 0, com o ícone do próprio elemento e tooltip com o nome EN/PT.

**O que mudou:** `src/utils/essences.ts` é o dono único: rookie 1, champion 2, ultimate/mega 3 (`ESSENCE_BY_STAGE`); Pesadelo 1/2/3 por raridade (`nightmareRewards.essence`); chefe da Feira `5 + floor(nível/5)` (5..9, `reward.essences` agora é `[{id: elemento do chefe, n}]`, antes gancho vazio); descida automática 30/dia (`ESSENCE_AWAY_DAILY_CAP`, contador `essenceAway {day,count}`). Ligado em: Fenda/Masmorra ativa e idle (`applyEnemyDefeated`), Arena, Combina 3, Desgarrado do Torneio, Pesadelo e Feira. PvP contra jogador (Duelo/Guerra) NÃO dropa. Save: `essences` + `essenceAway` (hidrata tolerante; servidor sanea e torna monotônico: `_essences.js`, `_dayCounters.js`; paridade em `essences.parity.test.js`). O elemento do chefe da Feira é próprio (fora dos 210 do dex): a essência vale pela FORMA do id; sem ícone próprio, a seção mostra o nome. Não mexe nas outras recompensas nem no dex.

**Alternativa que perdeu:** teto diário também na luta ativa (anti-farm geral), e ícone novo "gota/cristal" por essência. **Por que perdeu:** o dono quer a luta ativa livre (o farm é a graça) e sem arte nova; o único ponto sem o jogador olhando é a descida automática.

**O que falsificaria:** jogador que só deixa a Fenda no automático e ainda assim acumula essência sem limite (o teto diário falhou), ou save com `essences` regredindo após sincronizar. **Rollback:** campos aditivos e opcionais: remover as chamadas de `applyEssences`/`applyEssencesAway` e a seção do Laboratório; os campos `essences`/`essenceAway` ficam no save inertes (cliente velho os ignora; servidor continua saneando).

## 184. Atender o convite de refeição rende 5 XP de Vínculo, 1x por refeição (dono, 28/10/2026)

**Decisão do dono:** o convite do ritmo das refeições passa a dar XP de Vínculo, pequeno e sem virar farm.

**O que mudou:** `BondEvent` ganhou `mealInvite` (`XP_MEAL_INVITE = 5`, `utils/bond.ts`). `atenderRefeicao` (App) concede só na TRANSIÇÃO da janela para "atendida" (`markMealDone` devolve a mesma referência sem janela aberta e `mealRitual.done` só cresce): 1 refeição = 5 XP, no máximo 15 XP/dia, sem contador, sequência nem tom que cobre. Energia, HP, Bits e Emblemas continuam sem concessão da janela.

**Alternativa que perdeu:** manter "sem XP" (a recompensa seria só a reação do bicho). **Por que perdeu:** o dono quer o gesto de presença reconhecido no Vínculo; 15 XP/dia é ruído frente aos ~100+ de um dia normal.

**O que falsificaria:** pessoas abrindo o app só para "bater" as 3 janelas, ou o convite virando o motivo de abrir; ver a taxa de atendimento por janela. **Rollback:** remover o `awardBondXP` de `atenderRefeicao` (o evento fica inerte).


## 185. Reaceite obrigatório dos Termos/Privacidade + `PRIVACY_VERSION` 2026-10-28 (dono, 28/10/2026; REVOGA a #24 de 21/09/2026)

**Decisão do dono:** a revisão D2b da política (voz direto no Groq, Gemini de reserva no chat) já está publicada; `PRIVACY_VERSION` sobe para 2026-10-28 e quem já jogava passa a ser obrigado a reaceitar (QA-13).

**O que mudou:** `ConsentGate` (tela bloqueante, Termos + Política em aba nova, caixa + "Aceitar e continuar") entra no `App` quando `!isConsentCurrent(gameState.consent)` depois do onboarding/tutorial; grava `buildConsentRecord()`. Vale também para save antigo SEM registro. `public/privacidade.html` (PT+EN) com carimbo 28/10/2026, igual à constante (régua `consent.versoes.contract`). O servidor não espelha a constante (só comentário em `generate-sprite.js`; nenhuma validação por versão). O banner informativo (#24) fica no código mas nunca aparece, pois o consentimento passa a ser vigente.

**Alternativa que perdeu:** manter só o banner informativo, sem re-aceite (#24). **Por que perdeu:** a política mudou o destinatário dos dados da voz; informar sem consentir não cobre o aceite específico que a LGPD pede.

**O que falsificaria:** queda de retenção no dia da subida do gate (quem fecha o app na tela); ver sessões D1 após o deploy. **Rollback:** remover o `if (!isConsentCurrent…)` do `App`.
### §180 emenda (dono, 28/10/2026): a Arena livre sorteia também os elementos COMBINADOS

**Decisão do dono:** a Arena livre cobre TODOS os elementos: metade das runs vem do pool base (20 elementos), metade do pool combinado (os 138 rookies de elemento combinado do `enemyRoster`, só existem na forma rookie). **Como:** `isComboSeed(seed)` (`strayFoes.ts`, 50% das sementes que não são Desgarradas; Desgarrado nunca é combinado) passa `combo` a `buildArenaRound`: numa run combinada TODOS os slots (fraco, médio, chefe) mostram rookies combinados (nome, 2 elementos, arte `COMBINADOS_ART`); a FORÇA segue sendo do slot (`arenaFoe`), então o chefe de uma run combinada é tão forte quanto o de uma base, só com arte rookie (a 50% pelo §181). O card mostra o 1º elemento (base) do combinado; determinismo, distinção entre cards, no máximo 1 Desgarrado e "card = luta" intactos (mesma `arenaFoesOfSeed`). **Alternativa que perdeu:** só os slots fracos virarem combinados (a rodada 1 é um médio, o card não mostraria o pool novo). **Falsificaria:** chefe rookie combinado parecer "fraco demais" para o jogador (reclamação de arte, não de força). **Rollback:** `COMBO_SEED_CHANCE = 0`.

## 186. Dificuldade das lutas seguidas: Masmorra/Fenda e Calabouço (dono, 28/10/2026)

**Decisão do dono:** as batalhas estavam fáceis, principalmente as SEGUIDAS (Masmorra, Fenda, Calabouço). Escolha: (a) o inimigo escala por andar/rodada nas lutas seguidas e (b) menos cura entre lutas seguidas. Meta: ~60-70% de vitória nas sequências típicas, sem tornar o início impossível.

**Medição (antes de mexer):** `src/utils/winrateModos.sim.test.ts` (determinístico, 3.360 corridas: 15 níveis × 4 builds × 7 famílias × jogador sem bônus e "equipado" com bônus no teto de 5%, habilidade `media`, as MESMAS funções que o jogo joga). ANTES: Masmorra/Fenda limpava os andares 1-4 em 100%, o 5 em 52,4% e o 6 em 0,3% (parede em degrau; só o andar 5 impunha risco); Calabouço: 100% das incursões completas (nenhuma derrota em 24 passos).

**O que mudou (constantes, dono único):** `DUNGEON_FLOOR_GROWTH.power` 0,11 → 0,16 (`dungeonBase.ts`; o HP por andar e a duração 20-29 s do AC5 ficam como estavam); `JEITO_PADRAO.curaAndar` 0,25 → 0,185 e Cozinheiro 0,35 → 0,3 (`profissaoMasmorra.ts`; o Cozinheiro agora cura 0,115 a mais que o padrão, era +0,10); `DUNGEON_CAP_MARGIN` 6 → 5 (a parede média caiu de ~5,35 para ~3,8 camadas além da zona de conforto); Calabouço: `ROGUE_FOE_RAMP` (`rogueDungeonSave.ts`) soma +1 "andar de golpes" ao inimigo a cada 3,1 passos da incursão (`foeRefFor`).

**DEPOIS (mesma medição):** Masmorra/Fenda a1-a3 100%, **a4 66,6%**, a5 0%; Calabouço **70,8% de incursões completas** (52-77% conforme a taxa de acerto nos desafios que não são combate: 50% a 95%). A parede da Masmorra subiu um andar para baixo (andar 5 → 4): os gates AC6/AC10 de `dungeon.v3.test.ts` e `dungeon.equipamento.test.ts` foram remedidos e movidos para "andares 1-3 ~100%, andar 4 ~45-62% sem equipamento (~80% equipado; a média 50/50 é 66,6%), andar 5 ~0%".

**Alternativa que perdeu:** só subir `DUNGEON_FLOOR_GROWTH.hp` (fights mais longas: a duração mediana do andar 5 passava de 29 s e saía da faixa do AC5) ou só cortar a cura (o degrau ficava no andar 4 mas sem inimigo mais forte, que o dono pediu em (a)). **Não foi tocado:** a Arena (`ROUND_CLEAR_HEAL` 0,3, 5 rodadas) e o Pesadelo; recompensas e Bits (a profundidade efetiva paga por andar efetivo, que não mudou); servidor (sem constante de dificuldade no servidor; `functions/` não lê `dungeonFoe`).

**O que falsificaria:** jogadores sem equipamento nem talento não passarem do andar 2-3 (início impossível: ver a taxa de descidas encerradas no andar 1 do `dungeonAway`), ou o Calabouço ficar abaixo de 50% de completos para quem erra os desafios não-combate. **Rollback:** reverter as 4 constantes.

## 187. A Forja (7ª área) e a nova divisão das áreas: masmorras na Exploração, Arquivo no Perfil, Amigos no Salão do Clã (dono, 28/10/2026)

**Decisão do dono:** (1) nasce a área **A Forja** (industrial: produtividade e disciplina), abaixo da Exploração e ao lado do Laboratório no Mapa, simétrica ao Hall; recebe tudo que era da Exploração menos o Passeio (Oficina do Foco, Caderno, Refúgio) e o Soulsmith. (2) A **Exploração** passa a receber as masmorras (Fenda Sem Fim, Calabouço roguelike) e mantém o Passeio. (3) No **Laboratório**, o Círculo de Amigos é absorvido pelo Salão do Clã e o Arquivo pelo Perfil; Biblioteca, Vínculo e Centro de Evolução ficam (ganham prédios novos de arte depois).

**O que mudou (código):** `AREAS` ganha `'forja'` (`navigation.ts`, ordem `…exploracao, forja, laboratorio, hall`; rótulo EN "The Forge" / PT "A Forja"). Os **ids de prédio acompanham o lote** (padrão de `MOVED_BUILDINGS`, sem chave de storage nova): `exploracao.oficina|caderno|refugio` → `forja.*`, `mercado.ferreiro` → `forja.ferreiro`, `arena.fenda` → `exploracao.fenda`, `jogos.dungeon` → `exploracao.dungeon`; os ids antigos (e os anteriores: `exploracao.masmorra`, `exploracao.preparar`, `jogos.refugio`) redirecionam na leitura do save, do servidor (`functions/api/_gates.js` espelha; `_buildingQuests.js` aceita `forja`) e dos atalhos (`buildingDestination`). `laboratorio.pet` (Arquivo) e `laboratorio.amigos` (Amigos) **continuam existindo como prédios** (missão, material `down`/`keepsake`, peça `eq-carapaca-t2`, apresentação ao abrir) mas sem lote: moram em `BUILDING_HOME` (`navigation.ts`) e abrem a seção "Arquivo" do lote Perfil (abas Perfil | Arquivo, `labTab` `'pet'`) e a seção "Amigos" do lote Salão do Clã (abas Clã | Amigos, a mesma `LibraryPage` `friends`). Atalhos e missões a esses ids abrem o lote-casa já na seção (`initialSection`). Demo: o Salão do Clã já era bloqueado, então Amigos segue inacessível nela; os lotes da Forja não tinham bloqueio e continuam sem. A Forja usa o fundo e os prédios PROVISÓRIOS da Exploração/Mercado através de um resolvedor (`resolveArt` em `assets/soulmon/areas/index.ts`, `resolveMapaZona`): quando o arquivo-alvo da arte final cair na pasta com o nome certo, ele assume sozinho (lista em `ASSETS-A-GERAR.md` §21).

**Consequência a saber:** a área **Arena** só abre no Vínculo 5 (a Fenda, Vínculo 1, saiu dela); a **Forja** e a **Exploração** abrem no 1. Amigos agora só aparece com o Salão do Clã (Vínculo 4; antes o Círculo abria no 2). **Emenda 28/10/2026 (dono, 2): a ARENA inteira (Duelo, Torneio, Guerra de Clãs) abre no Vínculo 3 (era 5): `GATES.pvp`, `GATES.torneio` e `arena.guerra` em `gates.ts` + espelho `_gates.js`; a Guerra não tinha limite próprio (seguia o 5 da Arena, dono 18/10).** **Emenda 28/10/2026 (dono):** o Salão do Clã inteiro (lote `hall.guilda`, com a aba Amigos, e o Grove) abre no **Vínculo 2**; a Feira (`hall.feira`) segue no 5 (agora fixa, não segue mais o gate de PvP).

**Alternativa que perdeu:** renomear os ids de prédio SÓ na tela e manter `exploracao.oficina` etc. no save/servidor (zero risco de migração). **Por que perdeu:** deixaria o id mentindo sobre o lugar (a leitura de `BUILDING_GATES`, `areaMinBond` e o Mapa dependem do prefixo da área) e criaria uma tabela paralela de "onde mora"; o padrão `MOVED_BUILDINGS` já foi usado 5 vezes sem perda de save.

**O que falsificaria:** retenção/uso dos Amigos cair por causa do gate 4 do Salão do Clã; jogador procurando o Arquivo (ver cliques na aba Arquivo vs. suporte); a Arena trancada até o Vínculo 5 gerar queixa de "área bloqueada". **Rollback:** reverter o commit do #186 — os ids antigos continuam válidos nos saves que não passaram pela migração; saves que já gravaram ids novos (`forja.*`) precisam do mapa inverso (`MOVED_BUILDINGS` ao contrário) ou ficam sem o "visto" daqueles prédios (nunca perdem material nem progresso de missão: o estoque é por material, não por id).
