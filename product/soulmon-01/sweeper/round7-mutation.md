# Rodada 7 — Mutation testing: medindo o DETECTOR

**Pergunta da rodada:** a suíte de 829 testes verdes *enxerga* alguma coisa?
**Resposta curta:** nos módulos que importam, **não o bastante**. Medido: **49,0% dos
mutantes sobreviveram** na primeira passada. O loop **continua**.

---

## 1. O instrumento

`scripts/mutation-sweep.mjs` (versionado, documentado, sem dependência nova).

Ciclo por mutante: aplica **uma** mutação mecânica num arquivo de produção → roda a
**suíte relevante** → reverte → registra. Mutante que não deixou nenhum teste vermelho
**sobreviveu** = ali o teste é cego, ou a mutação é equivalente.

```bash
node scripts/mutation-sweep.mjs                 # os 9 alvos
node scripts/mutation-sweep.mjs dailyReset      # filtro por caminho
node scripts/mutation-sweep.mjs careRules --json out.json
```

### Decisões de projeto que mudam o resultado

| Decisão | Por quê |
|---|---|
| **Subset por alvo** (~2 s), não a suíte inteira (~13 s) | Suíte inteira × 720 mutantes = horas. |
| **Todo sobrevivente é reconfirmado na suíte COMPLETA** | Subset estreito só produz *falso sobrevivente*, nunca falso morto — a reconfirmação corrige. Sem isso o relatório inflaria. |
| **Máscara de código** (string/template/comentário não mutam) | Senão o script mutila mensagem de erro e chave de storage: ruído que não mede teste nenhum. |
| **Só mutações que preservam a SINTAXE** | Mutante que não compila é sempre "morto" e mede zero. |
| **Timeout de 90 s por execução** | Mutação pode virar laço infinito. Isso É um mutante morto, mas com timeout de 5 min custava 5 min de relógio (foi o que fez a 1ª execução andar a 30 s/mutante). |
| **Baseline verde obrigatório antes de mutar** | Subset vermelho de origem mataria todo mutante e daria 100% de mentira. |

### Operadores

`>`↔`>=` · `<`↔`<=` · `===`↔`!==` · `&&`↔`||` · `+`↔`-` · `*`→`+` ·
`Math.min`↔`Math.max` · `true`↔`false` · `?.`→`.` · `??`→`||` ·
literal numérico → `0` (e `0` → `1`).

### Rede de segurança (aprendida na marra, nesta rodada)

O `finally` reverte em qualquer erro, mas **não sobrevive a um SIGKILL** entre escrever o
mutante e revertê-lo. Aconteceu: o processo foi morto e `functions/api/_entitlements.js`
ficou no working tree com `slice(-0)` no lugar de `slice(-200)`. Um mutante esquecido no
código-fonte é o **pior resultado possível** de uma ferramenta de QA. O script agora tem:

1. um `.mutation-bak` ao lado do alvo enquanto ele está mutado;
2. **recuperação na largada** — achou `.bak` órfão, restaura antes de qualquer coisa;
3. handlers de `SIGINT`/`SIGTERM`/`SIGHUP`/`SIGBREAK`/`exit`/`uncaughtException`.

Verificado depois: a rede pegou o segundo kill (o `.bak` sobrou e restaurou o arquivo
byte a byte). Estado final do repositório: `git status` limpo em `src/`, `functions/`,
`desktop/`, `workers/` — **nenhum arquivo de produção alterado**, nenhum `.bak` órfão.

---

## 2. Resultado por módulo

Priorizado por **dano** (dinheiro, save, laço do dia), não por cobertura.

| Módulo | Mutantes | Mortos (antes) | **Score antes** | Mortos (depois) | **Score depois** |
|---|---:|---:|---:|---:|---:|
| `src/types/progression.ts` | 38 | 34 | 89,5 % | **38** | **100 %** |
| `src/utils/careRules.ts` | 67 | 46 | 68,7 % | **60** | **89,6 %** |
| `functions/api/_entitlements.js` | 70 | 49 | 70,0 % | **55** | **78,6 %** |
| `src/utils/dailyReset.ts` | 115 | 70 | 60,9 % | **82** | **71,3 %** |
| `functions/api/save.js` | 36 | 23 | 63,9 % | — | 63,9 % |
| `src/utils/carePattern.ts` | 45 | 23 | 51,1 % | — | 51,1 % |
| `functions/api/_billing.js` | 130 | 52 | 40,0 % | — | 40,0 % |
| `desktop/renderer/src/cloudSync.ts` | 135 | 37 | 27,4 % | — | 27,4 % |
| `src/contexts/GameStateContext.tsx` | 84 | 19 | **22,6 %** | — | 22,6 % |
| **TOTAL** | **720** | **353** | **49,0 %** | **389** | **54,0 %** |

**Taxa de sobrevivência inicial: 51,0 % (367 de 720).** Não é "a suíte é ruim" — é que
metade das linhas destes módulos pode ser reescrita sem que nada fique vermelho.

---

## 3. Os cegos encontrados (e o que foi feito)

### 3.1 A doença voltou: **guard que afirma a partir da própria constante**

Três guards cegos anteriores (`simulateReset`, `cloudSync.test.ts`, `hostile.test.tsx`)
tinham causas diferentes. Estes três aqui têm **a mesma**: a expectativa é *calculada com
a constante que o teste deveria estar auditando*. O teste vira uma tautologia.

| Achado | Mutação que sobreviveu | Estado |
|---|---|---|
| `src/utils/dailyReset.ts:119` — `WEEKLY_RELIEF_HEARTS = 0.5` | `0.5 → 0` | **corrigido** |
| `functions/api/_entitlements.js:22` — `AD_REWARD_CREDITS = 5` | `5 → 0` | **corrigido** |
| `src/utils/dailyReset.ts:315` — fronteira do perdão de ausência | `>= → >` | **corrigido** |

O primeiro é o mais eloquente: o teste **se chama** `'devolve meio coração na virada de
segunda'` e afirmava
`toBe(3 - MAX_HEARTS_LOST_PER_DAY + WEEKLY_RELIEF_HEARTS)`. Zerando a constante, ele
esperava 2, recebia 2 e passava — **um teste chamado "meio coração" que não afirmava nada
sobre meio coração**, e os 829 continuavam verdes. Mesma coisa em
`_entitlements.test.js:87`: `toBe(AD_REWARD_CREDITS)` num número que é **dinheiro real**.

Correção: número **cru** na expectativa (`toBe(2.5)`, `toBe(5)`), mais um caso que fixa a
constante em si, mais o comentário explicando por que a linha não pode voltar a ser
derivada.

### 3.2 O laço do dia não media atividade recorrente

`computeDailyReset` tem dois caminhos para "a atividade foi concluída?": com passos
(`steps.every`) e sem passos (`completedToday && lastCompletedDate === ontem`). **Todo**
teste da virada montava o dia com `tasks` avulsas. Sobreviveram:

- `:280` `steps.length > 0` → `> 1` — atividade de **um único passo** (a forma mais comum) caía no ramo errado;
- `:283` `&&` → `||` — bastava `completedToday` marcado, sem conferir a data: **dia perfeito automático para sempre**;
- `:406` `completedToday: false` → `true` — a virada não limpava a marca.

Atividade recorrente é o **mecanismo principal de hábito** do app (CLAUDE.md). Corrigido
com 6 casos novos que exercem os dois ramos e a limpeza. **Todos os três mutantes agora morrem.**

### 3.3 Fronteiras de regra que ninguém tocava

| Achado | Mutação | Consequência real | Estado |
|---|---|---|---|
| `dailyReset.ts:309` `totalTasks > 0` | `> 1` | quem cadastrou **uma** atividade nunca teria dia perfeito — justamente quem está começando | **corrigido** |
| `dailyReset.ts:315` ausência `>= 2` | `> 2` | a fronteira exata do perdão (2 dias) não era testada: só 8 dias e 1 dia | **corrigido** |
| `dailyReset.ts:344` `newHP > 0` | `>= 0` | segunda-feira **ressuscitaria** um pet degenerado | **corrigido** |
| `dailyReset.ts:434` `totalPerfectDays + 1` | `+ 0` | a missão "30 dias perfeitos totais" ficava inalcançável | **corrigido** |
| `dailyReset.ts:428` `poopPenaltyClockAt: 0` | `→ 1` | o relógio do dreno atravessava a virada; o pet acordava devendo | **corrigido** |

### 3.4 Dinheiro (`_entitlements.js`)

| Achado | Mutação | Consequência real | Estado |
|---|---|---|---|
| `:83` `amount <= 0` | `<= 1` | **gastar 1 crédito era recusado** — e 1 crédito é o caminho real do `BITS_EXCHANGE` (1 Crédito = 10 Bits). Nenhum teste gastava menos de 50. | **corrigido** |
| `:196` `grantCredits > 0` | `> 1` | compra de 1 crédito: o jogador paga e **não recebe nada** | **corrigido** |
| `:256` `order.voided = true` | `→ false` | compra estornada nunca era marcada → **debitada de novo a cada leitura de saldo, para sempre**. O teste "não estorna duas vezes" existia, mas a segunda conferência respondia `false` para tudo — não exercia a marca. | **corrigido** |
| `:215` `AUDIT_MAX_ORDERS = 20` | `→ 0` | `.slice(-0)` é a lista **inteira**: o teto da quota da loja sumia em silêncio | **corrigido** |
| `:22` `AD_REWARD_CREDITS = 5` | `→ 0` | ver §3.1 | **corrigido** |

### 3.5 Tabela de progressão como contrato

`progression.test.ts` afirmava só **relações** (`>=`, `>`), e relação sobrevive a quase
qualquer valor. Sobreviveram `rookie.cap 6→0`, `rookie.daysToEvolve 10→0` e
`ultra.daysToEvolve 999→0` (o laço de monotonia pula justamente o último índice, então
ultra nunca era olhado). `clampBranch` não tinha **nenhum** teste. **Corrigido — módulo em 100 %.**

---

## 4. Equivalentes (separados de propósito, não contam como cego)

Mutação que **não muda comportamento observável**. Resultado legítimo; inflar o número
com eles seria mentir.

- **Código morto por `MANUAL_EVOLUTION = true`** — `dailyReset.ts:358–386`, o bloco inteiro
  de evolução automática é inalcançável. **12 mutantes** sobrevivem ali por construção
  (`Math.max→min`, `===→!==`, os `0→1`). Não é teste cego; é regra viva guardada em código
  que não roda. *Vale um ticket próprio: ou a flag vira configuração testável, ou o bloco sai.*
- `dailyReset.ts:279` `let isComplete = false` → `true` — os dois ramos seguintes sempre
  reatribuem a variável. Equivalente puro.
- `dailyReset.ts:249` `feitas = 0 → 1` e `<= → <` — com `goal > 0`, `feitas = 0` nunca
  devolve 0, e o último passo do laço coincide com o `return goal` final.
- `dailyReset.ts:336` `heartsLost > 0` → `>= 0` — somar zero não muda HP.
- `_entitlements.js:196 / :262` `> 0` → `>= 0` — creditar/debitar zero.
- **`GameStateContext.tsx` — 8 sobreviventes em ANOTAÇÃO DE TIPO**
  (`place: 1 | 2 | 3`, `mood: 1 | 2 | 3 | 4 | 5`). Tipo é apagado no build: mutação ali é
  equivalente por construção. **Limitação conhecida do script** — ele não distingue posição
  de tipo de posição de valor. Já descontado das leituras abaixo.

---

## 5. O que ficou SEM cobertura (lista honesta)

Não foi corrigido nesta rodada. Ordenado por dano.

1. **`GameStateContext.tsx` — 22,6 %, o pior do repositório.** Descontando os 8 equivalentes
   de tipo, ainda são **~57 mutantes vivos** no caminho de *hidratação do save*. Sobrevivem
   todos os defaults do `initialState` (`:359–385`) e quase todos os `num(campo, 0)` do
   `loadedState` (`:283–321`), além de `:428` `parsed && typeof === 'object' && !isArray`
   (`&&`→`||` sobrevive **duas vezes**: a validação do JSON do storage não é exercida nos
   dois lados). A rodada 6 corrigiu o `hostile.test.tsx` para montar de verdade; a medição
   diz que **montar não é afirmar** — o save é lido e quase nada sobre o resultado é checado.
   *Este é o candidato número 1 da rodada 8.*
2. **`cloudSync.ts` — 27,4 %.** ~98 vivos. O bloco de tabelas copiadas (o guard consertado na
   rodada 5) morre direitinho; o que está cego é o **resto do arquivo**: os `res.status === 401 || 403`,
   os `data?.found`, os defaults `?? 3` / `?? 4` / `: 1`, e `isSaneCareState` nas fronteiras
   (`n < 0`, `healthPoints >= 0`). O overlay do desktop escreve no save do jogador por esse caminho.
3. **`_billing.js` — 40,0 %.** 78 vivos, quase todos atrás de `fetch` para Play/Steam.
   Os de maior dano: `:150` `purchase.purchaseState !== 0` (com `===`, **compra PENDENTE
   vira compra válida**) e `:215/:216` (`isVoided` deixa de reconhecer estorno). Também não
   estão presos os créditos de duas SKUs (`credits.60`, `credits.400`) nem os flags `consumable`.
4. **`carePattern.ts` — 51,1 %.** Todas as fronteiras da classificação estão soltas:
   `spread >= 0.5`, `concentration <= 0.4`, `>= 0.5`, `<= 0.25`, `total >= MIN_TASKS_FOR_CONFIDENCE`,
   e o descarte `t < cutoff || t > now`. Dano menor (é critério de **desempate** de galho),
   mas é literalmente uma tabela de limiares sem um único teste de limiar.
5. **`save.js` — 63,9 %.** Vivos os códigos de status (`401`/`403`/`405`/`500`), o
   `expirationTtl` e a fronteira `> MAX_STATE_BYTES`.
6. **Resíduos menores** já listados em §4/§3: `careRules.ts` `HOUR_MS`, a janela `< HOUR_MS`
   na fronteira exata, `feedsLeft` no piso 0, o fallback de comida desconhecida (`:87`) e
   `energyPoints ?? 0`; `dailyReset.ts` `weekDays?.` / `t?.completedAt` (save hostil),
   `maxHealthPoints ?? 3`, e a família do `tasksToAvoidHeartLoss` com `goal === 1`.

**Nada de produção foi alterado nesta rodada.** Nenhum teste existente foi afrouxado — só
foram acrescentados casos e substituídas expectativas auto-referentes por números crus.

---

## 6. Portões

| Portão | Resultado |
|---|---|
| `npx tsc --noEmit` | **exit 0**, limpo |
| `npx vitest run` | **863 testes, 61 arquivos, 0 falhas** (baseline da rodada: 829) |
| `npm run build` | **exit 0** — vite build + 115/115 PNG→WebP + `✨ Compiled Worker successfully` |
| `git status` (src/functions/desktop/workers) | só arquivos de **teste** modificados + `scripts/mutation-sweep.mjs` novo |

Testes acrescentados: **+34**. Mutantes que passaram a morrer: **+36**.

---

## 7. Veredito do loop

> **O loop CONTINUA.** Os módulos de maior dano **têm** mutante sobrevivente cego.

Com todas as letras:

- **Param aqui** (sem cego conhecido): `src/types/progression.ts` — **100 %**.
- **Ficaram sólidos, com resíduo declarado:** `careRules.ts` (89,6 %),
  `_entitlements.js` (78,6 %), `dailyReset.ts` (71,3 % — dos 33 vivos, **15 são
  equivalentes/código morto**, o que dá ~84 % sobre o alcançável).
- **Continuam cegos, e é aqui que a rodada 8 começa:** `GameStateContext.tsx` (22,6 %),
  `cloudSync.ts` (27,4 %), `_billing.js` (40,0 %), `carePattern.ts` (51,1 %).

O critério de parada proposto não foi atingido, e o número que mais importa não é o 54 %
global — é este: **o caminho que lê o save do jogador (`GameStateContext` hidratação +
`cloudSync`) é o menos enxergado do repositório**, com ~155 mutantes vivos entre os dois.
São exatamente os dois arquivos onde um defeito não dá erro: ele devolve um jogador
plausível e errado. Três rodadas seguidas encontraram guard cego nessa área
(`cloudSync.test.ts` na 5, `hostile.test.tsx` na 6, a hidratação inteira agora na 7) — o
padrão não é azar, é que **ninguém nunca afirmou o conteúdo do estado carregado**, só que
ele carrega.

Também vale registrar o resultado de método: **cobertura não teria achado nada disto.**
Toda linha citada aqui já era executada pela suíte. O que faltava não era passar por elas
— era dizer alguma coisa sobre o resultado.

---

## 8. Como repetir

```bash
node scripts/mutation-sweep.mjs                          # tudo (~1 h)
node scripts/mutation-sweep.mjs GameStateContext         # o alvo da rodada 8
node scripts/mutation-sweep.mjs cloudSync --json cs.json
```

Um alvo por vez, com o repositório limpo. Se o processo morrer no meio, **rode de novo**:
a recuperação pelo `.mutation-bak` restaura o arquivo antes de começar.
