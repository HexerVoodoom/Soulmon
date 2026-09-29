# Rodada 6 — fuzzing sobre `GameState`: a fixture da rodada 2 era, ela mesma, uma tela branca

> Termos renomeados em 29/09/2026: vírus→poder, dado→harmonia, vacina→benevolência.

> Papel: `qa-sweeper`. Instrumento: **estado de save hostil que não foi escrito por
> nós**, teste de propriedade e sequências de N dias. **Nada commitado, nada
> empurrado.** Nenhum teste existente foi afrouxado. `.github/` intocado.

---

## 0. Portões (números reais, rodados agora)

| Portão | Comando | Resultado |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | **exit 0, sem saída** |
| Testes | `npx vitest run` | **61 arquivos · 829 testes · 829 passam · 0 falham** (baseline 59/766 → **+63 casos**) |
| Build | `npm run build` | **✓ built in 3,45s**, 115/115 PNG→WebP (−7,17 MB), `✨ Compiled Worker successfully` |
| Pós-build | `npx vitest run src/deploy/ src/security/` | **33/33** |

---

## 1. Veredito do loop — resposta direta

A rodada 5 propôs: *"se os defeitos da rodada 6 forem achados **pelos guards** e
não pela leitura de um agente, o loop para."*

**Não posso aplicar esse critério, porque ele descreve a rodada errada.** Eu não
li código procurando defeito e não rodei só os guards existentes: eu troquei o
instrumento de novo, como as cinco rodadas anteriores mandaram. E o instrumento
novo achou **2 🔴 + 1 🟠 + 1 achado sobre o próprio aparato de QA**, com todos os
766 testes anteriores verdes o tempo inteiro.

**O loop NÃO para.** E o motivo desta vez é mais forte que o da rodada 5, porque
não é sobre o código:

> **O 🔴 desta rodada é uma FIXTURE QUE JÁ ESTAVA NA SUÍTE, PASSANDO.**
> `GameStateContext.hostile.test.tsx` (rodada 2) monta o save `{ perfectDays: 10 }`
> e afirma que o app sobrevive. Ele sobrevive **naquele teste**. No app real, esse
> mesmo save é tela branca permanente na primeira carga.

A rodada 2 mediu a coisa certa com o consumidor errado, e ficou três rodadas
verde por isso. Isso é a refutação empírica do critério de parada da rodada 5:
"foi achado pelos guards" não distingue um guard que enxerga de um guard que
mira ao lado. A rodada 5 já tinha encontrado exatamente isso uma vez
(`cloudSync.test.ts`, §6.4 dela, o guard que comparava uma terceira cópia) e
tratou como caso isolado. **São dois em duas rodadas. É um padrão, não um azar.**

---

## 2. 🔴 Todo save que não traz `activities` é tela branca permanente

**`src/contexts/GameStateContext.tsx` `hydrateSave` ↔ `src/hooks/useDailyReset.ts`**

`hydrateSave` completa o save carregado com `?? padrão`. Ela cobre 20 campos.
**Não cobria `activities`, `healthPoints`, `totalXP`, `virusPoints`,
`dataPoints`, `vaccinePoints`, `digivolutionSegments`, `digivolutionSegmentsNeeded`,
`lastResetDate` nem `evolutionStage`** — todos NÃO-opcionais em `GameState`.

E `?? padrão` corrige **ausência**, nunca **tipo**: `tasks: {}`,
`unlockedEvolutions: 'mega'` e `ownedBackgrounds: 7` passavam intactos.

### A cadeia até a tela branca (medida, não deduzida)

1. `adoptCloudSave` (`utils/cloudSave.ts:98`) grava no localStorage **qualquer
   objeto simples** vindo de `/api/save`. A rota valida que `state` é um objeto e
   nada além disso. Com a autenticação desligada (STATUS §3.1), quem souber o
   e-mail de alguém grava `{}` no save dessa pessoa.
2. Na carga seguinte, `hydrateSave({})` devolve um estado com
   `activities: undefined` e `healthPoints: undefined`. **Não lança** — então o
   `try/catch` do inicializador (que existe justamente para isso) não dispara e o
   fallback `freshGameState()` nunca roda.
3. O App monta `useDailyReset`, que chama `computeDailyReset` **no mount**
   (`lastResetDate !== hoje`). Ela faz `prev.activities.filter(...)`.
4. `TypeError: Cannot read properties of undefined (reading 'filter')` **dentro
   do updater do `setGameState`** → React desmonta a árvore.
5. Toda carga seguinte lê o mesmo save. **Sem caminho de recuperação pela UI.**

### Por que passou por 5 rodadas

O teste da rodada 2 monta `<GameStateProvider><Espiao/></GameStateProvider>`, e
`Espiao` só faz `JSON.stringify(gameState)`. **Ele nunca monta o hook da
virada** — o primeiro consumidor real do estado. Medido:

| save | espião da rodada 2 | com `useDailyReset` montado (o App) |
|---|---|---|
| `{}` | ✅ passa | **LANÇOU** `…undefined (reading 'filter')` |
| `{ perfectDays: 10 }` (a fixture existente) | ✅ passa | **LANÇOU** `…undefined (reading 'filter')` |
| `{ activities: null, tasks: [] }` | ✅ passa | **LANÇOU** `…null (reading 'filter')` |
| `{ tasks: {}, activities: [] }` | ✅ passa | **LANÇOU** `prev.tasks.filter is not a function` |

Um caso ainda pior, silencioso em vez de barulhento:
`ownedBackgrounds: Array.from(new Set([...(loadedState.ownedBackgrounds ?? []), 'bg-room']))`
— com um valor não-array, o **spread lança**, aí sim o `try/catch` pega e cai
para `freshGameState()`. O jogador **perde o save inteiro**, com um `console.error`
que ninguém vê.

**Corrigido.** `hydrateSave` ganhou dois helpers (`arr()` e `num()`) que garantem
o **TIPO**, não só a presença, e passou a cobrir todos os campos não-opcionais.
`healthPoints` ausente vira **HP cheio do estágio**, não 0 — um save corrompido
não é um jogador que estava mal, e 0 degeneraria o pet na primeira virada por
causa de um campo faltando.

**Regressão travada:** `src/contexts/GameStateContext.hydrate.fuzz.test.tsx`
(45 casos). 21 saves hostis × 2 caminhos (estado hidratado + **virada montada**),
mais três casos de aparato:

- **autoverificação do mecanismo** — prova que montar `ComVirada` *realmente
  executa* a virada (`lastResetDate` vira hoje, `energyPoints` zera,
  `lastDayReport` aparece). Sem ele, os 42 casos passariam mesmo se o hook nunca
  chamasse a regra: exatamente o modo de falha do `simulateReset` do footgun 9,
  e exatamente o que aconteceu com o teste da rodada 2;
- **autoverificação na outra ponta** — roda `computeDailyReset` no save **cru** e
  exige que pelo menos um da lista LANCE, provando que a lista é hostil de
  verdade e o guard não passa vazio;
- **controle negativo** — um save legítimo (7 dias perfeitos, 999 Bits, 42
  Emblemas, `champion-virus`, cenário comprado) atravessa a coerção **intacto**,
  campo a campo. Sem ele, `hydrateSave` poderia "consertar" zerando tudo.

**Prova de que enxerga:** removi `activities: arr(...)` e a coerção de
`healthPoints`/`tasks` → **30 casos vermelhos**. Restaurado → 45/45.

---

## 3. 🟠 `resolveBranch` devolvia `undefined` — um valor fora do próprio tipo de retorno

**`src/utils/carePattern.ts:157`**

```ts
const max = Math.max(points.virus, points.data, points.vaccine);
if (max <= 0) return reading.confident ? patternBranch(...) : fallback;
const leaders = (['virus','data','vaccine'] as const).filter(k => points[k] === max);
…
return leaders.includes(fallback) ? fallback : leaders[0];
```

Com qualquer atributo não-finito, `max` é `NaN`; `NaN <= 0` é `false`, então o
early return não protege; **nada é `=== NaN`**, então `leaders` fica **vazia**; e
a última linha devolve `leaders[0]` = **`undefined`**.

Alcance: os dois call sites leem `prev.virusPoints`/`dataPoints`/`vaccinePoints`
**direto do save** (`App.tsx:942` na cerimônia de evolução e `App.tsx:2202` no
`forecastBranch` da página de Evolução) — e esses três campos eram justamente
parte da lista que `hydrateSave` não preenchia (§2). Resultado: `currentBranch:
undefined` gravado no save e o **galho previsto** da página de Evolução
indefinido. A evolução em si escapava por acidente, porque `clampBranch`
(`types/progression.ts:115`) troca lixo por `'virus'` — o app entregava um galho
que a tela nunca prometeu, que é literalmente o 🔴 da **rodada 4** voltando por
outra porta.

**Corrigido.** Ponto não-finito vira 0 antes do `Math.max`. O tipo de retorno
volta a ser verdade.

**Regressão travada:** caso "`resolveBranch` SEMPRE devolve um galho válido" em
`gameRules.fuzz.test.ts` — 10 formas de ponto hostil × 2 leituras (confiável e
não-confiável), exigindo que a saída esteja em `['virus','data','vaccine']`.
**Prova de que enxerga:** revertendo as duas linhas → **1 caso vermelho** com a
entrada exata impressa (`{"virus":null,"data":0,"vaccine":0} → undefined`).

---

## 4. 🟠 Degenerar em rookie é **ganho puro** — NÃO corrigi, e o motivo importa

**`src/utils/dailyReset.ts:399`** — `newPerfectDays = Math.floor(FORM_REQUIREMENTS[degeneratedLevel].required / 2)`

A atribuição é um **SET**, não um teto nem uma subtração. E `getPreviousForm('rookie')`
devolve `'rookie'` — em rookie, degenerar não custa estágio nenhum.

### Medido, com `computeDailyReset` real (quarta-feira, fora do alívio de segunda)

Rookie, 4 tarefas cadastradas, **nenhuma feita**, energia 0:

| HP inicial | HP final | estágio | `perfectDays` |
|---|---|---|---|
| 1 (zera → degenera) | **3 (cheio)** | rookie | 0 → **2** |
| 2 (não degenera) | 1 | rookie | 0 → **0** |
| 1, mas **fez todas as 4** | 1 | rookie | 0 → 0 |

Ou seja: **o rookie que abandonou o pet até o HP zerar termina com o HP cheio e
metade dos dias perfeitos necessários para evoluir; o rookie que fez tudo (mas
não encheu a energia) termina com 1 de HP e zero.** Negligenciar rende mais
progressão do que cuidar. Não é farmável em loop (o HP volta cheio, então a
segunda queda leva 3 dias e não passa de 2), mas 3 dias de abandono valem 2 dos
4 dias perfeitos — contra 4 dias de rotina cumprida.

E contraria a linha do `CLAUDE.md`: *"`perfectDays` **só acumulam** — dia
não-perfeito não tira nada"*. Aqui um dia não-perfeito **põe**.

### Por que NÃO corrigi

`src/hooks/useDailyReset.test.ts:148` trava o número **partindo de
`perfectDays: 0`** e o comentário diz, com todas as letras: *"The discount gives
floor(required/2) perfect days **for free**"*. Isso é uma decisão de produto
declarada, não um descuido — e a tabela do `CLAUDE.md` manda. Mexer nisso é
mudança de regra do jogo, não fix de QA.

**O que a decisão de produto provavelmente quis dizer** é "voltar ao estágio de
onde caiu custa metade" (um piso de recuperação depois de uma queda REAL), e não
"cair é um bônus". Se o dono concordar, o fix é uma condição, e **não afrouxa o
teste existente** (o caso dele é `champion-virus → rookie`, com mudança de
estágio, e continua dando 2):

```ts
// só quando a queda foi REAL — em rookie, getPreviousForm devolve 'rookie'
if (newEvolutionStage !== prev.evolutionStage) {
  newPerfectDays = Math.floor(FORM_REQUIREMENTS[degeneratedLevel].required / 2);
}
```

Um segundo caso, também aberto e da mesma linha: um champion com `perfectDays: 1`
que degenera **sobe** para 2. Se o número é um desconto, deveria ser um teto
(`Math.min`), não uma atribuição.

**Decisão do dono.** Não travei teste em cima do comportamento atual de
propósito: travar um número que está em discussão é congelar o defeito.

---

## 5. Achado sobre o aparato: `GameStateContext.hostile.test.tsx` mede com o consumidor errado

Não é um segundo bug, é a **causa** do §2, e merece nome próprio porque a rodada
5 encontrou o gêmeo dele (`cloudSync.test.ts`).

O arquivo da rodada 2 é bom: os cinco casos de `evolutionStage` hostil pegam um
bug real e continuam pegando. O problema é o **componente sob teste**: um espião
que serializa o estado exercita `hydrateSave` e mais nada. Todo campo que só
quebra quando *alguém usa* fica fora do alcance dele por construção.

**Não toquei nesse arquivo** (não afrouxar, não reescrever teste alheio). O novo
`…hydrate.fuzz.test.tsx` monta o consumidor real ao lado e cita o antigo no
cabeçalho, para a próxima pessoa saber por que existem dois.

**A regra que sai daí, e que vale para todo guard do projeto:** *um teste de
"estado hostil não derruba o app" precisa montar o CONSUMIDOR do estado, não o
carregador.* Hoje isso vale para `useDailyReset` (feito) e continua **aberto**
para `useCareSystem`, `useProgressTracking` e os efeitos de cocô/sono do
`App.tsx` — ver §8.

---

## 6. Invariantes que eu propus e que estavam ERRADOS (resultado legítimo)

Registrado para a próxima rodada não gastar o mesmo tempo.

| invariante proposto | veredito | por quê |
|---|---|---|
| "fazer tudo nunca termina com **menos HP** que não fazer nada" | ❌ **meu teste estava errado** | Quem zera o HP degenera, e degenerar **restaura o HP cheio** do estágio de baixo: 3/3 degenerado vs. 1/3 intacto. HP sozinho não mede o resultado; o estágio mede. Está travado como caso `DECLARADO` no arquivo de fuzz, com os três números, para a monotonicidade não ser reescrita por engano. |
| "a virada é idempotente: rodar 2× no mesmo instante não cobra 2×" | ❌ **meu teste estava errado** para o caminho real | `computeDailyReset` é pura: o StrictMode invoca o updater 2× **com o mesmo `prev`** e devolve o mesmo resultado. A segunda cobrança só aparece se você alimentar a função com a SAÍDA dela — e o hook não faz isso (`lastResetDate !== hoje` bloqueia). Registro como **risco latente**, não defeito: a função não se protege sozinha, então qualquer chamador futuro sem a guarda de data cobra duas vezes. |
| "`getMissionProgress` nunca devolve NaN" | ❌ **função frágil, call site correto** | Ela devolve `NaN` para contadores ausentes (`dungeonKills` etc. não estão em `hydrateSave`), mas o **único** call site (`App.tsx:1235-1239`) já aplica `?? 0` em todos os cinco. Não é alcançável. Não subi para achado nem "consertei" para não criar um segundo dono da mesma decisão. |
| "`feedFood` nunca devolve energia acima do máximo" | ❌ **artefato do meu teste** | Quando a comida é recusada (`no-stock`/`hourly-limit`) a função é *passthrough* — devolve o estado de entrada intacto, energia hostil incluída. O invariante só vale no caminho de sucesso, e é assim que está escrito agora. |

---

## 7. Auditado e SEM achado (registrado para não reauditar)

Números de execução, não de leitura.

- **`computeDailyReset` sobre 4.000 estados gerados**: HP sempre em
  `[0, máx do estágio resultante]`, sempre na **grade de 0,5** (nada de
  `0,9999999998` — o modo de falha que a rodada 5 encontrou em
  `tasksToAvoidHeartLoss`), `maxHealthPoints` sempre coerente com o estágio.
- **Teto de perda**: 4.000 estados, `heartsLost ∈ [0, MAX_HEARTS_LOST_PER_DAY]`,
  nunca negativo, nunca `NaN`.
- **`totalPerfectDays` (contador das missões) só cresce**, e no máximo +1 por
  virada — 3.000 estados.
- **`perfectDays` nunca cai sem degeneração** — 3.000 estados. (Com degeneração
  cai, e às vezes SOBE: é o §4.)
- **Monotonicidade** (3.000 estados): fazer tudo nunca perde mais coração, nunca
  dá menos dia perfeito vitalício, nunca conta menos conclusões que fazer nada.
- **Coerência do relatório diário** (3.000 estados): `done ≤ total`,
  `required ≤ total`, e nenhum dia perfeito sem energia cheia, sem bater a meta ou
  com nada cadastrado.
- **Sequência de 60 dias × 120 seeds** com ações aleatórias (comer, carinho,
  concluir tarefa, virar o dia): HP no domínio, energia nunca negativa, histórico
  de `completedTasks` respeitando o teto de 200 em todos os 7.200 dias
  simulados, `perfectDays` sempre finito e ≥ 0. **Nenhuma exceção.**
- **Carinho**: 2.000 estados × 10 esfregadas seguidas — nunca reduz HP, nunca
  passa do máximo, e o teto diário segura em 1 (1,5 para Carinhoso), conforme a
  tabela.
- **`feedsLeft`** fica em `[0,5]` com `NaN`, `±Infinity`, timestamp no futuro e
  50 refeições empilhadas.
- **Faixas do torneio**: acumular ponto **nunca rebaixa** em 17 valores de
  fronteira (incluindo fracionários e ±1e9), `progress ∈ [0,1]`, `pointsToNext`
  nunca negativo, e `NaN`/`±Infinity` caem em número finito.
- **`computeCarePattern`**: 10 históricos hostis (nulo, data lixo, data no
  futuro, data de 1990, 500 conclusões no mesmo dia) — nunca lança,
  `concentration ∈ [0,1]`.
- **`daysSinceLastReset`**: `undefined`, `''`, `'???'`, data de 2030, data de
  1970 — sempre ≥ 1 e finito.
- **`completeTask` é idempotente** (500 estados): a segunda chamada devolve
  `null` e o histórico não duplica.
- **Migração de save legado**: os três caminhos (`equippedFurniture → equippedDecor`,
  `eggType 'agumon' → 'tapirmon'`, `LEGACY_FORM_TIERS`) foram exercitados com
  saves montados campo a campo do que o código antigo escreveria. Nenhum achado
  além do §2 — que é, ele próprio, o caminho de migração falhando.

---

## 8. O que continua CONSCIENTEMENTE sem cobertura

Herda a lista da rodada 5 §8 (itens 1–9 seguem todos abertos) e acrescenta:

| # | o quê | por que não foi coberto |
|---|---|---|
| 10 | **Os outros consumidores de estado hostil** | O §5 fechou `useDailyReset`. `useCareSystem` (cocô), `useProgressTracking` e os efeitos de sono/dreno do `App.tsx` leem o mesmo estado e **não têm** teste de save hostil. O fix do §2 protege a fonte, o que os cobre por tabela — mas nada trava isso mecanicamente para eles. É o próximo alvo óbvio. |
| 11 | **`currentBranch` aceita string arbitrária no load** | `hydrateSave` faz `?? 'data'`, então `currentBranch: 'banana'` sobrevive. `clampBranch` conserta a jusante, então não é alcançável hoje — mas é a mesma forma do §3, um campo cujo tipo o load não garante. |
| 12 | **Fuzzing de `dungeon.ts` e `monetization.ts`** | Ambos tocam `localStorage`/rede e não são puros como os demais; fuzzá-los exige o harness de storage falso. Fora do orçamento desta rodada; declarado em vez de fingido. |
| 13 | **O gerador não produz `evolutionStage` legado** (`gaioumon` etc.) | Os estados gerados usam só ids da árvore atual. `LEGACY_FORM_TIERS` tem teste próprio, mas a virada do dia nunca foi fuzzada com um estágio legado. |

---

## 9. Arquivos tocados

```
NOVOS
  src/contexts/GameStateContext.hydrate.fuzz.test.tsx   (45 casos; 21 saves hostis × 2
                                                         caminhos + 2 autoverificações
                                                         + 1 controle negativo)
  src/utils/gameRules.fuzz.test.ts                      (18 casos de propriedade;
                                                         ~30k execuções de regra,
                                                         PRNG determinístico)

ALTERADOS
  src/contexts/GameStateContext.tsx   (hydrateSave: helpers arr()/num(); passa a cobrir
                                       activities, healthPoints, totalXP, virus/data/
                                       vaccinePoints, digivolutionSegments(+Needed),
                                       lastResetDate, evolutionStage; e a garantir TIPO
                                       em tasks, completedTasks, activityStats,
                                       unlockedEvolutions, poopEvents*, ownedBackgrounds,
                                       ownedFurniture, trophies, friends, moodLog,
                                       activityLog, foodInventory, attributesSinceLastEvolution)
  src/utils/carePattern.ts            (resolveBranch: ponto não-finito vira 0)
  dist/**                             (subproduto do `npm run build`)
```

Nenhum teste existente foi afrouxado. `src/App.tsx`, `src/index.css`,
`src/components/`, `desktop/`, `functions/`, `workers/`, `.github/` e os assets
ficaram intocados.

---

## 10. Critério de parada para a rodada 7 — e o próximo instrumento

O padrão de seis rodadas é inequívoco: **cada troca de instrumento produziu uma
safra nova, e nenhuma rodada esgotou o instrumento seguinte.** Propor "o loop
para quando os guards acharem" já falhou uma vez (rodada 5) e falhou de novo
agora, por uma razão mais funda: **os guards são escritos pelo mesmo lado que
escreve o código, e herdam os mesmos pontos cegos.** Foi por isso que a fixture
da rodada 2 passou três rodadas certificando uma tela branca.

Então o critério que proponho não é sobre defeito nenhum. É sobre o aparato:

> A rodada 7 audita **os guards, não o código**. Para cada arquivo de teste da
> suíte, responde uma pergunta só, com evidência: *"que mudança no código de
> produção faz este teste ficar vermelho?"* — introduzindo o defeito e medindo.
> Todo teste que não ficar vermelho para nenhuma mutação plausível do que ele
> diz cobrir é **decoração**, e é onde o próximo 🔴 está esperando.
> **Se a suíte inteira passar nessa auditoria, o loop para com evidência.**

**Ou seja, o próximo instrumento é MUTATION TESTING** — o único que ainda não
usamos, e o único que mede o **detector** em vez de medir o **detectado**. Os
seis instrumentos anteriores perguntam "o código está certo?". Este pergunta "o
teste está olhando?" — que é a pergunta que teria pego, de uma vez:

- a fixture da rodada 2 que passava com o app quebrado (**§2 desta rodada**);
- o `cloudSync.test.ts` que comparava uma terceira cópia (rodada 5 §6.4);
- o `simulateReset` que o `CLAUDE.md` conta como footgun 9.

**Três achados de rodadas diferentes, um único modo de falha, nunca medido de
propósito.** Dá para começar barato e sem ferramenta nova: um script que aplica
N mutações mecânicas por arquivo (`>` ↔ `>=`, `&&` ↔ `||`, `Math.min` ↔
`Math.max`, `+1` ↔ `-1`, remover uma linha de `??`) e roda só a suíte daquele
arquivo. Sobrevivente = teste cego.

Duas coisas continuam dependendo do dono e não de outra rodada:

1. **`wrangler deploy` dentro de `workers/`** (herdado da rodada 5 §10.1) — sem
   isso, o push das 21h continua saindo em produção com o repositório verde.
2. **Decidir o §4**: em rookie, degenerar é hoje um ganho de 2 dias perfeitos +
   HP cheio. O fix cabe em três linhas e não afrouxa nenhum teste, mas é regra de
   jogo — não é chamada minha.
