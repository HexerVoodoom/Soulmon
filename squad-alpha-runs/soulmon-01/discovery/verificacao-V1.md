# Verificação V1 — o dreno de cocô é mesmo a única perda de HP sem teto?

> Agente: `alpha-qa`. Data: 2026-08-25. Run `soulmon-01`, Fase 0.
> Origem: gate da Fase 0 cobrou a verificação executável que faltava para a
> hipótese C1 de `mecanismo-e-etica.md` (`alpha-comportamento`).
> Decisão do dono: **D-09 (correção já autorizada)**. Este documento existe para
> converter a hipótese em **fato** ANTES de a correção entrar, e para deixar a
> regressão travada.

---

## 1. Veredito

**HIPÓTESE CONFIRMADA — na parte que era afirmada como FATO de código.**
Uma parte (a corrida de ordenação) permanece hipótese e está separada abaixo.

### 1.1 O caminho de perda de HP, com `arquivo:linha`

Existem **exatamente dois** lugares no app inteiro que subtraem HP
(`grep "healthPoints -" src --include=*.ts --include=*.tsx`, excluindo testes):

```
src/App.tsx:2027         healthPoints: Math.max(0, prev.healthPoints - periods),
src/utils/dailyReset.ts:610   newHP = Math.max(0, prev.healthPoints - heartsLost);
```

O segundo é a virada do dia e é **cercado por três travas**:

- `dailyReset.ts:607` — `const lossCap = heartLossCap(prev.petPassive, MAX_HEARTS_LOST_PER_DAY);`
- `dailyReset.ts:608` — `const heartsLost = forgivesHP ? 0 : Math.min(rawHeartsLost, lossCap);`
- `dailyReset.ts:571,588` — `wasAway = daysAway >= ABSENCE_FORGIVENESS_DAYS` → `forgivesHP`

O primeiro (`App.tsx:2027`) **não tem nenhuma das três**. O bloco inteiro é
`App.tsx:2023-2029`:

```ts
const periods = Math.floor((now - clock) / SIX_HOURS);
if (periods <= 0) return prev;
return {
  ...prev,
  healthPoints: Math.max(0, prev.healthPoints - periods),
  poopPenaltyClockAt: clock + periods * SIX_HOURS,
};
```

`periods` é irrestrito. Não passa por `MAX_HEARTS_LOST_PER_DAY`
(`dailyReset.ts:125`), não passa por `heartLossCap`/traço **Teimoso**
(`passives.ts:97-99`), não consulta `forgivesHP` nem `daysSinceLastReset`
(`dailyReset.ts:217`). Ele mora **fora** de `computeDailyReset()`, dentro de um
`setGameState` de `useEffect` em `App.tsx`.

**Confirmado, literalmente: é a única perda de HP sem teto do jogo.**
E contradiz `CLAUDE.md:76` nas duas metades ("teto de 1 coração perdido por dia"
e "ausência ≥2 dias não cobra nada").

### 1.2 A perda máxima real por dia por esse caminho

O único piso é `Math.max(0, …)`. Portanto:

| Cenário | `periods` | HP perdido |
|---|---|---|
| 6h com cocô na tela | 1 | 1 (é a regra escrita) |
| 12h | 2 | 2 |
| 24h (dia inteiro, acordado) | 4 | 4 → **rookie/champion/ultimate (maxHP 3) chega a 0**; mega (4) chega a 0 |
| Retorno após 2 dias, relógio persistido | 8 | HP a **0** independente do estágio |

**A perda máxima real por dia é o HP INTEIRO do pet — 3 em
rookie/champion/ultimate, 4 em mega, 5 em ultra — ou seja, HP 0 → degeneração**,
num dia em que a regra oficial permitia perder no máximo **1** (0,5 com Teimoso).
Não existe teto algum; o teto de fato é o próprio `healthPoints`.

Duas atenuações reais que o `alpha-comportamento` já havia registrado e que
**confirmo no código** (elas reduzem a frequência, não o teto):
`App.tsx:2018-2021` pausa o relógio dormindo, e o cocô só aparece 2×/dia em
janelas diurnas (`useCareSystem.ts`). Nenhuma das duas limita `periods`.

### 1.3 O que continua sendo hipótese (e eu NÃO converti em fato)

A **corrida de ordenação** entre `drain()` na montagem (`App.tsx:2032`) e o
zeramento da virada (`dailyReset.ts:769`, agendado a cada 30s pelo
`useDailyReset`) é hipótese de ordenação de efeitos. Não a provei aqui — provar
exigiria montar o app com relógio controlado, o que é um teste de integração de
outra ordem de custo. **Ela deixa de importar se o achado irmão (§2) for
corrigido**, porque zerar na hidratação elimina a corrida sem depender de ordem.

### 1.4 Achado próprio, não estava no artefato original

O traço **Teimoso** (`heartLossCap`, `passives.ts:97`) também é ignorado por esse
caminho. O jogador que sorteou o traço "perde só 0,5 coração no dia ruim" perde
4 pelo dreno. O traço é anunciado em Estatísticas e não vale onde mais dói.

---

## 2. Achado irmão: `poopPenaltyClockAt` na hidratação — **PROCEDE**

`src/contexts/GameStateContext.tsx:689`:

```ts
poopPenaltyClockAt: num(loadedState.poopPenaltyClockAt, 0),
```

O relógio do dreno é restaurado **cru** do save da nuvem/localStorage. Ele é um
timestamp absoluto persistido (`GameStateContext.tsx:205` declara o campo), então
um save gravado há 3 dias volta com um relógio de 3 dias atrás e o `drain()` da
montagem cobra retroativamente as horas em que a pessoa **não estava lá** — que é
exatamente o instante que `ABSENCE_FORGIVENESS_DAYS` foi criado para proteger.

`computeDailyReset` zera o campo (`dailyReset.ts:769`), mas só quando a virada
roda. A hidratação acontece antes e não zera. **Confirmado, e coberto no teste
(camada 4).**

---

## 3. A regressão

Arquivo: `src/utils/poopDrain.regression.test.ts` (novo, 15 casos).
Estrutura copiada de `src/utils/dailyGoal.contract.test.ts`, que é o guard de
duplicação de regra que o repo já usa (diferencial sintético + contrato + guard
de origem no fonte).

| Camada | O que trava | Estado hoje |
|---|---|---|
| 1. DIFERENCIAL | prova com números que a perda sem teto diverge da regra escrita (24h zera um mega; retorno de 2 dias cobra 8; Teimoso ignorado) | ✅ **verde hoje e depois** |
| 2. CONTRATO — teto | 24h ≤ `MAX_HEARTS_LOST_PER_DAY`; 6h = 1; <6h = 0; Teimoso = 0,5; dormindo não cobra; cocô limpo zera o relógio | 🔴 vermelho |
| 3. CONTRATO — ausência | 3 dias fora = 0 HP perdido; 2 dias (o limiar) = 0; 1 dia NÃO é perdão (o dreno normal, com teto, continua valendo) | 🔴 vermelho |
| 4. GUARD de origem | `App.tsx` não pode conter `healthPoints: Math.max(0, prev.healthPoints - periods)` e tem que delegar a `applyPoopDrain`; `GameStateContext` não pode restaurar o relógio cru | 🔴 vermelho |

**Por que vermelho é o resultado certo aqui.** O despacho proibiu aplicar a
correção. As camadas 2–4 descrevem o contrato que a correção D-09 precisa
satisfazer; elas ficam vermelhas até ela entrar. A camada 1 é a prova executável
do defeito e é verde nos dois mundos — sem ela, o guard estaria proibindo uma
forma sem provar que ela é ruim (o defeito que `dailyGoal.contract.test.ts`
nomeia: "guard que passa para sempre pelo motivo errado").

**Contrato proposto para a correção** (o dono da regra, hoje inexistente):

```
src/utils/poopDrain.ts
export function applyPoopDrain(state, { now: number; isSleeping: boolean }): state
```

Módulo puro, ao lado de `careRules.ts`, pelo mesmo motivo que `careRules.ts`
existe: regra dentro de handler do `App.tsx` diverge em silêncio do desktop
(footgun 9 do `CLAUDE.md`). O `Math.min(periods, MAX_HEARTS_LOST_PER_DAY)` de uma
linha proposto no artefato original **resolve o teto mas não a ausência nem o
Teimoso**, e deixa a regra em `App.tsx` — as camadas 3 e 4 continuariam vermelhas.

Detalhe de implementação do teste: o import do módulo ainda inexistente é feito
com especificador montado em runtime (`['.', 'poopDrain'].join('/')` +
`@vite-ignore`) **de propósito** — um import estático deixaria
`npx tsc --noEmit` do repo inteiro vermelho e bloquearia todo mundo. Assim a
falha fica onde tem que ficar: no teste, em runtime.

---

## 4. Saída de execução (colada, literal)

### 4.1 `npx vitest run src/utils/poopDrain.regression.test.ts --reporter=verbose`

```
 ✓ src/utils/poopDrain.regression.test.ts > a perda sem teto do dreno diverge da regra escrita do produto > 24h com cocô na tela zera um mega (4 HP) num dia em que o teto era 1 2ms
 ✓ src/utils/poopDrain.regression.test.ts > a perda sem teto do dreno diverge da regra escrita do produto > retorno de 2 dias de ausência cobra 8 corações de uma vez (piso 0) 0ms
 ✓ src/utils/poopDrain.regression.test.ts > a perda sem teto do dreno diverge da regra escrita do produto > o traço Teimoso (perde só 0,5) também é ignorado por esse caminho 0ms
 × src/utils/poopDrain.regression.test.ts > CONTRATO: o dreno respeita o teto diário (CLAUDE.md:76) > 24h de cocô não limpo custa no máximo MAX_HEARTS_LOST_PER_DAY 9ms
 × src/utils/poopDrain.regression.test.ts > CONTRATO: o dreno respeita o teto diário (CLAUDE.md:76) > 6h exatas custam 1 coração — o dreno continua existindo 3ms
 × src/utils/poopDrain.regression.test.ts > CONTRATO: o dreno respeita o teto diário (CLAUDE.md:76) > menos de 6h não cobra nada 2ms
 × src/utils/poopDrain.regression.test.ts > CONTRATO: o dreno respeita o teto diário (CLAUDE.md:76) > o traço Teimoso vale aqui como vale na virada (0,5) 2ms
 × src/utils/poopDrain.regression.test.ts > CONTRATO: o dreno respeita o teto diário (CLAUDE.md:76) > dormindo não cobra (só empurra o relógio) 1ms
 × src/utils/poopDrain.regression.test.ts > CONTRATO: o dreno respeita o teto diário (CLAUDE.md:76) > cocô limpo zera o relógio e não cobra 1ms
 × src/utils/poopDrain.regression.test.ts > CONTRATO: ausência ≥2 dias não cobra nada (ABSENCE_FORGIVENESS_DAYS) > quem volta depois de 3 dias com cocô pendente não perde HP nenhum 1ms
 × src/utils/poopDrain.regression.test.ts > CONTRATO: ausência ≥2 dias não cobra nada (ABSENCE_FORGIVENESS_DAYS) > ausência de 2 dias (o limiar) também é perdoada 2ms
 × src/utils/poopDrain.regression.test.ts > CONTRATO: ausência ≥2 dias não cobra nada (ABSENCE_FORGIVENESS_DAYS) > 1 dia de ausência NÃO é perdão — o dreno normal (com teto) vale 1ms
 × src/utils/poopDrain.regression.test.ts > GUARD: nenhuma subtração crua de HP por relógio sobra em App.tsx > App.tsx não subtrai `periods` do HP sem passar por regra pura 7ms
 × src/utils/poopDrain.regression.test.ts > GUARD: nenhuma subtração crua de HP por relógio sobra em App.tsx > App.tsx delega o dreno ao dono da regra (utils/poopDrain) 1ms
 × src/utils/poopDrain.regression.test.ts > GUARD: a hidratação do save não ressuscita o relógio do dreno > GameStateContext não restaura poopPenaltyClockAt cru do save 1ms

 Test Files  1 failed (1)
      Tests  12 failed | 3 passed (15)
   Duration  395ms (transform 84ms, setup 0ms, import 109ms, tests 36ms, environment 0ms)
```

Detalhe de duas falhas, para o registro:

```
FAIL > GUARD > App.tsx não subtrai `periods` do HP sem passar por regra pura
AssertionError: expected true to be false // Object.is equality
 ❯ src/utils/poopDrain.regression.test.ts:213
   expect(/healthPoints: Math\.max\(0, prev\.healthPoints - periods\)/.test(app)).toBe(false);

FAIL > GUARD > GameStateContext não restaura poopPenaltyClockAt cru do save
AssertionError: expected true to be false // Object.is equality
 ❯ src/utils/poopDrain.regression.test.ts:233
   expect(/poopPenaltyClockAt: num\(loadedState\.poopPenaltyClockAt, 0\)/.test(ctx)).toBe(false);

Error: Cannot find module '/src/utils/poopDrain' imported from D:/Soulmon/repo/src/utils/poopDrain.regression.test.ts
```

As duas primeiras são a **prova executável** de que o defeito está no fonte hoje.
A terceira é o dono da regra que ainda não existe.

### 4.2 Suíte inteira — `npx vitest run`

```
      Tests  12 failed | 1988 passed | 1 skipped (2001)
 Test Files  1 failed | 99 passed (100)
```

**As 12 falhas são todas do arquivo novo.** Nenhuma regressão introduzida: os
outros 99 arquivos (1988 casos) continuam verdes.

### 4.3 Typecheck — `npx tsc --noEmit`

```
tsc exit=0
```

Limpo. O repo continua tipável com o teste vermelho dentro dele.

---

## 5. Estado de entrega e política de git

- Arquivo novo: `src/utils/poopDrain.regression.test.ts`. **Nada de produto foi
  tocado** — `App.tsx`, `GameStateContext.tsx` e `dailyReset.ts` estão intactos.
- **Não mergeado, e de propósito.** A política do repo (`CLAUDE.md:43-53`) exige
  `tsc`/`vitest`/`build` limpos para mergear; um teste intencionalmente vermelho
  não pode passar por esse portão. O arquivo fica no worktree, pronto, e entra no
  MESMO PR da correção D-09 — que é a ordem certa: o teste existe antes, e o PR
  da correção é o que o vira verde.
- **Nenhum teste foi desabilitado, pulado ou afrouxado** para produzir este
  resultado.

## 6. Para quem pega a correção (D-09)

Critérios de aceite, um a um, já rastreáveis para os casos do arquivo:

1. Criar `src/utils/poopDrain.ts` com `applyPoopDrain(state, { now, isSleeping })`
   puro (sem React, sem `Date.now()` interno, sem localStorage).
2. Teto: perda por tick ≤ `heartLossCap(petPassive, MAX_HEARTS_LOST_PER_DAY)`.
3. Perdão: `daysSinceLastReset(lastResetDate, now) >= ABSENCE_FORGIVENESS_DAYS`
   → perda 0 (e o relógio reancorado em `now`, não acumulado).
4. `App.tsx:2007-2029` passa a chamar `applyPoopDrain`; a subtração crua sai.
5. `GameStateContext.tsx:689` para de restaurar o relógio cru do save.
6. Depois disso: `npx vitest run` verde, `npx tsc --noEmit` exit 0, `npm run build`.
7. Efeito colateral registrado por `alpha-comportamento`: **C7 (o push de
   urgência do dreno) deixa de se justificar** quando o dreno vira ≤1/dia. Não é
   escopo desta correção, mas o handoff para `alpha-redator-ux` deve sair junto.
