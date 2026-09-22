# Visão — o que o Soulmon é, para quem, e o que ele nunca pode virar

> **Dono:** doc-redator-regras · **Data:** 22/09/2026 (2ª sincronização do dia, delta `a6c1cd8a..592e2c14`: §7 relido — nenhuma linha mudou de estado; a simulação da QA Rodada 2 só gerou perguntas ao dono, não regra) · **Estado:** verificado em 22/09/2026 por doc-verificador (delta `a6c1cd8a..592e2c14` — §7 conferido contra `ls src/*.contract.test.ts`; anterior no mesmo dia: delta `f4086ce0..a6c1cd8a`, QA Rodada 1 — §7 linha 15 (a #15 passa a "por teste": `src/copy.semFomo.contract.test.ts` existe e varre o que a linha diz) e a contagem 13/8 conferidas contra `ls src/*.contract.test.ts` e o cabeçalho do guard; anterior: delta `f02a3166..4a8b8049`, execução das respostas #11–#39 — §3 tabela do público (18+ é ICP, primeiro usuário), §7 linha 16 e §10 adendo (Camada 3 congelada, cobrança web depois) conferidos contra `REGISTRO-DE-DECISOES.md` e `PERGUNTAS-DO-DONO.md`; anterior: delta `15164e4c..7e5d0ba9`: §7 "A bíblia narrativa obedece às 21" e §10 conferidos contra `REGISTRO-DE-DECISOES.md` §14.1–§14.4, `NARRATIVA-PROPOSTAS.md` e `src/narrativa.contract.test.ts` — P1/P2/P5/P8/P9/P10 fechadas, `EXCECOES`, faixas de `welcomeBack`, trava de crise; verificação anterior: último item do adendo da §10, delta `5ac3d351..8d318529`, som/S16 + chaves na `SettingsPage`; o resto: sincronizado com `9875477b`, delta `dc72579e..9875477b`: decisões do dono no `REGISTRO-DE-DECISOES.md` §14, copy da bíblia em tela, trava de crise no chat — só nas §7 e §10; verificação anterior do delta `2580b73a..dc72579e`: 21/09/2026)
> **Verificação:** `npx vitest run src/utils/currencies.test.ts src/utils/monetization.fronteira.test.ts src/utils/restWindow.test.ts src/utils/passives.test.ts src/utils/bond.test.ts src/utils/habitRhythm.test.ts src/hooks/useDailyReset.test.ts src/plugins/widgetSemCobranca.contract.test.ts` — são os testes que travam, em código, as linhas vermelhas citadas aqui. Toda contagem deste doc traz, na própria linha, o comando que a mediu em 09/09/2026.
> **Não cobre:** as regras de jogo em si (→ `02-REGRAS-DE-NEGOCIO.md`), telas e navegação (→ `03-FLUXO-DE-TELAS.md`), identidade visual (→ `04-IDENTIDADE-VISUAL.md`), arquitetura, deploy e integrações (→ `05-ARQUITETURA.md`, `08-INTEGRACOES-E-DEPLOY.md`), o histórico das decisões (→ `09-HISTORICO.md`, `10-DISCUSSOES-E-DECISOES.md`).
> **Precedência:** código > teste > `CLAUDE.md` > este documento. Onde discordarem, o código está certo e este doc tem defeito.

## Índice

1. [O que o Soulmon é](#o-que-o-soulmon-e)
2. [A essência declarada](#a-essencia-declarada)
3. [Para quem é (ICP e personas)](#para-quem-e)
4. [Os sete princípios permanentes](#os-sete-principios-permanentes)
5. [Os quatro critérios](#os-quatro-criterios)
6. [As cinco regras sobre perda](#as-cinco-regras-sobre-perda)
7. [As linhas vermelhas (as 21 proibições)](#as-linhas-vermelhas)
8. [O modelo de monetização](#o-modelo-de-monetizacao)
9. [As quatro superfícies](#as-quatro-superficies)
10. [O estado do projeto em 09/09/2026](#o-estado-do-projeto)

---

<a id="o-que-o-soulmon-e"></a>
## 1. O que o Soulmon é

Um app de produtividade gamificado no gênero **v-pet** (bichinho virtual): a
pessoa cadastra hábitos e tarefas da vida real, e a criatura dela cresce, evolui
e ramifica em função do que foi feito. Web (PWA), APK Android, overlay de
desktop e widgets Android — ver [§9](#as-quatro-superficies).

O enunciado de core, decidido em 19/08/2026 (`docs/PLANO-PRODUTO.md`, Parte 1):

> *O Soulmon é uma criatura única no mundo — gerada de quem você é — que só
> cresce quando você cuida da sua vida real, e que te encoraja. Ela nunca vira
> um cobrador, um medidor de culpa, nem um score.*

Três elementos, nenhum decorativo (mesma fonte):

| # | Elemento | Onde vive |
|---|---|---|
| 1 | **Unicidade** — pipeline oráculo → class-system → bestiário → sprite por IA entrega um pet que ninguém mais tem | [`docs/ORACULO.md`](../ORACULO.md), `src/utils/oracle.ts`, `src/utils/soulProfile/pipeline.ts` |
| 2 | **Acoplamento com esforço real** — todo parâmetro ou é alimentado por tarefa cumprida, ou gasta recurso que veio de tarefa cumprida | é o critério **B**, [§5](#os-quatro-criterios) |
| 3 | **A cláusula negativa** — "nem score": o jeito mais comum de virar cobrador não é punir, é *medir* | é a origem das proibições #14 e #21, [§7](#as-linhas-vermelhas) |

E o que ele **nunca deve virar**, na mesma fonte: app que tranca cuidado atrás
de paywall recorrente; app de métricas de desempenho; gacha (o pet é
identidade, não loot).

---

<a id="a-essencia-declarada"></a>
## 2. A essência declarada

A frase que rege toda decisão de regra está em [`docs/PLANO-EVOLUCAO.md`](../PLANO-EVOLUCAO.md),
seção "A essência, que nada aqui pode quebrar":

> **O Soulmon é um avatar do usuário que evolui junto com ele e o encoraja —
> nunca um cobrador.**
>
> Não é um placar. Não é um jogo que usa a vida da pessoa como combustível de
> engajamento. É uma criatura que cresce quando a pessoa cresce, e que fica do
> lado dela quando ela não consegue.

O filtro operacional que sai dela, e que aparece literalmente nos comentários de
`src/utils/dailyReset.ts` (`computeDailyReset`): *isso faz o bichinho parecer
mais um companheiro, ou mais um chefe?* O que faz parecer chefe foi cortado ou
invertido, **mesmo quando "engajaria" mais**.

O eixo que organizou a pesquisa inteira foi **como cada produto trata a falha**
([`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §1). O resultado
resumido, e a conclusão que virou produto:

| Produto | Ao falhar | Resultado registrado |
|---|---|---|
| Pokémon Sleep | você **não ganha**; nunca perde | US$ 234,9M em 3 anos, queda de 3,2% no ano 3 |
| V-Pet Digimon (1997) | erros **selecionam outro galho** | ~14M de unidades; linha viva até 2027 |
| Vital Bracelet | **estagna** | apps encerrados, servidores offline em 2024 |
| Tamagotchi original | **morria** em <12h sem pausa | apego **e** abandono em massa |
| Finch | pássaro **nunca morre, nunca cobra** | ~US$ 30M ARR sem VC; D1 ~54% / D7 ~37% |
| Habitica | Dailies não feitas dão **dano de HP** | contra-exemplo canônico |
| **Soulmon antes da Fase 1** | **perdia HP**, podia zerar e degenerar num dia | — |

> **A conclusão:** um app de produtividade que castiga quem está mal está
> desenhado para funcionar melhor com quem menos precisa dele.

E a régua de benchmark declarada na mesma seção: **o comparável do Soulmon não é
o Duolingo, é o Finch.**

---

<a id="para-quem-e"></a>
## 3. Para quem é (ICP e personas)

⚠️ **Este é o eixo mais fraco da documentação do projeto, e a fraqueza é
declarada, não escondida.**

- [`docs/reviews/2026-08-03/soulmon-user-researcher.md`](../reviews/2026-08-03/soulmon-user-researcher.md)
  é o documento designado para ICP, personas e walkthrough — e ele está
  **em rascunho**: as seções 1 a 10, o "ICP primário, secundário e
  anti-persona", o Anexo B (personas), o Anexo C (walkthrough) e o Anexo D
  (pesquisa primária) estão todos marcados `[EM ABERTO]`. Contado em
  09/09/2026: `grep -c "\[EM ABERTO\]" docs/reviews/2026-08-03/soulmon-user-researcher.md` → **14**.
  O que existe de substantivo ali é o Anexo A, e ele é um achado de PRODUTO,
  não uma persona.
- **Não existe pesquisa primária com usuário.** O único dado de usuário real do
  repositório é **um** teste com o dono ("nem todo dia consigo fazer as 6"),
  registrado em `product/soulmon-01/balance/carga-diaria.md` e listado como tal
  na tabela de fontes do [`REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §2.

O que está decidido sobre público, e onde:

| Afirmação | Fonte |
|---|---|
| **Público que o Finch não serve**: quem cresceu com Digimon/Tamagotchi e acha o Finch fofo demais. A masmorra, o torneio e a estética pixel são para essa pessoa | [`docs/PLANO-PRODUTO.md`](../PLANO-PRODUTO.md), Parte 3 |
| **PT-BR nativo e preço local** — Finch a US$ 9,99/mês ≈ R$ 55/mês é proibitivo no Brasil, e não há competidor brasileiro relevante no nicho | idem |
| **Nicho estimado** de ~300 mil pessoas no Brasil | idem, seção "Modelo — decisão revista" |
| **Os quatro públicos que o desenho protege** (e como cada regra os protege) | [`REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §4.3 |
| A pessoa em crise, doente ou deprimida é o público que a tese anti-punição existe para não expulsar | [`PLANO-EVOLUCAO.md`](../PLANO-EVOLUCAO.md), tabela da falha |
| **18+ é o ICP, não só defesa legal** (21/09/2026, decisão #15): a persona adolescente ("adolescente com TDAH que some e volta", nº 1 do check-up de ago/2026) **sai dos check-ups**; o muro `MIN_AGE_YEARS = 18` (`src/utils/consent.ts`) e o público que "cresceu com Digimon/Tamagotchi" (25–40 em 2026) apontam para a mesma pessoa. Gatilho de revisão: o 1º dado real de idade | [`REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md), linha "18+ é o ICP" (QA GERAL #15) |
| **O primeiro usuário real = 10 conhecidos, no PWA, por 14 dias** (21/09/2026, decisão #11) — sem Play, sem domínio; o tier pago chega a eles por cortesia (#12, [`02` §46](02-REGRAS-DE-NEGOCIO.md#moedas)) e o funil é lido por `scripts/metrics-report.mjs` (#18) | [`PERGUNTAS-DO-DONO.md`](../PERGUNTAS-DO-DONO.md), "Respostas QA GERAL" #11/#12/#18 |

**North star** (`PLANO-PRODUTO.md`, Parte 2, decidido em 26/08/2026): *peso de
esforço real concluído por usuário ativo por semana*. Com as duas definições que
o tornam verificável — **usuário ativo** = concluiu ≥1 item real na semana
(deliberadamente **não** "abriu o app"); **alvo v1** = o usuário ativo médio
atinge o próprio `dailyGoalFor` em ≥4 dos 7 dias.
⚠️ A mesma seção declara que **nenhuma dessas métricas é legível hoje**.

---

<a id="os-sete-principios-permanentes"></a>
## 4. Os sete princípios permanentes

De [`REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §3. **Não afrouxar.**

| # | Princípio | Onde mora no código |
|---|---|---|
| 1 | **Dinheiro compra conveniência, cosmético e identidade — nunca o comportamento nem o perdão dele** | `src/utils/currencies.ts` (`CREDIT_TO_BITS` só numa direção); teste `currencies.test.ts` |
| 2 | **Nada de conteúdo aleatório vendido.** Drops se ganham jogando; a loja vende item determinado | Glitchtama nunca entra em `SHOP_ITEMS`; `rollDungeonHeartDrop` tem teto diário |
| 3 | **Modernizar o atrito, nunca a dificuldade** | é o critério que separou `HEART_GOAL_RATIO` (perdão no coração) de afrouxar o dia completo — `src/utils/dailyReset.ts` |
| 4 | **O jogo continua íntegro com o backend morto** | a regra do `?? padrão` no load (`src/contexts/GameStateContext.tsx`); nenhuma progressão exige rede |
| 5 | **Regras explicadas, resultados surpreendentes** | a árvore de 11 formas é visível; os thresholds não. É a condição para o Oráculo não virar gacha caro |
| 6 | **O sinal do Soulmon é declarado, não inferido** | qualificado pelo critério **D** abaixo; `src/utils/steps.ts` é o caso-limite (passo confirma, nunca pontua sozinho) |
| 7 | **"Passou muito tempo no app" é antipadrão** | é o motivo de `FOOD_LIMIT_PER_HOUR` e `RUB_HEAL_DAILY_CAP` **não** serem afrouxados quando o app "parece vazio" |

---

<a id="os-quatro-criterios"></a>
## 5. Os quatro critérios

Nasceram depois dos princípios, mesma seção §3 do
[`REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md).

**A — O teste do "exploitationware".** Toda mecânica nova de recompensa responde
antes de entrar: *"isto faz a pessoa querer fazer a tarefa, ou querer a
notificação?"* É a proibição #19 e a pergunta 1 do guarda da linha vermelha.

**B — A regra de ouro do parâmetro.**

> Um parâmetro novo só entra se **ou for alimentado por uma tarefa real
> cumprida, ou gastar um recurso que veio de tarefa real**. Medidor que sobe e
> desce sozinho com o tempo é cobrança desacoplada da vida real.

Brincar passa (`PLAY_ENERGY_COST` gasta energia que veio de comida, que veio de
tarefa). Cansaço passa (`tiredness` é derivado, não medido). Uma barra de
diversão que decaísse com o relógio **não passa**.

**C — Meta que cede, nunca que aperta.** Adaptar para baixo pode ser discutido;
adaptar para cima é a esteira do Vital Bracelet. *Um jogador nunca pode ser
punido por ter tido uma boa semana.* É por isso que `dailyGoalFor` é
`min(cadastradas, requisito)` — cadastrar mais nunca aumenta o risco.

**D — A qualificação do princípio 6.**

> **Declarado pontua. Inferido confirma e enriquece. Nunca o inverso.**

O sensor nunca pontua sozinho; quem não tem sensor não fica em desvantagem
estrutural.

---

<a id="as-cinco-regras-sobre-perda"></a>
## 6. As cinco regras sobre perda

De [`REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §3, destiladas de
`guia-experiencia/03-gamificacao-streaks.md` §1.3. É o filtro mais operacional
que a pesquisa produziu:

1. Perda só sobre **recurso recuperável e voluntariamente apostado** (a run da
   masmorra, a aposta do Forest) — **nunca** sobre identidade, coleção ou
   progresso.
2. Proteção contra falha **por padrão**, nunca opt-in. (É por isso que
   `applyMissedDay` consome escudo automaticamente.)
3. Contador que **acumula** retém; contador que **zera** produz violação de
   abstinência. (É por isso que `perfectDays` só acumula e `constancy` é média
   móvel.)
4. Recompensa variável no **cosmético/narrativo**, determinística no
   **essencial**.
5. Prestígio **visual** captura o orgulho do streak sem o custo psicológico.

⚠️ A regra 5 é declarada no `REGISTRO-DE-DECISOES.md` como "a única das cinco
que o Soulmon ainda não implementou". **O código a implementou parcialmente
depois disso**: `steadyWindow` (`src/utils/habitRhythm.ts`,
`STEADY_WINDOW_DAYS = 28`) é exatamente uma aura estética, silenciosa, que não
dá nada — o modelo do *Perfect Streak*. Ver a linha `⚠️ divergência` em
[`02-REGRAS-DE-NEGOCIO.md`](02-REGRAS-DE-NEGOCIO.md#constancia).

---

<a id="as-linhas-vermelhas"></a>
## 7. As linhas vermelhas (as 21 proibições)

Dono: o agente `soulmon-guarda-linha-vermelha`; o ledger é
[`docs/plano-melhorias/ledger/vetos.md`](../plano-melhorias/ledger/vetos.md), e a
lista curta também está em [`docs/PLANO-MELHORIAS.md`](../PLANO-MELHORIAS.md)
§9 e no `CLAUDE.md` ("Nunca, nesta área", na tabela do motor de tarefas).

### Travadas por TESTE — remover o teste é remover o produto

| # | Proibição | Onde o teste trava |
|---|---|---|
| 1 | **Streak que zera** | `src/utils/habitRhythm.test.ts` (constância é média móvel `CONSTANCY_WINDOW_DAYS`) |
| 2 | **Humor como pontuação** | `src/hooks/useDailyReset.test.ts` — *"humor NUNCA entra em pontuação: a virada do dia ignora o log"*; o módulo tem `src/utils/mood.test.ts` |
| 3 | **Bits → Créditos** | `src/utils/currencies.test.ts` (só existe `CREDIT_TO_BITS`) |
| 4 | **Emblemas comprando vantagem** | `src/utils/currencies.test.ts` / `monetization.fronteira.test.ts` (todo `TOURNAMENT_ITEMS` é `bg`/`furniture`) |
| 5 | **`bondLevel` persistido** | `src/utils/bond.test.ts` (o nível é sempre `bondLevelFor(totalXP)`) |
| 6 | **Dia da regra diária pelo relógio do aparelho** | `src/utils/playerDay.contract.test.ts` (guard de AST no ponto de uso) |
| 7 | **Aritmética de HP no `App.tsx`** | `src/utils/poopDrain.regression.test.ts` |
| 8 | **Regra dentro de updater inline** | `src/utils/x6Updaters.contract.test.ts` |
| 9 | **`MAX_DAILY_FOCUS ≠ 3`** (literal travado) | `src/utils/taskTriage.test.ts` |
| 10 | **`ABSENCE_FORGIVENESS_DAYS ≠ 2`** (literal travado) | `src/hooks/useDailyReset.test.ts`, `src/hooks/useDailyReset.clock.test.ts`, `src/utils/poopDrain.regression.test.ts` |
| 11 | **Traço de nascimento negativo** | `src/utils/passives.test.ts` |
| 12 | **Punição por sono ruim / score de sono** | `src/utils/restWindow.test.ts` (nenhuma função devolve número que diminui) |
| 15 | **Nunca "última chance" / FOMO que tira** | `src/copy.semFomo.contract.test.ts` (desde 21/09/2026, QA Rodada 1 — varre `src/components/**`, `workers/*.js`, o Kotlin do widget, `res/values`, `i18n.ts`, `petVoice.ts`, `welcomeBack.ts`, `_pushCopy.js` e `public/*.html` com 18 regex PT/EN fora de comentário, e exige que nenhum item de `ALL_SHOP_ITEMS`/`SPECIAL_ITEMS` tenha campo de prazo nem descrição de escassez). Mantém o número 15 — a numeração é o id do ledger, não a ordem da tabela |

**Contagem em 21/09/2026: 13 por teste, 8 por tese** (⚰️ "12 por teste, 9 por tese" valeu de 02/09 a 21/09/2026, até a #15 ganhar régua; ⚰️ "12 e 8" valeu até 02/09, quando a #21 foi inscrita).

### Travadas por TESE — sem teste, e por isso as frágeis

| # | Proibição |
|---|---|
| 13 | **Nunca vender proteção contra punição.** Foi o veto E2/C-S3; consequência aplicada no código: `HEART_COST_CREDITS` foi apagado e o 💗 saiu da loja de Bits (ambos em 06/09/2026) |
| 14 | **Nunca percentual cru de constância na UI** |
| 16 | **Nunca recompensa por CONTAGEM de tarefas** (o pool de `weeklyMissions.ts` obedece, e há teste varrendo o vocabulário). Desde 21/09/2026 vale também para o **cosmético**: ⚰️ a conquista `tasks-100` virou `dias-completos-30` (decisão #30, `vetos.md`; [`02` §57-A](02-REGRAS-DE-NEGOCIO.md)) |
| 17 | **Nunca um nono perdão** sem responder à decisão D4 |
| 18 | **Nunca texto do usuário em IA ou telemetria** sem decisão explícita do dono |
| 19 | **Nunca mecânica cuja resposta seja "querer a notificação"** e não "querer fazer a tarefa" |
| 20 | **Chaves do bridge do widget e do save: só ACRESCENTAR** |
| 21 | **Nunca métrica de desempenho de outro jogador** — nem por reuso de componente do próprio perfil. A tela do outro só mostra presença (criatura, nome, galho como palavra) e só oferece verbos de dar. Inscrita em 02/09/2026 |

### A bíblia narrativa obedece às 21 (21/09/2026)

[`docs/NARRATIVA-E-UNIVERSO.md`](../NARRATIVA-E-UNIVERSO.md) (doc vivo, indexado
no `00-MAPA.md`) é o universo do jogo — premissa, cosmogonia da **Malha**,
persona, biologia, taxonomia, vocabulário PT+EN — e **não decide regra nenhuma**:
nada de `src/` mudou com ela, e tudo que pediria mecânica está isolado nas
propostas — que saíram da §14 da bíblia para
[`docs/NARRATIVA-PROPOSTAS.md`](../NARRATIVA-PROPOSTAS.md) em `e98fd2b7`
(21/09/2026) e continuam "depende do dono", exceto **P1, P2, P5, P8, P9 e P10**,
fechadas pelo dono no mesmo dia ([`REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md)
§14 — ver §10 deste doc). O que ela acrescenta a este capítulo:

- **Doze leis de ESCRITA (L1..L12, §2)** para todo texto de jogador: o mundo
  descreve, nunca julga (L1); a criatura não é espelho nem placar (L2); nada no
  universo enfraquece por culpa do jogador (L3); o mundo nomeia o **ato**, nunca
  a pessoa nem o mérito (L12).
- **Os três limites (§16)**, fora da ficção e obrigatórios em superfície
  alcançável (`HelpModal`, Sobre, ficha da loja): não é tratamento; não sabe
  nada além do declarado; texto que leia como afirmação sobre saúde, mente ou
  destino não entra.
- **O checklist que reprova copy (§17)** — qualquer "sim" reprova.

Parecer do guarda em [`vetos.md`](../plano-melhorias/ledger/vetos.md), 21/09/2026:
**`APROVADO COM RESSALVA`** — sem perdão novo (D4 segue em oito, proibição #17),
sem número que desce. Três ressalvas foram do lado "perdoa demais": L4 nascia
falsa sobre HP e energia, que descem por desenho; L11 proibia a criatura reagir
ao carinho, que é o retorno do loop central; e faltava L12, sem a qual L1 + L11
dão um mundo indiferente — contra a tese que diz *encoraja*. Todas aplicadas.
Duas afirmações da bíblia foram medidas falsas contra o código e corrigidas:
`moodSummary` (`src/utils/mood.ts`) devolvia a normalização que L9 proíbe
(virou a proposta P14 — ⚰️ a frase "e tudo bem que seja assim" **saiu em
`5b91717c`, 21/09/2026**, e nada entrou no lugar: o meio-termo é só "altos e
baixos", ver [`02` §12](02-REGRAS-DE-NEGOCIO.md#humor)), e as faixas do Torneio
vêm de pontos (`getTierStanding`), não de tempo de casa.

**O que da bíblia chegou ao código em 21/09/2026** (commits `a2ded861`,
`84ae4937`, `5b91717c`, `f3654076`, `1480b632`):

- **Os três limites da §16 estão em superfície alcançável**: grupo
  **"Sobre"/"About"** do `SettingsPage` (`src/components/SettingsPage.tsx`, os
  três parágrafos) e a linha de abertura do `HelpModal` ("nenhum deles descreve
  você" — o universo descrito como universo) — L10 deixa de estar violada nessas
  telas.
- **A voz da criatura obedece ao sensório (§5.10)**: `PET_VOICE_LINES`
  (`src/utils/petVoice.ts`) perdeu toda fala que exigia memória, tempo decorrido
  ou afirmação sobre a pessoa (`lowHp` "Tô com saudade", `idle` "Como foi seu
  dia", `milestone` "Você repetiu tanto que virou seu"), e ganhou seis `kind`
  novos — `full`, `healCap`, `steady`, `sleep`, `wake`, `residue`. Régua:
  `src/utils/petVoice.test.ts` (varre cobrança, comentário sobre a noite de quem
  lê, vergonha/nojo e instrução de retorno). Detalhe por sistema em
  [`02`](02-REGRAS-DE-NEGOCIO.md) §2, §3, §8, §10, §48.
- **O reencontro não encena espera**: as faixas 2 e 3 de `welcomeBack.ts` perderam
  "Quanto tempo!", "Senti saudade esses dias" e "Eu estava aqui, esperando"
  (`1480b632`). A estrutura de FAIXAS fica — decisão do dono, §14.3 do registro.
- **A trava de crise do chat** (`f3654076`, decisão §14.2 do registro): a cláusula
  `SAFETY` do system prompt de `functions/api/chat.js` proíbe o modelo de citar
  número, serviço ou site; o caminho de ajuda é uma lista **curada, estática e
  humana** no `ChatBox` (`src/components/ChatBox.tsx`: `findahelpline.com` +
  CVV 188 no PT; 988 e 116 123 no EN). ⚠️ Instrução de prompt é probabilística;
  o caminho determinístico no servidor está **recomendado, não feito**
  (`STATUS.md`, 21/09/2026).
- **A régua `src/narrativa.contract.test.ts` mudou de estatuto**: a tabela
  `DÍVIDA` (pendência a quitar) virou `EXCECOES` (o que ficou, por decisão
  §14.4). Continua travando os termos nunca aceitos (`tamer`, `domador`,
  `treinador`, `digievolução`, `mundo digital`) e o espalhamento de termo aceito
  para arquivo novo. ⚠️ divergência: o `CLAUDE.md` ainda chama a tabela de
  `DÍVIDA` — registrada como D31 em [`02` §59](02-REGRAS-DE-NEGOCIO.md#divergencias).

### As seis perguntas que qualquer proposta responde

Do arquivo do guarda (`.claude/agents/soulmon-guarda-linha-vermelha.md`):

1. Isto faz a pessoa querer fazer a tarefa, ou querer a notificação?
2. Isto tira algo? Se sim, é recuperável (moeda, escudo) ou é identidade e
   progresso — que é proibido?
3. Isto acrescenta **mais um perdão**? Então D4 precisa estar respondida.
4. Isto expõe um número que **desce**?
5. Se o usuário visse o mecanismo por dentro, se sentiria manipulado?
6. Isto cabe na frase da tese, dita em voz alta, sem constrangimento?

> **O guarda recusa nos DOIS sentidos**: punição que cobra **e** perdão que
> esvazia. *"Se num parecer você nunca disse 'isto perdoa demais', você só está
> fazendo metade do trabalho."*

---

<a id="o-modelo-de-monetizacao"></a>
## 8. O modelo de monetização

### Grátis (demo) × pago

O save carrega `accountTier: 'demo' | 'paid'`
(`src/contexts/GameStateContext.tsx`). Um save novo nasce `'demo'`; save
anterior ao campo é lido como `'paid'` (mesma fonte). **O cliente nunca decide
o tier** — quem concede é o servidor, em `functions/api/_entitlements.js`
(`applyVerifiedPurchase`, `requirePaidTier`), a partir de compra verificada.

| | Demo (grátis) | Pago |
|---|---|---|
| Criatura | uma das **seis** linhas prontas (`PREMADE_CHARACTERS`, `src/utils/monetization.ts`: `kaelen`/`orrin`/`thalindra` + `igni`/`nautilu`/`astrase` — as três do oráculo com seed fixo entraram em 15/09/2026, decisão D1 da SQUAD-ARTE; nome sempre de `DUNGEON_LINE_NAMES`). Desde 20/09/2026 o caminho grátis também responde as 6 perguntas e vê um reveal-demo em **silhueta** antes de escolher (`REVEAL_DEMO` → `DEMO_PICK`, REGISTRO 13.19) | criatura **gerada** pelo Oráculo, única |
| Teto de atividades | `DEMO_ACTIVITY_TOTAL_CAP` = `FORM_REQUIREMENTS.rookie.cap` | o `cap` do estágio atual |
| Renascimento | indisponível (`rebirthRefusal` → `'not-paid'`) | disponível, **uma vez só** |
| Regras de jogo | **idênticas** | **idênticas** |

⚠️ **divergência:** o `CLAUDE.md` ("Arte e nomes") ainda fala em "os três
personagens prontos" (Pyraka, Akashaoi, Nimbrata). São seis desde 15/09/2026;
o código vence. Registrado em [`02 §59`](02-REGRAS-DE-NEGOCIO.md#divergencias), D28.

Preço de entrada: `FULL_UNLOCK_PRICE_LABEL` (`src/utils/monetization.ts`) —
compra ÚNICA, SKU `FULL_UNLOCK_SKU`.

⚠️ **A camada recorrente foi DECIDIDA em 22/09/2026** (pergunta **#55** do
dono): **assinatura de IA de R$ 9,90/mês com 300 mensagens, só texto e voz**
(chat, sugestões, transcrição) — **o sprite fica FORA** (custo de imagem por
unidade); quem estoura compra créditos; quem comprou o desbloqueio ganha o
**1º mês de cortesia**; e ela se **constrói DEPOIS do E0**. A decisão com as
alternativas que perderam e os gatilhos de revisão está em
[`REGISTRO-DE-DECISOES.md` §5.4](../REGISTRO-DE-DECISOES.md) —
[`PLANO-PRODUTO.md`](../PLANO-PRODUTO.md) Parte 3 é o raciocínio que levou até
lá, não o estado. ⚰️ Até esta data a camada recorrente aqui descrita era
"estação cosmética" — **o conteúdo mudou para IA de texto/voz**.

**Nada disto está implementado**: `monetization.ts` não tem SKU recorrente e o
que vale hoje é o teto por tier (`_aiGuard.js` › `AI_LIMITS.chat`, demo 30 /
paid 120 por dia).

### As três moedas, e a fronteira que nunca se cruza

Dono: `src/utils/currencies.ts`. Detalhe de regra em
[`02-REGRAS-DE-NEGOCIO.md`](02-REGRAS-DE-NEGOCIO.md#moedas).

| Moeda | Campo | Como se ganha | O que compra |
|---|---|---|---|
| **Bits** | `gamePoints` | minijogos (Dino, PPT), masmorra | loja comum: chips, decoração, cenários, `deepStartCost` |
| **Emblemas** | `emblems` | partidas do Torneio (`EMBLEMS_PER_WIN`/`_LOSS`), missões semanais | **só** `TOURNAMENT_ITEMS`, e **todos são cosméticos** |
| **Créditos** | servidor, `ent:<saveId>` | **dinheiro real** (`CREDIT_PACKS`) | `REROLL_COST_CREDITS`, câmbio `BITS_EXCHANGE` |

### O que dinheiro NUNCA compra

- **Bits → Créditos não existe** (proibição #3): permitir farmar Créditos
  anularia a exclusividade do dinheiro real.
- **HP.** ⚰️ `HEART_COST_CREDITS = 10` (cura instantânea de 1 coração) **não
  existe mais** — apagado em 06/09/2026 pelas decisões D7+D15, com lápide em
  `src/utils/monetization.ts` e guard em `src/utils/x6Updaters.contract.test.ts`.
  No mesmo dia o 💗 **saiu da loja de Bits**, porque `BITS_EXCHANGE` fazia dele
  um caminho indireto de dinheiro → coração.
  ⚠️ **divergência:** o `CLAUDE.md` ainda lista "cura instantânea (10)" entre os
  gastos de Créditos e ainda vende "coraçãozinho (`💗`, 150)" na loja. As duas
  linhas descrevem código que não existe.
- **Vantagem de combate ou de progressão.** Emblemas compram só `bg`/
  `furniture` (verificado: `TOURNAMENT_ITEMS` tem 8 itens, 6 `furniture` e 2
  `bg`), e as recompensas do Vínculo são 100% cosméticas por regra escrita em
  `src/utils/bond.ts` (`BondRewardKind` não tem um kind de moeda, HP, energia
  nem `perfectDay`).
- **Conteúdo aleatório** (princípio 2): o Glitchtama nunca é vendido.

Um comprovante de compra vale para **uma conta só** (`claimOrder`,
`functions/api/_entitlements.js`); há teste. Ver
[`docs/BILLING-SETUP.md`](../BILLING-SETUP.md).

---

<a id="as-quatro-superficies"></a>
## 9. As quatro superfícies

Detalhe técnico em `05-ARQUITETURA.md` e `08-INTEGRACOES-E-DEPLOY.md`; aqui só o
que cada uma É, do ponto de vista de produto.

| Superfície | O que é | Onde mora |
|---|---|---|
| **Web / PWA** | o app inteiro; a fonte de todas as regras | `src/`, publicado em Cloudflare |
| **APK Android** | o mesmo app dentro de um WebView do Capacitor — **carrega a URL de produção**, então mudança web não pede APK novo | `android/` |
| **Overlay de desktop** | app Electron separado: o pet anda numa faixa transparente na barra de tarefas do Windows. É um **controle remoto** — lê e escreve o save por `/api/save` (carinho, comida, marcar tarefa, banho, dormir). Criar/editar tarefa é só no app | `desktop/`, ver [`docs/PLANO-DESKTOP-STEAM.md`](../PLANO-DESKTOP-STEAM.md) |
| **Widgets Android** | a superfície mais exposta do telefone — vista dezenas de vezes sem que ninguém decida abri-la. **O widget NÃO COBRA**, e há régua: `src/plugins/widgetSemCobranca.contract.test.ts` | `android/.../widget/` |

A regra que atravessa as quatro: **regra copiada é regra que diverge em
silêncio** (footgun 9 do `CLAUDE.md`). O overlay **importa** `careRules`,
`careUpdaters`, `careCaps`, `playerDay`, `restWindow` e `poopDrain` de
`src/utils/`, em vez de reimplementá-los.

### 9b. Plataformas SUPORTADAS — e o que "melhor esforço" quer dizer

Decisão do dono **#49/#69** (22/09/2026, QA Rodadas 1 e 2). Até aqui o projeto
nunca tinha declarado em lugar nenhum onde promete funcionar — o que significa
que todo bug de navegador era igualmente urgente, e nenhum era.

| Nível | Plataformas | O que isso obriga |
|---|---|---|
| **SUPORTADO** | **Android com Chrome** (PWA instalada **e** APK) e **desktop Chromium** (Chrome/Edge) | bug aqui é bug: **bloqueia** lançamento e entra na fila. Toda regra de jogo, push, save na nuvem e áudio funcionam |
| **MELHOR ESFORÇO** | **iOS** (Safari e qualquer navegador de lá — todos usam o WebKit) e **Firefox no Android** | o app carrega e se joga. Um bug exclusivo daqui é registrado, **não** bloqueia lançamento, e pode ser fechado como "conhecido" |

**As duas limitações do iOS que não são bug nosso e não têm conserto por código:**

1. **Sem notificação push** fora da PWA instalada na tela de início — e, mesmo
   instalada, o comportamento é do sistema, não nosso. Todo o desenho de
   lembrete assume que ele pode simplesmente **não chegar** no iOS.
2. **Armazenamento SEPARADO e apagável**: o WebKit isola o storage do site do
   storage da PWA instalada — são **dois saves locais diferentes** no mesmo
   aparelho — e pode apagá-lo depois de ~7 dias sem uso. **O login é a única
   rede de segurança** (o save na nuvem, `/api/save`), e é por isso que ele
   nunca pode virar "opcional escondido" no onboarding do iOS.

**O que o E0 faz com isso** (`docs/E0-PREREGISTRO.md`): o E0 assume que **há
iPhone entre os 10 convidados**, então o dono dá **uma passada de teste em iOS
antes do 1º convite** — instalar a PWA, criar conta, marcar uma tarefa, fechar
e reabrir. Não é para suportar o iOS; é para saber o que dizer quando o
convidado de iPhone reclamar, em vez de descobrir junto com ele.

---

<a id="o-estado-do-projeto"></a>
## 10. O estado do projeto em 09/09/2026

> ### ⚠️ Ninguém nunca usou o app em produção
>
> Informado pelo dono em 07/09/2026 e registrado no `CLAUDE.md`. Duas
> consequências, e nenhuma delas é "pode apagar tudo":
>
> 1. **Toda justificativa que começa com "quebraria o save de quem já joga"
>    decide sobre uma premissa falsa.** Isso não autoriza apagar nada por conta
>    própria — o dono pode ter o save dele num aparelho, e "ninguém em
>    produção" ≠ "nenhum save existe". O que autoriza é levar a decisão ao dono
>    com a conta na mão, em vez de repetir a frase.
> 2. **Sem usuários não há telemetria.** A curva de retenção D1/D7/D30 e o
>    desenho D30–D90 são **hipótese não confrontada**.

**O gargalo do projeto hoje é distribuição, não produto.** É a objeção mais
grave levantada em [`PLANO-PRODUTO.md`](../PLANO-PRODUTO.md), Parte 5: a
projeção de 200 unlocks/mês exige ~6.500 instalações demo/mês (~220/dia), sem
verba de marketing, num app novo — quando um app novo tipicamente faz 5–30/dia
orgânicos nos primeiros seis meses. **A projeção pede 10× o cenário otimista
como caso base.**

O steelman registrado na mesma seção: o reveal do Oráculo é conteúdo
nativamente compartilhável, e o ativo já está pronto. Mas **é hipótese**, e
nenhum plano continha um teste dela.

As três teses que decidem o negócio, e que **nenhuma é legível hoje**
(`PLANO-PRODUTO.md`, Apêndice): conversão demo→pago ≥ 3% · D30 ≥ 12% · custo de
IA por usuário pago ≤ R$ 8.

O que está aberto e **depende do dono** está na seção 3 de
[`docs/STATUS.md`](../STATUS.md) — é lá que se lê o estado vivo, não aqui.

### Adendo de 20–21/09/2026

- **Fase 2 (identidade) fechada em 20/09/2026**: 14 canvases aprovados e
  implementados na `main` (`docs/design/DECISOES-WIREFRAME.md` §18–§31). A tese
  "O Visor" (pixel só dentro do vidro) vale em todas as superfícies, inclusive
  widgets, overlay e push. Nenhuma regra de jogo mudou com ela — o que mudou de
  regra está em [`02`](02-REGRAS-DE-NEGOCIO.md) (§22, §28, §57-A, §57-B).
- **A marca `Soulmon` é o nome canônico de uma criatura da Bandai** (Champion,
  Fantasma, Virus), verificado na enciclopédia oficial em 21/09/2026 — achado do
  parecer de PI sobre a bíblia (`NARRATIVA-E-UNIVERSO.md` §14, **P8**). Nome
  exato, no gênero em que a confusão é máxima, num app que usa vírus/dado/vacina
  e a escada rookie→champion→ultimate→mega. Junto: `Serah` e `Pyraka` nas 9
  linhas, `Zeed` nos prefixos de mega, e vírus/dado/vacina visíveis em 7 famílias
  de superfície. ⚰️ **Deixou de depender do dono em 21/09/2026**: ele decidiu
  que *"Soulmon é o nome do nosso app e personagens próprios"* — o nome **fica**,
  P8 fechada, e os nomes de PI ficam **todos** (`Vírus/Dado/Vacina`, `Glitchtama`,
  `Serah`, `Pyraka`, `Zeed`; P1, P5, P9, P10 fechadas). A medição acima continua
  verdadeira e fica registrada **para ninguém reabrir como novidade**; o gatilho
  de revisão é comunicação formal de titular ou de loja. Registro canônico, com a
  alternativa que perdeu: [`REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md)
  §14.1 e §14.4. Consequência: `Ruptura/Trama/Guarda` são vocabulário de MUNDO,
  não rótulo de interface.
- **As outras duas decisões do dono de 21/09/2026** (mesmo §14): a trava de
  crise do chat ganhou caminho curado (§14.2 — ver §7 acima) e o reencontro
  continua por FAIXAS de ausência (§14.3, WP2.7 mantido). O que segue **aberto e
  não depende do dono**: o caminho determinístico de crise no servidor.
- **QA geral de 21/09/2026 — as 29 respostas (#11–#39) executadas em
  `42b07bec` + `4a8b8049`** (blocos datados do [`STATUS.md`](../STATUS.md)). As
  que mudam a VISÃO: **Camada 3 congelada** (#13 — Steam, coop, som novo, arte
  extra, narrativa param até **10 usuários × 14 dias de dado**; o núcleo
  tarefas→cuidado→evolução é o que se mede primeiro), **18+ é ICP** (#15, §3),
  **cobrança na web (Pix/cartão) só DEPOIS do 1º usuário real** e antes de
  qualquer marketing (#17 — hoje receita possível = 0 em todas as superfícies;
  a frase do `PLANO-PRODUTO` Parte 3 é meta de margem, não estado), **Play
  preparada pela squad, executada pelo dono** (#16 — `PLAY-FICHA.md`,
  `PLAY-LANCAMENTO.md`, APK `versionCode` 15) e o roster **64 → 37 agentes**
  (#28). Registro canônico com a alternativa que perdeu:
  [`REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) (linhas datadas de
  21/09/2026 "QA GERAL #13/#15/#17"). O que segue **do dono**: as três chaves
  no painel do Worker (`ENTITLEMENTS_ADMIN_KEY`, `COURTESY_MAX_ACCOUNTS`,
  `METRICS_ADMIN_KEY`), 1 h com profissional na trava de crise (#20) e o
  console da Play.
- **Som: o dono escolheu o GERADO nos três eventos longos (21/09/2026, S16 +
  nota do fim do dia no §6.1 do registro).** Primeiro disse "Coloca o A"
  (aplicado literal em `c703c8bc`); perguntado, corrigiu — *"quero o gerado nos
  3"* (`73be1a2f`). O que está no app é o **híbrido**: arquivo de IA em
  `playEvolve`/`playDegenerate`/`playTaskComplete` (com o sintetizado como
  fallback) e na trilha de duas camadas, sintetizado nos cinco curtos. É
  escolha do dono, **não** resultado do A/B cego, que segue montado e não
  ouvido — "a IA venceu" e "o procedural venceu" continuam proibidas (S10).
  Nenhuma linha vermelha muda: nada toca sem gesto, a trilha nasce desligada
  e o app segue funcionando 100% mudo. Regra em
  [`02` §58-A](02-REGRAS-DE-NEGOCIO.md#som); procedência e termos em
  [`docs/Attributions.md`](../Attributions.md) (seção Áudio). ⚰️ Até
  `980bc84c` (21/09/2026) o único switch que ligava a trilha vivia num modal
  sem gatilho vivo e o jogador não tinha como ouvi-la; desde esse commit as
  chaves "Sons" e "Trilha" estão nas **Configurações** (`SettingsPage`, grupo
  "Som" — [`03` §4.23](03-FLUXO-DE-TELAS.md); régua
  `src/components/settingsSom.render.test.tsx`).

---

## Para onde ir agora

| Pergunta | Documento |
|---|---|
| "Qual é a regra de X e quem decide?" | [`02-REGRAS-DE-NEGOCIO.md`](02-REGRAS-DE-NEGOCIO.md) |
| "Por que a regra é essa?" | [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) |
| "Posso mudar essa regra?" | [`docs/plano-melhorias/ledger/vetos.md`](../plano-melhorias/ledger/vetos.md) primeiro, depois o dono |
| "O que está quebrado / aberto?" | [`docs/STATUS.md`](../STATUS.md) |
| "Como a criatura é gerada?" | [`docs/ORACULO.md`](../ORACULO.md) |
