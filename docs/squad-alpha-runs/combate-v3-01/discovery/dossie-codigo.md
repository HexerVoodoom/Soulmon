# Dossiê de código — combate v3 (run `combate-v3-01`, Fase 0, validar-o-que-existe)

Curador: alpha-curador-de-contexto · 04/10/2026 · Escopo: "código real vs. mapa do handoff §5".
Código lido em `E:\soulmon-cv3` (worktree de origin/main). Caminhos abaixo relativos a ele, salvo indicação.

**Convenção de data.** As ferramentas não expõem mtime. A coluna Data traz a data escrita no próprio comentário/decisão do símbolo; sem ela, `[data desconhecida]`. Estado: canônico · rascunho · obsoleto · contraditório · duplicado.
**Limite.** Nada foi executado (sem shell). Afirmações sobre testes vêm de leitura estática.

## 0. Memória entre runs
`D:\Soulmon\repo\docs\squad-alpha-runs\memoria\` não existe (glob vazio). Nada "já sabido". Única irmã neste run: `combate-v3-01\discovery\benchmark.md` (não lida aqui).

## 1. Tabela símbolo × existe × onde × handoff certo?

| Símbolo | Existe | Caminho › símbolo | Data / estado | Handoff §5 descreve certo? |
|---|---|---|---|---|
| `PLAYER_STATS` | sim | `src/utils/dungeon.ts` › const exportada | `[data desconhecida]` · canônico | Parcial. Tem 7 chaves (`baby-i`, `baby-ii`, `rookie`…`ultra`), só `{hp, dmg}`: rookie 12/4, ultra 20/8. Alimenta **Masmorra e Pesadelo**, não a Arena. O comentário diz "Masmorra, Pesadelo e Arena de uma vez": é **falso para a Arena** (ver C3) |
| `playerStatsFor` | sim | `src/utils/dungeon.ts` › função | idem · canônico | Sim. Consumidores: `DungeonGame.tsx`, `NightmareBattle.tsx` |
| `getArenaPlayerStats` | sim | `src/utils/arena.ts` › função (+ `STAGE_BUDGET`, `ROLE_SHAPE`) | `[data desconhecida]` | Sim. É o **segundo** gerador de stats do jogador: rookie hp 34 / dmg 7, vezes forma da escola |
| `ARENA_HP_SCALE` | sim | `src/utils/arena.ts` = 1,9 | 04/10/2026 (§20.10) · canônico | Sim |
| `ARENA_FOE_HP_EXTRA` | sim | `src/utils/arena.ts` = 0,9 | 04/10/2026 · canônico | Sim |
| `TIER_BASE` | sim, **não exportada** | `src/utils/dungeon.ts` › `const TIER_BASE` (hp/atk/speed/points por tier) | `[data desconhecida]` | Sim, mas é módulo-privada: o v3 não a importa, só a substitui |
| `buildDungeonWave` | sim | `src/utils/dungeon.ts` | idem | Sim. **Usa `Math.random()`** (variância ±10% de HP) e é reusada por `buildNightmareWave` (`src/utils/nightmares.ts`) — handoff omite o Pesadelo como cliente |
| `buildArenaRound` | sim | `src/utils/arena.ts` | idem | Sim; recebe `rng` injetado (determinístico em teste) |
| `ArenaEnemy` | sim | `src/utils/arena.ts` › interface | idem | Sim |
| `tournamentNpcs` | sim | `src/utils/tournamentNpcs.ts` | 04/10/2026 (R8) | **Errado como "inimigos com stats"**: só tem `id/nome/arte` e `npcAtk(atk)=atk×0,85`. Stats do NPC = `duelStats` do próprio jogador (ver C5) |
| `SPECIAL_EFFECTS` | sim | `src/utils/arena.ts` › `Record<EscolaId, ArenaSpecialEffect>` | calibrado por `arena.test.ts` | Sim (valores na §3) |
| `ArenaSpecialEffect` | sim | `src/utils/arena.ts` | idem | Sim (campos mult/targets/echoMult/echoTurns/healFrac/weakenFrac/weakenTurns) |
| `SPECIAL_CHARGE_TURNS` | sim, **sem uso na tela** | `src/utils/arena.ts` = 3 | §20.10: "carga de turnos saiu da tela" | Handoff não avisa: só vive no caminho legado de `simulateArenaRun` |
| `playerHitDamage` / `enemyHitDamage` | sim | `src/utils/arena.ts` | idem | Sim |
| `CRIT_MULT` | sim | `src/utils/arena.ts` = 1,5 | idem | Sim. **Crítico é inalcançável no pet automático** (`ARENA_AUTO_ACC` 0,73 < `PERFECT_ACC` 0,92) |
| `accuracyScale` | sim | `src/utils/arena.ts` = `0,25 + 0,75·acc²` | idem | Sim |
| `elementMultiplier` | sim | `src/utils/arena.ts` | idem | Sim |
| `ADVANTAGE_MULT` / `DISADVANTAGE_MULT` | sim | `src/utils/arena.ts` = 1,3 / 0,8 | idem | Sim. Handoff cita "×1,3/×0,8" na Q5: correto |
| `simulateArenaRun` | sim (legado) | `src/utils/arena.ts` | idem | Sim, mas é o caminho **antigo** (carga em turnos + torcida ×1,35) atrás de `ARENA_ENERGY_ENABLED=false` |
| `simulateArenaRunEnergy` | sim | `src/utils/arena.ts` | 04/10/2026 | Sim. É a régua viva (`seconds` estimado por `strikeMs`/`defendMs`) |
| `energia.ts` | sim | `src/utils/energia.ts` | 04/10/2026 · canônico | Sim. **Reexporta de `functions/api/_duel.js`** as constantes de barra |
| `usePveBattle` | sim | `src/components/games/usePveBattle.ts` | 04/10/2026 | Sim (relógio, `running`, fix A3 está no `ArenaGame`, não aqui) |
| `_duel.js` `simulateDuel` / `duelStats` | sim | `functions/api/_duel.js` | 04/10/2026 · canônico | Sim. **Usa só atk escalar + HP; não usa ficha, elemento, precisão, crit nem `SPECIAL_EFFECTS`** (ver C4) |
| `SCHOOL_STRIKE_FORM` | sim | `src/utils/combatFx.ts` | 04/10/2026 | Sim |
| `ELEMENT_STRIKE_FORM` | sim | `src/utils/combatFx.ts` | 04/10/2026 | Sim |
| `SPECIAL_LABEL` / `specialLabel` | sim | `src/utils/combatFx.ts` = `{en:'SPECIAL!', pt:'ESPECIAL!'}` | 04/10/2026 | Sim |
| `StageSkill` / `buildStageSkills` | sim | `src/utils/soulProfile/ficha/skills.ts` | `[data desconhecida]` | **Parcial** — o especial **já tem nome gerado** (ver §4) |
| `computeDailyReset` | sim | `src/utils/dailyReset.ts` (l. ~786) | canônico | Sim, mas **não é onde o ponto diário caberia sem mudança**: ver §2 |
| hydrate fuzz2 = 103 | **sim** | `src/contexts/GameStateContext.hydrate.fuzz2.qa.test.tsx` › `expect(campos.length).toBe(103)` | 04/10/2026 | Sim. Conta chaves de `export interface GameState` em `GameStateContext.tsx` por regex; campo novo = 104 |
| `components/games/TorcidaKit.tsx`, `PveMechanics.tsx`, `BattleStage.tsx` (+`StageAction.strike`, `SpecialBanner`) | sim | `src/components/games/` | — | Sim |
| `ArenaGame/DungeonGame/NightmareBattle/DuelScreen.tsx` | sim | `src/components/` | — | Sim |
| `realSkillPower.ts`, `buildSheet.ts` | sim | `src/utils/soulProfile/ficha/` | — | Sim |
| `docs/manual/02-*` | sim, 1 doc | `docs/manual/02-REGRAS-DE-NEGOCIO.md` | — | Sim |
| `docs/manual/06` | é **pasta** `06-REFERENCIA/` | — | — | Handoff §6 fase 6 trata como doc; é diretório |
| `docs/PLANO-COMBATE-V3.md` + linha no `00-MAPA.md` | sim | `E:\soulmon-cv3\docs\manual\00-MAPA.md` l. 416 | 04/10/2026 | Já feito no worktree |

Símbolo extra que o handoff não cita e o v3 vai tocar: `torcida.ts` (`TORCIDA_PVE_SPECIAL_MULT=3`, `TORCIDA_BASE_FRAC=0.5`), `profissaoMasmorra.ts` (`jeitoDaProfissao`), `autoDefesa.ts`, `pveStrikeDamage`/`pveFoeHitDamage` em `energia.ts`.

## 2. Regra do dia que conta (prioridade 1)

### 2.1 Símbolo dono e condição exata
- **Dono:** `completeDayReached` em `src/utils/dailyReset.ts`:
  `registered > 0 && done >= goal && energy >= goal`
  (peso feito ≥ meta do dia, ≥1 item cadastrado, energia ≥ meta do dia). Comentário do código: "a MESMA meta nos dois eixos".
- **Quem chama:** `computeDailyReset` (`dailyReset.ts`): `dayWasPerfect = completeDayReached({registered: totalTasks, goal: dailyGoal, done: dailyDone, energy: prev.energyPoints ?? 0})`. Se verdadeiro: `newPerfectDays++`, `totalPerfectDays+1`, `missionPerfectDays+1`, `gamePoints + BITS_PER_COMPLETE_DAY`, XP de vínculo `perfectDay`, e grava `lastDayWasPerfect` + `lastDayReport.wasPerfect`.
- **Mesma função usada pela Home** (selo "Dia completo", `App.tsx` `diaCompletoHoje`) e pela celebração (`deveCelebrarDiaCompleto`). Nome no código: `perfectDays`/`dayWasPerfect`; na UI: "dia completo" (travado por `src/components/p5DiaCompleto.contract.test.ts`).
- Insumos: `done` = peso (esforço) de atividades concluídas + tarefas avulsas (`normalizeEffort`) do **dia julgado**; `goal` = `dailyGoalFor` = `min(cadastradas, FORM_REQUIREMENTS[estágio].required)`; `energy` = `energyPoints` (enche **comendo**, 1 por conclusão; zera na virada). `FORM_REQUIREMENTS` (`src/types/progression.ts`): rookie 4/cap 6 · champion 5/7 · ultimate 5/8 · mega 6/9 · ultra 6/10.

### 2.2 Nuances que afetam o "+1 por dia" da v3
1. **A virada julga UM dia: o último dia aberto** (`lastResetDate`), não "ontem" (decisão #58, 22/09/2026). Quem reabre depois de 3 dias recebe crédito de **um** dia, não três.
2. **Evolução é MANUAL.** `MANUAL_EVOLUTION = true` (`progression.ts`): o bloco de evolução automática dentro de `computeDailyReset` (`if (!MANUAL_EVOLUTION && …)`) é **código morto**. Quem evolui é `App.tsx` `handleEvolve` → `evolutionTarget`; zera `perfectDays` e `attributesSinceLastEvolution`. Gate: `perfectDays >= FORM_REQUIREMENTS[...].required` (`App.tsx` `canEvolve`), mais incubação (`incubationReady`).
3. **`perfectDays` ≠ "dia completo real".** Mexem nele: `computeDailyReset` (+1 por dia completo); **Glitchtama** (`src/utils/specialItemUse.ts`, `perfectDays: prev.perfectDays + 1`, **sem** somar `totalPerfectDays`); degeneração (`degeneratedPerfectDays`, custo `DEGENERATION_PERFECT_DAYS_COST`); evolução (zera). Logo `perfectDays` sobe e **desce**. Se a v3 disparar o ponto pelo delta de `perfectDays`, a Glitchtama daria ponto de combate e uma queda por HP "tiraria" dia.
   → **Gatilho correto para a v3:** `dayWasPerfect` dentro de `computeDailyReset` (ou `totalPerfectDays`, que só sobe e só conta dia real: comentário #41/#60).
4. **Nunca pune:** dia não completo não mexe em `perfectDays` (comentário no código). Compatível com a linha vermelha do handoff §8.
5. **Dia ausente conta se foi feito:** `dayWasPerfect` não depende de `wasAway`; só o perdão de HP depende.
6. **Dia de folga/descanso** (`restDay`): não altera `dayWasPerfect`; só absorve perda de coração. Não há "dia completo por descanso".

### 2.3 Testes que travam a regra
| Teste | O que trava |
|---|---|
| `src/utils/dailyReset.celebracao.test.ts` | `completeDayReached` ponto a ponto: meta de coração (parcial) não basta; `registered 0` → false; `done 5, energy 4` → false; `done 5` → true |
| `src/hooks/useDailyReset.test.ts` › "dia perfeito exige pelo menos 1 cadastrada" | 1 tarefa feita já é dia perfeito (`perfectDays` 1); nada cadastrado → false |
| `src/hooks/useDailyReset.test.ts` › "a energia é cobrada contra a meta do dia" | mega no sábado com meta 2: feito + energia 2 → perfeito; fez e **não comeu** → não perfeito |
| `src/hooks/useDailyReset.clock.test.ts` | relógio/salto de dias; "segundo salto não rende" |
| `src/utils/bond.diaCompleto.test.ts` | virada de dia completo soma exatamente `XP_PERFECT_DAYS` ao vínculo |
| `src/utils/dailyGoal.contract.test.ts`, `dailyGoalSources.test.ts` | meta anunciada = meta cobrada (UI × virada) |
| `src/components/p5DiaCompleto.contract.test.ts` | vocabulário "dia completo" na UI |
| `src/utils/evolutionTarget.regression.test.ts` | forma-destino (quem exibe = quem commita) |

### 2.4 "Galho dominante do DIA" (Q1): **não existe hoje**
- Não há tally por dia. O que existe é **acumulado** desde a última evolução: `attributesSinceLastEvolution {power,harmony,benevolence}` (soma em `careRules.ts › feedFood`, `App.tsx` l. ~597–603 e `specialItemUse.ts`), zerado em evolução/degeneração, e os totais vitalícios `powerPoints/harmonyPoints/benevolencePoints`.
- Os pontos vêm de **comer** (`CATEGORY_ATTRIBUTES`, `src/types/attributes.ts`, ex. Creativity 3/1/0, Study 0/3/1, Discipline 0/1/3) — não da conclusão direta. `Guloso` soma +1 no atributo líder da comida.
- `activityLog` é `string[]` (`GameStateContext.tsx`), sem data/categoria estruturada: **não dá para recomputar** o galho do dia a partir dele sem ler `careHistory`/`completedTasks`. [Não verificado em detalhe: `careHistory` em `carePattern.ts`.]
- **Cálculo mais próximo:** `branchLeaders` + `resolveBranch` (`src/utils/carePattern.ts`) escolhem o galho de uma **evolução** sobre pontos acumulados. Empate: `leaders` na ordem fixa `['power','harmony','benevolence']`; com leitura de ritmo confiável (`reading.confident`) decide o padrão de cuidado; senão `currentBranch` se estiver entre os líderes; senão `leaders[0]` (power). Todos zero: padrão ou `fallback`.
- **Divergência interna já existente:** o caminho morto de `computeDailyReset` escolhe o galho por `attributesSinceLastEvolution` com empate `power > harmony > benevolence`; o caminho vivo (`handleEvolve`/`evolutionTarget`) usa `powerPoints…` **vitalícios** + `careHistory`. Duas fontes para "galho dominante" (footgun 9).
- **Implicação:** o "galho do dia" da Q1 é **dado novo** (delta de atributos no dia julgado), com regra de empate nova. O handoff §2.3 diz "ligado ao galho que mais cresceu no dia" como se existisse; **não existe**.

## 3. Como combate funciona HOJE (prioridade 2): fórmulas reais

Existem **três motores de combate paralelos**, não um:

| Motor | Usado por | Stats do jogador | Inimigo | Golpe do pet | Golpe do inimigo |
|---|---|---|---|---|---|
| **A. PvE Masmorra/Pesadelo** | `DungeonGame.tsx`, `NightmareBattle.tsx` via `usePveBattle` | `playerStatsFor(estágio)` (hp 10–20, dmg 3–8) × `jeito` da profissão (hp, dmg) × `PVE_HP_SCALE` 1,8 no HP | `buildDungeonWave`: `TIER_BASE` × (hp 1+0,14·step, atk 1+0,2·step, `dmgReduction` min(0,72; 0,11·step)); HP × `PVE_HP_SCALE` × `PVE_FOE_HP_EXTRA` 1,1 (`pveFoeHp`) | `pveStrikeDamage` = `round(dmg × 0,5 × (especial ? 3 × anel : 1) × (1 − guard))`, mín. 1 | `pveFoeHitDamage` = `max(1, ceil(atk·(1−acc)) − reducaoDano)`; especial ×2 × (1 − esquiva); `acc ≥ perfect` = bloqueia (0) + contra-ataque |
| **B. Arena (Duelo)** | `ArenaGame.tsx` | `getArenaPlayerStats(estágio, escolaBásica, 1,9)` | `buildArenaRound` (5 rodadas; curva `MEDIUM_HP_BASE 15`, `ATK 5`, +13%/rodada, +15%/dificuldade; forma por bestiário ±15%); HP × 1,9 × 0,9 | `playerHitDamage` = `max(1, round(dmg × skillMult × accuracyScale(acc) × crit × elemento))`; `acc = 0,73` fixo | `enemyHitDamage` = `max(1, ceil(atk·(1−defAcc) × elemento(1,3/0,8) × (fraco ? 0,7 : 1)))`; esquiva perfeita (`defAcc ≥ 0,92`) = 0 |
| **C. PvP/NPC Torneio** | `functions/api/_duel.js` (servidor decide) · `DuelScreen.tsx` · `TournamentPage.tsx` (treino/NPC) | `duelStats`: hp `140 + 12·estágio`; atk `10 + 1,2·estágio + min(2, soma_attrs/50)` | mesmo `duelStats` do oponente | `dmg = max(1, round(atk × (1 ± 0,74 aleatório)))`, especial ×2 por energia cheia | idem, simétrico; sem esquiva, anel, crit, elemento |

Observações: o Pesadelo usa o motor A **sem** `jeito` (`NightmareBattle` usa `base.dmg` cru) — a Masmorra aplica `jeito`.
**Ordem de golpe no PvP:** quem tem maior `atk` começa (`simulateDuel`); empate sorteia. Nos motores A/B o pet começa. **Não existe velocidade** em A/B: `speed` do inimigo está nos tipos (`DungeonEnemy.speed`, `ArenaEnemy.speed`) mas é resíduo do tempo da barra de timing; o ritmo real é `PVE_STEP_MS` (1,7 s) fixo por lado, igual para todos.

Constantes de energia (única fonte `_duel.js`): `DUEL_ENERGY_MAX 100`, `DEALT 9`, `TAKEN 7`, `CHEER 36`, `DUEL_TAPS_FULL 24`, `DUEL_TAPS_CAP 16`, `DUEL_SPECIAL_MULT 2` (PvP). PvE: `PVE_SPECIAL_MULT 3`, `PVE_FOE_SPECIAL_MULT 2`, `RING_MULT {0,75; 1; 1,35}`, `DODGE_REDUCE {0; 0,5; 0,85}`.

### Fontes de não-linearidade hoje (o modelo linear v3 substitui ou fica "por cima")
| # | Fonte | Onde | Efeito sobre a linearidade |
|---|---|---|---|
| N1 | `accuracyScale = 0,25+0,75·acc²` (quadrática) | `arena.ts` | Dano da Arena não é linear em nada |
| N2 | `CRIT_MULT 1,5` | `arena.ts` | Inalcançável no pet auto (0,73 < 0,92), mas vive em `playerHitDamage` e na simulação com `accMean` |
| N3 | Elemento ×1,3 / ×0,8 (ataque e defesa) | `arena.ts` `elementMultiplier`, `enemyHitDamage` | Q5 do dono já decidiu ±1 golpe; **só a Arena usa elemento**. Masmorra/Pesadelo "não conhecem elemento" (`attackFxArt.ts` cabeçalho) |
| N4 | `ceil(atk × (1 − acc))` com `acc` sorteado `0,70 ± 0,25` (`defenseRoll`) | `energia.ts` `pveFoeHitDamage`, `autoDefesa.ts` | Dano recebido é variável por golpe e é **sorteio**, não função de DEF |
| N5 | Bloqueio perfeito (`acc ≥ 0,92`) = dano 0 + contra-ataque | `usePveBattle`, `DungeonGame` | Esquiva de ~mesma probabilidade que a curva; "aguenta +1 golpe por DEF" não vale |
| N6 | Anel ×0,75/×1/×1,35 (jogador) | `energia.ts` `RING_MULT` | Especial do pet depende de habilidade; v3 precisa fixar `E` e decidir se o anel fica "por cima" |
| N7 | Esquiva do inimigo-especial −50%/−85% | `energia.ts` `DODGE_REDUCE` | idem, defensiva |
| N8 | Torcida: energia por cheer (+36 por 24 toques) | `energia.ts`, `_duel.js` | Soma energia; o ritmo do especial é função de toques |
| N9 | Variância do golpe PvP `1 ± 0,74` | `_duel.js` `DUEL_DMG_SPREAD` | Ruído enorme: "9 golpes em vez de 10" não é observável; o handoff não menciona |
| N10 | `dmgReduction` do inimigo (`min(0,72; 0,11·step)`) | `dungeon.ts` | Percentual sobre dano; escada vira "pontos acima/abaixo" na v3 (§2.4 do plano) |
| N11 | `jeito` da profissão: hp ×, dmg ×, `reducaoDano`, `contraAtaque`, `atravessaGuarda`, `perfeito` | `src/utils/profissaoMasmorra.ts` | **Camada multiplicativa sobre `PLAYER_STATS` na Masmorra; o handoff não a cita** (ofícios: ferreiro hp×1,15, artesão dmg×1,1, curtidor −1 dano, encantador guarda×0,5, joalheiro perfeito 0,89, alquimista contra ×2) |
| N12 | `playerStatsFor` por estágio (hp 10→20, dmg 3→8) | `dungeon.ts` | Já é "crescimento por estágio"; conflita com 1/1/1/10 + boost ×1,5 (rookie hoje hp 12/dmg 4) |
| N13 | `ROLE_SHAPE` por escola (hp×dmg ≈ 1) | `arena.ts` | Escola muda hp/dmg na Arena; no v3 o "role" sai dos atributos? **Decisão do dono em aberto** |
| N14 | `Math.random()` em `buildDungeonWave` e `ArenaGame` (`buildArenaRound(..., Math.random, ...)`) | `dungeon.ts`, `ArenaGame.tsx` l. 219 | Impede simulação determinística fiel do jogo; só `arena.ts` aceita rng injetado |
| N15 | `ECHO` (`evocacao`), `weaken` (`maldicao`), `healFrac` | `arena.ts` `SPECIAL_EFFECTS` | Já são "famílias" ad hoc: ver §4 |
| N16 | `ROUND_CLEAR_HEAL 0,3` entre rodadas; `curaAndar` do ofício | `arena.ts`, `profissaoMasmorra.ts` | Recuperação fora da conta de golpes |
| N17 | `STAGE_POWER` do PvP (`rookie 1 … ultra 5`) + `attrSum/50` capado em 2 | `_duel.js` | Segunda "economia de estágio"; atributo de ramo (`power/harmony/benevolence`) entra no atk **PvP** — risco de **duas fontes** com o `combatStats` novo (footgun 9) |

## 4. Especiais hoje (prioridade 3)

- **Como a energia dispara.** `usePveBattle.ts`: `energyFull(pE) → special`; gasta `spendEnergy`; abre o ANEL; `playerStrike({special, ring})`. Energia sobe `dealt +9` ao atacar, `taken +7` ao apanhar, `cheer +36` por barra de 24 toques cheia. Inimigo: mesma barra; especial dele = golpe normal × 2, esquivável. Arena: `simulateArenaRunEnergy` espelha o mesmo laço.
- **PvP:** `simulateDuel` — `enMe >= 100` → `special`, `mult *= 2`; cheer despeja 36. Sem anel/esquiva (servidor recalcula).
- **Valores `SPECIAL_EFFECTS`** (`arena.ts`; só a **Arena** os aplica por escola):

| Escola | mult | alvos | extras |
|---|---|---|---|
| `combate_fisico` | 2,6 | 1 | — |
| `longo_alcance` | 2,0 | 2 | — |
| `conjuracao` | 2,0 | todos | — |
| `evocacao` | 1,2 | 1 | eco 0,5 × 2 turnos |
| `benca` | 1,5 | 1 | cura 10% do HP máx |
| `maldicao` | 2,2 | 1 | inimigos −30% dano × 2 turnos |

- **Masmorra/Pesadelo/PvP não usam `SPECIAL_EFFECTS`.** Especial lá é só `×3 × anel` (PvE) ou `×2` (PvP), **sem família**. O handoff §5 põe `SPECIAL_EFFECTS` em "Especiais atuais" sem avisar que só a Arena o consome.
- **`evocacao` nunca é a escola de uma skill de ficha:** `escolaDominante()` em `skills.ts` varre `DISTRIBUIDAS` = `[combate_fisico, longo_alcance, conjuracao, benca, maldicao]` (sem evocação, "valor fixo"). `NOMES.evocacao` e `SPECIAL_EFFECTS.evocacao` existem, mas só seriam atingidos por `buildDefaultArenaSkills`? (não: usa `combate_fisico`). Efeito: o eco da evocação é **código inalcançável via ficha**; "evocacao → DoT/eco" do §3 do plano parte de uma escola que a ficha não produz. [Verificação por busca em `ficha/`; não rodei o gerador.]
- **Nome do especial: JÁ é gerado.** `buildStageSkills` (`skills.ts`): nome = substantivo (6 por escola × tipo, sorteio por `mulberry32(hashString(\`${seedKey}|skills|${stage}\`))`, sem repetir entre estágios via `usados`) + nome do elemento (`especial` = elemento mais avançado da ficha). Ex.: "Fúria de Vigor"/"Vigor Fury". `descricao` = template fixo com recurso. `custo` 'alto'. `poder` opcional (`realSkillPower.ts`: especial `×0,85`, passo 3).
  - Determinístico (mesmo seed → mesmo nome), EN+PT, **por estágio** (5 nomes por criatura; evolui o nome, responde Q6 parcialmente: hoje muda a cada estágio).
  - **Não usa** personalidade/`soulProfile`, atributos, forma de golpe, **nem família de efeito** — só escola × elemento × recurso (recurso entra só na descrição).
  - **Onde aparece hoje:** `PetPage.tsx` (`SkillRow`), `ArenaGame.tsx` (título do toast ao conjurar l. ~356 e linha de ficha), `arena/DueloSheet.tsx`. **Não aparece** em `DungeonGame`, `NightmareBattle`, `DuelScreen` (usam só o selo genérico `specialLabel`). Confirma a "pendência da R8" do handoff.
- `StageSkill` tem `nome`, `descricao`, `elementoId`, `elementoNome`, `escolaId`, `recursoId`, `custo`, `poder?` — **sem campo `familia`/`forma`**; precisa de campo novo (e sanear em save/hidratação, se a skill for persistida: não verificado onde `skills` são persistidas).

## 5. Contradições e discrepâncias (os dois trechos; sem escolher vencedor)

| # | Contradição | Trecho A | Trecho B |
|---|---|---|---|
| C1 | **Dia que conta ≠ `perfectDays`** | Plano §2.3: "+1 ponto por dia … **Só em dia completo?** (Q2)"; contexto Q2: "mesma regra que o jogo já usa" | `specialItemUse.ts`: Glitchtama dá `+1 perfectDays` sem dia real; `computeDailyReset`: `totalPerfectDays` só sobe em `dayWasPerfect`. Duas candidatas a "mesma regra": o dono precisa dizer se 🌀 dá ponto de combate (provável não) |
| C2 | **"Galho que mais cresceu no dia" não existe** | Plano §2.3 sugere esse cálculo como se fosse reaproveitável | Código só tem acumulado desde a evolução (`attributesSinceLastEvolution`) e vitalício; empate hoje = `power` > `harmony` > `benevolence` (ordem de `branchLeaders`) ou padrão de cuidado |
| C3 | **Cabeçalho de `PLAYER_STATS` mente** | `dungeon.ts`: "mexer aqui muda a Masmorra, o Pesadelo **e a Arena** de uma vez" | `arena.ts`: `getArenaPlayerStats` tem tabela própria (`STAGE_BUDGET`); `ArenaGame` não importa `PLAYER_STATS`. `autoDefesa.ts` repete o texto |
| C4 | **Handoff §2.4 trata "inimigos" como uma tabela única a substituir** | Plano §2.4: "substitui `TIER_BASE` … e o `dmg/hp` de `PLAYER_STATS` / `getArenaPlayerStats`" | Há **três** tabelas (A/B/C) e `duelStats` (PvP) **não é citada** como a que substitui; PvP é servidor-autoritativo e perfil público envia `attrs`, não stats de combate |
| C5 | **`tournamentNpcs` não tem stats** | Plano §5 linha "Inimigos": "NPCs `utils/tournamentNpcs.ts` (R8)" | Arquivo: só id/nome/arte + `npcAtk = atk × 0,85`; stats vêm de `duelStats` do jogador em `TournamentPage.tsx` (`duelStats({stage})` para `me` e `sombra`) |
| C6 | **Cabeçalho de `arena.ts`: "SEM CONSUMIDOR"** | `arena.ts` l.1–15: "nenhuma tela chama nada daqui (verificado em 07/09/2026)" | `ArenaGame.tsx` importa ~15 símbolos de `arena.ts`; REGISTRO §20.6/§20.10 descrevem a Arena em produção. Cabeçalho **obsoleto** |
| C7 | **Torcida: header de `_duel.js`** | `_duel.js` bloco "TORCIDA POR TOQUES": "gauge de `DUEL_TAPS_FULL` toques; … golpe ESPECIAL (×`DUEL_SPECIAL_MULT`)" e "`DUEL_CHEER_STRIKES`" | Código vivo: energia (+9/+7/+36), `DUEL_CHEER_STRIKES` é legado (`TIMING_CHEER_ENABLED=false`). REGISTRO §20 itens 1/6/9 trazem números de **8/10/1,35** (obsoletos) e item 10 os troca por 24/16/×2 |
| C8 | **Handoff §3/§5: velocidade** | Plano §2.2: `ataquesPorJanela = 8 + spd`, "torcida e energia continuam por cima" | Hoje **não há `spd`** em A/B (ritmo fixo `PVE_STEP_MS`); em PvP a ordem vem de `atk`. Velocidade vira conceito **novo** nos 3 motores |
| C9 | **Handoff §0 cita "REGISTRO §20 … §23" como regras vigentes** | — | §20 itens 1/6/9 estão marcados ⚰️ reescritos (item 10); o número vigente é o do item 10. Ver §6 |
| C10 | `00-MAPA.md` l. 416 declara PLANO "(em validação)" | `PLANO-COMBATE-V3.md` §0 manda trabalhar "a partir dele" | Estado coerente; só assinalo que o guard `(e)` (Dono/Verificação) vale para docs **do manual**, e o PLANO está em `docs/`, fora de `manual/` |

## 6. Regras vigentes de REGISTRO §20 e §23 que a v3 contradiz ou reabre

(Itens "vigentes" = o que sobrou depois do item 10 do §20.)

| Regra vigente | Fonte | Como a v3 a contradiz |
|---|---|---|
| Energia por lutador: +9 dado, +7 sofrido, +36 cheer; barra 100; cheer 24 toques (cap 16) | §20.10; `_duel.js` | O especial continuar "disparado por energia" (plano §2.2) **mantém**; mas `E`, `JANELA` e o ritmo de ataque precisam recalibrar `DUEL_ENERGY_*` (a energia depende de nº de golpes por tempo; SPD muda isso) |
| Especial PvE = ×3 × anel (ruim 0,75, bom 1, ótimo 1,35); especial inimigo ×2 esquivável; PvP especial ×2 direto | §20.10; `energia.ts` | O orçamento `E` golpes (plano §3) **substitui** os multiplicadores; anel/esquiva ficam "por cima" e quebram a paridade de tempo salvo decisão do dono. §20.10 lista "o ANEL, ±120/320 ms, o 1,5–2,1 s, deslize 50/85%, 2×, 24" como **escolhas do dono em aberto** — a v3 mexe em todas |
| Dano = HP×2 (PvP 140+12/estágio); atk `10+1,2·e`; variância ±0,74; 26 golpes ≈ 35–42 s | §20.10; `_duel.js` | Plano §2.1 `golpesParaDerrubar = hp + def − atk` com `hpMax/golpes` exato **elimina** a variância ±0,74; duração PvP 35–42 s precisa recalibrar `JANELA`/`DUEL_MAX_TURNS` |
| PvE ~20–29 s por inimigo (3,4 s ida-e-volta, `PVE_STEP_MS` 1,7 s), `PVE_HP_SCALE` 1,8, `PVE_FOE_HP_EXTRA` 1,1 | §20.10; `energia.ts` | Substituídos por `golpesParaDerrubar` + SPD; "Q3" (piso/teto) em aberto |
| Defesa automática `0,70 ± 0,25`, bloqueio perfeito `≥ perfeito` (0) + contra-ataque; ofícios modulam | §20.8; `autoDefesa.ts`, `profissaoMasmorra.ts` | Plano não menciona; DEF linear ("aguenta +1 golpe") **conflita** com bloqueio probabilístico e `reducaoDano` fixo do curtidor. Decisão do dono ausente |
| Elemento ×1,3/×0,8 na Arena | `arena.ts`; calibração §20.10 (59,4%) | Q5 respondida: ±1 golpe. Re-roda a calibração 40–80% / spread ≤ 20pp |
| "A torcida só SOMA" e "teto de ganho forjado = `DUEL_CHEER_WINDOWS × DUEL_TAPS_CAP`" | `_duel.js`, §20 | Preservar (linha vermelha de servidor decide) |
| Perder luta não custa coração nem nada do pet | §20.1, `dungeon.ts` cabeçalho | Compatível |
| §23: NPC do Torneio vazio = treino disfarçado, **não** conta partida, sem Honra/pontos/XP/missão; estágio do jogador; atk 0,85× | §23.4; `tournamentNpcs.ts` | Atributos novos têm de passar também pelo treino/NPC (`duelStats` local). A regra "NPC 0,85× atk" **não é linear** (atk fracionário 0,85×) — vira "−N pontos" |
| §23: Mestre/Grão-Mestre por posição; `rank`/`myPlace`; molduras `ownedFrames/equippedFrame` | §23.1–3 | **Não colide**; mas a v3 adiciona campo ao `GameState` → **104** no teste `fuzz2` (e `ownedFrames/equippedFrame` já estão nos 103), e `save.js` precisa sanear (padrão do §23.3 e do Caderno) |

## 7. Vazios (o que se esperaria achar e não existe)
- **Nenhum campo `combatStats`/`atk/def/spd` no save.** Busca: `combatStats`, `golpesParaDerrubar`, `BASE_RITMO`, `ataquesPorJanela`, `intervalo(` em `src/` e `functions/` — sem ocorrências no código de produção (só no plano). [Busca por variantes `atk`: só em tipos de inimigo/`duelStats`.]
- **Nenhum "ganho diário de atributo de combate"** em `computeDailyReset`. A virada não toca atributo de combate nenhum; o ganho de ramo vem de comer.
- **Sem tally de galho por dia** (§2.4).
- **Sem família de especial no tipo `StageSkill`** (`familia`, `forma`).
- **Sem teste de paridade de tempo** entre famílias (`arena.test.ts` mede win rate, não tempo de vitória; `simulateArenaRunEnergy` devolve `seconds` mas é só ruído estimado por `strikeMs/defendMs`).
- **Sem paridade cliente/servidor para stats:** hoje só as constantes de energia são compartilhadas por import (`energia.ts` → `_duel.js`; travado em `energia.test.ts`). Os stats PvE não existem no servidor; os do PvP existem só no servidor (cliente importa `duelStats` do mesmo `.js`).
- **Docs de combate:** `docs/manual/02-REGRAS-DE-NEGOCIO.md` é o único doc de combate no manual (44 menções de combate/Arena/Masmorra); não há `docs/manual/06-*` doc único (é pasta). Não lido em detalhe.
- **Memória entre runs** (vazia).
- `contexto.md` §2.2: Q3, Q6, Q7, Q8, Q9 abertas — nada no código as responde. Q6 tem fato: hoje o nome do especial **já muda a cada estágio** (re-sorteio por `stage`), mas o poder não cresce por estágio no combate (a Arena usa `STAGE_BUDGET`).

## 8. Guard `docsManual.contract.test.ts` × `docs/squad-alpha-runs` (checkout `D:\Soulmon\repo`)
- `.gitignore` do repo ignora `squad-alpha-runs` (`D:\Soulmon\repo\.gitignore` l. 9; no worktree, `squad-alpha-runs/`).
- Guard (a) `mdEm(DOCS, ['historico-digiapp'])` **lê do disco** e ignora só `historico-digiapp`: varre `docs/squad-alpha-runs/**`. Para cada `.md` exige que `docs/manual/00-MAPA.md` inclua o caminho relativo (`squad-alpha-runs/combate-v3-01/contexto.md`) ou o mesmo sem `manual/`.
- O `00-MAPA.md` do repo só cita `squad-alpha-runs/` como **diretório** (l. 353: "ADR nova nasce aqui, não em `squad-alpha-runs`" e "cópias fiéis dos originais de `squad-alpha-runs/`") — **não** cita nenhum arquivo `.md` desse run.
- **Conclusão (leitura estática, não executei vitest):** localmente em `D:\Soulmon\repo`, `contexto.md`, `discovery/benchmark.md` e este `dossie-codigo.md` **fazem o guard (a) falhar** ("docs sem entrada no 00-MAPA.md"). Em CI/clone limpo a pasta não existe (git-ignored) e o teste passa. Os guards (b) (links), (d) (arquivo:linha) e (e) (Dono/Verificação) só varrem `docs/manual/`, não afetam.
- Opções (decisão do dono do repo, não minha): apagar/mover os `.md` do run antes de rodar vitest local; ou rodar a suíte só no worktree `E:\soulmon-cv3` (limpo, sem `squad-alpha-runs`); ou exceção no guard (`ignorar` incluir `squad-alpha-runs`), que muda código de teste.

## 9. Ordem de leitura recomendada (as 3 leituras que mais economizam tempo)
1. `src/utils/dailyReset.ts` › `completeDayReached` + bloco `dayWasPerfect`/`newPerfectDays` em `computeDailyReset` (e `src/types/progression.ts` `MANUAL_EVOLUTION`, `FORM_REQUIREMENTS`): fecham a Q2 e mostram que evolução é manual e que `perfectDays` não é "dia real".
2. `src/utils/arena.ts` (do `elementMultiplier` ao `simulateArenaRunEnergy`) + `src/utils/energia.ts` + `functions/api/_duel.js` `simulateDuel`: os três motores de dano, o anel/esquiva e a paridade de energia.
3. `src/utils/soulProfile/ficha/skills.ts` (`buildStageSkills`, `escolaDominante`) + `src/utils/profissaoMasmorra.ts`: o nome do especial já existe (e `evocacao` é inalcançável via ficha); o `jeito` multiplica a Masmorra e quebra a linearidade.
Depois: `REGISTRO-DE-DECISOES.md` §20 **item 10** (não os itens 1/6/9, obsoletos) e §23.4.
