# 02 — Inventário de código sem dono / sem régua / sem doc (Explore, 21/09/2026)

Repo `D:\Soulmon\repo`, branch `qa/varredura-geral-2026-09-21` (`212da7d5`). Somente leitura. "Teste" = algum `*.test.*` que importa/lê o arquivo; "ref" = citado em `docs/manual/06-REFERENCIA/*.md` ou `docs/manual/00-MAPA.md`. O agente rodou sem ferramenta de escrita; o coordenador gravou o texto tal qual.

## 1. Arquivos não-teste sem teste e/ou sem doc de referência

Universo: 380 arquivos não-teste em `src/{components,utils,hooks,contexts,plugins,types,styles,constants,supabase,translations}`, `src/App.tsx`, `src/main.tsx`, `functions/`, `workers/`, `desktop/electron`, `desktop/renderer/src`, `scripts/`, `tools/`, `public/`, `android/app/src`.

### 1.1 SEM teste E SEM ref (o núcleo "sem dono")

| Caminho | Símbolo/papel | Observação |
|---|---|---|
| `public/.well-known/assetlinks.json` | Digital Asset Links estático | duplica `functions/.well-known/assetlinks.json.js` (esse tem `assetlinks.test.js`); com `assets.directory=./dist` o estático ganha do dinâmico — ninguém documenta qual vale |
| `scripts/aventura-desenhar.mjs`, `debackground-lines.mjs`, `dechecker.mjs`, `decor-desenhar.mjs`, `decor-para-caixa.mjs`, `fatiar-folha.mjs`, `finalize-oracle-sprites.sh`, `gen-decor-remaining.sh`, `gen-decor.mjs`, `gen-line-from-oracle.sh`, `gen-line.sh`, `gen-soulmon-lines.mjs`, `gen-soulmon-placeholders.mjs`, `gen-ui-assets.sh`, `process-line-sprites.sh`, `simulate-oracle-lines.ts` | pipeline de arte | 0 teste, 0 manual, fora do `package.json` |
| `scripts/convert-to-webp.mjs` | passo do `npm run build` | sem teste, 1 citação no manual |
| `scripts/gen-cascata-fixtures.mjs`, `orcamento-de-tempo.mjs` | scripts do `package.json` | 0 teste |
| `scripts/gerar-vapid.mjs`, `mutation-sweep.mjs` | citados por testes | 0 manual |
| `scripts/validate_squad.py`, `docs-delta.d.mts`, `docs-inventario.d.mts` | extras | `.d.mts` 0 citações em docs |
| `tools/metrics-read.mjs` | leitor de métricas | 0 teste; citado só por stem em `api-workers.md` |
| `src/supabase/functions/server/{index,kv_store,transcribe}.tsx` | Edge Function herdada | excluída do `tsconfig`, nenhum `src/` importa; só lida como texto por `security/supabase.contract.test.ts` e `chat.promptInjection.test.js`; 0 ref em 06-REFERENCIA |
| `android/.../MainActivity.java`, `notifications/BootReceiver.kt`, `plugins/BillingPlugin.kt`, `widget/SoulmonWidget{,Chat,Pet,Screen,Vertical}Provider.kt`, `widget/WidgetRefreshWorker.kt` | Kotlin/Java de produção | 0 teste, 0 ref em 06-REFERENCIA |
| `android/app/src/main/res/layout/widget_soulmon*.xml` (5), `res/xml/backup_rules.xml`, `res/xml/data_extraction_rules.xml`, `res/xml/file_paths.xml`, `android/variables.gradle` | recursos Android | `backup_rules`/`data_extraction_rules` com 0 citações em `docs/` inteiro |
| `android/app/src/{test,androidTest}/java/com/getcapacitor/myapp/Example*Test.java` | boilerplate Capacitor | package `com.getcapacitor.myapp` ≠ `com.hexervoodoom.soulmon` |

### 1.2 SEM teste, COM ref (documentado, sem régua)

`src/components`: `AccountSection`, `AlignmentIcons`, `ConfirmDialog`, `ContentModals`, `ErrorBoundary`, `EvolutionCeremony`, `FirstTaskCompletedPopup`, `GamePopups`, `NewReadingModal`, `OraclePage`, `PetStageDecor`, `PixelFrame`, `PixelizerCard`, `RebirthModal`, `RestWindowCard`, `SoulTestItem`, `StepsCard`, `TaskEditModal`, `WeeklyReportCard`, `figma/ImageWithFallback`, `form/FormKit`, `nestArt.ts`, `pixel/SpriteAnim`, `ritual/RitualKit`, `ui/MiniGlass`, `ui/NavGlyphs`, `ui/OfflineSeal`, `ui/ScreenSkeleton` (28 de 121 componentes = 23 %).
`src/utils`: `adventureArt`, `aiClient`, `dayKeyLabel`, `dungeonScenes`, `elementIconArt`, `fxArt`, `notifications`, `placeholderArt`, `playBilling`, `tzOffset`, `soulProfile/astrology/prominence`, `soulProfile/ficha/realEngine`, `soulProfile/personality/labels`, `soulProfile/ritualAnswers`.
Outros: `src/hooks/useItemForm.ts`, `src/plugins/SoulmonAlarmPlugin.ts`, `src/plugins/SoulmonWidgetPlugin.ts`, `src/types/category-icons.ts`, `src/constants/labels.ts`, `desktop/electron/preload.js`, `public/PWA-CHECKLIST.md`, `public/PWA-SETUP.md`.

### 1.3 COM teste, SEM ref

`src/utils/soulProfile/bestiary/pool.json`, `ficha/cascata.fixtures.json`, `ficha/classSystem.data.json`, `functions/.well-known/assetlinks.json.js`, `tools/metricsReport.mjs`.

## 2. Exports nunca importados

22 mortos de verdade (definição é a única ocorrência): `FormKit.tsx` › `FieldWarn` · `NavGlyphs.tsx` › `GLYPH_NAMES` · `figma/ImageWithFallback.tsx` › `ImageWithFallback` (módulo inteiro) · `gainArt.ts` › `MOVE_ART` · `GameTutorialFlow.tsx` › `SHOP_AND_CURRENCY_PRIMER` · `sigilArt.ts` › `SIGIL_COUNT` · `sonsAssets.ts` › `TRILHA_BASE`, `esquecerAssets` · `steps.ts` › `__resetStepsRuntime` · `trilha.ts` › `camadasTocando`, `trilhaTocando` · `notifications.ts` › `clearScheduledNotifications`, `removeScheduledNotification` · `i18n.ts` › `getLanguageFlag` · `community.ts` › `getSeasonResult` · `habitRhythm.ts` › `habitTierIcon` · `prominence.ts` › `neutralProminence` · `nightmares.ts` › `nightmareRegularity` · `telemetry.ts` › `pendingWeekLedger` · `serverConfig.ts` › `resetServerConfigCache` · `dungeonScenes.ts` › `sceneForFloor` · `CareSystem.tsx` › `scheduleCareEvents`.

Mais 69 exports usados só internamente (supérfluos, não mortos).

Módulos inteiros nunca importados por código não-teste: `PixelFrame.tsx`, `PlayCard.tsx`, `figma/ImageWithFallback.tsx`, `contexts/LanguageContext.tsx`, `utils/elementIconArt.ts`.

`SettingsModal`: montado em `App.tsx` via `lazy()`; o único setter é `handleOpenAISettings` → `CompanionHUD` → `ChatBox`, onde a prop `onOpenAISettings` é destruturada e **nunca chamada**. Sem gatilho vivo.

## 3. TODO/FIXME e pendências em código

Marcador real: 1 — `pixel/HomeHud.tsx` › `TODO(Vínculo)`. Pendências abertas: `telemetry.ts` › `TELEMETRY_CREATE_PATH` (teto do demo), `TournamentPage.tsx` (copy do redator). Já resolvidas mas ainda escritas: `chat.js` (SAFETY "depende do dono"), `desktop/renderer/src/style.css` (glifos "pendentes"), `ChatBox.tsx` (contradição interna sobre diretório).

## 4. Comentários que a linha seguinte desmente

| Caminho | Símbolo | Diz | Realidade |
|---|---|---|---|
| `desktop/renderer/src/cloudSync.ts` | cabeçalho | `LEGACY_FORM_TIERS` ainda existe | apagada em 07/09/2026 |
| `functions/api/chat.js` | cláusula SAFETY | "DEPENDE DO DONO" | `ChatBox.tsx` › `sm2-chat-support` existe desde 21/09 |
| `desktop/renderer/src/style.css` | `.fx .ico` | glifos pendentes | `glyph-food-32.png`/`glyph-sleep-32.png` existem e são importados em `main.ts` |
| `src/utils/adventure.ts` | `AdventureFind.emoji` | "emoji por enquanto" | `adventureArt.ts` › `ADVENTURE_ART` já é consumido |
| `index.html` | anti-flash de tema | lia `digiapp-theme` | app usa `soulmon-theme` — **corrigido nesta rodada** |
| manual / `CLAUDE.md` | "dist/ 481 arquivos" | `git ls-files dist \| wc -l` = 3016 |

## 5. Vestígios DigiApp/Bandai

60 linhas em código-fonte, 180 sem testes, 391 no repo fora de `docs/`. Funcionais: `wrangler.jsonc` › `DIGIAPP_SAVES`; `_kv.js`/`_bond.js`/`save.js`/`account.js` fallback; `workers/wrangler.toml` › `name = "digiapp-push-scheduler"`; `public/sw.js` limpa prefixo `digiapp-` (intencional); `storageKeys.ts` › `migrateLegacyStorageKeys` (intencional); chave i18n `digivolve`; `public/index.html.example` servido com título DigiApp; `android/app/google-services.json`. `LEGACY_FORM_TIERS`: 0 definições. Os "44 pontos" do STATUS não batem com nenhuma contagem.

## 6. Arquivos/pastas que ninguém referencia

Raiz `D:\Soulmon`: `_img_server.mjs`, `prompts/` (14), `skills-lock.json` — 0 refs; `wt-gerar-logo-app/` é worktree vivo; repos irmãos `Besti-rio-`, `Class-System` (dependência do build), `scripts-arte`; `_gemini_out/` (1882), `brand-archive/` (69).

Dentro do repo: branch `_teste-merge` e `feat/tetos-cuidado-no-save` já mergeadas; `index.html.example`, `browserconfig.xml`, `PWA-*.md` na raiz são cópias byte-idênticas de `public/`; `manifest.json` (raiz) diverge do de `public/`; `manifest.webmanifest`, `registerSW.js`, `icon-template.svg`, `screenshots/` (raiz) não são carregados por nada; `state/soulmon-01.json` gitignored; `android/build_log.txt` commitado; `dist/` com 3016 arquivos rastreados.
