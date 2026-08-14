# Verificação de segurança — Soulmon (fase sweeper)

> Papel: `security-architect`. Esta rodada **verifica controles**; não roda a suíte
> (isso é do `qa-sweeper`) e **não alterou uma linha de código de produção**.
> Padrões de referência: OWASP ASVS v4/v5 (**alvo proposto: L2** — o app trata
> PII e dinheiro real), OWASP Top 10, LGPD (Lei 13.709/2018).

---

## 1. Veredito

**NÃO SHIP como "auditado e corrigido".** Três dos cinco SEC estão corrigidos no
código mas **inertes em produção** — `authorizeSaveAccess` é um *no-op* enquanto
`FIREBASE_PROJECT_ID` não estiver configurado (e `docs/STATUS.md` §3.1 confirma
que não está), e `claimOrder` só é atômico com um binding D1 que §3.2 lista como
*opcional/pendente*. O código está certo; **a configuração é que decide se ele
existe**, e hoje ela diz que não.

---

## 2. Tabela de verificação SEC-1..SEC-5

| # | Vetor | Controle atual | Fecha? | Evidência |
|---|---|---|---|---|
| **SEC-1** | 5 de 11 ações de `community.js` sem autorização | `denyUnlessOwner` em `functions/api/community.js:149`, chamado em `:160` (profile), `:256` (match), `:356` (trophies), `:374` (friends), `:400` (gift), `:421` (gifts) | **Parcial — cobertura completa, eficácia zero hoje** | As 6 ações que escrevem/destroem em nome de `id` passam pelo gate. Nenhuma escrita aceita `saveId` alheio sem passar. **Mas** `_auth.js:112-113`: `if (!projectId) return { ok: true, enforced: false }` — sem `FIREBASE_PROJECT_ID`, *todo* `denyUnlessOwner` devolve `null` (autorizado). Em produção, hoje, SEC-1 continua explorável por quem souber o **e-mail** da vítima. As 5 ações de leitura sem gate (`players`, `player`, `opponents`, `rank`, `seasonResult`) são públicas por desenho e não escrevem. |
| **SEC-2** | `saveId` publicado como identidade social | `publicIdFor` (`community.js:63`), índice reverso `pid:` (`:69`/`:74`), montagem única em `publicProfile` (`:83`) | **Sim** | Auditei as 11 respostas. Nenhuma devolve `p.id` cru: `players:198` e `opponents:234` passam por `publicProfile`; `player:214` converte `friends` para pid; `rank/seasonResult:317` usa `p?.pid ?? publicIdFor(ownerSave)`; `friends:391` mapeia para pid; `profile:183` devolve `profile.pid`. `gift` e `trophies` não devolvem id. **Nenhum vazamento de saveId encontrado.** Observação: `community.js:208` (`saveIdForPublicId(...) \|\| id`) aceita um saveId cru como alvo de `player` — não vaza nada novo (a resposta é `publicProfile`), mas é um oráculo de existência de saveId. Aceitável. |
| **SEC-3** | `claimOrder` não atômico → 1 recibo → N contas pagas | `_entitlements.js:147-155` (`if (env.DB) claimOrderAtomic`, senão KV) + `_billing.js:179` (`isPlayPurchaseBoundTo`) | **NÃO fecha na configuração atual** | `claimOrder` só é atômico **se `env.DB` existir**. `docs/STATUS.md` §3.2 lista o D1 `order_claims` como 🟡 *opcional*. Sem D1, cai em `:150-153` — read-modify-write em KV eventualmente consistente, exatamente o vetor descrito. A segunda trava (`obfuscatedExternalAccountId`) só recusa quando `PLAY_REQUIRE_ACCOUNT_BINDING === 'true'` (`_billing.js:182`), e §3.2 marca essa flag como 🔴 pendente. **Hoje as duas travas estão desligadas.** Atenuante real e único: o billing inteiro responde 503 sem `GOOGLE_PLAY_SERVICE_ACCOUNT`/`STEAM_PUBLISHER_KEY` (`_billing.js:121`, `:238`), então o buraco só arma no dia do lançamento — e é exatamente aí que ele arma. |
| **SEC-4** | Microtransação Steam sem vínculo com o dono | `_billing.js:340-376` | **Sim** | `:344` exige `ticket`; `:353` autentica pela Valve (`AuthenticateUserTicket`); `:374` compara `String(params.steamid) !== auth.steamId` e recusa. O oráculo de enumeração morre: adivinhar um `orderid` alheio agora falha na comparação de steamid. `verifySteamOwnership:304` mantém a recusa de Family Sharing. |
| **SEC-5** | SSRF no `endpoint` de push | `_pushTargets.js:32-46`, aplicado em `subscribe.js:38` (entrada) e `push-scheduler.js:110` (saída, com expurgo das linhas velhas) | **Parcial** | Protocolo (`:40`), porta (`:42`) e comparação por rótulo de domínio (`:45`, não `endsWith` cru) estão corretos, e a revalidação na saída cobre o KV legado — bom desenho. Duas frestas: (a) `googleapis.com` é um sufixo **amplo demais** — inclui `storage.googleapis.com`, `firebasestorage.googleapis.com` etc.; o alvo real do Chrome é só `fcm.googleapis.com`; (b) `workers/webpush.js:107` faz `fetch` com `redirect` default (`follow`), então um 302 do host permitido ainda leva a requisição para fora da allowlist. Ver achado N-4. |

---

## 3. Achados novos

### N-1 · CRÍTICO (de configuração) — todo o modelo de autorização está desligado em produção
`functions/api/_auth.js:112-113`

```js
const projectId = env.FIREBASE_PROJECT_ID;
if (!projectId) return { ok: true, enforced: false };
```

**Cenário do atacante** (nenhuma conta necessária, nenhum token):
1. Obtém o e-mail da vítima (rede social, vazamento, ou simplesmente conhece a pessoa).
2. `saveId = SHA-256("soulmon:" + email.trim().toLowerCase()).slice(0,32)` — algoritmo público em `_auth.js:94` e replicado no cliente.
3. `GET /api/save?id=<saveId>` → save inteiro. `POST` → sobrescreve.
4. `POST /api/community?action=gift {id:<saveId>, friendId:<pid do atacante>}` → 20 Bits/dia da vítima.
5. `GET /api/community?action=trophies&id=<saveId>&claim=1` → apaga os troféus de season dela, **sem reemissão**.
6. `POST /api/entitlements?action=spend {id:<saveId>, amount:N}` → queima os Créditos comprados com dinheiro real da vítima.

**Impacto:** takeover total de conta a partir de um e-mail. ASVS V4.1.1/V4.1.3 (falha do controle de acesso no servidor) — o controle existe, mas está *fail-open* por configuração.
**Correção:** ligar `FIREBASE_PROJECT_ID` é o item que mais reduz raio de explosão no projeto inteiro. Enquanto não puder ser ligado, o modo aberto deveria ser **explícito e barulhento** (log/alerta no boot, e um `X-Auth-Enforced: false` na resposta), não silencioso.

### N-2 · ALTO — o preflight CORS quebra o próprio controle no dia em que ele for ligado
`functions/api/save.js:13-17`, `entitlements.js:28-32`, `community.js:29-33` — todos declaram
`'Access-Control-Allow-Headers': 'Content-Type'` (só `billing.js:38` inclui `Authorization`).

**Cenário concreto** (não é atacante — é auto-DoS, e por isso é pior):
1. O overlay Electron roda de `file://` (`main.js:151`, `loadFile`) → `Origin: null`, requisição **cross-origin**.
2. `desktop/renderer/src/cloudSync.ts:109/176/214/242` manda `Authorization: Bearer …` assim que houver sessão.
3. Header não-simples → preflight `OPTIONS` → o servidor responde `Allow-Headers: Content-Type` → o Chromium **bloqueia** a chamada.
4. O `catch` em `cloudSync.ts:114` devolve `reason: 'network'`. O usuário vê "sem conexão"; ninguém vê um 401.

**Impacto:** no dia do rollout do login, o overlay do desktop (inclusive a build de Steam) para de sincronizar em silêncio — e a leitura óbvia será "o login quebrou o app, desliga o login". É assim que um controle de segurança é revertido.
**Correção:** acrescentar `Authorization` ao `Access-Control-Allow-Headers` das quatro rotas **antes** de ligar o Firebase. Zero risco: `Allow-Origin: *` já impede envio de credenciais de navegador (cookies), e o Bearer é explícito.

### N-3 · ALTO (LGPD) — texto livre potencialmente sensível sai do cliente e é armazenado sem base legal declarada
`src/contexts/GameStateContext.tsx:194` (`soulGoal` no `GameState`) → `src/utils/cloudSave.ts:24` → `functions/api/save.js:62` (KV, TTL 365 dias);
`src/components/GameTutorialFlow.tsx:149` → `src/utils/taskSuggestions.ts:23` → `functions/api/suggest-tasks.js` → **Groq (EUA)**;
`src/components/CompanionHUD.tsx` → `functions/api/chat.js:96` → **Groq (EUA)**.

**Cenário concreto:** o onboarding pergunta o "porquê" e a "dificuldade" *antes de qualquer mecânica*, e o produto foi desenhado para que a pessoa responda com honestidade ("estou em depressão e não consigo levantar", "quero parar de beber"). Esse texto (a) é gravado no KV sob uma chave derivada de e-mail que hoje qualquer um resolve (ver N-1) e (b) é enviado a um processador terceiro nos EUA. Isso é **dado pessoal sensível** (LGPD art. 5º, II — saúde) tratado sem: base legal declarada, aviso de transferência internacional (art. 33), política de privacidade publicada (`STATUS.md` §3.2 marca a URL como 🔴 pendente), definição de retenção e fluxo de direitos do titular (art. 18).
**Impacto:** o achado mais caro do relatório. É também o que trava a Play Store (formulário de Segurança de Dados).
**Correção:** (1) política de privacidade + aviso no ponto de coleta com base legal (consentimento, art. 7º I, por ser sensível → art. 11 I); (2) minimizar — não enviar `soulGoal`/`soulStruggle` para o Groq (as tags de categoria já bastam para sugerir tarefa); (3) definir retenção e uma rota de exclusão de conta. ASVS V8.3.

### N-4 · MÉDIO — a allowlist de push é ampla demais e segue redirect
`functions/api/_pushTargets.js:21-26` e `workers/webpush.js:107`

**Cenário:** o atacante registra 10.000 subscriptions com `endpoint = https://storage.googleapis.com/<qualquer-coisa>` (passa em `:45` porque o sufixo aceito é o `googleapis.com` inteiro). O cron (`push-scheduler.js`) passa a emitir 4 POSTs/dia × 10.000, por até um ano, cada um carregando um JWT VAPID assinado pela chave de produção. Variante: um endpoint legítimo que responda 302 leva o `fetch` (redirect `follow`) para fora da allowlist.
**Impacto:** relay/amplificação a partir da nossa infra + consumo do orçamento de Workers. Não é RCE nem leitura de dado; é a classe que a auditoria anterior excluiu por filtro ("sem DoS"), e é justamente por isso que aparece aqui.
**Correção:** trocar `googleapis.com` por `fcm.googleapis.com`; `redirect: 'manual'` no `fetch` de `webpush.js:107`; e limitar subscriptions por origem/IP na entrada (`subscribe.js`).

### N-5 · MÉDIO — PII do oráculo sai do aparelho via backup automático do Android
`android/app/src/main/AndroidManifest.xml:6` → `android:allowBackup="true"`, sem `fullBackupContent` nem `dataExtractionRules`.

**Cenário:** `soulmon-profile` (nome completo, data, **hora** e **local de nascimento** — `src/components/SoulmonOnboarding.tsx:148`) vive no `localStorage` do WebView. Com `allowBackup="true"` e sem regra de exclusão, o Android Auto Backup sobe o diretório de dados do app para o Google Drive do usuário; em aparelho com depuração habilitada, `adb backup -f x.ab com.hexervoodoom.soulmon` extrai o mesmo arquivo sem root.
**Impacto:** a garantia "a PII do oráculo não sai do cliente" **é falsa no APK**. Quatro campos que, juntos, são identificação civil direta.
**Correção:** `android:allowBackup="false"` (o save já é sincronizado por conta) ou `dataExtractionRules` excluindo o diretório do WebView. ASVS V8.1 / LGPD art. 46.

### N-6 · MÉDIO — origem compartilhada com o DigiApp é uma fronteira de confiança inexistente
`capacitor.config.json` (`server.url: https://digiapp-a5e.pages.dev`), `desktop/electron/main.js:26`, `docs/SEPARACAO-DIGIAPP.md`.

**Cenário:** Soulmon e DigiApp servem da **mesma origem**. Origem é a fronteira de segurança da web: qualquer script publicado no Pages do DigiApp lê o `localStorage` do Soulmon inteiro — incluindo `soulmon-profile` (a PII do oráculo) e o ID token do Firebase — e controla o mesmo Service Worker (`public/sw.js`). Não há atacante externo aqui: há **dois produtos com o mesmo raio de explosão** e um deles fora deste repositório.
**Impacto:** todo o argumento "a PII fica no cliente" vale só para *este* código; um deploy do outro produto o invalida sem que ninguém aqui saiba.
**Correção:** é o passo 1 de `docs/SEPARACAO-DIGIAPP.md` — projeto Pages próprio. Enquanto não acontecer, isso é risco aceito e deve estar escrito como tal (está, abaixo).

### N-7 · BAIXO — sem Content-Security-Policy
`public/_headers` traz `X-Content-Type-Options`, `X-Frame-Options` e `Referrer-Policy`, mas **não** `Content-Security-Policy` nem `Strict-Transport-Security`.
**Cenário:** o app renderiza texto de LLM e texto do próprio usuário; hoje o React escapa, mas o único `dangerouslySetInnerHTML` da árvore (`src/components/ui/chart.tsx:83`) mostra que o padrão não é garantido por construção. Sem CSP, um único XSS lê o ID token e a PII do oráculo do `localStorage`.
**Correção:** CSP com `default-src 'self'`, `connect-src` limitado a self + Firebase, `object-src 'none'`, `frame-ancestors 'none'`. É a defesa em profundidade mais barata disponível. ASVS V14.4.

### Observações (sem cenário de exploração — para o `qa-sweeper`, não são achados de segurança)
- `desktop/renderer/src/cloudSync.ts:240` faz `POST ${APP_URL}/api/save` **sem `?id=`**, mas `functions/api/save.js:28` só lê o id da query string → `400 Invalid save ID`. A escrita do overlay para a nuvem parece nunca funcionar. Bug funcional, exatamente o footgun "regra copiada" do `CLAUDE.md` item 9.
- `functions/api/fcm-subscribe.js` não valida nem autentica nada: qualquer um grava linhas `fcm:` arbitrárias (custo de KV) e, conhecendo um token, apaga a inscrição alheia via DELETE. Baixo, mas é a mesma classe do SEC-5 sem a allowlist correspondente.
- `public/sw.js:159` usa `client.url.includes(self.location.origin)` — `includes` em vez de `startsWith`. Sem impacto prático aqui; corrigir por higiene.

---

## 4. Superfícies novas auditadas

**Service Worker (`public/sw.js`).** Escopo bem contido: só GET, só *same-origin* (`:41`), e `/api/*` explicitamente **nunca** cacheado (`:45`) — o que evita servir um cloud save obsoleto por cima do estado local, que seria uma corrupção de dados com cara de bug. O handler de `message` (`:123`) aceita `SHOW_NOTIFICATION` de qualquer cliente da origem sem checar `event.origin`, o que só importa por causa do N-6 (origem compartilhada): no DigiApp, uma página dele consegue disparar notificação com a marca do Soulmon. O `push` handler (`:138`) só renderiza `title`/`body`, sem navegação controlada por payload — correto. Nada aqui é achado isolado.

**Overlay Electron (`desktop/`).** É a superfície mais bem configurada do projeto: `contextIsolation: true` e `nodeIntegration: false` nas três janelas (`main.js:139-141`, `:183-185`, `:248-249`), preloads expondo APIs nominais e não `ipcRenderer` cru (`preload.js`, `auth-preload.js`), token só em memória (`main.js:43`) e nunca em disco. O que **falta** é o cerco da janela remota: `openFullApp` (`main.js:241-254`) carrega um site externo com o `auth-preload` anexado e **sem** `setWindowOpenHandler` nem handler de `will-navigate`. Se aquela janela navegar para fora do domínio (link, redirect, comprometimento do Pages compartilhado — N-6), a página de destino herda `window.soulmonDesktopAuth.publish()`. Como o canal é só de saída, o dano é "plantar um token no processo principal", não ler um — mas o certo é travar navegação ao host esperado. Some-se o N-2, que quebra a autenticação desta superfície justamente no rollout.

**Android (`android/`).** Manifesto limpo no essencial: permissões mínimas (INTERNET, POST_NOTIFICATIONS, SCHEDULE_EXACT_ALARM, BOOT_COMPLETED), `FileProvider` com `exported="false"`, `AlarmReceiver` não exportado, `BootReceiver` exportado só pelo broadcast do sistema. Os 5 `AppWidgetProvider` são `exported="true"` por exigência do framework e só respondem a `APPWIDGET_UPDATE` — nada sensível. `google-services.json` commitado é correto (chave restrita por pacote, não é segredo). **Não há deep link nem `assetlinks`** configurado (o `ASSETLINKS_*` de `STATUS.md` §3.2 ainda é pendência), então não existe superfície de intercepção de link hoje — e quando existir, precisa nascer com verificação de App Links, não com filtro de intent aberto. O único achado é o N-5 (`allowBackup`). Nota: o APK carrega a URL remota (`server.url`), então **toda a superfície web acima também é a superfície do app Android**.

**Worker de push (`workers/`).** `push-scheduler.js:110` revalida a allowlist na saída e **apaga** as linhas ilegais do KV — decisão de desenho correta e rara (fecha o legado, não só o futuro). `webpush.js` implementa VAPID/RFC 8291 com chave privada vinda de secret, sem log de payload. O worker **não** tem deploy automático (`wrangler deploy` manual), o que é uma armadilha de processo: uma correção feita aqui em `_pushTargets.js` só vale na borda quando alguém lembrar de redeployar o worker — e nada no CI avisa. Resta o N-4 (sufixo amplo + redirect seguido) e o endereço de contato VAPID ainda apontando para `contact@digiapp.app`.

---

## 5. Veredito de privacidade sobre a PII do oráculo

**A afirmação de `STATUS.md` §1.3 está correta no código web e incorreta no APK.**

Verificado por rastreamento completo dos identificadores `fullName`/`birthDate`/`birthTime`/`birthPlace`/`SOULMON_PROFILE` em todo `src/`:
- Gravados em `localStorage` em `SoulmonOnboarding.tsx:148` e `OraclePage.tsx:84`.
- Consumidos **só** por `generateOracle` (`utils/oracle.ts:2515+`), que roda no cliente e devolve `seed` + criatura.
- `App.tsx:1338-1349` lê o perfil e regrava **apenas** `{...saved, seed}`.
- **Nenhuma ocorrência** dentro do `GameState` (`GameStateContext.tsx`), de `cloudSave.ts`, de `/api/save`, de `/api/chat`, de `/api/community`, de telemetria ou de `console.log`. O único lugar onde o nome completo aparece fora do cliente é `src/utils/oracle.test.ts` (dados fictícios).

**Porém**, três caminhos derrubam a garantia na prática, e nenhum é código do oráculo: **N-5** (backup automático do Android exporta o `localStorage` para o Google Drive), **N-6** (a origem compartilhada com o DigiApp dá acesso de leitura a qualquer script daquele produto) e **N-7** (sem CSP, um XSS lê tudo). Some-se **N-3**: a PII do oráculo fica, mas o texto livre do "porquê"/"dificuldade" — que pode ser mais sensível que a data de nascimento — **vai para o servidor e para os EUA**.

Veredito: *"a PII do oráculo não sai do cliente"* deve ser reescrito como **"não sai do cliente pelo código do app; sai pelo backup do Android e é legível por qualquer código servido na origem compartilhada"**. Manter a regra e fechar N-5 e N-6.

---

## 6. Riscos residuais — nomeados, com o dono e o motivo

| # | Risco | Aceitável? | Motivo |
|---|---|---|---|
| R-1 | **Modo aberto de `_auth.js` (N-1)** — sem `FIREBASE_PROJECT_ID`, e-mail = takeover | **Não.** Defensável só como janela de migração *curta e datada* | Já está documentado desde antes desta rodada, o que virou familiaridade em vez de urgência. É o item que sozinho reduz mais raio de explosão. **Dono: operador** (§3.1). Precisa de data, não de "quando der". |
| R-2 | **`claimOrder` sem D1 (SEC-3)** | **Não, a partir do dia do lançamento** | Hoje o billing responde 503 e o risco é zero; no minuto em que `GOOGLE_PLAY_SERVICE_ACCOUNT` for configurado, é 1 recibo → N contas pagas. Aceitar exige promover o D1 de 🟡 para 🔴 e amarrá-lo ao mesmo checklist da chave de billing. **Dono: operador.** |
| R-3 | **Keystores no histórico do git** (§1.4) | Aceitável **só** enquanto o repositório for privado E as chaves não assinarem nada publicado | Continua em aberto e sem decisão desde a auditoria anterior. Se o repo virar público um dia, o risco é retroativo e irreversível. **Dono: operador.** |
| R-4 | **Origem compartilhada com o DigiApp (N-6)** | Aceitável enquanto o DigiApp for do mesmo dono e não receber deploy de terceiro | É risco de *governança*, não técnico: depende de ninguém publicar código não revisado no outro projeto. Vira inaceitável no instante em que alguém de fora tocar naquele Pages. |
| R-5 | **Emblemas/Bits no save do cliente** (§4) | Aceitável, e a condição já está travada por teste | Só cosmético. A disciplina existente (teste que cai se um item de Torneio virar vantagem) é a implementação correta desse risco aceito — é assim que um risco aceito deve ser: com gatilho automático de reavaliação. |
| R-6 | **Corrida no `spendCredits`** (§4) | Aceitável | Só cobra a menos do jogador; não cunha crédito (`_entitlements.js:83` valida inteiro positivo). Cai junto com R-2 se o módulo migrar para D1/DO. |
| R-7 | **`redirect: follow` + `googleapis.com` amplo (N-4)** | Aceitável até o lançamento, com teto de custo | É DoS/custo, não confidencialidade. Mas a correção é de duas linhas — aceitar isso custa mais em explicação do que em conserto. |
| R-8 | **Sem rate limit em `/api/community` e `/api/subscribe`** | Aceitável **e explicitamente registrado** | A auditoria anterior excluiu essa classe por filtro. Registro aqui para que a ausência seja uma **decisão**, não um esquecimento: `players`/`opponents` fazem até 300 leituras de KV por chamada sem custo para o chamador, e `subscribe` grava sem teto. Reavaliar quando houver usuário real. |
| R-9 | **Reroll pago com resultado aleatório** (§3.1, ECA Digital) | Fora do meu escopo (produto/jurídico), mas **não pode seguir silencioso** | Já está nomeado em §3.1; mantenho aqui só para não sumir da lista consolidada de risco residual. |

---

## 7. O único controle que mais reduz o raio de explosão

**Ligar `FIREBASE_PROJECT_ID` — depois de fechar o N-2 (`Authorization` no CORS).**
Nesta ordem, e só nesta. Fora dela, o rollout quebra o desktop em silêncio e o
controle é revertido por quem estiver de plantão. Com ela, SEC-1 deixa de ser
teoria, `/api/save` deixa de ser aberto por e-mail, e a cota por conta do
`_aiGuard.js` passa a valer de verdade.

**Ordem sugerida:** N-2 → `FIREBASE_PROJECT_ID` → N-5 (`allowBackup`) → N-3
(política de privacidade + parar de mandar texto livre ao Groq) → D1 `order_claims`
+ `PLAY_REQUIRE_ACCOUNT_BINDING` **antes** de qualquer chave de billing → N-4/N-7.
