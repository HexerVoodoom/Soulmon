# Segurança — rodada A · diff `11e9b237..4a8b8049`

Escopo lido: `functions/api/{_entitlements,entitlements,account,subscribe,fcm-subscribe}.js` + testes,
`public/_headers`, `public/sw.js`, `index.html`, `scripts/convert-to-webp.mjs`, `package.json`,
`.github/workflows/android-build.yml`, `android/{variables,app/build}.gradle`, `docs/PLAY-LANCAMENTO.md`,
e o cliente `src/utils/{accountData,notifications}.ts` para fechar o fluxo de push.
`workers/` NÃO mudou no diff (só conferido que não lê `saveId`).

Sem CRÍTICO novo. 1 ALTO, 2 MÉDIO, 4 BAIXO, resto INFO.

## ALTO

### A1. `deletePushSubscriptions` faz 1 `get` por chave do namespace inteiro — exclusão de conta quebra no meio quando houver ~1k inscrições
`functions/api/account.js` › `deletePushSubscriptions`, `handleDeleteConfirm` passo 2b.
- Varre `push:*` e `fcm:*` (até `MAX_SCAN_PAGES`=20 × 1000 chaves) e chama `pushStore.get(key)` em CADA uma para ler `rec.saveId`. Namespace é por APARELHO, não por conta — cresce mais que `profile:`.
- Workers: KV `get` conta no teto de subrequests por request (1000 no plano pago, 50 no free). Com >~900 inscrições no total (não do titular), o request estoura e lança.
- Cenário: ordem no código é save → profile → rank → scrub de amigos (já gasta N gets em `profile:`) → push → entitlement → `DEL_PREFIX`. Estouro em 2b deixa: save apagado, entitlement NÃO minimizado (uso de IA/anúncios fica), `del:<saveId>` pendente fica, cliente recebe 500 e a resposta `naoIncluido` que declara o que sobrou nunca sai. Retentar repete o estouro — falha permanente. Vetor de abuso: anônimo infla o namespace com POSTs válidos em `/api/subscribe` (rate limit é Map por isolate, amortecedor de custo, não controle).
- Conserto: (a) índice inverso `pushidx:<saveId>` → `[chave...]` escrito em `subscribe.js`/`fcm-subscribe.js` quando `saveId` vem (1 put, mesma TTL); `deletePushSubscriptions` lê só o índice — O(1); (b) enquanto não houver índice, mover 2b para DEPOIS do entitlement e do `DEL_PREFIX` e envolver em try/catch que só reporta no `executado` — exclusão do que o titular pediu não pode depender de varredura sem teto de subrequests; (c) teste em `account.test.js` com fakeKV de 1.500 inscrições alheias afirmando que a exclusão fecha inteira.
- Verificação QA: popular KV de preview com 1.200 `push:*` e rodar `delete-request`/`delete-confirm`; esperado hoje = 500 "Too many subrequests" (ou equivalente).

## MÉDIO

### M1. `saveId` nas inscrições de push é dado pessoal novo (hash do e-mail) num registro de 1 ano que NÃO entra no export do titular
`functions/api/subscribe.js`/`fcm-subscribe.js` › `registro.saveId`; `functions/api/account.js` › `NOT_INCLUDED`, `collect`.
- Antes: inscrição anônima (endpoint/token + petName). Agora liga aparelho ↔ conta. Retenção (TTL 1 ano) e base legal do contexto §6 valem para o campo novo — pergunta ao dono jurídico, nada afirmado aqui. `collect` do export continua não entregando essas linhas embora agora consiga achá-las.
- Conserto: incluir `push:*/fcm:*` com `saveId` igual no export (endpoint mascarado + `refreshedAt` + `language`), ou declarar em `NOT_INCLUDED` por que não. Registrar o ativo novo no `threat-model.md`.

### M2. `SoulmonAlarmPlugin.kt` chama `setExactAndAllowWhileIdle` sem `canScheduleExactAlarms()` nem `catch SecurityException`
`android/app/src/main/java/com/hexervoodoom/soulmon/plugins/SoulmonAlarmPlugin.kt:70`; manifesto declara `SCHEDULE_EXACT_ALARM`.
- Pré-existente ao bump 35→36 (regra vale desde target 33/Android 14: permissão especial negada por padrão para app novo). O bump reafirma o alvo e `PLAY-LANCAMENTO.md §G` não menciona. Sem a permissão, a chamada lança `SecurityException` — crash no `schedule`, não aviso. Só o que está no código: nenhuma guarda, nenhum fallback para `setAndAllowWhileIdle`/`setWindow`.
- Conserto: `if (Build.VERSION.SDK_INT >= 31 && !alarmManager.canScheduleExactAlarms()) → setWindow/setAndAllowWhileIdle`, ou remover `SCHEDULE_EXACT_ALARM` (nudge de pet não precisa de exatidão). Política da Play sobre exact alarm: [verificar no Console, sem fonte no repo].
- Android 16 (API 36) comportamentos novos: não afirmo além do que o código evidencia; item para `alpha-compliance`/dono checar a lista oficial de behavior changes para target 36 antes do upload.

## BAIXO

### B1. `handleGrant` 404 vs 400 revela que a rota existe mesmo sem chave
`functions/api/entitlements.js` › `handleGrant`, `onRequestPost`. `action=grant` sem env → 404 `Not found`; `action=steal` → 400. Comentário promete "a rota NÃO EXISTE"; sonda distingue. Mesmo padrão de `metrics.js`. Conserto: devolver o mesmo 400 "Unknown action" da rota implícita, ou só registrar. `OPTIONS`/`GET` ignoram `action` — fail-closed OK para o único método que importa (POST).

### B2. `docs/PLAY-LANCAMENTO.md` E.1 "Feito quando" põe segredo na linha de comando
`METRICS_ADMIN_KEY=… APP_URL=… node scripts/metrics-report.mjs` → histórico do shell. Contradiz o próprio §E ("o valor é pedido no prompt, nunca vai na linha"). Conserto: `read -s` + export, ou `.dev.vars`. Fora isso o roteiro está correto: tudo por `wrangler secret put`, nenhum passo manda segredo para `wrangler.jsonc`/git; `wrangler.jsonc` e `workers/wrangler.toml` não contêm `*_ADMIN_KEY` (grep limpo).

### B3. Rate limit do grant é amortecedor, não controle — a chave é a única barreira real
`GRANT_RATE` 10/min por IP em `Map` por isolate (`_rateLimit.js` declara). Sonda distribuída ignora. Aceitável SÓ porque a chave é `openssl rand -hex 32` (256 bits). `secretEquals`: compara length primeiro (vaza tamanho, irrelevante para chave fixa), XOR por char — constante o bastante em JS. Header-only (`Authorization: Bearer`), nunca query — não entra em log de acesso. Log grava `saveIdPrefix` 8 hex (32 bits do hash do e-mail) — mesmo nível do resto, não é vazamento novo. Conserto opcional: binding Rate Limiting da Cloudflare quando provisionado.

### B4. `npm audit --omit=dev`: 3 vulns (1 crítico, 2 altos) — melhorou de 1C+5A; TODAS via `@capacitor/cli` (ferramenta de build em `dependencies`)
```
@xmldom/xmldom 0.9.10  high     (via @capacitor/cli > plist)
brace-expansion 5.0.6  high     (via @capacitor/cli > rimraf > glob > minimatch)
tar 7.5.16             critical (via @capacitor/cli)
3 vulnerabilities (2 high, 1 critical) — fix available via `npm audit fix`
```
Nenhuma chega ao bundle do cliente nem ao Worker (`@capacitor/cli` roda só em `cap sync`). Conserto: mover `@capacitor/cli` para `devDependencies` (aí `--omit=dev` zera) + `npm audit fix`. Sumiram: radix-ui ×26, supabase-js, hono, recharts, react-hook-form etc. — superfície de supply chain reduzida de verdade; `package-lock.json` acompanhou (−3.012 linhas).

## INFO

- I1. **Push: quem apaga o quê.** `DELETE /api/subscribe|fcm-subscribe` não mudou: bearer = conhecer o endpoint/token, sem saveId. Atacante que conhece o e-mail da vítima (→ saveId) pode gravar a PRÓPRIA inscrição com o saveId dela: na exclusão da vítima, a inscrição DELE é apagada (dano para quem mentiu); na exclusão dele, `rec.saveId !== saveId` protege a vítima — igualdade estrita, testado ("NÃO as de outro"). Para apagar a inscrição da vítima ele precisaria do endpoint dela, que já bastava antes. Modelo fechado. `revokePushBeforeDelete` (cliente, `src/utils/accountData.ts`) usa `allSettled` e não autentica — coerente com bearer-por-endpoint.
- I2. **`cacheavel` `status === 200`.** Estrita (subconjunto de `ok`): nada novo passa a ser cacheado; tira 206 do `<video>`. 5 pontos de uso em `public/sw.js`, todos mais restritos. OK.
- I3. **CSP.** Recalculei os 4 hashes dos `<script>` inline de `index.html@4a8b8049`: batem 1:1 com `public/_headers`. Script do gate lê `navigator.language`/`navigator.userAgent`, monta DOM com `createElement`+`textContent`; único `innerHTML` é `raiz.innerHTML = ''` (limpeza). Sem `localStorage`, sem caminho de injeção. Comentário em `_headers` diz "TRÊS" scripts e lista quatro hashes — texto desatualizado, sem efeito.
- I4. **`convert-to-webp.mjs`.** Substitui `nome-HASH8.png` literal em `dist/**/*.{js,css,html,json,webmanifest,map}`. Colisão em string não-URL exige mesmo nome+hash em outro contexto — improvável. `dist/_worker.js/index.js` tem 0 refs `.png`; `functions/` e `workers/` também. Passo 3 falha o build se sobrar ref antes do `unlink` — fail-closed. Residual: `readFile(utf8)`+`writeFile` em arquivo com bytes inválidos UTF-8 reescreveria com perda — só se contiver a ref; baixo.
- I5. **`grantCourtesy`.** Contador sobe antes da concessão (vaga perde, tier não aparece) — direção certa. Corrida read-modify-write reconhecida; passa do teto por 1–2 no máximo. `orderId=courtesy:<saveId>` idempotente por construção, `grantCredits:0` testado. `auditRefunds` curto-circuita `provider==='courtesy'` (teste com fetch stub que lança). `publicView` só expõe `provider` quando `tier==='paid'` — não vaza `orderDetails`.
- I6. **CI.** `android-build.yml` só renomeia artefato; actions continuam pinadas por SHA. `versionCode` 15 manual. Billing 6.2.1 mantido de propósito e documentado — exigência da Play `[a confirmar no Console]`, sem fonte no repo (correto não afirmar).

## Fora de escopo / não modelado
- `workers/` (push-scheduler, fcm, webpush) — sem diff; não reli.
- `_billing.js`, D1 `order_claims`, Firebase Auth — sem diff.
- Comportamentos de Android 16 além do que o código evidencia; políticas da Play (exact alarm, Billing ≥7/8) — dono/`alpha-compliance` com fonte primária.
- Base legal e retenção do `saveId` em push (M1) — decisão do dono jurídico, não afirmada aqui.
