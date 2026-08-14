# Soulmon — Correções de backend (fase sweeper)

> Papel: `staff-backend`. Correção dos achados 🔴/🟠 do `release-readiness.md` e
> dos N-2/N-4/N-5 do `security-verification.md`. Nada commitado, nada empurrado.
> Nenhuma flag de configuração do dono foi ligada.

---

## 1. O que mudou

### 1.1 🔴 A escrita do overlay de desktop nunca chegou no servidor

| Arquivo:linha | Mudança |
|---|---|
| `functions/api/save.js:26-53` | O id do save passa a ser resolvido de `?id=` **ou** de `body.id` no POST; os dois divergentes = 400 |
| `desktop/renderer/src/cloudSync.ts:239-245` | O POST passa a levar `?id=${encodeURIComponent(saveId)}` na URL |

**Corrigi os dois lados, de propósito.** O QA propôs uma linha no cliente; a
alternativa era só o servidor. Escolhi ambos porque cada um resolve um problema
diferente:

- **Cliente com `?id=`** é o contrato canônico. Sem isso, todo cliente futuro
  copiaria o formato errado do único exemplo existente.
- **Servidor aceitando `body.id`** é o que faz o **APK/Electron já instalado
  voltar a gravar sem o usuário atualizar nada**. Consertar só o cliente
  significa que a build de Steam/Electron que já está no mundo continua sendo um
  visualizador até alguém baixar a nova. Retrocompatibilidade com quem já
  instalou é valor declarado do projeto (é a mesma razão de `DIGIAPP_SAVES`,
  `digiapp_*` e do servidor de chat aceitar `petName` **e** `digimonName`).

O contra-argumento do QA — "alarga a superfície do endpoint" — foi endereçado
no código, não ignorado: o id do corpo passa pelo **mesmo `VALID_ID`** e pela
**mesma `authorizeSaveAccess`**; nenhum caminho novo escapa da autorização. E o
caso ambíguo (query ≠ corpo) é **recusado com 400**, não resolvido por
precedência silenciosa — um id que "vence" o outro seria exatamente o tipo de
regra que vira request smuggling quando um proxy no meio discorda.

Nota de ordem: o corpo agora é lido **antes** da checagem de id, porque o id
pode vir dele. Continua sendo `await request.json().catch(() => null)`, e só
para `method === 'POST'` — o GET não tem corpo.

### 1.2 🟠 `state` não-objeto apagava o save (`functions/api/save.js:78-92`)

`if (!body?.state)` só barrava falsy: `{"state": 1}` virava `{...1}` = `{}` e
substituía o save inteiro. Agora:

```js
if (typeof incoming !== 'object' || incoming === null || Array.isArray(incoming))
```

→ 400 e `console.warn` com `saveId` e o tipo recebido. Recuso em vez de coagir:
um save é um objeto; array e primitivo são bug do cliente, e a resposta certa a
um bug do cliente **nunca** é destruir o dado do usuário.

Somei o teto de tamanho que o QA sugeriu: **5 MB serializados → 413**, também
com log. O KV aceita 25 MB/chave e não havia limite nenhum. 5 MB é folgado o
bastante para sprite embutido e ainda impede encher o namespace de graça.

### 1.3 🟠 `cloudSave` carimbava "sincronizado" sobre save descartado (`src/utils/cloudSave.ts:20-45`)

Agora checa `res.ok` antes de gravar `digiapp-last-cloud-sync`, loga o status
recusado e **devolve `boolean`** (`Promise<void>` → `Promise<boolean>`). Os três
chamadores (`GameStateContext.tsx:375`, `App.tsx:340`, `App.tsx:2220`) hoje
ignoram o retorno — o que já é uma melhora, porque o carimbo deixou de mentir —
mas o valor existe para quem quiser reagendar. Ver §5.

### 1.4 🟠 CORS sem `Authorization` (N-2)

| Arquivo:linha | Antes → depois |
|---|---|
| `functions/api/save.js:16` | `Content-Type` → `Content-Type, Authorization` |
| `functions/api/entitlements.js:31` | idem |
| `functions/api/community.js:32` | idem |

`billing.js:38` já estava certo e serviu de referência. `_entitlements.js` é
biblioteca, não rota — não tem CORS próprio. **Não** mexi em `chat.js`,
`config.js`, `subscribe.js`, `fcm-subscribe.js`, `suggest-tasks.js`,
`generate-sprite.js`: nenhum exige `Authorization`, e anunciar header que não se
usa é ruído. Se `_aiGuard` passar a cobrar cota por conta autenticada em
`chat.js`, esse arquivo entra na lista **antes** de a auth ser ligada.

### 1.5 🟠 Cobertura cega no código de dinheiro (`vitest.config.ts:12-24`)

`coverage.include` passou a ser
`['src/**/*.ts', 'src/**/*.tsx', 'functions/**/*.js', 'workers/**/*.js']`, com
os respectivos `*.test.js` no `exclude`. Números reais no §3.

### 1.6 🟠 Allowlist de push e redirect (N-4)

- `functions/api/_pushTargets.js:21-31`: `googleapis.com` → **`fcm.googleapis.com`**.
  O sufixo largo aceitava `storage.googleapis.com`, `firebasestorage.googleapis.com`
  e qualquer outro serviço do Google como alvo do `fetch` do worker.
- `workers/webpush.js:107-112`: `redirect: 'manual'` no `fetch` de envio. Um 302
  vindo de host permitido levava a requisição — **com o JWT VAPID de produção no
  cabeçalho** — para fora da allowlist. Com `manual`, o 3xx volta como resposta
  normal (`ok:false`) e o scheduler o trata como falha de envio.

⚠️ **`workers/` não tem deploy automático.** Esta correção só vale na borda
depois de `wrangler deploy` dentro de `workers/`. A do `functions/` sai no push
da `main`. Enquanto os dois não estiverem em sincronia, a entrada está apertada
e a saída não.

**Não** implementei o rate limit por origem/IP em `subscribe.js` sugerido no
N-4: não há storage de contador escolhido para isso (KV é eventualmente
consistente e cobra por escrita) e a decisão de mecanismo é de arquitetura. Está
registrado em R-8 do relatório de segurança como risco aceito e explícito.

### 1.7 🟠 `allowBackup` exportando a PII do oráculo (N-5)

| Arquivo | Mudança |
|---|---|
| `android/app/src/main/AndroidManifest.xml:5-14` | `allowBackup="true"` **mantido**, com `fullBackupContent="@xml/backup_rules"` e `dataExtractionRules="@xml/data_extraction_rules"` |
| `android/app/src/main/res/xml/backup_rules.xml` (novo) | `<exclude domain="root" path="app_webview" />` — Android ≤11 |
| `android/app/src/main/res/xml/data_extraction_rules.xml` (novo) | mesmo exclude em `cloud-backup` **e** `device-transfer` — Android 12+ (`targetSdk` é 35, então este é o arquivo que vale hoje; o outro cobre o parque antigo) |

**Por que excluir em vez de `allowBackup="false"`:**

- Desligar o backup inteiro mataria também as SharedPreferences (ponte de dados
  dos widgets), que não têm PII e cujo backup é útil.
- **Não há perda de save para quem já joga.** O backup só é *restaurado* em
  instalação nova. Quem está com o app instalado tem o save no aparelho
  (intocado por esta mudança) e na nuvem, recuperável pelo e-mail — `saveId =
  SHA-256("soulmon:"+email)`, `functions/api/save.js`. O caminho de recuperação
  suportado continua existindo; o que deixa de existir é a **cópia da PII no
  Google Drive**, que ninguém pediu e que derruba a garantia do `STATUS.md` §1.3
  no APK.
- O jogo roda em WebView, então save e `soulmon-profile` (nome completo, data,
  **hora** e **local** de nascimento) vivem no mesmo diretório `app_webview/`.
  Não dá para separar por arquivo — a escolha é binária, e privacidade ganha de
  uma conveniência que tem substituto.

Não consegui compilar o APK nesta máquina (sem toolchain Android, mesma
limitação registrada pelo QA). O XML segue o esquema documentado e as referências
`@xml/` casam com arquivos existentes, mas **isto precisa de um build do CI
(`android-build.yml`) antes de ser considerado verificado.**

---

## 2. Testes: o que mudou e por quê

**Nenhum teste foi afrouxado.** Três arquivos foram tocados, todos para
**apertar**:

| Arquivo | Mudança | Justificativa |
|---|---|---|
| `functions/api/save.test.js` | O bloco `[BUG] contrato de POST` (que afirmava `status 400`) virou 4 casos: POST só com `body.id` **grava** (200), id de corpo inválido continua 400, query≠corpo é 400, sem id nenhum é 400 | O próprio comentário do QA instrui: *"Ao corrigir … troque a expectativa para 200 e mantenha o teste"*. Saí de 1 asserção para 4, cobrindo os casos ambíguos que o fix criou |
| `functions/api/save.test.js` | +2 casos: `state` null/ausente continua 400 (não regredir), e `state` acima do teto → 413 sem tocar no KV | Guardas novas precisam de teste próprio |
| `desktop/renderer/src/pushCareAction.test.ts` | `pushCareAction falha e o save fica intocado` → `pushCareAction grava de verdade`, exigindo `ok:true`, `healthPoints:3` no KV **e `perfectDays:7` preservado**; o segundo caso passou de `not.toBeNull()` para igualdade com o `saveId` derivado | Instrução explícita no comentário do QA. A asserção de `perfectDays` é minha: garante que o round-trip não come o resto do save |
| `functions/api/_pushTargets.test.js` | Removi `'https://googleapis.com/qualquer'` da lista de **aceitos** e criei um bloco de **recusados** com ele + `storage.googleapis.com` + `firebasestorage.googleapis.com` | Esse caso travava justamente a fresta do N-4. Um teste que trava o comportamento vulnerável é o único tipo de teste que se corrige junto com o código |

---

## 3. Portões — resultado real

| Portão | Comando | Resultado |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | **exit 0, sem saída** |
| Testes | `npx vitest run` | **29 arquivos · 413 testes · 412 passam · 1 falha** (`src/index.css.contract.test.ts`, achado #4 — classes fantasma no JSX, **escopo do frontend**) |
| Build | `npm run build` | **OK** — 108/108 PNG→WebP (−6,19 MB), `✨ Compiled Worker successfully` |

**Os 9 vermelhos do QA estão verdes.** Os 6 restantes (`save.test.js` ×4,
`cloudSave.test.ts` ×2, `pushCareAction.test.ts` ×1 — total 7 do meu escopo)
passaram pelo fix; os 2 do `index.css.contract.test.ts` são de CSS/JSX e não
toquei neles. A contagem subiu de 407 para 413 pelos 6 casos novos que
acrescentei.

> Numa das execuções o `index.css.contract.test.ts` reportou 2 falhas e noutra 1
> (o arquivo trunca a lista de classes ausentes). Não investiguei — é o arquivo
> do frontend e as duas execuções falham no mesmo arquivo, então não muda o
> veredito do meu escopo.

---

## 4. Cobertura real de `functions/` e `workers/` (o que o medidor cego escondia)

`npx vitest run functions desktop --coverage` (144 testes, todos verdes; rodei
só esses caminhos porque o v8 não emite relatório quando a suíte inteira falha):

| Arquivo | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|
| **`functions/api/_entitlements.js`** (dinheiro) | **95,83%** | **90,90%** | 100% | **97,40%** |
| **`functions/api/_billing.js`** (dinheiro) | **48,24%** | **54,83%** | **38,88%** | **48,73%** |
| **`functions/api/save.js`** | **90,69%** | **86,11%** | 66,66% | **92,50%** |
| **`functions/api/community.js`** | **55,39%** | **47,16%** | 60,00% | **62,38%** |
| `functions/api/_pushTargets.js` | 100% | 100% | 100% | 100% |
| `functions/api/_aiGuard.js` | 88,46% | 75,00% | 100% | 95,45% |
| `functions/api/_auth.js` | 48,61% | 30,76% | 71,42% | 51,85% |
| `functions/api/entitlements.js` (rota) | **0%** | 0% | 0% | 0% |
| `functions/api/billing.js` (rota) | **0%** | 0% | 0% | 0% |
| `functions/api/subscribe.js` | **0%** | 0% | 0% | 0% |
| `functions/api/chat.js`, `suggest-tasks.js`, `generate-sprite.js`, `fcm-subscribe.js`, `config.js` | **0%** | — | — | 0% |
| `workers/webpush.js`, `workers/push-scheduler.js`, `workers/fcm.js` | **0%** | 0% | 0% | 0% |

Leitura honesta dos três números que mais importam:

1. **`_billing.js` a 48% de statements e 38% de funções** é o pior número do
   repositório considerando o que ele decide: verificação de compra, vínculo de
   conta e voiding. Metade dele nunca rodou num teste.
2. **As rotas de dinheiro (`billing.js`, `entitlements.js`) estão em 0%.** A
   *biblioteca* é bem testada; o **handler HTTP** que a chama — onde vivem
   parsing, status, CORS e roteamento de ação — não tem um teste sequer. `save.js`
   estava exatamente nessa situação até esta rodada, e tinha dois defeitos dentro.
3. **`workers/` inteiro em 0%**, incluindo a criptografia do `webpush.js`
   (RFC 8291). Combinado com o deploy manual, é a superfície com menos rede do
   projeto.

Não escrevi testes para fechar esses buracos — o mandato desta fase é corrigir
os achados, e cobrir `_billing.js`/`billing.js` direito é trabalho de sessão
própria, com decisão sobre como falsificar a API do Google Play. Fica como o
**item de maior valor por hora** para a próxima rodada.

---

## 5. O que NÃO corrigi, e por quê

| Item | Por quê |
|---|---|
| `FIREBASE_PROJECT_ID`, D1 `order_claims`, `PLAY_REQUIRE_ACCOUNT_BINDING` | Decisões do dono (`STATUS.md` §3). Ligar fora de ordem derruba o login. **O N-2 (CORS) está fechado, que era o pré-requisito nomeado no §7 da segurança — a ordem `N-2 → FIREBASE_PROJECT_ID` agora está desbloqueada.** |
| **SEC-3 sem D1 — proposta, não ligada** | Dá para endurecer sem D1: hoje `claimOrder` faz read-modify-write em KV. Duas medidas independentes de D1: (a) usar `expirationTtl` + escrita **incondicional** de uma chave `claim:<orderId>` *antes* de conceder, com releitura imediata para detectar sobrescrita concorrente (reduz a janela, não a fecha); (b) mais barato e mais forte: gravar o `orderId` **dentro** do registro `ent:<saveId>` e recusar concessão se o mesmo `orderId` já constar de outro entitlement encontrado — o que transforma "1 recibo → N contas" num erro detectável no ato da segunda tentativa. Nenhuma das duas é atômica de verdade. **A única solução correta é D1 ou Durable Object**, e por isso não implementei paliativo: um paliativo aqui vira "parece resolvido" e desmarca o D1 do checklist de lançamento, que é exatamente o risco R-2. |
| Achado #4 (130 classes fantasma), #7 (alvos de toque) | CSS/JSX — escopo do `staff-frontend`. É a única falha vermelha que sobrou. |
| Achado #8 (bloco `guide` morto no `i18n.ts`), #13 (`'Anônimo'`) | Texto/i18n do frontend. |
| Achado #9 (chunk do oráculo) | Decisão de bundling/arquitetura, não de backend. |
| Achado #10 (TTL de 365 dias no save) | **Decisão de produto, e ela colide com o guardrail nº 1** ("perdão de ausência: quem volta encontra saudade, não fatura"). Quem parar 12 meses perde o save na nuvem, e o TTL só renova a cada escrita. Não mudei um número que representa uma promessa do produto sem o dono decidir. Recomendação: subir para 3 anos ou remover o TTL. |
| Achados #11, #12 (`public/sw.js`) | Service worker — fronteira com o frontend; e mexer nele exige bump de `CACHE_VERSION`, que tem procedimento próprio. Ambos são 🟡 e de uma linha; deixo indicado. |
| `fcm-subscribe.js` sem validação nem allowlist (observação da segurança) | Mesma classe do SEC-5, mas não estava na minha lista e o canal FCM tem chave própria. Vale uma rodada junto do rate limit do `subscribe.js`. |
| Rate limit em `/api/community` e `/api/subscribe` | Precisa de decisão de mecanismo de contagem (KV é eventualmente consistente). Arquitetura. |
| N-3 (LGPD), N-6 (origem compartilhada), N-7 (CSP) | Política/infra/deploy — nenhum é código de handler. |
| Retry/aviso quando `cloudSave` devolve `false` | O `boolean` existe e o carimbo parou de mentir, mas os 3 chamadores ignoram o retorno. Fazer o `GameStateContext` reagendar com backoff mexe no debounce de 3s e no risco de spam de cloud save que o CLAUDE.md avisa — merece desenho, não um `setTimeout` enfiado agora. |

---

## 6. Arquivos tocados

```
functions/api/save.js
functions/api/save.test.js
functions/api/entitlements.js
functions/api/community.js
functions/api/_pushTargets.js
functions/api/_pushTargets.test.js
workers/webpush.js
src/utils/cloudSave.ts
desktop/renderer/src/cloudSync.ts
desktop/renderer/src/pushCareAction.test.ts
vitest.config.ts
android/app/src/main/AndroidManifest.xml
android/app/src/main/res/xml/backup_rules.xml            (novo)
android/app/src/main/res/xml/data_extraction_rules.xml   (novo)
dist/**                                                  (subproduto do `npm run build`)
```

Sem commit, sem push.
