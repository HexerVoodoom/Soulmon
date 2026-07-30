# Monetização — setup do Google Play Billing

Guia do que precisa ser configurado FORA do código para o pagamento funcionar.
O código já está pronto; falta credencial e configuração de conta.

## Como o dinheiro vira permissão (leia antes de mexer)

```
app Android → Play (usuário paga) → purchaseToken
   → POST /api/billing?action=verify
      → servidor pergunta à Google se a compra é real
      → se sim, grava no entitlement (KV `ent:<saveId>`)
   → app recebe o novo saldo/tier do servidor
```

**Regra que não pode ser quebrada:** o cliente nunca decide `accountTier` nem
`credits`. Esses campos são removidos de qualquer save que o cliente envie
(`functions/api/save.js`) e servidos a partir do entitlement, que só o servidor
escreve. Sem isso, bastaria editar o localStorage para virar assinante.

Arquivos envolvidos:

| Arquivo | Papel |
|---|---|
| `functions/api/_entitlements.js` | Fonte da verdade (saldo, tier, replay-protection, cap de anúncio) |
| `functions/api/entitlements.js` | Endpoint de leitura/gasto |
| `functions/api/billing.js` | Verifica a compra junto à Google e concede |
| `functions/api/save.js` | Remove campos de dinheiro do save do cliente |
| `src/utils/entitlements.ts` | Cliente: lê saldo, pede gasto (nunca decide) |
| `src/utils/playBilling.ts` | Ponte com o plugin nativo da Play |

---

## 1. Produtos no Google Play Console

Em **Monetizar → Produtos no app → Produtos gerenciados**, criar com estes IDs
exatos (têm que bater com `PRODUCTS` em `functions/api/billing.js` e com
`CREDIT_PACKS`/`FULL_UNLOCK_SKU` em `src/utils/monetization.ts`):

| ID do produto | Tipo | Sugestão de preço | Concede |
|---|---|---|---|
| `soulmon.unlock.full` | Não consumível | R$ 29,90 | Conta `paid` (personagem próprio, tarefas ilimitadas) |
| `soulmon.credits.60` | Consumível | R$ 4,90 | 60 créditos |
| `soulmon.credits.150` | Consumível | R$ 9,90 | 150 créditos |
| `soulmon.credits.400` | Consumível | R$ 19,90 | 400 créditos |

O preço real é o que estiver no Play Console — os rótulos no app são só
texto de UI e precisam ser atualizados à mão se o preço mudar.

## 2. Conta de serviço para a Play Developer API

1. **Google Play Console → Configurações → Acesso à API**
2. Vincular um projeto do Google Cloud (ou criar um).
3. Criar uma **conta de serviço** no Google Cloud e conceder a ela, no Play
   Console, a permissão **"Ver dados financeiros"** (necessária para
   `purchases.products.get`).
4. Baixar a chave JSON dessa conta de serviço.
5. Habilitar a **Google Play Android Developer API** no projeto do Cloud.

> A propagação da permissão pode levar algumas horas. Até lá a verificação
> responde 502/`verification-failed` — é esperado, não é bug no código.

## 3. Secrets no Cloudflare Pages

**Settings → Environment variables** (Production **e** Preview), marcando
*Encrypt*:

| Variável | Valor |
|---|---|
| `GOOGLE_PLAY_SERVICE_ACCOUNT` | Conteúdo **inteiro** do JSON da conta de serviço (uma linha só) |
| `ANDROID_PACKAGE_NAME` | O `applicationId` do app — hoje `com.digipartner.digiapp` |

Sem essas duas, `/api/billing` responde **503** e **não concede nada** — é
proposital: nunca conceder benefício sem conseguir verificar.

> ⚠️ **Decisão a tomar ANTES do primeiro upload:** o `applicationId` em
> `android/app/build.gradle` ainda é `com.digipartner.digiapp`, herdado do
> produto antigo (DigiApp). O package name é a **identidade permanente** do app
> na Play — depois do primeiro envio ele **nunca mais pode ser alterado**
> (mudar significa publicar um app novo, do zero, sem os usuários nem as
> compras). Se o produto vai se chamar Soulmon, renomeie agora para algo como
> `com.hexervoodoom.soulmon` (exige atualizar `build.gradle`, os diretórios do
> pacote Java/Kotlin, `google-services.json` e o `ANDROID_PACKAGE_NAME` aqui).

## 4. Plugin nativo de billing (única parte ainda pendente no código)

`src/utils/playBilling.ts` procura um plugin Capacitor registrado como
`Billing`, com esta interface:

```ts
purchase({ productId }): Promise<{ purchaseToken: string }>
consume({ purchaseToken }): Promise<void>
getPurchases?(): Promise<{ purchases: Array<{ productId, purchaseToken }> }>
```

Enquanto o plugin não existir, `isBillingAvailable()` é `false` e a UI mostra
"compra disponível no app Android" em vez de um botão morto. **Nada finge uma
compra em nenhum momento.**

Para ativar: instalar um plugin de Play Billing, registrá-lo com o nome
`Billing` (ou ajustar a chave em `getPlugin()`), e rodar `npx cap sync android`.

## 5. Regras da Play que afetam este app

- **Conteúdo digital tem que usar Play Billing.** Não dá para usar Stripe/Pix
  para os créditos ou o desbloqueio dentro do app Android — é motivo de
  remoção. Por isso a compra só aparece no app; na web fica indisponível.
- **Política de privacidade** é obrigatória (link no Play Console e no app).
- **Data safety form**: declarar que o app coleta e-mail (identidade do save) e
  o conteúdo das tarefas do usuário.
- **Anúncios**: se ativar AdMob, declarar no formulário de anúncios.

## 6. Checklist antes de publicar

- [ ] 4 produtos criados no Play Console com os IDs exatos da tabela
- [ ] Conta de serviço criada, com permissão financeira e API habilitada
- [ ] `GOOGLE_PLAY_SERVICE_ACCOUNT` e `ANDROID_PACKAGE_NAME` no Pages
- [ ] Plugin de billing instalado e registrado como `Billing`
- [ ] Compra testada com **licença de teste** (Play Console → Testes de
      licença) — não use cartão real para testar
- [ ] "Restaurar compras" testado: reinstalar o app e confirmar que o
      desbloqueio volta (`restorePurchases()`)
- [ ] Política de privacidade publicada e vinculada
- [ ] Data safety form preenchido

---

## Dívidas conhecidas (assumidas de propósito)

1. **Anúncio recompensado sem SSV.** `/api/entitlements?action=ad` credita
   confiando no cliente; a proteção é o teto diário aplicado no servidor. O
   dano máximo é o mesmo que o jogador ganharia assistindo aos anúncios do dia.
   Ao integrar o AdMob, trocar por Server-Side Verification.

2. **KV não tem transação.** Dois gastos simultâneos podem, em tese, perder uma
   escrita. Para a escala atual é aceitável; se virar problema, migrar o
   registro de entitlement para Durable Objects (serializam por chave).

3. **`saveId` é o hash do e-mail, sem autenticação.** Quem souber o e-mail de
   alguém consegue ler/sobrescrever o save daquela pessoa. Isso **não** deixa
   roubar a compra (a compra pertence à conta Google e o restore a traz de
   volta), mas deixa bagunçar o progresso alheio. Corrigir exige login de
   verdade (magic link / Sign in with Google) — recomendado antes de escalar a
   base de usuários.
