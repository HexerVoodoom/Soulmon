# WP5.4 — Assinatura e trial: a especificação, e por que ela quase toda diz "não"

> Spec **e registro da implementação** (11/10/2026, run `beta-play-01`). A decisão
> **D10** respondeu a pergunta central — **vitalício + cosmético trimestral, SEM
> trial** — e este texto registra o que isso significa em termos de arquivo e de
> regra, o que fica proibido por consequência e onde cada regra está travada por
> teste.

## O que foi decidido (D10)

| Pergunta | Resposta do dono | Consequência |
|---|---|---|
| Assinatura no lugar do vitalício? | **Não.** O vitalício continua sendo o produto. | `FULL_UNLOCK_SKU` segue como está; `accountTier: 'paid'` não vira estado com validade. |
| Assinatura AO LADO do vitalício? | **Sim, como cosmético trimestral.** | Um SKU novo que entrega COSMÉTICO recorrente, e nada mais. |
| Trial de 7 dias? | **Não.** | Nada de acesso temporário que expira. |

## Por que "sem trial" é a decisão mais consequente

Trial é acesso que **expira**, e expirar é a única coisa que este produto não
pode fazer com a criatura. A tese está escrita no `CLAUDE.md`: perda só sobre
item recuperável, nunca sobre identidade ou progresso acumulado. Um trial que
termina ou tira a criatura autoral de volta (e aí o produto tirou o que já era
"meu") ou não tira nada (e aí não é trial, é presente com nome errado).

Não existe terceiro caminho, e é por isso que este documento não descreve
mecanismo de trial nenhum: descrever seria deixar a semente pronta.

## O que a assinatura cosmética PODE ser

Uma linha só, e ela cabe nas regras que já existem:

- **Só `bg` e `furniture`.** É a mesma régua da aba Torneio, que o
  `CLAUDE.md` já declara: *"tudo na aba é COSMÉTICO e isso é regra"*. Um item
  de assinatura que mexa em HP, energia, atributo, requisito, evolução, teto de
  cuidado ou masmorra está fora — e há teste travando a fronteira das moedas.
- **Trimestral**, com um conjunto por trimestre. A cadência espelha a estação
  (`utils/seasons.ts`), que já existe e já tem virada testada.
- **O que foi entregue NÃO é retirado ao cancelar.** Cosmético entregue é
  posse. Um armário que esvazia quando a assinatura acaba é a mesma família do
  trial: perda sobre coisa que já era da pessoa.
- **Nunca desconta do vitalício, nem o substitui.** Quem comprou o completo
  continua com o completo; quem assina ganha o cosmético do trimestre.

## O que ficaria proibido, e é a parte que precisa estar escrita

- **Double dipping.** Vender o mesmo item nas duas portas (Bits e assinatura)
  transforma a loja num teste de paciência: a pessoa aprende que esperar a
  assinatura é sempre melhor que comprar. Item de assinatura tem `unlock`
  próprio e **nunca** entra em `SHOP_ITEMS` com preço.
- **Promoção em cadência previsível.** Desconto que aparece no mesmo dia todo
  mês ensina a nunca comprar a preço cheio; e desconto por urgência fabricada
  ("só hoje!") é o padrão escuro que este produto recusa em todas as outras
  telas.
- **Créditos recorrentes como parte da assinatura.** Créditos são a moeda de
  DINHEIRO REAL e liberam a criatura autoral. Dar Créditos por assinatura é
  fazer a criatura autoral virar aluguel, e o `CLAUDE.md` é explícito: é a
  única coisa que uma compra verificada concede.
- **Qualquer benefício de CUIDADO.** Nem cura, nem escudo, nem teto maior, nem
  perdão extra. O Sprint 2 fechou os dois caminhos pelos quais dinheiro comprava
  coração (D7 e D15) justamente para a frase *"pagar nunca deixa sua criatura
  mais forte"* poder existir na tela de compra. Uma assinatura que devolva
  qualquer um deles apaga essa frase.

## O que mudou no código

| Arquivo | O que mudou |
|---|---|
| `functions/api/_billing.js` | `PRODUCTS` ganhou `soulmon_cosmetic_quarterly` (`kind:'subscription'`, `grantTier:null`, `grantCredits:0`). A verificação **não** usa `purchases.products`: usa `purchases.subscriptionsv2` — **mesmo escopo** `androidpublisher` e mesma service account (a primeira redação desta spec dizia "outro escopo", e estava errada; muda o *endpoint* e a permissão no Console: ver informações financeiras + gerenciar pedidos e assinaturas). Estados que abrem a vitrine: `ACTIVE`, `IN_GRACE_PERIOD` e `CANCELED` (cancelou a renovação, mas o período pago vai até o `expiryTime`). `ON_HOLD`, `PAUSED`, `EXPIRED`, `PENDING` não abrem. |
| `functions/api/_entitlements.js` | `ent.sub = { rootHash, until, state, test }`. `until` é o `expiryTime` que a **Google** devolveu — nenhum campo do corpo da requisição escreve vigência. Fora de `orderDetails`: o reembolso do vitalício não toca nela. |
| `functions/api/billing.js` | Ramo de assinatura: verifica na Google, exige o vínculo `obfuscatedExternalAccountId` **sempre** (sem a flag de compatibilidade do vitalício), reivindica a **raiz da cadeia `linkedPurchaseToken`** em `order_claims` (chave `play:sub:<sha256>`; renovações e reassinatura caem no mesmo claim; a 2ª conta recebe 409), grava a vigência e **reconhece no servidor**. |
| `functions/api/rtdn.js`, `_pubsubAuth.js` | `POST /api/rtdn` (Pub/Sub push). JWT OIDC do Pub/Sub validado (JWKS da Google, `aud` = `RTDN_AUDIENCE`, `email` = `RTDN_PUSH_SA_EMAIL`). O payload **nunca** é confiado: só aponta um token, e o servidor reconsulta `subscriptionsv2`. Idempotente por `messageId` (D1 `rtdn_messages` / KV). 2xx quando tratou ou não há o que fazer; 5xx quando a Google/o armazenamento falhou (o Pub/Sub tenta de novo). |
| `migrations/0003_rtdn_messages.sql` | Tabela de idempotência do RTDN. `order_claims` não mudou. |
| `android/.../BillingPlugin.kt` | Suporta `ProductType.SUBS` (oferta **base** com `offerToken`, nunca fase grátis; `queryPurchases(SUBS)`; `acknowledge` em INAPP e SUBS). INAPP intacto. |
| `src/utils/shop.ts` | `unlock: { kind: 'subscription' }`, no molde de `mission`; `SUBSCRIPTION_ITEMS` (preço 0, **fora** de `SHOP_ITEMS`/`TOURNAMENT_ITEMS`). |
| `src/utils/subscriptionShop.ts` | O resgate de graça. Nada neste arquivo remove item. |
| `src/utils/subscription.ts`, `components/SubscriptionSection.tsx`, `components/mercado/SubscriptionShelf.tsx` | Divulgação pré-compra, "Assinar", "Gerenciar assinatura" (Configurações → Sua conta) e a vitrine "Do trimestre" (Mercado → Background / Decoração). |
| `src/utils/currencies.ts` | Nada. Se a assinatura exigisse uma quarta moeda, a resposta certa seria não fazer a assinatura. |

## Como cada regra está travada por teste

| Regra | Teste |
|---|---|
| `subUntil` só destrava a vitrine; regra de jogo nunca o lê (allowlist de arquivos, `App.tsx` por forma de linha) | `src/security/subscriptionBoundary.contract.test.ts` |
| Só `bg`/`furniture`, preço 0, nunca em `SHOP_ITEMS`/vitrine de moeda, sem texto de cuidado/Créditos | `src/utils/subscriptionShop.test.ts` |
| Entregue nunca é retirado; resgate não gasta moeda; compra com moeda recusada | `src/utils/subscriptionShop.test.ts` |
| Catálogo: `grantTier:null`, `grantCredits:0`; estados; produto/conta trocados; oferta (trial) recusada | `functions/api/billing.subscription.test.js` |
| Vigência vem da Google; vigência forjada no corpo é ignorada; fail-closed (503/502) | `functions/api/billing.subscription.test.js` |
| Cadeia `linkedPurchaseToken`: um claim, uma conta (409 na outra); renovação não abre claim | `functions/api/billing.subscription.test.js` |
| Acknowledge no servidor, idempotente | `functions/api/billing.subscription.test.js` |
| RTDN: OIDC (401), payload não confiado, `messageId` idempotente, 5xx para retry | `functions/api/rtdn.test.js` |
| Log sem token/JWT/saveId inteiro | os dois arquivos acima |
| Divulgação (preço localizado, "a cada 3 meses", renova sozinha, como cancelar) PT/EN; link de gerenciar | `src/utils/subscription.test.ts`, `src/components/SubscriptionSection.render.test.tsx` |
| Android SUBS + INAPP intacto; migração 0003 | `subscriptionBoundary.contract.test.ts` + `./gradlew assembleDebug` |

## Estado

**Implementado** (branch `feat/assinatura-trimestral`, 11/10/2026). Falta o que só o
dono faz: criar a assinatura no Console, as permissões da conta de serviço, o
Pub/Sub, as duas variáveis `RTDN_*`, a migração `0003` no D1 e aprovar os trechos
jurídicos — passo a passo em `docs/BILLING-SETUP.md` §8.

Decisões do dono:

- **Reembolso (R8):** reembolso de assinatura fecha a vitrine futura e bloqueia
  novos resgates, mas **não retira** o que já foi resgatado. Abre o abuso "assinar →
  resgatar → reembolsar"; no beta (licença de teste) o impacto é zero. **Aprovado pelo dono em
  11/10/2026** (`REGISTRO-DE-DECISOES.md` §33).
- **Oferta/trial (R6):** compra feita por uma oferta do plano é **recusada**
  (`offer-not-allowed`). O Console não deve ter oferta alguma neste plano.
- **Arte:** o conjunto de 2026-Q4 reusa a arte de cenários/decorações existentes
  (`src/utils/artAliases.ts`) com outros ids e nomes; a leva de arte própria troca o alias.
