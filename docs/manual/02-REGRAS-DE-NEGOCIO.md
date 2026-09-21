# Regras de negócio — todas as regras do jogo, por sistema

> **Dono:** doc-redator-regras · **Data:** 21/09/2026 · **Estado:** verificado em 21/09/2026 por doc-verificador (§58-A e §59 D32–D33, delta `5ac3d351..8d318529`, som/S16 + chaves na `SettingsPage`; verificação anterior do mesmo dia: só as seções do delta `dc72579e..9875477b` — §2, §3, §8, §10, §12, §45, §48, §59 D31; verificação anterior: 21/09/2026, seções do delta `2580b73a..dc72579e` — §22, §28, §41, §43, §46, §57-A, §57-B, §59 D28–D30; doc inteiro: 10/09/2026, em duas metades)
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
[57. Estações](#estacoes) ·
[57-A. Conquistas (emblemas de arte)](#conquistas) ·
[57-B. Mapas de arte que carregam regra](#mapas-de-arte)

**Transversal**
[58. Notificações como regra](#notificacoes) ·
[58-A. Som como regra: o que toca, de onde vem, e o que fica mudo](#som) ·
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
corações). A fala do teto diário (`rubDecision === 'daily-cap'`) é o `kind`
`healCap` de `PET_VOICE_LINES` (`src/utils/petVoice.ts`) desde `a2ded861`
(21/09/2026) — ⚰️ o array inline do `CompanionHUD` ("já sarei o que dava por
hoje!") saiu; a segunda oração da fala nova diz que o carinho continua valendo
como contato, porque sem ela o teto lê como "pare". Régua da fala:
`src/utils/petVoice.test.ts`.

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
"o pet fala que está cheio" — **sem toast**. A fala é o `kind` `full` de
`PET_VOICE_LINES` (`src/utils/petVoice.ts`) desde `a2ded861` (21/09/2026) — ⚰️
o inline do `CompanionHUD` ("Não aguento mais! Volta mais tarde.") saiu, porque
"volta mais tarde" é instrução de retorno; a criatura fala do corpo DELA, nunca
"você já alimentou demais" (há teste varrendo `volta mais tarde`/`você já` em
`src/utils/petVoice.test.ts`).

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
`src/components/pixel/HomeHud.tsx` (a barra segmentada de energia; ⚰️ o
`EnergyBar.tsx` foi apagado em 07/09/2026, sem uma única referência viva).

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

**Onde a UI mostra.** `src/components/pixel/HomeHud.tsx` — a barra segmentada,
montada de dentro do `src/components/CompanionHUD.tsx`. ⚰️ O `EnergyBar.tsx`
foi apagado em 07/09/2026 (zero referências vivas).

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
`src/components/CompanionHUD.tsx`. Desde `a2ded861` (21/09/2026) a chegada do
cocô tem VOZ: `src/App.tsx` chama `falar('residue')` (`kind` `residue` de
`PET_VOICE_LINES`, `src/utils/petVoice.ts`) só na **chegada** do
`careEvent.type === 'poop'` (ref `borraAnteriorRef`), constatando e apontando —
zero vergonha, zero nojo, zero pedido. **O dreno cobrando HP segue mudo de
propósito**: a criatura anunciando o próprio dano é a família de `'HP baixo...'`
que saiu em 06/09/2026. Régua: `src/utils/petVoice.test.ts` (varre
`sujo`/`nojo`/`vergonha`/`me limpa`/`por sua causa`).

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
`src/components/RestWindowCard.tsx`. Desde `a2ded861` (21/09/2026) dormir e
acordar deixaram de ser gestos MUDOS: `src/App.tsx` chama
`falar(isSleeping ? 'wake' : 'sleep')` dentro de `handleSleep` — o toggle MANUAL, fora do updater; o sono automático segue calado (`kind`s
`sleep`/`wake` de `PET_VOICE_LINES`, `src/utils/petVoice.ts`). Regra da fala de
manhã, e ela é a mesma da Janela de Descanso ([§40](#janela-descanso), veto
#12): **nenhuma frase comenta a noite de quem lê** — "dormiu bem?" é como se
fabrica ortossonia; ela fala do corpo dela e da Malha. Régua:
`src/utils/petVoice.test.ts` (varre `dormiu`/`descans`/`boa noite`/`sleep
well`/`good night`/`did you sleep`).

---

<a id="relatorio-diario"></a>
## 11. 📊 Relatório diário

**Em uma frase.** Uma vez por dia o app conta o que aconteceu na virada — e
oferece a única forma de desfazer a cobrança dela.

**A regra.** `computeDailyReset` escreve `lastDayReport` no GameState, no mesmo
updater em que aplica a virada. O objeto é fechado e cada campo tem um leitor:

| Campo | O que carrega |
|---|---|
| `date` | o dia julgado (ontem), no formato de `toDateString()` |
| `done` / `total` / `required` | peso feito, peso cadastrado e `dailyGoalFor` ([§23](#meta-ponderada)) |
| `heartsLost` | o que o coração **de fato** perdeu (ver casos de borda) |
| `wasPerfect` / `perfectDays` | o dia completo ([§7](#dia-completo)) e o contador depois dele |
| `energyWasFull` | a energia alcançou a meta ([§6](#energia)) |
| `degenerated` | a queda de estágio aconteceu nesta virada ([§18](#degeneracao)) |
| `welcomeBack` / `daysAway` | o retorno depois de `ABSENCE_FORGIVENESS_DAYS` |
| `weeklyRelief` | `WEEKLY_RELIEF_HEARTS` foi mesmo devolvido |
| `restDayUsed` / `restDaysLeft` | a folga da semana ([§1](#coracoes)) |
| `shieldsSpent` | escudos de descanso consumidos ([§26](#escudos)) |
| `forgiven` | esta virada não cobrou HP por carência |
| `saveDay` / `returnGraceLeft` | o relógio das carências — **não é para a UI** |
| `heartsRecovered` | escrito depois, pelo `App.tsx`, quando o jogador recupera |

**Mostrado UMA vez por `date`.** O efeito do `App.tsx` abre o modal quando
`readLocal(STORAGE_KEYS.DAILY_REPORT_SHOWN) !== report.date`; a chave
(`'soulmon-daily-report-shown'`, `src/utils/storageKeys.ts`) é gravada no
**fechar** (`handleCloseDailyReport`, `{ silent: true }`) — no pior caso o
relatório reabre, que é o modo de falha barato. Na fila de intersticiais ele é
o **segundo**: `triage → dailyReport → checkIn → dream → nightmare → welcome`
(`const interstitial` no `App.tsx`).

**"Eu fiz, só esqueci de marcar."** `handleRecoverHearts` devolve exatamente
`report.heartsLost` ao HP, limitado a `maxHealthPoints`, e marca
`heartsRecovered`. **Não devolve o dia completo** — é o retro-tracking do
Pokémon Sleep: recupera o dano, não a glória. Dá para usar isso para nunca
perder coração, e é deliberado (o comentário do handler diz: num app pessoal
quem mente engana a si mesmo, e o atrito de um antifraude custaria mais aos
honestos).

**O que o modal monta em volta.** O check-in de humor ([§12](#humor)), a
aventura da noite ([§43](#aventura)), as memórias ([§45](#aniversario)) e, em
`showOffer`, o convite de compra. Nenhum deles paga Bits.

**Dono.** `src/utils/dailyReset.ts` → `computeDailyReset` (escreve);
`src/App.tsx` (a trava de exibição, `handleRecoverHearts`, `handleCloseDailyReport`);
`src/components/DailyReportModal.tsx` (o texto e o tom).

**Régua.** `src/hooks/useDailyReset.test.ts`,
`src/hooks/useDailyReset.clock.test.ts`, `src/utils/restDay.test.ts`,
`src/utils/degeneracao.cenarios.test.ts`,
`src/components/DailyReportModal.aventura.render.test.tsx`,
`src/contexts/GameStateContext.hydrate.fuzz.test.tsx`.

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.1
("a folga é ANUNCIADA, ao contrário do escudo") e §5.6 (aventura sem
recompensa material, 08/09/2026).

**Casos de borda.**
- **O `date` é o dia do APARELHO**, não o dia do jogador: `yesterdayString` sai
  de `toDateString()` sobre `now − 1 dia`, a mesma régua de `rolloverPendingFor`
  e de `dayKeyOf` (`src/utils/habitRhythm.ts`). É de propósito — a chave de
  exibição tem de casar com a chave que disparou a virada, e não com
  `playerDayKey` ([§5](#dia-do-jogador)).
- **`heartsLost` ≠ perda bruta no piso da raiz**: quando `pisoDaRaizAbsorveu`
  devolveu o HP para 1, o relatório anuncia `max(0, healthPoints − 1)`. Antes
  anunciava "1 coração em recuperação" toda noite ao rookie parado em HP 1 — e
  ainda oferecia o botão de recuperar corações que não foram perdidos.
- **`weeklyRelief` só quando o HP subiu** (`weeklyReliefApplied`), nunca "hoje é
  segunda": quem estava com o HP cheio ou em zero não recebeu nada.
- **Save antigo / lixo na nuvem**: `lastDayReport` é o **único** objeto deste
  arquivo que atravessa `hydrateSave` verbatim, e só sobrevive se for objeto
  com `date` string — lixo é truthy e abriria o modal com campos vazios.
- **Virada dupla / StrictMode**: os dois eventos de telemetria da virada
  (`welcome_back`, `shield_used`) são emitidos num efeito sobre o RESULTADO, com
  trava `viradaContadaRef` na mesma chave `date`, nunca dentro do updater.

**O que NÃO faz.** Não cura sozinho. Não paga Bits, item nem atributo. Não vira
push. Não reaparece no mesmo dia depois de fechado. Não mostra o que "faltou"
para quem cumpriu a própria meta — a frase vira dica para amanhã.

**Onde a UI mostra.** `src/components/DailyReportModal.tsx` (z-index 200).

---

<a id="humor"></a>
## 12. 😊 Check-in de humor

**Em uma frase.** Cinco carinhas dentro do relatório diário, opcionais, que o
app devolve em forma de leitura — e que não valem ponto nenhum.

**A regra.** `recordMood(log, date, mood)` grava `{ date, mood }` em `moodLog`.
`date` é a chave do **dia do jogador** (`playerDayKey(now, playerDayTz)`, ver
[§5](#dia-do-jogador)); `mood` é `MoodValue` 1–5, com rótulo PT/EN em
`MOOD_OPTIONS` (😔 Difícil · 😕 Meio pra baixo · 😐 Normal · 🙂 Bem · 😄 Ótimo).
Responder de novo no mesmo dia **substitui** (o `filter` remove a entrada da
mesma data antes de acrescentar). O histórico é podado em `MOOD_LOG_CAP` (30) —
registro de acompanhamento, não arquivo.

**O que o app devolve.** `moodSummary(log, language)` lê `recentMoods(log, 7)` e
devolve **`null` com menos de 3 registros** — três pontos é o mínimo para dizer
qualquer coisa sem inventar padrão. Com média ≤ 2 devolve o que a pessoa
**registrou** ("Seus últimos dias foram registrados como pesados. O Soulmon
guarda isso e não faz nada com isso."); com ≥ 4 reconhece; no meio nomeia só os
altos e baixos ("Seus últimos dias tiveram altos e baixos." — ponto final).
Nenhuma variante julga, e **nenhuma afirma sobre a pessoa**. ⚰️ Até `5b91717c`
(21/09/2026) a de ≤ 2 dizia "têm sido pesados" — o app AFIRMANDO sobre a pessoa
(L9 da bíblia, §16 limite 2) — e a do meio terminava em "e tudo bem que seja
assim", a normalização que virou a proposta P14: saiu e **nada entrou no lugar**,
porque afirmar e negar na mesma frase chega como invalidação para quem está em
episódio depressivo (§17 #2 da bíblia). A regra 3 do cabeçalho do módulo (o app
DEVOLVE algo) continua valendo.

**Onde o humor PODE aparecer.** Só em dois lugares: a leitura acima, e o
contexto do `/api/chat` — como INTEIRO de 0 a 4 (`ctx.moodToday`), nunca texto.
É a decisão "humor nunca vira pontuação, mas pode alimentar a FALA". O check-in
também conta para a missão semanal `mood-checkins` (alvo 3, 2 Emblemas,
`src/utils/weeklyMissions.ts`) — moeda que só compra cosmético ([§50](#missoes-semanais)).

**Dono.** `src/utils/mood.ts` (`recordMood`/`moodFor`/`recentMoods`/`moodSummary`);
`src/App.tsx` → `handlePickMood` (carimba o dia do jogador e conta a missão).

**Régua.** `src/utils/mood.test.ts` — inclui o caso que roda a virada com e sem
humor ruim exigindo resultado idêntico. `src/utils/telemetry.test.ts` (humor
individual está na lista do que nunca sai do aparelho).

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.8
("Humor NUNCA vira pontuação — mas pode alimentar a FALA"; a alternativa
rejeitada era a meta adaptada ao humor, que "pareceria empatia e faria a pessoa
responder o que rende ponto") e a lista de "nunca coletar".

**Casos de borda.**
- **Dois aparelhos em fusos diferentes**: com o dia do APARELHO o mesmo dia
  rendia DUAS entradas e a média era puxada por um dia contado duas vezes. Hoje
  a chave vem por parâmetro, do dono da âncora do save.
- **Save com lixo**: `hydrateSave` filtra entrada por entrada (`date` string e
  `mood` número); o resto é descartado em silêncio.
- **`getMoodOption`** sempre devolve algo utilizável (cai em 😐).

**O que NÃO faz.** Não entra em dia completo, HP, energia, evolução, missão
permanente nem ranking. Não bloqueia nada. Não gera lembrete nem push. Não sai
do aparelho como texto. Não pergunta duas vezes no mesmo dia (a segunda resposta
substitui).

**Onde a UI mostra.** `src/components/DailyReportModal.tsx` (as cinco carinhas,
alvo de 44 px cada, com `aria-pressed`, e a linha de `moodNote` abaixo).

---

<a id="brincar"></a>
## 13. 🎈 Brincar

**Em uma frase.** Uma oferta por dia: gastar uma barra de energia para o pet
brincar, e ganhar um bônus modesto no próximo minijogo.

**A regra.** `play(state, todayKey, now)` cobra `PLAY_ENERGY_COST` (1) de
energia e devolve:

- um `PlayBuff` `{ kind: 'minigame', multiplier: PLAY_BUFF_MULTIPLIER (1.2),
  expiresAt: now + PLAY_BUFF_DURATION_MIN (60) min, attribute }`;
- `PLAY_ATTRIBUTE_POINT` (1) ponto no atributo do buff;
- `playLog = { date: todayKey, buff }`.

O atributo do dia é **determinístico**: `attributeForDay(todayKey)` é um hash
estável da chave do dia sobre `['virus','data','vaccine']` — o mesmo dia rende
sempre o mesmo. `PLAY_TIMES_PER_DAY` é 1, e a segunda chamada devolve o estado
intacto com `refused: 'already-played'`; sem energia, `refused: 'no-energy'`.

**O buff é gasto no funil único de Bits.** `handleEarnGamePoints` (`App.tsx`)
aplica `minigameMultiplier` — **sempre ≥ 1**, esta função não tem como devolver
penalidade — e chama `consumeBuff`, que apaga o buff e **mantém** `playLog.date`
(o teto de 1×/dia continua de pé). O `playBuffSpentRef` existe porque uma run de
masmorra credita Bits várias vezes no mesmo tick de render, e sem ele o +20%
seria aplicado a cada inimigo.

**A regra de ouro do arquivo.** `src/utils/petNeeds.ts` existe para **não**
acrescentar medidor: todo parâmetro que entra ali "ou é alimentado por uma
tarefa real cumprida, ou gasta um recurso que veio de tarefa real". Brincar não
tem barra de diversão que desce — ele gasta energia, que veio de comida, que
veio de concluir tarefa.

**Dono.** `src/utils/petNeeds.ts` (`play`, `canPlay`, `playedToday`,
`activeBuff`, `minigameMultiplier`, `consumeBuff`); `src/App.tsx` →
`handlePlay` e `handleEarnGamePoints` (fiação e efeitos).

**Régua.** `src/utils/petNeeds.test.ts`, `src/utils/petNeeds.fuso.test.ts`,
`src/utils/playerDay.contract.test.ts` (guard de AST que obriga a IIFE do
`PlayCard` no `App.tsx` a usar `playerDayKey`, e não `dayKeyOf`).

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.6:
"Brincar NUNCA é condição de dia completo, HP ou evolução" e "Cansaço é DERIVADO
e só cosmético".

**Casos de borda.**
- **Fuso**: `playLog.date` é o dia do JOGADOR. Com o dia do aparelho, quem
  brincava às 23h no Brasil reabria a oferta no tablet em Tóquio — e, na direção
  contrária, a oferta era **negada** a quem não tinha brincado.
- **A UI e o clique leem a MESMA chave**: o card monta dentro de uma IIFE que
  calcula `playerDayKey` uma vez e passa para `canPlay`/`playedToday`. Com
  réguas diferentes, o card diria "vamos brincar?" e o clique responderia "já
  brincamos hoje".
- **Dia 1**: o card só existe depois de `jaConcluiuAlgo` (alguma conclusão em
  `completedTasks`, `activityLog` ou `activityStats`). `canPlay` exige energia
  ≥ 1, e energia só vem de comida — sem isso o card nascia indisponível ocupando
  o espaço mais nobre da tela. Uma oferta que não dá para aceitar é ruído.
- **Buff vencido** simplesmente não existe (`activeBuff` devolve `null`); data
  inválida em `expiresAt` também.
- **Save antigo**: `hydratePlayLog` aceita `playLog` sem buff, e descarta buff
  malformado mantendo a data.

**O que NÃO faz.** Não é obrigação: não há barra de diversão, contador
regressivo nem badge por não ter brincado. Não entra em dia completo, HP nem
evolução — se um dos três olhar para `playLog`, a oferta vira dever diário.
Não subtrai nada além da energia que o jogador escolheu gastar. A recusa não é
erro vermelho: é uma frase do pet.

**Onde a UI mostra.** `src/components/PlayCard.tsx`, na área do pet (junto de
banho/dormir/itens, porque é gesto de cuidado, não minijogo);
`src/components/CompanionHUD.tsx` exibe a sugestão de `needsAttention`, que
devolve **no máximo UM** desejo por vez (banho → brincar → comida).

---

<a id="escada"></a>
## 14. 🪜 A escada de estágios

**Em uma frase.** Cinco níveis, uma tabela só, e o topo (Ultra) tem dois
caminhos — nenhum deles passa por machucar a criatura.

**A regra.** `FORM_REQUIREMENTS` (`src/types/progression.ts`) é a fonte única:

| Nível | `required` | `cap` | `MAX_HP_BY_FORM` |
|---|---|---|---|
| `rookie` | 4 | 6 | 3 |
| `champion` | 5 | 7 | 3 |
| `ultimate` | 5 | 8 | 3 |
| `mega` | 6 | 9 | 4 |
| `ultra` | 6 | 10 | 5 |

`required` é **três coisas ao mesmo tempo**: tarefas por dia, barras de energia
(`getMaxEnergyForStage`) e o **gate da evolução** — é o número que `handleEvolve`
e o `canEvolve` do HUD comparam com `perfectDays`. `cap` é o teto de hábitos
cadastrados que o estágio libera (`maxActivityCap` → `activityCapFor(tier,
stageCap)`, `src/utils/monetization.ts`; a conta grátis é aparada em
`DEMO_ACTIVITY_TOTAL_CAP`, que **é** `FORM_REQUIREMENTS.rookie.cap`, nunca um `6`
escrito à mão). `MAX_STAGE_REQUIREMENT` é `max(required)` da tabela e existe para
nenhum outro teto do jogo poder ficar abaixo do que o jogo pede num dia — foi o
que consertou `FOOD_LIMIT_PER_HOUR` ([§3](#comida)).

**A escada ACHATA no topo de propósito** (4→5→5→6→6). Antes subia 4→5→6→7→8, e a
exigência diária crescia sem parar junto com a vida do jogador — o que fez a
maioria dos donos de Vital Bracelet parar nos estágios médios.

**Esquema de id.** `'rookie'` · `'{champion|ultimate|mega}-{virus|data|vaccine}'`
· `'ultra'`. `getStageLevel` lê o nível do prefixo; `getStageBranch` extrai o
galho. Não existe tabela por espécie.

**Os dois caminhos para o Ultra.** `canReachUltra({ unlockedEvolutions,
perfectDays })` devolve `true` por **coleção** (as três `mega-*` desbloqueadas)
**ou** por **permanência** (`ULTRA_PATIENCE_DAYS` = 45 dias completos acumulados
como mega). `getNextEvolution` faz a pergunta a ela e não decide critério
nenhum. Nenhum dos dois é melhor: a coleção exige **duas quedas deliberadas**
além dos dias completos de cada subida (a conta está no docblock de
`ULTRA_PATIENCE_DAYS`); a permanência é mais longa em tempo e mais barata em
dor. Foi para tirar a queda obrigatória do caminho do topo que a permanência
existe — o topo do jogo pedia que o jogador machucasse a criatura de propósito.

**Dono.** `src/types/progression.ts` — `FORM_REQUIREMENTS`, `MAX_HP_BY_FORM`,
`MAX_STAGE_REQUIREMENT`, `ULTRA_PATIENCE_DAYS`, `canReachUltra`,
`getStageLevel`, `getStageBranch`, `getMaxEnergyForStage`, `clampBranch`,
`MANUAL_EVOLUTION`. `src/utils/dailyReset.ts` → `getNextEvolution` /
`getPreviousForm` (a árvore, subindo e descendo).

**Régua.** `src/types/progression.test.ts` (a TABELA é contrato: os números
exatos, o achatamento no topo, `required` nunca diminui, `cap` cresce, ultra
terminal, nenhum segundo número de evolução volta),
`src/types/ultra.doisCaminhos.test.ts` (inclusive "nenhum caminho para o Ultra
passa por degenerar").

**Decisão.** [`docs/PLANO-MELHORIAS.md`](../PLANO-MELHORIAS.md) — **D5** (a
lápide de `daysToEvolve`) e **D6/WP4.2** (o segundo caminho para o Ultra);
[`docs/STATUS.md`](../STATUS.md), bloco de 06/09/2026.

**Casos de borda.**
- **`evolutionStage` que não é string** (save local ou nuvem são dado NÃO
  confiável, e `/api/save` só valida que `state` é objeto): `getStageLevel` e
  `getStageBranch` caem em `'rookie'`/`null` em vez de deixar `stage.split`
  lançar dentro do inicializador do provider — o modo de falha era **tela branca
  permanente sem caminho de recuperação pela UI**.
- **Id desconhecido** cai em `'rookie'` e o sprite cai em
  `fallbackSpriteForStage` (`src/utils/sprites.ts`), por hash do id —
  determinístico. ⚰️ `LEGACY_FORM_TIERS` (57 ids de espécie de outra franquia)
  **não existe mais** desde 07/09/2026; não recrie a tabela.
- ⚰️ **`daysToEvolve` (10/20/30/40/999) foi apagado em 06/09/2026**: parecia o
  gate e não era, e enganou três consumidores diferentes — o gate de geração de
  sprite, o rótulo da barra e o guia, que prometia "10 dias" quando o botão
  acende com 4.
- **Ultra é terminal**: `getNextEvolution` devolve o próprio estágio, e quem
  garante isso é a árvore, não um número.
- **`cap` nunca encolhe na virada** (`if (newCap > newMaxActivityCap)`) nem na
  degeneração — a única regra que o rebaixa é o Renascimento ([§20](#rebirth)).

**O que NÃO faz.** Não existe estágio `egg` nem `baby` — a árvore nasce em
rookie, e o oráculo do onboarding é o ritual de nascimento. Não existe um segundo
número de evolução ao lado de `required`. Não existe XP como gate (ver
[§15](#atributos)). A escada não decide QUEM é a criatura, só o NÍVEL.

**Onde a UI mostra.** `src/components/EvolutionPath.tsx` (o grafo, a barra e a
frase "faltam N dias completos"), `src/components/CompanionHUD.tsx` (corações e
barras de energia), `src/components/EvoTrail.tsx` (a trilha na Home).

---

<a id="atributos"></a>
## 15. 🦠💾💉 Atributos e galhos

**Em uma frase.** A categoria da tarefa vira comida, a comida vira ponto de
atributo, e o atributo escolhe o galho da próxima evolução.

**A regra, em quatro passos.**

1. **Concluir** uma atividade rende uma comida da categoria dela —
   `foodForCompletedTask(inventory, category)` com `FOOD_BY_CATEGORY`
   (`src/constants/labels.ts`): Fitness 🥩 · Health 🥗 · Study 🍎 · Work ☕ ·
   Wellness 🧃 · Discipline 🍚 · Social 🍕 · Creativity 🍭.
2. **Comer** (`feedFood`) soma `CATEGORY_ATTRIBUTES[categoria]`
   (`src/types/attributes.ts`) em `virusPoints`/`dataPoints`/`vaccinePoints`,
   soma o mesmo em `attributesSinceLastEvolution`, dá +1 de energia (limitada
   por `getMaxEnergyForStage`) e `totalXP += (soma dos três) × 10`.
   Ex.: Study `{virus 0, data 3, vaccine 1}`; Creativity `{3,1,0}`;
   Discipline `{0,1,3}`.
3. **O traço Guloso** soma `GULOSO_BONUS_ATTR` (1) **no atributo que a comida já
   favorece**; empate vai para `data`, o meio-termo da árvore ([§19](#tracos)).
4. **O galho** sai de `evolutionTarget` → `resolveBranch(points, reading,
   currentBranch)`: `branchLeaders` devolve os empatados no topo; um líder único
   decide sozinho; no empate decide o ritmo de cuidado, se `confident`
   ([§16](#ritmo)); sem líder nenhum (`max <= 0`) responde o ritmo ou o galho
   atual.

**Os nomes que o jogador vê.** `ATTR_LABEL` é fonte única: `virus` = **Poder /
Power**, `data` = **Harmonia / Harmony**, `vaccine` = **Benevolência /
Benevolence**. Os ids internos são herdados do fork e o jogador **nunca os vê**.
Cor: `ATTR_COLOR` (preenchimento, ícone, linha) · `ATTR_INK` (TEXTO, por tema,
razão ≥ 4,5:1) · `ATTR_ON_FILL_INK` (texto sobre preenchimento; branco ali mede
2,4–3,1:1, esta mede 5,4–7,0:1). O ícone é sempre o SVG de
`src/components/AlignmentIcons.tsx` — **não existe `ATTR_ICON`**, e a ausência é
a decisão. `ALIGN_TO_ATTR` traduz o alinhamento do oráculo (poder/harmonia/
benevolencia) para o galho.

**Dono.** `src/types/attributes.ts` (as tabelas, os nomes, as cores);
`src/utils/careRules.ts` → `feedFood` e `foodForCompletedTask` (quem soma);
`src/utils/carePattern.ts` → `branchLeaders`/`resolveBranch` (quem escolhe);
`src/utils/evolutionTarget.ts` → `evolutionTarget` (**fonte única** da
forma-destino: quem ANUNCIA e quem COMMITA chamam a mesma função).

**Régua.** `src/utils/careRules.test.ts`,
`src/utils/evolutionTarget.regression.test.ts`,
`src/utils/carePattern.test.ts`, `src/utils/gameRules.fuzz.test.ts`,
`src/utils/passives.test.ts`.

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.6
(recompensa por esforço, nunca por contagem) e o docblock de
`src/utils/evolutionTarget.ts` (a regra copiada que divergiu em três lugares).

**Casos de borda.**
- **Ponto não-finito no save** (`NaN`, campo ausente): `safeAttrPoints` zera
  antes de `Math.max`. Sem isso a lista de líderes ficava VAZIA (nada é `===
  NaN`), `resolveBranch` devolvia `leaders[0]` — ou seja **`undefined`**, valor
  fora do próprio tipo de retorno — e `currentBranch: undefined` ia para o save.
  Achado por fuzzing.
- **Empate com leitura fraca** cai no galho ATUAL (`fallback`), nunca em `data`
  fixo — a cópia antiga do `App.tsx` mandava todo empate para `data`, e a página
  previa `virus` enquanto a cerimônia gravava outra coisa.
- **Comida especial não passa por aqui**: chip, coraçãozinho e Glitchtama são de
  `src/utils/specialItemUse.ts` ([§48](#itens-especiais)) e não contam no limite
  por hora.
- ⚰️ **`XP_THRESHOLDS` (600/1000/1500/2300) não é gate de nada.** Ele alimenta
  `XP_BY_LEVEL` → `getNextLevelXP` → o prop `nextLevelXP` do `CompanionHUD`, que
  o componente **desestrutura e não desenha**. O gate é
  `FORM_REQUIREMENTS[...].required` contra `perfectDays`. Quem usa `totalXP` de
  verdade é o Vínculo ([§55](#vinculo)).
- ⚰️ **`attributesSinceLastEvolution` é escrito e zerado em cinco lugares e não
  tem leitor vivo**: o único consumidor é o ramo `!MANUAL_EVOLUTION` de
  `computeDailyReset`, que está morto ([§17](#evolucao)). O galho vivo vem dos
  totais (`virusPoints`/`dataPoints`/`vaccinePoints`).

**O que NÃO faz.** Comida **não** cura HP. Chip de atributo **não** dá energia.
Atributo não muda força, HP nem velocidade — muda o RUMO. Não existe atributo
negativo, e nenhuma tarefa tira ponto.

**Onde a UI mostra.** `src/components/EvolutionPath.tsx` (as três barras e o
galho previsto), `src/components/StatsPage.tsx`,
`src/components/PlayerDetailModal.tsx`, `src/components/EvoTrail.tsx`.

---

<a id="ritmo"></a>
## 16. 🌿 Ritmo de cuidado

**Em uma frase.** O jeito como a pessoa apareceu nas últimas duas semanas vira
um retrato — Constante, Explosivo ou Equilibrado — e esse retrato só desempata o
galho da evolução.

**A regra.** `computeCarePattern(completed, now, windowDays = CARE_WINDOW_DAYS)`
lê as conclusões dentro da janela de **`CARE_WINDOW_DAYS` = 14** dias e devolve
`CareReading { pattern, activeDays, total, concentration, confident }`:

```
concentration = conclusões do dia mais cheio / total
spread        = activeDays / windowDays
confident     = total >= 5   (MIN_TASKS_FOR_CONFIDENCE, privado do módulo)

constante   ⇐ spread >= 0.5  E  concentration <= 0.4
explosivo   ⇐ concentration >= 0.5  OU  spread <= 0.25
equilibrado ⇐ o resto (e SEMPRE, quando não é confiável)
```

Os três limiares são **inclusivos** (0,50 de spread já é constante; 0,40 de
concentração ainda é constante; 0,50 de concentração já é explosivo).

**A entrada é `careHistory(state)`**, que junta `completedTasks` **e**
`activityLog` — existe como função única porque a lista já foi montada em dois
lugares e eles divergiram: a página de Evolução previa o galho com o log de
atividades e a cerimônia decidia sem ele, então o app prometia um galho e
entregava outro justamente a quem cumpre hábito por atividade recorrente.

**O que cada ritmo puxa** (`patternBranch`): constante → `vaccine`, explosivo →
`virus`, equilibrado → `data`. **Nenhum é melhor que outro**, e nenhum muda
força, HP ou velocidade — só o rumo, e só quando os atributos empatam
([§15](#atributos)).

**Dono.** `src/utils/carePattern.ts` — `computeCarePattern`, `careHistory`,
`patternBranch`, `branchLeaders`, `resolveBranch`, `CARE_PATTERNS`.

**Régua.** `src/utils/carePattern.test.ts`,
`src/utils/carePattern.threshold.test.ts` (cada limiar, um passo acima e um
abaixo), `src/utils/careHistory.contract.test.ts` (guard de origem: nenhum call
site pode voltar a ler só as tarefas).

**Decisão.** A ideia dos *care mistakes* do v-pet de 1997 (o docblock do módulo):
lá os erros de cuidado eram um SELETOR, não uma punição.
[`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.6, linha "Rota de
redenção visível", registra o mesmo princípio: *"o bicho ruim não é um beco; é um
retrato com saída"*.

**Casos de borda.**
- **Pouco histórico**: com menos de 5 conclusões `confident` é `false`, o padrão
  cai em `equilibrado` e **não desempata nada** — a UI nem mostra o rótulo
  (`carePatternReading.confident ? … : null`).
- **Data inválida ou fora da janela** é descartada (`Number.isFinite`, `t <
  cutoff`, `t > now`) — sem isso um `completedAt` no futuro contaminaria a
  leitura.
- **A janela é de tempo, não de contagem**: quem sumiu duas semanas volta com
  leitura não-confiável, o que é o comportamento certo (nada a desempatar).
- **A chave do dia aqui é `toDateString()` do próprio `completedAt`**, não
  `playerDayKey` — é agregação de histórico, não um teto diário.

**O que NÃO faz.** Não é score, não aparece como percentual, não muda
recompensa e não é exposto quando é chute. Não decide o galho quando há líder
único. Não entra em HP, dia completo nem missão.

**Onde a UI mostra.** `src/components/EvolutionPath.tsx` (a linha "empate nos
atributos, e o seu ritmo X desempata") e `src/components/StatsPage.tsx` — nos
dois casos só com `confident`.

---

<a id="evolucao"></a>
## 17. 🔒 Evolução manual e o cadeado

**Em uma frase.** Com a barra cheia, quem evolui é o jogador tocando na
criatura; a virada do dia nunca evolui sozinha, e o cadeado segura tudo.

**A regra.** `MANUAL_EVOLUTION = true` (`src/types/progression.ts`). O ramo de
evolução automática de `computeDailyReset` vive atrás de `!MANUAL_EVOLUTION` e
está **morto**.

`handleEvolve` (`src/App.tsx`), dentro do updater, na ordem:

1. `if (prev.evolutionLocked) return prev` — travado, nada acontece;
2. `if (prev.perfectDays < FORM_REQUIREMENTS[getStageLevel(...)].required) return prev`;
3. `evolutionTarget({ points, reading: computeCarePattern(careHistory(prev)),
   currentBranch, evolutionStage, unlockedEvolutions, perfectDays })` decide
   galho e forma-destino ([§15](#atributos));
4. `applyRedemption(prev, evoluiu)` fecha o arco de quem tinha caído
   ([§18](#degeneracao));
5. grava `evolutionStage`, `currentBranch`, `healthPoints` e `maxHealthPoints`
   no máximo do estágio novo, **`perfectDays: 0`**,
   `attributesSinceLastEvolution` zerado, acrescenta a forma a
   `unlockedEvolutions` (sem duplicar) e carimba `formReachedAt` com a chave do
   **dia do jogador** — data que **nunca é reescrita**.

`canEvolve` (o botão, no HUD) repete as três condições da mesma fonte:
`evolutionLocked`, `perfectDays >= required`, e `evolutionTarget(...).stage !==
evolutionStage`. `handleEvolveRequest` abre a cerimônia com o mesmo alvo.

**O cadeado.** `evolutionLocked` é alternado por `handleToggleEvolutionLock` —
tocando na criatura atual no grafo, ou no botão "Segurar evolução". Travado: os
dias completos **seguem acumulando** (`perfectDays` pode passar do requisito, e
por isso a frase usa `Math.max(0, gateDays − perfectDays)`) e a degeneração por
HP 0 continua valendo. Destravado: nada acontece sem o toque.

**Dono.** `src/App.tsx` → `handleEvolve` / `handleEvolveRequest` /
`handleToggleEvolutionLock` (fiação e commit); `src/utils/evolutionTarget.ts`
(o destino); `src/types/progression.ts` (`MANUAL_EVOLUTION`, `FORM_REQUIREMENTS`).

**Régua.** `src/components/evolucaoManual.contract.test.ts` — enquanto
`MANUAL_EVOLUTION` for `true`, **nenhum literal de interface** pode dizer que a
virada evolui; `src/utils/evolutionTarget.regression.test.ts`;
`src/types/progression.test.ts` ("quem decide a evolução manual continua sendo
`required`").

**Decisão.** A varredura de 09/09/2026 documentada no cabeçalho do próprio
guard: **quatro** descrições da mesma regra, **três erradas** — inclusive os
textos de travado e destravado **invertidos** na `EvolutionPath.tsx`. Quem
enchia a barra e esperava a virada não via nada acontecer, com a barra cheia na
tela, o que lê como defeito do jogo.

**Casos de borda.**
- **Barra cheia e travada**: a frase é "Pronto para evoluir — mas você segurou a
  evolução", e era a única das quatro que já estava certa.
- **StrictMode**: `handleEvolve` é um updater puro que relê `prev`; a segunda
  passada recalcula sobre o estado já novo e não encontra destino.
- **Sem destino** (`stage === evolutionStage`): o botão não acende e a cerimônia
  não abre — é assim que um mega sem os dois caminhos do Ultra fica parado sem
  mensagem de erro ([§14](#escada)).
- ⚰️ **Não existe atalho para uma forma já desbloqueada.**
  `handleEvolveToUnlocked` está no `App.tsx`, mas `showEvolutionChoice` nunca
  vira `true` e **nenhuma superfície chama o handler** — medido em 10/09/2026
  com `grep -rn "setShowEvolutionChoice\|EvolutionChoice" src/`, que devolve
  duas linhas, ambas no `App.tsx`.
- ⚠️ **divergência (código × comentário do dono).** Logo acima do ramo
  `!MANUAL_EVOLUTION`, `src/utils/dailyReset.ts` ainda afirma que "o cadeado
  bloqueia por completo: os dias perfeitos seguem acumulando e a evolução
  acontece na virada seguinte ao destravar". A segunda metade descreve o
  comportamento anterior a `MANUAL_EVOLUTION = true`; o guard só varre literais
  de interface, e comentário não é literal. A regra vigente é a desta seção.

**O que NÃO faz.** A virada não evolui, não destrava e não desfaz o cadeado. O
cadeado **não** protege de degeneração por HP 0. Evoluir não devolve HP perdido
de outro jeito que não seja encher o máximo do estágio novo. `perfectDays` zera
**só** aqui.

**Onde a UI mostra.** `src/components/EvolutionPath.tsx` (grafo, barra, botão do
cadeado, a frase de progresso), `src/components/CompanionHUD.tsx` (o toque na
criatura), `src/components/EvolutionCeremony.tsx` (z-index 500).

---

<a id="degeneracao"></a>
## 18. 🌑 Degeneração e redenção

**Em uma frase.** HP 0 na virada faz a criatura descer um estágio — com um
desconto de misericórdia, um piso para quem já está na raiz, e uma marca de
volta para quem sobe de novo.

**A regra.** Ainda dentro de `computeDailyReset`, depois da conta de corações
([§1](#coracoes)):

```
se newHP <= 0:
  previousForm = getPreviousForm(evolutionStage, currentBranch)
  se previousForm != evolutionStage:          # há forma abaixo
      degeneratedByHP = true
      evolutionStage  = previousForm
      newHP           = MAX_HP_BY_FORM[nível novo]
      perfectDays     = degeneratedPerfectDays(perfectDays, nível novo)
      attributesSinceLastEvolution = zerado
  senão:                                      # RAIZ (rookie)
      pisoDaRaizAbsorveu = true
      newHP = 1
```

`degeneratedPerfectDays(prev, nível) = max(floor(required[nível]/2), prev −
DEGENERATION_PERFECT_DAYS_COST)`, com `DEGENERATION_PERFECT_DAYS_COST = 5`. O
`floor(required/2)` é **piso**, não atribuição: quem cai não recomeça do zero, e
quem tinha muito não é rebaixado até o chão.

**`getPreviousForm`** desce pelo galho embutido no próprio id; só o passo
`ultra → mega` não tem galho no id e usa o galho atual do jogo.

**A degeneração manual** (`handleDegenerate`, botão na página de Evolução, com
**dupla confirmação**) chama **a mesma** `degeneratedPerfectDays`, põe HP e
`maxHealthPoints` no máximo do estágio alvo, zera
`attributesSinceLastEvolution` e marca `degeneratedByHP: false` (quem desceu de
propósito não caiu).

**A rota de redenção (WP4.19).** `applyRedemption(prev, evoluiu)`: evoluir
enquanto `degeneratedByHP` está de pé **apaga a marca da queda e acende a da
volta** (`redeemed: true`). Três limites: `redeemed` nunca é marca de queda;
**exibir é escolha do jogador** (`showRedeemed`, desligado por padrão, nas
Configurações); e é **cosmético** — não dá ponto, não muda requisito, não entra
em ranking.

**Dono.** `src/utils/dailyReset.ts` — `computeDailyReset` (o ramo),
`degeneratedPerfectDays` (dono único da conta), `getPreviousForm`,
`applyRedemption`. `src/App.tsx` → `handleDegenerate` **delega** a conta.

**Régua.** `src/utils/degeneracao.cenarios.test.ts`, `src/utils/redemption.test.ts`,
`src/hooks/useDailyReset.test.ts` (o teste de **paridade** entre o caminho
automático e o manual).

**Decisão.** [`docs/PLANO-MELHORIAS.md`](../PLANO-MELHORIAS.md) WP4.19 e a
ressalva #21; [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.1:
"Degeneração nunca se chama 'morte'; sempre reversível, nunca por pagamento" — o
Tamagotchi original, com morte em menos de 12h, deu apego **e** abandono em
massa.

**Casos de borda (o que o cenário mede).**
- **Mega que não faz nada por 14 dias desce dois estágios**; a primeira queda
  leva **menos de uma semana** mesmo com a folga semanal.
- **Mega com 4 de 6 todo dia atravessa duas semanas sem perder um coração** — é
  a meta de coração a 60% funcionando ([§1](#coracoes)) — e **4 de 6 em seis dias
  com ZERO no sétimo** também atravessa. Mas **dois dias zerados na mesma
  semana** já custam coração: a folga é uma só.
- **Fato observado e registrado no teste**: quem abre o app a cada 3 dias e não
  faz nada **nunca** perde um coração — o perdão por ausência
  (`ABSENCE_FORGIVENESS_DAYS`) domina, e isso não é defeito da folga.
- **Piso da raiz**: um rookie em HP 0 volta com **1** coração, sem presente e
  sem custo extra; e o relatório para de anunciar uma perda que não aconteceu
  ([§11](#relatorio-diario)).
- **Divergência histórica já corrigida**: enquanto a expressão estava escrita à
  mão nos dois caminhos, um mega com 39 dias completos que descia de propósito
  reaparecia com **2**, e o mesmo mega que deixava o HP zerar reaparecia com
  **34** — o caminho deliberado punia mais que o descuido.
- ⚠️ **divergência (código × `REGISTRO-DE-DECISOES.md`).** A §5.6 marca "Rota de
  redenção visível" como ⬜ **não implementado**, enquanto `applyRedemption`,
  `redeemed`, `showRedeemed` e o `redeemedMark` do `CompanionHUD` estão no
  código e no save. A parte ainda ausente é a **narrativa** (o capítulo do
  Numemon → Monzaemon); a marca cosmética existe.

**O que NÃO faz.** Não zera `perfectDays` (aplica piso + custo). Não apaga
tarefas, hábitos, moedas, coleção nem `unlockedEvolutions`. Não se chama morte.
Não é comprável — não existe cura por Créditos ([§46](#moedas)). O cadeado de
evolução não protege contra ela.

**Onde a UI mostra.** `src/components/DailyReportModal.tsx` (`degenerated` muda
manchete e ícone — a composição de LUTO com coração partido e fundo rosa saiu),
`src/components/EvolutionPath.tsx` (a degeneração manual, com dupla
confirmação), `src/components/CompanionHUD.tsx` (`redeemedMark`),
`src/components/SettingsPage.tsx` (o interruptor de `showRedeemed`).

---

<a id="tracos"></a>
## 19. ✨ Traços de nascimento

**Em uma frase.** Todo Soulmon nasce com **um** traço sorteado, todos positivos,
que muda um detalhe do dia a dia — nunca a força.

**A regra.** `rollPetPassive(rng = Math.random)` sorteia um id de
`PET_PASSIVES` e ele mora em `petPassive`, no save. Os cinco, com o efeito e o
símbolo que o aplica:

| Traço | Efeito | Onde é aplicado |
|---|---|---|
| 🍴 Guloso | +`GULOSO_BONUS_ATTR` (1) de atributo por refeição | `feedFood` ([§15](#atributos)) |
| 🫶 Carinhoso | carinho cura até **1,5**/dia | `rubDailyCap(petPassive, baseCap)` ([§2](#carinho)) |
| 🛡️ Teimoso | dia ruim custa **metade** | `heartLossCap(petPassive, base)` ([§1](#coracoes)) |
| 🍀 Sortudo | +5 pontos percentuais de coraçãozinho | `heartDropBonus` ([§51](#masmorra)) |
| 🌅 Madrugador | cocô só a partir das 10h | `earliestPoopHour(petPassive, base)` ([§8](#coco)) |

**Todo traço é POSITIVO**, e isso é regra: um traço negativo puniria o jogador
por um dado que ele não jogou. A variedade é **em espécie** (um mexe na comida,
outro no carinho, outro no cocô), nunca em força.

**Os efeitos são lidos DO ESTADO, nunca por parâmetro novo.** É o que faz o
overlay de desktop herdar o comportamento sem uma segunda implementação — e é a
mesma lição do X-6: parâmetro é coisa que quem chama esquece, e o chamador que
esquecesse voltaria em silêncio ao comportamento sem traço, compilando.

**Dono.** `src/utils/passives.ts` — `PET_PASSIVES`, `rollPetPassive`,
`getPassive`, `hasPassive`, `GULOSO_BONUS_ATTR`, `rubDailyCap`, `heartLossCap`,
`heartDropBonus`, `earliestPoopHour`.

**Régua.** `src/utils/passives.test.ts` — inclui **"nenhum traço é uma
desvantagem"** e "save antigo sem traço não quebra nada".
`src/styles/emojiSuportado.contract.test.ts` (ver casos de borda).

**Decisão.** O docblock do módulo: "o Soulmon não pune por sorte".

**Casos de borda.**
- **Save sem traço**: `hydrateSave` faz `str(loadedState.petPassive) ??
  rollPetPassive()` — quem já jogava ganha um traço no primeiro load, e
  `hasPassive(undefined, id)` é `false` em todo caminho antes disso.
- **Sorteio determinístico em teste**: `rollPetPassive` aceita um `rng`.
- **🫶 renderiza como CAIXA VAZIA** em fonte de sistema mais velha: `U+1FAF6` é
  do bloco `Symbols and Pictographs Extended-A` (Emoji 14.0). Está congelado
  como dívida conhecida no guard de emoji, que cita o cartão de Estatísticas e o
  botão de carinho do overlay. A troca dos glifos é decisão do dono
  ([`STATUS.md`](../STATUS.md)).
- **`heartLossCap` divide o teto por 2**, então o Teimoso perde 0,5 — HP aceita
  frações de 0,5, e o piso da raiz devolve esse jogador a 1
  ([§18](#degeneracao)).

**O que NÃO faz.** Não muda HP máximo, requisito diário, meta, energia nem
velocidade. Não é escolhido, comprado, rerrolado nem melhorado. Não existe traço
raro: os cinco têm a mesma chance.

**Onde a UI mostra.** `src/components/StatsPage.tsx` (o cartão do traço, com
nome e descrição PT/EN).

---

<a id="rebirth"></a>
## 20. 🥚 Renascimento (Rebirth)

**Em uma frase.** Uma vez na vida, quem chegou ao Ultra e comprou o jogo pode
trocar a forma inteira por uma criatura que ele mesmo descreve — e volta a
rookie com tudo o que colecionou.

**A regra.** `rebirthRefusal(input)` responde, **nesta ordem**:
`already-used` (existe registro `rebirth`) → `not-paid` (`accountTier !==
'paid'`) → `not-ultra` (`evolutionStage !== REBIRTH_REQUIRED_STAGE`, que é
`'ultra'`) → `null`. `canRebirth` é `rebirthRefusal(...) === null`.

A recusa é **motivada** porque cada motivo tem saída diferente na tela:
`not-paid` renderiza o `UnlockNudge` na página de Evolução (motivo de telemetria
`evolution`); `not-ultra` **não** vira convite (a própria página já conta a
escada); `already-used` é registro, nunca oferta repetida.

**As três escolhas** (`RebirthChoices`): **criatura** (campo aberto, teto
`REBIRTH_CRIATURA_MAX` = 60), **escola** (as 6 do class-system,
`rebirthEscolaOptions()` lido de `CLASS_DATA.escolas`) e **elemento**
(`rebirthElementOptions()` = os base de `CLASS_ELEMENT_ORDER` + os pares
derivados; **para no 2º nível** porque o motor de ficha só sabe alocar aridade 1
e 2 — oferecer tripla seria prometer no menu o que a cozinha não faz).

**`applyRebirth(prev, choices, now)`** reescreve **cinco campos e mais nada**:
`evolutionStage: 'rookie'`, `virusPoints`/`dataPoints`/`vaccinePoints` = 0, e
grava `rebirth: { criatura, escola, elemento, at, fromStage }`. Passam intactos
pelo spread: Bits, Emblemas, Créditos, decoração, cenários, sonhos,
`habitRhythms`, `perfectDays`, `totalPerfectDays`, `unlockedEvolutions`,
tarefas, hábitos, `bornAt`.

**O ganho.** `REBIRTH_BUDGET_MULTIPLIER` = **1.5** sobre o orçamento de pontos
da ficha em **todos** os estágios. 1,5 e não 2: o dobro num sistema com custo de
par destrava geração adiantada e faz o rookie renascido ler como um mega.

**Dono.** `src/utils/rebirth.ts` (**dono único**); `src/App.tsx` →
`handleRebirth` (gera a criatura ANTES de aplicar, e só então escreve).

**Régua.** `src/utils/rebirth.test.ts` — lista campo por campo o que não pode ser
tocado, prova a idempotência, a higienização do campo aberto, e que as escolhas
**chegam às 11 formas, nas duas variantes de prompt**, entre aspas, com a
cláusula de franquia mantida.

**Decisão.** [`docs/RENASCIMENTO.md`](../RENASCIMENTO.md) — as quatro decisões
(D-R1..D-R4) e "a consequência aceita de D-R2".

**Casos de borda.**
- **Idempotência**: a 2ª chamada bate em `already-used` e devolve **a mesma
  referência** — o registro que ela mesma gravou é o que a barra (footgun 6).
- **Escolha inválida** (criatura vazia, escola ou elemento fora do catálogo)
  devolve `applied: false` com `refusal: 'not-ultra'` — a recusa é reaproveitada
  como "não deu", e não descreve o motivo real.
- **Injeção de prompt**: `sanitizeCriatura` remove `\r\n\t` e crase, colapsa
  espaço, corta em `REBIRTH_CRIATURA_MAX` e devolve `''` para entrada inútil;
  entrada que não é string também vira `''`.
- **Falha de geração**: `handleRebirth` gera a criatura dentro de `try` e
  retorna `false` no `catch` — **a chance única não é gasta**.
- **`perfectDays` NÃO zera, de propósito**: quem renasce reescala rápido; o
  preço é abrir mão da forma, não meses de castigo.
- ⚠️ **divergência (código × `CLAUDE.md` × `rebirth.ts`).** As duas listas dizem
  "perde-se o estágio e os três atributos, e SÓ". O `handleRebirth` do `App.tsx`
  **também** rebaixa `maxActivityCap` para `FORM_REQUIREMENTS.rookie.cap` (além
  de HP, `currentBranch` e `degeneratedByHP`, que decorrem do estágio novo). É a
  única regra do jogo que encolhe o teto de hábitos — nem a degeneração faz isso
  ([§14](#escada)). Item para o [`STATUS.md`](../STATUS.md).

**O que NÃO faz.** Não é prestígio de idle game (não repete). Não apaga
coleção, moeda, hábito, marco nem histórico. Não reabre um estágio `egg` — o ovo
é a TELA, não um estágio jogável. Não é vendido avulso: quem libera é o
`accountTier: 'paid'`.

**Onde a UI mostra.** `src/components/RebirthModal.tsx` (as três escolhas, em
lazy import), `src/components/EvolutionPath.tsx` (a entrada quando `canRebirth`,
e o `UnlockNudge` quando a recusa é `not-paid`).

---

<a id="soulgoal"></a>
## 21. 🧭 O "porquê" do usuário (`soulGoal` / `soulStruggle`)

**Em uma frase.** Duas perguntas abertas, puláveis, feitas antes de qualquer
mecânica — e o app devolve o que a pessoa escreveu nos momentos em que isso
importa.

**A regra.** No onboarding, os passos `GOAL_STEP` (−2) e `STRUGGLE_STEP` (−3)
— ids **negativos**, como `DEMO_PICK`, para não renumerar a sequência do ritual —
perguntam:

- **"O que você quer melhorar na sua vida?"** → `soulGoal`;
- **"E o que mais te atrapalha hoje?"** → `soulStruggle`.

Teto de **280** caracteres cada (`e.target.value.slice(0, 280)`). As duas têm
botão "Prefiro não responder agora", que **grava string vazia** e avança —
obrigar a escrever antes de ver o app é o jeito mais rápido de perder alguém. As
duas vêm **antes** de nome, data e quiz: a razão para mudar precisa vir da
pessoa, não do app.

**Onde o app devolve.** Quatro lugares, e nenhum deles é uma tela de resumo:

| Onde | O quê |
|---|---|
| Tutorial de atividades | `orderCategoriesForGoal(CATEGORIES, soulGoal, soulStruggle)` põe a área de vida da pessoa em primeiro |
| Relatório diário | em dia completo e no retorno: *"Lembra por que você começou: …"* |
| Oferta reduzida do "never miss twice" | `tinyOfferIntro(soulStruggle)`: *"Você me contou que X costuma atrapalhar."* |
| Cartão de nascimento e memórias | *"Você disse: … . `nome` nasceu disso."* / *"Começou assim: …"* |

**A privacidade é regra, não economia.** O texto **não sai do aparelho**:
`functions/api/_redact.js` declara que `soulGoal`/`soulStruggle` não passam por
rota de IA (decisão D8), a telemetria os lista entre os campos que nunca se
coleta, e o casamento por palavra-chave de `goalToCategory.ts` roda **local** —
o que sai é, no máximo, um enum de categoria. O eco do
`STRUGGLE_ECHO_MAX` (80) também é montado no aparelho.

**Dono.** `src/components/SoulmonOnboarding.tsx` (as duas telas e o rascunho de
portão); `src/utils/goalToCategory.ts` (`orderCategoriesForGoal`);
`src/utils/tinyOffer.ts` (`echoStruggle`, `tinyOfferIntro`);
`src/utils/gateDraft.ts` (sobrevivência à ida ao e-mail).

**Régua.** `src/utils/goalToCategory.test.ts`, `src/utils/tinyOffer.test.ts`
(nenhuma variante repete a falha, conta vezes ou usa "deveria"/"falhou"),
`src/utils/gateDraft.test.ts`, `src/utils/telemetry.test.ts`,
`src/components/BirthCard.render.test.tsx`,
`src/components/MemoriesCard.render.test.tsx`,
`src/components/MorningCheckIn.ofertaReduzida.render.test.tsx`.

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.3
("cada pergunta muda a experiência visivelmente" — Tim Gabe, *Onboarding
Paradox*) e §5.8 (a lista do que nunca se coleta).

**Casos de borda.**
- **O eco do `STRUGGLE_STEP`** ("Anotado. Seu Soulmon vai lembrar disso.") só
  aparece para quem **escreveu** — para quem pulou, a frase viraria mentira. E
  não vira estado no save: o gatilho é o `soulGoal` que já está em memória.
- **Viagem ao e-mail**: abrir o link de verificação leva a pessoa para fora do
  app e o `App.tsx` recarrega a página ao voltar; `writeGateDraft` é o que
  impede a viagem de cobrar de novo objetivo, dificuldade e aceite dos Termos.
- **Corte do eco** cai na última palavra inteira dentro do teto (e só se o
  espaço estiver depois do caractere 20) — cortar no meio de uma palavra é pior
  que cortar seco.
- **Sem resposta**: `tinyOfferIntro` devolve `null` e a oferta genérica aparece
  inteira, nunca um espaço vazio com ar de formulário incompleto.
- **Save antigo**: `hydrateSave` normaliza os dois para `''`.

**O que NÃO faz.** Não vira nota, meta, cobrança nem score. Não vira lembrete.
Não é obrigatório. Não vai para a IA, para a telemetria nem para o servidor como
texto. Não aparece em dia comum — só em dia completo, no retorno, na segunda
falta seguida e nos cartões de memória.

**Onde a UI mostra.** `src/components/SoulmonOnboarding.tsx`,
`src/components/GameTutorialFlow.tsx`, `src/components/DailyReportModal.tsx`,
`src/components/MorningCheckIn.tsx`, `src/components/BirthCard.tsx`,
`src/components/MemoriesCard.tsx`, `src/components/StatsPage.tsx`
("Começou por: …").

---

<a id="oraculo"></a>
## 22. 🔮 O Oráculo, do lado do jogador

**Em uma frase.** Um ritual de seis perguntas cria a criatura de quem comprou o
jogo; quem quiser pode responder mais vinte antes do reveal, e essa escolha não
tem volta.

**A regra — o que o jogador percorre.** No caminho pago
(`src/components/SoulmonOnboarding.tsx`), depois do portão de identidade, do
"porquê" ([§21](#soulgoal)) e da escolha grátis/completo:

| Passo | O que se pede | Para quê a tela diz que serve |
|---|---|---|
| 1 | nome completo | a numerologia da criatura |
| 2 | data de nascimento | os elementos do mapa astral **e** o 18+ (`MIN_AGE_YEARS`) |
| 3 | hora (ou "não sei") | — |
| 4 | cidade de nascimento | posiciona o céu e resolve o fuso |
| 5 | criatura favorita (opcional, até 2 palavras, com "prefiro não influenciar") | a aparência |
| 6–11 | **as 6 perguntas de `ORACLE_QUESTIONS`** | cada uma declara qual eixo alimenta |
| 12 | **a bifurcação** | responder mais 20, ou revelar agora |
| 13–32 | os 20 itens de `SOUL_TEST_ITEMS` | Big Five + Honestidade-Humildade |
| 33 | geração | — |
| 34 | **reveal** + batismo | — |

**As 6 perguntas são o ritual, e o número é regra de produto** (medido em
10/09/2026: `grep -c '^  {$' src/utils/oracle.ts` a partir de
`ORACLE_QUESTIONS` = 6). Cada uma leva um `hint` que diz **de onde a resposta
entra** ("isto alimenta o PAPEL dela"), nunca **como a criatura vai ficar** —
alvo transformaria a leitura num formulário de otimização, e a pessoa passaria a
responder o que rende o bicho que ela quer.

**A bifurcação é declarada SEM VOLTA na própria tela** ("Esta escolha não tem
volta — não dá para responder o teste depois"), e ela vem **depois** das 6 e
**antes** do reveal: oferecer depois significaria trocar por outra a criatura
que a pessoa acabou de conhecer. A copy promete uma leitura com **mais fontes**,
nunca vantagem — e o número sai da constante (`SOUL_TEST_ITEMS.length` = **20**,
medido em 10/09/2026 com `grep -o 'kind: "[a-z-]*"'
src/utils/soulProfile/personality/questions.ts | wc -l`: 9 Likert + 3 de
frequência + 4 de escolha forçada + 4 cenários).

**As 6 respostas entram na leitura NOS DOIS caminhos** — para quem não faz o
teste longo, elas são o único sinal de personalidade que existe.

**O que o jogador vê no reveal.** Nome, uma descrição breve, o `BirthCard` (a
mesma peça que reaparece nas Estatísticas) com a linha de **essência e ofício**
(`Essência X · Ofício Y`), e o campo de **batismo já preenchido** com o nome
sugerido — manter é seguir em frente, trocar é digitar por cima. Pontuação de
eixo e prompt de sprite **não aparecem**: vivem na `OraclePage`, que é
ferramenta de criação e **não tem entrada na navegação**.

**Ler de novo — a "Nova Leitura".** `REROLL_COST_CREDITS` = **50 Créditos**
(dinheiro real). ⚰️ **O reroll por sorteio não existe mais** (WP5.7, removido em
06/09/2026): a semente vinha de uma chamada de aleatório, e é o próprio
`public/termos.html` que registra a retirada e o motivo — "pagar por um resultado
aleatório é o que se chama de sorteio pago". `readingSeed(answers, readingCount)` é um
FNV-1a determinístico sobre as respostas, na ordem fixa de `ORACLE_QUESTIONS` —
mesma resposta, mesma criatura, **e a tela diz isso antes de cobrar**. Para obter
outra criatura a pessoa muda o que respondeu sobre si mesma. O `readingCount` só
anda quando uma leitura é CONCLUÍDA, então abrir a tela e desistir não muda nada.

**Dono.** `src/utils/oracle.ts` (`ORACLE_QUESTIONS`, `composeSpritePrompts`);
`src/utils/soulProfile/` (a leitura: `personality/questions.ts`, `axes.ts`,
`pipeline.ts`); `src/utils/newReading.ts` (`readingSeed`);
`src/utils/monetization.ts` (`REROLL_COST_CREDITS`);
`src/components/SoulmonOnboarding.tsx` (o ritual);
`src/App.tsx` → `handleNewReading`.

**Régua.** `src/utils/oracle.test.ts`, `src/utils/oracle.soulProfile.test.ts`,
`src/utils/newReading.test.ts` (a ausência de fonte de aleatoriedade é procurada
no arquivo), `src/utils/soulProfile/pipeline.test.ts` (o nome da
criatura-inspiração **nunca** entra em prompt), `src/utils/soulProfile/axes.test.ts`,
`src/utils/oracleDraft.test.ts`,
`src/components/SoulmonOnboarding.reveal.render.test.tsx`,
`src/components/SoulmonOnboarding.copyRitual.render.test.tsx`,
`src/components/SoulmonOnboarding.batismo.render.test.tsx`,
`src/components/SoulmonOnboarding.rascunho.render.test.tsx`.

**Decisão.** [`docs/ORACULO.md`](../ORACULO.md) ("O fluxo: 6 perguntas para todo
mundo, 20 para quem quiser");
[`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.3 (psicométrico
invisível; a criatura é ESPÉCIE, não personagem; manter a bifurcação e **medir**
antes de reordenar — gatilho declarado: se o teste de 20 itens matar >30% do
funil, reordenar vira P0) e §5.4 (reroll com semente derivada, contra a Lei
15.211/2025).

**Casos de borda.**
- **Fechar o app no meio do ritual pago**: `readOracleDraft(mode, DEEP_END − 1)`
  devolve ao mesmo passo com tudo que já foi respondido — e **nunca** retoma na
  geração ou depois, nem em outro modo.
- **Reroll com perfil corrompido**: a criatura é gerada **antes** de cobrar, e
  qualquer falha retorna sem debitar. Cobrar e falhar seria roubo.
- **O reroll RECOMEÇA a escada**: `evolutionStage: 'rookie'`,
  `unlockedEvolutions: ['rookie']`, `perfectDays: 0` e os três atributos zerados.
  É uma criatura nova, não uma repintura.
- **Perfil de antes da troca de motor** (sem `soulProfile`) roda o caminho
  legado inteiro — é o que mantém o reroll de quem jogou antes.
- **Conta grátis** não gera criatura: escolhe um dos **seis** personagens
  prontos (`PREMADE_CHARACTERS`, `src/utils/monetization.ts` — `kaelen`/`orrin`/
  `thalindra` e, desde 15/09/2026 (D1 da SQUAD-ARTE), `igni`/`nautilu`/`astrase`,
  as três linhas do oráculo com seed fixo; o nome vem sempre de
  `DUNGEON_LINE_NAMES`) em `DEMO_PICK` e recebe `demoCharacterId`. Desde
  20/09/2026 (REGISTRO 13.19) ela **responde as 6 perguntas** e, antes de
  escolher, vê o `REVEAL_DEMO` (`SoulmonOnboarding.tsx`): leitura por
  `generateOracle` só das 6 respostas, criatura de uma linha pronta em
  **silhueta** (`BirthCard` `silhouette`), e o `UnlockNudge` com motivo
  `reveal-demo`; dispensar ou continuar leva ao `DEMO_PICK`. ⚠️ divergência: o
  `CLAUDE.md` ainda diz "os três personagens prontos" — ver [§59](#divergencias), D28.
- **Recusa do provedor de imagem**: a variante com referências é sempre a
  primeira, e `functions/api/generate-sprite.js` refaz sozinho com
  `imagePromptFallback` quando `isRefusal` — erro que não é recusa **não** refaz,
  para não dobrar custo à toa.
- **Enquanto o desenho não vem**, o reveal mostra o casulo — `BirthCard`
  `pending='forming'`, o cristal aceso de `PLACEHOLDER_ART` (`src/utils/placeholderArt.ts`)
  pulsando por POSIÇÃO numa região `role=status`; estourado o teto da espera,
  `pending='dormant'` (o cristal apagado: "ainda vai nascer"), **nunca `glitch`**
  (rachado = falhou + retry, e ali não há retry) e nunca arte de reserva. ⚰️ Até
  20/09/2026 o casulo **sumia** ao fim do tempo (canvas Onboarding-oráculo §31,
  D-Q6/D-Q11). Na Evolução, `EvolutionPath` usa o mesmo mapa: `GERANDO` →
  `forming` (rookie: `dormant`), `RESERVA_FINAL` → `glitch`.
- **Sigilo e aura da classe (canvas Pet §22, D-P4 e D9)**: `ClassTitle.sigilo`
  (`src/utils/soulProfile/ficha/classTitle.ts` → `sigiloDaClasse`) é a chave da
  peça de `sigilArt` que a Ficha desenha no canto do visor — a **escola** de maior
  limiar vence; sem escola, o elemento de maior limiar; sem nenhum (classe
  genérica), o elemento base dominante da ficha. É opcional: o cache
  `soulmonClassTitles` anterior a 20/09/2026 não o tem, e sem chave a Ficha **não
  desenha sigilo** (nunca inventa um) até a próxima recomputação. A aura vem de
  `auraForElement` (`src/utils/attackFxArt.ts`) pelo `dominantElement` do oráculo,
  com `planta` → `vida` e `industrial` → `aco` (`ORACLE_TO_FX`), porque esses dois
  não são elementos base do class-system; sem arte → `undefined` → sem aura.

**O que NÃO faz.** Não mostra diagnóstico de personalidade, pontuação de eixo
nem prompt. Não permite responder o teste longo depois. Não sorteia: o reroll é
determinístico. Não cobra no reveal (o convite de compra vem no *value moment*,
não ali). Não deixa o nome da criatura-inspiração do bestiário chegar a nenhum
prompt. Não muda mecânica nenhuma: todo pet é mecanicamente equivalente — muda
**quem** sua criatura é, nunca **o quanto** ela te ajuda.

**Onde a UI mostra.** `src/components/SoulmonOnboarding.tsx` (o ritual e o
reveal), `src/components/BirthCard.tsx`, `src/components/StatsPage.tsx` (o mesmo
cartão, depois), `src/components/NewReadingModal.tsx` e
`src/components/CreditsModal.tsx` (a nova leitura),
`src/components/OraclePage.tsx` (ferramenta de criação, fora da navegação),
`src/components/PetPage.tsx` (aura por `auraForElement` e sigilo por `sigilArt`
na Ficha), `src/components/EvolutionPath.tsx` (placeholders e aura).

---

<a id="meta-ponderada"></a>
## 23. ⚖️ Meta ponderada por esforço

**Em uma frase.** A meta do dia soma **peso de esforço** do que estava
cadastrado PARA AQUELE dia, limitado ao requisito do estágio — nunca uma
contagem de itens.

**A regra.** Dois passos, e o segundo é uma linha só:

```
registeredForDay(state, weekDay, dayKey)
  = activitiesForWeekDay(state, weekDay, dayKey).length × HABIT_WEIGHT
  + Σ normalizeEffort(t.effort)  para toda tarefa com countsForGoal(t)
  + tasksCompletedOn(state, dayKey)          // só quando o dayKey é passado

dailyGoalFor(state, weekDay, dayKey)
  = min( registeredForDay(...),
         FORM_REQUIREMENTS[getStageLevel(state.evolutionStage)].required )
```

| Constante / símbolo | Valor | O que faz |
|---|---|---|
| `HABIT_WEIGHT` (`src/types/taskModel.ts`) | 1 | peso fixo de um hábito. Hábito não tem esforço variável: o valor dele é ser repetido |
| `Effort` / `DEFAULT_EFFORT` (`src/types/taskModel.ts`) | 1 \| 2 \| 3, padrão 1 | rápida / média / projeto |
| `normalizeEffort` (`src/types/taskModel.ts`) | — | qualquer coisa que não seja 2 ou 3 vira `DEFAULT_EFFORT` |
| `FORM_REQUIREMENTS[...].required` (`src/types/progression.ts`) | por estágio (ver [§14](#escada)) | o TETO da meta |
| `countsForGoal` (`src/utils/dailyReset.ts`, privada) | `status === 'open'` | `someday` e `dropped` ficam de fora ([§31](#someday)) |

**Quem conta como "cadastrado hoje".** `activitiesForWeekDay` decide por
formato de recorrência ([§24](#recorrencia)): `weekdays` responde ao calendário
(quando `canSelectWeekdays` vale para o estágio); os flexíveis respondem a
`habitCountsOn` — a mesma função que a virada usa para julgar a FALTA. Sem
`dayKey` na chamada, o hábito flexível conta (comportamento antigo, declarado no
código como o padrão seguro: a meta maior nunca cobra a mais, porque o "feito"
sai da mesma lista).

**Dono.** `src/utils/dailyReset.ts` → `registeredForDay` e `dailyGoalFor`, com
`activitiesForWeekDay` e `tasksCompletedOn` como as duas fontes. As constantes
são de `src/types/taskModel.ts`; o teto é de `src/types/progression.ts`.
`src/utils/taskTriage.ts` → `weightOf` fornece o peso de uma tarefa isolada.

**Régua.** `src/utils/dailyGoal.contract.test.ts` (três camadas: diferencial,
acoplamento e origem, cada uma com autoverificação),
`src/utils/dailyGoalSources.test.ts`,
`src/utils/habitEligibility.regression.test.ts`, `src/utils/heartGoal.test.ts`,
`src/hooks/useProgressTracking.test.ts`, `src/utils/gameRules.fuzz.test.ts`.

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.2,
linha "Esforço 1–3; recompensa escala com esforço, NUNCA com contagem" (o
defeito documentado do Karma do Todoist) — e, na mesma tabela, a alternativa
**recusada** de baixar o `cap` para "proteger" quem cadastra demais.
[`docs/PLANO-TAREFAS.md`](../PLANO-TAREFAS.md) §2.3.

**Casos de borda.**
- **Save antigo**: sem o campo `effort`, `normalizeEffort` devolve 1 e peso ==
  contagem. Nenhum número que o jogador via muda de valor.
- **A tarefa que sai da lista**: `completeTask` REMOVE a tarefa de `tasks`, então
  sem `tasksCompletedOn` um dia em que a pessoa fez tudo ficaria idêntico a um
  dia em que ela não cadastrou nada.
- **Sábado com rotina de semana**: a cópia que lia `activities.length` cru cobrava
  no fim de semana uma meta que a virada não cobra — é a camada 1 do guard, que
  prova a divergência com números antes de proibir a forma.
- **Limite honesto do guard**: a regex de origem NÃO pega a fórmula escrita via
  variável intermediária; quem pega essa é a camada de acoplamento, que compara o
  RESULTADO de `computeDailyReset` com o de `dailyGoalFor`. Está escrito no
  próprio teste.
- **Guard de fonte no `App.tsx`**: `activities.length + tasks.length` está
  proibido por varredura — foi assim que o `EvolveTaskModal` dizia "você já tem
  tarefas suficientes" num sábado vazio.

**O que NÃO faz.** Não conta itens. Não passa do requisito do estágio. Não conta
`someday`/`dropped`. **Não é a meta que protege o coração** — essa é
`heartGoalFor`, que vale `HEART_GOAL_RATIO` da meta ([§1](#coracoes)). Não muda
a barra de energia exibida ([§6](#energia)).

**Onde a UI mostra.** `src/hooks/useProgressTracking.ts` (o progresso do dia,
que alimenta widget e humor do pet), `src/components/MorningCheckIn.tsx` ("carga
planejada"), `src/components/EvolveTaskModal.tsx` (`registeredTasks`),
`src/components/NotificationManager.tsx` (`totalRequired`),
`src/components/GuideModal.tsx` e `src/components/HelpModal.tsx` (os números
saem das constantes).

---

<a id="recorrencia"></a>
## 24. 🔁 Recorrência

**Em uma frase.** Um hábito se repete de três jeitos, e o terceiro existe para
que sumir por um mês devolva UMA ocorrência, não trinta.

**A regra.** `Schedule` (`src/types/taskModel.ts`) é uma união de três:

| `kind` | Campos | Quem julga o cumprimento |
|---|---|---|
| `weekdays` | `days: number[]` (0 = domingo) | o calendário |
| `timesPerWeek` | `target: number` (1–7 após `normalizeSchedule`) | `weeklyProgress`, nunca o calendário |
| `everyNDays` | `n: number` (≥1), `from: 'schedule' \| 'completion'` | `isDueOn` |

- **`from: 'completion'`** — o `every!` do Todoist, e o item declarado como "o
  mais importante" do arquivo: `isDueOn` responde `true` quando não há
  `lastCompletedDate` e, depois disso, só quando `daysBetween(última conclusão,
  dia) >= n`. Contando da CONCLUSÃO é **estruturalmente impossível** acumular
  atrasadas.
- **`from: 'schedule'`** — conta de uma âncora ESTÁVEL (`scheduleAnchor`: a
  primeira conclusão registrada; antes dela, a época). Devido quando o offset em
  dias é múltiplo de `n`.
- **`ROUTINE_PRESETS`** (`diario` / `uteis` / `leve` = `[1,3,5]`) são a escolha de
  um toque na criação; `presetDeRotina` diz qual preset descreve uma seleção, ou
  `null` para personalizada.

**Compatibilidade.** `normalizeSchedule` lê `weekDays: number[]` antigo como
`{kind:'weekdays'}` e valida cada variante antes de aceitá-la;
`weekDaysForSchedule` devolve `[0..6]` para os formatos flexíveis, porque
`weekDays` continua sendo a interface com o widget Android e com o overlay de
desktop, que não carregam este motor. Quem escreve grava os **dois** campos.

**Dono.** `src/types/taskModel.ts` → `Schedule`, `normalizeSchedule`,
`weekDaysForSchedule`, `ROUTINE_PRESETS`, `presetDeRotina`.
`src/utils/habitRhythm.ts` → `isDueOn`, `weeklyProgress`, `weekStart` e
**`habitCountsOn`**, que é o dono único da pergunta "este hábito conta neste
dia?" — a pergunta já esteve implementada três vezes, a partir de duas fontes de
dados diferentes.

**Régua.** `src/utils/habitRhythm.test.ts` (bloco `isDueOn — cada tipo de
Schedule`), `src/utils/habitEligibility.regression.test.ts` (os três consumidores
respondendo o mesmo), `src/components/CreateModal.presets.render.test.tsx`.

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.2,
linhas "Recorrência contada da CONCLUSÃO" e "3× por semana";
[`docs/PLANO-TAREFAS.md`](../PLANO-TAREFAS.md) §2.1. Os presets são P4 de
`product/soulmon-01/balance/carga-diaria.md`.

**Casos de borda.**
- **`timesPerWeek` é sempre elegível em `isDueOn`** e limitado em `habitCountsOn`:
  conta enquanto `weeklyProgress().done < target`, e o dia em que a meta foi
  cumprida continua contando (senão o crédito sumiria junto com a cobrança).
  Depois disso, os dias restantes são de graça.
- **Semana começa no DOMINGO** (`weekStart`), a mesma convenção do `weekDays` que
  o widget e o desktop leem. Duas convenções produziriam um "2 de 3" que discorda
  de si mesmo entre telas.
- **Hábito de intervalo cobrado em dia não devido** ⚰️ — não acontece mais: era o
  caso medido em que a META contava todo hábito flexível todo dia enquanto a
  FALTA era julgada por `isDueOn`, e custava 1 coração em ~2 de cada 3 dias.
- **Save sem `schedule`**: `normalizeSchedule` cai em `weekdays` com os sete dias
  quando também não há `weekDays`.

**O que NÃO faz.** Não gera instâncias atrasadas (não existe fila de ocorrências
— existe um histórico de dayKeys). Não decide sozinha se o hábito conta hoje:
quem decide é `habitCountsOn`. Não escreve nada no save por si — é tipo e função
pura.

**Onde a UI mostra.** `src/components/CreateModal.tsx` (presets + grade
"Personalizar"), `src/components/HabitConstancy.tsx` (a janela de pontos),
`src/components/QuickAddBar.tsx` e `src/utils/quickAdd.ts` ([§35](#quickadd),
que sabe escrever as três variantes a partir de uma linha de texto).

---

<a id="constancia"></a>
## 25. 📈 Constância

**Em uma frase.** A régua de um hábito é "N das últimas 7", e uma falha custa
uma fração — nunca tudo.

**A regra.** `constancy(rhythm, now, windowDays = CONSTANCY_WINDOW_DAYS)`:

```
janela  = [now − (windowDays − 1) dias, meia-noite de now]
done    = |done ∩ janela| + |shielded ∩ janela|
window  = done + |missed ∩ janela|
ratio   = window === 0 ? 1 : done / window
```

| Constante | Valor | Onde |
|---|---|---|
| `CONSTANCY_WINDOW_DAYS` | 7 | `src/types/taskModel.ts` |
| `HISTORY_CAP` | 120 | `src/utils/habitRhythm.ts` — teto de dayKeys por lista |
| `STEADY_WINDOW_DAYS` | 28 | `src/utils/habitRhythm.ts` — a aura "firme", puramente estética |

O `HabitRhythm` guarda `done` / `missed` / `shielded` (conjuntos de dayKeys),
`shields`, `totalDone`, `lastCompletedDate` e `lastShieldAt`. **`totalDone`
existe para a poda em `HISTORY_CAP` não roubar marco de ninguém** — o marco de 66
dias é atingido muito depois do teto de 120. `completeHabit` é idempotente,
apaga uma falta do MESMO dia e não devolve escudo já gasto.

**Dono.** `src/utils/habitRhythm.ts` → `constancy`, `emptyRhythm`,
`completeHabit`, `dayKeyOf`, `steadyWindow`. A unidade de dia deste motor é
`dayKeyOf` = `Date.toDateString()`, **que não é o dia do jogador** ([§5](#dia-do-jogador)):
`dayKeyOf` é a chave do motor de hábitos, de `perfectDays` e do gatilho de
virada, e redefini-la dispararia virada espúria em todo save existente.

**Régua.** `src/utils/habitRhythm.test.ts` (inclusive o teste "nunca existe um
streak que zera"), `src/utils/habitEligibility.regression.test.ts`,
`src/components/HabitConstancy.hideMetrics.render.test.tsx`.

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.1
(as 5 regras sobre perda) e §5.2 ("Hábito novo nasce em ratio 1 — progresso
dotado", Nunes & Drèze); [`docs/PLANO-TAREFAS.md`](../PLANO-TAREFAS.md) §2.1. O
embasamento (Lally et al. 2010; *what-the-hell effect*) está no cabeçalho do
módulo.

**Casos de borda.**
- **Hábito novo** devolve `ratio` 1 (`window === 0`): ninguém começa em 0%.
- **Dia protegido por escudo conta como FEITO** ([§26](#escudos)) — um escudo que
  salva a sequência e derruba o percentual não salva nada.
- **Denominador**: sai do histórico (dias registrados), e não do `Schedule`,
  porque `everyNDays from:'completion'` só sabe quais dias eram devidos olhando o
  que aconteceu. Efeito: um "3× por semana" não aparece como 43%.
- **Poda**: `capped` corta pelas ENTRADAS mais antigas; `totalDone` sobrevive.
- ⚠️ **divergência**: a tabela do [`CLAUDE.md`](../../CLAUDE.md) não registra a
  aura `STEADY_WINDOW_DAYS` (28 dias sem falta e sem escudo, `steadyWindow`) nem
  as falas de meio de caminho `HABIT_CHEER_AT` (`[3, 36, 51]`, `cheerReached`).
  As duas existem no código, com teste, e não contradizem nada da tabela — mas a
  fonte da verdade não as menciona.

**O que NÃO faz.** **Não existe streak que zera** — se alguém acrescentar um
campo `streak` que volta a 0 em `applyMissedDay`, desfez a tese do produto (há
teste). Não tira HP: a falta de hábito não gera perda de coração própria
([§1](#coracoes)). A aura "firme" **não dá nada** (nem Bits, nem atributo, nem
ponto) e some em silêncio.

**Onde a UI mostra.** `src/components/HabitConstancy.tsx` (janela de pontos com
FORMA própria por estado: cheio / losango / anel vazado / traço, além da cor),
`src/components/MorningCheckIn.tsx`, `src/components/WeeklyReportCard.tsx`
([§38](#relatorio-semanal)).

---

<a id="escudos"></a>
## 26. 🛡️ Escudos de descanso

**Em uma frase.** Quem vem indo bem acumula até três proteções, e elas são
gastas **sozinhas** no dia em que a falta acontece.

**A regra.**

```
earnShield(rhythm, now):
  shields >= REST_SHIELD_MAX                                        → não concede
  lastShieldAt e daysBetween(lastShieldAt, now) < REST_SHIELD_EARN_EVERY_DAYS → não concede
  constancy(rhythm, now, REST_SHIELD_EARN_EVERY_DAYS):
    window === 0 ou ratio < GOOD_CONSTANCY_RATIO                    → não concede
  senão → shields + 1, lastShieldAt = dayKeyOf(now)

applyMissedDay(rhythm, dayKey):
  dia já registrado (done/missed/shielded) → devolve o MESMO ritmo
  shields > 0 → shields − 1 e dayKey entra em `shielded`
  senão       → dayKey entra em `missed`
```

| Constante | Valor | Onde |
|---|---|---|
| `REST_SHIELD_MAX` | 3 | `src/types/taskModel.ts` |
| `REST_SHIELD_EARN_EVERY_DAYS` | 7 | `src/types/taskModel.ts` |
| `GOOD_CONSTANCY_RATIO` | `5 / CONSTANCY_WINDOW_DAYS` | `src/utils/habitRhythm.ts` — literalmente o "5 das últimas 7" que o app exibe |

**Dono.** `src/utils/habitRhythm.ts` → `earnShield` e `applyMissedDay`. **A
cadência mora na função, não no chamador**: `computeDailyReset` só chama.

**Régua.** `src/utils/habitRhythm.test.ts` (bloco `escudos de descanso`),
`src/utils/habitEligibility.regression.test.ts` (cadência de 7 dias e
idempotência da virada), `src/utils/dailyReset.escudos.test.ts` (o registro do
gasto na virada, WP2.15).

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.1;
[`docs/PLANO-TAREFAS.md`](../PLANO-TAREFAS.md) §2.1. O precedente é o Streak
Freeze do Duolingo, que só virou mecânica de retenção quando passou a vir
equipado por padrão — e o contraexemplo é a Pousada do Habitica, que exige
lembrar de ativar antes de falhar.

**Casos de borda.**
- **Escudo infinito** ⚰️ — a cadência era do chamador e a virada concedia um
  escudo por hábito por dia: o teto 3 era atingido em três dias, toda falta era
  absorvida, `missed[]` parava de crescer e `needsIntervention`
  ([§27](#never-miss-twice)) virava **inalcançável**. `lastShieldAt` é o campo que
  fechou isso; ele é opcional, e ausente significa "nunca concedeu".
- **Virada dupla** (StrictMode, aba reaberta, relógio ajustado): `applyMissedDay`
  é idempotente por dayKey — nunca gasta dois escudos pela mesma falta; e
  `earnShield` não concede dois no mesmo dia.
- **Quem não abre o app** não acumula proteção: `window === 0` na janela de 7 dias
  não é constância a premiar.
- **Conclusão tardia** não devolve escudo já gasto (`completeHabit` limpa a falta,
  não o `shielded`).

**O que NÃO faz.** **Não protege o coração** — o escudo repara a CONSTÂNCIA, e a
perda de HP tem as travas dela ([§1](#coracoes)); há teste com esse nome exato.
Não pede ativação, não tem botão, não aparece como número no widget (a chave
`shields` do bridge está vetada; desde 06/09/2026 vai uma FAIXA, `habit_steady`). Não impede
que o dia entre em `shielded` no cálculo da janela pura ([§25](#constancia)).

**Onde a UI mostra.** `src/components/HabitConstancy.tsx` (o dia protegido tem
forma e cor de PROTEGIDO, nunca de falha; o total usa `REST_SHIELD_MAX`),
`src/components/MorningCheckIn.tsx`. O gasto da virada é gravado em
`lastDayReport.shieldsSpent` (`computeDailyReset`, WP2.15) e, em 09/09/2026, **era lido só pela
telemetria** (`track('shield_used')`, no `src/App.tsx`) — nenhuma tela o desenha.

---

<a id="never-miss-twice"></a>
## 27. 🚫 Never miss twice

**Em uma frase.** A primeira falha não gera nada visível; na segunda seguida o
pet oferece uma versão de cinco minutos, e aceitar conta como feito.

**A regra.**

```
consecutiveMisses(rhythm, now)
  = quantas faltas seguidas há, andando para trás pelos dias REGISTRADOS
    (done / missed / shielded) até a meia-noite de `now`, parando na primeira
    coisa que não é falta
needsIntervention(rhythm, now) = consecutiveMisses(...) >= MISS_INTERVENTION_AT
```

`MISS_INTERVENTION_AT` = 2 (`src/types/taskModel.ts`). É `>=` e não `===` de
propósito: o pet continua oferecendo no terceiro e no quarto dia — parar de
oferecer justo quando a pessoa mais precisa seria abandoná-la por tecnicalidade.

**Dono.** `src/utils/habitRhythm.ts` → `consecutiveMisses`, `needsIntervention`.
Quem monta a oferta é `src/utils/rituals.ts` → `checkInPlan`, no campo
`tinyOffer` (os ids dos hábitos devidos hoje que passaram no `needsIntervention`).
Aceitar chama o MESMO caminho de conclusão de sempre
(`onTinyHabit` → `handleToggleActivityCompletion` no `src/App.tsx`).

**Régua.** `src/utils/habitRhythm.test.ts` (bloco `never miss twice`),
`src/utils/habitEligibility.regression.test.ts` ("`needsIntervention` é
ALCANÇÁVEL"), `src/components/MorningCheckIn.ofertaReduzida.render.test.tsx`.

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.1;
[`docs/PLANO-TAREFAS.md`](../PLANO-TAREFAS.md) §2.1. Modelo do Finch (o pet
oferece uma meta menor), oposto exato do dano de HP do Habitica.

**Casos de borda.**
- **Dias sem registro não quebram nem alimentam a contagem**: para um `3× por
  semana` ou um `everyNDays`, a maior parte do calendário não era devida.
- **Dia protegido por escudo interrompe a sequência** — foi comprado de volta.
- **Mecânica morta** ⚰️ — até WP2.10, `needsIntervention` tinha teste e nenhum
  chamador: o guia prometia por escrito que o pet ofereceria a versão menor, e o
  pet nunca oferecia nada.
- **A oferta nunca diz quantas faltas houve** (há teste) e **não tem botão de
  recusar**: ignorar é a recusa, e não custa nada.
- `soulStruggle` ([§21](#soulgoal)), quando existe, dá a introdução da oferta
  (`tinyOfferIntro`); quem pulou a pergunta vê a oferta genérica.

**O que NÃO faz.** Não gera alerta na primeira falha. Não tira nada de ninguém.
Não vira push. Não é reduzida a "faltam N dias" — nenhum número de dívida
aparece.

**Onde a UI mostra.** `src/components/MorningCheckIn.tsx` (a oferta reduzida,
dentro do check-in — [§37](#checkin)).

---

<a id="marcos"></a>
## 28. 🌳 Marcos de hábito

**Em uma frase.** Aos 7, 21 e 66 dias efetivos o hábito muda de degrau, rende
mais atributo e ganha uma cerimônia que **espera o gesto** do jogador.

**A regra.**

```
habitTier(totalDone)  = tree (>= 66) | sapling (>= 21) | sprout (>= 7) | seed
attributeMultiplier(totalDone) = 1 + HABIT_TIER_BONUS[habitTier(totalDone)]
milestoneReached(before, after) = o tier NOVO quando o degrau mudou, senão null
```

| Constante | Valor | Onde |
|---|---|---|
| `HABIT_MILESTONES` | `[7, 21, 66]` | `src/types/taskModel.ts` |
| `HABIT_TIER_BONUS` | seed 0 · sprout 0,1 · sapling 0,2 · tree 0,3 | `src/types/taskModel.ts` |
| `HABIT_TIER_ICONS` | 🌱 · 🌿 · 🌾 · 🌳 | `src/types/taskModel.ts` — o glifo da lista; ⚰️ a cerimônia não o usa mais desde 20/09/2026 (`4f5d2aac`; decisão do lead de 16/09/2026) |
| `TIER_EMBLEM` | sprout → `habit-7` · sapling → `habit-21` · tree → `habit-66` · seed → nenhum | `src/utils/emblemArt.ts` → `emblemFor(tier)` — o emblema pixel 64² que a cerimônia desenha no vidro (canvas Rituais, achado 10 / X4) |
| `HABIT_CHEER_AT` | `[3, 36, 51]` | `src/types/taskModel.ts` — falas, **não** marcos |

Os 66 dias são a mediana medida por Lally et al. (2010), faixa de 18 a 254. Os
"21 dias" populares são de Maxwell Maltz (1960), sobre pacientes de cirurgia
plástica.

**Dono.** `src/utils/habitRhythm.ts` → `habitTier`, `habitTierIcon`,
`attributeMultiplier`, `milestoneReached`. A cerimônia é
`src/components/MilestoneCeremony.tsx`, disparada por
`celebrateHabitMilestone` no `src/App.tsx`; a arte do marco é `emblemFor`
(`src/utils/emblemArt.ts`), e os mesmos três emblemas são as conquistas
`habit-7`/`habit-21`/`habit-66` de [§57-A](#conquistas) — um marco, uma peça. As falas de meio de caminho são
`cheerReached` (`src/types/taskModel.ts`).

**Régua.** `src/utils/habitRhythm.test.ts` (bloco `marcos de maturidade`, com o
teste "o rendimento de atributo só sobe — nunca desce"),
`src/utils/cheer.test.ts` (fala ≠ marco),
`src/components/MilestoneCeremony.render.test.tsx`,
`src/styles/emojiSuportado.contract.test.ts` (todo glifo tem de ser Emoji 11.0 ou
anterior — `🪴` renderizava como caixa vazia).

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.2,
linha "Marcos em 7 / 21 / 66 dias"; [`docs/PLANO-TAREFAS.md`](../PLANO-TAREFAS.md)
§2.1. A cerimônia é WP2.4 e a correção de z-index/movimento reduzido é da
auditoria de 06/09/2026 (ver [§59](#divergencias) e [`docs/STATUS.md`](../STATUS.md)).

**Casos de borda.**
- **A festa toca UMA vez**: `milestoneReached` compara antes/depois, então nada de
  estado de UI dentro do save e nada de recompensa disparando a cada reload.
- **Poda do histórico**: o degrau lê `totalDone`, que não é podado — por isso o
  marco de 66 continua alcançável com `HISTORY_CAP` em 120.
- **Movimento reduzido reduz o MOVIMENTO, nunca a pausa**: a cerimônia é a mesma,
  só as animações e o háptico somem. ⚰️ Antes ela caía para o `toast.success` de
  concluir qualquer tarefa.
- **z-index 300**, acima dos intersticiais (200) — ⚰️ ela vivia em 60, ou seja,
  o marco de 66 dias era comemorado por baixo do check-in.
- **Aparelho sem `vibrate`**: nada quebra (há teste).
- **Fala não é marco**: cruzar 3, 36 ou 51 dias não muda tier, ícone nem
  rendimento, e nenhuma fala diz quanto falta (há teste varrendo).

**O que NÃO faz.** Não fecha sozinha (não há timer de saída). Não dá moeda. O
multiplicador **nunca fica abaixo de 1** — esforço antigo vale mais, nunca menos.
Não muda a lista de marcos por acidente: se `HABIT_CHEER_AT` passar a dar algo, a
escada de maturidade ganha seis degraus sem ninguém ter decidido isso.

**Onde a UI mostra.** `src/components/MilestoneCeremony.tsx` (com a DATA — marco é
memória, não aviso — e o emblema de `emblemFor(tier)` a 64 no vidro, no lugar do
`tierIcon` emoji), `src/components/HabitConstancy.tsx` (o glifo que se preenche
na lista), `src/components/CompanionHUD.tsx` (a fala `milestone`).

---

<a id="assombrada"></a>
## 29. 👻 Tarefa assombrada

**Em uma frase.** Tarefa vencida ou parada há uma semana esmaece, ganha aura
escura e o pet olha para ela — e concluí-la é a coisa mais recompensada do laço.

**A regra.**

```
daysStale(task, now) = dias inteiros desde lastTouchedAt ?? createdAt (0 se não há nenhum)
isHaunted(task, now) = isActive(task) && (isOverdue(task, now) || daysStale(...) >= HAUNTED_AFTER_DAYS)
isOverdue(task, now) = deadlineAt(task) < now      // hora padrão 23:59
```

`HAUNTED_AFTER_DAYS` = 7 (`src/types/taskModel.ts`).

**O bônus de alívio**, aplicado no `src/App.tsx` ao concluir: **uma comida extra**
da categoria da tarefa (`FOOD_BY_CATEGORY`), a fala PRÓPRIA `haunted`
(`falar('haunted')`, distinta da fala de conclusão comum), a animação de comida e
um toast. Também conta a missão semanal `haunted-done` e a telemetria
`haunted_done`. Tudo calculado **fora** do updater (footgun 6 — dentro, o
StrictMode daria comida em dobro).

⚠️ **divergência**: a tabela do [`CLAUDE.md`](../../CLAUDE.md) descreve o bônus só
como "comemoração maior"; no código ele inclui **uma comida** — recompensa
material, ainda que a mesma que qualquer conclusão já dá.

**Dono.** `src/utils/taskTriage.ts` → `isHaunted`, `daysStale`, `isOverdue`,
`deadlineAt`, `parseDayValue`. O olhar é `hauntedWatching` no `src/App.tsx` →
classe `sm-pet-haunted` em `src/components/CompanionHUD.tsx`.

**Régua.** `src/utils/taskTriage.test.ts` (blocos `saves antigos…` e
`assombração (aging)`, incluindo a fronteira exata de `HAUNTED_AFTER_DAYS`),
`src/components/CompanionHUD.voz.render.test.tsx` (o pet olha, e o olhar é gesto:
o teste reprova qualquer texto de cobrança junto), `src/components/TaskMeta.render.test.tsx`.

**Decisão.** [`docs/PLANO-TAREFAS.md`](../PLANO-TAREFAS.md) §2.2;
[`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.2 (a pilha de
atrasadas como causa nº 1 documentada de abandono da categoria). O olhar é WP3.2,
06/09/2026 — até então a promessa existia no `CLAUDE.md` e não havia uma
ocorrência de `haunted` no `CompanionHUD.tsx`.

**Casos de borda.**
- **Save antigo sem `createdAt`/`lastTouchedAt`**: idade **0**. Nunca assombrar em
  massa o backlog de quem só atualizou o app.
- **`someday` e `dropped` nunca assombram** ([§31](#someday)) — se a lista inerte
  envelhecesse, mandar algo para lá não aliviaria nada.
- **Adiar não "descansa" a tarefa**: `postpone` atualiza `lastTouchedAt`, então
  ela assombra pelo CONTADOR ([§30](#adiamentos)), que é o sinal mais honesto.
- **`'YYYY-MM-DD'`** é lido no fuso LOCAL por `parseDayValue` — `new Date()` puro o
  interpretaria como UTC e viraria o dia anterior a oeste de Greenwich.
- **Prazo de hoje com hora ainda por vir não está vencido** (há teste).

**O que NÃO faz.** Não pinta de vermelho (o roxo `--sm-haunt-ink`/`--sm-haunt-veil`
é a mecânica, não estética — e o esmaecimento é por COR dedicada, nunca por
`opacity` global, que derrubava o contraste para 1,92:1 no tema escuro). Não
manda push. Não bloqueia nada. O olhar **não vem com texto**.

**Onde a UI mostra.** `src/components/TaskMeta.tsx` (a faixa de metadados da
tarefa), `src/components/CompanionHUD.tsx` (o sprite se inclina),
`src/components/TriagePile.tsx` ([§34](#triagem)).

---

<a id="adiamentos"></a>
## 30. 🕒 Adiamentos

**Em uma frase.** O app conta quantas vezes a tarefa foi movida e, na terceira,
o pet oferece três saídas — nenhuma delas é "faça logo isso".

**A regra.**

```
postpone(task, now, startDate?) → postponedCount + 1, lastTouchedAt = now, startDate opcional
needsPostponeNudge(task)        → (postponedCount ?? 0) >= POSTPONE_NUDGE_AT
shrink(task, now?)              → effort = max(1, effort − 1) E postponedCount = 0
```

`POSTPONE_NUDGE_AT` = 3 (`src/types/taskModel.ts`).

As três saídas do sheet: **decompor** (chama a IA de sugestões,
[§35](#quickadd)), **encolher** (`shrink`) e **deixar pra lá** (`drop`,
[§31](#someday)). Não existe uma quarta opção com peso de fracasso — o X fecha e
nada acontece, e o texto diz isso.

**Dono.** `src/utils/taskTriage.ts` → `postpone`, `needsPostponeNudge`, `shrink`.
O sheet é `PostponeNudgeSheet`, no `src/App.tsx`.

**Régua.** `src/utils/taskTriage.test.ts` (blocos `adiamento e o nudge do
Sunsama` e `encolher`, com o piso 1 e o zeramento do contador),
`src/components/TaskMeta.render.test.tsx`.

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.2,
linha "Contador de adiamentos visível; intervenção em 3" (Sunsama, "movida 7
vezes"); [`docs/PLANO-TAREFAS.md`](../PLANO-TAREFAS.md) §2.2.

**Casos de borda.**
- **O zeramento no `shrink` é a metade importante**: a tarefa mudou, então o
  histórico de adiamento dela deixou de descrever algo verdadeiro. Carregar a
  marca puniria a decisão certa.
- **Piso de esforço 1**: encolher uma tarefa rápida não a apaga (e o botão fica
  indisponível quando `effortOf(task) === 1`).
- **Mecânica morta** ⚰️ — o nudge existia inteiro e não era ligado: `shrink` tinha
  teste, o `GuideModal` prometia as três ações em PT e EN, o `TaskMeta` desenhava
  o contador sublinhado, e ninguém passava `onPostponeNudge`; tocar no chip não
  fazia nada.
- **A decomposição depende de rede**: `suggestTasks` devolve `[]` em qualquer
  falha, e "não veio nada" (`empty`) tem texto próprio e caminho manual, separado
  de "quebrou" (`error`) — quem já estava evitando a tarefa não pode encontrar um
  spinner eterno.
- **Trocar de tarefa zera o painel** do sheet, senão o próximo abriria com as
  sugestões da anterior.

**O que NÃO faz.** Não esconde a tarefa. Não reagenda sozinho. Não bloqueia adiar
de novo. Não transforma o contador em cobrança escrita — o número é um dado, e a
diferença entre "eu sou preguiçoso" e "esta tarefa foi adiada 3 vezes" é a
diferença entre culpa e decisão.

**Onde a UI mostra.** `src/components/TaskMeta.tsx` (o contador),
`PostponeNudgeSheet` no `src/App.tsx` (as três saídas),
`src/components/TriagePile.tsx` (a ação `week` é um adiamento CONTADO).

---

<a id="someday"></a>
## 31. 💤🌙 Algum dia / Deixar pra lá

**Em uma frase.** Duas saídas honestas para uma tarefa que não vai acontecer —
uma inerte e outra terminal —, e nenhuma delas apaga o contexto.

**A regra.** `TaskStatus` = `open | someday | dropped`
(`src/types/taskModel.ts`); `taskStatus(task)` devolve `'open'` para qualquer
coisa que não seja `someday`/`dropped` (é o que faz save antigo funcionar), e
`isActive(task)` é `taskStatus === 'open'`.

| Função | O que muda | Detalhe que é regra |
|---|---|---|
| `toSomeday(task, now)` | `status='someday'`, `postponedCount=0`, `focusDate=undefined`, `lastTouchedAt=now` | quem move para "algum dia" não está adiando mais uma vez |
| `toOpen(task, now)` | `status='open'`, `lastTouchedAt=now` | volta SEM assombrar — ela ficou parada porque a pessoa decidiu |
| `drop(task, now)` | `status='dropped'`, `lastTouchedAt=now` | terminal, e reversível |
| `restore(task, now)` | `status='open'`, `lastTouchedAt=now` | sem ela, "deixar pra lá" seria um delete com passo extra |

Item inativo **não entra na meta do dia** ([§23](#meta-ponderada), via
`countsForGoal`), **não envelhece** ([§29](#assombrada)), **não entra na carga**
([§33](#carga)), **não vira foco** ([§32](#foco)) e **não entra na fila de
triagem** ([§34](#triagem)).

**Dono.** `src/utils/taskTriage.ts` → `taskStatus`, `isActive`, `toSomeday`,
`toOpen`, `drop`, `restore`. O tipo é de `src/types/taskModel.ts`.

**Régua.** `src/utils/taskTriage.test.ts` (blocos `someday é deliberadamente
inerte` e `deixar pra lá tem volta`).

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.2,
linha "Deixar pra lá como estado terminal digno" (TickTick *Won't Do*, Things 3
*Someday*); [`docs/PLANO-TAREFAS.md`](../PLANO-TAREFAS.md) §2.2. É esta saída que
quebra o ciclo de **falência periódica** — apagar tudo e recomeçar —, o padrão de
uso dominante do mercado.

**Casos de borda.**
- **Save antigo sem `status`**: `'open'`, porque toda tarefa gravada antes deste
  motor é, por definição, viva.
- **`someday` vencida há um ano continua não assombrando** (há teste): se ela
  envelhecesse, a lista inerte seria só o backlog com outro nome.
- **Voltar do `someday` limpa o relógio de abandono** — `lastTouchedAt` é
  atualizado, então a tarefa não reaparece já com a partícula escura.
- **`drop` NÃO é delete**: preserva por que a tarefa entrou na lista, quanto tempo
  ficou e quantas vezes foi adiada.

**O que NÃO faz.** Não deleta. Não marca como concluída (isso seria mentira, e uma
lista com mentira dentro deixa de valer como registro). Não conta em nada que
pontue. Não some da base — as duas listas continuam consultáveis.

**Onde a UI mostra.** `src/components/TriagePile.tsx` (duas das quatro saídas),
`PostponeNudgeSheet` no `src/App.tsx` ("deixar pra lá"), a lista de atividades da
Home (com o caminho de `restore`).

---

<a id="foco"></a>
## 32. 🎯 Foco do dia

**Em uma frase.** Até três tarefas escolhidas no check-in; completar as
escolhidas rende o selo do dia.

**A regra.**

```
setFocus(tasks, ids, dayKey):
  percorre `ids` na ORDEM recebida, aceita só tarefas ativas,
  para em MAX_DAILY_FOCUS → grava focusDate = dayKey
  e LIMPA o focusDate das demais NAQUELE dia (foco de outro dia não é assunto)

focusComplete(tasks, completedTasks, dayKey):
  pendentes = focos do dia ainda na lista, não concluídos
  doneFocus = focos que saíram da lista + os marcados
  pendentes + doneFocus === 0 → false     // não existe selo por omissão
  senão                        → pendentes.length === 0
```

`MAX_DAILY_FOCUS` = 3 (`src/types/taskModel.ts`), e o número é a mecânica: é o
Sunsama sem os 20 minutos de planejamento.

⚠️ **divergência**: a tabela do [`CLAUDE.md`](../../CLAUDE.md) ("as 3 completas =
selo do dia") e os textos de `src/components/GuideModal.tsx` e
`src/components/HelpModal.tsx` ("completar os 3 rende o selo") afirmam que são
**três**. O código exige **todos os focos escolhidos**: quem escolheu um e o
concluiu recebe o selo (`focusComplete` só é `false` quando não há foco nenhum ou
quando sobra pendente). Três é o TETO, não o requisito.

**Dono.** `src/utils/taskTriage.ts` → `setFocus`, `focusTasks`, `focusComplete`,
`sameDay`. Quem sugere os candidatos é `src/utils/rituals.ts` → `checkInPlan`
(pendências de ontem primeiro, depois assombradas, depois o mais pesado); quem
grava é `completeCheckIn`, que **chama** `setFocus` em vez de reimplementá-lo.

**Régua.** `src/utils/taskTriage.test.ts` (bloco `foco do dia`),
`src/components/pixel/HomeHud.selo.render.test.tsx` (o selo é binário — nunca "2
de 3"), `src/components/MorningCheckIn.commit.render.test.tsx`.

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.2
("Otimizar o PLANEJAR, não o marcar o check" — Masicampo & Baumeister);
[`docs/PLANO-TAREFAS.md`](../PLANO-TAREFAS.md) §2.4.

**Casos de borda.**
- **`completeTask` remove a tarefa de `tasks`**: sem olhar `completedTasks`, o
  selo desapareceria exatamente para quem fez tudo.
- **`focusDate` gravado como ISO ou como `'YYYY-MM-DD'`** (o valor cru de um
  `<input type="date">`): `sameDay` normaliza os dois lados. Comparar string com
  string quebraria em silêncio em metade dos casos.
- **Tarefa `someday` não vira foco** (há teste).
- **Foco de outro dia é preservado** por `setFocus`.
- **Mecânica morta** ⚰️ — `focusComplete` teve teste e nenhum chamador até WP2.12,
  enquanto o guia já prometia o selo.

**O que NÃO faz.** Não prioriza no lugar do usuário (o corte é pela ordem dos
`ids` que o chamador passa). Não dá moeda nem atributo. Não entra em dia completo
([§7](#dia-completo)), HP ou evolução. Não mostra progresso parcial.

**Onde a UI mostra.** `src/components/MorningCheckIn.tsx` (a escolha),
`src/components/pixel/HomeHud.tsx` (`focusSealed`, ao lado da marca).

---

<a id="carga"></a>
## 33. ⚠️ Carga do dia

**Em uma frase.** O app soma o esforço planejado para o dia e, acima de um
limite, o pet comenta — e é só isso que ele faz.

**A regra.**

```
plannedEffort(tasks, activities, dayKey, rhythms?)
  = Σ weightOf(t)  para tarefa ATIVA, não concluída, com startDate OU focusDate no dia
  + habitCountsOn(a, rhythms[a.id], dia) → conta × HABIT_WEIGHT
isOvercommitted(effort) = effort > OVERCOMMIT_EFFORT
```

`OVERCOMMIT_EFFORT` = 7 (`src/types/taskModel.ts`). O corte é **estritamente
acima**: 7 pontos não dispara nada; 8 dispara.

**Dono.** `src/utils/taskTriage.ts` → `plannedEffort`, `isOvercommitted`. A
elegibilidade do hábito NÃO é decidida aqui: vem de `habitCountsOn`
(`src/utils/habitRhythm.ts`) — ⚰️ este filtro já leu `a.weekDays` cru e era a
terceira cópia da mesma pergunta.

**Régua.** `src/utils/taskTriage.test.ts` (bloco `carga do dia é PONDERADA, nunca
contada`, com "o aviso de sobrecarga dispara ACIMA de `OVERCOMMIT_EFFORT`"),
`src/utils/rituals.test.ts`, `src/utils/petNeeds.test.ts`.

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.2,
linha "Carga do dia é AVISO, nunca bloqueio" (*The Freedom Fallacy*: autonomia é
volição, não ausência de direção); [`docs/PLANO-TAREFAS.md`](../PLANO-TAREFAS.md)
§2.3. O contraexemplo declarado é o Motion, odiado por decidir no lugar do
usuário.

**Casos de borda.**
- **Uma tarefa de esforço 3 pesa como três de esforço 1** — sem isso o medidor
  diria "seu dia está leve" para quem planejou dois projetos.
- **Tarefa já concluída não pesa mais**; tarefa de outro dia não entra; foco do
  dia entra mesmo sem `startDate`.
- **`dayKey` ilegível** → a carga de hábitos é 0 (o filtro precisa de uma data
  válida para consultar o histórico).
- **Segundo consumidor**: `tiredness` (`src/utils/petNeeds.ts`) usa
  `isOvercommitted(plannedEffort(..., ONTEM))` para o pet aparecer sonolento. O
  efeito é **apenas cosmético/narrativo** — não reduz recompensa, não trava ação e
  não entra em dia completo, HP ou evolução.

**O que NÃO faz.** **Não bloqueia.** Não impede marcar foco, não recusa criar
tarefa, não reagenda nada, e o botão de confirmar o check-in continua ativo com o
aviso na tela. Se alguém quiser barrar uma ação com este retorno, o certo é mudar
o TEXTO, não a permissão. Não vira push. Não tira ponto.

**Onde a UI mostra.** `src/components/MorningCheckIn.tsx` ("Carga planejada: N
pontos" + o aviso `role="status"`, com o texto "Isso é bastante pra um dia só —
quer deixar uma pra amanhã? (Tudo bem se não.)"), `src/components/GuideModal.tsx`
e `src/components/HelpModal.tsx` (o número sai da constante),
`src/components/CompanionHUD.tsx` (o pet sonolento).

---

<a id="triagem"></a>
## 34. 🧹 Arrumar a pilha (triagem)

**Em uma frase.** Tudo que está atrasado ou assombrado vira uma fila de cartas
com quatro decisões grandes, e sair no meio não custa nada.

**A regra.** `triageQueue(tasks, now)` filtra `!completed && isHaunted(...)` e
ordena:

1. **vencidas primeiro** e, entre elas, a que venceu há mais tempo (prazo tem
   consequência fora do app);
2. depois as assombradas por abandono, da mais parada para a menos (`daysStale`);
3. desempate final por `id`, **para a fila não trocar de ordem entre renders**.

As quatro saídas (`TriageAction`), aplicadas em `handleTriageResolve`
(`src/App.tsx`), são chamadas dos módulos donos — nenhuma regra é reescrita ali:

| Ação | O que faz | Dono |
|---|---|---|
| `today` | `toOpen` + `startDate` de hoje | `taskTriage` ([§31](#someday)) |
| `week` | `postpone(task, now, +7 dias)` — adiamento CONTADO | `taskTriage` ([§30](#adiamentos)) |
| `someday` | `toSomeday` | `taskTriage` ([§31](#someday)) |
| `drop` | `drop` | `taskTriage` ([§31](#someday)) |

**Dono.** `src/utils/taskTriage.ts` → `triageQueue`. A tela é
`src/components/TriagePile.tsx`, puramente apresentacional (a fila já chega
pronta).

**Régua.** `src/utils/taskTriage.test.ts` (bloco `triageQueue — "Arrumar a
pilha"`, incluindo "a ordem é estável (desempate por id) e a lista original não é
mutada"), `src/components/filaDeAvisos.contract.test.ts` (a posição na fila de
avisos da Home).

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.2
(Masicampo & Baumeister: o que alivia é o PLANO);
[`docs/PLANO-TAREFAS.md`](../PLANO-TAREFAS.md) §2.2. A prioridade da triagem
dentro do slot de avisos foi mudada na auditoria de 06/09/2026 — o relatório
semanal passou à frente porque a fila quase nunca está vazia para quem tem
histórico, e o adiável estava ganhando do raro.

**Casos de borda.**
- **A triagem é o PRIMEIRO da fila de intersticiais** (`interstitial === 'triage'`)
  porque é a única superfície aberta por TOQUE do usuário.
- **A fila é congelada na abertura** (`setTriageTasks(triageQueue(...))`): decidir
  uma carta não reordena as outras embaixo do dedo.
- **Sair no meio não penaliza nada** — e a tela final tem texto próprio para o caso
  "a pilha já estava arrumada" (0 decisões), que não pode soar como fracasso.
- **`someday`/`dropped` nunca entram na fila.**
- ⚠️ **divergência**: a tabela do [`CLAUDE.md`](../../CLAUDE.md) diz "Terminar
  rende recompensa". No código **não há recompensa material**: nem Bits, nem
  comida, nem atributo, nem `perfectDay`. A "recompensa" é a tela de encerramento
  (`TriageDone`, em `src/components/TriagePile.tsx`) e o alívio que ela nomeia.

**O que NÃO faz.** Não reagenda sozinha (o Smart Schedule do Todoist com
ergonomia de jogo, mas a decisão é sempre da pessoa). Não pinta nada de vermelho,
não escreve "você está atrasado" e não mostra o total de pendências no topo — o
contador mostra o que JÁ foi decidido. Não muta a lista recebida.

**Onde a UI mostra.** `src/components/TriagePile.tsx` (bottom sheet; as quatro
saídas têm a MESMA moldura e se distinguem por GLIFO + PALAVRA, não por cor), o
botão "Arrumar a pilha" no slot de avisos da Home (`src/App.tsx`,
`handleOpenTriage`).

---

<a id="quickadd"></a>
## 35. ⌨️ Quick add e sugestões

**Em uma frase.** Uma linha de texto vira tarefa ou hábito com data, hora,
esforço, categoria e recorrência — e o que o app entendeu aparece em chips antes
de gravar.

**A regra.** `parseQuickAdd(input, { now, language })` devolve
`{ kind: 'task' | 'activity', name, category?, effort?, schedule?, date?, time?,
tokens[] }`. `kind` é `'activity'` **se e somente se** um `schedule` foi
reconhecido. A ordem de leitura é semântica, não estética:

1. `#tag` → `ActivityCategory` (mapa `CATEGORY_ALIASES`, chaves normalizadas sem
   acento/hífen; a PRIMEIRA tag conhecida vence, tag desconhecida **fica no
   nome**);
2. recorrência, **antes** de qualquer coisa com número: `a cada N dias` /
   `every N days` (com `!`, `após concluir` ou `after completion` →
   `from:'completion'`), `Nx semana` → `timesPerWeek` (a palavra semana/week é
   OBRIGATÓRIA), `todo dia` → `weekdays` com os sete, e dias da semana — **dois ou
   mais** viram recorrência, **um só** vira data;
3. esforço `!1`/`!2`/`!3` (depois da recorrência, para não brigar com o `!` do
   `a cada 3 dias!` — o guard é `!(?!\d)`);
4. datas: `hoje`/`today`, `amanhã`/`tomorrow`, `depois de amanhã`, `dd/mm` (ou
   `mm/dd` em EN), `dia 15` / `the 15th`;
5. hora: `2:30pm`, `14h`, `14:30`, `às 9` (aqui o marcador é a PREPOSIÇÃO — sem
   ela, "comprar 9 ovos" viraria horário);
6. nome limpo: preposições órfãs só nas PONTAS.

**As três invariantes.** **(a) Nunca lança e nunca devolve vazio** — qualquer
exceção vira `{ kind:'task', name: <o que a pessoa digitou>, tokens: [] }`, e se a
limpeza comer o texto inteiro o nome volta a ser o input original. **(b)
`tokens` existe para a UI confirmar**, não para o parser se gabar. **(c)
Determinismo**: `now` entra por parâmetro; não há `Date.now()` dentro.

**As duas sugestões.**
- **IA** — `suggestTasks(goalText, categories, language)`
  (`src/utils/taskSuggestions.ts`) chama `POST /api/suggest-tasks`
  (`functions/api/suggest-tasks.js`, Groq, mesmo provedor do chat do pet) e
  **nunca lança**: qualquer falha devolve `[]`. O emoji é resolvido no cliente por
  `CATEGORY_ICONS` — o modelo não é confiável para emoji consistente.
- **Tarefa mínima** — `minimumViableHint(taskName, language)` (mesmo arquivo)
  sugere uma versão de dois minutos quando o nome traz um número acima do
  `threshold` da unidade (minutos 20, horas 1, km 3, páginas 10, capítulos 1,
  repetições 15). Só olha o trecho DEPOIS do número ("5km em 30 dias" fala de km).
- **Ordem das categorias** — `orderCategoriesForGoal` (`src/utils/goalToCategory.ts`)
  põe na frente a categoria que casa com `soulGoal`/`soulStruggle`
  ([§21](#soulgoal)), por palavra-chave, **no aparelho**.

**O teto da criação.** `fitHabitCreates(state, novos, tier)`
(`src/utils/habitCreate.ts`) devolve o PREFIXO do lote que cabe em
`canCreateActivity` (tier + `maxActivityCap`). É chamado **duas vezes**: fora,
contra o `gameState` (para a telemetria e para o chamador saber o que não coube),
e **dentro do updater, contra o `prev`** — a família X-6: duas criações no mesmo
lote do React liam a mesma contagem e ambas passavam.

**Dono.** `src/utils/quickAdd.ts` → `parseQuickAdd`, `quickAddHint`.
`src/utils/taskSuggestions.ts` → `suggestTasks`, `minimumViableHint`.
`src/utils/goalToCategory.ts` → `categoryForGoal`, `orderCategoriesForGoal`,
`normalizeGoalText`. `src/utils/habitCreate.ts` → `fitHabitCreates`. **A gravação
não é reimplementada em lugar nenhum**: `QuickAddBar` devolve o resultado e quem
grava é `commitTaskCreate` / `commitHabitCreate` no `src/App.tsx`.

**Régua.** `src/utils/quickAdd.test.ts` (nove blocos, incluindo "o caso de
sobrevivência" e "determinismo"), `src/utils/taskSuggestions.test.ts`,
`src/utils/goalToCategory.test.ts` (com o bloco "camada 1 NÃO tem rede — decisão
D8"), `src/utils/habitCreate.test.ts`,
`src/components/QuickAddBar.render.test.tsx`.

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.2,
linha "Quick Add de uma linha, na tela inicial" (✅ 08/09/2026) e §5.8
(privacidade / D8: do texto de `soulGoal`/`soulStruggle` só ENUM sai do
aparelho); [`docs/PLANO-TAREFAS.md`](../PLANO-TAREFAS.md) §2.5 — fricção de
captura decide se o sistema sobrevive à segunda semana.

**Casos de borda.**
- **`!` de recorrência × `!2` de esforço**: separados pelo guard `!(?!\d)`.
- **Fim de token por lookahead, não por `\b`**: "amanhã" termina em `ã`, que não é
  caractere de palavra em JS — com `\b` a palavra mais digitada do app deixaria de
  ser reconhecida.
- **`dd/mm` × `mm/dd`**: o idioma decide, com salvaguarda — um número > 12 no lugar
  do mês só pode ser dia. Sem ano explícito e já passou → ano que vem.
- **Dia da semana escrito hoje é HOJE** (`nextWeekday` inclui o dia corrente).
- **`isoDate` no fuso LOCAL**: `toISOString()` está proibido ali — a oeste de
  Greenwich, "hoje" às 22h viraria amanhã.
- **Data solta é `startDate`, nunca prazo** — a mesma regra do
  `CreateModal.applyQuickAdd`, para a MESMA linha digitada não produzir coisas
  diferentes conforme a tela.
- **Recusa do teto**: `onCommit` devolve `false` e a barra **mantém o texto**, para
  a pessoa não perder o que digitou.
- **O que sai do aparelho**: a rota de sugestões recebe o objetivo do TUTORIAL,
  passado por `minimizeForAi` (300 caracteres, com contagem de redações no log) —
  `soulGoal`/`soulStruggle` **não passam por rota de IA nenhuma**
  (`functions/api/_redact.js`), e por isso o casamento de categoria é local.

**O que NÃO faz.** Não valida, não recusa e não avisa: o que não for reconhecido
continua fazendo parte do nome. Não infere hábito de um "3x" solto. Não substitui
o modal (passos, âncora, alarme e prazo continuam lá). Não grava nada por conta
própria — e por isso não fura o teto do modo grátis nem o do estágio.

**Onde a UI mostra.** `src/components/QuickAddBar.tsx` (a linha na Home, com os
chips de confirmação), `src/components/CreateModal.tsx` (`applyQuickAdd` no blur
e no Enter, mais o `minimumViableHint`), `src/components/GameTutorialFlow.tsx`
(as sugestões de IA e a ordem das categorias), `PostponeNudgeSheet` no
`src/App.tsx` (decompor).

---

<a id="equilibrar"></a>
## 36. 🌿 Equilibrar minha semana

**Em uma frase.** Uma proposta de um toque que espalha os hábitos de dias fixos
pelos dias mais vazios — mostrando o antes e o depois, e sem mudar quantas vezes
cada hábito acontece.

**A regra.** `equilibrarSemana(atividades, teto)` devolve
`{ mudancas, antes, depois, picoAntes, picoDepois, cabe }`:

```
limpas    = atividades com dias válidos (0–6, sem repetição), as vazias saem
cabe      = total de ocorrências <= max(1, floor(teto)) × 7
ordenadas = por frequência DESC, desempate por `id` (localeCompare)
para cada atividade:
  7 dias → fica como está
  senão  → escolhe os `quantos` dias de menor carga; empate prefere um dia que
           ela JÁ usava; empate seguinte, o índice menor
mudancas  = só as que realmente mudaram
```

`valeEquilibrar(proposta, teto)` = `picoAntes > max(1, floor(teto))` **E**
`picoDepois < picoAntes` **E** `mudancas.length > 0`. `DIAS_DA_SEMANA` =
`[0..6]`, domingo = 0.

O `teto` é o `required` do estágio (`FORM_REQUIREMENTS`, [§14](#escada)) e é
passado por quem chama — o número **não é decidido aqui**, para a escada continuar
com um dono só.

**Dono.** `src/utils/weekBalance.ts` → `equilibrarSemana`, `valeEquilibrar`,
`contarPorDia`. A tela de confirmação é `src/components/BalanceWeekModal.tsx`; o
gatilho (`podeEquilibrar`) e a escrita (`handleAplicarEquilibrio`) estão no
`src/App.tsx`.

**Régua.** `src/utils/weekBalance.test.ts`,
`src/components/BalanceWeekModal.render.test.tsx`.

**Decisão.** P4 de `product/soulmon-01/balance/carga-diaria.md` (✅ 07/09/2026),
consolidada em [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.2,
linha "Presets de 1 toque + 'Equilibrar minha semana'". A pesquisa é **negativa e
útil**: ninguém planeja a semana num app de hábito, e nenhum benchmark resolve
isso com um planejador.

**Casos de borda.**
- **Só `Schedule.kind === 'weekdays'` entra.** `timesPerWeek` e `everyNDays` ficam
  de fora porque já carregam perdão embutido — fixar dias para eles seria TIRAR
  flexibilidade em nome de equilíbrio.
- **Determinística**: mesma entrada, mesma proposta. Uma sugestão que muda a cada
  toque ensina a pessoa a apertar de novo até gostar do resultado — é um sorteio
  disfarçado de ajuda.
- **Quando não cabe** (`cabe === false`), a proposta continua sendo a melhor
  possível e **a tela diz que não resolve**.
- **Hábito de 7 dias** não tem o que redistribuir e é preservado.
- **Dado de save não confiável**: `diasLimpos` descarta o que não é inteiro de 0 a
  6 e deduplica.
- **A escrita grava `weekDays` E `schedule` juntos**, porque o campo antigo é o que
  o widget Android e o overlay de desktop leem — gravar só um faria o hábito
  cobrar num ritmo na tela e noutro no widget.

**O que NÃO faz.** **Não muda a frequência** — muda QUAIS dias, nunca QUANTOS.
Não roda sozinha: só escreve depois da confirmação explícita, e "Agora não" é
saída de primeira classe. Não toca em HP, meta, dia completo nem evolução. Não
aparece para quem já está equilibrado (`valeEquilibrar`), porque oferecer isso
insinuaria falha onde não há.

**Onde a UI mostra.** `src/components/BalanceWeekModal.tsx` (as barrinhas de
antes/depois, uma por dia, sem números), o botão na página de Atividades
(`src/App.tsx`, ao lado da `QuickAddBar`), e o toast "Semana espalhada 🌿" /
"Week spread out 🌿".

---

<a id="checkin"></a>
## 37. ☀️ Check-in

**Em uma frase.** Uma vez por dia o app oferece um ritual de planejamento curto
— pendências de ontem, hábitos devidos hoje, até três focos — e sai da frente
sem cobrar nada de quem pular.

**A regra.**

```
needsCheckIn(state, now) = lastCheckInDate ≠ playerDayKey(now, playerDayTz)
checkInPlan(state, now)  = { habitsToday, tinyOffer, suggestedFocus, carryOver,
                             plannedEffort, overcommitted }
completeCheckIn(state, focusIds, dayKey) = setFocus(tasks, focusIds, dayKey)
                                           + lastCheckInDate = dayKey
```

Um por DIA DO JOGADOR (ver [§5](#dia-do-jogador)), **sem janela de horário** —
"matinal" é o convite, não a tranca. Cada campo do plano:

| Campo | Como sai |
|---|---|
| `habitsToday` | `habitCountsOn` (dono: `src/utils/habitRhythm.ts`), nunca `weekDays` cru — o `CreateModal` grava `weekDays: [0..6]` para schedule flexível, por causa do widget Android, e ler o campo cru mostrava um `everyNDays` como devido todo dia |
| `carryOver` | tarefas vivas com `startDate` **ou** `focusDate` = ontem. Vêm PRIMEIRO na tela |
| `suggestedFocus` | até `MAX_DAILY_FOCUS` (`src/types/taskModel.ts`), na ordem: `triageQueue` → `carryOver` → planejadas para hoje → o resto, do mais pesado (`weightOf`) para o mais leve |
| `tinyOffer` | ids dos hábitos com `needsIntervention` — `MISS_INTERVENTION_AT` faltas seguidas (ver [§27](#never-miss-twice)). Lista de ids, e não um campo dentro do hábito: a fatia do save não carrega julgamento sobre a pessoa |
| `overcommitted` | `isOvercommitted(plannedEffort)` — `OVERCOMMIT_EFFORT`, e é AVISO (ver [§33](#carga)) |

Confirmar conta a missão semanal `checkins` e credita XP de Vínculo
(`kind: 'checkIn'`, teto natural: `lastCheckInDate` já é 1×/dia). **Pular grava
o mesmo dia** — um ritual que reaparece porque você não quis fazê-lo é cobrança.

**Dono.** `src/utils/rituals.ts` → `needsCheckIn`, `checkInPlan`,
`completeCheckIn`. O foco não é reimplementado aqui: `completeCheckIn` chama
`setFocus` (`src/utils/taskTriage.ts`, ver [§32](#foco)). A fiação é do
`src/App.tsx` (`checkInPromptedRef`, `handleCheckInConfirm`,
`handleCheckInSkip`).

**Régua.** `src/utils/rituals.test.ts`,
`src/components/MorningCheckIn.commit.render.test.tsx`,
`src/components/MorningCheckIn.ofertaReduzida.render.test.tsx`,
`src/utils/playerDay.contract.test.ts` (o guard de AST que exige a escrita e a
leitura na mesma régua de dia).

**Decisão.** [`docs/PLANO-TAREFAS.md`](../PLANO-TAREFAS.md) §2.4 ("Os dois
rituais"); [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.2 —
"otimizar o PLANEJAR, não o marcar o check" (Masicampo & Baumeister: a tensão
da tarefa inacabada é aliviada por fazer um plano, não por concluí-la).

**Casos de borda.**
- **D0 não tem check-in**: os dois caminhos de nascimento (demo e pago) gravam
  `lastCheckInDate` com o dia do jogador junto de `bornAt` — o ritual de hoje é
  considerado cumprido, porque a pessoa acabou de escolher tudo no onboarding.
  Sem isso, a primeira coisa depois de conhecer a criatura seria um formulário
  de metas.
- **Plano vazio não abre**: sem hábito devido, sem sugestão e sem pendência, o
  efeito retorna — um ritual de planejamento sobre lista vazia é só uma tela a
  mais entre a pessoa e o pet.
- **Trava de sessão guarda o DIA** (`checkInPromptedRef`), não um booleano: numa
  PWA/desktop deixada aberta a noite toda o booleano nunca rearmava e o ritual
  só voltava depois de um reload que ninguém faz.
- **Escrita e leitura na MESMA régua**: `handleCheckInConfirm` e o `handleSkip`
  carimbam com `playerDayKey`, igual a `needsCheckIn`. Carimbar com a chave do
  aparelho reabriria o ritual no mesmo celular.
- **Dentro de `checkInPlan`, hoje/ontem saem de `dayKeyOf`** (`habitRhythm.ts`),
  porque ali a comparação é contra `startDate`/`focusDate` de tarefa, que são
  datas locais escritas por `<input type="date">`. É de propósito: só
  `lastCheckInDate` consome `playerDayTz` neste módulo.
- **StrictMode**: `completeCheckIn` é pura; a telemetria (`checkin_shown`,
  `checkin_commit`) fica FORA do updater (footgun 6).

**O que NÃO faz.** Não bloqueia nada (`overcommitted` não desativa o botão de
confirmar). **Não coleta humor** — as cinco carinhas são do relatório diário
(ver [§12](#humor)). Não exige horário. Não dá HP, energia nem comida. Não
reabre no mesmo dia depois de pular. Não decide o foco no lugar do usuário: a
função SUGERE.

⚠️ **divergência com o `CLAUDE.md`** (achado em 10/09/2026, para o
[§59](#divergencias) e o [`STATUS.md`](../STATUS.md)): a linha ☀️🌆📅 Rituais
descreve o check-in como "hábitos do dia + até 3 focos + **humor**".
`src/components/MorningCheckIn.tsx` não tem uma ocorrência de humor
(`grep -c "mood" src/components/MorningCheckIn.tsx` → 0) e `CheckInPlanShape`
não tem o campo. O próprio `CLAUDE.md`, na linha 😊, diz o certo: o humor vive
no relatório diário.

**Onde a UI mostra.** `src/components/MorningCheckIn.tsx` — TERCEIRO na fila
única de intersticiais do `src/App.tsx` (`const interstitial`: triagem →
relatório diário → check-in → sonho → pesadelo → boas-vindas). É diálogo com
`aria-modal`, foco preso e Escape equivalendo a "hoje não".

---

<a id="relatorio-semanal"></a>
## 38. 🌆 Relatório semanal

**Em uma frase.** No domingo, um cartão descreve a semana — constância por
hábito, melhor hábito, categoria dominante, esforço concluído, sonhos — e, só se
os dados bastarem, sugere ancorar um hábito fraco num forte.

**A regra.**

```
needsWeeklyReport = now.getDay() === 0
                  && weeklyReportHasSubstance(state, now)
                  && weekStart(lastWeeklyReportDate) ≠ weekStart(now)
```

`weeklyReport(state, now)` devolve:

| Campo | Como sai |
|---|---|
| `perHabit` | `constancy` por hábito (`done`/`window`/`ratio`, ver [§25](#constancia)) + `habitTier(totalDone)` |
| `bestHabitId` | maior `ratio`; empate decide por mais dias feitos; hábito com `window === 0` nunca concorre — a razão sozinha coroaria quem teve um único dia devido |
| `dominantCategory` | categoria com mais conclusões na janela; `null` sem histórico |
| `tasksDone` / `effortDone` | contagem **e** esforço (`weightOf`); quem descreve o trabalho é o esforço |
| `dreams` | tamanho de `rest.dreams` (coleção, ver [§41](#sonhos)) |

A janela é a das **últimas 7 manhãs** (`addDays(now, -6)` até o fim de hoje), a
mesma de `constancy` — uma janela que começasse no domingo resumiria um dia só,
o próprio.

`stackingSuggestion(state, now, language)` devolve `null` a menos que existam
**dois** hábitos com `constancy.window ≥ STACKING_MIN_WINDOW`, um forte
(`ratio ≥ STACKING_STRONG_RATIO`) com dia da semana identificável e um fraco
(`ratio ≤ STACKING_WEAK_RATIO`), ambos com nome. Os três valores são exportados
por `src/utils/rituals.ts`.

**Dono.** `src/utils/rituals.ts` → `needsWeeklyReport`,
`weeklyReportHasSubstance`, `weeklyReport`, `stackingSuggestion`. A dispensa
grava `lastWeeklyReportDate` (`handleDismissWeeklyReport`, `src/App.tsx`).

**Régua.** `src/utils/rituals.test.ts` (inclui "não estreia no dia 2 de vida,
sem NADA para mostrar" e "uma tarefa concluída na semana já basta").

**Decisão.** [`docs/PLANO-TAREFAS.md`](../PLANO-TAREFAS.md) §2.4;
[`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.2 — âncora de
Gollwitzer como a intervenção de custo zero com maior efeito medido.

**Casos de borda.**
- **Instalou no sábado**: no domingo seguinte — segunda sessão da vida do save —
  o relatório seria "0 tarefas · 0 pontos de esforço · 0 sonhos", com a lista de
  hábitos vazia (hábito novo cai em `window === 0`). `weeklyReportHasSubstance`
  suprime. **Suprimir não acumula dívida**: a função não escreve nada, e o
  domingo seguinte aparece normal.
- **Domingo pulado** não faz o relatório da semana passada surgir na segunda: a
  comparação é por `weekStart`, não por dia.
- **Histórico vazio não lança** — devolve zeros e `null`s.
- **Linha "0 de 0" some**: o cartão filtra `window > 0`, senão o painel pareceria
  uma cobrança vazia.

⚠️ **divergência com o `CLAUDE.md`** (achado em 10/09/2026): a linha ☀️🌆📅
descreve o gate como "domingo, checado por SEMANA e não por dia" e **omite**
`weeklyReportHasSubstance`, que é a segunda condição e a que impede a estreia em
zeros. Não é contradição, é regra faltando — quem lê o `CLAUDE.md` espera o
cartão em todo domingo.

**O que NÃO faz.** Não dá veredito, não recompensa conclusão, não gera push, não
tranca a tela (é cartão, não modal). Nenhum número dele pode diminuir por
castigo. Não inventa conselho: `stackingSuggestion` cala com pouco dado, e o
silêncio é a metade importante — conselho desacreditado não volta a ser
acreditado.

**Onde a UI mostra.** `src/components/WeeklyReportCard.tsx`, **posição 2** do
slot de avisos da Home (primeiro dia → HP → **semanal** → triagem → priming →
recomeço). Vem antes da triagem porque a triagem aparece todo dia e ele volta só
no domingo seguinte.

---

<a id="fresh-start"></a>
## 39. 🌱 Fresh start

**Em uma frase.** Segunda-feira e dia 1 oferecem um recomeço que zera a cobrança
acumulada e **não toca em uma linha de progresso**.

**A regra.**

```
isFreshStartDay(now, state?) = (now.getDay() === 1 || now.getDate() === 1)
                               && (state ? freshStartHasSomethingToClear(state) : true)
freshStartHasSomethingToClear(state) = alguma tarefa ATIVA com postponedCount > 0
freshStartOffer(...)  = null fora do marco, ou se lastFreshStartDate é hoje
applyFreshStart(state, now) = postponedCount = 0 nas ativas
                              + lastFreshStartDate = dayKeyOf(now)
```

O calendário é condição **necessária, não suficiente**. O critério de substância
é exatamente o que `applyFreshStart` faz: sem tarefa ativa adiada, aceitar seria
um no-op.

**O que `applyFreshStart` NÃO toca, campo por campo** (o teste lista):
`evolutionStage`, `perfectDays`, `habitRhythms` (inclusive `totalDone`, que
alimenta os marcos de [§28](#marcos)) e `rest.dreams`. O spread devolve tudo
intacto.

**Dono.** `src/utils/rituals.ts` → `isFreshStartDay`,
`freshStartHasSomethingToClear`, `freshStartOffer`, `applyFreshStart`.
`handleFreshStart` (`src/App.tsx`) só delega e mostra o toast.

**Régua.** `src/utils/rituals.test.ts` — "NUNCA apaga progresso: evolução, dias
perfeitos, marcos de hábito e sonhos ficam intactos" e "não oferece perdão de
dívida a quem nunca adiou nada".

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.1 —
*fresh start effect* (Dai, Milkman & Riis): marcos temporais "relegam as
imperfeições ao período anterior". A regra geral do registro vale aqui: perda só
sobre item recuperável, **nunca** sobre identidade ou progresso.

**Casos de borda.**
- **Usuário novo numa segunda**: quem instalou no fim de semana receberia "as
  cobranças pendentes zeram" antes de ter adiado qualquer coisa — a mensagem
  ensinaria que ele já acumulou algo errado. É esse o caso que a condição de
  substância fecha.
- **`someday`/`dropped` não são cobrança pendente** (`isActive` filtra) — ver
  [§31](#someday).
- **"Agora não" é da SESSÃO**: `freshStartDismissed` é `useState`, não vai para o
  save. Só ACEITAR grava `lastFreshStartDate`; recusar e reabrir o app no mesmo
  marco mostra o convite de novo.
- **Segunda-feira também devolve `WEEKLY_RELIEF_HEARTS`** ([§1](#coracoes)), e as
  duas regras são independentes: o alívio de HP acontece na virada, o convite é
  um cartão.

⚠️ **divergência com o `CLAUDE.md`** (achado em 10/09/2026): a linha 🌱 diz
"Toda **segunda ou dia 1**" e não menciona `freshStartHasSomethingToClear`. Pelo
código, o convite não aparece em marco nenhum se não houver adiamento a perdoar.

**O que NÃO faz.** Não apaga progresso. Não deleta nem conclui tarefa nenhuma.
Não zera streak (não existe streak — [§25](#constancia)). Não é modal: cartão
discreto, o mais adiável da fila.

**Onde a UI mostra.** Slot de avisos da Home, **posição 5** (a última), no
`src/App.tsx`; dois botões, "Recomeçar" e "Agora não".

---

<a id="janela-descanso"></a>
## 40. 🛏️ Janela de descanso

**Em uma frase.** A pessoa escolhe a própria janela de dormir e o app mede
**só** se ela deitou dentro dela — sem sensor, sem score, sem nada que possa
diminuir.

**A regra.** Constantes em `src/types/taskModel.ts` salvo indicação:

| Constante | Valor | O que faz |
|---|---|---|
| `DEFAULT_REST_WINDOW` | 23:00 → 07:00 | padrão; cruza a meia-noite, que é o caso normal e não a exceção |
| `REST_WINDOW_GRACE_MIN` | 45 | tolerância, e ela recua o **INÍCIO** — o fim nunca é estendido |
| `REST_WINDOW_DAYS` | 7 | janela da média móvel |
| `MAX_NIGHTS` (`src/utils/restWindow.ts`) | 30 | teto do histórico de noites |
| `SLEEP_REMINDER_LEAD_MIN` (`src/utils/restWindow.ts`) | 30 | minutos antes do início para o lembrete de deitar |

```
isWithinWindow(window, at, grace) → arco de 24h com o início recuado de `grace`;
                                    janela+tolerância cobrindo o dia = sempre true
recordNight(state, sleptAt, wokeAt?) → { date: morningKey(...), sleptAt, wokeAt?,
                                         onTime: isWithinWindow(window, sleptAt) }
restConstancy(state, now, dias) = { onTime, window, ratio }
   window   = noites REGISTRADAS nas últimas `dias` manhãs
   ratio    = onTime / window, e 0 quando não há registro
sleepReminderAt(window, now) → próxima ocorrência de (início − 30 min), ou null
```

**Noite sem registro é NEUTRA**: sai do denominador, nunca conta como falha. É
essa linha que mata o exploit de forjar sono (o caso documentado do Pokémon
Sleep) e que impede o app de inventar um dado ruim sobre a vida de alguém — ele
não sabe se a pessoa dormiu mal ou só não abriu o app.

`morningKey` nomeia a noite pela MANHÃ: com `wokeAt`, é ele; sem, a hora de
parede do jogador ≥ 12 joga para o dia seguinte.

`hideMetrics` (em `rest`) esconde NÚMERO e preserva RECOMPENSA — e desde o WP2.8
ele cobre também o "N das últimas 7" de cada hábito
(`src/components/HabitConstancy.tsx`), que era o número mais frequente do app.

**Dono.** `src/utils/restWindow.ts` → `isWithinWindow`, `morningKey`,
`recordNight`, `restConstancy`, `sleepReminderAt`. A fiação é um efeito sobre
`isSleeping` no `src/App.tsx` (registra ao deitar e reescreve ao acordar, com o
instante de deitar em `STORAGE_KEYS.SLEEP_STARTED_AT`) e o
`src/components/NotificationManager.tsx` para o lembrete.

**Régua.** `src/utils/restWindow.test.ts` (inclui o bloco "NENHUMA função
devolve penalidade ou perda"), `src/utils/noiteFuso.test.ts`,
`src/utils/playerDay.contract.test.ts`,
`src/components/HabitConstancy.hideMetrics.render.test.tsx`.

**Decisão.** [`docs/PLANO-TAREFAS.md`](../PLANO-TAREFAS.md) Parte 3;
[`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §4.3 — o público
"ansiedade" é protegido por tetos e por `hideMetrics`. O contexto de risco está
escrito no cabeçalho do módulo: ortossonia atinge 3–14% da população geral e
23% dos usuários de 18 a 35 anos relatam estresse com apps de sono, contra 2,4%
acima dos 66 (os dois números estão no cabeçalho de `src/utils/restWindow.ts`).

**Casos de borda.**
- **Abrir o app com o pet já dormindo não inventa noite**: `sleepStateRef` começa
  em `null` e a primeira execução só sincroniza.
- **O sono automático também registra**: o efeito escuta `isSleeping`, não o
  botão — prendê-lo ao gesto perderia justamente as noites de quem configurou a
  janela das Configurações ([§10](#dormir)).
- **Idempotente por manhã**: deitar e acordar geram UM registro; o segundo
  `recordNight` atualiza o primeiro.
- **`onTime` continua saindo do relógio do APARELHO** (a comparação é de
  hora de parede local), enquanto o NOME da manhã é ancorado no fuso do save. O
  teste declara isso explicitamente ("o que este conserto NÃO ancora, de
  propósito").
- **Adotar a âncora encolhe a janela em um dia** e a gravação nova pode
  substituir a noite vizinha — o que sai, sai como NEUTRO, nunca como falha, e o
  buraco fecha sozinho em até `REST_WINDOW_DAYS` dias.
- **Poda em `MAX_NIGHTS`** mantendo as mais recentes.
- **Missão semanal `rest-nights`** só conta quando o deitar caiu DENTRO da janela
  — ver [§50](#missoes-semanais).

**O que NÃO faz.** Não lê sensor nenhum (nem Health Connect, nem Google Fit, nem
acelerômetro) — roda idêntico na PWA e no APK. Não produz score de 0–100, nota,
gráfico de estágio de sono nem meta de duração. Não pune: nenhuma função devolve
número que possa cair. Não notifica sobre desempenho — o único push desta
mecânica é o de DEITAR, ele não dispara com o pet dormindo e é 1×/dia (ver
[§58](#notificacoes)).

**Onde a UI mostra.** `src/components/RestWindowCard.tsx`, em **Configurações**,
ao lado da janela de sono automático — é preferência, não conteúdo de jogo. O
feedback do usuário é só de manhã, e vem em forma de sonho ([§41](#sonhos)).

---

<a id="sonhos"></a>
## 41. 🌠 Sonhos

**Em uma frase.** Cada manhã com noite registrada rende uma cena colecionável do
pet dormindo, e a raridade vem da REGULARIDADE — nunca da duração.

**A regra.**

```
dreamRarity(state, now):
   window < RARITY_MIN_NIGHTS        → 'common'
   ratio  ≥ RARITY_LEGENDARY_AT      → 'legendary'
   ratio  ≥ RARITY_RARE_AT           → 'rare'
   senão                             → 'common'      (piso, nunca castigo)
rollDream(state, rarity, seed, now)  → id, determinístico; prefere não coletado
collectDream(state, id, dayKey)      → idempotente; grava a PRIMEIRA data
dexProgress(state)                   → { collected, total } — só cresce
```

Constantes em `src/utils/restWindow.ts`: `RARITY_MIN_NIGHTS` = 3,
`RARITY_RARE_AT` = 0,5, `RARITY_LEGENDARY_AT` = 0,8, `SEASON_DREAM_WEIGHT` = 3.

**O catálogo.** `DREAM_CATALOG` tem **30** sonhos —
`grep -c "id: 'dream-" src/utils/restWindow.ts` → 30, medido em 10/09/2026 —,
sendo 12 `common`, 10 `rare` e 8 `legendary`
(`grep -c "rarity: 'common'"` e as duas irmãs, mesmo dia). Doze deles declaram
`season` (`grep -c "season: 'season-"` → 12), três por estação
([§57](#estacoes)).

**Estação pondera, nunca filtra.** `weightedPool` (interno de
`src/utils/restWindow.ts`) só ADICIONA repetições: o
sonho da estação corrente entra `SEASON_DREAM_WEIGHT` vezes, e todo sonho da
faixa continua no pool em qualquer dia do ano. É essa invariante que separa
estação de battle pass, e ela tem teste.

**A fiação da manhã** (`src/App.tsx`): só com o pet acordado, entre 4h e 12h,
só se existir uma `RestNight` com a chave do dia do jogador, uma vez por dia
(trava em `STORAGE_KEYS.MORNING_DREAM_SHOWN` + `dreamShownRef`), com
`seed = hashString(playerDayKey)`. Sonho inédito conta a missão semanal
`dream-new`.

**Dono.** `src/utils/restWindow.ts` → `DREAM_CATALOG`, `DREAMS_BY_RARITY`,
`dreamRarity`, `rollDream`, `collectDream`, `dexProgress`. A arte é de
`src/utils/dreamArt.ts` (`grep -c "'dream-"` → 30, 10/09/2026) — fronteira de
troca, porque o módulo de regra é puro e roda em Node.

**Régua.** `src/utils/restWindow.test.ts` (inclui "DURAÇÃO não muda nada" e
"raridade tem piso em common"), `src/utils/seasons.test.ts` ("sonho sazonal
continua obtenível fora da estação").

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.6 —
"recompensa variável com TETO, nunca à venda" e "sonhos sazonais continuam
obteníveis fora da estação". A escolha de medir regularidade em vez de duração
está no cabeçalho do módulo: no UK Biobank (n=60.977) o índice de regularidade
previu mortalidade melhor que a duração, e o efeito sobrevive ao controle por
duração.

**Casos de borda.**
- **O sonho NÃO exige `onTime`**: basta uma noite registrada para a manhã. Quem
  deitou fora da janela recebe cena mesmo assim; o que muda é a raridade, que sai
  da regularidade acumulada. O pesadelo é que exige `onTime`
  ([§42](#pesadelos)).
- **Recarregar de manhã não re-sorteia**: a seed é o dayKey, e a trava de dia
  fecha o resto. No pior caso a cena reaparece uma vez.
- **A trava guarda o DIA**, não a sessão: com booleano, o app aberto a noite toda
  pulava a manhã seguinte inteira.
- **A chave é a do JOGADOR**: lida do aparelho, ela não encontraria a noite
  gravada pelo outro celular e a manhã inteira (sonho E pesadelo) sumiria em
  silêncio.
- **Faixa esgotada** devolve repetido em vez de tela vazia; id desconhecido em
  `collectDream` é ignorado sem perder nada.
- **`dreamDates` é opcional**: save antigo mantém a coleção inteira, só sem data
  (ver [§45](#aniversario)).

⚠️ **divergência com o `CLAUDE.md`** (achado em 10/09/2026): a linha 🌠 aponta o
`DREAM_CATALOG` por endereço de LINHA — o formato `arquivo` + número que o
próprio `CLAUDE.md` proíbe na linha 🧮 —, e o endereço já escorregou: em
10/09/2026 o símbolo `DREAM_CATALOG` está três linhas abaixo do apontado. Os
NÚMEROS da linha conferem (30 = 12 + 10 + 8).

**O que NÃO faz.** Não mede duração. Não devolve score nem nota. Não tira nada
de ninguém. O Dex não diz "faltam N" nem mostra percentual — o não coletado
aparece como SILHUETA, que é convite e não dívida. Nenhum filtro remove sonho do
pool por causa da estação.

**Onde a UI mostra.** `src/components/MorningDream.tsx` (4º na fila de
intersticiais; com `dream === null` a tela é um bom-dia neutro, nunca uma
fatura) e `src/components/DreamDex.tsx`, na página do **Pet** — é coleção do
bicho; em Configurações leria como painel de métrica de sono. A célula coletada
mostra "#NN · data" com a data por `dayKeyLabel` (`src/utils/dayKeyLabel.ts`,
[§57-B](#mapas-de-arte)) — nunca `new Date(iso)`, que em fuso negativo mostraria
o dia anterior.

---

<a id="pesadelos"></a>
## 42. 👹 Pesadelos

**Em uma frase.** A noite que entrou na janela rende UMA luta curta de manhã, em
que o Soulmon defende o descanso do dono — e perder não custa nada.

**A regra.** Constantes em `src/utils/nightmares.ts`:

| Constante | Valor | O que faz |
|---|---|---|
| `NIGHTMARES_PER_NIGHT` | 1 | teto absoluto por noite registrada; é o que impede farm |
| `NIGHTMARE_WAVE_SIZE` | 2 | tamanho da onda (um andar de masmorra tem 6) |
| `NIGHTMARE_MAX_HEART_CURE` | 0,5 | cura máxima de uma vitória |
| `MAX_FOUGHT_HISTORY` | 30 | teto do histórico de noites combatidas |

```
nightmaresFor(rest, now, petStage?):
   rarity = dreamRarity(rest, now)                    ← REGULARIDADE, não duração
   tier   = capTier(RARITY_TIER[rarity], petStage)    ← common→baby-ii,
                                                        rare→rookie, legendary→champion
   count  = noite da manhã de hoje existe && onTime ? NIGHTMARES_PER_NIGHT : 0
buildNightmareWave → buildDungeonWave(max(1, tierIndex(tier) − 1), petStage),
                     fatia de NIGHTMARE_WAVE_SIZE terminando no tier alvo
nightmareRewards(rarity, won) → won ? tabela por raridade : { 0, 0, 0 }
markFought(nm, dayKey) → idempotente, poda em MAX_FOUGHT_HISTORY
```

Recompensa de vitória, por raridade: `common` 0 coração / 1 energia / 4 Bits ·
`rare` 0,5 / 1 / 7 · `legendary` 0,5 / 2 / 11, com os corações limitados por
`NIGHTMARE_MAX_HEART_CURE`. O teto por estágio (`STAGE_TIER_CAP`) impede um
rookie de encarar acima do próprio tier; o ultra encara no máximo `mega`.

**O combate é DELEGADO**: inimigo, stats, escala e sprite são os da Masmorra
([§51](#masmorra)) via `buildDungeonWave`. Este módulo decide só QUANTOS e ATÉ
QUE TIER.

**Dono.** `src/utils/nightmares.ts` → `nightmareDayKey`, `nightmaresFor`,
`buildNightmareWave`, `hasPendingNightmare`, `pendingNightmare`, `markFought`,
`nightmareRewards`, `nightmareName`/`nightmareFlavor`. O crédito
(`handleNightmareWin`) e o fechamento (`closeNightmare`) são do `src/App.tsx`.

**Régua.** `src/utils/nightmares.test.ts` (inclui "mesma regularidade + noites de
3h e de 11h → resultado IDÊNTICO" e "pesadelo NÃO combatido expira sem
penalidade nenhuma"), `src/utils/noiteFuso.test.ts`,
`src/utils/playerDay.contract.test.ts`.

**Decisão.** [`docs/PLANO-TAREFAS.md`](../PLANO-TAREFAS.md) Parte 3a ("o sono
deixa de ser passivo"). A regra de nunca cobrar da barra de cuidado é a mesma da
Masmorra em [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.6.

**Casos de borda.**
- **Duração não muda nada**: `sleptAt`/`wokeAt` não são lidos por regra nenhuma
  deste módulo.
- **Noite sem registro ou fora da janela** → `count: 0` e nada mais acontece.
- **Pesadelo de ontem expirou**: `pendingNightmare` só olha a manhã de hoje. Não
  vira dívida, não acumula fila, não gera aviso.
- **A chave da ESCRITA tem de bater com a do PORTÃO**: `markFought` é carimbado
  DENTRO do updater, com `prev.rest?.playerDayTz`. Uma âncora capturada por
  fechamento gravaria um nome que `hasPendingNightmare` não reconhece — e o modal
  reabriria para sempre. Há guard de AST.
- **A onda é memoizada por `nightmareDayKey`**, não pelo `Date`: sem isso o
  inimigo seria re-sorteado a cada render, no meio da luta.
- **Fechar a tela também marca combatido** — `closeNightmare` é chamado na
  vitória, na derrota e no fechar; uma recompensa que insiste vira cobrança.
- **StrictMode**: `markFought` é idempotente por dayKey.

**O que NÃO faz.** Não escala com duração de sono. Não cura mais que meio
coração (o campo `item` de `NightmareRewards` existe e **nunca** é preenchido:
entregar um Coraçãozinho ali furaria o teto por uma porta lateral). Perder não
tira coração, Bits nem energia. Não escreve no recorde nem na dificuldade
semanal da Masmorra. Não assusta: nomes e descrições são fofos por regra.

**Onde a UI mostra.** `src/components/NightmareBattle.tsx` — 5º na fila de
intersticiais, sempre DEPOIS do sonho (dois modais empilhados fazem o de cima
roubar o clique do de baixo). Mesma janela de horas do sonho, 4h–12h.

---

<a id="aventura"></a>
## 43. 🧭 Aventura da noite

**Em uma frase.** Todo relatório diário traz uma cena narrada do que a criatura
viu enquanto esteve fora — inclusive no dia zerado, no dia que degenerou e no
retorno de uma ausência.

**A regra.**

```
adventureOfDay(colecionados, feito, meta, dayKey):
   seed   = hashString('adventure:' + dayKey)
   ratio  = meta > 0 ? min(1, max(0, feito / meta)) : 1
   faixa  = ADVENTURE_ODDS pela primeira minRatio ≤ ratio
   rarity = mulberry32(seed) contra a faixa
   id     = rollAdventure(colecionados, rarity, seed)   ← prefere não coletado
collectAdventure(diario, id, dayKey) → idempotente; mantém a data da PRIMEIRA vez
```

`ADVENTURE_ODDS` (`src/utils/adventure.ts`), e a linha de baixo é a regra:

| Faixa (`minRatio`) | `rare` | `legendary` |
|---|---|---|
| 1 — cumpriu a meta | 0,30 | 0,08 |
| 0,5 — meio caminho | 0,20 | 0,04 |
| 0 — dia parado | 0,12 | 0,02 |

**Nenhuma célula é zero**: o dia mexe na CHANCE, nunca no acesso. Não existe cena
reservada a quem teve um dia bom.

**O catálogo.** `ADVENTURE_CATALOG` tem **24** achados —
`grep -c "id: 'adv-" src/utils/adventure.ts` → 24, medido em 10/09/2026 —, sendo
12 `common`, 8 `rare` e 4 `legendary` (mesmo comando trocando o campo). A voz é
sempre a da criatura, em primeira pessoa e no passado; nunca avalia o dia de
quem lê.

`feito` e `meta` vêm do próprio relatório (`lastDayReport.done` /
`lastDayReport.required`) e a seed é `lastDayReport.date` — recalcular a meta
aqui seria uma segunda cópia da regra de [§23](#meta-ponderada).

**Dono.** `src/utils/adventure.ts` → `ADVENTURE_CATALOG`, `ADVENTURE_ODDS`,
`adventureRarity`, `rollAdventure`, `adventureOfDay`, `collectAdventure`,
`findById`. A arte é de `src/utils/adventureArt.ts` (`ADVENTURE_ART`), pela mesma
razão de `dreamArt`: o módulo de regra é puro e não conhece PNG.

**Régua.** `src/utils/adventure.test.ts` (inclui "em 400 dias seguidos, todos
trazem algo — inclusive os zerados" e "nenhum achado carrega recompensa
material"), `src/components/DailyReportModal.aventura.render.test.tsx`,
`src/components/AdventureDiary.render.test.tsx`.

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.6,
três linhas: "aventura da noite: narrativa, sem recompensa material" (Finch — *a
recompensa é narrativa, e narrativa não satura*; decisão do dono em 08/09/2026),
"o dia mexe na CHANCE, nunca no acesso" e "diário NÃO mostra o que falta nem
raridade".

**Casos de borda.**
- **`meta <= 0`** (nada cadastrado) cai na faixa DE CIMA: não há o que cumprir,
  então não há por que dar a chance mais baixa por um dia que o próprio jogo
  decidiu não cobrar.
- **Fazer o dobro da meta não compra sorte extra**: o `ratio` é limitado a 1.
- **Reabrir o relatório devolve o MESMO achado** — a seed é o dia. Um achado que
  muda a cada abertura é um caça-níquel.
- **Grava ao ABRIR**, ao contrário da memória de marco, que grava ao fechar: o
  achado é o conteúdo da tela, e perdê-lo por fechar rápido tiraria da pessoa a
  única coisa que ela ganhou naquele dia. `collectAdventure` é idempotente.
- **Id órfão** (achado removido numa versão futura) devolve o primeiro do
  catálogo em vez de derrubar a tela; no diário, ele some da lista.
- **Sem `lastDayReport` não há aventura** — `aventuraDaNoite` é `null`.

⚠️ **divergência com os docs** (achado em 10/09/2026, dois pontos): (a)
[`docs/PLANO-TAREFAS.md`](../PLANO-TAREFAS.md) Parte 4 ainda diz "Falta só a
**arte** das 24 cenas (hoje são emoji)", e a arte existe —
`grep -c "'adv-" src/utils/adventureArt.ts` → 24 e
`ls src/assets/soulmon/adventures | wc -l` → 24; (b) o comentário do
`src/components/DailyReportModal.tsx` afirma que a cobertura de `ADVENTURE_ART`
é parcial ("as 12 cenas comuns"), quando o mapa cobre as 24. O `? :` de fallback
para o emoji continua correto e deve ficar — bundle antigo pode não ter a arte.

**O que NÃO faz.** Não paga Bits, item, atributo nem XP. Não usa `Math.random`.
O diário não mostra silhueta do que falta (isso é o Dex de Sonhos, onde a coleção
É o jogo), não mostra raridade — rotular a noite de ontem como "comum" é dizer
que ela valeu pouco — e não conta nem premia nada.

**Onde a UI mostra.** O cartão do achado dentro do
`src/components/DailyReportModal.tsx` ([§11](#relatorio-diario)) e
`src/components/AdventureDiary.tsx`, na página do **Pet**, ao lado do Dex de
Sonhos, com o mais recente primeiro; a data da linha é `dayKeyLabel`
(`src/utils/dayKeyLabel.ts`, [§57-B](#mapas-de-arte)) — nasceu aqui e foi para o
módulo quando o Dex de Sonhos ganhou data.

---

<a id="passos"></a>
## 44. 👣 Passos

**Em uma frase.** Num aparelho com pedômetro, e só com consentimento explícito,
o app lê o total do dia para **confirmar** um hábito de saúde que a pessoa já
marcou — passo nunca pontua sozinho.

**A regra.**

```
stepsDeltaFrom(baseline, raw)  = raw < baseline ? raw : raw − baseline   ← nunca negativo
updateStepBaseline(rec, raw, dayKey):
   sem registro ou outro dia → { date: dayKey, baseline: raw, today: 0 }
   mesmo dia                 → today += delta, baseline = raw
stepsGoalProgress(steps, goal = DEFAULT_STEP_GOAL) → 0..1 (meta inválida → 0)
readStepsToday(now, previous) → StepsRecord | null   ← null NUNCA é 0
```

`DEFAULT_STEP_GOAL` = 7000 (`src/utils/steps.ts`), referência de caminhada
regular e não meta médica. O único formato persistido é o AGREGADO
(`steps?: StepsRecord { date, baseline, today }`) — nunca a série bruta, nunca
horário de passo, nunca localização.

**O único efeito no jogo** (`src/App.tsx`): o selo de "verificado". Categorias
`STEP_VERIFIABLE` (Health, Fitness, Wellness), limiar `STEPS_VERIFIED_MIN` =
`DEFAULT_STEP_GOAL / 2` — DERIVADO da meta de propósito, para não virar uma
segunda meta que só quem tem sensor enxerga. Rende **+1 comida** da categoria e
um toast. Nada mais.

Leitura: só com `stepsConsent === 'granted'`, só com o app em foreground, a cada
`STEPS_POLL_MS` (5 min, `src/App.tsx`) e em `visibilitychange`. O consentimento
(`stepsConsentCopy`, EN + PT-BR) vem **antes** do diálogo do sistema — chamar
`requestStepsPermission` sem ele é bug de conformidade (política do Play +
LGPD), não de UX.

**Dono.** `src/utils/steps.ts` — puras (`stepsDeltaFrom`, `updateStepBaseline`,
`stepsGoalProgress`, `stepsDayKey`, `stepsConsentCopy`) e a camada nativa por
import DINÂMICO (`isStepsAvailable`, `hasStepsPermission`,
`requestStepsPermission`, `readStepsToday`).

**Régua.** `src/utils/steps.test.ts` (inclui "REBOOT no meio do dia preserva o
que já tinha sido andado", "dentro do mesmo dia o total só cresce (fuzz de
leituras caóticas)" e o bloco "degradação graciosa na web").

**Decisão.** [`docs/PLANO-TAREFAS.md`](../PLANO-TAREFAS.md) Parte 3b — "o sensor
certo é o mais burro": nem Health Connect (exige conta de organização
verificada, declaração de dados de saúde e política dedicada), nem Google Fit
(cadastros novos fechados desde 05/2024, APIs até o fim de 2026).
[`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.8 registra que
`steps` e `moodLog` são declarados no Data Safety.

**Casos de borda.**
- **Reboot do aparelho e relançamento do app têm a mesma assinatura** (a leitura
  crua caiu abaixo do baseline) e o mesmo tratamento: o `raw` inteiro é o que foi
  andado desde o zero. Uma queda só pode ADICIONAR, jamais subtrair.
- **Virada de dia não herda passo de ontem**: o registro do novo dia nasce com
  `today: 0` e o baseline ancorado na leitura atual.
- **Registro corrompido** não produz total negativo (`Math.max(0, …)` +
  saneamento de entrada).
- **`null` não vira 0**: leitura que falhou preserva o registro anterior — zerar
  o dia apagaria passo que a pessoa deu.
- **`'declined'` é definitivo** e mora no save: sem essa marca o cartão voltaria
  a cada abertura para quem já disse não.
- **O dia dos passos é o do APARELHO** (`stepsDayKey` = `toDateString()`), e não
  o do jogador ([§5](#dia-do-jogador)). É a única leitura diária do save fora das
  sete famílias ancoradas — cabe aqui porque o número não pontua e subcontar não
  tira nada de ninguém.
- **Passos dados com o app morto** (sem reboot) ficam de fora: a sessão do plugin
  começa do zero. Limitação declarada do desenho leve.

**O que NÃO faz.** Não vira HP, energia, `perfectDays` nem peso de esforço.
Não existe missão semanal de passos (o pool de [§50](#missoes-semanais) tem 12
ids e nenhum é de passo). Não guarda série, horário nem localização. Não mostra
"faltam X passos" e o medidor não tem estado de falha. Sem sensor, não mostra
erro nem medidor vazio: quem joga na PWA não fica atrás de nada.

**Onde a UI mostra.** `src/components/StepsCard.tsx`, **só em Configurações**,
logo abaixo da Janela de Descanso — é preferência de privacidade, não conteúdo
de jogo. Some por completo quando `isStepsAvailable()` responde `false` (o caso
da PWA) ou quando `stepsConsent === 'declined'`. Aceitar e recusar são botões do
mesmo tamanho, lado a lado.

---

<a id="aniversario"></a>
## 45. 🎂 Aniversário e memórias

**Em uma frase.** O save guarda quando a criatura nasceu e quando cada peça de
coleção chegou, e devolve isso como fala de aniversário, cartão de 30/90 dias e
saudação de reencontro — nunca como balanço.

**A regra.** Quatro módulos, um assunto:

```
anniversaryOn(bornAt, todayKey)  → 'year' | 'month' | null
   mesmo dia do mês && mesesVividos > 0; múltiplo de 12 → 'year'
daysTogether(bornAt, todayKey)   → dias desde o nascimento, contando hoje; null
                                    se não há bornAt ou se o relógio voltou
memoryToShow({ daysWithPet, shown }) → MEMORY_MARKS que este dia CRUZA e ainda
                                        não foi mostrado
stampCollected(dates, id, dayKey) → grava só se ainda não havia
welcomeBackLine(days, isPt, pick) → a fala da faixa de absenceBucket(days)
```

| Constante / faixa | Valor | Onde |
|---|---|---|
| `MEMORY_MARKS` | 30 e 90 | `src/utils/memories.ts` — os dois que a pessoa reconhece sem contar; 60 não é marco de ninguém |
| `AbsenceBucket` | 0 = ≤1 dia · 1 = 2–4 · 2 = 5–14 · 3 = 15+ | `src/utils/welcomeBack.ts` — faixa, nunca o número cru: dia exato de retorno, cruzado com o resto, começa a descrever uma pessoa |

**As frases não encenam espera (desde `1480b632`, 21/09/2026).** ⚰️ As faixas 2
e 3 de `LINES` diziam "Senti saudade esses dias", "Quanto tempo!" e "Eu estava
aqui, esperando" — obedeciam à trava do cabeçalho (nada do que ficou para trás)
e mesmo assim cobravam, porque mencionavam **tempo** e **espera**: a culpa não
precisa de número, vem da cena. Hoje dizem só que a janela abriu ("Você abriu.
Tô aqui. Sem pressa." / "Você abriu. Não mudei nada de lugar."). Fundamento no
mundo: a criatura não tem órgão que leia tempo decorrido (bíblia §5.10).
**A estrutura de FAIXAS fica** — o parecer clínico pediu frase idêntica no 2º e
no 40º dia, e o dono decidiu manter o WP2.7 ("continuar" e "voltar" não são a
mesma coisa): [`REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §14.3.
Consequência declarada ali: a saudação de retorno é a **única** exceção ao
sensório, porque é voz do PRODUTO lendo o save, não a criatura lendo tempo —
nenhuma frase dela pode dizer, sugerir ou encenar a duração.

`memoryMarkFor` compara por **IGUALDADE**, não por `>=`: o cartão é do DIA do
marco. Com `>=` ele apareceria todos os dias depois do trigésimo, e a coisa que
fazia dele um momento — ser raro — sumiria na segunda vez. `markMemoryShown`
(gravado em `memoriesShown`) é idempotente.

As datas de coleção (`src/utils/collectionDates.ts`) têm dois consumidores:
`formReachedAt`, carimbado na evolução ([§17](#evolucao)), e `rest.dreamDates`,
carimbado na coleta do sonho ([§41](#sonhos)). **A primeira data nunca é
reescrita** — uma data que se atualiza registra a última vez, e o que a coleção
conta é a primeira. **Ausência não vira data inventada**: save antigo lê "sem
data", nunca "hoje".

`bornAt` é gravado no **dia do jogador** nos dois caminhos de nascimento (demo e
pago), junto de `petPassive` e de `lastCheckInDate`.

**Dono.** `src/utils/anniversary.ts` (`anniversaryOn`, `daysTogether`) ·
`src/utils/memories.ts` (`MEMORY_MARKS`, `memoryMarkFor`, `memoryToShow`,
`markMemoryShown`) · `src/utils/collectionDates.ts` (`stampCollected`,
`stampAllCollected`, `collectedAt`) · `src/utils/welcomeBack.ts`
(`absenceBucket`, `welcomeBackLine`, `welcomeBackLines`).

**Régua.** `src/utils/anniversary.test.ts` (inclui "o próprio dia do nascimento
não comemora" e "o nascimento grava a data no dia do JOGADOR"),
`src/utils/memories.test.ts`, `src/utils/collectionDates.test.ts`,
`src/utils/welcomeBack.test.ts` ("nenhuma frase menciona o que ficou para trás",
varrendo PT e EN nas quatro faixas),
`src/components/MemoriesCard.render.test.tsx`.

**Decisão.** O reencontro é a regra de perdão por ausência chegando à VOZ:
[`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.1, "ausência ≥ 2
dias não cobra nada" (`ABSENCE_FORGIVENESS_DAYS`, `welcomeBack`) — cobrar no
retorno dispara abandono total (*what-the-hell effect*), e §5.7, "a voz do pet
nunca cobra". **Aniversário e memórias não têm linha própria no registro**: a
única ocorrência de "aniversário" ali é a evidência do *fresh start effect* na
linha de `WEEKLY_RELIEF_HEARTS` (`grep -c "aniversário"
docs/REGISTRO-DE-DECISOES.md` → 1, medido em 10/09/2026). O registro escrito
destas três peças são os cabeçalhos dos módulos (WP1.16, WP4.8, WP4.10).

**Casos de borda.**
- **Sem `bornAt` não há aniversário nem memória** — e não se inventa uma data
  para o save antigo ter o que comemorar.
- **O upgrade não reescreve `bornAt`** (D17): `handleUpgradeRevealed` troca a
  criatura e não toca na data; há teste.
- **O próprio dia do nascimento não é aniversário de nada** (`mesesVividos > 0`).
- **Doze meses viram `'year'`**, nunca "faz 12 meses".
- **Relógio do aparelho que voltou** faz `daysTogether` devolver `null` — silêncio,
  nunca número negativo. É por isso que ele é admissível como número exibido: só
  cresce.
- **A memória é registrada ao FECHAR o relatório**: fosse ao abrir, um relatório
  reaberto no mesmo dia gastaria o marco sem que ele tivesse sido visto.
- **A saudação de reencontro só volta a tocar** depois de ≥10 min fora da aba, e
  `daysAway` só chega ao HUD quando `lastDayReport.welcomeBack` é verdadeiro.

**O que NÃO faz.** O aniversário não dá XP, item nem push — rende UMA fala. A
memória não é balanço: nenhuma contagem de tarefa, nenhum percentual, nenhuma
comparação com o mês anterior; as contagens que aparecem são de COLEÇÃO (formas
vividas, sonhos), que só crescem. Não gera push, badge nem lembrete. Nenhuma
frase de reencontro menciona o que ficou por fazer.

**Onde a UI mostra.** `src/components/MemoriesCard.tsx`, dentro do
`src/components/DailyReportModal.tsx` · `src/components/BirthCard.tsx` e o "N
dias juntos" na página de **Estatísticas** · `src/components/FormAlbum.tsx`, que
lê `collectedAt` para datar cada forma · a fala de aniversário sai como toast do
`src/App.tsx` e a de reencontro pelo `speak` do
`src/components/CompanionHUD.tsx`.

---

<a id="moedas"></a>
## 46. 💠🎖️💎 As três moedas

**Em uma frase.** Três moedas com três origens diferentes, e a origem é o que
decide o que cada uma pode comprar — misturá-las visualmente já fez o jogador
pagar por uma coisa achando que comprava outra.

**A regra.** Dono do modelo: `src/utils/currencies.ts` → `CURRENCIES`. Cada moeda
tem um campo próprio, e são três campos distintos (há teste contando o conjunto):

| Moeda | `field` | Origem | Onde gasta | Onde mora |
|---|---|---|---|---|
| 💠 Bits | `gamePoints` | minijogos (Dino, PPT, Masmorra, Arena) | loja comum, `deepStartCost` da masmorra | save do cliente |
| 🎖️ Emblemas | `emblems` | Torneio (`EMBLEMS_PER_WIN` / `EMBLEMS_PER_LOSS`) e missões semanais | só `TOURNAMENT_ITEMS` | save do cliente |
| 💎 Créditos | `credits` | **dinheiro real** (ou anúncio, ver abaixo) | reroll, câmbio por Bits, `accountTier:'paid'` | servidor, `ENT_PREFIX` + saveId |

Constantes, todas em `src/utils/currencies.ts` salvo indicação:

| Constante | Valor | O que faz |
|---|---|---|
| `EMBLEMS_PER_WIN` | 3 | Emblemas por vitória de partida do Torneio |
| `EMBLEMS_PER_LOSS` | 1 | consolo — jogar sempre rende alguma coisa |
| `CREDIT_TO_BITS` | 10 | 1 Crédito = 10 Bits, **só nesta direção** |
| `BITS_EXCHANGE` | 3 pacotes (10/25/60 Créditos) | cada pacote é `credits × CREDIT_TO_BITS` |
| `REROLL_COST_CREDITS` (`src/utils/monetization.ts`) | 50 | refazer a leitura do Oráculo |
| `AD_REWARD_CREDITS` (`functions/api/_entitlements.js`) | 5 | Créditos por anúncio recompensado |
| `AD_DAILY_CAP` (`functions/api/_entitlements.js`) | 3 | anúncios por dia, contados **no servidor** |
| `ADS_ENABLED` (`src/utils/monetization.ts`) | `false` | o caminho do anúncio está DESLIGADO no cliente |

**Não existe Bits → Créditos.** A ausência é a regra, e há teste que varre os
exports do módulo procurando qualquer coisa com nome `BITS_TO_CREDIT` /
`bitsToCredit`. Créditos são a única moeda que libera gerar o pet próprio; um
caminho de volta faria minijogo comprar o que só dinheiro real abre.

**Créditos nunca são autoritativos no cliente.** `spendCredits`
(`src/utils/entitlements.ts`) chama `/api/entitlements?action=spend` e o efeito
de jogo só acontece se o servidor devolver o saldo novo. O gasto é **idempotente
por gesto**: o cliente gera um `opId` (`newOpId`, `crypto.randomUUID` com
fallback de tempo+aleatório) e o servidor guarda `spend:<saveId>:<opId>` por
`SPEND_TTL_SECONDS` (24 h) — repetir o mesmo gesto devolve o mesmo resultado em
vez de cobrar de novo.

**A distinção visual é regra de produto, não estilo.** Bits em família de
calculadora (`bitsStyle`, `--sm2-font-mono` + `slashed-zero` + `tabular-nums`) e
**sem ícone nenhum** — a ausência de ícone É a distinção. Emblemas em serifa de
medalha (`emblemStyle`, `--sm2-font-serif`, `EMBLEM_COLOR`). Créditos com o
ícone `diamond` e `CREDIT_COLOR`. A tinta dos Bits é `--sm2-primary-ink`, e
isso é **decisão do canvas Loja** (`DECISOES-WIREFRAME.md` §26, D-L11, checkpoint
do dono 20/09/2026): vence o canvas Jogos (§25), que pedia `ink` — as duas
superfícies leem a mesma cor de `bitsStyle`, e o hub de Jogos mostra "N Bits"
mono sem ícone com ela. As cores são tokens `--sm2-*-ink`, medidos por
`src/styles/tokens.contrast.test.ts`; ⚰️ as cores cruas (`#39ff14`, `#b8860b`,
`#a855f7`) **não existem mais** — reprovavam AA e vinham inline, vencendo o
token por especificidade.

**Dono.** `src/utils/currencies.ts` (modelo, câmbio, aparência) ·
`functions/api/_entitlements.js` → `spendCredits` / `grantAdReward` /
`readEntitlement` (o saldo de Créditos) · `src/utils/monetization.ts`
(`REROLL_COST_CREDITS`, `CREDIT_PACKS`).

**Régua.** `src/utils/currencies.test.ts` (fronteira entre as moedas, câmbio,
ausência do caminho inverso, "o torneio só vende cosmético"),
`functions/api/_entitlements.test.js`, `functions/api/_entitlements.ttl.test.js`,
`src/utils/monetization.fronteira.test.ts`, `src/styles/tokens.contrast.test.ts`.

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.4
(monetização: o que nunca se vende) e §5.6 (recompensa com teto).
[`docs/BILLING-SETUP.md`](../BILLING-SETUP.md) para o caminho da compra.

**Casos de borda.**
- **Emblemas são farmáveis por quem editar o `localStorage`**, e isso é aceito
  *enquanto* a aba de Torneio vender só `bg`/`furniture`. Há teste travando o
  `kind` de todo `TOURNAMENT_ITEMS`; se ele cair, a resposta certa não é
  afrouxá-lo — é mover os Emblemas para o servidor, junto dos Créditos.
- **Dois toques no mesmo lote do React** não cobram duas vezes: a recusa é
  reconferida sobre o `prev` (ver [§47](#loja)).
- **Anúncio**: o teto é do servidor (`grantAdReward` zera `adCount` por
  `ent.adDate`), não do cliente. `ADS_ENABLED = false` mantém o botão fora da
  tela; a rota continua existindo.
- **`bitsStyle` e `bitsStyleLight` são idênticos de propósito** — o par existe
  porque a cor era escolhida à mão por tema, e os dois exports têm call-site.

**O que NÃO faz.** Não converte Bits em Créditos. Não deixa Emblema comprar na
loja comum nem Bits comprar na aba de Torneio (`shopBalanceFor` lê a moeda do
item). Não guarda o saldo de Créditos no save como verdade — o `credits` do
`GameState` é espelho do servidor. Não usa o mesmo ícone para duas moedas.

**Onde a UI mostra.** `src/components/ShopModal.tsx` (saldo da moeda do segmento
+ os três botões de câmbio), `src/components/ActivitiesPage.tsx` (saldo de
Bits), `src/components/TournamentPage.tsx` (Emblemas e o `+3`/`+1` do fim da
partida), `src/components/CreditsModal.tsx` (pacotes, anúncio, custo do reroll).

---

<a id="loja"></a>
## 47. 🛒 Loja

**Em uma frase.** Um catálogo estático de consumíveis, cenários e decoração, com
uma compra que debita, entrega e equipa na hora — e nada dela dá vantagem de
jogo além dos três chips de atributo.

**A regra.** O catálogo é dado puro em `src/utils/shop.ts`. Medido em
09/09/2026 com `SHOP_ITEMS.length` / `.filter(...)`:

| Fatia | Quantidade | Preço (Bits) |
|---|---|---|
| `SHOP_ITEMS` (loja comum) | 56 | — |
| chips de atributo (`kind:'chip'`) | 3 | 120 |
| decoração (`kind:'furniture'`) | 27 | 100–140 |
| cenários (`kind:'bg'`) | 26 | 1 grátis (`bg-room`, `price: 0`) · 19 entre 150 e 250 · 6 travados por missão a 300 |
| `TOURNAMENT_ITEMS` (aba Torneio) | 8 | 8/12/15/20/25/40/55/70 **Emblemas** |
| `ALL_SHOP_ITEMS` | 64 | catálogo inteiro |

`ALL_SHOP_ITEMS` é o que se usa para **resolver** um item por id. Procurar só em
`SHOP_ITEMS` fazia a mobília de Torneio comprada e equipada não aparecer no box
do pet; há teste travando a ausência de id repetido no catálogo inteiro.

**A compra.** Dono: `src/utils/shopBuy.ts` → `shopBuyRefusal` + `applyShopBuy`.
Duas recusas, `'no-funds'` e `'already-owned'`. O efeito por `kind`:

- `chip` / `heart` → `+1` na pastinha (`foodInventory`, chaveada pelo **emoji**);
  o efeito acontece no USO ([§48](#itens-especiais)), nunca na compra.
- `bg` → entra em `ownedBackgrounds` **e equipa na hora**.
- `furniture` → entra em `ownedFurniture` e equipa no `slot` que o item declara;
  o que estava naquele espaço sai (um espaço, um item — ver
  [`docs/PALCO-E-DECORACAO.md`](../PALCO-E-DECORACAO.md)).

**O cadeado.** `UnlockReq` = `{ kind: 'mission', missionId }`. `isShopItemUnlocked`
(`src/utils/missions.ts`) é a porta, e ela roda **fora** do updater, em
`handleShopBuy` — o desbloqueio depende de progresso de missão, que comprar não
altera, então não há janela de lote a fechar. O item travado **continua na
lista**, escurecido, com o texto da missão e o progresso na própria linha
(`lockLine`); progresso **zero não vira `0/100`** na tela.

**Dono.** `src/utils/shop.ts` (catálogo e constantes: `CHIP_BOOST`, `HEART_HEAL`,
`CHIP_EMOJI`, `HEART_ITEM_EMOJI`, `GLITCHTAMA_EMOJI`, `SPECIAL_ITEMS`) ·
`src/utils/shopBuy.ts` (a transação) · `src/App.tsx` → `handleShopBuy` (só o
gate de missão, o retorno do botão e a ausência de som).

**Régua.** `src/utils/shopBuy.test.ts`, `src/utils/currencies.test.ts`
(fronteira de moeda, CSS de todo cenário à venda, mobília de torneio
renderizável), `src/utils/missions.test.ts` (o gate),
`src/utils/x6Updaters.contract.test.ts`,
`src/components/ShopModal.missoes.render.test.tsx`,
`src/components/ShopModal.convitePassivo.render.test.tsx`.

**Decisão.** [`docs/SHOP-PLAN.md`](../SHOP-PLAN.md) (o catálogo);
[`docs/PALCO-E-DECORACAO.md`](../PALCO-E-DECORACAO.md) (espaços e `fits`);
[`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.4 (o que nunca
se vende) e §5.6.

**Casos de borda.**
- **Saldo exatamente igual ao preço, dois toques no mesmo lote do React.** Era a
  família X-6: a recusa era lida do `gameState` de FORA e o updater subtraía o
  preço incondicionalmente — saldo NEGATIVO, e em `bg`/`furniture` o id entrava
  **duas vezes** na lista de posse, cobrando dobrado por um cenário só e
  duplicando-o no guarda-roupa para sempre. `applyShopBuy` reconfere a recusa
  sobre o `prev`. A checagem de fora continua existindo — é ela que decide o
  retorno do botão, e efeito colateral não entra em updater (footgun 6).
- **`bg-room` custa 0 e todo mundo já o possui** (semeado no
  `GameStateContext`), então ele sempre mostra "Equipar" em vez de preço.
- **Item de chão** (`slot: 'rug'`) tem arte 6,5:1 e a prévia usa `cover`; o resto
  usa `contain`.
- **Item equipado incompatível com o cenário não é desenhado**, mas a loja
  explica o `fits` em vez de sumir em silêncio.

**O que NÃO faz.** Não vende **Glitchtama** (há teste; a única fonte é a
masmorra). Não vende o **coraçãozinho** — ⚠️ **divergência**, ver
[§59](#divergencias). Não aplica o chip na hora da compra. Não cobra em duas
moedas. Não tem cinco abas — ⚠️ **divergência**, ver [§59](#divergencias). Não
toca som de compra: a categoria "transação" ainda não tem som próprio, e o canal
é o visual (saldo e posse já aparecem no próximo render).

**Onde a UI mostra.** `src/components/ShopModal.tsx`, aberto da
`src/components/ActivitiesPage.tsx`. Dois segmentos (`ShopSegment`): **Loja**
(seções Itens / Cenários / Mobílias num scroll único) e **Torneio**
(`TOURNAMENT_ITEMS` + as missões da semana no topo).

---

<a id="itens-especiais"></a>
## 48. 🌀💗🦠 Itens especiais (o uso da pastinha)

**Em uma frase.** Cinco itens que moram na mesma pastinha da comida e se
comportam de forma completamente diferente dela: chip dá atributo, coraçãozinho
cura, Glitchtama dá um dia completo — e nenhum conta no teto de comida.

**A regra.** Catálogo em `src/utils/shop.ts` → `SPECIAL_ITEMS`, chaveado pelo
**emoji** (que é a mesma chave do `foodInventory`). Cinco chaves, três `kind`:

| Emoji | `kind` | Efeito ao USAR |
|---|---|---|
| 🌀 `GLITCHTAMA_EMOJI` | `glitchtama` | `perfectDays +1` **e** `totalPerfectDays +1` |
| 💗 `HEART_ITEM_EMOJI` | `heart` | `+HEART_HEAL` de coração, clampado em `maxHealthPoints` |
| 🦠 / 💾 / 💉 `CHIP_EMOJI` | `chip` | `+CHIP_BOOST` no atributo, `+CHIP_BOOST × 10` de `totalXP`, e o mesmo no `attributesSinceLastEvolution` |

`CHIP_BOOST` = 3 e `HEART_HEAL` = 1 (`src/utils/shop.ts`, junto do catálogo) ·
`GLITCHTAMA_PER_DAY` = 1 (`src/utils/specialItemUse.ts`, junto do teto que ela
guarda).

**Dono único do USO: `src/utils/specialItemUse.ts`** (`specialRefusal`,
`applySpecialItem`, `glitchtamaUsedToday`). **Não é o `careUpdaters.ts`**, de
propósito: aquele arquivo existe para guardar o TETO de cuidado (janela de
comida por hora, carinho por dia), e item especial não tem teto de cuidado
nenhum — pôr os dois no mesmo lugar reabriria a pergunta "isso conta no teto?"
sobre o arquivo cuja razão de ser é responder que sim. E não é o `shop.ts`:
aquilo é CATÁLOGO (o que existe, quanto custa); aqui é o que ACONTECE.

**Três recusas** (`SpecialRefusal`), todas conferidas **antes** de qualquer
decremento:

- `'no-stock'` — não há o item na pastinha.
- `'daily-cap'` — só o Glitchtama, e só a partir do segundo do dia. O item volta
  para a pastinha intacto e vale amanhã.
- `'already-full'` — só o coraçãozinho, e só com a vida cheia. Gastar um item
  para curar zero é queimá-lo. A recusa tem VOZ desde `a2ded861` (21/09/2026):
  `src/App.tsx` chama `falar('steady')` (`kind` `steady` de `PET_VOICE_LINES`,
  `src/utils/petVoice.ts` — "Tô firme. Guarda essa."), sem toast de erro. É
  `kind` separado do `healCap` do carinho ([§2](#carinho)) porque os gatilhos são
  distintos e a frase do item ("guarda", que diz que ele volta para a pastinha)
  não serve ao carinho. Nunca "você desperdiçou".

**O teto do Glitchtama é a espinha da progressão, não economia.** A conta que o
justifica: rookie→mega custa 14 dias perfeitos e o Ultra custa mais
`ULTRA_PATIENCE_DAYS` (45) = **59**; a masmorra não tem limite diário nem gate de
entrada e concluir os 5 andares sempre dropa um Glitchtama — então 59 runs
seguidas compravam a escada inteira, e elas cabem num fim de semana. Um por dia
converte o atalho de volta em dias de calendário, que é o recurso que a
justificativa do Ultra protege. O registro é `glitchtamaUse {day, used}` **no
save**, e o `day` é o **dia do jogador** (`playerDayKey` + `playerDayTz`, ver
[§5](#dia-do-jogador)) — nunca o do aparelho.

**Dono.** `src/utils/specialItemUse.ts`. O `src/App.tsx` (`handleFeed`, ramo
`SPECIAL_ITEMS`) fica só com os efeitos: o som por tipo de item, a animação de
comer e o toast do Glitchtama.

**Régua.** `src/utils/specialItemUse.test.ts` (25 casos, medidos com `grep -c "  it(" src/utils/specialItemUse.test.ts`: cada número, cada
recusa, o teto e a virada do dia), `src/utils/x6Updaters.contract.test.ts`.

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.6
("Glitchtama: máx. 1/dia") e §5.4 (a cura instantânea removida);
[`docs/PLANO-MELHORIAS.md`](../PLANO-MELHORIAS.md) §15.

**Casos de borda.**
- **Dois toques no mesmo lote do React** — era o furo real do coraçãozinho: com
  4/5 de vida, as duas passadas liam o mesmo `gameState` (4 < 5, passa duas
  vezes) e a segunda decrementava o inventário para curar ZERO. `applySpecialItem`
  reconfere a recusa sobre o `prev`. Vale para os três tipos, e há teste para
  cada um.
- **Último do estoque** some da pastinha (`delete`) em vez de virar `0`.
- **`totalPerfectDays` ausente** em save antigo começa do zero, nunca `NaN`.
- **Virada do dia do jogador** devolve o direito ao Glitchtama; o registro velho
  não é apagado, é ignorado — o que torna a leitura idempotente.
- **Emoji que não é especial** (comida comum) passa batido por
  `applySpecialItem` sem mexer em nada.
- **O som do Glitchtama não é o da evolução** (corte C-5 do run `som-01`):
  emprestar o som do evento identitário do produto a um item de inventário é
  escalar celebração com contagem. Glitchtama e coraçãozinho tocam
  `playTaskComplete`; chip toca `playFeed`.

**O que NÃO faz.** Chip **não enche energia** e não dá dia perfeito.
Coraçãozinho **não dá atributo nem energia**. Glitchtama **não cura**. Nenhum dos
três entra no `FOOD_LIMIT_PER_HOUR` ([§3](#comida)). O `petPassive` não entra na
recusa: nenhum traço mexe em item especial (se um dia mexer, vem do ESTADO).

**Onde a UI mostra.** `src/components/ItemsWindow.tsx` (a pastinha, e é dela que
se usa), `src/components/ShopModal.tsx` (os chips à venda),
`src/components/CompanionHUD.tsx` (a animação de comer e o piscar do
`healCapSignal`).

---

<a id="missoes"></a>
## 49. 🏅 Missões permanentes

**Em uma frase.** Seis conquistas vitalícias que não pagam moeda nenhuma — elas
**liberam a compra** de seis cenários que já estavam na loja, com cadeado.

**A regra.** `src/utils/missions.ts` → `MISSIONS`. Seis entradas, cada uma com um
`bgReward` distinto, todos a 300 Bits:

| `id` | Alvo | Contador (`MissionState`) | Cenário liberado |
|---|---|---|---|
| `mission-champion` | 1 | `reachedLevel(s, 'champion')` | `bg-mission-filecity` |
| `mission-mega` | 1 | `reachedLevel(s, 'mega')` | `bg-mission-infinity` |
| `mission-kills-100` | 100 | `dungeonKills` | `bg-mission-coliseum` |
| `mission-runs-3` | 3 | `dungeonRunsCompleted` | `bg-mission-abyss` |
| `mission-dino-1000` | 1000 | `dinoBest` | `bg-mission-dinoland` |
| `mission-perfect-30` | 30 | `totalPerfectDays` | `bg-mission-aurora` |

Os contadores são **lifetime** e vivem no `GameState`. `totalPerfectDays` é o
vitalício das missões e por isso **não** é decrementado na evolução (ao
contrário de `perfectDays`, ver [§17](#evolucao)).

`getMissionProgress` limita cada progresso ao `target` (nunca `104/100`).
`isMissionComplete` compara com o alvo. `isShopItemUnlocked` é a porta que
`handleShopBuy` chama.

**As duas missões de estágio olham o histórico, não o presente.** `reachedLevel`
varre `[evolutionStage, ...unlockedEvolutions]` — quem chegou a mega e
degenerou, ou renasceu ([§20](#rebirth)), continua com a missão cumprida.

**Dono.** `src/utils/missions.ts`. Os contadores são escritos no `src/App.tsx`
(`handleDungeonEnemyDefeated`, `handleGlitchtama`, `handleDinoScore`) e na
virada (`src/utils/dailyReset.ts`, `totalPerfectDays`).

**Régua.** `src/utils/missions.test.ts` (progresso, clamp, `every mission unlocks
a distinct shop item, with CSS defined for bg rewards` e `plain (unlock-less)
items are always unlocked; Glitchtama is never sold` — os blocos estão em
inglês, como o resto daquele arquivo).

**Decisão.** [`docs/SHOP-PLAN.md`](../SHOP-PLAN.md);
[`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.6.

**Casos de borda.**
- **Os seis cenários de missão ficam de fora do sorteio da masmorra** —
  `SHOP_BG_ACCENTS` (`src/utils/dungeonScenes.ts`) não lista nenhum `bg-mission-*`,
  então o prêmio não vaza de graça como cena de andar.
- **`iconName` tem que existir no inventário de `src/styles/tokens.md`**: a fonte
  de ícones é SUBSETADA e um nome fora dela renderiza um `<span>` vazio, sem
  erro. O módulo é de dados e não importa React — carrega só o nome.
- **Item sem `unlock` está sempre liberado** (`isShopItemUnlocked` devolve `true`
  no primeiro `if`).

**O que NÃO faz.** Não paga Bits, Emblemas nem Créditos. Não repete: cumprida,
acabou — é justamente essa finitude que motivou as missões semanais
([§50](#missoes-semanais)). Não some da loja quando travada. ⚰️ **Não tem aba
própria**: a aba Missões da loja não existe mais (a explicação passou a ficar na
linha do próprio item travado).

**Onde a UI mostra.** `src/components/ShopModal.tsx` — o cadeado, a descrição da
missão e o progresso, na linha do cenário travado.

---

<a id="missoes-semanais"></a>
## 50. 🗓️ Missões semanais

**Em uma frase.** Três objetivos por semana, sorteados de um pool de doze de
forma determinística, pagos em Emblemas — e **nenhum deles premia quantidade de
tarefa**.

**A regra.** `src/utils/weeklyMissions.ts`. O pool tem **12** entradas
(`weeklyMissionPool()`), `WEEKLY_MISSION_COUNT` = 3, e `weeklyMissionsFor(weekKey)`
sorteia sem repetição com `mulberry32(hashString('weekly-missions:' + weekKey))`.

Determinismo não é elegância: **é a diferença entre uma missão e um sorteio.** Se
a lista mudasse a cada abertura, a pessoa aprenderia a reabrir o app até cair uma
fácil.

O pool inteiro, com alvo e pagamento em Emblemas: `rest-nights` 3/3 ·
`checkins` 4/3 · `haunted-done` 1/4 · `dungeon-runs` 2/3 · `rub-days` 4/2 ·
`shower` 3/2 · `play-days` 3/2 · `mood-checkins` 3/2 · `dream-new` 1/4 ·
`evolve-view` 1/2 · `tournament-match` 2/3 · `friend-visit` 1/2.

**⚠️ Nenhuma missão premia CONTAGEM DE TAREFAS**, e essa é a proibição mais fácil
de furar sem perceber — "faça 10 tarefas" é a missão mais óbvia do mundo e é
exatamente o desenho que faz a pessoa cadastrar cinco triviais em vez de encarar
a difícil ([§23](#meta-ponderada)). O pool é de CUIDADO e de PRESENÇA. A única
que toca em tarefa é `haunted-done`, com alvo **1**: é alívio, não quantidade.
Há teste varrendo o vocabulário do pool.

**A contagem tem UM ponto só**: `contarMissao` no `src/App.tsx`. Não é um
`bumpWeekly` espalhado por doze handlers porque `forWeek` (a virada da semana)
tem de acontecer no MESMO updater que soma — senão um contador da semana passada
recebe `+1` antes de ser zerado. A semana é
`isoWeekKey(playerDayKey(now, playerDayTz))` (`src/utils/offerMoment.ts`), ou
seja, ancorada no dia do jogador.

**O resgate** é `claimWeekly`, idempotente: devolve `0` se a missão não terminou
ou se já foi paga (`claimed`), e `resgatarMissao` sai antes de mexer no saldo
quando o retorno é zero. Pagar duas vezes é bug de economia.

**Dono.** `src/utils/weeklyMissions.ts` (pool, sorteio, progresso, resgate) ·
`src/App.tsx` → `contarMissao` / `resgatarMissao` / `missoesDaSemana` (a fiação).

**Régua.** `src/utils/weeklyMissions.test.ts` (determinismo, o pool sem contagem
de tarefas, recompensa só em Emblemas, pagamento único) e
**`src/utils/weeklyMissions.fiacao.test.ts`** — guard de FIAÇÃO: exige um
`contarMissao('<id>')` no `App.tsx` para **toda** missão do pool, exige que
`bumpWeekly` apareça uma vez só, e exige que a lista chegue ao segmento Torneio
do `ShopModal`.

**Decisão.** WP4.7. Até 06/09/2026 o módulo tinha **zero consumidores** — a
terceira repetição do padrão do `bestiary` e das estações. O custo era de
economia: os oito `TOURNAMENT_ITEMS` somam **245** Emblemas e
`EMBLEMS_PER_WIN` = 3, o que dá **82** partidas ganhas — depois disso a moeda do
Torneio nunca mais compra nada. As missões semanais são a torneira e o ralo ao mesmo
tempo.
[`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.6.

**Casos de borda.**
- **Semana igual devolve a MESMA referência** (`forWeek`), o que evita render
  desnecessário e mantém a virada barata.
- **Missão nova no pool sem gatilho no app** reprova o guard de fiação — é o
  teste que teria pego o módulo mudo.
- **`bumpWeekly` não tem teto**: quem lê compara com o `target`. Contar além do
  alvo não paga mais.
- **Semana ilegível** (`isoWeekKey` devolvendo vazio) faz `contarMissao` devolver
  `prev` — nunca grava progresso num balde sem nome.

**O que NÃO faz.** Não paga Bits (a economia já tem sumidouro) nem Créditos
(dinheiro real não se ganha jogando). Não expira o Emblema já pago. Não muda a
lista quando o app reabre.

**Onde a UI mostra.** `src/components/ShopModal.tsx`, no **topo do segmento
Torneio** — onde a moeda é gasta, a torneira e o ralo na mesma tela.

---

<a id="masmorra"></a>
## 51. ⚔️ Masmorra

**Em uma frase.** Uma run de cinco andares contra seis inimigos cada, sem limite
diário e sem porta de entrada — e perder **não custa um único coração**.

**A regra.** Uma run = `MAX_FLOORS` (5) andares, e a constante mora em
`src/components/DungeonGame.tsx`. Cada andar é uma escada fixa de **6** inimigos
subindo `LADDER_TIERS` em ordem: `baby-i → baby-ii → rookie → champion →
ultimate → mega`.

`buildDungeonWave(level, petStage)` (`src/utils/dungeon.ts`) monta a onda. A
dificuldade do andar F é `base + (F − 1)`, e um "nível" vale grosso modo um tier
de jogador — andar 1 serve um rookie, andar 2 um champion. Sobre `TIER_BASE`,
com `step = max(0, level − 1)`:

```
hpMult      = 1 + 0.14 × step        (mais ±10% de variância por inimigo)
atkMult     = 1 + 0.20 × step
dmgReduction= min(0.72, 0.11 × step)
speedBump   = min(0.50, 0.05 × step)
ptsMult     = 1 + 0.12 × step
```

Stats do jogador: `PLAYER_STATS` (`src/utils/dungeon.ts`), por estágio, de
`baby-i` (hp 10 / dmg 3) a `ultra` (hp 20 / dmg 8), resolvidos por
`playerStatsFor` com `rookie` como piso. ⚠️ Essa tabela é lida também pelo
Pesadelo e pela Arena — mexer nela muda os três de uma vez, e nenhum avisa.

**Recompensas.** Bits por inimigo (`enemy.points`) + bônus de andar
`clearBonus(floor) = 10 + 5 × (floor − 1)` = 10/15/20/25/30. Limpar um andar cura
`ceil(playerStats.hp × 0.25)`; o HP do jogador **carrega** entre andares. Limpar
os 5 dá **🌀 Glitchtama** (`onGlitchtama`) e sobe a base
(`setDungeonDifficultyAtLeast(base + 1)`).

**A base persiste e reseta toda SEMANA** — `STORAGE_KEYS.DUNGEON_DIFFICULTY`,
gravado como `{week, level}` com `weekKey()` local. O placar é
`STORAGE_KEYS.DUNGEON_BEST` (`recordDungeonScore` / `getDungeonBest`).

**O sumidouro recorrente de Bits (WP4.5).** `DEEP_START_BASE_COST` = 40,
`deepStartCost(n) = 40 × n`, teto `DEEP_START_MAX_LEVEL` = 5, decisão em
`canBuyDeepStart`. Comprar sobe a base — mais Bits por andar, e o andar 1 deixa
de ser trivial. É a única alavanca que o produto autoriza contra farm de Bits:
**custo de ENTRADA em Bits, nunca cobrar da barra de cuidado**. E é recorrente de
graça, porque a base reseta toda semana.

**Drop de coraçãozinho.** `rollDungeonHeartDrop(bonusChance)`:
`HEART_DROP_CHANCE` = 0,05 por inimigo, teto `HEART_DROP_DAILY_CAP` = 2 por dia,
registro em `STORAGE_KEYS.DUNGEON_HEART_DROPS`. O traço **Sortudo** soma
`heartDropBonus` (`src/utils/passives.ts`, ver [§19](#tracos)). É a **única** vez
que a masmorra toca a barra de corações, e sempre para cima.

**Cenários.** `buildRunScenes(5)` (`src/utils/dungeonScenes.ts`) embaralha um
pool de **34** cenas e tira 5 sem repetir, uma por run: **13** pintadas
(`SPIRIT_BG_SCENES`) + **5** clássicas em CSS (`DUNGEON_SCENES`) + **16** cenários
da loja (`SHOP_BG_ACCENTS`, filtrados por existirem em `PET_BACKGROUNDS`).
Contagens medidas em 09/09/2026 com
`sed -n '/^const SPIRIT_BG_SCENES/,/^];/p' src/utils/dungeonScenes.ts | grep -c 'namePt:'`
e equivalentes.

**Dono.** `src/utils/dungeon.ts` (ondas, stats, base semanal, placar, drops,
deep start) · `src/components/DungeonGame.tsx` (`MAX_FLOORS`, `clearBonus`, a
barra de timing, o laço da run) · `src/utils/dungeonScenes.ts` (as cenas) ·
`src/utils/sprites.ts` → `getDungeonEnemySprite` (arte e nome do inimigo).

**Régua.** `src/utils/dungeon.derrotaNaoCobra.test.ts` (o guard que lê o FONTE e
prova que nem o módulo nem o componente prometem um custo que não existe),
`src/utils/dungeon.deepStart.test.ts`, `src/utils/sprites.dungeonRoster.test.ts`
(o roster próprio, o `excludeLine`, a ausência de nome de franquia no **bundle**).

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.6 —
"a masmorra não cobra da barra de cuidado" e "recompensa variável com TETO,
nunca à venda". WP4.5 (o sumidouro) e WP4.20 (o cabeçalho mentiroso).

**Casos de borda.**
- **⚠️ Até 06/09/2026 o cabeçalho de `src/utils/dungeon.ts` afirmava três coisas
  falsas**: reset mensal, limite diário de partidas e uma entrada com gate de HP
  cuja derrota custava um coração. As três eram falsas desde que
  `handleDungeonLose` virou um callback vazio. O guard que entrou junto lê o FONTE
  procurando essas frases — por isso o texto exato **não** é citado aqui nem lá.
- **Perder** encerra a run e nada mais: `handleDungeonLose` é
  `useCallback(() => {})`.
- **`getDungeonDifficulty()` numa semana nova** grava `{week, level: 1}` e devolve
  1 — o reset é lazy, na leitura, sem job agendado.
- **Nível de deep start inválido** é normalizado por `Math.max(1, Math.floor(...))`
  — nunca preço grátis nem negativo.
- **Teto do deep start** existe porque sem ele alguém com Bits sobrando compraria
  uma base impossível e perderia no primeiro inimigo: isso não é desafio, é
  dinheiro queimado por uma tela que deixou.
- ⚠️ **divergência** — a exclusão do "espelho de si mesmo" não dispara na
  prática; ver [§59](#divergencias).
- ⚠️ **divergência** — o teto diário de drop e a base semanal usam o dia/semana
  do APARELHO e o `localStorage`, não o dia do jogador nem o save; ver
  [§59](#divergencias).

**O que NÃO faz.** **Não cobra coração para entrar nem para perder.** Não tem
limite diário de runs. **Não dropa comida** (só coraçãozinho). Não vende
Glitchtama. Não usa o som de conclusão na morte de inimigo (corte C-1: uma run
são 30 disparos, e gastar celebração no evento frequente é gastá-la).

**Onde a UI mostra.** `src/components/DungeonGame.tsx`, aberta da
`src/components/ActivitiesPage.tsx` (card de minijogo).

---

<a id="bestiario"></a>
## 52. 📖 Bestiário

**Em uma frase.** Uma grade de silhuetas que se revelam conforme a masmorra
apresenta cada arte — coleção, nunca placar.

**A regra.** A masmorra grava `enemyKey(tier, line)` = `` `${line}-${tier}` `` em
`bestiary` (array de strings no `GameState`), via
`handleDungeonEnemyDefeated(enemy.stage)` no `src/App.tsx`. Só cresce: o updater
só acrescenta quando a chave ainda não está lá.

A grade de `src/components/BestiaryCard.tsx` é
`Object.keys(DUNGEON_LINE_SPRITES)` × `TIERS`, onde `TIERS` são os **quatro**
tiers que têm arte própria (`rookie`, `champion`, `ultimate`, `mega`) — baby-i e
baby-ii reusam a arte de rookie, e repetir a mesma imagem duas vezes seria uma
coleção que mente sobre o próprio tamanho. Hoje são 9 linhas × 4 = **36** células (eram 6 × 4 = 24 até 15/09/2026, quando Igni/Nautilu/Astrase entraram — `c11dc49d`).

O que ainda não apareceu é **silhueta**, não espaço vazio: silhueta diz "existe e
você ainda não viu"; vazio não diz nada, e coleção só é coleção quando o que
falta é visível. A contagem é `achados de total` — de COLEÇÃO, e só cresce.
Mesma régua do `dexProgress` dos sonhos ([§41](#sonhos)).

**Dono.** `src/components/BestiaryCard.tsx` (a leitura e a grade) ·
`src/utils/dungeon.ts` → `enemyKey` (a chave) · `src/utils/sprites.ts` →
`DUNGEON_LINE_SPRITES` / `DUNGEON_LINE_NAMES` (as linhas e os nomes, dono único).

**Régua.** `src/components/BestiaryCard.render.test.tsx`,
`src/utils/sprites.dungeonRoster.test.ts`.

**Decisão.** WP4.6(b). O campo `bestiary` era gravado no save de TODO jogador
desde 06/09/2026 e **lido por ninguém** — até 36 strings crescendo no KV de
produção, sem uma única tela. É a terceira repetição do padrão que o WP4.15
consertou no Vínculo e o WP4.16 nas estações: quanto mais completo o módulo,
menos óbvio que ele está mudo.

**Casos de borda.**
- **A seção tem condição PRÓPRIA** no `src/components/StatsPage.tsx`
  (`bestiary?.length > 0`) e **não é aninhada no álbum de formas**. O álbum
  depende de `soulmonStages`, que o jogador grátis não tem — e ele é justamente
  quem mais roda masmorra.
- **Chave de linha desconhecida** cai no próprio id (`DUNGEON_LINE_NAMES[linha] ?? linha`).
- **Célula não vista** vai com `alt=""` e `aria-hidden` — a silhueta é gesto
  visual, não informação para leitor de tela.
- ⚠️ **divergência** — encontros em `baby-i`/`baby-ii` gravam chave própria e não
  revelam nada na grade; ver [§59](#divergencias).

**O que NÃO faz.** Não mostra percentual. Não mostra "faltam N". Não ordena
linhas por quantidade. Não some quando a coleção fica completa.

**Onde a UI mostra.** `src/components/StatsPage.tsx`, seção "Encontros" /
"Encounters", desenhada por `src/components/BestiaryCard.tsx`.

---

<a id="torneio"></a>
## 53. 🎪 Torneio: rodada, faixas e Arena

**Em uma frase.** PvP assíncrono resolvido no servidor, com uma janela semanal
que é convite e não tranca, e uma faixa que mede o jogador contra ele mesmo
**antes** de qualquer posição de ranking.

**A regra.** São quatro peças com donos distintos e sem sobreposição: a
**rodada** (quando há mais gente), a **faixa** (a leitura do jogador contra ele
mesmo), a **partida** (o que o servidor resolve e cobra) e a **Arena** (um
minijogo à parte, que só empresta o nome). Cada uma abaixo.

### A rodada

`src/utils/tournamentSeason.ts` → `getTournamentWindow(now)`. `ROUND_START_DAY` =
5 (sexta) e `ROUND_LENGTH_DAYS` = 3 (sexta, sábado, domingo). Devolve `isOpen`,
`daysLeft` e `daysUntilNext`.

Duas decisões deliberadas: a janela é de **DIAS, nunca de horas** (evento de 3 h
num horário fixo exclui quem trabalha), e **fora da janela nada fecha** — o
Torneio continua inteiro disponível. `tournamentWindowLabel` diz isso na letra:
"Dá pra lutar hoje do mesmo jeito."

### As faixas

`src/utils/tournamentTiers.ts` → `TOURNAMENT_TIERS`, cinco degraus por pontos
mínimos: Semente 🌱 (0) · Broto 🍀 (100) · Guardião 🛡️ (300) · Ancião 🌟 (700) ·
Lendário 👑 (1500). `getTierStanding(points)` devolve a faixa, a próxima,
`pointsToNext` e `progress` (0–1, e 1 na última).

**A faixa lê `lifetime`, não `points`.** Os `points` da season descem por três
caminhos — derrota própria (−8), ser sorteado como oponente e perder (−4, **sem
sequer jogar**) e a virada de mês, que zera tudo. Uma faixa cuja regra escrita é
"acumular pontos nunca rebaixa" rebaixava por três motivos, um deles sem
participação nenhuma do jogador. `lifetimePoints` mora no PERFIL, não na linha da
season, e só soma em ganho (`+20` na vitória própria, `+10` para quem venceu
sendo oponente).

### A partida

`functions/api/community.js`, ação `match`. Fórmula do poder:

```
power(p) = stagePower(p.stage) × 10
         + min(20, (virus + data + vaccine) / 5)
         + random() × 18
won      = myScore >= oppScore
```

`MATCHES_PER_DAY` = 5 (do servidor; estourar devolve `429 daily limit`).
Pontuação de season: `+20` / `−8` para quem jogou, `+10` / `−4` para o oponente,
sempre com piso em 0. O ranking é o top **50** da season; `season` é
`YYYY-MM` (`currentSeason()`), e `closeSeason` dá troféu de 1º/2º/3º ao top 3 —
protegido por `SEASON_ADMIN_KEY` e **idempotente** por `closed:<season>`, porque
quem chama é um cron e cron repete.

Os Emblemas do jogador vêm do CLIENTE (`onEarnEmblems` com `EMBLEMS_PER_WIN` /
`EMBLEMS_PER_LOSS`), não do servidor — ver [§46](#moedas).

### A Arena

`src/utils/arena.ts` + `src/components/ArenaGame.tsx`. É uma **segunda** masmorra,
experimental, que põe o class-system em combate: `ARENA_ROUNDS` = 5 rodadas,
anel de contra-ataque sobre os 17 elementos base (`COUNTERS`, construído como um
RING em que cada elemento bate os DOIS seguintes e apanha dos DOIS anteriores —
é isso que torna a cobertura simétrica por construção), `ADVANTAGE_MULT` = 1,3 /
`DISADVANTAGE_MULT` = 0,8 com cancelamento mútuo, especial por escola a cada
`SPECIAL_CHARGE_TURNS` (3), crítico em `PERFECT_ACC` (0,92) com `CRIT_MULT` (1,5)
e cura de `ROUND_CLEAR_HEAL` (30%) ao limpar a rodada. Paga **Bits**.

⚠️ **A ordem de turno do componente é a MESMA de `simulateArenaRun`, passo a
passo**, e isso não é preferência: os números dos especiais foram calibrados por
simulação de 300+ runs por arquétipo (taxa de vitória 40–80%, dispersão ≤ 20 pp).
Trocar a ordem invalida o balanceamento inteiro sem nada ficar vermelho.

**Dono.** `src/utils/tournamentSeason.ts` (a janela) ·
`src/utils/tournamentTiers.ts` (as faixas) · `functions/api/community.js` (a
partida, o rank, a season, os troféus) · `src/utils/community.ts` (o cliente) ·
`src/utils/arena.ts` (o motor da Arena) · `src/components/ArenaGame.tsx` (a tela).

**Régua.** `src/utils/tournamentSeason.test.ts`,
`src/utils/tournamentTiers.test.ts` ("a faixa nunca desce por causa do que os
outros fizeram"), `src/utils/arena.test.ts` (a simulação de balanceamento — a
autoridade sobre os coeficientes), `src/components/ArenaGame.render.test.tsx`,
`functions/api/community.test.js`, `functions/api/community.pvpGate.test.js`,
`src/components/TournamentPage.bondGate.test.tsx`.

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.5 —
"Faixas ANTES do ranking global; acumular nunca rebaixa" (31,3% relataram efeito
psicológico negativo de comparação em ambiente só-leaderboard) — e §5.6 ("Janela
do Torneio em DIAS, nunca horas", pelo Community Day do Pokémon GO).
[`docs/PLANO-EVOLUCAO.md`](../PLANO-EVOLUCAO.md) itens 4.1 e 4.2.

**Casos de borda.**
- **Nomear a vítima como `id` e a si mesmo como oponente** dava +10 pontos e +1
  vitória por chamada, queimando a partida da vítima — e repetido garantia o 1º
  lugar da season sem jogar. Hoje `denyUnlessOwner(id)` autoriza o ATOR de toda
  ação, inclusive as GET destrutivas (`trophies?claim=1`, `gifts?claim=1`).
- **`id === oppSave`** devolve `400 cannot fight yourself`.
- **Oponente com PvP desligado** devolve `404 opponent unavailable` — o saveId
  dele nunca sai do servidor (o cliente conhece só o pid público).
- **200 com corpo que não é JSON** é FALHA, não sucesso vazio. Era
  `res.json().catch(() => ({}))`, e `getRank()` resolvia com `{}`: a área do
  ranking ficava em branco para sempre e o efeito disparava duas vezes. Portal
  cativo de Wi-Fi, proxy corporativo e página de erro de CDN respondem exatamente
  assim.
- **`getTierStanding` com entrada inválida** (`NaN`, negativo) cai na primeira
  faixa e nunca lança — isso alimenta UI.
- ⚠️ **divergência** — o cabeçalho de `src/utils/arena.ts` afirma não ter
  consumidor; ver [§59](#divergencias).

**O que NÃO faz.** Não tranca nada fora da janela. Não mostra a lista completa do
ranking: é uma **janela de ±3 posições** em torno do jogador, com a season
inteira a um toque — a lista completa transforma a tela num placar absoluto
("você é o 47º"), que é o que a faixa existe para substituir. Não pinta a derrota
de vermelho (tinta neutra; só a vitória ganha cor). Não deixa perder sem ganhar
nada. A Arena **não cobra coração nem tem porta de entrada paga**.

**Onde a UI mostra.** `src/components/TournamentPage.tsx` (faixa → ranking →
oponentes → troféus → o toggle de PvP), `src/components/ArenaGame.tsx` (aberta
da `src/components/ActivitiesPage.tsx`).

---

<a id="minijogos"></a>
## 54. 🎮 Minijogos: PPT e Dino

**Em uma frase.** Dois jogos curtos que pagam Bits e não tocam em mais nada do
jogo — exceto o recorde do Dino, que alimenta uma missão permanente.

**A regra.**

| Jogo | Regra | Pagamento |
|---|---|---|
| ✊ PPT (`src/components/RPSGame.tsx`) | pedra-papel-tesoura contra o pet; primeiro a 3 rodadas leva a partida | `MATCH_POINTS` = **5 Bits por vitória de partida** — plano e modesto, porque o jogo é de sorte |
| 🦖 Dino (`src/components/DinoGame.tsx`) | corrida lateral; o score cresce `dt × 10` e os obstáculos endurecem com o tempo | `floor(score / 100)` Bits por run |

O Dino também chama `onScore(score)` → `handleDinoScore` no `src/App.tsx`, que
grava `dinoBest` no `GameState` **só quando o score supera o anterior**. É esse
campo que alimenta `mission-dino-1000` ([§49](#missoes)).

**Dono.** `src/components/RPSGame.tsx` (`MATCH_POINTS`) ·
`src/components/DinoGame.tsx` (o laço e a conversão score→Bits) · `src/App.tsx`
→ `handleDinoScore` (o recorde).

**Régua.** `régua: nenhuma` — não há teste próprio de `RPSGame` nem de
`DinoGame`. O que é coberto é a ponta de fora: `src/utils/missions.test.ts`
(o alvo de `dinoBest`) e `src/utils/currencies.test.ts` (a moeda). ⚠️ O laço de
jogo e a fórmula de pagamento **não têm régua executável** — item para o
[`STATUS.md`](../STATUS.md).

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.6 —
os minijogos são fonte de Bits e nada mais; a moeda nunca compra progresso.

**Casos de borda.**
- **Score abaixo de 100 no Dino** rende `pts === 0`, e nesse caso o som de
  conclusão **não toca** (corte C-6 do run `som-01`): celebrar um resultado que
  não pagou nada é celebrar nada.
- **`dinoBest` reconciliado com o `localStorage`** (`STORAGE_KEYS.DINO_BEST`) na
  leitura, com `Math.max` — save de nuvem e recorde local não se anulam.

**O que NÃO faz.** Nenhum dos dois toca HP, energia, atributo, `perfectDays` ou
evolução. Nenhum dos dois tem limite diário. Nenhum dos dois dropa item.

**Onde a UI mostra.** `src/components/ActivitiesPage.tsx` (os cards de minijogo)
e as telas próprias de cada jogo.

---

<a id="vinculo"></a>
## 55. 🔗 Vínculo e o gate de PvP

**Em uma frase.** Um número único que **relê** o esforço que as outras trilhas já
registram, nunca desce, e destrava exatamente uma coisa não-cosmética: a
possibilidade de ligar o PvP.

**A regra.** `bondLevelFor(totalXP)` é a única fonte do nível; `awardBondXP`
é o único caminho de produção de XP; `BOND_PVP_MIN_LEVEL` é o único destrave
não-cosmético. Tudo o mais abaixo é consequência desses três.

**A regra de desenho que torna isto seguro: a trilha NÃO pode pedir nenhuma ação
nova.** Todo evento de `BondEvent` já existe no jogo. Se alguém acrescentar um
evento que só existe para alimentar o Vínculo, a trilha deixou de ser leitura e
virou cobrança.

**Os cinco invariantes** (`src/utils/bond.ts`, cada um com teste):

1. Nenhuma função devolve XP negativo. Derrota de torneio **rende** XP.
2. O teto diário é SUAVE: ao bater, simplesmente PARA de somar — como o limite de
   comida ("o pet está satisfeito"). Nunca um contador que desce.
3. Recompensas são 100% cosméticas: decoração/cenário que já existem, sonhos do
   `DREAM_CATALOG` e títulos. Nunca moeda, HP, energia, `perfectDays` ou
   vantagem de combate.
4. **O NÍVEL NUNCA É PERSISTIDO.** É sempre `bondLevelFor(totalXP)`. Guardar
   `bondLevel` no save seria o footgun 9 na forma mais cara: duas fontes para o
   mesmo número, uma delas gravada no aparelho de quem já joga.
5. Progresso DOTADO (Nunes & Drèze): um save existente, que já acumulou `totalXP`
   alimentando o pet, nasce em nível > 1 de graça. Ninguém começa em 0%.

**A curva.** `BOND_EARLY_STEPS` = [75, 125, 200, 300, 400]; a partir daí
`BOND_STEP_BASE` (400) + `BOND_STEP_GROWTH` (100) × (nível − 5). Teto
`BOND_MAX_LEVEL` = 1000, e o teto é **custo de CPU**: `totalXP` vem do save, que
o cliente escreve, e sem teto o laço quadrático custava 183 ms medidos para
`1e10` num caminho que roda a cada cloud save.

**A tabela de XP** (todos em `src/utils/bond.ts`): `XP_PER_EFFORT` 10 por unidade
de peso concluída · `XP_PERFECT_DAY` 50 · `XP_REST_NIGHT` 15 · `XP_NEW_DREAM` 25 ·
`XP_NIGHTMARE_CLEARED` 10 · `XP_DUNGEON_FLOOR` 10 · `XP_DUNGEON_RUN` 60 ·
`XP_TOURNAMENT_WIN` 15 / `XP_TOURNAMENT_LOSS` 8 · `XP_HABIT_MILESTONE`
{7: 100, 21: 200, 66: 400} · `XP_TRIAGE_CLEARED` 30 · `XP_CHECK_IN` 10. Tetos por
fonte em `BOND_DAILY_CAP`; o ledger é `bondDaily {day, spent}` e o `day` é o dia
do jogador.

**O gate de PvP.** `BOND_PVP_MIN_LEVEL` = **5**, e não é número escolhido: os
níveis 1–4 são o funil de retenção D1–D7 e o 5 é o primeiro degrau fora dele
(`xpForLevel(5)` = 700 XP). O cabeçalho de `src/utils/bond.ts` remete a
derivação a um `level-de-conta.md` §6 que **não está no repositório** em
10/09/2026 (`find . -name 'level-de-conta*'` vazio; era artefato de run local,
fora do git) — a estimativa "uma semana de uso real" vive só nesse comentário
e não é verificável aqui. Pôr o gate dentro do funil contaminaria a
calibração de retenção com um objetivo social.

É um **LIMIAR, não uma manutenção**: `bondLevelFor` é monótona e `totalXP` nunca
desce, então quem cruzou uma vez cruzou para sempre — sem janela, sem decaimento,
sem "proteção de nível". **Todo destrave social futuro reusa ESTE nível**; uma
escada de gates sociais é grind com outro nome.

**Quem decide é o SERVIDOR.** O cliente tem `meetsPvpBond(totalXP)` e
`xpToPvpBond(totalXP)`, que só desenham a tela. A decisão real acontece em
`functions/api/community.js`, ação `profile`: se `bondLevel < BOND_PVP_MIN_LEVEL`,
o perfil é gravado com `pvpEnabled: false` e a resposta traz `pvpBlocked`,
`bondLevel` e `minBondLevel` — **para o app poder explicar em vez de sumir com o
botão em silêncio**. `ProfilePushResult.pvpEnabled` é o que FOI GRAVADO, e é o
campo a acreditar.

**A cópia do servidor é declarada e travada.** `functions/api/_bond.js` reimplementa
**só a curva** (`EARLY_STEPS`, `STEP_BASE`, `STEP_GROWTH`, `xpForLevel`,
`bondLevelOf`) porque Pages Functions não importam de `src/`. O que **não** foi
copiado, de propósito: tabela de XP por evento, tetos diários, escada de
recompensas e títulos — o servidor não concede XP nem entrega recompensa, ele só
responde "esta conta já cruzou o limiar social?".

**Dono.** `src/utils/bond.ts` (curva, XP, tetos, recompensas, o gate do lado do
cliente) · `functions/api/_bond.js` (a curva do lado do servidor) ·
`functions/api/community.js` ação `profile` (a decisão).

**Régua.** `src/utils/bond.test.ts`, `src/utils/bond.recompensas.test.ts`,
`src/utils/bond.wiring.test.ts` (a fiação — o padrão do módulo mudo),
**`functions/api/bond.parity.test.js`** (varre milhares de valores de `totalXP` e
exige o MESMO nível dos dois lados — é o único jeito de uma cópia ser
aceitável), `functions/api/community.pvpGate.test.js`,
`src/components/TournamentPage.bondGate.test.tsx`,
`src/utils/telemetry.viradaEVinculo.test.ts`.

**Decisão.** [`docs/PLANO-PRODUTO.md`](../PLANO-PRODUTO.md) Parte 4;
[`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §4.2 (o que quebra o
vínculo) e §5.5 (camada social).

**Casos de borda.**
- **`awardBondXP` não expira, não decai e não zera XP na virada** — a virada troca
  só o LEDGER do teto.
- **Nível não muda por recalibração de curva sem o teste de paridade cair** — se
  alguém mexer em `EARLY_STEPS` de um lado só, `bond.parity.test.js` reprova.
- **O nível NÃO substitui o consentimento**: ele só torna o PvP DISPONÍVEL. Ligar
  continua sendo ato explícito, com o aviso de que o apelido vai para uma lista
  pública.
- **`bondRewardsClaimed` já foi o caso original do módulo mudo** (WP4.15):
  escrito por ninguém, com a escada inteira testada.

**O que NÃO faz.** Não persiste o nível. Não subtrai XP em situação nenhuma. Não
dá vantagem de combate nem moeda. Não pede nenhuma ação que o jogo já não peça.
Não destrava capacidade de cuidar do bicho.

**Onde a UI mostra.** `src/components/CompanionHUD.tsx` (o nível e o título sob o
nome do pet — `CompanionHUD.vinculo.render.test.tsx`),
`src/components/TournamentPage.tsx` (o gate: quanto falta de XP, com o texto
vindo do servidor).

---

<a id="comunidade"></a>
## 56. 🤝 Comunidade e cooperativo

**Em uma frase.** Um diretório onde a pessoa só entra se escolher entrar, com
verbos de DAR e nenhum de comparar — e um grupo semanal de até quatro pessoas
cujo único número é do GRUPO.

**A regra.** Duas superfícies, um servidor: o **diretório** (quem aparece, e o
que dele trafega) e o **cooperativo** (o grupo da semana). As duas obedecem à
mesma invariante — **nada que se possa ordenar entre pessoas sai do servidor**.

### O diretório e os amigos

Cliente: `src/utils/community.ts`. Toda chamada leva o token, **inclusive as
GET** — o servidor autoriza o ATOR de `friends`, `gift`, `match`, `trophies` e
`gifts` (o `claim=1` das duas últimas é **destrutivo**: quem lesse o troféu
alheio apagava a conquista da pessoa para sempre).

**O que trafega de outra pessoa** é `DirectoryPlayer`: id público, nome, nome do
pet, estágio, formas desbloqueadas, `pvpEnabled` e `daysPlaying`. ⚰️
`rankPoints` e `tasksDone` **saíram em 06/09/2026** (WP4.11) — desempenho alheio
não trafega, e o corte é **no servidor** justamente para que uma UI futura não
consiga reintroduzi-lo por descuido. O que resta é presença: quem é, que
criatura tem, há quanto tempo joga.

**Entrar no diretório é um ato explícito**: o toggle de PvP, com o aviso de que o
apelido e o pet passam a aparecer numa lista pública, e com o botão de desligar
sempre disponível. O consentimento de Termos/Privacidade é outro assunto e mora
em `src/utils/consent.ts` (`MIN_AGE_YEARS` = 18, `TERMS_VERSION` e
`PRIVACY_VERSION` = `'2026-08-25'`, `buildConsentRecord`) — guardar só um booleano
não diz A QUE texto a pessoa disse sim, e **save antigo sem o registro nunca é
bloqueado**.

### O cooperativo

`functions/api/community.js`, ações `coop`, `coopCreate`, `coopJoin`,
`coopCheckin`, `coopLeave`. Constantes do servidor:

| Constante | Valor | O que faz |
|---|---|---|
| `COOP_MAX_MEMBERS` | 4 | teto do grupo |
| `COOP_CHECKINS_POR_MEMBRO` | 5 | **5 e não 7**: exigir dia completo por pressão social desfazeria o perdão de ausência da Fase 1 |
| `COOP_TTL` | 120 dias | e as **três** chaves do grupo renovam JUNTAS |
| `target` | `members.length × COOP_CHECKINS_POR_MEMBRO` | **derivado**, nunca gravado |

**O desenho da tela é a feature.** `vistaDoGrupo` é a ÚNICA montagem de resposta
do cooperativo, e ela devolve: o progresso do GRUPO (um número só, já limitado ao
`target`) e, por membro, `apareceuHoje: boolean` e mais nada que se possa
ordenar. Isso é **invariante de SERVIDOR**, não de tela — nenhuma rota futura
reintroduz a contagem individual por descuido. O motivo: 31,3% relataram efeito
psicológico negativo de comparação em ambiente de leaderboard, e um grupo que
mostrasse a contribuição individual reinventaria o leaderboard **entre amigos**,
onde a comparação dói mais.

**Sair é um toque, sem confirmação e sem penalidade — e a meta encolhe junto**,
porque o `target` é derivado do tamanho do grupo. É isso que impede sair de ser
sabotagem.

**Fronteira de confiança, declarada.** O check-in é uma AFIRMAÇÃO do cliente
("cumpri a minha meta hoje"), não uma verificação do servidor: recalcular a meta
do dia ali exigiria uma segunda cópia de `dailyGoalFor` no servidor — o footgun 9
—, e o save inteiro já é escrito pelo cliente, então a cópia não compraria
confiança nenhuma. O que o servidor garante é o que ele PODE garantir sozinho:
**um check-in por pessoa por dia, e só sobre si mesma**. Nada de economia depende
disso — bater a meta do grupo não paga Bits nem item.

**Dono.** `src/utils/community.ts` (o cliente e os tipos) ·
`functions/api/community.js` (todas as regras, e `vistaDoGrupo` como único
portão de saída) · `src/utils/consent.ts` (idade e prova de consentimento).

**Régua.** `functions/api/community.coop.test.js`,
`functions/api/community.directoryConsent.test.js`,
`functions/api/community.test.js`, `functions/api/community.playerOracle.test.js`,
`src/utils/community.respostaIlegivel.test.ts`, `src/utils/consent.test.ts`,
`src/components/CoopPanel.render.test.tsx`,
`src/components/PlayerDetailModal.semMetrica.render.test.tsx`,
`src/components/LibraryPage.amigos.render.test.tsx`.

**Decisão.** [`docs/PLANO-COOP.md`](../PLANO-COOP.md) (Fase 4.3);
[`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.5 — inclusive
"Só verbos de DAR" (o Finch tem `Share Goal`, `Send Good Vibes`, `Send Gift`, e a
ausência de uma quarta) e "Entrada só por código de convite" (grupo achável é
raide de estranho).

**Casos de borda.**
- **Dois membros marcando presença na mesma noite** — o caso normal de um grupo de
  quatro — apagavam um ao outro: `coopCheckin` fazia ler-modificar-gravar sobre o
  blob do grupo, sem erro. Hoje cada membro escreve **só a própria** chave
  (`coopCk:<gid>:<saveId>`); a corrida foi **removida, não mitigada**.
- **Duas pessoas na última vaga**: a última gravação vencia e o perdedor recebia
  `200` com a vista do grupo, para o grupo sumir depois sem nenhum evento que
  explicasse. Hoje `coopJoin` confere a própria entrada e devolve
  `409 join collision`.
- **TTL por chave**: aos 120 dias um grupo vivo perdia `coopOf:` e `coopCode:` ao
  mesmo tempo — todo mundo via "você não está em nenhum grupo" e o convite parava
  de abrir, sem erro. As três chaves renovam juntas em `gravarGrupo`.
- **Não ter grupo NÃO é erro**: `getCoop` devolve `null`.
- **`coopCheckin` é idempotente** no servidor, então o cliente pode chamar sem
  guardar estado.

**O que NÃO faz.** Não mostra quanto cada membro fez. Não manda push de cobrança:
o grupo **nunca** avisa que alguém faltou — isso é o cobrador que a essência
declarada proíbe, entregue por terceiro. Não paga nada por bater a meta. Não tem
busca de grupos. Não reusa componente de métrica do próprio perfil na tela do
amigo (a comparação emerge da simetria de componente, mesmo sem leaderboard).

**Onde a UI mostra.** `src/components/LibraryPage.tsx` (abas Todos / Amigos /
Coop), `src/components/CoopPanel.tsx`, `src/components/PlayerDetailModal.tsx`,
`src/components/TournamentPage.tsx` (o toggle e o aviso do diretório).

---

<a id="estacoes"></a>
## 57. 🍂 Estações

**Em uma frase.** Quatro janelas trimestrais que destacam sonhos e oferecem
uma medalha por três caminhos alternativos — e **nada nelas expira, nunca**.

**A regra.** `src/utils/seasons.ts` → `SEASONS`, quatro entradas: Broto
(01/03–31/05), Fogueira (01/06–31/08), Maré (01/09–30/11) e Constelação
(01/12–27/02, que cruza a virada do ano). Cada uma declara três `dreamIds` que
DESTACA e um `medalId`.

**O ano na tabela é só a PRIMEIRA EDIÇÃO.** A comparação é por mês/dia (`mmdd`,
`coversDay`), então a mesma tabela estática vale em 2026, 2031 e 2040 sem um
deploy. Uma tabela com anos literais viraria um app sem estação nenhuma no dia em
que o dono parasse de publicar — exatamente o modo de falha que a regra 1 existe
para evitar.

**As cinco regras inegociáveis**, escritas no cabeçalho do módulo:

1. **NADA EXPIRA.** Item sazonal nunca sai do catálogo: durante a estação ele é
   mais provável e destacado, depois continua obtenível com peso normal. FOMO
   vira "mais fácil agora", jamais "só agora". É o teste que separa isto de um
   battle pass.
2. **Janela de DIAS, nunca de horas** — a mesma regra da rodada do Torneio.
3. **A medalha tem TRÊS CAMINHOS ALTERNATIVOS**, cada um bastando sozinho (`OU`,
   nunca `E`). `SEASON_PATHS`: `perfect-days` (20), `dungeon-runs` (5),
   `rest-nights` (15). Objetivo único obrigatório excluiria quem só cuida de
   hábitos, quem só joga masmorra ou quem só usa a janela de descanso.
4. **Nada comprável com dinheiro real que não seja cosmético.** Nenhuma função
   deste arquivo lê ou escreve entitlement.
5. **A medalha, uma vez ganha, é PARA SEMPRE** (`earnedMedals`), inclusive depois
   de a estação virar.

**O progresso é um SNAPSHOT.** `startSeasonProgress` tira a foto dos contadores
lifetime no momento em que a estação começa a contar; `seasonMedalStatus`
compara o valor de agora com a foto. `ensureSeasonProgress` roda na **virada do
dia** (`src/utils/dailyReset.ts`), que é o dono do dia — e `applySeasonMedal`
grava a medalha.

Os temas são hemisfério-agnósticos de propósito (broto, fogueira, maré,
constelação, e não "verão"/"inverno"): a base é PT e EN ao mesmo tempo, e "Summer
Season" em junho é errado para metade do mundo.

**Dono.** `src/utils/seasons.ts` (calendário, caminhos, medalha) ·
`src/utils/dailyReset.ts` (a fiação na virada).

**Régua.** `src/utils/seasons.test.ts` e **`src/utils/seasons.fiada.test.ts`** —
o guard de fiação, que trava a chamada na virada e as duas propriedades que a
regra 1 exige (nada expira; medalha ganha é para sempre).

**Decisão.** [`docs/PLANO-PRODUTO.md`](../PLANO-PRODUTO.md) Parte 4;
[`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.6 ("Sonhos
sazonais continuam obteníveis fora da estação"). A evidência contra o battle pass
é a correção da própria indústria: Halo Infinite tornou os passes permanentes,
Deep Rock Galactic migra o não-obtido para os sistemas normais, Helldivers 2
mantém warbonds antigos compráveis.

**Casos de borda.**
- **Entre-estações** é resultado legítimo: `currentSeason()` devolve `null`, o app
  segue inteiro e todo sonho continua sorteável. É a regra 1 em forma de tipo.
- **A estação que cruza o ano** (Constelação) é tratada por `wrapsYear` /
  `coversDay` com o teste `x >= a || x <= b`.
- **WP4.16** — o módulo tinha 500 linhas, teste próprio, cabeçalho com as cinco
  regras… e **nenhum consumidor**: `ensureSeasonProgress` e `applySeasonMedal`
  nunca eram chamados, e a medalha **não podia ser ganha por ninguém** desde que
  o arquivo foi escrito. É o caso mais caro do padrão do módulo mudo.
- **Caminho com progresso ZERO não vira `0/20` na tela**: um placar de zeros é a
  fatura que este produto não emite; o caminho aparece quando a pessoa já andou
  nele.

**O que NÃO faz.** Não expira nada. Não tem contagem regressiva nem "faltam N
dias" — a estação é um CALENDÁRIO ("tem mais coisa agora"), nunca um prazo
("corre"). Não lê servidor nem flag remota (roda offline). Não vende passe.

**Onde a UI mostra.** `src/components/StatsPage.tsx`, seção "A estação" / "The
season" — nome, tema, os caminhos já iniciados e as medalhas guardadas. A spec
original mandava isto para a aba Missões da loja, que não existe mais.

---

<a id="conquistas"></a>
## 57-A. 🏆 Conquistas (emblemas de arte)

**Em uma frase.** Nove emblemas que se abrem lendo contadores que já existem no
save — nada é gravado, nada se compra, nada fecha depois de aberto.

**A regra.** Dono: `src/utils/achievements.ts` → `ACHIEVEMENT_IDS`,
`ACHIEVEMENT_LABELS` (PT/EN), `unlockedAchievements(save)` — função PURA que
devolve os ids abertos na ordem canônica. Todas **derivadas na leitura**
(footgun 9: duas fontes para o mesmo fato), e cada uma lê um contador que
**nunca decresce**, então uma conquista lida como aberta não fecha:

| Id | Abre quando | O contador que lê |
|---|---|---|
| `perfect-day` | `totalPerfectDays ≥ 1` ou `perfectDays ≥ 1` | [§7](#dia-completo) |
| `habit-7` / `habit-21` / `habit-66` | o **maior** `totalDone` entre os `habitRhythms` ≥ 7 / 21 / 66 | os marcos de `HABIT_MILESTONES`, [§28](#marcos) — `totalDone`, **não** sequência |
| `first-evolution` | algum id em `unlockedEvolutions` ≠ `'rookie'` | [§17](#evolucao) |
| `mega-form` | `evolutionStage` começa por `mega` ou é `ultra` | [§14](#escada) |
| `dungeon-10` | `dungeonRunsCompleted ≥ 10` | [§51](#masmorra) |
| `tournament-champion` | algum `trophies[].place === 1` | [§53](#torneio) — 2º e 3º lugar **não** abrem |
| `tasks-100` | `completedTasks.length + activityLog.length ≥ 100` | cosmética, sem moeda — ver abaixo |

A arte é `src/utils/emblemArt.ts` → `emblemArt(id)` (glob de
`src/assets/soulmon/emblems/*.png`, 64² com alfa, chave = nome do arquivo = id da
conquista) e `EMBLEM_COUNT` como guard de instalação. Sem arte → `undefined` →
não desenha.

**Dono.** `src/utils/achievements.ts` (regra) · `src/utils/emblemArt.ts` (arte e
`emblemFor`, o mapa tier → emblema usado pela cerimônia de marco).

**Régua.** `src/utils/achievements.test.ts` — save novo abre nenhuma; cada uma
abre pelo próprio contador e nenhuma lê streak; `EMBLEM_COUNT` é 9 e todo id tem
arte.

**Decisão.** Decisão do dono de 15/09/2026 registrada no cabeçalho de
`emblemArt.ts` e em `docs/INVENTARIO-ASSETS.md` §7 (SQUAD-ARTE, D1–D9): emblema
aparece **dentro do visor** — Ficha do Pet, slot `trophy`, segmento Torneio da
loja. A colocação na Ficha é do canvas Pet (`DECISOES-WIREFRAME.md` §22).

**Casos de borda.**
- **`tasks-100` é a única que conta tarefas**, e é aceita porque é **cosmética**
  — não paga Bits, Emblema nem atributo, o mesmo estatuto do bestiário. A
  proibição #16 ([`01 §7`](01-VISAO.md#as-linhas-vermelhas)) é sobre recompensa
  **paga** por contagem; o cabeçalho do módulo declara a fronteira.
- **`habit-*` lê `totalDone`**, que a poda de `HISTORY_CAP` não toca — por isso
  o de 66 continua alcançável.
- **Save antigo sem os campos**: todo acesso tem `?? 0` / `?? []`; nenhuma
  conquista abre por `undefined`.
- **Emblema-MOEDA ≠ emblema-CONQUISTA**: `emblems` no save ([§46](#moedas)) é
  número e compra `TOURNAMENT_ITEMS`; este mapa é de conquistas e **conquista
  nunca se compra**.

**O que NÃO faz.** Não persiste nada (não há campo `achievements` no save). Não
dá moeda, item, atributo nem `perfectDay`. Não notifica nem abre cerimônia
própria — a única cerimônia é a do marco de hábito ([§28](#marcos)), que
reaproveita a peça. Não fecha: não existe "perder conquista".

**Onde a UI mostra.** `src/components/PetPage.tsx` (Ficha: `emblemArt(id)` para
cada id de `unlockedAchievements(gameState)`, passado pelo `src/App.tsx`, em duas
linhas) e `src/components/MilestoneCeremony.tsx` (`emblemFor(tier)`).

---

<a id="mapas-de-arte"></a>
## 57-B. 🎨 Mapas de arte que carregam regra

**Em uma frase.** Módulos de `src/utils/` que só mapeiam id → URL de arte, mas
cujo cabeçalho fixa uma regra de USO (o que pode e o que não pode ser desenhado)
— a regra é o que interessa aqui; a peça em si é de
[`04-IDENTIDADE-VISUAL.md`](04-IDENTIDADE-VISUAL.md) e o símbolo de
[`06-REFERENCIA/`](06-REFERENCIA/).

| Módulo | O que mapeia | A regra que carrega | Consumidor em 20/09/2026 | Régua |
|---|---|---|---|---|
| `src/utils/attackFxArt.ts` → `attackFx`, `auraForElement`, `ATTACK_FX_COUNT` | FX de ataque por `'<elemento>:<estado>'` — 18 base (incl. neutro) + 136 derivados × 6 estados (`cast`/`aura`/`slash`/`impact`/`defended`/`orb`) = 924 | **Só `aura` é chamada** (decisão D9 do dono, 15/09/2026), pelo elemento dominante, na Evolução/Ficha. O combate segue genérico: `buildDungeonWave` sorteia por tier, e os popups de `DungeonGame`/`NightmareBattle` usam `fxArt.ts`. ⚰️ `derivedAttackFxArt.ts` (só os derivados) **não existe mais** — virou este módulo quando os base entraram; `derivedAttackFx` fica como alias `@deprecated`. ⚠️ O regex do glob era guloso e gravava `ataque/fx-fogo:aura`: 924 peças e **nenhuma encontrável**, a aura nunca foi desenhada até 20/09/2026 | `EvolutionPath.tsx`, `PetPage.tsx` | `src/utils/attackFxArt.test.ts` (`ATTACK_FX_COUNT` = 924, chave correta) |
| `src/utils/emblemArt.ts` → `emblemArt`, `emblemFor`, `EMBLEM_COUNT` | os 9 emblemas de conquista | conquista nunca se compra; `emblemFor` é o mapa tier → emblema do marco | `PetPage.tsx`, `MilestoneCeremony.tsx` | `src/utils/achievements.test.ts` |
| `src/utils/sigilArt.ts` → `sigilArt`, `SIGIL_COUNT` | 45 sigilos do class-system (elementos/escolas base, estados de talento, `fam_*`, `prof_*`, `soullink`), chave = nome do arquivo | sem arte para a chave → `undefined` → o consumidor mostra **nada** (nunca emoji, nunca box). A chave vem de `ClassTitle.sigilo` ([§22](#oraculo)) | `PetPage.tsx` (Ficha, canto do visor) | `src/components/PetPage.render.test.tsx` (sigilo só quando a classe traz chave; chave sem arte = nada) |
| `src/utils/placeholderArt.ts` → `PLACEHOLDER_ART` | `dormant` / `forming` / `glitch` — o cristal do meio da cena da Home (v4, 256² alfa) | **um estado, um significado**: apagado = ainda vai nascer; aceso = gerando; rachado = falhou e pode pedir de novo. Só para quem **não** é personagem pronto | `BirthCard.tsx` (nunca `glitch`), `EvolutionPath.tsx` | `src/components/BirthCard` e `EvolutionPath` render tests |
| `src/utils/hudArt.ts` → `HUD_ART` | moldura de barra 96×8, segmento 6×6, moldura 9-slice 96² (`frameSlice` = 24) | HUD **dentro do visor** é pixel, não vetor (D3 do dono, 15/09/2026) | `pixel/VisorBar.tsx`, `ui/Viewport.tsx` (`frame`) | canvas Sistema SIS-05/X2 |
| `src/utils/animArt.ts` → `ANIM_ART` | 8 spritesheets 64² horizontais (`eatCrumbs`, `heartBurst`, `showerSplash`, `sleepZ`, `poopPlop`, `sparklePop`, `dustStep`, `hungerDrop`) com `frames` | efeitos **ao redor** do pet: o sprite da criatura continua **único** e se expressa por deformação (D5 do dono) — há guard de que nenhum `lines/*.png` é tira de quadros | `components/pixel/SpriteAnim.tsx` | guard D5 dos sprites (`711be279`) |
| `src/utils/gainArt.ts` → `GAIN_ART`, `MOVE_ART` | selos de ganho 96² e movimentos 64² estáticos | **Só `evolutionBurst` é chamado** em 20/09/2026 — o burst a 3× atrás do sprite na cerimônia (canvas Evolução D-E6, `b83f30cd`); os outros momentos previstos (`perfectDay`, `levelup`, `chest`, `heal`, `poof`, `dustPuff`) entram quando o canvas do fluxo definir. ⚠️ o cabeçalho do módulo ainda diz "mapa pronto; a chamada entra quando o canvas definir" e chama o burst de "hoje vídeo" — apurado em 21/09/2026 | `EvolutionCeremony.tsx` (`GAIN_ART.evolutionBurst`) | nenhuma — `grep -rn "GAIN_ART\." src/components` (1 ocorrência em 21/09/2026) |
| `src/utils/dayKeyLabel.ts` → `dayKeyLabel(day, isPt)` | data CURTA de um `dayKey` ("12/09" / "Sep 12"), aceitando ISO **e** `toDateString()` | o ISO é montado **à mão**: `new Date('AAAA-MM-DD')` é meia-noite **UTC** e em fuso negativo (o Brasil inteiro) vira o dia anterior — o diário mostraria 07/09 para um achado do dia 08 | `AdventureDiary.tsx`, `DreamDex.tsx` | `src/components/AdventureDiary.render.test.tsx` |
| `src/types/category-icons.ts` → `CATEGORY_ICON_NAME`, `categoryIconName` | categoria → nome de ícone Material Symbols | ícone de categoria é ícone de **interface**, mora fora do visor e é **vetor** — o ÚNICO caminho, também nos chips de criação/edição e no onboarding (canvas Atividades D-A7). ⚰️ `CATEGORY_ICON_IMG` / `categoryIconImg` (os PNG `icon-cat-*.png`) **saíram em 20/09/2026**; os PNG ficam só como arquivo de arte, sem importador. A categoria vem do ESTADO e pode ser inválida (`'study'` minúsculo, ausente) → `undefined` → não desenha | Home, `CreateModal`/`EditModal`, onboarding | os `*.render.test.tsx` das telas |

**O que NÃO faz.** Nenhum destes módulos decide regra de jogo: não pontua, não
grava no save, não escolhe galho. Onde um cabeçalho diz "sem chamada", é porque
o momento é decisão de canvas, não porque a arte falte.

---

<a id="notificacoes"></a>
## 58. 🔔 Notificações como regra

**Em uma frase.** Existem quatro coisas que podem chegar sem o app aberto, cada
uma com uma condição escrita — e nenhuma delas cobra.

> Este bloco é sobre **o QUE dispara e QUANDO**. A infraestrutura (Web Push
> VAPID, FCM, o cron do worker, o `sw.js`) é do
> `08-INTEGRACOES-E-DEPLOY.md`.

**A regra.**

| Aviso | Quando | Condição | Dono da copy |
|---|---|---|---|
| Lembretes do dia | `PUSH_HOURS_BRT` = **10, 16, 22** (BRT) | nenhuma no worker (ele não sabe da meta); os dois primeiros dias têm voz própria e **nunca no D0** | `pushCopy` (`functions/api/_pushCopy.js`) |
| Aviso da noite | **20h**, uma vez por dia | **só se a meta do dia NÃO foi cumprida** (`completedSteps < totalRequired`) **e** só se **não houver janela de descanso configurada** | `eveningCopy` (`functions/api/_pushCopy.js`) |
| Lembrete de deitar | `SLEEP_REMINDER_LEAD_MIN` = **30 min** antes do início da janela que a PESSOA escolheu | a janela existir | `sleepReminderCopy` (`functions/api/_pushCopy.js`) |
| Cocô | duas vezes: quando o cocô **aparece**, e no intervalo de **30 min** que antecede um tick de dreno (`30 * 60000`, literal no `src/App.tsx` — não é o `SLEEP_REMINDER_LEAD_MIN` da linha acima) | o tick de aviso só dispara **se ele for cobrar** (`remainingDrainToday > 0`, pet acordado, cocô sujo) | inline em `src/hooks/useCareSystem.ts` e `src/App.tsx` |

**Por que existe um dono único de HORÁRIO e TEXTO.** A mesma notificação é
entregue por TRÊS caminhos, cada um numa árvore diferente:
`src/components/NotificationManager.tsx` (web/PWA por poll, e Android nativo por
`AlarmManager`), `workers/push-scheduler.js` (Web Push + FCM por cron) e
`workers/wrangler.toml` (as horas do cron). Nada no CI comparava os dois, e foi
assim que uma auditoria de tom removeu o nudge das 21h num caminho e o deixou
vivo no outro: quem tinha push instalado continuou recebendo, todo dia,
**incondicionalmente** — sem nem a checagem de "já cumpriu a meta" que a versão do
cliente tinha.

**⚰️ O nudge das 21h não existe mais**, e a hora 21 saiu de `PUSH_HOURS_BRT` de
propósito: nada deve pedir uma quarta visita ao app, e cobrar tarefa na hora de
dormir é o oposto de um companheiro. ⚰️ O **lembrete diário das 12h** também foi
removido — era o único texto de push que cobrava e o único fora do dono único.

**O lembrete de deitar tem precedência sobre o das 20h.** Com a janela padrão
(23:00) a noite mandava TRÊS pushes em 2h30 — 20h pedindo execução, 22h "boa
noite" e 22h30 o lembrete de deitar. Push repetido no mesmo intervalo produz
habituação, e desligar push é irreversível na prática. Quem cede é o das 20h,
porque é o único dos três que pede EXECUÇÃO.

**Três coisas que o lembrete de deitar NÃO faz**, e as três são a regra da Janela
de Descanso ([§40](#janela-descanso)): não diz a hora ("são 22h30" é um relógio
cobrando); não fala de desempenho (todo feedback dessa mecânica é de MANHÃ,
dentro do app, em forma de sonho); e não condiciona a nada — um push de cobrança
perto da hora de dormir é exatamente o estímulo que atrapalha o sono que ele
alega proteger.

**O segundo convite de permissão.** `src/utils/pushPriming.ts` →
`shouldPrimePush`. O primeiro convite já é permission priming contextual (depois
da primeira conclusão real). O segundo existe porque quem dispensou no dia 1
nunca mais era convidado — e no dia 1 ninguém sabe se o app vai importar. Quatro
travas: `PRIMING_MIN_DAYS` = 2 e `PRIMING_MAX_DAYS` = 3 (nunca no D0/D1, nunca
depois do D3); **uma vez só** (não existe terceiro); nunca sobre quem voltou de
uma ausência; nunca para quem já ligou. Mais
`PRIMING_MIN_HOURS_AFTER_DISMISS` = 24 desde o "agora não". A frase é do PET, na
primeira pessoa, e **pergunta** — "Posso te lembrar de mim amanhã?", não "ative
as notificações para não perder seu progresso".

**Alarmes de item.** `syncActivityAlarms` e `syncTaskAlarms`
(`src/utils/notifications.ts`) só existem quando o próprio usuário marcou um
horário na atividade ou um prazo na tarefa. Só do dia de hoje, e o conjunto é
**substituído** a cada sincronização em vez de acumular.

**Dono.** `functions/api/_pushCopy.js` — **dono único do texto e do horário**
(`PUSH_HOURS_BRT`, `PUSH_HOURS_UTC`, `pushCopy`, `eveningCopy`,
`sleepReminderCopy`) · `src/components/NotificationManager.tsx` (as CONDIÇÕES do
cliente) · `src/utils/restWindow.ts` → `sleepReminderAt` (a hora do deitar) ·
`src/utils/pushPriming.ts` (o segundo convite) · `src/utils/notifications.ts`
(o disparo e os alarmes de item).

**Régua.** `workers/pushCopy.parity.test.js` (trava as três árvores),
`workers/push-scheduler.test.js`, `src/utils/pushPriming.test.ts`,
`src/utils/restWindow.test.ts`, `functions/api/_pushTargets.test.js`,
`src/plugins/widgetSemCobranca.contract.test.ts` (a superfície passiva vizinha,
que também não cobra).

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.7 —
"Nunca notificação de culpa ou medo; a voz do pet nunca cobra", com a alternativa
rejeitada escrita na letra ("Seu pet está morrendo sem você").

**Casos de borda.**
- **A CONDIÇÃO das 20h fica no CLIENTE de propósito**: o worker não sabe se a meta
  do dia foi cumprida (a assinatura guarda só endpoint, chaves, nome e idioma), e
  foi exatamente assim que o nudge das 21h passou a cobrar quem já tinha feito
  tudo. Só o TEXTO mudou de casa.
- **HP baixo troca o pedido por acolhimento** (`eveningCopy(..., hpBaixo)`): com um
  coração, o que a pessoa menos precisa é de mais uma tarefa na frase.
- **Os dois canais compartilham a TAG da copy**, e é ela que impede a duplicata: o
  `AlarmReceiver.kt` notificava por `id.hashCode()` e o `workers/fcm.js` por
  `android.notification.tag`, então o Android tratava as duas como notificações
  diferentes e o mesmo aviso chegava DUAS vezes.
- **`sleepReminderAt` empurra para o dia seguinte** quando o alvo já passou; janela
  com hora ilegível devolve `null`.
- **O aviso de cocô só sai se o tick for cobrar**: com o teto do dia já gasto, ele
  prometeria um dano que não acontece.
- **Idioma**: o título do push das 22h já chegou em PT para quem tinha escolhido
  inglês. `resolveLanguage` (`src/utils/i18n.ts`) é o ponto único.

**O que NÃO faz.** Não manda push de culpa. Não avisa que alguém do grupo faltou
([§56](#comunidade)). Não notifica durante a noite. Não pede uma quarta visita ao
app. Não inventa texto de fallback para uma hora fora de `PUSH_HOURS_BRT` —
`pushCopy` devolve `null`, e mandar algo genérico é como o nudge das 21h
voltaria.

**Onde a UI mostra.** `src/components/NotificationManager.tsx` (sem render
próprio), `src/components/SettingsPage.tsx` (ligar/desligar, janela do sono), o
card de priming na Home (na fila de avisos, ver a regra das DUAS FILAS).

---

<a id="som"></a>
## 58-A. 🔊 Som como regra: o que toca, de onde vem, e o que fica mudo

**Em uma frase.** Oito sons, todos por gesto e nenhum obrigatório; desde
21/09/2026 três deles preferem um arquivo gerado por IA e caem no sintetizado
quando o arquivo não está pronto, e existe uma trilha que só toca se o jogador
a ligar.

> Este bloco é sobre **QUAL som toca em QUAL evento, quem decidiu e o que trava**.
> A identidade sonora (as oito peças, o barramento, a escada de loudness, R-CAT /
> R-EX / R-NOVA) é do [`04-IDENTIDADE-VISUAL.md`](04-IDENTIDADE-VISUAL.md) §9;
> o guia operacional é [`docs/SOM.md`](../SOM.md).

**A regra.**

| Evento | Símbolo (`src/utils/sounds.ts`) | Fonte desde 21/09/2026 (S16) |
|---|---|---|
| Evolução | `playEvolve` | asset `ASSETS_DE_SOM.playEvolve` (`/sounds/evolve.webm`), fallback procedural |
| Degeneração | `playDegenerate` | asset `ASSETS_DE_SOM.playDegenerate`, fallback procedural |
| Tarefa concluída | `playTaskComplete` | asset `ASSETS_DE_SOM.playTaskComplete`, fallback procedural |
| Presença, comida, banho, sono, sintonia do visor | `playPresence`, `playFeed`, `playShower`, `playSleep`, `playVisorTune` | procedural, sem asset (o gerador reprovou nos curtos — `PERGUNTAS-DO-DONO.md` #9/#10) |
| Trilha | `ligarTrilha` / `desligarTrilha` (`src/utils/trilha.ts`) | duas camadas em loop (`CAMADAS_DA_TRILHA.base` + `.ritmo`), nasce desligada |

- **Asset se já decodificou, senão o procedural desta vez** — `playComAsset`
  em `sounds.ts`: chama `prepararAssets` (dispara a carga dos três de uma vez,
  na primeira chamada) e depois `assetPronto`; nunca espera e nunca fica mudo.
  A carga acontece **dentro** de um `play*`, ou seja, depois do gate de mudo e
  do gesto — zero byte de áudio no bundle inicial e zero em `PRECACHE_URLS`
  (S6). `carregarAsset` nunca lança: `fetch` falho, resposta não-`ok` ou motor
  sem `decodeAudioData` devolvem `null`.
- **Procedência nas duas direções** (S9): cada entrada de `ASSETS_DE_SOM` e
  `CAMADAS_DA_TRILHA` carrega `sha256`, `bytes`, `origem`, `promptRef` e
  `geradoEm`, e o teste casa manifesto ↔ arquivo em `public/sounds/` ↔ linha
  de [`docs/Attributions.md`](../Attributions.md) (seção Áudio). Prova
  procedência, nunca originalidade.
- **A trilha nasce desligada e só começa por gesto** (S2): a chave é
  `STORAGE_KEYS.SOUND_TRACK_ENABLED`, **separada** de `SOUND_MUTED`; o mudo
  global cala a trilha, o inverso não vale. Numa sessão nova, com a preferência
  ligada, ela recomeça no **primeiro gesto sonoro** (`aoGestoSonoro`, chamado
  por todo `play`), nunca no carregamento.
- **E0** (peça extraída da S13): a trilha para em `document.hidden` (o
  `audioBus` suspende o contexto; `trilha.ts` só retoma em `visibilitychange`
  se `ligadaNestaSessao`), ao dormir (`handleSleep` em `App.tsx` chama
  `pausarTrilha`; acordar chama `retomarTrilha`) e no mudo global
  (`handleToggleSound` em `App.tsx`, único desde `980bc84c`, passado como
  `onToggleSound` à `SettingsPage` e ao `SettingsModal` — mesmos dois símbolos).
- **Loop e camadas**: as duas camadas partem no mesmo `t0` e fecham em
  `loopEnd = duracaoS` (12 compassos a 100 BPM — o arquivo carrega 1 s de cauda
  além disso); o ganho da soma vem de `TRIM_TRILHA_POR_CAMADAS_DB[n]` em
  `src/utils/loudness.ts`, dono único do alvo (footgun 9 — `sonsAssets.ts` não
  declara LUFS nem dBTP, e há teste para isso).
- **Teto de peso**: a soma dos `bytes` do manifesto cabe no teto do teste de S6
  (medido em 21/09/2026: `ls -l public/sounds` → 5 arquivos, 258 248 bytes).

**Dono.** `src/utils/sounds.ts` (`playComAsset`, qual evento prefere asset) ·
`src/utils/sonsAssets.ts` (`ASSETS_DE_SOM`, `CAMADAS_DA_TRILHA`, `carregarAsset`,
`recortarSilencio`) · `src/utils/trilha.ts` (`ligarTrilha`, `pausarTrilha`,
`retomarTrilha`, `aoGestoSonoro`) · `src/utils/audioBus.ts`
(`definirTrilhaLigada`, `garantirBarramento`, `busTrilha`).

**Régua.** `src/utils/sonsAssets.contract.test.ts` (S9 nas duas direções, S6
teto e `PRECACHE_URLS`, nenhum `import` de `.webm`, camadas com a mesma
`duracaoS` múltipla do compasso, footgun 9, `recortarSilencio`);
`src/utils/audioBus.contract.test.ts` (a chave da trilha é separada de
`SOUND_MUTED` e nasce ausente); `src/utils/sounds.contract.test.ts`;
`src/components/settingsSom.render.test.tsx` (desde `980bc84c`: as chaves
"Sons"/"Trilha" existem na `SettingsPage` em PT e EN, o toque em "Sons" chega
ao `onToggleSound` e o toque em "Trilha" liga/desliga a chave própria —
`trilhaPreferida()`). **Para `trilha.ts` em si (E0, pausa, retomada,
`aoGestoSonoro`): régua: nenhuma** (`grep -rl "utils/trilha" src
--include=*.test.*` → só `settingsSom.render.test.tsx`, que exercita o gesto
pela tela, 21/09/2026).

**Decisão.** [`REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §6.1 **S16**
(instalar "só pra ter pronto", sem o A/B cego) e a nota de 21/09/2026 (fim do
dia): o dono disse primeiro "Coloca o A" (`c703c8bc`, `evolve.webm` saiu) e,
perguntado, corrigiu — **"quero o gerado nos 3"** (`73be1a2f`, `evolve.webm`
voltou). É escolha do dono, não resultado do protocolo do A/B, que segue
**não ouvido**; "o procedural venceu" e "a IA venceu" continuam proibidas
(S10). S2, S6, S9 e a S13 congelada valem como antes.

**Casos de borda.**
- Primeiro `play*` da sessão: o asset ainda não chegou → toca o procedural; o
  segundo já toca o arquivo. Não há espera nem fila.
- O MediaRecorder grava um pré-rolo de silêncio: `recortarSilencio` acha o
  onset (`LIMIAR_ONSET`) ao decodificar, e o som começa no gesto. Tudo-silêncio
  devolve o buffer original, nunca vazio.
- Só as camadas que chegaram tocam; o trim é o do NÚMERO que toca (1 ou 2).
- Aba oculta antes de `comecar()` terminar: `comecar` reconfere `pausada` e
  `ligadaNestaSessao` depois do `await` e desiste.

**O que NÃO faz.** Não toca nada sem gesto (D11, nos chamadores). Não espera o
`fetch` para tocar. Não decide alvo de loudness (é do `loudness.ts`). Não
liga a trilha por padrão nem a religa ao voltar de `hidden` se o gesto não
foi desta sessão. Não descongela a máquina E0–E6 (duas camadas tocam juntas,
um estado só). Não muda a categoria de um som pelo nível do arquivo (R-CAT).

**Onde a UI mostra.** Grupo **"Som" / "Sound"** da `SettingsPage`
(`src/components/SettingsPage.tsx`, desde `980bc84c`, 21/09/2026): switch
"Sons" / "Sound effects" (`checked={!soundMuted}`, `onToggle={onToggleSound}`)
e switch **"Trilha" / "Music"** (`ligarTrilha`/`desligarTrilha`, estado local
por `trilhaPreferida()`), com hint que troca conforme `soundMuted` ("Duas
camadas calmas, em loop…"). O grupo só monta se `onToggleSound` chegar
(`App.tsx` passa `handleToggleSound`). O mesmo par existe no `SettingsModal`
("Ajustes rápidos"), que **segue sem gatilho vivo** (`setSettingsOpen(true)`
só em `handleOpenAISettings`, cuja prop morre no `ChatBox` —
[`03` §4.23a/§4.23b](03-FLUXO-DE-TELAS.md)) e é candidato a remoção. ⚰️ Entre
`ee79fd44` e `980bc84c` (mesmo dia) não existia caminho vivo para o jogador
ligar a trilha nem o mudo global — achado do doc-mantenedor, fechado em
`980bc84c` (régua `settingsSom.render.test.tsx`); ver D33.

---

<a id="divergencias"></a>
## 59. ⚠️ Divergências com o `CLAUDE.md`

O que segue é o que o **código** faz e o `CLAUDE.md` (ou um comentário do próprio
código) descreve de outro jeito, apurado em 09 e 10/09/2026 (D1–D12 em
09/09/2026; D13–D27 em 10/09/2026), em 20/09/2026 (D28–D30, sincronização
`2580b73a..dc72579e`), em 21/09/2026 (D31, sincronização
`dc72579e..9875477b`) e em 21/09/2026 (D32–D33, sincronização
`5ac3d351..73be1a2f`, som). A precedência do
cabeçalho vale: **o código está certo**. Nenhuma linha aqui é proposta de
mudança — cada uma é um item para o [`STATUS.md`](../STATUS.md), que o
orquestrador recolhe.

As **seções 1 a 10** deste documento foram escritas antes desta e **não
registraram divergência nenhuma**.

| # | Onde | O `CLAUDE.md` diz | O código faz | Como conferir |
|---|---|---|---|---|
| D1 | tabela 🫶 e 🛒 | o **coraçãozinho** é "comprado na loja ou dropado na masmorra", a 150 Bits | ⚰️ **não é mais vendido** desde 06/09/2026 (D7+D15). Continua existindo e curando por `SPECIAL_ITEMS`; a única fonte é o drop da masmorra | `SHOP_ITEMS.filter(i => i.kind === 'heart').length === 0`; a lápide está no lugar do item em `src/utils/shop.ts` |
| D2 | tabela 💎 | Créditos gastam em "reroll (50), **cura instantânea (10)** e troca por Bits" | ⚰️ a **cura instantânea não existe** — `utils/instantHeal.ts` foi apagado junto. Restam reroll (`REROLL_COST_CREDITS`) e `BITS_EXCHANGE` | `ls src/utils/instantHeal.ts` falha; a lápide D7+D15 está em `src/App.tsx`, logo ABAIXO de `handleBuyCreditPack`. [`REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.4 já registra "REMOVIDA ✅ resolvido" |
| D3 | tabela 🛒 | "Loja em ABAS (Itens/Cenários/Mobílias/**Torneio**/Missões)" — cinco | **dois segmentos** (`ShopSegment = 'shop' \| 'tournament'`). Itens/Cenários/Mobílias viraram seções de um scroll único, e ⚰️ **a aba Missões morreu** — a explicação do cadeado passou para a linha do próprio item | `grep -n "ShopSegment" src/components/ShopModal.tsx`; o cabeçalho do arquivo documenta os dois cortes |
| D4 | footgun 9, item do Vínculo | o gate de PvP usa "cliente (**`canPvp`**)" | o símbolo **não existe**. O cliente tem `meetsPvpBond` e `xpToPvpBond` (`src/utils/bond.ts`); o servidor decide em `functions/api/community.js` ação `profile`, com `bondLevelOf` de `functions/api/_bond.js` | `grep -rn canPvp src desktop functions` não devolve nada |
| D5 | tabela ⚔️ | "`getDungeonEnemySprite(tier, petStage)` tira do sorteio a linha que o jogador está usando, pra ninguém encarar um espelho de si mesmo" | a assinatura é `getDungeonEnemySprite(tier, excludeLine)` e `excludeLine` é comparado com **ids de LINHA** (`ignar`…`thalindra`). `buildDungeonWave(level, petStage)` repassa o **estágio de evolução** (`rookie`, `champion-virus`…), que nunca casa — **a exclusão não dispara em jogo**. O `demoCharacterId`, que É um id de linha, chega ao `DungeonGame` e é usado só para o sprite do próprio jogador | `grep -n "buildDungeonWave(" src/components/DungeonGame.tsx` e `grep -n "getDungeonEnemySprite" src/utils/dungeon.ts`; a função em si está correta e tem teste (`src/utils/sprites.dungeonRoster.test.ts`, "excludeLine tira a linha do jogador do sorteio") — o defeito é do CHAMADOR |
| D6 | tabela ⚔️ | "**Sem limite diário e SEM gate de entrada**… Se farmar Bits virar problema, a alavanca é custo de ENTRADA em Bits" — escrito como hipótese futura | a alavanca **já existe** (WP4.5): `DEEP_START_BASE_COST` = 40, `deepStartCost(n) = 40 × n`, `DEEP_START_MAX_LEVEL` = 5, `canBuyDeepStart`. Não contradiz o "sem gate" (a compra é opcional e sobe a base), mas a tabela não a menciona | `grep -n "DEEP_START" src/utils/dungeon.ts`; `src/utils/dungeon.deepStart.test.ts` |
| D7 | tabela 🎪 / 🎖️ | nada sobre teto de partidas | há **teto diário de partidas de Torneio no servidor**: `MATCHES_PER_DAY` = 5; estourar devolve `429 daily limit` | `grep -n "MATCHES_PER_DAY" functions/api/community.js` |
| D8 | tabela 🎪 | fala só da "Rodada do Torneio" (semanal) | existem **três** calendários com nomes parecidos: a **rodada** semanal (`src/utils/tournamentSeason.ts`), a **season** do ranking, que é **MENSAL** (`currentSeason()` em `functions/api/community.js`, `YYYY-MM`, e é ela que fecha e dá troféu), e as **estações** trimestrais (`src/utils/seasons.ts`) | `grep -n "const currentSeason" functions/api/community.js` |
| D9 | tabela ⚔️, bestiário | "as 24 artes possíveis (6 linhas × 4 tiers de arte — baby-i/ii reusam o rookie)" | a GRADE é 24, mas a **chave gravada não é colapsada**: `enemyKey(tier, line)` grava `linha-baby-i` e `linha-baby-ii`, que `BestiaryCard` nunca lê. O save recebe até **36** chaves, e um encontro em baby-i não revela a célula de rookie | `grep -n "LADDER_TIERS" src/utils/dungeon.ts` × `const TIERS` em `src/components/BestiaryCard.tsx` |
| D10 | tabela 🧮 | "o DIA de todo registro diário que mora no save é o DIA DO JOGADOR", com sete famílias listadas | os registros da masmorra **não moram no save**: `DUNGEON_HEART_DROPS` usa `new Date().toDateString()` (o dia do APARELHO) e o `localStorage`; `DUNGEON_DIFFICULTY` usa um `weekKey()` local; `DUNGEON_BEST` idem. O teto de 2 coraçõezinhos/dia e a base semanal são, portanto, **furáveis trocando de aparelho** — o mesmo furo que `careCaps` fechou para carinho e comida | `grep -n "toDateString\|STORAGE_KEYS.DUNGEON" src/utils/dungeon.ts` |
| D11 | comentário de `src/utils/arena.ts` | o cabeçalho afirma, com data (07/09/2026), "**SEM CONSUMIDOR** — nenhuma tela chama nada daqui" | falso desde 09/09/2026: `src/components/ArenaGame.tsx` importa 15 símbolos do módulo e é aberta pela `ActivitiesPage`. O `CLAUDE.md` também não menciona a Arena em lugar nenhum | `grep -rn "utils/arena" src --include=*.tsx` |
| D12 | comentário de `src/utils/specialItemUse.ts` | chama o coraçãozinho de "a **única cura comprável**" (duas vezes) | consequência do D1: ele não é comprável desde 06/09/2026 | `grep -n "comprável" src/utils/specialItemUse.ts` |
| D13 | tabela 🥚 (§20) | Renascimento perde "o estágio e os três atributos, e SÓ" | `handleRebirth` (`src/App.tsx`) também grava `maxActivityCap: FORM_REQUIREMENTS.rookie.cap` — o teto de hábitos cai de até 10 para 6; é a única regra que encolhe esse teto | `grep -n "maxActivityCap" src/App.tsx` |
| D14 | tabela 🔒 (§17) | — | o comentário de `src/utils/dailyReset.ts` acima do ramo `!MANUAL_EVOLUTION` ainda diz que "a evolução acontece na virada seguinte ao destravar" — a frase que `evolucaoManual.contract.test.ts` proibiu na UI; o guard só varre strings | `grep -n "virada seguinte" src/utils/dailyReset.ts` |
| D15 | §15 / §17 | — | três regras sem leitor vivo: `XP_THRESHOLDS` → `nextLevelXP` (o `CompanionHUD` desestrutura e não desenha); `attributesSinceLastEvolution` (único leitor é o ramo morto); `handleEvolveToUnlocked` sem chamador (`showEvolutionChoice` nunca vira `true`) | `grep -rn "setShowEvolutionChoice" src/` |
| D16 | 🎯 Foco do dia (§32) | "as 3 completas = selo do dia" (também em `GuideModal.tsx` e `HelpModal.tsx`) | `focusComplete` (`src/utils/taskTriage.ts`) exige TODOS os focos ESCOLHIDOS — quem escolheu 1 e concluiu recebe o selo; `MAX_DAILY_FOCUS` é teto, não requisito | `src/utils/taskTriage.test.ts`, "focusComplete só é verdadeiro com todos os focos feitos" |
| D17 | 🧹 Triagem (§34) | "Terminar rende recompensa" | não há recompensa material: `handleTriageResolve` (`src/App.tsx`) só troca `status`/`startDate`; a recompensa é a tela `TriageDone` de `TriagePile.tsx` | `grep -n "handleTriageResolve" src/App.tsx` |
| D18 | 👻 Assombrada (§29) | bônus de alívio = "comemoração maior" | além da fala e do toast, concluir uma assombrada entrega **uma comida** (`FOOD_BY_CATEGORY`) em `handleToggleTask` | `grep -n "haunted" src/App.tsx` |
| D19 | 📈 Constância (§25) | — | duas mecânicas vivas e testadas que a tabela omite: a aura `steadyWindow`/`STEADY_WINDOW_DAYS` = 28 (`src/utils/habitRhythm.ts`) e as falas `HABIT_CHEER_AT` = [3, 36, 51]/`cheerReached` (`src/types/taskModel.ts`) | `src/utils/cheer.test.ts` |
| D20 | ☀️ Rituais (§37) | o check-in tem "hábitos do dia + até 3 focos + **humor**" | `MorningCheckIn.tsx` não tem `mood`; o humor mora no `DailyReportModal` (`handlePickMood`), como a linha 😊 do próprio `CLAUDE.md` diz | `grep -c "mood" src/components/MorningCheckIn.tsx` → 0 |
| D21 | 🌱 Fresh start (§39) · 📅 semanal (§38) | "Toda segunda ou dia 1" · só o gate de semana | `freshStartOffer` devolve `null` sem tarefa ativa com `postponedCount > 0` (`freshStartHasSomethingToClear`); `needsWeeklyReport` exige também `weeklyReportHasSubstance` | `grep -n "HasSomethingToClear\|HasSubstance" src/utils/rituals.ts` |
| D22 | 🌠 Sonhos (§41) | cita `DREAM_CATALOG` por `utils/restWindow.ts` seguido de "linha 371" | formato que a linha 🧮 do próprio arquivo proíbe, e já escorregado em 10/09/2026; os números (30 = 12 + 10 + 8) conferem | `grep -n "DREAM_CATALOG" src/utils/restWindow.ts` |
| D23 | 🧮 dia do jogador (§44) | "todo registro diário que mora no save é o DIA DO JOGADOR" | `stepsDayKey` (`src/utils/steps.ts`) usa `toDateString()` (dia do APARELHO); passo não pontua, mas é a única leitura diária fora das sete famílias | `grep -n "toDateString" src/utils/steps.ts` |
| D24 | `docs/PLANO-TAREFAS.md` Parte 4 · comentário de `DailyReportModal.tsx` (§43) | "falta a arte das 24 cenas (hoje são emoji)" · "cobertura parcial (12)" | `adventureArt.ts` cobre as 24 e há 24 PNGs em `src/assets/soulmon/adventures` | `grep -c "'adv-" src/utils/adventureArt.ts` → 24 |
| D25 | comentário de `handleFeed` (`src/App.tsx`, §3) | "Limited to 5 feedings per rolling hour" | `FOOD_LIMIT_PER_HOUR` é derivado de `MAX_STAGE_REQUIREMENT` = 6 | `grep -n "5 feedings" src/App.tsx` |
| D26 | `REGISTRO-DE-DECISOES.md` §5.6 (§18) | "rota de redenção visível" marcada como não implementada | `applyRedemption`/`redeemed`/`showRedeemed`/`redeemedMark` estão em produção (WP4.19); o que falta é narrativa, não mecânica | `src/utils/redemption.test.ts` |
| D27 | comentário de `src/utils/currencies.ts` (§46) | cabeçalho ainda diz "Créditos → reroll, cura instantânea" | a cura instantânea foi removida em 06/09/2026 (D7+D15); há lápide em `App.tsx`, `CreditsModal.tsx`, `monetization.ts` e `shop.ts`, mas não aqui | `grep -n "cura instantânea" src/utils/currencies.ts` |
| D28 | "Arte e nomes" (§22, `01 §8`) | "os três personagens prontos se chamavam … hoje são **Pyraka, Akashaoi e Nimbrata**" | `PREMADE_CHARACTERS` tem **seis** desde 15/09/2026 (`c11dc49d`, D1 da SQUAD-ARTE): `igni`, `nautilu`, `astrase` entraram com nome de `DUNGEON_LINE_NAMES`. Apurado em 20/09/2026 | `grep -c "^    id: '" src/utils/monetization.ts` → 6 |
| D29 | comentários de `src/utils/achievements.ts` e `src/utils/emblemArt.ts` (§57-A) | cabeçalhos dizem "As **8** CONQUISTAS" / "os **8** EMBLEMAS" / "guard de instalação (8)", e o teste chama-se "as 8 conquistas têm arte instalada" | `ACHIEVEMENT_IDS` tem **9** ids, há **9** PNGs em `src/assets/soulmon/emblems/` e o próprio teste exige `EMBLEM_COUNT` = **9** (`tasks-100` entrou depois do cabeçalho). O `STATUS.md` de 15/09/2026 também diz "8 emblemas". Apurado em 20/09/2026 | `ls src/assets/soulmon/emblems` → 9 arquivos; `grep -n "EMBLEM_COUNT).toBe" src/utils/achievements.test.ts` |
| D30 | `CLAUDE.md`, tabela 💠 Bits (§46) | os Bits aparecem "em fonte de calculadora (`bitsStyle` retrô / `bitsStyleLight` tema claro)" — dois estilos, um por tema | os dois exports são **idênticos** e a cor é o token `--sm2-primary-ink` nos dois temas (canvas Loja D-L11, 20/09/2026); não há mais versão por tema | `grep -n "bitsStyleLight" src/utils/currencies.ts` |
| D31 | `CLAUDE.md`, bloco `docs/NARRATIVA-E-UNIVERSO.md` (`01 §7`) | a régua `src/narrativa.contract.test.ts` trava o vocabulário vetado "com a tabela `DÍVIDA` do que já está no app por decisão pendente" | a tabela chama-se **`EXCECOES`** desde `f3654076` (21/09/2026): a decisão §14.4 do `REGISTRO-DE-DECISOES.md` ("nenhum, aceito todos assim") mudou o estatuto de pendência a quitar para exceção declarada. O que a régua trava não mudou (termos nunca aceitos + espalhamento para arquivo novo) | `grep -n "EXCECOES\|DÍVIDA" src/narrativa.contract.test.ts` → só `EXCECOES` |
| D32 ⚰️ fechada em `15164e4c` (21/09/2026, dono autorizou corrigir o `CLAUDE.md`: cinco arquivos, S16, S1..S16) | `CLAUDE.md`, linha "Áudio — três arquivos" e bloco `docs/SOM.md` (§58-A) | `src/utils/sounds.ts` são "os **8 sons**, todos sintetizados, **zero byte de asset**"; as decisões canônicas são "**S1..S13**" | desde `ee79fd44` (21/09/2026, S16) há **cinco** `.webm` em `public/sounds/` e `playEvolve`/`playDegenerate`/`playTaskComplete` preferem o asset (`playComAsset`), com o procedural como fallback; são **cinco** módulos de áudio (`sonsAssets.ts` e `trilha.ts` entraram), e o registro vai até **S16** | `ls public/sounds` → 5 arquivos; `grep -n "playComAsset" src/utils/sounds.ts`; `grep -n "S16" docs/REGISTRO-DE-DECISOES.md` |
| D33 | ⚰️ hint do switch "Trilha" em `src/components/SettingsModal.tsx` (§58-A) | dizia "Uma camada calma, em loop" / "One calm looping layer" | `CAMADAS_DA_TRILHA` tem **duas** camadas (`base` + `ritmo`) desde `8a930657` (21/09/2026). **Fechada em `980bc84c`** (mesmo dia): o hint diz "Duas camadas calmas, em loop" no `SettingsModal` e na `SettingsPage`, e o cabeçalho de `trilha.ts` abre com "duas camadas em fase" | `grep -c "url: '/sounds/trilha-" src/utils/sonsAssets.ts` → 2; `grep -rn "Uma camada" src/components src/utils/trilha.ts` → vazio (21/09/2026) |

**Como usar esta tabela.** Antes de "corrigir" qualquer linha, leia a linha
correspondente do [`REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md): D1 e
D2 já são decisões tomadas (§5.4), então o que está velho é o `CLAUDE.md`, não o
código. D5, D9, D10 e D11 são achados novos e nenhum deles tem decisão registrada
— vão para o [`STATUS.md`](../STATUS.md) com a conta na mão, não para um commit
de conserto silencioso.
