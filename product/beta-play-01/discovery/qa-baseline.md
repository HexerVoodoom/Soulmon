# QA baseline — `beta-play-01`, Fase 0

| Meta | Valor |
|---|---|
| Data | 2026-10-11 |
| Commit | `ac5841a33` (origin/main), worktree `E:/soulmon-beta-qa`, branch `qa/beta-baseline` |
| Ambiente | Windows 10, Node local, TZ do SO = America/Sao_Paulo (UTC-3), `core.autocrlf=true` |
| Log completo | `discovery/test-run.log` (13,4 mil linhas, saída real) |
| Corrigido algo? | Não. Fase 0 só mede. |

## 1. Inventário dos recursos de QA

| Recurso | Onde | O que faz |
|---|---|---|
| Typecheck app | `npx tsc --noEmit` | `src/` |
| Typecheck servidor | `npx tsc -p tsconfig.server.json --noEmit` | `functions/` + `workers/` (dinheiro, conta, save) |
| Typecheck overlay | `npx tsc -p desktop/tsconfig.json --noEmit` | desktop/Electron |
| Suíte vitest | `npx vitest run` (`vitest.config.ts`) | 677 arquivos: `src/**`, `functions/**/*.test.js` (108), `workers/**/*.test.js` (paridade VAPID/FCM/push), `desktop/renderer/**`, `tests/**` (service worker, index.html, métricas) |
| Contract tests | `src/**/*.contract.test.ts` (86 arquivos) | leem a FONTE e travam regras (narrativa, copy, deploy/appUrl, firebaseNoBuild, supabase, fila de avisos...) |
| `npm run gates` | `scripts/gates.mjs` | 3 tsc em paralelo + vitest `--changed origin/main` (laço rápido) |
| `npm run portoes` | `scripts/portoes.mjs` | réplica local do ci.yml em série |
| Shards | `npm run test:shard` | igual ao CI (4 shards) |
| Cobertura | `npm run test:coverage` | v8, sem limiar |
| Mutation | `node scripts/mutation-sweep.mjs [filtro]` | mede se os testes detectam mutações em alvos escolhidos |
| Orçamento de tempo | `npm run orcamento`, `vitest.budget.mjs` | tempo da suíte |
| Auditoria Oráculo | `npm run oraculo:auditoria` | config própria |
| Integridade vendor | step `vendor` do ci.yml (sha256 do blob x `_provenance.json`) | só no CI |
| Validador de squad | `scripts/validate_squad.py` | doc/processo |
| CI | `.github/workflows/ci.yml`, `android-build.yml`, `desktop-*.yml`, `docs-sync.yml` | **bloqueado por cobrança desde 16/09** — nada roda |
| Android unit/instrumented | `android/app/src/{test,androidTest}` | só os templates `Example*Test.java` do Capacitor. Zero teste nativo real |

Não existe: lint (sem ESLint/Biome no `package.json`), e2e/Playwright, smoke em device/emulador, teste de billing nativo.

## 2. Resultados

| # | Comando | Resultado | Tempo |
|---|---|---|---|
| 1 | `npx tsc --noEmit` | exit 0 | 26s |
| 2 | `npx tsc -p tsconfig.server.json --noEmit` | exit 0 | 4s |
| 3 | `npx tsc -p desktop/tsconfig.json --noEmit` | exit 0 | 3s |
| 4 | lint | **não existe** | — |
| 5 | `npx vitest run` | **exit 1: 2 falhas** | 332s |
| 6 | `npm run build` | exit 0 | 47s |
| 7 | `npx cap sync android` | exit 0 | <1s |
| 8 | `gradlew assembleDebug` (JBR 17 do Android Studio) | exit 0, `app-debug.apk` 54,9 MB | 65s |
| 9 | `gradlew bundleRelease` sem keystore | exit 0, `app-release.aab` 49,9 MB **não assinado** | 60s |

Trecho real da suíte:

```
 Test Files  2 failed | 675 passed (677)
      Tests  2 failed | 8550 passed | 1 expected fail | 2 skipped | 4 todo (8559)
   Duration  330.41s
```

Build web:

```
Converted 2082/2082 PNGs → WebP (151.17 MB a menos), 2044 referência(s) reescrita(s) em 91 arquivo(s), PNGs apagados.
 ⛅️ wrangler 4.114.0
✨ Compiled Worker successfully
=== exit=0 (47s)
```

Android:

```
BUILD SUCCESSFUL in 1m 4s          (assembleDebug)
BUILD SUCCESSFUL in 58s            (bundleRelease)
$ jarsigner -verify app-release.aab -> jar is unsigned.
WARNING: We recommend using a newer Android Gradle plugin to use compileSdk = 36
```

Observação: `bundleRelease` sem keystore **não falha**; ele produz um AAB sem assinatura, que a Play rejeita no upload. O build local de release é viável; o que falta é só o keystore de upload (segredo do dono).

## 3. Falhas classificadas

### F1 — BLOQUEIA BETA: hábito semanal conta o dia errado no fuso do Brasil

```
 FAIL  src/utils/taskSteps.rule.test.ts > Work (B) e hábito semanal (A) > weekChip: ...
AssertionError: expected { done: 1, target: 3 } to deeply equal { done: 2, target: 3 }
```

- Reprodução: falha em TZ America/Sao_Paulo e **passa com `TZ=UTC`** (mesmo arquivo: `Tests 18 passed (18)`). O CI roda em UTC (ubuntu), por isso nunca pegou.
- Causa: `src/utils/habitRhythm.ts:123`:

  ```ts
  export function dayKeyToDate(key: string): Date {
    const d = new Date(key);      // 'YYYY-MM-DD' é parseado como meia-noite UTC
    d.setHours(0, 0, 0, 0);       // em UTC-3 vira 21h do dia ANTERIOR -> zera no dia anterior
    return d;
  }
  ```

  Todo dayKey vira o dia anterior em qualquer fuso negativo (todo o Brasil). `dayKeyToDate` alimenta `weeklyProgress`, `weekChip`, `everyNDays` (`daysBetween`) e `scheduleAnchor`, ou seja, o progresso semanal e a cadência dos hábitos. Para o público do beta (PT-BR), o chip "N de 3" e a decisão de "hoje conta?" ficam deslocados em 1 dia. Risco direto à métrica §4(c): constância e escudo dependem disso. Ainda não medi o impacto em `constancy`/`applyMissedDay`.
- Ação: dono do código é o `alpha-frontend`. Regressão nomeada: esse mesmo teste rodando com TZ fixo negativo (ex.: `process.env.TZ='America/Sao_Paulo'` num teste dedicado) + o CI rodar ao menos um shard com TZ BR.

### F2 — NÃO BLOQUEIA (artefato do checkout Windows): contrato da fila de avisos

```
 FAIL  src/components/filaDeAvisos.contract.test.ts > ... > é o segundo intersticial, montado num único ponto, só com um pendente real
AssertionError: expected 'import { useState, ...' to contain 'welcomeTourOpen ? \'welcomeTour\'\n    : buildingIntroOpen ? ...'
```

- O código está lá (`src/App.tsx:1942-1943`). `src/App.tsx` sai com CRLF (`core.autocrlf=true`, repo sem `.gitattributes`) e o teste procura `\n`. Em Linux passaria.
- Mesmo assim importa: o build de release agora é **local no Windows** (Actions bloqueado), então a suíte de verdade passa a ser a do Windows. Precisa de `.gitattributes` com `* text=auto eol=lf` ou de normalizar `\r\n` nos contract tests que leem a fonte. Sem isso, o portão local fica vermelho para sempre e alguém vai acabar ignorando.

### Outras observações (não bloqueiam)

- `npm run build` no Windows reescreve ~340 arquivos de `dist/` (hashes/CRLF). Como `dist/` é commitado, um build local de release suja a árvore. Isso precisa entrar no runbook.
- `cap sync` marca `android/capacitor.build.gradle` e `capacitor.settings.gradle` como modificados (só CRLF, diff vazio).
- JDK: o `JAVA_HOME` do sistema é 1.8 (não serve). O CI usa 21; local passou com o JBR 17 do Android Studio. Para o AAB de produção, fixar a versão do JDK (instalar 21 em `E:/`) para não divergir do CI.
- AGP 8.2.1 com compileSdk 36 só gera aviso. É dívida técnica, não bloqueio.
- `local.properties` foi criado só no worktree (`sdk.dir=C:/Users/spera/AppData/Local/Android/Sdk`).

## 4. O que falta de cobertura para um beta

| Lacuna | Estado hoje | Por que pesa no beta |
|---|---|---|
| **Crash reporting** | Não existe. O `ErrorBoundary` só faz `console.error` em DEV; em produção o crash não é reportado. Não há handler global de `error`/`unhandledrejection` que reporte, nem Crashlytics/Sentry | métrica §4(b) "zero crash" não pode ser medida, só a Play Console (Android vitals) |
| **ANR** | Só pelo Android vitals da Play Console (precisa de volume; 12-15 testers dão pouco sinal) | WebView + `server.url` remoto: tela branca offline/rede lenta não aparece como crash |
| **Smoke em device** | Nenhum. Testes Android são templates. Sem Playwright/e2e | primeira instalação, login Google (SHA-1 do debug x upload x Play App Signing), boot do WebView |
| **Billing nativo** | Nenhum teste automatizado do fluxo Play Billing | métrica §4(d), compra de teste ponta a ponta: só manual em device com conta de licença de teste |
| **Perda de save** | Testes unitários de save existem, mas não há teste de migração e restauração em device (reinstalar, trocar aparelho, offline → online) | métrica §4(c) |
| **Fuso horário** | Suíte roda só no TZ da máquina e o CI em UTC | F1 mostra que bugs de fuso já passaram |
| **Lint** | Inexistente | só um alerta; o tsc estrito cobre parte |
| **CI** | Bloqueado | todo portão é local e manual: precisa de script único de release local que rode tsc×3 + vitest + build + bundle + verificação de assinatura |

## 5. Pendências para o checkpoint

1. F1 vai para o `alpha-frontend` como defeito bloqueante, com regressão nomeada antes da correção.
2. Decidir EOL (`.gitattributes`) antes de cortar o branch de release (F2).
3. Decidir o crash reporting do beta (mínimo: reportar o `componentDidCatch` + `unhandledrejection` para o endpoint de telemetria que já existe).
4. Smoke manual em device escrito como checklist do runbook (instalar, login, compra de teste, kill/reabrir, offline).
