# Referência — `src/utils`

> **Dono:** doc-redator-referencia · **Data:** 09/09/2026 · **Estado:** verificado em 10/09/2026 por doc-verificador (mecânico completo; descrição por amostra dirigida de 15 módulos)
> **Verificação:** `npx vitest run src/docsManual.contract.test.ts` (item c — cobertura) + os testes listados em **Régua** de cada módulo.
> **Não cobre:** o CONTEÚDO das regras de jogo em profundidade (→ [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md)); componentes, hooks, contexts, types, plugins, constants, `functions/api`, `workers/` e `desktop/` (→ os outros docs de `06-REFERENCIA/`).
> **Precedência:** código > teste > `CLAUDE.md` > este documento. Onde discordarem, o código está certo e este doc tem defeito.

Cobertura: **120/120** módulos de `src/utils` (inclui `src/utils/soulProfile/`), medidos por `node scripts/docs-inventario.mjs` em 09/09/2026. Ordem do corpo: alfabética por caminho. Índice abaixo: agrupado por família.

## Índice por família

**Cuidado (corações, comida, ritmo, sono, renascimento)** — [`adventure.ts`](#srcutilsadventurets), [`anniversary.ts`](#srcutilsanniversaryts), [`bond.ts`](#srcutilsbondts), [`careCaps.ts`](#srcutilscarecapsts), [`carePattern.ts`](#srcutilscarepatternts), [`careRules.ts`](#srcutilscarerulests), [`careUpdaters.ts`](#srcutilscareupdatersts), [`collectionDates.ts`](#srcutilscollectiondatests), [`dayKeyLabel.ts`](#srcutilsdaykeylabelts), [`dailyReset.ts`](#srcutilsdailyresetts), [`evolutionTarget.ts`](#srcutilsevolutiontargetts), [`firstDay.ts`](#srcutilsfirstdayts), [`memories.ts`](#srcutilsmemoriests), [`mood.ts`](#srcutilsmoodts), [`nightmares.ts`](#srcutilsnightmarests), [`passives.ts`](#srcutilspassivests), [`petName.ts`](#srcutilspetnamets), [`petNeeds.ts`](#srcutilspetneedsts), [`petStage.ts`](#srcutilspetstagets), [`petVoice.ts`](#srcutilspetvoicets), [`poopDrain.ts`](#srcutilspoopdraints), [`rebirth.ts`](#srcutilsrebirthts), [`restWindow.ts`](#srcutilsrestwindowts), [`specialItemUse.ts`](#srcutilsspecialitemusets), [`steps.ts`](#srcutilsstepsts), [`welcomeBack.ts`](#srcutilswelcomebackts)
**Tarefas e hábitos** — [`goalToCategory.ts`](#srcutilsgoaltocategoryts), [`habitCreate.ts`](#srcutilshabitcreatets), [`habitRhythm.ts`](#srcutilshabitrhythmts), [`quickAdd.ts`](#srcutilsquickaddts), [`rituals.ts`](#srcutilsritualsts), [`taskSuggestions.ts`](#srcutilstasksuggestionsts), [`taskTriage.ts`](#srcutilstasktriagets), [`tinyOffer.ts`](#srcutilstinyofferts), [`weekBalance.ts`](#srcutilsweekbalancets)
**Economia (moedas, loja, monetização)** — [`backgrounds.ts`](#srcutilsbackgroundsts), [`currencies.ts`](#srcutilscurrenciests), [`entitlements.ts`](#srcutilsentitlementsts), [`missions.ts`](#srcutilsmissionsts), [`monetization.ts`](#srcutilsmonetizationts), [`offerMoment.ts`](#srcutilsoffermomentts), [`playBilling.ts`](#srcutilsplaybillingts), [`priceLabel.ts`](#srcutilspricelabelts), [`seasons.ts`](#srcutilsseasonsts), [`shop.ts`](#srcutilsshopts), [`shopBuy.ts`](#srcutilsshopbuyts), [`weeklyMissions.ts`](#srcutilsweeklymissionsts)
**Jogos (arena, masmorra, torneio)** — [`arena.ts`](#srcutilsarenats), [`dungeon.ts`](#srcutilsdungeonts), [`dungeonScenes.ts`](#srcutilsdungeonscenests), [`fxArt.ts`](#srcutilsfxartts), [`tournamentSeason.ts`](#srcutilstournamentseasonts), [`tournamentTiers.ts`](#srcutilstournamenttiersts)
**Oráculo, ficha e sprites** — [`adventureArt.ts`](#srcutilsadventureartts), [`decorArt.ts`](#srcutilsdecorartts), [`achievements.ts`](#srcutilsachievementsts), [`animArt.ts`](#srcutilsanimartts), [`attackFxArt.ts`](#srcutilsattackfxartts), [`emblemArt.ts`](#srcutilsemblemartts), [`gainArt.ts`](#srcutilsgainartts), [`hudArt.ts`](#srcutilshudartts), [`placeholderArt.ts`](#srcutilsplaceholderartts), [`sigilArt.ts`](#srcutilssigilartts), [`dreamArt.ts`](#srcutilsdreamartts), [`elementIconArt.ts`](#srcutilselementiconartts), [`gateDraft.ts`](#srcutilsgatedraftts), [`itemArt.ts`](#srcutilsitemartts), [`libraryNpcs.ts`](#srcutilslibrarynpcsts), [`newReading.ts`](#srcutilsnewreadingts), [`oracle.ts`](#srcutilsoraclets), [`oracleDraft.ts`](#srcutilsoracledraftts), [`pixelizer.ts`](#srcutilspixelizerts), [`soulProfile/astrology/chart.ts`](#srcutilssoulprofileastrologychartts), [`soulProfile/astrology/prominence.ts`](#srcutilssoulprofileastrologyprominencets), [`soulProfile/astrology/types.ts`](#srcutilssoulprofileastrologytypests), [`soulProfile/axes.ts`](#srcutilssoulprofileaxests), [`soulProfile/bestiary/select.ts`](#srcutilssoulprofilebestiaryselectts), [`soulProfile/cities.ts`](#srcutilssoulprofilecitiests), [`soulProfile/derivedElements.ts`](#srcutilssoulprofilederivedelementsts), [`soulProfile/essenceLabels.ts`](#srcutilssoulprofileessencelabelsts), [`soulProfile/ficha/buildSheet.ts`](#srcutilssoulprofilefichabuildsheetts), [`soulProfile/ficha/capture.ts`](#srcutilssoulprofilefichacapturets), [`soulProfile/ficha/cascata.ts`](#srcutilssoulprofilefichacascatats), [`soulProfile/ficha/classTitle.ts`](#srcutilssoulprofilefichaclasstitlets), [`soulProfile/ficha/fromInput.ts`](#srcutilssoulprofilefichafrominputts), [`soulProfile/ficha/realEngine.ts`](#srcutilssoulprofileficharealenginets), [`soulProfile/ficha/realSkillPower.ts`](#srcutilssoulprofileficharealskillpowerts), [`soulProfile/ficha/skills.ts`](#srcutilssoulprofilefichaskillsts), [`soulProfile/ficha/types.ts`](#srcutilssoulprofilefichatypests), [`soulProfile/identity.ts`](#srcutilssoulprofileidentityts), [`soulProfile/index.ts`](#srcutilssoulprofileindexts), [`soulProfile/numerology.ts`](#srcutilssoulprofilenumerologyts), [`soulProfile/personality/labels.ts`](#srcutilssoulprofilepersonalitylabelsts), [`soulProfile/personality/questions.ts`](#srcutilssoulprofilepersonalityquestionsts), [`soulProfile/personality/scoring.ts`](#srcutilssoulprofilepersonalityscoringts), [`soulProfile/personality/types.ts`](#srcutilssoulprofilepersonalitytypests), [`soulProfile/pipeline.ts`](#srcutilssoulprofilepipelinets), [`soulProfile/profile.ts`](#srcutilssoulprofileprofilets), [`soulProfile/ritualAnswers.ts`](#srcutilssoulprofileritualanswersts), [`soulProfile/types.ts`](#srcutilssoulprofiletypests), [`spriteCopy.ts`](#srcutilsspritecopyts), [`spriteGen.ts`](#srcutilsspritegents), [`spriteLibrary.ts`](#srcutilsspritelibraryts), [`spriteRunner.ts`](#srcutilsspriterunnerts), [`spriteTrigger.ts`](#srcutilsspritetriggerts), [`sprites.ts`](#srcutilsspritests)
**Som** — [`audioBus.ts`](#srcutilsaudiobusts), [`loudness.ts`](#srcutilsloudnessts), [`sounds.ts`](#srcutilssoundsts)
**Persistência (save, conta, storage)** — [`accountData.ts`](#srcutilsaccountdatats), [`auth.ts`](#srcutilsauthts), [`cloudSave.ts`](#srcutilscloudsavets), [`consent.ts`](#srcutilsconsentts), [`playerDay.ts`](#srcutilsplayerdayts), [`safeStorage.ts`](#srcutilssafestoragets), [`serverConfig.ts`](#srcutilsserverconfigts), [`storageKeys.ts`](#srcutilsstoragekeysts)
**Push e notificações** — [`notifications.ts`](#srcutilsnotificationsts), [`pushPriming.ts`](#srcutilspushprimingts), [`vapid.ts`](#srcutilsvapidts)
**Comunidade e chat** — [`chatKeywords.ts`](#srcutilschatkeywordsts), [`chatSafety.ts`](#srcutilschatsafetyts), [`community.ts`](#srcutilscommunityts)
**Utilidades gerais** — [`aiClient.ts`](#srcutilsaiclientts), [`i18n.ts`](#srcutilsi18nts), [`telemetry.ts`](#srcutilstelemetryts), [`tzOffset.ts`](#srcutilstzoffsetts), [`weekdays.ts`](#srcutilsweekdaysts)

## Módulos (ordem alfabética)

### `src/utils/accountData.ts`
**Dono de:** Cliente das rotas de CONTA (`functions/api/account.js`): exportação e exclusão dos dados que o servidor guarda — só transporta, o contrato é do servidor.
**Exports:**
- `Bilingual` (interface) — Par de idioma como o servidor manda (`COPY`/`NOT_INCLUDED` em account.js).
- `NotIncludedItem` (interface) — campos: `what`.
- `AccountExport` (interface) — campos: `format`, `generatedAt`, `account`, `aviso`, `data`, `naoIncluido`.
- `DeletePlan` (interface) — O inventário: o coração da tela de exclusão.
- `DeleteRequest` (interface) — campos: `confirmToken`, `expiresInSeconds`, `plano`, `naoIncluido`, `aviso`, `prazo`.
- `DeleteDone` (interface) — campos: `ok`, `executado`, `naoIncluido`, `aviso`.
- `AccountFailure` (type) — Por que a falha é um UNIÃO fechada e não um `Error`: cada motivo tem uma tela diferente e um texto diferente. Colapsar todos em "deu erro" é exatamente o que faz o 503 virar culpa do usuário.
- `AccountResult` (type) — `export type AccountResult<T> = { ok: true; value: T } | { ok: false; failure: AccountFailure }`
- `function requestExport(saveId: string): Promise<AccountResult<AccountExport>>` — GET `/api/account?action=export` — pede a exportação dos dados do save.
- `function requestDelete(saveId: string): Promise<AccountResult<DeleteRequest>>` — POST `/api/account?action=delete-request` — inicia o pedido de exclusão.
- `function confirmDelete(saveId: string, confirmToken: string): Promise<AccountResult<DeleteDone>>` — POST `/api/account?action=delete-confirm` com o `confirmToken` — confirma a exclusão.
- `function downloadExport(payload: AccountExport, now = new Date()): boolean` — Entrega o arquivo ao usuário. Exportar sem entregar não é exportação. Devolve `false` quando o ambiente não sabe baixar (jsdom, WebView antigo), para a tela dizer isso em vez de fingir que baixou.
**Chamado por:** `src/components/AccountDataSection.tsx`
**Régua:** nenhuma (`ls src/utils/accountData*.test.ts` vazio).

### `src/utils/adventure.ts`
**Dono de:** A Aventura da Noite: o achado narrado que a criatura traz de volta, fechando `docs/PLANO-TAREFAS.md` §2.4.
**Exports:**
- `AdventureRarity` (type) — `'common' | 'rare' | 'legendary'`
- `AdventureFind` (interface) — campos: `id`, `emoji`, `titlePt`, `titleEn`, `textPt`, `textEn`, `rarity`.
- `ADVENTURE_CATALOG` — O catálogo. VOZ: a criatura conta o que viu, no passado, para alguém que ficou. Nunca avalia o dia de quem leu, nunca usa a segunda pessoa para cobrar ("você não fez"), e nunca pede nada.
- `findById` — `(id: string): AdventureFind | undefined => ADVENTURE_CATALOG.find(a => a.id === id)`
- `ADVENTURE_ODDS` — A CHANCE de cada faixa, em função de quanto do dia foi cumprido. `ratio` é `feito / meta`, limitado a 1. Repare no que a tabela NÃO faz: a linha de baixo (dia parado) continua tendo chance de raro e de lendário.
- `function adventureRarity(feito: number, meta: number, seed: number): AdventureRarity` — Sorteia a raridade do achado da noite. Determinístico pela `seed`. `meta <= 0` (nada cadastrado para o dia) cai na faixa de cima: não há o que cumprir, então não há por que a pessoa receber a chance mais baixa por um dia que o próprio jogo decidiu não cobrar.
- `function rollAdventure( colecionados: readonly string[], rarity: AdventureRarity, seed: number): string` — Escolhe o achado da faixa, preferindo um que a pessoa ainda NÃO tem — a coleção avança em vez de devolver repetido enquanto houver o que descobrir. Quando a faixa acaba, repete: um catálogo esgotado não pode virar tela vazia.
- `AdventureEntry` (interface) — campos: `id`, `day`.
- `function adventureOfDay( colecionados: readonly string[], feito: number, meta: number, dayKey: string): AdventureFind` — O achado de um dia, de ponta a ponta. É esta a função que a UI chama. `dayKey` é a seed: o mesmo dia devolve sempre o mesmo achado, quantas vezes a pessoa reabrir o relatório. Sem isso o relatório vira caça-níquel, e a pessoa aprende a reabrir a tela em vez de viver o dia.
- `function collectAdventure( diario: readonly AdventureEntry[], id: string, dayKey: string): AdventureEntry[]` — Guarda no diário. Idempotente: rever o relatório do mesmo dia não duplica, e reencontrar um achado antigo mantém a data da PRIMEIRA vez — é ela que faz a coleção ser uma história ("esse foi na primeira semana") em vez de uma lista.
**Chamado por:** `src/App.tsx`, `src/components/AdventureDiary.render.test.tsx`, `src/components/AdventureDiary.tsx`, `src/components/DailyReportModal.aventura.render.test.tsx`, `src/components/DailyReportModal.tsx`
**Régua:** `adventure.test.ts`
**Regra de negócio:** A Aventura da Noite: o pet traz um achado narrado, sorteado pela fração do dia cumprida. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/adventureArt.ts`
**Dono de:** Mapa id do achado da Aventura da Noite → URL da arte.
**Exports:**
- `ADVENTURE_ART` — Id do achado em `ADVENTURE_CATALOG` → URL do PNG.
**Chamado por:** `src/components/AdventureDiary.tsx`, `src/components/DailyReportModal.tsx`
**Régua:** nenhuma (`ls src/utils/adventureArt*.test.ts` vazio).

### `src/utils/aiClient.ts`
**Dono de:** Cliente HTTP único para as rotas de IA (chat, transcrição, sugestão de tarefa) — injeta saveId e Authorization.
**Exports:**
- `function aiFetch( path: string, body: Record<string, unknown>, init: { signal?: AbortSignal } = {}): Promise<Response>` — POST numa rota de IA, já com saveId e Authorization. `signal` para timeout.
**Chamado por:** `src/components/ChatBox.tsx`, `src/components/CompanionHUD.tsx`, `src/utils/spriteGen.ts`, `src/utils/taskSuggestions.ts`
**Régua:** nenhuma (`ls src/utils/aiClient*.test.ts` vazio).

### `src/utils/anniversary.ts`
**Dono de:** Marca o dia em que a relação com a criatura faz um mês ou um ano, a partir de `bornAt` — módulo puro, `now` por parâmetro.
**Exports:**
- `AnniversaryKind` (type) — `'month' | 'year'`
- `function anniversaryOn( bornAt: string | undefined, todayKey: string): AnniversaryKind | null` — O aniversário que HOJE completa, ou `null`. `todayKey` é o dia do jogador (mesma régua de `bornAt`), nunca `new Date()` lá dentro: as duas pontas têm de vir do mesmo relógio, senão em fuso negativo o aniversário cai no dia errado — que é o bug clássico deste campo.
- `function daysTogether(bornAt: string | undefined, todayKey: string): number | null` — "Dias juntos" — quantos dias desde o nascimento, contando hoje. Só cresce por construção, e é isso que o torna admissível como número exibido (C.3 #2): não existe leitura em que ele desça, então ele não pode virar placar de desempenho.
**Chamado por:** `src/App.tsx`
**Régua:** `anniversary.test.ts`
**Regra de negócio:** Aniversário de mês/ano da relação, contado a partir de `bornAt`. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/arena.ts`
**Dono de:** Motor da Arena: contador elemental, dano, inimigos por bestiário e a simulação de balanceamento — sem tela consumidora (ver aviso).
**Exports:**
- `BASE_ELEMENT_LABELS_EN` — EN labels for the 17 base elements (PT lives in BASE_ELEMENT_LABELS).
- `function elementLabel(id: string, isPt: boolean): string` — Rótulo PT/EN de um elemento base a partir de `BASE_ELEMENT_LABELS`/`_EN`; sem entrada devolve o próprio id.
- `COUNTERS` — tabela/dado de configuração (ver código; 6+ linhas).
- `function countersElement(attacker: string, defender: string): boolean` — O atacante tem vantagem elemental sobre o defensor, segundo `COUNTERS`?
- `ADVANTAGE_MULT` — `1.3`
- `DISADVANTAGE_MULT` — `0.8`
- `function elementMultiplier(attackEl: string, defenderEls: string[]): number` — Attack multiplier of one element vs a defender's element list. Advantage and disadvantage cancel out when both apply (mixed-element defender).
- `function getArenaAttributes(ficha: Ficha): { principal: string; secundario: string }` — The two BASE elements that act as the player's arena attributes.
- `ArenaPlayerStats` (interface) — campos: `hp`, `dmg`.
- `function getArenaPlayerStats(stage: FichaStage, escolaBasica: EscolaId): ArenaPlayerStats` — HP e dano do jogador na Arena: `STAGE_BUDGET[stage]` escalado pelo formato de `ROLE_SHAPE[escolaBasica]`.
- `SPECIAL_CHARGE_TURNS` — Turns of charge the special needs before it can fire.
- `ArenaSpecialEffect` (interface) — campos: `mult`, `targets`, `echoMult`, `echoTurns`, `healFrac`, `weakenFrac`, `weakenTurns`.
- `SPECIAL_EFFECTS` — Special-skill effect per school. The numbers were CALIBRATED by the balance simulation in arena.test.ts (win rate per archetype 40–80%, spread ≤ 20pp) — don't hand-tweak without re-running it.
- `PERFECT_ACC` — `0.92`
- `CRIT_MULT` — `1.5`
- `function accuracyScale(acc: number): number` — Curva de precisão → multiplicador de dano (`0,25 + 0,75·acc²`).
- `function playerHitDamage(dmg: number, acc: number, elementMult: number, skillMult = 1): number` — One basic (or per-target special) hit. `mult` = elemental multiplier.
- `function enemyHitDamage( atk: number, defAcc: number, enemyEl: string, playerAttrs: { principal: string; secundario: string }, weakened: boolean): number` — Damage the player takes from one enemy attack. Defense accuracy shaves it off linearly (dungeon rule); the player's principal/secundário attributes reduce damage from elements they counter (×DISADVANTAGE_MULT) and take extra from elements that counter them (×ADVANTAGE_MULT).
- `BestiaryCreature` (interface) — campos: `nome`, `elementos`, `atributos`, `tamanho`, `hostilidade`.
- `function loadBestiaryPool(): Promise<BestiaryCreature[]>` — Dynamic import keeps the 2 000-creature pool (~104 KB gzip) out of the initial bundle — same pattern as the astronomy-engine in the oracle.
- `ArenaEnemyClass` (type) — `'weak' | 'medium' | 'boss'`
- `ArenaEnemy` (interface) — campos: `namePt`, `nameEn`, `elements`, `hp`, `maxHp`, `atk`, `speed`, `points`, `cls`, `tier`.
- `ARENA_ROUNDS` — `5`
- `function buildArenaRound( roundIdx: number, difficulty: number, rng: () => number, pool: BestiaryCreature[]): ArenaEnemy[]` — Build the enemies of one round (1-based). Stats DERIVE their shape from the bestiary creature (atributos + hostilidade + tamanho, ±15%) but are normalized to the round's curve; the displayed name is always generated.
- `ROUND_CLEAR_HEAL` — HP fraction recovered when a round is cleared (dungeon-style breather).
- `ArenaArchetypeConfig` (interface) — campos: `stage`, `escolaBasica`, `escolaEspecial`, `elementoBasica`, `elementoEspecial`, `attrs`.
- `ArenaSimOptions` (interface) — campos: `difficulty`, `accMean`, `rng`, `pool`.
- `ArenaSimResult` (interface) — campos: `won`, `roundsCleared`.
- `function simulateArenaRun(config: ArenaArchetypeConfig, opts: ArenaSimOptions): ArenaSimResult` — Plays one full 5-round run with the same rules the UI uses: special needs SPECIAL_CHARGE_TURNS basic turns of charge, echo/heal/weaken effects apply, every living enemy attacks after the player's turn, accuracy is sampled around `accMean` (±0.25 uniform).
- `DEFAULT_ARENA_ATTRIBUTES` — `{ principal: 'vigor', secundario: 'vigor' }`
- `function buildDefaultArenaSkills(): StageSkills` — A sane generic rookie pair so the Arena opens for EVERY save (legacy included): physical-combat basic + special, vigor element.
**Chamado por:** `src/components/ArenaGame.render.test.tsx`, `src/components/ArenaGame.tsx`
**Régua:** `arena.test.ts`
**Avisos do arquivo:**
- ⚠️ SEM CONSUMIDOR — nenhuma tela chama nada daqui (verificado em 07/09/2026: `grep` por `utils/arena` em `src/`, `desktop/` e `functions/` devolve só o próprio arquivo e `arena.test.ts`).
**Regra de negócio:** A Arena de combate PvE contra o bestiário — hoje sem nenhuma tela consumidora. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/audioBus.ts`
**Dono de:** O BARRAMENTO DE ÁUDIO (run `som-01`, Fase 2): sub-mix por categoria, limitador e ducking, substituindo o `AudioContext`-por-chamada de `sounds.ts`.
**Exports:**
- `D1_ATAQUE_S` — D-1: Marco abaixa TUDO ao piso em ≤120 ms; volta em 800 ms.
- `D1_LIBERACAO_S` — `0.8`
- `D2_ATAQUE_S` — D-2: classe superior soando abaixa SÓ o Arcade em 9 dB.
- `D2_LIBERACAO_S` — `0.4`
- `D2_PROFUNDIDADE_DB` — `-9.0`
- `RAMPA_MINIMA_S` — §6.3 — piso técnico: nenhuma rampa mais curta que isto (clique audível).
- `JANELA_DE_COINCIDENCIA_MS` — **A JANELA DE COINCIDÊNCIA DA R-EX, em milissegundos.** ⚠️ **Não confundir com o D-1.** O `120` que já existia neste arquivo é `D1_ATAQUE_S = 0.12` — o tempo em que o Marco **abaixa** todo o resto. Isso é *ducking*: atenua, não exclui.
- `OrigemDoDespacho` (type) — **Passo 3 do desempate — gesto vence cascata.** O critério da P-1 é *sintático*: vence o `play*` escrito no handler do gesto do usuário, perde o alcançado por cascata a partir dele. O despacho **não consegue inferir isso em tempo de execução** — quem sabe é quem chama.
- `function esquecerJanelaDeCoincidencia(): void` — Só para teste: esquece a janela da R-EX.
- `function volumeDe(cat: CategoriaSom): number` — Volume de uma categoria, 0..1. Sem chave =  1  (o som nasce no alvo).
- `function definirVolume(cat: CategoriaSom, v: number): void` — Grava o volume de uma categoria (persistência silenciosa) e aplica no ganho do barramento vivo, se houver um.
- `function trilhaLigada(): boolean` — A trilha  nasce desligada  (S2) e só toca por gesto explícito. A chave é PRÓPRIA, separada do `mute` global — ver o comentário em `storageKeys.ts`.
- `function definirTrilhaLigada(on: boolean): void` — Liga/desliga a trilha (flag persistida) e aplica no ganho do bus de trilha vivo.
- `function encerrarBarramento(): void` — Fecha o contexto e esquece o cache. Idempotente.
- `function barramentoAtual(): Barramento | null` — Só para teste: o barramento vivo, ou `null`. Não usar em produção.
- `function duckMarco(quando: number, duracaoDoSom: number): void` — D-1 (§6.2): o Marco abaixa Trilha + SFX ao piso em ≤120 ms. `duracaoDoSom` agenda a liberação, porque o gesto que fecha a cerimônia não tem hook (ver o cabeçalho). Sem essa liberação agendada, um Marco silenciaria o app.
- `function liberarMarco(quandoGesto: number): void` — D-1, liberação por gesto — para quando a cerimônia ganhar o hook.
- `function tocarNa( cat: CategoriaSom, montarFonte: (ctx: AudioContext, destino: AudioNode) => number | void, origem: OrigemDoDespacho = 'gesto'): boolean` — Toca alguma coisa numa categoria. `montarFonte` recebe o contexto e o nó de ENTRADA do despacho — nunca `ctx.destination`, que é o que fazia cada som ignorar o mix. Devolve a duração do som em segundos (para os duckings) ou nada.
**Chamado por:** `src/utils/sounds.ts`
**Régua:** `audioBus.contract.test.ts`, `audioBus.rex.test.ts`

### `src/utils/auth.ts`
**Dono de:** Autenticação Firebase (e-mail/senha, Google, link por e-mail) e a ponte de auth para o app de desktop.
**Exports:**
- `function isAuthConfigured(): boolean` — O Firebase tem `apiKey`/`authDomain`/`projectId` configurados?
- `AuthErro` (type) — Traduz o código do Firebase para algo que a interface possa dizer.
- `function traduzErroAuth(code: string): AuthErro` — Código de erro do Firebase → `AuthErro` da UI; funde deliberadamente 'senha errada' e 'usuário inexistente' para não dar ao atacante pista de qual e-mail tem conta.
- `ResultadoAuth` (interface) — campos: `ok`, `email`, `erro`.
- `function entrarComSenha(email: string, senha: string): Promise<ResultadoAuth>` — Entrar com e-mail e senha numa conta que já existe.
- `function criarContaComSenha(email: string, senha: string): Promise<ResultadoAuth>` — Criar conta nova com e-mail e senha.
- `function entrarComGoogle(): Promise<ResultadoAuth>` — Entrar com Google. Não depende de e-mail CHEGAR — e isso importa: o link por e-mail deste projeto cai no spam do Gmail (remetente `firebaseapp.com` sem domínio próprio, verificado em 07/09/2026).
- `function mandarResetDeSenha(email: string): Promise<ResultadoAuth>` — Recuperar senha. SEM isto, senha vira armadilha: quem esquece perde o save, porque o `saveId` é derivado do e-mail e não há outro caminho de volta.
- `function sendLoginLink(email: string): Promise<` — Manda o link de acesso para o e-mail. O e-mail fica guardado localmente porque o Firebase exige confirmá-lo ao completar o login (proteção contra alguém interceptar o link).
- `function isPendingLoginLink(): Promise<boolean>` — true se a URL atual é um link de login do Firebase esperando conclusão.
- `function completeLoginFromLink(): Promise<` — Conclui o login quando o app abre a partir do link do e-mail.
- `function getCurrentEmail(): Promise<string | null>` — E-mail autenticado no momento, ou null.
- `function getIdToken(): Promise<string | null>` — ID token para mandar nas chamadas de API. Null quando não há login — as rotas do servidor recusam nesse caso (se FIREBASE_PROJECT_ID estiver ligado).
- `function authHeaders(): Promise<Record<string, string>>` — Cabeçalho Authorization pronto — vazio quando não há login.
- `function signOut(): Promise<void>` — Desloga do Firebase; no-op se auth não configurado, engole erro de rede.
- `function startDesktopAuthBridge(): Promise<void>` — Repassa o ID token para o app de desktop (overlay na barra de tarefas). O overlay é um processo Electron separado, sem SDK de auth: ele depende deste app para se autenticar (ver desktop/electron/auth-preload.js e docs/PLANO-DESKTOP-STEAM.md, fase 2c).
**Chamado por:** `src/components/AccountDataSection.tsx`, `src/components/AccountSection.tsx`, `src/components/SoulmonOnboarding.tsx`, `src/utils/aiClient.ts`, `src/utils/cloudSave.ts`, `src/utils/community.ts`, `src/utils/entitlements.ts`, `src/components/SoulmonOnboarding.portao.render.test.tsx`, `src/App.tsx`, `src/utils/accountData.ts`
**Régua:** `auth.popupBloqueado.test.ts`, `auth.redirect.test.ts`, `auth.sessao.test.ts`

### `src/utils/backgrounds.ts`
**Dono de:** Catálogo de cenários (`PetBackground`) comprados na loja.
**Exports:**
- `PetBackground` (interface) — campos: `namePt`, `nameEn`, `css`, `setting`, `slots`, `baseColor`, `horizonY`.
- `PET_BACKGROUNDS` — tabela/dado de configuração (ver código; 41+ linhas).
**Chamado por:** `src/App.tsx`, `src/components/CompanionHUD.tsx`, `src/components/PetStageDecor.tsx`, `src/components/ShopModal.tsx`, `src/utils/dungeonScenes.ts`
**Régua:** nenhuma (`ls src/utils/backgrounds*.test.ts` vazio).

### `src/utils/bond.ts`
**Dono de:** O Nível de Vínculo: a trilha unificadora de XP que soma todos os sistemas de cuidado (`docs/PLANO-PRODUTO.md`, Parte 4).
**Exports:**
- `XP_PER_EFFORT` — XP base por UNIDADE DE PESO DE ESFORÇO concluída (hábito = 1, tarefa = effort 1–3).
- `XP_PERFECT_DAY` — ⭐ Dia perfeito (utils/dailyReset.ts).
- `XP_REST_NIGHT` — 🛏️ Noite deitada dentro da janela de descanso (utils/restWindow.ts).
- `XP_NEW_DREAM` — 🌠 Sonho ainda não coletado (dexProgress cresce).
- `XP_NIGHTMARE_CLEARED` — 😱 Pesadelo vencido (utils/nightmares.ts).
- `XP_DUNGEON_FLOOR` — ⚔️ Andar de masmorra limpo.
- `XP_DUNGEON_RUN` — ⚔️ Run completa (os 5 andares).
- `XP_TOURNAMENT_WIN` — 🎪 Partida de torneio — DERROTA TAMBÉM RENDE. Falha não pune.
- `XP_TOURNAMENT_LOSS` — `8`
- `XP_HABIT_MILESTONE` — 🌳 Marcos de hábito (HABIT_MILESTONES = 7/21/66 dias efetivos).
- `XP_TRIAGE_CLEARED` — 🧹 Fila de triagem concluída (planejar é o que alivia — Masicampo & Baumeister).
- `XP_CHECK_IN` — ☀️ Check-in do dia.
- `BondEvent` (type) — `/** Conclusão de hábito/tarefa. `weight` = PESO DE ESFORÇO (nunca contagem de itens). */ | { kind: 'completion'; weight: number; habitTier?: HabitTier } | { kind: 'perfectDay' } | { kind: 'restNight' } | { kind: 'dreamNew' } | { kind: 'nightmareCleared' } | { kind: 'dungeonFloor' } | { kind: 'dungeonRun' } | { kind: 'tournamentMatch'; won: boolean } | { kind: 'habitMilestone'; days: number } | { kind: 'triageCleared' } | { kind: 'checkIn' }`
- `function bondXP(event: BondEvent): number` — XP BRUTO de um evento, antes do teto diário. Sempre ≥ 0. O multiplicador do tier do hábito reusa `HABIT_TIER_BONUS` (`types/taskModel.ts`) — não existe segunda tabela de tiers neste arquivo, pelo mesmo motivo do footgun 9.
- `BondCapSource` (type) — As fontes que a pessoa pode repetir à vontade num dia — e só elas. Conclusão, dia perfeito, noite, sonho, marco, triagem e check-in NÃO têm teto: são naturalmente limitados pela vida real, que é o ponto do app.
- `BOND_DAILY_CAP` — `{ dungeon: 120, tournament: 60, }`
- `BondDailyXP` (type) — Ledger do dia. Só campos das fontes com teto; zera na virada, como a energia.
- `function bondCapSource(event: BondEvent): BondCapSource | null` — A qual teto o evento pertence (ou `null` = sem teto).
- `BondGain` (interface) — campos: `xp`, `spent`, `capped`.
- `function applyBondXP(event: BondEvent, spent: BondDailyXP = {}): BondGain` — Aplica o teto diário suave. Ao bater o teto a soma simplesmente PARA — igual ao limite de comida.
- `function bondXPForDay( events: readonly BondEvent[], spent: BondDailyXP = {}): { xp: number; spent: BondDailyXP }` — Dobra uma lista de eventos do dia respeitando os tetos. Sempre ≥ 0.
- `BOND_MAX_LEVEL` — TETO DE NÍVEL — e ele existe por CUSTO DE CPU, não por balanceamento. `totalXP` mora no save, e o save é escrito pelo cliente.
- `function xpForLevel(n: number): number` — XP total acumulado necessário para alcançar o nível `n` (soma de `stepFor(k)` até o nível anterior), com teto em `BOND_MAX_LEVEL`.
- `function bondLevelFor(totalXP: number): number` — O nível derivado de `totalXP`. **Única fonte da verdade do nível** — não existe `bondLevel` no save (footgun 9).
- `BondProgress` (interface) — campos: `level`, `into`, `need`, `ratio`.
- `function bondProgress(totalXP: number): BondProgress` — Tudo que a UI precisa. Nenhum número aqui pode diminuir com XP maior.
- `BondRewardKind` (type) — `decor` e `bg` referenciam ids REAIS de `utils/shop.ts`; `dream` referencia ids REAIS de `DREAM_CATALOG` (`utils/restWindow.ts`). `title` é uma string exibida sob o nome do pet e não existe em lugar nenhum além daqui.
- `BondReward` (interface) — campos: `id`, `level`, `kind`, `refId`, `namePt`, `nameEn`.
- `BOND_LAST_TITLED_LEVEL` — O último nível com título. Depois dele a escada acaba de verdade — e acabar num lugar declarado é diferente de parar sem aviso no 14.
- `function bondRewardFor(level: number): BondReward | null` — A recompensa daquele nível, ou `null` se o nível não dá nada.
- `function bondRewardLadder(): readonly BondReward[]` — Toda a escada, para a UI da trilha (mostrar o que vem a seguir).
- `function bondTitle(level: number, language: string): string | null` — O título exibido sob o nome do pet: o mais alto já alcançado. `null` antes do nível 2 — ninguém carrega um título vazio.
- `function unclaimedBondRewards( totalXP: number, claimed: readonly string[] = []): readonly BondReward[]` — As recompensas já conquistadas (nível ≤ atual) que ainda não foram entregues. Modelo de estado que o dono da fiação vai ligar: `bondRewardsClaimed?: string[]` no GameState ← a ÚNICA coisa persistida. O nível NUNCA vai para o save: é sempre `bondLevelFor(totalXP)`.
- `BondDailyLedger` (interface) — O ledger do dia, do jeito que ele mora no save. `day` é a chave do DIA DO JOGADOR (`utils/playerDay.ts`), nunca a do aparelho: dois celulares em fusos diferentes discordariam do nome do dia e o teto valeria duas vezes — o mesmo furo que `careCaps` fechou.
- `BondState` (interface) — A fatia do GameState que a fiação lê e escreve.
- `function awardBondXP<T extends BondState>(state: T, event: BondEvent, dayKey: string): T` — Concede o XP de UM evento — **o único caminho de produção**. Função PURA, como o resto do módulo: recebe o estado e a chave do dia do jogador, devolve o estado novo. Quem chama (App.tsx) só passa o evento que já aconteceu — a trilha continua sem pedir nenhuma ação nova.
- `BOND_PVP_MIN_LEVEL` — Nível mínimo para LIGAR o PvP: **5**. Não é número escolhido: os níveis 1–4 são o funil de retenção D1–D7 declarado na própria curva (seção 3), e o 5 é o primeiro degrau FORA dele — 700 XP, ~uma semana de uso real nos dois perfis de referência, que é exatamente a janela da (…)
- `function meetsPvpBond(totalXP: number): boolean` — O Vínculo já é suficiente para o PvP? É um LIMIAR, não uma manutenção: como `bondLevelFor` é monótona e `totalXP` nunca desce (nenhum caminho de regressão o toca — `dailyReset.ts` mexe em estágio, dias perfeitos e HP), quem cruzou uma vez cruzou para sempre.
- `function xpToPvpBond(totalXP: number): number` — Quanto falta para o PvP ficar disponível. `0` quando já está. Nunca negativo.
- `BondRewardTarget` (interface) — O mínimo do GameState que a entrega toca.
- `function applyBondRewards<T extends BondRewardTarget>( prev: T): { state: T; delivered: readonly BondReward[] }` — Entrega o que o nível do Vínculo já garantiu, e devolve o MESMO objeto quando não há nada a entregar.
**Chamado por:** `functions/api/bond.parity.test.js`, `functions/api/community.pvpGate.test.js`, `src/App.tsx`, `src/components/CompanionHUD.vinculo.render.test.tsx`, `src/components/StatsPage.tsx`, `src/components/TournamentPage.bondGate.test.tsx`, `src/components/TournamentPage.tsx`, `src/contexts/GameStateContext.tsx`
**Régua:** `bond.recompensas.test.ts`, `bond.test.ts`, `bond.wiring.test.ts`
**Regra de negócio:** O Nível de Vínculo: XP por evento de cuidado, com teto diário suave e escada de recompensas. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/careCaps.ts`
**Dono de:** Onde os tetos de cuidado (carinho, comida) moram no save — migração e higienização, nunca a regra.
**Exports:**
- `CareCaps` (interface) — Onde os TETOS DE CUIDADO moram. As regras em si continuam em `utils/careRules.ts` — este arquivo não decide nada sobre elas, e não pode. O que muda aqui é a PROCEDÊNCIA do estado que elas recebem por parâmetro.
- `LegacyCareCaps` (interface) — O que morava no `localStorage` antes desta migração.
- `function hydrateCareCaps(v: unknown, now: number): CareCaps` — Higieniza o que veio do save (local ou nuvem) — nunca lança.  `now` é o relógio de quem está carregando; ver `sanitizeFeedTimes`.
- `function mergeCareCaps(fromSave: unknown, legacy: LegacyCareCaps, now: number): CareCaps` — Funde o teto que está no SAVE com o que sobrou no `localStorage` deste aparelho. Roda no load, uma vez por save carregado.
- `function feedTimesFor(caps: CareCaps | undefined, now: number): number[]` — A janela viva de comidas, já podada pela regra pura. Existe para quem chama não precisar decidir de onde ler nem repetir o `?? []`.
- `function rubHealFor(caps: CareCaps | undefined, todayKey: string): RubHealRecord` — O registro de carinho de HOJE, normalizado pela regra pura.
**Chamado por:** `src/App.tsx`, `src/contexts/GameStateContext.careCaps.test.tsx`, `src/contexts/GameStateContext.tsx`, `src/utils/careUpdaters.ts`
**Régua:** `careCaps.fuso.test.ts`, `careCaps.test.ts`
**Avisos do arquivo:**
- ⚠️ Mover o teto para o save fecha o furo só ENQUANTO os dois aparelhos estiverem no MESMO save — dois aparelhos escrevendo em paralelo ainda dependem de save confiável na nuvem (fatia 1, não fechada).
**Regra de negócio:** Os tetos de carinho (1 coração/dia) e comida (6/hora) vivem no SAVE, não no aparelho. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/carePattern.ts`
**Dono de:** Lê o histórico de conclusões e classifica o ritmo de cuidado (Constante/Explosivo/Equilibrado) — desempate de galho de evolução.
**Exports:**
- `CarePatternId` (type) — `'constante' | 'explosivo' | 'equilibrado'`
- `CarePattern` (interface) — campos: `id`, `emoji`, `namePt`, `nameEn`, `descPt`, `descEn`.
- `CARE_PATTERNS` — tabela/dado de configuração (ver código; 26+ linhas).
- `CareReading` (interface) — campos: `pattern`, `activeDays`, `total`, `concentration`, `confident`.
- `CARE_WINDOW_DAYS` — Janela de leitura, em dias. Duas semanas pega ritmo sem virar arqueologia.
- `function computeCarePattern( completed: CompletedLike[] | undefined, now: Date = new Date(), windowDays: number = CARE_WINDOW_DAYS): CareReading` — Lê o histórico de conclusões dentro da janela (`windowDays`) e devolve a `CareReading` (contagem por dia, classificação de padrão).
- `function careHistory(state: { completedTasks?: Array<{ completedAt: string }>; activityLog?: string[]; }): Array<` — Histórico COMPLETO de cuidado de um save: tarefas avulsas (`completedTasks`) **mais** atividades recorrentes (`activityLog`).
- `function patternBranch(id: CarePatternId): 'virus' | 'data' | 'vaccine'` — O galho que cada padrão puxa. Nenhum é mais forte — são rumos diferentes.
- `AttrPoints` (interface) — campos: `virus`, `data`, `vaccine`.
- `function branchLeaders(points: AttrPoints): Array<'virus' | 'data' | 'vaccine'>` — Os galhos EMPATADOS no topo dos atributos — a lista que `resolveBranch` já calculava internamente e descartava ao devolver um só.
- `function resolveBranch( points: AttrPoints, reading: CareReading, fallback: 'virus' | 'data' | 'vaccine' = 'data'): 'virus' | 'data' | 'vaccine'` — O galho de evolução (virus/data/vaccine) que os atributos e o ritmo de cuidado apontam; ponto não-finito (NaN/undefined) é saneado para 0 antes de decidir.
**Chamado por:** `src/App.tsx`, `src/components/StatsPage.tsx`, `src/utils/evolutionTarget.ts`, `src/utils/spriteTrigger.ts`
**Régua:** `carePattern.test.ts`, `carePattern.threshold.test.ts`
**Regra de negócio:** O ritmo de cuidado decide o desempate de galho de evolução — nenhum padrão é melhor que outro. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/careRules.ts`
**Dono de:** As regras PURAS de cuidado (comer, carinho, concluir tarefa) — usadas pelo App e pelo desktop.
**Exports:**
- `CareState` (interface) — Fatia do GameState que estas regras leem e escrevem.
- `FOOD_LIMIT_PER_HOUR` — Máximo de comidas por hora (janela deslizante). DERIVADO do maior requisito diário da escada (`MAX_STAGE_REQUIREMENT`), e não um literal, porque o limite de ritmo NUNCA pode ficar abaixo do que o jogo pede num dia: comida se ganha concluindo tarefa, energia só enche comendo e (…)
- `RUB_HEAL_STEP` — Cura do carinho por gesto, e o teto diário.
- `RUB_HEAL_DAILY_CAP` — `1`
- `FeedRefusal` (type) — `'no-stock' | 'hourly-limit'`
- `RubRefusal` (type) — `'already-full' | 'daily-cap'`
- `function recentFeeds(feedTimes: number[], now: number): number[]` — Timestamps (ms) das comidas dentro da janela de 1h.
- `function feedsLeft(feedTimes: number[], now: number): number` — Quantas comidas ainda cabem na janela de 1h (`FOOD_LIMIT_PER_HOUR − recentFeeds`).
- `function feedFood<T extends CareState>( state: T, foodEmoji: string, feedTimes: number[], now: number): { state: T; feedTimes: number[]; refused?: FeedRefusal }` — Alimenta com uma comida COMUM (as do `FOOD_BY_CATEGORY`). Itens especiais da loja (chip, coraçãozinho, glitchtama) NÃO passam por aqui: eles têm efeitos próprios e não contam no limite de 5/hora — quem trata é o `handleFeed` do App.
- `RubHealRecord` (interface) — Registro do carinho do dia — `date` no formato de `new Date().toDateString()`.
- `function rubHealRecordFor(record: RubHealRecord | null, todayKey: string): RubHealRecord` — O registro que vale para HOJE — **ordem-consciente**, não igualdade cega. ⚠️ Achado **X-4** do gate da fatia 2. Enquanto este registro morava no `localStorage`, igualdade bastava: um `date` que não fosse o de hoje só podia ser de ontem.
- `function rubRefusal( healthPoints: number, maxHealthPoints: number, record: RubHealRecord | null, todayKey: string, petPassive?: string): RubRefusal | undefined` — O carinho seria recusado? Separado de `rubHeal` porque quem chama precisa decidir a recusa ANTES de entrar num updater de estado (recusa dispara fala e animação, e efeito colateral dentro de updater roda 2× no StrictMode).
- `function rubHeal<T extends CareState>( state: T, record: RubHealRecord | null, todayKey: string): { state: T; record: RubHealRecord; refused?: RubRefusal }` — Carinho: cura meio coração, no máximo 1 coração por dia.  A animação toca sempre (é o App que decide isso) — aqui só entra a cura.
- `function foodForCompletedTask( inventory: Record<string, number>, category: ActivityCategory): Record<string, number>` — Recompensa por concluir uma tarefa: +1 comida da categoria dela. Os atributos NÃO vêm daqui — vêm de alimentar. Concluir tarefa só entrega a comida; o jogador escolhe quando usar.
- `TaskState` (interface) — Fatia do GameState que a conclusão de tarefa lê e escreve.
- `function completeTask<T extends TaskState>(state: T, taskId: string, now = new Date()): T | null` — Conclui uma tarefa: tira da lista, grava no histórico, conta na estatística e entrega a comida da categoria.
**Chamado por:** `desktop/renderer/src/care.ts`, `desktop/renderer/src/menu.ts`, `desktop/renderer/src/state.ts`, `src/App.tsx`, `src/components/GuideModal.tsx`, `src/components/HelpModal.tsx`, `src/contexts/GameStateContext.careCaps.test.tsx`, `src/utils/careCaps.ts`, `src/utils/careUpdaters.ts`
**Régua:** `careRules.test.ts`
**Regra de negócio:** Corações, comida e conclusão de tarefa — as regras centrais de cuidado. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/careUpdaters.ts`
**Dono de:** Updaters de carinho/comida aplicados ao `prev` do `setGameState`, reconferindo a recusa por cima do estado real (achado X-6).
**Exports:**
- `CareCapsState` (type) — Fatia do estado que estes updaters leem e escrevem.
- `function applyRub<T extends CareCapsState>( prev: T, todayKey: string): { state: T; refused?: RubRefusal }` — Um gesto de carinho aplicado ao `prev`. O teto é reconferido AQUI, sobre o registro que está no save — a checagem de fora existe só pela fala. Antes chegava `{ healed: 0 }` fixo e o teto ficava inteiramente dependente da checagem externa.
- `function applyFeed<T extends CareCapsState>( prev: T, foodEmoji: string, now: number): { state: T; refused?: FeedRefusal }` — Uma comida aplicada ao `prev`. A janela vem do `prev`, e NÃO de uma leitura de fora: dois toques dentro do mesmo lote do React veriam o mesmo estado e a segunda furaria o teto. Aqui a segunda passada já enxerga o timestamp da primeira.
- `function rubDecision(state: CareCapsState, todayKey: string): RubRefusal | undefined` — A decisão de recusar o carinho, do jeito que o chamador precisa dela. Separada do updater porque a recusa dispara fala e animação. O `petPassive` vem do ESTADO — não de um parâmetro que quem chama possa esquecer, que é exatamente como o Traço Carinhoso ficou desligado na prática.
**Chamado por:** `desktop/renderer/src/care.ts`, `src/App.tsx`
**Régua:** `careUpdaters.test.ts`
**Avisos do arquivo:**
- ⚠️ Existe por causa do achado X-6: três bugs de recusa lida de FORA do updater foram consertados na fatia 2 sem nenhum teste cobrindo — não reintroduza regra dentro de updater inline.
**Regra de negócio:** Aplica carinho/comida com a recusa reconferida sobre o estado real, nunca o de fora. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/chatKeywords.ts`
**Dono de:** Detecta a intenção (categoria) de uma mensagem do chat, em PT e EN.
**Exports:**
- `MessageCategory` (type) — `| 'greeting' | 'farewell' | 'feeling' | 'encouragement' | 'compliment' | 'affection' | 'food' | 'evolution' | 'name' | 'task' | 'time' | 'help' | 'sad' | 'happy'`
- `function detectMessageCategory(message: string): MessageCategory` — Detecta a intenção da mensagem. Reconhece PT e EN no mesmo passo. Antes só havia padrões em inglês: um usuário brasileiro escrevendo "oi", "tô triste" ou "me ajuda" caía sempre no default e recebia resposta genérica em inglês.
**Chamado por:** `src/components/ChatBox.tsx`
**Régua:** `chatKeywords.test.ts`

### `src/utils/chatSafety.ts`
**Dono de:** A ponte de ajuda do chat (WP3.9, decisão D16): mensagens de risco respondem localmente, sem IA.
**Exports:**
- `ChatSafetyLanguage` (type) — A PONTE DE AJUDA DO CHAT (WP3.9 — decisão D16, parcial). ======================================================= O chat do pet passa por uma IA, e o WP3.1 quer dar memória a ele.
- `function needsBridge(mensagem: string): boolean` — A pessoa escreveu algo que pede a ponte?
- `function bridgeReply(language: ChatSafetyLanguage): string` — A resposta local. Na voz do pet, curta, sem susto — e ela FICA: "tô aqui" é a única coisa que um bichinho pode honestamente oferecer, e oferecer isso junto do número de quem sabe ajudar é o máximo que o app deve fazer. O CVV (188) é gratuito, 24h, em todo o Brasil.
- `function chatSafetyDecision( mensagem: string, language: ChatSafetyLanguage):` — O que o chat deve fazer com esta mensagem. `local` = responde daqui e  não chama a IA  .
**Chamado por:** `src/components/ChatBox.tsx`
**Régua:** `chatSafety.test.ts`
**Regra de negócio:** A ponte de ajuda do chat: mensagens de risco respondem localmente, sem passar pela IA. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/cloudSave.ts`
**Dono de:** Cliente do save na nuvem: envio, leitura, retentativa com orçamento e reconciliação de `saveId`.
**Exports:**
- `function emailToSaveId(email: string): Promise<string>` — `SHA-256('soulmon:' + e-mail normalizado)`, cortado em 32 hex — o `saveId`.
- `CloudSaveFailureKind` (type) — `| 'offline' // a requisição nem saiu (rede, DNS, CORS) — status 0 | 'auth' // 401: sem token válido | 'identity' // 403: o token é bom, mas o saveId local não é o do e-mail | 'conflict' // 409: outro aparelho escreveu antes (fatia 1) | 'stale' // 412: pré-condição falhou; o cliente está atrasado | 'too-large' // 413: o save passou do teto do servidor | 'server' // 5xx: o servidor caiu, o save continua válido | 'client'; // 4xx restante: o cliente mandou algo que o servidor recusa export interface CloudSavePolicy { /** Reenviar o MESMO corpo tem chance real de mudar o resultado? */ retentavel: boolean`
- `CloudSavePolicy` (interface) — campos: `retentavel`, `avisaJogador`.
- `CLOUD_SAVE_POLICY` — tabela/dado de configuração (ver código; 19+ linhas).
- `function classifyCloudSaveStatus(status: number): CloudSaveFailureKind` — `status: 0` é o nosso código para "a requisição não chegou a sair".
- `CloudSaveFailure` (interface) — campos: `ok`, `kind`, `status`.
- `CloudSaveOutcome` (type) — `{ ok: true } | CloudSaveFailure`
- `function cloudSave(saveId: string, state: unknown): Promise<CloudSaveOutcome>` — Envia o save para a nuvem. `ok: true` só quando o SERVIDOR confirmou.
- `CLOUD_SAVE_RETRY_TETO` — `3`
- `CLOUD_SAVE_RETRY_JANELA_MS` — `10 * 60_000`
- `CLOUD_SAVE_RETRY_BACKOFF_MS` — Backoff da ADR §3. A última entrada é o teto — não volta a encolher.
- `function __resetRetryBudgets(): void` — Só para teste: zera o estado de módulo entre casos.
- `CloudSaveRetryOpts` (interface) — campos: `esperar`, `agora`.
- `function cloudSaveComRetry( saveId: string, state: unknown, opts: CloudSaveRetryOpts = {}): Promise<CloudSaveOutcome>` — `cloudSave` com a política aplicada: retenta o que a tabela diz ser retentável, dentro do orçamento do `saveId`, e devolve o resultado FINAL. ⚠️ **R-1:** esta função nunca toca o estado do jogo. O corpo enviado é o snapshot recebido, e continua o mesmo em toda retentativa.
- `function cloudLoad(saveId: string): Promise<unknown | null>` — Lê o save da nuvem; devolve o estado cru ou `null` se não encontrado.
- `AdoptResult` (type) — `'ok' | 'invalid' | 'storage'`
- `function adoptCloudSave( saveId: string, state: unknown, email?: string): AdoptResult` — Grava o save vindo da nuvem e só então troca a identidade local. Nunca lança. Quem chama só deve recarregar a página com `'ok'`.
- `ReconcileResult` (type) — `/** O `SAVE_ID` já era o derivado. Nada foi tocado, nem a rede. */ | { estado: 'sem-mudanca'; saveId: string } /** Chave derivada estava vazia: identidade reapontada e estado local subido. */ | { estado: 'migrado'; saveId: string; anterior: string } /** Chave derivada ocupada: save da nuvem adotado, local guardado em backup. */ | { estado: 'adotado'; saveId: string; anterior: string } /** Não deu para saber o que há na nuvem. Nada foi movido — tenta de novo depois. */ | { estado: 'indeterminado'; saveId: string } /** O storage recusou a gravação. A identidade NÃO trocou. */ | { estado: 'storage'; saveId: string } /** Sem e-mail autenticado: não há de onde derivar. */ | { estado: 'sem-email' }`
- `function reconcileSaveId( email: string, estadoLocal: unknown): Promise<ReconcileResult>` — Realinha o `saveId` local com o e-mail autenticado, sem perder progresso. Idempotente e barata no caso comum: para quem já está logado hoje o `SAVE_ID` já é o derivado, e a função sai antes de tocar a rede. Nunca lança.
**Chamado por:** `functions/api/saveId.parity.test.js`, `src/contexts/GameStateContext.tsx`, `src/utils/spriteGen.ts`, `src/App.tsx`
**Régua:** `cloudSave.errors.test.ts`, `cloudSave.reconcile.test.ts`, `cloudSave.test.ts`
**Regra de negócio:** O save na nuvem, identificado pelo hash do e-mail — mesmo e-mail, mesmo save. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/collectionDates.ts`
**Dono de:** Registra a data em que um item de coleção (forma, sonho, achado) foi obtido pela primeira vez.
**Exports:**
- `function stampCollected( dates: Record<string, string> | undefined, id: string, dayKey: string): Record<string, string>` — Registra a data de um item, se ele ainda não tiver uma. PURA e idempotente.
- `function stampAllCollected( dates: Record<string, string> | undefined, ids: readonly string[], dayKey: string): Record<string, string>` — Registra vários de uma vez (ex.: as formas que um save já tinha).
- `function collectedAt( dates: Record<string, string> | undefined, id: string): string | null` — A data de um item, ou `null`. `null` é resposta legítima e comum.
**Chamado por:** `src/App.tsx`, `src/components/FormAlbum.tsx`
**Régua:** `collectionDates.test.ts`
**Regra de negócio:** Data de coleção de formas/sonhos/achados, para as vitrines de coleção. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/dayKeyLabel.ts`
**Dono de:** A data CURTA de um `dayKey` do jogador para as coleções — "12/09" em PT, "Sep 12" em EN. Nasceu como `dataCurta` no `AdventureDiary` e virou casa única quando o Dex ganhou "#NN · data" (canvas Pet, P2).
**Exports:**
- `function dayKeyLabel(day: string, isPt: boolean): string` — aceita ISO (`AAAA-MM-DD`, montado NA MÃO — `new Date(iso)` é meia-noite UTC e vira o dia anterior no Brasil) ou o `toDateString()`; string irreconhecível volta como veio.
**Chamado por:** `src/components/AdventureDiary.tsx`, `src/components/DreamDex.tsx`
**Régua:** `AdventureDiary.render.test.tsx` ("08/09" para `2026-09-08`), `DreamDex.render.test.tsx` ("#01 · Sep 12" / "#01 · 12/09").
**Regra de negócio:** Data de coleção de sonhos/achados, para as vitrines de coleção. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/community.ts`
**Dono de:** Cliente das rotas de comunidade: perfil público, diretório, oponentes, ranking, amigos, presentes e grupos coop.
**Exports:**
- `PublicProfileInput` (interface) — campos: `id`, `name`, `stage`, `petName`, `unlockedStages`, `pvpEnabled`, `attrs`, `tasksDone`.
- `ProfilePushResult` (interface) — O que o servidor RESPONDE ao gravar o perfil — e não é só `ok`.
- `pushProfile` — `(p: PublicProfileInput) => call<ProfilePushResult>('profile', { method: 'POST', body: p })`
- `DirectoryPlayer` (interface) — O que o diretório devolve de OUTRA pessoa. `rankPoints` e `tasksDone` saíram em 06/09/2026 (WP4.11 / proibição #21): desempenho alheio não trafega, e o corte é no servidor justamente para que uma UI futura não consiga reintroduzi-lo por descuido.
- `listPlayers` — `(search = '') => call<{ players: DirectoryPlayer[] }>('players', { params: search ? { search } : {} })`
- `PlayerDetail` (interface) — campos: `friends`.
- `getPlayer` — `(id: string) => call<{ found: boolean; player?: PlayerDetail }>('player', { params: { id } })`
- `Opponent` (interface) — campos: `id`, `name`, `petName`, `stage`.
- `getOpponents` — `(id: string) => call<{ opponents: Opponent[]; matchesLeft: number }>('opponents', { params: { id } })`
- `MatchResult` (interface) — campos: `won`, `opponent`.
- `playMatch` — `(id: string, opponentId: string) => call<MatchResult>('match', { method: 'POST', body: { id, opponentId } })`
- `RankRow` (interface) — campos: `id`, `points`, `lifetime`.
- `getRank` — `(season?: string) => call<{ season: string; rank: RankRow[] }>('rank', { params: season ? { season } : {} })`
- `getSeasonResult` — `(season: string) => call<{ season: string; top3: RankRow[] }>('seasonResult', { params: { season } })`
- `addFriend` — `(id: string, friendId: string) => call<{ ok: true; friends: string[] }>('friends', { method: 'POST', body: { id, friendId } })`
- `removeFriend` — `(id: string, friendId: string) => call<{ ok: true; friends: string[] }>('friends', { method: 'POST', body: { id, friendId, remove: true } })`
- `sendGift` — `(id: string, friendId: string) => call<{ ok: true }>('gift', { method: 'POST', body: { id, friendId } })`
- `getGifts` — `(id: string, claim = false) => call<{ gifts: Array<{ from: string; bits: number; at: number }> }>('gifts', { params: { id, ...(claim ? { claim: '1' } : {}) } })`
- `getPendingTrophies` — `(id: string, claim = false) => call<{ trophies: Array<{ season: string; place: 1 | 2 | 3 }> }>('trophies', { params: { id, ...(claim ? { claim: '1' } : {}) } })`
- `CoopMember` (interface) — campos: `id`, `name`, `stage`, `apareceuHoje`, `euMesmo`.
- `CoopGroup` (interface) — campos: `id`, `name`, `weekKey`, `code`, `members`, `progress`, `target`, `full`.
- `getCoop` — O grupo de quem pergunta, ou `null`. Não ter grupo NÃO é erro.
- `createCoop` — `(id: string, name: string) => call<{ group: CoopGroup }>('coopCreate', { method: 'POST', body: { id, name } }).then(r => r.group)`
- `joinCoop` — `(id: string, code: string) => call<{ group: CoopGroup }>('coopJoin', { method: 'POST', body: { id, code } }).then(r => r.group)`
- `coopCheckin` — "Apareci hoje". Idempotente no servidor — chamar de novo no mesmo dia não conta duas vezes, então o cliente pode chamar sem guardar estado.
- `leaveCoop` — Sair. Um toque, sem confirmação de ninguém e sem penalidade nenhuma.
**Chamado por:** `src/App.tsx`, `src/components/CoopPanel.render.test.tsx`, `src/components/CoopPanel.tsx`, `src/components/LibraryPage.amigos.render.test.tsx`, `src/components/LibraryPage.tsx`, `src/components/PlayerDetailModal.tsx`, `src/components/TournamentPage.tsx`, `src/components/spriteUrl.beacon.render.test.tsx`, `src/contexts/GameStateContext.tsx`, `src/utils/libraryNpcs.ts`
**Régua:** `community.respostaIlegivel.test.ts`
**Avisos do arquivo:**
- ⚠️ 200 com corpo que não é JSON é FALHA, não sucesso vazio — até 09/09/2026 `res.json().catch(() => ({}))` devolvia `{}` como se fosse resposta válida.
**Regra de negócio:** Diretório de jogadores, oponentes, ranking, amigos, presentes e grupos coop. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/consent.ts`
**Dono de:** Idade mínima e versão dos termos/privacidade — o registro de consentimento gravado no save.
**Exports:**
- `MIN_AGE_YEARS` — Idade mínima do Soulmon (D-06).
- `TERMS_VERSION` — Versão dos documentos aceitos. Formato de data (AAAA-MM-DD) porque é o mesmo carimbo que aparece no "Última atualização" dos HTMLs — quem lê o save consegue achar o texto exato que foi aceito.
- `PRIVACY_VERSION` — `'2026-08-25'`
- `ConsentRecord` (interface) — campos: `acceptedAt`, `termsVersion`, `privacyVersion`.
- `function buildConsentRecord(now: Date = new Date()): ConsentRecord` — O registro a gravar no save quando a pessoa marca a caixa.
- `function ageOn(birthDate: string, now: Date = new Date()): number | null` — Idade em anos completos na data `now`. `birthDate` no formato AAAA-MM-DD (o mesmo que o onboarding já monta). Data inválida devolve `null` — quem chama decide, e "não sei a idade" nunca vira "é menor".
- `function isAdult(birthDate: string, now: Date = new Date()): boolean` — ≥18 anos completos. Data ilegível NÃO é considerada maior de idade.
- `function isAgeBlocked(birthDate: string | undefined | null, now: Date = new Date()): boolean` — A pergunta que o onboarding faz ao avançar do passo da data: **esta data bloqueia?** Só bloqueia data legível de menor de 18. Sem data (save antigo, campo vazio) o fluxo segue — é a trava que impede barrar quem já joga.
- `function normalizeConsent(raw: unknown): ConsentRecord | undefined` — Normalização de load (`?? padrão` SEMPRE — CLAUDE.md): save antigo não tem o campo e volta `undefined`, sem lançar e sem inventar consentimento.
**Chamado por:** `src/components/SoulmonOnboarding.tsx`, `src/contexts/GameStateContext.tsx`, `src/utils/gateDraft.ts`, `src/utils/oracleDraft.ts`
**Régua:** `consent.test.ts`
**Regra de negócio:** Idade mínima e versão de termos aceitos, gravados no save. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/currencies.ts`
**Dono de:** Modelo das três moedas (Bits/Emblemas/Créditos): cor, estilo visual e taxa de troca — nunca se misturam.
**Exports:**
- `CurrencyId` (type) — `'bits' | 'emblems' | 'credits'`
- `CurrencyMeta` (interface) — campos: `id`, `field`, `name`, `origin`.
- `CURRENCIES` — tabela/dado de configuração (ver código; 17+ linhas).
- `bitsStyle` — Bits: calculadora, tinta primária. Existe um par histórico (`bitsStyle` retrô / `bitsStyleLight` claro) porque a cor era escolhida à mão por tema.
- `bitsStyleLight` — @see bitsStyle — mesmo estilo; o token já resolve o tema.
- `EMBLEM_COLOR` — Emblemas: dourado, com serifa — cara de medalha, não de dígito.
- `emblemStyle` — `{ fontFamily: 'var(--sm2-font-serif)', color: EMBLEM_COLOR, fontWeight: 700, letterSpacing: '0.5px', fontVariantNumeric: 'tabular-nums', }`
- `CREDIT_COLOR` — Créditos: roxo do sistema, sempre acompanhados do ícone Gem.
- `CREDIT_TO_BITS` — Quantos Bits cada Crédito vira. Só nesta direção. A troca inversa (Bits → Créditos) NÃO existe de propósito: créditos são a moeda que libera gerar o pet próprio, e permitir farmá-los em minijogo anularia a única coisa que o dinheiro real compra com exclusividade.
- `BITS_EXCHANGE` — Pacotes de troca oferecidos na loja.
- `EMBLEMS_PER_WIN` — Recompensa em Emblemas por partida de torneio.
- `EMBLEMS_PER_LOSS` — tabela/dado de configuração (ver código; 2+ linhas).
**Chamado por:** `src/App.tsx`, `src/components/ActivitiesPage.tsx`, `src/components/ShopModal.tsx`, `src/components/TournamentPage.tsx`
**Régua:** `currencies.test.ts`
**Regra de negócio:** As três moedas (Bits/Emblemas/Créditos) nunca se misturam visualmente. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/dailyReset.ts`
**Dono de:** A VIRADA DO DIA: cálculo de HP perdido, meta do dia, degeneração e redenção — a função pura que o hook de reset chama.
**Exports:**
- `GameState` (interface) — campos: `activities`, `tasks`, `healthPoints`, `maxHealthPoints`, `perfectDays`, `totalXP`, `virusPoints`, `dataPoints`, `vaccinePoints`, `evolutionStage`, `unlockedEvolutions`, `degeneratedByHP`, `currentBranch`, `lastDayWasPerfect`.
- `function getNextEvolution( currentStage: string, branch: Attr, unlockedEvolutions: string[], perfectDays = 0): string` — A forma-destino da evolução manual: nível seguinte no `branch` dado, considerando `unlockedEvolutions` e os `perfectDays` acumulados (abre o caminho de permanência ao Ultra).
- `function getPreviousForm(currentStage: string, branch: Attr = 'data'): string` — A forma anterior na escada, pelo nível atual e pelo branch.
- `MAX_HEARTS_LOST_PER_DAY` — Teto de corações perdidos por virada de dia. A perda continua PROPORCIONAL ao que não foi cumprido; isto só impede que um único dia zerado leve o pet de cheio a degenerado de uma vez. Um dia ruim é um sinal, não uma sentença.
- `ABSENCE_FORGIVENESS_DAYS` — A partir de quantos dias sem abrir o app a virada para de cobrar HP. Quem volta depois de sumir encontra o pet com saudade, não uma fatura.
- `WEEKLY_RELIEF_HEARTS` — Meio coração de volta na virada de domingo→segunda: o teto do estrago é 7 dias.
- `REST_DAYS_PER_WEEK` — P2 — UM DIA DE FOLGA POR SEMANA, GRÁTIS E AUTOMÁTICO. Modelo: o Inn do Habitica (não punir) + o congelamento do Duolingo (já está no bolso) + o Pokémon Sleep (você não ganha, mas nunca perde) — que é o produto do benchmark com a menor queda no ano 3.
- `function restWeekKeyFor(d: Date): string` — A semana à qual a folga pertence, ancorada na SEGUNDA — a mesma virada do `WEEKLY_RELIEF_HEARTS`. Ter duas semanas diferentes no mesmo arquivo faria o jogador ganhar fôlego num dia e folga noutro, sem nada que explicasse.
- `NEW_SAVE_GRACE_DAYS` — Carência de HP nas primeiras viradas de vida do save. É o MESMO mecanismo de `ABSENCE_FORGIVENESS_DAYS`, apontado para o começo em vez do retorno. Cenário medido: usuário novo cadastra 3 hábitos no tutorial e faz 1 no dia 1.
- `RETURN_GRACE_DAYS` — Rampa de HP DEPOIS de um retorno — quantas viradas seguintes à virada do retorno ainda não cobram. `ABSENCE_FORGIVENESS_DAYS` perdoava só a virada em que a ausência foi detectada: no dia seguinte `wasAway` já é `false` e a cobrança volta inteira.
- `DEGENERATION_PERFECT_DAYS_COST` — Quantos dias perfeitos custa uma degeneração REAL (queda de estágio). O piso continua sendo `floor(required/2)` do estágio novo, então quem tinha pouco não fica negativo.
- `function degeneratedPerfectDays( previousPerfectDays: number, newStageLevel: EvolutionStage): number` — OS DIAS PERFEITOS DEPOIS DE UMA QUEDA DE ESTÁGIO — dono único da regra. Existem DOIS caminhos que degeneram: o automático (HP 0 na virada, logo abaixo em `computeDailyReset`) e o MANUAL (o botão da página de Evolução, `handleDegenerate` no App).
- `function daysSinceLastReset(lastResetDate: string | undefined, now: Date): number` — Quantos dias se passaram desde a última virada. 1 = virada normal de ontem.
- `function applyRedemption<T extends { degeneratedByHP?: boolean; redeemed?: boolean }>( prev: T, evoluiu: boolean): T` — WP4.19 — A ROTA DE REDENÇÃO. Quem chega a HP 0 cai um estágio (`degeneratedByHP`), e até aqui essa queda não tinha VOLTA narrada: subir de novo era só subir, e o save carregava a marca da queda sem carregar a da recuperação.
- `function looksLikeVeteranSave(state: Record<string, any>): boolean` — Sinais de que este save JÁ VIVEU — qualquer um basta para não ser novo.
- `function saveDaysLived(state: Record<string, any>): number` — Quantas viradas este save já viveu ANTES da que está sendo calculada.
- `DailyGoalState` (interface) — Fatia do estado que a meta do dia lê.
- `function activitiesForWeekDay<A extends { id?: string; weekDays?: number[]; schedule?: Schedule }>( state: { evolutionStage: string; activities: A[]; habitRhythms?: Record<string, HabitRhythm> }, weekDay: number, dayKey?: string): A[]` — Atividades que valem PARA ESTE dia (0 = domingo). ANTES: um hábito de recorrência flexível (`timesPerWeek`, `everyNDays`) era elegível TODO dia, porque `weekDaysForSchedule` devolve `[0..6]` para eles. Só que o laço de ritmo da virada julgava a falta por `isDueOn`.
- `function tasksCompletedOn( state: { completedTasks?: Array<{ completedAt?: string; effort?: unknown }> }, dayKey: string): number` — Tarefas avulsas CONCLUÍDAS num dia (`dayKey` = `new Date().toDateString()`). Existe porque `completeTask` (utils/careRules.ts) **remove** a tarefa de `tasks` e a move para `completedTasks`.
- `function registeredForDay(state: DailyGoalState, weekDay: number, dayKey?: string): number` — O PESO cadastrado PARA ESTE dia: atividades do dia + tarefas ativas ainda na lista + tarefas do dia que já saíram da lista por terem sido feitas.
- `function dailyGoalFor(state: DailyGoalState, weekDay: number, dayKey?: string): number` — Meta do dia = `min(cadastradas no dia, requisito do estágio)`.
- `HEART_GOAL_RATIO` — P1 — A META QUE PROTEGE O CORAÇÃO É MENOR QUE A META DO DIA COMPLETO. O Habitica separa **Dailies** (obrigatório, machuca) de **Habits** (bônus, não machuca).
- `function heartGoalFor(state: DailyGoalState, weekDay: number, dayKey?: string): number` — Meta de CORAÇÃO do dia — a que a perda de HP cobra. Dono único da fórmula: `computeDailyReset` e `tasksToAvoidHeartLoss` chamam esta função, e nenhum dos dois recalcula 0,6 na mão (footgun 9).
- `function heartGoalFromDailyGoal(dailyGoal: number): number` — A conversão pura, para quem JÁ tem a meta do dia em mãos e não pode pagar uma segunda varredura das atividades (é o caso do `computeDailyReset`). `0` continua `0`: sem nada cadastrado não há o que falhar, e o piso de 1 não pode inventar uma cobrança onde não havia nenhuma.
- `function rawHeartsLostFor(done: number, goal: number, maxHP: number): number` — Corações perdidos ANTES do teto diário: proporcional ao que não foi feito. Dono único da fórmula — `computeDailyReset` e `tasksToAvoidHeartLoss` (a resposta que a UI dá) chamam esta mesma função, para o número prometido não poder divergir do número cobrado nem por arredondamento.
- `function tasksToAvoidHeartLoss( state: DailyGoalState & { maxHealthPoints?: number }, weekDay: number, dayKey?: string): number` — Quantos itens PRECISAM estar concluídos hoje para a virada não tirar coração nenhum. Dono único da resposta que a UI dá quando o jogador pergunta "quanto falta para eu não regredir?".
- `DailyResetOptions` (interface) — campos: `now`.
- `function computeDailyReset<T extends Record<string, any>>(prev: T, opts: DailyResetOptions = {}): T` — Calcula o estado do dia seguinte. Função PURA — não toca em localStorage nem dispara efeito nenhum (StrictMode invoca updaters 2×).
**Chamado por:** `src/App.tsx`, `src/components/GuideModal.tsx`, `src/contexts/GameStateContext.hydrate.fuzz.test.tsx`, `src/hooks/useDailyReset.ts`, `src/hooks/useProgressTracking.ts`, `src/utils/evolutionTarget.ts`, `src/utils/poopDrain.ts`, `src/utils/spriteTrigger.ts`
**Régua:** `dailyReset.escudos.test.ts`, `dailyReset.test.ts`
**Regra de negócio:** A virada do dia: perda de HP, meta do dia, degeneração e a rota de redenção. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/decorArt.ts`
**Dono de:** Mapa id de mobília (loja) → URL da arte.
**Exports:**
- `DECOR_ART` — Chave = id do item em utils/shop.ts (kind: 'furniture').
**Chamado por:** `src/components/PetStageDecor.tsx`, `src/components/ShopModal.tsx`
**Régua:** nenhuma (`ls src/utils/decorArt*.test.ts` vazio).

### `src/utils/attackFxArt.ts`
**Dono de:** URL do sprite de FX de ataque por elemento (18 base + 136 derivados) + estado — 924 peças em `assets/soulmon/fx-ataque/`. Era `derivedAttackFxArt.ts` até 15/09/2026 (só derivados).
**Exports:**
- `AttackFxState` (type) — `| 'cast' | 'aura' | 'slash' | 'impact' | 'defended' | 'orb'`
- `attackFx` — URL para elemento + estado, ou `undefined` (consumidor cai no emoji de `fxArt.ts`).
- `derivedAttackFx` — alias antigo de `attackFx`.
- `auraForElement` — a aura para o elemento DOMINANTE do oráculo (`planta`→`vida`, `industrial`→`aco`). D9: a única chamada por agora.
- `ATTACK_FX_COUNT`, `ATTACK_FX_STATES`.
**Chamado por:** `components/EvolutionPath.tsx`, `components/PetPage.tsx` (aura atrás da criatura no Viewport).
**Régua:** nenhuma (`ls src/utils/attackFxArt*.test.ts` vazio).

### `src/utils/achievements.ts`
**Dono de:** as 8 CONQUISTAS exibíveis (emblemas de arte), DERIVADAS do save na leitura — nada persistido, nenhuma lê streak.
**Exports:**
- `ACHIEVEMENT_IDS`, `AchievementId`, `ACHIEVEMENT_LABELS` (PT/EN).
- `unlockedAchievements(slice)` — função pura: quais conquistas estão abertas, na ordem canônica.
**Chamado por:** nenhum consumidor de UI ainda (a colocação é do canvas de identidade); `emblemArt.ts` importa o tipo.
**Régua:** `src/utils/achievements.test.ts` (cada gatilho, save vazio, as 8 com arte).

### `src/utils/animArt.ts`
**Dono de:** os spritesheets de FX quadro a quadro (`assets/soulmon/fx/anim-*.png`, N células de 64 px na horizontal).
**Exports:** `ANIM_ART` (eatCrumbs, heartBurst, showerSplash, sleepZ, poopPlop, sparklePop, dustStep, hungerDrop), `AnimSheet`, `AnimId`.
**Chamado por:** `components/CompanionHUD.tsx`, `components/CareSystem.tsx` via `components/pixel/SpriteAnim.tsx`.
**Régua:** nenhuma.

### `src/utils/emblemArt.ts`
**Dono de:** URL do emblema pixel (64²) de cada conquista de `achievements.ts`. Emblema-MOEDA continua número.
**Exports:** `emblemArt(id)`, `EMBLEM_COUNT`.
**Chamado por:** nenhum consumidor de UI ainda.
**Régua:** `src/utils/achievements.test.ts` (as 8 têm arte).

### `src/utils/gainArt.ts`
**Dono de:** peças estáticas de ganho (96²) e movimento (64²) da entrega 2, dentro do visor — `GAIN_ART` (perfectDay, levelup, chest, confetti, evolutionBurst, focusSeal, heal) e `MOVE_ART` (dustPuff, speedLines, jumpArc, landImpact, sleepZ, wakeStretch, poof).
**Chamado por:** nenhum consumidor ainda (os momentos estão listados no cabeçalho; entram com os canvases).
**Régua:** nenhuma.

### `src/utils/hudArt.ts`
**Dono de:** peças pixel do HUD dentro do visor (D3): moldura de barra 96×8, segmento 6², moldura 9-slice 96² (cantos 24).
**Exports:** `HUD_ART`.
**Chamado por:** nenhum consumidor ainda (canvas Sistema).
**Régua:** nenhuma.

### `src/utils/placeholderArt.ts`
**Dono de:** os placeholders de forma ainda não gerada (`egg`, `cocoon`, `glitch`, 256²) — D1.
**Exports:** `PLACEHOLDER_ART`, `PlaceholderId`.
**Chamado por:** nenhum consumidor ainda (ligação em `displaySprite`/Reveal na Fase 2).
**Régua:** nenhuma.

### `src/utils/sigilArt.ts`
**Dono de:** URL dos 45 sigilos do class-system (`assets/soulmon/sigilos/`, 192²) — D6.
**Exports:** `sigilArt(id)`, `SIGIL_COUNT`.
**Chamado por:** nenhum consumidor ainda (Ficha do Pet quando o Class-System entrar).
**Régua:** nenhuma.

### `src/utils/dreamArt.ts`
**Dono de:** Mapa id de sonho (`DREAM_CATALOG`) → URL da arte.
**Exports:**
- `DREAM_ART` — Chave = `Dream.id` do `DREAM_CATALOG` (utils/restWindow.ts).
**Chamado por:** `src/components/DreamDex.tsx`, `src/components/MorningDream.tsx`
**Régua:** nenhuma (`ls src/utils/dreamArt*.test.ts` vazio).

### `src/utils/dungeon.ts`
**Dono de:** Stats do jogador, montagem de onda e progressão de dificuldade da Masmorra — sem gate de HP nem limite diário.
**Exports:**
- `PLAYER_STATS` — HP e dano do JOGADOR por estagio de evolucao — a tabela de combate do lado de ca, espelho de `buildDungeonWave` do lado de la.
- `function playerStatsFor(evolutionStage: string): { hp: number; dmg: number }` — Stats do jogador para um estagio, com `rookie` como piso conhecido.
- `DungeonEnemy` (interface) — campos: `name`, `stage`, `sprite`, `hp`, `atk`, `speed`, `points`, `dmgReduction`.
- `EnemyTier` (type) — `'baby-i' | 'baby-ii' | 'rookie' | 'champion' | 'ultimate' | 'mega'`
- `LADDER_TIERS` — `['baby-i', 'baby-ii', 'rookie', 'champion', 'ultimate', 'mega']`
- `function buildDungeonWave(level: number, petStage: string): DungeonEnemy[]` — Build one wave: a random creature from each tier (rookie → mega, in order), with stats scaled by the dungeon `level`. Higher level = more enemy damage dealt and less damage taken (dmgReduction). Random each call.
- `function getDungeonDifficulty(): number` — Base dungeon level (floor 1's difficulty). Resets to 1 each week.
- `DEEP_START_BASE_COST` — WP4.5 — O SUMIDOURO RECORRENTE DE BITS: descer mais fundo. Até aqui os Bits só tinham compras ÚNICAS (decoração, cenários), então quem joga muito acumula uma moeda que não compra mais nada — e moeda que não compra nada deixa de ser recompensa.
- `function deepStartCost(currentLevel: number): number` — Custo em Bits para começar `currentLevel` andares mais fundo: `DEEP_START_BASE_COST × nível`.
- `DEEP_START_MAX_LEVEL` — Teto do que se pode comprar. Sem ele, alguém com Bits suficientes começaria numa base impossível e perderia a run no primeiro inimigo — o que não é desafio, é dinheiro queimado por uma tela que deixou.
- `function canBuyDeepStart(currentLevel: number, bits: number): boolean` — Pode comprar o início mais fundo? Exige nível abaixo do teto (`DEEP_START_MAX_LEVEL`) e Bits suficientes.
- `function setDungeonDifficultyAtLeast(level: number): number` — Raise the persisted base level to at least `level` (called on run completion).
- `function getDungeonBest(): number` — Melhor placar já registrado (`DUNGEON_BEST` no localStorage), 0 por padrão.
- `function recordDungeonScore(score: number): number` — Record a run's score; returns the (possibly new) best.
- `function rollDungeonHeartDrop(bonusChance = 0): boolean` — Roll for a heart drop (capped per day). Returns true when one dropped.
**Chamado por:** `src/App.tsx`, `src/components/DungeonGame.tsx`, `src/components/NightmareBattle.tsx`, `src/utils/nightmares.ts`
**Régua:** `dungeon.deepStart.test.ts`, `dungeon.derrotaNaoCobra.test.ts`
**Avisos do arquivo:**
- ⚠️ Até 06/09/2026 o cabeçalho afirmava reset mensal, limite diário de jogo e gate de HP na entrada — os três eram falsos (e `handleDungeonLose` já era um callback vazio). Número de balanceamento aqui muda Masmorra, Pesadelo e Arena ao mesmo tempo, e nenhum dos três avisa.
**Regra de negócio:** A Masmorra não cobra coração e não tem gate de entrada nem limite diário. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/dungeonScenes.ts`
**Dono de:** Cenários retrô da Masmorra e o sorteio de cenas por run.
**Exports:**
- `DungeonScene` (interface) — campos: `namePt`, `nameEn`, `bg`, `accent`.
- `DUNGEON_SCENES` — tabela/dado de configuração (ver código; 27+ linhas).
- `function buildRunScenes(count = 5): DungeonScene[]` — Scenes for one run: 5 picks without repeats, drawn at random from the classic retro scenes + the shop backgrounds. Every run looks different.
- `function sceneForFloor(floor: number): DungeonScene` — Scene for a run floor (1-based). Clamps to the 5 defined scenes.
**Chamado por:** `src/components/DungeonGame.tsx`
**Régua:** nenhuma (`ls src/utils/dungeonScenes*.test.ts` vazio).
**Regra de negócio:** Cada andar da Masmorra sorteia um cenário retrô diferente por run. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/elementIconArt.ts`
**Dono de:** URL do ícone de um elemento (base, derivado ou neutro).
**Exports:**
- `elementIcon` — Devolve a URL do ícone de um elemento — base, derivado ou `neutro` — ou `undefined` se não houver arte para esse id. Devolve `undefined` de propósito em vez de cair num placeholder: o consumidor decide se mostra o rótulo de texto, um traço, ou nada.
- `elementIconIds` — Todos os ids que têm ícone. Útil para testes de cobertura.
**Chamado por:** nenhum consumidor encontrado (`grep -rl` em `src/`, `functions/`, `workers/`, `desktop/`).
**Régua:** nenhuma (`ls src/utils/elementIconArt*.test.ts` vazio).

### `src/utils/entitlements.ts`
**Dono de:** Cliente do saldo real de Créditos/tier no servidor — gasto, recompensa de anúncio e verificação de compra.
**Exports:**
- `Entitlement` (interface) — campos: `tier`, `credits`, `adsLeft`, `adsEnabled`.
- `function fetchEntitlement(): Promise<Entitlement | null>` — Lê o saldo real do servidor. Retorna null se não der (offline, sem saveId).
- `function spendCredits( amount: number, reason: string, opId: string = newOpId()): Promise<Entitlement | null>` — Gasta créditos NO SERVIDOR. Só aplique o efeito no jogo se isto devolver o novo saldo — null significa recusado (sem saldo, offline) e o efeito não pode acontecer.
- `function claimAdReward(): Promise<Entitlement | null>` — Credita a recompensa do anúncio (o teto diário é aplicado no servidor).
- `function verifyPurchase(productId: string, purchaseToken: string): Promise<` — Manda um purchaseToken da Google Play para o servidor verificar. Só o servidor decide se a compra vale — aqui só repassamos e lemos o resultado.
**Chamado por:** `src/App.tsx`, `src/components/AccountSection.tsx`, `src/components/CreditsModal.tsx`, `src/components/UnlockAccountModal.tsx`, `src/utils/playBilling.ts`
**Régua:** nenhuma (`ls src/utils/entitlements*.test.ts` vazio).
**Regra de negócio:** O servidor é a única autoridade sobre Créditos e tier de conta. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/evolutionTarget.ts`
**Dono de:** Fonte ÚNICA da forma-destino da evolução manual — antes existiam três derivações divergentes no `App.tsx`.
**Exports:**
- `Branch` (type) — `'virus' | 'data' | 'vaccine'`
- `EvolutionTargetInput` (interface) — campos: `points`, `reading`, `currentBranch`, `evolutionStage`, `unlockedEvolutions`, `perfectDays`.
- `EvolutionTarget` (interface) — campos: `branch`, `stage`.
- `function evolutionTarget(input: EvolutionTargetInput): EvolutionTarget` — Combina `resolveBranch` + `getNextEvolution` — a fonte única do galho e da forma-destino da evolução.
**Chamado por:** `src/App.tsx`, `src/utils/spriteTrigger.ts`
**Régua:** `evolutionTarget.regression.test.ts`
**Regra de negócio:** Fonte única do galho + forma-destino da evolução manual. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/firstDay.ts`
**Dono de:** Progresso dos três gestos do primeiro dia (esfregar, alimentar, concluir tarefa) do onboarding.
**Exports:**
- `FirstDayGesture` (type) — `'pet' | 'feed' | 'task'`
- `FIRST_DAY_GESTURES` — Os três gestos, **na ordem em que são POSSÍVEIS**. ⚠️ A ordem era `['pet', 'feed', 'task']` e pedia, no item 2, uma coisa impossível: o save nasce com `foodInventory: {}` e o `handleFeed` retorna cedo com estoque zero — comida vem de CONCLUIR atividade, então o gesto 2 só (…)
- `FirstDayProgress` (interface) — campos: `day`, `done`.
- `function emptyFirstDay(day: string): FirstDayProgress` — Progresso vazio do primeiro dia, para o `day` dado.
- `function normalizeFirstDay(raw: unknown): FirstDayProgress | null` — Higieniza o que veio do save/localStorage — gesto desconhecido não entra.
- `function markGesture(prev: FirstDayProgress, gesture: FirstDayGesture): FirstDayProgress` — Marca um gesto. IDEMPOTENTE: repetir o mesmo gesto não muda nada, e a referência devolvida é a MESMA — o updater do React pode rodar 2×.
- `function allGesturesDone(p: FirstDayProgress): boolean` — Os três gestos (`FIRST_DAY_GESTURES`) já foram todos feitos?
- `function shouldShowFirstDay(p: FirstDayProgress | null, today: string): boolean` — O cartão ainda aparece? Não aparece quando os três gestos foram feitos (cumpriu) NEM quando o dia virou (passou).
**Chamado por:** `src/App.tsx`, `src/components/FirstDayCard.render.test.tsx`, `src/components/FirstDayCard.tsx`, `src/contexts/GameStateContext.tsx`
**Régua:** `firstDay.test.ts`
**Regra de negócio:** O cartão do primeiro dia some ao completar os três gestos ou ao virar o dia. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/fxArt.ts`
**Dono de:** URL do efeito visual (emoji-identidade) usado nos popups de batalha.
**Exports:**
- `FX_ART` — Chave = o `icon` (emoji) que os popups de batalha usam hoje.
**Chamado por:** `src/components/CompanionHUD.tsx`, `src/components/DungeonGame.tsx`, `src/components/NightmareBattle.tsx`
**Régua:** nenhuma (`ls src/utils/fxArt*.test.ts` vazio).

### `src/utils/gateDraft.ts`
**Dono de:** Rascunho do portão de e-mail (identidade) do onboarding, salvo antes do envio do link mágico.
**Exports:**
- `GATE_DRAFT_VERSION` — `1`
- `GateDraft` (interface) — campos: `v`, `soulGoal`, `soulStruggle`, `consent`, `savedAt`.
- `function readGateDraft(): GateDraft | null` — Lê o rascunho do portão. Devolve `null` se não houver, se a versão não bater ou se o formato estiver corrompido — o storage é dado NÃO confiável, e um rascunho ilegível nunca pode derrubar o onboarding.
- `function writeGateDraft( dados: Pick<GateDraft, 'soulGoal' | 'soulStruggle' | 'consent'>, now: Date = new Date()): boolean` — Grava o rascunho do portão (soulGoal/soulStruggle/consent), versionado.
- `function clearGateDraft(): void` — Apaga o rascunho do portão.
**Chamado por:** `src/components/SoulmonOnboarding.tsx`
**Régua:** `gateDraft.test.ts`
**Regra de negócio:** Rascunho do portão de e-mail do onboarding — nunca perde o que a pessoa já escreveu. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/goalToCategory.ts`
**Dono de:** Casa o texto livre do 'porquê' do usuário com uma categoria de atividade — sem rede, tudo local.
**Exports:**
- `function normalizeGoalText(raw: unknown): string` — Minúsculas, sem acento, espaço colapsado.
- `function categoryForGoal(...textos: unknown[]): ActivityCategory | null` — A categoria que melhor casa com o que a pessoa escreveu, ou `null`. `null` é resposta legítima e frequente — e é a resposta certa para texto vazio, para quem pulou as perguntas e para frase que não bate com nada.
- `function orderCategoriesForGoal<T extends ActivityCategory>( categorias: readonly T[], ...textos: unknown[] ): T[]` — A lista de categorias com a sugerida NA FRENTE — o resto na ordem original. Reordenar em vez de filtrar é deliberado: a leitura do app não é um diagnóstico, e esconder as outras categorias transformaria um palpite por palavra-chave numa decisão tomada no lugar da pessoa.
**Chamado por:** `src/components/GameTutorialFlow.tsx`
**Régua:** `goalToCategory.test.ts`
**Avisos do arquivo:**
- ⚠️ ESTA CAMADA NÃO TEM REDE — decisão D8: do texto das duas perguntas do onboarding, só o ENUM da categoria sai do aparelho, nunca o texto livre.
**Regra de negócio:** O 'porquê' do usuário nunca sai do aparelho como texto — só a categoria (enum) viaja. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/habitCreate.ts`
**Dono de:** O teto de hábitos ativos aplicado à CRIAÇÃO em lote, reconferido sobre o `prev` (achado X-6).
**Exports:**
- `HabitCapState` (interface) — Fatia do GameState que a decisão do teto lê.
- `function fitHabitCreates<A>( state: HabitCapState, novos: readonly A[], tier: AccountTier): A[]` — O prefixo de `novos` que cabe no teto, dado o estado. Prefixo, e não filtro: os candidatos são idênticos do ponto de vista do teto (todo hábito ocupa uma vaga), então o primeiro que não couber encerra o lote. Parar no primeiro também mantém a ordem que o tutorial escreveu.
**Chamado por:** `src/App.tsx`
**Régua:** `habitCreate.test.ts`
**Avisos do arquivo:**
- ⚠️ Família X-6, instância 3 — a falha estava DECLARADA por escrito no próprio comentário antigo ('a decisão é tomada fora, o updater só escreve'). Nenhum número mudou: o teto continua sendo `activityCapFor`.
**Regra de negócio:** O teto de hábitos ativos do modo grátis é o mesmo teto do Rookie. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/habitRhythm.ts`
**Dono de:** O motor de CONSTÂNCIA dos hábitos: 'N das últimas 7', escudos automáticos, marcos de maturidade.
**Exports:**
- `HabitRhythm` (interface) — O histórico de um hábito. No GameState vive como `habitRhythms?: Record<string /* activityId *\/, HabitRhythm>`. `done`/`missed`/`shielded` são conjuntos de dayKeys (não ordenados por contrato — as funções aqui não dependem da ordem de inserção).
- `HISTORY_CAP` — Teto de dayKeys guardados por lista. Ver comentário de `HabitRhythm`.
- `GOOD_CONSTANCY_RATIO` — Constância mínima para merecer um escudo. É literalmente o "5 das últimas 7" que o app exibe: o escudo é a recompensa de quem está indo bem, não um consolo de quem parou.
- `function emptyRhythm(): HabitRhythm` — Um `HabitRhythm` vazio (zero feito/perdido/escudo).
- `function dayKeyOf(date: Date): string` — A chave de dia canônica. Um lugar só, para ninguém inventar outro formato.
- `function dayKeyToDate(key: string): Date` — dayKey → meia-noite local daquele dia.
- `function isDueOn( schedule: Schedule, rhythm: HabitRhythm, date: Date, _now?: Date): boolean` — O hábito conta para este dia? `now` existe na assinatura para o chamador poder passar o relógio da sessão (o resto do motor recebe tempo por parâmetro, e uma exceção aqui viraria o `Date.now()` implícito que este arquivo existe para não ter).
- `function weekStart(date: Date): Date` — Domingo da semana de `date` (0 = domingo, coerente com `weekDays`).
- `function weeklyProgress( rhythm: HabitRhythm, schedule: Schedule, now: Date): { done: number; target: number }` — Progresso da semana corrente para `timesPerWeek`. Semana começa no DOMINGO, igual ao `weekDays` que o widget Android e o desktop já leem — duas convenções de início de semana no mesmo save é garantia de um "2 de 3" que discorda de si mesmo entre telas.
- `function habitCountsOn( source: { schedule?: Schedule; weekDays?: number[] }, rhythm: HabitRhythm | undefined, date: Date): boolean` — O hábito conta neste dia? - `weekdays`: o calendário manda (é o formato antigo e o padrão de todo save). - `everyNDays`: manda `isDueOn` — que já considera schedule + histórico, e é exatamente o que o laço de ritmo sempre usou.
- `function constancy( rhythm: HabitRhythm, now: Date, windowDays: number = CONSTANCY_WINDOW_DAYS): { done: number; window: number; ratio: number }` — A métrica que substitui o streak: "N das últimas 7". Conta apenas dias em que o hábito ERA DEVIDO — um hábito de 3x por semana não pode aparecer como 43% só porque a semana tem sete dias.
- `STEADY_WINDOW_DAYS` — ⚠️ Chamava-se `PURE_WINDOW_DAYS` / `pureWindow`, e o nome foi trocado em 06/09/2026 pelo motivo que o dossiê escreveu: **um selo que nomeia a PUREZA fabrica a impureza**.
- `function steadyWindow( rhythm: HabitRhythm, now: Date, windowDays: number = STEADY_WINDOW_DAYS): boolean` — O hábito ficou constante (sem falta não-protegida) na janela de `STEADY_WINDOW_DAYS`?
- `function habitTier(totalDone: number): HabitTier` — O marco de maturidade, em dias efetivos. Os cortes são os de `HABIT_MILESTONES` (7/21/66, de Lally et al.), não os "21 dias" populares — esse número vem de um cirurgião plástico de 1960 observando pacientes se acostumarem ao rosto novo.
- `function habitTierIcon(totalDone: number): string` — O ícone do tier de maturidade (`HABIT_TIER_ICONS[habitTier(totalDone)]`).
- `function milestoneReached(before: number, after: number): HabitTier | null` — O marco que ACABOU de ser cruzado, ou null. Existe para a celebração tocar UMA vez: `habitTier` sozinho responde "que marco é este" para sempre, então quem quisesse comemorar teria que guardar o marco anterior em algum lugar — e guardar estado de UI dentro do save é como se (…)
- `function attributeMultiplier(totalDone: number): number` — Multiplicador de rendimento de atributo do hábito. Sempre ≥ 1: o esforço antigo passa a valer MAIS, nunca menos. Um hábito maduro que rendesse menos com o tempo (a "eficiência decrescente" comum em jogos de idle) ensinaria a abandonar exatamente o que o app quer preservar.
- `function earnShield(rhythm: HabitRhythm, now: Date): HabitRhythm` — Concede NO MÁXIMO um escudo a cada `REST_SHIELD_EARN_EVERY_DAYS` dias de boa constância. A cadência é DESTA função — não do chamador. Ela já foi do chamador, e o resultado foi medido: `computeDailyReset` chamava `earnShield` a cada virada, por hábito, incondicionalmente.
- `function applyMissedDay(rhythm: HabitRhythm, dayKey: string): HabitRhythm` — Registra uma falta — consumindo escudo AUTOMATICAMENTE, se houver. É aqui que a regra 3 do cabeçalho vive.
- `function consecutiveMisses(rhythm: HabitRhythm, now: Date): number` — Faltas seguidas até agora. Anda para trás pelos dias REGISTRADOS (feito/perdido/protegido), do mais recente para o mais antigo, e para na primeira coisa que não é falta.
- `function needsIntervention(rhythm: HabitRhythm, now: Date): boolean` — "Never miss twice": só na SEGUNDA falha seguida o pet aparece. Regra 2 do cabeçalho.
- `function completeHabit(rhythm: HabitRhythm, dayKey: string): HabitRhythm` — Marca o hábito como feito no dia. Idempotente: marcar duas vezes no mesmo dia não duplica nada nem infla `totalDone` (que alimenta os marcos e o multiplicador de atributo — inflá-lo seria farm de progresso com dois toques).
**Chamado por:** `src/App.tsx`, `src/components/GuideModal.tsx`, `src/components/HabitConstancy.hideMetrics.render.test.tsx`, `src/components/HabitConstancy.tsx`, `src/components/HelpModal.tsx`, `src/components/dailyList.sm2.render.test.tsx`, `src/contexts/GameStateContext.hydrate.fuzz.test.tsx`, `src/contexts/GameStateContext.tsx`, `src/utils/dailyReset.ts`, `src/utils/petNeeds.ts`, `src/utils/rituals.ts`, `src/utils/taskTriage.ts`
**Régua:** `habitRhythm.test.ts`
**Regra de negócio:** Constância ('N das últimas 7') substitui streak — nunca zera de vez. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/i18n.ts`
**Dono de:** As traduções PT-BR/EN de toda a UI e o resolvedor de idioma inicial.
**Exports:**
- `Language` (type) — `'en-US' | 'pt-BR'`
- `function resolveLanguage(stored: string | null): Language` — Idioma inicial: o que o usuário escolheu, senão o do aparelho. Ponto ÚNICO dessa decisão.
- `Translations` (interface)
- `translations` — tabela/dado de configuração (ver código; 41+ linhas).
- `function useTranslation(language: Language)` — As traduções do idioma dado (`translations[language]`).
- `function getLanguageName(language: Language): string` — Nome do idioma em prosa ('Português'/'English').
- `function getLanguageFlag(language: Language): string` — Emoji de bandeira do idioma.
**Chamado por:** `src/App.tsx`, `src/components/AISettingsModal.tsx`, `src/components/AccountDataSection.tsx`, `src/components/AccountSection.tsx`, `src/components/ActivitiesPage.tsx`, `src/components/AdventureDiary.tsx`, `src/components/ArenaGame.tsx`, `src/components/BalanceWeekModal.tsx`, `src/components/BestiaryCard.tsx`, `src/components/BirthCard.tsx`, `src/components/BottomNav.tsx`, `src/components/ChatBox.tsx`, `src/components/CompanionHUD.tsx`, `src/components/ConfirmDialog.tsx`, `src/components/ContentModals.tsx`, `src/components/CoopPanel.tsx`, `src/components/CreateModal.tsx`, `src/components/CreditsModal.tsx`, `src/components/DailyReportModal.tsx`, `src/components/DinoGame.tsx`, `src/components/DreamDex.tsx`, `src/components/DungeonGame.tsx`, `src/components/EditModal.tsx`, `src/components/FirstDayCard.tsx`, `src/components/FormAlbum.tsx`, `src/components/GameTutorialFlow.tsx`, `src/components/GuideModal.tsx`, `src/components/HabitConstancy.tsx`, `src/components/HelpModal.tsx`, `src/components/InstallPrompt.tsx`, `src/components/ItemsWindow.tsx`, `src/components/LibraryPage.tsx`, `src/components/MemoriesCard.tsx`, `src/components/MilestoneCeremony.tsx`, `src/components/MorningCheckIn.tsx`, `src/components/MorningDream.tsx`, `src/components/NewReadingModal.tsx`, `src/components/NightmareBattle.tsx`, `src/components/OraclePage.tsx`, `src/components/PixelizerCard.tsx`, `src/components/PlayCard.tsx`, `src/components/PlayerDetailModal.tsx`, `src/components/ProtectProgressModal.tsx`, `src/components/QuickAddBar.tsx`, `src/components/RPSGame.tsx`, `src/components/RebirthModal.tsx`, `src/components/RestWindowCard.tsx`, `src/components/SettingsModal.tsx`, `src/components/SettingsPage.tsx`, `src/components/ShopModal.tsx`, `src/components/SoulmonOnboarding.tsx`, `src/components/StatsPage.tsx`, `src/components/StepRow.tsx`, `src/components/StepsCard.tsx`, `src/components/TaskEditModal.tsx`, `src/components/TaskMeta.tsx`, `src/components/TriagePile.tsx`, `src/components/UnlockAccountModal.tsx`, `src/components/WeeklyReportCard.tsx`, `src/components/WelcomePromptModal.tsx`, `src/components/form/FormKit.tsx`, `src/components/pixel/HomeHud.tsx`, `src/components/pixel/PixelKit.tsx`, `src/components/pixel/RitualPanel.tsx`, `src/components/ui/OfflineSeal.tsx`, `src/components/ui/ScreenSkeleton.tsx`, `src/contexts/GameStateContext.tsx`, `src/hooks/useCareSystem.ts`, `src/utils/spriteCopy.ts`, `src/utils/steps.ts`, `src/utils/weekdays.ts`
**Régua:** nenhuma (`ls src/utils/i18n*.test.ts` vazio).

### `src/utils/itemArt.ts`
**Dono de:** URL da arte de um item da pastinha, indexada pelo EMOJI (a chave real do inventário).
**Exports:**
- `ITEM_ART` — Chave = emoji-identidade do item (FOOD_BY_CATEGORY / SPECIAL_ITEMS).
**Chamado por:** `src/components/CompanionHUD.tsx`, `src/components/ItemsWindow.tsx`, `src/components/ShopModal.tsx`
**Régua:** nenhuma (`ls src/utils/itemArt*.test.ts` vazio).
**Avisos do arquivo:**
- ⚠️ A CHAVE É O EMOJI, deliberado: `foodInventory` indexa por emoji (save antigo, widget Android e desktop leem assim) — trocar a chave quebraria save.

### `src/utils/libraryNpcs.ts`
**Dono de:** Catálogo dos NPCs da tela Biblioteca.
**Exports:**
- `LibraryNpc` (interface) — campos: `isNpc`, `spriteUrl`.
- `LIBRARY_NPCS` — tabela/dado de configuração (ver código; 24+ linhas).
**Chamado por:** `src/components/LibraryPage.tsx`
**Régua:** nenhuma (`ls src/utils/libraryNpcs*.test.ts` vazio).

### `src/utils/loudness.ts`
**Dono de:** A política de loudness — dono único, sem I/O (run `som-01`, Fase 2), promovida do gate de prototipagem.
**Exports:**
- `CategoriaSom` (type) — As categorias da escada. `trilha` é contínua e não é SFX.
- `TETO_DBTP` — S3 — teto de true peak, em dBTP, medido com oversampling ≥4×.
- `TETO_LUFS_INTEGRADO` — S3 — teto de programa, em LUFS integrado (R1).
- `TOLERANCIA_LU` — §3.4 — tolerância do alvo por categoria, em LU.
- `DEGRAU_DB` — §3.2 item 3 — o degrau da escada, em dB. É DERIVADO (razão de 2× em escala sone), não escolhido: por isso não existe meio-degrau, e por isso `sintonia` caiu em −19,0 em vez de num −17,5 inventado por conveniência de um só som.
- `ALVO_LUFS_M` — §3.1 — a escada, em **LUFS-M** no ponto P-B, com o barramento daquela categoria soando sozinho. A ordem é por REPETIÇÃO, nunca por importância: quem repete mais entra mais baixo.
- `ALVO_TRILHA_LUFS_S` — §4.1 — alvo da trilha, em LUFS-S (janela curta de 3 s, EBU Tech 3341).
- `ORDEM_DA_ESCADA` — A ordem da escada, do mais alto ao mais baixo. Existe como declaração SEPARADA do mapa acima para o teste poder provar que a ordem foi preservada — um `Object.keys` provaria só que o mapa é igual a si mesmo.
- `CATEGORIA_DO_SOM` — **AC-4 / cobertura** — a categoria de cada som exportado por `sounds.ts`. Dono único do vínculo som↔categoria: o `sounds.ts` importa daqui e não redeclara.
- `OFFSET_MAX_DB` — **AC-5** — `|offset| > 20 dB` reprova. *"Não é calibração, é fonte errada."* O número veio da medição da Fase 1: a forma de 180 ms do `playVisorTune` pedia **+36 dB** para alcançar o alvo, e o conserto não era o ganho — era o envelope e a duração.
- `OFFSET_POR_SOM_DB` — A CALIBRAÇÃO — `alvo_da_categoria − LUFS-M do som`, em dB, medida no motor real (Chrome 152.0.7977.76, 09/09/2026) e transcrita de `squad-alpha-runs/som-01/prototyper/calibracao-loudness.json`.
- `function db2lin(db: number): number` — dB → linear. A conversão mora aqui porque o alvo mora aqui.
- `GANHO_DE_CATEGORIA_DB` — §6.4 item 1 — o bus de categoria fica em **0,00 dB**. A correção de nível é OFFSET DE PRODUÇÃO por asset (cada fonte entra no grafo já no alvo da própria categoria), nunca um ganho de categoria arbitrário: um arquivo conforme multiplicado por um ganho de categoria inventado sai (…)
- `function rotuloCategoria(cat: CategoriaSom, language: string): string` — Rótulos de superfície,  PT-BR e EN  — o `CLAUDE.md` é explícito: nunca string só em português. Usados pelo controle de volume por categoria.
**Chamado por:** `src/utils/audioBus.ts`, `src/utils/sounds.ts`
**Régua:** `loudness.contract.test.ts`
**Avisos do arquivo:**
- ⚠️ DONO ÚNICO dos números de loudness — nada aqui é redeclarado em `sounds.ts`, `audioBus.ts` ou teste (footgun 9); quem precisa de alvo importa daqui.

### `src/utils/memories.ts`
**Dono de:** Marcos de tempo junto ('memórias') a mostrar no relatório diário.
**Exports:**
- `MEMORY_MARKS` — `[30, 90] as const`
- `MemoryMark` (type) — `(typeof MEMORY_MARKS)[number]`
- `function memoryMarkFor(daysWithPet: number | null): MemoryMark | null` — O marco que este dia cruza, ou `null`. `daysWithPet` vem de `daysTogether` (`utils/anniversary.ts`), que já devolve `null` quando não há `bornAt` ou quando o relógio andou para trás — e sem idade não há memória, nunca uma inventada.
- `MemoriesInput` (interface) — campos: `daysWithPet`, `shown`.
- `function memoryToShow(input: MemoriesInput): MemoryMark | null` — Mostra a memória? `null` = não. A trava do `shown` existe porque o relatório diário pode ser reaberto e o dia do jogador pode ser recalculado — e um "momento" que acontece duas vezes deixa de ser um momento.
- `function markMemoryShown(shown: readonly number[] | undefined, mark: MemoryMark): number[]` — Registra o marco como mostrado. IDEMPOTENTE (o updater roda 2×).
**Chamado por:** `src/App.tsx`
**Régua:** `memories.test.ts`
**Regra de negócio:** Marcos de tempo junto exibidos uma única vez no relatório diário. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/missions.ts`
**Dono de:** As missões PERMANENTES (lifetime) que liberam a compra dos cenários exclusivos da loja.
**Exports:**
- `MissionState` (interface) — campos: `evolutionStage`, `unlockedEvolutions`, `dungeonKills`, `dungeonRunsCompleted`, `dinoBest`, `totalPerfectDays`.
- `Mission` (interface) — campos: `id`, `icon`, `iconName`, `namePt`, `nameEn`, `descPt`, `descEn`, `target`, `bgReward`, `progress`.
- `MISSIONS` — tabela/dado de configuração (ver código; 38+ linhas).
- `function getMissionProgress(s: MissionState): Record<string, number>` — Progress per mission id, clamped to the target.
- `function isMissionComplete(missionId: string, progress: Record<string, number>): boolean` — Whether a mission is complete, given a getMissionProgress record.
- `function isShopItemUnlocked( item: ShopItem, missionProgress: Record<string, number>): boolean` — Whether a shop item's purchase is unlocked. Locked items still render in the shop (darkened + padlock) with a hint on how to unlock them — mission-gated: unlocked once the mission is complete.
**Chamado por:** `src/App.tsx`, `src/components/ShopModal.missoes.render.test.tsx`, `src/components/ShopModal.tsx`
**Régua:** `missions.test.ts`
**Regra de negócio:** Missões permanentes liberam a compra dos 6 cenários exclusivos da loja. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/monetization.ts`
**Dono de:** Tier de conta, personagens pré-prontos do modo demo, pacotes de crédito e o portão único de criação de atividade.
**Exports:**
- `AccountTier` (type) — `'demo' | 'paid'`
- `PremadeCharacter` (interface) — campos: `id`, `name`, `bioPt`, `bioEn`.
- `PREMADE_CHARACTERS` — Os três personagens prontos do modo grátis. ⚠️ **SEM SUFIXO `-mon`, e isto é regra, não gosto** (`CLAUDE.md`, seção de arte).
- `function getDemoSprite(characterId: string, stage: string): string` — Sprite de um personagem pré-pronto (modo demo) num nível dado — usado na tela de escolha do onboarding. getSpriteForStage já sabe resolver isso quando um demoCharacterId é passado (ver utils/sprites.ts).
- `function getDemoCreatureStages(character: PremadeCharacter): CreatureStage[]` — Formas do modo demo pra alimentar a página de Evolução (EvolutionPath.tsx), que espera uma árvore CreatureStage[] no formato do oráculo.
- `REROLL_COST_CREDITS` — tabela/dado de configuração (ver código; 14+ linhas).
- `CreditPack` (interface) — Um pacote à venda. `id` é o SKU no Google Play Console (tem que bater EXATAMENTE com PRODUCTS em functions/api/billing.js). O preço mostrado aqui é só rótulo de UI — quem cobra e define o valor real é a Play.
- `CREDIT_PACKS` — tabela/dado de configuração (ver código; 5+ linhas).
- `FULL_UNLOCK_SKU` — SKU do desbloqueio completo (compra única, NÃO consumível).
- `FULL_UNLOCK_PRICE_LABEL` — Rotulo do preco do desbloqueio completo. **Ao mudar aqui, mude tambem `public/termos.html`** (secao 4, PT e EN) — o HTML estatico nao importa TS, entao quem guarda a igualdade e `src/utils/publishedPrice.test.ts`, que reprova a divergencia em vez de confiar neste comentario.
- `ADS_ENABLED` — `false`
- `AD_REWARD_CREDITS` — `5`
- `AD_DAILY_CAP` — `3`
- `DEMO_ACTIVITY_TOTAL_CAP` — O teto de hábitos ATIVOS do modo grátis. Não é um número escolhido: é o teto do Rookie, que o pagante também tem. Escrever `6` aqui faria a escada de `progression.ts` mudar um dia e este valor ficar para trás em silêncio.
- `ActivityKind` (type) — Tarefa avulsa (uma vez) × hábito (recorrente). São regras diferentes.
- `function activityCapFor(tier: AccountTier, stageCap: number): number` — O teto EFETIVO de hábitos ativos, dado o tier e o teto do estágio. É aqui que a paywall passa a cair: `stageCap` cresce com a evolução (`FORM_REQUIREMENTS`), e para o demo esse crescimento é aparado.
- `function canCreateActivity(args: { tier: AccountTier; kind: ActivityKind; habitCount: number; stageCap: number; }): boolean` — O PORTÃO. Pergunte a esta função antes de criar qualquer coisa, por qualquer caminho — é o ponto único de decisão que o vazamento de D-12 não tinha.
**Chamado por:** `src/App.tsx`, `src/components/CreditsModal.tsx`, `src/components/NewReadingModal.tsx`, `src/components/SoulmonOnboarding.batismo.render.test.tsx`, `src/components/SoulmonOnboarding.rascunho.render.test.tsx`, `src/components/SoulmonOnboarding.tsx`, `src/components/UnlockAccountModal.tsx`, `src/utils/habitCreate.ts`, `src/utils/priceLabel.ts`
**Régua:** `monetization.fronteira.test.ts`
**Regra de negócio:** O portão único (`canCreateActivity`) decide se uma atividade nova pode existir, por tier e teto do estágio. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/mood.ts`
**Dono de:** Registro de humor do check-in diário — nunca alimenta pontuação.
**Exports:**
- `MoodValue` (type) — `1 | 2 | 3 | 4 | 5`
- `MoodEntry` (interface) — campos: `date`, `mood`.
- `MoodOption` (interface) — campos: `value`, `emoji`, `labelPt`, `labelEn`.
- `MOOD_OPTIONS` — tabela/dado de configuração (ver código; 7+ linhas).
- `MOOD_LOG_CAP` — Quantos dias o histórico guarda. Registro de acompanhamento, não arquivo.
- `function getMoodOption(value: MoodValue): MoodOption` — A opção de humor (emoji + rótulo) para um valor; sem match cai no neutro (índice 2).
- `function recordMood(log: MoodEntry[] | undefined, date: string, mood: MoodValue): MoodEntry[]` — Registra o humor do dia. Responder de novo no mesmo dia SUBSTITUI — humor muda, e a pessoa tem direito de corrigir sem que o app guarde as duas coisas.
- `function moodFor(log: MoodEntry[] | undefined, date: string): MoodValue | null` — O humor registrado numa data, ou `null`.
- `function recentMoods(log: MoodEntry[] | undefined, days = 7): MoodEntry[]` — As últimas N entradas, da mais antiga para a mais recente.
- `function moodSummary( log: MoodEntry[] | undefined, language: 'pt-BR' | 'en-US'): string | null` — Uma leitura curta dos últimos dias, para o app devolver algo em vez de só coletar. Devolve `null` com menos de 3 registros — três pontos é o mínimo para dizer qualquer coisa sem inventar padrão. Importante: nenhuma das leituras julga. "Semana pesada" reconhece, não cobra.
**Chamado por:** `src/App.tsx`, `src/components/DailyReportModal.tsx`
**Régua:** `mood.test.ts`
**Regra de negócio:** Humor do check-in nunca alimenta pontuação, HP ou evolução. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/newReading.ts`
**Dono de:** Nova Leitura: o reroll do oráculo deixou de ser sorteio pago (WP5.7 / decisão H.4) — a semente vem das respostas.
**Exports:**
- `function readingSeed( answers: Record<string, string> | undefined, readingCount = 0): number` — A semente de uma leitura. Ordem das perguntas FIXA (a do `ORACLE_QUESTIONS`), nunca a ordem em que o objeto foi montado: `Object.keys` de um save carregado de JSON não tem ordem garantida entre motores, e a semente mudaria de aparelho para aparelho sem ninguém entender por quê.
- `function answersChanged( antes: Record<string, string> | undefined, depois: Record<string, string> | undefined): boolean` — As respostas mudaram em relação às da leitura atual?
**Chamado por:** `src/App.tsx`, `src/components/NewReadingModal.tsx`
**Régua:** `newReading.test.ts`
**Regra de negócio:** O reroll do oráculo deixou de ser sorteio pago — semente derivada das respostas. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/nightmares.ts`
**Dono de:** Combate a pesadelos: o sono vira conteúdo de jogo (Parte 3 do `docs/PLANO-TAREFAS.md`, camada acima da Janela de Descanso).
**Exports:**
- `NIGHTMARES_PER_NIGHT` — **Teto absoluto: 1 pesadelo por noite registrada.** É esta constante que dá o teto natural que impede farm. Dormir mais não rende mais nada; a única forma de ver mais pesadelos é ter mais NOITES — ou seja, viver mais dias, que é a única "moeda" que ninguém consegue acelerar.
- `NIGHTMARE_WAVE_SIZE` — Tamanho da onda de combate. Uma luta CURTA, bem menor que um andar de masmorra (que são 6 inimigos): isto acontece de MANHÃ, e uma mecânica de sono que exige dez minutos de combate antes do café vira obrigação.
- `MAX_FOUGHT_HISTORY` — Teto do histórico de noites já combatidas (mesmo teto de `MAX_NIGHTS`).
- `NIGHTMARE_MAX_HEART_CURE` — Cura máxima de uma vitória: **meio coração**, e o teto é regra. O carinho é a cura PRINCIPAL de HP (até 1 coração/dia). Se vencer um pesadelo curasse mais que isso, o sono viraria a rota ótima de HP e o app estaria de novo premiando o resultado fisiológico.
- `NightmareState` (interface) — campos: `fought`, `pending`.
- `function createNightmareState(): NightmareState` — Estado inicial de pesadelos (`fought: []`).
- `NightmareOffer` (interface) — campos: `count`, `tier`, `rarity`.
- `NightmareRewards` (interface) — campos: `hearts`, `energy`, `bits`, `item`.
- `function nightmareDayKey(now: Date, anchor?: PlayerDayAnchor): string` — O dayKey do pesadelo de `now` — a MANHÃ, mesma chave que `recordNight` usa em `RestNight.date`. É a única "unidade de tempo" desta mecânica: um dia civil, uma noite, no máximo um pesadelo.
- `function nightmaresFor( rest: RestState, now: Date, petStage?: string): NightmareOffer` — O pesadelo da noite de `now`. **Contagem**: 1 se existe uma noite REGISTRADA para esta manhã e ela entrou na janela (`onTime`); 0 caso contrário. Nunca mais que `NIGHTMARES_PER_NIGHT`, e nunca em função de quanto tempo a pessoa dormiu — `sleptAt`/`wokeAt` não são lidos aqui.
- `function nightmareRegularity(rest: RestState, now: Date): number` — A razão de regularidade que decide o tier — exposta para a UI explicar de onde veio o pesadelo ("sua regularidade está alta"), nunca como score.
- `function buildNightmareWave( rest: RestState, petStage: string, now: Date): DungeonEnemy[]` — A onda do pesadelo — **delegada a `buildDungeonWave`**. Não existe combate reimplementado aqui: stats, escala por nível, sprite e exclusão da linha do próprio jogador são todos da masmorra. Este módulo só decide QUANTOS e ATÉ QUE TIER — o resto é o motor que já existe.
- `function hasPendingNightmare( nm: NightmareState, rest: RestState, now: Date): boolean` — Há um pesadelo desta manhã ainda não combatido?
- `function pendingNightmare( nm: NightmareState, rest: RestState, now: Date): string | null` — O dayKey do pesadelo em aberto, ou `null`. Só a manhã de HOJE. **Pesadelo de ontem que não foi combatido expirou — e expirar não custa nada**: não vira dívida, não acumula fila, não gera aviso.
- `function markFought(nm: NightmareState, dayKey: string): NightmareState` — Marca a noite como combatida. **Idempotente** — chamar duas vezes para o mesmo dayKey não duplica nada (a virada e o modal podem rodar 2×, como em `applyMissedDay`). Poda em `MAX_FOUGHT_HISTORY`, mantendo as mais recentes.
- `function nightmareRewards(rarity: DreamRarity, won: boolean): NightmareRewards` — O que a luta rende. **Vencer restaura energia e/ou meio coração** — é ASSIM que o sono contribui para a saúde do pet: através do COMBATE, nunca por bônus passivo.
- `function nightmareName(rarity: DreamRarity, language: string): string` — Nome do pesadelo. **Fofo, nunca assustador.** O pesadelo é o adversário que o SOULMON enfrenta enquanto defende o descanso do dono, não uma ameaça ao jogador — um app que produz medo perto da hora de dormir é o oposto exato do que esta mecânica existe para fazer.
- `function nightmareFlavor(rarity: DreamRarity, language: string): string` — Descrição do pesadelo, no mesmo tom encorajador. EN + PT-BR.
**Chamado por:** `src/App.tsx`, `src/components/NightmareBattle.tsx`, `src/contexts/GameStateContext.hydrate.fuzz.test.tsx`, `src/contexts/GameStateContext.tsx`
**Régua:** `nightmares.test.ts`
**Regra de negócio:** Combate a pesadelos: 1 por noite registrada, cura no máximo meio coração. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/notifications.ts`
**Dono de:** Permissão, agendamento e disparo de notificações locais/push (Web Push e alarmes).
**Exports:**
- `NotificationPermissionState` (interface) — campos: `granted`, `denied`, `prompt`.
- `checkNotificationPermission` — tabela/dado de configuração (ver código; 10+ linhas).
- `requestNotificationPermission` — tabela/dado de configuração (ver código; 12+ linhas).
- `showNotification` — tabela/dado de configuração (ver código; 27+ linhas).
- `ScheduledNotification` (interface) — campos: `id`, `title`, `body`, `scheduledTime`, `activityId`, `taskId`, `type`.
- `getScheduledNotifications` — `(): ScheduledNotification[] => { const stored = readJson<ScheduledNotification[]>(STORAGE_KEY, []); return Array.isArray(stored) ? stored : []; }`
- `scheduleNotification` — tabela/dado de configuração (ver código; 13+ linhas).
- `removeScheduledNotification` — tabela/dado de configuração (ver código; 7+ linhas).
- `clearScheduledNotifications` — `() => { removeLocal(STORAGE_KEY); }`
- `subscribeToPush` — tabela/dado de configuração (ver código; 40+ linhas).
- `unsubscribeFromPush` — tabela/dado de configuração (ver código; 19+ linhas).
- `registerForPushNotifications` — tabela/dado de configuração (ver código; 41+ linhas).
- `unregisterFromPushNotifications` — tabela/dado de configuração (ver código; 17+ linhas).
- `checkAndShowNotifications` — O lembrete diário das 12h foi REMOVIDO (auditoria de tom). Ele disparava incondicionalmente com "Não se esqueça de checar suas atividades hoje!
- `syncActivityAlarms` — tabela/dado de configuração (ver código; 33+ linhas).
- `syncTaskAlarms` — tabela/dado de configuração (ver código; 41+ linhas).
**Chamado por:** `src/App.tsx`, `src/components/NotificationManager.tsx`, `src/components/WelcomePromptModal.tsx`, `src/hooks/useCareSystem.ts`, `src/components/AccountDataSection.tsx`
**Régua:** nenhuma (`ls src/utils/notifications*.test.ts` vazio).

### `src/utils/offerMoment.ts`
**Dono de:** Quando oferecer o desbloqueio no momento de valor (1º dia perfeito do modo demo).
**Exports:**
- `OfferMomentInput` (interface) — campos: `tier`, `wasPerfect`, `welcomeBack`, `daysWithPet`, `lastShownWeek`, `dismissed`, `currentWeek`.
- `function shouldOfferAtValueMoment(input: OfferMomentInput): boolean` — A oferta do 1º dia perfeito deve aparecer agora? Só para tier `demo`, nunca se já dispensada uma vez (dispensa é TERMINAL, quinta trava), nunca fora de um dia perfeito.
- `function isoWeekKey(dayKey: string): string | null` — Semana ISO de um `dayKey` (`YYYY-MM-DD`), no formato `YYYY-Www`. A mesma partição de `telemetry.ts`: semana ISO começa na segunda e a virada de ano cai na semana certa.
**Chamado por:** `src/App.tsx`
**Régua:** `offerMoment.test.ts`
**Regra de negócio:** O convite de desbloqueio do modo demo aparece só no 1º dia perfeito, nunca de novo se dispensado. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/oracle.ts`
**Dono de:** O ORÁCULO — motor de geração da criatura: numerologia, signo, arquétipo e as 11 formas, caminho LEGADO (sem `soulProfile`) e com ele.
**Exports:**
- `ElementId` (type) — `| 'agua' | 'fogo' | 'terra' | 'ar' | 'sombra' | 'luz' | 'planta' | 'industrial'`
- `RoleId` (type) — `'suporte' | 'tanque' | 'fisico' | 'magico' | 'alcance'`
- `SoulProfile` (type re-export) — reexportado de `soulProfile/profile.ts` só como tipo, para o `OracleInput.soulProfile` tipar sem puxar a engine pesada (`export type { SoulProfile }`).
- `AlignmentId` (type) — `'poder' | 'harmonia' | 'benevolencia'`
- `RealmId` (type) — `| 'deserto' | 'picos' | 'oceano' | 'pantano' | 'floresta' | 'cavernas' | 'gelo' | 'campina' | 'akasha'`
- `StageId` (type) — `'rookie' | 'champion' | 'perfeito' | 'mega' | 'ultra'`
- `LText` (interface) — Texto bilíngue (o app sempre exibe PT-BR e EN).
- `OraclePreferences` (interface) — campos: `element`, `realm`, `alignment`.
- `OracleInput` (interface) — campos: `fullName`, `birthDate`, `birthTime`, `birthPlace`, `answers`, `preferences`, `petDescription`, `favoriteCreature`, `rebirth`, `bestiaryInspiration`, `promptClassFlavor`, `soulProfile`.
- `OracleOverrides` (interface) — Ajustes manuais do usuário: sobrescrevem os VENCEDORES de cada eixo antes da geração criativa (arquétipo + criatura). As pontuações/barras continuam sendo a "leitura" pura dos astros — só o resultado final muda.
- `NumerologyResult` (interface) — campos: `lifePath`, `expression`, `soulUrge`, `personality`, `meanings`.
- `SignInfo` (interface) — campos: `id`, `name`, `element`, `modality`, `traits`.
- `ChineseResult` (interface) — campos: `animal`, `animalEn`, `element`, `yinYang`, `traits`.
- `VedicResult` (interface) — campos: `rashi`, `equivalent`, `element`, `traits`.
- `ScoreEntry` (interface) — campos: `source`, `points`.
- `ArchetypeResult` (interface) — campos: `noun`, `nounEn`, `adjectives`, `phrase`.
- `CreatureStage` (interface) — campos: `stage`, `branch`, `stageName`, `name`, `description`, `imagePrompt`, `imagePromptFallback`.
- `function creatureFormId(form: Pick<CreatureStage, 'stage' | 'branch'>): string` — Id da forma no MOTOR DO JOGO ('rookie' | '{champion|ultimate|mega}-{virus| data|vaccine}' | 'ultra' — ver types/progression.ts).
- `OracleResult` (interface) — campos: `input`, `seed`, `numerology`, `western`, `chinese`, `vedic`, `elementScores`, `elementBreakdown`, `dominantElement`, `secondaryElement`, `roleScores`, `roleBreakdown`, `dominantRole`, `alignmentScores`, `alignmentBreakdown`, `dominantAlignment`, `realmScores`, `dominantRealm`, `personalitySummary`, `archetype`.
- `FamilySlot` (interface) — campos: `family`, `subfamily`, `noun`, `isObject`.
- `FamilyResult` (interface) — campos: `primary`, `secondary`, `mono`.
- `function hashString(s: string): number` — FNV-1a 32 bits — hash estável do input p/ semear o RNG.
- `function mulberry32(seed: number): () => number` — Exportado para os módulos do soulProfile (ficha/bestiário) usarem o MESMO RNG semeado — segunda cópia divergiria em silêncio (footgun 9).
- `function pick<T>(rng: () => number, arr: T[]): T` — Escolhe um elemento do array pelo RNG semeado (`rng()` 0..1).
- `function normalizeName(name: string): string` — Remove acentos e tudo que não for A-Z.
- `function upperFirstText(t: string): string` — Primeira letra maiúscula — para trechos concatenados DEPOIS de um ponto final (a apoteose do mega saía "…armadura negra. apoteose de monarca…").
- `function reduceNumber(n: number): number` — Reduz um número à soma repetida dos dígitos, preservando os números mestres 11/22/33.
- `function computeNumerology(fullName: string, birthDate: string): NumerologyResult` — Caminho de vida e expressão pela numerologia pitagórica — o motor do caminho LEGADO (sem `soulProfile`); ver `soulProfile/numerology.ts` para a versão completa usada com o perfil.
- `function signInfoByName(namePt: string): SignInfo | null` — Signo (nome PT do mapa astral, ex.: "Escorpião") → SignInfo do jogo. O `SignInfo` carrega as falas que alimentam o resumo de personalidade, e o mapa astral real devolve só o nome do signo.
- `function westernSunSign(month: number, day: number): SignInfo` — O signo solar ocidental por faixas de data (método direto).
- `function approximateAscendant(sunSignId: string, hour: number, minute: number): SignInfo` — Ascendente APROXIMADO (método solar simplificado): o ascendente muda a cada ~2h; assumindo o Sol no ascendente ao nascer do dia (~6h), avança um signo a cada 2 horas a partir daí. É estimativa lúdica, não substitui mapa real.
- `function computeChinese(year: number, month: number, day: number): ChineseResult` — Animal e elemento do zodíaco chinês pelo ano (corte do ano-novo aproximado em 4/fev).
- `function computeVedic(month: number, day: number): VedicResult` — O signo védico (sideral) pela data, por sankranti.
- `ELEMENT_INFO` — tabela/dado de configuração (ver código; 10+ linhas).
- `ROLE_INFO` — tabela/dado de configuração (ver código; 7+ linhas).
- `ALIGNMENT_INFO` — tabela/dado de configuração (ver código; 17+ linhas).
- `REALM_INFO` — tabela/dado de configuração (ver código; 41+ linhas).
- `ALIGNMENT_ORDER` — `['poder', 'harmonia', 'benevolencia']`
- `REALM_ORDER` — `['deserto', 'picos', 'oceano', 'pantano', 'floresta', 'cavernas', 'gelo', 'campina', 'akasha']`
- `NUMBER_ELEMENTS` — tabela/dado de configuração (ver código; 5+ linhas).
- `NUMBER_ROLES` — tabela/dado de configuração (ver código; 4+ linhas).
- `ELEMENT_ORDER` — `['agua', 'fogo', 'terra', 'ar', 'sombra', 'luz', 'planta', 'industrial']`
- `ROLE_ORDER` — `['suporte', 'tanque', 'fisico', 'magico', 'alcance']`
- `QuestionEffects` (interface) — campos: `elements`, `roles`, `alignments`, `realms`.
- `OracleQuestion` (interface) — campos: `id`, `text`, `options`, `hint`.
- `ORACLE_QUESTIONS` — tabela/dado de configuração (ver código; 41+ linhas).
- `NUMBER_ALIGNMENT` — tabela/dado de configuração (ver código; 4+ linhas).
- `ROLE_ALIGNMENT` — `{ fisico: 'poder', tanque: 'benevolencia', suporte: 'benevolencia', magico: 'harmonia', alcance: 'harmonia', }`
- `REALM_WEIGHTS` — tabela/dado de configuração (ver código; 11+ linhas).
- `STAGE_NAMES` — tabela/dado de configuração (ver código; 7+ linhas).
- `function generateOracle(input: OracleInput, seed?: number, overrides?: OracleOverrides): OracleResult` — Gera a criatura completa a partir do `OracleInput`: numerologia, mapa astral (real com `soulProfile`, aproximado sem ele), arquétipo e as 11 formas — a função de ponta a ponta do caminho legado.
**Chamado por:** `src/App.tsx`, `src/components/EvoTrail.tsx`, `src/components/EvolutionPath.credencial.render.test.tsx`, `src/components/EvolutionPath.estados.render.test.tsx`, `src/components/EvolutionPath.scanline.render.test.tsx`, `src/components/EvolutionPath.silhueta.render.test.tsx`, `src/components/EvolutionPath.sintonia-anuncio.render.test.tsx`, `src/components/EvolutionPath.sprite.render.test.tsx`, `src/components/EvolutionPath.tsx`, `src/components/NewReadingModal.tsx`, `src/components/OraclePage.tsx`, `src/components/PetPage.tsx`, `src/components/SoulTestItem.tsx`, `src/components/SoulmonOnboarding.tsx`, `src/components/sintonia-chiado.render.test.tsx`, `src/contexts/GameStateContext.tsx`, `src/hooks/useSpriteGeneration.ts`, `src/utils/adventure.ts`, `src/utils/monetization.ts`, `src/utils/newReading.ts`, `src/utils/soulProfile/astrology/chart.ts`, `src/utils/soulProfile/astrology/types.ts`, `src/utils/soulProfile/axes.ts`, `src/utils/soulProfile/bestiary/select.ts`, `src/utils/soulProfile/ficha/buildSheet.ts`, `src/utils/soulProfile/ficha/capture.ts`, `src/utils/soulProfile/ficha/classTitle.ts`, `src/utils/soulProfile/ficha/fromInput.ts`, `src/utils/soulProfile/ficha/skills.ts`, `src/utils/soulProfile/identity.ts`, `src/utils/soulProfile/numerology.ts`, `src/utils/soulProfile/personality/labels.ts`, `src/utils/soulProfile/personality/scoring.ts`, `src/utils/soulProfile/personality/types.ts`, `src/utils/soulProfile/pipeline.ts`, `src/utils/soulProfile/ritualAnswers.ts`, `src/utils/soulProfile/types.ts`, `src/utils/weeklyMissions.ts`
**Régua:** `oracle.soulProfile.test.ts`, `oracle.test.ts`, `oracleDraft.test.ts`
**Regra de negócio:** O motor de geração da criatura — arquétipo, família e as 11 formas. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/oracleDraft.ts`
**Dono de:** Rascunho do ritual do oráculo (WP1.7) — persiste as 8 telas + 6 perguntas + 20 itens opcionais entre sessões.
**Exports:**
- `ORACLE_DRAFT_VERSION` — `1`
- `OracleDraft` (interface) — campos: `v`, `mode`, `step`, `soulGoal`, `soulStruggle`, `fullName`, `birthDate`, `birthDateText`, `birthTime`, `birthCity`, `timeUnknown`, `favoriteCreature`, `skipFavorite`, `answers`, `testAnswers`, `refine`, `consent`, `savedAt`.
- `function readOracleDraft( mode: 'onboarding' | 'upgrade', maxResumableStep: number): OracleDraft | null` — Lê o rascunho SE ele for retomável neste modo: mesmo `mode`, versão certa e passo dentro de `[1, maxResumableStep]`. Fora disso devolve `null` — um rascunho no passo de GERAÇÃO ou depois nunca é retomado (regeneraria a criatura, e geração custa).
- `function writeOracleDraft(draft: Omit<OracleDraft, 'v' | 'savedAt'>, now: Date = new Date()): boolean` — Grava em silêncio: rascunho não vale um aviso de "storage cheio".
- `function clearOracleDraft(): void` — Apaga o rascunho do ritual.
- `ORACLE_DRAFT_FORBIDDEN_KEYS` — As chaves que NUNCA podem aparecer num rascunho. Há teste travando.
**Chamado por:** `src/components/SoulmonOnboarding.copyRitual.render.test.tsx`, `src/components/SoulmonOnboarding.rascunho.render.test.tsx`, `src/components/SoulmonOnboarding.tsx`
**Régua:** `oracleDraft.test.ts`

### `src/utils/passives.ts`
**Dono de:** Os cinco traços de nascimento (todos positivos) e seus efeitos, lidos do estado.
**Exports:**
- `PetPassive` (interface) — campos: `id`, `emoji`, `namePt`, `nameEn`, `descPt`, `descEn`.
- `PET_PASSIVES` — tabela/dado de configuração (ver código; 41+ linhas).
- `function rollPetPassive(rng: () => number = Math.random): string` — Sorteia o traço de um Soulmon recém-nascido.
- `function getPassive(id: string | undefined): PetPassive | undefined` — O `PetPassive` pelo id, ou `undefined`.
- `function hasPassive(petPassive: string | undefined, id: string): boolean` — `true` se o pet tem exatamente este traço. Saves antigos (sem traço) dão `false`.
- `GULOSO_BONUS_ATTR` — Pontos de atributo extras por comida (traço Guloso).
- `function rubDailyCap(petPassive: string | undefined, baseCap: number): number` — Teto de cura por carinho no dia, considerando o traço Carinhoso.
- `function heartLossCap(petPassive: string | undefined, baseCap: number): number` — Teto de corações perdidos por dia, considerando o traço Teimoso.
- `function heartDropBonus(petPassive: string | undefined): number` — Pontos percentuais somados à chance de coraçãozinho (traço Sortudo).
- `function earliestPoopHour(petPassive: string | undefined, baseHour: number): number` — Hora mínima em que o cocô pode aparecer (traço Madrugador).
**Chamado por:** `src/App.tsx`, `src/components/StatsPage.tsx`, `src/contexts/GameStateContext.tsx`, `src/hooks/useCareSystem.ts`, `src/utils/careRules.ts`, `src/utils/dailyReset.ts`, `src/utils/poopDrain.ts`
**Régua:** `passives.test.ts`
**Regra de negócio:** Todo pet nasce com um traço de nascimento positivo, sorteado uma vez. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/petName.ts`
**Dono de:** O nome que o Soulmon MOSTRA — o `baseName` do oráculo é a criatura; este módulo aplica o apelido dado no cadastro.
**Exports:**
- `function soulmonDisplayName( meta?: { baseName?: string; petName?: string } | null): string` — O nome que o Soulmon MOSTRA. O oráculo sempre devolve um `baseName` — ele é a criatura, não o apelido. Depois de gerado, a pessoa pode batizar o bicho (passo de cadastro do onboarding).
**Chamado por:** `src/App.tsx`, `src/contexts/GameStateContext.tsx`
**Régua:** `petName.test.ts`

### `src/utils/petNeeds.ts`
**Dono de:** Brincar, cansaço e 'o que o pet gostaria agora' — brincar é oferta, nunca obrigação.
**Exports:**
- `OVERCOMMIT_EFFORT` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `PlayBuff` (interface) — O buff que brincar concede. Modesto de propósito (`PLAY_BUFF_MULTIPLIER`): brincar é OFERTA, não obrigação, e um bônus grande transformaria a oferta em dever diário — a pessoa passaria a "ter que" brincar antes de todo minijogo, que é a definição de mais uma cobrança.
- `PlayAttribute` (type) — `'virus' | 'data' | 'vaccine'`
- `PlayLog` (interface) — O registro de persistência (opcional no GameState).
- `PetNeedsState` (interface) — A fatia do GameState que este módulo lê. TODOS os campos além dos dois primeiros são opcionais: nenhum save existente tem `playLog`, e save antigo que quebra ao abrir é pior do que qualquer coisa que este arquivo entregue.
- `PLAY_ENERGY_COST` — Custo em energia de uma brincadeira. Um, e não mais: energia vem de comida, comida vem de concluir tarefa. Cobrar caro faria brincar competir com o dia perfeito (que exige energia ≥ meta do dia) — o jogo estaria punindo quem aceitou a oferta.
- `PLAY_BUFF_MULTIPLIER` — +20% de Bits no próximo minijogo. Modesto por decisão de produto.
- `PLAY_BUFF_DURATION_MIN` — Quanto tempo o buff sobrevive esperando o minijogo (min).
- `PLAY_ATTRIBUTE_POINT` — Pontos de atributo que a brincadeira rende, na categoria do buff.
- `PLAY_TIMES_PER_DAY` — Quantas vezes por dia se pode brincar.
- `function playedToday(state: PetNeedsState, todayKey: string): boolean` — Já brincou hoje?
- `function canPlay(state: PetNeedsState, todayKey: string): boolean` — Pode brincar agora: 1×/dia e energia suficiente. Devolver `false` aqui NÃO é uma punição e não deve virar aviso vermelho na UI: é só a oferta não estar disponível. Quem não brincou não perdeu nada — ver a nota grande em `tiredness` sobre o que brincar nunca pode influenciar.
- `PlayRefusal` (type) — `'already-played' | 'no-energy'`
- `function play<T extends PetNeedsState>( state: T, todayKey: string, now: Date = new Date()): { state: T; buff?: PlayBuff; refused?: PlayRefusal }` — BRINCAR. Consome `PLAY_ENERGY_COST` de energia e concede um buff temporário para o PRÓXIMO minijogo, mais um ponto de atributo da categoria do buff. ⚠️ REGRA QUE NÃO PODE SER QUEBRADA: brincar **NUNCA** pode ser condição de dia perfeito, de HP ou de evolução.
- `function activeBuff(state: PetNeedsState, now: Date): PlayBuff | null` — O buff ainda válido, ou `null`. Buff vencido simplesmente não existe mais.
- `function minigameMultiplier(state: PetNeedsState, now: Date): number` — O multiplicador a aplicar nos Bits do minijogo.  Sempre ≥ 1  — esta função não tem como devolver penalidade, e isso é regra, não detalhe.
- `function consumeBuff<T extends PetNeedsState>(state: T): T` — Gasta o buff (o minijogo aconteceu). Mantém `playLog.date` — 1×/dia continua valendo.
- `TirednessLevel` (type) — `'rested' | 'normal' | 'tired'`
- `function tiredness(state: PetNeedsState, now: Date): TirednessLevel` — O quanto o pet parece cansado. DERIVADO, sempre. Não existe `tiredness` no GameState e não pode passar a existir: no instante em que virar campo persistido, ele vira uma barra que sobe e desce sozinha — cobrança desacoplada da vida real, que é justamente o que a regra de ouro (…)
- `function tirednessMessage(level: TirednessLevel, language: string): string` — A fala do pet sobre o próprio sono. Curta, fofa e **sem emoji** — o `speak()` do app remove emoji das frases faladas. Nenhuma variante cobra, avisa ou sugere que algo foi perdido: 'tired' é cumplicidade ("a gente descansa junto"), não diagnóstico.
- `PetWishKind` (type) — `'shower' | 'play' | 'feed'`
- `PetWish` (interface) — campos: `kind`, `en`, `pt`.
- `LOW_ENERGY_RATIO` — Abaixo desta fração da energia máxima, comer é uma boa ideia.
- `function needsAttention(state: PetNeedsState, now: Date): PetWish[]` — O que o pet gostaria agora — **no máximo UM item**. O teto de um é a regra, não uma otimização de layout. Uma lista de três desejos é um painel de pendências, e painel de pendências é o Habitica: a pessoa abre o app e encontra uma fatura. Um convite de cada vez é o Finch.
**Chamado por:** `src/App.tsx`, `src/components/PlayCard.tsx`, `src/contexts/GameStateContext.hydrate.fuzz.test.tsx`, `src/contexts/GameStateContext.tsx`
**Régua:** `petNeeds.fuso.test.ts`, `petNeeds.test.ts`
**Regra de negócio:** Brincar é OFERTA, não obrigação — buff modesto, 1×/dia. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/petStage.ts`
**Dono de:** Geometria do palco do pet: linha do chão, espaços de decoração e caixa de renderização do sprite.
**Exports:**
- `GROUND_Y` — Linha do chão, em % da altura do palco. Os pés do pet caem exatamente aqui.
- `STAGE_HEIGHT` — Altura do palco em px (CompanionHUD — área do pet).
- `SlotId` (type) — `'rug' | 'floor-left' | 'trophy' | 'floor-right' | 'wall'`
- `BaseSlotId` (type) — Espaços da MOBÍLIA BASE — a peça que fica debaixo do pet (hoje: o berço).
- `SlotAnchor` (type) — Onde a decoração encosta: - 'ground' → a BASE da caixa fica na linha do chão (móvel apoiado no piso) - 'ground-flat' → a caixa fica DEITADA sobre a linha do chão (tapete) - 'hang' → a caixa é presa pelo topo, na altura declarada (parede)
- `DecorSlot` (interface) — campos: `id`, `x`, `y`, `w`, `h`, `anchor`, `namePt`, `nameEn`.
- `DECOR_SLOTS` — Os cinco espaços do palco, na ordem em que se lêem da esquerda para a direita. A distribuição é deliberada: nada no centro exato do chão, porque é onde o pet passa a maior parte do tempo, e nada colado nas bordas, que o box arredondado corta.
- `SLOT_ORDER` — `['rug', 'floor-left', 'trophy', 'floor-right', 'wall']`
- `PET_TOP_OFFSET` — Deslocamento vertical do PET dentro da área, em px a partir de `top: 50%`. É o topo da caixa do sprite (152×152, com a arte contida e centrada nela).
- `PET_BOX` — Lado da caixa do sprite do pet, em px (a arte é contida e centrada nela).
- `PET_RENDER` — Lado da caixa em que o sprite do pet é RENDERIZADO, em px.
- `BASE_SLOTS` — A caixa do berço. Ancorada ao PET (não à linha do chão, ver acima): `y` é o topo da caixa em px a partir de `top: 50%`, o mesmo zero de `PET_TOP_OFFSET`.
- `StageSetting` (type) — Onde o cenário se passa. Define que TIPO de elemento faz sentido nele — um sofá no fundo do mar não é charmoso, é erro de composição.
- `DecorFit` (type) — O que um item de decoração aceita como cenário.
- `function decorFitsSetting(fit: DecorFit, setting: StageSetting): boolean` — Um item de decoração cabe no cenário?
- `function slotBoxStyle(slot: DecorSlot): { position: 'absolute'; left: string; top: string; width: number; height: number; marginLeft: number; marginTop: number; }` — Estilo absoluto da caixa de um slot, pronto para o `style` do elemento. Uma função só — se cada tela recalcular isso na mão, elas divergem e a decoração deixa de bater com o chão.
- `function applyDecorEquip( current: Partial<Record<SlotId, string>>, itemId: string | null, slot: SlotId): Partial<Record<SlotId, string>>` — Aplica um equipar/desequipar sobre o mapa de decoração. `itemId` null LIMPA o espaço — e por isso `slot` é obrigatório: sem item não há de onde deduzir o espaço.
**Chamado por:** `src/App.tsx`, `src/components/CareSystem.tsx`, `src/components/CompanionHUD.render.test.tsx`, `src/components/CompanionHUD.tsx`, `src/components/PetStageDecor.tsx`, `src/components/ShopModal.tsx`, `src/contexts/GameStateContext.tsx`, `src/utils/backgrounds.ts`, `src/utils/shop.ts`, `src/utils/shopBuy.ts`
**Régua:** `petStage.test.ts`
**Regra de negócio:** O palco do pet é composição com espaços fixos, não canto para empilhar ícones. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/petVoice.ts`
**Dono de:** Falas curtas do pet ao concluir atividade, incluindo a fala rara (~5%).
**Exports:**
- `PetVoiceKind` (type) — `'task' | 'haunted' | 'rub' | 'shower' | 'milestone' | 'cheer' | 'rare' | 'lowHp' | 'idle'`
- `RARE_CHEER_RATE` — WP2.14 — a taxa da fala rara. ~5% das conclusões. ⚠️ **A taxa NUNCA vira alavanca.** Ela não é ajustável por evento, não sobe com nada e não desce com nada — se um dia virar botão de engajamento, é uma recompensa variável de valor zero sendo usada como isca, que é o desenho que (…)
- `function rolledRareCheer(pick: number): boolean` — `pick` é 0..1 (o chamador passa `Math.random()`). PURA para o teste poder provar que a recompensa é idêntica com e sem o sorteio.
- `PetVoiceSignal` (interface) — campos: `n`, `kind`.
- `PET_VOICE_LINES` — tabela/dado de configuração (ver código; 41+ linhas).
- `function petVoiceLine( kind: PetVoiceKind, isPt: boolean, pick: number, trait?: string): string` — Escolhe a frase. `pick` entra por parâmetro (0..1) para o teste ser determinístico sem precisar mexer no `Math.random` global — o chamador em runtime passa `Math.random()`.
**Chamado por:** `src/App.tsx`, `src/components/CompanionHUD.tsx`, `src/components/CompanionHUD.voz.render.test.tsx`
**Régua:** `petVoice.test.ts`
**Regra de negócio:** A fala rara do pet não é alavanca de nenhum evento — taxa fixa. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/pixelizer.ts`
**Dono de:** Pipeline de pixelização de imagem (remoção de fundo, paleta, reamostragem) para sprite v-pet.
**Exports:**
- `PixelizeOptions` (interface) — campos: `grid`, `colors`, `transparentBg`.
- `RGB` (type) — `[number, number, number]`
- `function removeLightBackground( data: Uint8ClampedArray, width: number, height: number, tolerance = 28): void` — Remove o fundo claro por flood-fill a partir das bordas: só apaga pixels quase-brancos CONECTADOS à borda, preservando áreas claras internas do sprite (olhos, barriga etc.). Muta o array RGBA in-place (alpha = 0).
- `function medianCutPalette(data: Uint8ClampedArray, maxColors: number): RGB[]` — Quantização median-cut: encontra até `maxColors` cores representativas entre os pixels OPACOS (alpha ≥ 128).
- `function applyPalette(data: Uint8ClampedArray, palette: RGB[]): void` — Mapeia cada pixel opaco para a cor mais próxima da paleta (in-place).
- `function countDistinctColors(data: Uint8ClampedArray): number` — Conta as cores distintas (pixels opacos) — útil para testes/validação.
- `function pixelizeBuffer( data: Uint8ClampedArray, width: number, height: number, opts: Pick<PixelizeOptions, 'colors' | 'transparentBg'>): void` — Pipeline completo sobre um buffer RGBA já reduzido ao grid final: (1) opcional: remove fundo claro; (2) quantiza a paleta; (3) aplica.
**Chamado por:** `src/components/PixelizerCard.tsx`, `src/utils/spriteGen.ts`
**Régua:** `pixelizer.test.ts`

### `src/utils/playBilling.ts`
**Dono de:** Preço localizado e compra/restauração via Google Play — só confirma benefício depois do servidor validar.
**Exports:**
- `function getLocalizedPrice(productId: string): Promise<string | null>` — WP5.8 — o preço que o Play VAI cobrar, na moeda de quem está olhando. O app mostrava um rótulo fixo em BRL escrito no cliente; fora do Brasil isso é um número errado numa tela de compra, e número errado ali é lido como promessa.
- `function isBillingAvailable(): boolean` — true só quando dá para comprar de verdade (app Android + plugin presente).
- `PurchaseResult` (type) — `| { ok: true; ent: Entitlement } | { ok: false; reason: 'unavailable' | 'cancelled' | 'invalid-purchase' | 'billing-not-configured' | string }`
- `function purchase(productId: string): Promise<PurchaseResult>` — Compra um SKU e só devolve ok:true depois que o SERVIDOR confirmou a compra junto à Google. Nunca conceda benefício sem esse ok.
- `RestoreResult` (type) — `| { ok: true; ent: Entitlement } | { ok: false; reason: 'nothing-to-restore' | 'order-in-use' | string }`
- `function restorePurchases(): Promise<RestoreResult>` — Restaurar compras — reenvia ao servidor tudo que a conta Google possui. Necessário para o usuário que reinstalou o app ou trocou de aparelho recuperar o desbloqueio completo (compra não consumível).
**Chamado por:** `src/App.tsx`, `src/components/AccountSection.tsx`, `src/components/CreditsModal.tsx`, `src/components/SoulmonOnboarding.tsx`, `src/components/UnlockAccountModal.tsx`, `src/utils/priceLabel.ts`
**Régua:** nenhuma (`ls src/utils/playBilling*.test.ts` vazio).
**Regra de negócio:** Benefício só é concedido depois que o SERVIDOR confirma a compra junto à Google. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/playerDay.ts`
**Dono de:** O DIA DO JOGADOR: fuso fixo gravado no save, a chave canônica que substitui `new Date().toDateString()`.
**Exports:**
- `PlayerDayAnchor` (interface) — O fuso FIXO em que o dia do jogador é contado. Mora no save (`GameState`), é gravado uma vez e viaja com o jogador — é isso que faz dois aparelhos concordarem.
- `function deviceOffsetMs(now: Date): number` — Offset do APARELHO no instante dado, em ms à frente do UTC.
- `function anchorOffsetMs(anchor: PlayerDayAnchor | undefined, now: Date): number | null` — O offset que a âncora manda usar no instante dado — ou `null` quando ela não diz nada de útil. `null` (e não "cai no aparelho") é de propósito: quem chama precisa poder distinguir "sem âncora, comporte-se exatamente como antes" de "âncora igual à do aparelho".
- `function playerDayKey(now: Date, anchor: PlayerDayAnchor | undefined): string` — A CHAVE DO DIA DO JOGADOR. Sem âncora, devolve exatamente `now.toDateString()` — o comportamento antigo, byte a byte.
- `function sanitizePlayerDayAnchor(raw: unknown): PlayerDayAnchor | undefined` — Higieniza o que veio do save. Save é dado NÃO CONFIÁVEL: veio da nuvem, pode ter sido editado à mão, pode ser de uma versão futura.
- `function resolvePlayerDayAnchor( existing: PlayerDayAnchor | undefined, profileZone: string | undefined, now: Date): PlayerDayAnchor` — A âncora a gravar no save, no load. Ordem, e o porquê de cada degrau: 1. **O que já está no save vence.** A âncora existe para ser ESTÁVEL.
**Chamado por:** `desktop/renderer/src/care.ts`, `src/App.tsx`, `src/contexts/GameStateContext.tsx`, `src/utils/nightmares.ts`, `src/utils/petNeeds.ts`, `src/utils/poopDrain.ts`, `src/utils/restWindow.ts`, `src/utils/rituals.ts`, `src/utils/specialItemUse.ts`
**Régua:** `playerDay.contract.test.ts`, `playerDay.test.ts`
**Avisos do arquivo:**
- ⚠️ Resíduo do achado X-4 (commit 9e9f679f): o conserto anterior tornou `rubHealRecordFor` ordem-consciente, mas não resolve sozinho o caso de aparelhos em fusos diferentes — daí este módulo.
**Regra de negócio:** O dia do jogador usa fuso FIXO gravado no save, nunca o do aparelho. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/poopDrain.ts`
**Dono de:** O dreno de coração por cocô não limpo — teto diário, pausa dormindo, banho zera.
**Exports:**
- `POOP_DRAIN_PERIOD_MS` — Um tick de dreno = 6h de cocô não limpo.
- `POOP_DRAIN_HEARTS_PER_PERIOD` — Corações cobrados por período de 6h, ANTES do teto diário.
- `SLEEP_CLOCK_BUMP_MS` — Dormindo o relógio é só empurrado; persistir a cada ≥5min evita que o bump vire spam de cloud save a noite inteira (ver CLAUDE.md, arquitetura).
- `PoopDrainCharge` (interface) — Quanto já foi cobrado pelo dreno no dia civil — é o que faz o teto ser DIÁRIO e não por tick: sem isso, bastavam quatro ticks de 6h para o dia custar 4 corações, cada um "dentro" do teto.
- `PoopDrainState` (interface) — Fatia do GameState que esta regra lê e escreve.
- `PoopDrainOptions` (interface) — campos: `now`, `isSleeping`.
- `function chargedToday(state: PoopDrainState, now: number): number` — Corações já cobrados HOJE pelo dreno. "Hoje" é o dia do JOGADOR, não o do aparelho.
- `function remainingDrainToday(state: PoopDrainState, now: number): number` — Quanto o dreno ainda PODE cobrar hoje (0 = o teto do dia já foi gasto). Usado também pelo aviso de ~30min: avisar de um tick que não vai cobrar nada é assustar de graça — e o Soulmon não é cobrador.
- `function applyPoopDrain<T extends PoopDrainState>(state: T, opts: PoopDrainOptions): T` — Aplica o dreno de cocô ao estado. Devolve o MESMO objeto quando nada muda (o chamador está dentro de um updater de `setGameState`; devolver `prev` é o que evita re-render à toa).
- `CleanPoopRefusal` (type) — Por que o banho não escreveu nada. Nunca é erro — é "não havia o que fazer".
- `CleanPoopState` (interface) — Fatia do estado que o banho lê e escreve.
- `CleanPoopOptions` (interface) — campos: `at`.
- `function cleanPoop<T extends CleanPoopState>( state: T, opts: CleanPoopOptions = {}): { state: T; refused?: CleanPoopRefusal }` — Dá banho. Devolve o MESMO objeto quando nada mudaria — o chamador do app está dentro de um `setGameState`, e devolver `prev` é o que evita re-render à toa.
**Chamado por:** `desktop/renderer/src/care.ts`, `src/App.tsx`
**Régua:** `poopDrain.cleanPoop.test.ts`, `poopDrain.regression.test.ts`
**Avisos do arquivo:**
- ⚠️ O dreno NÃO respeita a folga semanal (`REST_DAYS_PER_WEEK`) — decisão do dono (08/09/2026): a folga absorve só a perda da virada do dia, porque o dreno cobra presença (só tira coração de quem abriu o app e viu o cocô).
**Regra de negócio:** O dreno de cocô respeita o mesmo teto diário e os mesmos perdões da virada, exceto a folga semanal. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/priceLabel.ts`
**Dono de:** Rótulo de preço com moeda explícita (nunca só 'R$') e os hooks que trocam para o preço real do Play.
**Exports:**
- `MOEDA_DO_FALLBACK` — A moeda dos rótulos de FALLBACK deste arquivo. Todo `priceLabel` escrito à mão em `monetization.ts` está em real, porque é a moeda em que o produto foi publicado.
- `function precoComMoeda(label: string, ehFallback: boolean, isPt: boolean): string` — "R$ 29,90" não diz de que moeda é para quem está em inglês. O símbolo `R$` é lido como real por quem já conhece o real, e por mais ninguém — e o dossiê condena exatamente o "preço opaco".
- `function useUnlockPriceLabel(isPt: boolean): string` — O rótulo de preço do desbloqueio completo. Começa na constante e TROCA quando o Play responde — nunca fica vazio nem mostra um esqueleto: um preço que aparece depois é melhor que um espaço em branco onde o preço deveria estar, e piscar de "R$ 29,90" para o preço local é honesto (…)
- `function useCreditPackLabels(isPt: boolean): Record<string, string>` — Os rótulos dos PACOTES DE CRÉDITO, pelo mesmo caminho. ⚠️ O WP5.8 consertou o preço opaco do desbloqueio e **deixou os pacotes para trás**: o `CreditsModal` imprimia `pack.priceLabel` cru, ou seja, a constante em real, para todo mundo do planeta.
**Chamado por:** `src/components/CreditsModal.tsx`, `src/components/SoulmonOnboarding.tsx`, `src/components/UnlockAccountModal.tsx`
**Régua:** `priceLabel.test.ts`
**Avisos do arquivo:**
- ⚠️ `getLocalizedPrice` já existia (Kotlin + `playBilling.ts`) e NENHUMA tela o consumia (auditoria de 06/09/2026) — as cinco superfícies de preço imprimiam a constante fixa 'R$ 29,90'.

### `src/utils/pushPriming.ts`
**Dono de:** O SEGUNDO convite de notificação, depois do primeiro dispensado, dentro de uma janela de dias.
**Exports:**
- `PRIMING_MIN_DAYS` — Não antes do dia 2 de vida da criatura.
- `PRIMING_MAX_DAYS` — Nem depois do 3: passou disso, o momento já foi e insistir vira ruído.
- `PRIMING_MIN_HOURS_AFTER_DISMISS` — E nunca menos de um dia depois de a pessoa ter dito "agora não".
- `PushPrimingInput` (interface) — campos: `daysWithPet`, `notificationsEnabled`, `firstDismissedAt`, `secondDismissed`, `returningFromAbsence`, `now`.
- `function shouldPrimePush(input: PushPrimingInput): boolean` — O segundo convite de notificação deve aparecer? Exige notificação ainda desligada, o primeiro convite já dispensado, sem retorno de ausência, e dentro da janela `PRIMING_MIN_DAYS..PRIMING_MAX_DAYS`.
- `function pushPrimingLine(isPt: boolean): string` — A frase. É do PET, na primeira pessoa, e pergunta — não anuncia benefício. "Ative as notificações para não perder seu progresso" é o app falando de si; "posso te lembrar de mim amanhã?" é a criatura pedindo, que é a única voz que este produto tem para pedir alguma coisa.
**Chamado por:** `src/App.tsx`
**Régua:** `pushPriming.test.ts`
**Regra de negócio:** O segundo convite de notificação nunca aparece antes de um dia depois do primeiro 'agora não'. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/quickAdd.ts`
**Dono de:** QUICK ADD: uma linha de texto vira tarefa ou hábito ('pagar boleto amanhã 14h !2 #trabalho').
**Exports:**
- `QuickAddResult` (interface) — campos: `kind`, `name`, `category`, `effort`, `schedule`, `date`, `time`, `tokens`.
- `QuickAddOptions` (interface) — campos: `now`, `language`.
- `function parseQuickAdd(input: string, opts: QuickAddOptions): QuickAddResult` — Lê uma linha e devolve o que der para entender dela. Não valida, não recusa, não avisa: o que não for reconhecido simplesmente continua fazendo parte do nome. Um token mal escrito custa um chip a menos, nunca a captura inteira.
- `function quickAddHint(language: 'pt-BR' | 'en'): string` — Exemplo para o placeholder do campo. A sintaxe se ensina sozinha se o exemplo mostrar quatro tokens de uma vez — nenhum usuário abre a ajuda.
**Chamado por:** `src/App.tsx`, `src/components/CreateModal.tsx`, `src/components/QuickAddBar.tsx`
**Régua:** `quickAdd.test.ts`
**Regra de negócio:** Uma linha de texto vira tarefa ou hábito sem recusar nada — o não reconhecido vira nome. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/rebirth.ts`
**Dono de:** O RENASCIMENTO: elegibilidade motivada, escolhas da cerimônia e a reescrita idempotente do save.
**Exports:**
- `REBIRTH_REQUIRED_STAGE` — Estágio que habilita o Rebirth. O ápice da escada, não um número solto.
- `REBIRTH_BUDGET_MULTIPLIER` — O ganho: multiplicador sobre o ORÇAMENTO de pontos da ficha, em TODOS os estágios (`ROOKIE_BUDGET` × `STAGE_MULTIPLIER` × isto). Renascer rende uma criatura mais funda desde o primeiro nível e, por composição, em todos os seguintes — que é exatamente a promessa feita ao jogador.
- `RebirthElementOption` (interface) — Uma escolha de elemento vai até o SEGUNDO nível: base ou par derivado.
- `RebirthEscolaOption` (interface) — campos: `id`, `nome`.
- `RebirthChoices` (interface) — As escolhas do jogador na cerimônia. `criatura` é campo ABERTO.
- `RebirthRecord` (interface) — campos: `at`, `fromStage`.
- `REBIRTH_CRIATURA_MAX` — Teto do campo aberto. Ele entra em prompt de gerador de imagem: texto longo demais não é criatividade, é injeção de instrução.
- `function rebirthEscolaOptions(): RebirthEscolaOption[]` — As 6 escolas do class-system, na ordem do snapshot. Dropdown, não texto.
- `function rebirthElementOptions(): RebirthElementOption[]` — Elementos oferecidos: os 17 base + os pares derivados (2º nível).
- `function isValidRebirthElement(id: string): boolean` — O id está entre as opções válidas de elemento do Rebirth?
- `function isValidRebirthEscola(id: string): id is EscolaId` — O id é uma escola válida do class-system (type guard `EscolaId`).
- `function sanitizeCriatura(raw: unknown): string` — Higieniza o campo aberto ANTES de ele virar prompt: colapsa espaço, corta no teto e remove quebra de linha e cerca de código — os dois vetores que transformam "descreva sua criatura" em "ignore as instruções acima".
- `RebirthEligibilityInput` (interface) — campos: `evolutionStage`, `accountTier`, `rebirth`.
- `RebirthRefusal` (type) — Por que uma RECUSA com motivo em vez de um booleano: cada motivo tem uma saída diferente na tela (comprar, subir a escada, ou nada — já usou). Um `false` mudo mandaria o jogador adivinhar qual dos três é.
- `function rebirthRefusal(input: RebirthEligibilityInput): RebirthRefusal` — Por que o Rebirth seria recusado agora — `already-used` > `not-paid` > `not-ultra`, nessa ordem — ou `null` se elegível.
- `function canRebirth(input: RebirthEligibilityInput): boolean` — Atalho booleano sobre `rebirthRefusal`.
- `RebirthTarget` (interface) — O alvo mínimo que `applyRebirth` sabe reescrever. Genérico em `T` para o chamador passar o `GameState` inteiro e receber ele de volta sem perder campo — o mesmo contrato de `taskTriage`.
- `RebirthOutcome` (interface) — campos: `state`, `applied`, `refusal`.
- `function applyRebirth<T extends RebirthTarget>( prev: T, choices: RebirthChoices, now: Date): RebirthOutcome<T>` — Aplica o renascimento. IDEMPOTENTE por construção: a segunda chamada bate em `already-used` e devolve o estado IDÊNTICO (a mesma referência), porque o registro que ela mesma gravou é o que a barra.
**Chamado por:** `src/App.tsx`, `src/components/RebirthModal.tsx`, `src/contexts/GameStateContext.tsx`
**Régua:** `rebirth.test.ts`
**Regra de negócio:** Renascer troca a forma por uma ficha maior — Bits, Emblemas e progresso passam intactos. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/restWindow.ts`
**Dono de:** A Janela de Descanso (sono) + a coleção de Sonhos (Parte 3 do `docs/PLANO-TAREFAS.md`) — funções puras, `now: Date` sempre por parâmetro.
**Exports:**
- `RestWindow` (interface) — campos: `start`, `end`.
- `RestNight` (interface) — campos: `date`, `sleptAt`, `wokeAt`, `onTime`.
- `RestState` (interface) — campos: `window`, `nights`, `dreams`, `dreamDates`, `hideMetrics`, `playerDayTz`.
- `MAX_NIGHTS` — `30`
- `SLEEP_REMINDER_LEAD_MIN` — Minutos ANTES do início da janela para o lembrete de deitar.
- `function createRestState(window: RestWindow = { ...DEFAULT_REST_WINDOW }): RestState` — Estado inicial da Janela de Descanso, com `DEFAULT_REST_WINDOW` se nenhuma janela for dada.
- `function parseTime(hhmm: string): number` — `'23:00'` → 1380. Minutos desde a meia-noite; `NaN` se não for 'HH:MM'.
- `function crossesMidnight(window: RestWindow): boolean` — A janela atravessa a meia-noite (23:00–07:00 é o caso normal, não a exceção).
- `function isWithinWindow( window: RestWindow, at: Date, graceMin: number = REST_WINDOW_GRACE_MIN): boolean` — O instante `at` está dentro da janela? A tolerância se aplica ao **INÍCIO**: deitar um pouco ANTES do horário combinado conta (o começo recua `graceMin`), e deitar um pouco DEPOIS já está dentro da janela por construção.
- `function morningKey( sleptAt: Date, wokeAt?: Date, anchor?: PlayerDayAnchor): string` — O dayKey da MANHÃ de uma noite. Deitou de noite (meio-dia em diante) → a manhã é a do dia seguinte. Deitou de madrugada (antes do meio-dia) → a manhã já é a do mesmo dia civil. Se houver `wokeAt`, ele manda: é literalmente a manhã.
- `function recordNight(state: RestState, sleptAt: Date, wokeAt?: Date): RestState` — Registra uma noite. **Idempotente por dayKey da manhã** — chamar duas vezes para a mesma manhã atualiza o registro, nunca cria um segundo. Poda em `MAX_NIGHTS` mantendo as mais recentes.
- `RestConstancy` (interface) — campos: `onTime`, `window`, `ratio`.
- `function restConstancy( state: RestState, now: Date, windowDays: number = REST_WINDOW_DAYS): RestConstancy` — A média móvel de regularidade nas últimas `windowDays` manhãs.
- `DreamRarity` (type) — `'common' | 'rare' | 'legendary'`
- `Dream` (interface) — campos: `id`, `emoji`, `labelEn`, `labelPt`, `rarity`, `season`.
- `DREAM_CATALOG` — O Sleep Style Dex do Soulmon. Cada noite dentro da janela o pet SONHA, e o sonho é uma cena colecionável do próprio pet.
- `DREAMS_BY_RARITY` — tabela/dado de configuração (ver código; 5+ linhas).
- `RARITY_MIN_NIGHTS` — A partir de quantas noites registradas a razão é considerada legível.
- `RARITY_RARE_AT` — `0.5`
- `RARITY_LEGENDARY_AT` — `0.8`
- `function dreamRarity(state: RestState, now: Date): DreamRarity` — A raridade do sonho da noite. **Ligada à REGULARIDADE (a razão da média móvel), NUNCA à duração do sono.** A escolha não é estética, é a leitura mais bem embasada que existe: no UK Biobank (n=60.977), o Sleep Regularity Index previu mortalidade por todas as causas MELHOR que a (…)
- `SEASON_DREAM_WEIGHT` — Quantas vezes o sonho da estação corrente entra no bilhete do sorteio. 3 = três vezes mais provável que um sonho fora de estação da mesma faixa.
- `function rollDream( state: RestState, rarity: DreamRarity, seed: number, now: Date = new Date()): string` — Sorteia o sonho da noite. **Determinístico por `seed`** — mesmo estado, mesma raridade, mesma seed e mesma data devolvem sempre o mesmo id. A aleatoriedade mora em quem chama (a seed costuma ser derivada do dayKey da manhã), nunca aqui.
- `function collectDream(state: RestState, dreamId: string, dayKey?: string): RestState` — Guarda o sonho no Dex. Idempotente: coletar de novo não duplica nem tira nada. WP4.10 — grava também QUANDO. A coleção existia sem data, e sem data ela é uma lista; com data ela vira história ("esse foi na primeira semana").
- `function dexProgress(state: RestState): { collected: number; total: number }` — Completude do Dex. Só cresce — é barra de coleção, não de desempenho.
- `function sleepReminderAt(window: RestWindow, now: Date): Date | null` — Quando lembrar de DEITAR — `SLEEP_REMINDER_LEAD_MIN` antes do início da janela, sempre a próxima ocorrência a partir de `now`. `null` se a janela for inválida.
**Chamado por:** `desktop/renderer/src/care.ts`, `src/App.tsx`, `src/components/DreamDex.tsx`, `src/components/GuideModal.tsx`, `src/components/HelpModal.tsx`, `src/components/MorningDream.tsx`, `src/components/NightmareBattle.tsx`, `src/components/NotificationManager.tsx`, `src/components/RestWindowCard.tsx`, `src/components/StatsPage.tsx`, `src/contexts/GameStateContext.hydrate.fuzz.test.tsx`, `src/contexts/GameStateContext.tsx`, `src/utils/nightmares.ts`, `src/utils/petNeeds.ts`, `src/utils/rituals.ts`, `src/utils/seasons.ts`
**Régua:** `restWindow.test.ts`
**Regra de negócio:** A Janela de Descanso premia o COMPORTAMENTO de deitar no horário, nunca o resultado do sono. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/rituals.ts`
**Dono de:** Os rituais — check-in, relatório semanal e Fresh Start (Parte 2.4 do `docs/PLANO-TAREFAS.md`).
**Exports:**
- `MAX_DAILY_FOCUS` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `RitualActivity` (interface) — Hábito, do ponto de vista dos rituais.
- `RitualCompletedTask` (interface) — Tarefa concluída, do ponto de vista dos rituais.
- `RitualState` (interface) — O recorte do `GameState` que este módulo enxerga. TODOS os campos são opcionais fora de `activities`/`tasks` porque nenhum save existente tem `habitRhythms`, `rest` ou as três datas de ritual — e um save antigo que quebra ao abrir é pior que qualquer ritual que este arquivo (…)
- `RitualLanguage` (type) — `string`
- `function needsCheckIn(state: RitualState, now: Date): boolean` — Precisa fazer o check-in de hoje? Um por dia civil, e só isso: `lastCheckInDate` não é hoje. Nada de janela de horário — o "matinal" é o convite, não uma tranca.
- `CheckInPlan` (interface) — campos: `habitsToday`, `suggestedFocus`, `carryOver`, `overcommitted`, `plannedEffort`, `tinyOffer`.
- `function checkInPlan(state: RitualState, now: Date): CheckInPlan` — O plano do dia. `carryOver` vem PRIMEIRO por decisão de produto: é o Shutdown ritual do Sunsama invertido para caber num app mobile. No Sunsama você fecha o dia à noite; aqui, se você não fechou ontem, hoje COMEÇA por ali.
- `function completeCheckIn<T extends RitualState>( state: T, focusIds: string[], dayKey: string): T` — Fecha o check-in: grava os focos escolhidos e a data do ritual. O corte em `MAX_DAILY_FOCUS` e a limpeza dos focos antigos são de `setFocus` — este módulo não reimplementa a regra do foco, ele a chama. Regra copiada é regra que diverge em silêncio (footgun 9 do CLAUDE.md).
- `function needsWeeklyReport(state: RitualState, now: Date): boolean` — É domingo e o relatório desta semana ainda não foi mostrado?
- `function weeklyReportHasSubstance(state: RitualState, now: Date): boolean` — O relatório desta semana tem ALGUMA coisa dentro? O calendário sozinho não bastava, e o caso medido é o de quem instala o app num sábado: no domingo — SEGUNDA sessão da vida do save — ele recebia um painel "SUA SEMANA" com a lista de hábitos vazia (todo hábito novo cai em (…)
- `WeeklyHabitLine` (interface) — campos: `id`, `name`, `emoji`, `done`, `window`, `ratio`, `tier`.
- `WeeklyReport` (interface) — campos: `perHabit`, `bestHabitId`, `dominantCategory`, `tasksDone`, `effortDone`, `dreams`.
- `function weeklyReport(state: RitualState, now: Date): WeeklyReport` — A leitura da semana. Tudo aqui é DESCRIÇÃO, nunca veredito: constância por hábito, o hábito que foi melhor, a categoria dominante, esforço concluído e o Dex de sonhos.
- `STACKING_STRONG_RATIO` — Constância a partir da qual um hábito serve de ÂNCORA (o forte).
- `STACKING_WEAK_RATIO` — Constância abaixo da qual um hábito é candidato a ser ancorado (o fraco).
- `STACKING_MIN_WINDOW` — Dias registrados mínimos para a leitura valer alguma coisa.
- `function stackingSuggestion( state: RitualState, now: Date, language: RitualLanguage): string | null` — A sugestão de HABIT STACKING — "depois de X, faça Y". Acha um hábito com constância ALTA e um com constância BAIXA e propõe ancorar o fraco logo depois do forte.
- `function isFreshStartDay(now: Date, state?: RitualState): boolean` — Segunda-feira ou dia 1 do mês. Dai, Milkman & Riis (*fresh start effect*): marcos temporais aumentam adesão porque "relegam as imperfeições ao período anterior" — a pessoa passa a ver a si mesma como alguém novo, separado de quem falhou na semana passada.
- `function freshStartHasSomethingToClear(state: RitualState): boolean` — Existe COBRANÇA PENDENTE para o recomeço limpar? O fresh start é perdão de dívida, e perdão de dívida oferecido a quem não deve nada não é neutro: ele APRESENTA a dívida.
- `FreshStartOffer` (interface) — campos: `title`, `body`.
- `function freshStartOffer( state: RitualState, now: Date, language: RitualLanguage): FreshStartOffer | null` — O convite de recomeço, ou `null` fora de um marco / se já foi aceito hoje. O texto diz por extenso o que a mecânica faz, e isso é requisito: um "recomeçar" ambíguo faria o usuário temer perder o pet, e o medo de clicar é pior que não oferecer nada.
- `function applyFreshStart<T extends RitualState>(state: T, now: Date): T` — Aceita o recomeço. **FRESH START NUNCA APAGA PROGRESSO.** Mantém 100% da evolução (`evolutionStage`, `perfectDays`, atributos), 100% dos marcos de hábito (`habitRhythms`, incluindo `totalDone`, que é o que alimenta os marcos de 7/21/66 dias) e 100% da coleção de sonhos (…)
- `isHaunted` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `isOverdue` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
**Chamado por:** `src/App.tsx`, `src/components/WeeklyReportCard.tsx`
**Régua:** `rituals.test.ts`
**Regra de negócio:** Check-in, relatório semanal e Fresh Start — nunca apagam progresso, só a cobrança. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/safeStorage.ts`
**Dono de:** Camada única de acesso a `localStorage`: nunca lança, avisa o usuário só uma vez por degradação.
**Exports:**
- `StorageFailureKind` (type) — `'read' | 'write' | 'quota'`
- `function onStorageDegraded(fn: Listener | null): void` — Registra quem avisa o usuário. Só o primeiro evento chega: um storage cheio falha em TODA gravação seguinte, e um toast por gravação seria uma segunda falha em cima da primeira.
- `function resetStorageNotice(): void` — Só para teste — o estado de "já avisei" é global de propósito.
- `function storageNoticeSent(): boolean` — `true` depois que o usuário já foi avisado nesta sessão.
- `WriteOptions` (interface) — Opções de gravação. `silent: true` = **a falha é cosmética**. O valor continua sendo registrado no console (quem depura precisa ver), mas NÃO gasta o único aviso ao usuário.
- `function readLocal(key: string): string | null` — Lê. Devolve `null` em qualquer falha — nunca lança.
- `function writeLocal(key: string, value: string, opts?: WriteOptions): boolean` — Grava. Devolve `false` quando não deu — nunca lança.
- `function removeLocal(key: string, opts?: WriteOptions): boolean` — Apaga. Devolve `false` quando não deu — nunca lança.
- `function readJson<T>(key: string, fallback: T): T` — Lê JSON. Devolve `fallback` quando não há valor, quando o storage falha **ou quando o conteúdo está corrompido** — nunca lança. JSON inválido NÃO é falha de plataforma: registra no console, mas não gasta o aviso ao usuário (não há nada que ele possa fazer sobre bytes tortos).
- `function writeJson(key: string, value: unknown, opts?: WriteOptions): boolean` — Grava JSON. Devolve `false` quando não deu — nunca lança.
- `function readFlag(key: string): boolean` — Lê um booleano no formato do app (`'true'`/qualquer outra coisa).
- `function writeFlag(key: string, on: boolean, opts?: WriteOptions): boolean` — Grava um booleano no formato do app.
- `function readNumber(key: string, fallback = 0): number` — Lê um número. `fallback` quando ausente, ilegível ou não numérico.
- `function storageDegradedMessage( kind: StorageFailureKind, language: 'pt-BR' | 'en-US'): string` — Mensagem do aviso ao usuário. Par PT/EN como todo texto de UI.
- `FlagState` (type) — Leitura TRI-ESTADO de um flag. Existe por causa de uma armadilha de MEDIÇÃO, documentada em `squad-alpha-runs/som-01/discovery/metrica-de-som.md` §6. `readFlag` acima devolve `false` tanto para "a pessoa escolheu `false`" quanto para "não conseguimos ler".
- `function readFlagState(key: string): FlagState` — Leitura tri-estado de um flag: `'on'`/`'off'`/`'absent'`/`'unknown'` (storage indisponível).
**Chamado por:** `src/App.tsx`, `src/components/AISettingsModal.tsx`, `src/components/AccountDataSection.tsx`, `src/components/CompanionHUD.tsx`, `src/components/ConfirmDialog.tsx`, `src/components/DinoGame.tsx`, `src/components/ErrorBoundary.tsx`, `src/components/InstallPrompt.tsx`, `src/components/OraclePage.tsx`, `src/components/PetPage.tsx`, `src/components/SettingsModal.tsx`, `src/components/SettingsPage.tsx`, `src/components/SoulmonOnboarding.tsx`, `src/components/WelcomePromptModal.tsx`, `src/contexts/GameStateContext.storage.test.tsx`, `src/contexts/GameStateContext.tsx`, `src/contexts/LanguageContext.tsx`, `src/contexts/ThemeContext.tsx`, `src/utils/aiClient.ts`, `src/utils/audioBus.ts`, `src/utils/auth.ts`, `src/utils/cloudSave.ts`, `src/utils/dungeon.ts`, `src/utils/entitlements.ts`, `src/utils/gateDraft.ts`, `src/utils/notifications.ts`, `src/utils/oracleDraft.ts`, `src/utils/playBilling.ts`, `src/utils/sounds.ts`, `src/utils/storageKeys.ts`, `src/utils/telemetry.ts`
**Régua:** `safeStorage.guard.test.ts`
**Avisos do arquivo:**
- ⚠️ Este comentário dizia 'origem COMPARTILHADA com o DigiApp' — falso desde a migração; a URL de produção é própria e `localStorage` é por origem.

### `src/utils/seasons.ts`
**Dono de:** Estações do ano — o calendário sem battle pass (Parte 4 do `docs/PLANO-PRODUTO.md`) — funções puras.
**Exports:**
- `Season` (interface) — campos: `id`, `startISO`, `endISO`, `namePt`, `nameEn`, `dreamIds`, `medalId`, `themePt`, `themeEn`.
- `SEASONS` — As quatro estações do ano. ~13 semanas cada, com uma folga curta de **entre-estações** no fim de fevereiro.
- `function currentSeason(now: Date = new Date()): Season | null` — A estação de hoje, ou `null` no punhado de dias de **entre-estações**. `null` é um resultado legítimo e não é uma falha: fora de estação o app segue inteiro, e todo sonho — sazonal ou não — continua sorteável. É a regra 1 em forma de tipo.
- `SeasonWindow` (interface) — campos: `season`, `start`, `end`, `totalDays`, `dayIndex`, `daysLeft`, `ratio`.
- `function seasonProgress(now: Date = new Date()): SeasonWindow | null` — Onde estamos dentro da estação corrente, com as datas CONCRETAS da edição deste ano (a tabela guarda mês/dia; aqui o ano é resolvido). `null` em entre-estações.
- `function seasonOfDream(dreamId: string): Season | null` — A estação que DESTACA este sonho, independente da data. Nunca `undefined`.
- `function isSeasonalDream(dreamId: string, now: Date = new Date()): boolean` — Este sonho é o destaque da estação de AGORA? **Isto é um adjetivo de destaque, não uma permissão.** `false` NÃO significa "indisponível": significa apenas que este sonho não recebe o peso extra hoje.
- `SeasonCounters` (interface) — Os contadores LIFETIME que o GameState já mantém. O desenho inteiro depende disto: a estação **não introduz contador novo**. Ela tira uma FOTO (`snapshot`) dos contadores no dia em que começa e mede o DIFF.
- `SeasonProgressState` (interface) — O estado persistido da estação.  A fiação no GameState é de outro dono  — este arquivo só define a forma e as transições puras.
- `SeasonPathId` (type) — `'perfect-days' | 'dungeon-runs' | 'rest-nights'`
- `SeasonPath` (interface) — campos: `id`, `target`, `labelPt`, `labelEn`.
- `SEASON_PATHS` — Os três caminhos. **`OU`, nunca `E`** — qualquer um sozinho dá a medalha. Os alvos são calibrados para ~13 semanas de jogo NORMAL, e de propósito bem abaixo do que um trimestre comporta: a medalha marca presença, não maratona.
- `function startSeasonProgress( season: Season, counters: SeasonCounters, previous?: SeasonProgressState): SeasonProgressState` — Começa (ou recomeça) a contagem: a foto é tirada AGORA.
- `function ensureSeasonProgress( state: SeasonProgressState | undefined, counters: SeasonCounters, now: Date = new Date()): SeasonProgressState | undefined` — Mantém o estado alinhado com o calendário. - Fora de estação (entre-estações): devolve o estado como está. Não zera nada, não perde medalha, não "fecha" nada. - Estação nova: tira foto nova, **preservando `earnedMedals`**.
- `SeasonPathStatus` (interface) — campos: `current`, `done`.
- `SeasonMedalStatus` (interface) — campos: `season`, `paths`, `earned`.
- `function seasonMedalStatus( state: SeasonProgressState | undefined, counters: SeasonCounters, rest?: RestState, now: Date = new Date()): SeasonMedalStatus` — Onde a pessoa está em cada um dos três caminhos. Os dois primeiros saem de **diff de snapshot** — `agora − foto` — e por isso progresso anterior à estação nunca conta (há teste).
- `function applySeasonMedal( state: SeasonProgressState | undefined, counters: SeasonCounters, rest?: RestState, now: Date = new Date()): SeasonProgressState | undefined` — Grava a medalha quando um dos caminhos fecha. Idempotente e  monotônico  : `medalEarned` nunca volta para `false` e `earnedMedals` nunca encolhe.
- `function seasonLabel(win: SeasonWindow | null, language: 'pt-BR' | 'en-US'): string` — Frase curta para a UI, nos dois idiomas. Convida; nunca cobra nem ameaça.
**Chamado por:** `src/components/StatsPage.tsx`, `src/contexts/GameStateContext.tsx`, `src/utils/dailyReset.ts`, `src/utils/restWindow.ts`
**Régua:** `seasons.fiada.test.ts`, `seasons.test.ts`
**Regra de negócio:** As estações do ano dão três caminhos (OU, nunca E) para uma medalha cosmética. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/serverConfig.ts`
**Dono de:** O que o SERVIDOR diz sobre si mesmo (`/api/config`), do lado do app web.
**Exports:**
- `ServerConfig` (interface) — O que o SERVIDOR diz sobre si mesmo — `/api/config`, do lado do app web. O app de desktop já perguntava isso (`desktop/renderer/src/cloudSync.ts`); o web nunca perguntou, porque até 09/09/2026 nada dependia da resposta.
- `function fetchServerConfig(): Promise<ServerConfig>` — Busca `/api/config` uma vez por sessão (cacheado em módulo) e normaliza a resposta.
- `function resetServerConfigCache(): void` — Só para teste: esquece a resposta cacheada desta sessão.
**Chamado por:** `src/components/ChatBox.tsx`
**Régua:** nenhuma (`ls src/utils/serverConfig*.test.ts` vazio).

### `src/utils/shop.ts`
**Dono de:** O catálogo da loja: itens comuns, especiais e de torneio — `ALL_SHOP_ITEMS` é a fonte única para resolver um item por id.
**Exports:**
- `ShopItemKind` (type) — `'chip' | 'heart' | 'bg' | 'furniture' | 'emblem'`
- `ShopCurrency` (type) — Moeda que compra o item. Ausente = Bits (o padrão da loja).
- `Attr` (type) — `'virus' | 'data' | 'vaccine'`
- `UnlockReq` (type) — Purchase gate. Locked items still show in the shop — darkened, with a padlock; tapping them reveals HOW to unlock: - 'mission': buyable after the mission (utils/missions.ts) is complete.
- `ShopItem` (interface) — campos: `id`, `kind`, `icon`, `namePt`, `nameEn`, `descPt`, `descEn`, `price`, `attr`, `unlock`, `currency`, `slot`, `fits`.
- `CHIP_BOOST` — tabela/dado de configuração (ver código; 5+ linhas).
- `HEART_HEAL` — tabela/dado de configuração (ver código; 4+ linhas).
- `CHIP_EMOJI` — `{ virus: '🦠', data: '💾', vaccine: '💉' }`
- `HEART_ITEM_EMOJI` — `'💗'`
- `SpecialItem` (interface) — campos: `emoji`, `kind`, `attr`, `namePt`, `nameEn`, `descPt`, `descEn`.
- `GLITCHTAMA_EMOJI` — `'🌀'`
- `SPECIAL_ITEMS` — tabela/dado de configuração (ver código; 27+ linhas).
- `function isSpecialItem(emoji: string): boolean` — O emoji identifica um item especial (`SPECIAL_ITEMS`)?
- `SHOP_ITEMS` — tabela/dado de configuração (ver código; 41+ linhas).
- `TOURNAMENT_ITEMS` — Itens do TORNEIO — comprados só com Emblemas. Ficam numa lista à parte (e numa aba própria) porque a regra é justamente que as moedas não se misturam: quem joga minijogo não chega aqui, e quem ganha no torneio não usa Emblema na loja comum.
- `ALL_SHOP_ITEMS` — Catálogo inteiro (loja comum + torneio). Use SEMPRE isto para RESOLVER um item por id — procurar só em SHOP_ITEMS faz o item de torneio comprado sumir na hora de renderizar (aconteceu com a mobília do torneio, que era comprável e equipável mas não aparecia no box do pet).
**Chamado por:** `src/App.tsx`, `src/components/CompanionHUD.tsx`, `src/components/ItemsWindow.tsx`, `src/components/PetStageDecor.tsx`, `src/components/ShopModal.tsx`, `src/contexts/GameStateContext.tsx`, `src/utils/missions.ts`, `src/utils/shopBuy.ts`, `src/utils/specialItemUse.ts`
**Régua:** `shopBuy.test.ts`
**Regra de negócio:** O catálogo da loja — Bits compram tudo, exceto a aba Torneio (Emblemas) e o Glitchtama (nunca vendido). [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/shopBuy.ts`
**Dono de:** A COMPRA na loja aplicada ao `prev`, com recusa reconferida sobre o estado real (achado X-6).
**Exports:**
- `ShopBuyRefusal` (type) — A COMPRA na loja, aplicada sobre o `prev` — extraída do updater inline de `handleShopBuy` no `App.tsx`. ⚠️ Família X-6, terceira varredura, instância 2.
- `ShopBuyState` (interface) — Fatia do GameState que uma compra lê e escreve.
- `function shopBalanceFor(state: ShopBuyState, item: ShopItem): number` — O saldo NA MOEDA do item. Emblemas e Bits não se substituem (currencies.ts).
- `function shopBuyRefusal(state: ShopBuyState, item: ShopItem): ShopBuyRefusal | undefined` — A compra seria recusada? Separada de `applyShopBuy` pelo mesmo motivo de `specialRefusal`: quem chama de fora precisa da resposta para não tocar o som e para devolver `false` ao botão.
- `function applyShopBuy<T extends ShopBuyState>( prev: T, item: ShopItem): { state: T; refused?: ShopBuyRefusal }` — Uma compra aplicada ao `prev`. Recusa reconferida sobre o `prev`.
**Chamado por:** `src/App.tsx`
**Régua:** `shopBuy.test.ts`
**Avisos do arquivo:**
- ⚠️ Família X-6, instância 2 — a recusa por saldo/posse era lida do `gameState` de FORA do `setGameState`; nenhum número da economia mudou no conserto, só a duplicidade.
**Regra de negócio:** A compra reconfere saldo e posse sobre o estado real, nunca sobre uma leitura de fora. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/soulProfile/astrology/chart.ts`
**Dono de:** Cálculo do mapa astral real (posições, aspectos, ângulos, casas Placidus) via astronomy-engine.
**Exports:**
- `function signOf(longitude: number): Sign` — O signo (0–11) pela longitude eclíptica.
- `function degreeInSign(longitude: number): number` — O grau dentro do signo (0–30) pela longitude.
- `function formatPosition(longitude: number): string` — Longitude formatada como "17°32' Touro".
- `function localToUtc(date: string, time: string, timeZone: string): Date` — Resolves a local wall-clock time in an IANA timezone to a UTC instant. Uses the runtime's tz database, so historical DST rules are honoured — which matters a lot for birth charts (Brazil's horário de verão, etc).
- `function computeNatalChart(birth: BirthData): NatalChart` — Calcula o mapa astral completo (posições, aspectos, ângulos, casas Placidus) a partir de data/hora/local de nascimento; hora desconhecida cai em meio-dia local com aviso bilíngue anexado ao resultado.
**Chamado por:** `src/utils/soulProfile/index.ts`, `src/utils/soulProfile/profile.ts`
**Régua:** `chart.test.ts`

### `src/utils/soulProfile/astrology/prominence.ts`
**Dono de:** Peso de proeminência de cada corpo celeste no mapa, por aspectos ponderados.
**Exports:**
- `ProminenceBody` (type) — `| 'Sol' | 'Lua' | 'Mercúrio' | 'Vênus' | 'Marte' | 'Júpiter' | 'Saturno' | 'Urano' | 'Netuno' | 'Plutão'`
- `PROMINENCE_BODIES` — `[ 'Sol', 'Lua', 'Mercúrio', 'Vênus', 'Marte', 'Júpiter', 'Saturno', 'Urano', 'Netuno', 'Plutão', ]`
- `function neutralProminence(): Record<ProminenceBody, number>` — Proeminência neutra — o fallback quando não há mapa (perfis antigos, testes): todo mundo igual, nenhum elemento ganha ou perde por ausência de dado.
- `function planetProminence(chart: NatalChart): Record<ProminenceBody, number>` — Proeminência (peso 0–1) de cada corpo no mapa, por aspectos ponderados por órbita; piso 0,5 para corpo sem aspecto nenhum.
**Chamado por:** `src/utils/soulProfile/profile.ts`
**Régua:** nenhuma (`ls src/utils/soulProfile/astrology/prominence*.test.ts` vazio).

### `src/utils/soulProfile/astrology/types.ts`
**Dono de:** Tipos do mapa astral: signo, elemento, modalidade, corpo, aspecto, ângulos.
**Exports:**
- `SIGNS` — `[ "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem", "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes", ] as const`
- `Sign` (type) — `(typeof SIGNS)[number]`
- `Element` (type) — `"fogo" | "terra" | "ar" | "água"`
- `Modality` (type) — `"cardinal" | "fixo" | "mutável"`
- `Polarity` (type) — `"diurno" | "noturno"`
- `SIGN_ELEMENT` — tabela/dado de configuração (ver código; 6+ linhas).
- `SIGN_MODALITY` — tabela/dado de configuração (ver código; 5+ linhas).
- `SIGN_POLARITY` — tabela/dado de configuração (ver código; 6+ linhas).
- `BodyName` (type) — `| "Sol" | "Lua" | "Mercúrio" | "Vênus" | "Marte" | "Júpiter" | "Saturno" | "Urano" | "Netuno" | "Plutão" | "Nodo Norte" | "Quíron"`
- `PlacedBody` (interface) — campos: `body`, `longitude`, `latitude`, `sign`, `degreeInSign`, `house`, `retrograde`.
- `AspectName` (type) — `"conjunção" | "oposição" | "trígono" | "quadratura" | "sextil"`
- `Aspect` (interface) — campos: `a`, `b`, `aspect`, `orb`, `exactAngle`.
- `Angles` (interface) — campos: `ascendant`, `midheaven`, `descendant`, `imumCoeli`.
- `BirthData` (interface) — campos: `date`, `time`, `timeZone`, `latitude`, `longitude`, `placeLabel`, `timeUnknown`.
- `NatalChart` (interface) — campos: `birth`, `utcDate`, `julianDay`, `bodies`, `angles`, `houseCusps`, `houseSystem`, `aspects`, `bigThree`, `warnings`.
**Chamado por:** `src/utils/soulProfile/index.ts`, `src/utils/soulProfile/profile.ts`, `src/utils/soulProfile/astrology/chart.ts`, `src/utils/soulProfile/astrology/prominence.ts`
**Régua:** nenhuma (`ls src/utils/soulProfile/astrology/types*.test.ts` vazio).

### `src/utils/soulProfile/axes.ts`
**Dono de:** Constrói os quatro eixos do oráculo (elemento/papel/alinhamento/reino) a partir das quatro leituras — coeficientes calibrados por simulação.
**Exports:**
- `OracleAxesInput` (interface) — campos: `facets`, `jung`, `astrologyElements`, `astrologyPolarities`, `numerologyNumbers`, `planetProminence`.
- `function generateOracleAxes(inputs: OracleAxesInput): OracleAxes` — Constrói os eixos do oráculo a partir das leituras psicométrica, junguiana, astrológica e numerológica.
**Chamado por:** `src/utils/soulProfile/index.ts`, `src/utils/soulProfile/profile.ts`
**Régua:** `axes.test.ts`
**Regra de negócio:** Os coeficientes dos eixos foram calibrados para nenhum elemento/papel/reino ter vantagem estrutural. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/soulProfile/bestiary/select.ts`
**Dono de:** Seleção da criatura-inspiração (e da linhagem completa) do pool do bestiário, por pontuação + sorteio semeado.
**Exports:**
- `BestiaryCreature` (interface) — campos: `nome`, `origem`, `descricao`, `elementos`, `familia`, `biologia`, `bioma`, `tamanho`, `hostilidade`, `atributos`.
- `BESTIARY_POOL` — `(poolJson as unknown as Pool).criaturas`
- `BESTIARY_PROVENANCE` — `(poolJson as unknown as Pool)._provenance`
- `function scoreCreature(c: BestiaryCreature, axes: OracleAxes): number` — Pontua uma criatura do bestiário contra os eixos do oráculo, pelo vetor completo dos 17 elementos base (inclui derivados pelos componentes).
- `BestiaryPick` (interface) — campos: `creature`, `score`, `bandSize`.
- `function selectBestiaryCreature(axes: OracleAxes, seedKey: string): BestiaryPick` — Escolhe a criatura-inspiração: pontua o pool inteiro, reduz à faixa (topo − BAND_WIDTH, com mínimo MIN_BAND por ordem de pontuação) e sorteia com seed determinística. Mesmo (leitura, seedKey) = mesma criatura; seed nova (reroll) = outra criatura coerente com a mesma leitura.
- `function speciesProximity(prev: BestiaryCreature, c: BestiaryCreature): number` — Quanto `c` é "da mesma linhagem" que `prev`. Família domina (+4), mas biologia (até +4,5), elementos base em comum (até +2) e tamanho vizinho (+1) somados podem passá-la — é o que permite a travessia rara.
- `function selectBestiaryLineage( axes: OracleAxes, seedKey: string, stages: readonly string[]): Record<string, BestiaryPick>` — Linhagem completa de inspirações, um pick por estágio, em ordem de evolução.
**Chamado por:** `src/utils/soulProfile/index.ts`, `src/utils/soulProfile/pipeline.ts`
**Régua:** nenhuma (`ls src/utils/soulProfile/bestiary/select*.test.ts` vazio).
**Regra de negócio:** A criatura-inspiração nunca aparece por nome ao jogador — só a linha de essência. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/soulProfile/cities.ts`
**Dono de:** Tabela curada de cidades (capitais + grandes cidades do mundo) para o campo de local de nascimento.
**Exports:**
- `City` (interface) — campos: `name`, `region`, `country`, `latitude`, `longitude`, `timeZone`.
- `CITIES` — Curated place table: every Brazilian state capital, the larger Brazilian cities, and widely-used world cities. This is deliberately a bundled table rather than a geocoding API call.
- `function cityLabel(city: City): string` — Rótulo de exibição da cidade ("Nome - Região, País" ou "Nome, País" sem região).
- `function searchCities(query: string, limit = 8): City[]` — Accent- and case-insensitive search. Exact matches rank above prefix matches, which rank above substring matches anywhere in the label, so typing "sao p" surfaces Sao Paulo before Sao Bernardo do Campo.
**Chamado por:** `src/components/CityPicker.tsx`, `src/components/OraclePage.tsx`, `src/components/SoulmonOnboarding.tsx`, `src/utils/oracleDraft.ts`, `src/utils/soulProfile/index.ts`
**Régua:** `cities.test.ts`

### `src/utils/soulProfile/derivedElements.ts`
**Dono de:** Os 136 pares de elemento derivado do class-system e o cálculo do(s) elemento(s) dominante(s) do perfil.
**Exports:**
- `BASE_ELEMENT_LABELS` — Vendorized from `class-system/src/registry/elementos.ts`'s `derivado(...)` entries — the 136 base-pair combos (every 2-of-17 pair, `C(17,2)=136`).
- `DerivedElementDef` (interface) — campos: `id`, `nome`, `componentes`.
- `DERIVED_ELEMENT_PAIRS` — tabela/dado de configuração (ver código; 41+ linhas).
- `DominantElementCandidate` (interface) — campos: `id`, `nome`, `score`, `componentes`.
- `function computeDominantClassElements( classElements: Record<ClassElementId, number> ): DominantElementCandidate[]` — Determines the class-system elemento(s) that best represent this profile's `classElements` scores, considering derived (base-pair) combos — not just the single highest base element. Algorithm (see conversation with the user for the original description): 1.
**Chamado por:** `src/utils/arena.ts`, `src/utils/rebirth.ts`, `src/utils/soulProfile/axes.ts`, `src/utils/soulProfile/bestiary/select.ts`, `src/utils/soulProfile/essenceLabels.ts`, `src/utils/soulProfile/ficha/buildSheet.ts`, `src/utils/soulProfile/ficha/cascata.ts`, `src/utils/soulProfile/ficha/skills.ts`, `src/utils/soulProfile/index.ts`, `src/utils/soulProfile/ritualAnswers.ts`, `src/utils/soulProfile/types.ts`
**Régua:** `derivedElements.test.ts`

### `src/utils/soulProfile/essenceLabels.ts`
**Dono de:** Nome de exibição PT/EN da essência dominante (elemento base ou combo).
**Exports:**
- `PROFISSAO_EN` — tabela/dado de configuração (ver código; 5+ linhas).
- `function essenceHasEn(id: string): boolean` — O id tem par EN? (para o teste de idioma — cognatos como "Lava" são idênticos nos dois, então comparar strings daria falso positivo).
- `function essenceLabel(candidate: DominantElementCandidate, isPt: boolean): string` — Nome de exibição da essência dominante (base ou combo), no idioma pedido.
- `function baseElementLabel(id: string, isPt: boolean): string` — Par PT/EN do nome de um elemento base do class-system.
**Chamado por:** `src/utils/soulProfile/ficha/classTitle.ts`, `src/utils/soulProfile/ficha/skills.ts`, `src/utils/soulProfile/index.ts`
**Régua:** nenhuma (`ls src/utils/soulProfile/essenceLabels*.test.ts` vazio).

### `src/utils/soulProfile/ficha/buildSheet.ts`
**Dono de:** Monta a ficha de UM estágio a partir dos eixos — orçamento de pontos, curva por estágio, boost de Rebirth.
**Exports:**
- `CLASS_DATA` — `snapshotJson as unknown as ClassSystemSnapshot`
- `ROOKIE_BUDGET` — `{ elementos: 28, escolasDistribuidas: 14, evocacaoFixo: 4, recursos: 8, talentoRanks: 10, profissao: 6, }`
- `STAGE_MULTIPLIER` — Curva acelerada de orçamento por estágio — o último salto é o maior, como as curvas de poder do gênero costumam ler.
- `ELEMENT_ORCAMENTO_BY_STAGE` — ORÇAMENTO DE ELEMENTOS por estágio — curva própria, mais funda que o multiplicador geral, porque é ela que faz a CASCATA geracional acontecer: destravar um par exige ~50 pontos em cada componente (marco de 100 de orçamento do class-system), e só perfis concentrados de mega/ultra (…)
- `RebirthBoost` (interface) — RENASCIMENTO (`utils/rebirth.ts`): quem renasceu joga com um orçamento maior em TODOS os estágios — é essa multiplicação, e não um bônus solto, que faz "mais pontos no primeiro nível e, por consequência, nos próximos" ser verdade por construção.
- `function buildFicha( nome: string, oracle: OracleAxes, stage: FichaStage = 'rookie', seedKey: string = nome, boost?: RebirthBoost): Ficha` — Ficha de UM estágio a partir dos eixos. Determinística por `seedKey`.
**Chamado por:** `src/utils/rebirth.ts`, `src/utils/soulProfile/ficha/capture.ts`, `src/utils/soulProfile/ficha/fromInput.ts`, `src/utils/soulProfile/ficha/skills.ts`, `src/utils/soulProfile/index.ts`
**Régua:** nenhuma (`ls src/utils/soulProfile/ficha/buildSheet*.test.ts` vazio).
**Regra de negócio:** O Renascimento multiplica o orçamento da ficha em todos os estágios (1.5×, nunca 2×). [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/soulProfile/ficha/capture.ts`
**Dono de:** Poder de captura e a lista de criaturas capturáveis do class-system para uma ficha.
**Exports:**
- `function poderCaptura(ficha: Ficha, criatura: CriaturaSnapshot): number` — O poder de captura da ficha sobre uma criatura, pela afinidade elemental e pela escola Evocação.
- `CapturaAvaliacao` (interface) — campos: `id`, `criatura`, `capturavel`, `poder`.
- `function avaliarCaptura(ficha: Ficha, id: string, criatura: CriaturaSnapshot): CapturaAvaliacao` — Uma criatura é capturável por esta ficha? Exige Evocação > 0 e afinidade elemental; compara o poder de captura ao `poderBase` da criatura.
- `function capturableCreatures(ficha: Ficha): CapturaAvaliacao[]` — Todas as criaturas capturáveis do class-system para esta ficha, ordenadas por `poderBase` decrescente.
- `function selectCompanion(ficha: Ficha, seedKey: string): CapturaAvaliacao | null` — Companheiro inicial: sorteio semeado sobre TODO o conjunto capturável, não sempre a captura mais forte — devolver sempre a mais forte fazia só 9 das criaturas do registro aparecerem como companheiro de alguém (medido no laboratório). Determinístico por `seedKey`.
**Chamado por:** `src/utils/soulProfile/index.ts`, `src/utils/soulProfile/pipeline.ts`
**Régua:** nenhuma (`ls src/utils/soulProfile/ficha/capture*.test.ts` vazio).
**Regra de negócio:** Companheiro capturável exige Evocação > 0 e afinidade elemental. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/soulProfile/ficha/cascata.ts`
**Dono de:** A cascata geracional: o que cada elemento base alimenta em pares e sinergias.
**Exports:**
- `DIVISOR_CASCATA_PAR` — Espelhos dos diais de `Class-System/src/registry/geracoes.ts` (gen 1–2).
- `LIMIAR_DESTRAVAMENTO_PAR` — `10`
- `CUSTO_PONTO_BASE` — `1`
- `CUSTO_PONTO_PAR` — Paridade com os pais ({1,2,3,4} no class-system pós-auditoria): +1 nível no par via direto custa o mesmo que +1 em cada componente.
- `SinergiaAlvoUnico` (interface) — Uma sinergia de ALVO ÚNICO: `de` empurra `floor(pontos razao)` para `para`. Dado do class-system, não regra escrita aqui.
- `SINERGIAS_ALVO_UNICO` — `(fixturesJson as { sinergiasAlvoUnico: SinergiaAlvoUnico[] }).sinergiasAlvoUnico`
- `CascataPar` (interface) — campos: `def`, `passivos`, `destravado`.
- `function alimentoDasBases( bases: Partial<Record<ClassElementId, number>>): Partial<Record<ClassElementId, number>>` — O que cada base efetivamente ALIMENTA na cascata: pontos diretos mais o transbordo das sinergias de alvo único que apontam para ela.
- `function cascataDosPares( bases: Partial<Record<ClassElementId, number>>): CascataPar[]` — A cascata de todos os pares tocados pela ficha (passivos > 0).
**Chamado por:** `src/utils/arena.ts`, `src/utils/soulProfile/ficha/buildSheet.ts`, `src/utils/soulProfile/ficha/skills.ts`, `src/utils/soulProfile/index.ts`
**Régua:** `cascata.parity.test.ts`

### `src/utils/soulProfile/ficha/classTitle.ts`
**Dono de:** A classe/arquétipo (dos 79 do class-system) de cada estágio, determinística pela ficha.
**Exports:**
- `ClassTitle` (interface) — campos: `nome`, `origem`.
- `CLASS_TITLE_EN` — Tradução EN dos 79 arquétipos do class-system, por ID (estável). O PT vem direto do motor — não duplicado aqui.
- `function computeClassTitle(ficha: Ficha): Promise<ClassTitle>` — Classe de UM estágio. Determinística: função da ficha (que já é função da identidade), então reroll não troca a classe — mesmo padrão das skills.
- `function computeClassTitlesAllStages( fichaByStage: Record<string, Ficha>): Promise<Record<string, ClassTitle>>` — `computeClassTitle` pra todos os estágios de uma vez.
**Chamado por:** `src/components/PetPage.tsx`, `src/contexts/GameStateContext.tsx`, `src/utils/soulProfile/pipeline.ts`
**Régua:** `classTitle.test.ts`

### `src/utils/soulProfile/ficha/fromInput.ts`
**Dono de:** Constrói a ficha dos 5 estágios + o par de skills de cada um, a partir do input do oráculo.
**Exports:**
- `FichaESkills` (interface) — campos: `fichaByStage`, `stageSkills`.
- `function buildFichaESkills( input: OracleInput, seedKey: string): FichaESkills` — Constrói a ficha dos 5 estágios e o par de skills de cada um. `seedKey` é a identidade da pessoa (não o salt) — reroll não muda nada disto.
**Chamado por:** `src/utils/soulProfile/index.ts`, `src/utils/soulProfile/pipeline.ts`, `src/components/PetPage.tsx`
**Régua:** nenhuma (`ls src/utils/soulProfile/ficha/fromInput*.test.ts` vazio).

### `src/utils/soulProfile/ficha/realEngine.ts`
**Dono de:** Monta o `Personagem` real do class-system e roda a progressão sobre ele.
**Exports:**
- `RealPersonagem` (interface) — campos: `engine`, `personagem`, `prog`.
- `function buildRealPersonagem(ficha: Ficha): Promise<RealPersonagem>` — Monta o `Personagem` real e roda `calcularProgressao` sobre ele.
**Chamado por:** `src/utils/soulProfile/ficha/classTitle.ts`, `src/utils/soulProfile/ficha/realSkillPower.ts`
**Régua:** nenhuma (`ls src/utils/soulProfile/ficha/realEngine*.test.ts` vazio).

### `src/utils/soulProfile/ficha/realSkillPower.ts`
**Dono de:** Enriquece o par de skills de um estágio com o poder REAL calculado pelo motor do class-system.
**Exports:**
- `function withRealPower(ficha: Ficha, skills: StageSkills): Promise<StageSkills>` — Enriquece o par básica/especial de UM estágio com `poder` real. Chamada só pela página do Pet (recomputa sob demanda); o par qualitativo continua sendo a fonte usada por `pipeline.ts`/testes, que não precisam do motor pesado só para rotular custo baixo/alto.
- `function withRealPowerAllStages( fichaByStage: Record<string, Ficha>, stageSkills: Record<string, StageSkills>): Promise<Record<string, StageSkills>>` — Aplica `withRealPower` a todos os estágios de uma vez.
**Chamado por:** `src/components/PetPage.tsx`
**Régua:** `realSkillPower.test.ts`

### `src/utils/soulProfile/ficha/skills.ts`
**Dono de:** O par de skills (básica/especial) de cada estágio, determinístico pela ficha.
**Exports:**
- `SkillText` (interface) — campos: `pt`, `en`.
- `StageSkill` (interface) — campos: `tipo`, `nome`, `descricao`, `elementoId`, `elementoNome`, `escolaId`, `recursoId`, `custo`, `poder`.
- `StageSkills` (interface) — campos: `basica`, `especial`.
- `function buildStageSkills( ficha: Ficha, stage: FichaStage, seedKey: string, usados?: Set<string>): StageSkills` — O par básica/especial de UM estágio. Determinístico por (ficha, seedKey).
- `function buildAllStageSkills( fichaByStage: Record<FichaStage, Ficha>, seedKey: string): Record<FichaStage, StageSkills>` — As skills de todos os estágios de uma vez (pipeline / persistência).
**Chamado por:** `src/components/ActivitiesPage.tsx`, `src/components/ArenaGame.render.test.tsx`, `src/components/ArenaGame.tsx`, `src/components/PetPage.tsx`, `src/contexts/GameStateContext.tsx`, `src/utils/arena.ts`, `src/utils/soulProfile/ficha/fromInput.ts`, `src/utils/soulProfile/ficha/realSkillPower.ts`, `src/utils/soulProfile/index.ts`, `src/utils/soulProfile/pipeline.ts`
**Régua:** nenhuma (`ls src/utils/soulProfile/ficha/skills*.test.ts` vazio).

### `src/utils/soulProfile/ficha/types.ts`
**Dono de:** Tipos da ficha de personagem: elementos, escolas, recursos, profissões, criaturas, gerações.
**Exports:**
- `ElementoBaseId` (type) — `ClassElementId`
- `EscolaId` (type) — `| 'combate_fisico' | 'longo_alcance' | 'evocacao' | 'conjuracao' | 'benca' | 'maldicao'`
- `RecursoId` (type) — `'mana' | 'fe' | 'furia' | 'soullink' | 'ressonancia'`
- `ProfissaoId` (type) — `| 'ferreiro' | 'tecelao' | 'artesao' | 'joalheiro' | 'alquimista' | 'curtidor' | 'encantador' | 'escriba' | 'cozinheiro' | 'luthier' | 'cartografo'`
- `TalentoSnapshot` (interface) — campos: `nome`, `ranksMaximos`, `requisito`, `exclusivoCom`.
- `ProfissaoSnapshot` (interface) — campos: `nome`, `fatoresElementos`, `fatoresEscolas`.
- `CriaturaSnapshot` (interface) — campos: `nome`, `familia`, `afinidades`, `poderBase`.
- `GeracoesSnapshot` (interface) — Diais da alocação geracional, copiados do `taxonomy.json` v2 do class-system (que os gera de `src/registry/geracoes.ts`).
- `ClassSystemSnapshot` (interface) — campos: `_provenance`, `escolas`, `recursos`, `profissoes`, `talentos`, `criaturas`, `familias`, `geracoes`.
- `Ficha` (interface) — A ficha de personagem que a distribuição monta para UM estágio.
- `FichaStage` (type) — `'rookie' | 'champion' | 'ultimate' | 'mega' | 'ultra'`
- `FICHA_STAGE_ORDER` — `['rookie', 'champion', 'ultimate', 'mega', 'ultra']`
**Chamado por:** `src/utils/rebirth.ts`, `src/utils/arena.ts`, `src/contexts/GameStateContext.tsx`, `src/components/RebirthModal.tsx`, `src/components/PetPage.tsx`, `src/components/ActivitiesPage.tsx`, `src/components/ArenaGame.tsx`, `src/utils/soulProfile/index.ts`, `src/utils/soulProfile/pipeline.ts`, `src/utils/soulProfile/ficha/classTitle.ts`, `src/utils/soulProfile/ficha/realEngine.ts`, `src/utils/soulProfile/ficha/fromInput.ts`, `src/utils/soulProfile/ficha/skills.ts`, `src/utils/soulProfile/ficha/buildSheet.ts`, `src/utils/soulProfile/ficha/capture.ts`, `src/utils/soulProfile/ficha/realSkillPower.ts`
**Régua:** nenhuma (`ls src/utils/soulProfile/ficha/types*.test.ts` vazio).

### `src/utils/soulProfile/identity.ts`
**Dono de:** A chave de identidade estável do perfil (sem o salt) — mesma leitura para quem repete as respostas.
**Exports:**
- `function identityKey(input: OracleInput): string` — Identidade estável — NÃO inclui o salt, de propósito. As respostas do ritual entram SEMPRE (não só na ausência do teste de 20): mesma data de nascimento com respostas diferentes é outra pessoa para a ficha.
**Chamado por:** `src/utils/soulProfile/index.ts`, `src/utils/soulProfile/pipeline.ts`, `src/components/PetPage.tsx`
**Régua:** nenhuma (`ls src/utils/soulProfile/identity*.test.ts` vazio).

### `src/utils/soulProfile/index.ts`
**Dono de:** O BARREL do `soulProfile` — reexporta tudo que o pipeline e a UI (`OraclePage`) consomem por import dinâmico.
**Exports:**
- `buildSoulProfile` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `generateOracleAxes` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `items` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `totalItems` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `likertItems` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `forcedChoiceItems` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `scenarioItems` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `scoreProfile` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `computeValidity` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `isComplete` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `answeredCount` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `traitLabels` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `traitLevelLabels` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `jungAxisLabels` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `numberMeanings` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `TRAIT_DIMENSIONS` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `JUNG_AXES` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `computeNatalChart` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `signOf` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `degreeInSign` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `formatPosition` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `localToUtc` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `SIGNS` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `SIGN_ELEMENT` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `SIGN_MODALITY` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `SIGN_POLARITY` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `computeNumerology` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `reduce` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `normalizeName` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `CITIES` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `cityLabel` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `searchCities` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `computeDominantClassElements` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `CLASS_ELEMENT_ORDER` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `generateOracleComplete` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `identityKey` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `applyRitualAnswers` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `buildFichaESkills` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `buildFicha` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `CLASS_DATA` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `ROOKIE_BUDGET` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `STAGE_MULTIPLIER` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `ELEMENT_ORCAMENTO_BY_STAGE` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `cascataDosPares` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `DIVISOR_CASCATA_PAR` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `LIMIAR_DESTRAVAMENTO_PAR` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `CUSTO_PONTO_PAR` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `poderCaptura` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `avaliarCaptura` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `capturableCreatures` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `selectCompanion` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `FICHA_STAGE_ORDER` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `selectBestiaryCreature` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `selectBestiaryLineage` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `speciesProximity` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `BESTIARY_POOL` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `BESTIARY_PROVENANCE` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `essenceLabel` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `baseElementLabel` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `PROFISSAO_EN` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `buildStageSkills` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `buildAllStageSkills` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `SoulOnboardingData` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `SoulProfile` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `OracleAxesInput` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `Answer` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `Answers` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `Item` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `LikertItem` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `LikertValue` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `ForcedChoiceItem` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `ScenarioItem` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `PersonalityProfile` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `TraitDimension` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `TraitLevel` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `TraitScore` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `JungAxis` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `ValidityIndices` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `NatalChart` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `PlacedBody` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `Sign` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `BirthData` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `NumerologyMap` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `NumberResult` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `City` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `DominantElementCandidate` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `ClassElementId` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `OracleAxes` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `OracleComplete` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `CascataPar` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `Ficha` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `FichaStage` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `BestiaryCreature` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `BestiaryPick` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `StageSkill` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `StageSkills` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `SkillText` (type re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
**Chamado por:** `src/components/OraclePage.tsx (import dinâmico)`, `src/components/SoulmonOnboarding.tsx (import dinâmico)`
**Régua:** nenhuma (`ls src/utils/soulProfile/index*.test.ts` vazio).

### `src/utils/soulProfile/numerology.ts`
**Dono de:** Numerologia pitagórica COMPLETA, portada de `teste-personalidade` — substitui os 4 números que `oracle.ts` calculava no caminho legado.
**Exports:**
- `MasterNumber` (type) — `11 | 22 | 33`
- `MASTER_NUMBERS` — `[11, 22, 33]`
- `KARMIC_DEBT_NUMBERS` — `[13, 14, 16, 19]`
- `function normalizeName(name: string): string` — Strips diacritics and non-letters, uppercasing the result.
- `function reduce(n: number, preserveMaster = true): number` — Reduces to a single digit, preserving master numbers 11/22/33.
- `NumberResult` (interface) — campos: `value`, `rawTotal`, `isMaster`, `karmicDebt`.
- `NumerologyMap` (interface) — campos: `normalizedName`, `lifePath`, `expression`, `soulUrge`, `personality`, `birthday`, `maturity`, `balance`, `personalYear`, `personalYearReference`, `karmicLessons`, `hiddenPassion`, `digitFrequency`, `challenges`, `pinnacles`, `karmicDebts`.
- `function computeNumerology(fullName: string, birthDate: string, referenceYear: number): NumerologyMap` — Numerologia pitagórica COMPLETA (caminho de vida, expressão, alma, personalidade, destino, números mestres/kármicos) a partir de nome e data de nascimento.
**Chamado por:** `src/utils/soulProfile/index.ts`, `src/utils/soulProfile/profile.ts`
**Régua:** `numerology.test.ts`

### `src/utils/soulProfile/personality/labels.ts`
**Dono de:** Rótulos PT/EN dos traços, níveis, eixos junguianos e significados numerológicos.
**Exports:**
- `traitLabels` — tabela/dado de configuração (ver código; 41+ linhas).
- `traitLevelLabels` — tabela/dado de configuração (ver código; 7+ linhas).
- `jungAxisLabels` — tabela/dado de configuração (ver código; 30+ linhas).
- `numberMeanings` — Significado simbólico de cada número da numerologia (inclui os mestres).
**Chamado por:** `src/App.tsx`, `src/components/CompanionHUD.tsx`, `src/components/ItemsWindow.tsx`, `src/components/OraclePage.tsx`, `src/utils/careRules.ts`, `src/utils/soulProfile/index.ts`
**Régua:** nenhuma (`ls src/utils/soulProfile/personality/labels*.test.ts` vazio).

### `src/utils/soulProfile/personality/questions.ts`
**Dono de:** Os itens do questionário psicométrico (Likert, escolha forçada, cenário).
**Exports:**
- `items` — `interleave()`
- `totalItems` — `items.length`
- `likertItems` — `likert`
- `forcedChoiceItems` — `forcedChoice`
- `scenarioItems` — `scenarios`
**Chamado por:** `src/components/OraclePage.tsx`, `src/components/SoulmonOnboarding.copyRitual.render.test.tsx`, `src/components/SoulmonOnboarding.tsx`, `src/utils/soulProfile/index.ts`, `src/utils/soulProfile/personality/scoring.ts`
**Régua:** nenhuma (`ls src/utils/soulProfile/personality/questions*.test.ts` vazio).

### `src/utils/soulProfile/personality/scoring.ts`
**Dono de:** Pontuação do questionário: Big Five + Honestidade-Humildade + eixos junguianos + índices de validade.
**Exports:**
- `function isComplete(answers: Answers): boolean` — Todos os itens do questionário psicométrico foram respondidos?
- `function answeredCount(answers: Answers): number` — Quantos itens já têm resposta.
- `function scoreProfile(answers: Answers): PersonalityProfile` — Every item format is reduced to the same currency: points earned out of points available, on a 0-4 scale per item. That keeps Likert, forced-choice and scenario items commensurable without one format silently dominating.
- `function computeValidity(answers: Answers): ValidityIndices` — Response-style checks. None of these say anything about personality; they say whether the answers can be read as a personality result at all.
**Chamado por:** `src/components/OraclePage.tsx`, `src/utils/soulProfile/index.ts`, `src/utils/soulProfile/profile.ts`
**Régua:** `scoring.test.ts`

### `src/utils/soulProfile/personality/types.ts`
**Dono de:** Tipos do modelo de personalidade: dimensões, tipos de item, respostas, índices de validade.
**Exports:**
- `TraitDimension` (type) — Trait model: the five factors of the Big Five plus Honesty-Humility, the sixth factor that HEXACO adds and that repeatedly emerges in lexical studies across languages (Ashton & Lee, 2007).
- `JungAxis` (type) — `"EI" | "SN" | "TF" | "JP"`
- `Dimension` (type) — `TraitDimension | JungAxis`
- `TRAIT_DIMENSIONS` — `[ "openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism", "honestyHumility", ]`
- `JUNG_AXES` — `["EI", "SN", "TF", "JP"]`
- `ItemKind` (type) — `"likert" | "frequency" | "forced-choice" | "scenario"`
- `LikertItem` (interface) — Agreement item, answered on a 1-5 Likert scale.
- `ForcedChoiceItem` (interface) — Ipsative item: the respondent picks the option that fits better.
- `ScenarioItem` (interface) — Situational item: one stem, four reactions loading on several traits.
- `Item` (type) — `LikertItem | ForcedChoiceItem | ScenarioItem`
- `LikertValue` (type) — `1 | 2 | 3 | 4 | 5`
- `Answer` (type) — Answer payloads keyed by item id.
- `Answers` (type) — `Record<string, Answer>`
- `TraitLevel` (type) — `"very-low" | "low" | "moderate" | "high" | "very-high"`
- `TraitScore` (interface) — campos: `dimension`, `score`, `level`, `facets`.
- `JungAxisScore` (interface) — campos: `axis`, `score`, `pole`, `clarity`.
- `JungTypeResult` (interface) — campos: `code`, `axes`, `weakAxes`.
- `ValidityIndices` (interface) — Response-style indices. These do not measure personality — they measure whether the protocol can be trusted, which is standard practice in self-report inventories.
- `PersonalityProfile` (interface) — campos: `traits`, `jung`, `validity`, `traitPoints`, `answeredCount`, `totalItems`.
**Chamado por:** `src/utils/oracleDraft.ts`, `src/components/SoulTestItem.tsx`, `src/components/OraclePage.tsx`, `src/components/SoulmonOnboarding.tsx`, `src/utils/soulProfile/index.ts`, `src/utils/soulProfile/profile.ts`, `src/utils/soulProfile/personality/labels.ts`, `src/utils/soulProfile/personality/questions.ts`, `src/utils/soulProfile/personality/scoring.ts`
**Régua:** nenhuma (`ls src/utils/soulProfile/personality/types*.test.ts` vazio).

### `src/utils/soulProfile/pipeline.ts`
**Dono de:** O PIPELINE COMPLETO do oráculo: ficha dos 5 estágios + companheiro + criatura-inspiração → geração da criatura.
**Exports:**
- `OracleComplete` (interface) — campos: `result`, `fichaByStage`, `companion`, `bestiaryPick`, `bestiaryLineage`, `stageSkills`.
- `function generateOracleComplete(input: OracleInput, seed?: number): Promise<OracleComplete>` — Gera o oráculo COMPLETO — exige `input.soulProfile` (o caminho legado, sem perfil, continua sendo `generateOracle` puro e não passa por aqui).
**Chamado por:** `src/utils/soulProfile/index.ts`
**Régua:** `pipeline.test.ts`
**Regra de negócio:** O pipeline completo só roda com `soulProfile` — o caminho legado continua sendo `generateOracle` puro. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/soulProfile/profile.ts`
**Dono de:** Monta o `SoulProfile` (psicométrico + astrologia + numerologia) a partir das respostas do onboarding.
**Exports:**
- `SoulOnboardingData` (interface) — campos: `fullName`, `birthDate`, `birthTime`, `timeUnknown`, `placeLabel`, `latitude`, `longitude`, `timeZone`.
- `SoulProfile` (interface) — campos: `onboarding`, `psychometric`, `astrology`, `numerology`, `oracle`, `generatedAt`.
- `function buildSoulProfile( onboarding: SoulOnboardingData, answers: Answers, now: Date = new Date() ): SoulProfile` — Monta o `SoulProfile` completo: pontuação psicométrica + mapa astral + numerologia, a partir das respostas do onboarding.
**Chamado por:** `src/components/OraclePage.tsx`, `src/utils/oracle.ts`, `src/utils/soulProfile/index.ts`, `src/utils/soulProfile/pipeline.ts`
**Régua:** nenhuma (`ls src/utils/soulProfile/profile*.test.ts` vazio).

### `src/utils/soulProfile/ritualAnswers.ts`
**Dono de:** Aplica as respostas do ritual de 6 perguntas por cima dos eixos, sem mutar a leitura original.
**Exports:**
- `function applyRitualAnswers( axes: OracleAxes, answers: Record<string, string> | undefined): OracleAxes` — Devolve uma CÓPIA dos eixos com as respostas do ritual aplicadas. Não muta a entrada: o `soul.oracle` salvo continua sendo a leitura pura, e quem precisa da leitura com ritual pede aqui — uma fonte só (footgun 9).
**Chamado por:** `src/utils/soulProfile/ficha/fromInput.ts`, `src/utils/soulProfile/index.ts`, `src/utils/soulProfile/pipeline.ts`
**Régua:** nenhuma (`ls src/utils/soulProfile/ritualAnswers*.test.ts` vazio).

### `src/utils/soulProfile/types.ts`
**Dono de:** Tipos-base do `soulProfile`: o registro de 17 elementos do class-system e os eixos normalizados do oráculo.
**Exports:**
- `ClassElementId` (type) — Registro de 17 elementos do class-system (`class-system/src/registry/elementos.ts`).
- `CLASS_ELEMENT_ORDER` — tabela/dado de configuração (ver código; 4+ linhas).
- `OracleAxes` (interface) — Os quatro eixos do jogo, já normalizados para somar 100 em cada eixo.
- `AlignmentId` (type re-export) — reexportado de `utils/oracle.ts`, que continua sendo a fonte da verdade do vocabulário do jogo (`export type { AlignmentId, ElementId, RealmId, RoleId }`).
- `ElementId` (type re-export) — reexportado de `utils/oracle.ts` (mesma linha de `AlignmentId`).
- `RealmId` (type re-export) — reexportado de `utils/oracle.ts` (mesma linha de `AlignmentId`).
- `RoleId` (type re-export) — reexportado de `utils/oracle.ts` (mesma linha de `AlignmentId`).
**Chamado por:** `src/utils/rebirth.ts`, `src/utils/arena.ts`, `src/utils/soulProfile/axes.ts`, `src/utils/soulProfile/derivedElements.ts`, `src/utils/soulProfile/ritualAnswers.ts`, `src/utils/soulProfile/profile.ts`, `src/utils/soulProfile/index.ts`, `src/utils/soulProfile/bestiary/select.ts`, `src/utils/soulProfile/ficha/buildSheet.ts`, `src/utils/soulProfile/ficha/cascata.ts`, `src/utils/soulProfile/ficha/classTitle.ts`
**Régua:** nenhuma (`ls src/utils/soulProfile/types*.test.ts` vazio).

### `src/utils/sounds.ts`
**Dono de:** Os 8 sons sintetizados do app — zero asset, sem `AudioContext` por chamada.
**Exports:**
- `function isMuted(): boolean` — O mudo está ligado (flag persistida)?
- `function setMuted(v: boolean): void` — Liga/desliga o mudo (persistência silenciosa — não gasta o aviso único de storage).
- `function playPresence(): void` — ⚠️ **O `AudioContext`-por-chamada MORREU aqui** (run `som-01`, Fase 2, fatia 2). Esta função abria um contexto novo a cada som, tocava e fechava em 2 s: sem barramento, sem sub-mix, sem ducking, sem volume.
- `function playTaskComplete(): void` — Short ascending 3-note arpeggio (C–E–G)
- `function playFeed(): void` — Quick 2-note munch
- `function playShower(): void` — Water-drip bursts
- `function playEvolve(): void` — Dramatic power-up sweep + two high notes
- `function playDegenerate(): void` — Descending sad tones + low thud
- `function playSleep(): void` — Soft descending lullaby notes
- `function playVisorTune(): void` — O CHIADO DA SINTONIA — o terceiro terço da sintonia do Visor (spec §2.3.1: "scanline de 400 ms + fade de 120 ms reserva→próprio + o chiado curto que a ocasião A já usa"). ⚠️ DIVERGÊNCIA doc↔código nº 10 do projeto (a 9ª está registrada em `spriteGen.contract.test.ts`).
**Chamado por:** `src/App.tsx`, `src/components/CompanionHUD.tsx`, `src/components/DinoGame.tsx`, `src/components/DungeonGame.tsx`, `src/components/EvolutionPath.tsx`, `src/components/NightmareBattle.tsx`, `src/components/RPSGame.tsx`
**Régua:** `sounds.contract.test.ts`, `sounds.visorTune.test.ts`

### `src/utils/specialItemUse.ts`
**Dono de:** O USO de item especial (glitchtama, coraçãozinho, chip) aplicado ao `prev` — dono único, distinto de `careUpdaters.ts`.
**Exports:**
- `SpecialRefusal` (type) — O USO de um item especial da pastinha — glitchtama, coraçãozinho, chip. ⚠️ Por que este arquivo existe, e por que NÃO é o `careUpdaters.ts`.
- `GLITCHTAMA_PER_DAY` — Quantos 🌀 Glitchtama o jogador pode CONSUMIR por dia do jogador. ⚠️ Este teto não é economia, é a espinha da progressão — e ele foi acrescentado depois de uma auditoria fazer a conta (06/09/2026). O Glitchtama dá +1 `perfectDays`, que é a moeda que a escada de evolução consome.
- `GlitchtamaUse` (interface) — O registro do teto, no SAVE (`glitchtamaUse`), nunca no localStorage. Mesmo motivo do `careCaps` e do `poopDrainCharge`: um teto que se fura trocando de aparelho não é um teto.
- `SpecialItemState` (interface) — Fatia do GameState que o uso de item especial lê e escreve.
- `function glitchtamaUsedToday(state: SpecialItemState, now: Date): number` — Quantos Glitchtama já foram usados HOJE. Dia diferente = zero — o registro antigo não é apagado, é simplesmente ignorado, que é o que torna esta leitura idempotente sob a virada.
- `function specialRefusal(state: SpecialItemState, emoji: string, now: Date): SpecialRefusal | undefined` — O uso seria recusado? Separado de `applySpecialItem` pelo mesmo motivo de `rubDecision`: a recusa acende sinal na UI (o coração cheio pisca o `healCapSignal`), e efeito colateral não entra em updater.
- `function applySpecialItem<T extends SpecialItemState>( prev: T, emoji: string, now: Date): { state: T; refused?: SpecialRefusal }` — Um item especial usado sobre o `prev`. ⚠️ A recusa é RECONFERIDA aqui, sobre o `prev` — a checagem de fora existe só pelo sinal na UI.
**Chamado por:** `src/App.tsx`
**Régua:** `specialItemUse.test.ts`
**Avisos do arquivo:**
- ⚠️ Existe separado de `careUpdaters.ts` porque item especial não tem TETO (aquele arquivo guarda tetos). `perfectDays`/`totalPerfectDays`/`CHIP_BOOST` alimentam evolução e o teto de geração de sprite — a extração é aritmeticamente idêntica ao inline anterior.
**Regra de negócio:** O uso de item especial (glitchtama tem teto de 1/dia — a espinha da progressão do Ultra). [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/spriteCopy.ts`
**Dono de:** Microcopy PT/EN da geração incremental de sprite (`spec-geracao-incremental.md` §7) — linguagem diegética, nunca técnica.
**Exports:**
- `SpriteText` (interface) — campos: `pt`, `en`.
- `SPRITE_COPY` — tabela/dado de configuração (ver código; 29+ linhas).
- `SpriteCopyKey` (type) — `keyof typeof SPRITE_COPY`
- `function spriteText(key: SpriteCopyKey, language: Language): string` — O texto PT/EN de uma chave de microcopy.
- `function spriteFailText(kind: SpriteFailKind, language: Language): string | null` — O texto de uma falha registrada, quando ela pede ação do jogador; `null` caso contrário.
**Chamado por:** `src/App.tsx`, `src/components/EvolutionPath.credencial.render.test.tsx`, `src/components/EvolutionPath.tsx`
**Régua:** nenhuma (`ls src/utils/spriteCopy*.test.ts` vazio).

### `src/utils/spriteGen.ts`
**Dono de:** Chama o backend de geração de sprite, pixeliza o resultado e monta o lote das N formas.
**Exports:**
- `SpriteGenOptions` (interface) — campos: `grid`, `colors`, `transparentBg`, `scale`.
- `SpriteGenReason` (type) — Por que a geração parou. **409 e 402 são contratos DIFERENTES** e o cliente não pode confundi-los (`custo-geracao-sprite.md` §5 + `_aiGuard.js`): - `lifetime-cap` (**402**) — a CONTA estourou o teto vitalício. Para para sempre, em todas as formas.
- `class SpriteGenError extends Error { readonly reason: SpriteGenReason; readonly status: number; readonly retryAfter?: number; readonly serverMessage?: { 'pt-BR': string; en: string }; constructor( reason: SpriteGenReason, status: number, message: string, extra: { retryAfter?: number; serverMessage?: { 'pt-BR': string; en: string } } = {})`
- `RequestSpriteOptions` (interface) — campos: `referenceImageUrls`, `promptFallback`, `formId`, `signal`.
- `function requestSprite( prompt: string, options: RequestSpriteOptions = {}): Promise<` — Chama o backend e devolve a imagem crua (URL/data URL) gerada pela IA.
- `function pixelizeDataUrl(dataUrl: string, opts: SpriteGenOptions = {}): Promise<string>` — Pixeliza uma imagem (data URL) em sprite v-pet: recorte quadrado central → redução ao grid → quantização de paleta → reamplia com pixels duros. Roda no browser (usa <canvas>).
- `function generateSprite( prompt: string, opts?: SpriteGenOptions, promptFallback?: string, formId?: string): Promise<string>` — Gera + pixeliza um único prompt. Devolve o sprite final (data URL).
- `StagePrompt` (interface) — campos: `key`, `prompt`, `promptFallback`, `formId`.
- `StageSprite` (interface) — campos: `key`, `sprite`.
- `function generateAllSprites( stages: StagePrompt[], opts: SpriteGenOptions & { onProgress?: (done: number, total: number, key: string) => void } = {}): Promise<` — Gera as N formas em sequência (evita rajada de chamadas simultâneas ao backend), reportando progresso. Retorna o que conseguiu; erros por forma são acumulados sem abortar as demais.
**Chamado por:** `src/components/OraclePage.tsx`, `src/hooks/useSpriteGeneration.ts`, `src/utils/spriteRunner.ts`, `src/components/SoulmonOnboarding.tsx`
**Régua:** `spriteGen.contract.test.ts`

### `src/utils/spriteLibrary.ts`
**Dono de:** O ACERVO DE SPRITES do jogador — estado puro da geração incremental (`spec-geracao-incremental.md`, gate em PASS).
**Exports:**
- `SpriteEntry` (interface) — Uma forma desenhada. Só metadado — o binário mora no Cache Storage.
- `SpriteFailKind` (type) — Por que uma forma não tem sprite próprio. `form-cap` (409) e `lifetime-cap` (402) são **contratos diferentes** e não podem ser tratados como um só: o 402 é a conta inteira parando para sempre; o 409 é UMA forma que esgotou as 3 tentativas dela, com as outras dez seguindo (…)
- `SpriteFormFailure` (interface) — campos: `attempts`, `manual`, `kind`, `terminal`, `lastAt`.
- `PendingTune` (interface) — A oferta de adoção da forma ATUAL (§2.3.1). Expira em uma virada de dia.
- `SpriteLibrary` (interface) — campos: `sprites`, `failures`, `pendingTune`, `reverted`, `tunedUnseen`.
- `SPRITE_FORM_ATTEMPT_CAP` — Teto de tentativas por forma — espelha `AI_LIMITS.sprite.perFormLifetime` (`functions/api/_aiGuard.js`). O servidor é a autoridade; isto é o disjuntor local que evita gastar uma chamada que já se sabe recusada.
- `SPRITE_MANUAL_RETRY_CAP` — Botão manual: 3 por forma, vitalício (`custo-geracao-sprite.md` §6).
- `SPRITE_MANUAL_COOLDOWN_MS` — Cooldown do botão manual, em ms (idem §6).
- `function isSafeSpriteUrl(url: unknown): url is string` — A URL pode virar `<img src>`? Guarda ÚNICA — `normalizeSpriteLibrary`, `recordSprite` e `spriteGen.loadImage` compartilham esta função em vez de cada um ter o seu dicionário de esquema, que é o mesmo motivo pelo qual `SpriteFailKind` empresta os nomes de `cloudSave.ts`: duas (…)
- `function isSafeSpriteSrc(url: unknown): url is string` — A URL pode virar `<img src>` num ponto que TAMBEM exibe asset do Vite?
- `function emptySpriteLibrary(): SpriteLibrary` — Acervo vazio (sem sprites, falhas nem oferta pendente).
- `function normalizeSpriteLibrary(raw: unknown): SpriteLibrary` — Normaliza o que veio do save (localStorage OU nuvem — os dois são dado não confiável). Campo novo sempre com fallback `?? padrão`, regra do `CLAUDE.md`.
- `function hasSprite(lib: SpriteLibrary, formId: string): boolean` — `sprites[formId]` existe? É a ÚNICA pergunta do gatilho (§3.5).
- `function displaySprite(lib: SpriteLibrary, formId: string): SpriteEntry | null` — O sprite a EXIBIR nesta forma — `null` significa "usa a arte de reserva" (`getSpriteForStage`), que é o piso do Invariante nº 1 e **nunca é erro**.
- `function isNewbornLibrary(lib: SpriteLibrary): boolean` — O acervo ainda não desenhou NADA — é a ocasião A (`birthBatch`), o lote de nascimento de quem acabou de criar a árvore (achado **F-1** do gate).
- `function isAccountCapped(lib: SpriteLibrary): boolean` — A CONTA já bateu o teto vitalício (402, `lifetime-cap`) em alguma forma?
- `function isFormCapped(lib: SpriteLibrary, formId: string): boolean` — Esta FORMA esgotou as 3 tentativas dela? (409 — não desliga as outras.)
- `function recordSprite( lib: SpriteLibrary, entry: SpriteEntry, opts: { adopt: 'now' | 'ask'; dayKey?: string }): SpriteLibrary` — Registra um sprite que chegou. `adopt: 'now'` = ocasião A e formas FUTURAS (chegam caladas). `adopt: 'ask'` = a forma ATUAL depois da cerimônia (ocasião C): a troca do rosto do bicho é do jogador (§2.3.1), então vira `pendingTune`.
- `function recordFailure( lib: SpriteLibrary, formId: string, kind: SpriteFailKind, opts: { manual?: boolean; at?: number } = {}): SpriteLibrary` — Registra uma falha. 409 e 402 gravam terminais DIFERENTES — de propósito.
- `function canManualRetry( lib: SpriteLibrary, formId: string, now: number = Date.now()): boolean` — O botão "Tentar de novo" pode aparecer? Nunca em estado terminal — botão que sempre falha é pior que botão ausente (`custo-geracao-sprite.md` §9).
- `function tuneVisor( lib: SpriteLibrary, formId: string, opts: { auto?: boolean } = {}): SpriteLibrary` — Adota o sprite próprio desta forma. `auto: true` é a adoção da VIRADA DO DIA, que acontece sem gesto nenhum do jogador — e é ela que precisa deixar rastro (`tunedUnseen`), porque quem nunca abre a aba Evolução acordava com o rosto do bicho trocado sem nenhum aviso (achado (…)
- `function markTuneSeen(lib: SpriteLibrary, formId: string): SpriteLibrary` — O jogador finalmente viu o selo `NOVO` desta forma.
- `function revertVisor(lib: SpriteLibrary, formId: string): SpriteLibrary` — "Voltar ao traço antigo" — devolve a reserva sem apagar o sprite pago.
- `function autoTuneDue(lib: SpriteLibrary, dayKey: string): string | null` — A oferta expirou? (§2.3.1: "se o card continuar sem toque até a **próxima virada de dia**, a adoção acontece sozinha".) O sprite nunca expira — só a oferta de escolher o momento.
- `SpriteCardState` (type) — Estados de card da página de Evolução (§2.2).
- `CardStateContext` (interface) — campos: `generating`, `imminent`, `reachable`, `online`, `unseen`.
- `function cardState(lib: SpriteLibrary, formId: string, ctx: CardStateContext): SpriteCardState` — O estado do card, e ele é UM só. A ordem das perguntas é a regra: o terminal de conta (402) e o de forma (409) mandam mais que "ainda estou gerando", porque sem isso um card ficaria pulsando para sempre por algo que já parou.
**Chamado por:** `src/App.tsx`, `src/components/EvolutionPath.credencial.render.test.tsx`, `src/components/EvolutionPath.estados.render.test.tsx`, `src/components/EvolutionPath.scanline.render.test.tsx`, `src/components/EvolutionPath.silhueta.render.test.tsx`, `src/components/EvolutionPath.sintonia-anuncio.render.test.tsx`, `src/components/EvolutionPath.sprite.render.test.tsx`, `src/components/EvolutionPath.tsx`, `src/components/LibraryPage.tsx`, `src/components/PlayerDetailModal.tsx`, `src/components/sintonia-chiado.render.test.tsx`, `src/components/spriteUrl.beacon.render.test.tsx`, `src/contexts/GameStateContext.tsx`, `src/hooks/useSpriteGeneration.ts`, `src/utils/spriteCopy.ts`, `src/utils/spriteGen.ts`, `src/utils/spriteRunner.ts`, `src/utils/spriteTrigger.ts`
**Régua:** `spriteLibrary.test.ts`
**Avisos do arquivo:**
- ⚠️ Reverter e re-sintonizar NÃO consomem o teto de tentativas — nenhuma função de adoção toca `attempts`.

### `src/utils/spriteRunner.ts`
**Dono de:** O executor de um lote de geração de sprite — serial, com recuo, sem React.
**Exports:**
- `SPRITE_RETRY_BACKOFF_MS` — Recuo entre as duas retentativas automáticas, em ms.
- `SpriteRunnerDeps` (interface) — campos: `generate`, `onResult`, `onFailure`, `sleep`, `isCancelled`.
- `SpriteRunResult` (interface) — campos: `done`, `failed`, `aborted`.
- `function runSpriteBatch( formIds: readonly string[], deps: SpriteRunnerDeps): Promise<SpriteRunResult>` — Roda um lote de formas em série (nunca paralelo), acumulando sucesso/falha por forma sem abortar o lote inteiro.
**Chamado por:** `src/hooks/useSpriteGeneration.ts`
**Régua:** `spriteRunner.test.ts`

### `src/utils/spriteTrigger.ts`
**Dono de:** O gatilho da geração incremental de sprite — função pura, três ocasiões possíveis.
**Exports:**
- `SpriteOccasion` (type) — `'A' | 'B' | 'C'`
- `SpriteTriggerInput` (interface) — campos: `evolutionStage`, `currentBranch`, `unlockedEvolutions`, `perfectDays`, `points`, `reading`, `library`.
- `SpriteBatch` (interface) — campos: `occasion`, `formIds`.
- `function pointsToEvolve(evolutionStage: string, perfectDays: number): number` — Quantos pontos faltam para a evolução ficar disponível (§3.1).
- `function targetFormId(input: SpriteTriggerInput): string | null` — A forma-destino, pela fonte única. `null` quando não há para onde ir.
- `function spriteBatch(input: SpriteTriggerInput): SpriteBatch | null` — O que gerar agora — `null` quando nada deve gerar. Uma forma só entra no lote se **não tem sprite** e **não está em estado terminal**: 409 `sprite-form-cap` (esta forma esgotou as 3 dela) ou 402 `sprite-lifetime-cap` (a conta parou de vez).
- `function birthBatch(input: SpriteTriggerInput): SpriteBatch | null` — O lote de nascimento (ocasião A): `rookie` + o galho previsto de champion.
**Chamado por:** `src/components/EvolutionPath.tsx`, `src/hooks/useSpriteGeneration.ts`
**Régua:** `spriteTrigger.test.ts`

### `src/utils/sprites.ts`
**Dono de:** O filtro de tonalidade do modo demo (WP1.12) e o resolvedor de sprite por estágio/linha.
**Exports:**
- `DEMO_TINTS` — WP1.12 — O FILTRO DE TONALIDADE DO DEMO. Quem entra pelo caminho grátis recebe um dos três personagens pré-prontos — iguais para todo mundo.
- `function demoTintFilter(tint: number | undefined): string | undefined` — O filtro CSS `hue-rotate` do tint do personagem demo, ou `undefined` para o tint 0.
- `DUNGEON_SPIRIT_SPRITE` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `DUNGEON_LINE_SPRITES` — tabela/dado de configuração (ver código; 8+ linhas).
- `DUNGEON_LINE_NAMES` — O NOME DE EXIBIÇÃO DE CADA LINHA — dono único. ⚠️ Estes três nomes estavam escritos à mão em TRÊS arquivos: aqui, no `PREMADE_CHARACTERS` (`monetization.ts`) e no `petName` dos NPCs da Biblioteca (`libraryNpcs.ts`).
- `function getDungeonEnemySprite(tier: string, excludeLine?: string): { sprite: string; name: string; line: string }` — Sprite de inimigo de masmorra: sorteia uma das nossas linhas pelo tier (baby-i/ii caem no rookie da linha; mega cobre ultimate também). `excludeLine` tira do sorteio a linha que o próprio jogador está usando (modo demo), pra ninguém encarar um espelho de si mesmo.
- `function getSpriteForStage(stage: string, demoCharacterId?: string): string` — A URL do sprite de um estágio; resolve primeiro o personagem demo (sem branch, um sprite por nível) antes da árvore normal.
**Chamado por:** `desktop/renderer/src/cloudSync.ts`, `desktop/renderer/src/main.ts`, `desktop/renderer/src/menu.ts`, `desktop/renderer/src/sprites.ts`, `desktop/renderer/src/state.ts`, `src/App.tsx`, `src/components/ArenaGame.tsx`, `src/components/BestiaryCard.tsx`, `src/components/CompanionHUD.tsx`, `src/components/DinoGame.tsx`, `src/components/DungeonGame.tsx`, `src/components/EvoTrail.tsx`, `src/components/EvolutionCeremony.tsx`, `src/components/EvolutionPath.tsx`, `src/components/LibraryPage.tsx`, `src/components/NightmareBattle.tsx`, `src/components/PetPage.tsx`, `src/components/PlayerDetailModal.tsx`, `src/components/RPSGame.tsx`, `src/components/SoulmonOnboarding.tsx`, `src/components/TournamentPage.tsx`, `src/components/spriteUrl.beacon.render.test.tsx`, `src/utils/dungeon.ts`, `src/utils/libraryNpcs.ts`, `src/utils/monetization.ts`
**Régua:** `sprites.dungeonRoster.test.ts`
**Regra de negócio:** O nome de cada linha jogável mora num lugar só — evita a masmorra e a Biblioteca divergirem no nome. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/steps.ts`
**Dono de:** Contador de passos opcional, leve, com degradação graciosa — camada fina sobre `@capgo/capacitor-pedometer`.
**Exports:**
- `DEFAULT_STEP_GOAL` — Meta diária padrão. Referência de caminhada regular, não meta médica.
- `StepsRecord` (interface) — O ÚNICO formato persistido (opcional no GameState: `steps?: StepsRecord`). Agregado diário e nada mais.
- `function stepsDayKey(date: Date): string` — dayKey do repo (mesma convenção de `habitRhythm`/`restWindow`).
- `function stepsDeltaFrom(baseline: number, raw: number): number` — Quantos passos NOVOS uma leitura crua representa, dado o último acumulado visto. Função pura — é aqui que o reboot é decidido. - `raw >= baseline`: caminhada normal → `raw - baseline`.
- `function updateStepBaseline( record: StepsRecord | null | undefined, raw: number, dayKey: string): StepsRecord` — Aplica uma leitura crua ao registro do dia. Pura; `dayKey` entra por parâmetro (nunca `Date.now()` aqui dentro). - Sem registro, ou registro de OUTRO dia → começa o dia zerado ancorado na leitura atual (`today = 0`, `baseline = raw`).
- `function stepsGoalProgress(steps: number, goal: number = DEFAULT_STEP_GOAL): number` — Progresso da meta, de 0 a 1 (nunca acima de 1, nunca abaixo de 0). Meta inválida (0 ou negativa) devolve 0 — sem meta não há progresso, e dividir por zero não vira 100%.
- `StepsConsentCopy` (interface) — campos: `title`, `what`, `why`, `privacy`, `accept`, `decline`.
- `function stepsConsentCopy(language: Language): StepsConsentCopy` — Texto de consentimento, EN + PT-BR. Precisa dizer o que é lido, para quê e o que não sai do aparelho — exigência da política do Play e da LGPD.
- `function isStepsAvailable(): Promise<boolean>` — O aparelho tem contador de passos? Web/PWA e aparelho sem sensor → false.
- `function hasStepsPermission(): Promise<boolean>` — Já temos permissão? Não abre diálogo nenhum.
- `function requestStepsPermission(): Promise<boolean>` — Pede a permissão de reconhecimento de atividade.   Só chame depois de mostrar `stepsConsentCopy`  (ver regra 3 no topo).
- `function readStepsToday( now: Date, previous?: StepsRecord | null): Promise<StepsRecord | null>` — Agregado de passos de hoje. Recebe o registro anterior (o que estaria no GameState) e devolve o registro atualizado, ou `null` quando não há sensor / permissão / leitura — caso em que o chamador deve manter o registro que já tinha, sem tocar em nada.
- `function __resetStepsRuntime(): void` — Só para os testes: esquece o módulo carregado e o estado da sessão.
**Chamado por:** `src/App.tsx`, `src/components/StepsCard.tsx`, `src/contexts/GameStateContext.tsx`
**Régua:** `steps.test.ts`
**Regra de negócio:** Contador de passos opcional — meta de referência, não médica; sem sensor não há dado nenhum. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/storageKeys.ts`
**Dono de:** Todas as chaves de `localStorage` — o prefixo é `soulmon-` desde 07/09/2026 (era `digiapp-`).
**Exports:**
- `STORAGE_KEYS` — tabela/dado de configuração (ver código; 41+ linhas).
- `RECONCILE_KEYS` — Chaves da RECONCILIAÇÃO de `saveId` (`utils/cloudSave.ts`, B-R1). Moram numa tabela própria, e não dentro de `STORAGE_KEYS`, porque não são preferência nem estado de jogo: são o rastro forense de UMA migração de identidade.
- `function migrateLegacyStorageKeys(): void` — Copia o que sobrou das chaves `digiapp-*` para os nomes novos. UMA vez. Roda no boot, antes de qualquer leitura de estado. Três decisões, e as três são sobre não destruir nada: · **copia, não move.** O valor antigo fica no `localStorage`.
**Chamado por:** `src/App.tsx`, `src/components/AISettingsModal.tsx`, `src/components/AccountDataSection.tsx`, `src/components/CompanionHUD.tsx`, `src/components/ConfirmDialog.tsx`, `src/components/DinoGame.tsx`, `src/components/ErrorBoundary.tsx`, `src/components/InstallPrompt.tsx`, `src/components/OraclePage.tsx`, `src/components/PetPage.tsx`, `src/components/SettingsModal.tsx`, `src/components/SettingsPage.tsx`, `src/components/SoulmonOnboarding.batismo.render.test.tsx`, `src/components/SoulmonOnboarding.rascunho.render.test.tsx`, `src/components/SoulmonOnboarding.tsx`, `src/components/WelcomePromptModal.tsx`, `src/contexts/GameStateContext.bond.test.tsx`, `src/contexts/GameStateContext.careCaps.test.tsx`, `src/contexts/GameStateContext.hostile.test.tsx`, `src/contexts/GameStateContext.hydrate.fuzz.test.tsx`, `src/contexts/GameStateContext.legacySave.test.tsx`, `src/contexts/GameStateContext.pvpBlocked.test.tsx`, `src/contexts/GameStateContext.saveContent.test.tsx`, `src/contexts/GameStateContext.storage.test.tsx`, `src/contexts/GameStateContext.tsx`, `src/contexts/LanguageContext.tsx`, `src/contexts/ThemeContext.tsx`, `src/main.tsx`, `src/utils/aiClient.ts`, `src/utils/audioBus.ts`, `src/utils/auth.ts`, `src/utils/cloudSave.ts`, `src/utils/dungeon.ts`, `src/utils/entitlements.ts`, `src/utils/gateDraft.ts`, `src/utils/notifications.ts`, `src/utils/oracleDraft.ts`, `src/utils/playBilling.ts`, `src/utils/sounds.ts`, `src/utils/telemetry.ts`
**Régua:** `storageKeys.migration.test.ts`, `storageKeys.reconcile.test.ts`
**Avisos do arquivo:**
- ⚠️ As chaves deixaram de ser `digiapp-*` em 07/09/2026 — o prefixo antigo era mantido sob a justificativa falsa de que existiam usuários atuais; não havia.

### `src/utils/taskSuggestions.ts`
**Dono de:** Sugestão de tarefas via IA (mesmo provedor do chat) e o nudge de versão mínima.
**Exports:**
- `SuggestedTask` (interface) — campos: `name`, `category`, `emoji`.
- `function suggestTasks( goalText: string, categories: ActivityCategory[], language: 'pt-BR' | 'en-US'): Promise<SuggestedTask[]>` — Sugestão de tarefas via IA (functions/api/suggest-tasks.js — mesmo provedor do chat do pet, Groq). Usada no onboarding do tutorial (criação da 1ª tarefa obrigatória).
- `function minimumViableHint(taskName: string, language: 'pt-BR' | 'en-US'): string | null` — Devolve uma sugestão de versão mínima, ou `null` se a tarefa já parece pequena o bastante (o caso mais comum — o nudge tem que ser raro para não virar ruído).
**Chamado por:** `src/App.tsx`, `src/components/CreateModal.tsx`, `src/components/GameTutorialFlow.tsx`
**Régua:** `taskSuggestions.test.ts`

### `src/utils/taskTriage.ts`
**Dono de:** O motor de EXECUÇÃO das tarefas pontuais (`types/taskModel.ts` é o contrato de CONSTÂNCIA dos hábitos).
**Exports:**
- `HABIT_WEIGHT` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `MAX_DAILY_FOCUS` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `OVERCOMMIT_EFFORT` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `POSTPONE_NUDGE_AT` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `HAUNTED_AFTER_DAYS` (re-export) — reexportado por conveniência; a descrição mora no módulo de origem.
- `function habitWeight(): number` — Peso de um hábito na meta do dia. Ver `HABIT_WEIGHT` em `types/taskModel.ts`.
- `TriageTask` (interface) — A fatia da `Task` (src/contexts/GameStateContext.tsx) que este motor lê. TODOS os campos novos são opcionais, e isso não é frouxidão de tipagem: é o requisito.
- `function sameDay(value: string | undefined, dayKey: string): boolean` — Exportada porque `utils/rituals.ts` tinha uma cópia byte-a-byte disto (junto com `parseDayValue`). Duas normalizações de data idênticas em dois módulos que comparam os MESMOS campos (`startDate`/`focusDate`) é o footgun 9 esperando a primeira correção que só chegue num dos lados.
- `function parseDayValue(value: string): Date | null` — 'YYYY-MM-DD' é lido como UTC pelo `Date` — vira o dia anterior em fuso negativo.
- `function deadlineAt(task: TriageTask): Date | null` — O instante em que a tarefa vence, ou `null` se ela não tem prazo.
- `function isOverdue(task: TriageTask, now: Date): boolean` — A tarefa já passou do prazo (`deadlineAt < now`)?
- `function taskStatus(task: TriageTask): TaskStatus` — O estado da tarefa, com padrão `'open'`. O padrão é o que faz save antigo funcionar: nenhuma tarefa gravada antes deste motor tem `status`, e todas elas são, por definição, tarefas vivas.
- `function isActive(task: TriageTask): boolean` — Só `'open'` está viva. `someday` e `dropped` NÃO entram em meta do dia, nem em contagem, nem em envelhecimento — e é justamente essa inércia que dá valor às duas saídas.
- `function effortOf(task: TriageTask): Effort` — Esforço da tarefa, com o padrão de save antigo (1 = rápida).
- `function weightOf(task: TriageTask): number` — Quanto a tarefa PESA na meta do dia. É o esforço, e não 1. Enquanto tudo valia 1, a estratégia ótima do jogador era cadastrar cinco tarefas triviais em vez de encarar a difícil — o defeito documentado do Karma do Todoist, e o único jeito de contornar o desenho inteiro deste (…)
- `function daysStale(task: TriageTask, now: Date): number` — Há quantos dias a tarefa está parada. Conta de `lastTouchedAt` (qualquer interação: adiar, editar, encolher) e cai para `createdAt`. Sem nenhum dos dois — o caso de todo save existente — a resposta é **0**: uma tarefa cuja idade o app não sabe não pode ser tratada como velha.
- `function isHaunted(task: TriageTask, now: Date): boolean` — A tarefa está ASSOMBRADA: vencida ou parada há `HAUNTED_AFTER_DAYS` dias. Na UI ela esmaece, ganha uma partícula escura e o pet olha para ela de vez em quando; concluí-la dá bônus de alívio (o pet comemora mais alto).
- `function postpone<T extends TriageTask>(task: T, now: Date, startDate?: string): T` — Adia a tarefa: +1 no contador, `lastTouchedAt` atualizado e, opcionalmente, novo `startDate`.
- `function needsPostponeNudge(task: TriageTask): boolean` — Chegou a hora do pet intervir (decompor / encolher / deixar pra lá). É o contador visível do Sunsama ("movida 7 vezes"): torna evitação crônica um DADO, e não um sentimento.
- `function shrink<T extends TriageTask>(task: T, now?: Date): T` — ENCOLHER: rebaixa o esforço em 1 (mínimo 1) e ZERA o contador de adiamentos. O zeramento é a metade importante. A tarefa mudou — não é mais a mesma coisa que a pessoa vinha evitando —, então o histórico de adiamento dela deixou de descrever alguma coisa verdadeira.
- `function drop<T extends TriageTask>(task: T, now: Date): T` — DEIXAR PRA LÁ — o Won't Do do TickTick. Estado terminal COM volta atrás.
- `function restore<T extends TriageTask>(task: T, now: Date): T` — A volta atrás. Sem ela, "deixar pra lá" seria um delete com passo extra.
- `function toSomeday<T extends TriageTask>(task: T, now: Date): T` — ALGUM DIA — a lista inerte do Things 3. Zera o contador de adiamentos junto: quem move para "algum dia" não está adiando mais uma vez, está tirando a tarefa do jogo. Manter a contagem faria a tarefa voltar já culpada no dia em que ela fosse reativada.
- `function toOpen<T extends TriageTask>(task: T, now: Date): T` — Traz de volta para a lista viva. `lastTouchedAt` é atualizado, então a tarefa NÃO volta já assombrada por tempo parado — ela ficou parada porque o usuário decidiu que ficasse. Voltar com a partícula escura na cara puniria o uso correto da lista inerte.
- `function setFocus<T extends TriageTask>(tasks: T[], ids: string[], dayKey: string): T[]` — Marca até `MAX_DAILY_FOCUS` tarefas como foco de `dayKey`, e LIMPA o foco das demais naquele dia. Três, e o número é a mecânica: é o Sunsama sem o custo de 20 minutos de planejamento.
- `function focusTasks<T extends TriageTask>(tasks: T[], dayKey: string): T[]` — As tarefas em foco no dia (ativas — foco de tarefa arquivada não é foco).
- `function focusComplete<T extends TriageTask>( tasks: T[], completedTasks: Array<{ id: string; completedAt?: string; focusDate?: string }>, dayKey: string): boolean` — As três do foco foram concluídas? Precisa olhar `completedTasks` também porque `completeTask` (careRules.ts) REMOVE a tarefa de `tasks` ao concluir.
- `PlannedActivity` (interface) — Fatia de um hábito que a carga do dia lê.
- `function plannedEffort( tasks: TriageTask[], activities: PlannedActivity[], dayKey: string, rhythms?: Record<string, HabitRhythm>): number` — Soma dos PESOS planejados para o dia: tarefas ativas com `startDate` ou foco no dia (cada uma pelo seu esforço) + hábitos elegíveis × `HABIT_WEIGHT`. Ponderado, e não contado: uma tarefa de esforço 3 pesa exatamente como três de esforço 1.
- `function isOvercommitted(effort: number): boolean` — O dia está sobrecarregado? O app assume que a estimativa do usuário está errada PARA BAIXO (planning fallacy) e fala antes que o dia fique impossível. ⚠️ ISTO É AVISO, NUNCA BLOQUEIO.
- `function triageQueue<T extends TriageTask>(tasks: T[], now: Date): T[]` — A fila do botão "Arrumar a pilha": tudo que está atrasado ou assombrado, ordenado por urgência.
**Chamado por:** `src/App.tsx`, `src/components/MorningCheckIn.tsx`, `src/components/TaskMeta.tsx`, `src/components/TriagePile.tsx`, `src/utils/careRules.ts`, `src/utils/petNeeds.ts`, `src/utils/rituals.ts`
**Régua:** `taskTriage.test.ts`
**Regra de negócio:** Tarefa = execução: foco (3/dia), sobrecarga é só aviso, nunca bloqueio. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/telemetry.ts`
**Dono de:** A allowlist de eventos e props da telemetria — nada de texto livre, opt-out, fila com teto local.
**Exports:**
- `TelemetryEvent` (type) — Os eventos. É o MÍNIMO que arbitra as decisões do plano — nada além.
- `EVENT_SCHEMA` — Allowlist de props por evento. `null` = evento sem prop nenhuma.
- `TELEMETRY_EVENTS` — `Object.keys(EVENT_SCHEMA) as TelemetryEvent[]`
- `TELEMETRY_FUNNEL` — Qual dos DOIS funis o passo pertence. Os dois usuários são opostos (demo grátis de 4 telas × ritual pago de 8+ telas) e somá-los no mesmo contador produz um número que não descreve nenhum dos dois — o `onboarding_step` sem esta prop mede a média de duas populações que nunca se (…)
- `TelemetryFunnel` (type) — `typeof TELEMETRY_FUNNEL[keyof typeof TELEMETRY_FUNNEL]`
- `TELEMETRY_TIER` — O TIER da conta no momento do evento. Códigos IGUAIS aos do funil de propósito — é o mesmo eixo demo × pago, lido em dois momentos diferentes da vida do usuário (o funil descreve por qual onboarding ele passou; o tier, o que ele É agora, inclusive depois de converter).
- `TelemetryTier` (type) — `typeof TELEMETRY_TIER[keyof typeof TELEMETRY_TIER]`
- `TELEMETRY_UNLOCK_REASON` — `report` = oferta proativa no 1º dia perfeito (WP5.1); `shop` = card passivo na Loja.
- `TELEMETRY_PURCHASE_REASON` — WP0.9 — de onde a compra veio. Os quatro primeiros são os MESMOS de `TELEMETRY_UNLOCK_REASON` de propósito (o convite e a compra têm de ser comparáveis); `onboarding` é o caminho que não passa por convite nenhum.
- `function unlockReasonCode(reason: 'task-limit' | 'evolution' | 'report' | 'shop'): number` — O motivo do convite, traduzido para o número do schema. ⚠️ Existe porque os DOIS emissores eram ternários de duas pernas contra um mapa de quatro (auditoria de 06/09/2026): um convite vindo do relatório diário era gravado como `evolution`, e um dispensar vindo de lá virava (…)
- `TELEMETRY_BAD_DAY` — WP0.10 — que TIPO de dia ruim ficou para trás. `heart` é perder coração na virada — a hipótese nº1 de churn do relatório 07. `degeneration` é cair de estágio, que é raro e caro.
- `TELEMETRY_OPEN_SOURCE` — WP0.11 — origem da abertura.
- `function openSourceFromUrl(search: string): number` — Lê a origem da abertura do `?src=` da URL (posto pelo `sw.js` no clique da notificação, e disponível para widget/atalho). Valor desconhecido cai em `direct` — inventar uma origem nova a partir de query string de terceiro seria deixar a métrica ser escrita por quem manda o link.
- `function revealDurationBucket(segundos: number): 0 | 1 | 2 | 3` — WP0.12 — faixas de tempo no reveal, em segundos. Faixa, nunca o segundo.
- `function afterBadDayGapBucket(dias: number): 0 | 1 | 2 | 3` — WP0.10 — distância até o retorno depois de um dia ruim, em faixa de dias.
- `TELEMETRY_ACTIVITY_KIND` — Tarefa (item com prazo) × hábito (item recorrente).
- `TELEMETRY_CREATE_PATH` — Por ONDE a atividade foi criada. Esta prop é a mais importante do `activity_create`, e a razão é desconfortável: os caminhos NÃO se comportam igual.
- `NEGATIVE_STEP_BASE` — Passos do onboarding são ids do componente e alguns são NEGATIVOS de propósito (`DEMO_PICK`, `GOAL_STEP`, `STRUGGLE_STEP`, `AGE_BLOCK`, `IDENTITY_STEP`, `CHOICE_STEP`, `EMAIL_STEP`, `GOOGLE_STEP` — ver `SoulmonOnboarding.tsx`), para telas novas não renumerarem o ritual.
- `function onboardingStepCode(step: number): number | null` — O passo do onboarding (ids negativos para passos especiais) traduzido para o código do schema de telemetria.
- `TelemetryProps` (interface) — Props aceitas. Note que NÃO existe campo de texto livre — de propósito.
- `TelemetryRecord` (interface) — O que vai no corpo da requisição. Três campos, todos números ou enums.
- `TelemetryBatch` (interface) — O lote enviado ao servidor.
- `ENDPOINT` — `'/api/metrics'`
- `MAX_QUEUE` — Teto da fila. A fila mora no localStorage (que é COMPARTILHADO com o save do jogo na mesma origem — ver `safeStorage`), então uma fila sem teto acaba estourando a cota e derrubando a gravação do PROGRESSO. Métrica jamais pode custar o save de ninguém.
- `MAX_BATCH` — Teto por lote. Casa com o `MAX_EVENTS` do servidor.
- `function telemetryDayKey(now: Date = new Date()): string` — Dia local em `YYYY-MM-DD`. Não reusa `dayKeyOf` (`utils/habitRhythm.ts`) porque aquele devolve `toDateString()` — formato do MOTOR DE HÁBITOS, que precisa fazer aritmética de dias. Aqui o formato é o da CHAVE DE AGREGADO no KV e precisa ser ISO e ordenável.
- `function isoWeekKey(day: string): string | null` — Chave da SEMANA ISO de um dia `YYYY-MM-DD`, no formato `YYYY-Www`. A métrica-norte é semanal ("concluiu ≥1 item real NA SEMANA", "≥4 dos 7 dias"), então precisa de uma fronteira de semana que não dependa de o usuário ter aberto o app.
- `function sanitizeEvent( event: string, props?: Record<string, unknown> | null, day: string = telemetryDayKey()): TelemetryRecord | null` — Converte (evento, props) no registro que TRAFEGA — ou `null` se algo não bate a allowlist. Esta é a função que faz o princípio 1 ser verificável em vez de prometido.
- `function enqueueCapped(queue: TelemetryRecord[], record: TelemetryRecord): TelemetryRecord[]` — Aplica o teto da fila. Extraída para o teste poder travar QUAL evento cai quando enche (o novo, nunca o histórico do funil).
- `function buildBatch(id: string, events: TelemetryRecord[]): TelemetryBatch` — Monta o corpo do lote. Nada além de `v`, `id` e os registros já saneados.
- `TelemetryConsentCopy` (interface) — campos: `title`, `sent`, `never`, `toggleLabel`, `footnote`.
- `function telemetryConsentCopy(language: 'pt-BR' | 'en-US'): TelemetryConsentCopy` — O texto do opt-out. Regra do repositório: todo texto de UI nasce em inglês e o par PT-BR vem junto. Ele descreve o que o código faz — e o código é a allowlist logo acima.
- `function isTelemetryEnabled(): boolean` — Ligada por padrão (opt-out), e é uma decisão consciente: só contador agregado sai daqui, e um opt-IN sobre uma amostra de 5% mediria o funil dos curiosos em vez do funil real — que é o mesmo defeito de não medir nada.
- `function setTelemetryEnabled(on: boolean): void` — Liga/desliga. Desligar APAGA a fila — deixar bytes esperando seria enganação.
- `function telemetryId(): string` — Pseudônimo local. 32 hex de `crypto.getRandomValues` — NÃO derivado de e-mail, de saveId nem de nada do usuário, e por isso não religável à conta.
- `function setTelemetryTier(tier: 'demo' | 'paid' | null | undefined): void` — Declara o TIER da conta. Chame uma vez, de um efeito sobre `gameState.accountTier` — e em nenhum outro lugar. Por que ambiente e não prop de call site: o tier é a mesma resposta para TODOS os eventos, vinda de uma fonte única (`gameState.accountTier`).
- `function telemetryTier(): number` — O tier ambiente vigente. `unknown` quando ninguém declarou.
- `RETENTION_MARKS` — WP0.2 — os três marcos de retenção, em DIAS desde a instalação. D1/D7/D30 é a régua padrão da indústria, e é a única leitura de retenção que este app pode ter sem coorte: cada marco vira um inteiro, uma vez na vida.
- `function retentionBucketFor(daysSinceInstall: number): 0 | 1 | 2 | null` — O bucket que a idade do save cruza, ou `null`. Puro, para o teste.
- `function trackRetentionOnOpen(now: Date = new Date()): void` — Emite `retained` NA ABERTURA do app, se um marco foi cruzado.
- `function isDocumentHidden(): boolean` — O app está em SEGUNDO PLANO? Vive aqui, e não em cada call site, pelo mesmo motivo do dedupe: quatro componentes checando `document.hidden` por conta própria é regra copiada (footgun 9).
- `function track(event: TelemetryEvent, props?: TelemetryProps, day?: string): void` — Enfileira um evento. **Nunca lança, nunca bloqueia, nunca faz I/O de rede.** É idempotente onde o evento é conceitualmente único (`install`, `first_task_done` uma vez na vida; `day_active` uma vez por dia), para que a fiação possa chamar à vontade de dentro de um efeito do React (…)
- `function trackDayClosed({ day, effort, goalMet }: { day: string; effort: number; goalMet: boolean; }): void` — O fechamento de UM dia. É o único ponto de fiação da métrica-norte: chame na virada do dia, com o relatório já fechado (`lastDayReport`).
- `function pendingWeekLedger(): WeekLedger | null` — Só para teste/depuração — a semana em curso, que NUNCA é enviada.
- `function soundStateProps(day: string):` — As props de `sound_state`, ou `null` quando o estado é DESCONHECIDO.
- `function noteMusicStarted(now: Date = new Date()): void` — A trilha foi iniciada POR GESTO. Chame do ponto que a inicia — hoje não há trilha contínua no app, então não há call site, e `music` sai 0 todo dia. A costura existe para que quem ligar a trilha não precise entrar aqui dentro. Grava um DIA e sobrescreve.
- `function trackSoundOff(now: Date = new Date()): void` — `sound_off` — a transição ligado → mudo, por gesto. A faixa é fechada NO APARELHO a partir de `K_INSTALL_DAY`, que já existe e nunca sai daqui (mesmo desenho de `retained`).
- `function flush(): void` — Envia o lote. Dispara e esquece — **não devolve promessa e não é `await`ável de propósito**, para que nenhum call site consiga acidentalmente esperar por rede antes de pintar a tela.
- `function installTelemetryAutoFlush(): () => void` — Registra o flush oportunista nos momentos em que a aba pode morrer. Opcional e idempotente — quem faz a fiação chama uma vez no boot. Não é efeito de import: um módulo que se pendura em `document` só por ter sido importado é impossível de testar e de remover.
- `function resetTelemetryForTest(): void` — Só para teste — o estado real mora no localStorage de propósito.
- `function pendingTelemetry(): TelemetryRecord[]` — Só para teste/depuração — o que está esperando para ser enviado.
**Chamado por:** `src/App.tsx`, `src/components/MorningCheckIn.commit.render.test.tsx`, `src/components/SettingsPage.tsx`, `src/components/SoulmonOnboarding.reveal.render.test.tsx`, `src/components/SoulmonOnboarding.tsx`, `src/components/UnlockAccountModal.dismiss.render.test.tsx`, `src/components/UnlockAccountModal.tsx`, `src/components/settingsTelemetry.render.test.tsx`, `src/components/telemetryWiring.render.test.tsx`
**Régua:** `telemetry.denominadores.test.ts`, `telemetry.som.test.ts`, `telemetry.test.ts`, `telemetry.viradaEVinculo.test.ts`

### `src/utils/tinyOffer.ts`
**Dono de:** A oferta reduzida do 'never miss twice' — eco curto da resposta de dificuldade do onboarding.
**Exports:**
- `STRUGGLE_ECHO_MAX` — Teto do que é reexibido. A pergunta é aberta; um parágrafo inteiro dentro de uma frase falada vira ruído, e cortar no meio de uma palavra é pior.
- `function echoStruggle(raw: unknown): string` — Colapsa espaço e corta na última palavra inteira dentro do teto.
- `function tinyOfferIntro(soulStruggle: unknown, isPt: boolean): string | null` — A linha que abre a oferta reduzida. `null` = a pessoa não respondeu, e aí não há nada a lembrar: quem chama mostra só a oferta de sempre.
**Chamado por:** `src/components/MorningCheckIn.tsx`
**Régua:** `tinyOffer.test.ts`

### `src/utils/tournamentSeason.ts`
**Dono de:** A janela sexta–domingo da rodada semanal do Torneio — ritual, nunca tranca.
**Exports:**
- `ROUND_START_DAY` — Dia da semana em que a rodada começa (5 = sexta).
- `ROUND_LENGTH_DAYS` — Quantos dias ela dura (sexta, sábado e domingo).
- `TournamentWindow` (interface) — campos: `isOpen`, `daysUntilNext`, `daysLeft`.
- `function getTournamentWindow(now: Date = new Date()): TournamentWindow` — Estado da rodada semanal. Puro e sem fuso escondido: usa a data local do jogador, que é a que ele enxerga no calendário.
- `function tournamentWindowLabel(win: TournamentWindow, language: 'pt-BR' | 'en-US'): string` — Frase curta para a UI, nos dois idiomas. Nunca cobra presença.
**Chamado por:** `src/components/TournamentPage.tsx`
**Régua:** `tournamentSeason.test.ts`
**Regra de negócio:** A rodada do Torneio é ritual de sexta a domingo — fora da janela o Torneio segue disponível. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/tournamentTiers.ts`
**Dono de:** As faixas do Torneio (Semente→Lendário) por pontos — nunca rebaixa.
**Exports:**
- `TournamentTier` (interface) — campos: `id`, `emoji`, `namePt`, `nameEn`, `min`.
- `TOURNAMENT_TIERS` — tabela/dado de configuração (ver código; 7+ linhas).
- `TierStanding` (interface) — campos: `tier`, `next`, `pointsToNext`, `progress`.
- `function getTierStanding(points: number): TierStanding` — Faixa de um jogador a partir dos pontos. Pontos negativos ou inválidos caem na primeira faixa — nunca lança, porque isto alimenta UI.
**Chamado por:** `src/components/TournamentPage.tsx`
**Régua:** `tournamentTiers.test.ts`
**Regra de negócio:** As faixas do Torneio nunca rebaixam o jogador ao acumular pontos. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/tzOffset.ts`
**Dono de:** Offset em ms de um fuso IANA à frente do UTC, num instante dado (histórico de horário de verão incluído).
**Exports:**
- `function tzOffsetMs(instant: Date, timeZone: string): number` — Quantos milissegundos o fuso `timeZone` está À FRENTE do UTC no `instant`. Positivo a leste (Tóquio: +9h), negativo a oeste (São Paulo: −3h). O valor é do INSTANTE, não do fuso: é assim que horário de verão entra na conta sem ninguém precisar saber que ele existe.
**Chamado por:** `src/utils/playerDay.ts`, `src/utils/soulProfile/astrology/chart.ts`
**Régua:** nenhuma (`ls src/utils/tzOffset*.test.ts` vazio).

### `src/utils/vapid.ts`
**Dono de:** A chave pública VAPID do Web Push.
**Exports:**
- `VAPID_PUBLIC_KEY` — `'BIO7RjZ9yeknwdZPD8k8hKJ6EHqIPVap8JQNP2AR300fbpvcPEMPwRi4lvarHEeAR5hD6aawtb_QYIy4Ir16zdo'`
**Chamado por:** `src/utils/notifications.ts`
**Régua:** nenhuma (`ls src/utils/vapid*.test.ts` vazio).

### `src/utils/weekBalance.ts`
**Dono de:** 'Equilibrar minha semana' (P4 de `product/soulmon-01/balance/carga-diaria.md`) — propõe redistribuir hábitos de recorrência fixa.
**Exports:**
- `DIAS_DA_SEMANA` — Domingo = 0, como `Date.getDay()` e como `Schedule.days` já usa.
- `AtividadeSemanal` (interface) — campos: `id`, `days`.
- `PropostaDeEquilibrio` (interface) — campos: `mudancas`, `antes`, `depois`, `picoAntes`, `picoDepois`, `cabe`.
- `function contarPorDia(atividades: AtividadeSemanal[]): number[]` — Quantos itens caem em cada dia da semana.
- `function equilibrarSemana( atividades: AtividadeSemanal[], teto: number): PropostaDeEquilibrio` — Propõe uma semana mais plana. @param atividades só as de `kind: 'weekdays'` — ver o cabeçalho. @param teto itens por dia que não se quer ultrapassar.
- `function valeEquilibrar(proposta: PropostaDeEquilibrio, teto: number): boolean` — Vale a pena oferecer o botão? Oferecer "equilibrar" para quem já está equilibrado é ruído — e pior, sugere que há algo errado quando não há. Só aparece quando existe pelo menos um dia acima do teto E a proposta realmente melhora o pico.
**Chamado por:** `src/App.tsx`, `src/components/BalanceWeekModal.tsx`
**Régua:** `weekBalance.test.ts`
**Regra de negócio:** 'Equilibrar minha semana' propõe redistribuir hábitos de recorrência fixa sem forçar nada. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/weekdays.ts`
**Dono de:** Rótulos curto/completo dos dias da semana.
**Exports:**
- `function weekdayShort(index: number, language: Language): string` — Rótulo de 3 letras (o que cabe no chip).
- `function weekdayFull(index: number, language: Language): string` — Nome inteiro — vai no `title` e no `aria-label` do chip.
- `WEEKDAY_INDEXES` — Os sete índices, na ordem de `Date.getDay()`.
**Chamado por:** `src/components/BalanceWeekModal.tsx`, `src/components/CreateModal.tsx`
**Régua:** nenhuma (`ls src/utils/weekdays*.test.ts` vazio).

### `src/utils/weeklyMissions.ts`
**Dono de:** As 3 missões SEMANAIS sorteadas deterministicamente, pagas em Emblemas.
**Exports:**
- `WeeklyMissionId` (type) — `| 'rest-nights' | 'checkins' | 'haunted-done' | 'dungeon-runs' | 'rub-days' | 'shower' | 'play-days' | 'mood-checkins' | 'dream-new' | 'evolve-view' | 'tournament-match' | 'friend-visit'`
- `WeeklyMission` (interface) — campos: `id`, `target`, `emblems`, `descPt`, `descEn`.
- `WEEKLY_MISSION_COUNT` — `3`
- `function weeklyMissionsFor(weekKey: string): WeeklyMission[]` — As três missões da semana. DETERMINÍSTICO por semana: a mesma `weekKey` devolve sempre as mesmas três, em qualquer aparelho.
- `function weeklyMissionPool(): readonly WeeklyMission[]` — O pool inteiro — existe para o teste varrer o vocabulário.
- `WeeklyMissionProgress` (interface) — campos: `week`, `counts`, `claimed`.
- `function emptyWeeklyProgress(week: string): WeeklyMissionProgress` — Progresso vazio de missões semanais para a `week` dada.
- `function forWeek(p: WeeklyMissionProgress | undefined, week: string): WeeklyMissionProgress` — Zera na virada da semana. Semana igual devolve a MESMA referência.
- `function bumpWeekly( p: WeeklyMissionProgress, id: WeeklyMissionId): WeeklyMissionProgress` — Soma 1 numa missão. PURA e sem teto — quem lê compara com o `target`.
- `function isWeeklyDone(p: WeeklyMissionProgress, m: WeeklyMission): boolean` — A missão já bateu o alvo (`counts[m.id] >= m.target`)?
- `function claimWeekly( p: WeeklyMissionProgress, m: WeeklyMission): { progress: WeeklyMissionProgress; emblems: number }` — Marca como paga e devolve os Emblemas devidos — `0` se já estava paga ou se ainda não terminou. Idempotente: o updater do React roda 2×.
**Chamado por:** `src/App.tsx`, `src/components/ShopModal.tsx`, `src/contexts/GameStateContext.tsx`
**Régua:** `weeklyMissions.fiacao.test.ts`, `weeklyMissions.test.ts`
**Avisos do arquivo:**
- ⚠️ NENHUMA missão semanal premia CONTAGEM DE TAREFAS — proibição escrita do `CLAUDE.md`, é a mais fácil de furar sem perceber.
**Regra de negócio:** Nenhuma missão semanal premia contagem de tarefas — proibição escrita. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).

### `src/utils/welcomeBack.ts`
**Dono de:** A fala de boas-vindas ao retorno, por faixa de dias de ausência.
**Exports:**
- `AbsenceBucket` (type) — Faixas de ausência. A mesma partição do evento `welcome_back { days }`.
- `function absenceBucket(days: number): AbsenceBucket` — 0 = voltou no dia seguinte (ou no mesmo), 1 = 2–4 dias, 2 = 5–14, 3 = 15+. Faixa e não número cru: dia exato de retorno, cruzado com o resto, começa a descrever uma pessoa.
- `function welcomeBackLine(days: number, isPt: boolean, pick: number): string` — A fala do reencontro. `pick` (0..1) entra por parâmetro para o teste ser determinístico sem tocar no `Math.random` global.
- `function welcomeBackLines(bucket: AbsenceBucket): { pt: string[]; en: string[] }` — Todas as frases de uma faixa — existe para o teste de tom varrer o conjunto.
**Chamado por:** `src/components/CompanionHUD.tsx`
**Régua:** `welcomeBack.test.ts`
**Regra de negócio:** A fala de retorno nunca cobra ausência — é reencontro, não fatura. [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md).
