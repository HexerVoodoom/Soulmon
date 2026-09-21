# Auditoria — saúde da suíte de testes (somente leitura)

Data: 2026-09-21 · Repo: `D:\Soulmon\repo` · Suíte completa NÃO rodada aqui (outro processo já roda). Nenhum arquivo do repo editado.

## 1. Contagem de arquivos de teste

Comando:
```
for d in src functions workers desktop scripts tests; do echo "$d: $(find $d -type f \( -name '*.test.*' -o -name '*.spec.*' \) -not -path '*/node_modules/*' | wc -l)"; done
```
| pasta | arquivos |
|---|---|
| src | 246 |
| functions | 41 |
| workers | 3 |
| desktop | 11 (`vitest.config.ts` só inclui `desktop/renderer/**`) |
| scripts | 0 |
| tests | 2 |
| **total** | **304** (STATUS 21/09 reporta 301 arquivos / 4206 testes na última execução) |

Observação: `scripts/` (ferramentas de build, `orcamento-de-tempo.mjs`, `docs-delta.mjs`, chroma-key etc.) tem ZERO teste e está fora do `include` do vitest e do `tsconfig.server.json` (declarado no `ci.yml`: "4 erros abertos").

## 2. Pulados / only / todo

Comando: `grep -rnE "\b(it|test|describe)\.(skip|only|todo)\b|\bxit\(|\bxdescribe\(" --include='*.test.*' src functions workers desktop tests`

Resultado: **1 ocorrência**, 0 `.only`, 0 `.todo`.
- `src/assets/assets.contract.test.ts` · `it.skip('DÍVIDA DE ARTE: toda peça do visor é desenhada em escala inteira')` — skip declarado como dívida de arte (15 peças fora da grade: berço + 14 mobílias). Comentário exige tirar o skip no mesmo commit que redesenhar os PNGs. Sem gatilho de data/dono; risco de ficar eterno.

## 3. Tautológicos / frágeis

- `expect(true)` / `expect(1).toBe(1)`: **0** (grep vazio).
- Snapshots (`toMatchSnapshot|toMatchInlineSnapshot`): **0**.
- **Contract tests que fazem grep em string de fonte**: 39 arquivos `*.contract.test.*`; 30 deles usam `readFileSync` sobre código-fonte/docs e afirmam com `toMatch/not.toMatch/toContain`. Isso é análise estática caseira, não prova de comportamento — passa se a string existe, não se a regra funciona. Exemplos concretos:
  - `src/plugins/widgetSemCobranca.contract.test.ts` — lê `renderer` e `plugin`, `expect(codigo).not.toMatch(/task\(s\) left/)`, `.not.toMatch(/total - completed/)` (21 asserções de string).
  - `src/utils/x6Updaters.contract.test.ts` — lê `App.tsx` e `utils/shop.ts`, `.not.toMatch(/instantHeal/)`, `.not.toMatch(/id: 'heart-item'/)`. Renomear o símbolo mantém a funcionalidade e o teste fica vermelho sem defeito; reintroduzir a funcionalidade com outro nome passa verde.
  - `src/deploy/swCache.contract.test.ts` — 20 asserções de string sobre `_headers`/`sw.js` (ex.: `expect(regra('/sw.js')).toMatch(/no-store/)`). Aceitável como guard de config, mas não substitui execução.
  - `src/security/supabase.contract.test.ts` (18), `src/utils/sonsAssets.contract.test.ts` (9), `src/components/ofertaDoisCanais.contract.test.ts` (13), `src/styles/navRotulo.contract.test.ts` (11), `src/utils/dailyGoal.contract.test.ts` (8).
  - Contraste positivo: `tests/swOrigemDaResposta.test.ts` EXECUTA `public/sw.js` num ambiente falso — é o modelo certo.
- **`vi.mock` em massa**: 21 arquivos usam `vi.mock(`; máximo 4 por arquivo (`src/components/ArenaGame.render.test.tsx`); 3 em `src/contexts/GameStateContext.pvpBlocked.test.tsx` e `.cloudErrors.test.tsx`. Não há mock de módulo inteiro de dinheiro/auth do lado servidor — `functions/**` usa `vi.stubGlobal('fetch')` e KV falso, exercitando os handlers reais. Risco moderado só nos `src/utils/auth.*.test.ts` (2 mocks cada: Firebase SDK) — o SDK real nunca roda, esperado.

## 4. Caminhos críticos — exportado × exercitado

Método: `grep -lE "\bSIMBOLO\b"` nos arquivos de teste vizinhos (número = arquivos de teste que citam o símbolo).

### Dinheiro
| arquivo · símbolo | testes |
|---|---|
| `functions/api/billing.js` · `onRequestPost` | `billing.test.js`, `billing.play.test.js` |
| `functions/api/billing.js` · `onRequestOptions` | 1 |
| `functions/api/_billing.js` · `verifyPlayPurchase`, `verifySteamPurchase`, `verifySteamOwnership`, `isPlayPurchaseBoundTo`, `STEAM_ITEMS`, `isSteamOwnershipVoided` | 2 cada |
| `functions/api/_billing.js` · `isPlayPurchaseVoided`, `isSteamPurchaseVoided`, `_resetPlayTokenCache` | 1 (`_billing.steamRefund.test.js` / `_billing.test.js`) |
| `functions/api/_entitlements.js` · `claimOrder`, `grantAdReward` | 3 |
| `functions/api/_entitlements.js` · `applyVerifiedPurchase`, `readEntitlement`, `spendCredits` | 2 |
| `functions/api/_entitlements.js` · `auditRefunds`, `writeEntitlement`, `publicView` | 1 |
| `functions/api/_entitlements.js` · **`requirePaidTier`** | **0 direto** — só indireto via `functions/api/generate-sprite.tier.test.js` (402 para tier demo). Sem teste para entitlement ausente / KV fora / tier inválido. |

### Save
| arquivo · símbolo | testes |
|---|---|
| `functions/api/save.js` · `onRequest`, `onRequestOptions` | `save.test.js` (mais `saveId.parity.test.js`) |
| `functions/api/_kv.js` · `kv`, `kvOrThrow` | `_kv.test.js`, `_kv.fiacao.test.js` |
| `src/contexts/GameStateContext.tsx` · `GameStateProvider`, `useGameState` | 9 arquivos (`bond`, `careCaps`, `cloudErrors`, `hostile`, `hydrate.fuzz`, `legacySave`, `pvpBlocked`, `saveContent`, `storage`) |
| · `migrateDecor` 3 · `getMaxHPForStage` 1 · `CLOUD_SAVE_DEBOUNCE_MS`/`CLOUD_SAVE_MAX_WAIT_MS` 1 | ok |
| `src/utils/accountData.ts` · **`requestExport`, `downloadExport`, `requestDelete`, `confirmDelete`** | **0 por nome**. Só `src/components/AccountDataSection.render.test.tsx` passa pelo módulo via `fetch` stubado (cobre pedido de exclusão e "não toca a rede no mount"). `downloadExport` e `confirmDelete` sem evidência de execução; `TIMEOUT_MS` e erro de rede não testados. |

### Auth
| arquivo · símbolo | testes |
|---|---|
| `functions/api/_auth.js` · `authorizeSaveAccess` 4 · `emailToSaveId` 3 · `requireVerifiedOwner` 3 · `verifyIdToken` 2 | ok |
| `src/utils/auth.ts` · `entrarComGoogle` 5 · `signOut` 6 · `getCurrentEmail` 5 · `getIdToken` 2 · `isAuthConfigured` 2 · `authHeaders`/`criarContaComSenha`/`entrarComSenha`/`mandarResetDeSenha` 1 | ok |
| `src/utils/auth.ts` · **`completeLoginFromLink`, `isPendingLoginLink`, `sendLoginLink`, `startDesktopAuthBridge`, `traduzErroAuth`** | **0**. Login por link mágico e a ponte de auth do desktop não têm teste. `traduzErroAuth` é o mapa de mensagens ao usuário — sem teste, string errada passa. |

### Push
| arquivo · símbolo | testes |
|---|---|
| `functions/api/fcm-subscribe.js` · `onRequestPost`, `onRequestDelete` | `fcm-subscribe.test.js` |
| `functions/api/subscribe.js` · `onRequestPost`, `onRequestDelete` | `subscribe.test.js` |
| `workers/push-scheduler.js` · default worker, `previousSeasonBrt` | `push-scheduler.test.js` (executa o cron com KV/fetch falsos), `pushCopy.parity.test.js`, `vapid.parity.test.js` |
| `workers/push-scheduler.js` · `ageDaysOf` | 0 por nome (só indireto) |
| `workers/webpush.js` · `sendWebPush` · `workers/fcm.js` · `sendFcmPush`, `getFcmAccessToken` | **nenhum teste importa esses módulos diretamente** (`grep -rnE "from ['\"].*webpush"` = 0). Exercitados só indiretamente por `push-scheduler.test.js` com chaves reais (VAPID P-256, RSA) e `fetch` stubado. Endpoint 410/404, token FCM expirado e retry sem teste nomeado. |

### Service worker
- `public/sw.js` registra 6 eventos (`grep -oE "addEventListener\('[a-z]+'" public/sw.js`): `install`, `activate`, `fetch`, `message`, `push`, `notificationclick`.
- `tests/swOrigemDaResposta.test.ts` executa o arquivo real mas só dispara **`fetch`**. **`push` e `notificationclick` (o que o usuário vê na notificação e para onde o clique leva) NÃO têm teste de execução**; `install`/`activate` (precache, limpeza de cache velho) idem. `src/deploy/swCache.contract.test.ts` só confere headers por string.

## 5. Hook e CI — falham quando um Test File quebra?

- `.claude/hooks/session-start.sh` — **NÃO falha e não foi feito para falhar.** `set -uo pipefail` sem `-e`; a linha `GUARD=$( (npx vitest run src/docsManual.contract.test.ts src/docsSemMentira.contract.test.ts 2>&1 | grep -E '^\s+(Test Files|Tests) ' ...) || echo 'guard do manual: não rodou')` só IMPRIME as linhas `Test Files`/`Tests` no briefing. O ajuste da memória (mostrar `Test Files`, não só `Tests`) está aplicado: arquivo que não carrega aparece como `Test Files 1 failed` no texto. Mas: (a) o hook nunca sai com código diferente de 0; (b) com `pipefail`, exit do vitest diferente de 0 propaga e cai em "guard do manual: não rodou" — a linha `Test Files` some, e o leitor precisa saber que "não rodou" pode significar "quebrou"; (c) roda só 2 arquivos, não a suíte. É briefing, não portão.
- `.github/workflows/ci.yml` — **falha corretamente.** Step `Testes (npx vitest run)` sem `continue-on-error`, sem `|| true`, sem filtro. Vitest devolve exit diferente de 0 tanto para teste falho quanto para arquivo que não carrega (erro de import/sintaxe conta como "failed suite"). Antes rodam `tsc` (src), `tsc -p desktop/tsconfig.json`, `tsc -p tsconfig.server.json` e integridade do vendor — todos bloqueantes. `cancel-in-progress` desligado na `main`. Buraco declarado no próprio arquivo: `npm run build` não roda em PR.
- Risco residual: `CLAUDE.md` pede `npx vitest run` manual antes do commit e o fluxo real é push direto na `main` (D-24) — o CI acende DEPOIS do merge, não antes.

## 6. Flakes conhecidos (docs/STATUS.md)

Comando: `grep -niE "flake|flaky|intermitente" docs/STATUS.md` → 3 linhas.
1. STATUS 21/09 ("flake 1 em 11") — flake do **arnês de som** (`prototyper/`, Chrome/CDP com porta `9500 + pid % 400`), não da suíte vitest. Consertado lendo `DevToolsActivePort` com `--remote-debugging-port=0`; 11/11 verdes. Fora do escopo do vitest.
2. STATUS (bloco antigo, 2ª rodada de emojis) — `src/assets/assets.contract.test.ts` "vermelho intermitente na suíte cheia enquanto outro agente reescreve PNGs". Causa: árvore compartilhada, não o teste. O arquivo ainda existe; o incidente de timeout foi tratado na origem (`squad-alpha-runs/soulmon-02/sweeper/flake-assets-contract.md`: 1242 ms → 14 ms) e o piso global subiu para 15 s (`vitest.budget.mjs` · `TEST_TIMEOUT_MS`). Sobrou dentro do arquivo um `it(..., 60_000)` — teste com teto próprio 4× o global; candidato a aparecer no orçamento.
3. Branch `fix/flake-assets-contract` ainda aparece em `.git/logs/refs/heads/` — conferir se foi mergeada ou é lixo.

## 7. Orçamento de tempo

- `vitest.budget.mjs`: `TEST_TIMEOUT_MS = 15_000`; `LIMIARES` atenção 10% (1500 ms) · dívida 25% (3750 ms) · crítico 50% (7500 ms).
- `scripts/orcamento-de-tempo.mjs` roda a **suíte inteira N vezes** (`--rodadas`, padrão 2). **Não rodado**: viola a regra desta tarefa (suíte completa já em execução noutro processo) e não é barato (2× a suíte, e a contenção falsearia a própria medida).
- Baseline existente: `squad-alpha-runs/soulmon-02/sweeper/orcamento-de-tempo.md`, snapshot **2026-08-27, 172 arquivos** — pior caso 1585 ms (10,57%), 1 teste em atenção, 0 em dívida/crítico. **Desatualizado**: suíte hoje tem 304 arquivos (+77%); nenhum passe de orçamento registrado desde então. Quem está perto do limite hoje é desconhecido. Recomendação: `npm run orcamento -- --rodadas 3` com a máquina livre e guardar o snapshot.

## Resumo de criticais
1. Sem teste: `src/utils/auth.ts` login por link mágico (`sendLoginLink`/`completeLoginFromLink`/`isPendingLoginLink`), `startDesktopAuthBridge`, `traduzErroAuth`.
2. Sem teste de execução: `public/sw.js` eventos `push`/`notificationclick`/`install`/`activate`.
3. `functions/api/_entitlements.js` · `requirePaidTier` só indireto; `src/utils/accountData.ts` · `downloadExport`/`confirmDelete` sem evidência.
4. `workers/webpush.js`/`workers/fcm.js` sem teste direto (410/404/token expirado).
5. 30 contract tests são grep de fonte — passam por presença de string, não por comportamento.
6. Baseline de orçamento de 25 dias atrás cobre 57% dos arquivos atuais.
7. Hook de sessão não é portão (nunca falha); portão real é o CI, que acende depois do push na main.
