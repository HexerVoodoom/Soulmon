# 14 — Verificação dos docs de precedência alta (doc-verificador + doc-cartografo)

Data: 21/09/2026 · HEAD `212da7d5` · Somente leitura, nada editado.
Regra: `caminho` + SÍMBOLO, nunca número de linha; toda contagem tem o comando ao lado.

Vereditos: **V** = verdadeiro · **F** = falso · **D** = desatualizado (já foi verdade) · **R1** = viola a própria regra do arquivo (`arquivo:linha`) · **S/C** = sem comando/inverificável (R3).

---

## 1. `CLAUDE.md` (765 linhas — `wc -l CLAUDE.md`)

### 1.1 O que está FALSO ou DESATUALIZADO (ação necessária)

| # | Afirmação (bloco) | Comando | Resultado | Veredito |
|---|---|---|---|---|
| 1 | Bíblia: régua `src/narrativa.contract.test.ts` "com a tabela `DÍVIDA`" | `rg -n "DÍVIDA\|EXCECOES" src/narrativa.contract.test.ts` | só `EXCECOES` (cabeçalho: "não é mais dívida a quitar: é a lista do que ficou, por decisão") | **D** (D31 conhecida) |
| 2 | 🫶 Carinho: Coraçãozinho "comprado na loja ou dropado na masmorra" | `rg -n "⚰️ O CORAÇÃOZINHO" src/utils/shop.ts`; contagem de `kind:` dentro de `SHOP_ITEMS` | lápide: "NÃO É MAIS VENDIDO (06/09/2026, D7+D15)"; `SHOP_ITEMS` = 3 chip / 26 bg / 27 furniture / 6 mission, **zero** `heart` | **F** |
| 3 | 🛒 Loja: "**coraçãozinho** (`💗`, 150) — vai pra pastinha" | idem | idem — só existe em `SPECIAL_ITEMS` (uso), o filtro `kind === 'heart'` do `ShopModal` casa com nada | **F** |
| 4 | 💎 Créditos: "Gastam em reroll (50), **cura instantânea (10)**" | `rg -n "_COST_CREDITS" src/utils/monetization.ts` | `REROLL_COST_CREDITS = 50` ✓; `HEART_COST_CREDITS = 10` é ⚰️ "saiu em 06/09/2026 (D7+D15)" | **D** (a cura em Créditos não existe) |
| 5 | Push: "canal `digiapp_push` criado em `MainActivity.java`" | `rg -n "NotificationChannel" android/app/src/main/java/com/hexervoodoom/soulmon/MainActivity.java` | canal é `soulmon_push` (0 ocorrências de `digiapp_push` no repo) — e o próprio `CLAUDE.md`, na seção "Arte e nomes", diz que virou `soulmon_push` | **F** (contradição interna) |
| 6 | Widgets: "Dados via `DigiWidgetPlugin`" | `find android -name "*Plugin*.kt"` | `SoulmonWidgetPlugin.kt`, `SoulmonAlarmPlugin.kt`, `BillingPlugin.kt`; 0 hits de `DigiWidgetPlugin` fora de teste — a mesma seção "Arte e nomes" diz que virou `SoulmonWidget` | **F** (contradição interna) |
| 7 | Footgun 9 (Vínculo): gate de PvP "cliente (`canPvp`)" | `rg -n "^export (function\|const) \w*[Pp]vp" src/utils/bond.ts` | `meetsPvpBond`, `xpToPvpBond`; `canPvp` = 0 ocorrências no repo | **F** (símbolo inexistente) |
| 8 | MAPA: "17 documentos em `docs/manual/`" | `find docs/manual -name '*.md' \| wc -l` | **18** (12 na raiz + 6 em `06-REFERENCIA/`) | **D** |
| 9 | 🌠 Sonhos: "`utils/restWindow.ts:371`" | `rg -n "export const DREAM_CATALOG" src/utils/restWindow.ts` | está na 374 — e é referência `arquivo:linha`, proibida pelo próprio arquivo | **R1** + apodrecida |
| 10 | 💩 Cocô: "`types/progression.ts:14`, sem `egg`/`baby`" | `rg -n "'egg'\|'baby'" src/types/progression.ts` → 0 | fato verdadeiro, forma proibida (`arquivo:linha`) | **R1** |
| 11 | Desbloqueio: "Largura padronizada em **280** (`maxWidth` no `UnlockAccountModal.tsx`), nunca 440" | `rg -n "maxWidth" src/components/UnlockAccountModal.tsx` | `ModalSheet maxWidth={440}` (o modal) **e** `maxWidth: 280` (o `UnlockNudge`). O 280 é do convite; o 440 continua no modal | **Ambíguo** — como está escrito, um leitor "corrige" o 440 do modal e quebra o canvas Conta |
| 12 | Bloco "44 pontos" da premissa falsa | `rg -n "44 pontos" docs CLAUDE.md` | nenhuma lista de 44 existe em lugar nenhum; `09-HISTORICO.md` e `10-DISCUSSOES` só citam o `CLAUDE.md` de volta. O bloco lista 6 exemplos; dos 6, quatro já morreram (`DIGIAPP_SAVES` só como fallback, `digiapp_*` migradas, `digimonName` ⚰️, `LEGACY_FORM_TIERS` ⚰️ — `rg -n "AQUI VIVIA .LEGACY_FORM_TIERS" src/types/progression.ts`) | **S/C** — número sem comando (R3), e o bloco descreve estado de 07/09 sem dizer o que já foi resolvido |
| 13 | STATUS "registro vivo" + hook: "`.claude/hooks/session-start.sh`" e `docs-sync.yml` | `ls .claude/hooks .github/workflows` | existem | V |

### 1.2 O que confere (amostra verificada — comando + resultado)

| Afirmação | Comando | Resultado |
|---|---|---|
| `HEART_GOAL_RATIO = 0,6`; mega 6→4, rookie 4→3 | `rg -n "HEART_GOAL_RATIO\s*=" src` + `FORM_REQUIREMENTS` | 0.6; rookie 4 / champion 5 / ultimate 5 / mega 6 / ultra 6 → ceil(6×0.6)=4, ceil(4×0.6)=3 ✓ |
| `MAX_HEARTS_LOST_PER_DAY`=1, `ABSENCE_FORGIVENESS_DAYS`=2, `WEEKLY_RELIEF_HEARTS`=0.5, `REST_DAYS_PER_WEEK`=1 | `rg -n "<NOME>\s*=" src/utils/dailyReset.ts` | 1 / 2 / 0.5 / 1 ✓ |
| Comida: `MAX_STAGE_REQUIREMENT` hoje 6, derivado de `FORM_REQUIREMENTS`; `FOOD_LIMIT_PER_HOUR = MAX_STAGE_REQUIREMENT` | `rg -n "MAX_STAGE_REQUIREMENT" src/types/progression.ts src/utils/careRules.ts` | `Math.max(...required)` = 6 ✓ |
| Carinho: ~2s = +0.5, máx 1/dia | `rg -n "RUB_HEAL_(STEP\|DAILY_CAP)" src/utils/careRules.ts` | 0.5 / 1 ✓ |
| HP máx rookie/champion/ultimate=3, mega=4, ultra=5; `MANUAL_EVOLUTION = true` | `rg -n -A5 "MAX_HP_BY_FORM = " src/types/progression.ts`; `rg -n "MANUAL_EVOLUTION\s*=" src` | ✓ |
| Traços: Carinhoso +0.5 no teto, Sortudo +5pp, Madrugador 10h, Guloso +1 | `rg -n "0\.5\|0\.05\|10\|GULOSO_BONUS_ATTR" src/utils/passives.ts` | ✓ |
| `GLITCHTAMA_PER_DAY = 1`; `REBIRTH_BUDGET_MULTIPLIER = 1.5`; `MAX_FLOORS = 5` em `components/DungeonGame.tsx` | `rg -n "<NOME>\s*=" src` | ✓ (MAX_FLOORS de fato no componente, não em `utils/dungeon.ts`) |
| Masmorra: 6 tiers `LADDER_TIERS`; 9 linhas `DUNGEON_LINE_SPRITES`; 36 artes = 9×4; bônus `10+5×(andar−1)`; drop 5% máx 2/dia; 5 clássicos + 13 pintadas + 16 bgs de loja | `rg -n "LADDER_TIERS\s*=" src/utils/dungeon.ts`; `awk` nas linhas de `DUNGEON_LINE_SPRITES`; `rg -n "clearBonus" src/components/DungeonGame.tsx`; `rg -n "HEART_DROP_(CHANCE\|DAILY_CAP)" src/utils/dungeon.ts`; contagem de `namePt:` em `DUNGEON_SCENES`/`SPIRIT_BG_SCENES` e `'bg-` em `SHOP_BG_ACCENTS` | 6 / 9 / 0.05 e 2 / 5 + 13 + 16 ✓ |
| Loja: chips 120 (3); decoração 100–140, 27; cenários 150–250, 19 à venda; 6 `bg-mission-*` a 300; Missões 6; pool semanal 12, `WEEKLY_MISSION_COUNT = 3` | script node por `kind`/`price` em `SHOP_ITEMS`; `rg -c "id: '" src/utils/missions.ts`; contagem de `{ id:` em `POOL` | chip {120:3}; furniture {100:6,110:5,120:5,130:6,140:5}=27; bg {0:1,150:6,180:5,200:4,220:3,250:1,300:6} → 19 pagos em Bits + 1 grátis + 6 missão ✓ |
| Emblemas 3/1; `TOURNAMENT_ITEMS` 8 itens, escada 8/12/15/20/25/40/55/70; `CREDIT_TO_BITS = 10`; `BITS_EXCHANGE` sem Bits→Créditos | `rg -n "EMBLEMS_PER_\|CREDIT_TO_BITS\|BITS_EXCHANGE" src/utils/currencies.ts`; `price:` dentro de `TOURNAMENT_ITEMS` | ✓ |
| Bits: Dino floor(score/100); PPT 5/vitória | `rg -n "score / 100" src/components/DinoGame.tsx`; `rg -n "MATCH_POINTS" src/components/RPSGame.tsx` | ✓ |
| Sonhos: 30 = 12/10/8 | `grep -c "rarity: '<x>'" src/utils/restWindow.ts` | 12 / 10 / 8 ✓ |
| Motor de tarefas: `HABIT_WEIGHT`=1, `HABIT_MILESTONES`=[7,21,66], `HABIT_TIER_BONUS` 0/.1/.2/.3, `CONSTANCY_WINDOW_DAYS`=7, `REST_SHIELD_MAX`=3, `REST_SHIELD_EARN_EVERY_DAYS`=7, `MISS_INTERVENTION_AT`=2, `MAX_DAILY_FOCUS`=3, `OVERCOMMIT_EFFORT`=7, `POSTPONE_NUDGE_AT`=3, `HAUNTED_AFTER_DAYS`=7, `DEFAULT_REST_WINDOW` 23:00–07:00, `REST_WINDOW_GRACE_MIN`=45, `REST_WINDOW_DAYS`=7; `HISTORY_CAP`=120; `GOOD_CONSTANCY_RATIO`=5/7 | `rg -n "export const" src/types/taskModel.ts`; `rg -n "HISTORY_CAP\|GOOD_CONSTANCY_RATIO" src/utils/habitRhythm.ts` | todos ✓ |
| Áudio: 8 sons (`play*`), 5 arquivos em `public/sounds/`, `JANELA_DE_COINCIDENCIA_MS`, réguas `cortes.contract`, `sonsAssets.contract`, `settingsSom.render`, `sintonia-chiado.render`; S1..S16 sem S14; `SettingsModal` sem gatilho vivo | `grep -c "^export function play" src/utils/sounds.ts`; `ls public/sounds`; `rg -c "\*\*S14" docs/REGISTRO-DE-DECISOES.md` → 0; `rg -n "onOpenAISettings" src/components/ChatBox.tsx` (só destruturado, nunca chamado — o único caminho até `setSettingsOpen(true)`) | ✓ |
| `CACHE_VERSION` sem número aqui | `rg -n "CACHE_VERSION =" public/sw.js` | `'v155'` — o arquivo acerta em não citar |
| `src/App.tsx` sem número aqui | `wc -l src/App.tsx` | 6149 — idem |
| `soulmon_state_v1`; prefixo `soulmon-`; `migrateLegacyStorageKeys` no `main.tsx`; `sw.js` varre os dois prefixos | `rg -n "GAME_STATE\|THEME:" src/utils/storageKeys.ts`; `rg -n "migrateLegacyStorageKeys" src/main.tsx`; `rg -n "digiapp-" public/sw.js` | ✓ |
| Cloud save 3 s; virada a cada 30 s; cocô a cada 10 s; idle 3 min com guard `document.hidden` | `rg -n "CLOUD_SAVE_DEBOUNCE_MS" src/contexts/GameStateContext.tsx`; `rg -n "30000" src/hooks/useDailyReset.ts`; `rg -n "10000" src/hooks/useCareSystem.ts`; `rg -n "180000" src/components/CompanionHUD.tsx` + `grep -c document.hidden` = 9 | ✓ |
| `_kv.js` prefere `SOULMON_SAVES`, cai em `DIGIAPP_SAVES`; ninguém lê `env.*_SAVES` fora | `rg -ln "env\.(SOULMON\|DIGIAPP)_SAVES" functions/api \| grep -v _kv.js` | só arquivos `*.test.js` ✓ |
| URL de produção nas 3 fontes | `rg -n '"url"' capacitor.config.json`; `rg -n "APP_URL =" desktop/renderer/src/config.ts`; `rg -n "FULL_APP_URL =" desktop/electron/main.js` | as três em `soulmon.mateus-sprnd.workers.dev` ✓ |
| `desktop-release.yml` só em tag `v[0-9]+.[0-9]+.[0-9]+`, `contents: write`; `desktop-build.yml` `contents: read`; `.env.production` em `!.gitignore` | `rg -n "tags:\|v\[0-9\]\|contents:" .github/workflows/desktop-*.yml`; `rg -n "env.production" .gitignore` | ✓ |
| `PUSH_HOURS_BRT` sem hora 20; `eveningCopy` em `_pushCopy.js` | `rg -n "PUSH_HOURS_BRT = \|eveningCopy" functions/api/_pushCopy.js` | `[10, 16, 22]` ✓ |
| `PREMADE_CHARACTERS` = 6 (kaelen/orrin/thalindra/igni/nautilu/astrase); nomes em `DUNGEON_LINE_NAMES` | `rg -n "id: '" src/utils/monetization.ts`; `rg -n -A4 "DUNGEON_LINE_NAMES" src/utils/sprites.ts` | ✓ |
| `<UnlockNudge` = 6 (App ×2, CreateModal, DailyReportModal, ShopModal, SoulmonOnboarding `REVEAL_DEMO`) | `rg -c "<UnlockNudge" src/App.tsx` = 2; `rg -rln "<UnlockNudge" src` | ✓ |
| `LEGACY_FORM_TIERS` e `digimonName` não existem mais | `rg -n -g '!*.test.*' "<NOME>" src functions desktop` | só em comentários-lápide ✓ |
| `android:label` "DigiApp" = 0; canais `soulmon_push`/`soulmon_alarms`; layouts `widget_soulmon*`; `widget_bg.xml`, `spriteBitmap`/`setImageViewBitmap` | `rg -n "DigiApp" android/app/src/main/AndroidManifest.xml` → 0; `ls android/app/src/main/res/layout` | ✓ |
| Ícones 32/24/32, régua `iconScale.contract.test.ts` | `find src -name "iconScale*"` → `src/styles/iconScale.contract.test.ts`; `src/styles/tokens.md` §6.1 | ✓ |
| `sync:oracle-data`; `ORACLE_QUESTIONS` = 6; `GOAL_STEP`/`STRUGGLE_STEP`/`DEMO_PICK` | `rg -n "sync:oracle-data" package.json`; contagem de `{` no array; `rg -n "<NOME>" src/components/SoulmonOnboarding.tsx` | ✓ |
| Símbolos citados (≈190 conferidos em lote, sem teste): `heartGoalFor`, `restWeekKeyFor`, `specialRefusal`, `applySpecialItem`, `rebirthRefusal`, `hauntedWatching`, `sm-pet-haunted`, `sm-pet-sticky`, `contarMissao`, `getDungeonEnemySprite`, `buildDungeonWave`, `setDungeonDifficultyAtLeast`, `buildRunScenes`, `PLAYER_STATS`, `enemyKey`, `bestiary`, `habit_steady`, `eveningCopy`, `isSafeSpriteUrl`, `composeSpritePrompts`, `imagePromptFallback`, `isRefusal`, `claimOrder`, `equippedDecor`, `bondLevelFor`, `emailToSaveId`, `tocarNa`, `resolveLanguage`, `speakRaw`, `MilestoneCeremony`, `ProtectProgressModal`, `EvolveTaskModal`, `FirstDayCard`, `handleUpgradeRevealed`, `simulateReset` (só lápide), … | `rg -l -F "<sym>" src functions workers desktop android public .github .claude -g '!*.test.*'` | único zero: `canPvp` (item 7) |
| Arquivos citados (≈70): todos os `src/**`, `functions/**`, `desktop/**`, `docs/*.md`, `product/soulmon-01/balance/carga-diaria.md`, `squad-alpha-runs/soulmon-02/builder/tetos-cuidado-no-save.md` | `ls` em cada um | todos existem; único não-resolúvel é o reticente `android/.../widget/WidgetRenderer.kt` (existe em `android/app/src/main/java/com/hexervoodoom/soulmon/widget/`) |

### 1.3 Inverificáveis por comando (R3 — o arquivo afirma sem medida)

"74 sprites da Bandai (25 + 49)", "40 sprites em `android/res/drawable`", "242 criaturas / 947 KB", "57 nomes", "69 versões atrás", "~950 linhas", "os 8 cenários mais novos são arte pintada", "3.974 testes verdes", "17/17 elementos, 65/65 talentos…". São históricos (o bundle atual não contém mais o que é contado) — aceitáveis como registro, mas cada um deveria dizer "medido em dd/mm com <comando>" (R7).

---

## 2. `docs/manual/*.md` — cabeçalhos e constantes

### 2.1 Cabeçalho `Dono / Data / Estado / Verificação`

- Todos os 18 docs têm os quatro campos (`head -4` em cada um).
- **Guard**: `src/docsManual.contract.test.ts` item **(e)** exige só `Dono:` e `Verificação:` (`rg -n "Dono\|Verificação" src/docsManual.contract.test.ts`). **`Data:` e `Estado:` não são cobertos por guard nenhum** — o carimbo "verificado em dd/mm por doc-verificador" é texto livre; nada reprova um carimbo velho ou um `Estado` que contradiz o delta.
- Docs cujo `Data:` ficou para trás do `Estado:` (`Data` 09–10/09 ou 20/09, `Estado` 21/09): `03-FLUXO-DE-TELAS`, `06-REFERENCIA/hooks-contexts-types`, `07-DADOS-E-SAVE`. Docs com **carimbo de 10/09/2026** não retocado desde então: `06-REFERENCIA/plugins-constants.md`, `09-HISTORICO.md`, `11-GLOSSARIO.md` — 11 dias e vários merges depois (o `STATUS` registra sincronizações em 15, 20 e 21/09).

### 2.2 Constantes citadas com valor (amostra de 49, `rg -o '`[A-Z][A-Z0-9_]{3,}`\s*(=|\()?\s*[0-9]'` sobre `docs/manual`)

| Veredito | Constantes |
|---|---|
| **V** (valor idêntico) | `TOTAL_MS` 3000 · `MIN_STEP_MS` 340 · `PLAY_ENERGY_COST` 1 · `MATCHES_PER_DAY` 5 · `GULOSO_BONUS_ATTR` 1 · `DEEP_START_MAX_LEVEL` 5 · `DEEP_START_BASE_COST` 40 · `XP_TRIAGE_CLEARED` 30 · `XP_TOURNAMENT_WIN` 15 · `XP_TOURNAMENT_LOSS` 8 · `XP_REST_NIGHT` 15 · `XP_PER_EFFORT` 10 · `XP_PERFECT_DAY` 50 · `XP_NIGHTMARE_CLEARED` 10 · `XP_NEW_DREAM` 25 · `XP_DUNGEON_RUN` 60 · `XP_DUNGEON_FLOOR` 10 · `XP_CHECK_IN` 10 · `WEEKLY_MISSION_COUNT` 3 · `ULTRA_PATIENCE_DAYS` 45 · `TOLERANCIA_LU` 1.0 · `STRUGGLE_ECHO_MAX` 80 · `STRIP_HEIGHT` 72 · `STEPS_POLL_MS` 5 min · `STEADY_WINDOW_DAYS` 28 · `STAGE_HEIGHT` 250 · `SPRITE_SRC_PX` 256 · `SPRITE_SCALE` 2 · `SPEND_TTL_SECONDS` 24 h · `SPECIAL_CHARGE_TURNS` 3 · `SLEEP_REMINDER_LEAD_MIN` 30 · `SEASON_DREAM_WEIGHT` 3 · `ROUND_LENGTH_DAYS` 3 · `REVEAL_WAIT_MS` 12 000 · `RETENTION_TTL_SECONDS` 5 anos · `REROLL_COST_CREDITS` 50 · `REBIRTH_CRIATURA_MAX` 60 · `RARITY_RARE_AT` 0.5 · `RARITY_MIN_NIGHTS` 3 · `RARITY_LEGENDARY_AT` 0.8 · `RANK_WINDOW` 3 · `QUIZ_END` 12 (= `QUIZ_START + 6`) · `PUSH_HOURS_BRT` [10,16,22] · `PRIMING_MIN_HOURS_AFTER_DISMISS` 24 · `PRIMING_MIN_DAYS` 2 · `PRIMING_MAX_DAYS` 3 · `XP_THRESHOLDS` 600/1000/1500/2300 · `REBIRTH_BUDGET_MULTIPLIER` 1.5 · `POSTPONE_NUDGE_AT` 3 |
| **V com forma diferente** | `ROUND_CLEAR_HEAL` — doc "(30%)", código `0.3` (`rg -n "ROUND_CLEAR_HEAL =" src/utils/arena.ts`). Correto, mas o leitor que "corrige" para `30` quebra a Arena |
| **V (contagem)** | `07-DADOS-E-SAVE` §4: "44 em `STORAGE_KEYS` + 2 em `RECONCILE_KEYS` = 46" — script node sobre `src/utils/storageKeys.ts` → 44 + 2 ✓ (o doc diz "contagem de 09/09/2026", e ainda bate) |

Nenhuma das 49 mudou de valor. O manual está bem melhor que o `CLAUDE.md` neste quesito.

---

## 3. `docs/STATUS.md` (3470 linhas)

### 3.1 Lápides ⚰️

`rg -c "⚰️" docs/STATUS.md` = **6** (não há 15 para amostrar; o doc usa "lápide"/"saiu em"/"fechada em" em prosa — 88 ocorrências, sem marcador uniforme).

| Local (âncora) | Lápide | Verificação | Veredito |
|---|---|---|---|
| bloco 21/09 "sincronização pós-merge" | "o bloco da 4ª rodada afirmava que o `CLAUDE.md` ainda diz S1..S13: falso desde `15164e4c`. Ganhou ⚰️" | `rg -n "S1\.\.S16" CLAUDE.md` → 2 ocorrências, 0 de "S1..S13" | V |
| idem (segunda ocorrência) | "⚰️ fechada em `15164e4c` — `CLAUDE.md` › Áudio diz S1..S16, cinco arquivos" | os 5 = `sounds.ts`, `sonsAssets.ts`, `trilha.ts`, `audioBus.ts`, `loudness.ts` — `ls src/utils/` | V |
| bloco som "o dono ainda não ouviu" | "⚰️ (mesmo dia) 'o loop perde ~48 ms' e 'só a camada…'" | afirmação sobre texto anterior do próprio STATUS; sem comando possível | S/C |
| bloco manual §59 | "a metade 'S1..S13' ⚰️ fechada em `15164e4c`" | idem primeira linha | V |
| canvas Loja (L2) | "Coraçãozinho fora com nota ⚰️ (L2)" | `SHOP_ITEMS` sem `kind:'heart'` (ver §1.1 #2) — **o STATUS acerta, o `CLAUDE.md` erra** | V |
| "7. ⚰️ Código morto para decidir apagar" | `LanguageContext`/`translations` (nunca montados), `PixelFrame`, `figma/ImageWithFallback`, `CareSystem.scheduleCareEvents`, `handleEvolveToUnlocked`, `XP_THRESHOLDS→nextLevelXP`, `attributesSinceLastEvolution`; `OraclePage` e `PixelizerCard` inalcançáveis | `rg -n "LanguageProvider" src -g '!*.test.*'` → só o próprio arquivo ✓ · `src/utils/translations.ts` **não existe mais** (`ls`) — parcialmente já apagado · `<PixelFrame` em `App.tsx` é só comentário-lápide ✓ · `handleEvolveToUnlocked` definido e nunca chamado ✓ · `nextLevelXP` **é** passado ao `CompanionHUD` (`rg -n "nextLevelXP=" src/App.tsx`) — não é morto · `OraclePage`: `currentView === 'oracle'` renderiza, mas nenhum `setCurrentView('oracle')` existe (`rg -n "'oracle'\)" src`) ✓ | **Parcial** — a lápide está meio quitada (`translations.ts` sumiu) e um item (`nextLevelXP`) não é código morto |

### 3.2 "## 2. Estado do produto" — linha a linha

| Linha | Verificação | Veredito |
|---|---|---|
| Reskin + tema: `ThemeContext.tsx`, "persistido em `digiapp-theme`" | `rg -n "THEME:" src/utils/storageKeys.ts` → `'soulmon-theme'` | **D** (prefixo trocado em 07/09) |
| "~15 telas migraram; secundárias ainda têm cor fixa e migram depois" | Fase 2 fechou 14 canvases (memória + `00-MAPA.md` §design) | **D** — descreve ago/2026 |
| Auditoria de tom, check-up com personas, notificações, auditoria 4 achados, limpeza de órfãos, bug do `completeTask` | fatos históricos com commit; `ACTIVITY_LOG_CAP = 90` em `src/App.tsx` ✓; `computeDailyReset` ✓ | V (registro) |
| Fases 1–4 do plano: "Abertos só o modo cooperativo (precisa de backend novo)" | `00-MAPA.md`: "PLANO-COOP.md — implementado em 07/09/2026"; `functions/api/community.js` existe | **D** — o coop já saiu |
| Palco: "Falta só a arte de verdade (hoje são emoji)" | `ls src/assets/decor` existe (SQUAD-ARTE rodada 1, 15/09); `ShopItem.emoji` ainda é campo obrigatório | **Parcial/D** — há arte instalada; a linha não foi tocada |
| Torneio: 8 itens, escada 8/12/…/70, "`utils/shop.ts:359`" | escada ✓; `TOURNAMENT_ITEMS` hoje na 365 | V no fato, **R1** na forma (e o número já escorregou) |
| "Compra dentro do jogo — `UnlockAccountModal` nos **dois** momentos" | `rg -rn "<UnlockNudge" src \| wc -l` = 6 | **D** (o `CLAUDE.md` já diz seis) |
| Desktop: 4 ações de cuidado, `care.ts` importa do app, saveId sob paridade | `rg -n "from '../../../src/utils" desktop/renderer/src/care.ts`; `functions/api/saveId.parity.test.js` existe | V |
| "Separação do DigiApp — limpeza de herança morta já feita" | ✓ (07/09) | V |

### 3.3 Outras afirmações do STATUS que apodreceram

- §3.2 Lançamento: "**Comentário mentiroso encontrado e NÃO consertado**: `desktop/renderer/src/config.ts:3` diz 'A URL ainda aponta pro Pages herdado'" — **já consertado**: o cabeçalho de `config.ts` hoje é uma lápide que explica a frase falsa (`sed -n 1,20p desktop/renderer/src/config.ts`). A linha do STATUS continua aberta como 🐛. → **D**.
- Cita `src/utils/iconRegistry.ts` — arquivo não existe (`ls`); também citado em `docs/INVENTARIO-TELAS.md`.
- Cita `src/supabase/.../chat.tsx` — a árvore `src/supabase/` não existe mais (removida em 09/09; a lápide é o bloco do `CLAUDE.md` sobre o `ChatBox`).

---

## 4. Docs da raiz — vivo ou fóssil

| Arquivo | Último commit (`git log -1 --date=short -- <f>`) | Estado | O que mente |
|---|---|---|---|
| `README.md` (10 linhas) | `12cb739a` 08/03/2026 | **fóssil** | "DigiApp Design Prototype", link do Figma do fork, só `npm i`/`npm run dev`. Zero menção a Soulmon, Capacitor, Pages, testes. É o primeiro arquivo que o GitHub mostra. `00-MAPA.md` já o marca com ⚠️ |
| `docs/00-START-HERE.md` | `80587d11` 10/09/2026 | **vivo** | nada — é um redirecionador de 51 linhas para `CLAUDE.md` → `STATUS.md` → `00-MAPA.md`, com lápide do original DigiApp. Guard `docsSemMentira.contract.test.ts` cobre |
| `PWA-SETUP.md` / `PWA-CHECKLIST.md` | `955984c2` 11/02/2026 | **fósseis** | "DigiApp PWA", theme `#2bff95` (verde-menta — paleta atual é teal/cobre), pedem converter `icon-template.svg` (não existe em `public/` — `ls public/icon-template.svg` falha) e listam "Service Worker (opcional)" como pendente — `public/sw.js` está em v155. Checklist "⚠️ Pendente" inteiro é falso |
| `PROJETO.md` (398 linhas) | `1f5d5895` 07/09/2026 (só o toque de rename) | **fóssil com verniz** | "DigiApp — Especificações", "Documento gerado em 2026-06-25", pet chamado "DigiMon", storage `DIGIAPP_SAVES` como canônico, "Cloud save: Supabase" (o cloud save é KV via `functions/api/save.js`; Supabase é só transcrição). Sem lápide no topo — um agente que abra pelo nome lê como spec atual |
| `PLANO_MELHORIAS.md` (108 linhas) | `869d3b26` 17/06/2026 | **fóssil** | branch `claude/digiapp-code-improvements-q44ol2` (o `CLAUDE.md` diz que essa família de branch não existe aqui), módulos MOD-01…; não confundir com `docs/PLANO-MELHORIAS.md` (vivo) — homônimo com `_` vs `-` |

Os quatro fósseis da raiz já estão etiquetados no `00-MAPA.md` (§ "fora de `docs/`") como "DigiApp"/"não ler". O que falta é uma lápide **no topo de cada um** (hoje só `00-START-HERE` tem) ou movê-los para `docs/historico-digiapp/` como os outros sete. `README.md` merece tratamento à parte: é a cara pública do repo.

---

## 5. Comentários de código apontados como mentirosos no STATUS

| Comentário | Onde | Verificação | Veredito |
|---|---|---|---|
| "a frase é idêntica no 2º e no 40º dia" (`contextBlock`, `functions/api/chat.js`) | dentro do `if (ctx.daysAway >= 1)` | `rg -n "absenceBucket" src/utils/welcomeBack.ts` → a saudação é por **faixa** (`LINES[absenceBucket(days)]`); `REGISTRO-DE-DECISOES.md` §14.3: "as faixas ficam; a alternativa que perdeu: frase idêntica em 2 e em 40 dias" | **Confirmado mentiroso** — o comentário afirma como regra vigente exatamente a alternativa que o dono rejeitou |
| Cabeçalho de `src/utils/welcomeBack.ts`: "colapsar as faixas… está registrado como **pendência** em `docs/STATUS.md` e na proposta P2" | bloco "⚠️ O QUE NÃO MUDOU" | §14.3 do REGISTRO decidiu em 21/09: faixas ficam | **Confirmado desatualizado** — não é pendência, é decisão fechada |
| `CONTEXT_SCHEMA.bond` (`functions/api/chat.js`) | `bond: { min: 1, max: 31 }` | cliente manda (`rg -n "bond:" src/components/CompanionHUD.tsx`); servidor **nunca lê**: `rg -n "ctx\.bond\|\.bond\b" functions/api/chat.js` → 0 fora do schema | **Confirmado campo morto** — validado, sanitizado, descartado |
| `desktop/renderer/src/config.ts` "Pages herdado" | cabeçalho | já é lápide ("Este comentário AFIRMAVA… Era falso") | **Consertado** — quem mente agora é o STATUS §3.2 que o lista como aberto |

---

## 6. Links e guards

### 6.1 Guards (`npx vitest run src/docsManual.contract.test.ts src/docsSemMentira.contract.test.ts`)

```
 RUN  v4.1.9 D:/Soulmon/repo
 Test Files  2 passed (2)
      Tests  10 passed (10)
   Duration  473ms
```

### 6.2 Links relativos `[texto](caminho#âncora)` em `docs/**/*.md` FORA de `manual/` e `historico-digiapp/`

Script: `scratchpad/links.mjs` (resolve caminho relativo ao doc, confere existência e âncora por slug de `^#`).

```
arquivos 122 · links relativos 24 · quebrados 0
```

Só 24 links markdown em 122 arquivos — os docs citam por crase, não por link. Por isso a segunda varredura:

### 6.3 Caminhos em crase `` `src/...ext` `` que não existem (script `scratchpad/paths.mjs`, `CLAUDE.md` + `docs/*.md`)

| Doc | Caminho citado | Situação |
|---|---|---|
| `CLAUDE.md` | `android/.../widget/WidgetRenderer.kt` | reticências — existe em `android/app/src/main/java/com/hexervoodoom/soulmon/widget/` |
| `docs/STATUS.md` | `src/utils/iconRegistry.ts` · `src/supabase/.../chat.tsx` | não existem (o segundo foi removido em 09/09) |
| `docs/INVENTARIO-TELAS.md` | `src/utils/iconRegistry.ts` | não existe (registro de 19/08) |
| `docs/AUDITORIA-ALINHAMENTO.md`, `docs/SEPARACAO-DIGIAPP.md` | `src/supabase/functions/server/chat.tsx` | removido — registro, sem lápide no ponto |
| `docs/Attributions.md` | `src/types/evolution-lines.ts` | apagado (é o próprio assunto do doc; falta dizer "apagado em") |
| `docs/PENDENCIAS-ARTE-UI-HIGGSFIELD.md` | `docs/MASCOTE-PRINCIPAL.md` | **doc inexistente** |
| `docs/PLANO-COOP.md` | `functions/api/coop.js` | plano; o implementado chama-se `community.js` (o MAPA anota a diferença) |
| `docs/PLANO-DESIGN.md` | `src/components/SmIcon.tsx` · `src/dev/OraclePage.tsx` | plano não executado (`OraclePage` continua em `src/components/`) |
| `docs/PLANO-DESKTOP-STEAM.md` | `desktop/renderer/src/auth.ts` | o próprio doc já corrige na linha seguinte (é `src/utils/auth.ts`) |
| `docs/PLANO-MELHORIAS.md` | `src/utils/motion.ts` · `src/utils/pushCopy.ts` | WPs ainda não executados |

Nenhum guard cobre crase-caminho fora do manual (o `docsManual.contract.test.ts` só vê `docs/manual/`).

---

## Resumo executivo

1. `CLAUDE.md` tem **7 afirmações falsas/apodrecidas com dano real**: Coraçãozinho "à venda por 150" (2×), "cura instantânea (10) em Créditos", canal `digiapp_push`, `DigiWidgetPlugin`, `canPvp`, tabela `DÍVIDA`. Três delas o próprio arquivo contradiz em outra seção.
2. Duas referências `arquivo:linha` no `CLAUDE.md` (`restWindow.ts:371`, `progression.ts:14`) violam a regra que o arquivo repete cinco vezes — e a primeira já escorregou (374).
3. "17 documentos" → 18; "280 nunca 440" é ambíguo (o modal ainda é 440, o convite é 280); "44 pontos" não tem lista nem comando.
4. As ~50 constantes numéricas do `CLAUDE.md` e as 49 amostradas no manual **batem todas** com o código. O apodrecimento está em NOMES e em REGRAS que mudaram (loja, créditos, Android), não em números.
5. Manual: cabeçalhos completos, mas `Data`/`Estado` não têm guard; três docs carimbados em 10/09 não foram retocados desde então.
6. STATUS §2 tem 5 linhas desatualizadas (`digiapp-theme`, coop "aberto", "dois momentos", arte de decoração, `shop.ts:359`) e lista como 🐛 aberto um comentário (`config.ts`) já consertado.
7. Os 4 comentários de código denunciados estão confirmados: `chat.js` afirma a alternativa que o dono rejeitou; `welcomeBack.ts` chama de pendência o que §14.3 fechou; `CONTEXT_SCHEMA.bond` é validado e nunca lido; `config.ts` já virou lápide.
8. Raiz: `README.md`, `PWA-*.md`, `PROJETO.md`, `PLANO_MELHORIAS.md` são fósseis DigiApp sem lápide no topo; só `docs/00-START-HERE.md` está vivo.
9. Guards verdes (10/10); 0 links markdown quebrados fora do manual — mas 12 caminhos em crase apontam para arquivos inexistentes, e nenhum guard vê crase fora de `docs/manual/`.
10. Nada foi editado. Correções triviais (nomes de símbolo, canal, plugin, `:linha`) cabem ao dono do `CLAUDE.md`; as de sentido (loja/créditos, 280/440, bloco dos 44 pontos) precisam de decisão.
