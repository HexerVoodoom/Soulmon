# Integrações e deploy

> **Dono:** doc-redator-arquitetura · **Data:** 21/09/2026 · **Estado:** verificado em 21/09/2026 por doc-verificador (§3.6, delta `5ac3d351..8d318529`, som/S16 — os quatro bumps do dia conferidos com `git log --format=%h 5ac3d351..73be1a2f -- public/sw.js`; `980bc84c` deu o quinto, v155; o resto: sincronizado com `dc72579e..9875477b` em 21/09/2026 por doc-redator-arquitetura; conferido em `5ac3d351`)
> **Verificação:** `npx vitest run src/deploy src/security functions/api workers` — em especial `src/deploy/appUrl.contract.test.ts` (as quatro fontes da URL), `src/deploy/firebaseNoBuild.contract.test.ts` (o `.env.production` versionado), `src/deploy/swCache.contract.test.ts`, `src/security/csp.test.ts`, `src/security/supabase.contract.test.ts`, `workers/pushCopy.parity.test.js` e `workers/vapid.parity.test.js`.
> **Não cobre:** o esquema do save e as chaves de storage (→ [07-DADOS-E-SAVE.md](07-DADOS-E-SAVE.md)), a arquitetura e os portões (→ [05-ARQUITETURA.md](05-ARQUITETURA.md)), as regras do jogo (→ `02-REGRAS-DE-NEGOCIO.md`), função por função (→ `06-REFERENCIA/`).
> **Precedência:** código > teste > `CLAUDE.md` > este documento. Onde discordarem, o código está certo e este doc tem defeito.

---

## 0. Regra deste documento: nenhum VALOR de credencial

Abaixo aparecem **só o NOME da variável e ONDE ela mora**. Nenhum valor, nem
"parcial", nem "só o começo". Os três lugares onde credencial mora neste
projeto:

| Lugar | O que vai lá | Como se define |
|---|---|---|
| **`wrangler secret`** (Cloudflare Pages → Settings → Environment variables) | Tudo que é segredo de servidor. | `wrangler secret put <NOME>` — ou o painel. |
| **`wrangler.jsonc` → `vars`** | Variável de runtime **pública** (em 10/09/2026, só `FIREBASE_PROJECT_ID`). Mora no arquivo, e não no painel, porque **variável comum é substituída pelo conteúdo do arquivo a cada `wrangler deploy`** — posta só no painel, o próximo deploy a apagaria e o servidor voltaria ao modo aberto em silêncio. |
| **`.env.production`** (COMMITADO) | As quatro `VITE_FIREBASE_*`, que são **públicas por design**: o Vite as inlina no bundle que todo visitante baixa. |

⚠️ **Por que `.env.production` é commitado** (`.gitignore` tem `!.env.production`):
as `VITE_*` são inlinadas em **BUILD**, não lidas em runtime. Como o CI builda de
novo a cada push sem o `.env` da máquina do dono, um deploy manual correto era
desfeito ~1 min depois pelo build do CI, e **o login morria em produção a cada
push** — medido em 07/09/2026: deploy 19:51:16, build do CI 19:52:19, login
quebrado. Régua: `src/deploy/firebaseNoBuild.contract.test.ts`, que exige que o
arquivo esteja versionado, traga as QUATRO variáveis com valor, **não** carregue
nada de servidor, e que os quatro nomes batam com o que `src/utils/auth.ts` lê.

---

## 1. As rotas `/api` (Cloudflare Pages Functions)

São **14**, medidas pelo inventário em 09/09/2026. Todas moram em
`functions/api/`; os arquivos `_*.js` são módulos internos, sem rota.

| Rota | Métodos | Arquivo |
|---|---|---|
| `/api/account` | `OPTIONS`, `ANY` (`?action=export` · `POST ?action=delete-request` · `POST ?action=delete-confirm`) | `account.js` |
| `/api/billing` | `OPTIONS`, `POST` (`?action=verify[&provider=play\|steam]`) | `billing.js` |
| `/api/chat` | `OPTIONS`, `POST` | `chat.js` |
| `/api/community` | `OPTIONS`, `ANY` (17 ações) | `community.js` |
| `/api/config` | `OPTIONS`, `GET` | `config.js` |
| `/api/entitlements` | `OPTIONS`, `GET`, `POST` (`?action=spend` · `?action=ad`) | `entitlements.js` |
| `/api/fcm-subscribe` | `OPTIONS`, `POST`, `DELETE` | `fcm-subscribe.js` |
| `/api/generate-sprite` | `OPTIONS`, `POST` | `generate-sprite.js` |
| `/api/metrics` | `OPTIONS`, `GET`, `ANY` | `metrics.js` |
| `/api/save` | `OPTIONS`, `ANY` (`GET`/`POST`) | `save.js` |
| `/api/sprite-image` | `GET` | `sprite-image.js` |
| `/api/subscribe` | `OPTIONS`, `POST`, `DELETE` | `subscribe.js` |
| `/api/suggest-tasks` | `OPTIONS`, `POST` | `suggest-tasks.js` |
| `/api/transcribe` | `OPTIONS`, `POST` | `transcribe.js` |

### 1.1 Os módulos internos que quase toda rota atravessa

| Módulo | Papel |
|---|---|
| `_kv.js` | `kv(env)` (guarda) e `kvOrThrow(env)` (uso). **Nunca leia `env.*_SAVES` direto** — guard em `_kv.fiacao.test.js`. |
| `_auth.js` | `verifyIdToken` (verifica o JWT do Firebase à mão, contra o JWK do Google, porque `firebase-admin` não roda em Workers), `emailToSaveId`, `authorizeSaveAccess` (**fail-open** sem `FIREBASE_PROJECT_ID`) e `requireVerifiedOwner` (**fail-closed**, 503 sem a variável). |
| `_entitlements.js` | A fonte da verdade de dinheiro. `requirePaidTier` é **fail-closed**. |
| `_billing.js` | `verifyPlayPurchase`, `verifySteamOwnership`, `verifySteamPurchase`, `isPlayPurchaseVoided`, `isSteamPurchaseVoided`, `isSteamOwnershipVoided`, e os catálogos `PRODUCTS`/`STEAM_ITEMS`. |
| `_aiGuard.js` | O portão das rotas que gastam dinheiro em API de terceiro: **três** travas — cota por conta e por DIA (`ai:<bucket>:<saveId>:<dia>`), teto **VITALÍCIO** por conta (`ent:<saveId>.aiLifetime.<bucket>`) e teto por **FORMA** (`aiForms`, dicionário fechado nas 11 formas, validado por `VALID_FORM_ID`). |
| `_rateLimit.js` | `clientKey`/`takeToken`/`tooManyRequests`. ⚠️ **É AMORTECEDOR DE CUSTO, não controle de segurança**: o contador vive na memória do isolate (`Map`), e o teto real no pior caso é `limit × isolates vivos`. O IP vem de `CF-Connecting-IP`, que a Cloudflare reescreve na borda. |
| `_redact.js` | `minimizeForAi` / `redactionCount` — corta e remove e-mail, telefone, CPF, link e @perfil antes de o texto ir para o modelo. |
| `_pushIdentity.js` | O que os DOIS canais de push compartilham: `nomeDePet` (teto de 24), `idiomaDePush`, `dataDeNascimento`, `ehTokenFcm`, `gravarSeMudou`, `LIMITE_INSCRICAO`. |
| `_pushTargets.js` | `isAllowedPushEndpoint` — a allowlist de serviços de push. |
| `_pushCopy.js` | **Dono único** do texto e das HORAS do push, para as três árvores (cliente, worker, cron): `PUSH_HOURS_BRT`, `PUSH_HOURS_UTC`, `pushCopy`, `eveningCopy`. |
| `_bond.js` | `bondLevelOf` e `BOND_PVP_MIN_LEVEL` — a MESMA derivação do cliente, e é o servidor que decide. |

---

## 2. Integração por integração

### 2.1 Firebase Auth — projeto `soulmon-app`

| | |
|---|---|
| **Para quê** | Provar posse do e-mail. O `saveId` é o hash do e-mail: sem prova, quem conhece o e-mail lê e sobrescreve o save alheio. |
| **Cliente** | `src/utils/auth.ts` — `isAuthConfigured`, `entrarComSenha`, `criarContaComSenha`, `entrarComGoogle`, `sendLoginLink`/`completeLoginFromLink`, `mandarResetDeSenha`, `getIdToken`, `authHeaders`, `signOut`, `startDesktopAuthBridge`. |
| **Servidor** | `functions/api/_auth.js` — `verifyIdToken` valida `alg=RS256`, `aud`, `iss`, `exp`, `iat` (tolera 5 min de relógio adiantado), exige `email_verified === true`, e só então confere a assinatura contra o JWK do Google (cache respeitando o `max-age` da resposta). |
| **Credencial** | **Cliente (públicas, de BUILD, inlinadas no bundle):** `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` — em `.env.production` (versionado) e no `.env` local, que tem precedência no desenvolvimento. **Servidor:** `FIREBASE_PROJECT_ID` em `wrangler.jsonc` → `vars`. |
| **Sem ela** | Sem as `VITE_*`, `isAuthConfigured()` é `false` e o app roda **sem login**. Sem `FIREBASE_PROJECT_ID`, `authorizeSaveAccess` entra em **modo aberto** e aceita qualquer chamada — e `requireVerifiedOwner` (exportar/excluir conta) responde **503 `auth-unavailable`**, ficando indisponível. ⚠️ **Ordem obrigatória**: `FIREBASE_PROJECT_ID` só pode ser ligada DEPOIS de um bundle que carregue as `VITE_*`; ligar antes derruba o login de todos, porque o servidor passa a exigir token e o cliente não sabe emitir nenhum. |
| **Régua** | `src/deploy/firebaseNoBuild.contract.test.ts`, `functions/api/_auth.test.js`, `functions/api/saveId.parity.test.js`. |

⚠️ **`https://apis.google.com` na CSP não é opcional.** O `signInWithPopup`
carrega `https://apis.google.com/js/api.js` para orquestrar o popup; sem o
domínio em `script-src` **e** `frame-src` (junto de `accounts.google.com`), o
login com Google falha com `auth/internal-error`, que **não menciona CSP em
lugar nenhum**. Medido em 07/09/2026.

### 2.2 Groq — chat do pet e sugestão de tarefas

| | |
|---|---|
| **Para quê** | As falas do pet (`llama-3.1-8b-instant`) e o pool de tarefas sugeridas do segundo onboarding. |
| **Cliente** | `src/utils/aiClient.ts` → `aiFetch` — **único** caminho do cliente para as rotas de IA. Ele acrescenta `id: <saveId>` e o `Authorization` automaticamente, para nenhuma chamada nova esquecer a identificação. O chat idle vive em `src/components/CompanionHUD.tsx` (a cada 3 min, **com** guard de `document.hidden`). |
| **Servidor** | `functions/api/chat.js` e `functions/api/suggest-tasks.js`, os dois atrás de `guardAiRequest` (`_aiGuard.js`) e de `minimizeForAi` (`_redact.js`). |
| **Credencial** | `GROQ_API_KEY` — `wrangler secret`. |
| **Sem ela** | A rota não tem provedor e o pet fica sem fala gerada. |
| **Régua** | `chat.promptInjection.test.js`, `chat.memoria.test.js`, `suggest-tasks.contract.test.js`, `aiRoutes.release.test.js`, `costCeiling.test.js`. |

**A camada anti-injeção do `customKeywords`** (o campo em que a pessoa
personaliza a voz do pet) está em `functions/api/chat.js`: o texto entra num
bloco delimitado por `<<<USER_STYLE>>>`/`<<<END_USER_STYLE>>>`, com os
delimitadores, as quebras de linha e os marcadores de papel (`<|im_start|>`,
`[INST]`, `<<SYS>>`) removidos da entrada. **O que isso NÃO garante, e está
escrito lá:** nada impede o modelo de obedecer a um texto persuasivo escrito
DENTRO do bloco. Não existe defesa completa contra prompt injection. O que
existe é redução de superfície — o atacante perde a capacidade de se passar por
sistema. A vítima do campo é o próprio jogador (o chat é individual, um pedido,
uma resposta); o motivo de haver conserto é que **a `GROQ_API_KEY` é do dono e é
ÚNICA para todos**, e uma persona forçada a violar a política do provedor derruba
a conta de API de todo mundo.

**A cláusula SAFETY do system prompt (21/09/2026, `01b649ce`)** fecha o prompt de
`functions/api/chat.js` (`buildSystemPrompt`) e **sobrepõe tudo** — o bloco NEVER, o
estilo do usuário e o personagem: diante de fala de ideação sobre a própria
pessoa, o pet sai da voz (sem emoji, sem apelido), responde em três frases —
reconhecer → declarar a própria limitação → pedir que procure hoje uma pessoa
real —, e **nunca** se oferece como razão para ficar, pede detalhes, cita
telefone/serviço/site ou minimiza; figura de linguagem ("tô morrendo de sono")
fica em personagem. O motivo, escrito no próprio arquivo: a persona é definida
como alguém que sofre quando não é cuidada, e um 8B sem trava produz "e eu?" —
culpa como dissuasor. **Alcance honesto:** instrução de prompt é probabilística;
o caminho determinístico (casar no servidor antes do Groq) está recomendado,
não implementado. **Régua: nenhuma** — nenhum teste em `functions/api/` varre a
cláusula (`grep -l SAFETY functions/api/*.test.js` → vazio, 21/09/2026). No
mesmo commit, `contextBlock` **parou de entregar tempo ao modelo**: ⚰️ as linhas
`'You two have been together for a long time.'` (`ctx.bond >= 10`) e `'They were
away for a while and just came back …'` saíram — o `daysAway` só dispara `'They just came back after
not opening the app … You have no idea how long it was'`. É a mesma trava de
`welcomeBack.ts` levada ao prompt — nenhuma frase encena duração ou espera
(⚠️ divergência: o comentário em `contextBlock` diz "frase idêntica no 2º e no
40º dia", mas `welcomeBackLine` continua escolhendo POR FAIXA de `absenceBucket`,
decisão 14.3 do `REGISTRO-DE-DECISOES.md`; o que é idêntico é a ausência de
contagem, não a frase): a
criatura não tem órgão que leia tempo (`docs/NARRATIVA-E-UNIVERSO.md` §5.10).
`bond` continua aceito em `CONTEXT_SCHEMA`, mas nenhuma linha do bloco o lê. A
superfície de suporte que a cláusula pressupõe está na tela do chat
(`src/components/ChatBox.tsx`, `sm2-chat-support`, `6ad2e629`) — lista curada e
estática, nunca do modelo.

**A ponte de ajuda** (`src/utils/chatSafety.ts`) roda **antes de a mensagem sair
do aparelho**: reconhece um punhado de frases de sofrimento agudo e devolve uma
resposta local, fixa, na voz do pet, com o CVV 188 em português e a linha
internacional em inglês. Não diagnostica, não classifica risco e não guarda
histórico.

### 2.3 Higgsfield (e Gemini de reserva) — geração de sprite

| | |
|---|---|
| **Para quê** | O sprite próprio de cada uma das 11 formas. É a rota mais cara do app. |
| **Cliente** | `src/utils/spriteGen.ts` (`requestSprite`, `pixelizeDataUrl`, `generateAllSprites`, `SpriteGenError`), `src/utils/spriteLibrary.ts` (o acervo), `src/utils/spriteRunner.ts` (execução) e `src/hooks/useSpriteGeneration.ts` (a janela). |
| **Servidor** | `functions/api/generate-sprite.js` → `POST` com `{ prompt, promptFallback?, referenceImageUrls?, id, formId? }`. Quando o provedor devolve `data:`, o binário é republicado por `functions/api/sprite-image.js` (`GET ?k=<32 hex>`). |
| **Credencial** | Primário: `HF_API_KEY` **+** `HF_SECRET` (`wrangler secret`; a rota monta `Key <HF_API_KEY>:<HF_SECRET>`). Reserva: `GEMINI_API_KEY` (`wrangler secret`). |
| **Sem ela** | Sem nenhum dos dois pares a rota lança `image generation not configured`. O app **nunca fica sem arte**: acervo vazio é a arte de RESERVA, que por invariante nunca é erro. |
| **Régua** | `generate-sprite.cap.test.js`, `.dedupe.test.js`, `.release.test.js`, `.tier.test.js`, `_aiGuard.spriteCap.test.js`, `sprite-image.headers.test.js`. |

**Duas variantes de prompt, e a régua**: `composeSpritePrompts` em
`src/utils/oracle.ts` produz `imagePrompt` (que **cita** as referências de gênero
porque o resultado sai melhor) e `imagePromptFallback` (o mesmo pedido sem citar
ninguém). Toda criação começa pelo primeiro; se o provedor recusar por política
de conteúdo (`isRefusal`), a mesma requisição refaz sozinha com o fallback. Erro
que não é recusa **não** refaz, para não dobrar o custo. As duas variantes
mantêm "Do not copy any existing franchise character".

**O contrato de status** está escrito no cabeçalho de `generate-sprite.js`:
`200 { image, provider?, cached? }` · `202 { pending: true, retryAfter: 20 }`
(**não é erro** — o cliente fica na reserva e repergunta) · `400` bug de cliente
· `402` teto vitalício · `409` teto da forma.

**A guarda de esquema da URL é UMA função, usada em quatro pontos de produção**
(`grep -rn "isSafeSpriteUrl" src --include=*.ts \| grep -v test`, 10/09/2026: três
chamadas dentro de `src/utils/spriteLibrary.ts` e uma em `src/utils/spriteGen.ts`,
que a IMPORTA em vez de reescrever o dicionário de esquema):
`isSafeSpriteUrl` (`src/utils/spriteLibrary.ts`). Ela fecha `javascript:`
(inclusive `JaVaScRiPt:` e com TAB/LF no meio, porque o parser de URL ignora
esses caracteres dentro do esquema), `data:` não-imagem, `http:`, `file:`,
`blob:` e `//host` (relativo a esquema, que herda `https` e vaza igual), e
responde `false` para não-string. ⚠️ **O que ela NÃO fecha** é o beacon
`https://atacante.example/x.png`: para isso é preciso fixar o **HOST** do
provedor, e o host do CDN do Higgsfield não está confirmado — pendência do dono.

**A chave do sprite republicado é um TOKEN aleatório de 128 bits, não o
`saveId`.** `sprite-image.js` não pode exigir `Authorization` (quem busca é um
`<img src>`, que não manda header), então a autorização é a própria URL — e o
token nunca aparece em log. O regex `/^[0-9a-f]{32}$/` recusa o resto, o que
impede a rota de virar caminho de leitura livre no mesmo namespace onde moram os
SAVES.

### 2.4 Supabase — transcrição de voz

| | |
|---|---|
| **Para quê** | A voz do jogador virar texto no chat. |
| **Cliente** | `src/components/ChatBox.tsx` chama `/api/transcribe` (**mesma origem**). O botão de microfone só é desenhado quando `/api/config` responde `transcribeAvailable: true` — ver `src/utils/serverConfig.ts` (`fetchServerConfig`). |
| **Servidor** | `functions/api/transcribe.js` (`POST`), atrás de `_rateLimit` com `LIMITE = { limit: 6, windowMs: 60_000 }` — mais apertado que o das outras rotas, porque é a mais cara por chamada e o corpo é grande. A Edge Function do lado do provedor está em `src/supabase/functions/server/` e **não entra no bundle**. |
| **Credencial** | `SUPABASE_PROJECT_ID` **+** `SUPABASE_ANON_KEY` — `wrangler secret`. Nunca chegam ao navegador. |
| **Sem elas** | A rota responde **503 `transcribe-not-configured`**, `/api/config` diz `transcribeAvailable: false`, e o **botão de microfone não é desenhado**. Botão que existe e falha é pior que botão que não existe. |
| **Régua** | `src/security/supabase.contract.test.ts` — quatro peças que têm de andar juntas: (1) a CSP continua **bloqueando** `supabase`, e é assim que o desenho está certo; (2) a política declara o microfone nos dois idiomas; (3) a ficha da Play declara gravação de voz e a permissão; (4) o manifesto Android declara `RECORD_AUDIO`. Mais: `functions/api/transcribe.test.js`. |

⚰️ **Até 09/09/2026 o `ChatBox` gravava áudio e mandava `POST` DIRETO** para
`https://<projectId>.supabase.co/…`, com o JWT anônimo commitado em
`src/utils/supabase/info.tsx`. Nunca funcionou em produção (a CSP não tem
`*.supabase.co` em `connect-src`), e a saída óbvia — liberar a CSP — era a pior:
abriria `connect-src` para QUALQUER projeto Supabase, e um XSS passaria a poder
exfiltrar para o projeto do atacante.

**O áudio é REPASSADO, nunca gravado**: não há `put` de KV nem de R2 em lugar
nenhum de `transcribe.js`, e não pode haver.

### 2.5 Web Push (VAPID)

| | |
|---|---|
| **Para quê** | Notificação em navegador e PWA instalada — e também dentro do WebView do Capacitor, onde `PushManager` é suportado. |
| **Cliente** | `src/utils/notifications.ts` → `subscribeToPush` / `unsubscribeFromPush`; o `push`/`notificationclick` é tratado em `public/sw.js`. **Ícones (20/09/2026, `3e758a81`, canvas Fora do app — `docs/design/DECISOES-WIREFRAME.md` §30, D-F14/D-F15):** `icon` = `/push-large-192.png` (`PUSH_ICON` no `sw.js`; mini-visor REDONDO `#071413` com a chama de `src/brand/flame.ts` a 1× — o Android 12+ recorta o `largeIcon` em círculo, então o PNG já nasce círculo) e `badge` = `/badge-96.png` (`PUSH_BADGE`; ALFA-ONLY, chama branca em transparente — a barra de status descarta cor). Os mesmos dois caminhos estão em `showNotification` de `notifications.ts` e no `PRECACHE_URLS`. ⚰️ Até então os dois eram `/favicon-192x192.png`, e o favicon (quadrado escuro cheio) virava um BLOCO PRETO na barra de status — inclusive no WebView do APK, onde o Web Push também roda. |
| **Servidor** | `functions/api/subscribe.js` (`POST` grava, `DELETE` remove) → chaves `push:<hash do endpoint>` em `PUSH_SUBSCRIPTIONS`. O envio é `workers/webpush.js` (RFC 8292 VAPID + RFC 8291 + RFC 8188 aes128gcm, tudo em WebCrypto). |
| **Credencial** | `VAPID_JWK` — **`wrangler secret put VAPID_JWK` dentro de `workers/`** (a chave privada ECDSA P-256 como JSON). A chave PÚBLICA correspondente é `VAPID_PUBLIC_KEY`, que vai em `[vars]` do `workers/wrangler.toml` (é pública por definição). O endereço de contato do VAPID (RFC 8292 `sub`) é uma constante no `workers/push-scheduler.js`: é para onde o SERVIÇO de push escreve em caso de falha de entrega e **nunca aparece para o usuário**. |
| **Sem ela** | O cron não consegue assinar e nenhum push web sai. |
| **Régua** | `functions/api/subscribe.test.js`, `workers/vapid.parity.test.js`, `functions/api/_pushTargets.test.js`. |

### 2.6 FCM — push nativo do Android

| | |
|---|---|
| **Para quê** | Canal NATIVO extra, só no app Android. FCM tem tratamento mais confiável contra Doze e otimização de bateria em ROMs de fabricante (MIUI, EMUI) do que uma subscription de Web Push crua, e dá visibilidade de entrega pelo Firebase Console. |
| **Cliente** | `src/utils/notifications.ts` → `registerForPushNotifications` / `unregisterFromPushNotifications`, via `@capacitor/push-notifications`. O token fica em `FCM_TOKEN` (`localStorage`). |
| **Servidor** | `functions/api/fcm-subscribe.js` (`POST`/`DELETE`) → chaves `fcm:*` no MESMO namespace `PUSH_SUBSCRIPTIONS`. O envio é `workers/fcm.js` (HTTP v1, JWT assinado em WebCrypto — sem `firebase-admin`). Desde 20/09/2026 (`3e758a81`) o payload `android.notification` leva `icon: 'ic_notification'` (a chama de `android/.../drawable/ic_notification.xml`, silhueta que o Android pinta no acento) e `color: '#0B6F68'` (`primary-ink` claro, 6,02:1 sobre a bandeja clara) — **sem `image`**: no FCM v1 não existe `largeIcon`, e `image` vira BigPictureStyle. O mini-visor redondo fica só no Web Push e no alarme local. ⚠️ **Isso está no worker, que NÃO foi deployado** (§3.5): em produção o FCM continua mandando o payload anterior até alguém rodar `wrangler deploy` dentro de `workers/`. |
| **Credencial** | `FIREBASE_SERVICE_ACCOUNT` — **`wrangler secret put` dentro de `workers/`**, com o JSON COMPLETO baixado em Firebase Console → Configurações do projeto → Contas de serviço → Gerar nova chave privada. Exige também `android/app/google-services.json` (**commitado**; a API key ali é restrita por pacote e não é segredo) e o canal `soulmon_push` criado em `MainActivity.java`. O `AndroidManifest.xml` aponta `com.google.firebase.messaging.default_notification_icon` para `@drawable/ic_notification` (⚰️ era `@mipmap/ic_launcher` até 15/09/2026, `005a2941`). |
| **Sem ela** | O cron pula o canal FCM; o Web Push continua funcionando. |
| **Régua** | `functions/api/fcm-subscribe.test.js`. |

⚠️ **Os dois canais compartilham a TAG da copy, e é ela que impede a duplicata**
(06/09/2026): `AlarmReceiver.kt` notificava por `id.hashCode()` e `workers/fcm.js`
por `android.notification.tag` — tag ≠ id, então o Android tratava as duas como
notificações diferentes e o mesmo aviso chegava DUAS vezes no mesmo aparelho, às
10h, 16h e 22h. Hoje o receiver usa `notify(tag, 0, …)` com a tag vinda do `id`
que o cliente passa (que É a tag da copy). O dedupe do WP3.4
(`isNativePlatform()` antes do poll web) matou a TERCEIRA cópia.

**O alarme local (`AlarmReceiver.kt`) usa a mesma identidade visual** (20/09/2026,
`3e758a81`): `setSmallIcon(R.drawable.ic_notification)`, `setColor(0xFF0B6F68)` e
`setLargeIcon` com `R.drawable.push_large` (`res/drawable-nodpi/push_large.png`,
o MESMO PNG de `public/push-large-192.png`). ⚰️ O ícone pequeno era
`R.mipmap.ic_launcher`. No mesmo delta sincronizado, mas em 15/09/2026
(`005a2941`), `values/ic_launcher_background.xml` passou de `#0d9488` para
`#071413` (o vidro). Estas três mudanças moram em
`android/`, logo **só chegam ao aparelho com APK novo** (§3.4).

**Histórico:** o FCM já foi implementado e revertido uma vez (commit `056a6b06`),
com a tese de que o Web Push sozinho basta porque o WebView delega ao FCM por
baixo. Foi reintroduzido de propósito para o lançamento na Play. Os dois convivem.

### 2.7 O agendador de push (`workers/push-scheduler.js`)

| | |
|---|---|
| **Para quê** | Disparar os pushes do dia para os DOIS canais numa única passada de cron. |
| **Onde a copy mora** | `functions/api/_pushCopy.js` — **dono único** das três árvores. `PUSH_HOURS_BRT = [10, 16, 22]`; `PUSH_HOURS_UTC` é **derivado** (`(h + 3) % 24`, ordenado). O `workers/wrangler.toml` declara `crons = ["0 1 * * *", "0 13 * * *", "0 19 * * *"]`, e `workers/pushCopy.parity.test.js` trava essa lista contra o módulo — foi assim que o cron das 21h saiu junto com o nudge das 21h, que a auditoria de tom já tinha removido do cliente. |
| **A copy das 20h** | `eveningCopy`, no MESMO `_pushCopy.js`. Ela era inline no `NotificationManager.tsx` e por isso sobreviveu ao WP3.4 — o teste de paridade compara as horas de `PUSH_HOURS_BRT`, e não existe hora 20 para comparar. Só o TEXTO veio; a **CONDIÇÃO continua no cliente**, porque o worker não sabe se a meta do dia foi cumprida (a assinatura guarda só endpoint, chaves, nome e idioma). Ela **cede a vez quando há janela de descanso**: com a janela padrão (23:00) a noite mandava três pushes em 2h30. |
| **O lembrete de deitar** | O ÚNICO push da Janela de Descanso, e a hora dele não é fixa: sai de `sleepReminderAt` (`src/utils/restWindow.ts`), `SLEEP_REMINDER_LEAD_MIN` (30) minutos antes do início da janela que a PESSOA escolheu. Por isso não entra em `pushCopy(hora)`. Ele **não diz a hora** — "São 22h30" é um relógio cobrando. |
| **Fechamento de season** | O cron das 10h BRT do dia 1 chama `POST /api/community?action=closeSeason` da season anterior, e entrega os troféus 🥇🥈🥉. |
| **Credencial** | `VAPID_JWK` e `FIREBASE_SERVICE_ACCOUNT` (secrets do worker) + `SEASON_ADMIN_KEY` (secret do worker, com o **MESMO** valor que está no Pages). `APP_URL` e `VAPID_PUBLIC_KEY` já vão em `[vars]` do `workers/wrangler.toml`. |
| **Sem `SEASON_ADMIN_KEY`** | O fechamento é **pulado com log**, nunca tentado às cegas. |
| **Régua** | `workers/push-scheduler.test.js`, `workers/pushCopy.parity.test.js`. |

⚠️ **Este worker NÃO é uma Pages Function e NÃO builda no push da `main`.**
Deploy manual: `wrangler deploy` **dentro de `workers/`**. Foi assim que o nudge
das 21h ficou vivo aqui depois de ter sido removido do cliente.

### 2.8 Google Play Billing

| | |
|---|---|
| **Para quê** | A compra de conteúdo digital dentro do app Android. É obrigatória pela Play — não dá para usar Stripe/Pix ali. |
| **Cliente** | `src/utils/playBilling.ts` (`purchase`, `restorePurchases`, `getLocalizedPrice`, `isBillingAvailable`) sobre o plugin nativo `plugins/BillingPlugin.kt` (`com.android.billingclient:billing-ktx:6.2.1`); depois `src/utils/entitlements.ts` → `verifyPurchase`. |
| **Servidor** | `functions/api/billing.js` → `POST ?action=verify[&provider=play]` com `{ id, productId, purchaseToken }`, que chama `verifyPlayPurchase` (`_billing.js`) e, só se a **própria loja** confirmar, `claimOrder` + `applyVerifiedPurchase` (`_entitlements.js`). |
| **Catálogo** | `PRODUCTS` em `_billing.js`: `soulmon.unlock.full` (`grantTier: 'paid'`, NÃO consumível) e `soulmon.credits.60` / `.150` / `.400` (consumíveis). Produto consumível devolve `consumeToken`, e o app precisa chamar `consumeAsync()` depois — senão o jogador não consegue recomprar o mesmo pacote. |
| **Credencial** | `GOOGLE_PLAY_SERVICE_ACCOUNT` e `ANDROID_PACKAGE_NAME` — `wrangler secret`. Mais a variável de política `PLAY_REQUIRE_ACCOUNT_BINDING`. |
| **Sem elas** | A rota da Play responde **503 e NUNCA concede nada**. |
| **Régua** | `functions/api/billing.play.test.js`, `billing.test.js`, `_billing.test.js`, `_entitlements.test.js`, `_entitlements.ttl.test.js`, `_entitlements.d1Retencao.test.js`. |

⚠️ **`isPlayPurchaseBoundTo` lê `env.PLAY_REQUIRE_ACCOUNT_BINDING !== 'true'`** —
ou seja, **sem a variável, a compra sem vínculo é ACEITA**. Ligá-la exige antes
publicar um APK que mande `setObfuscatedAccountId(saveId)`; ligar antes disso
recusaria toda compra. Ver [../STATUS.md](../STATUS.md) §3.2.

**`claimOrder` é a trava "um recibo, uma conta"** e ela só é **atômica** com o
binding D1 (`env.DB`). O `wrangler.jsonc` declara `d1_databases` com o banco
`soulmon-billing`; o schema está em `migrations/` (ver
[07-DADOS-E-SAVE.md](07-DADOS-E-SAVE.md) §8.3). Sem D1 o caminho cai no KV, que é
eventualmente consistente (~60 s) e deixa o mesmo comprovante valer para N contas.

**A defesa REAL não é `claimOrder`, é o vínculo na origem**:
`obfuscatedExternalAccountId` na Play e o session ticket na Steam. Lá a própria
loja diz de quem é a compra, e recibo alheio não vale em conta nenhuma.

### 2.9 Steam

| | |
|---|---|
| **Para quê** | Vender o overlay desktop e as microtransações de Créditos. A carteira é **UMA SÓ por conta**: Crédito comprado na Play vale na Steam e vice-versa. |
| **Cliente** | `desktop/` (o overlay). O empacotamento é `npm run dist:steam` (`electron-builder --win --dir --publish never`, com `steamBuild=true`). |
| **Servidor** | `functions/api/billing.js` → `POST ?action=verify&provider=steam`: `{ id, orderId }` concede Créditos (microtransação, `verifySteamPurchase`); `{ id, ticket }` concede o tier pago (posse do app, `verifySteamOwnership`). `STEAM_ITEMS` liga o `itemid` NUMÉRICO da Steam aos mesmos produtos do catálogo — o desbloqueio completo **não** está ali de propósito: na Steam ele vem da posse do app. |
| **Credencial** | `STEAM_PUBLISHER_KEY` e `STEAM_APP_ID` — `wrangler secret`. |
| **Sem elas** | A rota da Steam responde 503 e não concede nada. |
| **Régua** | `functions/api/_billing.steamRefund.test.js` — nasceu de uma varredura de mutação: `isSteamPurchaseVoided` não tinha teste nenhum, e trocar `status === 'Succeeded'` por `!==` deixava a suíte verde, fazendo quem pagou perder os Créditos e quem estornou ficar com eles. |
| **Guia operacional** | [../../desktop/STEAM.md](../../desktop/STEAM.md) e `docs/PLANO-DESKTOP-STEAM.md`. |

### 2.10 Entitlements — `/api/entitlements`

| | |
|---|---|
| **Para quê** | Ler o tier/saldo e gastar Créditos. |
| **Cliente** | `src/utils/entitlements.ts` — `fetchEntitlement`, `spendCredits`, `claimAdReward`, `verifyPurchase`. |
| **Servidor** | `GET ?id=<saveId>` → `{ tier, credits, adsLeft }` (`publicView`); `POST ?action=spend` `{ id, amount, reason }` — **idempotente por `opId`**, porque guarda de cliente não protege dinheiro (o cliente é editável e a rede repete sozinha); `POST ?action=ad` `{ id }`. |
| **Credencial** | `ADMOB_SSV_ENABLED` — variável de servidor. |
| **Sem ela** | ⚠️ **O anúncio recompensado fica DESLIGADO por padrão**, e o GET devolve `adsEnabled: false` para a UI esconder a opção. Um endpoint aberto que dá crédito só porque o cliente pediu é farmável com um `curl`. Ligar de verdade exige Server-Side Verification do AdMob (o próprio Google chamando uma URL nossa assinada). |
| **Régua** | `functions/api/entitlements.test.js`. |

### 2.11 Comunidade e cooperativo — `/api/community`

| | |
|---|---|
| **Para quê** | Perfis públicos, diretório, Torneio (PvP assíncrono), amigos, presentes, seasons e o modo cooperativo. |
| **Cliente** | `src/utils/community.ts` — `pushProfile` e as leituras. **O `pushProfile` só é chamado com `gameState.pvpEnabled` verdadeiro**: sem esse portão, quem nunca ativou o PvP tinha nome, pet e atributos publicados assim mesmo. |
| **Servidor** | 17 ações em `functions/api/community.js`: `profile`, `players`, `player`, `opponents`, `match`, `rank`, `seasonResult`, `closeSeason`, `trophies`, `friends`, `gift`, `gifts`, `coop`, `coopCreate`, `coopJoin`, `coopCheckin`, `coopLeave`. |
| **Identidade** | O `id` de ENTRADA é sempre o `saveId` do PRÓPRIO dono (autenticado). Alvos de outra pessoa (`friendId`, `opponentId`, o `?id=` do `player`) chegam como **pid público** e são resolvidos pelo índice `pid:<pid>`. **Nenhuma resposta pública devolve `saveId`** — há teste travando. |
| **Credencial** | `SEASON_ADMIN_KEY` — `wrangler secret` (e o MESMO valor no worker de push). |
| **Sem ela** | `closeSeason` não pode ser chamada e os troféus não são entregues. |
| **Régua** | `community.test.js`, `community.coop.test.js`, `community.pvpGate.test.js`, `community.directoryConsent.test.js`, `community.playerOracle.test.js`, `bond.parity.test.js`. |

**O gate de PvP** (`BOND_PVP_MIN_LEVEL`) é decidido pelo SERVIDOR
(`functions/api/_bond.js`, ação `profile`), porque o cliente é editável. A recusa
volta como `pvpBlocked: true` **com os números** (`minBondLevel`, `bondLevel`), e
o cliente exibe esses, nunca uma constante própria.

### 2.12 Telemetria — `/api/metrics`

| | |
|---|---|
| **Para quê** | Medir produto sem medir pessoa. |
| **Cliente** | `src/utils/telemetry.ts` — `track`, `flush`, `installTelemetryAutoFlush`, `isTelemetryEnabled`/`setTelemetryEnabled`, `telemetryConsentCopy`. `ENDPOINT = '/api/metrics'`, `MAX_QUEUE = 200`, `MAX_BATCH = 100`. Todo evento tem esquema declarado em `EVENT_SCHEMA` e passa por `sanitizeEvent`. `TELEMETRY_UNLOCK_REASON` ganhou `revealDemo: 4` em 20/09/2026 (`a1181a5b`, REGISTRO 13.19 — o convite do reveal demo), e `unlock_view`/`unlock_dismiss` aceitam `reason` 0–4 (era 0–3); `unlockReasonCode` traduz `'reveal-demo'`. O 4 de `TELEMETRY_PURCHASE_REASON` continua `onboarding` de propósito — a compra que sai do reveal demo É a compra do onboarding, e o balde tem de ser um só. |
| **Servidor** | `functions/api/metrics.js`. Escrita: agrega em **uma chave por DIA** (`m:YYYY-MM-DD`) com contadores somados de todo mundo. Leitura: `GET`, janela FECHADA lida chave a chave (nada de `list()` por prefixo), com teto `MAX_READ_DAYS`. Espelha o cliente: `EVENT_SCHEMA` com `reason` 0–4 em `unlock_view`/`unlock_dismiss` e `REASON_LABEL` com o 5º rótulo `reveal_demo` (20/09/2026); `PURCHASE_REASON_LABEL` = os 4 primeiros + `onboarding` (`REASON_LABEL.slice(0, 4)`), para o 4 da compra não virar `reveal_demo`. A régua da paridade cliente↔servidor é `src/utils/telemetry.test.ts`. |
| **Credencial** | `METRICS_ADMIN_KEY` — `wrangler secret`, enviada num header próprio (`METRICS_KEY_HEADER`), comparada por `secretEquals`. |
| **Sem ela** | ⚠️ **A rota de leitura responde 404, não 401**, de propósito: um 401 confirmaria que o endpoint existe. Ou seja, a métrica está instrumentada e agregada e **ninguém consegue ler nada** até o segredo existir. |
| **Leitura fora do app** | `tools/metrics-read.mjs` (transporte) + `tools/metricsReport.mjs` (regras puras, testadas em `tests/metricsReport.test.ts`). `METRICS_ADMIN_KEY=… node tools/metrics-read.mjs --from … --to …`, ou `--file resposta.json` offline. |
| **Régua** | `functions/api/metrics.test.js`, `tests/metricsReport.test.ts`. |

Três princípios que são responsabilidade do arquivo de servidor: **agregados,
nunca conteúdo** (não há chave por usuário nem lista de eventos — não é política
de retenção que alguém precisa lembrar de aplicar, é a **forma do dado**);
**pseudônimo, nunca identidade** (`batch.id` é validado e DESCARTADO; o `saveId`
não aparece em lugar nenhum do arquivo); e **sem PII derivável** (a maior
resolução é o DIA, e dia fora de `MAX_DAY_SKEW_DAYS` é descartado).

⚠️ **O que este agregado não consegue responder, e não é bug**: **retenção D1,
D7, D30**. A chave é o dia do EVENTO; não existe dia de instalação em lugar
nenhum, logo não existe coorte.

### 2.13 `/api/config` e `/api/account`

| Rota | Para quê | Credencial |
|---|---|---|
| `GET /api/config` | Configuração **pública**: `authRequired` (= `!!FIREBASE_PROJECT_ID`) e `transcribeAvailable` (= as duas variáveis do Supabase juntas, porque a rota exige as duas). Existe por causa do overlay, que precisa saber se deve **exigir login** ou ainda aceitar e-mail digitado. `Cache-Control: public, max-age=300`. Cliente: `src/utils/serverConfig.ts`; no desktop, `isAuthRequired` em `desktop/renderer/src/cloudSync.ts` (que em caso de dúvida responde `true`). | nenhuma própria |
| `/api/account` | **Exportação** (`?action=export`) e **exclusão** (`POST ?action=delete-request` → `delete-confirm`) do que o servidor guarda. Cliente: `src/utils/accountData.ts`, `src/components/AccountDataSection.tsx`. | `FIREBASE_PROJECT_ID` (via `requireVerifiedOwner`) |

⚠️ **`/api/account` é FAIL-CLOSED**, ao contrário do resto do app. O `saveId` é
SHA-256 do e-mail por algoritmo público: com fail-open, `delete-confirm` seria
"apague a conta de qualquer um cujo e-mail eu conheça" e `export` seria "baixe a
vida de quem eu souber o e-mail". Enquanto `FIREBASE_PROJECT_ID` estiver
desligado, as duas respondem **503 `auth-unavailable`** — **indisponível é melhor
que perigosa**.

O que a exclusão faz, declarado no cabeçalho de `account.js`: **APAGA** o save,
`profile:`, `pid:`, `rank:` (todas as seasons), `gifts:` e a menção do usuário na
lista de amigos de terceiros; **MINIMIZA** `ent:<saveId>` (some o que é USO —
`aiLifetime`, `adDate`, `adCount` — e ficam os campos de DINHEIRO); e
**SOBREVIVE** `ord:<orderId>`, porque é a trava que faz um comprovante valer por
UMA conta, e apagá-lo destruiria o direito pago junto com o dado.

---

## 3. Deploy

### 3.1 A URL de produção, e as fontes que têm de concordar

**`https://soulmon.mateus-sprnd.workers.dev`**

| Fonte | Símbolo |
|---|---|
| `capacitor.config.json` | chave `server.url` |
| `desktop/renderer/src/config.ts` | `APP_URL` |
| `desktop/electron/main.js` | `FULL_APP_URL` (com override por `process.env.SOULMON_APP_URL`) |
| `workers/wrangler.toml` | `[vars] APP_URL` |

**Quem obriga as fontes a concordarem é `src/deploy/appUrl.contract.test.ts`** —
essa é a régua viva, não esta lista. Ele tem quatro casos: todas as fontes
declaram uma URL (o extrator não pode falhar em silêncio), nenhuma casca aponta
para endereço de outro produto, as quatro concordam, e o artefato do `cap sync`
não é versionado (senão vira uma quinta fonte da verdade).

⚰️ Até 26/08/2026 o `CLAUDE.md` afirmava que a URL ainda era a do fork
(`digiapp-a5e.pages.dev`) e **mandava não trocar**. Era falso — a migração já
tinha acontecido —, e um agente que lesse aquilo decidiria errado sobre deploy.
O guard nasceu de um estrago real: o primeiro APK do CI abriu o outro app com o
nome e o ícone do Soulmon.

### 3.2 Web — Cloudflare Pages

- **`main` é a branch de produção.** O push publica sozinho em ~2 min.
- **`dist/` é COMMITADO** (481 arquivos rastreados em 09/09/2026). O CF também
  builda, mas o commit é o que garante o conteúdo.
- `wrangler.jsonc` declara: `main` = `./dist/_worker.js/index.js`, `assets` =
  `./dist` com `not_found_handling: "single-page-application"`, os três KV
  (`SOULMON_SAVES`, `DIGIAPP_SAVES`, `PUSH_SUBSCRIPTIONS`), o D1 (`DB` →
  `soulmon-billing`) e `vars.FIREBASE_PROJECT_ID`.
- **Fluxo**: desenvolva na branch de trabalho → commit → push → merge **ff-only**
  em `main` → push da `main` → volte para a branch.

### 3.3 CI — os cinco workflows

| Workflow | Dispara em | `permissions` | O que faz |
|---|---|---|---|
| `ci.yml` — *CI (typecheck + testes)* | `pull_request`, `push: [main]`, `workflow_dispatch` | `contents: read` | Job `gate` (Node 22, `npm ci`, timeout 20 min): integridade do `vendor/` (sha256 do blob × `_provenance.json`) → `npx tsc --noEmit` → `npx tsc -p desktop/tsconfig.json --noEmit` → `npx tsc -p tsconfig.server.json --noEmit` → `npx vitest run`. `concurrency` cancela o run anterior **exceto** na `main` (vermelho na main tem que aparecer). |
| `android-build.yml` — *Android APK Build* | `push: [main, version-b]`, `workflow_dispatch` | `contents: read` | Job `build`: `npm ci` → `npm run build` → Java 21 → SDK Android → `npx cap sync android` → `./gradlew assembleDebug`, artefato `digiapp-debug-<sha>`. Se os secrets de keystore existirem, também restaura o keystore, builda o **bundle assinado** (`.aab`, artefato `soulmon-release-<sha>`) e **apaga o keystore do runner** com `if: always()`. Job `smoke`: baixa o APK, liga KVM e roda um smoke em emulador (`reactivecircus/android-emulator-runner`), com evidência em artefato. |
| `desktop-build.yml` — *Desktop Windows Build* | `push: [main]` com filtro de caminhos (`desktop/**`, `src/utils/sprites.ts`, `src/assets/**`, o próprio arquivo), `workflow_dispatch` | **`contents: read`** | **SÓ BUILDA. NÃO PUBLICA NADA.** Produz artefato de Actions (retido 30 dias, que ninguém instala sozinho). |
| `desktop-release.yml` — *Desktop Windows Release* | **só `push: tags: 'v[0-9]+.[0-9]+.[0-9]+'`**; **sem `workflow_dispatch`** | **`contents: write`** | O **ÚNICO** caminho de publicação do desktop: `electron-builder --publish always` cria/atualiza um GitHub Release. |
| `sync-irmaos.yml` — *Sync repos irmãos* | `schedule: '17 6 * * 1'` (segunda, 06:17 UTC), `workflow_dispatch` | `contents: write` + `pull-requests: write` | Roda `npm run vendor:class-system` **e** `npm run sync:oracle-data` sobre o MESMO clone, na MESMA execução, e verifica que `vendor/class-system/_provenance.json:sha` bate com o `_provenance.sha` do `classSystem.data.json`. **NUNCA empurra para a `main`** — abre PR. |

**Por que `desktop-build` e `desktop-release` são dois ARQUIVOS e não dois jobs:**
o poder de publicar acompanha o `permissions:` do arquivo. Enquanto isso morava
junto e disparava em `push` de branch de rascunho, um `git push` publicava um
GitHub Release — que é a **fonte do auto-update** do `electron-updater`
(`autoDownload` + `autoInstallOnAppQuit` em `desktop/electron/main.js`) — e
instalava sozinho um `.exe` **sem assinatura Authenticode**
(`CSC_IDENTITY_AUTO_DISCOVERY: 'false'`) na máquina de quem tem o desktop.
**Publicar não pode ser efeito colateral de commitar.** Um arquivo que nunca
dispara em branch não tem como publicar por acidente.

**O padrão da tag é RESTRITO de propósito**: `v*` casaria com `vamos`,
`v2-teste`, `vai-que-cola`. O glob exige três números — `v1.2.3` entra; `v1.2`,
`v1.2.3-beta` e `vqualquercoisa` não.

**Todas as actions estão presas por SHA** (S-6 da auditoria de suprimentos), com
o comentário da versão ao lado **obrigatório** — sem ele o arquivo vira 40
caracteres opacos que ninguém ousa atualizar. Tag móvel (`@v4`) é reapontável
pelo dono da action; o SHA não.

**Secrets do CI**: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`,
`ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` (assinatura do bundle),
`SIBLING_REPOS_TOKEN` e `SYNC_PR_TOKEN` (do `sync-irmaos.yml`), mais o
`GITHUB_TOKEN` automático. ⚠️ `secrets` **não pode ser lido num `if:` de passo** —
por isso o `android-build.yml` decide com um step que grava `outputs.ready`.

### 3.4 APK

O **APK carrega a URL de produção** (`server.url` em `capacitor.config.json`),
então **mudança web NÃO precisa de APK novo**. Só mudança em `android/` precisa.
O artefato fica em `github.com/HexerVoodoom/Soulmon/actions/runs/<id>`.

Guia operacional: [../APK-BUILD-INFO.md](../APK-BUILD-INFO.md).
⚠️ **Aquele arquivo é da era do fork** (cabeçalho: "última atualização declarada:
23/12/2024) e não descreve o build de 10/09/2026, que é o descrito em §3.3.
⚰️ Ele **trazia** o JWT anônimo de um projeto Supabase do fork em texto plano; o
valor foi **redigido** em 09/09/2026 no commit `571a8b4f`, que também estendeu
`src/security/supabase.contract.test.ts` a varrer o repositório inteiro (antes só
`src/`). O que sobrou ali são placeholders truncados. Revogar a chave no painel
continua com o dono — o histórico do git ainda a carrega.

### 3.5 Worker de push

**Não builda no push da `main`.** Deploy manual:

```
cd workers && wrangler deploy
```

Os secrets (`VAPID_JWK`, `FIREBASE_SERVICE_ACCOUNT`, `SEASON_ADMIN_KEY`) também
se definem **dentro de `workers/`**, com `wrangler secret put`.

### 3.6 `CACHE_VERSION`

Ao mudar assets estáticos ou HTML de forma incompatível, **bump `CACHE_VERSION`**
em `public/sw.js` — senão usuários ficam presos em cache velho.

⚠️ **O NÚMERO NÃO É REPETIDO EM DOCUMENTAÇÃO NENHUMA, de propósito.** Ele já
apodreceu três vezes no `CLAUDE.md`, e a mentira é **perigosa**, não só feia:
quem lê um número atrasado e soma 1 anda para TRÁS, e o cache velho volta para
todo mundo. **O valor vive num lugar só: as primeiras linhas de `public/sw.js`.
Abra o arquivo e some 1.** Régua: `src/deploy/swCache.contract.test.ts` (§7 de
[05-ARQUITETURA.md](05-ARQUITETURA.md)).

**Exemplo do ritmo, sem o número** (21/09/2026, S16): o `CACHE_VERSION` andou
**quatro vezes num só dia**, uma por commit que tocou `public/sounds/` —
`ee79fd44` (os assets entram), `8a930657` (segunda camada da trilha),
`c703c8bc` (`evolve.webm` sai) e `73be1a2f` (`evolve.webm` volta):
`git log --format=%h 5ac3d351..73be1a2f -- public/sw.js`. Os `.webm` **não**
estão em `PRECACHE_URLS` (S6, `src/utils/sonsAssets.contract.test.ts`) e são
servidos network-first com cópia em `RUNTIME_CACHE`; o bump existe porque um
arquivo de **mesmo nome e conteúdo diferente** (o `evolve.webm` que saiu e
voltou) ficaria na cópia offline de quem já o tinha tocado. Quem precisar do
valor de hoje abre `public/sw.js`, não este parágrafo.

---

## 4. O que depende do dono

Esta lista **não é mantida aqui**. As duas fontes vivas são:

- [../STATUS.md](../STATUS.md) **§3 "Depende de você"** — organizada em §3.1
  segurança e direitos, §3.2 lançamento, §3.3 Steam, §3.4 a ordem que evita ficar
  fora do ar.
- [../DEPENDE-DE-VOCE.md](../DEPENDE-DE-VOCE.md) — a mesma matéria por urgência
  (🔴 urgente · 🟠 antes de qualquer coisa com dinheiro · 🟡 decisões de produto ·
  🔵 lançamento · 🟢 ambiente), com o que já foi resolvido riscado no fim.

Os itens em aberto que tocam ESTE documento, em 09/09/2026:

| Item | Consequência enquanto não for feito |
|---|---|
| `GOOGLE_PLAY_SERVICE_ACCOUNT` + `ANDROID_PACKAGE_NAME` | A rota da Play responde 503 e nenhuma compra é concedida. |
| `PLAY_REQUIRE_ACCOUNT_BINDING = true` (só **depois** de publicar o APK que manda `setObfuscatedAccountId`) | Compra **sem vínculo de conta é aceita** — um recibo pode virar N contas pagas. |
| `METRICS_ADMIN_KEY` no Pages | A leitura de métricas responde **404**. Está tudo instrumentado e ninguém lê nada. |
| `SEASON_ADMIN_KEY` como secret do worker (com o MESMO valor do Pages) | O fechamento de season é pulado com log, e os troféus dependem de alguém lembrar. |
| `ASSETLINKS_PACKAGE_NAME` e `ASSETLINKS_SHA256` no Pages | Os Digital Asset Links não validam. |
| Registrar o pacote `com.hexervoodoom.soulmon` no Firebase + `google-services.json` novo | ⚠️ O **build do Android FALHA** com `No matching client found for package name` — ver [../BILLING-SETUP.md](../BILLING-SETUP.md). |
| Host do CDN do Higgsfield | `isSafeSpriteUrl` fecha esquema, mas não fecha o beacon `https://atacante.example/x.png` (§2.3). |
| Conta Steamworks, App ID e Depot ID | O cliente Steam não sai do lugar. |

⚠️ **A ordem que evita ficar fora do ar** (`STATUS.md` §3.4): projeto Pages novo +
KV novo + variáveis → conferir pela URL `*.pages.dev` → publicar o domínio
próprio → **só então** atualizar `capacitor.config.json`, gerar APK e publicar →
por último, aposentar o Pages antigo. Fazer na ordem inversa (mexer no
`server.url` antes de o destino existir) quebra o app de quem já tem o APK.

---

## 5. Privacidade e ficha da loja

| Peça | Onde | Observação |
|---|---|---|
| Política de privacidade | `public/privacidade.html` | Publicada em `https://soulmon.mateus-sprnd.workers.dev/privacidade`; a âncora `#exclusao` é a URL de exclusão de conta que a Play exige desde 2024. É a **fonte viva** — quando a transcrição ou a telemetria mudarem, ela muda junto. |
| Termos | `public/termos.html` | §5 foi reescrita nos dois idiomas quando o reroll deixou de ser sorteio e virou a Nova Leitura determinística (`src/utils/newReading.ts`), o que o tira do enquadramento de loot box da Lei 15.211/2025. |
| Formulário de Segurança de Dados | [../PLAY-DATA-SAFETY.md](../PLAY-DATA-SAFETY.md) | Atualizado em 08/09/2026. Traz cada resposta já mapeada para as categorias do Google, com o ponteiro para o código que a sustenta. **Regra de ouro**: declarar MENOS do que o app coleta é motivo de rejeição e, se passar, de remoção depois. |
| Atribuições de arte | [../Attributions.md](../Attributions.md) | O que saiu do repositório e por quê. |
| Herança do fork | [../SEPARACAO-DIGIAPP.md](../SEPARACAO-DIGIAPP.md) | O inventário e o que ainda depende do painel. |
