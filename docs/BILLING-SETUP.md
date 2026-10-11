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

---

## Vínculo do recibo com a conta (obrigatório antes de vender)

Um recibo da Play vale para **uma** conta Soulmon. Havia duas defesas previstas,
e só uma delas realmente funciona sozinha:

| Defesa | Vale? |
|---|---|
| `claimOrder` — registro global `ord:<orderId>` no KV | ⚠️ **best-effort**. O Workers KV é eventualmente consistente (janela de até ~60s, com cache de borda inclusive para chave inexistente). Duas contas em regiões diferentes conseguem reivindicar o mesmo recibo. |
| `obfuscatedExternalAccountId` — a Google diz de quem é a compra | ✅ **é a trava de verdade.** Independe de timing e de região. |

### O que o cliente tem que fazer

Ao abrir o fluxo de compra, o plugin de billing precisa chamar
`setObfuscatedAccountId(saveId)` (o `saveId` já é um hash, então serve como o
identificador ofuscado que a Google pede). Sem isso o campo volta vazio.

### Como ligar a exigência

1. Publique a versão do app que manda o `obfuscatedAccountId`.
2. Espere a base migrar (compras antigas não têm o campo).
3. Só então defina no projeto Pages:

   ```
   PLAY_REQUIRE_ACCOUNT_BINDING = true
   ```

   A partir daí, compra sem vínculo é recusada com `account-mismatch` (403).

### Opcional: resgate atômico com D1

Para o `claimOrder` deixar de ser best-effort, crie um banco D1 e vincule como
`DB` no projeto Pages:

⚠️ **O schema NÃO mora mais aqui.** Ele vive em `migrations/`, versionado, e é de lá que
se aplica:

```bash
npx wrangler d1 migrations apply <nome-do-banco> --remote
```

Até 26/08/2026 este documento carregava um `CREATE TABLE` solto para colar à mão. Era a
**única** descrição da forma do banco em produção, e uma mudança de coluna não tinha onde
ser registrada — o que só apareceu quando o prazo de retenção precisou de uma coluna nova.
Duas fontes para a mesma verdade divergem em silêncio (footgun 9); a fonte agora é uma, e
`migrations/README.md` tem as regras.

Com o binding presente, `claimOrder` passa a usar `INSERT` — a PRIMARY KEY
resolve a corrida e só um dono é possível. Sem o binding, continua no KV com a
limitação acima. Não é obrigatório se o vínculo por conta estiver ligado, mas é
defesa em profundidade barata.

### Steam

Na Steam o equivalente é o **session ticket**, e ele é obrigatório nos dois
caminhos (posse do app e microtransação). A microtransação também confere que o
`steamid` da transação é o da sessão — sem isso, um `orderid` adivinhado
creditaria a compra de outro jogador.

---

## 8. Assinatura cosmética trimestral — passo a passo do Console e do Worker

Decisão do dono **D10** (`docs/ASSINATURA-SPEC.md`): cosmético trimestral, **sem
free trial**, sem Créditos, sem benefício de cuidado, e o que foi entregue nunca é
retirado. O código está implementado; esta seção é só o que fica **fora** dele.

```
app → Play (assina) → purchaseToken
   → POST /api/billing?action=verify { productId: soulmon_cosmetic_quarterly }
      → servidor: GET purchases.subscriptionsv2 (a verdade é da Google)
      → vínculo obfuscatedExternalAccountId == saveId (SEMPRE exigido)
      → claim da RAIZ da cadeia linkedPurchaseToken em order_claims (409 se de outra conta)
      → ent.sub.until = expiryTime que a Google devolveu (o cliente não escreve vigência)
      → acknowledge no servidor
Google → Pub/Sub → POST /api/rtdn (OIDC) → reconsulta a Google → renova/fecha a vitrine
```

### 8.1 Criar a assinatura no Play Console

1. **Monetizar → Produtos → Assinaturas → Criar assinatura.**
2. **ID do produto: `soulmon_cosmetic_quarterly`** (exatamente; é o `SUBSCRIPTION_SKU`).
   Nome: "Assinatura de cenários e decoração".
3. **Adicionar plano básico** (*base plan*): renovação automática, período de
   cobrança **3 meses** (trimestral), preço **R$ 9,90**. Defina os preços por país
   (a Play converte; o app mostra o preço localizado do próprio ProductDetails).
4. **NÃO crie ofertas.** Nada de *free trial*, preço introdutório ou promoção neste
   plano: o servidor **recusa** compra feita por oferta (`offer-not-allowed`) e o
   app só oferece o plano básico. Se criar por engano e alguém pagar por ela, essa
   pessoa fica sem a vitrine até você remover a oferta e ela reabrir o app.
5. **Período de carência (*grace period*)**: pode ligar (recomendado 3 a 7 dias). O
   servidor mantém a vitrine aberta durante a carência. *Account hold*: o servidor
   fecha a vitrine (o que já foi resgatado continua da pessoa).
6. **Reassinatura após expirar** (opção da Play, ligada por padrão): pode deixar. Gera
   um token novo ligado ao antigo (`linkedPurchaseToken`); o servidor trata a cadeia
   como UMA assinatura de UMA conta.
7. Ative o plano básico. Confirme: *preço R$ 9,90 / 3 meses, sem oferta*.

### 8.2 Permissões da conta de serviço

É a **mesma** conta de serviço e o **mesmo escopo** (`androidpublisher`) do vitalício —
a primeira versão da spec D10 dizia "outro escopo", e estava errada. O que muda é o
endpoint (`purchases.subscriptionsv2`) e a permissão no Console:

1. **Play Console → Usuários e permissões** → convidar o e-mail da conta de serviço
   (se ainda não estiver) com, no mínimo, em **Permissões do app (Soulmon)**:
   - **Ver informações financeiras, como pedidos e respostas de pesquisas de
     cancelamento** (ler a assinatura);
   - **Gerenciar pedidos e assinaturas** (necessária para o *acknowledge*).
2. Habilite a **Google Play Android Developer API** no projeto do Cloud (já feito
   para o vitalício).
3. A propagação pode levar horas: até lá o verify responde 502/`verification-failed`
   (esperado, e nada é concedido).

### 8.3 RTDN — Pub/Sub

O RTDN é o que fecha/renova a vitrine em tempo real. Sem ele a assinatura **funciona**
(o app reconcilia na abertura via `queryPurchases(SUBS)` e a vigência acaba sozinha no
`expiryTime`), só demora mais para refletir renovação e reembolso.

1. **Cloud Console → Pub/Sub → Tópicos → Criar tópico** (ex. `play-rtdn`), no mesmo
   projeto da conta de serviço.
2. No tópico, **Permissões → Adicionar principal**
   `google-play-developer-notifications@system.gserviceaccount.com` com o papel
   **Publicador do Pub/Sub** (`roles/pubsub.publisher`).
3. Crie (ou reaproveite) uma **conta de serviço de push**, ex.
   `pubsub-push@<projeto>.iam.gserviceaccount.com`. Ela não precisa de papel algum;
   só assina o JWT de cada entrega.
4. **Pub/Sub → Assinaturas → Criar assinatura** no tópico:
   - Tipo de entrega: **Push**;
   - URL do endpoint: `https://soulmon.mateus-sprnd.workers.dev/api/rtdn`;
   - **Ativar autenticação**: conta de serviço = a do passo 3; **Público-alvo
     (*audience*) = a URL exata do endpoint** (a mesma string);
   - Prazo de confirmação: 30 s; política de nova tentativa: **recuo exponencial**
     (mín. 10 s, máx. 600 s); retenção de mensagens: 7 dias.
5. Variáveis no Cloudflare (**Production e Preview**, *Encrypt* não é necessário —
   não são segredo, mas ficam fora do repositório):

   | Variável | Valor |
   |---|---|
   | `RTDN_AUDIENCE` | A URL do endpoint, **igual** ao *audience* do passo 4 |
   | `RTDN_PUSH_SA_EMAIL` | O e-mail da conta de serviço de push do passo 3 |

   (`ANDROID_PACKAGE_NAME` e `GOOGLE_PLAY_SERVICE_ACCOUNT` são as de sempre.) Sem as
   duas `RTDN_*` o endpoint responde 503 e não aceita nada (fail-closed).
6. **Play Console → Monetizar → Configuração de monetização → Notificações em tempo
   real do desenvolvedor**: informe o tópico (`projects/<projeto>/topics/play-rtdn`),
   tipo **Notificações de assinaturas e produtos**, e use **Enviar notificação de
   teste**. Ela deve aparecer nos logs do Worker como `rtdn.test` e a assinatura
   Pub/Sub deve mostrar a entrega com 2xx.

### 8.4 Banco (D1)

Aplique a migração nova (cria a tabela de idempotência do RTDN):

```bash
npx wrangler d1 migrations list  soulmon-billing --remote
npx wrangler d1 migrations apply soulmon-billing --remote   # aplica 0003_rtdn_messages.sql
```

Sem o D1 (ou sem a migração) o RTDN continua correto — só reprocessa reentregas (cada
uma custa uma consulta à Google). A trava de unicidade da assinatura usa a tabela
`order_claims` que já existe (chave `play:sub:<sha256 da raiz da cadeia>`).

### 8.5 Testar (licença de teste)

- Play Console → **Testes de licença**: adicione os e-mails dos testadores. Assinatura
  de teste **renova rápido** (um mês vira ~5 min; trimestral, poucos minutos) e cancela
  sozinha após alguns ciclos; o servidor marca `test: true` no estado.
- Verificações (cole a saída no PR/STATUS): assinar → vitrine abre (Mercado → Background
  e Decoração, seção "Do trimestre"); resgatar um item; cancelar na Central de assinaturas
  → vitrine continua até o fim do período; deixar expirar → vitrine fecha **e o item
  resgatado continua equipável**; assinar com a conta B o token da conta A → 409.
- Reconhecimento: a assinatura **não** pode ser estornada após 3 dias (se for, o *acknowledge*
  falhou — veja os logs `billing.sub.verified ... acked:false`).

### 8.6 Checklist da assinatura

- [ ] Assinatura `soulmon_cosmetic_quarterly` criada, plano básico trimestral R$ 9,90, **sem oferta/trial**
- [ ] Conta de serviço com *ver informações financeiras* + *gerenciar pedidos e assinaturas*
- [ ] Tópico Pub/Sub + permissão `pubsub.publisher` para `google-play-developer-notifications@system.gserviceaccount.com`
- [ ] Assinatura push autenticada apontando para `/api/rtdn`
- [ ] `RTDN_AUDIENCE` e `RTDN_PUSH_SA_EMAIL` no Cloudflare
- [ ] `PLAY_REQUIRE_ACCOUNT_BINDING=true` (o vitalício; a assinatura exige o vínculo sempre)
- [ ] `wrangler d1 migrations apply` (0003)
- [ ] Notificação de teste do Console chegou (`rtdn.test`)
- [ ] Trechos de assinatura em `termos.html` e `privacidade.html` revisados e **aprovados pelo dono** (hoje rascunho)
- [ ] IARC (compras), Data Safety (compras) e PLAY-FICHA citam a assinatura
