# Arquitetura

> **Dono:** doc-redator-arquitetura · **Data:** 09/09/2026 · **Estado:** verificado em 10/09/2026 por doc-verificador
> **Verificação:** `npx tsc --noEmit` · `npx tsc -p tsconfig.server.json --noEmit` · `npx tsc -p desktop/tsconfig.json --noEmit` · `npx vitest run` · `npm run build`; os contratos de fronteira são `src/deploy/appUrl.contract.test.ts`, `src/deploy/firebaseNoBuild.contract.test.ts`, `src/deploy/swCache.contract.test.ts`, `src/security/csp.test.ts`
> **Não cobre:** as regras do jogo (→ `02-REGRAS-DE-NEGOCIO.md`), as telas (→ `03-FLUXO-DE-TELAS.md`), tokens e estilo (→ `04-IDENTIDADE-VISUAL.md`), função por função (→ `06-REFERENCIA/`), o esquema do save e as chaves de storage (→ `07-DADOS-E-SAVE.md`), credenciais e deploy (→ `08-INTEGRACOES-E-DEPLOY.md`).
> **Precedência:** código > teste > `CLAUDE.md` > este documento. Onde discordarem, o código está certo e este doc tem defeito.

---

## 1. Stack, com versões copiadas do `package.json`

Todas as linhas abaixo são cópia literal do campo `dependencies`/`devDependencies`
do arquivo indicado, lidas em 09/09/2026 no commit `4e77a08a`.

### 1.1 App web (`package.json`, `"name": "soulmon"`, `"version": "0.1.0"`)

| Peça | Pacote | Versão declarada |
|---|---|---|
| UI | `react` · `react-dom` | `^18.3.1` |
| Build | `vite` | `6.3.5` (pino exato, sem `^`) |
| Plugin de build | `@vitejs/plugin-react-swc` | `^3.10.2` |
| Linguagem | `typescript` | `^6.0.3` |
| Testes | `vitest` · `@vitest/ui` · `@vitest/coverage-v8` | `^4.1.9` |
| DOM de teste | `jsdom` | `^29.1.1` · `@testing-library/react` `^16.3.2` · `@testing-library/jest-dom` `^7.0.1` |
| Casca nativa | `@capacitor/core` · `@capacitor/cli` · `@capacitor/android` | `^8.4.0` |
| Push nativo | `@capacitor/push-notifications` | `^8.1.1` |
| Passos | `@capgo/capacitor-pedometer` | `^8.0.38` |
| Login | `firebase` | `^12.16.0` |
| Efemérides do Oráculo | `astronomy-engine` | `^2.1.19` |
| Fonte de display | `@fontsource/silkscreen` | `^5.3.0` |
| Toasts | `sonner` | `^2.0.3` |
| Gráficos | `recharts` | `^2.15.2` |
| Primitivos de UI | `@radix-ui/react-*` (26 pacotes) | ver `package.json` |
| Cloudflare | `wrangler` | `^4.114.0` |
| Conversão de imagem no build | `sharp` | `^0.35.1` |
| Tipos | `@types/node` `^20.19.43` · `@types/react` `^19.2.17` · `@types/react-dom` `^19.2.3` | — |

⚠️ **Não existe plugin do Tailwind no Vite.** `src/index.css` é o único CSS
empacotado, com o Tailwind v4 já pré-compilado dentro dele — é o footgun 1 do
`CLAUDE.md` (§7 aqui).

### 1.2 Overlay Electron (`desktop/package.json`, `"name": "soulmon-desktop"`)

| Peça | Pacote | Versão declarada |
|---|---|---|
| Runtime | `electron` | `^33.2.0` |
| Empacotador | `electron-builder` | `^25.1.8` |
| Auto-update | `electron-updater` | `^6.3.9` |
| Build do renderer | `vite` | `6.3.5` |
| Linguagem | `typescript` | `^5.6.3` (⚠️ **diferente** da raiz, que está em `^6.0.3`) |

`build.appId` = `com.hexervoodoom.soulmon.desktop`; alvo `nsis` x64; `publish`
aponta para o GitHub `HexerVoodoom/Soulmon`.

### 1.3 Android (`android/build.gradle`, `android/app/build.gradle`, `android/variables.gradle`)

| Peça | Valor |
|---|---|
| Android Gradle Plugin | `com.android.tools.build:gradle:8.2.1` |
| Kotlin Gradle Plugin | `1.8.22` |
| `google-services` | `4.4.1` |
| JDK no CI | `21` (`actions/setup-java` em `.github/workflows/android-build.yml`) |
| `sourceCompatibility`/`targetCompatibility` | `JavaVersion.VERSION_17` |
| `kotlinOptions.jvmTarget` | `'17'` |
| `minSdkVersion` | `26` |
| `compileSdkVersion` / `targetSdkVersion` | `35` |
| `applicationId` / `namespace` | `com.hexervoodoom.soulmon` |
| `versionCode` / `versionName` | `14` / `1.1.3` |
| Billing | `com.android.billingclient:billing-ktx:6.2.1` |
| FCM | `firebaseMessagingVersion = '24.1.0'` |
| WorkManager | `androidx.work:work-runtime-ktx:2.9.0` |

O re-pin do Java 17 acontece **duas vezes** em `android/app/build.gradle`: uma
no bloco `android {}` normal e outra num segundo bloco `android {}` **depois**
do `apply from: 'capacitor.build.gradle'`, porque o arquivo regenerado pelo
`cap sync` força Java 21 e o Kotlin 1.8.22 não aceita alvo 21. É o footgun 3.

---

## 2. Mapa de pastas

### 2.1 Raiz

| Pasta | O que mora |
|---|---|
| `src/` | O app web inteiro (React + TS). Detalhado em §2.2. |
| `functions/api/` | As **Pages Functions** do Cloudflare — 14 rotas `/api/*` mais os módulos internos `_*.js` (auth, KV, entitlements, billing, rate limit, guarda de IA, copy de push). Dinheiro, save e autorização vivem aqui. |
| `workers/` | O **worker de push** (`push-scheduler.js` + `webpush.js` + `fcm.js` + `wrangler.toml`). NÃO é Pages Function: deploy manual. |
| `desktop/` | O overlay Electron: `electron/` (processo principal, preloads, políticas de navegação e update) e `renderer/src/` (a faixa do pet e o menu). |
| `android/` | O projeto Capacitor: `app/src/main/java/com/hexervoodoom/soulmon/` com `MainActivity.java`, `plugins/` (widget, alarme, billing), `widget/` (5 providers + `WidgetRenderer.kt` + `WidgetRefreshWorker.kt`) e `notifications/` (`AlarmReceiver.kt`, `BootReceiver.kt`). |
| `public/` | O que é servido cru: `sw.js` (service worker), `_headers` (CSP e cache), `manifest.json`, `privacidade.html`, `termos.html`, `fonts/`, `screenshots/`. |
| `dist/` | O build publicado — **é commitado** (481 arquivos rastreados, `git ls-files dist \| wc -l`, 09/09/2026). |
| `scripts/` | Ferramentas de build e de manutenção (`convert-to-webp.mjs`, `docs-inventario.mjs`, `sync-oracle-data.mjs`, `vendor-class-system.mjs`, `orcamento-de-tempo.mjs`, geradores de arte). |
| `tools/` | Leitura das métricas fora do app: `metrics-read.mjs` (transporte) + `metricsReport.mjs` (regras puras, testadas). |
| `tests/` | Testes do código que não mora em nenhum bundle — em 10/09/2026, `swOrigemDaResposta.test.ts` (o `public/sw.js`) e `metricsReport.test.ts` (`ls tests`). |
| `migrations/` | O schema do D1 versionado: `0001_order_claims.sql`, `0002_order_claims_expires_at.sql` e o `README.md` com as regras de aplicação. |
| `vendor/class-system/` | Snapshot COMMITADO do motor do class-system (`index.js`, `types/`, `_provenance.json` com o SHA de origem). O CI confere o sha256 do blob contra o `_provenance.json`. |
| `product/soulmon-01/` | Material de produto da squad (`balance/`, `sweeper/`, `ui/`) — decisões e medições, não código. |
| `docs/` | Documentação do projeto, incluindo este manual (`docs/manual/`). |
| `.claude/` | Configuração de agentes (`agents/`), comandos (`commands/`) e skills (`skills/`) do Claude Code. |
| `.github/` | 5 workflows (`workflows/`) + `scripts/`. Detalhados em [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md). |
| `.agents/` | `skills/` — skills externas referenciadas por `skills-lock.json`. |
| `types/` | `cloudflare-workers.d.ts`, os tipos globais que `tsconfig.server.json` inclui. |
| `assets/` | ⚰️ **Não existe mais.** Era um build antigo restaurado na raiz (14 arquivos com nome já hasheado, entrada de nada em `src/`); a pasta foi **removida em 09/09/2026** no commit `571a8b4f`, porque um dos arquivos carregava o JWT anônimo do Supabase da era do fork. Conferido em 10/09/2026 com `git ls-files \| grep -c '^assets/'` → `0`. |
| `brand/`, `memory/`, `screenshots/` | Material de marca, contexto de produto e capturas da ficha da loja. Sem código. |

### 2.2 `src/`

| Pasta / arquivo | O que mora |
|---|---|
| `src/main.tsx` | O ponto de entrada. Migra as chaves legadas e monta os providers (§3). |
| `src/App.tsx` | O orquestrador. **Meça antes de abrir**: `wc -l src/App.tsx` → **6245** linhas em 09/09/2026. |
| `src/index.css` | O ÚNICO CSS empacotado. `wc -l src/index.css` → **7678** linhas em 09/09/2026. |
| `src/utils/` | **120 módulos** (inventário de 09/09/2026) — as regras puras: cuidado, virada do dia, hábito, tarefa, descanso, oráculo, loja, masmorra, som, telemetria, save na nuvem. |
| `src/utils/soulProfile/` | O motor pesado do Oráculo: `astrology/`, `bestiary/`, `ficha/`, `axes.ts`, `pipeline.ts`. Entra por import DINÂMICO. |
| `src/components/` | **91 módulos** — telas, modais, HUD, minijogos. `src/components/ui/` é o scaffold shadcn importado do Figma. |
| `src/hooks/` | **6 módulos**: `useDailyReset`, `useCareSystem`, `useProgressTracking`, `useSpriteGeneration`, `useDialogA11y`, `useItemForm`. |
| `src/contexts/` | **3 módulos**: `GameStateContext.tsx`, `ThemeContext.tsx`, `LanguageContext.tsx` (⚠️ ver §6). |
| `src/types/` | `progression.ts` (a árvore de formas, HP e requisitos), `taskModel.ts` (dono único das constantes do motor de tarefas), `attributes.ts`, `category-icons.ts`. |
| `src/plugins/` | As pontes com o Android: `SoulmonWidgetPlugin.ts` e `SoulmonAlarmPlugin.ts` (`registerPlugin` do Capacitor). |
| `src/security/` | Só testes: `csp.test.ts`, `oldWebview.test.ts`, `supabase.contract.test.ts`. |
| `src/deploy/` | Só testes: `appUrl.contract.test.ts`, `firebaseNoBuild.contract.test.ts`, `swCache.contract.test.ts`. |
| `src/styles/` | `tokens.md` e cinco guards de estilo (contraste, escala de ícone, rótulo da nav, inventário de ícones, suporte a emoji). |
| `src/constants/` | `labels.ts` — 1 módulo. |
| `src/assets/` | A arte: `soulmon/` (as linhas próprias), `backgrounds/`, `decor/`, `icons/`, `brand/`, `video/`, mais três PNGs com nome de hash (alvos do alias `figma:asset/*`). |
| `src/translations/` | `en.ts` e `pt.ts` (⚠️ ver §6). |
| `src/test/` | Infra de teste: `renderEnv.tsx` (ambiente de render) e `tsAst.ts` (compilador de TS fora do orçamento). |
| `src/supabase/functions/server/` | A Edge Function que roda **no provedor**, não no app: `index.tsx`, `transcribe.tsx`, `kv_store.tsx`. `tsconfig.json` a EXCLUI do typecheck e nenhum arquivo de `src/` a importa. |

---

## 3. Ciclo de vida do app web

```
index.html (4 <script> inline: tema antes do paint · texto da splash · aviso de
             WebView antigo · registro do SW — e são os MESMOS 4 hashes
             `sha256-` do `script-src` em `public/_headers`, §7)
  └─ src/main.tsx
       1. migrateLegacyStorageKeys()      ← ANTES de qualquer provider
       2. createRoot(...).render(
            <ErrorBoundary>
              <ThemeProvider>            (src/contexts/ThemeContext.tsx)
                <GameStateProvider>      (src/contexts/GameStateContext.tsx)
                  <App />                (src/App.tsx)
       3. remoção da splash: 2× requestAnimationFrame + setTimeout de rede
```

**Por que a migração vem antes dos providers**: `GameStateProvider` lê o save no
**inicializador do próprio `useState`**, então uma migração agendada depois
chegaria tarde. `migrateLegacyStorageKeys` (`src/utils/storageKeys.ts`) copia as
chaves `digiapp-*` para os nomes `soulmon-*`, nunca sobrescreve e nunca apaga —
detalhe em [07-DADOS-E-SAVE.md](07-DADOS-E-SAVE.md).

**Por que o `setTimeout` da splash é agendado fora do `rAF`**: `requestAnimationFrame`
não dispara em aba de segundo plano. Enquanto a rede de segurança vivia dentro
do duplo `rAF`, ela nunca rodava e a splash ficava para sempre por cima de um app
já carregado (corrigido em 27/08/2026, comentário no próprio `src/main.tsx`).

### 3.1 Os providers

| Provider | Arquivo | O que guarda | Chave de storage |
|---|---|---|---|
| `ErrorBoundary` | `src/components/ErrorBoundary.tsx` | Rede contra tela branca por exceção de render. | — |
| `ThemeProvider` | `src/contexts/ThemeContext.tsx` | `mode` (`light`/`dark`/`system`) e o `resolvedTheme`; escreve `data-theme` no `<html>`. Sem preferência salva o padrão é **escuro** (`resolveSystemPreference` devolve `'dark'` fixo — o kit visual só existe pensado para o escuro). | `THEME` |
| `GameStateProvider` | `src/contexts/GameStateContext.tsx` | O `GameState` inteiro + persistência local + agendamento do cloud save. | `GAME_STATE`, `SAVE_ID` |

### 3.2 Os hooks que o `App.tsx` liga

| Hook | Dono da regra | O que ele agenda |
|---|---|---|
| `useDailyReset` | `src/utils/dailyReset.ts` → `computeDailyReset` (função PURA, e é a MESMA que o teste importa) | Um check de virada a cada **30 s**. Devolve `rolloverPending`, que o `App.tsx` usa como `busy` do lote de sprite. ⚠️ Não reintroduzir ticker de 1 s. |
| `useCareSystem` | `src/utils/poopDrain.ts` (`applyPoopDrain`) e `src/utils/passives.ts` (`earliestPoopHour`) | Agendamento do cocô e polling de **10 s**. Nunca aparece dormindo. |
| `useProgressTracking` | `src/utils/dailyReset.ts` (`dailyGoalFor`, `activitiesForWeekDay`, `tasksCompletedOn`) + `src/types/taskModel.ts` (`HABIT_WEIGHT`, `normalizeEffort`) | Nada — é derivação (`useMemo`) de `dailyTotal`, `dailyDone`, `progress`. É a fonte ÚNICA da barra e dos dois números do dia. |
| `useSpriteGeneration` | `src/utils/spriteTrigger.ts` (gatilho), `spriteLibrary.ts` (acervo), `spriteRunner.ts` (execução) | O lote de geração de sprite, sempre **depois do primeiro paint**, em **ocioso** (`whenIdle`: `requestIdleCallback` com `timeout: 5000`, senão `setTimeout(2000)`), **nunca** durante virada/relatório/cerimônia/animação de cuidado, e **um lote por vez**. |
| `useDialogA11y` | o próprio hook | Foco e `aria` dos modais. |
| `useItemForm` | o próprio hook | Estado dos formulários de criar/editar item. |

---

## 4. As quatro superfícies, e como cada uma chega ao mesmo save

O save canônico é **um só**: a chave `<saveId>` no namespace KV resolvido por
`kv(env)` em `functions/api/_kv.js`, escrita e lida por `functions/api/save.js`.
O `saveId` é `SHA-256("soulmon:" + e-mail normalizado)` cortado em 32 hex — três
implementações, um teste de paridade. Detalhe em
[07-DADOS-E-SAVE.md](07-DADOS-E-SAVE.md).

| Superfície | O que roda | Como chega ao save |
|---|---|---|
| **Web / PWA** | O bundle do Vite servido pelo Cloudflare, com `public/sw.js` cacheando a casca. | Direto: `GameStateProvider` grava no `localStorage` a cada `setGameState` e agenda `POST /api/save` com debounce (`cloudSaveComRetry`, `src/utils/cloudSave.ts`). É a superfície que ESCREVE o save. |
| **APK (Capacitor)** | Uma casca nativa que **carrega a URL de produção** — `capacitor.config.json`, chave `server.url` = `https://soulmon.mateus-sprnd.workers.dev`, `cleartext: false`. | Pelo mesmo caminho do web: dentro do WebView é o mesmo app. **Consequência de deploy**: mudança web NÃO precisa de APK novo; só mudança em `android/` precisa. |
| **Overlay Electron** | Um app separado (`desktop/`), build próprio (`npx vite build -c desktop/vite.config.ts`), que **não entra no bundle web**. | É um **controle remoto**: `desktop/renderer/src/cloudSync.ts` deriva o mesmo `saveId` e fala `/api/save` por HTTP, lendo (`fetchRemoteSnapshot`) e escrevendo de volta (`pushCareAction`) carinho, comida, marcar tarefa, banho e dormir. Autentica pela janela do app web (`desktop/electron/auth-preload.js`). As regras de cuidado são **importadas** de `src/utils/` pelo adaptador `desktop/renderer/src/care.ts` — não são cópia. |
| **Widgets Android** | 5 `AppWidgetProvider` em Kotlin (`android/.../widget/`), desenhados por `WidgetRenderer.kt`, atualizados por `WidgetRefreshWorker.kt`. | **Não fala com o servidor.** Lê `SharedPreferences` (`WidgetRenderer.PREFS_NAME`), gravadas pelo app pela ponte `SoulmonWidget` (`src/plugins/SoulmonWidgetPlugin.ts` → `plugins/SoulmonWidgetPlugin.kt`). O widget é sempre um espelho **de leitura**, e ele **não cobra** — guard em `src/plugins/widgetSemCobranca.contract.test.ts`. |

⚠️ O que essa arquitetura **não** resolve sozinha: dois aparelhos escrevendo em
paralelo. `save.js` faz um `put` cego, sem revisão. O caminho tipado do 409 já
existe em `src/utils/cloudSave.ts` (`CLOUD_SAVE_POLICY.conflict`), mas o
`revision` que o produziria não está implementado.

---

## 5. Onde vive cada regra

Este documento **não** repete as regras. A tabela abaixo diz só qual símbolo
decide, para que a leitura do doc de regras chegue ao código em um salto. As
regras em si estão em `02-REGRAS-DE-NEGOCIO.md`.

| Assunto | Dono (símbolo) | Arquivo |
|---|---|---|
| Virada do dia (corações, dia completo, folga da semana) | `computeDailyReset`, `dailyGoalFor`, `registeredForDay` | `src/utils/dailyReset.ts` |
| Cuidado (alimentar, carinho, concluir) | `careRules` (funções puras) + `careUpdaters` | `src/utils/careRules.ts`, `src/utils/careUpdaters.ts` |
| Onde os tetos de cuidado MORAM | `mergeCareCaps`, `feedTimesFor`, `rubHealFor` | `src/utils/careCaps.ts` |
| Dia do jogador (fuso fixo) | `playerDayKey`, `resolvePlayerDayAnchor` | `src/utils/playerDay.ts` |
| Dreno de cocô | `applyPoopDrain` | `src/utils/poopDrain.ts` |
| Item especial (coraçãozinho, Glitchtama) | `specialRefusal`, `applySpecialItem` | `src/utils/specialItemUse.ts` |
| Constância, escudos, marcos | `constancy`, `applyMissedDay`, `earnShield`, `habitTier` | `src/utils/habitRhythm.ts` |
| Triagem e execução de tarefa | `triageQueue`, `postpone`, `shrink`, `setFocus` | `src/utils/taskTriage.ts` |
| Tipos e TODAS as constantes do motor de tarefas | `HABIT_WEIGHT`, `HABIT_MILESTONES`, `MAX_DAILY_FOCUS`, `OVERCOMMIT_EFFORT`, … | `src/types/taskModel.ts` |
| Janela de Descanso e Sonhos | `recordNight`, `restConstancy`, `rollDream`, `DREAM_CATALOG` | `src/utils/restWindow.ts` |
| Rituais (check-in, semanal, recomeço) | `checkInPlan`, `weeklyReport`, `applyFreshStart` | `src/utils/rituals.ts` |
| Árvore de formas, HP máximo, requisitos | `FORM_REQUIREMENTS`, `MAX_HP_BY_FORM`, `getStageLevel` | `src/types/progression.ts` |
| Renascimento | `applyRebirth`, `rebirthRefusal` | `src/utils/rebirth.ts` |
| Masmorra | `buildDungeonWave`, `setDungeonDifficultyAtLeast`, `rollDungeonHeartDrop` | `src/utils/dungeon.ts` |
| Loja, missões, missões semanais | `ALL_SHOP_ITEMS`, `missions`, `forWeek` | `src/utils/shop.ts`, `missions.ts`, `weeklyMissions.ts` |
| Moedas (fronteira visual) | `bitsStyle`, `bitsStyleLight` | `src/utils/currencies.ts` |
| Vínculo (nível é DERIVADO, nunca salvo) | `bondLevelFor`, `meetsPvpBond`, `BOND_PVP_MIN_LEVEL` | `src/utils/bond.ts` |
| Palco do pet | `GROUND_Y`, `SlotId` | `src/utils/petStage.ts` |
| Oráculo (leitura + criação) | `generateOracle`, `composeSpritePrompts` | `src/utils/oracle.ts`, `src/utils/soulProfile/` |
| Áudio (sons · barramento · política) | `sounds`, `tocarNa`, `loudness` | `src/utils/sounds.ts`, `audioBus.ts`, `loudness.ts` |

---

## 6. Idioma

**Inglês é a base; PT-BR é localização.** O par vem sempre pelo padrão
`language === 'pt-BR' ? … : …` escrito no ponto de uso, e o ponto único que
decide o idioma é `resolveLanguage` em `src/utils/i18n.ts`:

```ts
export function resolveLanguage(stored: string | null): Language {
  if (stored === 'pt-BR' || stored === 'en-US') return stored;
  const nav = typeof navigator !== 'undefined' ? (navigator.language || '') : '';
  return nav.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en-US';
}
```

O valor persistido é a chave `LANGUAGE` (`soulmon-language`). O guard que impede
string só em português é `src/i18nSemPtSozinho.contract.test.ts`.

⚠️ **`src/translations/` e `src/contexts/LanguageContext.tsx` estão MORTOS.**
`LanguageContext.tsx` é o único importador de `translations/en.ts` e
`translations/pt.ts`, e **nenhum arquivo de produção importa
`LanguageContext`** — medido em 09/09/2026 com
`grep -rn "LanguageContext" src/ --include=*.ts --include=*.tsx`, cuja única
ocorrência fora do próprio arquivo é um comentário de teste
(`src/components/p5DiaCompleto.contract.test.ts`). Nenhum `LanguageProvider` é
montado em `src/main.tsx`. O dicionário de 157 linhas de cada lado não alimenta
nenhuma tela; quem escreve texto usa o ternário no ponto de uso. **Não escreva
texto novo nesses arquivos achando que ele aparece em algum lugar.**

---

## 7. Service worker, cache e CSP

| Peça | Onde | Regra |
|---|---|---|
| Service worker | `public/sw.js` | `CACHE_VERSION` mora nas **primeiras linhas** do arquivo e é a origem dos nomes `soulmon-static-<v>` e `soulmon-runtime-<v>`. Ao mudar asset estático/HTML de forma incompatível, **abra o arquivo e some 1** — o número NÃO é repetido em documentação nenhuma, de propósito (já apodreceu três vezes). |
| Navegação | `public/sw.js` | **Network-first**: busca a rede primeiro e só cai no cache no `.catch`. É o que impede o bundle novo de ficar inalcançável. |
| O que pode entrar no cache | `public/sw.js`, `cacheavel` | Só resposta `ok` **e** `type === 'basic'` **e** `!redirected` — as três fecham caminhos distintos de servir conteúdo de outra origem sob a nossa chave. |
| Precache do install | `public/sw.js`, `PRECACHE_URLS` | Só `/`, `/index.html`, `/manifest.json`, `/favicon-192x192.png`. **Nenhum JS/CSS**, para o install não conseguir fixar um bundle. |
| Assunção imediata | `public/sw.js` | `skipWaiting()` no install e `clients.claim()` no activate: o SW novo assume na PRIMEIRA carga. |
| Cabeçalhos HTTP | `public/_headers` | `/assets/*` `immutable` por 1 ano (o nome tem hash); `/index.html` e `/sw.js` `no-cache, no-store, must-revalidate`. |
| CSP | `public/_headers`, diretiva `Content-Security-Policy` | `script-src 'self' https://apis.google.com` + **quatro hashes `sha256-`** dos scripts inline do `index.html`. Sem `unsafe-inline` e sem `unsafe-eval`. `style-src` precisa de `'unsafe-inline'` (o app usa `style={{}}` por causa do footgun 1). ⚠️ `https://apis.google.com` em `script-src` e `frame-src` **não é opcional**: sem ele o login com Google falha com `auth/internal-error`, sem mencionar CSP. |

**Réguas executáveis**: `src/deploy/swCache.contract.test.ts` (6 blocos: nome com
hash · precache sem bundle · navegação network-first · limpeza dos caches
antigos · `skipWaiting`/`claim` · cabeçalhos) e `src/security/csp.test.ts`
(recalcula os hashes a partir do HTML da fonte **e** do `dist` servido e falha se
alguém editar um script inline sem atualizar a política).

---

## 8. Os footguns do `CLAUDE.md`

Estão escritos por extenso, com o dano medido de cada um, em
[../../CLAUDE.md](../../CLAUDE.md) §"Footguns (aprendidos a dor)". Aqui só a
lista, para você saber que existe o que procurar:

1. **`src/index.css` é o único CSS empacotado** — classe utilitária que não está lá não aplica nada.
2. **RemoteViews (widgets Android)** só suporta um punhado de views; `<View>` quebra o widget.
3. **Build Android**: JDK 21 no CI, Kotlin `jvmTarget` 17, `compileOptions` re-pinados DEPOIS do `capacitor.build.gradle`.
4. **PNGs de 0 byte** no histórico do git.
5. **`useCallback` com deps certas** — lambda inline anula o `memo()` do `CompanionHUD`.
6. **Nada de side effect dentro de updater do `setGameState`** (StrictMode invoca 2×).
7. **O sandbox de dev não acessa a URL de produção** — teste local com `vite preview` + Playwright, semeando o `localStorage` por `addInitScript`.
8. **Sprites entram pelo alias `figma:asset/<hash>.png`** (mapa em `vite.config.ts`), com `assetsInlineLimit: 0`.
9. **Regra copiada = regra que diverge em silêncio** — o item mais longo, com o inventário datado do que ainda é cópia (em 10/09/2026: a derivação do `saveId`, em três árvores) e do que deixou de ser.
10. **Dois sistemas de tema no mesmo CSS** — `[data-theme]` (o do app) e o scaffold shadcn (`--foreground`/`--background`, preso no valor claro).

---

## 9. Os portões, e o que cada um pega

Rodar **antes de todo commit**:

| Comando | Escopo | O que ele pega — e o que ele NÃO pega |
|---|---|---|
| `npx tsc --noEmit` | `include: ["src", "tests"]`, `strict: true` (`tsconfig.json`) | Tipos do app e dos testes de raiz. **Não olha** `functions/`, `workers/`, `desktop/` nem `src/supabase/functions` (excluída). |
| `npx tsc -p tsconfig.server.json --noEmit` | `functions/**/*.js`, `workers/**/*.js`, `types/**/*.d.ts` | O código de **dinheiro, conta e save**, via `allowJs` + `checkJs` sobre o JSDoc que o servidor já escrevia. `strict: true` de propósito (sem `strictNullChecks` o TS não estreita união discriminada por `ok: true`). **Fora**: `**/*.test.js`, `scripts/`, `desktop/`. |
| `npx tsc -p desktop/tsconfig.json --noEmit` | `renderer/src/**/*.ts` | O overlay. `allowJs: true` + `checkJs: false` — o teste de contrato importa `functions/api/save.js` e sem isso o gate ficava vermelho por `TS7016`. |
| `npx vitest run` | ver §10 | Toda a suíte, incluindo os guards de fiação por AST, os contratos de deploy e de segurança, e os testes de paridade do desktop. |
| `npm run build` | `vite build && node scripts/convert-to-webp.mjs && npx wrangler pages functions build --outdir=./dist/_worker.js/` | Compila o bundle, converte PNG→WebP e **compila as Pages Functions para dentro de `dist/`**. ⚠️ O `CLAUDE.md` descreve este comando só como "vite build + conversão PNG→WebP" — o terceiro passo está no `package.json` e não está lá. |

O CI (`.github/workflows/ci.yml`, job `gate`) roda os quatro primeiros na ordem
typecheck do app → do overlay → do servidor → `vitest`, mais um step de
integridade do `vendor/` (sha256 do blob contra `_provenance.json`).

---

## 10. `vitest.config.ts` e o orçamento

### 10.1 O que a suíte inclui

```
src/**/*.test.ts · src/**/*.test.tsx
functions/**/*.test.js · workers/**/*.test.js
desktop/renderer/**/*.test.ts     ← os testes de PARIDADE do overlay
tests/**/*.test.ts                ← o que não mora em bundle nenhum (public/sw.js)
```

- **Ambiente padrão `node`.** Teste de render pede `jsdom` **por arquivo**, com o
  docblock `// @vitest-environment jsdom` na primeira linha.
- `environmentOptions.jsdom.url = 'http://localhost:3000/'` — sem isso a origem é
  opaca e `window.localStorage.getItem` fica `undefined`.
- O config **reusa os aliases do `vite.config.ts`** em vez de copiar a tabela
  (footgun 9): sem eles, todo componente com `figma:asset` morria em "Failed to
  resolve import".
- Ele também injeta `--no-experimental-webstorage` em `NODE_OPTIONS` antes de os
  workers nascerem: no Node ≥ 25 o `localStorage` global do Node **sombreia** o do
  jsdom e 28 testes ficaram vermelhos sem ninguém ter mexido no código.
- **Cobertura** (`--coverage`) inclui `functions/**/*.js` e `workers/**/*.js` de
  propósito: o código de dinheiro ficava fora do medidor.

### 10.2 O orçamento (`vitest.budget.mjs`)

Dono ÚNICO do número, porque ele tem **dois leitores**: o runner (que o aplica) e
`scripts/orcamento-de-tempo.mjs` (que afere quem está perto dele). É `.mjs` para
os dois consumirem sem passo de compilação.

| Símbolo | Valor | Significado |
|---|---|---|
| `TEST_TIMEOUT_MS` | `15_000` | Piso de robustez, não conserto de lentidão. ~3× o pior caso pré-conserto observado. |
| `LIMIARES.atencao` | `0.10` | Quem paga custo de ambiente; só se observa. |
| `LIMIARES.divida` | `0.25` | Dívida NOMEADA — sem folga para o fator de contenção de 4,4× medido. |
| `LIMIARES.critico` | `0.50` | Conserto na ORIGEM, nunca subindo o teto. |

Passe de medição: `npm run orcamento`.

### 10.3 A infra de teste

| Arquivo | Para quê |
|---|---|
| `src/test/renderEnv.tsx` | Monta o componente **com o `index.css` real** e mede o estilo COMPUTADO — é a única forma de ver a fronteira JSX↔CSS do footgun 1. Duas limitações declaradas: jsdom ignora `@layer` (o helper **desembrulha** os blocos, o que muda a precedência), e não há layout (alvo de toque é medido pelo `width`/`height` computado). Autoverificação em `src/test/renderEnv.selfcheck.test.tsx`. |
| `src/test/tsAst.ts` | Carrega o compilador de TypeScript **fora** do orçamento de cada teste. **Sete** guards leem código de produção como AST — `playerDay.contract`, `spriteBirth.contract`, `spriteTuneUnseen`, `useDailyReset.rollover`, `assets.contract`, `x6Updaters.contract` e `activityCreate.contract` (`grep -rl "tsAst" src \| wc -l` → 7, em 10/09/2026); com o `import('typescript')` dentro do caso, ~490 ms do primeiro carregamento contavam contra o `testTimeout`. |
