# Security review: gate do Sweeper (`beta-play-01`, release/beta-1)

| Campo | Valor |
|---|---|
| Autor | alpha-security (somente leitura) |
| Data | 2026-10-11 |
| Base | `E:/soulmon-beta-rel` (`git diff origin/main...HEAD`), `discovery/threat-model-beta.md` R1–R10, `sweeper/abuso-e-custo.md` |
| Testes executados | `rtdn`, `betaAccess`, `billing.subscription`, `killSwitch`, `crash`, `chat.actions`, `subscriptionBoundary.contract`: 7 arquivos, 186 testes, todos passaram |
| Legenda | **BB** = bloqueia o beta · **BP** = bloqueia a produção · **OK** = implementado ou risco aceito |

## 1. Achados

| # | Achado | Arquivo:linha | Sev. |
|---|---|---|---|
| S1 | **BETA_CLOSED não cobre as rotas de escrita social.** `betaGate` só existe em `save.js:206`, `billing.js:105` e `_aiGuard.js:311` (o que cobre chat, sprite, transcrição e sugestões). `community.js:350-352` (`denyUnlessOwner`), `guild.js:286`, `entitlements.js:143/187`, `subscribe.js:201` e `fcm-subscribe.js:123` usam só `authorizeSaveAccess`. Quem tem conta Google e não está na lista consegue gravar `profile:`/`pid:` (e aparecer no diretório dos testers), entrar ou criar guilda, presentear, registrar push e gastar escrita de KV, que é o recurso mais curto do free tier (V4). O contrato do módulo ("não acessa save, IA nem compra") é cumprido, mas o objetivo do beta fechado não. **Correção:** chamar `betaGate(env, auth, 'core')` dentro de `authorizeSaveAccess` (depois da lápide), ou em cada rota acima. `account.js` (export/exclusão) deve continuar **fora** do gate, por direito do titular. | ver ao lado | **BB** |
| S2 | O caminho de cache hit do sprite (`generate-sprite.js:444-459`) autoriza sem `betaGate`. Não tem custo de IA, e quem está fora da lista não tem sprite próprio em cache. | `generate-sprite.js:459` | OK |
| S3 | O BETA_CLOSED é fail-closed. Sem `FIREBASE_PROJECT_ID`, `auth.email` fica indefinido, `betaAllows` devolve false e a resposta é 403. `parseBetaEmails` normaliza do mesmo jeito que o saveId. | `_betaAccess.js:42-56` | OK |
| S4 | O OIDC do RTDN está correto: RS256 com `kid` no JWKS, `iss` nos dois formatos da Google, `aud === RTDN_AUDIENCE`, `email_verified === true`, `email` igual à SA de push, `exp` vencido recusado e `iat` com até 5 min de futuro. Sem configuração responde 503 e nunca lança. O payload só dispara um re-GET. Achado menor: o refetch forçado do JWKS tem piso de 60 s, mas um `kid` inválido força o refetch e pode prender o cache velho por 60 s. Impacto desprezível. | `_pubsubAuth.js:74-108` | OK |
| S5 | No RTDN, a idempotência por `messageId` é "consulta, processa e marca", sem atomicidade. Uma entrega em paralelo pode processar 2 vezes, mas o efeito é idempotente (re-GET e `applySubscriptionState` com o estado da Google). | `rtdn.js:105-145` | OK |
| S6 | A rota admin `top-ai` e o GET de `crash` usam `X-Metrics-Key` com `secretEquals` (XOR sem early-return; vaza só o tamanho), respondem 404 sem a var e aplicam rate limit antes da comparação. A chave só é aceita por header, nunca por query. O privilégio de admin vem de token Firebase verificado e de `ADMIN_EMAILS`, e sem `FIREBASE_PROJECT_ID` ninguém é admin. | `top-ai.js:32-35`, `crash.js:229`, `metrics.js:634`, `_admin.js:61-73` | OK |
| S7 | `top-ai` lê `list({limit:1000})` sem cursor. Acima de 1000 chaves por bucket, o ranking fica incompleto em silêncio. Isso não é falha de segurança, mas cega o alerta de abuso. | `top-ai.js:42` | BP |
| S8 | As chaves de IA vão em header: Groq por `Authorization` e Gemini por `x-goog-api-key` (`_llm.js:72,139`, `generate-sprite.js:296`, `suggest-tasks.js:73`). A exceção é a **Steam Web API, que exige `?key=` na URL** (`_billing.js:459,517,582,634,663`). Alguns `console.error(..., err)` logam o objeto de erro inteiro (`_billing.js:153,505,523,574,588,643,672`). Hoje o erro do `fetch` no Workers não carrega a URL, mas isso não é garantido. Ficou fora do escopo da Play. **Correção:** logar só `err.message` truncado, como já é feito nas linhas 314 e 424. | `_billing.js` | BP |
| S9 | O IP nunca é gravado em claro. `_ipHash.js` grava HMAC-SHA256 com `IP_HASH_SALT`, truncado em 16 hex, com TTL de 30 d, e sem o sal não grava nada. Usa só `CF-Connecting-IP`. O `_rateLimit.js:37-41` guarda o IP cru **só na memória do isolate**. Ali cai em `X-Forwarded-For` quando falta o header da CF, o que só acontece fora da Cloudflare. O `crash.js` não guarda IP, UA nem saveId, e o servidor faz o próprio `scrub`. | `_ipHash.js:21-32` | OK |
| S10 | Ações do chat: o modelo só propõe, nunca grava. Há allowlist de 5 ferramentas e só os campos declarados são lidos. O `cleanName` remove controle, bidi, `<>{}[]|\` e crase, passa por `minimizeForAi` e corta em 60. Enums são fechados, números têm faixa, há no máximo 2 ações e `args ≤ 2000`. `intentAllows` exige pedido explícito na mensagem do usuário (`chat.js:412,673`). O cliente revalida (`src/utils/chatActions.ts`), com teste de paridade. | `_chatActions.js:99-197` | OK |
| S11 | `CHAT_DISABLED` responde 503 antes de gastar cota (`chat.js:586`). `BILLING_DISABLED` recusa compra nova antes do claim e do ack, mas restaurar o que já é da conta continua valendo (`billing.js:62-68`). | idem | OK |
| S12 | A lápide preserva `aiLifetime.sprite` e `aiForms`, com TTL de retenção. Excluir a conta e relogar não devolve gerações. | `account.js:701-702` | OK |
| S13 | `BetaClosedGate.tsx` é só UX. A trava real é do servidor (S1). Não renderiza dado do servidor, então não há vetor de injeção. | `src/components/BetaClosedGate.tsx:48-53` | OK |
| S14 | CSP sem mudança nesta release: `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'` e scripts por hash, sem `unsafe-inline` em script. Fica o resíduo de `style-src 'unsafe-inline'` e `img-src https:` amplo, que é pré-existente. | `public/_headers:58` | OK (BP: estreitar `img-src`) |

## 2. R1–R10 da assinatura

| R | Status | Evidência |
|---|---|---|
| R1 | OK. SKU, conta (`obfuscatedExternalAccountId` sempre exigido) e estado são verificados só no servidor. **Desvio consciente:** `CANCELED` também concede até `expiryTime`, o que é coerente com R7 ("mantém até expirar"). | `_billing.js:251-255,342-363` |
| R2 | OK. `until` = max(`expiryTime`). Do corpo só é lido `purchaseToken`. | `_billing.js:357-359`, `billing.js:177-196` |
| R3 | OK. Ack no servidor só se estiver PENDING, e 400 conta como já reconhecido. O plugin consulta SUBS. O RTDN também faz ack de compra ainda não reivindicada. | `_billing.js:410-421`, `BillingPlugin.kt:134,167`, `rtdn.js:68-69` |
| R4 | OK. O claim é `play:sub:<sha256 da raiz>`, com cadeia de até 5 saltos. Erro transitório aborta em vez de adivinhar a raiz. | `_billing.js:271-336` |
| R5 | OK. Coberto pelo guard `src/security/subscriptionBoundary.contract.test.ts`, que passa. O RTDN só escreve `ent.sub`. | `rtdn.js:16-17` |
| R6 | OK. Oferta com `offerId` é recusada. A checagem de "base plan sem trial" no Console fica com o dono. | `_billing.js:350` |
| R7 | OK. Ver S4 e S5. Pacote errado ou payload malformado respondem 2xx, e falha da Google responde 5xx. | `rtdn.js:91-147` |
| R8 | **BP.** O reembolso fecha a vitrine futura via re-GET (`voided` productType 1). O bloqueio de novos resgates por 90 d não foi implementado porque a política ainda depende de decisão do dono. Impacto zero com licença de teste. | `rtdn.js:130-133` |
| R9 | OK. `maskToken` mostra 4+2 caracteres e o tamanho, o saveId sai truncado em 8 e o JWT nunca é logado. | `_billing.js:268`, `rtdn.js:84-87`, `_pubsubAuth.js:72` |
| R10 | OK. Sem SA ou package responde 503. Em caso de dúvida, nada é concedido nem retirado. | `_billing.js:279-288,307-316` |

## 3. Itens "antes do beta" do relatório de abuso

- V4.2 (teto de escrita do save) e 6.3 (`FIREBASE_PROJECT_ID` presente) são verificações de deploy, não de código. Ficam no **checklist do dono**: rodar `wrangler secret list` e confirmar que `POST /api/chat` sem Bearer responde 401. Sem `FIREBASE_PROJECT_ID`, o BETA_CLOSED recusa tudo (S3), mas `community`/`guild` ficam abertos por saveId inventado.
- Teto global de IA, alerta ao dono (`_adminAlert.js`, 1×/tipo/dia, sem PII), top consumidores, kill-switches, hash de IP e cota de transcrição estão presentes.

## 4. Fora de escopo (risco aceito, não inexistente)

- Não revisei `save.js` além do gate e do ip-hash, nem o pipeline de sprite (custo/qualidade) e o `transcribe.js` além da cota.
- Não revisei as permissões de CI/build, as dependências (`npm audit`) e o lado nativo além do `ProductType.SUBS`.
- Não fiz teste dinâmico contra o deploy: valores de segredo, rota de Rate Limiting da CF e configuração do push no Pub/Sub (aud = URL exata).
