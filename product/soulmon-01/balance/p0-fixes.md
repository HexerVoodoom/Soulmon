# P0 — os 6 bugs de carga diária, consertados

> Implementação do **P0 e só do P0** de `carga-diaria.md`. Nada de P1–P4
> (`HEART_GOAL_RATIO`, dia de folga, alívio adaptativo, presets de rotina) —
> são mudanças de regra para quem já joga, e a decisão é do dono.
>
> Nenhum arquivo de `src/components/`, `src/index.css` ou
> `functions/api/_billing.js` foi tocado. Nada commitado, nada enviado.

## Portões (números reais, rodados depois do último commit lógico)

| Portão | Resultado |
|---|---|
| `npx tsc --noEmit` | limpo, exit 0 |
| `npx vitest run` | **63 arquivos · 1014 testes · 0 falhas** (antes: 63 · 999) |
| `npm run build` | ok — 118/118 PNG→WebP, worker compilado |

Os 997/999 anteriores continuam verdes. Um único teste **existente** mudou, e
foi para ficar mais estrito, não menos (detalhe em "O que mexi em teste antigo").

---

## A tese, em uma frase

A regra que **cobra** já era gentil (`min(cadastradas, requisito)`); a que
**mostra** exigia fazer tudo. Todos os seis defeitos eram denominadores crus —
ou tetos soltos — vazando para o usuário. **Nenhuma regra cobrada ficou mais
fácil**, exceto onde ela era literalmente impossível de cumprir (BUG-3 e BUG-4).

---

## O que mudou

### BUG-4 — o teto de comida ficava ABAIXO do requisito do estágio

- `src/types/progression.ts:34-49` — **nova** `MAX_STAGE_REQUIREMENT`, derivada
  de `FORM_REQUIREMENTS` (`Math.max` dos `required`; hoje = 6).
- `src/utils/careRules.ts:38-52` — `FOOD_LIMIT_PER_HOUR` deixou de ser o literal
  `5` e passou a ser `MAX_STAGE_REQUIREMENT`.
- `CLAUDE.md` linha 🍎 atualizada.

Eram dois números que precisavam concordar, mantidos à mão em arquivos
diferentes — footgun 9. Agora existe **um** número; se a escada mudar, o teto
acompanha sozinho e o teste acusa se alguém desfizer a derivação.

O limite continua existindo e continua barrando farm de atributo (teste de
autoverificação prova que a 7ª comida na mesma hora é recusada). Ele só parou de
barrar o próprio dia do jogador.

### BUG-3 — energia do dia perfeito medida contra a meta do dia

- `src/utils/dailyReset.ts:320-332` — `energyWasFull` passou de
  `>= requiredToday` (requisito cru do estágio) para `>= dailyGoal`.
- `CLAUDE.md` linhas ⚡ e ⭐ atualizadas: a mesma meta vale nos **dois** eixos.

As barras exibidas continuam sendo `getMaxEnergyForStage` (requisito do
estágio) — mudou o que o dia perfeito **cobra**, não o que a UI desenha.

### BUG-1 — `dailyTotal` cru vazando para o widget Android

- `src/hooks/useProgressTracking.ts:52-66` — `dailyTotal` agora é
  `dailyGoalFor(gameState, hoje, dayKey)`, do dono da regra.
- `src/hooks/useProgressTracking.ts:85-97` — `dailyDone` ganhou teto na meta
  (`min(feitas, meta)`): não existe "8/6".

Sem uma linha de Kotlin. `WidgetRenderer.kt` já calcula `ratio = completed/total`
e já protege `total == 0`; ele estava certo lendo números errados. Com os dados
consertados, o mega que fez a meta passa a ver `6/6` e "✨ Dia perfeito!" em vez
de `6/9` e "💪 Quase lá!".

### BUG-2 — `progress` cru e contando sub-passos

- `src/hooks/useProgressTracking.ts:99-114` — `progress` virou
  `min(1, dailyDone / dailyTotal) × 100`. Atividade em passos conta **1 quando
  todos os passos fecham**, igual ao resto do jogo.

Alimenta `getCompanionMood` (`App.tsx:459-463`, `tired` em `<= 15`) e a fala do
pet — por isso o número é humor, não enfeite.

### BUG-5 — a segunda definição de "dia perfeito"

- `src/hooks/useProgressTracking.ts` — `isDayPerfect` **apagado** (linha 74
  antiga) e removido do retorno. Zero consumidores; nada mais mudou.

### BUG-6 — `registeredTasks` cru no `EvolveTaskModal`

- `src/App.tsx:2531-2535` — `gameState.activities.length + gameState.tasks.length`
  → `registeredForDay(gameState, hoje, dayKey)` (import em `src/App.tsx:51`).

### Bônus da mesma classe (achado durante o conserto)

- `src/App.tsx:2559-2563` — `totalRequired` do `NotificationManager` chamava
  `dailyGoalFor` **sem o `dayKey`**, enquanto o `completedSteps` da mesma
  chamada (`dailyDone`) já contava as tarefas que `completeTask` tira da lista.
  Duas props do mesmo componente mediam populações diferentes. Passei o `dayKey`.
  É o mesmo defeito do BUG-6 num call site vizinho; se o dono preferir, reverter
  é uma linha.

---

## Os testes de regressão — o cenário de jogador que cada um trava

Todos foram provados **vermelhos** revertendo o fix correspondente e rodando a
suíte (autoverificação exigida). O que cada um trava:

| Teste | Cenário do jogador | Arquivo |
|---|---|---|
| "mega no sábado com meta 2 faz as 2, ganha 2 comidas e **ganha** o dia perfeito" | rotina toda em seg–sex, 2 tarefas no sábado: energia máxima alcançável naquele dia era 2 | `src/hooks/useDailyReset.test.ts` |
| "quem fez a meta e **não comeu** continua sem dia perfeito" (autoverificação) | impede que o fix transforme energia em decoração | idem |
| "quem **não** fez a meta não ganha o dia por ter energia" (autoverificação) | idem, no outro eixo | idem |
| "num dia cheio nada afrouxou: mega com 6 itens ainda precisa de 6 de energia" | prova que só o caso impossível mudou | idem |
| "a energia exigida NUNCA passa das barras que o estágio tem" | invariante, varrendo os 5 estágios | idem |
| "mega que fecha as **6 tarefas numa sessão só** consegue encher a energia" | a sessão noturna de quem trabalha, às 23h10 | `src/utils/careRules.test.ts` |
| "o teto por hora nunca é menor que o maior requisito diário da escada" | trava a divergência para sempre; a mensagem diz **qual** estágio ficou impossível | idem |
| "o teto continua existindo — a comida seguinte é recusada" (autoverificação) | prova que não virou farm livre | idem |
| "mega com 9 cadastradas que fez 6 vê **6/6**" | a tela de bloqueio parando de cobrar 3 tarefas que o jogo não cobra | `src/hooks/useProgressTracking.test.ts` |
| "quem passou da meta não vira 8/6" | excedente não é dívida nem sobra | idem |
| "o denominador não virou uma constante 6" (autoverificação) | meta pequena continua pequena | idem |
| "sábado de quem só cadastrou seg–sex" | tela não cobra dia que o jogo não cobra | idem |
| "**mesmo progresso com e sem passos**" | quem quebra tarefa em 5 passos não vê o pet `tired` por mais tempo que quem não quebra | idem |
| "atividade em passos só conta quando **todos** os passos fecham" | fim dos 67% de graça por 2 de 3 passos | idem |
| "início do dia: quem quebrou em passos não começa mais fundo no vermelho" | o `0/10` versus `0/6` da queixa | idem |
| "não existe `isDayPerfect` aqui" | a segunda definição não pode voltar pela porta dos fundos | idem |
| "no sábado o modal vê 0 cadastradas e convida a criar" | o modal de evolução dizendo "já tem tarefas suficientes" num sábado vazio | `src/utils/dailyGoal.contract.test.ts` |
| "o hook de progresso pergunta a meta ao dono" | guard de origem estendido: o hook não escrevia a fórmula proibida, ele escrevia **outra coisa** — por isso o guard antigo não pegou o BUG-1 | idem |
| "quem calcula 'cadastradas' no App.tsx passa pelo dono" | lista agora **vazia** e travada + autoverificação nova | idem |

---

## O que mexi em teste antigo (e por quê não é afrouxamento)

1. **`src/utils/careRules.test.ts`, "mesmo recusando, poda os timestamps velhos"** —
   tinha `[1,2,3,4,5]` literal para encher a janela. Com o teto em 6 esse array
   deixaria de encher e o teste passaria **sem exercitar a recusa**, em silêncio.
   Passou a derivar de `FOOD_LIMIT_PER_HOUR`. Mesma asserção, mais forte.

2. **`src/hooks/useProgressTracking.test.ts` — reescrito por inteiro.** Ele
   testava uma **cópia local** (`computeProgress`) da lógica do hook, e afirmava,
   verde, que "1 de 2 passos = 50%" — ou seja, **descrevia o BUG-2 como se fosse
   a regra**, enquanto o hook de verdade não era exercitado por linha nenhuma. É
   o `simulateReset` do footgun 9 dentro do teste. Agora renderiza o hook real
   (`renderHook`, jsdom, `vi.setSystemTime` para fixar o dia da semana). Cobertura
   subiu: 4 asserções de cópia viraram 16 de produção.

3. **`src/utils/dailyGoal.contract.test.ts`, guard de "cadastradas"** — o
   `toEqual([...um uso legítimo...])` virou `toEqual([])`, porque o último
   sobrevivente era justamente o BUG-6. Ganhou autoverificação própria (prova que
   a regex ainda enxerga a fonte crua se ela voltar), senão o `[]` passaria para
   sempre inclusive com o guard quebrado.

---

## O que ficou para o dono decidir

1. **P1–P4 inteiros** (`HEART_GOAL_RATIO = 0,6`, dia de folga automático, alívio
   adaptativo, presets de rotina de 1 toque). Não toquei em nada disso. O
   experimento barato do diagnóstico continua valendo: **mostre a tela já
   consertada a 5 usuários antes de aprovar P1/P2** — é possível que este P0
   sozinho resolva a queixa 3 inteira e boa parte da 1.

2. **Duas linhas do `CLAUDE.md` mudaram** e a mudança é de regra cobrada, não só
   de texto: 🍎 (teto de comida derivado, hoje 6) e ⚡/⭐ (energia do dia perfeito
   contra a meta do dia). O dia perfeito ficou **mais acessível** para quem tem
   meta menor que o requisito — que é exatamente quem não tinha como cumpri-lo.
   Se o dono discordar do BUG-3, é uma linha em `dailyReset.ts:332`.

3. **Texto de UI com o "5" antigo, em território de outro agente** — não toquei em
   `src/components/`:
   - `GuideModal.tsx:99-100` — "até **5** vezes por hora" / "up to 5 times per hour"
   - `HelpModal.tsx:88-89` — "(até **5**/hora)" / "(up to 5/hour)"
   Os quatro são **string à mão**, não constante — a convenção do `CLAUDE.md`
   ("os números saem das CONSTANTES") já estava violada ali antes de mim. O certo
   é interpolar `FOOD_LIMIT_PER_HOUR`. **Hoje o guia mente para o usuário em 1
   unidade.** Precisa do agente de frontend.

4. **`App.tsx:896`** (`announceTaskGains`) chama `dailyGoalFor` sem `dayKey`, e o
   `doneNow` dele também ignora as tarefas já removidas da lista. Consertar só um
   dos dois lados **piora** o toast (mostraria `1/3` para quem fez tudo), então
   deixei o par intacto de propósito. É um item pequeno e isolado, fora do escopo
   dos seis.

5. **Widget: "✨ Dia perfeito!"** agora aparece quando as tarefas fecham a meta,
   mesmo se a energia ainda não fechou — o widget não recebe energia como
   condição. É otimista na direção certa (encorajar, não cobrar) e não afeta
   nenhuma regra, mas é uma pequena imprecisão declarada. Corrigir exigiria
   passar `dayGoalMet && energyFull` ao bridge nativo — ou seja, **APK novo, e só
   o CI valida**. Não fiz.

6. **Nada de Kotlin foi alterado**, então nenhum APK novo é necessário por conta
   deste P0. Se um dia o item 5 for aceito, aí sim entra `android/` e a validação
   é só pelo GitHub Actions.
