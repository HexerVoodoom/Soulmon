# Regras de negócio — todas as regras do jogo, por sistema

> **Dono:** doc-redator-regras · **Data:** 09/09/2026 · **Estado:** rascunho
> **Verificação:** `npx vitest run src/utils src/types src/hooks` — cada sistema abaixo declara a sua régua própria na linha **Régua**. Números medidos trazem o comando na própria linha.
> **Não cobre:** o porquê estratégico e as linhas vermelhas (→ [`01-VISAO.md`](01-VISAO.md)), telas e navegação (→ `03-FLUXO-DE-TELAS.md`), função por função (→ `06-REFERENCIA/`), formato do save (→ `07-DADOS-E-SAVE.md`), infraestrutura de push, deploy e API (→ `08-INTEGRACOES-E-DEPLOY.md`).
> **Precedência:** código > teste > `CLAUDE.md` > este documento. Onde discordarem, o código está certo e este doc tem defeito.

Cada sistema segue a mesma estrutura: **Em uma frase · A regra · Dono · Régua ·
Decisão · Casos de borda · O que NÃO faz · Onde a UI mostra**. Referência de
código é sempre `caminho` + `SÍMBOLO`, nunca `arquivo:linha` — a linha escorrega
no primeiro commit, o símbolo se reencontra por `grep`.

## Índice

**Cuidado e virada do dia**
[1. Corações (HP) e a virada do dia](#coracoes) ·
[2. Carinho](#carinho) ·
[3. Comida](#comida) ·
[4. Onde os tetos moram (`careCaps`)](#tetos) ·
[5. O dia do jogador (`playerDay`)](#dia-do-jogador) ·
[6. Energia](#energia) ·
[7. Dia completo](#dia-completo) ·
[8. Cocô e dreno](#coco) ·
[9. Banho](#banho) ·
[10. Dormir e sono automático](#dormir) ·
[11. Relatório diário](#relatorio-diario) ·
[12. Check-in de humor](#humor) ·
[13. Brincar](#brincar)

**Progressão da criatura**
[14. A escada de estágios](#escada) ·
[15. Atributos e galhos](#atributos) ·
[16. Ritmo de cuidado](#ritmo) ·
[17. Evolução manual e o cadeado](#evolucao) ·
[18. Degeneração e redenção](#degeneracao) ·
[19. Traços de nascimento](#tracos) ·
[20. Renascimento (Rebirth)](#rebirth) ·
[21. O "porquê" do usuário (`soulGoal`/`soulStruggle`)](#soulgoal) ·
[22. O Oráculo, do lado do jogador](#oraculo)

**Motor de tarefas**
[23. Meta ponderada por esforço](#meta-ponderada) ·
[24. Recorrência](#recorrencia) ·
[25. Constância](#constancia) ·
[26. Escudos de descanso](#escudos) ·
[27. Never miss twice](#never-miss-twice) ·
[28. Marcos de hábito](#marcos) ·
[29. Tarefa assombrada](#assombrada) ·
[30. Adiamentos](#adiamentos) ·
[31. Algum dia / Deixar pra lá](#someday) ·
[32. Foco do dia](#foco) ·
[33. Carga do dia](#carga) ·
[34. Arrumar a pilha (triagem)](#triagem) ·
[35. Quick add e sugestões](#quickadd) ·
[36. Equilibrar minha semana](#equilibrar)

**Rituais, descanso e memória**
[37. Check-in](#checkin) ·
[38. Relatório semanal](#relatorio-semanal) ·
[39. Fresh start](#fresh-start) ·
[40. Janela de descanso](#janela-descanso) ·
[41. Sonhos](#sonhos) ·
[42. Pesadelos](#pesadelos) ·
[43. Aventura da noite](#aventura) ·
[44. Passos](#passos) ·
[45. Aniversário e memórias](#aniversario)

**Economia e conteúdo**
[46. As três moedas](#moedas) ·
[47. Loja](#loja) ·
[48. Itens especiais](#itens-especiais) ·
[49. Missões permanentes](#missoes) ·
[50. Missões semanais](#missoes-semanais) ·
[51. Masmorra](#masmorra) ·
[52. Bestiário](#bestiario) ·
[53. Torneio: rodada, faixas e Arena](#torneio) ·
[54. Minijogos: PPT e Dino](#minijogos) ·
[55. Vínculo e o gate de PvP](#vinculo) ·
[56. Comunidade e cooperativo](#comunidade) ·
[57. Estações](#estacoes)

**Transversal**
[58. Notificações como regra](#notificacoes) ·
[59. Divergências com o `CLAUDE.md`](#divergencias)

---

<a id="coracoes"></a>
## 1. ❤️ Corações (HP) e a virada do dia

**Em uma frase.** Uma vez por dia o jogo compara o que a pessoa fez com a meta
dela e, se faltou muito, tira **no máximo um coração** — e há cinco mecanismos
que podem impedir até isso.

**A regra.** Na virada (`computeDailyReset`), julgando o dia de ONTEM:

```
heartGoal   = heartGoalFromDailyGoal(dailyGoalFor(...))
            = dailyGoal <= 0 ? 0 : max(1, ceil(dailyGoal × HEART_GOAL_RATIO))
rawLost     = rawHeartsLostFor(dailyDone, heartGoal, maxHealthPoints)
            = floor((1 − min(1, dailyDone/heartGoal)) × maxHealthPoints)
lossCap     = heartLossCap(petPassive, MAX_HEARTS_LOST_PER_DAY)
perdido     = forgivesHP ? 0 : min(rawLost, lossCap)
```

Constantes, todas em `src/utils/dailyReset.ts` salvo indicação:

| Constante | Valor | O que faz |
|---|---|---|
| `MAX_HEARTS_LOST_PER_DAY` | 1 | teto de perda por virada. *Um dia ruim é um sinal, não uma sentença.* |
| `HEART_GOAL_RATIO` | 0,6 | a meta que PROTEGE O CORAÇÃO é 60% da meta do dia (P1) |
| `ABSENCE_FORGIVENESS_DAYS` | 2 | ausência ≥ 2 dias → a virada não cobra nada |
| `RETURN_GRACE_DAYS` | 2 | viradas de rampa DEPOIS do retorno que ainda não cobram |
| `NEW_SAVE_GRACE_DAYS` | 3 | primeiras viradas de vida do save não cobram |
| `REST_DAYS_PER_WEEK` | 1 | a folga semanal, automática e retroativa |
| `WEEKLY_RELIEF_HEARTS` | 0,5 | devolvidos na virada de domingo→segunda |
| `heartLossCap` (`src/utils/passives.ts`) | metade com o traço **Teimoso** | teto individual |

**As duas réguas (P1, 07/09/2026).** A meta que protege o coração
(`heartGoalFor`) é MENOR que a meta do dia completo (`dailyGoalFor`, ver
[§7](#dia-completo)). Em número: um mega com meta 6 precisava de 5 itens para
não perder coração e passa a precisar de 4; um rookie com meta 4 continua em 3
(o piso `max(1, …)` e o `ceil` impedem que o alívio vire "não precisa fazer
nada"). **A excelência não foi afrouxada** — `dayWasPerfect` não chama
`heartGoalFor`.

**A folga da semana (P2).** `REST_DAYS_PER_WEEK = 1`, **gasta sozinha, na
virada, sobre um dia que já terminou**. A ordem no código é gastar primeiro,
recarregar depois (`restWeekKeyFor(yesterday)` × `restWeekKeyFor(now)`) — o
contrário daria duas folgas na segunda-feira. Sem acúmulo. `restWeekKeyFor` usa
aritmética de CALENDÁRIO e não de milissegundos, porque `getTime() − n×86400000`
cai no domingo anterior na virada do horário de verão (verificado em
America/New_York, Europe/London, Australia/Sydney, America/Santiago).

**O alívio de segunda.** `WEEKLY_RELIEF_HEARTS` só é aplicado se `newHP > 0` —
a regra pula quem está em zero de propósito, para não ressuscitar ninguém — e o
relatório anuncia `weeklyRelief` só quando o HP **de fato** subiu
(`weeklyReliefApplied`), nunca "hoje é segunda".

**Dono.** `src/utils/dailyReset.ts` → `computeDailyReset`, com as fórmulas
isoladas em `heartGoalFromDailyGoal`, `rawHeartsLostFor` e `tasksToAvoidHeartLoss`.
O hook `src/hooks/useDailyReset.ts` só AGENDA o check (a cada 30 s) e chama a
função pura.

**Régua.** `src/hooks/useDailyReset.test.ts`, `src/hooks/useDailyReset.rollover.test.ts`,
`src/hooks/useDailyReset.clock.test.ts`, `src/utils/heartGoal.test.ts`,
`src/utils/restDay.test.ts`, `src/utils/welcomeBack.test.ts`,
`src/utils/dailyGoalSources.test.ts`, `src/utils/degeneracao.cenarios.test.ts`.

**Decisão.** [`docs/PLANO-EVOLUCAO.md`](../PLANO-EVOLUCAO.md) Fase 1.1 (o teto);
`product/soulmon-01/balance/carga-diaria.md` P1 (as duas réguas) e P2 (a folga);
[`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.1 (falha e perdão).

**Casos de borda.**
- **Save novo indistinguível de veterano**: `saveDaysLived` lê
  `lastDayReport.saveDay`; sem ele, `looksLikeVeteranSave` decide, e **na dúvida
  é veterano** (a direção segura é a que NÃO dá carência a quem não precisa).
- **`restDaysLeft` inflado** por save editado: limitado ao teto **na leitura**,
  não só na recarga — senão viraria imunidade permanente a perda de coração.
- **Piso da raiz**: um rookie em HP 0 não tem forma abaixo. Nesse caso o HP volta
  para **1** (`pisoDaRaizAbsorveu`) e o relatório informa
  `heartsLost = max(0, healthPoints − 1)` — antes anunciava "1 coração em
  recuperação" todas as noites, para sempre, ao jogador mais frágil do jogo.
- **Virada dupla** (StrictMode, aba reaberta): a função é PURA e o laço de ritmo
  é idempotente por `dayKey`.
- **`tasksToAvoidHeartLoss`** procura o número **pela própria fórmula da perda**,
  em laço, e não por álgebra fechada: em ultra (meta 5, `maxHP` 5) com 4 feitas,
  `(1 − 4/5) × 5` vale 0,9999999999999998 em ponto flutuante e a perda é ZERO,
  enquanto a álgebra exigiria 5.

**O que NÃO faz.** Não zera nada. Não tira `perfectDays` num dia ruim. Não cobra
duas vezes pelo mesmo dia (a falta de hábito NÃO gera perda de HP própria — ver
[§25](#constancia)). Não cobra de quem sumiu. Não deixa o teto ser furado por
tick, por aparelho nem por fuso.

**Onde a UI mostra.** `src/components/CompanionHUD.tsx` (a barra de corações),
`src/components/DailyReportModal.tsx` (o que aconteceu na virada), e o card de
1 coração da Home — que usa `tasksToAvoidHeartLoss`, não `ceil(required/2)`.

---

<a id="carinho"></a>
## 2. 🫶 Carinho

**Em uma frase.** Esfregar o pet cura HP — meio coração por gesto, no máximo um
por dia — e é a cura principal do jogo.

**A regra.** `RUB_HEAL_STEP = 0.5`, `RUB_HEAL_DAILY_CAP = 1`
(`src/utils/careRules.ts`). O teto do dia é `rubDailyCap(petPassive, RUB_HEAL_DAILY_CAP)`
— **1,5 com o traço Carinhoso** (`src/utils/passives.ts`). Recusas
(`RubRefusal`): `'already-full'` (HP cheio) e `'daily-cap'`.

O gesto é um *pointer drag* sobre o pet; **a animação de explosão de corações
toca sempre**, inclusive quando a cura é recusada — quem decide isso é o
`App.tsx`, não a regra.

**Dono.** `src/utils/careRules.ts` → `rubHeal`, `rubRefusal`, `rubHealRecordFor`.
O updater que roda dentro do `setGameState` é `src/utils/careUpdaters.ts` →
`applyRub`; a decisão de recusar (que dispara fala) é `rubDecision`, **fora** do
updater.

**Régua.** `src/utils/careRules.test.ts`, `src/utils/careUpdaters.test.ts`,
`src/utils/careCaps.fuso.test.ts`, `src/utils/x6Updaters.contract.test.ts`.

**Decisão.** `CLAUDE.md`, tabela de regras (🫶); achados **X-4** e **X-6** do
gate da fatia 2 do run `soulmon-02`.

**Casos de borda.**
- `rubHealRecordFor` é **ordem-consciente**, não igualdade cega: só um dia
  **estritamente anterior** zera o registro. Um registro de hoje ou de um dia à
  frente (aparelho adiantado) continua valendo, e é devolvido **intacto, com a
  data dele** — reescrever para `todayKey` faria o registro andar para trás na
  gravação e ressuscitaria o pingue-pongue pelo caminho da escrita (medido: 5
  repiques alternados devolviam o teto 2×).
- Data ilegível (save adulterado): mantém o gasto e adota a chave de hoje, para
  o registro se normalizar sozinho.
- **Dois toques no mesmo lote do React**: `applyRub` reconfere o teto sobre o
  `prev`, e o `petPassive` vem do ESTADO, nunca de parâmetro que quem chama
  possa esquecer — foi exatamente assim que o traço Carinhoso ficou desligado
  na prática (achado X-6).

**O que NÃO faz.** Não é ilimitado. Não passa pelo teto de comida. Não cura
quando o HP está cheio (o gesto vira só animação).

**Onde a UI mostra.** `src/components/CompanionHUD.tsx` (o gesto e a explosão de
corações).

---

<a id="comida"></a>
## 3. 🍎 Comida

**Em uma frase.** Comer enche energia e dá pontos de atributo — nunca cura HP —
e há um teto por hora, não por dia.

**A regra.** `FOOD_LIMIT_PER_HOUR = MAX_STAGE_REQUIREMENT`
(`src/utils/careRules.ts`), **derivado** do maior `required` de
`FORM_REQUIREMENTS` (`src/types/progression.ts`) — hoje **6**. Janela
DESLIZANTE de 1 h sobre timestamps (`recentFeeds`), não contador diário.

Uma comida comum (`FOOD_BY_CATEGORY`, `src/constants/labels.ts`):
- `energyPoints = min(getMaxEnergyForStage(stage), energy + 1)`;
- soma `CATEGORY_ATTRIBUTES[categoria]` em `virusPoints`/`dataPoints`/`vaccinePoints`
  **e** em `attributesSinceLastEvolution`;
- `totalXP += (soma dos atributos) × 10`;
- com o traço **Guloso**, `+GULOSO_BONUS_ATTR` (1) no atributo que a comida já
  favorece (empate vai para `data`).

Recusas (`FeedRefusal`): `'no-stock'`, `'hourly-limit'`. A recusa por teto é
"o pet fala que está cheio" — **sem toast**.

Comida se ganha **concluindo atividade**: `foodForCompletedTask` entrega +1
comida da categoria da tarefa. Os atributos NÃO vêm de concluir; vêm de
alimentar.

**Por que o teto é derivado.** Era o literal `5` enquanto mega/ultra pedem 6
tarefas. Como energia só enche comendo e energia cheia é condição do dia
completo, quem fechava as 6 numa sessão só dava 5 comidas e **perdia o dia
completo tendo feito 100% da própria meta** — punido por ritmo, não por esforço.

**Dono.** `src/utils/careRules.ts` → `feedFood`, `recentFeeds`, `feedsLeft`;
updater em `src/utils/careUpdaters.ts` → `applyFeed`.

**Régua.** `src/utils/careRules.test.ts` (inclui guard de que o teto acompanha a
escada), `src/utils/careUpdaters.test.ts`, `src/utils/careCaps.test.ts`.

**Decisão.** `CLAUDE.md`, tabela (🍎); a derivação está justificada no docstring
de `MAX_STAGE_REQUIREMENT`.

**Casos de borda.**
- Recusando por teto, `feedFood` **devolve `recent` já podado** — senão
  timestamps velhos acumulariam para sempre.
- A janela vem do `prev` dentro de `applyFeed`: dois toques no mesmo lote do
  React veriam o mesmo estado e o segundo furaria o teto.
- Estoque zerado remove a chave do `foodInventory` (`delete`), em vez de deixar
  um `0`.

**O que NÃO faz.** **Não cura HP.** Não conta chips, coraçãozinhos nem
Glitchtama no limite (itens especiais têm caminho próprio — [§48](#itens-especiais)).
Não tem teto diário.

**Onde a UI mostra.** `src/components/ItemsWindow.tsx` (a pastinha),
`src/components/CompanionHUD.tsx` (a animação de comer),
`src/components/EnergyBar.tsx`.

---

<a id="tetos"></a>
## 4. 🧮 Onde os tetos moram (`careCaps`)

**Em uma frase.** Os dois contadores de teto de cuidado moram **no save**, não no
`localStorage` do aparelho — porque um teto que se fura trocando de aparelho não
é um teto.

**A regra.** `careCaps` no `GameState` guarda `feedTimes` (timestamps ms da
janela de 1 h) e `rubHeal` (`{date, healed}`). O módulo **não redeclara nenhuma
constante de teto e não reimplementa a janela** — ele só decide a PROCEDÊNCIA do
estado que as regras de `careRules.ts` recebem por parâmetro.

Higienização (`hydrateCareCaps`, `sanitizeFeedTimes`): aceita só número finito
**e não posterior a `now`**. As duas metades vêm do mesmo defeito (achado
**X-5**): um `NaN` passaria pelo filtro de 1 h para sempre, e um timestamp NO
FUTURO também, porque `now − t < HOUR_MS` é verdadeiro para todo `t` futuro.

Migração (`mergeCareCaps`) é **idempotente** de propósito, porque roda no save
local **e** de novo quando a nuvem é adotada:
- `feedTimes` → **união com deduplicação** (eventos identificáveis);
- `rubHeal` → **`max`** dos dois lados quando a data é a mesma; datas
  diferentes, manda a MAIS RECENTE, não "o save por ser save"; data ilegível
  perde para a legível.

**Por que existe (D-33).** Enquanto os dois contadores moravam no aparelho, o
mesmo jogador com PWA **e** APK tinha DOIS tetos: **2 corações/dia e 12
comidas/hora** em vez de 1 e 6.

**Dono.** `src/utils/careCaps.ts` → `hydrateCareCaps`, `mergeCareCaps`,
`feedTimesFor`, `rubHealFor`.

**Régua.** `src/utils/careCaps.test.ts`, `src/utils/careCaps.fuso.test.ts` (há
teste travando que o arquivo não redeclare constante de teto).

**Decisão.** `squad-alpha-runs/soulmon-02/builder/tetos-cuidado-no-save.md`
(fora do git), resumida no `CLAUDE.md`, linha 🧮.

**Casos de borda.** Aparelho com relógio adiantado: registros dele continuam
`t <= now` no próprio aparelho, então nada é perdido lá; o que o filtro impede é
que 6 comidas gravadas com relógio 3 h adiantado **viajem para a nuvem** e
travem a comida do aparelho de relógio certo por até 4 h, sem explicação
nenhuma na tela.

**O que NÃO faz.** ⚠️ **Não fecha o caso de dois aparelhos escrevendo o save em
PARALELO** — isso depende de save na nuvem confiável; o último a gravar vence, e
quem vence não está decidido. Não poda a janela (a poda é de `recentFeeds`).

**Onde a UI mostra.** Em lugar nenhum diretamente — o efeito aparece como recusa
de carinho ou de comida.

---

<a id="dia-do-jogador"></a>
## 5. 📅 O dia do jogador (`playerDay`)

**Em uma frase.** Todo registro DIÁRIO que mora no save é nomeado num fuso
**fixo gravado no save**, e nunca pelo relógio do aparelho.

**A regra.** `playerDayKey(now, anchor)` devolve uma string com a MESMA FORMA de
`toDateString()` ("Wed Aug 26 2026"). A âncora é `playerDayTz` no `GameState`
(`PlayerDayAnchor`): `zone` (identificador IANA, que sabe de horário de verão,
colhido no onboarding) é a fonte preferida; `offsetMs` é o fallback. Sem âncora,
o resultado é **byte a byte igual** a `toDateString()` — é isso que torna a
migração invisível para quem está no fuso de casa.

**As sete famílias de registro que usam esta chave** (a lista viva é o cabeçalho
de `src/utils/playerDay.ts`, e a régua VIVA é o guard de AST):

| Registro | Símbolo |
|---|---|
| teto de carinho | `careCaps.rubHeal.date` |
| check-in | `lastCheckInDate` |
| humor | `moodLog[].date` |
| dreno de cocô | `poopDrainCharge.day` |
| brincar | `playLog.date` |
| a manhã do descanso | `rest.nights[].date` |
| pesadelo | `nightmares.fought[]` |

**A comida NÃO entra**, e a exceção é instrutiva: `careCaps.feedTimes` é uma
janela deslizante de timestamps — um instante em ms é o mesmo instante nos dois
aparelhos, e não tem nome de dia para discordar.

**Dono.** `src/utils/playerDay.ts` → `playerDayKey`, `anchorOffsetMs`,
`sanitizePlayerDayAnchor`, `resolvePlayerDayAnchor`.

**Régua.** `src/utils/playerDay.test.ts` e, sobretudo,
`src/utils/playerDay.contract.test.ts` — guard de **AST** que pergunta, no ponto
de uso, quem produz a chave de dia.

**Decisão.** Achado **X-4**, resíduo documentado no cabeçalho do módulo.

**Casos de borda.** Quem está FORA do fuso de casa no primeiro load pode ver a
chave saltar de um dia para outro **uma única vez**; o pior caso é UM teto extra
concedido de graça, uma vez. Forçar zero pediria carimbar o instante em cada
registro e migrar todos os sete campos.

**O que NÃO faz.** ⚠️ **Não toca em `dayKeyOf`** (`src/utils/habitRhythm.ts`) e
não pode passar a tocar: aquela é a chave do motor de hábitos, de `perfectDays`,
da streak e do gatilho de virada — redefini-la mudaria o significado de strings
JÁ GRAVADAS em todo save e dispararia uma virada espúria em cada um. Também
**não usa UTC puro**: em fuso negativo o dia UTC vira à tarde, e o teto de
carinho zeraria às 21 h.

**Onde a UI mostra.** Nenhuma tela mostra a chave; ela decide o "hoje" de todas
as sete famílias acima.

---

<a id="energia"></a>
## 6. ⚡ Energia

**Em uma frase.** A energia só enche comendo, zera todo dia, e o número de
barras é o requisito de tarefas do estágio.

**A regra.** `getMaxEnergyForStage(stage) = FORM_REQUIREMENTS[nível].required`
(`src/types/progression.ts`) — rookie 4, champion 5, ultimate 5, mega 6, ultra 6.
`computeDailyReset` grava `energyPoints: 0` em toda virada.

**Condição do dia completo**: `energyPoints >= dailyGoalFor`, e **não** o
requisito cru do estágio. Comida vem de concluir tarefa, então num dia de meta 2
a energia MÁXIMA alcançável é 2 — cobrar 6 ali negava o dia completo a quem fez
100% da própria meta. **As barras exibidas continuam sendo o requisito.**

**Dono.** `src/types/progression.ts` → `getMaxEnergyForStage`;
`src/utils/dailyReset.ts` → `computeDailyReset` (o zeramento e a comparação).

**Régua.** `src/types/progression.test.ts`, `src/hooks/useDailyReset.test.ts`,
`src/components/p5DiaCompleto.contract.test.ts`.

**Decisão.** `CLAUDE.md`, tabela (⚡); o comentário de `energyWasFull` em
`computeDailyReset` traz a conta.

**Casos de borda.** Brincar consome `PLAY_ENERGY_COST` = 1 ([§13](#brincar)) —
e é por isso que o custo é 1, e não mais: cobrar caro faria brincar competir com
o dia completo.

**O que NÃO faz.** Não enche com o tempo. Não enche com chip (chip dá só
atributo). Não é gasta por nada além de brincar.

**Onde a UI mostra.** `src/components/EnergyBar.tsx`.

---

<a id="dia-completo"></a>
## 7. ⭐ Dia completo

**Em uma frase.** Fez o peso da própria meta, tinha pelo menos uma coisa
cadastrada e a energia chegou na meta → +1 ponto de evolução.

**A regra.** Em `computeDailyReset`:

```
dayWasPerfect = totalTasks > 0
             && dailyDone >= dailyGoal
             && energyPoints >= dailyGoal
```

**A MESMA meta nos dois eixos, e a meta INTEIRA** — não a de coração. Quando
verdadeiro: `perfectDays++` e `totalPerfectDays++` (o vitalício das missões, que
**nunca zera ao evoluir**).

**O nome mudou em 07/09/2026 (P5), o mecanismo não.** Os textos PT/EN dizem "dia
completo"/"complete day"; os símbolos `perfectDays`, `wasPerfect` e
`dayWasPerfect` continuam com o nome que têm no código. O motivo é de tom:
como o contador nunca decresce, "perfeito" é a palavra que transforma um dia bom
em fracasso para quem tem traço perfeccionista.

**Dono.** `src/utils/dailyReset.ts` → `computeDailyReset` (`dayWasPerfect`).

**Régua.** `src/hooks/useDailyReset.test.ts`,
`src/components/p5DiaCompleto.contract.test.ts` (o NOME nos textos),
`src/utils/dailyGoal.contract.test.ts`.

**Decisão.** `product/soulmon-01/balance/carga-diaria.md` P5 (o nome) e P1 (a
separação das duas metas).

**Casos de borda.**
- `dailyDone` soma tarefas ainda marcadas em `tasks` (a janela de 3 s entre o
  clique e a saída da lista) **mais** `tasksCompletedOn` (as que já migraram
  para `completedTasks`). Contar só `prev.tasks` fazia quem fez TUDO cair em
  `totalTasks === 0` e a virada NEGAR o dia completo — com a barra da tela em
  100%.
- Item **🌀 Glitchtama** dá +1 `perfectDays` ao ser usado, **no máximo 1 por dia
  do jogador** (`GLITCHTAMA_PER_DAY`) — ver [§48](#itens-especiais).
- A **folga da semana não vira dia completo**: não ganha, não perde.

**O que NÃO faz.** Dia não-completo **não tira** `perfectDays`. Não conta itens
— conta PESO DE ESFORÇO ([§23](#meta-ponderada)).

**Onde a UI mostra.** `src/components/DailyReportModal.tsx`,
`src/components/EvolutionPath.tsx` (a barra de dias até a evolução),
`src/components/EvoTrail.tsx` na Home.

---

<a id="coco"></a>
## 8. 💩 Cocô e dreno

**Em uma frase.** Até dois cocôs por dia; não limpar custa um coração a cada 6 h,
respeitando exatamente as mesmas travas da virada do dia.

**A regra — agendamento** (`src/hooks/useCareSystem.ts`): o primeiro cocô do dia
é sorteado entre `earliestPoopHour(petPassive, 7)` e 15 h — **10 h com o traço
Madrugador**. O segundo é agendado **8 a 10 h depois de o primeiro APARECER**,
não de ser agendado. Polling de 10 s. Nunca aparece dormindo.

**A regra — dreno** (`src/utils/poopDrain.ts` → `applyPoopDrain`):

| Constante | Valor |
|---|---|
| `POOP_DRAIN_PERIOD_MS` | 6 h |
| `POOP_DRAIN_HEARTS_PER_PERIOD` | 1 |
| `SLEEP_CLOCK_BUMP_MS` | 5 min (throttle de persistência dormindo) |

O teto é **diário e persistido** em `poopDrainCharge {day, hearts}`, com `day` no
**dia do jogador** — **nunca por tick**: sem isso, quatro ticks de 6 h custariam
4 corações, cada um "dentro do teto". As três travas que ele respeita:
`MAX_HEARTS_LOST_PER_DAY`, `heartLossCap` (Teimoso) e
`ABSENCE_FORGIVENESS_DAYS`.

O relógio é **sempre reancorado em `now`** quando cobra: o resto dos períodos é
PERDOADO, não guardado para o próximo tick.

**Dono.** `src/utils/poopDrain.ts` → `applyPoopDrain`, `chargedToday`,
`remainingDrainToday`. Função PURA; o `App.tsx` só delega.

**Régua.** `src/utils/poopDrain.regression.test.ts`,
`src/utils/poopDrain.cleanPoop.test.ts`.

**Decisão.** `squad-alpha-runs/soulmon-01/discovery/verificacao-V1.md`, decisão
**D-09**. A auditoria de 25/08/2026 achou o `App.tsx` subtraindo `periods` cru e
drenando **o HP inteiro do pet**, escapando das três travas.

**Casos de borda.**
- Dormindo: o relógio é só empurrado, com throttle de 5 min para não virar spam
  de cloud save a noite inteira.
- Ausência ≥ `ABSENCE_FORGIVENESS_DAYS`: o relógio é reancorado, e não
  acumulado — senão a passagem seguinte cobraria a ausência que acabou de ser
  perdoada.
- A notificação de ~30 min antes só sai **se o tick for cobrar**
  (`remainingDrainToday`): avisar de um tick que não vai cobrar nada é assustar
  de graça.

**O que NÃO faz.** ⚠️ **O dreno NÃO respeita a folga da semana**, e isso é
decisão do dono (08/09/2026): ele cobra presença com descuido — só tira coração
de quem abriu o app, viu o cocô e não deu banho —, enquanto a folga existe para
perdoar AUSÊNCIA. Se isso mudar, mudar os DOIS docstrings (`REST_DAYS_PER_WEEK`
e o cabeçalho de `poopDrain.ts`).
⚰️ **Não existe isenção por estágio** ("ovo/baby isentos" é resíduo de uma árvore
que não existe mais); não reintroduza a isenção achando que ela já existia.
Não faça aritmética de HP no `App.tsx` (footgun 9).

**Onde a UI mostra.** `src/components/CareSystem.tsx`,
`src/components/CompanionHUD.tsx`.

---

<a id="banho"></a>
## 9. 🚿 Banho

**Em uma frase.** Sempre disponível; limpa o cocô e **para o relógio de 6 h**.

**A regra.** `cleanPoop(state, { at? })` tem DUAS formas, e não são um `if` de
conveniência:
- **com `at`** — o banho do CELULAR: `careEvent.requestTime` sabe o HORÁRIO
  agendado do cocô que está na tela, não o índice; achar o índice é regra.
- **sem `at`** — o banho do OVERLAY de desktop: ele não tem `careEvent` e não
  sabe qual cocô está na tela. Para o dreno existe só "tem sujeira" e "não tem";
  um banho que limpasse só um deixaria o relógio correndo com o pet
  visivelmente limpo.

O relógio SEMPRE para (`poopPenaltyClockAt: 0`), mesmo quando sobra cocô sujo;
quem decide se ele volta a correr é `applyPoopDrain` na passagem seguinte.

Recusas (`CleanPoopRefusal`): `'not-scheduled'` (a virada limpou a agenda no meio
do evento) e `'already-clean'`. **Nunca é erro** — é "não havia o que fazer".

**Dono.** `src/utils/poopDrain.ts` → `cleanPoop`. Mora ali, e não em arquivo
próprio, porque limpar é escrever exatamente as três coisas que `applyPoopDrain`
lê para decidir se cobra.

**Régua.** `src/utils/poopDrain.cleanPoop.test.ts`,
`desktop/renderer/src/care.banhoSono.parity.test.ts`.

**Decisão.** Commit `86341fcb` — até 26/08/2026 o banho do overlay **não escrevia
no save**, e o jogador via o pet perder coração apertando o botão que existe
para impedir isso.

**Casos de borda.** Guarda contra `indexOf` = −1.

**O que NÃO faz.** Não cura HP. Não tem custo, cooldown nem limite diário.

**Onde a UI mostra.** `src/components/CareSystem.tsx`, e a ação 🚿 no
`src/components/CompanionHUD.tsx`.

---

<a id="dormir"></a>
## 10. 💤 Dormir e sono automático

**Em uma frase.** Um toggle manual persistido, mais um sono automático opcional
por janela de horário — e dormindo não há cocô nem dreno.

**A regra.** O toggle é estado do save. O sono automático é configurado nas
Configurações e **age só nas transições** (entrar e sair da janela), nunca a cada
tick — senão reabrir o app dentro da janela reimporia o sono que a pessoa
acabou de desfazer.

Dormindo: `useCareSystem` não agenda cocô, e `applyPoopDrain` só empurra o
relógio (com throttle `SLEEP_CLOCK_BUMP_MS`).

Pôr o pet para dormir é também a **única entrada** da Janela de Descanso
([§40](#janela-descanso)) — `recordNight` é chamado a partir desse gesto. Não há
sensor nenhum.

**Dono.** `src/App.tsx` (o handler e o efeito de transição);
`src/utils/poopDrain.ts` (o efeito sobre o dreno);
`src/utils/restWindow.ts` → `recordNight` (o registro da noite).

**Régua.** `src/utils/poopDrain.regression.test.ts`,
`src/utils/restWindow.test.ts`, `src/utils/noiteFuso.test.ts`,
`desktop/renderer/src/care.banhoSono.parity.test.ts`.

**Decisão.** `CLAUDE.md`, tabela (💤); a regra de "sem sensor" é do
[`PLANO-TAREFAS.md`](../PLANO-TAREFAS.md), Parte 3.

**Casos de borda.** O throttle de 5 min existe porque qualquer efeito que grave
estado em timer vira spam de cloud save (debounce de 3 s no
`GameStateContext`).

**O que NÃO faz.** Não mede duração de sono. Não pontua. Não notifica durante a
noite — o único push desta mecânica é o de DEITAR ([§58](#notificacoes)).

**Onde a UI mostra.** `src/components/CompanionHUD.tsx` (a ação 💤),
`src/components/SettingsPage.tsx` (a janela do sono automático),
`src/components/RestWindowCard.tsx`.
