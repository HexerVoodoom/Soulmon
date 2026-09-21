# 15 — Superfícies secundárias (desktop · android · workers · CI · i18n)

Auditoria somente leitura em `D:\Soulmon\repo` @ `212da7d5` (21/09/2026). Rodei só `npx tsc --noEmit` em `desktop/` (exit 0, ~5s) e comandos de leitura. Nenhum build, nenhuma suíte inteira.

Regra: `caminho` + SÍMBOLO; números vêm com o comando que os produziu.

---

## A) `desktop/` — overlay Electron (Windows)

### Estrutura e o que faz
- `desktop/electron/main.js` — processo principal: faixa transparente click-through (`STRIP_HEIGHT=72`, `PET_SIZE=64`), janela de menu (`MENU_CARD` 340×520), janela do app web completo (`fullAppWin`, `FULL_APP_URL`), tray, auto-update (`electron-updater`), guarda o token de login só em memória (`authSession`).
- `desktop/electron/navigationPolicy.js` — `appOrigin`, `decideNavigation`, `decideWindowOpen`, `isTrustedAuthSender` (decisão extraída para ser testável; `main.js` não é importável por teste).
- `desktop/electron/updatePolicy.js` — `shouldAutoUpdate` (build Steam desliga auto-update).
- `desktop/electron/preload.js` / `auth-preload.js` — ponte `window.soulmonDesktop` (overlay) e `window.soulmonDesktopAuth.publish` (só canal de SAÍDA na janela do app web).
- `desktop/renderer/src/` — `care.ts` (importa regras de `src/utils/`, não copia), `cloudSync.ts` (`pushCareAction` relê o save antes de gravar; KV last-write-wins), `state.ts`, `sprites.ts`, `phrases.ts`, `main.ts` (pet andando), `menu.ts` (painéis), `tokens.css`.

### Testes — 11 arquivos
`find desktop -name "*.test.*" -not -path "*/node_modules/*"` → 11:
`authBridge`, `care.banhoSono.parity`, `care.feed.parity`, `care.parity`, `cloudSync.snapshot`, `cloudSync`, `formatLastSync`, `navigationPolicy`, `pushCareAction`, `sprites.parity`, `updatePolicy`.
- Entram na suíte raiz por `vitest.config.ts` (`'desktop/renderer/**/*.test.ts'` no `include`) → rodam no `ci.yml`.
- **Não existe teste de `main.js`** (janela, IPC `set-interactive`, tray, `autoUpdater`) — documentado no próprio arquivo ("nao e importavel por teste nenhum"). `menu.ts` (render dos painéis, `labelTitlebar`, `statusLine`) e `main.ts` (caminhada, balão) também **não têm teste**.

### Ponto cego documentado: `authBridge exp:0`
- `desktop/electron/auth-preload.js` `publish` → `exp: Number(payload.expiresAt) || 0`. Se `src/utils/auth.ts` mandar `Date.parse(...)` = `NaN`, vira `0`.
- `desktop/electron/main.js` (getter da sessão): `if (authSession.exp && Date.now() >= authSession.exp - 30_000) return null;` → `exp === 0` = **"nunca expira"**: o overlay entrega para sempre um ID token do Firebase que na prática morre em ~1h; o `/api/save` passa a responder 401 e o overlay não sabe que precisa relogar.
- `desktop/renderer/src/authBridge.test.ts` (`describe 'validade do token — o ponto cego desta ponte'`) **reproduz a regra como predicado e afirma o defeito** ("está documentado, não consertado"). O teste **trava o bug**, não o conserta. Conserto barato: tratar `exp <= 0` como expirado (ou derivar `exp` do claim `exp` do próprio JWT) em `main.js` e inverter o `expect` do teste.

### `author` em `desktop/package.json`
**Não está vazio**: `"author": "HexerVoodoom"`. A premissa da tarefa está desatualizada. O que falta de verdade no bloco `build`: `win.publisherName`/assinatura de código (`CSC_IDENTITY_AUTO_DISCOVERY: 'false'` no release) — o instalador sai **sem assinatura** → SmartScreen avisa "editor desconhecido" para todo usuário. Registrado em `desktop/STEAM.md` ("no signing info identified").

### Comentário mentiroso
- `desktop/renderer/src/config.ts` — **já foi corrigido**: o comentário atual é uma lápide explicando que "ainda aponta pro Pages herdado do DigiApp" ERA falsa; `APP_URL = 'https://soulmon.mateus-sprnd.workers.dev'`.
- **A mentira sobreviveu em outro lugar**: `desktop/electron/main.js`, acima de `FULL_APP_URL`: `// URL do app web completo. Ainda aponta pro Pages compartilhado — trocar junto com capacitor.config.json quando o domínio próprio existir`. A linha logo abaixo é `soulmon.mateus-sprnd.workers.dev`. O `docs/STATUS.md` §3.2 (linha 🐛 "Comentário mentiroso encontrado e NÃO consertado") aponta para `config.ts:3` — **o STATUS também está defasado**: o defeito migrou de arquivo.
- `src/deploy/appUrl.contract.test.ts` trava o VALOR nas fontes, não o comentário.

### Dependências (`desktop/package.json` + `desktop/package-lock.json`)
| pacote | declarado | lock | observação |
|---|---|---|---|
| `electron` | `^33.2.0` | **33.4.11** | Electron 33 saiu da janela de suporte quando o 36 foi lançado (abril/2025). Sem patches de Chromium/Node desde então — ~17 meses sem correção de segurança no runtime que carrega uma página remota (`fullAppWin.loadURL`). Não listo CVE por número: não tenho certeza de quais afetam exatamente o 33.4.11. A afirmação segura é "fora de suporte, sem backport". |
| `electron-updater` | `^6.3.9` | 6.8.9 | ok. |
| `electron-builder` | `^25.1.8` | 25.1.8 | ok. |
| `vite` | `6.3.5` (fixo) | 6.3.5 | ok. |
| `typescript` | `^5.6.3` | — | ok. |

`npm audit` não rodado. O que checar: `cd desktop && npm audit` e `npm audit --omit=dev`.

### CI do desktop
- `.github/workflows/desktop-build.yml` — gatilho: `push` na `main` com `paths` em `desktop/**`, `src/utils/sprites.ts`, `src/assets/**`, o próprio yml; e `workflow_dispatch`. `windows-latest`: `npm ci` raiz + `npm ci` em `desktop/`, `npx tsc --noEmit`, `npm run dist -- --publish never`, sobe `desktop/release/*.exe` (30 dias). `permissions: contents: read`.
  - **NÃO roda vitest do desktop** (os 11 testes só rodam no `ci.yml`, em ubuntu). **NÃO roda smoke** (abrir o exe). Não assina.
  - Armadilha de `paths`: mudança em `src/utils/careRules.ts`/`careUpdaters.ts`/`cloudSave.ts` (que o renderer importa) **não dispara** este workflow — só o `ci.yml` (tsc) pega.
- `.github/workflows/desktop-release.yml` — gatilho: tag `v[0-9]+.[0-9]+.[0-9]+`. Confere tag == `desktop/package.json` `version`, `npm ci`, `tsc`, `npm run dist:publish` (GitHub Release, fonte do auto-update), artefato 90 dias. `permissions: contents: write`; secret: só `GITHUB_TOKEN`. `CSC_IDENTITY_AUTO_DISCOVERY=false` → sem assinatura.
  - A tag é do repositório inteiro (`vX.Y.Z`) mas valida contra `desktop/package.json` (`0.1.0`), não contra o `package.json` da raiz nem `versionName "1.1.3"` do Android — taggear a versão do APK falha o release do desktop. Sem teste.
  - Não roda vitest antes de publicar.

### O que nunca foi analisado no desktop
- `main.js` de ponta a ponta (IPC, tray, `autoUpdater` `autoInstallOnAppQuit`) — sem teste, sem smoke.
- Múltiplos monitores / DPI ≠ 100% (a faixa é ancorada por `screen`).
- O que acontece quando `/api/save` responde 401 por token expirado — nenhum teste de `cloudSync.ts` cobre 401.
- Tamanho do instalador (274 MB `win-unpacked`, exe 188 MB, `STEAM.md`) vs. condição real — nunca tratado como problema.
- Renderer em tema claro (`tokens.css` `prefers-color-scheme: light`) — sem screenshot/teste.
- Auto-update de verdade (uma versão publicada atualizando outra) — nunca exercitado (`STEAM.md`: `dist:steam` rodou uma vez; `git tag -l` local vazio).

---

## B) `android/` — Capacitor 8.4

### Plugins: declarados vs. usados
`package.json`: `@capacitor/android`, `@capacitor/cli`, `@capacitor/core` (^8.4.0), `@capacitor/push-notifications` (^8.1.1), `@capgo/capacitor-pedometer` (^8.0.38).
`capacitor.config.json`: só `appId`, `appName`, `webDir`, `server.url` (o APK carrega o site remoto — **não é o `dist/` empacotado**; `webDir` só satisfaz o `cap sync`). Nenhuma config de plugin.

Nativos (registrados em `MainActivity.java` `onCreate`): `SoulmonWidgetPlugin` (`updateWidgetData`), `SoulmonAlarmPlugin` (`scheduleAlarm`, `cancelAlarm`), `BillingPlugin` (`purchase`, `getLocalizedPrice`, `consume`, `getPurchases`).
Lado JS: `src/plugins/SoulmonWidgetPlugin.ts` (`registerPlugin('SoulmonWidget')`), `src/plugins/SoulmonAlarmPlugin.ts` (`registerPlugin('SoulmonAlarm')`), `src/utils/playBilling.ts` (`Billing`), `src/utils/notifications.ts` (`PushNotifications`), `src/utils/steps.ts` (pedômetro).
- Todos os declarados têm consumidor.
- Resíduo de nome: `src/plugins/SoulmonWidgetPlugin.ts` exporta `interface DigiWidgetData`; `WidgetRenderer.kt` `PREFS_NAME = "DigiWidgetPrefs"` (este é **congelado de propósito** — renomear quebra widget instalado).
- `BillingPlugin.kt` usa `com.android.billingclient:billing-ktx:6.2.1` (`android/app/build.gradle`). **Verificar antes de publicar**: a política do Play exige Billing Library ≥ 7 para atualizações desde 31/08/2025 e ≥ 8 a partir de 31/08/2026 — com 6.2.1 o upload de um AAB novo é rejeitado. Idem `targetSdkVersion = 35` (`android/variables.gradle`): desde 31/08/2026 o Play pede target 36 para atualizações. Não é quebra de build; é bloqueio na loja.

### Widgets (Kotlin, `android/app/src/main/java/com/hexervoodoom/soulmon/`)
| classe | papel |
|---|---|
| `widget/WidgetRenderer.kt` (`object`, 385 linhas) | Render compartilhado: `renderFull` (A), `renderPet` (C), `renderChat` (D), `renderScreen` (E), `updateAll`, `contextualMessage`, `buildChatPhrases`, `taskCounter`, `attachClick`. Lê `SharedPreferences` `DigiWidgetPrefs`. |
| `widget/SoulmonWidgetProvider.kt` | A — horizontal 180×90: nome, estágio, contador `"$completed/$total"` só com ≥1 feita, frase. |
| `widget/SoulmonWidgetVerticalProvider.kt` | B — vertical: nome, estágio + contador na mesma linha, sem frase. |
| `widget/SoulmonWidgetPetProvider.kt` | C — só sprite + cocô. |
| `widget/SoulmonWidgetChatProvider.kt` | D — sprite + frases girando (`buildChatPhrases`), sem contador. |
| `widget/SoulmonWidgetScreenProvider.kt` | E — corações + energia + sprite. |
| `widget/WidgetRefreshWorker.kt` | `CoroutineWorker` periódico 60 min (`schedule`, `ExistingPeriodicWorkPolicy.KEEP`) → `updateAll`. |
| `plugins/SoulmonWidgetPlugin.kt` | Recebe do JS e grava prefs; chaves congeladas; `-1` = não informado; `habit_tier_max`, `habit_steady`; `constancy_pct`/`shields`/`bond_level` removidos. |
| `notifications/AlarmReceiver.kt` / `BootReceiver.kt` | Alarme local exato (`SCHEDULE_EXACT_ALARM`), canal "Soulmon Alarms"; reagenda em `BOOT_COMPLETED`/`MY_PACKAGE_REPLACED`. |

- **Idioma do widget: só inglês, hardcoded em Kotlin** (`contextualMessage`, `buildChatPhrases`, `stageLabel` "Rookie/Champion/…"). É decisão registrada (REGISTRO 13.18, "o widget não tem idioma"). Nenhum `res/values-pt/`; só `res/values/strings.xml`. Canal de push em `MainActivity.java` é PT ("Notificações do Soulmon") e o de alarme em `AlarmReceiver.kt` é EN ("Alarm notifications for Soulmon tasks") — a tela de canais do Android mostra os dois idiomas misturados.
- Teste: `src/plugins/widgetSemCobranca.contract.test.ts` lê o FONTE de `WidgetRenderer.kt` e `SoulmonWidgetPlugin.kt` como string (sem comentários) e proíbe vocabulário de cobrança ("N tarefas restantes", `"0/"`, traço, `constancy_pct` etc.). Guard de vocabulário, **não** de comportamento — nenhum teste em `node` executa Kotlin, e não há `android/app/src/test` nem `androidTest`.

### `AndroidManifest.xml` — permissões
`INTERNET`, `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `RECEIVE_BOOT_COMPLETED`, `ACTIVITY_RECOGNITION` (pedômetro, justificado em comentário), `RECORD_AUDIO` (recado falado; o comentário liga a `public/privacidade.html` e `docs/PLAY-DATA-SAFETY.md`, guard `src/security/supabase.contract.test.ts`).
- `SCHEDULE_EXACT_ALARM`: desde Android 14 vem negada por padrão; o código precisa checar `canScheduleExactAlarms()` e cair para inexato — **não verifiquei `SoulmonAlarmPlugin.kt` `scheduleAlarmInternal`** (fora do orçamento).
- Backup ligado com `backup_rules.xml`/`data_extraction_rules.xml` excluindo o WebView (PII do perfil).

### Versão
`android/app/build.gradle`: `versionCode 14`, `versionName "1.1.3"`. `minSdk 26`, `compileSdk 35`, `targetSdk 35` (`android/variables.gradle`). Sem bump automático no CI: esquecer `versionCode` = AAB rejeitado no Play.

### `android-build.yml` — assina?
- `push` em `main`/`version-b` + `workflow_dispatch`. `contents: read`. Actions presas por SHA.
- Job `build`: `npm ci` → `npm run build` → Java 21 → SDK → `cap sync` → `./gradlew assembleDebug` (artefato `digiapp-debug-<sha>`, **nome ainda "digiapp"**). Depois, **se** `ANDROID_KEYSTORE_BASE64` existir: restaura `.jks` em `$RUNNER_TEMP`, `bundleRelease` com `-PRELEASE_*` (secrets `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`), artefato `soulmon-release-<sha>`, apaga o keystore com `if: always()`. Sem o secret: "pulando o bundle assinado", exit 0 — **verde sem AAB**.
- Job `smoke`: `continue-on-error: true` — emulador API 35 roda `.github/scripts/apk-smoke.sh`. **Verde mesmo se o smoke quebrar** (evidência só no artefato `apk-smoke-<sha>`).
- Assinatura: só do `.aab` de release e só com secrets. O APK de debug usa a debug key do runner (muda a cada run → dois APKs de CI não se atualizam um ao outro).
- Nenhum `.jks` no git (`git ls-files | grep -i jks` vazio; `android/.gitignore` ignora `*.jks`/`*.keystore`). O histórico com keystores do DigiApp é assunto do `docs/STATUS.md` §3.1.

### Digital Asset Links
`public/.well-known/assetlinks.json` (cópia em `dist/`): `package_name: com.hexervoodoom.soulmon`, 1 fingerprint SHA-256 `F5:10:2B:…:7B:84`. **Não dá para saber de qual chave é** (upload? Play App Signing? debug?) sem o keystore. **Não há `intent-filter` com `autoVerify` no manifesto** — o assetlinks não é consumido por App Links hoje; só serviria para TWA/PWABuilder (resíduo da era DigiApp, `docs/APK-BUILD-INFO.md`).

### Ícones adaptativos
Existem: `res/mipmap-anydpi-v26/ic_launcher.xml` e `ic_launcher_round.xml` (`background @color/ic_launcher_background`, `foreground @mipmap/ic_launcher_foreground`) + `mipmap-{m,h,xh,xxh,xxxh}dpi`. **Sem `<monochrome>`** → ícone temático do Android 13+ cai no fallback. `drawable-v31/` existe e está vazio.

### `google-services.json`
- **O arquivo EXISTE e está versionado**: `android/app/google-services.json` (`git ls-files` retorna). `project_id: digiapp-88296` (projeto Firebase do DigiApp), clients `com.digiapp.app` e `com.digipartner.digiapp` — **nenhum para `com.hexervoodoom.soulmon`**.
- O build **não quebra**: `android/app/build.gradle` faz parse do JSON e só aplica `com.google.gms.google-services` se houver `client` com o `applicationId`; senão `logger.warn(...)` e segue. Consequência: o APK de CI sai **sem FCM** (push remoto morto no Android nativo) sem nada ficar vermelho — só um warning no log do Gradle.
- O STATUS (🔴 "Registrar o pacote no Firebase + baixar `google-services.json`") acerta a pendência, mas "ausente" é impreciso: o que falta é o **client certo**; o arquivo presente é de outro produto e vaza `project_number`/`mobilesdk_app_id` do DigiApp num repo que pode ser público.
- `FIREBASE_PROJECT_ID` do servidor é `soulmon-app` (STATUS §3.1) — o backend valida tokens de um projeto e o `google-services.json` aponta para outro. O client novo tem que nascer em `soulmon-app`.

### O que nunca foi analisado no android
- `SoulmonAlarmPlugin.kt` `scheduleAlarmInternal` frente a `canScheduleExactAlarms()` (Android 14+) e Doze.
- `BillingPlugin.kt` inteiro contra Billing Library 7/8.
- Widget com **save vazio** (app instalado, onboarding não concluído): `-1` → o que cada `render*` desenha.
- Corrida `WidgetRefreshWorker` (60 min) × `updateWidgetData` sob demanda.
- Tema escuro do widget (`widget_bg.xml` único; sem `values-night`).
- `apk-smoke.sh` — o que afirma de fato (não li).
- Tamanho do APK/AAB por versão (nunca medido no CI).

---

## C) `workers/` — push scheduler (Cloudflare Worker)

- `workers/wrangler.toml`: `name = "digiapp-push-scheduler"` (**nome ainda DigiApp** — renomear cria worker novo e perde cron/secrets; decisão do dono), `main = push-scheduler.js`, `compatibility_date = 2024-09-23` (2 anos), crons UTC `0 1 * * *`, `0 13 * * *`, `0 19 * * *` (22h/10h/16h BRT — travados por `workers/pushCopy.parity.test.js` contra `PUSH_HOURS_BRT` de `functions/api/_pushCopy.js`), KV `PUSH_SUBSCRIPTIONS` (`12dd88d3…`), vars `VAPID_PUBLIC_KEY`, `APP_URL`.
- Secrets exigidos (só em comentário do toml): `VAPID_JWK`, `FIREBASE_SERVICE_ACCOUNT`, `SEASON_ADMIN_KEY`. `env.*` lido em `push-scheduler.js`: `PUSH_SUBSCRIPTIONS` (6×), `SEASON_ADMIN_KEY` (2×), `APP_URL` (2×), `VAPID_JWK`, `FIREBASE_SERVICE_ACCOUNT`.
- O que manda: `export default { scheduled }` → varre inscrições (`webpush:*` via `workers/webpush.js`, `fcm:*` via `workers/fcm.js` HTTP v1 com JWT em WebCrypto), escolhe copy por hora/idioma (`_pushCopy.js`), apaga inscrição morta; no cron das 10h BRT do dia 1 chama `POST /api/community?action=closeSeason` (`previousSeasonBrt`).
- Testes (3 arquivos, entram na suíte raiz por `vitest.config.ts`): `push-scheduler.test.js` (quem recebe, idioma, linha FCM apagada, season), `pushCopy.parity.test.js` (crons × horas, copy importada, noite não se contradiz), `vapid.parity.test.js` (chave pública igual nas três cópias). `fcm.js` e `webpush.js` **só cobertos indiretamente** (mockados no scheduler); a assinatura JWT do FCM não tem teste próprio. Typecheck via `tsconfig.server.json` no `ci.yml`.

### Deploy manual e drift
- Nenhum workflow deploya `workers/` (`grep -l wrangler .github/workflows/*` → nenhum). `08-INTEGRACOES-E-DEPLOY.md`: `cd workers && wrangler deploy`.
- `docs/PERGUNTAS-DO-DONO.md`: "push scheduler deployado (`digiapp-push-scheduler`, versão `e90f05a6`)". **`e90f05a6` não é um commit deste repositório** (`git cat-file -t e90f05a6` → "Not a valid object name"; `git log --all` não acha). Provavelmente prefixo do *version id* do Cloudflare — **não permite comparar com o git**.
- HEAD de `workers/`: `git log -1 --format=%h -- workers/` → **`3e758a81`** (20/09 22:43, ícone `ic_notification` + `color` no payload FCM). `08-INTEGRACOES-E-DEPLOY.md` (tabela FCM) afirma que **esse commit NÃO foi deployado**; `PERGUNTAS-DO-DONO.md` (commit `73be1a2f`, 21/09 15:37, posterior) afirma que deployou. **As duas fontes se contradizem** e nenhuma cita SHA do git. O que checar: `cd workers && npx wrangler deployments list` (version id + data) e comparar com 20/09 22:43; ou `wrangler versions view <id>`.
- Secrets no ar não são verificáveis pelo repo: `npx wrangler secret list` em `workers/` — o STATUS ainda lista `SEASON_ADMIN_KEY` como 🟡 pendente; sem ele o fechamento de season é pulado com log.

### O que nunca foi analisado nos workers
- KV > 1000 chaves (`list` paginado com `cursor`?) — não li.
- Limite de subrequests do plano free por invocação (cada push = 1 subrequest).
- `compatibility_date` 2024-09-23 vs. flags atuais.
- `fcm.js`: cache do access token do Google entre invocações.
- Observabilidade: falha do cron é silenciosa até alguém notar que não chegou push.

---

## D) CI — `.github/workflows/*.yml` (6 arquivos)

| workflow | gatilho | roda | NÃO roda | secrets | permissions |
|---|---|---|---|---|---|
| `ci.yml` "CI (typecheck + testes)" | `pull_request`, `push main`, dispatch | `npm ci`; integridade sha256 `vendor/class-system/index.js` × `_provenance.json`; `tsc` app; `tsc -p desktop/tsconfig.json`; `tsc -p tsconfig.server.json`; `npx vitest run` (inclui `desktop/`, `functions/`, `workers/`) | `npm run build` do web, lint, e2e, build desktop/android | nenhum | `contents: read`; `concurrency` cancela em PR |
| `android-build.yml` | `push main/version-b`, dispatch | debug APK; AAB assinado se secrets; smoke em emulador (`continue-on-error`) | vitest; **verde sem AAB**; verde com smoke quebrado | `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` (opcionais) | `contents: read` |
| `desktop-build.yml` | `push main` com `paths` desktop/sprites/assets, dispatch | `tsc` do renderer, `npm run dist -- --publish never`, artefato `.exe` | **vitest do desktop**, smoke, assinatura | nenhum | `contents: read` |
| `desktop-release.yml` | tag `vX.Y.Z` | confere tag×version, `tsc`, `dist:publish` (GitHub Release) | vitest, assinatura (`CSC_IDENTITY_AUTO_DISCOVERY=false`) | `GITHUB_TOKEN` | `contents: write` |
| `docs-sync.yml` | `push main` exceto `docs/manual/**`/`dist/**`, dispatch | guards `docsManual.contract` + `docsSemMentira.contract`; `scripts/docs-delta.mjs`; se há delta e `ANTHROPIC_API_KEY`: `anthropics/claude-code-action@v1` roda `/manter-docs auto`, abre e **mergeia PR sozinho** | — | `ANTHROPIC_API_KEY` (opcional), `GITHUB_TOKEN` | job `mantenedor`: `contents: write`, `pull-requests: write`, `id-token: write` — **`claude-code-action@v1` por tag móvel**, não por SHA (todas as outras actions estão presas; a exceção é justamente a que tem `write`) |
| `sync-irmaos.yml` | cron `17 6 * * 1` (segunda 06:17 UTC), dispatch | clona `HexerVoodoom/Class-System` e `HexerVoodoom/Besti-rio-`, `npm run vendor:class-system` + `sync:oracle-data`, assert mesmo SHA motor×dados, gate tsc/vitest com `continue-on-error`, commit em `sync/repos-irmaos`, abre/atualiza PR (draft + label `sync-quebrado` se vermelho), falha o run se gate vermelho | — | `SIBLING_REPOS_TOKEN` (opcional se repos públicos), `SYNC_PR_TOKEN` (opcional; sem ele o `ci.yml` do PR fica em "Approve and run") | `contents: write`, `pull-requests: write` |

`sync-irmaos.yml` = sincronização semanal dos repositórios irmãos (motor de classes `Class-System` vendorizado em `vendor/class-system/` e o bestiário `pool.json`), com procedência por SHA e PR automático. Substituiu o step de token que existia no `android-build.yml`.

Transversal:
- **Nenhum workflow roda `npm run build` do web como gate** (só dentro do `android-build.yml`, que não roda em PR). Erro só de build do Vite passa no `ci.yml`.
- `ci.yml` não tem guard contra "Test Files 0" (o footgun da memória "Tests N passed" sem "Test Files").
- **Não dá para saber se está verde daqui.** O que checar: `gh run list --workflow ci.yml --limit 10`, idem `android-build.yml`, `desktop-build.yml`, `docs-sync.yml`, `sync-irmaos.yml`; e Settings → Branches se `gate` é required em `main`.
- `docs-sync.yml` com `claude-code-action@v1` + `contents: write` + merge automático = agente com permissão de escrever na `main` disparado por qualquer push. Hoje inerte (sem `ANTHROPIC_API_KEY`), mas quando ligar é a maior superfície de supply chain do repo.

---

## E) i18n

### Mecanismo
`language === 'pt-BR' ? … : …` inline (`grep -rn "language === 'pt-BR'" src --include=*.tsx | wc -l` → 155) ou helper local por arquivo (`const isPt = language === 'pt-BR'; const L = (pt, en) => isPt ? pt : en` em `GuideModal.tsx`; `const pt = …` em `ChatBox.tsx`; pares `bodyPt/bodyEn` em `GameTutorialFlow.tsx`; mapas por idioma em `SoulmonOnboarding.tsx` `textoErroAuth`). Sem i18next/arquivo de locale. Regra do `CLAUDE.md`: inglês é a base, PT-BR é localização.

### Strings só em PT nos 10 maiores componentes
`wc -l src/components/*.tsx | sort -rn`: `SoulmonOnboarding` 2302, `CompanionHUD` 1880, `EvolutionPath` 1293, `OraclePage` 1017, `CreateModal` 699, `TournamentPage` 663, `ArenaGame` 613, `ChatBox` 601, `DungeonGame` 567, `NightmareBattle` 510.

Heurística (`scratchpad/qa/ptonly.mjs`): remove comentários, procura texto JSX ou literal com acento/ç, descarta se há bifurcação (`pt-BR|isPt|pt ?|language`) em janela de ±3 linhas:

| componente | candidatos | após leitura |
|---|---|---|
| SoulmonOnboarding | 7 | 0 — mapa PT de `textoErroAuth` cujo par EN está 26 linhas abaixo |
| CompanionHUD | 0 | 0 |
| EvolutionPath | 1 | 0 — identificador `podeRetentarNó`, não string |
| OraclePage / CreateModal / TournamentPage / ArenaGame / ChatBox / DungeonGame / NightmareBattle | 0 | 0 |

Varredura de todos os `src/components/*.tsx` não-teste: só `GuideModal.tsx` (28) e `GameTutorialFlow.tsx` (3) acima de 1, ambos falsos positivos (`L(pt, en)` e `bodyPt/bodyEn`). **Resultado: 0 strings só-PT verificadas nos 10 maiores.** A heurística ingênua "linha com acento" dá 386 em `CompanionHUD` — quase tudo comentário de bloco; não usar esse número.

### Strings EN faltando?
Nenhuma string PT sem ramo EN encontrada. O inverso (EN sem PT) não foi medido — EN é a base, então "faltar PT" é degradação silenciosa para o público principal; ninguém conta isso.

### Teste que trava paridade
`src/i18nSemPtSozinho.contract.test.ts` — guard de **bifurcação**, não de tradução: varre `aria-label|placeholder|title|aria-description` e `toast(...)`/`speak(...)` procurando palavras só-PT (`você|não|tarefa|carinho|…`) em linha sem `pt-BR|isPt|pt ?`. **Não cobre texto JSX** (`<p>Olá</p>`), nem `.ts` fora desses padrões, nem o widget Kotlin, nem o overlay Electron (`desktop/renderer/src/phrases.ts`, `menu.ts` `labelTitlebar` — fora de `src/`). `src/components/textoBilingue.contract.test.ts` existe (citado em `03-FLUXO-DE-TELAS.md`) — não lido; checar escopo.

### O que nunca foi analisado em i18n
- Texto JSX puro (o guard só olha atributos e toasts).
- Superfícies fora de `src/`: widget Kotlin (só EN por decisão 13.18), canais de notificação (PT em `MainActivity.java`, EN em `AlarmReceiver.kt`), `desktop/renderer/src/phrases.ts`/`menu.ts`, `public/*.html`.
- Pluralização e formatação de número/data por idioma.
- Idioma do sistema vs. idioma salvo: o push (`workers/`) tem teste de idioma; widget e desktop não.

---

## Resumo do que nunca foi analisado (todas as superfícies)
1. `desktop/electron/main.js` inteiro — sem teste, sem smoke, comentário falso sobre a URL, `exp:0` = sessão eterna travada por teste.
2. Electron 33.4.11 fora de suporte carregando página remota; instalador sem assinatura.
3. `android/app/google-services.json` é do DigiApp — build verde sem FCM; nenhum client `com.hexervoodoom.soulmon`.
4. Billing Library 6.2.1 e targetSdk 35 vs. exigências do Play em set/2026 (bloqueio de upload, não de build).
5. `assetlinks.json` sem `autoVerify` no manifesto e fingerprint de origem desconhecida.
6. Ícone adaptativo sem `<monochrome>`.
7. Worker de push: `e90f05a6` não é SHA do git; docs se contradizem sobre se `3e758a81` está no ar; `SEASON_ADMIN_KEY` pendente; nome `digiapp-push-scheduler`.
8. CI: `desktop-build.yml`/`desktop-release.yml` publicam sem vitest; `android-build.yml` verde sem AAB e com smoke quebrado; nenhum gate roda `npm run build` do web; `claude-code-action@v1` por tag móvel com `write` + merge automático.
9. i18n: 0 strings só-PT nos 10 maiores componentes (heurística + leitura); guard cobre só atributos/toasts, não JSX; widget só EN; canais de notificação em idiomas misturados.
