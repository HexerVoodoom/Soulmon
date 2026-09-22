# Lançamento na Google Play — checklist do que é do dono, passo a passo

> **Para que serve:** decisão #16 do dono (21/09/2026, `docs/PERGUNTAS-DO-DONO.md`):
> *"preparar tudo do lado da squad; o dono executa o console"*. Este arquivo é a
> parte "o dono executa": cada passo com a URL, onde clicar, o que colar (e de qual
> arquivo), e **como saber que ficou feito**. A ficha para colar está em
> [`PLAY-FICHA.md`](PLAY-FICHA.md); o formulário de Segurança de Dados em
> [`PLAY-DATA-SAFETY.md`](PLAY-DATA-SAFETY.md); os produtos em
> [`BILLING-SETUP.md`](BILLING-SETUP.md).
>
> **Etiquetas por passo:**
> - `[dono digita segredo]` — senha, chave, JSON de conta de serviço, keystore,
>   cartão. A squad **nunca** digita nem lê isso; nem por Chrome, nem por chat.
> - `[submissão: confirmar]` — botão irreversível (enviar para revisão, publicar,
>   criar produto, pagar). A squad para **antes** do clique e espera um "sim" seu.
> - `[squad pode dirigir o Chrome]` — texto público (ficha, questionário, URLs),
>   navegação e conferência. Exige a extensão *Claude in Chrome* conectada na SUA
>   sessão logada; a squad enxerga a tela e preenche, você confirma cada envio.
>
> **Regra que vale para tudo aqui:** nada afirmado sobre política do Google sem
> fonte no repo. Onde a fonte é o próprio console, está `[a confirmar no Play Console]`.
>
> **Atualizado em:** 21/09/2026 (QA geral, etapa 4). Estado do que já está feito:
> `docs/STATUS.md` §3.2.

---

## 0. O que já está pronto do lado da squad (não precisa fazer nada)

| Peça | Onde | Prova |
|---|---|---|
| `applicationId` próprio | `android/app/build.gradle` › `com.hexervoodoom.soulmon` | `grep applicationId android/app/build.gradle` |
| `versionCode 15` / `versionName "1.1.4"` | `android/app/build.gradle` | primeiro bundle com WP0.6 (`setObfuscatedAccountId`), WP5.8 (preço da Play), WP2.6 (widget) |
| `targetSdk`/`compileSdk` 36 | `android/variables.gradle` | `[verificar no android-build.yml do CI após o merge]` — ver §G |
| Workflow que gera o **AAB assinado** quando os 4 secrets existirem | `.github/workflows/android-build.yml` › "Build signed release bundle (.aab)" | artefato `soulmon-release-<sha>` |
| Política de privacidade + exclusão de conta no ar | `https://soulmon.mateus-sprnd.workers.dev/privacidade.html` (`#exclusao`) | abrir a URL |
| Termos com cláusula de IA/crise (§8, versão 2026-09-21) | `public/termos.html` | abrir `/termos.html` |
| Login Firebase (`soulmon-app`) ligado no servidor | `wrangler.jsonc` › `vars.FIREBASE_PROJECT_ID` | STATUS §3.1 ✅ |
| Binding D1 `DB` → `soulmon-billing` + migrações versionadas | `wrangler.jsonc`, `migrations/0001`, `0002` | falta **aplicar** (§E.4) |
| Catálogo de 4 produtos no servidor e no cliente | `functions/api/_billing.js` › `PRODUCTS`; `src/utils/monetization.ts` | IDs em §D.7 |
| Ficha PT/EN, IARC, IA, roteiro de arte | `docs/PLAY-FICHA.md` | — |
| Formulário de Segurança de Dados respondido | `docs/PLAY-DATA-SAFETY.md` §3 (lista-resumo) | — |

**O que a squad NÃO conseguiu fechar e por quê** está em §H.

---

## A. Ordem geral (a que evita ficar fora do ar)

`docs/STATUS.md` §3.4 diz: nada de mexer em `server.url` antes de o destino existir.
Hoje o destino **já existe** (`soulmon.mateus-sprnd.workers.dev` é a produção e o
`capacitor.config.json` já aponta para ela — `src/deploy/appUrl.contract.test.ts`),
então a ordem para a Play é:

1. **§B GitHub** — keystore → o CI passa a produzir `app-release.aab`.
2. **§C Firebase** — registrar o pacote → `google-services.json` novo → push do FCM.
3. **§E.1–E.3 Cloudflare (parte 1)** — secrets que não dependem da Play
   (`METRICS_ADMIN_KEY`, `ENTITLEMENTS_ADMIN_KEY`, `COURTESY_MAX_ACCOUNTS`,
   `SEASON_ADMIN_KEY` + deploy do worker de push) e **§E.4** migrações D1.
4. **§D Play Console** — app, ficha, conteúdo, produtos, API, App Signing, teste
   interno, produção.
5. **§E.5 Cloudflare (parte 2)** — o que só existe depois da Play:
   `GOOGLE_PLAY_SERVICE_ACCOUNT`, `ANDROID_PACKAGE_NAME`, `ASSETLINKS_SHA256`.
6. **§E.6** — `PLAY_REQUIRE_ACCOUNT_BINDING=true` **só depois** de o AAB 15 estar
   publicado (produção ou teste com os testadores que vão comprar). Antes disso
   ele recusa toda compra.

Fazer 6 antes de 4 = nenhuma compra é concedida. Fazer 4 antes de 1 = não há AAB
para subir. O resto pode ser em paralelo.

---

## B. GitHub — keystore e o AAB assinado

Fonte: o comentário "COMO LIGAR (dono)" dentro de `.github/workflows/android-build.yml`.

### B.1 Gerar a keystore na SUA máquina `[dono digita segredo]`

```
keytool -genkeypair -v -keystore soulmon-release.jks -keyalg RSA -keysize 4096 -validity 10000 -alias soulmon
```

- Guarde o `.jks` **e** as duas senhas num gerenciador de senhas. **Perder =
  nunca mais atualizar o app publicado** (com Play App Signing dá para trocar a
  chave de *upload* por formulário — STATUS §3.1 —, mas só se a conta da Play for sua).
- **Nunca** no repo (`android/.gitignore` já ignora `*.jks`), nunca no chat, nunca
  colado numa aba do Chrome que a squad esteja dirigindo.

### B.2 Converter para base64 `[dono digita segredo]`

```
# PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("soulmon-release.jks")) > ks.txt
```

### B.3 Criar os 4 secrets `[dono digita segredo]`

URL: `https://github.com/HexerVoodoom/Soulmon/settings/secrets/actions` → **New
repository secret**, um por vez:

| Nome (exato) | Conteúdo | O que é |
|---|---|---|
| `ANDROID_KEYSTORE_BASE64` | o conteúdo de `ks.txt` | a keystore inteira, em texto |
| `ANDROID_KEYSTORE_PASSWORD` | senha do `-keystore` | abre o arquivo |
| `ANDROID_KEY_ALIAS` | `soulmon` (se seguiu o comando) | qual chave dentro do arquivo |
| `ANDROID_KEY_PASSWORD` | senha da chave | abre a chave |

O workflow lê os quatro e passa para o Gradle como `RELEASE_STORE_FILE`,
`RELEASE_STORE_PASSWORD`, `RELEASE_KEY_ALIAS`, `RELEASE_KEY_PASSWORD`
(`android/app/build.gradle` › `signingConfigs.release`). Apague `ks.txt` depois.

### B.4 Disparar o build e pegar o AAB

URL: `https://github.com/HexerVoodoom/Soulmon/actions/workflows/android-build.yml`
→ **Run workflow** (branch `main`) — ou espere o próximo push da `main`.

**Feito quando:** o run tem o passo *"Build signed release bundle (.aab)"* verde
(não "pulando o bundle assinado") **e** o artefato `soulmon-release-<sha>` aparece
na página do run. Baixe o `.zip`; dentro está `app-release.aab`. É esse arquivo que
sobe na Play (§D.9).

> ⚠️ Se o passo *"Build debug APK"* falhar depois do merge desta rodada, o suspeito
> nº 1 é o `compileSdk 36` (§G). Não volte para 35 sem ler §G.

---

## C. Firebase — registrar `com.hexervoodoom.soulmon`

Fonte: `docs/BILLING-SETUP.md` › "AÇÃO NECESSÁRIA"; `docs/manual/08-INTEGRACOES-E-DEPLOY.md` §2.6.

### C.1 Adicionar o app Android no projeto `soulmon-app` `[squad pode dirigir o Chrome]` `[submissão: confirmar]`

URL: `https://console.firebase.google.com/project/soulmon-app/settings/general`
→ role até **Seus apps** → **Adicionar app** → ícone do Android.

| Campo | Valor |
|---|---|
| Nome do pacote Android | `com.hexervoodoom.soulmon` (confira contra `android/app/build.gradle` › `applicationId` — é o **real**, não `com.digipartner.digiapp`) |
| Apelido do app | `Soulmon Android` |
| Certificado SHA-1 de depuração | deixe vazio agora; o SHA-256 da chave de assinatura da Play entra em §D.10 `[a confirmar se o login por Google no APK exige]` |

**Registrar app** é a submissão. Depois: **Fazer o download do `google-services.json`**.

### C.2 Trocar o arquivo no repo

- Substituir `android/app/google-services.json` (hoje é do projeto `digiapp-88296`,
  com clients `com.digiapp.app` e `com.digipartner.digiapp` — review 15 §B). O arquivo
  **não é segredo** (a API key ali é restrita por pacote — manual 08 §2.6) e **é
  commitado**. Você pode colar o arquivo na pasta e pedir para a squad commitar, ou
  commitar você.
- **Enquanto não trocar, o build passa mesmo assim**: `android/app/build.gradle`
  faz parse do JSON e só aplica o plugin `com.google.gms.google-services` se houver
  um `client` com o nosso `applicationId`; senão emite `logger.warn(...)` e segue
  **sem FCM** — o push nativo do Android fica morto, o Web Push continua. Ou seja:
  este passo **não bloqueia** o AAB, bloqueia só o push do APK.

**Feito quando:** `grep -c '"package_name": "com.hexervoodoom.soulmon"' android/app/google-services.json`
→ `1`, e o próximo run do `android-build.yml` **não** mostra o warning
`google-services.json não tem client pra 'com.hexervoodoom.soulmon'` no log do Gradle.

### C.3 Conta de serviço do FCM no worker (se ainda não existir) `[dono digita segredo]`

URL: `https://console.firebase.google.com/project/soulmon-app/settings/serviceaccounts/adminsdk`
→ **Gerar nova chave privada** → JSON. Depois, na sua máquina, dentro de `workers/`:

```
cd workers && npx wrangler secret put FIREBASE_SERVICE_ACCOUNT
```

(cole o JSON inteiro em uma linha). **Feito quando:** `cd workers && npx wrangler secret list`
lista `FIREBASE_SERVICE_ACCOUNT`. Sem isso o cron pula o canal FCM (manual 08 §2.6).

---

## D. Play Console

URL base: `https://play.google.com/console/`. Os endereços internos têm um número de
app que só existe depois de D.1 — por isso abaixo está o **caminho pelo menu lateral**.

### D.1 Criar o app `[squad pode dirigir o Chrome]` `[submissão: confirmar]`

**Todos os apps → Criar app.**

| Campo | Valor | Fonte |
|---|---|---|
| Nome do app | `Soulmon` | `PLAY-FICHA.md` §0 |
| Idioma padrão | **Inglês (Estados Unidos)** | `PLAY-FICHA.md` §0 (inglês é a base) |
| App ou jogo | **Jogo** `[a confirmar no Play Console]` — a categoria de loja "Estilo de vida" existe nos dois ramos? Se só em "App", escolha App | `PLAY-FICHA.md` §4, primeira linha |
| Gratuito ou pago | **Gratuito** (compras dentro do app) | irreversível: app pago não volta a ser gratuito |
| Declarações (Diretrizes, leis dos EUA) | marcar | — |

**Feito quando:** o painel do app abre com o nome `Soulmon`.

### D.2 Ficha principal da loja `[squad pode dirigir o Chrome]`

**Crescer › Presença na loja › Ficha principal da loja.**

1. Idioma **en-US** (padrão): colar de `PLAY-FICHA.md` §2 — Title (2.1), Short
   description (2.2), Full description (2.3).
2. **Gerenciar traduções → Adicionar idioma → Português (Brasil)**: colar §1.1, §1.2, §1.3.
3. Gráficos: ícone 512×512, feature graphic 1024×500, 8 screenshots de telefone — por
   idioma (PT e EN). Ainda **não existem**: são os pedidos de `PLAY-FICHA.md` §6 à
   `squad-arte`. A ficha pode ser salva sem eles, mas **não é enviável**.

**Feito quando:** "Salvar" sem erro nos dois idiomas; o rascunho mostra 0 erros na
seção de texto (gráficos podem ficar pendentes até a arte chegar).

### D.3 Detalhes do contato e categoria `[squad pode dirigir o Chrome]`

**Crescer › Presença na loja › Configurações da ficha da loja** (ou "Detalhes de
contato" — o nome do menu muda `[a confirmar no Play Console]`).

| Campo | Valor |
|---|---|
| Categoria | Estilo de vida |
| Tags | as de `PLAY-FICHA.md` §0 que existirem |
| E-mail | `mateus.sprnd@gmail.com` |
| Site | `https://soulmon.mateus-sprnd.workers.dev` |

### D.4 Conteúdo do app — política de privacidade `[squad pode dirigir o Chrome]`

**Política › Conteúdo do app › Política de privacidade** →
`https://soulmon.mateus-sprnd.workers.dev/privacidade.html` → Salvar.

**Feito quando:** a linha "Política de privacidade" no painel de Conteúdo do app
aparece como concluída. Isso fecha o 🔴 "URL da política" do STATUS §3.2.

### D.5 Conteúdo do app — as declarações `[squad pode dirigir o Chrome]` `[submissão: confirmar]` em cada "Enviar"

Na mesma tela, uma por uma:

| Seção | Resposta | Fonte |
|---|---|---|
| **Anúncios** | Não contém anúncios | `BILLING-SETUP.md` §4b |
| **Acesso ao app** | "Todas as funções acessíveis sem restrição"? **Não**: o portão de conta é a primeira tela. Escolha "Todo ou parte do app é restrito" e forneça **instruções de acesso**: um e-mail + senha de teste criados no Firebase Auth (`[dono digita segredo]` — crie uma conta só para o revisor e não a reutilize) | `PLAY-DATA-SAFETY.md` §2.1 ("o portão de conta é a primeira tela") |
| **Classificação de conteúdo** (IARC) | responder com `PLAY-FICHA.md` §4, e-mail `mateus.sprnd@gmail.com` | — |
| **Público-alvo e conteúdo** | 18 anos ou mais; "não atrai crianças" | decisão #15; `PLAY-DATA-SAFETY.md` §0 |
| **Apps de notícias** | Não | — |
| **Rastreamento de contatos COVID / saúde** | Não é app de saúde. `ACTIVITY_RECOGNITION` é o contador de passos do aparelho, **não** Health Connect | `PLAY-DATA-SAFETY.md` §2.6 |
| **Segurança de dados** | transcrever `PLAY-DATA-SAFETY.md` §3 (a lista-resumo — é dela que se preenche), item por item. ⚠️ Antes: a `alpha-compliance` precisa acrescentar Higgsfield/Gemini em §2.3 (review 11); se ainda não estiver, declare "Outras mensagens no app: compartilhado" mesmo assim — sobredeclarar é o lado seguro | `PLAY-DATA-SAFETY.md` |
| **Apps governamentais** | Não | — |
| **Recursos financeiros** | Nenhum (compras digitais não contam aqui) | — |
| **Recursos de IA generativa** | Sim — responder com `PLAY-FICHA.md` §5 | decisão #22 |
| **Permissões sensíveis** (se pedir) | `RECORD_AUDIO` = recado falado, opcional; `ACTIVITY_RECOGNITION` = passos; `SCHEDULE_EXACT_ALARM` = lembrete na hora certa | `PLAY-DATA-SAFETY.md` §2.4 tabela de permissões |

**Feito quando:** o painel "Conteúdo do app" não tem nenhuma linha "Ação necessária".

### D.6 Configuração de monetização `[dono digita segredo]` `[submissão: confirmar]`

**Monetizar › Configurar perfil de pagamentos** — exige perfil de pagamentos do
Google com dados bancários e fiscais. **Só você.** Sem isso, D.7 não abre.

### D.7 Os 4 produtos `[squad pode dirigir o Chrome]` `[submissão: confirmar]` em cada "Criar"

**Monetizar › Produtos › Produtos no app → Criar produto.** IDs **exatos** (batem com
`functions/api/_billing.js` › `PRODUCTS` e `src/utils/monetization.ts`; `BILLING-SETUP.md` §1):

| ID do produto | Nome (en-US / pt-BR) | Tipo | Preço sugerido |
|---|---|---|---|
| `soulmon.unlock.full` | Full unlock / Desbloqueio completo | **Não consumível** (produto gerenciado, compra única) | R$ 29,90 |
| `soulmon.credits.60` | 60 credits / 60 Créditos | Consumível | R$ 4,90 |
| `soulmon.credits.150` | 150 credits / 150 Créditos | Consumível | R$ 9,90 |
| `soulmon.credits.400` | 400 credits / 400 Créditos | Consumível | R$ 19,90 |

> "Consumível" na Play é uma propriedade de **como o app trata** a compra
> (`BillingPlugin.kt` consome os pacotes de crédito); no console os quatro são
> "produtos no app" — não use assinatura para nenhum `[a confirmar no Play Console
> se o formulário pede o tipo explicitamente]`. Preço: defina em BRL e deixe a
> Play converter (WP5.8 mostra o preço localizado da própria Play no app).

Depois de criar cada um: **Ativar**. **Feito quando:** os 4 aparecem como *Ativo*.

### D.8 Acesso à API + conta de serviço `[dono digita segredo]` `[submissão: confirmar]`

Fonte: `BILLING-SETUP.md` §2.

1. **Configurações › Acesso à API** → vincular a um projeto do Google Cloud (pode
   ser o `soulmon-app` do Firebase — ele já é um projeto Cloud).
2. `https://console.cloud.google.com/iam-admin/serviceaccounts?project=soulmon-app`
   → **Criar conta de serviço** (nome `play-billing-verify`) → **Chaves → Adicionar
   chave → JSON** → o arquivo baixa. **É segredo.**
3. `https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com?project=soulmon-app`
   → **Ativar** a *Google Play Android Developer API*.
4. De volta ao Play Console, **Usuários e permissões → Convidar novo usuário** com o
   e-mail da conta de serviço → permissão do app: **Ver dados financeiros** (é o que
   `purchases.products.get` exige) + "Gerenciar pedidos e assinaturas" se pedir.

**Feito quando:** o e-mail `play-billing-verify@soulmon-app.iam.gserviceaccount.com`
aparece na lista de usuários com acesso ao app Soulmon. A propagação leva horas —
até lá `/api/billing` responde 502 `verification-failed` (esperado). O JSON vai para
o Cloudflare em §E.5.

### D.9 Teste interno — subir o AAB `[dono digita segredo]` (upload do arquivo é seu) `[submissão: confirmar]`

**Testar e lançar › Testes › Teste interno → Criar nova versão.**

1. **Assinatura de apps pela Play**: aceitar "Deixar o Google gerenciar e proteger
   a chave de assinatura" — a chave que você gerou em §B vira a chave de **upload**;
   a de assinatura nasce aqui, na Play. `[submissão: confirmar]`
2. **Upload** do `app-release.aab` do artefato `soulmon-release-<sha>` (§B.4).
3. Nome da versão: `15 (1.1.4)` já vem do AAB. Notas: "First Soulmon release." /
   "Primeira versão do Soulmon."
4. **Testadores**: lista com o seu e-mail e os dos 10 de E0 (decisão #11) que tiverem
   Android.
5. **Salvar → Revisar versão → Iniciar lançamento para teste interno.** `[submissão: confirmar]`

**Feito quando:** o link de opt-in do teste interno existe e você instala pela Play
no seu aparelho. Só a partir daqui os produtos de D.7 respondem no app.

### D.10 App Signing → `ASSETLINKS_SHA256` `[squad pode dirigir o Chrome]` (é leitura, não segredo)

**Testar e lançar › Configuração › Integridade do app › Assinatura de apps pela
Play** → "Certificado da chave de assinatura do app" → copiar a **impressão digital
do certificado SHA-256** (formato `AA:BB:…`).

- Esse valor é **público** (é o que vai em `/.well-known/assetlinks.json`). Vai para o
  Cloudflare em §E.5.
- Opcional: colar o mesmo SHA-256 em Firebase (§C.1 › app Android › Adicionar
  impressão digital) `[a confirmar se algum fluxo de login do APK exige]`.

### D.11 Licença de teste `[squad pode dirigir o Chrome]`

**Configurações › Teste de licença** → adicionar os e-mails dos testadores → resposta
"RESPOND_NORMALLY". Assim as compras dos testadores não cobram cartão
(`BILLING-SETUP.md` §6: "não use cartão real para testar").

**Feito quando:** no app instalado pelo teste interno, "Desbloqueio completo" abre a
folha da Play com o aviso de "compra de teste", e depois da compra
`Configurações › Conta e compras` mostra o tier pago. Depois, desinstale, reinstale
e teste **Restaurar compras** (`BILLING-SETUP.md` §6).

### D.12 Produção `[submissão: confirmar]`

**Testar e lançar › Produção → Criar nova versão** com o **mesmo** AAB → países
(Brasil + o que quiser) → **Enviar para revisão**. É irreversível: a partir daqui o
app é público quando o Google aprovar.

**Pré-condições, todas:** D.2 com gráficos, D.5 sem "Ação necessária", D.7 ativos,
D.11 testado. E **só depois** de aprovado e no ar: §E.6.

---

## E. Cloudflare — secrets, worker de push, D1

> ⚠️ **É um Worker, não Pages.** O `wrangler.jsonc` da raiz chama-se `soulmon` e a
> produção é `soulmon.mateus-sprnd.workers.dev`. Os docs mais antigos dizem "Pages" e
> "Settings → Environment variables"; o caminho hoje é **Workers & Pages → soulmon →
> Settings → Variables and Secrets**, ou `npx wrangler secret put` na raiz do repo
> (logado com `npx wrangler login`).
>
> ⚠️ **Variável comum some no próximo deploy** — o comentário em `wrangler.jsonc` ›
> `vars` explica: o conteúdo do arquivo substitui as vars do painel a cada deploy.
> Por isso **tudo abaixo entra como SECRET** (secret sobrevive ao deploy), mesmo o
> que não é segredo (`ANDROID_PACKAGE_NAME`, `ASSETLINKS_*`, `PLAY_REQUIRE_ACCOUNT_BINDING`).
> O código lê `env.X` do mesmo jeito.

Comando-padrão (na raiz do repo; o valor é pedido no prompt, nunca vai na linha):

```
npx wrangler secret put <NOME>
```

Conferir: `npx wrangler secret list` (mostra nomes, nunca valores).

### E.1 Secrets que não dependem da Play `[dono digita segredo]`

| Nome | Valor | Sintoma sem ele | Fonte |
|---|---|---|---|
| `METRICS_ADMIN_KEY` | uma string longa aleatória (`openssl rand -hex 32`) | `/api/metrics` responde **404**; ninguém lê a métrica-norte | `functions/api/metrics.js` › `onRequestGet`; STATUS §3.2 🟡; decisão #18 |
| `ENTITLEMENTS_ADMIN_KEY` | outra string longa aleatória (**não** reutilize a de cima) | a rota de cortesia (`/api/entitlements?action=grant`) não existe (404) | `functions/api/entitlements.js` › `handleGrant`; decisão #12 |
| `COURTESY_MAX_ACCOUNTS` | `10` (os 10 de E0) — o padrão do código vale se ausente | teto padrão de `functions/api/_entitlements.js` › `COURTESY_MAX_ACCOUNTS` | decisão #12 |
| `SEASON_ADMIN_KEY` (raiz) | string aleatória — **o MESMO valor** vai no worker em E.2 | `closeSeason` responde 401 | `functions/api/community.js` › `closeSeason` |

**Feito quando:** `npx wrangler secret list` lista os 4, e
`METRICS_ADMIN_KEY=… APP_URL=https://soulmon.mateus-sprnd.workers.dev node scripts/metrics-report.mjs`
imprime o agregado (não 404). Guarde os valores no gerenciador de senhas.

### E.2 Worker de push `[dono digita segredo]`

**Não builda no push da `main`** (manual 08 §3.5). Na sua máquina:

```
cd workers
npx wrangler secret put SEASON_ADMIN_KEY      # mesmo valor de E.1
npx wrangler secret list                      # esperado: VAPID_JWK, FIREBASE_SERVICE_ACCOUNT, SEASON_ADMIN_KEY
npx wrangler deploy
```

**Feito quando:** `cd workers && npx wrangler deployments list` mostra um deploy com
data ≥ `git log -1 --format=%ci -- workers/`. Sem isso: o cron das 10h BRT do dia 1
pula o fechamento da season (log `[season] SEASON_ADMIN_KEY/APP_URL ausentes`) e o
endereço de contato do VAPID nunca chegou à borda (STATUS §3.2).

### E.3 Deploy da raiz (se você tiver mudado algo no painel) `[squad pode dirigir o Chrome]` (é só conferir)

O push da `main` publica sozinho (~2 min). Conferir:
`curl -s https://soulmon.mateus-sprnd.workers.dev/sw.js | grep -m1 CACHE_VERSION`
igual a `grep -m1 CACHE_VERSION public/sw.js`.

### E.4 Migrações D1 (SEC-3 — "um recibo, uma conta") `[submissão: confirmar]`

Na raiz, **antes** de qualquer compra real:

```
npx wrangler d1 migrations list soulmon-billing --remote
```

- Se listar `0001_order_claims.sql` e `0002_order_claims_expires_at.sql` como
  **pendentes** → `npx wrangler d1 migrations apply soulmon-billing --remote`.
- Se o `0002` falhar com *duplicate column* → ele já tinha sido aplicado à mão pelo
  caminho antigo do `migrations/README.md` (`d1 execute --file`); nesse caso está
  feito e o erro é a prova.

**Feito quando:**
`npx wrangler d1 execute soulmon-billing --remote --command "PRAGMA table_info(order_claims)"`
lista a coluna `expires_at`. Sem a tabela, `claimOrder` cai no caminho KV, não
atômico, e o mesmo recibo pode valer para N contas (STATUS §3.2 🟡).

### E.5 Secrets que dependem da Play (depois de §D.8 e §D.10) `[dono digita segredo]`

| Nome | Valor | Sintoma sem ele |
|---|---|---|
| `GOOGLE_PLAY_SERVICE_ACCOUNT` | o JSON **inteiro** da conta de serviço (D.8), em **uma linha** | `/api/billing?provider=play` → **503**, nada é concedido (proposital) |
| `ANDROID_PACKAGE_NAME` | `com.hexervoodoom.soulmon` | idem 503 |
| `ASSETLINKS_SHA256` | o SHA-256 de D.10, com os dois-pontos | `/.well-known/assetlinks.json` sem fingerprint |
| `ASSETLINKS_PACKAGE_NAME` | **não precisa**: o padrão em `functions/.well-known/assetlinks.json.js` › `DEFAULT_PACKAGE` já é o nosso | — |

**Feito quando:** `curl -s https://soulmon.mateus-sprnd.workers.dev/.well-known/assetlinks.json`
traz o pacote e o SHA-256; e uma compra de teste (D.11) devolve tier pago em
`Configurações › Conta e compras`.

### E.6 `PLAY_REQUIRE_ACCOUNT_BINDING=true` — **por último** `[dono digita segredo]` `[submissão: confirmar]`

```
npx wrangler secret put PLAY_REQUIRE_ACCOUNT_BINDING     # valor: true
```

- **Só depois** de o AAB 15 (o que manda `setObfuscatedAccountId` — WP0.6) estar
  publicado para quem vai comprar. Antes disso, toda compra vinda de um APK antigo
  é recusada (`functions/api/_billing.js` › `isPlayPurchaseBoundTo` lê
  `env.PLAY_REQUIRE_ACCOUNT_BINDING !== 'true'`).
- É o que impede um recibo de virar N contas pagas (`BILLING-SETUP.md`, STATUS §3.2 🔴).

**Feito quando:** uma compra de teste no APK 15 é concedida **e** (se você tiver um
APK antigo instalado em outro aparelho) uma compra nele é recusada com o motivo de
vínculo. Sem o segundo aparelho, o critério é só o primeiro.

---

## F. O que a squad faz com o Chrome — e o que não faz

Com a extensão *Claude in Chrome* conectada na sua sessão (instruções globais do dono
em `~/.claude/CLAUDE.md` › "Bloqueios conhecidos"):

| Faz | Não faz, mesmo que você peça |
|---|---|
| Navega até cada tela de §C/§D, preenche texto público (ficha, questionário IARC, IA, Data Safety, IDs de produto, e-mail), tira screenshot para você conferir | Digitar senha, keystore, JSON de conta de serviço, dados bancários/fiscais, cartão |
| Para **antes** de todo botão irreversível e pergunta | Clicar "Enviar para revisão", "Criar produto", "Iniciar lançamento", "Registrar app" sem o seu "sim" naquele passo |
| Confere o critério de "feito" de cada passo e registra em `docs/STATUS.md` §3.2 | Aceitar termos/contratos (Distribution Agreement, perfil de pagamentos) no seu lugar |
| Lê o SHA-256 público em D.10 e o cola em §E.5 **se você rodar o `wrangler secret put`** | Fazer login em conta nenhuma |

Cada aprovação vale para **aquele** passo — não é "pode tudo daqui em diante".

---

## G. Android — o que mudou no repo nesta rodada, e o que o CI ainda precisa provar

| Arquivo | Mudança | Prova / pendência |
|---|---|---|
| `android/app/build.gradle` | `versionCode 14 → 15`, `versionName 1.1.3 → 1.1.4`, com comentário do porquê | — |
| `android/variables.gradle` | `compileSdkVersion` e `targetSdkVersion` `35 → 36` | **`[verificar no android-build.yml do CI após o merge]`**: o AGP é 8.2.1 (`android/build.gradle`) e só avisa para compileSdk acima do que testou (já era assim com 35); o SDK 36 é baixado pelo Gradle se o `sdkmanager --licenses` do workflow tiver aceitado. Se falhar, o conserto é subir o AGP, não voltar para 35. Fonte da exigência: review 15 §B (target 36 para atualizações desde 31/08/2026; piso 35 para app novo desde nov/2025) |
| `android/app/build.gradle` › `billing-ktx` | **não mudou** (`6.2.1`); ganhou comentário | `[a confirmar no Play Console]` a versão mínima da Billing Library (review 15 §B diz ≥ 7 desde 31/08/2025, ≥ 8 desde 31/08/2026, sem fonte primária no repo). Subir exige mudar `BillingPlugin.kt` (`enablePendingPurchases()` sem argumento não existe na 7.x) — é pacote de código, não de config, e só o CI prova. **Se o upload do AAB em D.9 for recusado por versão da Billing Library, é isto.** |
| `.github/workflows/android-build.yml` | artefato `digiapp-debug-<sha>` → `soulmon-debug-<sha>` (nos dois lugares: upload e o download do job `smoke`) | — |
| `android/app/google-services.json` | **não mudou** — é do dono (§C.2) | o build passa **sem FCM** até trocar |

---

## H. Os três passos mais arriscados (leia antes de começar)

1. **§D.9 Assinatura de apps pela Play + primeiro upload.** É onde a identidade do
   app na loja nasce. A chave de upload (§B) perdida com App Signing ligado é
   recuperável por formulário; **sem** App Signing ligado, não. E o `versionCode`
   do primeiro AAB fixa o piso: nunca mais sobe um menor.
2. **§E.6 `PLAY_REQUIRE_ACCOUNT_BINDING`.** Ligado cedo demais = zero compras
   concedidas sem erro visível para você; ligado tarde demais = um recibo pode virar
   N contas (SEC-3). A ordem "AAB 15 no ar → só então ligar" não tem atalho.
3. **§D.5 Segurança de dados.** Subdeclarar é motivo de remoção depois de
   publicado, e a ficha é pública. O lado seguro é sempre declarar (é a regra de
   `PLAY-DATA-SAFETY.md` §0 e das decisões #21/#22). Há um buraco conhecido ainda
   aberto: Higgsfield/Gemini em §2.3 (review 11) — se a `alpha-compliance` não
   fechar antes de você preencher, declare "compartilhado" mesmo assim.

---

## I. O que ficou de fora desta rodada

- **Arte de loja** (ícone conferido, feature graphic, 16 screenshots): pedidos em
  `PLAY-FICHA.md` §6, à `squad-arte`. Sem eles D.2 não envia.
- **Billing Library 7/8**: só com mudança em `BillingPlugin.kt` (§G).
- **`google-services.json` novo**: é do dono (§C.2).
- **Steam** (`docs/PLANO-DESKTOP-STEAM.md` §7) e **domínio próprio** (decisão #16:
  "depois").
- **Conta de organização verificada / Fase 4 Health Connect**: não bloqueia
  (STATUS §3.2 🟠).
- **Automação do `versionCode`** no CI: continua manual (review 15 §B).
