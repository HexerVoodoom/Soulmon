# Regras de negócio — todas as regras do jogo, por sistema

> **Dono:** doc-redator-regras · **Data:** 07/10/2026 (sincronização `e3d55bb8..e71061b8`, Combate v3 PR1–PR18, prédios, missões, avatar: §55-B: PR14/15 ficha e família estável, PR16 selos/Maldição/Camada N, PR17 básico e par, PR18 torcida/especial/sons, árvore de talentos com os oito nós, prédios por Vínculo); anterior: 30/09/2026 (delta `3532ccf5..bcfe7ca6`: §56 `TERMS_VERSION` sobe para `2026-09-30` (Termos §8, Travessias opcionais), `PRIVACY_VERSION` fica em `2026-09-22`); anterior: 30/09/2026 (delta `cfe27cc7..3532ccf5`: §43 ganha o Passeio + Travessias (implementados), `adventureOfNight` e a exceção à regra 4; §54: a Exploração volta a ter dois lotes (Masmorra + Passeio), sai o ⚠️ "nada implementado"); anterior: 30/09/2026 (delta `4a894f90..cfe27cc7`: §54 marca que "a Exploração fica só com a Masmorra" foi revertido em parte só na decisão (Passeio + Travessias), sem lote novo no código); anterior: 30/09/2026 (delta `ae366480..5edfcfba`: §5 `playerDayIso`; §12 convite ao Refúgio; §46 Bits do Ateliê; §51 `DUNGEON_BITS_FACTOR`; §53 duelo fantasma e desistência = derrota; §54 três prédios, balanço, Refúgio, apoio, anfitriões; §57 estações renomeadas; §60 consulta do entitlement; §59 D40; missões: renome de `mission-perfect-30`); anterior: 30/09/2026 (sincronização `8e6d0d9a..ae366480`: §15 lápide do renomeio, ids `harmony`; §60 NOVO Administrador/GM e o corvinho); anterior: 28/09/2026 (sincronização do delta `f465d266..cf8a851d`, PR #133: §22 — criação única e proporcional (8 regras recalibradas por medição)); anterior: 28/09/2026 (sincronização do delta `25fd3c41..f465d266`, PR #131: §22 — companheiro na bio do reveal, bio × card de classe do rookie reconciliados pelo elemento); anterior: 28/09/2026 (sincronização do delta `83a9aac6..25fd3c41`, PR #129: §22 Oráculo — o caminho (poder/harmonia/benevolencia) passa a pesar sobre o elemento, `ALIGNMENT_ELEMENT_AFFINITY` em `axes.ts`); anterior: 28/09/2026 (sincronização do delta `8110efc5..83a9aac6`, PR #127: §22 Oráculo — `pickFamilies` passou a usar `familia`/`biologia` da criatura-inspiração (antes só menção textual), cada estágio de evolução ganhou inspiração de imagem própria da linhagem, ponte de família `humanoide`↔`biologia` e o rebalanceio dos 4 bônus fixos de `scoreCreature`, teto 7→14); anterior: 27/09/2026 (sincronização do delta `c510c7e4..2336e4e7`: Oráculo — o nome da inspiração vai no prompt da 1ª tentativa (D-B1, reversão do dono) e o pool do bestiário foi cortado para 617; §17 `notified` ⚰️); anterior: 22/09/2026 (5ª sincronização do dia, delta `89554b5d..c7bca6d` (balanceamento do oráculo): §22 ganhou a lápide do degrau da criatura favorita (`FAVORITE_STEP`, `ORACLE_DRAFT_VERSION` intacta) e a tabela das quatro frentes de rebalanceamento da leitura (`DOMINANT_SCHOOL_LEAD`, `melhorArquetipo`, `ANCHOR_BASE`/`vileza`, `sombra`) mais o aviso do erro de medição de `normalizeName`. **Nenhuma regra que o jogador VIVE mudou**; anterior: 22/09/2026 (4ª sincronização do dia, delta `fadb1167..89554b5d`: **nenhuma regra de jogo mudou** — §20 ganhou a nota da capacidade DORMENTE do motor de ficha (`ElementPlan`/`ALLOC_FRACTION` em `buildSheet.ts`, sem chamador, ⏸️ parqueada para a v2.0) e a única mudança de comportamento interna: a profissão lê sempre a escala rookie automática quando há plano; anterior: 3ª sincronização do dia, delta `cd66940f..cf6315e1` (execução das 32 respostas do dono — **oito regras de jogo mudaram**): §7 a virada julga o último dia aberto + os quatro campos que ela escreve; §8 as três travas novas do dreno (#58b); §18 uma virada completa antes de re-evoluir (#59); §24 `habitCountsForHeartsOn` (#57b); **§24-A novo** — desfazer a conclusão (#57); §46 Bits por dia completo + teto de minijogo (#61/#63) e o ponteiro do modelo (#55); §48/§49 o 🌀 escreve `missionPerfectDays`; §55 os 11 eventos ganharam emissor (#59b) e a comida ficou de fora; §57-A o 🌀 saiu das conquistas (#41/#60); anterior: 2ª sincronização do dia, delta `a6c1cd8a..592e2c14`, QA Rodada 2: §46 cota de chat por tier (provisório #55); §55 `XP_PERFECT_DAY` passou a ser emitido; §7/§18/§46 ganharam só a NOTA "aberto ao dono" dos provisórios #58/#59/#61 — nenhuma regra de jogo mudou)) · **Estado:** verificado em 27/09/2026 por doc-verificador (delta `2336e4e7..8fbf6990` — pool.json medido: 630 criaturas, 13 com `_ponte`, eletricidade/marcial/sombra 5/5/5, 84 `Variado` = 55 "Venenoso" de modificador ambíguo + 29 sem modificador geográfico; símbolos dos dois scripts por grep; âncoras conferidas; `curadoria.contract.test.ts` verde); anterior: verificado em 27/09/2026 por doc-verificador (código em `78ef5367` — §7 `completeDayReached`/`diaCompletoHoje`, §17 incubação (`INCUBATION_MIN_MS`, `incubationFor`, `incubationReady`, `isIncubating`, `birthBatch` só `rookie`, `SpriteOccasion`), §20 `applyRebirth` com `emptyIncubation()`, §47 `mercadoCatalog.ts`, §49 `MissionCategory`/`MISSION_CATEGORIES`, §51 `HEART_DROP_CHANCE`, §54 `playAreaLots.ts`, §59 D3 conferidos símbolo a símbolo; corrigido: `EvoTrail.tsx` inexistente virou lápide); anterior: verificado em 22/09/2026 por doc-verificador (delta `89554b5d..c7bca6d` — `DOMINANT_SCHOOL_LEAD` = 1.15, `melhorArquetipo(lista, ficha.nome)` com `hashString` sobre a lista ordenada por `id`, `ANCHOR_BASE` = 45, `vileza` = `dev('Plutão')*0.55 + dev('Marte')*0.55`, `sombra` com a fatia água+terra ×40 e o deslocamento −20 sob `Math.max(0, …)`, e a ausência de `favoriteCreature` no `OracleInput` montado pelo `SoulmonOnboarding.tsx` — todos conferidos símbolo a símbolo no fonte; os quatro arquivos de régua conferidos por `ls`); anterior: verificado em 22/09/2026 por doc-verificador (delta `fadb1167..89554b5d` — o bloco de capacidade dormente da §20 conferido símbolo a símbolo em `src/utils/soulProfile/ficha/buildSheet.ts` (`ALLOC_FRACTION` = 0.25, `ElementPlan`, `sanitizePlan`, `allocateElementos`, `buildFicha` com `plano` como 6º parâmetro, ramo `stage === 'rookie' && !plano`) e a inércia por `grep` (nenhum chamador); `buildSheet.aloc` + `buildSheet.piso` + `arena.alocacao` + `pipeline` verdes (56 testes, fixture intocada)); anterior: verificado em 22/09/2026 por doc-verificador (delta `cd66940f..cf6315e1` — `dailyReset.ts` (`diaJulgado`, `BITS_PER_COMPLETE_DAY`, `podeEvoluirDepoisDaQueda`, `soParaCoracao`), `poopDrain.ts` (`saveDaysLived`/`returnGraceLeft`/`getPreviousForm`), `habitRhythm.ts` (`habitCountsForHeartsOn`/`isWeekClosingDay`), `currencies.ts` (`MINIGAME_BITS_PER_DAY`/`creditMinigameBits`), `missions.ts`, `specialItemUse.ts`, `completionUndo.ts` e os 11 `kind` de `bond.ts` × os emissores do `App.tsx` conferidos símbolo a símbolo; a AUSÊNCIA de `kind` de comida conferida por `grep`); anterior: verificado em 22/09/2026 por doc-verificador (delta `a6c1cd8a..592e2c14` — `_aiGuard.js` › `AI_LIMITS.chat.perAccountByTier`, `dailyReset.ts` › `awardBondXP(..., { kind: 'perfectDay' })` e os `it.todo` de `regrasDeJogo.qaRodada2.test.ts` conferidos; anterior no mesmo dia: delta `f4086ce0..a6c1cd8a`, QA Rodada 1 — §46 cortesia × reembolso (`auditRefunds`/`paidProviderOf`) e §56 versões `2026-09-22` + `qualDocMudou` conferidos símbolo a símbolo contra `_entitlements.js`, `consent.ts`, `termsNotice.ts`; anterior: delta `f02a3166..4a8b8049`, execução das respostas #11–#39 — §46 cortesia, §56 aviso de termos, §57-A `dias-completos-30`/`conquistasHerdadas`, §58-A ⚰️ `SettingsModal` conferidos símbolo a símbolo; anterior: delta `9f4e5a7a..f9faf7a7`, QA geral — só as passagens que o diff tocou, conferidas por grep; anterior: §59 D31–D33 reconferidas no delta `15164e4c..7e5d0ba9` — D32 ⚰️ fechada confere com o `CLAUDE.md` no disco (cinco arquivos, S1..S16) e com `ls public/sounds`; D31 segue ABERTA (o `CLAUDE.md` ainda diz `DÍVIDA`); verificação anterior: §58-A e §59 D32–D33, delta `5ac3d351..8d318529`, som/S16 + chaves na `SettingsPage`; verificação anterior do mesmo dia: só as seções do delta `dc72579e..9875477b` — §2, §3, §8, §10, §12, §45, §48, §59 D31; verificação anterior: 21/09/2026, seções do delta `2580b73a..dc72579e` — §22, §28, §41, §43, §46, §57-A, §57-B, §59 D28–D30; doc inteiro: 10/09/2026, em duas metades)
> **Estado:** verificado em 01/10/2026 por doc-verificador (delta `bcfe7ca6..e3d55bb8`, só as passagens tocadas, conferidas símbolo a símbolo contra o fonte em `e3d55bb8` — `currencies.ts` › `CURRENCIES.emblems.name`, `DinoGame.tsx` › `OBSTACLE_TIERS`, `missions.ts`, `dungeonScenes.ts` › `DUNGEON_SCENES`, `adventureArt.ts`, `REGISTRO-DE-DECISOES.md` §17); anterior: verificado em 30/09/2026 por doc-mantenedor (delta `3532ccf5..bcfe7ca6`, só as passagens tocadas, conferidas contra o fonte em `bcfe7ca6` — `consent.ts` › `TERMS_VERSION`/`PRIVACY_VERSION`, `public/termos.html` §8 e "Last updated"/"Última atualização", `PERGUNTAS-DO-DONO.md` MIS-13..MIS-16, `REGISTRO-DE-DECISOES.md` §5.6; sem verificador independente — subagentes `doc-*` não registrados); anterior: verificado em 30/09/2026 por doc-mantenedor (delta `cfe27cc7..3532ccf5`, só as passagens tocadas, conferidas símbolo a símbolo contra o fonte em `3532ccf5` — `utils/travessias.ts`, `utils/travessiasSave.ts`, `types/travessias.ts`, `PasseioSheet.tsx`, `adventure.ts` › `adventureOfNight`, `playAreaLots.ts`, `CompanionHUD` › `walkingTo`, `GameStateContext` › `crossings`; sem verificador independente — subagentes `doc-*` não registrados); anterior: verificado em 30/09/2026 por doc-mantenedor (delta `4a894f90..cfe27cc7`, só as passagens tocadas, conferidas contra `REGISTRO-DE-DECISOES.md` §5.6, `PERGUNTAS-DO-DONO.md` EXP/MIS, `ledger/vetos.md`, bloco de 30/09 do STATUS e `EXPLORACAO_LOTS` em `src/utils/playAreaLots.ts`; sem verificador independente — subagentes `doc-*` não registrados); anterior: verificado em 30/09/2026 por doc-verificador (delta `ae366480..5edfcfba` — seções tocadas conferidas símbolo a símbolo e constante por constante contra o fonte: `playerDayIso`, `src/utils/refugio/convite.ts` (`REFUGE_INVITE_*`), `DUNGEON_BITS_FACTOR`/`DEEP_START_BASE_COST` (16), `functions/api/_duel.js` (`DUEL_*`, `duelStats`, `cheerMultiplier`), `community.js` (`duelStart`/`match`/`settleMatch`/`forfeitPending`/409), `BOLHAS_*`/`TROCA_*`/`PICROSS_*`, `supportLine.ts`, `respiracao.ts`, `areaNpcVoice.ts`, `seasons.ts`, `missions.ts`, `entitlementSync.ts`, `App.tsx` (fila do convite, auto-adoção do corvo); 2 correções R3 feitas na §51 e na §54)); anterior: verificado em 30/09/2026 por doc-mantenedor (sem verificador independente nesta sessão: verificação própria, símbolo a símbolo por `grep` contra o fonte — `_admin.js`, `gmTools.ts`, `corvoAdocao.ts`, `AreaTopBar.tsx`, `npcScale.ts`, `attributes.ts`; só as seções tocadas; delta `8e6d0d9a..ae366480`); anterior: verificado em 29/09/2026 por doc-mantenedor (sem a ferramenta Agent nesta sessão: verificação própria, símbolo a símbolo por `grep` contra o fonte — exports de `_coop.js`/`guild.js`/`_profile.js`, módulos novos de `src/`, constantes e chaves de KV; delta `38c3ccb5..b657a340`, só as seções tocadas; `docsManual`/`docsSemMentira` verdes); anterior: verificado em 28/09/2026 por doc-verificador (delta `f465d266..cf8a851d` — passagens tocadas conferidas contra o fonte e contra as medições do PR; anterior: verificado em 28/09/2026 por doc-verificador (delta `25fd3c41..f465d266` — passagens tocadas conferidas símbolo a símbolo contra o fonte; anterior: verificado em 28/09/2026 por doc-verificador (delta `83a9aac6..25fd3c41` — §22 conferido símbolo a símbolo contra `src/utils/soulProfile/axes.ts` (`ALIGNMENT_ELEMENT_AFFINITY`, `FAVORECIDO`/`DIFICULTADO`, `dominantAlignment` movido para antes de `realms`) e `alinhamentoElemento.test.ts`); anterior: verificado em 28/09/2026 por doc-verificador (delta `8110efc5..83a9aac6` — §22 conferido símbolo a símbolo contra `src/utils/oracle.ts` (`bestiaryFamilyIds`, `bestiaryFamilyHint`, `bestiaryLineageNomes`) e `src/utils/soulProfile/bestiary/select.ts` (`FAMILIA_BONUS`/`BIOMA_BONUS`/`HOSTILIDADE_BONUS`/`TAMANHO_BONUS`, ponte `humanoide`↔`biologia`); anterior: verificado em 27/09/2026 por doc-verificador (delta `8fbf6990..1d9e278d`).
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
[54. Minijogos: PPT e Corrida com obstáculos](#minijogos) ·
[55. Vínculo e o gate de PvP](#vinculo) · [55-B. Combate v3: level, talentos, equipamento e o teto de 5%](#combate-v3) ·
[56. Comunidade e cooperativo](#comunidade) · [56-A. A Guilda](#guilda) ·
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
- soma `CATEGORY_ATTRIBUTES[categoria]` em `powerPoints`/`harmonyPoints`/`benevolencePoints`
  **e** em `attributesSinceLastEvolution`;
- `totalXP += (soma dos atributos) × 10`;
- com o traço **Guloso**, `+GULOSO_BONUS_ATTR` (1) no atributo que a comida já
  favorece (empate vai para `harmony`).

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

**Onde a UI mostra.** `src/components/home/Mochila.tsx` (a mochila da Home —
arrastar o item até o pet; ⚰️ a tela da pastinha `ItemsWindow` saiu na
minimal-ui F6 e o arquivo guarda só os nomes dos itens),
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

**A mesma âncora em ISO.** `playerDayIso(now, anchor)` (desde 30/09/2026) devolve o MESMO dia do jogador em `YYYY-MM-DD`, para quem faz CONTA de dias (a Revisão da Malha soma intervalos, o convite ao Refúgio conta dias de intervalo — [§54](#minijogos), [§12](#humor)). Mesma âncora e mesmo fallback (sem âncora = dia local do aparelho): as duas formas nunca discordam de QUE dia é, só de como se escrevem.

**Dono.** `src/utils/playerDay.ts` → `playerDayKey`, `playerDayIso`, `anchorOffsetMs`,
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

**A regra.** Em `completeDayReached` (`src/utils/dailyReset.ts`), que
`computeDailyReset` chama sobre o dia que terminou:

```
completeDayReached({ registered, goal, done, energy }) =
  registered > 0 && done >= goal && energy >= goal
dayWasPerfect = completeDayReached({ registered: totalTasks, goal: dailyGoal,
                                     done: dailyDone, energy: energyPoints })
```

A função existe desde a minimal-ui F2 para que a **Home** responda com a MESMA
conta o selo "Dia completo" do dia corrente (`diaCompletoHoje` no `App.tsx`).
⚰️ Antes a virada tinha a conta inline, e um `isDayPerfect` à parte dormia no
`useProgressTracking` — duas cópias da mesma regra.

**A MESMA meta nos dois eixos, e a meta INTEIRA** — não a de coração. Quando
verdadeiro, a virada escreve **quatro** coisas (`computeDailyReset`, desde
22/09/2026): `perfectDays++` (o contador que a escada consome),
**`totalPerfectDays++`** (o vitalício REAL, que **nunca zera ao evoluir** e é o
que `achievements.ts` lê), **`missionPerfectDays++`** (o vitalício da MISSÃO —
decisão do dono **#41/#60**, [§57-A](#conquistas)) e **`gamePoints +=
BITS_PER_COMPLETE_DAY`** (100 💠 — decisão do dono **#61/#63**,
[§46](#moedas)). ⚰️ Até 22/09/2026 eram só os dois primeiros, e
`totalPerfectDays` era "o vitalício das missões".

**O nome mudou em 07/09/2026 (P5), o mecanismo não.** Os textos PT/EN dizem "dia
completo"/"complete day"; os símbolos `perfectDays`, `wasPerfect` e
`dayWasPerfect` continuam com o nome que têm no código. O motivo é de tom:
como o contador nunca decresce, "perfeito" é a palavra que transforma um dia bom
em fracasso para quem tem traço perfeccionista.

**Dono.** `src/utils/dailyReset.ts` → `completeDayReached` (a conta) e
`computeDailyReset` (`dayWasPerfect`, a escrita na virada).

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
  do jogador** (`GLITCHTAMA_PER_DAY`) — ver [§48](#itens-especiais). ⚰️ Desde
  22/09/2026 ele **não** soma em `totalPerfectDays`, só em `missionPerfectDays`
  ([§57-A](#conquistas), decisão **#41/#60**).
- A **folga da semana não vira dia completo**: não ganha, não perde.
- ⚰️ **A virada julgava só ONTEM** (`yesterdayString = now − 1`) até 22/09/2026.
  Quem fazia tudo na segunda e só reabria na quarta nunca recebia o dia completo
  de segunda: a virada de quarta olhava a TERÇA, `dailyDone = 0`, e como
  `daysAway >= ABSENCE_FORGIVENESS_DAYS` ela perdoava **e também não creditava**.
  Os perfis "3×/semana que só abrem nesses dias" fecharam **0 dias completos em
  90** na simulação da QA Rodada 2 (`07-simulacao-jogo-r2.md` §2.1), rookie para
  sempre, tendo feito 100% dos hábitos.
- ✅ **A virada julga o ÚLTIMO DIA ABERTO** (decisão do dono **#58**,
  22/09/2026). `computeDailyReset` calcula `diaJulgado`: se `lastResetDate` for
  anterior a ontem, é ELE que a virada julga; senão, ontem. Não é perdão novo —
  é ler o que `withHabitCompletion`/`lastCompletedDate` já gravaram naquele dia.
  `dayWasPerfect` continua exigindo meta cumprida **e** energia cheia, então dia
  em que ninguém fez nada segue não creditando nada. Limites de propósito:
  **nunca** julga um dia à frente de ontem (save adulterado, relógio para trás),
  **nunca** julga hoje (que não terminou) e julga **um** dia, não todos os que
  passaram. Medido: o perfil que só abre seg/qua/sex foi de 0 para **38** dias
  completos em 90, rookie → mega.
- ⚠️ **A FOLGA da semana continua ancorada em ONTEM**, e não no dia julgado —
  de propósito (`semanaDeOntem = restWeekKeyFor(ontem)`). Ancorá-la no dia
  julgado faria quem volta de ausência longa cair numa semana ANTIGA, o que
  recarrega a folga e adia a cobrança mais um dia: um **nono perdão** entrando
  pela porta dos fundos (linha vermelha #17). A #58 é sobre CREDITAR o dia
  vivido, não sobre alargar carência.
- Desde `592e2c14` o dia completo **emite `XP_PERFECT_DAY`** de verdade
  ([§55](#vinculo)) — a tabela já dizia, ninguém emitia.

**O que NÃO faz.** Dia não-completo **não tira** `perfectDays`. Não conta itens
— conta PESO DE ESFORÇO ([§23](#meta-ponderada)).

**Onde a UI mostra.** `src/components/DailyReportModal.tsx`,
`src/components/EvolutionPath.tsx` (a barra de dias até a evolução)
(⚰️ o `EvoTrail` saiu da Home, decisão S1 — arquivo apagado), e o selo "Dia completo" da Home
(`src/components/DailyRituals.tsx`, `src/components/pixel/RitualPanel.tsx`),
alimentado por `completeDayReached`.

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
4 corações, cada um "dentro do teto".

**As travas da virada que o dreno respeita** (decisão do dono **#58b**,
22/09/2026 — ⚰️ o cabeçalho deste arquivo e este § já **afirmavam** que ele
respeitava "exatamente as mesmas travas da virada", e era falso em três de seis):

| Trava | Como o dreno a lê |
|---|---|
| `MAX_HEARTS_LOST_PER_DAY` + `heartLossCap` (Teimoso) | já valia |
| `ABSENCE_FORGIVENESS_DAYS` | já valia — reancora o relógio em `now` |
| **`NEW_SAVE_GRACE_DAYS`** (carência de save novo) | ✅ desde 22/09/2026, pela MESMA leitura da virada (`saveDaysLived`), não por contador próprio |
| **rampa de retorno** (`lastDayReport.returnGraceLeft > 0`) | ✅ desde 22/09/2026 — o crédito é da virada; o dreno só o respeita |
| **piso da raiz** (rookie nunca abaixo de 1 ♥) | ✅ desde 22/09/2026, via `getPreviousForm(stage, branch) === stage`; quem tem forma abaixo continua podendo zerar e degenerar |

O que a QA Rodada 2 (§2.5) mediu antes disso: save novo perdia 1 coração em d1,
d2 e d3; quem voltava de ausência era perdoado pela virada e cobrado pelo dreno
no mesmo dia; e o rookie ficava em **HP 0 todos os dias** — a virada devolvia 1
de manhã, o dreno tirava à noite —, com o relatório anunciando
`forgiven: true, heartsLost: 0` e a barra em 2/3. As três novas também
**reancoram o relógio em `now`**: perdoar e guardar o período para o próximo
tick é o perdão vazando por fora.

⚠️ **O que NÃO entrou e segue com o dono:** a **folga da semana** (ver "O que NÃO
faz", abaixo) e o **teto do DIA compartilhado** entre virada e dreno — o dono
respondeu a #58b sem ele, e hoje os dois tetos são independentes, então um dia
ruim pode custar `MAX_HEARTS_LOST_PER_DAY` na virada **e** de novo no dreno.

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

**Onde o humor PODE aparecer.** Em três lugares (eram dois até 30/09/2026): a leitura acima; o
contexto do `/api/chat` — como INTEIRO de 0 a 4 (`ctx.moodToday`), nunca texto; e a
**condição do convite ao Refúgio** (abaixo), que só LÊ o humor do dia e nunca o cita.
É a decisão "humor nunca vira pontuação, mas pode alimentar a FALA". O check-in
também conta para a missão semanal `mood-checkins` (alvo 3, 2 de Honra,
`src/utils/weeklyMissions.ts`) — moeda que só compra cosmético ([§50](#missoes-semanais)).

**O convite ao Refúgio (30/09/2026).** Com o humor registrado HOJE em 1 ou 2
(`REFUGE_INVITE_MOODS`), a fila da Home oferece um cartão (`key: 'refugio'`,
`RefugeInviteCard`) para respirar com o Soulmon no Refúgio. `shouldInviteRefuge`
(`src/utils/refugio/convite.ts`) trava: no máximo 1× por dia do jogador;
depois de EXIBIDO só volta após `REFUGE_INVITE_GAP_DAYS` (3) dias; duas
dispensas seguidas (`REFUGE_INVITE_DISMISSALS_TO_SILENCE`) = silêncio de
`REFUGE_INVITE_SILENCE_DAYS` (7); só conta como exibido se foi o cartão
principal da fila (`markRefugeShown`); corrigir o humor para 3+ o faz sumir. O
cartão fica **antes do aviso de HP**, não cita o humor, não leva texto de crise,
e não paga nem conta nada. O save guarda só datas e a contagem de dispensas
(`sanitizeRefugeInvite`) — nunca o motivo. O Refúgio segue aberto no Mapa para
qualquer humor. Decisão: `REGISTRO-DE-DECISOES.md` §5.6 ("Convite ao Refúgio…",
parecer do `soulmon-behavioral-psychologist`).

**Dono.** `src/utils/mood.ts` (`recordMood`/`moodFor`/`recentMoods`/`moodSummary`);
`src/utils/refugio/convite.ts` (o convite);
`src/App.tsx` → `handlePickMood` (carimba o dia do jogador e conta a missão).

**Régua.** `src/utils/mood.test.ts` — inclui o caso que roda a virada com e sem
humor ruim exigindo resultado idêntico; o convite tem régua própria em `src/utils/refugio/convite.test.ts`. `src/utils/telemetry.test.ts` (humor
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
permanente nem ranking. Não bloqueia nada. Não gera lembrete nem push (o convite ao Refúgio é cartão da Home, nunca push). Não sai
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
estável da chave do dia sobre `['power','harmony','benevolence']` — o mesmo dia rende
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

**Esquema de id.** `'rookie'` · `'{champion|ultimate|mega}-{power|data|benevolence}'`
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
## 15. 👊🎶🤲 Atributos e galhos

**Em uma frase.** A categoria da tarefa vira comida, a comida vira ponto de
atributo, e o atributo escolhe o galho da próxima evolução.

⚰️ **Renomeio de 29/09/2026 (decisão do dono, `REGISTRO-DE-DECISOES.md` §14.5).** Os três caminhos se chamavam vírus/dado/vacina; hoje são **Poder / Harmonia / Benevolência** (EN Power / Harmony / Benevolence), ids `power`/`harmony`/`benevolence`, formas `champion-power`/`ultimate-harmony`/`mega-benevolence` etc., campos `powerPoints`/`harmonyPoints`/`benevolencePoints`, `attributesSinceLastEvolution {power,harmony,benevolence}`, chips 👊 (Poder) · 🎶 (Harmonia) · 🤲 (Benevolência) — eram 🦠/💾/💉, migrados no load. `Ruptura`/`Trama`/`Guarda` seguem como vocabulário de MUNDO (lore; Ruptura=Poder, Trama=Harmonia, Guarda=Benevolência), nunca rótulo de interface. O save antigo é migrado por `src/utils/branchMigration.ts` (dono único; `hydrateSave` no local e na nuvem, `adoptCloudSave` e o desktop) e o servidor lê as chaves KV antigas por `functions/api/_branchLegacy.js` (cache de sprite e contador `aiForms` — o renomeio não zera teto nem cobra sprite de novo). A régua é `src/utils/branchRename.contract.test.ts`: id/rótulo/emoji antigo fora desses dois arquivos reprova.

**A regra, em quatro passos.**

1. **Concluir** uma atividade rende uma comida da categoria dela —
   `foodForCompletedTask(inventory, category)` com `FOOD_BY_CATEGORY`
   (`src/constants/labels.ts`): Fitness 🥩 · Health 🥗 · Study 🍎 · Work ☕ ·
   Wellness 🧃 · Discipline 🍚 · Social 🍕 · Creativity 🍭.
2. **Comer** (`feedFood`) soma `CATEGORY_ATTRIBUTES[categoria]`
   (`src/types/attributes.ts`) em `powerPoints`/`harmonyPoints`/`benevolencePoints`,
   soma o mesmo em `attributesSinceLastEvolution`, dá +1 de energia (limitada
   por `getMaxEnergyForStage`) e `totalXP += (soma dos três) × 10`.
   Ex.: Study `{power 0, harmony 3, benevolence 1}`; Creativity `{3,1,0}`;
   Discipline `{0,1,3}`.
3. **O traço Guloso** soma `GULOSO_BONUS_ATTR` (1) **no atributo que a comida já
   favorece**; empate vai para `harmony`, o meio-termo da árvore ([§19](#tracos)).
4. **O galho** sai de `evolutionTarget` → `resolveBranch(points, reading,
   currentBranch)`: `branchLeaders` devolve os empatados no topo; um líder único
   decide sozinho; no empate decide o ritmo de cuidado, se `confident`
   ([§16](#ritmo)); sem líder nenhum (`max <= 0`) responde o ritmo ou o galho
   atual.

**Os nomes que o jogador vê.** `ATTR_LABEL` é fonte única: `power` = **Poder /
Power**, `harmony` = **Harmonia / Harmony**, `benevolence` = **Benevolência /
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
- **Empate com leitura fraca** cai no galho ATUAL (`fallback`), nunca em `harmony`
  fixo — a cópia antiga do `App.tsx` mandava todo empate para `harmony`, e a página
  previa `power` enquanto a cerimônia gravava outra coisa.
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
  totais (`powerPoints`/`harmonyPoints`/`benevolencePoints`).

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

**O que cada ritmo puxa** (`patternBranch`): constante → `benevolence`, explosivo →
`power`, equilibrado → `harmony`. **Nenhum é melhor que outro**, e nenhum muda
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
3b. `if (!incubationReady(prev.incubation, alvo.stage, new Date())) return prev`
   — a forma-destino ainda está incubando (ver **A incubação**, abaixo);
4. `applyRedemption(prev, evoluiu)` fecha o arco de quem tinha caído
   ([§18](#degeneracao));
5. grava `evolutionStage`, `currentBranch`, `healthPoints` e `maxHealthPoints`
   no máximo do estágio novo, **`perfectDays: 0`**,
   `attributesSinceLastEvolution` zerado, acrescenta a forma a
   `unlockedEvolutions` (sem duplicar) e carimba `formReachedAt` com a chave do
   **dia do jogador** — data que **nunca é reescrita**.

`canEvolve` (o botão, no HUD) repete as condições da mesma fonte:
`evolutionLocked`, `perfectDays >= required`, `evolutionTarget(...).stage !==
evolutionStage` e `incubationReady(...)` — a mesma função que o `handleEvolve`
commita. `handleEvolveRequest` abre a cerimônia com o mesmo alvo.

**A incubação (WP4.29, desde 22/09/2026).** Ficar APTO a evoluir abre uma
espera mínima de `INCUBATION_MIN_MS` (30 min) antes de o gesto completar; nesse
tempo a forma seguinte é gerada. Dono: `src/utils/spriteTrigger.ts`.
- `incubationFor(input, prev, now)` — pura e idempotente (devolve a **mesma
  referência** quando nada muda). Quando `pointsToEvolve` chega a 0, grava em
  `incubation.since[formId]` o instante para **todos os líderes empatados** do
  galho (`vesperForms`) que ainda não têm relógio. Não olha o acervo de sprites:
  o relógio é "apto desde X", não "gerando desde X" (D-G8d) — senão conta em
  `sprite-lifetime-cap`/`sprite-form-cap` ou geração falha ficaria sem
  incubação e travada fora da evolução. Um `useEffect` do `App.tsx` a chama
  quando estágio, dias ou atributos mudam.
- `incubationReady(inc, formId, now)` — a **única** aritmética de data, e só
  LIBERA: `now − since ≥ INCUBATION_MIN_MS`. Forma sem `since` (save anterior)
  ou data inválida → `true`.
- `isIncubating` — alimenta o aviso da Home (`incubandoAgora`, derivado, nunca
  persistido) e a cerimônia. ⚰️ `notified` (o one-shot) saiu em `4b87fee0`
  (WP4.30, 27/09/2026): era gravado e lido por ninguém, e a regra é a oposta —
  o aviso é marcador PERSISTENTE enquanto a incubação durar (R-K(a)).
- **É piso, nunca prazo**: passados os 30 min a evolução espera
  indefinidamente. O relógio de UI (`agoraParaIncubacao`) tica de minuto em
  minuto **só enquanto há forma incubando**, e não vira contagem na tela.
- **O `since` é por forma e sobrevive à degeneração** (parecer R-L): voltar à
  mesma forma reaproveita o relógio. `incubationFor` nunca limpa nada; quem
  zera é o Renascimento ([§20](#rebirth)) e a troca de criatura do upgrade.
- Com isso a geração de sprite passou a ter duas ocasiões: **A** (nascimento,
  `birthBatch` = **só `rookie`**, D-G5b) e **C** (incubação, `faltam <= 0`, o
  lote dos líderes empatados). ⚰️ A ocasião **B** (véspera, `faltam === 1`)
  não existe mais (D-G8c); `'B'` fica no tipo `SpriteOccasion` só como lápide.
  ⚰️ Até 22/09/2026 o nascimento gerava `rookie` + o champion previsto.

**O cadeado.** `evolutionLocked` é alternado por `handleToggleEvolutionLock` —
tocando na criatura atual no grafo, ou no botão "Segurar evolução". Travado: os
dias completos **seguem acumulando** (`perfectDays` pode passar do requisito, e
por isso a frase usa `Math.max(0, gateDays − perfectDays)`) e a degeneração por
HP 0 continua valendo. Destravado: nada acontece sem o toque.

**Dono.** `src/App.tsx` → `handleEvolve` / `handleEvolveRequest` /
`handleToggleEvolutionLock` (fiação e commit); `src/utils/evolutionTarget.ts`
(o destino); `src/types/progression.ts` (`MANUAL_EVOLUTION`, `FORM_REQUIREMENTS`);
`src/utils/spriteTrigger.ts` (a incubação e `INCUBATION_MIN_MS`, dono único do
número).

**Régua.** `src/components/evolucaoManual.contract.test.ts` — enquanto
`MANUAL_EVOLUTION` for `true`, **nenhum literal de interface** pode dizer que a
virada evolui; `src/utils/evolutionTarget.regression.test.ts`;
`src/types/progression.test.ts` ("quem decide a evolução manual continua sendo
`required`"); `src/utils/spriteTrigger.esperaMinima.test.ts` e
`src/utils/spriteTrigger.semPrazo.contract.test.ts` (a incubação: uma só
comparação de data, que só libera; o número não é copiado nem encurtado).

**Decisão.** A varredura de 09/09/2026 documentada no cabeçalho do próprio
guard: **quatro** descrições da mesma regra, **três erradas** — inclusive os
textos de travado e destravado **invertidos** na `EvolutionPath.tsx`. Quem
enchia a barra e esperava a virada não via nada acontecer, com a barra cheia na
tela, o que lê como defeito do jogo. A incubação: decisões do dono **#79/#80**
(D-G8b) em [`docs/PERGUNTAS-DO-DONO.md`](../PERGUNTAS-DO-DONO.md), D-G5b/D-G8c/
D-G8d na spec, e o bloco **WP4.29** de
[`ledger/permanencia.md`](../plano-melhorias/ledger/permanencia.md).

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

**✅ UMA VIRADA COMPLETA ANTES DE RE-EVOLUIR** (decisão do dono **#59**,
22/09/2026). ⚰️ Até esta data a queda era **cura grátis**:
`degeneratedPerfectDays` devolve `max(floor(req/2), prev − 5)`, que costuma ser
≥ `required` do estágio novo — um mega com 26 dias que caía para ultimate
reaparecia com 21 ≥ 5, o botão Evoluir acendia **na mesma abertura**, a
cerimônia tocava por causa de uma QUEDA, a evolução devolvia
`MAX_HP_BY_FORM` cheio e `applyRedemption` marcava `redeemed: true` por um botão
apertado segundos depois de cair. Medido na simulação de 90 dias (`Dm` d46, `B`
d54/d66/d89): o ioiô rendia uma evolução a mais.

A trava é **`podeEvoluirDepoisDaQueda(state) = !state.degeneratedByHP`**
(`src/utils/dailyReset.ts`, dono único). Não inventa constante, não carimba data
nova no save (linha vermelha #20) e não tira `perfectDays` de ninguém:
`degeneratedByHP` é escrito pela virada que derrubou e reescrito como `false` na
virada SEGUINTE, logo "não evoluir enquanto ele estiver de pé" **é**, literalmente,
"exigir uma virada completa depois da queda". Tem **três** chamadores, todos
delegando: o `handleEvolve` do `App.tsx` (reconferido sobre o `prev`, porque é o
updater que commita), o `canEvolve` que acende o botão, e o efeito que abre a
cerimônia — que passa a não abrir na mesma abertura da queda, senão o jogador
veria um ritual que o commit recusa. Medido: o perfil `B` caiu de 9 para **8**
evoluções em 90 dias.

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

**`applyRebirth(prev, choices, now)`** reescreve **seis campos e mais nada**:
`evolutionStage: 'rookie'`, `powerPoints`/`harmonyPoints`/`benevolencePoints` = 0,
`incubation: emptyIncubation()` (desde WP4.29) e grava `rebirth: { criatura,
escola, elemento, at, fromStage }`. ⚰️ Até 22/09/2026 eram cinco. A incubação
zera porque o `perfectDays` preservado deixa o renascido apto na hora e o
`since` do champion da vida anterior liberaria a primeira evolução sem espera
([§17](#evolucao)). Passam intactos
pelo spread: Bits, Honra, Créditos, decoração, cenários, sonhos,
`habitRhythms`, `perfectDays`, `totalPerfectDays`, `unlockedEvolutions`,
tarefas, hábitos, `bornAt`.

**O ganho.** `REBIRTH_BUDGET_MULTIPLIER` = **1.5** sobre o orçamento de pontos
da ficha em **todos** os estágios. 1,5 e não 2: o dobro num sistema com custo de
par destrava geração adiantada e faz o rookie renascido ler como um mega.

**⏸️ Capacidade dormente, com destino v2.0 — não é regra que o jogador vive.**
Desde 22/09/2026 o motor de ficha (`src/utils/soulProfile/ficha/buildSheet.ts`)
aceita um **plano de alocação de elemento** (`ElementPlan` = peso por elemento
BASE) em `allocateElementos` e em `buildFicha`, reservando `ALLOC_FRACTION` do
orçamento de elementos para as bases que o jogador pedir. **Hoje ninguém passa
plano nenhum**: não há campo no save, não há tela e não há chamador — e **sem
plano a função é byte a byte a de antes**, com teste exigindo isso estágio por
estágio (`buildSheet.aloc.test.ts`; `pipeline.test.ts` passa sem trocar
fixture). A mecânica está **PARQUEADA PARA A v2.0** por decisão do dono, para
sair junto do Renascimento; a spec, com o cabeçalho de parqueamento, é
[`docs/plano-melhorias/G-alocacao-elemento.md`](../plano-melhorias/G-alocacao-elemento.md),
e o que **trava a retomada** é o bloco **WP4.23** de
[`ledger/permanencia.md`](../plano-melhorias/ledger/permanencia.md) (a régua de
§10.2 não é atingível pelos mecanismos medidos; quatro saídas, o dono escolhe).
**Nada aqui muda o que o jogador faz hoje** — inclusive o que a §20 descreve
acima segue idêntico. A única mudança de comportamento é interna e existe para
proteger uma regra que já valia: a **profissão** passou a recalcular sempre a
escala rookie **automática** quando há plano, em vez de reusar a ficha do
estágio — mover uma barra de elemento nunca pode re-rolar o ofício (é o mesmo
defeito de re-roll que a escala rookie fixa existe para evitar). **Sem plano, o
reuso de antes continua idêntico.**

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
| ~~5~~ | ⚰️ **criatura favorita — SAIU em 22/09/2026** (decisão do dono). O ritual vai da cidade direto à 1ª pergunta; `FAVORITE_STEP` continua valendo **5** e o degrau é pulado nos dois sentidos | — |
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

**⚰️ O jogador não escreve mais texto que vai para o prompt — não antes do
Renascimento** (22/09/2026, decisão do dono). O degrau 5 pedia uma "criatura
favorita" (até 2 palavras) e ela entrava como **prefixo literal** nos 11 prompts
de sprite; como o prompt é em inglês, um jogador brasileiro que digitasse "lobo"
produzia `transparent background: lobo ant-rose, Tide Priestess, …` nas onze
formas (medido em 22/09/2026, pipeline real). Até o Renascimento a criatura é
**inteiramente leitura**: quem a pessoa é, não o que ela digitou. Duas
consequências de compatibilidade, as duas deliberadas: `FAVORITE_STEP`
**continua sendo 5** — `utils/oracleDraft.ts` PERSISTE o `step`, e renumerar
mandaria quem retomou um ritual para a tela errada —, e `ORACLE_DRAFT_VERSION`
**não subiu**, porque chave a mais é ignorada na leitura e subir a versão
descartaria rascunho válido em andamento. Rascunho parado no degrau 5 é levado à
1ª pergunta em vez de abrir o casco vazio.

**A leitura foi REBALANCEADA em 22/09/2026, e nada do que o jogador FAZ mudou.**
Quatro medições com o pipeline real (perfis sintéticos de
`src/utils/soulProfile/perfisSinteticos.ts`) acharam vantagens estruturais que
contrariam a regra escrita desde sempre — nenhum elemento, papel ou reino pode
ter vantagem estrutural. O que mudou:

| frente | dono | antes → depois | régua |
|---|---|---|---|
| a **escola** segue o papel dominante | `ficha/buildSheet.ts` › `DOMINANT_SCHOOL_LEAD` (1,15) | `combate_fisico` dominava 100 % das fichas; fidelidade papel→escola **0 %** em `alcance`/`magico`/`suporte` → **100 %** nos cinco papéis | `ficha/escolaFidelidade.test.ts` |
| o **class-system** explorado ao máximo | `ficha/classTitle.ts` › `melhorArquetipo` | cada ficha se qualificava em ~24,7 dos 79 arquétipos e **só 9 venciam** (`mago_vermelho` em 73 de 120) → **59 classes distintas**, a mais comum em 5,7 % | `ficha/classeOcorrencia.test.ts` |
| os **17 elementos** em pé de igualdade | `soulProfile/axes.ts` › `ANCHOR_BASE` (15 → 45) e `vileza` (Plutão → Plutão+Marte) | razão entre os 6 compartilhados e os 11 cósmicos **2,47× → 1,10×**; **7 dos 17 nunca dominavam** → **17/17** dominam | `soulProfile/classeElementoOcorrencia.test.ts` |
| **`sombra`** deixa de ser a rara do jogo sem virar a comum do class-system | `soulProfile/axes.ts` › fatia água+terra e o deslocamento de −20 | dominância **3,8 % → 10,3 %** no jogo e **15,7 % → 15,7 %** no class-system | `soulProfile/elementoOcorrencia.test.ts` (régua **nova**) |

⚠️ **28/09/2026 — o CAMINHO (poder/harmonia/benevolencia) passa a pesar
sobre o ELEMENTO, pedido do dono.** Até aqui os dois eixos só se tocavam por
traço COMPARTILHADO (ex.: honestyHumility baixa empurra `poder` e `sombra`
juntos), nunca por regra declarada — um perfil benevolência-forte não tinha
NENHUM sinal ativo tornando `sombra` menos provável. `soulProfile/axes.ts` ›
`ALIGNMENT_ELEMENT_AFFINITY` agora classifica os 8 elementos por caminho (3
favorecidos ×1,15 / 3 neutros / 2 dificultados ×0,85 — a partição mais perto
de terços que não duplica "dificultado" no mesmo elemento em dois caminhos
ao mesmo tempo, aplicada ANTES de `realms`/`classElements` herdarem o
resultado): `poder` favorece fogo/sombra/terra e dificulta agua/luz;
`benevolencia` favorece luz/agua/planta e dificulta sombra/industrial;
`harmonia` favorece ar/agua/industrial e dificulta fogo/terra. **Nenhum par
(caminho, elemento) fica impossível** — só mais ou menos provável — e o
efeito é modesto de propósito: uma primeira tentativa com ±20% derrubou
`sombra` abaixo do piso mínimo de população (10,3% → 2,4%), por isso ±15%.
Régua nova: `soulProfile/alinhamentoElemento.test.ts` (mede que
benevolencia+sombra é mais raro que poder+sombra e que benevolencia+luz, e
que nenhum par some). Decisão em `REGISTRO-DE-DECISOES.md` §5.3.

⚠️ **06/10/2026 — `evocacao` não é mais escola de SKILL (PR9b, decisão do dono).** Ela segue só como PONTOS da ficha (companheiro capturável e requisitos de talento do class-system); a skill, a forma do golpe, o papel da Arena e a família do especial usam as 5 escolas restantes (`EscolaSkillId`). Save/cache antigo com `escolaId: 'evocacao'` cai na escola padrão (`conjuracao`) e o cache é trocado quando a ficha recalcula; saves sem perfil no aparelho mantêm o especial antigo. No PvP o servidor publica o ID do nome do especial (família + índice do substantivo + formato + elementos) e o aparelho do oponente recompõe o MESMO nome que o dono vê — nunca texto do save (`functions/api/duel.nome.test.js`).

⚠️ **28/09/2026 — revisão do sistema de criação (3 loops, PR #131).** Dois
consertos que o jogador vê: (1) o **companheiro capturável** (`ficha/capture.ts`
› `selectCompanion`, mecânica real do class-system — Evocação + afinidade
elemental) era calculado e descartado; agora fecha a bio do reveal
("Bonded with a Lobo Cinzento companion." / "Vínculo com um companheiro …"),
só quando o jogador não escreveu a própria descrição; (2) **bio e card de
classe do Pet não contradizem mais o elemento**: o fallback genérico do
rookie ("Adepto de …") escolhia o elemento dominante dos 17 do class-system
sem olhar o que a bio (8 elementos do Oráculo) já tinha dito — medido
~50% de discordância no estágio mais visto. Hoje `elementoBaseDominante`
(`ficha/classTitle.ts`) prefere o `dominantElement` da leitura quando ele é
um dos 6 nomes compartilhados (fogo/agua/terra/ar/sombra/luz); `planta`/
`industrial` não têm par no class-system e seguem sem reconciliação.

⚠️ **28/09/2026 — criação única e proporcional (PR #133, régua
`soulProfile/criacaoDistribuicao.test.ts`).** Pedido do dono: personagem
único, base inteira do class-system e do bestiário, resultado dos dados do
jogador e chance proporcional. Medido antes (N=400) → depois (900 perfis, 3
seeds): 8 elementos 5,4× → 1,13× entre topo e piso; caminhos 46/32,5/21,5% →
~36/36/28%; família visual 13 → 44 de 44; companheiro 12 → 32 de 32; classes
72 → 78 de 79; evolução que atravessa família 21% → 43%; tupla visível única
26% → 95%. Regras que mudaram (todas calibradas por medição): o texto do
bestiário **puxa** a família visual metade das vezes, não decide sempre (a
descrição do próprio jogador segue decidindo); cada resposta do ritual pesa
igual, qualquer que seja o elemento/caminho que ela aponta; o **caminho**
alimenta Bênção/Maldição de toda ficha; o companheiro é capturado pela ficha
**mega**; o parentesco na linhagem pesa metade; o sorteio do bestiário dá
chance igual por **espécie**. Pendências sem decisão (corpus do bestiário 55%
`besta`, `combate_fisico` 40% por design, "Arauto do Fim", akasha/pântano) em
`REGISTRO-DE-DECISOES.md` §5.3.

**Por que isto é regra e não afinação.** A classe continua **emergente** (só
entra arquétipo que a ficha realmente conquistou — nada escolhido à mão, nada
sorteado fora do merecido) e continua **estável** (mesma pessoa, mesma classe,
em toda recomputação: é cache determinístico no save). O que mudou é *qual* dos
conquistados a criatura ostenta. E a escola passar a seguir o papel é a regra
mais antiga das quatro sendo enfim cumprida: um perfil de suporte recebia escola
de lutador.

**⚠️ Erro de medição que vale como aviso permanente.** As primeiras medições
usaram nomes formulaicos (`Perfil 1 Teste`). Como `normalizeName` só preserva
A–Z, **o índice é descartado** e centenas de perfis herdavam UMA numerologia —
`harmonia` como alinhamento dominante saltou de **57,7 % para 7,0 %** ao trocar
só o prefixo do nome. Toda régua de ocorrência do oráculo usa
`perfisSinteticos.ts` por causa disso: nome com índice não é amostra, é um
perfil repetido.

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
inspiração VAI na 1ª tentativa e NÃO no fallback; a cláusula anti-cópia nas duas; nome/bio sem ele — D-B1, 27/09/2026),
`src/utils/soulProfile/bestiary/bundleSemFranquia.contract.test.ts` (o pool servido sem franquia), `src/utils/soulProfile/axes.test.ts`,
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
não ali). Não deixa o nome da criatura-inspiração do bestiário chegar ao que o JOGADOR
lê (nome/bio/descrição por forma). ⚰️ **No PROMPT ele entra desde 27/09/2026
(D-B1)**: `pipeline.ts` passa a BASE do nome (`baseDeInspiracao`, sem prefixo
procedural nem elemento) em `bestiaryInspiration.nome`, e `composeSpritePrompt`
(`oracle.ts`) a põe SÓ em `imagePrompt` (`Draw inspiration from <base>.`);
`imagePromptFallback` segue sem ela, e a recusa do provedor cai nele
(`isRefusal`, `functions/api/generate-sprite.js`). A cláusula `Do not copy any
existing franchise character` continua nas duas variantes. ⚠️ **Até `2336e4e7` esta regra dizia o oposto** — "o nome da criatura-inspiração **nunca** entra em prompt", com teste travando a ausência. Revertida em 27/09/2026 pelo dono (D-B1), sabendo do risco de PI: *"pode deixar o nome da criatura aparecer no prompt, mesmo se tiver questão de direito autoral. Se não aceitar, você dá fallback para tirar."*
⚠️ **28/09/2026 (PR #127, achado do dono "garanta que o bestiário é bem
explorado"): a família e a linhagem do bestiário eram calculadas e
DESCARTADAS em três pontos.** `bestiaryInspiration.familia`/`.biologia`
(`pipeline.ts`) nunca eram lidos por `pickFamilies` (`oracle.ts`) — a família
VISUAL do pet só vinha de menção textual solta na descrição, mesmo com a
taxonomia do bestiário já calculada com confiança. Hoje `pickFamilies` recebe
`bestiaryFamilyHint` (novo parâmetro), resolvido por `bestiaryFamilyIds`
(ponte nova entre os 12 valores de `familia` + 9 de `biologia` do bestiário e
as 43 `CREATURE_FAMILIES` do Oráculo — `biologia`, mais específica, vence
quando as duas discordam) e só reforça o slot 1 quando a descrição do usuário
não citou bicho nenhum. Também a **linhagem inteira**
(`selectBestiaryLineage`, um pick por estágio de evolução) era calculada e
descartada nos dois call-sites de produção — as 11 formas sempre citavam a
MESMA inspiração do estágio 0. Hoje `pipeline.ts` extrai a base de nome de
CADA pick (`bestiaryLineageNomes`) e `composeSpritePrompts` usa a base do
ESTÁGIO certo só no `imagePrompt` daquele estágio; nome, família e identidade
textual continuam fixos pelo estágio 0 (o jogador nunca lê o pet "trocar de
espécie" — só a inspiração de IMAGEM evolui com ele). Régua:
`src/utils/soulProfile/pipeline.test.ts` (o caso do nome no prompt confere
por ESTÁGIO contra a linhagem).

O pool que alimenta isso foi cortado no mesmo dia (1.718 → **617** criaturas,
critério em `scripts/bestiario-procedencia.mjs`; ver
[`BESTIARIO-PROCEDENCIA.md`](../BESTIARIO-PROCEDENCIA.md)) e, também em
27/09/2026 (`b6ae2dc0`, `8fbf6990`), curado e recomposto para **630** entradas:
as 37 bases ganharam descrição, família e biologia coerentes (`CURADORIA`,
`scripts/bestiario-curadoria.mjs`); o bioma sai do modificador geográfico do
nome só quando ele é INEQUÍVOCO (`BIOMA_POR_MODIFICADOR` — "Costeiro" → Costa);
modificadores ambíguos ("Negro", "Vulcânico") ficam "Variado" **por decisão**.
A **ponte de elementos** (`scripts/bestiario-ponte-elementos.mjs`) garante
`PISO_POR_ELEMENTO` criaturas para cada elemento base — eletricidade/marcial/sombra
tinham 0/0/2 — clonando linhas curadas com o elemento trocado; as 13 cópias
levam `_ponte` e se retiram sozinhas quando o sync real cobrir o elemento.
Ainda em 27/09/2026 (`1d9e278d`) entraram os **arquétipos genéricos**
(`ARQUETIPOS`/`gerarArquetipos`, `scripts/bestiario-arquetipos-genericos.mjs`):
só FAMÍLIAS de gênero sem titular (gigante, autômato, espectro, limo, aberração,
morto-vivo), com descrição ORIGINAL — nenhum nome nem texto de entrada de
franquia. Pool: 630 → **732**; famílias de `REALM_TO_FAMILIAS`
(`bestiary/select.ts`) com criatura: 6 → **12 de 14** (`ignea`/`humanoide`
ficam de fora por ambiguidade). ⚠️ **28/09/2026 (PR #127): `humanoide` ganhou
ponte em `scoreCreature`** — nenhuma criatura do pool tem `familia: 'humanoide'`,
mas `biologia: ['Humanoide']` é real e já curada (os arquétipos de Gigante
etc.), então `scoreCreature` aceita esse campo como evidência equivalente
onde `familia` viria vazia. `ignea` **não** ganhou ponte — o §12 do
`BESTIARIO-PROCEDENCIA.md` registra esse nome como resíduo do bug de
corrupção de família corrigido na curadoria, sem certeza de ser família
legítima; fica pendência do dono, sem bônus. Também no mesmo PR, os quatro
bônus fixos de afinidade em `scoreCreature` (família/bioma/hostilidade/
tamanho) **dobraram** (2→4 / 2→4 / 1,5→3 / 1,5→3; teto combinado 7→14) —
o termo de elemento é contínuo sobre 17 valores medidos e tipicamente
superava sozinho o teto antigo de 7, deixando papel/alinhamento/reino do
jogador quase incapazes de influenciar a escolha da criatura-inspiração.
**O que NÃO faz:** não cita nome de personagem
de franquia no prompt — pedido do dono VETADO por parecer de PI; ver
[`REGISTRO-DE-DECISOES.md` §15](../REGISTRO-DE-DECISOES.md) e
`BESTIARIO-PROCEDENCIA.md` §12.
Dono: os três scripts + `scripts/sync-oracle-data.mjs` · Régua:
`src/utils/soulProfile/bestiary/curadoria.contract.test.ts`. Não muda mecânica nenhuma: todo pet é mecanicamente equivalente — muda
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
dados diferentes. Desde 22/09/2026, **`habitCountsForHeartsOn`** e
**`isWeekClosingDay`** (mesmo arquivo) são os donos da pergunta gêmea "este
hábito pode custar CORAÇÃO neste dia?" — ver o caso de borda abaixo.

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
- ✅ **`timesPerWeek` só pode custar CORAÇÃO no dia em que a semana FECHA**
  (decisão do dono **#57b**, 22/09/2026 — `habitCountsForHeartsOn`). ⚰️ Até
  então a meta de coração usava a **mesma** lista do dia completo: um "3× por
  semana" feito seg/qua/sex era cobrado na terça (1/3) e na quinta (2/3), e o
  domingo abria semana nova (0/3) cobrando a segunda — **três** corações por
  semana. Medido na QA Rodada 2 (§2.3): o perfil `Bt` perdeu **25 corações e
  caiu 6 vezes em 90 dias**, enquanto o MESMO jogador com `weekdays [1,3,5]`
  perdia **zero**. O preset que o `CreateModal` oferece a quem não quer
  compromisso diário era o que mais punia, e este § e `isDueOn` prometem por
  escrito que ele "tem perdão embutido". Agora: feito hoje → entra na meta (para
  o feito e a meta usarem o mesmo denominador); meta da semana já cumprida →
  fora; nos demais dias, só entra se `isWeekClosingDay(date)` (sábado, derivado
  de `weekStart + 6`, e não de um `getDay() === 6` escrito à mão). Medido depois:
  **0 corações e 0 quedas**. **O CRÉDITO não mudou** — `habitCountsOn` continua
  deixando o hábito contar para o dia completo em qualquer dia em que for feito.
  Quem compõe as duas listas é `heartGoalFor` › `soParaCoracao` em
  `dailyReset.ts`, que passa pelo `dailyGoalFor` de sempre em vez de repetir o
  `Math.min(…, required)` (dono único, `dailyGoal.contract.test.ts`); sem
  `dayKey` não há semana a consultar e o estado volta intacto.
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

<a id="desfazer"></a>
## 24-A. ↩️ Desfazer a conclusão (a janela de 5 segundos)

**Em uma frase.** Marcar um hábito abre **5 segundos** de "Desfazer" que reverte
a conclusão inteira; passada a janela, ela volta a ser imutável.

**A regra** (decisão do dono **#57**, 22/09/2026). ⚰️ Marcar era IRREVERSÍVEL
por desenho — `handleToggleActivityCompletion` abre com
`if (activity?.completedToday …) return;`, e o comentário ao lado diz que
*"completed activities cannot be unchecked — only daily reset restores them"*. A
razão é boa (desmarcar à vontade transforma o contador de dia completo em
brinquedo e o `foodInventory` em torneira), mas ela também significava que **o
toque errado** — o dedo no item de cima da lista, a linha vizinha, o hábito
homônimo — custava comida, atributo, XP de Vínculo e constância **sem volta**,
até a meia-noite.

`UNDO_WINDOW_MS` = **5000** (`src/utils/completionUndo.ts`) é a duração do toast
**e** o limite da reversão, de propósito: duas durações diferentes dariam um
botão que some antes de expirar (promessa quebrada) ou que expira antes de sumir
(botão morto na tela).

**É SNAPSHOT, não "aplicar o inverso".** A conclusão toca **11** campos em três
arquivos (`CAMPOS_DA_CONCLUSAO`: `activities`, `activityStats`, `activityLog`,
`foodInventory`, `habitRhythms`, `powerPoints`, `harmonyPoints`, `benevolencePoints`,
`attributesSinceLastEvolution`, `totalXP`, `bondDaily`). Escrever o inverso de
cada um seria uma SEGUNDA regra de conclusão, e regra copiada diverge em
silêncio (footgun 9): quem acrescentasse um campo amanhã deixaria o desfazer
pela metade sem nada ficar vermelho. O snapshot guarda o valor ANTES e devolve
ele; campo novo entra em `CAMPOS_DA_CONCLUSAO`, e há teste varrendo.

**O que o desfazer NÃO reverte, de propósito.** Só os campos listados.
`perfectDays`, `totalPerfectDays`, `healthPoints`, `evolutionStage` e as moedas
**não estão na lista** — a conclusão não os escreve, e desfazer não pode virar
porta dos fundos para mexer em progressão. Em compensação, dentro da janela ele
devolve **inclusive a comida já gasta**, que é o preço de reverter "a conclusão
inteira": cai sempre do lado seguro (o jogador fica com o estado de antes do
erro, nunca com um a mais).

**Dono.** `src/utils/completionUndo.ts` — `CAMPOS_DA_CONCLUSAO`,
`UNDO_WINDOW_MS`, `snapshotCompletion` (chamada FORA do updater, porque o
updater roda 2× no StrictMode), `undoCompletion` (pura, idempotente, rodando
DENTRO do updater sobre o `prev`). `src/App.tsx` › `ofereceDesfazer` é quem
monta o toast; `src/components/UndoToast.tsx` é a peça
([§03 §4](03-FLUXO-DE-TELAS.md), [04 §10](04-IDENTIDADE-VISUAL.md)).

**Régua.** `src/utils/regrasDeJogo.qaRodada2.test.ts` (bloco `#57`).

**Casos de borda.**
- **Hábito com etapas**: a ÚLTIMA etapa fecha o hábito, então ela também abre a
  janela — sem isso, hábito com etapas seria a metade do app onde o toque errado
  continua sem volta.
- **Virada do dia no meio da janela**: seguro, porque os campos são
  sobrescritos pelos do snapshot e a virada reescreve `activities`/`habitRhythms`
  na abertura seguinte de qualquer jeito.
- **Desfazer duas vezes** escreve os mesmos valores (idempotente por construção).
- A conclusão **já feita hoje** não reabre a janela (`completedToday &&
  lastCompletedDate === today`).

**O que NÃO faz.** Não transforma a conclusão em reversível: passada a janela,
`handleToggleActivityCompletion` continua recusando desmarcar. Não toca
progressão. Não persiste nada — o snapshot vive na *closure* do toast.

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
`adventureRarity`, `rollAdventure`, `adventureOfDay`, `adventureOfNight`, `collectAdventure`,
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
- **O achado da noite é estável depois de guardado** (`adventureOfNight`, desde
  `3532ccf5`): se o diário já tem entrada com a data da noite, o achado é ELA; senão
  o sorteio ignora o que entrou nessa mesma data. ⚰️ Antes, recalcular depois de
  guardar devolvia o próximo não coletado e o efeito guardava em cascata. O rótulo
  "inédito" passou a ser "não estava no diário ANTES desta noite".
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
para o emoji continua correto e deve ficar — bundle antigo pode não ter a arte. Desde 30/09/2026 (rodada 3) `ADVENTURE_ART` também carrega os **48** postais das Travessias (`trv-<região>-<nome>`, glob `adv-trv-*.png`): `ls src/assets/soulmon/adventures | grep -c '^adv-trv'` → 48 (medido em 01/10/2026), e dois postais ganharam `bgId` próprio (`bg-campina`, `bg-cavernas`) em `src/data/travessiasCatalog.ts`.

**O que NÃO faz.** Não paga Bits, item, atributo nem XP. Não usa `Math.random`.
O diário não mostra silhueta do que falta (isso é o Dex de Sonhos, onde a coleção
É o jogo), não mostra raridade — rotular a noite de ontem como "comum" é dizer
que ela valeu pouco — e não conta nem premia nada.

**O Passeio e as Travessias (desde `3532ccf5`, 30/09/2026 — `REGISTRO-DE-DECISOES.md` §5.6).**
A Aventura da noite ganhou um **destino**. O lote **Passeio / Stroll** da Exploração
(`src/components/play/PasseioSheet.tsx`) deixa escolher para onde o pet sai (casa ou
uma região já aberta) e, opcionalmente, uma **Travessia**: um desafio da VIDA REAL,
com versão pequena que conta exatamente igual, que abre uma região do mapa.

```
passeioFindOfDay({ crossings, entries, feito, meta, dayKey }):   ← crossings JÁ assentado por settleNight
   1. já há entrada no diário com data dayKey        → é ela (reabrir não re-sorteia)
   2. uma região ABRIU nesta noite                    → a cena de chegada dela (arrival)
   3. destino = região aberta ≠ casa                  → com PASSEIO_REGION_FIND_CHANCE (0,5),
                                                         um achado exclusivo dela ainda não coletado
   4. senão, e SEMPRE em casa                         → exatamente adventureOfDay
settleNight(s, dayKey): se nenhuma região abriu nesta noite e há "Fiz" guardado,
   abre o mais antigo (REGIONS_OPENED_PER_DAY = 1); idempotente — mesma referência na 2ª chamada
```

- **Regiões**: 8 (`RegionId`), casa = `HOME_REGION` (`campina`), sempre aberta e sem
  desafios; as outras 7 têm exatamente 3 desafios de áreas diferentes, `minAge: 13`
  (`src/data/travessiasCatalog.ts`). "Trocar" escolhe entre os MESMOS 3 — nada sorteia desafio.
- **"Fiz"** (`markDone`) não abre nada na hora: vira `pending`, sem data, nunca expira;
  a região abre no assentamento da noite, no máximo uma por noite. "Deixar pra lá"
  (`dropCrossing`) não custa nada.
- **Assentamento no `App`**: ao ABRIR o relatório, o mesmo updater (puro, sobre `prev`)
  roda `settleNight` e guarda o achado (`collectAdventure`); nada mudou → devolve `prev`.
  O catálogo das regiões só é carregado (`import()`) quando o save já mexeu no mapa
  (`crossingsTouchMap`: região aberta ou "Fiz" guardado) — sem isso o achado é
  `adventureOfNight`, a Aventura comum, e o catálogo fica fora do chunk de entrada.
- **Palco**: com destino ≠ casa, o `CompanionHUD` mostra 🎒 nas costas do pet
  (`walkingTo`, `pointerEvents: none`, sem texto visível, sem som, nome só no `aria-label`).
- **Interruptor**: "Esconder Travessias" na própria folha (`setHidden`); o Passeio continua.
- **Exceção à regra 4** ("o dia mexe na chance, nunca no acesso"): cada região aberta
  tem postal e lore EXCLUSIVOS (ids `trv-*`). É estreita: o catálogo comum
  (`ADVENTURE_CATALOG`) continua inteiro alcançável por quem nunca fez uma Travessia
  (R-33, há teste), e `adventure.ts` não lê Travessia. Os achados de região também
  não pagam nada e também são determinísticos por dia.
- **O que NÃO faz**: nenhum sistema do núcleo (meta, HP, `perfectDays`, evolução,
  Vínculo, missões, Bits, Honra) importa `utils/travessias.ts`; nada fora do app
  (push, widget, overlay, desktop) fala de Travessia/Passeio; a folha nunca mostra
  contagem de regiões, total, percentual, prazo, prêmio nem a palavra "desafio".
- **Save**: `GameState.crossings` (só ids, enum, `dayKey` e o booleano `hidden`),
  higienizado por `normalizeCrossings` ([`07`](07-DADOS-E-SAVE.md)).
- **Régua**: `src/utils/travessias.test.ts`, `src/utils/travessias.contract.test.ts`
  (a)–(e), `src/components/play/playArea.render.test.tsx`.

**Missões do dia, Marcos de Aventura e a viagem da noite (04/10/2026 — `REGISTRO-DE-DECISOES.md` §21).**
Mudam a camada das Travessias; o resto do Passeio acima segue.
- **3 missões por dia, escolhe 1**: `dailyOffer(dayKey, seed)` sorteia 3 das 21 propostas
  (`seed` = id do save; **3 regiões diferentes**, determinístico: reabrir não re-sorteia).
  `pickMission(s, dayKey, seed, region, challenge)` só aceita uma das três e não aceita nada
  depois do "Fiz" de hoje; a escolhida vale só para o dia (`CrossingsState.pickDay`) — no dia
  seguinte saem três novas. `activeChallenge(s, dayKey)` devolve null se a escolhida é de outro
  dia. "Recuar" (`dropCrossing`) solta a escolha e devolve as três. Um "Fiz" por dia no total.
- **Marcos de Aventura**: `CrossingsState.score` soma 1 por "Fiz" (no máximo 1/dia, nunca cai,
  teto 9999 na higienização). `MARCO_THRESHOLDS` = 5/10/20 abrem um postal cosmético
  (`MARCO_POSTAIS`, `trv-marco-N`) na primeira noite livre. Nunca Bits/XP/Emblema.
- **Viagem da noite**: `markDone` guarda `trip = { day, region }`; no relatório desse dia
  `passeioFindOfDay` traz a cena de chegada (se a região abriu nesta noite) ou uma de **3
  historinhas por região** (`VIAGENS`, 21; prefere a não coletada). Ordem: já guardado >
  chegada > postal de Marco > viagem > destino > Aventura comum.
- **Marcador**: `missionMark(c, dayKey)` → `'available'` ("!", `exclamation`), `'progress'`
  ("?", `question`) ou null; mostrado sobre o lote do Passeio e no card. Sem som, animação ou número.
- **Régua**: `src/utils/travessias.test.ts` (blocos "missões diárias", "marcador", "Marcos",
  "viagem"), `src/components/play/PasseioSheet.render.test.tsx`, `src/utils/travessias.contract.test.ts`.

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
| 💠 Bits | `gamePoints` | **dia completo (100/dia)** + minijogos (Corrida com obstáculos, PPT, Masmorra, Arena e os cinco do Ateliê da Mente — [§54](#minijogos)), estes com teto de **150/dia** (um teto só, compartilhado; a Masmorra paga ×`DUNGEON_BITS_FACTOR`, [§51](#masmorra)) | loja comum, `deepStartCost` da masmorra | save do cliente |
| 🎖️ Honra (EN *Honor*; ⚰️ o rótulo era "Emblemas" / "Emblems" até 30/09/2026 — `REGISTRO-DE-DECISOES.md` §17) | `emblems` | Torneio (`EMBLEMS_PER_WIN` / `EMBLEMS_PER_LOSS`) e missões semanais | só `TOURNAMENT_ITEMS` | save do cliente |
| 💎 Créditos | `credits` | **dinheiro real** (ou anúncio, ver abaixo) | reroll, câmbio por Bits, `accountTier:'paid'` | servidor, `ENT_PREFIX` + saveId |

Constantes, todas em `src/utils/currencies.ts` salvo indicação:

| Constante | Valor | O que faz |
|---|---|---|
| `EMBLEMS_PER_WIN` | 3 | de Honra por vitória de partida do Torneio |
| `EMBLEMS_PER_LOSS` | 1 | consolo — jogar sempre rende alguma coisa |
| `BITS_PER_COMPLETE_DAY` (`src/utils/dailyReset.ts`) | 100 | 💠 creditados pela virada a cada **dia completo** (#61/#63, 22/09/2026). Sem teto próprio: o teto é o calendário |
| `MINIGAME_BITS_PER_DAY` | 150 | teto de 💠 que **os minijogos** podem render num dia do jogador (#61/#63). Ledger `minigameBits {day, earned}` no save |
| `CREDIT_TO_BITS` | 10 | 1 Crédito = 10 Bits, **só nesta direção** |
| `BITS_EXCHANGE` | 3 pacotes (1/2/4 Créditos = 10/20/40 Bits, PR12a: cabem no teto de 25% do ganho grátis do dia) | cada pacote é `credits × CREDIT_TO_BITS` |
| `REROLL_COST_CREDITS` (`src/utils/monetization.ts`) | 50 | refazer a leitura do Oráculo |
| `AD_REWARD_CREDITS` (`functions/api/_entitlements.js`) | 5 | Créditos por anúncio recompensado |
| `AD_DAILY_CAP` (`functions/api/_entitlements.js`) | 3 | anúncios por dia, contados **no servidor** |
| `ADS_ENABLED` (`src/utils/monetization.ts`) | `false` | o caminho do anúncio está DESLIGADO no cliente |

**Tier pago sem compra existe, e chama-se cortesia** (desde `42b07bec`, decisão
#12 do QA geral): `POST /api/entitlements?action=grant` (chave de admin
`ENTITLEMENTS_ADMIN_KEY`; sem ela a rota não existe) concede `accountTier:'paid'`
com `provider:'courtesy'`, **zero Créditos** (cortesia abre o portão do Oráculo,
não paga a conta de IA), idempotente por conta e sob teto global
(`COURTESY_MAX_ACCOUNTS`, padrão 25, contador que só sobe). Existe porque, até a
Play existir, nenhum humano tem como comprar o tier — e os 10 primeiros
testadores só veriam o demo. O `GET` devolve `provider` para que a leitura de
vínculo saiba quem pagou e quem ganhou. Detalhe em
[`06-REFERENCIA/api-workers.md`](06-REFERENCIA/api-workers.md) › `_entitlements.js`.

**A cortesia SOBREVIVE a um reembolso da Play — regra PROVISÓRIA (#40,
`PERGUNTAS-DO-DONO.md`), desde `a6c1cd8a`.** O tier passou a ser DERIVADO dos
pedidos de pé: `auditRefunds` termina com `tier = paidProviderOf(ent) ? 'paid' :
'demo'` — "`paid` se e somente se existe pedido pago não desfeito". ⚰️ Antes ele
rebaixava para `demo` a cada pedido desfeito sem olhar os outros; com um pedido
por conta era inalcançável, mas a cortesia criou o segundo, e uma Play
reembolsada deixava `tier: 'demo'` com `provider: 'courtesy'` — o mesmo arquivo
dando duas respostas para "esta conta é paga?". A loja não tem como desfazer um
pedido que não é dela, então a cortesia fica; se o dono decidir que reembolso
derruba a cortesia também, o conserto é marcar o pedido `courtesy:*` como
`voided` na auditoria, e a derivação continua certa. Consequência lateral já
observada em teste: cortesia ANTES + Play válida DEPOIS reporta `provider:
'play'` (o mais recente não anulado); Play válida ANTES + cortesia DEPOIS
reporta `courtesy` — ranquear provedores ninguém pediu. Régua:
`functions/api/_entitlements.tierDerivado.qa.test.js`,
`entitlements.grant.qa.test.js`.

**Cota de chat por tier — regra PROVISÓRIA (#55, `PERGUNTAS-DO-DONO.md`),
desde `592e2c14`.** `AI_LIMITS.chat` em `functions/api/_aiGuard.js` ganhou
`perAccountByTier: { demo: 30, paid: 120 }` sobre o `perAccount: 120` (que
continua sendo o teto de quem não tem tier conhecido). ⚰️ Demo e paga tinham a
MESMA cota (120/dia): 1.000 demos no teto = ~R$ 950/mês de Groq com receita
zero, alcançável por `curl` (`03-negocio-pesquisa-r2.md` §5). Não é moeda — é o
único lugar do produto em que `accountTier` compra USO, e por isso mora aqui:
`paid` continua sem SKU recorrente e sem modelo acima do 8b (linha
`[provisório #55]` no `REGISTRO-DE-DECISOES.md`). A recusa chega como
`429 ai-daily-limit` com `AI_REFUSAL_MESSAGES`, honesta, nunca como convite de
compra. Régua: `functions/api/_aiGuard.tierCap.qa2.test.js`.

**✅ BITS POR DIA COMPLETO + TETO DIÁRIO DE MINIJOGO** (decisão do dono
**#61/#63**, 22/09/2026). ⚰️ Até esta data Bits vinham **só** de minijogo, e a
simulação de 90 dias (`07-simulacao-jogo-r2.md` §2.7) mediu o desequilíbrio
contra a loja de **8 900 💠** (55 itens — o catálogo de `src/utils/shop.ts`;
os dois docstrings o chamam de `SHOP_ITEMS`, e o export é `ALL_SHOP_ITEMS`):
perfil **A** (faz
tudo, todo dia, nunca joga) = **0 Bits**, loja inteira invisível; perfil **B**
(3 runs/semana) = 13 598 (152% da loja); perfil **G** (zero hábitos, 1 run/dia)
= 34 566 = **3,9× a loja**, mais 288 chips (o galho virava comprável). O jogo
cobrava cuidado e pagava minijogo.

As duas metades, e por que são duas:

1. **`BITS_PER_COMPLETE_DAY = 100`** (`dailyReset.ts`), creditado pela virada
   junto com o dia completo ([§7](#dia-completo)). O número saiu da simulação,
   não do dedo: o perfil A faz **89** dias completos em 90, e `89 × 100 = 8 900`
   = exatamente o catálogo — **quem cuida compra a loja inteira em ~90 dias, e
   só então**. A unidade paga é a que o produto já sanciona (o **dia completo**),
   **nunca** a contagem de tarefas (linha vermelha #16).
2. **`MINIGAME_BITS_PER_DAY = 150`** (`currencies.ts`), com
   `creditMinigameBits(prev, amount, dayKey)` puro, rodando **dentro** do
   updater e gravando o ledger `minigameBits {day, earned}` no MESMO retorno que
   soma os Bits — a masmorra credita várias vezes por run no mesmo lote do
   React, e um teto lido de fora passaria duas vezes (família de bug do X-6). No
   save, nunca no `localStorage`: teto que se fura trocando de aparelho não é
   teto. O dia é o **dia do jogador**.

⚠️ **Por que o teto é em BITS/dia e não em RUNS/dia**, embora a pergunta do dono
dissesse "teto de runs": o perfil G **já faz exatamente uma run por dia**. O que
o faz juntar 34 mil é o VALOR da run, que sobe com a base semanal da masmorra
(327 → 417). Um teto de runs seria letra morta contra o jogador que a própria
decisão nomeia; só em Bits/dia ele morde. Medido depois: G cai de 3,9× para
**1,5× a loja** (~60 dias para comprar tudo), A compra em ~90, e a razão
grinder/cuidador vira **1,5:1** em vez de ∞:1.

**O teto não tira nada de ninguém:** bater nele só faz os Bits **pararem de
somar** — exatamente como o teto suave do Vínculo ([§55](#vinculo)). Não
bloqueia a masmorra, não cobra entrada, não toca coração; 🌀, placar, bestiário
e andares continuam inteiros. O `CLAUDE.md` já declarava qual é a alavanca
permitida ("se farmar Bits virar problema, a alavanca é custo de ENTRADA em
Bits, nunca o retorno do custo em corações"), e um teto de **ganho** é mais
suave ainda, porque não pode deixar ninguém sem jogar. Régua:
`src/utils/regrasDeJogo.qaRodada2.test.ts` (bloco `#61/#63`).

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
**sem ícone nenhum** — a ausência de ícone É a distinção. Honra (`emblems`) em serifa de
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

☞ **O MODELO DE RECEITA foi decidido em 22/09/2026** (pergunta **#55** do dono) e
o registro inteiro — as duas alternativas que perderam e os dois gatilhos de
revisão — mora em [`REGISTRO-DE-DECISOES.md` §5.4](../REGISTRO-DE-DECISOES.md),
resumido em [`01 §8`](01-VISAO.md#o-modelo-de-monetização). Em uma linha: compra
única R$ 29,90 **+ assinatura de IA R$ 9,90/mês com 300 mensagens, só texto e
voz** (chat, sugestões, transcrição); **o sprite fica FORA** (imagem é o custo
caro); créditos para quem estoura; 1º mês de cortesia para quem comprou o
desbloqueio; **construir DEPOIS do E0**. ⚠️ **Nada disso muda regra hoje**:
`monetization.ts` **não tem SKU recorrente** — a ausência é proposital, e está
declarada no docstring de `FULL_UNLOCK_SKU` — e o que limita custo de IA
continua sendo a cota por tier de `_aiGuard.js` (logo acima). Este § descreve
moedas; a receita não é moeda.

**Casos de borda.**
- **A Honra é farmável por quem editar o `localStorage`**, e isso é aceito
  *enquanto* a aba de Torneio vender só `bg`/`furniture`. Há teste travando o
  `kind` de todo `TOURNAMENT_ITEMS`; se ele cair, a resposta certa não é
  afrouxá-lo — é mover a Honra para o servidor, junto dos Créditos.
- **Dois toques no mesmo lote do React** não cobram duas vezes: a recusa é
  reconferida sobre o `prev` (ver [§47](#loja)).
- **Anúncio**: o teto é do servidor (`grantAdReward` zera `adCount` por
  `ent.adDate`), não do cliente. `ADS_ENABLED = false` mantém o botão fora da
  tela; a rota continua existindo.
- **`bitsStyle` e `bitsStyleLight` são idênticos de propósito** — o par existe
  porque a cor era escolhida à mão por tema, e os dois exports têm call-site.

**O que NÃO faz.** Não converte Bits em Créditos. Não deixa a Honra comprar na
loja comum nem Bits comprar na aba de Torneio (`shopBalanceFor` lê a moeda do
item). Não guarda o saldo de Créditos no save como verdade — o `credits` do
`GameState` é espelho do servidor. Não usa o mesmo ícone para duas moedas.

**Onde a UI mostra.** `src/components/mercado/MercadoSheets.tsx` (saldo da moeda do segmento
+ os três botões de câmbio), `src/components/nav/MapPage.tsx` (o saldo das
3 moedas no topo do Mapa; ⚰️ a `ActivitiesPage` mostrava Bits até a minimal-ui F5), `src/components/TournamentPage.tsx` (Honra e o `+3`/`+1` do fim da
partida), `src/components/CreditsModal.tsx` (pacotes, anúncio, custo do reroll).

---

<a id="loja"></a>
## 47. 🛒 Loja

**Em uma frase.** Um catálogo estático de consumíveis, cenários e decoração, com
uma compra que debita, entrega e equipa na hora — e nada dela dá vantagem de
jogo: os três chips de atributo só dão pontos de tipo (inclinam o caminho e a
distribuição na evolução), sem XP, sem level e sem alterar o total de pontos de
combate (combate v3, PR6; save antigo com +3 já somado fica como está — o
combate lê o level e normaliza os pontos de tipo em fatias de 15% a 45%).

**A regra.** O catálogo é dado puro em `src/utils/shop.ts`. Medido em
09/09/2026 com `SHOP_ITEMS.length` / `.filter(...)`:

| Fatia | Quantidade | Preço (Bits) |
|---|---|---|
| `SHOP_ITEMS` (loja comum) | 56 | — |
| chips de atributo (`kind:'chip'`) | 3 | 120 |
| decoração (`kind:'furniture'`) | 27 | 100–140 |
| cenários (`kind:'bg'`) | 26 | 1 grátis (`bg-room`, `price: 0`) · 19 entre 150 e 250 · 6 travados por missão a 300 |
| `TOURNAMENT_ITEMS` (aba Torneio) | 8 | 8/12/15/20/25/40/55/70 de **Honra** |
| `ALL_SHOP_ITEMS` | 64 | catálogo inteiro |

`ALL_SHOP_ITEMS` é o que se usa para **resolver** um item por id. Procurar só em
`SHOP_ITEMS` fazia a mobília de Torneio comprada e equipada não aparecer no box
do pet; há teste travando a ausência de id repetido no catálogo inteiro.

**A compra.** Dono: `src/utils/shopBuy.ts` → `shopBuyRefusal` + `applyShopBuy`.
Duas recusas, `'no-funds'` e `'already-owned'`. O efeito por `kind`:

- `chip` / `heart` → `+1` na mochila (`foodInventory`, chaveada pelo **emoji**;
  a descrição dos chips diz "Vai pra mochila" — ⚰️ antes "pastinha");
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
`src/components/mercado/MercadoSheets.render.test.tsx`,
`src/utils/mercadoCatalog.test.ts`.

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

**Onde a UI mostra.** `src/components/mercado/MercadoSheets.tsx` (+ `ShopShelf.tsx`
e o catálogo `src/utils/mercadoCatalog.ts`), aberto pelos lotes da área
Mercado (minimal-ui F5): **Itens**, **Decoração** e **Background**, cada um com
abas por moeda, e **Conquistas**. A vitrine é repartida por
`src/utils/mercadoCatalog.ts` (não é catálogo novo — itens e preços seguem em
`shop.ts`): `STALL_CURRENCIES` dá as abas de cada lojinha (Itens: Bits +
Créditos, onde Créditos é só a troca `BITS_EXCHANGE` e `stallItems` devolve
lista vazia; Decoração e Background: Bits + Honra); `stallItems` lista só
itens do `kind` da lojinha **cobrados na moeda da aba**; na aba de Honra só
cosmético (`isCosmetic` = `bg`/`furniture`); e `isNeverForSale` tira da vitrine
o coraçãozinho e o 🌀 mesmo que voltem ao catálogo. `tournamentShopItems` é a
loja de Honra do Torneio, com o mesmo filtro. A loja de Honra (`TOURNAMENT_ITEMS`) mora
no Torneio da área Arena. ⚰️ Antes: `ShopModal` com dois segmentos
(`ShopSegment`) aberto pela barra inferior.

---

<a id="itens-especiais"></a>
## 48. 🌀💗👊 Itens especiais (o uso da pastinha)

**Em uma frase.** Cinco itens que moram na mesma pastinha da comida e se
comportam de forma completamente diferente dela: chip dá atributo, coraçãozinho
cura, Glitchtama dá um dia completo — e nenhum conta no teto de comida.

**A regra.** Catálogo em `src/utils/shop.ts` → `SPECIAL_ITEMS`, chaveado pelo
**emoji** (que é a mesma chave do `foodInventory`). Cinco chaves, três `kind`:

| Emoji | `kind` | Efeito ao USAR |
|---|---|---|
| 🌀 `GLITCHTAMA_EMOJI` | `glitchtama` | `perfectDays +1` **e** `missionPerfectDays +1`. ⚰️ Até 22/09/2026 o segundo era `totalPerfectDays` — o 🌀 saiu das conquistas por decisão do dono **#41/#60** ([§57-A](#conquistas)) |
| 💗 `HEART_ITEM_EMOJI` | `heart` | `+HEART_HEAL` de coração, clampado em `maxHealthPoints` |
| 👊 / 🎶 / 🤲 `CHIP_EMOJI` | `chip` | `+CHIP_BOOST` no atributo, `+CHIP_BOOST × 10` de `totalXP`, e o mesmo no `attributesSinceLastEvolution` |

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
- **`missionPerfectDays` ausente** em save antigo cai em `totalPerfectDays ?? 0` — o vitalício antigo JÁ somava os 🌀, então a missão nunca anda para trás para quem já usou o item. ⚰️ Este caso de borda falava de `totalPerfectDays`, que o 🌀 deixou de tocar.
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

**Onde a UI mostra.** `src/components/home/Mochila.tsx` (a aba "especiais" da
mochila, e é dela que se usa — ⚰️ antes a pastinha `ItemsWindow`), `src/components/mercado/MercadoSheets.tsx` (os chips à venda),
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
| `mission-perfect-30` | 30 | `missionPerfectDays` | `bg-mission-aurora` |

Cada missão tem `category: MissionCategory` (`'evolution' | 'dungeon' | 'games' |
'constancy'`, em `MISSION_CATEGORIES`): as duas de estágio são `evolution`, kills
e runs são `dungeon`, a Corrida com obstáculos (`mission-dino-1000`) é `games`, `mission-perfect-30` é `constancy` (⚰️ o nome era "Constância Perfeita" / "Perfect Consistency"; desde 30/09/2026 é `Trinta Dias Completos` / `Thirty Full Days` — o `id` não mudou). É
dado da missão, não da tela — missão sem categoria não compila — e é o filtro da
folha de Conquistas do Mercado (minimal-ui F5).

Os contadores são **lifetime** e vivem no `GameState`, e por isso **não** são
decrementados na evolução (ao contrário de `perfectDays`, ver
[§17](#evolucao)). ⚰️ **`mission-perfect-30` lia `totalPerfectDays` até
22/09/2026**; desde a decisão do dono **#41/#60** ele lê **`missionPerfectDays`**
— dias completos reais **mais** os 🌀. São duas perguntas diferentes: "você
cumpriu 30 dias?" (conquista, [§57-A](#conquistas), que lê `totalPerfectDays`) e
"você acumulou 30 marcas?" (esta missão). A virada incrementa os **dois** num dia
completo real, então a missão nunca ficou mais difícil do que era.

`getMissionProgress` limita cada progresso ao `target` (nunca `104/100`).
`isMissionComplete` compara com o alvo. `isShopItemUnlocked` é a porta que
`handleShopBuy` chama.

**As duas missões de estágio olham o histórico, não o presente.** `reachedLevel`
varre `[evolutionStage, ...unlockedEvolutions]` — quem chegou a mega e
degenerou, ou renasceu ([§20](#rebirth)), continua com a missão cumprida.

**Dono.** `src/utils/missions.ts`. Os contadores são escritos no `src/App.tsx`
(`handleDungeonEnemyDefeated`, `handleGlitchtama`, `handleDinoScore`) e na
virada (`src/utils/dailyReset.ts` — `totalPerfectDays` **e**
`missionPerfectDays`); o 🌀 escreve só o segundo (`src/utils/specialItemUse.ts`).

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

**O que NÃO faz.** Não paga Bits, Honra nem Créditos. Não repete: cumprida,
acabou — é justamente essa finitude que motivou as missões semanais
([§50](#missoes-semanais)). Não some da loja quando travada. ⚰️ **Não tem aba
própria**: a aba Missões da loja não existe mais (a explicação passou a ficar na
linha do próprio item travado).

**Onde a UI mostra.** `src/components/mercado/MercadoSheets.tsx` — o cadeado, a descrição da
missão e o progresso, na linha do cenário travado; e a folha **Conquistas** do
Mercado, que lista as missões com abas por `MISSION_CATEGORIES` (e não por
moeda).

---

<a id="missoes-semanais"></a>
## 50. 🗓️ Missões semanais

**Em uma frase.** Três objetivos por semana, sorteados de um pool de doze de
forma determinística, pagos em Honra — e **nenhum deles premia quantidade de
tarefa**.

**A regra.** `src/utils/weeklyMissions.ts`. O pool tem **12** entradas
(`weeklyMissionPool()`), `WEEKLY_MISSION_COUNT` = 3, e `weeklyMissionsFor(weekKey)`
sorteia sem repetição com `mulberry32(hashString('weekly-missions:' + weekKey))`.

Determinismo não é elegância: **é a diferença entre uma missão e um sorteio.** Se
a lista mudasse a cada abertura, a pessoa aprenderia a reabrir o app até cair uma
fácil.

O pool inteiro, com alvo e pagamento em Honra: `rest-nights` 3/3 ·
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
de tarefas, recompensa só em Honra, pagamento único) e
**`src/utils/weeklyMissions.fiacao.test.ts`** — guard de FIAÇÃO: exige um
`contarMissao('<id>')` no `App.tsx` para **toda** missão do pool, exige que
`bumpWeekly` apareça uma vez só, e exige que a lista chegue ao segmento Torneio
das lojinhas do Mercado (⚰️ `ShopModal`).

**Decisão.** WP4.7. Até 06/09/2026 o módulo tinha **zero consumidores** — a
terceira repetição do padrão do `bestiary` e das estações. O custo era de
economia: os oito `TOURNAMENT_ITEMS` somam **245** de Honra e
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
(dinheiro real não se ganha jogando). Não expira a Honra já paga. Não muda a
lista quando o app reabre.

**Onde a UI mostra.** `src/components/TournamentPage.tsx`, aba **Missões** da folha
do Torneio (Arena; minimal-ui F5, 24/09/2026 — ⚰️ era o topo do segmento Torneio da
`ShopModal`) — onde a moeda é gasta, a torneira e o ralo na mesma folha.

---

<a id="masmorra"></a>
## 51. ⚔️ Masmorra

**Em uma frase.** Uma run de cinco andares contra seis inimigos cada, sem limite
diário e sem porta de entrada — e perder **não custa um único coração**.

**A regra.** Uma run = `MAX_FLOORS` (5) andares, e a constante mora em
`src/components/DungeonGame.tsx`. Cada andar é uma escada fixa de **6** inimigos
subindo `LADDER_TIERS` em ordem: `baby-i → baby-ii → rookie → champion →
ultimate → mega`.

`buildDungeonWave(level, petStage, rng, playerLevel)` (`src/utils/dungeon.ts`) monta a onda. A
dificuldade do andar F é `base + (F − 1)`. **Combate v3 (PR4, 06/10/2026): o inimigo é
RELATIVO ao level do jogador.** `dungeonFoe(playerLevel, slot, floor)` devolve o espelho
balanceado do level, com vida × `DUNGEON_SLOTS[slot].hp` e força × `.power` (o 6º slot
solta um especial `direct`), e cada andar acima do 1 soma `DUNGEON_FLOOR_GROWTH` (vida
+14%, força +11% por andar), com piso de `DUNGEON_MIN_HITS` (3) golpes do melhor atacante
do level. Por isso a parede é a mesma para todo level. Só os Bits seguem um multiplicador
por andar: `ptsMult = 1 + 0.12 × (F − 1)`. ⚰️ `TIER_BASE`, o `step` com `hpMult`/`atkMult`/
`dmgReduction`/`speedBump` e a tabela `PLAYER_STATS` (com `playerStatsFor`) saíram no PR4:
o jogador é o `soulCombatant` do level, e a Arena e o Pesadelo leem o mesmo núcleo
(`utils/combate/`), não uma tabela por estágio.

**Recompensas.** Bits por inimigo (`enemy.points`) + bônus de andar
`clearBonus(floor) = round((10 + 5 × (floor − 1)) × DUNGEON_BITS_FACTOR)` = 4/6/8/10/12 (⚰️ era 10/15/20/25/30 até 30/09/2026, quando o dono trouxe a run completa para perto do teto diário — `BALANCO-MINIJOGOS.md` §4). Limpar um andar cura
uma fração do HP máximo (`pve.cura`, o `curaAndar` do ofício); o HP do jogador **carrega** entre andares. Limpar
os 5 dá **🌀 Glitchtama** (`onGlitchtama`) e sobe a base
(`setDungeonDifficultyAtLeast(base + 1)`).

**A base persiste e reseta toda SEMANA** — `STORAGE_KEYS.DUNGEON_DIFFICULTY`,
gravado como `{week, level}` com `weekKey()` local. O placar é
`STORAGE_KEYS.DUNGEON_BEST` (`recordDungeonScore` / `getDungeonBest`).

**O Bits por inimigo também é × `DUNGEON_BITS_FACTOR`** (0,4, `src/utils/dungeon.ts`, desde 30/09/2026): `points = max(1, round(base.points × ptsMult × DUNGEON_BITS_FACTOR))` em `buildDungeonWave` (⚰️ o piso era 2 e não havia fator). Uma run completa paga entre 60% e 120% do teto `MINIGAME_BITS_PER_DAY` (régua: `balanco.test.ts`, `masmorraRunCompleta`; a decisão do dono estimou 130–170 Bits; ⚰️ antes do fator: 327 no nível 1 rookie e 417 no nível 5 mega, medidos em `docs/BALANCO-MINIJOGOS.md`, e enchia o teto no 2º/3º andar). É UM número aplicado nos DOIS lugares que pagam e no custo de começar mais fundo. Decisão: `REGISTRO-DE-DECISOES.md` §5.6 ("Masmorra paga ×0,4"); a Arena (50 Bits por run completa) foi medida e ficou como está.

**O sumidouro recorrente de Bits (WP4.5).** `DEEP_START_BASE_COST` = `round(40 × DUNGEON_BITS_FACTOR)` = 16 (⚰️ era 40),
`deepStartCost(n) = DEEP_START_BASE_COST × n` (16/nível), teto `DEEP_START_MAX_LEVEL` = 5, decisão em
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
(`SPIRIT_BG_SCENES`) + **5** clássicas pintadas (`DUNGEON_SCENES`; ⚰️ até 30/09/2026 eram gradientes em CSS — Retro Pet, Fita VHS, Sol Neon, Terminal CRT e Vazio Glitch, hoje Jardim Flutuante, Terraço dos Dois Sóis, Observatório Partido, Lago-Espelho e Arquipélago Fraturado) + **16** cenários
da loja (`SHOP_BG_ACCENTS`, filtrados por existirem em `PET_BACKGROUNDS`).
Contagens medidas em 09/09/2026 com
`sed -n '/^const SPIRIT_BG_SCENES/,/^];/p' src/utils/dungeonScenes.ts | grep -c 'namePt:'`
e equivalentes.

⚰️ **Combate desde 02/10/2026 (REGISTRO §20.7).** Nem o golpe nem a esquiva são mais
ação do dono: o Soulmon golpeia SOZINHO (golpe-base = `TORCIDA_BASE_FRAC` 0,5 × `dmg`
do estágio), o dono **só torce** (toque em qualquer lugar → gauge de 8 → golpe
ESPECIAL de `TORCIDA_PVE_SPECIAL_MULT` = **3×** o golpe-base, `utils/torcida.ts`) e o
Soulmon **se defende sozinho** (`utils/autoDefesa.ts`: cada golpe sofrido sorteia uma
precisão 0,70 ± 0,25 pela semente da run; ≥ `perfeito` do jeito = defesa perfeita, sem
dano e com contra-ataque; abaixo disso o dano segue a fórmula de sempre
`max(1, ceil(atk × (1 − precisão)) − reducaoDano)`). Mostra "Defendeu!" / "Defendeu em
parte!" / "Levou o golpe!" e um escudo curto no pet — sem botão. A `TimingBar` e a
esquiva por timing ficam atrás de `TIMING_DODGE_ENABLED = false`. O Pesadelo é igual.
Os ofícios que mexiam na barra de desvio viraram bônus na defesa (`jeitoDefesaBonus`).

**Energia, anel e esquiva desde 04/10/2026 (REGISTRO §20.10).** Cada lutador tem UMA
barra de **energia** (0–100, `utils/energia.ts`; as constantes são do núcleo, `combate/specials.ts`): ganha
por golpe DADO, golpe SOFRIDO, tempo e por despejo da **barra de cheer** — o
medidor de toques do dono, que enche DEVAGAR (`CHEER_TAPS_FULL` = 24; o excedente fica)
e, na Masmorra, **persiste entre os inimigos e as camadas da run**. Energia cheia = o
ESPECIAL no golpe seguinte (o gauge de 8 toques que virava o especial saiu). O PvE tem
**mecânicas ativas**: (a) o especial do pet pede o **anel** que encolhe sobre o alvo
(1,5–2,1 s pela semente): toque na hora certa = ótimo ×1,35 (±120 ms), bom ×1
(±320 ms), ruim ×0,75 (cedo ou sem toque); (b) quando a energia do INIMIGO enche, ele solta
o especial dele (2× o golpe normal, sem bloqueio de graça) e o jogador pode **esquivar
deslizando o dedo** (ou pelas setas) com o projétil no ar — ótimo (últimos 500 ms) tira
85%, bom 50%, sem agir leva o dano cheio. A defesa automática segue como base dos golpes
normais. **A luta ficou mais longa:** vida do pet × `PVE_HP_SCALE` (1,8) e do inimigo ×
1,8 × `PVE_FOE_HP_EXTRA` (1,1), dano igual, `PVE_STEP_MS` = 1,7 s por lado — ~20–30 s
por inimigo. Calibração (20.000 lutas, `energia.test.ts`): inimigos derrotados por run
de quem joga as mecânicas ≈ os de antes (Masmorra rookie@1 2,19 → 2,24; champion@2 2,06 →
2,05; ultimate@3 2,00 → 2,01; mega@4 1,92 → 1,91), Pesadelo (top 2) 46,4% → 50,1%; quem
nunca age fica abaixo (Pesadelo 25,1%) e quem torce rende mais.
Medido em `autoDefesa.test.ts` (20.000 runs): sem torcer, a defesa automática dá a
MESMA duração e derrota por camada que a esquiva média (0,70); o 3× rende +0,3 a +1,2
inimigos derrotados por run a quem torce e não torna a run trivial. ⚠️ A curva base já é
dura: com defesa 0,70 a camada 1 não é limpa nem pelo estágio "certo" (pendência TORC-6).

**Dono.** `src/utils/dungeon.ts` (ondas, stats, base semanal, placar, drops,
deep start) · `src/utils/autoDefesa.ts` (a defesa automática) · `src/components/DungeonGame.tsx` (`MAX_FLOORS`, `clearBonus`, o laço da run) · `src/utils/dungeonScenes.ts` (as cenas) ·
`src/utils/sprites.ts` → `getDungeonEnemySprite` (arte e nome do inimigo).

**Régua.** `src/utils/dungeon.derrotaNaoCobra.test.ts` (o guard que lê o FONTE e
prova que nem o módulo nem o componente prometem um custo que não existe),
`src/utils/dungeon.deepStart.test.ts`, `src/utils/mente/balanco.test.ts` (o fator e a run completa perto do teto), `src/utils/sprites.dungeonRoster.test.ts`
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

**Onde a UI mostra.** `src/components/DungeonGame.tsx`, aberta pelo lote
Masmorra da área Exploração (`AreaView` → `MasmorraSheet`; único prédio da Exploração desde 30/09/2026, o anfitrião é Zeph, `areaNpcVoice`; ⚰️ antes, card da
`ActivitiesPage`). A `MasmorraSheet` (`src/components/play/PlaySheets.tsx`)
mostra a chance de coraçãozinho lendo `HEART_DROP_CHANCE` (exportado para isso)
em %, nunca um número escrito à mão.

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
coleção que mente sobre o próprio tamanho. Hoje são 9 linhas × 4 = **36** células (eram 6 × 4 = 24 até 15/09/2026, quando Igni/Nautil/Astria entraram — `c11dc49d`).

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
Torneio continua inteiro disponível. `tournamentWindowLabel` fala o mínimo (02/10/2026): "Dias restantes: N" na rodada,
"Próxima rodada: N dias" fora — e nada fecha, o menu do Torneio segue inteiro.

### As faixas

`src/utils/tournamentTiers.ts` → `TOURNAMENT_TIERS`, seis degraus por pontos
LIFETIME mínimos — as faixas CLÁSSICAS (04/10/2026, rodada 7 / A1; antes Semente→Lendário):
Madeira/Wood (0) · Bronze (100) · Prata/Silver (300) · Ouro/Gold (700) ·
Platina/Platinum (1100) · Diamante/Diamond (1500). Sem emoji:
o símbolo de cada faixa é um glifo do inventário (`TIER_ICON` no `TournamentPage`).
`getTierStanding(points, place?)` devolve a faixa, a próxima,
`pointsToNext`, `progress` (0–1, e 1 na última), `seat` e `place`.

**Mestre e Grão-Mestre são LUGARES, não faixas de pontos** (R8, decisão do dono 04/10/2026;
REGISTRO §23): `TOURNAMENT_SEATS` — **Mestre/Master = top 100** e **Grão-Mestre/Grandmaster =
top 20** do ranking da SEASON, só para quem já tem lifetime ≥ 1500 (`SEAT_MIN_LIFETIME`, a
faixa Diamante). O ícone dos dois mostra "#N" (a posição; no Grão-Mestre o #N é o nível). A
posição vem do servidor (`action=rank&id=` → `myPlace`, só para o dono autorizado); servidor
antigo cai na lista pública (top 50). O lugar é VIVO: quem sai do top volta à faixa que os pontos
lifetime dão (nunca abaixo dela) — as seis faixas de pontos continuam só subindo. ⚰️ Até a R8,
Mestre era um 7º degrau de pontos (2200).

**A faixa lê `lifetime`, não `points`.** Os `points` da season descem por três
caminhos — derrota própria (−8), ser sorteado como oponente e perder (−4, **sem
sequer jogar**) e a virada de mês, que zera tudo. Uma faixa cuja regra escrita é
"acumular pontos nunca rebaixa" rebaixava por três motivos, um deles sem
participação nenhuma do jogador. `lifetimePoints` mora no PERFIL, não na linha da
season, e só soma em ganho (`+20` na vitória própria, `+10` para quem venceu
sendo oponente).

### A partida (o duelo fantasma)

`functions/api/community.js`, ações `duelStart` e `match`; a regra da luta mora em
`functions/api/_duel.js` (`simulateDuel`, `duelSide`, `maxLevelFor`), sobre o núcleo de
combate v3 espelhado em `functions/api/_combate.js` (travado por `combate.parity.test.js`).
O "Desafiar" abre o **duelo fantasma** (`src/components/DuelScreen.tsx`): os dois pets lutam
sozinhos, em tempo real (~38 s), e o dono **torce** tocando em QUALQUER lugar da tela; a
torcida só SOMA. ⚰️ A torcida por *timing* (anel que fecha sobre o alvo) está desativada
(código guardado, sem UI). ⚰️ Até o PR5 (06/10/2026) a luta era o motor próprio do duelo
(`duelStats` do PERFIL público, 26 golpes, `DUEL_SPECIAL_MULT`); hoje é o `fight()` do núcleo
(combate v3, `docs/squad-alpha-runs/combate-v3-01`, contexto §2.19).

```
ficha de cada lado = o SAVE (KV saveId), derivada no servidor: level = soulLevel(evolutionStage, perfectDays)
   LIMITADO pelo teto S1 (maxLevelFor: 1 + dias de servidor desde a 1ª gravação, metadata.f do KV; sem f vale o level 1 até a 1ª gravação escrever o f);
   stats = combatantAt(level, galho); família do especial = escola da skill especial da ficha (desconhecida = direct);
   bônus = os talentos e o equipamento DO SAVE, recalculados no servidor, no canal único de 5% (`combinedAttrBonus`; ⚰️ valia 0 até o PR7/PR8)
luta = fight(me, opp, { seed do servidor, hpScale: PVP_HP_SCALE (1,7), cheer: descargas da torcida }) — empate quando os dois caem no mesmo instante
torcida por BALDE de 3 s: o cliente manda os toques de cada balde (até 20 baldes, teto CHEER.tapsCapPerBucket = 16 por balde);
   24 toques aceitos = 1 descarga de CHEER.pvpEnergyPerDischarge (2,5) de energia no pet, que cai no FIM do balde; só soma
resultado = 'win' | 'loss' | 'draw'; placar = % de vida de cada lado no 1º nocaute
calibração (N = 600 por estágio): duração mediana 38,1–39,1 s · o mais fraco por 5% vence 31,4% · 1 Lv abaixo 17,3% · torcida no teto 64,3% (vs fantasma sem torcida)
```

O fluxo tem duas chamadas: **`duelStart`** lê o save dos DOIS lados (se algum faltar, `409 save unavailable` /
`404 opponent unavailable` e NADA é gasto), consome a partida do dia, sorteia a SEMENTE no servidor, *depois* do
compromisso, e **congela a ficha dos dois lados** em `myRank.pending.sides`; **`match`** luta com a semente e a ficha
GUARDADAS (nunca uma enviada nem relida do save: com a semente na mão, o cliente editaria o save entre as duas chamadas)
e os toques por balde higienizados (`sanitizeTaps`). O cliente anima a mesma luta com `simulatePvp`
(`src/utils/combate/duel.ts`), mas quem decide é o servidor. A semente nunca vai na lista de oponentes (`opponents`
leva só `duel: { level }`), senão um cliente editado simularia os três e escolheria o que vence.

**Empate.** Um resultado válido (§2.4): a partida conta como jogada (a cota já foi gasta), e NENHUM lado ganha ou perde
pontos, vitória, derrota, `lifetimePoints` nem Honra. A resposta leva `draw: true`; a tela diz "Empate", sem perdedor.

**Desistência = derrota.** Sair do duelo antes do fim (× na tela, app fechado)
ou passar de `DUEL_PENDING_MS` (5 min) fecha o duelo como derrota
(`forfeitPending`, e `match` com `forfeit: true`): a cota já foi gasta na
abertura, então não existe perder de graça. A contabilidade é única em
`settleMatch` (vitória, derrota e desistência passam por ela).
`MATCHES_PER_DAY` = 5 (do servidor; estourar devolve `429 daily limit`).
Pontuação de season: `+20` / `−8` para quem jogou, `+10` / `−4` para o oponente,
sempre com piso em 0. **Rendimento decrescente (PR13, decisão do dono):** o GANHO
(nunca a perda) cai com a diferença de level (`functions/api/_honra.js`:
carência `HONRA_LEVEL_CARENCIA` = 3, zero ao fim de `HONRA_LEVEL_QUEDA` = 6 levels a mais) e com a
N-ésima vitória do dia sobre o MESMO oponente (`HONRA_FATOR_POR_REPETICAO` = 1, 0,5, 0,25, 0); vale também para quem defende
e vence. Duas contas próprias rendem no máximo 35 pontos/dia por par (eram 100). O `match` devolve `gain` e `honorFactor`, e o app aplica o fator à Honra de vitória.
**`duelStart` é atômico por conta (PR13):** duelo aberto e válido = outro `duelStart` devolve `409 duel open` (outro oponente) ou o
MESMO duelo (mesmo oponente); fila por isolate (`withDuelLock`) — sem CAS no KV, a janela entre isolates só fecha com Durable Object. Save de oponente acima de
`DUEL_SAVE_MAX_CHARS` (1 milhão) não luta e nem é parseado. O ranking é o top **50** da season; `season` é
`YYYY-MM` (`currentSeason()`), e `closeSeason` dá troféu de 1º/2º/3º ao top 3 —
protegido por `SEASON_ADMIN_KEY` e **idempotente** por `closed:<season>`, porque
quem chama é um cron e cron repete.

A Honra do jogador vem do CLIENTE (`onEarnEmblems` com `EMBLEMS_PER_WIN` /
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

**Desde 04/10/2026 o Duelo da Arena usa a ENERGIA** (REGISTRO §20.10): o especial da ficha dispara com a
barra de energia do pet cheia (ataque dado + sofrido de cada inimigo vivo + cheer), no lugar da carga de
`SPECIAL_CHARGE_TURNS` turnos e do golpe de torcida ×1,35 (`ARENA_ENERGY_ENABLED`); cada inimigo tem a barra dele
e solta um golpe de 2×; o anel e a esquiva valem como no resto do PvE; vida × `ARENA_HP_SCALE` (1,9) e inimigo
× 0,9 extra — ~24 s por inimigo. Medido em `energia.test.ts` (6 escolas × 3.000 runs): antes (pet sozinho, sem
torcer) 59,2% de vitória média; depois, jogando as mecânicas sem torcer 59,4% (faixa 49,5–73,9%); nunca agindo 34,6%;
11 toques/turno 81,6%; bom jogador + 11 toques 90,3%. O texto abaixo descreve o caminho antigo, que fica atrás da flag.

⚰️ **Desde 02/10/2026 (H14) o Duelo da Arena tem TORCIDA por toques** (REGISTRO §20.6):
o pet golpeia SOZINHO (`ARENA_AUTO_ACC` = 0,73, o golpe chega ~2,4 s após abrir o turno — era 1,5 s), tocar em
qualquer lugar enche o gauge de `TORCIDA_TAPS_FULL` (16, era 8 — REGISTRO §20.9) e o gauge cheio vira um golpe
de torcida ×`ARENA_TORCIDA_MULT` (1,35) por cima do golpe do turno (`arenaTorcidaTurn`);
sem toque o golpe é o base, o gauge zera ao gastar, excedente não rende. A esquiva
também saiu (TORC-3): o pet se defende sozinho (`autoDefense`, mesma lei 0,70 ± 0,25 da
`sampleAcc` da simulação); a barra de ataque ficou atrás de `ARENA_TIMING_ATTACK_ENABLED = false`
e a de defesa atrás de `TIMING_DODGE_ENABLED = false`.
Medido em `arena.test.ts` (`simulateArenaRun({ autoAttack, tapsPerTurn })`): base 57,2% de
vitória média, pet sozinho 59,0%, 2 toques/turno 75,4%, 4 toques/turno 81,9%, gauge cheio
a cada golpe 92,3%.

⚠️ **A ordem de turno do componente é a MESMA de `simulateArenaRun`, passo a
passo**, e isso não é preferência: os números dos especiais foram calibrados por
simulação de 300+ runs por arquétipo (taxa de vitória 40–80%, dispersão ≤ 20 pp).
Trocar a ordem invalida o balanceamento inteiro sem nada ficar vermelho.

**Dono.** `src/utils/tournamentSeason.ts` (a janela) ·
`src/utils/tournamentTiers.ts` (as faixas) · `functions/api/community.js` (a
partida, o rank, a season, os troféus) · `functions/api/_duel.js` (a luta) · `src/utils/community.ts` (o cliente) ·
`src/utils/arena.ts` (o motor da Arena) · `src/components/ArenaGame.tsx` (a tela).

**Régua.** `src/utils/tournamentSeason.test.ts`,
`src/utils/tournamentTiers.test.ts` ("a faixa nunca desce por causa do que os
outros fizeram"), `src/utils/arena.test.ts` (a simulação de balanceamento — a
autoridade sobre os coeficientes), `src/components/ArenaGame.render.test.tsx` (caminho antigo, barra de ataque),
`src/components/ArenaGame.torcida.render.test.tsx` (pet sozinho + torcida),
`functions/api/community.test.js`, `functions/api/community.pvpGate.test.js`,
`functions/api/community.duelo.test.js` (desistência = derrota, semente só no servidor),
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
- **Cliente antigo** (sem `duelStart`): `match` abre e fecha numa chamada só, com semente sorteada no servidor; `forfeit` sem duelo aberto devolve `409 no open duel`.
- **Torcida forjada** rende o mesmo que o teto (`DUEL_TAPS_CAP` = 16 toques por balde de 3 s × 20 baldes; a barra de cheer de 24 despeja no máximo 13 vezes na luta toda) — toque ilimitado, ou baldes a mais, não rendem mais (`_duel.v3.test.js`, `community.duel.v3.test.js`); aceitável enquanto a Honra for só cosmética (STATUS 30/09 e 02/10/2026).
- **Nada do cliente decide o resultado (PR5).** Level, stats, família do especial, semente e resultado são do servidor; o teto S1 (1 level por dia de servidor desde a 1ª gravação, `metadata.f`, só no duelo) LIMITA um save forjado (level 40 no dia 3 luta com level 4) sem rejeitá-lo. Limite honesto: a família do especial e a forma do golpe vêm do save (escrito pelo cliente), dentro de uma lista fechada de 7 famílias calibradas em ±5% na régua.
- **Oponente com PvP desligado** devolve `404 opponent unavailable` — o saveId
  dele nunca sai do servidor (o cliente conhece só o pid público).
- **Opt-out da lista pública (TORC-5, 02/10/2026).** `publicHidden` no perfil
  (cliente: `hideFromPublicList`, Configurações → Seus dados, ligado por padrão).
  A régua é `isHidden` em `community.js`: escondido sai de `players` (antes do
  `search`), `player` (`found:false`), `opponents`, `rank`/`seasonResult`,
  `friends` (adicionar → `404 friend not found`), do `friends[]` que terceiros
  leem e do `from` do presente; duelar contra ele → `404 opponent unavailable`.
  Ele segue jogando e vê o próprio lugar (`rank&id=` autorizado → `me`; essa
  resposta nunca vai para o cache de borda). O perfil sempre sobe com
  `publicHidden` (também `false`) e cliente antigo sem o campo herda o gravado.
  A Guilda (coop) é círculo por convite e não é afetada. Travado por
  `community.publicOptOut.test.js` e `privacidade.listaPublica.contract.test.ts`.
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
nada — e não deixa desistir sem perder. A Arena **não cobra coração nem tem porta de entrada paga**.

**Onde a UI mostra.** `src/components/TournamentPage.tsx` (faixa → ranking →
oponentes → troféus; sem toggle de PvP desde 02/10/2026 — abaixo do Vínculo 5 a aba explica o requisito), `src/components/DuelScreen.tsx` (o duelo fantasma), `src/components/ArenaGame.tsx` (aberta
pelo lote Duelo da área Arena — `DueloSheet`; ⚰️ antes, da `ActivitiesPage`).

---

<a id="minijogos"></a>
## 54. 🎮 Minijogos: PPT, Corrida com obstáculos e os três prédios de Jogos

**Em uma frase.** Dois jogos curtos que pagam Bits e não tocam em mais nada do
jogo — exceto o recorde da Corrida com obstáculos (`dinoBest`), que alimenta uma missão permanente.

**A regra.**

| Jogo | Regra | Pagamento |
|---|---|---|
| ✊ PPT (`src/components/RPSGame.tsx`) | pedra-papel-tesoura contra o pet; primeiro a 3 rodadas leva a partida | `MATCH_POINTS` = **5 Bits por vitória de partida** — plano e modesto, porque o jogo é de sorte |
| 🏃 Corrida com obstáculos (EN *Obstacle Run*; ⚰️ até 30/09/2026 "Corrida do Dino" / "Dino Runner"; `src/components/DinoGame.tsx`) | corrida lateral; o score cresce `dt × 10` e os obstáculos endurecem com o tempo — ossos e cristais de fogo frio, 4 faixas de tamanho (`OBSTACLE_TIERS`, entram aos 0/20/45/75 s) com 3 variantes cada, sorteadas no spawn, cada uma com a própria caixa de colisão medida | `floor(score / 100)` Bits por run |

A Corrida com obstáculos também chama `onScore(score)` → `handleDinoScore` no `src/App.tsx`, que
grava `dinoBest` no `GameState` **só quando o score supera o anterior**. É esse
campo que alimenta `mission-dino-1000` ([§49](#missoes)).

**Dono.** `src/components/RPSGame.tsx` (`MATCH_POINTS`) ·
`src/components/DinoGame.tsx` (o laço e a conversão score→Bits) · `src/App.tsx`
→ `handleDinoScore` (o recorde).

**Régua.** `régua: nenhuma` para a fórmula do PPT e da Corrida com obstáculos — não há teste próprio de `RPSGame` nem de
`DinoGame`. O que é coberto é a ponta de fora: `src/utils/missions.test.ts`
(o alvo de `dinoBest`), `src/utils/currencies.test.ts` (a moeda) e, desde 30/09/2026,
`src/utils/mente/balanco.test.ts` (Bits/min da Corrida com obstáculos e do PPT dentro da faixa, ver abaixo). ⚠️ O laço de
jogo e a fórmula de pagamento **não têm régua executável** — item para o
[`STATUS.md`](../STATUS.md).

**Decisão.** [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.6 —
os minijogos são fonte de Bits e nada mais; a moeda nunca compra progresso.

**Casos de borda.**
- **Score abaixo de 100 na Corrida com obstáculos** rende `pts === 0`, e nesse caso o som de
  conclusão **não toca** (corte C-6 do run `som-01`): celebrar um resultado que
  não pagou nada é celebrar nada.
- **Vencer não soa como tarefa concluída** (corte **C-11**, decisão do dono, 30/09/2026): a Corrida com obstáculos e o PPT perderam o `playTaskComplete` — pela R-CAT a categoria vem do EVENTO, e vencer minijogo não é concluir tarefa. Ficam mudos até existir a categoria `arcade` (em aberto). Régua: `src/utils/cortes.contract.test.ts`.
- **`dinoBest` reconciliado com o `localStorage`** (`STORAGE_KEYS.DINO_BEST`) na
  leitura, com `Math.max` — save de nuvem e recorde local não se anulam.

**O que NÃO faz.** Nenhum dos dois toca HP, energia, atributo, `perfectDays` ou
evolução. Nenhum dos dois tem limite diário. Nenhum dos dois dropa item.

**Onde a UI mostra.** os lotes das áreas Exploração e Jogos (`src/components/play/PlaySheets.tsx`,
minimal-ui F5; ⚰️ antes, os cards da `ActivitiesPage`) e as telas próprias de cada jogo.
Os lotes vêm de `src/utils/playAreaLots.ts`. ⚰️ Até 30/09/2026 a Exploração tinha
Masmorra + Corrida (então "do Dino") e Jogos tinha só o PPT. **Desde 30/09/2026 (decisão do
dono, `REGISTRO-DE-DECISOES.md` §5.6)** Jogos tem **três prédios** e a Exploração tem
**dois lotes**: a **Masmorra** e, desde `3532ccf5`, o **Passeio** (`passeio`, EN "Stroll" —
[§43](#aventura); ⚰️ entre os dois merges do mesmo dia a Masmorra foi o lote único):

| Prédio (lote) | Jogos | Paga |
|---|---|---|
| **Salão de Jogos** (`salao`) | Corrida com obstáculos + PPT — as regras acima, intactas | como acima |
| **Ateliê da Mente** (`mente`) | Eco do Pet (`utils/mente/eco.ts`), Bolhas do Sonho no modo foco (`utils/mente/bolhas.ts`), Troca de Regra (`utils/mente/troca.ts`), Nonograma da Malha (`utils/mente/picross.ts`, um desenho do dia por `todayKey`) e Revisão da Malha (`utils/mente/revisao.ts`, cartões do jogador em Leitner, no save como `GameState.review`) | Bits pelo MESMO funil `handleEarnGamePoints` (teto `MINIGAME_BITS_PER_DAY`); os tetos por rodada são constantes dos donos (`ECO_MAX_BITS` 10, `BOLHAS_MAX_BITS` 8, `TROCA_MAX_BITS` 6, Picross por tamanho `PICROSS_BITS_BY_SIZE` 3/6/12 + `PICROSS_DAILY_BONUS` 5 uma vez por dia, `REVIEW_SESSION_BITS` 5); a faixa de Bits/minuto é travada por `src/utils/mente/balanco.test.ts` ([`BALANCO-MINIJOGOS.md`](../BALANCO-MINIJOGOS.md)) |
| **Refúgio** (`refugio`) | Respirar com o Soulmon (`utils/refugio/respiracao.ts`) e Bolhas calmas (Bolhas no modo `calma`) | **nada** — não paga, não pontua, não mede; mostra o aviso de ajuda profissional |

**O balanço (30/09/2026, `BALANCO-MINIJOGOS.md`).** Nenhum jogo leve deve ser
escolhido pelo que paga: a régua `balanco.test.ts` trava o jogador **típico** entre
2,5 e 9 Bits/min em todo jogo leve, o **experiente** em ≤ 13, e todo "até N Bits"
alcançável. Ajustes: Bolhas 1 Bit a cada `BOLHAS_POINTS_PER_BIT` (6) sonhos, teto
`BOLHAS_MAX_BITS` 8 (⚰️ era 1 a cada 10, teto 10); Troca teto
`TROCA_MAX_BITS` = `TROCA_DECK_SIZE` ÷ `TROCA_CORRECT_PER_BIT` = 6 (⚰️ anunciava 10,
inalcançável); Nonograma por tamanho 3/6/12 + `PICROSS_DAILY_BONUS`, e o bônus do dia
**não repaga ao reabrir** (uma vez por dia do jogador, no APARELHO — `STORAGE_KEYS.PICROSS_DAILY_PAID`).
Os perfis do balanço são suposições declaradas, não medição.

**O que o Ateliê NÃO rende (decisão do dono, 30/09/2026).** Nenhum jogo do Ateliê
dá Vínculo (XP) nem conta para missão; a Revisão da Malha **não** conta como
atividade do dia; ⚰️ "a Exploração fica só com a Masmorra" foi revertido em parte no
mesmo dia: o dono aprovou o Passeio fundido à Aventura e as Travessias
(`REGISTRO-DE-DECISOES.md` §5.6), implementados em `3532ccf5` — `EXPLORACAO_LOTS` em
`playAreaLots.ts` tem `masmorra` e `passeio` ([§43](#aventura)). Cada folha de prédio
mostra "Bits de minijogo hoje: X de `MINIGAME_BITS_PER_DAY`" (150; `BitsHoje`, `PlaySheets.tsx`), em texto
neutro, sem barra nem cor de alerta — o teto é compartilhado e sem a linha o "até
N Bits" vira promessa falsa depois dele.

**O Refúgio e o apoio.** O Refúgio não paga, não pontua e não mede; mostra o aviso de
ajuda profissional. Os números moram num dono só, `src/utils/supportLine.ts`
(`helplineNumbers`, `HELPLINE_DIRECTORY_URL` = findahelpline.com, `HELPLINE_TEL_BR`
= `tel:188`, `notProfessionalHelp`): BR CVV 188; EUA/Canadá 988; Reino Unido/Irlanda
116 123. Nenhum número sai de modelo de IA, e o `ChatBox` lê do mesmo dono (a frase
de crise do chat, `crisisLineText` em `chatSafety.ts`, é outra coisa). A respiração
usa `BREATH_PATTERNS` (`calma` 4/6, `quadrada` 4/4/4/4) e `BREATH_DURATIONS_MIN`
(1, 2, 3 min), com a sessão arredondada para cima até um ciclo inteiro
(`sessionMs`). O convite que leva a ele é regra do [§12](#humor).

**Anfitriões.** Tessela, a enigmista (Ateliê) e Bobbi, o soprador de bolhas
(Refúgio), em `src/utils/areaNpcVoice.ts` (nomes decididos pelo dono em 30/09/2026;
a fala do Ateliê descreve o que os jogos pedem e nunca promete efeito). Jogos novos
nascem **mudos** (R-NOVA) e o Refúgio travado mudo (corte C-10).

O dia da Revisão e do Picross é o dia do JOGADOR em ISO (`playerDayIso`,
`utils/playerDay.ts`, [§5](#dia-do-jogador)), a mesma âncora de `playerDayKey`. Nenhuma copy dos prédios
promete efeito cognitivo (`docs/BENCHMARK-MINIJOGOS.md` §1.2); a régua é
`src/components/play/playArea.render.test.tsx`.

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
3. ⚰️ Até o PR7 do combate v3 (06/10/2026) valia "recompensas 100% cosméticas, nunca
   vantagem de combate". **Reescrito** (REGISTRO §24 item 1): o catálogo `BOND_REWARDS`
   segue cosmético (decoração/cenário, sonhos do `DREAM_CATALOG`, títulos), mas o Vínculo
   é o level do usuário e dá 1 ponto de talento por Vínculo ([§55-B](#combate-v3)). A única
   vantagem de combate é o talento, sob o teto único de 5%; nenhum caminho pago alcança
   talento, ponto ou portão. Nunca moeda, HP, energia ou `perfectDays`.
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

✅ **OS 11 EVENTOS DA TABELA TÊM EMISSOR** (decisão do dono **#59b**,
22/09/2026). ⚰️ A tabela descrevia 11 `BondEvent` e a simulação da QA Rodada 2
(`07` §2.4) mediu **7 dos 11 mudos**: `bond.wiring.test.ts` testava a função
pura com todos os `kind`s, e `grep -rn "kind: 'dungeonFloor'" src` não achava
chamador nenhum. `XP_PERFECT_DAY` foi ligado em `592e2c14` (é o único que mora
na virada); os **seis do `App.tsx`** foram ligados em `cf6315e1`:

| `kind` | Onde é emitido | A régua que impede pagar duas vezes |
|---|---|---|
| `habitMilestone` | `withHabitCompletion`, via `milestoneReached(before, after)` — a MESMA detecção da cerimônia, e os dias vêm de `HABIT_MILESTONES` | `completeHabit` é idempotente por `dayKey` |
| `dungeonFloor` | `handleDungeonFloorCleared`, ligado por `onFloorCleared` (`App.tsx` → `AreaView` → `DungeonGame`; ⚰️ passava pela `ActivitiesPage` até a F5) | `BOND_DAILY_CAP.dungeon` |
| `triageCleared` | `App.tsx`, ao ESVAZIAR a fila de triagem — a fila é recontada sobre o estado já aplicado | só paga na transição "tinha → vazia"; pagar por carta seria recompensa por CONTAGEM (linha vermelha #16) |
| `restNight` | ao registrar a noite, **só dentro da Janela de Descanso** — a mesma régua da missão `rest-nights` | `rest.nights.some(n => n.date === chaveDaNoite)`: `recordNight` é idempotente por manhã, `awardBondXP` não é |
| `dreamNew` | ao coletar um sonho **inédito** (`isNew`) — mesma régua da missão `dream-new` | repetir sonho que já está no dex não acrescenta ao acervo, e não paga |
| `nightmareCleared` | no MESMO updater que grava `markFought` (footgun 6) | — |

O `dungeonFloor` é emitido **antes** do `if (floor >= MAX_FLOORS)` de propósito:
o 5º andar é um andar limpo **e** uma run completa, e a tabela paga os dois — o
teto diário de `bond.ts` é quem limita. `perfectDay` não tem teto em
`BOND_DAILY_CAP`; `totalXP` nunca desce. Régua:
`src/utils/bond.diaCompleto.test.ts`, `src/utils/bond.wiring.test.ts`.

⚠️ **Aberto por decisão: a COMIDA continua FORA da tabela.** A resposta #55/#59b
do dono diz "a tabela do §55 passa a incluir a comida", e isso **não foi
implementado**: não existe `kind` de alimentar em `BondEvent` (a união tem 11
membros, `grep` em `src/utils/bond.ts`) e nenhum caminho de `feedPet` chama
`awardBondXP`. Registrado como aberto no bloco de 22/09/2026 do
[`STATUS.md`](../STATUS.md). Acrescentar um evento novo é a única mudança aqui
que precisa passar pela regra de desenho acima — **a trilha não pode pedir ação
nova**; alimentar já existe no jogo, então ela cabe, mas é decisão de quem for
implementar, não deste doc.

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
escada de gates sociais é grind com outro nome. ⚰️ **Revogado em 06/10/2026** (REGISTRO §24 item 2): os portões agora são UMA tabela (`src/utils/gates.ts`, [§55-B](#combate-v3)), todos sobre este mesmo nível.

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

<a id="combate-v3"></a>
## 55-B. ⚔️ Combate v3: level, talentos, equipamento e o teto de 5%

**Em uma frase.** O Soulmon tem um level (`Lv N`) que vem dos dias completos e da evolução, a pessoa tem um level (`Vínculo N`) que vira pontos de talento, e tudo o que dá vantagem em luta passa por UM teto de 5%.

**A regra.** O motor é o núcleo puro `src/utils/combate/` (curva, level, golpe normalizado, sorte, especiais, régua pareada), espelhado no servidor em `functions/api/_combate.js`, `_gates.js`, `_talents.js` e `_equipment.js`, cada um travado por um teste `*.parity.test.js`.

- **Golpe normalizado.** Cada ataque vale ~1/10 do espelho em qualquer level (`HIT_UNIT_H0` = 10), com sorte AR(1) de ρ = 0,9 e σ = 8% (`VARIANCE`). A luta, o Soulmon e o adversário usam o mesmo motor na Arena, na Masmorra, no Pesadelo e no Duelo.
- **Level do Soulmon.** HP sobe sozinho com o level; os pontos de distribuição vão só para ATK/DEF/SPD, conduzidos pelo galho dominante. Na degeneração o level desce, com texto neutro (`copy.semFomo`). Os chips dão só pontos de tipo (Poder/Harmonia/Benevolência) e afetam apenas a evolução (§47).
- **Vínculo = level do usuário.** Fonte única: `bondLevelFor(totalXP)` (nunca persistido). Pontos de talento = Vínculo, até `TALENT_POINTS_MAX` (20). Persiste só `talentPicks: string[]` (um id por grau; vetor inválido é descartado inteiro no `save.js`). Respec sempre pago em Bits ganhos (`RESPEC_COST_PER_POINT`).
- **Portões** (`GATES`, `src/utils/gates.ts`): Arena/PvP e Torneio no Vínculo 5, andares altos da Masmorra (a partir do andar 4) no 8, Renascimento no 12 (somado à conta paga). O dinheiro nunca compra Vínculo. Valores são defaults da squad, o dono os confirma.
- **Teto único de 5%** (`COMBAT_BONUS_CAP`): talento e equipamento entram como bônus em ATK/DEF/SPD pelo `combinedAttrBonus`; a SOMA dos canais nunca passa de 5% (acima disso os três escalam juntos). Vale também no PvP (decisão consciente do dono, REGISTRO §24 item 3); o servidor recalcula tudo do save.
- **Equipamento** (`src/utils/equipment.ts`): 3 slots (Núcleo=ATK, Carapaça=DEF, Rastro=SPD) × 3 tiers (`TIER_PCT` 0,5/1/1,5%), por loja direta em Bits GANHOS (`TIER_BITS`) ou fragmentos (`TIER_FRAGMENTS`; `FRAGMENTS_PER_RUN` = 5 pela run completa da Masmorra). Sem sorteio, sem caixa. Percentual, nunca ponto plano.
- **Equipamento na Masmorra (PR12a, §2.28 B).** A Masmorra usa o canal por atributo (`dungeonAttrBonus` em `equipment.ts`, hook `useDungeonBonus`): Núcleo = dano dado, Carapaça = o inimigo precisa de mais golpes (dano recebido menor), Rastro = o golpe sai mais cedo; o talento de PvE soma no ATK. É o MESMO teto único de 5% na soma dos três canais. Arena e Pesadelo seguem no canal escalar. Medido (`dungeon.equipamento.test.ts`): razão das médias 4,0% (cheio) e 4,9% (cheio + talento); só DEF 1,4%, só SPD 1,5%. A parede do andar 5 sobe com equipamento (37% sem, 71% cheio com talento; o escalar antigo já dava ~68%) e a habilidade ao concluir vai de 30,2pp para 32,4pp: reportado ao dono, não recalibrado.
- **Comércio ligado no PR12b (§2.28 C).** Só preço e ganho de moeda, nunca % de combate, dentro do +25%: `tal-com-04` Bolsa com alça = **mochila** (peças guardadas fora dos slots; `BACKPACK_BASE` 3, +1 por grau, máx. 6; a peça que cai num slot vazio não ocupa mochila; cheia, a compra e o "tirar do slot" que iriam para ela são recusados e save antigo acima da capacidade não perde nada; `backpackCapacity`); `tal-com-06` Pergaminho = **+5% por grau (até +15%) nos Bits do dia completo** (`missionBitsGain`, aplicado em `computeDailyReset` sobre os `BITS_PER_COMPLETE_DAY` que o dia já pagava: sem fonte nova, e entra no ganho grátis do dia); `tal-com-07` Moeda coroada = **desconto semanal de 20% em Bits em UMA peça** (`weeklyDiscountItem`: a ordem anda de 4 em 4 pelo catálogo a partir da semana ISO do dia do jogador, determinística, sem sorteio e sem relógio do aparelho; soma com a Etiqueta e o total nunca passa de 60%; rótulo calmo na tela, sem contagem). Nenhum campo novo no save (contagem inalterada); o servidor só aceita os ids novos em `talentPicks` (`_talents.js`, paridade travada) e a mochila é regra de cliente, como o resto da procedência dos Bits.
- **Procedência dos Bits** (`src/utils/bitsOrigin.ts`): `gamePoints` segue um número só; `bitsOrigin` guarda quanto veio de Crédito e o câmbio do dia. O equipamento só enxerga `saldo − paidLeft`. O câmbio Créditos→Bits cabe em `CREDIT_BITS_CAP_RATIO` (25%) do ganho grátis do dia; os pacotes (PR12a) são 1/2/4 Créditos = 10/20/40 Bits: o dia típico (100 do dia completo + metade do teto de minijogo = 175 grátis) comporta 43 Bits, o dia só de cuidado (piso 100) comporta 25. É regra de cliente (save local-first); o servidor garante a forma e o teto de 5%.
- **Torcida** só na Arena e no Duelo: `CHEER.energyPerDischarge` = 9 na Arena (o maior valor com a torcida sozinha ≤ 25pp de vitória) e `CHEER.pvpEnergyPerDischarge` = 2,5 no Duelo. Masmorra e Pesadelo não têm torcida. Anel e esquiva ficam fora da régua (±25%); `ROLE_SHAPE` também.
- **Sorteio do inimigo da Arena** é estratificado por elemento (`pickEnemyCreature`): primeiro o elemento, com chance igual entre os que o pool tem, depois uma criatura dentro dele. Sem isso, o corpus de 7.386 criaturas (vida em 18%) tirava ~9pp de vitória de quem usa vida/terra/gravidade.
- **Duelo.** `_duel.js` lê o save dos DOIS lados; o teto S1 limita o level a 1 por dia de servidor desde a 1ª gravação (`metadata.f` do KV), só no duelo. Empate é resultado válido, sem pontos. O especial do oponente é nomeado no aparelho, por regra, a partir do ID exato que o servidor publica (sem IA, sem texto do save).
- **Evocação** deixou de ser escola de skill (PR9b): segue só como pontos da ficha, pelo companheiro capturável.

- **A ficha reage ao comportamento (PR14/PR15, 06–07/10/2026).** O que o jogador fez no estágio que TERMINA (a janela `attributesSinceLastEvolution`) é gravado UMA vez, na evolução manual, em `fichaJornada` (`utils/fichaJornada.ts`; só champion/ultimate/mega/ultra têm anterior) e é IMUTÁVEL: degenerar e reevoluir ao mesmo estágio reusa o gravado (anti-reroll). O comportamento pesa 35% na DIREÇÃO do orçamento de elementos do estágio seguinte (`evoluirFicha`, `GALHO_PARA_ELEMENTO`); o orçamento da ficha não muda; plano nulo abaixo de `MIN_AMOSTRA` e sem estágio anterior. A **família do especial é estável** (`familiasDaJornada`): só é sorteada de novo com mudança forte de perfil (elemento ou galho dominante, com margem e deslocamento) — medido: 0/800 trocas no pipeline real; ~15% agregada na simulação de políticas de jogo; o NOME do especial segue novo a cada estágio. Save sem o campo: nada muda até a próxima evolução. O servidor (`_fichaJornada.js`, PR15c) sanea o registro, recalcula `plano`/`familia` a partir de `galhos` e o duelo lê a família gravada.
- **Nome do golpe básico e vantagem do par (PR17, 07/10/2026).** O NOME do básico segue o elemento dominante (base OU par); o `elementoId` que a Arena lê para a VANTAGEM é sempre uma BASE — a própria, ou a base dominante do par (`baseDominanteDoElemento`, maior peso na ficha; empate = o primeiro da receita). Sem multiplicador novo: continua ±1 golpe pela tabela de 17 bases; o servidor não deriva nome nem vantagem. Saves existentes só usam a regra na PRÓXIMA evolução. REGISTRO §24.7.
- **Selos reais e Maldição (PR16, decisão do dono).** Os turnos dos selos (reforço, debuff, DoT, escudo) vêm dos CONTADORES REAIS do núcleo (`FightFxPair` por evento, opt-in e read-only: não muda sorteio nem evento, que seguem idênticos ao espelho do servidor); só a cura segue na aproximação. O debuff de defesa da escola `maldicao` mostra o selo/glifo/rótulo de MALDIÇÃO — é só apresentação: a mecânica continua a família `defDebuff` (maldição como mecânica própria não existe). A dificuldade da semana da Masmorra se lê "Camada N"/"Layer N" (⚰️ "Nível N"/"Level N").
- **Torcida só ícone, cena do especial e sons (PR18, 06/10/2026).** A barra de cheer saiu da tela de combate: fica o ícone do mascote no canto e o que ele encheu aparece na barra de energia do pet (só UI; `CHEER` intacto). O especial tem uma pausa de apresentação de 1000 ms (`SPECIAL_INTRO_MS`) antes do golpe, sem tocar o motor. Três sons novos, categoria `arcade` (`playAttack`, `playSpecial`, `playVictory`; manual 04 §9.1).
- **Árvore de talentos com pré-requisitos e os oito nós ativos (07/10/2026, Tarefa B + decisão do dono).** `requires` (todos) e `requiresAny` (algum) no grafo de `talents.ts`, espelho `_talents.js`, desenho em `talentLayout.ts` (hub, três caminhos, bifurcação e reencontro). Quem só viola pré-requisito é PODADO (os graus compráveis ficam, os pontos dos outros voltam sem cobrar respec); vetor malformado segue descartado inteiro. Os oito nós que estavam "em breve" têm efeito (PvP 04 energia de largada, 06 resistência a dano contínuo, 07 Coroa; PvE 03 cura, 04 Bits da fenda, 05 Pesadelo, 06 Arco, 07 escudo de largada): o que é % de combate passa pelo teto único de 5%, o resto tem teto próprio pequeno e medido; **talentos não modificam o especial**, sem RNG, nada pago alcança talento. REGISTRO §24.4.
- **Prédios por Vínculo (07/10/2026, Tarefa A).** Cada prédio do Mapa abre num Vínculo mínimo (`BUILDING_GATES` em `gates.ts`, espelho `_gates.js`); o Laboratório virou três lotes: Centro de Evolução, Arquivo e Santuário do Vínculo (03-FLUXO §4.8 e o fim do doc).

**Régua** (medida em 06/10/2026 sobre a `main` com o #232; `npx vitest run src/utils/arena.v3.test.ts src/utils/dungeon.v3.test.ts`, N = 3200): Arena, duração mediana R1–R5 de 19,7 a 27,6 s; vitória por build 64,0–68,6% (spread 4,6pp); 14 células família × área 60,3–72,3% (12,1pp); habilidade `nenhuma` 48,4% × `boa` 72,0% (23,6pp); torcida sozinha no teto +24,8pp (`nenhuma`) e +17,9pp (`boa`). Masmorra: andares limpos 83,5–89,6% (6,1pp). Detalhe e alternativas descartadas: REGISTRO §24.6.

**O que NÃO faz.** Nenhum caminho pago dá talento, ponto, portão ou equipamento; não há sorteio pago; a torcida não vale Crédito; nada disto cobra o jogador (`copy.semFomo`).

**Dono.** `src/utils/combate/` (motor), `src/utils/talents.ts`, `src/utils/equipment.ts`, `src/utils/bitsOrigin.ts`, `src/utils/gates.ts`, `src/utils/arena.ts`, `functions/api/_combate.js`, `_duel.js`, `_talents.js`, `_equipment.js`, `_gates.js`. **Onde a UI mostra:** StatsPage (talentos, `EquipmentCard`, "Vínculo N"), Arena, Duelo, aba de Créditos.

---

<a id="comunidade"></a>
## 56. 🤝 Comunidade e cooperativo

**Em uma frase.** Um diretório onde a pessoa só entra se escolher entrar, com
verbos de DAR e nenhum de comparar — e o cooperativo, que desde 29/09/2026 é a
**Guilda** (roda de até 12, [§56-A](#guilda)): nada nela se ordena entre pessoas.

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

**Entrar na lista pública é automático e sair é um interruptor** (⚰️ até
02/10/2026 era o toggle de PvP, um ato explícito — H13 o tirou, TORC-5 trouxe a
saída de volta): ao cruzar o Vínculo 5 o apelido e o pet aparecem na lista
pública do Torneio, e Configurações → Seus dados tem "Aparecer na lista pública
do Torneio", ligado por padrão (`hideFromPublicList`). O consentimento de Termos/Privacidade é outro assunto e mora
em `src/utils/consent.ts` (`MIN_AGE_YEARS` = 18; `TERMS_VERSION` = **`'2026-09-30'`**
desde `bcfe7ca6` — os Termos §8 ganharam o parágrafo "Crossings are optional / As
Travessias são opcionais" (MIS-15, parecer de menores R-9) — e
`PRIVACY_VERSION` = **`'2026-09-22'`**; as duas foram `'2026-09-22'` desde `a6c1cd8a` — mudança MATERIAL: a
política passou a declarar os envios de texto ao Groq que o código já fazia
(`customKeywords`, humor, nome da tarefa em Decompor, `soulGoal` pré-preenchido
do tutorial) e nomeou Supabase/Whisper; ⚰️ `'2026-09-21'` valeu um dia;
`buildConsentRecord`) — guardar só um booleano
não diz A QUE texto a pessoa disse sim, e **save antigo sem o registro nunca é
bloqueado**. ⚰️ As duas constantes ficaram em `'2026-08-25'` enquanto a política
já tinha sido republicada em 08/09 — duas semanas de provas apontando para um
texto que não era o publicado (achado do QA geral de 21/09/2026). Régua:
`src/utils/consent.versoes.contract.test.ts` lê o "Última atualização"/"Last
updated" de `public/termos.html` e `public/privacidade.html` e reprova se
divergirem da constante. **Quando as versões sobem** (desde `42b07bec`, decisão
#24): quem já consentiu a uma versão ANTERIOR vê um **banner informativo** na
fila de avisos da Home (`TermsUpdateBanner`, último da fila — [03 §3.2](03-FLUXO-DE-TELAS.md)),
nunca um modal, **nunca re-aceite obrigatório** — barrar quem já joga por um
texto que mudou seria tirar o jogo de alguém por um problema nosso. A regra é a
função pura `precisaAvisarTermos` (`src/utils/termsNotice.ts`): save sem
registro de consentimento não vê banner (o onboarding é o lugar do primeiro
aceite); versão ilegível (`'desconhecida'`) conta como anterior; "Ok" grava
`marcaAvisoTermos(termsVersion, privacyVersion)` em
`STORAGE_KEYS.TERMS_NOTICE_SEEN` (aparelho, não save — aviso lido, não
consentimento). Desde `a6c1cd8a` o banner diz **qual** documento mudou
(`qualDocMudou` → `'terms' | 'privacy' | 'both'`, prop `changed`) e só linka
esse — afirmar "os Termos e a Política mudaram" quando só um mudou era mentira
de interface (design-critic A1); com as duas versões subindo juntas em
`2026-09-22`, quem consentiu antes vê o "ambos"; desde `bcfe7ca6` só os Termos
subiram (`2026-09-30`), então quem consentiu a `2026-09-22` vê o banner com
`changed = 'terms'` (sem bloqueio). Régua:
`src/utils/termsNotice.test.ts` + `termsNotice.qa.test.ts`.

### O cooperativo (a Fase 4.3, hoje a Guilda)

> ⚠️ **Esta seção foi CORRIGIDA em 29/09/2026** (`docs/reviews/guilda/qa/L1-conformidade.md`
> §4 listou nove afirmações falsas; as nove estão consertadas abaixo). O desenho
> novo — Bosque, fio, marés, Feira — está em [§56-A](#guilda). O que segue é o
> que ficou de pé do cooperativo original e o que mudou nele.

Ações do servidor: hoje moram em **`functions/api/guild.js`** (`guild`, `guildCreate`,
`guildJoin`, `guildCheckin`, `guildLeave`, …); as `coop`, `coopCreate`, `coopJoin`,
`coopCheckin`, `coopLeave` de `community.js` são só **aliases** que chamam
`handleGuild` (envelope antigo `{ group }`) e que nenhum cliente usa. Constantes
em **`functions/api/_coop.js`** (dono único):

| Constante | Valor | O que faz |
|---|---|---|
| `COOP_MAX_MEMBERS` (= `GUILD_MAX_MEMBERS`) | **12** (⚰️ era 4 até a Guilda) | teto da roda |
| `PRESENCA_NOMINAL_MAX` | 4 | até aqui a presença é nominal; a partir de 5 ninguém tem estado |
| `COOP_CHECKINS_POR_MEMBRO` | 5 | **5 e não 7** (ainda existe no servidor; o cliente não desenha a barra semanal desde a Guilda) |
| `COOP_TTL` | 120 dias | as chaves do grupo renovam JUNTAS; **guilda com Bosque plantado (`bosqueProgress > 0`) não expira** (G17a) |
| `target` | `members.length × COOP_CHECKINS_POR_MEMBRO` | **derivado**, nunca gravado — e **⚰️ não sai mais** para o cliente (M-3) |

**O desenho da tela é a feature.** `vistaDaGuilda` (⚰️ era `vistaDoGrupo`, em
`community.js`) é a ÚNICA montagem de resposta. O que sai por membro: um id
**opaco** desta guilda (`memberId`, 16 hex — ⚰️ o `pid` público saía e abria
`community?action=player`, que devolve estágio de criatura alheia), `name`,
`euMesmo` e, **só com ≤ 4 membros e só quando é `true`**, `apareceuHoje`. Nunca
`saveId`, `hostSave`, estágio ou HP de outra pessoa, contagem por pessoa ou
"quem faltou". ⚰️ A afirmação "por membro, `apareceuHoje: boolean` e mais nada"
era falsa desde o início (a vista já carregava `id`, `name`, `stage` e `euMesmo`).
Isso é **invariante de SERVIDOR**, não de tela. O motivo: 31,3% relataram efeito
psicológico negativo de comparação em ambiente de leaderboard.

**Sair é um toque, sem confirmação e sem penalidade — e não custa nada já
conquistado** (fio, direito ao resgate, cenários: [§56-A](#guilda)).

**Fronteira de confiança, declarada.** O check-in e o fio são AFIRMAÇÕES do
cliente, não verificações do servidor: recalcular a meta do dia ali exigiria uma
segunda cópia de `dailyGoalFor` — o footgun 9. O que o servidor garante é o que
ele PODE garantir sozinho: **um por pessoa por dia do jogador, e só sobre si
mesma** (e, no fio, que a meta enviada `done ≥ heart` bate). Nada de economia
depende disso além de Honra e cosmético (LV-G6).

**Dono.** `src/utils/community.ts` (o cliente e os tipos) ·
`functions/api/guild.js` (a resposta) · **`functions/api/_coop.js`** (estado,
prazos, `coopLeave`, constantes — ⚰️ este bloco dizia "`community.js` (todas as
regras)", falso desde `592e2c14`) · `src/utils/consent.ts` (idade e prova de
consentimento).

**Régua.** `functions/api/guild.*.test.js`, `functions/api/community.coop.test.js`,
`functions/api/community.directoryConsent.test.js`,
`functions/api/community.test.js`, `functions/api/community.playerOracle.test.js`,
`src/utils/community.respostaIlegivel.test.ts`, `src/utils/consent.test.ts`,
`src/components/CoopPanel.render.test.tsx`,
`src/components/PlayerDetailModal.semMetrica.render.test.tsx`,
`src/components/LibraryPage.amigos.render.test.tsx`. ⚠️ **"Tudo tem teste" era
falso** (L1-conformidade M2/M7b/M8/M9/M13: escrita só na própria chave, limpeza
do órfão na leitura, entrada só por código, classe LIGHT e re-sorteio de colisão
não tinham teste que as travasse) — o backend da Guilda ganhou
`guild.invariantes.test.js` e `guild.l2.test.js`; reconfira antes de repetir a
frase.

**Decisão.** [`docs/PLANO-COOP.md`](../PLANO-COOP.md) (Fase 4.3, regra viva do
original) e [`docs/PLANO-GUILDA.md`](../PLANO-GUILDA.md) (o que o superou);
[`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §5.5 — inclusive
"Só verbos de DAR" e "Entrada só por código de convite".

**Casos de borda.**
- **Dois membros marcando presença na mesma noite** apagavam um ao outro: hoje
  cada membro escreve **só a própria** chave (`coopCk`/`coopFio`/`coopHit`); a
  corrida foi **removida, não mitigada**.
- **Duas pessoas na última vaga** → `409 join collision` (releitura da própria
  entrada).
- **TTL por chave**: as chaves do grupo renovam juntas (`gravarGrupo`).
- **Não ter grupo NÃO é erro** (`guild` devolve `guild: null`).
- **`guildCheckin` é idempotente** no servidor.
- **O "hoje" NÃO é mais UTC** (⚰️ L1-conformidade #13, o achado mais caro: no BRT "apareceu
  hoje" virava às 21h e quem cumpria a meta às 22h perdia um dia de presença).
  O cliente manda o `dayKey` do JOGADOR (`playerDayKey` + `playerDayTz`) e o servidor
  aceita a ±1 do dia UTC (`diaDoJogador`; override de G6, `PLANO-GUILDA.md` §0.1).
- **Código de convite**: ⚰️ `PLANO-COOP.md` §4.2 diz "de uso único" e o código nunca fez
  isso — é reutilizável até a guilda morrer, e o anfitrião o troca por `guildNewCode`
  (não existe expulsão, G7). ⚠️ divergência plano × código, registrada no STATUS.
- **⚰️ "grupo sem check-in por 4 semanas é apagado"** (`PLANO-COOP.md` §3.4) — nunca foi
  implementado; vale só o `COOP_TTL`, e com Bosque plantado nem ele.
- **Nome da guilda**: ⚰️ D-1 (só `replace/trim/slice`) — hoje `sanitizarNomeDeGuilda`
  (NFKC, sem `@`, sem contato/URL/rede social, passa por `minimizeForAi`).

**O que NÃO faz.** Não mostra quanto cada membro fez. Não manda push de cobrança
(`guild.semPush.contract.test.js` trava: a Guilda nunca notifica). Não paga
nada além de Honra e cosmético. Não tem busca de guilda. Não reusa
componente de métrica do próprio perfil na tela do amigo.

**Onde a UI mostra.** ⚰️ Este bloco dizia "`LibraryPage.tsx` (abas Todos / Amigos /
Coop)" — falso duas vezes: o rótulo era "Grupo" e a aba é **inalcançável**
(`hallContent` passa `view`, que esconde as abas). Hoje: `AreaView` →
`GuildSheet` (**Salão** no lote `guilda` do Hall, **Feira** no lote `feira` da
Arena — [03 §4.26](03-FLUXO-DE-TELAS.md)); `CoopPanel.tsx` é só um reexport.
Além disso `src/components/PlayerDetailModal.tsx` e
`src/components/TournamentPage.tsx` (o toggle e o aviso do diretório).

---

<a id="guilda"></a>
## 56-A. 🌳 A Guilda: Bosque, fio, marés, Feira e resgate

**Em uma frase.** Uma roda de até 12 pessoas que **constrói junto e nunca cobra**:
cada dia de presença é um fio, os fios fecham o dia e o Bosque só cresce; uma vez
por semana a roda encontra um fenômeno da Malha e o dissipa (ou ele recua) sem
que ninguém saiba quem bateu quanto.

**A regra.** (Fonte: `docs/PLANO-GUILDA.md` §3; constantes em
`functions/api/_coop.js`, espelhadas para a copy em `src/utils/guildRules.ts`.)

| Peça | O que é | Regra |
|---|---|---|
| **Roda** | a Guilda em si | teto `GUILD_MAX_MEMBERS` = **12**; **um coletivo por pessoa** (D-G1); entrada só por código de 8 caracteres (sem 0/O/1/I); **sem expulsão** (G7) — o anfitrião renomeia e troca o código; se o anfitrião sai, a vez passa ao membro mais antigo, em silêncio. |
| **Fio** | a presença do dia | `guildThread`: **um por pessoa por dia do jogador**, vale `FIO_PER_MEMBER_DAY` = 1, nunca peso nem contagem de tarefa (LV-G8). Firma com a meta de **CORAÇÃO** (`heartGoalFor`, `META_DO_FIO = 'heart'`, **G1** — adotado por padrão, **aguarda confirmação do dono**, `REGISTRO` §5.5): o dia parcial que protege o coração também firma; o servidor confere `done ≥ heart` quando o corpo traz os números. |
| **Bosque** | a obra da roda | cada dia FECHADO soma `fios do dia ÷ ativos do dia` (teto 1,0); **só soma** (LV-G3) — nada subtrai. Estágios por `BOSQUE_THRESHOLDS` = **2 / 10 / 25 / 50 / 90** dias-de-guilda: Clareira → Ramagem → Copa → Mata → Bosque antigo. O cliente recebe estágio e um binário `perto` (≥ 80% do intervalo), **nunca** "faltam N" nem razão. |
| **Viajante** | quem sumiu | sem fio há `TRAVELER_AFTER_WEEKS` = **4** semanas sai do denominador e **continua na roda** — derivado, nunca gravado, invisível para todos. |
| **Marés** | ciclo de 6 semanas | `GUILD_TIDE_WEEKS` = 6. A floração da maré (meta `TIDE_BLOOM_TARGET` = 12 dias-de-guilda) é **colhida no estado em que estiver** na virada e vira peça permanente do Bosque (`ornaments`), em três tamanhos descritivos — `petala` (< `TIDE_COROLLA_AT` = 4), `corola`, `floracao` (≥ 12) —, nenhum "pior". Maré sem crescimento não gera peça e **nada é dito**; nenhuma maré falha e nada é resetado. Resolvida na LEITURA (sem cron). |
| **Gestos** | a roda se cumprimenta | `aceno`, `luz`, `descanso`: fixos, **anônimos**, para a roda inteira, sem texto livre, **um de cada por dia**, sem push (LV-G4). O TIPO recebido só chega com 3+ membros (`GESTO_TIPO_MIN_MEMBROS`; numa roda de 2 o "anônimo" seria quem sobrou) — abaixo disso vem só `gestureReceived: true`. |
| **Feira** | o fenômeno da semana | uma **rodada por pessoa por dia** (`RAID_ROUNDS_PER_DAY` = 1), a qualquer hora da semana ISO; **sem gate de fio, de meta ou de Vínculo** (G15). HP coletivo `max(ativos, 3) × 45`; dano `10 + 2 × poder do estágio`, ±20%, sorteado NO SERVIDOR (`crypto`) e **nunca devolvido**. Fenômeno por semana, determinístico: `nevoa`/`mare`/`estatica`/`enxame` (tempo da Malha, **nunca inimigo**, sem guilda × guilda). O cliente vê `aberta`/`dissipada`, o booleano `ferido` (dano ≥ metade), `hitToday` e o desfecho da semana anterior (`dissipada`/`recuou`, `recuou` nunca aponta ninguém). Golpe na semana já terminada só até segunda 12:00 UTC. |
| **Resgate** | o prêmio | só quem **golpeou** (o direito mora com a pessoa em `coopPart`, e **sobrevive à saída**, A-1). `dissipada` → `RAID_EMBLEMS` = **4** de Honra; `recuou` → `RAID_EMBLEMS_FLOOR` = **2** (G9: quem se esforçou nunca sai de mão vazia). A cada `RAID_TROPHY_EVERY` = **4** Feiras dissipadas resgatadas, uma **Concha da Maré** (`trophy-concha-mare`, decoração no espaço `trophy`; NUNCA vendida, `not-for-sale`). Três semanas de janela. **LV-G6: só Emblemas e cosmético** — nada de coração, Créditos, energia, `perfectDays`, Glitchtama ou vantagem de evolução (`guildReward.contract.test.js`). |
| **Cenários do Bosque** | conquista | `bg-guild-<estágio>` para quem firmou **7 dias DISTINTOS** de fio (`STAGE_UNLOCK_DAYS`, não seguidos — LV-G9), até o estágio atual; **ficam com quem sai** (G12), nunca à venda nem no sorteio da masmorra. |
| **Saída** | um toque | sem confirmação e sem penalidade (LV-G5): o fio ainda não fechado vira contagem anônima do Bosque (a obra nunca regride), os dias distintos de fio viajam com a pessoa (`coopDias`, o relógio dos 7 dias não recomeça) e o resgate pendente continua colhível. |

**Recibo do resgate (M3).** O KV é eventualmente consistente entre regiões, então
duas respostas 200 são possíveis. O servidor devolve um **recibo determinístico**
por (conta, semana) — igual no 200, no 409 e em qualquer aparelho — e o cliente
credita a Honra **uma vez por recibo** (`guildClaimLocal.ts`, fallback em
memória para storage cheio). O `409 already claimed` **traz** o `claimed` do
registro: quem perdeu a resposta do 200 ainda credita, mas só quem TENTOU neste
aparelho (`markClaimAttempt`).

**Nada da Guilda vai para o `GameState`** (`guildNoSave.contract.test.ts`): o
ponteiro é `coopOf:<saveId>` do servidor; o aparelho guarda só **duas chaves de
conveniência** (`GUILD_LAST_STAGE` e `GUILD_CLAIMED`, travadas em exatamente duas
pelo teste; os comentários do código chamam a segunda de "terceira" por contar
uma chave de aviso anterior — ⚠️ contagem de comentário, não de código) e o que
foi GANHO (cenários, Concha, Honra) vai ao save.

**Onde a regra mora.** `functions/api/_coop.js` (constantes, Bosque, fio, marés,
Feira, cartão do membro) · `functions/api/guild.js` (a resposta única) ·
`src/utils/guildRules.ts` (espelho para a copy, travado por
`guildRules.parity.test.ts`) · `src/utils/guildCopy.ts`/`guildCopyCore.ts` (todo
texto) · `src/utils/groveLocal.ts` e `hooks/useGroveWatch.ts` (o aparelho olha).

**Régua.** `functions/api/guild.*.test.js` (thread, gesture, mare, raid,
recompensa, saida, vista, l2, invariantes, simParidade, semPush),
`functions/api/guildReward.contract.test.js`, `account.guildBosque.test.js`,
`account.guildFeira.test.js`, `src/utils/guildRules.parity.test.ts`,
`src/utils/guildNoSave.contract.test.ts`,
`src/components/guild/guildSemCobranca.contract.test.ts` (vocabulário vetado
LV-G1..G10), `guildFeiraFiacao.contract.test.ts`,
`src/components/filaDeAvisos.contract.test.ts` (posição da cerimônia).

**Decisão.** `docs/PLANO-GUILDA.md` (G1..G17, LV-G1..G10),
`docs/NARRATIVA-COPY-GUILDA.md`, `REGISTRO-DE-DECISOES.md` §5.5 (G1) e §5.6 (a
exceção ao congelamento da Camada 3). Auditorias:
`docs/reviews/guilda/qa/` (L1..L5).

**Casos de borda.**
- **Presença nominal só com ≤ 4**; com 5–12 ninguém tem estado e o agregado é UMA
  frase qualitativa quando `threadedToday` (`true` ou `null`, nunca número).
- **Ausência nunca é um estado** (M-1): nenhum `false` sobre outra pessoa trafega.
- **Sair→voltar→firmar não soma a mesma pessoa duas vezes** (A2): o fio avulso é um
  CONJUNTO de ids opacos por dia, nunca um contador.
- **Vista de 12** custa ~16 leituras de KV (cartão derivado `coopMem`, A3) em vez de ~114.
- **Cliente adulterado** que declara estágio `ultra` bate ~20 em vez de ~12 — só
  derruba o fenômeno da PRÓPRIA guilda um dia antes; o prêmio é cosmético
  (aceito, `PLANO-GUILDA.md` §10.4).

**O que NÃO faz.** Sem ranking, sem guilda × guilda, sem número por pessoa, sem
barra da semana, sem push (nem widget: `WPG-14` ainda não existe), sem meta que
"não bateu", sem Glitchtama ou Créditos como prêmio, sem expulsão.

**Divergências abertas** (para o STATUS): G1 aguarda o dono; `PLANO-COOP.md` §3.4
e §4.2 (grupo inativo apagado, código de uso único) descrevem o que o código não
faz; arte real do Bosque/Feira ainda é placeholder (WPG-13/A); motivo próprio de
telemetria para o convite da Guilda (hoje reusa `shop`).

---

<a id="estacoes"></a>
## 57. 🍂 Estações

**Em uma frase.** Quatro janelas trimestrais que destacam sonhos e oferecem
uma medalha por três caminhos alternativos — e **nada nelas expira, nunca**.

**A regra.** `src/utils/seasons.ts` → `SEASONS`, quatro entradas: Broto
(01/03–31/05), Brasa (01/06–31/08), Maré (01/09–30/11) e Estrelada
(01/12–27/02, que cruza a virada do ano). ⚰️ Em PT eram "Estação da Fogueira" e "Estação da Constelação" até 30/09/2026 (alinhadas ao EN, `Ember Season` / `Starlit Season`; os ids `season-ember` / `season-starlit` não mudaram). Cada uma declara três `dreamIds` que
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

Os temas são hemisfério-agnósticos de propósito (broto, brasa, maré,
estrelada, e não "verão"/"inverno"): a base é PT e EN ao mesmo tempo, e "Summer
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
- **A estação que cruza o ano** (Estrelada) é tratada por `wrapsYear` /
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
save — nada é gravado (única exceção: `conquistasHerdadas`, a herança da
`tasks-100` ⚰️, gravada UMA vez no load), nada se compra, nada fecha depois de
aberto, e **nenhuma conta tarefas** (decisão #30, 21/09/2026).

**A regra.** Dono: `src/utils/achievements.ts` → `ACHIEVEMENT_IDS`,
`ACHIEVEMENT_LABELS` (PT/EN), `unlockedAchievements(save)` — função PURA que
devolve os ids abertos na ordem canônica. Todas **derivadas na leitura**
(footgun 9: duas fontes para o mesmo fato) — salvo `dias-completos-30`, que
também lê `conquistasHerdadas` (o campo que `hydrateSave` grava uma vez para
quem já tinha a `tasks-100` aberta) —, e cada uma lê um contador que
**nunca decresce**, então uma conquista lida como aberta não fecha:

| Id | Abre quando | O contador que lê |
|---|---|---|
| `perfect-day` | `totalPerfectDays ≥ 1` ou `perfectDays ≥ 1` | [§7](#dia-completo) |
| `habit-7` / `habit-21` / `habit-66` | o **maior** `totalDone` entre os `habitRhythms` ≥ 7 / 21 / 66 | os marcos de `HABIT_MILESTONES`, [§28](#marcos) — `totalDone`, **não** sequência |
| `first-evolution` | algum id em `unlockedEvolutions` ≠ `'rookie'` | [§17](#evolucao) |
| `mega-form` | `evolutionStage` começa por `mega` ou é `ultra` | [§14](#escada) |
| `dungeon-10` | `dungeonRunsCompleted ≥ 10` | [§51](#masmorra) |
| `tournament-champion` | algum `trophies[].place === 1` | [§53](#torneio) — 2º e 3º lugar **não** abrem |
| `dias-completos-30` | `totalPerfectDays ≥ DIAS_COMPLETOS_PARA_CONQUISTA` (30) | cosmética, sem moeda — ⚰️ era `tasks-100` (≥100 tarefas) até 21/09/2026, decisão #30: contagem de tarefas saiu, o gatilho é o dia completo (§7); quem já tinha a antiga herda via `conquistasHerdadas` em `hydrateSave` |

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
- ⚰️ **Nenhuma conquista conta tarefas desde 21/09/2026** (decisão #30 do QA
  geral; `vetos.md`): `tasks-100` virou `dias-completos-30`, gatilho por dia
  completo. A proibição #16 ([`01 §7`](01-VISAO.md#as-linhas-vermelhas)) passou a
  valer também para o cosmético. Migração única no load: save sem o campo
  `conquistasHerdadas` e com ≥100 no gatilho antigo herda a conquista nova
  (`GameStateContext.legacySave.test.tsx`).
- ✅ **O 🌀 Glitchtama saiu das CONQUISTAS** (decisão do dono **#41/#60**,
  22/09/2026). ⚰️ Até esta data `applySpecialItem` somava **`totalPerfectDays++`**
  ao usar o item, e `achievements.ts` lê exatamente esse campo: o perfil G da
  simulação — zero hábitos, uma run de masmorra por dia — terminava 90 dias com
  `totalPerfectDays = 90` e **nenhum** dia completo de verdade, abrindo
  `perfect-day` e `dias-completos-30` sem nunca ter cumprido uma meta. E
  `dias-completos-30` é justamente a conquista que substituiu `tasks-100` para
  deixar de premiar CONTAGEM (proibição #16) — um minijogo inflando o contador
  reabria o veto pela porta dos fundos. Agora o 🌀 escreve **`missionPerfectDays`**,
  campo NOVO no save (linha vermelha #20: save só ACRESCENTA), lido **só** por
  `utils/missions.ts` (`mission-perfect-30`), que a decisão manda continuar
  contando o item. `totalPerfectDays` volta a significar uma coisa só — dias
  completos REAIS —, e é ele que `achievements.ts` e `seasons.ts` leem. Duas
  perguntas diferentes ("você cumpriu 30 dias?" × "você acumulou 30 marcas?"),
  dois contadores, em vez de um número com dois significados. `computeDailyReset`
  incrementa os **dois** num dia completo real, e `hydrateSave` lê
  `missionPerfectDays ?? totalPerfectDays` — então a missão **nunca anda para
  trás** nem fica mais difícil para quem já usou o item. Medido: o perfil
  só-masmorra caiu de 90 para **0** dias completos.
- **`habit-*` lê `totalDone`**, que a poda de `HISTORY_CAP` não toca — por isso
  o de 66 continua alcançável.
- **Save antigo sem os campos**: todo acesso tem `?? 0` / `?? []`; nenhuma
  conquista abre por `undefined`.
- **Honra (moeda) ≠ emblema-CONQUISTA**: `emblems` no save (rótulo "Honra" desde 30/09/2026; o id e o campo não mudaram) ([§46](#moedas)) é
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
  `onToggleSound` à `SettingsPage`; ⚰️ o `SettingsModal`, que também o recebia, foi
  apagado em `4a8b8049`, #37).
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
(`App.tsx` passa `handleToggleSound`). ⚰️ O mesmo par existia no `SettingsModal`
("Ajustes rápidos"), que nunca teve gatilho vivo e foi **apagado em `4a8b8049`**
(decisão #37 — [`03` §4.23a/§4.23b](03-FLUXO-DE-TELAS.md)); a `SettingsPage` é o
único caminho. ⚰️ Entre
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
| D3 | tabela 🛒 | "Loja em ABAS (Itens/Cenários/Mobílias/**Torneio**/Missões)" — cinco | ⚰️ a `ShopModal` (e o `ShopSegment`) saiu na minimal-ui. A loja são **quatro lojinhas** na área Mercado — Itens, Decoração, Background (abas por moeda, `STALL_CURRENCIES`) e Conquistas (abas por `MISSION_CATEGORIES`) — e a loja de Honra mora no Torneio da área Arena (`tournamentShopItems`). O `CLAUDE.md` ainda diz "Na página Atividades (`ShopModal`)" e "Missões (…, aba na loja)" | `ls src/components/ShopModal.tsx` falha; `src/utils/mercadoCatalog.ts` (`MERCADO_STALLS`, `STALL_CURRENCIES`) |
| D4 | footgun 9, item do Vínculo | o gate de PvP usa "cliente (**`canPvp`**)" | o símbolo **não existe**. O cliente tem `meetsPvpBond` e `xpToPvpBond` (`src/utils/bond.ts`); o servidor decide em `functions/api/community.js` ação `profile`, com `bondLevelOf` de `functions/api/_bond.js` | `grep -rn canPvp src desktop functions` não devolve nada |
| D5 | tabela ⚔️ | "`getDungeonEnemySprite(tier, petStage)` tira do sorteio a linha que o jogador está usando, pra ninguém encarar um espelho de si mesmo" | a assinatura é `getDungeonEnemySprite(tier, excludeLine)` e `excludeLine` é comparado com **ids de LINHA** (`ignar`…`thalindra`). `buildDungeonWave(level, petStage)` repassa o **estágio de evolução** (`rookie`, `champion-power`…), que nunca casa — **a exclusão não dispara em jogo**. O `demoCharacterId`, que É um id de linha, chega ao `DungeonGame` e é usado só para o sprite do próprio jogador | `grep -n "buildDungeonWave(" src/components/DungeonGame.tsx` e `grep -n "getDungeonEnemySprite" src/utils/dungeon.ts`; a função em si está correta e tem teste (`src/utils/sprites.dungeonRoster.test.ts`, "excludeLine tira a linha do jogador do sorteio") — o defeito é do CHAMADOR |
| D6 | tabela ⚔️ | "**Sem limite diário e SEM gate de entrada**… Se farmar Bits virar problema, a alavanca é custo de ENTRADA em Bits" — escrito como hipótese futura | a alavanca **já existe** (WP4.5): `DEEP_START_BASE_COST` = 40, `deepStartCost(n) = 40 × n`, `DEEP_START_MAX_LEVEL` = 5, `canBuyDeepStart`. Não contradiz o "sem gate" (a compra é opcional e sobe a base), mas a tabela não a menciona | `grep -n "DEEP_START" src/utils/dungeon.ts`; `src/utils/dungeon.deepStart.test.ts` |
| D7 | tabela 🎪 / 🎖️ | nada sobre teto de partidas | há **teto diário de partidas de Torneio no servidor**: `MATCHES_PER_DAY` = 5; estourar devolve `429 daily limit` | `grep -n "MATCHES_PER_DAY" functions/api/community.js` |
| D8 | tabela 🎪 | fala só da "Rodada do Torneio" (semanal) | existem **três** calendários com nomes parecidos: a **rodada** semanal (`src/utils/tournamentSeason.ts`), a **season** do ranking, que é **MENSAL** (`currentSeason()` em `functions/api/community.js`, `YYYY-MM`, e é ela que fecha e dá troféu), e as **estações** trimestrais (`src/utils/seasons.ts`) | `grep -n "const currentSeason" functions/api/community.js` |
| D9 | tabela ⚔️, bestiário | "as 24 artes possíveis (6 linhas × 4 tiers de arte — baby-i/ii reusam o rookie)" | a GRADE é 24, mas a **chave gravada não é colapsada**: `enemyKey(tier, line)` grava `linha-baby-i` e `linha-baby-ii`, que `BestiaryCard` nunca lê. O save recebe até **36** chaves, e um encontro em baby-i não revela a célula de rookie | `grep -n "LADDER_TIERS" src/utils/dungeon.ts` × `const TIERS` em `src/components/BestiaryCard.tsx` |
| D10 | tabela 🧮 | "o DIA de todo registro diário que mora no save é o DIA DO JOGADOR", com sete famílias listadas | os registros da masmorra **não moram no save**: `DUNGEON_HEART_DROPS` usa `new Date().toDateString()` (o dia do APARELHO) e o `localStorage`; `DUNGEON_DIFFICULTY` usa um `weekKey()` local; `DUNGEON_BEST` idem. O teto de 2 coraçõezinhos/dia e a base semanal são, portanto, **furáveis trocando de aparelho** — o mesmo furo que `careCaps` fechou para carinho e comida | `grep -n "toDateString\|STORAGE_KEYS.DUNGEON" src/utils/dungeon.ts` |
| D11 | comentário de `src/utils/arena.ts` | o cabeçalho afirma, com data (07/09/2026), "**SEM CONSUMIDOR** — nenhuma tela chama nada daqui" | falso desde 09/09/2026: `src/components/ArenaGame.tsx` importa 15 símbolos do módulo e é aberta pela `ActivitiesPage` (desde a minimal-ui F5, pelo lote Duelo da área Arena). O `CLAUDE.md` também não menciona a Arena em lugar nenhum | `grep -rn "utils/arena" src --include=*.tsx` |
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
| D28 | "Arte e nomes" (§22, `01 §8`) | "os três personagens prontos se chamavam … hoje são **Pyraka, Akashai e Nimbrata**" | `PREMADE_CHARACTERS` tem **seis** desde 15/09/2026 (`c11dc49d`, D1 da SQUAD-ARTE): `igni`, `nautilu`, `astrase` entraram com nome de `DUNGEON_LINE_NAMES`. Apurado em 20/09/2026 | `grep -c "^    id: '" src/utils/monetization.ts` → 6 |
| D29 | comentários de `src/utils/achievements.ts` e `src/utils/emblemArt.ts` (§57-A) | cabeçalhos dizem "As **8** CONQUISTAS" / "os **8** EMBLEMAS" / "guard de instalação (8)", e o teste chama-se "as 8 conquistas têm arte instalada" | `ACHIEVEMENT_IDS` tem **9** ids, há **9** PNGs em `src/assets/soulmon/emblems/` e o próprio teste exige `EMBLEM_COUNT` = **9** (`tasks-100` entrou depois do cabeçalho). O `STATUS.md` de 15/09/2026 também diz "8 emblemas". Apurado em 20/09/2026 | `ls src/assets/soulmon/emblems` → 9 arquivos; `grep -n "EMBLEM_COUNT).toBe" src/utils/achievements.test.ts` |
| D30 | `CLAUDE.md`, tabela 💠 Bits (§46) | os Bits aparecem "em fonte de calculadora (`bitsStyle` retrô / `bitsStyleLight` tema claro)" — dois estilos, um por tema | os dois exports são **idênticos** e a cor é o token `--sm2-primary-ink` nos dois temas (canvas Loja D-L11, 20/09/2026); não há mais versão por tema | `grep -n "bitsStyleLight" src/utils/currencies.ts` |
| D31 | `CLAUDE.md`, bloco `docs/NARRATIVA-E-UNIVERSO.md` (`01 §7`) | a régua `src/narrativa.contract.test.ts` trava o vocabulário vetado "com a tabela `DÍVIDA` do que já está no app por decisão pendente" | a tabela chama-se **`EXCECOES`** desde `f3654076` (21/09/2026): a decisão §14.4 do `REGISTRO-DE-DECISOES.md` ("nenhum, aceito todos assim") mudou o estatuto de pendência a quitar para exceção declarada. O que a régua trava não mudou (termos nunca aceitos + espalhamento para arquivo novo) | `grep -n "EXCECOES\|DÍVIDA" src/narrativa.contract.test.ts` → só `EXCECOES` |
| D32 ⚰️ fechada em `15164e4c` (21/09/2026, dono autorizou corrigir o `CLAUDE.md`: cinco arquivos, S16, S1..S16) | `CLAUDE.md`, linha "Áudio — três arquivos" e bloco `docs/SOM.md` (§58-A) | `src/utils/sounds.ts` são "os **8 sons**, todos sintetizados, **zero byte de asset**"; as decisões canônicas são "**S1..S13**" | desde `ee79fd44` (21/09/2026, S16) há **cinco** `.webm` em `public/sounds/` e `playEvolve`/`playDegenerate`/`playTaskComplete` preferem o asset (`playComAsset`), com o procedural como fallback; são **cinco** módulos de áudio (`sonsAssets.ts` e `trilha.ts` entraram), e o registro vai até **S16** | `ls public/sounds` → 5 arquivos; `grep -n "playComAsset" src/utils/sounds.ts`; `grep -n "S16" docs/REGISTRO-DE-DECISOES.md` |
| D33 | ⚰️ hint do switch "Trilha" em `src/components/SettingsModal.tsx` (§58-A) | dizia "Uma camada calma, em loop" / "One calm looping layer" | `CAMADAS_DA_TRILHA` tem **duas** camadas (`base` + `ritmo`) desde `8a930657` (21/09/2026). **Fechada em `980bc84c`** (mesmo dia): o hint diz "Duas camadas calmas, em loop" no `SettingsModal` e na `SettingsPage`, e o cabeçalho de `trilha.ts` abre com "duas camadas em fase" | `grep -c "url: '/sounds/trilha-" src/utils/sonsAssets.ts` → 2; `grep -rn "Uma camada" src/components src/utils/trilha.ts` → vazio (21/09/2026) |
| D34 | `PLANO-COOP.md` §4.2 | o código de convite é "de uso único" | o código é **reutilizável** até a guilda morrer (`coopCodeKey` renovado) e o anfitrião o troca por `guildNewCode`; não existe expulsão (G7) | `grep -n "coopCodeKey" functions/api/_coop.js` |
| D35 | `PLANO-COOP.md` §3.4 | "grupo sem check-in por 4 semanas é apagado" | **não é implementado**: só o `COOP_TTL` (120 d) — e guilda com Bosque plantado (`bosqueProgress > 0`) nem isso (G17a) | `grep -n "semPrazo" functions/api/_coop.js` |
| D36 | `PLANO-GUILDA.md` §3 (linha 🧵 do fio) | o fio usa "dia UTC" | o servidor aceita o `dayKey` do JOGADOR a ±1 do dia UTC (`diaDoJogador`, override de G6 do §0.1); o texto do §3 ficou velho (L3-conformidade) | `grep -n "diaDoJogador" functions/api/_coop.js functions/api/guild.js` |
| D37 | `PLANO-GUILDA.md` §3 (marés) | tamanhos "broto / ramo / floração" | os ids do código são `petala` / `corola` / `floracao` (`TIDE_SIZES`); a copy os nomeia por `tideSizeName` | `grep -n "TIDE_SIZES" functions/api/_coop.js src/utils/guildRules.ts` |
| D38 | `REGISTRO-DE-DECISOES.md` §5.5 (G1) | o fio é firmado pela meta de coração — a confirmação do dono está pendente | o código já usa `META_DO_FIO = 'heart'` **por padrão da sessão**; trocar é trocar a constante | `grep -n "META_DO_FIO" functions/api/_coop.js` |
| D39 | comentário de `src/utils/guildClaimLocal.ts` e de `storageKeys.ts` | chama `GUILD_CLAIMED` de "a TERCEIRA chave de conveniência" | a Guilda tem **duas** (`GUILD_LAST_STAGE`, `GUILD_CLAIMED`) — `guildNoSave.contract.test.ts` trava exatamente duas | `grep -n "soulmon-guild" src/utils/storageKeys.ts` |
| D40 | `REGISTRO-DE-DECISOES.md` §5.6 (linha "Anfitriões…") e `STATUS.md` 30/09/2026 | o NPC do Refúgio se chama **Boio** | `LOT_NPC_VOICE['jogos:refugio']` em `src/utils/areaNpcVoice.ts` diz **Bobbi** (a auditoria 14.6 renomeou Boio → Bobbi no mesmo dia); a linha do registro e o bloco do STATUS ficaram com o nome velho | `grep -n "Bobbi" src/utils/areaNpcVoice.ts` |

**Como usar esta tabela.** Antes de "corrigir" qualquer linha, leia a linha
correspondente do [`REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md): D1 e
D2 já são decisões tomadas (§5.4), então o que está velho é o `CLAUDE.md`, não o
código. D5, D9, D10 e D11 são achados novos e nenhum deles tem decisão registrada
— vão para o [`STATUS.md`](../STATUS.md) com a conta na mão, não para um commit
de conserto silencioso.


---

<a id="administrador-gm"></a>
## 60. 🐦‍⬛ Administrador/GM e o corvinho

**Em uma frase.** O dono do projeto tem uma conta de administrador (GM), decidida **só no servidor**, que testa o jogo inteiro sem virar brecha de dinheiro nem de custo — e uma criatura própria, o **corvinho de lanterna e cartola**.

**A regra.**

1. **Quem é admin.** O e-mail de um ID token Firebase VERIFICADO (assinatura, `aud`, `iss`, `exp`, `email_verified === true`) que esteja em `ADMIN_EMAILS` (secret do Worker; só o NOME aqui, 08 §Entitlements) **e** que seja o dono do `saveId` pedido. Fail-closed: sem `ADMIN_EMAILS`, ou sem `FIREBASE_PROJECT_ID`, ninguém é admin — o `saveId` é calculável a partir do e-mail, então nunca é prova. Dono: `functions/api/_admin.js` (`verifiedAdmin`).
2. **O que o papel dá** (tudo derivado NA LEITURA, nunca gravado em `ent:<saveId>`): tier efetivo `paid` e Créditos de exibição (`ADMIN_CREDITS_DISPLAY`, não é saldo; `spend` não debita); passa do `requirePaidTier` do gerador; chat na cota paga; tetos POR CONTA de IA de sprite × **3** (`ADMIN_AI_CAP_MULTIPLIER`) **e** um sub-teto mensal próprio de **40** sprites (`ADMIN_SPRITE_MONTHLY_CAP`, contador `ai:sprite:@admin:<mês UTC>`) — o teto global mensal segue intacto e o pior caso do admin é ~R$ 4/mês. Estourar devolve o mesmo 503 do teto global, sem revelar o papel. Nenhuma rota lê ou escreve outro `saveId`; comunidade e guilda tratam o admin como jogador comum.
3. **No cliente** a flag é só um espelho em memória do `GET /api/entitlements` (`admin === true` literal, `src/utils/adminFlag.ts`): **nunca vai ao save nem ao localStorage**, e rede falha = não-admin. **Quando a consulta roda de novo** (30/09/2026, `src/utils/entitlementSync.ts` › `createEntitlementSync`): ⚰️ antes rodava UMA vez por `saveId`, e uma 1ª resposta sem token do Firebase deixava a sessão não-admin para sempre. Agora `mount`/`auth` (o usuário do Firebase mudou) sempre consultam; `visible` (voltou ao primeiro plano) no máximo a cada `ENTITLEMENT_VISIBLE_MIN_GAP_MS` (30 s); resposta `null` de `mount`/`auth` agenda UM retry após `ENTITLEMENT_RETRY_MS` (2,5 s); resposta de consulta mais velha é descartada. Sem timer recorrente. A segurança não mudou: quem decide é o servidor. Se o corvinho não aparece em produção, procure `admin_denied` no log do Cloudflare (`no-allowlist` = falta `ADMIN_EMAILS`; `not-listed` = e-mail fora da lista; `saveid-mismatch` = consulta antes do login).
4. **O painel de GM** (`GmPanel`, Configurações — só para admin) chama `src/utils/gmTools.ts`: updaters PUROS e IDEMPOTENTES sobre o save LOCAL — dar saldo (Bits e Honra = `GM_BALANCE` 999999, nunca reduz um saldo maior), desbloquear tudo (cenários, mobílias, evoluções, contadores mínimos das missões permanentes por `Math.max`; NÃO toca `perfectDays`/`totalPerfectDays`), ir para uma das 11 formas, encher cuidados, somar 1/7/30 dias completos. Créditos NÃO (vivem no servidor). O aviso do painel diz que a mudança sobe para a conta inteira (M-2).
5. **O corvinho.** Na 1ª abertura como admin (e de novo se um save remoto vier sem o corvo, pois a auto-adoção deixou de ser "uma vez por sessão") o app adota o corvinho automaticamente e SEM VOLTA (`adoptCorvo`, `src/utils/corvoAdocao.ts`, import dinâmico): preserva estágio, HP, energia, atributos, atividades, Bits, Emblemas, `perfectDays`, `unlockedEvolutions`, acervo e `petName`; troca `soulmonStages`, `baseName`, `creature` e zera `demoCharacterId`. São 11 formas (a mesma escada do jogo, ids em `CORVO_FORM_IDS`), arte em `src/assets/soulmon/corvo/`. A linha de arte vem de `spriteLineOf` (`corvoPet.ts`). O widget Android também o desenha (`pet_line`, 03 §widget).

**Não faz.** Não é backdoor: nada disso vale para quem não está em `ADMIN_EMAILS`; não muda regra de jogo para os demais; não concede `accountTier:'paid'` gravado.

**Régua.** `functions/api/admin*.test.js` (tokens RSA assinados de verdade, abuso, tetos), `src/utils/adminCorvo.contract.test.ts`, `src/utils/gmTools.test.ts`, `src/components/GmPanel.render.test.tsx`, `src/utils/entitlementSync.test.ts` (a consulta). Dívidas M-3/B-3/B-4 em [`reviews/admin-corvo/`](../reviews/admin-corvo/L3-verificacao-final.md).

<a id="oficina-foco"></a>
## 61. 🛠️ Oficina do Foco e Caderno (Exploração, 04/10/2026)

**O que é.** Dois lotes da Exploração, sem relação com a economia: a **Oficina do Foco** (timer de foco + técnicas de gestão de tempo e produtividade) e o **Caderno** (journaling). Decisão e alternativas em [REGISTRO §22](../REGISTRO-DE-DECISOES.md); plano e fontes em [PLANO-OFICINA-FOCO](../PLANO-OFICINA-FOCO.md).

**Regras.** (1) Nada paga Bits, XP, Emblema, Vínculo nem toca `perfectDays`; nada entra no save. (2) Timer por timestamp (`endAt`) em `utils/focoTimer.ts`: 25/5 e 50/10; pausa longa de 15 depois de cada 4 focos do dia no 25/5; ao fim, aviso na tela, vibração curta e notificação local só com permissão JÁ concedida. (3) "Foquei" soma 1 ao dia local (`FOCO_SESSIONS`, 14 dias, teto 99/dia); sem total público, sequência ou placar. (4) As 7 técnicas (`data/focoTecnicas.ts`) dizem fonte e evidência no `InfoTip`; a copy descreve e não promete. (5) Caderno: **dado sensível no save na nuvem do titular** (`GameState.caderno`, 120 entradas × 2000 caracteres, sanitizado no load e clampado em `save.js`), apagável por entrada e por inteiro, exportado e apagado com a conta; nunca entra em IA/chat/telemetria/perfil público (`cadernoSensivel.contract.test.ts`); `needsBridge` (o léxico do chat) mostra a linha de apoio no aparelho, sem bloquear; as anotações da 1ª versão (`soulmon-caderno`, só aparelho) migram uma vez para o save. (6) Vibração ao fim do foco: ligada por padrão, interruptor em Configurações › Seus dados (`soulmon-foco-vibrate`). `PRIVACY_VERSION` = `2026-10-04` (§2 de `privacidade.html` declara o Caderno).

**Não faz.** Não conta sequência, não lembra, não cobra, não analisa nem diagnostica o texto, não pede permissão de notificação.

**Régua.** `functions/api/save.caderno.test.js`, `utils/cadernoSensivel.contract.test.ts`, `utils/focoTimer.test.ts`, `utils/cadernoLocal.test.ts`, `components/play/OficinaCaderno.render.test.tsx`, `utils/areaLotGeometry.contract.test.ts`, `components/nav/areaLotNpc.contract.test.tsx`.
