# Threat model: beta fechado Play + assinatura cosmética trimestral (`beta-play-01`, Fase 0)

| Meta | Valor |
|---|---|
| Autor | alpha-security · 2026-10-11 |
| Base | `contexto.md` §5/§6/§10 · código em `main` (leitura) · `docs/STATUS.md` §SEC · `docs/ASSINATURA-SPEC.md` (D10) |
| Padrão de verificação | **Nenhum declarado no contexto.** Proposta: OWASP MASVS L1 (app) + ASVS L1 nas rotas de dinheiro/auth. **Decisão do dono pendente.** |
| Exigência legal | Só o que está no contexto §6 (Play Data Safety, LGPD citada em `E0-CONSENTIMENTO.md`). Nada aqui afirma o que a lei exige. |

## 1. Ativos

| Ativo | Sensibilidade | Onde vive | Retenção | Quem acessa |
|---|---|---|---|---|
| `GOOGLE_PLAY_SERVICE_ACCOUNT` (chave RSA) | crítica: emite token `androidpublisher` (lê compras, pode reembolsar e revogar) | secret do Worker | até rotação | Worker |
| Chave de upload do AAB (nova) | crítica | máquina do dono (`E:/`/`D:/`), **nunca no repo** | permanente + backup offline | dono |
| Entitlement (`tier`, `credits`, `consumedOrders`, `orderDetails` com `purchaseToken`) | alta: dinheiro | KV `SOULMON_SAVES` | regra atual do `_entitlements.js` | Worker |
| `order_claims` (order_id → save_id) | média | D1 `soulmon-billing` | `expires_at` (migração 0002) | Worker |
| Estado da assinatura (novo: `subUntil`, `subToken`, `linkedPurchaseToken`) | média | entitlement | **proposta:** token até 90 d após expirar/revogar; `subUntil` enquanto existir a conta | Worker |
| `saveId` (= hash do e-mail) | média: pseudônimo estável | save, `obfuscatedAccountId` na Play | da conta | Worker, Google |
| `google-services.json` (API key Firebase) | baixa: pública por desenho, mas tem que ter restrição | repo | n/a | todos |

**Coleta nova da assinatura:** nada além de token + vigência. Não guardar `paymentState`, preço, país nem `priceChange`. Dado não coletado não vaza.

## 2. Fronteiras de confiança

1. **App → Worker** (`/api/billing`): o corpo (`productId`, `purchaseToken`, `id`) é do atacante. Verificado: Firebase ID token (`authorizeSaveAccess`) e depois a Play.
2. **Worker → Google** (`androidpublisher`): fonte da verdade de compra/vigência.
3. **Google → Worker** (RTDN via Pub/Sub push, **novo**): mensagem não autenticada por padrão. Tem que ser autenticada (§4 R7).
4. **Worker → regra de jogo:** a vigência da assinatura **não cruza** esta fronteira (D10).

## 3. Achados abertos e classificação

Legenda: **BB** bloqueia beta · **BP** bloqueia produção · **OK** aceitável no beta (risco aceito, com motivo).

| # | Achado | Evidência | Classe | Controle / ação |
|---|---|---|---|---|
| F1 | **SEC-3: o STATUS está desatualizado.** O binding D1 `DB` já existe em `wrangler.jsonc` (commit `8073f09ad`, 07/09), então `claimOrderAtomic` roda. Ninguém verificou se as migrações `0001`/`0002` foram aplicadas no D1 **remoto**. Sem a tabela, o `INSERT` lança erro e toda compra vira 500 (falha fechada, mas quebra a métrica §4d). | `wrangler.jsonc` d1_databases; `STATUS.md:4379-4410` diz o contrário | **BB** (por funcionalidade) | Dono: `wrangler d1 migrations apply soulmon-billing --remote`. QA: compra de teste duplicada em 2 contas → a 2ª recebe 409 `order-in-use`. Atualizar a linha SEC-3 do STATUS. |
| F2 | **SEC-4: `PLAY_REQUIRE_ACCOUNT_BINDING` está desligada.** O cliente já manda `setObfuscatedAccountId(saveId)` (`playBilling.ts:96`, `BillingPlugin.kt:156`). Ninguém tem app antigo em produção, então não existe motivo de compatibilidade para deixar desligada. | `_billing.js` `isPlayPurchaseBoundTo` | **BB** | Dono: var `PLAY_REQUIRE_ACCOUNT_BINDING=true`. QA: token sem `obfuscatedExternalAccountId`, ou com outra conta → 403 `account-mismatch`. |
| F3 | O `acknowledge` só consulta `ProductType.INAPP`. Uma assinatura nunca seria reconhecida e a Play estorna em 3 dias. | `BillingPlugin.kt` ~linha 133 | **BB** (para a assinatura) | Ver R3. |
| F4 | O acknowledge depende só do cliente. Se o app fechar entre o verify e o ack, ou se o verify der 5xx transitório, o vitalício é estornado sozinho em 3 dias. | `playBilling.ts:163` | **OK no beta** / **BP** | Na produção: o servidor faz `purchases.*.acknowledge` (idempotente) no verify ok, e o cliente reconcilia `queryPurchases` na abertura. |
| F5 | `verifyPlayPurchase` não lê `purchaseType`: a compra de licença de teste (`purchaseType=0`) é aceita como real. No beta é o comportamento desejado. | `_billing.js` | **OK no beta** / **BP** | Gravar `test: true` no `orderDetails`. Na produção, recusar `purchaseType===0` fora de uma allowlist de contas de teste, ou pelo menos marcar e excluir das métricas de receita. |
| F6 | `/api/billing` não tem rate limit, e o balde do `_rateLimit.js` é por isolate. | `grep rateLimit` não acha `billing.js` | **OK no beta** (exige auth, 15 pessoas) / **BP** | Regra de Rate Limiting da Cloudflare em `/api/billing*` e `/api/rtdn`. Está no `STATUS.md:40` como pendente do dono. |
| F7 | Keystores do DigiApp no histórico (`c47776e51`, repo **público** `HexerVoodoom/Soulmon`). São do package `com.digipartner.digiapp`, não do Soulmon. | `STATUS.md` §1.4 | **OK** para o Soulmon / ação no DigiApp | Rotacionar a chave de upload do DigiApp (formulário Play). Para o Soulmon: a keystore nova nasce fora do repo. `.gitignore` deve ganhar `*.jks`, `*.keystore` e `keystore.properties`, e um guard deve reprovar esses arquivos no commit. |
| F8 | `google-services.json` versionado com a API key `AIza…`. Ela é pública por desenho, mas só é inofensiva com restrição. | `android/app/google-services.json` | **BB (verificação de 5 min)** | Dono: no Cloud Console, restringir a key a package + SHA-1 (debug, upload e **App Signing**) e às APIs Firebase usadas. O SHA de App Signing também precisa entrar no Firebase, senão o login do APK da Play quebra. |
| F9 | A CSP tem `img-src … https:` aberto, e o host do CDN do Higgsfield está pendente. | `public/_headers:58`, `STATUS.md:4263` | **OK no beta** | Fechar quando o host for fixado. `csp.test.ts` já trava regressão. |
| F10 | `.env.production` versionado (só `VITE_*` públicas). | `.gitignore` exceção | **OK** | Guard: reprovar qualquer chave sem prefixo `VITE_` nesse arquivo. |
| F11 | A spec D10 diz que a assinatura precisa de "outro escopo de service account". **Isso está incorreto:** o escopo é o mesmo (`androidpublisher`). Muda o endpoint (`purchases.subscriptionsv2`) e a permissão da conta no Play Console (ver dados financeiros e gerenciar pedidos/assinaturas). | `ASSINATURA-SPEC.md` tabela | doc | Corrigir a spec. O dono confere as permissões da service account no Console. |
| F12 | O `auditRefunds` faz polling 1x/dia por conta e só conhece `purchases.products`. | `entitlements.js:146` | **OK no beta** | RTDN (R7) passa a ser a via primária para a assinatura. O polling continua como rede. |

Também verifiquei: SEC-1, SEC-2 e SEC-5 estão fechados conforme o STATUS. **Não reabri** a análise desses.

## 4. Requisitos de segurança da assinatura (para `alpha-architect` / `alpha-backend`)

| ID | Requisito | Verificação executável (`alpha-qa`) |
|---|---|---|
| R1 | **Verificação só no servidor.** Novo ramo em `verifyPlayPurchase` com `GET …/purchases/subscriptionsv2/tokens/{token}`. Conceder só se `subscriptionState ∈ {ACTIVE, IN_GRACE_PERIOD}`, se `lineItems[].productId` bater com o SKU do catálogo e se `externalAccountIdentifiers.obfuscatedExternalAccountId === saveId`, com a flag F2 valendo. `PRODUCTS` ganha a entrada `{ kind:'subscription', grantTier:null, grantCredits:0 }`. | Teste unitário com mock: estados ACTIVE, GRACE, ON_HOLD, PAUSED, EXPIRED, PENDING; productId trocado; conta trocada. Só os 2 primeiros concedem. `grantCredits` e `grantTier` da assinatura são sempre 0/null (teste de catálogo). |
| R2 | **`subUntil` vem da Google, nunca do cliente.** É `max(lineItems.expiryTime)`. Nenhum campo do corpo da requisição escreve vigência. | Teste: corpo com `subUntil`/`expiry` forjado é ignorado. |
| R3 | **Acknowledge em 3 dias.** O servidor chama `purchases.subscriptions.acknowledge` (ou `acknowledgementState` já reconhecido) depois do verify ok. O cliente também reconcilia com `queryPurchasesAsync(SUBS)`. O plugin passa a aceitar SUBS. | Teste de contrato: `BillingPlugin.kt` consulta `ProductType.SUBS`. Teste: verify ok → 1 chamada de acknowledge; repetir não quebra (idempotente). Teste manual em licença de teste: a assinatura continua ativa depois de 3 dias (renovação acelerada de teste: ~5 min = 1 mês). |
| R4 | **`linkedPurchaseToken`:** num upgrade, reassinatura ou troca de plano, o token antigo é **invalidado** no nosso registro. O novo herda a conta do antigo e nunca abre uma 2ª conta. `order_claims` usa a chave `play:sub:<linkedPurchaseToken raiz>` (cadeia), não o `orderId` de cada renovação (`GPA.xxxx..0`, `..1`). | Teste: token B com `linkedPurchaseToken=A`, onde A foi reivindicado por X → B só vale para X (Y recebe 409). As renovações `..0`/`..1` não geram claims novos. |
| R5 | **Vigência NUNCA é lida por regra de jogo.** `subUntil` só destrava a **vitrine do trimestre** (`unlock.kind:'subscription'`, só `bg`/`furniture`). Itens entregues viram posse permanente (sem retirada ao expirar ou cancelar; o reembolso segue a política F13 abaixo). | **Guard de grep/AST:** `subUntil`/`subscription` não aparece em `_combate`, `_duel`, `_bond`, `_gates`, `_soulXP`, `_talents`, `_equipment`, `_forge`, `_mealRhythm`, `src/utils/{combat,care,evolution,…}`. Allowlist: só `_entitlements.js`, `_billing.js`, `billing.js`, `rtdn.js`, `src/utils/shop.ts` e a vitrine. Teste: os itens da assinatura têm categoria ∈ {bg, furniture} e não estão em `SHOP_ITEMS` com preço (anti double-dip). |
| R6 | **Sem trial, sem Créditos.** Recusar oferta com fase gratuita: se `lineItems[].offerDetails` tiver `offerTags`/fase de preço 0, logar e **não conceder a mais**. A configuração certa é no Console (sem free trial). | Teste: o catálogo da assinatura tem `grantCredits===0`. Checklist do dono: base plan sem free trial. |
| R7 | **RTDN autenticado.** Endpoint `POST /api/rtdn` (Pub/Sub push) com **OIDC token** do Pub/Sub. Validar a assinatura do JWT (JWKS Google), `aud` = URL do endpoint e `email` = service account de push. O payload **nunca é confiado**: ele só dispara um re-GET em `subscriptionsv2` (R1). Idempotente por `messageId`. Tratar `SUBSCRIPTION_RENEWED/RECOVERED` (estende `subUntil`), `CANCELED` (mantém até expirar), `EXPIRED/REVOKED/ON_HOLD/PAUSED` (fecha a vitrine **futura**), `voidedPurchaseNotification` (reembolso) e `testNotification`. Resposta 2xx rápida. Erro → 5xx para o Pub/Sub tentar de novo. | Teste: sem Bearer → 401; JWT com `aud` errado → 401; payload dizendo ACTIVE com Google respondendo EXPIRED → fica EXPIRED; a mesma `messageId` 2x → 1 efeito. Manual: "Enviar notificação de teste" do Console chega e é logada sem PII. |
| R8 | **Reembolso/revogação (F13, decisão do dono):** D10 diz "entregue não é retirado ao cancelar". Reembolso é outro caso. **Proposta:** reembolso fecha a vitrine e bloqueia novos resgates, mas não retira o já entregue (mesma família da tese do produto). Isso precisa de **confirmação do dono**, porque abre um abuso de assinar → resgatar → reembolsar. No beta com licença de teste o impacto é zero. | Teste conforme a decisão escolhida. |
| R9 | **Log sem token.** `purchaseToken`, `linkedPurchaseToken`, `obfuscatedAccountId` e o JWT do Pub/Sub passam por `_redact.js`. | Teste: o log do verify/RTDN não contém o token (padrão do `_redact.test.js`). |
| R10 | Fail-closed preservado: sem `GOOGLE_PLAY_SERVICE_ACCOUNT` → 503 e nada concedido. Na dúvida (null), **mantém** o que já foi entregue. | Teste existente estendido ao ramo subs. |

## 5. O que precisa do dono (segredo / conta / aparelho)

1. `wrangler d1 migrations apply soulmon-billing --remote` e conferir a tabela (F1).
2. Var `PLAY_REQUIRE_ACCOUNT_BINDING=true` no Worker (F2).
3. Gerar a **keystore de upload** em `E:/`, com backup offline, senha num gerenciador. Ativar Play App Signing. Cadastrar o SHA-1 de App Signing **e** o de upload no Firebase e na restrição da API key (F8).
4. Service account: criar ou reaproveitar, dar acesso no Play Console (ver informações financeiras, gerenciar pedidos e assinaturas). Colar o JSON em `GOOGLE_PLAY_SERVICE_ACCOUNT` (secret, nunca em arquivo). Definir `ANDROID_PACKAGE_NAME`.
5. RTDN: criar o tópico Pub/Sub, dar `pubsub.publisher` a `google-play-developer-notifications@system.gserviceaccount.com`, criar a assinatura **push autenticada** (service account de push) para `/api/rtdn`, informar o tópico no Console (Monetização → Configuração) e repassar o e-mail da SA de push e o `aud` como vars.
6. Criar o SKU de assinatura (base plan trimestral, **sem free trial**) e adicionar os 12-15 e-mails em **License testing** (lacuna do contexto).
7. Rotacionar a chave de upload do DigiApp (F7). Não bloqueia o Soulmon.
8. Decidir: padrão de verificação (MASVS/ASVS L1?) e a política de reembolso da assinatura (R8).
9. Regra de Rate Limiting da Cloudflare para `/api/billing*` e `/api/rtdn` (F6, antes da produção).

## 6. Fora de escopo (risco aceito, não inexistente)

Engenharia reversa/modificação do APK e root (o servidor é a autoridade, então o impacto é cosmético local) · Steam (sem App ID) · fraude de pagamento do lado da Google · conta Google do testador comprometida · DoS volumétrico (fica com a Cloudflare) · cadeia de dependências npm/gradle (não auditada neste run: recomendo `npm audit --omit=dev` e lock de versões no checkpoint da Fase 3) · retenção/LGPD da assinatura além da minimização (pergunta ao dono jurídico) · as outras rotas (guild/duel/IA), que não foram reverificadas aqui.
