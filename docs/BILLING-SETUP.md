# Monetização — setup do Google Play Billing

Guia do que precisa ser configurado FORA do código para o pagamento funcionar.
O código já está pronto; falta credencial e configuração de conta.

> ## 🚨 AÇÃO NECESSÁRIA: registrar o novo pacote no Firebase
>
> O `applicationId` mudou de `com.digipartner.digiapp` para
> **`com.hexervoodoom.soulmon`**, porque o antigo já pertence ao DigiApp
> publicado na Play — dois apps não podem dividir o mesmo package name
> (o Soulmon entraria como *atualização* do DigiApp, substituindo-o para
> todos os usuários dele).
>
> Consequência: **o build do Android vai FALHAR** com
> `No matching client found for package name 'com.hexervoodoom.soulmon'`
> até você fazer isto:
>
> 1. Firebase Console → seu projeto → **Adicionar app → Android**
> 2. Package name: `com.hexervoodoom.soulmon`
> 3. Baixar o `google-services.json` novo e substituir
>    `android/app/google-services.json`
> 4. Adicionar a impressão digital SHA-1/SHA-256 da chave de assinatura
>
> A falha é proposital — melhor o build parar do que gerar um APK com push
> quebrado sem ninguém perceber.
>
> Se você também for configurar o Firebase Auth (login por e-mail), aproveite
> a mesma visita ao Console: precisa registrar um app **Web** para pegar as
> chaves do SDK JS.

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

**Segunda regra:** um comprovante de compra pertence a **uma conta Soulmon**
(`claimOrder`, registro `ord:` no KV). Isso não é detalhe — o desbloqueio
completo é NÃO consumível, então `getPurchases()` da Play devolve ele para
sempre: sem a trava, bastava sair, entrar com outro e-mail e tocar em
"Restaurar compras" para clonar a conta paga sem limite. Vale igual para a
posse do app na Steam. Reprocessar na **mesma** conta continua permitido — é o
que faz o restore funcionar.

Arquivos envolvidos:

| Arquivo | Papel |
|---|---|
| `functions/api/_entitlements.js` | Fonte da verdade (saldo, tier, replay-protection, cap de anúncio) |
| `functions/api/entitlements.js` | Endpoint de leitura/gasto |
| `functions/api/_billing.js` | Catálogo + verificação **por loja** (Play e Steam) |
| `functions/api/billing.js` | Rota: autentica, chama o provedor, concede |
| `functions/api/save.js` | Remove campos de dinheiro do save do cliente |
| `src/utils/entitlements.ts` | Cliente: lê saldo, pede gasto (nunca decide) |
| `src/utils/playBilling.ts` | Ponte com o plugin nativo da Play |

> **Carteira única.** O entitlement é por CONTA (e-mail → saveId), não por
> loja: crédito comprado na Play vale na Steam e vice-versa. O que é por loja
> é a **compra** — cada uma exige que o pagamento passe por ela. Ver
> `docs/PLANO-DESKTOP-STEAM.md`, fase 4.

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
| `ANDROID_PACKAGE_NAME` | O `applicationId` do app — `com.hexervoodoom.soulmon` |
| `ADMOB_SSV_ENABLED` | Deixe **ausente** por enquanto (ver 4b) |
| `STEAM_PUBLISHER_KEY` | Só quando for publicar na Steam (ver 3b) |
| `STEAM_APP_ID` | Idem |

Sem as duas primeiras, `/api/billing?provider=play` responde **503** e **não
concede nada** — é proposital: nunca conceder benefício sem conseguir
verificar. O provedor `steam` tem a mesma disciplina com as suas.

## 3b. Steam (código pronto, desligado sem credencial)

`POST /api/billing?action=verify&provider=steam` aceita duas formas:

| Corpo | O que concede | Como é verificado |
|---|---|---|
| `{ id, ticket }` | Tier **pago** | Session ticket → `AuthenticateUserTicket` + `CheckAppOwnership` |
| `{ id, orderId, ticket }` | Créditos | `ISteamMicroTxn/QueryTxn` — exige `status === 'Succeeded'` **e** que o `steamid` da transação seja o da sessão do ticket. Sem o ticket, um `orderid` adivinhado creditaria a compra de outra pessoa: quem gera o `orderid` é o parceiro (contador/timestamp), então ids vizinhos são previsíveis. |

> **Family Sharing.** O ticket traz `steamid` (quem joga) e `ownersteamid`
> (quem comprou). Exigimos que sejam **iguais**: quem pegou a biblioteca
> emprestada joga, mas não herda o tier pago. Aceitar a posse do dono seria um
> furo — o tier é gravado na conta Soulmon de quem pediu, então cada amigo
> sairia com uma conta paga própria de uma compra só.

Os `itemid` numéricos das microtransações estão em `STEAM_ITEMS`
(`functions/api/_billing.js`) e precisam bater com os usados no `InitTxn`:

| `itemid` | Produto |
|---|---|
| 101 | `soulmon.credits.60` |
| 102 | `soulmon.credits.150` |
| 103 | `soulmon.credits.400` |

> **O desbloqueio completo não é vendido por microtransação na Steam** — lá a
> própria loja cobra pelo app, então possuir o app já é o tier pago. Vender de
> novo por dentro seria cobrar duas vezes pela mesma coisa. Há um teste que
> trava isso.
>
> ⚠️ **Nada disso foi testado contra a Valve** — não existe App ID ainda. Os
> caminhos e versões das interfaces (`/v1/`, `/v3/`) devem ser conferidos na
> documentação atual do Steamworks antes de ligar. Ver `desktop/STEAM.md`.


## 4. Plugin nativo de billing — JÁ IMPLEMENTADO

`android/app/src/main/java/com/hexervoodoom/soulmon/plugins/BillingPlugin.kt`
é um plugin Capacitor próprio, escrito direto sobre a Play Billing Library
(`com.android.billingclient:billing-ktx`), registrado no `MainActivity.java`
como `Billing`. Ele:

- abre o fluxo de compra e devolve o `purchaseToken`;
- **reconhece** (`acknowledge`) a compra — obrigatório, senão a Play estorna
  automaticamente em 3 dias;
- consome os pacotes de crédito (senão não dá para recomprar);
- lista as compras da conta para o "restaurar compras".

Ele **nunca decide se o jogador ganhou algo** — só entrega o token; quem
concede é o servidor depois de verificar com a Google.

No navegador/PWA o plugin não existe, então `isBillingAvailable()` é `false` e
a UI diz "compra disponível no app Android". **Nada finge uma compra.**

Depois de mexer em qualquer coisa do Android: `npx cap sync android`.

## 4b. Anúncio recompensado — DESLIGADO por padrão

O endpoint que credita anúncio (`/api/entitlements?action=ad`) só responde se
`ADMOB_SSV_ENABLED === 'true'` nas variáveis do Pages. Sem isso ele devolve
501 e a UI **esconde** a opção.

Isso é proposital: um endpoint aberto que dá crédito porque o cliente pediu é
farmável com um `curl` — o jogador ganharia a moeda sem gerar a receita de
anúncio que deveria pagar por ela.

Para ligar de verdade é preciso **Server-Side Verification do AdMob**: o
Google chama uma URL nossa assinada quando o anúncio termina, e só essa
chamada (com assinatura verificada) pode conceder crédito. Não ligue a flag
antes disso — ela é o único freio hoje.

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
- [ ] `google-services.json` novo, com o pacote `com.hexervoodoom.soulmon`
- [ ] Compra testada com **licença de teste** (Play Console → Testes de
      licença) — não use cartão real para testar
- [ ] "Restaurar compras" testado: reinstalar o app e confirmar que o
      desbloqueio volta (Configurações → Conta e compras)
- [x] Política de privacidade escrita (`public/privacidade.html`, linkada em
      Configurações → Sobre) — falta colar a URL no Play Console
- [ ] Data safety form preenchido

---

## Custo de IA — quem pode gastar

`/api/chat`, `/api/suggest-tasks` e `/api/generate-sprite` gastam as nossas
chaves de terceiros (Groq, Higgsfield, Gemini). Elas eram **abertas**: sem
identificação, sem teto e com CORS `*` — um `curl` em loop gerava imagem e texto
na nossa conta, que é justamente o custo que esta monetização existe para
cobrir. O `generate-sprite` era o pior: o prompt vem do cliente, então também
servia para alguém gerar o que quisesse em nosso nome.

Agora passam por `functions/api/_aiGuard.js`, com duas travas:

| Trava | Chave no KV | Para quê |
|---|---|---|
| Cota por conta | `ai:<bucket>:<saveId>:<dia>` | Impede um usuário de rodar em loop |
| Teto global do dia | `ai:<bucket>:@all:<dia>` | Limita o PREJUÍZO máximo do dia |

> ⚠️ **A cota por conta só vale de verdade com o login ligado.** Sem
> `FIREBASE_PROJECT_ID`, o `saveId` é só um hash de e-mail: um atacante inventa
> um novo a cada chamada e passa por baixo dela. O teto global é o disjuntor
> enquanto isso — não é autenticação, é limite de fatura. Mais um motivo para
> ligar o login antes de divulgar o app.

Tetos atuais (em `AI_LIMITS`): chat 120/conta e 20.000/dia · sugestões 30 e
3.000 · sprite 20 e **400**. Conservadores de propósito — é mais fácil afrouxar
depois de ver o uso real do que explicar uma fatura inesperada.

## Reembolso — como funciona

Quando a loja estorna uma compra, o benefício é desfeito: `paid` volta para
`demo`, créditos são debitados (o saldo nunca fica negativo).

A conferência é **preguiçosa**, não tem cron: acontece no `GET
/api/entitlements`, no máximo **1× por dia por conta**, e só para contas que
têm compras. Isso evita um worker novo com deploy e secrets próprios, e
resolve o caso que importa — quem usa o app é exatamente quem passa por ali.

Cobre as três origens de benefício:

| Origem | Como é conferida |
|---|---|
| Compra na Play | `purchaseState === 1` |
| Microtransação Steam | status `Refunded`/`PartialRefund`/`Chargeback` |
| Posse do app na Steam (tier pago) | `CheckAppOwnership` com o SteamID guardado no próprio `orderId` da licença — não precisa de session ticket |

Duas decisões que valem saber:

- **Se a loja não responder, o benefício é MANTIDO.** Tirar o que o jogador
  pagou por causa de uma falha de rede nossa seria pior que o prejuízo.
- **Quem reembolsa e some fica marcado como pago no banco.** Como não abre o
  app, isso não vale nada para ele.

## Dívidas conhecidas (assumidas de propósito)

1. **KV não tem transação.** Dois gastos simultâneos podem, em tese, perder uma
   escrita. Na prática exigiria o mesmo jogador tocando em dois botões de gasto
   no mesmo instante, em aparelhos diferentes — e o prejuízo máximo é o app
   cobrar um gasto a menos. Para a escala atual é aceitável; se virar problema,
   migrar o registro de entitlement para Durable Objects (serializam por chave).

2. **Login por e-mail implementado, mas DESLIGADO até você configurar.** O
   código já está pronto (ver seção 7); enquanto as variáveis não existirem, o
   `saveId` continua sendo só o hash do e-mail e quem souber o e-mail de alguém
   consegue sobrescrever o save daquela pessoa.

   O que isso **não** permite, nem hoje: roubar a compra. A compra pertence à
   conta Google, os entitlements ficam num registro que o cliente não escreve,
   e o "restaurar compras" reconstrói o direito a partir da própria Play.

---

## 7. Login por e-mail (Firebase Auth) — código pronto, falta configurar

Sem isso, o `saveId` é só o hash do e-mail: quem souber o seu consegue
sobrescrever o seu save. Com isso, o cliente manda um ID token assinado pelo
Google em toda chamada e o servidor confere a assinatura
(`functions/api/_auth.js`) antes de aceitar.

**Como ligar:**

1. Firebase Console → **Authentication → Sign-in method** → habilitar
   **Link de e-mail (login sem senha)**.
2. Em **Authentication → Settings → Authorized domains**, adicionar o domínio
   de produção do app.
3. Firebase Console → **Adicionar app → Web** (se ainda não existir) e copiar
   as chaves do SDK.
4. Variáveis no Cloudflare Pages:

| Variável | Onde é usada | Valor |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | build do front | `apiKey` do app Web |
| `VITE_FIREBASE_AUTH_DOMAIN` | build do front | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | build do front | `projectId` |
| `VITE_FIREBASE_APP_ID` | build do front | `appId` (opcional) |
| `FIREBASE_PROJECT_ID` | **servidor** | mesmo `projectId` |

> As `VITE_*` entram no bundle no momento do build — precisa de um novo deploy
> depois de defini-las. O `FIREBASE_PROJECT_ID` (sem prefixo) é o que **liga a
> exigência de token no servidor**; enquanto ele não existir, as rotas aceitam
> chamadas sem autenticação, de propósito, para não derrubar quem já usa.

**Ordem segura para migrar** (evita expulsar usuários existentes):

1. Definir só as `VITE_*` e publicar → novos cadastros passam a confirmar o
   e-mail; quem já está dentro continua funcionando.
2. Conferir que o login por link está funcionando de verdade.
3. Só então definir `FIREBASE_PROJECT_ID` → o servidor passa a **exigir** o
   token. Quem não tiver feito login precisará entrar pelo link.

**Como se comporta hoje (nada configurado):** `isAuthConfigured()` é false, o
onboarding segue igual ao de antes e nenhuma tela de login aparece. Verificado
com o app rodando: fluxo completo até o tutorial, sem erros.
